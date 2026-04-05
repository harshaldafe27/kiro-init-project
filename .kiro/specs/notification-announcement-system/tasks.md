# Implementation Plan: Notification / Announcement System

## Overview

Implement the full notification and announcement system for EventFlex, covering backend Firestore helpers, API routes and controller, frontend API client, UI components, and access control — following the existing patterns in the codebase.

## Tasks

- [x] 1. Extend `db.js` with Announcements and Notifications Firestore helpers
  - Add `Announcements` helper with `create`, `findBySender`, `findAll`, `findById`, `delete`
  - Add `Notifications` helper with `create`, `createBatch`, `findByRecipient`, `countUnread`, `markRead`, `markAllRead`, `deleteByAnnouncement`, `nullifyEventId`
  - _Requirements: 3.1, 3.4_

- [x] 2. Implement `notification.controller.js`
  - [x] 2.1 Implement `createAnnouncement`
    - Validate title (1–100 chars) and message (1–1000 chars); return 422 on failure
    - Require `eventId` when `audienceType === 'event_registrants'`; return 422 if missing
    - Resolve recipient IDs (all students or event registrants), batch-create Notification docs, create Announcement doc
    - Return `{ announcement, recipientCount }`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 2.2 Write property test for `createAnnouncement` fan-out completeness
    - **Property 1: Announcement fan-out completeness**
    - **Validates: Requirements 1.6**

  - [ ]* 2.3 Write property test for notification field completeness
    - **Property 2: Notification field completeness**
    - **Validates: Requirements 1.7, 3.1**

  - [ ]* 2.4 Write property test for input validation boundary
    - **Property 3: Input validation rejects out-of-range inputs**
    - **Validates: Requirements 1.2, 1.3**

  - [x] 2.5 Implement `getMyAnnouncements`, `getAllAnnouncements`, `deleteAnnouncement`
    - `getMyAnnouncements`: return announcements where `senderId === req.user._id`, descending
    - `getAllAnnouncements`: return all announcements with `senderName`, descending (principal)
    - `deleteAnnouncement`: verify ownership (403 if not owner), delete all associated Notification docs, then delete Announcement doc
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 6.1, 6.3_

  - [ ]* 2.6 Write property test for announcement data completeness
    - **Property 9: Announcement data completeness**
    - **Validates: Requirements 4.2, 5.2**

  - [ ]* 2.7 Write property test for cascade delete completeness
    - **Property 7: Cascade delete completeness**
    - **Validates: Requirements 4.4**

  - [x] 2.8 Implement `getMyNotifications`, `getUnreadCount`, `markAsRead`, `markAllAsRead`
    - `getMyNotifications`: paginated fetch where `recipientId === req.user._id`, descending; default page size 20
    - `getUnreadCount`: count where `recipientId === req.user._id AND isRead === false`
    - `markAsRead`: verify `recipientId === req.user._id` (403 if not), set `isRead = true`
    - `markAllAsRead`: batch update all unread notifications for `req.user._id`
    - _Requirements: 2.1, 2.4, 2.6, 2.7, 3.2, 3.4, 6.2, 6.4_

  - [ ]* 2.9 Write property test for unread count accuracy
    - **Property 4: Unread count accuracy**
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 2.10 Write property test for notification ordering invariant
    - **Property 5: Notification ordering invariant**
    - **Validates: Requirements 2.4, 4.1, 5.1**

  - [ ]* 2.11 Write property test for mark-as-read transition
    - **Property 6: Mark-as-read transition**
    - **Validates: Requirements 2.6, 2.7**

  - [ ]* 2.12 Write property test for recipient data isolation
    - **Property 8: Recipient data isolation**
    - **Validates: Requirements 6.2, 6.4**

