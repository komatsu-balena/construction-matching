'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './register.module.css';

// ── 招待トークンがある場合の登録フォーム ──────────────────────
function InviteRegisterForm({ token }: { token: string }) {
  const router = useRouter();
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
    validateToken(token);
  }, [token]);

  async function validateToken(t: string) {
    try {
      const res = await fetch(`/api/auth/validate-invitation?token=${t}`);
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
    if (form.password !== form.passwordConfirm) { setError('パスワードが一致しません'); return; }
    if (form.password.length < 8) { setError('パスワードは8文字以上で設定してください'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email: form.email, password: form.password, fullName: form.fullName }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '登録に失敗しました'); return; }
      const supabase = createClient();
      await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('エラーが発生しました。再試行してください。');
    } finally {
      setLoading(false);
    }
  }

  if (tokenLoading) {
    return <div className={styles.loading}><div className={styles.spinner} /><p>招待を確認中...</p></div>;
  }
  if (error && !invitation) {
    return (
      <div className={styles.errorState}>
        <div className={styles.errorIcon}>⚠️</div>
        <h2>招待リンクが無効です</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>アカウント登録</h1>
        {invitation?.company_name && (
          <p className={styles.companyName}>{invitation.company_name} からのご招待</p>
        )}
        <p className={styles.subtitle}>以下の情報を入力してアカウントを作成してください</p>
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.errorAlert}><span>⚠</span> {error}</div>}
        <div className={styles.field}>
          <label className={styles.label}>メールアドレス</label>
          <input type="email" value={form.email} readOnly={!!invitation}
            onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
            className={`${styles.input} ${invitation ? styles.readonly : ''}`} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>お名前（氏名）</label>
          <input type="text" value={form.fullName}
            onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))}
            className={styles.input} placeholder="田中 太郎" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>パスワード</label>
          <input type="password" value={form.password}
            onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
            className={styles.input} placeholder="8文字以上" required minLength={8} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>パスワード（確認）</label>
          <input type="password" value={form.passwordConfirm}
            onChange={(e) => setForm(prev => ({ ...prev, passwordConfirm: e.target.value }))}
            className={styles.input} placeholder="もう一度入力してください" required />
        </div>
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? <span className={styles.spinnerBtn} /> : 'アカウントを作成する'}
        </button>
      </form>
    </div>
  );
}

// ── 招待なし（自己申請）登録フォーム ──────────────────────────
function SelfRegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    companyName: '',
    prefecture: '',
    companyRole: 'both',
    password: '',
    passwordConfirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const prefectures = [
    '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
    '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
    '新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県',
    '静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県',
    '奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県',
    '徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県',
    '熊本県','大分県','宮崎県','鹿児島県','沖縄県',
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.passwordConfirm) { setError('パスワードが一致しません'); return; }
    if (form.password.length < 8) { setError('パスワードは8文字以上で設定してください'); return; }
    if (!form.fullName.trim()) { setError('お名前を入力してください'); return; }
    if (!form.companyName.trim()) { setError('会社名を入力してください'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/self-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          companyName: form.companyName,
          prefecture: form.prefecture || undefined,
          companyRole: form.companyRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '申請に失敗しました');
        return;
      }
      // 申請完了 → 承認待ちページへ
      router.push('/pending');
    } catch {
      setError('エラーが発生しました。再試行してください。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>利用登録申請</h1>
        <p className={styles.subtitle}>
          必要事項を入力して申請してください。<br />
          管理者が確認・承認後にご利用いただけます。
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.errorAlert}><span>⚠</span> {error}</div>}

        <div className={styles.sectionLabel}>担当者情報</div>

        <div className={styles.field}>
          <label className={styles.label}>お名前（氏名） <span className={styles.required}>*</span></label>
          <input type="text" value={form.fullName}
            onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))}
            className={styles.input} placeholder="山田 太郎" required />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>メールアドレス <span className={styles.required}>*</span></label>
          <input type="email" value={form.email}
            onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
            className={styles.input} placeholder="yamada@example.co.jp" required />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>パスワード <span className={styles.required}>*</span></label>
          <input type="password" value={form.password}
            onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
            className={styles.input} placeholder="8文字以上" required minLength={8} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>パスワード（確認） <span className={styles.required}>*</span></label>
          <input type="password" value={form.passwordConfirm}
            onChange={(e) => setForm(prev => ({ ...prev, passwordConfirm: e.target.value }))}
            className={styles.input} placeholder="もう一度入力してください" required />
        </div>

        <div className={styles.sectionLabel}>会社情報</div>

        <div className={styles.field}>
          <label className={styles.label}>会社名 <span className={styles.required}>*</span></label>
          <input type="text" value={form.companyName}
            onChange={(e) => setForm(prev => ({ ...prev, companyName: e.target.value }))}
            className={styles.input} placeholder="株式会社〇〇建設" required />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>都道府県</label>
          <select value={form.prefecture}
            onChange={(e) => setForm(prev => ({ ...prev, prefecture: e.target.value }))}
            className={styles.select}>
            <option value="">選択してください</option>
            {prefectures.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>会社の役割</label>
          <select value={form.companyRole}
            onChange={(e) => setForm(prev => ({ ...prev, companyRole: e.target.value }))}
            className={styles.select}>
            <option value="both">元請・下請（両方）</option>
            <option value="general_contractor">元請のみ</option>
            <option value="subcontractor">下請のみ</option>
          </select>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? <span className={styles.spinnerBtn} /> : '利用登録を申請する'}
        </button>

        <p className={styles.loginLink}>
          すでにアカウントをお持ちの方は <a href="/login">ログイン</a>
        </p>
      </form>
    </div>
  );
}

// ── メインページ ──────────────────────────────────────────────
function RegisterInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (token) {
    return <InviteRegisterForm token={token} />;
  }
  return <SelfRegisterForm />;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className={styles.loading}><div className={styles.spinner} /></div>}>
      <RegisterInner />
    </Suspense>
  );
}
