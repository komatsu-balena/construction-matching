import { createClient } from '@/lib/supabase/server';
import styles from './admin-matches.module.css';

export const metadata = { title: 'マッチング管理 | 管理ダッシュボード' };

interface SearchParams {
  page?: string;
}

export default async function AdminMatchesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();

  const page = Math.max(1, parseInt(searchParams.page ?? '1'));
  const perPage = 20;

  const { data: matches, count } = await supabase
    .from('matches')
    .select(`
      id,
      status,
      matched_at,
      updated_at,
      company_a:companies!matches_company_a_id_fkey(id, name, prefecture),
      company_b:companies!matches_company_b_id_fkey(id, name, prefecture)
    `, { count: 'exact' })
    .order('matched_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  const totalPages = Math.ceil((count ?? 0) / perPage);

  // Stats
  const { count: totalCount } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true });

  const thisMonth = new Date(new Date().setDate(1)).toISOString();
  const { count: monthCount } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .gte('matched_at', thisMonth);

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>マッチング管理</h1>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{totalCount ?? 0}</span>
          <span className={styles.statLabel}>累計マッチング</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{monthCount ?? 0}</span>
          <span className={styles.statLabel}>今月のマッチング</span>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>企業A</th>
              <th>企業B</th>
              <th>マッチング日時</th>
              <th>最終活動</th>
            </tr>
          </thead>
          <tbody>
            {(matches ?? []).map((m: {
              id: string;
              status: string;
              matched_at: string;
              updated_at: string;
              company_a: { id: string; name: string; prefecture: string };
              company_b: { id: string; name: string; prefecture: string };
            }, idx: number) => (
              <tr key={m.id}>
                <td className={styles.indexCell}>
                  {(page - 1) * perPage + idx + 1}
                </td>
                <td>
                  <span className={styles.companyName}>{m.company_a?.name}</span>
                  {m.company_a?.prefecture && (
                    <span className={styles.prefecture}>{m.company_a.prefecture}</span>
                  )}
                </td>
                <td>
                  <span className={styles.companyName}>{m.company_b?.name}</span>
                  {m.company_b?.prefecture && (
                    <span className={styles.prefecture}>{m.company_b.prefecture}</span>
                  )}
                </td>
                <td>{new Date(m.matched_at).toLocaleString('ja-JP', {
                  year: 'numeric', month: '2-digit', day: '2-digit',
                  hour: '2-digit', minute: '2-digit',
                })}</td>
                <td className={styles.dateCell}>
                  {new Date(m.updated_at).toLocaleString('ja-JP', {
                    month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </td>
              </tr>
            ))}
            {(matches ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className={styles.empty}>まだマッチングがありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          {page > 1 && (
            <a href={`/admin/matches?page=${page - 1}`} className={styles.pageBtn}>
              ← 前へ
            </a>
          )}
          <span className={styles.pageInfo}>{page} / {totalPages}</span>
          {page < totalPages && (
            <a href={`/admin/matches?page=${page + 1}`} className={styles.pageBtn}>
              次へ →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
