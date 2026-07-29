// ── Modern 3D Game Renderer ────────────────────────────────────────────────
// Three.js renderer that consumes the existing 2D game-state contract.
// Gameplay, saves, puzzles, AI, and inventory remain owned by GameEngine.

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import type { RenderState } from './renderTypes';
import { useGameStore } from '../state/gameStore';

const TILE = 20;
const ROOM_SCALE = 1 / TILE;
const WALL_HEIGHT = 2.6;
const PLAYER_HEIGHT = 1.72;
const PLAYER_RADIUS = 0.28;
const CAMERA_HEIGHT = 1.45;
const CAMERA_DISTANCE = 3.4;
const CAMERA_SHOULDER_OFFSET = 0.55;
const MAX_PIXEL_RATIO = 1.75;

function toSceneX(px: number): number {
  return px * ROOM_SCALE;
}

function toSceneZ(py: number): number {
  return py * ROOM_SCALE;
}

function tileCenter(tile: number): number {
  return tile + 0.5;
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
  });
}

function detachChildren(group: THREE.Group) {
  while (group.children.length > 0) {
    const child = group.children.pop();
    if (child) child.parent = null;
  }
}

function clearGroup(group: THREE.Group) {
  while (group.children.length > 0) {
    const child = group.children.pop();
    if (child) {
      child.parent = null;
      disposeObject(child);
    }
  }
}

export class GameRenderer3D {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private composer: EffectComposer;
  private renderPass: RenderPass;
  private ssaoPass: SSAOPass;
  private bloomPass: UnrealBloomPass;
  private outputPass: OutputPass;

  private roomGroup = new THREE.Group();
  private dynamicGroup = new THREE.Group();
  private particleGroup = new THREE.Group();
  private playerGroup = new THREE.Group();
  private playerSpot: THREE.SpotLight;
  private playerSpotTarget = new THREE.Object3D();
  private muzzleLight = new THREE.PointLight(0xffb15a, 0, 4, 2);
  private currentRoomId: string | null = null;
  private cameraVelocity = new THREE.Vector3();

  private materials = {
    floor: new THREE.MeshStandardMaterial({ color: 0x2b2c31, roughness: 0.78, metalness: 0.05 }),
    carpet: new THREE.MeshStandardMaterial({ color: 0x24202b, roughness: 0.96, metalness: 0.0 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x2c323a, roughness: 0.48, metalness: 0.65 }),
    wall: new THREE.MeshStandardMaterial({ color: 0x171922, roughness: 0.72, metalness: 0.1 }),
    debris: new THREE.MeshStandardMaterial({ color: 0x4a372c, roughness: 0.9, metalness: 0.02 }),
    water: new THREE.MeshStandardMaterial({ color: 0x1b496d, roughness: 0.18, metalness: 0.0, transparent: true, opacity: 0.72 }),
    spore: new THREE.MeshStandardMaterial({ color: 0x6a4b28, roughness: 0.7, metalness: 0.02, emissive: 0x2b1707, emissiveIntensity: 0.45 }),
    ceiling: new THREE.MeshStandardMaterial({ color: 0x101218, roughness: 0.82, metalness: 0.15, transparent: true, opacity: 0.38 }),
    playerSuit: new THREE.MeshStandardMaterial({ color: 0x263447, roughness: 0.55, metalness: 0.2 }),
    playerVisor: new THREE.MeshStandardMaterial({ color: 0x68c7ff, roughness: 0.22, metalness: 0.35, emissive: 0x163552, emissiveIntensity: 0.8 }),
    interactable: new THREE.MeshStandardMaterial({ color: 0x89d7ff, roughness: 0.3, metalness: 0.1, emissive: 0x1e7fb2, emissiveIntensity: 1.4 }),
    blood: new THREE.MeshStandardMaterial({ color: 0x4d0805, roughness: 0.6, metalness: 0.0 }),
    scratch: new THREE.MeshStandardMaterial({ color: 0x5b2017, roughness: 0.84, transparent: true, opacity: 0.34 }),
    pipe: new THREE.MeshStandardMaterial({ color: 0x38404a, roughness: 0.52, metalness: 0.72 }),
    emergency: new THREE.MeshStandardMaterial({ color: 0x271211, emissive: 0xff3b24, emissiveIntensity: 1.6, roughness: 0.35, metalness: 0.25 }),
  };

