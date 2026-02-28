'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './register.module.css';
import { Suspense } from 'react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<{
    email: string;
    company_name: string | null;
  } | null>(null);
  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    fullName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setTokenLoading(false);
      return;
    }
    validateToken(token);
  }, [token]);

  async function validateToken(token: string) {
    try {
      const res = await fetch(`/api/auth/validate-invitation?token=${token}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setInvitation(data.invitation);
        setForm(prev => ({ ...prev, email: data.invitation.email }));
      }
    } catch {
      setError('招待トークンの検証に失敗しました。');
    } finally {
      setTokenLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.passwordConfirm) {
      setError('パスワードが一致しません');
      return;
    }

    if (form.password.length < 8) {
      setError('パスワードは8文字以上で設定してください');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email: form.email,
          password: form.password,
          fullName: form.fullName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '登録に失敗しました');
        return;
      }

      // ログイン
      const supabase = createClient();
      await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('エラーが発生しました。再試行してください。');
    } finally {
      setLoading(false);
    }
  }

  if (tokenLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>招待を確認中...</p>
      </div>
    );
  }

  if (!token || (error && !invitation)) {
    return (
      <div className={styles.errorState}>
        <div className={styles.errorIcon}>⚠️</div>
        <h2>招待リンクが無効です</h2>
        <p>{error || '招待リンクが見つかりません。管理者にお問い合わせください。'}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>アカウント登録</h1>
        {invitation?.company_name && (
          <p className={styles.companyName}>
            {invitation.company_name} からのご招待
          </p>
        )}
        <p className={styles.subtitle}>以下の情報を入力してアカウントを作成してください</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && (
          <div className={styles.errorAlert}>
            <span>⚠</span> {error}
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>メールアドレス</label>
          <input
            type="email"
            value={form.email}
            readOnly={!!invitation}
            onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
            className={`${styles.input} ${invitation ? styles.readonly : ''}`}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>お名前（氏名）</label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))}
            className={styles.input}
            placeholder="田中 太郎"
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>パスワード</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
            className={styles.input}
            placeholder="8文字以上"
            required
            minLength={8}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>パスワード（確認）</label>
          <input
            type="password"
            value={form.passwordConfirm}
            onChange={(e) => setForm(prev => ({ ...prev, passwordConfirm: e.target.value }))}
            className={styles.input}
            placeholder="もう一度入力してください"
            required
          />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? <span className={styles.spinnerBtn} /> : 'アカウントを作成する'}
        </button>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className={styles.loading}><div className={styles.spinner} /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
