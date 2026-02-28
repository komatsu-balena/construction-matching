import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import LikeButton from '@/components/matching/LikeButton';
import ContactButton from '@/components/matching/ContactButton';
import styles from './company-detail.module.css';
import { formatCurrency, formatEmployeeCount, companyRoleLabel } from '@/lib/utils/format';
import { getLicenseById } from '@/lib/constants/licenses';

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user!.id)
    .single();

  const myCompanyId = userData?.company_id;

  const { data: company } = await supabase
    .from('companies')
    .select(`
      *,
      licenses:company_licenses(id, license_type_id, is_tokutei),
      specialty_works:company_specialty_works(id, work_type, description),
      project_records(id, title, work_type, description, location, prefecture, completion_year, project_amount, client_type, photos:project_photos(id, url, caption))
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (!company) notFound();

  const isOwnCompany = company.id === myCompanyId;

  // いいね済みか確認
  const { data: likeData } = await supabase
    .from('likes')
    .select('id')
    .eq('from_company_id', myCompanyId)
    .eq('to_company_id', id)
    .maybeSingle();

  const alreadyLiked = !!likeData;

  // コンタクトリクエスト済みか確認
  const { data: contactData } = await supabase
    .from('contact_requests')
    .select('id, status')
    .eq('from_company_id', myCompanyId)
    .eq('to_company_id', id)
    .maybeSingle();

  return (
    <div className={styles.page}>
      {/* ヒーローヘッダー */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroAvatar}>
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} />
            ) : (
              <span>{company.name.charAt(0)}</span>
            )}
          </div>
          <div className={styles.heroInfo}>
            <h1 className={styles.companyName}>{company.name}</h1>
            {company.name_kana && (
              <p className={styles.nameKana}>{company.name_kana}</p>
            )}
            <div className={styles.heroBadges}>
              <span className={styles.roleBadge}>{companyRoleLabel(company.company_role)}</span>
              <span className={styles.prefBadge}>{company.prefecture}</span>
              {company.is_tokutei && <span className={styles.tokutei}>特定建設業</span>}
            </div>
          </div>
          {!isOwnCompany && (
            <div className={styles.heroActions}>
              <LikeButton
                companyId={id}
                initialLiked={alreadyLiked}
                likeId={likeData?.id}
              />
              <ContactButton
                companyId={id}
                existingRequest={contactData ?? null}
              />
            </div>
          )}
          {isOwnCompany && (
            <Link href="/profile/edit" className={styles.editBtn}>
              プロフィールを編集
            </Link>
          )}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className={styles.content}>
        {/* 基本情報 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>基本情報</h2>
          <div className={styles.infoGrid}>
            {company.representative_name && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>代表者</span>
                <span className={styles.infoValue}>{company.representative_name}</span>
              </div>
            )}
            {company.established_year && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>設立</span>
                <span className={styles.infoValue}>{company.established_year}年</span>
              </div>
            )}
            {company.employee_count && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>従業員数</span>
                <span className={styles.infoValue}>{formatEmployeeCount(company.employee_count)}</span>
              </div>
            )}
            {company.capital_amount && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>資本金</span>
                <span className={styles.infoValue}>{formatCurrency(company.capital_amount)}</span>
              </div>
            )}
            {company.annual_revenue && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>年商</span>
                <span className={styles.infoValue}>{formatCurrency(company.annual_revenue)}</span>
              </div>
            )}
            {company.prefecture && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>所在地</span>
                <span className={styles.infoValue}>
                  〒{company.postal_code ?? ''} {company.prefecture}{company.city ?? ''}{company.address_line1 ?? ''}
                </span>
              </div>
            )}
            {company.phone && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>電話番号</span>
                <span className={styles.infoValue}>{company.phone}</span>
              </div>
            )}
            {company.website_url && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Webサイト</span>
                <a href={company.website_url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  {company.website_url}
                </a>
              </div>
            )}
          </div>
          {company.description && (
            <div className={styles.description}>
              <p>{company.description}</p>
            </div>
          )}
        </section>

        {/* 建設業許可 */}
        {company.licenses && company.licenses.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>建設業許可</h2>
            {company.license_number && (
              <p className={styles.licenseNumber}>
                許可番号: {company.license_authority ?? ''} 第{company.license_number}号
                {company.license_expiry && ` （有効期限: ${company.license_expiry}）`}
              </p>
            )}
            <div className={styles.licenseGrid}>
              {company.licenses.map((license: { id: string; license_type_id: number; is_tokutei: boolean }) => {
                const licenseInfo = getLicenseById(license.license_type_id);
                return (
                  <div key={license.id} className={styles.licenseBadge}>
                    <span className={styles.licenseName}>{licenseInfo?.nameJa ?? `業種${license.license_type_id}`}</span>
                    {license.is_tokutei && <span className={styles.tokuteiTag}>特定</span>}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 得意工事 */}
        {company.specialty_works && company.specialty_works.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>得意工事</h2>
            <div className={styles.specialtyList}>
              {company.specialty_works.map((w: { id: string; work_type: string; description: string | null }) => (
                <div key={w.id} className={styles.specialtyItem}>
                  <span className={styles.specialtyType}>{w.work_type}</span>
                  {w.description && <span className={styles.specialtyDesc}>{w.description}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 求めていること */}
        {(company.seeking_description || company.seeking_regions || company.seeking_roles) && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>求めていること</h2>
            <div className={styles.seekingCard}>
              {company.seeking_roles && company.seeking_roles.length > 0 && (
                <div className={styles.seekingItem}>
                  <span className={styles.seekingLabel}>求める相手の役割</span>
                  <div className={styles.badges}>
                    {company.seeking_roles.map((role: string) => (
                      <span key={role} className={styles.seekingBadge}>{companyRoleLabel(role)}</span>
                    ))}
                  </div>
                </div>
              )}
              {company.seeking_regions && company.seeking_regions.length > 0 && (
                <div className={styles.seekingItem}>
                  <span className={styles.seekingLabel}>希望エリア</span>
                  <div className={styles.badges}>
                    {company.seeking_regions.map((region: string) => (
                      <span key={region} className={styles.seekingBadge}>{region}</span>
                    ))}
                  </div>
                </div>
              )}
              {company.seeking_description && (
                <div className={styles.seekingItem}>
                  <span className={styles.seekingLabel}>詳細</span>
                  <p className={styles.seekingDesc}>{company.seeking_description}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 過去工事実績 */}
        {company.project_records && company.project_records.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>過去の工事実績</h2>
            <div className={styles.projectGrid}>
              {company.project_records.map((project: {
                id: string;
                title: string;
                work_type: string;
                description: string | null;
                location: string | null;
                prefecture: string | null;
                completion_year: number | null;
                project_amount: number | null;
                client_type: string | null;
                photos: { id: string; url: string; caption: string | null }[];
              }) => (
                <div key={project.id} className={styles.projectCard}>
                  {project.photos && project.photos.length > 0 && (
                    <div className={styles.projectPhoto}>
                      <img src={project.photos[0].url} alt={project.title} />
                    </div>
                  )}
                  <div className={styles.projectInfo}>
                    <h3 className={styles.projectTitle}>{project.title}</h3>
                    <div className={styles.projectMeta}>
                      <span>{project.work_type}</span>
                      {project.prefecture && <span>{project.prefecture}</span>}
                      {project.completion_year && <span>{project.completion_year}年竣工</span>}
                      {project.project_amount && <span>{formatCurrency(project.project_amount)}</span>}
                    </div>
                    {project.description && (
                      <p className={styles.projectDesc}>{project.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
