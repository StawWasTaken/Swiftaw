// ═══════════════════════════════════════════
// SWIFTAWPLEX – HYPER-REALISTIC 3D WORLD
// AAA-Quality Corporate Virtual HQ
// ═══════════════════════════════════════════

const ZONES = {
  lobby: {
    name: 'LOBBY',
    center: { x: 0, y: 0, z: 0 },
    size: { w: 120, d: 120 },
    color: 0x241f3c,
    floorColor: 0x0d0b14,
    description: 'Grand Futuristic Atrium'
  },
  rd: {
    name: 'R&D WING',
    center: { x: 200, y: 0, z: 0 },
    size: { w: 110, d: 110 },
    color: 0x0a2a4a,
    floorColor: 0x050d1a,
    description: 'Research & Development Labs'
  },
  comms: {
    name: 'COMMUNICATIONS',
    center: { x: -200, y: 0, z: 0 },
    size: { w: 105, d: 105 },
    color: 0x2a1a4a,
    floorColor: 0x140a25,
    description: 'Media & Communications Hub'
  },
  innovation: {
    name: 'INNOVATION HUB',
    center: { x: 0, y: 0, z: -200 },
    size: { w: 115, d: 115 },
    color: 0x1a3a2a,
    floorColor: 0x0a1a10,
    description: 'Experimental Innovation Space'
  },
  safety: {
    name: 'OPERATIONS',
    center: { x: 0, y: 0, z: 200 },
    size: { w: 105, d: 105 },
    color: 0x3a1a1a,
    floorColor: 0x1a0a0a,
    description: 'Safety & Operations Center'
  },
  recreation: {
    name: 'RECREATION',
    center: { x: -200, y: 0, z: -200 },
    size: { w: 110, d: 110 },
    color: 0x1a2a3a,
    floorColor: 0x0a121a,
    description: 'Cafeteria & Recreation Zone'
  }
};

let scene, camera, renderer;
let worldObjects = [];
let interactableObjects = [];
let placedObjects = [];
let clock;
let teleportationPads = [];
let particleSystems = [];
let environmentLights = [];
let decorativeElements = [];

function initWorld(canvas) {
  clock = new THREE.Clock();

  // Ultra-realistic scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0810);
  scene.fog = new THREE.FogExp2(0x0a0810, 0.002);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 3000);
  camera.position.set(0, 3, 20);

  // Premium renderer settings
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    precision: 'highp',
    powerPreference: 'high-performance',
    alpha: false
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowShadowMap;
  renderer.shadowMap.autoUpdate = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputEncoding = THREE.sRGBEncoding;

  // Photorealistic lighting
  setupHyperRealisticLighting();

  // Build hyper-detailed world
  buildMassiveRealisticSkyscrapers();
  buildAllZonesDetailed();
  buildDetailedCorridorsWithRailings();
  buildTeleportationPads();
  buildHyperRealisticSkybox();
  addRealisticEnvironment();
  addVegetation();

  window.addEventListener('resize', onResize);

  return { scene, camera, renderer, clock };
}

function setupHyperRealisticLighting() {
  // Soft global ambient
  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);

  // Primary directional light (sunrise/sunset angle)
  const dirLight = new THREE.DirectionalLight(0xfff0d0, 1.1);
  dirLight.position.set(300, 280, 150);
  dirLight.target.position.set(0, 0, 0);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(4096, 4096);
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 1500;
  dirLight.shadow.camera.left = -600;
  dirLight.shadow.camera.right = 600;
  dirLight.shadow.camera.top = 600;
  dirLight.shadow.camera.bottom = -600;
  dirLight.shadow.bias = -0.00015;
  dirLight.shadow.normalBias = 0.02;
  scene.add(dirLight);
  scene.add(dirLight.target);

  // Secondary fill light
  const fillLight = new THREE.DirectionalLight(0x6060ff, 0.3);
  fillLight.position.set(-200, 150, -200);
  scene.add(fillLight);

  // Hemisphere for sky-ground ambient
  const hemi = new THREE.HemisphereLight(0x5080ff, 0x404020, 0.4);
  scene.add(hemi);

  // Zone-specific environmental lights
  const envLights = [
    { pos: [300, 180, 300], color: 0xff9c3c, intensity: 1.8, distance: 600 },
    { pos: [-300, 180, -300], color: 0x3c9cff, intensity: 1.5, distance: 600 },
    { pos: [300, 180, -300], color: 0xff3c9c, intensity: 1.2, distance: 550 },
    { pos: [-300, 180, 300], color: 0x9cff3c, intensity: 1.3, distance: 550 }
  ];

  envLights.forEach(({ pos, color, intensity, distance }) => {
    const light = new THREE.PointLight(color, intensity, distance);
    light.position.set(pos[0], pos[1], pos[2]);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    scene.add(light);
    environmentLights.push(light);
  });
}

