---
id: index
title: Twilio Workshop 2025
sidebar_label: Home
slug: /
---

# Twilio Workshop 2025 へようこそ!

このワークショップでは、Twilioの基本機能を実践的に学びます。

**所要時間**: 約2時間30分
**形式**: ハンズオン形式
**本日のゴール**: 「Twilioをコードから触って、すぐに応用できる感覚を掴む」

---

## ワークショップ・アジェンダ

### 1. オープニング (10分)
- 講師自己紹介 & 参加者のスキル確認
- 環境確認（Node.js、Twilioアカウント）

### 2. Twilioの概要 & ユースケース紹介 (15分)
- **Twilioとは?**: SMS / Voice / Verify APIの提供
- **実世界のユースケース**:
  - 配達・物流: 配達通知、ドライバー連絡
  - 認証・セキュリティ: SMS/音声でのOTP
  - カスタマーサポート: IVR、通話録音
  - マーケティング: 予約リマインダー

### 3. Twilio管理コンソールの説明 (10分)
- ダッシュボード（Account SID / Auth Token）
- Phone Numbers（電話番号の取得・Webhook設定）
- Messaging / Voice ログ
- Verify API（本人認証）

### 4. 体験1: Hello World SMS (20分)
**目標**: 自分の携帯にSMSが届く → 成功体験！

```bash
cd hello-sms
node index.js
```

**📚 詳細**: [SMS送信ハンズオン](./sms)

### 5. 体験2: 自動応答電話 (20分)
**目標**: 自分の携帯が鳴る → 自動音声が流れる体験

```bash
cd hello-voice
node index.js
# 別ターミナルで
ngrok http 3000
```

**📚 詳細**: [Voice通話ハンズオン](./voice)

### 6. 休憩 (10分) ☕

### 7. 体験3: 応用ミニアプリ (25分)
以下の3つから選択して実装:

#### App 1: [SMS自動返信システム](./apps#app-1-sms自動返信システム)
受信SMSのキーワードを判定して自動返信

#### App 2: [留守番電話システム](./apps#app-2-留守番電話システム)
着信時にメッセージを録音

#### App 3: [OTP認証システム](./apps#app-3-otp認証システム)
6桁のワンタイムパスワードで認証

**📚 詳細**: [ミニアプリ開発](./apps)

### 8. ディスカッション (15分)
**テーマ**: 「今日の体験を自社に当てはめると?」
- 自社のどの業務フローにTwilioが活用できるか？
- 既存システムとの連携方法は？

### 9. クロージング & Q&A (5分)
- 本日の振り返り
- 次のステップ（リソース紹介、PoCの始め方）

---

## このワークショップで学べること

### 1. SMS送信の基礎
- Twilioアカウントの設定
- 電話番号の取得
- Node.jsでSMS送信プログラムを実装

### 2. Voice通話の実装
- TwiMLを使った音声応答
- 着信時のカスタムメッセージ設定
- 音声通話の基本フロー

### 3. ミニアプリケーション開発
- **SMS自動返信アプリ**: 受信したSMSに自動で返信
- **留守番電話アプリ**: 音声メッセージの録音と保存
- **OTP認証アプリ**: ワンタイムパスワードによる認証

## 事前準備

### 必要なもの
- Node.js v20以上
- Twilioアカウント（無料トライアル可）
- テキストエディタ（VSCode推奨）
- 電話番号（SMS受信用）

### 環境構築手順

```bash
# リポジトリのクローン
git clone https://github.com/MitsuharuNakamura/Twilio-onboarding-25.git
cd Twilio-onboarding-25

# 依存関係のインストール
npm ci

# ローカルでドキュメントを起動
npm run start
```

## Twilioアカウント設定

1. [Twilio Console](https://console.twilio.com)にログイン
2. Account SID と Auth Token をメモ
3. 電話番号を購入（トライアルでも可）
4. `.env`ファイルを作成し、以下を記載:

```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

## ワークショップの進め方

1. **[SMS送信](./sms)** - 基本的なSMS送信プログラムを作成
2. **[Voice通話](./voice)** - TwiMLを使った音声応答を実装
3. **[ミニアプリ](./apps)** - 実践的なアプリケーションを開発

各セクションには、以下が含まれています:
- 解説とコード例
- ハンズオン課題
- 応用例とTips

---

## 次のステップ

### リソース
- 📖 [Twilio公式ドキュメント](https://www.twilio.com/docs)
- 💻 [サンプルコードGitHub](https://github.com/MitsuharuNakamura/Twilio-onboarding-25)
- 🎓 [Twilio Quest](https://www.twilio.com/quest) - ゲーム形式の学習プラットフォーム

### PoCの始め方
1. **無料トライアル**で小さく試す
2. **検証環境**でプロトタイプ作成
3. **本番環境**へ移行（番号の追加購入、APIキーの管理）

### サポート
質問や問題がある場合は:
- [コミュニティフォーラム](https://support.twilio.com/hc/en-us/community/topics)
- [GitHub Issues](https://github.com/MitsuharuNakamura/Twilio-onboarding-25/issues)
- [Twilio公式ドキュメント](https://www.twilio.com/docs)

---

**🎉 さあ、Twilioの世界を探検しましょう！**