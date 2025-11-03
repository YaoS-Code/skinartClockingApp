# Cloudflare Tunnel 配置指南

## 📋 概述

本指南说明如何使用 Cloudflare Tunnel 将本地部署的应用映射到 `clock.skinartmd.ca`。

## 🔑 关键信息

您的应用使用 **两个端口**：
- **前端（React）**: 端口 3001
- **后端（API）**: 端口 13000

前端会动态构建 API URL，使用相同的主机名但端口改为 13000。例如：
- 访问 `clock.skinartmd.ca` → 前端会调用 `clock.skinartmd.ca:13000/api/*`

## ⚠️ 重要提醒

**必须同时映射两个端口**，否则前端无法与后端通信！

## 🚀 方案一：使用 Cloudflare Tunnel CLI（推荐）

### 1. 安装 cloudflared

```bash
# macOS（如已安装请跳过）
brew install cloudflare/cloudflare/cloudflared
```

### 2. 登录 Cloudflare

```bash
cloudflared tunnel login
```

### 3. 创建 Tunnel

```bash
cloudflared tunnel create skinart-clock
```

记录返回的 **Tunnel ID**。

### 4. 创建配置文件

创建文件：`~/.cloudflared/config.yml`

```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: /Users/yaosong/.cloudflared/<YOUR_TUNNEL_ID>.json

ingress:
  # 前端服务映射
  - hostname: clock.skinartmd.ca
    service: http://localhost:3001
  
  # 后端 API 映射（重要！）
  # 注意：Cloudflare Tunnel 不支持在同一域名上使用不同端口
  # 您需要使用以下任一方案：
  
  # 方案 A：通过路径区分
  - hostname: clock.skinartmd.ca
    path: /api/*
    service: http://localhost:13000
  
  # 或者方案 B：使用子域名（推荐）
  # - hostname: api.clock.skinartmd.ca
  #   service: http://localhost:13000
  
  # 默认规则（必须）
  - service: http_status:404
```

### 5. 配置 DNS

```bash
# 方案 A（路径区分）：只需要一条记录
cloudflared tunnel route dns <TUNNEL_ID> clock.skinartmd.ca

# 方案 B（子域名，推荐）：需要两条记录
cloudflared tunnel route dns <TUNNEL_ID> clock.skinartmd.ca
cloudflared tunnel route dns <TUNNEL_ID> api.clock.skinartmd.ca
```

### 6. 启动 Tunnel

```bash
cloudflared tunnel run skinart-clock
```

或者作为后台服务运行：

```bash
cloudflared service install
sudo launchctl start com.cloudflare.cloudflared
```

## 🔧 方案二：修改应用配置（如果选择子域名方案）

如果您选择 **方案 B（子域名）**，需要修改前端配置：

### 修改 `client/src/services/api.js`

```javascript
const getApiBaseURL = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 检测是否在生产域名
  const hostname = window.location.hostname;
  if (hostname === 'clock.skinartmd.ca') {
    return 'https://api.clock.skinartmd.ca';  // 使用子域名
  }
  
  // 本地开发：动态构建
  const protocol = window.location.protocol;
  return `${protocol}//${hostname}:13000`;
};
```

### 更新 docker-compose.yml CORS 配置

已完成 ✅ - CORS 配置已包含 `http://clock.skinartmd.ca` 和 `https://clock.skinartmd.ca`

需要添加子域名（如使用方案 B）：

```yaml
CORS_ORIGIN: http://clock.skinartmd.ca,https://clock.skinartmd.ca,http://api.clock.skinartmd.ca,https://api.clock.skinartmd.ca,...
```

### 重新构建并启动

```bash
cd /Users/yaosong/Apps/skinartClockingApp
docker-compose down
docker-compose up -d --build client
```

## 📊 当前部署状态

✅ **本地服务运行正常**

| 服务 | 端口 | 状态 | 本地访问地址 |
|------|------|------|--------------|
| 前端 | 3001 | ✅ 运行中 | http://localhost:3001 |
| 后端 API | 13000 | ✅ 运行中 | http://localhost:13000/api |
| MySQL | 3306 | ✅ 运行中 | localhost:3306 |

## 🧪 测试步骤

### 1. 测试本地访问

```bash
# 测试前端
curl http://localhost:3001

# 测试后端 API
curl http://localhost:13000/api/auth/profile
# 应返回 401（正常，因为未授权）
```

### 2. 测试 Cloudflare Tunnel（配置后）

```bash
# 测试前端
curl https://clock.skinartmd.ca

# 测试后端 API（方案 A：路径）
curl https://clock.skinartmd.ca/api/auth/profile

# 或（方案 B：子域名）
curl https://api.clock.skinartmd.ca/api/auth/profile
```

## 🔍 故障排除

### 问题：前端能访问，但 API 调用失败

**原因**：后端端口未正确映射

**解决**：
1. 检查 Cloudflare Tunnel 配置文件中是否包含后端映射
2. 查看 Tunnel 日志：`cloudflared tunnel info <TUNNEL_ID>`
3. 检查浏览器控制台网络请求，确认 API URL 正确

### 问题：CORS 错误

**解决**：
1. 确保 `docker-compose.yml` 中的 CORS_ORIGIN 包含您的域名
2. 重启后端服务：`docker-compose restart server`

### 问题：502 Bad Gateway

**原因**：Tunnel 无法连接到本地服务

**解决**：
1. 确认本地服务正在运行：`docker ps`
2. 检查防火墙设置
3. 查看 Cloudflare Tunnel 日志

## 📝 默认管理员账户

- **用户名**: `manager`
- **密码**: `8780`
- **角色**: admin

## 🎯 推荐方案

**建议使用方案 B（子域名）**，理由：
- ✅ 更清晰的架构分离
- ✅ 更容易调试
- ✅ 符合最佳实践
- ✅ 更容易扩展

配置域名：
- 前端：`clock.skinartmd.ca`
- API：`api.clock.skinartmd.ca`

## 📚 相关文档

- [Cloudflare Tunnel 官方文档](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [DEPLOYMENT_SUCCESS.md](DEPLOYMENT_SUCCESS.md) - 本地部署成功文档

---

**部署完成！** 🎉

配置 Cloudflare Tunnel 后，您的应用将可以通过 `clock.skinartmd.ca` 访问。

