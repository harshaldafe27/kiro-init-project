import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { getAdminEventsApi, deleteEventApi, togglePublishApi } from '../../api/event.api';
import { markCompleteApi, distributeApi } from '../../api/certificate.api';
import { formatDate } from '../../utils/formatDate';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import CertificatePositionPicker from '../../components/admin/CertificatePositionPicker';
import { useToast } from '../../hooks/useToast';
import { Plus, Pencil, Users, Trash2, Eye, EyeOff, BarChart2, CheckCircle, Award, Upload, X, Send } from 'lucide-react';

export default function ManageEvents() {
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const [distributeTarget, setDistributeTarget] = useState(null);
  const [templateBase64, setTemplateBase64] = useState(null);
  const [nameX, setNameX] = useState('');
  const [nameY, setNameY] = useState('');
  const [fontSize, setFontSize] = useState('28');
  const fileInputRef = useRef(null);

  const resetDistributeState = () => {
    setDistributeTarget(null);
    setTemplateBase64(null);
    setNameX('');
    setNameY('');
    setFontSize('28');
  };

  const handleTemplateFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('PDF must be under 5MB');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setTemplateBase64(ev.target.result.split(',')[1]);
    reader.readAsDataURL(file);
  };

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

  const markCompleteMutation = useMutation({
    mutationFn: markCompleteApi,
    onSuccess: () => {
      toast.success('Event marked as completed');
      qc.invalidateQueries({ queryKey: ['admin-events'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to mark complete'),
  });

  const distributeMutation = useMutation({
    mutationFn: distributeApi,
    onSuccess: () => {
      toast.success('Certificates distributed successfully');
      qc.invalidateQueries({ queryKey: ['admin-events'] });
      resetDistributeState();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to distribute certificates'),
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
                      {event.isCompleted ? (
                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 w-fit">
                          <CheckCircle size={11} /> Completed
                        </span>
                      ) : event.approvalStatus === 'approved' ? (
                        <button
                          onClick={() => publishMutation.mutate(event._id)}
                          className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                            event.isPublished
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-200'
                          }`}
                        >
                          {event.isPublished ? <Eye size={11} /> : <Send size={11} />}
                          {event.isPublished ? 'Published' : 'Publish Now'}
                        </button>
                      ) : event.approvalStatus === 'pending' ? (
                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 w-fit">
                          Pending Approval
                        </span>
                      ) : event.approvalStatus === 'rejected' ? (
                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 w-fit">
                          Rejected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 w-fit">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/events/${event._id}/edit`)}
                          disabled={event.isCompleted}
                          className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                        <Link
                          to={`/admin/events/${event._id}/analytics`}
                          className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title="Analytics"
                        >
                          <BarChart2 size={14} />
                        </Link>
                        {!event.isCompleted && !event.isCancelled && event.isPublished && (
                          <button
                            onClick={() => markCompleteMutation.mutate(event._id)}
                            className="p-1.5 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                            title="Mark Complete"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {event.isCompleted && !event.certificatesDistributed && (
                          <button
                            onClick={() => setDistributeTarget(event)}
                            className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                            title="Distribute Certs"
                          >
                            <Award size={14} />
                          </button>
                        )}
                        {event.certificatesDistributed && (
                          <span
                            className="p-1.5 rounded-lg text-gray-400 dark:text-gray-600 cursor-not-allowed"
                            title="Certs Distributed"
                          >
                            <Award size={14} />
                          </span>
                        )}
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

      <Modal
        isOpen={!!distributeTarget}
        onClose={resetDistributeState}
        title="Distribute Certificates"
        wide
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Distributing certificates for <span className="font-semibold text-gray-900 dark:text-white">{distributeTarget?.title}</span>.
          </p>

          {/* Template upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Certificate Template (PDF) <span className="text-gray-400 text-xs">— optional, uses built-in design if skipped</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-indigo-400 cursor-pointer transition-colors"
            >
              {templateBase64 ? (
                <>
                  <span className="text-sm text-green-600 dark:text-green-400 flex-1">✓ Template uploaded</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setTemplateBase64(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                    <X size={14} className="text-gray-400" />
                  </button>
                </>
              ) : (
                <>
                  <Upload size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Click to upload PDF template</span>
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleTemplateFile} />
          </div>

          {/* Position picker — only shown when template is uploaded */}
          {templateBase64 && (
            <CertificatePositionPicker
              templateBase64={templateBase64}
              previewName="Student Name"
              onPositionSet={({ nameX: x, nameY: y }) => { setNameX(x); setNameY(y); }}
            />
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={resetDistributeState}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => distributeMutation.mutate({
                eventId: distributeTarget._id,
                templateBase64: templateBase64 || undefined,
                nameX: nameX !== '' ? Number(nameX) : undefined,
                nameY: nameY !== '' ? Number(nameY) : undefined,
                fontSize: fontSize !== '' ? Number(fontSize) : undefined,
              })}
              disabled={distributeMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {distributeMutation.isPending && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              Distribute
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
