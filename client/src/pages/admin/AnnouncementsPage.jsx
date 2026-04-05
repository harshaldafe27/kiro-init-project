import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Trash2, Send, Users, Calendar } from 'lucide-react';
import { createAnnouncementApi, getAllAnnouncementsApi, deleteAnnouncementApi } from '../../api/notification.api';
import { getAdminEventsApi } from '../../api/event.api';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/formatDate';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';

const TITLE_MAX = 100;
const MSG_MAX = 1000;

export default function AnnouncementsPage() {
  const toast = useToast();
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all_students');
  const [eventId, setEventId] = useState('');
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: announcementsData, isLoading: loadingAnnouncements } = useQuery({
    queryKey: ['announcements-all'],
    queryFn: () => getAllAnnouncementsApi().then((r) => r.data.data),
  });

  const { data: eventsData } = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => getAdminEventsApi({ limit: 100 }).then((r) => r.data.data),
    enabled: audience === 'event_registrants',
  });

  const createMutation = useMutation({
    mutationFn: createAnnouncementApi,
    onSuccess: () => {
      toast.success('Announcement sent successfully');
      qc.invalidateQueries({ queryKey: ['announcements-all'] });
      setTitle('');
      setMessage('');
      setAudience('all_students');
      setEventId('');
      setErrors({});
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to send announcement'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAnnouncementApi,
    onSuccess: () => {
      toast.success('Announcement deleted');
      qc.invalidateQueries({ queryKey: ['announcements-all'] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  function validate() {
    const errs = {};
    if (!title.trim()) errs.title = 'Title is required';
    else if (title.length > TITLE_MAX) errs.title = `Title must be ${TITLE_MAX} characters or fewer`;
    if (!message.trim()) errs.message = 'Message is required';
    else if (message.length > MSG_MAX) errs.message = `Message must be ${MSG_MAX} characters or fewer`;
    if (audience === 'event_registrants' && !eventId) errs.eventId = 'Please select an event';
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const payload = { title, message, audience };
    if (audience === 'event_registrants') payload.eventId = eventId;
    createMutation.mutate(payload);
  }

  const announcements = announcementsData?.announcements || announcementsData || [];
  const events = eventsData?.events || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Megaphone size={24} className="text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h2>
      </div>

      {/* Create Form */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Send New Announcement</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title <span className="text-gray-400 text-xs">({title.length}/{TITLE_MAX})</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })); }}
              maxLength={TITLE_MAX + 10}
              placeholder="Announcement title"
              className={`w-full px-3 py-2 rounded-xl border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                errors.title ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'
              }`}
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message <span className="text-gray-400 text-xs">({message.length}/{MSG_MAX})</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => { setMessage(e.target.value); setErrors((p) => ({ ...p, message: undefined })); }}
              rows={4}
              placeholder="Write your announcement message..."
              className={`w-full px-3 py-2 rounded-xl border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none ${
                errors.message ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'
              }`}
            />
            {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
          </div>

          {/* Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audience</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="audience"
                  value="all_students"
                  checked={audience === 'all_students'}
                  onChange={() => { setAudience('all_students'); setEventId(''); setErrors((p) => ({ ...p, eventId: undefined })); }}
                  className="accent-indigo-600"
                />
                <span className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <Users size={14} /> All Students
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="audience"
                  value="event_registrants"
                  checked={audience === 'event_registrants'}
                  onChange={() => { setAudience('event_registrants'); setErrors((p) => ({ ...p, eventId: undefined })); }}
                  className="accent-indigo-600"
                />
                <span className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <Calendar size={14} /> Event Registrants
                </span>
              </label>
            </div>
          </div>

          {/* Event selector */}
          {audience === 'event_registrants' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Event</label>
              <select
                value={eventId}
                onChange={(e) => { setEventId(e.target.value); setErrors((p) => ({ ...p, eventId: undefined })); }}
                className={`w-full px-3 py-2 rounded-xl border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  errors.eventId ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <option value="">-- Select an event --</option>
                {events.map((ev) => (
                  <option key={ev._id} value={ev._id}>{ev.title}</option>
                ))}
              </select>
              {errors.eventId && <p className="mt-1 text-xs text-red-500">{errors.eventId}</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Send size={15} />
            {createMutation.isPending ? 'Sending...' : 'Send Announcement'}
          </button>
        </form>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Announcement History</h3>
        </div>
        {loadingAnnouncements ? (
          <div className="p-8 flex justify-center"><Loader /></div>
        ) : announcements.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No announcements sent yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <tr>
                  {['Title', 'Audience', 'Event', 'Recipients', 'Date', 'Delete'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {announcements.map((ann) => (
                  <tr key={ann._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-[180px] truncate">{ann.title}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 capitalize">
                      {ann.audience === 'all_students' ? 'All Students' : 'Event Registrants'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[140px] truncate">
                      {ann.event?.title || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {ann.recipientCount ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(ann.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteTarget(ann)}
                        disabled={deleteMutation.isPending && deleteTarget?._id === ann._id}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deleteMutation.isPending && deleteTarget?._id === ann._id ? (
                          <span className="inline-block w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => !deleteMutation.isPending && setDeleteTarget(null)}
        title="Delete Announcement"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">"{deleteTarget?.title}"</span>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => deleteMutation.mutate(deleteTarget._id)}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-60"
          >
            {deleteMutation.isPending ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
