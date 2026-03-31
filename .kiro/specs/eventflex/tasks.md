# Implementation Plan: EventFlex

## Overview

Incremental implementation of the EventFlex college event management platform. Tasks build from project scaffolding → backend foundation → auth → features → frontend → testing.

## Tasks

- [x] 1. Project scaffolding and monorepo setup
  - Initialize monorepo with `server/` and `client/` directories
  - Create `server/package.json` with dependencies: express, mongoose, jsonwebtoken, bcryptjs, cookie-parser, cors, dotenv, socket.io, nodemailer, razorpay, stripe, pdfkit, csv-writer, express-validator
  - Create `client/package.json` with Vite + React, tailwindcss, react-router-dom, @tanstack/react-query, zustand, axios, socket.io-client, recharts, framer-motion
  - Create `server/.env.example` and `client/.env.example` with all required env vars
  - Configure Tailwind CSS with dark mode class strategy
  - Set up Jest config in `server/` with mongodb-memory-server and Vitest config in `client/`

- [x] 2. Backend core: Express app, MongoDB connection, middleware
  - [x] 2.1 Create `server/config/db.js` (Mongoose connect with retry) and `server/config/env.js`
  - [x] 2.2 Create `server/utils/apiResponse.js`, `server/utils/pagination.js`, `server/utils/auditLogger.js`
  - [x] 2.3 Create `server/middleware/error.middleware.js` and `server/middleware/validate.middleware.js`
  - [x] 2.4 Create `server/app.js` (mount CORS, cookie-parser, JSON body parser, routes, error middleware) and `server/server.js`

- [-] 3. Auth system
  - [x] 3.1 Create `server/models/User.model.js` with schema, bcrypt pre-save hook, comparePassword method
  - [x] 3.2 Create `server/middleware/auth.middleware.js` (verify Bearer JWT) and `server/middleware/rbac.middleware.js`
  - [x] 3.3 Create `server/controllers/auth.controller.js`: register, login, logout, refresh, getMe
  - [x] 3.4 Create `server/routes/auth.routes.js` and mount on `/api/v1/auth`
  - [ ]* 3.5 Write unit tests for auth controller in `server/tests/unit/auth.test.js`
  - [ ]* 3.6 Write property test — Property 1: Auth Round-Trip (`server/tests/property/auth.property.test.js`, numRuns: 100)

- [x] 4. User profile routes
  - [x] 4.1 Create `server/controllers/user.controller.js`: getProfile, updateProfile, listUsers, toggleUserStatus
  - [x] 4.2 Create `server/routes/user.routes.js` and mount on `/api/v1/users`

- [-] 5. Event management — backend
  - [x] 5.1 Create `server/models/Event.model.js` with full schema
  - [x] 5.2 Create `server/controllers/event.controller.js`: listEvents, getEvent, createEvent, updateEvent, deleteEvent, togglePublish, getRegistrants, getAdminEvents, getAllEvents
  - [x] 5.3 Create `server/routes/event.routes.js` and mount on `/api/v1/events`
  - [ ]* 5.4 Write unit tests in `server/tests/unit/event.test.js`
  - [ ]* 5.5 Write property test — Property 7: Event CRUD Round-Trips (numRuns: 100)
  - [ ]* 5.6 Write property test — Property 8: Admin Ownership Enforcement (numRuns: 100)
  - [ ]* 5.7 Write property test — Property 2: Published Events Isolation (numRuns: 100)

- [-] 6. AuditLog model and wiring
  - [x] 6.1 Create `server/models/AuditLog.model.js`
  - [x] 6.2 Wire `auditLogger.js` into event controller create/update/delete
  - [ ]* 6.3 Write property test — Property 9: AuditLog Written on Admin Actions (numRuns: 100)

- [-] 7. Registration system — backend
  - [x] 7.1 Create `server/models/Registration.model.js` with compound unique index `{ student, event }`
  - [x] 7.2 Create `server/controllers/registration.controller.js`: register, getMyRegistrations, cancelRegistration, getEventRegistrations
  - [x] 7.3 Create `server/routes/registration.routes.js` and mount on `/api/v1/registrations`
  - [ ]* 7.4 Write property test — Property 3: Registration Record Correctness (numRuns: 100)
  - [ ]* 7.5 Write property test — Property 4: Duplicate Registration Rejected (numRuns: 100)
  - [ ]* 7.6 Write property test — Property 5: Student Data Isolation (numRuns: 100)
  - [ ]* 7.7 Write property test — Property 12: Capacity Enforcement Invariant (numRuns: 100)
  - [ ]* 7.8 Write property test — Property 13: Cancellation Decrements Count (numRuns: 100)

- [x] 8. Analytics endpoints
  - [x] 8.1 Create `server/controllers/analytics.controller.js`: getAdminStats, getPlatformStats, getAdminActivity
  - [x] 8.2 Create `server/routes/analytics.routes.js` and mount on `/api/v1/analytics`

- [ ] 9. RBAC property test
  - [ ]* 9.1 Write property test — Property 11: RBAC Enforcement (`server/tests/property/rbac.property.test.js`, numRuns: 100)

- [ ] 10. Search, filter, and pagination property tests
  - [ ]* 10.1 Write property test — Property 15: Search and Filter Returns Only Matching Results (numRuns: 100)
  - [ ]* 10.2 Write property test — Property 16: Pagination Metadata Correctness (`server/tests/property/pagination.property.test.js`, numRuns: 100)

- [ ] 11. Principal sees all events property test
  - [ ]* 11.1 Write property test — Property 10: Principal Sees All Events (numRuns: 100)

- [ ] 12. Profile update property test
  - [ ]* 12.1 Write property test — Property 6: Profile Update Round-Trip (numRuns: 100)

