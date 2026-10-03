/**
 * ==============================================================================
 * BiteBurp - Campus Food Startup Frontend Logic
 * "Good Bites. Big Vibes."
 * ==============================================================================
 */

// ==============================================================================
// 1. SIMPLE CONFIGURATION OBJECT
// Edit these values easily without touching the rest of the application code!
// ==============================================================================
const BITEBURP_CONFIG = {
  // Brand details
  brandName: "BiteBurp",
  tagline: "Good Bites. Big Vibes.",

  // Product configuration
  productName: "BiteBurp Post-Workout Box",
  productPrice: 59, // Price in INR (₹)
  currencySymbol: "₹",
  
  // Operating timing
  openingTime: "6:00 PM",
  closingTime: "8:00 PM",
  isOrderingOpen: true, // Set to false if kitchen is closed

  // Stock management
  stockRemaining: 24,
  maxDailyStock: 50,

  // UPI Payment settings (fallback manual UPI until gateway is live)
  upiId: "biteburp@upi",
  upiPayeeName: "BiteBurp Campus Food",

  // Pickup Locations
  pickupLocations: [
    "Campus Gym Entrance (Main Gate)",
    "Hostel Block C - Lawn Bench",
    "Student Activity Center (SAC) Portico",
    "Library Back Parking Stand"
  ],

  // Social & Community Links
  instagramLink: "https://instagram.com/biteburp",
  whatsappNumber: "+919876543210",

  // -------------------------------------------------------------------------
  // STORY / MAKING VIDEO — set ONE of these (YouTube URL or direct video URL)
  // Examples:
  //   storyVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  //   storyVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
  //   storyVideoUrl: "https://cdn.example.com/biteburp-making.mp4"
  // Leave empty string to show the "Video coming soon" placeholder.
  // -------------------------------------------------------------------------
  storyVideoUrl: "",

  // -------------------------------------------------------------------------
  // DONATION / SUPPORT — configure QR image URL and/or payment link
  // -------------------------------------------------------------------------
  donateQrImageUrl: "",          // e.g. "/assets/donate-qr.png" or a hosted URL
  donatePaymentLink: "",         // e.g. "https://razorpay.me/@biteburp" or UPI deep link

  // -------------------------------------------------------------------------
  // FIREBASE — paste your Firebase web app config here
  // Leave useFirebase: false to run fully on localStorage (demo mode).
  // -------------------------------------------------------------------------
  useFirebase: false,
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  },

  // -------------------------------------------------------------------------
  // PAYMENT GATEWAY (Razorpay / PayU) — FRONTEND KEYS ONLY
  // Secret keys must NEVER appear here. Use Cloud Functions for order creation
  // and signature verification. See functions/ and PAYMENT.md.
  // -------------------------------------------------------------------------
  payment: {
    provider: "manual_upi", // "manual_upi" | "razorpay" | "payu"
    razorpayKeyId: "",      // public key_id only (rzp_live_... or rzp_test_...)
    // Create order + verify via Cloud Function endpoints:
    createOrderUrl: "/api/createPaymentOrder",
    verifyPaymentUrl: "/api/verifyPayment"
  }
};

// ==============================================================================
// 2. STATE & MEMORY MANAGEMENT
// ==============================================================================
const AppState = {
  currentQuantity: 1,
  currentTotal: BITEBURP_CONFIG.productPrice,
  currentOrderDraft: null,
  activeToken: null
};

// ==============================================================================
// 3. INITIALIZATION ON DOM READY
// ==============================================================================
document.addEventListener("DOMContentLoaded", () => {
  initAppConfig();
  initNavbarAndMobileMenu();
  initQuantityControls();
  initOrderForm();
  initPaymentFlow();
  initAccordion();
  initFeedbackForm();
  initMobileStickyBar();
  setupPosterQR();
  initStoryVideo();
  initDonationModal();
  // Demo orders only when not using Firebase
  if (!BITEBURP_CONFIG.useFirebase) {
    seedDemoOrdersIfEmpty();
  }
  // Firebase bootstrap (no-op if useFirebase is false or config is placeholder)
  initFirebaseIfEnabled();
});

