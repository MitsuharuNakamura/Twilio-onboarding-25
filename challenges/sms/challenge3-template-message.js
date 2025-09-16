#!/usr/bin/env node

// SMS課題3: テンプレートメッセージシステム

import twilio from 'twilio';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '../../.env' });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// 顧客データのサンプル
const sampleCustomers = [
  {
    id: 1,
    name: '田中太郎',
    phone: process.env.TO_PHONE_NUMBER,
    appointmentDate: '2025年1月20日 14:00',
    service: 'ヘアカット',
    location: 'Twilio Beauty Salon 渋谷店',
    stylist: '山田美容師',
    cancelUrl: 'https://example.com/cancel/abc123'
  },
  {
    id: 2,
    name: '佐藤花子',
    phone: process.env.TO_PHONE_NUMBER, // 同じ番号でテスト
    appointmentDate: '2025年1月21日 10:30',
    service: 'カラーリング + カット',
    location: 'Twilio Beauty Salon 新宿店',
    stylist: '鈴木スタイリスト',
    cancelUrl: 'https://example.com/cancel/def456'
  }
];

// テンプレートメッセージクラス
class MessageTemplateSystem {
  constructor() {
    this.templates = {
      appointment_confirmation: this.appointmentTemplate,
      appointment_reminder: this.reminderTemplate,
      appointment_cancelled: this.cancellationTemplate,
      special_offer: this.offerTemplate,
      birthday_greeting: this.birthdayTemplate
    };
  }
  
  // 予約確認テンプレート
  appointmentTemplate(customer) {
    const cancelCode = this.generateCancelCode(customer.id);
    
    return `${customer.name}様

ご予約確認のお知らせです。

【予約詳細】
日時: ${customer.appointmentDate}
サービス: ${customer.service}
担当: ${customer.stylist}
場所: ${customer.location}

【変更・キャンセル】
${customer.cancelUrl}
またはキャンセルコード「${cancelCode}」を返信

ご質問がございましたらお気軽にお問い合わせください。

Twilio Beauty Salon`;
  }
  
