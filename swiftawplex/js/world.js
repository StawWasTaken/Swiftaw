// ═══════════════════════════════════════════
// SWIFTAWPLEX – 3D WORLD (Three.js)
// ═══════════════════════════════════════════

const ZONES = {
  lobby: {
    name: 'Lobby',
    center: { x: 0, y: 0, z: 0 },
    size: { w: 60, d: 60 },
    color: 0x241f3c,
    floorColor: 0x1a1630,
    description: 'Grand futuristic atrium'
  },
  rd: {
    name: 'R&D Lab',
    center: { x: 80, y: 0, z: 0 },
    size: { w: 50, d: 50 },
    color: 0x0a2a4a,
    floorColor: 0x0d1f33,
    description: 'Research & Development wing'
  },
  communications: {
    name: 'Communications',
    center: { x: -80, y: 0, z: 0 },
    size: { w: 45, d: 45 },
    color: 0x2a1a4a,
    floorColor: 0x1f1535,
    description: 'Media & branding hub'
  },
  innovation: {
    name: 'Innovation Hub',
    center: { x: 0, y: 0, z: -80 },
    size: { w: 55, d: 55 },
    color: 0x1a3a2a,
    floorColor: 0x142a20,
    description: 'Experimental spaces'
  },
  safety: {
    name: 'Safety & Ops',
    center: { x: 0, y: 0, z: 80 },
    size: { w: 45, d: 45 },
    color: 0x3a1a1a,
    floorColor: 0x2a1414,
    description: 'Security & workflow management'
  },
  recreation: {
    name: 'Recreation',
    center: { x: -80, y: 0, z: -80 },
    size: { w: 50, d: 50 },
    color: 0x1a2a3a,
    floorColor: 0x141f2a,
    description: 'Cafeteria, lounge & games'
  },
  executive: {
    name: 'Executive Suite',
    center: { x: 80, y: 0, z: -80 },
    size: { w: 40, d: 40 },
    color: 0x3a2a0a,
    floorColor: 0x2a1f0a,
    description: 'CEO & leadership offices'
  }
};

let scene, camera, renderer;
let worldObjects = [];
let interactableObjects = [];
let placedObjects = [];
let clock;

function initWorld(canvas) {
  clock = new THREE.Clock();

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080610);
  scene.fog = new THREE.FogExp2(0x080610, 0.008);

  // Camera
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 3, 10);

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // Lights
  setupLighting();

  // Build all zones
  buildAllZones();

  // Build connecting corridors
  buildCorridors();

  // Skybox (gradient sphere)
  buildSkybox();

  // Handle resize
  window.addEventListener('resize', onResize);

  return { scene, camera, renderer, clock };
}

function setupLighting() {
  // Ambient
  const ambient = new THREE.AmbientLight(0x404060, 0.4);
  scene.add(ambient);

  // Main directional (sun-like)
  const dirLight = new THREE.DirectionalLight(0xfff4e0, 0.6);
  dirLight.position.set(50, 80, 30);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 200;
  dirLight.shadow.camera.left = -100;
  dirLight.shadow.camera.right = 100;
  dirLight.shadow.camera.top = 100;
  dirLight.shadow.camera.bottom = -100;
  scene.add(dirLight);

  // Hemisphere
  const hemi = new THREE.HemisphereLight(0x4060ff, 0x203020, 0.3);
  scene.add(hemi);
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

  // Floor grid lines
  const gridHelper = new THREE.GridHelper(Math.max(size.w, size.d), 20, 0x333355, 0x222244);
  gridHelper.position.y = 0.01;
  gridHelper.material.opacity = 0.3;
  gridHelper.material.transparent = true;
  group.add(gridHelper);

  // Walls (transparent/glass-like)
  const wallHeight = 8;
  const wallMat = new THREE.MeshStandardMaterial({
    color: color,
    transparent: true,
    opacity: 0.15,
    roughness: 0.1,
    metalness: 0.8,
    side: THREE.DoubleSide
  });

  // North wall
  const wallN = new THREE.Mesh(new THREE.PlaneGeometry(size.w, wallHeight), wallMat);
  wallN.position.set(0, wallHeight / 2, -size.d / 2);
  group.add(wallN);

  // South wall
  const wallS = new THREE.Mesh(new THREE.PlaneGeometry(size.w, wallHeight), wallMat);
  wallS.position.set(0, wallHeight / 2, size.d / 2);
  wallS.rotation.y = Math.PI;
  group.add(wallS);

  // East wall
  const wallE = new THREE.Mesh(new THREE.PlaneGeometry(size.d, wallHeight), wallMat);
  wallE.position.set(size.w / 2, wallHeight / 2, 0);
  wallE.rotation.y = -Math.PI / 2;
  group.add(wallE);

  // West wall
  const wallW = new THREE.Mesh(new THREE.PlaneGeometry(size.d, wallHeight), wallMat);
  wallW.position.set(-size.w / 2, wallHeight / 2, 0);
  wallW.rotation.y = Math.PI / 2;
  group.add(wallW);

  // Ceiling with glow strips
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

  // Decorative pillars at corners
  const pillarGeo = new THREE.CylinderGeometry(0.4, 0.4, wallHeight, 8);
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

  // Zone-specific light (colored point light)
  const zoneLight = new THREE.PointLight(color, 1.5, size.w * 1.2);
  zoneLight.position.set(0, wallHeight - 1, 0);
  group.add(zoneLight);

  // Zone-specific decorations
  addZoneDecorations(group, key, zone);

  scene.add(group);
  worldObjects.push({ key, group, zone });
}

