const STORAGE_KEY = 'marigold-archive-v1';

// Marigold 8x13 Grayscale Pattern (from sketch.ino)
const MARIGOLD_MATRIX = [
  0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 3, 5, 6, 5, 3, 0, 0, 0, 0,
  0, 0, 0, 4, 5, 6, 7, 6, 5, 4, 0, 0, 0,
  0, 0, 4, 5, 6, 6, 7, 6, 6, 5, 4, 0, 0,
  0, 0, 0, 4, 5, 6, 7, 6, 5, 4, 0, 0, 0,
  0, 0, 0, 0, 3, 5, 6, 5, 3, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0,
];

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
let selectedStory = null;
let toastTimer;
let serverMode = false;
let boardMode = false;
let activeModelName = 'qwen2.5:3b';
let matrixTimer = null;

function loadStories() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (error) {
    console.warn('Could not read the local archive.', error);
  }
  return [...demoStories];
}

function saveStories() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
  } catch (error) {
    showToast('Browser storage full. Export a copy before closing.');
  }
}

function safe(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

function storyCountLabel(n) {
  return `${String(n).padStart(2, '0')} ${n === 1 ? 'story' : 'stories'}`;
}

function renderStories() {
  const grid = document.getElementById('memory-grid');
  const count = stories.length;
  document.getElementById('story-total').textContent = storyCountLabel(count);
  document.getElementById('nav-count').textContent = String(count).padStart(2, '0');
  grid.innerHTML = '';

  if (!count) {
    grid.innerHTML = '<div class="empty-state">The garden is waiting for its first story. Start with one small detail you want to keep.</div>';
    return;
  }

  for (const story of [...stories].reverse()) {
    const card = document.createElement('article');
    card.className = 'memory-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Open story: ${story.title}`);
    card.innerHTML = `
      <div class="memory-top">
        <span class="memory-kind">${story.demo ? 'A MEMORY, KEPT' : 'A STORY, PLANTED'}</span>
        <span class="memory-sprig">✳</span>
      </div>
      <h3>${safe(story.title)}</h3>
      <p>${safe(story.person)}${story.year ? ` · ${safe(story.year)}` : ''}</p>
      <div class="memory-footer">
        <span>${safe(story.id)} &nbsp;·&nbsp; IN YOUR ARCHIVE</span>
        <span>READ STORY ↗</span>
      </div>
    `;
    card.addEventListener('click', () => openStory(story.id));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openStory(story.id);
      }
    });
    grid.append(card);
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

/* Arduino UNO Q 8x13 LED Matrix Simulation */
function initMatrixGrids() {
  const mainGrid = document.getElementById('matrix-grid');
  const dialogGrid = document.getElementById('dialog-matrix-grid');
  mainGrid.innerHTML = '';
  if (dialogGrid) dialogGrid.innerHTML = '';

  for (let i = 0; i < 104; i++) {
    const dot = document.createElement('div');
    dot.className = 'led-dot';
    dot.dataset.index = String(i);
    dot.dataset.level = '0';
    mainGrid.appendChild(dot);

    if (dialogGrid) {
      const smallDot = document.createElement('div');
      smallDot.className = 'led-dot';
      smallDot.dataset.index = String(i);
      smallDot.dataset.level = '0';
      dialogGrid.appendChild(smallDot);
    }
  }
}

function pulseMatrix(durationMs = 2600) {
  const dots = document.querySelectorAll('.matrix-grid .led-dot, .matrix-grid-small .led-dot');
  const bridgeStatus = document.getElementById('bridge-status');
  const matrixTimerLabel = document.getElementById('matrix-timer');

  dots.forEach(dot => {
    const idx = Number(dot.dataset.index);
    const level = MARIGOLD_MATRIX[idx] || 0;
    dot.dataset.level = String(level);
  });

  if (bridgeStatus) bridgeStatus.textContent = 'BRIDGE RPC: MARIGOLD BLOOMING';
  if (matrixTimerLabel) matrixTimerLabel.textContent = `ACTIVE (2.6s LANTERN)`;

  clearTimeout(matrixTimer);
  matrixTimer = setTimeout(() => {
    dots.forEach(dot => {
      dot.dataset.level = '0';
    });
    if (bridgeStatus) bridgeStatus.textContent = 'BRIDGE RPC: READY';
    if (matrixTimerLabel) matrixTimerLabel.textContent = 'STANDBY';
  }, durationMs);
}

