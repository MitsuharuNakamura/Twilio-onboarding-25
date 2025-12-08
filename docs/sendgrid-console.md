---
id: sendgrid-console
title: SendGrid コンソールガイド
sidebar_label: コンソールガイド
---

# SendGrid コンソールガイド

SendGrid 管理コンソール（https://app.sendgrid.com）の各メニューを詳しく解説します。

---

## ダッシュボード（Dashboard）

ログイン後最初に表示される画面。メール配信の全体像を把握できます。

### 表示される情報

| 項目 | 説明 |
|------|------|
| **Requests** | API に送信されたリクエスト数 |
| **Delivered** | 正常に配信されたメール数 |
| **Opens** | 開封されたメール数 |
| **Clicks** | リンクがクリックされた数 |
| **Bounces** | バウンスしたメール数 |
| **Spam Reports** | スパム報告された数 |

### グラフの見方

```
📈 Delivered（青）が多い = 健全な状態
📉 Bounces（赤）が増加 = リストのクリーニングが必要
⚠️ Spam Reports が増加 = 即座に原因調査
```

---

## Email API

### API Keys

API キーの作成・管理を行います。

**作成手順**:
1. **Create API Key** をクリック
2. キーの名前を入力（例: `production-api`, `dev-test`）
3. 権限を選択:
   - **Full Access**: 全機能へのアクセス
   - **Restricted Access**: 特定の機能のみ
   - **Billing Access**: 課金情報のみ

:::caution セキュリティ注意
- API Key は作成時に **一度だけ** 表示されます
- 紛失した場合は再作成が必要
- 本番環境と開発環境で別のキーを使用
- 定期的にキーをローテーション
:::

**推奨する権限設定（本番用）**:

| 機能 | 権限 |
|------|------|
| Mail Send | ✅ Full Access |
| Template Engine | ✅ Read Access |
| Marketing | ❌ No Access |
| Stats | ✅ Read Access |
| Suppressions | ✅ Full Access |

---

### Dynamic Templates

再利用可能なメールテンプレートを管理。

**テンプレート作成手順**:

1. **Create a Dynamic Template** をクリック
2. テンプレート名を入力
3. **Add Version** でバージョンを作成
4. エディタを選択:
   - **Design Editor**: ドラッグ&ドロップで視覚的に作成
   - **Code Editor**: HTML/CSS を直接編集

**Design Editor の主要機能**:

| モジュール | 用途 |
|-----------|------|
| **Text** | テキストブロック |
| **Image** | 画像の挿入 |
| **Button** | CTA ボタン |
| **Columns** | 複数カラムレイアウト |
| **Code** | カスタム HTML |
| **Social** | SNS アイコン |
| **Unsubscribe** | 配信停止リンク |

**変数の使い方**:

```handlebars
{{! 基本的な変数 }}
こんにちは、{{first_name}} さん

{{! デフォルト値付き }}
{{first_name | default: "お客様"}}

{{! 条件分岐 }}
{{#if premium_member}}
  プレミアム会員特典をご利用いただけます
{{else}}
  プレミアム会員になりませんか？
{{/if}}

{{! 繰り返し }}
{{#each items}}
  商品名: {{this.name}} - ¥{{this.price}}
{{/each}}
```

---

### Integration Guide

各プログラミング言語での実装ガイド。

| 言語 | SDK |
|------|-----|
| Node.js | `@sendgrid/mail` |
| Python | `sendgrid` |
| Ruby | `sendgrid-ruby` |
| PHP | `sendgrid/sendgrid` |
| Java | `sendgrid-java` |
| Go | `sendgrid-go` |
| C# | `SendGrid` |

---

## Activity

### Activity Feed

過去7日間のメール送信履歴を確認。

**フィルタリング項目**:

| フィルター | 説明 |
|-----------|------|
| **Date** | 日付範囲 |
| **Status** | Delivered, Bounced, Blocked など |
| **To Email** | 受信者のメールアドレス |
| **From Email** | 送信者のメールアドレス |
| **Subject** | 件名（部分一致） |
| **Message ID** | 特定のメッセージを検索 |

