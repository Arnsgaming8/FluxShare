const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { initDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 8080;

const DATA_DIR = process.env.FLUXSHARE_DATA_DIR || path.join(process.cwd(), 'data');
const FILES_DIR = path.join(DATA_DIR, 'files');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o755 });
}
if (!fs.existsSync(FILES_DIR)) {
  fs.mkdirSync(FILES_DIR, { recursive: true, mode: 0o755 });
}

initDatabase();

// CORS - must be FIRST
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Origin: ${req.headers.origin}`);
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Session-Token, Authorization, Accept');
  res.header('Access-Control-Max-Age', '3600');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  if (req.method === 'HEAD') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

app.use((req, res, next) => {
  let sessionToken = req.cookies?.sessionToken || req.headers['x-session-token'];
  if (!sessionToken) {
    sessionToken = require('crypto').randomUUID();
    res.cookie('sessionToken', sessionToken, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: false });
  }
  req.sessionToken = sessionToken;
  next();
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, FILES_DIR),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 * 1024 } });

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

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working!' });
});

app.post('/api/test', (req, res) => {
  res.json({ success: true, message: 'POST works!' });
});

app.use(express.static(path.join(__dirname, '..', 'docs')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'docs', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`FluxShare API running on port ${PORT}`);
});
