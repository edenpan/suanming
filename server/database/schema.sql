-- 神机阁本地化数据库Schema
-- SQLite数据库结构定义

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户档案表
CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    username TEXT,
    full_name TEXT,
    birth_date TEXT,
    birth_time TEXT,
    birth_location TEXT,
    gender TEXT CHECK (gender IN ('male', 'female')),
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 命理分析记录表 (兼容现有numerology_readings表结构)
CREATE TABLE IF NOT EXISTS numerology_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    reading_type TEXT NOT NULL CHECK (reading_type IN ('bazi', 'ziwei', 'yijing', 'wuxing', 'qimen')),
    name TEXT,
    birth_date TEXT,
    birth_time TEXT,
    birth_place TEXT,
    gender TEXT,
    input_data TEXT, -- JSON格式存储输入数据
    results TEXT,    -- JSON格式存储分析结果(向后兼容)
    analysis TEXT,   -- JSON格式存储新格式分析结果
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 下载历史表
CREATE TABLE IF NOT EXISTS download_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('bazi', 'ziwei', 'yijing')),
    format TEXT NOT NULL CHECK (format IN ('markdown', 'pdf', 'png')),
    filename TEXT NOT NULL,
    file_size INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 会话表 (用于JWT token管理)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_readings_user_id ON numerology_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_readings_type ON numerology_readings(reading_type);
CREATE INDEX IF NOT EXISTS idx_readings_created_at ON numerology_readings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

-- AI解读结果表
CREATE TABLE IF NOT EXISTS ai_interpretations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    reading_id INTEGER NOT NULL, -- 直接关联到numerology_readings表的id
    content TEXT NOT NULL, -- AI解读的完整内容
    model TEXT, -- 使用的AI模型
    tokens_used INTEGER, -- 消耗的token数量
    success BOOLEAN DEFAULT 1,
    error_message TEXT, -- 如果失败，记录错误信息
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reading_id) REFERENCES numerology_readings(id) ON DELETE CASCADE,
    UNIQUE(reading_id) -- 确保1对1关系
);

-- 创建AI解读相关索引
CREATE INDEX IF NOT EXISTS idx_ai_interpretations_user_id ON ai_interpretations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interpretations_reading_id ON ai_interpretations(reading_id);
CREATE INDEX IF NOT EXISTS idx_ai_interpretations_created_at ON ai_interpretations(created_at DESC);

-- 触发器：自动更新updated_at字段
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
    AFTER UPDATE ON users
    FOR EACH ROW
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_user_profiles_timestamp 
    AFTER UPDATE ON user_profiles
    FOR EACH ROW
    BEGIN
        UPDATE user_profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_numerology_readings_timestamp 
    AFTER UPDATE ON numerology_readings
    FOR EACH ROW
    BEGIN
        UPDATE numerology_readings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_ai_interpretations_timestamp 
    AFTER UPDATE ON ai_interpretations
    FOR EACH ROW
    BEGIN
        UPDATE ai_interpretations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- 清理过期会话的触发器
CREATE TRIGGER IF NOT EXISTS cleanup_expired_sessions
    AFTER INSERT ON user_sessions
    FOR EACH ROW
    BEGIN
        DELETE FROM user_sessions WHERE expires_at < datetime('now');
    END;

-- AI API 访问限制表
CREATE TABLE IF NOT EXISTS ai_api_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    ip_address TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    request_date DATE NOT NULL,
    request_count INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(ip_address, request_date) -- 每个IP每天一条记录
);

-- 创建AI访问限制相关索引
CREATE INDEX IF NOT EXISTS idx_ai_api_usage_ip ON ai_api_usage(ip_address);
CREATE INDEX IF NOT EXISTS idx_ai_api_usage_date ON ai_api_usage(request_date);
CREATE INDEX IF NOT EXISTS idx_ai_api_usage_ip_date ON ai_api_usage(ip_address, request_date);

-- 触发器：自动更新ai_api_usage的updated_at字段
CREATE TRIGGER IF NOT EXISTS update_ai_api_usage_timestamp
    AFTER UPDATE ON ai_api_usage
    FOR EACH ROW
    BEGIN
        UPDATE ai_api_usage SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;