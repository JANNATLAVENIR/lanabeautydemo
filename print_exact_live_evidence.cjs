const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'
});

async function run() {
  try {
    console.log('=== 1. LIVE DB IDENTITY ===');
    const r1 = await pool.query("SELECT current_database(), current_user, current_setting('server_version'), current_setting('server_encoding')");
    console.log(JSON.stringify(r1.rows, null, 2));

    console.log('\n=== 2. LIVE TABLES & RLS ===');
    const r2 = await pool.query(`
      SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      ORDER BY c.relname;
    `);
    console.log(JSON.stringify(r2.rows, null, 2));

    console.log('\n=== 3. LIVE POLICIES ===');
    const r3 = await pool.query(`
      SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
      FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
    `);
    console.log(JSON.stringify(r3.rows, null, 2));

    console.log('\n=== 4. LIVE PRIVILEGES ===');
    const r4 = await pool.query(`
      SELECT grantee, table_name, privilege_type 
      FROM information_schema.table_privileges 
      WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated')
      ORDER BY table_name, grantee, privilege_type;
    `);
    console.log(JSON.stringify(r4.rows, null, 2));

    console.log('\n=== 5. LIVE SECURITY DEFINER FUNCTIONS ===');
    const r5 = await pool.query(`
      SELECT p.proname AS function_name, pg_get_userbyid(p.proowner) AS owner, p.prosecdef AS security_definer
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.prosecdef = true ORDER BY p.proname;
    `);
    console.log(JSON.stringify(r5.rows, null, 2));

    console.log('\n=== 6. LIVE TRIGGERS ===');
    const r6 = await pool.query(`
      SELECT event_object_table AS table_name, trigger_name, action_timing, event_manipulation
      FROM information_schema.triggers WHERE trigger_schema = 'public' ORDER BY table_name, trigger_name;
    `);
    console.log(JSON.stringify(r6.rows, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
