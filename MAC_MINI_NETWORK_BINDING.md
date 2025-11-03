# Mac Mini 网络绑定说明

## 📋 当前配置

Nginx 服务已配置为监听所有网络接口（`0.0.0.0:80`），这意味着：

- ✅ 可以通过 Mac Mini 的局域网 IP `192.168.1.96` 访问
- ✅ 可以通过 `localhost` 访问
- ✅ 局域网内所有设备都可以通过 `192.168.1.96` 访问

## 🔧 Docker 端口绑定说明

在 Docker Compose 中，端口映射格式为：
```yaml
ports:
  - "80:80"  # 监听所有接口 (0.0.0.0:80)
```

这个配置会让 Nginx 监听 Mac Mini 上的所有网络接口，包括：
- `127.0.0.1` (localhost)
- `192.168.1.96` (局域网IP)
- 其他可用的网络接口

## 🌐 访问方式

配置完成后，可以通过以下方式访问：

1. **通过局域网 IP**:
   ```
   http://192.168.1.96
   ```

2. **通过域名（需配置 hosts）**:
   ```
   http://clock.skinartmd.ca
   ```
   在 hosts 文件中添加: `192.168.1.96  clock.skinartmd.ca`

3. **通过 localhost**:
   ```
   http://localhost
   ```

## 🔒 安全限制

虽然 Nginx 监听所有接口，但有以下安全措施：

1. **IP 白名单中间件**: 仅允许私有IP（局域网IP）访问
   - ✅ 允许: `192.168.x.x`, `10.x.x.x`, `172.16.x.x` - `172.31.x.x`
   - ❌ 拒绝: Tailscale IP (`100.x.x.x`), 公网IP

2. **CORS 配置**: 仅允许来自配置的域名的请求

## 📝 注意事项

1. **端口80占用**: 如果80端口被其他服务占用，可以修改为其他端口，例如：
   ```yaml
   ports:
     - "8080:80"  # 通过 192.168.1.96:8080 访问
   ```

2. **查看当前IP**: 
   ```bash
   ipconfig getifaddr en0
   ```

3. **如果IP地址变化**: 更新所有设备的 hosts 文件中的 IP 地址

## 🚀 验证配置

检查 Nginx 是否正常运行：
```bash
docker-compose ps nginx
```

测试访问：
```bash
curl http://192.168.1.96
curl http://localhost
```

查看日志：
```bash
docker-compose logs nginx
```

