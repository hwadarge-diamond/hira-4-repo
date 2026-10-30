// RUN AND RUN: NETAJI IN EUROPE - Cartoon Indian Politician Player Character
// Netaji in White Kurta-Pyjama, Gandhi Topi, Nehru Waistcoat, Angavastram Scarf
import * as THREE from 'three';
import { audio } from './audio.js';

export class Player {
  constructor(scene) {
    this.scene = scene;

    this.mesh = new THREE.Group();
    this.scene.add(this.mesh);

    // 3 European cobblestone lanes: -2.8, 0, 2.8
    this.laneWidth = 2.8;
    this.targetLane = 0;
    this.currentX = 0;

    // Vertical Physics
    this.floorY = 0;
    this.ceilingY = 7.5;
    this.y = 0;
    this.velocityY = 0;
    this.gravity = -34;
    this.jumpForce = 13.8;
    this.isGrounded = true;

    // Gravity Inversion (Rooftop running / gravity flip)
    this.gravityDirection = 1;
    this.targetRotationZ = 0;

    // Forms: 'RUNNER' (Netaji Sprint), 'DRONE' (Vintage Vespa), 'ORB' (Roly-Poly Netaji)
    this.form = 'RUNNER';
    this.formGroups = {};

    // State & Timers
    this.isSliding = false;
    this.slideTimer = 0;
    this.slideDuration = 0.75;
    this.isDead = false;
    this.invulnerableTimer = 0;
    this.runAnimTime = 0;

    // Zone physics modifiers
    this.gravityMultiplier = 1.0;

    // Chai Energy / Stamina Overclock
    this.isOverclock = false;
    this.energy = 60;
    this.maxEnergy = 100;

    // Customization & Waistcoat / Topi colors
    this.currentSkin = 'classic';
    this.currentTrail = 'golden';

    // Ghost Replay Data
    this.history = [];
    this.recordTimer = 0;

    // Build the 3D Netaji Models
    this.buildNetajiModels();
    this.setForm('RUNNER', false);
    this.buildTrailSystem();

    // Bounding Box
    this.box = new THREE.Box3();
  }

