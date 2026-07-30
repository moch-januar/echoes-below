// ── Game Engine ─────────────────────────────────────────────────────────────
// Main game loop, world simulation, entity updates, interaction handling

import { InputManager } from './systems/InputManager';
import { formatKeyCode } from './systems/inputBindings';
import { resolveHoldToggleIntent } from './systems/inputIntent';
import { GameRenderer } from './systems/Renderer';
import type { GameRenderBackend, RenderState } from './systems/renderTypes';
import { useGameStore } from './state/gameStore';
import type { GameFlag, HealthState, Screen } from './state/gameStore';
import { useInventoryStore, ITEM_TEMPLATES } from './state/inventoryStore';
import { AudioManager } from '../audio/AudioManager';
import { ROOMS, START_POSITIONS } from './config/rooms';
import type { RoomDef, DoorDef } from './config/rooms';
import type { SaveData } from './saves/SaveManager';
import { DOCUMENTS } from './config/documents';
import type { DocumentDef } from './config/documents';
import { getDocumentPickups } from './config/documents';
import type { DocumentPickup } from './config/documents';
import { ITEM_PICKUPS } from './config/itemPickups';
import type { ItemPickupDef } from './config/itemPickups';
import { ENEMY_TEMPLATES, getEnemyPlacements } from './config/enemies';
import type { EnemyInstance, EnemyPlacement } from './config/enemies';
import { clamp, distance, angleBetween, isWalkableTile, isHazardTile, getTileSpeedModifier, worldToTile, generateId } from '../utils/helpers';

const TILE = 20;
const PLAYER_RADIUS = 6;

function healthStateFromValue(health: number): HealthState {
  if (health <= 0) return 'dead';
  if (health <= 25) return 'critical';
  if (health <= 50) return 'injured';
  return 'fine';
}

export interface InteractableObject {
  x: number;
  y: number;
  radius: number;
  type: 'item' | 'document' | 'save' | 'door' | 'puzzle' | 'elevator';
  label: string;
  id: string;
  action: () => void;
}

export class GameEngine {
  private input: InputManager;
  private renderer: GameRenderBackend;
  private audio: AudioManager;
  private canvas: HTMLCanvasElement;
  private animationId: number = 0;
  private lastTime: number = 0;
  private running: boolean = false;

  // World state
  private currentRoomId: string = 'intake';
  private enemies: EnemyInstance[] = [];
  private interactables: InteractableObject[] = [];
  private documentPickups: DocumentPickup[] = [];
  private doorStates: Record<string, boolean> = {};
  private puzzleStates: Record<string, { state: string; data: Record<string, unknown> }> = {};
  private enemyStates: Record<string, { health: number; dead: boolean; state: string }> = {};
  private playerX: number = 160;
  private playerY: number = 320;

  // Combat
  private shootCooldown: number = 0;
  private reloadTimer: number = 0;
  private isReloading: boolean = false;
  private muzzleFlashTimer: number = 0;
  private hitEffects: Array<{ x: number; y: number; timer: number }> = [];
  private bulletTrails: Array<{ x1: number; y1: number; x2: number; y2: number; timer: number }> = [];

  // Smooth physics
  private playerVx: number = 0;
  private playerVy: number = 0;
  private footstepTimer: number = 0;
  private bobPhase: number = 0;

  // Puzzle state
  private activePuzzle: string | null = null;

