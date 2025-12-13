/**
 * DCIM CAPACITAIRE - Application JavaScript
 * Gestion de la capacité datacenter avec switch Nominale/Réelle
 */

// ============================================
// CONFIGURATION & STATE
// ============================================

const CONFIG = {
    API_URL: localStorage.getItem('dcim_api_url') || '',
    REFRESH_INTERVAL: parseInt(localStorage.getItem('dcim_refresh_interval')) || 300000,
    THRESHOLDS: {
        alert: parseInt(localStorage.getItem('dcim_alert_threshold')) || 70,
        critical: parseInt(localStorage.getItem('dcim_critical_threshold')) || 85
    }
};

const STATE = {
    powerMode: 'NOMINALE',
    currentPage: 'dashboard',
    data: {
        config: { MODE_PUISSANCE: 'NOMINALE' },
        datacenters: [],
        salles: [],
        chaines: [],
        racks: [],
        equipements: [],
        connexionsAC: [],
        connexionsDC: []
    },
    charts: {}
};

// ============================================
// DEMO DATA (utilisé si pas de connexion API)
// ============================================

const DEMO_DATA = {
    config: { MODE_PUISSANCE: 'NOMINALE', SEUIL_ALERTE_PCT: 70, SEUIL_CRITIQUE_PCT: 85 },
    datacenters: [
        { dc_id: 'DC-CASA-01', dc_nom: 'Casablanca Nord', dc_statut: 'Actif' }
    ],
    chaines: [
        { chaine_id: 'CH-CASA-01-A', chaine_code: 'A', chaine_nom: 'Chaîne A', puissance_nominale_kw: 800, chaine_partenaire_fk: 'CH-CASA-01-B', chaine_statut: 'Active' },
        { chaine_id: 'CH-CASA-01-B', chaine_code: 'B', chaine_nom: 'Chaîne B', puissance_nominale_kw: 800, chaine_partenaire_fk: 'CH-CASA-01-A', chaine_statut: 'Active' },
        { chaine_id: 'CH-CASA-01-C', chaine_code: 'C', chaine_nom: 'Chaîne C', puissance_nominale_kw: 600, chaine_partenaire_fk: '', chaine_statut: 'Active' }
    ],
    racks: [
        { rack_id: 'ITN1-A01', salle_fk: 'ITN1', rangee: 'A', designation: 'Serveurs Production', u_total: 47, u_utilises: 35, puissance_max_kw: 22, voie_a_chaine_fk: 'CH-CASA-01-A', voie_b_chaine_fk: 'CH-CASA-01-B' },
        { rack_id: 'ITN1-A02', salle_fk: 'ITN1', rangee: 'A', designation: 'Stockage SAN', u_total: 47, u_utilises: 28, puissance_max_kw: 22, voie_a_chaine_fk: 'CH-CASA-01-A', voie_b_chaine_fk: 'CH-CASA-01-B' },
        { rack_id: 'ITN1-B01', salle_fk: 'ITN1', rangee: 'B', designation: 'Network Core', u_total: 42, u_utilises: 20, puissance_max_kw: 16, voie_a_chaine_fk: 'CH-CASA-01-A', voie_b_chaine_fk: 'CH-CASA-01-B' },
        { rack_id: 'ITN1-B02', salle_fk: 'ITN1', rangee: 'B', designation: 'Network Distrib', u_total: 42, u_utilises: 15, puissance_max_kw: 16, voie_a_chaine_fk: 'CH-CASA-01-A', voie_b_chaine_fk: 'CH-CASA-01-B' }
    ],
    equipements: [
        { equipement_id: 'EQ-001', rack_fk: 'ITN1-A01', nom_equipement: 'SRV-PROD-01', type_equipement: 'Serveur', marque: 'Dell', modele: 'R750', type_alimentation: 'AC', puissance_nominale_w: 750, puissance_reelle_w: 380, u_position: 30, hauteur_u: 2, statut: 'En production' },
        { equipement_id: 'EQ-002', rack_fk: 'ITN1-A01', nom_equipement: 'SRV-PROD-02', type_equipement: 'Serveur', marque: 'HP', modele: 'DL380', type_alimentation: 'AC', puissance_nominale_w: 800, puissance_reelle_w: 520, u_position: 32, hauteur_u: 2, statut: 'En production' },
        { equipement_id: 'EQ-003', rack_fk: 'ITN1-A01', nom_equipement: 'SRV-PROD-03', type_equipement: 'Serveur', marque: 'Dell', modele: 'R750', type_alimentation: 'AC', puissance_nominale_w: 750, puissance_reelle_w: 410, u_position: 34, hauteur_u: 2, statut: 'En production' },
        { equipement_id: 'EQ-004', rack_fk: 'ITN1-A01', nom_equipement: 'SRV-PROD-04', type_equipement: 'Serveur', marque: 'HP', modele: 'DL380', type_alimentation: 'AC', puissance_nominale_w: 800, puissance_reelle_w: 490, u_position: 36, hauteur_u: 2, statut: 'En production' },
        { equipement_id: 'EQ-005', rack_fk: 'ITN1-B01', nom_equipement: 'SW-CORE-01', type_equipement: 'Switch', marque: 'Cisco', modele: 'Nexus 9300', type_alimentation: 'DC', puissance_nominale_w: 500, puissance_reelle_w: 320, u_position: 20, hauteur_u: 1, statut: 'En production' },
        { equipement_id: 'EQ-006', rack_fk: 'ITN1-B01', nom_equipement: 'SW-CORE-02', type_equipement: 'Switch', marque: 'Cisco', modele: 'Nexus 9300', type_alimentation: 'DC', puissance_nominale_w: 500, puissance_reelle_w: 310, u_position: 21, hauteur_u: 1, statut: 'En production' },
        { equipement_id: 'EQ-007', rack_fk: 'ITN1-B01', nom_equipement: 'RTR-CORE-01', type_equipement: 'Routeur', marque: 'Juniper', modele: 'PTX10008', type_alimentation: 'DC', puissance_nominale_w: 2500, puissance_reelle_w: 1650, u_position: 1, hauteur_u: 13, statut: 'En production' },
        { equipement_id: 'EQ-008', rack_fk: 'ITN1-A02', nom_equipement: 'SAN-PROD-01', type_equipement: 'Storage', marque: 'NetApp', modele: 'AFF A400', type_alimentation: 'AC', puissance_nominale_w: 1200, puissance_reelle_w: 850, u_position: 10, hauteur_u: 4, statut: 'En production' },
        { equipement_id: 'EQ-009', rack_fk: 'ITN1-A02', nom_equipement: 'SAN-PROD-02', type_equipement: 'Storage', marque: 'NetApp', modele: 'AFF A400', type_alimentation: 'AC', puissance_nominale_w: 1200, puissance_reelle_w: 780, u_position: 14, hauteur_u: 4, statut: 'En production' },
        { equipement_id: 'EQ-010', rack_fk: 'ITN1-B02', nom_equipement: 'SW-DIST-01', type_equipement: 'Switch', marque: 'Cisco', modele: 'Catalyst 9300', type_alimentation: 'AC', puissance_nominale_w: 350, puissance_reelle_w: 180, u_position: 30, hauteur_u: 1, statut: 'En production' }
    ],
    connexionsAC: [
        { connexion_ac_id: 'ACC-001', equipement_fk: 'EQ-001', voie: 1, chaine_fk: 'CH-CASA-01-A', puissance_nominale_kw: 0.375, puissance_reelle_kw: 0.190 },
        { connexion_ac_id: 'ACC-002', equipement_fk: 'EQ-001', voie: 2, chaine_fk: 'CH-CASA-01-B', puissance_nominale_kw: 0.375, puissance_reelle_kw: 0.190 },
        { connexion_ac_id: 'ACC-003', equipement_fk: 'EQ-002', voie: 1, chaine_fk: 'CH-CASA-01-A', puissance_nominale_kw: 0.400, puissance_reelle_kw: 0.260 },
        { connexion_ac_id: 'ACC-004', equipement_fk: 'EQ-002', voie: 2, chaine_fk: 'CH-CASA-01-B', puissance_nominale_kw: 0.400, puissance_reelle_kw: 0.260 },
        { connexion_ac_id: 'ACC-005', equipement_fk: 'EQ-003', voie: 1, chaine_fk: 'CH-CASA-01-A', puissance_nominale_kw: 0.375, puissance_reelle_kw: 0.205 },
        { connexion_ac_id: 'ACC-006', equipement_fk: 'EQ-003', voie: 2, chaine_fk: 'CH-CASA-01-B', puissance_nominale_kw: 0.375, puissance_reelle_kw: 0.205 }
    ],
    connexionsDC: [
        { connexion_dc_id: 'DCC-001', equipement_fk: 'EQ-005', voie: 1, chaine_fk: 'CH-CASA-01-A', puissance_nominale_kw: 0.250, puissance_reelle_kw: 0.160 },
        { connexion_dc_id: 'DCC-002', equipement_fk: 'EQ-005', voie: 2, chaine_fk: 'CH-CASA-01-B', puissance_nominale_kw: 0.250, puissance_reelle_kw: 0.160 },
        { connexion_dc_id: 'DCC-003', equipement_fk: 'EQ-006', voie: 1, chaine_fk: 'CH-CASA-01-A', puissance_nominale_kw: 0.250, puissance_reelle_kw: 0.155 },
        { connexion_dc_id: 'DCC-004', equipement_fk: 'EQ-006', voie: 2, chaine_fk: 'CH-CASA-01-B', puissance_nominale_kw: 0.250, puissance_reelle_kw: 0.155 },
        { connexion_dc_id: 'DCC-005', equipement_fk: 'EQ-007', voie: 1, chaine_fk: 'CH-CASA-01-A', puissance_nominale_kw: 0.625, puissance_reelle_kw: 0.4125 },
        { connexion_dc_id: 'DCC-006', equipement_fk: 'EQ-007', voie: 2, chaine_fk: 'CH-CASA-01-B', puissance_nominale_kw: 0.625, puissance_reelle_kw: 0.4125 }
    ],
    autresConsommateurs: [
        { consommateur_id: 'CONS-CLIM-A1', chaine_fk: 'CH-CASA-01-A', puissance_nominale_kw: 50, puissance_reelle_kw: 42 },
        { consommateur_id: 'CONS-CLIM-B1', chaine_fk: 'CH-CASA-01-B', puissance_nominale_kw: 50, puissance_reelle_kw: 38 },
        { consommateur_id: 'CONS-ECL-01', chaine_fk: 'CH-CASA-01-A', puissance_nominale_kw: 8, puissance_reelle_kw: 6 }
    ]
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Load saved config
    loadConfig();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load data
    loadData();
    
    // Initialize charts
    initCharts();
    
    // Update UI
    updateUI();
    
    // Start auto-refresh
    if (CONFIG.REFRESH_INTERVAL > 0) {
        setInterval(loadData, CONFIG.REFRESH_INTERVAL);
    }
}