**各ステータスの意味**:

| ステータス | 説明 | アクション |
|-----------|------|-----------|
| ✅ **Delivered** | 受信サーバーに配信成功 | なし |
| 📤 **Processed** | SendGrid で処理完了 | 配信待ち |
| ⏳ **Deferred** | 一時的に配信延期 | 自動リトライ |
| ❌ **Bounced** | 配信失敗（恒久的） | リストから削除 |
| 🚫 **Blocked** | 受信サーバーに拒否 | 原因調査 |
| ⛔ **Dropped** | 送信前に除外 | 抑制リスト確認 |

---

## Suppressions

メール送信を抑制するアドレスの管理。

### Bounces

ハードバウンス（恒久的な配信失敗）したアドレス一覧。

| 原因 | 説明 |
|------|------|
| **550** | メールボックスが存在しない |
| **551** | ユーザーが存在しない |
| **552** | メールボックス容量超過 |
| **553** | メールアドレス形式エラー |

**対応**: 自動的に以降の送信をスキップ。リストをダウンロードして CRM から削除推奨。

---

### Blocks

受信サーバーにブロックされたアドレス。

**よくある原因**:
- IP レピュテーションが低い
- 送信ドメインが未認証
- コンテンツがスパム判定

**対応**: 原因を特定して解消後、手動で削除可能。

---

### Spam Reports

受信者が「スパム」として報告したアドレス。

:::danger 重要
スパム報告されたアドレスへの再送信は **絶対に避けてください**。
レピュテーションに深刻なダメージを与えます。
:::

---

### Unsubscribes

配信停止を希望したアドレス。

**種類**:
- **Global Unsubscribes**: 全てのメールを停止
- **Group Unsubscribes**: 特定のグループのみ停止

---

### Invalid Emails

形式が不正なメールアドレス。

```
例:
- user@.com（ドメイン不正）
- @example.com（ローカルパートなし）
- user@example（TLD なし）
```

---

## Stats

### Overview

全体的な送信統計を確認。

**主要指標**:

| 指標 | 計算式 | 目安 |
|------|--------|------|
| **Delivery Rate** | Delivered / Requests | > 95% |
| **Open Rate** | Opens / Delivered | 15-25% |
| **Click Rate** | Clicks / Delivered | 2-5% |
| **Bounce Rate** | Bounces / Requests | < 2% |
| **Spam Rate** | Spam Reports / Delivered | < 0.1% |

---

### Category Stats

カテゴリ別の統計。API 送信時にカテゴリを指定すると分類されます。

```javascript
const msg = {
  to: 'user@example.com',
  from: 'noreply@yourapp.com',
  subject: 'Order Confirmation',
  text: 'Your order has been confirmed.',
  categories: ['transactional', 'order-confirmation']
};
```

---

### Mailbox Provider Stats

Gmail, Yahoo, Outlook などプロバイダ別の配信状況。

**確認ポイント**:
- 特定のプロバイダでバウンス率が高くないか
- 開封率に大きな差がないか

---

### Browser & Device Stats

開封時のブラウザ・デバイス情報。

---

## Settings

### Sender Authentication

**Domain Authentication（ドメイン認証）**

自社ドメインからメールを送信するための設定。

**設定手順**:

1. **Authenticate Your Domain** をクリック
2. 使用する DNS ホストを選択
3. ドメイン名を入力
4. 表示される DNS レコードを設定:

```
CNAME レコード（3つ）:
1. em1234.yourdomain.com → u1234567.wl123.sendgrid.net
2. s1._domainkey.yourdomain.com → s1.domainkey.u1234567.wl123.sendgrid.net
3. s2._domainkey.yourdomain.com → s2.domainkey.u1234567.wl123.sendgrid.net
```

5. **Verify** をクリックして確認

---

**Link Branding（リンクブランディング）**

メール内のリンクを自社ドメインで表示。

```
Before: https://u1234567.ct.sendgrid.net/ls/click?...
After:  https://link.yourdomain.com/ls/click?...
```

---

### API Keys

前述の API Keys セクション参照。

---

### Mail Settings

