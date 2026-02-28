import Link from 'next/link';
import styles from './landing.module.css';

export default function LandingPage() {
  return (
    <div className={styles.wrapper}>
      {/* ヘッダー */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoText}>建設マッチング</span>
          </div>
          <Link href="/login" className={styles.loginBtn}>
            ログイン
          </Link>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>建設業専門マッチングプラットフォーム</p>
          <h1 className={styles.heroTitle}>
            最適なビジネスパートナーと<br />
            繋がる場所
          </h1>
          <p className={styles.heroDesc}>
            元請・下請のマッチングを、建設業29業種の許認可情報をもとに効率化。<br />
            信頼できるパートナーを、スムーズに見つけてください。
          </p>
          <div className={styles.heroCta}>
            <Link href="/login" className={styles.ctaPrimary}>
              会員ログイン
            </Link>
          </div>
        </div>
        <div className={styles.heroDecoration}>
          <div className={styles.heroDecorCircle1} />
          <div className={styles.heroDecorCircle2} />
          <div className={styles.heroDecorGrid} />
        </div>
      </section>

      {/* 特徴セクション */}
      <section className={styles.features}>
        <div className={styles.featuresInner}>
          <h2 className={styles.sectionTitle}>選ばれる理由</h2>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🏗️</div>
              <h3>建設業専門</h3>
              <p>29業種の建設業許可情報をもとに、業種・許認可に特化したマッチングを実現します。</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🤝</div>
              <h3>スマートレコメンド</h3>
              <p>業種・地域・規模・求める条件を分析し、最適なパートナー候補を自動でご提案します。</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>💬</div>
              <h3>安全なコミュニケーション</h3>
              <p>会員限定の安全な環境でメッセージのやり取りが可能。マッチング後にのみ連絡可能です。</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔒</div>
              <h3>会員限定・審査制</h3>
              <p>招待制による審査登録で、信頼できる企業のみが参加できる安全なコミュニティを維持します。</p>
            </div>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className={styles.footer}>
        <p>© 2025 建設マッチング. All rights reserved.</p>
      </footer>
    </div>
  );
}
