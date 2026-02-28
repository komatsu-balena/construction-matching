import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateMatchScore, sortByScore } from '@/lib/utils/scoring';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single();

  const myCompanyId = userData?.company_id;
  if (!myCompanyId) return NextResponse.json({ data: [] });

  const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '10');

  // 自社情報（許認可含む）
  const { data: myCompany } = await supabase
    .from('companies')
    .select('*, licenses:company_licenses(license_type_id)')
    .eq('id', myCompanyId)
    .single();

  if (!myCompany) return NextResponse.json({ data: [] });

  // 既にいいね済みの企業IDを取得
  const { data: likedData } = await supabase
    .from('likes')
    .select('to_company_id')
    .eq('from_company_id', myCompanyId);

  const likedIds = new Set((likedData ?? []).map((l: { to_company_id: string }) => l.to_company_id));

  // マッチ済みの企業IDを取得
  const { data: matchedData } = await supabase
    .from('matches')
    .select('company_a_id, company_b_id')
    .or(`company_a_id.eq.${myCompanyId},company_b_id.eq.${myCompanyId}`)
    .eq('status', 'matched');

  const matchedIds = new Set(
    (matchedData ?? []).flatMap((m: { company_a_id: string; company_b_id: string }) => [m.company_a_id, m.company_b_id])
  );
  matchedIds.delete(myCompanyId);

  // 候補企業取得（上限100社）
  const { data: candidates } = await supabase
    .from('companies')
    .select('*, licenses:company_licenses(license_type_id)')
    .eq('is_active', true)
    .neq('id', myCompanyId)
    .limit(100);

  if (!candidates) return NextResponse.json({ data: [] });

  // スコアリング
  const scored = candidates
    .filter((c: { id: string }) => !likedIds.has(c.id) && !matchedIds.has(c.id))
    .map((candidate: typeof candidates[0]) => ({
      ...calculateMatchScore(myCompany, candidate),
      already_liked: likedIds.has(candidate.id),
    }));

  const sorted = sortByScore(scored).slice(0, limit);

  return NextResponse.json({ data: sorted });
}
