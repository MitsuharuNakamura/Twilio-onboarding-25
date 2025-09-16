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