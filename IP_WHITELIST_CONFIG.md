# IP 白名单配置指南

## 🎯 需求

限制打卡应用只能在诊所网络中访问，防止员工在家或其他地方打卡。

## 📋 配置步骤

### 1. 获取诊所的公网 IP 地址

有几种方法获取诊所的公网 IP：

**方法 A：在诊所电脑上访问**
```
打开浏览器访问：https://whatismyipaddress.com/
或：https://api.ipify.org
```

**方法 B：从当前日志查看**
根据您刚才的访问，您的 IP 是：`2001:569:7da5:f900:cc3f:4aa:ec89:661e`（IPv6）

如果您是在诊所访问的，这就是诊所的公网 IP。

### 2. 更新 docker-compose.yml

编辑 `docker-compose.yml`，找到 `IP_WHITELIST` 行，替换为您诊所的真实 IP：

```yaml
IP_WHITELIST_ENABLED: true
IP_WHITELIST_LOCAL_ONLY: false
IP_WHITELIST: "2001:569:7da5:f900:cc3f:4aa:ec89:661e"  # 替换为诊所的真实 IP
```

### 3. 支持多个 IP（如果需要）

如果诊所有多个公网 IP，或者您想同时允许 IPv4 和 IPv6：

```yaml
IP_WHITELIST: "2001:569:7da5:f900:cc3f:4aa:ec89:661e,192.168.1.100,10.0.0.0/24"
```

支持的格式：
- **单个 IP**: `192.168.1.100`
- **IPv6**: `2001:569:7da5:f900:cc3f:4aa:ec89:661e`
- **CIDR 范围**: `192.168.1.0/24`（允许 192.168.1.0-192.168.1.255）
- **IP 段**: `192.168.1.100-192.168.1.200`
- **多个 IP**（逗号分隔）: `IP1,IP2,IP3`

### 4. 重新构建并启动服务

```bash
cd /Users/yaosong/Apps/skinartClockingApp
docker-compose down
docker-compose up -d --build
```

### 5. 测试验证

**在诊所网络中测试**：
- 访问 `https://clock.skinartmd.ca`
- 应该能够正常登录和打卡 ✅

**在家或其他网络测试**：
- 访问 `https://clock.skinartmd.ca`
- 登录后尝试打卡
- 应该显示 "Access denied" 错误 ❌

## 🔧 架构说明

```
员工在诊所打卡
    ↓
[诊所公网 IP: X.X.X.X]
    ↓
Cloudflare Tunnel
    ↓ (添加 CF-Connecting-IP 头，包含真实客户端 IP)
localhost:3001 (nginx)
    ↓ (传递 CF-Connecting-IP 到后端)
localhost:13000 (后端)
    ↓
检查 CF-Connecting-IP 是否在白名单
    ↓
✅ 允许 / ❌ 拒绝
```

## 🛡️ 安全特性

1. **真实 IP 检测**：通过 Cloudflare 的 `CF-Connecting-IP` 头获取真实客户端 IP
2. **无法伪造**：Cloudflare Tunnel 确保 IP 头的真实性
3. **灵活配置**：支持单个 IP、IP 范围、CIDR 等多种格式
4. **登录不受限**：登录端点对所有 IP 开放，只有打卡等功能受限

## 🔍 故障排除

### 问题：在诊所也无法访问

**原因**：诊所 IP 可能是动态的，已经变化

**解决**：
1. 查看后端日志获取当前 IP：
   ```bash
   docker logs clockingapp-server | grep "拒绝未授权IP访问"
   ```
2. 更新 `IP_WHITELIST` 为新的 IP
3. 重启服务

### 问题：诊所有多个出口 IP

**解决**：使用 CIDR 范围

如果诊所的 IP 在 `203.0.113.1` 到 `203.0.113.10` 之间：
```yaml
IP_WHITELIST: "203.0.113.0/28"  # 允许 203.0.113.0-203.0.113.15
```

### 问题：需要临时禁用 IP 限制

**解决**：
```yaml
IP_WHITELIST_ENABLED: false
```
然后重启服务：`docker-compose restart server`

## 📊 查看访问日志

```bash
# 查看被拒绝的 IP
docker logs clockingapp-server | grep "拒绝"

# 实时监控
docker logs -f clockingapp-server
```

## 🎯 下一步

1. 确认诊所的公网 IP 地址
2. 更新 `docker-compose.yml` 中的 `IP_WHITELIST`
3. 重新构建并启动服务
4. 在诊所测试登录和打卡功能
5. 在其他网络测试（应该被拒绝）

---

**注意**：配置 IP 白名单后，只有来自指定 IP 的用户才能使用打卡功能。请确保正确配置诊所的 IP 地址。

