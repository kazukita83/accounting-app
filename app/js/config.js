// ============================================================
// config.js — アプリ設定
// ★ このファイルを編集して、あなたの環境に合わせてください
// ============================================================

const CONFIG = {
  // ★ Google Cloud Console で取得したOAuthクライアントID
  // 例: '123456789-abcdefg.apps.googleusercontent.com'
  CLIENT_ID: '942544579592-2m2d04a4cupe85ftn9e66fi7qttr5sj9.apps.googleusercontent.com',

  // ★ Google DriveのホームフォルダID
  // DriveのフォルダURLから取得: https://drive.google.com/drive/folders/【ここ】
  // https://drive.google.com/drive/folders/1xtAKYiRscFyJiKccVUwwePUHw10pefVE
  HOME_FOLDER_ID: '1xtAKYiRscFyJiKccVUwwePUHw10pefVE',

  // ★ Cloud FunctionのURL（メール通知用、任意）
  // デプロイ後に取得したURL。不要な場合は null のままでOK
  NOTIFY_URL: null,

  // 年度開始月 (例: 4 = 4月始まり)
  FISCAL_YEAR_START_MONTH: 4,

  // Google APIスコープ
  SCOPES: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
    'email',
    'profile',
  ].join(' '),

  // アプリ内で使うファイル名
  MASTER_FILE_NAME: 'マスターデータ',
  FISCAL_FILE_PREFIX: '経費管理_',  // 例: 経費管理_2026
  RECEIPT_FOLDER_NAME: 'レシート画像',

  // スプレッドシートのシート名
  SHEETS: {
    USERS: 'ユーザー',
    GROUPS: 'グループ',
    CATEGORIES: '勘定科目',
    SETTINGS: '設定',
    TRANSACTIONS: '支出記録',
    CASH_IN: '入金記録',
    CASH_TRANSFERS: '現金移動',
    BUDGETS: '予算',
  },

  // スプレッドシートの列定義
  COLUMNS: {
    TRANSACTIONS: ['ID','タイムスタンプ','購入日','店舗名','金額','勘定科目','科目グループ','活動グループ','報告者','メールアドレス','メモ','レシートURL','入力方法','ステータス'],
    CASH_IN:      ['ID','タイムスタンプ','入金日','金額','入金元','メモ','登録者','メールアドレス','ステータス'],
    CASH_TRANSFERS: ['ID','タイムスタンプ','日付','種別','活動グループ','金額','メモ','登録者','メールアドレス','ステータス'],
    BUDGETS:      ['活動グループ','予算金額'],
    USERS:        ['氏名','メールアドレス','所属グループ','役割','有効'],
    GROUPS:       ['グループ名','有効'],
    CATEGORIES:   ['科目名','科目グループ','有効'],
    SETTINGS:     ['キー','値'],
  },
};