  buildNetajiModels() {
    // Shared Cartoon Materials
    this.matSkin = new THREE.MeshStandardMaterial({
      color: 0xdfa067,
      roughness: 0.6,
      metalness: 0.05
    });

    this.matKurta = new THREE.MeshStandardMaterial({
      color: 0xfaf9f5, // Pristine Khadi White
      roughness: 0.8,
      metalness: 0.02
    });

    this.matTopi = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.75
    });

    this.matVest = new THREE.MeshStandardMaterial({
      color: 0xe65100, // Saffron Orange Modi / Nehru Jacket
      roughness: 0.65,
      metalness: 0.1
    });

    this.matScarf = new THREE.MeshStandardMaterial({
      color: 0x2e7d32, // Emerald Green Gamcha / Angavastram
      roughness: 0.7
    });

    this.matHair = new THREE.MeshStandardMaterial({
      color: 0x332211,
      roughness: 0.9
    });

    this.matShoes = new THREE.MeshStandardMaterial({
      color: 0x4e2710,
      roughness: 0.5
    });

    // 1. RUNNER FORM (Netaji On Foot Sprint)
    const runnerGroup = new THREE.Group();

    // Belly & Torso (Slightly chubby cartoon politician silhouette)
    const torsoGeom = new THREE.CylinderGeometry(0.42, 0.48, 0.85, 14);
    const torso = new THREE.Mesh(torsoGeom, this.matKurta);
    torso.position.y = 1.05;
    runnerGroup.add(torso);

    // Nehru Jacket / Vest overlay
    const vestGeom = new THREE.CylinderGeometry(0.45, 0.51, 0.65, 14, 1, false, 0, Math.PI * 1.85);
    vestGeom.rotateY(-Math.PI * 0.92);
    this.vestMesh = new THREE.Mesh(vestGeom, this.matVest);
    this.vestMesh.position.y = 1.1;
    runnerGroup.add(this.vestMesh);

    // Flowing Kurta Skirt / Tunic base
    const skirtGeom = new THREE.ConeGeometry(0.56, 0.5, 12, 1, true);
    const skirt = new THREE.Mesh(skirtGeom, this.matKurta);
    skirt.position.y = 0.68;
    runnerGroup.add(skirt);
    this.kurtaSkirt = skirt;

    // Angavastram / Scarf draped over shoulder
    const scarfGeom = new THREE.BoxGeometry(0.18, 0.9, 0.08);
    const scarf = new THREE.Mesh(scarfGeom, this.matScarf);
    scarf.position.set(-0.35, 1.05, 0.12);
    scarf.rotation.z = -0.15;
    runnerGroup.add(scarf);
    this.scarfMesh = scarf;

    // Head Hierarchy
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.72, 0);

    // Round Cartoon Head
    const headGeom = new THREE.SphereGeometry(0.38, 20, 20);
    const head = new THREE.Mesh(headGeom, this.matSkin);
    headGroup.add(head);

    // Classic Politician Mustache
    const stacheGeom = new THREE.CylinderGeometry(0.04, 0.08, 0.34, 8);
    stacheGeom.rotateZ(Math.PI / 2);
    const stache = new THREE.Mesh(stacheGeom, this.matHair);
    stache.position.set(0, -0.06, 0.35);
    headGroup.add(stache);

    // Cartoon Eyes
    const eyeGeom = new THREE.SphereGeometry(0.07, 10, 10);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    [-0.14, 0.14].forEach(x => {
      const eyeWhite = new THREE.Mesh(eyeGeom, eyeWhiteMat);
      eyeWhite.position.set(x, 0.08, 0.32);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), pupilMat);
      pupil.position.set(x, 0.08, 0.37);
      headGroup.add(eyeWhite, pupil);
    });

    // Gandhi Topi (Traditional Politician Boat Cap)
    const topiGroup = new THREE.Group();
    topiGroup.position.set(0, 0.32, 0);
    const topiGeom = new THREE.ConeGeometry(0.36, 0.28, 4);
    topiGeom.rotateY(Math.PI / 4);
    topiGeom.scale(1.1, 0.8, 1.6);
    const topi = new THREE.Mesh(topiGeom, this.matTopi);
    topiGroup.add(topi);
    headGroup.add(topiGroup);
    this.topiGroup = topiGroup;

    runnerGroup.add(headGroup);
    this.runnerHead = headGroup;

    // Left Arm (Swinging / Waving to the public)
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.52, 1.35, 0);
    const armGeom = new THREE.CylinderGeometry(0.11, 0.1, 0.65, 8);
    const leftArmMesh = new THREE.Mesh(armGeom, this.matKurta);
    leftArmMesh.position.y = -0.3;
    // Hand
    const handGeom = new THREE.SphereGeometry(0.12, 8, 8);
    const leftHand = new THREE.Mesh(handGeom, this.matSkin);
    leftHand.position.y = -0.62;
    this.leftArm.add(leftArmMesh, leftHand);
    runnerGroup.add(this.leftArm);

    // Right Arm (Namaste greeting / campaign wave)
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.52, 1.35, 0);
    const rightArmMesh = new THREE.Mesh(armGeom, this.matKurta);
    rightArmMesh.position.y = -0.3;
    const rightHand = new THREE.Mesh(handGeom, this.matSkin);
    rightHand.position.y = -0.62;
    this.rightArm.add(rightArmMesh, rightHand);
    runnerGroup.add(this.rightArm);

    // Legs with white Pyjama & traditional Mojari shoes
    const legGeom = new THREE.CylinderGeometry(0.14, 0.12, 0.75, 8);
    const shoeGeom = new THREE.BoxGeometry(0.2, 0.14, 0.34);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.24, 0.68, 0);
    const leftLegMesh = new THREE.Mesh(legGeom, this.matKurta);
    leftLegMesh.position.y = -0.35;
    const leftShoe = new THREE.Mesh(shoeGeom, this.matShoes);
    leftShoe.position.set(0, -0.7, 0.06);
    this.leftLeg.add(leftLegMesh, leftShoe);
    runnerGroup.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.24, 0.68, 0);
    const rightLegMesh = new THREE.Mesh(legGeom, this.matKurta);
    rightLegMesh.position.y = -0.35;
    const rightShoe = new THREE.Mesh(shoeGeom, this.matShoes);
    rightShoe.position.set(0, -0.7, 0.06);
    this.rightLeg.add(rightLegMesh, rightShoe);
    runnerGroup.add(this.rightLeg);

    this.formGroups['RUNNER'] = runnerGroup;
    this.mesh.add(runnerGroup);

    // 2. DRONE FORM (Vintage European Vespa Scooter Ride)
    const droneGroup = new THREE.Group();
    droneGroup.position.y = 0.55;

    // Vespa Body (Pastel European Mint Green)
    const vespaMat = new THREE.MeshStandardMaterial({ color: 0x4db6ac, roughness: 0.3 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.9, roughness: 0.1 });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.7 });

    const vespaChassis = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 1.8), vespaMat);
    vespaChassis.position.y = 0.45;
    droneGroup.add(vespaChassis);

    // Rounded cowl rear
    const rearCowl = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 12), vespaMat);
    rearCowl.scale.set(1.1, 0.8, 1.4);
    rearCowl.position.set(0, 0.55, -0.4);
    droneGroup.add(rearCowl);

    // Leather Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.9), seatMat);
    seat.position.set(0, 0.82, -0.2);
    droneGroup.add(seat);

    // Cute Round Headlight & Handlebars
    const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8), chromeMat);
    handleBar.rotateZ(Math.PI / 2);
    handleBar.position.set(0, 1.05, 0.65);
    const headlight = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 12), chromeMat);
    headlight.rotateX(Math.PI / 2);
    headlight.position.set(0, 1.05, 0.75);
    droneGroup.add(handleBar, headlight);

    // Mini Netaji Driving Vespa
    const driverHead = headGroup.clone();
    driverHead.position.set(0, 1.5, -0.15);
    driverHead.scale.set(0.9, 0.9, 0.9);
    droneGroup.add(driverHead);

    this.droneGroup = droneGroup;
    this.formGroups['DRONE'] = droneGroup;
    this.mesh.add(droneGroup);

    // 3. ORB FORM (Roly-Poly Netaji Balloon Sphere)
    const orbGroup = new THREE.Group();
    orbGroup.position.y = 0.65;

    // Round White Kurta Ball
    const sphereGeom = new THREE.SphereGeometry(0.68, 24, 24);
    const ballMesh = new THREE.Mesh(sphereGeom, this.matKurta);
    orbGroup.add(ballMesh);

    // Spinning Topi on top of ball
    const orbTopi = topiGroup.clone();
    orbTopi.position.set(0, 0.72, 0);
    orbGroup.add(orbTopi);

    // Waistcoat belt band
    const vestBand = new THREE.Mesh(new THREE.TorusGeometry(0.69, 0.08, 8, 24), this.matVest);
    vestBand.rotateX(Math.PI / 2);
    orbGroup.add(vestBand);

    this.orbGroup = orbGroup;
    this.formGroups['ORB'] = orbGroup;
    this.mesh.add(orbGroup);
  }

  buildTrailSystem() {
    this.trailParticles = [];
    this.trailGroup = new THREE.Group();
    this.scene.add(this.trailGroup);

    const pGeom = new THREE.PlaneGeometry(0.35, 0.35);
    for (let i = 0; i < 24; i++) {
      const pMat = new THREE.MeshBasicMaterial({
        color: 0xffb74d, // Warm golden marigold petals / campaign dust
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(pGeom, pMat);
      mesh.visible = false;
      this.trailGroup.add(mesh);
      this.trailParticles.push({
        mesh,
        life: 0,
        maxLife: 0.38
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
      this.mesh.scale.set(1.25, 1.25, 1.25);
    }
  }

  cycleForm() {
    if (this.isDead) return;
    const forms = ['RUNNER', 'DRONE', 'ORB'];
    const nextIdx = (forms.indexOf(this.form) + 1) % forms.length;
    this.setForm(forms[nextIdx]);
  }

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
      this.velocityY = this.jumpForce * this.gravityDirection;
      this.isGrounded = false;
      this.isSliding = false;
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
      this.velocityY = -22 * this.gravityDirection;
    }
  }

  flipGravity() {
    if (this.isDead) return;
    this.gravityDirection *= -1;
    this.isGrounded = false;
    audio.playGravityFlip();
    this.targetRotationZ = this.gravityDirection === 1 ? 0 : Math.PI;
    this.velocityY = 6 * this.gravityDirection;
  }

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

  // POLITICIAN WAISTCOAT & SCARF STYLES
  applySkin(skinId) {
    this.currentSkin = skinId;
    const skins = {
      classic: { vest: 0xe65100, scarf: 0x2e7d32, topi: 0xffffff }, // Saffron Modi Vest + Tiranga
      royal:   { vest: 0x1565c0, scarf: 0xf57c00, topi: 0xfafafa }, // Royal Blue Silk
      emerald: { vest: 0x2e7d32, scarf: 0xffd54f, topi: 0xffffff }, // Green Khadi
      velvet:  { vest: 0x880e4f, scarf: 0xffab00, topi: 0xfff9c4 }, // Maroon Velvet
      gold:    { vest: 0xffb300, scarf: 0xd84315, topi: 0xffe082 }  // Maharaja Gold
    };
    const s = skins[skinId] || skins.classic;
    this.matVest.color.setHex(s.vest);
    this.matScarf.color.setHex(s.scarf);
    this.matTopi.color.setHex(s.topi);
  }

  applyTrail(trailId) {
    this.currentTrail = trailId;
    const colors = {
      golden: 0xffb74d,
      marigold: 0xff7043,
      tricolor: 0x43a047,
      rose: 0xf06292
    };
    const c = colors[trailId] || 0xffb74d;
    this.trailParticles.forEach(p => p.mesh.material.color.setHex(c));
  }

  update(delta, gameSpeed) {
    if (this.isDead) return;

    this.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 8);

    // Horizontal lane lerp
    const targetX = this.targetLane * this.laneWidth;
    this.currentX = THREE.MathUtils.lerp(this.currentX, targetX, delta * 15);
    this.mesh.position.x = this.currentX;

    // Lean into turns
    const xDiff = targetX - this.currentX;
    this.mesh.rotation.z = THREE.MathUtils.lerp(
      this.mesh.rotation.z,
      this.targetRotationZ - xDiff * 0.12,
      delta * 12
    );

    // Vertical physics
    const effectiveGravity = this.gravity * this.gravityMultiplier * this.gravityDirection;
    this.velocityY += effectiveGravity * delta;
    this.y += this.velocityY * delta;

    if (this.gravityDirection === 1) {
      if (this.y <= this.floorY) {
        this.y = this.floorY;
        this.velocityY = 0;
        this.isGrounded = true;
      } else {
        this.isGrounded = false;
      }
    } else {
      if (this.y >= this.ceilingY) {
        this.y = this.ceilingY;
        this.velocityY = 0;
        this.isGrounded = true;
      } else {
        this.isGrounded = false;
      }
    }
    this.mesh.position.y = this.y;

    // Slide timer
    if (this.isSliding) {
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) this.isSliding = false;
    }

    // Chai Energy Overclock Drain
    if (this.isOverclock) {
      this.energy -= delta * 20;
      if (this.energy <= 0) {
        this.energy = 0;
        this.toggleOverclock(false);
      }
    } else {
      this.energy = Math.min(this.maxEnergy, this.energy + delta * 4);
    }

    // Invulnerability blink
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= delta;
      this.mesh.visible = Math.floor(Date.now() / 90) % 2 === 0;
    } else {
      this.mesh.visible = true;
    }

    // Politician cartoon animations
    this.runAnimTime += delta * (gameSpeed / 12) * 11;
    this.animateCartoonNetaji(delta);

    // Marigold trail update
    this.updateTrails(delta);

    // Collision Box
    this.updateBoundingBox();

    // Replay record
    this.recordTimer += delta;
    if (this.recordTimer >= 0.08) {
      this.recordTimer = 0;
      this.history.push({
        x: this.mesh.position.x,
        y: this.mesh.position.y,
        z: this.mesh.position.z,
        rotZ: this.mesh.rotation.z,
        form: this.form
      });
      if (this.history.length > 15000) this.history.shift();
    }
  }

  animateCartoonNetaji(delta) {
    if (this.form === 'RUNNER') {
      if (this.isSliding) {
        // Hilarious slide pose
        this.formGroups['RUNNER'].position.y = -0.45;
        this.formGroups['RUNNER'].rotation.x = 0.9 * this.gravityDirection;
        this.leftLeg.rotation.x = -1.2;
        this.rightLeg.rotation.x = -0.3;
        this.leftArm.rotation.x = 1.1;
        this.rightArm.rotation.x = 1.1;
      } else if (!this.isGrounded) {
        // Jump pose: Kurta bills, arms flung up in panic/joy
        this.formGroups['RUNNER'].position.y = 0;
        this.formGroups['RUNNER'].rotation.x = 0.2 * this.gravityDirection;
        this.leftLeg.rotation.x = -0.7;
        this.rightLeg.rotation.x = -0.6;
        this.leftArm.rotation.x = -1.6; // Hands in air!
        this.rightArm.rotation.x = -1.6;
        this.kurtaSkirt.scale.set(1.3, 1.2, 1.3);
      } else {
        // Energetic brisk jogging animation
        this.formGroups['RUNNER'].position.y = Math.abs(Math.sin(this.runAnimTime * 2)) * 0.12;
        this.formGroups['RUNNER'].rotation.x = 0.18 * this.gravityDirection;
        const swing = Math.sin(this.runAnimTime);

        this.leftLeg.rotation.x = swing * 0.95;
        this.rightLeg.rotation.x = -swing * 0.95;

        // One hand greeting the crowd (wave) and one hand pumping!
        this.leftArm.rotation.x = -swing * 0.8;
        this.rightArm.rotation.x = 0.4 + Math.sin(this.runAnimTime * 3) * 0.3; // Waving to public!
        this.rightArm.rotation.z = 0.3;

        // Topi head bob
        this.runnerHead.rotation.y = Math.sin(this.runAnimTime * 0.5) * 0.15;
        this.topiGroup.rotation.z = Math.sin(this.runAnimTime * 2) * 0.08;

        // Kurta skirt fluttering
        this.kurtaSkirt.rotation.x = -0.2 + Math.sin(this.runAnimTime * 2) * 0.15;
        this.scarfMesh.rotation.x = -0.3 + Math.sin(this.runAnimTime * 2) * 0.25;
      }
    } else if (this.form === 'DRONE') {
      // Vespa riding bob
      const hover = Math.sin(this.runAnimTime * 1.8) * 0.06;
      this.droneGroup.position.y = 0.55 + hover;
      this.droneGroup.rotation.x = 0.08 * this.gravityDirection;
    } else if (this.form === 'ORB') {
      // Roly-poly rolling sphere
      this.orbGroup.rotation.x -= delta * 18 * this.gravityDirection;
    }
  }

  updateTrails(delta) {
    let p = this.trailParticles.find(part => part.life <= 0);
    if (p) {
      p.life = p.maxLife;
      p.mesh.position.copy(this.mesh.position);
      p.mesh.position.z += 0.4;
      p.mesh.position.y += this.gravityDirection === 1 ? 0.6 : 6.8;
      p.mesh.visible = true;
      p.mesh.material.opacity = this.isOverclock ? 0.9 : 0.5;
    }

    this.trailParticles.forEach(part => {
      if (part.life > 0) {
        part.life -= delta;
        const ratio = part.life / part.maxLife;
        part.mesh.material.opacity = ratio * 0.5;
        part.mesh.scale.multiplyScalar(0.97);
        if (part.life <= 0) part.mesh.visible = false;
      }
    });
  }

  updateBoundingBox() {
    let height = 1.85;
    let width = 1.05;
    let depth = 1.1;
    let centerY = this.mesh.position.y + 0.92;

    if (this.gravityDirection === -1) {
      centerY = this.mesh.position.y - 0.92;
    }

    if (this.form === 'DRONE') {
      width = 1.3;
      height = 1.1;
      centerY = this.mesh.position.y + (this.gravityDirection === 1 ? 0.8 : -0.8);
    } else if (this.form === 'ORB') {
      width = 1.0;
      height = 1.0;
      centerY = this.mesh.position.y + (this.gravityDirection === 1 ? 0.65 : -0.65);
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
    this.energy = 60;
    this.isOverclock = false;
    this.setForm('RUNNER', false);
    this.history = [];
    audio.setBulletTime(false);
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.scene.remove(this.trailGroup);
  }
}
