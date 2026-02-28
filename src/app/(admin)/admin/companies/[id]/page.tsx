import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './company-detail.module.css';
import AdminCompanyActions from './AdminCompanyActions';

export const metadata = { title: '企業詳細 | 管理ダッシュボード' };

export default async function AdminCompanyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data: company } = await supabase
    .from('companies')
    .select(`
      *,
      company_licenses(
        license_types(id, code, name_ja)
      ),
      company_specialty_works(name),
      users(id, full_name, email, role, created_at)
    `)
    .eq('id', params.id)
    .single();

  if (!company) notFound();

  // Match count
  const { count: matchCount } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .or(`company_a_id.eq.${params.id},company_b_id.eq.${params.id}`);

  // Like count sent
  const { count: likesSentCount } = await supabase
    .from('likes')
    .select('id', { count: 'exact', head: true })
    .eq('from_company_id', params.id);

  // Like count received
  const { count: likesReceivedCount } = await supabase
    .from('likes')
    .select('id', { count: 'exact', head: true })
    .eq('to_company_id', params.id);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <Link href="/admin/companies" className={styles.backLink}>← 企業一覧に戻る</Link>
        <div className={styles.titleRow}>
          <h1 className={styles.pageTitle}>{company.name}</h1>
          <span className={company.is_active ? styles.badgeActive : styles.badgeInactive}>
            {company.is_active ? '有効' : '無効'}
          </span>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Basic Info */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>基本情報</h2>
          <dl className={styles.infoList}>
            <dt>会社名</dt><dd>{company.name}</dd>
            <dt>役割</dt>
            <dd>
              {company.company_role === 'general_contractor' ? '元請'
                : company.company_role === 'subcontractor' ? '下請' : '元請・下請'}
            </dd>
            <dt>都道府県</dt><dd>{company.prefecture || '未設定'}</dd>
            <dt>住所</dt><dd>{company.address || '未設定'}</dd>
            <dt>電話番号</dt><dd>{company.phone || '未設定'}</dd>
            <dt>メール</dt><dd>{company.email || '未設定'}</dd>
            <dt>従業員数</dt><dd>{company.employee_count ? `${company.employee_count}名` : '未設定'}</dd>
            <dt>資本金</dt><dd>{company.capital_amount ? `${(company.capital_amount / 10000).toFixed(0)}万円` : '未設定'}</dd>
            <dt>設立年</dt><dd>{company.founded_year ? `${company.founded_year}年` : '未設定'}</dd>
            <dt>登録日</dt><dd>{new Date(company.created_at).toLocaleDateString('ja-JP')}</dd>
          </dl>
        </div>

        {/* Stats */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>アクティビティ</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{matchCount ?? 0}</span>
              <span className={styles.statLabel}>マッチング数</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{likesSentCount ?? 0}</span>
              <span className={styles.statLabel}>いいね送信</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{likesReceivedCount ?? 0}</span>
              <span className={styles.statLabel}>いいね受信</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{(company.users ?? []).length}</span>
              <span className={styles.statLabel}>ユーザー数</span>
            </div>
          </div>

          <div className={styles.separator} />
          <h3 className={styles.subTitle}>管理操作</h3>
          <AdminCompanyActions companyId={company.id} isActive={company.is_active} />
        </div>
      </div>

      {/* Licenses */}
      {(company.company_licenses ?? []).length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>建設業許可</h2>
          <div className={styles.licenseList}>
            {(company.company_licenses ?? []).map((cl: { license_types: { id: string; code: string; name_ja: string } }) => (
              <span key={cl.license_types.id} className={styles.licenseBadge}>
                {cl.license_types.name_ja}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Users */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>所属ユーザー ({(company.users ?? []).length}名)</h2>
        {(company.users ?? []).length === 0 ? (
          <p className={styles.empty}>ユーザーが登録されていません</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>氏名</th>
                <th>メール</th>
                <th>役割</th>
                <th>登録日</th>
              </tr>
            </thead>
            <tbody>
              {(company.users ?? []).map((u: {
                id: string;
                full_name: string;
                email: string;
                role: string;
                created_at: string;
              }) => (
                <tr key={u.id}>
                  <td>{u.full_name || '—'}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`${styles.roleBadge} ${u.role === 'admin' ? styles.roleAdmin : styles.roleMember}`}>
                      {u.role === 'admin' ? '管理者' : u.role === 'company_admin' ? '企業管理者' : 'メンバー'}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString('ja-JP')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
