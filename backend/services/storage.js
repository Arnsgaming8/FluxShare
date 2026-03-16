const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function storeFile(buffer, originalName) {
  const ext = path.extname(originalName);
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  const storagePath = path.join(__dirname, '..', '..', 'data', 'files', filename);
  
  const dir = path.dirname(storagePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(storagePath, buffer);
  return storagePath;
}

function deleteFile(storagePath) {
  if (fs.existsSync(storagePath)) {
    fs.unlinkSync(storagePath);
    return true;
  }
  return false;
}

function getFileSize(storagePath) {
  if (fs.existsSync(storagePath)) {
    return fs.statSync(storagePath).size;
  }
  return 0;
}

module.exports = { storeFile, deleteFile, getFileSize };