#### Event Webhook

メールイベントをリアルタイムで受信。

**設定項目**:

| 項目 | 説明 |
|------|------|
| **HTTP Post URL** | Webhook を受信する URL |
| **Actions to be posted** | 受信するイベントを選択 |

**受信可能なイベント**:

```
✅ Processed - 処理完了
✅ Dropped - 送信前に除外
✅ Delivered - 配信成功
✅ Deferred - 配信延期
✅ Bounce - バウンス
✅ Blocked - ブロック
✅ Open - 開封
✅ Click - クリック
✅ Spam Report - スパム報告
✅ Unsubscribe - 配信停止
✅ Group Unsubscribe - グループ配信停止
✅ Group Resubscribe - グループ再購読
```

---

#### Inbound Parse

受信メールを解析して Webhook で転送する機能。メールをトリガーにしたアプリケーション開発が可能になります。

**設定手順**:

1. **Settings** → **Inbound Parse** → **Add Host & URL**
2. 受信用のサブドメインを設定（例: `parse.yourdomain.com`）
3. DNS に MX レコードを追加:
   ```
   MX parse.yourdomain.com → mx.sendgrid.net (優先度: 10)
   ```
4. Webhook URL を設定（POST リクエストを受け取るエンドポイント）

**受信データの例**:

```json
{
  "from": "sender@example.com",
  "to": "support@parse.yourdomain.com",
  "subject": "お問い合わせ",
  "text": "本文のテキスト",
  "html": "<p>本文のHTML</p>",
  "attachments": 2,
  "attachment1": "(ファイルデータ)",
  "headers": "...",
  "envelope": "{\"to\":[\"support@parse.yourdomain.com\"],\"from\":\"sender@example.com\"}"
}
```

**ユースケース**:

| ユースケース | 説明 |
|-------------|------|
| **サポートチケット自動作成** | 受信メールから自動でチケットを生成 |
| **メール→Slack 連携** | 特定アドレスへのメールを Slack に転送 |
| **データ抽出** | 注文確認メールから情報を抽出して DB に保存 |
| **自動返信** | 問い合わせに対して自動で確認メールを送信 |
| **添付ファイル処理** | 添付ファイルを自動で S3 等に保存 |

**Webhook 受信サーバーの例**:

```javascript
import express from 'express';
import multer from 'multer';

const app = express();
const upload = multer();

app.post('/parse', upload.any(), (req, res) => {
  console.log('From:', req.body.from);
  console.log('To:', req.body.to);
  console.log('Subject:', req.body.subject);
  console.log('Text:', req.body.text);

  // 添付ファイルの処理
  if (req.files) {
    req.files.forEach(file => {
      console.log('Attachment:', file.originalname);
    });
  }

  res.status(200).send('OK');
});
```

:::tip
Inbound Parse は **受信専用のサブドメイン** を使用することを推奨します。メインドメインの MX レコードを変更すると、通常のメール受信に影響が出ます。
:::

---

#### Click Tracking

メール内のリンククリックを追跡。

**設定オプション**:
- **Enable**: 全リンクを追跡
- **Disable**: 追跡しない

---

#### Open Tracking

メールの開封を追跡（透明な 1px 画像で検知）。

---

#### Subscription Tracking

配信停止リンクを自動挿入。

**カスタマイズ可能な項目**:
- 配信停止ページの URL
- 配信停止リンクのテキスト
- HTML / Text 両方に対応

---

### Tracking

メールの開封・クリックを追跡する機能。マーケティング効果の測定に必須です。

#### Click Tracking

メール内のリンクを SendGrid のトラッキング URL に書き換えてクリックを計測。

**仕組み**:
```
元のリンク: https://yoursite.com/campaign
　　↓
追跡リンク: https://u1234.ct.sendgrid.net/ls/click?...
　　↓
クリック時: SendGrid で記録 → 元の URL にリダイレクト
```

**設定オプション**:

| 設定 | 説明 |
|------|------|
| **Enable** | 全リンクを追跡 |
| **Enable (HTML only)** | HTML メールのみ追跡 |
| **Disable** | 追跡しない |

