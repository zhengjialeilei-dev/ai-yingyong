import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Resource {
  id: string;
  title: string;
  category: string;
  grade: string;
  image_url: string;
  description: string;
  file_path?: string;
  route_path?: string;
  resource_type: string;
  created_at: string;
}
