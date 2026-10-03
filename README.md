# 🥪 BiteBurp - "Good Bites. Big Vibes."

Student-focused web app for **BiteBurp** — fresh, affordable post-workout / evening snack boxes.

**Stack:** HTML5 · CSS3 · Vanilla JavaScript · Firebase (optional) · Cloud Functions for payments

> Design is intentionally funky / 2D. Do not replace with generic SaaS UI.

---

## Quick Start

1. Open `index.html` in a browser, or:
   ```bash
   python -m http.server 3000
   # → http://localhost:3000
   ```
2. Admin dashboard: open `admin.html`  
   - **Local demo** (Firebase off): `admin@biteburp.local` / `demo-admin-only`  
   - **Production:** Firebase Auth + admin claim or `admins/{uid}` doc

---

## Configuration (`script.js` → `BITEBURP_CONFIG`)

| Key | Purpose |
|-----|---------|
| `productName`, `productPrice` | Main product |
| `isOrderingOpen`, `stockRemaining` | Daily status |
| `upiId`, `upiPayeeName` | Manual UPI fallback |
| `pickupLocations` | Dropdown list |
| `storyVideoUrl` | YouTube **or** direct `.mp4` URL for the story card |
| `donateQrImageUrl`, `donatePaymentLink` | Support modal |
| `useFirebase` + `firebase` | Turn on Firestore/Auth |
| `payment.provider` | `manual_upi` \| `razorpay` \| `payu` |

### Story video

```js
storyVideoUrl: "https://www.youtube.com/watch?v=VIDEO_ID"
// or
storyVideoUrl: "https://cdn.example.com/making.mp4"
```

Empty string → “Video coming soon” placeholder (page does not break).

### Order tokens

Format: **`BB` + 6 random digits** (e.g. `BB482917`). Not sequential. Collision-checked against stored orders.

---

## Features (this revision)

- Same visual identity (colors, type, stickers, neo-brutal cards)
- **CAMPUS** logo tag removed
- Responsive hardening for ~320px–desktop
- Story / making **video card** (YouTube embed or HTML5 video)
- **5 individual star** rating + feedback
- **Support BiteBurp** donation modal (QR and/or link)
- Random **BB######** tracking tokens
- **Admin panel** (`admin.html`) — Firebase Auth, not a hidden frontend password
- Firestore data model + **security rules** (`firestore.rules`)
- **Payment architecture** ready for Razorpay via Cloud Functions (`functions/`)
  - Amount recalculated server-side
  - Signature verification server-side
  - Secrets never in frontend

---

## Firebase setup

1. Create a Firebase project → enable **Authentication** (Email/Password) and **Firestore**.
2. Paste web config into `BITEBURP_CONFIG.firebase` and set `useFirebase: true`.
3. Deploy rules: `firebase deploy --only firestore:rules`
4. Create your admin user in Auth.
5. Grant admin either:
   - Custom claim `{ "admin": true }` via Admin SDK, **or**
   - Document `admins/{yourUid}` in Firestore (create from Console)
6. Optional: deploy functions for Razorpay:
   ```bash
   cd functions && npm install
   firebase functions:config:set razorpay.key_id="rzp_..." razorpay.key_secret="..."
   firebase deploy --only functions
   ```
7. Point `payment.createOrderUrl` / `verifyPaymentUrl` at the deployed HTTPS URLs and set `payment.provider` to `"razorpay"`.

### Suggested collections

- `products` — name, price, description, imageUrl, available  
- `orders` — token, products/qty, total, customer fields needed for fulfillment, paymentStatus, status, timestamps  
- `feedback` — rating (1–5), comment, name, date  
- `siteContent/main` — video URL, donate settings, stock flags  
- `admins/{uid}` — admin allowlist  

Customers never receive other customers’ private order data. Listing orders is admin-only in rules.

---

## Payment security notes

- **Do not** put Razorpay/PayU **secret** keys in any frontend file.
- **Do not** trust the amount sent from the browser.
- Create gateway orders and verify webhooks/signatures only in Cloud Functions (see `functions/index.js`).
- Until credentials exist, keep `payment.provider: "manual_upi"` (existing UPI + UTR flow).

---

## Project layout

```
BiteBurp-App-main/
├── index.html          # Public site
├── style.css           # Brand styles + responsive
├── script.js           # Config, order flow, video, donate, Firebase helpers
├── admin.html          # Secure admin UI
├── admin.css
├── admin.js
├── firestore.rules     # Security rules
├── functions/          # createPaymentOrder + verifyPayment
└── README.md
```

---

## Author

**Developed by Shalabh Suman**  
© 2026 BiteBurp. All rights reserved.
