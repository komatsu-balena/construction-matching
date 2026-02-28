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

  const company = profile.companies;
  const companyId = profile.company_id as string | null;

  const [licensesRes, specialtyWorksRes] = await Promise.all([
    companyId
      ? supabase.from('company_licenses').select('license_type_id').eq('company_id', companyId)
      : Promise.resolve({ data: [] as { license_type_id: string }[] }),
    companyId
      ? supabase.from('company_specialty_works').select('name').eq('company_id', companyId)
      : Promise.resolve({ data: [] as { name: string }[] }),
  ]);

  const selectedLicenses = (licensesRes.data ?? []).map((l: { license_type_id: string }) => l.license_type_id);
  const specialtyWorks = (specialtyWorksRes.data ?? []).map((s: { name: string }) => s.name);

  return (
    <ProfileEditForm
      user={profile}
      company={company}
      selectedLicenses={selectedLicenses}
      specialtyWorks={specialtyWorks}
    />
  );
}
