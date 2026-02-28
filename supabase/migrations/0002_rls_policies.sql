-- =============================================
-- MIGRATION 0002: ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_specialty_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;

-- license_types and prefectures are public read (master data)
ALTER TABLE license_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE prefectures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "License types are publicly readable"
  ON license_types FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Prefectures are publicly readable"
  ON prefectures FOR SELECT TO authenticated USING (TRUE);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT role = 'admin' FROM users WHERE id = auth.uid()), FALSE);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_company_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT role IN ('admin', 'company_admin') FROM users WHERE id = auth.uid()), FALSE);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- COMPANIES POLICIES
-- =============================================

-- 認証済み会員は有効な企業を閲覧可能
CREATE POLICY "Authenticated members can view active companies"
  ON companies FOR SELECT
  TO authenticated
  USING (is_active = TRUE OR id = get_my_company_id() OR is_admin());

-- 管理者は全企業を操作可能
CREATE POLICY "Admins have full company access"
  ON companies FOR ALL
  TO authenticated
  USING (is_admin());

-- 企業管理者は自社を更新可能
CREATE POLICY "Company admins can update own company"
  ON companies FOR UPDATE
  TO authenticated
  USING (id = get_my_company_id() AND is_company_admin())
  WITH CHECK (id = get_my_company_id() AND is_company_admin());

-- =============================================
-- COMPANY_LICENSES POLICIES
-- =============================================

CREATE POLICY "Members can view company licenses"
  ON company_licenses FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Company admins can manage own licenses"
  ON company_licenses FOR ALL
  TO authenticated
  USING (company_id = get_my_company_id() AND is_company_admin() OR is_admin());

-- =============================================
-- COMPANY_SPECIALTY_WORKS POLICIES
-- =============================================

CREATE POLICY "Members can view specialty works"
  ON company_specialty_works FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Company admins can manage own specialty works"
  ON company_specialty_works FOR ALL
  TO authenticated
  USING (company_id = get_my_company_id() AND is_company_admin() OR is_admin());

-- =============================================
-- PROJECT_RECORDS POLICIES
-- =============================================

CREATE POLICY "Members can view public project records"
  ON project_records FOR SELECT
  TO authenticated
  USING (is_public = TRUE OR company_id = get_my_company_id() OR is_admin());

CREATE POLICY "Company admins can manage own project records"
  ON project_records FOR ALL
  TO authenticated
  USING (company_id = get_my_company_id() AND is_company_admin() OR is_admin());

-- =============================================
-- PROJECT_PHOTOS POLICIES
-- =============================================

CREATE POLICY "Members can view project photos"
  ON project_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_records pr
      WHERE pr.id = project_id
        AND (pr.is_public = TRUE OR pr.company_id = get_my_company_id())
    ) OR is_admin()
  );

CREATE POLICY "Company admins can manage own project photos"
  ON project_photos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_records pr
      WHERE pr.id = project_id AND pr.company_id = get_my_company_id()
    ) AND is_company_admin() OR is_admin()
  );

-- =============================================
-- USERS POLICIES
-- =============================================

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can view company members"
  ON users FOR SELECT
  TO authenticated
  USING (company_id = get_my_company_id() AND company_id IS NOT NULL);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update any user"
  ON users FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Users can be inserted by system"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid() OR is_admin());

-- =============================================
-- LIKES POLICIES
-- =============================================

CREATE POLICY "View own company likes"
  ON likes FOR SELECT
  TO authenticated
  USING (
    from_company_id = get_my_company_id() OR
    to_company_id = get_my_company_id() OR
    is_admin()
  );

CREATE POLICY "Insert likes for own company"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (from_company_id = get_my_company_id());

CREATE POLICY "Delete own company likes"
  ON likes FOR DELETE
  TO authenticated
  USING (from_company_id = get_my_company_id() OR is_admin());

-- =============================================
-- MATCHES POLICIES
-- =============================================

CREATE POLICY "View own matches"
  ON matches FOR SELECT
  TO authenticated
  USING (
    company_a_id = get_my_company_id() OR
    company_b_id = get_my_company_id() OR
    is_admin()
  );

CREATE POLICY "Admins can manage matches"
  ON matches FOR ALL
  TO authenticated
  USING (is_admin());

-- =============================================
-- CONTACT_REQUESTS POLICIES
-- =============================================

CREATE POLICY "View own contact requests"
  ON contact_requests FOR SELECT
  TO authenticated
  USING (
    from_company_id = get_my_company_id() OR
    to_company_id = get_my_company_id() OR
    is_admin()
  );

CREATE POLICY "Send contact requests from own company"
  ON contact_requests FOR INSERT
  TO authenticated
  WITH CHECK (from_company_id = get_my_company_id());

CREATE POLICY "Update contact requests to own company"
  ON contact_requests FOR UPDATE
  TO authenticated
  USING (to_company_id = get_my_company_id() OR is_admin())
  WITH CHECK (to_company_id = get_my_company_id() OR is_admin());

-- =============================================
-- MESSAGES POLICIES
-- =============================================

CREATE POLICY "View messages in own matches"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
        AND (m.company_a_id = get_my_company_id() OR m.company_b_id = get_my_company_id())
    ) OR is_admin()
  );

CREATE POLICY "Send messages in own matches"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_company_id = get_my_company_id() AND
    sender_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
        AND (m.company_a_id = get_my_company_id() OR m.company_b_id = get_my_company_id())
        AND m.status = 'matched'
    )
  );

CREATE POLICY "Update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (sender_user_id = auth.uid() OR is_admin())
  WITH CHECK (sender_user_id = auth.uid() OR is_admin());

-- =============================================
-- NOTIFICATIONS POLICIES
-- =============================================

CREATE POLICY "View own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- =============================================
-- COMPANY_INVITATIONS POLICIES
-- =============================================

CREATE POLICY "Admins can manage invitations"
  ON company_invitations FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "View own invitation by token"
  ON company_invitations FOR SELECT
  TO anon
  USING (TRUE);
