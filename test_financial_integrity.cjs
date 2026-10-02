const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'
});

async function testFinancialIntegrity() {
  console.log('=== FINANCIAL INTEGRITY TESTS ===');
  const client = await pool.connect();

  try {
    const custRes = await client.query('SELECT id FROM public.customers_v2 LIMIT 1;');
    const customerId = custRes.rows[0].id;
    const prodRes = await client.query('SELECT id, name, retail_price FROM public.products LIMIT 1;');
    const productId = prodRes.rows[0].id;

    // TEST 1: Valid Order & Item
    console.log('\n--- Test 1: Valid Order & Items ---');
    await client.query('BEGIN;');
    const validOrder = await client.query(`
      INSERT INTO public.orders_v2 (
        customer_id, order_number, subtotal, discount, shipping, total, shipping_address_snapshot
      ) VALUES (
        $1, 'FIN-TEST-VALID-01', 200.00, 20.00, 15.00, 195.00, '{"address": "Valid St"}'::jsonb
      ) RETURNING id;
    `, [customerId]);
    const validOrderId = validOrder.rows[0].id;

    const validItem = await client.query(`
      INSERT INTO public.order_items (
        order_id, product_id, product_name, unit_price, quantity, line_total
      ) VALUES (
        $1, $2, 'Valid Item', 100.00, 2, 200.00
      ) RETURNING id;
    `, [validOrderId, productId]);
    console.log(`Valid Order Created: ID ${validOrderId}, Item ID: ${validItem.rows[0].id}`);
    await client.query('ROLLBACK;');
    console.log('Valid transaction succeeded and rolled back cleanly.');

    // TEST 2: Invalid Total Mutation (subtotal: 100, discount: 0, shipping: 10, total: 50 -> math error)
    console.log('\n--- Test 2: Invalid Total Trigger Rejection ---');
    await client.query('BEGIN;');
    let totalRejected = false;
    let totalErrMsg = '';
    try {
      await client.query(`
        INSERT INTO public.orders_v2 (
          customer_id, order_number, subtotal, discount, shipping, total, shipping_address_snapshot
        ) VALUES (
          $1, 'FIN-TEST-INVALID-TOTAL', 100.00, 0.00, 10.00, 50.00, '{"address": "Bad Math"}'::jsonb
        );
      `, [customerId]);
    } catch (err) {
      totalRejected = true;
      totalErrMsg = err.message;
    }
    await client.query('ROLLBACK;');
    console.log('Invalid total rejected:', totalRejected);
    console.log('Error message:', totalErrMsg);

    // TEST 3: Invalid Line Total Mutation (unit_price: 60, quantity: 2, line_total: 90 -> math error)
    console.log('\n--- Test 3: Invalid line_total Trigger Rejection ---');
    await client.query('BEGIN;');
    let lineTotalRejected = false;
    let lineTotalErrMsg = '';
    try {
      const orderHolder = await client.query(`
        INSERT INTO public.orders_v2 (
          customer_id, order_number, subtotal, discount, shipping, total, shipping_address_snapshot
        ) VALUES (
          $1, 'FIN-TEST-ORDER-FOR-ITEM', 120.00, 0.00, 0.00, 120.00, '{}'::jsonb
        ) RETURNING id;
      `, [customerId]);
      await client.query(`
        INSERT INTO public.order_items (
          order_id, product_id, product_name, unit_price, quantity, line_total
        ) VALUES (
          $1, $2, 'Bad Line Item', 60.00, 2, 90.00
        );
      `, [orderHolder.rows[0].id, productId]);
    } catch (err) {
      lineTotalRejected = true;
      lineTotalErrMsg = err.message;
    }
    await client.query('ROLLBACK;');
    console.log('Invalid line_total rejected:', lineTotalRejected);
    console.log('Error message:', lineTotalErrMsg);

    // TEST 4: Invalid Quantity Mutation (quantity: 0 or -1 -> check constraint violation)
    console.log('\n--- Test 4: Invalid Quantity Constraint Rejection ---');
    await client.query('BEGIN;');
    let qtyRejected = false;
    let qtyErrMsg = '';
    try {
      const orderHolder2 = await client.query(`
        INSERT INTO public.orders_v2 (
          customer_id, order_number, subtotal, discount, shipping, total, shipping_address_snapshot
        ) VALUES (
          $1, 'FIN-TEST-ORDER-FOR-QTY', 100.00, 0.00, 0.00, 100.00, '{}'::jsonb
        ) RETURNING id;
      `, [customerId]);
      await client.query(`
        INSERT INTO public.order_items (
          order_id, product_id, product_name, unit_price, quantity, line_total
        ) VALUES (
          $1, $2, 'Zero Qty Item', 100.00, 0, 0.00
        );
      `, [orderHolder2.rows[0].id, productId]);
    } catch (err) {
      qtyRejected = true;
      qtyErrMsg = err.message;
    }
    await client.query('ROLLBACK;');
    console.log('Zero/Negative quantity rejected:', qtyRejected);
    console.log('Error message:', qtyErrMsg);

    console.log('\n=== FINANCIAL INTEGRITY SUMMARY ===');
    console.log(`All financial invariants enforced: ${totalRejected && lineTotalRejected && qtyRejected}`);

  } finally {
    client.release();
    await pool.end();
  }
}

testFinancialIntegrity().catch(console.error);
