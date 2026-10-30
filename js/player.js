// RUN AND RUN - Player Controller & 3D Character Models
// 3 Switchable Forms: Runner (Cyber Ninja), Drone (Aero-Glider), Orb (Quantum Gyro)
import * as THREE from 'three';
import { audio } from './audio.js';

export class Player {
  constructor(scene) {
    this.scene = scene;

    // Master container
    this.mesh = new THREE.Group();
    this.scene.add(this.mesh);

    // Lanes: -1 (Left, -2.8), 0 (Center, 0), 1 (Right, 2.8)
    this.laneWidth = 2.8;
    this.targetLane = 0;
    this.currentX = 0;

    // Vertical Physics
    this.floorY = 0;
    this.ceilingY = 7.5;
    this.y = 0;
    this.velocityY = 0;
    this.gravity = -34;
    this.jumpForce = 13.5;
    this.isGrounded = true;

    // Gravity Inversion (-1 for ceiling, 1 for floor)
    this.gravityDirection = 1; // 1 = normal (floor), -1 = inverted (ceiling)
    this.flipProgress = 0; // 0 to 1
    this.targetRotationZ = 0;

    // Forms: 'RUNNER', 'DRONE', 'ORB'
    this.form = 'RUNNER';
    this.formGroups = {};

    // Actions & States
    this.isSliding = false;
    this.slideTimer = 0;
    this.slideDuration = 0.75;
    this.isDead = false;
    this.invulnerableTimer = 0;
    this.runAnimTime = 0;

    // Zone physics modifiers
    this.gravityMultiplier = 1.0;
    this.magnetZoneActive = false;

    // Overclock (Bullet Time)
    this.isOverclock = false;
    this.energy = 50; // 0 to 100
    this.maxEnergy = 100;
    this.ghostTrailTimer = 0;
    this.ghostMeshes = [];

    // Customization
    this.currentSkin = 'striker';
    this.currentTrail = 'cyan';

    // Ghost Replay Data Recording
    this.history = [];
    this.recordTimer = 0;

    // Build the 3D models
    this.buildModels();
    this.setForm('RUNNER', false);
    this.buildTrailSystem();

    // Collision Bounding Box
    this.box = new THREE.Box3();
    this.size = new THREE.Vector3(1.2, 1.8, 1.2);
  }

  buildModels() {
    // 1. RUNNER MODEL (Cyber Ninja)
    const runnerGroup = new THREE.Group();

    // Materials
    this.matArmor = new THREE.MeshStandardMaterial({
      color: 0x12172b,
      metalness: 0.85,
      roughness: 0.25
    });
    this.matAccent = new THREE.MeshStandardMaterial({
      color: 0x00f3ff,
      emissive: 0x00f3ff,
      emissiveIntensity: 0.8,
      roughness: 0.1
    });
    this.matVisor = new THREE.MeshStandardMaterial({
      color: 0xff0055,
      emissive: 0xff0055,
      emissiveIntensity: 1.5,
      roughness: 0.0
    });
    this.matJoints = new THREE.MeshStandardMaterial({
      color: 0x080a14,
      metalness: 0.9,
      roughness: 0.4
    });

    // Torso / Chest Reactor
    const torsoGeom = new THREE.BoxGeometry(0.7, 0.8, 0.45);
    const torso = new THREE.Mesh(torsoGeom, this.matArmor);
    torso.position.y = 1.05;
    runnerGroup.add(torso);

    // Glowing Chest Reactor Core
    const coreGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12);
    coreGeom.rotateX(Math.PI / 2);
    const core = new THREE.Mesh(coreGeom, this.matAccent);
    core.position.set(0, 1.1, 0.23);
    runnerGroup.add(core);

