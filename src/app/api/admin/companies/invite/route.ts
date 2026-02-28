import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import crypto from 'crypto';
import { sendInvitationEmail } from '@/lib/email/resend';

const inviteSchema = z.object({
  companyName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['general_contractor', 'subcontractor', 'both']),
  message: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Auth check - admin only
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '入力内容が不正です' }, { status: 400 });
  }

  const { companyName, email, role, message } = parsed.data;
  const adminClient = createAdminClient();

  // Check if email already exists
  const { data: existingUsers } = await adminClient.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find((u) => u.email === email);
  if (existingUser) {
    return NextResponse.json({ error: 'このメールアドレスは既に登録されています' }, { status: 409 });
  }

  // Create company record first
  const { data: company, error: companyError } = await adminClient
    .from('companies')
    .insert({
      name: companyName,
      company_role: role,
      is_active: true,
    })
    .select('id')
    .single();

  if (companyError) {
    return NextResponse.json({ error: '企業の作成に失敗しました' }, { status: 500 });
  }

  // Generate invitation token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error: inviteError } = await adminClient
    .from('company_invitations')
    .insert({
      company_id: company.id,
      email,
      token,
      expires_at: expiresAt,
      invited_by: user.id,
    });

  if (inviteError) {
    // Rollback company
    await adminClient.from('companies').delete().eq('id', company.id);
    return NextResponse.json({ error: '招待トークンの作成に失敗しました' }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const inviteUrl = `${appUrl}/register?token=${token}`;

  // 招待メールを送信
  const emailResult = await sendInvitationEmail({
    to: email,
    companyName,
    inviteUrl,
    message,
  });

  if (!emailResult.success) {
    console.warn('[INVITE] メール送信失敗（URLは有効）:', emailResult.error);
  }

  return NextResponse.json({
    inviteUrl,
    companyId: company.id,
    emailSent: emailResult.success,
  });
}
