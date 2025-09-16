#!/usr/bin/env node

// Voice課題3: 会議室システム

import express from 'express';
import twilio from 'twilio';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config({ path: '../../.env' });

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const VoiceResponse = twilio.twiml.VoiceResponse;
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// 会議室データ保存
const CONFERENCE_FILE = 'conference-rooms.json';
let conferenceRooms = {};

// 会議室設定
const ROOM_SETTINGS = {
  // 公開会議室（誰でも参加可能）
  public: {
    '1000': { name: '一般会議室A', maxParticipants: 10, requirePin: false },
    '1001': { name: '一般会議室B', maxParticipants: 5, requirePin: false },
    '1002': { name: 'オープンディスカッション', maxParticipants: 20, requirePin: false }
  },
  // プライベート会議室（PIN必要）
  private: {
    '2000': { name: '役員会議室', maxParticipants: 8, pin: '1234', requirePin: true },
    '2001': { name: 'プロジェクト会議室', maxParticipants: 6, pin: '5678', requirePin: true },
    '2002': { name: 'セキュア会議室', maxParticipants: 4, pin: '9999', requirePin: true }
  }
};

// データ読み込み
async function loadConferenceData() {
  try {
    const data = await fs.readFile(CONFERENCE_FILE, 'utf8');
    conferenceRooms = JSON.parse(data);
    console.log(`既存の会議室データを読み込みました`);
  } catch (error) {
    console.log('新しい会議室データファイルを作成します');
    conferenceRooms = {};
  }
}

// データ保存
async function saveConferenceData() {
  try {
    await fs.writeFile(CONFERENCE_FILE, JSON.stringify(conferenceRooms, null, 2));
    console.log(`会議室データを保存しました`);
  } catch (error) {
    console.error('データ保存エラー:', error.message);
  }
}

// 会議室情報の取得
function getRoomInfo(roomCode) {
  // 公開会議室をチェック
  if (ROOM_SETTINGS.public[roomCode]) {
    return { 
      ...ROOM_SETTINGS.public[roomCode], 
      type: 'public',
      code: roomCode 
    };
  }
  
  // プライベート会議室をチェック
  if (ROOM_SETTINGS.private[roomCode]) {
    return { 
      ...ROOM_SETTINGS.private[roomCode], 
      type: 'private',
      code: roomCode 
    };
  }
  
  return null;
}

// 会議室参加者数の更新
function updateRoomParticipants(roomCode, action, participantInfo) {
  if (!conferenceRooms[roomCode]) {
    conferenceRooms[roomCode] = {
      participants: [],
      history: [],
      createdAt: new Date().toISOString()
    };
  }
  
  const room = conferenceRooms[roomCode];
  
  switch (action) {
    case 'join':
      room.participants.push({
        ...participantInfo,
        joinedAt: new Date().toISOString()
      });
      room.history.push({
        action: 'join',
        participant: participantInfo.callSid,
        timestamp: new Date().toISOString()
      });
      break;
      
    case 'leave':
      room.participants = room.participants.filter(p => p.callSid !== participantInfo.callSid);
      room.history.push({
        action: 'leave',
        participant: participantInfo.callSid,
        timestamp: new Date().toISOString()
      });
      break;
  }
  
  saveConferenceData();
}

