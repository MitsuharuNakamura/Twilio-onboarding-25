#!/usr/bin/env node

// Apps課題1: AI連携SMS自動返信システム

import express from 'express';
import twilio from 'twilio';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import { RateLimiterMemory } from 'rate-limiter-flexible';

dotenv.config({ path: '../../.env' });

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const MessagingResponse = twilio.twiml.MessagingResponse;

// レート制限設定
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'sms_reply',
  points: 5, // 5回まで
  duration: 60, // 60秒間
});

// 会話履歴保存
const CONVERSATIONS_FILE = 'ai-conversations.json';
let conversations = {};

// AIモック応答エンジン（実際にはOpenAI等を使用）
class MockAIEngine {
  constructor() {
    this.responses = {
      // 挨拶
      greetings: [
        'こんにちは！どのようなご用件でしょうか？',
        'おはようございます！お手伝いできることがあればお聞かせください。',
        'お疲れ様です！何かお困りのことはありますか？'
      ],
      
      // 質問応答
      faq: {
        '営業時間': '営業時間は平日9:00-18:00、土曜日10:00-16:00です。日曜祝日は休業しております。',
        '料金': '基本料金は月額3,000円からです。詳細は料金表をご確認ください。',
        '予約': '予約は電話またはWebサイトから承っております。',
        'キャンセル': 'キャンセルは前日までにお願いいたします。',
        '場所': '東京都渋谷区にございます。詳しい住所はWebサイトをご確認ください。',
        '駐車場': '専用駐車場を3台分ご用意しております。満車の場合は近隣のコインパーキングをご利用ください。'
      },
      
      // 感情応答
      emotions: {
        'angry': 'ご迷惑をおかけして申し訳ございません。担当者から折り返しお電話させていただきます。',
        'confused': 'わかりにくくて申し訳ありません。もう少し詳しく教えていただけますでしょうか？',
        'thankful': 'ありがとうございます！他にもご不明な点があればお気軽にお聞かせください。'
      },
      
      // デフォルト応答
      defaults: [
        'お問い合わせありがとうございます。詳しい内容を担当者に確認いたします。',
        'ご質問を承りました。後ほど詳細をご連絡いたします。',
        'お忙しい中お問い合わせいただき、ありがとうございます。確認してご回答いたします。'
      ]
    };
  }
  
  // メッセージ解析
  analyzeMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    // 挨拶の検出
    if (this.containsAny(lowerMessage, ['こんにちは', 'おはよう', 'こんばんは', 'お疲れ'])) {
      return { type: 'greeting', confidence: 0.9 };
    }
    
    // FAQ検出
    for (const [key, response] of Object.entries(this.responses.faq)) {
      if (lowerMessage.includes(key)) {
        return { type: 'faq', key: key, confidence: 0.8 };
      }
    }
    
    // 感情の検出
    if (this.containsAny(lowerMessage, ['怒', '腹立', 'ふざけ', 'おかしい'])) {
      return { type: 'emotion', emotion: 'angry', confidence: 0.7 };
    }
    
    if (this.containsAny(lowerMessage, ['わからない', '意味不明', '理解できない'])) {
      return { type: 'emotion', emotion: 'confused', confidence: 0.7 };
    }
    
    if (this.containsAny(lowerMessage, ['ありがとう', 'ありがとうございます', '感謝'])) {
      return { type: 'emotion', emotion: 'thankful', confidence: 0.8 };
    }
    
    return { type: 'unknown', confidence: 0.3 };
  }
  
  // キーワード包含チェック
  containsAny(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
  }
  
  // AI応答生成
  generateResponse(analysis, message, context = {}) {
    let response = '';
    
    switch (analysis.type) {
      case 'greeting':
        response = this.randomChoice(this.responses.greetings);
        break;
        
      case 'faq':
        response = this.responses.faq[analysis.key];
        break;
        
      case 'emotion':
        response = this.responses.emotions[analysis.emotion];
        break;
        
      default:
        response = this.randomChoice(this.responses.defaults);
    }
    
    // 文脈を考慮した追加情報
    if (context.isFirstMessage) {
      response += '\n\nHELPと送信すると利用可能なコマンドを確認できます。';
    }
    
    if (analysis.confidence < 0.5) {
      response += '\n\n正確な回答のため、担当者から改めてご連絡いたします。';
    }
    
    return response;
  }
  
  // ランダム選択
  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}

