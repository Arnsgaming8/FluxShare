const { QuantumLink, Room, FileObject } = require('../models');

module.exports = () => {
  const router = require('express').Router();

  router.post('/', (req, res) => {
    try {
      const { targetType, targetId } = req.body;
      if (!['room', 'file'].includes(targetType)) {
        return res.status(400).json({ error: 'Invalid target type' });
      }
      const link = QuantumLink.create({ targetType, targetId });
      res.json(link);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const link = QuantumLink.get(req.params.id);
      if (!link) {
        return res.status(404).json({ error: 'Quantum link not found' });
      }
      res.json(link);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:id/access', (req, res) => {
    try {
      const link = QuantumLink.get(req.params.id);
      if (!link) {
        return res.status(404).json({ error: 'Quantum link not found' });
      }
      const result = QuantumLink.access(req.params.id);
      let target = null;
      if (link.targetType === 'room') {
        target = Room.get(link.targetId);
      } else if (link.targetType === 'file') {
        target = FileObject.get(link.targetId);
      }
      const stateInfo = {
        1: { access: 'full', description: 'Full access to content' },
        2: { access: 'partial', description: 'Metadata and thumbnail only' },
        3: { access: 'collapsed', description: 'Checksum verification only' }
      };
      res.json({
        ...result,
        stateInfo: stateInfo[result.state],
        target: result.state === 3 ? { hash: target?.hash } : result.state === 2 ? { name: target?.name, size: target?.size, type: target?.type } : target
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
