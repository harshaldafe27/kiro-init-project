import { useEffect } from 'react';
import useStore from '../../store/useStore';

const icons = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};
const colors = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-indigo-500',
};

function ToastItem({ toast }) {
  const removeToast = useStore((s) => s.removeToast);
  useEffect(() => {
    const t = setTimeout(() => removeToast(toast.id), 3500);
    return () => clearTimeout(t);
  }, [toast.id, removeToast]);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm ${colors[toast.type]} animate-fade-in`}>
      <span className="font-bold text-base">{icons[toast.type]}</span>
      <span>{toast.message}</span>
      <button onClick={() => removeToast(toast.id)} className="ml-auto opacity-70 hover:opacity-100">✕</button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => <ToastItem key={t.id} toast={t} />)}
    </div>
  );
}
