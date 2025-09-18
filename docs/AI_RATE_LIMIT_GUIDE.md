# AI 访问限制功能指南

本文档说明神机阁应用中的 AI API 访问限制功能，用于保护 AI API 资源，防止滥用。

## 🎯 功能概述

AI 访问限制功能通过 IP 地址追踪每个用户的 AI 解读请求次数，实现以下目标：

- **限制频率**：每个 IP 地址每天最多请求 30 次（可配置）
- **自动重置**：每天凌晨自动重置计数
- **实时追踪**：记录每个请求的详细信息
- **灵活配置**：可通过环境变量调整限制

## 🔧 配置说明

在 `.env` 文件中配置：

```env
# AI访问限制配置
# 每个IP每天最多请求次数
AI_DAILY_LIMIT=30

# 是否启用AI访问限制（true/false）
AI_RATE_LIMIT_ENABLED=true
```

### 配置项说明

- `AI_DAILY_LIMIT`：每个 IP 每天的最大请求次数（默认 30）
- `AI_RATE_LIMIT_ENABLED`：是否启用限制功能（默认启用）

## 📊 数据库结构

系统会自动创建 `ai_api_usage` 表来记录访问信息：

```sql
CREATE TABLE ai_api_usage (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,              -- 关联用户ID（如果已登录）
    ip_address TEXT NOT NULL,     -- 请求者IP地址
    endpoint TEXT NOT NULL,       -- 请求的API端点
    request_date DATE NOT NULL,   -- 请求日期
    request_count INTEGER,        -- 当天累计请求次数
    created_at DATETIME,          -- 首次请求时间
    updated_at DATETIME           -- 最后更新时间
);
```

## 🚦 工作原理

1. **请求拦截**：当用户请求 AI 解读时，中间件会拦截请求
2. **IP 识别**：获取请求者的真实 IP 地址（支持代理）
3. **计数检查**：查询该 IP 今天的请求次数
4. **限制判断**：
   - 未达限制：允许请求，计数 +1
   - 已达限制：返回 429 错误
5. **响应头**：添加限制信息到响应头

## 📡 API 接口

### 1. 获取当前 IP 使用情况

```http
GET /api/ai-interpretation/usage
```

响应示例：
```json
{
  "success": true,
  "data": {
    "date": "2024-01-20",
    "limit": 30,
    "used": 15,
    "remaining": 15,
    "resetAt": 1705795200000
  }
}
```

### 2. 获取使用统计报告（需要登录）

```http
GET /api/ai-interpretation/usage/report?days=7
```

响应示例：
```json
{
  "success": true,
  "data": {
    "summary": [
      {
        "request_date": "2024-01-20",
        "unique_ips": 25,
        "unique_users": 18,
        "total_requests": 156
      }
    ],
    "todayTopUsers": [
      {
        "ip_address": "192.168.1.100",
        "user_id": 123,
        "request_count": 28,
        "endpoint": "/api/ai-interpretation/save"
      }
    ],
    "dailyLimit": 30,
    "rateLimitEnabled": true
  }
}
```

## 🛡️ 错误处理

当达到限制时，API 返回 429 状态码：

```json
{
  "error": "AI API 访问限制",
  "message": "您今天的 AI 解读次数已达上限（30次）。请明天再试。",
  "limit": 30,
  "used": 30,
  "resetAt": 1705795200000
}
```

## 📋 响应头信息

每个 AI 请求的响应都包含以下头信息：

- `X-AI-RateLimit-Limit`: 每日限制次数
- `X-AI-RateLimit-Remaining`: 剩余可用次数
- `X-AI-RateLimit-Reset`: 重置时间戳

## 🔍 监控和管理

### 查看今日使用情况

```sql
SELECT ip_address, request_count 
FROM ai_api_usage 
WHERE request_date = date('now')
ORDER BY request_count DESC;
```

### 清理历史数据

```sql
DELETE FROM ai_api_usage 
WHERE request_date < date('now', '-30 days');
```

### 临时解除限制

如需临时解除某个 IP 的限制：

```sql
UPDATE ai_api_usage 
SET request_count = 0 
WHERE ip_address = '目标IP' 
  AND request_date = date('now');
```

## 🚀 部署注意事项

1. **代理配置**：如果使用反向代理（如 Nginx），确保正确转发客户端 IP：
   ```nginx
   proxy_set_header X-Real-IP $remote_addr;
   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   ```

2. **时区设置**：确保服务器时区正确，影响每日重置时间

3. **数据备份**：定期备份 `ai_api_usage` 表数据用于分析

## 📈 扩展建议

1. **用户级限制**：可以为注册用户提供更高的限额
2. **VIP 功能**：付费用户可以获得更多配额
3. **动态调整**：根据服务器负载动态调整限制
4. **黑名单功能**：对恶意 IP 进行永久封禁

## 🔧 故障排除

### 限制不生效

1. 检查环境变量 `AI_RATE_LIMIT_ENABLED` 是否为 `true`
2. 确认数据库表 `ai_api_usage` 已创建
3. 查看服务器日志是否有错误信息

### IP 地址识别错误

1. 检查反向代理配置
2. 查看请求头中的 IP 信息
3. 调整 `getClientIp` 函数逻辑

---

通过合理配置 AI 访问限制，可以有效保护 AI API 资源，确保服务稳定运行，为所有用户提供公平的使用机会。