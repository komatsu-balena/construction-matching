import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: '招待トークンが必要です' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: invitation, error } = await supabase
    .from('company_invitations')
    .select('id, email, company_name, expires_at, used_at')
    .eq('token', token)
    .single();

  if (error || !invitation) {
    return NextResponse.json({ error: '招待リンクが無効です' }, { status: 404 });
  }

  if (invitation.used_at) {
    return NextResponse.json({ error: 'この招待リンクは既に使用されています' }, { status: 400 });
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: '招待リンクの有効期限が切れています' }, { status: 400 });
  }

  return NextResponse.json({ invitation });
}
