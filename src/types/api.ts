// =============================================
// API Request / Response Types
// =============================================

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Company
export interface CreateCompanyInput {
  name: string;
  prefecture: string;
  company_role: 'general_contractor' | 'subcontractor' | 'both';
}

export interface UpdateCompanyInput {
  name?: string;
  name_kana?: string;
  representative_name?: string;
  established_year?: number | null;
  employee_count?: number | null;
  capital_amount?: number | null;
  annual_revenue?: number | null;
  description?: string | null;
  postal_code?: string | null;
  prefecture?: string;
  city?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  phone?: string | null;
  website_url?: string | null;
  company_role?: 'general_contractor' | 'subcontractor' | 'both';
  main_industry?: string | null;
  seeking_description?: string | null;
  seeking_regions?: string[] | null;
  seeking_roles?: ('general_contractor' | 'subcontractor' | 'both')[] | null;
  min_project_amount?: number | null;
  max_project_amount?: number | null;
  license_number?: string | null;
  license_authority?: string | null;
  license_expiry?: string | null;
  is_tokutei?: boolean;
}

// License
export interface UpdateLicensesInput {
  licenses: Array<{
    license_type_id: number;
    is_tokutei: boolean;
  }>;
}

// Project Record
export interface CreateProjectRecordInput {
  title: string;
  work_type: string;
  description?: string | null;
  location?: string | null;
  prefecture?: string | null;
  completion_year?: number | null;
  project_amount?: number | null;
  client_type?: string | null;
  is_public?: boolean;
}

export interface UpdateProjectRecordInput extends Partial<CreateProjectRecordInput> {}

// Like
export interface CreateLikeInput {
  to_company_id: string;
}

// Contact Request
export interface CreateContactRequestInput {
  to_company_id: string;
  message?: string;
}

export interface UpdateContactRequestInput {
  status: 'accepted' | 'rejected';
}

// Message
export interface SendMessageInput {
  content: string;
}

// User
export interface UpdateUserInput {
  full_name?: string;
  full_name_kana?: string;
  department?: string | null;
  title?: string | null;
  phone?: string | null;
}

// Admin - Invitation
export interface CreateInvitationInput {
  email: string;
  company_name?: string;
}

// Admin - Company Status
export interface UpdateCompanyStatusInput {
  is_active: boolean;
}

// Admin - User Status
export interface UpdateUserStatusInput {
  is_active: boolean;
  role?: 'company_admin' | 'company_user';
}
