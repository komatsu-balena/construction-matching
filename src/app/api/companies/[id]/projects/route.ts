import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const projectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  construction_type: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  completed_year: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  contract_amount: z.number().positive().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('project_records')
    .select('*, project_photos(id, url, caption, sort_order)')
    .eq('company_id', params.id)
    .order('completed_year', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check user belongs to this company
  const { data: profile } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', user.id)
    .single();

  if (profile?.company_id !== params.id && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '入力内容が不正です' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('project_records')
    .insert({ ...parsed.data, company_id: params.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: '作成に失敗しました' }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
