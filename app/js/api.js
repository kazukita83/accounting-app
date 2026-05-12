// ============================================================
// api.js — Google Sheets / Drive API ラッパー
// すべてのデータ操作はこのモジュールを通して行う
// ============================================================

const API = (() => {

  // ---- 内部ヘルパー ----------------------------------------

  async function authHeaders() {
    const token = await Auth.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async function sheetsGet(spreadsheetId, range) {
    const headers = await authHeaders();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Sheets読み込みエラー: ${err.error?.message || res.statusText}`);
    }
    return res.json();
  }

  async function sheetsAppend(spreadsheetId, range, values) {
    const headers = await authHeaders();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ values }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Sheets書き込みエラー: ${err.error?.message || res.statusText}`);
    }
    return res.json();
  }

  async function sheetsUpdate(spreadsheetId, range, values) {
    const headers = await authHeaders();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ values }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Sheets更新エラー: ${err.error?.message || res.statusText}`);
    }
    return res.json();
  }

  async function sheetsBatchUpdate(spreadsheetId, requests) {
    const headers = await authHeaders();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ requests }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Sheetsバッチ更新エラー: ${err.error?.message || res.statusText}`);
    }
    return res.json();
  }

  // 行データを検索して行番号を返す（1始まり）
  async function findRowIndex(spreadsheetId, sheetName, columnIndex, value) {
    const data = await sheetsGet(spreadsheetId, `${sheetName}!A:Z`);
    const rows = data.values || [];
    for (let i = 1; i < rows.length; i++) {  // i=0はヘッダー
      if (rows[i][columnIndex] === value) return i + 1; // 1-indexed
    }
    return -1;
  }

  // シートの全データをオブジェクト配列に変換
  function rowsToObjects(rows) {
    if (!rows || rows.length < 2) return [];
    const headers = rows[0];
    return rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] || ''; });
      return obj;
    });
  }

  // ---- Drive 操作 -----------------------------------------

  async function driveListFiles(folderId, query = '') {
    const headers = await authHeaders();
    const q = `'${folderId}' in parents and trashed=false${query ? ' and ' + query : ''}`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,createdTime)&orderBy=createdTime+desc`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('Driveファイル一覧取得エラー');
    const data = await res.json();
    return data.files || [];
  }

  async function driveCreateFolder(name, parentId) {
    const headers = await authHeaders();
    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      }),
    });
    if (!res.ok) throw new Error(`フォルダ作成エラー: ${name}`);
    return res.json();
  }

  async function driveCreateSpreadsheet(name, parentId) {
    const headers = await authHeaders();
    // まずDriveにファイルを作成
    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name,
        mimeType: 'application/vnd.google-apps.spreadsheet',
        parents: [parentId],
      }),
    });
    if (!res.ok) throw new Error(`スプレッドシート作成エラー: ${name}`);
    return res.json();
  }

  async function driveUploadFile(file, folderId, fileName) {
    const token = await Auth.getToken();
    // multipart uploadを使用
    const metadata = JSON.stringify({ name: fileName, parents: [folderId] });
    const body = new FormData();
    body.append('metadata', new Blob([metadata], { type: 'application/json' }));
    body.append('file', file);

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
    if (!res.ok) throw new Error('ファイルアップロードエラー');
    return res.json();
  }

  // ---- マスターデータ操作 ----------------------------------

  // ホームフォルダ内のマスターファイルを検索
  async function findMasterFile() {
    const files = await driveListFiles(
      CONFIG.HOME_FOLDER_ID,
      `name='${CONFIG.MASTER_FILE_NAME}' and mimeType='application/vnd.google-apps.spreadsheet'`
    );
    return files[0] || null;
  }

  // マスターファイルを作成（初期設定時）
  async function createMasterFile(groups = []) {
    const file = await driveCreateSpreadsheet(CONFIG.MASTER_FILE_NAME, CONFIG.HOME_FOLDER_ID);
    const sid = file.id;

    const sheets = CONFIG.SHEETS;
    const cols = CONFIG.COLUMNS;

    // デフォルトシートのIDをロケール非依存で取得してリネーム
    const headers = await authHeaders();
    const infoRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}`, { headers });
    const info = await infoRes.json();
    const defaultSheetId = info.sheets[0].properties.sheetId;

    // バッチ操作: デフォルトシートをUSERSにリネーム＋残りのシートを追加
    await sheetsBatchUpdate(sid, [
      { updateSheetProperties: { properties: { sheetId: defaultSheetId, title: sheets.USERS }, fields: 'title' } },
      { addSheet: { properties: { title: sheets.GROUPS } } },
      { addSheet: { properties: { title: sheets.CATEGORIES } } },
      { addSheet: { properties: { title: sheets.SETTINGS } } },
    ]);

    // 各シートにヘッダーを書き込む
    await sheetsUpdate(sid, `${sheets.USERS}!A1`, [cols.USERS]);
    await sheetsUpdate(sid, `${sheets.GROUPS}!A1`, [cols.GROUPS]);
    await sheetsUpdate(sid, `${sheets.CATEGORIES}!A1`, [cols.CATEGORIES]);
    await sheetsUpdate(sid, `${sheets.SETTINGS}!A1`, [['キー', '値']]);

    // デフォルト設定を書き込む
    const user = Auth.currentUser();
    await sheetsAppend(sid, `${sheets.SETTINGS}!A:B`, [
      ['年度開始月', String(CONFIG.FISCAL_YEAR_START_MONTH)],
      ['ホームフォルダID', CONFIG.HOME_FOLDER_ID],
      ['初期設定完了', 'true'],
    ]);

    // 初期ユーザー（セットアップ実行者）を追加
    await sheetsAppend(sid, `${sheets.USERS}!A:E`, [
      [user.name, user.email, '', '経理', 'true'],
    ]);

    // セットアップ時に指定されたグループを書き込む
    if (groups.length > 0) {
      const groupRows = groups.filter(g => g.trim()).map(g => [g.trim(), 'true']);
      await sheetsAppend(sid, `${sheets.GROUPS}!A:B`, groupRows);
    }

    // デフォルト勘定科目を書き込む
    const defaultCategories = [
      ['交通費',   '活動費',   'true'],
      ['消耗品費', '活動費',   'true'],
      ['食費・飲料', '活動費', 'true'],
      ['会場費',   '活動費',   'true'],
      ['印刷費',   '活動費',   'true'],
      ['通信費',   '運営費',   'true'],
      ['雑費',     '運営費',   'true'],
    ];
    await sheetsAppend(sid, `${sheets.CATEGORIES}!A:C`, defaultCategories);

    return sid;
  }

  // マスターデータを全部読み込む
  async function loadMasterData(masterFileId) {
    const sheets = CONFIG.SHEETS;
    const [usersData, groupsData, catsData, settingsData] = await Promise.all([
      sheetsGet(masterFileId, `${sheets.USERS}!A:E`),
      sheetsGet(masterFileId, `${sheets.GROUPS}!A:B`),
      sheetsGet(masterFileId, `${sheets.CATEGORIES}!A:C`),
      sheetsGet(masterFileId, `${sheets.SETTINGS}!A:B`),
    ]);

    const users = rowsToObjects(usersData.values).map(u => ({
      name: u['氏名'],
      email: u['メールアドレス'],
      groups: u['所属グループ'],
      role: u['役割'],
      active: String(u['有効']).toLowerCase() === 'true',
    }));

    const groups = rowsToObjects(groupsData.values).map(g => ({
      name: g['グループ名'],
      active: String(g['有効']).toLowerCase() === 'true',
    }));

    const categories = rowsToObjects(catsData.values).map(c => ({
      name: c['科目名'],
      group: c['科目グループ'],
      active: String(c['有効']).toLowerCase() === 'true',
    }));

    const settings = {};
    rowsToObjects(settingsData.values).forEach(s => {
      settings[s['キー']] = s['値'];
    });

    return { users, groups, categories, settings };
  }

  // ---- 年度ファイル操作 ------------------------------------

  // 年度ファイル一覧を取得（ホームフォルダをスキャン）
  async function listFiscalYears() {
    const files = await driveListFiles(
      CONFIG.HOME_FOLDER_ID,
      `name contains '${CONFIG.FISCAL_FILE_PREFIX}' and mimeType='application/vnd.google-apps.spreadsheet'`
    );
    return files
      .map(f => ({
        id: f.id,
        year: parseInt(f.name.replace(CONFIG.FISCAL_FILE_PREFIX, ''), 10),
        name: f.name,
      }))
      .filter(f => !isNaN(f.year))
      .sort((a, b) => b.year - a.year);
  }

  // 特定年度のファイルIDを取得
  async function getFiscalFileId(year) {
    const files = await driveListFiles(
      CONFIG.HOME_FOLDER_ID,
      `name='${CONFIG.FISCAL_FILE_PREFIX}${year}' and mimeType='application/vnd.google-apps.spreadsheet'`
    );
    return files[0]?.id || null;
  }

  // 新年度ファイルを作成
  async function createFiscalYear(year, groups) {
    const fileName = `${CONFIG.FISCAL_FILE_PREFIX}${year}`;
    const file = await driveCreateSpreadsheet(fileName, CONFIG.HOME_FOLDER_ID);
    const sid = file.id;
    const sheets = CONFIG.SHEETS;
    const cols = CONFIG.COLUMNS;

    // デフォルトシートのIDをロケール非依存で取得してリネーム
    const headers = await authHeaders();
    const infoRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}`, { headers });
    const info = await infoRes.json();
    const defaultSheetId = info.sheets[0].properties.sheetId;

    // シートを追加（デフォルトシートを支出記録にリネーム）
    await sheetsBatchUpdate(sid, [
      { updateSheetProperties: { properties: { sheetId: defaultSheetId, title: sheets.TRANSACTIONS }, fields: 'title' } },
      { addSheet: { properties: { title: sheets.CASH_IN } } },
      { addSheet: { properties: { title: sheets.CASH_TRANSFERS } } },
      { addSheet: { properties: { title: sheets.BUDGETS } } },
    ]);

    // ヘッダーを書き込む
    await sheetsUpdate(sid, `${sheets.TRANSACTIONS}!A1`, [cols.TRANSACTIONS]);
    await sheetsUpdate(sid, `${sheets.CASH_IN}!A1`, [cols.CASH_IN]);
    await sheetsUpdate(sid, `${sheets.CASH_TRANSFERS}!A1`, [cols.CASH_TRANSFERS]);
    await sheetsUpdate(sid, `${sheets.BUDGETS}!A1`, [cols.BUDGETS]);

    // 初期予算（0円）を設定
    const budgetRows = [['全体', '0'], ...groups.map(g => [g.name, '0'])];
    await sheetsAppend(sid, `${sheets.BUDGETS}!A:B`, budgetRows);

    // レシート用フォルダを作成
    const receiptFolder = await ensureReceiptFolder();
    await driveCreateFolder(String(year), receiptFolder.id);

    return { id: sid, year };
  }

  // レシート画像フォルダを取得または作成
  async function ensureReceiptFolder() {
    const files = await driveListFiles(
      CONFIG.HOME_FOLDER_ID,
      `name='${CONFIG.RECEIPT_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder'`
    );
    if (files[0]) return files[0];
    return driveCreateFolder(CONFIG.RECEIPT_FOLDER_NAME, CONFIG.HOME_FOLDER_ID);
  }

  // 年度データを全部読み込む
  async function loadFiscalData(fiscalFileId) {
    const sheets = CONFIG.SHEETS;
    const [txnData, cashInData, transferData, budgetData] = await Promise.all([
      sheetsGet(fiscalFileId, `${sheets.TRANSACTIONS}!A:N`),
      sheetsGet(fiscalFileId, `${sheets.CASH_IN}!A:I`),
      sheetsGet(fiscalFileId, `${sheets.CASH_TRANSFERS}!A:J`),
      sheetsGet(fiscalFileId, `${sheets.BUDGETS}!A:B`),
    ]);

    const transactions = rowsToObjects(txnData.values).map(r => ({
      id: r['ID'],
      timestamp: r['タイムスタンプ'],
      date: r['購入日'],
      seller: r['店舗名'],
      amount: Number(r['金額']) || 0,
      category: r['勘定科目'],
      categoryGroup: r['科目グループ'],
      group: r['活動グループ'],
      reporter: r['報告者'],
      email: r['メールアドレス'],
      memo: r['メモ'],
      photoUrl: r['レシートURL'],
      method: r['入力方法'],
      status: r['ステータス'],
    }));

    const cashIn = rowsToObjects(cashInData.values).map(r => ({
      id: r['ID'],
      timestamp: r['タイムスタンプ'],
      date: r['入金日'],
      amount: Number(r['金額']) || 0,
      source: r['入金元'],
      memo: r['メモ'],
      recorder: r['登録者'],
      email: r['メールアドレス'],
      status: r['ステータス'],
    }));

    const cashTransfers = rowsToObjects(transferData.values).map(r => ({
      id: r['ID'],
      timestamp: r['タイムスタンプ'],
      date: r['日付'],
      type: r['種別'],
      group: r['活動グループ'],
      amount: Number(r['金額']) || 0,
      memo: r['メモ'],
      recorder: r['登録者'],
      email: r['メールアドレス'],
      status: r['ステータス'],
    }));

    const budgets = rowsToObjects(budgetData.values).map(r => ({
      group: r['活動グループ'],
      amount: Number(r['予算金額']) || 0,
    }));

    return { transactions, cashIn, cashTransfers, budgets };
  }

  // ---- 書き込み操作 ----------------------------------------

  function generateId(prefix) {
    const d = new Date();
    const datePart = d.toISOString().slice(0,10).replace(/-/g,'');
    const randPart = Math.random().toString(36).slice(2,6).toUpperCase();
    return `${prefix}-${datePart}-${randPart}`;
  }

  async function addTransaction(fiscalFileId, txn, currentUser) {
    const now = new Date().toISOString();
    const id = generateId('TXN');
    const row = [
      id, now, txn.date, txn.seller, txn.amount,
      txn.category, txn.categoryGroup, txn.group,
      currentUser.name, currentUser.email,
      txn.memo, txn.photoUrl || '', txn.method, '有効',
    ];
    await sheetsAppend(fiscalFileId, `${CONFIG.SHEETS.TRANSACTIONS}!A:N`, [row]);

    // メール通知（設定済みの場合）
    if (CONFIG.NOTIFY_URL) {
      sendNotification({
        type: 'new_expense',
        id, date: txn.date, seller: txn.seller, amount: txn.amount,
        category: txn.category, group: txn.group,
        reporter: currentUser.name, email: currentUser.email,
      }).catch(console.warn);  // 通知失敗はサイレントに
    }

    return { ...txn, id, timestamp: now, reporter: currentUser.name, email: currentUser.email, status: '有効' };
  }

  async function addCashIn(fiscalFileId, record, currentUser) {
    const now = new Date().toISOString();
    const id = generateId('IN');
    const row = [
      id, now, record.date, record.amount, record.source,
      record.memo, currentUser.name, currentUser.email, '有効',
    ];
    await sheetsAppend(fiscalFileId, `${CONFIG.SHEETS.CASH_IN}!A:I`, [row]);
    return { ...record, id, timestamp: now, recorder: currentUser.name, email: currentUser.email, status: '有効' };
  }

  async function addTransfer(fiscalFileId, record, currentUser) {
    const now = new Date().toISOString();
    const id = generateId('TRF');
    const row = [
      id, now, record.date, record.type, record.group, record.amount,
      record.memo, currentUser.name, currentUser.email, '有効',
    ];
    await sheetsAppend(fiscalFileId, `${CONFIG.SHEETS.CASH_TRANSFERS}!A:J`, [row]);
    return { ...record, id, timestamp: now, recorder: currentUser.name, email: currentUser.email, status: '有効' };
  }

  // レコードのステータスを更新（削除/復元）
  async function updateRecordStatus(fiscalFileId, sheetName, idColIndex, id, newStatus) {
    const data = await sheetsGet(fiscalFileId, `${sheetName}!A:Z`);
    const rows = data.values || [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idColIndex] === id) {
        const rowNum = i + 1;
        // ステータス列を特定（最後の列）
        const statusColIndex = rows[0].indexOf('ステータス');
        if (statusColIndex >= 0) {
          const colLetter = String.fromCharCode(65 + statusColIndex);
          await sheetsUpdate(fiscalFileId, `${sheetName}!${colLetter}${rowNum}`, [[newStatus]]);
          return true;
        }
      }
    }
    return false;
  }

  // 支出レコードを更新（フィールドを上書き）
  async function updateTransaction(fiscalFileId, id, updates) {
    const sheetName = CONFIG.SHEETS.TRANSACTIONS;
    const cols = CONFIG.COLUMNS.TRANSACTIONS;
    const data = await sheetsGet(fiscalFileId, `${sheetName}!A:N`);
    const rows = data.values || [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === id) {
        const rowNum = i + 1;
        // 既存の行を更新フィールドで上書き
        const row = [...rows[i]];
        if (updates.date !== undefined)     row[cols.indexOf('購入日')]    = updates.date;
        if (updates.seller !== undefined)   row[cols.indexOf('店舗名')]    = updates.seller;
        if (updates.amount !== undefined)   row[cols.indexOf('金額')]      = String(updates.amount);
        if (updates.category !== undefined) row[cols.indexOf('勘定科目')]  = updates.category;
        if (updates.categoryGroup !== undefined) row[cols.indexOf('科目グループ')] = updates.categoryGroup;
        if (updates.group !== undefined)    row[cols.indexOf('活動グループ')] = updates.group;
        if (updates.memo !== undefined)     row[cols.indexOf('メモ')]      = updates.memo;
        await sheetsUpdate(fiscalFileId, `${sheetName}!A${rowNum}:N${rowNum}`, [row]);
        return true;
      }
    }
    return false;
  }

  async function deleteTransaction(fiscalFileId, id) {
    return updateRecordStatus(fiscalFileId, CONFIG.SHEETS.TRANSACTIONS, 0, id, '削除済');
  }

  async function restoreTransaction(fiscalFileId, id) {
    return updateRecordStatus(fiscalFileId, CONFIG.SHEETS.TRANSACTIONS, 0, id, '有効');
  }

  async function deleteCashIn(fiscalFileId, id) {
    return updateRecordStatus(fiscalFileId, CONFIG.SHEETS.CASH_IN, 0, id, '削除済');
  }

  async function restoreCashIn(fiscalFileId, id) {
    return updateRecordStatus(fiscalFileId, CONFIG.SHEETS.CASH_IN, 0, id, '有効');
  }

  async function deleteTransfer(fiscalFileId, id) {
    return updateRecordStatus(fiscalFileId, CONFIG.SHEETS.CASH_TRANSFERS, 0, id, '削除済');
  }

  async function restoreTransfer(fiscalFileId, id) {
    return updateRecordStatus(fiscalFileId, CONFIG.SHEETS.CASH_TRANSFERS, 0, id, '有効');
  }

  // マスターデータの更新
  async function updateGroups(masterFileId, groups) {
    const rows = [CONFIG.COLUMNS.GROUPS, ...groups.map(g => [g.name, String(g.active)])];
    await sheetsUpdate(masterFileId, `${CONFIG.SHEETS.GROUPS}!A:B`, rows);
  }

  async function updateCategories(masterFileId, categories) {
    const rows = [CONFIG.COLUMNS.CATEGORIES, ...categories.map(c => [c.name, c.group, String(c.active)])];
    await sheetsUpdate(masterFileId, `${CONFIG.SHEETS.CATEGORIES}!A:C`, rows);
  }

  // レシートのアップロード
  async function uploadReceipt(file, year, group) {
    const receiptFolder = await ensureReceiptFolder();
    // 年フォルダを探す
    const yearFolders = await driveListFiles(
      receiptFolder.id,
      `name='${year}' and mimeType='application/vnd.google-apps.folder'`
    );
    const yearFolder = yearFolders[0] || await driveCreateFolder(String(year), receiptFolder.id);

    const ext = file.name.split('.').pop();
    const fileName = `${group}_${new Date().toISOString().slice(0,19).replace(/[T:]/g,'-')}.${ext}`;
    const uploaded = await driveUploadFile(file, yearFolder.id, fileName);
    return uploaded.webViewLink || '';
  }

  // ---- メール通知 ------------------------------------------

  async function sendNotification(payload) {
    if (!CONFIG.NOTIFY_URL) return;
    await fetch(CONFIG.NOTIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  // ---- ユーザー管理 ----------------------------------------

  // ログインユーザーがアプリに登録されているか確認
  async function findAppUser(masterFileId, email) {
    const data = await sheetsGet(masterFileId, `${CONFIG.SHEETS.USERS}!A:E`);
    const users = rowsToObjects(data.values);
    const normalizedEmail = (email || '').toLowerCase().trim();
    return users.find(u =>
      (u['メールアドレス'] || '').toLowerCase().trim() === normalizedEmail &&
      String(u['有効']).toLowerCase() === 'true'
    ) || null;
  }

  // ---- 初期化チェック ------------------------------------

  // セットアップ済みかどうかを確認（マスターファイルの存在確認）
  async function checkSetup() {
    const masterFile = await findMasterFile();
    return { isSetup: !!masterFile, masterFileId: masterFile?.id || null };
  }

  return {
    // セットアップ
    checkSetup,
    findMasterFile,
    createMasterFile,
    loadMasterData,
    findAppUser,
    // 年度
    listFiscalYears,
    getFiscalFileId,
    createFiscalYear,
    loadFiscalData,
    // 書き込み
    addTransaction,
    addCashIn,
    addTransfer,
    updateTransaction,
    deleteTransaction, restoreTransaction,
    deleteCashIn, restoreCashIn,
    deleteTransfer, restoreTransfer,
    updateGroups,
    updateCategories,
    uploadReceipt,
    // ユーティリティ
    sendNotification,
  };
})();
