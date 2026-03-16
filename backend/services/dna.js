const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateDnaSignature(size, type) {
  const entropy = crypto.randomBytes(32).toString('hex');
  const typeCode = type.split('/')[0] || 'unk';
  const sizeClass = size < 1024 ? 'tiny' : size < 1024 * 1024 ? 'small' : size < 100 * 1024 * 1024 ? 'medium' : 'large';
  const segments = [];
  for (let i = 0; i < 8; i++) {
    const hue = (parseInt(entropy.substring(i * 4, i * 4 + 4), 16) / 65536) * 360;
    segments.push(`hsl(${Math.floor(hue)}, 70%, 50%)`);
  }
  return JSON.stringify({
    segments,
    typeCode,
    sizeClass,
    entropy
  });
}

function getDnaColors(dnaSignature) {
  try {
    const parsed = JSON.parse(dnaSignature);
    return parsed.segments || [];
  } catch {
    return ['#888', '#666', '#444', '#555', '#777', '#333', '#999', '#555'];
  }
}

module.exports = { generateDnaSignature, getDnaColors };
