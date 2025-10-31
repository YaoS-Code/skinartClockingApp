# Docker部署指南 - SkinartMD考勤系统

## 概述

本指南介绍如何使用Docker在Mac Mini上部署SkinartMD考勤打卡系统。

## 前置要求

- Docker Desktop for Mac (已安装)
- Docker Compose (通常随Docker Desktop一起安装)

## 快速开始

### 1. 准备环境变量文件

在项目根目录创建 `.env` 文件：

```env
# 数据库配置
DB_USER=clockingapp_user
DB_PASSWORD=your_secure_password_here
DB_NAME=clockingapp

# JWT密钥（请更改为强密码）
JWT_SECRET=your_jwt_secret_key_change_this

# IP白名单配置（仅允许局域网访问）
IP_WHITELIST_ENABLED=true
IP_WHITELIST_LOCAL_ONLY=true

# CORS配置（根据实际访问地址调整）
CORS_ORIGIN=http://192.168.1.50:3001
```

### 2. 构建和启动服务

```bash
# 构建所有镜像
docker-compose build

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看服务状态
docker-compose ps
```

### 3. 访问应用

- **前端界面**: `http://Mac_Mini的IP地址:3001`
- **API接口**: `http://Mac_Mini的IP地址:13000/api`

**默认管理员账户**：
- 用户名: `manager`
- 密码: `8780`

## 常用命令

### 服务管理

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f server    # 后端日志
docker-compose logs -f client    # 前端日志
docker-compose logs -f mysql     # 数据库日志

# 查看所有日志
docker-compose logs -f
```

### 数据库操作

```bash
# 进入MySQL容器
docker-compose exec mysql mysql -u clockingapp_user -p clockingapp

# 备份数据库
docker-compose exec mysql mysqldump -u clockingapp_user -p clockingapp > backup.sql

# 恢复数据库
docker-compose exec -T mysql mysql -u clockingapp_user -p clockingapp < backup.sql
```

### 更新应用

```bash
# 停止服务
docker-compose down

# 重新构建镜像（如果有代码更改）
docker-compose build

# 启动服务
docker-compose up -d
```

## 服务说明

### MySQL数据库
- **容器名**: `clockingapp-mysql`
- **端口**: `3306`
- **数据持久化**: Docker volume `mysql_data`
- **自动初始化**: 首次启动会自动运行数据库初始化脚本

### 后端API服务
- **容器名**: `clockingapp-server`
- **端口**: `13000`
- **依赖**: MySQL服务（等待健康检查通过后启动）

### 前端服务
- **容器名**: `clockingapp-client`
- **端口**: `3001`
- **依赖**: 后端API服务

## 数据持久化

数据库数据存储在Docker volume中，即使删除容器也不会丢失数据：

```bash
# 查看volumes
docker volume ls

# 备份volume
docker run --rm -v clockingapp_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_backup.tar.gz /data

# 恢复volume
docker run --rm -v clockingapp_mysql_data:/data -v $(pwd):/backup alpine tar xzf /backup/mysql_backup.tar.gz -C /
```

## 网络配置

所有服务都在同一个Docker网络 `clockingapp-network` 中，可以通过服务名互相访问：
- 后端访问数据库: `mysql:3306`
- 前端访问后端: `server:13000`

## 故障排除

### 问题1: 端口已被占用

**解决方案**:
```bash
# 检查端口占用
lsof -i :3001
lsof -i :13000
lsof -i :3306

# 修改docker-compose.yml中的端口映射
ports:
  - "3002:3001"  # 改为其他端口
```

### 问题2: 数据库连接失败

**检查项**:
1. MySQL容器是否正常运行: `docker-compose ps`
2. 环境变量是否正确: `docker-compose exec server env | grep DB_`
3. 网络连接: `docker-compose exec server ping mysql`

**解决方案**:
```bash
# 查看MySQL日志
docker-compose logs mysql

# 重启MySQL服务
docker-compose restart mysql

# 等待MySQL完全启动后再启动后端
docker-compose up -d mysql
sleep 10
docker-compose up -d server
```

### ,: 前端无法访问后端API

**检查项**:
1. CORS配置是否正确
2. 后端服务是否正常运行
3. 网络连接是否正常

**解决方案**:
```bash
# 检查后端日志
docker-compose logs server

# 测试后端API
curl http://localhost:13000/api/auth/profile

# 检查CORS配置
docker-compose exec server env | grep CORS
```

### 问题4: IP白名单阻止访问

**解决方案**:
- 检查 `.env` 文件中的 `IP_WHITELIST_LOCAL_ONLY` 设置
- 确认访问IP是否为局域网IP
- 临时禁用IP白名单进行测试（不推荐生产环境）

## 生产环境建议

### 1. 安全配置

- **更改默认密码**: 修改 `.env` 中的所有默认密码
- **使用强JWT密钥**: 生成随机强密码作为JWT_SECRET
- **启用IP白名单**: 保持 `IP_WHITELIST_ENABLED=true`
- **限制数据库端口**: 生产环境可以不暴露3306端口到主机

### 2. 性能优化

```yaml
# 在docker-compose.yml中添加资源限制
services:
  server:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### 3. 日志管理

```bash
# 配置日志轮转
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 4. 定期备份

创建备份脚本 `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份数据库
docker-compose exec -T mysql mysqldump -u clockingapp_user -p$DB_PASSWORD clockingapp > $BACKUP_DIR/db_$DATE.sql

# 备份volumes
docker run --rm -v clockingapp_mysql_data:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/mysql_data_$DATE.tar.gz /data

echo "Backup completed: $BACKUP_DIR"
```

设置定时任务:
```bash
# 添加到crontab
0 2 * * * /path/to/backup.sh
```

## 更新应用代码

当需要更新应用代码时：

```bash
# 1. 停止服务
docker-compose down

# 2. 拉取最新代码（如果使用git）
git pull

# 3. 重新构建镜像
docker-compose build

# 4. 启动服务
docker-compose up -d

# 5. 查看日志确认启动成功
docker-compose logs -f
```

## 卸载

```bash
# 停止并删除容器
docker-compose down

# 删除volumes（会删除所有数据！）
docker-compose down -v

# 删除镜像
docker-compose down --rmi all
```

## 监控

### 查看资源使用

```bash
# 查看容器资源使用
docker stats

# 查看特定容器
docker stats clockingapp-server clockingapp-client clockingapp-mysql
```

### 健康检查

所有服务都配置了健康检查，可以通过以下命令查看：

```bash
docker inspect --format='{{.State.Health.Status}}' clockingapp-server
docker inspect --format='{{.State.Health.Status}}' clockingapp-client
docker inspect --format='{{.State.Health.Status}}' clockingapp-mysql
```

## 支持

如有问题，请查看：
- 主文档: [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)
- Mac Mini部署: [server/MAC_MINI_DEPLOYMENT.md](server/MAC_MINI_DEPLOYMENT.md)

