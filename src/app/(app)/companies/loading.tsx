import styles from './loading.module.css';

export default function CompaniesLoading() {
  return (
    <div className={styles.page}>
      <div className={`skeleton ${styles.titleSkeleton}`} />
      <div className={`skeleton ${styles.filterSkeleton}`} />
      <div className={styles.grid}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className={`skeleton ${styles.cardSkeleton}`} />
        ))}
      </div>
    </div>
  );
}
