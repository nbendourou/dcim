/**
 * DCIM PRO - Professional Data Center Infrastructure Management
 * Full CRUD with Google Sheets sync + Visual Rack View
 */

// ============================================
// STATE & CONFIG
// ============================================
const CONFIG = {
    API_URL: localStorage.getItem('dcim_api_url') || '',
    RACK_HEIGHT: 47
};

const STATE = {
    currentPage: 'dashboard',
    selectedRack: null,
    selectedBoitier: null,
    selectedTableau: null,
    modalMode: null,
    modalType: null,
    editingItem: null,
    data: {
        racks: [],
        equipements: [],
        boitiersAC: [],
        tableauxDC: [],
        connexionsAC: [],
        connexionsDC: [],
        autresConsommateurs: []
    }
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    loadConfig();
    setupEventListeners();
    loadData();
}

function loadConfig() {
    const url = localStorage.getItem('dcim_api_url');
    if (url) {
        CONFIG.API_URL = url;
        const input = document.getElementById('apiUrl');
        if (input) input.value = url;
    }
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(item.dataset.page);
        });
    });
    
    // Sidebar toggle
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
    });
    
    // Mobile menu
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });
    
    // Refresh
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
        loadData();
        toast('Données actualisées', 'success');
    });
    
    // Global search
    document.getElementById('globalSearch')?.addEventListener('input', handleGlobalSearch);
    
    // Filters
    document.getElementById('rackSalleFilter')?.addEventListener('change', renderRacksList);
    document.getElementById('rackRangeeFilter')?.addEventListener('change', renderRacksList);
    document.getElementById('equipSearch')?.addEventListener('input', renderEquipementsTable);
    document.getElementById('equipTypeFilter')?.addEventListener('change', renderEquipementsTable);
    document.getElementById('equipAlimFilter')?.addEventListener('change', renderEquipementsTable);
    
    // Connexions tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById('tab-' + tab)?.classList.add('active');
        });
    });
}

// ============================================
// NAVIGATION
// ============================================
function navigateTo(page) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });
    
    // Update pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageEl = document.getElementById('page-' + page);
    if (pageEl) pageEl.classList.add('active');
    
    // Update breadcrumb
    const titles = {
        dashboard: 'Dashboard',
        tree: 'Arborescence',
        salles: 'Salles',
        racks: 'Racks',
        equipements: 'Équipements',
        canalis: 'Canalis / Boîtiers AC',
        'tableaux-dc': 'Tableaux DC',
        connexions: 'Connexions',
        capacite: 'Capacité',
        config: 'Configuration'
    };
    document.getElementById('pageTitle').textContent = titles[page] || page;
    STATE.currentPage = page;
    
    // Page-specific init
    if (page === 'racks') initRacksPage();
    if (page === 'equipements') renderEquipementsTable();
    if (page === 'tree') renderTree();
    if (page === 'canalis') renderCanalisPage();
    if (page === 'tableaux-dc') renderTableauxDCPage();
    if (page === 'connexions') renderConnexionsPage();
    if (page === 'config') initConfigPage();
}

// ============================================
// DATA LOADING
// ============================================
async function loadData() {
    showLoading(true);
    
    try {
        if (CONFIG.API_URL) {
            const response = await fetch(CONFIG.API_URL + '?action=getAllData');
            if (response.ok) {
                const data = await response.json();
                STATE.data = {
                    racks: data.racks || [],
                    equipements: data.equipements || [],
                    boitiersAC: data.boitiersAC || [],
                    tableauxDC: data.tableauxDC || [],
                    connexionsAC: data.connexionsAC || [],
                    connexionsDC: data.connexionsDC || [],
                    autresConsommateurs: data.autresConsommateurs || []
                };
                setConnectionStatus(true);
            } else {
                throw new Error('API Error');
            }
        } else {
            loadDemoData();
            setConnectionStatus(false);
        }
        
        renderAll();
        updateLastSync();
        updateSyncCounts();
        
    } catch (error) {
        console.error('Load error:', error);
        loadDemoData();
        setConnectionStatus(false);
        renderAll();
    }
    
    showLoading(false);
}

