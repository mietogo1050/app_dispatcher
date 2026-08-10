// 車両の初期データ
const INITIAL_CARS = [];


// 選択肢として選べるメンバーの元データリスト（マスターデータ）
const MEMBER_LIST = [
  { id: 101, name: 'ハルト', type: 'child', grade: 'high' },
  { id: 102, name: 'レツシ', type: 'child', grade: 'high' },
  { id: 103, name: 'アサヒ', type: 'child', grade: 'high' },
  { id: 104, name: 'ユウマ', type: 'child', grade: 'high' }, 
  { id: 105, name: 'ルキト', type: 'child', grade: 'high' }, 
  { id: 106, name: 'ショウマ', type: 'child', grade: 'high' },
  { id: 107, name: 'ユイト', type: 'child', grade: 'high' },
  { id: 108, name: 'ユイ', type: 'child', grade: 'high' },
  { id: 109, name: 'ヒビキ', type: 'child', grade: 'high' },
  { id: 110, name: 'カズト', type: 'child', grade: 'high' }, 
  { id: 111, name: 'ヤクモ', type: 'child', grade: 'high' }, 
  { id: 112, name: 'ウミ', type: 'child', grade: 'high' },
  { id: 113, name: 'ケイ', type: 'child', grade: 'high' },
  { id: 114, name: 'コウタ', type: 'child', grade: 'low' },
  { id: 115, name: 'ケイジ', type: 'child', grade: 'low' },
  { id: 116, name: 'ユウガ', type: 'child', grade: 'low' }, 
  { id: 117, name: 'ソウタ', type: 'child', grade: 'low' }, 
  { id: 118, name: 'ジョウ', type: 'child', grade: 'low' }, 
  { id: 119, name: 'コウキ', type: 'child', grade: 'low' }, 
  { id: 120, name: 'ハル', type: 'child', grade: 'low' }, 
  { id: 121, name: 'ユウダイ', type: 'child', grade: 'low' }, 
  { id: 122, name: 'ヨシト', type: 'child', grade: 'low' }, 
  { id: 123, name: 'カノン', type: 'child', grade: 'low' }, 
  { id: 124, name: 'カナト', type: 'child', grade: 'low' }, 
  { id: 125, name: 'イオリ', type: 'child', grade: 'low' }, 
];

// アプリ起動時の初期メンバーは「なし」
const INITIAL_MEMBERS = [];