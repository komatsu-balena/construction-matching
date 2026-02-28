-- =============================================
-- MIGRATION 0003: SEED - 建設業許可29業種
-- =============================================

INSERT INTO license_types (code, name_ja, name_en, category, sort_order) VALUES
  ('doboku',        '土木一式工事',               'General Civil Engineering',            'general',   1),
  ('kenchiku',      '建築一式工事',               'General Building',                     'general',   2),
  ('daiku',         '大工工事',                   'Carpentry',                            'specialty', 3),
  ('sakan',         '左官工事',                   'Plastering',                           'specialty', 4),
  ('tobi',          'とび・土工・コンクリート工事','Scaffolding, Earthwork & Concrete',    'specialty', 5),
  ('ishi',          '石工事',                     'Masonry',                              'specialty', 6),
  ('yane',          '屋根工事',                   'Roofing',                              'specialty', 7),
  ('denki',         '電気工事',                   'Electrical',                           'specialty', 8),
  ('kan',           '管工事',                     'Plumbing',                             'specialty', 9),
  ('tile',          'タイル・れんが・ブロック工事','Tile, Brick & Block',                  'specialty', 10),
  ('kokozo',        '鋼構造物工事',               'Steel Structure',                      'specialty', 11),
  ('tekkin',        '鉄筋工事',                   'Reinforcement Steel',                  'specialty', 12),
  ('hoso',          '舗装工事',                   'Paving',                               'specialty', 13),
  ('shunsetsu',     'しゅんせつ工事',             'Dredging',                             'specialty', 14),
  ('bankin',        '板金工事',                   'Sheet Metal',                          'specialty', 15),
  ('glass',         'ガラス工事',                 'Glazing',                              'specialty', 16),
  ('toso',          '塗装工事',                   'Painting',                             'specialty', 17),
  ('bousui',        '防水工事',                   'Waterproofing',                        'specialty', 18),
  ('naiso',         '内装仕上工事',               'Interior Finishing',                   'specialty', 19),
  ('kikai',         '機械器具設置工事',           'Machine & Equipment Installation',     'specialty', 20),
  ('netsuzekuen',   '熱絶縁工事',                 'Heat Insulation',                      'specialty', 21),
  ('denki_tsushin', '電気通信工事',               'Telecommunication',                    'specialty', 22),
  ('zouen',         '造園工事',                   'Landscaping & Gardening',              'specialty', 23),
  ('saku_i',        'さく井工事',                 'Well Drilling',                        'specialty', 24),
  ('tategu',        '建具工事',                   'Fittings',                             'specialty', 25),
  ('suido',         '水道施設工事',               'Water & Sewerage',                     'specialty', 26),
  ('shobo',         '消防施設工事',               'Fire Protection Facilities',           'specialty', 27),
  ('seiso',         '清掃施設工事',               'Sanitation Facilities',                'specialty', 28),
  ('kaitsu',        '解体工事',                   'Demolition',                           'specialty', 29);
