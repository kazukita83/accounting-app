# 経費管理アプリ 要件定義書
# Expense Tracking App — Requirements Specification

---

## 1. 概要 / Overview

A Progressive Web App (PWA) for an association's expense tracking. Working group members photograph receipts or enter expenses manually, the app extracts key data via OCR (when a photo is provided), and records are saved to a Google Spreadsheet. Each fiscal year has its own spreadsheet file and receipt photo folder on Google Drive, with the Drive folder structure serving as the single source of truth. The accountants use the spreadsheets (and optionally the app) to track budgets and produce year-end reports.

**Users:** 15–50 members across 5–15 working groups, plus multiple accountants.
**Language:** Japanese UI.
**Currency:** JPY (Japanese Yen — no decimal places).
**Platform:** Mobile browser (PWA), also usable on desktop.
**Connectivity:** Online only (no offline mode).

---

## 2. ユーザーの役割 / User Roles

| Role | Who | Capabilities |
|---|---|---|
| **メンバー (Member)** | Any working group member (can belong to multiple groups) | Submit receipts (with or without photo), view own groups' balance and history, delete records belonging to their group(s) |
| **経理 (Accountant)** | Multiple accountants possible | View all groups, set budgets, manage expense categories, edit/delete any record, record cash-in and cash transfers, configure app settings (incl. fiscal year), create new fiscal years, receive notifications on new submissions, run initial setup |

Role assignment is managed in the Users sheet within the master data file (マスターデータ.gsheet — see §6.1).

---

## 3. 認証 / Authentication

**Method:** Magic link (passwordless email login).

**Flow:**
1. User enters their email address on the login screen.
2. App sends a one-time login link to that email.
3. User taps the link → logged in with a session token (valid for 30 days).
4. If the email is not in the authorized user list (Users sheet in マスターデータ.gsheet), access is denied with a message: 「このメールアドレスは登録されていません。経理担当者にお問い合わせください。」

**Why this works for low IT literacy:** No password to remember, no account to create — just tap the link in their email.

**Technical note:** Magic link requires a lightweight backend service (e.g., a Google Cloud Function or similar) to send emails and issue session tokens.

---

## 4. 主要機能 / Core Features

### 4.1 支出の記録方法 / Expense Entry Methods

The app supports two entry modes:

