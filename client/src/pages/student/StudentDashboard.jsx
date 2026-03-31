import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getEventsApi } from '../../api/event.api';
import { getMyRegistrationsApi } from '../../api/registration.api';
import EventCard from '../../components/common/EventCard';
import Loader from '../../components/common/Loader';
import useStore from '../../store/useStore';

export default function StudentDashboard() {
  const user = useStore((s) => s.user);
  const { data: eventsData, isLoading: evLoading } = useQuery({
    queryKey: ['events', { limit: 6 }],
    queryFn: () => getEventsApi({ limit: 6 }).then((r) => r.data.data),
  });
  const { data: regsData } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => getMyRegistrationsApi().then((r) => r.data.data),
  });

  const registeredIds = new Set((regsData?.registrations || []).map((r) => r.event?._id));
  const upcoming = (eventsData?.events || []).filter((e) => new Date(e.date) > new Date());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back, {user?.name} 👋</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Here's what's happening on campus</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Events', value: eventsData?.meta?.total ?? '—', icon: '🎉', color: 'indigo' },
          { label: 'My Registrations', value: regsData?.registrations?.length ?? '—', icon: '📋', color: 'purple' },
          { label: 'Upcoming', value: upcoming.length, icon: '📅', color: 'amber' },
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

      {/* Recent events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Events</h3>
          <Link to="/student/events" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">View all →</Link>
        </div>
        {evLoading ? <Loader /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(eventsData?.events || []).map((event) => (
              <EventCard key={event._id} event={event} role="student" isRegistered={registeredIds.has(event._id)} onRegister={() => {}} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
