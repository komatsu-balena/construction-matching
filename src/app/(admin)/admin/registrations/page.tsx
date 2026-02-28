import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import styles from './admin-registrations.module.css';
import AdminRegistrationActions from './AdminRegistrationActions';

export const metadata = { title: '登録申請管理 | 管理ダッシュボード' };

export default async function AdminRegistrationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 承認待ちユーザーを取得（is_active = false かつ role != admin）
  const adminClient = createAdminClient();
  const { data: pendingUsers } = await adminClient
    .from('users')
    .select(`
      id,
      full_name,
      email,
      created_at,
      companies!inner(id, name, prefecture, company_role, is_active)
    `)
    .eq('is_active', false)
    .neq('role', 'admin')
    .order('created_at', { ascending: false });

  const count = pendingUsers?.length ?? 0;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>登録申請管理</h1>
          <p className={styles.pageDesc}>承認待ちの登録申請を確認・承認してください</p>
        </div>
        {count > 0 && (
          <span className={styles.badge}>{count}件 待機中</span>
        )}
      </div>

      {count === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>✅</div>
          <h3>承認待ちの申請はありません</h3>
          <p>新しい登録申請が届くとここに表示されます</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>申請者</th>
                <th>メールアドレス</th>
                <th>会社名</th>
                <th>所在地</th>
                <th>会社の役割</th>
                <th>申請日時</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {(pendingUsers ?? []).map((u: any) => {
                const company = Array.isArray(u.companies) ? u.companies[0] : u.companies;
                return (
                  <tr key={u.id}>
                    <td>
                      <span className={styles.userName}>{u.full_name || '（未設定）'}</span>
                    </td>
                    <td className={styles.email}>{u.email}</td>
                    <td>
                      <span className={styles.companyName}>{company?.name ?? '—'}</span>
                    </td>
                    <td>{company?.prefecture ?? '—'}</td>
                    <td>
                      <span className={styles.roleBadge}>
                        {company?.company_role === 'general_contractor' ? '元請'
                          : company?.company_role === 'subcontractor' ? '下請'
                          : '元請・下請'}
                      </span>
                    </td>
                    <td>{new Date(u.created_at).toLocaleString('ja-JP', {
                      year: 'numeric', month: '2-digit', day: '2-digit',
                      hour: '2-digit', minute: '2-digit'
                    })}</td>
                    <td>
                      <AdminRegistrationActions
                        userId={u.id}
                        userName={u.full_name || u.email}
                        companyName={company?.name ?? '不明'}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
