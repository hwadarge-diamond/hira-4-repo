// RUN AND RUN - Collectibles & Powerups Manager
// Coins, Gravity Pads, Shield, Coin Magnet, 2x Multiplier, Jetpack Burst
import * as THREE from 'three';
import { audio } from './audio.js';

export class PowerupManager {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.pool = [];
    this.laneWidth = 2.8;

    // Active powerup timers
    this.activeEffects = {
      shield: false,
      magnetTimer: 0,
      multiplierTimer: 0,
      jetpackTimer: 0
    };

    // Shared materials
    this.materials = {
      coin: new THREE.MeshStandardMaterial({
        color: 0xffe600,
        emissive: 0xffaa00,
        emissiveIntensity: 1.2,
        metalness: 0.8,
        roughness: 0.2
      }),
      gravityPad: new THREE.MeshBasicMaterial({
        color: 0x00f3ff,
        side: THREE.DoubleSide
      }),
      shield: new THREE.MeshStandardMaterial({
        color: 0x00f3ff,
        emissive: 0x0088ff,
        emissiveIntensity: 1.4,
        roughness: 0.1
      }),
      magnet: new THREE.MeshStandardMaterial({
        color: 0xff0055,
        emissive: 0xff0033,
        emissiveIntensity: 1.2,
        roughness: 0.2
      }),
      multiplier: new THREE.MeshStandardMaterial({
        color: 0x00ff66,
        emissive: 0x00cc44,
        emissiveIntensity: 1.3,
        roughness: 0.2
      }),
      jetpack: new THREE.MeshStandardMaterial({
        color: 0xff7700,
        emissive: 0xff5500,
        emissiveIntensity: 1.5,
        roughness: 0.2
      })
    };

    // 3D Visual Shield Bubble on Player
    this.shieldMesh = this.createShieldBubble();
    this.shieldMesh.visible = false;
    this.scene.add(this.shieldMesh);

