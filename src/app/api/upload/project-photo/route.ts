import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import crypto from 'crypto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) {
    return NextResponse.json({ error: '企業に所属していません' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const projectId = formData.get('projectId') as string | null;
  const caption = formData.get('caption') as string | null;

  if (!file || !projectId) {
    return NextResponse.json({ error: 'ファイルとプロジェクトIDが必要です' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'JPEG, PNG, WebPのみアップロード可能です' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'ファイルサイズは10MB以下にしてください' }, { status: 400 });
  }

  // Verify project belongs to company
  const { data: project } = await supabase
    .from('project_records')
    .select('id')
    .eq('id', projectId)
    .eq('company_id', profile.company_id)
    .single();

  if (!project) {
    return NextResponse.json({ error: 'プロジェクトが見つかりません' }, { status: 404 });
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const uniqueId = crypto.randomBytes(8).toString('hex');
  const path = `projects/${profile.company_id}/${projectId}/${uniqueId}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from('company-assets')
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('company-assets')
    .getPublicUrl(path);

  // Save photo record
  const { data: photo, error: photoError } = await supabase
    .from('project_photos')
    .insert({
      project_id: projectId,
      url: publicUrl,
      caption: caption ?? null,
    })
    .select()
    .single();

  if (photoError) {
    return NextResponse.json({ error: '写真の保存に失敗しました' }, { status: 500 });
  }

  return NextResponse.json(photo, { status: 201 });
}
