// ═══════════════════════════════════════════
// SWIFTAWPLEX – PLAYER CONTROLLER
// ═══════════════════════════════════════════

import { getCamera, getScene } from './world.js';

const MOVE_SPEED = 18;
const SPRINT_SPEED = 30;
const JUMP_FORCE = 12;
const GRAVITY = 30;
const MOUSE_SENSITIVITY = 0.002;
const PLAYER_HEIGHT = 3;

let velocity = { x: 0, y: 0, z: 0 };
let euler = { x: 0, y: 0 };
let isGrounded = true;
let isPointerLocked = false;
let keys = {};
let sensitivityMultiplier = 1;

// Other players
let remotePlayers = {};

function initPlayerControls() {
  // Keyboard
  document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
  });
  document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  // Mouse look
  document.addEventListener('mousemove', (e) => {
    if (!isPointerLocked) return;
    euler.y -= e.movementX * MOUSE_SENSITIVITY * sensitivityMultiplier;
    euler.x -= e.movementY * MOUSE_SENSITIVITY * sensitivityMultiplier;
    euler.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, euler.x));
  });

  // Pointer lock
  const canvas = document.getElementById('world-canvas');
  canvas.addEventListener('click', () => {
    if (!isPointerLocked) {
      canvas.requestPointerLock();
    }
  });

  document.addEventListener('pointerlockchange', () => {
    isPointerLocked = !!document.pointerLockElement;
    document.body.classList.toggle('pointer-locked', isPointerLocked);
  });
}

function updatePlayer(delta) {
  const camera = getCamera();
  if (!camera) return;

  // Camera rotation
  camera.rotation.order = 'YXZ';
  camera.rotation.y = euler.y;
  camera.rotation.x = euler.x;

  // Movement direction
  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, euler.y, 0)));
  const right = new THREE.Vector3(1, 0, 0);
  right.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, euler.y, 0)));

  const speed = keys['ShiftLeft'] || keys['ShiftRight'] ? SPRINT_SPEED : MOVE_SPEED;
  let moveX = 0, moveZ = 0;

  if (keys['KeyW'] || keys['ArrowUp']) { moveX += forward.x; moveZ += forward.z; }
  if (keys['KeyS'] || keys['ArrowDown']) { moveX -= forward.x; moveZ -= forward.z; }
  if (keys['KeyA'] || keys['ArrowLeft']) { moveX -= right.x; moveZ -= right.z; }
  if (keys['KeyD'] || keys['ArrowRight']) { moveX += right.x; moveZ += right.z; }

  // Normalize diagonal movement
  const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
  if (len > 0) {
    moveX = (moveX / len) * speed * delta;
    moveZ = (moveZ / len) * speed * delta;
  }

  // Apply horizontal movement
  camera.position.x += moveX;
  camera.position.z += moveZ;

  // Jump
  if ((keys['Space']) && isGrounded) {
    velocity.y = JUMP_FORCE;
    isGrounded = false;
  }

  // Gravity
  velocity.y -= GRAVITY * delta;
  camera.position.y += velocity.y * delta;

  // Ground collision
  if (camera.position.y <= PLAYER_HEIGHT) {
    camera.position.y = PLAYER_HEIGHT;
    velocity.y = 0;
    isGrounded = true;
  }

  // World bounds
  const BOUND = 200;
  camera.position.x = Math.max(-BOUND, Math.min(BOUND, camera.position.x));
  camera.position.z = Math.max(-BOUND, Math.min(BOUND, camera.position.z));
}

function getPlayerPosition() {
  const camera = getCamera();
  if (!camera) return { x: 0, y: 0, z: 0 };
  return {
    x: Math.round(camera.position.x * 100) / 100,
    y: Math.round(camera.position.y * 100) / 100,
    z: Math.round(camera.position.z * 100) / 100
  };
}

function getPlayerRotation() {
  return { x: euler.x, y: euler.y };
}

function setSensitivity(val) {
  sensitivityMultiplier = val / 8;
}

function isKeyDown(code) {
  return !!keys[code];
}

function unlockPointer() {
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }
}

// ═══ REMOTE PLAYERS ═══

function updateRemotePlayer(userId, data) {
  const scene = getScene();
  if (!scene) return;

  if (!remotePlayers[userId]) {
    // Create avatar for new player
    const group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: data.color || 0x7bed9f,
      roughness: 0.5,
      metalness: 0.3
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({
      color: data.color || 0x7bed9f,
      roughness: 0.4,
      metalness: 0.2
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.1;
    head.castShadow = true;
    group.add(head);

    // Name tag (sprite)
    const canvas2d = document.createElement('canvas');
    canvas2d.width = 256;
    canvas2d.height = 64;
    const ctx = canvas2d.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.roundRect(0, 0, 256, 64, 8);
    ctx.fill();
    ctx.fillStyle = data.color || '#7bed9f';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.displayName || userId, 128, 22);
    ctx.fillStyle = '#aaa';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText(data.role || 'Employee', 128, 48);

    const texture = new THREE.CanvasTexture(canvas2d);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.y = 2;
    sprite.scale.set(2.5, 0.6, 1);
    group.add(sprite);

    scene.add(group);
    remotePlayers[userId] = { group, targetPos: new THREE.Vector3() };
  }

  const rp = remotePlayers[userId];
  rp.targetPos.set(data.x || 0, (data.y || PLAYER_HEIGHT) - PLAYER_HEIGHT + 0.6, data.z || 0);

  // Smooth interpolation
  rp.group.position.lerp(rp.targetPos, 0.15);

  if (data.ry !== undefined) {
    rp.group.rotation.y = data.ry;
  }
}

function removeRemotePlayer(userId) {
  const scene = getScene();
  if (remotePlayers[userId]) {
    scene.remove(remotePlayers[userId].group);
    delete remotePlayers[userId];
  }
}

function getRemotePlayers() {
  return remotePlayers;
}

// Raycasting for interactions
const raycaster = new THREE.Raycaster();
raycaster.far = 8;

function getInteractionTarget(interactables) {
  const camera = getCamera();
  if (!camera || !isPointerLocked) return null;

  raycaster.setFromCamera({ x: 0, y: 0 }, camera);

  // Include placed objects
  const allTargets = [...interactables];
  const intersects = raycaster.intersectObjects(allTargets, true);

  for (const hit of intersects) {
    let obj = hit.object;
    while (obj && !obj.userData.interactable && !obj.userData.placed) {
      obj = obj.parent;
    }
    if (obj && (obj.userData.interactable || obj.userData.placed)) {
      return { object: obj, distance: hit.distance };
    }
  }
  return null;
}

// Get placement position (where crosshair points at ground)
function getPlacementPosition() {
  const camera = getCamera();
  if (!camera) return null;

  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  raycaster.far = 30;

  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const target = new THREE.Vector3();
  raycaster.ray.intersectPlane(groundPlane, target);

  raycaster.far = 8;
  return target;
}

export {
  initPlayerControls, updatePlayer,
  getPlayerPosition, getPlayerRotation,
  setSensitivity, isKeyDown, unlockPointer,
  updateRemotePlayer, removeRemotePlayer, getRemotePlayers,
  getInteractionTarget, getPlacementPosition
};
