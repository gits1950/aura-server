// ============================================================
// Aura Dental Care — Real-time Socket.io Server
// Deploy on Railway / Render / any Node.js host
// ============================================================

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');

const app    = express();
const server = http.createServer(app);

// ── CORS: allow your deployed frontend URL + localhost ──────
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['*'];                          // set in Railway env vars

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST']
  },
  // Allow both WebSocket and polling (for restrictive networks)
  transports: ['websocket', 'polling']
});

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

// ── Health check endpoint ───────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: '🟢 Aura Dental Socket Server Running',
    uptime: Math.floor(process.uptime()) + 's',
    connections: io.engine.clientsCount,
    time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  });
});

// ── REST fallback for prescription-printed ──────────────────
app.post('/api/prescription-printed', (req, res) => {
  const { visitId } = req.body;
  io.emit('prescriptionPrinted', { visitId });
  console.log(`🖨️  [REST] prescriptionPrinted → visitId: ${visitId}`);
  res.json({ ok: true });
});

// ── Track connected clients ─────────────────────────────────
let connectedClients = {};

// ── Socket.io events ────────────────────────────────────────
io.on('connection', (socket) => {
  const clientInfo = {
    id:       socket.id,
    ip:       socket.handshake.address,
    role:     socket.handshake.query.role     || 'unknown',
    userName: socket.handshake.query.userName || 'Unknown',
    connectedAt: new Date().toISOString()
  };

  connectedClients[socket.id] = clientInfo;

  console.log(`🔌 Connected  | ${clientInfo.role.padEnd(12)} | ${clientInfo.userName.padEnd(20)} | ${socket.id}`);

  // ── Tell everyone who just joined ──────────────────────────
  io.emit('clientList', Object.values(connectedClients));

  // ──────────────────────────────────────────────────────────
  // EVENT: Doctor sends prescription to Reception
  // ──────────────────────────────────────────────────────────
  socket.on('sendPrescription', (data) => {
    console.log(`📋 sendPrescription | patient: ${data.patientName} | doctor: ${data.doctorName}`);
    // Broadcast to ALL other clients (reception will receive it)
    socket.broadcast.emit('newPrescription', {
      visitId:     data.visitId,
      patientName: data.patientName,
      doctorName:  data.doctorName,
      time:        data.time || new Date().toISOString()
    });
  });

  // ──────────────────────────────────────────────────────────
  // EVENT: Reception confirms payment
  // ──────────────────────────────────────────────────────────
  socket.on('confirmPayment', (data) => {
    console.log(`💰 confirmPayment  | patient: ${data.patientName} | ₹${data.amount}`);
    socket.broadcast.emit('paymentConfirmed', {
      visitId:     data.visitId,
      patientName: data.patientName,
      amount:      data.amount,
      time:        data.time || new Date().toISOString()
    });
  });

  // ──────────────────────────────────────────────────────────
  // EVENT: Prescription printed at reception
  // ──────────────────────────────────────────────────────────
  socket.on('prescriptionPrinted', (data) => {
    console.log(`🖨️  prescriptionPrinted | visitId: ${data.visitId}`);
    socket.broadcast.emit('prescriptionPrinted', {
      visitId: data.visitId,
      time:    new Date().toISOString()
    });
  });

  // ──────────────────────────────────────────────────────────
  // EVENT: Doctor started consultation
  // ──────────────────────────────────────────────────────────
  socket.on('doctorStartedConsultation', (data) => {
    console.log(`👨‍⚕️  doctorStartedConsultation | ${data.doctorName} → ${data.patientName}`);
    socket.broadcast.emit('doctorStartedConsultation', {
      doctorName:  data.doctorName,
      patientName: data.patientName,
      time:        new Date().toISOString()
    });
  });

  // ──────────────────────────────────────────────────────────
  // EVENT: Queue updated (patient added/moved/completed)
  // ──────────────────────────────────────────────────────────
  socket.on('queueUpdated', (data) => {
    console.log(`🔄 queueUpdated | action: ${data.action} | patient: ${data.patientName}`);
    socket.broadcast.emit('queueUpdated', {
      action:      data.action,      // 'added' | 'moved' | 'completed'
      patientName: data.patientName,
      doctorName:  data.doctorName,
      time:        new Date().toISOString()
    });
  });

  // ──────────────────────────────────────────────────────────
  // EVENT: New patient registered
  // ──────────────────────────────────────────────────────────
  socket.on('newPatientRegistered', (data) => {
    console.log(`🧑 newPatientRegistered | ${data.patientName}`);
    socket.broadcast.emit('newPatientRegistered', {
      patientName: data.patientName,
      patientId:   data.patientId,
      time:        new Date().toISOString()
    });
  });

  // ──────────────────────────────────────────────────────────
  // EVENT: Appointment booked
  // ──────────────────────────────────────────────────────────
  socket.on('appointmentBooked', (data) => {
    console.log(`📅 appointmentBooked | ${data.patientName} → Dr. ${data.doctorName}`);
    socket.broadcast.emit('appointmentBooked', {
      patientName: data.patientName,
      doctorName:  data.doctorName,
      date:        data.date,
      time:        data.time
    });
  });

  // ──────────────────────────────────────────────────────────
  // DISCONNECT
  // ──────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const info = connectedClients[socket.id] || {};
    console.log(`❌ Disconnected | ${(info.role||'?').padEnd(12)} | ${(info.userName||'?').padEnd(20)} | ${socket.id}`);
    delete connectedClients[socket.id];
    io.emit('clientList', Object.values(connectedClients));
  });
});

// ── Start server ────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 Aura Dental Socket Server`);
  console.log(`   Port     : ${PORT}`);
  console.log(`   Time     : ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
  console.log(`   Health   : http://localhost:${PORT}/\n`);
});