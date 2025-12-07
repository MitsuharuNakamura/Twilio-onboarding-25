// template-send.js - Dynamic Template を使ったメール送信
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Dynamic Template を使ってメールを送信
 *
 * テンプレート作成手順:
 * 1. SendGrid コンソール → Email API → Dynamic Templates
 * 2. "Create a Dynamic Template" をクリック
 * 3. テンプレート名を入力（例: "Welcome Email"）
 * 4. "Add Version" でバージョンを追加
 * 5. Design Editor または Code Editor でテンプレートを作成
 *
 * テンプレート例（Code Editor）:
 * ```html
 * <html>
 *   <body>
 *     <h1>こんにちは、{{first_name}} さん！</h1>
 *     <p>{{company_name}} へようこそ。</p>
 *     <p>あなたのアカウントが作成されました。</p>
 *     <a href="{{login_url}}">ログインする</a>
 *   </body>
 * </html>
 * ```
 */
async function sendWithTemplate() {
  const msg = {
    to: process.env.TO_EMAIL,
    from: process.env.FROM_EMAIL,
    templateId: process.env.SENDGRID_TEMPLATE_ID, // d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

    // Dynamic Template Data（テンプレート内の {{変数名}} に対応）
    dynamicTemplateData: {
      first_name: '太郎',
      last_name: '田中',
      company_name: 'Twilio Workshop',
      login_url: 'https://example.com/login',
      order_id: 'ORD-12345',
      order_date: new Date().toLocaleDateString('ja-JP'),
      items: [
        { name: '商品A', price: 1000, quantity: 2 },
        { name: '商品B', price: 2500, quantity: 1 }
      ],
      total_amount: 4500,
      support_email: 'support@example.com'
    }
  };

  try {
    const response = await sgMail.send(msg);

    console.log('✅ テンプレートメール送信成功！');
    console.log(`ステータスコード: ${response[0].statusCode}`);
    console.log(`Message ID: ${response[0].headers['x-message-id']}`);
    console.log(`テンプレートID: ${msg.templateId}`);
    console.log(`送信先: ${msg.to}`);

    return response;
  } catch (error) {
    console.error('❌ メール送信失敗');

    if (error.response) {
      console.error(`ステータスコード: ${error.response.statusCode}`);
      console.error(`エラー詳細:`, error.response.body);

      if (error.response.statusCode === 400) {
        console.error('\n💡 テンプレートIDが無効か、必須の変数が不足している可能性があります。');
      }
    }

    throw error;
  }
}

/**
 * 複数宛先への一斉送信（パーソナライズ付き）
 */
async function sendBulkWithTemplate() {
  // 受信者リスト（それぞれ異なるデータ）
  const recipients = [
    {
      to: process.env.TO_EMAIL,
      dynamicTemplateData: {
        first_name: '太郎',
        company_name: 'ABC株式会社',
        custom_message: '本日のセミナーにご参加いただきありがとうございました。'
      }
    },
    // 追加の受信者があればここに追加
    // {
    //   to: 'user2@example.com',
    //   dynamicTemplateData: {
    //     first_name: '花子',
    //     company_name: 'XYZ株式会社',
    //     custom_message: 'いつもご利用ありがとうございます。'
    //   }
    // }
  ];

  // 各メッセージを生成
  const messages = recipients.map(recipient => ({
    to: recipient.to,
    from: process.env.FROM_EMAIL,
    templateId: process.env.SENDGRID_TEMPLATE_ID,
    dynamicTemplateData: recipient.dynamicTemplateData
  }));

  try {
    // 複数メールを一括送信
    const responses = await sgMail.send(messages);

    console.log(`✅ ${messages.length}件のメール送信成功！`);
    responses.forEach((response, i) => {
      console.log(`  ${i + 1}. ${recipients[i].to} -> ${response[0].statusCode}`);
    });

    return responses;
  } catch (error) {
    console.error('❌ 一括送信失敗:', error.message);
    throw error;
  }
}

// 環境変数チェック
function checkEnv() {
  const required = ['SENDGRID_API_KEY', 'FROM_EMAIL', 'TO_EMAIL', 'SENDGRID_TEMPLATE_ID'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ 環境変数が設定されていません:');
    missing.forEach(key => console.error(`  - ${key}`));

    if (missing.includes('SENDGRID_TEMPLATE_ID')) {
      console.error('\n💡 SENDGRID_TEMPLATE_ID の取得方法:');
      console.error('   1. SendGrid コンソール → Email API → Dynamic Templates');
      console.error('   2. テンプレートを選択');
      console.error('   3. Template ID (d-xxxxxxxx...) をコピー');
    }

    process.exit(1);
  }
}

// メイン実行
async function main() {
  console.log('📧 Dynamic Template メール送信を開始します...\n');
  checkEnv();

  // コマンドライン引数で送信モードを選択
  const mode = process.argv[2] || 'single';

  if (mode === 'bulk') {
    await sendBulkWithTemplate();
  } else {
    await sendWithTemplate();
  }

  console.log('\n処理完了');
}

main().catch(() => process.exit(1));
