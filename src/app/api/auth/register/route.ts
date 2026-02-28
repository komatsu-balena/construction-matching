import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const RegisterSchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = RegisterSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: '入力値が不正です' }, { status: 400 });
  }

  const { token, email, password, fullName } = parsed.data;
  const supabase = createAdminClient();

  // 招待トークン検証
  const { data: invitation, error: invError } = await supabase
    .from('company_invitations')
    .select('*')
    .eq('token', token)
    .single();

  if (invError || !invitation) {
    return NextResponse.json({ error: '招待リンクが無効です' }, { status: 400 });
  }

  if (invitation.used_at) {
    return NextResponse.json({ error: 'この招待リンクは既に使用されています' }, { status: 400 });
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: '招待リンクの有効期限が切れています' }, { status: 400 });
  }

  if (invitation.email.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: 'メールアドレスが招待と一致しません' }, { status: 400 });
  }

  // ユーザー作成
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authError || !authUser.user) {
    if (authError?.message?.includes('already registered')) {
      return NextResponse.json({ error: 'このメールアドレスは既に登録されています' }, { status: 400 });
    }
    return NextResponse.json({ error: 'アカウント作成に失敗しました' }, { status: 500 });
  }

  // usersテーブル更新（handle_new_user triggerでinsert済み）
  await supabase
    .from('users')
    .update({
      full_name: fullName,
      company_id: invitation.company_id,
      role: 'company_admin',
    })
    .eq('id', authUser.user.id);

  // 招待を使用済みにする
  await supabase
    .from('company_invitations')
    .update({ used_at: new Date().toISOString(), company_id: invitation.company_id })
    .eq('id', invitation.id);

  // 企業がまだ存在しない場合は作成
  if (!invitation.company_id && invitation.company_name) {
    const { data: newCompany } = await supabase
      .from('companies')
      .insert({
        name: invitation.company_name,
        prefecture: '東京都',
        company_role: 'both',
      })
      .select('id')
      .single();

    if (newCompany) {
      await supabase
        .from('users')
        .update({ company_id: newCompany.id })
        .eq('id', authUser.user.id);

      await supabase
        .from('company_invitations')
        .update({ company_id: newCompany.id })
        .eq('id', invitation.id);
    }
  }

  return NextResponse.json({ success: true });
}
