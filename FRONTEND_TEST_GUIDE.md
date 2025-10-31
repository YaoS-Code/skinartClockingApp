# 前端打卡功能测试指南

## 当前状态
- ✅ 后端API完全正常
- ✅ 数据库配置正确（break_minutes默认30分钟）
- ✅ 前端已重新构建并部署

## 测试步骤

### 1. 清除浏览器缓存
**重要：必须硬刷新页面以加载最新代码**
- Chrome/Edge: `Cmd + Shift + R` (Mac) 或 `Ctrl + Shift + R` (Windows)
- 或者打开开发者工具 (F12) → Network 标签 → 勾选 "Disable cache" → 刷新页面

### 2. 登录测试账户
访问: http://localhost:3001

测试账户:
- 用户名: `testuser`
- 密码: `test1234`

管理员账户:
- 用户名: `manager`
- 密码: `8780`

### 3. 测试打卡功能

#### 打卡入 (Clock In)
1. 登录后应该看到 "Clock In" 页面
2. 在 Notes 输入框填写备注（可选）
3. 点击 "CLOCK IN" 按钮
4. 应该显示成功消息和打卡时间

#### 打卡出 (Clock Out)
1. 打卡入后页面会显示 "Currently Clocked In"
2. 可以看到打卡时间（格式：YYYY-MM-DD HH:mm:ss）
3. Break Minutes 输入框显示默认值 30（可修改）
4. 在 Notes 输入框填写备注（可选）
5. 点击 "CLOCK OUT" 按钮
6. 应该自动跳转到记录页面

#### 查看记录
1. 点击顶部导航栏的 "RECORDS"
2. 选择日期范围（今天是 2025-10-31）
3. 应该能看到刚才的打卡记录
4. 记录包含：日期、打卡时间、下班时间、工时、休息时间、备注

## 如果前端仍然无法打卡

### 检查项：

1. **检查浏览器控制台错误**
   - 按 F12 打开开发者工具
   - 切换到 Console 标签
   - 尝试打卡并查看是否有红色错误信息
   - 截图发送错误信息

2. **检查网络请求**
   - F12 → Network 标签
   - 尝试打卡
   - 查看是否有失败的请求（红色）
   - 点击失败的请求查看详情

3. **验证API可达性**
   在浏览器控制台(Console)运行：
   ```javascript
   fetch('http://localhost:13000/api/auth/login', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({username: 'testuser', password: 'test1234'})
   }).then(r => r.json()).then(console.log)
   ```
   应该返回包含 token 的对象

## 后端API验证（命令行）

如果前端有问题，可以通过命令行验证后端功能正常：

```bash
# 登录获取token
TOKEN=$(curl -s -X POST http://localhost:13000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test1234"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 打卡入
curl -X POST http://localhost:13000/api/clock/in \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"测试"}'

# 查询状态
curl -X GET http://localhost:13000/api/clock/status \
  -H "Authorization: Bearer $TOKEN"

# 打卡出
curl -X POST http://localhost:13000/api/clock/out \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"完成","break_minutes":30}'
```

## 配置详情

- 前端地址: http://localhost:3001
- 后端API: http://localhost:13000/api
- 数据库: MySQL (Docker容器)
- 休息时间默认值: 30分钟（可在打卡出时修改）

## 最近修复
1. ✅ 日期显示问题（Invalid Date）
2. ✅ 工时计算问题（负数）
3. ✅ 休息时间默认值设置为30分钟
4. ✅ 前后端API通信
5. ✅ 打卡状态实时刷新

