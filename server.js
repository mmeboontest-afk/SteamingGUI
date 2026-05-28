const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const cors     = require('cors');
const path     = require('path');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors:{ origin:'*' } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};
const BAD   = ['ไอ้สัตว์','ควาย','เหี้ย','เชี่ย','fuck','shit','bitch','ass'];
const clean = t => t && !BAD.some(w => t.toLowerCase().includes(w.toLowerCase()));

// API
app.get('/health', (_, res) => res.json({ ok:true }));
app.get('/api/streams', (req, res) => res.json([]));

// PWA fallback
app.get('*', (_, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

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
