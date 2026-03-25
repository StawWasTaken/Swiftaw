// ═══════════════════════════════════════════
// SWIFTAWPLEX – UI MANAGEMENT
// ═══════════════════════════════════════════

import { getUser, hasPermission } from './auth.js';
import { switchChannel, getActiveChannel } from './chat.js';

let chatCollapsed = false;

/**
 * Initialize all UI bindings
 */
function initUI(callbacks) {
  const {
    onChatSubmit,
    onBuildToggle,
    onCreateObject,
    onDeleteModeToggle,
    onLogout,
    onSettingsChange
  } = callbacks;

  // ═══ CHAT ═══
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (text) {
      onChatSubmit(text);
      chatInput.value = '';
    }
  });

  // Chat toggle
  document.getElementById('chat-toggle').addEventListener('click', () => {
    chatCollapsed = !chatCollapsed;
    document.getElementById('chat-messages').classList.toggle('hidden', chatCollapsed);
    document.getElementById('chat-form').classList.toggle('hidden', chatCollapsed);
    document.getElementById('chat-toggle').textContent = chatCollapsed ? '▲' : '▼';
  });

  // Chat tabs
  document.querySelectorAll('.chat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      switchChannel(tab.dataset.channel);
      // Clear displayed messages and show channel-specific ones
      document.getElementById('chat-messages').innerHTML = '';
    });
  });

  // Focus chat on Enter
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Enter' && document.activeElement !== chatInput) {
      e.preventDefault();
      chatInput.focus();
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    }
    if (e.code === 'Escape' && document.activeElement === chatInput) {
      chatInput.blur();
    }
  });

  // ═══ TOP BAR BUTTONS ═══
  document.getElementById('btn-logout').addEventListener('click', onLogout);

  document.getElementById('btn-minimap').addEventListener('click', () => {
    document.getElementById('minimap').classList.toggle('hidden');
  });

  document.getElementById('btn-settings').addEventListener('click', () => {
    document.getElementById('settings-modal').classList.toggle('hidden');
  });

  document.getElementById('btn-inventory').addEventListener('click', () => {
    // Toggle creation panel (inventory/build)
    const panel = document.getElementById('creation-panel');
    panel.classList.toggle('hidden');
    document.getElementById('player-list').classList.toggle('hidden', !panel.classList.contains('hidden'));
  });

  // Minimap key shortcut
  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyM' && document.activeElement.tagName !== 'INPUT') {
      document.getElementById('minimap').classList.toggle('hidden');
    }
  });

  // ═══ CLOSE BUTTONS ═══
  document.querySelectorAll('.panel-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.close;
      document.getElementById(target)?.classList.add('hidden');
    });
  });

  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.modal;
      document.getElementById(target)?.classList.add('hidden');
    });
  });

  // ═══ BUILD MODE ═══
  const buildBtn = document.getElementById('btn-build');
  if (buildBtn) {
    buildBtn.addEventListener('click', onBuildToggle);
  }

  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyB' && document.activeElement.tagName !== 'INPUT') {
      onBuildToggle();
    }
  });

  // ═══ CREATION TOOLS ═══
  document.querySelectorAll('.create-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.create-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onCreateObject(btn.dataset.type);
    });
  });

  document.getElementById('create-scale').addEventListener('input', (e) => {
    document.getElementById('create-scale-val').textContent = e.target.value + 'x';
  });

  document.getElementById('delete-mode-btn').addEventListener('click', () => {
    onDeleteModeToggle();
  });

  // ═══ SETTINGS ═══
  document.getElementById('mouse-sensitivity')?.addEventListener('input', (e) => {
    onSettingsChange('sensitivity', parseInt(e.target.value));
  });

  document.getElementById('render-distance')?.addEventListener('input', (e) => {
    onSettingsChange('renderDistance', parseInt(e.target.value));
  });

  // ═══ SHOW BUILD TOOLBAR ═══
  if (hasPermission('build') || hasPermission('all')) {
    document.getElementById('build-toolbar').classList.remove('hidden');
  }

  // ═══ USER DISPLAY ═══
  const user = getUser();
  if (user) {
    document.getElementById('user-display').innerHTML =
      `<span style="color:${user.color}">${user.displayName}</span> <small style="opacity:0.6">${user.role}</small>`;
  }
}

/**
 * Add a chat message to the display
 */
