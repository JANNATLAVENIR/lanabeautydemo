import { Pool } from 'pg';
const dbUrl = "postgresql://postgres:SAKHAAWE6617@db.mjvfpoapuonncbfvhfyz.supabase.co:5432/postgres";
const pool = new Pool({ connectionString: dbUrl });
pool.query("SELECT settings FROM homepage_settings ORDER BY id DESC LIMIT 1").then(res => console.log(JSON.stringify(res.rows[0]))).catch(console.error).finally(() => pool.end());
