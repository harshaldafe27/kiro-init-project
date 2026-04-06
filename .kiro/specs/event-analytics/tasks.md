# Implementation Plan: Event Analytics

## Overview

Implement the per-event analytics feature across three layers: a new server-side controller function + route, a new client API helper, and a new `EventAnalyticsPage` component wired into the router and linked from `ManageEvents`.

## Tasks

- [x] 1. Implement server-side analytics controller function
  - [x] 1.1 Add `getEventAnalytics` function to `server/controllers/analytics.controller.js`
    - Fetch event by `:id`, return 404 if not found
    - Verify `event.createdBy === req.user._id`, return 403 if not owner
    - Fetch all registrations for the event
    - Compute `totalRegistrations` and `totalRevenue` (sum of `amount` where `paymentStatus === 'paid'`)
    - Derive `registrationSeries` by grouping registrations by calendar date of `registeredAt` (YYYY-MM-DD), counting per date, sorting ascending
    - Return `{ success: true, message: "Event analytics fetched", data: { totalRegistrations, totalRevenue, registrationSeries } }`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 1.2 Write property test for revenue computation (Property 3)
    - Create `server/tests/analytics.property.test.js`
    - Generate arbitrary registration arrays with random `paymentStatus` and `amount`; assert `totalRevenue` equals sum of paid amounts only
    - **Property 3: Revenue is sum of paid amounts only**
    - **Validates: Requirements 2.2**

  - [ ]* 1.3 Write property test for series data point shape (Property 4)
    - Generate random ISO timestamp arrays, derive series, assert every point has `date` matching `/^\d{4}-\d{2}-\d{2}$/` and `count >= 0`
    - **Property 4: Registration series data points are well-formed**
    - **Validates: Requirements 3.2, 5.5**

  - [ ]* 1.4 Write property test for series sort order (Property 5)
    - Generate shuffled timestamp arrays, derive series, assert dates are in ascending order
    - **Property 5: Registration series is sorted ascending**
    - **Validates: Requirements 3.5**

  - [ ]* 1.5 Write property test for series grouping correctness (Property 6)
    - Generate registrations with known dates, derive series, assert each date's count matches input and no date is duplicated
    - **Property 6: Series grouping is correct**
    - **Validates: Requirements 5.5**

  - [ ]* 1.6 Write property test for API response shape (Property 7)
    - Generate random registration arrays including empty, call controller logic, assert `totalRegistrations`, `totalRevenue`, and `registrationSeries` are always present
    - **Property 7: API response always contains required fields**
    - **Validates: Requirements 5.2**

- [x] 2. Register the new route in the analytics router
  - Add `router.get('/event/:id', protect, authorize('admin'), getEventAnalytics)` to `server/routes/analytics.routes.js`
  - Import `getEventAnalytics` from the controller
  - _Requirements: 5.1_

- [ ] 3. Checkpoint — Ensure all server tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Add client API helper
  - [x] 4.1 Add `getEventAnalyticsApi` to `client/src/api/analytics.api.js`
    - Export `export const getEventAnalyticsApi = (id) => api.get(\`/analytics/event/\${id}\`);`
    - _Requirements: 5.1, 5.2_

- [x] 5. Implement `EventAnalyticsPage` component
  - [x] 5.1 Create `client/src/pages/admin/EventAnalyticsPage.jsx`
    - Read `:id` from `useParams`
    - Use `useQuery` to call `getEventAnalyticsApi(id)`
    - Render `<Loader />` while loading
    - Render `<ErrorState onRetry={refetch} />` on error (covers 403, 404, network failures)
    - Render two stat cards: "Total Registrations" and "Total Revenue" (₹-prefixed)
    - Render recharts `<LineChart>` with X-axis "Date" and Y-axis "Registrations" when `registrationSeries` is non-empty
    - Render empty state message inside chart area when `registrationSeries` is empty
    - Render "Export CSV" button that triggers a download via `/api/v1/export/event/:id/csv`; show toast on export error
    - Stat cards must appear before the chart section in DOM order
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.3, 3.4, 4.1, 4.2, 4.3_

  - [ ]* 5.2 Write property test for analytics link per event (Property 1)
    - Create `client/src/__tests__/EventAnalyticsPage.property.test.jsx`
    - Generate random event arrays, render `ManageEvents`, assert each event row has a link to `/admin/events/:id/analytics`
    - **Property 1: Analytics link present for every event**
    - **Validates: Requirements 1.1**

  - [ ]* 5.3 Write property test for stat cards reflecting API data (Property 2)
    - Generate random `{ totalRegistrations, totalRevenue }` values, mock the API, render the page, assert both cards display correct values with ₹ prefix on revenue
    - **Property 2: Stat cards reflect API data**
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 5.4 Write example-based unit tests for `EventAnalyticsPage`
    - Test loading state while API is in-flight
    - Test `<ErrorState>` rendered on API failure (including 403)
    - Test empty state message when `registrationSeries` is `[]`
    - Test line chart rendered when `registrationSeries` is non-empty
    - Test stat cards appear before chart in DOM order
    - Test Export CSV button is present and triggers correct endpoint URL
    - _Requirements: 2.3, 2.4, 2.5, 3.3, 3.4, 4.1, 4.2_

- [x] 6. Wire `EventAnalyticsPage` into the router
  - Add `<Route path="events/:id/analytics" element={<EventAnalyticsPage />} />` inside the existing `/admin` route group in `client/src/routes/AppRouter.jsx`
  - _Requirements: 1.2_

- [x] 7. Add analytics link to `ManageEvents`
  - Import `BarChart2` from `lucide-react` and `Link` from `react-router-dom` in `client/src/pages/admin/ManageEvents.jsx`
  - Add a `<Link>` with the `BarChart2` icon to the Actions column for each event row, pointing to `/admin/events/${event._id}/analytics`
  - _Requirements: 1.1_

- [ ] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check (already available in the JS ecosystem, compatible with the existing Jest config in `server/jest.config.js`)
- The Export CSV button reuses the existing `/api/v1/export/event/:id/csv` endpoint — no server changes needed for that flow
