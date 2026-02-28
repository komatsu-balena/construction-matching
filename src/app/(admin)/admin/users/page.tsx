import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import styles from './admin-users.module.css';

export const metadata = { title: 'ユーザー管理 | 管理ダッシュボード' };

interface SearchParams {
  q?: string;
  role?: string;
  page?: string;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();

  const search = searchParams.q ?? '';
  const roleFilter = searchParams.role ?? '';
  const page = Math.max(1, parseInt(searchParams.page ?? '1'));
  const perPage = 25;

  let query = supabase
    .from('users')
    .select(`
      id,
      full_name,
      email,
      role,
      position,
      created_at,
      companies(id, name, is_active)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (roleFilter) {
    query = query.eq('role', roleFilter);
  }

  const { data: users, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / perPage);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>ユーザー管理</h1>
        <span className={styles.totalBadge}>{count ?? 0}名</span>
      </div>

      {/* Filters */}
      <form method="GET" className={styles.filters}>
        <input
          type="text"
          name="q"
          defaultValue={search}
          placeholder="氏名・メールで検索..."
          className={styles.searchInput}
        />
        <select name="role" defaultValue={roleFilter} className={styles.select}>
          <option value="">全ての役割</option>
          <option value="admin">システム管理者</option>
          <option value="company_admin">企業管理者</option>
          <option value="member">メンバー</option>
        </select>
        <button type="submit" className={styles.searchBtn}>検索</button>
        {(search || roleFilter) && (
          <Link href="/admin/users" className={styles.clearBtn}>クリア</Link>
        )}
      </form>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>氏名</th>
              <th>メールアドレス</th>
              <th>役割</th>
              <th>所属企業</th>
              <th>役職</th>
              <th>登録日</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u: {
              id: string;
              full_name: string;
              email: string;
              role: string;
              position: string;
              created_at: string;
              companies: { id: string; name: string; is_active: boolean } | null;
            }) => (
              <tr key={u.id}>
                <td>
                  <span className={styles.userName}>{u.full_name || '—'}</span>
                </td>
                <td className={styles.email}>{u.email}</td>
                <td>
                  <span className={`${styles.roleBadge} ${
                    u.role === 'admin' ? styles.roleAdmin
                      : u.role === 'company_admin' ? styles.roleCompanyAdmin
                      : styles.roleMember
                  }`}>
                    {u.role === 'admin' ? 'システム管理者'
                      : u.role === 'company_admin' ? '企業管理者'
                      : 'メンバー'}
                  </span>
                </td>
                <td>
                  {u.companies ? (
                    <Link href={`/admin/companies/${u.companies.id}`} className={styles.companyLink}>
                      {u.companies.name}
                      {!u.companies.is_active && (
                        <span className={styles.inactiveMark}> (無効)</span>
                      )}
                    </Link>
                  ) : '—'}
                </td>
                <td>{u.position || '—'}</td>
                <td>{new Date(u.created_at).toLocaleDateString('ja-JP')}</td>
              </tr>
            ))}
            {(users ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className={styles.empty}>
                  該当するユーザーが見つかりません
                </td>
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
              href={`/admin/users?q=${search}&role=${roleFilter}&page=${page - 1}`}
              className={styles.pageBtn}
            >
              ← 前へ
            </Link>
          )}
          <span className={styles.pageInfo}>{page} / {totalPages}</span>
          {page < totalPages && (
            <Link
              href={`/admin/users?q=${search}&role=${roleFilter}&page=${page + 1}`}
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