function addZoneDecorations(group, key, zone) {
  const { size } = zone;

  switch (key) {
    case 'lobby': {
      // Central holographic logo pedestal
      const pedestalGeo = new THREE.CylinderGeometry(2, 2.5, 1, 16);
      const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x333355, metalness: 0.8, roughness: 0.2 });
      const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
      pedestal.position.y = 0.5;
      pedestal.castShadow = true;
      group.add(pedestal);

      // Holographic "S" (glowing box as placeholder)
      const holoGeo = new THREE.BoxGeometry(2, 3, 0.3);
      const holoMat = new THREE.MeshStandardMaterial({
        color: 0xfff93e,
        emissive: 0xfff93e,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.6
      });
      const holo = new THREE.Mesh(holoGeo, holoMat);
      holo.position.y = 3;
      holo.userData = { animate: 'rotate', speed: 0.5 };
      group.add(holo);

      // Info boards (along walls)
      for (let i = -2; i <= 2; i++) {
        const boardGeo = new THREE.BoxGeometry(4, 2.5, 0.15);
        const boardMat = new THREE.MeshStandardMaterial({
          color: 0x1a1a3a,
          emissive: 0x222255,
          emissiveIntensity: 0.3
        });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.set(i * 6, 3.5, -size.d / 2 + 0.5);
        board.userData = { interactable: true, type: 'info_board', label: 'Info Board' };
        group.add(board);
        interactableObjects.push(board);
      }

      // Welcome desk
      const deskGeo = new THREE.BoxGeometry(6, 1.2, 2);
      const deskMat = new THREE.MeshStandardMaterial({ color: 0x2a2a4a, metalness: 0.5 });
      const desk = new THREE.Mesh(deskGeo, deskMat);
      desk.position.set(0, 0.6, 8);
      desk.castShadow = true;
      group.add(desk);
      break;
    }

    case 'rd': {
      // Lab tables
      for (let i = 0; i < 4; i++) {
        const tableGeo = new THREE.BoxGeometry(8, 0.8, 2);
        const tableMat = new THREE.MeshStandardMaterial({ color: 0x1a3a5a, metalness: 0.4 });
        const table = new THREE.Mesh(tableGeo, tableMat);
        table.position.set(0, 0.4, -12 + i * 8);
        table.castShadow = true;
        group.add(table);

        // Equipment on tables
        for (let j = -2; j <= 2; j++) {
          const eqGeo = new THREE.BoxGeometry(0.8, 0.6, 0.8);
          const eqMat = new THREE.MeshStandardMaterial({
            color: 0x3388aa,
            emissive: 0x115577,
            emissiveIntensity: 0.2
          });
          const eq = new THREE.Mesh(eqGeo, eqMat);
          eq.position.set(j * 1.5, 1, -12 + i * 8);
          group.add(eq);
        }
      }

      // Prototype station (glowing sphere)
      const protoGeo = new THREE.SphereGeometry(1.5, 32, 32);
      const protoMat = new THREE.MeshStandardMaterial({
        color: 0x00aaff,
        emissive: 0x0066cc,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.7
      });
      const proto = new THREE.Mesh(protoGeo, protoMat);
      proto.position.set(15, 3, 0);
      proto.userData = { animate: 'float', interactable: true, type: 'prototype', label: 'Prototype Station' };
      group.add(proto);
      interactableObjects.push(proto);
      break;
    }

    case 'communications': {
      // Media screens
      for (let i = 0; i < 3; i++) {
        const screenGeo = new THREE.BoxGeometry(6, 3.5, 0.2);
        const screenMat = new THREE.MeshStandardMaterial({
          color: 0x111133,
          emissive: 0x2a1a4a,
          emissiveIntensity: 0.4
        });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(-8 + i * 8, 3.5, -size.d / 2 + 1);
        screen.userData = { interactable: true, type: 'media_screen', label: 'Media Screen' };
        group.add(screen);
        interactableObjects.push(screen);
      }

      // Poster creation stations (desks with glowing surfaces)
      for (let i = 0; i < 3; i++) {
        const stGeo = new THREE.BoxGeometry(3, 1, 2);
        const stMat = new THREE.MeshStandardMaterial({
          color: 0x3a2a5a,
          emissive: 0x5533aa,
          emissiveIntensity: 0.15
        });
        const st = new THREE.Mesh(stGeo, stMat);
        st.position.set(-6 + i * 6, 0.5, 5);
        st.castShadow = true;
        group.add(st);
      }
      break;
    }

    case 'innovation': {
      // Whiteboards
      for (let i = 0; i < 4; i++) {
        const wbGeo = new THREE.BoxGeometry(5, 3, 0.1);
        const wbMat = new THREE.MeshStandardMaterial({
          color: 0xeeeeff,
          emissive: 0x334433,
          emissiveIntensity: 0.1
        });
        const wb = new THREE.Mesh(wbGeo, wbMat);
        wb.position.set(-10 + i * 7, 3, -size.d / 2 + 1);
        wb.userData = { interactable: true, type: 'whiteboard', label: 'Whiteboard' };
        group.add(wb);
        interactableObjects.push(wb);
      }

      // Brainstorm pods (glowing hemispheres)
      for (let i = 0; i < 3; i++) {
        const podGeo = new THREE.SphereGeometry(3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const podMat = new THREE.MeshStandardMaterial({
          color: 0x2a5a3a,
          transparent: true,
          opacity: 0.25,
          side: THREE.DoubleSide
        });
        const pod = new THREE.Mesh(podGeo, podMat);
        pod.position.set(-12 + i * 12, 0, 8);
        group.add(pod);

        // Seating inside
        const seatGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.4, 8);
        const seatMat = new THREE.MeshStandardMaterial({ color: 0x334433 });
        const seat = new THREE.Mesh(seatGeo, seatMat);
        seat.position.set(-12 + i * 12, 0.2, 8);
        group.add(seat);
      }
      break;
    }

    case 'safety': {
      // Monitoring screens array
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 5; col++) {
          const monGeo = new THREE.BoxGeometry(3, 2, 0.15);
          const monMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            emissive: row === 0 ? 0x553333 : 0x335533,
            emissiveIntensity: 0.3
          });
          const mon = new THREE.Mesh(monGeo, monMat);
          mon.position.set(-8 + col * 4, 2.5 + row * 2.5, -size.d / 2 + 1);
          group.add(mon);
        }
      }

      // Central console
      const consGeo = new THREE.CylinderGeometry(3, 3.5, 1, 12);
      const consMat = new THREE.MeshStandardMaterial({ color: 0x3a2a2a, metalness: 0.6 });
      const cons = new THREE.Mesh(consGeo, consMat);
      cons.position.set(0, 0.5, 5);
      cons.castShadow = true;
      cons.userData = { interactable: true, type: 'security_console', label: 'Security Console' };
      group.add(cons);
      interactableObjects.push(cons);
      break;
    }

    case 'recreation': {
      // Tables
      for (let i = 0; i < 6; i++) {
        const tGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 8);
        const tMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a });
        const t = new THREE.Mesh(tGeo, tMat);
        const angle = (i / 6) * Math.PI * 2;
        t.position.set(Math.cos(angle) * 10, 0.4, Math.sin(angle) * 10);
        t.castShadow = true;
        group.add(t);

        // Chairs around tables
        for (let c = 0; c < 4; c++) {
          const chGeo = new THREE.BoxGeometry(0.6, 0.8, 0.6);
          const chMat = new THREE.MeshStandardMaterial({ color: 0x3a4a5a });
          const ch = new THREE.Mesh(chGeo, chMat);
          const ca = angle + (c / 4) * Math.PI * 0.5 - Math.PI * 0.25;
          ch.position.set(
            Math.cos(angle) * 10 + Math.cos(ca) * 2,
            0.4,
            Math.sin(angle) * 10 + Math.sin(ca) * 2
          );
          group.add(ch);
        }
      }

      // Game area marker
      const gameGeo = new THREE.RingGeometry(4, 5, 32);
      const gameMat = new THREE.MeshStandardMaterial({
        color: 0x4488ff,
        emissive: 0x2244aa,
        emissiveIntensity: 0.3,
        side: THREE.DoubleSide
      });
      const gameRing = new THREE.Mesh(gameGeo, gameMat);
      gameRing.rotation.x = -Math.PI / 2;
      gameRing.position.y = 0.02;
      group.add(gameRing);
      break;
    }

    case 'executive': {
      // CEO desk
      const ceoDesk = new THREE.BoxGeometry(5, 0.8, 2.5);
      const ceoDeskMat = new THREE.MeshStandardMaterial({ color: 0x5a4a2a, metalness: 0.5, roughness: 0.3 });
      const desk = new THREE.Mesh(ceoDesk, ceoDeskMat);
      desk.position.set(0, 0.4, -6);
      desk.castShadow = true;
      group.add(desk);

      // CEO chair
      const chairGeo = new THREE.BoxGeometry(1.5, 2, 1.5);
      const chairMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a });
      const chair = new THREE.Mesh(chairGeo, chairMat);
      chair.position.set(0, 1, -8);
      group.add(chair);

      // Trophy case
      const trophyGeo = new THREE.BoxGeometry(6, 4, 1);
      const trophyMat = new THREE.MeshStandardMaterial({
        color: 0x4a3a1a,
        transparent: true,
        opacity: 0.4,
        metalness: 0.8
      });
      const trophy = new THREE.Mesh(trophyGeo, trophyMat);
      trophy.position.set(0, 2, -size.d / 2 + 1);
      trophy.userData = { interactable: true, type: 'trophy_case', label: 'Trophy Case' };
      group.add(trophy);
      interactableObjects.push(trophy);

      // Gold accent light
      const goldLight = new THREE.PointLight(0xffd700, 1.5, 30);
      goldLight.position.set(0, 6, -5);
      group.add(goldLight);
      break;
    }
  }
}

