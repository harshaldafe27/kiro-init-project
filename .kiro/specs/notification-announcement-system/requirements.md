# Requirements Document

## Introduction

The Notification / Announcement System adds in-app messaging capabilities to EventFlex. Admins can compose and send announcements either to all students on the platform or to registrants of a specific event. Students receive these notifications in their dashboard and profile, with unread counts and the ability to mark notifications as read. The principal role has read-only visibility into announcements for oversight purposes.

## Glossary

- **Notification_Service**: The backend service responsible for creating, storing, and delivering notifications.
- **Notification**: A single message record stored in the database and associated with one or more recipient users.
- **Announcement**: A notification created by an Admin and broadcast to a defined audience (all students or event registrants).
- **Admin**: A user with the `admin` role who can create and send announcements.
- **Student**: A user with the `student` role who receives and reads notifications.
- **Principal**: A user with the `principal` role who can view announcements for oversight but cannot create them.
- **Notification_Bell**: The UI component in the Navbar that displays the unread notification count and a dropdown list of recent notifications.
- **Notification_Center**: The dedicated page or panel where a Student can view all notifications with full detail.
- **Audience**: The set of users targeted by an announcement — either `all_students` or `event_registrants`.
- **Event**: An existing event record in the EventFlex system.

---

## Requirements

### Requirement 1: Create and Send Announcements

**User Story:** As an Admin, I want to compose and send an announcement to a chosen audience, so that I can communicate important information to students efficiently.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a form to create an announcement with a title (1–100 characters) and a message body (1–1000 characters).
2. WHEN an Admin submits the announcement form, THE Notification_Service SHALL validate that both title and message body are non-empty before persisting the announcement.
3. IF the title exceeds 100 characters or the message body exceeds 1000 characters, THEN THE Notification_Service SHALL reject the request and return a descriptive validation error.
4. WHEN creating an announcement, THE Admin_Panel SHALL allow the Admin to select an audience of either `all_students` or `event_registrants` of a specific event.
5. WHERE the audience is `event_registrants`, THE Admin_Panel SHALL require the Admin to select a specific event from the list of existing events before submission.
6. WHEN an Admin submits a valid announcement, THE Notification_Service SHALL create individual Notification records for each recipient in the selected audience.
7. WHEN an announcement is sent, THE Notification_Service SHALL record the sender's user ID, the announcement title, message body, audience type, and the timestamp on each Notification record.

---

### Requirement 2: Receive and Display Notifications (Student)

**User Story:** As a Student, I want to see notifications sent to me in my dashboard and profile, so that I stay informed about announcements relevant to me.

#### Acceptance Criteria

1. WHEN a Student loads the application, THE Notification_Bell SHALL display the count of unread notifications for that Student.
2. WHILE a Student has unread notifications, THE Notification_Bell SHALL render a visible badge with the unread count.
3. WHEN a Student clicks the Notification_Bell, THE Notification_Bell SHALL display a dropdown listing the 10 most recent notifications with title, a truncated message preview (up to 80 characters), and the time elapsed since receipt.
4. WHEN a Student navigates to the Notification_Center, THE Notification_Service SHALL return all notifications for that Student ordered by creation date descending.
5. THE Notification_Center SHALL visually distinguish unread notifications from read notifications.
6. WHEN a Student clicks a notification, THE Notification_Service SHALL mark that notification as read and THE Notification_Center SHALL update its visual state accordingly.
7. WHEN a Student clicks "Mark all as read", THE Notification_Service SHALL mark all of that Student's unread notifications as read and THE Notification_Bell SHALL update the unread count to zero.

---

### Requirement 3: Notification Persistence and Data Integrity

**User Story:** As a Student, I want my notifications to persist across sessions, so that I do not miss announcements when I log back in.

#### Acceptance Criteria

1. THE Notification_Service SHALL store each Notification record in MongoDB with the fields: `recipientId`, `senderId`, `title`, `message`, `isRead`, `audienceType`, `eventId` (nullable), and `createdAt`.
2. WHEN a Student's session ends and the Student logs back in, THE Notification_Service SHALL return all previously unread notifications with their original `isRead` state preserved.
3. IF a referenced event is deleted, THEN THE Notification_Service SHALL retain the associated Notification records and set `eventId` to null on those records.
4. THE Notification_Service SHALL support paginated retrieval of notifications with a default page size of 20 records per page.

---

### Requirement 4: Admin Announcement Management

**User Story:** As an Admin, I want to view a history of announcements I have sent, so that I can track past communications.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide an Announcements page listing all announcements created by the Admin, ordered by creation date descending.
2. WHEN the Admin views the Announcements page, THE Notification_Service SHALL return each announcement's title, audience type, associated event title (if applicable), recipient count, and creation timestamp.
3. THE Admin_Panel SHALL display the total recipient count for each sent announcement.
4. WHEN an Admin deletes an announcement, THE Notification_Service SHALL remove the announcement record and all associated Notification records for that announcement.
5. IF an Admin attempts to delete an announcement, THEN THE Admin_Panel SHALL display a confirmation prompt before executing the deletion.

---

### Requirement 5: Principal Oversight

**User Story:** As a Principal, I want to view all announcements sent by Admins, so that I can oversee campus communications.

#### Acceptance Criteria

1. THE Principal_Dashboard SHALL provide a read-only view of all announcements sent by all Admins, ordered by creation date descending.
2. WHEN a Principal views the announcements list, THE Notification_Service SHALL return each announcement's title, sender name, audience type, recipient count, and creation timestamp.
3. THE Principal_Dashboard SHALL NOT provide controls to create, edit, or delete announcements.

---

### Requirement 6: Access Control

**User Story:** As a system operator, I want notification endpoints to enforce role-based access, so that only authorized users can create or read notifications.

#### Acceptance Criteria

1. WHEN a request to create an announcement is received without a valid Admin session token, THE Notification_Service SHALL reject the request with an HTTP 403 response.
2. WHEN a Student requests notifications, THE Notification_Service SHALL return only Notification records where `recipientId` matches the authenticated Student's user ID.
3. WHEN a Principal requests the announcements list, THE Notification_Service SHALL return announcement metadata without exposing individual recipient records.
4. IF a Student attempts to access another Student's notifications via a direct API call, THEN THE Notification_Service SHALL reject the request with an HTTP 403 response.
