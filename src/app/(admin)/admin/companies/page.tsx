import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import styles from './admin-companies.module.css';

export const metadata = { title: '企業管理 | 管理ダッシュボード' };

interface SearchParams {
  q?: string;
  role?: string;
  status?: string;
  page?: string;
}

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();

  const search = searchParams.q ?? '';
  const roleFilter = searchParams.role ?? '';
  const statusFilter = searchParams.status ?? '';
  const page = Math.max(1, parseInt(searchParams.page ?? '1'));
  const perPage = 20;

  let query = supabase
    .from('companies')
    .select('id, name, prefecture, company_role, is_active, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (search) query = query.ilike('name', `%${search}%`);
  if (roleFilter) query = query.eq('company_role', roleFilter);
  if (statusFilter === 'active') query = query.eq('is_active', true);
  if (statusFilter === 'inactive') query = query.eq('is_active', false);

  const { data: companies, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / perPage);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>企業管理</h1>
        <Link href="/admin/companies/invite" className={styles.inviteBtn}>
          + 企業を招待
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className={styles.filters}>
        <input
          type="text"
          name="q"
          defaultValue={search}
          placeholder="会社名で検索..."
          className={styles.searchInput}
        />
        <select name="role" defaultValue={roleFilter} className={styles.select}>
          <option value="">全ての役割</option>
          <option value="general_contractor">元請</option>
          <option value="subcontractor">下請</option>
          <option value="both">元請・下請</option>
        </select>
        <select name="status" defaultValue={statusFilter} className={styles.select}>
          <option value="">全てのステータス</option>
          <option value="active">有効</option>
          <option value="inactive">無効</option>
        </select>
        <button type="submit" className={styles.searchBtn}>検索</button>
        {(search || roleFilter || statusFilter) && (
          <Link href="/admin/companies" className={styles.clearBtn}>クリア</Link>
        )}
      </form>

      {/* Results info */}
      <p className={styles.resultInfo}>
        {count ?? 0}社中 {(page - 1) * perPage + 1}〜{Math.min(page * perPage, count ?? 0)}件表示
      </p>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>会社名</th>
              <th>都道府県</th>
              <th>役割</th>
              <th>ステータス</th>
              <th>登録日</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {(companies ?? []).map((c: {
              id: string;
              name: string;
              prefecture: string;
              company_role: string;
              is_active: boolean;
              created_at: string;
            }) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/admin/companies/${c.id}`} className={styles.companyLink}>
                    {c.name}
                  </Link>
                </td>
                <td>{c.prefecture || '—'}</td>
                <td>
                  <span className={`${styles.roleBadge} ${styles[c.company_role]}`}>
                    {c.company_role === 'general_contractor' ? '元請'
                      : c.company_role === 'subcontractor' ? '下請' : '元請・下請'}
                  </span>
                </td>
                <td>
                  <span className={c.is_active ? styles.badgeActive : styles.badgeInactive}>
                    {c.is_active ? '有効' : '無効'}
                  </span>
                </td>
                <td>{new Date(c.created_at).toLocaleDateString('ja-JP')}</td>
                <td>
                  <div className={styles.actions}>
                    <Link href={`/admin/companies/${c.id}`} className={styles.actionBtn}>
                      詳細
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {(companies ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className={styles.empty}>該当する企業が見つかりません</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          {page > 1 && (
            <Link
              href={`/admin/companies?q=${search}&role=${roleFilter}&status=${statusFilter}&page=${page - 1}`}
              className={styles.pageBtn}
            >
              ← 前へ
            </Link>
          )}
          <span className={styles.pageInfo}>{page} / {totalPages}</span>
          {page < totalPages && (
            <Link
              href={`/admin/companies?q=${search}&role=${roleFilter}&status=${statusFilter}&page=${page + 1}`}
              className={styles.pageBtn}
            >
              次へ →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
