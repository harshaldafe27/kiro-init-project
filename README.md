# EventFlex

A full-stack college event management platform supporting Student, Admin, and Principal roles.

**Tech Stack:** React + Tailwind CSS · Node.js/Express · MongoDB · JWT · Socket.io · Razorpay/Stripe

---

## Project Structure

```
eventflex/
├── server/          # Node.js/Express backend
└── client/          # React + Vite frontend
```

---

## Setup

### Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas)

### 1. Clone and install dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure environment variables

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your values

# Client
cp client/.env.example client/.env
# Edit client/.env with your values
```

### 3. Run the development servers

```bash
# Start backend (from server/)
cd server
npm run dev

# Start frontend (from client/) — in a separate terminal
cd client
npm run dev
```

The API will be available at `http://localhost:5000/api/v1` and the frontend at `http://localhost:5173`.

---

## Running Tests

```bash
# Backend tests (Jest + Supertest + mongodb-memory-server)
cd server
npm test

# Run only unit tests
npm run test:unit

# Run only property-based tests
npm run test:property

# Frontend tests (Vitest + React Testing Library)
cd client
npm test
```

---

## Environment Variables

### server/.env

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `JWT_ACCESS_EXPIRES` | Access token expiry (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES` | Refresh token expiry (e.g. `7d`) |
| `RAZORPAY_KEY_ID` | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay API key secret |
| `STRIPE_SECRET_KEY` | Stripe secret key (test mode) |
| `EMAIL_USER` | SMTP email address |
| `EMAIL_PASS` | SMTP email password / app password |
| `CLIENT_URL` | Frontend origin for CORS (e.g. `http://localhost:5173`) |
| `PORT` | Server port (default `5000`) |

### client/.env

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |
| `VITE_SOCKET_URL` | Socket.io server URL |
| `VITE_RAZORPAY_KEY_ID` | Razorpay public key for frontend |