function loadConfig() {
    const savedUrl = localStorage.getItem('dcim_api_url');
    const savedMode = localStorage.getItem('dcim_power_mode');
    
    if (savedUrl) {
        CONFIG.API_URL = savedUrl;
        document.getElementById('appsScriptId').value = savedUrl;
    }
    
    if (savedMode) {
        STATE.powerMode = savedMode;
    }
    
    updatePowerModeUI();
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Sidebar toggle
    document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
    
    // Power mode switch
    document.querySelectorAll('.switch-btn').forEach(btn => {
        btn.addEventListener('click', handlePowerModeSwitch);
    });
    
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadData();
        showToast('Données actualisées', 'success');
    });
    
    // View all links
    document.querySelectorAll('.view-all').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.closest('.view-all').dataset.page;
            navigateTo(page);
        });
    });
    
    // Config save
    document.getElementById('saveConfig')?.addEventListener('click', saveConfig);
    document.getElementById('testConnection')?.addEventListener('click', testConnection);
    
    // Simulation
    document.getElementById('runSimulation')?.addEventListener('click', runSimulation);
    
    // Search filters
    document.getElementById('rackSearch')?.addEventListener('input', filterRacks);
    document.getElementById('equipSearch')?.addEventListener('input', filterEquipements);
    
    // Modal
    document.getElementById('modalClose')?.addEventListener('click', closeModal);
    document.getElementById('modalCancel')?.addEventListener('click', closeModal);
    document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'modalOverlay') closeModal();
    });
}

