#!/usr/bin/env node

// SMS課題2: SMS送信履歴の管理

import twilio from 'twilio';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import { existsSync } from 'fs';

dotenv.config({ path: '../../.env' });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// 履歴保存ファイル
const HISTORY_FILE = 'sms-history.json';

// SMS履歴管理クラス
class SMSHistoryManager {
  constructor() {
    this.history = [];
    this.loadHistory();
  }
  
  // 履歴をファイルから読み込み
  async loadHistory() {
    try {
      if (existsSync(HISTORY_FILE)) {
        const data = await fs.readFile(HISTORY_FILE, 'utf8');
        this.history = JSON.parse(data);
        console.log(`📋 既存の履歴 ${this.history.length} 件を読み込みました`);
      }
    } catch (error) {
      console.log('📋 新しい履歴ファイルを作成します');
      this.history = [];
    }
  }
  
  // 履歴をファイルに保存
  async saveHistory() {
    try {
      await fs.writeFile(HISTORY_FILE, JSON.stringify(this.history, null, 2));
      console.log(`💾 履歴を ${HISTORY_FILE} に保存しました`);
    } catch (error) {
      console.error('履歴保存エラー:', error.message);
    }
  }
  
  // SMS送信（履歴付き）
  async sendSMSWithHistory(to, body) {
    const sendTime = new Date();
    
    try {
      console.log(`📱 SMS送信中: ${to}`);
      
      const message = await client.messages.create({
        body: body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });
      
      // 成功時の履歴記録
      const historyEntry = {
        id: message.sid,
        to: to,
        body: body,
        status: message.status,
        dateSent: sendTime.toISOString(),
        dateCreated: message.dateCreated,
        price: message.price,
        direction: 'outbound',
        success: true
      };
      
      this.history.push(historyEntry);
      console.log(`✅ 送信成功: ${message.sid}`);
      
      return message;
      
    } catch (error) {
      // エラー時の履歴記録
      const historyEntry = {
        id: null,
        to: to,
        body: body,
        status: 'failed',
        dateSent: sendTime.toISOString(),
        error: error.message,
        errorCode: error.code,
        direction: 'outbound',
        success: false
      };
      
      this.history.push(historyEntry);
      console.log(`❌ 送信失敗: ${error.message}`);
      
      throw error;
    }
  }
  
  // 履歴表示
  displayHistory(limit = 10) {
    console.log('\n=== SMS送信履歴 ===');
    
    if (this.history.length === 0) {
      console.log('履歴がありません');
      return;
    }
    
    // 最新順にソート
    const sortedHistory = this.history
      .sort((a, b) => new Date(b.dateSent) - new Date(a.dateSent))
      .slice(0, limit);
    
    sortedHistory.forEach((entry, index) => {
      console.log(`\n${index + 1}. ${new Date(entry.dateSent).toLocaleString('ja-JP')}`);
      console.log(`   宛先: ${entry.to}`);
      console.log(`   メッセージ: ${entry.body.substring(0, 50)}${entry.body.length > 50 ? '...' : ''}`);
      console.log(`   ステータス: ${entry.status} ${entry.success ? '✅' : '❌'}`);
      
      if (entry.success) {
        console.log(`   SID: ${entry.id}`);
        if (entry.price) console.log(`   料金: ${entry.price}`);
      } else {
        console.log(`   エラー: ${entry.error}`);
        if (entry.errorCode) console.log(`   エラーコード: ${entry.errorCode}`);
      }
    });
    
    if (this.history.length > limit) {
      console.log(`\n... 他 ${this.history.length - limit} 件`);
    }
  }
  
  // 統計情報表示
  displayStats() {
    console.log('\n=== 統計情報 ===');
    
    const total = this.history.length;
    const successful = this.history.filter(h => h.success).length;
    const failed = total - successful;
    
    console.log(`総送信数: ${total}`);
    console.log(`成功: ${successful} (${total > 0 ? Math.round(successful/total*100) : 0}%)`);
    console.log(`失敗: ${failed} (${total > 0 ? Math.round(failed/total*100) : 0}%)`);
    
    if (total > 0) {
      const firstSent = new Date(Math.min(...this.history.map(h => new Date(h.dateSent))));
      const lastSent = new Date(Math.max(...this.history.map(h => new Date(h.dateSent))));
      
      console.log(`期間: ${firstSent.toLocaleDateString('ja-JP')} 〜 ${lastSent.toLocaleDateString('ja-JP')}`);
    }
    
    // よく送信する宛先
    const destinations = {};
    this.history.forEach(h => {
      destinations[h.to] = (destinations[h.to] || 0) + 1;
    });
    
    const topDestinations = Object.entries(destinations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    if (topDestinations.length > 0) {
      console.log('\nよく送信する宛先:');
      topDestinations.forEach(([dest, count]) => {
        console.log(`  ${dest}: ${count}回`);
      });
    }
  }
  
  // 履歴をCSVでエクスポート
  async exportToCSV(filename = 'sms-history.csv') {
    const csvHeader = 'Date,To,Message,Status,Success,SID,Error\n';
    const csvRows = this.history.map(entry => {
      const date = new Date(entry.dateSent).toLocaleString('ja-JP');
      const message = `"${entry.body.replace(/"/g, '""')}"`;
      const error = entry.error ? `"${entry.error.replace(/"/g, '""')}"` : '';
      
      return `${date},${entry.to},${message},${entry.status},${entry.success},${entry.id || ''},${error}`;
    }).join('\n');
    
    await fs.writeFile(filename, csvHeader + csvRows);
    console.log(`📊 履歴を ${filename} にエクスポートしました`);
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
  
  console.log('=== SMS課題2: SMS送信履歴の管理 ===\n');
  
  const historyManager = new SMSHistoryManager();
  await historyManager.loadHistory();
  
  // テストメッセージ
  const testMessages = [
    'テストメッセージ1: 履歴管理機能のテストです',
    'テストメッセージ2: 現在時刻は ' + new Date().toLocaleString('ja-JP'),
    'テストメッセージ3: SMS履歴管理システムが正常に動作しています'
  ];
  
  // 複数のSMSを送信してテスト
  for (let i = 0; i < testMessages.length; i++) {
    try {
      await historyManager.sendSMSWithHistory(
        process.env.TO_PHONE_NUMBER,
        testMessages[i]
      );
      
      // 送信間隔を空ける
      if (i < testMessages.length - 1) {
        console.log('⏳ 1秒待機中...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.log('エラーが発生しましたが、履歴には記録されました');
    }
  }
  
  // 履歴を保存
  await historyManager.saveHistory();
  
  // 結果表示
  historyManager.displayHistory();
  historyManager.displayStats();
  
  // CSVエクスポート
  await historyManager.exportToCSV();
  
  console.log('\n=== 課題完了 ===');
  console.log('履歴管理機能が正常に動作しました！');
  console.log(`履歴ファイル: ${HISTORY_FILE}`);
  console.log('CSVファイル: sms-history.csv');
}

// コマンドライン引数で動作モード変更
const args = process.argv.slice(2);
if (args.includes('--history-only')) {
  // 履歴表示のみ
  (async () => {
    const manager = new SMSHistoryManager();
    await manager.loadHistory();
    manager.displayHistory(20);
    manager.displayStats();
  })();
} else if (args.includes('--export')) {
  // エクスポートのみ
  (async () => {
    const manager = new SMSHistoryManager();
    await manager.loadHistory();
    await manager.exportToCSV();
  })();
} else {
  // 通常実行
  main().catch(console.error);
}