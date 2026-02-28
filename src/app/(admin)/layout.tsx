import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminSidebar from '@/components/admin/AdminSidebar';
import Header from '@/components/layout/Header';
import styles from './admin.module.css';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: userData } = await supabase
    .from('users')
    .select('*, company:companies(name)')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'admin') redirect('/dashboard');

  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.main}>
        <Header user={userData} />
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
