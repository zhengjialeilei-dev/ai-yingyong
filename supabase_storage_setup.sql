-- Enable Storage
-- Create a public bucket for AI Apps
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-apps', 'ai-apps', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on resources if not already enabled
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Allow public read access to resources
DROP POLICY IF EXISTS "Public Read Resources" ON resources;
CREATE POLICY "Public Read Resources" ON resources FOR SELECT USING (true);

-- Allow public insert access to resources (For this demo, we rely on the hidden admin page)
-- In production, you should use Supabase Auth
DROP POLICY IF EXISTS "Public Insert Resources" ON resources;
CREATE POLICY "Public Insert Resources" ON resources FOR INSERT WITH CHECK (true);

-- Storage Policies
-- Allow public read of objects
DROP POLICY IF EXISTS "Public Read Storage" ON storage.objects;
CREATE POLICY "Public Read Storage" ON storage.objects FOR SELECT USING (bucket_id = 'ai-apps');

-- Allow public upload to bucket (Again, relying on hidden UI for now)
DROP POLICY IF EXISTS "Public Upload Storage" ON storage.objects;
CREATE POLICY "Public Upload Storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ai-apps');
