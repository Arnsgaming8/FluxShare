const { v4: uuidv4 } = require('uuid');
const { getDb, saveDb, runQuery, runOne, run } = require('./db');

function generateId() {
  return uuidv4().replace(/-/g, '').substring(0, 12);
}

const Room = {
  create(data = {}) {
    const id = generateId();
    run(`
      INSERT INTO rooms (id, gravityMode, mirrorMode, directionalLinks)
      VALUES (?, ?, ?, ?)
    `, [id, data.gravityMode || 'normal', data.mirrorMode ? 1 : 0, '{}']);
    saveDb();
    return this.get(id);
  },

  get(id) {
    const result = runOne('SELECT * FROM rooms WHERE id = ?', [id]);
    if (result) {
      result.directionalLinks = JSON.parse(result.directionalLinks || '{}');
      result.cryoFiles = JSON.parse(result.cryoFiles || '[]');
      result.mirrorMode = !!result.mirrorMode;
    }
    return result;
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
      run(`UPDATE rooms SET ${fields.join(', ')} WHERE id = ?`, values);
      saveDb();
    }
    return this.get(id);
  },

  delete(id) {
    run('DELETE FROM rooms WHERE id = ?', [id]);
    saveDb();
  }
};

const FileObject = {
  create(data) {
    const id = generateId();
    run(`
      INSERT INTO files (id, roomId, name, size, type, hash, storagePath, dnaSignature, parentFileId, isFrozen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, data.roomId, data.name, data.size, data.type, data.hash,
      data.storagePath, data.dnaSignature, data.parentFileId || null, data.isFrozen ? 1 : 0
    ]);
    saveDb();
    return this.get(id);
  },

  get(id) {
    const result = runOne('SELECT * FROM files WHERE id = ?', [id]);
    if (result) {
      result.isFrozen = !!result.isFrozen;
    }
    return result;
  },

  getByRoom(roomId) {
    return runQuery('SELECT * FROM files WHERE roomId = ? ORDER BY createdAt DESC', [roomId]);
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
      run(`UPDATE files SET ${fields.join(', ')} WHERE id = ?`, values);
      saveDb();
    }
    return this.get(id);
  },

  delete(id) {
    const file = this.get(id);
    if (file && file.isFrozen) {
      throw new Error('Cannot delete frozen file');
    }
    run('DELETE FROM files WHERE id = ?', [id]);
    saveDb();
    return file;
  }
};

const QuantumLink = {
  create(data) {
    const id = generateId();
    run(`
      INSERT INTO quantum_links (id, targetType, targetId, state)
      VALUES (?, ?, ?, ?)
    `, [id, data.targetType, data.targetId, 1]);
    saveDb();
    return this.get(id);
  },

  get(id) {
    return runOne('SELECT * FROM quantum_links WHERE id = ?', [id]);
  },

  access(id) {
    const link = this.get(id);
    if (!link) return null;
    const newState = Math.min(link.state + 1, 3);
    run('UPDATE quantum_links SET state = ?, lastAccessed = datetime("now") WHERE id = ?', [newState, id]);
    saveDb();
    return { ...this.get(id), previousState: link.state };
  }
};

const PuzzleLock = {
  create(data) {
    const id = generateId();
    run(`
      INSERT INTO puzzle_locks (id, targetType, targetId, puzzleSeed, puzzleType, solutionState)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, data.targetType, data.targetId, data.puzzleSeed, data.puzzleType, data.solutionState]);
    saveDb();
    return this.get(id);
  },

  get(id) {
    return runOne('SELECT * FROM puzzle_locks WHERE id = ?', [id]);
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
    let session = runOne('SELECT * FROM sessions WHERE sessionToken = ?', [sessionToken]);
    if (!session) {
      run('INSERT INTO sessions (sessionToken) VALUES (?)', [sessionToken]);
      session = runOne('SELECT * FROM sessions WHERE sessionToken = ?', [sessionToken]);
      saveDb();
    }
    session.uploadedRooms = JSON.parse(session.uploadedRooms || '[]');
    return session;
  },

  addUploadedRoom(sessionToken, roomId) {
    const session = this.get(sessionToken);
    if (!session.uploadedRooms.includes(roomId)) {
      session.uploadedRooms.push(roomId);
      run('UPDATE sessions SET uploadedRooms = ? WHERE sessionToken = ?', 
        [JSON.stringify(session.uploadedRooms), sessionToken]);
      saveDb();
    }
    return session;
  },

  hasUploaded(sessionToken, roomId) {
    const session = this.get(sessionToken);
    return session.uploadedRooms.includes(roomId);
  }
};

module.exports = { Room, FileObject, QuantumLink, PuzzleLock, Session, generateId };