// ============================================
// NAVIGATION
// ============================================

function handleNavigation(e) {
    e.preventDefault();
    const page = e.currentTarget.dataset.page;
    navigateTo(page);
}

function navigateTo(page) {
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });
    
    // Update page visibility
    document.querySelectorAll('.page').forEach(p => {
        p.classList.toggle('active', p.id === `page-${page}`);
    });
    
    // Update title
    const titles = {
        dashboard: 'Dashboard',
        chaines: 'Chaînes Électriques',
        racks: 'Racks',
        equipements: 'Équipements',
        simulation: 'Simulation Perte de Chaîne',
        config: 'Configuration'
    };
    document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';
    
    STATE.currentPage = page;
    
    // Refresh page-specific content
    if (page === 'simulation') {
        populateSimulationSelect();
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
}

// ============================================
// POWER MODE SWITCH
// ============================================

function handlePowerModeSwitch(e) {
    const mode = e.currentTarget.dataset.mode;
    STATE.powerMode = mode;
    localStorage.setItem('dcim_power_mode', mode);
    updatePowerModeUI();
    updateUI();
    showToast(`Mode ${mode === 'NOMINALE' ? 'Nominale' : 'Réelle'} activé`, 'info');
}

function updatePowerModeUI() {
    document.querySelectorAll('.switch-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === STATE.powerMode);
    });
}

