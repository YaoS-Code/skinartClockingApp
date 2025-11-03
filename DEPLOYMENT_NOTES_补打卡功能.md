# 补打卡和通知功能部署说明

## 部署日期
2025年11月3日

## 已完成的工作

### ✅ 1. 数据库备份
- 备份文件位置: `backups/clockingapp_backup_YYYYMMDD_HHMMSS.sql`
- 备份已成功完成

### ✅ 2. 数据库迁移
新增两个数据库表：

#### clock_requests 表（补打卡申请）
- id: 主键
- user_id: 申请人ID
- request_type: 申请类型（clock_in/clock_out）
- request_date: 申请日期
- request_time: 申请时间
- reason: 申请原因
- status: 状态（pending/approved/rejected）
- admin_id: 审批管理员ID
- admin_note: 管理员备注
- reviewed_at: 审批时间
- created_at, updated_at: 时间戳

#### notifications 表（通知）
- id: 主键
- user_id: 接收用户ID
- type: 通知类型
- title: 标题
- message: 消息内容
- related_id: 关联ID（如申请ID）
- is_read: 是否已读
- created_at: 创建时间
- read_at: 阅读时间

### ✅ 3. 后端API实现

#### 补打卡申请API (`/api/clock-requests`)
- POST `/` - 创建补打卡申请（无地域限制）
- GET `/my` - 获取当前用户的申请列表
- GET `/all` - 获取所有申请（管理员）
- POST `/:requestId/review` - 审批申请（管理员）
- DELETE `/:requestId` - 删除pending状态的申请

#### 通知API (`/api/notifications`)
- GET `/` - 获取通知列表
- GET `/unread-count` - 获取未读数量
- PATCH `/:notificationId/read` - 标记为已读
- PATCH `/read-all` - 全部标记为已读
- DELETE `/:notificationId` - 删除通知
- DELETE `/clear/read` - 清空已读通知

### ✅ 4. 前端组件实现

#### 员工端组件
- `ClockRequestForm.jsx` - 补打卡申请表单
- `MyClockRequests.jsx` - 我的申请列表

#### 管理员端组件
- `ClockRequestsManagement.jsx` - 补打卡审批管理

#### 通用组件
- `NotificationMenu.jsx` - 通知菜单（带未读数量badge）
- 已集成到 Navbar 和 AdminNavbar

#### 路由配置
- `/clock-requests` - 员工补打卡页面
- `/admin/clock-requests` - 管理员审批页面

## ⚠️ 待完成的工作

### 前端构建
由于Mac Mini内存限制，React应用构建失败。需要在有更多内存的机器上完成构建：

```bash
# 在有足够内存的机器上执行（建议至少4GB可用内存）
cd /Users/yaosong/Apps/skinartClockingApp/client
NODE_OPTIONS='--max-old-space-size=3072' GENERATE_SOURCEMAP=false npm run build

# 构建完成后，将build文件夹复制到服务器
# 然后重新构建并启动client容器
cd /Users/yaosong/Apps/skinartClockingApp
docker-compose up -d --build client
```

## 功能特性

### 补打卡申请流程
1. 员工提交补打卡申请（无地域限制，不需要GPS定位）
2. 系统自动通知所有管理员
3. 管理员审批（批准/拒绝）并可添加备注
4. 批准后自动创建打卡记录
5. 系统通知员工审批结果

### 通知系统
- 实时显示未读通知数量
- 支持标记已读/未读
- 支持删除通知
- 自动30秒刷新未读数量
- 通知类型：
  - clock_request: 新的补打卡申请（通知管理员）
  - clock_request_approved: 申请已批准（通知员工）
  - clock_request_rejected: 申请已拒绝（通知员工）

## 当前状态

✅ 后端API：已部署并运行
✅ 数据库：已迁移
✅ 前端代码：已完成
⚠️ 前端构建：需要在更大内存的机器上完成

## 临时解决方案

如果急需测试功能，可以：

1. 在本地开发环境运行前端：
```bash
cd /Users/yaosong/Apps/skinartClockingApp/client
npm start
```

2. 或在另一台有足够内存的机器上构建，然后部署到Mac Mini

## 下一步

1. 在有足够内存的机器上完成前端构建
2. 部署并测试所有功能
3. 验证补打卡申请流程
4. 验证通知系统

## 技术说明

### 内存优化建议
如果需要在Mac Mini上构建，可以：
1. 关闭其他应用程序
2. 临时停止MySQL和Server容器
3. 增加swap空间
4. 使用 `GENERATE_SOURCEMAP=false` 减少内存使用

### API测试
后端API可以直接通过curl测试：
```bash
# 测试创建补打卡申请
curl -X POST http://clock.skinartmd.ca/api/clock-requests \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "request_type": "clock_in",
    "request_date": "2025-11-03",
    "request_time": "09:00",
    "reason": "忘记打卡"
  }'

# 测试获取通知
curl http://clock.skinartmd.ca/api/notifications/unread-count \
  -H "Authorization: Bearer YOUR_TOKEN"
```

