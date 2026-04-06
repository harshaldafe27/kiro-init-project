import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApprovalRequestsApi, approveRequestApi, rejectRequestApi } from '../../api/approval.api';
import { formatDate } from '../../utils/formatDate';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { useToast } from '../../hooks/useToast';
import { CheckCircle, XCircle } from 'lucide-react';

const statusBadge = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

export default function ApprovalRequests() {
  const toast = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('pending');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['approval-requests', filter],
    queryFn: () => getApprovalRequestsApi(filter !== 'all' ? { status: filter } : {}).then((r) => r.data.data),
  });

  const approveMutation = useMutation({
    mutationFn: approveRequestApi,
    onSuccess: () => {
      toast.success('Event approved — admin can now publish it');
      qc.invalidateQueries({ queryKey: ['approval-requests'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => rejectRequestApi(id, reason),
    onSuccess: () => {
      toast.success('Event rejected');
      qc.invalidateQueries({ queryKey: ['approval-requests'] });
      setRejectTarget(null);
      setReason('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reject'),
  });

  if (isLoading) return <Loader />;
  const requests = data?.requests || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Event Approval Requests</h2>
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected', 'all'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {requests.length === 0 ? (
        <EmptyState message={`No ${filter === 'all' ? '' : filter} approval requests`} />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <tr>
                  {['Event', 'Admin', 'Date', 'Category', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{req.eventTitle}</p>
                      {req.event?.venue && <p className="text-xs text-gray-400 mt-0.5">{req.event.venue}</p>}
                      {req.status === 'rejected' && req.rejectionReason && (
                        <p className="text-xs text-red-500 mt-0.5">Reason: {req.rejectionReason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{req.adminName}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {req.event?.date ? formatDate(req.event.date) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{req.event?.category || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusBadge[req.status]}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {req.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => approveMutation.mutate(req._id)}
                            disabled={approveMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={12} /> Approve
                          </button>
                          <button
                            onClick={() => { setRejectTarget(req); setReason(''); }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition-colors"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject modal */}
      <Modal isOpen={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Event">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Rejecting <span className="font-semibold text-gray-900 dark:text-white">{rejectTarget?.eventTitle}</span>.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Provide a reason for rejection (optional)..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setRejectTarget(null)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => rejectMutation.mutate({ id: rejectTarget._id, reason })}
              disabled={rejectMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 transition-colors"
            >
              {rejectMutation.isPending && <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />}
              Reject
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
