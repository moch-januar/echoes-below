import { beforeEach, describe, expect, it } from 'vitest';
import { useInventoryStore } from './inventoryStore';

function resetInventory() {
  useInventoryStore.getState().resetInventory();
}

describe('inventoryStore', () => {
  beforeEach(() => {
    resetInventory();
  });

  it('adds a weapon and equips the first weapon automatically', () => {
    const store = useInventoryStore.getState();

    expect(store.addItem('pistol')).toBe(true);

    const items = useInventoryStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]?.templateId).toBe('pistol');
    expect(useInventoryStore.getState().equippedWeapon).toBe(items[0]?.id);
  });

  it('stacks ammo up to max stack and creates a second stack for overflow', () => {
    const store = useInventoryStore.getState();

    expect(store.addItem('pistol_ammo', 10)).toBe(true);
    expect(useInventoryStore.getState().addItem('pistol_ammo', 5)).toBe(true);

    const ammoStacks = useInventoryStore.getState().items.filter((item) => item.templateId === 'pistol_ammo');
    expect(ammoStacks).toHaveLength(2);
    expect(ammoStacks.map((item) => item.quantity).sort((a, b) => b - a)).toEqual([12, 3]);
  });

  it('combines compatible healing ingredients into sterile sealant', () => {
    const store = useInventoryStore.getState();

    expect(store.addItem('med_sealant')).toBe(true);
    expect(useInventoryStore.getState().addItem('antiseptic')).toBe(true);

    const [sealant, antiseptic] = useInventoryStore.getState().items;
    expect(sealant).toBeDefined();
    expect(antiseptic).toBeDefined();

    expect(useInventoryStore.getState().combineItems(sealant!.id, antiseptic!.id)).toBe(true);

    const items = useInventoryStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]?.templateId).toBe('antiseptic_sealant');
  });
});
