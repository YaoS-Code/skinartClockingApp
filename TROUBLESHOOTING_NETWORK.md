# Docker 网络连接问题排查

## 🔍 当前问题

无法从 Docker Hub 拉取镜像，错误信息：
```
dial tcp 44.206.182.249:443: connect: connection refused
```

## 🔧 解决方案

### 方案1: 等待网络恢复后重试

网络连接可能暂时不稳定，可以稍后重试：

```bash
cd /Users/yaosong/Apps/skinartClockingApp
docker-compose up -d --build
```

### 方案2: 使用代理（如果配置了代理）

如果你使用代理服务器，需要配置 Docker 使用代理：

**macOS Docker Desktop:**
1. 打开 Docker Desktop
2. 进入 Settings > Resources > Proxies
3. 配置 HTTP/HTTPS 代理

**命令行配置:**
```bash
# 创建 Docker 配置文件
mkdir -p ~/.docker
cat > ~/.docker/config.json << EOF
{
  "proxies": {
    "default": {
      "httpProxy": "http://your-proxy:port",
      "httpsProxy": "http://your-proxy:port",
      "noProxy": "localhost,127.0.0.1"
    }
  }
}
EOF
```

### 方案3: 使用国内镜像源（如果有）

如果是网络限制，可以考虑使用镜像加速器（需配置）。

### 方案4: 检查防火墙设置

确保防火墙允许 Docker 连接到外部网络：

```bash
# 检查防火墙状态
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
```

### 方案5: 重启 Docker 服务

有时重启 Docker 可以解决连接问题：

```bash
# 重启 Docker Desktop (如果在使用)
# 或重启 Docker daemon
sudo killall Docker && open -a Docker
```

## 📋 检查步骤

1. **检查网络连接:**
   ```bash
   curl -I https://registry-1.docker.io
   ping registry-1.docker.io
   ```

2. **检查 Docker 配置:**
   ```bash
   docker info | grep -i proxy
   ```

3. **查看 Docker 日志:**
   ```bash
   docker info
   ```

## 🚀 临时解决方案

如果网络问题持续，可以先使用现有的容器（如果有的话）：

```bash
# 检查是否有本地镜像
docker images

# 如果有镜像，可以尝试直接启动
docker-compose up -d
```

## 💡 建议

1. **等待几分钟后重试** - 网络问题可能是暂时的
2. **检查网络设置** - 确保可以访问互联网
3. **联系网络管理员** - 如果是在企业网络环境中，可能需要配置代理

等待网络恢复后，再次运行：
```bash
docker-compose up -d --build
```

