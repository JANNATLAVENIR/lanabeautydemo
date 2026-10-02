import dotenv from "dotenv";
dotenv.config();

// Define colored logger helpers
const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
const red = (text: string) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text: string) => `\x1b[33m${text}\x1b[0m`;
const cyan = (text: string) => `\x1b[36m${text}\x1b[0m`;

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log(cyan("\n============================================================"));
  console.log(cyan("      MAISON LANA — PRODUCTION HARDEST SECURITY & QA SUITE"));
  console.log(cyan("============================================================\n"));

  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`${green("✓ PASS")} : ${testName}`);
      if (details) console.log(`         ${details}`);
      passCount++;
    } else {
      console.error(`${red("✗ FAIL")} : ${testName}`);
      if (details) console.log(`         ${details}`);
      failCount++;
    }
  }

  // --- SETUP ENV CREDENTIALS FOR TESTING ---
  const adminEmail = process.env.ADMIN_EMAIL || "lanamarketplacehq@gmail.com";
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminPass) throw new Error("ADMIN_PASSWORD is required to run the production test suite.");

  // ============================================================
  // TEST 1: ADMIN LOGIN WITH CORRECT CREDENTIALS
  // ============================================================
  let adminToken = "";
  try {
    const res = await fetch(`${BASE_URL}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPass })
    });
    const data = await res.json();
    adminToken = data.token || "";
    assert(res.ok && adminToken.startsWith("lana_tok."), "Admin Auth Token Generation", `Session Token: ${adminToken.substring(0, 20)}...`);
  } catch (err: any) {
    assert(false, "Admin Auth Token Generation", err.message);
  }

  // ============================================================
  // TEST 2: ADMIN LOGIN REJECTION WITH INCORRECT/DEFAULT FALLBACKS
  // ============================================================
  try {
    const res = await fetch(`${BASE_URL}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "lanamarketplacehq@gmail.com", password: "WRONG_PASSWORD" })
    });
    assert(res.status === 401, "Admin Rejects Incorrect Password", `Returned HTTP Status: ${res.status}`);
  } catch (err: any) {
    assert(false, "Admin Rejects Incorrect Password", err.message);
  }

  // ============================================================
  // TEST 3: ADMIN ENDPOINT RESTRICTION (ANONYMOUS REJECTION)
  // ============================================================
  try {
    const res = await fetch(`${BASE_URL}/api/orders`);
    assert(res.status === 403, "Anonymous Request Rejects Sensitive Orders Fetch", `Returned HTTP Status: ${res.status}`);
  } catch (err: any) {
    assert(false, "Anonymous Request Rejects Sensitive Orders Fetch", err.message);
  }

  // ============================================================
  // TEST 4: CUSTOMER REGISTRATION & BCRYPT HASH SECURITY
  // ============================================================
  const customerEmail = `test.client.${Date.now()}@example.com`;
  const customerPass = "SecureCustomerPass123!";
  let customerToken = "";
  let customerId = "";

  try {
    const res = await fetch(`${BASE_URL}/api/customers/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Amina Test Client",
        email: customerEmail,
        password: customerPass,
        phone: "+966 50 111 2222"
      })
    });
    const data = await res.json();
    customerToken = data.token || "";
    customerId = data.customer?.id || "";
    assert(res.status === 201 && customerToken.startsWith("client_sess_"), "Customer Hashed Registration & Session Token", `Customer ID: ${customerId}`);
  } catch (err: any) {
    assert(false, "Customer Hashed Registration & Session Token", err.message);
  }

  // ============================================================
  // TEST 5: CUSTOMER LOGIN VERIFICATION & COMPREHENSIVE AUTH
  // ============================================================
  try {
    const res = await fetch(`${BASE_URL}/api/customers/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: customerEmail, password: customerPass })
    });
    const data = await res.json();
    assert(res.ok && data.token && data.customer.email === customerEmail, "Customer Stateful Session Login Verification");
  } catch (err: any) {
    assert(false, "Customer Stateful Session Login Verification", err.message);
  }

  // ============================================================
  // TEST 6: CUSTOMER DATA ISOLATION (IDOR PROTECTION)
  // ============================================================
  try {
    // Access with no token
    const resNoToken = await fetch(`${BASE_URL}/api/customers/me`);
    // Access with customer token
    const resWithToken = await fetch(`${BASE_URL}/api/customers/me`, {
      headers: { "Authorization": `Bearer ${customerToken}` }
    });
    const data = await resWithToken.json();

    assert(resNoToken.status === 401 && resWithToken.ok && data.email === customerEmail, "Strict Customer Profile Session Isolation & IDOR Shield");
  } catch (err: any) {
    assert(false, "Strict Customer Profile Session Isolation & IDOR Shield", err.message);
  }

  // ============================================================
  // TEST 7: ORDER CREATION WITH AUTHORITATIVE PRICING
  // ============================================================
  let placedOrderId = "";
  try {
    const payload = {
      customerName: "Amina Test Client",
      customerPhone: "+966 50 111 2222",
      customerEmail: customerEmail,
      deliveryAddress: "Olaya District, Riyadh",
      city: "Riyadh",
      items: [
        {
          productId: "prod-3",
          quantity: 1,
          price: 1.00 // Client-side pricing manipulation attack!
        }
      ],
      paymentMethod: "Manual Bank Transfer"
    };

    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    placedOrderId = data.orderId || "";

    // The backend should ignore the client price of $1.00 and charge the actual authoritative price (280 or 65)
    const isPriceEnforced = data.order?.totalPrice !== 1.00 && (data.order?.totalPrice === 280 || data.order?.totalPrice === 65);

    assert(res.status === 201 && isPriceEnforced, "Authoritative Pricing Enforcement (Price Manipulation Rejection)", `Server Enforced Total: $${data.order?.totalPrice} (Client submitted: $1.00)`);
  } catch (err: any) {
    assert(false, "Authoritative Pricing Enforcement (Price Manipulation Rejection)", err.message);
  }

  // ============================================================
  // TEST 8: ORDER IDEMPOTENCY SAFETY
  // ============================================================
  try {
    const payload = {
      customerName: "Amina Test Client",
      customerPhone: "+966 50 111 2222",
      customerEmail: customerEmail,
      deliveryAddress: "Olaya District, Riyadh",
      city: "Riyadh",
      items: [{ productId: "prod-3", quantity: 1 }],
      paymentMethod: "Manual Bank Transfer"
    };

    const idemKey = `test_idem_${Date.now()}`;

    // First checkout request
    const res1 = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Idempotency-Key": idemKey
      },
      body: JSON.stringify(payload)
    });
    const data1 = await res1.json();

    // Second immediate duplicate checkout request
    const res2 = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Idempotency-Key": idemKey
      },
      body: JSON.stringify(payload)
    });
    const data2 = await res2.json();

    assert(res1.status === 201 && res2.status === 200 && data1.orderId === data2.orderId, "Idempotency Safety (Duplicate Request Matching)", `Duplicate matched: ${data2.orderId}`);
  } catch (err: any) {
    assert(false, "Idempotency Safety (Duplicate Request Matching)", err.message);
  }

  // ============================================================
  // TEST 9: MANUAL PAYMENT VERIFICATION STATE transitions
  // ============================================================
  try {
    // Fetch newly created order details to check default payment status (authenticated as the order's owner)
    const resDetail = await fetch(`${BASE_URL}/api/orders/${placedOrderId}`, {
      headers: { "Authorization": `Bearer ${customerToken}` }
    });
    const orderData = await resDetail.json();

    const isInitialPending = orderData.paymentStatus === "Pending";

    // Attempt invalid transition: PENDING -> Dispatched directly (skipping In Progress)
    const resInvalidTransition = await fetch(`${BASE_URL}/api/orders/${placedOrderId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: "Dispatched" })
    });

    assert(isInitialPending && resInvalidTransition.status === 400, "Payment & Order State Machine Protection", `Initial Payment Status: ${orderData.paymentStatus}, Rejects Dispatched skip: Status ${resInvalidTransition.status}`);
  } catch (err: any) {
    assert(false, "Payment & Order State Machine Protection", err.message);
  }

  // ============================================================
  // TEST 10: VERIFY SUCCESSFUL STATE TRANSITIONS (PENDING -> PROCESSING)
  // ============================================================
  try {
    // Authorized transition: mark as Paid (Pending -> PAID) and In Progress (Pending -> In Progress)
    const resValid = await fetch(`${BASE_URL}/api/orders/${placedOrderId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: "In Progress", paymentStatus: "PAID" })
    });
    const updatedData = await resValid.json();

    assert(resValid.ok && updatedData.status === "In Progress" && updatedData.paymentStatus === "PAID", "Authorized Admin Payment & Order Transitions Approved");
  } catch (err: any) {
    assert(false, "Authorized Admin Payment & Order Transitions Approved", err.message);
  }

  // ============================================================
  // TEST 11: REJECT UNAUTHORIZED STATE MANIPULATION BY CUSTOMER
  // ============================================================
  try {
    const resCustomerHack = await fetch(`${BASE_URL}/api/orders/${placedOrderId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${customerToken}`
      },
      body: JSON.stringify({ paymentStatus: "PAID", status: "Completed" })
    });

    assert(resCustomerHack.status === 403, "Strict Protection: Customer Forbidden From Order State Manipulation", `Returned HTTP Status: ${resCustomerHack.status}`);
  } catch (err: any) {
    assert(false, "Strict Protection: Customer Forbidden From Order State Manipulation", err.message);
  }

  // ============================================================
  // TEST 12: ENUMERATION-RESISTANT FORGOT PASSWORD
  // ============================================================
  try {
    const resForgot = await fetch(`${BASE_URL}/api/customers/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "malicious.hacker@example.com" })
    });
    const dataForgot = await resForgot.json();

    assert(resForgot.ok && dataForgot.success === true, "Enumeration-Resistant Password Recovery (Anti-Brute Force Account Discovery)");
  } catch (err: any) {
    assert(false, "Enumeration-Resistant Password Recovery (Anti-Brute Force Account Discovery)", err.message);
  }

  // ============================================================
  // TEST 13: ATOMIC CONCURRENCY SIMULATION
  // ============================================================
  console.log(yellow("\n[CONCURRENCY] Simulating concurrent checkout attacks..."));
  try {
    // 1. Setup a product with 1 available inventory
    const resAdminFetch = await fetch(`${BASE_URL}/api/products`);
    const productsList = await resAdminFetch.json();
    const targetProduct = productsList.find((p: any) => p.id === "prod-1") || productsList[0];

    // Force its inventory to exactly 1 stock
    const customInventory = [{ storeId: "store-1", wholesaleCost: 175, stock: 1 }];
    await fetch(`${BASE_URL}/api/products/${targetProduct.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({ supplierInventory: customInventory })
    });

    // 2. Fire two checkout requests simultaneously!
    const checkoutPayload = {
      customerName: "Race Client",
      customerPhone: "+966500000000",
      customerEmail: `race.${Date.now()}@example.com`,
      deliveryAddress: "Concurrency Ave",
      city: "Jeddah",
      items: [{ productId: targetProduct.id, quantity: 1 }]
    };

    const req1 = fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkoutPayload)
    });

    const req2 = fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkoutPayload)
    });

    const [response1, response2] = await Promise.all([req1, req2]);
    const success1 = response1.status === 201;
    const success2 = response2.status === 201;

    // Correct expected behavior: Exactly one checkout must succeed, and one must be rejected!
    const onlyOneSucceeded = (success1 && !success2) || (!success1 && success2);

    assert(onlyOneSucceeded, "Database Row-Locking Concurrency Safe Checkout (No Double Sell)", `Req 1 Code: ${response1.status}, Req 2 Code: ${response2.status}`);
  } catch (err: any) {
    assert(false, "Database Row-Locking Concurrency Safe Checkout (No Double Sell)", err.message);
  }

  // --- REPORT SUMMARY ---
  console.log(cyan("\n============================================================"));
  console.log(cyan("                  QA SUITE RUN COMPLETE"));
  console.log(cyan("============================================================"));
  console.log(`TOTAL PASSED Tests : ${green(String(passCount))}`);
  console.log(`TOTAL FAILED Tests : ${failCount > 0 ? red(String(failCount)) : green("0")}`);
  console.log(cyan("============================================================\n"));

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
