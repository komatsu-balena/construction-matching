import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single();

  const myCompanyId = userData?.company_id;

  // マッチへのアクセス権確認
  const { data: match } = await supabase
    .from('matches')
    .select('id, company_a_id, company_b_id')
    .eq('id', matchId)
    .or(`company_a_id.eq.${myCompanyId},company_b_id.eq.${myCompanyId}`)
    .single();

  if (!match) {
    return NextResponse.json({ error: 'アクセスできません' }, { status: 403 });
  }

  const cursor = req.nextUrl.searchParams.get('cursor');
  const limit = 30;

  let query = supabase
    .from('messages')
    .select(`
      id, content, created_at, is_read, sender_company_id,
      sender_user:users!messages_sender_user_id_fkey(id, full_name, avatar_url)
    `)
    .eq('match_id', matchId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data: messages, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'メッセージの取得に失敗しました' }, { status: 500 });
  }

  // 未読を既読にする
  await supabase
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('match_id', matchId)
    .eq('is_read', false)
    .neq('sender_company_id', myCompanyId);

  const reversed = (messages ?? []).reverse();
  const nextCursor = messages && messages.length === limit
    ? messages[messages.length - 1].created_at
    : null;

  return NextResponse.json({ data: reversed, next_cursor: nextCursor });
}

const SendSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
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

  // マッチへのアクセス権確認
  const { data: match } = await supabase
    .from('matches')
    .select('id')
    .eq('id', matchId)
    .or(`company_a_id.eq.${myCompanyId},company_b_id.eq.${myCompanyId}`)
    .eq('status', 'matched')
    .single();

  if (!match) {
    return NextResponse.json({ error: 'アクセスできません' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = SendSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: '入力値が不正です' }, { status: 400 });

  const { data, error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_user_id: user.id,
      sender_company_id: myCompanyId,
      content: parsed.data.content,
    })
    .select(`
      id, content, created_at, is_read, sender_company_id,
      sender_user:users!messages_sender_user_id_fkey(id, full_name, avatar_url)
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: 'メッセージの送信に失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
