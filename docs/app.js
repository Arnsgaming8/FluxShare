let currentRoom = null;
let physics = null;

function init() {
  console.log('FluxShare initializing...');
  const hash = window.location.hash.slice(1) || '/';
  console.log('Route:', hash);
  route(hash);
  
  window.addEventListener('hashchange', () => {
    route(window.location.hash.slice(1) || '/');
  });
}

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('load', () => {
  if (!document.getElementById('app').innerHTML) {
    init();
  }
});
setTimeout(init, 1000);

function route(path) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  
  if (path === '/' || path === '') {
    renderLandingPage(app);
  } else if (path.startsWith('/room/')) {
    const id = path.split('/')[2];
    const params = new URLSearchParams(path.split('?')[1] || '');
    const direction = params.get('dir');
    renderRoomPage(app, id, direction);
  } else if (path.startsWith('/file/')) {
    const id = path.split('/')[2];
    renderFilePage(app, id);
  } else if (path.startsWith('/quantum/')) {
    const id = path.split('/')[2];
    renderQuantumPage(app, id);
  } else if (path.startsWith('/puzzle/')) {
    const id = path.split('/')[2];
    renderPuzzlePage(app, id);
  } else {
    app.innerHTML = '<div class="error">Page not found</div>';
  }
}

function renderLandingPage(app) {
  app.innerHTML = `
    <div class="landing">
      <div class="hero">
        <h1>FluxShare</h1>
        <p class="tagline">Physics-Driven, No-Signup File Sharing</p>
      </div>
      
      <div class="features">
        <div class="feature">
          <h3>Gravity Rooms</h3>
          <p>Files float and fall with physics simulation</p>
        </div>
        <div class="feature">
          <h3>Quantum Links</h3>
          <p>State-changing URLs that evolve on access</p>
        </div>
        <div class="feature">
          <h3>Directional Sharing</h3>
          <p>N/E/S/W permission links</p>
        </div>
        <div class="feature">
          <h3>Cryo-Storage</h3>
          <p>Freeze files immutably</p>
        </div>
        <div class="feature">
          <h3>Puzzle-Unlock</h3>
          <p>Micro-puzzles instead of passwords</p>
        </div>
        <div class="feature">
          <h3>Mirror-Mode</h3>
          <p>Download requires upload</p>
        </div>
      </div>
      
      <div class="actions">
        <button id="createRoomBtn" class="btn btn-primary">Create Room</button>
        <button id="enterRoomBtn" class="btn btn-secondary">Enter Room via Link</button>
      </div>
    </div>
  `;
  
  document.getElementById('createRoomBtn').onclick = async () => {
    const btn = document.getElementById('createRoomBtn');
    btn.textContent = 'Creating...';
    
    try {
      const response = await fetch('https://fluxshare-0vjn.onrender.com/api/rooms', {
        method: 'POST',
        mode: 'cors'
      });
      
      const room = await response.json();
      console.log('Room:', room);
      
      if (room.id) {
        // Navigate to room page directly using href
        window.location.href = 'https://arnsgaming8.github.io/FluxShare/#/room/' + room.id;
      } else {
        btn.textContent = 'No room ID';
      }
    } catch (e) {
      btn.textContent = 'Error';
    }
  };
  
  document.getElementById('enterRoomBtn').onclick = () => {
    const id = prompt('Enter Room ID:');
    if (id) {
      window.location.hash = `/room/${id}`;
    }
  };
}

