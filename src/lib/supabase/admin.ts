import { createClient } from '@supabase/supabase-js';

// サービスロールクライアント - RLSをバイパス（管理者操作のみ使用）
// 絶対にクライアントサイドに公開しないこと
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Admin client cannot be used on the client side');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