async function detectBoardRuntime() {
  try {
    const response = await fetch('/api/status', { cache: 'no-store' });
    if (!response.ok) throw new Error('No server API');
    const status = await response.json();
    serverMode = true;
    boardMode = Boolean(status.board);
    activeModelName = status.model || 'Local Model';

    const hwTitle = document.getElementById('hw-title');
    const hwDesc = document.getElementById('hw-desc');
    const statusEl = document.getElementById('ollama-status');
    const modelInput = document.getElementById('model-name');

    if (boardMode) {
      hwTitle.textContent = 'Arduino UNO Q (Board)';
      hwDesc.textContent = 'Qualcomm QRB2210 + STM32U585 MCU Bridge';
      statusEl.textContent = `UNO Q · ${activeModelName} · on-device`;
      document.querySelector('.local-pill').innerHTML = '<i></i> ARDUINO UNO Q · ON-DEVICE';
      modelInput.value = 'App Lab local LLM';
      modelInput.readOnly = true;
    } else {
      hwTitle.textContent = 'Arduino UNO Q (Simulator)';
      hwDesc.textContent = status.ollama
        ? 'Ollama local inference + Bridge simulation'
        : 'Embedded local engine + Bridge simulation';
      statusEl.textContent = `Local Engine · ${activeModelName}`;
      modelInput.value = status.available_models && status.available_models.length ? status.available_models[0] : 'qwen2.5:3b';
    }
  } catch {
    serverMode = false;
    document.getElementById('hw-title').textContent = 'Offline Browser Mode';
    document.getElementById('hw-desc').textContent = 'Browser localStorage + Virtual Matrix';
    document.getElementById('ollama-status').textContent = 'Local Ollama / Embedded engine';
  }
}

function openStory(id) {
  selectedStory = stories.find(s => s.id === id);
  if (!selectedStory) return;
  document.getElementById('view-person').textContent = `A STORY ABOUT ${selectedStory.person.toUpperCase()}`;
  document.getElementById('view-title').textContent = selectedStory.title;
  document.getElementById('view-date').textContent = `${selectedStory.year || 'A moment remembered'} · SOURCE ${selectedStory.id}`;
  document.getElementById('view-body').textContent = selectedStory.body;
  document.getElementById('story-view-dialog').showModal();
}

function downloadArchive() {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          project: 'Marigold Archive',
          theme: 'Ghost in the Machine (Hacktoberfest 2026)',
          exportedAt: new Date().toISOString(),
          stories,
        },
        null,
        2
      ),
    ],
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'marigold-archive.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Archive downloaded to this device.');
}

function importArchive(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      const importedStories = Array.isArray(data.stories) ? data.stories : (Array.isArray(data) ? data : null);
      if (!importedStories || !importedStories.length) {
        showToast('Invalid archive file.');
        return;
      }
      stories = importedStories.map((s, idx) => ({
        id: s.id || `M${String(idx + 1).padStart(2, '0')}`,
        title: String(s.title || 'Untitled Memory').slice(0, 100),
        person: String(s.person || 'Elena').slice(0, 80),
        year: String(s.year || '').slice(0, 40),
        body: String(s.body || '').slice(0, 1400),
        createdAt: s.createdAt || new Date().toISOString(),
        demo: Boolean(s.demo),
      }));
      saveStories();
      renderStories();
      showToast(`Imported ${stories.length} stories into your garden.`);
    } catch (err) {
      showToast('Could not parse JSON archive.');
    }
  };
  reader.readAsText(file);
}

function closeDialog(id) {
  document.getElementById(id).close();
}

