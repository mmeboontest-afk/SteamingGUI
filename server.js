const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors    = require('cors');
const app     = express();
const server  = http.createServer(app);
const io      = new Server(server, { cors: { origin:'*' } });
app.use(cors()); app.use(express.json());
const rooms = {};
const BAD   = ['ไอ้สัตว์','ควาย','เหี้ย','เชี่ย','fuck','shit','bitch'];
const clean = t => !BAD.some(w => t.toLowerCase().includes(w.toLowerCase()));
app.get('/',       (_, res) => res.json({ status:'ok' }));
app.get('/health', (_, res) => res.json({ ok:true }));
io.on('connection', socket => {
  let sid = null;
  socket.on('join', ({ streamId, user }) => {
    sid = streamId; socket.join(streamId);
    if (!rooms[sid]) rooms[sid] = { viewers:0, msgs:[] };
    rooms[sid].viewers++;
    io.to(sid).emit('viewers', rooms[sid].viewers);
    io.to(sid).emit('system', `${user} เข้าร่วม Live`);
  });
  socket.on('chat', ({ streamId, user, text }) => {
    if (!clean(user)||!clean(text)) return;
    const m = { id:Date.now(), user, text };
    if (rooms[streamId]) rooms[streamId].msgs = [...(rooms[streamId].msgs||[]).slice(-99), m];
    io.to(streamId).emit('chat', m);
  });
  socket.on('super_thanks', d => io.to(d.streamId).emit('super_thanks', d));
  socket.on('subscribe',    d => io.to(d.streamId).emit('subscribe', d));
  socket.on('disconnect', () => {
    if (sid && rooms[sid]) { rooms[sid].viewers = Math.max(0, rooms[sid].viewers-1); io.to(sid).emit('viewers', rooms[sid].viewers); }
  });
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log("N'Me's SM :" + PORT));