function buildMassiveRealisticSkyscrapers() {
  const towers = [
    { pos: [280, 0, 280], color: 0x3a5a8a, height: 100 },
    { pos: [-280, 0, 280], color: 0x5a3a8a, height: 110 },
    { pos: [280, 0, -280], color: 0x3a8a5a, height: 95 },
    { pos: [-280, 0, -280], color: 0x8a5a3a, height: 105 }
  ];

  towers.forEach(({ pos, color, height }) => {
    const width = 45;
    const depth = 45;

    // Main structure with beveled edges
    const towerGeo = new THREE.BoxGeometry(width, height, depth, 16, 2, 16);
    const towerMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.25,
      metalness: 0.5,
      envMapIntensity: 0.8
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(pos[0], height / 2, pos[2]);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);

    // Ultra-detailed window grid (every floor)
    for (let y = 0; y < height; y += 5) {
      for (let x = 0; x < width; x += 6) {
        for (let z = 0; z < 4; z++) {
          const winGeo = new THREE.BoxGeometry(2.2, 2.2, 0.4);
          const winMat = new THREE.MeshStandardMaterial({
            color: 0x5588ff,
            emissive: 0x2255ff,
            emissiveIntensity: Math.random() * 0.5 + 0.3,
            roughness: 0.05,
            metalness: 0.9
          });
          const win = new THREE.Mesh(winGeo, winMat);
          const side = z === 0 ? 1 : z === 1 ? -1 : z === 2 ? 1 : -1;
          const isX = z < 2;
          if (isX) {
            win.position.set(pos[0] - width / 2 + x + 3, y + 2.5, pos[2] + depth / 2 + 0.3);
          } else {
            win.position.set(pos[0] + width / 2 + 0.3, y + 2.5, pos[2] - depth / 2 + x + 3);
          }
          scene.add(win);
        }
      }
    }

    // Horizontal floor separators
    for (let y = 0; y < height; y += 5) {
      const floorGeo = new THREE.BoxGeometry(width + 2, 0.3, depth + 2);
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x222244,
        metalness: 0.6,
        roughness: 0.3
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.position.set(pos[0], y, pos[2]);
      floor.castShadow = true;
      floor.receiveShadow = true;
      scene.add(floor);
    }

    // Vertical structural beams
    for (let x = 0; x < width; x += 15) {
      const beamGeo = new THREE.BoxGeometry(1.2, height, 1.2);
      const beamMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a2a,
        metalness: 0.8,
        roughness: 0.1
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(pos[0] - width / 2 + x, height / 2, pos[2]);
      beam.castShadow = true;
      scene.add(beam);
    }

    // Crown/spire with realistic geometry
    const spireGeo = new THREE.ConeGeometry(width / 2.5, 35, 32);
    const spireMat = new THREE.MeshStandardMaterial({
      color: 0xfff93e,
      emissive: 0xfff93e,
      emissiveIntensity: 0.7,
      metalness: 0.8,
      roughness: 0.15
    });
    const spire = new THREE.Mesh(spireGeo, spireMat);
    spire.position.set(pos[0], height + 17, pos[2]);
    spire.castShadow = true;
    scene.add(spire);

    // Multiple antennas and dish
    for (let i = 0; i < 3; i++) {
      const antGeo = new THREE.CylinderGeometry(0.4, 0.4, 20 + i * 5, 16);
      const antMat = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 0.95,
        roughness: 0.15
      });
      const antenna = new THREE.Mesh(antGeo, antMat);
      antenna.position.set(pos[0] + 10 + i * 8, height + 40, pos[2] + 10);
      antenna.castShadow = true;
      scene.add(antenna);
    }

    // Satellite dish
    const dishGeo = new THREE.CylinderGeometry(6, 6, 0.5, 32);
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      metalness: 0.8,
      roughness: 0.2
    });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.set(pos[0] - 15, height + 25, pos[2] - 15);
    dish.rotation.x = 0.4;
    dish.castShadow = true;
    scene.add(dish);
  });
}

