'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types/app';
import styles from './Header.module.css';

interface HeaderProps {
  user: (User & { company?: { name: string } | null }) | null;
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* 左：ページタイトル（スペーサー） */}
        <div className={styles.left} />

        {/* 右：アクション */}
        <div className={styles.right}>
          {/* 通知ベル */}
          <Link href="/notifications" className={styles.iconBtn} title="通知">
            <span className={styles.bellIcon}>🔔</span>
          </Link>

          {/* メッセージ */}
          <Link href="/messages" className={styles.iconBtn} title="メッセージ">
            <span className={styles.bellIcon}>💬</span>
          </Link>

          {/* ユーザーメニュー */}
          <div className={styles.userMenu}>
            <button
              className={styles.avatarBtn}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className={styles.avatar}>
                {user?.full_name?.charAt(0) ?? 'U'}
              </div>
            </button>

            {dropdownOpen && (
              <>
                <div
                  className={styles.backdrop}
                  onClick={() => setDropdownOpen(false)}
                />
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <p className={styles.dropdownName}>{user?.full_name ?? 'ユーザー'}</p>
                    <p className={styles.dropdownCompany}>{user?.company?.name ?? ''}</p>
                  </div>
                  <div className={styles.dropdownDivider} />
                  <Link
                    href="/profile"
                    className={styles.dropdownItem}
                    onClick={() => setDropdownOpen(false)}
                  >
                    👤 マイプロフィール
                  </Link>
                  <Link
                    href="/settings"
                    className={styles.dropdownItem}
                    onClick={() => setDropdownOpen(false)}
                  >
                    ⚙️ 設定
                  </Link>
                  <div className={styles.dropdownDivider} />
                  <button
                    className={`${styles.dropdownItem} ${styles.signOut}`}
                    onClick={handleSignOut}
                  >
                    🚪 ログアウト
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
