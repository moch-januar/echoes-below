import { useMemo, useState } from 'react';
import { useGameStore } from '../game/state/gameStore';
import { useInventoryStore, ITEM_TEMPLATES } from '../game/state/inventoryStore';

export default function InventoryScreen() {
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);
  const {
    items,
    storageItems,
    equippedWeapon,
    equipWeapon,
    moveItem,
    removeItem,
    combineItems,
    transferToStorage,
    transferFromStorage,
  } = useInventoryStore();

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [combineMode, setCombineMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'storage'>('inventory');
  const [filter, setFilter] = useState<'all' | 'weapons' | 'healing' | 'key'>('all');
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  const currentItems = activeTab === 'inventory' ? items : storageItems;
  const visibleItemIds = useMemo(() => {
    return new Set(currentItems.filter((item) => {
      const template = ITEM_TEMPLATES[item.templateId];
      if (filter === 'weapons') return template?.isWeapon;
      if (filter === 'healing') return template?.isHealing;
      if (filter === 'key') return template?.isKeyItem;
      return true;
    }).map((item) => item.id));
  }, [currentItems, filter]);
  const currentTransfer = activeTab === 'inventory' ? transferToStorage : transferFromStorage;
  const transferLabel = activeTab === 'inventory' ? 'Store' : 'Take';

  const selectedItem = selectedItemId ? items.find((i) => i.id === selectedItemId) || storageItems.find((i) => i.id === selectedItemId) : null;
  const selectedTemplate = selectedItem ? ITEM_TEMPLATES[selectedItem.templateId] : null;

  const handleEquip = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item && ITEM_TEMPLATES[item.templateId]?.isWeapon) {
      equipWeapon(itemId);
    }
  };

  const handleCombine = (itemId: string) => {
    if (!combineMode || !selectedItemId) return;
    if (itemId === selectedItemId) return;

    const success = combineItems(selectedItemId, itemId);
    if (success) {
      setCombineMode(false);
      setSelectedItemId(null);
    }
  };

  const handleUse = () => {
    if (!selectedItem) return;
    const template = ITEM_TEMPLATES[selectedItem.templateId];

    if (template?.isHealing) {
      const gameStore = useGameStore.getState();
      const healAmount = template.id === 'med_sealant' ? 35 : template.id === 'antiseptic_sealant' ? 50 : 0;
      if (healAmount > 0) {
        gameStore.healPlayer(healAmount);
        removeItem(selectedItem.id, 1);
        gameStore.showSubtitle(`Used ${template.name}. +${healAmount} HP.`, 1.5);
      }
    }

    setSelectedItemId(null);
  };

  const handleClose = () => {
    setSelectedItemId(null);
    setCombineMode(false);
    setScreen('playing');
  };

  const handleRotateSelected = () => {
    if (!selectedItem || activeTab !== 'inventory') return;
    moveItem(selectedItem.id, selectedItem.gridX, selectedItem.gridY, !selectedItem.rotated);
  };

  const handleDropOnCell = (gridX: number, gridY: number) => {
    if (!draggingItemId || activeTab !== 'inventory') return;
    const item = items.find((it) => it.id === draggingItemId);
    if (item) moveItem(item.id, gridX, gridY, item.rotated);
    setDraggingItemId(null);
  };

  if (screen !== 'inventory') return null;

  return (
    <div className="screen inventory-screen screen-overlay">
      <div className="inventory-header">
        <h2>INVENTORY</h2>
        <button className="btn-close" onClick={handleClose}>✕</button>
      </div>

      {/* Tabs */}
      <div className="inventory-tabs">
        <button
          className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          Inventory ({items.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'storage' ? 'active' : ''}`}
          onClick={() => setActiveTab('storage')}
        >
          Storage ({storageItems.length})
        </button>
      </div>

      <div className="inventory-tools">
        {(['all', 'weapons', 'healing', 'key'] as const).map((f) => (
          <button key={f} className={`tab-btn compact ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'key' ? 'Key Items' : f}
          </button>
        ))}
        <button className="tab-btn compact" onClick={handleRotateSelected} disabled={!selectedItem || activeTab !== 'inventory'}>
          Rotate
        </button>
      </div>

      {/* Grid */}
      <div className="inventory-grid-container">
        <div className="inventory-grid">
          {Array.from({ length: 48 }, (_, i) => {
            const gridY = Math.floor(i / 8);
            const gridX = i % 8;
            const item = currentItems.find(
              (it) =>
                visibleItemIds.has(it.id) &&
                gridX >= it.gridX &&
                gridX < it.gridX + (it.rotated ? it.height : it.width) &&
                gridY >= it.gridY &&
                gridY < it.gridY + (it.rotated ? it.width : it.height)
            );

            if (item && item.gridX === gridX && item.gridY === gridY) {
              const template = ITEM_TEMPLATES[item.templateId];
              const w = item.rotated ? item.height : item.width;
              const h = item.rotated ? item.width : item.height;
              const isEquipped = equippedWeapon === item.id;
              const isSelected = selectedItemId === item.id;
              const inCombineMode = combineMode;

              return (
                <div
                  key={`${item.id}-${i}`}
                  className={`grid-item ${isEquipped ? 'equipped' : ''} ${isSelected ? 'selected' : ''} ${inCombineMode ? 'combine-target' : ''} ${template?.isWeapon ? 'weapon' : ''} ${template?.isHealing ? 'healing' : ''}`}
                  style={{
                    gridColumn: `${gridX + 1} / span ${w}`,
                    gridRow: `${gridY + 1} / span ${h}`,
                  }}
                  onClick={() => {
                    if (combineMode) {
                      handleCombine(item.id);
                    } else {
                      setSelectedItemId(item.id === selectedItemId ? null : item.id);
                    }
                  }}
                  draggable={activeTab === 'inventory'}
                  onDragStart={() => setDraggingItemId(item.id)}
                  onDragEnd={() => setDraggingItemId(null)}
                >
                  <span className="item-icon">{template?.icon || '?'}</span>
                  <span className="item-name">{template?.name || item.templateId}</span>
                  {item.quantity > 1 && (
                    <span className="item-quantity">{item.quantity}</span>
                  )}
                </div>
              );
            }

            return (
              <div
                key={i}
                className={`grid-cell ${draggingItemId ? 'drop-target' : ''}`}
                style={{ gridColumn: gridX + 1, gridRow: gridY + 1 }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropOnCell(gridX, gridY)}
              />
            );
          })}
        </div>
      </div>

      {/* Item Info / Actions */}
      {selectedItem && selectedTemplate && (
        <div className="item-info">
          <h3>{selectedTemplate.icon} {selectedTemplate.name}</h3>
          <p className="item-description">{selectedTemplate.description}</p>
          <div className="item-actions">
            {selectedTemplate.isWeapon && (
              <button
                className="btn-action"
                onClick={() => handleEquip(selectedItem.id)}
              >
                {equippedWeapon === selectedItem.id ? 'Equipped' : 'Equip'}
              </button>
            )}
            {selectedTemplate.isHealing && (
              <button className="btn-action" onClick={handleUse}>
                Use
              </button>
            )}
            {selectedTemplate.isCombineable && (
              <button
                className={`btn-action ${combineMode ? 'active' : ''}`}
                onClick={() => setCombineMode(!combineMode)}
              >
                {combineMode ? 'Cancel Combine' : 'Combine'}
              </button>
            )}
            {activeTab === 'inventory' && (
              <button
                className="btn-action"
                onClick={() => currentTransfer(selectedItem.id)}
              >
                {transferLabel}
              </button>
            )}
            {activeTab === 'storage' && (
              <button
                className="btn-action"
                onClick={() => currentTransfer(selectedItem.id)}
              >
                Take
              </button>
            )}
            {selectedTemplate.examineHint && (
              <button
                className="btn-action"
                onClick={() => {
                  useGameStore.getState().showSubtitle(selectedTemplate.examineHint!, 5);
                }}
              >
                Examine
              </button>
            )}
            <button
              className="btn-action danger"
              onClick={() => {
                if (window.confirm(`Drop ${selectedTemplate.name}?`)) {
                  removeItem(selectedItem.id);
                  setSelectedItemId(null);
                }
              }}
            >
              Drop
            </button>
          </div>
        </div>
      )}

      {/* Quick instructions */}
      <div className="inventory-footer">
        <p>Click item to select | Equip weapons | Combine items | Press Tab to close</p>
      </div>
    </div>
  );
}