function buildAllZonesDetailed() {
  for (const [key, zone] of Object.entries(ZONES)) {
    buildHyperRealisticZone(key, zone);
  }
}

function buildHyperRealisticZone(key, zone) {
  const { center, size, color, floorColor } = zone;
  const group = new THREE.Group();
  group.position.set(center.x, center.y, center.z);

  // Detailed polished floor with subtle texture
  const floorGeo = new THREE.PlaneGeometry(size.w, size.d, 64, 64);
  const floorMat = new THREE.MeshStandardMaterial({
    color: floorColor,
    roughness: 0.4,
    metalness: 0.15,
    envMapIntensity: 0.6
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Grid with proper spacing
  const gridHelper = new THREE.GridHelper(Math.max(size.w, size.d), 60, 0x555577, 0x222244);
  gridHelper.position.y = 0.03;
  gridHelper.material.opacity = 0.12;
  gridHelper.material.transparent = true;
  group.add(gridHelper);

  // Realistic walls with metallic sheen
  const wallHeight = 20;
  const wallMat = new THREE.MeshStandardMaterial({
    color: color,
    transparent: true,
    opacity: 0.18,
    roughness: 0.1,
    metalness: 0.8,
    side: THREE.DoubleSide
  });

  const walls = [
    { geo: new THREE.PlaneGeometry(size.w, wallHeight), pos: [0, wallHeight / 2, -size.d / 2] },
    { geo: new THREE.PlaneGeometry(size.w, wallHeight), pos: [0, wallHeight / 2, size.d / 2] },
    { geo: new THREE.PlaneGeometry(size.d, wallHeight), pos: [size.w / 2, wallHeight / 2, 0] },
    { geo: new THREE.PlaneGeometry(size.d, wallHeight), pos: [-size.w / 2, wallHeight / 2, 0] }
  ];

  walls.forEach(({ geo, pos }) => {
    const wall = new THREE.Mesh(geo, wallMat);
    wall.position.set(pos[0], pos[1], pos[2]);
    group.add(wall);
  });

  // Detailed ceiling with panel divisions
  const ceilGeo = new THREE.PlaneGeometry(size.w, size.d, 16, 16);
  const ceilMat = new THREE.MeshStandardMaterial({
    color: color,
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide
  });
  const ceil = new THREE.Mesh(ceilGeo, ceilMat);
  ceil.position.y = wallHeight;
  ceil.rotation.x = Math.PI / 2;
  group.add(ceil);

  // Ceiling panel divisions (grid)
  for (let x = -size.w / 2; x < size.w / 2; x += 10) {
    const panelGeo = new THREE.BoxGeometry(0.2, 0.3, size.d);
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x444466,
      roughness: 0.3,
      metalness: 0.5
    });
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(x, wallHeight - 0.2, 0);
    group.add(panel);
  }

  // Recessed ceiling lights (realistic)
  const lightSpacing = 8;
  for (let x = -size.w / 2 + 4; x < size.w / 2; x += lightSpacing) {
    for (let z = -size.d / 2 + 4; z < size.d / 2; z += lightSpacing) {
      // Light fixture
      const fixtureGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 32);
      const fixtureMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a2a,
        metalness: 0.6,
        roughness: 0.2
      });
      const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
      fixture.position.set(x, wallHeight - 0.1, z);
      fixture.castShadow = true;
      group.add(fixture);

      // Light emission
      const lightGeo = new THREE.CircleGeometry(0.7, 32);
      const lightMat = new THREE.MeshBasicMaterial({
        color: 0xffeecc,
        emissive: 0xffeecc
      });
      const light = new THREE.Mesh(lightGeo, lightMat);
      light.position.set(x, wallHeight - 0.15, z);
      group.add(light);
    }
  }

  // Massive support pillars with fluting
  const pillarGeo = new THREE.CylinderGeometry(1.2, 1.2, wallHeight, 32);
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x666688,
    roughness: 0.15,
    metalness: 0.85,
    envMapIntensity: 0.7
  });
  const corners = [
    [-size.w / 2 + 3, 0, -size.d / 2 + 3],
    [size.w / 2 - 3, 0, -size.d / 2 + 3],
    [-size.w / 2 + 3, 0, size.d / 2 - 3],
    [size.w / 2 - 3, 0, size.d / 2 - 3]
  ];

  corners.forEach(([cx, cy, cz]) => {
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(cx, wallHeight / 2, cz);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    group.add(pillar);
  });

  // Zone ambient light
  const zoneLight = new THREE.PointLight(color, 2.5, size.w * 2.5);
  zoneLight.position.set(0, wallHeight - 1, 0);
  zoneLight.castShadow = true;
  group.add(zoneLight);

  addDetailedZoneDecorations(group, key, zone, wallHeight);
  scene.add(group);
  worldObjects.push({ key, group, zone });
}

