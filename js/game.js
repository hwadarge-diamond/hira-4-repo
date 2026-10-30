// RUN AND RUN - Master Game Engine
// Integrates Three.js, UnrealBloomPass, AI Director, Hunter Chase Drone, Ghost Replay, Daily Challenge, Zones
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { audio } from './audio.js';
import { Player } from './player.js';
import { World } from './world.js';
import { ObstacleManager } from './obstacles.js';
import { PowerupManager } from './powerups.js';
import { UIManager } from './ui.js';

// Seeded PRNG for Daily Challenge
class SeededRNG {
  constructor(seed = 12345678) {
    this.seed = seed;
  }
  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

export class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.isRunning = false;
    this.isPaused = false;
    this.isDailyMode = false;

    // Game stats
    this.score = 0;
    this.distance = 0;
    this.coinsRun = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.nearMisses = 0;
    this.gameSpeed = 26; // Base running speed
    this.targetSpeed = 26;

    // Hunter Apex Drone (Chase Boss)
    this.hunterDistance = 38; // Meters behind player
    this.hunterMaxDist = 45;
    this.hunterMesh = null;

    // Zones
    this.currentZone = 'NORMAL';
    this.zoneDistance = 0;

    // AI Director ("Neural Nexus")
    this.aiStressLevel = 0.5; // 0 (relaxed) to 1 (intense)
    this.recentDodges = 0;
    this.recentHits = 0;
    this.nextSpawnZ = -30;

    // Ghost Replay
    this.ghostMesh = null;
    this.ghostHistory = [];
    this.ghostFrameIndex = 0;

    // Quality & Postprocessing
    this.useBloom = true;
    this.clock = new THREE.Clock();

    // Load Saved Data
    this.loadSaveData();

    // Setup Three.js Core
    this.initThree();

    // Subsystems
    this.world = new World(this.scene, this.camera);
    this.player = new Player(this.scene);
    this.obstacles = new ObstacleManager(this.scene);
    this.powerups = new PowerupManager(this.scene);
    this.ui = new UIManager(this);

    // Apply saved customization
    this.player.applySkin(this.saveData.selectedSkin);
    this.player.applyTrail(this.saveData.selectedTrail);

    // Build Hunter Drone 3D Model
    this.buildHunterDrone();

    // Build Ghost Clone
    this.buildGhostClone();

    // Input handlers
    this.setupInput();

    // Resize handler
    window.addEventListener('resize', () => this.onResize());

    // Tab blur pause
    window.addEventListener('blur', () => {
      if (this.isRunning && !this.isPaused) {
        this.togglePause();
      }
    });

    // Initial Menu display
    this.ui.showMainMenu();