// ============================================
// DATA LOADING
// ============================================

async function loadData() {
    showLoading(true);
    
    try {
        if (CONFIG.API_URL) {
            // Load from Google Sheets via Apps Script
            const response = await fetch(CONFIG.API_URL + '?action=getAllData');
            if (response.ok) {
                STATE.data = await response.json();
            } else {
                throw new Error('API Error');
            }
        } else {
            // Use demo data
            STATE.data = JSON.parse(JSON.stringify(DEMO_DATA));
        }
        
        updateUI();
        updateLastUpdate();
        setConnectionStatus(true);
    } catch (error) {
        console.error('Error loading data:', error);
        STATE.data = JSON.parse(JSON.stringify(DEMO_DATA));
        updateUI();
        setConnectionStatus(false);
        if (CONFIG.API_URL) {
            showToast('Erreur de connexion - Mode démo', 'warning');
        }
    }
    
    showLoading(false);
}

function updateLastUpdate() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = now.toLocaleTimeString('fr-FR');
}

function setConnectionStatus(connected) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    
    statusDot.classList.toggle('disconnected', !connected);
    statusText.textContent = connected ? 'Connecté' : 'Mode démo';
}

// ============================================
// UI UPDATE
// ============================================

function updateUI() {
    updateKPIs();
    updateChaineChart();
    updateSimulationPreview();
    updateRacksGrid();
    updateChaineCards();
    updateRacksTable();
    updateEquipementsTable();
}

function updateKPIs() {
    const { chaines, racks, equipements } = STATE.data;
    const isNominale = STATE.powerMode === 'NOMINALE';
    
    // Calculate total power per chain
    const chainePower = calculateChainePower();
    const totalPower = Object.values(chainePower).reduce((sum, cp) => sum + cp.total, 0);
    
    // Average utilization
    const avgUtil = chaines.length > 0 
        ? Object.values(chainePower).reduce((sum, cp) => sum + (cp.total / cp.capacity * 100), 0) / chaines.length
        : 0;
    
    document.getElementById('kpi-totalPower').textContent = totalPower.toFixed(1);
    document.getElementById('kpi-avgUtilization').textContent = avgUtil.toFixed(1) + '%';
    document.getElementById('kpi-racksCount').textContent = racks.length;
    document.getElementById('kpi-equipCount').textContent = equipements.length;
    
    // Trend (mock)
    document.getElementById('kpi-powerTrend').textContent = isNominale ? '+5%' : '+2%';
}

function calculateChainePower() {
    const { chaines, connexionsAC, connexionsDC, autresConsommateurs } = STATE.data;
    const isNominale = STATE.powerMode === 'NOMINALE';
    const powerField = isNominale ? 'puissance_nominale_kw' : 'puissance_reelle_kw';
    
    const result = {};
    
    chaines.forEach(ch => {
        result[ch.chaine_id] = {
            id: ch.chaine_id,
            code: ch.chaine_code,
            name: ch.chaine_nom,
            capacity: ch.puissance_nominale_kw,
            it: 0,
            autres: 0,
            total: 0,
            partner: ch.chaine_partenaire_fk
        };
    });
    
    // Sum IT power from connections
    [...(connexionsAC || []), ...(connexionsDC || [])].forEach(conn => {
        const chaineId = conn.chaine_fk;
        if (result[chaineId]) {
            result[chaineId].it += conn[powerField] || 0;
        }
    });
    
    // Add other consumers
    (autresConsommateurs || []).forEach(cons => {
        const chaineId = cons.chaine_fk;
        if (result[chaineId]) {
            result[chaineId].autres += cons[powerField] || 0;
        }
    });
    
    // Calculate totals
    Object.values(result).forEach(ch => {
        ch.total = ch.it + ch.autres;
        ch.utilization = (ch.total / ch.capacity) * 100;
        ch.status = getStatus(ch.utilization);
    });
    
    return result;
}

function getStatus(percent) {
    if (percent >= CONFIG.THRESHOLDS.critical) return 'critical';
    if (percent >= CONFIG.THRESHOLDS.alert) return 'alert';
    return 'ok';
}

function getStatusColor(status) {
    switch (status) {
        case 'critical': return '#EF5350';
        case 'alert': return '#FFA726';
        default: return '#66BB6A';
    }
}

