# Requirements Document

## Introduction

This feature adds a dedicated per-event analytics page to the EventFlex admin experience. Currently, admins can view aggregate stats (total events, registrations, revenue) and cross-event charts on the AdminDashboard. This feature drills one level deeper: clicking into a specific event opens an analytics view scoped to that event, showing its registration count, revenue, a day-by-day registrations chart, and a CSV export of its registrants.

The feature reuses the existing recharts library, the existing Export CSV endpoint, and the existing admin authentication/authorization model.

## Glossary

- **Analytics_Page**: The per-event analytics view rendered at `/admin/events/:id/analytics`
- **Admin**: An authenticated user with the `admin` role who owns the event
- **Event**: A college event document stored in MongoDB, identified by its `_id`
- **Registration**: A document linking a student to an event, containing `registeredAt`, `paymentStatus`, and `amount` fields
- **Registration_Series**: An ordered list of daily data points derived from registrations, used to populate the line chart
- **Analytics_API**: The server-side endpoint that computes and returns per-event analytics data
- **Export_CSV_Endpoint**: The existing `/api/v1/export/event/:id/csv` endpoint that streams a CSV file of registrants

---

## Requirements

### Requirement 1: Per-Event Analytics Navigation

**User Story:** As an admin, I want to navigate to an analytics view for a specific event, so that I can inspect that event's performance in isolation.

#### Acceptance Criteria

1. WHEN an admin views the ManageEvents page, THE Analytics_Page link SHALL be accessible for each event listed.
2. WHEN an admin navigates to `/admin/events/:id/analytics`, THE Analytics_Page SHALL render scoped to the event identified by `:id`.
3. IF the `:id` parameter does not correspond to an event owned by the authenticated admin, THEN THE Analytics_Page SHALL display an error state and SHALL NOT render any analytics data.

---

### Requirement 2: Summary Stat Cards

**User Story:** As an admin, I want to see total registrations and total revenue for a specific event at a glance, so that I can quickly assess that event's performance.

#### Acceptance Criteria

1. THE Analytics_Page SHALL display a "Total Registrations" card showing the count of all registrations for the event.
2. THE Analytics_Page SHALL display a "Total Revenue" card showing the sum of `amount` for all registrations where `paymentStatus` is `paid`, formatted with the ₹ symbol.
3. WHEN the Analytics_API returns data, THE Analytics_Page SHALL render both stat cards before the chart section.
4. WHILE the Analytics_API request is in progress, THE Analytics_Page SHALL display a loading indicator in place of the stat cards and chart.
5. IF the Analytics_API request fails, THEN THE Analytics_Page SHALL display an error state with a retry action.

---

### Requirement 3: Registrations Over Time Line Chart

**User Story:** As an admin, I want to see a line graph of registrations over time for a specific event, so that I can understand registration trends and peak periods.

#### Acceptance Criteria

1. THE Analytics_Page SHALL display a line chart with the X-axis labeled "Date" and the Y-axis labeled "Registrations".
2. THE Analytics_API SHALL return a Registration_Series where each data point contains a `date` (formatted as `YYYY-MM-DD`) and a `count` representing the number of registrations on that day.
3. WHEN the Registration_Series contains data, THE Analytics_Page SHALL render the line chart using the Registration_Series data points.
4. IF the Registration_Series is empty, THEN THE Analytics_Page SHALL display an empty state message within the chart area instead of rendering an empty chart.
5. THE Analytics_API SHALL return Registration_Series data points sorted in ascending chronological order.

---

### Requirement 4: Export CSV

**User Story:** As an admin, I want to export the registrant list for a specific event as a CSV file, so that I can use the data in external tools.

#### Acceptance Criteria

1. THE Analytics_Page SHALL display an "Export CSV" button.
2. WHEN an admin clicks the "Export CSV" button, THE Analytics_Page SHALL trigger a download using the existing Export_CSV_Endpoint at `/api/v1/export/event/:id/csv`.
3. IF the Export_CSV_Endpoint returns an error, THEN THE Analytics_Page SHALL display a toast notification indicating the export failed.

---

### Requirement 5: Per-Event Analytics API Endpoint

**User Story:** As a developer, I want a dedicated API endpoint for per-event analytics, so that the Analytics_Page can fetch scoped data without recomputing aggregate stats.

#### Acceptance Criteria

1. THE Analytics_API SHALL expose a `GET /api/v1/analytics/event/:id` endpoint protected by admin authentication middleware.
2. WHEN a valid event `:id` is provided, THE Analytics_API SHALL return `totalRegistrations`, `totalRevenue`, and `registrationSeries` in the response body.
3. IF the requesting admin does not own the event identified by `:id`, THEN THE Analytics_API SHALL return a 403 response.
4. IF the event identified by `:id` does not exist, THEN THE Analytics_API SHALL return a 404 response.
5. THE Analytics_API SHALL derive `registrationSeries` by grouping registrations by the calendar date of their `registeredAt` field and counting registrations per date.
