# Docker环境变量配置说明

## 数据库密码配置

**重要**：数据库密码已更新，请使用以下密码：

### MySQL数据库密码

- **Root用户密码**: `SkinartMD_2024_Root!`
- **应用用户密码**: `SkinartMD_2024_DB!`
- **数据库用户**: `clockingapp_user`
- **数据库名称**: `clockingapp`

### 启动服务

使用新的密码启动服务：

```bash
# 方式1: 使用默认密码（已在docker-compose.yml中配置）
docker-compose up -d

# 方式2: 自定义密码
DB_PASSWORD=your_custom_password \
MYSQL_ROOT_PASSWORD=your_root_password \
docker-compose up -d
```

### 修改密码

如果需要修改密码：

1. **停止服务**：
```bash
docker-compose down
docker volume rm clockingapp_mysql_data
```

2. **修改docker-compose.yml中的密码**：
   - `MYSQL_ROOT_PASSWORD`: MySQL root密码
   - `MYSQL_PASSWORD`: 应用用户密码
   - `DB_PASSWORD`: 后端连接数据库的密码

3. **重新启动**：
```bash
docker-compose up -d
```

### 安全建议

- 生产环境请使用强密码
- 不要在代码仓库中提交真实密码
- 使用环境变量或密钥管理服务存储密码

