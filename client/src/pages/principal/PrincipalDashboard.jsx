import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getPlatformStatsApi } from '../../api/analytics.api';
import Loader from '../../components/common/Loader';
import ErrorState from '../../components/common/ErrorState';

export default function PrincipalDashboard() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => getPlatformStatsApi().then((r) => r.data.data),
  });

  if (isLoading) return <Loader />;
  if (isError) return <ErrorState onRetry={refetch} />;

  const { totalEvents = 0, totalRegistrations = 0, totalRevenue = 0, activeAdmins = 0, categoryBreakdown = {} } = data || {};
  const catData = Object.entries(categoryBreakdown).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Principal Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: totalEvents, icon: '🎯' },
          { label: 'Total Registrations', value: totalRegistrations, icon: '👥' },
          { label: 'Total Revenue', value: `₹${totalRevenue}`, icon: '💰' },
          { label: 'Active Admins', value: activeAdmins, icon: '👨‍💼' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{kpi.value}</p>
              </div>
              <span className="text-3xl">{kpi.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Events by Category</h3>
        {catData.length === 0 ? <p className="text-gray-400 text-sm text-center py-8">No data yet</p> : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={catData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
