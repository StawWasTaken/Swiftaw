// ═══════════════════════════════════════════
// SWIFTAWPLEX – 3D WORLD (ENHANCED)
// Skyscrapers, massive HQ, teleportation pads
// ═══════════════════════════════════════════

const ZONES = {
  lobby: {
    name: 'Lobby',
    center: { x: 0, y: 0, z: 0 },
    size: { w: 80, d: 80 },
    color: 0x241f3c,
    floorColor: 0x1a1630,
    description: 'Grand futuristic atrium'
  },
  rd: {
    name: 'R&D Lab',
    center: { x: 120, y: 0, z: 0 },
    size: { w: 70, d: 70 },
    color: 0x0a2a4a,
    floorColor: 0x0d1f33,
    description: 'Research & Development wing'
  },
  communications: {
    name: 'Communications',
    center: { x: -120, y: 0, z: 0 },
    size: { w: 65, d: 65 },
    color: 0x2a1a4a,
    floorColor: 0x1f1535,
    description: 'Media & branding hub'
  },
  innovation: {
    name: 'Innovation Hub',
    center: { x: 0, y: 0, z: -120 },
    size: { w: 75, d: 75 },
    color: 0x1a3a2a,
    floorColor: 0x142a20,
    description: 'Experimental spaces'
  },
  safety: {
    name: 'Safety & Ops',
    center: { x: 0, y: 0, z: 120 },
    size: { w: 65, d: 65 },
    color: 0x3a1a1a,
    floorColor: 0x2a1414,
    description: 'Security & workflow management'
  },
  recreation: {
    name: 'Recreation',
    center: { x: -120, y: 0, z: -120 },
    size: { w: 70, d: 70 },
    color: 0x1a2a3a,
    floorColor: 0x141f2a,
    description: 'Cafeteria, lounge & games'
  },
  executive: {
    name: 'Executive Suite',
    center: { x: 120, y: 0, z: -120 },
    size: { w: 60, d: 60 },
    color: 0x3a2a0a,
    floorColor: 0x2a1f0a,
    description: 'CEO & leadership offices'
  },
  atrium_north: {
    name: 'North Atrium',
    center: { x: 0, y: 0, z: -240 },
    size: { w: 60, d: 60 },
    color: 0x1a1a2a,
    floorColor: 0x0f0f1a,
    description: 'Upper north tower'
  },
  atrium_south: {
    name: 'South Atrium',
    center: { x: 0, y: 0, z: 240 },
    size: { w: 60, d: 60 },
    color: 0x1a1a2a,
    floorColor: 0x0f0f1a,
    description: 'Upper south tower'
  }
};

let scene, camera, renderer;
let worldObjects = [];
let interactableObjects = [];
let placedObjects = [];
let clock;
let teleportationPads = [];

function initWorld(canvas) {
  clock = new THREE.Clock();

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050308);
  scene.fog = new THREE.FogExp2(0x050308, 0.006);

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 3, 10);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  setupLighting();
  buildSkyscrapers();
  buildAllZones();
  buildCorridors();
  buildTeleportationPads();
  buildSkybox();

  window.addEventListener('resize', onResize);

  return { scene, camera, renderer, clock };
}

function setupLighting() {
  const ambient = new THREE.AmbientLight(0x404060, 0.5);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xfff4e0, 0.8);
  dirLight.position.set(100, 150, 50);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(4096, 4096);
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 500;
  dirLight.shadow.camera.left = -400;
  dirLight.shadow.camera.right = 400;
  dirLight.shadow.camera.top = 400;
  dirLight.shadow.camera.bottom = -400;
  scene.add(dirLight);

  const hemi = new THREE.HemisphereLight(0x4060ff, 0x203020, 0.4);
  scene.add(hemi);
}

