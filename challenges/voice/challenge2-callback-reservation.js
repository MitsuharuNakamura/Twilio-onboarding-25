#!/usr/bin/env node

// Voice課題2: コールバック予約システム

import express from 'express';
import twilio from 'twilio';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config({ path: '../../.env' });

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const VoiceResponse = twilio.twiml.VoiceResponse;
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// コールバック予約データ保存
const CALLBACK_FILE = 'callback-reservations.json';
let callbackReservations = [];

// データ読み込み
async function loadCallbackData() {
  try {
    const data = await fs.readFile(CALLBACK_FILE, 'utf8');
    callbackReservations = JSON.parse(data);
    console.log(`既存のコールバック予約 ${callbackReservations.length} 件を読み込みました`);
  } catch (error) {
    console.log('新しいコールバック予約ファイルを作成します');
    callbackReservations = [];
  }
}

// データ保存
async function saveCallbackData() {
  try {
    await fs.writeFile(CALLBACK_FILE, JSON.stringify(callbackReservations, null, 2));
    console.log(`コールバック予約データを保存しました`);
  } catch (error) {
    console.error('データ保存エラー:', error.message);
  }
}

// 電話番号の正規化
function normalizePhoneNumber(number) {
  // +を除去し、数字のみ抽出
  const cleaned = number.replace(/[^0-9]/g, '');
  
  // 国内番号の場合は+81を付加
  if (cleaned.startsWith('0')) {
    return '+81' + cleaned.substring(1);
  }
  
  // 既に国際番号の場合
  if (cleaned.startsWith('81')) {
    return '+' + cleaned;
  }
  
  return '+81' + cleaned;
}

