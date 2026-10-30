// RUN AND RUN: NETAJI IN EUROPE - Collectibles & Campaign Powerups
// Golden Laddoos (Coins), Policy U-Turns, Z-Plus Security, Voter Magnet, Chai Turbo
import * as THREE from 'three';
import { audio } from './audio.js';

export class PowerupManager {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.pool = [];
    this.laneWidth = 2.8;

    this.activeEffects = {
      shield: false,
      magnetTimer: 0,
      multiplierTimer: 0,
      jetpackTimer: 0
    };

    // Warm & Gold Indian Politician Materials
    this.materials = {
      laddoo: new THREE.MeshStandardMaterial({
        color: 0xffa726, // Golden Motichoor Laddoo orange
        roughness: 0.7,
        metalness: 0.1
      }),
      laddooPistachio: new THREE.MeshBasicMaterial({
        color: 0x43a047
      }),
      gravityPad: new THREE.MeshBasicMaterial({
        color: 0xffb300,
        side: THREE.DoubleSide
      }),
      shield: new THREE.MeshStandardMaterial({
        color: 0x1e88e5,
        roughness: 0.2,
        metalness: 0.6
      }),
      magnet: new THREE.MeshStandardMaterial({
        color: 0xd81b60,
        roughness: 0.3
      }),
      multiplier: new THREE.MeshStandardMaterial({
        color: 0x43a047,
        roughness: 0.2
      }),
      chaiTurbo: new THREE.MeshStandardMaterial({
        color: 0xd84315, // Terracotta Kulhad Chai
        roughness: 0.8
      })
    };

    // Z-Plus Security Bubble
    this.shieldMesh = this.createSecurityBubble();
    this.shieldMesh.visible = false;
    this.scene.add(this.shieldMesh);

