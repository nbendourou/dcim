/**
 * DCIM CAPACITAIRE V2 - Application JavaScript
 * Avec Configuration Électrique Complète
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
    powerMode: localStorage.getItem('dcim_power_mode') || 'NOMINALE',
    currentPage: 'dashboard',
    currentElecTab: 'transformateurs',
    data: {
        config: {},
        chaines: [],
        transformateurs: [],
        groupes: [],
        tgbt: [],
        ups: [],
        redresseurs: [],
        tableauxDistrib: [],
        tableauxDC: [],
        canalis: [],
        boitiers: [],
        pdu: [],
        racks: [],
        equipements: [],
        connexionsAC: [],
        connexionsDC: [],
        autresConsommateurs: []
    },
    charts: {}
};

// ============================================
// DEMO DATA
// ============================================

const DEMO_DATA = {
    config: { MODE_PUISSANCE: 'NOMINALE', SEUIL_ALERTE_PCT: 70, SEUIL_CRITIQUE_PCT: 85 },
    chaines: [
        { chaine_id: 'CH-A', chaine_code: 'A', chaine_nom: 'Chaîne A', puissance_nominale_kw: 800, chaine_partenaire_fk: 'CH-B', chaine_statut: 'Active' },
        { chaine_id: 'CH-B', chaine_code: 'B', chaine_nom: 'Chaîne B', puissance_nominale_kw: 800, chaine_partenaire_fk: 'CH-A', chaine_statut: 'Active' }
    ],
    transformateurs: [
        { transfo_id: 'TR-A1', transfo_nom: 'Transformateur A1', chaine_fk: 'CH-A', puissance_kva: 1000, tension_primaire: '20kV', tension_secondaire: '400V', statut: 'Actif' },
        { transfo_id: 'TR-B1', transfo_nom: 'Transformateur B1', chaine_fk: 'CH-B', puissance_kva: 1000, tension_primaire: '20kV', tension_secondaire: '400V', statut: 'Actif' }
    ],
    groupes: [
        { groupe_id: 'GE-A1', groupe_nom: 'Groupe Électrogène A1', chaine_fk: 'CH-A', puissance_kva: 1250, carburant: 'Diesel', autonomie_h: 24, statut: 'Standby' },
        { groupe_id: 'GE-B1', groupe_nom: 'Groupe Électrogène B1', chaine_fk: 'CH-B', puissance_kva: 1250, carburant: 'Diesel', autonomie_h: 24, statut: 'Standby' }
    ],
    tgbt: [
        { tgbt_id: 'TGBT-A', tgbt_nom: 'TGBT Chaîne A', chaine_fk: 'CH-A', source_normale_fk: 'TR-A1', source_secours_fk: 'GE-A1', intensite_nominale_a: 1600, nb_departs: 12, statut: 'Actif' },
        { tgbt_id: 'TGBT-B', tgbt_nom: 'TGBT Chaîne B', chaine_fk: 'CH-B', source_normale_fk: 'TR-B1', source_secours_fk: 'GE-B1', intensite_nominale_a: 1600, nb_departs: 12, statut: 'Actif' }
    ],
    ups: [
        { ups_id: 'UPS-A1', ups_nom: 'UPS A1', chaine_fk: 'CH-A', tgbt_fk: 'TGBT-A', puissance_kva: 500, rendement_pct: 96, autonomie_min: 10, charge_pct: 65, statut: 'Online' },
        { ups_id: 'UPS-B1', ups_nom: 'UPS B1', chaine_fk: 'CH-B', tgbt_fk: 'TGBT-B', puissance_kva: 500, rendement_pct: 96, autonomie_min: 10, charge_pct: 58, statut: 'Online' }
    ],
    redresseurs: [
        { redresseur_id: 'RED-A1', redresseur_nom: 'Redresseur A1', chaine_fk: 'CH-A', mode_alimentation: 'VIA_UPS', ups_fk: 'UPS-A1', puissance_kw: 100, tension_dc_v: -48, batteries_presentes: 'Non', statut: 'Actif' },
        { redresseur_id: 'RED-B1', redresseur_nom: 'Redresseur B1', chaine_fk: 'CH-B', mode_alimentation: 'VIA_TABLEAU_DIRECT', tableau_direct_fk: 'TD-B1', puissance_kw: 100, tension_dc_v: -48, batteries_presentes: 'Oui', autonomie_batteries_min: 15, statut: 'Actif' }
    ],
    tableauxDistrib: [
        { tableau_id: 'TD-A1', tableau_nom: 'Tableau Distrib A1', type: 'AC', chaine_fk: 'CH-A', ups_fk: 'UPS-A1', intensite_nominale_a: 400, nb_departs_total: 24, nb_departs_utilises: 18, statut: 'Actif' },
        { tableau_id: 'TD-B1', tableau_nom: 'Tableau Distrib B1', type: 'AC', chaine_fk: 'CH-B', ups_fk: 'UPS-B1', intensite_nominale_a: 400, nb_departs_total: 24, nb_departs_utilises: 15, statut: 'Actif' }
    ],
    tableauxDC: [
        { tableau_dc_id: 'TDC-A1', tableau_dc_nom: 'Tableau DC A1', chaine_fk: 'CH-A', redresseur_fk: 'RED-A1', intensite_nominale_a: 200, nb_departs_total: 12, nb_departs_utilises: 8, statut: 'Actif' }
    ],
    canalis: [
        { canalis_id: 'CAN-A1', canalis_nom: 'Canalis A1', chaine_fk: 'CH-A', ups_fk: 'UPS-A1', intensite_nominale_a: 250, longueur_m: 30, nb_boitiers: 10, statut: 'Actif' },
        { canalis_id: 'CAN-B1', canalis_nom: 'Canalis B1', chaine_fk: 'CH-B', ups_fk: 'UPS-B1', intensite_nominale_a: 250, longueur_m: 30, nb_boitiers: 10, statut: 'Actif' }
    ],
    boitiers: [
        { boitier_id: 'BOX-A1-01', canalis_fk: 'CAN-A1', position_m: 3, nb_prises_total: 6, nb_prises_utilisees: 4 },
        { boitier_id: 'BOX-A1-02', canalis_fk: 'CAN-A1', position_m: 6, nb_prises_total: 6, nb_prises_utilisees: 5 },
        { boitier_id: 'BOX-B1-01', canalis_fk: 'CAN-B1', position_m: 3, nb_prises_total: 6, nb_prises_utilisees: 3 }
    ],
    pdu: [
        { pdu_id: 'PDU-R01-A', pdu_nom: 'PDU Rack01 A', rack_fk: 'ITN1-A01', voie: 'A', mode_alimentation: 'VIA_CANALIS', boitier_canalis_fk: 'BOX-A1-01', intensite_nominale_a: 32, nb_c13_total: 24, nb_c13_utilises: 18, nb_c19_total: 6, nb_c19_utilises: 2, statut: 'Actif' },
        { pdu_id: 'PDU-R01-B', pdu_nom: 'PDU Rack01 B', rack_fk: 'ITN1-A01', voie: 'B', mode_alimentation: 'VIA_CANALIS', boitier_canalis_fk: 'BOX-B1-01', intensite_nominale_a: 32, nb_c13_total: 24, nb_c13_utilises: 18, nb_c19_total: 6, nb_c19_utilises: 2, statut: 'Actif' }
    ],
    racks: [
        { rack_id: 'ITN1-A01', salle_fk: 'ITN1', rangee: 'A', designation: 'Serveurs Prod', u_total: 47, u_utilises: 35, puissance_max_kw: 22, voie_a_chaine_fk: 'CH-A', voie_b_chaine_fk: 'CH-B' },
        { rack_id: 'ITN1-A02', salle_fk: 'ITN1', rangee: 'A', designation: 'Stockage SAN', u_total: 47, u_utilises: 28, puissance_max_kw: 22, voie_a_chaine_fk: 'CH-A', voie_b_chaine_fk: 'CH-B' },
        { rack_id: 'ITN1-B01', salle_fk: 'ITN1', rangee: 'B', designation: 'Network Core', u_total: 42, u_utilises: 20, puissance_max_kw: 16, voie_a_chaine_fk: 'CH-A', voie_b_chaine_fk: 'CH-B' }
    ],
    equipements: [
        { equipement_id: 'EQ-001', rack_fk: 'ITN1-A01', nom_equipement: 'SRV-PROD-01', type_equipement: 'Serveur', marque: 'Dell', modele: 'R750', puissance_nominale_w: 750, puissance_reelle_w: 380, u_position: 30, hauteur_u: 2, statut: 'En production' },
        { equipement_id: 'EQ-002', rack_fk: 'ITN1-A01', nom_equipement: 'SRV-PROD-02', type_equipement: 'Serveur', marque: 'HP', modele: 'DL380', puissance_nominale_w: 800, puissance_reelle_w: 520, u_position: 32, hauteur_u: 2, statut: 'En production' },
        { equipement_id: 'EQ-003', rack_fk: 'ITN1-B01', nom_equipement: 'SW-CORE-01', type_equipement: 'Switch', marque: 'Cisco', modele: 'Nexus 9300', puissance_nominale_w: 500, puissance_reelle_w: 320, u_position: 20, hauteur_u: 1, statut: 'En production' }
    ],
    connexionsAC: [
        { connexion_ac_id: 'ACC-001', equipement_fk: 'EQ-001', voie: 1, chaine_fk: 'CH-A', puissance_nominale_kw: 0.375, puissance_reelle_kw: 0.190 },
        { connexion_ac_id: 'ACC-002', equipement_fk: 'EQ-001', voie: 2, chaine_fk: 'CH-B', puissance_nominale_kw: 0.375, puissance_reelle_kw: 0.190 }
    ],
    connexionsDC: [
        { connexion_dc_id: 'DCC-001', equipement_fk: 'EQ-003', voie: 1, chaine_fk: 'CH-A', puissance_nominale_kw: 0.250, puissance_reelle_kw: 0.160 },
        { connexion_dc_id: 'DCC-002', equipement_fk: 'EQ-003', voie: 2, chaine_fk: 'CH-B', puissance_nominale_kw: 0.250, puissance_reelle_kw: 0.160 }
    ],
    autresConsommateurs: [
        { consommateur_id: 'CONS-CLIM-A1', chaine_fk: 'CH-A', puissance_nominale_kw: 50, puissance_reelle_kw: 42 },
        { consommateur_id: 'CONS-CLIM-B1', chaine_fk: 'CH-B', puissance_nominale_kw: 50, puissance_reelle_kw: 38 }
    ]
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    loadConfig();
    setupEventListeners();
    loadData();
    initCharts();
    updatePowerModeUI();
}

function loadConfig() {
    const savedUrl = localStorage.getItem('dcim_api_url');
    if (savedUrl) {
        CONFIG.API_URL = savedUrl;
        const input = document.getElementById('appsScriptId');
        if (input) input.value = savedUrl;
    }
    STATE.powerMode = localStorage.getItem('dcim_power_mode') || 'NOMINALE';
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    document.getElementById('sidebarToggle')?.addEventListener('click', toggleSidebar);
    document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', handleNavigation));
    document.querySelectorAll('.switch-btn').forEach(btn => btn.addEventListener('click', handlePowerModeSwitch));
    document.getElementById('refreshBtn')?.addEventListener('click', () => { loadData(); showToast('Données actualisées', 'success'); });
    document.querySelectorAll('.view-all').forEach(link => {
        link.addEventListener('click', (e) => { e.preventDefault(); navigateTo(e.target.closest('.view-all').dataset.page); });
    });
    document.getElementById('saveConfig')?.addEventListener('click', saveConfig);
    document.getElementById('testConnection')?.addEventListener('click', testConnection);
    document.getElementById('runSimulation')?.addEventListener('click', runSimulation);
    document.getElementById('rackSearch')?.addEventListener('input', filterRacks);
    document.getElementById('equipSearch')?.addEventListener('input', filterEquipements);
    document.getElementById('modalClose')?.addEventListener('click', closeModal);
    document.getElementById('modalCancel')?.addEventListener('click', closeModal);
    document.getElementById('modalOverlay')?.addEventListener('click', (e) => { if (e.target.id === 'modalOverlay') closeModal(); });
    
    // Electrical config tabs
    document.querySelectorAll('.elec-tab').forEach(tab => tab.addEventListener('click', handleElecTabChange));
    document.querySelectorAll('.sub-tab').forEach(tab => tab.addEventListener('click', handleSubTabChange));
    document.getElementById('schemaChainSelect')?.addEventListener('change', updateChainSchema);
}

function handleElecTabChange(e) {
    const tab = e.currentTarget.dataset.tab;
    document.querySelectorAll('.elec-tab').forEach(t => t.classList.remove('active'));
    e.currentTarget.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-' + tab)?.classList.add('active');
    STATE.currentElecTab = tab;
}

function handleSubTabChange(e) {
    const subtab = e.currentTarget.dataset.subtab;
    document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
    e.currentTarget.classList.add('active');
}

// ============================================
// NAVIGATION
// ============================================

function handleNavigation(e) {
    e.preventDefault();
    navigateTo(e.currentTarget.dataset.page);
}

function navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.page === page));
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + page));
    const titles = { dashboard: 'Dashboard', 'config-elec': 'Configuration Électrique', chaines: 'Chaînes Électriques', racks: 'Racks', equipements: 'Équipements', simulation: 'Simulation Perte', config: 'Configuration' };
    document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';
    STATE.currentPage = page;
    if (page === 'simulation') populateSimulationSelect();
    if (page === 'config-elec') { updateAllElecTables(); updateChainSchema(); }
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('collapsed'); }

// ============================================
// POWER MODE
// ============================================

function handlePowerModeSwitch(e) {
    STATE.powerMode = e.currentTarget.dataset.mode;
    localStorage.setItem('dcim_power_mode', STATE.powerMode);
    updatePowerModeUI();
    updateUI();
    showToast('Mode ' + (STATE.powerMode === 'NOMINALE' ? 'Nominale' : 'Réelle') + ' activé', 'info');
}

function updatePowerModeUI() {
    document.querySelectorAll('.switch-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === STATE.powerMode));
}

// ============================================
// DATA LOADING
// ============================================

async function loadData() {
    showLoading(true);
    try {
        if (CONFIG.API_URL) {
            const response = await fetch(CONFIG.API_URL + '?action=getAllData');
            if (response.ok) STATE.data = await response.json();
            else throw new Error('API Error');
        } else {
            STATE.data = JSON.parse(JSON.stringify(DEMO_DATA));
        }
        updateUI();
        updateLastUpdate();
        setConnectionStatus(true);
    } catch (error) {
        console.error('Error:', error);
        STATE.data = JSON.parse(JSON.stringify(DEMO_DATA));
        updateUI();
        setConnectionStatus(false);
        if (CONFIG.API_URL) showToast('Erreur connexion - Mode démo', 'warning');
    }
    showLoading(false);
}

function updateLastUpdate() { document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('fr-FR'); }
function setConnectionStatus(connected) {
    document.querySelector('.status-dot')?.classList.toggle('disconnected', !connected);
    const text = document.querySelector('.status-text');
    if (text) text.textContent = connected ? 'Connecté' : 'Mode démo';
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
    if (STATE.currentPage === 'config-elec') updateAllElecTables();
}

function updateKPIs() {
    const chainePower = calculateChainePower();
    const totalPower = Object.values(chainePower).reduce((sum, cp) => sum + cp.total, 0);
    const avgUtil = STATE.data.chaines.length > 0 ? Object.values(chainePower).reduce((sum, cp) => sum + cp.utilization, 0) / STATE.data.chaines.length : 0;
    document.getElementById('kpi-totalPower').textContent = totalPower.toFixed(1);
    document.getElementById('kpi-avgUtilization').textContent = avgUtil.toFixed(1) + '%';
    document.getElementById('kpi-racksCount').textContent = STATE.data.racks.length;
    document.getElementById('kpi-equipCount').textContent = STATE.data.equipements.length;
}

function calculateChainePower() {
    const { chaines, connexionsAC, connexionsDC, autresConsommateurs } = STATE.data;
    const powerField = STATE.powerMode === 'NOMINALE' ? 'puissance_nominale_kw' : 'puissance_reelle_kw';
    const result = {};
    chaines.forEach(ch => {
        result[ch.chaine_id] = { id: ch.chaine_id, code: ch.chaine_code, name: ch.chaine_nom, capacity: ch.puissance_nominale_kw, it: 0, autres: 0, total: 0, partner: ch.chaine_partenaire_fk };
    });
    [...(connexionsAC || []), ...(connexionsDC || [])].forEach(conn => {
        if (result[conn.chaine_fk]) result[conn.chaine_fk].it += conn[powerField] || 0;
    });
    (autresConsommateurs || []).forEach(cons => {
        if (result[cons.chaine_fk]) result[cons.chaine_fk].autres += cons[powerField] || 0;
    });
    Object.values(result).forEach(ch => {
        ch.total = ch.it + ch.autres;
        ch.utilization = (ch.total / ch.capacity) * 100;
        ch.status = ch.utilization >= CONFIG.THRESHOLDS.critical ? 'critical' : ch.utilization >= CONFIG.THRESHOLDS.alert ? 'alert' : 'ok';
    });
    return result;
}

function getStatusColor(status) {
    return status === 'critical' ? '#EF5350' : status === 'alert' ? '#FFA726' : '#66BB6A';
}

// ============================================
// CHARTS
// ============================================

function initCharts() {
    const ctx = document.getElementById('chaineChart')?.getContext('2d');
    if (!ctx) return;
    STATE.charts.chaine = new Chart(ctx, {
        type: 'bar',
        data: { labels: [], datasets: [
            { label: 'IT', data: [], backgroundColor: '#42A5F5' },
            { label: 'Autres', data: [], backgroundColor: '#AB47BC' },
            { label: 'Disponible', data: [], backgroundColor: '#334155' }
        ]},
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { color: '#94a3b8' } } },
            scales: {
                x: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                y: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: '#334155' }, title: { display: true, text: 'kW', color: '#94a3b8' } }
            }
        }
    });
}

function updateChaineChart() {
    if (!STATE.charts.chaine) return;
    const chainePower = calculateChainePower();
    const chains = Object.values(chainePower);
    STATE.charts.chaine.data.labels = chains.map(c => 'Chaîne ' + c.code);
    STATE.charts.chaine.data.datasets[0].data = chains.map(c => c.it);
    STATE.charts.chaine.data.datasets[1].data = chains.map(c => c.autres);
    STATE.charts.chaine.data.datasets[2].data = chains.map(c => Math.max(0, c.capacity - c.total));
    STATE.charts.chaine.update();
}

function updateSimulationPreview() {
    const chainePower = calculateChainePower();
    const chaineA = Object.values(chainePower).find(c => c.code === 'A');
    const chaineB = Object.values(chainePower).find(c => c.code === 'B');
    if (chaineA && chaineB) {
        const pctIfAFails = ((chaineB.total + chaineA.total) / chaineB.capacity) * 100;
        const pctIfBFails = ((chaineA.total + chaineB.total) / chaineA.capacity) * 100;
        updateSimBar('simProgressA', 'simValueA', pctIfAFails);
        updateSimBar('simProgressB', 'simValueB', pctIfBFails);
    }
}

function updateSimBar(barId, valueId, percent) {
    const bar = document.getElementById(barId);
    const value = document.getElementById(valueId);
    if (bar && value) {
        bar.style.width = Math.min(percent, 100) + '%';
        const status = percent >= CONFIG.THRESHOLDS.critical ? 'critical' : percent >= CONFIG.THRESHOLDS.alert ? 'alert' : 'ok';
        bar.style.backgroundColor = getStatusColor(status);
        value.textContent = percent.toFixed(1) + '%';
        value.style.color = getStatusColor(status);
    }
}

// ============================================
// ELECTRICAL CONFIG TABLES
// ============================================

function updateAllElecTables() {
    updateTransformateursTable();
    updateGroupesTable();
    updateTGBTTable();
    updateUPSTable();
    updateRedresseursTable();
    updateTableauxTable();
    updateCanalisTable();
    updateBoitiersTable();
    updatePDUTable();
    updateChainSchema();
}

function updateTransformateursTable() {
    const tbody = document.getElementById('transformateursTableBody');
    if (!tbody) return;
    tbody.innerHTML = (STATE.data.transformateurs || []).map(t => `
        <tr>
            <td><strong>${t.transfo_id}</strong></td>
            <td>${t.transfo_nom}</td>
            <td><span class="type-badge">${t.chaine_fk}</span></td>
            <td>${t.puissance_kva} kVA</td>
            <td>${t.tension_primaire}</td>
            <td>${t.tension_secondaire}</td>
            <td><span class="status-badge ${t.statut === 'Actif' ? 'ok' : 'inactive'}">${t.statut}</span></td>
            <td><div class="action-btns">
                <button class="action-btn edit" onclick="openEditModal('transformateur', '${t.transfo_id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete" onclick="confirmDelete('transformateur', '${t.transfo_id}')"><i class="fas fa-trash"></i></button>
            </div></td>
        </tr>
    `).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--text-secondary)">Aucun transformateur configuré</td></tr>';
}

function updateGroupesTable() {
    const tbody = document.getElementById('groupesTableBody');
    if (!tbody) return;
    tbody.innerHTML = (STATE.data.groupes || []).map(g => `
        <tr>
            <td><strong>${g.groupe_id}</strong></td>
            <td>${g.groupe_nom}</td>
            <td><span class="type-badge">${g.chaine_fk}</span></td>
            <td>${g.puissance_kva} kVA</td>
            <td>${g.carburant}</td>
            <td>${g.autonomie_h}h</td>
            <td><span class="status-badge ${g.statut === 'Standby' ? 'alert' : 'ok'}">${g.statut}</span></td>
            <td><div class="action-btns">
                <button class="action-btn edit" onclick="openEditModal('groupe', '${g.groupe_id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete" onclick="confirmDelete('groupe', '${g.groupe_id}')"><i class="fas fa-trash"></i></button>
            </div></td>
        </tr>
    `).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--text-secondary)">Aucun groupe électrogène configuré</td></tr>';
}

function updateTGBTTable() {
    const tbody = document.getElementById('tgbtTableBody');
    if (!tbody) return;
    tbody.innerHTML = (STATE.data.tgbt || []).map(t => `
        <tr>
            <td><strong>${t.tgbt_id}</strong></td>
            <td>${t.tgbt_nom}</td>
            <td><span class="type-badge">${t.chaine_fk}</span></td>
            <td>${t.source_normale_fk}</td>
            <td>${t.source_secours_fk}</td>
            <td>${t.intensite_nominale_a} A</td>
            <td>${t.nb_departs}</td>
            <td><span class="status-badge ok">${t.statut}</span></td>
            <td><div class="action-btns">
                <button class="action-btn edit" onclick="openEditModal('tgbt', '${t.tgbt_id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete" onclick="confirmDelete('tgbt', '${t.tgbt_id}')"><i class="fas fa-trash"></i></button>
            </div></td>
        </tr>
    `).join('') || '<tr><td colspan="9" style="text-align:center;color:var(--text-secondary)">Aucun TGBT configuré</td></tr>';
}

function updateUPSTable() {
    const tbody = document.getElementById('upsTableBody');
    if (!tbody) return;
    tbody.innerHTML = (STATE.data.ups || []).map(u => `
        <tr>
            <td><strong>${u.ups_id}</strong></td>
            <td>${u.ups_nom}</td>
            <td><span class="type-badge">${u.chaine_fk}</span></td>
            <td>${u.tgbt_fk}</td>
            <td>${u.puissance_kva} kVA</td>
            <td>${u.rendement_pct}%</td>
            <td>${u.autonomie_min} min</td>
            <td><div class="progress-cell"><div class="progress-bar" style="width:80px"><div class="progress-fill" style="width:${u.charge_pct}%;background:${getStatusColor(u.charge_pct >= 85 ? 'critical' : u.charge_pct >= 70 ? 'alert' : 'ok')}"></div></div><span>${u.charge_pct}%</span></div></td>
            <td><span class="status-badge ok">${u.statut}</span></td>
            <td><div class="action-btns">
                <button class="action-btn edit" onclick="openEditModal('ups', '${u.ups_id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete" onclick="confirmDelete('ups', '${u.ups_id}')"><i class="fas fa-trash"></i></button>
            </div></td>
        </tr>
    `).join('') || '<tr><td colspan="10" style="text-align:center;color:var(--text-secondary)">Aucun UPS configuré</td></tr>';
}

function updateRedresseursTable() {
    const tbody = document.getElementById('redresseursTableBody');
    if (!tbody) return;
    tbody.innerHTML = (STATE.data.redresseurs || []).map(r => `
        <tr>
            <td><strong>${r.redresseur_id}</strong></td>
            <td>${r.redresseur_nom}</td>
            <td><span class="type-badge">${r.chaine_fk}</span></td>
            <td><span class="type-badge">${r.mode_alimentation}</span></td>
            <td>${r.mode_alimentation === 'VIA_UPS' ? r.ups_fk : r.tableau_direct_fk}</td>
            <td>${r.puissance_kw} kW</td>
            <td>${r.tension_dc_v}V</td>
            <td>${r.batteries_presentes}${r.batteries_presentes === 'Oui' ? ' (' + r.autonomie_batteries_min + ' min)' : ''}</td>
            <td><span class="status-badge ok">${r.statut}</span></td>
            <td><div class="action-btns">
                <button class="action-btn edit" onclick="openEditModal('redresseur', '${r.redresseur_id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete" onclick="confirmDelete('redresseur', '${r.redresseur_id}')"><i class="fas fa-trash"></i></button>
            </div></td>
        </tr>
    `).join('') || '<tr><td colspan="10" style="text-align:center;color:var(--text-secondary)">Aucun redresseur configuré</td></tr>';
}

function updateTableauxTable() {
    const tbody = document.getElementById('tableauxTableBody');
    if (!tbody) return;
    const all = [...(STATE.data.tableauxDistrib || []), ...(STATE.data.tableauxDC || []).map(t => ({...t, tableau_id: t.tableau_dc_id, tableau_nom: t.tableau_dc_nom, type: 'DC'}))];
    tbody.innerHTML = all.map(t => `
        <tr>
            <td><strong>${t.tableau_id}</strong></td>
            <td>${t.tableau_nom}</td>
            <td><span class="type-badge">${t.type || 'AC'}</span></td>
            <td><span class="type-badge">${t.chaine_fk}</span></td>
            <td>${t.ups_fk || t.redresseur_fk || '-'}</td>
            <td>${t.intensite_nominale_a} A</td>
            <td>${t.nb_departs_total}</td>
            <td>${t.nb_departs_utilises}</td>
            <td><span class="status-badge ok">${t.statut}</span></td>
            <td><div class="action-btns">
                <button class="action-btn edit" onclick="openEditModal('tableau', '${t.tableau_id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete" onclick="confirmDelete('tableau', '${t.tableau_id}')"><i class="fas fa-trash"></i></button>
            </div></td>
        </tr>
    `).join('') || '<tr><td colspan="10" style="text-align:center;color:var(--text-secondary)">Aucun tableau configuré</td></tr>';
}

function updateCanalisTable() {
    const tbody = document.getElementById('canalisTableBody');
    if (!tbody) return;
    tbody.innerHTML = (STATE.data.canalis || []).map(c => `
        <tr>
            <td><strong>${c.canalis_id}</strong></td>
            <td>${c.canalis_nom}</td>
            <td><span class="type-badge">${c.chaine_fk}</span></td>
            <td>${c.ups_fk || c.tableau_fk || '-'}</td>
            <td>${c.intensite_nominale_a} A</td>
            <td>${c.longueur_m} m</td>
            <td>${c.nb_boitiers}</td>
            <td><span class="status-badge ok">${c.statut}</span></td>
            <td><div class="action-btns">
                <button class="action-btn edit" onclick="openEditModal('canalis', '${c.canalis_id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete" onclick="confirmDelete('canalis', '${c.canalis_id}')"><i class="fas fa-trash"></i></button>
            </div></td>
        </tr>
    `).join('') || '<tr><td colspan="9" style="text-align:center;color:var(--text-secondary)">Aucun canalis configuré</td></tr>';
}

function updateBoitiersTable() {
    const tbody = document.getElementById('boitiersTableBody');
    if (!tbody) return;
    tbody.innerHTML = (STATE.data.boitiers || []).map(b => `
        <tr>
            <td><strong>${b.boitier_id}</strong></td>
            <td>${b.canalis_fk}</td>
            <td>${b.position_m} m</td>
            <td>${b.nb_prises_total}</td>
            <td>${b.nb_prises_utilisees}</td>
            <td>${b.nb_prises_total - b.nb_prises_utilisees}</td>
            <td><div class="action-btns">
                <button class="action-btn edit" onclick="openEditModal('boitier', '${b.boitier_id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete" onclick="confirmDelete('boitier', '${b.boitier_id}')"><i class="fas fa-trash"></i></button>
            </div></td>
        </tr>
    `).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--text-secondary)">Aucun boîtier configuré</td></tr>';
}

function updatePDUTable() {
    const tbody = document.getElementById('pduTableBody');
    if (!tbody) return;
    tbody.innerHTML = (STATE.data.pdu || []).map(p => `
        <tr>
            <td><strong>${p.pdu_id}</strong></td>
            <td>${p.pdu_nom}</td>
            <td>${p.rack_fk}</td>
            <td><span class="type-badge">${p.voie}</span></td>
            <td><span class="type-badge">${p.mode_alimentation}</span></td>
            <td>${p.mode_alimentation === 'VIA_CANALIS' ? p.boitier_canalis_fk : p.tableau_distrib_fk}</td>
            <td>${p.intensite_nominale_a} A</td>
            <td>${p.nb_c13_total - p.nb_c13_utilises}/${p.nb_c13_total}</td>
            <td>${p.nb_c19_total - p.nb_c19_utilises}/${p.nb_c19_total}</td>
            <td><span class="status-badge ok">${p.statut}</span></td>
            <td><div class="action-btns">
                <button class="action-btn edit" onclick="openEditModal('pdu', '${p.pdu_id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete" onclick="confirmDelete('pdu', '${p.pdu_id}')"><i class="fas fa-trash"></i></button>
            </div></td>
        </tr>
    `).join('') || '<tr><td colspan="11" style="text-align:center;color:var(--text-secondary)">Aucun PDU configuré</td></tr>';
}

// ============================================
// CHAIN SCHEMA
// ============================================

function updateChainSchema() {
    const select = document.getElementById('schemaChainSelect');
    const flow = document.getElementById('schemaFlow');
    if (!select || !flow) return;
    
    const chainCode = select.value;
    const chaine = STATE.data.chaines.find(c => c.chaine_code === chainCode);
    if (!chaine) return;
    
    const transfo = STATE.data.transformateurs?.find(t => t.chaine_fk === chaine.chaine_id);
    const groupe = STATE.data.groupes?.find(g => g.chaine_fk === chaine.chaine_id);
    const tgbt = STATE.data.tgbt?.find(t => t.chaine_fk === chaine.chaine_id);
    const ups = STATE.data.ups?.find(u => u.chaine_fk === chaine.chaine_id);
    const canalis = STATE.data.canalis?.find(c => c.chaine_fk === chaine.chaine_id);
    const redresseur = STATE.data.redresseurs?.find(r => r.chaine_fk === chaine.chaine_id);
    
    flow.innerHTML = `
        ${transfo ? `<div class="schema-node"><i class="fas fa-car-battery"></i><span class="node-name">${transfo.transfo_id}</span><span class="node-value">${transfo.puissance_kva} kVA</span></div><i class="fas fa-arrow-right schema-arrow"></i>` : ''}
        ${groupe ? `<div class="schema-node"><i class="fas fa-gas-pump"></i><span class="node-name">${groupe.groupe_id}</span><span class="node-value">${groupe.puissance_kva} kVA</span></div><i class="fas fa-arrow-right schema-arrow"></i>` : ''}
        ${tgbt ? `<div class="schema-node"><i class="fas fa-table-cells"></i><span class="node-name">${tgbt.tgbt_id}</span><span class="node-value">${tgbt.intensite_nominale_a} A</span></div><i class="fas fa-arrow-right schema-arrow"></i>` : ''}
        ${ups ? `<div class="schema-node active"><i class="fas fa-battery-full"></i><span class="node-name">${ups.ups_id}</span><span class="node-value">${ups.puissance_kva} kVA</span></div><i class="fas fa-arrow-right schema-arrow"></i>` : ''}
        ${canalis ? `<div class="schema-node"><i class="fas fa-bars"></i><span class="node-name">${canalis.canalis_id}</span><span class="node-value">${canalis.longueur_m}m</span></div><i class="fas fa-arrow-right schema-arrow"></i>` : ''}
        ${redresseur ? `<div class="schema-node"><i class="fas fa-right-left"></i><span class="node-name">${redresseur.redresseur_id}</span><span class="node-value">${redresseur.tension_dc_v}V DC</span></div><i class="fas fa-arrow-right schema-arrow"></i>` : ''}
        <div class="schema-node"><i class="fas fa-plug"></i><span class="node-name">PDU</span><span class="node-value">→ Racks</span></div>
    `;
}

// ============================================
// RACKS & EQUIPEMENTS
// ============================================

function updateRacksGrid() {
    const container = document.getElementById('racksGrid');
    if (!container) return;
    const rackPower = calculateRackPower();
    container.innerHTML = STATE.data.racks.slice(0, 12).map(rack => {
        const power = rackPower[rack.rack_id] || { total: 0 };
        const percent = (power.total / rack.puissance_max_kw) * 100;
        const status = percent >= CONFIG.THRESHOLDS.critical ? 'critical' : percent >= CONFIG.THRESHOLDS.alert ? 'alert' : 'ok';
        return `<div class="rack-mini status-${status}" onclick="showRackDetail('${rack.rack_id}')">
            <div class="rack-mini-id">${rack.rack_id}</div>
            <div class="rack-mini-power">${power.total.toFixed(1)} kW</div>
            <div class="rack-mini-bar"><div class="rack-mini-fill" style="width:${percent}%;background:${getStatusColor(status)}"></div></div>
        </div>`;
    }).join('');
}

function calculateRackPower() {
    const powerField = STATE.powerMode === 'NOMINALE' ? 'puissance_nominale_kw' : 'puissance_reelle_kw';
    const result = {};
    STATE.data.racks.forEach(rack => { result[rack.rack_id] = { total: 0 }; });
    const equipRack = {};
    STATE.data.equipements.forEach(eq => { equipRack[eq.equipement_id] = eq.rack_fk; });
    [...(STATE.data.connexionsAC || []), ...(STATE.data.connexionsDC || [])].forEach(conn => {
        const rackId = equipRack[conn.equipement_fk];
        if (result[rackId]) result[rackId].total += conn[powerField] || 0;
    });
    return result;
}

function updateRacksTable() {
    const tbody = document.getElementById('racksTableBody');
    if (!tbody) return;
    const rackPower = calculateRackPower();
    tbody.innerHTML = STATE.data.racks.map(rack => {
        const power = rackPower[rack.rack_id] || { total: 0 };
        const percent = (power.total / rack.puissance_max_kw) * 100;
        const status = percent >= CONFIG.THRESHOLDS.critical ? 'critical' : percent >= CONFIG.THRESHOLDS.alert ? 'alert' : 'ok';
        return `<tr>
            <td><strong>${rack.rack_id}</strong></td>
            <td>${rack.salle_fk}</td>
            <td>${rack.rangee}</td>
            <td>${rack.designation}</td>
            <td>${rack.u_utilises}/${rack.u_total} U</td>
            <td>${power.total.toFixed(2)} / ${rack.puissance_max_kw} kW</td>
            <td><div class="progress-cell"><div class="progress-bar"><div class="progress-fill" style="width:${percent}%;background:${getStatusColor(status)}"></div></div><span>${percent.toFixed(1)}%</span></div></td>
            <td><span class="status-badge ${status}">${status.toUpperCase()}</span></td>
            <td><div class="action-btns"><button class="action-btn view" onclick="showRackDetail('${rack.rack_id}')"><i class="fas fa-eye"></i></button></div></td>
        </tr>`;
    }).join('');
}

function updateChaineCards() {
    const container = document.getElementById('chaineCards');
    if (!container) return;
    const chainePower = calculateChainePower();
    container.innerHTML = Object.values(chainePower).map(ch => {
        const partner = chainePower[ch.partner];
        let simPct = 0;
        if (partner) simPct = ((ch.total + partner.total) / ch.capacity) * 100;
        const simStatus = simPct >= CONFIG.THRESHOLDS.critical ? 'critical' : simPct >= CONFIG.THRESHOLDS.alert ? 'alert' : 'ok';
        return `<div class="chaine-card">
            <div class="chaine-header">
                <div class="chaine-title"><div class="chaine-code ${ch.code}">${ch.code}</div><div><div class="chaine-name">${ch.name}</div><small style="color:var(--text-secondary)">${ch.capacity} kW</small></div></div>
                <span class="chaine-status ${ch.status}">${ch.status.toUpperCase()}</span>
            </div>
            <div class="chaine-body">
                <div class="chaine-gauge"><div class="gauge-header"><span>Charge (${STATE.powerMode})</span><span>${ch.utilization.toFixed(1)}%</span></div><div class="gauge-bar"><div class="gauge-fill" style="width:${ch.utilization}%;background:${getStatusColor(ch.status)}"></div></div></div>
                <div class="chaine-stats">
                    <div class="stat-item"><span class="stat-value">${ch.it.toFixed(1)}</span><span class="stat-label">IT (kW)</span></div>
                    <div class="stat-item"><span class="stat-value">${ch.autres.toFixed(1)}</span><span class="stat-label">Autres (kW)</span></div>
                    <div class="stat-item"><span class="stat-value">${ch.total.toFixed(1)}</span><span class="stat-label">Total (kW)</span></div>
                    <div class="stat-item"><span class="stat-value">${(ch.capacity - ch.total).toFixed(1)}</span><span class="stat-label">Disponible</span></div>
                </div>
            </div>
            ${partner ? `<div class="chaine-footer"><div class="sim-warning"><i class="fas fa-exclamation-triangle"></i><span>Si perte ${partner.code}: ${simPct.toFixed(1)}%</span></div><span class="status-badge ${simStatus}">${simStatus.toUpperCase()}</span></div>` : ''}
        </div>`;
    }).join('');
}

function updateEquipementsTable() {
    const tbody = document.getElementById('equipTableBody');
    if (!tbody) return;
    tbody.innerHTML = STATE.data.equipements.map(eq => {
        const ratio = ((eq.puissance_reelle_w / eq.puissance_nominale_w) * 100).toFixed(0);
        return `<tr>
            <td><strong>${eq.nom_equipement}</strong><br><small style="color:var(--text-secondary)">${eq.marque} ${eq.modele}</small></td>
            <td><span class="type-badge">${eq.type_equipement}</span></td>
            <td>${eq.rack_fk}</td>
            <td>U${eq.u_position} (${eq.hauteur_u}U)</td>
            <td>${eq.puissance_nominale_w} W</td>
            <td>${eq.puissance_reelle_w} W</td>
            <td><div class="progress-cell"><div class="progress-bar" style="width:60px"><div class="progress-fill" style="width:${ratio}%;background:var(--primary)"></div></div><span>${ratio}%</span></div></td>
            <td><span class="status-badge ok">${eq.statut}</span></td>
            <td><div class="action-btns"><button class="action-btn edit" onclick="editEquipement('${eq.equipement_id}')"><i class="fas fa-edit"></i></button></div></td>
        </tr>`;
    }).join('');
}

function filterRacks() {
    const search = document.getElementById('rackSearch').value.toLowerCase();
    document.querySelectorAll('#racksTableBody tr').forEach(row => { row.style.display = row.textContent.toLowerCase().includes(search) ? '' : 'none'; });
}

function filterEquipements() {
    const search = document.getElementById('equipSearch').value.toLowerCase();
    document.querySelectorAll('#equipTableBody tr').forEach(row => { row.style.display = row.textContent.toLowerCase().includes(search) ? '' : 'none'; });
}

// ============================================
// SIMULATION
// ============================================

function populateSimulationSelect() {
    const select = document.getElementById('simChaineSelect');
    if (!select) return;
    select.innerHTML = STATE.data.chaines.filter(ch => ch.chaine_partenaire_fk).map(ch => `<option value="${ch.chaine_id}">Chaîne ${ch.chaine_code} - ${ch.chaine_nom}</option>`).join('');
}

function runSimulation() {
    const select = document.getElementById('simChaineSelect');
    const resultsDiv = document.getElementById('simulationResults');
    if (!select || !resultsDiv) return;
    
    const chainePower = calculateChainePower();
    const chaine = chainePower[select.value];
    if (!chaine || !chaine.partner) { showToast('Sélectionnez une chaîne avec partenaire', 'warning'); return; }
    
    const partner = chainePower[chaine.partner];
    const totalLoad = chaine.total + partner.total;
    const pctAfter = (totalLoad / partner.capacity) * 100;
    const status = pctAfter >= 100 ? 'critical' : pctAfter >= CONFIG.THRESHOLDS.critical ? 'critical' : pctAfter >= CONFIG.THRESHOLDS.alert ? 'alert' : 'ok';
    const margin = partner.capacity - totalLoad;
    
    resultsDiv.innerHTML = `
        <div class="sim-result-header">
            <div class="sim-result-icon ${status}"><i class="fas fa-${status === 'ok' ? 'check-circle' : 'exclamation-circle'}"></i></div>
            <div class="sim-result-title"><h3>${status === 'ok' ? 'Capacité Suffisante' : status === 'alert' ? 'Attention' : 'Critique'}</h3><span class="sim-result-subtitle">Simulation perte Chaîne ${chaine.code} - Mode ${STATE.powerMode}</span></div>
        </div>
        <div class="sim-details">
            <div class="sim-detail-card"><span class="sim-detail-value">${chaine.total.toFixed(1)} kW</span><span class="sim-detail-label">Charge ${chaine.code} perdue</span></div>
            <div class="sim-detail-card"><span class="sim-detail-value">${partner.total.toFixed(1)} kW</span><span class="sim-detail-label">Charge actuelle ${partner.code}</span></div>
            <div class="sim-detail-card"><span class="sim-detail-value" style="color:${getStatusColor(status)}">${totalLoad.toFixed(1)} kW</span><span class="sim-detail-label">Total après transfert</span></div>
            <div class="sim-detail-card"><span class="sim-detail-value">${partner.capacity} kW</span><span class="sim-detail-label">Capacité ${partner.code}</span></div>
            <div class="sim-detail-card"><span class="sim-detail-value" style="color:${getStatusColor(status)}">${pctAfter.toFixed(1)}%</span><span class="sim-detail-label">Taux final</span></div>
            <div class="sim-detail-card"><span class="sim-detail-value" style="color:${margin >= 0 ? '#66BB6A' : '#EF5350'}">${margin.toFixed(1)} kW</span><span class="sim-detail-label">${margin >= 0 ? 'Marge' : 'Dépassement'}</span></div>
        </div>
    `;
}

// ============================================
// MODALS
// ============================================

function openModal(title, content, onConfirm) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('modalOverlay').classList.add('active');
    if (onConfirm) document.getElementById('modalConfirm').onclick = () => { onConfirm(); closeModal(); };
}

function closeModal() { document.getElementById('modalOverlay').classList.remove('active'); }

function openAddModal(type) {
    const forms = {
        transformateur: `<div class="form-group"><label>ID</label><input type="text" id="form-id" placeholder="TR-XX"></div>
            <div class="form-group"><label>Nom</label><input type="text" id="form-nom"></div>
            <div class="form-row"><div class="form-group"><label>Chaîne</label><select id="form-chaine">${STATE.data.chaines.map(c => `<option value="${c.chaine_id}">${c.chaine_code}</option>`).join('')}</select></div>
            <div class="form-group"><label>Puissance (kVA)</label><input type="number" id="form-puissance"></div></div>
            <div class="form-row"><div class="form-group"><label>Tension Primaire</label><input type="text" id="form-tension1" value="20kV"></div>
            <div class="form-group"><label>Tension Secondaire</label><input type="text" id="form-tension2" value="400V"></div></div>`,
        ups: `<div class="form-group"><label>ID</label><input type="text" id="form-id" placeholder="UPS-XX"></div>
            <div class="form-group"><label>Nom</label><input type="text" id="form-nom"></div>
            <div class="form-row"><div class="form-group"><label>Chaîne</label><select id="form-chaine">${STATE.data.chaines.map(c => `<option value="${c.chaine_id}">${c.chaine_code}</option>`).join('')}</select></div>
            <div class="form-group"><label>TGBT Source</label><select id="form-tgbt">${(STATE.data.tgbt || []).map(t => `<option value="${t.tgbt_id}">${t.tgbt_id}</option>`).join('')}</select></div></div>
            <div class="form-row"><div class="form-group"><label>Puissance (kVA)</label><input type="number" id="form-puissance"></div>
            <div class="form-group"><label>Rendement (%)</label><input type="number" id="form-rendement" value="96"></div></div>
            <div class="form-group"><label>Autonomie (min)</label><input type="number" id="form-autonomie" value="10"></div>`,
        pdu: `<div class="form-group"><label>ID</label><input type="text" id="form-id" placeholder="PDU-XX"></div>
            <div class="form-group"><label>Nom</label><input type="text" id="form-nom"></div>
            <div class="form-row"><div class="form-group"><label>Rack</label><select id="form-rack">${STATE.data.racks.map(r => `<option value="${r.rack_id}">${r.rack_id}</option>`).join('')}</select></div>
            <div class="form-group"><label>Voie</label><select id="form-voie"><option value="A">A</option><option value="B">B</option></select></div></div>
            <div class="form-group"><label>Mode Alimentation</label><select id="form-mode"><option value="VIA_CANALIS">Via Canalis</option><option value="VIA_TABLEAU_DISTRIB">Via Tableau Distrib</option></select></div>
            <div class="form-row"><div class="form-group"><label>Intensité (A)</label><input type="number" id="form-intensite" value="32"></div>
            <div class="form-group"><label>Nb C13</label><input type="number" id="form-c13" value="24"></div></div>
            <div class="form-group"><label>Nb C19</label><input type="number" id="form-c19" value="6"></div>`
    };
    
    const defaultForm = `<div class="form-group"><label>ID</label><input type="text" id="form-id"></div>
        <div class="form-group"><label>Nom</label><input type="text" id="form-nom"></div>
        <div class="form-group"><label>Chaîne</label><select id="form-chaine">${STATE.data.chaines.map(c => `<option value="${c.chaine_id}">${c.chaine_code}</option>`).join('')}</select></div>`;
    
    openModal('Ajouter ' + type, forms[type] || defaultForm, () => {
        showToast(type + ' ajouté (démo)', 'success');
        // In real app, would call API to save
    });
}

function openEditModal(type, id) {
    openModal('Modifier ' + type + ' ' + id, '<p>Formulaire d\'édition pour ' + id + '</p><p style="color:var(--text-secondary)">Connectez l\'API pour activer l\'édition</p>', () => {
        showToast('Modification sauvegardée (démo)', 'success');
    });
}

function confirmDelete(type, id) {
    openModal('Supprimer ' + id + '?', '<p>Êtes-vous sûr de vouloir supprimer cet élément?</p><p style="color:var(--danger)">Cette action est irréversible.</p>', () => {
        showToast(type + ' supprimé (démo)', 'success');
    });
}

function showRackDetail(rackId) {
    const rack = STATE.data.racks.find(r => r.rack_id === rackId);
    const equips = STATE.data.equipements.filter(e => e.rack_fk === rackId);
    if (!rack) return;
    const content = `<div style="margin-bottom:20px"><h4>${rack.designation}</h4><p style="color:var(--text-secondary)">Salle: ${rack.salle_fk} | Rangée: ${rack.rangee} | ${rack.u_utilises}/${rack.u_total} U</p></div>
        <h4 style="margin-bottom:10px">Équipements (${equips.length})</h4>
        <div style="max-height:200px;overflow-y:auto">${equips.map(eq => `<div style="display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid var(--border-color)">
            <div><strong>${eq.nom_equipement}</strong><br><small style="color:var(--text-secondary)">U${eq.u_position} - ${eq.type_equipement}</small></div>
            <div style="text-align:right"><div>${STATE.powerMode === 'NOMINALE' ? eq.puissance_nominale_w : eq.puissance_reelle_w} W</div><small style="color:var(--text-secondary)">${STATE.powerMode}</small></div>
        </div>`).join('')}</div>`;
    openModal('Rack ' + rackId, content);
}

function editEquipement(equipId) {
    const eq = STATE.data.equipements.find(e => e.equipement_id === equipId);
    if (!eq) return;
    const content = `<form><div class="form-group"><label>Nom</label><input type="text" value="${eq.nom_equipement}"></div>
        <div class="form-row"><div class="form-group"><label>P. Nominale (W)</label><input type="number" value="${eq.puissance_nominale_w}"></div>
        <div class="form-group"><label>P. Réelle (W)</label><input type="number" value="${eq.puissance_reelle_w}"></div></div></form>`;
    openModal('Modifier ' + eq.nom_equipement, content, () => { showToast('Modification sauvegardée (démo)', 'success'); });
}

// ============================================
// CONFIG & UTILITIES
// ============================================

function saveConfig() {
    const url = document.getElementById('appsScriptId').value.trim();
    localStorage.setItem('dcim_api_url', url);
    localStorage.setItem('dcim_alert_threshold', document.getElementById('alertThreshold')?.value || 70);
    localStorage.setItem('dcim_critical_threshold', document.getElementById('criticalThreshold')?.value || 85);
    localStorage.setItem('dcim_refresh_interval', (document.getElementById('refreshInterval')?.value || 300) * 1000);
    CONFIG.API_URL = url;
    showToast('Configuration sauvegardée', 'success');
    loadData();
}

async function testConnection() {
    const url = document.getElementById('appsScriptId').value.trim();
    if (!url) { showToast('Entrez l\'URL de l\'API', 'warning'); return; }
    showLoading(true);
    try {
        const response = await fetch(url + '?action=ping');
        if (response.ok) showToast('Connexion réussie!', 'success');
        else throw new Error('Failed');
    } catch (error) { showToast('Échec de connexion', 'error'); }
    showLoading(false);
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const icons = { success: 'check-circle', error: 'times-circle', warning: 'exclamation-triangle', info: 'info-circle' };
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<i class="fas fa-' + icons[type] + ' toast-icon"></i><span>' + message + '</span>';
    container.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'toastSlide 0.3s ease reverse'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function showLoading(show) { document.getElementById('loadingOverlay').classList.toggle('active', show); }

// Global functions
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.confirmDelete = confirmDelete;
window.showRackDetail = showRackDetail;
window.editEquipement = editEquipement;
