import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getEventAnalyticsApi } from '../../api/analytics.api';
import { exportRegistrantsCSVApi } from '../../api/event.api';
import { useToast } from '../../hooks/useToast';
import Loader from '../../components/common/Loader';
import ErrorState from '../../components/common/ErrorState';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { ArrowLeft } from 'lucide-react';

export default function EventAnalyticsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['event-analytics', id],
    queryFn: () => getEventAnalyticsApi(id).then((r) => r.data.data),
  });

  const handleExportCSV = async () => {
    try {
      const response = await exportRegistrantsCSVApi(id);
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registrants-${id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed');
    }
  };

  if (isLoading) return <Loader />;
  if (isError) return <ErrorState onRetry={refetch} />;

  const { totalRegistrations = 0, totalRevenue = 0, registrationSeries = [] } = data || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/events')}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Back to Events"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Event Analytics</h2>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Registrations</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalRegistrations}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">₹{totalRevenue}</p>
        </div>
      </div>

      {/* Registration Series Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Registrations Over Time</h3>
        {registrationSeries.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-sm">
            No registration data available yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={registrationSeries} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" label={{ value: 'Date', position: 'insideBottom', offset: -2 }} tick={{ fontSize: 12 }} />
              <YAxis label={{ value: 'Registrations', angle: -90, position: 'insideLeft', offset: 10 }} tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
