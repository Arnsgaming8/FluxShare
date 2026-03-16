function renderDnaSignature(dnaSignature, container, options = {}) {
  container.innerHTML = '';
  
  let segments = [];
  let typeCode = 'unk';
  let sizeClass = 'unknown';
  
  try {
    const parsed = JSON.parse(dnaSignature);
    segments = parsed.segments || [];
    typeCode = parsed.typeCode || 'unk';
    sizeClass = parsed.sizeClass || 'unknown';
  } catch (e) {
    segments = ['#888', '#666', '#444', '#555', '#777', '#333', '#999', '#555'];
  }
  
  const wrapper = document.createElement('div');
  wrapper.className = 'dna-wrapper';
  
  const label = document.createElement('div');
  label.className = 'dna-label';
  label.textContent = 'File DNA';
  wrapper.appendChild(label);
  
  const dnaBar = document.createElement('div');
  dnaBar.className = 'dna-bar';
  
  segments.forEach((color, index) => {
    const segment = document.createElement('div');
    segment.className = 'dna-segment';
    segment.style.backgroundColor = color;
    segment.style.flex = '1';
    dnaBar.appendChild(segment);
  });
  
  wrapper.appendChild(dnaBar);
  
  const info = document.createElement('div');
  info.className = 'dna-info';
  info.innerHTML = `<span>Type: ${typeCode}</span> | <span>Size: ${sizeClass}</span>`;
  wrapper.appendChild(info);
  
  if (options.showParent && options.parentDna) {
    const parentLabel = document.createElement('div');
    parentLabel.className = 'dna-label parent';
    parentLabel.textContent = 'Parent DNA';
    wrapper.appendChild(parentLabel);
    
    let parentSegments = [];
    try {
      const parsed = JSON.parse(options.parentDna);
      parentSegments = parsed.segments || [];
    } catch (e) {
      parentSegments = ['#444', '#333', '#222', '#333', '#444', '#222', '#555', '#333'];
    }
    
    const parentBar = document.createElement('div');
    parentBar.className = 'dna-bar parent-dna';
    parentBar.style.opacity = '0.4';
    
    parentSegments.forEach((color) => {
      const segment = document.createElement('div');
      segment.className = 'dna-segment';
      segment.style.backgroundColor = color;
      segment.style.flex = '1';
      parentBar.appendChild(segment);
    });
    
    wrapper.appendChild(parentBar);
  }
  
  container.appendChild(wrapper);
}

function getDnaColors(dnaSignature) {
  try {
    const parsed = JSON.parse(dnaSignature);
    return parsed.segments || ['#888', '#666', '#444', '#555', '#777', '#333', '#999', '#555'];
  } catch (e) {
    return ['#888', '#666', '#444', '#555', '#777', '#333', '#999', '#555'];
  }
}