function loadDemoData() {
    STATE.data = {
        racks: [
            { id: 'ITN1-A01', salle: 'ITN1', rangee: 'A', numero_baie: 'A01', designation: 'Extension Future', porteur: '', dimensions: '47U', puissance_pdu_kw: 22 },
            { id: 'ITN1-A11', salle: 'ITN1', rangee: 'A', numero_baie: 'A11', designation: 'Switches Cisco', porteur: 'OT', dimensions: '47U', puissance_pdu_kw: 22 },
            { id: 'ITN1-F06', salle: 'ITN1', rangee: 'F', numero_baie: 'F06', designation: 'Routeur Mobile', porteur: 'OT', dimensions: '47U', puissance_pdu_kw: 22 },
            { id: 'ITN1-F16', salle: 'ITN1', rangee: 'F', numero_baie: 'F16', designation: 'Routeur PE Fixe', porteur: 'OT', dimensions: '47U', puissance_pdu_kw: 22 },
            { id: 'ITN1-F17', salle: 'ITN1', rangee: 'F', numero_baie: 'F17', designation: 'Routeur PTX', porteur: 'OT', dimensions: '47U', puissance_pdu_kw: 22 },
            { id: 'ITN2-E13', salle: 'ITN2', rangee: 'E', numero_baie: 'E13', designation: 'WDM', porteur: 'OT', dimensions: '47U', puissance_pdu_kw: 22 },
            { id: 'ITN2-E17', salle: 'ITN2', rangee: 'E', numero_baie: 'E17', designation: 'Serveurs + Routeur', porteur: 'OT', dimensions: '47U', puissance_pdu_kw: 22 },
            { id: 'ITN2-E18', salle: 'ITN2', rangee: 'E', numero_baie: 'E18', designation: 'Routeur PTX P2', porteur: 'OT', dimensions: '47U', puissance_pdu_kw: 22 }
        ],
        equipements: [
            { id: 'EQ-001', rack_fk: 'ITN1-A11', nom_equipement: 'Cisco N9K-C93180YC-FX3', type_equipement: 'Switch', type_alimentation: 'AC', u_position: 30, hauteur_u: 1, poids_kg: 12, statut: 'Actif' },
            { id: 'EQ-002', rack_fk: 'ITN2-E13', nom_equipement: 'WDM_2-2', type_equipement: 'Routeur', type_alimentation: 'DC', u_position: 30, hauteur_u: 10, poids_kg: 45, statut: 'Actif' },
            { id: 'EQ-003', rack_fk: 'ITN1-F17', nom_equipement: 'Routeur PTX10008 P1', type_equipement: 'Routeur', type_alimentation: 'DC', u_position: 7, hauteur_u: 13, poids_kg: 120, statut: 'Actif' },
            { id: 'EQ-004', rack_fk: 'ITN1-F16', nom_equipement: 'Routeur MX10008 PE Fixe 1', type_equipement: 'Routeur', type_alimentation: 'DC', u_position: 7, hauteur_u: 13, poids_kg: 120, statut: 'Actif' },
            { id: 'EQ-005', rack_fk: 'ITN1-F06', nom_equipement: 'Routeur MX10008 PE Mobile 1', type_equipement: 'Routeur', type_alimentation: 'DC', u_position: 7, hauteur_u: 13, poids_kg: 120, statut: 'Actif' },
            { id: 'EQ-006', rack_fk: 'ITN2-E18', nom_equipement: 'Routeur PTX10008 P2', type_equipement: 'Routeur', type_alimentation: 'DC', u_position: 7, hauteur_u: 13, poids_kg: 120, statut: 'Actif' },
            { id: 'EQ-007', rack_fk: 'ITN2-E17', nom_equipement: 'Routeur MX10008 PE Fixe 2', type_equipement: 'Routeur', type_alimentation: 'DC', u_position: 7, hauteur_u: 13, poids_kg: 120, statut: 'Actif' },
            { id: 'EQ-008', rack_fk: 'ITN2-E17', nom_equipement: 'Serveur Out of Band', type_equipement: 'Serveur', type_alimentation: 'DC', u_position: 39, hauteur_u: 1, poids_kg: 15, statut: 'Actif' }
        ],
        boitiersAC: [
            { id: 'IT.1-TB.A.1.1', canalis: 'IT.1-TB.A.1', salle: 'ITN1', configuration: '2TRI', rangee: 'J' },
            { id: 'IT.1-TB.A.1.10', canalis: 'IT.1-TB.A.1', salle: 'ITN1', configuration: '2TRI', rangee: 'I' },
            { id: 'IT.1-TB.A.2.1', canalis: 'IT.1-TB.A.2', salle: 'ITN1', configuration: '2TRI', rangee: 'J' },
            { id: 'IT.2-TB.A.3.11', canalis: 'IT.2-TB.A.3', salle: 'ITN2', configuration: '2TRI', rangee: 'E' }
        ],
        tableauxDC: [
            { id: 'IT.1-SWB.REC.A.1.1', redresseur: 'IT.1-SWB.REC.A.1', salle: 'ITN1', total_25a: 4, total_32a: 5, total_40a: 0, total_63a: 0 },
            { id: 'IT.1-SWB.REC.A.3.1', redresseur: 'IT.1-SWB.REC.A.3', salle: 'ITN1', total_25a: 4, total_32a: 5, total_40a: 2, total_63a: 1 },
            { id: 'IT.1-SWB.REC.B.3.1', redresseur: 'IT.1-SWB.REC.B.3', salle: 'ITN1', total_25a: 4, total_32a: 5, total_40a: 2, total_63a: 1 }
        ],
        connexionsAC: [
            { id: 'ACC-001', equipement_fk: 'EQ-001', voie: 1, puissance_kw: 0.5, boitier_fk: 'IT.1-TB.A.1.1', prise_utilisee: 1, phase: 'L1' },
            { id: 'ACC-002', equipement_fk: 'EQ-001', voie: 2, puissance_kw: 0.5, boitier_fk: 'IT.1-TB.A.2.1', prise_utilisee: 1, phase: 'L1' }
        ],
        connexionsDC: [
            { id: 'DCC-001', equipement_fk: 'EQ-003', voie: 1, puissance_kw: 5.0, tableau_dc_fk: 'IT.1-SWB.REC.A.3.1', numero_disjoncteur: 1, calibre_a: 63 },
            { id: 'DCC-002', equipement_fk: 'EQ-003', voie: 2, puissance_kw: 5.0, tableau_dc_fk: 'IT.1-SWB.REC.B.3.1', numero_disjoncteur: 1, calibre_a: 63 },
            { id: 'DCC-003', equipement_fk: 'EQ-004', voie: 1, puissance_kw: 5.0, tableau_dc_fk: 'IT.1-SWB.REC.A.3.1', numero_disjoncteur: 2, calibre_a: 63 },
            { id: 'DCC-004', equipement_fk: 'EQ-004', voie: 2, puissance_kw: 5.0, tableau_dc_fk: 'IT.1-SWB.REC.B.3.1', numero_disjoncteur: 2, calibre_a: 63 }
        ],
        autresConsommateurs: []
    };
}

function renderAll() {
    renderDashboard();
    populateFilters();
}