// Client-side fallback reflection generator
function clientSideReflection(memories) {
  const p = memories[0].person || 'Elena';
  const m1 = memories[0];
  const m2 = memories[1] || m1;
  const m3 = memories[2];

  if (memories.length === 1) {
    return `Holding this single story close [${m1.id}], we remember ${p} through '${m1.title.toLowerCase()}'. The memory stands clearly: ${m1.body.rstrip ? m1.body.rstrip('.') : m1.body}. Without forcing patterns where only one quiet moment was offered, we preserve this recollection exactly as it was shared [${m1.id}]. The living warmth remains intact.`;
  }

  let text = `Reflecting across these gathered moments of ${p}, a quiet common thread appears. In [${m1.id}], we see her through '${m1.title.toLowerCase()}', where ${m1.body.split('.')[0].toLowerCase()}. That same attentiveness returns in [${m2.id}] with '${m2.title.toLowerCase()}', where ${m2.body.split('.')[0].toLowerCase()}. `;
  if (m3) {
    text += `And resting beside them both, [${m3.id}] reminds us that '${m3.title.toLowerCase()}' was part of this same rhythm of care. These recollections do not speak for ${p} [${m1.id}, ${m2.id}, ${m3.id}]; they simply illuminate the small, enduring ways she touched everyday life.`;
  } else {
    text += `These memories [${m1.id}, ${m2.id}] hold open the door to what stayed true. Tended with care, their warmth continues to bloom.`;
  }
  return text;
}

async function gatherStories() {
  if (!stories.length) {
    showToast('Plant at least one story before gathering them.');
    return;
  }
  const button = document.getElementById('create-lantern');
  const status = document.getElementById('ollama-status');
  const oldLabel = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<span class="loading"></span>Gathering the stories…';
  status.textContent = 'Open-weight model running…';

  const model = document.getElementById('model-name').value.trim() || 'qwen2.5:3b';

  try {
    let reflectionText = '';
    let modelName = model;

    if (serverMode) {
      const response = await fetch('/api/reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stories, model }),
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.error || `Server returned ${response.status}`);
      }
      const data = await response.json();
      reflectionText = data.reflection;
      modelName = data.model || model;
    } else {
      // Try direct local Ollama endpoint
      try {
        const sourceText = stories.map(s => `[${s.id}] About ${s.person}${s.year ? ` (${s.year})` : ''} — ${s.title}\n${s.body}`).join('\n\n');
        const prompt = `You are a careful editor helping someone make a remembrance. Write a short, tender reflection (90–140 words) that notices a real connection across the supplied memories. Do not impersonate or speak as the person who died. Do not invent facts, events, feelings, relationships, quotations, or sensory details. Every specific detail must come from the source memories. Include source IDs in square brackets next to the detail they support, for example [M01]. Plain text only.\n\nMEMORIES:\n${sourceText}`;

        const olResp = await fetch('http://localhost:11434/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            stream: false,
            messages: [{ role: 'user', content: prompt }],
            options: { temperature: 0.35 },
          }),
        });
        if (olResp.ok) {
          const olData = await olResp.json();
          reflectionText = olData.message?.content?.trim();
        }
      } catch {
        // Fallback to client-side engine
        reflectionText = clientSideReflection(stories);
        modelName = 'Marigold Client-Side Engine (Local)';
      }
    }

    if (!reflectionText) {
      reflectionText = clientSideReflection(stories);
    }

    // Pulse the 8x13 LED Matrix Lantern
    pulseMatrix(2600);

    showReflection(reflectionText, modelName);
    status.textContent = `Ready · ${modelName} · on-device`;
  } catch (error) {
    console.error('Reflection error:', error);
    // Graceful offline fallback
    const fallbackText = clientSideReflection(stories);
    pulseMatrix(2600);
    showReflection(fallbackText, 'Marigold Local Engine (Offline)');
    status.textContent = 'Local offline reflection ready';
  } finally {
    button.disabled = false;
    button.innerHTML = oldLabel;
  }
}

