# DealKindred

**Good deals. Shared honestly.**

DealKindred is a portfolio-ready, full-stack coupon-sharing demo. People can publish coupons, browse active deals, claim a coupon, and track redemption. Coupon owners get a private view of claims and redeemers. Affiliate offers live in a separate area from community coupons.

## Features

- Email/password registration and JWT login
- Public active-coupon discovery and search
- Coupon creation with start date, expiry date, usage limit and terms
- Claim workflow with unique claim codes
- Coupon-owner dashboard showing claimant display names and claim status
- Redemption flow; exhausted coupons stop appearing in public discovery
- Separate affiliate offers page
- Sample card offers and a basic card-offer finder
- Seeded demo accounts and data
- Input validation, password hashing, security headers and API error handling

## Stack

- Frontend: React, TypeScript, Vite, React Router
- Backend: Node.js, Express, SQLite (`better-sqlite3`)
- Authentication: JWT + bcrypt
- Validation: Zod
- Security: Helmet, CORS, rate limiting

SQLite is used so the project runs locally without installing a database server. For a production version, migrate the data layer to PostgreSQL + Prisma, add Redis/BullMQ for expiry and notifications, object storage for coupon images, automated tests, CI/CD and deployment.

## Run locally

Requirements: Node.js 20+ and npm 10+.

```bash
cp .env.example .env
# Set JWT_SECRET to a long random value in .env
npm install
npm run db:seed
npm run dev
```

Open `http://localhost:5173`. API runs at `http://localhost:4000`.

### Demo accounts

| Role         | Email                     | Password       |
| ------------ | ------------------------- | -------------- |
| Coupon owner | `maya@dealkindred.demo`   | `DemoPass123!` |
| Member       | `ashish@dealkindred.demo` | `DemoPass123!` |

Change these credentials and the JWT secret before deploying anywhere public. Seed data is for local demonstration only.

## Main API routes

| Method | Route                     | Auth        | Purpose               |
| ------ | ------------------------- | ----------- | --------------------- |
| POST   | `/api/auth/register`      | No          | Create account        |
| POST   | `/api/auth/login`         | No          | Login                 |
| GET    | `/api/auth/me`            | Yes         | Current user          |
| GET    | `/api/coupons`            | No          | Browse active coupons |
| POST   | `/api/coupons`            | Yes         | Publish coupon        |
| GET    | `/api/coupons/mine`       | Yes         | Owner's coupons       |
| GET    | `/api/coupons/:id/claims` | Owner       | View claimants        |
| POST   | `/api/coupons/:id/claim`  | Yes         | Claim a coupon        |
| POST   | `/api/claims/:id/redeem`  | Claim owner | Mark claim redeemed   |
| GET    | `/api/claims/mine`        | Yes         | My claims             |
| GET    | `/api/affiliate`          | No          | Affiliate offers      |
| GET    | `/api/cards`              | No          | Card offers           |

## Business rules

- A coupon is discoverable only between its start and expiry dates and while remaining quantity is available.
- A member can claim a given coupon once.
- Claiming reserves one available use. The owner can mark a claim redeemed.
- When the available quantity reaches zero, the coupon is hidden from public discovery.
- Coupon owners can see claimant display names and status; other users cannot.
- Affiliate offers are a separate content type and are never mixed into community coupon results.

## Project structure

```text
dealkindred/
  client/                 React + TypeScript app
  server/
    src/
      db/                 SQLite schema and seed script
      middleware/         JWT authentication and error handling
      routes/             Auth, coupons, claims, affiliate and cards
      index.js
  .env.example
  README.md
```

## Author

- Ashish Vishwakarma @aksharma2799
- 
## License

MIT