// ==============================================================================
// 4. INJECT CONFIGURATION INTO DOM
// ==============================================================================
function initAppConfig() {
  // Update prices across text elements
  document.querySelectorAll(".config-price-text").forEach(el => {
    el.textContent = `${BITEBURP_CONFIG.currencySymbol}${BITEBURP_CONFIG.productPrice}`;
  });
  document.querySelectorAll(".config-price-val").forEach(el => {
    el.textContent = BITEBURP_CONFIG.productPrice;
  });

  // Update product titles
  document.querySelectorAll(".config-product-title").forEach(el => {
    el.textContent = BITEBURP_CONFIG.productName;
  });

  // Update operating hours
  const hoursStr = `${BITEBURP_CONFIG.openingTime} — ${BITEBURP_CONFIG.closingTime}`;
  document.querySelectorAll(".config-hours-text").forEach(el => {
    el.textContent = hoursStr;
  });
  const opHoursDisp = document.getElementById("operatingHoursDisplay");
  if (opHoursDisp) opHoursDisp.textContent = `${BITEBURP_CONFIG.openingTime} – ${BITEBURP_CONFIG.closingTime}`;

  // Operating status
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");
  const stockDisplay = document.getElementById("stockDisplay");

  if (BITEBURP_CONFIG.isOrderingOpen && BITEBURP_CONFIG.stockRemaining > 0) {
    if (statusDot) {
      statusDot.className = "status-dot pulse";
    }
    if (statusText) {
      statusText.textContent = "OPEN";
      statusText.style.color = "#34D399";
    }
    if (stockDisplay) {
      stockDisplay.textContent = `${BITEBURP_CONFIG.stockRemaining} boxes left`;
    }
  } else {
    if (statusDot) {
      statusDot.className = "status-dot closed";
    }
    if (statusText) {
      statusText.textContent = BITEBURP_CONFIG.stockRemaining <= 0 ? "SOLD OUT" : "CLOSED";
      statusText.style.color = "#F87171";
    }
    if (stockDisplay) {
      stockDisplay.textContent = "Orders closed for today";
    }
  }

  // Populate Pickup Location Select
  const pickupSelect = document.getElementById("pickupLocation");
  if (pickupSelect) {
    pickupSelect.innerHTML = '<option value="" disabled selected>Select a campus pickup point...</option>';
    BITEBURP_CONFIG.pickupLocations.forEach(loc => {
      const opt = document.createElement("option");
      opt.value = loc;
      opt.textContent = loc;
      pickupSelect.appendChild(opt);
    });
  }

  // Populate Product Select options
  const productSelect = document.getElementById("productSelect");
  if (productSelect) {
    productSelect.innerHTML = `<option value="${BITEBURP_CONFIG.productName}" selected>${BITEBURP_CONFIG.productName} (${BITEBURP_CONFIG.currencySymbol}${BITEBURP_CONFIG.productPrice})</option>`;
  }

  // UPI ID text
  const upiIdText = document.getElementById("upiIdText");
  if (upiIdText) upiIdText.textContent = BITEBURP_CONFIG.upiId;

  // Social Links
  const igLink = document.getElementById("footerInstagram");
  if (igLink) igLink.href = BITEBURP_CONFIG.instagramLink;

  const waLink = document.getElementById("footerWhatsapp");
  if (waLink) {
    waLink.href = `https://wa.me/${BITEBURP_CONFIG.whatsappNumber.replace(/[^0-9]/g, "")}?text=Hi%20BiteBurp!%20I%20have%20a%20question%20about%20today's%20snack%20box.`;
  }
}

// ==============================================================================
// 5. NAVBAR & MOBILE DRAWER
// ==============================================================================
function initNavbarAndMobileMenu() {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const mobileDrawer = document.getElementById("mobileDrawer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const mobileNavLinks = document.querySelectorAll(".mobile-nav-link, .mobile-drawer-btn");
  const desktopNavLinks = document.querySelectorAll(".nav-link");

  function openMenu() {
    hamburgerBtn.classList.add("is-active");
    hamburgerBtn.setAttribute("aria-expanded", "true");
    mobileDrawer.classList.add("open");
    drawerBackdrop.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    hamburgerBtn.classList.remove("is-active");
    hamburgerBtn.setAttribute("aria-expanded", "false");
    mobileDrawer.classList.remove("open");
    drawerBackdrop.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (hamburgerBtn && mobileDrawer) {
    hamburgerBtn.addEventListener("click", () => {
      const isOpen = mobileDrawer.classList.contains("open");
      isOpen ? closeMenu() : openMenu();
    });

    if (drawerBackdrop) {
      drawerBackdrop.addEventListener("click", closeMenu);
    }

    mobileNavLinks.forEach(link => {
      link.addEventListener("click", () => {
        closeMenu();
      });
    });
  }

  // Active link highlighter on scroll
  const sections = document.querySelectorAll("section[id]");
  window.addEventListener("scroll", () => {
    let scrollY = window.pageYOffset;
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute("id");

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        desktopNavLinks.forEach(link => {
          link.classList.remove("active");
          if (link.getAttribute("href") === `#${sectionId}`) {
            link.classList.add("active");
          }
        });
      }
    });
  });
}

// ==============================================================================
// 6. QUANTITY SELECTOR & PRICE CALCULATION
// ==============================================================================
function initQuantityControls() {
  const qtyMinus = document.getElementById("qtyMinus");
  const qtyPlus = document.getElementById("qtyPlus");
  const qtyInput = document.getElementById("qtyInput");

  if (!qtyMinus || !qtyPlus || !qtyInput) return;

  function updateQuantity(newQty) {
    if (newQty < 1) newQty = 1;
    if (newQty > 10) newQty = 10;
    
    AppState.currentQuantity = newQty;
    qtyInput.value = newQty;
    AppState.currentTotal = newQty * BITEBURP_CONFIG.productPrice;

    // Update Live Calculation lines
    const calcUnitLine = document.getElementById("calcUnitLine");
    const calcTotalAmount = document.getElementById("calcTotalAmount");
    const btnTotalPreview = document.getElementById("btnTotalPreview");

    if (calcUnitLine) {
      calcUnitLine.textContent = `${newQty} × ${BITEBURP_CONFIG.currencySymbol}${BITEBURP_CONFIG.productPrice}`;
    }
    if (calcTotalAmount) {
      calcTotalAmount.textContent = `${BITEBURP_CONFIG.currencySymbol}${AppState.currentTotal}`;
    }
    if (btnTotalPreview) {
      btnTotalPreview.textContent = `(Pay ${BITEBURP_CONFIG.currencySymbol}${AppState.currentTotal})`;
    }
  }

  qtyMinus.addEventListener("click", () => {
    updateQuantity(AppState.currentQuantity - 1);
  });

  qtyPlus.addEventListener("click", () => {
    updateQuantity(AppState.currentQuantity + 1);
  });

  // Initial trigger
  updateQuantity(1);
}

