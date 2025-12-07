---
id: sendgrid
title: SendGrid メール送信ハンズオン
sidebar_label: SendGrid
---

# SendGrid メール送信ハンズオン

Twilio SendGrid を使って、Node.js から API でメールを送信する方法を学びます。

## ワークショップのゴール

- SendGrid の仕組みを理解する
- 技術者として「すぐ使える」API 送信を体験
- トラブルシュートのポイントを理解

---

## 1. SendGrid の概要とメール配信の基本

### なぜメール配信は難しいのか？

メールを「送る」のは簡単ですが、「届ける」のは難しい。

```
送信サーバー → インターネット → 受信サーバー → 受信箱
                    ↓
              スパムフィルター
              レピュテーション
              認証チェック
```

### 到達性を決める要素

| 要素 | 説明 |
|------|------|
| **SPF** | 送信元 IP が正規のものか確認 |
| **DKIM** | メールが改ざんされていないか確認 |
| **DMARC** | SPF/DKIM の結果に基づくポリシー |
| **レピュテーション** | 送信ドメイン・IP の評判 |

### SendGrid の価値

- ✅ 高い到達率（配送インフラの最適化）
- ✅ 認証設定の簡素化（Domain Authentication）
- ✅ リアルタイムのイベント追跡
- ✅ スケーラブルな API

### 日本向け特有の注意点

- キャリアメール（docomo, au, SoftBank）は独自フィルタがある
- 携帯キャリアは RFC 違反のアドレスが存在する場合がある
- 絵文字対応に注意

---

## 2. ハンズオン①：API でメール送信

### Step 1: API Key の作成