// ============================================
// DASHBOARD
// ============================================
function renderDashboard() {
    const { racks, equipements, connexionsAC, connexionsDC } = STATE.data;
    
    document.getElementById('kpi-racks').textContent = racks.length;
    document.getElementById('kpi-equip').textContent = equipements.length;
    
    const totalPower = [...connexionsAC, ...connexionsDC].reduce((sum, c) => sum + (parseFloat(c.puissance_kw) || 0), 0);
    document.getElementById('kpi-power').textContent = totalPower.toFixed(1);
    
    const totalU = racks.length * CONFIG.RACK_HEIGHT;
    const usedU = equipements.reduce((sum, e) => sum + (parseInt(e.hauteur_u) || 0), 0);
    document.getElementById('kpi-u').textContent = totalU > 0 ? Math.round((usedU / totalU) * 100) + '%' : '0%';
    
    renderSallesGrid();
    renderTopRacks();
    renderPowerChart();
}

function renderSallesGrid() {
    const container = document.getElementById('sallesGrid');
    if (!container) return;
    const { racks, equipements } = STATE.data;
    
    const salles = {};
    racks.forEach(r => {
        if (!salles[r.salle]) salles[r.salle] = { racks: 0, equip: 0, u_used: 0 };
        salles[r.salle].racks++;
    });
    
    equipements.forEach(e => {
        const rack = racks.find(r => r.id === e.rack_fk);
        if (rack && salles[rack.salle]) {
            salles[rack.salle].equip++;
            salles[rack.salle].u_used += parseInt(e.hauteur_u) || 0;
        }
    });
    
    container.innerHTML = Object.entries(salles).map(([name, data]) => {
        const totalU = data.racks * CONFIG.RACK_HEIGHT;
        const pctU = totalU > 0 ? Math.round((data.u_used / totalU) * 100) : 0;
        return `
            <div class="salle-card" onclick="navigateTo('racks'); filterBySalle('${name}')">
                <div class="salle-card-header">
                    <span class="salle-name">${name}</span>
                    <span class="salle-racks">${data.racks} racks</span>
                </div>
                <div class="salle-stats">
                    <div class="salle-stat">
                        <span class="salle-stat-value">${data.equip}</span>
                        <span class="salle-stat-label">Équipements</span>
                    </div>
                    <div class="salle-stat">
                        <span class="salle-stat-value">${pctU}%</span>
                        <span class="salle-stat-label">U Occupés</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderTopRacks() {
    const container = document.getElementById('topRacksList');
    if (!container) return;
    const { racks, equipements } = STATE.data;
    
    const rackUsage = racks.map(r => {
        const equips = equipements.filter(e => e.rack_fk === r.id);
        const usedU = equips.reduce((sum, e) => sum + (parseInt(e.hauteur_u) || 0), 0);
        const pct = (usedU / CONFIG.RACK_HEIGHT) * 100;
        return { ...r, usedU, pct };
    }).sort((a, b) => b.pct - a.pct).slice(0, 5);
    
    container.innerHTML = rackUsage.map(r => `
        <div class="top-rack-item">
            <span class="top-rack-name">${r.id}</span>
            <div class="top-rack-bar">
                <div class="top-rack-fill" style="width: ${r.pct}%; background: ${getStatusColor(r.pct)}"></div>
            </div>
            <span class="top-rack-value">${r.usedU}/${CONFIG.RACK_HEIGHT} U</span>
        </div>
    `).join('');
}

function renderPowerChart() {
    const ctx = document.getElementById('powerChart')?.getContext('2d');
    if (!ctx) return;
    
    const { connexionsAC, connexionsDC } = STATE.data;
    
    const voie1AC = connexionsAC.filter(c => c.voie == 1).reduce((s, c) => s + (parseFloat(c.puissance_kw) || 0), 0);
    const voie2AC = connexionsAC.filter(c => c.voie == 2).reduce((s, c) => s + (parseFloat(c.puissance_kw) || 0), 0);
    const voie1DC = connexionsDC.filter(c => c.voie == 1).reduce((s, c) => s + (parseFloat(c.puissance_kw) || 0), 0);
    const voie2DC = connexionsDC.filter(c => c.voie == 2).reduce((s, c) => s + (parseFloat(c.puissance_kw) || 0), 0);
    
    if (window.powerChartInstance) window.powerChartInstance.destroy();
    
    window.powerChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Voie 1', 'Voie 2'],
            datasets: [
                { label: 'AC', data: [voie1AC, voie2AC], backgroundColor: '#3b82f6' },
                { label: 'DC', data: [voie1DC, voie2DC], backgroundColor: '#8b5cf6' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#9ca3af' } } },
            scales: {
                x: { ticks: { color: '#9ca3af' }, grid: { color: '#2d3a4f' } },
                y: { ticks: { color: '#9ca3af' }, grid: { color: '#2d3a4f' }, title: { display: true, text: 'kW', color: '#9ca3af' } }
            }
        }
    });
}

// ============================================
// RACKS PAGE WITH VISUAL VIEW
// ============================================
function initRacksPage() {
    renderRacksList();
}

function populateFilters() {
    const salles = [...new Set(STATE.data.racks.map(r => r.salle))];
    const rangees = [...new Set(STATE.data.racks.map(r => r.rangee))];
    
    const salleFilter = document.getElementById('rackSalleFilter');
    const rangeeFilter = document.getElementById('rackRangeeFilter');
    
    if (salleFilter) {
        salleFilter.innerHTML = '<option value="">Toutes les salles</option>' + 
            salles.map(s => `<option value="${s}">${s}</option>`).join('');
    }
    
    if (rangeeFilter) {
        rangeeFilter.innerHTML = '<option value="">Toutes les rangées</option>' + 
            rangees.map(r => `<option value="${r}">${r}</option>`).join('');
    }
}

function filterBySalle(salle) {
    document.getElementById('rackSalleFilter').value = salle;
    renderRacksList();
}

function renderRacksList() {
    const container = document.getElementById('racksList');
    if (!container) return;
    
    const salleFilter = document.getElementById('rackSalleFilter')?.value || '';
    const rangeeFilter = document.getElementById('rackRangeeFilter')?.value || '';
    
    let racks = STATE.data.racks;
    if (salleFilter) racks = racks.filter(r => r.salle === salleFilter);
    if (rangeeFilter) racks = racks.filter(r => r.rangee === rangeeFilter);
    
    container.innerHTML = racks.map(r => {
        const equips = STATE.data.equipements.filter(e => e.rack_fk === r.id);
        const usedU = equips.reduce((sum, e) => sum + (parseInt(e.hauteur_u) || 0), 0);
        const power = calculateRackPower(r.id);
        
        return `
            <div class="rack-list-item ${STATE.selectedRack === r.id ? 'selected' : ''}" onclick="selectRack('${r.id}')">
                <div class="rack-list-icon"><i class="fas fa-server"></i></div>
                <div class="rack-list-info">
                    <div class="rack-list-name">${r.id}</div>
                    <div class="rack-list-desc">${r.designation || r.salle + ' - ' + r.rangee}</div>
                </div>
                <div class="rack-list-stats">
                    <div class="rack-list-u">${usedU}/${CONFIG.RACK_HEIGHT} U</div>
                    <div class="rack-list-power">${power.toFixed(1)} kW</div>
                </div>
            </div>
        `;
    }).join('');
}

function selectRack(rackId) {
    STATE.selectedRack = rackId;
    renderRacksList();
    renderRackDetail(rackId);
    document.getElementById('rackDetailPanel')?.classList.add('active');
}

function renderRackDetail(rackId) {
    const rack = STATE.data.racks.find(r => r.id === rackId);
    if (!rack) return;
    
    const equips = STATE.data.equipements.filter(e => e.rack_fk === rackId);
    
    document.getElementById('rackDetailTitle').textContent = rackId + ' - ' + (rack.designation || '');
    
    renderRackVisual(rackId, equips);
    renderRackInfo(rack, equips);
}

function renderRackVisual(rackId, equips) {
    const container = document.getElementById('rackVisual');
    if (!container) return;
    
    const slotMap = {};
    equips.forEach(e => {
        const startU = parseInt(e.u_position) || 1;
        const height = parseInt(e.hauteur_u) || 1;
        for (let u = startU; u < startU + height; u++) {
            slotMap[u] = { equip: e, isStart: u === startU, isEnd: u === startU + height - 1 };
        }
    });
    
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
        
        html += `<div class="${classes}" onclick="${slot ? `showEquipDetail('${slot.equip.id}')` : `addEquipAtU(${u})`}" title="${slot ? slot.equip.nom_equipement : 'U' + u + ' - Libre'}">
            <span class="rack-u-number">${u}</span>${content}</div>`;
    }
    html += '</div>';
    html += `<div style="margin-top: 16px; display: flex; gap: 16px; font-size: 12px;">
        <div><span style="display: inline-block; width: 16px; height: 16px; background: #3b82f6; border-radius: 4px; vertical-align: middle; margin-right: 6px;"></span>AC</div>
        <div><span style="display: inline-block; width: 16px; height: 16px; background: #8b5cf6; border-radius: 4px; vertical-align: middle; margin-right: 6px;"></span>DC</div>
        <div><span style="display: inline-block; width: 16px; height: 16px; background: #0a0e17; border: 1px solid #2d3a4f; border-radius: 4px; vertical-align: middle; margin-right: 6px;"></span>Libre</div>
    </div>`;
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
    
    container.innerHTML = `
        <div class="rack-info-section">
            <h4>Informations</h4>
            <div class="rack-info-item"><span class="rack-info-label">Salle</span><span class="rack-info-value">${rack.salle}</span></div>
            <div class="rack-info-item"><span class="rack-info-label">Rangée</span><span class="rack-info-value">${rack.rangee}</span></div>
            <div class="rack-info-item"><span class="rack-info-label">Désignation</span><span class="rack-info-value">${rack.designation || '-'}</span></div>
            <div class="rack-info-item"><span class="rack-info-label">Porteur</span><span class="rack-info-value">${rack.porteur || '-'}</span></div>
        </div>
        <div class="rack-info-section">
            <h4>Capacité U</h4>
            <div class="power-bar-container">
                <div class="power-bar-label"><span>${usedU} U utilisés</span><span>${freeU} U libres</span></div>
                <div class="power-bar"><div class="power-bar-fill" style="width: ${pctU}%; background: ${getStatusColor(pctU)}"></div></div>
            </div>
        </div>
        <div class="rack-info-section">
            <h4>Puissance</h4>
            <div class="power-bar-container">
                <div class="power-bar-label"><span>${power.toFixed(1)} kW</span><span>Max: ${maxPower} kW</span></div>
                <div class="power-bar"><div class="power-bar-fill" style="width: ${pctPower}%; background: ${getStatusColor(pctPower)}"></div></div>
            </div>
        </div>
        <div class="rack-info-section">
            <h4>Équipements (${equips.length})</h4>
            <div class="equip-mini-list">
                ${equips.map(e => `
                    <div class="equip-mini-item" onclick="showEquipDetail('${e.id}')">
                        <div class="equip-mini-icon ${(e.type_alimentation || 'ac').toLowerCase()}">
                            <i class="fas fa-${e.type_equipement === 'Serveur' ? 'server' : e.type_equipement === 'Switch' ? 'network-wired' : 'microchip'}"></i>
                        </div>
                        <div class="equip-mini-info">
                            <div class="equip-mini-name">${e.nom_equipement}</div>
                            <div class="equip-mini-pos">U${e.u_position} - ${e.hauteur_u}U - ${e.type_alimentation || 'AC'}</div>
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
        STATE.data.connexionsAC.filter(c => c.equipement_fk === e.id).forEach(c => power += parseFloat(c.puissance_kw) || 0);
        STATE.data.connexionsDC.filter(c => c.equipement_fk === e.id).forEach(c => power += parseFloat(c.puissance_kw) || 0);
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
        return `<tr>
            <td><strong>${e.nom_equipement}</strong></td>
            <td>${e.type_equipement || '-'}</td>
            <td><span class="badge ${(e.type_alimentation || 'ac').toLowerCase()}">${e.type_alimentation || 'AC'}</span></td>
            <td>${e.rack_fk}</td>
            <td>U${e.u_position} (${e.hauteur_u}U)</td>
            <td>${power.toFixed(2)} kW</td>
            <td><span class="badge active">${e.statut || 'Actif'}</span></td>
            <td>
                <button class="btn btn-sm" onclick="openModal('equipement', '${e.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteItem('equipement', '${e.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('');
}

function getEquipPower(equipId) {
    const connsAC = STATE.data.connexionsAC.filter(c => c.equipement_fk === equipId);
    const connsDC = STATE.data.connexionsDC.filter(c => c.equipement_fk === equipId);
    return [...connsAC, ...connsDC].reduce((sum, c) => sum + (parseFloat(c.puissance_kw) || 0), 0);
}

// ============================================
// TREE VIEW
// ============================================
function renderTree() {
    const container = document.getElementById('treeContainer');
    if (!container) return;
    
    const canalisMap = {};
    STATE.data.boitiersAC.forEach(b => {
        if (!canalisMap[b.canalis]) canalisMap[b.canalis] = [];
        canalisMap[b.canalis].push(b);
    });
    
    const redresseurMap = {};
    STATE.data.tableauxDC.forEach(t => {
        if (!redresseurMap[t.redresseur]) redresseurMap[t.redresseur] = [];
        redresseurMap[t.redresseur].push(t);
    });
    
    let html = '<div class="tree-root">';
    html += '<h4 style="margin-bottom: 16px; color: #06b6d4;"><i class="fas fa-bolt"></i> Distribution AC (Canalis)</h4>';
    
    Object.entries(canalisMap).forEach(([canalis, boitiers]) => {
        const connectedCount = boitiers.reduce((sum, b) => sum + STATE.data.connexionsAC.filter(c => c.boitier_fk === b.id).length, 0);
        html += `
            <div class="tree-item" onclick="toggleTreeNode(this)">
                <div class="tree-icon canalis"><i class="fas fa-grip-lines"></i></div>
                <div class="tree-label"><div class="tree-name">${canalis}</div><div class="tree-meta">${boitiers.length} boîtiers | ${connectedCount} connexions</div></div>
                <div class="tree-toggle"><i class="fas fa-chevron-down"></i></div>
            </div>
            <div class="tree-children" style="display: none;">
                ${boitiers.map(b => {
                    const conns = STATE.data.connexionsAC.filter(c => c.boitier_fk === b.id);
                    return `<div class="tree-node">
                        <div class="tree-item" onclick="event.stopPropagation(); toggleTreeNode(this)">
                            <div class="tree-icon boitier"><i class="fas fa-box"></i></div>
                            <div class="tree-label"><div class="tree-name">${b.id}</div><div class="tree-meta">${b.configuration} | ${conns.length} équipements</div></div>
                            ${conns.length > 0 ? '<div class="tree-toggle"><i class="fas fa-chevron-down"></i></div>' : ''}
                        </div>
                        ${conns.length > 0 ? `<div class="tree-children" style="display: none;">
                            ${conns.map(c => {
                                const eq = STATE.data.equipements.find(e => e.id === c.equipement_fk);
                                return eq ? `<div class="tree-node"><div class="tree-item">
                                    <div class="tree-icon equip"><i class="fas fa-microchip"></i></div>
                                    <div class="tree-label"><div class="tree-name">${eq.nom_equipement}</div><div class="tree-meta">Voie ${c.voie} | ${c.puissance_kw} kW | ${c.phase}</div></div>
                                </div></div>` : '';
                            }).join('')}
                        </div>` : ''}
                    </div>`;
                }).join('')}
            </div>`;
    });
    
    html += '<h4 style="margin: 24px 0 16px; color: #8b5cf6;"><i class="fas fa-car-battery"></i> Distribution DC (Redresseurs)</h4>';
    
    Object.entries(redresseurMap).forEach(([redresseur, tableaux]) => {
        const connectedCount = tableaux.reduce((sum, t) => sum + STATE.data.connexionsDC.filter(c => c.tableau_dc_fk === t.id).length, 0);
        html += `
            <div class="tree-item" onclick="toggleTreeNode(this)">
                <div class="tree-icon redresseur"><i class="fas fa-charging-station"></i></div>
                <div class="tree-label"><div class="tree-name">${redresseur}</div><div class="tree-meta">${tableaux.length} tableaux | ${connectedCount} connexions</div></div>
                <div class="tree-toggle"><i class="fas fa-chevron-down"></i></div>
            </div>
            <div class="tree-children" style="display: none;">
                ${tableaux.map(t => {
                    const conns = STATE.data.connexionsDC.filter(c => c.tableau_dc_fk === t.id);
                    return `<div class="tree-node">
                        <div class="tree-item" onclick="event.stopPropagation(); toggleTreeNode(this)">
                            <div class="tree-icon tableau"><i class="fas fa-table-cells"></i></div>
                            <div class="tree-label"><div class="tree-name">${t.id}</div><div class="tree-meta">${conns.length} disjoncteurs utilisés</div></div>
                            ${conns.length > 0 ? '<div class="tree-toggle"><i class="fas fa-chevron-down"></i></div>' : ''}
                        </div>
                        ${conns.length > 0 ? `<div class="tree-children" style="display: none;">
                            ${conns.map(c => {
                                const eq = STATE.data.equipements.find(e => e.id === c.equipement_fk);
                                return eq ? `<div class="tree-node"><div class="tree-item">
                                    <div class="tree-icon equip"><i class="fas fa-microchip"></i></div>
                                    <div class="tree-label"><div class="tree-name">${eq.nom_equipement}</div><div class="tree-meta">Voie ${c.voie} | Disj. ${c.numero_disjoncteur} (${c.calibre_a}A) | ${c.puissance_kw} kW</div></div>
                                </div></div>` : '';
                            }).join('')}
                        </div>` : ''}
                    </div>`;
                }).join('')}
            </div>`;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function toggleTreeNode(element) {
    const children = element.nextElementSibling;
    if (children && children.classList.contains('tree-children')) {
        children.style.display = children.style.display === 'none' ? 'block' : 'none';
        const icon = element.querySelector('.tree-toggle i');
        if (icon) { icon.classList.toggle('fa-chevron-down'); icon.classList.toggle('fa-chevron-up'); }
    }
}

// ============================================
// CANALIS PAGE
// ============================================
function renderCanalisPage() {
    const tree = document.getElementById('canalisTree');
    if (!tree) return;
    
    const canalisMap = {};
    STATE.data.boitiersAC.forEach(b => {
        if (!canalisMap[b.canalis]) canalisMap[b.canalis] = { salle: b.salle, boitiers: [] };
        canalisMap[b.canalis].boitiers.push(b);
    });
    
    tree.innerHTML = Object.entries(canalisMap).map(([canalis, data]) => `
        <div class="canalis-item">
            <div class="canalis-name"><i class="fas fa-grip-lines"></i> ${canalis}</div>
            <div class="canalis-meta">Salle: ${data.salle} | ${data.boitiers.length} boîtiers</div>
            <div class="boitiers-list">
                ${data.boitiers.map(b => `
                    <div class="boitier-item ${STATE.selectedBoitier === b.id ? 'selected' : ''}" onclick="selectBoitier('${b.id}')">
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
            <div class="rack-info-item"><span class="rack-info-label">Config</span><span class="rack-info-value">${boitier.configuration}</span></div>
            <div class="rack-info-item"><span class="rack-info-label">Rangée</span><span class="rack-info-value">${boitier.rangee}</span></div>
        </div>
        <div class="rack-info-section">
            <h4>Équipements connectés (${connexions.length})</h4>
            ${connexions.map(c => {
                const equip = STATE.data.equipements.find(e => e.id === c.equipement_fk);
                return equip ? `<div class="equip-mini-item">
                    <div class="equip-mini-icon ac"><i class="fas fa-plug"></i></div>
                    <div class="equip-mini-info">
                        <div class="equip-mini-name">${equip.nom_equipement}</div>
                        <div class="equip-mini-pos">Voie ${c.voie} | Prise ${c.prise_utilisee} | ${c.phase} | ${c.puissance_kw} kW</div>
                    </div>
                </div>` : '';
            }).join('')}
        </div>
        <button class="btn btn-primary" onclick="openModal('connexionAC', null, '${boitierId}')"><i class="fas fa-plus"></i> Ajouter connexion</button>
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
        return `<div class="tableau-item ${STATE.selectedTableau === t.id ? 'selected' : ''}" onclick="selectTableauDC('${t.id}')">
            <div style="font-weight: 600;">${t.id}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">Redresseur: ${t.redresseur} | ${connexions.length} disj. utilisés</div>
        </div>`;
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
    const calibres = [25, 32, 40, 63, 80, 100, 125];
    let slotsHtml = '';
    
    calibres.forEach(cal => {
        const total = parseInt(tableau['total_' + cal + 'a']) || 0;
        if (total > 0) {
            const used = connexions.filter(c => c.calibre_a == cal).length;
            slotsHtml += `<div style="margin-bottom: 16px;"><h5>${cal}A (${used}/${total})</h5><div class="disjoncteur-grid">`;
            for (let i = 1; i <= total; i++) {
                const conn = connexions.find(c => c.calibre_a == cal && c.numero_disjoncteur == i);
                const eq = conn ? STATE.data.equipements.find(e => e.id === conn.equipement_fk) : null;
                slotsHtml += `<div class="disjoncteur-slot ${conn ? 'used' : 'available'}">${i}${eq ? '<br><small>' + eq.nom_equipement.substring(0, 10) + '</small>' : ''}</div>`;
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
        <div class="rack-info-section"><h4>Disjoncteurs</h4>${slotsHtml}</div>
        <button class="btn btn-primary" onclick="openModal('connexionDC', null, '${tableauId}')"><i class="fas fa-plus"></i> Ajouter connexion</button>
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
        return `<tr>
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
        </tr>`;
    }).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--text-secondary)">Aucune connexion AC</td></tr>';
}

function renderConnexionsDCTable() {
    const tbody = document.getElementById('connexionsDCBody');
    if (!tbody) return;
    
    tbody.innerHTML = STATE.data.connexionsDC.map(c => {
        const equip = STATE.data.equipements.find(e => e.id === c.equipement_fk);
        return `<tr>
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
        </tr>`;
    }).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--text-secondary)">Aucune connexion DC</td></tr>';
}

// ============================================
// CONFIG PAGE
// ============================================
function initConfigPage() {
    const input = document.getElementById('apiUrl');
    if (input && CONFIG.API_URL) input.value = CONFIG.API_URL;
    updateSyncCounts();
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
                    <div class="form-group"><label>ID Rack *</label><input type="text" id="form-id" value="${rack.id || ''}" ${itemId ? 'readonly' : ''} required></div>
                    <div class="form-group"><label>Salle *</label><input type="text" id="form-salle" value="${rack.salle || 'ITN1'}" required></div>
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
                <div class="form-group"><label>Nom équipement *</label><input type="text" id="form-nom" value="${equip.nom_equipement || ''}" required></div>
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
                <div class="form-group"><label>Rack *</label>
                    <select id="form-rack" required>
                        ${STATE.data.racks.map(r => '<option value="' + r.id + '" ' + (r.id === rackId ? 'selected' : '') + '>' + r.id + ' - ' + (r.designation || r.salle) + '</option>').join('')}
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
                <div class="form-group"><label>ID Boîtier *</label><input type="text" id="form-id" value="${boitier.id || ''}" ${itemId ? 'readonly' : ''} required></div>
                <div class="form-group"><label>Canalis *</label><input type="text" id="form-canalis" value="${boitier.canalis || ''}" required></div>
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
                <div class="form-group"><label>ID Tableau *</label><input type="text" id="form-id" value="${tab.id || ''}" ${itemId ? 'readonly' : ''} required></div>
                <div class="form-group"><label>Redresseur parent *</label><input type="text" id="form-redresseur" value="${tab.redresseur || ''}" required></div>
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
            
        case 'connexionAC':
            const connAC = STATE.data.connexionsAC.find(c => c.id === itemId) || {};
            form = `
                <div class="form-group"><label>Équipement (AC) *</label>
                    <select id="form-equip" required>
                        ${STATE.data.equipements.filter(e => e.type_alimentation === 'AC' || !e.type_alimentation).map(e => '<option value="' + e.id + '" ' + (e.id === connAC.equipement_fk ? 'selected' : '') + '>' + e.nom_equipement + ' (' + e.rack_fk + ')</option>').join('')}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Voie</label>
                        <select id="form-voie"><option value="1" ${connAC.voie == 1 ? 'selected' : ''}>Voie 1</option><option value="2" ${connAC.voie == 2 ? 'selected' : ''}>Voie 2</option></select>
                    </div>
                    <div class="form-group"><label>Puissance (kW) *</label><input type="number" step="0.01" id="form-puissance" value="${connAC.puissance_kw || ''}" required></div>
                </div>
                <div class="form-group"><label>Boîtier AC *</label>
                    <select id="form-boitier" required>
                        ${STATE.data.boitiersAC.map(b => '<option value="' + b.id + '" ' + (b.id === (parentId || connAC.boitier_fk) ? 'selected' : '') + '>' + b.id + ' (' + b.canalis + ')</option>').join('')}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>N° Prise</label><input type="number" id="form-prise" value="${connAC.prise_utilisee || ''}"></div>
                    <div class="form-group"><label>Phase</label>
                        <select id="form-phase"><option value="L1" ${connAC.phase === 'L1' ? 'selected' : ''}>L1</option><option value="L2" ${connAC.phase === 'L2' ? 'selected' : ''}>L2</option><option value="L3" ${connAC.phase === 'L3' ? 'selected' : ''}>L3</option></select>
                    </div>
                </div>
            `;
            break;
            
        case 'connexionDC':
            const connDC = STATE.data.connexionsDC.find(c => c.id === itemId) || {};
            form = `
                <div class="form-group"><label>Équipement (DC) *</label>
                    <select id="form-equip" required>
                        ${STATE.data.equipements.filter(e => e.type_alimentation === 'DC').map(e => '<option value="' + e.id + '" ' + (e.id === connDC.equipement_fk ? 'selected' : '') + '>' + e.nom_equipement + ' (' + e.rack_fk + ')</option>').join('')}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Voie</label>
                        <select id="form-voie"><option value="1" ${connDC.voie == 1 ? 'selected' : ''}>Voie 1</option><option value="2" ${connDC.voie == 2 ? 'selected' : ''}>Voie 2</option></select>
                    </div>
                    <div class="form-group"><label>Puissance (kW) *</label><input type="number" step="0.01" id="form-puissance" value="${connDC.puissance_kw || ''}" required></div>
                </div>
                <div class="form-group"><label>Tableau DC *</label>
                    <select id="form-tableau" required>
                        ${STATE.data.tableauxDC.map(t => '<option value="' + t.id + '" ' + (t.id === (parentId || connDC.tableau_dc_fk) ? 'selected' : '') + '>' + t.id + ' (' + t.redresseur + ')</option>').join('')}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>N° Disjoncteur</label><input type="number" id="form-disj" value="${connDC.numero_disjoncteur || ''}"></div>
                    <div class="form-group"><label>Calibre (A)</label>
                        <select id="form-calibre"><option value="25" ${connDC.calibre_a == 25 ? 'selected' : ''}>25A</option><option value="32" ${connDC.calibre_a == 32 ? 'selected' : ''}>32A</option><option value="40" ${connDC.calibre_a == 40 ? 'selected' : ''}>40A</option><option value="63" ${connDC.calibre_a == 63 ? 'selected' : ''}>63A</option></select>
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
            item = { id: document.getElementById('form-id').value, canalis: document.getElementById('form-canalis').value, salle: document.getElementById('form-salle').value, rangee: document.getElementById('form-rangee').value, configuration: document.getElementById('form-config').value };
            break;
        case 'tableauDC':
            dataKey = 'tableauxDC';
            item = { id: document.getElementById('form-id').value, redresseur: document.getElementById('form-redresseur').value, salle: document.getElementById('form-salle').value, total_25a: parseInt(document.getElementById('form-25a').value) || 0, total_32a: parseInt(document.getElementById('form-32a').value) || 0, total_40a: parseInt(document.getElementById('form-40a').value) || 0, total_63a: parseInt(document.getElementById('form-63a').value) || 0 };
            break;
        case 'connexionAC':
            dataKey = 'connexionsAC';
            item = { id: isEdit ? STATE.editingItem : 'ACC-' + Date.now(), equipement_fk: document.getElementById('form-equip').value, voie: parseInt(document.getElementById('form-voie').value), puissance_kw: parseFloat(document.getElementById('form-puissance').value) || 0, boitier_fk: document.getElementById('form-boitier').value, prise_utilisee: parseInt(document.getElementById('form-prise').value), phase: document.getElementById('form-phase').value };
            break;
        case 'connexionDC':
            dataKey = 'connexionsDC';
            item = { id: isEdit ? STATE.editingItem : 'DCC-' + Date.now(), equipement_fk: document.getElementById('form-equip').value, voie: parseInt(document.getElementById('form-voie').value), puissance_kw: parseFloat(document.getElementById('form-puissance').value) || 0, tableau_dc_fk: document.getElementById('form-tableau').value, numero_disjoncteur: parseInt(document.getElementById('form-disj').value), calibre_a: parseInt(document.getElementById('form-calibre').value) };
            break;
    }
    
    // Update local state
    if (isEdit) {
        const index = STATE.data[dataKey].findIndex(x => x.id === STATE.editingItem);
        if (index >= 0) STATE.data[dataKey][index] = item;
    } else {
        STATE.data[dataKey].push(item);
    }
    
    // Sync to Google Sheets
    if (CONFIG.API_URL) {
        try {
            await fetch(CONFIG.API_URL, { method: 'POST', body: JSON.stringify({ action: isEdit ? 'update' : 'add', sheet: dataKey, data: item }) });
            toast('Sauvegardé et synchronisé!', 'success');
        } catch (e) {
            toast('Sauvegardé localement (sync échouée)', 'warning');
        }
    } else {
        toast('Sauvegardé (mode démo)', 'success');
    }
    
    closeModal();
    renderAll();
    if (STATE.selectedRack && type === 'equipement') renderRackDetail(STATE.selectedRack);
    if (STATE.currentPage === 'equipements') renderEquipementsTable();
    if (STATE.currentPage === 'connexions') renderConnexionsPage();
}

async function deleteItem(type, id) {
    if (!confirm('Supprimer cet élément ?')) return;
    
    const dataKeys = { rack: 'racks', equipement: 'equipements', boitier: 'boitiersAC', tableauDC: 'tableauxDC', connexionAC: 'connexionsAC', connexionDC: 'connexionsDC' };
    const dataKey = dataKeys[type];
    STATE.data[dataKey] = STATE.data[dataKey].filter(x => x.id !== id);
    
    if (CONFIG.API_URL) {
        try {
            await fetch(CONFIG.API_URL, { method: 'POST', body: JSON.stringify({ action: 'delete', sheet: dataKey, id: id }) });
            toast('Supprimé!', 'success');
        } catch (e) {
            toast('Supprimé localement', 'warning');
        }
    } else {
        toast('Supprimé (mode démo)', 'success');
    }
    
    renderAll();
    if (STATE.currentPage === 'equipements') renderEquipementsTable();
    if (STATE.currentPage === 'connexions') renderConnexionsPage();
}

// ============================================
// CONFIG & UTILITIES
// ============================================
function saveConfig() {
    const url = document.getElementById('apiUrl').value.trim();
    localStorage.setItem('dcim_api_url', url);
    CONFIG.API_URL = url;
    toast('Configuration sauvegardée!', 'success');
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
        } else throw new Error();
    } catch (e) {
        toast('Échec de connexion', 'error');
        setConnectionStatus(false);
    }
    showLoading(false);
}

function syncAll() { loadData(); toast('Synchronisation...', 'info'); }
function setConnectionStatus(connected) {
    document.querySelector('.status-dot')?.classList.toggle('connected', connected);
    const text = document.querySelector('.status-text');
    if (text) text.textContent = connected ? 'Connecté' : 'Mode Démo';
}
function updateLastSync() { document.getElementById('lastSync').textContent = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
function updateSyncCounts() {
    const el = id => document.getElementById(id);
    if (el('sync-racks')) el('sync-racks').textContent = STATE.data.racks.length;
    if (el('sync-equip')) el('sync-equip').textContent = STATE.data.equipements.length;
    if (el('sync-boitiers')) el('sync-boitiers').textContent = STATE.data.boitiersAC.length;
    if (el('sync-tableaux')) el('sync-tableaux').textContent = STATE.data.tableauxDC.length;
}
function getStatusColor(pct) { return pct >= 85 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981'; }
function handleGlobalSearch(e) {
    const search = e.target.value.toLowerCase();
    if (search.length < 2) return;
    const rack = STATE.data.racks.find(r => r.id.toLowerCase().includes(search));
    if (rack) { navigateTo('racks'); selectRack(rack.id); return; }
    const equip = STATE.data.equipements.find(eq => eq.nom_equipement?.toLowerCase().includes(search));
    if (equip) navigateTo('equipements');
}
function showEquipDetail(equipId) { openModal('equipement', equipId); }
function addEquipAtU(u) {
    if (STATE.selectedRack) {
        openModal('equipement', null, STATE.selectedRack);
        setTimeout(() => { const el = document.getElementById('form-upos'); if (el) el.value = u; }, 100);
    }
}
function editSelectedRack() { if (STATE.selectedRack) openModal('rack', STATE.selectedRack); }
function deleteSelectedRack() { if (STATE.selectedRack) deleteItem('rack', STATE.selectedRack); }
function toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerHTML = '<i class="fas fa-' + (type === 'success' ? 'check' : type === 'error' ? 'times' : type === 'warning' ? 'exclamation' : 'info') + '-circle"></i> ' + message;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
}
function showLoading(show) { document.getElementById('loadingOverlay').classList.toggle('active', show); }

// Global exports
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
window.selectTableauDC = selectTableauDC;
window.showEquipDetail = showEquipDetail;
window.addEquipAtU = addEquipAtU;
window.editSelectedRack = editSelectedRack;
window.deleteSelectedRack = deleteSelectedRack;
