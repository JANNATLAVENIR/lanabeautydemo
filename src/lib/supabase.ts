import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || 'https://mjvfpoapuonncbfvhfyz.supabase.co';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdmZwb2FwdW9ubmNiZnZoZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDE1NDIsImV4cCI6MjEwMTc3NzU0Mn0.mrQi-SqaBcymn5vD-H7f9c5WCpWm-Ne4vZ6xoWmjp0I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
