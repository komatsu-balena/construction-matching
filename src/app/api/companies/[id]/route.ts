import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { data: company, error } = await supabase
    .from('companies')
    .select(`
      *,
      licenses:company_licenses(*, license_type:license_types(*)),
      specialty_works:company_specialty_works(*),
      project_records(*, photos:project_photos(*))
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !company) {
    return NextResponse.json({ error: '企業が見つかりません' }, { status: 404 });
  }

  return NextResponse.json({ data: company });
}

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  name_kana: z.string().optional().nullable(),
  representative_name: z.string().optional().nullable(),
  established_year: z.number().optional().nullable(),
  employee_count: z.number().min(1).optional().nullable(),
  capital_amount: z.number().min(0).optional().nullable(),
  annual_revenue: z.number().min(0).optional().nullable(),
  description: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  prefecture: z.string().optional(),
  city: z.string().optional().nullable(),
  address_line1: z.string().optional().nullable(),
  address_line2: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  website_url: z.string().url().optional().nullable(),
  company_role: z.enum(['general_contractor', 'subcontractor', 'both']).optional(),
  main_industry: z.string().optional().nullable(),
  seeking_description: z.string().optional().nullable(),
  seeking_regions: z.array(z.string()).optional().nullable(),
  seeking_roles: z.array(z.enum(['general_contractor', 'subcontractor', 'both'])).optional().nullable(),
  license_number: z.string().optional().nullable(),
  license_authority: z.string().optional().nullable(),
  license_expiry: z.string().optional().nullable(),
  is_tokutei: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  // 自社かどうか確認
  const { data: userData } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', user.id)
    .single();

  if (userData?.company_id !== id && userData?.role !== 'admin') {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '入力値が不正です', details: parsed.error.errors }, { status: 400 });
  }

  // プロフィール完成度チェック
  const updateData = {
    ...parsed.data,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('companies')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  }

  // プロフィール完成度を判定・更新
  const isComplete = !!(
    data.name && data.prefecture && data.description &&
    data.company_role && data.phone
  );

  if (isComplete !== data.is_profile_complete) {
    await supabase
      .from('companies')
      .update({ is_profile_complete: isComplete })
      .eq('id', id);
  }

  return NextResponse.json({ data });
}
