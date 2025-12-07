// webhook-server.js - SendGrid Event Webhook 受信サーバー
import express from 'express';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const app = express();

// SendGrid は JSON 形式でイベントを送信
app.use(express.json());

/**
 * SendGrid Event Webhook
 *
 * 設定手順:
 * 1. SendGrid コンソール → Settings → Mail Settings → Event Webhook
 * 2. HTTP Post URL に ngrok 等で公開した URL を設定
 *    例: https://xxxx.ngrok.io/webhook/sendgrid
 * 3. 受信したいイベントを選択:
 *    - Processed: メール処理完了
 *    - Dropped: 送信拒否（バウンス済みアドレス等）
 *    - Delivered: 配信成功
 *    - Deferred: 一時的な配信失敗（リトライ中）
 *    - Bounce: ハードバウンス
 *    - Blocked: ブロック
 *    - Open: 開封
 *    - Click: リンククリック
 *    - Spam Report: スパム報告
 *    - Unsubscribe: 配信停止
 * 4. "Test Your Integration" でテスト送信
 */

// イベントタイプごとの日本語説明
const eventDescriptions = {
  processed: '📤 処理完了 - SendGrid がメールを受け付けました',
  dropped: '🚫 送信拒否 - 過去のバウンスやスパム報告により送信されませんでした',
  delivered: '✅ 配信成功 - 受信サーバーがメールを受け取りました',
  deferred: '⏳ 配信遅延 - 一時的な問題でリトライ中です',
  bounce: '❌ バウンス - メールアドレスが無効です',
  blocked: '🔒 ブロック - 受信サーバーに拒否されました',
  open: '👁️ 開封 - メールが開封されました',
  click: '🔗 クリック - リンクがクリックされました',
  spamreport: '⚠️ スパム報告 - 受信者がスパムとして報告しました',
  unsubscribe: '🔕 配信停止 - 受信者が配信停止しました'
};

// イベント統計を保持（デモ用、本番ではDBを使用）
const stats = {
  processed: 0,
  dropped: 0,
  delivered: 0,
  deferred: 0,
  bounce: 0,
  blocked: 0,
  open: 0,
  click: 0,
  spamreport: 0,
  unsubscribe: 0
};

// 最近のイベント履歴
const recentEvents = [];
const MAX_EVENTS = 100;

// Webhook エンドポイント
app.post('/webhook/sendgrid', (req, res) => {
  const events = req.body;

  console.log('\n' + '='.repeat(60));
  console.log(`📨 ${events.length}件のイベントを受信 [${new Date().toLocaleTimeString()}]`);
  console.log('='.repeat(60));

  events.forEach((event, index) => {
    // 統計を更新
    if (stats[event.event] !== undefined) {
      stats[event.event]++;
    }

    // 履歴に追加
    recentEvents.unshift({
      ...event,
      receivedAt: new Date().toISOString()
    });
    if (recentEvents.length > MAX_EVENTS) {
      recentEvents.pop();
    }

    // イベント詳細をログ出力
    const desc = eventDescriptions[event.event] || `📧 ${event.event}`;
    console.log(`\n[${index + 1}] ${desc}`);
    console.log(`    To: ${event.email}`);
    console.log(`    Timestamp: ${new Date(event.timestamp * 1000).toLocaleString()}`);

    // イベント固有の情報
    if (event.sg_message_id) {
      console.log(`    Message ID: ${event.sg_message_id}`);
    }
    if (event.useragent) {
      console.log(`    User Agent: ${event.useragent}`);
    }
    if (event.url) {
      console.log(`    Clicked URL: ${event.url}`);
    }
    if (event.reason) {
      console.log(`    Reason: ${event.reason}`);
    }
    if (event.status) {
      console.log(`    Status: ${event.status}`);
    }
    if (event.bounce_classification) {
      console.log(`    Bounce Type: ${event.bounce_classification}`);
    }

    // 重要なイベントには警告を表示
    if (['bounce', 'spamreport', 'dropped', 'blocked'].includes(event.event)) {
      console.log(`    ⚠️  要対応: このアドレスへの送信を停止することを検討してください`);
    }
  });

  console.log('\n' + '-'.repeat(60));
  console.log('📊 累計統計:');
  Object.entries(stats)
    .filter(([_, count]) => count > 0)
    .forEach(([event, count]) => {
      console.log(`    ${event}: ${count}件`);
    });
  console.log('-'.repeat(60) + '\n');

  // 成功レスポンス（SendGrid は 200 を期待）
  res.status(200).send('OK');
});

// 統計 API
app.get('/stats', (req, res) => {
  const deliveryRate = stats.processed > 0
    ? ((stats.delivered / stats.processed) * 100).toFixed(2)
    : 0;

  const openRate = stats.delivered > 0
    ? ((stats.open / stats.delivered) * 100).toFixed(2)
    : 0;

  const clickRate = stats.delivered > 0
    ? ((stats.click / stats.delivered) * 100).toFixed(2)
    : 0;

  res.json({
    events: stats,
    rates: {
      deliveryRate: `${deliveryRate}%`,
      openRate: `${openRate}%`,
      clickRate: `${clickRate}%`
    },
    totalEvents: Object.values(stats).reduce((a, b) => a + b, 0),
    timestamp: new Date().toISOString()
  });
});

