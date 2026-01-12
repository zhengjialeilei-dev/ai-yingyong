# 📤 文件上传与数据库更新指南

## ✅ 确认：上传功能已实现数据库更新

你的上传功能**已经完全实现**了数据库更新！每次上传文件时，系统会：

1. ✅ **上传文件到 Supabase Storage**（存储文件）
2. ✅ **获取文件的公开 URL**
3. ✅ **将数据插入到 Supabase 数据库**（保存元数据）

---

## 🔄 上传流程详解

### AI赋能 / 互动工具（HTML 文件）

**上传步骤：**
1. 上传 HTML 文件 → 存储到 `ai-apps/apps/` 目录
2. 上传封面图片 → 压缩为 WebP 格式 → 存储到 `ai-apps/images/` 目录
3. **插入数据库** → 写入 `resources` 表，包含：
   - `title` - 标题
   - `description` - 描述
   - `category` - 分类
   - `grade` - 年级
   - `image_url` - 封面图片 URL
   - `file_path` - HTML 文件 URL
   - `resource_type` - 资源类型（'html'）

### 教学专区（PDF/Word/PPT）

**上传步骤：**
1. 上传文档文件 → 存储到 `teaching/{zone}/` 目录
2. **插入数据库** → 写入 `teaching_resources` 表，包含：
   - `title` - 标题
   - `description` - 描述
   - `zone` - 区域（课标/课本/教案/课件）
   - `file_url` - 文件 URL
   - `file_type` - 文件类型（pdf/doc/ppt）

---

## 🔍 如何验证数据是否写入数据库

### 方法 1: 查看上传成功消息

上传成功后，页面会显示：
```
✅ AI赋能：上传成功！数据已写入数据库 (ID: abc12345...)
```

如果看到这个消息，说明数据已经成功写入数据库！

### 方法 2: 访问测试页面

访问 `/test-connection` 页面：
```
https://你的域名.vercel.app/test-connection
```

这个页面会显示：
- Resources 表的记录数
- Teaching Resources 表的记录数
- 如果记录数增加了，说明数据写入成功

### 方法 3: 在前台页面查看

上传后，访问对应的前台页面：
- **AI赋能** → 访问首页 `/`，查看是否出现新资源
- **互动工具** → 访问 `/empower`，查看是否出现新资源
- **教学专区** → 访问 `/teaching-zone`，选择对应区域查看

### 方法 4: 直接在 Supabase 查看

1. 登录 Supabase Dashboard
2. 进入你的项目
3. 点击左侧 `Table Editor`
4. 选择 `resources` 或 `teaching_resources` 表
5. 查看最新记录

---

## ⚠️ 如果上传失败怎么办？

### 常见错误及解决方案

#### 1. "数据库写入失败: permission denied"
**原因：** Supabase RLS（行级安全）策略不允许插入操作

**解决：**
1. 登录 Supabase Dashboard
2. 进入 `Authentication` → `Policies`
3. 为 `resources` 表添加 INSERT 策略：
   ```sql
   CREATE POLICY "Allow public insert" ON resources
   FOR INSERT WITH CHECK (true);
   ```
4. 为 `teaching_resources` 表添加 INSERT 策略：
   ```sql
   CREATE POLICY "Allow public insert" ON teaching_resources
   FOR INSERT WITH CHECK (true);
   ```

#### 2. "Invalid key" 错误
**原因：** 文件名包含特殊字符或中文

**解决：** 代码已自动处理，使用时间戳+随机字符串生成安全文件名

#### 3. "Storage bucket not found"
**原因：** 存储桶未创建或名称错误

**解决：**
1. 在 Supabase Dashboard 中创建存储桶：
   - `ai-apps`（公开）
   - `teaching`（公开）
2. 确保存储桶设置为公开访问

---

## 📊 数据库表结构

### `resources` 表（AI赋能和互动工具）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键（自动生成）|
| title | TEXT | 标题 |
| description | TEXT | 描述 |
| category | TEXT | 分类 |
| grade | TEXT | 年级 |
| image_url | TEXT | 封面图片 URL |
| file_path | TEXT | HTML 文件 URL |
| resource_type | TEXT | 资源类型（'html' 或 'react'）|
| route_path | TEXT | React 路由路径（可选）|
| created_at | TIMESTAMP | 创建时间（自动生成）|

### `teaching_resources` 表（教学专区）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键（自动生成）|
| title | TEXT | 标题 |
| description | TEXT | 描述 |
| zone | TEXT | 区域（standard/textbook/plan/courseware）|
| file_url | TEXT | 文件 URL |
| file_type | TEXT | 文件类型（pdf/doc/ppt/html）|
| image_url | TEXT | 封面图片 URL（HTML 资源需要）|
| created_at | TIMESTAMP | 创建时间（自动生成）|

---

## 🎯 最佳实践

### ✅ 上传前检查

- [ ] 文件格式正确（HTML 或 PDF/Word/PPT）
- [ ] 封面图片清晰（会自动压缩为 WebP）
- [ ] 标题和描述填写完整
- [ ] 分类和年级选择正确

### ✅ 上传后验证

- [ ] 查看成功消息（包含数据库 ID）
- [ ] 在前台页面确认资源已显示
- [ ] 测试资源是否可以正常打开

### ✅ 定期检查

- [ ] 使用 `/test-connection` 页面检查连接状态
- [ ] 在 Supabase Dashboard 查看数据记录
- [ ] 检查存储桶中的文件是否正常

---

## 💡 技术细节

### 上传函数返回的数据

上传成功后，函数会返回插入的数据对象：
```typescript
{
  id: "uuid-string",
  title: "资源标题",
  description: "资源描述",
  // ... 其他字段
}
```

### 错误处理

如果数据库插入失败，错误信息会显示：
- 具体的错误原因
- RLS 策略相关的提示
- 控制台会记录详细的错误日志（F12 查看）

---

## 🚀 快速测试

1. **上传一个测试资源**
   - 进入管理员后台
   - 选择一个分类上传文件
   - 查看成功消息

2. **验证数据写入**
   - 访问 `/test-connection` 页面
   - 查看记录数是否增加

3. **在前台查看**
   - 访问对应的前台页面
   - 确认新资源已显示

---

**🎉 总结：你的上传功能已经完全实现了数据库更新！每次上传都会自动将数据写入 Supabase 数据库。**

