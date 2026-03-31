import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import { registerApi } from '../../api/auth.api';
import useStore from '../../store/useStore';
import { useToast } from '../../hooks/useToast';

const roleHome = { student: '/student', admin: '/admin', principal: '/principal' };

const ROLES = [
  { value: 'student', label: 'Student', icon: '🎓', desc: 'Browse and register for events' },
  { value: 'admin', label: 'Admin', icon: '🛠️', desc: 'Create and manage events' },
  { value: 'principal', label: 'Principal', icon: '👨‍💼', desc: 'Monitor all events and analytics' },
];

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', college: '', role: 'student', adminCode: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useStore((s) => s.setAuth);
  const toast = useToast();
  const navigate = useNavigate();

  const needsCode = form.role === 'admin' || form.role === 'principal';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (needsCode && !form.adminCode) return setError('Admin code is required for this role');
    setLoading(true);
    try {
      const { data } = await registerApi({
        name: form.name, email: form.email, password: form.password,
        college: form.college, role: form.role, adminCode: form.adminCode,
      });
      const { user, accessToken } = data.data;
      window.__accessToken__ = accessToken;
      setAuth(user, accessToken);
      toast.success('Account created!');
      navigate(roleHome[user.role] || '/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors';

  return (
    <AuthLayout>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Create Account</h2>

      {/* Role selector */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {ROLES.map((r) => (
          <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value, adminCode: '' })}
            className={`flex flex-col items-center p-3 rounded-xl border-2 text-center transition-all ${
              form.role === r.value
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
            }`}>
            <span className="text-xl mb-1">{r.icon}</span>
            <span className="text-xs font-semibold text-gray-800 dark:text-white">{r.label}</span>
            <span className="text-xs text-gray-400 hidden sm:block mt-0.5 leading-tight">{r.desc}</span>
          </button>
        ))}
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">College</label>
          <input value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
          <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
          <input type="password" required value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} className={inputClass} />
        </div>

        {needsCode && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Admin Code <span className="text-xs text-gray-400">(required for {form.role} role)</span>
            </label>
            <input type="password" required value={form.adminCode} onChange={(e) => setForm({ ...form, adminCode: e.target.value })}
              placeholder="Enter admin secret code" className={inputClass} />
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-medium text-sm transition-colors">
          {loading ? 'Creating...' : `Create ${ROLES.find(r => r.value === form.role)?.label} Account`}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Have an account? <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Sign In</Link>
      </p>
    </AuthLayout>
  );
}
