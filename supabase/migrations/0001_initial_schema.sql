-- =============================================
-- MIGRATION 0001: INITIAL SCHEMA
-- 建設業ビジネスマッチングプラットフォーム
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- ENUM TYPES
-- =============================================

CREATE TYPE user_role AS ENUM ('admin', 'company_admin', 'company_user');
CREATE TYPE company_role AS ENUM ('general_contractor', 'subcontractor', 'both');
CREATE TYPE match_status AS ENUM ('pending', 'matched', 'rejected', 'withdrawn');
CREATE TYPE contact_request_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE notification_type AS ENUM (
  'new_like', 'new_match', 'contact_request',
  'contact_accepted', 'new_message', 'system'
);

-- =============================================
-- TABLE: license_types (建設業許可29業種マスタ)
-- =============================================
CREATE TABLE license_types (
  id          SERIAL PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  name_ja     TEXT NOT NULL,
  name_en     TEXT,
  category    TEXT NOT NULL CHECK (category IN ('general', 'specialty')),
  sort_order  INTEGER NOT NULL
);

-- =============================================
-- TABLE: prefectures (都道府県マスタ)
-- =============================================
CREATE TABLE prefectures (
  id       SERIAL PRIMARY KEY,
  code     TEXT NOT NULL UNIQUE,
  name_ja  TEXT NOT NULL,
  region   TEXT NOT NULL
);

-- =============================================
-- TABLE: companies (企業)
-- =============================================
CREATE TABLE companies (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 基本情報
  name                  TEXT NOT NULL,
  name_kana             TEXT,
  representative_name   TEXT,
  established_year      INTEGER,
  employee_count        INTEGER,
  capital_amount        BIGINT,
  annual_revenue        BIGINT,
  description           TEXT,

  -- 連絡先・所在地
  postal_code           TEXT,
  prefecture            TEXT NOT NULL,
  city                  TEXT,
  address_line1         TEXT,
  address_line2         TEXT,
  phone                 TEXT,
  website_url           TEXT,
  logo_url              TEXT,

  -- 事業分類
  company_role          company_role NOT NULL DEFAULT 'both',
  main_industry         TEXT,

  -- 求めていること
  seeking_description   TEXT,
  seeking_regions       TEXT[],
  seeking_roles         company_role[],
  min_project_amount    BIGINT,
  max_project_amount    BIGINT,

  -- 建設業許可情報
  license_number        TEXT,
  license_authority     TEXT,
  license_expiry        DATE,
  is_tokutei            BOOLEAN DEFAULT FALSE,

  -- ステータス
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  is_profile_complete   BOOLEAN NOT NULL DEFAULT FALSE,
  member_since          TIMESTAMPTZ DEFAULT NOW(),

  -- 全文検索用
  search_vector         TSVECTOR,

  CONSTRAINT companies_employee_count_positive CHECK (employee_count IS NULL OR employee_count > 0),
  CONSTRAINT companies_capital_positive CHECK (capital_amount IS NULL OR capital_amount >= 0)
);

CREATE INDEX idx_companies_prefecture ON companies(prefecture);
CREATE INDEX idx_companies_role ON companies(company_role);
CREATE INDEX idx_companies_active ON companies(is_active);
CREATE INDEX idx_companies_search ON companies USING GIN(search_vector);
CREATE INDEX idx_companies_name_trgm ON companies USING GIN(name gin_trgm_ops);

-- =============================================
-- TABLE: company_licenses (企業×建設業許可)
-- =============================================
CREATE TABLE company_licenses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  license_type_id INTEGER NOT NULL REFERENCES license_types(id),
  is_tokutei      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(company_id, license_type_id)
);

CREATE INDEX idx_company_licenses_company ON company_licenses(company_id);
CREATE INDEX idx_company_licenses_type ON company_licenses(license_type_id);

