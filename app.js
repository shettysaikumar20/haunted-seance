/**
 * Ghost in the Machine & Marigold Archive: Interactive Horror & Remembrance Client
 */

// 8x13 Grayscale Hardware Patterns (0 to 7)
const PATTERNS = {
  marigold: [
    0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 3, 5, 6, 5, 3, 0, 0, 0, 0,
    0, 0, 0, 4, 5, 6, 7, 6, 5, 4, 0, 0, 0,
    0, 0, 4, 5, 6, 6, 7, 6, 6, 5, 4, 0, 0,
    0, 0, 0, 4, 5, 6, 7, 6, 5, 4, 0, 0, 0,
    0, 0, 0, 0, 3, 5, 6, 5, 3, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0,
  ],
  skull: [
    0, 0, 0, 4, 6, 7, 7, 7, 6, 4, 0, 0, 0,
    0, 0, 5, 7, 7, 7, 7, 7, 7, 7, 5, 0, 0,
    0, 0, 6, 7, 0, 7, 7, 7, 0, 7, 6, 0, 0,
    0, 0, 6, 7, 7, 7, 0, 7, 7, 7, 6, 0, 0,
    0, 0, 0, 5, 7, 7, 7, 7, 7, 5, 0, 0, 0,
    0, 0, 0, 0, 6, 7, 6, 7, 6, 0, 0, 0, 0,
    0, 0, 0, 0, 5, 0, 5, 0, 5, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  eye: [
    0, 0, 0, 0, 3, 5, 6, 5, 3, 0, 0, 0, 0,
    0, 0, 2, 5, 7, 7, 7, 7, 7, 5, 2, 0, 0,
    0, 4, 6, 7, 7, 1, 0, 1, 7, 7, 6, 4, 0,
    6, 7, 7, 7, 2, 0, 0, 0, 2, 7, 7, 7, 6,
    0, 4, 6, 7, 7, 1, 0, 1, 7, 7, 6, 4, 0,
    0, 0, 2, 5, 7, 7, 7, 7, 7, 5, 2, 0, 0,
    0, 0, 0, 0, 3, 5, 6, 5, 3, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  cross: [
    0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0,
    0, 0, 5, 6, 7, 7, 7, 7, 7, 6, 5, 0, 0,
    0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 4, 5, 4, 0, 0, 0, 0, 0,
  ],
};

const STORAGE_KEY = 'marigold-archive-v1';
const demoStories = [
  {
    id: 'M01',
    title: 'The orange cake on Sundays',
    person: 'Elena',
    year: 'Most Sundays',
    body: 'She never measured the orange zest. She said the cake knew when it had enough. The kitchen smelled like citrus before anyone rang the bell, and there was always one slice wrapped in wax paper for whoever arrived late.',
    createdAt: '2026-10-26T09:00:00.000Z',
    demo: true,
  },
  {
    id: 'M02',
    title: 'A song for the bus ride home',
    person: 'Elena',
    year: 'When the children were small',
    body: 'On the bus home from the market she would hum an old bolero under her breath. The children learned the tune before they knew its name. When it rained, she tapped the rhythm on the fogged-up window.',
    createdAt: '2026-10-26T09:01:00.000Z',
    demo: true,
  },
  {
    id: 'M03',
    title: 'Marigolds by the front step',
    person: 'Elena',
    year: 'Every October',
    body: 'Each October, she planted marigolds beside the front step. She said their color could guide a person home. The grandchildren took turns carrying the watering can, even when the flowers were already bright.',
    createdAt: '2026-10-26T09:02:00.000Z',
    demo: true,
  },
];

let stories = loadStories();
let toastTimer;
let droneActive = false;
let heartbeatActive = false;
let matrixTimer = null;
let currentGlyph = 'marigold';

/* -------------------------------------------------------------
   1. Volumetric Fog & Particle Canvas System
   ------------------------------------------------------------- */
function initFogCanvas() {
  const canvas = document.getElementById('fog-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const particleCount = 45;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 120 + 80,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.12 + 0.04,
      isSpark: Math.random() > 0.8,
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -p.radius) p.x = width + p.radius;
      if (p.x > width + p.radius) p.x = -p.radius;
      if (p.y < -p.radius) p.y = height + p.radius;
      if (p.y > height + p.radius) p.y = -p.radius;

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
      if (p.isSpark) {
        grad.addColorStop(0, `rgba(255, 140, 20, ${p.alpha * 1.5})`);
        grad.addColorStop(1, 'rgba(255, 80, 0, 0)');
      } else {
        grad.addColorStop(0, `rgba(50, 75, 50, ${p.alpha})`);
        grad.addColorStop(1, 'rgba(10, 15, 10, 0)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(render);
  }

  render();
}

/* -------------------------------------------------------------
   2. Web Audio UI & Soundscape Controls
   ------------------------------------------------------------- */
function setupAudioControls() {
  const audio = window.horrorAudio;
  const audioStateText = document.getElementById('audio-state-text');
  const btnDrone = document.getElementById('btn-drone');
  const btnHeartbeat = document.getElementById('btn-heartbeat');
  const btnMute = document.getElementById('btn-mute');
  const btnStinger = document.getElementById('btn-stinger');

  function unlockAudio() {
    audio.ensureContext();
    if (audioStateText) audioStateText.textContent = 'AUDIO ENGINE: ACTIVE & SYNTHESIZING';
  }
  document.body.addEventListener('click', unlockAudio, { once: true });

  btnDrone.addEventListener('click', () => {
    unlockAudio();
    droneActive = !droneActive;
    if (droneActive) {
      audio.startDreadDrone();
      btnDrone.textContent = '✦ Dread Drone: ACTIVE';
      btnDrone.classList.add('active');
    } else {
      audio.stopDreadDrone();
      btnDrone.textContent = '✦ Dread Drone: OFF';
      btnDrone.classList.remove('active');
    }
  });

  btnHeartbeat.addEventListener('click', () => {
    unlockAudio();
    heartbeatActive = !heartbeatActive;
    if (heartbeatActive) {
      audio.startHeartbeat(72);
      btnHeartbeat.textContent = '♥ Heartbeat: 72 BPM';
      btnHeartbeat.classList.add('active');
    } else {
      audio.stopHeartbeat();
      btnHeartbeat.textContent = '♥ Heartbeat: OFF';
      btnHeartbeat.classList.remove('active');
    }
  });

  btnStinger.addEventListener('click', triggerJumpscare);

  btnMute.addEventListener('click', () => {
    unlockAudio();
    const isMuted = audio.toggleMute();
    btnMute.textContent = isMuted ? '🔇 Audio: MUTED' : '🔊 Audio: ON';
    btnMute.classList.toggle('active', isMuted);
  });

  // Soundpad Triggers
  document.getElementById('pad-whisper').addEventListener('click', () => {
    unlockAudio();
    audio.playWhisper(0.7);
    showToast('A spectral whisper echoes across the wires…');
  });

  document.getElementById('pad-bell').addEventListener('click', () => {
    unlockAudio();
    audio.playBellToll();
    triggerScreenShake(false);
  });

  document.getElementById('pad-creak').addEventListener('click', () => {
    unlockAudio();
    audio.playCreak();
  });

  document.getElementById('pad-static').addEventListener('click', () => {
    unlockAudio();
    audio.playGlitchStatic(0.4, 0.6);
    triggerScreenShake(true);
  });
}

function triggerJumpscare() {
  const audio = window.horrorAudio;
  audio.ensureContext();
  audio.playStinger();

  // Screen shockwave
  triggerScreenShake(true);

  // Red flash overlay
  const flash = document.getElementById('jumpscare-flash');
  if (flash) {
    flash.classList.add('active');
    setTimeout(() => flash.classList.remove('active'), 250);
  }

  // Display Skull on Matrix
  displayGlyph('skull', 3000);
  showToast('SOMETHING IS IN THE ROOM.');
}

function triggerScreenShake(intense = false) {
  const app = document.getElementById('app-shell');
  if (!app) return;
  const className = intense ? 'quake-intense' : 'quake-mild';
  app.classList.remove('quake-mild', 'quake-intense');
  void app.offsetWidth; // reflow
  app.classList.add(className);
  setTimeout(() => app.classList.remove(className), 800);
}

/* -------------------------------------------------------------
   3. Arduino UNO Q 8x13 LED Matrix Display
   ------------------------------------------------------------- */
function initMatrix() {
  const grid = document.getElementById('matrix-grid');
  if (!grid) return;
  grid.innerHTML = '';
  for (let i = 0; i < 104; i++) {
    const dot = document.createElement('div');
    dot.className = 'led-dot';
    dot.dataset.index = String(i);
    dot.dataset.level = '0';
    grid.appendChild(dot);
  }
  displayGlyph('marigold');
}

function displayGlyph(glyphName, durationMs = 2600) {
  currentGlyph = glyphName;
  const pattern = PATTERNS[glyphName] || PATTERNS.marigold;
  const dots = document.querySelectorAll('.matrix-grid .led-dot');
  const box = document.getElementById('matrix-box');
  const titleEl = document.getElementById('matrix-title');
  const stateEl = document.getElementById('matrix-state');

  if (box) {
    box.className = `matrix-box mode-${glyphName}`;
  }

  dots.forEach(dot => {
    const idx = Number(dot.dataset.index);
    dot.dataset.level = String(pattern[idx] || 0);
  });

  const titles = {
    marigold: 'GLYPH: MARIGOLD LANTERN',
    skull: 'GLYPH: PHANTOM SKULL',
    eye: 'GLYPH: WATCHING EYE',
    cross: 'GLYPH: THE CROSS',
  };
  if (titleEl) titleEl.textContent = titles[glyphName] || 'GLYPH: ACTIVE';
  if (stateEl) stateEl.textContent = `PULSING (${(durationMs / 1000).toFixed(1)}s)`;

  clearTimeout(matrixTimer);
  matrixTimer = setTimeout(() => {
    if (stateEl) stateEl.textContent = 'STANDBY';
  }, durationMs);

  // Send to server bridge
  fetch('/api/matrix/display', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pattern: glyphName }),
  }).catch(() => {});
}

