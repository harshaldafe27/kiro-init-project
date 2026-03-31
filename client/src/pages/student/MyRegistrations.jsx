import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyRegistrationsApi, cancelRegistrationApi } from '../../api/registration.api';
import { formatDate } from '../../utils/formatDate';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { useToast } from '../../hooks/useToast';

const statusColor = { confirmed: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700', cancelled: 'bg-gray-100 text-gray-500' };
const payColor = { paid: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700', failed: 'bg-red-100 text-red-600', not_required: 'bg-gray-100 text-gray-500' };

export default function MyRegistrations() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => getMyRegistrationsApi().then((r) => r.data.data),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelRegistrationApi,
    onSuccess: () => { toast.success('Registration cancelled'); qc.invalidateQueries(['my-registrations']); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to cancel'),
  });

  if (isLoading) return <Loader />;
  const regs = data?.registrations || [];

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Registrations</h2>
      {regs.length === 0 ? <EmptyState message="You haven't registered for any events yet" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {regs.map((reg) => (
            <div key={reg._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{reg.event?.title || 'Event'}</h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColor[reg.status]}`}>{reg.status}</span>
              </div>
              <div className="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                <div>📅 {formatDate(reg.event?.date)}</div>
                <div>📍 {reg.event?.venue}</div>
                <div>Registered: {formatDate(reg.registeredAt)}</div>
                {reg.paymentStatus !== 'not_required' && (
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize ${payColor[reg.paymentStatus]}`}>
                    Payment: {reg.paymentStatus}
                  </span>
                )}
              </div>
              {reg.status !== 'cancelled' && (
                <button onClick={() => cancelMutation.mutate(reg._id)} disabled={cancelMutation.isPending}
                  className="mt-4 w-full py-2 rounded-xl text-sm font-medium text-red-500 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  Cancel Registration
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
