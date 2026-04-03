import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { getAdminEventsApi, deleteEventApi, togglePublishApi } from '../../api/event.api';
import { formatDate } from '../../utils/formatDate';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { useToast } from '../../hooks/useToast';
import { Plus, Pencil, Users, Trash2, Eye, EyeOff } from 'lucide-react';

export default function ManageEvents() {
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => getAdminEventsApi({ limit: 50 }).then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEventApi,
    onSuccess: () => {
      toast.success('Event deleted');
      qc.invalidateQueries({ queryKey: ['admin-events'] });
      qc.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const publishMutation = useMutation({
    mutationFn: togglePublishApi,
    onSuccess: () => {
      toast.success('Publish status updated');
      qc.invalidateQueries({ queryKey: ['admin-events'] });
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });

  if (isLoading) return <Loader />;
  const events = data?.events || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Events</h2>
        <button
          onClick={() => navigate('/admin/events/create')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Create Event
        </button>
      </div>

      {events.length === 0 ? (
        <EmptyState message="No events yet. Create your first event!" />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <tr>
                  {['Title', 'Date', 'Venue', 'Capacity', 'Fee', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {events.map((event) => (
                  <tr key={event._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-[180px] truncate">{event.title}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(event.date)}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[120px] truncate">{event.venue}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{event.registeredCount}/{event.capacity}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{event.fee > 0 ? `₹${event.fee}` : 'Free'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => publishMutation.mutate(event._id)}
                        className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                          event.isPublished
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {event.isPublished ? <Eye size={11} /> : <EyeOff size={11} />}
                        {event.isPublished ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/events/${event._id}/edit`)}
                          className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <Link
                          to={`/admin/events/${event._id}/registrants`}
                          className="p-1.5 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                          title="Registrants"
                        >
                          <Users size={14} />
                        </Link>
                        <button
                          onClick={() => deleteMutation.mutate(event._id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
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
