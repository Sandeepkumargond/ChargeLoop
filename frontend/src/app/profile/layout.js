import DashboardLayout from '@/components/DashboardLayout';
import AuthGuard from '@/components/AuthGuard';

export default function ProfileLayout({ children }) {
  return (
    <AuthGuard allowedRoles={['user', 'host', 'admin']}>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
