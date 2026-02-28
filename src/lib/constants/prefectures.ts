export const PREFECTURES = [
  { code: '01', nameJa: '北海道', region: '北海道' },
  { code: '02', nameJa: '青森県', region: '東北' },
  { code: '03', nameJa: '岩手県', region: '東北' },
  { code: '04', nameJa: '宮城県', region: '東北' },
  { code: '05', nameJa: '秋田県', region: '東北' },
  { code: '06', nameJa: '山形県', region: '東北' },
  { code: '07', nameJa: '福島県', region: '東北' },
  { code: '08', nameJa: '茨城県', region: '関東' },
  { code: '09', nameJa: '栃木県', region: '関東' },
  { code: '10', nameJa: '群馬県', region: '関東' },
  { code: '11', nameJa: '埼玉県', region: '関東' },
  { code: '12', nameJa: '千葉県', region: '関東' },
  { code: '13', nameJa: '東京都', region: '関東' },
  { code: '14', nameJa: '神奈川県', region: '関東' },
  { code: '15', nameJa: '新潟県', region: '中部' },
  { code: '16', nameJa: '富山県', region: '中部' },
  { code: '17', nameJa: '石川県', region: '中部' },
  { code: '18', nameJa: '福井県', region: '中部' },
  { code: '19', nameJa: '山梨県', region: '中部' },
  { code: '20', nameJa: '長野県', region: '中部' },
  { code: '21', nameJa: '岐阜県', region: '中部' },
  { code: '22', nameJa: '静岡県', region: '中部' },
  { code: '23', nameJa: '愛知県', region: '中部' },
  { code: '24', nameJa: '三重県', region: '近畿' },
  { code: '25', nameJa: '滋賀県', region: '近畿' },
  { code: '26', nameJa: '京都府', region: '近畿' },
  { code: '27', nameJa: '大阪府', region: '近畿' },
  { code: '28', nameJa: '兵庫県', region: '近畿' },
  { code: '29', nameJa: '奈良県', region: '近畿' },
  { code: '30', nameJa: '和歌山県', region: '近畿' },
  { code: '31', nameJa: '鳥取県', region: '中国' },
  { code: '32', nameJa: '島根県', region: '中国' },
  { code: '33', nameJa: '岡山県', region: '中国' },
  { code: '34', nameJa: '広島県', region: '中国' },
  { code: '35', nameJa: '山口県', region: '中国' },
  { code: '36', nameJa: '徳島県', region: '四国' },
  { code: '37', nameJa: '香川県', region: '四国' },
  { code: '38', nameJa: '愛媛県', region: '四国' },
  { code: '39', nameJa: '高知県', region: '四国' },
  { code: '40', nameJa: '福岡県', region: '九州' },
  { code: '41', nameJa: '佐賀県', region: '九州' },
  { code: '42', nameJa: '長崎県', region: '九州' },
  { code: '43', nameJa: '熊本県', region: '九州' },
  { code: '44', nameJa: '大分県', region: '九州' },
  { code: '45', nameJa: '宮崎県', region: '九州' },
  { code: '46', nameJa: '鹿児島県', region: '九州' },
  { code: '47', nameJa: '沖縄県', region: '九州' },
] as const;

export const REGIONS = ['北海道', '東北', '関東', '中部', '近畿', '中国', '四国', '九州'] as const;
export type Region = typeof REGIONS[number];

export function getPrefecturesByRegion(region: string) {
  return PREFECTURES.filter(p => p.region === region);
}

export function getRegionByPrefecture(prefName: string): string | undefined {
  return PREFECTURES.find(p => p.nameJa === prefName)?.region;
}
