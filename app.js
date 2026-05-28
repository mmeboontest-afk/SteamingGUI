// ── N'Me's SM PWA — Full App Logic ──────────────────────────────────────────
const SERVER = window.location.origin;
const socket = io(SERVER);
const BAD    = ['ไอ้สัตว์','ควาย','เหี้ย','เชี่ย','สัตว์','fuck','shit','bitch','ass'];
const isBad  = t => t && BAD.some(w => t.toLowerCase().includes(w.toLowerCase()));

let user         = null;
let streams      = JSON.parse(localStorage.getItem('streams')||'[]');
let currentStream= null;
let countdownId  = null;
let elapsedId    = null;
let elapsedSecs  = 0;
let safeHoldId   = null;
let toolbarShown = true;
let GAMES        = ['Roblox','Minecraft','Mini World','Project Sekai'];
let currentGame  = 0;
let isFastFwd    = false;

// ── Register Service Worker ──────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(()=>{});
}

// ── Screens ──────────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function showHome()   { renderStreams(); showScreen('homeScreen'); }
function showSetup()  { resetSetup(); showScreen('setupScreen'); }
function showEnd()    { showScreen('endScreen'); startEndCountdown(); }

// ── Auth ─────────────────────────────────────────────────────────────────────
function googleLogin() {
  // Google OAuth popup
  const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';  // ← ใส่ตรงนี้
  const redirect  = encodeURIComponent(window.location.origin + '/auth/callback');
  window.open(`https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&redirect_uri=${redirect}&response_type=token&scope=profile+email`,'_self');
}
function guestLogin() {
  user = { name:'Guest', picture: null, id: 'guest_' + Date.now() };
  localStorage.setItem('user', JSON.stringify(user));
  applyUser();
  showHome();
}

// Check if returning from OAuth
window.addEventListener('load', () => {
  const hash   = window.location.hash;
  const stored = localStorage.getItem('user');

  if (hash.includes('access_token')) {
    const token = hash.match(/access_token=([^&]+)/)?.[1];
    if (token) {
      fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).then(u => {
        user = u;
        localStorage.setItem('user', JSON.stringify(u));
        applyUser();
        showHome();
        window.location.hash = '';
      });
      return;
    }
  }
  if (stored) {
    user = JSON.parse(stored);
    applyUser();
    showHome();
  }
});

function applyUser() {
  if (!user) return;
  const name = user.given_name || user.name || 'Creator';
  document.getElementById('helloName').textContent = `สวัสดี, ${name} 👋`;
  if (user.picture) document.getElementById('userAvatar').src = user.picture;
}

// ── Streams ───────────────────────────────────────────────────────────────────
function renderStreams() {
  streams = JSON.parse(localStorage.getItem('streams')||'[]');
  const list = document.getElementById('streamList');
  if (!streams.length) {
    list.innerHTML = '<p class="empty-msg">ยังไม่มี Live — กด "สร้าง Live ใหม่" เลย!</p>';
    return;
  }
  list.innerHTML = streams.map(s => `
    <div class="stream-card" onclick="openStream('${s.id}')">
      ${s.thumbnail ? `<img class="stream-thumb" src="${s.thumbnail}">` : '<div class="stream-thumb" style="background:#e8d5f5;display:flex;align-items:center;justify-content:center;font-size:32px">🎮</div>'}
      <div class="stream-info">
        <div class="stream-title">[Live🎉] ${s.title}</div>
        <div class="stream-time">${formatDate(s.scheduledAt)}</div>
        <div class="stream-desc">${s.description||''}</div>
      </div>
      <button class="del-btn" onclick="event.stopPropagation();deleteStream('${s.id}')">🗑️</button>
    </div>
  `).join('');
}

function openStream(id) {
  currentStream = streams.find(s => s.id === id);
  if (!currentStream) return;
  const diff = new Date(currentStream.scheduledAt) - Date.now();
  document.getElementById('waitStreamName').textContent = '[Live🎉] ' + currentStream.title;
  socket.emit('join', { streamId: currentStream.id, user: user?.name || 'Host' });
  if (diff > 30*60*1000) {
    showNotif('⚠️ Live จะเปิดห้องรอ 30 นาทีก่อนเวลา');
  }
  showScreen('waitingScreen');
  startCountdown();
}

function deleteStream(id) {
  if (!confirm('ลบ Live นี้?')) return;
  streams = streams.filter(s => s.id !== id);
  localStorage.setItem('streams', JSON.stringify(streams));
  renderStreams();
}