-- =============================================
-- TABLE: company_specialty_works (得意工事)
-- =============================================
CREATE TABLE company_specialty_works (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  work_type   TEXT NOT NULL,
  description TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_specialty_works_company ON company_specialty_works(company_id);

-- =============================================
-- TABLE: project_records (過去工事実績)
-- =============================================
CREATE TABLE project_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  title           TEXT NOT NULL,
  work_type       TEXT NOT NULL,
  description     TEXT,
  location        TEXT,
  prefecture      TEXT,
  completion_year INTEGER,
  project_amount  BIGINT,
  client_type     TEXT,
  sort_order      INTEGER DEFAULT 0,
  is_public       BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_project_records_company ON project_records(company_id);

-- =============================================
-- TABLE: project_photos (工事実績写真)
-- =============================================
CREATE TABLE project_photos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES project_records(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  caption     TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_photos_project ON project_photos(project_id);

-- =============================================
-- TABLE: users (ユーザー - auth.usersの拡張)
-- =============================================
CREATE TABLE users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,
  role            user_role NOT NULL DEFAULT 'company_user',

  full_name       TEXT,
  full_name_kana  TEXT,
  department      TEXT,
  title           TEXT,
  phone           TEXT,
  avatar_url      TEXT,

  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at    TIMESTAMPTZ
);

CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_role ON users(role);

-- =============================================
-- TABLE: likes (いいね)
-- =============================================
CREATE TABLE likes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  from_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  to_company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  UNIQUE(from_company_id, to_company_id),
  CONSTRAINT likes_no_self_like CHECK (from_company_id != to_company_id)
);

CREATE INDEX idx_likes_from ON likes(from_company_id);
CREATE INDEX idx_likes_to ON likes(to_company_id);
CREATE INDEX idx_likes_created ON likes(created_at);

-- =============================================
-- TABLE: matches (マッチング)
-- =============================================
CREATE TABLE matches (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  company_a_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  company_b_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status        match_status NOT NULL DEFAULT 'matched',
  matched_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  match_score   FLOAT,

  UNIQUE(company_a_id, company_b_id),
  CONSTRAINT matches_no_self CHECK (company_a_id != company_b_id)
);

CREATE INDEX idx_matches_company_a ON matches(company_a_id);
CREATE INDEX idx_matches_company_b ON matches(company_b_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_updated ON matches(updated_at DESC);

-- =============================================
-- TABLE: contact_requests (コンタクトリクエスト)
-- =============================================
CREATE TABLE contact_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  from_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  to_company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  message         TEXT,
  status          contact_request_status NOT NULL DEFAULT 'pending',
  responded_at    TIMESTAMPTZ,

  UNIQUE(from_company_id, to_company_id),
  CONSTRAINT contact_no_self CHECK (from_company_id != to_company_id)
);

CREATE INDEX idx_contact_requests_from ON contact_requests(from_company_id);
CREATE INDEX idx_contact_requests_to ON contact_requests(to_company_id);
CREATE INDEX idx_contact_requests_status ON contact_requests(status);

-- =============================================
-- TABLE: messages (メッセージ)
-- =============================================
CREATE TABLE messages (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  match_id          UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  content           TEXT NOT NULL,
  is_read           BOOLEAN NOT NULL DEFAULT FALSE,
  read_at           TIMESTAMPTZ,
  is_deleted        BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_messages_match ON messages(match_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_user_id);
CREATE INDEX idx_messages_unread ON messages(match_id, is_read) WHERE is_read = FALSE;

-- =============================================
-- TABLE: notifications (通知)
-- =============================================
CREATE TABLE notifications (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                notification_type NOT NULL,
  title               TEXT NOT NULL,
  body                TEXT,
  link                TEXT,
  is_read             BOOLEAN NOT NULL DEFAULT FALSE,
  read_at             TIMESTAMPTZ,

  related_company_id  UUID REFERENCES companies(id) ON DELETE SET NULL,
  related_match_id    UUID REFERENCES matches(id) ON DELETE SET NULL,
  related_message_id  UUID REFERENCES messages(id) ON DELETE SET NULL
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- =============================================
-- TABLE: company_invitations (企業招待)
-- =============================================
CREATE TABLE company_invitations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),

  email         TEXT NOT NULL,
  company_name  TEXT,
  token         TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by    UUID REFERENCES users(id),
  used_at       TIMESTAMPTZ,
  company_id    UUID REFERENCES companies(id)
);

CREATE INDEX idx_invitations_token ON company_invitations(token);
CREATE INDEX idx_invitations_email ON company_invitations(email);
