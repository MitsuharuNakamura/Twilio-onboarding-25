---
id: index
title: Twilio Workshop 2025
sidebar_label: Home
slug: /
---

# Twilio Workshop 2025 へようこそ!

このワークショップでは、Twilioの基本機能を実践的に学びます。

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

## サポート

質問や問題がある場合は:
- [GitHub Issues](https://github.com/MitsuharuNakamura/Twilio-onboarding-25/issues)
- [Twilio公式ドキュメント](https://www.twilio.com/docs)

---

**さあ、Twilioの世界を探検しましょう！**