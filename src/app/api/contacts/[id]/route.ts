import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const UpdateSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
});

export async function PUT(
  req: NextRequest,
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

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: '入力値が不正です' }, { status: 400 });

  const { data, error } = await supabase
    .from('contact_requests')
    .update({
      status: parsed.data.status,
      responded_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('to_company_id', userData?.company_id)
    .eq('status', 'pending')
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ data });
}