function buildCorridors() {
  const corridorMat = new THREE.MeshStandardMaterial({
    color: 0x161422,
    roughness: 0.9,
    metalness: 0.1
  });

  // Connections: lobby to each zone
  const connections = [
    { from: ZONES.lobby.center, to: ZONES.rd.center },
    { from: ZONES.lobby.center, to: ZONES.communications.center },
    { from: ZONES.lobby.center, to: ZONES.innovation.center },
    { from: ZONES.lobby.center, to: ZONES.safety.center },
    { from: ZONES.lobby.center, to: ZONES.recreation.center },
    { from: ZONES.lobby.center, to: ZONES.executive.center },
  ];

  connections.forEach(({ from, to }) => {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);

    const corrGeo = new THREE.PlaneGeometry(5, length);
    const corridor = new THREE.Mesh(corrGeo, corridorMat);
    corridor.rotation.x = -Math.PI / 2;
    corridor.rotation.z = -angle;
    corridor.position.set(
      from.x + dx / 2,
      0.005,
      from.z + dz / 2
    );
    corridor.receiveShadow = true;
    scene.add(corridor);

    // Corridor lights
    const steps = Math.floor(length / 15);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const light = new THREE.PointLight(0x334466, 0.5, 10);
      light.position.set(
        from.x + dx * t,
        4,
        from.z + dz * t
      );
      scene.add(light);
    }
  });
}

function buildSkybox() {
  const skyGeo = new THREE.SphereGeometry(400, 32, 32);
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x080610,
    side: THREE.BackSide
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

  // Distant star-like particles
  const starCount = 500;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 300 + Math.random() * 80;
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.5 + 20;
    starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({ color: 0x8888cc, size: 0.8, sizeAttenuation: true });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);
}

/**
 * Detect which zone the player is in
 */
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

/**
 * Animate world objects
 */
function updateWorld(delta) {
  // Animate marked objects
  scene.traverse((obj) => {
    if (obj.userData.animate === 'rotate') {
      obj.rotation.y += delta * (obj.userData.speed || 1);
    }
    if (obj.userData.animate === 'float') {
      obj.position.y = 3 + Math.sin(clock.elapsedTime * 2) * 0.5;
    }
  });
}

/**
 * Render the scene
 */
function renderWorld() {
  renderer.render(scene, camera);
}

/**
 * Place a user-created object
 */
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

/**
 * Remove a placed object
 */
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

export {
  initWorld, updateWorld, renderWorld,
  getScene, getCamera, getRenderer, getClock,
  getPlayerZone, placeObject, removeObject,
  getInteractables, getPlacedObjects,
  ZONES
};
