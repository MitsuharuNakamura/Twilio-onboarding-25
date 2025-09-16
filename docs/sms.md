---
id: sms
title: SMS送信ハンズオン
sidebar_label: SMS
---

# SMS送信ハンズオン

TwilioのProgrammable SMSを使って、Node.jsからSMSを送信する方法を学びます。

## このセクションのゴール

- Twilio SDKのセットアップ
- SMS送信プログラムの実装
- エラーハンドリングの実装
- 送信ステータスの確認

## クイックスタート

### Step 1: プロジェクトのセットアップ

```bash
cd hello-sms
npm install
```

### Step 2: 環境変数の設定

`.env`ファイルを作成:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
TO_PHONE_NUMBER=+81901234567
```

### Step 3: SMS送信コード

```javascript
// hello-sms/index.js
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function sendSMS() {
  try {
    const message = await client.messages.create({
      body: 'Hello from Twilio Workshop 2025!',
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.TO_PHONE_NUMBER
    });

    console.log(`SMS送信成功！`);
    console.log(`メッセージSID: ${message.sid}`);
    console.log(`ステータス: ${message.status}`);
  } catch (error) {
    console.error('SMS送信失敗:', error.message);
  }
}

sendSMS();
```

### Step 4: 実行

```bash
node index.js
```

## 送信ステータスの確認

SMSの送信状態を確認する完全なコード:

```javascript
// check-status.js
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function checkStatus(messageSid) {
  try {
    const message = await client.messages(messageSid).fetch();
    
    console.log('=== SMS送信ステータス詳細 ===');
    console.log(`SID: ${message.sid}`);
    console.log(`送信先: ${message.to}`);
    console.log(`送信元: ${message.from}`);
    console.log(`ステータス: ${message.status}`);
    console.log(`メッセージ: ${message.body}`);
    console.log(`送信日時: ${message.dateCreated}`);
    console.log(`更新日時: ${message.dateUpdated}`);
    console.log(`送信完了日時: ${message.dateSent || '未送信'}`);
    console.log(`料金: ${message.price || '未確定'} ${message.priceUnit || ''}`);
    console.log(`メディア数: ${message.numMedia}`);
    
    if (message.errorCode) {
      console.log(`エラーコード: ${message.errorCode}`);
      console.log(`エラーメッセージ: ${message.errorMessage}`);
    }
    
    return message;
  } catch (error) {
    console.error('ステータス確認エラー:', error.message);
    throw error;
  }
}

// 最近のメッセージ一覧を取得して確認
async function checkRecentMessages(limit = 5) {
  try {
    console.log(`最近の${limit}件のメッセージステータスを確認中...`);
    
    const messages = await client.messages.list({ limit: limit });
    
    for (const message of messages) {
      console.log('\n' + '='.repeat(50));
      await checkStatus(message.sid);
    }
  } catch (error) {
    console.error('メッセージ一覧取得エラー:', error.message);
  }
}

// メイン実行部分
async function main() {
  // 環境変数チェック
  if (!accountSid || !authToken) {
    console.error('Twilio認証情報が設定されていません');
    process.exit(1);
  }
  
  // コマンドライン引数チェック
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // 特定のメッセージSIDを確認
    const messageSid = args[0];
    console.log(`メッセージSID ${messageSid} のステータスを確認中...`);
    await checkStatus(messageSid);
  } else {
    // 最近のメッセージを確認
    await checkRecentMessages();
  }
}

main().catch(console.error);
```

実行方法:
```bash
# 最近のメッセージ5件を確認
node check-status.js

# 特定のメッセージSIDを確認
node check-status.js SM1234567890abcdef1234567890abcdef
```

### ステータスの種類

| ステータス | 説明 |
|----------|------|
| `queued` | 送信待機中 |
| `sending` | 送信中 |
| `sent` | 送信完了 |
| `delivered` | 配信完了 |
| `failed` | 送信失敗 |
| `undelivered` | 配信失敗 |

## ハンズオン課題

### 課題1: 複数宛先への一斉送信

複数の電話番号に同じメッセージを一斉送信する機能を実装してください。

<details>
<summary>解答を見る</summary>

```javascript
// bulk-sms.js - シンプルな一斉送信
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// 送信先リスト
const recipients = [
  process.env.TO_PHONE_NUMBER,
  // '+81901234568' // 追加の番号
];

const message = 'Twilioワークショップの一斉送信テストです';

// 一斉送信実行
async function sendBulkSMS() {
  console.log(`${recipients.length}件に送信開始...`);
  
  try {
    const results = await Promise.all(
      recipients.map(number => 
        client.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: number
        })
      )
    );
    
    console.log('送信完了:');
    results.forEach((result, i) => {
      console.log(`${i+1}. ${recipients[i]} -> ${result.sid}`);
    });
    
  } catch (error) {
    console.error('送信エラー:', error.message);
  }
}

sendBulkSMS();
```

実行方法:
```bash
node bulk-sms.js
```

</details>

### 課題2: SMS送信履歴の管理

送信したSMSの履歴を保存し、一覧表示する機能を実装してください。
- 送信日時、宛先、メッセージ内容、送信ステータスを記録
- 送信履歴を配列で管理
- 履歴を表示する関数を作成

<details>
<summary>解答を見る</summary>

```javascript
// sms-history.js - シンプルなSMS履歴管理
import twilio from 'twilio';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// 履歴ファイル
const historyFile = 'sms-history.json';