function addDetailedZoneDecorations(group, key, zone, wallHeight) {
  const { size } = zone;

  switch (key) {
    case 'lobby': {
      // Central holographic information center
      const pedestalGeo = new THREE.CylinderGeometry(6, 7, 2.5, 64);
      const pedestalMat = new THREE.MeshStandardMaterial({
        color: 0x555577,
        metalness: 0.95,
        roughness: 0.05,
        envMapIntensity: 0.8
      });
      const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
      pedestal.position.y = 1.25;
      pedestal.castShadow = true;
      pedestal.receiveShadow = true;
      group.add(pedestal);

      // Large holographic Swiftaw logo display
      const holoGeo = new THREE.BoxGeometry(7, 8, 1.2);
      const holoMat = new THREE.MeshStandardMaterial({
        color: 0xfff93e,
        emissive: 0xfff93e,
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.8,
        metalness: 0.6,
        roughness: 0.05
      });
      const holo = new THREE.Mesh(holoGeo, holoMat);
      holo.position.y = 6.5;
      holo.userData = { animate: 'rotate', speed: 0.3 };
      holo.castShadow = true;
      group.add(holo);

      // Multiple glow rings
      for (let i = 1; i <= 3; i++) {
        const ringGeo = new THREE.TorusGeometry(6.5 + i * 0.8, 0.35, 32, 128);
        const ringMat = new THREE.MeshStandardMaterial({
          color: 0xfff93e,
          emissive: 0xfff93e,
          emissiveIntensity: 0.4 - i * 0.08,
          transparent: true,
          opacity: 0.7 - i * 0.1
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2 - i * 0.15;
        ring.position.y = 6.5;
        ring.userData = { animate: 'rotate-ring', speed: 2 - i * 0.3 };
        group.add(ring);
      }

      // Info display screens on walls
      for (let i = 0; i < 4; i++) {
        const screenGeo = new THREE.BoxGeometry(6, 4, 0.5);
        const screenMat = new THREE.MeshStandardMaterial({
          color: 0x0a1a2a,
          emissive: 0x1a2a3a,
          emissiveIntensity: 0.5,
          metalness: 0.3
        });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set((i % 2) * 35 - 17.5, 8, ((i < 2) ? -size.d / 2 + 2 : size.d / 2 - 2));
        if (i >= 2) screen.rotation.y = Math.PI;
        screen.castShadow = true;
        group.add(screen);
      }

      break;
    }

    case 'rd': {
      // Professional research workstations
      for (let i = 0; i < 8; i++) {
        // Desk
        const deskGeo = new THREE.BoxGeometry(16, 1.2, 4);
        const deskMat = new THREE.MeshStandardMaterial({
          color: 0x1a3a5a,
          roughness: 0.4,
          metalness: 0.4
        });
        const desk = new THREE.Mesh(deskGeo, deskMat);
        desk.position.set(0, 0.6, -30 + i * 8);
        desk.castShadow = true;
        desk.receiveShadow = true;
        group.add(desk);

        // Lab equipment (monitors, instruments, beakers)
        for (let j = 0; j < 4; j++) {
          const equipGeo = new THREE.BoxGeometry(1.5, 2.5, 1.2);
          const equipMat = new THREE.MeshStandardMaterial({
            color: 0x1a4a6a,
            emissive: 0x0a3a5a,
            emissiveIntensity: 0.4,
            metalness: 0.5
          });
          const equip = new THREE.Mesh(equipGeo, equipMat);
          equip.position.set(-6 + j * 4.5, 2.2, -30 + i * 8);
          equip.castShadow = true;
          equip.receiveShadow = true;
          group.add(equip);
        }

        // Ergonomic chairs (wireframe suggestion)
        const chairGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.8, 16);
        const chairMat = new THREE.MeshStandardMaterial({
          color: 0x3a5a7a,
          roughness: 0.3,
          metalness: 0.6
        });
        const chair = new THREE.Mesh(chairGeo, chairMat);
        chair.position.set(-10, 1.2, -30 + i * 8);
        chair.castShadow = true;
        group.add(chair);
      }

      // Tall storage cabinets
      for (let i = 0; i < 3; i++) {
        const cabinetGeo = new THREE.BoxGeometry(3, 16, 2);
        const cabinetMat = new THREE.MeshStandardMaterial({
          color: 0x0a2a4a,
          metalness: 0.5,
          roughness: 0.3
        });
        const cabinet = new THREE.Mesh(cabinetGeo, cabinetMat);
        cabinet.position.set(35 - i * 20, 8, 35);
        cabinet.castShadow = true;
        group.add(cabinet);
      }
      break;
    }

    case 'recreation': {
      // Casual dining area
      for (let i = 0; i < 16; i++) {
        // Round tables
        const tableGeo = new THREE.CylinderGeometry(2.5, 2.5, 1, 32);
        const tableMat = new THREE.MeshStandardMaterial({
          color: 0x2a4a5a,
          roughness: 0.5,
          metalness: 0.3
        });
        const table = new THREE.Mesh(tableGeo, tableMat);
        const angle = (i / 16) * Math.PI * 2;
        table.position.set(Math.cos(angle) * 30, 0.5, Math.sin(angle) * 30);
        table.castShadow = true;
        table.receiveShadow = true;
        group.add(table);

        // Surrounding chairs (4 per table)
        for (let c = 0; c < 4; c++) {
          const chairAngle = angle + (c * Math.PI / 2);
          const chairGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.7, 16);
          const chairMat = new THREE.MeshStandardMaterial({
            color: 0x3a5a7a,
            roughness: 0.4,
            metalness: 0.5
          });
          const chair = new THREE.Mesh(chairGeo, chairMat);
          chair.position.set(
            Math.cos(angle) * 30 + Math.cos(chairAngle) * 3.5,
            1.0,
            Math.sin(angle) * 30 + Math.sin(chairAngle) * 3.5
          );
          chair.castShadow = true;
          group.add(chair);
        }
      }

      // Counter/bar area
      const counterGeo = new THREE.BoxGeometry(40, 1.5, 5);
      const counterMat = new THREE.MeshStandardMaterial({
        color: 0x1a3a4a,
        metalness: 0.6,
        roughness: 0.2
      });
      const counter = new THREE.Mesh(counterGeo, counterMat);
      counter.position.set(0, 1, -40);
      counter.castShadow = true;
      group.add(counter);

      // Behind counter - beverage dispensers
      for (let i = 0; i < 8; i++) {
        const dispenserGeo = new THREE.CylinderGeometry(0.8, 0.8, 2, 16);
        const dispenserMat = new THREE.MeshStandardMaterial({
          color: 0x2a5a7a,
          emissive: 0x1a4a5a,
          emissiveIntensity: 0.3,
          metalness: 0.7
        });
        const dispenser = new THREE.Mesh(dispenserGeo, dispenserMat);
        dispenser.position.set(-18 + i * 5, 2, -43);
        dispenser.castShadow = true;
        group.add(dispenser);
      }
      break;
    }

    case 'comms': {
      // Media production stations
      for (let i = 0; i < 6; i++) {
        const stationGeo = new THREE.BoxGeometry(14, 1.2, 4.5);
        const stationMat = new THREE.MeshStandardMaterial({
          color: 0x2a1a4a,
          roughness: 0.4,
          metalness: 0.5
        });
        const station = new THREE.Mesh(stationGeo, stationMat);
        station.position.set(0, 0.6, -25 + i * 10);
        station.castShadow = true;
        group.add(station);

        // Broadcasting equipment
        for (let j = 0; j < 3; j++) {
          const equipGeo = new THREE.BoxGeometry(1.2, 1.8, 0.8);
          const equipMat = new THREE.MeshStandardMaterial({
            color: 0x3a2a5a,
            emissive: 0x1a0a3a,
            emissiveIntensity: 0.5,
            metalness: 0.6
          });
          const equip = new THREE.Mesh(equipGeo, equipMat);
          equip.position.set(-4 + j * 4, 1.8, -25 + i * 10);
          equip.castShadow = true;
          group.add(equip);
        }
      }

      // Large broadcast screens
      for (let i = 0; i < 2; i++) {
        const screenGeo = new THREE.BoxGeometry(12, 6, 0.6);
        const screenMat = new THREE.MeshStandardMaterial({
          color: 0x0a000a,
          emissive: 0x1a0a2a,
          emissiveIntensity: 0.6,
          metalness: 0.3
        });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set((i === 0 ? -30 : 30), 10, 0);
        screen.castShadow = true;
        group.add(screen);
      }
      break;
    }

    case 'innovation': {
      // Brainstorming areas with whiteboards
      for (let i = 0; i < 4; i++) {
        // Whiteboard walls
        const whiteboardGeo = new THREE.BoxGeometry(10, 6, 0.3);
        const whiteboardMat = new THREE.MeshStandardMaterial({
          color: 0xf0f0f0,
          emissive: 0xffffff,
          emissiveIntensity: 0.2,
          metalness: 0.1,
          roughness: 0.1
        });
        const whiteboard = new THREE.Mesh(whiteboardGeo, whiteboardMat);
        whiteboard.position.set((i % 2) * 40 - 20, 8, ((i < 2) ? -30 : 30));
        if (i >= 2) whiteboard.rotation.y = Math.PI;
        whiteboard.castShadow = true;
        group.add(whiteboard);

        // Collaboration tables
        const tableGeo = new THREE.BoxGeometry(8, 1.2, 5);
        const tableMat = new THREE.MeshStandardMaterial({
          color: 0x1a3a2a,
          roughness: 0.4,
          metalness: 0.4
        });
        const table = new THREE.Mesh(tableGeo, tableMat);
        table.position.set((i % 2) * 40 - 20, 0.6, ((i < 2) ? -20 : 20));
        table.castShadow = true;
        group.add(table);
      }

      // Innovation pods (circular spaces)
      for (let i = 0; i < 6; i++) {
        const podGeo = new THREE.CylinderGeometry(4, 4, 0.2, 32);
        const podMat = new THREE.MeshStandardMaterial({
          color: 0x0a3a2a,
          emissive: 0x1a5a4a,
          emissiveIntensity: 0.3,
          metalness: 0.5,
          roughness: 0.3
        });
        const pod = new THREE.Mesh(podGeo, podMat);
        const angle = (i / 6) * Math.PI * 2;
        pod.position.set(Math.cos(angle) * 25, 0.1, Math.sin(angle) * 25);
        pod.castShadow = true;
        group.add(pod);
      }
      break;
    }

    case 'safety': {
      // Security monitoring stations
      for (let i = 0; i < 4; i++) {
        const stationGeo = new THREE.BoxGeometry(10, 1.2, 4);
        const stationMat = new THREE.MeshStandardMaterial({
          color: 0x3a1a1a,
          roughness: 0.4,
          metalness: 0.5
        });
        const station = new THREE.Mesh(stationGeo, stationMat);
        station.position.set((i % 2) * 40 - 20, 0.6, ((i < 2) ? -25 : 25));
        station.castShadow = true;
        group.add(station);

        // Security monitors
        for (let j = 0; j < 2; j++) {
          const monitorGeo = new THREE.BoxGeometry(2, 3, 0.5);
          const monitorMat = new THREE.MeshStandardMaterial({
            color: 0x1a0a0a,
            emissive: 0x2a1a1a,
            emissiveIntensity: 0.6,
            metalness: 0.4
          });
          const monitor = new THREE.Mesh(monitorGeo, monitorMat);
          monitor.position.set((i % 2) * 40 - 20 - 3 + j * 6, 3, ((i < 2) ? -25 : 25));
          monitor.castShadow = true;
          group.add(monitor);
        }
      }

      // Control panel wall
      const panelWallGeo = new THREE.BoxGeometry(30, 8, 0.4);
      const panelWallMat = new THREE.MeshStandardMaterial({
        color: 0x1a0a0a,
        emissive: 0x3a1a1a,
        emissiveIntensity: 0.4,
        metalness: 0.6
      });
      const panelWall = new THREE.Mesh(panelWallGeo, panelWallMat);
      panelWall.position.set(0, 4, 40);
      panelWall.castShadow = true;
      group.add(panelWall);
      break;
    }
  }
}

