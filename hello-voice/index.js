import express from 'express';
import twilio from 'twilio';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const VoiceResponse = twilio.twiml.VoiceResponse;

// 基本的な音声応答
app.post('/voice', (req, res) => {
  console.log('着信を受信:', req.body.From);
  
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
  
  twiml.pause({ length: 1 });
  
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, 'ご用件がございましたら、オペレーターにおつなぎします。');
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// IVR（自動音声応答）システム
app.post('/ivr', (req, res) => {
  console.log('IVR開始:', req.body.From);
  
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

// IVR入力処理
app.post('/ivr/handle', (req, res) => {
  const twiml = new VoiceResponse();
  const digit = req.body.Digits;
  
  console.log(`入力された番号: ${digit}`);
  
  switch(digit) {
    case '1':
      twiml.say({
        voice: 'Polly.Mizuki',
        language: 'ja-JP'
      }, '営業部門におつなぎします。少々お待ちください。');
      twiml.play('https://demo.twilio.com/docs/classic.mp3');
      break;
    
    case '2':
      twiml.say({
        voice: 'Polly.Mizuki',
        language: 'ja-JP'
      }, 'サポート部門におつなぎします。少々お待ちください。');
      twiml.play('https://demo.twilio.com/docs/classic.mp3');
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

// 録音機能
app.post('/record', (req, res) => {
  console.log('録音開始:', req.body.From);
  
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
  
  console.log(`録音完了`);
  console.log(`  録音URL: ${recordingUrl}`);
  console.log(`  録音時間: ${duration}秒`);
  
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, 'メッセージを録音しました。ありがとうございました。');
  
  twiml.hangup();
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({
    status: 'running',
    service: 'Twilio Voice Demo',
    timestamp: new Date().toISOString()
  });
});

// ルートパス
app.get('/', (req, res) => {
  res.send(`
    <h1>Twilio Voice Demo Server</h1>
    <p>Available endpoints:</p>
    <ul>
      <li>POST /voice - Basic voice response</li>
      <li>POST /ivr - Interactive Voice Response</li>
      <li>POST /record - Voice recording</li>
      <li>GET /health - Health check</li>
    </ul>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Voice server running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/voice`);
  console.log(`Use ngrok to expose this server: npx ngrok http ${PORT}`);
});