const { dbManager } = require('../database/index.cjs');

// AI API 访问限制配置
const AI_DAILY_LIMIT = process.env.AI_DAILY_LIMIT || 30; // 每天最多请求次数
const AI_RATE_LIMIT_ENABLED = process.env.AI_RATE_LIMIT_ENABLED !== 'false'; // 默认启用

/**
 * 获取客户端真实IP地址
 */
function getClientIp(req) {
  // 优先从代理头部获取
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // 其他可能的头部
  return req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         req.ip;
}

/**
 * AI API 访问限制中间件
 */
async function aiRateLimit(req, res, next) {
  // 如果限制未启用，直接放行
  if (!AI_RATE_LIMIT_ENABLED) {
    return next();
  }

  try {
    const db = dbManager.getDatabase();
    const clientIp = getClientIp(req);
    const userId = req.user?.id || null;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
    const endpoint = req.path;

    // 查询今天的访问记录
    const usage = db.prepare(`
      SELECT request_count 
      FROM ai_api_usage 
      WHERE ip_address = ? AND request_date = ?
    `).get(clientIp, today);

    if (usage && usage.request_count >= AI_DAILY_LIMIT) {
      // 已达到限制
      return res.status(429).json({
        error: 'AI API 访问限制',
        message: `您今天的 AI 解读次数已达上限（${AI_DAILY_LIMIT}次）。请明天再试。`,
        limit: AI_DAILY_LIMIT,
        used: usage.request_count,
        resetAt: new Date(today + 'T00:00:00').getTime() + 24 * 60 * 60 * 1000
      });
    }

    // 记录或更新访问次数
    if (usage) {
      // 更新现有记录
      db.prepare(`
        UPDATE ai_api_usage 
        SET request_count = request_count + 1,
            user_id = COALESCE(?, user_id),
            endpoint = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE ip_address = ? AND request_date = ?
      `).run(userId, endpoint, clientIp, today);
    } else {
      // 创建新记录
      db.prepare(`
        INSERT INTO ai_api_usage (user_id, ip_address, endpoint, request_date, request_count)
        VALUES (?, ?, ?, ?, 1)
      `).run(userId, clientIp, endpoint, today);
    }

    // 将使用情况添加到响应头
    const currentCount = (usage?.request_count || 0) + 1;
    res.setHeader('X-AI-RateLimit-Limit', AI_DAILY_LIMIT);
    res.setHeader('X-AI-RateLimit-Remaining', Math.max(0, AI_DAILY_LIMIT - currentCount));
    res.setHeader('X-AI-RateLimit-Reset', new Date(today + 'T00:00:00').getTime() + 24 * 60 * 60 * 1000);

    // 在请求对象中添加使用信息，供后续处理使用
    req.aiUsage = {
      limit: AI_DAILY_LIMIT,
      used: currentCount,
      remaining: Math.max(0, AI_DAILY_LIMIT - currentCount)
    };

    next();
  } catch (error) {
    console.error('AI访问限制中间件错误:', error);
    // 出错时不阻止请求，但记录错误
    next();
  }
}

/**
 * 获取指定IP的AI使用情况
 */
function getAiUsageStats(ipAddress, date = null) {
  try {
    const db = dbManager.getDatabase();
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const usage = db.prepare(`
      SELECT request_count 
      FROM ai_api_usage 
      WHERE ip_address = ? AND request_date = ?
    `).get(ipAddress, targetDate);

    return {
      date: targetDate,
      limit: AI_DAILY_LIMIT,
      used: usage?.request_count || 0,
      remaining: Math.max(0, AI_DAILY_LIMIT - (usage?.request_count || 0)),
      resetAt: new Date(targetDate + 'T00:00:00').getTime() + 24 * 60 * 60 * 1000
    };
  } catch (error) {
    console.error('获取AI使用统计错误:', error);
    return null;
  }
}

/**
 * 获取AI使用统计报告
 */
function getAiUsageReport(days = 7) {
  try {
    const db = dbManager.getDatabase();
    
    // 获取最近N天的统计
    const report = db.prepare(`
      SELECT 
        request_date,
        COUNT(DISTINCT ip_address) as unique_ips,
        COUNT(DISTINCT user_id) as unique_users,
        SUM(request_count) as total_requests
      FROM ai_api_usage
      WHERE request_date >= date('now', '-' || ? || ' days')
      GROUP BY request_date
      ORDER BY request_date DESC
    `).all(days);

    // 获取今天的详细信息
    const todayDetails = db.prepare(`
      SELECT 
        ip_address,
        user_id,
        request_count,
        endpoint
      FROM ai_api_usage
      WHERE request_date = date('now')
      ORDER BY request_count DESC
      LIMIT 20
    `).all();

    return {
      summary: report,
      todayTopUsers: todayDetails,
      dailyLimit: AI_DAILY_LIMIT,
      rateLimitEnabled: AI_RATE_LIMIT_ENABLED
    };
  } catch (error) {
    console.error('获取AI使用报告错误:', error);
    return null;
  }
}

module.exports = {
  aiRateLimit,
  getAiUsageStats,
  getAiUsageReport,
  AI_DAILY_LIMIT,
  AI_RATE_LIMIT_ENABLED
};