function buildDetailedCorridorsWithRailings() {
  const corridorMat = new THREE.MeshStandardMaterial({
    color: 0x0a0810,
    roughness: 0.7,
    metalness: 0.2
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

    const corrGeo = new THREE.PlaneGeometry(12, length);
    const corridor = new THREE.Mesh(corrGeo, corridorMat);
    corridor.rotation.x = -Math.PI / 2;
    corridor.rotation.z = -angle;
    corridor.position.set(from.x + dx / 2, 0.01, from.z + dz / 2);
    corridor.receiveShadow = true;
    scene.add(corridor);

    // Railings on both sides
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < Math.ceil(length / 5); i++) {
        const t = i / Math.ceil(length / 5);
        const px = from.x + dx * t;
        const pz = from.z + dz * t;

        // Railing posts
        const postGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 16);
        const postMat = new THREE.MeshStandardMaterial({
          color: 0x444466,
          metalness: 0.7,
          roughness: 0.2
        });
        const post = new THREE.Mesh(postGeo, postMat);
        const perpX = Math.cos(angle + Math.PI / 2) * side;
        const perpZ = Math.sin(angle + Math.PI / 2) * side;
        post.position.set(px + perpX * 6, 1, pz + perpZ * 6);
        post.castShadow = true;
        scene.add(post);

        // Railing bars
        const barGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.8, 8);
        const barMat = new THREE.MeshStandardMaterial({
          color: 0x666688,
          metalness: 0.8,
          roughness: 0.15
        });
        for (let h = 0.3; h < 2; h += 0.4) {
          const bar = new THREE.Mesh(barGeo, barMat);
          bar.position.set(px + perpX * 6, h, pz + perpZ * 6);
          bar.castShadow = true;
          scene.add(bar);
        }
      }
    }

    // Corridor lighting every 15 units
    const steps = Math.floor(length / 15);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const light = new THREE.PointLight(0x3a5a7a, 1, 25);
      light.position.set(from.x + dx * t, 7, from.z + dz * t);
      light.castShadow = true;
      scene.add(light);

      // Overhead light fixtures
      const fixtureGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
      const fixtureMat = new THREE.MeshStandardMaterial({
        color: 0x333344,
        metalness: 0.6,
        roughness: 0.3
      });
      const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
      fixture.position.set(from.x + dx * t, 8.5, from.z + dz * t);
      scene.add(fixture);
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
    const padGeo = new THREE.CircleGeometry(4, 64);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0xff9c3c,
      emissive: 0xfff93e,
      emissiveIntensity: 0.8,
      metalness: 0.8,
      roughness: 0.05
    });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.rotation.x = -Math.PI / 2;
    padMesh.position.set(pad.from.x + 30 + idx * 16, 0.1, pad.from.z + 50);
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

    // Sophisticated glow ring system
    for (let ring = 1; ring <= 4; ring++) {
      const ringGeo = new THREE.TorusGeometry(4 + ring * 0.9, 0.3, 32, 128);
      const ringMat = new THREE.MeshStandardMaterial({
        color: ring % 2 === 0 ? 0xfff93e : 0xff9c3c,
        emissive: ring % 2 === 0 ? 0xfff93e : 0xff9c3c,
        emissiveIntensity: 0.6 - ring * 0.1,
        transparent: true,
        opacity: 0.8 - ring * 0.12
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.rotation.z = ring * 0.2;
      ringMesh.position.set(padMesh.position.x, 0.15, padMesh.position.z);
      ringMesh.userData = { animate: 'rotate-ring', speed: 2 - ring * 0.35 };
      scene.add(ringMesh);
    }
  });
}

