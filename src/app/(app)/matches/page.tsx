import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import styles from './matches.module.css';
import { formatDate } from '@/lib/utils/format';

export const metadata = { title: 'マッチング' };

export default async function MatchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user!.id)
    .single();

  const myCompanyId = userData?.company_id;

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, matched_at, updated_at, match_score,
      company_a:companies!matches_company_a_id_fkey(id, name, logo_url, prefecture, company_role, employee_count),
      company_b:companies!matches_company_b_id_fkey(id, name, logo_url, prefecture, company_role, employee_count)
    `)
    .or(`company_a_id.eq.${myCompanyId},company_b_id.eq.${myCompanyId}`)
    .eq('status', 'matched')
    .order('matched_at', { ascending: false });

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>マッチング</h1>
        <p className={styles.count}>{matches?.length ?? 0}件のマッチング</p>
      </div>

      {(!matches || matches.length === 0) ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🤝</div>
          <h3>まだマッチングはありません</h3>
          <p>気になる企業に「いいね」して、マッチングを目指しましょう</p>
          <Link href="/companies" className={styles.emptyBtn}>企業を探す →</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {(matches as any[]).map((match: any) => {
            const rawA = Array.isArray(match.company_a) ? match.company_a[0] : match.company_a;
            const rawB = Array.isArray(match.company_b) ? match.company_b[0] : match.company_b;
            const partner = rawA?.id === myCompanyId ? rawB : rawA;
            return (
              <div key={match.id} className={styles.card}>
                <div className={styles.cardMain}>
                  <div className={styles.avatar}>
                    {partner?.logo_url ? (
                      <img src={partner.logo_url} alt={partner.name} />
                    ) : (
                      <span>{partner?.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className={styles.info}>
                    <h3 className={styles.name}>{partner?.name}</h3>
                    <p className={styles.meta}>
                      {partner?.prefecture} ・ {
                        partner?.company_role === 'general_contractor' ? '元請' :
                        partner?.company_role === 'subcontractor' ? '下請' : '元請・下請'
                      }
                      {partner?.employee_count ? ` ・ ${partner.employee_count}名` : ''}
                    </p>
                    <p className={styles.matchDate}>マッチング日: {formatDate(match.matched_at)}</p>
                  </div>
                </div>
                <div className={styles.actions}>
                  <Link href={`/messages/${match.id}`} className={styles.msgBtn}>
                    💬 メッセージ
                  </Link>
                  <Link href={`/companies/${partner?.id}`} className={styles.profileBtn}>
                    プロフィール
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
