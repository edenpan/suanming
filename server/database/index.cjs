const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseManager {
  constructor() {
    this.db = null;
    
    // 检测Koyeb环境并使用正确的挂载路径
    const isKoyeb = process.env.KOYEB_APP_NAME || process.env.KOYEB_SERVICE_NAME || fs.existsSync('/workspace/data');
    
    if (isKoyeb) {
      // Koyeb环境：Volume挂载到/workspace/data
      this.dbPath = '/workspace/data/numerology.db';
    } else if (process.env.NODE_ENV === 'production') {
      // 其他生产环境：使用/app/data
      this.dbPath = '/app/data/numerology.db';
    } else {
      // 开发环境：使用本地路径
      this.dbPath = path.join(__dirname, '../../numerology.db');
    }
    
    this.schemaPath = path.join(__dirname, 'schema.sql');
    
    // 输出数据库配置信息
    console.log(`🗄️ 数据库路径: ${this.dbPath}`);
    console.log(`🌍 运行环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 数据库文件: ${path.basename(this.dbPath)}`);
    console.log(`🏢 Koyeb环境: ${isKoyeb ? 'Yes' : 'No'}`);
    console.log(`📁 工作目录: ${process.cwd()}`);
  }

  // 初始化数据库连接
  init() {
    try {
      // 确保数据库目录存在
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log(`📁 创建数据库目录: ${dbDir}`);
      } else {
        console.log(`📁 数据库目录已存在: ${dbDir}`);
      }
      
      // 创建或连接到SQLite数据库
      this.db = new Database(this.dbPath);
      
      // 启用外键约束
      this.db.pragma('foreign_keys = ON');
      
      // 设置WAL模式以提高并发性能
      this.db.pragma('journal_mode = WAL');
      
      // 初始化数据库结构
      this.initializeSchema();
      
      console.log('数据库初始化成功');
      return this.db;
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw error;
    }
  }

  // 初始化数据库结构
  initializeSchema() {
    try {
      // 首先检查是否需要迁移ai_interpretations表
      this.migrateAiInterpretationsTable();
      
      // 检查并迁移numerology_readings表以支持qimen类型
      this.migrateQimenSupport();
      
      const schema = fs.readFileSync(this.schemaPath, 'utf8');
      
      // 直接执行整个schema文件
      this.db.exec(schema);
      
      console.log('数据库结构初始化完成');
    } catch (error) {
      console.error('数据库结构初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 迁移ai_interpretations表结构
   * 将旧的analysis_id字段迁移为reading_id字段，建立正确的外键关系
   */
  migrateAiInterpretationsTable() {
    let transaction;
    try {
      // 检查ai_interpretations表是否存在且使用旧的analysis_id字段
      const tableInfo = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='ai_interpretations'
      `).get();
      
      if (!tableInfo) {
        console.log('ai_interpretations表不存在，跳过迁移');
        return;
      }
      
      // 检查是否有analysis_id字段（旧结构）
      const columnInfo = this.db.prepare(`
        PRAGMA table_info(ai_interpretations)
      `).all();
      
      const hasAnalysisId = columnInfo.some(col => col.name === 'analysis_id');
      const hasReadingId = columnInfo.some(col => col.name === 'reading_id');
      
      if (!hasAnalysisId || hasReadingId) {
        console.log('ai_interpretations表结构已是最新，跳过迁移');
        return;
      }
      
      console.log('检测到旧的ai_interpretations表结构，开始迁移...');
      
      // 开始事务
      transaction = this.db.transaction(() => {
        // 创建新表结构
        this.db.exec(`
          CREATE TABLE ai_interpretations_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            reading_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            model TEXT,
            tokens_used INTEGER,
            success BOOLEAN DEFAULT 1,
            error_message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (reading_id) REFERENCES numerology_readings(id) ON DELETE CASCADE,
            UNIQUE(reading_id)
          )
        `);
        
        // 检查有多少条记录需要迁移
        const countStmt = this.db.prepare(`
          SELECT COUNT(*) as count FROM ai_interpretations 
          WHERE analysis_id GLOB '[0-9]*'
        `);
        const { count } = countStmt.get();
        console.log(`准备迁移 ${count} 条有效记录`);
        
        // 迁移数据（只迁移数字ID的记录）
        const migrateStmt = this.db.prepare(`
          INSERT INTO ai_interpretations_new 
          (user_id, reading_id, content, model, tokens_used, success, error_message, created_at, updated_at)
          SELECT user_id, CAST(analysis_id AS INTEGER), content, model, tokens_used, success, error_message, created_at, updated_at
          FROM ai_interpretations 
          WHERE analysis_id GLOB '[0-9]*'
        `);
        const migrateResult = migrateStmt.run();
        console.log(`成功迁移 ${migrateResult.changes} 条记录`);
        
        // 删除旧表，重命名新表
        this.db.exec('DROP TABLE ai_interpretations');
        this.db.exec('ALTER TABLE ai_interpretations_new RENAME TO ai_interpretations');
        
        // 重新创建索引
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_ai_interpretations_user_id ON ai_interpretations(user_id)');
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_ai_interpretations_reading_id ON ai_interpretations(reading_id)');
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_ai_interpretations_created_at ON ai_interpretations(created_at DESC)');
      });
      
      // 执行事务
      transaction();
      console.log('ai_interpretations表迁移完成');
      
    } catch (error) {
      console.error('ai_interpretations表迁移失败:', error);
      console.error('错误详情:', error.message);
      
      // 如果事务失败，尝试回滚（SQLite会自动回滚失败的事务）
      try {
        // 检查是否存在临时表，如果存在则清理
        const tempTableCheck = this.db.prepare(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name='ai_interpretations_new'
        `).get();
        
        if (tempTableCheck) {
          this.db.exec('DROP TABLE ai_interpretations_new');
          console.log('已清理临时表');
        }
      } catch (cleanupError) {
        console.error('清理临时表失败:', cleanupError);
      }
      
      // 迁移失败不应该阻止应用启动，只记录错误
    }
  }

  // 获取数据库实例
  getDatabase() {
    if (!this.db) {
      this.init();
    }
    return this.db;
  }

  // 关闭数据库连接
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('数据库连接已关闭');
    }
  }

  // 执行事务
  transaction(callback) {
    const db = this.getDatabase();
    const transaction = db.transaction(callback);
    return transaction;
  }

  // 备份数据库
  backup(backupPath) {
    try {
      const db = this.getDatabase();
      db.backup(backupPath);
      console.log(`数据库备份成功: ${backupPath}`);
    } catch (error) {
      console.error('数据库备份失败:', error);
      throw error;
    }
  }

  // 清理过期会话
  cleanupExpiredSessions() {
    try {
      const db = this.getDatabase();
      const stmt = db.prepare('DELETE FROM user_sessions WHERE expires_at < ?');
      const result = stmt.run(new Date().toISOString());
      console.log(`清理了 ${result.changes} 个过期会话`);
      return result.changes;
    } catch (error) {
      console.error('清理过期会话失败:', error);
      throw error;
    }
  }

  /**
   * 迁移numerology_readings表以支持qimen类型
   * 检查现有约束并在需要时更新
   */
  migrateQimenSupport() {
    try {
      // 检查numerology_readings表是否存在
      const tableExists = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='numerology_readings'
      `).get();
      
      if (!tableExists) {
        console.log('numerology_readings表不存在，跳过qimen迁移');
        return;
      }
      
      // 检查是否已经支持qimen类型
      try {
        // 尝试插入一个qimen类型的测试记录来检查约束
        // 获取任意存在的用户ID，避免外键约束失败
        const user = this.db.prepare('SELECT id FROM users LIMIT 1').get();
        if (!user) {
          console.log('⚠️ 无用户存在，跳过qimen迁移测试');
          return;
        }

        const testStmt = this.db.prepare(`
          INSERT INTO numerology_readings (user_id, reading_type, name)
          VALUES (?, ?, ?)
        `);
        const testResult = testStmt.run(user.id, 'qimen', 'test_qimen_support');
        
        // 如果插入成功，说明已经支持qimen，删除测试记录
        const deleteStmt = this.db.prepare('DELETE FROM numerology_readings WHERE id = ?');
        deleteStmt.run(testResult.lastInsertRowid);
        
        console.log('✅ numerology_readings表已支持qimen类型');
        return;
      } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_CHECK') {
          console.log('🔄 检测到需要更新numerology_readings表约束以支持qimen类型');
          
          // 执行表重建以更新约束
          const transaction = this.db.transaction(() => {
            // 创建临时表，包含新的CHECK约束
            this.db.exec(`
              CREATE TABLE numerology_readings_temp (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                reading_type TEXT NOT NULL CHECK (reading_type IN ('bazi', 'ziwei', 'yijing', 'wuxing', 'qimen')),
                name TEXT,
                birth_date TEXT,
                birth_time TEXT,
                birth_place TEXT,
                gender TEXT,
                input_data TEXT,
                results TEXT,
                analysis TEXT,
                status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
              );
            `);
            
            // 复制现有数据到临时表
            this.db.exec(`
              INSERT INTO numerology_readings_temp 
              SELECT id, user_id, reading_type, name, birth_date, birth_time, birth_place, gender, 
                     input_data, results, analysis, status, created_at, updated_at 
              FROM numerology_readings;
            `);
            
            // 删除原表
            this.db.exec('DROP TABLE numerology_readings;');
            
            // 重命名临时表为原表名
            this.db.exec('ALTER TABLE numerology_readings_temp RENAME TO numerology_readings;');
          });
          
          transaction();
          console.log('✅ numerology_readings表约束更新完成，现已支持qimen类型');
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('❌ qimen支持迁移失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
const dbManager = new DatabaseManager();

// 导出数据库管理器和便捷方法
module.exports = {
  dbManager,
  getDB: () => dbManager.getDatabase(),
  closeDB: () => dbManager.close(),
  transaction: (callback) => dbManager.transaction(callback),
  backup: (path) => dbManager.backup(path),
  cleanupSessions: () => dbManager.cleanupExpiredSessions()
};

// 进程退出时自动关闭数据库
process.on('exit', () => {
  dbManager.close();
});

process.on('SIGINT', () => {
  dbManager.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  dbManager.close();
  process.exit(0);
});