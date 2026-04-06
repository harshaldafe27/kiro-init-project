import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEventApi } from '../../api/event.api';
import {
  registerForEventApi,
  createPaymentOrderApi,
  verifyPaymentApi,
  getMyRegistrationsApi,
} from '../../api/registration.api';
import Loader from '../../components/common/Loader';
import ErrorState from '../../components/common/ErrorState';
import RegistrationModal from '../../components/student/RegistrationModal';
import DigitalTicket from '../../components/student/DigitalTicket';
import { formatDate } from '../../utils/formatDate';
import { useToast } from '../../hooks/useToast';
import useStore from '../../store/useStore';

const openRazorpay = (options) =>
  new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({ ...options, handler: resolve });
    rzp.on('payment.failed', reject);
    rzp.open();
  });

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const user = useStore((s) => s.user);

  const [showModal, setShowModal] = useState(false);
  const [ticket, setTicket] = useState(null); // set after successful registration

  const { data: eventData, isLoading, isError, refetch } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEventApi(id).then((r) => r.data.data),
  });

  const { data: regsData } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => getMyRegistrationsApi().then((r) => r.data.data),
  });

  const event = eventData?.event || eventData;
  const registeredIds = new Set(
    (regsData?.registrations || [])
      .filter((r) => r.status !== 'cancelled')
      .map((r) => r.event?._id || r.event)
  );
  const isRegistered = event ? registeredIds.has(event._id) : false;
  const isFull = event ? event.capacity > 0 && event.registeredCount >= event.capacity : false;
  const isPast = event
    ? event.deadline
      ? new Date(event.deadline) < new Date()
      : new Date(event.date) < new Date()
    : false;

  // Find existing ACTIVE registration for "View Ticket" button
  const existingReg = (regsData?.registrations || []).find(
    (r) => (r.event?._id || r.event) === event?._id && r.status !== 'cancelled'
  );

  const buildTicket = (reg) => ({
    registrationId: reg._id,
    specialId: reg.specialId || reg._id,
    studentName: reg.participantDetails?.name || user?.name || 'Participant',
    eventName: event.title,
    eventDate: event.date,
    venue: event.venue,
    fee: reg.amount || event.fee,
    paymentStatus: reg.paymentStatus,
    teamName: reg.teamName,
    teamMembers: reg.teamMembers || [],
  });

  const registerMutation = useMutation({
    mutationFn: async (formData) => {
      if (event.fee > 0) {
        const { data } = await createPaymentOrderApi(event._id, formData);
        const { orderId, amount, key, registrationId } = data.data;
        let response;
        try {
          response = await openRazorpay({
            key, amount, currency: 'INR', order_id: orderId,
            name: 'EventFlex', description: event.title,
            theme: { color: '#6366f1' },
          });
        } catch {
          // Student dismissed Razorpay — registration exists with paymentStatus: 'pending'
          throw { __razorpayDismissed: true };
        }
        const verifyRes = await verifyPaymentApi({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          registrationId,
        });
        return verifyRes.data.data;
      }
      const res = await registerForEventApi(event._id, formData);
      return res.data.data;
    },
    onSuccess: (data) => {
      toast.success('Registered successfully!');
      setShowModal(false);
      qc.invalidateQueries({ queryKey: ['my-registrations'] });
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event', id] });
      const reg = data?.registration;
      if (reg) setTicket(buildTicket(reg));
    },
    onError: (err) => {
      if (err?.__razorpayDismissed) {
        setShowModal(false);
        qc.invalidateQueries({ queryKey: ['my-registrations'] });
        toast.info('Payment pending — complete it from My Registrations');
        return;
      }
      toast.error(err.response?.data?.message || 'Registration failed');
    },
  });

  if (isLoading) return <Loader />;
  if (isError || !event) return <ErrorState onRetry={refetch} />;

  const spotsLeft = event.capacity - event.registeredCount;
  const fillPercent = Math.min(100, Math.round((event.registeredCount / event.capacity) * 100));

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition-colors"
      >
        ← Back
      </button>

      {/* Hero Banner */}
      <div className="rounded-2xl overflow-hidden w-full h-64 sm:h-80 bg-gradient-to-br from-indigo-500 to-purple-600 relative">
        {event.banner ? (
          <img src={event.banner} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white text-7xl">🎉</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 p-6">
          {event.category && (
            <span className="text-xs font-semibold bg-indigo-600 text-white px-3 py-1 rounded-full mb-2 inline-block">
              {event.category}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{event.title}</h1>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          {event.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About this Event</h2>
            {event.description ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none
                  prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-7 prose-p:my-3
                  prose-h1:text-gray-900 dark:prose-h1:text-white prose-h1:text-xl prose-h1:font-bold prose-h1:mt-6 prose-h1:mb-3
                  prose-h2:text-gray-900 dark:prose-h2:text-white prose-h2:text-lg prose-h2:font-semibold prose-h2:mt-5 prose-h2:mb-2
                  prose-h3:text-gray-800 dark:prose-h3:text-gray-100 prose-h3:text-base prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-2
                  prose-ul:my-3 prose-ul:space-y-1.5 prose-li:text-gray-600 dark:prose-li:text-gray-300 prose-li:leading-6
                  prose-ol:my-3 prose-ol:space-y-1.5
                  prose-strong:text-gray-800 dark:prose-strong:text-gray-100 prose-strong:font-semibold
                  prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
                  prose-hr:my-4 prose-hr:border-gray-200 dark:prose-hr:border-gray-700"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            ) : (
              <p className="text-gray-400 text-sm">No description provided.</p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Event Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon="📅" label="Start Date" value={formatDate(event.date)} />
              {event.endDate && <InfoRow icon="🏁" label="End Date" value={formatDate(event.endDate)} />}
              <InfoRow icon="📍" label="Venue" value={event.venue} />
              <InfoRow icon="👥" label="Capacity" value={`${event.registeredCount} / ${event.capacity} registered`} />
              <InfoRow icon="💰" label="Registration Fee" value={event.fee > 0 ? `₹${event.fee}` : 'Free'} />
              {event.createdBy?.name && (
                <InfoRow icon="🧑‍💼" label="Organized by" value={event.createdBy.name} />
              )}
            </div>
          </div>
        </div>

        {/* Right: Registration card */}
        <div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 sticky top-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {event.fee > 0 ? `₹${event.fee}` : 'Free'}
              </span>
              {isRegistered && (
                <span className="text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-full">
                  ✓ Registered
                </span>
              )}
            </div>

            {/* Capacity bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>{event.registeredCount} registered</span>
                <span>{spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${fillPercent >= 90 ? 'bg-red-500' : fillPercent >= 70 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            </div>

            {/* CTA */}
            {isRegistered ? (
              <div className="space-y-2">
                <div className="w-full py-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-semibold text-center">
                  ✓ Already Registered
                </div>
                {existingReg?.specialId && (
                  <button
                    onClick={() => setTicket(buildTicket(existingReg))}
                    className="w-full py-2.5 rounded-xl border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                  >
                    🎫 View My Ticket
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                disabled={isPast || isFull}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
                  isPast || isFull
                    ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isPast ? 'Registration Closed' : isFull ? 'Event Full' : event.fee > 0 ? `Register Now — ₹${event.fee}` : 'Register for Free'}
              </button>
            )}

            <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-4">
              <div className="flex items-center gap-2">📅 <span>{formatDate(event.date)}</span></div>
              <div className="flex items-center gap-2">📍 <span>{event.venue}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showModal && (
        <RegistrationModal
          event={event}
          onSubmit={(formData) => registerMutation.mutate(formData)}
          onClose={() => setShowModal(false)}
          isPending={registerMutation.isPending}
        />
      )}

      {/* Digital Ticket */}
      {ticket && (
        <DigitalTicket
          ticket={ticket}
          onClose={() => setTicket(null)}
        />
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-lg mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}