// Smooth scroll to order and select box
function scrollToOrderWithProduct() {
  const orderSection = document.getElementById("order");
  if (orderSection) {
    orderSection.scrollIntoView({ behavior: "smooth" });
    const nameField = document.getElementById("custName");
    if (nameField) {
      setTimeout(() => nameField.focus(), 500);
    }
  }
}

// ==============================================================================
// 7. ORDER FORM & VALIDATION (Step 1)
// ==============================================================================
function initOrderForm() {
  const orderForm = document.getElementById("orderForm");
  if (!orderForm) return;

  orderForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Check if kitchen is open
    if (!BITEBURP_CONFIG.isOrderingOpen || BITEBURP_CONFIG.stockRemaining <= 0) {
      showToast("Orders for today's batch are currently closed or sold out.", "error");
      return;
    }

    const nameInput = document.getElementById("custName");
    const phoneInput = document.getElementById("custPhone");
    const pickupInput = document.getElementById("pickupLocation");
    const noteInput = document.getElementById("orderNote");

    let isValid = true;

    // Validate Name
    if (!nameInput.value.trim()) {
      showFieldError("custName", true);
      isValid = false;
    } else {
      showFieldError("custName", false);
    }

    // Validate Phone (10 digits)
    const phoneVal = phoneInput.value.trim().replace(/\D/g, "");
    if (phoneVal.length !== 10) {
      showFieldError("custPhone", true);
      isValid = false;
    } else {
      showFieldError("custPhone", false);
    }

    // Validate Pickup Location
    if (!pickupInput.value) {
      pickupInput.parentElement.parentElement.classList.add("has-error");
      isValid = false;
    } else {
      pickupInput.parentElement.parentElement.classList.remove("has-error");
    }

    if (!isValid) {
      showToast("Please fill in all required order details correctly.", "error");
      return;
    }

    // Save current draft
    AppState.currentOrderDraft = {
      name: nameInput.value.trim(),
      phone: phoneVal,
      product: BITEBURP_CONFIG.productName,
      quantity: AppState.currentQuantity,
      total: AppState.currentTotal,
      location: pickupInput.value,
      note: noteInput ? noteInput.value.trim() : "",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString()
    };

    // Transition to Payment Step
    showPaymentStep();
  });
}

function showFieldError(fieldId, hasError) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  const parent = el.closest(".form-group");
  if (parent) {
    if (hasError) {
      parent.classList.add("has-error");
    } else {
      parent.classList.remove("has-error");
    }
  }
}

// ==============================================================================
// 8. PAYMENT FLOW (Step 2)
// ==============================================================================
function initPaymentFlow() {
  const copyUpiBtn = document.getElementById("copyUpiBtn");
  if (copyUpiBtn) {
    copyUpiBtn.addEventListener("click", () => {
      copyToClipboard(BITEBURP_CONFIG.upiId, "UPI ID copied to clipboard!");
    });
  }

  const backToDetailsBtn = document.getElementById("backToDetailsBtn");
  if (backToDetailsBtn) {
    backToDetailsBtn.addEventListener("click", () => {
      document.getElementById("paymentStep").classList.add("hidden");
      document.getElementById("orderFormStep").classList.remove("hidden");
      document.getElementById("order").scrollIntoView({ behavior: "smooth" });
    });
  }

  // Payment Confirmation Form
  const paymentConfirmForm = document.getElementById("paymentConfirmForm");
  if (paymentConfirmForm) {
    paymentConfirmForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleConfirmPayment();
    });
  }
}

