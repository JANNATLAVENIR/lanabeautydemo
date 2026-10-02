const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'
});

async function runVerification() {
  try {
    console.log('=== 1. DATABASE IDENTITY ===');
    const idRes = await pool.query("SELECT current_database(), current_user, current_setting('server_version')");
    console.table(idRes.rows);

    console.log('\n=== 2. REQUIRED TABLES ===');
    const tablesRes = await pool.query(`
      SELECT table_name, true AS exists 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ANY($1::text[])
      ORDER BY table_name;
    `, [[
      'products', 'products_public', 'orders', 'orders_v2', 'order_items', 
      'customers_v2', 'reviews', 'promo_codes', 'stores', 'admin_roles', 
      'idempotency_keys', 'audit_logs'
    ]]);
    console.table(tablesRes.rows);

    console.log('\n=== 3. VERIFY RLS ===');
    const rlsRes = await pool.query(`
      SELECT c.relname AS table_name, c.relrowsecurity AS rowsecurity, c.relforcerowsecurity AS forcerowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
      AND c.relname = ANY($1::text[])
      ORDER BY c.relname;
    `, [[
      'products', 'orders', 'orders_v2', 'order_items', 'customers_v2', 
      'reviews', 'promo_codes', 'stores', 'admin_roles', 'idempotency_keys', 'audit_logs'
    ]]);
    console.table(rlsRes.rows);

    console.log('\n=== 4. VERIFY POLICIES ===');
    const polRes = await pool.query(`
      SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);
    console.table(polRes.rows);

    console.log('\n=== 5. VERIFY PRIVILEGES ===');
    const privRes = await pool.query(`
      SELECT grantee, table_name, privilege_type 
      FROM information_schema.table_privileges 
      WHERE table_schema = 'public' 
      AND grantee IN ('anon', 'authenticated', 'PUBLIC')
      AND table_name IN ('products', 'products_public', 'orders', 'promo_codes')
      ORDER BY table_name, grantee, privilege_type;
    `);
    console.table(privRes.rows);

    console.log('\n=== 6. VERIFY SECURITY DEFINER FUNCTIONS ===');
    const funcRes = await pool.query(`
      SELECT p.proname AS function_name, pg_get_userbyid(p.proowner) AS owner, p.prosecdef AS prosecdef, p.proconfig AS proconfig
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.prosecdef = true
      ORDER BY p.proname;
    `);
    console.table(funcRes.rows);

    console.log('\n=== 7. VERIFY FINANCIAL TRIGGERS ===');
    const trigRes = await pool.query(`
      SELECT event_object_table AS table_name, trigger_name, action_timing, event_manipulation, tgenabled
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY table_name, trigger_name;
    `);
    console.table(trigRes.rows);

    console.log('\n=== 8. VERIFY IMPORTANT CONSTRAINTS ===');
    const constRes = await pool.query(`
      SELECT tc.table_name, tc.constraint_name, tc.constraint_type
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_type;
    `);
    console.table(constRes.rows);

    console.log('\n=== 9. VERIFY PRODUCTS PUBLIC VIEW ===');
    const viewRes = await pool.query(`
      SELECT pg_get_viewdef('public.products_public'::regclass, true) AS view_definition;
    `);
    console.log(viewRes.rows[0]?.view_definition || 'View not found');

    console.log('\n=== 11. VERIFY MIGRATION HISTORY ===');
    try {
      const migRes = await pool.query(`SELECT * FROM supabase_migrations.schema_migrations;`);
      console.table(migRes.rows);
    } catch (e) {
      console.log('supabase_migrations table not found or not queried.');
    }

  } catch (err) {
    console.error('Verification script error:', err);
  } finally {
    await pool.end();
  }
}

runVerification();