  // リマインダーテンプレート
  reminderTemplate(customer) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return `${customer.name}様

明日のご予約のリマインダーです。

日時: ${customer.appointmentDate}
サービス: ${customer.service}
場所: ${customer.location}

遅れる場合は事前にご連絡ください。
お待ちしております！

Twilio Beauty Salon`;
  }
  
  // キャンセル確認テンプレート
  cancellationTemplate(customer) {
    return `${customer.name}様

以下のご予約をキャンセルいたしました。

日時: ${customer.appointmentDate}
サービス: ${customer.service}

またのご利用をお待ちしております。

Twilio Beauty Salon`;
  }
  
  // 特別オファーテンプレート
  offerTemplate(customer) {
    const offer = this.getPersonalizedOffer(customer);
    
    return `${customer.name}様

【特別オファー】

${offer.title}
${offer.description}

期間: ${offer.validUntil}まで
コード: ${offer.code}

ご予約: ${customer.location}
03-1234-5678

Twilio Beauty Salon`;
  }
  
  // 誕生日メッセージテンプレート
  birthdayTemplate(customer) {
    return `${customer.name}様

お誕生日おめでとうございます！

特別なお誕生日を記念して、
次回ご利用時に使える
20%OFFクーポンをプレゼント！

クーポンコード: BIRTHDAY2025

有効期限: 誕生月末まで

素敵な一年をお過ごしください。

Twilio Beauty Salon`;
  }
  
  // キャンセルコード生成
  generateCancelCode(customerId) {
    const hash = crypto.createHash('md5').update(`${customerId}-${Date.now()}`).digest('hex');
    return hash.substring(0, 6).toUpperCase();
  }
  
  // パーソナライズされたオファー生成
  getPersonalizedOffer(customer) {
    const offers = {
      'ヘアカット': {
        title: 'リピーター様限定！ヘアケアセット',
        description: 'シャンプー＋トリートメント＋ヘアカットのセットを特別価格で！',
        code: 'HAIRCARE20',
        validUntil: '今月末'
      },
      'カラーリング': {
        title: 'カラーチェンジキャンペーン',
        description: '季節の変わり目に新しいカラーはいかがですか？カラー＋トリートメント30%OFF',
        code: 'COLOR30',
        validUntil: '来月15日'
      }
    };
    
    const serviceKey = Object.keys(offers).find(key => customer.service.includes(key));
    return offers[serviceKey] || offers['ヘアカット'];
  }
  
  // メッセージ生成
  generateMessage(templateType, customer) {
    const template = this.templates[templateType];
    if (!template) {
      throw new Error(`Unknown template type: ${templateType}`);
    }
    
    return template.call(this, customer);
  }
  
  // SMS送信
  async sendTemplateMessage(templateType, customer) {
    try {
      const message = this.generateMessage(templateType, customer);
      
      console.log(`📱 ${templateType} メッセージを ${customer.name}様 (${customer.phone}) に送信中...`);
      console.log('--- メッセージ内容 ---');
      console.log(message);
      console.log('--- 送信中 ---');
      
      const result = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: customer.phone,
        statusCallback: 'https://your-app.com/sms-status' // 実際のWebhook URLに変更
      });
      
      console.log(`✅ 送信成功: ${result.sid}`);
      console.log(`   ステータス: ${result.status}`);
      console.log('');
      
      return result;
      
    } catch (error) {
      console.error(`❌ 送信失敗 (${customer.name}様): ${error.message}`);
      throw error;
    }
  }
  
  // 一括送信
  async sendBulkTemplateMessages(templateType, customers) {
    console.log(`=== ${templateType} メッセージ一括送信 ===`);
    console.log(`対象: ${customers.length} 名\n`);
    
    const results = [];
    
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      
      try {
        const result = await this.sendTemplateMessage(templateType, customer);
        results.push({ customer, result, success: true });
        
      } catch (error) {
        results.push({ customer, error, success: false });
      }
      
      // レート制限対策
      if (i < customers.length - 1) {
        console.log('⏳ 2秒待機中...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // 結果サマリー
    const successful = results.filter(r => r.success).length;
    console.log('=== 送信完了 ===');
    console.log(`成功: ${successful}/${customers.length}`);
    
    return results;
  }
}

// デモ実行関数
async function demoTemplateSystem() {
  console.log('=== SMS課題3: テンプレートメッセージシステム ===\n');
  
  const templateSystem = new MessageTemplateSystem();
  
  // 各テンプレートのデモ
  const templateTypes = [
    'appointment_confirmation',
    'appointment_reminder', 
    'special_offer'
  ];
  
  for (const templateType of templateTypes) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📋 ${templateType.toUpperCase()} テンプレートのテスト`);
    console.log('='.repeat(50));
    
    try {
      // サンプル顧客の最初の人にテスト送信
      await templateSystem.sendTemplateMessage(templateType, sampleCustomers[0]);
      
      console.log('✅ テンプレート送信成功\n');
      
    } catch (error) {
      console.error(`❌ テンプレート送信失敗: ${error.message}\n`);
    }
    
    // 送信間隔を空ける
    if (templateType !== templateTypes[templateTypes.length - 1]) {
      console.log('⏳ 3秒待機中...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 全テンプレートテスト完了');
  console.log('='.repeat(50));
}

// 個別テンプレート実行
async function runSingleTemplate(templateType) {
  const templateSystem = new MessageTemplateSystem();
  
  console.log(`=== ${templateType} テンプレート個別実行 ===\n`);
  
  try {
    await templateSystem.sendTemplateMessage(templateType, sampleCustomers[0]);
  } catch (error) {
    console.error('実行エラー:', error.message);
    process.exit(1);
  }
}

// メイン処理
async function main() {
  // 環境変数チェック
  if (!accountSid || !authToken || !process.env.TWILIO_PHONE_NUMBER || !process.env.TO_PHONE_NUMBER) {
    console.error('❌ 環境変数が設定されていません');
    console.error('プロジェクトルートの.envファイルを確認してください');
    process.exit(1);
  }
  
  // コマンドライン引数チェック
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    const templateType = args[0];
    await runSingleTemplate(templateType);
  } else {
    await demoTemplateSystem();
  }
  
  console.log('\n🎉 課題3完了！');
  console.log('テンプレートメッセージシステムが正常に動作しました。');
}

// 使用方法の表示
function showUsage() {
  console.log('使用方法:');
  console.log('  node challenge3-template-message.js                    # 全テンプレートテスト');
  console.log('  node challenge3-template-message.js appointment_confirmation # 個別テンプレート');
  console.log('');
  console.log('利用可能なテンプレート:');
  console.log('  - appointment_confirmation  (予約確認)');
  console.log('  - appointment_reminder      (リマインダー)');
  console.log('  - appointment_cancelled     (キャンセル確認)');
  console.log('  - special_offer            (特別オファー)');
  console.log('  - birthday_greeting        (誕生日メッセージ)');
}

// ヘルプオプション
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showUsage();
} else {
  main().catch(console.error);
}