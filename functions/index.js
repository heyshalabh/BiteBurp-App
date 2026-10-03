/**
 * BiteBurp Cloud Functions — payment order creation & verification
 *
 * Deploy with Firebase CLI after setting secrets:
 *   firebase functions:config:set razorpay.key_id="rzp_..." razorpay.key_secret="..."
 *   (or use Secret Manager / defineSecret in newer Firebase Functions)
 *
 * NEVER put key_secret in frontend code.
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// Placeholder: load secrets from functions config
function getRazorpayConfig() {
  const cfg = functions.config().razorpay || {};
  return {
    keyId: cfg.key_id || process.env.RAZORPAY_KEY_ID || "",
    keySecret: cfg.key_secret || process.env.RAZORPAY_KEY_SECRET || ""
  };
}

/**
 * Recalculate order amount from Firestore products — never trust client amount.
 */
async function computeAmount(productName, quantity) {
  const snap = await db.collection("products").where("name", "==", productName).limit(1).get();
  let unit = 59;
  if (!snap.empty) {
    unit = Number(snap.docs[0].data().price) || 59;
  }
  const qty = Math.min(20, Math.max(1, Number(quantity) || 1));
  return { amountInr: unit * qty, quantity: qty, unitPrice: unit };
}

/**
 * HTTPS: create payment order (Razorpay example)
 * Body: { productId/name, quantity, customerName, customerPhone, location, note }
 */
exports.createPaymentOrder = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = req.body || {};
    const { amountInr, quantity, unitPrice } = await computeAmount(
      body.productId || body.product || "BiteBurp Post-Workout Box",
      body.quantity
    );

    const { keyId, keySecret } = getRazorpayConfig();
    if (!keyId || !keySecret) {
      return res.status(503).json({
        error: "Payment gateway not configured",
        mode: "manual_upi"
      });
    }

    // Dynamic require so the package is optional until installed
    const Razorpay = require("razorpay");
    const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await instance.orders.create({
      amount: amountInr * 100, // paise
      currency: "INR",
      receipt: "bb_" + Date.now(),
      notes: {
        customerName: String(body.customerName || "").slice(0, 80),
        customerPhone: String(body.customerPhone || "").slice(0, 15),
        location: String(body.location || "").slice(0, 120)
      }
    });

    // Store pending order shell (paymentStatus pending)
    const token = await generateUniqueToken();
    const docRef = await db.collection("orders").add({
      token,
      name: String(body.customerName || "").slice(0, 80),
      phone: String(body.customerPhone || "").slice(0, 15),
      product: body.productId || body.product || "BiteBurp Post-Workout Box",
      quantity,
      unitPrice,
      total: amountInr,
      location: String(body.location || "").slice(0, 120),
      note: String(body.note || "").slice(0, 200),
      status: "Order Received",
      statusStep: 1,
      paymentStatus: "pending",
      gateway: "razorpay",
      gatewayOrderId: order.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.json({
      mode: "razorpay",
      keyId,
      gatewayOrderId: order.id,
      amount: amountInr,
      amountPaise: amountInr * 100,
      currency: "INR",
      firestoreOrderId: docRef.id,
      token
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Could not create payment order" });
  }
});

/**
 * HTTPS: verify Razorpay payment signature and mark order paid
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, firestoreOrderId }
 */
exports.verifyPayment = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const crypto = require("crypto");
    const { keySecret } = getRazorpayConfig();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      firestoreOrderId
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !firestoreOrderId) {
      return res.status(400).json({ verified: false, error: "Missing fields" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto.createHmac("sha256", keySecret).update(body).digest("hex");
    if (expected !== razorpay_signature) {
      return res.status(400).json({ verified: false, error: "Invalid signature" });
    }

    await db.collection("orders").doc(firestoreOrderId).update({
      paymentStatus: "paid",
      status: "Payment Verification",
      statusStep: 2,
      gatewayPaymentId: razorpay_payment_id,
      paidAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const doc = await db.collection("orders").doc(firestoreOrderId).get();
    return res.json({ verified: true, token: doc.exists ? doc.data().token : null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ verified: false, error: "Verification failed" });
  }
});

async function generateUniqueToken() {
  for (let i = 0; i < 30; i++) {
    const digits = String(Math.floor(100000 + Math.random() * 900000));
    const token = "BB" + digits;
    const existing = await db.collection("orders").where("token", "==", token).limit(1).get();
    if (existing.empty) return token;
  }
  return "BB" + String(Date.now()).slice(-6);
}
