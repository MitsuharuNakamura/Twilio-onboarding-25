import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function sendSMS() {
  try {
    const message = await client.messages.create({
      body: 'こんにちは。Twilio ワークショップです。',
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.TO_PHONE_NUMBER
    });

    console.log(`SMS送信成功！`);
    console.log(`メッセージSID: ${message.sid}`);
    console.log(`ステータス: ${message.status}`);
    console.log(`送信先: ${message.to}`);
    console.log(`送信日時: ${message.dateCreated}`);
    
    return message;
  } catch (error) {
    console.error('SMS送信失敗:', error.message);
    
    if (error.code) {
      console.error(`エラーコード: ${error.code}`);
      
      switch(error.code) {
        case 21211:
          console.error('無効な電話番号です。電話番号の形式を確認してください。');
          break;
        case 21608:
          console.error('未検証の電話番号への送信はできません。Twilioコンソールで番号を検証してください。');
          break;
        case 21610:
          console.error('送信先の番号がブロックリストに登録されています。');
          break;
        case 20003:
          console.error('認証エラー。Account SIDとAuth Tokenを確認してください。');
          break;
        default:
          console.error('詳細はTwilioのエラーコードドキュメントを参照してください。');
      }
    }
    
    throw error;
  }
}

// 環境変数チェック
if (!accountSid || !authToken || !process.env.TWILIO_PHONE_NUMBER || !process.env.TO_PHONE_NUMBER) {
  console.error('環境変数が設定されていません。.envファイルを確認してください。');
  console.error('必要な環境変数:');
  console.error('  - TWILIO_ACCOUNT_SID');
  console.error('  - TWILIO_AUTH_TOKEN');
  console.error('  - TWILIO_PHONE_NUMBER');
  console.error('  - TO_PHONE_NUMBER');
  process.exit(1);
}

// 実行
console.log('SMS送信を開始します...');
sendSMS()
  .then(() => {
    console.log('処理完了');
  })
  .catch(() => {
    process.exit(1);
  });