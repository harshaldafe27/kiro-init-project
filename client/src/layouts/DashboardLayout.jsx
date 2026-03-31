import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';
import useStore from '../store/useStore';

export default function DashboardLayout({ title }) {
  const user = useStore((s) => s.user);
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar role={user?.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title={title || 'EventFlex'} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
