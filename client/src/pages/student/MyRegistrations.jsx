import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyRegistrationsApi, cancelRegistrationApi } from '../../api/registration.api';
import { formatDate } from '../../utils/formatDate';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import DigitalTicket from '../../components/student/DigitalTicket';
import { useToast } from '../../hooks/useToast';
import useStore from '../../store/useStore';

const statusColor = {
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};
const payColor = {
  paid:         'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending:      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  failed:       'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  not_required: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

export default function MyRegistrations() {
  const toast = useToast();
  const qc = useQueryClient();
  const user = useStore((s) => s.user);
  const [ticket, setTicket] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => getMyRegistrationsApi().then((r) => r.data.data),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelRegistrationApi,
    onSuccess: () => {
      toast.success('Registration cancelled');
      qc.invalidateQueries({ queryKey: ['my-registrations'] });
      qc.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to cancel'),
  });

  const buildTicket = (reg) => ({
    specialId: reg.specialId || reg._id,
    studentName: reg.participantDetails?.name || user?.name || 'Participant',
    eventName: reg.event?.title || 'Event',
    eventDate: reg.event?.date,
    venue: reg.event?.venue,
    fee: reg.amount || reg.event?.fee || 0,
    paymentStatus: reg.paymentStatus,
    teamName: reg.teamName,
    teamMembers: reg.teamMembers || [],
  });

  if (isLoading) return <Loader />;
  const regs = data?.registrations || [];

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Registrations</h2>

      {regs.length === 0 ? (
        <EmptyState message="You haven't registered for any events yet" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {regs.map((reg) => (
            <div key={reg._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white leading-tight">
                  {reg.event?.title || 'Event'}
                </h3>
                <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColor[reg.status]}`}>
                  {reg.status}
                </span>
              </div>

              {/* Event info */}
              <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                <div>📅 {formatDate(reg.event?.date)}</div>
                <div>📍 {reg.event?.venue}</div>
                <div className="text-xs">Registered: {formatDate(reg.registeredAt)}</div>
              </div>

              {/* Participant details */}
              {reg.participantDetails?.name && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 text-xs space-y-0.5">
                  <p className="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Participant</p>
                  <p className="text-gray-700 dark:text-gray-300">{reg.participantDetails.name} · {reg.participantDetails.btId}</p>
                  <p className="text-gray-500 dark:text-gray-400">{reg.participantDetails.branch} · {reg.participantDetails.year}</p>
                  {reg.teamName && <p className="text-indigo-600 dark:text-indigo-400 font-medium">Team: {reg.teamName}</p>}
                </div>
              )}

              {/* Special ID */}
              {reg.specialId && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400">Ticket ID:</span>
                  <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{reg.specialId}</span>
                </div>
              )}

              {/* Payment badge */}
              {reg.paymentStatus !== 'not_required' && (
                <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize ${payColor[reg.paymentStatus]}`}>
                  Payment: {reg.paymentStatus}
                </span>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                {reg.specialId && reg.status === 'confirmed' && (
                  <button
                    onClick={() => setTicket(buildTicket(reg))}
                    className="flex-1 py-2 rounded-xl text-sm font-medium border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                  >
                    🎫 View Ticket
                  </button>
                )}
                {reg.status !== 'cancelled' && (
                  <button
                    onClick={() => cancelMutation.mutate(reg._id)}
                    disabled={cancelMutation.isPending}
                    className="flex-1 py-2 rounded-xl text-sm font-medium text-red-500 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Digital Ticket overlay */}
      {ticket && <DigitalTicket ticket={ticket} onClose={() => setTicket(null)} />}
    </div>
  );
}
