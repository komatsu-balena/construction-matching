import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import ContactActions from './ContactActions';
import styles from './contacts.module.css';

export const metadata = { title: 'コンタクト | 建設マッチング' };

export default async function ContactsPage() {
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
    supabase
      .from('contact_requests')
      .select(`
        id,
        status,
        message,
        created_at,
        to_company:companies!contact_requests_to_company_id_fkey(id, name, prefecture, company_role, logo_url)
      `)
      .eq('from_company_id', companyId)
      .order('created_at', { ascending: false }),

    supabase
      .from('contact_requests')
      .select(`
        id,
        status,
        message,
        created_at,
        from_company:companies!contact_requests_from_company_id_fkey(id, name, prefecture, company_role, logo_url)
      `)
      .eq('to_company_id', companyId)
      .order('created_at', { ascending: false }),
  ]);

  const sent = sentRes.data ?? [];
  const received = receivedRes.data ?? [];
  const pendingCount = received.filter((r: { status: string }) => r.status === 'pending').length;

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>コンタクト</h1>

      <div className={styles.sections}>
        {/* Received */}
        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>受信したリクエスト ({received.length})</h2>
            {pendingCount > 0 && (
              <span className={styles.pendingBadge}>{pendingCount}件 承認待ち</span>
            )}
          </div>
          {received.length === 0 ? (
            <div className={styles.empty}>コンタクトリクエストがありません</div>
          ) : (
            <div className={styles.list}>
              {received.map((req: {
                id: string;
                status: string;
                message: string;
                created_at: string;
                from_company: { id: string; name: string; prefecture: string; company_role: string; logo_url: string };
              }) => (
                <div key={req.id} className={styles.requestCard}>
                  <Link href={`/companies/${req.from_company.id}`} className={styles.companyInfo}>
                    <div className={styles.logo}>
                      {req.from_company.logo_url ? (
                        <img src={req.from_company.logo_url} alt={req.from_company.name} />
                      ) : (
                        <span>{req.from_company.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className={styles.companyName}>{req.from_company.name}</p>
                      <p className={styles.companyMeta}>
                        {req.from_company.prefecture}
                        {' ・ '}
                        {req.from_company.company_role === 'general_contractor' ? '元請'
                          : req.from_company.company_role === 'subcontractor' ? '下請' : '元請・下請'}
                      </p>
                    </div>
                  </Link>
                  {req.message && (
                    <p className={styles.message}>"{req.message}"</p>
                  )}
                  <div className={styles.requestFooter}>
                    <span className={styles.date}>
                      {new Date(req.created_at).toLocaleDateString('ja-JP')}
                    </span>
                    {req.status === 'pending' ? (
                      <ContactActions requestId={req.id} />
                    ) : (
                      <StatusBadge status={req.status} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sent */}
        <section>
          <h2 className={styles.sectionTitle}>送信したリクエスト ({sent.length})</h2>
          {sent.length === 0 ? (
            <div className={styles.empty}>コンタクトリクエストを送っていません</div>
          ) : (
            <div className={styles.list}>
              {sent.map((req: {
                id: string;
                status: string;
                message: string;
                created_at: string;
                to_company: { id: string; name: string; prefecture: string; company_role: string; logo_url: string };
              }) => (
                <div key={req.id} className={styles.requestCard}>
                  <Link href={`/companies/${req.to_company.id}`} className={styles.companyInfo}>
                    <div className={styles.logo}>
                      {req.to_company.logo_url ? (
                        <img src={req.to_company.logo_url} alt={req.to_company.name} />
                      ) : (
                        <span>{req.to_company.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className={styles.companyName}>{req.to_company.name}</p>
                      <p className={styles.companyMeta}>
                        {req.to_company.prefecture}
                        {' ・ '}
                        {req.to_company.company_role === 'general_contractor' ? '元請'
                          : req.to_company.company_role === 'subcontractor' ? '下請' : '元請・下請'}
                      </p>
                    </div>
                  </Link>
                  {req.message && (
                    <p className={styles.message}>"{req.message}"</p>
                  )}
                  <div className={styles.requestFooter}>
                    <span className={styles.date}>
                      {new Date(req.created_at).toLocaleDateString('ja-JP')}
                    </span>
                    <StatusBadge status={req.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`${styles.statusBadge} ${
      status === 'accepted' ? styles.statusAccepted
        : status === 'rejected' ? styles.statusRejected
        : styles.statusPending
    }`}>
      {status === 'accepted' ? '承認済み'
        : status === 'rejected' ? '拒否'
        : '承認待ち'}
    </span>
  );
}
