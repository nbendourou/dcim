    if (!rack) return;
    
    const equips = STATE.data.equipements.filter(e => e.rack_fk === rackId);
    
    // Update title
    document.getElementById('rackDetailTitle').textContent = rackId + ' - ' + (rack.designation || '');
    
    // Render visual rack
    renderRackVisual(rackId, equips);
    
    // Render info panel
    renderRackInfo(rack, equips);
}

function renderRackVisual(rackId, equips) {
    const container = document.getElementById('rackVisual');
    if (!container) return;
    
    // Create slot map
    const slotMap = {};
    equips.forEach(e => {
        const startU = parseInt(e.u_position) || 1;
        const height = parseInt(e.hauteur_u) || 1;
        for (let u = startU; u < startU + height; u++) {
            slotMap[u] = {
                equip: e,
                isStart: u === startU,
                isEnd: u === startU + height - 1
            };
        }
    });
    
    // Build visual
    let html = '<div class="rack-frame">';
    for (let u = CONFIG.RACK_HEIGHT; u >= 1; u--) {
        const slot = slotMap[u];
        let classes = 'rack-u-slot';
        let content = '';
        
        if (slot) {
            classes += slot.equip.type_alimentation === 'DC' ? ' occupied-dc' : ' occupied';
            if (slot.isStart) {
                classes += ' equipment-start';
                content = `<span class="equipment-label">${slot.equip.nom_equipement}</span>`;
            }
            if (slot.isEnd) classes += ' equipment-end';
        }
        
        html += `
            <div class="${classes}" onclick="${slot ? `showEquipDetail('${slot.equip.id}')` : `addEquipAtU(${u})`}" title="${slot ? slot.equip.nom_equipement : 'U' + u + ' - Vide'}">
                <span class="rack-u-number">${u}</span>
                ${content}
            </div>
        `;
    }
    html += '</div>';
    
    // Legend
    html += `
        <div style="margin-top: 16px; display: flex; gap: 16px; font-size: 12px;">
            <div><span style="display: inline-block; width: 16px; height: 16px; background: #3b82f6; border-radius: 4px; vertical-align: middle; margin-right: 6px;"></span>AC</div>
            <div><span style="display: inline-block; width: 16px; height: 16px; background: #8b5cf6; border-radius: 4px; vertical-align: middle; margin-right: 6px;"></span>DC</div>
            <div><span style="display: inline-block; width: 16px; height: 16px; background: #0a0e17; border: 1px solid #2d3a4f; border-radius: 4px; vertical-align: middle; margin-right: 6px;"></span>Vide</div>
        </div>
    `;
    
    container.innerHTML = html;
}

