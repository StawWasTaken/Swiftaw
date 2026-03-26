// ═══════════════════════════════════════════
// SWIFTAWPLEX – ULTRA REALISTIC 3D WORLD
// GTA5-Quality Virtual HQ with Advanced Graphics
// ═══════════════════════════════════════════

const ZONES = {
  lobby: {
    name: 'LOBBY',
    center: { x: 0, y: 0, z: 0 },
    size: { w: 100, d: 100 },
    color: 0x241f3c,
    floorColor: 0x0d0b14,
    description: 'Grand Futuristic Atrium'
  },
  rd: {
    name: 'R&D WING',
    center: { x: 160, y: 0, z: 0 },
    size: { w: 90, d: 90 },
    color: 0x0a2a4a,
    floorColor: 0x050d1a,
    description: 'Research & Development Labs'
  },
  comms: {
    name: 'COMMUNICATIONS',
    center: { x: -160, y: 0, z: 0 },
    size: { w: 85, d: 85 },
    color: 0x2a1a4a,
    floorColor: 0x140a25,
    description: 'Media & Communications Hub'
  },
  innovation: {
    name: 'INNOVATION HUB',
    center: { x: 0, y: 0, z: -160 },
    size: { w: 95, d: 95 },
    color: 0x1a3a2a,
    floorColor: 0x0a1a10,
    description: 'Experimental Innovation Space'
  },
  safety: {
    name: 'OPERATIONS',
    center: { x: 0, y: 0, z: 160 },
    size: { w: 85, d: 85 },
    color: 0x3a1a1a,
    floorColor: 0x1a0a0a,
    description: 'Safety & Operations Center'
  },
  recreation: {
    name: 'RECREATION',
    center: { x: -160, y: 0, z: -160 },
    size: { w: 90, d: 90 },
    color: 0x1a2a3a,
    floorColor: 0x0a121a,
    description: 'Cafeteria & Recreation Zone'
  }
};

let scene, camera, renderer, composer;
let worldObjects = [];
let interactableObjects = [];
let placedObjects = [];
let clock;
let teleportationPads = [];
let particleSystems = [];
let environmentLights = [];

function initWorld(canvas) {
  clock = new THREE.Clock();

  // Scene setup with better performance
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020104);
  scene.fog = new THREE.FogExp2(0x020104, 0.0035);

  // Enhanced camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 3, 15);

  // High-quality WebGL renderer
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    precision: 'highp',
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputEncoding = THREE.sRGBEncoding;

  // Advanced lighting
  setupAdvancedLighting();

  // Build world
  buildMassiveSkyscrapers();
  buildAllZones();
  buildDetailedCorridors();
  buildTeleportationPads();
  buildAdvancedSkybox();
  addEnvironmentalEffects();

  window.addEventListener('resize', onResize);

  return { scene, camera, renderer, clock };
}

function setupAdvancedLighting() {
  // Global ambient light
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  // Primary directional light (sun-like)
  const dirLight = new THREE.DirectionalLight(0xfff8e0, 1.0);
  dirLight.position.set(200, 250, 100);
  dirLight.target.position.set(0, 0, 0);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(4096, 4096);
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 1000;
  dirLight.shadow.camera.left = -500;
  dirLight.shadow.camera.right = 500;
  dirLight.shadow.camera.top = 500;
  dirLight.shadow.camera.bottom = -500;
  dirLight.shadow.bias = -0.0001;
  scene.add(dirLight);
  scene.add(dirLight.target);

  // Hemisphere light for better ambient
  const hemi = new THREE.HemisphereLight(0x4070ff, 0x203020, 0.5);
  scene.add(hemi);

  // Add realistic environment lights
  const envLightPositions = [
    { pos: [250, 150, 250], color: 0xff9c3c, intensity: 1.5 },
    { pos: [-250, 150, -250], color: 0x3c9cff, intensity: 1.2 },
    { pos: [250, 150, -250], color: 0xff3c9c, intensity: 1.0 }
  ];

  envLightPositions.forEach(({ pos, color, intensity }) => {
    const light = new THREE.PointLight(color, intensity, 500);
    light.position.set(pos[0], pos[1], pos[2]);
    light.castShadow = true;
    scene.add(light);
    environmentLights.push(light);
  });
}

