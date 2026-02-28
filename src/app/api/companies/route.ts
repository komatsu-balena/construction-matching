import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q') ?? '';
  const prefecture = searchParams.get('prefecture') ?? '';
  const region = searchParams.get('region') ?? '';
  const role = searchParams.get('role') ?? '';
  const licenseId = searchParams.get('license_type_id') ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const perPage = Math.min(50, parseInt(searchParams.get('per_page') ?? '20'));
  const offset = (page - 1) * perPage;

  let query = supabase
    .from('companies')
    .select(`
      id, name, name_kana, prefecture, city, company_role, logo_url,
      employee_count, description, is_profile_complete, member_since,
      licenses:company_licenses(license_type_id, is_tokutei)
    `, { count: 'exact' })
    .eq('is_active', true)
    .order('member_since', { ascending: false })
    .range(offset, offset + perPage - 1);

  if (q) {
    query = query.or(`name.ilike.%${q}%,name_kana.ilike.%${q}%,description.ilike.%${q}%`);
  }

  if (prefecture) {
    query = query.eq('prefecture', prefecture);
  }

  if (role) {
    query = query.eq('company_role', role);
  }

  const { data: companies, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 });
  }

  // 特定の許認可でフィルタ（クライアントサイドで処理）
  let filtered = companies ?? [];
  if (licenseId) {
    filtered = filtered.filter((c: { licenses: { license_type_id: number }[] }) =>
      c.licenses?.some((l) => l.license_type_id === parseInt(licenseId))
    );
  }

  return NextResponse.json({
    data: filtered,
    total: count ?? 0,
    page,
    per_page: perPage,
    total_pages: Math.ceil((count ?? 0) / perPage),
  });
}

// 会社を新規作成（company_idがないユーザー用）
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  // ユーザーが既に会社を持っているか確認
  const { data: userData } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', user.id)
    .single();

  if (userData?.company_id) {
    return NextResponse.json({ error: '既に会社が登録されています' }, { status: 400 });
  }

  const body = await req.json();

  if (!body.name?.trim()) {
    return NextResponse.json({ error: '会社名は必須です' }, { status: 400 });
  }
  if (!body.prefecture) {
    return NextResponse.json({ error: '都道府県を選択してください' }, { status: 400 });
  }

  // 会社を作成
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({
      name: body.name,
      prefecture: body.prefecture,
      company_role: body.company_role ?? 'both',
      description: body.description ?? null,
      address_line1: body.address_line1 ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      website_url: body.website_url ?? null,
      employee_count: body.employee_count ?? null,
      capital_amount: body.capital_amount ?? null,
      established_year: body.established_year ?? null,
      is_active: true,
    })
    .select('id')
    .single();

  if (companyError || !company) {
    return NextResponse.json({ error: '会社の作成に失敗しました' }, { status: 500 });
  }

  // ユーザーのcompany_idを紐付け
  await supabase
    .from('users')
    .update({ company_id: company.id })
    .eq('id', user.id);

  return NextResponse.json({ id: company.id });
}
