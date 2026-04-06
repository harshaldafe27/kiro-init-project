import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import DashboardLayout from '../layouts/DashboardLayout';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

import StudentDashboard from '../pages/student/StudentDashboard';
import EventBrowse from '../pages/student/EventBrowse';
import EventDetailPage from '../pages/student/EventDetailPage';
import MyRegistrations from '../pages/student/MyRegistrations';
import Profile from '../pages/student/Profile';
import NotificationCenter from '../pages/student/NotificationCenter';

import AdminDashboard from '../pages/admin/AdminDashboard';
import ManageEvents from '../pages/admin/ManageEvents';
import CreateEventPage from '../pages/admin/CreateEventPage';
import EventRegistrants from '../pages/admin/EventRegistrants';
import AnnouncementsPage from '../pages/admin/AnnouncementsPage';
import EventAnalyticsPage from '../pages/admin/EventAnalyticsPage';

import PrincipalDashboard from '../pages/principal/PrincipalDashboard';
import AllEvents from '../pages/principal/AllEvents';
import AdminActivity from '../pages/principal/AdminActivity';
import PrincipalAnnouncements from '../pages/principal/PrincipalAnnouncements';
import ApprovalRequests from '../pages/principal/ApprovalRequests';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Student routes */}
      <Route path="/student" element={<ProtectedRoute><RoleRoute role="student"><DashboardLayout title="Student Dashboard" /></RoleRoute></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="events" element={<EventBrowse />} />
        <Route path="events/:id" element={<EventDetailPage />} />
        <Route path="registrations" element={<MyRegistrations />} />
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<NotificationCenter />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute><RoleRoute role="admin"><DashboardLayout title="Admin Dashboard" /></RoleRoute></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="events" element={<ManageEvents />} />
        <Route path="events/create" element={<CreateEventPage />} />
        <Route path="events/:id/edit" element={<CreateEventPage />} />
        <Route path="events/:id/registrants" element={<EventRegistrants />} />
        <Route path="events/:id/analytics" element={<EventAnalyticsPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Principal routes */}
      <Route path="/principal" element={<ProtectedRoute><RoleRoute role="principal"><DashboardLayout title="Principal Dashboard" /></RoleRoute></ProtectedRoute>}>
        <Route index element={<PrincipalDashboard />} />
        <Route path="events" element={<AllEvents />} />
        <Route path="activity" element={<AdminActivity />} />
        <Route path="announcements" element={<PrincipalAnnouncements />} />
        <Route path="approvals" element={<ApprovalRequests />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
