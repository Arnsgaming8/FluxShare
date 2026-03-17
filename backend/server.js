const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { initDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 8080;

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const FILES_DIR = path.join(DATA_DIR, 'files');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o755 });
}
if (!fs.existsSync(FILES_DIR)) {
  fs.mkdirSync(FILES_DIR, { recursive: true, mode: 0o755 });
}

initDatabase();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Session-Token']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'docs')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, FILES_DIR),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 * 1024 } });

app.use((req, res, next) => {
  let sessionToken = req.cookies?.sessionToken || req.headers['x-session-token'];
  if (!sessionToken) {
    sessionToken = require('crypto').randomUUID();
    res.cookie('sessionToken', sessionToken, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: false });
  }
  req.sessionToken = sessionToken;
  next();
});

const roomsRouter = require('./routes/rooms')(upload, FILES_DIR);
const filesRouter = require('./routes/files')(upload, FILES_DIR);
const quantumLinksRouter = require('./routes/quantumLinks');
const puzzleLocksRouter = require('./routes/puzzleLocks');

app.use('/api/rooms', roomsRouter);
app.use('/api/files', filesRouter);
app.use('/api/quantum-links', quantumLinksRouter);
app.use('/api/puzzle-locks', puzzleLocksRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'docs', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`FluxShare API running on port ${PORT}`);
});