// ============================================
// CHARTS
// ============================================

function initCharts() {
    const ctx = document.getElementById('chaineChart')?.getContext('2d');
    if (!ctx) return;
    
    STATE.charts.chaine = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'IT',
                    data: [],
                    backgroundColor: '#42A5F5'
                },
                {
                    label: 'Autres',
                    data: [],
                    backgroundColor: '#AB47BC'
                },
                {
                    label: 'Disponible',
                    data: [],
                    backgroundColor: '#334155'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#94a3b8' }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: { color: '#94a3b8' },
                    grid: { color: '#334155' }
                },
                y: {
                    stacked: true,
                    ticks: { color: '#94a3b8' },
                    grid: { color: '#334155' },
                    title: {
                        display: true,
                        text: 'kW',
                        color: '#94a3b8'
                    }
                }
            }
        }
    });
}

function updateChaineChart() {
    if (!STATE.charts.chaine) return;
    
    const chainePower = calculateChainePower();
    const chains = Object.values(chainePower);
    
    STATE.charts.chaine.data.labels = chains.map(c => `Chaîne ${c.code}`);
    STATE.charts.chaine.data.datasets[0].data = chains.map(c => c.it);
    STATE.charts.chaine.data.datasets[1].data = chains.map(c => c.autres);
    STATE.charts.chaine.data.datasets[2].data = chains.map(c => Math.max(0, c.capacity - c.total));
    
    STATE.charts.chaine.update();
}

function updateSimulationPreview() {
    const chainePower = calculateChainePower();
    const chains = Object.values(chainePower);
    
    // Find chains A and B
    const chaineA = chains.find(c => c.code === 'A');
    const chaineB = chains.find(c => c.code === 'B');
    
    if (chaineA && chaineB) {
        // If A fails, B takes A's load
        const loadIfAFails = chaineB.total + chaineA.total;
        const pctIfAFails = (loadIfAFails / chaineB.capacity) * 100;
        
        const loadIfBFails = chaineA.total + chaineB.total;
        const pctIfBFails = (loadIfBFails / chaineA.capacity) * 100;
        
        updateSimBar('simProgressA', 'simValueA', pctIfAFails);
        updateSimBar('simProgressB', 'simValueB', pctIfBFails);
    }
}

function updateSimBar(barId, valueId, percent) {
    const bar = document.getElementById(barId);
    const value = document.getElementById(valueId);
    
    if (bar && value) {
        bar.style.width = Math.min(percent, 100) + '%';
        bar.style.backgroundColor = getStatusColor(getStatus(percent));
        value.textContent = percent.toFixed(1) + '%';
        value.style.color = getStatusColor(getStatus(percent));
    }
}

// ============================================
// RACKS
// ============================================

function updateRacksGrid() {
    const container = document.getElementById('racksGrid');
    if (!container) return;
    
    const { racks } = STATE.data;
    const rackPower = calculateRackPower();
    
    container.innerHTML = racks.slice(0, 12).map(rack => {
        const power = rackPower[rack.rack_id] || { total: 0 };
        const percent = (power.total / rack.puissance_max_kw) * 100;
        const status = getStatus(percent);
        
        return `
            <div class="rack-mini status-${status}" onclick="showRackDetail('${rack.rack_id}')">
                <div class="rack-mini-id">${rack.rack_id}</div>
                <div class="rack-mini-power">${power.total.toFixed(1)} kW</div>
                <div class="rack-mini-bar">
                    <div class="rack-mini-fill" style="width: ${percent}%; background: ${getStatusColor(status)}"></div>
                </div>
            </div>
        `;
    }).join('');
}

function calculateRackPower() {
    const { racks, equipements, connexionsAC, connexionsDC } = STATE.data;
    const isNominale = STATE.powerMode === 'NOMINALE';
    const powerField = isNominale ? 'puissance_nominale_kw' : 'puissance_reelle_kw';
    
    const result = {};
    
    racks.forEach(rack => {
        result[rack.rack_id] = { voieA: 0, voieB: 0, total: 0 };
    });
    
    // Group connections by equipment
    const equipRack = {};
    equipements.forEach(eq => {
        equipRack[eq.equipement_id] = eq.rack_fk;
    });
    
    [...(connexionsAC || []), ...(connexionsDC || [])].forEach(conn => {
        const rackId = equipRack[conn.equipement_fk];
        if (result[rackId]) {
            const power = conn[powerField] || 0;
            if (conn.voie === 1) {
                result[rackId].voieA += power;
            } else {
                result[rackId].voieB += power;
            }
            result[rackId].total += power;
        }
    });
    
    return result;
}

