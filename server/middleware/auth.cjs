const jwt = require('jsonwebtoken');
const { getDB } = require('../database/index.cjs');
const { AppError } = require('./errorHandler.cjs');

// JWT密钥 (在生产环境中应该从环境变量读取)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 生成JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

// 验证JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new AppError('无效的访问令牌', 401, 'INVALID_TOKEN');
  }
};

// 认证中间件
const authenticate = async (req, res, next) => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('缺少访问令牌', 401, 'MISSING_TOKEN');
    }
    
    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
    
    // 验证token
    const decoded = verifyToken(token);
    
    // 从数据库获取用户信息
    const db = getDB();
    const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user) {
      throw new AppError('用户不存在', 401, 'USER_NOT_FOUND');
    }
    
    // 检查会话是否有效
    const session = db.prepare(
      'SELECT id FROM user_sessions WHERE user_id = ? AND token_hash = ? AND expires_at > ?'
    ).get(user.id, hashToken(token), new Date().toISOString());
    
    if (!session) {
      throw new AppError('会话已过期，请重新登录', 401, 'SESSION_EXPIRED');
    }
    
    // 将用户信息添加到请求对象
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    next(error);
  }
};

// 可选认证中间件（不强制要求登录）
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      const db = getDB();
      const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(decoded.userId);
      
      if (user) {
        const session = db.prepare(
          'SELECT id FROM user_sessions WHERE user_id = ? AND token_hash = ? AND expires_at > ?'
        ).get(user.id, hashToken(token), new Date().toISOString());
        
        if (session) {
          req.user = user;
          req.token = token;
        }
      }
    }
    
    next();
  } catch (error) {
    // 可选认证失败时不抛出错误，继续执行
    next();
  }
};

// 创建用户会话
const createSession = (userId, token) => {
  const db = getDB();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7天后过期
  
  const stmt = db.prepare(
    'INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
  );
  
  return stmt.run(userId, hashToken(token), expiresAt.toISOString());
};

// 删除用户会话
const deleteSession = (userId, token) => {
  const db = getDB();
  const stmt = db.prepare(
    'DELETE FROM user_sessions WHERE user_id = ? AND token_hash = ?'
  );
  
  return stmt.run(userId, hashToken(token));
};

// 删除用户所有会话
const deleteAllSessions = (userId) => {
  const db = getDB();
  const stmt = db.prepare('DELETE FROM user_sessions WHERE user_id = ?');
  
  return stmt.run(userId);
};

// Token哈希函数（简单实现）
const hashToken = (token) => {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
};

// 清理过期会话
const cleanupExpiredSessions = () => {
  const db = getDB();
  const stmt = db.prepare('DELETE FROM user_sessions WHERE expires_at < ?');
  const result = stmt.run(new Date().toISOString());
  
  if (result.changes > 0) {
    console.log(`清理了 ${result.changes} 个过期会话`);
  }
  
  return result.changes;
};

// 定期清理过期会话（每小时执行一次）
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  optionalAuth,
  createSession,
  deleteSession,
  deleteAllSessions,
  cleanupExpiredSessions,
  JWT_SECRET,
  JWT_EXPIRES_IN
};