const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8080' 
  : 'https://fluxshare-0vjn.onrender.com';

const api = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const sessionToken = localStorage.getItem('fluxshare_session') || generateSessionToken();
    localStorage.setItem('fluxshare_session', sessionToken);
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken,
        ...options.headers,
      },
      credentials: 'include',
    };
    
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
      config.body = options.body;
    } else if (options.body) {
      config.body = JSON.stringify(options.body);
    }
    
    try {
      const response = await fetch(url, config);
      if (options.responseType === 'blob') {
        return response;
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Request failed with status ' + response.status);
      }
      return data;
    } catch (networkError) {
      console.error('API Error:', networkError);
      throw new Error('Cannot connect to backend. Is it running? Error: ' + networkError.message);
    }
  },
  
  async createRoom() {
    return this.request('/api/rooms', { method: 'POST' });
  },
  
  async getRoom(id, direction) {
    const dirParam = direction ? `?dir=${direction}` : '';
    return this.request(`/api/rooms/${id}${dirParam}`);
  },
  
  async setGravity(roomId, gravityMode) {
    return this.request(`/api/rooms/${roomId}/gravity`, { method: 'POST', body: { gravityMode } });
  },
  
  async toggleMirrorMode(roomId, enabled) {
    return this.request(`/api/rooms/${roomId}/mirror-mode`, { method: 'POST', body: { enabled } });
  },
  
  async getMirrorStatus(roomId) {
    return this.request(`/api/rooms/${roomId}/mirror-status`);
  },
  
  async generateDirectionalLinks(roomId) {
    return this.request(`/api/rooms/${roomId}/directional-links`, { method: 'POST' });
  },
  
  async downloadZip(roomId) {
    return this.request(`/api/rooms/${roomId}/download-zip?dir=S`, { responseType: 'blob' });
  },
  
  async uploadFile(roomId, file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request(`/api/rooms/${roomId}/files`, { method: 'POST', body: formData });
  },
  
  async getFile(id) {
    return this.request(`/api/files/${id}`);
  },
  
  async downloadFile(id) {
    return this.request(`/api/files/${id}/download`, { responseType: 'blob' });
  },
  
  async freezeFile(id, freezeHash) {
    return this.request(`/api/files/${id}/freeze`, { method: 'POST', body: { freezeHash } });
  },
  
  async thawFile(id, freezeHash) {
    return this.request(`/api/files/${id}/thaw`, { method: 'POST', body: { freezeHash } });
  },
  
  async deleteFile(id) {
    return this.request(`/api/files/${id}`, { method: 'DELETE' });
  },
  
  async createQuantumLink(targetType, targetId) {
    return this.request('/api/quantum-links', { method: 'POST', body: { targetType, targetId } });
  },
  
  async getQuantumLink(id) {
    return this.request(`/api/quantum-links/${id}`);
  },
  
  async accessQuantumLink(id) {
    return this.request(`/api/quantum-links/${id}/access`, { method: 'POST' });
  },
  
  async createPuzzleLock(targetType, targetId) {
    return this.request('/api/puzzle-locks', { method: 'POST', body: { targetType, targetId } });
  },
  
  async getPuzzleLock(id) {
    return this.request(`/api/puzzle-locks/${id}`);
  },
  
  async solvePuzzle(id, solutionAttempt) {
    return this.request(`/api/puzzle-locks/${id}/solve`, { method: 'POST', body: { solutionAttempt } });
  },
};

function generateSessionToken() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