function showPaymentStep() {
  const orderFormStep = document.getElementById("orderFormStep");
  const paymentStep = document.getElementById("paymentStep");
  const payAmountDisplay = document.getElementById("payAmountDisplay");
  const upiQrImage = document.getElementById("upiQrImage");
  const upiDeepLink = document.getElementById("upiDeepLink");

  if (!AppState.currentOrderDraft) return;

  // Update Amount
  if (payAmountDisplay) {
    payAmountDisplay.textContent = `${BITEBURP_CONFIG.currencySymbol}${AppState.currentOrderDraft.total}`;
  }

  // Generate UPI Intent String
  // upi://pay?pa=...&pn=...&am=...&cu=INR&tn=BiteBurpOrder
  const upiUrl = `upi://pay?pa=${encodeURIComponent(BITEBURP_CONFIG.upiId)}&pn=${encodeURIComponent(BITEBURP_CONFIG.upiPayeeName)}&am=${AppState.currentOrderDraft.total}&cu=INR&tn=BiteBurp-${AppState.currentOrderDraft.name.replace(/\s+/g, '')}`;

  // Set deep-link for mobile app opening
  if (upiDeepLink) {
    upiDeepLink.href = upiUrl;
  }

  // Generate Dynamic QR Code image using public QR server API with high reliability
  if (upiQrImage) {
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=8&data=${encodeURIComponent(upiUrl)}`;
    upiQrImage.src = qrApiUrl;
    upiQrImage.onerror = () => {
      // Fallback SVG if offline or API blocked
      upiQrImage.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
          <rect width="200" height="200" fill="#fff"/>
          <text x="50%" y="45%" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="14" fill="#18191F">UPI: ${BITEBURP_CONFIG.upiId}</text>
          <text x="50%" y="60%" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#FF5335">Pay ₹${AppState.currentOrderDraft.total}</text>
        </svg>
      `);
    };
  }

  // Show pane
  orderFormStep.classList.add("hidden");
  paymentStep.classList.remove("hidden");
  document.getElementById("order").scrollIntoView({ behavior: "smooth" });

  showToast("Ready for UPI Payment. Complete payment and enter UTR ID below.", "info");
}

function handleConfirmPayment() {
  const txnInput = document.getElementById("txnIdInput");
  const txnVal = txnInput ? txnInput.value.trim() : "";

  if (!txnVal || txnVal.length < 5) {
    const parent = txnInput.closest(".form-group");
    if (parent) parent.classList.add("has-error");
    showToast("Please enter a valid UPI Transaction / Reference (UTR) ID.", "error");
    return;
  }

  const parent = txnInput.closest(".form-group");
  if (parent) parent.classList.remove("has-error");

  // Generate Authentic Unique Token (e.g. #BB-104)
  const tokenNumber = generateNextToken();
  AppState.activeToken = tokenNumber;

  // Complete Order Object
  const finalOrder = {
    ...AppState.currentOrderDraft,
    token: tokenNumber,
    txnId: txnVal,
    status: "Payment Verification", // Initial status
    statusStep: 2, // 1: Received, 2: Verification, 3: Preparing, 4: Ready, 5: Collected
    orderTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    id: 'ORD-' + Date.now()
  };

  // Save to LocalStorage
  saveOrderToStorage(finalOrder);

  // Decrement Stock
  if (BITEBURP_CONFIG.stockRemaining > 0) {
    BITEBURP_CONFIG.stockRemaining -= finalOrder.quantity;
    const stockDisplay = document.getElementById("stockDisplay");
    if (stockDisplay) {
      stockDisplay.textContent = `${Math.max(0, BITEBURP_CONFIG.stockRemaining)} boxes left`;
    }
  }

  // Display Confirmation Step
  showConfirmationStep(finalOrder);
}

// ==============================================================================
// 9. ORDER CONFIRMATION & TOKEN DISPLAY (Step 3)
// ==============================================================================
function showConfirmationStep(order) {
  const paymentStep = document.getElementById("paymentStep");
  const confirmationStep = document.getElementById("confirmationStep");

  paymentStep.classList.add("hidden");
  confirmationStep.classList.remove("hidden");

  // Populate receipt elements
  document.getElementById("confTokenNumber").textContent = order.token;
  document.getElementById("confCustName").textContent = order.name;
  document.getElementById("confProductQty").textContent = `${order.quantity} × ${order.product}`;
  document.getElementById("confTotalPaid").textContent = `${BITEBURP_CONFIG.currencySymbol}${order.total}`;
  document.getElementById("confPickupLoc").textContent = order.location;
  document.getElementById("confTxnId").textContent = order.txnId;

  // Copy Token Button
  const copyTokenBtn = document.getElementById("copyTokenBtn");
  if (copyTokenBtn) {
    copyTokenBtn.onclick = () => {
      copyToClipboard(order.token, `Token ${order.token} copied! Show this at pickup.`);
    };
  }

  document.getElementById("order").scrollIntoView({ behavior: "smooth" });
  showToast("🎉 Order Confirmed! Token generated.", "success");
}

function resetToNewOrder() {
  document.getElementById("confirmationStep").classList.add("hidden");
  document.getElementById("orderFormStep").classList.remove("hidden");
  document.getElementById("orderForm").reset();
  document.getElementById("paymentConfirmForm").reset();

  // Reset Quantity
  const qtyInput = document.getElementById("qtyInput");
  if (qtyInput) {
    qtyInput.value = "1";
    AppState.currentQuantity = 1;
    AppState.currentTotal = BITEBURP_CONFIG.productPrice;
    document.getElementById("calcUnitLine").textContent = `1 × ${BITEBURP_CONFIG.currencySymbol}${BITEBURP_CONFIG.productPrice}`;
    document.getElementById("calcTotalAmount").textContent = `${BITEBURP_CONFIG.currencySymbol}${BITEBURP_CONFIG.productPrice}`;
    document.getElementById("btnTotalPreview").textContent = `(Pay ${BITEBURP_CONFIG.currencySymbol}${BITEBURP_CONFIG.productPrice})`;
  }

  AppState.currentOrderDraft = null;
  document.getElementById("order").scrollIntoView({ behavior: "smooth" });
}