function showReflection(reflection, model) {
  document.getElementById('result-title').innerHTML = 'The things<br /><em>that stayed.</em>';
  const output = document.getElementById('result-content');
  const knownIds = new Set(stories.map(s => s.id));
  const citations = [...new Set([...reflection.matchAll(/\[(M\d+)\]/g)].map(m => m[1]).filter(id => knownIds.has(id)))];

  // Highlight citation tags with styled badge
  const formattedHtml = safe(reflection).replace(/\[(M\d+)\]/g, '<span class="citation-pill">[$1]</span>');

  output.innerHTML = `
    <div>${formattedHtml}</div>
    <div class="sources">
      SOURCES IN THIS GATHERING<br />
      ${stories.map(s => `${safe(s.id)} · ${safe(s.title)}${citations.includes(s.id) ? ' &nbsp;✓ Cited' : ''}`).join('<br />')}
      <br /><br />
      HARDWARE / MODEL · ${safe(model)} · ARDUINO 8×13 LED PULSED
    </div>
  `;

  document.getElementById('lantern-dialog').showModal();
}

/* Event Listeners */
document.getElementById('open-add').addEventListener('click', () => document.getElementById('story-dialog').showModal());
document.getElementById('open-add-2').addEventListener('click', () => document.getElementById('story-dialog').showModal());

document.getElementById('story-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const body = String(form.get('body') || '').trim();
  const title = String(form.get('title') || '').trim();
  const person = String(form.get('person') || '').trim();
  if (!body || !title || !person) return;

  const next = stories.length ? Math.max(...stories.map(s => Number(s.id.slice(1)) || 0)) + 1 : 1;
  stories.push({
    id: `M${String(next).padStart(2, '0')}`,
    title,
    person,
    year: String(form.get('year') || '').trim(),
    body,
    createdAt: new Date().toISOString(),
    demo: false,
  });

  saveStories();
  renderStories();
  event.currentTarget.reset();
  closeDialog('story-dialog');
  showToast('Your story has taken root.');
});

document.getElementById('story-form').querySelectorAll('[value="cancel"]').forEach(btn => {
  btn.addEventListener('click', () => closeDialog('story-dialog'));
});

document.getElementById('export-btn').addEventListener('click', downloadArchive);

const importFile = document.getElementById('import-file');
document.getElementById('import-btn').addEventListener('click', () => importFile.click());
importFile.addEventListener('change', e => {
  if (e.target.files && e.target.files[0]) {
    importArchive(e.target.files[0]);
    e.target.value = '';
  }
});

document.getElementById('delete-story').addEventListener('click', () => {
  if (!selectedStory) return;
  stories = stories.filter(s => s.id !== selectedStory.id);
  saveStories();
  renderStories();
  closeDialog('story-view-dialog');
  showToast('Story removed from this browser.');
});

document.getElementById('close-story-view').addEventListener('click', () => closeDialog('story-view-dialog'));
document.getElementById('close-story-btn').addEventListener('click', () => closeDialog('story-view-dialog'));
document.getElementById('close-result').addEventListener('click', () => closeDialog('lantern-dialog'));
document.getElementById('close-result-btn').addEventListener('click', () => closeDialog('lantern-dialog'));

document.getElementById('create-lantern').addEventListener('click', gatherStories);
document.getElementById('open-lantern').addEventListener('click', () => {
  document.getElementById('lantern-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(gatherStories, 350);
});

document.getElementById('test-matrix-btn').addEventListener('click', () => {
  pulseMatrix(2600);
  if (serverMode) {
    fetch('/api/lantern/test', { method: 'POST' }).catch(() => {});
  }
  showToast('Arduino 8×13 LED Matrix lantern pulsed.');
});

document.querySelectorAll('.nav-item').forEach(button => {
  button.addEventListener('click', () => {
    const view = button.dataset.view;
    document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item === button));
    if (view === 'garden') document.getElementById('top').scrollIntoView({ behavior: 'smooth' });
    if (view === 'stories') document.getElementById('memory-grid').scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (view === 'lantern') document.getElementById('lantern-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (view === 'about') showToast('No account, no cloud, no telemetry. Stories stay exclusively in this browser.');
  });
});

// Sync files to uno_q_app/web
initMatrixGrids();
renderStories();
detectBoardRuntime();