function buildHyperRealisticSkybox() {
  const skyGeo = new THREE.SphereGeometry(2000, 128, 128);
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x0a0810,
    side: THREE.BackSide
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

  // Ultra-dense star field with nebula
  const starCount = 4000;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);

  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 800 + Math.random() * 400;

    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.6 + 100;
    starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    // Realistic star colors
    const temp = Math.random();
    if (temp < 0.6) {
      starColors[i * 3] = 1;
      starColors[i * 3 + 1] = 1;
      starColors[i * 3 + 2] = 1;
      starSizes[i] = Math.random() * 2 + 0.5;
    } else if (temp < 0.8) {
      starColors[i * 3] = 1;
      starColors[i * 3 + 1] = 0.9;
      starColors[i * 3 + 2] = 0.7;
      starSizes[i] = Math.random() * 2.5 + 0.7;
    } else if (temp < 0.95) {
      starColors[i * 3] = 0.8;
      starColors[i * 3 + 1] = 0.9;
      starColors[i * 3 + 2] = 1;
      starSizes[i] = Math.random() * 2 + 0.5;
    } else {
      starColors[i * 3] = 1;
      starColors[i * 3 + 1] = 0.7;
      starColors[i * 3 + 2] = 0.8;
      starSizes[i] = Math.random() * 3 + 1;
    }
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
  starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
  const starMat = new THREE.PointsMaterial({
    size: 2,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.95
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);
}

