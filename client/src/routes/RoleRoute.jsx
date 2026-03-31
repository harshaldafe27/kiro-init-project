import { Navigate } from 'react-router-dom';
import useStore from '../store/useStore';

const roleHome = { student: '/student', admin: '/admin', principal: '/principal' };

export default function RoleRoute({ role, children }) {
  const user = useStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={roleHome[user.role] || '/login'} replace />;
  return children;
}
