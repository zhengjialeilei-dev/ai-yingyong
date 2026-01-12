# 🚀 GitHub Desktop + Vercel 自动部署指南

## 📋 前置准备

### 1. 确保项目已连接到 GitHub 仓库

**如果还没有连接：**
1. 打开 GitHub Desktop
2. 点击 `File` → `Add Local Repository`
3. 选择你的项目文件夹 `C:\Users\p\Desktop\ed`
4. 如果提示需要创建仓库，点击 `Create a repository`
5. 填写仓库信息：
   - Name: `ai-yingyong` (或你想要的名称)
   - Description: 数智流 | MathFlow
   - 选择 `Public` 或 `Private`
   - ✅ 勾选 `Initialize this repository with a README` (如果还没有)
6. 点击 `Create Repository`

**如果已经连接：**
- 在 GitHub Desktop 中确认当前仓库显示为 `ai-yingyong`

---

## 🔄 日常更新流程（3步完成）

### 步骤 1: 在 GitHub Desktop 中提交更改

1. **查看更改**
   - 打开 GitHub Desktop
   - 左侧会显示所有更改的文件（绿色 + 号 = 新文件，黄色 = 修改的文件）

2. **填写提交信息**
   - 在左下角的 `Summary` 输入框填写简短描述，例如：
     - `修复管理员界面白屏问题`
     - `添加 Supabase 连接测试页面`
     - `优化图片压缩功能`
   - （可选）在 `Description` 中填写详细说明

3. **提交到本地仓库**
   - 点击左下角的 `Commit to main` 按钮
   - 等待提交完成（文件会从左侧列表消失）

### 步骤 2: 推送到 GitHub

1. **推送更改**
   - 点击右上角的 `Push origin` 按钮
   - 等待推送完成（会显示 "Pushed to origin"）

### 步骤 3: Vercel 自动部署（无需操作）

✅ **Vercel 会自动检测到 GitHub 的更新并开始部署**

- 部署通常需要 1-3 分钟
- 你可以在 Vercel 仪表板查看部署进度
- 部署完成后，网站会自动更新

---

## ⚙️ 首次设置 Vercel 自动部署

### 如果还没有连接 Vercel：

1. **登录 Vercel**
   - 访问 https://vercel.com
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 `Add New...` → `Project`
   - 找到你的 `ai-yingyong` 仓库
   - 点击 `Import`

3. **配置项目设置**
   - **Framework Preset**: 选择 `Vite`
   - **Root Directory**: 留空（默认）
   - **Build Command**: `npm run build`（已自动填充）
   - **Output Directory**: `dist`（已自动填充）
   - **Install Command**: `npm install`（已自动填充）

4. **配置环境变量**
   - 在 `Environment Variables` 部分添加：
     ```
     VITE_SUPABASE_URL = 你的 Supabase URL
     VITE_SUPABASE_ANON_KEY = 你的 Supabase Anon Key
     ```
   - 点击 `Add` 添加每个变量

5. **部署**
   - 点击 `Deploy` 按钮
   - 等待部署完成（约 1-3 分钟）

6. **完成！**
   - 部署完成后，Vercel 会给你一个网址（例如：`https://ai-yingyong.vercel.app`）
   - 以后每次推送到 GitHub，Vercel 都会自动重新部署

---

## 🔍 验证部署是否成功

### 方法 1: 检查 Vercel 仪表板
1. 登录 https://vercel.com
2. 进入你的项目
3. 查看 `Deployments` 标签页
4. 最新的部署应该显示 `Ready` 状态（绿色）

### 方法 2: 访问测试页面
访问你的网站 + `/test-connection`：
```
https://你的域名.vercel.app/test-connection
```
这个页面会自动测试 Supabase 连接，如果显示 ✅ 就说明部署成功！

---

## 📝 最佳实践

### ✅ 提交前检查清单

- [ ] 代码能正常运行（本地测试 `npm run dev`）
- [ ] 没有明显的错误或警告
- [ ] 提交信息清晰明了
- [ ] 环境变量已在 Vercel 中配置

### 💡 提交信息建议

**好的提交信息示例：**
- `添加图片压缩功能`
- `修复管理员界面白屏问题`
- `优化搜索性能`
- `更新教学专区 UI`

**避免的提交信息：**
- `更新`
- `修复`
- `123`
- `test`

---

## 🐛 常见问题

### Q: 推送后 Vercel 没有自动部署？
**A:** 检查：
1. Vercel 项目是否连接到正确的 GitHub 仓库
2. Vercel 项目设置中是否启用了自动部署
3. 查看 Vercel 的 `Deployments` 页面是否有错误信息

### Q: 部署失败怎么办？
**A:** 
1. 在 Vercel 仪表板查看错误日志
2. 检查环境变量是否正确配置
3. 确保 `package.json` 中的构建脚本正确
4. 检查代码是否有语法错误

### Q: 如何回退到之前的版本？
**A:**
1. 在 Vercel 的 `Deployments` 页面
2. 找到之前的成功部署
3. 点击右侧的 `...` 菜单
4. 选择 `Promote to Production`

### Q: 本地测试正常，但部署后有问题？
**A:**
1. 检查环境变量是否在 Vercel 中正确配置
2. 运行 `npm run build` 本地构建测试
3. 查看浏览器控制台的错误信息
4. 使用 `/test-connection` 页面检查 Supabase 连接

---

## 🎯 快速参考

### 日常更新命令（在 GitHub Desktop 中）
```
1. 填写 Summary → Commit to main
2. Push origin
3. 等待 Vercel 自动部署（1-3分钟）
```

### 检查部署状态
- Vercel 仪表板: https://vercel.com/dashboard
- 测试页面: `https://你的域名/test-connection`

---

**🎉 完成！现在你可以通过 GitHub Desktop 轻松更新网站了！**

