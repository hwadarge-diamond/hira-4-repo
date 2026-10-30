// RUN AND RUN - World Engine & Procedural Cyberpunk Environment
// Chunk pooling, parallax neon skyscrapers, animated holographic billboards, theme shifts, camera rig
import * as THREE from 'three';

export class World {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    // Track chunk configuration
    this.chunkLength = 60;
    this.visibleChunks = 7;
    this.chunks = [];
    this.nextChunkZ = 0;
    this.totalDistance = 0;

    // Theme Management
    this.themes = {
      neon: {
        name: 'NEON CITY 2099',
        fog: 0x070814,
        sky: 0x05060f,
        road: 0x0c0f1d,
        laneLines: 0x00f3ff,
        grid: 0xff0055,
        buildingDark: 0x080b18,
        buildingLight: 0x00f3ff
      },
      desert: {
        name: 'SOLARPUNK CIRCUIT',
        fog: 0x1a0c06,
        sky: 0x140703,
        road: 0x1f140e,
        laneLines: 0xffaa00,
        grid: 0xff4400,
        buildingDark: 0x180d07,
        buildingLight: 0xffcc00
      },
      ice: {
        name: 'ICE SERVER CITADEL',
        fog: 0x05101a,
        sky: 0x030a12,
        road: 0x0a1624,
        laneLines: 0x00ffff,
        grid: 0x00a8ff,
        buildingDark: 0x07111c,
        buildingLight: 0x88eeff
      }
    };
    this.currentThemeId = 'neon';
    this.activeTheme = { ...this.themes.neon };

    // Camera Rig & Shake
    this.cameraTarget = new THREE.Vector3(0, 1.8, 0);
    this.cameraOffset = new THREE.Vector3(0, 2.7, 5.6);
    this.cameraShakeIntensity = 0;
    this.baseFov = 68;
    this.targetFov = 68;

    // Procedural Billboard dynamic canvas textures
    this.billboardTextures = [];
    this.createHoloBillboards();

    // Floating Cyber Dust & Speed Lines
    this.createAtmosphere();
    this.createSpeedLines();

    // Hovercars in background
    this.hovercars = [];
    this.createHovercars();

    // Initialize track chunk pool
    this.initTrackChunks();

