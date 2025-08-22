# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package.json package-lock.json ./

# 安装所有依赖（包括开发依赖用于构建前端）
RUN npm ci

# 复制应用代码
COPY . .

# 构建前端
RUN npm run build

# 清理开发依赖，只保留生产依赖
RUN npm ci --only=production

# 创建数据目录用于SQLite数据库
RUN mkdir -p /app/data

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=8000

# 暴露端口
EXPOSE 8000

# 启动应用（数据库初始化在应用启动时自动进行）
CMD ["node", "server/index.cjs"]