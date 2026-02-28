import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import styles from './notifications.module.css';
import { formatRelativeTime } from '@/lib/utils/format';

export const metadata = { title: '通知' };

const TYPE_ICONS: Record<string, string> = {
  new_like: '❤️',
  new_match: '🤝',
  contact_request: '📋',
  contact_accepted: '✅',
  new_message: '💬',
  system: '🔔',
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*, related_company:companies!notifications_related_company_id_fkey(id, name, logo_url)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50);

  // 全既読にする
  await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', user!.id)
    .eq('is_read', false);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>通知</h1>
      </div>

      {(!notifications || notifications.length === 0) ? (
        <div className={styles.empty}>
          <p>通知はありません</p>
        </div>
      ) : (
        <div className={styles.list}>
          {notifications.map((n: {
            id: string;
            type: string;
            title: string;
            body: string | null;
            link: string | null;
            is_read: boolean;
            created_at: string;
            related_company: { id: string; name: string; logo_url: string | null } | null;
          }) => (
            <div
              key={n.id}
              className={`${styles.item} ${!n.is_read ? styles.unread : ''}`}
            >
              <div className={styles.icon}>
                {n.related_company?.logo_url ? (
                  <img src={n.related_company.logo_url} alt={n.related_company.name} />
                ) : (
                  <span>{TYPE_ICONS[n.type] ?? '🔔'}</span>
                )}
              </div>
              <div className={styles.content}>
                <p className={styles.title}>{n.title}</p>
                {n.body && <p className={styles.body}>{n.body}</p>}
                <p className={styles.time}>{formatRelativeTime(n.created_at)}</p>
              </div>
              {n.link && (
                <Link href={n.link} className={styles.linkBtn}>
                  確認 →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
