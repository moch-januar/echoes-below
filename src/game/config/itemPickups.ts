// ── Item Pickup Definitions ────────────────────────────────────────────────
// Progression-critical pickups live in config so the route graph and tests can
// validate that locked doors have real in-game item sources.

export interface ItemPickupDef {
  id: string;
  roomId: string;
  templateId: string;
  quantity: number;
  x: number;
  y: number;
  label: string;
  note?: string;
}

const TILE = 20;
const atTile = (tileX: number, tileY: number) => ({
  x: tileX * TILE + TILE / 2,
  y: tileY * TILE + TILE / 2,
});

export const ITEM_PICKUPS: ItemPickupDef[] = [
  {
    id: 'pickup_intake_cafeteria_keycard',
    roomId: 'intake',
    templateId: 'keycard_cafeteria',
    quantity: 1,
    ...atTile(16, 3),
    label: 'Cafeteria Keycard',
    note: 'Found near the emergency intake lockers.',
  },
  {
    id: 'pickup_intake_maintenance_fuse',
    roomId: 'intake',
    templateId: 'maintenance_fuse',
    quantity: 1,
    ...atTile(15, 2),
    label: 'Maintenance Fuse',
    note: 'A spare fuse stored beside the intake console.',
  },
  {
    id: 'pickup_cafeteria_lab_keycard',
    roomId: 'cafeteria',
    templateId: 'keycard_lab',
    quantity: 1,
    ...atTile(18, 3),
    label: 'Lab Access Card',
    note: 'Recovered from the kitchen counter.',
  },
  {
    id: 'pickup_medlab_signal_decoder',
    roomId: 'medlab',
    templateId: 'signal_decoder',
    quantity: 1,
    ...atTile(3, 8),
    label: 'Signal Decoder',
    note: 'A handheld decoder left by the lab terminal.',
  },
  {
    id: 'pickup_corridor_maintenance_fuse',
    roomId: 'corridor',
    templateId: 'maintenance_fuse',
    quantity: 1,
    ...atTile(6, 2),
    label: 'Maintenance Fuse',
    note: 'Sealed in a maintenance wall box above the flooded section.',
  },
  {
    id: 'pickup_storage_battery_cell',
    roomId: 'storage',
    templateId: 'battery_cell',
    quantity: 1,
    ...atTile(14, 12),
    label: 'Battery Cell',
    note: 'A charged auxiliary cell from specimen storage.',
  },
  {
    id: 'pickup_storage_keycard_storage',
    roomId: 'storage',
    templateId: 'keycard_storage',
    quantity: 1,
    ...atTile(10, 8),
    label: 'Storage Wing Card',
    note: 'Unlocks the safe-room shortcut back into storage.',
  },
  {
    id: 'pickup_saferoom_flare_launcher',
    roomId: 'saferoom',
    templateId: 'flaregun',
    quantity: 1,
    ...atTile(2, 6),
    label: 'Flare Launcher',
    note: 'Emergency equipment kept in the staff rest area.',
  },
  {
    id: 'pickup_saferoom_flare_shells',
    roomId: 'saferoom',
    templateId: 'flare_ammo',
    quantity: 3,
    ...atTile(3, 6),
    label: 'Flare Shells',
    note: 'A small case of emergency flare shells.',
  },
];
