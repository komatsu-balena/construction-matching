import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import styles from './app.module.css';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('*, company:companies(*)')
    .eq('id', user.id)
    .single();

  return (
    <div className={styles.layout}>
      <Sidebar user={userData} />
      <div className={styles.main}>
        <Header user={userData} />
        <main className={styles.content}>
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
