// HÀ GIANG PEDAL ODYSSEY - CORE GAME ENGINE
(function() {
  'use strict';

  // --- 1. PROCEDURAL AUDIO SYNTHESIZER ---
  class HaGiangAudio {
    constructor() {
      this.ctx = null;
      this.windGain = null;
      this.chainTimer = 0;
      this.musicTimer = 0;
      this.musicNoteIdx = 0;
      // Pentatonic folk scale typical of Northern Vietnamese highlands (H'Mong / Tay / Nung)
      this.fluteScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          // Ambient wind generator
          const bufferSize = this.ctx.sampleRate * 2;
          const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
          }
          const whiteNoise = this.ctx.createBufferSource();
          whiteNoise.buffer = noiseBuffer;
          whiteNoise.loop = true;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(320, this.ctx.currentTime);

          this.windGain = this.ctx.createGain();
          this.windGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

          whiteNoise.connect(filter);
          filter.connect(this.windGain);
          this.windGain.connect(this.ctx.destination);
          try { whiteNoise.start(); } catch (e) {}
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    setWindIntensity(speedRatio) {
      if (!this.ctx || !this.windGain) return;
      const targetGain = 0.02 + Math.min(speedRatio, 1.5) * 0.12;
      this.windGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
    }

    playBicycleBell() {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Dual high frequency bell chime
      [2150, 2600].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq + (i * 40), now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.95, now + 0.6);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
      });
    }

    playFlowerChime() {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.18, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.4);
      });
    }

    playMilestoneFanfare() {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const fanfare = [392, 523.25, 659.25, 783.99];
      fanfare.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now + i * 0.12);
        gain.gain.setValueAtTime(0.15, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.55);
      });
    }

    updatePedalChain(dt, isPedaling) {
      if (!isPedaling) return;
      this.chainTimer += dt;
      if (this.chainTimer > 0.18) {
        this.chainTimer = 0;
        this.playChainClick();
      }
    }

    playChainClick() {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
    }

    updateBackgroundFlute(dt) {
      this.musicTimer += dt;
      if (this.musicTimer > 2.8) {
        this.musicTimer = 0;
        this.playFlutePhrase();
      }
    }

    playFlutePhrase() {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const note = this.fluteScale[Math.floor(Math.random() * this.fluteScale.length)];
      const osc = this.ctx.createOscillator();
      const vibrato = this.ctx.createOscillator();
      const vibGain = this.ctx.createGain();
      const mainGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, now);

      vibrato.frequency.setValueAtTime(5.5, now); // gentle vibrato
      vibGain.gain.setValueAtTime(4.0, now);
      vibrato.connect(osc.frequency);

      mainGain.gain.setValueAtTime(0.001, now);
      mainGain.gain.linearRampToValueAtTime(0.08, now + 0.3);
      mainGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      osc.connect(mainGain);
      mainGain.connect(this.ctx.destination);

      vibrato.start(now);
      osc.start(now);
      vibrato.stop(now + 2.3);
      osc.stop(now + 2.3);
    }
  }

  // --- 2. GAME STATE & CHECKPOINTS ---
  const CHECKPOINTS = [
    { id: 'km0', name: 'Km0 · TP Hà Giang', dist: 0, alt: 120, badge: '📍 KM0 KHỞI HÀNH' },
    { id: 'quanba', name: 'Cổng Trời Quản Bạ', dist: 350, alt: 1100, badge: '☁️ CỔNG TRỜI QUẢN BẠ' },
    { id: 'thamma', name: 'Dốc Thẩm Mã (9 Khúc Cua)', dist: 750, alt: 1280, badge: '⛰️ DỐC THẨM MÃ' },
    { id: 'mapileng', name: 'Đèo Mã Pí Lèng & Hẻm Tu Sản', dist: 1200, alt: 1450, badge: '🦅 ĐỈNH MÃ PÍ LÈNG' },
    { id: 'lungcu', name: 'Cột Cờ Lũng Cú (Điểm Cực Bắc)', dist: 1700, alt: 1470, badge: '⭐ CỘT CỜ LŨNG CÚ' }
  ];

  const state = {
    mode: 'TITLE', // TITLE, PLAYING, VICTORY
    distance: 0,   // meters along route
    lateralX: 0,   // offset from road center (-3.2 to +3.2)
    speed: 0,      // m/s
    altitude: 120, // meters
    stamina: 100,  // %
    flowers: 0,    // collected tam giac mach
    checkpointIdx: 0,
    assetsLoaded: 0,
    totalAssets: 8,
    isPedaling: false,
    isBraking: false,
    isJumping: false,
    jumpY: 0,
    jumpVy: 0,
    steerInput: 0,
    pedalInput: false,
    brakeInput: false,
    heroLoaded: false
  };

  const audio = new HaGiangAudio();

  // --- 3. THREE.JS SCENE SETUP ---
  let scene, camera, renderer;
  let playerGroup, bikeModel, childModel, childMixer;
  let animActions = {};
  let loadedAssets = {};

  // Environment collections
  const sceneryGroup = new THREE.Group();
  const roadGroup = new THREE.Group();
  const collectibles = [];
  const obstacles = [];
  const villageHouses = [];

  // Road Curve Definition (CatmullRomSpline simulating serpentine mountain pass)
  const ROUTE_POINTS = [];
  const TOTAL_LENGTH = 1800; // meters
  const ROUTE_START = -60;
  const ROUTE_END = TOTAL_LENGTH + 60;
  for (let z = ROUTE_START; z <= ROUTE_END; z += 50) {
    // Serpentine curves with hairpin bends
    const curve1 = Math.sin(z * 0.015) * 35;
    const curve2 = Math.cos(z * 0.007) * 45;
    const hairpin = Math.sin(z * 0.04) * 18;
    // Center the opening road so the hero frame begins inside the valley, not on an edge.
    const x = curve1 + curve2 + hairpin - 45;
    // Ascending mountain pass elevation
    const progress = Math.max(0, Math.min(1, z / TOTAL_LENGTH));
    // Keep gameplay geometry in a compact world (0–28m); altitude is represented in HUD meters.
    const y = 1.2 + Math.pow(progress, 0.85) * 26;
    ROUTE_POINTS.push(new THREE.Vector3(x, y, -z));
  }
  const roadCurve = new THREE.CatmullRomCurve3(ROUTE_POINTS);

  function getRoadTransform(dist) {
    const tSpline = Math.max(0, Math.min(1, (dist - ROUTE_START) / (ROUTE_END - ROUTE_START)));
    const pos = roadCurve.getPointAt(tSpline);
    const tangent = roadCurve.getTangentAt(tSpline).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();
    return { pos, tangent, normal, t: Math.max(0, Math.min(1, dist / TOTAL_LENGTH)) };
  }

  function initGraphics() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9bd0e8);
    // Mountain mist / Hà Giang morning cloud fog
    scene.fog = new THREE.FogExp2(0x9bd0e8, 0.0035);

    camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.2, 1200);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Hà Giang mountain mist fog for atmospheric depth
    scene.fog = new THREE.FogExp2(0xdbeafe, 0.0042);

    // Sunlight on limestone cliffs
    const sunLight = new THREE.DirectionalLight(0xfff6dd, 1.8);
    sunLight.position.set(60, 120, -50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 300;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    sunLight.shadow.bias = -0.0006;
    scene.add(sunLight);

    // Sky & Valley ambient light: lift the dark pine silhouettes while retaining form.
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x64748b, 1.0);
    scene.add(hemiLight);
    const fillLight = new THREE.DirectionalLight(0xb9dcff, 0.45);
    fillLight.position.set(-55, 45, 80);
    scene.add(fillLight);

    // Player Root
    playerGroup = new THREE.Group();
    scene.add(playerGroup);
    scene.add(sceneryGroup);
    scene.add(roadGroup);

    // Build Scenic Continuous Mountain Terrain & Valley
    buildMountainLandscape();
    buildScenicRoad();
    buildKarstLandmarkBackdrop();

    window.addEventListener('resize', onWindowResize);
  }

  function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function buildKarstLandmarkBackdrop() {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x647b71, roughness: 0.95, metalness: 0.0 });
    const rockLightMat = new THREE.MeshStandardMaterial({ color: 0x8ba69a, roughness: 0.9, metalness: 0.0 });
    // Large layered limestone pillars on the horizon, with visible gaps so the skyline reads as a mountain range.
    for (let i = 0; i < 15; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = -38 + i * 15 + side * 13;
      const z = -110 - (i % 4) * 22;
      const h = 34 + (i % 5) * 10;
      const pillar = new THREE.Mesh(new THREE.ConeGeometry(8 + (i % 3) * 2, h, 6), i % 3 === 0 ? rockLightMat : rockMat);
      pillar.position.set(x, h * 0.45, z);
      pillar.scale.x = 0.65 + (i % 4) * 0.1;
      pillar.scale.z = 0.7 + (i % 3) * 0.1;
      pillar.rotation.y = i * 0.45;
      pillar.castShadow = true;
      sceneryGroup.add(pillar);
    }

    // A distant mountain saddle with a cloud band, behind the road rather than across its surface.
    // SphereGeometry scaled into a distant saddle for Three.js r128 compatibility.
    const saddle = new THREE.Mesh(new THREE.SphereGeometry(18, 16, 10), rockMat);
    saddle.position.set(-5, 23, -180);
    saddle.scale.set(2.8, 1.25, 0.45);
    saddle.rotation.z = Math.PI * 0.5;
    saddle.castShadow = true;
    sceneryGroup.add(saddle);

    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false });
    for (let i = 0; i < 8; i++) {
      const cloud = new THREE.Mesh(new THREE.SphereGeometry(4 + (i % 3), 12, 8), cloudMat);
      cloud.position.set(-55 + i * 15, 35 + (i % 3) * 2, -115 - (i % 2) * 16);
      cloud.scale.set(1.5, 0.45, 0.7);
      sceneryGroup.add(cloud);
    }
  }

  // --- 4. BUILD ROAD & SCENIC MOUNTAIN VALLEY ---
  function buildMountainLandscape() {
    // Continuous mountain valley terrain underneath the road (embankment / sườn đồi Hà Giang)
    const terrainSegments = 180;
    const terrainGeom = new THREE.BufferGeometry();
    const tVerts = [];
    const tUVs = [];
    const tIndices = [];

    for (let i = 0; i <= terrainSegments; i++) {
      const dist = (i / terrainSegments) * TOTAL_LENGTH;
      const { pos, normal } = getRoadTransform(dist);
      // Create a 5-step cross section: Far Left Mountain, Left Verge, Road Left, Road Right, Right Slope, Far Abyss (Nho Quế River)
      const pFarLeft = pos.clone().addScaledVector(normal, -65); pFarLeft.y += 22;
      const pVergeL = pos.clone().addScaledVector(normal, -12); pVergeL.y += 0.8;
      const pRoadL = pos.clone().addScaledVector(normal, -4.5); pRoadL.y -= 0.1;
      const pRoadR = pos.clone().addScaledVector(normal, 4.5); pRoadR.y -= 0.1;
      const pVergeR = pos.clone().addScaledVector(normal, 16); pVergeR.y -= 4.5;
      const pFarRight = pos.clone().addScaledVector(normal, 85); pFarRight.y -= 38; // drop to Nho Quế valley

      const pts = [pFarLeft, pVergeL, pRoadL, pRoadR, pVergeR, pFarRight];
      pts.forEach((p, pIdx) => {
        tVerts.push(p.x, p.y, p.z);
        tUVs.push(pIdx / 5, i / 20);
      });

      if (i < terrainSegments) {
        const row = i * 6;
        for (let j = 0; j < 5; j++) {
          tIndices.push(row + j, row + j + 1, row + 6 + j);
          tIndices.push(row + j + 1, row + 6 + j + 1, row + 6 + j);
        }
      }
    }

    terrainGeom.setAttribute('position', new THREE.Float32BufferAttribute(tVerts, 3));
    terrainGeom.setAttribute('uv', new THREE.Float32BufferAttribute(tUVs, 2));
    terrainGeom.setIndex(tIndices);
    terrainGeom.computeVertexNormals();

    const valleyMat = new THREE.MeshStandardMaterial({
      color: 0x476b42, // Lush highland green
      roughness: 0.9,
      metalness: 0.05
    });
    const terrainMesh = new THREE.Mesh(terrainGeom, valleyMat);
    terrainMesh.receiveShadow = true;
    sceneryGroup.add(terrainMesh);
  }

  function buildScenicRoad() {
    const segments = 400;
    const roadWidth = 8.5; // Two-lane mountain highway
    const geom = new THREE.BufferGeometry();
    const vertices = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= segments; i++) {
      const dist = (i / segments) * TOTAL_LENGTH;
      const { pos, normal } = getRoadTransform(dist);

      const left = pos.clone().addScaledVector(normal, -roadWidth / 2);
      const right = pos.clone().addScaledVector(normal, roadWidth / 2);

      vertices.push(left.x, left.y + 0.05, left.z);
      vertices.push(right.x, right.y + 0.05, right.z);

      const v = (i / segments) * 80;
      uvs.push(0, v, 1, v);

      if (i < segments) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    // Asphalt road with mountain guardrail stripes
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.8,
      metalness: 0.1
    });
    const roadMesh = new THREE.Mesh(geom, roadMat);
    roadMesh.receiveShadow = true;
    roadGroup.add(roadMesh);

    // Yellow Centerline
    const centerGeom = new THREE.BufferGeometry();
    const cVerts = [];
    const cIndices = [];
    for (let i = 0; i <= segments; i++) {
      const dist = (i / segments) * TOTAL_LENGTH;
      const { pos, normal } = getRoadTransform(dist);
      const cL = pos.clone().addScaledVector(normal, -0.15);
      const cR = pos.clone().addScaledVector(normal, 0.15);
      cVerts.push(cL.x, cL.y + 0.08, cL.z);
      cVerts.push(cR.x, cR.y + 0.08, cR.z);
      if (i < segments) {
        const b = i * 2;
        cIndices.push(b, b + 1, b + 2);
        cIndices.push(b + 1, b + 3, b + 2);
      }
    }
    centerGeom.setAttribute('position', new THREE.Float32BufferAttribute(cVerts, 3));
    centerGeom.setIndex(cIndices);
    centerGeom.computeVertexNormals();
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    roadGroup.add(new THREE.Mesh(centerGeom, lineMat));
  }

  // Emerald green Nho Quế River deep in Tu Sản canyon below
  function buildEmeraldRiverValley() {
    const riverCurvePoints = [];
    for (let z = 0; z <= TOTAL_LENGTH; z += 100) {
      const dist = z;
      const road = getRoadTransform(dist);
      // River sits well below the route and never forms a horizon-sized green wall.
      const riverCenter = road.pos.clone().addScaledVector(road.normal, 72);
      riverCenter.y = Math.max(-8, road.pos.y - 18);
      riverCurvePoints.push(riverCenter);
    }
    const riverCurve = new THREE.CatmullRomCurve3(riverCurvePoints);
    const riverGeom = new THREE.TubeGeometry(riverCurve, 120, 3.2, 8, false);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5a4,
      roughness: 0.22,
      metalness: 0.18,
      emissive: 0x064e4b,
      emissiveIntensity: 0.16
    });
    const riverMesh = new THREE.Mesh(riverGeom, riverMat);
    riverMesh.scale.y = 0.22;
    riverMesh.receiveShadow = true;
    sceneryGroup.add(riverMesh);
  }

  // --- 5. ASSET LOADING & POPULATION ---
  function loadAssets(callback) {
    const rawData = window.__EMBEDDED_ASSETS__ || {};
    const loader = new THREE.GLTFLoader();
    const roles = Object.keys(rawData);
    state.totalAssets = roles.length;
    let completed = 0;

    roles.forEach(role => {
      const dataUri = rawData[role];
      loader.load(dataUri, gltf => {
        loadedAssets[role] = gltf;
        completed++;
        state.assetsLoaded = completed;
        if (completed === roles.length) {
          setupPlayerEntities();
          populateScenicWorld();
          if (callback) callback();
        }
      }, undefined, err => {
        console.error("Error loading GLB for role:", role, err);
      });
    });
  }

  function setupPlayerEntities() {
    const bikeGLTF = loadedAssets['player_bicycle'];
    const childGLTF = loadedAssets['player_child'];

    if (bikeGLTF) {
      bikeModel = bikeGLTF.scene;
      // bicycle.glb is authored in centimetre-like units; normalize to a 1.65m real bicycle.
      bikeModel.scale.setScalar(0.00192);
      bikeModel.position.set(0, 0.45, 0);
      bikeModel.rotation.y = Math.PI;
      bikeModel.traverse(c => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
        }
      });
      playerGroup.add(bikeModel);
    }

    if (childGLTF) {
      childModel = childGLTF.scene;
      // mako_hero.glb natural height is ~2.85m; scale by 0.44 to make a ~1.25m boy rider.
      childModel.scale.setScalar(0.44);
      childModel.position.set(0, 0.48, -0.15);
      childModel.rotation.y = Math.PI;
      childModel.traverse(c => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
        }
      });
      playerGroup.add(childModel);

      // Rider Animation setup
      childMixer = new THREE.AnimationMixer(childModel);
      childGLTF.animations.forEach(clip => {
        animActions[clip.name.toLowerCase()] = childMixer.clipAction(clip);
      });

      if (animActions['idle']) {
        animActions['idle'].play();
      }
      if (animActions['walk']) {
        animActions['walk'].setEffectiveTimeScale(0.8);
      }
      state.heroLoaded = true;
    }
  }

  function populateScenicWorld() {
    const cliffGLTF = loadedAssets['karst_cliff'];
    const rockGLTF = loadedAssets['tall_rock'];
    const pineGLTF = loadedAssets['pine_tree'];
    const forestGLTF = loadedAssets['forest_cluster'];
    const houseGLTF = loadedAssets['vietnamese_village_house'];
    const flowerGLTF = loadedAssets['mountain_flower'];

    // Vietnamese mountain highway guide posts: White body with bright red cap
    const postMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 });
    const redCapMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, emissive: 0x991b1b, emissiveIntensity: 0.25 });
    
    for (let dist = -20; dist < TOTAL_LENGTH + 20; dist += 8) {
      const { pos, normal } = getRoadTransform(dist);
      const postGroup = new THREE.Group();
      // Lower white body
      const whiteBody = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.55, 10), postMat);
      whiteBody.position.y = 0.28;
      whiteBody.castShadow = true;
      postGroup.add(whiteBody);
      // Top red cap (chỏm cọc đỏ phản quang)
      const redCap = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.24, 10), redCapMat);
      redCap.position.y = 0.67;
      redCap.castShadow = true;
      postGroup.add(redCap);

      postGroup.position.copy(pos).addScaledVector(normal, 4.4);
      roadGroup.add(postGroup);
    }

    // Populate scenery densely along route starting from -20m before spawn!
    for (let dist = -20; dist < TOTAL_LENGTH; dist += 12) {
      const { pos, normal } = getRoadTransform(dist);

      // 1. Cliff / Mountain Wall on the Left (cliffside pass)
      if (cliffGLTF && Math.random() < 0.85) {
        const c = cliffGLTF.scene.clone();
        const sideOffset = -12 - Math.random() * 14;
        c.position.copy(pos).addScaledVector(normal, sideOffset);
        c.position.y += Math.random() * 4 - 2;
        c.scale.setScalar(4.0 + Math.random() * 5.0);
        c.rotation.y = Math.random() * Math.PI * 2;
        c.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
        sceneryGroup.add(c);
      }

      // 2. Karst Tall Rocks / Tháp Đá Tai Mèo
      if (rockGLTF && Math.random() < 0.6) {
        const r = rockGLTF.scene.clone();
        const side = Math.random() < 0.5 ? -18 : 22;
        r.position.copy(pos).addScaledVector(normal, side + (Math.random() * 8 - 4));
        r.scale.setScalar(3.5 + Math.random() * 4.5);
        r.rotation.y = Math.random() * Math.PI * 2;
        r.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
        sceneryGroup.add(r);
      }

      // 3. Pine Trees on Hillside
      if (pineGLTF && Math.random() < 0.7) {
        const p = pineGLTF.scene.clone();
        const side = Math.random() < 0.4 ? -8.5 : 12;
        p.position.copy(pos).addScaledVector(normal, side + (Math.random() * 4 - 2));
        p.scale.setScalar(1.6 + Math.random() * 1.4);
        p.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
        sceneryGroup.add(p);
      }

      // 4. Forest Cluster
      if (forestGLTF && Math.random() < 0.4) {
        const f = forestGLTF.scene.clone();
        f.position.copy(pos).addScaledVector(normal, -24 - Math.random() * 12);
        f.scale.setScalar(2.2 + Math.random() * 1.5);
        sceneryGroup.add(f);
      }

      // 5. Vietnamese Mountain Village Houses (Nhà sàn bản làng)
      if (houseGLTF && (dist % 140 < 30)) {
        const h = houseGLTF.scene.clone();
        const side = Math.random() < 0.5 ? -15 : 16;
        h.position.copy(pos).addScaledVector(normal, side);
        h.scale.setScalar(1.8);
        h.rotation.y = Math.atan2(normal.x, normal.z) + (side > 0 ? Math.PI : 0);
        h.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
        sceneryGroup.add(h);
      }

      // 6. Collectible: Tam Giác Mạch Flower Beds
      if (flowerGLTF && Math.random() < 0.65) {
        const fl = flowerGLTF.scene.clone();
        const laneOffset = (Math.random() - 0.5) * 5.6; // inside road boundaries
        fl.position.copy(pos).addScaledVector(normal, laneOffset);
        fl.position.y += 0.2;
        fl.scale.setScalar(2.4);
        sceneryGroup.add(fl);
        collectibles.push({
          mesh: fl,
          dist: dist,
          lateralX: laneOffset,
          collected: false,
          type: 'flower'
        });
      }

      // 7. Road Hazards: Rockfall rubble (Đá hộc sạt lở)
      if (rockGLTF && Math.random() < 0.25 && dist > 150) {
        const obs = rockGLTF.scene.clone();
        const laneOffset = (Math.random() - 0.5) * 5.2;
        obs.position.copy(pos).addScaledVector(normal, laneOffset);
        obs.scale.setScalar(0.7); // small obstacle rock on road
        sceneryGroup.add(obs);
        obstacles.push({
          mesh: obs,
          dist: dist,
          lateralX: laneOffset,
          cleared: false
        });
      }
    }
  }

  // --- 6. CONTROLS & INPUT SYSTEM ---
  const keys = {};

  function setupControls() {
    window.addEventListener('keydown', e => {
      keys[e.code] = true;
      if (e.code === 'KeyC') ringBell();
      if (e.code === 'Space') doJump();
    });

    window.addEventListener('keyup', e => {
      keys[e.code] = false;
    });

    // Touch / Virtual Buttons
    const btnPedal = document.getElementById('btn-touch-pedal');
    const btnBrake = document.getElementById('btn-touch-brake');
    const btnJump = document.getElementById('btn-touch-jump');
    const btnBell = document.getElementById('btn-touch-bell');

    if (btnPedal) {
      const startP = () => { state.pedalInput = true; btnPedal.classList.add('active'); };
      const stopP = () => { state.pedalInput = false; btnPedal.classList.remove('active'); };
      btnPedal.addEventListener('mousedown', startP);
      window.addEventListener('mouseup', stopP);
      btnPedal.addEventListener('touchstart', (e) => { e.preventDefault(); startP(); });
      btnPedal.addEventListener('touchend', stopP);
    }

    if (btnBrake) {
      const startB = () => { state.brakeInput = true; btnBrake.classList.add('active'); };
      const stopB = () => { state.brakeInput = false; btnBrake.classList.remove('active'); };
      btnBrake.addEventListener('mousedown', startB);
      window.addEventListener('mouseup', stopB);
      btnBrake.addEventListener('touchstart', (e) => { e.preventDefault(); startB(); });
      btnBrake.addEventListener('touchend', stopB);
    }

    if (btnJump) {
      btnJump.addEventListener('click', doJump);
      btnJump.addEventListener('touchstart', (e) => { e.preventDefault(); doJump(); });
    }

    if (btnBell) {
      btnBell.addEventListener('click', ringBell);
      btnBell.addEventListener('touchstart', (e) => { e.preventDefault(); ringBell(); });
    }

    document.getElementById('btn-start-game').addEventListener('click', () => {
      audio.init();
      state.mode = 'PLAYING';
      document.getElementById('start-modal').classList.add('hidden');
    });

    document.getElementById('btn-restart-game').addEventListener('click', () => {
      resetGame();
      state.mode = 'PLAYING';
      document.getElementById('victory-modal').classList.add('hidden');
    });
  }

  function doJump() {
    if (state.mode !== 'PLAYING') return;
    if (!state.isJumping) {
      state.isJumping = true;
      state.jumpVy = 6.2;
      if (animActions['roll']) {
        animActions['roll'].reset().play();
      } else if (animActions['jump']) {
        animActions['jump'].reset().play();
      }
    }
  }

  function ringBell() {
    audio.playBicycleBell();
    const flash = document.getElementById('bell-flash');
    if (flash) {
      flash.style.opacity = '1';
      flash.style.transform = 'translate(-50%, -50%) scale(1.15)';
      setTimeout(() => {
        flash.style.opacity = '0';
        flash.style.transform = 'translate(-50%, -50%) scale(0.9)';
      }, 400);
    }
  }

  function resetGame() {
    state.distance = 0;
    state.lateralX = 0;
    state.speed = 0;
    state.stamina = 100;
    state.flowers = 0;
    state.checkpointIdx = 0;
    collectibles.forEach(c => {
      c.collected = false;
      c.mesh.visible = true;
    });
    updateHUD();
  }

  // --- 7. PHYSICS & GAME LOOP ---
  let lastTime = performance.now();

  function updateGame(dt) {
    if (state.mode !== 'PLAYING') return;

    // 1. Process Inputs
    const keyUp = keys['KeyW'] || keys['ArrowUp'] || state.pedalInput;
    const keyDown = keys['KeyS'] || keys['ArrowDown'] || state.brakeInput;
    const keyLeft = keys['KeyA'] || keys['ArrowLeft'];
    const keyRight = keys['KeyD'] || keys['ArrowRight'];

    state.isPedaling = keyUp;
    state.isBraking = keyDown;

    // Steer Lateral Position
    let steerDir = 0;
    if (keyLeft) steerDir -= 1;
    if (keyRight) steerDir += 1;
    state.steerInput = THREE.MathUtils.lerp(state.steerInput, steerDir, dt * 10);

    const roadBound = 3.4;
    state.lateralX += state.steerInput * dt * (6.5 + state.speed * 0.25);
    state.lateralX = Math.max(-roadBound, Math.min(roadBound, state.lateralX));

    // 2. Slope & Gravity Acceleration
    // Hà Giang mountain pass slopes up and down
    const slopeFactor = -0.4; // uphill drag
    let accel = 0;

    if (state.isPedaling) {
      if (state.stamina > 0) {
        accel += 6.5;
        state.stamina = Math.max(0, state.stamina - dt * 4.5);
      } else {
        accel += 1.8; // exhausted pedaling
      }
    } else {
      // Coasting: slowly recover stamina
      state.stamina = Math.min(100, state.stamina + dt * 5.0);
    }

    if (state.isBraking) {
      accel -= 12.0; // powerful disc brakes
    }

    // Passive rolling friction & air drag
    const drag = state.speed * 0.12;
    accel -= drag;
    accel += slopeFactor;

    state.speed = Math.max(0, Math.min(22, state.speed + accel * dt)); // max ~80 km/h downhill
    state.distance += state.speed * dt;

    // 3. Jump physics
    if (state.isJumping) {
      state.jumpVy -= 18.0 * dt;
      state.jumpY += state.jumpVy * dt;
      if (state.jumpY <= 0) {
        state.jumpY = 0;
        state.isJumping = false;
        if (animActions['walk']) animActions['walk'].reset().play();
      }
    }

    // 4. Update Position along Road Curve
    const transform = getRoadTransform(state.distance);
    state.altitude = Math.round(120 + transform.t * 1350);

    const worldPos = transform.pos.clone().addScaledVector(transform.normal, state.lateralX);
    worldPos.y += 0.2 + state.jumpY;

    playerGroup.position.copy(worldPos);

    // Forward direction & Lean Banking in turns
    const forward = transform.tangent.clone();
    playerGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), forward);
    // Add banking tilt
    playerGroup.rotateZ(-state.steerInput * 0.32);

    // 5. Camera Follow — close 3/4 chase framing keeps the real rider and bicycle readable.
    const camOffset = transform.tangent.clone().multiplyScalar(-3.8);
    camOffset.addScaledVector(transform.normal, 0.92);
    camOffset.y += 1.68;
    const targetCamPos = worldPos.clone().add(camOffset);
    camera.position.lerp(targetCamPos, Math.min(1, dt * 9));
    const lookTarget = worldPos.clone().add(transform.tangent.clone().multiplyScalar(3.8));
    lookTarget.y += 0.95;
    camera.lookAt(lookTarget);

    // 6. Sound & Animation Sync
    audio.updatePedalChain(dt, state.isPedaling && state.speed > 0.5);
    audio.setWindIntensity(state.speed / 12.0);
    audio.updateBackgroundFlute(dt);

    if (childMixer) {
      childMixer.update(dt * (0.4 + state.speed * 0.18));
    }

    // 7. Collectibles & Checkpoints
    checkInteractions();
    checkCheckpoints();

    // 8. Victory Condition: Reached Lũng Cú Flag Tower!
    if (state.distance >= TOTAL_LENGTH - 10) {
      state.mode = 'VICTORY';
      audio.playMilestoneFanfare();
      document.getElementById('victory-desc').innerText = 
        `Chúc mừng bạn đã chinh phục trọn vẹn cung đèo Mã Pí Lèng! Nhặt được ${state.flowers} cành hoa tam giác mạch với tốc độ tối đa ${Math.round(state.speed * 3.6)} km/h.`;
      document.getElementById('victory-modal').classList.remove('hidden');
    }

    updateHUD();
  }

  function checkInteractions() {
    // Collect Tam Giác Mạch flowers
    collectibles.forEach(col => {
      if (!col.collected) {
        col.mesh.rotation.y += 0.04;
        const dDist = Math.abs(state.distance - col.dist);
        const dLat = Math.abs(state.lateralX - col.lateralX);
        if (dDist < 2.0 && dLat < 1.4) {
          col.collected = true;
          col.mesh.visible = false;
          state.flowers++;
          audio.playFlowerChime();
        }
      }
    });

    // Check Obstacles (Rockfalls)
    obstacles.forEach(obs => {
      if (!obs.cleared) {
        const dDist = Math.abs(state.distance - obs.dist);
        const dLat = Math.abs(state.lateralX - obs.lateralX);
        // If not jumped over and collided
        if (dDist < 1.5 && dLat < 1.2 && state.jumpY < 0.6) {
          // Stumble deceleration
          state.speed *= 0.35;
          ringBell();
          obs.cleared = true;
        }
      }
    });
  }

  function checkCheckpoints() {
    for (let i = CHECKPOINTS.length - 1; i >= 0; i--) {
      if (state.distance >= CHECKPOINTS[i].dist) {
        if (state.checkpointIdx !== i) {
          state.checkpointIdx = i;
          audio.playMilestoneFanfare();
          const badgeEl = document.getElementById('badge-checkpoint');
          badgeEl.innerText = CHECKPOINTS[i].badge;
          badgeEl.style.transform = 'scale(1.15)';
          setTimeout(() => { badgeEl.style.transform = 'scale(1)'; }, 300);
        }
        break;
      }
    }
  }

  function updateHUD() {
    const speedKmh = Math.round(state.speed * 3.6);
    document.getElementById('stat-speed').innerHTML = `${speedKmh} <small style="font-size:10px">km/h</small>`;
    document.getElementById('stat-alt').innerHTML = `${state.altitude} <small style="font-size:10px">m</small>`;
    document.getElementById('stat-stamina').innerText = `${Math.round(state.stamina)}%`;
    document.getElementById('stat-flowers').innerText = `🌸 ${state.flowers}`;

    // Progress Bar
    const progress = Math.min(100, (state.distance / TOTAL_LENGTH) * 100);
    document.getElementById('progress-fill').style.width = `${progress}%`;
    document.getElementById('dist-curr').innerText = `${(state.distance / 100).toFixed(1)} km`;

    const currCp = CHECKPOINTS[state.checkpointIdx];
    document.getElementById('text-routename').innerText = currCp ? currCp.name : 'Đèo Mã Pí Lèng';
  }

  function renderLoop() {
    requestAnimationFrame(renderLoop);
    const now = performance.now();
    const dt = Math.min(0.064, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;

    updateGame(dt);
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  // --- 8. PUBLIC STATE PROBE FOR AUTOMATED QA ---
  window.__HAGIANG_GAME__ = {
    getState: function() {
      return {
        mode: state.mode,
        speedKmh: Math.round(state.speed * 3.6),
        altitudeM: state.altitude,
        stamina: Math.round(state.stamina),
        flowers: state.flowers,
        distanceM: Math.round(state.distance),
        checkpoint: CHECKPOINTS[state.checkpointIdx]?.name || 'N/A',
        assetsLoaded: state.assetsLoaded,
        totalAssets: state.totalAssets,
        heroLoaded: state.heroLoaded,
        debug: (() => {
          const boxOf = (obj) => {
            if (!obj) return null;
            const box = new THREE.Box3().setFromObject(obj);
            const size = new THREE.Vector3(); box.getSize(size);
            const center = new THREE.Vector3(); box.getCenter(center);
            return { size: { x: +size.x.toFixed(3), y: +size.y.toFixed(3), z: +size.z.toFixed(3) }, center: { x: +center.x.toFixed(3), y: +center.y.toFixed(3), z: +center.z.toFixed(3) } };
          };
          return { bike: boxOf(bikeModel), hero: boxOf(childModel), sceneChildren: scene ? scene.children.length : 0 };
        })()
      };
    },
    pedal: function() { state.pedalInput = true; setTimeout(() => { state.pedalInput = false; }, 300); },
    brake: function() { state.brakeInput = true; setTimeout(() => { state.brakeInput = false; }, 300); },
    jump: function() { doJump(); },
    ringBell: function() { ringBell(); }
  };

  // --- 9. BOOTSTRAP ---
  window.addEventListener('DOMContentLoaded', () => {
    initGraphics();
    setupControls();
    loadAssets(() => {
      console.log("All Hà Giang 3D assets loaded successfully!");
    });
    renderLoop();
  });

})();
