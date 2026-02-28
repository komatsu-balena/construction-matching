'use client';

import { useEffect } from 'react';
import styles from './error.module.css';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.icon}>⚠️</div>
        <h1 className={styles.title}>エラーが発生しました</h1>
        <p className={styles.desc}>
          申し訳ございません。予期しないエラーが発生しました。
        </p>
        {error.digest && (
          <p className={styles.digest}>エラーID: {error.digest}</p>
        )}
        <div className={styles.actions}>
          <button onClick={reset} className={styles.retryBtn}>
            再試行
          </button>
          <a href="/dashboard" className={styles.homeBtn}>
            ダッシュボードへ
          </a>
        </div>
      </div>
    </div>
  );
}
