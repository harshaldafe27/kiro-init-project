import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfileApi } from '../../api/auth.api';
import useStore from '../../store/useStore';
import { useToast } from '../../hooks/useToast';

export default function Profile() {
  const user = useStore((s) => s.user);
  const setAuth = useStore((s) => s.setAuth);
  const accessToken = useStore((s) => s.accessToken);
  const toast = useToast();
  const [form, setForm] = useState({ name: user?.name || '', college: user?.college || '', phone: user?.phone || '', avatar: user?.avatar || '' });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: updateProfileApi,
    onSuccess: ({ data }) => {
      setAuth(data.data.user, accessToken);
      toast.success('Profile updated!');
    },
    onError: (err) => setError(err.response?.data?.message || 'Update failed'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Name is required');
    mutation.mutate(form);
  };

  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h2>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full capitalize">{user?.role}</span>
          </div>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {[['name', 'Full Name'], ['college', 'College'], ['phone', 'Phone'], ['avatar', 'Avatar URL']].map(([key, label]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
              <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          ))}
          <button type="submit" disabled={mutation.isPending}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-medium text-sm transition-colors">
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
