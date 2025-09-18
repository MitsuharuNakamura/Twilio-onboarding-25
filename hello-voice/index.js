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


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Voice server running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/voice`);
});