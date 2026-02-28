'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import styles from './pending.module.css';

export default function PendingPage() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>⏳</div>
        <h1 className={styles.title}>承認待ちです</h1>
        <p className={styles.message}>
          ご登録ありがとうございます。<br />
          現在、管理者が申請内容を確認しています。<br />
          承認が完了するとご利用いただけるようになります。
        </p>
        <div className={styles.infoBox}>
          <p className={styles.infoText}>
            承認には通常1〜2営業日かかります。<br />
            承認後、登録したメールアドレスにお知らせします。
          </p>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          ログアウト
        </button>
      </div>
    </div>
  );
}
