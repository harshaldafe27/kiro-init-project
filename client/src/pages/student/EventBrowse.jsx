import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEventsApi } from '../../api/event.api';
import EventCard from '../../components/common/EventCard';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { usePagination } from '../../hooks/usePagination';

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Academic', 'Workshop'];

export default function EventBrowse() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const { page, limit, setPage } = usePagination(9);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['events', { search, category, page, limit }],
    queryFn: () => getEventsApi({ search, category, page, limit }).then((r) => r.data.data),
  });

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Browse Events</h2>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search events..." />
        </div>
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
            {(data?.events || []).map((event) => (
              <EventCard
                key={event._id}
                event={event}
                role="student"
              />
            ))}
          </div>
          {data?.meta && (
            <Pagination page={data.meta.page} pages={data.meta.pages} onChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
