'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './company-detail.module.css';

interface Props {
  companyId: string;
  isActive: boolean;
}

export default function AdminCompanyActions({ companyId, isActive }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function toggleStatus() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? '更新に失敗しました');
      } else {
        router.refresh();
      }
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.adminActions}>
      {error && <p className={styles.actionError}>{error}</p>}
      <button
        onClick={toggleStatus}
        disabled={loading}
        className={isActive ? styles.deactivateBtn : styles.activateBtn}
      >
        {loading ? '処理中...' : isActive ? '企業を無効化' : '企業を有効化'}
      </button>
    </div>
  );
}
