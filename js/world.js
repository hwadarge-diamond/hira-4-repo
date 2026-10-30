// RUN AND RUN: NETAJI IN EUROPE - European City Streets & Cream White Aesthetics
// Cobblestone paving, Parisian & Amsterdam pastel townhouses, cafe awnings, flower balconies, vintage streetlamps
import * as THREE from 'three';

export class World {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    this.chunkLength = 60;
    this.visibleChunks = 7;
    this.chunks = [];
    this.nextChunkZ = 0;
    this.totalDistance = 0;

    // Elegant Cream White & Warm European Palettes
    this.themes = {
      paris: {
        name: 'PARISIAN BOULEVARD',
        fog: 0xfbf7ed,           // Soft morning cream mist
        sky: 0xf5eedb,           // Warm daylight ivory
        road: 0xd6cbb8,          // European Cobblestone grey-cream
        curb: 0xbaa892,
        buildingCream: 0xfbf8ee, // Cream white stone
        buildingAccent: 0xe0d2bd,
        roof: 0x485665,          // Slate grey mansard roofs
        awning: 0xcc4433         // Red & white striped awnings
      },
      amsterdam: {
        name: 'AMSTERDAM CANAL ROW',
        fog: 0xf7f2e4,
        sky: 0xeef5fb,
        road: 0xbda990,
        curb: 0x9e8870,
        buildingCream: 0xf2ebe0,
        buildingAccent: 0xc48462, // Terracotta brick
        roof: 0x36454f,
        awning: 0x2e7d32
      },
      florence: {
        name: 'TUSCAN PIAZZA SUN',
        fog: 0xfdf6e2,
        sky: 0xfff8e8,
        road: 0xd2bba0,
        curb: 0xb09576,
        buildingCream: 0xfcf4dc,
        buildingAccent: 0xdf9b62,
        roof: 0xa84e32,
        awning: 0xff9800
      }
    };
    this.currentThemeId = 'paris';
    this.activeTheme = { ...this.themes.paris };

    // Camera Rig & Shake
    this.cameraTarget = new THREE.Vector3(0, 1.8, 0);
    this.cameraOffset = new THREE.Vector3(0, 2.7, 5.6);
    this.cameraShakeIntensity = 0;
    this.baseFov = 68;
    this.targetFov = 68;

    // European Cafe & Campaign Banners
    this.cafeBanners = [];
    this.createCafeBanners();

    // Warm Sunbeam Motes & Flying Pigeons
    this.createAtmosphere();
    this.createFlyingPigeons();

    // Initialize track chunk pool
    this.initTrackChunks();

