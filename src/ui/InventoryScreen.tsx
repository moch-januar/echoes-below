import { useState } from 'react';
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

  if (screen !== 'inventory') return null;

  const currentItems = activeTab === 'inventory' ? items : storageItems;
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

      {/* Grid */}
      <div className="inventory-grid-container">
        <div className="inventory-grid">
          {Array.from({ length: 48 }, (_, i) => {
            const gridY = Math.floor(i / 8);
            const gridX = i % 8;
            const item = currentItems.find(
              (it) =>
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
              <div key={i} className="grid-cell" style={{ gridColumn: gridX + 1, gridRow: gridY + 1 }} />
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
