// RUN AND RUN - Obstacles & Collision System
// Low barriers (Drone passes), Overhead gantries (Orb rolls under / Runner slides), Glitch walls, Sweepers
import * as THREE from 'three';

export class ObstacleManager {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];
    this.pool = [];
    this.laneWidth = 2.8;

    // Shared geometries and materials for peak performance
    this.materials = {
      highBarrier: new THREE.MeshStandardMaterial({
        color: 0x180512,
        roughness: 0.3,
        metalness: 0.8
      }),
      laserRed: new THREE.MeshBasicMaterial({
        color: 0xff0055,
        wireframe: false
      }),
      laserCyan: new THREE.MeshBasicMaterial({
        color: 0x00f3ff,
        wireframe: false
      }),
      laserYellow: new THREE.MeshBasicMaterial({
        color: 0xffe600,
        wireframe: false
      }),
      glitch: new THREE.MeshBasicMaterial({
        color: 0xaa00ff,
        transparent: true,
        opacity: 0.85
      })
    };
  }

  spawnObstacle(type, lane, zPos, isCeiling = false) {
    let obs = this.pool.pop();
    if (!obs) {
      obs = this.createObstacleMesh(type);
    } else {
      // Re-configure pooled obstacle
      if (obs.type !== type) {
        this.scene.remove(obs.mesh);
        obs = this.createObstacleMesh(type);
      }
    }

    obs.type = type;
    obs.lane = lane;
    obs.isCeiling = isCeiling;
    obs.passed = false;
    obs.nearMissed = false;
    obs.glitchTimer = 0;
    obs.moveTimer = 0;
    obs.active = true;

    // Position mesh
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
      // Full height barrier (must switch lanes)
      const postGeom = new THREE.BoxGeometry(0.35, 3.2, 0.35);
      const leftPost = new THREE.Mesh(postGeom, this.materials.highBarrier);
      leftPost.position.set(-1.1, 1.6, 0);
      const rightPost = new THREE.Mesh(postGeom, this.materials.highBarrier);
      rightPost.position.set(1.1, 1.6, 0);

      const gridGeom = new THREE.BoxGeometry(2.2, 2.6, 0.15);
      const grid = new THREE.Mesh(gridGeom, this.materials.laserRed);
      grid.position.set(0, 1.6, 0);

      group.add(leftPost, rightPost, grid);
    } else if (type === 'LOW_BARRIER') {
      // Low laser beam across ground (Drone can fly over, Runner/Orb can jump)
      const postGeom = new THREE.BoxGeometry(0.3, 0.9, 0.3);
      const leftPost = new THREE.Mesh(postGeom, this.materials.highBarrier);
      leftPost.position.set(-1.1, 0.45, 0);
      const rightPost = new THREE.Mesh(postGeom, this.materials.highBarrier);
      rightPost.position.set(1.1, 0.45, 0);

      const beamGeom = new THREE.CylinderGeometry(0.12, 0.12, 2.2, 8);
      beamGeom.rotateZ(Math.PI / 2);
      const beam = new THREE.Mesh(beamGeom, this.materials.laserCyan);
      beam.position.set(0, 0.5, 0);

      group.add(leftPost, rightPost, beam);
    } else if (type === 'OVERHEAD_GANTRY') {
      // Overhead gantry (Runner must slide, Orb rolls under; Drone hits!)
      const postGeom = new THREE.BoxGeometry(0.35, 3.8, 0.35);
      const leftPost = new THREE.Mesh(postGeom, this.materials.highBarrier);
      leftPost.position.set(-1.1, 1.9, 0);
      const rightPost = new THREE.Mesh(postGeom, this.materials.highBarrier);
      rightPost.position.set(1.1, 1.9, 0);

      const topBarGeom = new THREE.BoxGeometry(2.35, 1.8, 0.6);
      const topBar = new THREE.Mesh(topBarGeom, this.materials.laserYellow);
      topBar.position.set(0, 2.8, 0);

      group.add(leftPost, rightPost, topBar);
    } else if (type === 'GLITCH_WALL') {
      // Shifting holographic barrier
      const holoGeom = new THREE.BoxGeometry(2.4, 3.2, 0.2);
      const holoMesh = new THREE.Mesh(holoGeom, this.materials.glitch);
      holoMesh.position.set(0, 1.6, 0);
      group.add(holoMesh);
    } else if (type === 'MOVING_SWEEPER') {
      // Hover drone mine sweeping back and forth
      const coreGeom = new THREE.OctahedronGeometry(0.75);
      const coreMesh = new THREE.Mesh(coreGeom, this.materials.laserRed);
      coreMesh.position.set(0, 1.4, 0);
      group.add(coreMesh);
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

      // Dynamic obstacle behaviors
      if (obs.type === 'GLITCH_WALL') {
        obs.glitchTimer += delta;
        // Flickers and teleports lane every 1.4s
        if (obs.glitchTimer > 1.4) {
          obs.glitchTimer = 0;
          obs.lane = (obs.lane === 0 ? (Math.random() > 0.5 ? 1 : -1) : 0);
          obs.mesh.position.x = obs.lane * this.laneWidth;
        }
        obs.mesh.visible = Math.floor(Date.now() / 70) % 5 !== 0;
      } else if (obs.type === 'MOVING_SWEEPER') {
        obs.moveTimer += delta * 2.8;
        obs.mesh.position.x = Math.sin(obs.moveTimer) * (this.laneWidth * 0.95);
        obs.mesh.rotation.y += delta * 4;
      }

      // Update AABB hitbox
      obs.box.setFromObject(obs.mesh);

      // Check Near-Miss (player passes very close without hitting)
      const zDiff = obs.mesh.position.z - playerZ;
      if (!obs.nearMissed && !obs.passed && zDiff > -0.5 && zDiff < 1.8) {
        const xDist = Math.abs(obs.mesh.position.x - player.mesh.position.x);
        // If in adjacent lane or closely dodging
        if (xDist > 1.2 && xDist < 2.5) {
          obs.nearMissed = true;
          if (onNearMiss) onNearMiss(obs);
        }
      }

      if (zDiff > 1.5) {
        obs.passed = true;
      }

      // Recycle obstacle if far behind player
      if (zDiff > 25) {
        this.recycleObstacle(i);
      }
    }
  }

  checkCollision(player) {
    if (player.invulnerableTimer > 0 || player.isDead) return null;

    const playerBox = player.box;

    for (let i = 0; i < this.obstacles.length; i++) {
      const obs = this.obstacles[i];
      if (!obs.active) continue;

      // Quick Z distance cull
      const zDiff = Math.abs(obs.mesh.position.z - player.mesh.position.z);
      if (zDiff > 2.8) continue;

      // Surface match: if obstacle is ceiling and player is floor, no collision!
      const playerIsCeiling = player.gravityDirection === -1;
      if (obs.isCeiling !== playerIsCeiling) continue;

      // Check bounding box intersection
      if (playerBox.intersectsBox(obs.box)) {
        // FORM SPECIFIC EVASIONS:
        // 1. DRONE: Glides completely over LOW_BARRIER!
        if (obs.type === 'LOW_BARRIER' && player.form === 'DRONE') {
          continue;
        }

        // 2. ORB: Rolls cleanly under OVERHEAD_GANTRY without sliding!
        if (obs.type === 'OVERHEAD_GANTRY' && player.form === 'ORB') {
          continue;
        }

        // 3. RUNNER: Can slide under OVERHEAD_GANTRY!
        if (obs.type === 'OVERHEAD_GANTRY' && player.form === 'RUNNER' && player.isSliding) {
          continue;
        }

        // 4. JUMP EVASION: if player is high enough over LOW_BARRIER
        if (obs.type === 'LOW_BARRIER') {
          const jumpClearance = playerIsCeiling ? (player.mesh.position.y < 6.4) : (player.mesh.position.y > 1.1);
          if (jumpClearance) {
            continue;
          }
        }

        // Real Collision Confirmed!
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
