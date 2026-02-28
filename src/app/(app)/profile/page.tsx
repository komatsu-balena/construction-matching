import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import styles from './profile.module.css';

export const metadata = { title: 'プロフィール | 建設マッチング' };

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('*, companies(*)')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  const company = profile.companies;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>マイプロフィール</h1>
        <Link href="/profile/edit" className={styles.editBtn}>
          プロフィールを編集
        </Link>
      </div>

      <div className={styles.grid}>
        {/* User info */}
        <div className={styles.card}>
          <div className={styles.avatarRow}>
            <div className={styles.avatar}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} />
              ) : (
                <span>{(profile.full_name || user.email || '?').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h2 className={styles.userName}>{profile.full_name || '名前未設定'}</h2>
              <p className={styles.userEmail}>{user.email}</p>
              {profile.position && (
                <p className={styles.userPosition}>{profile.position}</p>
              )}
            </div>
          </div>
          {profile.bio && (
            <p className={styles.bio}>{profile.bio}</p>
          )}
          <dl className={styles.infoList}>
            <dt>役割</dt>
            <dd>
              <span className={`${styles.roleBadge} ${
                profile.role === 'admin' ? styles.roleAdmin
                  : profile.role === 'company_admin' ? styles.roleCompanyAdmin
                  : styles.roleMember
              }`}>
                {profile.role === 'admin' ? 'システム管理者'
                  : profile.role === 'company_admin' ? '企業管理者'
                  : 'メンバー'}
              </span>
            </dd>
            {profile.phone && (
              <>
                <dt>電話番号</dt>
                <dd>{profile.phone}</dd>
              </>
            )}
          </dl>
        </div>

        {/* Company info */}
        {company && (
          <div className={styles.card}>
            <div className={styles.companyHeader}>
              <div className={styles.companyLogo}>
                {company.logo_url ? (
                  <img src={company.logo_url} alt={company.name} />
                ) : (
                  <span>{company.name.charAt(0)}</span>
                )}
              </div>
              <div>
                <h2 className={styles.companyName}>{company.name}</h2>
                <p className={styles.companyMeta}>
                  {company.prefecture && <span>{company.prefecture}</span>}
                  <span>
                    {company.company_role === 'general_contractor' ? '元請'
                      : company.company_role === 'subcontractor' ? '下請' : '元請・下請'}
                  </span>
                </p>
              </div>
            </div>
            <div className={styles.companyActions}>
              <Link href={`/companies/${company.id}`} className={styles.viewCompanyBtn}>
                会社プロフィールを見る
              </Link>
              <Link href="/profile/edit?tab=company" className={styles.editCompanyBtn}>
                会社情報を編集
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
