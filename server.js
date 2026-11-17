const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const rdp = require('node-rdpjs');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.get('/', (req, res) => res.send('RDP Cloud Bridge is Running'));

io.on('connection', (socket) => {
  let rdpClient = null;

  socket.on('connect-rdp', (config) => {
    rdpClient = rdp.createClient({
      domain: '',
      userName: config.username,
      password: config.password,
      enablePerf: true,
      autoLogin: true,
      screen: { width: 1280, height: 720 },
      locale: 'en'
    })
    .on('connect', () => socket.emit('rdp-connected'))
    .on('bitmap', (bitmap) => socket.emit('rdp-bitmap', bitmap))
    .on('close', () => socket.emit('rdp-closed'))
    .on('error', (err) => socket.emit('rdp-error', err.message))
    .connect(config.host, 3389);
  });

  socket.on('mouse', (data) => rdpClient && rdpClient.sendPointerEvent(data.x, data.y, data.button, data.isPressed));
  socket.on('keyboard', (data) => rdpClient && rdpClient.sendKeyEventScancode(data.code, data.isPressed));
  socket.on('disconnect', () => rdpClient && rdpClient.close());
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
