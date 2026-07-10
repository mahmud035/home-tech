## HomeTech — Server

#### Project Name: HomeTech (server)

#### Live Website: <a href="https://hometech-be5e9.web.app/">HomeTech</a>

> This is the **server** half of the HomeTech monorepo. The React client lives in [`../client`](../client). Full project write-up: [root README](../README.md).

### Description

The HomeTech API is a single Express service backed by MongoDB Atlas. It exposes REST routes for product categories, products, users, bookings, and payments, issues JWTs for backend authorization, and integrates Stripe payment-intents.

### Collections

- `productCategories` — laptop categories
- `products` — listings (with `salesStatus`, `isAdvertise`, `reported`, `verified`)
- `users` — accounts with a `role` of `User` / `Seller` / `Admin`
- `bookings` — buyer bookings (marked `paid` after settlement)
- `payments` — recorded Stripe transactions

### Payment flow

1. `POST /create-payment-intent` → returns a Stripe `clientSecret` (amount computed server-side).
2. Client confirms the card with Stripe Elements.
3. `POST /payments` → records the payment and updates the booking with `paid: true` and `transactionId`.

### Auth

`verifyJWT` validates the `Authorization: Bearer <token>` header and, on user-scoped reads, compares the token's email claim to the requested email (403 on mismatch).

> Note: auth gating is not yet applied uniformly — several mutating and admin routes are currently public. See *Known limitations* in the [root README](../README.md).

### Built with

- Node.js, Express 4.18
- MongoDB native driver 4.12 (MongoDB Atlas)
- jsonwebtoken 9 (JWT)
- Stripe 11
- cors, dotenv, colors

### Run the server

```bash
git clone https://github.com/mahmud035/home-tech.git
cd home-tech/server
npm install
npm run start-dev        # nodemon, http://localhost:5000
```

**Environment (`.env`):**

```
DB_USER=...
DB_PASSWORD=...
ACCESS_TOKEN_SECRET=...
STRIPE_SECRET_KEY=...
```

### Test admin account

For reviewing the deployed site:

#### adminEmail: mahmud@gmail.com

#### adminPassword: 12@asd
