#!/usr/bin/env node

// SMS課題1: 複数宛先への一斉送信

import twilio from 'twilio';
import dotenv from 'dotenv';

// 環境変数読み込み（プロジェクトルートの.envを読む）
dotenv.config({ path: '../../.env' });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// 送信先リスト（実際のテストでは自分の番号に変更してください）
const recipients = [
  process.env.TO_PHONE_NUMBER, // メインのテスト番号
  // 追加の番号がある場合はここに追加
  // '+81901234568',
  // '+81901234569'
];

// 一斉送信機能
async function sendBulkSMS(phoneNumbers, message) {
  console.log(`${phoneNumbers.length}件の番号に一斉送信を開始します...`);
  
  try {
    const results = await Promise.all(
      phoneNumbers.map(async (number, index) => {
        console.log(`${index + 1}/${phoneNumbers.length}: ${number} に送信中...`);
        
        return await client.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: number
        });
      })
    );
    
    console.log('\n=== 送信結果 ===');
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${phoneNumbers[index]}`);
      console.log(`   SID: ${result.sid}`);
      console.log(`   ステータス: ${result.status}`);
      console.log(`   送信日時: ${result.dateCreated}`);
      console.log('');
    });
    
    const successful = results.filter(r => r.status !== 'failed').length;
    console.log(`送信完了: ${successful}/${results.length} 件成功`);
    
    return results;
  } catch (error) {
    console.error('一斉送信でエラーが発生しました:', error.message);
    throw error;
  }
}

// エラーハンドリング付き送信
async function safeBulkSend(phoneNumbers, message) {
  const results = [];
  
  for (let i = 0; i < phoneNumbers.length; i++) {
    const number = phoneNumbers[i];
    console.log(`${i + 1}/${phoneNumbers.length}: ${number} に送信中...`);
    
    try {
      const result = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: number
      });
      
      results.push({
        number: number,
        success: true,
        sid: result.sid,
        status: result.status,
        dateSent: result.dateCreated
      });
      
      console.log(`   ✅ 成功: ${result.sid}`);
      
    } catch (error) {
      results.push({
        number: number,
        success: false,
        error: error.message,
        errorCode: error.code
      });
      
      console.log(`   ❌ 失敗: ${error.message}`);
    }
    
    // レート制限対策で1秒待機
    if (i < phoneNumbers.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

// メイン実行部分
async function main() {
  // 環境変数チェック
  if (!accountSid || !authToken || !process.env.TWILIO_PHONE_NUMBER) {
    console.error('❌ Twilio認証情報が設定されていません');
    console.error('プロジェクトルートの.envファイルを確認してください');
    process.exit(1);
  }
  
  if (!process.env.TO_PHONE_NUMBER) {
    console.error('❌ TO_PHONE_NUMBER が設定されていません');
    console.error('.envファイルにテスト用電話番号を設定してください');
    process.exit(1);
  }
  
  console.log('=== SMS課題1: 複数宛先への一斉送信 ===\n');
  
  const message = `
[一斉送信テスト]
Twilio Workshop 2025からのお知らせです。
一斉送信機能のテストを実行しています。

送信時刻: ${new Date().toLocaleString('ja-JP')}
`.trim();
  
  console.log('送信メッセージ:');
  console.log(message);
  console.log('');
  
  try {
    // 方法1: Promise.allを使った並行送信（高速だがレート制限に注意）
    console.log('🚀 方法1: 並行送信でテスト');
    const results1 = await sendBulkSMS(recipients, message + '\n[並行送信]');
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 方法2: 順次送信（安全だが時間がかかる）
    console.log('🐌 方法2: 順次送信でテスト');
    const results2 = await safeBulkSend(recipients, message + '\n[順次送信]');
    
    console.log('\n=== 最終結果 ===');
    console.log(`並行送信: ${results1.length} 件送信`);
    console.log(`順次送信: ${results2.filter(r => r.success).length}/${results2.length} 件成功`);
    
  } catch (error) {
    console.error('❌ 送信処理でエラーが発生しました:', error.message);
    process.exit(1);
  }
}

// コマンドライン引数での設定変更
if (process.argv.length > 2) {
  const customNumbers = process.argv.slice(2);
  recipients.length = 0; // 配列をクリア
  recipients.push(...customNumbers);
  console.log('カスタム送信先を設定しました:', customNumbers);
}

// 実行
main().catch(console.error);