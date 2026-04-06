# Requirements Document

## Introduction

The Participation Certificate feature enables EventFlex admins to distribute digital participation certificates to all confirmed registrants of a completed event. Certificates are generated as PDFs on-demand (no storage) and made available for download from the student's My Registrations page. Students are notified via the existing notification system when certificates become available.

## Glossary

- **Certificate_Service**: The backend service responsible for generating PDF certificates on request.
- **Certificate**: A PDF document containing a student's name, event name, and event date, issued as proof of participation.
- **Admin**: A user with the `admin` role who manages events and triggers certificate distribution.
- **Student**: A user with the `student` role who participated in an event and can download their certificate.
- **Completed_Event**: An event that an Admin has explicitly marked as completed via the `isCompleted` status flag.
- **Confirmed_Registrant**: A student whose Registration record has `status` equal to `confirmed`.
- **Certificate_Available**: A boolean flag on a Registration record indicating that the Admin has distributed certificates for that event.
- **Notification_Service**: The existing backend service used to deliver in-app notifications to students.
- **My_Registrations**: The student-facing page listing all of the student's event registrations.

---

## Requirements

### Requirement 1: Mark Event as Completed

**User Story:** As an Admin, I want to mark an event as completed, so that I can signal that the event has concluded and enable certificate distribution.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a "Mark as Completed" action for each published, non-cancelled event in the Manage Events view.
2. WHEN an Admin marks an event as completed, THE Event_Service SHALL set the `isCompleted` flag to `true` on the Event record and record the timestamp.
3. WHEN an event is marked as completed, THE Admin_Panel SHALL visually distinguish it from active and draft events using a "Completed" status badge.
4. IF an Admin attempts to mark an already-completed event as completed again, THEN THE Event_Service SHALL reject the request with a descriptive error message.
5. WHILE an event is marked as completed, THE Admin_Panel SHALL disable the "Edit Event" and "Toggle Publish" actions for that event.

---

### Requirement 2: Distribute Certificates

**User Story:** As an Admin, I want to distribute certificates to all confirmed registrants of a completed event, so that students can download proof of their participation.

#### Acceptance Criteria

1. WHEN an event is marked as completed, THE Admin_Panel SHALL display a "Distribute Certificates" button for that event.
2. WHEN an Admin clicks "Distribute Certificates", THE Admin_Panel SHALL display a confirmation prompt before proceeding.
3. WHEN an Admin confirms certificate distribution, THE Certificate_Service SHALL set the `certificateAvailable` flag to `true` on all Registration records where `event` matches the event ID and `status` is `confirmed`.
4. WHEN certificate distribution is triggered, THE Notification_Service SHALL create a Notification for each Confirmed_Registrant with the title "Certificate Available" and a message indicating the event name.
5. IF an event has zero confirmed registrants at the time of distribution, THEN THE Certificate_Service SHALL return a descriptive message indicating no eligible registrants were found and SHALL NOT trigger any notifications.
6. IF an Admin attempts to distribute certificates for an event that has already had certificates distributed, THEN THE Certificate_Service SHALL reject the request with a descriptive error message.
7. WHEN certificate distribution completes successfully, THE Admin_Panel SHALL update the "Distribute Certificates" button to a disabled "Certificates Distributed" state.

---

### Requirement 3: Download Certificate (Student)

**User Story:** As a Student, I want to download my participation certificate from My Registrations, so that I have a PDF record of my event participation.

#### Acceptance Criteria

1. WHEN a Student views My_Registrations, THE My_Registrations SHALL display a "Download Certificate" button on registration cards where `certificateAvailable` is `true` and `status` is `confirmed`.
2. WHEN a Student clicks "Download Certificate", THE Certificate_Service SHALL generate a PDF certificate containing the student's name, the event name, and the event date.
3. WHEN the PDF is generated, THE Certificate_Service SHALL return it as a binary response with `Content-Type: application/pdf` and `Content-Disposition: attachment` headers so the browser initiates a file download.
4. THE Certificate_Service SHALL NOT persist the generated PDF to any storage system; each download SHALL generate the PDF fresh from the Registration and Event data.
5. IF the Registration record does not have `certificateAvailable` set to `true`, THEN THE Certificate_Service SHALL reject the download request with an HTTP 403 response.
6. IF the authenticated Student's user ID does not match the `student` field on the Registration record, THEN THE Certificate_Service SHALL reject the request with an HTTP 403 response.

---

### Requirement 4: Certificate Content and Format

**User Story:** As a Student, I want my certificate to look professional and contain accurate information, so that it is meaningful as a participation record.

#### Acceptance Criteria

1. THE Certificate_Service SHALL include the following fields on every generated certificate: participant name, event name, and event date formatted as a human-readable string (e.g., "15 January 2025").
2. THE Certificate_Service SHALL render the certificate in landscape A4 dimensions (842 × 595 points).
3. THE Certificate_Service SHALL use the participant's name from `participantDetails.name` on the Registration record; IF `participantDetails.name` is absent, THEN THE Certificate_Service SHALL fall back to the Student's `name` field from the User record.
4. THE Certificate_Service SHALL generate the PDF using a server-side library (pdf-lib or pdfkit) without requiring any external rendering service.
5. THE generated PDF SHALL be a valid, openable PDF document conforming to the PDF 1.4 or later specification.

---

### Requirement 5: Notifications for Certificate Availability

**User Story:** As a Student, I want to receive a notification when my certificate is ready, so that I know when to visit My Registrations to download it.

#### Acceptance Criteria

1. WHEN the Certificate_Service successfully sets `certificateAvailable` to `true` on a Registration record, THE Notification_Service SHALL create a Notification record for the corresponding student.
2. THE Notification record SHALL have the title "Certificate Available" and a message body of the form: "Your participation certificate for [Event Name] is now available. Visit My Registrations to download it."
3. WHEN a Student views the Notification_Bell, THE Notification_Bell SHALL include certificate availability notifications in the unread count.
4. THE Notification_Service SHALL create one Notification per eligible Registration; duplicate notifications for the same Registration SHALL NOT be created.

---

### Requirement 6: Access Control

**User Story:** As a system operator, I want certificate endpoints to enforce role-based access, so that only authorized users can distribute or download certificates.

#### Acceptance Criteria

1. WHEN a request to distribute certificates is received without a valid Admin session token, THE Certificate_Service SHALL reject the request with an HTTP 403 response.
2. WHEN a Student requests a certificate download, THE Certificate_Service SHALL verify that the authenticated user's ID matches the `student` field on the target Registration record before generating the PDF.
3. IF an unauthenticated request is made to the certificate download endpoint, THEN THE Certificate_Service SHALL reject the request with an HTTP 401 response.
4. THE Certificate_Service SHALL NOT expose any certificate download endpoint that accepts a registration ID without requiring authentication.
