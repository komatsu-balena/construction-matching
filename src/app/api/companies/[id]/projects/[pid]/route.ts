import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  construction_type: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  completed_year: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  contract_amount: z.number().positive().optional(),
});

async function checkAccess(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, companyId: string) {
  const { data } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', userId)
    .single();
  return data?.company_id === companyId || data?.role === 'admin';
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; pid: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await checkAccess(supabase, user.id, params.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '入力内容が不正です' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('project_records')
    .update(parsed.data)
    .eq('id', params.pid)
    .eq('company_id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; pid: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await checkAccess(supabase, user.id, params.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabase
    .from('project_records')
    .delete()
    .eq('id', params.pid)
    .eq('company_id', params.id);

  if (error) return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
