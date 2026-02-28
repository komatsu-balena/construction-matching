'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import styles from './settings.module.css';

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    newPass: '',
    confirm: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.newPass !== passwordForm.confirm) {
      setError('新しいパスワードが一致しません');
      return;
    }
    if (passwordForm.newPass.length < 8) {
      setError('パスワードは8文字以上にしてください');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPass,
      });
      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess('パスワードを変更しました');
        setPasswordForm({ current: '', newPass: '', confirm: '' });
        setTimeout(() => setSuccess(''), 4000);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>設定</h1>

      {/* Password Change */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>パスワード変更</h2>
        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}
        <form onSubmit={handlePasswordChange} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>新しいパスワード</label>
            <input
              type="password"
              value={passwordForm.newPass}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
              className={styles.input}
              placeholder="8文字以上"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>新しいパスワード（確認）</label>
            <input
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              className={styles.input}
              placeholder="もう一度入力"
              required
              autoComplete="new-password"
            />
          </div>
          <button type="submit" disabled={saving} className={styles.saveBtn}>
            {saving ? '変更中...' : 'パスワードを変更'}
          </button>
        </form>
      </div>

      {/* Sign Out */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>ログアウト</h2>
        <p className={styles.cardDesc}>このデバイスからログアウトします。</p>
        <button onClick={handleSignOut} className={styles.signOutBtn}>
          ログアウト
        </button>
      </div>

      {/* Danger Zone */}
      <div className={`${styles.card} ${styles.dangerCard}`}>
        <h2 className={`${styles.cardTitle} ${styles.dangerTitle}`}>危険な操作</h2>
        {!showDeleteConfirm ? (
          <>
            <p className={styles.cardDesc}>アカウントの削除は取り消せません。</p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className={styles.dangerBtn}
            >
              アカウントを削除
            </button>
          </>
        ) : (
          <div className={styles.confirmBox}>
            <p className={styles.confirmText}>
              本当に削除しますか？この操作は取り消せません。
            </p>
            <div className={styles.confirmBtns}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={styles.cancelBtn}
              >
                キャンセル
              </button>
              <button
                onClick={() => alert('アカウント削除機能は現在準備中です。管理者にお問い合わせください。')}
                className={styles.confirmDeleteBtn}
              >
                削除する
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