function buildMassiveSkyscrapers() {
  const towers = [
    { pos: [220, 0, 220], color: 0x2a4a7a, height: 80 },
    { pos: [-220, 0, 220], color: 0x4a2a7a, height: 85 },
    { pos: [220, 0, -220], color: 0x2a7a4a, height: 75 },
    { pos: [-220, 0, -220], color: 0x7a4a2a, height: 90 }
  ];

  towers.forEach(({ pos, color, height }) => {
    const width = 35;
    const depth = 35;

    // Main tower body with advanced material
    const towerGeo = new THREE.BoxGeometry(width, height, depth, 8, 1, 8);
    const towerMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.3,
      metalness: 0.4,
      envMapIntensity: 0.5
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(pos[0], height / 2, pos[2]);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);

    // Detailed window grid with glow
    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4.5) {
        const winGeo = new THREE.BoxGeometry(1.8, 1.8, 0.3);
        const winMat = new THREE.MeshStandardMaterial({
          color: 0x88ccff,
          emissive: 0x2255ff,
          emissiveIntensity: 0.6,
          roughness: 0.1,
          metalness: 0.8
        });
        const win = new THREE.Mesh(winGeo, winMat);
        win.position.set(
          pos[0] - width / 2 + x + 2,
          y + 2,
          pos[2] + depth / 2 + 0.3
        );
        scene.add(win);
      }
    }

    // Multiple spires and antenna
    const spire1Geo = new THREE.ConeGeometry(width / 3, 25, 16);
    const spireMat = new THREE.MeshStandardMaterial({
      color: 0xfff93e,
      emissive: 0xff9c3c,
      emissiveIntensity: 0.5,
      metalness: 0.9,
      roughness: 0.1
    });
    const spire1 = new THREE.Mesh(spire1Geo, spireMat);
    spire1.position.set(pos[0], height + 12, pos[2]);
    scene.add(spire1);

    // Antenna
    const antGeo = new THREE.CylinderGeometry(0.3, 0.3, 15, 8);
    const antMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 1,
      roughness: 0.2
    });
    const antenna = new THREE.Mesh(antGeo, antMat);
    antenna.position.set(pos[0] + 8, height + 35, pos[2] + 8);
    scene.add(antenna);
  });
}

function buildAllZones() {
  for (const [key, zone] of Object.entries(ZONES)) {
    buildRealisticZone(key, zone);
  }
}

