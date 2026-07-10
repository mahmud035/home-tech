# HomeTech

**A multi-role resale marketplace for second-hand laptops — React + Firebase auth, Express + MongoDB, Stripe payments.**

🔗 **Live:** https://hometech-be5e9.web.app/

HomeTech is a MERN marketplace with three actor roles — buyer, seller, and admin — each with its own dashboard. Buyers browse laptops by category, book a product, and pay via Stripe; sellers list and advertise products; admins verify sellers and moderate reported listings. Built to practice role-based UI, a real card-payment flow, and JWT-protected data access on top of Firebase authentication.

> Scope note: this is a learning project, not a live commercial marketplace. It has no real transactions or user base. The backend is a single Express service (not a layered architecture), and — see *Known limitations* — several routes are not yet auth-gated. Everything below is limited to what the code actually does.

---

## What this demonstrates

- **Goal:** card payments → **Approach:** Stripe payment-intents on the server issue a `clientSecret`; the client confirms the card with `@stripe/react-stripe-js`; on success the server records the payment and flips the booking to `paid` with its `transactionId` → **Outcome:** an end-to-end pay-and-reconcile flow across two collections.
- **Goal:** distinct experiences per role → **Approach:** `role` on the user document (`User` / `Seller` / `Admin`) drives client hooks (`useAdmin`, `useSeller`) and a dashboard route tree → **Outcome:** buyers, sellers, and admins each see only their own actions and data.
- **Goal:** protect user-scoped reads → **Approach:** a `verifyJWT` middleware validates a signed token and compares its email claim to the requested email, returning 403 on mismatch → **Outcome:** a user cannot read another user's orders by changing the query string.
- **Goal:** prevent duplicate bookings → **Approach:** the booking route checks for an existing `(userEmail, productName)` pair before insert → **Outcome:** the same buyer can't double-book one product.
- **Goal:** responsive server-state UI → **Approach:** TanStack Query for fetching/caching and React-Hook-Form for validated forms → **Outcome:** dashboards refetch and stay in sync without hand-rolled loading logic.

---

## Architecture

```
┌─────────────────────────────┐        ┌──────────────────────────────────┐
│  Client (React SPA)          │  HTTP  │  Server (Express, single service) │
│                             │ ─────▶ │                                  │
│  • Role hooks (admin/seller)│  JWT   │  • verifyJWT middleware           │
│  • Dashboard route tree      │ ◀───── │  • REST routes (products,         │
│  • TanStack Query            │  JSON  │    users, bookings, payments)     │
│  • Stripe Elements           │        │  • Stripe payment-intents         │
└─────────────────────────────┘        └───────────────┬──────────────────┘
        │                                               │
        ▼                                               ▼
  Firebase Authentication                     MongoDB Atlas (native driver)
  (email/password · Google · GitHub)          productCategories · products ·
        │                                      users · bookings · payments
        ▼
  Stripe (card confirmation)
```

**Auth model:** Firebase handles sign-in on the client; the client then exchanges the identity for a backend JWT, which authorizes user-scoped API calls. **Payment flow:** intent (server) → confirm (client) → record payment + mark booking paid (server).

---

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React 18.2, React Router DOM 6.4, React-Bootstrap 5.2 |
| Server state / forms | TanStack Query 4.16, React-Hook-Form 7.39, Axios 1.2 |
| Auth | Firebase 12 Authentication + JWT (jsonwebtoken 9) in `Authorization` header |
| Payments | Stripe 11 (server) + @stripe/react-stripe-js 1.15 (client) |
| Backend | Node.js, Express 4.18, MongoDB native driver 4.12 |
| Hosting | Firebase Hosting (client) · serverless deploy (API) |

---

## Engineering deep-dive — the payment flow

The most non-trivial subsystem is the Stripe path, because it spans client and server and must leave two collections consistent:

1. **Intent (server).** `POST /create-payment-intent` takes the booked product's resale price, converts to the smallest currency unit (`price * 100`), and creates a Stripe PaymentIntent, returning only the `clientSecret`.
2. **Confirm (client).** The `CheckoutForm` confirms the card against that secret using Stripe Elements — card data never touches the server.
3. **Reconcile (server).** `POST /payments` inserts a payment record, then updates the corresponding booking with `paid: true` and the `transactionId`, so the buyer's order history reflects settlement.

This is the piece worth discussing in an interview: the separation between "intent" and "confirmation," and why the price-to-amount conversion and booking reconciliation belong on the server.

---

## Selected engineering decisions

| Decision | Reasoning |
|---|---|
| JWT email-claim check on `/orders` | Prevents horizontal access — a valid token for user A can't read user B's orders. |
| Duplicate-booking guard before insert | Cheaper and clearer than a unique compound index for this project's scale. |
| Amount computed server-side for Stripe | The client must never be trusted to state the charge amount. |
| TanStack Query for all server data | Removes hand-written caching/refetch and keeps dashboards fresh. |

---

## Known limitations (honest, and next on the list)

- **Inconsistent auth gating.** `verifyJWT` protects some routes (`/orders`, `/buyers`) but several mutating and role-check routes are currently public. Hardening every write and admin route behind auth is the first thing I'd fix.
- **No server-side input validation.** Request bodies are trusted as-is; a validation layer (e.g. Zod) belongs at the edge.
- **Monolithic server.** All routes live in one `index.js`; splitting into route/controller/service modules would make it maintainable. (I applied that layered pattern in a later project — see KnowledgeStore.)

---

## Run locally

```bash
git clone https://github.com/mahmud035/home-tech.git
cd home-tech

# Client
cd client
npm install
npm start                 # http://localhost:3000

# Server (second terminal)
cd ../server
npm install
npm run start-dev         # nodemon, http://localhost:5000
```

**Server env (`server/.env`):**

```
DB_USER=...
DB_PASSWORD=...
ACCESS_TOKEN_SECRET=...
STRIPE_SECRET_KEY=...
```

Provide your own Firebase web config in `client/src/firebase configuration/firebase.config.js`.

**Test admin account** (for reviewing the deployed site):

```
adminEmail:    mahmud@gmail.com
adminPassword: 12@asd
```
