const { Pool } = require('pg');
const http = require('http');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
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

async function runAllTests() {
  console.log('====================================================');
  console.log('STARTING MAISON LANA FINAL LAUNCH GATE TEST EXECUTION');
  console.log('====================================================\n');

  const results = {};

  // ----------------------------------------------------
  // TEST: CUSTOMER WORKFLOW & SMOKE TEST
  // ----------------------------------------------------
  console.log('--- EXECUTING PHASE 2: CUSTOMER SMOKE TEST ---');
  try {
    // 1. Fetch catalog
    const productsRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/products',
      method: 'GET'
    });
    console.log('1. GET /api/products Status:', productsRes.status, 'Count:', Array.isArray(productsRes.body) ? productsRes.body.length : 0);

    const testProduct = productsRes.body[0];
    if (!testProduct) throw new Error('No products found in catalog');
    const productPrice = testProduct.retailPrice || testProduct.retail_price || 220;
    console.log('Selected Test Product:', testProduct.id, testProduct.name, 'Price:', productPrice);

    // 2. Register Customer
    const randEmail = `customer_${Date.now()}@maisonlana.test`;
    const regRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/customers/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: randEmail,
      password: 'SecurePassword123!',
      fullName: 'Test Customer A'
    });
    console.log('2. Customer Registration Status:', regRes.status, 'Token exists:', !!regRes.body?.token);
    const token = regRes.body?.token;

    // 3. Checkout Valid Order
    const idempotencyKey = `idem_${Date.now()}`;
    const orderPayload = {
      items: [
        {
          productId: testProduct.id,
          productName: testProduct.name,
          quantity: 1,
          price: productPrice
        }
      ],
      shippingAddress: {
        fullName: 'Test Customer A',
        address: '123 Rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
        country: 'France'
      },
      paymentMethod: 'Manual Payment',
      idempotencyKey
    };

    const checkoutRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, orderPayload);
    console.log('3. Checkout Status:', checkoutRes.status, 'Order Number:', checkoutRes.body?.orderNumber, 'Total:', checkoutRes.body?.total);

    const createdOrder = checkoutRes.body;

    // 4. Verify Order Persistence via Customer Orders endpoint
    const myOrdersRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/customers/me/orders',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('4. Customer GET /api/customers/me/orders Status:', myOrdersRes.status, 'Count:', Array.isArray(myOrdersRes.body) ? myOrdersRes.body.length : 0);

    results.smokeTest = {
      status: checkoutRes.status === 201 && myOrdersRes.body.length > 0 ? 'PASS' : 'FAIL',
      orderNumber: createdOrder?.orderNumber,
      total: createdOrder?.total
    };
  } catch (err) {
    console.error('Smoke Test Error:', err);
    results.smokeTest = { status: 'FAIL', error: err.message };
  }

  // ----------------------------------------------------
  // TEST: CHECKOUT CONCURRENCY & IDEMPOTENCY
  // ----------------------------------------------------
  console.log('\n--- EXECUTING PHASE 3: CHECKOUT CONCURRENCY & IDEMPOTENCY ---');
  try {
    // Register another user
    const regResB = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/customers/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: `customerB_${Date.now()}@maisonlana.test`,
      password: 'SecurePassword123!',
      fullName: 'Test Customer B'
    });
    const tokenB = regResB.body?.token;

    // Concurrency test: same idempotency key sent concurrently
    const sameKey = `idem_concurrent_${Date.now()}`;
    const payload = {
      items: [{ productId: 'prod-dior-jadore-lor', productName: 'Jadore', quantity: 1, price: 220 }],
      shippingAddress: { fullName: 'User B', address: '1 Ave', city: 'Paris', postalCode: '75008', country: 'France' },
      paymentMethod: 'Manual Payment',
      idempotencyKey: sameKey
    };

    const [req1, req2] = await Promise.all([
      request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/orders',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenB}` }
      }, payload),
      request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/orders',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenB}` }
      }, payload)
    ]);

    console.log('Concurrent Request 1 Status:', req1.status, 'Order:', req1.body?.orderNumber);
    console.log('Concurrent Request 2 Status:', req2.status, 'Order:', req2.body?.orderNumber);

    // Both should return the same orderNumber without duplicating
    const sameOrder = req1.body?.orderNumber === req2.body?.orderNumber;
    console.log('Idempotency matched exact same order:', sameOrder);

    results.concurrency = {
      status: sameOrder && (req1.status === 201 || req1.status === 200) ? 'PASS' : 'FAIL',
      orderNumber1: req1.body?.orderNumber,
      orderNumber2: req2.body?.orderNumber
    };
  } catch (err) {
    console.error('Concurrency Test Error:', err);
    results.concurrency = { status: 'FAIL', error: err.message };
  }

  // ----------------------------------------------------
  // TEST: SECURITY NEGATIVE TESTS
  // ----------------------------------------------------
  console.log('\n--- EXECUTING PHASE 5: SECURITY NEGATIVE TESTS ---');
  try {
    // 1. Anonymous access to admin orders
    const anonAdminRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/orders',
      method: 'GET'
    });
    console.log('1. Anon GET /api/orders (Expect 403):', anonAdminRes.status);

    // 2. Normal customer token accessing admin orders
    const regC = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/customers/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: `customerC_${Date.now()}@maisonlana.test`,
      password: 'SecurePassword123!',
      fullName: 'Customer C'
    });
    const tokenC = regC.body?.token;

    const custAdminRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/orders',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokenC}` }
    });
    console.log('2. Customer GET /api/orders (Expect 403):', custAdminRes.status);

    // 3. Unauthorized product creation
    const unauthProdRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/products',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenC}` }
    }, { name: 'Hacked Product', retail_price: 10 });
    console.log('3. Customer POST /api/products (Expect 403):', unauthProdRes.status);

    // 4. Direct DB RLS check on products table as anonymous role
    let directDbBlocked = false;
    const client = await pool.connect();
    try {
      // Simulate anon role
      await client.query("SET ROLE anon;");
      await client.query("SELECT * FROM products LIMIT 1;");
    } catch (e) {
      directDbBlocked = true;
      console.log('4. Direct DB SELECT products as anon (Expect permission denied):', e.message);
    } finally {
      await client.query("RESET ROLE;");
      client.release();
    }

    results.securityNegative = {
      status: anonAdminRes.status === 403 && custAdminRes.status === 403 && unauthProdRes.status === 403 && directDbBlocked ? 'PASS' : 'FAIL',
      anonAdminStatus: anonAdminRes.status,
      custAdminStatus: custAdminRes.status,
      unauthProdStatus: unauthProdRes.status,
      directDbBlocked
    };
  } catch (err) {
    console.error('Security Negative Test Error:', err);
    results.securityNegative = { status: 'FAIL', error: err.message };
  }

  // ----------------------------------------------------
  // TEST: FINANCIAL INTEGRITY TRIGGER
  // ----------------------------------------------------
  console.log('\n--- EXECUTING PHASE 6: FINANCIAL INTEGRITY TRIGGER ---');
  try {
    const client = await pool.connect();
    let invalidTotalRejected = false;
    let invalidItemRejected = false;
    let validAccepted = false;

    try {
      // Test 1: Invalid order total (subtotal 100, discount 0, shipping 10, total claimed 0)
      await client.query("BEGIN;");
      // Find a customer_id
      const cust = await client.query("SELECT id FROM customers_v2 LIMIT 1;");
      const customerId = cust.rows[0]?.id;

      try {
        await client.query(`
          INSERT INTO orders_v2 (
            customer_id, order_number, subtotal, discount, shipping, total, shipping_address_snapshot
          ) VALUES (
            $1, 'TEST-FIN-INVALID', 100.00, 0.00, 10.00, 0.00, '{}'::jsonb
          );
        `, [customerId]);
      } catch (err) {
        invalidTotalRejected = err.message.includes('Financial invariant violated: total must equal subtotal - discount + shipping');
        console.log('1. Invalid order total rejected by trigger:', invalidTotalRejected, 'Msg:', err.message);
      }
      await client.query("ROLLBACK;");

      // Test 2: Invalid item line_total (unit_price 50, quantity 2, line_total 1)
      await client.query("BEGIN;");
      const ord = await client.query(`
        INSERT INTO orders_v2 (
          customer_id, order_number, subtotal, discount, shipping, total, shipping_address_snapshot
        ) VALUES (
          $1, 'TEST-FIN-VALID-FOR-ITEM', 100.00, 0.00, 0.00, 100.00, '{}'::jsonb
        ) RETURNING id;
      `, [customerId]);
      const orderId = ord.rows[0].id;

      try {
        await client.query(`
          INSERT INTO order_items (
            order_id, product_id, product_name, unit_price, quantity, line_total
          ) VALUES (
            $1, 'prod-dior-jadore-lor', 'Jadore', 50.00, 2, 1.00
          );
        `, [orderId]);
      } catch (err) {
        invalidItemRejected = err.message.includes('Financial invariant violated: line_total must equal unit_price * quantity');
        console.log('2. Invalid line_total rejected by trigger:', invalidItemRejected, 'Msg:', err.message);
      }
      await client.query("ROLLBACK;");

      // Test 3: Valid order & item
      await client.query("BEGIN;");
      const ordValid = await client.query(`
        INSERT INTO orders_v2 (
          customer_id, order_number, subtotal, discount, shipping, total, shipping_address_snapshot
        ) VALUES (
          $1, 'TEST-FIN-VALID', 100.00, 10.00, 10.00, 100.00, '{}'::jsonb
        ) RETURNING id;
      `, [customerId]);
      const validOrderId = ordValid.rows[0].id;

      await client.query(`
        INSERT INTO order_items (
          order_id, product_id, product_name, unit_price, quantity, line_total
        ) VALUES (
          $1, 'prod-dior-jadore-lor', 'Jadore', 50.00, 2, 100.00
        );
      `, [validOrderId]);
      validAccepted = true;
      console.log('3. Valid financial calculations accepted by DB triggers: true');
      await client.query("ROLLBACK;");

    } finally {
      client.release();
    }

    results.financialIntegrity = {
      status: invalidTotalRejected && invalidItemRejected && validAccepted ? 'PASS' : 'FAIL',
      invalidTotalRejected,
      invalidItemRejected,
      validAccepted
    };
  } catch (err) {
    console.error('Financial Integrity Test Error:', err);
    results.financialIntegrity = { status: 'FAIL', error: err.message };
  }

  // ----------------------------------------------------
  // TEST: FRONTEND BUNDLE SECRETS AUDIT
  // ----------------------------------------------------
  console.log('\n--- EXECUTING PHASE 7: CLIENT BUNDLE SECRETS AUDIT ---');
  try {
    const distPath = path.join(__dirname, 'dist');
    let bundleHasSecret = false;
    let checkedFiles = 0;

    if (fs.existsSync(distPath)) {
      const files = fs.readdirSync(path.join(distPath, 'assets'));
      for (const file of files) {
        if (file.endsWith('.js')) {
          checkedFiles++;
          const content = fs.readFileSync(path.join(distPath, 'assets', file), 'utf8');
          if (content.includes('service_role') || content.includes('SAKHAAWE6617')) {
            bundleHasSecret = true;
            console.error('CRITICAL: Secret leaked in bundle file:', file);
          }
        }
      }
    }
    console.log(`Checked ${checkedFiles} client JS files. Leaked secrets found:`, bundleHasSecret);

    results.bundleSecrets = {
      status: !bundleHasSecret && checkedFiles > 0 ? 'PASS' : 'FAIL',
      checkedFiles,
      bundleHasSecret
    };
  } catch (err) {
    console.error('Bundle Secrets Audit Error:', err);
    results.bundleSecrets = { status: 'FAIL', error: err.message };
  }

  console.log('\n====================================================');
  console.log('FINAL EXECUTION SUMMARY OF ALL AUTOMATED TEST PHASES:');
  console.log(JSON.stringify(results, null, 2));
  console.log('====================================================');

  await pool.end();
}

runAllTests();
