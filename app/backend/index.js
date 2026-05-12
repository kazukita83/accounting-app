// ============================================================
// index.js — Cloud Function: 経費通知メール
// デプロイ: gcloud functions deploy expenseNotify --runtime nodejs20
//           --trigger-http --allow-unauthenticated
//           --set-env-vars SENDGRID_API_KEY=xxx,ACCOUNTANT_EMAILS=a@x.com;b@x.com
// ============================================================

const sgMail = require('@sendgrid/mail');

// SendGrid API キー（環境変数から読み込む）
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// 経理担当者のメールアドレス（セミコロン区切り）
const ACCOUNTANT_EMAILS = (process.env.ACCOUNTANT_EMAILS || '').split(';').filter(Boolean);

// 送信元メールアドレス（SendGridで認証済みのアドレスを使うこと）
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yourdomain.com';

// アプリのURL（メール内のリンクに使用）
const APP_URL = process.env.APP_URL || 'https://storage.googleapis.com/your-bucket/index.html';

/**
 * メインハンドラー
 * POST /expenseNotify
 * Body: { type: 'new_expense', ...fields }
 */
exports.expenseNotify = async (req, res) => {
  // CORS ヘッダー（ブラウザから直接呼ばれるため）
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const body = req.body;
  if (!body || !body.type) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  try {
    if (body.type === 'new_expense') {
      await sendNewExpenseNotification(body);
    } else {
      res.status(400).json({ error: `Unknown notification type: ${body.type}` });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('通知送信エラー:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * 新規経費登録通知メールを送信
 */
async function sendNewExpenseNotification(data) {
  if (ACCOUNTANT_EMAILS.length === 0) {
    console.warn('ACCOUNTANT_EMAILS が設定されていません。通知は送信されません。');
    return;
  }

  const fmt = (n) => '¥' + Number(n || 0).toLocaleString('ja-JP');
  const date = data.date || '不明';
  const seller = data.seller || '（店舗名なし）';
  const amount = fmt(data.amount);
  const category = data.category || '未分類';
  const group = data.group || '—';
  const reporter = data.reporter || data.email || '不明';

  const subject = `[経費管理] 新しい経費が登録されました — ${reporter}`;

  const htmlBody = `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; background: #f3f4f6; margin: 0; padding: 0; }
  .container { max-width: 480px; margin: 24px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
  .header { background: #1d4ed8; color: #fff; padding: 20px 24px; }
  .header h1 { margin: 0; font-size: 18px; font-weight: 600; }
  .header p { margin: 4px 0 0; font-size: 13px; opacity: .8; }
  .body { padding: 24px; }
  .amount { font-size: 32px; font-weight: 700; color: #dc2626; margin: 0 0 20px; }
  .row { display: flex; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
  .label { width: 100px; flex-shrink: 0; font-size: 12px; color: #6b7280; padding-top: 2px; }
  .value { flex: 1; font-size: 14px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 500; background: #dbeafe; color: #1d4ed8; }
  .footer { padding: 16px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
  .btn { display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <h1>💰 経費管理</h1>
    <p>新しい経費が登録されました</p>
  </div>
  <div class="body">
    <div class="amount">-${amount}</div>
    <div class="row"><div class="label">購入日</div><div class="value">${date}</div></div>
    <div class="row"><div class="label">店舗名</div><div class="value">${seller}</div></div>
    <div class="row"><div class="label">勘定科目</div><div class="value"><span class="badge">${category}</span></div></div>
    <div class="row"><div class="label">活動グループ</div><div class="value">${group}</div></div>
    <div class="row"><div class="label">登録者</div><div class="value">${reporter}</div></div>
    ${data.memo ? `<div class="row"><div class="label">メモ</div><div class="value">${data.memo}</div></div>` : ''}
    ${data.id ? `<div class="row"><div class="label">記録ID</div><div class="value" style="font-size:12px;color:#9ca3af">${data.id}</div></div>` : ''}
  </div>
  <div class="footer">
    <a href="${APP_URL}" class="btn">アプリで確認する</a>
    <p style="font-size:11px;color:#9ca3af;margin-top:12px">このメールは経費管理アプリから自動送信されています。</p>
  </div>
</div>
</body>
</html>
  `.trim();

  const textBody = `
新しい経費が登録されました

金額: ${amount}
購入日: ${date}
店舗名: ${seller}
勘定科目: ${category}
活動グループ: ${group}
登録者: ${reporter}
${data.memo ? `メモ: ${data.memo}` : ''}
${data.id ? `記録ID: ${data.id}` : ''}

アプリで確認: ${APP_URL}
  `.trim();

  const messages = ACCOUNTANT_EMAILS.map(email => ({
    to: email,
    from: FROM_EMAIL,
    subject,
    text: textBody,
    html: htmlBody,
  }));

  await Promise.all(messages.map(msg => sgMail.send(msg)));
  console.log(`通知を ${ACCOUNTANT_EMAILS.length} 件送信しました`);
}