// ── Setup ─────────────────────────────────────────────────────────────────────
function resetSetup() {
  document.getElementById('setupTitle').value = '';
  document.getElementById('setupDesc').value  = '';
  document.getElementById('thumbPreview').style.display = 'none';
  document.getElementById('thumbPlaceholder').style.display = 'block';
  document.getElementById('setupPreview').textContent = '[Live🎉] ชื่อของคุณ';
  // set default date = 1 hour from now
  const d = new Date(Date.now() + 3600000);
  document.getElementById('setupDate').value = d.toISOString().slice(0,16);
}
function updatePreview() {
  const t = document.getElementById('setupTitle').value;
  document.getElementById('setupPreview').textContent = `[Live🎉] ${t||'ชื่อของคุณ'}`;
}
function pickThumb() { document.getElementById('thumbInput').click(); }
let thumbData = null;
function onThumbChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    thumbData = ev.target.result;
    const img = document.getElementById('thumbPreview');
    img.src = thumbData; img.style.display = 'block';
    document.getElementById('thumbPlaceholder').style.display = 'none';
  };
  reader.readAsDataURL(file);
}
function saveLive() {
  const title = document.getElementById('setupTitle').value.trim();
  if (!title) { alert('กรุณาใส่ชื่อ Live'); return; }
  const dateVal = document.getElementById('setupDate').value;
  if (!dateVal) { alert('กรุณาเลือกวันและเวลา'); return; }
  const stream = {
    id: Date.now().toString(),
    title, thumbnail: thumbData||null,
    description: document.getElementById('setupDesc').value.trim(),
    scheduledAt: new Date(dateVal).toISOString(),
    createdAt:   new Date().toISOString(),
  };
  streams.push(stream);
  localStorage.setItem('streams', JSON.stringify(streams));
  thumbData = null;
  showHome();
}

// ── Countdown ─────────────────────────────────────────────────────────────────
function startCountdown() {
  clearInterval(countdownId);
  countdownId = setInterval(() => {
    const diff = Math.max(0, Math.floor((new Date(currentStream.scheduledAt) - Date.now()) / 1000));
    const h = Math.floor(diff/3600), m = Math.floor(diff%3600/60), s = diff%60;
    document.getElementById('timerDisplay').textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
    if (diff <= 0) {
      clearInterval(countdownId);
      document.getElementById('waitingContent').style.display = 'none';
      document.getElementById('readyContent').style.display = 'block';
    }
  }, 1000);
}
function fastForward() {
  if (isFastFwd) return;
  isFastFwd = true;
  document.getElementById('ffBtn').textContent = '⚡ กำลังเร่ง...';
  const el    = document.getElementById('timerDisplay');
  let current = Math.max(0, Math.floor((new Date(currentStream.scheduledAt) - Date.now()) / 1000));
  const step  = Math.ceil(current / 30);
  clearInterval(countdownId);
  const fid = setInterval(() => {
    current = Math.max(0, current - step);
    const h = Math.floor(current/3600), m = Math.floor(current%3600/60), s = current%60;
    el.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
    if (current <= 0) {
      clearInterval(fid); isFastFwd = false;
      document.getElementById('waitingContent').style.display = 'none';
      document.getElementById('readyContent').style.display   = 'block';
    }
  }, 100);
}
function startLive() {
  clearInterval(countdownId);
  elapsedSecs = 0;
  showScreen('liveScreen');
  clearInterval(elapsedId);
  elapsedId = setInterval(() => {
    elapsedSecs++;
    const h = Math.floor(elapsedSecs/3600), m = Math.floor(elapsedSecs%3600/60), s = elapsedSecs%60;
    document.getElementById('liveElapsed').textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
  }, 1000);
  // แจ้งเตือนทุกชั่วโมง
  setInterval(() => {
    if (new Date().getMinutes() === 0) {
      const h = new Date().getHours();
      const msg = `ตอนนี้เวลา ${h} นาฬิกา`;
      showNotif(msg);
      speak(msg);
    }
  }, 60000);
}

