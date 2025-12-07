// hello-sendgrid/index.js - SendGrid API でメール送信
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

// API Key の設定
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail() {
  const msg = {
    to: process.env.TO_EMAIL,
    from: process.env.FROM_EMAIL, // 認証済みの送信元アドレス
    subject: 'SendGrid ワークショップ - テストメール',
    text: 'こんにちは！SendGrid API からのメール送信テストです。',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1A82E2;">SendGrid ワークショップ</h1>
        <p>こんにちは！</p>
        <p>SendGrid API からのメール送信テストです。</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          このメールは Twilio SendGrid ワークショップから送信されました。
        </p>
      </div>
    `
  };

  try {
    const response = await sgMail.send(msg);

    console.log('✅ メール送信成功！');
    console.log(`ステータスコード: ${response[0].statusCode}`);
    console.log(`Message ID: ${response[0].headers['x-message-id']}`);
    console.log(`送信先: ${msg.to}`);
    console.log(`件名: ${msg.subject}`);

    return response;
  } catch (error) {
    console.error('❌ メール送信失敗');

    if (error.response) {
      const { statusCode, body } = error.response;
      console.error(`ステータスコード: ${statusCode}`);
      console.error(`エラー詳細:`, body);

      // よくあるエラーの解説
      switch (statusCode) {
        case 401:
          console.error('\n💡 API Key が無効です。SendGrid コンソールで確認してください。');
          break;
        case 403:
          console.error('\n💡 送信元アドレスが認証されていません。Domain Authentication または Single Sender Verification を確認してください。');
          break;
        case 429:
          console.error('\n💡 レート制限に達しました。しばらく待ってから再試行してください。');
          break;
      }
    }

    throw error;
  }
}

// 環境変数チェック
function checkEnv() {
  const required = ['SENDGRID_API_KEY', 'FROM_EMAIL', 'TO_EMAIL'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ 環境変数が設定されていません:');
    missing.forEach(key => console.error(`  - ${key}`));
    console.error('\n.env ファイルを確認してください。');
    process.exit(1);
  }
}

// 実行
console.log('📧 SendGrid メール送信を開始します...\n');
checkEnv();
sendEmail()
  .then(() => {
    console.log('\n処理完了');
  })
  .catch(() => {
    process.exit(1);
  });
