# EventFlex — Design Document

## Overview

EventFlex is a full-stack college event management platform supporting three distinct user roles: Student, Admin, and Principal. The system allows students to discover and register for events, admins to create and manage events with analytics, and principals to monitor platform-wide activity.

**Tech Stack:**
- Frontend: React + Tailwind CSS + React Router v6
- Backend: Node.js + Express (MVC pattern)
- Database: MongoDB + Mongoose
- Auth: JWT (access + refresh tokens)
- Real-time: Socket.io
- Payments: Razorpay / Stripe (test mode)
- Charts: Recharts
- Animations: Framer Motion (optional)

---

## Architecture

### High-Level Architecture

```
Client (React SPA)
  └── Student Panel, Admin Panel, Principal Panel, Auth Pages
        │
        ▼ HTTP + WebSocket
Server (Node.js / Express)
  └── REST API /api/v1/ + Socket.io Server
        │ JWT Auth Middleware → RBAC Middleware → Controller → Service → Model
        ▼
MongoDB (Users, Events, Registrations, AuditLogs)
        │
External Services: Razorpay/Stripe, Nodemailer
```

---

## Folder Structure

### Backend

```
server/
├── config/
│   ├── db.js
│   └── env.js
├── controllers/
│   ├── auth.controller.js
│   ├── event.controller.js
│   ├── registration.controller.js
│   ├── user.controller.js
│   ├── analytics.controller.js
│   └── payment.controller.js
├── middleware/
│   ├── auth.middleware.js
│   ├── rbac.middleware.js
│   ├── validate.middleware.js
│   └── error.middleware.js
├── models/
│   ├── User.model.js
│   ├── Event.model.js
│   ├── Registration.model.js
│   └── AuditLog.model.js
├── routes/
│   ├── auth.routes.js
│   ├── event.routes.js
│   ├── registration.routes.js
│   ├── user.routes.js
│   ├── analytics.routes.js
│   └── payment.routes.js
├── services/
│   ├── email.service.js
│   ├── payment.service.js
│   └── export.service.js
├── sockets/
│   └── socket.handler.js
├── utils/
│   ├── apiResponse.js
│   ├── pagination.js
│   └── auditLogger.js
├── app.js
└── server.js
```

### Frontend

```
client/
└── src/
    ├── api/
    │   ├── axiosInstance.js
    │   ├── auth.api.js
    │   ├── event.api.js
    │   ├── registration.api.js
    │   └── analytics.api.js
    ├── components/
    │   ├── common/
    │   │   ├── Navbar.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── EventCard.jsx
    │   │   ├── Modal.jsx
    │   │   ├── Toast.jsx
    │   │   ├── Loader.jsx
    │   │   ├── EmptyState.jsx
    │   │   ├── ErrorState.jsx
    │   │   ├── Pagination.jsx
    │   │   ├── SearchBar.jsx
    │   │   └── ThemeToggle.jsx
    │   ├── student/
    │   │   ├── EventGrid.jsx
    │   │   ├── RegistrationCard.jsx
    │   │   └── ProfileForm.jsx
    │   ├── admin/
    │   │   ├── EventForm.jsx
    │   │   ├── EventTable.jsx
    │   │   ├── StudentList.jsx
    │   │   └── AnalyticsChart.jsx
    │   └── principal/
    │       ├── PlatformStats.jsx
    │       ├── AdminActivityLog.jsx
    │       └── EventOverview.jsx
    ├── context/
    │   ├── AuthContext.jsx
    │   ├── ThemeContext.jsx
    │   └── SocketContext.jsx
    ├── hooks/
    │   ├── useAuth.js
    │   ├── useSocket.js
    │   ├── usePagination.js
    │   └── useToast.js
    ├── layouts/
    │   ├── DashboardLayout.jsx
    │   └── AuthLayout.jsx
    ├── pages/
    │   ├── auth/
    │   │   ├── Login.jsx
    │   │   └── Register.jsx
    │   ├── student/
    │   │   ├── StudentDashboard.jsx
    │   │   ├── EventBrowse.jsx
    │   │   ├── MyRegistrations.jsx
    │   │   └── Profile.jsx
    │   ├── admin/
    │   │   ├── AdminDashboard.jsx
    │   │   ├── ManageEvents.jsx
    │   │   ├── EventRegistrants.jsx
    │   │   └── AdminProfile.jsx
    │   └── principal/
    │       ├── PrincipalDashboard.jsx
    │       ├── AllEvents.jsx
    │       └── AdminActivity.jsx
    ├── routes/
    │   ├── AppRouter.jsx
    │   ├── ProtectedRoute.jsx
    │   └── RoleRoute.jsx
    ├── store/
    │   └── useStore.js
    ├── utils/
    │   ├── formatDate.js
    │   └── validators.js
    ├── App.jsx
    └── main.jsx
```

---

## Data Models

### User

