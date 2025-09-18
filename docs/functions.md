---
id: functions
title: Twilio Functions & Assets
sidebar_label: Functions
---

# Twilio Functions & Assets

サーバーレス環境でTwilioアプリケーションを実行する方法を学びます。

## このセクションのゴール

- Twilio CLIのインストールと設定
- Functionsプロジェクトの作成とデプロイ
- Assetsを使った静的ファイルのホスティング
- 環境変数とDependenciesの管理

## Twilio CLIのインストール

### macOS (Homebrew)

```bash
brew tap twilio/brew && brew install twilio
```

### Windows (Scoop)

```bash
scoop bucket add twilio-scoop https://github.com/twilio/scoop-twilio-cli
scoop install twilio
```

### npm (全OS共通)

```bash
npm install -g twilio-cli
```

### CLIの初期設定

```bash
# Twilioアカウントにログイン
twilio login

# アカウントSIDとAuth Tokenを入力
# (Twilioコンソールから取得可能)
```

### Serverlessプラグインのインストール

```bash
# Serverlessツールキットをインストール
twilio plugins:install @twilio-labs/plugin-serverless
```

## Functionsプロジェクトの作成

### 新規プロジェクトの作成

```bash
# プロジェクトを作成
twilio serverless:init my-functions --empty

# プロジェクトディレクトリに移動
cd my-functions
```

### プロジェクト構造

```
my-functions/
├── .env                 # 環境変数
├── .twilioserverlessrc  # 設定ファイル
├── package.json         # 依存関係
├── functions/           # Function格納ディレクトリ
│   └── hello.js        # サンプルFunction
└── assets/             # 静的ファイル格納ディレクトリ
    └── index.html      # サンプルHTML
```

## 基本的なFunctionの作成

### SMS返信Function

`functions/sms-reply.js`:

```javascript
// Twilio Functionsは自動的にcontextとeventを提供
exports.handler = function(context, event, callback) {
  // TwiMLを作成
  const twiml = new Twilio.twiml.MessagingResponse();

  // 受信したメッセージを取得
  const incomingMsg = event.Body || '';

  // 返信メッセージを作成
  if (incomingMsg.toLowerCase().includes('hello')) {
    twiml.message('こんにちは！Twilio Functionsから返信しています。');
  } else {
    twiml.message(`あなたのメッセージ: "${incomingMsg}" を受信しました。`);
  }

  // レスポンスを返す
  callback(null, twiml);
};
```

### 音声応答Function

`functions/voice-response.js`:

```javascript
exports.handler = function(context, event, callback) {
  // VoiceResponseを作成
  const twiml = new Twilio.twiml.VoiceResponse();

  // 発信者番号を取得
  const from = event.From || 'Unknown';

  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, `お電話ありがとうございます。あなたの番号は ${from} ですね。`);

  twiml.pause({ length: 1 });

  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, 'Twilio Functionsから応答しています。');

  callback(null, twiml);
};
```

### Protected Function (認証あり)

`functions/admin/dashboard.protected.js`:

```javascript
// .protected.js は認証が必要なFunction
exports.handler = function(context, event, callback) {
  // 環境変数へのアクセス
  const accountSid = context.ACCOUNT_SID;

  // JSONレスポンスを返す
  const response = {
    status: 'success',
    message: 'Protected endpoint accessed',
    accountSid: accountSid,
    timestamp: new Date().toISOString()
  };

  callback(null, response);
};
```

## Assetsの使用

### 静的HTMLファイル

