const crypto = require('crypto');

const PUZZLE_TYPES = ['slide', 'rotate', 'match', 'logic'];

function generatePuzzle(targetType, targetId) {
  const puzzleType = PUZZLE_TYPES[Math.floor(Math.random() * PUZZLE_TYPES.length)];
  const puzzleSeed = crypto.randomBytes(16).toString('hex');
  
  let solutionState = '';
  let puzzleConfig = {};
  
  switch (puzzleType) {
    case 'slide':
      const size = 3;
      const numbers = [];
      for (let i = 1; i < size * size; i++) numbers.push(i);
      numbers.push(0);
      for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
      }
      solutionState = numbers.join(',');
      puzzleConfig = { size, solved: numbers.map((n, i) => n === (i + 1) % 9 ? 1 : 0).reduce((a, b) => a + b, 0) };
      break;
    case 'rotate':
      const angle = Math.floor(Math.random() * 4) * 90;
      solutionState = String(angle);
      puzzleConfig = { targetAngle: angle, currentAngle: 0 };
      break;
    case 'match':
      const pairs = ['A', 'B', 'C', 'D', 'E', 'F'];
      const shuffled = [...pairs, ...pairs].sort(() => Math.random() - 0.5);
      solutionState = shuffled.join(',');
      puzzleConfig = { cards: shuffled, flipped: [] };
      break;
    case 'logic':
      const num1 = Math.floor(Math.random() * 10) + 1;
      const num2 = Math.floor(Math.random() * 10) + 1;
      const ops = ['+', '-', '*'];
      const op = ops[Math.floor(Math.random() * ops.length)];
      let answer;
      switch (op) {
        case '+': answer = num1 + num2; break;
        case '-': answer = num1 - num2; break;
        case '*': answer = num1 * num2; break;
      }
      solutionState = String(answer);
      puzzleConfig = { num1, num2, op };
      break;
  }
  
  return {
    targetType,
    targetId,
    puzzleSeed,
    puzzleType,
    solutionState,
    puzzleConfig
  };
}

module.exports = { generatePuzzle, PUZZLE_TYPES };
