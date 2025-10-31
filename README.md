# SkinartMD 考勤打卡系统

专为SkinartMD诊所设计的员工考勤打卡管理系统，支持时间记录管理和管理员功能。

## 🚀 Docker快速部署（推荐）

使用Docker可以快速在Mac Mini上部署整个系统：

```bash
# 1. 创建.env文件（参考docker-compose.yml中的环境变量）
# 2. 启动所有服务
docker-compose up -d

# 3. 查看日志
docker-compose logs -f

# 4. 访问应用
# 前端: http://Mac_Mini的IP:3001
# API: http://Mac_Mini的IP:13000/api
```

**详细Docker部署指南**: [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)

## 功能特性

- ✅ 员工打卡管理（上班/下班）
- ✅ 工作时间自动计算（含休息时间扣除）
- ✅ 管理员用户管理
- ✅ 打卡记录查看和编辑
- ✅ 审计日志追踪
- ✅ **IP白名单访问控制**（仅允许局域网访问）
- ✅ **Docker容器化部署**（一键启动所有服务）

## 快速开始

### 环境要求

- Node.js (v14+)
- MySQL (v8.0+)
- Docker & Docker Compose（用于容器化部署）

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd clockingApp
```

2. **后端设置**
```bash
cd server
npm install
cp .env.example .env
# 编辑 .env 文件配置数据库和其他设置
npm run init-db
npm start
```

3. **前端设置**
```bash
cd client
npm install
npm start
```

## IP白名单配置

为了在云端部署时保护系统安全，可以启用IP白名单功能，只允许特定IP地址访问。

### Mac Mini 本地局域网部署（推荐）

如果您要在Mac Mini上部署，只允许局域网访问，最简单的配置：

```env
IP_WHITELIST_ENABLED=true
IP_WHITELIST_LOCAL_ONLY=true
```

这会自动允许所有局域网设备访问，拒绝公网IP。无需手动配置IP地址！

**详细部署指南**: [Mac Mini部署文档](server/MAC_MINI_DEPLOYMENT.md)

### 自定义IP白名单配置

1. 在 `server/.env` 文件中设置：
```env
IP_WHITELIST_ENABLED=true
IP_WHITELIST="203.0.113.0/24,192.168.1.100"
```

2. 支持的配置格式：
- **单个IP**: `192.168.1.100`
- **CIDR格式**: `192.168.1.0/24` (推荐)
- **IP段格式**: `192.168.1.0-192.168.1.255`

3. 多个IP用逗号分隔

详细配置说明请参考: [IP白名单配置文档](server/IP_WHITELIST_CONFIG.md)

## 默认账户

- **用户名**: manager
- **密码**: 8780
- **角色**: admin

## 技术栈

### 后端
- Node.js + Express.js
- MySQL
- JWT认证
- bcryptjs密码加密

### 前端
- React 18.2.0
- Material-UI (MUI)
- Redux Toolkit
- React Router

## 部署

推荐通过Docker进行部署，相关说明见上文及 [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)。

## 许可证

[根据项目情况添加许可证信息]

