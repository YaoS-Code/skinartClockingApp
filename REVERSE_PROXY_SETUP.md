# 反向代理架构部署成功 ✅

## 📋 架构概览

采用**前端反向代理**方案，只需暴露单一端口：

```
Cloudflare Tunnel (clock.skinartmd.ca)
    ↓
localhost:3001 (nginx 前端容器)
    ↓
    ├─ /          → 静态文件（React 应用）
    └─ /api/*     → 反向代理到 server:13000/api/*（后端容器）
```

## ✅ 优势

1. **单端口映射**：只需要映射 3001 端口
2. **后端隐藏**：后端 13000 端口不对外暴露，更安全
3. **同域访问**：前后端同域，无 CORS 问题
4. **简化配置**：Cloudflare Tunnel 配置更简单

## 🔧 关键配置文件

### 1. `client/nginx.conf` - Nginx 反向代理配置

```nginx
server {
    listen 3001;
    
    # 前端静态文件
    root /usr/share/nginx/html;
    index index.html;

    # API 反向代理 - 转发到后端容器
    location /api/ {
        proxy_pass http://server:13000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # React Router 支持
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 2. `client/Dockerfile` - 使用 nginx 替代 serve

从 `node:18-alpine + serve` 改为 `nginx:alpine`，支持反向代理功能。

### 3. `client/src/services/api.js` - 动态 API URL

```javascript
const getApiBaseURL = () => {
  const hostname = window.location.hostname;
  
  // 本地开发：直接访问后端端口
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${window.location.protocol}//${hostname}:13000`;
  }
  
  // 生产环境：使用相对路径，通过 nginx 反向代理
  return '';  // 空字符串 = 相对路径 /api
};
```

## 🌐 Cloudflare Tunnel 配置

现在只需要**单一映射**：

```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: ~/.cloudflared/<YOUR_TUNNEL_ID>.json

ingress:
  - hostname: clock.skinartmd.ca
    service: http://localhost:3001
  
  - service: http_status:404
```

或使用命令行：

```bash
cloudflared tunnel --url http://localhost:3001
```

## 📊 当前运行状态

### 容器状态

| 容器 | 端口映射 | 外部访问 | 说明 |
|------|----------|----------|------|
| clockingapp-client | 3001:3001 | ✅ 是 | Nginx + 反向代理 |
| clockingapp-server | 13000:13000 | ❌ 否 | 仅容器内访问 |
| clockingapp-mysql | 3306:3306 | ❌ 否 | 仅容器内访问 |

### 访问路径

| 请求 | 处理方式 |
|------|----------|
| `clock.skinartmd.ca/` | Nginx 返回 React 静态文件 |
| `clock.skinartmd.ca/login` | Nginx 返回 index.html（React Router） |
| `clock.skinartmd.ca/api/auth/login` | Nginx 代理到 `server:13000/api/auth/login` |
| `clock.skinartmd.ca/api/*` | Nginx 代理到 `server:13000/api/*` |

## 🧪 测试验证

### 本地测试

```bash
# 测试前端
curl http://localhost:3001
# 应返回 HTML

# 测试 API 反向代理
curl http://localhost:3001/api/auth/profile
# 应返回 401（未授权，正常）
```

### 生产测试

```bash
# 测试前端
curl https://clock.skinartmd.ca
# 应返回 HTML

# 测试 API
curl https://clock.skinartmd.ca/api/auth/profile
# 应返回 401 或 403（未授权，正常）
```

## 📝 Docker Compose 配置

### 后端服务（server）

```yaml
server:
  ports:
    - "13000:13000"  # 可选：本地调试用
  networks:
    - clockingapp-network
  environment:
    CORS_ORIGIN: http://clock.skinartmd.ca,https://clock.skinartmd.ca,...
```

**注意**：13000 端口映射可以保留（方便本地调试），但不需要通过 Cloudflare Tunnel 暴露。

### 前端服务（client）

```yaml
client:
  build:
    context: ./client
  ports:
    - "3001:3001"  # 唯一需要暴露的端口
  networks:
    - clockingapp-network
  depends_on:
    - server
```

## 🔍 日志验证

查看 nginx 访问日志，确认反向代理工作：

```bash
docker logs -f clockingapp-client
```

成功的日志应显示：
```
POST /api/auth/login HTTP/1.1" 200
GET /api/auth/profile HTTP/1.1" 403
```

## 🎯 部署完成

✅ 前端静态文件服务  
✅ API 反向代理  
✅ React Router 支持  
✅ 健康检查  
✅ 本地和生产环境自动识别  
✅ Cloudflare Tunnel 单端口映射  

## 🛠️ 常用命令

```bash
# 重新构建并启动
cd /Users/yaosong/Apps/skinartClockingApp
docker-compose up -d --build

# 查看容器状态
docker ps

# 查看 nginx 日志
docker logs -f clockingapp-client

# 查看后端日志
docker logs -f clockingapp-server

# 停止服务
docker-compose stop

# 重启服务
docker-compose restart
```

## 🆚 对比之前的方案

### 之前（子域名方案）
- ❌ 需要两个 Cloudflare Tunnel 映射
- ❌ 需要修改前端代码区分域名
- ❌ 后端端口对外暴露
- ❌ 配置复杂

### 现在（反向代理方案）
- ✅ 只需一个 Cloudflare Tunnel 映射
- ✅ 前端自动检测环境
- ✅ 后端完全隐藏
- ✅ 配置简单

---

**部署时间**: 2025年10月31日  
**架构**: 单端口反向代理  
**状态**: ✅ 运行中

