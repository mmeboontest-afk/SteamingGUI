const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors:{ origin:'*' } });

app.use(cors());
app.use(express.json());

// ── Serve static files ────────────────────────────────────────────────────────
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  console.log('Serving from:', publicDir);
} else {
  console.warn('public/ not found, serving inline fallback');
}

const rooms = {};
const BAD   = ['ไอ้สัตว์','ควาย','เหี้ย','เชี่ย','สัตว์','fuck','shit','bitch','ass'];
const clean = t => t && !BAD.some(w => t.toLowerCase().includes(w.toLowerCase()));

app.get('/health', (_, res) => res.json({ ok:true, time: new Date() }));

// ── Fallback: serve index.html for all routes (SPA) ──────────────────────────
app.get('*', (req, res) => {
  const idx = path.join(publicDir, 'index.html');
  if (fs.existsSync(idx)) {
    res.sendFile(idx);
  } else {
    res.status(404).send('กรุณา upload โฟลเดอร์ public/ ขึ้น GitHub ด้วยนะ');
  }
});

io.on('connection', socket => {
  let sid = null;
  socket.on('join', ({ streamId, user }) => {
    sid = streamId; socket.join(streamId);
    if (!rooms[sid]) rooms[sid] = { viewers:0, msgs:[] };
    rooms[sid].viewers++;
    io.to(sid).emit('viewers', rooms[sid].viewers);
    io.to(sid).emit('system', `${user} เข้าร่วม`);
  });
  socket.on('chat', ({ streamId, user, text }) => {
    if (!clean(user)||!clean(text)) return;
    const m = { id:Date.now(), user, text };
    if (rooms[streamId]) rooms[streamId].msgs = [...(rooms[streamId].msgs||[]).slice(-99), m];
    io.to(streamId).emit('chat', m);
  });
  socket.on('super_thanks', d => io.to(d.streamId).emit('super_thanks', d));
  socket.on('subscribe',    d => io.to(d.streamId).emit('subscribe', d));
  socket.on('safe_screen',  d => io.to(d.streamId).emit('safe_screen', d));
  socket.on('disconnect', () => {
    if (sid && rooms[sid]) {
      rooms[sid].viewers = Math.max(0, rooms[sid].viewers-1);
      io.to(sid).emit('viewers', rooms[sid].viewers);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log("N'Me's SM PWA :" + PORT));
