import type { Company, CompanyLicense } from '@/types/app';
import { getRegionByPrefecture } from '@/lib/constants/prefectures';

// =============================================
// レコメンドスコアリングアルゴリズム
// スコア: 0〜100点
// 60点以上 → 強いおすすめ
// 40点以上 → おすすめ
// =============================================

export interface ScoreBreakdown {
  role_score: number;       // 役割の相補性 (0-30)
  license_score: number;    // 許認可の一致 (0-25)
  geo_score: number;        // 地域の一致 (0-20)
  size_score: number;       // 企業規模の相性 (0-15)
  seeking_score: number;    // 求めること一致 (0-10)
}

export interface ScoredCompany {
  company: Company & { licenses?: CompanyLicense[] };
  score: number;
  breakdown: ScoreBreakdown;
}

// 役割スコア (最大30点)
function calculateRoleScore(
  viewerRole: string,
  candidateRole: string,
  viewerSeekingRoles: string[] | null
): number {
  // 元請が下請を探す（または逆）= 完全補完
  const complementary =
    (viewerRole === 'general_contractor' && (candidateRole === 'subcontractor' || candidateRole === 'both')) ||
    (viewerRole === 'subcontractor' && (candidateRole === 'general_contractor' || candidateRole === 'both')) ||
    (viewerRole === 'both');

  if (complementary) return 30;

  // seekingRolesに候補が含まれる
  if (viewerSeekingRoles && viewerSeekingRoles.includes(candidateRole)) return 25;

  // 同じ役割同士（両者が元請、など）
  if (viewerRole === candidateRole) return 10;

  return 5;
}

// 許認可重複スコア (最大25点)
function calculateLicenseScore(
  viewerLicenseIds: number[],
  candidateLicenseIds: number[]
): number {
  if (viewerLicenseIds.length === 0 || candidateLicenseIds.length === 0) return 0;

  const candidateSet = new Set(candidateLicenseIds);
  const overlap = viewerLicenseIds.filter(id => candidateSet.has(id)).length;
  const maxPossible = Math.max(viewerLicenseIds.length, candidateLicenseIds.length);
  const ratio = overlap / maxPossible;

  return Math.round(ratio * 25);
}

// 地域スコア (最大20点)
function calculateGeoScore(
  viewerPrefecture: string,
  candidatePrefecture: string,
  viewerSeekingRegions: string[] | null,
  candidateSeekingRegions: string[] | null
): number {
  // 同一都道府県
  if (viewerPrefecture === candidatePrefecture) return 20;

  const viewerRegion = getRegionByPrefecture(viewerPrefecture);
  const candidateRegion = getRegionByPrefecture(candidatePrefecture);

  // 同一地域
  if (viewerRegion && candidateRegion && viewerRegion === candidateRegion) return 14;

  // 候補のエリアが閲覧者の都道府県を含む
  if (candidateSeekingRegions) {
    if (
      candidateSeekingRegions.includes(viewerPrefecture) ||
      (viewerRegion && candidateSeekingRegions.includes(viewerRegion)) ||
      candidateSeekingRegions.includes('全国')
    ) {
      return 10;
    }
  }

  // 閲覧者の希望エリアに候補が含まれる
  if (viewerSeekingRegions) {
    if (
      viewerSeekingRegions.includes(candidatePrefecture) ||
      (candidateRegion && viewerSeekingRegions.includes(candidateRegion)) ||
      viewerSeekingRegions.includes('全国')
    ) {
      return 10;
    }
  }

  return 3;
}

// 企業規模スコア (最大15点)
function calculateSizeScore(
  viewerEmployees: number | null,
  candidateEmployees: number | null
): number {
  if (viewerEmployees == null || candidateEmployees == null) return 7; // 不明時は中間

  // 規模差の比率で判定
  const ratio = Math.min(viewerEmployees, candidateEmployees) / Math.max(viewerEmployees, candidateEmployees);

  if (ratio >= 0.5) return 15;   // 2倍以内の規模差
  if (ratio >= 0.2) return 10;   // 5倍以内
  if (ratio >= 0.1) return 5;    // 10倍以内
  return 2;
}

// 求めること一致スコア (最大10点)
function calculateSeekingScore(
  viewerSeekingRoles: string[] | null,
  candidateRole: string,
  candidateSeekingRoles: string[] | null,
  viewerRole: string
): number {
  let score = 0;

  // 閲覧者が候補の役割を求めている
  if (viewerSeekingRoles && viewerSeekingRoles.includes(candidateRole)) score += 5;

  // 候補が閲覧者の役割を求めている
  if (candidateSeekingRoles && candidateSeekingRoles.includes(viewerRole)) score += 5;

  return score;
}

// =============================================
// メインスコアリング関数
// =============================================

export function calculateMatchScore(
  viewer: Company & { licenses?: CompanyLicense[] },
  candidate: Company & { licenses?: CompanyLicense[] }
): ScoredCompany {
  const viewerLicenseIds = viewer.licenses?.map(l => l.license_type_id) ?? [];
  const candidateLicenseIds = candidate.licenses?.map(l => l.license_type_id) ?? [];

  const roleScore = calculateRoleScore(
    viewer.company_role,
    candidate.company_role,
    viewer.seeking_roles as string[] | null
  );

  const licenseScore = calculateLicenseScore(viewerLicenseIds, candidateLicenseIds);

  const geoScore = calculateGeoScore(
    viewer.prefecture,
    candidate.prefecture,
    viewer.seeking_regions,
    candidate.seeking_regions
  );

  const sizeScore = calculateSizeScore(viewer.employee_count, candidate.employee_count);

  const seekingScore = calculateSeekingScore(
    viewer.seeking_roles as string[] | null,
    candidate.company_role,
    candidate.seeking_roles as string[] | null,
    viewer.company_role
  );

  const breakdown: ScoreBreakdown = {
    role_score: roleScore,
    license_score: licenseScore,
    geo_score: geoScore,
    size_score: sizeScore,
    seeking_score: seekingScore,
  };

  const score = Math.min(100, Math.round(
    roleScore + licenseScore + geoScore + sizeScore + seekingScore
  ));

  return { company: candidate, score, breakdown };
}

export function getRecommendationLabel(score: number): string {
  if (score >= 60) return '強くおすすめ';
  if (score >= 40) return 'おすすめ';
  return '';
}

export function sortByScore(scored: ScoredCompany[]): ScoredCompany[] {
  return [...scored].sort((a, b) => b.score - a.score);
}
