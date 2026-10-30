// RUN AND RUN: NETAJI IN EUROPE - Master Game Engine
// Integrates Three.js, Netaji Player, European Street World, Chasing Public Crowd, Laddoos & Daily Challenge
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
    this.coinsRun = 0; // Laddoos collected
    this.combo = 1;
    this.comboTimer = 0;
    this.nearMisses = 0;
    this.gameSpeed = 26;
    this.targetSpeed = 26;

    // The Chasing Public Crowd (Voters & Journalists chasing Netaji!)
    this.crowdDistance = 38;
    this.crowdMaxDist = 45;
    this.crowdGroup = null;

    // European Zones
    this.currentZone = 'PARIS';
    this.zoneDistance = 0;

    // AI Director
    this.aiStressLevel = 0.5;
    this.nextSpawnZ = -30;

    // Ghost Replay
    this.ghostGroup = null;
    this.ghostHistory = [];
    this.ghostFrameIndex = 0;

    this.useBloom = true;
    this.clock = new THREE.Clock();

    this.loadSaveData();
    this.initThree();

    this.world = new World(this.scene, this.camera);
    this.player = new Player(this.scene);
    this.obstacles = new ObstacleManager(this.scene);
    this.powerups = new PowerupManager(this.scene);
    this.ui = new UIManager(this);

    this.player.applySkin(this.saveData.selectedSkin);
    this.player.applyTrail(this.saveData.selectedTrail);

    // Build the Chasing Public Crowd (Citizens & Media chasing Netaji)
    this.buildChasingPublicCrowd();

    // Build Ghost Clone
    this.buildGhostClone();

    this.setupInput();

    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('blur', () => {
      if (this.isRunning && !this.isPaused) this.togglePause();
    });

    this.ui.showMainMenu();

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
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    try {
      this.composer = new EffectComposer(this.renderer);
      const renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);

      // Subtle warm sunlit bloom
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.75, // Soft glow
        0.3,
        0.88
      );
      this.composer.addPass(this.bloomPass);
    } catch (e) {
      this.useBloom = false;
    }
  }

  setBloom(enabled) {
    this.useBloom = enabled;
  }

  // BUILD THE 3D CARTOON PUBLIC CROWD CHASING NETAJI!
  buildChasingPublicCrowd() {
    this.crowdGroup = new THREE.Group();
    this.crowdMembers = [];

    // Materials for the crowd
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xdfa067, roughness: 0.6 });
    const clothesColors = [0x1e88e5, 0xe53935, 0x43a047, 0xfb8c00, 0x8e24aa, 0x00acc1];

    // Create 6 cartoon citizens running in a pack
    const offsets = [
      { x: -1.8, z: 0 },
      { x: 0.0, z: -0.8 },
      { x: 1.8, z: 0.2 },
      { x: -0.9, z: 1.2 },
      { x: 0.9, z: 1.0 },
      { x: 0.0, z: 2.2 }
    ];

    offsets.forEach((off, idx) => {
      const member = new THREE.Group();
      member.position.set(off.x, 0, off.z);

      const clothMat = new THREE.MeshStandardMaterial({ color: clothesColors[idx % clothesColors.length], roughness: 0.7 });

      // Torso
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.75, 8), clothMat);
      body.position.y = 0.9;
      member.add(body);

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), skinMat);
      head.position.y = 1.45;
      member.add(head);

      // Legs
      const legGeom = new THREE.CylinderGeometry(0.09, 0.08, 0.65, 8);
      const lLeg = new THREE.Mesh(legGeom, clothMat);
      lLeg.position.set(-0.16, 0.35, 0);
      const rLeg = new THREE.Mesh(legGeom, clothMat);
      rLeg.position.set(0.16, 0.35, 0);
      member.add(lLeg, rLeg);

      // Arms
      const armGeom = new THREE.CylinderGeometry(0.08, 0.07, 0.6, 8);
      const lArm = new THREE.Mesh(armGeom, clothMat);
      lArm.position.set(-0.38, 0.95, 0);
      const rArm = new THREE.Mesh(armGeom, clothMat);
      rArm.position.set(0.38, 0.95, 0);
      member.add(lArm, rArm);

      // Distinct crowd props:
      if (idx === 0) {
        // Supporter holding a big Campaign Placard ("VOTE!")
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 8), skinMat);
        pole.position.set(0.35, 1.6, 0.2);
        const sign = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.05), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        sign.position.set(0.35, 2.3, 0.2);
        member.add(pole, sign);
      } else if (idx === 1) {
        // TV Reporter with long microphone boom
        const micPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 8), new THREE.MeshBasicMaterial({ color: 0x222222 }));
        micPole.rotateX(Math.PI / 4);
        micPole.position.set(0, 1.3, -0.6);
        const micHead = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0xd32f2f }));
        micHead.position.set(0, 1.8, -1.1);
        member.add(micPole, micHead);
      } else if (idx === 2) {
        // Supporter with a big floral marigold garland!
        const garland = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.12, 8, 16), new THREE.MeshBasicMaterial({ color: 0xffa000 }));
        garland.position.set(0, 1.2, -0.3);
        member.add(garland);
      }

      this.crowdGroup.add(member);
      this.crowdMembers.push({
        group: member,
        lLeg, rLeg, lArm, rArm,
        animOffset: idx * 0.7
      });
    });

    this.crowdGroup.position.set(0, 0, 38);
    this.scene.add(this.crowdGroup);
  }

  buildGhostClone() {
    this.ghostGroup = new THREE.Group();
    const geom = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffb74d,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.y = 0.9;
    this.ghostGroup.add(mesh);
    this.ghostGroup.visible = false;
    this.scene.add(this.ghostGroup);
  }

  setupInput() {
    window.addEventListener('keydown', (e) => {
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
    this.crowdDistance = 38;
    this.nextSpawnZ = -30;
    this.currentZone = 'PARIS';
    this.zoneDistance = 0;
    this.ghostFrameIndex = 0;

    this.player.reset();
    this.world.reset();
    this.obstacles.reset();
    this.powerups.reset();

    if (isDaily) {
      const today = new Date();
      const seedStr = `${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}`;
      this.rng = new SeededRNG(parseInt(seedStr, 10));
      this.ui.spawnPopup('DAILY CAMPAIGN SEED ACTIVE', 'hype');
    } else {
      this.rng = { next: () => Math.random() };
    }

    this.ghostHistory = this.saveData.bestRunGhost || [];
    this.ghostGroup.visible = this.ghostHistory.length > 0;

    this.ui.showHUD();
    audio.startMusic();
    audio.setHunterAlert(false);

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

  spawnTrackChunk() {
    const spacing = Math.max(16, 32 - (this.gameSpeed - 26) * 0.35 + (1 - this.aiStressLevel) * 8);
    const z = this.nextSpawnZ;
    this.nextSpawnZ -= spacing;

    const r = this.rng.next();
    const isCeiling = this.player.gravityDirection === -1;

    // 1. Collectibles / Powerups
    if (r < 0.14) {
      const lane = Math.floor(this.rng.next() * 3) - 1;
      this.powerups.spawnItem('GRAVITY_PAD', lane, z, isCeiling);
    } else if (r < 0.38) {
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
        // Line of Golden Laddoos
        for (let c = 0; c < 4; c++) {
          this.powerups.spawnItem('COIN', lane, z - c * 2.8, isCeiling);
        }
      }
    }

    // 2. Obstacles
    const obsTypes = ['HIGH_BARRIER', 'LOW_BARRIER', 'OVERHEAD_GANTRY'];
    if (this.gameSpeed > 30) obsTypes.push('MOVING_SWEEPER');

    const chosenType = obsTypes[Math.floor(this.rng.next() * obsTypes.length)];
    const primaryLane = Math.floor(this.rng.next() * 3) - 1;
    this.obstacles.spawnObstacle(chosenType, primaryLane, z, isCeiling);

    if (this.aiStressLevel > 0.75 && this.rng.next() > 0.5) {
      const secondLane = primaryLane === 0 ? (this.rng.next() > 0.5 ? 1 : -1) : 0;
      const secondType = chosenType === 'HIGH_BARRIER' ? 'LOW_BARRIER' : 'OVERHEAD_GANTRY';
      this.obstacles.spawnObstacle(secondType, secondLane, z, isCeiling);
    }
  }

  updateZones(delta) {
    this.zoneDistance += this.gameSpeed * delta;

    if (this.zoneDistance > 1000) {
      this.zoneDistance = 0;
      const zones = ['PARIS', 'AMSTERDAM', 'FLORENCE'];
      const nextIdx = (zones.indexOf(this.currentZone) + 1) % zones.length;
      this.currentZone = zones[nextIdx];

      if (this.currentZone === 'AMSTERDAM') {
        this.ui.showZoneBanner('AMSTERDAM CANAL ROW', 'Laddoo magnet pulse activated!');
        this.world.setTheme('amsterdam');
      } else if (this.currentZone === 'FLORENCE') {
        this.ui.showZoneBanner('TUSCAN PIAZZA SUN', 'Warm breezy rooftop run!');
        this.world.setTheme('florence');
      } else {
        this.ui.showZoneBanner('PARISIAN BOULEVARD', 'Grand European capital campaign!');
        this.world.setTheme('paris');
      }
    }
  }

  onNearMiss(obstacle) {
    audio.playNearMiss();
    this.nearMisses++;
    this.combo = Math.min(10, this.combo + 1);
    this.comboTimer = 3.5;

    const bonus = 150 * this.combo;
    this.score += bonus;
    this.player.addEnergy(8);

    this.ui.spawnPopup(`CLEAN DODGE x${this.combo}! +${bonus}`, 'hype');
    this.world.triggerCameraShake(0.18);
    this.aiStressLevel = Math.min(1.0, this.aiStressLevel + 0.1);
    this.trackMission('nearmiss', 1);
  }

  handleHit(obstacle) {
    if (this.powerups.isJetpacking()) {
      audio.playImpact();
      this.world.triggerCameraShake(0.4);
      this.score += 500;
      this.ui.spawnPopup('SMASHED! +500', 'hype');
      obstacle.active = false;
      return;
    }

    if (this.powerups.hasShield()) {
      this.powerups.breakShield();
      this.player.invulnerableTimer = 1.8;
      this.world.triggerCameraShake(0.5);
      this.ui.spawnPopup('Z-PLUS SECURITY DEFLECTED HIT!', 'warn');
      return;
    }

    // Two-hit Chasing Public crowd mechanic:
    if (this.crowdDistance > 14) {
      audio.playImpact();
      this.crowdDistance = 7; // The crowd swarms right behind Netaji!
      this.player.invulnerableTimer = 2.2;
      this.combo = 1;
      this.world.triggerCameraShake(0.65);
      this.ui.spawnPopup('THE CROWD IS CLOSING IN! RUN NETAJI!', 'warn');
      audio.setHunterAlert(true);
      this.aiStressLevel = 0.25;
      return;
    }

    // Caught by the crowd!
    this.gameOver();
  }

  gameOver() {
    this.isRunning = false;
    this.player.isDead = true;
    audio.playGameOver();
    audio.stopMusic();
    audio.setHunterAlert(false);
    this.world.triggerCameraShake(0.85);

    this.saveData.coins += this.coinsRun;
    if (this.score > this.saveData.bestScore) {
      this.saveData.bestScore = Math.floor(this.score);
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

    this.ui.showGameOver({
      score: this.score,
      distance: this.distance,
      coinsRun: this.coinsRun,
      nearMisses: this.nearMisses,
      isDaily: this.isDailyMode
    });
  }

  animate() {
    requestAnimationFrame(this.animate);
    const delta = Math.min(0.08, this.clock.getDelta());

    if (this.isRunning && !this.isPaused) {
      const timeScale = this.player.isOverclock ? 0.35 : 1.0;
      const simDelta = delta * timeScale;

      this.distance += this.gameSpeed * simDelta;
      this.targetSpeed = 26 + Math.min(22, this.distance * 0.005);
      if (this.powerups.isJetpacking()) {
        this.gameSpeed = THREE.MathUtils.lerp(this.gameSpeed, 55, delta * 8);
      } else {
        this.gameSpeed = THREE.MathUtils.lerp(this.gameSpeed, this.targetSpeed, delta * 2);
      }
      audio.setGameSpeed(this.gameSpeed / 26);

      const mult = this.powerups.activeEffects.multiplierTimer > 0 ? 2 : 1;
      this.score += this.gameSpeed * simDelta * this.combo * mult * 0.6;

      if (this.combo > 1) {
        this.comboTimer -= simDelta;
        if (this.comboTimer <= 0) this.combo = 1;
      }

      this.player.mesh.position.z -= this.gameSpeed * simDelta;
      this.player.update(this.player.isOverclock ? delta * 0.9 : simDelta, this.gameSpeed);

      if (this.player.mesh.position.z - 140 < this.nextSpawnZ) {
        this.spawnTrackChunk();
      }

      this.obstacles.update(simDelta, this.player, (obs) => this.onNearMiss(obs));
      const collidedObs = this.obstacles.checkCollision(this.player);
      if (collidedObs) this.handleHit(collidedObs);

      this.powerups.update(simDelta, this.player, (type, count) => {
        if (type === 'COIN') {
          this.coinsRun += count;
          this.score += 50 * mult;
          this.trackMission('coins', count);
        } else if (type === 'GRAVITY_PAD') {
          this.trackMission('gravity', 1);
        }
      });

      // Update Chasing Public Crowd
      this.updateChasingPublicCrowd(simDelta);

      this.updateGhost();
      this.updateZones(simDelta);
      this.world.update(simDelta, this.player, this.gameSpeed);

      this.ui.updateHUD({
        score: this.score,
        distance: this.distance,
        coinsRun: this.coinsRun,
        combo: this.combo
      }, this.player, this.powerups, this.crowdDistance);
    }

    if (this.useBloom && this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  updateChasingPublicCrowd(delta) {
    if (this.powerups.isJetpacking() || this.player.isOverclock) {
      this.crowdDistance = Math.min(this.crowdMaxDist, this.crowdDistance + delta * 8);
    } else {
      this.crowdDistance = Math.min(this.crowdMaxDist, this.crowdDistance + delta * 2.2);
    }

    if (this.crowdDistance > 18) {
      audio.setHunterAlert(false);
    }

    const pPos = this.player.mesh.position;
    this.crowdGroup.position.x = THREE.MathUtils.lerp(this.crowdGroup.position.x, pPos.x, delta * 6);
    this.crowdGroup.position.y = THREE.MathUtils.lerp(this.crowdGroup.position.y, pPos.y, delta * 6);
    this.crowdGroup.position.z = pPos.z + this.crowdDistance;

    // Animate crowd running legs & arms!
    const animTime = Date.now() * 0.012;
    this.crowdMembers.forEach(m => {
      const swing = Math.sin(animTime + m.animOffset);
      m.lLeg.rotation.x = swing * 0.9;
      m.rLeg.rotation.x = -swing * 0.9;
      m.lArm.rotation.x = -swing * 0.8;
      m.rArm.rotation.x = swing * 0.8;
    });
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
      unlockedSkins: ['classic'],
      selectedSkin: 'classic',
      unlockedTrails: ['golden'],
      selectedTrail: 'golden',
      bestRunGhost: []
    };

    try {
      const saved = localStorage.getItem('RUN_AND_RUN_DATA');
      this.saveData = saved ? { ...defaultData, ...JSON.parse(saved) } : defaultData;
    } catch (e) {
      this.saveData = defaultData;
    }

    this.missions = [
      { id: 1, type: 'gravity', title: 'ROOFTOP DASH: Policy Flip 5 Times', target: 5, progress: 0, reward: 150, claimed: false },
      { id: 2, type: 'coins', title: 'LADDOO RUSH: Collect 120 Laddoos', target: 120, progress: 0, reward: 200, claimed: false },
      { id: 3, type: 'nearmiss', title: 'POLITICAL DRIFT: 6 Near Misses', target: 6, progress: 0, reward: 250, claimed: false }
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
    if (this.composer) this.composer.setSize(w, h);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new Game();
});
