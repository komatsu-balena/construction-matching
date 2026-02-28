'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './admin-registrations.module.css';

interface Props {
  userId: string;
  userName: string;
  companyName: string;
}

export default function AdminRegistrationActions({ userId, userName, companyName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);

  async function handleAction(action: 'approve' | 'reject') {
    const label = action === 'approve' ? '承認' : '却下';
    if (!confirm(`${companyName}（${userName}）を${label}しますか？`)) return;

    setLoading(action);
    try {
      const res = await fetch(`/api/admin/registrations/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? `${label}に失敗しました`);
        return;
      }
      router.refresh();
    } catch {
      alert('通信エラーが発生しました');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className={styles.actions}>
      <button
        onClick={() => handleAction('approve')}
        disabled={loading !== null}
        className={styles.approveBtn}
      >
        {loading === 'approve' ? '処理中...' : '✓ 承認'}
      </button>
      <button
        onClick={() => handleAction('reject')}
        disabled={loading !== null}
        className={styles.rejectBtn}
      >
        {loading === 'reject' ? '処理中...' : '✗ 却下'}
      </button>
    </div>
  );
}
