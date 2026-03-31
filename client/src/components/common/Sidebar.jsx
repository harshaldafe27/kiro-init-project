import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import useStore from '../../store/useStore';

const navItems = {
  student: [
    { to: '/student', label: 'Dashboard', icon: '🏠' },
    { to: '/student/events', label: 'Browse Events', icon: '🎉' },
    { to: '/student/registrations', label: 'My Registrations', icon: '📋' },
    { to: '/student/profile', label: 'Profile', icon: '👤' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: '📊' },
    { to: '/admin/events', label: 'Manage Events', icon: '🗂️' },
    { to: '/admin/profile', label: 'Profile', icon: '👤' },
  ],
  principal: [
    { to: '/principal', label: 'Dashboard', icon: '📈' },
    { to: '/principal/events', label: 'All Events', icon: '🎯' },
    { to: '/principal/activity', label: 'Admin Activity', icon: '🔍' },
  ],
};

export default function Sidebar({ role }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const clearAuth = useStore((s) => s.clearAuth);
  const items = navItems[role] || [];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-gray-800">
        <span className="text-2xl">⚡</span>
        {!collapsed && <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">EventFlex</span>}
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to.split('/').length === 2}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`
            }>
            <span className="text-base">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800">
        <button onClick={clearAuth}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <span>🚪</span>{!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className={`hidden md:flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
        <SidebarContent />
        <button onClick={() => setCollapsed(!collapsed)}
          className="absolute bottom-20 -right-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full p-1 shadow-sm hidden md:block">
          <span className="text-xs">{collapsed ? '→' : '←'}</span>
        </button>
      </aside>

      {/* Mobile toggle */}
      <button onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-100 dark:border-gray-800">
        ☰
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-white dark:bg-gray-900 h-full shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
