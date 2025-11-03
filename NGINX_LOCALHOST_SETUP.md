# Nginx本地域名配置说明

## ✅ 已完成的配置

1. **添加了Nginx反向代理服务**
   - Nginx监听端口80（所有接口：localhost和局域网IP）
   - 前端和后端不再直接暴露端口，统一通过Nginx访问

2. **更新了所有配置使用localhost**
   - 前端API URL: `http://localhost/api`
   - 后端CORS配置: 允许 `http://localhost` 和 `http://localhost:80`
   - 不再依赖固定的IP地址

3. **服务架构**
   - Nginx (端口80) → 反向代理所有请求
   - 前端 (内部3001) → 通过Nginx访问
   - 后端API (内部13000) → 通过Nginx访问 `/api`

## 🌐 访问方式

### 方式1: 通过localhost访问（本机）
```
前端: http://localhost
后端API: http://localhost/api
```

### 方式2: 通过局域网IP访问（其他设备）
```
前端: http://<你的局域网IP>
后端API: http://<你的局域网IP>/api
```

查看你的局域网IP:
```bash
ipconfig getifaddr en0  # macOS
# 或
ifconfig | grep "inet " | grep -v 127.0.0.1  # Linux
```

## 📋 服务状态

检查服务状态:
```bash
docker-compose ps
```

查看日志:
```bash
docker-compose logs nginx
docker-compose logs server
docker-compose logs client
```

## 🔧 优势

1. **不依赖固定IP地址** - 使用localhost，IP变化也不影响
2. **统一访问入口** - 所有请求通过Nginx统一处理
3. **更安全** - 前端和后端不直接暴露端口
4. **易于扩展** - 后续可以添加SSL、域名等配置

## 📝 注意事项

- Nginx监听在端口80，如果80端口被占用，可以修改docker-compose.yml中的端口映射
- 局域网内其他设备可以通过你的Mac的局域网IP访问
- 如果80端口被占用，可以改为其他端口（如8080）

## 🔄 重启服务

如果需要重启服务:
```bash
docker-compose restart
```

如果需要重建并重启:
```bash
docker-compose down
docker-compose up -d --build
```

