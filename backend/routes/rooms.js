const { Room, FileObject, PuzzleLock, Session } = require('../models');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

module.exports = (upload, FILES_DIR) => {
  const router = require('express').Router();

  router.post('/', (req, res) => {
    try {
      const room = Room.create();
      res.json(room);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const room = Room.get(req.params.id);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      const direction = req.query.dir;
      let permission = 'full';
      if (direction && room.directionalLinks && room.directionalLinks[direction]) {
        permission = direction === 'N' ? 'full' : direction === 'E' ? 'view' : direction === 'S' ? 'download' : 'metadata';
      }
      const files = FileObject.getByRoom(req.params.id);
      res.json({ ...room, files, permission, sessionToken: req.sessionToken });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:id/gravity', (req, res) => {
    try {
      const { gravityMode } = req.body;
      if (!['normal', 'zeroG', 'reverse'].includes(gravityMode)) {
        return res.status(400).json({ error: 'Invalid gravity mode' });
      }
      const room = Room.update(req.params.id, { gravityMode });
      res.json(room);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:id/mirror-mode', (req, res) => {
    try {
      const { enabled } = req.body;
      const room = Room.update(req.params.id, { mirrorMode: enabled });
      res.json(room);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/:id/mirror-status', (req, res) => {
    try {
      const room = Room.get(req.params.id);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      const hasUploaded = Session.hasUploaded(req.sessionToken, req.params.id);
      res.json({ mirrorMode: room.mirrorMode, hasUploaded, required: room.mirrorMode && !hasUploaded });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:id/directional-links', (req, res) => {
    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const links = {
        N: `${baseUrl}#/room/${req.params.id}?dir=N`,
        E: `${baseUrl}#/room/${req.params.id}?dir=E`,
        S: `${baseUrl}#/room/${req.params.id}?dir=S`,
        W: `${baseUrl}#/room/${req.params.id}?dir=W`
      };
      Room.update(req.params.id, { directionalLinks: links });
      res.json(links);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/:id/download-zip', (req, res) => {
    try {
      const room = Room.get(req.params.id);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      const direction = req.query.dir;
      if (direction !== 'S' && direction !== 'N') {
        return res.status(403).json({ error: 'Download not allowed from this direction' });
      }
      const files = FileObject.getByRoom(req.params.id);
      if (files.length === 0) {
        return res.status(404).json({ error: 'No files to download' });
      }
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="room-${req.params.id}.zip"`);
      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(res);
      for (const file of files) {
        if (fs.existsSync(file.storagePath)) {
          archive.file(file.storagePath, { name: file.name });
        }
      }
      archive.finalize();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:id/files', upload.single('file'), (req, res) => {
    try {
      const room = Room.get(req.params.id);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const { generateDnaSignature } = require('../services/dna');
      const crypto = require('crypto');
      const fileData = {
        roomId: req.params.id,
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        hash: crypto.createHash('md5').update(req.file.filename).digest('hex'),
        storagePath: req.file.path,
        dnaSignature: generateDnaSignature(req.file.size, req.file.mimetype)
      };
      const file = FileObject.create(fileData);
      Session.addUploadedRoom(req.sessionToken, req.params.id);
      res.json(file);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:id/puzzle-lock', (req, res) => {
    try {
      const { targetType, targetId } = req.body;
      const { generatePuzzle } = require('../services/puzzles');
      const puzzleData = generatePuzzle(targetType, targetId);
      const puzzle = PuzzleLock.create(puzzleData);
      Room.update(req.params.id, { puzzleLockId: puzzle.id });
      res.json(puzzle);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
