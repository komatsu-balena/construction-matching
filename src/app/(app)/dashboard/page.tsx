import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import styles from './dashboard.module.css';
import { formatRelativeTime } from '@/lib/utils/format';

export const metadata = { title: 'ダッシュボード' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: userData } = await supabase
    .from('users')
    .select('*, company:companies(*, licenses:company_licenses(*, license_type:license_types(*)))')
    .eq('id', user!.id)
    .single();

  const myCompanyId = userData?.company_id;

  // 統計取得
  const [matchesRes, likesReceivedRes, unreadRes, recommendationsRes] = await Promise.all([
    supabase.from('matches').select('id', { count: 'exact', head: true })
      .or(`company_a_id.eq.${myCompanyId},company_b_id.eq.${myCompanyId}`)
      .eq('status', 'matched'),
    supabase.from('likes').select('id', { count: 'exact', head: true })
      .eq('to_company_id', myCompanyId),
    supabase.from('messages').select('id', { count: 'exact', head: true })
      .eq('is_read', false)
      .neq('sender_company_id', myCompanyId),
    supabase.from('companies').select(`
      id, name, prefecture, company_role, logo_url, employee_count,
      licenses:company_licenses(license_type_id)
    `)
      .eq('is_active', true)
      .neq('id', myCompanyId)
      .limit(6),
  ]);

  const stats = {
    matches: matchesRes.count ?? 0,
    likesReceived: likesReceivedRes.count ?? 0,
    unread: unreadRes.count ?? 0,
  };

  const recommendations = recommendationsRes.data ?? [];

  // 最近のマッチ
  const { data: recentMatches } = await supabase
    .from('matches')
    .select(`
      id, matched_at,
      company_a:companies!matches_company_a_id_fkey(id, name, logo_url, prefecture),
      company_b:companies!matches_company_b_id_fkey(id, name, logo_url, prefecture)
    `)
    .or(`company_a_id.eq.${myCompanyId},company_b_id.eq.${myCompanyId}`)
    .eq('status', 'matched')
    .order('matched_at', { ascending: false })
    .limit(3);

  const isProfileComplete = userData?.company?.is_profile_complete ?? false;

  return (
    <div className={styles.page}>
      {/* ウェルカムバナー */}
      <section className={styles.welcomeBanner}>
        <div className={styles.welcomeContent}>
          <h1 className={styles.welcomeTitle}>
            おかえりなさい、{userData?.full_name?.split(' ')[0] ?? 'ユーザー'}さん
          </h1>
          <p className={styles.welcomeDesc}>
            {userData?.company?.name} のダッシュボードです
          </p>
        </div>
        {!isProfileComplete && (
          <Link href="/profile/edit" className={styles.profileCta}>
            プロフィールを完成させる →
          </Link>
        )}
      </section>

      {/* 統計カード */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🤝</div>
          <div className={styles.statInfo}>
            <p className={styles.statValue}>{stats.matches}</p>
            <p className={styles.statLabel}>マッチング数</p>
          </div>
          <Link href="/matches" className={styles.statLink}>詳細 →</Link>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>❤️</div>
          <div className={styles.statInfo}>
            <p className={styles.statValue}>{stats.likesReceived}</p>
            <p className={styles.statLabel}>受け取ったいいね</p>
          </div>
          <Link href="/likes" className={styles.statLink}>詳細 →</Link>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>💬</div>
          <div className={styles.statInfo}>
            <p className={`${styles.statValue} ${stats.unread > 0 ? styles.statValueAlert : ''}`}>
              {stats.unread}
            </p>
            <p className={styles.statLabel}>未読メッセージ</p>
          </div>
          <Link href="/messages" className={styles.statLink}>確認 →</Link>
        </div>
      </section>

      {/* おすすめ企業 */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>おすすめ企業</h2>
          <Link href="/companies" className={styles.seeAll}>全て表示 →</Link>
        </div>
        <div className={styles.recommendGrid}>
          {recommendations.length === 0 ? (
            <p className={styles.empty}>まだおすすめ企業がありません</p>
          ) : (
            recommendations.map((company: {
              id: string;
              name: string;
              prefecture: string;
              company_role: string;
              logo_url: string | null;
              employee_count: number | null;
              licenses: { license_type_id: number }[];
            }) => (
              <Link
                key={company.id}
                href={`/companies/${company.id}`}
                className={styles.companyCard}
              >
                <div className={styles.companyCardAvatar}>
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={company.name} />
                  ) : (
                    <span>{company.name.charAt(0)}</span>
                  )}
                </div>
                <div className={styles.companyCardInfo}>
                  <p className={styles.companyCardName}>{company.name}</p>
                  <p className={styles.companyCardMeta}>
                    {company.prefecture} ・ {
                      company.company_role === 'general_contractor' ? '元請' :
                      company.company_role === 'subcontractor' ? '下請' : '元請・下請'
                    }
                  </p>
                  <p className={styles.companyCardLicenses}>
                    許可 {company.licenses?.length ?? 0} 業種
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* 最近のマッチ */}
      {(recentMatches?.length ?? 0) > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>最近のマッチング</h2>
            <Link href="/matches" className={styles.seeAll}>全て表示 →</Link>
          </div>
          <div className={styles.matchList}>
            {(recentMatches as any[]).map((match: any) => {
              const rawA = Array.isArray(match.company_a) ? match.company_a[0] : match.company_a;
              const rawB = Array.isArray(match.company_b) ? match.company_b[0] : match.company_b;
              const partner = rawA?.id === myCompanyId ? rawB : rawA;
              return (
                <Link key={match.id} href={`/messages/${match.id}`} className={styles.matchItem}>
                  <div className={styles.matchAvatar}>
                    {partner?.logo_url ? (
                      <img src={partner.logo_url} alt={partner.name} />
                    ) : (
                      <span>{partner?.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className={styles.matchInfo}>
                    <p className={styles.matchName}>{partner?.name}</p>
                    <p className={styles.matchMeta}>{partner?.prefecture}</p>
                  </div>
                  <p className={styles.matchTime}>{formatRelativeTime(match.matched_at)}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