async function renderRoomPage(app, id, direction) {
  app.innerHTML = '<div class="loading">Loading room...</div>';
  
  try {
    currentRoom = await api.getRoom(id, direction);
    
    app.innerHTML = `
      <div class="room-page">
        <header class="room-header">
          <a href="#/" class="back-link">← Back</a>
          <h2>Room: ${currentRoom.id}</h2>
          ${direction ? `<span class="direction-badge">Direction: ${direction}</span>` : ''}
          <span class="permission-badge">${currentRoom.permission || 'full'}</span>
        </header>
        
        <div class="room-content">
          <aside class="room-controls">
            <div class="control-section">
              <h3>Gravity Mode</h3>
              <select id="gravitySelect">
                <option value="normal" ${currentRoom.gravityMode === 'normal' ? 'selected' : ''}>Normal</option>
                <option value="zeroG" ${currentRoom.gravityMode === 'zeroG' ? 'selected' : ''}>Zero-G</option>
                <option value="reverse" ${currentRoom.gravityMode === 'reverse' ? 'selected' : ''}>Reverse</option>
              </select>
            </div>
            
            <div class="control-section">
              <h3>Mirror Mode</h3>
              <label class="toggle">
                <input type="checkbox" id="mirrorToggle" ${currentRoom.mirrorMode ? 'checked' : ''}>
                <span>Require upload to download</span>
              </label>
            </div>
            
            <div class="control-section">
              <h3>Upload</h3>
              <input type="file" id="fileInput">
              <button id="uploadBtn" class="btn btn-small">Upload File</button>
            </div>
            
            <div class="control-section">
              <h3>Sharing</h3>
              <button id="directionalBtn" class="btn btn-small">Generate Directional Links</button>
              <button id="quantumBtn" class="btn btn-small">Create Quantum Link</button>
              <button id="puzzleBtn" class="btn btn-small">Add Puzzle Lock</button>
            </div>
          </aside>
          
          <main class="gravity-canvas" id="gravityCanvas"></main>
          
          <aside class="file-list">
            <h3>Files (${currentRoom.files.length})</h3>
            <div id="filesContainer"></div>
          </aside>
        </div>
      </div>
    `;
    
    setupRoomControls();
    renderFiles(currentRoom.files);
    initPhysics();
    
  } catch (e) {
    app.innerHTML = `<div class="error">Error: ${e.message}</div>`;
  }
}

function setupRoomControls() {
  document.getElementById('gravitySelect').onchange = async (e) => {
    try {
      await api.setGravity(currentRoom.id, e.target.value);
      if (physics) {
        physics.setGravity(e.target.value);
      }
    } catch (err) {
      showError(err.message);
    }
  };
  
  document.getElementById('mirrorToggle').onchange = async (e) => {
    try {
      await api.toggleMirrorMode(currentRoom.id, e.target.checked);
    } catch (err) {
      showError(err.message);
    }
  };
  
  document.getElementById('uploadBtn').onclick = async () => {
    const input = document.getElementById('fileInput');
    if (!input.files[0]) {
      showError('Please select a file');
      return;
    }
    
    try {
      const file = await api.uploadFile(currentRoom.id, input.files[0]);
      currentRoom.files.unshift(file);
      renderFiles(currentRoom.files);
      input.value = '';
    } catch (err) {
      showError(err.message);
    }
  };
  
  document.getElementById('directionalBtn').onclick = async () => {
    try {
      const links = await api.generateDirectionalLinks(currentRoom.id);
      showModal('Directional Links', `
        <p>Share these links with different permissions:</p>
        <ul>
          <li><strong>N (North):</strong> Full access - <a href="${links.N}" target="_blank">${links.N}</a></li>
          <li><strong>E (East):</strong> View only - <a href="${links.E}" target="_blank">${links.E}</a></li>
          <li><strong>S (South):</strong> Download only - <a href="${links.S}" target="_blank">${links.S}</a></li>
          <li><strong>W (West):</strong> Metadata only - <a href="${links.W}" target="_blank">${links.W}</a></li>
        </ul>
      `);
    } catch (err) {
      showError(err.message);
    }
  };
  
  document.getElementById('quantumBtn').onclick = async () => {
    try {
      const link = await api.createQuantumLink('room', currentRoom.id);
      showModal('Quantum Link', `
        <p>This quantum link changes state on each access:</p>
        <p><a href="#/quantum/${link.id}" target="_blank">${window.location.origin}/#/quantum/${link.id}</a></p>
        <p>State 1: Full access → State 2: Partial → State 3: Collapsed</p>
      `);
    } catch (err) {
      showError(err.message);
    }
  };
  
  document.getElementById('puzzleBtn').onclick = async () => {
    try {
      const puzzle = await api.createPuzzleLock('room', currentRoom.id);
      showModal('Puzzle Lock Created', `
        <p>Add a puzzle to protect this room:</p>
        <p><a href="#/puzzle/${puzzle.id}" target="_blank">${window.location.origin}/#/puzzle/${puzzle.id}</a></p>
      `);
    } catch (err) {
      showError(err.message);
    }
  };
}

