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

# 阶段2: 生产环境 - 使用 nginx 作为反向代理
FROM nginx:alpine

# 复制构建文件到 nginx 默认目录
COPY --from=builder /app/build /usr/share/nginx/html

# 复制 nginx 配置（带反向代理）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# nginx 前台运行
CMD ["nginx", "-g", "daemon off;"]

