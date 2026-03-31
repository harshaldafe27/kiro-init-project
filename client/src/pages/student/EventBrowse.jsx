import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEventsApi } from '../../api/event.api';
import { registerForEventApi, createPaymentOrderApi, verifyPaymentApi, getMyRegistrationsApi } from '../../api/registration.api';
import EventCard from '../../components/common/EventCard';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { useToast } from '../../hooks/useToast';
import { usePagination } from '../../hooks/usePagination';

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Academic', 'Workshop'];

export default function EventBrowse() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const { page, limit, setPage } = usePagination(9);
  const toast = useToast();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['events', { search, category, page, limit }],
    queryFn: () => getEventsApi({ search, category, page, limit }).then((r) => r.data.data),
  });

  const { data: regsData } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => getMyRegistrationsApi().then((r) => r.data.data),
  });

  const registeredIds = new Set((regsData?.registrations || []).map((r) => r.event?._id));

  const registerMutation = useMutation({
    mutationFn: async (event) => {
      if (event.fee > 0) {
        const { data } = await createPaymentOrderApi(event._id);
        const { orderId, amount, key, registrationId } = data.data;
        return new Promise((resolve, reject) => {
          const rzp = new window.Razorpay({
            key, amount, currency: 'INR', order_id: orderId, name: 'EventFlex',
            description: event.title,
            handler: async (response) => {
              try {
                await verifyPaymentApi({ orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature, registrationId });
                resolve();
              } catch (e) { reject(e); }
            },
            theme: { color: '#6366f1' },
          });
          rzp.open();
        });
      }
      return registerForEventApi(event._id);
    },
    onSuccess: () => {
      toast.success('Registered successfully!');
      qc.invalidateQueries(['my-registrations']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Registration failed'),
  });

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Browse Events</h2>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1"><SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search events..." /></div>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {isLoading ? <Loader /> : isError ? <ErrorState onRetry={refetch} /> : (data?.events?.length === 0) ? (
        <EmptyState message="No events found" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.events.map((event) => (
              <EventCard key={event._id} event={event} role="student"
                isRegistered={registeredIds.has(event._id)}
                onRegister={(e) => registerMutation.mutate(e)} />
            ))}
          </div>
          <Pagination page={data.meta.page} pages={data.meta.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
