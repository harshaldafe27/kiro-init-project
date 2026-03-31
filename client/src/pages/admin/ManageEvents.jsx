import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminEventsApi, deleteEventApi, togglePublishApi } from '../../api/event.api';
import { formatDate } from '../../utils/formatDate';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import EventForm from '../../components/admin/EventForm';
import { useToast } from '../../hooks/useToast';
import { Link } from 'react-router-dom';

export default function ManageEvents() {
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const toast = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => getAdminEventsApi({ limit: 50 }).then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEventApi,
    onSuccess: () => { toast.success('Event deleted'); qc.invalidateQueries(['admin-events']); },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const publishMutation = useMutation({
    mutationFn: togglePublishApi,
    onSuccess: () => { toast.success('Publish status updated'); qc.invalidateQueries(['admin-events']); },
  });

  const handleEdit = (event) => { setEditEvent(event); setShowForm(true); };
  const handleClose = () => { setShowForm(false); setEditEvent(null); };

  if (isLoading) return <Loader />;
  const events = data?.events || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Events</h2>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
          + Create Event
        </button>
      </div>

      {events.length === 0 ? <EmptyState message="No events yet. Create your first event!" /> : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <tr>{['Title', 'Date', 'Venue', 'Capacity', 'Fee', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {events.map((event) => (
                  <tr key={event._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{event.title}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatDate(event.date)}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{event.venue}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{event.registeredCount}/{event.capacity}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{event.fee > 0 ? `₹${event.fee}` : 'Free'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => publishMutation.mutate(event._id)}
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${event.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {event.isPublished ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(event)} className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs">Edit</button>
                        <Link to={`/admin/events/${event._id}/registrants`} className="text-purple-600 dark:text-purple-400 hover:underline text-xs">Registrants</Link>
                        <button onClick={() => deleteMutation.mutate(event._id)} className="text-red-500 hover:underline text-xs">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={showForm} onClose={handleClose} title={editEvent ? 'Edit Event' : 'Create Event'}>
        <EventForm event={editEvent} onSuccess={handleClose} />
      </Modal>
    </div>
  );
}
