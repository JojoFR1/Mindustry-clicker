// scripts/logic.js
// Quick Controls: Enabled when Logic Processor (micro-processor) is level >= 1

function buildQuickControls() {
    const container = document.getElementById('quick-controls-container');
    if (!container) return;
    container.innerHTML = '';

    // --- 1. FACTORY BLOCKS ---
    const allBlocks = window.getAllBlocks ? window.getAllBlocks() : [];
    const targetBlocks = allBlocks.filter(b => b.id !== 'micro-processor' && b.maxLevel > 1);

    if (targetBlocks.length > 0) {
        createQuickSection(container, 'Quick Factory Controls', targetBlocks, 'block');
    }

    // --- 2. SECTOR UPGRADES ---
    const allUpgrades = window.getUpgradesArray ? window.getUpgradesArray() : [];
    const targetUpgrades = allUpgrades.filter(u => u.maxLevel > 1);

    if (targetUpgrades.length > 0) {
        createQuickSection(container, 'Quick Upgrade Controls', targetUpgrades, 'upgrade');
    }

    if (targetBlocks.length === 0 && targetUpgrades.length === 0) {
        container.innerHTML = '<p style="color:#aaa; font-size:0.85em;">No items available yet.</p>';
    }
}

function createQuickSection(parent, title, items, type) {
    const header = document.createElement('h3');
    header.textContent = title;
    header.style.cssText = 'margin:16px 0 12px; color:#fff; font-size:1em; border-bottom:1px solid #444; padding-bottom:8px;';
    parent.appendChild(header);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:flex; flex-direction:column; gap:8px;';

    items.forEach(item => {
        const row = document.createElement('div');
        row.id = `quick-ctrl-${item.id}`;
        row.style.cssText = 'display:flex; align-items:center; gap:8px; background:#2f3136; border-radius:6px; padding:6px 10px;';

        const icon = document.createElement('img');
        icon.src = item.sprite;
        icon.style.cssText = 'width:24px; height:24px; object-fit:contain; flex-shrink:0;';

        const nameSpan = document.createElement('span');
        nameSpan.id = `quick-name-${item.id}`;
        nameSpan.style.cssText = 'flex:1; font-size:0.85em; color:#dcddde; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;';
        
        const currentLvl = type === 'block' ? item.level : item.currentLevel;
        nameSpan.textContent = `${item.name} (Lvl ${currentLvl}/${item.maxLevel})`;

        const minusBtn = document.createElement('button');
        minusBtn.className = 'logic-quick-btn';
        minusBtn.textContent = '−';
        minusBtn.style.cssText = 'width:28px; height:28px; background:#4f545c; border:none; border-radius:4px; color:#fff; font-size:1.1em; cursor:pointer; flex-shrink:0; transition:background 0.15s;';
        minusBtn.onmouseover = () => minusBtn.style.background = '#da3633';
        minusBtn.onmouseout = () => minusBtn.style.background = '#4f545c';
        minusBtn.onclick = (e) => {
            e.stopPropagation();
            if (type === 'block') refundBlock(item);
            else refundUpgrade(item);
            updateQuickRow(item, type, nameSpan, minusBtn, addBtn);
        };

        const addBtn = document.createElement('button');
        addBtn.className = 'logic-quick-btn';
        addBtn.textContent = '+';
        addBtn.style.cssText = 'width:28px; height:28px; background:#4f545c; border:none; border-radius:4px; color:#fff; font-size:1.1em; cursor:pointer; flex-shrink:0; transition:background 0.15s;';
        addBtn.onmouseover = () => addBtn.style.background = '#43b581';
        addBtn.onmouseout = () => addBtn.style.background = '#4f545c';
        addBtn.onclick = (e) => {
            e.stopPropagation();
            if (type === 'block') window.attemptBuyBlockById(item.id);
            else attemptBuyUpgradeById(item.id);
            updateQuickRow(item, type, nameSpan, minusBtn, addBtn);
        };

        row.appendChild(icon);
        row.appendChild(nameSpan);
        row.appendChild(minusBtn);
        row.appendChild(addBtn);
        grid.appendChild(row);

        updateQuickRow(item, type, nameSpan, minusBtn, addBtn);
    });

    parent.appendChild(grid);
}

