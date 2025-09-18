---
id: voice
title: Voice通話ハンズオン
sidebar_label: Voice
---

# Voice通話ハンズオン

TwiML (Twilio Markup Language) を使って、音声通話の応答システムを構築します。

## このセクションのゴール

- TwiMLの基本を理解
- 着信時の音声応答を実装
- IVR（自動音声応答）システムの構築
- 通話録音の実装

## クイックスタート

### Step 1: プロジェクトのセットアップ

```bash
cd hello-voice
npm install
```

### Step 2: 基本的なTwiMLレスポンス

<details>
<summary>解答を見る</summary>

```javascript
// hello-voice/index.js - 完全なサーバーファイル
import express from 'express';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const app = express();
const VoiceResponse = twilio.twiml.VoiceResponse;

// URLエンコードされたデータを解析
app.use(express.urlencoded({ extended: false }));

// 基本的な音声応答
app.post('/voice', (req, res) => {
  const twiml = new VoiceResponse();
  
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, 'こんにちは！Twilioワークショップへようこそ。');
  
  twiml.pause({ length: 1 });
  
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, 'このメッセージは自動音声で再生されています。');
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// ヘルスチェック用エンドポイント
app.get('/', (req, res) => {
  res.send('Twilio Voice Server is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Voice server running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/voice`);
});
```

実行方法:
```bash
cd hello-voice
node index.js
```

</details>

### Step 3: ngrokで公開

```bash
# 別のターミナルで実行
npx ngrok http 3000
```

### Step 4: Twilioコンソールで設定

1. [Twilio Console](https://console.twilio.com)にアクセス
2. 電話番号管理画面を開く
3. Voice Webhookに`https://your-ngrok-url.ngrok.io/voice`を設定

## IVR（自動音声応答）システム

### 番号入力を受け付けるIVR

<details>
<summary>解答を見る</summary>

```javascript
// ivr-system.js - 完全なIVRシステム
import express from 'express';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const app = express();
const VoiceResponse = twilio.twiml.VoiceResponse;

// URLエンコードされたデータを解析
app.use(express.urlencoded({ extended: false }));

// メインIVR
app.post('/ivr', (req, res) => {
  const twiml = new VoiceResponse();
  
  const gather = twiml.gather({
    numDigits: 1,
    action: '/ivr/handle',
    method: 'POST',
    language: 'ja-JP',
    timeout: 5
  });
  
  gather.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, 'お電話ありがとうございます。営業部門は1を、サポート部門は2を、その他のお問い合わせは3を押してください。');
  
  // タイムアウト時の処理
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, '入力が確認できませんでした。もう一度お試しください。');
  
  twiml.redirect('/ivr');
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// 入力処理
app.post('/ivr/handle', (req, res) => {
  const twiml = new VoiceResponse();
  const digit = req.body.Digits;
  
  console.log(`IVR selection: ${digit}`);
  
  switch(digit) {
    case '1':
      twiml.say({
        voice: 'Polly.Mizuki',
        language: 'ja-JP'
      }, '営業部門におつなぎします。');
      // デモ用: 実際の転送の代わりに音声メッセージ
      twiml.say({
        voice: 'Polly.Mizuki',
        language: 'ja-JP'
      }, '営業部門は現在対応中です。しばらくお待ちください。');
      twiml.play('https://demo.twilio.com/docs/classic.mp3');
      break;
    
    case '2':
      twiml.say({
        voice: 'Polly.Mizuki',
        language: 'ja-JP'
      }, 'サポート部門におつなぎします。');
      twiml.say({
        voice: 'Polly.Mizuki',
        language: 'ja-JP'
      }, 'サポート部門に接続されました。');
      break;
    
    case '3':
      twiml.say({
        voice: 'Polly.Mizuki',
        language: 'ja-JP'
      }, 'オペレーターにおつなぎします。少々お待ちください。');
      twiml.play('https://demo.twilio.com/docs/classic.mp3');
      break;
    
    default:
      twiml.say({
        voice: 'Polly.Mizuki',
        language: 'ja-JP'
      }, '無効な選択です。');
      twiml.redirect('/ivr');
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// ヘルスチェック
app.get('/', (req, res) => {
  res.send('IVR System is running!');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`IVR server running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/ivr`);
});
```

実行方法:
```bash
node ivr-system.js
```

</details>

## 通話録音

### 録音機能付き応答

<details>
<summary>解答を見る</summary>

