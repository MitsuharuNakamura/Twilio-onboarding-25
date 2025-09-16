import express from 'express';
import twilio from 'twilio';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

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
  'START': 'メッセージの配信を再開しました。',
  'HELP': `利用可能なコマンド:
- 営業時間: 営業時間を確認
- 料金: 料金情報を確認
- 予約: 予約ページへのリンク
- キャンセル: 予約のキャンセル
- STOP: 配信停止
- START: 配信再開`
};

// 会話履歴を保存（実際にはDBを使用）
const conversations = new Map();

// SMS受信処理
app.post('/sms', (req, res) => {
  const twiml = new MessagingResponse();
  const incomingMessage = req.body.Body.trim();
  const from = req.body.From;
  
  console.log(`受信: "${incomingMessage}" from ${from}`);
  
  // 会話履歴を取得または初期化
  if (!conversations.has(from)) {
    conversations.set(from, []);
  }
  const history = conversations.get(from);
  history.push({
    message: incomingMessage,
    timestamp: new Date(),
    type: 'received'
  });
  
  // キーワードマッチング
  let responseMessage = null;
  
  // 大文字小文字を無視して検索
  const upperMessage = incomingMessage.toUpperCase();
  
  for (const [keyword, response] of Object.entries(responses)) {
    if (upperMessage.includes(keyword.toUpperCase())) {
      responseMessage = response;
      break;
    }
  }
  
  // 特定のパターンに対する応答
  if (!responseMessage) {
    if (incomingMessage.match(/こんにちは|こんばんは|おはよう/)) {
      responseMessage = 'こんにちは！本日はどのようなご用件でしょうか？HELPと送信すると利用可能なコマンドをご確認いただけます。';
    } else if (incomingMessage.match(/ありがとう/)) {
      responseMessage = 'どういたしまして！他にご不明な点がございましたらお気軽にお問い合わせください。';
    } else {
      // デフォルトメッセージ
      responseMessage = `メッセージを受信しました: "${incomingMessage}"
      
お問い合わせありがとうございます。
HELPと送信すると利用可能なコマンドを確認できます。`;
    }
  }
  
  // 応答を履歴に追加
  history.push({
    message: responseMessage,
    timestamp: new Date(),
    type: 'sent'
  });
  
  // 履歴が長くなりすぎないように制限
  if (history.length > 20) {
    history.splice(0, history.length - 20);
  }
  
  twiml.message(responseMessage);
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// 会話履歴取得API
app.get('/conversations/:phone', (req, res) => {
  const phone = req.params.phone;
  const history = conversations.get(phone) || [];
  
  res.json({
    phone: phone,
    history: history,
    totalMessages: history.length
  });
});

// 統計情報API
app.get('/stats', (req, res) => {
  const stats = {
    totalConversations: conversations.size,
    totalMessages: Array.from(conversations.values()).reduce((sum, history) => sum + history.length, 0),
    activeConversations: Array.from(conversations.entries()).filter(([phone, history]) => {
      const lastMessage = history[history.length - 1];
      const hoursSinceLastMessage = (Date.now() - lastMessage.timestamp) / (1000 * 60 * 60);
      return hoursSinceLastMessage < 24;
    }).length,
    timestamp: new Date().toISOString()
  };
  
  res.json(stats);
});

// ステータス確認エンドポイント
app.get('/health', (req, res) => {
  res.json({ 
    status: 'running',
    service: 'SMS Auto Reply',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ルートパス
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SMS Auto Reply System</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
        }
        h1 { color: #F22F46; }
        .endpoint {
          background: #f5f5f5;
          padding: 10px;
          margin: 10px 0;
          border-radius: 5px;
        }
        .method {
          display: inline-block;
          padding: 3px 8px;
          background: #007bff;
          color: white;
          border-radius: 3px;
          font-size: 12px;
          margin-right: 10px;
        }
      </style>
    </head>
    <body>
      <h1>SMS Auto Reply System</h1>
      <p>Twilioワークショップ - SMS自動返信システム</p>
      
      <h2>Available Endpoints:</h2>
      <div class="endpoint">
        <span class="method">POST</span>
        <strong>/sms</strong> - Webhook for incoming SMS
      </div>
      <div class="endpoint">
        <span class="method">GET</span>
        <strong>/conversations/:phone</strong> - Get conversation history
      </div>
      <div class="endpoint">
        <span class="method">GET</span>
        <strong>/stats</strong> - Get system statistics
      </div>
      <div class="endpoint">
        <span class="method">GET</span>
        <strong>/health</strong> - Health check
      </div>
      
      <h2>Supported Keywords:</h2>
      <ul>
        <li>営業時間</li>
        <li>料金</li>
        <li>予約</li>
        <li>キャンセル</li>
        <li>HELP</li>
        <li>STOP / START</li>
      </ul>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`SMS Reply server running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/sms`);
  console.log(`Use ngrok to expose this server: npx ngrok http ${PORT}`);
});