/* -------------------------------------------------------------
   4. The Ghost in the Machine Seance Terminal
   ------------------------------------------------------------- */
function setupTerminal() {
  const terminalInput = document.getElementById('terminal-input');
  const terminalSend = document.getElementById('terminal-send');
  const terminalOutput = document.getElementById('terminal-output');
  const btnManifest = document.getElementById('btn-manifest');

  async function commune(promptText) {
    const text = promptText || terminalInput.value.trim();
    if (!text) return;
    terminalInput.value = '';

    window.horrorAudio.ensureContext();
    window.horrorAudio.playTypewriterClick();

    // Append user's whisper
    const userLine = document.createElement('div');
    userLine.textContent = `> ${text}`;
    terminalOutput.appendChild(userLine);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;

    const ghostLine = document.createElement('div');
    ghostLine.className = 'ghost-line';
    ghostLine.textContent = 'The machine shudders and listens…';
    terminalOutput.appendChild(ghostLine);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;

    try {
      const resp = await fetch('/api/horror/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await resp.json();

      // Sound effect cue
      if (data.sound === 'stinger') window.horrorAudio.playStinger();
      else if (data.sound === 'whisper') window.horrorAudio.playWhisper(0.7);
      else if (data.sound === 'bell') window.horrorAudio.playBellToll();
      else if (data.sound === 'creak') window.horrorAudio.playCreak();
      else window.horrorAudio.playGlitchStatic();

      if (data.shake) triggerScreenShake(false);
      if (data.glyph) displayGlyph(data.glyph, 3000);

      // Typewriter printout
      ghostLine.textContent = '';
      let charIdx = 0;
      const timer = setInterval(() => {
        if (charIdx < data.text.length) {
          ghostLine.textContent += data.text.charAt(charIdx);
          window.horrorAudio.playTypewriterClick();
          charIdx++;
          terminalOutput.scrollTop = terminalOutput.scrollHeight;
        } else {
          clearInterval(timer);
        }
      }, 30);
    } catch (err) {
      ghostLine.className = 'danger-line';
      ghostLine.textContent = 'ERR: Entity severed communication link.';
    }
  }

  terminalSend.addEventListener('click', () => commune());
  terminalInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') commune();
  });

  if (btnManifest) {
    btnManifest.addEventListener('click', () => {
      triggerJumpscare();
      commune('Why did you wake up?');
      document.getElementById('terminal-section').scrollIntoView({ behavior: 'smooth' });
    });
  }
}

