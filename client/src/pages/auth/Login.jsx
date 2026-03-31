import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import AuthLayout from '../../layouts/AuthLayout';
import { loginApi } from '../../api/auth.api';
import useStore from '../../store/useStore';
import { useToast } from '../../hooks/useToast';

const roleHome = { student: '/student', admin: '/admin', principal: '/principal' };
const roleIcon = { student: '🎓', admin: '🛠️', principal: '👨‍💼' };

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useStore((s) => s.setAuth);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Step 1: Firebase Authentication
      await signInWithEmailAndPassword(auth, form.email, form.password);

      // Step 2: Get role + JWT from our backend
      const { data } = await loginApi(form);
      const { user, accessToken } = data.data;
      window.__accessToken__ = accessToken;
      setAuth(user, accessToken);
      toast.success(`Welcome back, ${user.name}! ${roleIcon[user.role] || ''}`);
      navigate(roleHome[user.role] || '/student');
    } catch (err) {
      const code = err.code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Email or password is incorrect');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later');
      } else {
        setError(err.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors';

  return (
    <AuthLayout>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sign In</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">You'll be redirected to your role dashboard automatically.</p>

      {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
          <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} />
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-medium text-sm transition-colors">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          { role: 'Student', icon: '🎓', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
          { role: 'Admin', icon: '🛠️', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
          { role: 'Principal', icon: '👨‍💼', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
        ].map((r) => (
          <div key={r.role} className={`flex flex-col items-center p-2 rounded-xl text-xs font-medium ${r.color}`}>
            <span className="text-lg">{r.icon}</span>
            <span>{r.role}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        No account? <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Register</Link>
      </p>
    </AuthLayout>
  );
}
