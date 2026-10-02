import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};
// Production Supabase Project: mjvfpoapuonncbfvhfyz
let supabaseUrl = metaEnv.VITE_SUPABASE_URL || 'https://mjvfpoapuonncbfvhfyz.supabase.co';
if (!supabaseUrl || supabaseUrl.includes('aafaftdrhyjmpjwqkpwe')) {
  supabaseUrl = 'https://mjvfpoapuonncbfvhfyz.supabase.co';
}
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || 'public-anon-key';

export const SUPABASE_PROJECT_REF = 'mjvfpoapuonncbfvhfyz';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