function updateQuickRow(item, type, nameSpan, minusBtn, addBtn) {
    if (!nameSpan) return;
    const currentLvl = type === 'block' ? item.level : item.currentLevel;
    nameSpan.textContent = `${item.name} (Lvl ${currentLvl}/${item.maxLevel})`;
    minusBtn.disabled = currentLvl <= 0;
    minusBtn.style.opacity = currentLvl <= 0 ? '0.4' : '1';
    addBtn.disabled = currentLvl >= item.maxLevel;
    addBtn.style.opacity = currentLvl >= item.maxLevel ? '0.4' : '1';
}

function refundBlock(block) {
    if (block.level <= 0) return;
    block.level--;
    // Refund 60% of the CURRENT cost (since it's scaled)
    if (window.addResources) {
        const refund = {};
        for (const r in block.cost) refund[r] = Math.floor(block.cost[r] * 0.6);
        window.addResources(refund);
    }
    // Recalculate cost for new level
    if (block.level > 0) {
        for (const r in block.cost) block.cost[r] = Math.ceil(block.cost[r] / (block.cost_multiplier || 1.5));
    } else {
        block.cost = JSON.parse(JSON.stringify(block.base_cost));
    }
    if (window.recalculateNominalStats) window.recalculateNominalStats();
    if (window.recalculateTotalBlockConsumption) window.recalculateTotalBlockConsumption();
    window.guiDirty = true;
}

function refundUpgrade(u) {
    if (u.currentLevel <= 0) return;
    u.currentLevel--;
    // Refund 60%
    if (window.addResources) {
        const refund = {};
        for (const r in u.cost) refund[r] = Math.floor(u.cost[r] * 0.6);
        window.addResources(refund);
    }
    // Revert cost manually (inverse of 1.35 as defined in upgrades.js)
    if (u.currentLevel > 0) {
        for (const r in u.cost) u.cost[r] = Math.ceil(u.cost[r] / 1.35);
    } else {
        u.cost = JSON.parse(JSON.stringify(u.base_cost));
    }
    // Recalculate global stats if mining/auto changed
    if (window.recalculateGlobalStats) window.recalculateGlobalStats();
    window.guiDirty = true;
}

function attemptBuyUpgradeById(id) {
    const u = (window.getUpgradesArray ? window.getUpgradesArray() : []).find(u => u.id === id);
    if (!u || u.currentLevel >= u.maxLevel) return false;
    const res = window.getGameResources ? window.getGameResources() : {};
    for (const r in u.cost) if ((res[r] || 0) < u.cost[r]) return false;
    
    if (window.subtractResources(u.cost)) {
        u.currentLevel++;
        if (u.currentLevel < u.maxLevel) {
            for (const r in u.cost) u.cost[r] = Math.ceil(u.cost[r] * 1.35);
        }
        if (u.onBuy) u.onBuy();
        if (window.recalculateGlobalStats) window.recalculateGlobalStats();
        window.guiDirty = true;
        return true;
    }
    return false;
}

window.refreshQuickControls = function () {
    const blocks = window.getAllBlocks ? window.getAllBlocks() : [];
    const upgrades = window.getUpgradesArray ? window.getUpgradesArray() : [];
    
    blocks.forEach(b => {
        const row = document.getElementById(`quick-ctrl-${b.id}`);
        if (row) updateQuickRow(b, 'block', row.children[1], row.children[2], row.children[3]);
    });
    upgrades.forEach(u => {
        const row = document.getElementById(`quick-ctrl-${u.id}`);
        if (row) updateQuickRow(u, 'upgrade', row.children[1], row.children[2], row.children[3]);
    });
};

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
    document.addEventListener('checkUpgrades', window.updateLogicQuickControls);
    document.addEventListener('resourcesUpdated', () => {
        if (window.isLogicUnlocked && window.isLogicUnlocked()) window.refreshQuickControls();
    });
});