function buildRealisticZone(key, zone) {
  const { center, size, color, floorColor } = zone;
  const group = new THREE.Group();
  group.position.set(center.x, center.y, center.z);

  // High-quality floor with subtle detail
  const floorGeo = new THREE.PlaneGeometry(size.w, size.d, 32, 32);
  const floorMat = new THREE.MeshStandardMaterial({
    color: floorColor,
    roughness: 0.6,
    metalness: 0.1,
    envMapIntensity: 0.3
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Grid with improved visibility
  const gridHelper = new THREE.GridHelper(Math.max(size.w, size.d), 40, 0x444466, 0x222244);
  gridHelper.position.y = 0.02;
  gridHelper.material.opacity = 0.15;
  gridHelper.material.transparent = true;
  group.add(gridHelper);

  // Realistic walls
  const wallHeight = 16;
  const wallMat = new THREE.MeshStandardMaterial({
    color: color,
    transparent: true,
    opacity: 0.15,
    roughness: 0.2,
    metalness: 0.7,
    side: THREE.DoubleSide
  });

  const walls = [
    { geo: new THREE.PlaneGeometry(size.w, wallHeight), pos: [0, wallHeight / 2, -size.d / 2], rot: [0, 0, 0] },
    { geo: new THREE.PlaneGeometry(size.w, wallHeight), pos: [0, wallHeight / 2, size.d / 2], rot: [0, Math.PI, 0] },
    { geo: new THREE.PlaneGeometry(size.d, wallHeight), pos: [size.w / 2, wallHeight / 2, 0], rot: [0, -Math.PI / 2, 0] },
    { geo: new THREE.PlaneGeometry(size.d, wallHeight), pos: [-size.w / 2, wallHeight / 2, 0], rot: [0, Math.PI / 2, 0] }
  ];

  walls.forEach(({ geo, pos, rot }) => {
    const wall = new THREE.Mesh(geo, wallMat);
    wall.position.set(pos[0], pos[1], pos[2]);
    wall.rotation.order = 'YXZ';
    wall.rotation.set(rot[0], rot[1], rot[2]);
    group.add(wall);
  });

  // Ceiling
  const ceilGeo = new THREE.PlaneGeometry(size.w, size.d);
  const ceilMat = new THREE.MeshStandardMaterial({
    color: color,
    transparent: true,
    opacity: 0.08,
    side: THREE.DoubleSide
  });
  const ceil = new THREE.Mesh(ceilGeo, ceilMat);
  ceil.position.y = wallHeight;
  ceil.rotation.x = Math.PI / 2;
  group.add(ceil);

  // Metallic pillars with shadows
  const pillarGeo = new THREE.CylinderGeometry(0.8, 0.8, wallHeight, 16);
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x555577,
    roughness: 0.2,
    metalness: 0.8,
    envMapIntensity: 0.5
  });
  const corners = [
    [-size.w / 2 + 2, 0, -size.d / 2 + 2],
    [size.w / 2 - 2, 0, -size.d / 2 + 2],
    [-size.w / 2 + 2, 0, size.d / 2 - 2],
    [size.w / 2 - 2, 0, size.d / 2 - 2]
  ];

  corners.forEach(([cx, cy, cz]) => {
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(cx, wallHeight / 2, cz);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    group.add(pillar);
  });

  // Zone lighting with color variation
  const zoneLight = new THREE.PointLight(color, 3, size.w * 2);
  zoneLight.position.set(0, wallHeight - 2, 0);
  zoneLight.castShadow = true;
  group.add(zoneLight);

  addZoneDecorations(group, key, zone);
  scene.add(group);
  worldObjects.push({ key, group, zone });
}

function addZoneDecorations(group, key, zone) {
  const { size } = zone;

  switch (key) {
    case 'lobby': {
      // Central holographic pedestal
      const pedestalGeo = new THREE.CylinderGeometry(4.5, 5, 2, 32);
      const pedestalMat = new THREE.MeshStandardMaterial({
        color: 0x444466,
        metalness: 0.9,
        roughness: 0.1,
        envMapIntensity: 0.7
      });
      const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
      pedestal.position.y = 1;
      pedestal.castShadow = true;
      pedestal.receiveShadow = true;
      group.add(pedestal);

      // Large holographic Swiftaw logo
      const holoGeo = new THREE.BoxGeometry(5, 6.5, 0.8);
      const holoMat = new THREE.MeshStandardMaterial({
        color: 0xfff93e,
        emissive: 0xfff93e,
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.7,
        metalness: 0.5,
        roughness: 0.1
      });
      const holo = new THREE.Mesh(holoGeo, holoMat);
      holo.position.y = 5;
      holo.userData = { animate: 'rotate', speed: 0.5 };
      holo.castShadow = true;
      group.add(holo);

      // Glow ring around hologram
      const ringGeo = new THREE.TorusGeometry(5.2, 0.3, 16, 64);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xfff93e,
        emissive: 0xfff93e,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.8
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = 0.3;
      ring.position.y = 5;
      ring.userData = { animate: 'rotate-ring', speed: 1 };
      group.add(ring);
      break;
    }

    case 'rd': {
      // Research stations
      for (let i = 0; i < 6; i++) {
        const tableGeo = new THREE.BoxGeometry(12, 1.2, 3);
        const tableMat = new THREE.MeshStandardMaterial({
          color: 0x1a3a5a,
          metalness: 0.5,
          roughness: 0.3
        });
        const table = new THREE.Mesh(tableGeo, tableMat);
        table.position.set(0, 0.6, -20 + i * 7);
        table.castShadow = true;
        table.receiveShadow = true;
        group.add(table);

        // Lab equipment on tables
        const equipGeo = new THREE.BoxGeometry(1, 1.5, 1);
        const equipMat = new THREE.MeshStandardMaterial({
          color: 0x2a4a5a,
          emissive: 0x0a5a7a,
          emissiveIntensity: 0.3
        });
        for (let j = 0; j < 3; j++) {
          const equip = new THREE.Mesh(equipGeo, equipMat);
          equip.position.set(-4 + j * 4, 2, -20 + i * 7);
          equip.castShadow = true;
          group.add(equip);
        }
      }
      break;
    }

    case 'recreation': {
      // Casual seating arrangement
      for (let i = 0; i < 12; i++) {
        const tGeo = new THREE.CylinderGeometry(2, 2, 1.2, 16);
        const tMat = new THREE.MeshStandardMaterial({
          color: 0x3a4a5a,
          roughness: 0.5,
          metalness: 0.3
        });
        const t = new THREE.Mesh(tGeo, tMat);
        const angle = (i / 12) * Math.PI * 2;
        t.position.set(Math.cos(angle) * 20, 0.6, Math.sin(angle) * 20);
        t.castShadow = true;
        t.receiveShadow = true;
        group.add(t);
      }
      break;
    }
  }
}

