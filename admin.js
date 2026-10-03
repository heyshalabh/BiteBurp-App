/**
 * BiteBurp Admin Dashboard
 * Auth: Firebase Authentication only (no frontend password shortcuts).
 * Data: Firestore when configured; localStorage fallback for local demo.
 */
(function () {
  "use strict";

  const STATUS_OPTIONS = [
    "Order Received",
    "Payment Verification",
    "Preparing",
    "Ready for Pickup",
    "Collected",
    "Cancelled"
  ];

  const STATUS_STEP = {
    "Order Received": 1,
    "Payment Verification": 2,
    "Preparing": 3,
    "Ready for Pickup": 4,
    "Collected": 5,
    "Cancelled": 0
  };

  let currentUser = null;
  let isAdmin = false;
  let editingProductId = null;
  let selectedOrderId = null;
  let fbApp = null;
  let fbAuth = null;
  let fbDb = null;

  function $(id) { return document.getElementById(id); }

  function toast(msg, type) {
    if (typeof showToast === "function") showToast(msg, type || "info");
    else alert(msg);
  }

  function getLocalOrders() {
    try {
      return JSON.parse(localStorage.getItem("biteburp_orders") || "[]");
    } catch { return []; }
  }

  function setLocalOrders(arr) {
    localStorage.setItem("biteburp_orders", JSON.stringify(arr));
  }

  function getLocalFeedback() {
    try {
      return JSON.parse(localStorage.getItem("biteburp_feedbacks") || "[]");
    } catch { return []; }
  }

  function getLocalProducts() {
    try {
      const raw = localStorage.getItem("biteburp_products");
      if (raw) return JSON.parse(raw);
    } catch {}
    // Seed from config
    const cfg = window.BITEBURP_CONFIG || {};
    return [{
      id: "default",
      name: cfg.productName || "BiteBurp Post-Workout Box",
      price: cfg.productPrice || 59,
      description: "Fresh evening snack box",
      imageUrl: "",
      available: true
    }];
  }

  function setLocalProducts(arr) {
    localStorage.setItem("biteburp_products", JSON.stringify(arr));
  }

  async function initFirebaseAdmin() {
    const cfg = (window.BITEBURP_CONFIG && window.BITEBURP_CONFIG.firebase) || {};
    const use = window.BITEBURP_CONFIG && window.BITEBURP_CONFIG.useFirebase;
    if (!use || !cfg.apiKey || cfg.apiKey === "YOUR_API_KEY") {
      return false;
    }
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    fbApp = initializeApp(cfg, "biteburp-admin");
    fbAuth = getAuth(fbApp);
    fbDb = getFirestore(fbApp);
    window.__bbAdminAuthModules = { signInWithEmailAndPassword, signOut, onAuthStateChanged };
    return true;
  }

  async function checkIsAdmin(user) {
    if (!user || !fbDb) return false;
    try {
      const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      // Prefer custom claims if present
      const token = await user.getIdTokenResult(true);
      if (token.claims && token.claims.admin === true) return true;
      // Fallback: admins/{uid} document
      const snap = await getDoc(doc(fbDb, "admins", user.uid));
      return snap.exists();
    } catch (err) {
      console.error("Admin check failed:", err);
      return false;
    }
  }

  function showLogin() {
    $("adminLoginView").classList.remove("hidden");
    $("adminApp").classList.add("hidden");
  }

  function showApp() {
    $("adminLoginView").classList.add("hidden");
    $("adminApp").classList.remove("hidden");
    refreshAll();
  }

  async function handleLogin(e) {
    e.preventDefault();
    const email = $("adminEmail").value.trim();
    const password = $("adminPassword").value;
    const errEl = $("adminLoginError");
    errEl.classList.add("hidden");

    const useFb = await initFirebaseAdmin();
    if (!useFb) {
      // Local demo mode: allow a documented demo login ONLY when Firebase is off
      // This is clearly marked and NOT production security.
      if (email === "admin@biteburp.local" && password === "demo-admin-only") {
        currentUser = { email, uid: "local-demo-admin" };
        isAdmin = true;
        toast("Local demo admin mode (Firebase disabled).", "info");
        showApp();
        return;
      }
      errEl.textContent = "Firebase is not configured. Set useFirebase + config in script.js, or use demo: admin@biteburp.local / demo-admin-only";
      errEl.classList.remove("hidden");
      return;
    }

    try {
      const { signInWithEmailAndPassword } = window.__bbAdminAuthModules;
      const cred = await signInWithEmailAndPassword(fbAuth, email, password);
      currentUser = cred.user;
      isAdmin = await checkIsAdmin(currentUser);
      if (!isAdmin) {
        await window.__bbAdminAuthModules.signOut(fbAuth);
        errEl.textContent = "This account is not authorized as admin.";
        errEl.classList.remove("hidden");
        return;
      }
      showApp();
    } catch (err) {
      console.error(err);
      errEl.textContent = "Sign-in failed. Check email/password.";
      errEl.classList.remove("hidden");
    }
  }

  async function handleLogout() {
    if (fbAuth && window.__bbAdminAuthModules) {
      try { await window.__bbAdminAuthModules.signOut(fbAuth); } catch {}
    }
    currentUser = null;
    isAdmin = false;
    showLogin();
  }

  function switchPanel(name) {
    document.querySelectorAll(".admin-panel").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".admin-nav-btn").forEach(b => {
      b.classList.toggle("active", b.getAttribute("data-panel") === name);
    });
    const panel = $("panel-" + name);
    if (panel) panel.classList.add("active");
  }

  function refreshDashboard(orders, feedbacks) {
    const total = orders.length;
    const pending = orders.filter(o => !["Collected", "Cancelled"].includes(o.status)).length;
    const completed = orders.filter(o => o.status === "Collected").length;
    const cancelled = orders.filter(o => o.status === "Cancelled").length;
    const revenue = orders
      .filter(o => o.status !== "Cancelled" && (o.paymentStatus === "paid" || o.txnId))
      .reduce((s, o) => s + (Number(o.total) || 0), 0);

    $("statTotalOrders").textContent = total;
    $("statPending").textContent = pending;
    $("statCompleted").textContent = completed;
    $("statCancelled").textContent = cancelled;
    $("statRevenue").textContent = revenue;
    $("statFeedback").textContent = feedbacks.length;
  }

  function badgeClass(status) {
    if (status === "Cancelled") return "cancelled";
    if (status === "Ready for Pickup" || status === "Collected") return "ready";
    return "pending";
  }

  function renderOrders(orders) {
    const tbody = $("ordersTableBody");
    const empty = $("ordersEmpty");
    const q = ($("orderSearch").value || "").trim().toLowerCase();
    const statusF = $("orderStatusFilter").value;

    let list = orders.slice();
    if (statusF) list = list.filter(o => o.status === statusF);
    if (q) {
      list = list.filter(o => {
        const hay = [o.token, o.name, o.phone, o.txnId, o.id].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }

    tbody.innerHTML = "";
    if (!list.length) {
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");

    list.forEach(o => {
      const tr = document.createElement("tr");
      const pay = o.paymentStatus || (o.txnId ? "UTR submitted" : "—");
      tr.innerHTML = `
        <td><strong>${escapeHtml(o.token || "—")}</strong></td>
        <td>${escapeHtml(o.name || "—")}<br><small>${escapeHtml(o.phone || "")}</small></td>
        <td>${escapeHtml(String(o.quantity || 1))}</td>
        <td>₹${escapeHtml(String(o.total || 0))}</td>
        <td><span class="admin-badge ${badgeClass(o.status)}">${escapeHtml(o.status || "—")}</span></td>
        <td>${escapeHtml(pay)}</td>
        <td>${escapeHtml(o.orderTime || o.date || "—")}</td>
        <td><button type="button" class="btn btn-outline btn-sm" data-order-id="${escapeHtml(o.id || o.token)}">View</button></td>
      `;
      tr.querySelector("button").addEventListener("click", () => openOrderDetail(o));
      tbody.appendChild(tr);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function openOrderDetail(order) {
    selectedOrderId = order.id || order.token;
    const body = $("orderDetailBody");
    body.innerHTML = `
      <p><strong>Token:</strong> ${escapeHtml(order.token)}</p>
      <p><strong>Name:</strong> ${escapeHtml(order.name || "—")}</p>
      <p><strong>Phone:</strong> ${escapeHtml(order.phone || "—")}</p>
      <p><strong>Product:</strong> ${escapeHtml(order.product || "—")} × ${escapeHtml(String(order.quantity || 1))}</p>
      <p><strong>Total:</strong> ₹${escapeHtml(String(order.total || 0))}</p>
      <p><strong>Pickup:</strong> ${escapeHtml(order.location || "—")}</p>
      <p><strong>Note:</strong> ${escapeHtml(order.note || "—")}</p>
      <p><strong>UTR / Txn:</strong> ${escapeHtml(order.txnId || "—")}</p>
      <p><strong>Payment:</strong> ${escapeHtml(order.paymentStatus || "—")}</p>
    `;
    const sel = $("orderDetailStatus");
    sel.innerHTML = STATUS_OPTIONS.map(s =>
      `<option value="${s}" ${s === order.status ? "selected" : ""}>${s}</option>`
    ).join("");
    $("orderDetailModal").classList.remove("hidden");
  }

  function saveOrderStatus() {
    const status = $("orderDetailStatus").value;
    const orders = getLocalOrders();
    const idx = orders.findIndex(o => (o.id || o.token) === selectedOrderId);
    if (idx >= 0) {
      orders[idx].status = status;
      orders[idx].statusStep = STATUS_STEP[status] ?? orders[idx].statusStep;
      setLocalOrders(orders);
      // Firestore update when available
      if (fbDb && orders[idx].firestoreId) {
        import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js").then(({ doc, updateDoc }) => {
          updateDoc(doc(fbDb, "orders", orders[idx].firestoreId), {
            status,
            statusStep: STATUS_STEP[status] ?? 1
          }).catch(console.error);
        });
      }
      toast("Order status updated", "success");
      $("orderDetailModal").classList.add("hidden");
      refreshAll();
    }
  }

  function renderProducts(products) {
    const list = $("productsList");
    list.innerHTML = "";
    products.forEach(p => {
      const card = document.createElement("div");
      card.className = "admin-product-card";
      card.innerHTML = `
        <h3>${escapeHtml(p.name)}</h3>
        <p>₹${escapeHtml(String(p.price))} · ${p.available ? "Available" : "Unavailable"}</p>
        <p style="font-size:0.85rem;color:#6B7280;">${escapeHtml(p.description || "")}</p>
        <button type="button" class="btn btn-outline btn-sm">Edit</button>
      `;
      card.querySelector("button").addEventListener("click", () => openProductModal(p));
      list.appendChild(card);
    });
  }

  function openProductModal(product) {
    editingProductId = product ? product.id : null;
    $("productModalTitle").textContent = product ? "Edit Product" : "Add Product";
    $("productId").value = product ? product.id : "";
    $("productName").value = product ? product.name : "";
    $("productPrice").value = product ? product.price : 59;
    $("productDesc").value = product ? (product.description || "") : "";
    $("productImage").value = product ? (product.imageUrl || "") : "";
    $("productAvailable").value = product && product.available === false ? "false" : "true";
    $("productDeleteBtn").style.display = product && product.id !== "default" ? "block" : "none";
    $("productModal").classList.remove("hidden");
  }

  function saveProduct(e) {
    e.preventDefault();
    const products = getLocalProducts();
    const data = {
      id: $("productId").value || ("p_" + Date.now()),
      name: $("productName").value.trim(),
      price: Number($("productPrice").value) || 0,
      description: $("productDesc").value.trim(),
      imageUrl: $("productImage").value.trim(),
      available: $("productAvailable").value === "true"
    };
    const idx = products.findIndex(p => p.id === data.id);
    if (idx >= 0) products[idx] = data;
    else products.push(data);
    setLocalProducts(products);
    $("productModal").classList.add("hidden");
    toast("Product saved", "success");
    renderProducts(products);
  }

  function deleteProduct() {
    if (!editingProductId || editingProductId === "default") return;
    let products = getLocalProducts().filter(p => p.id !== editingProductId);
    setLocalProducts(products);
    $("productModal").classList.add("hidden");
    toast("Product deleted", "success");
    renderProducts(products);
  }

  function renderFeedback(items) {
    const list = $("feedbackList");
    list.innerHTML = "";
    if (!items.length) {
      list.innerHTML = '<p class="admin-empty">No feedback yet.</p>';
      return;
    }
    items.slice().reverse().forEach(f => {
      const stars = "★".repeat(Number(f.rating) || 0) + "☆".repeat(5 - (Number(f.rating) || 0));
      const card = document.createElement("div");
      card.className = "admin-feedback-card";
      card.innerHTML = `
        <div class="stars">${stars}</div>
        <p>${escapeHtml(f.comment || "")}</p>
        <small>${escapeHtml(f.name || "Anonymous")} · ${escapeHtml((f.date || "").slice(0, 10))}</small>
      `;
      list.appendChild(card);
    });
  }

  function refreshAll() {
    const orders = getLocalOrders();
    const feedbacks = getLocalFeedback();
    const products = getLocalProducts();
    refreshDashboard(orders, feedbacks);
    renderOrders(orders);
    renderProducts(products);
    renderFeedback(feedbacks);

    // Pre-fill content form from config
    const cfg = window.BITEBURP_CONFIG || {};
    if ($("cfgStoryVideoUrl")) $("cfgStoryVideoUrl").value = cfg.storyVideoUrl || "";
    if ($("cfgDonateQr")) $("cfgDonateQr").value = cfg.donateQrImageUrl || "";
    if ($("cfgDonateLink")) $("cfgDonateLink").value = cfg.donatePaymentLink || "";
    if ($("cfgOrderingOpen")) $("cfgOrderingOpen").value = String(!!cfg.isOrderingOpen);
    if ($("cfgStock")) $("cfgStock").value = cfg.stockRemaining ?? 0;
  }

  function wireUi() {
    $("adminLoginForm").addEventListener("submit", handleLogin);
    $("adminLogoutBtn").addEventListener("click", handleLogout);
    document.querySelectorAll(".admin-nav-btn").forEach(btn => {
      btn.addEventListener("click", () => switchPanel(btn.getAttribute("data-panel")));
    });
    $("orderSearch").addEventListener("input", () => renderOrders(getLocalOrders()));
    $("orderStatusFilter").addEventListener("change", () => renderOrders(getLocalOrders()));
    $("orderDetailClose").addEventListener("click", () => $("orderDetailModal").classList.add("hidden"));
    $("orderDetailSave").addEventListener("click", saveOrderStatus);
    $("addProductBtn").addEventListener("click", () => openProductModal(null));
    $("productModalClose").addEventListener("click", () => $("productModal").classList.add("hidden"));
    $("productForm").addEventListener("submit", saveProduct);
    $("productDeleteBtn").addEventListener("click", deleteProduct);
    $("siteContentForm").addEventListener("submit", (e) => {
      e.preventDefault();
      toast("Content settings: update BITEBURP_CONFIG in script.js, or enable Firebase siteContent/main.", "info");
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    wireUi();
    const ready = await initFirebaseAdmin();
    if (ready && window.__bbAdminAuthModules) {
      window.__bbAdminAuthModules.onAuthStateChanged(fbAuth, async (user) => {
        if (!user) {
          showLogin();
          return;
        }
        currentUser = user;
        isAdmin = await checkIsAdmin(user);
        if (isAdmin) showApp();
        else {
          await window.__bbAdminAuthModules.signOut(fbAuth);
          showLogin();
        }
      });
    } else {
      showLogin();
    }
  });
})();
