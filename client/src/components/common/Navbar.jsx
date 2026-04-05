import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import useStore from '../../store/useStore';

const roleBadge = { student: 'bg-blue-100 text-blue-700', admin: 'bg-purple-100 text-purple-700', principal: 'bg-amber-100 text-amber-700' };

export default function Navbar({ title }) {
  const user = useStore((s) => s.user);
  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="text-base font-semibold text-gray-800 dark:text-white">{title}</h1>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {user?.role === 'student' && <NotificationBell />}
        {user && (
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${roleBadge[user.role] || 'bg-gray-100 text-gray-600'}`}>{user.role}</span>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:block">{user.name}</span>
          </div>
        )}
      </div>
    </header>
  );
}