  private enemyMaterials = {
    hollow: new THREE.MeshStandardMaterial({ color: 0x516a58, roughness: 0.82, metalness: 0.03, emissive: 0x516a58, emissiveIntensity: 0.08 }),
    listener: new THREE.MeshStandardMaterial({ color: 0x53698f, roughness: 0.82, metalness: 0.03, emissive: 0x53698f, emissiveIntensity: 0.08 }),
    bloom: new THREE.MeshStandardMaterial({ color: 0x7a382f, roughness: 0.82, metalness: 0.03, emissive: 0x7a382f, emissiveIntensity: 0.14 }),
  };

  private particleMaterials = {
    dust: new THREE.MeshStandardMaterial({ color: 0xa49f8d, roughness: 0.9, transparent: true, opacity: 0.38 }),
    spore: new THREE.MeshStandardMaterial({ color: 0xb5884f, roughness: 0.7, transparent: true, opacity: 0.52, emissive: 0x3a2411, emissiveIntensity: 0.5 }),
    spark: new THREE.MeshStandardMaterial({ color: 0xffc46c, transparent: true, opacity: 0.85, emissive: 0xff8b2c, emissiveIntensity: 1.1 }),
    water: new THREE.MeshStandardMaterial({ color: 0x88c7ff, roughness: 0.25, transparent: true, opacity: 0.55 }),
    blood: new THREE.MeshStandardMaterial({ color: 0x4d0805, roughness: 0.6, metalness: 0.0 }),
  };

  private geometries = {
    enemy: new THREE.CapsuleGeometry(0.28, 0.9, 8, 12),
    bloom: new THREE.CapsuleGeometry(0.28, 0.35, 8, 12),
    interactableRing: new THREE.TorusGeometry(0.22, 0.015, 8, 32),
    particle: new THREE.SphereGeometry(0.035, 6, 4),
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x030407, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030407);
    this.scene.fog = new THREE.FogExp2(0x07080c, 0.075);