function buildSkyscrapers() {
  // Corner towers (massive skyscrapers)
  const towers = [
    { pos: [150, 0, 150], color: 0x2a3a5a },
    { pos: [-150, 0, 150], color: 0x3a2a5a },
    { pos: [150, 0, -150], color: 0x2a5a3a },
    { pos: [-150, 0, -150], color: 0x5a3a2a }
  ];

  towers.forEach(({ pos, color }) => {
    const height = 40;
    const width = 20;
    const depth = 20;

    // Main tower body
    const towerGeo = new THREE.BoxGeometry(width, height, depth);
    const towerMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.4,
      metalness: 0.3
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(pos[0], height / 2, pos[2]);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);

    // Windows grid
    for (let y = 0; y < height; y += 3) {
      for (let x = 0; x < width; x += 2.5) {
        const winGeo = new THREE.BoxGeometry(1.2, 1.2, 0.2);
        const winMat = new THREE.MeshStandardMaterial({
          color: 0x4488ff,
          emissive: 0x1144aa,
          emissiveIntensity: 0.4
        });
        const win = new THREE.Mesh(winGeo, winMat);
        win.position.set(
          pos[0] - width / 2 + x,
          y + 1,
          pos[2] + depth / 2 + 0.2
        );
        scene.add(win);
      }
    }

    // Top spire
    const spireGeo = new THREE.ConeGeometry(width / 2, 15, 8);
    const spireMat = new THREE.MeshStandardMaterial({
      color: 0xfff93e,
      emissive: 0xff9c3c,
      emissiveIntensity: 0.3
    });
    const spire = new THREE.Mesh(spireGeo, spireMat);
    spire.position.set(pos[0], height + 7, pos[2]);
    scene.add(spire);
  });
}

function buildAllZones() {
  for (const [key, zone] of Object.entries(ZONES)) {
    buildZone(key, zone);
  }
}

function buildZone(key, zone) {
  const { center, size, color, floorColor } = zone;
  const group = new THREE.Group();
  group.position.set(center.x, center.y, center.z);

  // Floor
  const floorGeo = new THREE.PlaneGeometry(size.w, size.d);
  const floorMat = new THREE.MeshStandardMaterial({
    color: floorColor,
    roughness: 0.8,
    metalness: 0.2
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const gridHelper = new THREE.GridHelper(Math.max(size.w, size.d), 20, 0x333355, 0x222244);
  gridHelper.position.y = 0.01;
  gridHelper.material.opacity = 0.2;
  gridHelper.material.transparent = true;
  group.add(gridHelper);

  // Walls
  const wallHeight = 12;
  const wallMat = new THREE.MeshStandardMaterial({
    color: color,
    transparent: true,
    opacity: 0.12,
    roughness: 0.1,
    metalness: 0.8,
    side: THREE.DoubleSide
  });

  const wallN = new THREE.Mesh(new THREE.PlaneGeometry(size.w, wallHeight), wallMat);
  wallN.position.set(0, wallHeight / 2, -size.d / 2);
  group.add(wallN);

  const wallS = new THREE.Mesh(new THREE.PlaneGeometry(size.w, wallHeight), wallMat);
  wallS.position.set(0, wallHeight / 2, size.d / 2);
  wallS.rotation.y = Math.PI;
  group.add(wallS);

  const wallE = new THREE.Mesh(new THREE.PlaneGeometry(size.d, wallHeight), wallMat);
  wallE.position.set(size.w / 2, wallHeight / 2, 0);
  wallE.rotation.y = -Math.PI / 2;
  group.add(wallE);

  const wallW = new THREE.Mesh(new THREE.PlaneGeometry(size.d, wallHeight), wallMat);
  wallW.position.set(-size.w / 2, wallHeight / 2, 0);
  wallW.rotation.y = Math.PI / 2;
  group.add(wallW);

  // Ceiling
  const ceilGeo = new THREE.PlaneGeometry(size.w, size.d);
  const ceilMat = new THREE.MeshStandardMaterial({
    color: color,
    transparent: true,
    opacity: 0.06,
    side: THREE.DoubleSide
  });
  const ceil = new THREE.Mesh(ceilGeo, ceilMat);
  ceil.position.y = wallHeight;
  ceil.rotation.x = Math.PI / 2;
  group.add(ceil);

  // Pillars
  const pillarGeo = new THREE.CylinderGeometry(0.5, 0.5, wallHeight, 8);
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x444466, roughness: 0.3, metalness: 0.7 });
  const corners = [
    [-size.w / 2, 0, -size.d / 2],
    [size.w / 2, 0, -size.d / 2],
    [-size.w / 2, 0, size.d / 2],
    [size.w / 2, 0, size.d / 2]
  ];
  corners.forEach(([cx, cy, cz]) => {
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(cx, wallHeight / 2, cz);
    pillar.castShadow = true;
    group.add(pillar);
  });

  const zoneLight = new THREE.PointLight(color, 2, size.w * 1.5);
  zoneLight.position.set(0, wallHeight - 1, 0);
  group.add(zoneLight);

  addZoneDecorations(group, key, zone);
  scene.add(group);
  worldObjects.push({ key, group, zone });
}

