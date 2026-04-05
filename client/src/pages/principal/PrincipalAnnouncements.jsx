import { useQuery } from '@tanstack/react-query';
import { getAllAnnouncementsApi } from '../../api/notification.api';
import { formatDate } from '../../utils/formatDate';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

export default function PrincipalAnnouncements() {
  const { data, isLoading } = useQuery({
    queryKey: ['all-announcements'],
    queryFn: () => getAllAnnouncementsApi().then((r) => r.data.data),
  });

  if (isLoading) return <Loader />;
  const announcements = data?.announcements || [];

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h2>
      {announcements.length === 0 ? (
        <EmptyState message="No announcements found" />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <tr>
                  {['Title', 'Sender', 'Audience', 'Recipients', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {announcements.map((a) => (
                  <tr key={a._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{a.title}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{a.sender?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 capitalize">{a.audience || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{a.recipientCount ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatDate(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
