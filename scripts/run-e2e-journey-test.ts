import dotenv from "dotenv";
dotenv.config();

const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
const red = (text: string) => `\x1b[31m${text}\x1b[0m`;
const cyan = (text: string) => `\x1b[36m${text}\x1b[0m`;
const yellow = (text: string) => `\x1b[33m${text}\x1b[0m`;

const BASE_URL = "http://localhost:3000";

async function runE2EJourney() {
  console.log(cyan("\n============================================================"));
  console.log(cyan("   MAISON LANA — FULL REAL END-TO-END JOURNEY & SIGN-OFF"));
  console.log(cyan("============================================================\n"));

  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, step: string, details?: string) {
    if (condition) {
      console.log(`${green("✓ PASS")} : ${step}`);
      if (details) console.log(`         ${details}`);
      passCount++;
    } else {
      console.error(`${red("✗ FAIL")} : ${step}`);
      if (details) console.log(`         ${details}`);
      failCount++;
    }
  }

  try {
    // ------------------------------------------------------------
    // STEP 1: REGISTER NEW CUSTOMER
    // ------------------------------------------------------------
    const timestamp = Date.now();
    const customerEmail = `e2e.client.${timestamp}@lanaluxury.com`;
    const customerPass = "LanaHauteSecurity2026!";
    let clientToken = "";
    let customerId = "";

    const regRes = await fetch(`${BASE_URL}/api/customers/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Princess Salma Al-Saud",
        email: customerEmail,
        password: customerPass,
        phone: "+966 50 999 8888"
      })
    });
    const regData = await regRes.json();
    clientToken = regData.token || "";
    customerId = regData.customer?.id || "";

    assert(
      regRes.status === 201 && clientToken.startsWith("client_sess_") && customerId.length > 0,
      "1. Customer Registration & Token Issuance",
      `Customer: ${customerEmail} (ID: ${customerId})`
    );

    // ------------------------------------------------------------
    // STEP 2: CUSTOMER LOGIN VERIFICATION
    // ------------------------------------------------------------
    const loginRes = await fetch(`${BASE_URL}/api/customers/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: customerEmail, password: customerPass })
    });
    const loginData = await loginRes.json();
    assert(
      loginRes.ok && loginData.success && loginData.customer.email === customerEmail,
      "2. Customer Login & Session Authentication",
      `Authenticated as ${loginData.customer.name}`
    );

    // ------------------------------------------------------------
    // STEP 3: CATALOG BROWSING & PRODUCT RETRIEVAL
    // ------------------------------------------------------------
    const prodRes = await fetch(`${BASE_URL}/api/products`);
    const products = await prodRes.json();
    assert(
      prodRes.ok && Array.isArray(products) && products.length > 0,
      "3. Catalog Query & Product Availability",
      `Found ${products.length} curated luxury items in catalog`
    );

    const testProduct = products.find((p: any) => {
      const stock = (p.supplierInventory || []).reduce((sum: number, s: any) => sum + (s.stock || 0), 0);
      return stock >= 2;
    }) || products[0];
    const initialStock = (testProduct.supplierInventory || []).reduce((sum: number, s: any) => sum + (s.stock || 0), 0);

    // ------------------------------------------------------------
    // STEP 4: ORDER CREATION VIA CHECKOUT (MANUAL PAYMENT)
    // ------------------------------------------------------------
    const orderPayload = {
      customerName: "Princess Salma Al-Saud",
      customerPhone: "+966 50 999 8888",
      customerEmail: customerEmail,
      deliveryAddress: "Olaya District, Royal Palace St.",
      city: "Riyadh",
      items: [
        {
          productId: testProduct.id,
          productName: testProduct.name,
          price: testProduct.retailPrice,
          quantity: 1,
          image: testProduct.image
        }
      ],
      totalPrice: testProduct.retailPrice,
      paymentOption: "bank_transfer"
    };

    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${clientToken}`
      },
      body: JSON.stringify(orderPayload)
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      console.log("Order error response:", orderRes.status, orderData);
    }
    const createdOrder = orderData.order;

    assert(
      orderRes.status === 201 && createdOrder?.id,
      "4. Order Creation & Central Ledger Recording",
      `Order ID: #${createdOrder?.id} — Total: $${createdOrder?.totalPrice}`
    );

    // ------------------------------------------------------------
    // STEP 5: VERIFY INITIAL STATUS (PAYMENT = PENDING, ORDER = PENDING)
    // ------------------------------------------------------------
    assert(
      createdOrder.paymentStatus === "Pending" && createdOrder.status === "Pending",
      "5. Initial Payment & Order State Verification",
      `Payment: ${createdOrder.paymentStatus} | Order: ${createdOrder.status}`
    );

    // ------------------------------------------------------------
    // STEP 6: CUSTOMER TRACKING LOOKUP (AUTHORIZED)
    // ------------------------------------------------------------
    const trackRes = await fetch(`${BASE_URL}/api/orders/${createdOrder.id}`, {
      headers: { "Authorization": `Bearer ${clientToken}` }
    });
    const trackData = await trackRes.json();
    assert(
      trackRes.ok && trackData.id === createdOrder.id && trackData.paymentStatus === "Pending",
      "6. Customer Order Tracking (Authorized Access)",
      `Order #${trackData.id} tracked with status: ${trackData.status}`
    );

    // ------------------------------------------------------------
    // STEP 7: ADMIN AUTHENTICATION
    // ------------------------------------------------------------
    const adminEmail = process.env.ADMIN_EMAIL || "lanamarketplacehq@gmail.com";
    const adminPass = process.env.ADMIN_PASSWORD || "@Maan6855";

    const adminLogRes = await fetch(`${BASE_URL}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPass })
    });
    const adminLogData = await adminLogRes.json();
    const adminToken = adminLogData.token || "";

    assert(
      adminLogRes.ok && adminToken.startsWith("admin_sess_"),
      "7. Atelier Admin Authentication",
      `Admin Session Established: ${adminToken.substring(0, 18)}...`
    );

    // ------------------------------------------------------------
    // STEP 8: ADMIN VERIFIES PAYMENT (MARK AS PAID)
    // ------------------------------------------------------------
    const payRes = await fetch(`${BASE_URL}/api/orders/${createdOrder.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({ paymentStatus: "Paid" })
    });
    const payData = await payRes.json();
    if (!payRes.ok) {
      console.log("Pay error response:", payRes.status, payData);
    }
    const updatedPaymentStatus = payData.paymentStatus || payData.order?.paymentStatus;

    assert(
      payRes.ok && updatedPaymentStatus === "Paid",
      "8. Admin Payment Verification (Marked as Paid)",
      `Updated Payment Status: ${updatedPaymentStatus}`
    );

    // ------------------------------------------------------------
    // STEP 9: ADMIN LIFECYCLE PROGRESSION (IN PROGRESS -> DISPATCHED -> COMPLETED)
    // ------------------------------------------------------------
    // 9a. Pending -> In Progress
    const inProgRes = await fetch(`${BASE_URL}/api/orders/${createdOrder.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: "In Progress" })
    });
    const inProgData = await inProgRes.json();

    // 9b. In Progress -> Dispatched
    const dispRes = await fetch(`${BASE_URL}/api/orders/${createdOrder.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: "Dispatched" })
    });
    const dispData = await dispRes.json();

    // 9c. Dispatched -> Completed
    const compRes = await fetch(`${BASE_URL}/api/orders/${createdOrder.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: "Completed" })
    });
    const compData = await compRes.json();
    const finalOrderStatus = compData.status || compData.order?.status;

    assert(
      inProgRes.ok && dispRes.ok && compRes.ok && finalOrderStatus === "Completed",
      "9. State Machine Transition (In Progress → Dispatched → Completed)",
      `Final State: ${finalOrderStatus}`
    );

    // ------------------------------------------------------------
    // STEP 10: CUSTOMER REFRESHES & SEES UPDATED COMPLETED ORDER
    // ------------------------------------------------------------
    const custCheckRes = await fetch(`${BASE_URL}/api/orders/${createdOrder.id}`, {
      headers: { "Authorization": `Bearer ${clientToken}` }
    });
    const custCheckData = await custCheckRes.json();

    assert(
      custCheckRes.ok && custCheckData.paymentStatus === "Paid" && custCheckData.status === "Completed",
      "10. Customer Real-Time Tracking State Synchronization",
      `Customer views Payment: ${custCheckData.paymentStatus} | Status: ${custCheckData.status}`
    );

    // ------------------------------------------------------------
    // STEP 11: CUSTOMER ORDER HISTORY LEDGER
    // ------------------------------------------------------------
    const ordersLedgerRes = await fetch(`${BASE_URL}/api/orders`, {
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    const allOrders = await ordersLedgerRes.json();
    const persistedOrder = allOrders.find((o: any) => o.id === createdOrder.id);

    assert(
      ordersLedgerRes.ok && persistedOrder && persistedOrder.status === "Completed" && persistedOrder.paymentStatus === "Paid",
      "11. Central Ledger Persistence & Reconciliation",
      `Ledger Record #${persistedOrder?.id} verified`
    );

    // ------------------------------------------------------------
    // STEP 12: INVENTORY DEDUCTION CONFIRMATION
    // ------------------------------------------------------------
    const postProdRes = await fetch(`${BASE_URL}/api/products`);
    const postProducts = await postProdRes.json();
    const updatedProduct = postProducts.find((p: any) => p.id === testProduct.id);
    const updatedStock = (updatedProduct?.supplierInventory || []).reduce((sum: number, s: any) => sum + (s.stock || 0), 0);

    assert(
      postProdRes.ok && updatedStock === initialStock - 1,
      "12. Atomic Inventory Decrement Verification",
      `Initial: ${initialStock} → Current: ${updatedStock}`
    );

  } catch (err: any) {
    console.error("E2E Test Exception:", err);
    assert(false, "E2E Test Execution", err.message);
  }

  console.log(cyan("\n============================================================"));
  console.log(cyan("              E2E JOURNEY TEST SUMMARY"));
  console.log(cyan("============================================================"));
  console.log(`TOTAL PASSED Steps : ${green(passCount.toString())}`);
  console.log(`TOTAL FAILED Steps : ${failCount === 0 ? green("0") : red(failCount.toString())}`);
  console.log(cyan("============================================================\n"));

  if (failCount > 0) {
    process.exit(1);
  }
}

runE2EJourney();