function addZoneDecorations(group, key, zone) {
  const { size } = zone;
  switch (key) {
    case 'lobby': {
      const pedestalGeo = new THREE.CylinderGeometry(3, 3.5, 1.5, 16);
      const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x333355, metalness: 0.8, roughness: 0.2 });
      const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
      pedestal.position.y = 0.75;
      pedestal.castShadow = true;
      group.add(pedestal);

      const holoGeo = new THREE.BoxGeometry(3, 4, 0.5);
      const holoMat = new THREE.MeshStandardMaterial({
        color: 0xfff93e,
        emissive: 0xfff93e,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.6
      });
      const holo = new THREE.Mesh(holoGeo, holoMat);
      holo.position.y = 4;
      holo.userData = { animate: 'rotate', speed: 0.3 };
      group.add(holo);
      break;
    }
    case 'rd': {
      for (let i = 0; i < 4; i++) {
        const tableGeo = new THREE.BoxGeometry(10, 1, 2.5);
        const tableMat = new THREE.MeshStandardMaterial({ color: 0x1a3a5a, metalness: 0.4 });
        const table = new THREE.Mesh(tableGeo, tableMat);
        table.position.set(0, 0.5, -15 + i * 10);
        table.castShadow = true;
        group.add(table);
      }
      break;
    }
    case 'recreation': {
      for (let i = 0; i < 8; i++) {
        const tGeo = new THREE.CylinderGeometry(1.5, 1.5, 1, 8);
        const tMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a });
        const t = new THREE.Mesh(tGeo, tMat);
        const angle = (i / 8) * Math.PI * 2;
        t.position.set(Math.cos(angle) * 15, 0.5, Math.sin(angle) * 15);
        t.castShadow = true;
        group.add(t);
      }
      break;
    }
  }
}

function buildTeleportationPads() {
  // Create teleportation pads between zones
  const pads = [
    { from: ZONES.lobby.center, to: ZONES.rd.center, label: 'R&D' },
    { from: ZONES.lobby.center, to: ZONES.communications.center, label: 'Comms' },
    { from: ZONES.lobby.center, to: ZONES.innovation.center, label: 'Innovation' },
    { from: ZONES.lobby.center, to: ZONES.safety.center, label: 'Safety' },
    { from: ZONES.lobby.center, to: ZONES.recreation.center, label: 'Rec' },
    { from: ZONES.lobby.center, to: ZONES.executive.center, label: 'Executive' }
  ];

  pads.forEach((pad, idx) => {
    const padGeo = new THREE.CircleGeometry(2, 32);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0xff9c3c,
      emissive: 0xfff93e,
      emissiveIntensity: 0.5
    });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.rotation.x = -Math.PI / 2;
    padMesh.position.set(pad.from.x + 20 + idx * 8, 0.05, pad.from.z + 30);
    padMesh.userData = {
      interactable: true,
      type: 'teleport_pad',
      label: 'Teleport: ' + pad.label,
      destination: pad.to,
      targetZone: pad.label
    };
    scene.add(padMesh);
    interactableObjects.push(padMesh);
    teleportationPads.push({ mesh: padMesh, destination: pad.to, label: pad.label });

    // Add glow ring
    const ringGeo = new THREE.TorusGeometry(2.3, 0.2, 8, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xfff93e,
      emissive: 0xfff93e,
      emissiveIntensity: 0.3
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(padMesh.position.x, 0.1, padMesh.position.z);
    ring.userData = { animate: 'rotate-ring', speed: 2 };
    scene.add(ring);
  });
}

function buildCorridors() {
  const corridorMat = new THREE.MeshStandardMaterial({
    color: 0x161422,
    roughness: 0.9,
    metalness: 0.1
  });

  const connections = [
    { from: ZONES.lobby.center, to: ZONES.rd.center },
    { from: ZONES.lobby.center, to: ZONES.communications.center },
    { from: ZONES.lobby.center, to: ZONES.innovation.center },
    { from: ZONES.lobby.center, to: ZONES.safety.center },
    { from: ZONES.lobby.center, to: ZONES.recreation.center },
    { from: ZONES.lobby.center, to: ZONES.executive.center }
  ];

  connections.forEach(({ from, to }) => {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);

    const corrGeo = new THREE.PlaneGeometry(6, length);
    const corridor = new THREE.Mesh(corrGeo, corridorMat);
    corridor.rotation.x = -Math.PI / 2;
    corridor.rotation.z = -angle;
    corridor.position.set(from.x + dx / 2, 0.005, from.z + dz / 2);
    corridor.receiveShadow = true;
    scene.add(corridor);

    const steps = Math.floor(length / 20);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const light = new THREE.PointLight(0x334466, 0.6, 15);
      light.position.set(from.x + dx * t, 5, from.z + dz * t);
      scene.add(light);
    }
  });
}