    // Marigold Petal Burst
    this.createPickupParticles();
  }

  createSecurityBubble() {
    const geom = new THREE.SphereGeometry(1.65, 18, 18);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffb74d,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });
    return new THREE.Mesh(geom, mat);
  }

  createPickupParticles() {
    this.particles = [];
    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);

    const geom = new THREE.PlaneGeometry(0.25, 0.25);
    for (let i = 0; i < 40; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffb74d,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.visible = false;
      this.particleGroup.add(mesh);
      this.particles.push({
        mesh,
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 0.4
      });
    }
  }

  spawnBurst(pos, color = 0xffa726) {
    let count = 8;
    for (let i = 0; i < this.particles.length && count > 0; i++) {
      const p = this.particles[i];
      if (p.life <= 0) {
        p.life = p.maxLife;
        p.mesh.position.copy(pos);
        p.mesh.material.color.setHex(color);
        p.mesh.material.opacity = 1.0;
        p.mesh.visible = true;
        p.vel.set(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8
        );
        count--;
      }
    }
  }

  spawnItem(type, lane, zPos, isCeiling = false, yOffset = 0) {
    let item = this.pool.pop();
    if (!item || item.type !== type) {
      if (item) this.scene.remove(item.mesh);
      item = this.createItemMesh(type);
    }

    item.type = type;
    item.lane = lane;
    item.isCeiling = isCeiling;
    item.active = true;
    item.animOffset = Math.random() * Math.PI * 2;

    const x = lane * this.laneWidth;
    let y = 0.9 + yOffset;
    if (isCeiling) {
      y = (type === 'GRAVITY_PAD') ? 7.42 : (6.6 - yOffset);
      item.mesh.rotation.z = Math.PI;
    } else {
      if (type === 'GRAVITY_PAD') y = 0.08;
      item.mesh.rotation.z = 0;
    }

    item.mesh.position.set(x, y, zPos);
    item.mesh.visible = true;

    this.scene.add(item.mesh);
    this.items.push(item);
    return item;
  }

  createItemMesh(type) {
    const group = new THREE.Group();

    if (type === 'COIN') {
      // Golden Laddoo with green pistachio garnish!
      const laddooGeom = new THREE.SphereGeometry(0.38, 14, 14);
      const laddoo = new THREE.Mesh(laddooGeom, this.materials.laddoo);

      // Pistachio bits
      const pist1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.08), this.materials.laddooPistachio);
      pist1.position.set(0, 0.36, 0.05);
      laddoo.add(pist1);

      group.add(laddoo);
    } else if (type === 'GRAVITY_PAD') {
      // Policy U-Turn / Rooftop Chevron Pad
      const padGeom = new THREE.PlaneGeometry(2.4, 2.6);
      padGeom.rotateX(-Math.PI / 2);
      const pad = new THREE.Mesh(padGeom, this.materials.gravityPad);
      group.add(pad);
    } else if (type === 'SHIELD') {
      // Z-Plus Security Badge
      const shieldGeom = new THREE.OctahedronGeometry(0.5);
      const shield = new THREE.Mesh(shieldGeom, this.materials.shield);
      group.add(shield);
    } else if (type === 'MAGNET') {
      // Voter Magnet
      const magnetGeom = new THREE.TorusGeometry(0.45, 0.15, 8, 16, Math.PI * 1.5);
      const magnet = new THREE.Mesh(magnetGeom, this.materials.magnet);
      group.add(magnet);
    } else if (type === 'MULTIPLIER_2X') {
      // Double Mandate 2x
      const multGeom = new THREE.TetrahedronGeometry(0.5);
      const mult = new THREE.Mesh(multGeom, this.materials.multiplier);
      group.add(mult);
    } else if (type === 'JETPACK') {
      // Cutting Chai Glass Turbo Rocket
      const cupGeom = new THREE.CylinderGeometry(0.28, 0.2, 0.7, 10);
      const cup = new THREE.Mesh(cupGeom, this.materials.chaiTurbo);
      group.add(cup);
    }

    return {
      type,
      mesh: group,
      lane: 0,
      isCeiling: false,
      active: true,
      animOffset: 0
    };
  }

  update(delta, player, onCollect) {
    const playerZ = player.mesh.position.z;
    const isMagnetActive = this.activeEffects.magnetTimer > 0;
    const isJetpackActive = this.activeEffects.jetpackTimer > 0;

    if (this.activeEffects.magnetTimer > 0) this.activeEffects.magnetTimer -= delta;
    if (this.activeEffects.multiplierTimer > 0) this.activeEffects.multiplierTimer -= delta;
    if (this.activeEffects.jetpackTimer > 0) {
      this.activeEffects.jetpackTimer -= delta;
      if (this.activeEffects.jetpackTimer <= 0) audio.stopJetpackLoop();
    }

    // Security Bubble
    if (this.activeEffects.shield && !player.isDead) {
      this.shieldMesh.visible = true;
      this.shieldMesh.position.copy(player.mesh.position);
      this.shieldMesh.position.y += player.gravityDirection === 1 ? 0.9 : 6.6;
      this.shieldMesh.rotation.y += delta * 2;
    } else {
      this.shieldMesh.visible = false;
    }

    // Particles
    this.particles.forEach(p => {
      if (p.life > 0) {
        p.life -= delta;
        p.mesh.position.addScaledVector(p.vel, delta);
        p.mesh.material.opacity = p.life / p.maxLife;
        if (p.life <= 0) p.mesh.visible = false;
      }
    });

    // Items
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (!item.active) continue;

      item.animOffset += delta * 3;
      if (item.type !== 'GRAVITY_PAD') {
        item.mesh.rotation.y += delta * 3.5;
        item.mesh.position.y += Math.sin(item.animOffset) * delta * 0.4;
      }

      // Magnet pull on Laddoos
      if (item.type === 'COIN' && (isMagnetActive || isJetpackActive)) {
        const dist = item.mesh.position.distanceTo(player.mesh.position);
        if (dist < 18) {
          item.mesh.position.lerp(player.mesh.position, delta * 12);
        }
      }

      // Pickup Check
      const zDiff = Math.abs(item.mesh.position.z - playerZ);
      if (zDiff < 1.8) {
        const xDiff = Math.abs(item.mesh.position.x - player.mesh.position.x);
        const yDiff = Math.abs(item.mesh.position.y - player.mesh.position.y);

        if (xDiff < 1.4 && yDiff < 2.2) {
          this.applyPickup(item, player, onCollect);
          this.recycleItem(i);
          continue;
        }
      }

      if (item.mesh.position.z > playerZ + 25) {
        this.recycleItem(i);
      }
    }
  }

  applyPickup(item, player, onCollect) {
    const pos = item.mesh.position;

    if (item.type === 'COIN') {
      audio.playCoin();
      player.addEnergy(4);
      this.spawnBurst(pos, 0xffa726);
      if (onCollect) onCollect('COIN', this.activeEffects.multiplierTimer > 0 ? 2 : 1);
    } else if (item.type === 'GRAVITY_PAD') {
      player.flipGravity();
      this.spawnBurst(pos, 0xffb300);
      if (onCollect) onCollect('GRAVITY_PAD', 1);
    } else if (item.type === 'SHIELD') {
      audio.playPowerup();
      this.activeEffects.shield = true;
      this.spawnBurst(pos, 0x1e88e5);
      if (onCollect) onCollect('SHIELD', 1);
    } else if (item.type === 'MAGNET') {
      audio.playPowerup();
      this.activeEffects.magnetTimer = 12;
      this.spawnBurst(pos, 0xd81b60);
      if (onCollect) onCollect('MAGNET', 1);
    } else if (item.type === 'MULTIPLIER_2X') {
      audio.playPowerup();
      this.activeEffects.multiplierTimer = 12;
      this.spawnBurst(pos, 0x43a047);
      if (onCollect) onCollect('MULTIPLIER_2X', 1);
    } else if (item.type === 'JETPACK') {
      audio.playPowerup();
      audio.startJetpackLoop();
      this.activeEffects.jetpackTimer = 6;
      this.spawnBurst(pos, 0xd84315);
      if (onCollect) onCollect('JETPACK', 1);
    }
  }

  hasShield() { return this.activeEffects.shield; }
  breakShield() {
    this.activeEffects.shield = false;
    audio.playShieldCrack();
  }
  isJetpacking() { return this.activeEffects.jetpackTimer > 0; }

  recycleItem(index) {
    const item = this.items.splice(index, 1)[0];
    item.mesh.visible = false;
    this.scene.remove(item.mesh);
    this.pool.push(item);
  }

  reset() {
    for (let i = this.items.length - 1; i >= 0; i--) {
      this.recycleItem(i);
    }
    this.activeEffects.shield = false;
    this.activeEffects.magnetTimer = 0;
    this.activeEffects.multiplierTimer = 0;
    this.activeEffects.jetpackTimer = 0;
    this.shieldMesh.visible = false;
    audio.stopJetpackLoop();
  }

  dispose() {
    this.reset();
    this.pool.forEach(item => this.scene.remove(item.mesh));
    this.pool = [];
    this.scene.remove(this.shieldMesh);
    this.scene.remove(this.particleGroup);
  }
}
