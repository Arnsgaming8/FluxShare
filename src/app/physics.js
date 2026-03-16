class PhysicsEngine {
  constructor(container) {
    this.container = container;
    this.elements = [];
    this.gravityMode = 'normal';
    this.animationId = null;
    this.config = {
      normal: { g: 0.3, damping: 0.99 },
      zeroG: { g: 0, damping: 0.995 },
      reverse: { g: -0.2, damping: 0.99 }
    };
  }
  
  setGravity(mode) {
    this.gravityMode = mode;
  }
  
  addElement(element, x, y) {
    const el = {
      element,
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      width: element.offsetWidth || 150,
      height: element.offsetHeight || 80
    };
    this.elements.push(el);
    return el;
  }
  
  removeElement(element) {
    this.elements = this.elements.filter(el => el.element !== element);
  }
  
  start() {
    if (this.animationId) return;
    const loop = () => {
      this.update();
      this.animationId = requestAnimationFrame(loop);
    };
    loop();
  }
  
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  update() {
    const cfg = this.config[this.gravityMode];
    const containerRect = this.container.getBoundingClientRect();
    
    for (const el of this.elements) {
      el.vy += cfg.g;
      el.vx *= cfg.damping;
      el.vy *= cfg.damping;
      
      el.x += el.vx;
      el.y += el.vy;
      
      if (el.x < 0) { el.x = 0; el.vx *= -0.8; }
      if (el.x + el.width > containerRect.width) {
        el.x = containerRect.width - el.width;
        el.vx *= -0.8;
      }
      if (el.y < 0) { el.y = 0; el.vy *= -0.8; }
      if (el.y + el.height > containerRect.height) {
        el.y = containerRect.height - el.height;
        el.vy *= -0.8;
      }
      
      if (this.gravityMode === 'zeroG') {
        el.vx += (Math.random() - 0.5) * 0.1;
        el.vy += (Math.random() - 0.5) * 0.1;
      }
      
      el.element.style.transform = `translate(${el.x}px, ${el.y}px)`;
    }
    
    this.handleCollisions();
  }
  
  handleCollisions() {
    for (let i = 0; i < this.elements.length; i++) {
      for (let j = i + 1; j < this.elements.length; j++) {
        const a = this.elements[i];
        const b = this.elements[j];
        
        const dx = (a.x + a.width / 2) - (b.x + b.width / 2);
        const dy = (a.y + a.height / 2) - (b.y + b.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = Math.max(a.width, a.height) / 2 + Math.max(b.width, b.height) / 2;
        
        if (dist < minDist && dist > 0) {
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          
          a.x += nx * overlap / 2;
          a.y += ny * overlap / 2;
          b.x -= nx * overlap / 2;
          b.y -= ny * overlap / 2;
          
          const dvx = a.vx - b.vx;
          const dvy = a.vy - b.vy;
          const dvn = dvx * nx + dvy * ny;
          
          if (dvn > 0) {
            a.vx -= dvn * nx;
            a.vy -= dvn * ny;
            b.vx += dvn * nx;
            b.vy += dvn * ny;
          }
        }
      }
    }
  }
  
  applyForce(element, fx, fy) {
    const el = this.elements.find(e => e.element === element);
    if (el) {
      el.vx += fx;
      el.vy += fy;
    }
  }
}