- [x] 3. Create notification routes and wire into Express app
  - Create `server/routes/notification.routes.js` with all 8 endpoints and role middleware guards (`requireAdmin`, `requireStudent`, `requirePrincipal`)
  - Mount router at `/api/v1/notifications` in `server/app.js`
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 4. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create `notification.api.js` on the client
  - Implement all 8 API functions: `createAnnouncement`, `getMyAnnouncements`, `getAllAnnouncements`, `deleteAnnouncement`, `getMyNotifications`, `getUnreadCount`, `markAsRead`, `markAllAsRead`
  - Use the existing `axiosInstance`
  - _Requirements: 1.1, 2.1, 2.6, 2.7, 4.1, 4.4, 5.1_

- [x] 6. Implement `NotificationBell` component and integrate into `Navbar.jsx`
  - Create `client/src/components/common/NotificationBell.jsx`
  - Poll `getUnreadCount` on mount and on window focus; show red badge when `unreadCount > 0`
  - On click: open dropdown fetching the 10 most recent notifications (title, truncated preview ≤80 chars, relative time)
  - Include "View all" link to `/student/notifications`
  - Render `NotificationBell` inside `Navbar.jsx` for the student role only
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 7. Implement `NotificationCenter` page
  - Create `client/src/pages/student/NotificationCenter.jsx` at route `/student/notifications`
  - Paginated list (20/page) of all notifications, ordered by `createdAt` descending
  - Visually distinguish unread (e.g. indigo left border + lighter background) from read
  - Click a notification to call `markAsRead` and update visual state inline
  - "Mark all as read" button calls `markAllAsRead` and resets unread badge
  - _Requirements: 2.4, 2.5, 2.6, 2.7, 3.2_

  - [ ]* 7.1 Write unit tests for `NotificationCenter`
    - Test unread/read visual distinction renders correctly
    - Test "Mark all as read" triggers API call and updates state
    - _Requirements: 2.5, 2.6, 2.7_

- [x] 8. Implement `AnnouncementsPage` for admin
  - Create `client/src/pages/admin/AnnouncementsPage.jsx` at route `/admin/announcements`
  - Form: title input, message textarea, audience radio (`all_students` / `event_registrants`), event selector (shown only when `event_registrants` selected)
  - Show inline field-level validation errors for title/message length violations
  - History table: title, audience, event title (if any), recipient count, creation date, delete button
  - Delete button opens confirmation modal before calling `deleteAnnouncement`; show loading spinner during mutation
  - _Requirements: 1.1, 1.4, 1.5, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 8.1 Write unit tests for `AnnouncementsPage`
    - Test confirmation modal appears before delete executes
    - Test event selector is shown/hidden based on audience selection
    - _Requirements: 1.4, 1.5, 4.5_

- [x] 9. Implement `PrincipalAnnouncements` page
  - Create `client/src/pages/principal/PrincipalAnnouncements.jsx` at route `/principal/announcements`
  - Read-only table: title, sender name, audience, recipient count, creation date
  - No create, edit, or delete controls rendered
  - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 9.1 Write unit test for `PrincipalAnnouncements`
    - Verify no create/edit/delete buttons are rendered
    - _Requirements: 5.3_

- [x] 10. Add `nullifyEventId` hook to event deletion flow
  - In the existing event delete handler (`event.controller.js`), call `Notifications.nullifyEventId(eventId)` after the event is removed
  - _Requirements: 3.3_

  - [ ]* 10.1 Write property test for event deletion preserving notifications
    - **Property 10: Event deletion preserves notifications**
    - **Validates: Requirements 3.3**

- [x] 11. Register new routes in the client router
  - Add `/student/notifications` → `NotificationCenter`
  - Add `/admin/announcements` → `AnnouncementsPage`
  - Add `/principal/announcements` → `PrincipalAnnouncements`
  - _Requirements: 2.4, 4.1, 5.1_

- [ ] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use **fast-check** (minimum 100 iterations each)
- Each property task references the property number and requirement clause from the design document
- Checkpoints ensure incremental validation before moving to the next phase
