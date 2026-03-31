import ThemeToggle from '../components/common/ThemeToggle';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">⚡</span>
          <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">EventFlex</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">College Event Management</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
