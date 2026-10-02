const { Pool } = require('pg');
const http = require('http');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'
});

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function run() {
  console.log('================================================================');
  console.log('MAISON LANA COMPREHENSIVE PRODUCTION READINESS VERIFICATION');
  console.log('================================================================\n');

  const report = {};

  // 1. LIVE DATABASE IDENTITY
  console.log('=== 1. LIVE DATABASE IDENTITY ===');
  const dbIdentity = await pool.query(`
    SELECT 
      current_database() AS database,
      current_user AS user,
      current_setting('server_version') AS server_version,
      current_setting('server_encoding') AS encoding,
      inet_server_addr() AS server_addr,
      inet_server_port() AS server_port;
  `);
  console.table(dbIdentity.rows);
  report.dbIdentity = dbIdentity.rows[0];

  // 2. REQUIRED TABLES & RLS STATUS
  console.log('\n=== 2. REQUIRED TABLES & RLS STATUS ===');
  const rlsStatus = await pool.query(`
    SELECT 
      c.relname AS table_name,
      c.relrowsecurity AS rls_enabled,
      c.relforcerowsecurity AS force_rls
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' 
      AND c.relkind = 'r'
      AND c.relname IN ('products', 'orders', 'orders_v2', 'order_items', 'customers_v2', 'reviews', 'promo_codes', 'stores', 'admin_roles', 'idempotency_keys', 'audit_logs')
    ORDER BY c.relname;
  `);
  console.table(rlsStatus.rows);
  report.rlsStatus = rlsStatus.rows;

  // 3. TABLE PRIVILEGES FOR ANON & AUTHENTICATED
  console.log('\n=== 3. TABLE PRIVILEGES (anon & authenticated) ===');
  const tablePrivs = await pool.query(`
    SELECT grantee, table_name, string_agg(privilege_type, ', ') AS privileges
    FROM information_schema.table_privileges
    WHERE table_schema = 'public'
      AND grantee IN ('anon', 'authenticated')
      AND table_name IN ('products', 'orders_v2', 'order_items', 'customers_v2', 'reviews', 'promo_codes', 'stores', 'admin_roles', 'idempotency_keys')
    GROUP BY grantee, table_name
    ORDER BY table_name, grantee;
  `);
  console.table(tablePrivs.rows);
  report.tablePrivileges = tablePrivs.rows;

  // 4. FINANCIAL TRIGGERS & INVARIANTS
  console.log('\n=== 4. FINANCIAL TRIGGERS ===');
  const triggers = await pool.query(`
    SELECT 
      event_object_table AS table_name,
      trigger_name,
      action_timing,
      event_manipulation,
      action_statement
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name;
  `);
  console.table(triggers.rows);
  report.triggers = triggers.rows;

  // 5. SECURITY DEFINER FUNCTIONS
  console.log('\n=== 5. SECURITY DEFINER FUNCTIONS ===');
  const secDefiners = await pool.query(`
    SELECT 
      p.proname AS function_name,
      pg_get_userbyid(p.proowner) AS owner,
      p.prosecdef AS is_security_definer
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
    ORDER BY p.proname;
  `);
  console.table(secDefiners.rows);
  report.securityDefiners = secDefiners.rows;

  // 6. STORAGE POLICIES & BUCKETS
  console.log('\n=== 6. STORAGE OBJECTS & BUCKETS ===');
  let storageBuckets = [];
  try {
    const bRes = await pool.query("SELECT id, name, public FROM storage.buckets;");
    storageBuckets = bRes.rows;
    console.table(bRes.rows);
  } catch (e) {
    console.log("Storage schema lookup notice:", e.message);
  }
  report.storageBuckets = storageBuckets;

  // 7. LIVE CONCURRENCY & IDEMPOTENCY TEST
  console.log('\n=== 7. CHECKOUT CONCURRENCY & IDEMPOTENCY TEST ===');
  // Register Customer
  const custRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/customers/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: `launch_gate_${Date.now()}@maisonlana.test`,
    password: 'Password123!',
    fullName: 'Launch Gate User'
  });
  const token = custRes.body.token;

  const testKey = `gate_idem_${Date.now()}`;
  const checkoutPayload = {
    items: [{ productId: 'prod-lady-dior-med', quantity: 1, price: 5900 }],
    shippingAddress: { fullName: 'Launch User', address: '1 Rue de Rivoli', city: 'Paris', postalCode: '75001' },
    paymentMethod: 'Manual Payment',
    idempotencyKey: testKey
  };

  const [res1, res2] = await Promise.all([
    request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    }, checkoutPayload),
    request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    }, checkoutPayload)
  ]);

  console.log('Concurrent 1 status:', res1.status, 'Order:', res1.body.orderNumber);
  console.log('Concurrent 2 status:', res2.status, 'Order:', res2.body.orderNumber);
  const idempotencyMatched = res1.body.orderNumber === res2.body.orderNumber;
  console.log('Idempotency matched exact order:', idempotencyMatched);
  report.concurrencyAndIdempotency = {
    matched: idempotencyMatched,
    orderNumber1: res1.body.orderNumber,
    orderNumber2: res2.body.orderNumber
  };

  // 8. TENANT / USER RLS ISOLATION TEST
  console.log('\n=== 8. TENANT / USER RLS ISOLATION TEST ===');
  // Register user B
  const custBRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/customers/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: `launch_user_b_${Date.now()}@maisonlana.test`,
    password: 'Password123!',
    fullName: 'Launch User B'
  });
  const tokenB = custBRes.body.token;

  // Attempt user B fetching user A's order by ID
  const crossAccessRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/orders/${res1.body.orderNumber}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  console.log('User B GET User A Order status (Expect 403):', crossAccessRes.status);

  // Attempt unauthenticated GET on order
  const anonAccessRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/orders/${res1.body.orderNumber}`,
    method: 'GET'
  });
  console.log('Anon GET User A Order status (Expect 401):', anonAccessRes.status);
  report.isolation = {
    crossCustomerBlocked: crossAccessRes.status === 403,
    anonBlocked: anonAccessRes.status === 401
  };

  // 9. CLIENT BUNDLE SECRETS AUDIT
  console.log('\n=== 9. CLIENT BUNDLE SECRETS AUDIT ===');
  const distAssets = path.join(__dirname, 'dist', 'assets');
  let leakFound = false;
  let fileCount = 0;
  if (fs.existsSync(distAssets)) {
    for (const f of fs.readdirSync(distAssets)) {
      if (f.endsWith('.js')) {
        fileCount++;
        const content = fs.readFileSync(path.join(distAssets, f), 'utf8');
        if (content.includes('service_role') || content.includes('SAKHAAWE6617')) {
          leakFound = true;
          console.error('LEAK FOUND IN:', f);
        }
      }
    }
  }
  console.log(`Scanned ${fileCount} client bundles. Secrets leaked:`, leakFound);
  report.bundleAudit = { scannedFiles: fileCount, leaked: leakFound };

  console.log('\n=== COMPREHENSIVE VERIFICATION COMPLETE ===');
  await pool.end();
}

run().catch(console.error);
