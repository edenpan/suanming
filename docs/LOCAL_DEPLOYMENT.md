# 本地化部署指南

本文档详细说明如何部署和运行完全本地化的神机阁应用。

## 🎯 本地化改造概述

本项目已从基于Supabase的云端架构完全转换为本地化架构：

### 架构变更
- **数据库**: PostgreSQL (Supabase) → SQLite (本地文件)
- **后端**: Supabase Edge Functions → Express.js 服务器
- **认证**: Supabase Auth → JWT + bcrypt
- **API**: Supabase客户端 → 本地API客户端

### 保留功能
- ✅ 完整的八字、紫微、易经分析功能
- ✅ 用户注册、登录、档案管理
- ✅ 历史记录存储和查询
- ✅ 所有业务逻辑和算法
- ✅ 原有的用户界面和体验

## 📋 环境要求

### 系统要求
- Node.js >= 18.0.0
- npm >= 9.0.0 或 pnpm >= 8.0.0
- Git >= 2.0.0

### 检查环境
```bash
node --version  # 应该 >= 18.0.0
npm --version   # 应该 >= 9.0.0
git --version   # 应该 >= 2.0.0
```

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd ai-numerology-refactored
```

### 2. 安装依赖
```bash
npm install
```

### 3. 环境配置
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量（可选）
# 默认配置已经可以直接使用
```

### 4. 初始化数据库
```bash
npm run db:init
```

执行成功后会看到：
```
🎉 数据库初始化完成！
📍 数据库文件位置: ./numerology.db
✅ 管理员用户创建成功
   邮箱: admin@localhost
   密码: admin123
✅ 示例数据创建成功
   测试用户邮箱: test@example.com
   测试用户密码: test123
```

### 5. 启动应用

#### 开发模式（推荐）
```bash
npm run dev
```
这会同时启动后端服务器和前端开发服务器。

#### 分别启动
```bash
# 终端1：启动后端服务器
npm run server

# 终端2：启动前端开发服务器
npx vite
```

### 6. 访问应用
- 前端地址: http://localhost:5173
- 后端API: http://localhost:3001
- 健康检查: http://localhost:3001/health

## 🔧 配置说明

### 环境变量

#### 前端环境变量
```env
# 本地API服务器地址
VITE_API_BASE_URL=http://localhost:3001/api
```

#### 后端环境变量
```env
# 服务器端口
PORT=3001

# JWT密钥（生产环境请更改）
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# 数据库文件路径
DB_PATH=./numerology.db

# 运行环境
NODE_ENV=development
```

### 数据库配置

数据库文件默认位置：`./numerology.db`

#### 数据库管理命令
```bash
# 初始化数据库
npm run db:init

# 备份数据库
node server/scripts/initDatabase.cjs backup

# 清理过期数据
node server/scripts/initDatabase.cjs cleanup
```

## 🏗️ 项目结构

```
ai-numerology-refactored/
├── server/                 # 后端服务器
│   ├── database/          # 数据库相关
│   │   ├── index.cjs      # 数据库管理器
│   │   └── schema.sql     # 数据库结构
│   ├── middleware/        # 中间件
│   │   ├── auth.cjs       # JWT认证
│   │   ├── errorHandler.cjs # 错误处理
│   │   └── logger.cjs     # 日志记录
│   ├── routes/            # API路由
│   │   ├── auth.cjs       # 认证路由
│   │   ├── analysis.cjs   # 分析路由
│   │   ├── history.cjs    # 历史记录路由
│   │   └── profile.cjs    # 用户档案路由
│   ├── services/          # 业务逻辑服务
│   │   ├── baziAnalyzer.cjs    # 八字分析
│   │   ├── yijingAnalyzer.cjs  # 易经分析
│   │   └── ziweiAnalyzer.cjs   # 紫微分析
│   ├── scripts/           # 工具脚本
│   │   └── initDatabase.cjs    # 数据库初始化
│   └── index.cjs          # 服务器入口
├── src/                   # 前端源码
│   ├── lib/
│   │   └── localApi.ts    # 本地API客户端
│   ├── contexts/
│   │   └── AuthContext.tsx # 认证上下文
│   └── ...
├── logic/                 # 原始推理逻辑（参考）
├── numerology.db          # SQLite数据库文件
├── .env.example           # 环境变量模板
└── package.json           # 项目配置
```

