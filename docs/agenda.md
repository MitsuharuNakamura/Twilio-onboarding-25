---
id: agenda
title: ワークショップ・アジェンダ
sidebar_label: Agenda
---

# Twilioワークショップ 2025 - アジェンダ

**所要時間**: 約2時間30分
**形式**: ハンズオン形式
**前提条件**: Node.js v20以上、Twilioアカウント

---

## 1. オープニング (10分)

### 講師自己紹介 & 参加者のスキル確認

- 講師紹介
- 参加者の開発経験・Twilio利用経験の確認
- 本日のゴール：**「Twilioをコードから触って、すぐに応用できる感覚を掴む」**

### 環境確認

```bash
# Node.jsバージョン確認
node -v  # v20以上であることを確認

# リポジトリクローン
git clone https://github.com/MitsuharuNakamura/Twilio-onboarding-25.git
cd Twilio-onboarding-25
npm ci
```

---

## 2. Twilioの概要 & ユースケース紹介 (15分)

### Twilioとは?

- **SMS / Voice / Verify** APIの提供
- 開発者がPoC（概念実証）を素早く作れるプラットフォーム
- グローバルインフラとスケーラビリティ

### 実世界のユースケース

| カテゴリ | 事例 |
|---------|------|
| 配達・物流 | 配達通知、ドライバー連絡 |
| 認証・セキュリティ | SMS/音声でのワンタイムパスワード（OTP） |
| カスタマーサポート | IVR（自動音声応答）、通話録音 |
| マーケティング | 予約リマインダー、キャンペーン通知 |
| ヘルスケア | 予約確認、服薬リマインダー |

---

## 3. Twilio管理コンソールの説明 (10分)

### コンソールツアー

[Twilio Console](https://console.twilio.com)にログインして以下を確認：

1. **ダッシュボード**
   - Account SID / Auth Token の確認
   - アカウント残高・使用状況

2. **Phone Numbers（電話番号）**
   - 電話番号の取得方法
   - Webhook設定（SMS/Voice）

3. **Messaging**
   - SMS送受信履歴
   - メッセージステータスの確認

4. **Voice**
   - 通話ログ
   - TwiML Bins（簡易ホスティング）

5. **Verify**
   - 本人認証API（OTP送信・検証）
   - サービス作成と管理

### 認証情報の設定

プロジェクトルートに `.env` ファイルを作成：

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
TO_PHONE_NUMBER=+81901234567
```

---

## 4. 体験1: Hello World SMS (20分)

### 目標

- Twilio SDKのセットアップ
- Node.jsからSMSを送信
- 実際に自分の携帯にSMSが届く → **成功体験！**

### ハンズオン手順

#### Step 1: Consoleから手動送信（デモ）

Twilio Consoleの「Try it Out」機能でSMS送信を体験

#### Step 2: コードから送信

```bash
cd hello-sms
npm install
node index.js
```

実装内容: [SMS送信ハンズオン](./sms#クイックスタート)

#### Step 3: 送信ステータスの確認

```bash
node check-status.js
```

### 学習ポイント

- Twilio SDKの初期化
- `client.messages.create()` APIの使い方
- メッセージステータス（queued → sent → delivered）
- エラーハンドリング

**📚 詳細**: [SMS送信ハンズオン](./sms)

---

## 5. 体験2: 自動応答電話 (20分)

### 目標

- TwiML（Twilio Markup Language）の基本を理解
- 自分の携帯が鳴る → 自動音声が流れる体験

### ハンズオン手順

#### Step 1: 基本的なTwiML応答

```bash
cd hello-voice
npm install
node index.js
```

実装内容：
- 日本語音声（Polly.Mizuki）での応答
- 「こんにちは！Twilioワークショップへようこそ」

#### Step 2: ngrokで公開

```bash
# 別ターミナルで実行
ngrok http 3000
```

#### Step 3: Twilioコンソールで設定

1. 購入した電話番号の設定画面を開く
2. Voice Webhook URLに ngrok の URL を設定:
   ```
   https://xxxxx.ngrok.io/voice
   ```
3. 自分の携帯から Twilio番号に電話をかける

### 学習ポイント

- TwiMLの基本構文（`<Say>`, `<Pause>`など）
- ExpressでのWebhook受信
- ngrokを使った開発環境の公開

**📚 詳細**: [Voice通話ハンズオン](./voice)

---

## 6. 休憩 (10分) ☕

---

## 7. 体験3: 応用ミニアプリ (25分)

### サンプルから選択して実装

参加者は以下の3つから興味のあるものを選択して実装：

#### App 1: SMS自動返信システム

**機能**:
- 受信SMSのキーワードを判定
- 「営業時間」「料金」「予約」などに自動返信

**実装**:
```bash
cd mini-apps/sms-reply
npm install
node server.js
```

**発展**: AI（ChatGPT）と連携した自動応答

**📚 詳細**: [SMS自動返信](./apps#app-1-sms自動返信システム)

---

#### App 2: 留守番電話システム

**機能**:
- 着信時に留守番メッセージを再生
- 通話を録音してTwilioに保存

**実装**:
```bash
cd mini-apps/voicemail
npm install
node server.js
```

**学習ポイント**: `<Record>` 動詞の使い方、録音データの取得

**📚 詳細**: [留守番電話アプリ](./apps#app-2-留守番電話システム)

---

#### App 3: OTP認証システム

**機能**:
- 6桁のワンタイムパスワードをSMS送信
- Webフォームでコード入力・検証
- 5分間の有効期限、3回までの試行制限

**実装**:
```bash
cd mini-apps/verify-otp
npm install
node server.js
```

ブラウザで `http://localhost:3003` を開いて動作確認

**学習ポイント**: セキュリティ（有効期限、試行制限）、フロントエンドとの連携

**📚 詳細**: [OTP認証アプリ](./apps#app-3-otp認証システム)

---

## 8. ディスカッション (15分)

### グループディスカッション

**テーマ**: 「今日の体験を自社に当てはめると?」

#### 考えるポイント

- 自社のどの業務フローにTwilioが活用できるか？
- 既存システムとの連携はどうするか？
- コスト感は？（SMS単価、Voice料金）
- セキュリティ・コンプライアンスの考慮点は？

### 全体共有

各グループから1-2分で発表

---

## 9. クロージング & Q&A (5分)

### 本日の振り返り

- ✅ TwilioでSMS送信ができた
- ✅ TwiMLで音声応答システムを作った
- ✅ 実践的なミニアプリを動かした

### 次のステップ

#### リソース

- 📖 [Twilio公式ドキュメント](https://www.twilio.com/docs)
- 💻 [サンプルコードGitHub](https://github.com/MitsuharuNakamura/Twilio-onboarding-25)
- 🎓 [Twilio Quest](https://www.twilio.com/quest) - ゲーム形式の学習プラットフォーム

#### PoCの始め方

1. **無料トライアル**で小さく試す
2. **検証環境**でプロトタイプ作成
3. **本番環境**へ移行（番号の追加購入、APIキーの管理）

#### サポート

- [コミュニティフォーラム](https://support.twilio.com/hc/en-us/community/topics)
- [GitHub Issues](https://github.com/MitsuharuNakamura/Twilio-onboarding-25/issues)

### Q&A

質疑応答タイム

---

**🎉 ワークショップ終了！お疲れ様でした！**

次は実際のプロダクトで Twilio を活用してみましょう！
