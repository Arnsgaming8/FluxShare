const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const dbPath = path.join(DATA_DIR, 'fluxshare.db');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
}

let db = null;

async function loadDb() {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

function saveDb() {
  if (db && fs.existsSync(dir)) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

async function initDatabase() {
  await loadDb();
  
  db.run(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      gravityMode TEXT DEFAULT 'normal',
      mirrorMode INTEGER DEFAULT 0,
      cryoFiles TEXT DEFAULT '[]',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      directionalLinks TEXT DEFAULT '{}',
      puzzleLockId TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      roomId TEXT NOT NULL,
      name TEXT NOT NULL,
      size INTEGER NOT NULL,
      type TEXT NOT NULL,
      hash TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      isFrozen INTEGER DEFAULT 0,
      freezeHash TEXT,
      dnaSignature TEXT,
      parentFileId TEXT,
      storagePath TEXT NOT NULL,
      FOREIGN KEY (roomId) REFERENCES rooms(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS quantum_links (
      id TEXT PRIMARY KEY,
      targetType TEXT NOT NULL,
      targetId TEXT NOT NULL,
      state INTEGER DEFAULT 1,
      lastAccessed TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS puzzle_locks (
      id TEXT PRIMARY KEY,
      targetType TEXT NOT NULL,
      targetId TEXT NOT NULL,
      puzzleSeed TEXT NOT NULL,
      puzzleType TEXT NOT NULL,
      solutionState TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      sessionToken TEXT PRIMARY KEY,
      uploadedRooms TEXT DEFAULT '[]',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  saveDb();
}

module.exports = { getDb, initDatabase, saveDb };
