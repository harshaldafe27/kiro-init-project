import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRegistrantsApi } from '../../api/event.api';
import { formatDate } from '../../utils/formatDate';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

export default function EventRegistrants() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['registrants', id],
    queryFn: () => getRegistrantsApi(id).then((r) => r.data.data),
  });

  const handleExportCSV = () => {
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/export/event/${id}/csv`, '_blank');
  };

  if (isLoading) return <Loader />;
  const regs = data?.registrations || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Event Registrants</h2>
        <button onClick={handleExportCSV} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors">
          Export CSV
        </button>
      </div>
      {regs.length === 0 ? <EmptyState message="No registrations yet" /> : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <tr>{['Name', 'Email', 'College', 'Status', 'Registered At'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {regs.map((reg) => (
                  <tr key={reg._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{reg.student?.name}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{reg.student?.email}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{reg.student?.college || '—'}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${reg.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{reg.status}</span></td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatDate(reg.registeredAt)}</td>
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
