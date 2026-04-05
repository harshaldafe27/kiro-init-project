import { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getUnreadCountApi, getMyNotificationsApi } from '../../api/notification.api';

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const { data: countData } = useQuery({
    queryKey: ['notif-unread-count'],
    queryFn: () => getUnreadCountApi().then((r) => r.data),
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const unreadCount = countData?.unreadCount ?? 0;

  const { data: notifData } = useQuery({
    queryKey: ['notif-recent'],
    queryFn: () => getMyNotificationsApi({ page: 1 }).then((r) => r.data),
    enabled: open,
  });

  const notifications = notifData?.notifications ?? [];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm font-semibold text-gray-800 dark:text-white">Notifications</span>
          </div>

          <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No notifications</li>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <li key={n._id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{n.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                    {n.message?.length > 80 ? n.message.slice(0, 80) + '…' : n.message}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{relativeTime(n.createdAt)}</p>
                </li>
              ))
            )}
          </ul>

          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 text-center">
            <Link
              to="/student/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
