// =============================================
// Application-level Types
// =============================================

export type UserRole = 'admin' | 'company_admin' | 'company_user';
export type CompanyRole = 'general_contractor' | 'subcontractor' | 'both';
export type MatchStatus = 'pending' | 'matched' | 'rejected' | 'withdrawn';
export type ContactRequestStatus = 'pending' | 'accepted' | 'rejected';
export type NotificationType =
  | 'new_like'
  | 'new_match'
  | 'contact_request'
  | 'contact_accepted'
  | 'new_message'
  | 'system';

// =============================================
// Core Entities
// =============================================

export interface Company {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  name_kana: string | null;
  representative_name: string | null;
  established_year: number | null;
  employee_count: number | null;
  capital_amount: number | null;
  annual_revenue: number | null;
  description: string | null;
  postal_code: string | null;
  prefecture: string;
  city: string | null;
  address_line1: string | null;
  address_line2: string | null;
  phone: string | null;
  website_url: string | null;
  logo_url: string | null;
  company_role: CompanyRole;
  main_industry: string | null;
  seeking_description: string | null;
  seeking_regions: string[] | null;
  seeking_roles: CompanyRole[] | null;
  min_project_amount: number | null;
  max_project_amount: number | null;
  license_number: string | null;
  license_authority: string | null;
  license_expiry: string | null;
  is_tokutei: boolean;
  is_active: boolean;
  is_profile_complete: boolean;
  member_since: string;
}

export interface CompanyLicense {
  id: string;
  company_id: string;
  license_type_id: number;
  is_tokutei: boolean;
  created_at: string;
  license_type?: LicenseType;
}

export interface LicenseType {
  id: number;
  code: string;
  name_ja: string;
  name_en: string | null;
  category: 'general' | 'specialty';
  sort_order: number;
}

export interface CompanySpecialtyWork {
  id: string;
  company_id: string;
  work_type: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface ProjectRecord {
  id: string;
  company_id: string;
  created_at: string;
  updated_at: string;
  title: string;
  work_type: string;
  description: string | null;
  location: string | null;
  prefecture: string | null;
  completion_year: number | null;
  project_amount: number | null;
  client_type: string | null;
  sort_order: number;
  is_public: boolean;
  photos?: ProjectPhoto[];
}

export interface ProjectPhoto {
  id: string;
  project_id: string;
  url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface User {
  id: string;
  created_at: string;
  updated_at: string;
  company_id: string | null;
  role: UserRole;
  full_name: string | null;
  full_name_kana: string | null;
  department: string | null;
  title: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_seen_at: string | null;
  company?: Company;
}

export interface Like {
  id: string;
  created_at: string;
  from_company_id: string;
  to_company_id: string;
  from_company?: Company;
  to_company?: Company;
}

export interface Match {
  id: string;
  created_at: string;
  updated_at: string;
  company_a_id: string;
  company_b_id: string;
  status: MatchStatus;
  matched_at: string;
  match_score: number | null;
  company_a?: Company;
  company_b?: Company;
  last_message?: Message;
  unread_count?: number;
}

export interface ContactRequest {
  id: string;
  created_at: string;
  updated_at: string;
  from_company_id: string;
  to_company_id: string;
  message: string | null;
  status: ContactRequestStatus;
  responded_at: string | null;
  from_company?: Company;
  to_company?: Company;
}

export interface Message {
  id: string;
  created_at: string;
  updated_at: string;
  match_id: string;
  sender_user_id: string;
  sender_company_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  is_deleted: boolean;
  sender_user?: User;
  sender_company?: Company;
}

export interface Notification {
  id: string;
  created_at: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  related_company_id: string | null;
  related_match_id: string | null;
  related_message_id: string | null;
  related_company?: Company;
}

export interface CompanyInvitation {
  id: string;
  created_at: string;
  expires_at: string;
  email: string;
  company_name: string | null;
  token: string;
  invited_by: string | null;
  used_at: string | null;
  company_id: string | null;
}

export interface Prefecture {
  id: number;
  code: string;
  name_ja: string;
  region: string;
}

// =============================================
// Enriched Types (with related data)
// =============================================

export interface CompanyWithDetails extends Company {
  licenses: CompanyLicense[];
  specialty_works: CompanySpecialtyWork[];
  project_records: ProjectRecord[];
}

export interface MatchWithCompanies extends Match {
  company_a: Company;
  company_b: Company;
  last_message?: Message;
  unread_count: number;
}

// =============================================
// Search & Filter Types
// =============================================

export interface CompanySearchParams {
  q?: string;
  prefecture?: string;
  region?: string;
  company_role?: CompanyRole;
  license_type_ids?: number[];
  min_employees?: number;
  max_employees?: number;
  page?: number;
  per_page?: number;
}

export interface CompanySearchResult {
  companies: Company[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// =============================================
// Recommendation Type
// =============================================

export interface Recommendation {
  company: Company;
  score: number;
  score_breakdown: {
    role_score: number;
    license_score: number;
    geo_score: number;
    size_score: number;
    seeking_score: number;
  };
  already_liked: boolean;
}

// =============================================
// Dashboard Stats
// =============================================

export interface DashboardStats {
  total_matches: number;
  total_likes_sent: number;
  total_likes_received: number;
  unread_messages: number;
  profile_completion: number;
}

export interface AdminStats {
  total_companies: number;
  total_users: number;
  total_matches: number;
  total_messages: number;
  active_companies: number;
  new_companies_this_month: number;
  new_matches_this_month: number;
}
