import AuthGuard from '@/components/AuthGuard';

export default function AdminDashboardLayout({ children }) {
  return (
    <AuthGuard allowedRoles={['admin']}>
      {children}
    </AuthGuard>
  );
}
