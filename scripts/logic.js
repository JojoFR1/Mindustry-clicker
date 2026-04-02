// scripts/logic.js
// Quick Controls: Enabled when Logic Processor (logicBlocks) is level >= 1

function buildQuickControls() {
    const container = document.getElementById('quick-controls-container');
    if (!container) return;
    container.innerHTML = '';

    const allBlocks = window.getAllBlocks ? window.getAllBlocks() : [];
    // Exclude the logic-processor itself and battery/storage-only blocks
    const targetBlocks = allBlocks.filter(b =>
        b.id !== 'logic-processor' && b.maxLevel > 1
    );

    if (targetBlocks.length === 0) {
        container.innerHTML = '<p style="color:#aaa; font-size:0.85em;">No factory blocks available yet.</p>';
        return;
    }

    const header = document.createElement('h3');
    header.textContent = 'Quick Factory Controls';
    header.style.cssText = 'margin:0 0 12px; color:#fff; font-size:1em; border-bottom:1px solid #444; padding-bottom:8px;';
    container.appendChild(header);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:flex; flex-direction:column; gap:8px;';

    targetBlocks.forEach(block => {
        const row = document.createElement('div');
        row.id = `quick-ctrl-${block.id}`;
        row.style.cssText = 'display:flex; align-items:center; gap:8px; background:#2f3136; border-radius:6px; padding:6px 10px;';

        const icon = document.createElement('img');
        icon.src = block.sprite;
        icon.style.cssText = 'width:24px; height:24px; object-fit:contain; flex-shrink:0;';

        const nameSpan = document.createElement('span');
        nameSpan.id = `quick-name-${block.id}`;
        nameSpan.style.cssText = 'flex:1; font-size:0.85em; color:#dcddde; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;';
        nameSpan.textContent = `${block.name} (Lvl ${block.level}/${block.maxLevel})`;

        const minusBtn = document.createElement('button');
        minusBtn.className = 'logic-quick-btn';
        minusBtn.textContent = '−';
        minusBtn.title = `Remove one ${block.name}`;
        minusBtn.style.cssText = 'width:28px; height:28px; background:#4f545c; border:none; border-radius:4px; color:#fff; font-size:1.1em; cursor:pointer; flex-shrink:0; transition:background 0.15s;';
        minusBtn.onmouseover = () => minusBtn.style.background = '#da3633';
        minusBtn.onmouseout = () => minusBtn.style.background = '#4f545c';
        minusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (block.level > 0) {
                block.level--;
                // Refund half the scaled cost
                if (window.addResources) {
                    const refund = {};
                    for (const r in block.base_cost || block.cost) {
                        refund[r] = Math.floor(block.cost[r] / 2);
                    }
                    window.addResources(refund);
                }
                // Recalculate cost for new level
                if (block.level < block.maxLevel && block.level > 0) {
                    for (const r in block.cost) {
                        block.cost[r] = Math.ceil(block.cost[r] / (block.cost_multiplier || 1.5));
                    }
                } else if (block.level === 0) {
                    // Reset to base cost
                    block.cost = JSON.parse(JSON.stringify(block.base_cost || block.cost));
                }
                if (window.recalculateNominalStats) window.recalculateNominalStats();
                if (window.recalculateTotalBlockConsumption) window.recalculateTotalBlockConsumption();
                window.guiDirty = true;
                updateQuickControlRow(block, nameSpan, minusBtn, addBtn);
            }
        });

        const addBtn = document.createElement('button');
        addBtn.className = 'logic-quick-btn';
        addBtn.textContent = '+';
        addBtn.title = `Add one ${block.name}`;
        addBtn.style.cssText = 'width:28px; height:28px; background:#4f545c; border:none; border-radius:4px; color:#fff; font-size:1.1em; cursor:pointer; flex-shrink:0; transition:background 0.15s;';
        addBtn.onmouseover = () => addBtn.style.background = '#43b581';
        addBtn.onmouseout = () => addBtn.style.background = '#4f545c';
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Attempt buy using existing block buy logic
            if (window.attemptBuyBlockById) {
                window.attemptBuyBlockById(block.id);
            } else {
                // Inline fallback
                const res = window.getGameResources ? window.getGameResources() : {};
                let canAfford = true;
                for (const r in block.cost) {
                    if ((res[r] || 0) < block.cost[r]) { canAfford = false; break; }
                }
                if (canAfford && block.level < block.maxLevel) {
                    if (window.subtractResources) window.subtractResources(block.cost);
                    block.level++;
                    if (block.level < block.maxLevel) {
                        for (const r in block.cost) block.cost[r] = Math.ceil(block.cost[r] * (block.cost_multiplier || 1.5));
                    }
                    if (window.recalculateNominalStats) window.recalculateNominalStats();
                    if (window.recalculateTotalBlockConsumption) window.recalculateTotalBlockConsumption();
                    window.guiDirty = true;
                }
            }
            updateQuickControlRow(block, nameSpan, minusBtn, addBtn);
        });

        row.appendChild(icon);
        row.appendChild(nameSpan);
        row.appendChild(minusBtn);
        row.appendChild(addBtn);
        grid.appendChild(row);

        updateQuickControlRow(block, nameSpan, minusBtn, addBtn);
    });

    container.appendChild(grid);
}