function renderFiles(files) {
  const container = document.getElementById('filesContainer');
  container.innerHTML = '';
  
  files.forEach(file => {
    const fileEl = document.createElement('div');
    fileEl.className = 'file-card';
    fileEl.innerHTML = `
      <div class="file-name">${file.name}</div>
      <div class="file-size">${formatSize(file.size)}</div>
      <div class="file-actions">
        ${file.isFrozen ? '<span class="frozen-badge">FROZEN</span>' : ''}
        <button class="btn-icon download-btn" title="Download">↓</button>
        <button class="btn-icon freeze-btn" title="${file.isFrozen ? 'Thaw' : 'Freeze'}">${file.isFrozen ? '🔥' : '❄️'}</button>
        <button class="btn-icon quantum-btn" title="Quantum Link">⚛</button>
        <button class="btn-icon delete-btn" title="Delete">×</button>
      </div>
    `;
    
    fileEl.querySelector('.download-btn').onclick = async () => {
      try {
        const blob = await api.downloadFile(file.id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        showError(err.message);
      }
    };
    
    fileEl.querySelector('.freeze-btn').onclick = async () => {
      if (file.isFrozen) {
        const hash = prompt('Enter freeze phrase to thaw:');
        if (hash) {
          try {
            await api.thawFile(file.id, hash);
            file.isFrozen = false;
            renderFiles(currentRoom.files);
          } catch (err) {
            showError(err.message);
          }
        }
      } else {
        const hash = prompt('Enter freeze phrase (save this!):');
        if (hash) {
          try {
            await api.freezeFile(file.id, hash);
            file.isFrozen = true;
            renderFiles(currentRoom.files);
          } catch (err) {
            showError(err.message);
          }
        }
      }
    };
    
    fileEl.querySelector('.quantum-btn').onclick = async () => {
      try {
        const link = await api.createQuantumLink('file', file.id);
        showModal('Quantum Link', `
          <p>Quantum link for ${file.name}:</p>
          <p><a href="#/quantum/${link.id}" target="_blank">${window.location.origin}/#/quantum/${link.id}</a></p>
        `);
      } catch (err) {
        showError(err.message);
      }
    };
    
    fileEl.querySelector('.delete-btn').onclick = async () => {
      if (confirm('Delete this file?')) {
        try {
          await api.deleteFile(file.id);
          currentRoom.files = currentRoom.files.filter(f => f.id !== file.id);
          renderFiles(currentRoom.files);
        } catch (err) {
          showError(err.message);
        }
      }
    };
    
    container.appendChild(fileEl);
    
    if (physics) {
      physics.addElement(fileEl, Math.random() * 400, Math.random() * 300);
    }
  });
}

function initPhysics() {
  const canvas = document.getElementById('gravityCanvas');
  if (!canvas) return;
  
  physics = new PhysicsEngine(canvas);
  physics.setGravity(currentRoom.gravityMode);
  physics.start();
  
  currentRoom.files.forEach((file, i) => {
    const card = document.querySelector('.file-card');
    if (card) {
      physics.addElement(card, Math.random() * (canvas.offsetWidth - 160), Math.random() * (canvas.offsetHeight - 100));
    }
  });
}

async function renderFilePage(app, id) {
  app.innerHTML = '<div class="loading">Loading file...</div>';
  
  try {
    const file = await api.getFile(id);
    
    app.innerHTML = `
      <div class="file-page">
        <header>
          <a href="#/room/${file.roomId}" class="back-link">← Back to Room</a>
        </header>
        <div class="file-detail">
          <h2>${file.name}</h2>
          <div class="file-meta">
            <span>Size: ${formatSize(file.size)}</span>
            <span>Type: ${file.type}</span>
            <span>Hash: ${file.hash}</span>
          </div>
          <div id="dnaContainer"></div>
          <div class="file-actions">
            <button id="downloadBtn" class="btn btn-primary">Download</button>
            <button id="freezeBtn" class="btn">${file.isFrozen ? 'Thaw' : 'Freeze'}</button>
          </div>
        </div>
      </div>
    `;
    
    renderDnaSignature(file.dnaSignature, document.getElementById('dnaContainer'), {
      showParent: !!file.parentFile,
      parentDna: file.parentFile?.dnaSignature
    });
    
    document.getElementById('downloadBtn').onclick = async () => {
      try {
        const blob = await api.downloadFile(file.id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        showError(err.message);
      }
    };
    
    document.getElementById('freezeBtn').onclick = async () => {
      if (file.isFrozen) {
        const hash = prompt('Enter freeze phrase:');
        if (hash) {
          try {
            await api.thawFile(file.id, hash);
            window.location.reload();
          } catch (err) {
            showError(err.message);
          }
        }
      } else {
        const hash = prompt('Enter freeze phrase:');
        if (hash) {
          try {
            await api.freezeFile(file.id, hash);
            window.location.reload();
          } catch (err) {
            showError(err.message);
          }
        }
      }
    };
    
  } catch (e) {
    app.innerHTML = `<div class="error">Error: ${e.message}</div>`;
  }
}

async function renderQuantumPage(app, id) {
  app.innerHTML = '<div class="loading">Accessing quantum link...</div>';
  
  try {
    const result = await api.accessQuantumLink(id);
    
    app.innerHTML = `
      <div class="quantum-page">
        <header>
          <a href="#/" class="back-link">← Home</a>
        </header>
        <div class="quantum-state">
          <h2>Quantum Link</h2>
          <div class="state-indicator state-${result.state}">
            <div class="state-number">${result.state}</div>
            <div class="state-name">${result.stateInfo?.access || 'unknown'}</div>
          </div>
          <p>${result.stateInfo?.description || ''}</p>
          
          <div class="quantum-target">
            ${result.state === 1 ? 
              `<a href="#/room/${result.target?.id}" class="btn btn-primary">Go to Room</a>` :
              result.state === 2 ?
              `<div class="partial-info">
                <p>Name: ${result.target?.name || 'N/A'}</p>
                <p>Size: ${formatSize(result.target?.size || 0)}</p>
                <p>Type: ${result.target?.type || 'N/A'}</p>
              </div>` :
              `<div class="collapsed-info">
                <p>Checksum: ${result.target?.hash || 'N/A'}</p>
              </div>`
            }
          </div>
          
          <p class="quantum-note">Each access advances the quantum state. Further states reveal less information.</p>
        </div>
      </div>
    `;
    
  } catch (e) {
    app.innerHTML = `<div class="error">Error: ${e.message}</div>`;
  }
}

async function renderPuzzlePage(app, id) {
  app.innerHTML = '<div class="loading">Loading puzzle...</div>';
  
  try {
    const puzzle = await api.getPuzzleLock(id);
    
    app.innerHTML = `
      <div class="puzzle-page">
        <header>
          <a href="#/" class="back-link">← Home</a>
        </header>
        <div id="puzzleContainer" class="puzzle-container"></div>
      </div>
    `;
    
    renderPuzzle(puzzle, document.getElementById('puzzleContainer'), async (solution) => {
      try {
        const result = await api.solvePuzzle(id, solution);
        if (result.success) {
          if (result.targetType === 'room') {
            window.location.hash = `/room/${result.target.id}`;
          } else {
            window.location.hash = `/file/${result.target.id}`;
          }
        } else {
          showError('Incorrect solution. Try again!');
        }
      } catch (e) {
        showError(e.message);
      }
    });
    
  } catch (e) {
    app.innerHTML = `<div class="error">Error: ${e.message}</div>`;
  }
}

function showError(message) {
  const app = document.getElementById('app');
  const error = document.createElement('div');
  error.className = 'error-toast';
  error.textContent = message;
  app.appendChild(error);
  setTimeout(() => error.remove(), 3000);
}

function showModal(title, content) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3>${title}</h3>
      <div class="modal-content">${content}</div>
      <button class="modal-close">Close</button>
    </div>
  `;
  overlay.querySelector('.modal-close').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}

document.addEventListener('DOMContentLoaded', init);
