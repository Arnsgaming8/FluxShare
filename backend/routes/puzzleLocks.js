const { PuzzleLock, Room, FileObject } = require('../models');

module.exports = () => {
  const router = require('express').Router();

  router.post('/', (req, res) => {
    try {
      const { targetType, targetId } = req.body;
      if (!['room', 'file'].includes(targetType)) {
        return res.status(400).json({ error: 'Invalid target type' });
      }
      const { generatePuzzle } = require('../services/puzzles');
      const puzzleData = generatePuzzle(targetType, targetId);
      const puzzle = PuzzleLock.create(puzzleData);
      res.json(puzzle);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const puzzle = PuzzleLock.get(req.params.id);
      if (!puzzle) {
        return res.status(404).json({ error: 'Puzzle lock not found' });
      }
      res.json(puzzle);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:id/solve', (req, res) => {
    try {
      const { solutionAttempt } = req.body;
      const puzzle = PuzzleLock.get(req.params.id);
      if (!puzzle) {
        return res.status(404).json({ error: 'Puzzle lock not found' });
      }
      const result = PuzzleLock.solve(req.params.id, solutionAttempt);
      if (result.success) {
        let target = null;
        if (puzzle.targetType === 'room') {
          target = Room.get(puzzle.targetId);
        } else if (puzzle.targetType === 'file') {
          target = FileObject.get(puzzle.targetId);
        }
        res.json({ success: true, target, targetType: puzzle.targetType });
      } else {
        res.json({ success: false });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
