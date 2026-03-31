import { useQuery } from '@tanstack/react-query';
import { getAdminActivityApi } from '../../api/analytics.api';
import { formatDateTime } from '../../utils/formatDate';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { usePagination } from '../../hooks/usePagination';

const actionColor = { CREATE_EVENT: 'bg-green-100 text-green-700', UPDATE_EVENT: 'bg-blue-100 text-blue-700', DELETE_EVENT: 'bg-red-100 text-red-600' };

export default function AdminActivity() {
  const { page, limit, setPage } = usePagination(15);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-activity', { page, limit }],
    queryFn: () => getAdminActivityApi({ page, limit }).then((r) => r.data.data),
  });

  if (isLoading) return <Loader />;
  const logs = data?.logs || [];

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Activity</h2>
      {logs.length === 0 ? <EmptyState message="No activity recorded yet" /> : (
        <>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  <tr>{['Admin', 'Action', 'Target', 'Time'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{log.actor?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${actionColor[log.action] || 'bg-gray-100 text-gray-500'}`}>{log.action}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{log.targetType} · {String(log.targetId).slice(-6)}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatDateTime(log.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={data.meta.page} pages={data.meta.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
