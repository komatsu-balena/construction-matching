'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './invite.module.css';

export default function InviteCompanyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: '',
    email: '',
    role: 'both',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.companyName.trim() || !form.email.trim()) {
      setError('会社名とメールアドレスは必須です');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/companies/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? '招待の送信に失敗しました');
      } else {
        setSuccess(`${form.companyName} への招待メールを送信しました。招待リンク: ${data.inviteUrl}`);
        setForm({ companyName: '', email: '', role: 'both', message: '' });
      }
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <Link href="/admin/companies" className={styles.backLink}>← 企業一覧に戻る</Link>
        <h1 className={styles.pageTitle}>企業を招待</h1>
        <p className={styles.pageDesc}>
          新規企業へ招待メールを送信します。招待リンクは7日間有効です。
        </p>
      </div>

      <div className={styles.card}>
        {error && <p className={styles.error}>{error}</p>}
        {success && (
          <div className={styles.successBox}>
            <p className={styles.successMsg}>{success}</p>
            <button onClick={() => setSuccess('')} className={styles.dismissBtn}>
              閉じる
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>
              会社名 <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              placeholder="株式会社〇〇建設"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              メールアドレス <span className={styles.required}>*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="contact@example.co.jp"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>会社の役割</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className={styles.select}
            >
              <option value="both">元請・下請（両方）</option>
              <option value="general_contractor">元請のみ</option>
              <option value="subcontractor">下請のみ</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>招待メッセージ（任意）</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="この度はご招待のご連絡をいたします..."
              className={styles.textarea}
              rows={4}
            />
          </div>

          <div className={styles.actions}>
            <Link href="/admin/companies" className={styles.cancelBtn}>
              キャンセル
            </Link>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? '送信中...' : '招待メールを送信'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