`assets/index.html`:

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Twilio Functions Demo</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { color: #F22F46; }
    button {
      background: #F22F46;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
    }
    button:hover {
      background: #d91e36;
    }
    #result {
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 5px;
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Twilio Functions Demo</h1>
    <p>このページはTwilio Assetsでホスティングされています。</p>

    <button onclick="callFunction()">Functionを呼び出す</button>

    <div id="result"></div>
  </div>

  <script>
    async function callFunction() {
      try {
        const response = await fetch('/hello');
        const data = await response.text();

        document.getElementById('result').style.display = 'block';
        document.getElementById('result').innerHTML =
          '<strong>Function Response:</strong><br>' + data;
      } catch (error) {
        console.error('Error:', error);
        alert('エラーが発生しました');
      }
    }
  </script>
</body>
</html>
```

### プライベートAsset

`assets/private/config.json.private`:

```json
{
  "apiKey": "your-secret-api-key",
  "settings": {
    "maxRetries": 3,
    "timeout": 5000
  }
}
```

## 環境変数とDependencies

### 環境変数の設定

`.env`:

```bash
# Twilio認証情報
ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# カスタム環境変数
MY_PHONE_NUMBER=+81901234567
API_KEY=your-api-key-here
WEBHOOK_URL=https://example.com/webhook
```

### Functionでの環境変数使用

`functions/env-example.js`:

```javascript
exports.handler = function(context, event, callback) {
  // 環境変数にアクセス
  const myPhone = context.MY_PHONE_NUMBER;
  const apiKey = context.API_KEY;

  const response = {
    phone: myPhone,
    hasApiKey: !!apiKey,
    environment: context.DOMAIN_NAME
  };

  callback(null, response);
};
```

### 外部ライブラリの追加

```bash
# npmパッケージをインストール
npm install axios moment lodash
```

`functions/with-dependencies.js`:

```javascript
// 依存関係を使用
const axios = require('axios');
const moment = require('moment');

exports.handler = async function(context, event, callback) {
  try {
    // 外部APIを呼び出し
    const response = await axios.get('https://api.github.com/users/twilio');

    const result = {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      githubData: {
        name: response.data.name,
        repos: response.data.public_repos
      }
    };

    callback(null, result);
  } catch (error) {
    callback(error);
  }
};
```

## ローカル開発

### 開発サーバーの起動

```bash
# ローカルで実行
twilio serverless:start

# 別のポートで起動
twilio serverless:start --port 3001

# ライブリロードを有効化
twilio serverless:start --live
```

### ローカルエンドポイント

```
Functions:
http://localhost:3000/sms-reply
http://localhost:3000/voice-response
http://localhost:3000/admin/dashboard

Assets:
http://localhost:3000/index.html
```

## デプロイ

### プロダクション環境へのデプロイ

```bash
# デプロイ実行
twilio serverless:deploy

# 特定の環境にデプロイ
twilio serverless:deploy --environment production

# デプロイ時に環境変数を設定
twilio serverless:deploy \
  --environment production \
  --env MY_VARIABLE=value
```

### デプロイ後のURL

```
Functions:
https://my-functions-1234-dev.twil.io/sms-reply
https://my-functions-1234-dev.twil.io/voice-response

Assets:
https://my-functions-1234-dev.twil.io/index.html
```

## 実践例：IVRシステム

`functions/ivr-menu.js`:

```javascript
exports.handler = function(context, event, callback) {
  const twiml = new Twilio.twiml.VoiceResponse();

  // ユーザー入力を収集
  const gather = twiml.gather({
    numDigits: 1,
    action: '/ivr-handler',
    method: 'POST'
  });

  gather.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, '営業部門は1を、サポート部門は2を、その他は3を押してください。');

  // タイムアウト時の処理
  twiml.redirect('/ivr-menu');

  callback(null, twiml);
};
```

`functions/ivr-handler.js`:

```javascript
exports.handler = function(context, event, callback) {
  const twiml = new Twilio.twiml.VoiceResponse();
  const digit = event.Digits;

  const responses = {
    '1': '営業部門におつなぎします。',
    '2': 'サポート部門におつなぎします。',
    '3': 'オペレーターにおつなぎします。'
  };

  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, responses[digit] || '無効な選択です。');

  if (responses[digit]) {
    // 実際の転送処理をここに追加
    twiml.dial(context.MY_PHONE_NUMBER);
  } else {
    twiml.redirect('/ivr-menu');
  }

  callback(null, twiml);
};
```

## デバッグとログ

### Functionでのログ出力

```javascript
exports.handler = function(context, event, callback) {
  // コンソールログ（開発環境で表示）
  console.log('Function called at:', new Date());
  console.log('Event data:', event);

  // Twilio Debuggerに送信
  console.warn('Warning: This is a warning message');
  console.error('Error: This is an error message');

  callback(null, { status: 'ok' });
};
```

### ログの確認

```bash
# リアルタイムログを表示
twilio serverless:logs

# 特定の環境のログを表示
twilio serverless:logs --environment production
```

## ベストプラクティス

### 1. エラーハンドリング

```javascript
exports.handler = function(context, event, callback) {
  try {
    // メイン処理
    const result = processRequest(event);
    callback(null, result);
  } catch (error) {
    console.error('Error:', error);
    // エラーレスポンス
    const response = new Twilio.Response();
    response.setStatusCode(500);
    response.setBody({ error: 'Internal Server Error' });
    callback(null, response);
  }
};
```

### 2. レート制限

```javascript
// シンプルなレート制限の実装
const rateLimits = new Map();

exports.handler = function(context, event, callback) {
  const from = event.From;
  const now = Date.now();
  const limit = 10; // 10リクエスト/分

  if (!rateLimits.has(from)) {
    rateLimits.set(from, []);
  }

  const requests = rateLimits.get(from);
  const recentRequests = requests.filter(time => now - time < 60000);

  if (recentRequests.length >= limit) {
    const response = new Twilio.Response();
    response.setStatusCode(429);
    response.setBody({ error: 'Too many requests' });
    return callback(null, response);
  }

  recentRequests.push(now);
  rateLimits.set(from, recentRequests);

  // 通常の処理
  callback(null, { status: 'ok' });
};
```

### 3. 非同期処理

```javascript
exports.handler = async function(context, event, callback) {
  try {
    // 複数の非同期処理を並列実行
    const [userData, configData] = await Promise.all([
      fetchUserData(event.userId),
      loadConfiguration(context)
    ]);

    const response = {
      user: userData,
      config: configData
    };

    callback(null, response);
  } catch (error) {
    callback(error);
  }
};
```

## トラブルシューティング

### よくある問題と解決方法

1. **デプロイエラー**
   ```bash
   # キャッシュをクリア
   rm -rf .twilio-functions

   # 再デプロイ
   twilio serverless:deploy --force
   ```

2. **環境変数が反映されない**
   ```bash
   # 環境変数を確認
   twilio serverless:env:list --environment dev

   # 環境変数を設定
   twilio serverless:env:set MY_VAR=value --environment dev
   ```

3. **Functionタイムアウト**
   - Functionの実行時間は10秒まで
   - 長時間処理は非同期で処理

## 参考リンク

- [Twilio Functions公式ドキュメント](https://www.twilio.com/docs/runtime/functions)
- [Twilio CLI リファレンス](https://www.twilio.com/docs/twilio-cli)
- [Serverless Toolkit](https://www.twilio.com/docs/labs/serverless-toolkit)
- [TwiML リファレンス](https://www.twilio.com/docs/voice/twiml)

---

**次のステップ:** Functionsを使って実際のアプリケーションを構築してみましょう！