// ── Game Switcher ─────────────────────────────────────────────────────────────
function switchGame(idx, btn) {
  currentGame = idx;
  document.querySelectorAll('.game-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('gameLabelTxt').textContent = GAMES[idx];
  document.getElementById('gameNameBig').textContent  = GAMES[idx];
}

// ── Toolbar ───────────────────────────────────────────────────────────────────
function toggleToolbar() {
  const tb  = document.getElementById('liveToolbar');
  const btn = document.getElementById('showToolbarBtn');
  toolbarShown = !toolbarShown;
  tb.style.display  = toolbarShown ? 'block' : 'none';
  btn.style.display = toolbarShown ? 'none'  : 'block';
}

// ── Safe Screen ───────────────────────────────────────────────────────────────
function showSafe(isFault) {
  const ss = document.getElementById('safeScreen');
  ss.classList.add('show');
  document.getElementById('safeIcon').textContent     = isFault ? '📡' : '🛡️';
  document.getElementById('safeTitle').textContent    = isFault ? 'Connection faulty' : 'กำลังเตรียมตัวรอแป๊บนะ';
  const sub = document.getElementById('safeSub');
  sub.style.display = isFault ? 'block' : 'none';
}
const holdBtn = document.getElementById('holdBtn');
holdBtn.addEventListener('pointerdown', () => {
  safeHoldId = setTimeout(() => hideSafe(), 10000);
});
holdBtn.addEventListener('pointerup',    () => clearTimeout(safeHoldId));
holdBtn.addEventListener('pointerleave', () => clearTimeout(safeHoldId));
function hideSafe() { document.getElementById('safeScreen').classList.remove('show'); }

// ── End Screen ────────────────────────────────────────────────────────────────
function confirmEnd() {
  if (confirm('ปิด Live ใช่ไหม?')) {
    clearInterval(elapsedId);
    showEnd();
  }
}
function startEndCountdown() {
  let n = 60;
  document.getElementById('endCountdown').textContent = n;
  const id = setInterval(() => {
    n--; document.getElementById('endCountdown').textContent = n;
    if (n <= 0) { clearInterval(id); showHome(); }
  }, 1000);
}

// ── Notification Banner ───────────────────────────────────────────────────────
const NOTIF_COLORS = ['#ffd6e0','#e8d5f5','#dbeafe','#d1fae5'];
let notifColorIdx  = 0, notifTimer = null;
function showNotif(msg, dur=5000) {
  const el = document.getElementById('notifBanner');
  clearTimeout(notifTimer);
  notifColorIdx = (notifColorIdx+1) % NOTIF_COLORS.length;
  el.style.backgroundColor = NOTIF_COLORS[notifColorIdx];
  el.textContent   = msg;
  el.style.display = 'block';
  el.style.opacity = '1';
  notifTimer = setTimeout(() => { el.style.opacity='0'; setTimeout(()=>el.style.display='none', 300); }, dur);
}

// ── TTS ───────────────────────────────────────────────────────────────────────
function speak(text, lang='th-TH') {
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  window.speechSynthesis.speak(u);
}

// ── Chat via Socket ───────────────────────────────────────────────────────────
const NAME_COLORS = ['#f472b6','#a78bfa','#60a5fa','#34d399','#fb923c'];
let nameColorMap  = {};
function nameColor(n) {
  if (!nameColorMap[n]) nameColorMap[n] = NAME_COLORS[Object.keys(nameColorMap).length % NAME_COLORS.length];
  return nameColorMap[n];
}
function appendChat(container, user, text) {
  if (isBad(user) || isBad(text)) return;
  const div  = document.createElement('div');
  div.className = 'chat-msg';
  div.innerHTML = `<span class="chat-name" style="color:${nameColor(user)}">${esc(user)}: </span>${esc(text)}`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

socket.on('chat', ({ user, text }) => {
  appendChat(document.getElementById('liveChatBody'), user, text);
  appendChat(document.getElementById('waitChatBody'), user, text);
  appendChat(document.getElementById('safeChatBody'), user, text);
});
socket.on('system', msg => {
  ['liveChatBody','waitChatBody','safeChatBody'].forEach(id => {
    appendChat(document.getElementById(id), 'ระบบ', msg);
  });
});
socket.on('viewers',      n   => document.getElementById('viewersCount').textContent = `👁 ${n}`);
socket.on('super_thanks', ({ user: u, amount }) => {
  const display = isBad(u) ? 'ขอบคุณที่ Super Thanks คร๊าบ!' : `${u} ให้ Super Thanks! ${amount}`;
  showNotif(`💛 ${display}`); speak(display);
});
socket.on('subscribe', ({ user: u, role, months }) => {
  if (isBad(u)) return;
  const msg = `${u} เป็น ${role} ${months} เดือนแล้วน้า!!`;
  showNotif(`🌟 ${msg}`); speak(msg);
});
socket.on('safe_screen', ({ fault }) => showSafe(fault));

// ── Draggable Chat ────────────────────────────────────────────────────────────
(function makeDraggable() {
  const el     = document.getElementById('liveChat');
  const handle = document.getElementById('liveChatHandle');
  let ox=0, oy=0, sx=0, sy=0, dragging=false;
  handle.addEventListener('pointerdown', e => {
    dragging=true; ox=el.offsetLeft; oy=el.offsetTop;
    sx=e.clientX; sy=e.clientY; handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener('pointermove', e => {
    if (!dragging) return;
    el.style.right='auto'; el.style.bottom='auto';
    el.style.left = (ox+e.clientX-sx)+'px';
    el.style.top  = (oy+e.clientY-sy)+'px';
  });
  handle.addEventListener('pointerup', () => dragging=false);
})();

// ── Utils ─────────────────────────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2,'0'); }
function formatDate(iso) {
  const d = new Date(iso);
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()+543} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