    // Scene lighting (Warm golden European sunlight)
    this.setupLighting();
  }

  setupLighting() {
    this.scene.fog = new THREE.FogExp2(this.activeTheme.fog, 0.011);

    // Warm daylight ambient
    this.ambientLight = new THREE.AmbientLight(0xfff5e4, 0.95);
    this.scene.add(this.ambientLight);

    // Golden Sunlight
    this.sunLight = new THREE.DirectionalLight(0xfff0d0, 1.35);
    this.sunLight.position.set(15, 28, 18);
    this.sunLight.castShadow = true;
    this.scene.add(this.sunLight);

    // Warm fill light from opposite street side
    this.fillLight = new THREE.DirectionalLight(0xedd4b8, 0.65);
    this.fillLight.position.set(-15, 12, 10);
    this.scene.add(this.fillLight);
  }

  createCafeBanners() {
    const banners = [
      { text: 'CAFE DE NETAS', sub: 'MASALA CHAI & CROISSANTS', bg: '#fdf8ec', border: '#b85d19' },
      { text: 'BOULANGERIE DESI', sub: 'FRESH SAMOSA & BAGUETTES', bg: '#fffaf0', border: '#2e7d32' },
      { text: 'VOTE FOR NETAJI', sub: 'EUROPE TOUR 2099', bg: '#ffffff', border: '#e65100' },
      { text: 'CHUNAV GELATO', sub: '100% PURE DESI GHEE', bg: '#fdfbf7', border: '#1565c0' },
      { text: 'BHAI-CHARA BISTRO', sub: 'Z-PLUS VIP SEATING', bg: '#fff8f0', border: '#c2185b' }
    ];

    banners.forEach((b) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      // Cream background
      ctx.fillStyle = b.bg;
      ctx.fillRect(0, 0, 512, 256);

      // Gold ornate border
      ctx.strokeStyle = b.border;
      ctx.lineWidth = 10;
      ctx.strokeRect(14, 14, 484, 228);

      // Inner elegant pinstripe
      ctx.strokeStyle = '#d7c4a3';
      ctx.lineWidth = 2;
      ctx.strokeRect(24, 24, 464, 208);

      // Ornate corner flourishes
      ctx.fillStyle = b.border;
      ctx.fillRect(14, 14, 20, 20);
      ctx.fillRect(478, 14, 20, 20);
      ctx.fillRect(14, 222, 20, 20);
      ctx.fillRect(478, 222, 20, 20);

      // Main Text
      ctx.font = 'bold 38px "Rajdhani", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#2c221a';
      ctx.fillText(b.text, 256, 120);

      // Subtitle
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = b.border;
      ctx.fillText(b.sub, 256, 175);

      const texture = new THREE.CanvasTexture(canvas);
      this.cafeBanners.push(texture);
    });
  }

  createAtmosphere() {
    // Warm golden sunlight motes
    const count = 280;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 55;
      positions[i * 3 + 1] = Math.random() * 22;
      positions[i * 3 + 2] = -Math.random() * 220;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffe2a4, // Warm gold dust
      size: 0.35,
      transparent: true,
      opacity: 0.55
    });

    this.dustParticles = new THREE.Points(geom, mat);
    this.scene.add(this.dustParticles);
  }

  createFlyingPigeons() {
    this.pigeonGroup = new THREE.Group();
    this.scene.add(this.pigeonGroup);

    this.pigeons = [];
    const pGeom = new THREE.ConeGeometry(0.18, 0.5, 4);
    pGeom.rotateX(Math.PI / 2);
    const pMat = new THREE.MeshStandardMaterial({ color: 0x78909c, roughness: 0.7 });

    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(pGeom, pMat);
      mesh.position.set(
        (Math.random() - 0.5) * 16,
        4 + Math.random() * 8,
        -Math.random() * 250
      );
      this.pigeonGroup.add(mesh);
      this.pigeons.push({
        mesh,
        speed: 12 + Math.random() * 15,
        flapOffset: Math.random() * 10
      });
    }
  }

  initTrackChunks() {
    this.trackWidth = 9.8;

    // Shared European Townhouse & Street Materials
    this.sharedMaterials = {
      cobblestone: new THREE.MeshStandardMaterial({
        color: this.activeTheme.road,
        roughness: 0.85,
        metalness: 0.05
      }),
      sidewalk: new THREE.MeshStandardMaterial({
        color: this.activeTheme.curb,
        roughness: 0.8
      }),
      facadeCream: new THREE.MeshStandardMaterial({
        color: this.activeTheme.buildingCream,
        roughness: 0.7
      }),
      facadeAccent: new THREE.MeshStandardMaterial({
        color: this.activeTheme.buildingAccent,
        roughness: 0.7
      }),
      roofSlate: new THREE.MeshStandardMaterial({
        color: this.activeTheme.roof,
        roughness: 0.65
      }),
      awningFabric: new THREE.MeshStandardMaterial({
        color: this.activeTheme.awning,
        roughness: 0.8
      }),
      streetlamp: new THREE.MeshStandardMaterial({
        color: 0x212121,
        metalness: 0.8,
        roughness: 0.3
      }),
      lanternGlow: new THREE.MeshBasicMaterial({
        color: 0xffe082
      }),
      geranium: new THREE.MeshStandardMaterial({
        color: 0xe91e63, // Hot pink flower boxes
        roughness: 0.6
      })
    };

    for (let i = 0; i < this.visibleChunks; i++) {
      const chunk = this.createEuropeanChunk(this.nextChunkZ);
      this.chunks.push(chunk);
      this.scene.add(chunk);
      this.nextChunkZ -= this.chunkLength;
    }
  }

  createEuropeanChunk(zPos) {
    const chunk = new THREE.Group();
    chunk.position.z = zPos;

    // 1. MAIN COBBLESTONE STREET
    const roadGeom = new THREE.PlaneGeometry(this.trackWidth, this.chunkLength);
    roadGeom.rotateX(-Math.PI / 2);
    const road = new THREE.Mesh(roadGeom, this.sharedMaterials.cobblestone);
    road.position.set(0, 0, -this.chunkLength / 2);
    chunk.add(road);

    // 2. OVERHEAD ROOFTOP RUNWAY (For Gravity Flip!)
    const roofRoad = new THREE.Mesh(roadGeom, this.sharedMaterials.roofSlate);
    roofRoad.position.set(0, 7.5, -this.chunkLength / 2);
    roofRoad.rotation.z = Math.PI;
    chunk.add(roofRoad);

    // 3. CURBS & SIDEWALKS
    const walkGeom = new THREE.BoxGeometry(2.5, 0.25, this.chunkLength);
    [-this.trackWidth / 2 - 1.25, this.trackWidth / 2 + 1.25].forEach(x => {
      const walk = new THREE.Mesh(walkGeom, this.sharedMaterials.sidewalk);
      walk.position.set(x, 0.12, -this.chunkLength / 2);
      chunk.add(walk);
    });

    // 4. ELEGANT CAST-IRON STREETLAMPS
    this.addStreetlampsToChunk(chunk);

    // 5. EUROPEAN TOWNHOUSES & FACADES
    this.addTownhousesToChunk(chunk);

    // 6. CAFE AWNINGS & BANNERS
    this.addCafeAwningsToChunk(chunk);

    return chunk;
  }

  addStreetlampsToChunk(chunk) {
    const postGeom = new THREE.CylinderGeometry(0.08, 0.1, 4.2, 8);
    const armGeom = new THREE.BoxGeometry(0.6, 0.08, 0.08);
    const lanternGeom = new THREE.BoxGeometry(0.35, 0.45, 0.35);

    [-this.trackWidth / 2 - 0.4, this.trackWidth / 2 + 0.4].forEach(x => {
      for (let z = -12; z >= -this.chunkLength + 10; z -= 24) {
        const post = new THREE.Mesh(postGeom, this.sharedMaterials.streetlamp);
        post.position.set(x, 2.1, z);

        const arm = new THREE.Mesh(armGeom, this.sharedMaterials.streetlamp);
        arm.position.set(x > 0 ? -0.25 : 0.25, 1.95, 0);
        post.add(arm);

        const lantern = new THREE.Mesh(lanternGeom, this.sharedMaterials.lanternGlow);
        lantern.position.set(x > 0 ? -0.55 : 0.55, 1.8, 0);
        post.add(lantern);

        chunk.add(post);
      }
    });
  }

  addTownhousesToChunk(chunk) {
    // Left and right rows of European townhouses
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 4; i++) {
        const width = 10 + Math.random() * 4;
        const depth = 12 + Math.random() * 4;
        const height = 22 + Math.random() * 14;

        const isCream = (i % 2 === 0);
        const mat = isCream ? this.sharedMaterials.facadeCream : this.sharedMaterials.facadeAccent;

        const bGeom = new THREE.BoxGeometry(width, height, depth);
        const house = new THREE.Mesh(bGeom, mat);

        const x = side * (this.trackWidth / 2 + width / 2 + 2.5);
        const y = height / 2;
        const z = -(i * 15 + Math.random() * 4);

        house.position.set(x, y, z);
        chunk.add(house);

        // Slanted Mansard Roof Top
        const roofGeom = new THREE.ConeGeometry(width * 0.75, 4.5, 4);
        roofGeom.rotateY(Math.PI / 4);
        const roof = new THREE.Mesh(roofGeom, this.sharedMaterials.roofSlate);
        roof.position.set(x, height + 2.2, z);
        chunk.add(roof);

        // Flower boxes with bright pink geraniums on windows!
        const boxGeom = new THREE.BoxGeometry(1.6, 0.25, 0.4);
        const flowers = new THREE.Mesh(boxGeom, this.sharedMaterials.geranium);
        flowers.position.set(
          side * (this.trackWidth / 2 + 2.4),
          3.8 + Math.random() * 3,
          z
        );
        chunk.add(flowers);
      }
    }
  }

  addCafeAwningsToChunk(chunk) {
    // Quaint cafe awnings along sidewalk
    if (this.cafeBanners.length === 0) return;

    for (let side = -1; side <= 1; side += 2) {
      if (Math.random() > 0.4) {
        // Striped Awning
        const awningGeom = new THREE.BoxGeometry(3.6, 0.25, 2.2);
        awningGeom.rotateZ(side * -0.22);
        const awning = new THREE.Mesh(awningGeom, this.sharedMaterials.awningFabric);
        awning.position.set(
          side * (this.trackWidth / 2 + 1.8),
          3.2,
          -this.chunkLength / 2 + (Math.random() - 0.5) * 20
        );
        chunk.add(awning);

        // Cafe / Campaign Banner Board
        const tex = this.cafeBanners[Math.floor(Math.random() * this.cafeBanners.length)];
        const boardMat = new THREE.MeshBasicMaterial({
          map: tex,
          side: THREE.DoubleSide
        });
        const board = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.6), boardMat);
        board.position.set(
          side * (this.trackWidth / 2 + 2.8),
          4.5,
          awning.position.z
        );
        board.rotation.y = side > 0 ? -0.3 : 0.3;
        chunk.add(board);
      }
    }
  }

  triggerCameraShake(amount = 0.35) {
    this.cameraShakeIntensity = Math.min(1.0, this.cameraShakeIntensity + amount);
  }

  setTheme(themeId) {
    if (!this.themes[themeId]) return;
    this.currentThemeId = themeId;
    const t = this.themes[themeId];
    this.activeTheme = { ...t };

    this.scene.fog.color.setHex(t.fog);
    this.ambientLight.color.setHex(t.sky);
    this.sunLight.color.setHex(t.sky);

    this.sharedMaterials.cobblestone.color.setHex(t.road);
    this.sharedMaterials.sidewalk.color.setHex(t.curb);
    this.sharedMaterials.facadeCream.color.setHex(t.buildingCream);
    this.sharedMaterials.facadeAccent.color.setHex(t.buildingAccent);
    this.sharedMaterials.roofSlate.color.setHex(t.roof);
    this.sharedMaterials.awningFabric.color.setHex(t.awning);
  }

  update(delta, player, gameSpeed) {
    const playerZ = player.mesh.position.z;

    // 1. Recycle chunks
    this.chunks.forEach(chunk => {
      if (chunk.position.z > playerZ + this.chunkLength * 1.5) {
        chunk.position.z = this.nextChunkZ;
        this.nextChunkZ -= this.chunkLength;
      }
    });

    // 2. Flying pigeons
    this.pigeons.forEach(p => {
      p.mesh.position.z += p.speed * delta;
      p.mesh.position.y += Math.sin(Date.now() * 0.008 + p.flapOffset) * delta * 0.8;
      if (p.mesh.position.z > playerZ + 40) {
        p.mesh.position.z = playerZ - 200 - Math.random() * 50;
      }
    });

    // 3. Dust particles
    if (this.dustParticles) {
      this.dustParticles.position.z = playerZ;
    }

    // 4. Camera Follow
    const pPos = player.mesh.position;
    const isCeiling = player.gravityDirection === -1;
    const targetCamY = isCeiling ? 4.8 : 2.7;

    this.cameraTarget.x = THREE.MathUtils.lerp(this.cameraTarget.x, pPos.x * 0.45, delta * 12);
    this.cameraTarget.y = THREE.MathUtils.lerp(this.cameraTarget.y, pPos.y + (isCeiling ? -1.2 : 1.4), delta * 10);
    this.cameraTarget.z = pPos.z - 2.5;

    let shakeX = 0;
    let shakeY = 0;
    if (this.cameraShakeIntensity > 0.005) {
      shakeX = (Math.random() - 0.5) * this.cameraShakeIntensity;
      shakeY = (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.cameraShakeIntensity = THREE.MathUtils.lerp(this.cameraShakeIntensity, 0, delta * 9);
    }

    this.camera.position.set(
      this.cameraTarget.x + shakeX,
      THREE.MathUtils.lerp(this.camera.position.y, pPos.y + targetCamY, delta * 12) + shakeY,
      pPos.z + 5.8
    );

    const targetUpY = player.gravityDirection;
    this.camera.up.y = THREE.MathUtils.lerp(this.camera.up.y, targetUpY, delta * 8);
    this.camera.up.normalize();
    this.camera.lookAt(this.cameraTarget);
  }

  reset() {
    this.nextChunkZ = 0;
    this.chunks.forEach((chunk) => {
      chunk.position.z = this.nextChunkZ;
      this.nextChunkZ -= this.chunkLength;
    });
    this.cameraShakeIntensity = 0;
    this.camera.up.set(0, 1, 0);
    this.setTheme('paris');
  }

  dispose() {
    this.chunks.forEach(chunk => this.scene.remove(chunk));
    this.scene.remove(this.pigeonGroup);
    this.scene.remove(this.dustParticles);
  }
}
