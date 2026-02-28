// 建設業許可29業種
export const CONSTRUCTION_LICENSES = [
  { id: 1,  code: 'doboku',        nameJa: '土木一式工事',                category: 'general'   },
  { id: 2,  code: 'kenchiku',      nameJa: '建築一式工事',                category: 'general'   },
  { id: 3,  code: 'daiku',         nameJa: '大工工事',                    category: 'specialty' },
  { id: 4,  code: 'sakan',         nameJa: '左官工事',                    category: 'specialty' },
  { id: 5,  code: 'tobi',          nameJa: 'とび・土工・コンクリート工事', category: 'specialty' },
  { id: 6,  code: 'ishi',          nameJa: '石工事',                      category: 'specialty' },
  { id: 7,  code: 'yane',          nameJa: '屋根工事',                    category: 'specialty' },
  { id: 8,  code: 'denki',         nameJa: '電気工事',                    category: 'specialty' },
  { id: 9,  code: 'kan',           nameJa: '管工事',                      category: 'specialty' },
  { id: 10, code: 'tile',          nameJa: 'タイル・れんが・ブロック工事', category: 'specialty' },
  { id: 11, code: 'kokozo',        nameJa: '鋼構造物工事',                category: 'specialty' },
  { id: 12, code: 'tekkin',        nameJa: '鉄筋工事',                    category: 'specialty' },
  { id: 13, code: 'hoso',          nameJa: '舗装工事',                    category: 'specialty' },
  { id: 14, code: 'shunsetsu',     nameJa: 'しゅんせつ工事',              category: 'specialty' },
  { id: 15, code: 'bankin',        nameJa: '板金工事',                    category: 'specialty' },
  { id: 16, code: 'glass',         nameJa: 'ガラス工事',                  category: 'specialty' },
  { id: 17, code: 'toso',          nameJa: '塗装工事',                    category: 'specialty' },
  { id: 18, code: 'bousui',        nameJa: '防水工事',                    category: 'specialty' },
  { id: 19, code: 'naiso',         nameJa: '内装仕上工事',                category: 'specialty' },
  { id: 20, code: 'kikai',         nameJa: '機械器具設置工事',            category: 'specialty' },
  { id: 21, code: 'netsuzekuen',   nameJa: '熱絶縁工事',                  category: 'specialty' },
  { id: 22, code: 'denki_tsushin', nameJa: '電気通信工事',                category: 'specialty' },
  { id: 23, code: 'zouen',         nameJa: '造園工事',                    category: 'specialty' },
  { id: 24, code: 'saku_i',        nameJa: 'さく井工事',                  category: 'specialty' },
  { id: 25, code: 'tategu',        nameJa: '建具工事',                    category: 'specialty' },
  { id: 26, code: 'suido',         nameJa: '水道施設工事',                category: 'specialty' },
  { id: 27, code: 'shobo',         nameJa: '消防施設工事',                category: 'specialty' },
  { id: 28, code: 'seiso',         nameJa: '清掃施設工事',                category: 'specialty' },
  { id: 29, code: 'kaitsu',        nameJa: '解体工事',                    category: 'specialty' },
] as const;

export type LicenseCode = typeof CONSTRUCTION_LICENSES[number]['code'];

export const GENERAL_LICENSES = CONSTRUCTION_LICENSES.filter(l => l.category === 'general');
export const SPECIALTY_LICENSES = CONSTRUCTION_LICENSES.filter(l => l.category === 'specialty');

export function getLicenseById(id: number) {
  return CONSTRUCTION_LICENSES.find(l => l.id === id);
}

export function getLicenseByCode(code: string) {
  return CONSTRUCTION_LICENSES.find(l => l.code === code);
}