const aiEngine = new MockAIEngine();

// 会話履歴読み込み
async function loadConversations() {
  try {
    const data = await fs.readFile(CONVERSATIONS_FILE, 'utf8');
    conversations = JSON.parse(data);
    console.log(`既存の会話履歴 ${Object.keys(conversations).length} 件を読み込みました`);
  } catch (error) {
    console.log('新しい会話履歴ファイルを作成します');
    conversations = {};
  }
}

// 会話履歴保存
async function saveConversations() {
  try {
    await fs.writeFile(CONVERSATIONS_FILE, JSON.stringify(conversations, null, 2));
  } catch (error) {
    console.error('会話履歴保存エラー:', error.message);
  }
}

// 会話履歴の取得/初期化
function getOrCreateConversation(phoneNumber) {
  if (!conversations[phoneNumber]) {
    conversations[phoneNumber] = {
      messages: [],
      createdAt: new Date().toISOString(),
      totalMessages: 0
    };
  }
  return conversations[phoneNumber];
}

// メッセージ追加
function addMessage(phoneNumber, message, type = 'received') {
  const conversation = getOrCreateConversation(phoneNumber);
  
  conversation.messages.push({
    content: message,
    type: type,
    timestamp: new Date().toISOString(),
    analysis: type === 'received' ? aiEngine.analyzeMessage(message) : null
  });
  
  conversation.totalMessages++;
  conversation.lastMessageAt = new Date().toISOString();
  
  // 履歴を最新100件に制限
  if (conversation.messages.length > 100) {
    conversation.messages = conversation.messages.slice(-100);
  }
  
  saveConversations();
}

