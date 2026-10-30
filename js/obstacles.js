// RUN AND RUN: NETAJI IN EUROPE - European Street Obstacles
// Cafe bistro tables, street barricades, laundry lines, wine barrels, luggage trolleys
import * as THREE from 'three';

export class ObstacleManager {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];
    this.pool = [];
    this.laneWidth = 2.8;

    // Shared European Obstacle Materials
    this.materials = {
      wood: new THREE.MeshStandardMaterial({
        color: 0x5d4037,
        roughness: 0.8
      }),
      metalBarricade: new THREE.MeshStandardMaterial({
        color: 0xd32f2f, // European Red-White Police barrier
        roughness: 0.4,
        metalness: 0.3
      }),
      barricadeWhite: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.4
      }),
      cafeChair: new THREE.MeshStandardMaterial({
        color: 0x2e7d32, // Classic Parisian green metal chairs
        roughness: 0.5,
        metalness: 0.2
      }),
      barrelOak: new THREE.MeshStandardMaterial({
        color: 0x6d4c41,
        roughness: 0.85
      }),
      laundryFabric: new THREE.MeshStandardMaterial({
        color: 0xffb74d, // Yellow / cream clothesline
        roughness: 0.9,
        side: THREE.DoubleSide
      })
    };
  }

  spawnObstacle(type, lane, zPos, isCeiling = false) {
    let obs = this.pool.pop();
    if (!obs || obs.type !== type) {
      if (obs) this.scene.remove(obs.mesh);
      obs = this.createObstacleMesh(type);
    }

    obs.type = type;
    obs.lane = lane;
    obs.isCeiling = isCeiling;
    obs.passed = false;
    obs.nearMissed = false;
    obs.active = true;

    const x = lane * this.laneWidth;
    let y = 0;
    if (isCeiling) {
      y = 7.5;
      obs.mesh.rotation.z = Math.PI;
    } else {
      obs.mesh.rotation.z = 0;
    }

    obs.mesh.position.set(x, y, zPos);
    obs.mesh.visible = true;

    this.scene.add(obs.mesh);
    this.obstacles.push(obs);
    return obs;
  }

  createObstacleMesh(type) {
    const group = new THREE.Group();
    const box = new THREE.Box3();

    if (type === 'HIGH_BARRIER') {
      // European Red-White Street Construction Barricade (Must switch lanes!)
      const postGeom = new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8);
      const leftPost = new THREE.Mesh(postGeom, this.materials.metalBarricade);
      leftPost.position.set(-1.0, 1.3, 0);
      const rightPost = new THREE.Mesh(postGeom, this.materials.metalBarricade);
      rightPost.position.set(1.0, 1.3, 0);

      // Striped planks
      const plankGeom = new THREE.BoxGeometry(2.1, 0.35, 0.1);
      const plank1 = new THREE.Mesh(plankGeom, this.materials.metalBarricade);
      plank1.position.set(0, 1.6, 0);
      const plank2 = new THREE.Mesh(plankGeom, this.materials.barricadeWhite);
      plank2.position.set(0, 1.1, 0);
      const plank3 = new THREE.Mesh(plankGeom, this.materials.metalBarricade);
      plank3.position.set(0, 0.6, 0);

      group.add(leftPost, rightPost, plank1, plank2, plank3);
    } else if (type === 'LOW_BARRIER') {
      // Parisian Bistro Cafe Table & Chairs (Jump over, or Vespa Drone glides over!)
      const tableGeom = new THREE.CylinderGeometry(0.55, 0.55, 0.08, 12);
      const tableTop = new THREE.Mesh(tableGeom, this.materials.cafeChair);
      tableTop.position.set(0, 0.8, 0);

      const legGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
      const leg = new THREE.Mesh(legGeom, this.materials.cafeChair);
      leg.position.set(0, 0.4, 0);

      // Two cute bistro chairs
      const chairBackGeom = new THREE.BoxGeometry(0.4, 0.45, 0.06);
      const chair1 = new THREE.Mesh(chairBackGeom, this.materials.cafeChair);
      chair1.position.set(-0.75, 0.6, 0);
      const chair2 = new THREE.Mesh(chairBackGeom, this.materials.cafeChair);
      chair2.position.set(0.75, 0.6, 0);

      group.add(tableTop, leg, chair1, chair2);
    } else if (type === 'OVERHEAD_GANTRY') {
      // Overhead Clothesline / European Laundry Line with hanging sheets
      // (Netaji must slide under, or Roly-Poly Orb rolls under!)
      const postGeom = new THREE.BoxGeometry(0.18, 3.8, 0.18);
      const leftPost = new THREE.Mesh(postGeom, this.materials.wood);
      leftPost.position.set(-1.1, 1.9, 0);
      const rightPost = new THREE.Mesh(postGeom, this.materials.wood);
      rightPost.position.set(1.1, 1.9, 0);

      // Rope line
      const ropeGeom = new THREE.CylinderGeometry(0.03, 0.03, 2.3, 8);
      ropeGeom.rotateZ(Math.PI / 2);
      const rope = new THREE.Mesh(ropeGeom, this.materials.wood);
      rope.position.set(0, 2.7, 0);

      // Hanging laundry sheet
      const sheetGeom = new THREE.PlaneGeometry(1.8, 1.2);
      const sheet = new THREE.Mesh(sheetGeom, this.materials.laundryFabric);
      sheet.position.set(0, 2.05, 0);

      group.add(leftPost, rightPost, rope, sheet);
    } else if (type === 'MOVING_SWEEPER') {
      // Rolling Wooden Wine Barrels rolling across the lane!
      const barrelGeom = new THREE.CylinderGeometry(0.65, 0.72, 1.4, 12);
      barrelGeom.rotateZ(Math.PI / 2);
      const barrel = new THREE.Mesh(barrelGeom, this.materials.barrelOak);
      barrel.position.set(0, 0.7, 0);
      group.add(barrel);
    } else if (type === 'GLITCH_WALL') {
      // Media Press Flash mob barricade
      const pressGeom = new THREE.BoxGeometry(2.3, 2.8, 0.2);
      const pressMat = new THREE.MeshStandardMaterial({
        color: 0x1e88e5,
        roughness: 0.5
      });
      const pressWall = new THREE.Mesh(pressGeom, pressMat);
      pressWall.position.set(0, 1.4, 0);
      group.add(pressWall);
    }

    return {
      type,
      mesh: group,
      box,
      lane: 0,
      isCeiling: false,
      passed: false,
      nearMissed: false,
      glitchTimer: 0,
      moveTimer: 0,
      active: true
    };
  }

  update(delta, player, onNearMiss) {
    const playerZ = player.mesh.position.z;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];

      if (obs.type === 'MOVING_SWEEPER') {
        obs.moveTimer += delta * 2.8;
        obs.mesh.position.x = Math.sin(obs.moveTimer) * (this.laneWidth * 0.95);
        obs.mesh.rotation.x += delta * 5;
      } else if (obs.type === 'GLITCH_WALL') {
        obs.glitchTimer += delta;
        if (obs.glitchTimer > 1.4) {
          obs.glitchTimer = 0;
          obs.lane = (obs.lane === 0 ? (Math.random() > 0.5 ? 1 : -1) : 0);
          obs.mesh.position.x = obs.lane * this.laneWidth;
        }
      }

      obs.box.setFromObject(obs.mesh);

      // Check Near-Miss
      const zDiff = obs.mesh.position.z - playerZ;
      if (!obs.nearMissed && !obs.passed && zDiff > -0.5 && zDiff < 1.8) {
        const xDist = Math.abs(obs.mesh.position.x - player.mesh.position.x);
        if (xDist > 1.2 && xDist < 2.5) {
          obs.nearMissed = true;
          if (onNearMiss) onNearMiss(obs);
        }
      }

      if (zDiff > 1.5) obs.passed = true;
      if (zDiff > 25) this.recycleObstacle(i);
    }
  }

  checkCollision(player) {
    if (player.invulnerableTimer > 0 || player.isDead) return null;

    const playerBox = player.box;

    for (let i = 0; i < this.obstacles.length; i++) {
      const obs = this.obstacles[i];
      if (!obs.active) continue;

      const zDiff = Math.abs(obs.mesh.position.z - player.mesh.position.z);
      if (zDiff > 2.8) continue;

      const playerIsCeiling = player.gravityDirection === -1;
      if (obs.isCeiling !== playerIsCeiling) continue;

      if (playerBox.intersectsBox(obs.box)) {
        // FORM PASSES:
        // 1. Vespa Drone glides right over Cafe Tables!
        if (obs.type === 'LOW_BARRIER' && player.form === 'DRONE') continue;

        // 2. Roly-Poly Orb rolls under overhead Laundry Lines!
        if (obs.type === 'OVERHEAD_GANTRY' && player.form === 'ORB') continue;

        // 3. Runner slides under Laundry Lines!
        if (obs.type === 'OVERHEAD_GANTRY' && player.form === 'RUNNER' && player.isSliding) continue;

        // 4. Jump clearance over Cafe Table
        if (obs.type === 'LOW_BARRIER') {
          const jumpClearance = playerIsCeiling ? (player.mesh.position.y < 6.4) : (player.mesh.position.y > 1.15);
          if (jumpClearance) continue;
        }

        return obs;
      }
    }
    return null;
  }

  recycleObstacle(index) {
    const obs = this.obstacles.splice(index, 1)[0];
    obs.mesh.visible = false;
    this.scene.remove(obs.mesh);
    this.pool.push(obs);
  }

  reset() {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      this.recycleObstacle(i);
    }
  }

  dispose() {
    this.reset();
    this.pool.forEach(obs => this.scene.remove(obs.mesh));
    this.pool = [];
  }
}