function renderRackInfo(rack, equips) {
    const container = document.getElementById('rackInfo');
    if (!container) return;
    
    const usedU = equips.reduce((sum, e) => sum + (parseInt(e.hauteur_u) || 0), 0);
    const freeU = CONFIG.RACK_HEIGHT - usedU;
    const pctU = (usedU / CONFIG.RACK_HEIGHT) * 100;
    
    const power = calculateRackPower(rack.id);
    const maxPower = parseFloat(rack.puissance_pdu_kw) || 22;
    const pctPower = (power / maxPower) * 100;
    
    // Group equipment by type
    const byType = {};
    equips.forEach(e => {
        byType[e.type_equipement] = (byType[e.type_equipement] || 0) + 1;
    });
    
    container.innerHTML = `
        <div class="rack-info-section">
            <h4>Informations</h4>
            <div class="rack-info-item">
                <span class="rack-info-label">Salle</span>
                <span class="rack-info-value">${rack.salle}</span>
            </div>
            <div class="rack-info-item">
                <span class="rack-info-label">Rangée</span>
                <span class="rack-info-value">${rack.rangee}</span>
            </div>
            <div class="rack-info-item">
                <span class="rack-info-label">Désignation</span>
                <span class="rack-info-value">${rack.designation || '-'}</span>
            </div>
            <div class="rack-info-item">
                <span class="rack-info-label">Porteur</span>
                <span class="rack-info-value">${rack.porteur || '-'}</span>
            </div>
        </div>
        
        <div class="rack-info-section">
            <h4>Capacité U</h4>
            <div class="power-bar-container">
                <div class="power-bar-label">
                    <span>${usedU} U utilisés</span>
                    <span>${freeU} U libres</span>
                </div>
                <div class="power-bar">
                    <div class="power-bar-fill" style="width: ${pctU}%; background: ${getStatusColor(pctU)}"></div>
                </div>
            </div>
        </div>
        
        <div class="rack-info-section">
            <h4>Puissance</h4>
            <div class="power-bar-container">
                <div class="power-bar-label">
                    <span>${power.toFixed(1)} kW</span>
                    <span>Max: ${maxPower} kW</span>
                </div>
                <div class="power-bar">
                    <div class="power-bar-fill" style="width: ${pctPower}%; background: ${getStatusColor(pctPower)}"></div>
                </div>
            </div>
        </div>
        
        <div class="rack-info-section">
            <h4>Équipements (${equips.length})</h4>
            <div class="equip-mini-list">
                ${equips.map(e => `
                    <div class="equip-mini-item" onclick="showEquipDetail('${e.id}')">
                        <div class="equip-mini-icon ${e.type_alimentation?.toLowerCase() || 'ac'}">
                            <i class="fas fa-${e.type_equipement === 'Serveur' ? 'server' : e.type_equipement === 'Switch' ? 'network-wired' : 'microchip'}"></i>
                        </div>
                        <div class="equip-mini-info">
                            <div class="equip-mini-name">${e.nom_equipement}</div>
                            <div class="equip-mini-pos">U${e.u_position} - ${e.hauteur_u}U - ${e.type_alimentation}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="btn btn-primary full-width" style="margin-top: 12px;" onclick="openModal('equipement', null, '${rack.id}')">
                <i class="fas fa-plus"></i> Ajouter un équipement
            </button>
        </div>
    `;
}

function calculateRackPower(rackId) {
    const equips = STATE.data.equipements.filter(e => e.rack_fk === rackId);
    let power = 0;
    
    equips.forEach(e => {
        const connsAC = STATE.data.connexionsAC.filter(c => c.equipement_fk === e.id);
        const connsDC = STATE.data.connexionsDC.filter(c => c.equipement_fk === e.id);
        connsAC.forEach(c => power += parseFloat(c.puissance_kw) || 0);
        connsDC.forEach(c => power += parseFloat(c.puissance_kw) || 0);
    });
    
    return power;
}

// ============================================
// EQUIPEMENTS TABLE
// ============================================
function renderEquipementsTable() {
    const tbody = document.getElementById('equipTableBody');
    if (!tbody) return;
    
    const search = document.getElementById('equipSearch')?.value?.toLowerCase() || '';
    const typeFilter = document.getElementById('equipTypeFilter')?.value || '';
    const alimFilter = document.getElementById('equipAlimFilter')?.value || '';
    
    let equips = STATE.data.equipements;
    
    if (search) equips = equips.filter(e => e.nom_equipement?.toLowerCase().includes(search) || e.rack_fk?.toLowerCase().includes(search));
    if (typeFilter) equips = equips.filter(e => e.type_equipement === typeFilter);
    if (alimFilter) equips = equips.filter(e => e.type_alimentation === alimFilter);
    
    tbody.innerHTML = equips.map(e => {
        const power = getEquipPower(e.id);
        return `
            <tr>
                <td><strong>${e.nom_equipement}</strong></td>
                <td>${e.type_equipement || '-'}</td>
                <td><span class="badge ${e.type_alimentation?.toLowerCase() || 'ac'}">${e.type_alimentation || 'AC'}</span></td>
                <td>${e.rack_fk}</td>
                <td>U${e.u_position} (${e.hauteur_u}U)</td>
                <td>${power.toFixed(2)} kW</td>
                <td><span class="badge active">${e.statut || 'Actif'}</span></td>
                <td>
                    <button class="btn btn-sm" onclick="openModal('equipement', '${e.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteItem('equipement', '${e.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function getEquipPower(equipId) {
    const connsAC = STATE.data.connexionsAC.filter(c => c.equipement_fk === equipId);
    const connsDC = STATE.data.connexionsDC.filter(c => c.equipement_fk === equipId);
    return [...connsAC, ...connsDC].reduce((sum, c) => sum + (parseFloat(c.puissance_kw) || 0), 0);
}

