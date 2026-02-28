import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileEditForm from './ProfileEditForm';

export const metadata = { title: 'プロフィール編集 | 建設マッチング' };

export default async function ProfileEditPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('*, companies(*)')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  // Supabase join may return array or single object depending on types — normalize
  const companyRaw = profile.companies;
  const company = Array.isArray(companyRaw) ? (companyRaw[0] ?? null) : companyRaw;
  const companyId = profile.company_id as string | null;

  const [licensesRes, specialtyWorksRes] = await Promise.all([
    companyId
      ? supabase.from('company_licenses').select('license_type_id').eq('company_id', companyId)
      : Promise.resolve({ data: [] as { license_type_id: number }[] }),
    companyId
      ? supabase.from('company_specialty_works').select('work_type').eq('company_id', companyId)
      : Promise.resolve({ data: [] as { work_type: string }[] }),
  ]);

  const selectedLicenses = (licensesRes.data ?? []).map((l: { license_type_id: number }) => String(l.license_type_id));
  const specialtyWorks = (specialtyWorksRes.data ?? [])
    .map((s: { work_type: string }) => s.work_type)
    .filter(Boolean);

  return (
    <ProfileEditForm
      user={profile}
      company={company}
      selectedLicenses={selectedLicenses}
      specialtyWorks={specialtyWorks}
    />
  );
}
