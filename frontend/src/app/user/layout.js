import DashboardLayout from '@/components/DashboardLayout';
import AuthGuard from '@/components/AuthGuard';

export default function UserLayout({ children }) {
  return (
    <AuthGuard allowedRoles={['user', 'host', 'admin']}>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
