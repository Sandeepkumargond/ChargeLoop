import DashboardLayout from '@/components/DashboardLayout';
import AuthGuard from '@/components/AuthGuard';

export default function HostLayout({ children }) {
  return (
    <AuthGuard allowedRoles={['host', 'user', 'admin']}>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
