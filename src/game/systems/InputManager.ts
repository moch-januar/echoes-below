// ── Input Manager ───────────────────────────────────────────────────────────

export interface KeyState {
  pressed: boolean;
  justPressed: boolean;
  justReleased: boolean;
}

export class InputManager {
  private keys: Map<string, KeyState> = new Map();
  private prevKeys: Set<string> = new Set();
  private mouseX: number = 0;
  private mouseY: number = 0;
  private mouseWorldX: number = 0;
  private mouseWorldY: number = 0;
  private mouseButtons: Set<number> = new Set();
  private prevMouseButtons: Set<number> = new Set();
  private canvas: HTMLCanvasElement | null = null;
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private keyDownHandler: ((e: KeyboardEvent) => void) | null = null;
  private keyUpHandler: ((e: KeyboardEvent) => void) | null = null;
  private mouseDownHandler: ((e: MouseEvent) => void) | null = null;
  private mouseUpHandler: ((e: MouseEvent) => void) | null = null;
  private contextMenuHandler: ((e: MouseEvent) => void) | null = null;
  private pointerLockChangeHandler: (() => void) | null = null;
  private isPointerLocked: boolean = false;
  private cameraX: number = 0;
  private cameraY: number = 0;
  private sensitivity: number = 1.0;

  private actionMap: Record<string, string[]> = {
    moveUp: ['KeyW', 'ArrowUp'],
    moveDown: ['KeyS', 'ArrowDown'],
    moveLeft: ['KeyA', 'ArrowLeft'],
    moveRight: ['KeyD', 'ArrowRight'],
    run: ['ShiftLeft', 'ShiftRight'],
    crouch: ['ControlLeft', 'ControlRight', 'KeyC'],
    interact: ['KeyE'],
    reload: ['KeyR'],
    inventory: ['Tab'],
    map: ['KeyM'],
    pause: ['Escape'],
    useItem: ['KeyF'],
    heal: ['KeyQ'],
    slot1: ['Digit1'],
    slot2: ['Digit2'],
    slot3: ['Digit3'],
    slot4: ['Digit4'],
    slot5: ['Digit5'],
  };

  private actionStates: Map<string, boolean> = new Map();
  private prevActionStates: Map<string, boolean> = new Map();

  constructor() {
    this.setupActionDefaults();
  }

  private setupActionDefaults() {
    for (const action of Object.keys(this.actionMap)) {
      this.actionStates.set(action, false);
      this.prevActionStates.set(action, false);
    }
  }

