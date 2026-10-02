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

  // UPI Payment settings (Replace with your actual UPI ID & Payee Name)
  upiId: "biteburp@upi",
  upiPayeeName: "BiteBurp Campus Food",

  // Campus Pickup Locations
  pickupLocations: [
    "Campus Gym Entrance (Main Gate)",
    "Hostel Block C - Lawn Bench",
    "Student Activity Center (SAC) Portico",
    "Library Back Parking Stand"
  ],

  // Social & Community Links
  instagramLink: "https://instagram.com/biteburp",
  whatsappNumber: "+919876543210"
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
  seedDemoOrdersIfEmpty();
  setupPosterQR();
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
function generateNextToken() {
  const existingOrders = getOrdersFromStorage();
  let maxNum = 103; // Start after demo tokens

  existingOrders.forEach(ord => {
    if (ord.token && ord.token.startsWith("#BB-")) {
      const num = parseInt(ord.token.replace("#BB-", ""), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

  return `#BB-${maxNum + 1}`;
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
}

function seedDemoOrdersIfEmpty() {
  const orders = getOrdersFromStorage();
  if (orders.length === 0) {
    const demoOrders = [
      {
        token: "#BB-101",
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
        token: "#BB-102",
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
        token: "#BB-103",
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

  // Normalize token format
  if (!query.startsWith("#")) {
    query = "#" + query;
  }

  const allOrders = getOrdersFromStorage();
  const match = allOrders.find(ord => ord.token.toUpperCase() === query);

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
function initFeedbackForm() {
  const ratingBtns = document.querySelectorAll(".rating-btn");
  const ratingInput = document.getElementById("fbRatingVal");

  ratingBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      ratingBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      if (ratingInput) {
        ratingInput.value = btn.getAttribute("data-rate");
      }
    });
  });
}

function handleFeedbackSubmit() {
  const fbName = document.getElementById("fbName").value.trim() || "Anonymous Student";
  const fbRating = document.getElementById("fbRatingVal").value || 5;
  const fbComment = document.getElementById("fbComment").value.trim();

  if (!fbComment) {
    showToast("Please share a quick thought or suggestion.", "error");
    return;
  }

  const feedbackObj = {
    name: fbName,
    rating: fbRating,
    comment: fbComment,
    date: new Date().toISOString()
  };

  // Save to localStorage
  try {
    const existing = JSON.parse(localStorage.getItem("biteburp_feedbacks") || "[]");
    existing.push(feedbackObj);
    localStorage.setItem("biteburp_feedbacks", JSON.stringify(existing));
  } catch (err) {
    console.error("Failed to save feedback:", err);
  }

  // Clear Form
  document.getElementById("feedbackForm").reset();
  const ratingBtns = document.querySelectorAll(".rating-btn");
  ratingBtns.forEach(b => b.classList.remove("active"));
  if (ratingBtns[4]) ratingBtns[4].classList.add("active");

  showToast("Thank you for your feedback! It helps us build better campus bites.", "success");
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
