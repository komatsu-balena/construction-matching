import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import styles from './messages.module.css';
import { formatRelativeTime, truncate } from '@/lib/utils/format';

export const metadata = { title: 'メッセージ' };

export default async function MessagesPage() {
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
      id, updated_at, matched_at,
      company_a:companies!matches_company_a_id_fkey(id, name, logo_url, prefecture),
      company_b:companies!matches_company_b_id_fkey(id, name, logo_url, prefecture)
    `)
    .or(`company_a_id.eq.${myCompanyId},company_b_id.eq.${myCompanyId}`)
    .eq('status', 'matched')
    .order('updated_at', { ascending: false });

  // 各マッチの最新メッセージと未読数を取得
  const matchIds = (matches ?? []).map((m: { id: string }) => m.id);

  let lastMessages: Record<string, { content: string; created_at: string; sender_company_id: string }> = {};
  let unreadCounts: Record<string, number> = {};

  if (matchIds.length > 0) {
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('match_id, content, created_at, sender_company_id, is_read')
      .in('match_id', matchIds)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    (recentMessages ?? []).forEach((msg: {
      match_id: string;
      content: string;
      created_at: string;
      sender_company_id: string;
      is_read: boolean;
    }) => {
      if (!lastMessages[msg.match_id]) {
        lastMessages[msg.match_id] = msg;
      }
      if (!msg.is_read && msg.sender_company_id !== myCompanyId) {
        unreadCounts[msg.match_id] = (unreadCounts[msg.match_id] ?? 0) + 1;
      }
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>メッセージ</h1>
      </div>

      {(!matches || matches.length === 0) ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>💬</div>
          <h3>まだメッセージはありません</h3>
          <p>マッチングが成立した企業とメッセージのやり取りができます</p>
          <Link href="/companies" className={styles.emptyBtn}>
            企業を探す →
          </Link>
        </div>
      ) : (
        <div className={styles.conversationList}>
          {(matches as any[]).map((match: any) => {
            const rawA = Array.isArray(match.company_a) ? match.company_a[0] : match.company_a;
            const rawB = Array.isArray(match.company_b) ? match.company_b[0] : match.company_b;
            const partner = rawA?.id === myCompanyId ? rawB : rawA;
            const lastMsg = lastMessages[match.id];
            const unread = unreadCounts[match.id] ?? 0;

            return (
              <Link
                key={match.id}
                href={`/messages/${match.id}`}
                className={`${styles.conversation} ${unread > 0 ? styles.hasUnread : ''}`}
              >
                <div className={styles.avatar}>
                  {partner?.logo_url ? (
                    <img src={partner.logo_url} alt={partner.name} />
                  ) : (
                    <span>{partner?.name?.charAt(0)}</span>
                  )}
                </div>
                <div className={styles.info}>
                  <div className={styles.infoTop}>
                    <span className={styles.partnerName}>{partner?.name}</span>
                    {lastMsg && (
                      <span className={styles.time}>{formatRelativeTime(lastMsg.created_at)}</span>
                    )}
                  </div>
                  <div className={styles.preview}>
                    <span className={styles.previewText}>
                      {lastMsg
                        ? (lastMsg.sender_company_id === myCompanyId ? '自分: ' : '') + truncate(lastMsg.content, 50)
                        : 'メッセージを開始してください'}
                    </span>
                    {unread > 0 && (
                      <span className={styles.unreadBadge}>{unread}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
