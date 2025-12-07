// check-status.js
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function checkStatus(messageSid) {
try {
const message = await client.messages(messageSid).fetch();

console.log('=== SMS送信ステータス詳細 ===');
console.log(`SID: ${message.sid}`);
console.log(`送信先: ${message.to}`);
console.log(`送信元: ${message.from}`);
console.log(`ステータス: ${message.status}`);
console.log(`メッセージ: ${message.body}`);
console.log(`送信日時: ${message.dateCreated}`);
console.log(`更新日時: ${message.dateUpdated}`);
console.log(`送信完了日時: ${message.dateSent || '未送信'}`);
console.log(`料金: ${message.price || '未確定'} ${message.priceUnit || ''}`);
console.log(`メディア数: ${message.numMedia}`);

if (message.errorCode) {
console.log(`エラーコード: ${message.errorCode}`);
console.log(`エラーメッセージ: ${message.errorMessage}`);
}

return message;
} catch (error) {
console.error('ステータス確認エラー:', error.message);
throw error;
}
}

// 最近のメッセージ一覧を取得して確認
async function checkRecentMessages(limit = 5) {
try {
console.log(`最近の${limit}件のメッセージステータスを確認中...`);

const messages = await client.messages.list({ limit: limit });

for (const message of messages) {
console.log('\n' + '='.repeat(50));
await checkStatus(message.sid);
}
} catch (error) {
console.error('メッセージ一覧取得エラー:', error.message);
}
}

// メイン実行部分
async function main() {
// 環境変数チェック
if (!accountSid || !authToken) {
console.error('Twilio認証情報が設定されていません');
process.exit(1);
}

// コマンドライン引数チェック
const args = process.argv.slice(2);

if (args.length > 0) {
// 特定のメッセージSIDを確認
const messageSid = args[0];
console.log(`メッセージSID ${messageSid} のステータスを確認中...`);
await checkStatus(messageSid);
} else {
// 最近のメッセージを確認
await checkRecentMessages();
}
}

main().catch(console.error);