// 履歴読み込み
function loadHistory() {
  try {
    return JSON.parse(fs.readFileSync(historyFile, 'utf8'));
  } catch {
    return [];
  }
}

// 履歴保存
function saveHistory(history) {
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

// SMS送信（履歴記録付き）
async function sendSMS(to, body) {
  const history = loadHistory();
  
  try {
    const message = await client.messages.create({
      body: body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });
    
    // 成功を履歴に記録
    history.push({
      date: new Date().toISOString(),
      to: to,
      message: body,
      status: 'sent',
      sid: message.sid
    });
    
    saveHistory(history);
    console.log(`送信成功: ${to} -> ${message.sid}`);
    
  } catch (error) {
    // 失敗も履歴に記録
    history.push({
      date: new Date().toISOString(),
      to: to,
      message: body,
      status: 'failed',
      error: error.message
    });
    
    saveHistory(history);
    console.log(`送信失敗: ${error.message}`);
  }
}

// 履歴表示
function showHistory() {
  const history = loadHistory();
  
  console.log('\n=== SMS履歴 ===');
  history.slice(-5).forEach((entry, i) => {
    console.log(`${i+1}. ${new Date(entry.date).toLocaleString()}`);
    console.log(`   宛先: ${entry.to}`);
    console.log(`   メッセージ: ${entry.message}`);
    console.log(`   ステータス: ${entry.status}`);
    console.log('');
  });
}

// メイン処理
async function main() {
  // テストメッセージ送信
  await sendSMS(process.env.TO_PHONE_NUMBER, 'Twilioワークショップ - 履歴管理テスト');
  
  // 履歴表示
  showHistory();
}

main();
```

実行方法:
```bash
node sms-history.js
```

</details>

### 課題3: テンプレートメッセージシステム

顧客情報を使って予約確認のSMSを送信するシステムを作成してください。
- 顧客名、予約日時、サービス名を含むテンプレート
- キャンセル用のリンクも含める

<details>
<summary>解答を見る</summary>

```javascript
// template-message.js - シンプルなテンプレートシステム
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// 顧客データ
const customer = {
  name: '田中太郎',
  phone: process.env.TO_PHONE_NUMBER,
  date: '2025年1月20日 14:00',
  service: 'ヘアカット'
};

// テンプレート生成
function createTemplate(type, customer) {
  const templates = {
    confirmation: `${customer.name}様

ご予約確認です。

日時: ${customer.date}
サービス: ${customer.service}

よろしくお願いします。
Beauty Salon`,

    reminder: `${customer.name}様

明日のご予約のご確認です。

日時: ${customer.date}
サービス: ${customer.service}

お待ちしております。
Beauty Salon`
  };

  return templates[type];
}

// SMS送信
async function sendTemplate(type) {
  const message = createTemplate(type, customer);
  
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: customer.phone
    });
    
    console.log(`送信成功: ${type} -> ${result.sid}`);
    console.log('メッセージ内容:');
    console.log(message);
    
  } catch (error) {
    console.log(`送信失敗: ${error.message}`);
  }
}

// メイン処理
async function main() {
  await sendTemplate('confirmation');
  console.log('');
  await sendTemplate('reminder');
}

main();
```

実行方法:
```bash
node template-message.js
```

</details>

## エラーハンドリング

### よくあるエラーと対処法

```javascript
async function safeSendSMS(to, body) {
  try {
    const message = await client.messages.create({
      body: body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });
    return { success: true, data: message };
  } catch (error) {
    // エラーコードに応じた処理
    switch(error.code) {
      case 21211:
        console.error('無効な電話番号です');
        break;
      case 21608:
        console.error('未検証の電話番号への送信はできません（トライアル）');
        break;
      case 21610:
        console.error('送信先の番号がブロックリストに登録されています');
        break;
      default:
        console.error('予期しないエラー:', error.message);
    }
    return { success: false, error: error };
  }
}
```

## 応用例

### 予約リマインダーシステム

```javascript
class ReminderService {
  constructor(client) {
    this.client = client;
  }

  async sendDailyReminders() {
    const appointments = await getAppointmentsForTomorrow();
    
    for (const appointment of appointments) {
      await this.sendReminder(appointment);
      // レート制限対策
      await this.delay(1000);
    }
  }

  async sendReminder(appointment) {
    const message = `
明日 ${appointment.time} に予約があります。
サービス: ${appointment.service}
場所: ${appointment.location}
    `;
    
    return await this.client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: appointment.customerPhone,
      // コールバックURL設定
      statusCallback: 'https://your-app.com/sms-status'
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## 参考リンク

- [Twilio SMS API ドキュメント](https://www.twilio.com/docs/sms)
- [Node.js SDK リファレンス](https://www.twilio.com/docs/libraries/node)
- [SMS料金計算ツール](https://www.twilio.com/sms/pricing/jp)

---

**次のステップ**: [Voice通話の実装](./voice) →