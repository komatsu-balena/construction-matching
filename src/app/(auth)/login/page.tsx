'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('メールアドレスまたはパスワードが正しくありません');
        } else {
          setError('ログインに失敗しました。しばらくしてから再試行してください。');
        }
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('エラーが発生しました。再試行してください。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>ログイン</h1>
        <p className={styles.subtitle}>建設マッチングへようこそ</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && (
          <div className={styles.errorAlert}>
            <span className={styles.errorIcon}>⚠</span>
            {error}
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
            autoComplete="email"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="password" className={styles.label}>
            パスワード
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        <div className={styles.forgotRow}>
          <Link href="/reset-password" className={styles.forgotLink}>
            パスワードをお忘れですか？
          </Link>
        </div>

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={loading}
        >
          {loading ? (
            <span className={styles.spinner} />
          ) : (
            'ログイン'
          )}
        </button>
      </form>

      <p className={styles.footer}>
        会員登録をご希望の方は、管理者よりご招待いたします。
      </p>
    </div>
  );
}