function addRealisticEnvironment() {
  // Ground plane extended far out
  const groundGeo = new THREE.PlaneGeometry(3000, 3000, 100, 100);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0a0810,
    roughness: 0.9,
    metalness: 0.05,
    side: THREE.DoubleSide
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.5;
  ground.receiveShadow = true;
  scene.add(ground);
}

function addVegetation() {
  // Decorative futuristic vegetation around complex
  const vegPositions = [
    { x: 150, z: 150 }, { x: -150, z: 150 },
    { x: 150, z: -150 }, { x: -150, z: -150 }
  ];

  vegPositions.forEach(({ x, z }) => {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const plantX = x + Math.cos(angle) * 40;
      const plantZ = z + Math.sin(angle) * 40;

      // Plant pot
      const potGeo = new THREE.CylinderGeometry(1.2, 1.5, 1.5, 16);
      const potMat = new THREE.MeshStandardMaterial({
        color: 0x3a3a3a,
        metalness: 0.4,
        roughness: 0.5
      });
      const pot = new THREE.Mesh(potGeo, potMat);
      pot.position.set(plantX, 0.75, plantZ);
      pot.castShadow = true;
      scene.add(pot);

      // Plant foliage
      const plantGeo = new THREE.SphereGeometry(2, 16, 16);
      const plantMat = new THREE.MeshStandardMaterial({
        color: 0x2a5a3a,
        emissive: 0x0a3a1a,
        emissiveIntensity: 0.2,
        roughness: 0.6,
        metalness: 0.1
      });
      const plant = new THREE.Mesh(plantGeo, plantMat);
      plant.position.set(plantX, 3, plantZ);
      plant.castShadow = true;
      scene.add(plant);
    }
  });
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
      geo = new THREE.SphereGeometry(0.5 * scale, 32, 32);
      break;
    case 'cylinder':
      geo = new THREE.CylinderGeometry(0.5 * scale, 0.5 * scale, 2 * scale, 32);
      break;
    case 'wall':
      geo = new THREE.BoxGeometry(4 * scale, 3 * scale, 0.3);
      break;
    case 'light': {
      const light = new THREE.PointLight(c.getHex(), 2.5, 25 * scale);
      light.position.copy(position);
      light.position.y = 4;
      light.castShadow = true;
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 16, 16),
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
    roughness: 0.35,
    metalness: 0.5,
    envMapIntensity: 0.6
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