/* -------------------------------------------------------------
   5. Remembrance Garden & Stories Management
   ------------------------------------------------------------- */
function loadStories() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn(e);
  }
  return [...demoStories];
}

function saveStories() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
  } catch (e) {
    showToast('Storage quota exceeded.');
  }
}

function renderStories() {
  const grid = document.getElementById('memory-grid');
  const badge = document.getElementById('story-count-badge');
  if (!grid) return;
  grid.innerHTML = '';
  if (badge) badge.textContent = `${stories.length} ${stories.length === 1 ? 'memory' : 'memories'}`;

  stories.forEach(s => {
    const card = document.createElement('article');
    card.className = 'memory-card';
    card.innerHTML = `
      <div class="memory-top">
        <span>${s.id}</span>
        <span>${s.demo ? 'ANCIENT' : 'PLANTED'}</span>
      </div>
      <h3>${escapeHtml(s.title)}</h3>
      <p>${escapeHtml(s.person)}${s.year ? ` · ${escapeHtml(s.year)}` : ''}</p>
      <div class="memory-footer">
        <span>${escapeHtml(s.body.slice(0, 60))}…</span>
        <span style="color:#55ef8e;">READ ↗</span>
      </div>
    `;
    card.addEventListener('click', () => {
      window.horrorAudio.playTypewriterClick();
      alert(`[${s.id}] About ${s.person} (${s.year || ''})\n\n${s.body}`);
    });
    grid.appendChild(card);
  });
}

