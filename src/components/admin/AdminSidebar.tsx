'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AdminSidebar.module.css';

const NAV_ITEMS = [
  { href: '/admin',                  icon: '📊', label: 'ダッシュボード', exact: true },
  { href: '/admin/registrations',    icon: '📋', label: '登録申請管理' },
  { href: '/admin/companies',        icon: '🏢', label: '企業管理' },
  { href: '/admin/users',            icon: '👥', label: 'ユーザー管理' },
  { href: '/admin/matches',          icon: '🤝', label: 'マッチング管理' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoArea}>
        <Link href="/admin" className={styles.logoLink}>
          <span className={styles.logoText}>管理画面</span>
          <span className={styles.logoSub}>建設マッチング</span>
        </Link>
      </div>

      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`${styles.navItem} ${isActive(item.href, item.exact) ? styles.active : ''}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.sidebarFooter}>
        <Link href="/dashboard" className={styles.footerLink}>
          ← 会員ページに戻る
        </Link>
      </div>
    </aside>
  );
}
