# Implementation Plan: Participation Certificate

## Overview

Implement the participation certificate feature across three layers: data model additions, backend API (mark-complete, distribute, download), and frontend UI changes to ManageEvents and MyRegistrations. Certificates are generated on-demand with pdf-lib — no storage required.

## Tasks

- [x] 1. Add data model helpers for new fields
  - Add `Events.markComplete(id)` to `server/config/db.js` — sets `isCompleted=true`, `completedAt=ISO string`
  - Add `Events.setCertificatesDistributed(id)` to `server/config/db.js` — sets `certificatesDistributed=true`
  - Add `Registrations.findConfirmedByEvent(eventId)` to `server/config/db.js` — queries where `event=eventId AND status='confirmed'`
  - Add `Registrations.setCertificateAvailable(ids)` to `server/config/db.js` — batch update `certificateAvailable=true`
  - _Requirements: 1.2, 2.3, 3.1_

- [x] 2. Implement PDF generation utility
  - [x] 2.1 Create `server/utils/generateCertificate.js`
    - Accept `{ participantName, eventName, eventDate }` and return `Uint8Array`
    - Create landscape A4 PDFDocument (842×595 pt) using pdf-lib
    - Embed HelveticaBold and Helvetica standard fonts
    - Draw decorative border, title "Certificate of Participation", participant name, event name, and formatted date
    - _Requirements: 3.2, 4.1, 4.2, 4.4, 4.5_

  - [ ]* 2.2 Write property test for generateCertificate — Property 6: Generated PDF contains required content fields
    - **Property 6: Generated PDF contains required content fields**
    - Use fast-check to generate random `participantName`, `eventName`, `eventDate` combinations
    - Verify all three values appear as readable text in the returned PDF bytes
    - **Validates: Requirements 3.2, 4.1**

  - [ ]* 2.3 Write property test for generateCertificate — Property 7: Generated PDF is landscape A4
    - **Property 7: Generated PDF is landscape A4**
    - Use fast-check with any valid certificate input; parse resulting PDF and verify page dimensions are 842×595 pt
    - **Validates: Requirements 4.2**

  - [ ]* 2.4 Write property test for generateCertificate — Property 8: Generated PDF is a valid PDF document
    - **Property 8: Generated PDF is a valid PDF document**
    - Use fast-check with any valid certificate input; verify returned bytes start with `%PDF-`
    - **Validates: Requirements 4.5**

  - [ ]* 2.5 Write unit tests for generateCertificate
    - Returns bytes starting with `%PDF-`
    - Returned buffer is non-empty
    - Falls back to `user.name` when `participantDetails.name` is absent
    - _Requirements: 4.1, 4.3_

- [x] 3. Implement markEventComplete in event controller
  - [x] 3.1 Add `markEventComplete(req, res)` to `server/controllers/event.controller.js`
    - Fetch event by `req.params.id`; return 404 if not found
    - Return 403 if `event.createdBy !== req.user._id`
    - Return 400 with `"Event is already marked as completed"` if `event.isCompleted === true`
    - Call `Events.markComplete(id)`; return updated event
    - _Requirements: 1.2, 1.4_

  - [ ]* 3.2 Write property test for markEventComplete — Property 1: Mark-complete is a one-way transition
    - **Property 1: Mark-complete is a one-way transition**
    - Use fast-check to generate already-completed events; verify endpoint returns 4xx and `completedAt` is unchanged
    - **Validates: Requirements 1.4**

  - [ ]* 3.3 Write unit tests for markEventComplete
    - Returns 400 when event is already completed
    - Returns 403 when caller is not the event creator
    - Returns 404 when event not found
    - _Requirements: 1.2, 1.4_

- [x] 4. Implement certificate controller
  - [x] 4.1 Create `server/controllers/certificate.controller.js` with `distributeCertificates(req, res)`
    - Fetch event by `req.params.eventId`; return 404 if not found
    - Return 400 if `!event.isCompleted`
    - Return 409 if `event.certificatesDistributed === true`
    - Fetch confirmed registrations via `Registrations.findConfirmedByEvent`
    - If none: return 200 with `"No eligible registrants found"`
    - Batch update `certificateAvailable=true` on all confirmed registrations
    - Build and call `Notifications.createBatch` with one notification per registrant (title: "Certificate Available", message includes event name)
    - Call `Events.setCertificatesDistributed(eventId)`
    - Return `{ distributed: count }`
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 5.1, 5.2, 5.4_

  - [ ]* 4.2 Write property test for distributeCertificates — Property 2: Distribution targets only confirmed registrations
    - **Property 2: Distribution targets only confirmed registrations**
    - Use fast-check to generate registration arrays with mixed statuses; after distribute, verify `certificateAvailable` is `true` only on confirmed registrations
    - **Validates: Requirements 2.3**

  - [ ]* 4.3 Write property test for distributeCertificates — Property 3: Notification fan-out matches confirmed registrant count
    - **Property 3: Notification fan-out matches confirmed registrant count**
    - Use fast-check to generate random counts of confirmed registrants (0–50); verify notification count equals confirmed count exactly
    - **Validates: Requirements 2.4, 5.4**

  - [ ]* 4.4 Write property test for distributeCertificates — Property 4: Distribution is idempotency-guarded
    - **Property 4: Distribution is idempotency-guarded**
    - Use fast-check to generate events with `certificatesDistributed=true`; verify distribute returns 4xx and no new notifications or registration updates occur
    - **Validates: Requirements 2.6**

  - [ ]* 4.5 Write property test for distributeCertificates — Property 10: Notification content correctness
    - **Property 10: Notification content correctness**
    - Use fast-check to generate random event names; verify every created notification has `title === "Certificate Available"` and `message` contains the event name
    - **Validates: Requirements 5.2**

  - [ ]* 4.6 Write unit tests for distributeCertificates
    - Returns 400 when event is not completed
    - Returns 409 when certificates already distributed
    - Returns 200 with "No eligible registrants" message when none exist
    - Returns 403 when called without admin role
    - _Requirements: 2.3, 2.5, 2.6, 6.1_

  - [x] 4.7 Add `downloadCertificate(req, res)` to `server/controllers/certificate.controller.js`
    - Fetch registration by `req.params.registrationId`; return 404 if not found
    - Return 403 if `registration.student !== req.user._id`
    - Return 403 if `!registration.certificateAvailable`
    - Fetch event and user records; resolve name via `participantDetails?.name || user.name`
    - Call `generateCertificate({ participantName, eventName, eventDate })`
    - Set `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="certificate.pdf"` headers
    - Send PDF bytes via `res.end(pdfBytes)`
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 4.3, 6.2, 6.3_

  - [ ]* 4.8 Write property test for downloadCertificate — Property 9: Ownership and availability gate on download
    - **Property 9: Ownership and availability gate on download**
    - Use fast-check to generate mismatched user/registration pairs and registrations with `certificateAvailable=false`; verify 403 is returned and PDF generation is not called
    - **Validates: Requirements 3.5, 3.6, 6.2**

  - [ ]* 4.9 Write unit tests for downloadCertificate
    - Returns 403 when `certificateAvailable` is false
    - Returns 403 when student ID does not match registration owner
    - Returns 401 when no token is provided
    - Returns correct `Content-Type` and `Content-Disposition` headers on success
    - _Requirements: 3.3, 3.5, 3.6, 6.2, 6.3_

