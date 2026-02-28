import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const UpdateLicensesSchema = z.object({
  // シンプルなIDの配列（文字列・数値どちらも受け付ける）
  license_type_ids: z.array(z.union([z.number(), z.string()])).optional(),
  // 得意工事（文字列配列）
  specialty_works: z.array(z.string()).optional(),
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

  const { license_type_ids, specialty_works } = parsed.data;

  // 建設業許可の更新
  if (license_type_ids !== undefined) {
    await supabase.from('company_licenses').delete().eq('company_id', id);

    if (license_type_ids.length > 0) {
      const insertData = license_type_ids.map((lid) => ({
        company_id: id,
        license_type_id: Number(lid),
        is_tokutei: false,
      }));

      const { error } = await supabase.from('company_licenses').insert(insertData);
      if (error) {
        return NextResponse.json({ error: '許認可の更新に失敗しました' }, { status: 500 });
      }
    }
  }

  // 得意工事の更新
  if (specialty_works !== undefined) {
    await supabase.from('company_specialty_works').delete().eq('company_id', id);

    if (specialty_works.length > 0) {
      const workData = specialty_works
        .filter((w) => w.trim())
        .map((w, i) => ({
          company_id: id,
          work_type: w.trim(),
          sort_order: i,
        }));

      if (workData.length > 0) {
        const { error } = await supabase.from('company_specialty_works').insert(workData);
        if (error) {
          return NextResponse.json({ error: '得意工事の更新に失敗しました' }, { status: 500 });
        }
      }
    }
  }

  return NextResponse.json({ success: true });
}