// 最近のイベント一覧 API
app.get('/events', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const type = req.query.type;

  let filtered = recentEvents;
  if (type) {
    filtered = recentEvents.filter(e => e.event === type);
  }

  res.json({
    events: filtered.slice(0, limit),
    total: filtered.length
  });
});

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({
    status: 'running',
    service: 'SendGrid Event Webhook Server',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ダッシュボード UI
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SendGrid Event Webhook Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #1A82E2; margin-bottom: 20px; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      text-align: center;
    }
    .stat-card .value { font-size: 32px; font-weight: bold; color: #333; }
    .stat-card .label { color: #666; margin-top: 5px; }
    .stat-card.success .value { color: #28a745; }
    .stat-card.warning .value { color: #ffc107; }
    .stat-card.danger .value { color: #dc3545; }
    .stat-card.info .value { color: #17a2b8; }
    .rates {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    .rate-card {
      background: linear-gradient(135deg, #1A82E2, #00BFA5);
      color: white;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
    }
    .rate-card .value { font-size: 36px; font-weight: bold; }
    .events-list {
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .events-list h2 {
      padding: 15px 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #eee;
    }
    .event-item {
      padding: 15px 20px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .event-item:last-child { border-bottom: none; }
    .event-type { font-weight: bold; }
    .event-email { color: #666; }
    .event-time { color: #999; font-size: 12px; }
    .refresh-btn {
      background: #1A82E2;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      margin-bottom: 20px;
    }
    .refresh-btn:hover { background: #1565C0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📧 SendGrid Event Webhook Dashboard</h1>
    <button class="refresh-btn" onclick="loadData()">🔄 更新</button>

    <div class="rates" id="rates"></div>
    <div class="stats-grid" id="stats"></div>
    <div class="events-list">
      <h2>最近のイベント</h2>
      <div id="events"></div>
    </div>
  </div>

  <script>
    const eventIcons = {
      processed: '📤',
      dropped: '🚫',
      delivered: '✅',
      deferred: '⏳',
      bounce: '❌',
      blocked: '🔒',
      open: '👁️',
      click: '🔗',
      spamreport: '⚠️',
      unsubscribe: '🔕'
    };

    const eventClasses = {
      delivered: 'success',
      open: 'success',
      click: 'success',
      bounce: 'danger',
      dropped: 'danger',
      blocked: 'danger',
      spamreport: 'warning',
      unsubscribe: 'warning',
      deferred: 'warning',
      processed: 'info'
    };

    async function loadData() {
      try {
        const [statsRes, eventsRes] = await Promise.all([
          fetch('/stats'),
          fetch('/events?limit=10')
        ]);

        const stats = await statsRes.json();
        const events = await eventsRes.json();

        // Rates
        document.getElementById('rates').innerHTML = \`
          <div class="rate-card">
            <div class="value">\${stats.rates.deliveryRate}</div>
            <div class="label">配信率</div>
          </div>
          <div class="rate-card">
            <div class="value">\${stats.rates.openRate}</div>
            <div class="label">開封率</div>
          </div>
          <div class="rate-card">
            <div class="value">\${stats.rates.clickRate}</div>
            <div class="label">クリック率</div>
          </div>
        \`;

        // Stats
        const statsHtml = Object.entries(stats.events)
          .map(([event, count]) => \`
            <div class="stat-card \${eventClasses[event] || ''}">
              <div class="value">\${count}</div>
              <div class="label">\${eventIcons[event] || '📧'} \${event}</div>
            </div>
          \`).join('');
        document.getElementById('stats').innerHTML = statsHtml;

        // Events
        const eventsHtml = events.events.length > 0
          ? events.events.map(e => \`
              <div class="event-item">
                <div>
                  <span class="event-type">\${eventIcons[e.event] || '📧'} \${e.event}</span>
                  <span class="event-email">\${e.email}</span>
                </div>
                <span class="event-time">\${new Date(e.receivedAt).toLocaleString()}</span>
              </div>
            \`).join('')
          : '<div class="event-item">イベントはまだありません</div>';
        document.getElementById('events').innerHTML = eventsHtml;

      } catch (error) {
        console.error('Error loading data:', error);
      }
    }

    // 初期ロード
    loadData();

    // 10秒ごとに自動更新
    setInterval(loadData, 10000);
  </script>
</body>
</html>
  `);
});

const PORT = process.env.WEBHOOK_PORT || 3004;
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('📧 SendGrid Event Webhook Server');
  console.log('='.repeat(60));
  console.log(`\nサーバー起動: http://localhost:${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/webhook/sendgrid`);
  console.log(`ダッシュボード: http://localhost:${PORT}`);
  console.log(`統計 API: http://localhost:${PORT}/stats`);
  console.log(`イベント API: http://localhost:${PORT}/events`);
  console.log('\n💡 ngrok でトンネルを作成してください:');
  console.log(`   npx ngrok http ${PORT}`);
  console.log('\n📝 SendGrid コンソールで Webhook URL を設定:');
  console.log('   Settings → Mail Settings → Event Webhook');
  console.log('='.repeat(60) + '\n');
});
