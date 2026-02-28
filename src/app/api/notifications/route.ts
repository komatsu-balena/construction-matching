import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*, related_company:companies!notifications_related_company_id_fkey(id, name, logo_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: '通知の取得に失敗しました' }, { status: 500 });
  }

  const unreadCount = (notifications ?? []).filter((n: { is_read: boolean }) => !n.is_read).length;

  return NextResponse.json({ data: notifications ?? [], unread_count: unreadCount });
}
