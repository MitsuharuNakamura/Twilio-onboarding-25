# Twilio Workshop セットアップガイド

## 1. 事前準備

### 環境変数の設定

プロジェクトルートに `.env` ファイルを作成:

```bash
cp .env.example .env
```

`.env` ファイルを編集して以下の値を設定:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
TO_PHONE_NUMBER=+81901234567
```

### Twilioアカウント情報の取得方法

1. [Twilio Console](https://console.twilio.com) にログイン
2. ダッシュボードで Account SID と Auth Token をコピー
3. Phone Numbers > Manage > Active numbers から電話番号を確認

## 2. 各アプリケーションの実行方法

### SMS送信デモ (hello-sms)

```bash
cd hello-sms
npm start
```

実行結果例:
```
SMS送信を開始します...
SMS送信成功！
メッセージSID: SM1234567890abcdef
ステータス: queued
送信先: +81901234567
送信日時: Mon Jan 15 2025 10:30:00 GMT+0900
処理完了
```

### Voice通話デモ (hello-voice)

```bash
cd hello-voice
npm start
```

サーバー起動後:
```
Voice server running on port 3000
Webhook URL: http://localhost:3000/voice
Use ngrok to expose this server: npx ngrok http 3000
```

別ターミナルでngrokを起動:
```bash
npx ngrok http 3000
```

ngrokで取得したURLをTwilio電話番号のWebhookに設定:
- Webhook URL: `https://your-ngrok-url.ngrok.io/voice`

### SMS自動返信アプリ (mini-apps/sms-reply)

```bash
cd mini-apps/sms-reply
npm start
```

サーバー起動後:
```
SMS Reply server running on port 3001
Webhook URL: http://localhost:3001/sms
Use ngrok to expose this server: npx ngrok http 3001
```

別ターミナルでngrokを起動:
```bash
npx ngrok http 3001
```

ngrokで取得したURLをTwilio電話番号のSMS WebhookURLに設定:
- Webhook URL: `https://your-ngrok-url.ngrok.io/sms`

テスト用キーワード:
- `営業時間`
- `料金`
- `予約`
- `HELP`

### 留守番電話アプリ (mini-apps/voicemail)

```bash
cd mini-apps/voicemail
npm start
```

サーバー起動後:
```
Voicemail server running on port 3002
Webhook URL: http://localhost:3002/voice
Admin panel: http://localhost:3002/
Use ngrok to expose this server: npx ngrok http 3002
```

別ターミナルでngrokを起動:
```bash
npx ngrok http 3002
```

ngrokで取得したURLをTwilio電話番号のWebhookに設定:
- Webhook URL: `https://your-ngrok-url.ngrok.io/voice`

管理画面にアクセス: `http://localhost:3002`

### OTP認証アプリ (mini-apps/verify-otp)

```bash
cd mini-apps/verify-otp
npm start
```

サーバー起動後:
```
OTP server running on port 3003
Open http://localhost:3003 to test
Stats: http://localhost:3003/api/stats
```

ブラウザで `http://localhost:3003` にアクセスしてテスト

## 3. トラブルシューティング

### よくあるエラー

1. **認証エラー (Error 20003)**
   - Account SIDとAuth Tokenを確認
   - .envファイルの設定を確認

2. **電話番号エラー (Error 21211)**
   - 電話番号の形式を確認 (+国番号から始まる)
   - Twilioで購入した番号か確認

3. **未検証番号エラー (Error 21608)**
   - Twilioトライアルアカウントの場合、送信先番号の検証が必要
   - Console > Phone Numbers > Verified Caller IDs で番号を追加

4. **ngrokが接続できない**
   - ファイアウォールの設定を確認
   - ngrokの認証トークンを設定: `npx ngrok authtoken YOUR_TOKEN`

### 動作確認コマンド

各アプリが正常に動作しているか確認:

```bash
# SMS送信テスト
cd hello-sms && npm start

# Voice server起動確認
cd hello-voice && npm start &
curl http://localhost:3000/health

# SMS自動返信確認
cd mini-apps/sms-reply && npm start &
curl http://localhost:3001/health

# 留守番電話確認
cd mini-apps/voicemail && npm start &
curl http://localhost:3002/health

# OTP認証確認
cd mini-apps/verify-otp && npm start &
curl http://localhost:3003/api/stats
```

## 4. 開発時のTips

### ngrokの永続化
開発中にngrokのURLが変わるのを防ぐため、ngrok設定ファイルを作成:

```yaml
# ~/.ngrok2/ngrok.yml
version: "2"
authtoken: your_authtoken_here
tunnels:
  voice:
    addr: 3000
    proto: http
  sms:
    addr: 3001
    proto: http
  voicemail:
    addr: 3002
    proto: http
```

起動:
```bash
npx ngrok start voice sms voicemail
```

### ログの確認
各アプリケーションはコンソールに詳細なログを出力します:
- 受信したリクエスト内容
- 送信したレスポンス
- エラー情報

### デバッグモード
環境変数でデバッグモードを有効化:
```bash
DEBUG=twilio* npm start
```