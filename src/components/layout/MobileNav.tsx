'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './MobileNav.module.css';

const NAV_ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'ホーム' },
  { href: '/companies', icon: '🔍', label: '検索' },
  { href: '/matches',   icon: '🤝', label: 'マッチ' },
  { href: '/messages',  icon: '💬', label: 'メッセージ' },
  { href: '/profile',   icon: '👤', label: 'プロフィール' },
];

export default function MobileNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
        >
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
