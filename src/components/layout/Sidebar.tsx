'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User } from '@/types/app';
import styles from './Sidebar.module.css';

interface SidebarProps {
  user: (User & { company?: { name: string; logo_url?: string | null } | null }) | null;
}

const NAV_ITEMS = [
  { href: '/dashboard',     icon: '🏠', label: 'ダッシュボード' },
  { href: '/companies',     icon: '🔍', label: '企業を探す' },
  { href: '/matches',       icon: '🤝', label: 'マッチング' },
  { href: '/likes',         icon: '❤️', label: 'いいね' },
  { href: '/contacts',      icon: '📋', label: 'コンタクト' },
  { href: '/messages',      icon: '💬', label: 'メッセージ' },
  { href: '/notifications', icon: '🔔', label: '通知' },
];

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className={styles.sidebar}>
      {/* ロゴ */}
      <div className={styles.logoArea}>
        <Link href="/dashboard" className={styles.logoLink}>
          <span className={styles.logoText}>建設マッチング</span>
        </Link>
      </div>

      {/* 会社情報 */}
      {user?.company && (
        <div className={styles.companyInfo}>
          <div className={styles.companyAvatar}>
            {user.company.logo_url ? (
              <img src={user.company.logo_url} alt={user.company.name} className={styles.companyLogo} />
            ) : (
              <span className={styles.companyInitial}>
                {user.company.name.charAt(0)}
              </span>
            )}
          </div>
          <div className={styles.companyMeta}>
            <p className={styles.companyName}>{user.company.name}</p>
            <p className={styles.userName}>{user?.full_name ?? ''}</p>
          </div>
        </div>
      )}

      {/* ナビゲーション */}
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
                {isActive(item.href) && <span className={styles.activeIndicator} />}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* フッターリンク */}
      <div className={styles.sidebarFooter}>
        <Link href="/profile" className={styles.footerLink}>
          <span>👤</span> マイプロフィール
        </Link>
        <Link href="/settings" className={styles.footerLink}>
          <span>⚙️</span> 設定
        </Link>
      </div>
    </aside>
  );
}