// メイン音声応答
app.post('/voice', (req, res) => {
  const from = req.body.From;
  const callSid = req.body.CallSid;
  
  console.log(`会議室システム着信: ${from} (CallSid: ${callSid})`);
  
  const twiml = new VoiceResponse();
  
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, 'お電話ありがとうございます。Twilio会議室システムです。');
  
  twiml.pause({ length: 1 });
  
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, '4桁の会議室番号を入力してください。一般会議室は1000番台、プライベート会議室は2000番台です。');
  
  const gather = twiml.gather({
    numDigits: 4,
    action: '/conference/join',
    method: 'POST',
    timeout: 15
  });
  
  // タイムアウト時
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, '会議室番号の入力時間を過ぎました。もう一度お試しください。');
  
  twiml.redirect('/voice');
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// 会議室参加処理
app.post('/conference/join', (req, res) => {
  const roomCode = req.body.Digits;
  const from = req.body.From;
  const callSid = req.body.CallSid;
  
  console.log(`会議室参加要求: ${roomCode} from ${from}`);
  
  const twiml = new VoiceResponse();
  const roomInfo = getRoomInfo(roomCode);
  
  if (!roomInfo) {
    twiml.say({
      voice: 'Polly.Mizuki',
      language: 'ja-JP'
    }, '存在しない会議室番号です。もう一度正しい番号を入力してください。');
    
    twiml.redirect('/voice');
    res.type('text/xml');
    res.send(twiml.toString());
    return;
  }
  
  // 参加者数制限チェック
  const currentParticipants = conferenceRooms[roomCode]?.participants?.length || 0;
  if (currentParticipants >= roomInfo.maxParticipants) {
    twiml.say({
      voice: 'Polly.Mizuki',
      language: 'ja-JP'
    }, `申し訳ございません。${roomInfo.name}は満室です。最大${roomInfo.maxParticipants}名まで参加可能です。`);
    
    twiml.hangup();
    res.type('text/xml');
    res.send(twiml.toString());
    return;
  }
  
  if (roomInfo.requirePin) {
    // PIN認証が必要
    twiml.say({
      voice: 'Polly.Mizuki',
      language: 'ja-JP'
    }, `${roomInfo.name}にアクセスしています。4桁のPINコードを入力してください。`);
    
    const gather = twiml.gather({
      numDigits: 4,
      action: `/conference/verify-pin?room=${roomCode}`,
      method: 'POST',
      timeout: 10
    });
    
    // タイムアウト時
    twiml.say({
      voice: 'Polly.Mizuki',
      language: 'ja-JP'
    }, 'PIN入力時間を過ぎました。');
    
    twiml.hangup();
    
  } else {
    // 公開会議室：直接参加
    twiml.redirect(`/conference/enter?room=${roomCode}`);
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// PIN認証
app.post('/conference/verify-pin', (req, res) => {
  const pin = req.body.Digits;
  const roomCode = req.query.room;
  const from = req.body.From;
  
  console.log(`PIN認証: ${roomCode}, PIN: ${pin} from ${from}`);
  
  const twiml = new VoiceResponse();
  const roomInfo = getRoomInfo(roomCode);
  
  if (!roomInfo || pin !== roomInfo.pin) {
    twiml.say({
      voice: 'Polly.Mizuki',
      language: 'ja-JP'
    }, 'PINコードが正しくありません。');
    
    twiml.pause({ length: 1 });
    
    twiml.say({
      voice: 'Polly.Mizuki',
      language: 'ja-JP'
    }, 'もう一度4桁のPINコードを入力してください。');
    
    const gather = twiml.gather({
      numDigits: 4,
      action: `/conference/verify-pin?room=${roomCode}`,
      method: 'POST',
      timeout: 10
    });
    
    // 2回目の失敗で切断
    twiml.say({
      voice: 'Polly.Mizuki',
      language: 'ja-JP'
    }, 'アクセスが拒否されました。');
    
    twiml.hangup();
    
  } else {
    // PIN認証成功
    twiml.redirect(`/conference/enter?room=${roomCode}`);
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// 会議室入室
app.post('/conference/enter', (req, res) => {
  const roomCode = req.query.room;
  const from = req.body.From;
  const callSid = req.body.CallSid;
  
  console.log(`会議室入室: ${roomCode} from ${from}`);
  
  const twiml = new VoiceResponse();
  const roomInfo = getRoomInfo(roomCode);
  
  // 参加者情報を記録
  const participantInfo = {
    callSid: callSid,
    phoneNumber: from,
    joinedAt: new Date().toISOString()
  };
  
  updateRoomParticipants(roomCode, 'join', participantInfo);
  
  twiml.say({
    voice: 'Polly.Mizuki',
    language: 'ja-JP'
  }, `${roomInfo.name}に接続します。`);
  
  // 現在の参加者数をお知らせ
  const currentCount = conferenceRooms[roomCode]?.participants?.length || 1;
  
  if (currentCount === 1) {
    twiml.say({
      voice: 'Polly.Mizuki',
      language: 'ja-JP'
    }, 'あなたが最初の参加者です。他の参加者の接続をお待ちください。');
  } else {
    twiml.say({
      voice: 'Polly.Mizuki',
      language: 'ja-JP'
    }, `現在${currentCount}名が参加中です。`);
  }
  
  // 会議室に接続
  const dial = twiml.dial();
  
  dial.conference({
    startConferenceOnEnter: true,
    endConferenceOnExit: false,
    waitUrl: 'https://demo.twilio.com/docs/classic.mp3',
    maxParticipants: roomInfo.maxParticipants,
    statusCallback: `${req.protocol}://${req.get('host')}/conference/status?room=${roomCode}`,
    statusCallbackEvent: ['start', 'end', 'join', 'leave'],
    statusCallbackMethod: 'POST',
    record: 'record-from-start', // 録音開始
    recordingStatusCallback: `${req.protocol}://${req.get('host')}/conference/recording-status?room=${roomCode}`
  }, `room-${roomCode}`);
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// 会議室ステータス更新
app.post('/conference/status', (req, res) => {
  const roomCode = req.query.room;
  const event = req.body.StatusCallbackEvent;
  const callSid = req.body.CallSid;
  const from = req.body.From;
  
  console.log(`会議室ステータス更新: ${roomCode}, イベント: ${event}, CallSid: ${callSid}`);
  
  switch (event) {
    case 'participant-join':
      console.log(`参加者入室: ${from} in room ${roomCode}`);
      break;
      
    case 'participant-leave':
      console.log(`参加者退室: ${from} in room ${roomCode}`);
      updateRoomParticipants(roomCode, 'leave', { callSid });
      break;
      
    case 'conference-start':
      console.log(`会議開始: room ${roomCode}`);
      break;
      
    case 'conference-end':
      console.log(`会議終了: room ${roomCode}`);
      // 会議終了時に参加者リストをクリア
      if (conferenceRooms[roomCode]) {
        conferenceRooms[roomCode].participants = [];
        conferenceRooms[roomCode].endedAt = new Date().toISOString();
        saveConferenceData();
      }
      break;
  }
  
  res.sendStatus(200);
});

// 録音ステータス更新
app.post('/conference/recording-status', (req, res) => {
  const roomCode = req.query.room;
  const recordingUrl = req.body.RecordingUrl;
  const recordingSid = req.body.RecordingSid;
  const duration = req.body.RecordingDuration;
  
  console.log(`会議録音完了: room ${roomCode}, 時間: ${duration}秒, URL: ${recordingUrl}`);
  
  // 録音情報を保存
  if (conferenceRooms[roomCode]) {
    if (!conferenceRooms[roomCode].recordings) {
      conferenceRooms[roomCode].recordings = [];
    }
    
    conferenceRooms[roomCode].recordings.push({
      sid: recordingSid,
      url: recordingUrl,
      duration: duration,
      createdAt: new Date().toISOString()
    });
    
    saveConferenceData();
  }
  
  res.sendStatus(200);
});

// 会議室一覧API
app.get('/rooms', (req, res) => {
  const allRooms = { ...ROOM_SETTINGS.public, ...ROOM_SETTINGS.private };
  
  const roomList = Object.entries(allRooms).map(([code, info]) => {
    const currentData = conferenceRooms[code];
    const currentParticipants = currentData?.participants?.length || 0;
    
    return {
      code: code,
      name: info.name,
      type: ROOM_SETTINGS.public[code] ? 'public' : 'private',
      maxParticipants: info.maxParticipants,
      currentParticipants: currentParticipants,
      isActive: currentParticipants > 0,
      requirePin: info.requirePin
    };
  });
  
  res.json({
    rooms: roomList,
    totalActive: roomList.filter(r => r.isActive).length
  });
});

// 特定会議室の詳細API
app.get('/rooms/:code', (req, res) => {
  const roomCode = req.params.code;
  const roomInfo = getRoomInfo(roomCode);
  
  if (!roomInfo) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  const roomData = conferenceRooms[roomCode] || {
    participants: [],
    history: [],
    recordings: []
  };
  
  res.json({
    ...roomInfo,
    ...roomData,
    currentParticipants: roomData.participants.length
  });
});

// 管理画面
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>会議室システム</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 1200px; 
          margin: 50px auto; 
          padding: 20px; 
        }
        .room {
          border: 1px solid #ddd;
          padding: 15px;
          margin: 10px 0;
          border-radius: 5px;
        }
        .active { border-left: 4px solid #28a745; }
        .inactive { border-left: 4px solid #6c757d; }
        .private { background: #fff3cd; }
        .public { background: #d1ecf1; }
        .participants {
          margin: 10px 0;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 3px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background: #f8f9fa;
        }
      </style>
    </head>
    <body>
      <h1>Voice課題3: 会議室システム</h1>
      
      <h2>テスト方法</h2>
      <ol>
        <li>Twilioコンソールでこのサーバーの <code>/voice</code> をWebhook URLに設定</li>
        <li>設定した電話番号に電話をかける</li>
        <li>4桁の会議室番号を入力（下記参照）</li>
        <li>プライベート会議室の場合はPINコードを入力</li>
        <li>複数の電話から同じ会議室に接続してテスト</li>
      </ol>
      
      <h2>利用可能な会議室</h2>
      <div id="rooms">読み込み中...</div>
      
      <h2>会議室設定</h2>
      <table>
        <tr>
          <th>番号</th>
          <th>名前</th>
          <th>種類</th>
          <th>最大参加者</th>
          <th>PIN</th>
        </tr>
        <tr><td>1000</td><td>一般会議室A</td><td>公開</td><td>10名</td><td>なし</td></tr>
        <tr><td>1001</td><td>一般会議室B</td><td>公開</td><td>5名</td><td>なし</td></tr>
        <tr><td>1002</td><td>オープンディスカッション</td><td>公開</td><td>20名</td><td>なし</td></tr>
        <tr><td>2000</td><td>役員会議室</td><td>プライベート</td><td>8名</td><td>1234</td></tr>
        <tr><td>2001</td><td>プロジェクト会議室</td><td>プライベート</td><td>6名</td><td>5678</td></tr>
        <tr><td>2002</td><td>セキュア会議室</td><td>プライベート</td><td>4名</td><td>9999</td></tr>
      </table>
      
      <script>
        async function loadRooms() {
          try {
            const response = await fetch('/rooms');
            const data = await response.json();
            
            const container = document.getElementById('rooms');
            
            container.innerHTML = \`
              <p>アクティブな会議室: \${data.totalActive}個</p>
              \${data.rooms.map(room => \`
                <div class="room \${room.isActive ? 'active' : 'inactive'} \${room.type}">
                  <h3>\${room.name} (部屋番号: \${room.code})</h3>
                  <p>
                    種類: \${room.type === 'public' ? '公開' : 'プライベート'} | 
                    参加者: \${room.currentParticipants}/\${room.maxParticipants}名 |
                    状態: \${room.isActive ? 'アクティブ' : '待機中'}
                  </p>
                  \${room.requirePin ? '<p><strong>PIN認証必要</strong></p>' : ''}
                  \${room.currentParticipants > 0 ? 
                    '<div class="participants">現在通話中の会議室です</div>' : 
                    ''
                  }
                </div>
              \`).join('')}
            \`;
          } catch (error) {
            document.getElementById('rooms').innerHTML = 
              '<p>データの読み込みに失敗しました</p>';
          }
        }
        
        // 初回読み込み
        loadRooms();
        
        // 15秒ごとに自動更新
        setInterval(loadRooms, 15000);
      </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3102;

// 起動時にデータ読み込み
loadConferenceData().then(() => {
  app.listen(PORT, () => {
    console.log(`Voice Challenge 3 server running on port ${PORT}`);
    console.log(`Webhook URL: http://localhost:${PORT}/voice`);
    console.log(`Management interface: http://localhost:${PORT}/`);
    console.log(`Use ngrok to expose: npx ngrok http ${PORT}`);
    
    console.log('\n利用可能な会議室:');
    console.log('公開会議室: 1000, 1001, 1002 (PIN不要)');
    console.log('プライベート会議室: 2000 (PIN:1234), 2001 (PIN:5678), 2002 (PIN:9999)');
  });
});