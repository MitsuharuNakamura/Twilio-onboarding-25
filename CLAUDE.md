# Claude Code 用プロンプト（Twilio Workshop Docs + Hands-on）

以下のプロンプトを Claude Code に渡すと、**Docusaurus + GitHub Pages
のおしゃれDocs**と**Twilioハンズオン用コード**を一括生成できます。

------------------------------------------------------------------------

## ✅ Claude Code 用・一括セットアッププロンプト

**あなたはコード生成エージェントです。**\
以下の要件で、**単一のGitHubリポジトリ**をローカルに自動生成してください。すべてのファイルを作成し、`npm ci && npm run build`
が通る状態にしてください。

### 0) 変数（ここを編集）

-   `ORG_NAME = MitsuharuNakamura` （GitHubユーザー名 or 組織名）
-   `PROJECT_NAME = Twilio-onboarding-25` （リポジトリ名）
-   Node.js: v20 以上を前提

### 1) やること（ゴール）

-   Docusaurus 3 を使った **おしゃれなドキュメントサイト**（GitHub
    Pagesで公開）
-   ワークショップの **ハンズオン用コード**（SMS / Voice / mini-app
    3種）
-   `.github/workflows` に **Pages自動デプロイ用のActions** 追加
-   `npm ci && npm run start` でローカル起動、`npm run build`
    が成功すること
-   すべて **ESM（type: module）** 前提

### 2) 生成するファイル一覧と内容

以下のファイルを生成してください：

    README.md
    package.json
    docusaurus.config.ts
    sidebars.ts
    .gitignore
    docs/index.md
    docs/sms.md
    docs/voice.md
    docs/apps.md
    docs/_category_.json
    src/css/custom.css
    static/img/logo.svg
    hello-sms/package.json
    hello-sms/index.js
    hello-voice/package.json
    hello-voice/index.js
    mini-apps/sms-reply/package.json
    mini-apps/sms-reply/server.js
    mini-apps/voicemail/package.json
    mini-apps/voicemail/server.js
    mini-apps/verify-otp/package.json
    mini-apps/verify-otp/server.js
    .github/workflows/deploy-gh-pages.yml
    .env.example

------------------------------------------------------------------------

## 📌 ポイント

-   トップページは `/` に設定し、ナビゲーションから SMS / Voice / Apps
    にすぐ飛べる。
-   コードブロックはすべてコピー可能で、角丸＋影付きスタイルを
    custom.css に実装。
-   GitHub Actions による自動デプロイ設定済み。

------------------------------------------------------------------------

## 使い方

1.  このプロンプトを Claude Code にペーストする。
2.  生成されたリポジトリを GitHub に push。
3.  `docusaurus.config.ts` の `organizationName` と `projectName`
    を編集。
4.  GitHub Pages を有効化すると公開される。

------------------------------------------------------------------------

🚀 これで「おしゃれDocs + ハンズオンコード」環境が完成します！
