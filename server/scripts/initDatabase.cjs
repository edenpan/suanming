const { dbManager } = require('../database/index.cjs');
const path = require('path');
const fs = require('fs');

// 数据库初始化脚本
async function initializeDatabase() {
  try {
    console.log('🚀 开始初始化数据库...');
    
    // 初始化数据库连接和结构
    const db = dbManager.init();
    
    console.log('✅ 数据库结构创建成功');
    
    // 清理潜在的外键孤儿数据
    db.prepare(`
      DELETE FROM ai_interpretations
      WHERE reading_id NOT IN (SELECT id FROM numerology_readings)
    `).run();
    console.log('🧹 已清理孤立的 ai_interpretations 记录');
    
    // 检查是否需要创建管理员用户
    const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@localhost');
    
    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const adminPassword = await bcrypt.hash('admin123', 12);
      
      // 创建管理员用户
      const insertAdmin = db.prepare(
        'INSERT INTO users (email, password_hash) VALUES (?, ?)'
      );
      const adminResult = insertAdmin.run('admin@localhost', adminPassword);
      
      // 创建管理员档案
      const insertAdminProfile = db.prepare(
        'INSERT INTO user_profiles (user_id, full_name, username) VALUES (?, ?, ?)'
      );
      insertAdminProfile.run(adminResult.lastInsertRowid, '系统管理员', 'admin');
      
      console.log('✅ 管理员用户创建成功');
      console.log('   邮箱: admin@localhost');
      console.log('   密码: admin123');
    } else {
      console.log('ℹ️  管理员用户已存在');
    }
    
    // 仅在开发环境创建示例数据
    if (process.env.NODE_ENV !== 'production') {
      await createSampleData(db);
    } else {
      console.log('ℹ️  生产环境，跳过示例数据创建');
    }
    
    console.log('🎉 数据库初始化完成！');
    console.log(`📍 数据库文件位置: ${path.resolve('./numerology.db')}`);
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  } finally {
    dbManager.close();
  }
}

// 创建示例数据
async function createSampleData(db) {
  try {
    // 检查是否已有示例数据
    const existingReadings = db.prepare('SELECT COUNT(*) as count FROM numerology_readings').get();
    
    if (existingReadings.count > 0) {
      console.log('ℹ️  示例数据已存在，跳过创建');
      return;
    }
    
    // 创建示例用户
    const bcrypt = require('bcryptjs');
    const testPassword = await bcrypt.hash('test123', 12);
    
    const insertTestUser = db.prepare(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)'
    );
    const testUserResult = insertTestUser.run('test@example.com', testPassword);
    const testUserId = testUserResult.lastInsertRowid;
    
    // 创建测试用户档案
    const insertTestProfile = db.prepare(
      'INSERT INTO user_profiles (user_id, full_name, birth_date, gender) VALUES (?, ?, ?, ?)'
    );
    insertTestProfile.run(testUserId, '测试用户', '1990-01-01', 'male');
    
    // 创建示例分析记录
    const sampleAnalysis = {
      analysis_type: 'bazi',
      analysis_date: new Date().toISOString().split('T')[0],
      basic_info: {
        personal_data: {
          name: '测试用户',
          birth_date: '1990-01-01',
          birth_time: '12:00',
          gender: '男性'
        }
      },
      wuxing_analysis: {
        element_distribution: { '木': 2, '火': 1, '土': 2, '金': 2, '水': 1 },
        balance_analysis: '五行分布较为均匀，整体平衡良好',
        personal_traits: '性格温和平衡，具有良好的适应能力',
        suggestions: '建议保持现有的平衡状态，继续稳步发展'
      }
    };
    
    const insertSampleReading = db.prepare(`
      INSERT INTO numerology_readings (
        user_id, reading_type, name, birth_date, birth_time, gender,
        input_data, analysis, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertSampleReading.run(
      testUserId,
      'bazi',
      '测试用户',
      '1990-01-01',
      '12:00',
      'male',
      JSON.stringify({ name: '测试用户', birth_date: '1990-01-01', birth_time: '12:00', gender: 'male' }),
      JSON.stringify(sampleAnalysis),
      'completed'
    );
    
    console.log('✅ 示例数据创建成功');
    console.log('   测试用户邮箱: test@example.com');
    console.log('   测试用户密码: test123');
    
  } catch (error) {
    console.error('创建示例数据失败:', error);
    // 不抛出错误，允许继续初始化
  }
}

// 数据库备份功能
function backupDatabase() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, `../../backups/numerology_${timestamp}.db`);
    
    // 确保备份目录存在
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    dbManager.backup(backupPath);
    console.log(`✅ 数据库备份成功: ${backupPath}`);
    
  } catch (error) {
    console.error('❌ 数据库备份失败:', error);
  }
}

// 数据库清理功能
function cleanupDatabase() {
  try {
    const db = dbManager.getDatabase();
    
    // 清理过期会话
    const cleanupSessions = db.prepare('DELETE FROM user_sessions WHERE expires_at < ?');
    const sessionResult = cleanupSessions.run(new Date().toISOString());
    
    console.log(`✅ 清理了 ${sessionResult.changes} 个过期会话`);
    
    // 可以添加更多清理逻辑
    // 例如：清理超过一年的分析记录等
    
  } catch (error) {
    console.error('❌ 数据库清理失败:', error);
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'backup':
    backupDatabase();
    break;
  case 'cleanup':
    cleanupDatabase();
    break;
  case 'init':
  default:
    initializeDatabase();
    break;
}

// 如果直接运行此脚本
if (require.main === module) {
  // 脚本被直接执行
}

module.exports = {
  initializeDatabase,
  backupDatabase,
  cleanupDatabase
};