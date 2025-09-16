import express from 'express';
import twilio from 'twilio';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const app = express();
app.use(express.json());
app.use(express.static('public'));

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// OTP保存用（実際にはRedisなどを使用）
const otpStorage = new Map();
const sessions = new Map();

// OTP生成
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// セッショントークン生成
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// OTP送信エンドポイント
app.post('/api/send-otp', async (req, res) => {
  const { phoneNumber } = req.body;
  
  if (!phoneNumber) {
    return res.status(400).json({ 
      success: false, 
      message: '電話番号が必要です' 
    });
  }
  
  // 電話番号の形式チェック
  if (!phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
    return res.status(400).json({
      success: false,
      message: '電話番号の形式が正しくありません（例: +81901234567）'
    });
  }
  
  try {
    // レート制限チェック
    const existing = otpStorage.get(phoneNumber);
    if (existing && Date.now() - existing.createdAt < 60000) {
      return res.status(429).json({
        success: false,
        message: '1分間お待ちください'
      });
    }
    
    // OTP生成
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5分後に期限切れ
    
    // OTP保存
    otpStorage.set(phoneNumber, {
      otp: otp,
      expiresAt: expiresAt,
      attempts: 0,
      createdAt: Date.now()
    });
    
    // SMS送信
    const message = await client.messages.create({
      body: `認証コード: ${otp}\n\n5分以内に入力してください。\nこのコードは他人と共有しないでください。`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    
    console.log(`OTP送信成功: ${phoneNumber} -> ${otp}`);
    
    res.json({
      success: true,
      message: 'OTPを送信しました',
      messageSid: message.sid,
      expiresIn: 300 // 秒単位
    });
    
  } catch (error) {
    console.error('OTP送信エラー:', error);
    
    // Twilioのエラーコードに応じたメッセージ
    let errorMessage = 'OTP送信に失敗しました';
    if (error.code === 21211) {
      errorMessage = '無効な電話番号です';
    } else if (error.code === 21608) {
      errorMessage = '未検証の電話番号です（Twilioトライアルアカウント）';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      errorCode: error.code
    });
  }
});

// OTP検証エンドポイント
app.post('/api/verify-otp', (req, res) => {
  const { phoneNumber, otp } = req.body;
  
  if (!phoneNumber || !otp) {
    return res.status(400).json({
      success: false,
      message: '電話番号とOTPが必要です'
    });
  }
  
  const storedData = otpStorage.get(phoneNumber);
  
  if (!storedData) {
    return res.status(400).json({
      success: false,
      message: 'OTPが見つかりません。再送信してください。'
    });
  }
  
  // 期限切れチェック
  if (Date.now() > storedData.expiresAt) {
    otpStorage.delete(phoneNumber);
    return res.status(400).json({
      success: false,
      message: 'OTPの有効期限が切れました'
    });
  }
  
  // 試行回数チェック
  if (storedData.attempts >= 3) {
    otpStorage.delete(phoneNumber);
    return res.status(429).json({
      success: false,
      message: '試行回数を超えました。新しいOTPを要求してください。'
    });
  }
  
  // OTP検証
  if (storedData.otp === otp) {
    otpStorage.delete(phoneNumber);
    
    // セッション作成
    const token = generateToken();
    sessions.set(token, {
      phoneNumber: phoneNumber,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24時間
    });
    
    console.log(`認証成功: ${phoneNumber}`);
    
    res.json({
      success: true,
      message: '認証成功',
      token: token,
      expiresIn: 86400 // 24時間（秒単位）
    });
  } else {
    storedData.attempts++;
    
    console.log(`OTP不一致: ${phoneNumber} (試行 ${storedData.attempts}/3)`);
    
    res.status(400).json({
      success: false,
      message: 'OTPが正しくありません',
      attemptsRemaining: 3 - storedData.attempts
    });
  }
});

// セッション検証エンドポイント
app.get('/api/session', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '認証が必要です'
    });
  }
  
  const session = sessions.get(token);
  
  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'セッションが無効です'
    });
  }
  
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return res.status(401).json({
      success: false,
      message: 'セッションの有効期限が切れました'
    });
  }
  
  res.json({
    success: true,
    phoneNumber: session.phoneNumber,
    expiresAt: new Date(session.expiresAt).toISOString()
  });
});

// ログアウトエンドポイント
app.post('/api/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    sessions.delete(token);
  }
  
  res.json({
    success: true,
    message: 'ログアウトしました'
  });
});

