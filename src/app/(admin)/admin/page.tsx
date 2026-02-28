import { createClient } from '@/lib/supabase/server';
import styles from './admin-dashboard.module.css';

export const metadata = { title: '管理ダッシュボード' };

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    totalCompaniesRes,
    activeCompaniesRes,
    totalUsersRes,
    totalMatchesRes,
    totalMessagesRes,
    newCompaniesRes,
    newMatchesRes,
  ] = await Promise.all([
    supabase.from('companies').select('id', { count: 'exact', head: true }),
    supabase.from('companies').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('matches').select('id', { count: 'exact', head: true }).eq('status', 'matched'),
    supabase.from('messages').select('id', { count: 'exact', head: true }),
    supabase.from('companies').select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setDate(1)).toISOString()),
    supabase.from('matches').select('id', { count: 'exact', head: true })
      .eq('status', 'matched')
      .gte('matched_at', new Date(new Date().setDate(1)).toISOString()),
  ]);

  const stats = [
    { label: '総企業数', value: totalCompaniesRes.count ?? 0, sub: `有効: ${activeCompaniesRes.count ?? 0}社`, icon: '🏢', color: 'navy' },
    { label: '総ユーザー数', value: totalUsersRes.count ?? 0, icon: '👥', color: 'blue' },
    { label: 'マッチング数', value: totalMatchesRes.count ?? 0, sub: `今月: ${newMatchesRes.count ?? 0}件`, icon: '🤝', color: 'green' },
    { label: 'メッセージ数', value: totalMessagesRes.count ?? 0, icon: '💬', color: 'purple' },
    { label: '今月の新規企業', value: newCompaniesRes.count ?? 0, icon: '🆕', color: 'gold' },
  ];

  // 最近の企業
  const { data: recentCompanies } = await supabase
    .from('companies')
    .select('id, name, prefecture, company_role, is_active, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>管理ダッシュボード</h1>

      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} className={`${styles.statCard} ${styles[stat.color]}`}>
            <div className={styles.statIcon}>{stat.icon}</div>
            <div className={styles.statInfo}>
              <p className={styles.statValue}>{stat.value.toLocaleString()}</p>
              <p className={styles.statLabel}>{stat.label}</p>
              {stat.sub && <p className={styles.statSub}>{stat.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>最近登録された企業</h2>
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>会社名</th>
                <th>都道府県</th>
                <th>役割</th>
                <th>ステータス</th>
              </tr>
            </thead>
            <tbody>
              {(recentCompanies ?? []).map((c: {
                id: string;
                name: string;
                prefecture: string;
                company_role: string;
                is_active: boolean;
              }) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.prefecture}</td>
                  <td>{c.company_role === 'general_contractor' ? '元請' : c.company_role === 'subcontractor' ? '下請' : '元請・下請'}</td>
                  <td>
                    <span className={c.is_active ? styles.badgeActive : styles.badgeInactive}>
                      {c.is_active ? '有効' : '無効'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
