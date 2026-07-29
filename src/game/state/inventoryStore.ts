import { create } from 'zustand';
import { useGameStore } from './gameStore';

// ── Types ──────────────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string;
  templateId: string;
  gridX: number;
  gridY: number;
  width: number;
  height: number;
  rotated: boolean;
  quantity: number;
  maxStack: number;
}

export interface ItemTemplate {
  id: string;
  name: string;
  description: string;
  icon: string; // character/emoji for display
  width: number;
  height: number;
  maxStack: number;
  isKeyItem: boolean;
  isWeapon: boolean;
  isHealing: boolean;
  isCombineable: boolean;
  combineWith?: string[];
  combineResult?: string;
  examineHint?: string;
}

// ── Item Templates ─────────────────────────────────────────────────────────

export const ITEM_TEMPLATES: Record<string, ItemTemplate> = {
  pistol: {
    id: 'pistol',
    name: 'Service Pistol',
    description: 'Standard-issue 9mm sidearm. 12-round magazine. Well-maintained despite the neglect.',
    icon: '🔫',
    width: 3,
    height: 1,
    maxStack: 1,
    isKeyItem: false,
    isWeapon: true,
    isHealing: false,
    isCombineable: false,
  },
  flaregun: {
    id: 'flaregun',
    name: 'Flare Launcher',
    description: 'Single-shot flare pistol. Effective against organic targets and illuminates dark areas.',
    icon: '🔥',
    width: 3,
    height: 1,
    maxStack: 1,
    isKeyItem: false,
    isWeapon: true,
    isHealing: false,
    isCombineable: false,
  },
  pistol_ammo: {
    id: 'pistol_ammo',
    name: '9mm Ammo',
    description: 'Standard 9mm ammunition box. 12 rounds.',
    icon: '📦',
    width: 1,
    height: 1,
    maxStack: 12,
    isKeyItem: false,
    isWeapon: false,
    isHealing: false,
    isCombineable: false,
  },
  flare_ammo: {
    id: 'flare_ammo',
    name: 'Flare Shell',
    description: 'Magnesium flare shell for the flare launcher.',
    icon: '🧨',
    width: 1,
    height: 1,
    maxStack: 6,
    isKeyItem: false,
    isWeapon: false,
    isHealing: false,
    isCombineable: false,
  },
  med_sealant: {
    id: 'med_sealant',
    name: 'Medical Sealant',
    description: 'Emergency wound sealant. Restores 35 health. Apply to clean wounds only.',
    icon: '💉',
    width: 1,
    height: 1,
    maxStack: 4,
    isKeyItem: false,
    isWeapon: false,
    isHealing: true,
    isCombineable: false,
    combineWith: ['antiseptic'],
    combineResult: 'antiseptic_sealant',
  },
  antiseptic: {
    id: 'antiseptic',
    name: 'Antiseptic Injector',
    description: 'Reduces contamination levels by 30. Use after exposure to organic material.',
    icon: '🧪',
    width: 1,
    height: 1,
    maxStack: 3,
    isKeyItem: false,
    isWeapon: false,
    isHealing: true,
    isCombineable: true,
    combineWith: ['med_sealant'],
    combineResult: 'antiseptic_sealant',
  },
  antiseptic_sealant: {
    id: 'antiseptic_sealant',
    name: 'Sterile Sealant',
    description: 'Combined antiseptic and wound sealant. Restores 50 health and reduces contamination.',
    icon: '💊',
    width: 1,
    height: 1,
    maxStack: 2,
    isKeyItem: false,
    isWeapon: false,
    isHealing: true,
    isCombineable: false,
  },
  battery_cell: {
    id: 'battery_cell',
    name: 'Battery Cell',
    description: 'High-capacity lithium cell. Powers emergency equipment. Marked "SUB-LEVEL 3 MAINTENANCE".',
    icon: '🔋',
    width: 1,
    height: 1,
    maxStack: 2,
    isKeyItem: true,
    isWeapon: false,
    isHealing: false,
    isCombineable: false,
    examineHint: 'The label reads: "Type 7A — Main Bus Emergency Feed". A faded stamp indicates last tested 8 months ago.',
  },
  maintenance_fuse: {
    id: 'maintenance_fuse',
    name: 'Maintenance Fuse',
    description: 'Heavy-duty circuit fuse rated for 200A. Required for the main power distribution panel.',
    icon: '⚡',
    width: 1,
    height: 1,
    maxStack: 3,
    isKeyItem: true,
    isWeapon: false,
    isHealing: false,
    isCombineable: false,
    examineHint: 'The ceramic casing has a number: "200A / 250V — GRID SECTOR C".',
  },
  security_badge: {
    id: 'security_badge',
    name: 'Security Badge',
    description: 'Access badge belonging to "T. Voss — Level 2 Clearance". The photo shows a tired-looking man.',
    icon: '🪪',
    width: 1,
    height: 1,
    maxStack: 1,
    isKeyItem: true,
    isWeapon: false,
    isHealing: false,
    isCombineable: false,
    examineHint: 'A handwritten note on the back reads: "Lockercode 04-19".',
  },
  keycard_cafeteria: {
    id: 'keycard_cafeteria',
    name: 'Cafeteria Keycard',
    description: 'Magnetic keycard. Blue stripe. "CAFETERIA — STAFF ONLY".',
    icon: '💳',
    width: 1,
    height: 1,
    maxStack: 1,
    isKeyItem: true,
    isWeapon: false,
    isHealing: false,
    isCombineable: false,
  },
  keycard_lab: {
    id: 'keycard_lab',
    name: 'Lab Access Card',
    description: 'White keycard with green stripe. "BIOMED LAB 3 — AUTHORIZED PERSONNEL".',
    icon: '💳',
    width: 1,
    height: 1,
    maxStack: 1,
    isKeyItem: true,
    isWeapon: false,
    isHealing: false,
    isCombineable: false,
  },
  keycard_storage: {
    id: 'keycard_storage',
    name: 'Storage Wing Card',
    description: 'Orange keycard. "SPECIMEN STORAGE B — RESTRICTED".',
    icon: '💳',
    width: 1,
    height: 1,
    maxStack: 1,
    isKeyItem: true,
    isWeapon: false,
    isHealing: false,
    isCombineable: false,
  },
  valve_handle: {
    id: 'valve_handle',
    name: 'Valve Handle',
    description: 'Heavy-duty valve wheel. Fits standard 4-inch gate valves. Retrieved from maintenance locker.',
    icon: '⚙️',
    width: 1,
    height: 1,
    maxStack: 1,
    isKeyItem: true,
    isWeapon: false,
    isHealing: false,
    isCombineable: false,
  },
  chemical_stabilizer: {
    id: 'chemical_stabilizer',
    name: 'Chemical Stabilizer',
    description: 'Vial of clear liquid. Label: "STABILIZER COMPOUND B-7 — NEUTRALIZES ORGANIC GROWTH". Handle with care.',
    icon: '🧴',
    width: 1,
    height: 1,
    maxStack: 2,
    isKeyItem: true,
    isWeapon: false,
    isHealing: false,
    isCombineable: false,
  },
  facility_map: {
    id: 'facility_map',
    name: 'Facility Map',
    description: 'A laminated map of the research station. Several areas are marked in red ink.',
    icon: '🗺️',
    width: 2,
    height: 2,
    maxStack: 1,
    isKeyItem: true,
    isWeapon: false,
    isHealing: false,
    isCombineable: false,
    examineHint: 'Someone has circled the power control room and written "BACKUP GEN — CODE 7742" in the margin.',
  },
  signal_decoder: {
    id: 'signal_decoder',
    name: 'Signal Decoder',
    description: 'Handheld electronic device. Used to intercept and decode facility intercom signals.',
    icon: '📻',
    width: 1,
    height: 1,
    maxStack: 1,
    isKeyItem: true,
    isWeapon: false,
    isHealing: false,
    isCombineable: false,
  },
  utility_knife: {
    id: 'utility_knife',
    name: 'Utility Knife',
    description: 'Standard folding utility knife. Dull but serviceable. Can be used for emergency melee defense.',
    icon: '🔪',
    width: 1,
    height: 1,
    maxStack: 1,
    isKeyItem: false,
    isWeapon: false,
    isHealing: false,
    isCombineable: false,
  },
};

