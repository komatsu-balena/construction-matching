import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import styles from './likes.module.css';

export const metadata = { title: 'いいね | 建設マッチング' };

export default async function LikesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single();

  const companyId = profile?.company_id;

  const [sentRes, receivedRes] = await Promise.all([
    // いいね送信
    supabase
      .from('likes')
      .select(`
        id,
        created_at,
        to_company:companies!likes_to_company_id_fkey(
          id, name, prefecture, company_role, logo_url, description
        )
      `)
      .eq('from_company_id', companyId)
      .order('created_at', { ascending: false }),

    // いいね受信
    supabase
      .from('likes')
      .select(`
        id,
        created_at,
        from_company:companies!likes_from_company_id_fkey(
          id, name, prefecture, company_role, logo_url, description
        )
      `)
      .eq('to_company_id', companyId)
      .order('created_at', { ascending: false }),
  ]);

  const sentLikes = sentRes.data ?? [];
  const receivedLikes = receivedRes.data ?? [];

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>いいね</h1>

      <div className={styles.tabs}>
        <div className={styles.tab}>
          <span className={styles.tabLabel}>もらったいいね</span>
          <span className={styles.tabCount}>{receivedLikes.length}</span>
        </div>
        <div className={`${styles.tab} ${styles.tabRight}`}>
          <span className={styles.tabLabel}>送ったいいね</span>
          <span className={styles.tabCount}>{sentLikes.length}</span>
        </div>
      </div>

      <div className={styles.sections}>
        {/* Received */}
        <section>
          <h2 className={styles.sectionTitle}>もらったいいね ({receivedLikes.length})</h2>
          {receivedLikes.length === 0 ? (
            <div className={styles.empty}>
              <p>まだいいねをもらっていません</p>
              <p className={styles.emptyHint}>プロフィールを充実させましょう！</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {receivedLikes.map((like: any) => (
                <LikeCard
                  key={like.id}
                  company={like.from_company}
                  date={like.created_at}
                  type="received"
                />
              ))}
            </div>
          )}
        </section>

        {/* Sent */}
        <section>
          <h2 className={styles.sectionTitle}>送ったいいね ({sentLikes.length})</h2>
          {sentLikes.length === 0 ? (
            <div className={styles.empty}>
              <p>まだいいねを送っていません</p>
              <Link href="/companies" className={styles.browseLink}>
                企業を探す →
              </Link>
            </div>
          ) : (
            <div className={styles.grid}>
              {sentLikes.map((like: any) => (
                <LikeCard
                  key={like.id}
                  company={like.to_company}
                  date={like.created_at}
                  type="sent"
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function LikeCard({
  company,
  date,
  type,
}: {
  company: {
    id: string;
    name: string;
    prefecture: string;
    company_role: string;
    logo_url: string;
    description: string;
  };
  date: string;
  type: 'sent' | 'received';
}) {
  return (
    <Link href={`/companies/${company.id}`} className={styles.card}>
      <div className={styles.cardLogo}>
        {company.logo_url ? (
          <img src={company.logo_url} alt={company.name} className={styles.logoImg} />
        ) : (
          <span className={styles.logoFallback}>
            {company.name.charAt(0)}
          </span>
        )}
      </div>
      <div className={styles.cardInfo}>
        <p className={styles.cardName}>{company.name}</p>
        <p className={styles.cardMeta}>
          {company.prefecture && <span>{company.prefecture}</span>}
          <span>
            {company.company_role === 'general_contractor' ? '元請'
              : company.company_role === 'subcontractor' ? '下請' : '元請・下請'}
          </span>
        </p>
        {company.description && (
          <p className={styles.cardDesc}>{company.description}</p>
        )}
      </div>
      <div className={styles.cardFooter}>
        <span className={type === 'received' ? styles.heartReceived : styles.heartSent}>
          ♥
        </span>
        <span className={styles.cardDate}>
          {new Date(date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </Link>
  );
}