    // Scene lighting
    this.setupLighting();
  }

  setupLighting() {
    this.scene.fog = new THREE.FogExp2(this.activeTheme.fog, 0.013);

    // Cyberpunk ambient light
    this.ambientLight = new THREE.AmbientLight(0x223355, 0.85);
    this.scene.add(this.ambientLight);

    // Forward directional moonlight / neon wash
    this.dirLight = new THREE.DirectionalLight(0x00f3ff, 1.2);
    this.dirLight.position.set(10, 20, 15);
    this.scene.add(this.dirLight);

    // Underglow light
    this.underglowLight = new THREE.DirectionalLight(0xff0055, 0.8);
    this.underglowLight.position.set(-10, -10, 15);
    this.scene.add(this.underglowLight);
  }

  createHoloBillboards() {
    const slogans = [
      { text: 'RUN AND RUN', sub: 'NO EXIT // SURVIVE', color: '#00f3ff', border: '#ff0055' },
      { text: 'OVERCLOCK', sub: 'NEURAL NEXUS 9000', color: '#ffe600', border: '#00f3ff' },
      { text: 'SYNTH COLA', sub: 'TASTE THE MATRIX', color: '#ff0077', border: '#ffe600' },
      { text: 'GOATED DEV', sub: 'AI LEVEL: SUPREME 🔥', color: '#00ff88', border: '#00f3ff' },
      { text: 'VOID DRIFT', sub: 'ZERO GRAVITY ZONE', color: '#aa00ff', border: '#00ffff' }
    ];

    slogans.forEach((slogan) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      // Draw futuristic cyberpunk billboard
      ctx.fillStyle = '#060814';
      ctx.fillRect(0, 0, 512, 256);

      // Cyber grid background
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.15)';
      ctx.lineWidth = 2;
      for (let x = 0; x < 512; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke();
      }
      for (let y = 0; y < 256; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
      }

      // Neon Border
      ctx.strokeStyle = slogan.border;
      ctx.lineWidth = 8;
      ctx.strokeRect(12, 12, 488, 232);

      // Corner brackets
      ctx.fillStyle = slogan.color;
      ctx.fillRect(8, 8, 24, 24);
      ctx.fillRect(480, 8, 24, 24);
      ctx.fillRect(8, 224, 24, 24);
      ctx.fillRect(480, 224, 24, 24);

      // Text Title
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = slogan.color;
      ctx.shadowBlur = 18;
      ctx.fillStyle = slogan.color;
      ctx.fillText(slogan.text, 256, 125);

      // Subtitle
      ctx.font = 'bold 22px sans-serif';
      ctx.shadowColor = slogan.border;
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(slogan.sub, 256, 180);

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      this.billboardTextures.push(texture);
    });
  }

  createAtmosphere() {
    // Cyber dust motes
    const count = 350;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 25 - 2;
      positions[i * 3 + 2] = -Math.random() * 220;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x00f3ff,
      size: 0.35,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    this.dustParticles = new THREE.Points(geom, mat);
    this.scene.add(this.dustParticles);
  }

  createSpeedLines() {
    const lineCount = 45;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(lineCount * 6);

    for (let i = 0; i < lineCount; i++) {
      const x = (Math.random() - 0.5) * 20;
      const y = Math.random() * 10;
      const z = -Math.random() * 50;
      const len = 4 + Math.random() * 8;

      positions[i * 6] = x;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = z;

      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = y;
      positions[i * 6 + 5] = z + len;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.speedLinesMat = new THREE.LineBasicMaterial({
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });

    this.speedLines = new THREE.LineSegments(geom, this.speedLinesMat);
    this.scene.add(this.speedLines);
  }

  createHovercars() {
    this.hovercarGroup = new THREE.Group();
    this.scene.add(this.hovercarGroup);

    const carGeom = new THREE.BoxGeometry(1.6, 0.45, 3.8);
    for (let i = 0; i < 12; i++) {
      const isCyan = i % 2 === 0;
      const carMat = new THREE.MeshBasicMaterial({
        color: isCyan ? 0x00f3ff : 0xff0055,
        wireframe: false
      });
      const mesh = new THREE.Mesh(carGeom, carMat);
      mesh.position.set(
        (Math.random() > 0.5 ? 1 : -1) * (18 + Math.random() * 25),
        6 + Math.random() * 18,
        -Math.random() * 300
      );
      this.hovercarGroup.add(mesh);
      this.hovercars.push({
        mesh,
        speed: (25 + Math.random() * 30) * (mesh.position.x > 0 ? -1 : 1)
      });
    }
  }

  initTrackChunks() {
    this.trackWidth = 9.8;
    this.sharedMaterials = {
      road: new THREE.MeshStandardMaterial({
        color: this.activeTheme.road,
        roughness: 0.7,
        metalness: 0.3
      }),
      laneDivider: new THREE.MeshBasicMaterial({
        color: this.activeTheme.laneLines
      }),
      rail: new THREE.MeshBasicMaterial({
        color: this.activeTheme.grid
      }),
      building: new THREE.MeshStandardMaterial({
        color: this.activeTheme.buildingDark,
        roughness: 0.85,
        metalness: 0.2
      })
    };

    for (let i = 0; i < this.visibleChunks; i++) {
      const chunk = this.createChunkMesh(this.nextChunkZ);
      this.chunks.push(chunk);
      this.scene.add(chunk);
      this.nextChunkZ -= this.chunkLength;
    }
  }

  createChunkMesh(zPos) {
    const chunk = new THREE.Group();
    chunk.position.z = zPos;

    // 1. FLOOR ROAD SURFACE
    const roadGeom = new THREE.PlaneGeometry(this.trackWidth, this.chunkLength, 1, 1);
    roadGeom.rotateX(-Math.PI / 2);
    const road = new THREE.Mesh(roadGeom, this.sharedMaterials.road);
    road.position.set(0, 0, -this.chunkLength / 2);
    chunk.add(road);

    // 2. CEILING ROAD SURFACE (For Gravity Flip!)
    const ceilingRoad = new THREE.Mesh(roadGeom, this.sharedMaterials.road);
    ceilingRoad.position.set(0, 7.5, -this.chunkLength / 2);
    ceilingRoad.rotation.z = Math.PI;
    chunk.add(ceilingRoad);

    // 3. FLOOR LANE DIVIDER LINES
    const laneStripGeom = new THREE.PlaneGeometry(0.12, this.chunkLength);
    laneStripGeom.rotateX(-Math.PI / 2);

    [-1.4, 1.4].forEach(xOffset => {
      const strip = new THREE.Mesh(laneStripGeom, this.sharedMaterials.laneDivider);
      strip.position.set(xOffset, 0.02, -this.chunkLength / 2);
      chunk.add(strip);

      // Inverted ceiling strip
      const ceilStrip = new THREE.Mesh(laneStripGeom, this.sharedMaterials.laneDivider);
      ceilStrip.position.set(xOffset, 7.48, -this.chunkLength / 2);
      chunk.add(ceilStrip);
    });

    // 4. NEON GUARD RAILS (Glowing cyber pipes)
    const railGeom = new THREE.CylinderGeometry(0.08, 0.08, this.chunkLength, 8);
    railGeom.rotateX(Math.PI / 2);

    [-this.trackWidth / 2, this.trackWidth / 2].forEach(xOffset => {
      // Floor rail
      const railFloor = new THREE.Mesh(railGeom, this.sharedMaterials.rail);
      railFloor.position.set(xOffset, 0.25, -this.chunkLength / 2);
      chunk.add(railFloor);

      // Ceiling rail
      const railCeil = new THREE.Mesh(railGeom, this.sharedMaterials.rail);
      railCeil.position.set(xOffset, 7.25, -this.chunkLength / 2);
      chunk.add(railCeil);
    });

    // 5. PARALLAX SKYSCRAPERS & CITYSCAPE
    this.addCityBuildingsToChunk(chunk);

    // 6. HOLOGRAPHIC BILLBOARDS
    this.addBillboardsToChunk(chunk);

    return chunk;
  }

  addCityBuildingsToChunk(chunk) {
    // Generate 6 buildings on left and right sides
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 4; i++) {
        const width = 8 + Math.random() * 12;
        const depth = 8 + Math.random() * 12;
        const height = 28 + Math.random() * 55;

        const bGeom = new THREE.BoxGeometry(width, height, depth);
        const bMesh = new THREE.Mesh(bGeom, this.sharedMaterials.building);

        const x = side * (this.trackWidth / 2 + width / 2 + 3 + Math.random() * 8);
        const y = height / 2 - 4;
        const z = -(i * 15 + Math.random() * 6);

        bMesh.position.set(x, y, z);
        chunk.add(bMesh);

        // Add glowing window beacon strip along roof
        const beaconGeom = new THREE.BoxGeometry(width * 0.9, 0.6, depth * 0.9);
        const beaconMesh = new THREE.Mesh(beaconGeom, this.sharedMaterials.laneDivider);
        beaconMesh.position.set(x, height - 3.8, z);
        chunk.add(beaconMesh);
      }
    }
  }

  addBillboardsToChunk(chunk) {
    if (this.billboardTextures.length === 0) return;
    // Add 1 holographic billboard per chunk occasionally
    if (Math.random() > 0.45) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const tex = this.billboardTextures[Math.floor(Math.random() * this.billboardTextures.length)];

      const boardMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide
      });

      const boardGeom = new THREE.PlaneGeometry(8, 4);
      const board = new THREE.Mesh(boardGeom, boardMat);
      board.position.set(
        side * (this.trackWidth / 2 + 5.5),
        4.5 + Math.random() * 3,
        -this.chunkLength / 2
      );
      board.rotation.y = side > 0 ? -0.35 : 0.35;
      chunk.add(board);
    }
  }

  // Camera Shake Trigger
  triggerCameraShake(amount = 0.4) {
    this.cameraShakeIntensity = Math.min(1.2, this.cameraShakeIntensity + amount);
  }

  // Apply Theme
  setTheme(themeId) {
    if (!this.themes[themeId]) return;
    this.currentThemeId = themeId;
    const t = this.themes[themeId];
    this.activeTheme = { ...t };

    this.scene.fog.color.setHex(t.fog);
    this.ambientLight.color.setHex(t.buildingLight);
    this.dirLight.color.setHex(t.laneLines);
    this.underglowLight.color.setHex(t.grid);

    this.sharedMaterials.road.color.setHex(t.road);
    this.sharedMaterials.laneDivider.color.setHex(t.laneLines);
    this.sharedMaterials.rail.color.setHex(t.grid);
    this.sharedMaterials.building.color.setHex(t.buildingDark);
  }

  update(delta, player, gameSpeed) {
    // 1. Recycle Track Chunks
    const playerZ = player.mesh.position.z;

    this.chunks.forEach(chunk => {
      // When chunk is far behind camera, recycle it to the front
      if (chunk.position.z > playerZ + this.chunkLength * 1.5) {
        chunk.position.z = this.nextChunkZ;
        this.nextChunkZ -= this.chunkLength;
      }
    });

    // 2. Parallax Hovercars Update
    this.hovercars.forEach(hc => {
      hc.mesh.position.z += hc.speed * delta;
      if (hc.mesh.position.z > playerZ + 50) {
        hc.mesh.position.z = playerZ - 260 - Math.random() * 50;
      } else if (hc.mesh.position.z < playerZ - 300) {
        hc.mesh.position.z = playerZ + 30;
      }
    });

    // 3. Cyber Dust Follower
    if (this.dustParticles) {
      this.dustParticles.position.z = playerZ;
    }

    // 4. Speed Lines Animation
    if (this.speedLines) {
      this.speedLines.position.z = playerZ;
      const speedRatio = Math.max(0, (gameSpeed - 24) / 28);
      const isBoosting = player.isOverclock || gameSpeed > 32;
      this.speedLinesMat.opacity = isBoosting ? 0.75 : speedRatio * 0.4;
      this.targetFov = isBoosting ? 78 : (this.baseFov + speedRatio * 8);
    }

    // FOV interpolation
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFov, delta * 6);
    this.camera.updateProjectionMatrix();

    // 5. Camera Follow Rig with Smooth Inversion
    const pPos = player.mesh.position;
    const isCeiling = player.gravityDirection === -1;

    // Invert camera Y offset when running on ceiling
    const targetCamY = isCeiling ? 4.8 : 2.7;
    const targetCamZ = 5.8;

    this.cameraTarget.x = THREE.MathUtils.lerp(this.cameraTarget.x, pPos.x * 0.45, delta * 12);
    this.cameraTarget.y = THREE.MathUtils.lerp(this.cameraTarget.y, pPos.y + (isCeiling ? -1.2 : 1.4), delta * 10);
    this.cameraTarget.z = pPos.z - 2.5;

    // Camera actual position
    const desiredX = this.cameraTarget.x;
    const desiredY = THREE.MathUtils.lerp(this.camera.position.y, pPos.y + targetCamY, delta * 12);
    const desiredZ = pPos.z + targetCamZ;

    // Apply Camera Shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.cameraShakeIntensity > 0.005) {
      shakeX = (Math.random() - 0.5) * this.cameraShakeIntensity;
      shakeY = (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.cameraShakeIntensity = THREE.MathUtils.lerp(this.cameraShakeIntensity, 0, delta * 9);
    }

    this.camera.position.set(desiredX + shakeX, desiredY + shakeY, desiredZ);

    // Camera Up Vector: flips smoothly 180 deg when on ceiling!
    const targetUpY = player.gravityDirection;
    this.camera.up.y = THREE.MathUtils.lerp(this.camera.up.y, targetUpY, delta * 8);
    this.camera.up.normalize();

    this.camera.lookAt(this.cameraTarget);
  }

  reset() {
    this.nextChunkZ = 0;
    this.chunks.forEach((chunk, i) => {
      chunk.position.z = this.nextChunkZ;
      this.nextChunkZ -= this.chunkLength;
    });
    this.cameraShakeIntensity = 0;
    this.camera.up.set(0, 1, 0);
    this.setTheme('neon');
  }

  dispose() {
    this.chunks.forEach(chunk => this.scene.remove(chunk));
    this.scene.remove(this.hovercarGroup);
    this.scene.remove(this.dustParticles);
    this.scene.remove(this.speedLines);
  }
}