function trackCurrentToken() {
  if (AppState.activeToken) {
    fillAndCheckToken(AppState.activeToken);
    document.getElementById("order-status").scrollIntoView({ behavior: "smooth" });
  }
}

// ==============================================================================
// 10. TOKEN STORAGE & GENERATION
// ==============================================================================
/**
 * Generate unique random tracking token: BB + 6 digits (e.g. BB482917)
 * Not sequential. Checks local cache / known tokens to avoid collisions.
 */
function generateRandomToken() {
  const existing = getOrdersFromStorage();
  const used = new Set(
    existing
      .map(o => (o.token || "").toUpperCase().replace(/^#/, ""))
      .filter(Boolean)
  );

  for (let attempt = 0; attempt < 40; attempt++) {
    const digits = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
    const token = "BB" + digits;
    if (!used.has(token)) {
      return token;
    }
  }
  // Extremely unlikely fallback
  return "BB" + String(Date.now()).slice(-6);
}

/** @deprecated sequential tokens removed — kept as alias */
function generateNextToken() {
  return generateRandomToken();
}

function getOrdersFromStorage() {
  try {
    const raw = localStorage.getItem("biteburp_orders");
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Error reading localStorage:", err);
    return [];
  }
}

function saveOrderToStorage(order) {
  try {
    const orders = getOrdersFromStorage();
    orders.unshift(order);
    localStorage.setItem("biteburp_orders", JSON.stringify(orders));
  } catch (err) {
    console.error("Error saving order to localStorage:", err);
  }
  // Sync to Firebase when enabled (non-blocking)
  if (window.BiteBurpFirebase && window.BiteBurpFirebase.ready) {
    window.BiteBurpFirebase.saveOrder(order).catch(err => {
      console.error("Firebase order sync failed:", err);
    });
  }
}

function seedDemoOrdersIfEmpty() {
  const orders = getOrdersFromStorage();
  if (orders.length === 0) {
    const demoOrders = [
      {
        token: "BB482917",
        name: "Rahul Sharma",
        phone: "9876543210",
        product: BITEBURP_CONFIG.productName,
        quantity: 1,
        total: 59,
        location: "Campus Gym Entrance (Main Gate)",
        txnId: "428931089234",
        status: "Ready for Pickup",
        statusStep: 4,
        orderTime: "5:15 PM",
        date: new Date().toLocaleDateString()
      },
      {
        token: "BB730154",
        name: "Ananya Iyer",
        phone: "9812345678",
        product: BITEBURP_CONFIG.productName,
        quantity: 2,
        total: 118,
        location: "Hostel Block C - Lawn Bench",
        txnId: "428989123456",
        status: "Preparing",
        statusStep: 3,
        orderTime: "5:32 PM",
        date: new Date().toLocaleDateString()
      },
      {
        token: "BB194826",
        name: "Dev Mehta",
        phone: "9845098765",
        product: BITEBURP_CONFIG.productName,
        quantity: 1,
        total: 59,
        location: "Student Activity Center (SAC) Portico",
        txnId: "428911009988",
        status: "Payment Verification",
        statusStep: 2,
        orderTime: "5:45 PM",
        date: new Date().toLocaleDateString()
      }
    ];
    localStorage.setItem("biteburp_orders", JSON.stringify(demoOrders));
  }
}

// ==============================================================================
// 11. ORDER STATUS LOOKUP & PROGRESS TRACKER
// ==============================================================================
function fillAndCheckToken(token) {
  const input = document.getElementById("trackTokenInput");
  if (input) {
    input.value = token;
    handleLookupOrder();
  }
}

function handleLookupOrder() {
  const input = document.getElementById("trackTokenInput");
  const resultBox = document.getElementById("trackerResult");
  if (!input || !resultBox) return;

  let query = input.value.trim().toUpperCase();
  if (!query) {
    showToast("Please enter a token number to search.", "error");
    return;
  }

  // Normalize: strip leading #, accept BB###### or #BB######
  query = query.replace(/^#/, "");
  if (!query.startsWith("BB")) {
    // allow typing just the digits
    if (/^\d{6}$/.test(query)) query = "BB" + query;
  }

  const allOrders = getOrdersFromStorage();
  const match = allOrders.find(ord => {
    const t = (ord.token || "").toUpperCase().replace(/^#/, "");
    return t === query;
  });

  if (!match) {
    resultBox.classList.add("hidden");
    showToast(`No order found for token ${query}. Please check and try again.`, "error");
    return;
  }

  // Populate Tracker UI
  resultBox.classList.remove("hidden");
  document.getElementById("trackDispToken").textContent = match.token;
  document.getElementById("trackDispCustomer").textContent = match.name;
  document.getElementById("trackDispTime").textContent = `Ordered: ${match.orderTime || 'Today'}`;
  document.getElementById("trackDispItems").textContent = `${match.quantity} × ${match.product}`;
  document.getElementById("trackDispLocation").textContent = match.location;

  // Update Stepper Visuals (Steps 1 to 5)
  const stepCount = match.statusStep || 2;
  const stepperSteps = document.querySelectorAll("#progressStepper .stepper-step");
  
  stepperSteps.forEach((stepEl, idx) => {
    const stepNum = idx + 1;
    stepEl.classList.remove("completed", "current");

    if (stepNum < stepCount) {
      stepEl.classList.add("completed");
    } else if (stepNum === stepCount) {
      stepEl.classList.add("current");
    }
  });

  // Status Alert Text custom messages
  const statusAlertText = document.getElementById("statusAlertText");
  const messages = {
    1: "Order registered. Waiting for UPI verification.",
    2: "Payment details submitted. Our team is verifying your UTR reference.",
    3: "Payment verified! Your fresh snack box is being packed and chilled.",
    4: `Your box is READY for pickup at ${match.location}! Available between ${BITEBURP_CONFIG.openingTime} – ${BITEBURP_CONFIG.closingTime}.`,
    5: "Order collected! Hope you loved your BiteBurp fuel. See you tomorrow!"
  };

  if (statusAlertText) {
    statusAlertText.textContent = messages[stepCount] || "Order is being processed.";
  }

  showToast(`Found details for ${match.token}`, "info");
}

// ==============================================================================
// 12. FAQ ACCORDION
// ==============================================================================
function initAccordion() {
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach(item => {
    const questionBtn = item.querySelector(".faq-question");
    questionBtn.addEventListener("click", () => {
      const isActive = item.classList.contains("active");

      // Close all other items for a clean single-open accordion
      faqItems.forEach(otherItem => {
        otherItem.classList.remove("active");
        otherItem.querySelector(".faq-question").setAttribute("aria-expanded", "false");
      });

      // Toggle current
      if (!isActive) {
        item.classList.add("active");
        questionBtn.setAttribute("aria-expanded", "true");
      }
    });
  });
}

// ==============================================================================
// 13. FEEDBACK FORM
// ==============================================================================
const RATING_HINTS = {
  1: "1 star — Needs work",
  2: "2 stars — Could be better",
  3: "3 stars — Okay",
  4: "4 stars — Pretty good!",
  5: "5 stars — Amazing!"
};

let feedbackSubmitting = false;

function setStarRating(value) {
  const stars = document.querySelectorAll(".star-btn");
  const ratingInput = document.getElementById("fbRatingVal");
  const hint = document.getElementById("ratingHint");
  const v = Math.min(5, Math.max(1, parseInt(value, 10) || 5));
  stars.forEach(btn => {
    const r = parseInt(btn.getAttribute("data-rate"), 10);
    btn.classList.toggle("active", r <= v);
    btn.classList.toggle("filled", r <= v);
  });
  if (ratingInput) ratingInput.value = String(v);
  if (hint) hint.textContent = RATING_HINTS[v] || "";
}

function initFeedbackForm() {
  const stars = document.querySelectorAll(".star-btn");
  stars.forEach(btn => {
    btn.addEventListener("click", () => {
      setStarRating(btn.getAttribute("data-rate"));
    });
    // Hover preview on desktop
    btn.addEventListener("mouseenter", () => {
      const v = parseInt(btn.getAttribute("data-rate"), 10);
      stars.forEach(b => {
        const r = parseInt(b.getAttribute("data-rate"), 10);
        b.classList.toggle("filled", r <= v);
      });
    });
  });
  const selector = document.getElementById("ratingSelector");
  if (selector) {
    selector.addEventListener("mouseleave", () => {
      const current = document.getElementById("fbRatingVal")?.value || 5;
      setStarRating(current);
    });
  }
  setStarRating(5);
}

async function handleFeedbackSubmit() {
  if (feedbackSubmitting) return;
  const fbName = document.getElementById("fbName").value.trim() || "Anonymous";
  const fbRating = parseInt(document.getElementById("fbRatingVal").value, 10) || 5;
  const fbComment = document.getElementById("fbComment").value.trim();

  if (!fbComment) {
    showToast("Please share a quick thought or suggestion.", "error");
    return;
  }

  feedbackSubmitting = true;
  const feedbackObj = {
    name: fbName,
    rating: fbRating,
    comment: fbComment,
    date: new Date().toISOString(),
    createdAt: Date.now()
  };

  try {
    if (window.BiteBurpFirebase && window.BiteBurpFirebase.saveFeedback) {
      await window.BiteBurpFirebase.saveFeedback(feedbackObj);
    } else {
      const existing = JSON.parse(localStorage.getItem("biteburp_feedbacks") || "[]");
      existing.push(feedbackObj);
      localStorage.setItem("biteburp_feedbacks", JSON.stringify(existing));
    }
    document.getElementById("feedbackForm").reset();
    setStarRating(5);
    showToast("Thank you for your feedback! It helps us build better bites.", "success");
  } catch (err) {
    console.error("Feedback save failed:", err);
    showToast("Could not send feedback right now. Please try again.", "error");
  } finally {
    feedbackSubmitting = false;
  }
}

// ==============================================================================
// 14. CAMPUS POSTER QR GENERATION
// ==============================================================================
function setupPosterQR() {
  const posterQrImg = document.getElementById("posterQrImg");
  if (!posterQrImg) return;

  // The QR code encodes the current website URL
  const currentUrl = window.location.href.split('#')[0];
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=8&data=${encodeURIComponent(currentUrl)}`;

  posterQrImg.src = qrUrl;
  posterQrImg.onerror = () => {
    // Fallback SVG
    posterQrImg.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="#fff"/>
        <text x="50%" y="45%" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="14" fill="#18191F">BiteBurp</text>
        <text x="50%" y="60%" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#FF5335">Scan to Order</text>
      </svg>
    `);
  };
}

// ==============================================================================
// 15. MOBILE STICKY ORDER BAR
// ==============================================================================
function initMobileStickyBar() {
  const stickyBar = document.getElementById("mobileStickyBar");
  const heroSection = document.getElementById("hero");
  const orderSection = document.getElementById("order");

  if (!stickyBar || !heroSection) return;

  window.addEventListener("scroll", () => {
    const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
    const orderTop = orderSection ? orderSection.offsetTop - 300 : Infinity;
    const orderBottom = orderSection ? orderSection.offsetTop + orderSection.offsetHeight : 0;
    const scrollPos = window.scrollY;

    // Show after hero, but hide while actively inside the order section
    if (scrollPos > heroBottom && (scrollPos < orderTop || scrollPos > orderBottom)) {
      stickyBar.classList.add("visible");
    } else {
      stickyBar.classList.remove("visible");
    }
  });
}

// ==============================================================================
// 16. UTILITY HELPERS (Clipboard & Toast Notifications)
// ==============================================================================
function copyToClipboard(text, successMsg) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(() => showToast(successMsg, "success"))
      .catch(() => fallbackCopy(text, successMsg));
  } else {
    fallbackCopy(text, successMsg);
  }
}