- [x] 5. Create certificate routes and wire into app
  - Create `server/routes/certificate.routes.js` with:
    - `PATCH /api/v1/events/:id/complete` → `protect + authorize('admin')` → `markEventComplete`
    - `POST /api/v1/certificates/distribute/:eventId` → `protect + authorize('admin')` → `distributeCertificates`
    - `GET /api/v1/certificates/download/:registrationId` → `protect` → `downloadCertificate`
  - Register certificate routes in `server/app.js`
  - _Requirements: 1.1, 2.1, 3.1, 6.1, 6.3, 6.4_

- [ ] 6. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Create frontend certificate API module
  - Create `client/src/api/certificate.api.js`
  - `markCompleteApi(eventId)` — `PATCH /api/v1/events/:id/complete`
  - `distributeApi(eventId)` — `POST /api/v1/certificates/distribute/:eventId`
  - `downloadCertificateApi(registrationId)` — `GET /api/v1/certificates/download/:registrationId`, returns blob
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 8. Update ManageEvents.jsx with admin certificate actions
  - [x] 8.1 Add "Mark as Completed" button and "Completed" status badge
    - Show "Mark as Completed" button when `!event.isCompleted && !event.isCancelled && event.isPublished`
    - Wire to `markCompleteApi` via `useMutation`; on success invalidate `['admin-events']`
    - Show "Completed" status badge in Status column when `event.isCompleted`
    - Disable Edit and Toggle Publish buttons when `event.isCompleted`
    - _Requirements: 1.1, 1.3, 1.5_

  - [x] 8.2 Add "Distribute Certificates" button with confirmation modal
    - Show "Distribute Certificates" button when `event.isCompleted && !event.certificatesDistributed`
    - Show disabled "Certificates Distributed" badge when `event.certificatesDistributed`
    - On click: open confirmation modal using existing `Modal` component before calling `distributeApi`
    - Wire to `distributeApi` via `useMutation`; show loading spinner during `isPending`; on error call `toast.error`
    - On success invalidate `['admin-events']`
    - _Requirements: 2.1, 2.2, 2.7_

  - [ ]* 8.3 Write unit tests for ManageEvents certificate UI
    - "Mark as Completed" button visible for published, non-cancelled, non-completed events
    - Edit and Toggle Publish buttons disabled for completed events
    - "Distribute Certificates" button visible only when `isCompleted && !certificatesDistributed`
    - _Requirements: 1.1, 1.3, 1.5, 2.1, 2.7_

  - [ ]* 8.4 Write property test for ManageEvents — Property 1 (UI side): Mark-complete is a one-way transition
    - **Property 1 (UI): Mark-complete is a one-way transition**
    - Use fast-check to generate event objects with `isCompleted=true`; verify "Mark as Completed" button is never rendered
    - **Validates: Requirements 1.4**

- [x] 9. Update MyRegistrations.jsx with student download button
  - [x] 9.1 Add "Download Certificate" button to registration cards
    - Render button only when `reg.certificateAvailable === true && reg.status === 'confirmed'`
    - On click: call `downloadCertificateApi(reg._id)`, receive blob, create object URL, trigger `<a download>` click, revoke URL
    - Show loading state while blob is being fetched; on error call `toast.error`
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 9.2 Write property test for MyRegistrations — Property 5: Certificate download button visibility invariant
    - **Property 5: Certificate download button visibility invariant**
    - Use fast-check to generate registration objects with all combinations of `certificateAvailable` and `status`; verify button appears if and only if both conditions are true
    - **Validates: Requirements 3.1**

  - [ ]* 9.3 Write unit tests for MyRegistrations download button
    - "Download Certificate" button visible only when `certificateAvailable && status === 'confirmed'`
    - Button not visible when `certificateAvailable=false` or `status !== 'confirmed'`
    - _Requirements: 3.1_

- [ ] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check (minimum 100 iterations each), consistent with the notification-announcement-system spec
- The `Notifications.createBatch` helper is provided by the notification-announcement-system spec; import it from that module
- pdf-lib must be added to `server/package.json` dependencies before implementing task 2
