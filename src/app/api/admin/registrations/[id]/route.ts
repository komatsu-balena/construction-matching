import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const ActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // 管理者のみ許可
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: adminData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (adminData?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '入力値が不正です' }, { status: 400 });
  }

  const { action } = parsed.data;
  const adminClient = createAdminClient();

  // 対象ユーザーの情報を取得
  const { data: targetUser } = await adminClient
    .from('users')
    .select('id, company_id, is_active')
    .eq('id', id)
    .single();

  if (!targetUser) {
    return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
  }

  if (action === 'approve') {
    // ユーザーを有効化
    await adminClient
      .from('users')
      .update({ is_active: true })
      .eq('id', id);

    // 会社も有効化
    if (targetUser.company_id) {
      await adminClient
        .from('companies')
        .update({ is_active: true })
        .eq('id', targetUser.company_id);
    }

    return NextResponse.json({ success: true, action: 'approved' });
  }

  if (action === 'reject') {
    // 会社を削除
    if (targetUser.company_id) {
      await adminClient
        .from('companies')
        .delete()
        .eq('id', targetUser.company_id);
    }

    // Auth ユーザーを削除（usersレコードもCASCADE削除される）
    await adminClient.auth.admin.deleteUser(id);

    return NextResponse.json({ success: true, action: 'rejected' });
  }

  return NextResponse.json({ error: '不明なアクション' }, { status: 400 });
}