// 統計情報API
app.get('/api/stats', (req, res) => {
  res.json({
    activeSessions: sessions.size,
    pendingOTPs: otpStorage.size,
    timestamp: new Date().toISOString()
  });
});

// HTML提供
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OTP認証デモ</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .container {
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      width: 100%;
      max-width: 400px;
    }
    
    h1 {
      color: #333;
      text-align: center;
      margin-bottom: 30px;
      font-size: 28px;
    }
    
    input {
      width: 100%;
      padding: 15px;
      margin: 10px 0;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      font-size: 16px;
      transition: border-color 0.3s;
    }
    
    input:focus {
      outline: none;
      border-color: #667eea;
    }
    
    button {
      width: 100%;
      padding: 15px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      margin-top: 15px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
    }
    
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
      transform: none;
    }
    
    .message {
      margin: 20px 0;
      padding: 15px;
      border-radius: 10px;
      text-align: center;
      animation: slideIn 0.3s;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    
    .error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    
    .timer {
      text-align: center;
      color: #666;
      margin: 15px 0;
      font-size: 14px;
    }
    
    .timer.warning {
      color: #e74c3c;
      font-weight: bold;
    }
    
    #step2, #step3 {
      display: none;
    }
    
    .step-indicator {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    
    .step {
      flex: 1;
      text-align: center;
      padding: 10px;
      background: #f0f0f0;
      color: #999;
      font-size: 12px;
      position: relative;
    }
    
    .step.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .step:not(:last-child)::after {
      content: '';
      position: absolute;
      right: -10px;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-left: 10px solid #f0f0f0;
      border-top: 20px solid transparent;
      border-bottom: 20px solid transparent;
      z-index: 1;
    }
    
    .step.active:not(:last-child)::after {
      border-left-color: #764ba2;
    }
    
    .info-text {
      color: #666;
      font-size: 14px;
      text-align: center;
      margin: 10px 0;
    }
    
    .resend-link {
      color: #667eea;
      text-decoration: none;
      cursor: pointer;
      font-weight: bold;
    }
    
    .resend-link:hover {
      text-decoration: underline;
    }
    
    .resend-link:disabled {
      color: #999;
      cursor: not-allowed;
    }
    
    .logout-btn {
      background: #e74c3c;
      margin-top: 20px;
    }
    
    .logout-btn:hover {
      box-shadow: 0 10px 20px rgba(231, 76, 60, 0.4);
    }
    
    .phone-display {
      text-align: center;
      font-size: 18px;
      color: #333;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>OTP認証</h1>
    
    <div class="step-indicator">
      <div class="step active" id="step-indicator-1">電話番号入力</div>
      <div class="step" id="step-indicator-2">コード入力</div>
      <div class="step" id="step-indicator-3">認証完了</div>
    </div>
    
    <div id="step1">
      <input type="tel" id="phoneNumber" placeholder="電話番号 (例: +81901234567)" maxlength="15">
      <p class="info-text">国番号を含めて入力してください</p>
      <button onclick="sendOTP()">認証コードを送信</button>
    </div>
    
    <div id="step2">
      <input type="text" id="otpCode" placeholder="6桁の認証コード" maxlength="6" inputmode="numeric">
      <div class="timer" id="timer"></div>
      <button onclick="verifyOTP()">認証する</button>
      <p class="info-text">
        コードが届かない場合は
        <a class="resend-link" onclick="resendOTP()" id="resendLink">再送信</a>
      </p>
    </div>
    
    <div id="step3">
      <h2 style="text-align: center; color: #28a745; margin: 20px 0;">認証成功！</h2>
      <div class="phone-display" id="phoneDisplay"></div>
      <p class="info-text">ログインしました</p>
      <button class="logout-btn" onclick="logout()">ログアウト</button>
    </div>
    
    <div id="message"></div>
  </div>
  
  <script>
    let timerInterval;
    let phoneNumber;
    let authToken;
    let canResend = false;
    
    async function sendOTP() {
      phoneNumber = document.getElementById('phoneNumber').value;
      
      if (!phoneNumber) {
        showMessage('電話番号を入力してください', 'error');
        return;
      }
      
      if (!phoneNumber.match(/^\\+[1-9]\\d{1,14}$/)) {
        showMessage('電話番号の形式が正しくありません（例: +81901234567）', 'error');
        return;
      }
      
      try {
        const response = await fetch('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber })
        });
        
        const data = await response.json();
        
        if (data.success) {
          showMessage('認証コードを送信しました', 'success');
          moveToStep(2);
          startTimer(data.expiresIn || 300);
          canResend = false;
          setTimeout(() => {
            canResend = true;
            document.getElementById('resendLink').style.display = 'inline';
          }, 60000); // 1分後に再送信可能
        } else {
          showMessage(data.message, 'error');
        }
      } catch (error) {
        showMessage('エラーが発生しました', 'error');
      }
    }
    
    async function verifyOTP() {
      const otp = document.getElementById('otpCode').value;
      
      if (!otp) {
        showMessage('認証コードを入力してください', 'error');
        return;
      }
      
      if (!/^\\d{6}$/.test(otp)) {
        showMessage('6桁の数字を入力してください', 'error');
        return;
      }
      
      try {
        const response = await fetch('/api/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber, otp })
        });
        
        const data = await response.json();
        
        if (data.success) {
          showMessage('認証成功！', 'success');
          authToken = data.token;
          clearInterval(timerInterval);
          document.getElementById('phoneDisplay').textContent = phoneNumber;
          moveToStep(3);
        } else {
          showMessage(data.message + (data.attemptsRemaining ? \` (残り\${data.attemptsRemaining}回)\` : ''), 'error');
        }
      } catch (error) {
        showMessage('エラーが発生しました', 'error');
      }
    }
    
    async function resendOTP() {
      if (!canResend) {
        showMessage('1分間お待ちください', 'error');
        return;
      }
      
      try {
        const response = await fetch('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber })
        });
        
        const data = await response.json();
        
        if (data.success) {
          showMessage('認証コードを再送信しました', 'success');
          startTimer(data.expiresIn || 300);
          canResend = false;
          document.getElementById('resendLink').style.display = 'none';
          setTimeout(() => {
            canResend = true;
            document.getElementById('resendLink').style.display = 'inline';
          }, 60000);
        } else {
          showMessage(data.message, 'error');
        }
      } catch (error) {
        showMessage('エラーが発生しました', 'error');
      }
    }
    
    async function logout() {
      try {
        await fetch('/api/logout', {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${authToken}\`
          }
        });
        
        showMessage('ログアウトしました', 'success');
        setTimeout(() => {
          location.reload();
        }, 1000);
      } catch (error) {
        showMessage('エラーが発生しました', 'error');
      }
    }
    
    function moveToStep(step) {
      // Hide all steps
      document.getElementById('step1').style.display = 'none';
      document.getElementById('step2').style.display = 'none';
      document.getElementById('step3').style.display = 'none';
      
      // Show current step
      document.getElementById(\`step\${step}\`).style.display = 'block';
      
      // Update indicators
      for (let i = 1; i <= 3; i++) {
        const indicator = document.getElementById(\`step-indicator-\${i}\`);
        if (i <= step) {
          indicator.classList.add('active');
        } else {
          indicator.classList.remove('active');
        }
      }
      
      // Focus on input field
      if (step === 2) {
        setTimeout(() => {
          document.getElementById('otpCode').focus();
        }, 100);
      }
    }
    
    function startTimer(seconds) {
      clearInterval(timerInterval);
      document.getElementById('resendLink').style.display = 'none';
      
      let remaining = seconds;
      
      timerInterval = setInterval(() => {
        remaining--;
        
        const minutes = Math.floor(remaining / 60);
        const secs = remaining % 60;
        const timerEl = document.getElementById('timer');
        
        timerEl.textContent = 
          \`有効期限: \${minutes}:\${secs.toString().padStart(2, '0')}\`;
        
        if (remaining <= 60) {
          timerEl.classList.add('warning');
        } else {
          timerEl.classList.remove('warning');
        }
        
        if (remaining <= 0) {
          clearInterval(timerInterval);
          timerEl.textContent = '期限切れ - 再送信してください';
          document.getElementById('resendLink').style.display = 'inline';
        }
      }, 1000);
    }
    
    function showMessage(text, type) {
      const messageDiv = document.getElementById('message');
      messageDiv.className = \`message \${type}\`;
      messageDiv.textContent = text;
      messageDiv.style.display = 'block';
      
      setTimeout(() => {
        messageDiv.style.display = 'none';
      }, 5000);
    }
    
    // Enter key handling
    document.getElementById('phoneNumber').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendOTP();
    });
    
    document.getElementById('otpCode').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') verifyOTP();
    });
    
    // OTP input auto-format
    document.getElementById('otpCode').addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
  </script>
</body>
</html>
  `);
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`OTP server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to test`);
  console.log(`Stats: http://localhost:${PORT}/api/stats`);
});