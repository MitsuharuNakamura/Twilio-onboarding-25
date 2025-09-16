---
id: apps
title: ミニアプリ開発
sidebar_label: Apps
---

# ミニアプリ開発

実践的な3つのミニアプリケーションを開発します。

## このセクションのゴール

- SMS自動返信システムの構築
- 留守番電話アプリの実装
- OTP（ワンタイムパスワード）認証の実装

## App 1: SMS自動返信システム

### 概要
受信したSMSに対して、内容に応じた自動返信を行うシステムです。

### セットアップ

```bash
cd mini-apps/sms-reply
npm install
node server.js
```

<details>
<summary>実装コードを見る</summary>

```javascript
// mini-apps/sms-reply/server.js
import express from 'express';
import twilio from 'twilio';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const MessagingResponse = twilio.twiml.MessagingResponse;

// キーワード辞書
const responses = {
  '営業時間': '営業時間は平日9:00-18:00です。土日祝日は休業となります。',
  '料金': '基本料金は月額3,000円です。詳細はウェブサイトをご確認ください。',
  '予約': '予約はこちらから→ https://example.com/reservation',
  'キャンセル': 'キャンセルを承りました。またのご利用をお待ちしております。',
  'STOP': 'メッセージの配信を停止しました。',
  'HELP': `利用可能なコマンド:
- 営業時間: 営業時間を確認
- 料金: 料金情報を確認
- 予約: 予約ページへのリンク
- キャンセル: 予約のキャンセル
- STOP: 配信停止`
};

// SMS受信処理
app.post('/sms', (req, res) => {
  const twiml = new MessagingResponse();
  const incomingMessage = req.body.Body.trim();
  const from = req.body.From;
  
  console.log(`受信: "${incomingMessage}" from ${from}`);
  
  // キーワードマッチング
  let responseMessage = null;
  
  for (const [keyword, response] of Object.entries(responses)) {
    if (incomingMessage.includes(keyword)) {
      responseMessage = response;
      break;
    }
  }
  
  // デフォルトメッセージ
  if (!responseMessage) {
    responseMessage = `メッセージを受信しました: "${incomingMessage}"
    
HELPと送信すると利用可能なコマンドを確認できます。`;
  }
  
  twiml.message(responseMessage);
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// ステータス確認エンドポイント
app.get('/health', (req, res) => {
  res.json({ 
    status: 'running',
    service: 'SMS Auto Reply',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`SMS Reply server running on port ${PORT}`);
});
```

</details>

### 高度な機能: AI連携

```javascript
// OpenAI APIとの連携例
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function getAIResponse(message) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "あなたはカスタマーサポートアシスタントです。丁寧に質問に答えてください。"
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 150
    });
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('AI Error:', error);
    return '申し訳ございません。現在AIアシスタントが利用できません。';
  }
}

app.post('/sms-ai', async (req, res) => {
  const twiml = new MessagingResponse();
  const incomingMessage = req.body.Body;
  
  const aiResponse = await getAIResponse(incomingMessage);
  twiml.message(aiResponse);
  
  res.type('text/xml');
  res.send(twiml.toString());
});
```

## App 2: 留守番電話システム

### 概要
シンプルな留守番電話システムです。着信時にメッセージを録音し、Twilioに保存します。

### セットアップ

```bash
cd mini-apps/voicemail
npm install
node server.js
```

<details>
<summary>実装コードを見る</summary>

