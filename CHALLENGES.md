# Twilio Workshop ハンズオン課題

実際に動作する完全なコードでTwilioの各機能を学習できる課題集です。

## 📋 課題構成

### SMS課題 (challenges/sms/)
- **課題1**: 複数宛先への一斉送信
- **課題2**: SMS送信履歴の管理  
- **課題3**: テンプレートメッセージシステム

### Voice課題 (challenges/voice/)
- **課題1**: 営業時間チェック機能
- **課題2**: コールバック予約システム
- **課題3**: 会議室システム

### Apps課題 (challenges/apps/)
- **課題1**: AI連携SMS自動返信システム

## 🚀 実行方法

### 事前準備

1. 環境変数設定
```bash
# プロジェクトルートで .env ファイルを設定
cp .env.example .env
# .envファイルを編集してTwilio認証情報を入力
```

2. 必要に応じてngrokをインストール
```bash
npm install -g ngrok
```

### SMS課題の実行

```bash
cd challenges/sms

# 課題1: 複数宛先への一斉送信
npm run challenge1
# または
node challenge1-bulk-sms.js

# 課題2: SMS送信履歴の管理
npm run challenge2
# または
node challenge2-sms-history.js

# 課題3: テンプレートメッセージシステム
npm run challenge3
# または
node challenge3-template-message.js
```

#### SMS課題のオプション

```bash
# 課題1: カスタム送信先指定
node challenge1-bulk-sms.js +81901234567 +81901234568

# 課題2: 履歴表示のみ
node challenge2-sms-history.js --history-only

# 課題2: CSVエクスポートのみ  
node challenge2-sms-history.js --export

# 課題3: 個別テンプレート実行
node challenge3-template-message.js appointment_confirmation
node challenge3-template-message.js special_offer
```

### Voice課題の実行

```bash
cd challenges/voice

# 課題1: 営業時間チェック (ポート 3100)
npm run challenge1
# または
node challenge1-business-hours.js

# 課題2: コールバック予約システム (ポート 3101)
npm run challenge2
# または  
node challenge2-callback-reservation.js

# 課題3: 会議室システム (ポート 3102)
npm run challenge3
# または
node challenge3-conference-room.js
```

#### Voice課題のngrok設定

各Voiceアプリを起動後、別ターミナルでngrokを実行:

```bash
# 課題1用
npx ngrok http 3100

# 課題2用
npx ngrok http 3101

# 課題3用
npx ngrok http 3102
```

取得したngrok URLをTwilioコンソールのWebhook URLに設定:
- `https://your-ngrok-url.ngrok.io/voice`

### Apps課題の実行

```bash
cd challenges/apps

# 課題1: AI連携SMS自動返信システム (ポート 3200)
npm run challenge1
# または
node challenge1-ai-sms-reply.js
```

## 📚 各課題の詳細

### SMS課題1: 複数宛先への一斉送信

**学習内容**: Promise.allを使った並行処理、エラーハンドリング、レート制限対策

**実行結果**:
- 複数の番号に同時SMS送信
- 送信結果の詳細表示
- 並行送信と順次送信の比較

**機能**:
- 環境変数での送信先設定
- コマンドライン引数での送信先カスタマイズ
- 詳細な送信ログ
- エラー別の対処法表示

### SMS課題2: SMS送信履歴の管理

**学習内容**: ファイルI/O、JSON操作、統計情報の計算、CSVエクスポート

**実行結果**:
- SMS送信履歴の永続化
- 統計情報の表示
- CSVファイルへのエクスポート
- エラー履歴の管理

**機能**:
- `sms-history.json` での履歴保存
- 送信成功/失敗の記録
- 宛先別の統計
- 時系列での履歴表示

### SMS課題3: テンプレートメッセージシステム

**学習内容**: テンプレート管理、動的メッセージ生成、顧客管理

