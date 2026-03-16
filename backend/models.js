const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { db } = require('./db');

function generateId() {
  return uuidv4().replace(/-/g, '').substring(0, 12);
}

const Room = {
  create(data = {}) {
    const id = generateId();
    const stmt = db.prepare(`
      INSERT INTO rooms (id, gravityMode, mirrorMode, directionalLinks)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, data.gravityMode || 'normal', data.mirrorMode ? 1 : 0, JSON.stringify({}));
    return this.get(id);
  },

  get(id) {
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
    if (room) {
      room.directionalLinks = JSON.parse(room.directionalLinks || '{}');
      room.cryoFiles = JSON.parse(room.cryoFiles || '[]');
      room.mirrorMode = !!room.mirrorMode;
    }
    return room;
  },

  update(id, data) {
    const fields = [];
    const values = [];
    if (data.gravityMode !== undefined) {
      fields.push('gravityMode = ?');
      values.push(data.gravityMode);
    }
    if (data.mirrorMode !== undefined) {
      fields.push('mirrorMode = ?');
      values.push(data.mirrorMode ? 1 : 0);
    }
    if (data.directionalLinks !== undefined) {
      fields.push('directionalLinks = ?');
      values.push(JSON.stringify(data.directionalLinks));
    }
    if (data.puzzleLockId !== undefined) {
      fields.push('puzzleLockId = ?');
      values.push(data.puzzleLockId);
    }
    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE rooms SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
    return this.get(id);
  },

  delete(id) {
    db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
  }
};

const FileObject = {
  create(data) {
    const id = generateId();
    const stmt = db.prepare(`
      INSERT INTO files (id, roomId, name, size, type, hash, storagePath, dnaSignature, parentFileId, isFrozen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id, data.roomId, data.name, data.size, data.type, data.hash,
      data.storagePath, data.dnaSignature, data.parentFileId || null, data.isFrozen ? 1 : 0
    );
    return this.get(id);
  },

  get(id) {
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(id);
    if (file) {
      file.isFrozen = !!file.isFrozen;
    }
    return file;
  },

  getByRoom(roomId) {
    return db.prepare('SELECT * FROM files WHERE roomId = ? ORDER BY createdAt DESC').all(roomId);
  },

  update(id, data) {
    const fields = [];
    const values = [];
    if (data.isFrozen !== undefined) {
      fields.push('isFrozen = ?');
      values.push(data.isFrozen ? 1 : 0);
    }
    if (data.freezeHash !== undefined) {
      fields.push('freezeHash = ?');
      values.push(data.freezeHash);
    }
    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE files SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
    return this.get(id);
  },

  delete(id) {
    const file = this.get(id);
    if (file && file.isFrozen) {
      throw new Error('Cannot delete frozen file');
    }
    db.prepare('DELETE FROM files WHERE id = ?').run(id);
    return file;
  }
};

const QuantumLink = {
  create(data) {
    const id = generateId();
    const stmt = db.prepare(`
      INSERT INTO quantum_links (id, targetType, targetId, state)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, data.targetType, data.targetId, 1);
    return this.get(id);
  },

  get(id) {
    return db.prepare('SELECT * FROM quantum_links WHERE id = ?').get(id);
  },

  access(id) {
    const link = this.get(id);
    if (!link) return null;
    const newState = Math.min(link.state + 1, 3);
    db.prepare('UPDATE quantum_links SET state = ?, lastAccessed = CURRENT_TIMESTAMP WHERE id = ?').run(newState, id);
    return { ...this.get(id), previousState: link.state };
  }
};

const PuzzleLock = {
  create(data) {
    const id = generateId();
    const stmt = db.prepare(`
      INSERT INTO puzzle_locks (id, targetType, targetId, puzzleSeed, puzzleType, solutionState)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, data.targetType, data.targetId, data.puzzleSeed, data.puzzleType, data.solutionState);
    return this.get(id);
  },

  get(id) {
    return db.prepare('SELECT * FROM puzzle_locks WHERE id = ?').get(id);
  },

  solve(id, attempt) {
    const puzzle = this.get(id);
    if (!puzzle) return { success: false, error: 'Puzzle not found' };
    if (puzzle.solutionState === attempt) {
      return { success: true };
    }
    return { success: false };
  }
};

const Session = {
  get(sessionToken) {
    let session = db.prepare('SELECT * FROM sessions WHERE sessionToken = ?').get(sessionToken);
    if (!session) {
      db.prepare('INSERT INTO sessions (sessionToken) VALUES (?)').run(sessionToken);
      session = db.prepare('SELECT * FROM sessions WHERE sessionToken = ?').get(sessionToken);
    }
    session.uploadedRooms = JSON.parse(session.uploadedRooms || '[]');
    return session;
  },

  addUploadedRoom(sessionToken, roomId) {
    const session = this.get(sessionToken);
    if (!session.uploadedRooms.includes(roomId)) {
      session.uploadedRooms.push(roomId);
      db.prepare('UPDATE sessions SET uploadedRooms = ? WHERE sessionToken = ?')
        .run(JSON.stringify(session.uploadedRooms), sessionToken);
    }
    return session;
  },

  hasUploaded(sessionToken, roomId) {
    const session = this.get(sessionToken);
    return session.uploadedRooms.includes(roomId);
  }
};

module.exports = { Room, FileObject, QuantumLink, PuzzleLock, Session, generateId };
