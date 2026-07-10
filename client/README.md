## Welcome! 👋

#### Project Name: HomeTech (client)

#### Live Website: <a href="https://hometech-be5e9.web.app/">HomeTech</a>

> This is the **client** half of the HomeTech monorepo. The Express + MongoDB API lives in [`../server`](../server). Full project write-up: [root README](../README.md).

### Description

HomeTech is a MERN marketplace for buying and selling second-hand laptops, with buyer, seller, and admin roles. Personal learning project — no real transactions or users.

### Features and Functionality

<ul>
<li>Browse top-brand laptops by category and book a product.</li>
<li>Pay for a booked product through Stripe.</li>
<li>Convert a buyer account to a seller account, then add / delete listings.</li>
<li>Sign up / sign in with email &amp; password, Google, or GitHub (Firebase Authentication).</li>
<li>Admin: verify sellers, moderate reported items, and remove buyers or sellers.</li>
<li>Sellers can advertise their products.</li>
</ul>

### Built with

- React v18
- React Router v6
- TanStack Query (server state)
- React Hook Form
- Firebase Authentication
- JWT (backend session)
- Stripe (@stripe/react-stripe-js)
- Axios
- React-Bootstrap
- Mobile-first workflow

### Run the client

```bash
git clone https://github.com/mahmud035/home-tech.git
cd home-tech/client
npm install
npm start            # http://localhost:3000
```

Provide your own Firebase web config in `src/firebase configuration/firebase.config.js`.

#### adminEmail: mahmud@gmail.com

#### adminPassword: 12@asd

### What I learned

This project gave me hands-on experience with role-based UI, Firebase Authentication, a JWT-secured backend, MongoDB CRUD, and integrating Stripe card payments from a React client.
