import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEventApi, updateEventApi } from '../../api/event.api';
import { useToast } from '../../hooks/useToast';

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Academic', 'Workshop'];

export default function EventForm({ event, onSuccess }) {
  const isEdit = !!event;
  const [form, setForm] = useState({
    title: event?.title || '', description: event?.description || '',
    date: event?.date ? event.date.slice(0, 16) : '', venue: event?.venue || '',
    capacity: event?.capacity || '', fee: event?.fee ?? 0,
    category: event?.category || '', tags: event?.tags?.join(', ') || '',
    banner: event?.banner || '',
  });
  const [error, setError] = useState('');
  const toast = useToast();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateEventApi(event._id, data) : createEventApi(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Event updated!' : 'Event created!');
      qc.invalidateQueries({ queryKey: ['admin-events'] });
      qc.invalidateQueries({ queryKey: ['events'] });
      onSuccess?.();
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to save event'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.title || !form.date || !form.venue || !form.capacity) return setError('Title, date, venue and capacity are required');
    // Auto-publish on creation so events are immediately visible to students
    mutation.mutate({ ...form, capacity: Number(form.capacity), fee: Number(form.fee), tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean), isPublished: true });
  };

  const field = (key, label, type = 'text', required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}{required && ' *'}</label>
      <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={required}
        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-sm">{error}</div>}
      {field('title', 'Event Title', 'text', true)}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      {field('date', 'Date & Time', 'datetime-local', true)}
      {field('venue', 'Venue', 'text', true)}
      <div className="grid grid-cols-2 gap-3">
        {field('capacity', 'Capacity', 'number', true)}
        {field('fee', 'Fee (₹)', 'number')}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Select category</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {field('tags', 'Tags (comma separated)')}
      {field('banner', 'Banner Image URL')}
      <button type="submit" disabled={mutation.isPending}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-medium text-sm transition-colors">
        {mutation.isPending ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
      </button>
    </form>
  );
}
