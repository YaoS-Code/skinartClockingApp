# 配置 clock.skinartmd.ca 域名访问（仅限本地局域网）

## 📋 配置说明

应用已配置为使用 `clock.skinartmd.ca` 域名访问，但需要在每台设备的 hosts 文件中添加域名映射。

**重要**: 此配置**仅允许本地局域网访问**，不支持 Tailscale 或其他 VPN 网络访问。所有访问必须来自同一局域网内的设备。

## 🔒 安全设置

- ✅ IP 白名单已启用，仅允许私有IP（局域网IP）访问
- ✅ CORS 配置仅支持域名和 localhost
- ✅ 拒绝公网 IP 和 VPN 网络 IP（如 Tailscale）访问

## 🔧 配置步骤

### macOS / Linux 系统

1. **打开终端**

2. **编辑 hosts 文件**（需要管理员权限）:
   ```bash
   sudo nano /etc/hosts
   ```
   或
   ```bash
   sudo vi /etc/hosts
   ```

3. **添加以下行**（使用Mac的局域网IP）:
   ```
   192.168.1.96  clock.skinartmd.ca
   ```
   
   将 `192.168.1.96` 替换为你Mac的实际局域网IP地址（通常是 `192.168.x.x` 或 `10.x.x.x`）。

4. **保存文件**
   - nano: 按 `Ctrl+X`, 然后按 `Y`, 最后按 `Enter`
   - vi: 按 `Esc`, 输入 `:wq`, 然后按 `Enter`

5. **刷新DNS缓存** (macOS):
   ```bash
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   ```

### Windows 系统

1. **以管理员身份打开记事本**

2. **打开 hosts 文件**:
   - 路径: `C:\Windows\System32\drivers\etc\hosts`

3. **在文件末尾添加**（使用Mac的局域网IP）:
   ```
   192.168.1.96  clock.skinartmd.ca
   ```
   
   将 `192.168.1.96` 替换为你Mac的实际局域网IP地址（通常是 `192.168.x.x` 或 `10.x.x.x`）。

4. **保存文件**

5. **刷新DNS缓存**:
   ```cmd
   ipconfig /flushdns
   ```

## 🔍 查找Mac的局域网IP地址

在Mac上运行:
```bash
ipconfig getifaddr en0
```

或者在终端中运行:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

## ✅ 验证配置

配置完成后，在浏览器中访问:
```
http://clock.skinartmd.ca
```

如果配置正确，应该能看到登录页面。

### 使用ping命令测试:
```bash
ping clock.skinartmd.ca
```

应该看到响应来自你配置的IP地址。

## 📝 注意事项

1. **每台设备都需要配置** - 如果要在其他设备（手机、平板、其他电脑）上访问，需要在每台设备的 hosts 文件中添加相同的映射。

2. **仅限局域网访问** - 应用配置为**仅允许本地局域网访问**，不支持通过 Tailscale、VPN 或其他公网方式访问。

3. **局域网IP可能会变化** - 当Mac的IP地址改变时（例如连接到不同的WiFi网络），需要更新所有设备的 hosts 文件。

4. **安全设计** - IP 白名单中间件会自动拒绝：
   - 公网 IP 地址
   - VPN 网络 IP（如 Tailscale 的 100.x.x.x）
   - 所有非私有IP范围的地址

5. **如果局域网IP变化** - 可以通过以下方式查看新的IP:
   ```bash
   ipconfig getifaddr en0
   ```
   然后更新所有设备的 hosts 文件。

## 🌐 访问方式

配置完成后，可以通过以下方式访问:
- **前端**: `http://clock.skinartmd.ca`
- **后端API**: `http://clock.skinartmd.ca/api`

## 🔄 如果IP地址变化了

如果Mac的局域网IP地址发生了变化:

1. 查看新IP:
   ```bash
   ipconfig getifaddr en0
   ```

2. 更新所有使用该应用的设备的 hosts 文件（包括Mac本身和其他设备）

3. 不需要重启Docker容器，nginx会自动监听新的IP地址

## 🚀 快速设置脚本（仅限Mac）

在Mac上运行以下命令快速添加局域网IP映射（当前检测到的IP是 `192.168.1.96`）:
```bash
echo "192.168.1.96  clock.skinartmd.ca" | sudo tee -a /etc/hosts
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

**注意**: 
- 如果局域网IP地址不是 `192.168.1.96`，请先运行 `ipconfig getifaddr en0` 查看实际IP，然后替换上面的命令
- 确保使用Mac的局域网IP地址，不要使用 Tailscale 或其他 VPN 的 IP 地址

