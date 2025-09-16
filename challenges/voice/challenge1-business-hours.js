#!/usr/bin/env node

// Voice課題1: 営業時間チェック

import express from 'express';
import twilio from 'twilio';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const VoiceResponse = twilio.twiml.VoiceResponse;

// 営業時間設定
const BUSINESS_HOURS = {
  // 平日 (1=月曜日, 5=金曜日)
  weekdays: {
    start: 9,  // 9時
    end: 18    // 18時
  },
  // 土曜日
  saturday: {
    start: 10, // 10時
    end: 16    // 16時
  },
  // 日曜日は休業
  sunday: null,
  // 祝日設定（簡単な例）
  holidays: [
    '2025-01-01', // 元日
    '2025-01-13', // 成人の日
    '2025-02-11', // 建国記念の日
    // 必要に応じて追加
  ]
};

// 営業時間チェック関数
function isBusinessHours(now = new Date()) {
  const day = now.getDay(); // 0=日曜日, 1=月曜日, ..., 6=土曜日
  const hours = now.getHours();
  const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD形式
  
  console.log(`営業時間チェック: ${now.toLocaleString('ja-JP')} (曜日: ${day}, 時: ${hours})`);
  
  // 祝日チェック
  if (BUSINESS_HOURS.holidays.includes(dateString)) {
    console.log('祝日のため休業');
    return { open: false, reason: 'holiday' };
  }
  
  // 日曜日チェック
  if (day === 0) {
    console.log('日曜日のため休業');
    return { open: false, reason: 'sunday' };
  }
  
  // 土曜日チェック
  if (day === 6) {
    const { start, end } = BUSINESS_HOURS.saturday;
    const isOpen = hours >= start && hours < end;
    console.log(`土曜日営業時間: ${start}:00-${end}:00, 現在: ${isOpen ? '営業中' : '営業時間外'}`);
    return { 
      open: isOpen, 
      reason: isOpen ? 'saturday_open' : 'saturday_closed',
      schedule: `土曜日 ${start}:00-${end}:00`
    };
  }
  
  // 平日チェック (月〜金)
  if (day >= 1 && day <= 5) {
    const { start, end } = BUSINESS_HOURS.weekdays;
    const isOpen = hours >= start && hours < end;
    console.log(`平日営業時間: ${start}:00-${end}:00, 現在: ${isOpen ? '営業中' : '営業時間外'}`);
    return { 
      open: isOpen, 
      reason: isOpen ? 'weekday_open' : 'weekday_closed',
      schedule: `平日 ${start}:00-${end}:00`
    };
  }
  
  return { open: false, reason: 'unknown' };
}

// 次の営業時間を取得
function getNextBusinessHours(now = new Date()) {
  const nextDay = new Date(now);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(9, 0, 0, 0); // 翌日の9時
  
  // 最大7日先まで検索
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(nextDay);
    checkDate.setDate(nextDay.getDate() + i);
    
    const businessHours = isBusinessHours(checkDate);
    if (businessHours.open) {
      return checkDate;
    }
  }
  
  return null;
}