function buildDetailedCorridors() {
  const corridorMat = new THREE.MeshStandardMaterial({
    color: 0x0a0810,
    roughness: 0.8,
    metalness: 0.15
  });

  const connections = [
    { from: ZONES.lobby.center, to: ZONES.rd.center },
    { from: ZONES.lobby.center, to: ZONES.comms.center },
    { from: ZONES.lobby.center, to: ZONES.innovation.center },
    { from: ZONES.lobby.center, to: ZONES.safety.center },
    { from: ZONES.lobby.center, to: ZONES.recreation.center }
  ];

  connections.forEach(({ from, to }) => {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);

    const corrGeo = new THREE.PlaneGeometry(8, length);
    const corridor = new THREE.Mesh(corrGeo, corridorMat);
    corridor.rotation.x = -Math.PI / 2;
    corridor.rotation.z = -angle;
    corridor.position.set(from.x + dx / 2, 0.01, from.z + dz / 2);
    corridor.receiveShadow = true;
    scene.add(corridor);

    // Corridor lighting every 25 units
    const steps = Math.floor(length / 25);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const light = new THREE.PointLight(0x3a5a7a, 0.8, 20);
      light.position.set(from.x + dx * t, 6, from.z + dz * t);
      light.castShadow = true;
      scene.add(light);
    }
  });
}

function buildTeleportationPads() {
  const pads = [
    { from: ZONES.lobby.center, to: ZONES.rd.center, label: 'R&D' },
    { from: ZONES.lobby.center, to: ZONES.comms.center, label: 'COMMS' },
    { from: ZONES.lobby.center, to: ZONES.innovation.center, label: 'INNOVATION' },
    { from: ZONES.lobby.center, to: ZONES.safety.center, label: 'OPS' },
    { from: ZONES.lobby.center, to: ZONES.recreation.center, label: 'REC' }
  ];

  pads.forEach((pad, idx) => {
    const padGeo = new THREE.CircleGeometry(3, 32);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0xff9c3c,
      emissive: 0xfff93e,
      emissiveIntensity: 0.7,
      metalness: 0.7,
      roughness: 0.1
    });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.rotation.x = -Math.PI / 2;
    padMesh.position.set(pad.from.x + 25 + idx * 12, 0.08, pad.from.z + 40);
    padMesh.castShadow = true;
    padMesh.userData = {
      interactable: true,
      type: 'teleport_pad',
      label: '◆ TP: ' + pad.label,
      destination: pad.to,
      targetZone: pad.label
    };
    scene.add(padMesh);
    interactableObjects.push(padMesh);
    teleportationPads.push({ mesh: padMesh, destination: pad.to, label: pad.label });

    // Dual glow rings
    const ringGeo1 = new THREE.TorusGeometry(3.3, 0.25, 8, 32);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0xfff93e,
      emissive: 0xfff93e,
      emissiveIntensity: 0.5
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = -Math.PI / 2;
    ring1.position.set(padMesh.position.x, 0.1, padMesh.position.z);
    ring1.userData = { animate: 'rotate-ring', speed: 2 };
    scene.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(3.7, 0.15, 8, 32);
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0xff9c3c,
      emissive: 0xff9c3c,
      emissiveIntensity: 0.3
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.set(padMesh.position.x, 0.12, padMesh.position.z);
    ring2.userData = { animate: 'rotate-ring', speed: -1.5 };
    scene.add(ring2);
  });
}

