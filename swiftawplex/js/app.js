// ═══════════════════════════════════════════
// SWIFTAWPLEX – MAIN APPLICATION
// ═══════════════════════════════════════════

import { login, logout, getUser, restoreSession, hasPermission, hasAccess } from './auth.js';
import { initWorld, updateWorld, renderWorld, getPlayerZone, placeObject, removeObject, getInteractables, getPlacedObjects, ZONES } from './world.js';
import { initPlayerControls, updatePlayer, getPlayerPosition, getPlayerRotation, setSensitivity, isKeyDown, unlockPointer, updateRemotePlayer, removeRemotePlayer, getRemotePlayers, getInteractionTarget, getPlacementPosition } from './player.js';
import { initChat, sendMessage, updatePresence, switchChannel, destroyChat, sendSystemMessage } from './chat.js';
import { initUI, addChatMessage, updatePlayerList, updateZoneDisplay, updateMinimap, setBuildMode, setDeleteMode, showInteractPrompt, hideLoading, autoHideControlsHelp } from './ui.js';

// ═══ STATE ═══
let buildMode = false;
let deleteMode = false;
let selectedObjectType = null;
let currentZone = null;
let lastPresenceUpdate = 0;
const PRESENCE_INTERVAL = 500; // ms

// ═══ LOGIN FLOW ═══
const loginForm = document.getElementById('login-form');
const loginScreen = document.getElementById('login-screen');
const appDiv = document.getElementById('app');

// Try restore session
const existingUser = restoreSession();
if (existingUser) {
  startApp();
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('login-user').value;
  const password = document.getElementById('login-pass').value;
  const errorEl = document.getElementById('login-error');

  const user = login(username, password);
  if (user) {
    errorEl.textContent = '';
    startApp();
  } else {
    // Check if user exists but doesn't have employee access
    if (typeof SwiftawAuth !== 'undefined') {
      const result = SwiftawAuth.login(username, password);
      if (result.success && result.user.accessLevel < 1) {
        errorEl.textContent = 'Your account does not have employee access (Level 1+). Contact a CEO to request access.';
        SwiftawAuth.logout();
      } else {
        errorEl.textContent = result.error || 'Invalid credentials. Access denied.';
      }
    } else {
      errorEl.textContent = 'Invalid credentials. Access denied.';
    }
    document.getElementById('login-pass').value = '';
  }
});

// ═══ MAIN APP START ═══
function startApp() {
  loginScreen.classList.add('hidden');
  appDiv.classList.remove('hidden');

  const user = getUser();

  // Init 3D world
  const canvas = document.getElementById('world-canvas');
  initWorld(canvas);

  // Restore saved placed objects
  restorePlacedObjects();

  // Init player controls
  initPlayerControls();

  // Init real-time chat
  initChat(onChatMessage, onPresenceUpdate);

  // Init UI
  initUI({
    onChatSubmit: (text) => {
      // Command handling
      if (text.startsWith('/')) {
        handleCommand(text);
      } else {
        sendMessage(text);
      }
    },
    onBuildToggle: () => {
      if (!hasPermission('build')) {
        addChatMessage({ type: 'system', text: 'You do not have build permissions.', timestamp: Date.now() });
        return;
      }
      buildMode = !buildMode;
      setBuildMode(buildMode);
      if (!buildMode) {
        deleteMode = false;
        setDeleteMode(false);
        selectedObjectType = null;
      }
    },
    onCreateObject: (type) => {
      selectedObjectType = type;
      deleteMode = false;
      setDeleteMode(false);
    },
    onDeleteModeToggle: () => {
      deleteMode = !deleteMode;
      setDeleteMode(deleteMode);
      if (deleteMode) {
        selectedObjectType = null;
        document.querySelectorAll('.create-btn').forEach(b => b.classList.remove('active'));
      }
    },
    onLogout: () => {
      destroyChat();
      logout();
      unlockPointer();
      appDiv.classList.add('hidden');
      loginScreen.classList.remove('hidden');
      document.getElementById('login-user').value = '';
      document.getElementById('login-pass').value = '';
    },
    onSettingsChange: (key, value) => {
      if (key === 'sensitivity') setSensitivity(value);
    }
  });

  // Welcome message
  addChatMessage({
    type: 'system',
    text: `Welcome to the Swiftawplex, ${user.displayName}! You are logged in as ${user.role}.`,
    timestamp: Date.now()
  });

  // Click to place/delete objects in build mode
  document.getElementById('world-canvas').addEventListener('mousedown', (e) => {
    if (!buildMode) return;

    if (deleteMode) {
      const target = getInteractionTarget([...getInteractables(), ...getPlacedObjects()]);
      if (target && target.object.userData.placed) {
        removeObject(target.object);
        broadcastObjectAction('delete', target.object);
      }
    } else if (selectedObjectType) {
      const pos = getPlacementPosition();
      if (pos) {
        const color = document.getElementById('create-color').value;
        const scale = parseFloat(document.getElementById('create-scale').value);
        const obj = placeObject(selectedObjectType, pos, color, scale);
        broadcastObjectAction('place', obj);
      }
    }
  });

  // Interaction key (E)
  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyE' && document.activeElement.tagName !== 'INPUT') {
      const target = getInteractionTarget(getInteractables());
      if (target && target.object.userData.interactable) {
        handleInteraction(target.object);
      }
    }
  });

  // Start render loop
  hideLoading();
  autoHideControlsHelp();
  requestAnimationFrame(gameLoop);
}

