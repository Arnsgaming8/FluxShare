const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'fluxshare.db');
const fs = require('fs');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      gravityMode TEXT DEFAULT 'normal',
      mirrorMode INTEGER DEFAULT 0,
      cryoFiles TEXT DEFAULT '[]',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      directionalLinks TEXT DEFAULT '{}',
      puzzleLockId TEXT
    );

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
    );

    CREATE TABLE IF NOT EXISTS quantum_links (
      id TEXT PRIMARY KEY,
      targetType TEXT NOT NULL,
      targetId TEXT NOT NULL,
      state INTEGER DEFAULT 1,
      lastAccessed TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS puzzle_locks (
      id TEXT PRIMARY KEY,
      targetType TEXT NOT NULL,
      targetId TEXT NOT NULL,
      puzzleSeed TEXT NOT NULL,
      puzzleType TEXT NOT NULL,
      solutionState TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      sessionToken TEXT PRIMARY KEY,
      uploadedRooms TEXT DEFAULT '[]',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

module.exports = { db, initDatabase };
