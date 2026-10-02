const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'
});

async function verify() {
  try {
    console.log('=== 1. LIVE SUPABASE DB IDENTITY & VERSION ===');
    const r1 = await pool.query("SELECT current_database(), current_user, current_setting('server_version')");
    console.table(r1.rows);

    console.log('\n=== 2. RLS ISOLATION & TABLES ===');
    const r2 = await pool.query(`
      SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY c.relname;
    `);
    console.table(r2.rows);

    console.log('\n=== 3. FINANCIAL TRIGGERS & CONSTRAINTS ===');
    const r3 = await pool.query(`
      SELECT event_object_table AS table_name, trigger_name, action_timing, event_manipulation
      FROM information_schema.triggers WHERE trigger_schema = 'public' ORDER BY table_name, trigger_name;
    `);
    console.table(r3.rows);

    console.log('\n=== 4. SECURITY DEFINER FUNCTIONS ===');
    const r4 = await pool.query(`
      SELECT p.proname AS function_name, pg_get_userbyid(p.proowner) AS owner, p.prosecdef AS security_definer
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.prosecdef = true ORDER BY p.proname;
    `);
    console.table(r4.rows);

    console.log('\n=== 5. TABLE PRIVILEGES (anon & authenticated) ===');
    const r5 = await pool.query(`
      SELECT grantee, table_name, privilege_type 
      FROM information_schema.table_privileges 
      WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated')
      ORDER BY table_name, grantee, privilege_type;
    `);
    console.table(r5.rows);

  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    await pool.end();
  }
}

verify();
