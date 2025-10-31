# Mac Mini 本地局域网部署指南

## 概述

本指南帮助您在Mac Mini上部署ClockingApp，并配置为仅允许本地局域网访问。

## 部署前准备

### 1. 检查Mac Mini的IP地址

在Mac Mini上打开终端，运行：

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

或使用：

```bash
ipconfig getifaddr en0
```

常见的局域网IP地址格式：
- `192.168.x.x` (最常见)
- `10.x.x.x`
- `172.16.x.x - 172.31.x.x`

### 2. 检查局域网网段

查看路由器分配的IP范围，通常在路由器管理界面可以看到：
- 例如：`192.168.1.1 - 192.168.1.254`
- 网段：`192.168.1.0/24`

## 配置方案

### 方案1: 仅允许局域网访问（推荐，最简单）

在 `server/.env` 文件中配置：

```env
# 启用IP白名单
IP_WHITELIST_ENABLED=true

# 仅允许局域网IP访问（自动允许所有私有IP）
IP_WHITELIST_LOCAL_ONLY=true
```

**优点**：
- 配置简单，只需两行
- 自动允许所有局域网设备访问
- 自动拒绝所有公网IP访问
- 无需手动添加每个设备的IP

**说明**：
- 会自动允许以下私有IP段：
  - `192.168.0.0/16` (192.168.0.0 - 192.168.255.255)
  - `10.0.0.0/8` (10.0.0.0 - 10.255.255.255)
  - `172.16.0.0/12` (172.16.0.0 - 172.31.255.255)
  - `127.0.0.0/8` (本地回环地址)
  - `169.254.0.0/16` (链路本地地址)

### 方案2: 指定局域网IP段

如果您的局域网是 `192.168.1.0/24`，配置：

```env
IP_WHITELIST_ENABLED=true
IP_WHITELIST="192.168.1.0/24,127.0.0.1,::1"
```

### 方案3: 仅允许特定IP地址

如果您只想允许几个特定设备访问：

```env
IP_WHITELIST_ENABLED=true
IP_WHITELIST="192.168.1.100,192.168.1.101,192.168.1.102"
```

## 完整部署步骤

### 1. 安装Node.js和MySQL

```bash
# 检查Node.js版本（需要v14+）
node --version

# 如果没有安装，使用Homebrew安装
brew install node

# 安装MySQL
brew install mysql
brew services start mysql
```

### 2. 配置数据库

```bash
cd server
npm install

# 创建.env文件
cp .env.example .env

# 编辑.env文件，配置数据库和IP白名单
nano .env
```

`.env` 文件示例：

```env
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=clockingapp
DB_PORT=3306

# JWT密钥
JWT_SECRET=your_secret_key_here

# 服务器配置
PORT=13000
NODE_ENV=production

# IP白名单配置（仅允许局域网）
IP_WHITELIST_ENABLED=true
IP_WHITELIST_LOCAL_ONLY=true
```

### 3. 初始化数据库

```bash
npm run init-db
```

### 4. 构建前端

```bash
cd ../client
npm install
npm run build
```

### 5. 配置PM2启动

在项目根目录的 `ecosystem.config.js` 中确认配置：

```javascript
module.exports = {
  apps: [
    {
      name: 'client',
      script: 'serve',
      env: {
        PM2_SERVE_PATH: './client/build',
        PM2_SERVE_PORT: 3001,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html'
      }
    },
    {
      name: 'server',
      script: './server/src/app.js',
      env: {
        PORT: 13000,
        NODE_ENV: 'production'
      }
    }
  ]
};
```

### 6. 启动服务

```bash
# 安装PM2（如果还没有）
npm install -g pm2

# 启动服务
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 设置开机自启
pm2 startup
pm2 save
```

### 7. 测试访问

在局域网内的其他设备上访问：

```
http://Mac_Mini的IP地址:3001
```

例如：
```
http://192.168.1.50:3001
```

## 防火墙配置

Mac Mini可能需要配置防火墙规则：

### 方法1: 使用系统设置

1. 打开"系统设置" > "网络" > "防火墙"
2. 点击"选项"
3. 添加端口规则：
   - 端口：3001 (前端)
   - 端口：13000 (后端API)
   - 允许传入连接

### 方法2: 使用命令行

```bash
# 允许端口3001
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node

# 或者临时关闭防火墙测试（不推荐）
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
```

## 常见局域网IP段

| IP段 | 说明 | CIDR格式 |
|------|------|----------|
| 192.168.1.x | 最常见的家用路由器 | 192.168.1.0/24 |
| 192.168.0.x | 另一种常见配置 | 192.168.0.0/24 |
| 10.0.0.x | 企业网络常用 | 10.0.0.0/24 |
| 172.16.x.x | 较少见 | 172.16.0.0/12 |

## 验证配置

### 1. 检查服务器日志

```bash
pm2 logs server
```

应该看到类似输出：
```
IP白名单配置完成: 0个单个IP, 0个IP范围
仅允许局域网访问模式已启用
```

### 2. 从局域网设备测试

在同一局域网的其他设备上：
- 打开浏览器访问 `http://Mac_Mini_IP:3001`
- 应该能正常访问登录页面

### 3. 测试公网IP访问（应该被拒绝）

如果从外网访问，应该返回403错误。

## 故障排除

### 问题1: 无法访问服务器

**检查项**：
1. Mac Mini防火墙是否允许端口3001和13000
2. 路由器是否阻止了端口转发（如果通过外网访问）
3. IP白名单配置是否正确

**解决方法**：
```bash
# 检查端口是否监听
lsof -i :3001
lsof -i :13000

# 检查PM2状态
pm2 status
pm2 logs
```

### 问题2: 局域网设备被拒绝访问

**检查项**：
1. 确认设备IP是否在局域网IP段内
2. 检查 `.env` 文件中的 `IP_WHITELIST_LOCAL_ONLY` 设置

**解决方法**：
```bash
# 查看服务器日志中的IP地址
pm2 logs server | grep "拒绝"

# 临时禁用IP白名单测试
# 在.env中设置: IP_WHITELIST_ENABLED=false
pm2 restart server
```

### 问题3: 无法获取真实IP

如果Mac Mini前面有路由器或代理：

1. 确认 `app.js` 中设置了 `app.set('trust proxy', true)`
2. 检查路由器是否配置了正确的代理头

## 安全建议

1. **使用HTTPS**（可选）：
   - 使用Nginx反向代理配置SSL证书
   - 或使用Let's Encrypt免费证书

2. **定期更新**：
   - 保持Node.js和依赖包更新
   - 定期检查安全漏洞

3. **数据库安全**：
   - 使用强密码
   - 限制MySQL只监听localhost

4. **系统安全**：
   - 启用Mac系统自动更新
   - 使用强密码保护Mac Mini

## 访问地址

部署完成后，局域网内设备可以通过以下地址访问：

- **前端界面**: `http://Mac_Mini_IP:3001`
- **API接口**: `http://Mac_Mini_IP:13000/api`

**默认管理员账户**：
- 用户名: `manager`
- 密码: `8780`

## 下一步

部署完成后，建议：
1. 修改默认管理员密码
2. 创建员工账户
3. 测试打卡功能
4. 配置定期数据库备份

---

*如有问题，请查看主文档 [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)*