```javascript
// recording-system.js - シンプルな録音システム
import express from 'express';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const app = express();
const VoiceResponse = twilio.twiml.VoiceResponse;
app.use(express.urlencoded({ extended: false }));

// 録音開始
app.post('/record', (req, res) => {
  const twiml = new VoiceResponse();
  
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, 'メッセージをどうぞ。録音は最大30秒です。終了したらシャープを押してください。');
  
  twiml.record({
    action: '/record/complete',
    method: 'POST',
    maxLength: 30,
    finishOnKey: '#',
    playBeep: true
  });
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// 録音完了処理
app.post('/record/complete', (req, res) => {
  const twiml = new VoiceResponse();
  const recordingUrl = req.body.RecordingUrl;
  const duration = req.body.RecordingDuration;
  const from = req.body.From;
  
  console.log(`録音完了:`);
  console.log(`  発信者: ${from}`);
  console.log(`  時間: ${duration}秒`);
  console.log(`  Twilio URL: ${recordingUrl}`);
  
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, 'メッセージを録音しました。ありがとうございました。');
  
  twiml.hangup();
  
  res.type('text/xml');
  res.send(twiml.toString());
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Recording server running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/record`);
});
```

実行方法:
```bash
node recording-system.js
```

</details>

## ハンズオン課題

### 課題1: 営業時間チェック

現在の時刻が営業時間内かどうかを判定して、営業時間内であればオペレーターに転送し、営業時間外であれば案内メッセージを再生するシステムを作成してください。

<details>
<summary>解答を見る</summary>

実行方法:
```bash
cd challenges/voice
node challenge1-business-hours.js
```

完全なコード:
```javascript
// challenge1-business-hours.js - シンプルな営業時間チェック
import express from 'express';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const app = express();
const VoiceResponse = twilio.twiml.VoiceResponse;

app.use(express.urlencoded({ extended: false }));

// 営業時間判定（平日9-18時のみ）
function isBusinessHours() {
  const now = new Date();
  const day = now.getDay(); // 0=日曜, 1-5=平日, 6=土曜
  const hour = now.getHours();
  
  return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
}

// メイン音声応答
app.post('/voice', (req, res) => {
  const twiml = new VoiceResponse();
  
  if (isBusinessHours()) {
    twiml.say({
      voice: 'Polly.Mizuki',
      language: 'ja-JP'
    }, 'お電話ありがとうございます。オペレーターにおつなぎします。');
    
    twiml.play('https://demo.twilio.com/docs/classic.mp3');
  } else {
    twiml.say({
      voice: 'Polly.Mizuki',
      language: 'ja-JP'
    }, '申し訳ございません。営業時間外です。平日9時から18時まで営業しております。');
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});

const PORT = process.env.PORT || 3100;
app.listen(PORT, () => {
  console.log(`Business hours server running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/voice`);
});
```

</details>

### 課題2: コールバック予約

通話者から電話番号を入力してもらい、コールバック予約を受け付けるシステムを作成してください。入力された電話番号は保存して、確認メッセージを再生してください。

<details>
<summary>解答を見る</summary>

実行方法:
```bash
cd challenges/voice
node challenge2-callback-reservation.js
```

完全なコード:
```javascript
// challenge2-callback-reservation.js - シンプルなコールバック予約
import express from 'express';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const app = express();
const VoiceResponse = twilio.twiml.VoiceResponse;

app.use(express.urlencoded({ extended: false }));

// メイン音声応答
app.post('/voice', (req, res) => {
  const twiml = new VoiceResponse();
  const from = req.body.From;
  
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, 'コールバック予約システムです。電話番号を入力してください。');
  
  const gather = twiml.gather({
    numDigits: 11,
    action: '/callback/confirm',
    method: 'POST',
    timeout: 15,
    finishOnKey: '#'
  });
  
  gather.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, '11桁の電話番号を入力後、シャープを押してください。');
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// コールバック確認
app.post('/callback/confirm', (req, res) => {
  const twiml = new VoiceResponse();
  const phoneNumber = req.body.Digits;
  const from = req.body.From;
  
  console.log(`コールバック予約: ${from} -> ${phoneNumber}`);
  
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, `${phoneNumber}にコールバックを予約いたしました。後ほどお電話いたします。`);
  
  twiml.hangup();
  
  res.type('text/xml');
  res.send(twiml.toString());
});

const PORT = process.env.PORT || 3101;
app.listen(PORT, () => {
  console.log(`Callback server running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/voice`);
});
```

</details>


## TwiML動詞リファレンス

| 動詞 | 説明 | 使用例 |
|------|------|--------|
| `<Say>` | テキスト読み上げ | 音声案内 |
| `<Play>` | 音声ファイル再生 | BGM、録音メッセージ |
| `<Dial>` | 電話転送 | オペレーター接続 |
| `<Record>` | 通話録音 | 留守番電話 |
| `<Gather>` | 番号入力受付 | IVRメニュー |
| `<Pause>` | 一時停止 | 間の調整 |
| `<Redirect>` | 別のTwiMLへ転送 | フロー制御 |
| `<Hangup>` | 通話終了 | 切断処理 |


## 参考リンク

- [TwiML Voice ドキュメント](https://www.twilio.com/docs/voice/twiml)
- [音声合成オプション](https://www.twilio.com/docs/voice/twiml/say/text-speech)
- [通話録音ガイド](https://www.twilio.com/docs/voice/tutorials/how-to-record-phone-calls-node-js)

---

**次のステップ**: [ミニアプリ開発](./apps) →