// メイン音声応答エンドポイント
app.post('/voice', (req, res) => {
  const from = req.body.From;
  const callSid = req.body.CallSid;
  
  console.log(`着信: ${from} (CallSid: ${callSid})`);
  
  const twiml = new VoiceResponse();
  const businessStatus = isBusinessHours();
  
  if (businessStatus.open) {
    // 営業時間内
    twiml.say({
      voice: 'Polly.Mizuki',
      language: 'ja-JP'
    }, 'お電話ありがとうございます。Twilioカスタマーサポートです。');
    
    twiml.pause({ length: 1 });
    
    twiml.say({
      voice: 'Polly.Mizuki',
      language: 'ja-JP'  
    }, 'ただいま営業時間内です。オペレーターにおつなぎします。少々お待ちください。');
    
    // 実際の環境では実際の番号に転送
    // twiml.dial('+81312345678');
    
    // デモ用に音楽を再生
    twiml.play('https://demo.twilio.com/docs/classic.mp3');
    
    twiml.say({
      voice: 'Polly.Mizuki',
      language: 'ja-JP'
    }, 'デモ環境のため、実際の転送は行いません。ありがとうございました。');
    
  } else {
    // 営業時間外
    let message = 'お電話ありがとうございます。';
    
    switch (businessStatus.reason) {
      case 'holiday':
        message += '本日は祝日のため休業しております。';
        break;
      case 'sunday':
        message += '日曜日は定休日となっております。';
        break;
      case 'saturday_closed':
        message += `土曜日の営業時間は${businessStatus.schedule}です。現在は営業時間外です。`;
        break;
      case 'weekday_closed':
        message += `平日の営業時間は${businessStatus.schedule}です。現在は営業時間外です。`;
        break;
      default:
        message += '現在は営業時間外です。';
    }
    
    twiml.say({
      voice: 'Polly.Mizuki',
      language: 'ja-JP'
    }, message);
    
    twiml.pause({ length: 1 });
    
    // 次の営業時間をお知らせ
    const nextOpen = getNextBusinessHours();
    if (nextOpen) {
      const nextMessage = `次回営業は${nextOpen.toLocaleDateString('ja-JP')}、${nextOpen.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}からとなります。`;
      
      twiml.say({
        voice: 'Polly.Mizuki',
        language: 'ja-JP'
      }, nextMessage);
    }
    
    twiml.pause({ length: 1 });
    
    // 留守番電話オプション
    twiml.say({
      voice: 'Polly.Mizuki',
      language: 'ja-JP'
    }, '緊急の場合は1を押してください。留守番電話をご希望の場合は2を押してください。');
    
    const gather = twiml.gather({
      numDigits: 1,
      action: '/after-hours-menu',
      method: 'POST',
      timeout: 10
    });
    
    // タイムアウト時
    twiml.say({
      voice: 'Polly.Mizuki',
      language: 'ja-JP'
    }, 'お電話ありがとうございました。');
    
    twiml.hangup();
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// 営業時間外メニュー処理
app.post('/after-hours-menu', (req, res) => {
  const digit = req.body.Digits;
  const from = req.body.From;
  
  console.log(`営業時間外メニュー選択: ${digit} from ${from}`);
  
  const twiml = new VoiceResponse();
  
  switch (digit) {
    case '1':
      // 緊急対応
      twiml.say({
        voice: 'Polly.Mizuki',
        language: 'ja-JP'
      }, '緊急対応窓口におつなぎします。');
      
      // 実際の環境では緊急対応番号に転送
      // twiml.dial('+81312345679');
      
      twiml.say({
        voice: 'Polly.Mizuki',
        language: 'ja-JP'
      }, 'デモ環境のため、実際の転送は行いません。緊急の場合は直接お電話ください。');
      break;
      
    case '2':
      // 留守番電話
      twiml.redirect('/voicemail');
      break;
      
    default:
      twiml.say({
        voice: 'Polly.Mizuki',
        language: 'ja-JP'
      }, '無効な選択です。お電話ありがとうございました。');
      twiml.hangup();
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// 留守番電話
app.post('/voicemail', (req, res) => {
  const twiml = new VoiceResponse();
  
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, 'ピーという音の後にメッセージをお残しください。録音時間は最大60秒です。');
  
  twiml.record({
    action: '/voicemail-complete',
    method: 'POST',
    maxLength: 60,
    playBeep: true
  });
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// 留守番電話完了
app.post('/voicemail-complete', (req, res) => {
  const recordingUrl = req.body.RecordingUrl;
  const duration = req.body.RecordingDuration;
  const from = req.body.From;
  
  console.log(`留守番電話録音完了: ${from}, 時間: ${duration}秒, URL: ${recordingUrl}`);
  
  const twiml = new VoiceResponse();
  
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, 'メッセージをお預かりしました。営業時間内に折り返しご連絡いたします。ありがとうございました。');
  
  twiml.hangup();
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// 営業時間確認API
app.get('/business-hours', (req, res) => {
  const now = new Date();
  const status = isBusinessHours(now);
  const nextOpen = getNextBusinessHours(now);
  
  res.json({
    currentTime: now.toISOString(),
    isOpen: status.open,
    reason: status.reason,
    schedule: status.schedule,
    nextOpenTime: nextOpen ? nextOpen.toISOString() : null
  });
});

// 営業時間設定API
app.get('/business-hours/settings', (req, res) => {
  res.json(BUSINESS_HOURS);
});

// テスト用：時間を指定して営業時間チェック
app.get('/test-business-hours/:datetime', (req, res) => {
  const testDate = new Date(req.params.datetime);
  
  if (isNaN(testDate)) {
    return res.status(400).json({ error: 'Invalid datetime format' });
  }
  
  const status = isBusinessHours(testDate);
  
  res.json({
    testTime: testDate.toISOString(),
    isOpen: status.open,
    reason: status.reason,
    schedule: status.schedule
  });
});

// ヘルスチェック
app.get('/health', (req, res) => {
  const status = isBusinessHours();
  
  res.json({
    status: 'running',
    service: 'Business Hours Voice System',
    currentlyOpen: status.open,
    timestamp: new Date().toISOString()
  });
});

// ルートページ
app.get('/', (req, res) => {
  const status = isBusinessHours();
  const nextOpen = getNextBusinessHours();
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>営業時間チェックシステム</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 800px; 
          margin: 50px auto; 
          padding: 20px; 
        }
        .status { 
          padding: 20px; 
          border-radius: 10px; 
          margin: 20px 0; 
          text-align: center;
          font-size: 18px;
        }
        .open { background: #d4edda; color: #155724; }
        .closed { background: #f8d7da; color: #721c24; }
        .api-section {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        code {
          background: #e9ecef;
          padding: 2px 5px;
          border-radius: 3px;
        }
      </style>
    </head>
    <body>
      <h1>Voice課題1: 営業時間チェックシステム</h1>
      
      <div class="status ${status.open ? 'open' : 'closed'}">
        現在: ${status.open ? '営業中' : '営業時間外'}
        ${status.schedule ? `<br>営業時間: ${status.schedule}` : ''}
        ${nextOpen ? `<br>次回営業: ${nextOpen.toLocaleString('ja-JP')}` : ''}
      </div>
      
      <h2>テスト方法</h2>
      <ol>
        <li>Twilioコンソールでこのサーバーの <code>/voice</code> をWebhook URLに設定</li>
        <li>設定した電話番号に電話をかける</li>
        <li>営業時間に応じて異なる応答を確認</li>
      </ol>
      
      <div class="api-section">
        <h3>API エンドポイント</h3>
        <ul>
          <li><code>POST /voice</code> - メイン音声応答</li>
          <li><code>GET /business-hours</code> - 現在の営業状況</li>
          <li><code>GET /test-business-hours/2025-01-15T10:30:00</code> - 指定時刻での営業状況テスト</li>
        </ul>
      </div>
      
      <div class="api-section">
        <h3>営業時間設定</h3>
        <ul>
          <li>平日: ${BUSINESS_HOURS.weekdays.start}:00 - ${BUSINESS_HOURS.weekdays.end}:00</li>
          <li>土曜: ${BUSINESS_HOURS.saturday.start}:00 - ${BUSINESS_HOURS.saturday.end}:00</li>
          <li>日曜: 定休日</li>
          <li>祝日: 休業</li>
        </ul>
      </div>
      
      <p>現在時刻: ${new Date().toLocaleString('ja-JP')}</p>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3100;
app.listen(PORT, () => {
  console.log(`Voice Challenge 1 server running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/voice`);
  console.log(`Web interface: http://localhost:${PORT}/`);
  console.log(`Use ngrok to expose: npx ngrok http ${PORT}`);
  
  // 現在の営業状況を表示
  const status = isBusinessHours();
  console.log(`\n現在の営業状況: ${status.open ? '営業中' : '営業時間外'} (${status.reason})`);
});