function fallbackCopy(text, successMsg) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    showToast(successMsg, "success");
  } catch (err) {
    showToast("Failed to copy. Please copy manually: " + text, "error");
  }
  document.body.removeChild(textArea);
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const icon = type === "success" 
    ? '<i class="fa-solid fa-circle-check" style="color:#10B981"></i>' 
    : type === "error" 
      ? '<i class="fa-solid fa-triangle-exclamation" style="color:#EF4444"></i>'
      : '<i class="fa-solid fa-circle-info" style="color:#FFC837"></i>';

  toast.innerHTML = `${icon} <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "opacity 0.3s, transform 0.3s";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px) scale(0.95)";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==============================================================================
// 17. STORY / MAKING VIDEO (YouTube or direct file)
// ==============================================================================
function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{6,})/,
    /^([A-Za-z0-9_-]{11})$/
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

function initStoryVideo() {
  const wrap = document.getElementById("storyVideoWrap");
  const placeholder = document.getElementById("storyVideoPlaceholder");
  if (!wrap) return;

  const url = (BITEBURP_CONFIG.storyVideoUrl || "").trim();
  if (!url) {
    // Keep placeholder — no video configured
    return;
  }

  const ytId = extractYouTubeId(url);
  if (placeholder) placeholder.remove();

  if (ytId) {
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`;
    iframe.title = "BiteBurp Story";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.loading = "lazy";
    wrap.appendChild(iframe);
  } else {
    // Treat as direct video URL
    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    // Do not autoplay with sound
    video.setAttribute("controlsList", "nodownload");
    wrap.appendChild(video);
  }
}

