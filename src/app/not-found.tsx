import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFoundPage() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.code}>404</div>
        <h1 className={styles.title}>ページが見つかりません</h1>
        <p className={styles.desc}>
          お探しのページは存在しないか、移動・削除された可能性があります。
        </p>
        <div className={styles.actions}>
          <Link href="/dashboard" className={styles.primaryBtn}>
            ダッシュボードへ
          </Link>
          <Link href="/" className={styles.secondaryBtn}>
            トップページへ
          </Link>
        </div>
      </div>
    </div>
  );
}