// ============================================
// TREE VIEW (ARBORESCENCE)
// ============================================
function renderTree() {
    const container = document.getElementById('treeContainer');
    if (!container) return;
    
    const chainFilter = document.getElementById('treeChainFilter')?.value || '';
    
    // Group boitiers by canalis
    const canalisMap = {};
    STATE.data.boitiersAC.forEach(b => {
        if (!canalisMap[b.canalis]) canalisMap[b.canalis] = [];
        canalisMap[b.canalis].push(b);
    });
    
    // Group tableaux by redresseur
    const redresseurMap = {};
    STATE.data.tableauxDC.forEach(t => {
        if (!redresseurMap[t.redresseur]) redresseurMap[t.redresseur] = [];
        redresseurMap[t.redresseur].push(t);
    });
    
    let html = '<div class="tree-root">';
    
    // Canalis tree
    html += '<h4 style="margin-bottom: 16px; color: var(--cyan);"><i class="fas fa-bolt"></i> Distribution AC (Canalis)</h4>';
    Object.entries(canalisMap).forEach(([canalis, boitiers]) => {
        const connectedEquips = [];
        boitiers.forEach(b => {
            STATE.data.connexionsAC.filter(c => c.boitier_fk === b.id).forEach(conn => {
                const equip = STATE.data.equipements.find(e => e.id === conn.equipement_fk);
                if (equip) connectedEquips.push({ ...equip, conn });
            });
        });
        
        html += `
            <div class="tree-item" onclick="toggleTreeNode(this)">
                <div class="tree-icon canalis"><i class="fas fa-grip-lines"></i></div>
                <div class="tree-label">
                    <div class="tree-name">${canalis}</div>
                    <div class="tree-meta">${boitiers.length} boîtiers | ${connectedEquips.length} équipements</div>
                </div>
                <div class="tree-toggle"><i class="fas fa-chevron-down"></i></div>
            </div>
            <div class="tree-children" style="display: none;">
                ${boitiers.map(b => {
                    const bEquips = STATE.data.connexionsAC.filter(c => c.boitier_fk === b.id);
                    return `
                        <div class="tree-node">
                            <div class="tree-item">
                                <div class="tree-icon boitier"><i class="fas fa-box"></i></div>
                                <div class="tree-label">
                                    <div class="tree-name">${b.id}</div>
                                    <div class="tree-meta">Rangée ${b.rangee} | ${b.configuration} | ${bEquips.length} connexions</div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    });
    
    // DC tree
    html += '<h4 style="margin: 24px 0 16px; color: var(--purple);"><i class="fas fa-car-battery"></i> Distribution DC (Redresseurs)</h4>';
    Object.entries(redresseurMap).forEach(([redresseur, tableaux]) => {
        const connectedEquips = [];
        tableaux.forEach(t => {
            STATE.data.connexionsDC.filter(c => c.tableau_dc_fk === t.id).forEach(conn => {
                const equip = STATE.data.equipements.find(e => e.id === conn.equipement_fk);
                if (equip) connectedEquips.push({ ...equip, conn });
            });
        });
        
        html += `
            <div class="tree-item" onclick="toggleTreeNode(this)">
                <div class="tree-icon redresseur"><i class="fas fa-charging-station"></i></div>
                <div class="tree-label">
                    <div class="tree-name">${redresseur}</div>
                    <div class="tree-meta">${tableaux.length} tableaux | ${connectedEquips.length} équipements</div>
                </div>
                <div class="tree-toggle"><i class="fas fa-chevron-down"></i></div>
            </div>
            <div class="tree-children" style="display: none;">
                ${tableaux.map(t => {
                    const tEquips = STATE.data.connexionsDC.filter(c => c.tableau_dc_fk === t.id);
                    return `
                        <div class="tree-node">
                            <div class="tree-item">
                                <div class="tree-icon tableau"><i class="fas fa-table-cells"></i></div>
                                <div class="tree-label">
                                    <div class="tree-name">${t.id}</div>
                                    <div class="tree-meta">${tEquips.length} disjoncteurs utilisés</div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function toggleTreeNode(element) {
    const children = element.nextElementSibling;
    if (children && children.classList.contains('tree-children')) {
        children.style.display = children.style.display === 'none' ? 'block' : 'none';
        const icon = element.querySelector('.tree-toggle i');
        if (icon) icon.classList.toggle('fa-chevron-down');
        if (icon) icon.classList.toggle('fa-chevron-up');
    }
}

// ============================================
// CANALIS PAGE
// ============================================
function renderCanalisPage() {
    const tree = document.getElementById('canalisTree');
    if (!tree) return;
    
    // Group by canalis
    const canalisMap = {};
    STATE.data.boitiersAC.forEach(b => {
        if (!canalisMap[b.canalis]) canalisMap[b.canalis] = { salle: b.salle, boitiers: [] };
        canalisMap[b.canalis].boitiers.push(b);
    });
    
    tree.innerHTML = Object.entries(canalisMap).map(([canalis, data]) => `
        <div class="canalis-item" onclick="selectCanalis('${canalis}')">
            <div class="canalis-name"><i class="fas fa-grip-lines"></i> ${canalis}</div>
            <div class="canalis-meta">Salle: ${data.salle} | ${data.boitiers.length} boîtiers</div>
            <div class="boitiers-list">
                ${data.boitiers.map(b => `
                    <div class="boitier-item ${STATE.selectedBoitier === b.id ? 'selected' : ''}" onclick="event.stopPropagation(); selectBoitier('${b.id}')">
                        <i class="fas fa-box"></i> ${b.id} (${b.configuration})
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function selectBoitier(boitierId) {
    STATE.selectedBoitier = boitierId;
    renderCanalisPage();
    renderBoitierDetail(boitierId);
}

function renderBoitierDetail(boitierId) {
    const container = document.getElementById('boitierDetail');
    const boitier = STATE.data.boitiersAC.find(b => b.id === boitierId);
    if (!container || !boitier) return;
    
    const connexions = STATE.data.connexionsAC.filter(c => c.boitier_fk === boitierId);
    
    container.innerHTML = `
        <h3 style="margin-bottom: 16px;">${boitier.id}</h3>
        <div class="rack-info-section">
            <h4>Informations</h4>
            <div class="rack-info-item"><span class="rack-info-label">Canalis</span><span class="rack-info-value">${boitier.canalis}</span></div>
            <div class="rack-info-item"><span class="rack-info-label">Salle</span><span class="rack-info-value">${boitier.salle}</span></div>
            <div class="rack-info-item"><span class="rack-info-label">Configuration</span><span class="rack-info-value">${boitier.configuration}</span></div>
            <div class="rack-info-item"><span class="rack-info-label">Rangée</span><span class="rack-info-value">${boitier.rangee}</span></div>
        </div>
        <div class="rack-info-section">
            <h4>Équipements connectés (${connexions.length})</h4>
            ${connexions.map(c => {
                const equip = STATE.data.equipements.find(e => e.id === c.equipement_fk);
                return equip ? `
                    <div class="equip-mini-item">
                        <div class="equip-mini-icon ac"><i class="fas fa-plug"></i></div>
                        <div class="equip-mini-info">
                            <div class="equip-mini-name">${equip.nom_equipement}</div>
                            <div class="equip-mini-pos">Voie ${c.voie} | Prise ${c.prise_utilisee} | ${c.phase} | ${c.puissance_kw} kW</div>
                        </div>
                    </div>
                ` : '';
            }).join('')}
        </div>
        <button class="btn btn-primary" onclick="openModal('connexion', null, '${boitierId}')">
            <i class="fas fa-plus"></i> Ajouter connexion
        </button>
    `;
}

// ============================================
// TABLEAUX DC PAGE
// ============================================
function renderTableauxDCPage() {
    const list = document.getElementById('tableauxDCList');
    if (!list) return;
    
    list.innerHTML = STATE.data.tableauxDC.map(t => {
        const connexions = STATE.data.connexionsDC.filter(c => c.tableau_dc_fk === t.id);
        return `
            <div class="tableau-item ${STATE.selectedTableau === t.id ? 'selected' : ''}" onclick="selectTableauDC('${t.id}')">
                <div style="font-weight: 600;">${t.id}</div>
                <div style="font-size: 12px; color: var(--text-secondary);">Redresseur: ${t.redresseur} | ${connexions.length} disj. utilisés</div>
            </div>
        `;
    }).join('');
}

function selectTableauDC(tableauId) {
    STATE.selectedTableau = tableauId;
    renderTableauxDCPage();
    renderTableauDCDetail(tableauId);
}

function renderTableauDCDetail(tableauId) {
    const container = document.getElementById('tableauDCDetail');
    const tableau = STATE.data.tableauxDC.find(t => t.id === tableauId);
    if (!container || !tableau) return;
    
    const connexions = STATE.data.connexionsDC.filter(c => c.tableau_dc_fk === tableauId);
    
    // Create disjoncteur slots
    const calibres = [25, 32, 40, 63, 80, 100, 125];
    let slotsHtml = '';
    calibres.forEach(cal => {
        const total = parseInt(tableau['total_' + cal + 'a']) || 0;
        if (total > 0) {
            const used = connexions.filter(c => c.calibre_a == cal).length;
            slotsHtml += `<div style="margin-bottom: 16px;"><h5>${cal}A (${used}/${total} utilisés)</h5><div class="disjoncteur-grid">`;
            for (let i = 1; i <= total; i++) {
                const conn = connexions.find(c => c.calibre_a == cal && c.numero_disjoncteur == i);
                slotsHtml += `<div class="disjoncteur-slot ${conn ? 'used' : 'available'}">${i}${conn ? '<br><small>' + (STATE.data.equipements.find(e => e.id === conn.equipement_fk)?.nom_equipement?.substring(0, 10) || '') + '</small>' : ''}</div>`;
            }
            slotsHtml += '</div></div>';
        }
    });
    
    container.innerHTML = `
        <h3 style="margin-bottom: 16px;">${tableau.id}</h3>
        <div class="rack-info-section">
            <div class="rack-info-item"><span class="rack-info-label">Redresseur</span><span class="rack-info-value">${tableau.redresseur}</span></div>
            <div class="rack-info-item"><span class="rack-info-label">Salle</span><span class="rack-info-value">${tableau.salle}</span></div>
        </div>
        <div class="rack-info-section">
            <h4>Disjoncteurs</h4>
            ${slotsHtml}
        </div>
    `;
}

// ============================================
// CONNEXIONS PAGE
// ============================================
function renderConnexionsPage() {
    renderConnexionsACTable();
    renderConnexionsDCTable();
}

function renderConnexionsACTable() {
    const tbody = document.getElementById('connexionsACBody');
    if (!tbody) return;
    
    tbody.innerHTML = STATE.data.connexionsAC.map(c => {
        const equip = STATE.data.equipements.find(e => e.id === c.equipement_fk);
        return `
            <tr>
                <td>${equip?.nom_equipement || c.equipement_fk}</td>
                <td>Voie ${c.voie}</td>
                <td>${c.boitier_fk}</td>
                <td>${c.prise_utilisee || '-'}</td>
                <td>${c.phase || '-'}</td>
                <td>${c.puissance_kw} kW</td>
                <td>
                    <button class="btn btn-sm" onclick="openModal('connexionAC', '${c.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteItem('connexionAC', '${c.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderConnexionsDCTable() {
    const tbody = document.getElementById('connexionsDCBody');
    if (!tbody) return;
    
    tbody.innerHTML = STATE.data.connexionsDC.map(c => {
        const equip = STATE.data.equipements.find(e => e.id === c.equipement_fk);
        return `
            <tr>
                <td>${equip?.nom_equipement || c.equipement_fk}</td>
                <td>Voie ${c.voie}</td>
                <td>${c.tableau_dc_fk}</td>
                <td>${c.numero_disjoncteur || '-'}</td>
                <td>${c.calibre_a}A</td>
                <td>${c.puissance_kw} kW</td>
                <td>
                    <button class="btn btn-sm" onclick="openModal('connexionDC', '${c.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteItem('connexionDC', '${c.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// MODAL (CRUD)
// ============================================
function openModal(type, itemId = null, parentId = null) {
    STATE.modalType = type;
    STATE.modalMode = itemId ? 'edit' : 'add';
    STATE.editingItem = itemId;
    
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    
    title.textContent = (STATE.modalMode === 'add' ? 'Ajouter ' : 'Modifier ') + type;
    
    let form = '';
    
    switch (type) {
        case 'rack':
            const rack = STATE.data.racks.find(r => r.id === itemId) || {};
            form = `
                <div class="form-row">
                    <div class="form-group"><label>ID Rack</label><input type="text" id="form-id" value="${rack.id || ''}" ${itemId ? 'readonly' : ''}></div>
                    <div class="form-group"><label>Salle</label><input type="text" id="form-salle" value="${rack.salle || 'ITN1'}"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Rangée</label><input type="text" id="form-rangee" value="${rack.rangee || ''}"></div>
                    <div class="form-group"><label>Numéro Baie</label><input type="text" id="form-numero" value="${rack.numero_baie || ''}"></div>
                </div>
                <div class="form-group"><label>Désignation</label><input type="text" id="form-designation" value="${rack.designation || ''}"></div>
                <div class="form-row">
                    <div class="form-group"><label>Porteur</label><input type="text" id="form-porteur" value="${rack.porteur || ''}"></div>
                    <div class="form-group"><label>Puissance PDU (kW)</label><input type="number" id="form-puissance" value="${rack.puissance_pdu_kw || 22}"></div>
                </div>
            `;
            break;
            
        case 'equipement':
            const equip = STATE.data.equipements.find(e => e.id === itemId) || {};
            const rackId = parentId || equip.rack_fk || '';
            form = `
                <div class="form-group"><label>Nom équipement</label><input type="text" id="form-nom" value="${equip.nom_equipement || ''}"></div>
                <div class="form-row">
                    <div class="form-group"><label>Type</label>
                        <select id="form-type">
                            <option value="Serveur" ${equip.type_equipement === 'Serveur' ? 'selected' : ''}>Serveur</option>
                            <option value="Switch" ${equip.type_equipement === 'Switch' ? 'selected' : ''}>Switch</option>
                            <option value="Routeur" ${equip.type_equipement === 'Routeur' ? 'selected' : ''}>Routeur</option>
                            <option value="Storage" ${equip.type_equipement === 'Storage' ? 'selected' : ''}>Storage</option>
                        </select>
                    </div>
                    <div class="form-group"><label>Alimentation</label>
                        <select id="form-alim">
                            <option value="AC" ${equip.type_alimentation === 'AC' ? 'selected' : ''}>AC</option>
                            <option value="DC" ${equip.type_alimentation === 'DC' ? 'selected' : ''}>DC</option>
                        </select>
                    </div>
                </div>
                <div class="form-group"><label>Rack</label>
                    <select id="form-rack">
                        ${STATE.data.racks.map(r => `<option value="${r.id}" ${r.id === rackId ? 'selected' : ''}>${r.id} - ${r.designation || r.salle}</option>`).join('')}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Position U</label><input type="number" id="form-upos" value="${equip.u_position || 1}" min="1" max="47"></div>
                    <div class="form-group"><label>Hauteur (U)</label><input type="number" id="form-hauteur" value="${equip.hauteur_u || 1}" min="1" max="47"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Poids (kg)</label><input type="number" id="form-poids" value="${equip.poids_kg || ''}"></div>
                    <div class="form-group"><label>N° Série</label><input type="text" id="form-serie" value="${equip.numero_serie || ''}"></div>
                </div>
            `;
            break;
            
        case 'boitier':
            const boitier = STATE.data.boitiersAC.find(b => b.id === itemId) || {};
            form = `
                <div class="form-group"><label>ID Boîtier</label><input type="text" id="form-id" value="${boitier.id || ''}" ${itemId ? 'readonly' : ''}></div>
                <div class="form-group"><label>Canalis</label><input type="text" id="form-canalis" value="${boitier.canalis || ''}"></div>
                <div class="form-row">
                    <div class="form-group"><label>Salle</label><input type="text" id="form-salle" value="${boitier.salle || 'ITN1'}"></div>
                    <div class="form-group"><label>Rangée</label><input type="text" id="form-rangee" value="${boitier.rangee || ''}"></div>
                </div>
                <div class="form-group"><label>Configuration</label>
                    <select id="form-config">
                        <option value="2TRI" ${boitier.configuration === '2TRI' ? 'selected' : ''}>2TRI</option>
                        <option value="3TRI" ${boitier.configuration === '3TRI' ? 'selected' : ''}>3TRI</option>
                        <option value="MONO" ${boitier.configuration === 'MONO' ? 'selected' : ''}>MONO</option>
                    </select>
                </div>
            `;
            break;
            
        case 'tableauDC':
            const tab = STATE.data.tableauxDC.find(t => t.id === itemId) || {};
            form = `
                <div class="form-group"><label>ID Tableau</label><input type="text" id="form-id" value="${tab.id || ''}" ${itemId ? 'readonly' : ''}></div>
                <div class="form-group"><label>Redresseur parent</label><input type="text" id="form-redresseur" value="${tab.redresseur || ''}"></div>
                <div class="form-group"><label>Salle</label><input type="text" id="form-salle" value="${tab.salle || 'ITN1'}"></div>
                <div class="form-row">
                    <div class="form-group"><label>Disj. 25A</label><input type="number" id="form-25a" value="${tab.total_25a || 0}"></div>
                    <div class="form-group"><label>Disj. 32A</label><input type="number" id="form-32a" value="${tab.total_32a || 0}"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Disj. 40A</label><input type="number" id="form-40a" value="${tab.total_40a || 0}"></div>
                    <div class="form-group"><label>Disj. 63A</label><input type="number" id="form-63a" value="${tab.total_63a || 0}"></div>
                </div>
            `;
            break;
            
        case 'connexion':
        case 'connexionAC':
            const connAC = STATE.data.connexionsAC.find(c => c.id === itemId) || {};
            form = `
                <div class="form-group"><label>Équipement</label>
                    <select id="form-equip">
                        ${STATE.data.equipements.filter(e => e.type_alimentation === 'AC').map(e => `<option value="${e.id}" ${e.id === connAC.equipement_fk ? 'selected' : ''}>${e.nom_equipement} (${e.rack_fk})</option>`).join('')}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Voie</label>
                        <select id="form-voie">
                            <option value="1" ${connAC.voie == 1 ? 'selected' : ''}>Voie 1</option>
                            <option value="2" ${connAC.voie == 2 ? 'selected' : ''}>Voie 2</option>
                        </select>
                    </div>
                    <div class="form-group"><label>Puissance (kW)</label><input type="number" step="0.01" id="form-puissance" value="${connAC.puissance_kw || ''}"></div>
                </div>
                <div class="form-group"><label>Boîtier AC</label>
                    <select id="form-boitier">
                        ${STATE.data.boitiersAC.map(b => `<option value="${b.id}" ${b.id === (parentId || connAC.boitier_fk) ? 'selected' : ''}>${b.id} (${b.canalis})</option>`).join('')}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>N° Prise</label><input type="number" id="form-prise" value="${connAC.prise_utilisee || ''}"></div>
                    <div class="form-group"><label>Phase</label>
                        <select id="form-phase">
                            <option value="L1" ${connAC.phase === 'L1' ? 'selected' : ''}>L1</option>
                            <option value="L2" ${connAC.phase === 'L2' ? 'selected' : ''}>L2</option>
                            <option value="L3" ${connAC.phase === 'L3' ? 'selected' : ''}>L3</option>
                        </select>
                    </div>
                </div>
            `;
            break;
            
        case 'connexionDC':
            const connDC = STATE.data.connexionsDC.find(c => c.id === itemId) || {};
            form = `
                <div class="form-group"><label>Équipement</label>
                    <select id="form-equip">
                        ${STATE.data.equipements.filter(e => e.type_alimentation === 'DC').map(e => `<option value="${e.id}" ${e.id === connDC.equipement_fk ? 'selected' : ''}>${e.nom_equipement} (${e.rack_fk})</option>`).join('')}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Voie</label>
                        <select id="form-voie">
                            <option value="1" ${connDC.voie == 1 ? 'selected' : ''}>Voie 1</option>
                            <option value="2" ${connDC.voie == 2 ? 'selected' : ''}>Voie 2</option>
                        </select>
                    </div>
                    <div class="form-group"><label>Puissance (kW)</label><input type="number" step="0.01" id="form-puissance" value="${connDC.puissance_kw || ''}"></div>
                </div>
                <div class="form-group"><label>Tableau DC</label>
                    <select id="form-tableau">
                        ${STATE.data.tableauxDC.map(t => `<option value="${t.id}" ${t.id === connDC.tableau_dc_fk ? 'selected' : ''}>${t.id} (${t.redresseur})</option>`).join('')}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>N° Disjoncteur</label><input type="number" id="form-disj" value="${connDC.numero_disjoncteur || ''}"></div>
                    <div class="form-group"><label>Calibre (A)</label>
                        <select id="form-calibre">
                            <option value="25" ${connDC.calibre_a == 25 ? 'selected' : ''}>25A</option>
                            <option value="32" ${connDC.calibre_a == 32 ? 'selected' : ''}>32A</option>
                            <option value="40" ${connDC.calibre_a == 40 ? 'selected' : ''}>40A</option>
                            <option value="63" ${connDC.calibre_a == 63 ? 'selected' : ''}>63A</option>
                        </select>
                    </div>
                </div>
            `;
            break;
    }
    
    body.innerHTML = form;
    document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    STATE.modalType = null;
    STATE.modalMode = null;
    STATE.editingItem = null;
}

async function saveModal() {
    const type = STATE.modalType;
    const isEdit = STATE.modalMode === 'edit';
    
    let item = {};
    let dataKey = '';
    let idField = 'id';
    
    switch (type) {
        case 'rack':
            dataKey = 'racks';
            item = {
                id: document.getElementById('form-id').value,
                salle: document.getElementById('form-salle').value,
                rangee: document.getElementById('form-rangee').value,
                numero_baie: document.getElementById('form-numero').value,
                designation: document.getElementById('form-designation').value,
                porteur: document.getElementById('form-porteur').value,
                puissance_pdu_kw: parseFloat(document.getElementById('form-puissance').value) || 22
            };
            break;
            
        case 'equipement':
            dataKey = 'equipements';
            item = {
                id: isEdit ? STATE.editingItem : 'EQ-' + Date.now(),
                rack_fk: document.getElementById('form-rack').value,
                nom_equipement: document.getElementById('form-nom').value,
                type_equipement: document.getElementById('form-type').value,
                type_alimentation: document.getElementById('form-alim').value,
                u_position: parseInt(document.getElementById('form-upos').value),
                hauteur_u: parseInt(document.getElementById('form-hauteur').value),
                poids_kg: parseFloat(document.getElementById('form-poids').value) || 0,
                numero_serie: document.getElementById('form-serie').value,
                statut: 'Actif'
            };
            break;
            
        case 'boitier':
            dataKey = 'boitiersAC';
            item = {
                id: document.getElementById('form-id').value,
                canalis: document.getElementById('form-canalis').value,
                salle: document.getElementById('form-salle').value,
                rangee: document.getElementById('form-rangee').value,
                configuration: document.getElementById('form-config').value
            };
            break;
            
        case 'tableauDC':
            dataKey = 'tableauxDC';
            item = {
                id: document.getElementById('form-id').value,
                redresseur: document.getElementById('form-redresseur').value,
                salle: document.getElementById('form-salle').value,
                total_25a: parseInt(document.getElementById('form-25a').value) || 0,
                total_32a: parseInt(document.getElementById('form-32a').value) || 0,
                total_40a: parseInt(document.getElementById('form-40a').value) || 0,
                total_63a: parseInt(document.getElementById('form-63a').value) || 0
            };
            break;
            
        case 'connexion':
        case 'connexionAC':
            dataKey = 'connexionsAC';
            item = {
                id: isEdit ? STATE.editingItem : 'ACC-' + Date.now(),
                equipement_fk: document.getElementById('form-equip').value,
                voie: parseInt(document.getElementById('form-voie').value),
                puissance_kw: parseFloat(document.getElementById('form-puissance').value) || 0,
                boitier_fk: document.getElementById('form-boitier').value,
                prise_utilisee: parseInt(document.getElementById('form-prise').value),
                phase: document.getElementById('form-phase').value
            };
            break;
            
        case 'connexionDC':
            dataKey = 'connexionsDC';
            item = {
                id: isEdit ? STATE.editingItem : 'DCC-' + Date.now(),
                equipement_fk: document.getElementById('form-equip').value,
                voie: parseInt(document.getElementById('form-voie').value),
                puissance_kw: parseFloat(document.getElementById('form-puissance').value) || 0,
                tableau_dc_fk: document.getElementById('form-tableau').value,
                numero_disjoncteur: parseInt(document.getElementById('form-disj').value),
                calibre_a: parseInt(document.getElementById('form-calibre').value)
            };
            break;
    }
    
    // Update local state
    if (isEdit) {
        const index = STATE.data[dataKey].findIndex(x => x.id === STATE.editingItem);
        if (index >= 0) STATE.data[dataKey][index] = item;
    } else {
        STATE.data[dataKey].push(item);
    }
    
    // Sync to Google Sheets if connected
    if (CONFIG.API_URL) {
        try {
            await fetch(CONFIG.API_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: isEdit ? 'update' : 'add',
                    sheet: dataKey,
                    data: item
                })
            });
            toast('Sauvegardé et synchronisé', 'success');
        } catch (e) {
            toast('Sauvegardé localement (sync échouée)', 'warning');
        }
    } else {
        toast('Sauvegardé (mode démo)', 'success');
    }
    
    closeModal();
    renderAll();
    
    // Refresh specific page
    if (STATE.selectedRack && type === 'equipement') {
        renderRackDetail(STATE.selectedRack);
    }
}

async function deleteItem(type, id) {
    if (!confirm('Supprimer cet élément ?')) return;
    
    const dataKeys = {
        rack: 'racks',
        equipement: 'equipements',
        boitier: 'boitiersAC',
        tableauDC: 'tableauxDC',
        connexionAC: 'connexionsAC',
        connexionDC: 'connexionsDC'
    };
    
    const dataKey = dataKeys[type];
    STATE.data[dataKey] = STATE.data[dataKey].filter(x => x.id !== id);
    
    // Sync to Google Sheets
    if (CONFIG.API_URL) {
        try {
            await fetch(CONFIG.API_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'delete', sheet: dataKey, id: id })
            });
            toast('Supprimé et synchronisé', 'success');
        } catch (e) {
            toast('Supprimé localement', 'warning');
        }
    } else {
        toast('Supprimé (mode démo)', 'success');
    }
    
    renderAll();
}

// ============================================
// CONFIG & UTILITIES
// ============================================
function saveConfig() {
    const url = document.getElementById('apiUrl').value.trim();
    localStorage.setItem('dcim_api_url', url);
    CONFIG.API_URL = url;
    toast('Configuration sauvegardée', 'success');
    loadData();
}

async function testConnection() {
    const url = document.getElementById('apiUrl').value.trim();
    if (!url) { toast('Entrez l\'URL de l\'API', 'warning'); return; }
    
    showLoading(true);
    try {
        const response = await fetch(url + '?action=ping');
        if (response.ok) {
            toast('Connexion réussie!', 'success');
            setConnectionStatus(true);
        } else {
            throw new Error();
        }
    } catch (e) {
        toast('Échec de connexion', 'error');
        setConnectionStatus(false);
    }
    showLoading(false);
}

function syncAll() {
    loadData();
    toast('Synchronisation en cours...', 'info');
}

function setConnectionStatus(connected) {
    document.querySelector('.status-dot')?.classList.toggle('connected', connected);
    const text = document.querySelector('.status-text');
    if (text) text.textContent = connected ? 'Connecté' : 'Mode Démo';
}

function updateLastSync() {
    document.getElementById('lastSync').textContent = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function updateSyncCounts() {
    document.getElementById('sync-racks').textContent = STATE.data.racks.length;
    document.getElementById('sync-equip').textContent = STATE.data.equipements.length;
    document.getElementById('sync-boitiers').textContent = STATE.data.boitiersAC.length;
    document.getElementById('sync-tableaux').textContent = STATE.data.tableauxDC.length;
}

function getStatusColor(pct) {
    if (pct >= 85) return '#ef4444';
    if (pct >= 70) return '#f59e0b';
    return '#10b981';
}

function handleGlobalSearch(e) {
    const search = e.target.value.toLowerCase();
    if (search.length < 2) return;
    
    // Search racks
    const rack = STATE.data.racks.find(r => r.id.toLowerCase().includes(search));
    if (rack) { navigateTo('racks'); selectRack(rack.id); return; }
    
    // Search equipements
    const equip = STATE.data.equipements.find(eq => eq.nom_equipement?.toLowerCase().includes(search));
    if (equip) { navigateTo('equipements'); }
}

function showEquipDetail(equipId) {
    const equip = STATE.data.equipements.find(e => e.id === equipId);
    if (equip) openModal('equipement', equipId);
}

function addEquipAtU(u) {
    if (STATE.selectedRack) {
        openModal('equipement', null, STATE.selectedRack);
        setTimeout(() => {
            document.getElementById('form-upos').value = u;
        }, 100);
    }
}

function editSelectedRack() {
    if (STATE.selectedRack) openModal('rack', STATE.selectedRack);
}

function deleteSelectedRack() {
    if (STATE.selectedRack) deleteItem('rack', STATE.selectedRack);
}

function toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : type === 'warning' ? 'exclamation' : 'info'}-circle"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function showLoading(show) {
    document.getElementById('loadingOverlay').classList.toggle('active', show);
}

// Global functions
window.navigateTo = navigateTo;
window.selectRack = selectRack;
window.openModal = openModal;
window.closeModal = closeModal;
window.saveModal = saveModal;
window.deleteItem = deleteItem;
window.testConnection = testConnection;
window.saveConfig = saveConfig;
window.syncAll = syncAll;
window.filterBySalle = filterBySalle;
window.toggleTreeNode = toggleTreeNode;
window.selectBoitier = selectBoitier;
window.selectCanalis = () => {};
window.selectTableauDC = selectTableauDC;
window.showEquipDetail = showEquipDetail;
window.addEquipAtU = addEquipAtU;
window.editSelectedRack = editSelectedRack;
window.deleteSelectedRack = deleteSelectedRack;