  // Ending state
  private sterilisationTimer: number = 0;
  private hasPower: boolean = false;
  private sprintLatched: boolean = false;
  private aimLatched: boolean = false;
  private keyBindingSignature: string = '';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.input = new InputManager();
    this.renderer = new GameRenderer(canvas);
    this.audio = AudioManager.getInstance();
    this.audio.init();
    this.input.bind(canvas);
  }

  async init(startFromSave?: import('./saves/SaveManager').SaveData) {
    await this.configureRenderer();
    const store = useGameStore.getState();

    if (startFromSave) {
      // Load from save
      this.currentRoomId = startFromSave.currentRoom;
      this.playerX = startFromSave.player.x;
      this.playerY = startFromSave.player.y;
      this.doorStates = startFromSave.doorStates || {};
      this.puzzleStates = startFromSave.puzzleStates || {};
      this.enemyStates = startFromSave.enemyStates || {};
      this.hasPower = startFromSave.flags.includes('power_restored');

      // Restore stores through Zustand setState so React subscribers update.
      useGameStore.setState((state) => ({
        player: {
          ...state.player,
          x: startFromSave.player.x,
          y: startFromSave.player.y,
          health: startFromSave.player.health,
          healthState: healthStateFromValue(startFromSave.player.health),
          infected: startFromSave.player.infected,
        },
        gameTime: startFromSave.gameTime,
        currentObjective: startFromSave.objective,
        documents: [...startFromSave.documents],
        flags: new Set(startFromSave.flags),
        ammo: { ...startFromSave.ammo },
        reserveAmmo: { ...startFromSave.reserveAmmo },
        endingFlags: { ...startFromSave.endingFlags },
        currentEnding: startFromSave.currentEnding,
      }));

      // Restore inventory
      useInventoryStore.setState({
        items: startFromSave.inventory.map((item) => ({ ...item, templateId: item.templateId })),
        storageItems: startFromSave.storage.map((item) => ({ ...item, templateId: item.templateId })),
        equippedWeapon: startFromSave.equippedWeapon,
      });
    } else {
      // Fresh start
      const startPos = START_POSITIONS.intake;
      this.playerX = startPos.x;
      this.playerY = startPos.y;
      store.setPlayerPosition(startPos.x, startPos.y);
      store.setObjective('Find a way to restore power and escape the facility.');

      // Give starting equipment
      const invStore = useInventoryStore.getState();
      invStore.resetInventory();
      invStore.addItem('utility_knife');
      invStore.addItem('pistol');
      invStore.addItem('pistol_ammo', 12);
      store.setAmmo('pistol', 12, 36);
    }

    this.spawnEnemies();
    this.buildInteractables();
    this.updateRoomAmbience();
    this.resize();
  }

  private async configureRenderer() {
    const rendererMode = useGameStore.getState().settings.rendererMode;
    if (rendererMode === '2d') return;

    try {
      const { GameRenderer3D } = await import('./systems/GameRenderer3D');
      this.renderer.destroy?.();
      this.renderer = new GameRenderer3D(this.canvas);
    } catch (error) {
      console.warn('WebGL 3D renderer unavailable; falling back to Canvas 2D renderer.', error);
      this.renderer = new GameRenderer(this.canvas);
    }
  }

  private spawnEnemies() {
    this.enemies = [];
    const placements = getEnemyPlacements();

    for (const place of placements) {
      const template = ENEMY_TEMPLATES[place.templateId];
      if (!template) continue;

      const existingState = this.enemyStates[place.id] ?? this.enemyStates[`${place.roomId}_${place.x}_${place.y}`];
      if (existingState && existingState.dead) continue;

      const enemy: EnemyInstance = {
        id: place.id,
        templateId: place.templateId,
        x: place.x,
        y: place.y,
        angle: 0,
        roomId: place.roomId,
        health: existingState?.health ?? template.maxHealth,
        state: 'idle',
        patrolPath: place.patrolPath || [],
        patrolIndex: 0,
        lastKnownPlayerPos: null,
        investigateTimer: 0,
        staggerTimer: 0,
        attackCooldown: 0,
        alertCooldown: 0,
        respawnable: place.respawnable ?? false,
        dead: false,
      };

      this.enemies.push(enemy);
    }
  }

  private buildInteractables() {
    this.interactables = [];
    this.documentPickups = getDocumentPickups();

    const store = useGameStore.getState();
    const room = ROOMS[this.currentRoomId];
    if (!room) return;

    // Add doors as interactables
    for (const door of room.doors) {
      const doorX = door.orientation === 'vertical' ? door.x * TILE : door.x * TILE + TILE / 2;
      const doorY = door.orientation === 'vertical' ? door.y * TILE + TILE / 2 : door.y * TILE;

      this.interactables.push({
        x: doorX,
        y: doorY,
        radius: 8,
        type: 'door',
        label: door.label,
        id: door.id,
        action: () => this.interactDoor(door),
      });
    }

    // Add documents in this room that haven't been collected
    for (const pickup of this.documentPickups) {
      if (pickup.roomId !== this.currentRoomId) continue;
      if (pickup.collected || store.hasDocument(pickup.docId)) continue;

      this.interactables.push({
        x: pickup.x,
        y: pickup.y,
        radius: 6,
        type: 'document',
        label: 'Read Document',
        id: `doc_${pickup.docId}`,
        action: () => this.collectDocument(pickup.docId),
      });
    }

    // Add configured item pickups that have not been collected in this save.
    for (const pickup of ITEM_PICKUPS) {
      if (pickup.roomId !== this.currentRoomId) continue;
      if (store.hasFlag(`pickup_collected_${pickup.id}`)) continue;

      this.interactables.push({
        x: pickup.x,
        y: pickup.y,
        radius: 7,
        type: 'item',
        label: `Pick up ${pickup.label}`,
        id: pickup.id,
        action: () => this.collectItemPickup(pickup),
      });
    }

    // Add save terminal in safe room
    if (room.safeRoom) {
      const centerX = room.width * TILE / 2;
      const centerY = room.height * TILE / 2;
      this.interactables.push({
        x: centerX,
        y: centerY + 30,
        radius: 8,
        type: 'save',
        label: 'Save Game (Terminal)',
        id: 'save_terminal',
        action: () => {
          useGameStore.getState().setScreen('saveLoad');
        },
      });
    }

    // Add puzzle objects
    if (this.currentRoomId === 'power' && !store.hasFlag('power_restored')) {
      this.interactables.push({
        x: 8 * TILE,
        y: 4 * TILE,
        radius: 10,
        type: 'puzzle',
        label: 'Main Power Panel (Requires 2 Fuses + Battery)',
        id: 'puzzle_power',
        action: () => this.solvePowerPuzzle(),
      });
    }

    if (this.currentRoomId === 'medlab' && !store.hasFlag('puzzle_neutralize_done')) {
      this.interactables.push({
        x: 14 * TILE,
        y: 9 * TILE,
        radius: 10,
        type: 'puzzle',
        label: 'Chemical Decontamination Unit',
        id: 'puzzle_chemical',
        action: () => this.solveChemicalPuzzle(),
      });
    }

    if (this.currentRoomId === 'corridor' && !store.hasFlag('puzzle_valve_done')) {
      this.interactables.push({
        x: 12 * TILE,
        y: 5 * TILE,
        radius: 10,
        type: 'puzzle',
        label: 'Flood Control Valves',
        id: 'puzzle_valve',
        action: () => this.solveValvePuzzle(),
      });
    }

    if (this.currentRoomId === 'storage' && !store.hasFlag('puzzle_symbol_done')) {
      this.interactables.push({
        x: 9 * TILE,
        y: 9 * TILE,
        radius: 10,
        type: 'puzzle',
        label: 'Specimen Container Lock',
        id: 'puzzle_symbol',
        action: () => this.solveSymbolPuzzle(),
      });
    }

    // Escape platform
    if (this.currentRoomId === 'escape' && !store.hasFlag('escaped')) {
      this.interactables.push({
        x: 8 * TILE,
        y: 6 * TILE,
        radius: 14,
        type: 'elevator',
        label: 'ELEVATOR TO SURFACE — ACTIVATE?',
        id: 'elevator',
        action: () => this.activateEscape(),
      });
    }
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w;
    this.canvas.height = h;
    this.renderer.resize(w, h);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop() {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }

  destroy() {
    this.stop();
    this.input.unbind();
    this.renderer.destroy?.();
    this.audio.stopAll();
  }

  private loop = (time: number) => {
    if (!this.running) return;
    this.animationId = requestAnimationFrame(this.loop);

    const dt = Math.min((time - this.lastTime) / 1000, 0.05); // Cap at 50ms
    this.lastTime = time;

    this.input.update();
    useGameStore.getState().setActiveInputMethod(this.input.getActiveInputMethod());
    this.update(dt);
    this.render();
    this.input.resetFrame();
  };

  private update(dt: number) {
    const store = useGameStore.getState();
    if (store.screen !== 'playing') {
      this.handleOverlayInput(store.screen);
      return;
    }

    this.audio.setMasterVolume(store.settings.masterVolume);
    this.audio.setMusicVolume(store.settings.musicVolume);
    this.audio.setSfxVolume(store.settings.sfxVolume);

    // Tick game time
    if (store.screen === 'playing') {
      useGameStore.getState().tickTime(dt);
    }

    const invStore = useInventoryStore.getState();
    const room = ROOMS[this.currentRoomId];
    if (!room) return;

    // ── Player Movement ─────────────────────────────────────────────────
    const movement = this.input.getMovementVector();
    const moveX = movement.x;
    const moveY = movement.y;

    this.input.setSensitivity(store.settings.mouseSensitivity);
    this.input.setGamepadDeadZone(store.settings.gamepadDeadZone);
    this.input.setInvertY(store.settings.invertY);
    const keyBindingSignature = JSON.stringify(store.settings.keyBindings);
    if (keyBindingSignature !== this.keyBindingSignature) {
      this.input.setActionBindings(store.settings.keyBindings);
      this.keyBindingSignature = keyBindingSignature;
    }

    const sprintIntent = resolveHoldToggleIntent({
      holdMode: store.settings.holdSprint,
      isHeld: this.input.isActionActive('run'),
      justPressed: this.input.isActionJustPressed('run'),
      latched: this.sprintLatched,
    });
    this.sprintLatched = sprintIntent.latched;

    const isCrouching = this.input.isActionActive('crouch');
    const isRunning = sprintIntent.active && !isCrouching;
    const targetSpeed = isRunning ? 80 : isCrouching ? 25 : 50;

    // Smooth acceleration/deceleration
    const accel = 120; // pixels/s²
    const friction = 80;

    if (moveX !== 0 || moveY !== 0) {
      this.playerVx += moveX * accel * dt;
      this.playerVy += moveY * accel * dt;

      // Clamp to target speed
      const currentSpeed = Math.sqrt(this.playerVx * this.playerVx + this.playerVy * this.playerVy);
      if (currentSpeed > targetSpeed) {
        this.playerVx = (this.playerVx / currentSpeed) * targetSpeed;
        this.playerVy = (this.playerVy / currentSpeed) * targetSpeed;
      }
    } else {
      // Apply friction
      const currentSpeed = Math.sqrt(this.playerVx * this.playerVx + this.playerVy * this.playerVy);
      if (currentSpeed > 0) {
        const frictionForce = friction * dt;
        if (frictionForce >= currentSpeed) {
          this.playerVx = 0;
          this.playerVy = 0;
        } else {
          this.playerVx *= (currentSpeed - frictionForce) / currentSpeed;
          this.playerVy *= (currentSpeed - frictionForce) / currentSpeed;
        }
      }
    }

    // Movement speed for bob/animation
    const currentMoveSpeed = Math.sqrt(this.playerVx * this.playerVx + this.playerVy * this.playerVy);

    // Footstep timer
    if (currentMoveSpeed > 5) {
      const stepInterval = isRunning ? 0.3 : isCrouching ? 0.8 : 0.5;
      this.footstepTimer += dt;
      if (this.footstepTimer >= stepInterval) {
        this.footstepTimer = 0;
        this.playFootstep(room);
      }
    } else {
      this.footstepTimer = 0;
    }

    // Bob phase
    const bobRate = currentMoveSpeed > 5 ? (currentMoveSpeed / 60) : 0.5;
    this.bobPhase += dt * bobRate * 6;

    // Mouse aiming
    const mouseWorld = this.input.getWorldMousePosition(this.canvas.width, this.canvas.height);
    const angleToMouse = angleBetween(this.playerX, this.playerY, mouseWorld.x, mouseWorld.y);

    const aimIntent = resolveHoldToggleIntent({
      holdMode: store.settings.holdAim,
      isHeld: this.input.isMouseButtonDown(2),
      justPressed: this.input.isMouseJustPressed(2),
      latched: this.aimLatched,
    });
    this.aimLatched = aimIntent.latched;
    const isAiming = aimIntent.active || this.input.isMouseButtonDown(0);

    // Player angle follows mouse
    let playerAngle = angleToMouse;

    // If moving without aiming, face movement direction
    if (moveX !== 0 || moveY !== 0) {
      if (!isAiming) {
        playerAngle = Math.atan2(moveY, moveX);
      }
    }

    // Update store
    useGameStore.getState().updatePlayer({
      isRunning: isRunning && currentMoveSpeed > 5,
      isCrouching,
      isAiming,
      angle: playerAngle,
      moveSpeed: currentMoveSpeed,
      bobPhase: this.bobPhase,
    });

    // ── Collision (with smooth response) ─────────────────────────────────
    const newX = this.playerX + this.playerVx * dt;
    const newY = this.playerY + this.playerVy * dt;

    // Tile collision
    const { tx: leftTx, ty: topTy } = worldToTile(newX - PLAYER_RADIUS, newY - PLAYER_RADIUS);
    const { tx: rightTx, ty: bottomTy } = worldToTile(newX + PLAYER_RADIUS, newY + PLAYER_RADIUS);

    let blockedX = false;
    let blockedY = false;

    for (let ty = topTy; ty <= bottomTy; ty++) {
      for (let tx = leftTx; tx <= rightTx; tx++) {
        const tile = room.tiles[ty]?.[tx] ?? 0;
        if (tile === 0 || tile === 2 || tile === 5) {
          const tileWorldX = tx * TILE;
          const tileWorldY = ty * TILE;
          if (newX + PLAYER_RADIUS > tileWorldX && newX - PLAYER_RADIUS < tileWorldX + TILE &&
              newY + PLAYER_RADIUS > tileWorldY && newY - PLAYER_RADIUS < tileWorldY + TILE) {
            if (tx >= leftTx && tx <= rightTx) blockedX = true;
            if (ty >= topTy && ty <= bottomTy) blockedY = true;
          }
        }

        // Hazard tiles
        if (tile === 4 && Math.random() < 0.01) {
          useGameStore.getState().damagePlayer(1);
        }
      }
    }

    // Apply movement with collision
    if (!blockedX) this.playerX = newX;
    else { this.playerVx = 0; }
    if (!blockedY) this.playerY = newY;
    else { this.playerVy = 0; }

    // Tile speed modifier
    const playerTile = room.tiles[Math.floor(this.playerY / TILE)]?.[Math.floor(this.playerX / TILE)] ?? 1;
    const speedMod = getTileSpeedModifier(playerTile);
    if (speedMod < 1 && currentMoveSpeed > 5) {
      this.playerVx *= 0.95;
      this.playerVy *= 0.95;
    }

    // Update store position
    useGameStore.getState().setPlayerPosition(this.playerX, this.playerY);

    // ── Combat: Shooting ───────────────────────────────────────────────
    this.shootCooldown -= dt;
    this.reloadTimer -= dt;
    this.muzzleFlashTimer -= dt;

    if (this.isReloading && this.reloadTimer <= 0) {
      this.isReloading = false;
      this.completeReload();
    }

    // Fire weapon
    if (this.input.isMouseJustPressed(0) && this.shootCooldown <= 0 && !this.isReloading) {
      const weaponId = invStore.equippedWeapon;
      if (weaponId) {
        const item = invStore.getItem(weaponId);
        if (item && item.templateId === 'pistol') {
          const ammo = useGameStore.getState().ammo.pistol;
          if (ammo > 0) {
            this.fireWeapon('pistol');
          } else {
            // Click empty — reload hint
            this.audio.ensureResumed();
            this.audio.playHit();
            useGameStore.getState().showSubtitle('*Click* — Out of ammo. Press R to reload.', 1.5);
          }
        } else if (item && item.templateId === 'flaregun') {
          if (useGameStore.getState().ammo.flaregun > 0) {
            this.fireWeapon('flaregun');
          }
        }
      }
    }

    // Reload
    if (this.input.isActionJustPressed('reload') && !this.isReloading) {
      this.startReload();
    }

    // Heal
    if (this.input.isActionJustPressed('heal')) {
      // Use best healing item
      const items = invStore.items;
      const healingItem = items.find((it) => ITEM_TEMPLATES[it.templateId]?.isHealing);
      if (healingItem) {
        const template = ITEM_TEMPLATES[healingItem.templateId];
        const healAmount = template.id === 'med_sealant' ? 35 : template.id === 'antiseptic_sealant' ? 50 : 0;
        if (healAmount > 0) {
          useGameStore.getState().healPlayer(healAmount);
          invStore.removeItem(healingItem.id, 1);
          this.audio.ensureResumed();
          this.audio.playPickup();
          useGameStore.getState().showSubtitle(`Used ${template.name}. +${healAmount} HP.`, 1.5);
        }
      } else {
        useGameStore.getState().showSubtitle('No healing items available.', 1);
      }
    }

    // ── Inventory Toggle ───────────────────────────────────────────────
    if (this.input.isActionJustPressed('inventory')) {
      const currentScreen = useGameStore.getState().screen;
      if (currentScreen === 'inventory') {
        useGameStore.getState().setScreen('playing');
      } else {
        useGameStore.getState().setScreen('inventory');
      }
    }

    // Map
    if (this.input.isActionJustPressed('map')) {
      const currentScreen = useGameStore.getState().screen;
      if (currentScreen === 'map') {
        useGameStore.getState().setScreen('playing');
      } else {
        useGameStore.getState().setScreen('map');
      }
    }

    // Pause
    if (this.input.isActionJustPressed('pause')) {
      if (store.screen === 'playing') {
        useGameStore.getState().setScreen('pause');
        this.input.unlockPointer();
      } else if (store.screen === 'pause') {
        useGameStore.getState().setScreen('playing');
        this.input.lockPointer();
      }
    }

    // ── Interaction ────────────────────────────────────────────────────
    if (this.input.isActionJustPressed('interact')) {
      this.handleInteraction();
    }

    // Update interaction prompt
    this.updateInteractionPrompt();

    // ── Enemy Updates ──────────────────────────────────────────────────
    this.updateEnemies(dt);

    // ── Hit effects ────────────────────────────────────────────────────
    for (const effect of this.hitEffects) {
      effect.timer -= dt;
    }
    this.hitEffects = this.hitEffects.filter((e) => e.timer > 0);

    for (const trail of this.bulletTrails) {
      trail.timer -= dt;
    }
    this.bulletTrails = this.bulletTrails.filter((t) => t.timer > 0);

    // ── Sterilization countdown ────────────────────────────────────────
    if (this.hasPower && store.hasFlag('sterilization_active')) {
      this.sterilisationTimer -= dt;
      if (this.sterilisationTimer <= 0) {
        // Trigger ending — player didn't escape in time
        useGameStore.getState().setEnding('sterilization');
      }
    }

    // ── Interaction: Nearest object ────────────────────────────────────
    this.updateInteractionPrompt();
  }

  private handleOverlayInput(screen: Screen) {
    if (screen === 'pause' && this.input.isActionJustPressed('pause')) {
      useGameStore.getState().setScreen('playing');
      this.input.lockPointer();
    } else if (screen === 'inventory' && (this.input.isActionJustPressed('inventory') || this.input.isActionJustPressed('pause'))) {
      useGameStore.getState().setScreen('playing');
      this.input.lockPointer();
    } else if (screen === 'map' && (this.input.isActionJustPressed('map') || this.input.isActionJustPressed('pause'))) {
      useGameStore.getState().setScreen('playing');
      this.input.lockPointer();
    } else if (screen === 'document' && this.input.isActionJustPressed('pause')) {
      useGameStore.getState().closeDocument();
      this.input.lockPointer();
    } else if ((screen === 'settings' || screen === 'controls' || screen === 'saveLoad') && this.input.isActionJustPressed('pause')) {
      const store = useGameStore.getState();
      const fallback = screen === 'saveLoad' ? 'playing' : 'title';
      store.setScreen(store.prevScreen === 'playing' || store.prevScreen === 'pause' ? store.prevScreen : fallback);
      if (store.prevScreen === 'playing') this.input.lockPointer();
    }
  }

  private updateInteractionPrompt() {
    const store = useGameStore.getState();
    const nearest = this.findNearestInteractable();
    if (nearest && nearest.distance < 50) {
      const key = store.activeInputMethod === 'gamepad'
        ? 'A'
        : store.activeInputMethod === 'touch'
          ? 'TAP'
          : formatKeyCode(store.settings.keyBindings.interact[0] ?? 'KeyE');
      store.setInteraction(`[${key}] ${nearest.obj.label}`);
    } else {
      store.setInteraction(null);
    }
  }

  private findNearestInteractable(): { obj: InteractableObject; distance: number } | null {
    let nearest: { obj: InteractableObject; distance: number } | null = null;

    for (const obj of this.interactables) {
      const dist = distance(this.playerX, this.playerY, obj.x, obj.y);
      if (dist < 60 && (!nearest || dist < nearest.distance)) {
        nearest = { obj, distance: dist };
      }
    }

    return nearest;
  }

  private handleInteraction() {
    const nearest = this.findNearestInteractable();
    if (nearest && nearest.distance < 50) {
      this.audio.ensureResumed();
      nearest.obj.action();
    }
  }

  private interactDoor(door: DoorDef) {
    const store = useGameStore.getState();

    if (this.doorStates[door.id] === true) {
      // Door is open, go through
      this.transitionToRoom(door.targetRoom, door.targetX, door.targetY);
      return;
    }

    if (door.locked) {
      // Check if we can unlock
      if (door.lockType === 'key' && door.lockKey) {
        const invStore = useInventoryStore.getState();
        if (invStore.hasItem(door.lockKey)) {
          store.showSubtitle(`Unlocked with ${ITEM_TEMPLATES[door.lockKey]?.name}.`, 2);
          this.audio.playDoor();
          this.doorStates[door.id] = true;
          store.setFlag(`door_unlocked_${door.id}` as GameFlag);
          this.transitionToRoom(door.targetRoom, door.targetX, door.targetY);
        } else {
          this.audio.playHit();
          store.showSubtitle('This door is locked. You need the right keycard.', 2);
        }
      } else if (door.lockType === 'power') {
        if (store.hasFlag('power_restored')) {
          store.showSubtitle('The door hums and slides open.', 1);
          this.audio.playDoor();
          this.doorStates[door.id] = true;
          this.transitionToRoom(door.targetRoom, door.targetX, door.targetY);
        } else {
          this.audio.playHit();
          store.showSubtitle('No power. The electronic lock is dead.', 2);
        }
      } else if (door.lockType === 'puzzle' && door.lockKey) {
        if (store.hasFlag(`puzzle_${door.lockKey}_done`)) {
          store.showSubtitle('The lock disengages.', 1);
          this.audio.playDoor();
          this.doorStates[door.id] = true;
          this.transitionToRoom(door.targetRoom, door.targetX, door.targetY);
        } else {
          this.audio.playHit();
          store.showSubtitle('A specialized lock. You need to complete the nearby puzzle first.', 2);
        }
      } else {
        this.audio.playHit();
        store.showSubtitle('Locked. Find another way.', 1.5);
      }
      return;
    }

    // Unlocked door
    this.transitionToRoom(door.targetRoom, door.targetX, door.targetY);
  }

  private transitionToRoom(roomId: string, targetX: number, targetY: number) {
    const targetRoom = ROOMS[roomId];
    if (!targetRoom) return;

    this.currentRoomId = roomId;
    const newX = targetX * TILE;
    const newY = targetY * TILE;
    this.playerX = newX;
    this.playerY = newY;

    useGameStore.getState().setPlayerPosition(newX, newY);
    useGameStore.getState().showSubtitle(targetRoom.description, 4);

    // Show room name
    useGameStore.getState().showSubtitle(`— ${targetRoom.name} —`, 2);

    // Rebuild interactables for new room
    this.buildInteractables();
    this.updateRoomAmbience();
  }

  private updateRoomAmbience() {
    const room = ROOMS[this.currentRoomId];
    if (!room) return;
    this.audio.ensureResumed();
    this.audio.stopAll();
    if (room.safeRoom) this.audio.playSafeHum();
    else if (room.ambience.includes('alarm')) this.audio.playAlarm();
    else this.audio.playAmbientHum();
  }

  // ── Combat ────────────────────────────────────────────────────────────────

  private fireWeapon(weapon: string) {
    const store = useGameStore.getState();

    if (!store.consumeAmmo(weapon)) {
      // Click on empty
      this.audio.ensureResumed();
      this.audio.playHit();
      store.showSubtitle('*Click*', 0.3);
      return;
    }

    const cooldown = weapon === 'pistol' ? 0.35 : 1.0;
    this.shootCooldown = cooldown;
    this.muzzleFlashTimer = 0.1;

    // Muzzle flash screen effect
    store.setEffects({ muzzleFlash: store.settings.reducedFlashing ? 0.18 : 0.6 });

    // Audio subtitle
    this.audio.ensureResumed();
    this.audio.playGunshot();
    store.showSubtitle(weapon === 'pistol' ? 'BANG!' : 'FWOOSH!', 0.3);

    // Weapon recoil (push player back slightly)
    const recoilForce = weapon === 'pistol' ? 30 : 50;
    this.playerVx -= Math.cos(store.player.angle) * recoilForce;
    this.playerVy -= Math.sin(store.player.angle) * recoilForce;

    // Camera shake
    store.triggerShake(weapon === 'pistol' ? 0.15 : 0.3);

    // Raycast
    const angle = store.player.angle;
    const range = weapon === 'pistol' ? 200 : 250;
    const damage = weapon === 'pistol' ? 25 : 50;

    // Add spread
    const spread = (Math.random() - 0.5) * (weapon === 'pistol' ? 0.08 : 0.12);
    const finalAngle = angle + spread;

    const hitX = this.playerX + Math.cos(finalAngle) * range;
    const hitY = this.playerY + Math.sin(finalAngle) * range;

    // Bullet trail
    this.bulletTrails.push({
      x1: this.playerX,
      y1: this.playerY - 4,
      x2: hitX,
      y2: hitY,
      timer: 0.12,
    });

    // Spawn muzzle flash particles
    const flashPos = {
      x: this.playerX + Math.cos(finalAngle) * 15,
      y: this.playerY + Math.sin(finalAngle) * 15 - 4,
    };
    store.addParticles(Array.from({ length: 3 }, () => ({
      x: flashPos.x,
      y: flashPos.y,
      vx: Math.cos(finalAngle + (Math.random() - 0.5)) * (30 + Math.random() * 30),
      vy: Math.sin(finalAngle + (Math.random() - 0.5)) * (30 + Math.random() * 30),
      life: 0.15,
      maxLife: 0.15,
      size: 2,
      color: 'rgba(255,200,100,',
      alpha: 0.8,
      type: 'spark' as const,
    })));

    // Check enemy hits
    for (const enemy of this.enemies) {
      if (enemy.dead || enemy.roomId !== this.currentRoomId) continue;

      const distToLine = this.pointToLineDistance(enemy.x, enemy.y, this.playerX, this.playerY, hitX, hitY);
      const distToPlayer = distance(this.playerX, this.playerY, enemy.x, enemy.y);

      if (distToLine < 12 && distToPlayer < range + 20) {
        // Hit!
        const wasAlive = !enemy.dead;
        enemy.health -= damage;
        enemy.staggerTimer = 0.4;
        enemy.state = 'stagger';
        this.audio.playHit();

        this.hitEffects.push({ x: enemy.x, y: enemy.y, timer: 0.3 });

        // Blood particles
        const bloodAngle = angleBetween(this.playerX, this.playerY, enemy.x, enemy.y);
        store.addParticles(Array.from({ length: 6 }, () => ({
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(bloodAngle + (Math.random() - 0.5) * 1.5) * (30 + Math.random() * 60),
          vy: Math.sin(bloodAngle + (Math.random() - 0.5) * 1.5) * (30 + Math.random() * 60) - 20,
          life: 0.5 + Math.random() * 0.5,
          maxLife: 1.0,
          size: 2 + Math.random() * 3,
          color: 'rgba(120,20,10,',
          alpha: 0.8,
          type: 'blood' as const,
        })));

        if (enemy.health <= 0 && wasAlive) {
          enemy.dead = true;
          enemy.state = 'dead';
          const template = ENEMY_TEMPLATES[enemy.templateId];
          if (template.dropsOnDeath) {
            const invStore = useInventoryStore.getState();
            for (const drop of template.dropsOnDeath) {
              invStore.addItem(drop);
            }
          }
        }

        break;
      }
    }
  }

  /** Play footstep sound based on floor material */
  private playFootstep(room: RoomDef) {
    const tile = room.tiles[Math.floor(this.playerY / TILE)]?.[Math.floor(this.playerX / TILE)] ?? 1;
    const mat = tile === 3 ? 'water' : tile === 6 ? 'carpet' : tile === 7 ? 'metal' : 'concrete';
    useGameStore.getState().setEffects({ floorMaterial: mat as any });
    this.audio.ensureResumed();
    this.audio.playFootstep();
  }

  private pointToLineDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return distance(px, py, x1, y1);

    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = clamp(t, 0, 1);

    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return distance(px, py, projX, projY);
  }

  private startReload() {
    const invStore = useInventoryStore.getState();
    const weaponId = invStore.equippedWeapon;
    if (!weaponId) return;

    const item = invStore.getItem(weaponId);
    if (!item) return;

    const weaponType = item.templateId;
    const currentAmmo = useGameStore.getState().ammo[weaponType] || 0;
    const maxAmmo = weaponType === 'pistol' ? 12 : 1;

    if (currentAmmo >= maxAmmo) {
      useGameStore.getState().showSubtitle('Magazine is full.', 1);
      return;
    }

    // Check reserve ammo
    const reserveType = weaponType === 'pistol' ? 'pistol_ammo' : 'flare_ammo';
    if (!invStore.hasItem(reserveType) || invStore.countItem(reserveType) <= 0) {
      useGameStore.getState().showSubtitle('No reserve ammunition.', 1);
      return;
    }

    this.isReloading = true;
    this.reloadTimer = weaponType === 'pistol' ? 1.5 : 2.5;
    this.audio.ensureResumed();
    this.audio.playReload();
    useGameStore.getState().showSubtitle('Reloading...', this.reloadTimer);
  }

  private completeReload() {
    const invStore = useInventoryStore.getState();
    const weaponId = invStore.equippedWeapon;
    if (!weaponId) return;

    const item = invStore.getItem(weaponId);
    if (!item) return;

    const weaponType = item.templateId;
    const maxAmmo = weaponType === 'pistol' ? 12 : 1;
    const reserveType = weaponType === 'pistol' ? 'pistol_ammo' : 'flare_ammo';

    const currentAmmo = useGameStore.getState().ammo[weaponType] || 0;
    const needed = maxAmmo - currentAmmo;

    // Remove from inventory reserve
    const reserveItems = invStore.getItemsByTemplate(reserveType);
    let available = 0;
    for (const ri of reserveItems) {
      available += ri.quantity;
    }

    const toReload = Math.min(needed, available);
    if (toReload > 0) {
      let remaining = toReload;
      for (const ri of reserveItems) {
        if (remaining <= 0) break;
        const take = Math.min(ri.quantity, remaining);
        invStore.removeItem(ri.id, take);
        remaining -= take;
      }

      const newAmmo = currentAmmo + toReload;
      useGameStore.getState().setAmmo(weaponType, newAmmo, available - toReload);
      this.audio.playPickup();
      useGameStore.getState().showSubtitle(`Reloaded. ${newAmmo}/${maxAmmo} rounds.`, 1);
    }
  }

  // ── Enemy AI ──────────────────────────────────────────────────────────────

  private updateEnemies(dt: number) {
    const store = useGameStore.getState();

    for (const enemy of this.enemies) {
      if (enemy.dead || enemy.roomId !== this.currentRoomId) continue;
      if (enemy.staggerTimer > 0) {
        enemy.staggerTimer -= dt;
        if (enemy.staggerTimer <= 0 && enemy.health > 0) {
          enemy.state = 'chase';
        }
        continue;
      }

      const distToPlayer = distance(enemy.x, enemy.y, this.playerX, this.playerY);
      const template = ENEMY_TEMPLATES[enemy.templateId];

      switch (enemy.state) {
        case 'idle':
          // Listen for player
          if (distToPlayer < template.detectionRange) {
            enemy.state = 'chase';
          } else if (distToPlayer < template.hearingRange && (store.player.isRunning || store.player.isAiming)) {
            enemy.state = 'investigate';
            enemy.lastKnownPlayerPos = { x: this.playerX, y: this.playerY };
            enemy.investigateTimer = 3;
          }
          break;

        case 'patrol':
          if (enemy.patrolPath.length > 0) {
            const target = enemy.patrolPath[enemy.patrolIndex];
            const distToTarget = distance(enemy.x, enemy.y, target.x, target.y);
            if (distToTarget < 10) {
              enemy.patrolIndex = (enemy.patrolIndex + 1) % enemy.patrolPath.length;
            }
            this.moveEnemyToward(enemy, target.x, target.y, template.speed, dt);
          }

          if (distToPlayer < template.detectionRange) {
            enemy.state = 'chase';
          } else if (distToPlayer < template.hearingRange && store.player.isRunning) {
            enemy.state = 'investigate';
            enemy.lastKnownPlayerPos = { x: this.playerX, y: this.playerY };
            enemy.investigateTimer = 3;
          }
          break;

        case 'investigate':
          if (enemy.lastKnownPlayerPos) {
            const distToLast = distance(enemy.x, enemy.y, enemy.lastKnownPlayerPos.x, enemy.lastKnownPlayerPos.y);
            if (distToLast < 10 || enemy.investigateTimer <= 0) {
              enemy.state = 'return';
              enemy.investigateTimer = 0;
            } else {
              this.moveEnemyToward(enemy, enemy.lastKnownPlayerPos.x, enemy.lastKnownPlayerPos.y, template.speed * 1.2, dt);
              enemy.investigateTimer -= dt;
            }
          }

          if (distToPlayer < template.detectionRange) {
            enemy.state = 'chase';
          }
          break;

        case 'chase':
          if (distToPlayer < template.attackRange) {
            enemy.state = 'attack';
          } else if (distToPlayer > template.detectionRange * 1.5) {
            enemy.lastKnownPlayerPos = { x: this.playerX, y: this.playerY };
            enemy.state = 'investigate';
            enemy.investigateTimer = 5;
          } else {
            this.moveEnemyToward(enemy, this.playerX, this.playerY, template.chaseSpeed, dt);
            enemy.angle = angleBetween(enemy.x, enemy.y, this.playerX, this.playerY);
          }
          break;

        case 'attack':
          if (distToPlayer > template.attackRange * 1.5) {
            enemy.state = 'chase';
          }
          enemy.attackCooldown -= dt;
          if (enemy.attackCooldown <= 0) {
            enemy.attackCooldown = 1.5;
            useGameStore.getState().damagePlayer(template.damage);
            this.audio.playHit();
            useGameStore.getState().triggerShake(0.3);
            useGameStore.getState().showSubtitle('Hit!', 0.5);
          }
          break;

        case 'stagger':
          enemy.staggerTimer -= dt;
          if (enemy.staggerTimer <= 0 && enemy.health > 0) {
            enemy.state = 'chase';
          }
          break;

        case 'return':
          if (enemy.patrolPath.length > 0 && enemy.patrolIndex < enemy.patrolPath.length) {
            const returnTarget = enemy.patrolPath[enemy.patrolIndex];
            const distToReturn = distance(enemy.x, enemy.y, returnTarget.x, returnTarget.y);
            if (distToReturn < 10) {
              enemy.state = 'patrol';
            }
            this.moveEnemyToward(enemy, returnTarget.x, returnTarget.y, template.speed, dt);
          } else {
            enemy.state = 'idle';
          }
          break;
      }

      // Alien AI: Listener reacts to sound
      if (enemy.templateId === 'listener') {
        if (enemy.state === 'idle' && distToPlayer < template.hearingRange) {
          if (store.player.isRunning || store.player.isAiming) {
            enemy.state = 'investigate';
            enemy.lastKnownPlayerPos = { x: this.playerX, y: this.playerY };
            enemy.investigateTimer = 2;
          }
        }
      }

      // Bloom AI: Stationary, attacks if close
      if (enemy.templateId === 'bloom') {
        if (enemy.state === 'idle' && distToPlayer < template.attackRange) {
          enemy.state = 'attack';
        }
        if (enemy.state === 'attack' && distToPlayer < template.attackRange) {
          enemy.attackCooldown -= dt;
          if (enemy.attackCooldown <= 0) {
            enemy.attackCooldown = 2;
            useGameStore.getState().damagePlayer(template.damage);
            this.audio.playHit();
            useGameStore.getState().showSubtitle('Spores irritate your skin.', 1.5);
          }
        }
        if (distToPlayer > template.attackRange * 2) {
          enemy.state = 'idle';
        }
      }
    }
  }

  private moveEnemyToward(enemy: EnemyInstance, targetX: number, targetY: number, speed: number, dt: number) {
    const angle = angleBetween(enemy.x, enemy.y, targetX, targetY);
    enemy.angle = angle;

    const newX = enemy.x + Math.cos(angle) * speed * dt;
    const newY = enemy.y + Math.sin(angle) * speed * dt;

    // Simple wall collision
    const room = ROOMS[this.currentRoomId];
    if (room) {
      const { tx, ty } = worldToTile(newX, newY);
      const tile = room.tiles[ty]?.[tx] ?? 0;
      if (isWalkableTile(tile) || isHazardTile(tile)) {
        enemy.x = newX;
        enemy.y = newY;
      }
    } else {
      enemy.x = newX;
      enemy.y = newY;
    }
  }

  // ── Puzzles ───────────────────────────────────────────────────────────────

  private solvePowerPuzzle() {
    const store = useGameStore.getState();
    const invStore = useInventoryStore.getState();

    const hasFuses = invStore.countItem('maintenance_fuse') >= 2;
    const hasBattery = invStore.hasItem('battery_cell');

    if (!hasFuses) {
      store.showSubtitle('The panel needs two Maintenance Fuses. You have fewer than that.', 2.5);
      return;
    }
    if (!hasBattery) {
      store.showSubtitle('The auxiliary power slot is empty. A Battery Cell is needed.', 2);
      return;
    }

    // Consume items
    const fuses = invStore.getItemsByTemplate('maintenance_fuse');
    let toRemove = 2;
    for (const fuse of fuses) {
      if (toRemove <= 0) break;
      const remove = Math.min(fuse.quantity, toRemove);
      invStore.removeItem(fuse.id, remove);
      toRemove -= remove;
    }
    const batteries = invStore.getItemsByTemplate('battery_cell');
    for (const bat of batteries) {
      invStore.removeItem(bat.id);
      break;
    }

    store.setFlag('power_restored');
    this.hasPower = true;
    this.audio.playDoor();
    store.setObjective('Facility power restored. The evacuation platform is now accessible through the powered blast door in the Power Control Room. Watch for the sterilization countdown.');

    // Start sterilization countdown (20 minutes real time)
    store.setFlag('sterilization_active');
    this.sterilisationTimer = 20 * 60;
    store.showSubtitle('🟢 Main Power Online. Sterilization sequence initiated. You have 20 minutes to escape!', 5);

    // Rebuild interactables for this room
    this.buildInteractables();
  }

  private solveChemicalPuzzle() {
    const store = useGameStore.getState();
    store.setFlag('puzzle_neutralize_done');
    store.setFlag('corridor_unlocked');
    this.audio.playDoor();
    store.showSubtitle('Chemical decontamination complete. The path to the maintenance corridor is open.', 3);
    this.buildInteractables();
  }

  private solveValvePuzzle() {
    const store = useGameStore.getState();
    store.setFlag('puzzle_valve_done');
    this.audio.playDoor();
    store.showSubtitle('The water drains away with a tremendous roar. The corridor is passable.', 3);
    this.buildInteractables();
  }

  private solveSymbolPuzzle() {
    const store = useGameStore.getState();
    const invStore = useInventoryStore.getState();

    store.setFlag('puzzle_symbol_done');
    store.showSubtitle('The specimen containers click into alignment. A hidden compartment opens.', 2);
    this.audio.playPickup();

    // Give reward
    invStore.addItem('security_badge');
    this.buildInteractables();
  }

  // ── Ending ────────────────────────────────────────────────────────────────

  private activateEscape() {
    const store = useGameStore.getState();
    const invStore = useInventoryStore.getState();

    // Check if we have research data (from observation room)
    const hasResearchData = store.hasDocument('doc_observation_rook_final');

    // Ending choice
    if (hasResearchData) {
      store.setEndingFlag('research_saved');
    }

    // Check if sterilization will complete
    if (store.hasFlag('sterilization_active')) {
      store.setEndingFlag('sterilization_avoided');
    }

    // Determine ending based on flags
    const collectedDocs = store.documents.length;
    const allDocsFound = collectedDocs >= Object.keys(DOCUMENTS).length;

    if (allDocsFound) {
      store.setEnding('secret');
    } else if (hasResearchData) {
      store.setEnding('research');
    } else {
      store.setEnding('escape');
    }
  }

  // ── Collectibles ──────────────────────────────────────────────────────────

  private collectDocument(docId: string) {
    const store = useGameStore.getState();
    const doc = DOCUMENTS[docId];
    if (!doc) return;

    store.addDocument(docId);
    store.openDocument(docId);
    this.audio.ensureResumed();
    this.audio.playPickup();

    // Mark as collected
    const pickup = this.documentPickups.find((p) => p.docId === docId);
    if (pickup) pickup.collected = true;

    this.buildInteractables();
  }

  private collectItemPickup(pickup: ItemPickupDef) {
    const store = useGameStore.getState();
    const invStore = useInventoryStore.getState();
    const template = ITEM_TEMPLATES[pickup.templateId];

    if (!template) {
      store.showSubtitle('The item data is corrupted.', 1.5);
      return;
    }

    const added = invStore.addItem(pickup.templateId, pickup.quantity);
    if (!added) {
      store.showSubtitle('Inventory full. Make room before taking this item.', 2);
      return;
    }

    store.setFlag(`pickup_collected_${pickup.id}` as GameFlag);
    this.audio.ensureResumed();
    this.audio.playPickup();
    const amount = pickup.quantity > 1 ? ` x${pickup.quantity}` : '';
    store.showSubtitle(`Picked up ${template.name}${amount}.`, 1.8);
    this.buildInteractables();
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  private render() {
    const store = useGameStore.getState();

    const renderState: RenderState = {
      playerX: this.playerX,
      playerY: this.playerY,
      playerAngle: store.player.angle,
      playerHealth: store.player.health,
      playerHealthState: store.player.healthState,
      playerFlashlightOn: true,
      currentRoom: ROOMS[this.currentRoomId] || null,
      enemies: this.enemies.filter((e) => e.roomId === this.currentRoomId),
      interactableObjects: this.interactables.map((obj) => ({
        x: obj.x,
        y: obj.y,
        radius: obj.radius,
        type: obj.type,
        label: obj.label,
      })),
      cameraShake: store.cameraShake,
      isAiming: store.player.isAiming,
      isCrouching: store.player.isCrouching,
      staggerTimer: store.player.staggerTimer,
      screenWidth: this.canvas.width,
      screenHeight: this.canvas.height,
      gameTime: store.gameTime,
      playerMoveSpeed: store.player.moveSpeed,
      bobPhase: store.player.bobPhase,
    };

    this.renderer.render(renderState);
  }

  // ── Save / Load ───────────────────────────────────────────────────────────

  createSaveData(): Omit<import('./saves/SaveManager').SaveData, 'version' | 'timestamp'> {
    const store = useGameStore.getState();
    const invStore = useInventoryStore.getState();

    return {
      slot: 0,
      playTime: store.gameTime,
      player: {
        x: this.playerX,
        y: this.playerY,
        health: store.player.health,
        infected: store.player.infected,
        currentRoom: this.currentRoomId,
      },
      inventory: invStore.items.map((it) => ({
        id: it.id,
        templateId: it.templateId,
        gridX: it.gridX,
        gridY: it.gridY,
        width: it.width,
        height: it.height,
        rotated: it.rotated,
        quantity: it.quantity,
        maxStack: it.maxStack,
      })),
      storage: invStore.storageItems.map((it) => ({
        id: it.id,
        templateId: it.templateId,
        gridX: it.gridX,
        gridY: it.gridY,
        width: it.width,
        height: it.height,
        rotated: it.rotated,
        quantity: it.quantity,
        maxStack: it.maxStack,
      })),
      equippedWeapon: invStore.equippedWeapon,
      ammo: { ...store.ammo },
      reserveAmmo: { ...store.reserveAmmo },
      flags: Array.from(store.flags),
      documents: [...store.documents],
      gameTime: store.gameTime,
      endingFlags: { ...store.endingFlags },
      currentEnding: store.currentEnding,
      objective: store.currentObjective,
      puzzleStates: this.puzzleStates,
      enemyStates: Object.fromEntries(
        this.enemies.map((e) => [
          e.id,
          { health: e.health, dead: e.dead, state: e.state },
        ])
      ),
      doorStates: { ...this.doorStates },
      currentRoom: this.currentRoomId,
    };
  }

  getCurrentRoomId(): string {
    return this.currentRoomId;
  }

  getInput(): InputManager {
    return this.input;
  }
}