function updateRacksTable() {
    const tbody = document.getElementById('racksTableBody');
    if (!tbody) return;
    
    const { racks } = STATE.data;
    const rackPower = calculateRackPower();
    
    tbody.innerHTML = racks.map(rack => {
        const power = rackPower[rack.rack_id] || { total: 0 };
        const percent = (power.total / rack.puissance_max_kw) * 100;
        const status = getStatus(percent);
        
        return `
            <tr>
                <td><strong>${rack.rack_id}</strong></td>
                <td>${rack.salle_fk}</td>
                <td>${rack.rangee}</td>
                <td>${rack.designation}</td>
                <td>${rack.u_utilises}/${rack.u_total} U</td>
                <td>${power.total.toFixed(2)} / ${rack.puissance_max_kw} kW</td>
                <td>
                    <div class="progress-cell">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percent}%; background: ${getStatusColor(status)}"></div>
                        </div>
                        <span>${percent.toFixed(1)}%</span>
                    </div>
                </td>
                <td><span class="status-badge ${status}">${status.toUpperCase()}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn edit" onclick="showRackDetail('${rack.rack_id}')"><i class="fas fa-eye"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterRacks() {
    const search = document.getElementById('rackSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#racksTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(search) ? '' : 'none';
    });
}

// ============================================
// CHAÎNES
// ============================================

function updateChaineCards() {
    const container = document.getElementById('chaineCards');
    if (!container) return;
    
    const chainePower = calculateChainePower();
    
    container.innerHTML = Object.values(chainePower).map(ch => {
        const partner = chainePower[ch.partner];
        let simLoad = 0, simPct = 0;
        if (partner) {
            simLoad = ch.total + partner.total;
            simPct = (simLoad / ch.capacity) * 100;
        }
        const simStatus = getStatus(simPct);
        
        return `
            <div class="chaine-card">
                <div class="chaine-header">
                    <div class="chaine-title">
                        <div class="chaine-code ${ch.code}">${ch.code}</div>
                        <div>
                            <div class="chaine-name">${ch.name}</div>
                            <small style="color: var(--text-secondary)">${ch.capacity} kW capacité</small>
                        </div>
                    </div>
                    <span class="chaine-status ${ch.status}">${ch.status.toUpperCase()}</span>
                </div>
                <div class="chaine-body">
                    <div class="chaine-gauge">
                        <div class="gauge-header">
                            <span>Charge actuelle (${STATE.powerMode})</span>
                            <span>${ch.utilization.toFixed(1)}%</span>
                        </div>
                        <div class="gauge-bar">
                            <div class="gauge-fill" style="width: ${ch.utilization}%; background: ${getStatusColor(ch.status)}"></div>
                        </div>
                    </div>
                    <div class="chaine-stats">
                        <div class="stat-item">
                            <span class="stat-value">${ch.it.toFixed(1)}</span>
                            <span class="stat-label">IT (kW)</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${ch.autres.toFixed(1)}</span>
                            <span class="stat-label">Autres (kW)</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${ch.total.toFixed(1)}</span>
                            <span class="stat-label">Total (kW)</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${(ch.capacity - ch.total).toFixed(1)}</span>
                            <span class="stat-label">Disponible (kW)</span>
                        </div>
                    </div>
                </div>
                ${partner ? `
                <div class="chaine-footer">
                    <div class="sim-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Si perte ${partner.code}: ${simPct.toFixed(1)}%</span>
                    </div>
                    <span class="status-badge ${simStatus}">${simStatus.toUpperCase()}</span>
                </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// ============================================
// ÉQUIPEMENTS
// ============================================

function updateEquipementsTable() {
    const tbody = document.getElementById('equipTableBody');
    if (!tbody) return;
    
    const { equipements } = STATE.data;
    
    tbody.innerHTML = equipements.map(eq => {
        const ratio = ((eq.puissance_reelle_w / eq.puissance_nominale_w) * 100).toFixed(0);
        
        return `
            <tr>
                <td><strong>${eq.nom_equipement}</strong><br><small style="color: var(--text-secondary)">${eq.marque} ${eq.modele}</small></td>
                <td><span class="type-badge">${eq.type_equipement}</span></td>
                <td>${eq.rack_fk}</td>
                <td>U${eq.u_position} (${eq.hauteur_u}U)</td>
                <td>${eq.puissance_nominale_w} W</td>
                <td>${eq.puissance_reelle_w} W</td>
                <td>
                    <div class="progress-cell">
                        <div class="progress-bar" style="width: 60px">
                            <div class="progress-fill" style="width: ${ratio}%; background: var(--primary)"></div>
                        </div>
                        <span>${ratio}%</span>
                    </div>
                </td>
                <td><span class="status-badge ok">${eq.statut}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn edit" onclick="editEquipement('${eq.equipement_id}')"><i class="fas fa-edit"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterEquipements() {
    const search = document.getElementById('equipSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#equipTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(search) ? '' : 'none';
    });
}

// ============================================
// SIMULATION
// ============================================

function populateSimulationSelect() {
    const select = document.getElementById('simChaineSelect');
    if (!select) return;
    
    const { chaines } = STATE.data;
    
    select.innerHTML = chaines
        .filter(ch => ch.chaine_partenaire_fk)
        .map(ch => `<option value="${ch.chaine_id}">Chaîne ${ch.chaine_code} - ${ch.chaine_nom}</option>`)
        .join('');
}

function runSimulation() {
    const select = document.getElementById('simChaineSelect');
    const resultsDiv = document.getElementById('simulationResults');
    
    if (!select || !resultsDiv) return;
    
    const chaineId = select.value;
    const chainePower = calculateChainePower();
    const chaine = chainePower[chaineId];
    
    if (!chaine || !chaine.partner) {
        showToast('Sélectionnez une chaîne avec un partenaire', 'warning');
        return;
    }
    
    const partner = chainePower[chaine.partner];
    const totalLoad = chaine.total + partner.total;
    const pctAfter = (totalLoad / partner.capacity) * 100;
    const status = getStatus(pctAfter);
    const margin = partner.capacity - totalLoad;
    
    const statusLabels = {
        ok: 'Capacité Suffisante',
        alert: 'Attention - Charge Élevée',
        critical: 'Critique - Limite Atteinte',
        surcharge: 'SURCHARGE'
    };
    
    const statusIcons = {
        ok: 'check-circle',
        alert: 'exclamation-triangle',
        critical: 'exclamation-circle',
        surcharge: 'times-circle'
    };
    
    resultsDiv.innerHTML = `
        <div class="sim-result-header">
            <div class="sim-result-icon ${status}">
                <i class="fas fa-${statusIcons[status]}"></i>
            </div>
            <div class="sim-result-title">
                <h3>${statusLabels[status]}</h3>
                <span class="sim-result-subtitle">Simulation perte de Chaîne ${chaine.code} - Mode ${STATE.powerMode}</span>
            </div>
        </div>
        <div class="sim-details">
            <div class="sim-detail-card">
                <span class="sim-detail-value">${chaine.total.toFixed(1)} kW</span>
                <span class="sim-detail-label">Charge Chaîne ${chaine.code} perdue</span>
            </div>
            <div class="sim-detail-card">
                <span class="sim-detail-value">${partner.total.toFixed(1)} kW</span>
                <span class="sim-detail-label">Charge actuelle Chaîne ${partner.code}</span>
            </div>
            <div class="sim-detail-card">
                <span class="sim-detail-value" style="color: ${getStatusColor(status)}">${totalLoad.toFixed(1)} kW</span>
                <span class="sim-detail-label">Charge totale après transfert</span>
            </div>
            <div class="sim-detail-card">
                <span class="sim-detail-value">${partner.capacity} kW</span>
                <span class="sim-detail-label">Capacité Chaîne ${partner.code}</span>
            </div>
            <div class="sim-detail-card">
                <span class="sim-detail-value" style="color: ${getStatusColor(status)}">${pctAfter.toFixed(1)}%</span>
                <span class="sim-detail-label">Taux de charge final</span>
            </div>
            <div class="sim-detail-card">
                <span class="sim-detail-value" style="color: ${margin >= 0 ? '#66BB6A' : '#EF5350'}">${margin.toFixed(1)} kW</span>
                <span class="sim-detail-label">${margin >= 0 ? 'Marge restante' : 'Dépassement'}</span>
            </div>
        </div>
    `;
}

// ============================================
// MODALS & TOASTS
// ============================================

function openModal(title, content, onConfirm) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('modalOverlay').classList.add('active');
    
    if (onConfirm) {
        document.getElementById('modalConfirm').onclick = () => {
            onConfirm();
            closeModal();
        };
    }
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const icons = {
        success: 'check-circle',
        error: 'times-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${icons[type]} toast-icon"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastSlide 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showLoading(show) {
    document.getElementById('loadingOverlay').classList.toggle('active', show);
}

// ============================================
// CONFIG
// ============================================

function saveConfig() {
    const url = document.getElementById('appsScriptId').value.trim();
    const alertThreshold = document.getElementById('alertThreshold').value;
    const criticalThreshold = document.getElementById('criticalThreshold').value;
    const refreshInterval = document.getElementById('refreshInterval').value;
    
    localStorage.setItem('dcim_api_url', url);
    localStorage.setItem('dcim_alert_threshold', alertThreshold);
    localStorage.setItem('dcim_critical_threshold', criticalThreshold);
    localStorage.setItem('dcim_refresh_interval', refreshInterval * 1000);
    
    CONFIG.API_URL = url;
    CONFIG.THRESHOLDS.alert = parseInt(alertThreshold);
    CONFIG.THRESHOLDS.critical = parseInt(criticalThreshold);
    CONFIG.REFRESH_INTERVAL = parseInt(refreshInterval) * 1000;
    
    showToast('Configuration sauvegardée', 'success');
    loadData();
}

async function testConnection() {
    const url = document.getElementById('appsScriptId').value.trim();
    
    if (!url) {
        showToast('Entrez l\'URL de l\'API', 'warning');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(url + '?action=ping');
        if (response.ok) {
            showToast('Connexion réussie!', 'success');
        } else {
            throw new Error('Connection failed');
        }
    } catch (error) {
        showToast('Échec de connexion', 'error');
    }
    
    showLoading(false);
}

// ============================================
// DETAIL VIEWS
// ============================================

function showRackDetail(rackId) {
    const rack = STATE.data.racks.find(r => r.rack_id === rackId);
    const equips = STATE.data.equipements.filter(e => e.rack_fk === rackId);
    const rackPower = calculateRackPower()[rackId] || { voieA: 0, voieB: 0, total: 0 };
    
    if (!rack) return;
    
    const content = `
        <div style="margin-bottom: 20px">
            <h4 style="margin-bottom: 10px">${rack.designation}</h4>
            <p style="color: var(--text-secondary)">
                Salle: ${rack.salle_fk} | Rangée: ${rack.rangee} | 
                ${rack.u_utilises}/${rack.u_total} U utilisés
            </p>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px">
            <div style="background: var(--bg-dark); padding: 12px; border-radius: 8px; text-align: center">
                <div style="font-size: 1.25rem; font-weight: bold">${rackPower.voieA.toFixed(2)} kW</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary)">Voie A</div>
            </div>
            <div style="background: var(--bg-dark); padding: 12px; border-radius: 8px; text-align: center">
                <div style="font-size: 1.25rem; font-weight: bold">${rackPower.voieB.toFixed(2)} kW</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary)">Voie B</div>
            </div>
        </div>
        <h4 style="margin-bottom: 10px">Équipements (${equips.length})</h4>
        <div style="max-height: 200px; overflow-y: auto">
            ${equips.map(eq => `
                <div style="display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid var(--border-color)">
                    <div>
                        <strong>${eq.nom_equipement}</strong><br>
                        <small style="color: var(--text-secondary)">U${eq.u_position} - ${eq.type_equipement}</small>
                    </div>
                    <div style="text-align: right">
                        <div>${STATE.powerMode === 'NOMINALE' ? eq.puissance_nominale_w : eq.puissance_reelle_w} W</div>
                        <small style="color: var(--text-secondary)">${STATE.powerMode}</small>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    openModal(`Rack ${rackId}`, content);
}

function editEquipement(equipId) {
    const equip = STATE.data.equipements.find(e => e.equipement_id === equipId);
    if (!equip) return;
    
    const content = `
        <form id="editEquipForm">
            <div style="margin-bottom: 16px">
                <label style="display: block; margin-bottom: 4px; color: var(--text-secondary)">Nom</label>
                <input type="text" value="${equip.nom_equipement}" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-dark); color: var(--text-primary)">
            </div>
            <div style="margin-bottom: 16px">
                <label style="display: block; margin-bottom: 4px; color: var(--text-secondary)">Puissance Nominale (W)</label>
                <input type="number" value="${equip.puissance_nominale_w}" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-dark); color: var(--text-primary)">
            </div>
            <div style="margin-bottom: 16px">
                <label style="display: block; margin-bottom: 4px; color: var(--text-secondary)">Puissance Réelle (W)</label>
                <input type="number" value="${equip.puissance_reelle_w}" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-dark); color: var(--text-primary)">
            </div>
        </form>
    `;
    
    openModal(`Modifier ${equip.nom_equipement}`, content, () => {
        showToast('Modification sauvegardée (démo)', 'success');
    });
}

// Make functions globally available
window.showRackDetail = showRackDetail;
window.editEquipement = editEquipement;
