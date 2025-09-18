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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ai_api_usage_ip ON ai_api_usage(ip_address);
CREATE INDEX IF NOT EXISTS idx_ai_api_usage_date ON ai_api_usage(request_date);
CREATE INDEX IF NOT EXISTS idx_ai_api_usage_ip_date ON ai_api_usage(ip_address, request_date);

-- 触发器：自动更新updated_at字段
CREATE TRIGGER IF NOT EXISTS update_ai_api_usage_timestamp 
    AFTER UPDATE ON ai_api_usage
    FOR EACH ROW
    BEGIN
        UPDATE ai_api_usage SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;