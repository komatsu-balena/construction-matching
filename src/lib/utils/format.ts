// 日本語フォーマットユーティリティ

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '非公開';
  if (amount >= 100_000_000) {
    const oku = amount / 100_000_000;
    return oku % 1 === 0 ? `${oku}億円` : `${oku.toFixed(1)}億円`;
  }
  if (amount >= 10_000) {
    const man = amount / 10_000;
    return man % 1 === 0 ? `${man}万円` : `${man.toFixed(0)}万円`;
  }
  return `${amount.toLocaleString('ja-JP')}円`;
}

export function formatEmployeeCount(count: number | null | undefined): string {
  if (count == null) return '非公開';
  return `${count.toLocaleString('ja-JP')}名`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'たった今';
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  if (diffDay < 7) return `${diffDay}日前`;
  return formatDate(dateStr);
}

export function formatProjectAmount(amount: number | null | undefined): string {
  if (amount == null) return '非公開';
  return formatCurrency(amount);
}

export function companyRoleLabel(role: string): string {
  switch (role) {
    case 'general_contractor': return '元請';
    case 'subcontractor': return '下請';
    case 'both': return '元請・下請';
    default: return role;
  }
}

export function clientTypeLabel(type: string | null | undefined): string {
  switch (type) {
    case 'public': return '公共工事';
    case 'private': return '民間工事';
    case 'both': return '公共・民間';
    default: return type ?? '';
  }
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '…';
}
