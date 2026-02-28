import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const SelfRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1).max(100),
  companyName: z.string().min(1).max(200),
  prefecture: z.string().optional(),
  companyRole: z.enum(['general_contractor', 'subcontractor', 'both']).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = SelfRegisterSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: '入力値が不正です' }, { status: 400 });
  }

  const { email, password, fullName, companyName, prefecture, companyRole } = parsed.data;
  const supabase = createAdminClient();

  // メールアドレスの重複確認
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (existingUser) {
    return NextResponse.json(
      { error: 'このメールアドレスは既に登録されています' },
      { status: 409 }
    );
  }

  // Supabase Authユーザーを作成（メール確認済みとして登録）
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authError || !authUser.user) {
    return NextResponse.json({ error: 'アカウント作成に失敗しました' }, { status: 500 });
  }

  // 会社レコードを作成（承認前は is_active = false）
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({
      name: companyName,
      prefecture: prefecture ?? '東京都',
      company_role: companyRole ?? 'both',
      is_active: false, // 管理者承認まで非アクティブ
    })
    .select('id')
    .single();

  if (companyError || !company) {
    // ロールバック: authユーザーを削除
    await supabase.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: '会社情報の作成に失敗しました' }, { status: 500 });
  }

  // usersテーブルを更新（triggerで自動作成済みのレコードを更新）
  const { error: userError } = await supabase
    .from('users')
    .update({
      full_name: fullName,
      company_id: company.id,
      role: 'company_admin',
      is_active: false, // 管理者承認まで非アクティブ
    })
    .eq('id', authUser.user.id);

  if (userError) {
    // ロールバック
    await supabase.from('companies').delete().eq('id', company.id);
    await supabase.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: 'ユーザー情報の設定に失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
