const { FileObject, Room, Session } = require('../models');
const path = require('path');
const fs = require('fs');

module.exports = (upload, FILES_DIR) => {
  const router = require('express').Router();

  router.get('/:id', (req, res) => {
    try {
      const file = FileObject.get(req.params.id);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      const parentFile = file.parentFileId ? FileObject.get(file.parentFileId) : null;
      res.json({ ...file, parentFile });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/:id/download', (req, res) => {
    try {
      const file = FileObject.get(req.params.id);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      if (file.isFrozen) {
        return res.status(403).json({ error: 'File is frozen' });
      }
      const room = Room.get(file.roomId);
      if (room.mirrorMode) {
        const hasUploaded = Session.hasUploaded(req.sessionToken, file.roomId);
        if (!hasUploaded) {
          return res.status(403).json({ error: 'Mirror mode: you must upload a file to download', requiresUpload: true });
        }
      }
      if (!fs.existsSync(file.storagePath)) {
        return res.status(404).json({ error: 'File not found on disk' });
      }
      res.download(file.storagePath, file.name);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:id/freeze', (req, res) => {
    try {
      const { freezeHash } = req.body;
      const file = FileObject.get(req.params.id);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      if (file.isFrozen) {
        return res.status(400).json({ error: 'File already frozen' });
      }
      const updated = FileObject.update(req.params.id, { isFrozen: true, freezeHash });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:id/thaw', (req, res) => {
    try {
      const { freezeHash } = req.body;
      const file = FileObject.get(req.params.id);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      if (!file.isFrozen) {
        return res.status(400).json({ error: 'File not frozen' });
      }
      if (file.freezeHash !== freezeHash) {
        return res.status(403).json({ error: 'Invalid freeze hash' });
      }
      const updated = FileObject.update(req.params.id, { isFrozen: false, freezeHash: null });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete('/:id', (req, res) => {
    try {
      const file = FileObject.delete(req.params.id);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      if (fs.existsSync(file.storagePath)) {
        fs.unlinkSync(file.storagePath);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
