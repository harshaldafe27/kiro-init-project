# Requirements Document

## Introduction

EventFlex is a full-stack college event management web application built with React, Node.js/Express, and MongoDB. It supports three distinct user roles — Student, Admin, and Principal — each with a dedicated, secure panel. Students can discover and register for events; Admins can create and manage events with participation analytics; Principals can monitor all activity and view platform-wide trends. The platform is fully responsive, JWT-authenticated, and designed to be hackathon-ready with clean UI/UX.

## Glossary

- **System**: The EventFlex web application as a whole
- **Student**: A college student who registers and participates in events
- **Admin**: A staff member who creates and manages events
- **Principal**: A senior authority who monitors all events and admin activity
- **Event**: A college activity with a name, description, deadline, rules, and registration fee
- **Registration**: A Student's enrollment in a specific Event
- **JWT**: JSON Web Token used for stateless authentication
- **RBAC**: Role-Based Access Control — restricts access based on the user's role (Student, Admin, Principal)
- **Dashboard**: The role-specific home screen shown after login
- **API**: RESTful HTTP interface between the frontend and backend
- **Validator**: The backend and frontend form validation layer
- **Auth_Service**: The authentication module handling login, signup, and token management
- **Event_Service**: The backend service responsible for event CRUD operations
- **Registration_Service**: The backend service managing student event registrations
- **Analytics_Service**: The backend service aggregating participation and trend data
- **Notification_Service**: The service responsible for sending email and in-app toast notifications
- **Report_Service**: The service responsible for exporting data as PDF or CSV
- **Payment_Service**: The service integrating with Razorpay/Stripe for fee collection

---

## Requirements

### Requirement 1: User Authentication and Role-Based Access

**User Story:** As a user (Student, Admin, or Principal), I want to securely sign up and sign in, so that I can access my role-specific panel without unauthorized access.

#### Acceptance Criteria

1. WHEN a new Student submits a valid sign-up form, THE Auth_Service SHALL create an account with a bcrypt-hashed password and return a JWT.
2. WHEN a user submits valid login credentials, THE Auth_Service SHALL return a signed JWT containing the user's role and ID.
3. WHEN a user submits invalid login credentials, THE Auth_Service SHALL return an HTTP 401 response with a descriptive error message.
4. WHEN a request is made to a protected route without a valid JWT, THE System SHALL return an HTTP 401 response and deny access.
5. WHEN a request is made to a route restricted to a specific role, THE System SHALL verify the JWT role claim and return HTTP 403 if the role does not match.
6. THE Auth_Service SHALL hash all passwords using bcrypt with a minimum cost factor of 10 before storing them in the database.
7. WHEN a JWT expires, THE System SHALL reject the token and require the user to re-authenticate.
8. THE Validator SHALL enforce that sign-up and sign-in form fields are non-empty and correctly formatted on both the frontend and backend.

---

### Requirement 2: Student Dashboard and Event Discovery

**User Story:** As a Student, I want to view all active events and their details, so that I can decide which events to register for.

#### Acceptance Criteria

1. WHEN a Student accesses the Dashboard, THE System SHALL display all active Events as cards showing name, description, deadline, rules, and registration fee.
2. WHEN a Student enters a search term, THE System SHALL filter the displayed Events to those whose name or description contains the search term.
3. WHEN a Student applies a filter (e.g., by fee range or deadline), THE System SHALL display only Events matching the selected filter criteria.
4. WHEN the total number of active Events exceeds 10, THE System SHALL paginate results and display a maximum of 10 Events per page.
5. WHEN no Events match the current search or filter, THE System SHALL display an empty state message indicating no results were found.
6. WHILE Events are being fetched from the API, THE System SHALL display a loading state indicator.
7. IF the Event data fetch fails, THEN THE System SHALL display an error message and provide a retry option.

---

### Requirement 3: Student Event Registration

**User Story:** As a Student, I want to register for events, so that I can participate in college activities.

#### Acceptance Criteria

1. WHEN a Student clicks "Register" on an Event card, THE Registration_Service SHALL create a Registration record linking the Student to the Event.
2. WHEN a Student attempts to register for an Event with a past deadline, THE System SHALL reject the registration and display an error message.
3. WHEN a Student attempts to register for an Event they are already registered for, THE Registration_Service SHALL return an HTTP 409 response and display a duplicate registration error.
4. WHEN a Student successfully registers for an Event, THE System SHALL display a success toast notification.
5. WHEN a Student views their "My Registrations" section, THE System SHALL display all Events the Student has registered for.
6. WHERE the Payment_Service is enabled, WHEN a Student registers for a paid Event, THE Payment_Service SHALL process the fee via Razorpay or Stripe test mode before confirming the Registration.
7. WHERE the Notification_Service is enabled, WHEN a Student successfully registers, THE Notification_Service SHALL send a confirmation email to the Student's registered email address.

---

### Requirement 4: Student Profile Management

**User Story:** As a Student, I want to manage my profile, so that my account information stays accurate.

#### Acceptance Criteria

1. WHEN a Student accesses the Profile page, THE System SHALL display the Student's current name, email, and profile details.
2. WHEN a Student submits a valid profile update form, THE System SHALL persist the updated information and display a success toast notification.
3. WHEN a Student submits a profile update with an invalid or empty required field, THE Validator SHALL display a field-level error message and prevent submission.

---