:::caution 注意
セキュリティ上、一部の企業ではトラッキング URL がブロックされることがあります。Link Branding を設定して自社ドメインの URL にすることで回避できます。
:::

#### Open Tracking

透明な 1x1 ピクセル画像をメールに埋め込んで開封を検知。

**仕組み**:
```html
<!-- メール末尾に自動挿入 -->
<img src="https://u1234.sendgrid.net/wf/open?..." width="1" height="1">
```

**制限事項**:
- 画像ブロック環境では検知不可
- テキストメールでは動作しない
- Apple Mail のプライバシー保護機能で不正確になる場合あり

#### Subscription Tracking

配信停止リンクを自動挿入。

**挿入されるリンク例**:
```html
<a href="https://u1234.sendgrid.net/wf/unsubscribe?...">
  配信停止はこちら
</a>
```

**カスタマイズ項目**:
- 配信停止後のランディングページ URL
- リンクのテキスト（HTML / Plain Text）
- 置換タグ（`[unsubscribe]` など）

#### Google Analytics 連携

メール内のリンクに UTM パラメータを自動付与。

**設定項目**:

| パラメータ | 説明 | 例 |
|-----------|------|-----|
| `utm_source` | 流入元 | `sendgrid` |
| `utm_medium` | メディア種別 | `email` |
| `utm_campaign` | キャンペーン名 | `summer_sale_2025` |
| `utm_term` | キーワード | `discount` |
| `utm_content` | コンテンツ識別 | `header_banner` |

**結果**:
```
元: https://yoursite.com/sale
後: https://yoursite.com/sale?utm_source=sendgrid&utm_medium=email&utm_campaign=summer_sale_2025
```

---

### Access Management

#### Teammates

チームメンバーを招待してアカウントへのアクセスを共有する機能。役割に応じた権限設定が可能です。

**招待手順**:

1. **Settings** → **Teammates** → **Add Teammate**
2. メールアドレスを入力
3. 権限（ロール）を選択
4. 招待メールが送信される
5. 招待された人がリンクをクリックしてアカウント作成

**プリセットロール**:

| ロール | 説明 | 主な権限 |
|--------|------|---------|
| **Admin** | 管理者 | 全機能へのフルアクセス、Teammate 管理 |
| **Developer** | 開発者 | API Keys, Templates, Stats, Suppressions |
| **Marketer** | マーケター | Marketing Campaigns, Contacts, Stats |
| **Read-only** | 閲覧者 | 全機能の閲覧のみ（変更不可） |

**カスタム権限**:

プリセットロール以外にも、細かく権限を設定できます。

| カテゴリ | 権限項目 |
|---------|---------|
| **Email Activity** | 閲覧 / ダウンロード |
| **Stats** | 閲覧 |
| **Suppressions** | 閲覧 / 編集 / 削除 |
| **Templates** | 閲覧 / 作成 / 編集 / 削除 |
| **Marketing** | キャンペーン管理 / コンタクト管理 |
| **Settings** | API Keys / Sender Auth / Webhooks |
| **Teammates** | 招待 / 編集 / 削除 |

**ベストプラクティス**:

```
✅ 最小権限の原則 - 必要な権限のみ付与
✅ 役割ごとにロールを分ける
✅ 退職者のアカウントは即座に削除
✅ 定期的に権限を見直し
```

---

#### Subusers

親アカウントの下に独立したサブアカウントを作成する機能。マルチテナント環境や部門別管理に最適です。

:::info Pro プラン以上で利用可能
Subusers 機能は **Pro プラン以上** で利用できます。
:::

**Teammates vs Subusers の違い**:

| 項目 | Teammates | Subusers |
|------|-----------|----------|
| **用途** | チーム内の権限分け | 独立した環境の分離 |
| **ログイン** | 親アカウントに招待 | 専用のログイン情報 |
| **API Key** | 親アカウントと共有 | 独自の API Key |
| **統計** | 親アカウントに統合 | 個別に分離 |
| **IP アドレス** | 共有 | 個別に割り当て可能 |
| **課金** | 親アカウント | 親アカウント |
| **テンプレート** | 共有 | 個別 |

