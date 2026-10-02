const { Pool } = require('pg');
const http = require('http');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'
});

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, headers: res.headers, body: data }); }
      });
    });
    req.on('error', reject);
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
}

async function run() {
  console.log('=== CHECKOUT END-TO-END CONTROLLED TEST ===');
  const pId = 'prod-chanel-les-beiges-foundation';

  // 1. Inventory before
  const beforeProd = await pool.query('SELECT id, name, supplier_inventory FROM public.products WHERE id = $1;', [pId]);
  const beforeInv = beforeProd.rows[0].supplier_inventory;
  const beforeStock = beforeInv.reduce((s, e) => s + (Number(e.stock) || 0), 0);
  console.log(`Product: "${beforeProd.rows[0].name}"`);
  console.log(`Inventory BEFORE: ${beforeStock} units`);

  const testKey = 'idem_controlled_' + Date.now();
  const payload = {
    items: [{ productId: pId, quantity: 2, price: 60 }],
    shippingAddress: { fullName: 'Controlled User', address: '123 Avenue Montaigne', city: 'Paris', postalCode: '75008' },
    paymentMethod: 'Manual Payment',
    idempotencyKey: testKey,
    customerEmail: 'controlled@maisonlana.test'
  };

  // 2. Submit initial checkout
  const res1 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/orders',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, payload);

  console.log(`\nInitial POST /api/orders Status: ${res1.status}`);
  console.log(`Generated Order Number: ${res1.body.orderNumber}`);

  // 3. PostgreSQL Direct Verification
  const orderDb = await pool.query('SELECT * FROM public.orders_v2 WHERE order_number = $1;', [res1.body.orderNumber]);
  console.log(`PostgreSQL orders_v2 records found: ${orderDb.rows.length} (Expected: 1)`);

  const orderId = orderDb.rows[0].id;
  const itemsDb = await pool.query('SELECT * FROM public.order_items WHERE order_id = $1;', [orderId]);
  console.log(`PostgreSQL order_items found: ${itemsDb.rows.length}`);
  console.log(`Item line_total: $${itemsDb.rows[0].line_total}, Quantity: ${itemsDb.rows[0].quantity}`);

  const idemDb = await pool.query('SELECT * FROM public.idempotency_keys WHERE key = $1;', [testKey]);
  console.log(`PostgreSQL idempotency_keys found: ${idemDb.rows.length}, HTTP Status: ${idemDb.rows[0].response_status}`);

  const afterProd1 = await pool.query('SELECT supplier_inventory FROM public.products WHERE id = $1;', [pId]);
  const afterStock1 = afterProd1.rows[0].supplier_inventory.reduce((s, e) => s + (Number(e.stock) || 0), 0);
  console.log(`Inventory AFTER first checkout: ${afterStock1} units (Deducted: ${beforeStock - afterStock1})`);

  // 4. Repeat exact same request with SAME idempotency key
  console.log('\n--- Repeating request with same idempotency key ---');
  const res2 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/orders',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, payload);

  console.log(`Replay POST /api/orders Status: ${res2.status}`);
  console.log(`Replay X-Idempotent-Replay header: ${res2.headers['x-idempotent-replay']}`);
  console.log(`Replay Order Number: ${res2.body.orderNumber}`);
  console.log(`Identical Order Number matched: ${res1.body.orderNumber === res2.body.orderNumber}`);

  const orderDb2 = await pool.query('SELECT COUNT(*) FROM public.orders_v2 WHERE order_number = $1;', [res1.body.orderNumber]);
  console.log(`orders_v2 count after replay: ${orderDb2.rows[0].count} (Expected: 1)`);

  const afterProd2 = await pool.query('SELECT supplier_inventory FROM public.products WHERE id = $1;', [pId]);
  const afterStock2 = afterProd2.rows[0].supplier_inventory.reduce((s, e) => s + (Number(e.stock) || 0), 0);
  console.log(`Inventory AFTER replay: ${afterStock2} units (Additional deduction: ${afterStock1 - afterStock2})`);

  await pool.end();
}

run().catch(console.error);