    // Head & Cyber Helmet
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.65, 0);

    const helmetGeom = new THREE.BoxGeometry(0.48, 0.46, 0.48);
    const helmet = new THREE.Mesh(helmetGeom, this.matArmor);
    headGroup.add(helmet);

    // Glowing Cyber Visor
    const visorGeom = new THREE.BoxGeometry(0.44, 0.14, 0.2);
    const visor = new THREE.Mesh(visorGeom, this.matVisor);
    visor.position.set(0, 0.02, 0.22);
    headGroup.add(visor);
    runnerGroup.add(headGroup);
    this.runnerHead = headGroup;

    // Jet Thruster Fins on Back
    const finGeom = new THREE.BoxGeometry(0.08, 0.6, 0.2);
    const leftFin = new THREE.Mesh(finGeom, this.matAccent);
    leftFin.position.set(-0.25, 1.25, -0.26);
    leftFin.rotation.z = 0.2;
    const rightFin = new THREE.Mesh(finGeom, this.matAccent);
    rightFin.position.set(0.25, 1.25, -0.26);
    rightFin.rotation.z = -0.2;
    runnerGroup.add(leftFin, rightFin);

    // Left Arm Hierarchy
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.48, 1.35, 0);
    const armGeom = new THREE.BoxGeometry(0.22, 0.65, 0.22);
    const leftArmMesh = new THREE.Mesh(armGeom, this.matArmor);
    leftArmMesh.position.y = -0.3;
    this.leftArm.add(leftArmMesh);
    runnerGroup.add(this.leftArm);

    // Right Arm Hierarchy
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.48, 1.35, 0);
    const rightArmMesh = new THREE.Mesh(armGeom, this.matArmor);
    rightArmMesh.position.y = -0.3;
    this.rightArm.add(rightArmMesh);
    runnerGroup.add(this.rightArm);

    // Left Leg Hierarchy
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.22, 0.7, 0);
    const legGeom = new THREE.BoxGeometry(0.26, 0.75, 0.26);
    const leftLegMesh = new THREE.Mesh(legGeom, this.matArmor);
    leftLegMesh.position.y = -0.35;
    this.leftLeg.add(leftLegMesh);
    runnerGroup.add(this.leftLeg);

    // Right Leg Hierarchy
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.22, 0.7, 0);
    const rightLegMesh = new THREE.Mesh(legGeom, this.matArmor);
    rightLegMesh.position.y = -0.35;
    this.rightLeg.add(rightLegMesh);
    runnerGroup.add(this.rightLeg);

    this.formGroups['RUNNER'] = runnerGroup;
    this.mesh.add(runnerGroup);

    // 2. DRONE MODEL (Aero-Glider Hovercraft)
    const droneGroup = new THREE.Group();
    droneGroup.position.y = 0.9;

    // Sleek Central Fuselage
    const fuselageGeom = new THREE.ConeGeometry(0.45, 1.5, 5);
    fuselageGeom.rotateX(Math.PI / 2);
    const fuselage = new THREE.Mesh(fuselageGeom, this.matArmor);
    droneGroup.add(fuselage);

    // Swept delta wings
    const wingGeom = new THREE.BoxGeometry(2.1, 0.08, 0.55);
    const wings = new THREE.Mesh(wingGeom, this.matArmor);
    wings.position.set(0, 0.05, 0.1);
    droneGroup.add(wings);

    // Glowing Wingtip Beacons
    const beaconGeom = new THREE.BoxGeometry(0.12, 0.12, 0.4);
    const leftBeacon = new THREE.Mesh(beaconGeom, this.matAccent);
    leftBeacon.position.set(-1.05, 0.08, 0.1);
    const rightBeacon = new THREE.Mesh(beaconGeom, this.matAccent);
    rightBeacon.position.set(1.05, 0.08, 0.1);
    droneGroup.add(leftBeacon, rightBeacon);

    // Dual Ion Thruster Nozzles on Rear
    const thrusterGeom = new THREE.CylinderGeometry(0.16, 0.22, 0.45, 12);
    thrusterGeom.rotateX(Math.PI / 2);
    const leftThruster = new THREE.Mesh(thrusterGeom, this.matVisor);
    leftThruster.position.set(-0.35, 0.0, -0.7);
    const rightThruster = new THREE.Mesh(thrusterGeom, this.matVisor);
    rightThruster.position.set(0.35, 0.0, -0.7);
    droneGroup.add(leftThruster, rightThruster);

    this.droneGroup = droneGroup;
    this.formGroups['DRONE'] = droneGroup;
    this.mesh.add(droneGroup);

    // 3. ORB MODEL (Quantum Gyro-Sphere)
    const orbGroup = new THREE.Group();
    orbGroup.position.y = 0.65;

    // Glowing Quantum Singularity Core
    const coreSphereGeom = new THREE.SphereGeometry(0.38, 24, 24);
    this.matOrbCore = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 1.8,
      roughness: 0.1
    });
    const orbCore = new THREE.Mesh(coreSphereGeom, this.matOrbCore);
    orbGroup.add(orbCore);

    // Outer Gyro Ring 1
    const ring1Geom = new THREE.TorusGeometry(0.55, 0.05, 8, 28);
    this.ring1 = new THREE.Mesh(ring1Geom, this.matAccent);
    orbGroup.add(this.ring1);

    // Outer Gyro Ring 2
    const ring2Geom = new THREE.TorusGeometry(0.68, 0.05, 8, 28);
    this.ring2 = new THREE.Mesh(ring2Geom, this.matArmor);
    orbGroup.add(this.ring2);

    this.orbGroup = orbGroup;
    this.formGroups['ORB'] = orbGroup;
    this.mesh.add(orbGroup);
  }

  buildTrailSystem() {
    this.trailParticles = [];
    this.trailGroup = new THREE.Group();
    this.scene.add(this.trailGroup);

    const pGeom = new THREE.PlaneGeometry(0.3, 0.3);
    for (let i = 0; i < 28; i++) {
      const pMat = new THREE.MeshBasicMaterial({
        color: 0x00f3ff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(pGeom, pMat);
      mesh.visible = false;
      this.trailGroup.add(mesh);
      this.trailParticles.push({
        mesh,
        life: 0,
        maxLife: 0.4
      });
    }
  }

  setForm(newForm, playSound = true) {
    if (this.form === newForm && playSound) return;
    this.form = newForm;

    Object.keys(this.formGroups).forEach(f => {
      this.formGroups[f].visible = (f === newForm);
    });

    if (playSound) {
      audio.playFormShift(newForm);
      this.spawnShiftPulse();
    }
  }

  cycleForm() {
    if (this.isDead) return;
    const forms = ['RUNNER', 'DRONE', 'ORB'];
    const nextIdx = (forms.indexOf(this.form) + 1) % forms.length;
    this.setForm(forms[nextIdx]);
  }

  spawnShiftPulse() {
    // Quick scale pop on transformation
    this.mesh.scale.set(1.3, 1.3, 1.3);
  }

  // LANE NAVIGATION
  moveLeft() {
    if (this.isDead) return;
    if (this.targetLane > -1) {
      this.targetLane -= 1;
      audio.playLaneSwitch();
    }
  }

  moveRight() {
    if (this.isDead) return;
    if (this.targetLane < 1) {
      this.targetLane += 1;
      audio.playLaneSwitch();
    }
  }

  jump() {
    if (this.isDead) return;
    if (this.isGrounded) {
      // Invert jump velocity direction if on ceiling
      this.velocityY = this.jumpForce * this.gravityDirection;
      this.isGrounded = false;
      this.isSliding = false; // Cancel slide with jump
      audio.playJump();
    }
  }

  slide() {
    if (this.isDead) return;
    if (this.isGrounded && !this.isSliding) {
      this.isSliding = true;
      this.slideTimer = this.slideDuration;
      audio.playSlide();
    } else if (!this.isGrounded) {
      // Quick drop (slam down / up to surface)
      this.velocityY = -22 * this.gravityDirection;
    }
  }

  // GRAVITY FLIP FEATURE
  flipGravity() {
    if (this.isDead) return;
    this.gravityDirection *= -1; // Toggle 1 and -1
    this.isGrounded = false;
    audio.playGravityFlip();

    // Target rotation: 0 radians for normal, PI for ceiling
    this.targetRotationZ = this.gravityDirection === 1 ? 0 : Math.PI;

    // Small impulse push towards new target surface
    this.velocityY = 6 * this.gravityDirection;
  }

  // NEURAL OVERCLOCK (BULLET-TIME)
  toggleOverclock(state) {
    if (this.isDead) {
      this.isOverclock = false;
      audio.setBulletTime(false);
      return;
    }
    if (state && this.energy > 15) {
      this.isOverclock = true;
      audio.setBulletTime(true);
    } else {
      this.isOverclock = false;
      audio.setBulletTime(false);
    }
  }

  addEnergy(amount) {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
  }

  // SKIN & THEME CUSTOMIZATION
  applySkin(skinId) {
    this.currentSkin = skinId;
    const colors = {
      striker: { armor: 0x12172b, accent: 0x00f3ff, visor: 0xff0055 },
      samurai: { armor: 0x220510, accent: 0xff0044, visor: 0xffe600 },
      vapor: { armor: 0x0e1c2e, accent: 0xff00aa, visor: 0x00ffff },
      quantum: { armor: 0x052014, accent: 0x00ff88, visor: 0x00f3ff },
      valkyrie: { armor: 0x201a08, accent: 0xffd700, visor: 0xffffff }
    };
    const c = colors[skinId] || colors.striker;

    this.matArmor.color.setHex(c.armor);
    this.matAccent.color.setHex(c.accent);
    this.matAccent.emissive.setHex(c.accent);
    this.matVisor.color.setHex(c.visor);
    this.matVisor.emissive.setHex(c.visor);
    this.matOrbCore.color.setHex(c.accent);
    this.matOrbCore.emissive.setHex(c.accent);
  }

  applyTrail(trailId) {
    this.currentTrail = trailId;
    const trailColors = {
      cyan: 0x00f3ff,
      magenta: 0xff00aa,
      gold: 0xffd700,
      emerald: 0x00ff66,
      rainbow: 0xff0055
    };
    const col = trailColors[trailId] || 0x00f3ff;
    this.trailParticles.forEach(p => {
      p.mesh.material.color.setHex(col);
    });
  }

  update(delta, gameSpeed) {
    if (this.isDead) return;

    // Decay scale bounce from morphing
    this.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 8);

    // 1. Horizontal Lane Lerp
    const targetX = this.targetLane * this.laneWidth;
    this.currentX = THREE.MathUtils.lerp(this.currentX, targetX, delta * 15);
    this.mesh.position.x = this.currentX;

    // Lane tilt banking
    const xDiff = targetX - this.currentX;
    this.mesh.rotation.z = THREE.MathUtils.lerp(
      this.mesh.rotation.z,
      this.targetRotationZ - xDiff * 0.12,
      delta * 12
    );

    // 2. Vertical Physics & Gravity
    const effectiveGravity = this.gravity * this.gravityMultiplier * this.gravityDirection;
    this.velocityY += effectiveGravity * delta;
    this.y += this.velocityY * delta;

    // Floor and Ceiling Collision Bounds
    if (this.gravityDirection === 1) {
      // Normal gravity: bounds at floorY
      if (this.y <= this.floorY) {
        this.y = this.floorY;
        this.velocityY = 0;
        this.isGrounded = true;
      } else {
        this.isGrounded = false;
      }
    } else {
      // Inverted gravity: bounds at ceilingY
      if (this.y >= this.ceilingY) {
        this.y = this.ceilingY;
        this.velocityY = 0;
        this.isGrounded = true;
      } else {
        this.isGrounded = false;
      }
    }
    this.mesh.position.y = this.y;

    // 3. Sliding Timer & Mechanics
    if (this.isSliding) {
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // 4. Overclock (Bullet Time) Energy Drain
    if (this.isOverclock) {
      this.energy -= delta * 22; // Lasts ~4.5 seconds if full
      if (this.energy <= 0) {
        this.energy = 0;
        this.toggleOverclock(false);
      }
    } else {
      // Passive slow recharge
      this.energy = Math.min(this.maxEnergy, this.energy + delta * 3.5);
    }

    // 5. Invulnerability Blink
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= delta;
      this.mesh.visible = Math.floor(Date.now() / 80) % 2 === 0;
    } else {
      this.mesh.visible = true;
    }

    // 6. Form Specific Animations
    this.runAnimTime += delta * (gameSpeed / 12) * 10;
    this.animateForms(delta);

    // 7. Particle Trail & Ghosting
    this.updateTrails(delta);

    // 8. Update Bounding Box for Collisions
    this.updateBoundingBox();

    // 9. Record Replay History
    this.recordTimer += delta;
    if (this.recordTimer >= 0.08) {
      this.recordTimer = 0;
      this.history.push({
        x: this.mesh.position.x,
        y: this.mesh.position.y,
        z: this.mesh.position.z,
        rotZ: this.mesh.rotation.z,
        form: this.form,
        isSliding: this.isSliding
      });
      // Cap at 15000 frames (~20 mins of running)
      if (this.history.length > 15000) this.history.shift();
    }
  }

  animateForms(delta) {
    if (this.form === 'RUNNER') {
      if (this.isSliding) {
        // Slide pose: low stance, arms forward, torso rotated
        this.formGroups['RUNNER'].position.y = -0.45;
        this.formGroups['RUNNER'].rotation.x = 0.85 * this.gravityDirection;
        this.leftLeg.rotation.x = -1.2;
        this.rightLeg.rotation.x = -0.3;
        this.leftArm.rotation.x = 1.0;
        this.rightArm.rotation.x = 1.0;
      } else if (!this.isGrounded) {
        // Jump pose: tuck knees, arms swept back
        this.formGroups['RUNNER'].position.y = 0;
        this.formGroups['RUNNER'].rotation.x = 0.25 * this.gravityDirection;
        this.leftLeg.rotation.x = -0.8;
        this.rightLeg.rotation.x = -0.7;
        this.leftArm.rotation.x = -0.8;
        this.rightArm.rotation.x = -0.8;
      } else {
        // Running cycle
        this.formGroups['RUNNER'].position.y = 0;
        this.formGroups['RUNNER'].rotation.x = 0.15 * this.gravityDirection;
        const swing = Math.sin(this.runAnimTime);
        this.leftLeg.rotation.x = swing * 0.9;
        this.rightLeg.rotation.x = -swing * 0.9;
        this.leftArm.rotation.x = -swing * 0.7;
        this.rightArm.rotation.x = swing * 0.7;
        this.runnerHead.rotation.y = Math.sin(this.runAnimTime * 0.5) * 0.1;
      }
    } else if (this.form === 'DRONE') {
      // Hover bobbing
      const hover = Math.sin(this.runAnimTime * 1.5) * 0.08;
      this.droneGroup.position.y = 0.9 + hover;
      // Slight pitch forward
      this.droneGroup.rotation.x = 0.18 * this.gravityDirection;
    } else if (this.form === 'ORB') {
      // Rapid gyro spinning
      this.ring1.rotation.x += delta * 10;
      this.ring1.rotation.y += delta * 6;
      this.ring2.rotation.y += delta * 9;
      this.ring2.rotation.z += delta * 7;
      // Core rolling forward along track
      this.orbGroup.rotation.x -= delta * 18 * this.gravityDirection;
    }
  }

  updateTrails(delta) {
    // Spawn new trail particle
    let p = this.trailParticles.find(part => part.life <= 0);
    if (p) {
      p.life = p.maxLife;
      p.mesh.position.copy(this.mesh.position);
      p.mesh.position.z += 0.4;
      p.mesh.position.y += this.gravityDirection === 1 ? 0.6 : 6.9;
      p.mesh.visible = true;
      p.mesh.material.opacity = this.isOverclock ? 0.85 : 0.45;
      p.mesh.scale.setScalar(this.isOverclock ? 1.4 : 0.9);
    }

    // Update active particles
    this.trailParticles.forEach(part => {
      if (part.life > 0) {
        part.life -= delta;
        const ratio = part.life / part.maxLife;
        part.mesh.material.opacity = ratio * (this.isOverclock ? 0.8 : 0.4);
        part.mesh.scale.multiplyScalar(0.97);
        if (part.life <= 0) {
          part.mesh.visible = false;
        }
      }
    });
  }

  updateBoundingBox() {
    let height = 1.8;
    let width = 1.0;
    let depth = 1.0;
    let centerY = this.mesh.position.y + 0.9;

    if (this.gravityDirection === -1) {
      centerY = this.mesh.position.y - 0.9;
    }

    if (this.form === 'DRONE') {
      width = 1.8;
      height = 0.8;
      centerY = this.mesh.position.y + (this.gravityDirection === 1 ? 0.9 : -0.9);
    } else if (this.form === 'ORB') {
      width = 0.8;
      height = 0.8;
      centerY = this.mesh.position.y + (this.gravityDirection === 1 ? 0.5 : -0.5);
    } else if (this.isSliding) {
      height = 0.75;
      centerY = this.mesh.position.y + (this.gravityDirection === 1 ? 0.4 : -0.4);
    }

    this.box.min.set(
      this.mesh.position.x - width / 2,
      centerY - height / 2,
      this.mesh.position.z - depth / 2
    );
    this.box.max.set(
      this.mesh.position.x + width / 2,
      centerY + height / 2,
      this.mesh.position.z + depth / 2
    );
  }

  reset() {
    this.targetLane = 0;
    this.currentX = 0;
    this.mesh.position.set(0, 0, 0);
    this.mesh.rotation.set(0, 0, 0);
    this.y = 0;
    this.velocityY = 0;
    this.gravityDirection = 1;
    this.targetRotationZ = 0;
    this.isGrounded = true;
    this.isSliding = false;
    this.slideTimer = 0;
    this.isDead = false;
    this.invulnerableTimer = 0;
    this.energy = 50;
    this.isOverclock = false;
    this.gravityMultiplier = 1.0;
    this.setForm('RUNNER', false);
    this.history = [];
    audio.setBulletTime(false);
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.scene.remove(this.trailGroup);
  }
}
