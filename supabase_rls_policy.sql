-- ============================================
-- Supabase RLS (Row Level Security) 策略
-- 用于 resources 表的增删改查权限
-- ============================================

-- 首先启用 RLS（如果还没启用的话）
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- 删除旧的策略（如果存在）
DROP POLICY IF EXISTS "Allow public read" ON resources;
DROP POLICY IF EXISTS "Allow public insert" ON resources;
DROP POLICY IF EXISTS "Allow public update" ON resources;
DROP POLICY IF EXISTS "Allow public delete" ON resources;

-- 创建新的策略：允许所有人读取
CREATE POLICY "Allow public read" ON resources
  FOR SELECT
  USING (true);

-- 创建新的策略：允许所有人插入
CREATE POLICY "Allow public insert" ON resources
  FOR INSERT
  WITH CHECK (true);

-- 创建新的策略：允许所有人更新
CREATE POLICY "Allow public update" ON resources
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 创建新的策略：允许所有人删除
CREATE POLICY "Allow public delete" ON resources
  FOR DELETE
  USING (true);

-- ============================================
-- Storage 桶策略（如果需要的话）
-- ============================================

-- 注意：Storage 策略需要在 Supabase Dashboard 中设置
-- 或者使用以下 SQL（需要管理员权限）：

-- 允许公开读取 ai-apps 桶中的文件
-- INSERT INTO storage.policies (name, bucket_id, operation, definition)
-- VALUES ('Public Read', 'ai-apps', 'SELECT', 'true');

-- 允许上传文件到 ai-apps 桶
-- INSERT INTO storage.policies (name, bucket_id, operation, definition)
-- VALUES ('Public Upload', 'ai-apps', 'INSERT', 'true');

-- 允许删除 ai-apps 桶中的文件
-- INSERT INTO storage.policies (name, bucket_id, operation, definition)
-- VALUES ('Public Delete', 'ai-apps', 'DELETE', 'true');

-- ============================================
-- 验证策略
-- ============================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'resources';