function addChatMessage(msg) {
  const container = document.getElementById('chat-messages');

  const div = document.createElement('div');
  div.className = 'chat-msg' + (msg.type === 'system' ? ' system' : '');

  if (msg.type === 'system') {
    div.textContent = msg.text;
  } else {
    const time = new Date(msg.timestamp);
    const timeStr = time.getHours().toString().padStart(2, '0') + ':' +
                    time.getMinutes().toString().padStart(2, '0');

    div.innerHTML =
      `<span class="chat-time">${timeStr}</span>` +
      `<span class="chat-user ${msg.roleClass || ''}">${escapeHtml(msg.displayName)}</span>` +
      `<span class="chat-text">${escapeHtml(msg.text)}</span>`;
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;

  // Limit displayed messages
  while (container.children.length > 100) {
    container.removeChild(container.firstChild);
  }
}

/**
 * Update online player list
 */
function updatePlayerList(players) {
  const container = document.getElementById('player-list-items');
  const countEl = document.getElementById('online-count');

  const entries = Object.entries(players);
  const total = entries.reduce((sum, [, presences]) => sum + presences.length, 0);
  countEl.textContent = `${total} online`;

  container.innerHTML = '';
  entries.forEach(([key, presences]) => {
    presences.forEach(p => {
      const div = document.createElement('div');
      div.className = 'player-item';
      div.innerHTML = `
        <div class="player-avatar" style="background:${p.color || '#7bed9f'}">${(p.displayName || key).charAt(0).toUpperCase()}</div>
        <div class="player-info">
          <div class="player-name" style="color:${p.color || '#7bed9f'}">${escapeHtml(p.displayName || key)}</div>
          <div class="player-role">${escapeHtml(p.role || 'Employee')}</div>
          <div class="player-zone">${escapeHtml(p.zone || 'Unknown')}</div>
        </div>
      `;
      container.appendChild(div);
    });
  });
}

/**
 * Update zone display
 */
function updateZoneDisplay(zone) {
  document.getElementById('current-zone').textContent = zone.name || 'Corridor';
}

/**
 * Update minimap
 */
function updateMinimap(playerPos, remotePlayers, zones) {
  const canvas = document.getElementById('minimap-canvas');
  if (canvas.classList.contains('hidden') || document.getElementById('minimap').classList.contains('hidden')) return;

  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const scale = 0.8;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0a0812';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;

  // Draw zones
  Object.entries(zones).forEach(([key, zone]) => {
    const zx = cx + zone.center.x * scale;
    const zy = cy + zone.center.z * scale;
    const zw = zone.size.w * scale;
    const zd = zone.size.d * scale;

    ctx.fillStyle = `#${zone.color.toString(16).padStart(6, '0')}`;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(zx - zw / 2, zy - zd / 2, zw, zd);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = '#333';
    ctx.strokeRect(zx - zw / 2, zy - zd / 2, zw, zd);

    ctx.fillStyle = '#888';
    ctx.font = '8px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(zone.name, zx, zy + 3);
  });

  // Draw remote players
  Object.values(remotePlayers).forEach(rp => {
    const px = cx + rp.group.position.x * scale;
    const py = cy + rp.group.position.z * scale;
    ctx.fillStyle = '#7bed9f';
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw local player
  const lpx = cx + playerPos.x * scale;
  const lpy = cy + playerPos.z * scale;
  ctx.fillStyle = '#fff93e';
  ctx.beginPath();
  ctx.arc(lpx, lpy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff93e';
  ctx.lineWidth = 1;
  ctx.stroke();
}

/**
 * Toggle build mode UI
 */
function setBuildMode(active) {
  const btn = document.getElementById('btn-build');
  btn.classList.toggle('active', active);
  btn.textContent = active ? '🔨 Building' : '🔨 Build';

  const creationPanel = document.getElementById('creation-panel');
  const playerList = document.getElementById('player-list');

  if (active) {
    creationPanel.classList.remove('hidden');
    playerList.classList.add('hidden');
  } else {
    creationPanel.classList.add('hidden');
    playerList.classList.remove('hidden');
  }
}

/**
 * Toggle delete mode UI
 */
function setDeleteMode(active) {
  const btn = document.getElementById('delete-mode-btn');
  btn.textContent = `Delete Mode: ${active ? 'ON' : 'OFF'}`;
  btn.classList.toggle('active', active);
}

/**
 * Show/hide interaction prompt
 */
function showInteractPrompt(show, label) {
  const el = document.getElementById('interact-prompt');
  if (show) {
    el.classList.remove('hidden');
    if (label) el.querySelector('span').innerHTML = `Press <kbd>E</kbd> to interact with <b>${escapeHtml(label)}</b>`;
  } else {
    el.classList.add('hidden');
  }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.5s';
  setTimeout(() => overlay.classList.add('hidden'), 500);
}

/**
 * Hide controls help after a delay
 */
function autoHideControlsHelp() {
  setTimeout(() => {
    const help = document.getElementById('controls-help');
    if (help) {
      help.style.opacity = '0';
      setTimeout(() => help.classList.add('hidden'), 500);
    }
  }, 10000);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export {
  initUI, addChatMessage, updatePlayerList,
  updateZoneDisplay, updateMinimap,
  setBuildMode, setDeleteMode,
  showInteractPrompt, hideLoading, autoHideControlsHelp
};
