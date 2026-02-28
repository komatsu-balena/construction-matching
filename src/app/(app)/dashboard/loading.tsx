import styles from './loading.module.css';

export default function DashboardLoading() {
  return (
    <div className={styles.page}>
      <div className={`skeleton ${styles.titleSkeleton}`} />
      <div className={styles.statsRow}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={`skeleton ${styles.statSkeleton}`} />
        ))}
      </div>
      <div className={`skeleton ${styles.sectionTitle}`} />
      <div className={styles.grid}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className={`skeleton ${styles.cardSkeleton}`} />
        ))}
      </div>
    </div>
  );
}
