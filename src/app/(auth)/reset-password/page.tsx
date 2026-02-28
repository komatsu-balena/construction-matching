'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from './reset.module.css';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        setError('メール送信に失敗しました。アドレスをご確認ください。');
        return;
      }

      setSent(true);
    } catch {
      setError('エラーが発生しました。再試行してください。');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className={styles.successState}>
        <div className={styles.successIcon}>✉️</div>
        <h2>メールを送信しました</h2>
        <p>
          <strong>{email}</strong> にパスワードリセットのメールを送信しました。<br />
          メール内のリンクをクリックして、新しいパスワードを設定してください。
        </p>
        <Link href="/login" className={styles.backLink}>
          ← ログインへ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>パスワードリセット</h1>
        <p className={styles.subtitle}>
          登録済みのメールアドレスを入力してください。<br />
          パスワードリセット用のリンクをお送りします。
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && (
          <div className={styles.errorAlert}>
            <span>⚠</span> {error}
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            placeholder="example@company.co.jp"
            required
          />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? <span className={styles.spinner} /> : 'リセットメールを送信'}
        </button>
      </form>

      <div className={styles.footer}>
        <Link href="/login" className={styles.backLink}>
          ← ログインへ戻る
        </Link>
      </div>
    </div>
  );
}
