# 経費管理アプリ — Google Cloud セットアップ手順

## 概要
このアプリは以下のGoogleサービスを使用します：
- **Google Sheets API** — 収支データの読み書き
- **Google Drive API** — レシート画像のアップロード・フォルダ管理
- **Google Cloud Functions** — 経理担当者へのメール通知
- **Google Cloud Storage** — アプリのホスティング

---

## Step 1: Google Cloud プロジェクトの作成

1. [Google Cloud Console](https://console.cloud.google.com/) を開く
2. 上部の「プロジェクトを選択」→「新しいプロジェクト」
3. プロジェクト名: `expense-manager`（任意）
4. 「作成」をクリック

---

## Step 2: APIの有効化

1. メニュー →「APIとサービス」→「ライブラリ」
2. 以下を検索して、それぞれ「有効にする」：
   - **Google Sheets API**
   - **Google Drive API**
   - **Cloud Functions API**（通知機能を使う場合）
   - **Cloud Build API**（Cloud Functions のデプロイに必要）

---

## Step 3: OAuth 2.0 認証情報の設定

### 3-1. OAuth 同意画面の設定
1. 「APIとサービス」→「OAuth 同意画面」
2. User Type: **内部**（組織内のみ使う場合）または **外部**
3. アプリ名: `経費管理`、サポートメール: あなたのメールアドレス
4. スコープを追加:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive`
5. 保存して続行

### 3-2. クライアントIDの作成
1. 「APIとサービス」→「認証情報」→「認証情報を作成」→「OAuthクライアントID」
2. アプリケーションの種類: **ウェブアプリケーション**
3. 名前: `経費管理アプリ`
4. 承認済みのJavaScriptオリジン:
   - `http://localhost:8080`（開発用）
   - `https://storage.googleapis.com`（本番GCS用）
   - （後でGCSのURLが決まったら追加）
5. 「作成」→ **クライアントID** をコピーして保管

---

## Step 4: Google Drive フォルダの作成

1. [Google Drive](https://drive.google.com/) を開く
2. 「新規」→「フォルダ」→ フォルダ名: `経費管理`
3. フォルダを右クリック →「共有」→ アプリを使う全員に **編集権限** を付与
4. フォルダURLから **フォルダID** をコピー
   - URL例: `https://drive.google.com/drive/folders/`**`1AbcDefGhIjKlMnOp`**
   - 太字部分がフォルダID

---

## Step 5: js/config.js を編集

`js/config.js` ファイルを開き、以下を入力：

```javascript
const CONFIG = {
  CLIENT_ID: 'YOUR_CLIENT_ID.apps.googleusercontent.com',  // Step 3でコピーしたもの
  HOME_FOLDER_ID: 'YOUR_FOLDER_ID',                         // Step 4でコピーしたもの
  FISCAL_YEAR_START_MONTH: 4,                               // 年度開始月（4月）
};
```

---

## Step 6: 初回セットアップ（アプリ内）

1. `index.html` をブラウザで開く（または後述のGCSにデプロイ）
2. 「Googleでログイン」→ 自分のGoogleアカウントで認証
3. 設定ページ →「初期設定ウィザード」を実行
   - これによりマスターデータシートと最初の年度シートが自動作成されます

---

## Step 7: Cloud Functions のデプロイ（メール通知、任意）

### 前提
- [Node.js](https://nodejs.org/) がインストールされていること
- [Google Cloud CLI (`gcloud`)](https://cloud.google.com/sdk/docs/install) がインストールされていること

### デプロイ手順

```bash
# 1. Cloud CLIでログイン
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. backendフォルダに移動
cd backend

# 3. 依存パッケージをインストール
npm install

# 4. 環境変数を設定
# SendGridのAPIキー（無料: https://sendgrid.com）
gcloud functions deploy expenseNotify \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --region asia-northeast1 \
  --set-env-vars SENDGRID_API_KEY=YOUR_SENDGRID_KEY,APP_URL=YOUR_APP_URL

# 5. デプロイ後に表示されるURLをコピーして js/config.js の NOTIFY_URL に貼り付け
```

---

## Step 8: Google Cloud Storage へのホスティング（任意）

```bash
# バケットを作成（バケット名は世界でユニークである必要があります）
gsutil mb -l asia-northeast1 gs://your-expense-app

# バケットを公開設定
gsutil iam ch allUsers:objectViewer gs://your-expense-app

# ファイルをアップロード
gsutil -m cp -r app/* gs://your-expense-app/

# ウェブサイトとして設定
gsutil web set -m index.html gs://your-expense-app

# アクセスURL
# https://storage.googleapis.com/your-expense-app/index.html
```

---

## ファイル構成

```
app/
├── index.html          # メインHTML（スタイル + スクリプト読み込み）
├── manifest.json       # PWAマニフェスト（ホーム画面に追加）
├── sw.js               # サービスワーカー（オフライン対応）
├── js/
│   ├── config.js       # ★ 設定ファイル（CLIENT_IDなどを入力）
│   ├── auth.js         # Google Sign-In 認証
│   ├── api.js          # Sheets/Drive API ラッパー
│   └── app.jsx         # React コンポーネント
└── backend/
    ├── index.js        # Cloud Function（メール通知）
    └── package.json
```
