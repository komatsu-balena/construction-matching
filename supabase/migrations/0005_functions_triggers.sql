-- =============================================
-- MIGRATION 0005: FUNCTIONS & TRIGGERS
-- =============================================

-- =============================================
-- TRIGGER: updated_at 自動更新
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER project_records_updated_at
  BEFORE UPDATE ON project_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER contact_requests_updated_at
  BEFORE UPDATE ON contact_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- TRIGGER: 相互いいね → マッチ自動作成
-- =============================================

CREATE OR REPLACE FUNCTION check_mutual_like()
RETURNS TRIGGER AS $$
DECLARE
  mutual_like_exists BOOLEAN;
  new_match_id UUID;
BEGIN
  -- 相手が既にいいねしているか確認
  SELECT EXISTS (
    SELECT 1 FROM likes
    WHERE from_company_id = NEW.to_company_id
      AND to_company_id   = NEW.from_company_id
  ) INTO mutual_like_exists;

  IF mutual_like_exists THEN
    -- マッチを作成 (LEAST/GREATESTで重複防止)
    INSERT INTO matches (company_a_id, company_b_id, status, matched_at)
    VALUES (
      LEAST(NEW.from_company_id, NEW.to_company_id),
      GREATEST(NEW.from_company_id, NEW.to_company_id),
      'matched',
      NOW()
    )
    ON CONFLICT (company_a_id, company_b_id) DO NOTHING
    RETURNING id INTO new_match_id;

    -- 両社のユーザーに通知を作成
    IF new_match_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, body, link, related_company_id, related_match_id)
      SELECT
        u.id,
        'new_match',
        'マッチングが成立しました',
        CASE
          WHEN u.company_id = NEW.from_company_id THEN
            (SELECT name FROM companies WHERE id = NEW.to_company_id) || 'とマッチングが成立しました'
          ELSE
            (SELECT name FROM companies WHERE id = NEW.from_company_id) || 'とマッチングが成立しました'
        END,
        '/matches',
        CASE WHEN u.company_id = NEW.from_company_id THEN NEW.to_company_id ELSE NEW.from_company_id END,
        new_match_id
      FROM users u
      WHERE u.company_id IN (NEW.from_company_id, NEW.to_company_id)
        AND u.is_active = TRUE;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_check_mutual_like
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION check_mutual_like();

-- =============================================
-- TRIGGER: いいね通知
-- =============================================

CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, link, related_company_id)
  SELECT
    u.id,
    'new_like',
    'いいねされました',
    (SELECT name FROM companies WHERE id = NEW.from_company_id) || 'からいいねが届きました',
    '/likes',
    NEW.from_company_id
  FROM users u
  WHERE u.company_id = NEW.to_company_id
    AND u.is_active = TRUE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_on_like
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- =============================================
-- TRIGGER: コンタクトリクエスト通知
-- =============================================

CREATE OR REPLACE FUNCTION notify_on_contact_request()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 新規リクエスト通知
    INSERT INTO notifications (user_id, type, title, body, link, related_company_id)
    SELECT
      u.id,
      'contact_request',
      'コンタクトリクエストが届きました',
      (SELECT name FROM companies WHERE id = NEW.from_company_id) || 'からコンタクトリクエストが届きました',
      '/contacts',
      NEW.from_company_id
    FROM users u
    WHERE u.company_id = NEW.to_company_id AND u.is_active = TRUE;

  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    -- 承認通知
    INSERT INTO notifications (user_id, type, title, body, link, related_company_id)
    SELECT
      u.id,
      'contact_accepted',
      'コンタクトリクエストが承認されました',
      (SELECT name FROM companies WHERE id = NEW.to_company_id) || 'がコンタクトリクエストを承認しました',
      '/contacts',
      NEW.to_company_id
    FROM users u
    WHERE u.company_id = NEW.from_company_id AND u.is_active = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_on_contact_request
  AFTER INSERT OR UPDATE ON contact_requests
  FOR EACH ROW EXECUTE FUNCTION notify_on_contact_request();

-- =============================================
-- TRIGGER: メッセージ通知 & matches.updated_at更新
-- =============================================

CREATE OR REPLACE FUNCTION notify_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- matches.updated_atを更新（メッセージ新着でソート用）
  UPDATE matches SET updated_at = NOW() WHERE id = NEW.match_id;

  -- 受信側ユーザーに通知
  INSERT INTO notifications (user_id, type, title, body, link, related_company_id, related_match_id, related_message_id)
  SELECT
    u.id,
    'new_message',
    'メッセージが届きました',
    (SELECT name FROM companies WHERE id = NEW.sender_company_id) || 'からメッセージが届きました',
    '/messages/' || NEW.match_id,
    NEW.sender_company_id,
    NEW.match_id,
    NEW.id
  FROM users u
  JOIN matches m ON m.id = NEW.match_id
  WHERE u.company_id IN (m.company_a_id, m.company_b_id)
    AND u.company_id != NEW.sender_company_id
    AND u.is_active = TRUE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_on_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_on_message();

-- =============================================
-- TRIGGER: 企業プロフィール全文検索ベクター更新
-- =============================================

CREATE OR REPLACE FUNCTION update_company_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = to_tsvector('simple',
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.name_kana, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.prefecture, '') || ' ' ||
    COALESCE(NEW.city, '') || ' ' ||
    COALESCE(NEW.main_industry, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_search_vector_update
  BEFORE INSERT OR UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_company_search_vector();

-- =============================================
-- FUNCTION: 新規ユーザー登録時に users テーブルへ自動挿入
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- FUNCTION: Storage用のファイルアクセス制御
-- =============================================

-- company-assetsバケット: 認証済みユーザーは閲覧可能
-- Supabase Storage のポリシーは Storage > Policies で設定してください:
-- Bucket: company-assets
-- SELECT: authenticated
-- INSERT/UPDATE/DELETE: own company's folder (user_id prefix check)

COMMENT ON TABLE companies IS '建設業企業プロフィール';
COMMENT ON TABLE company_licenses IS '企業が保有する建設業許可（29業種）';
COMMENT ON TABLE project_records IS '過去の工事実績';
COMMENT ON TABLE matches IS '相互いいねによるマッチング';
COMMENT ON TABLE likes IS '企業間のいいね';
COMMENT ON TABLE contact_requests IS 'コンタクトリクエスト（承認制）';
COMMENT ON TABLE messages IS 'マッチした企業間のチャットメッセージ';
COMMENT ON TABLE notifications IS '各種通知';