  bind(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    this.keyDownHandler = (e: KeyboardEvent) => {
      const key = e.code;
      const state = this.keys.get(key) || { pressed: false, justPressed: false, justReleased: false };
      this.keys.set(key, { pressed: true, justPressed: !state.pressed, justReleased: false });

      // Prevent default for game keys
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'Escape', 'Tab', 'KeyE', 'KeyR', 'KeyM', 'KeyF', 'KeyQ', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'KeyC'].includes(key)) {
        e.preventDefault();
      }
    };

    this.keyUpHandler = (e: KeyboardEvent) => {
      const key = e.code;
      const state = this.keys.get(key) || { pressed: false, justPressed: false, justReleased: false };
      this.keys.set(key, { pressed: false, justPressed: false, justReleased: state.pressed });
    };

    this.mouseDownHandler = (e: MouseEvent) => {
      this.mouseButtons.add(e.button);
    };

    this.mouseUpHandler = (e: MouseEvent) => {
      this.mouseButtons.delete(e.button);
    };

    this.contextMenuHandler = (e: MouseEvent) => {
      e.preventDefault();
    };

    this.mouseMoveHandler = (e: MouseEvent) => {
      if (this.isPointerLocked) {
        this.mouseX += e.movementX * this.sensitivity;
        this.mouseY += e.movementY * this.sensitivity;
      } else {
        const rect = canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
      }
    };

    this.pointerLockChangeHandler = () => {
      this.isPointerLocked = document.pointerLockElement === canvas;
    };

    document.addEventListener('keydown', this.keyDownHandler);
    document.addEventListener('keyup', this.keyUpHandler);
    canvas.addEventListener('mousedown', this.mouseDownHandler);
    canvas.addEventListener('mouseup', this.mouseUpHandler);
    canvas.addEventListener('mousemove', this.mouseMoveHandler);
    canvas.addEventListener('contextmenu', this.contextMenuHandler);
    document.addEventListener('pointerlockchange', this.pointerLockChangeHandler);
  }

  unbind() {
    if (this.keyDownHandler) document.removeEventListener('keydown', this.keyDownHandler);
    if (this.keyUpHandler) document.removeEventListener('keyup', this.keyUpHandler);
    if (this.canvas) {
      if (this.mouseDownHandler) this.canvas.removeEventListener('mousedown', this.mouseDownHandler);
      if (this.mouseUpHandler) this.canvas.removeEventListener('mouseup', this.mouseUpHandler);
      if (this.mouseMoveHandler) this.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
      if (this.contextMenuHandler) this.canvas.removeEventListener('contextmenu', this.contextMenuHandler);
    }
    if (this.pointerLockChangeHandler) document.removeEventListener('pointerlockchange', this.pointerLockChangeHandler);
  }

  lockPointer() {
    if (this.canvas && !this.isPointerLocked) {
      this.canvas.requestPointerLock();
    }
  }

  unlockPointer() {
    if (this.isPointerLocked) {
      document.exitPointerLock();
    }
  }

  get isLocked(): boolean {
    return this.isPointerLocked;
  }

  update() {
    // Copy current states to prev
    for (const [key, state] of this.keys) {
      this.prevKeys.add(key);
      if (state.justPressed) {
        this.keys.set(key, { ...state, justPressed: false });
      }
      if (state.justReleased) {
        this.keys.set(key, { ...state, justReleased: false });
      }
    }
    for (const btn of this.mouseButtons) {
      this.prevMouseButtons.add(btn);
    }

    // Update action states
    for (const [action, keys] of Object.entries(this.actionMap)) {
      const pressed = keys.some((k) => this.keys.get(k)?.pressed);
      this.prevActionStates.set(action, this.actionStates.get(action) || false);
      this.actionStates.set(action, pressed);
    }
  }

  isKeyDown(code: string): boolean {
    return this.keys.get(code)?.pressed || false;
  }

  isKeyJustPressed(code: string): boolean {
    return this.keys.get(code)?.justPressed || false;
  }

  isKeyJustReleased(code: string): boolean {
    return this.keys.get(code)?.justReleased || false;
  }

  isActionActive(action: string): boolean {
    return this.actionStates.get(action) || false;
  }

  isActionJustPressed(action: string): boolean {
    return this.actionStates.get(action) === true && this.prevActionStates.get(action) === false;
  }

  isActionJustReleased(action: string): boolean {
    return this.actionStates.get(action) === false && this.prevActionStates.get(action) === true;
  }

  isMouseButtonDown(button: number): boolean {
    return this.mouseButtons.has(button);
  }

  isMouseJustPressed(button: number): boolean {
    return this.mouseButtons.has(button) && !this.prevMouseButtons.has(button);
  }

  getMousePosition(): { x: number; y: number } {
    return { x: this.mouseX, y: this.mouseY };
  }

  setMousePosition(x: number, y: number) {
    this.mouseX = x;
    this.mouseY = y;
  }

  setCameraPosition(x: number, y: number) {
    this.cameraX = x;
    this.cameraY = y;
  }

  screenToWorld(screenX: number, screenY: number, canvasWidth: number, canvasHeight: number): { x: number; y: number } {
    return {
      x: screenX - canvasWidth / 2 + this.cameraX,
      y: screenY - canvasHeight / 2 + this.cameraY,
    };
  }

  getWorldMousePosition(canvasWidth: number, canvasHeight: number): { x: number; y: number } {
    return this.screenToWorld(this.mouseX, this.mouseY, canvasWidth, canvasHeight);
  }

  setSensitivity(s: number) {
    this.sensitivity = s;
  }

  resetFrame() {
    // Clear just-pressed/released flags after processing
    this.prevKeys.clear();
    this.prevMouseButtons.clear();
  }
}