### Requirement 5: Admin Event Management

**User Story:** As an Admin, I want to create, edit, and delete events, so that I can manage the college event calendar.

#### Acceptance Criteria

1. WHEN an Admin submits a valid Create Event form, THE Event_Service SHALL persist the new Event with name, description, deadline, rules, and registration fee.
2. WHEN an Admin submits a Create Event form with missing required fields, THE Validator SHALL return field-level errors and prevent the Event from being created.
3. WHEN an Admin submits a valid Edit Event form, THE Event_Service SHALL update the corresponding Event record and return the updated Event.
4. WHEN an Admin deletes an Event, THE Event_Service SHALL remove the Event record and all associated Registrations from the database.
5. WHEN an Admin views the Manage Events page, THE System SHALL display all Events created by that Admin with options to edit or delete each.
6. WHEN an Admin views the registrations for a specific Event, THE System SHALL display a list of all Students registered for that Event.

---

### Requirement 6: Admin Analytics Dashboard

**User Story:** As an Admin, I want to view participation analytics, so that I can understand student engagement across events.

#### Acceptance Criteria

1. WHEN an Admin accesses the Dashboard, THE Analytics_Service SHALL return the total number of Students registered across all Events.
2. WHEN an Admin accesses the Dashboard, THE Analytics_Service SHALL return per-Event registration counts for all Events created by that Admin.
3. WHEN an Admin views the analytics charts, THE System SHALL render a bar or pie chart showing event-wise participation using Chart.js or Recharts.
4. WHEN the analytics data fetch fails, THE System SHALL display an error message in place of the chart.

---

### Requirement 7: Principal Monitoring Dashboard

**User Story:** As a Principal, I want to view all events and platform-wide analytics, so that I can monitor admin activity and overall student participation.

#### Acceptance Criteria

1. WHEN a Principal accesses the Dashboard, THE System SHALL display all Events created by all Admins, including each Event's name, description, deadline, and creator.
2. WHEN a Principal views analytics, THE Analytics_Service SHALL return total registration counts per Event across the entire platform.
3. WHEN a Principal views participation trends, THE Analytics_Service SHALL return aggregated registration data grouped by time period (e.g., weekly or monthly).
4. WHEN a Principal views admin activity, THE System SHALL display a log of Event creation, edits, and deletions performed by each Admin.
5. WHEN the analytics data fetch fails, THE System SHALL display an error message and provide a retry option.

---

### Requirement 8: UI/UX and Responsiveness

**User Story:** As any user, I want a clean, responsive, and accessible interface, so that I can use the platform comfortably on any device.

#### Acceptance Criteria

1. THE System SHALL render all pages correctly on screen widths from 320px (mobile) to 1920px (desktop) without horizontal overflow.
2. THE System SHALL provide a sidebar navigation and top navbar on Dashboard layouts for all roles.
3. WHEN a user toggles the dark/light mode switch, THE System SHALL apply the selected theme across all UI components and persist the preference in local storage.
4. WHEN an asynchronous operation is in progress, THE System SHALL display a loading state (spinner or skeleton) in the relevant UI section.
5. WHEN a user action succeeds or fails, THE System SHALL display a toast notification with a descriptive message within 500ms of the operation completing.
6. WHEN a data list is empty, THE System SHALL display a contextual empty state message and, where applicable, a call-to-action.
7. THE System SHALL use rounded cards, soft shadows, and grid layouts consistent with the defined design system across all pages.

---

### Requirement 9: RESTful API and Error Handling

**User Story:** As a developer, I want a well-structured RESTful API with consistent error handling, so that the frontend and backend integrate reliably.

#### Acceptance Criteria

1. THE System SHALL expose RESTful API endpoints following the pattern `/api/v1/{resource}` for all resources (auth, events, registrations, users, analytics).
2. WHEN an API request succeeds, THE System SHALL return the appropriate 2xx HTTP status code with a JSON response body.
3. WHEN an API request fails due to a client error, THE System SHALL return the appropriate 4xx HTTP status code with a JSON error body containing a descriptive `message` field.
4. WHEN an unhandled server error occurs, THE System SHALL return an HTTP 500 response with a generic error message and log the full error details server-side.
5. THE Validator SHALL validate all incoming API request bodies and return HTTP 422 with field-level error details when validation fails.

---

### Requirement 10: Data Export (Bonus)

**User Story:** As an Admin or Principal, I want to export event and registration data, so that I can use it in reports outside the platform.

#### Acceptance Criteria

1. WHERE the Report_Service is enabled, WHEN an Admin or Principal requests a CSV export of registrations for an Event, THE Report_Service SHALL generate and return a valid CSV file containing student name, email, and registration date.
2. WHERE the Report_Service is enabled, WHEN an Admin or Principal requests a PDF export, THE Report_Service SHALL generate and return a formatted PDF report of the selected Event's registration data.

---

### Requirement 11: Real-Time Updates (Bonus)

**User Story:** As a Student or Admin, I want to see live updates to event data, so that I always have the most current information without refreshing.

#### Acceptance Criteria

1. WHERE Socket.io is enabled, WHEN a new Event is created or updated by an Admin, THE System SHALL push the updated Event data to all connected Student clients in real time.
2. WHERE Socket.io is enabled, WHEN a new Registration is created, THE System SHALL push the updated registration count to all connected Admin clients viewing that Event's analytics in real time.