    // Start render loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 400);
    this.camera.position.set(0, 3, 6);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // Post-processing UnrealBloomPass setup
    try {
      this.composer = new EffectComposer(this.renderer);
      const renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);

      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.15, // bloom strength
        0.35, // radius
        0.82  // threshold
      );
      this.composer.addPass(this.bloomPass);
    } catch (e) {
      console.warn('Bloom initialization failed, falling back to basic render:', e);
      this.useBloom = false;
    }
  }

  setBloom(enabled) {
    this.useBloom = enabled;
  }

  buildHunterDrone() {
    this.hunterGroup = new THREE.Group();

    // Aggressive stealth chassis
    const bodyGeom = new THREE.ConeGeometry(1.2, 3.2, 4);
    bodyGeom.rotateX(Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x110308,
      metalness: 0.95,
      roughness: 0.15
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    this.hunterGroup.add(body);

    // Glowing Menacing Red Optics
    const eyeGeom = new THREE.BoxGeometry(0.8, 0.14, 0.2);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });
    const eye = new THREE.Mesh(eyeGeom, eyeMat);
    eye.position.set(0, 0.1, 1.4);
    this.hunterGroup.add(eye);

    // Swept hunter wings
    const wingGeom = new THREE.BoxGeometry(3.6, 0.1, 0.9);
    const wings = new THREE.Mesh(wingGeom, bodyMat);
    wings.position.set(0, 0, -0.4);
    this.hunterGroup.add(wings);

    // Dual afterburner nozzles
    const thrusterGeom = new THREE.CylinderGeometry(0.25, 0.35, 0.6, 8);
    thrusterGeom.rotateX(Math.PI / 2);
    const thrustMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });

    const leftThruster = new THREE.Mesh(thrusterGeom, thrustMat);
    leftThruster.position.set(-0.75, 0, -1.6);
    const rightThruster = new THREE.Mesh(thrusterGeom, thrustMat);
    rightThruster.position.set(0.75, 0, -1.6);
    this.hunterGroup.add(leftThruster, rightThruster);

    this.hunterGroup.position.set(0, 2, 38);
    this.scene.add(this.hunterGroup);
  }

  buildGhostClone() {
    this.ghostGroup = new THREE.Group();
    const geom = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.y = 0.9;
    this.ghostGroup.add(mesh);
    this.ghostGroup.visible = false;
    this.scene.add(this.ghostGroup);
  }

  setupInput() {
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      // Audio trigger on user input
      audio.init();

      if (!this.isRunning) return;

      if (e.code === 'KeyP' || e.code === 'Escape') {
        this.togglePause();
        return;
      }

      if (this.isPaused) return;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.player.moveLeft();
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.player.moveRight();
          break;
        case 'ArrowUp':
        case 'KeyW':
          this.player.jump();
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.player.slide();
          break;
        case 'KeyF':
        case 'KeyG':
          this.player.flipGravity();
          this.trackMission('gravity', 1);
          break;
        case 'Digit1':
          this.player.setForm('RUNNER');
          break;
        case 'Digit2':
          this.player.setForm('DRONE');
          break;
        case 'Digit3':
          this.player.setForm('ORB');
          break;
        case 'KeyQ':
        case 'KeyE':
          this.player.cycleForm();
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.player.toggleOverclock(true);
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.player.toggleOverclock(false);
      }
    });

    // Mobile Swipe Gestures
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    window.addEventListener('touchstart', (e) => {
      audio.init();
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchStartTime = Date.now();
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (!this.isRunning || this.isPaused) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      const dt = Date.now() - touchStartTime;

      if (dt < 450) {
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
          if (dx > 0) this.player.moveRight();
          else this.player.moveLeft();
        } else if (Math.abs(dy) > 30) {
          if (dy < 0) this.player.jump();
          else this.player.slide();
        }
      }
    }, { passive: true });
  }

  startRun(isDaily = false) {
    this.isDailyMode = isDaily;
    this.isRunning = true;
    this.isPaused = false;
    this.score = 0;
    this.distance = 0;
    this.coinsRun = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.nearMisses = 0;
    this.gameSpeed = 26;
    this.targetSpeed = 26;
    this.hunterDistance = 38;
    this.nextSpawnZ = -30;
    this.currentZone = 'NORMAL';
    this.zoneDistance = 0;
    this.ghostFrameIndex = 0;

    // Reset systems
    this.player.reset();
    this.world.reset();
    this.obstacles.reset();
    this.powerups.reset();

    // Setup Seeded RNG if daily
    if (isDaily) {
      const today = new Date();
      const seedStr = `${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}`;
      this.rng = new SeededRNG(parseInt(seedStr, 10));
      this.ui.spawnPopup('DAILY CHALLENGE SEED ACTIVE', 'hype');
    } else {
      this.rng = { next: () => Math.random() };
    }

    // Load Ghost replay if available
    this.ghostHistory = this.saveData.bestRunGhost || [];
    this.ghostGroup.visible = this.ghostHistory.length > 0;

    // UI & Audio
    this.ui.showHUD();
    audio.startMusic();
    audio.setHunterAlert(false);

    // Initial Track population
    for (let i = 0; i < 6; i++) {
      this.spawnTrackChunk();
    }
  }

  togglePause() {
    if (!this.isRunning) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.ui.pauseMenu.classList.remove('hidden');
      audio.stopMusic();
    } else {
      this.ui.pauseMenu.classList.add('hidden');
      audio.startMusic();
    }
  }

  // ADAPTIVE AI DIRECTOR ("NEURAL NEXUS") TRACK SPAWNER
  spawnTrackChunk() {
    const spacing = Math.max(16, 32 - (this.gameSpeed - 26) * 0.35 + (1 - this.aiStressLevel) * 8);
    const z = this.nextSpawnZ;
    this.nextSpawnZ -= spacing;

    const r = this.rng.next();
    const isCeiling = this.player.gravityDirection === -1;

    // 1. Spawn Powerups & Gravity Pads occasionally
    if (r < 0.14) {
      // Gravity Flip Pad on track
      const lane = Math.floor(this.rng.next() * 3) - 1;
      this.powerups.spawnItem('GRAVITY_PAD', lane, z, isCeiling);
    } else if (r < 0.38) {
      // Powerup or Coins
      const pRoll = this.rng.next();
      const lane = Math.floor(this.rng.next() * 3) - 1;
      if (pRoll < 0.08) {
        this.powerups.spawnItem('JETPACK', lane, z, isCeiling);
      } else if (pRoll < 0.22) {
        this.powerups.spawnItem('SHIELD', lane, z, isCeiling);
      } else if (pRoll < 0.38) {
        this.powerups.spawnItem('MAGNET', lane, z, isCeiling);
      } else if (pRoll < 0.52) {
        this.powerups.spawnItem('MULTIPLIER_2X', lane, z, isCeiling);
      } else {
        // Line of coins
        for (let c = 0; c < 4; c++) {
          this.powerups.spawnItem('COIN', lane, z - c * 2.8, isCeiling);
        }
      }
    }

    // 2. Spawn Obstacle based on AI Stress & Variety
    const obsTypes = ['HIGH_BARRIER', 'LOW_BARRIER', 'OVERHEAD_GANTRY'];
    if (this.currentZone === 'GLITCH') {
      obsTypes.push('GLITCH_WALL');
    }
    if (this.gameSpeed > 30) {
      obsTypes.push('MOVING_SWEEPER');
    }

    const chosenType = obsTypes[Math.floor(this.rng.next() * obsTypes.length)];
    const primaryLane = Math.floor(this.rng.next() * 3) - 1;

    this.obstacles.spawnObstacle(chosenType, primaryLane, z, isCeiling);

    // AI Director: On high streaks, spawn a companion obstacle in second lane
    if (this.aiStressLevel > 0.75 && this.rng.next() > 0.5) {
      const secondLane = primaryLane === 0 ? (this.rng.next() > 0.5 ? 1 : -1) : 0;
      const secondType = chosenType === 'HIGH_BARRIER' ? 'LOW_BARRIER' : 'OVERHEAD_GANTRY';
      this.obstacles.spawnObstacle(secondType, secondLane, z, isCeiling);
    }
  }

  // ZONE MANAGER
  updateZones(delta) {
    this.zoneDistance += this.gameSpeed * delta;

    // Shift zone every 1000m
    if (this.zoneDistance > 1000) {
      this.zoneDistance = 0;
      const zones = ['NORMAL', 'MAGNET', 'LOW_GRAVITY', 'GLITCH'];
      const nextIdx = (zones.indexOf(this.currentZone) + 1) % zones.length;
      this.currentZone = zones[nextIdx];

      if (this.currentZone === 'MAGNET') {
        this.ui.showZoneBanner('MAGNET FLUX ZONE', 'Coins gravitationally pulled to player!');
        this.world.setTheme('neon');
      } else if (this.currentZone === 'LOW_GRAVITY') {
        this.ui.showZoneBanner('ZERO-G VOID ZONE', 'Lunar floaty physics enabled!');
        this.player.gravityMultiplier = 0.52;
        this.world.setTheme('ice');
      } else if (this.currentZone === 'GLITCH') {
        this.ui.showZoneBanner('CYBER-GLITCH ZONE', 'Obstacles phase and teleport lanes!');
        this.player.gravityMultiplier = 1.0;
        this.world.setTheme('desert');
      } else {
        this.ui.showZoneBanner('NEON METROPOLIS', 'Standard high-speed corridor');
        this.player.gravityMultiplier = 1.0;
        this.world.setTheme('neon');
      }
    }
  }

  // NEAR MISS & COMBO
  onNearMiss(obstacle) {
    audio.playNearMiss();
    this.nearMisses++;
    this.combo = Math.min(10, this.combo + 1);
    this.comboTimer = 3.5; // Combo resets in 3.5s

    // Bonus score
    const bonus = 150 * this.combo;
    this.score += bonus;
    this.player.addEnergy(8);

    // UI Popup
    this.ui.spawnPopup(`NEAR MISS x${this.combo}! +${bonus}`, 'hype');
    this.world.triggerCameraShake(0.18);

    // AI Director feedback: player is performing well!
    this.aiStressLevel = Math.min(1.0, this.aiStressLevel + 0.1);
    this.trackMission('nearmiss', 1);
  }

  // CRASH / HIT LOGIC (Hunter Chase & Second Chance)
  handleHit(obstacle) {
    // 1. If Jetpacking: smash through obstacle!
    if (this.powerups.isJetpacking()) {
      audio.playImpact();
      this.world.triggerCameraShake(0.4);
      this.score += 500;
      this.ui.spawnPopup('SMASHED! +500', 'hype');
      obstacle.active = false;
      return;
    }

    // 2. If Shield active: break shield and survive!
    if (this.powerups.hasShield()) {
      this.powerups.breakShield();
      this.player.invulnerableTimer = 1.8;
      this.world.triggerCameraShake(0.5);
      this.ui.spawnPopup('SHIELD CRACKED!', 'warn');
      return;
    }

    // 3. HUNTER CHASE TWO-HIT SYSTEM:
    // If Hunter is far (> 14m), Hunter surges forward to 6m, warning sirens blare!
    if (this.hunterDistance > 14) {
      audio.playImpact();
      this.hunterDistance = 7;
      this.player.invulnerableTimer = 2.2;
      this.combo = 1;
      this.world.triggerCameraShake(0.65);
      this.ui.spawnPopup('THREAT DETECTED! HUNTER CLOSING IN!', 'warn');
      audio.setHunterAlert(true);

      // AI Director: ease obstacle density temporarily for player recovery
      this.aiStressLevel = 0.25;
      return;
    }

    // 4. Fatal Capture by Hunter Apex!
    this.gameOver();
  }

  gameOver() {
    this.isRunning = false;
    this.player.isDead = true;
    audio.playGameOver();
    audio.stopMusic();
    audio.setHunterAlert(false);
    this.world.triggerCameraShake(0.9);

    // Update saves & records
    this.saveData.coins += this.coinsRun;
    if (this.score > this.saveData.bestScore) {
      this.saveData.bestScore = Math.floor(this.score);
      // Save best run ghost replay!
      this.saveData.bestRunGhost = [...this.player.history];
    }

    if (this.isDailyMode) {
      const today = new Date().toISOString().slice(0, 10);
      const dailyKey = `daily_${today}`;
      const prevDaily = this.saveData[dailyKey] || 0;
      if (this.score > prevDaily) {
        this.saveData[dailyKey] = Math.floor(this.score);
      }
    }

    this.saveToStorage();

    // Show Game Over UI
    this.ui.showGameOver({
      score: this.score,
      distance: this.distance,
      coinsRun: this.coinsRun,
      nearMisses: this.nearMisses,
      isDaily: this.isDailyMode
    });
  }

  // MAIN GAME LOOP (60 FPS)
  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(0.08, this.clock.getDelta());

    if (this.isRunning && !this.isPaused) {
      // Dynamic time scale (Bullet time = 0.35x world speed)
      const timeScale = this.player.isOverclock ? 0.35 : 1.0;
      const simDelta = delta * timeScale;

      // Distance & Speed Progression
      this.distance += this.gameSpeed * simDelta;
      this.targetSpeed = 26 + Math.min(22, this.distance * 0.005);
      if (this.powerups.isJetpacking()) {
        this.gameSpeed = THREE.MathUtils.lerp(this.gameSpeed, 55, delta * 8);
      } else {
        this.gameSpeed = THREE.MathUtils.lerp(this.gameSpeed, this.targetSpeed, delta * 2);
      }
      audio.setGameSpeed(this.gameSpeed / 26);

      // Score accumulation
      const mult = this.powerups.activeEffects.multiplierTimer > 0 ? 2 : 1;
      this.score += this.gameSpeed * simDelta * this.combo * mult * 0.6;

      // Combo Decay
      if (this.combo > 1) {
        this.comboTimer -= simDelta;
        if (this.comboTimer <= 0) {
          this.combo = 1;
        }
      }

      // Track distance along -Z
      this.player.mesh.position.z -= this.gameSpeed * simDelta;

      // Player update (Player reacts at 1.0x delta during overclock for snappy matrix dodging!)
      this.player.update(this.player.isOverclock ? delta * 0.9 : simDelta, this.gameSpeed);

      // Procedural Spawn Check
      if (this.player.mesh.position.z - 140 < this.nextSpawnZ) {
        this.spawnTrackChunk();
      }

      // Obstacles update & collision
      this.obstacles.update(simDelta, this.player, (obs) => this.onNearMiss(obs));
      const collidedObs = this.obstacles.checkCollision(this.player);
      if (collidedObs) {
        this.handleHit(collidedObs);
      }

      // Powerups update
      this.powerups.update(simDelta, this.player, (type, count) => {
        if (type === 'COIN') {
          this.coinsRun += count;
          this.score += 50 * mult;
          this.trackMission('coins', count);
        } else if (type === 'GRAVITY_PAD') {
          this.trackMission('gravity', 1);
        }
      });

      // Hunter Apex Drone chase update
      this.updateHunter(simDelta);

      // Ghost Replay Clone update
      this.updateGhost();

      // Zone rules update
      this.updateZones(simDelta);

      // World, Camera & Cityscape update
      this.world.update(simDelta, this.player, this.gameSpeed);

      // HUD update
      this.ui.updateHUD({
        score: this.score,
        distance: this.distance,
        coinsRun: this.coinsRun,
        combo: this.combo
      }, this.player, this.powerups, this.hunterDistance);
    }

    // Render Scene (with UnrealBloomPass or standard WebGLRenderer)
    if (this.useBloom && this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  updateHunter(delta) {
    // If player is running well or jetpacking, Hunter pulls away slowly
    if (this.powerups.isJetpacking() || this.player.isOverclock) {
      this.hunterDistance = Math.min(this.hunterMaxDist, this.hunterDistance + delta * 8);
    } else {
      // Natural recovery towards 35m if player avoids mistakes
      this.hunterDistance = Math.min(this.hunterMaxDist, this.hunterDistance + delta * 2.2);
    }

    // Alarm alert state
    if (this.hunterDistance > 18) {
      audio.setHunterAlert(false);
    }

    // Smooth Hunter mesh positioning behind player
    const pPos = this.player.mesh.position;
    this.hunterGroup.position.x = THREE.MathUtils.lerp(this.hunterGroup.position.x, pPos.x, delta * 6);
    this.hunterGroup.position.y = THREE.MathUtils.lerp(this.hunterGroup.position.y, pPos.y + 1.8, delta * 6);
    this.hunterGroup.position.z = pPos.z + this.hunterDistance;

    // Hover bob
    this.hunterGroup.position.y += Math.sin(Date.now() * 0.005) * 0.12;
  }

  updateGhost() {
    if (!this.ghostGroup.visible || this.ghostHistory.length === 0) return;

    if (this.ghostFrameIndex < this.ghostHistory.length) {
      const snap = this.ghostHistory[this.ghostFrameIndex];
      this.ghostGroup.position.set(snap.x, snap.y, snap.z);
      this.ghostGroup.rotation.z = snap.rotZ || 0;
      this.ghostFrameIndex++;
    }
  }

  // MISSION TRACKING & SAVE PERSISTENCE
  trackMission(type, amount) {
    this.missions.forEach(m => {
      if (m.type === type && !m.claimed) {
        m.progress += amount;
      }
    });
    this.saveToStorage();
  }

  claimMission(idx) {
    const m = this.missions[idx];
    if (m && m.progress >= m.target && !m.claimed) {
      m.claimed = true;
      this.saveData.coins += m.reward;
      this.saveToStorage();
    }
  }

  buySkin(skinId, price) {
    if (this.saveData.coins >= price && !this.saveData.unlockedSkins.includes(skinId)) {
      this.saveData.coins -= price;
      this.saveData.unlockedSkins.push(skinId);
      this.equipSkin(skinId);
      this.saveToStorage();
    }
  }

  equipSkin(skinId) {
    this.saveData.selectedSkin = skinId;
    this.player.applySkin(skinId);
    this.saveToStorage();
  }

  loadSaveData() {
    const defaultData = {
      bestScore: 0,
      coins: 0,
      unlockedSkins: ['striker'],
      selectedSkin: 'striker',
      unlockedTrails: ['cyan'],
      selectedTrail: 'cyan',
      bestRunGhost: []
    };

    try {
      const saved = localStorage.getItem('RUN_AND_RUN_DATA');
      this.saveData = saved ? { ...defaultData, ...JSON.parse(saved) } : defaultData;
    } catch (e) {
      this.saveData = defaultData;
    }

    // Rotating 3 missions
    this.missions = [
      { id: 1, type: 'gravity', title: 'QUANTUM GRAVITY: Invert 5 Times', target: 5, progress: 0, reward: 150, claimed: false },
      { id: 2, type: 'coins', title: 'BIT HARVEST: Collect 120 Coins', target: 120, progress: 0, reward: 200, claimed: false },
      { id: 3, type: 'nearmiss', title: 'CYBER DRIFT: Perform 6 Near Misses', target: 6, progress: 0, reward: 250, claimed: false }
    ];
  }

  saveToStorage() {
    try {
      localStorage.setItem('RUN_AND_RUN_DATA', JSON.stringify(this.saveData));
    } catch (e) {}
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.composer) {
      this.composer.setSize(w, h);
    }
  }
}

// Bootstrap on DOM Load
window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new Game();
});
