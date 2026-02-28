import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const UpdateLicensesSchema = z.object({
  licenses: z.array(z.object({
    license_type_id: z.number().min(1).max(29),
    is_tokutei: z.boolean().default(false),
  })),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { data: userData } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', user.id)
    .single();

  if (userData?.company_id !== id && userData?.role !== 'admin') {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = UpdateLicensesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '入力値が不正です' }, { status: 400 });
  }

  // 既存の許可を全削除して再挿入
  await supabase.from('company_licenses').delete().eq('company_id', id);

  if (parsed.data.licenses.length > 0) {
    const insertData = parsed.data.licenses.map((l) => ({
      company_id: id,
      license_type_id: l.license_type_id,
      is_tokutei: l.is_tokutei,
    }));

    const { error } = await supabase.from('company_licenses').insert(insertData);
    if (error) {
      return NextResponse.json({ error: '許認可の更新に失敗しました' }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