// ==============================================================================
// 18. DONATION / SUPPORT MODAL
// ==============================================================================
function initDonationModal() {
  const trigger = document.getElementById("donateTriggerBtn");
  const modal = document.getElementById("donateModal");
  const closeBtn = document.getElementById("donateModalClose");
  const qrImg = document.getElementById("donateQrImg");
  const qrFallback = document.getElementById("donateQrFallback");
  const linkWrap = document.getElementById("donateLinkWrap");
  const linkBtn = document.getElementById("donateLinkBtn");

  if (!modal) return;

  function openModal() {
    const qrUrl = (BITEBURP_CONFIG.donateQrImageUrl || "").trim();
    const payLink = (BITEBURP_CONFIG.donatePaymentLink || "").trim();

    if (qrImg) {
      if (qrUrl) {
        qrImg.src = qrUrl;
        qrImg.classList.remove("hidden");
        if (qrFallback) qrFallback.classList.add("hidden");
      } else {
        qrImg.classList.add("hidden");
        if (qrFallback) qrFallback.classList.remove("hidden");
      }
    }

    if (linkWrap && linkBtn) {
      if (payLink) {
        linkBtn.href = payLink;
        linkWrap.classList.remove("hidden");
      } else {
        linkWrap.classList.add("hidden");
      }
    }

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  if (trigger) trigger.addEventListener("click", openModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
  });
}

