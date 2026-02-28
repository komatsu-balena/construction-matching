import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single();

  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('id', id)
    .eq('from_company_id', userData?.company_id);

  if (error) {
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