function buildSkybox() {
  const skyGeo = new THREE.SphereGeometry(600, 32, 32);
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x050308,
    side: THREE.BackSide
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

  const starCount = 800;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 400 + Math.random() * 100;
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.6 + 30;
    starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({ color: 0x8888cc, size: 1.2, sizeAttenuation: true });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);
}

function getPlayerZone(px, pz) {
  for (const [key, zone] of Object.entries(ZONES)) {
    const { center, size } = zone;
    if (
      px >= center.x - size.w / 2 - 5 &&
      px <= center.x + size.w / 2 + 5 &&
      pz >= center.z - size.d / 2 - 5 &&
      pz <= center.z + size.d / 2 + 5
    ) {
      return { key, ...zone };
    }
  }
  return { key: 'corridor', name: 'Corridor', description: 'Connecting pathway' };
}

function updateWorld(delta) {
  scene.traverse((obj) => {
    if (obj.userData.animate === 'rotate') {
      obj.rotation.y += delta * (obj.userData.speed || 1);
    }
    if (obj.userData.animate === 'float') {
      obj.position.y = 3 + Math.sin(clock.elapsedTime * 2) * 0.5;
    }
    if (obj.userData.animate === 'rotate-ring') {
      obj.rotation.z += delta * (obj.userData.speed || 1);
    }
  });
}

function renderWorld() {
  renderer.render(scene, camera);
}

function placeObject(type, position, color, scale) {
  let geo, mat;
  const c = new THREE.Color(color);

  switch (type) {
    case 'cube':
      geo = new THREE.BoxGeometry(1 * scale, 1 * scale, 1 * scale);
      break;
    case 'sphere':
      geo = new THREE.SphereGeometry(0.5 * scale, 16, 16);
      break;
    case 'cylinder':
      geo = new THREE.CylinderGeometry(0.5 * scale, 0.5 * scale, 2 * scale, 12);
      break;
    case 'wall':
      geo = new THREE.BoxGeometry(4 * scale, 3 * scale, 0.3);
      break;
    case 'light': {
      const light = new THREE.PointLight(c.getHex(), 2, 20 * scale);
      light.position.copy(position);
      light.position.y = 4;
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshBasicMaterial({ color: c.getHex() })
      );
      marker.position.copy(light.position);
      marker.userData = { placed: true, type: 'light', linkedLight: light };
      scene.add(light);
      scene.add(marker);
      placedObjects.push(marker);
      return marker;
    }
    case 'sign':
      geo = new THREE.BoxGeometry(3 * scale, 2 * scale, 0.1);
      break;
    default:
      geo = new THREE.BoxGeometry(1, 1, 1);
  }

  mat = new THREE.MeshStandardMaterial({
    color: c.getHex(),
    roughness: 0.5,
    metalness: 0.3
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(position);
  if (type !== 'light') mesh.position.y = (geo.parameters.height || 1) / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { placed: true, type };
  scene.add(mesh);
  placedObjects.push(mesh);
  return mesh;
}

function removeObject(obj) {
  if (!obj || !obj.userData.placed) return;
  if (obj.userData.linkedLight) {
    scene.remove(obj.userData.linkedLight);
  }
  scene.remove(obj);
  placedObjects = placedObjects.filter(o => o !== obj);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function getScene() { return scene; }
function getCamera() { return camera; }
function getRenderer() { return renderer; }
function getClock() { return clock; }
function getInteractables() { return interactableObjects; }
function getPlacedObjects() { return placedObjects; }
function getTeleportationPads() { return teleportationPads; }

export {
  initWorld, updateWorld, renderWorld,
  getScene, getCamera, getRenderer, getClock,
  getPlayerZone, placeObject, removeObject,
  getInteractables, getPlacedObjects, getTeleportationPads,
  ZONES
};
