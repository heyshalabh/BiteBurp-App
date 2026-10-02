# 🥪 BiteBurp - "Good Bites. Big Vibes."

A complete, responsive, student-focused web application for **BiteBurp**, a campus food startup serving fresh, affordable post-workout and evening snack boxes.

Built with **HTML5**, **CSS3**, and **Vanilla JavaScript** (Zero frameworks, zero bloated libraries).

---

## 🚀 Quick Start

1. Open `index.html` in any web browser (Chrome, Safari, Firefox, Edge).
2. Alternatively, run a lightweight local web server:
   ```bash
   # Using Python
   python -m http.server 3000

   # Or using Node
   npx serve .
   ```
3. Visit `http://localhost:3000` on your desktop or phone.

> **Workspace Tip:** Set `C:\Users\SHALABH SUMAN\.gemini\antigravity\scratch\biteburp` as your active workspace in Antigravity / your editor.

---

## 🛠️ Instant Configuration (`script.js`)

At the very top of `script.js`, there is a single configuration object:

```javascript
const BITEBURP_CONFIG = {
  brandName: "BiteBurp",
  tagline: "Good Bites. Big Vibes.",

  // Product Details
  productName: "BiteBurp Post-Workout Box",
  productPrice: 59, // in ₹
  currencySymbol: "₹",

  // Daily Operating Hours
  openingTime: "6:00 PM",
  closingTime: "8:00 PM",
  isOrderingOpen: true, // Flip to false when closed

  // Stock
  stockRemaining: 24,
  maxDailyStock: 50,

  // Payment Setup
  upiId: "biteburp@upi", // Change to your actual UPI ID
  upiPayeeName: "BiteBurp Campus Food",

  // Handover Spots
  pickupLocations: [
    "Campus Gym Entrance (Main Gate)",
    "Hostel Block C - Lawn Bench",
    "Student Activity Center (SAC) Portico",
    "Library Back Parking Stand"
  ],

  // Contact & Socials
  instagramLink: "https://instagram.com/biteburp",
  whatsappNumber: "+919876543210"
};
```

Whenever you modify any of these values, the **entire website** (hero price, top banner status, product card, checkout total, QR code, pickup dropdowns, and FAQ) updates dynamically.

---

## ✨ Features Implemented

### 1. Brand & Design
- **Color Palette:** Warm off-white (`#FAF8F5`), energetic coral (`#FF5335`), sunshine yellow (`#FFC837`), herbal green (`#10B981`), charcoal black (`#18191F`).
- **Typography:** Google Fonts **Poppins** (headings & badges) and **Inter** (body text).
- **Tactile Vibe:** Chunky borders, sticker badges, interactive emojis, and subtle neo-brutalist shadows without corporate overdesign.

### 2. Live Daily Operating Status & Stock Counter
- Real-time **OPEN 🟢** / **CLOSED 🔴** badge.
- Dynamic stock deduction whenever an order is submitted.

### 3. Sticky Navbar & Mobile Drawer
- Sticky navigation with backdrop blur.
- Mobile hamburger menu drawer with smooth toggle and backdrop dismissal.

### 4. Interactive Order Flow & Dynamic Total Calculation
- Quantity increment / decrement buttons (1 to 10 boxes).
- Live calculation: `Quantity × ₹59 = Total`.
- Campus pickup spot selection populated dynamically from config.
- Client-side validation for Name and 10-digit Phone Number.

### 5. V1 Manual UPI Payment Step
- Generates dynamic UPI Intent string (`upi://pay?pa=...&pn=...&am=...`).
- Renders dynamic UPI QR code ready for scanning with Google Pay / PhonePe / Paytm.
- "Tap to Pay on UPI App" button for mobile users.
- 1-Click "Copy UPI ID" button with toast notification.
- Transaction / UTR ID input with receipt help instructions.

### 6. Unique Token Generation & Receipt Screen
- Generates sequential campus tokens (`#BB-101`, `#BB-102`, etc.).
- Saves orders to `localStorage` (`biteburp_orders`).
- Displays full order summary: Customer Name, Qty, Total Paid, Pickup Location, Pickup Window (6 PM – 8 PM), and UTR ID.
- "Copy Token" button for fast clipboard sharing.

### 7. Real-Time Order Status Tracker
- Enter any token (e.g. `#BB-101`, `#BB-104`) to see order progress:
  1. `Order Received`
  2. `Payment Verification`
  3. `Preparing`
  4. `Ready for Pickup`
  5. `Collected`
- Pre-seeded demo orders (`#BB-101`, `#BB-102`, `#BB-103`) so you can test tracking immediately.

### 8. Campus Poster QR Section
- Designed specifically for printing on hostel bulletin boards and gym flyers.
- Auto-generates a QR code linking directly to the website.

### 9. Reviews, FAQ Accordion & Feedback
- 3 authentic student review placeholders.
- 7-question FAQ accordion with smooth CSS animation.
- Interactive 5-star feedback form that records submissions to `localStorage`.

### 10. Mobile Sticky Bottom Order Bar
- Floating bottom order pill on mobile screens that activates when scrolling past the hero and automatically hides while filling out the order form.

---

## 📂 Project Architecture

```
biteburp/
├── index.html       # Semantic HTML5 markup with all sections
├── style.css        # Responsive CSS3 styles, variables & playful components
├── script.js        # Config object, form validation, UPI QR, tokens & tracker
└── README.md        # Documentation and guide
```

---

## 👨‍💻 Author

**Developed by Shalabh Suman**  
© 2026 BiteBurp. All rights reserved.