    this.camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.05, 80);
    this.camera.position.set(0, CAMERA_HEIGHT, CAMERA_DISTANCE);

    this.renderPass = new RenderPass(this.scene, this.camera);
    this.ssaoPass = new SSAOPass(this.scene, this.camera, canvas.width || 1280, canvas.height || 720);
    this.ssaoPass.kernelRadius = 12;
    this.ssaoPass.minDistance = 0.002;
    this.ssaoPass.maxDistance = 0.12;
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(canvas.width || 1280, canvas.height || 720), 0.45, 0.55, 0.82);
    this.outputPass = new OutputPass();
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.ssaoPass);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(this.outputPass);

    this.playerSpot = new THREE.SpotLight(0xdbe8ff, 7, 8, Math.PI / 6, 0.55, 1.3);
    this.playerSpot.castShadow = true;
    this.playerSpot.shadow.mapSize.set(1024, 1024);
    this.playerSpot.shadow.bias = -0.0004;
    this.playerSpot.target = this.playerSpotTarget;

    this.scene.add(this.roomGroup, this.dynamicGroup, this.particleGroup, this.playerGroup);
    this.scene.add(this.playerSpot, this.playerSpotTarget, this.muzzleLight);
    this.scene.add(new THREE.HemisphereLight(0x273752, 0x060608, 0.22));
    this.buildPlayer();
  }

  resize(width: number, height: number) {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
    this.composer.setSize(width, height);
    this.ssaoPass.setSize(width, height);
    this.bloomPass.setSize(width, height);
  }

  render(state: RenderState) {
    if (!state.currentRoom) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (state.currentRoom.id !== this.currentRoomId) {
      this.currentRoomId = state.currentRoom.id;
      this.rebuildRoom(state);
    }

    this.updateQuality(state);
    this.updatePlayer(state);
    this.updateDynamicObjects(state);
    this.updateParticles(state);
    this.updateCinematicCamera(state);

    const settings = useGameStore.getState().settings;
    if (settings.qualityPreset === 'low') {
      this.renderer.render(this.scene, this.camera);
    } else {
      this.composer.render();
    }
  }

  destroy() {
    this.composer.dispose();
    clearGroup(this.roomGroup);
    detachChildren(this.dynamicGroup);
    detachChildren(this.particleGroup);
    disposeObject(this.playerGroup);
    for (const material of Object.values(this.materials)) material.dispose();
    for (const material of Object.values(this.enemyMaterials)) material.dispose();
    for (const material of Object.values(this.particleMaterials)) material.dispose();
    for (const geometry of Object.values(this.geometries)) geometry.dispose();
    this.renderer.dispose();
  }

  private updateQuality(state: RenderState) {
    const settings = useGameStore.getState().settings;
    const low = settings.qualityPreset === 'low';
    const high = settings.qualityPreset === 'high';
    this.renderer.shadowMap.enabled = !low;
    this.ssaoPass.enabled = !low;
    this.bloomPass.enabled = !low;
    this.bloomPass.strength = high ? 0.58 : 0.35;
    this.bloomPass.radius = high ? 0.62 : 0.42;
    this.scene.fog = new THREE.FogExp2(0x07080c, low ? 0.055 : 0.075);
    this.playerSpot.intensity = state.isAiming ? 9 : 6.2;
    this.playerSpot.angle = state.isAiming ? Math.PI / 7.5 : Math.PI / 5.5;
  }

  private rebuildRoom(state: RenderState) {
    const room = state.currentRoom;
    if (!room) return;

    clearGroup(this.roomGroup);

    const floorTiles: THREE.Matrix4[] = [];
    const carpetTiles: THREE.Matrix4[] = [];
    const metalTiles: THREE.Matrix4[] = [];
    const waterTiles: THREE.Matrix4[] = [];
    const sporeTiles: THREE.Matrix4[] = [];
    const wallTiles: THREE.Matrix4[] = [];
    const debrisTiles: THREE.Matrix4[] = [];
    const scratchDecals: THREE.Matrix4[] = [];

    const floorMatrix = new THREE.Matrix4();
    for (let y = 0; y < room.height; y++) {
      for (let x = 0; x < room.width; x++) {
        const tile = room.tiles[y]?.[x] ?? 0;
        const tileX = tileCenter(x);
        const tileZ = tileCenter(y);
        if (tile === 0) continue;

        floorMatrix.makeTranslation(tileX, 0, tileZ);
        if (tile === 6) carpetTiles.push(floorMatrix.clone());
        else if (tile === 7) metalTiles.push(floorMatrix.clone());
        else floorTiles.push(floorMatrix.clone());

        if (tile === 2) {
          wallTiles.push(new THREE.Matrix4().makeTranslation(tileX, WALL_HEIGHT / 2, tileZ));
        } else if (tile === 3) {
          waterTiles.push(new THREE.Matrix4().makeTranslation(tileX, 0.035, tileZ));
        } else if (tile === 4) {
          sporeTiles.push(new THREE.Matrix4().makeTranslation(tileX, 0.075, tileZ));
        } else if (tile === 5) {
          debrisTiles.push(new THREE.Matrix4().makeTranslation(tileX, 0.28, tileZ));
        }

        if ((x * 19 + y * 11) % 17 === 0 && tile !== 2) {
          scratchDecals.push(new THREE.Matrix4().makeRotationX(-Math.PI / 2).setPosition(tileX - 0.18, 0.012, tileZ + 0.12));
        }
      }
    }

    this.addInstancedPlane('floor', floorTiles, this.materials.floor);
    this.addInstancedPlane('carpet', carpetTiles, this.materials.carpet);
    this.addInstancedPlane('metal', metalTiles, this.materials.metal);
    this.addInstancedPlane('water', waterTiles, this.materials.water, 0.96);
    this.addInstancedPlane('spore', sporeTiles, this.materials.spore, 0.86);
    this.addInstancedBox('walls', wallTiles, this.materials.wall, new THREE.Vector3(1, WALL_HEIGHT, 1));
    this.addInstancedBox('debris', debrisTiles, this.materials.debris, new THREE.Vector3(0.86, 0.56, 0.86));
    this.addScratchDecals(scratchDecals);
    this.addCeilingAndPipes(room.width, room.height);
    this.addEmergencyLights(room.width, room.height, state.gameTime);
  }

  private addInstancedPlane(name: string, matrices: THREE.Matrix4[], material: THREE.Material, scale = 1) {
    if (matrices.length === 0) return;
    const geometry = new THREE.PlaneGeometry(scale, scale, 1, 1);
    geometry.rotateX(-Math.PI / 2);
    const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
    mesh.name = name;
    mesh.receiveShadow = true;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    this.roomGroup.add(mesh);
  }

  private addInstancedBox(name: string, matrices: THREE.Matrix4[], material: THREE.Material, size: THREE.Vector3) {
    if (matrices.length === 0) return;
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    this.roomGroup.add(mesh);
  }

  private addScratchDecals(matrices: THREE.Matrix4[]) {
    if (matrices.length === 0) return;
    const geometry = new THREE.PlaneGeometry(0.48, 0.08);
    const mesh = new THREE.InstancedMesh(geometry, this.materials.scratch, matrices.length);
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    this.roomGroup.add(mesh);
  }

  private addCeilingAndPipes(width: number, height: number) {
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(width, height), this.materials.ceiling);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(width / 2, WALL_HEIGHT + 0.02, height / 2);
    ceiling.receiveShadow = true;
    this.roomGroup.add(ceiling);

    for (let x = 2; x < width; x += 5) {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, height, 10), this.materials.pipe);
      pipe.position.set(x, WALL_HEIGHT - 0.16, height / 2);
      pipe.rotation.x = Math.PI / 2;
      pipe.castShadow = true;
      this.roomGroup.add(pipe);
    }
  }

  private addEmergencyLights(width: number, height: number, gameTime: number) {

    const positions = [
      [1.5, WALL_HEIGHT - 0.45, 1.2],
      [width - 1.5, WALL_HEIGHT - 0.45, height - 1.2],
      [width * 0.5, WALL_HEIGHT - 0.45, 1.2],
    ];

    for (const [x, y, z] of positions) {
      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.08), this.materials.emergency);
      housing.position.set(x, y, z);
      this.roomGroup.add(housing);

      const flicker = 0.65 + Math.abs(Math.sin(gameTime * 5.1 + x)) * 0.45;
      const point = new THREE.PointLight(0xff5b3a, flicker * 1.7, 5.2, 1.65);
      point.position.set(x, y - 0.05, z);
      point.castShadow = false;
      this.roomGroup.add(point);
    }
  }

  private buildPlayer() {
    clearGroup(this.playerGroup);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(PLAYER_RADIUS, PLAYER_HEIGHT - PLAYER_RADIUS * 2, 8, 16), this.materials.playerSuit);
    torso.position.y = PLAYER_HEIGHT / 2;
    torso.castShadow = true;
    this.playerGroup.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 16, 12), this.materials.playerVisor);
    head.position.set(0, PLAYER_HEIGHT + 0.08, 0.02);
    head.castShadow = true;
    this.playerGroup.add(head);

    const shoulderLamp = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.08, 0.16), this.materials.interactable);
    shoulderLamp.position.set(0.22, 1.42, -0.08);
    this.playerGroup.add(shoulderLamp);
  }

  private updatePlayer(state: RenderState) {
    const x = toSceneX(state.playerX);
    const z = toSceneZ(state.playerY);
    const crouchDrop = state.isCrouching ? 0.34 : 0;
    this.playerGroup.position.set(x, -crouchDrop, z);
    this.playerGroup.rotation.y = -state.playerAngle + Math.PI / 2;

    const forward = new THREE.Vector3(Math.cos(state.playerAngle), 0, Math.sin(state.playerAngle));
    this.playerSpot.position.set(x + forward.x * 0.2, 1.38 - crouchDrop, z + forward.z * 0.2);
    this.playerSpotTarget.position.set(x + forward.x * 5, 1.12 - crouchDrop, z + forward.z * 5);
    this.muzzleLight.position.set(x + forward.x * 0.65, 1.25 - crouchDrop, z + forward.z * 0.65);
    this.muzzleLight.intensity = useGameStore.getState().effects.muzzleFlash * 9;
  }

  private updateDynamicObjects(state: RenderState) {
    detachChildren(this.dynamicGroup);

    for (const enemy of state.enemies) {
      if (enemy.dead) continue;
      const pulse = 1 + Math.sin(state.gameTime * 3 + enemy.x * 0.02) * 0.04;
      const color = enemy.templateId === 'bloom' ? 0x7a382f : enemy.templateId === 'listener' ? 0x53698f : 0x516a58;
      const material = enemy.templateId === 'bloom'
        ? this.enemyMaterials.bloom
        : enemy.templateId === 'listener'
          ? this.enemyMaterials.listener
          : this.enemyMaterials.hollow;
      material.emissiveIntensity = enemy.state === 'chase' ? 0.28 : enemy.state === 'attack' ? 0.4 : enemy.templateId === 'bloom' ? 0.14 : 0.08;
      const body = new THREE.Mesh(enemy.templateId === 'bloom' ? this.geometries.bloom : this.geometries.enemy, material);
      body.position.set(toSceneX(enemy.x), enemy.templateId === 'bloom' ? 0.38 : 0.72, toSceneZ(enemy.y));
      body.rotation.y = -enemy.angle + Math.PI / 2;
      body.scale.setScalar(pulse);
      body.castShadow = true;
      body.receiveShadow = true;
      this.dynamicGroup.add(body);

      if (enemy.state === 'chase' || enemy.state === 'attack') {
        const glow = new THREE.PointLight(color, enemy.state === 'attack' ? 1.2 : 0.7, 2.4, 2);
        glow.position.copy(body.position).add(new THREE.Vector3(0, 0.4, 0));
        this.dynamicGroup.add(glow);
      }
    }

    for (const object of state.interactableObjects) {
      const ring = new THREE.Mesh(this.geometries.interactableRing, this.materials.interactable);
      ring.position.set(toSceneX(object.x), 0.09 + Math.sin(state.gameTime * 2.4 + object.x) * 0.025, toSceneZ(object.y));
      ring.rotation.x = Math.PI / 2;
      this.dynamicGroup.add(ring);
    }
  }

  private updateParticles(state: RenderState) {
    detachChildren(this.particleGroup);
    const particles = useGameStore.getState().particles;
    for (const p of particles.slice(-90)) {
      const material = p.type === 'blood'
        ? this.particleMaterials.blood
        : p.type === 'spark'
          ? this.particleMaterials.spark
          : p.type === 'water'
            ? this.particleMaterials.water
            : p.type === 'spore'
              ? this.particleMaterials.spore
              : this.particleMaterials.dust;
      const mesh = new THREE.Mesh(this.geometries.particle, material);
      mesh.position.set(toSceneX(p.x), 0.2 + p.size * 0.02, toSceneZ(p.y));
      mesh.scale.setScalar(Math.max(0.45, p.size * 0.18));
      this.particleGroup.add(mesh);
    }
  }

  private updateCinematicCamera(state: RenderState) {
    const playerX = toSceneX(state.playerX);
    const playerZ = toSceneZ(state.playerY);
    const forward = new THREE.Vector3(Math.cos(state.playerAngle), 0, Math.sin(state.playerAngle));
    const right = new THREE.Vector3(-forward.z, 0, forward.x);
    const aimTighten = state.isAiming ? 0.72 : 1;
    const crouchDrop = state.isCrouching ? 0.28 : 0;
    const shake = state.cameraShake > 0 && useGameStore.getState().settings.cameraShakeEnabled
      ? (Math.random() - 0.5) * state.cameraShake * 0.18
      : 0;

    const desired = new THREE.Vector3(playerX, CAMERA_HEIGHT - crouchDrop + shake, playerZ)
      .add(forward.clone().multiplyScalar(-CAMERA_DISTANCE * aimTighten))
      .add(right.clone().multiplyScalar(CAMERA_SHOULDER_OFFSET));
    const target = new THREE.Vector3(playerX, 1.15 - crouchDrop, playerZ)
      .add(forward.clone().multiplyScalar(state.isAiming ? 2.2 : 1.25));

    if (Number.isFinite(desired.x)) {
      const delta = desired.clone().sub(this.camera.position).multiplyScalar(0.13);
      this.cameraVelocity.lerp(delta, 0.45);
      this.camera.position.add(this.cameraVelocity);
    }
    this.camera.lookAt(target);
  }
}
