import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id, matched_at, updated_at, status, match_score,
      company_a:companies!matches_company_a_id_fkey(id, name, logo_url, prefecture, company_role),
      company_b:companies!matches_company_b_id_fkey(id, name, logo_url, prefecture, company_role)
    `)
    .or(`company_a_id.eq.${myCompanyId},company_b_id.eq.${myCompanyId}`)
    .eq('status', 'matched')
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 });
  }

  // 各マッチの未読数を取得
  const matchIds = (matches ?? []).map((m: { id: string }) => m.id);
  let unreadCounts: Record<string, number> = {};

  if (matchIds.length > 0) {
    const { data: unreadData } = await supabase
      .from('messages')
      .select('match_id')
      .in('match_id', matchIds)
      .eq('is_read', false)
      .neq('sender_company_id', myCompanyId);

    unreadData?.forEach((msg: { match_id: string }) => {
      unreadCounts[msg.match_id] = (unreadCounts[msg.match_id] ?? 0) + 1;
    });
  }

  const enrichedMatches = (matches ?? []).map((m: { id: string }) => ({
    ...m,
    unread_count: unreadCounts[m.id] ?? 0,
  }));

  return NextResponse.json({ data: enrichedMatches });
}