```javascript
// mini-apps/voicemail/server.js
import express from 'express';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const app = express();
app.use(express.urlencoded({ extended: false }));

const { VoiceResponse } = twilio.twiml;

app.post('/voice', (req, res) => {
  const twiml = new VoiceResponse();

  twiml.say({ language: 'ja-JP' },
    'お電話ありがとうございます。ただいま留守にしております。'
  );
  twiml.say({ language: 'ja-JP' },
    'ピーという音のあとにメッセージをお話しください。'
  );

  twiml.record({
    maxLength: 60,
    playBeep: true
  });

  res.type('text/xml');
  res.send(twiml.toString());
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`留守番電話サーバー起動: http://localhost:${PORT}`);
  console.log(`Twilio Webhook URL: https://your-ngrok-url/voice`);
});
```

</details>

## App 3: OTP認証システム


### 課題: OTP認証システムの作成

SMSを使ったワンタイムパスワード（OTP）認証システムを作成してください。6桁のランダムなコードを生成してSMSで送信し、ユーザーが入力したコードを検証する機能を実装してください。5分間の有効期限と3回までの試行制限も設けてください。

<details>
<summary>解答を見る</summary>

```javascript
// mini-apps/verify-otp/server.js
import express from 'express';
import twilio from 'twilio';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// OTP保存用（実際にはRedisなどを使用）
const otpStorage = new Map();

