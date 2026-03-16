function renderPuzzle(puzzle, container, onSolve) {
  container.innerHTML = '';
  container.dataset.solved = 'false';
  
  const header = document.createElement('div');
  header.className = 'puzzle-header';
  header.innerHTML = `<h3>${getPuzzleTitle(puzzle.puzzleType)}</h3><p>${getPuzzleInstructions(puzzle.puzzleType)}</p>`;
  container.appendChild(header);
  
  const puzzleArea = document.createElement('div');
  puzzleArea.className = 'puzzle-area';
  container.appendChild(puzzleArea);
  
  switch (puzzle.puzzleType) {
    case 'slide':
      renderSlidePuzzle(puzzle, puzzleArea, onSolve);
      break;
    case 'rotate':
      renderRotatePuzzle(puzzle, puzzleArea, onSolve);
      break;
    case 'match':
      renderMatchPuzzle(puzzle, puzzleArea, onSolve);
      break;
    case 'logic':
      renderLogicPuzzle(puzzle, puzzleArea, onSolve);
      break;
  }
}

function getPuzzleTitle(type) {
  const titles = {
    slide: 'Slide Puzzle',
    rotate: 'Rotation Puzzle',
    match: 'Memory Match',
    logic: 'Math Logic'
  };
  return titles[type] || 'Puzzle';
}

function getPuzzleInstructions(type) {
  const instructions = {
    slide: 'Arrange the numbers in order from 1-8',
    rotate: 'Rotate the wheel to match the target angle',
    match: 'Match all the pairs of letters',
    logic: 'Solve the math problem'
  };
  return instructions[type] || 'Solve the puzzle to unlock';
}

function renderSlidePuzzle(puzzle, container, onSolve) {
  const size = 3;
  const numbers = puzzle.solutionState ? puzzle.solutionState.split(',').map(Number) : [];
  
  const grid = document.createElement('div');
  grid.className = 'slide-grid';
  grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  
  const cells = [];
  for (let i = 0; i < size * size; i++) {
    const cell = document.createElement('div');
    cell.className = 'slide-cell';
    if (numbers[i] === 0) {
      cell.classList.add('empty');
    } else {
      cell.textContent = numbers[i];
      cell.addEventListener('click', () => tryMoveSlide(i, numbers, cells, size, onSolve));
    }
    cells.push(cell);
    grid.appendChild(cell);
  }
  
  container.appendChild(grid);
}

function tryMoveSlide(index, numbers, cells, size, onSolve) {
  const emptyIndex = numbers.indexOf(0);
  const row = Math.floor(index / size);
  const col = index % size;
  const emptyRow = Math.floor(emptyIndex / size);
  const emptyCol = emptyIndex % size;
  
  const isAdjacent = (Math.abs(row - emptyRow) + Math.abs(col - emptyCol)) === 1;
  
  if (isAdjacent) {
    [numbers[index], numbers[emptyIndex]] = [numbers[emptyIndex], numbers[index]];
    
    for (let i = 0; i < cells.length; i++) {
      cells[i].className = 'slide-cell';
      if (numbers[i] === 0) {
        cells[i].classList.add('empty');
        cells[i].textContent = '';
      } else {
        cells[i].textContent = numbers[i];
      }
    }
    
    const solved = numbers.slice(0, -1).every((n, i) => n === i + 1);
    if (solved) {
      onSolve(numbers.join(','));
    }
  }
}

function renderRotatePuzzle(puzzle, container, onSolve) {
  const targetAngle = parseInt(puzzle.solutionState);
  
  const wheel = document.createElement('div');
  wheel.className = 'rotate-wheel';
  wheel.style.setProperty('--target-angle', targetAngle + 'deg');
  
  const indicator = document.createElement('div');
  indicator.className = 'rotate-indicator';
  wheel.appendChild(indicator);
  
  const currentAngleDisplay = document.createElement('div');
  currentAngleDisplay.className = 'angle-display';
  currentAngleDisplay.textContent = '0°';
  
  const targetDisplay = document.createElement('div');
  targetDisplay.className = 'target-display';
  targetDisplay.textContent = `Target: ${targetAngle}°`;
  
  const controls = document.createElement('div');
  controls.className = 'rotate-controls';
  
  const minusBtn = document.createElement('button');
  minusBtn.textContent = '-45°';
  minusBtn.onclick = () => rotateWheel(-45);
  
  const plusBtn = document.createElement('button');
  plusBtn.textContent = '+45°';
  plusBtn.onclick = () => rotateWheel(45);
  
  controls.appendChild(minusBtn);
  controls.appendChild(plusBtn);
  
  let currentAngle = 0;
  
  function rotateWheel(delta) {
    currentAngle = (currentAngle + delta + 360) % 360;
    wheel.style.transform = `rotate(${currentAngle}deg)`;
    currentAngleDisplay.textContent = `${currentAngle}°`;
    
    if (currentAngle === targetAngle) {
      onSolve(String(currentAngle));
    }
  }
  
  container.appendChild(wheel);
  container.appendChild(currentAngleDisplay);
  container.appendChild(targetDisplay);
  container.appendChild(controls);
}

function renderMatchPuzzle(puzzle, container, onSolve) {
  const cards = puzzle.solutionState.split(',');
  
  const grid = document.createElement('div');
  grid.className = 'match-grid';
  
  const cardElements = [];
  let flipped = [];
  let matched = 0;
  
  cards.forEach((value, index) => {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.dataset.index = index;
    card.dataset.value = value;
    card.textContent = '?';
    
    card.addEventListener('click', () => {
      if (flipped.length >= 2 || card.classList.contains('flipped') || card.classList.contains('matched')) return;
      
      card.classList.add('flipped');
      card.textContent = value;
      flipped.push({ index, value, card });
      
      if (flipped.length === 2) {
        const [a, b] = flipped;
        if (a.value === b.value) {
          a.card.classList.add('matched');
          b.card.classList.add('matched');
          matched++;
          flipped = [];
          
          if (matched === cards.length / 2) {
            onSolve(cards.join(','));
          }
        } else {
          setTimeout(() => {
            a.card.classList.remove('flipped');
            b.card.classList.remove('flipped');
            a.card.textContent = '?';
            b.card.textContent = '?';
            flipped = [];
          }, 1000);
        }
      }
    });
    
    cardElements.push(card);
    grid.appendChild(card);
  });
  
  container.appendChild(grid);
}

function renderLogicPuzzle(puzzle, container, onSolve) {
  const config = puzzle.puzzleConfig;
  
  const problem = document.createElement('div');
  problem.className = 'logic-problem';
  problem.innerHTML = `<span>${config.num1}</span> <span>${config.op}</span> <span>${config.num2}</span> <span>=</span> <span>?</span>`;
  
  const answerInput = document.createElement('input');
  answerInput.type = 'number';
  answerInput.className = 'logic-input';
  answerInput.placeholder = 'Enter answer';
  
  const submitBtn = document.createElement('button');
  submitBtn.textContent = 'Submit';
  submitBtn.className = 'logic-submit';
  submitBtn.onclick = () => onSolve(answerInput.value);
  
  answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') onSolve(answerInput.value);
  });
  
  container.appendChild(problem);
  container.appendChild(answerInput);
  container.appendChild(submitBtn);
}