**実行結果**:
- 5種類のテンプレートメッセージ
- 顧客情報に応じたパーソナライゼーション
- キャンセルコード自動生成
- 特別オファーの自動選択

**機能**:
- 予約確認、リマインダー、キャンセル確認
- 特別オファー、誕生日メッセージ
- 動的なキャンセルコード生成
- サービス別カスタマイズ

### Voice課題1: 営業時間チェック

**学習内容**: 日時計算、条件分岐、TwiML生成、営業時間管理

**実行結果**:
- 現在時刻での営業状況判定
- 営業時間外メッセージ
- 次回営業時間の案内
- 緊急対応と留守番電話の分岐

**機能**:
- 平日/土曜/日曜/祝日の管理
- 動的な営業状況表示
- Web管理画面
- 時刻指定でのテスト機能

### Voice課題2: コールバック予約システム

**学習内容**: 音声入力処理、電話番号正規化、予約管理、アウトバウンドコール

**実行結果**:
- 音声での電話番号入力
- コールバック予約の管理
- SMS確認メッセージ送信
- 管理画面での予約状況確認

**機能**:
- 現在番号/別番号の選択
- 電話番号の音声読み上げ確認
- 予約データの永続化
- 管理者用のコールバック実行機能

### Voice課題3: 会議室システム

**学習内容**: 会議室管理、PIN認証、参加者管理、録音機能

**実行結果**:
- 公開/プライベート会議室
- PIN認証システム
- 参加者数制限
- 会議録音の自動保存

**機能**:
- 6つの会議室 (公開3つ、プライベート3つ)
- リアルタイム参加者管理
- 会議履歴の保存
- Web管理画面での状況監視

### Apps課題1: AI連携SMS自動返信システム

**学習内容**: AI分析、自然言語処理、会話履歴、レート制限

**実行結果**:
- メッセージの自動分析
- 文脈を考慮した応答生成
- 感情分析とFAQ自動応答
- 会話履歴の管理

**機能**:
- AIモック分析エンジン
- 挨拶/FAQ/感情の自動検出
- 特別コマンド (HELP, HISTORY, CLEAR, STATUS)
- レート制限による悪用防止

## 🔧 トラブルシューティング

### 環境変数エラー
```bash
# 環境変数が正しく設定されているか確認
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_AUTH_TOKEN
```

### ポート競合エラー
各課題は異なるポートを使用:
- SMS課題: ポート不要 (実行のみ)
- Voice課題1: 3100
- Voice課題2: 3101  
- Voice課題3: 3102
- Apps課題1: 3200

### ngrok接続エラー
```bash
# ngrokの認証確認
npx ngrok authtoken YOUR_TOKEN

# ngrokプロセスの確認
ps aux | grep ngrok

# 既存プロセスの終了
pkill ngrok
```

### データファイルエラー
各課題が生成するデータファイル:
- `sms-history.json` (SMS課題2)
- `sms-history.csv` (SMS課題2)
- `callback-reservations.json` (Voice課題2)
- `conference-rooms.json` (Voice課題3)
- `ai-conversations.json` (Apps課題1)

ファイルが破損した場合は削除して再実行してください。

## 📊 学習成果の確認

各課題には以下の確認方法があります:

1. **コンソール出力**: 詳細なログとデバッグ情報
2. **Web管理画面**: リアルタイムの状況監視
3. **データファイル**: 永続化された実行結果
4. **Twilioコンソール**: 実際の通話・SMS履歴

## 🎯 応用課題

基本課題をマスターしたら以下にチャレンジ:

1. **複数課題の組み合わせ**: SMS + Voice連携
2. **データベース連携**: SQLiteやMongoDB導入
3. **認証システム**: JWT認証の実装
4. **リアルタイム通知**: WebSocketやSSE導入
5. **本格AI連携**: OpenAI API実装

---

各課題は独立して動作するため、好きな順番で学習できます。まずは興味のある課題から始めてみてください！