function updateQuickControlRow(block, nameSpan, minusBtn, addBtn) {
    if (!nameSpan) return;
    nameSpan.textContent = `${block.name} (Lvl ${block.level}/${block.maxLevel})`;
    minusBtn.disabled = block.level <= 0;
    minusBtn.style.opacity = block.level <= 0 ? '0.4' : '1';
    addBtn.disabled = block.level >= block.maxLevel;
    addBtn.style.opacity = block.level >= block.maxLevel ? '0.4' : '1';
}

// Refresh all quick control row labels (called from game loop)
window.refreshQuickControls = function () {
    const allBlocks = window.getAllBlocks ? window.getAllBlocks() : [];
    allBlocks.forEach(block => {
        const nameSpan = document.getElementById(`quick-name-${block.id}`);
        const row = document.getElementById(`quick-ctrl-${block.id}`);
        if (!nameSpan || !row) return;
        const minusBtn = row.children[2];
        const addBtn = row.children[3];
        updateQuickControlRow(block, nameSpan, minusBtn, addBtn);
    });
};

// Expose for blocks.js buy button
window.attemptBuyBlockById = function (blockId) {
    const allBlocks = window.getAllBlocks ? window.getAllBlocks() : [];
    const block = allBlocks.find(b => b.id === blockId);
    if (!block || block.level >= block.maxLevel) return false;
    const res = window.getGameResources ? window.getGameResources() : {};
    for (const r in block.cost) {
        if ((res[r] || 0) < block.cost[r]) return false;
    }
    if (!window.subtractResources(block.cost)) return false;
    block.level++;
    if (block.level === 1) {
        if (block.output_resource && window.unlockResource) window.unlockResource(block.output_resource);
        if (block.fluid_output_resource && window.unlockResource) window.unlockResource(block.fluid_output_resource);
    }
    if (block.level < block.maxLevel) {
        for (const r in block.cost) block.cost[r] = Math.ceil(block.cost[r] * (block.cost_multiplier || 1.5));
    }
    if (window.recalculateNominalStats) window.recalculateNominalStats();
    if (window.recalculateTotalBlockConsumption) window.recalculateTotalBlockConsumption();
    window.guiDirty = true;
    document.dispatchEvent(new CustomEvent('checkUpgrades'));
    return true;
};

// Check and show/hide the quick controls container
window.updateLogicQuickControls = function () {
    const container = document.getElementById('quick-controls-container');
    if (!container) return;
    const isUnlocked = window.isLogicUnlocked ? window.isLogicUnlocked() : false;
    if (isUnlocked && container.style.display === 'none') {
        container.style.display = 'block';
        buildQuickControls();
    } else if (isUnlocked) {
        window.refreshQuickControls();
    } else {
        container.style.display = 'none';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Rebuild controls when logic block is bought
    document.addEventListener('checkUpgrades', window.updateLogicQuickControls);
    document.addEventListener('resourcesUpdated', () => {
        if (window.isLogicUnlocked && window.isLogicUnlocked()) {
            window.refreshQuickControls();
        }
    });
});