**ユースケース**:

| ユースケース | 説明 |
|-------------|------|
| **SaaS 事業者** | 顧客ごとに Subuser を作成し、メール配信を分離 |
| **代理店** | クライアントごとに独立した環境を提供 |
| **大企業** | 部門・事業部ごとに分離して管理 |
| **開発環境分離** | 本番 / ステージング / 開発を分離 |

**Subuser 作成手順**:

1. **Settings** → **Subuser Management** → **Create New Subuser**
2. ユーザー名、メールアドレス、パスワードを設定
3. IP アドレスを割り当て（共有または専用）
4. 送信制限（オプション）を設定

**API での Subuser 管理**:

```javascript
// Subuser の作成
const response = await client.request({
  method: 'POST',
  url: '/v3/subusers',
  body: {
    username: 'marketing-team',
    email: 'marketing@yourcompany.com',
    password: 'securepassword123',
    ips: ['192.168.1.1']
  }
});

// Subuser の一覧取得
const subusers = await client.request({
  method: 'GET',
  url: '/v3/subusers'
});
```

**Subuser の統計確認**:

親アカウントから各 Subuser の統計を確認できます。

```
Stats → Subuser Comparison
  └─ marketing-team: 10,000 delivered, 25% open rate
  └─ sales-team: 5,000 delivered, 30% open rate
  └─ support: 2,000 delivered, 45% open rate
```

---

#### Two-Factor Authentication

2段階認証の設定。SMS またはアプリ（Google Authenticator 等）で認証。

**設定手順**:

1. **Settings** → **Two-Factor Authentication**
2. 認証方法を選択:
   - **SMS**: 電話番号に認証コードを送信
   - **App**: TOTP アプリでコードを生成
3. バックアップコードを保存（リカバリー用）

:::warning 必須設定
本番環境では **必ず** 2FA を有効にしてください。API Key の漏洩だけでなく、アカウント乗っ取りも防げます。
:::

---

## IP Management

### IP Addresses

専用 IP アドレスの管理。

**表示情報**:
- IP アドレス
- 割り当て状況
- Warmup ステータス
- サブユーザー割り当て

---

### IP Pools

IP アドレスをグループ化して管理。

**ユースケース**:
- トランザクションメール用 IP プール
- マーケティングメール用 IP プール
- テスト用 IP プール

---

### IP Access Management

API アクセスを特定の IP からのみ許可。

**設定例**:
```
許可する IP:
- 203.0.113.0/24（オフィス）
- 198.51.100.50（本番サーバー）
```

---

## よくある操作手順

### 1. 初期設定チェックリスト

```
□ アカウント作成完了
□ ドメイン認証（Domain Authentication）設定
□ リンクブランディング設定
□ API Key 作成
□ 2FA 有効化
□ Teammate 追加（必要に応じて）
□ Event Webhook 設定
□ テストメール送信
```

### 2. トラブルシューティング

**メールが届かない場合**:

1. **Activity Feed** で該当メールを検索
2. ステータスを確認:
   - `Dropped` → **Suppressions** を確認
   - `Bounced` → アドレスが正しいか確認
   - `Blocked` → レピュテーションを確認
3. **Stats** で全体的な配信率を確認
4. **Sender Authentication** で認証状態を確認

---

## まとめ

SendGrid コンソールの主要機能:

| カテゴリ | 機能 | 用途 |
|---------|------|------|
| **認証・セキュリティ** | API Keys, 2FA, Sender Auth | セキュアな環境構築 |
| **テンプレート** | Dynamic Templates | 再利用可能なメール作成 |
| **モニタリング** | Activity Feed, Stats | 配信状況の確認 |
| **配信管理** | Suppressions, Tracking | 到達率の最適化 |
| **チーム管理** | Teammates, Subusers | 権限・環境の分離 |
| **受信処理** | Inbound Parse | メールトリガーのアプリ開発 |
| **インフラ** | IP Management | 専用 IP の管理 |

---

**次のステップ**: [SendGrid ハンズオン](./sendgrid) →