// ═══ GAME LOOP ═══
let lastTime = 0;

function gameLoop(time) {
  requestAnimationFrame(gameLoop);

  const delta = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  // Update player
  updatePlayer(delta);

  // Update world animations
  updateWorld(delta);

  // Zone detection
  const pos = getPlayerPosition();
  const zone = getPlayerZone(pos.x, pos.z);
  if (!currentZone || currentZone.key !== zone.key) {
    currentZone = zone;
    updateZoneDisplay(zone);
  }

  // Interaction detection
  const interactTarget = getInteractionTarget(getInteractables());
  if (interactTarget) {
    showInteractPrompt(true, interactTarget.object.userData.label);
  } else {
    showInteractPrompt(false);
  }

  // Update presence periodically
  const now = Date.now();
  if (now - lastPresenceUpdate > PRESENCE_INTERVAL) {
    lastPresenceUpdate = now;
    const rot = getPlayerRotation();
    updatePresence({
      x: pos.x,
      y: pos.y,
      z: pos.z,
      ry: rot.y,
      zone: currentZone?.name || 'Unknown'
    });
  }

  // Update minimap
  updateMinimap(pos, getRemotePlayers(), ZONES);

  // Render
  renderWorld();
}

// ═══ CALLBACKS ═══

function onChatMessage(msg) {
  addChatMessage(msg);
}

function onPresenceUpdate(state) {
  updatePlayerList(state);

  // Update remote player avatars
  const myUser = getUser();
  Object.entries(state).forEach(([key, presences]) => {
    presences.forEach(p => {
      if (p.username !== myUser?.username) {
        updateRemotePlayer(p.username, p);
      }
    });
  });

  // Remove players no longer present
  const activeUsernames = new Set();
  Object.values(state).forEach(presences => {
    presences.forEach(p => activeUsernames.add(p.username));
  });
  Object.keys(getRemotePlayers()).forEach(uid => {
    if (!activeUsernames.has(uid)) {
      removeRemotePlayer(uid);
    }
  });
}

// ═══ COMMANDS ═══