- [ ] 13. Payment integration — backend
  - [ ] 13.1 Create `server/services/payment.service.js` with Razorpay and Stripe helpers and HMAC signature verification
  - [ ] 13.2 Create `server/controllers/payment.controller.js`: createOrder, verifyPayment, getPaymentHistory
  - [ ] 13.3 Create `server/routes/payment.routes.js` and mount on `/api/v1/payments`
  - [ ]* 13.4 Write unit tests in `server/tests/unit/payment.test.js`
  - [ ]* 13.5 Write property test — Property 14: Payment Signature Gates Confirmation (numRuns: 100)

- [ ] 14. Email notifications
  - [ ] 14.1 Create `server/services/email.service.js` using Nodemailer: sendRegistrationConfirmation, sendCancellationNotice, sendEventUpdateNotice
  - [ ] 14.2 Call email service from registration and event controllers

- [ ] 15. Export service
  - [ ] 15.1 Create `server/services/export.service.js`: exportRegistrantsCSV (csv-writer), exportRegistrantsPDF (pdfkit)
  - [ ] 15.2 Create export routes `GET /api/v1/export/event/:id/csv` and `/pdf`

- [ ] 16. Socket.io real-time layer
  - [ ] 16.1 Create `server/sockets/socket.handler.js`: JWT auth on connect, role-based rooms, emitToRoom helper
  - [ ] 16.2 Emit socket events from event and registration controllers

- [ ] 17. Backend checkpoint — ensure all backend tests pass

- [ ] 18. Frontend setup
  - [ ] 18.1 Configure Vite + React, Tailwind CSS with `darkMode: 'class'`, base styles in `index.css`
  - [ ] 18.2 Create `client/src/main.jsx` and `client/src/App.jsx` with all context providers
  - [ ] 18.3 Create `client/src/store/useStore.js` with Zustand slices: auth, theme, toast, socket
  - [ ] 18.4 Create `client/src/api/axiosInstance.js` with Bearer token interceptor and 401 refresh/retry logic
  - [ ] 18.5 Create `client/src/api/auth.api.js`, `event.api.js`, `registration.api.js`, `analytics.api.js`

- [ ] 19. Routing and layouts
  - [ ] 19.1 Create `ProtectedRoute.jsx` and `RoleRoute.jsx`
  - [ ] 19.2 Create `AppRouter.jsx` with all routes: `/login`, `/register`, `/student/*`, `/admin/*`, `/principal/*`
  - [ ] 19.3 Create `AuthLayout.jsx` and `DashboardLayout.jsx` (Sidebar + Navbar + Outlet)

- [ ] 20. Context providers and hooks
  - [ ] 20.1 Create `AuthContext.jsx`, `ThemeContext.jsx`, `SocketContext.jsx`
  - [ ] 20.2 Create hooks: `useAuth.js`, `useSocket.js`, `usePagination.js`, `useToast.js`

- [ ] 21. Shared components
  - [ ] 21.1 Create `Navbar.jsx` and `Sidebar.jsx` (role-based nav, collapsible, mobile drawer)
  - [ ] 21.2 Create `EventCard.jsx`, `Modal.jsx`, `Toast.jsx`
  - [ ] 21.3 Create `Pagination.jsx`, `SearchBar.jsx` (debounced 300ms), `EmptyState.jsx`, `ErrorState.jsx`, `Loader.jsx`, `ThemeToggle.jsx`

- [ ] 22. Auth pages
  - [ ] 22.1 Create `Login.jsx` — form, call POST /auth/login, store token, redirect to role dashboard
  - [ ] 22.2 Create `Register.jsx` — form, call POST /auth/register, auto-login on success
  - [ ]* 22.3 Write frontend unit tests in `client/src/__tests__/auth.integration.test.jsx`

- [ ] 23. Student panel
  - [ ] 23.1 Create `StudentDashboard.jsx` with KPI row and `EventGrid.jsx` (search/filter/pagination)
  - [ ] 23.2 Create `EventBrowse.jsx` with SearchBar, category filter, Pagination, EventCard with register action
  - [ ] 23.3 Create `MyRegistrations.jsx` with `RegistrationCard.jsx` (status, payment info, cancel button)
  - [ ] 23.4 Create `Profile.jsx` with `ProfileForm.jsx` (editable fields, validation)

- [ ] 24. Admin panel
  - [ ] 24.1 Create `AdminDashboard.jsx` with KPI row, Recharts bar chart and pie chart, recent registrations table
  - [ ] 24.2 Create `ManageEvents.jsx` with `EventTable.jsx` (sortable, publish toggle, edit/delete)
  - [ ] 24.3 Create `EventForm.jsx` (create/edit form with full validation)
  - [ ] 24.4 Create `EventRegistrants.jsx` with `StudentList.jsx` and CSV export button
  - [ ]* 24.5 Write frontend unit tests in `client/src/__tests__/EventForm.test.jsx`

- [ ] 25. Principal panel
  - [ ] 25.1 Create `PrincipalDashboard.jsx` with `PlatformStats.jsx` and Recharts line chart (registration trend)
  - [ ] 25.2 Create `AllEvents.jsx` with `EventOverview.jsx` (read-only, filter by admin)
  - [ ] 25.3 Create `AdminActivity.jsx` with `AdminActivityLog.jsx` (paginated AuditLog table)

- [ ] 26. Dark/light mode
  - [ ] 26.1 Ensure ThemeContext toggles `dark` class on `<html>`; verify all components use `dark:` Tailwind variants
  - [ ] 26.2 Persist theme preference to localStorage and restore on app load

- [ ] 27. Frontend shared component tests
  - [ ]* 27.1 Write unit tests in `client/src/__tests__/EventCard.test.jsx`

- [ ] 28. Final checkpoint — ensure all backend and frontend tests pass
