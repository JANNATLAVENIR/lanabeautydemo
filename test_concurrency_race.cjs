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
  console.log('=== CONCURRENCY & OVERSELLING TEST ===');
  const pId = 'prod-limited-edition-test';

  // Create or reset a limited-stock product with exactly 5 units
  await pool.query(`
    INSERT INTO public.products (
      id, name, brand, category, sub_category, department, gender, retail_price,
      image, description, supplier_inventory
    ) VALUES (
      $1, 'Limited Edition Collector Item', 'LANA HAUTE', 'FRAGRANCE', 'Extrait', 'Beauty', 'Unisex', 500,
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539', 'Limited stock test',
      '[{"storeId": "store-1", "stock": 5, "wholesaleCost": 250}]'::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
      supplier_inventory = '[{"storeId": "store-1", "stock": 5, "wholesaleCost": 250}]'::jsonb;
  `, [pId]);

  const beforeRes = await pool.query('SELECT supplier_inventory FROM public.products WHERE id = $1;', [pId]);
  const stockBefore = beforeRes.rows[0].supplier_inventory[0].stock;
  console.log(`Starting Stock for "${pId}": ${stockBefore} units`);

  // Two simultaneous checkouts competing for the 5 units:
  // Client A requests 4 units
  // Client B requests 3 units
  // Total requested: 7 units (which exceeds available stock of 5)
  console.log('Dispatching two simultaneous checkouts: Client A (4 units) vs Client B (3 units)...');

  const payloadA = {
    items: [{ productId: pId, quantity: 4, price: 500 }],
    shippingAddress: { fullName: 'Buyer A', address: '1 Rue A', city: 'Paris' },
    paymentMethod: 'Manual Payment',
    idempotencyKey: 'race_A_' + Date.now(),
    customerEmail: 'buyerA@maisonlana.test'
  };

  const payloadB = {
    items: [{ productId: pId, quantity: 3, price: 500 }],
    shippingAddress: { fullName: 'Buyer B', address: '2 Rue B', city: 'Paris' },
    paymentMethod: 'Manual Payment',
    idempotencyKey: 'race_B_' + Date.now(),
    customerEmail: 'buyerB@maisonlana.test'
  };

  const [resA, resB] = await Promise.all([
    request({ hostname: 'localhost', port: 3000, path: '/api/orders', method: 'POST', headers: { 'Content-Type': 'application/json' } }, payloadA),
    request({ hostname: 'localhost', port: 3000, path: '/api/orders', method: 'POST', headers: { 'Content-Type': 'application/json' } }, payloadB)
  ]);

  console.log(`Client A Response: Status ${resA.status}`, resA.body.orderNumber ? `Order: ${resA.body.orderNumber}` : `Error: ${resA.body.error}`);
  console.log(`Client B Response: Status ${resB.status}`, resB.body.orderNumber ? `Order: ${resB.body.orderNumber}` : `Error: ${resB.body.error}`);

  // Exactly one must succeed (201) and one must fail (400)
  const oneSucceeded = (resA.status === 201 && resB.status === 400) || (resA.status === 400 && resB.status === 201);
  console.log(`Exactly one transaction succeeded and overselling prevented: ${oneSucceeded}`);

  // Verify inventory in PostgreSQL
  const afterRes = await pool.query('SELECT supplier_inventory FROM public.products WHERE id = $1;', [pId]);
  const stockAfter = afterRes.rows[0].supplier_inventory[0].stock;
  console.log(`Final Stock in Database: ${stockAfter} units`);

  const expectedStock = resA.status === 201 ? (5 - 4) : (5 - 3);
  console.log(`Stock matches expected remaining (${expectedStock}): ${stockAfter === expectedStock}`);
  console.log(`Inventory remained non-negative: ${stockAfter >= 0}`);

  // Clean up test records
  await pool.query("DELETE FROM public.order_items WHERE product_id = $1;", [pId]);
  await pool.query("DELETE FROM public.orders_v2 WHERE order_number = $1;", [resA.body.orderNumber || resB.body.orderNumber]);
  await pool.query('DELETE FROM public.products WHERE id = $1;', [pId]);
  await pool.end();
}

run().catch(console.error);