// ==============================================================================
// 19. FIREBASE LAYER (optional — enabled via BITEBURP_CONFIG.useFirebase)
// Collections: products, orders, feedback, siteContent, customers
// Security: only admin UID can write products/orders status; customers write
// their own orders via authenticated or open create with validation rules.
// ==============================================================================
window.BiteBurpFirebase = {
  ready: false,
  db: null,
  auth: null,

  async saveFeedback(obj) {
    if (!this.ready || !this.db) throw new Error("Firebase not ready");
    const { collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    await addDoc(collection(this.db, "feedback"), {
      ...obj,
      serverCreatedAt: serverTimestamp()
    });
  },

  async saveOrder(order) {
    if (!this.ready || !this.db) throw new Error("Firebase not ready");
    const { collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    const ref = await addDoc(collection(this.db, "orders"), {
      ...order,
      serverCreatedAt: serverTimestamp()
    });
    return ref.id;
  },

  async findOrderByToken(token) {
    if (!this.ready || !this.db) return null;
    const { collection, query, where, getDocs, limit } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    const q = query(collection(this.db, "orders"), where("token", "==", token), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  }
};

async function initFirebaseIfEnabled() {
  if (!BITEBURP_CONFIG.useFirebase) return;
  const cfg = BITEBURP_CONFIG.firebase || {};
  if (!cfg.apiKey || cfg.apiKey === "YOUR_API_KEY") {
    console.warn("BiteBurp: useFirebase is true but firebase config is still a placeholder.");
    return;
  }
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    const app = initializeApp(cfg);
    window.BiteBurpFirebase.db = getFirestore(app);
    window.BiteBurpFirebase.auth = getAuth(app);
    window.BiteBurpFirebase.ready = true;
    console.info("BiteBurp Firebase connected.");
  } catch (err) {
    console.error("Firebase init failed:", err);
    showToast("Connection issue. Some features may use offline mode.", "error");
  }
}

// ==============================================================================
// 20. PAYMENT ARCHITECTURE (secure integration layer)
// - manual_upi: current client-side UPI + UTR (existing flow)
// - razorpay / payu: must create order server-side (Cloud Function), never
//   trust browser-sent amounts, verify signatures server-side before marking paid
// ==============================================================================
async function createSecurePaymentOrder(orderDraft) {
  /**
   * Production path:
   * 1. POST orderDraft (without trusting amount) to Cloud Function
   * 2. Function recalculates amount from product prices in Firestore
   * 3. Function creates Razorpay/PayU order with secret key
   * 4. Returns { gatewayOrderId, amount, currency, keyId }
   * 5. Frontend opens checkout with public key only
   * 6. On success, frontend sends paymentId + signature to verifyPaymentUrl
   * 7. Function verifies HMAC and only then marks order paid in Firestore
   */
  const provider = (BITEBURP_CONFIG.payment && BITEBURP_CONFIG.payment.provider) || "manual_upi";

  if (provider === "manual_upi") {
    return { mode: "manual_upi", amount: orderDraft.total };
  }

  const endpoint = BITEBURP_CONFIG.payment.createOrderUrl;
  if (!endpoint || endpoint.includes("YOUR_")) {
    showToast("Payment gateway not configured yet. Using manual UPI.", "info");
    return { mode: "manual_upi", amount: orderDraft.total };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: orderDraft.product,
        quantity: orderDraft.quantity,
        customerName: orderDraft.name,
        customerPhone: orderDraft.phone,
        location: orderDraft.location,
        note: orderDraft.note || ""
      })
    });
    if (!res.ok) throw new Error("Create order failed");
    return await res.json();
  } catch (err) {
    console.error(err);
    showToast("Could not start secure payment. Please try again.", "error");
    return null;
  }
}

async function verifySecurePayment(payload) {
  const endpoint = BITEBURP_CONFIG.payment && BITEBURP_CONFIG.payment.verifyPaymentUrl;
  if (!endpoint) return { verified: false };
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return { verified: false };
    return await res.json();
  } catch (err) {
    console.error(err);
    return { verified: false };
  }
}

// Enhance lookup to check Firebase when local miss
const _originalLookup = handleLookupOrder;
handleLookupOrder = async function() {
  const input = document.getElementById("trackTokenInput");
  const resultBox = document.getElementById("trackerResult");
  if (!input || !resultBox) return;

  let query = input.value.trim().toUpperCase().replace(/^#/, "");
  if (!query) {
    showToast("Please enter a token number to search.", "error");
    return;
  }
  if (!query.startsWith("BB") && /^\d{6}$/.test(query)) query = "BB" + query;

  let match = getOrdersFromStorage().find(ord => {
    const t = (ord.token || "").toUpperCase().replace(/^#/, "");
    return t === query;
  });

  if (!match && window.BiteBurpFirebase && window.BiteBurpFirebase.ready) {
    try {
      match = await window.BiteBurpFirebase.findOrderByToken(query);
    } catch (err) {
      console.error(err);
    }
  }

  if (!match) {
    resultBox.classList.add("hidden");
    showToast(`No order found for token ${query}. Please check and try again.`, "error");
    return;
  }

  // Reuse existing UI population by temporarily ensuring token format matches
  input.value = match.token;
  // Call original path via direct UI fill
  document.getElementById("trackDispToken").textContent = match.token;
  document.getElementById("trackDispName").textContent = match.name || "—";
  document.getElementById("trackDispQty").textContent = `${match.quantity || 1} × ${match.product || BITEBURP_CONFIG.productName}`;
  document.getElementById("trackDispLocation").textContent = match.location || "—";
  if (document.getElementById("trackDispStatus")) {
    document.getElementById("trackDispStatus").textContent = match.status || "Order Received";
  }
  // Progress steps
  const step = match.statusStep || 1;
  document.querySelectorAll(".tracker-step").forEach((el, idx) => {
    el.classList.toggle("completed", idx + 1 < step);
    el.classList.toggle("active", idx + 1 === step);
  });
  resultBox.classList.remove("hidden");
  showToast(`Found details for ${match.token}`, "info");
};