function buildAdvancedSkybox() {
  // Star field backdrop
  const skyGeo = new THREE.SphereGeometry(1200, 64, 64);
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x010002,
    side: THREE.BackSide
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

  // High-density star field
  const starCount = 2000;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 600 + Math.random() * 200;

    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.5 + 50;
    starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    // Color variation
    const color = Math.random();
    if (color < 0.7) {
      starColors[i * 3] = 1;
      starColors[i * 3 + 1] = 1;
      starColors[i * 3 + 2] = 1;
    } else if (color < 0.85) {
      starColors[i * 3] = 1;
      starColors[i * 3 + 1] = 0.8;
      starColors[i * 3 + 2] = 0.6;
    } else {
      starColors[i * 3] = 0.7;
      starColors[i * 3 + 1] = 0.8;
      starColors[i * 3 + 2] = 1;
    }
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
  const starMat = new THREE.PointsMaterial({
    size: 1.5,
    sizeAttenuation: true,
    vertexColors: true
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);
}

function addEnvironmentalEffects() {
  // Subtle ambient particles
  const particleCount = 500;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 600;
    particlePositions[i * 3 + 1] = Math.random() * 200;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 600;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0xfff93e,
    size: 0.15,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.3
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  particles.userData = { animate: 'float-slow' };
  scene.add(particles);
  particleSystems.push(particles);
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
  return { key: 'corridor', name: 'CORRIDOR', description: 'Connecting Pathway' };
}

function updateWorld(delta) {
  scene.traverse((obj) => {
    if (obj.userData.animate === 'rotate') {
      obj.rotation.y += delta * (obj.userData.speed || 1);
    }
    if (obj.userData.animate === 'float') {
      obj.position.y = 5 + Math.sin(clock.elapsedTime * 1.5) * 0.7;
    }
    if (obj.userData.animate === 'rotate-ring') {
      obj.rotation.z += delta * (obj.userData.speed || 1);
    }
    if (obj.userData.animate === 'float-slow') {
      obj.position.y = (obj.position.y || 0) + Math.sin(clock.elapsedTime * 0.2) * 0.02;
    }
  });

  // Animate particle systems
  particleSystems.forEach(system => {
    if (system.userData.animate === 'float-slow') {
      const positions = system.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += Math.sin(clock.elapsedTime * 0.1 + i) * 0.01;
      }
      system.geometry.attributes.position.needsUpdate = true;
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
      geo = new THREE.SphereGeometry(0.5 * scale, 32, 32);
      break;
    case 'cylinder':
      geo = new THREE.CylinderGeometry(0.5 * scale, 0.5 * scale, 2 * scale, 32);
      break;
    case 'wall':
      geo = new THREE.BoxGeometry(4 * scale, 3 * scale, 0.3);
      break;
    case 'light': {
      const light = new THREE.PointLight(c.getHex(), 2, 20 * scale);
      light.position.copy(position);
      light.position.y = 4;
      light.castShadow = true;
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 16, 16),
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
    roughness: 0.4,
    metalness: 0.4,
    envMapIntensity: 0.5
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
