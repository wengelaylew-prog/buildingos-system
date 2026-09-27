const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');

const advancedCss = `
/* --- BuildingOS Advanced HUD Effects --- */

.hud-crt-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
  background-size: 100% 2px, 3px 100%;
  z-index: 50;
  mix-blend-mode: overlay;
  opacity: 0.6;
}

.hud-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle, transparent 60%, rgba(0,0,0,0.8) 120%);
  z-index: 49;
}

.hud-scanline {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(to bottom, transparent 0%, rgba(99, 102, 241, 0.4) 50%, transparent 100%);
  height: 20%;
  width: 100%;
  animation: hud-scan 4s linear infinite;
  z-index: 48;
}

@keyframes hud-scan {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(500%); }
}

.hud-radar-sweep {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 70%, rgba(34, 197, 94, 0.8) 100%);
  animation: hud-spin 2s linear infinite;
}

@keyframes hud-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.hud-glitch-hover:hover {
  animation: hud-glitch 0.3s cubic-bezier(.25, .46, .45, .94) both infinite;
}

@keyframes hud-glitch {
  0% { transform: translate(0) }
  20% { transform: translate(-2px, 1px) }
  40% { transform: translate(-1px, -1px) }
  60% { transform: translate(2px, 1px) }
  80% { transform: translate(1px, -1px) }
  100% { transform: translate(0) }
}

.hud-glass-panel {
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
`;

if (!css.includes('hud-crt-overlay')) {
  fs.writeFileSync('src/index.css', css + '\\n' + advancedCss);
  console.log('index.css patched with advanced HUD effects.');
} else {
  console.log('index.css already patched.');
}