**Mode A: レシート撮影 (Receipt Photo)**
1. User opens the app and taps 「レシートを撮影」.
2. Camera opens (using the device's native camera via `<input type="file" capture="environment">`).
3. Photo is taken and displayed as a preview.
4. OCR (Tesseract.js) extracts text from the image.
5. App parses the extracted text to identify:
   - **購入日 (Date of purchase)** — parsed from receipt text
   - **店舗名 (Seller/store name)** — top lines of receipt
   - **合計金額 (Total amount)** — looks for 合計, 計, total patterns
6. A confirmation form is shown, pre-filled with OCR results.

**Mode B: 手入力 (Manual Entry)**
1. User taps 「手入力で記録」.
2. A blank form is shown with the same fields as Mode A (no OCR step).
3. User fills in all fields manually.
4. Receipt photo is optional — user can still attach one if available, but it is not required.

Use cases for manual entry: parking meters, vending machines, verbal transactions, faded/unreadable receipts, or any expense without a paper receipt.

### 4.2 記録確認・編集 / Record Confirmation & Editing

After OCR, the user sees a form with the following fields:

| Field | Source | Editable? |
|---|---|---|
| 購入日 (Purchase date) | OCR → user confirms | Yes |
| 店舗名 (Seller name) | OCR → user confirms | Yes |
| 合計金額 (Total amount) | OCR → user confirms | Yes |
| 勘定科目 (Expense category) | User selects from dropdown | Yes |
| 活動グループ (Working group) | Dropdown of groups the user belongs to (if multiple) | Yes |
| 報告者 (Reporting user) | Auto-filled from login | Display only |
| メモ (Notes) | Optional free text | Yes |

The user reviews and corrects any OCR errors, selects the expense category, and taps 「登録」 to save.

### 4.3 スプレッドシート連携 / Spreadsheet Integration

On submission, the app writes a new row to the "Transactions" sheet in the current fiscal year's spreadsheet file (see §6 for the file-per-year structure):

| Column | Content |
|---|---|
| A: 記録ID | Auto-generated unique ID (e.g., `TXN-20260320-001`) |
| B: 登録日時 | Timestamp of submission |
| C: 購入日 | Date of purchase |
| D: 店舗名 | Seller name |
| E: 合計金額 | Total amount (JPY) |
| F: 勘定科目 | Expense category |
| G: 勘定科目グループ | Category group (auto-filled based on category) |
| H: 活動グループ | Working group name |
| I: 報告者 | User's display name |
| J: 報告者メール | User's email |
| K: メモ | Notes |
| L: レシート画像URL | Google Drive link to the uploaded receipt photo (blank if manual entry without photo) |
| M: 入力方法 | Entry method: レシート撮影 / 手入力 |
| N: ステータス | Status: 有効 / 削除済 (soft-delete flag, see §4.9) |

### 4.4 レシート画像の保存 / Receipt Photo Storage

Photos are uploaded to a designated Google Drive folder. All spreadsheet files live in the same root folder for easy access, with receipt photos organized in year/group subfolders:

```
📁 経費管理/                                  ← app home directory (accountant chooses during initial setup)
  📄 マスターデータ.gsheet                      ← shared across years (Users, Groups, Categories, Settings)
  📄 経費管理_2026.gsheet                      ← fiscal year 2026 data (Transactions, CashIn, CashTransfers, Budgets)
  📄 経費管理_2027.gsheet                      ← fiscal year 2027 data
  📁 レシート画像/
    📁 2026/
      📁 企画グループ/
        📷 TXN-20260320-001.jpg
        📷 TXN-20260415-002.jpg
      📁 広報グループ/
        ...
    📁 2027/
      ...
```

File name matches the record ID in the spreadsheet for easy cross-reference.

The app discovers available fiscal years by listing spreadsheet files matching the `経費管理_YYYY.gsheet` naming pattern in the home directory.

### 4.5 入金記録 / Cash-In Tracking (Association Level)

The app tracks cash received by the association as a whole. This is money flowing into the association (e.g., membership fees, grants, subsidies, event revenue).

**Accountant-only feature.** Members can view but not edit.

**Fields per cash-in record:**

| Field | Content |
|---|---|
| 記録ID | Auto-generated (e.g., `IN-20260401-001`) |
| 入金日 | Date cash was received |
| 金額 | Amount (JPY) |
| 入金元 | Source description (e.g., "会費徴収", "助成金") |
| メモ | Optional notes |
| 登録者 | Accountant who recorded it |
| ステータス | 有効 / 削除済 |

Data is stored in the CashIn sheet of the fiscal year's spreadsheet (see §6.2).

### 4.6 現金移動記録 / Cash Transfer Tracking (Association ↔ Groups)

The app tracks cash distributed to and returned from working groups. This represents the physical movement of cash between the association's central fund and each group.

**Accountant-only feature.** Members can view transfers for their own group(s) but cannot edit.

**Transfer types:**

| Type | Direction | When |
|---|---|---|
| 配布 (Distribution) | Association → Group | Typically at the start of the fiscal year |
| 返金 (Return) | Group → Association | Typically at the end of the fiscal year, or when a group returns unused cash |

**Fields per transfer record:**

| Field | Content |
|---|---|
| 記録ID | Auto-generated (e.g., `TRF-20260401-001`) |
| 日付 | Date of transfer |
| 種別 | Transfer type: 配布 or 返金 |
| 活動グループ | Which working group |
| 金額 | Amount (JPY) |
| メモ | Optional notes |
| 登録者 | Accountant who recorded it |
| ステータス | 有効 / 削除済 |

Data is stored in the CashTransfers sheet of the fiscal year's spreadsheet (see §6.2).

### 4.7 残高表示 / Balance Tracking

The app displays remaining cash at three levels:

**団体全体の手元現金 (Association cash at hand):**
```
団体手元現金 = 入金合計 − グループへの配布合計 + グループからの返金合計
```

**グループ別手元現金 (Per-group cash at hand):**
```
グループ手元現金 = 配布で受け取った合計 − 支出合計（有効レコードのみ）− 返金合計
```

**Validation check (for accountant):**
```
全体の現金 = 団体手元現金 + 全グループの手元現金合計
（This should equal 入金合計 − 全支出合計 at all times）
```

- Cash-in totals come from the CashIn sheet.
- Transfer totals come from the CashTransfers sheet.
- Spending totals come from active (non-deleted) records in the Transactions sheet.
- The balance view shows: association cash at hand at the top, then each group's cash at hand with received, spent, and returned breakdowns.
- Budget allocations (Budgets sheet) are shown alongside as a reference for planned vs. actual, but the cash balance is calculated from actual cash flows, not budgets.
- Accessible to members (own group(s) only) and accountants (all levels).

### 4.8 履歴・一覧 / Transaction History

- Members can view the transaction list for any group they belong to.
- Accountants can view and filter all transactions by group, date range, or category.
- Tapping a record shows its details and receipt photo (if available).
- Deleted records (ステータス = 削除済) are hidden by default but can be shown via a toggle for accountants.

### 4.9 記録の削除 / Record Deletion

Deletion is implemented as a **soft-delete** (the row remains in the spreadsheet with ステータス changed to 削除済).

**Permissions:**
- Members can delete expense records (Transactions) that belong to any group they are a member of.
- Accountants can delete any record across all sheets (Transactions, CashIn, CashTransfers).

**Flow:**
1. User taps a record and selects 「削除」.
2. Confirmation dialog: 「この記録を削除しますか？」
3. On confirm, ステータス is changed to 削除済, and the record no longer counts toward balance calculations.
4. Accountants can view deleted records and restore them (change ステータス back to 有効) if needed.

### 4.10 通知機能 / Notifications

When a new expense record is submitted, all users with the 経理 role receive an email notification.

**Notification content:**
- 報告者 (who submitted)
- 活動グループ (which group)
- 合計金額 (amount)
- 勘定科目 (category)
- Link to the record in the spreadsheet

**Delivery:** Email via the same backend service used for magic link auth. Sent immediately on submission. No digest/batching for v1.

### 4.11 勘定科目の管理 / Expense Category Management

Categories are stored in a "Categories" sheet:

| Column | Content |
|---|---|
| A: 科目名 | Category name (e.g., 交通費, 消耗品費) |
| B: グループ | Category group (e.g., 活動費, 事務費) |
| C: 有効 | Active flag (TRUE/FALSE) |

- The accountant can add, edit, or deactivate categories through the app or the spreadsheet directly.
- Deactivated categories still appear on historical records but are hidden from the dropdown for new submissions.

---

## 5. 双方向同期とデータ構造 / Two-Way Sync & Data Architecture

### 5.1 Google Driveフォルダが唯一の情報源 / Drive Folder as Single Source of Truth

The Google Drive folder structure is the authoritative source. The app discovers fiscal years, spreadsheets, and receipt photos by reading the Drive folder — it does not maintain its own database.

- **App → Drive:** The app writes records to spreadsheets and uploads photos to Drive.
- **Drive → App:** The app reads from Drive/Sheets every time it loads data. Edits made directly in the spreadsheet or Drive are reflected in the app.
- **Conflict handling:** "Last write wins" — acceptable given the user base size and usage patterns.

### 5.2 ファイル構成 / File Architecture

All spreadsheet files live in the same root folder for easy access. There are **two types**:

1. **マスターデータ.gsheet** (Master Data) — one file, shared across all fiscal years. Contains Users, Groups, Categories, and Settings sheets.
2. **経費管理_YYYY.gsheet** (Fiscal Year Data) — one file per fiscal year. Contains Transactions, CashIn, CashTransfers, and Budgets sheets for that year.

This separation means user/group/category/settings management is done in one place, while each year's financial data is cleanly isolated. All files are in the same folder, making them easy to find and open directly from Google Drive.

---

## 6. スプレッドシート構成 / Spreadsheet Structure

### 6.1 マスターデータ.gsheet（共通マスター / Shared Master File）

This file lives at the root of the `経費管理/` folder and contains data shared across all fiscal years.

**Sheet: Users（ユーザー）**
| Column | Content |
|---|---|
| A: 名前 | Display name |
| B: メールアドレス | Email (used for login) |
| C: 活動グループ | Comma-separated list of group names the user belongs to (e.g., "企画グループ,広報グループ") |
| D: 役割 | Role: メンバー or 経理 |
| E: 有効 | Active flag (TRUE/FALSE) |

Note: A user can belong to multiple working groups. When submitting an expense, they select which group the expense belongs to from a dropdown of their assigned groups.

**Sheet: Groups（活動グループ）**
| Column | Content |
|---|---|
| A: グループ名 | Group name |
| B: 有効 | Active flag (TRUE/FALSE) |

**Sheet: Categories（勘定科目）**
Expense categories and their groupings. Schema described in §4.11. This sheet persists across fiscal years — when a new year starts, the same categories are available for new records. Categories can be added/deactivated at any time.

**Sheet: Settings（設定）**
App-wide configuration stored as key-value pairs.

| Column | Content |
|---|---|
| A: 設定キー | Setting key |
| B: 設定値 | Setting value |

Initial settings:

| Key | Default | Description |
|---|---|---|
| 年度開始月 | 4 | Fiscal year start month (1–12). Default is April (typical Japanese fiscal year). A fiscal year labeled "2026" with start month 4 means April 2026 – March 2027. |
| 現在の年度 | 2026 | The currently active fiscal year. The app uses this to determine which spreadsheet file to write new records to. |

The fiscal year start month can be changed by the accountant through the app's settings screen or by editing this sheet directly. Changing it affects how dates are mapped to fiscal years for new submissions.

### 6.2 経費管理_YYYY.gsheet（年度別ファイル / Per-Year File）

Each fiscal year has its own spreadsheet file in the root `経費管理/` folder. Contains 4 sheets:

**Sheet: Transactions（支出記録）**
All expense records for this fiscal year. Schema described in §4.3.

**Sheet: CashIn（入金記録）**
Cash received by the association during this fiscal year. Schema described in §4.5.

| Column | Content |
|---|---|
| A: 記録ID | Auto-generated (e.g., `IN-20260401-001`) |
| B: 入金日 | Date cash was received |
| C: 金額 | Amount (JPY) |
| D: 入金元 | Source description |
| E: メモ | Notes |
| F: 登録者 | Accountant's display name |
| G: 登録者メール | Accountant's email |
| H: ステータス | 有効 / 削除済 |

**Sheet: CashTransfers（現金移動記録）**
Cash distributed to and returned from working groups. Schema described in §4.6.

| Column | Content |
|---|---|
| A: 記録ID | Auto-generated (e.g., `TRF-20260401-001`) |
| B: 日付 | Date of transfer |
| C: 種別 | Transfer type: 配布 or 返金 |
| D: 活動グループ | Working group name |
| E: 金額 | Amount (JPY) |
| F: メモ | Notes |
| G: 登録者 | Accountant's display name |
| H: 登録者メール | Accountant's email |
| I: ステータス | 有効 / 削除済 |

**Sheet: Budgets（予算配分）**
| Column | Content |
|---|---|
| A: 活動グループ | Working group name (use "全体" for the association-wide total budget) |
| B: 予算額 | Allocated budget (JPY) |

Example rows:
- `企画グループ | 500000`
- `広報グループ | 300000`
- `全体 | 2000000` (association-wide total)

Note: The fiscal year is implicit from the file name — no year column needed. Budgets serve as planned allocations for reference; actual cash tracking is based on CashIn and CashTransfers records.

### 6.3 初期設定 / Initial Setup

When the app is first used, the accountant goes through an initial setup wizard:

1. **フォルダ選択:** The accountant specifies (or creates) a Google Drive folder to serve as the app's home directory (e.g., `経費管理/`). This folder ID is stored in the backend configuration.
2. **マスターデータ作成:** The app creates the `マスターデータ.gsheet` file in the home directory with empty Users, Groups, Categories, and Settings sheets. The Settings sheet is pre-populated with default values (fiscal year start month = 4).
3. **初期データ入力:** The accountant adds working groups, expense categories, and users through the app or directly in the spreadsheet.
4. **最初の年度作成:** The wizard prompts the accountant to create the first fiscal year (see §6.4).

### 6.4 新年度の作成 / Creating a New Fiscal Year

The app provides a 「新年度を開始」 button (accountant-only) that performs the following:

1. Creates a new spreadsheet file `経費管理_YYYY.gsheet` in the home directory with empty Transactions, CashIn, CashTransfers, and Budgets sheets. The Budgets sheet is pre-populated with active group names and "全体", with blank amounts for the accountant to fill in.
2. Creates a subfolder `レシート画像/YYYY/` (with subfolders for each active group) for receipt photo storage.
3. Updates the `現在の年度` setting in the master data Settings sheet.
4. The Categories sheet in the master file is unchanged — new records automatically use the current categories.

The accountant then fills in budget amounts and records the initial cash-in and cash distributions for the new fiscal year.

---

## 7. 技術構成 / Technical Architecture

```
┌──────────────────────────────────────────────────┐
│                 PWA (ブラウザ)                      │
│  ┌─────────┐  ┌──────────┐  ┌────────────────┐   │
│  │ Camera  │  │Tesseract │  │ Google APIs     │   │
│  │ Capture │→ │  .js OCR │→ │ (Sheets+Drive)  │   │
│  │         │  │ (日本語)  │  │                 │   │
│  └─────────┘  └──────────┘  └────────┬───────┘   │
└──────────────────────┬───────────────┘            │
                       │                             │
          ┌────────────┴────────────┐                │
          │  Backend (Cloud Function) │               │
          │  - Magic link auth        │               │
          │  - Email sending          │               │
          │  - Session management     │               │
          │  - Notification emails    │               │
          └───────────────────────────┘               │
                                                      │
┌─────────────────────────────────────────────────────┘
│  Google Drive (経費管理/ フォルダ)
│  ├── マスターデータ.gsheet  (Users, Groups, Categories, Settings)
│  ├── 経費管理_2026.gsheet  (Transactions, CashIn, CashTransfers, Budgets)
│  ├── 経費管理_2027.gsheet
│  └── レシート画像/
│      ├── 2026/ (receipt photos by group)
│      └── 2027/
└──────────────────────────────────────────────────────
```

**Frontend:** Single-page HTML/JS PWA with Japanese UI
**OCR:** Tesseract.js with Japanese language pack (`jpn`)
**Backend:** Google Cloud Function (for auth, notifications, API proxy)
**Master data:** マスターデータ.gsheet (Users, Groups, Categories, Settings — via Sheets API v4)
**Fiscal year data:** 経費管理_YYYY.gsheet per year (Transactions, CashIn, CashTransfers, Budgets — via Sheets API v4)
**File store:** Google Drive `レシート画像/` folder (via Drive API v3)
**Auth:** Magic link email → JWT session tokens

---

## 8. 決定済み事項 / Resolved Decisions

| # | Question | Decision |
|---|---|---|
| Q1 | 年度切り替え | Separate spreadsheet file per fiscal year (e.g., `経費管理_2026.gsheet`), all in the same root folder. App has a 「新年度を開始」 button for accountants (§6.4) |
| Q2 | 領収書なしの支出 | Manual entry without photo is allowed (Mode B in §4.1) |
| Q3 | 削除権限 | Members can soft-delete expense records belonging to their group(s). Accountants can delete/restore any record including cash-in and transfers (§4.9) |
| Q4 | 通知機能 | Yes — accountants receive email notification on each new expense submission (§4.10) |
| Q5 | 予算超過アラート | Not included in v1 |
| Q6 | 複数グループ所属 | Yes — users can belong to multiple groups and select which group at submission time |
| Q7 | レシートの複数品目 | Not included — one receipt = one record. User can submit separately if needed |
| Q8 | ホスティング | Google Cloud Storage (preferred). Fallback: GitHub Pages. See §8.1 |
| Q9 | 年度開始月 | Configurable via Settings sheet or app settings screen. Default: April (§6.1) |
| Q10 | 初期設定 | App provides a setup wizard where the accountant specifies the Drive home folder (§6.3) |
| Q11 | 現金管理 | App tracks cash-in for the association (§4.5) and cash transfers to/from groups (§4.6) |

### 8.1 ホスティングについて / Hosting Details

**Google Cloud Storage** can host a static PWA with a personal Google account (no Google Workspace required). What you need:

1. A Google Cloud project (free to create at console.cloud.google.com)
2. A Cloud Storage bucket configured for static website hosting
3. Billing enabled (the free tier includes 5 GB storage and 1 GB/day egress — more than sufficient for a PWA)
4. Optionally, a custom domain via Cloud Load Balancing (adds cost) or use the default `storage.googleapis.com` URL

The Cloud Functions backend (for magic link auth and notifications) also works with a personal Google Cloud account under the free tier (2 million invocations/month free).

**If you prefer to start simpler:** GitHub Pages for the PWA frontend (completely free, easy deployment) + Google Cloud Functions for the backend. This is a good starting point and you can migrate the frontend to GCS later if desired.

### 8.2 残りの未決定事項 / Remaining Open Questions

All major questions have been resolved. No blocking open questions remain.

---

## 9. 対象外 / Out of Scope (for initial version)

- Offline mode / background sync
- Year-end report generation (handled via spreadsheet)
- Multi-language support (Japanese only for v1)
- Native app store distribution (PWA only)
- Receipt photo editing (cropping, rotation) within the app
- Approval workflow (accountant approval before recording)
- Budget overrun alerts
- Splitting a single receipt into multiple expense categories
- Notification batching/digest (immediate email only for v1)
