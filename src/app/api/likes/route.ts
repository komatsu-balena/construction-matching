import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single();

  const myCompanyId = userData?.company_id;

  const [sentRes, receivedRes] = await Promise.all([
    supabase.from('likes')
      .select('*, to_company:companies!likes_to_company_id_fkey(id, name, logo_url, prefecture, company_role)')
      .eq('from_company_id', myCompanyId)
      .order('created_at', { ascending: false }),
    supabase.from('likes')
      .select('*, from_company:companies!likes_from_company_id_fkey(id, name, logo_url, prefecture, company_role)')
      .eq('to_company_id', myCompanyId)
      .order('created_at', { ascending: false }),
  ]);

  return NextResponse.json({
    sent: sentRes.data ?? [],
    received: receivedRes.data ?? [],
  });
}

const LikeSchema = z.object({
  to_company_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single();

  const myCompanyId = userData?.company_id;
  if (!myCompanyId) return NextResponse.json({ error: '企業が登録されていません' }, { status: 400 });

  const body = await req.json();
  const parsed = LikeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: '入力値が不正です' }, { status: 400 });

  if (parsed.data.to_company_id === myCompanyId) {
    return NextResponse.json({ error: '自社にいいねはできません' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('likes')
    .insert({ from_company_id: myCompanyId, to_company_id: parsed.data.to_company_id })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: '既にいいね済みです' }, { status: 409 });
    }
    return NextResponse.json({ error: 'いいねに失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
