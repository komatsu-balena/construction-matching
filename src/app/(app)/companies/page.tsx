import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import styles from './companies.module.css';
import { CONSTRUCTION_LICENSES } from '@/lib/constants/licenses';
import { PREFECTURES } from '@/lib/constants/prefectures';
import { companyRoleLabel } from '@/lib/utils/format';

export const metadata = { title: '企業を探す' };

interface SearchParams {
  q?: string;
  prefecture?: string;
  role?: string;
  license_type_id?: string;
  page?: string;
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user!.id)
    .single();

  const myCompanyId = userData?.company_id;

  const q = params.q ?? '';
  const prefecture = params.prefecture ?? '';
  const role = params.role ?? '';
  const licenseTypeId = params.license_type_id ? parseInt(params.license_type_id) : null;
  const page = parseInt(params.page ?? '1');
  const perPage = 20;
  const offset = (page - 1) * perPage;

  let query = supabase
    .from('companies')
    .select(`
      id, name, prefecture, city, company_role, logo_url, employee_count,
      description, is_profile_complete, member_since,
      licenses:company_licenses(license_type_id)
    `, { count: 'exact' })
    .eq('is_active', true)
    .neq('id', myCompanyId)
    .order('member_since', { ascending: false })
    .range(offset, offset + perPage - 1);

  if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  if (prefecture) query = query.eq('prefecture', prefecture);
  if (role) query = query.eq('company_role', role);

  const { data: companies, count } = await query;

  let filtered = companies ?? [];
  if (licenseTypeId) {
    filtered = filtered.filter((c: { licenses: { license_type_id: number }[] }) =>
      c.licenses?.some((l) => l.license_type_id === licenseTypeId)
    );
  }

  const totalPages = Math.ceil((count ?? 0) / perPage);

  // 自社のいいね済みIDを取得
  const { data: likedData } = await supabase
    .from('likes')
    .select('to_company_id')
    .eq('from_company_id', myCompanyId);

  const likedIds = new Set((likedData ?? []).map((l: { to_company_id: string }) => l.to_company_id));

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>企業を探す</h1>
        <p className={styles.pageDesc}>{count ?? 0}社が登録中</p>
      </div>

      {/* フィルター */}
      <div className={styles.filters}>
        <form method="GET" className={styles.filterForm}>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="会社名・説明文で検索..."
            className={styles.searchInput}
          />
          <select name="prefecture" defaultValue={prefecture} className={styles.select}>
            <option value="">都道府県（全て）</option>
            {PREFECTURES.map(p => (
              <option key={p.code} value={p.nameJa}>{p.nameJa}</option>
            ))}
          </select>
          <select name="role" defaultValue={role} className={styles.select}>
            <option value="">役割（全て）</option>
            <option value="general_contractor">元請</option>
            <option value="subcontractor">下請</option>
            <option value="both">元請・下請</option>
          </select>
          <select name="license_type_id" defaultValue={licenseTypeId?.toString() ?? ''} className={styles.select}>
            <option value="">許認可（全て）</option>
            {CONSTRUCTION_LICENSES.map(l => (
              <option key={l.id} value={l.id}>{l.nameJa}</option>
            ))}
          </select>
          <button type="submit" className={styles.searchBtn}>検索</button>
        </form>
      </div>

      {/* 企業一覧 */}
      <div className={styles.grid}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>条件に一致する企業が見つかりませんでした</p>
          </div>
        ) : (
          filtered.map((company: {
            id: string;
            name: string;
            prefecture: string;
            city: string | null;
            company_role: string;
            logo_url: string | null;
            employee_count: number | null;
            description: string | null;
            licenses: { license_type_id: number }[];
          }) => (
            <Link
              key={company.id}
              href={`/companies/${company.id}`}
              className={styles.card}
            >
              <div className={styles.cardHeader}>
                <div className={styles.avatar}>
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={company.name} />
                  ) : (
                    <span>{company.name.charAt(0)}</span>
                  )}
                </div>
                <div className={styles.cardInfo}>
                  <h3 className={styles.companyName}>{company.name}</h3>
                  <p className={styles.companyMeta}>
                    {company.prefecture}{company.city ? ` ${company.city}` : ''}
                  </p>
                </div>
                {likedIds.has(company.id) && (
                  <span className={styles.likedBadge}>❤️ いいね済み</span>
                )}
              </div>

              <div className={styles.badges}>
                <span className={styles.roleBadge}>
                  {companyRoleLabel(company.company_role)}
                </span>
                {company.employee_count && (
                  <span className={styles.metaBadge}>
                    {company.employee_count}名
                  </span>
                )}
                <span className={styles.metaBadge}>
                  許可 {company.licenses?.length ?? 0} 業種
                </span>
              </div>

              {company.description && (
                <p className={styles.description}>
                  {company.description.slice(0, 80)}
                  {company.description.length > 80 ? '…' : ''}
                </p>
              )}
            </Link>
          ))
        )}
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          {page > 1 && (
            <Link
              href={`?q=${q}&prefecture=${prefecture}&role=${role}&page=${page - 1}`}
              className={styles.pageBtn}
            >
              ← 前へ
            </Link>
          )}
          <span className={styles.pageInfo}>{page} / {totalPages}</span>
          {page < totalPages && (
            <Link
              href={`?q=${q}&prefecture=${prefecture}&role=${role}&page=${page + 1}`}
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