```js
{
  _id: ObjectId,
  name: String,           // required
  email: String,          // required, unique, lowercase
  password: String,       // bcrypt hashed
  role: { type: String, enum: ['student', 'admin', 'principal'], default: 'student' },
  college: String,
  phone: String,
  avatar: String,
  isActive: Boolean,      // default: true
  refreshToken: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Event

```js
{
  _id: ObjectId,
  title: String,          // required
  description: String,
  date: Date,             // required
  endDate: Date,
  venue: String,          // required
  capacity: Number,       // required
  registeredCount: Number, // default: 0
  fee: Number,            // default: 0
  tags: [String],
  category: String,
  banner: String,
  createdBy: ObjectId,    // ref: User (admin)
  isPublished: Boolean,   // default: false
  isCancelled: Boolean,   // default: false
  createdAt: Date,
  updatedAt: Date
}
```

### Registration

```js
{
  _id: ObjectId,
  student: ObjectId,      // ref: User
  event: ObjectId,        // ref: Event
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['not_required', 'pending', 'paid', 'failed'], default: 'not_required' },
  paymentId: String,
  orderId: String,
  amount: Number,
  registeredAt: Date,
  createdAt: Date,
  updatedAt: Date
}
// Compound unique index: { student: 1, event: 1 }
```

### AuditLog

```js
{
  _id: ObjectId,
  actor: ObjectId,        // ref: User (admin)
  action: String,         // 'CREATE_EVENT' | 'UPDATE_EVENT' | 'DELETE_EVENT'
  targetType: String,
  targetId: ObjectId,
  metadata: Mixed,
  ip: String,
  createdAt: Date
}
```

---

## API Endpoint Design

All routes prefixed with `/api/v1/`.

### Auth
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/auth/register` | Public | Register new student |
| POST | `/auth/login` | Public | Login all roles |
| POST | `/auth/logout` | Auth | Logout |
| POST | `/auth/refresh` | Public | Refresh access token |
| GET | `/auth/me` | Auth | Get current user |

### Users
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/users/profile` | Auth | Get own profile |
| PUT | `/users/profile` | Auth | Update own profile |
| GET | `/users` | Principal | List all users |
| PATCH | `/users/:id/status` | Principal | Toggle user status |

### Events
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/events` | Auth | List published events (search/filter/paginate) |
| GET | `/events/:id` | Auth | Get single event |
| POST | `/events` | Admin | Create event |
| PUT | `/events/:id` | Admin (owner) | Update event |
| DELETE | `/events/:id` | Admin (owner) | Delete event |
| PATCH | `/events/:id/publish` | Admin (owner) | Toggle publish |
| GET | `/events/:id/registrants` | Admin (owner) | List registrants |
| GET | `/events/admin/mine` | Admin | Admin's own events |
| GET | `/events/all` | Principal | All events |

### Registrations
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/registrations` | Student | Register for event |
| GET | `/registrations/mine` | Student | Own registrations |
| DELETE | `/registrations/:id` | Student | Cancel registration |
| GET | `/registrations/event/:eventId` | Admin | Event registrations |

### Analytics
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/analytics/admin` | Admin | Admin event stats |
| GET | `/analytics/platform` | Principal | Platform-wide stats |
| GET | `/analytics/admin-activity` | Principal | Admin activity summary |

### Payments
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/payments/create-order` | Student | Create payment order |
| POST | `/payments/verify` | Student | Verify payment |
| GET | `/payments/history` | Student | Payment history |

### Export
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/export/event/:id/csv` | Admin | Export CSV |
| GET | `/export/event/:id/pdf` | Admin | Export PDF |

---

## Authentication Flow

1. Client sends `POST /auth/login { email, password }`
2. Server finds user, runs `bcrypt.compare`
3. Returns `accessToken` (15min, in response body) + `refreshToken` (7d, httpOnly cookie)
4. Client stores accessToken in memory (Zustand), refreshToken in httpOnly cookie
5. Axios interceptor attaches `Authorization: Bearer <accessToken>` to every request
6. On 401, interceptor calls `POST /auth/refresh`, gets new accessToken, retries original request
7. If refresh fails, user is logged out and redirected to `/login`

---

## State Management

**Zustand** for global UI state:
- `auth` slice: user, accessToken, login(), logout()
- `theme` slice: isDark, toggle()
- `toast` slice: toasts[], addToast(), removeToast()
- `socket` slice: socket instance, connected

**React Query (TanStack Query)** for all server state — caching, background refetch, loading/error states.

---

## Real-Time Architecture (Socket.io)

Clients authenticate via JWT query param on connect and join role-based rooms:
- Students → `student-room`
- Admins → `admin-{adminId}`
- Principals → `principal-room`

| Event | Direction | Purpose |
|-------|-----------|---------|
| `event:new` | Server → Students | New event published |
| `event:updated` | Server → All | Event details changed |
| `event:cancelled` | Server → All | Event cancelled |
| `registration:update` | Server → Admin | Live registration count |
| `notification:new` | Server → User | Personal notification |

---

## Payment Flow