// OTP生成
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// OTP送信エンドポイント
app.post('/api/send-otp', async (req, res) => {
  const { phoneNumber } = req.body;
  
  if (!phoneNumber) {
    return res.status(400).json({ 
      success: false, 
      message: '電話番号が必要です' 
    });
  }
  
  try {
    // OTP生成
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5分後に期限切れ
    
    // OTP保存
    otpStorage.set(phoneNumber, {
      otp: otp,
      expiresAt: expiresAt,
      attempts: 0
    });
    
    // SMS送信
    const message = await client.messages.create({
      body: `認証コード: ${otp}\n\n5分以内に入力してください。\nこのコードは他人と共有しないでください。`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    
    console.log(`OTP送信: ${phoneNumber} -> ${otp}`);
    
    res.json({
      success: true,
      message: 'OTPを送信しました',
      messageSid: message.sid
    });
    
  } catch (error) {
    console.error('OTP送信エラー:', error);
    res.status(500).json({
      success: false,
      message: 'OTP送信に失敗しました'
    });
  }
});

// OTP検証エンドポイント
app.post('/api/verify-otp', (req, res) => {
  const { phoneNumber, otp } = req.body;
  
  if (!phoneNumber || !otp) {
    return res.status(400).json({
      success: false,
      message: '電話番号とOTPが必要です'
    });
  }
  
  const storedData = otpStorage.get(phoneNumber);
  
  if (!storedData) {
    return res.status(400).json({
      success: false,
      message: 'OTPが見つかりません。再送信してください。'
    });
  }
  
  // 期限切れチェック
  if (Date.now() > storedData.expiresAt) {
    otpStorage.delete(phoneNumber);
    return res.status(400).json({
      success: false,
      message: 'OTPの有効期限が切れました'
    });
  }
  
  // 試行回数チェック
  if (storedData.attempts >= 3) {
    otpStorage.delete(phoneNumber);
    return res.status(429).json({
      success: false,
      message: '試行回数を超えました。新しいOTPを要求してください。'
    });
  }
  
  // OTP検証
  if (storedData.otp === otp) {
    otpStorage.delete(phoneNumber);
    
    // セッション作成（実装例）
    const token = crypto.randomBytes(32).toString('hex');
    
    res.json({
      success: true,
      message: '認証成功',
      token: token
    });
  } else {
    storedData.attempts++;
    
    res.status(400).json({
      success: false,
      message: 'OTPが正しくありません',
      attemptsRemaining: 3 - storedData.attempts
    });
  }
});

// OTP再送信エンドポイント
app.post('/api/resend-otp', async (req, res) => {
  const { phoneNumber } = req.body;
  
  // 既存のOTPを削除
  otpStorage.delete(phoneNumber);
  
  // 新しいOTPを送信
  req.body = { phoneNumber };
  await app._router.handle(req, res);
});

// HTML提供
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OTP認証デモ</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 400px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      text-align: center;
    }
    input {
      width: 100%;
      padding: 12px;
      margin: 10px 0;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 16px;
      box-sizing: border-box;
    }
    button {
      width: 100%;
      padding: 12px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 16px;
      cursor: pointer;
      margin-top: 10px;
    }
    button:hover {
      background: #0056b3;
    }
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .message {
      margin: 15px 0;
      padding: 10px;
      border-radius: 5px;
      text-align: center;
    }
    .success {
      background: #d4edda;
      color: #155724;
    }
    .error {
      background: #f8d7da;
      color: #721c24;
    }
    .timer {
      text-align: center;
      color: #666;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>OTP認証</h1>
    
    <div id="step1">
      <input type="tel" id="phoneNumber" placeholder="電話番号 (例: +81901234567)">
      <button onclick="sendOTP()">OTPを送信</button>
    </div>
    
    <div id="step2" style="display:none;">
      <input type="text" id="otpCode" placeholder="6桁の認証コード" maxlength="6">
      <div class="timer" id="timer"></div>
      <button onclick="verifyOTP()">認証</button>
      <button onclick="resendOTP()" id="resendBtn" disabled>再送信</button>
    </div>
    
    <div id="message"></div>
  </div>
  
  <script>
    let timerInterval;
    let phoneNumber;
    
    async function sendOTP() {
      phoneNumber = document.getElementById('phoneNumber').value;
      
      if (!phoneNumber) {
        showMessage('電話番号を入力してください', 'error');
        return;
      }
      
      try {
        const response = await fetch('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber })
        });
        
        const data = await response.json();
        
        if (data.success) {
          showMessage('OTPを送信しました', 'success');
          document.getElementById('step1').style.display = 'none';
          document.getElementById('step2').style.display = 'block';
          startTimer(300); // 5分タイマー
        } else {
          showMessage(data.message, 'error');
        }
      } catch (error) {
        showMessage('エラーが発生しました', 'error');
      }
    }
    
    async function verifyOTP() {
      const otp = document.getElementById('otpCode').value;
      
      if (!otp) {
        showMessage('認証コードを入力してください', 'error');
        return;
      }
      
      try {
        const response = await fetch('/api/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber, otp })
        });
        
        const data = await response.json();
        
        if (data.success) {
          showMessage('認証成功！', 'success');
          clearInterval(timerInterval);
          setTimeout(() => {
            alert('ログインしました！');
            location.reload();
          }, 1000);
        } else {
          showMessage(data.message + (data.attemptsRemaining ? \` (残り\${data.attemptsRemaining}回)\` : ''), 'error');
        }
      } catch (error) {
        showMessage('エラーが発生しました', 'error');
      }
    }
    
    async function resendOTP() {
      try {
        const response = await fetch('/api/resend-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber })
        });
        
        const data = await response.json();
        
        if (data.success) {
          showMessage('OTPを再送信しました', 'success');
          startTimer(300);
        } else {
          showMessage(data.message, 'error');
        }
      } catch (error) {
        showMessage('エラーが発生しました', 'error');
      }
    }
    
    function startTimer(seconds) {
      clearInterval(timerInterval);
      document.getElementById('resendBtn').disabled = true;
      
      let remaining = seconds;
      
      timerInterval = setInterval(() => {
        remaining--;
        
        const minutes = Math.floor(remaining / 60);
        const secs = remaining % 60;
        document.getElementById('timer').textContent = 
          \`有効期限: \${minutes}:\${secs.toString().padStart(2, '0')}\`;
        
        if (remaining <= 0) {
          clearInterval(timerInterval);
          document.getElementById('timer').textContent = '期限切れ';
          document.getElementById('resendBtn').disabled = false;
        }
      }, 1000);
    }
    
    function showMessage(text, type) {
      const messageDiv = document.getElementById('message');
      messageDiv.className = \`message \${type}\`;
      messageDiv.textContent = text;
      
      setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = 'message';
      }, 5000);
    }
  </script>
</body>
</html>
  `);
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`OTP server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to test`);
});
```

</details>

## 参考リンク

- [Twilio Functions](https://www.twilio.com/docs/runtime/functions)
- [Webhooks セキュリティ](https://www.twilio.com/docs/usage/security)
- [Twilio Verify API](https://www.twilio.com/docs/verify/api)

---

**お疲れ様でした！** これでTwilioワークショップは完了です。