import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ChatWindow from './ChatWindow';
import styles from './chat.module.css';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: userData } = await supabase
    .from('users')
    .select('company_id, full_name')
    .eq('id', user!.id)
    .single();

  const myCompanyId = userData?.company_id;

  // マッチ情報取得
  const { data: match } = await supabase
    .from('matches')
    .select(`
      id, status,
      company_a:companies!matches_company_a_id_fkey(id, name, logo_url),
      company_b:companies!matches_company_b_id_fkey(id, name, logo_url)
    `)
    .eq('id', matchId)
    .or(`company_a_id.eq.${myCompanyId},company_b_id.eq.${myCompanyId}`)
    .single();

  if (!match) notFound();

  const partner = match.company_a?.id === myCompanyId ? match.company_b : match.company_a;

  // 初期メッセージ取得
  const { data: initialMessages } = await supabase
    .from('messages')
    .select(`
      id, content, created_at, sender_company_id,
      sender_user:users!messages_sender_user_id_fkey(id, full_name, avatar_url)
    `)
    .eq('match_id', matchId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
    .limit(50);

  // 未読を既読に
  await supabase
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('match_id', matchId)
    .eq('is_read', false)
    .neq('sender_company_id', myCompanyId);

  return (
    <div className={styles.page}>
      {/* チャットヘッダー */}
      <div className={styles.chatHeader}>
        <Link href="/messages" className={styles.backBtn}>← 戻る</Link>
        <div className={styles.partnerInfo}>
          <div className={styles.partnerAvatar}>
            {partner?.logo_url ? (
              <img src={partner.logo_url} alt={partner.name} />
            ) : (
              <span>{partner?.name?.charAt(0)}</span>
            )}
          </div>
          <div>
            <p className={styles.partnerName}>{partner?.name}</p>
            <p className={styles.partnerStatus}>マッチング成立</p>
          </div>
        </div>
        {partner && (
          <Link href={`/companies/${partner.id}`} className={styles.profileBtn}>
            プロフィール →
          </Link>
        )}
      </div>

      {/* チャットウィンドウ（クライアントコンポーネント） */}
      <ChatWindow
        matchId={matchId}
        initialMessages={initialMessages ?? []}
        myCompanyId={myCompanyId ?? ''}
        currentUserId={user!.id}
      />
    </div>
  );
}