// 電話番号の検証
function isValidPhoneNumber(number) {
  const cleaned = number.replace(/[^0-9+]/g, '');
  
  // 日本の電話番号パターン
  const patterns = [
    /^\+81[0-9]{9,10}$/, // 国際形式
    /^0[0-9]{9,10}$/,    // 国内形式
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
}

// メイン音声応答
app.post('/voice', (req, res) => {
  const from = req.body.From;
  const callSid = req.body.CallSid;
  
  console.log(`コールバック予約システム着信: ${from} (CallSid: ${callSid})`);
  
  const twiml = new VoiceResponse();
  
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, 'お電話ありがとうございます。Twilioカスタマーサポートです。');
  
  twiml.pause({ length: 1 });
  
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, '申し訳ございませんが、ただいま電話が大変混雑しております。コールバック予約を承ります。');
  
  twiml.pause({ length: 1 });
  
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, 'コールバックをご希望の場合は1を、そのままお待ちいただく場合は2を押してください。');
  
  const gather = twiml.gather({
    numDigits: 1,
    action: '/callback-menu',
    method: 'POST',
    timeout: 10
  });
  
  // タイムアウト時は待機列に案内
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, 'そのままお待ちください。順番にお繋ぎします。');
  
  twiml.play('https://demo.twilio.com/docs/classic.mp3');
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// コールバックメニュー処理
app.post('/callback-menu', (req, res) => {
  const digit = req.body.Digits;
  const from = req.body.From;
  
  console.log(`コールバックメニュー選択: ${digit} from ${from}`);
  
  const twiml = new VoiceResponse();
  
  switch (digit) {
    case '1':
      // コールバック予約に進む
      twiml.redirect('/callback-start');
      break;
      
    case '2':
      // 待機列に案内
      twiml.say({
        voice: 'Polly.Mizuki',
        language: 'ja-JP'
      }, 'お待ちいただきありがとうございます。順番にお繋ぎします。');
      
      twiml.play('https://demo.twilio.com/docs/classic.mp3');
      break;
      
    default:
      twiml.say({
        voice: 'Polly.Mizuki',
        language: 'ja-JP'
      }, '無効な選択です。コールバック予約を開始します。');
      
      twiml.redirect('/callback-start');
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// コールバック予約開始
app.post('/callback-start', (req, res) => {
  const from = req.body.From;
  
  console.log(`コールバック予約開始: ${from}`);
  
  const twiml = new VoiceResponse();
  
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, 'コールバック予約を承ります。');
  
  twiml.pause({ length: 1 });
  
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, '現在お使いの番号にコールバックする場合は1を、別の番号を指定する場合は2を押してください。');
  
  const gather = twiml.gather({
    numDigits: 1,
    action: '/callback-number-choice',
    method: 'POST',
    timeout: 10
  });
  
  // タイムアウト時は現在の番号を使用
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, '現在お使いの番号にコールバックを予約します。');
  
  twiml.redirect(`/callback-confirm?number=${encodeURIComponent(from)}`);
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// 番号選択処理
app.post('/callback-number-choice', (req, res) => {
  const digit = req.body.Digits;
  const from = req.body.From;
  
  console.log(`番号選択: ${digit} from ${from}`);
  
  const twiml = new VoiceResponse();
  
  switch (digit) {
    case '1':
      // 現在の番号を使用
      twiml.redirect(`/callback-confirm?number=${encodeURIComponent(from)}`);
      break;
      
    case '2':
      // 別の番号を入力
      twiml.say({
        voice: 'Polly.Mizuki',
        language: 'ja-JP'
      }, 'コールバックをご希望の電話番号を、ハイフンなしで入力してください。市外局番から入力し、最後にシャープを押してください。');
      
      const gather = twiml.gather({
        finishOnKey: '#',
        action: '/callback-number-input',
        method: 'POST',
        timeout: 30
      });
      
      // タイムアウト時
      twiml.say({
        voice: 'Polly.Mizuki',
        language: 'ja-JP'
      }, '入力時間を過ぎました。現在お使いの番号にコールバックを予約します。');
      
      twiml.redirect(`/callback-confirm?number=${encodeURIComponent(from)}`);
      break;
      
    default:
      twiml.say({
        voice: 'Polly.Mizuki',
        language: 'ja-JP'
      }, '無効な選択です。現在お使いの番号にコールバックを予約します。');
      
      twiml.redirect(`/callback-confirm?number=${encodeURIComponent(from)}`);
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// 電話番号入力処理
app.post('/callback-number-input', (req, res) => {
  const inputNumber = req.body.Digits;
  const from = req.body.From;
  
  console.log(`入力された番号: ${inputNumber} from ${from}`);
  
  const twiml = new VoiceResponse();
  
  // 番号を正規化
  const normalizedNumber = normalizePhoneNumber(inputNumber);
  
  if (isValidPhoneNumber(normalizedNumber)) {
    // 確認用に番号を読み上げ
    const readableNumber = normalizedNumber.replace(/^\+81/, '0').replace(/(.{3})(.{4})(.{4})/, '$1-$2-$3');
    
    twiml.say({
      voice: 'Polly.Mizuki',
      language: 'ja-JP'
    }, `入力された番号は${readableNumber}です。この番号でよろしければ1を、やり直す場合は2を押してください。`);
    
    const gather = twiml.gather({
      numDigits: 1,
      action: `/callback-number-confirm?number=${encodeURIComponent(normalizedNumber)}`,
      method: 'POST',
      timeout: 10
    });
    
    // タイムアウト時は確定
    twiml.redirect(`/callback-confirm?number=${encodeURIComponent(normalizedNumber)}`);
    
  } else {
    twiml.say({
      voice: 'Polly.Mizuki',
      language: 'ja-JP'
    }, '入力された番号が無効です。現在お使いの番号にコールバックを予約します。');
    
    twiml.redirect(`/callback-confirm?number=${encodeURIComponent(from)}`);
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// 番号確認処理
app.post('/callback-number-confirm', (req, res) => {
  const digit = req.body.Digits;
  const number = req.query.number;
  const from = req.body.From;
  
  console.log(`番号確認: ${digit}, 番号: ${number} from ${from}`);
  
  const twiml = new VoiceResponse();
  
  if (digit === '1') {
    // 確定
    twiml.redirect(`/callback-confirm?number=${encodeURIComponent(number)}`);
  } else {
    // やり直し
    twiml.say({
      voice: 'Polly.Mizuki',
      language: 'ja-JP'
    }, '現在お使いの番号にコールバックを予約します。');
    
    twiml.redirect(`/callback-confirm?number=${encodeURIComponent(from)}`);
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// コールバック確定
app.post('/callback-confirm', async (req, res) => {
  const callbackNumber = req.query.number;
  const from = req.body.From;
  const callSid = req.body.CallSid;
  
  console.log(`コールバック予約確定: ${callbackNumber} from ${from}`);
  
  // 予約データを作成
  const reservation = {
    id: callSid,
    originalCaller: from,
    callbackNumber: callbackNumber,
    requestedAt: new Date().toISOString(),
    status: 'pending',
    estimatedCallbackTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30分後
    priority: 'normal'
  };
  
  // データベースに保存
  callbackReservations.push(reservation);
  await saveCallbackData();
  
  const twiml = new VoiceResponse();
  
  // 読み上げ用の番号フォーマット
  const readableNumber = callbackNumber.replace(/^\+81/, '0').replace(/(.{3})(.{4})(.{4})/, '$1-$2-$3');
  
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, `${readableNumber}にコールバックを予約いたしました。`);
  
  twiml.pause({ length: 1 });
  
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, '30分以内にお電話させていただきます。予約番号をお伝えします。');
  
  // 予約番号（最後の4桁）
  const reservationCode = callSid.slice(-4);
  
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, `予約番号は${reservationCode}です。お問い合わせの際にお使いください。`);
  
  twiml.pause({ length: 1 });
  
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, 'ありがとうございました。');
  
  twiml.hangup();
  
  // SMSで確認メッセージ送信（オプション）
  try {
    await client.messages.create({
      body: `コールバック予約完了\n番号: ${readableNumber}\n予約番号: ${reservationCode}\n30分以内にお電話いたします。`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: callbackNumber
    });
    
    console.log(`確認SMS送信完了: ${callbackNumber}`);
  } catch (error) {
    console.error(`SMS送信エラー: ${error.message}`);
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// コールバック実行（管理者用）
app.post('/execute-callback/:id', async (req, res) => {
  const reservationId = req.params.id;
  const reservation = callbackReservations.find(r => r.id === reservationId);
  
  if (!reservation) {
    return res.status(404).json({ error: 'Reservation not found' });
  }
  
  if (reservation.status !== 'pending') {
    return res.status(400).json({ error: 'Reservation already processed' });
  }
  
  try {
    // 実際のコールバック実行
    const call = await client.calls.create({
      url: `${req.protocol}://${req.get('host')}/callback-outbound?reservationId=${reservationId}`,
      to: reservation.callbackNumber,
      from: process.env.TWILIO_PHONE_NUMBER
    });
    
    // ステータス更新
    reservation.status = 'calling';
    reservation.callSid = call.sid;
    reservation.callbackStarted = new Date().toISOString();
    
    await saveCallbackData();
    
    console.log(`コールバック実行: ${reservation.callbackNumber}, CallSid: ${call.sid}`);
    
    res.json({
      success: true,
      callSid: call.sid,
      reservation: reservation
    });
    
  } catch (error) {
    console.error(`コールバック実行エラー: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// アウトバウンドコール用TwiML
app.post('/callback-outbound', (req, res) => {
  const reservationId = req.query.reservationId;
  const reservation = callbackReservations.find(r => r.id === reservationId);
  
  const twiml = new VoiceResponse();
  
  if (reservation) {
    twiml.say({
      voice: 'Polly.Mizuki',
      language: 'ja-JP'
    }, `お電話ありがとうございました。予約番号${reservation.id.slice(-4)}でコールバックをご依頼いただいたお客様でしょうか。`);
    
    twiml.pause({ length: 1 });
    
    twiml.say({
      voice: 'Polly.Mizuki',
      language: 'ja-JP'
    }, 'オペレーターにおつなぎします。少々お待ちください。');
    
    // 実際の環境ではオペレーターに転送
    // twiml.dial('+81312345678');
    
    twiml.play('https://demo.twilio.com/docs/classic.mp3');
    
  } else {
    twiml.say({
      voice: 'Polly.Mizuki',
      language: 'ja-JP'
    }, 'お電話ありがとうございます。カスタマーサポートです。');
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// 予約一覧API
app.get('/reservations', (req, res) => {
  const sortedReservations = callbackReservations
    .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
    .map(r => ({
      ...r,
      readableNumber: r.callbackNumber.replace(/^\+81/, '0').replace(/(.{3})(.{4})(.{4})/, '$1-$2-$3'),
      reservationCode: r.id.slice(-4)
    }));
  
  res.json({
    total: sortedReservations.length,
    pending: sortedReservations.filter(r => r.status === 'pending').length,
    reservations: sortedReservations
  });
});

// 管理画面
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>コールバック予約システム</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 1200px; 
          margin: 50px auto; 
          padding: 20px; 
        }
        .reservation {
          border: 1px solid #ddd;
          padding: 15px;
          margin: 10px 0;
          border-radius: 5px;
        }
        .pending { border-left: 4px solid #007bff; }
        .calling { border-left: 4px solid #28a745; }
        .completed { border-left: 4px solid #6c757d; }
        button {
          background: #007bff;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 3px;
          cursor: pointer;
        }
        button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
      </style>
    </head>
    <body>
      <h1>Voice課題2: コールバック予約システム</h1>
      
      <h2>テスト方法</h2>
      <ol>
        <li>Twilioコンソールでこのサーバーの <code>/voice</code> をWebhook URLに設定</li>
        <li>設定した電話番号に電話をかける</li>
        <li>メニューに従ってコールバック予約を行う</li>
        <li>下記の管理画面で予約状況を確認</li>
        <li>「コールバック実行」ボタンで実際にコールバックをテスト</li>
      </ol>
      
      <h2>予約一覧</h2>
      <div id="reservations">読み込み中...</div>
      
      <script>
        async function loadReservations() {
          try {
            const response = await fetch('/reservations');
            const data = await response.json();
            
            const container = document.getElementById('reservations');
            
            if (data.reservations.length === 0) {
              container.innerHTML = '<p>予約はありません</p>';
              return;
            }
            
            container.innerHTML = \`
              <p>総予約数: \${data.total}, 待機中: \${data.pending}</p>
              \${data.reservations.map(r => \`
                <div class="reservation \${r.status}">
                  <strong>予約番号: \${r.reservationCode}</strong><br>
                  コールバック先: \${r.readableNumber}<br>
                  依頼者: \${r.originalCaller}<br>
                  依頼時刻: \${new Date(r.requestedAt).toLocaleString('ja-JP')}<br>
                  ステータス: \${r.status}<br>
                  \${r.status === 'pending' ? 
                    \`<button onclick="executeCallback('\${r.id}')">コールバック実行</button>\` : 
                    ''
                  }
                </div>
              \`).join('')}
            \`;
          } catch (error) {
            document.getElementById('reservations').innerHTML = 
              '<p>データの読み込みに失敗しました</p>';
          }
        }
        
        async function executeCallback(id) {
          try {
            const response = await fetch(\`/execute-callback/\${id}\`, {
              method: 'POST'
            });
            
            if (response.ok) {
              alert('コールバックを開始しました');
              loadReservations();
            } else {
              alert('コールバックの実行に失敗しました');
            }
          } catch (error) {
            alert('エラーが発生しました');
          }
        }
        
        // 初回読み込み
        loadReservations();
        
        // 30秒ごとに自動更新
        setInterval(loadReservations, 30000);
      </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3101;

// 起動時にデータ読み込み
loadCallbackData().then(() => {
  app.listen(PORT, () => {
    console.log(`Voice Challenge 2 server running on port ${PORT}`);
    console.log(`Webhook URL: http://localhost:${PORT}/voice`);
    console.log(`Management interface: http://localhost:${PORT}/`);
    console.log(`Use ngrok to expose: npx ngrok http ${PORT}`);
  });
});