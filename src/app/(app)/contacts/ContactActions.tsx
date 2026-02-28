'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './contacts.module.css';

export default function ContactActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAction(status: 'accepted' | 'rejected') {
    setLoading(true);
    try {
      await fetch(`/api/contacts/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.actionBtns}>
      <button
        onClick={() => handleAction('accepted')}
        disabled={loading}
        className={styles.acceptBtn}
      >
        承認
      </button>
      <button
        onClick={() => handleAction('rejected')}
        disabled={loading}
        className={styles.rejectBtn}
      >
        拒否
      </button>
    </div>
  );
}
