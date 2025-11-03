# 🎉 SkinartMD 考勤系统部署成功！

## ✅ 部署状态

**部署时间**: 2025年10月31日  
**部署位置**: Mac Mini (192.168.1.96)  
**Docker 环境**: Colima (2核CPU, 2GB内存)

## 📊 服务状态

所有服务已成功启动并运行：

| 服务 | 容器名 | 状态 | 端口 | 访问地址 |
|------|--------|------|------|----------|
| MySQL数据库 | clockingapp-mysql | ✅ Healthy | 3306 | 内部访问 |
| 后端API | clockingapp-server | ✅ Running | 13000 | http://192.168.1.96:13000 |
| 前端界面 | clockingapp-client | ✅ Healthy | 3001 | http://192.168.1.96:3001 |

## 🌐 访问地址

### 前端界面（用户界面）
```
http://192.168.1.96:3001
```

### 后端API
```
http://192.168.1.96:13000/api
```

## 🔐 默认管理员账户

- **用户名**: `manager`
- **密码**: `8780`
- **角色**: admin

## 📝 数据库信息

- **数据库名**: clockingapp
- **用户名**: clockingapp_user
- **端口**: 3306
- **数据持久化**: Docker volume `skinartclockingapp_mysql_data`

数据库已自动初始化，包含：
- ✅ 用户表
- ✅ 打卡记录表
- ✅ 审计日志表
- ✅ 默认管理员账户

## 🛠️ 常用命令

### 查看服务状态
```bash
cd /Users/yaosong/Apps/skinartClockingApp
eval "$(/opt/homebrew/bin/brew shellenv)"
docker-compose ps
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f server    # 后端日志
docker-compose logs -f client    # 前端日志
docker-compose logs -f mysql     # 数据库日志
```

### 停止服务
```bash
docker-compose stop
```

### 启动服务
```bash
docker-compose start
```

### 重启服务
```bash
docker-compose restart
```

### 完全停止并删除（保留数据）
```bash
docker-compose down
```

### 完全删除（包括数据，谨慎使用！）
```bash
docker-compose down -v
```

## 🔧 配置说明

### IP白名单配置
- **状态**: 已启用局域网访问 (`IP_WHITELIST_LOCAL_ONLY=true`)
- **说明**: 允许所有局域网设备访问，拒绝公网IP

### CORS配置
- **前端地址**: http://192.168.1.96:3001
- **API地址**: http://192.168.1.96:13000

## 📦 Docker资源使用

- **Colima配置**: 2核CPU, 2GB内存
- **MySQL容器**: ~200MB
- **后端容器**: ~150MB
- **前端容器**: ~100MB
- **总计**: ~450MB（适合简单应用）

## 🚀 下一步

1. **访问前端界面**: 在浏览器中打开 http://192.168.1.96:3001
2. **登录系统**: 使用默认管理员账户登录
3. **测试功能**: 测试打卡、记录查看等功能
4. **配置用户**: 创建员工账户

## 🔍 故障排除

### 如果无法访问前端

1. **检查服务状态**:
```bash
docker-compose ps
```

2. **检查端口占用**:
```bash
lsof -i :3001
lsof -i :13000
```

3. **查看日志**:
```bash
docker-compose logs client
docker-compose logs server
```

### 如果数据库连接失败

1. **检查MySQL是否健康**:
```bash
docker-compose ps mysql
```

2. **查看MySQL日志**:
```bash
docker-compose logs mysql
```

3. **重启MySQL**:
```bash
docker-compose restart mysql
```

### 如果需要修改配置

编辑 `docker-compose.yml` 文件，然后重启服务：
```bash
docker-compose down
docker-compose up -d
```

## 📚 相关文档

- [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) - 详细部署指南
- [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) - 项目文档
- [README.md](README.md) - 项目说明

## ✨ 部署完成！

系统已成功部署，可以开始使用了！