1. [SendGrid コンソール](https://app.sendgrid.com/) にログイン
2. **Settings** → **API Keys** → **Create API Key**
3. 権限を選択:
   - **Full Access**: 開発・テスト用
   - **Restricted Access**: 本番用（Mail Send のみ等）
4. API Key をコピー（⚠️ 一度しか表示されません！）

### Step 2: プロジェクトのセットアップ

```bash
cd hello-sendgrid
npm install
```

### Step 3: 環境変数の設定

`.env` ファイルに追加:

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=verified@yourdomain.com
TO_EMAIL=recipient@example.com
```

:::caution 送信元アドレスの認証
`FROM_EMAIL` には、SendGrid で認証済みのアドレスを使用してください。
- **Domain Authentication**: ドメイン全体を認証（推奨）
- **Single Sender Verification**: 個別のアドレスを認証（開発用）
:::

### Step 4: メール送信コード

```javascript
// hello-sendgrid/index.js
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail() {
  const msg = {
    to: process.env.TO_EMAIL,
    from: process.env.FROM_EMAIL,
    subject: 'SendGrid ワークショップ - テストメール',
    text: 'こんにちは！SendGrid API からのメール送信テストです。',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1A82E2;">SendGrid ワークショップ</h1>
        <p>こんにちは！</p>
        <p>SendGrid API からのメール送信テストです。</p>
      </div>
    `
  };

  try {
    const response = await sgMail.send(msg);
    console.log('✅ メール送信成功！');
    console.log(`ステータスコード: ${response[0].statusCode}`);
    console.log(`Message ID: ${response[0].headers['x-message-id']}`);
  } catch (error) {
    console.error('❌ メール送信失敗:', error.response?.body);
  }
}

sendEmail();
```

### Step 5: 実行

```bash
node index.js
```

成功すると:
```
✅ メール送信成功！
ステータスコード: 202
Message ID: abc123...
```

### よくあるエラーと解決方法

| エラーコード | 原因 | 解決方法 |
|------------|------|---------|
| **401** | API Key が無効 | API Key を再確認、正しくコピーされているか確認 |
| **403** | 送信元が未認証 | Domain Authentication または Single Sender Verification を設定 |
| **429** | レート制限超過 | 送信間隔を空ける、またはプランをアップグレード |

---

## 3. ハンズオン②：Dynamic Template を触ってみる

本番環境では、メール本文をコードに埋め込まず **Dynamic Template** を使います。

### テンプレート作成方法

1. SendGrid コンソール → **Email API** → **Dynamic Templates**
2. **Create a Dynamic Template** をクリック
3. テンプレート名を入力（例: "Welcome Email"）
4. **Add Version** でバージョンを追加
5. **Design Editor** または **Code Editor** で編集

### パーソナライズ変数の挿入

テンプレート内で `{{変数名}}` を使用:

```html
<h1>こんにちは、{{first_name}} さん！</h1>
<p>{{company_name}} へようこそ。</p>
<p>ご注文番号: {{order_id}}</p>

{{#each items}}
  <p>{{this.name}}: ¥{{this.price}}</p>
{{/each}}
```

### API からテンプレートを呼び出し

```javascript
// template-send.js
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: process.env.TO_EMAIL,
  from: process.env.FROM_EMAIL,
  templateId: 'd-xxxxxxxxxxxxxxxxxxxx', // テンプレート ID

  // パーソナライズデータ
  dynamicTemplateData: {
    first_name: '太郎',
    company_name: 'Twilio Workshop',
    order_id: 'ORD-12345',
    items: [
      { name: '商品A', price: 1000 },
      { name: '商品B', price: 2500 }
    ]
  }
};

sgMail.send(msg)
  .then(() => console.log('✅ テンプレートメール送信成功'))
  .catch(error => console.error('❌ 失敗:', error.response?.body));
```

実行:
```bash
node template-send.js
```

---

## 4. 運用に使える Tips

### 認証設定（SPF / DKIM）チェック方法

1. SendGrid コンソール → **Settings** → **Sender Authentication**
2. **Domain Authentication** で認証状態を確認
3. DNS レコードが正しく設定されているか確認

```bash
# DKIM レコード確認
dig TXT s1._domainkey.yourdomain.com

# SPF レコード確認
dig TXT yourdomain.com
```

### Event Webhook で配信結果を受け取る

リアルタイムでメールのステータスを追跡:

```javascript
// webhook-server.js
import express from 'express';

const app = express();
app.use(express.json());

app.post('/webhook/sendgrid', (req, res) => {
  const events = req.body;

  events.forEach(event => {
    console.log(`${event.event}: ${event.email}`);

    switch (event.event) {
      case 'delivered':
        console.log('✅ 配信成功');
        break;
      case 'bounce':
        console.log('❌ バウンス - このアドレスへの送信を停止');
        break;
      case 'spamreport':
        console.log('⚠️ スパム報告 - 即座に配信停止');
        break;
    }
  });

  res.status(200).send('OK');
});

app.listen(3004, () => console.log('Webhook server running'));
```

Webhook サーバーを起動:
```bash
node webhook-server.js

# 別ターミナルで ngrok を起動
npx ngrok http 3004
```

### 主要なイベントタイプ

| イベント | 説明 | 対応 |
|---------|------|------|
| `processed` | SendGrid が受信 | - |
| `delivered` | 配信成功 | 成功カウント |
| `bounce` | ハードバウンス | **送信停止** |
| `blocked` | ブロック | 原因調査 |
| `spamreport` | スパム報告 | **即座に停止** |
| `open` | 開封 | エンゲージメント計測 |
| `click` | クリック | CTR 計測 |

### 大量送信時のベストプラクティス

#### IP Warm-up（ウォームアップ）

新しい IP アドレスでいきなり大量送信すると、スパム扱いされます。

```
Week 1: 50通/日
Week 2: 100通/日
Week 3: 500通/日
Week 4: 2,000通/日
...徐々に増加
```

#### レート制御

```javascript
// 送信間隔を空ける
async function sendBulkEmails(recipients) {
  for (const recipient of recipients) {
    await sendEmail(recipient);
    await sleep(100); // 100ms 間隔
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

#### バウンス管理

```javascript
// バウンスしたアドレスは送信リストから除外
const suppressionList = new Set();

async function safeSend(to, msg) {
  if (suppressionList.has(to)) {
    console.log(`Skipped (suppressed): ${to}`);
    return;
  }

  try {
    await sgMail.send({ ...msg, to });
  } catch (error) {
    if (error.code === 550) { // バウンス
      suppressionList.add(to);
    }
  }
}
```

---

## クイックリファレンス

### 必要な環境変数

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=verified@yourdomain.com
TO_EMAIL=recipient@example.com
SENDGRID_TEMPLATE_ID=d-xxxxxxxxxxxxxxxxxxxx
```

### コマンド一覧

```bash
# 基本送信
cd hello-sendgrid && node index.js

# テンプレート送信
node template-send.js

# Webhook サーバー起動
node webhook-server.js
```

### 参考リンク

- [SendGrid API ドキュメント](https://docs.sendgrid.com/api-reference/mail-send/mail-send)
- [Node.js SDK](https://github.com/sendgrid/sendgrid-nodejs)
- [Dynamic Templates ガイド](https://docs.sendgrid.com/ui/sending-email/how-to-send-an-email-with-dynamic-templates)
- [Event Webhook リファレンス](https://docs.sendgrid.com/for-developers/tracking-events/event)

---

**次のステップ**: [SMS送信の実装](./sms) →