## 🔐 用户账户

### 预设账户

#### 管理员账户
- 邮箱: `admin@localhost`
- 密码: `admin123`
- 权限: 完整访问权限

#### 测试账户
- 邮箱: `test@example.com`
- 密码: `test123`
- 权限: 普通用户权限
- 包含示例分析记录

### 创建新用户
1. 访问注册页面
2. 填写邮箱和密码
3. 可选填写姓名
4. 点击注册

## 📊 API接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

### 分析接口
- `POST /api/analysis/bazi` - 八字分析
- `POST /api/analysis/ziwei` - 紫微斗数分析
- `POST /api/analysis/yijing` - 易经占卜分析
- `GET /api/analysis/types` - 获取分析类型

### 历史记录接口
- `GET /api/history` - 获取历史记录
- `GET /api/history/:id` - 获取单个记录
- `DELETE /api/history/:id` - 删除记录

### 用户档案接口
- `GET /api/profile` - 获取用户档案
- `PUT /api/profile` - 更新用户档案

## 🛠️ 开发指南

### 开发模式启动
```bash
# 同时启动前后端（推荐）
npm run dev

# 或分别启动
npm run server  # 后端
npx vite        # 前端
```

### 代码热重载
- 后端：使用 nodemon 自动重启
- 前端：使用 Vite 热模块替换

### 调试
- 后端日志：控制台输出
- 前端调试：浏览器开发者工具
- API测试：可使用 Postman 或 curl

## 🚢 生产部署

### 1. 构建前端
```bash
npm run build
```

### 2. 启动生产服务器
```bash
# 设置生产环境
export NODE_ENV=production

# 启动服务器
npm start
```

### 3. 使用 PM2 管理进程（推荐）
```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start server/index.cjs --name "numerology-app"

# 查看状态
pm2 status

# 查看日志
pm2 logs numerology-app
```

### 4. 反向代理配置（Nginx）
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态文件
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 故障排除

### 常见问题

#### 1. 数据库初始化失败
```bash
# 删除现有数据库文件
rm numerology.db

# 重新初始化
npm run db:init
```

#### 2. 端口被占用
```bash
# 查看端口占用
netstat -ano | findstr :3001

# 修改端口（在 .env 文件中）
PORT=3002
```

#### 3. 前端无法连接后端
- 检查后端服务器是否启动
- 检查 `VITE_API_BASE_URL` 配置
- 检查防火墙设置

#### 4. JWT token 过期
```bash
# 清除浏览器 localStorage
# 或重新登录
```

### 日志查看
```bash
# 后端日志
npm run server

# 如果使用 PM2
pm2 logs numerology-app
```

## 📈 性能优化

### 数据库优化
- 定期清理过期会话：`node server/scripts/initDatabase.cjs cleanup`
- 数据库备份：`node server/scripts/initDatabase.cjs backup`

### 前端优化
- 构建优化：`npm run build`
- 启用 gzip 压缩
- 使用 CDN 加速静态资源

## 🔒 安全建议

### 生产环境安全
1. **更改默认密码**
   ```env
   JWT_SECRET=your-very-secure-random-string
   ```

2. **启用 HTTPS**
   - 使用 SSL 证书
   - 配置安全头

3. **数据库安全**
   - 定期备份数据库
   - 限制数据库文件访问权限

4. **API安全**
   - 实施请求频率限制
   - 输入验证和清理
   - 错误信息不暴露敏感信息

## 📞 技术支持

### 获取帮助
- 查看项目文档
- 检查 GitHub Issues
- 查看错误日志

### 报告问题
请提供以下信息：
- 操作系统版本
- Node.js 版本
- 错误日志
- 复现步骤

---

## 🎉 恭喜！

您已成功部署本地化的神机阁应用！现在可以：
- 🔮 进行八字、紫微、易经分析
- 👤 管理用户账户和档案
- 📚 查看和管理历史记录
- 🔒 享受完全本地化的数据隐私保护

应用完全运行在本地环境，无需依赖任何外部服务，数据安全可控。