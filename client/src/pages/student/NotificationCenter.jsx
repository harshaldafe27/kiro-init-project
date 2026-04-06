import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyNotificationsApi, markAsReadApi, markAllAsReadApi } from '../../api/notification.api';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { useToast } from '../../hooks/useToast';

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_ICON = {
  event_reminder: '📅',
  registration_confirmed: '✅',
  event_cancelled: '❌',
  announcement: '📢',
  general: '🔔',
};

export default function NotificationCenter() {
  const toast = useToast();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => getMyNotificationsApi({ page, limit: 20 }).then((r) => r.data),
    keepPreviousData: true,
  });

  const markOneMutation = useMutation({
    mutationFn: markAsReadApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notif-unread-count'] });
    },
    onError: () => toast.error('Failed to mark as read'),
  });

  const markAllMutation = useMutation({
    mutationFn: markAllAsReadApi,
    onSuccess: () => {
      toast.success('All notifications marked as read');
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notif-unread-count'] });
    },
    onError: () => toast.error('Failed to mark all as read'),
  });

  const notifications = data?.notifications ?? [];
  const totalPages = data?.pages ?? 1;

  const handlePageChange = (p) => {
    setSearchParams({ page: String(p) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMarkOne = (n) => {
    if (n.isRead) return;
    markOneMutation.mutate(n._id);
  };

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h2>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
          >
            {markAllMutation.isPending ? 'Marking…' : 'Mark all as read'}
          </button>
        )}
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <EmptyState message="You have no notifications" />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleMarkOne(n)}
              className={`flex gap-3 px-5 py-4 transition-colors cursor-pointer
                ${!n.isRead
                  ? 'border-l-4 border-indigo-500 bg-indigo-50/60 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                  : 'border-l-4 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
            >
              <span className="text-xl mt-0.5 shrink-0">
                {TYPE_ICON[n.type] ?? '🔔'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold leading-snug ${!n.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {n.title}
                  </p>
                  {!n.isRead && (
                    <span className="shrink-0 w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                  {n.message}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {relativeTime(n.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} pages={totalPages} onChange={handlePageChange} />
    </div>
  );
}