function handleCommand(text) {
  const parts = text.split(' ');
  const cmd = parts[0].toLowerCase();

  switch (cmd) {
    case '/help':
      addChatMessage({
        type: 'system',
        text: 'Commands: /help, /tp <zone>, /announce <msg>, /who, /clear, /zones',
        timestamp: Date.now()
      });
      break;

    case '/tp':
    case '/teleport': {
      const zoneName = parts.slice(1).join(' ').toLowerCase();
      const zoneEntry = Object.entries(ZONES).find(([key, z]) =>
        key === zoneName || z.name.toLowerCase() === zoneName
      );
      if (zoneEntry) {
        const [, zone] = zoneEntry;
        const camera = document.getElementById('world-canvas').__camera;
        // Direct teleport via modifying camera (simplified)
        import('./world.js').then(w => {
          const cam = w.getCamera();
          cam.position.set(zone.center.x, 3, zone.center.z + 5);
        });
        addChatMessage({ type: 'system', text: `Teleported to ${zone.name}`, timestamp: Date.now() });
      } else {
        addChatMessage({ type: 'system', text: `Zone not found. Use /zones to see available zones.`, timestamp: Date.now() });
      }
      break;
    }

    case '/zones':
      const zoneList = Object.values(ZONES).map(z => `${z.name} - ${z.description}`).join('\n');
      addChatMessage({ type: 'system', text: `Zones:\n${zoneList}`, timestamp: Date.now() });
      break;

    case '/announce':
      if (hasPermission('moderate')) {
        const msg = parts.slice(1).join(' ');
        sendSystemMessage(`📢 ${getUser().displayName}: ${msg}`);
      } else {
        addChatMessage({ type: 'system', text: 'No permission for announcements.', timestamp: Date.now() });
      }
      break;

    case '/who':
      addChatMessage({ type: 'system', text: `You are ${getUser().displayName} (${getUser().role})`, timestamp: Date.now() });
      break;

    case '/clear':
      document.getElementById('chat-messages').innerHTML = '';
      break;

    default:
      addChatMessage({ type: 'system', text: `Unknown command: ${cmd}. Type /help for commands.`, timestamp: Date.now() });
  }
}

// ═══ INTERACTIONS ═══

function handleInteraction(obj) {
  const type = obj.userData.type;
  switch (type) {
    case 'info_board':
      addChatMessage({ type: 'system', text: '📋 Info Board: Welcome to Swiftawplex - the virtual headquarters of Swiftaw. Explore departments, collaborate, and innovate!', timestamp: Date.now() });
      break;
    case 'prototype':
      addChatMessage({ type: 'system', text: '🔬 Prototype Station: Current project - Tithonia AI Suite. Sprout and Floret models in active development.', timestamp: Date.now() });
      break;
    case 'media_screen':
      addChatMessage({ type: 'system', text: '📺 Media Screen: Displaying latest Swiftaw communications and brand assets.', timestamp: Date.now() });
      break;
    case 'whiteboard':
      addChatMessage({ type: 'system', text: '📝 Whiteboard: Brainstorming area - The Vital Spark Initiative milestones and goals.', timestamp: Date.now() });
      break;
    case 'security_console':
      addChatMessage({ type: 'system', text: '🔒 Security Console: All systems nominal. Swiftawplex security status: GREEN.', timestamp: Date.now() });
      break;
    case 'trophy_case':
      addChatMessage({ type: 'system', text: '🏆 Trophy Case: Swiftaw achievements - Fortized Launch, Tithonia Development, Vital Spark Initiative founding.', timestamp: Date.now() });
      break;
    case 'teleport_pad': {
      const destination = obj.userData.destination;
      const cam = document.getElementById('world-canvas').__camera;
      cam.position.set(destination.x, 3, destination.z + 5);
      addChatMessage({ type: 'system', text: `✨ Teleported to ${obj.userData.label}`, timestamp: Date.now() });
      break;
    }
    default:
      addChatMessage({ type: 'system', text: `Interacted with ${type || 'object'}.`, timestamp: Date.now() });
  }
}

// ═══ SAVE/RESTORE PLACED OBJECTS ═══
const PLACED_OBJECTS_KEY = 'swiftawplex_objects';

function savePlacedObjects() {
  const objects = getPlacedObjects();
  const data = objects.map(obj => ({
    type: obj.userData.type,
    x: obj.position.x,
    y: obj.position.y,
    z: obj.position.z,
    color: '#' + (obj.material?.color?.getHexString() || 'ffffff'),
    scale: obj.scale?.x || 1
  }));
  try { localStorage.setItem(PLACED_OBJECTS_KEY, JSON.stringify(data)); } catch(e) {}
}

function restorePlacedObjects() {
  try {
    const stored = localStorage.getItem(PLACED_OBJECTS_KEY);
    if (!stored) return;
    const data = JSON.parse(stored);
    data.forEach(item => {
      const pos = new THREE.Vector3(item.x, 0, item.z);
      placeObject(item.type, pos, item.color, item.scale);
    });
  } catch(e) {}
}

function broadcastObjectAction(action, obj) {
  // Save after every place/delete
  savePlacedObjects();
}
