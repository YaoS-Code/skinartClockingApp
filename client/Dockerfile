# React前端Dockerfile - 多阶段构建
# 阶段1: 构建
FROM node:18-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建应用（ARG在构建时可用，ENV在运行时可用）
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
RUN npm run build

# 阶段2: 生产环境
FROM node:18-alpine

# 安装serve用于服务静态文件
RUN npm install -g serve

WORKDIR /app

# 从构建阶段复制构建文件
COPY --from=builder /app/build ./build

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001 || exit 1

# 启动serve服务
CMD ["serve", "-s", "build", "-l", "3001"]

