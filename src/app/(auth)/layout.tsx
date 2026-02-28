import styles from './auth.module.css';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.leftPanel}>
        <div className={styles.leftContent}>
          <div className={styles.logo}>
            <span className={styles.logoText}>建設マッチング</span>
          </div>
          <h2 className={styles.tagline}>
            建設業者専門の<br />
            ビジネスマッチング
          </h2>
          <p className={styles.subTagline}>
            29業種の建設業許可情報をもとに、<br />
            最適なビジネスパートナーをご紹介します。
          </p>
          <div className={styles.decorCircle1} />
          <div className={styles.decorCircle2} />
          <div className={styles.decorGrid} />
        </div>
      </div>
      <div className={styles.rightPanel}>
        <div className={styles.formContainer}>
          {children}
        </div>
      </div>
    </div>
  );
}
