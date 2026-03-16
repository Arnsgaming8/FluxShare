const { QuantumLink } = require('../models');

function getQuantumStateInfo(state) {
  const states = {
    1: { name: 'Superposition', access: 'full', description: 'Full access to content' },
    2: { name: 'Entangled', access: 'partial', description: 'Metadata and thumbnail only' },
    3: { name: 'Collapsed', access: 'collapsed', description: 'Checksum verification only' }
  };
  return states[state] || states[1];
}

function advanceQuantumState(linkId) {
  const link = QuantumLink.get(linkId);
  if (!link) return null;
  return QuantumLink.access(linkId);
}

module.exports = { getQuantumStateInfo, advanceQuantumState };