async function gatherStories() {
  if (!stories.length) {
    showToast('Please plant at least one memory seed.');
    return;
  }
  window.horrorAudio.ensureContext();
  window.horrorAudio.playBellToll();
  displayGlyph('marigold', 3500);

  const dialog = document.getElementById('reflection-dialog');
  const bodyEl = document.getElementById('reflection-body');
  const metaEl = document.getElementById('reflection-meta');

  bodyEl.textContent = 'Listening to the memories in the dark…';
  metaEl.textContent = 'ARDUINO UNO Q · BRIDGE RPC PULSED';
  dialog.showModal();

  try {
    const resp = await fetch('/api/reflection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stories }),
    });
    const data = await resp.json();
    bodyEl.textContent = data.reflection;
    metaEl.textContent = `LOCAL MODEL · ${data.model} · ARDUINO 8×13 MATRIX LANTERN BLOOMED`;
    window.horrorAudio.playWhisper(0.5);
  } catch (err) {
    bodyEl.textContent = 'Reflecting offline: The memories Elena left behind continue to light the path forward.';
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

/* -------------------------------------------------------------
   6. App Initialization & Event Wiring
   ------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initFogCanvas();
  setupAudioControls();
  initMatrix();
  setupTerminal();
  renderStories();

  // Glyph Switchers
  document.querySelectorAll('.glyph-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.horrorAudio.playTypewriterClick();
      const g = btn.dataset.glyph;
      displayGlyph(g, 3000);
    });
  });

  // Modal Triggers
  const storyDialog = document.getElementById('story-dialog');
  const openAdd = document.getElementById('open-add-story');
  if (openAdd) openAdd.addEventListener('click', () => storyDialog.showModal());

  document.getElementById('close-add-modal').addEventListener('click', () => storyDialog.close());
  document.getElementById('cancel-add-modal').addEventListener('click', () => storyDialog.close());

  document.getElementById('story-form').addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const title = form.get('title');
    const person = form.get('person');
    const year = form.get('year');
    const body = form.get('body');
    if (!title || !person || !body) return;

    stories.push({
      id: `M${String(stories.length + 1).padStart(2, '0')}`,
      title: String(title),
      person: String(person),
      year: String(year || ''),
      body: String(body),
      createdAt: new Date().toISOString(),
      demo: false,
    });
    saveStories();
    renderStories();
    e.currentTarget.reset();
    storyDialog.close();
    window.horrorAudio.playTypewriterClick();
    showToast('Your memory has taken root in the soil.');
  });

  document.getElementById('btn-gather-hero').addEventListener('click', gatherStories);
  document.getElementById('close-reflection-modal').addEventListener('click', () => {
    document.getElementById('reflection-dialog').close();
  });
  document.getElementById('done-reflection-modal').addEventListener('click', () => {
    document.getElementById('reflection-dialog').close();
  });

  // Import / Export
  document.getElementById('export-btn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ stories }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ghost-machine-archive.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Archive downloaded to your machine.');
  });

  const importFile = document.getElementById('import-file');
  document.getElementById('import-btn').addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', e => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          if (Array.isArray(data.stories)) {
            stories = data.stories;
            saveStories();
            renderStories();
            showToast('Archive restored.');
          }
        } catch {
          showToast('Invalid archive file.');
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  });

  // View Navigation
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      if (view === 'hero') document.getElementById('hero-section').scrollIntoView({ behavior: 'smooth' });
      if (view === 'terminal') document.getElementById('terminal-section').scrollIntoView({ behavior: 'smooth' });
      if (view === 'matrix') document.getElementById('matrix-section').scrollIntoView({ behavior: 'smooth' });
      if (view === 'stories') document.getElementById('stories-section').scrollIntoView({ behavior: 'smooth' });
    });
  });
});