1. Student clicks Register on paid event
2. Client calls `POST /payments/create-order { eventId }`
3. Server creates Razorpay/Stripe order, returns `{ orderId, amount, key }`
4. Client opens payment modal, student completes payment
5. Client calls `POST /payments/verify { orderId, paymentId, signature }`
6. Server validates HMAC-SHA256 signature
7. On success: Registration.paymentStatus = 'paid', Event.registeredCount++
8. Email confirmation sent via Nodemailer

---

## UI Layout Design

```
┌─────────────────────────────────────────────────────┐
│  Navbar: [Logo] [Page Title]    [Bell] [Avatar] [☀] │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│   Sidebar    │         Main Content Area            │
│  (240px)     │                                      │
│  ▸ Dashboard │   ┌──────┐ ┌──────┐ ┌──────┐        │
│  ▸ Events    │   │ Card │ │ Card │ │ Card │        │
│  ▸ Profile   │   └──────┘ └──────┘ └──────┘        │
│              │                                      │
│  [Collapse]  │   ┌──────────────────────────────┐   │
│              │   │        Table / Chart          │   │
└──────────────┴───┴──────────────────────────────┴───┘
```

- Sidebar: 240px desktop, icon-only (64px) on collapse, drawer on mobile
- Navbar: fixed top, 64px height
- Dark mode via `dark:` Tailwind classes, toggled by ThemeContext

---

## Correctness Properties

### Property 1: Auth Round-Trip
For any valid registration payload, registering then logging in with same credentials returns a valid JWT.
**Validates: Requirements 1.1, 1.2**

### Property 2: Published Events Isolation
Every event in `GET /events` response has `isPublished=true` and `isCancelled=false`.
**Validates: Requirement 2.1**

### Property 3: Registration Record Correctness
Successfully registering creates exactly one Registration doc with correct student and event IDs.
**Validates: Requirement 3.1**

### Property 4: Duplicate Registration Rejected
A second registration for the same student+event returns 409 and count stays at 1.
**Validates: Requirement 3.3**

### Property 5: Student Data Isolation
`GET /registrations/mine` returns only the requesting student's registrations.
**Validates: Requirement 3.5**

### Property 6: Profile Update Round-Trip
Updating profile then fetching it reflects all updated fields.
**Validates: Requirement 4.2**

### Property 7: Event CRUD Round-Trips
Create→fetch consistent; update→fetch reflects changes; delete→fetch returns 404.
**Validates: Requirements 5.1, 5.3, 5.4**

### Property 8: Admin Ownership Enforcement
Admin B updating/deleting Admin A's event returns 403.
**Validates: Requirement 5.3**

### Property 9: AuditLog Written on Admin Actions
Every admin create/update/delete produces an AuditLog doc with correct actor, action, targetId.
**Validates: Requirement 7.4**

### Property 10: Principal Sees All Events
`GET /events/all` includes events from every admin in the system.
**Validates: Requirements 7.1, 7.2**

### Property 11: RBAC Enforcement
Missing JWT → 401. Wrong role → 403.
**Validates: Requirements 1.4, 1.5**

### Property 12: Capacity Enforcement Invariant
Registration on a full event is rejected; registeredCount unchanged.
**Validates: Requirement 3.1**

### Property 13: Cancellation Decrements Count
Cancelling a confirmed registration decrements registeredCount by exactly 1.
**Validates: Requirement 3.5**

### Property 14: Payment Signature Gates Confirmation
Only valid HMAC-SHA256 signature transitions registration to paymentStatus='paid'.
**Validates: Requirement 3.6**

### Property 15: Search and Filter Returns Only Matching Results
All returned events contain the query string in title, description, or tags.
**Validates: Requirements 2.2, 2.3**

### Property 16: Pagination Metadata Correctness
Response items ≤ limit; total/page/pages metadata accurately reflects full dataset.
**Validates: Requirement 2.4**

---

## Error Handling

### Backend — Standard Error Shape
```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [],
  "code": "ERROR_CODE"
}
```

| HTTP Status | Scenario |
|-------------|----------|
| 400 | Validation failure, malformed body |
| 401 | Missing or expired JWT |
| 403 | Insufficient role / ownership violation |
| 404 | Resource not found |
| 409 | Duplicate registration / email |
| 422 | Payment signature failure |
| 500 | Unhandled server error |

### Frontend
- React Query `onError` → `useToast` for user-facing messages
- Axios interceptor: 401 → refresh → retry; refresh fail → logout
- `ErrorState` component with retry button on query failure
- `EmptyState` component when query returns zero results

---

## Testing Strategy

### Property-Based Tests (fast-check, backend)
Minimum 100 iterations per property. Tag format: `// Feature: eventflex, Property N: description`

All 16 properties above are covered by property-based tests in `server/tests/property/`.

### Unit Tests
- Backend: Jest + Supertest + mongodb-memory-server
- Frontend: Vitest + React Testing Library

```
server/tests/
├── unit/          (auth, event, payment)
├── property/      (auth, event, registration, rbac, pagination)
└── setup.js

client/src/__tests__/
├── EventCard.test.jsx
├── EventForm.test.jsx
└── auth.integration.test.jsx
```