// ── Inventory Store ─────────────────────────────────────────────────────────

const GRID_WIDTH = 8;
const GRID_HEIGHT = 6;

interface InventoryState {
  items: InventoryItem[];
  gridWidth: number;
  gridHeight: number;
  equippedWeapon: string | null;
  equipSlot: number; // 0-9 quick slots
  storageItems: InventoryItem[]; // shared storage in safe room

  canPlaceItem: (item: InventoryItem) => boolean;
  addItem: (templateId: string, quantity?: number) => boolean;
  removeItem: (itemId: string, quantity?: number) => void;
  moveItem: (itemId: string, newX: number, newY: number, rotated?: boolean) => boolean;
  getItem: (itemId: string) => InventoryItem | undefined;
  getItemsByTemplate: (templateId: string) => InventoryItem[];
  hasItem: (templateId: string) => boolean;
  countItem: (templateId: string) => number;
  equipWeapon: (itemId: string | null) => void;
  combineItems: (itemId1: string, itemId2: string) => boolean;
  useHealingItem: (itemId: string) => boolean;
  reloadWeapon: (weaponType: string) => number;
  transferToStorage: (itemId: string) => boolean;
  transferFromStorage: (itemId: string) => boolean;
  resetInventory: () => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function checkGridSpace(
  items: InventoryItem[],
  gridW: number,
  gridH: number,
  newItem: InventoryItem,
  excludeId?: string
): boolean {
  const w = newItem.rotated ? newItem.height : newItem.width;
  const h = newItem.rotated ? newItem.width : newItem.height;

  for (let y = newItem.gridY; y < newItem.gridY + h; y++) {
    for (let x = newItem.gridX; x < newItem.gridX + w; x++) {
      if (x < 0 || x >= gridW || y < 0 || y >= gridH) return false;

      const occupied = items.find(
        (it) =>
          it.id !== excludeId &&
          x >= it.gridX &&
          x < it.gridX + (it.rotated ? it.height : it.width) &&
          y >= it.gridY &&
          y < it.gridY + (it.rotated ? it.width : it.height)
      );
      if (occupied) return false;
    }
  }
  return true;
}

function findFreeSlot(
  items: InventoryItem[],
  gridW: number,
  gridH: number,
  itemW: number,
  itemH: number
): { x: number; y: number } | null {
  for (let y = 0; y <= gridH - itemH; y++) {
    for (let x = 0; x <= gridW - itemW; x++) {
      const testItem: InventoryItem = {
        id: 'test',
        templateId: 'test',
        gridX: x,
        gridY: y,
        width: itemW,
        height: itemH,
        rotated: false,
        quantity: 0,
        maxStack: 0,
      };
      if (checkGridSpace(items, gridW, gridH, testItem)) {
        return { x, y };
      }
    }
  }
  return null;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  gridWidth: GRID_WIDTH,
  gridHeight: GRID_HEIGHT,
  equippedWeapon: null,
  equipSlot: 0,
  storageItems: [],

  canPlaceItem: (item) => checkGridSpace(get().items, GRID_WIDTH, GRID_HEIGHT, item),

  addItem: (templateId, quantity = 1) => {
    const template = ITEM_TEMPLATES[templateId];
    if (!template) return false;

    const state = get();

    // Try to stack with existing items
    if (template.maxStack > 1) {
      const existing = state.items.filter(
        (it) => it.templateId === templateId && it.quantity < it.maxStack
      );
      for (const ex of existing) {
        const space = ex.maxStack - ex.quantity;
        const toAdd = Math.min(space, quantity);
        set((st) => ({
          items: st.items.map((it) =>
            it.id === ex.id ? { ...it, quantity: it.quantity + toAdd } : it
          ),
        }));
        quantity -= toAdd;
        if (quantity <= 0) {
          if (template.isWeapon && !state.equippedWeapon) {
            const updated = get().items.find((it) => it.templateId === templateId)?.id;
            if (updated) set({ equippedWeapon: updated });
          }
          return true;
        }
      }
    }

    // Find free slot
    const slot = findFreeSlot(
      state.items,
      GRID_WIDTH,
      GRID_HEIGHT,
      template.width,
      template.height
    );
    if (!slot) return false;

    const newItem: InventoryItem = {
      id: generateId(),
      templateId,
      gridX: slot.x,
      gridY: slot.y,
      width: template.width,
      height: template.height,
      rotated: false,
      quantity: Math.min(quantity, template.maxStack),
      maxStack: template.maxStack,
    };

    set((st) => ({
      items: [...st.items, newItem],
      equippedWeapon: st.equippedWeapon || (template.isWeapon ? newItem.id : st.equippedWeapon),
    }));

    return true;
  },

  removeItem: (itemId, quantity) =>
    set((st) => {
      const item = st.items.find((it) => it.id === itemId);
      if (!item) return st;

      if (quantity && item.quantity > quantity) {
        return {
          items: st.items.map((it) =>
            it.id === itemId ? { ...it, quantity: it.quantity - quantity } : it
          ),
        };
      }

      return {
        items: st.items.filter((it) => it.id !== itemId),
        equippedWeapon: st.equippedWeapon === itemId ? null : st.equippedWeapon,
      };
    }),

  moveItem: (itemId, newX, newY, rotated = false) => {
    const state = get();
    const item = state.items.find((it) => it.id === itemId);
    if (!item) return false;

    const movedItem = { ...item, gridX: newX, gridY: newY, rotated };
    if (!checkGridSpace(state.items, GRID_WIDTH, GRID_HEIGHT, movedItem, itemId)) return false;

    set((st) => ({
      items: st.items.map((it) => (it.id === itemId ? movedItem : it)),
    }));
    return true;
  },

  getItem: (itemId) => get().items.find((it) => it.id === itemId),

  getItemsByTemplate: (templateId) => get().items.filter((it) => it.templateId === templateId),

  hasItem: (templateId) => get().items.some((it) => it.templateId === templateId),

  countItem: (templateId) =>
    get().items
      .filter((it) => it.templateId === templateId)
      .reduce((sum, it) => sum + it.quantity, 0),

  equipWeapon: (itemId) => set({ equippedWeapon: itemId }),

  combineItems: (itemId1, itemId2) => {
    const state = get();
    const item1 = state.items.find((it) => it.id === itemId1);
    const item2 = state.items.find((it) => it.id === itemId2);
    if (!item1 || !item2) return false;

    const t1 = ITEM_TEMPLATES[item1.templateId];
    const t2 = ITEM_TEMPLATES[item2.templateId];
    if (!t1 || !t2) return false;

    let resultId: string | undefined;
    if (t1.combineWith?.includes(item2.templateId)) {
      resultId = t1.combineResult;
    } else if (t2.combineWith?.includes(item1.templateId)) {
      resultId = t2.combineResult;
    }

    if (!resultId) return false;

    // Remove both items, add result
    set((st) => ({
      items: st.items.filter((it) => it.id !== itemId1 && it.id !== itemId2),
    }));
    get().addItem(resultId);
    return true;
  },

  useHealingItem: (itemId) => {
    const state = get();
    const item = state.items.find((it) => it.id === itemId);
    if (!item) return false;
    const template = ITEM_TEMPLATES[item.templateId];
    if (!template?.isHealing) return false;

    const healAmount =
      item.templateId === 'med_sealant' ? 35 :
      item.templateId === 'antiseptic' ? 0 :
      item.templateId === 'antiseptic_sealant' ? 50 : 0;

    const infectReduce =
      item.templateId === 'antiseptic' ? 30 :
      item.templateId === 'antiseptic_sealant' ? 30 : 0;

    const gameStore = useGameStore;
    if (healAmount > 0) gameStore.getState().healPlayer(healAmount);
    if (infectReduce > 0) {
      // This will be handled in the game loop
    }

    get().removeItem(itemId, 1);
    return true;
  },

  reloadWeapon: (weaponType) => {
    const state = get();
    const reserveKey = weaponType === 'pistol' ? 'pistol_ammo' : 'flare_ammo';
    const reserveItem = state.items.find((it) => it.templateId === reserveKey);
    if (!reserveItem || reserveItem.quantity <= 0) return 0;

    const currentAmmo = weaponType === 'pistol' ? getAmmo('pistol') : getAmmo('flaregun');
    const maxMag = weaponType === 'pistol' ? 12 : 1;
    const needed = maxMag - currentAmmo;
    if (needed <= 0) return 0;

    const available = reserveItem.quantity;
    const toReload = Math.min(needed, available);

    set((st) => ({
      items: st.items.map((it) =>
        it.id === reserveItem.id ? { ...it, quantity: it.quantity - toReload } : it
      ),
    }));

    const gameStore = useGameStore;
    gameStore.getState().setAmmo(
      weaponType,
      currentAmmo + toReload,
      0 // reserve tracked via inventory
    );
    return toReload;
  },

  transferToStorage: (itemId) => {
    const state = get();
    const item = state.items.find((it) => it.id === itemId);
    if (!item) return false;

    // Check storage space
    const testItem = { ...item, id: 'test' };
    if (!checkGridSpace(state.storageItems, GRID_WIDTH, GRID_HEIGHT, testItem)) return false;

    set((st) => ({
      items: st.items.filter((it) => it.id !== itemId),
      storageItems: [...st.storageItems, item],
      equippedWeapon: st.equippedWeapon === itemId ? null : st.equippedWeapon,
    }));
    return true;
  },

  transferFromStorage: (itemId) => {
    const state = get();
    const item = state.storageItems.find((it) => it.id === itemId);
    if (!item) return false;

    const testItem = { ...item, id: 'test' };
    if (!checkGridSpace(state.items, GRID_WIDTH, GRID_HEIGHT, testItem)) return false;

    set((st) => ({
      storageItems: st.storageItems.filter((it) => it.id !== itemId),
      items: [...st.items, item],
    }));
    return true;
  },

  resetInventory: () =>
    set({
      items: [],
      storageItems: [],
      equippedWeapon: null,
    }),
}));

// Helper — get ammo count from game store
function getAmmo(weapon: string): number {
  const state = useGameStore.getState();
  return state.ammo[weapon] || 0;
}
