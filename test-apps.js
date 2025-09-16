#!/usr/bin/env node

// アプリケーション動作テスト

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Twilio Workshop アプリケーション動作テスト');
console.log('=====================================');

// 環境変数チェック
const requiredEnvVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN', 
  'TWILIO_PHONE_NUMBER',
  'TO_PHONE_NUMBER'
];

let missingVars = [];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log('❌ 以下の環境変数が設定されていません:');
  missingVars.forEach(varName => console.log(`   - ${varName}`));
  console.log('\n.envファイルを設定してからテストを実行してください。');
  console.log('詳細はSETUP.mdを参照してください。');
  process.exit(1);
}

console.log('✅ 環境変数設定完了');

// テスト関数
function testApp(name, command, cwd) {
  return new Promise((resolve) => {
    console.log(`\n📋 ${name} テスト中...`);
    
    const child = spawn('node', [command], { 
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PORT: 3999 } // 競合しないポート
    });
    
    let output = '';
    let hasStarted = false;
    
    child.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('server running') || output.includes('処理完了')) {
        hasStarted = true;
        child.kill();
      }
    });
    
    child.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    // タイムアウト
    setTimeout(() => {
      if (!hasStarted) {
        child.kill();
      }
    }, 5000);
    
    child.on('close', (code) => {
      if (hasStarted || output.includes('処理完了') || code === 0) {
        console.log(`   ✅ ${name} 正常動作`);
        resolve(true);
      } else {
        console.log(`   ❌ ${name} エラー: ${output.slice(-200)}`);
        resolve(false);
      }
    });
  });
}

async function runTests() {
  const tests = [
    {
      name: 'SMS送信アプリ',
      command: 'index.js',
      cwd: join(__dirname, 'hello-sms')
    },
    {
      name: 'Voice通話アプリ',
      command: 'index.js', 
      cwd: join(__dirname, 'hello-voice')
    },
    {
      name: 'SMS自動返信アプリ',
      command: 'server.js',
      cwd: join(__dirname, 'mini-apps', 'sms-reply')
    },
    {
      name: '留守番電話アプリ',
      command: 'server.js',
      cwd: join(__dirname, 'mini-apps', 'voicemail')
    },
    {
      name: 'OTP認証アプリ',
      command: 'server.js',
      cwd: join(__dirname, 'mini-apps', 'verify-otp')
    }
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    const result = await testApp(test.name, test.command, test.cwd);
    if (result) passedTests++;
  }
  
  console.log('\n=====================================');
  console.log(`テスト結果: ${passedTests}/${tests.length} 個のアプリが正常動作`);
  
  if (passedTests === tests.length) {
    console.log('🎉 すべてのアプリケーションが正常に動作しています！');
  } else {
    console.log('⚠️  一部のアプリケーションでエラーが発生しました。');
    console.log('   詳細はSETUP.mdのトラブルシューティングを参照してください。');
  }
  
  console.log('\n次のステップ:');
  console.log('1. 各アプリを個別に起動してテスト');
  console.log('2. ngrokでWebhook URLを公開');
  console.log('3. TwilioコンソールでWebhook設定');
  console.log('\n詳細な手順はSETUP.mdを参照してください。');
}