    // Particle Burst System for pickups
    this.createPickupParticles();
  }

  createShieldBubble() {
    const geom = new THREE.SphereGeometry(1.6, 20, 20);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      wireframe: true,
      transparent: true,
      opacity: 0.65
    });
    return new THREE.Mesh(geom, mat);
  }

  createPickupParticles() {
    this.particles = [];
    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);

    const geom = new THREE.PlaneGeometry(0.2, 0.2);
    for (let i = 0; i < 40; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffe600,
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

  spawnBurst(pos, color = 0xffe600) {
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
      // Hexagonal Coin
      const coinGeom = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 6);
      coinGeom.rotateX(Math.PI / 2);
      const coin = new THREE.Mesh(coinGeom, this.materials.coin);
      group.add(coin);
    } else if (type === 'GRAVITY_PAD') {
      // Floor / Ceiling holographic chevron pad
      const padGeom = new THREE.PlaneGeometry(2.4, 2.6);
      padGeom.rotateX(-Math.PI / 2);
      const pad = new THREE.Mesh(padGeom, this.materials.gravityPad);
      group.add(pad);
    } else if (type === 'SHIELD') {
      const shieldGeom = new THREE.OctahedronGeometry(0.5);
      const shield = new THREE.Mesh(shieldGeom, this.materials.shield);
      group.add(shield);
    } else if (type === 'MAGNET') {
      const magnetGeom = new THREE.TorusGeometry(0.45, 0.15, 8, 16, Math.PI * 1.5);
      const magnet = new THREE.Mesh(magnetGeom, this.materials.magnet);
      group.add(magnet);
    } else if (type === 'MULTIPLIER_2X') {
      const multGeom = new THREE.TetrahedronGeometry(0.5);
      const mult = new THREE.Mesh(multGeom, this.materials.multiplier);
      group.add(mult);
    } else if (type === 'JETPACK') {
      const cylGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.8, 10);
      const cyl = new THREE.Mesh(cylGeom, this.materials.jetpack);
      group.add(cyl);
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

    // Update Timers
    if (this.activeEffects.magnetTimer > 0) {
      this.activeEffects.magnetTimer -= delta;
    }
    if (this.activeEffects.multiplierTimer > 0) {
      this.activeEffects.multiplierTimer -= delta;
    }
    if (this.activeEffects.jetpackTimer > 0) {
      this.activeEffects.jetpackTimer -= delta;
      if (this.activeEffects.jetpackTimer <= 0) {
        audio.stopJetpackLoop();
      }
    }

    // Shield Bubble Animation
    if (this.activeEffects.shield && !player.isDead) {
      this.shieldMesh.visible = true;
      this.shieldMesh.position.copy(player.mesh.position);
      this.shieldMesh.position.y += player.gravityDirection === 1 ? 0.9 : 6.6;
      this.shieldMesh.rotation.y += delta * 2;
    } else {
      this.shieldMesh.visible = false;
    }

    // Update Particles
    this.particles.forEach(p => {
      if (p.life > 0) {
        p.life -= delta;
        p.mesh.position.addScaledVector(p.vel, delta);
        p.mesh.material.opacity = p.life / p.maxLife;
        if (p.life <= 0) p.mesh.visible = false;
      }
    });

    // Update Items
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (!item.active) continue;

      // Bobbing & Rotation
      item.animOffset += delta * 3;
      if (item.type !== 'GRAVITY_PAD') {
        item.mesh.rotation.y += delta * 3.5;
        item.mesh.position.y += Math.sin(item.animOffset) * delta * 0.4;
      }

      // Magnet or Jetpack pull effect on coins
      if (item.type === 'COIN' && (isMagnetActive || isJetpackActive)) {
        const distToPlayer = item.mesh.position.distanceTo(player.mesh.position);
        if (distToPlayer < 18) {
          item.mesh.position.lerp(player.mesh.position, delta * 12);
        }
      }

      // Pickup Distance Check
      const zDiff = Math.abs(item.mesh.position.z - playerZ);
      if (zDiff < 1.8) {
        const xDiff = Math.abs(item.mesh.position.x - player.mesh.position.x);
        const yDiff = Math.abs(item.mesh.position.y - player.mesh.position.y);

        // Check if player picked it up
        if (xDiff < 1.4 && yDiff < 2.2) {
          this.applyPickup(item, player, onCollect);
          this.recycleItem(i);
          continue;
        }
      }

      // Recycle if far behind
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
      this.spawnBurst(pos, 0xffe600);
      if (onCollect) onCollect('COIN', this.activeEffects.multiplierTimer > 0 ? 2 : 1);
    } else if (item.type === 'GRAVITY_PAD') {
      player.flipGravity();
      this.spawnBurst(pos, 0x00f3ff);
      if (onCollect) onCollect('GRAVITY_PAD', 1);
    } else if (item.type === 'SHIELD') {
      audio.playPowerup();
      this.activeEffects.shield = true;
      this.spawnBurst(pos, 0x00f3ff);
      if (onCollect) onCollect('SHIELD', 1);
    } else if (item.type === 'MAGNET') {
      audio.playPowerup();
      this.activeEffects.magnetTimer = 12; // 12 seconds
      this.spawnBurst(pos, 0xff0055);
      if (onCollect) onCollect('MAGNET', 1);
    } else if (item.type === 'MULTIPLIER_2X') {
      audio.playPowerup();
      this.activeEffects.multiplierTimer = 12; // 12 seconds
      this.spawnBurst(pos, 0x00ff66);
      if (onCollect) onCollect('MULTIPLIER_2X', 1);
    } else if (item.type === 'JETPACK') {
      audio.playPowerup();
      audio.startJetpackLoop();
      this.activeEffects.jetpackTimer = 6; // 6 seconds invulnerable rocket
      this.spawnBurst(pos, 0xff7700);
      if (onCollect) onCollect('JETPACK', 1);
    }
  }

  hasShield() {
    return this.activeEffects.shield;
  }

  breakShield() {
    this.activeEffects.shield = false;
    audio.playShieldCrack();
  }

  isJetpacking() {
    return this.activeEffects.jetpackTimer > 0;
  }

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
