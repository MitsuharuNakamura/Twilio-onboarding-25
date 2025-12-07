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