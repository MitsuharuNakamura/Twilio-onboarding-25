# Twilio Workshop 2025

Twilioの基本機能（SMS・Voice・Apps）を学ぶハンズオンワークショップです。

## クイックスタート

```bash
# リポジトリのクローン
git clone https://github.com/MitsuharuNakamura/Twilio-onboarding-25.git
cd Twilio-onboarding-25

# 依存関係のインストール
npm ci

# ローカルでドキュメントを起動
npm run start
```

ドキュメントサイト: http://localhost:3000

## コンテンツ

- **SMS送信**: Twilio SDKを使った基本的なSMS送信
- **Voice通話**: TwiMLによる音声応答システム
- **ミニアプリ**:
  - SMS自動返信システム
  - 留守番電話アプリ
  - OTP認証システム

## 必要な環境

- Node.js v20以上
- Twilioアカウント（無料トライアル可）
- 電話番号（SMS受信用）

## 環境設定

`.env.example`をコピーして`.env`を作成:

```bash
cp .env.example .env
```

以下の環境変数を設定:

```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
TO_PHONE_NUMBER=+81901234567
```

## 各プロジェクトの起動方法

### SMS送信デモ

```bash
cd hello-sms
npm install
npm start
```

### Voice通話デモ

```bash
cd hello-voice
npm install
npm start
# 別ターミナルで: npx ngrok http 3000
```

### ミニアプリ

```bash
# SMS自動返信
cd mini-apps/sms-reply
npm install
npm start

# 留守番電話
cd mini-apps/voicemail
npm install
npm start

# OTP認証
cd mini-apps/verify-otp
npm install
npm start
```

## ドキュメントのビルド

```bash
# 開発サーバー
npm run start

# 本番ビルド
npm run build

# ビルドしたサイトのプレビュー
npm run serve
```

## GitHub Pagesへのデプロイ

1. GitHubにリポジトリをプッシュ
2. Settings > Pages で GitHub Pages を有効化
3. Source: GitHub Actions を選択
4. mainブランチにプッシュすると自動デプロイ

## プロジェクト構造

```
Twilio-onboarding-25/
├── docs/                    # Docusaurusドキュメント
│   ├── index.md            # ホームページ
│   ├── sms.md              # SMS送信ガイド
│   ├── voice.md            # Voice通話ガイド
│   └── apps.md             # ミニアプリガイド
├── hello-sms/              # SMS送信デモ
│   ├── package.json
│   └── index.js
├── hello-voice/            # Voice通話デモ
│   ├── package.json
│   └── index.js
├── mini-apps/              # 実践的なアプリケーション
│   ├── sms-reply/          # SMS自動返信
│   ├── voicemail/          # 留守番電話
│   └── verify-otp/         # OTP認証
├── src/                    # Docusaurusソース
│   └── css/
│       └── custom.css
├── static/                 # 静的ファイル
│   └── img/
├── .github/
│   └── workflows/
│       └── deploy-gh-pages.yml
├── docusaurus.config.ts    # Docusaurus設定
├── sidebars.ts            # サイドバー設定
├── package.json           # メインプロジェクト
├── README.md              # このファイル
└── .env.example           # 環境変数テンプレート
```

## コントリビューション

Issue や Pull Request を歓迎します！

## ライセンス

MIT License

## 関連リンク

- [Twilio公式ドキュメント](https://www.twilio.com/docs)
- [Twilio Japan](https://www.twilio.com/ja-jp)
- [Docusaurus](https://docusaurus.io/)

---

Built with love using Docusaurus and Twilio