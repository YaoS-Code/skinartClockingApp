# 本地域名配置说明

## 已完成的配置
- ✅ 更新了 docker-compose.yml 中的 CORS 配置
- ✅ 更新了前端 API URL 配置
- ✅ 更新了服务器默认 CORS 配置

## 需要手动完成的步骤

### 1. 添加本地域名映射（必需）

请在终端中运行以下命令（需要输入密码）：

```bash
sudo sh -c 'echo "192.168.1.96  clock.skinartmd.ca" >> /etc/hosts'
```

或者手动编辑 `/etc/hosts` 文件，添加以下一行：

```
192.168.1.96  clock.skinartmd.ca
```

### 2. 验证域名映射

运行以下命令验证：

```bash
ping clock.skinartmd.ca
```

应该能看到响应来自 `192.168.1.96`。

### 3. 访问应用

配置完成后，可以通过以下地址访问：
- 前端：http://clock.skinartmd.ca:3001
- 后端API：http://clock.skinartmd.ca:13000/api

## 注意事项

- 如果修改 hosts 文件后无法访问，请清除浏览器缓存或使用隐私模式
- 确保防火墙允许访问 3001 和 13000 端口
- 如需在其他设备上使用此域名，需要在每台设备的 hosts 文件中添加相同映射