// SMS受信処理
app.post('/sms', async (req, res) => {
  const incomingMessage = req.body.Body.trim();
  const from = req.body.From;
  const messageSid = req.body.MessageSid;
  
  console.log(`AI SMS受信: "${incomingMessage}" from ${from}`);
  
  const twiml = new MessagingResponse();
  
  try {
    // レート制限チェック
    await rateLimiter.consume(from);
    
    // 会話履歴に追加
    addMessage(from, incomingMessage, 'received');
    const conversation = conversations[from];
    
    // 特別コマンドの処理
    if (incomingMessage.toUpperCase() === 'HELP') {
      const helpMessage = `利用可能なコマンド:
- HELP: このヘルプを表示
- HISTORY: 会話履歴を表示
- CLEAR: 会話履歴をクリア
- STATUS: システム状況を確認

質問例:
「営業時間を教えて」
「料金はいくらですか」
「予約を取りたい」`;
      
      twiml.message(helpMessage);
      addMessage(from, helpMessage, 'sent');
      
    } else if (incomingMessage.toUpperCase() === 'HISTORY') {
      const recentMessages = conversation.messages.slice(-6);
      const historyText = recentMessages.map(m => 
        `${m.type === 'received' ? '📱' : '🤖'} ${m.content.substring(0, 50)}...`
      ).join('\n');
      
      const historyMessage = `最近の会話履歴:\n${historyText}\n\n総メッセージ数: ${conversation.totalMessages}`;
      twiml.message(historyMessage);
      addMessage(from, historyMessage, 'sent');
      
    } else if (incomingMessage.toUpperCase() === 'CLEAR') {
      delete conversations[from];
      saveConversations();
      
      const clearMessage = '会話履歴をクリアしました。新しい会話を開始できます。';
      twiml.message(clearMessage);
      addMessage(from, clearMessage, 'sent');
      
    } else if (incomingMessage.toUpperCase() === 'STATUS') {
      const totalConversations = Object.keys(conversations).length;
      const totalMessages = Object.values(conversations).reduce((sum, conv) => sum + conv.totalMessages, 0);
      
      const statusMessage = `システム状況:
アクティブ会話: ${totalConversations}
総メッセージ数: ${totalMessages}
あなたのメッセージ数: ${conversation.totalMessages}
AI信頼度: 高`;
      
      twiml.message(statusMessage);
      addMessage(from, statusMessage, 'sent');
      
    } else {
      // AI応答生成
      const analysis = aiEngine.analyzeMessage(incomingMessage);
      const context = {
        isFirstMessage: conversation.totalMessages === 1,
        messageCount: conversation.totalMessages,
        lastAnalysis: conversation.messages[conversation.messages.length - 2]?.analysis
      };
      
      const aiResponse = aiEngine.generateResponse(analysis, incomingMessage, context);
      
      // 応答に分析情報を追加（デバッグ用）
      const debugInfo = `\n\n[分析] タイプ: ${analysis.type}, 信頼度: ${Math.round(analysis.confidence * 100)}%`;
      const finalResponse = aiResponse + (process.env.NODE_ENV === 'development' ? debugInfo : '');
      
      twiml.message(finalResponse);
      addMessage(from, finalResponse, 'sent');
      
      console.log(`AI分析結果: ${JSON.stringify(analysis)}`);
    }
    
  } catch (rejRes) {
    // レート制限に引っかかった場合
    console.log(`レート制限: ${from}`);
    twiml.message('申し訳ございません。しばらく時間をおいてから再度お試しください。');
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// 会話履歴API
app.get('/conversations', (req, res) => {
  const summary = Object.entries(conversations).map(([phone, conv]) => ({
    phone: phone,
    totalMessages: conv.totalMessages,
    lastMessageAt: conv.lastMessageAt,
    createdAt: conv.createdAt
  }));
  
  res.json({
    total: summary.length,
    conversations: summary.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
  });
});

// 個別会話詳細API
app.get('/conversations/:phone', (req, res) => {
  const phone = decodeURIComponent(req.params.phone);
  const conversation = conversations[phone];
  
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  
  res.json({
    phone: phone,
    ...conversation,
    recentMessages: conversation.messages.slice(-20) // 最新20件
  });
});

// AI分析API
app.post('/analyze', (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  const analysis = aiEngine.analyzeMessage(message);
  const response = aiEngine.generateResponse(analysis, message);
  
  res.json({
    message: message,
    analysis: analysis,
    response: response
  });
});

// 統計API
app.get('/stats', (req, res) => {
  const conversations_count = Object.keys(conversations).length;
  const total_messages = Object.values(conversations).reduce((sum, conv) => sum + conv.totalMessages, 0);
  
  // 分析タイプ別統計
  const analysisStats = {};
  Object.values(conversations).forEach(conv => {
    conv.messages.forEach(msg => {
      if (msg.analysis) {
        analysisStats[msg.analysis.type] = (analysisStats[msg.analysis.type] || 0) + 1;
      }
    });
  });
  
  res.json({
    conversations: conversations_count,
    totalMessages: total_messages,
    averageMessagesPerConversation: conversations_count > 0 ? Math.round(total_messages / conversations_count) : 0,
    analysisBreakdown: analysisStats,
    systemStatus: 'running',
    timestamp: new Date().toISOString()
  });
});

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({
    status: 'running',
    service: 'AI SMS Reply System',
    features: ['AI Analysis', 'Conversation History', 'Rate Limiting'],
    timestamp: new Date().toISOString()
  });
});

// 管理画面
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>AI SMS自動返信システム</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 1200px; 
          margin: 50px auto; 
          padding: 20px; 
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }
        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }
        .conversation {
          border: 1px solid #ddd;
          padding: 15px;
          margin: 10px 0;
          border-radius: 5px;
        }
        .message {
          margin: 5px 0;
          padding: 8px;
          border-radius: 5px;
        }
        .received {
          background: #e3f2fd;
          text-align: left;
        }
        .sent {
          background: #f3e5f5;
          text-align: right;
        }
        .analysis-demo {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
        }
        input[type="text"] {
          width: 70%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        button {
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <h1>Apps課題1: AI連携SMS自動返信システム</h1>
      
      <h2>システム特徴</h2>
      <ul>
        <li>AI による自動メッセージ分析</li>
        <li>文脈を考慮した応答生成</li>
        <li>会話履歴の保存と管理</li>
        <li>レート制限による悪用防止</li>
        <li>感情分析とFAQ自動応答</li>
      </ul>
      
      <div class="stats" id="stats">
        <div class="stat-card">
          <h3>読み込み中...</h3>
        </div>
      </div>
      
      <div class="analysis-demo">
        <h3>AI分析デモ</h3>
        <p>メッセージを入力してAI分析を試してみてください:</p>
        <input type="text" id="testMessage" placeholder="例: 営業時間を教えてください" />
        <button onclick="analyzeMessage()">分析実行</button>
        <div id="analysisResult"></div>
      </div>
      
      <h2>最近の会話</h2>
      <div id="conversations">読み込み中...</div>
      
      <script>
        async function loadStats() {
          try {
            const response = await fetch('/stats');
            const data = await response.json();
            
            document.getElementById('stats').innerHTML = \`
              <div class="stat-card">
                <h3>\${data.conversations}</h3>
                <p>アクティブ会話</p>
              </div>
              <div class="stat-card">
                <h3>\${data.totalMessages}</h3>
                <p>総メッセージ数</p>
              </div>
              <div class="stat-card">
                <h3>\${data.averageMessagesPerConversation}</h3>
                <p>平均メッセージ/会話</p>
              </div>
              <div class="stat-card">
                <h3>稼働中</h3>
                <p>システム状態</p>
              </div>
            \`;
          } catch (error) {
            console.error('統計読み込みエラー:', error);
          }
        }
        
        async function loadConversations() {
          try {
            const response = await fetch('/conversations');
            const data = await response.json();
            
            const container = document.getElementById('conversations');
            
            if (data.conversations.length === 0) {
              container.innerHTML = '<p>会話履歴はありません</p>';
              return;
            }
            
            container.innerHTML = data.conversations.slice(0, 5).map(conv => \`
              <div class="conversation">
                <strong>\${conv.phone}</strong> 
                (メッセージ数: \${conv.totalMessages}, 
                最終: \${new Date(conv.lastMessageAt).toLocaleString('ja-JP')})
              </div>
            \`).join('');
            
          } catch (error) {
            document.getElementById('conversations').innerHTML = 
              '<p>会話履歴の読み込みに失敗しました</p>';
          }
        }
        
        async function analyzeMessage() {
          const message = document.getElementById('testMessage').value;
          if (!message) return;
          
          try {
            const response = await fetch('/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message })
            });
            
            const data = await response.json();
            
            document.getElementById('analysisResult').innerHTML = \`
              <h4>分析結果:</h4>
              <p><strong>タイプ:</strong> \${data.analysis.type}</p>
              <p><strong>信頼度:</strong> \${Math.round(data.analysis.confidence * 100)}%</p>
              <p><strong>AI応答:</strong></p>
              <div style="background: #f0f0f0; padding: 10px; border-radius: 5px; margin: 10px 0;">
                \${data.response}
              </div>
            \`;
            
          } catch (error) {
            document.getElementById('analysisResult').innerHTML = 
              '<p style="color: red;">分析エラーが発生しました</p>';
          }
        }
        
        // 初回読み込み
        loadStats();
        loadConversations();
        
        // 30秒ごとに自動更新
        setInterval(() => {
          loadStats();
          loadConversations();
        }, 30000);
        
        // Enterキーで分析実行
        document.getElementById('testMessage').addEventListener('keypress', (e) => {
          if (e.key === 'Enter') analyzeMessage();
        });
      </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3200;

// 起動時にデータ読み込み
loadConversations().then(() => {
  app.listen(PORT, () => {
    console.log(`Apps Challenge 1 server running on port ${PORT}`);
    console.log(`SMS Webhook URL: http://localhost:${PORT}/sms`);
    console.log(`Management interface: http://localhost:${PORT}/`);
    console.log(`Use ngrok to expose: npx ngrok http ${PORT}`);
    
    console.log('\n利用可能な機能:');
    console.log('- AI自動応答 (FAQ、感情分析)');
    console.log('- 会話履歴管理');
    console.log('- レート制限');
    console.log('- 特別コマンド (HELP, HISTORY, CLEAR, STATUS)');
  });
});