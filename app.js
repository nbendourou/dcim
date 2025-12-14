/**
 * DCIM V3 - Complete Data Center Infrastructure Management
 * Full CRUD with proper deletion and complete electrical tree
 */

const CONFIG = { API_URL: localStorage.getItem('dcim_api_url') || '', RACK_HEIGHT: 47 };

const STATE = {
    page: 'dashboard',
    selectedRack: null,
    selectedTableau: null,
    modal: { type: null, mode: null, id: null },
    data: { racks: [], equipements: [], boitiersAC: [], tableauxDC: [], connexionsAC: [], connexionsDC: [] }
};

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    setupNav();
    setupFilters();
    loadConfig();
    loadData();
});

function setupNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', e => { e.preventDefault(); navigateTo(item.dataset.page); });
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tree-tab').forEach(t => t.classList.remove('active'));
            document.getElementById(btn.dataset.tab)?.classList.add('active');
        });
    });
}

function setupFilters() {
    ['filter-salle', 'filter-rangee', 'search-rack'].forEach(id => 
        document.getElementById(id)?.addEventListener('change', renderRacksList) || 
        document.getElementById(id)?.addEventListener('input', renderRacksList));
    ['filter-equip-type', 'filter-equip-alim', 'search-equip'].forEach(id => 
        document.getElementById(id)?.addEventListener('change', renderEquipements) || 
        document.getElementById(id)?.addEventListener('input', renderEquipements));
    ['filter-boitier-canalis', 'filter-boitier-salle'].forEach(id => 
        document.getElementById(id)?.addEventListener('change', renderBoitiers));
    document.getElementById('filter-tableau-redresseur')?.addEventListener('change', renderTableauxList);
    document.getElementById('search-conn-ac')?.addEventListener('input', renderConnexionsAC);
    document.getElementById('search-conn-dc')?.addEventListener('input', renderConnexionsDC);
}

function navigateTo(page) {
    STATE.page = page;
    document.querySelectorAll('.nav-item').forEach(i => i.classList.toggle('active', i.dataset.page === page));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page)?.classList.add('active');
    document.getElementById('pageTitle').textContent = {
        dashboard: 'Dashboard', racks: 'Gestion des Racks', equipements: 'Équipements',
        canalis: 'Canalis', boitiers: 'Boîtiers AC', 'connexions-ac': 'Connexions AC',
        redresseurs: 'Redresseurs', 'tableaux-dc': 'Tableaux DC', 'connexions-dc': 'Connexions DC',
        arborescence: 'Arborescence Électrique', config: 'Configuration'
    }[page] || page;
    
    if (page === 'racks') renderRacksList();
    if (page === 'equipements') renderEquipements();
    if (page === 'canalis') renderCanalis();
    if (page === 'boitiers') renderBoitiers();
    if (page === 'connexions-ac') renderConnexionsAC();
    if (page === 'redresseurs') renderRedresseurs();
    if (page === 'tableaux-dc') renderTableauxList();
    if (page === 'connexions-dc') renderConnexionsDC();
    if (page === 'arborescence') renderArborescence();
    if (page === 'config') updateStats();
}

// ==================== DATA ====================
async function loadData() {
    showLoading(true);
    try {
        if (CONFIG.API_URL) {
            const res = await fetch(CONFIG.API_URL + '?action=getAllData');
            if (res.ok) {
                const data = await res.json();
                STATE.data = {
                    racks: data.racks || [], equipements: data.equipements || [],
                    boitiersAC: data.boitiersAC || [], tableauxDC: data.tableauxDC || [],
                    connexionsAC: data.connexionsAC || [], connexionsDC: data.connexionsDC || []
                };
                setConnected(true);
            } else throw new Error();
        } else {
            loadDemoData();
            setConnected(false);
        }
    } catch (e) {
        console.error(e);
        loadDemoData();
        setConnected(false);
    }
    renderAll();
    showLoading(false);
    document.getElementById('lastSync').textContent = new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
}

function loadDemoData() {
    STATE.data = {
        racks: [
            {id:'ITN1-A11',salle:'ITN1',rangee:'A',numero_baie:'A11',designation:'Switches Cisco',porteur:'OT',puissance_pdu_kw:22},
            {id:'ITN1-F06',salle:'ITN1',rangee:'F',numero_baie:'F06',designation:'Routeur Mobile',porteur:'OT',puissance_pdu_kw:22},
            {id:'ITN1-F16',salle:'ITN1',rangee:'F',numero_baie:'F16',designation:'Routeur PE Fixe',porteur:'OT',puissance_pdu_kw:22},
            {id:'ITN1-F17',salle:'ITN1',rangee:'F',numero_baie:'F17',designation:'Routeur PTX',porteur:'OT',puissance_pdu_kw:22},
            {id:'ITN2-E13',salle:'ITN2',rangee:'E',numero_baie:'E13',designation:'WDM',porteur:'OT',puissance_pdu_kw:22},
            {id:'ITN2-E17',salle:'ITN2',rangee:'E',numero_baie:'E17',designation:'Serveurs',porteur:'OT',puissance_pdu_kw:22},
            {id:'ITN2-E18',salle:'ITN2',rangee:'E',numero_baie:'E18',designation:'Routeur PTX P2',porteur:'OT',puissance_pdu_kw:22}
        ],
        equipements: [
            {id:'EQ-001',rack_fk:'ITN1-A11',nom_equipement:'Cisco N9K-C93180YC-FX3',type_equipement:'Switch',type_alimentation:'AC',u_position:30,hauteur_u:1,statut:'Actif'},
            {id:'EQ-002',rack_fk:'ITN2-E13',nom_equipement:'WDM_2-2',type_equipement:'Routeur',type_alimentation:'DC',u_position:30,hauteur_u:10,statut:'Actif'},
            {id:'EQ-003',rack_fk:'ITN1-F17',nom_equipement:'Routeur PTX10008 P1',type_equipement:'Routeur',type_alimentation:'DC',u_position:7,hauteur_u:13,statut:'Actif'},
            {id:'EQ-004',rack_fk:'ITN1-F16',nom_equipement:'Routeur MX10008 PE Fixe',type_equipement:'Routeur',type_alimentation:'DC',u_position:7,hauteur_u:13,statut:'Actif'},
            {id:'EQ-005',rack_fk:'ITN1-F06',nom_equipement:'Routeur MX10008 PE Mobile',type_equipement:'Routeur',type_alimentation:'DC',u_position:7,hauteur_u:13,statut:'Actif'}
        ],
        boitiersAC: [
            {id:'IT.1-TB.A.1.1',canalis:'IT.1-TB.A.1',salle:'ITN1',configuration:'2TRI',rangee:'J'},
            {id:'IT.1-TB.A.1.10',canalis:'IT.1-TB.A.1',salle:'ITN1',configuration:'2TRI',rangee:'I'},
            {id:'IT.1-TB.A.2.1',canalis:'IT.1-TB.A.2',salle:'ITN1',configuration:'2TRI',rangee:'J'},
            {id:'IT.2-TB.A.3.11',canalis:'IT.2-TB.A.3',salle:'ITN2',configuration:'2TRI',rangee:'E'}
        ],
        tableauxDC: [
            {id:'IT.1-SWB.REC.A.1.1',redresseur:'IT.1-SWB.REC.A.1',salle:'ITN1',total_25a:4,total_32a:5,total_40a:4,total_63a:35,total_80a:10,total_100a:10,total_125a:2},
            {id:'IT.1-SWB.REC.A.3.1',redresseur:'IT.1-SWB.REC.A.3',salle:'ITN1',total_25a:4,total_32a:5,total_40a:4,total_63a:35,total_80a:10,total_100a:10,total_125a:2},
            {id:'IT.1-SWB.REC.B.3.1',redresseur:'IT.1-SWB.REC.B.3',salle:'ITN1',total_25a:4,total_32a:5,total_40a:4,total_63a:35,total_80a:10,total_100a:10,total_125a:2}
        ],
        connexionsAC: [
            {id:'ACC-001',equipement_fk:'EQ-001',voie:1,puissance_kw:0.5,boitier_fk:'IT.1-TB.A.1.1',prise_utilisee:'TRI 1',phase:'L1'},
            {id:'ACC-002',equipement_fk:'EQ-001',voie:2,puissance_kw:0.5,boitier_fk:'IT.1-TB.A.2.1',prise_utilisee:'TRI 1',phase:'L1'}
        ],
        connexionsDC: [
            {id:'DCC-001',equipement_fk:'EQ-003',voie:1,puissance_kw:5.0,tableau_dc_fk:'IT.1-SWB.REC.A.3.1',numero_disjoncteur:10,calibre_a:80},
            {id:'DCC-002',equipement_fk:'EQ-003',voie:2,puissance_kw:5.0,tableau_dc_fk:'IT.1-SWB.REC.B.3.1',numero_disjoncteur:10,calibre_a:80},
            {id:'DCC-003',equipement_fk:'EQ-004',voie:1,puissance_kw:5.0,tableau_dc_fk:'IT.1-SWB.REC.A.3.1',numero_disjoncteur:11,calibre_a:100},
            {id:'DCC-004',equipement_fk:'EQ-004',voie:2,puissance_kw:5.0,tableau_dc_fk:'IT.1-SWB.REC.B.3.1',numero_disjoncteur:11,calibre_a:100}
        ]
    };
}

function renderAll() {
    renderDashboard();
    populateFilters();
    updateStats();
}

// ==================== DASHBOARD ====================
function renderDashboard() {
    const {racks, equipements, boitiersAC, tableauxDC, connexionsAC, connexionsDC} = STATE.data;
    document.getElementById('kpi-racks').textContent = racks.length;
    document.getElementById('kpi-equip').textContent = equipements.length;
    document.getElementById('kpi-boitiers').textContent = boitiersAC.length;
    document.getElementById('kpi-tableaux').textContent = tableauxDC.length;
    document.getElementById('badge-ac').textContent = connexionsAC.length;
    document.getElementById('badge-dc').textContent = connexionsDC.length;
    
    // Recent AC connections
    const acHtml = connexionsAC.slice(0, 5).map(c => {
        const eq = equipements.find(e => e.id === c.equipement_fk);
        return `<div class="conn-line"><i class="fas fa-plug"></i><span class="label">${eq?.nom_equipement || c.equipement_fk}</span> → ${c.boitier_fk}</div>`;
    }).join('') || '<p style="color:var(--text-dim)">Aucune connexion AC</p>';
    document.getElementById('dashboard-ac').innerHTML = acHtml;
    
    // Recent DC connections
    const dcHtml = connexionsDC.slice(0, 5).map(c => {
        const eq = equipements.find(e => e.id === c.equipement_fk);
        return `<div class="conn-line"><i class="fas fa-bolt"></i><span class="label">${eq?.nom_equipement || c.equipement_fk}</span> → ${c.tableau_dc_fk}</div>`;
    }).join('') || '<p style="color:var(--text-dim)">Aucune connexion DC</p>';
    document.getElementById('dashboard-dc').innerHTML = dcHtml;
}

function populateFilters() {
    const salles = [...new Set(STATE.data.racks.map(r => r.salle).filter(Boolean))];
    const rangees = [...new Set(STATE.data.racks.map(r => r.rangee).filter(Boolean))];
    const canalis = [...new Set(STATE.data.boitiersAC.map(b => b.canalis).filter(Boolean))];
    const redresseurs = [...new Set(STATE.data.tableauxDC.map(t => t.redresseur).filter(Boolean))];
    
    setOptions('filter-salle', salles, 'Toutes salles');
    setOptions('filter-rangee', rangees, 'Toutes rangées');
    setOptions('filter-boitier-canalis', canalis, 'Tous canalis');
    setOptions('filter-boitier-salle', salles, 'Toutes salles');
    setOptions('filter-tableau-redresseur', redresseurs, 'Tous redresseurs');
}

function setOptions(id, values, defaultText) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<option value="">${defaultText}</option>` + values.map(v => `<option value="${v}">${v}</option>`).join('');
}

// ==================== RACKS ====================
function renderRacksList() {
    const container = document.getElementById('racks-list');
    if (!container) return;
    
    let racks = STATE.data.racks;
    const salle = document.getElementById('filter-salle')?.value;
    const rangee = document.getElementById('filter-rangee')?.value;
    const search = document.getElementById('search-rack')?.value?.toLowerCase();
    
    if (salle) racks = racks.filter(r => r.salle === salle);
    if (rangee) racks = racks.filter(r => r.rangee === rangee);
    if (search) racks = racks.filter(r => r.id.toLowerCase().includes(search) || r.designation?.toLowerCase().includes(search));
    
    container.innerHTML = racks.map(r => {
        const equips = STATE.data.equipements.filter(e => e.rack_fk === r.id);
        const usedU = equips.reduce((s, e) => s + (parseInt(e.hauteur_u) || 0), 0);
        return `<div class="list-item ${STATE.selectedRack === r.id ? 'active' : ''}" onclick="selectRack('${r.id}')">
            <div class="list-item-icon"><i class="fas fa-server"></i></div>
            <div class="list-item-info"><div class="list-item-title">${r.id}</div><div class="list-item-sub">${r.designation || r.salle}</div></div>
            <div class="list-item-stats"><div>${usedU}/${CONFIG.RACK_HEIGHT} U</div><div>${equips.length} éq.</div></div>
        </div>`;
    }).join('') || '<div class="empty-state"><p>Aucun rack</p></div>';
}

function selectRack(id) {
    STATE.selectedRack = id;
    renderRacksList();
    renderRackDetail(id);
}

function renderRackDetail(id) {
    const container = document.getElementById('rack-detail');
    const rack = STATE.data.racks.find(r => r.id === id);
    if (!container || !rack) return;
    
    const equips = STATE.data.equipements.filter(e => e.rack_fk === id);
    const usedU = equips.reduce((s, e) => s + (parseInt(e.hauteur_u) || 0), 0);
    const pctU = Math.round((usedU / CONFIG.RACK_HEIGHT) * 100);
    
    // Build slot map
    const slots = {};
    equips.forEach(e => {
        const start = parseInt(e.u_position) || 1;
        const height = parseInt(e.hauteur_u) || 1;
        for (let u = start; u < start + height; u++) {
            slots[u] = { eq: e, isStart: u === start, isEnd: u === start + height - 1 };
        }
    });
    
    // Build rack visual
    let rackHtml = '';
    for (let u = CONFIG.RACK_HEIGHT; u >= 1; u--) {
        const slot = slots[u];
        let cls = 'rack-u';
        let label = '';
        if (slot) {
            cls += slot.eq.type_alimentation === 'DC' ? ' occupied-dc' : ' occupied';
            if (slot.isStart) { cls += ' start'; label = `<span class="rack-u-label">${slot.eq.nom_equipement}</span>`; }
            if (slot.isEnd) cls += ' end';
        }
        rackHtml += `<div class="${cls}" onclick="${slot ? `openModal('equipement','${slot.eq.id}')` : `openModal('equipement',null,'${id}',${u})`}" title="${slot ? slot.eq.nom_equipement : 'U'+u+' - Libre'}"><span class="rack-u-num">${u}</span>${label}</div>`;
    }
    
    // Equipment list with connections
    const equipList = equips.map(e => {
        const connsAC = STATE.data.connexionsAC.filter(c => c.equipement_fk === e.id);
        const connsDC = STATE.data.connexionsDC.filter(c => c.equipement_fk === e.id);
        const connInfo = [...connsAC.map(c => c.boitier_fk), ...connsDC.map(c => c.tableau_dc_fk)].join(', ') || 'Non connecté';
        return `<div class="equip-item" onclick="openModal('equipement','${e.id}')">
            <div class="equip-item-icon ${(e.type_alimentation||'ac').toLowerCase()}"><i class="fas fa-microchip"></i></div>
            <div><div class="equip-item-name">${e.nom_equipement}</div><div class="equip-item-pos">U${e.u_position} · ${e.hauteur_u}U · ${connInfo}</div></div>
        </div>`;
    }).join('');
    
    container.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 280px;">
            <div class="rack-visual">
                <div class="rack-header"><h3>${rack.id}</h3>
                    <div><button class="btn btn-sm" onclick="openModal('rack','${rack.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteItem('rack','${rack.id}')"><i class="fas fa-trash"></i></button></div>
                </div>
                <div class="rack-frame">${rackHtml}</div>
                <div class="rack-legend">
                    <span><i style="background:var(--blue)"></i> AC</span>
                    <span><i style="background:var(--purple)"></i> DC</span>
                    <span><i style="background:var(--bg-dark);border:1px solid var(--border)"></i> Libre</span>
                </div>
            </div>
            <div class="rack-info">
                <div class="info-section"><h4>Informations</h4>
                    <div class="info-row"><span class="info-label">Salle</span><span>${rack.salle}</span></div>
                    <div class="info-row"><span class="info-label">Rangée</span><span>${rack.rangee}</span></div>
                    <div class="info-row"><span class="info-label">Désignation</span><span>${rack.designation||'-'}</span></div>
                    <div class="info-row"><span class="info-label">Porteur</span><span>${rack.porteur||'-'}</span></div>
                </div>
                <div class="info-section"><h4>Capacité</h4>
                    <div class="info-row"><span class="info-label">U utilisés</span><span>${usedU} / ${CONFIG.RACK_HEIGHT}</span></div>
                    <div class="progress-bar"><div class="progress-fill" style="width:${pctU}%;background:${pctU>80?'var(--red)':pctU>60?'var(--orange)':'var(--green)'}"></div></div>
                </div>
                <div class="info-section"><h4>Équipements (${equips.length})</h4>
                    <div class="equip-list">${equipList || '<p style="color:var(--text-dim);font-size:12px">Aucun équipement</p>'}</div>
                    <button class="btn btn-primary btn-sm full" style="margin-top:12px" onclick="openModal('equipement',null,'${rack.id}')"><i class="fas fa-plus"></i> Ajouter</button>
                </div>
            </div>
        </div>`;
}

// ==================== EQUIPEMENTS ====================
function renderEquipements() {
    const tbody = document.querySelector('#table-equipements tbody');
    if (!tbody) return;
    
    let equips = STATE.data.equipements;
    const type = document.getElementById('filter-equip-type')?.value;
    const alim = document.getElementById('filter-equip-alim')?.value;
    const search = document.getElementById('search-equip')?.value?.toLowerCase();
    
    if (type) equips = equips.filter(e => e.type_equipement === type);
    if (alim) equips = equips.filter(e => e.type_alimentation === alim);
    if (search) equips = equips.filter(e => e.nom_equipement?.toLowerCase().includes(search) || e.rack_fk?.toLowerCase().includes(search));
    
    tbody.innerHTML = equips.map(e => {
        const connsAC = STATE.data.connexionsAC.filter(c => c.equipement_fk === e.id);
        const connsDC = STATE.data.connexionsDC.filter(c => c.equipement_fk === e.id);
        const connCount = connsAC.length + connsDC.length;
        return `<tr>
            <td><strong>${e.nom_equipement}</strong></td>
            <td>${e.type_equipement||'-'}</td>
            <td><span class="badge ${(e.type_alimentation||'ac').toLowerCase()}">${e.type_alimentation||'AC'}</span></td>
            <td>${e.rack_fk}</td>
            <td>U${e.u_position} (${e.hauteur_u}U)</td>
            <td><span class="badge ${connCount>0?'green':''}">${connCount}</span></td>
            <td>
                <button class="btn btn-sm" onclick="openModal('equipement','${e.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteItem('equipement','${e.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--text-dim)">Aucun équipement</td></tr>';
}

// ==================== CANALIS ====================
function renderCanalis() {
    const container = document.getElementById('canalis-list');
    if (!container) return;
    
    const canalisMap = {};
    STATE.data.boitiersAC.forEach(b => {
        if (!canalisMap[b.canalis]) canalisMap[b.canalis] = { salle: b.salle, boitiers: [] };
        canalisMap[b.canalis].boitiers.push(b);
    });
    
    container.innerHTML = Object.entries(canalisMap).map(([name, data]) => {
        const connCount = data.boitiers.reduce((s, b) => s + STATE.data.connexionsAC.filter(c => c.boitier_fk === b.id).length, 0);
        return `<div class="info-card">
            <div class="info-card-header">
                <div><div class="info-card-title"><i class="fas fa-grip-lines" style="color:var(--cyan);margin-right:8px"></i>${name}</div><div class="info-card-sub">Salle: ${data.salle}</div></div>
                <span class="info-card-badge" style="background:var(--cyan);color:white">${data.boitiers.length} boîtiers</span>
            </div>
            <div class="info-card-stats">
                <div class="info-card-stat"><span class="info-card-stat-value">${connCount}</span><span class="info-card-stat-label">Connexions</span></div>
            </div>
        </div>`;
    }).join('') || '<p style="color:var(--text-dim)">Aucun canalis</p>';
}

// ==================== BOITIERS ====================
function renderBoitiers() {
    const tbody = document.querySelector('#table-boitiers tbody');
    if (!tbody) return;
    
    let boitiers = STATE.data.boitiersAC;
    const canalis = document.getElementById('filter-boitier-canalis')?.value;
    const salle = document.getElementById('filter-boitier-salle')?.value;
    
    if (canalis) boitiers = boitiers.filter(b => b.canalis === canalis);
    if (salle) boitiers = boitiers.filter(b => b.salle === salle);
    
    tbody.innerHTML = boitiers.map(b => {
        const conns = STATE.data.connexionsAC.filter(c => c.boitier_fk === b.id);
        return `<tr>
            <td><strong>${b.id}</strong></td>
            <td>${b.canalis}</td>
            <td>${b.salle}</td>
            <td>${b.configuration}</td>
            <td>${b.rangee}</td>
            <td><span class="badge ${conns.length>0?'green':''}">${conns.length}</span></td>
            <td>
                <button class="btn btn-sm" onclick="openModal('boitier','${b.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteItem('boitier','${b.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--text-dim)">Aucun boîtier</td></tr>';
}

// ==================== CONNEXIONS AC ====================
function renderConnexionsAC() {
    const tbody = document.querySelector('#table-connexions-ac tbody');
    if (!tbody) return;
    
    let conns = STATE.data.connexionsAC;
    const search = document.getElementById('search-conn-ac')?.value?.toLowerCase();
    
    if (search) {
        conns = conns.filter(c => {
            const eq = STATE.data.equipements.find(e => e.id === c.equipement_fk);
            return eq?.nom_equipement?.toLowerCase().includes(search) || c.boitier_fk?.toLowerCase().includes(search);
        });
    }
    
    tbody.innerHTML = conns.map(c => {
        const eq = STATE.data.equipements.find(e => e.id === c.equipement_fk);
        return `<tr>
            <td><strong>${eq?.nom_equipement || c.equipement_fk}</strong></td>
            <td>${eq?.rack_fk || '-'}</td>
            <td>Voie ${c.voie}</td>
            <td>${c.boitier_fk}</td>
            <td>${c.prise_utilisee||'-'}</td>
            <td>${c.phase||'-'}</td>
            <td>${c.puissance_kw} kW</td>
            <td>
                <button class="btn btn-sm" onclick="openModal('connexionAC','${c.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteItem('connexionAC','${c.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--text-dim)">Aucune connexion AC</td></tr>';
}

// ==================== REDRESSEURS ====================
function renderRedresseurs() {
    const container = document.getElementById('redresseurs-list');
    if (!container) return;
    
    const redMap = {};
    STATE.data.tableauxDC.forEach(t => {
        if (!redMap[t.redresseur]) redMap[t.redresseur] = { salle: t.salle, tableaux: [] };
        redMap[t.redresseur].tableaux.push(t);
    });
    
    container.innerHTML = Object.entries(redMap).map(([name, data]) => {
        const connCount = data.tableaux.reduce((s, t) => s + STATE.data.connexionsDC.filter(c => c.tableau_dc_fk === t.id).length, 0);
        return `<div class="info-card">
            <div class="info-card-header">
                <div><div class="info-card-title"><i class="fas fa-charging-station" style="color:var(--purple);margin-right:8px"></i>${name}</div><div class="info-card-sub">Salle: ${data.salle}</div></div>
                <span class="info-card-badge" style="background:var(--purple);color:white">${data.tableaux.length} tableaux</span>
            </div>
            <div class="info-card-stats">
                <div class="info-card-stat"><span class="info-card-stat-value">${connCount}</span><span class="info-card-stat-label">Connexions</span></div>
            </div>
        </div>`;
    }).join('') || '<p style="color:var(--text-dim)">Aucun redresseur</p>';
}

// ==================== TABLEAUX DC ====================
function renderTableauxList() {
    const container = document.getElementById('tableaux-list');
    if (!container) return;
    
    let tableaux = STATE.data.tableauxDC;
    const red = document.getElementById('filter-tableau-redresseur')?.value;
    if (red) tableaux = tableaux.filter(t => t.redresseur === red);
    
    container.innerHTML = tableaux.map(t => {
        const conns = STATE.data.connexionsDC.filter(c => c.tableau_dc_fk === t.id);
        return `<div class="list-item ${STATE.selectedTableau === t.id ? 'active' : ''}" onclick="selectTableau('${t.id}')">
            <div class="list-item-icon"><i class="fas fa-car-battery"></i></div>
            <div class="list-item-info"><div class="list-item-title">${t.id}</div><div class="list-item-sub">${t.redresseur}</div></div>
            <div class="list-item-stats"><div>${conns.length} conn.</div></div>
        </div>`;
    }).join('') || '<div class="empty-state"><p>Aucun tableau</p></div>';
}

function selectTableau(id) {
    STATE.selectedTableau = id;
    renderTableauxList();
    renderTableauDetail(id);
}

function renderTableauDetail(id) {
    const container = document.getElementById('tableau-detail');
    const tab = STATE.data.tableauxDC.find(t => t.id === id);
    if (!container || !tab) return;
    
    const conns = STATE.data.connexionsDC.filter(c => c.tableau_dc_fk === id);
    const calibres = [25,32,40,63,80,100,125];
    
    let disjHtml = '';
    calibres.forEach(cal => {
        const total = parseInt(tab['total_'+cal+'a']) || 0;
        if (total > 0) {
            const used = conns.filter(c => parseInt(c.calibre_a) === cal);
            disjHtml += `<div style="margin-bottom:16px"><h4 style="font-size:12px;margin-bottom:8px">${cal}A (${used.length}/${total})</h4><div style="display:flex;flex-wrap:wrap;gap:6px">`;
            for (let i = 1; i <= total; i++) {
                const conn = used.find(c => parseInt(c.numero_disjoncteur) === i);
                const eq = conn ? STATE.data.equipements.find(e => e.id === conn.equipement_fk) : null;
                const cls = conn ? 'background:var(--purple);color:white' : 'background:var(--bg-dark);border:1px dashed var(--border)';
                disjHtml += `<div style="width:60px;padding:8px 4px;${cls};border-radius:6px;text-align:center;font-size:10px" title="${eq?.nom_equipement||'Libre'}">${i}${eq ? '<br>'+eq.nom_equipement.substring(0,8) : ''}</div>`;
            }
            disjHtml += '</div></div>';
        }
    });
    
    // Connections list
    const connList = conns.map(c => {
        const eq = STATE.data.equipements.find(e => e.id === c.equipement_fk);
        return `<div class="conn-line"><i class="fas fa-bolt"></i>${eq?.nom_equipement||c.equipement_fk} → Disj. ${c.numero_disjoncteur} (${c.calibre_a}A) · ${c.puissance_kw}kW</div>`;
    }).join('');
    
    container.innerHTML = `
        <div style="padding:20px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                <h3>${tab.id}</h3>
                <div>
                    <button class="btn btn-sm" onclick="openModal('tableauDC','${tab.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteItem('tableauDC','${tab.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="info-section"><h4>Informations</h4>
                <div class="info-row"><span class="info-label">Redresseur</span><span>${tab.redresseur}</span></div>
                <div class="info-row"><span class="info-label">Salle</span><span>${tab.salle}</span></div>
            </div>
            <div class="info-section"><h4>Disjoncteurs</h4>${disjHtml}</div>
            <div class="info-section"><h4>Équipements connectés (${conns.length})</h4>${connList || '<p style="color:var(--text-dim);font-size:12px">Aucune connexion</p>'}</div>
            <button class="btn btn-primary btn-sm" onclick="openModal('connexionDC',null,'${tab.id}')"><i class="fas fa-plus"></i> Nouvelle connexion</button>
        </div>`;
}

// ==================== CONNEXIONS DC ====================
function renderConnexionsDC() {
    const tbody = document.querySelector('#table-connexions-dc tbody');
    if (!tbody) return;
    
    let conns = STATE.data.connexionsDC;
    const search = document.getElementById('search-conn-dc')?.value?.toLowerCase();
    
    if (search) {
        conns = conns.filter(c => {
            const eq = STATE.data.equipements.find(e => e.id === c.equipement_fk);
            return eq?.nom_equipement?.toLowerCase().includes(search) || c.tableau_dc_fk?.toLowerCase().includes(search);
        });
    }
    
    tbody.innerHTML = conns.map(c => {
        const eq = STATE.data.equipements.find(e => e.id === c.equipement_fk);
        return `<tr>
            <td><strong>${eq?.nom_equipement || c.equipement_fk}</strong></td>
            <td>${eq?.rack_fk || '-'}</td>
            <td>Voie ${c.voie}</td>
            <td>${c.tableau_dc_fk}</td>
            <td>${c.numero_disjoncteur}</td>
            <td>${c.calibre_a}A</td>
            <td>${c.puissance_kw} kW</td>
            <td>
                <button class="btn btn-sm" onclick="openModal('connexionDC','${c.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteItem('connexionDC','${c.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--text-dim)">Aucune connexion DC</td></tr>';
}
rack: 'Rack', equipement: 'Équipement', boitier: 'Boîtier AC', tableauDC: 'Tableau DC', connexionAC: 'Connexion AC', connexionDC: 'Connexion DC'
    }[type];
    
    let form = '';
    
    switch(type) {
        case 'rack':
            const rack = STATE.data.racks.find(r => r.id === id) || {};
            form = `
                <div class="form-row"><div class="form-group"><label>ID *</label><input type="text" id="f-id" value="${rack.id||''}" ${id?'readonly':''}></div>
                <div class="form-group"><label>Salle *</label><input type="text" id="f-salle" value="${rack.salle||'ITN1'}"></div></div>
                <div class="form-row"><div class="form-group"><label>Rangée</label><input type="text" id="f-rangee" value="${rack.rangee||''}"></div>
                <div class="form-group"><label>N° Baie</label><input type="text" id="f-numero" value="${rack.numero_baie||''}"></div></div>
                <div class="form-group"><label>Désignation</label><input type="text" id="f-designation" value="${rack.designation||''}"></div>
                <div class="form-row"><div class="form-group"><label>Porteur</label><input type="text" id="f-porteur" value="${rack.porteur||''}"></div>
                <div class="form-group"><label>Puissance PDU (kW)</label><input type="number" id="f-puissance" value="${rack.puissance_pdu_kw||22}"></div></div>
            `;
            break;
            
        case 'equipement':
            const eq = STATE.data.equipements.find(e => e.id === id) || {};
            const rackFk = parentId || eq.rack_fk || '';
            const uPosition = uPos || eq.u_position || 1;
            form = `
                <div class="form-group"><label>Nom *</label><input type="text" id="f-nom" value="${eq.nom_equipement||''}"></div>
                <div class="form-row">
                    <div class="form-group"><label>Type</label><select id="f-type"><option value="Serveur" ${eq.type_equipement==='Serveur'?'selected':''}>Serveur</option><option value="Switch" ${eq.type_equipement==='Switch'?'selected':''}>Switch</option><option value="Routeur" ${eq.type_equipement==='Routeur'?'selected':''}>Routeur</option><option value="Storage" ${eq.type_equipement==='Storage'?'selected':''}>Storage</option></select></div>
                    <div class="form-group"><label>Alimentation</label><select id="f-alim"><option value="AC" ${eq.type_alimentation==='AC'?'selected':''}>AC</option><option value="DC" ${eq.type_alimentation==='DC'?'selected':''}>DC</option></select></div>
                </div>
                <div class="form-group"><label>Rack *</label><select id="f-rack">${STATE.data.racks.map(r=>`<option value="${r.id}" ${r.id===rackFk?'selected':''}>${r.id} - ${r.designation||r.salle}</option>`).join('')}</select></div>
                <div class="form-row">
                    <div class="form-group"><label>Position U</label><input type="number" id="f-upos" value="${uPosition}" min="1" max="47"></div>
                    <div class="form-group"><label>Hauteur (U)</label><input type="number" id="f-hauteur" value="${eq.hauteur_u||1}" min="1" max="47"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Poids (kg)</label><input type="number" id="f-poids" value="${eq.poids_kg||''}"></div>
                    <div class="form-group"><label>N° Série</label><input type="text" id="f-serie" value="${eq.numero_serie||''}"></div>
                </div>
            `;
            break;
            
        case 'boitier':
            const boit = STATE.data.boitiersAC.find(b => b.id === id) || {};
            form = `
                <div class="form-group"><label>ID *</label><input type="text" id="f-id" value="${boit.id||''}" ${id?'readonly':''}></div>
                <div class="form-group"><label>Canalis *</label><input type="text" id="f-canalis" value="${boit.canalis||''}"></div>
                <div class="form-row">
                    <div class="form-group"><label>Salle</label><input type="text" id="f-salle" value="${boit.salle||'ITN1'}"></div>
                    <div class="form-group"><label>Rangée</label><input type="text" id="f-rangee" value="${boit.rangee||''}"></div>
                </div>
                <div class="form-group"><label>Configuration</label><select id="f-config"><option value="2TRI" ${boit.configuration==='2TRI'?'selected':''}>2TRI</option><option value="3TRI" ${boit.configuration==='3TRI'?'selected':''}>3TRI</option><option value="MONO" ${boit.configuration==='MONO'?'selected':''}>MONO</option></select></div>
            `;
            break;
            
        case 'tableauDC':
            const tab = STATE.data.tableauxDC.find(t => t.id === id) || {};
            form = `
                <div class="form-group"><label>ID *</label><input type="text" id="f-id" value="${tab.id||''}" ${id?'readonly':''}></div>
                <div class="form-group"><label>Redresseur *</label><input type="text" id="f-redresseur" value="${tab.redresseur||''}"></div>
                <div class="form-group"><label>Salle</label><input type="text" id="f-salle" value="${tab.salle||'ITN1'}"></div>
                <div class="form-row"><div class="form-group"><label>Disj. 25A</label><input type="number" id="f-25a" value="${tab.total_25a||0}"></div><div class="form-group"><label>Disj. 32A</label><input type="number" id="f-32a" value="${tab.total_32a||0}"></div></div>
                <div class="form-row"><div class="form-group"><label>Disj. 40A</label><input type="number" id="f-40a" value="${tab.total_40a||0}"></div><div class="form-group"><label>Disj. 63A</label><input type="number" id="f-63a" value="${tab.total_63a||0}"></div></div>
                <div class="form-row"><div class="form-group"><label>Disj. 80A</label><input type="number" id="f-80a" value="${tab.total_80a||0}"></div><div class="form-group"><label>Disj. 100A</label><input type="number" id="f-100a" value="${tab.total_100a||0}"></div></div>
                <div class="form-group"><label>Disj. 125A</label><input type="number" id="f-125a" value="${tab.total_125a||0}"></div>
            `;
            break;
            
        case 'connexionAC':
            const cAC = STATE.data.connexionsAC.find(c => c.id === id) || {};
            const acEquips = STATE.data.equipements.filter(e => e.type_alimentation === 'AC' || !e.type_alimentation);
            form = `
                <div class="form-group"><label>Équipement *</label><select id="f-equip">${acEquips.map(e=>`<option value="${e.id}" ${e.id===cAC.equipement_fk?'selected':''}>${e.nom_equipement} (${e.rack_fk})</option>`).join('')}</select></div>
                <div class="form-row">
                    <div class="form-group"><label>Voie</label><select id="f-voie"><option value="1" ${cAC.voie==1?'selected':''}>Voie 1</option><option value="2" ${cAC.voie==2?'selected':''}>Voie 2</option></select></div>
                    <div class="form-group"><label>Puissance (kW) *</label><input type="number" step="0.01" id="f-puissance" value="${cAC.puissance_kw||''}"></div>
                </div>
                <div class="form-group"><label>Boîtier AC *</label><select id="f-boitier">${STATE.data.boitiersAC.map(b=>`<option value="${b.id}" ${b.id===(parentId||cAC.boitier_fk)?'selected':''}>${b.id} (${b.canalis})</option>`).join('')}</select></div>
                <div class="form-row">
                    <div class="form-group"><label>Prise utilisée</label><input type="text" id="f-prise" value="${cAC.prise_utilisee||''}" placeholder="TRI 1, MONO 2..."></div>
                    <div class="form-group"><label>Phase</label><select id="f-phase"><option value="L1" ${cAC.phase==='L1'?'selected':''}>L1</option><option value="L2" ${cAC.phase==='L2'?'selected':''}>L2</option><option value="L3" ${cAC.phase==='L3'?'selected':''}>L3</option><option value="P123" ${cAC.phase==='P123'?'selected':''}>P123</option><option value="P1" ${cAC.phase==='P1'?'selected':''}>P1</option></select></div>
                </div>
            `;
            break;
            
        case 'connexionDC':
            const cDC = STATE.data.connexionsDC.find(c => c.id === id) || {};
            const dcEquips = STATE.data.equipements.filter(e => e.type_alimentation === 'DC');
            form = `
                <div class="form-group"><label>Équipement *</label><select id="f-equip">${dcEquips.map(e=>`<option value="${e.id}" ${e.id===cDC.equipement_fk?'selected':''}>${e.nom_equipement} (${e.rack_fk})</option>`).join('')}</select></div>
                <div class="form-row">
                    <div class="form-group"><label>Voie</label><select id="f-voie"><option value="1" ${cDC.voie==1?'selected':''}>Voie 1</option><option value="2" ${cDC.voie==2?'selected':''}>Voie 2</option></select></div>
                    <div class="form-group"><label>Puissance (kW) *</label><input type="number" step="0.01" id="f-puissance" value="${cDC.puissance_kw||''}"></div>
                </div>
                <div class="form-group"><label>Tableau DC *</label><select id="f-tableau">${STATE.data.tableauxDC.map(t=>`<option value="${t.id}" ${t.id===(parentId||cDC.tableau_dc_fk)?'selected':''}>${t.id} (${t.redresseur})</option>`).join('')}</select></div>
                <div class="form-row">
                    <div class="form-group"><label>N° Disjoncteur</label><input type="number" id="f-disj" value="${cDC.numero_disjoncteur||''}"></div>
                    <div class="form-group"><label>Calibre</label><select id="f-calibre"><option value="25" ${cDC.calibre_a==25?'selected':''}>25A</option><option value="32" ${cDC.calibre_a==32?'selected':''}>32A</option><option value="40" ${cDC.calibre_a==40?'selected':''}>40A</option><option value="63" ${cDC.calibre_a==63?'selected':''}>63A</option><option value="80" ${cDC.calibre_a==80?'selected':''}>80A</option><option value="100" ${cDC.calibre_a==100?'selected':''}>100A</option><option value="125" ${cDC.calibre_a==125?'selected':''}>125A</option></select></div>
                </div>
            `;
            break;
    }
    
    document.getElementById('modalBody').innerHTML = form;
    document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    STATE.modal = { type: null, mode: null, id: null };
}

async function saveModal() {
    const { type, mode, id } = STATE.modal;
    const isEdit = mode === 'edit';
    let item = {}, dataKey = '';
    
    switch(type) {
        case 'rack':
            dataKey = 'racks';
            item = { id: document.getElementById('f-id').value, salle: document.getElementById('f-salle').value, rangee: document.getElementById('f-rangee').value, numero_baie: document.getElementById('f-numero').value, designation: document.getElementById('f-designation').value, porteur: document.getElementById('f-porteur').value, puissance_pdu_kw: parseFloat(document.getElementById('f-puissance').value)||22 };
            break;
        case 'equipement':
            dataKey = 'equipements';
            item = { id: isEdit ? id : 'EQ-'+Date.now(), rack_fk: document.getElementById('f-rack').value, nom_equipement: document.getElementById('f-nom').value, type_equipement: document.getElementById('f-type').value, type_alimentation: document.getElementById('f-alim').value, u_position: parseInt(document.getElementById('f-upos').value)||1, hauteur_u: parseInt(document.getElementById('f-hauteur').value)||1, poids_kg: parseFloat(document.getElementById('f-poids').value)||0, numero_serie: document.getElementById('f-serie').value, statut: 'Actif' };
            break;
        case 'boitier':
            dataKey = 'boitiersAC';
            item = { id: document.getElementById('f-id').value, canalis: document.getElementById('f-canalis').value, salle: document.getElementById('f-salle').value, rangee: document.getElementById('f-rangee').value, configuration: document.getElementById('f-config').value };
            break;
        case 'tableauDC':
            dataKey = 'tableauxDC';
            item = { id: document.getElementById('f-id').value, redresseur: document.getElementById('f-redresseur').value, salle: document.getElementById('f-salle').value, total_25a: parseInt(document.getElementById('f-25a').value)||0, total_32a: parseInt(document.getElementById('f-32a').value)||0, total_40a: parseInt(document.getElementById('f-40a').value)||0, total_63a: parseInt(document.getElementById('f-63a').value)||0, total_80a: parseInt(document.getElementById('f-80a').value)||0, total_100a: parseInt(document.getElementById('f-100a').value)||0, total_125a: parseInt(document.getElementById('f-125a').value)||0 };
            break;
        case 'connexionAC':
            dataKey = 'connexionsAC';
            item = { id: isEdit ? id : 'ACC-'+Date.now(), equipement_fk: document.getElementById('f-equip').value, voie: parseInt(document.getElementById('f-voie').value), puissance_kw: parseFloat(document.getElementById('f-puissance').value)||0, boitier_fk: document.getElementById('f-boitier').value, prise_utilisee: document.getElementById('f-prise').value, phase: document.getElementById('f-phase').value };
            break;
        case 'connexionDC':
            dataKey = 'connexionsDC';
            item = { id: isEdit ? id : 'DCC-'+Date.now(), equipement_fk: document.getElementById('f-equip').value, voie: parseInt(document.getElementById('f-voie').value), puissance_kw: parseFloat(document.getElementById('f-puissance').value)||0, tableau_dc_fk: document.getElementById('f-tableau').value, numero_disjoncteur: parseInt(document.getElementById('f-disj').value), calibre_a: parseInt(document.getElementById('f-calibre').value) };
            break;
    }
    
    // Update local state
    if (isEdit) {
        const idx = STATE.data[dataKey].findIndex(x => x.id === id);
        if (idx >= 0) STATE.data[dataKey][idx] = item;
    } else {
        STATE.data[dataKey].push(item);
    }
    
    // Sync to API
    if (CONFIG.API_URL) {
        try {
            await fetch(CONFIG.API_URL, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ action: isEdit ? 'update' : 'add', sheet: dataKey, data: item }) });
            toast('Sauvegardé!', 'success');
        } catch(e) { toast('Sauvegardé localement', 'warning'); }
    } else { toast('Sauvegardé (mode démo)', 'success'); }
    
    closeModal();
    refreshCurrentPage();
}

async function deleteItem(type, id) {
    if (!confirm('Supprimer cet élément?')) return;
    
    const keys = { rack:'racks', equipement:'equipements', boitier:'boitiersAC', tableauDC:'tableauxDC', connexionAC:'connexionsAC', connexionDC:'connexionsDC' };
    const dataKey = keys[type];
    
    // REALLY delete from local state
    const idx = STATE.data[dataKey].findIndex(x => x.id === id);
    if (idx >= 0) {
        STATE.data[dataKey].splice(idx, 1);
        console.log(`Deleted ${id} from ${dataKey}, remaining: ${STATE.data[dataKey].length}`);
    }
    
    // Sync to API
    if (CONFIG.API_URL) {
        try {
            await fetch(CONFIG.API_URL, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ action: 'delete', sheet: dataKey, id: id }) });
            toast('Supprimé!', 'success');
        } catch(e) { toast('Supprimé localement', 'warning'); }
    } else { toast('Supprimé (mode démo)', 'success'); }
    
    // Clear selection if deleted
    if (type === 'rack' && STATE.selectedRack === id) {
        STATE.selectedRack = null;
        document.getElementById('rack-detail').innerHTML = '<div class="empty-state"><i class="fas fa-server"></i><p>Sélectionnez un rack</p></div>';
    }
    if (type === 'tableauDC' && STATE.selectedTableau === id) {
        STATE.selectedTableau = null;
        document.getElementById('tableau-detail').innerHTML = '<div class="empty-state"><i class="fas fa-car-battery"></i><p>Sélectionnez un tableau</p></div>';
    }
    
    refreshCurrentPage();
}

function refreshCurrentPage() {
    renderDashboard();
    updateStats();
    if (STATE.page === 'racks') { renderRacksList(); if (STATE.selectedRack) renderRackDetail(STATE.selectedRack); }
    if (STATE.page === 'equipements') renderEquipements();
    if (STATE.page === 'canalis') renderCanalis();
    if (STATE.page === 'boitiers') renderBoitiers();
    if (STATE.page === 'connexions-ac') renderConnexionsAC();
    if (STATE.page === 'redresseurs') renderRedresseurs();
    if (STATE.page === 'tableaux-dc') { renderTableauxList(); if (STATE.selectedTableau) renderTableauDetail(STATE.selectedTableau); }
    if (STATE.page === 'connexions-dc') renderConnexionsDC();
    if (STATE.page === 'arborescence') renderArborescence();
}

// ==================== CONFIG ====================
function loadConfig() {
    const url = localStorage.getItem('dcim_api_url');
    if (url) { CONFIG.API_URL = url; document.getElementById('apiUrl').value = url; }
}

function saveConfig() {
    const url = document.getElementById('apiUrl').value.trim();
    localStorage.setItem('dcim_api_url', url);
    CONFIG.API_URL = url;
    toast('Configuration sauvegardée!', 'success');
    loadData();
}

async function testConnection() {
    const url = document.getElementById('apiUrl').value.trim();
    if (!url) { toast('Entrez une URL', 'warning'); return; }
    showLoading(true);
    try {
        const res = await fetch(url + '?action=ping');
        if (res.ok) { toast('Connexion réussie!', 'success'); setConnected(true); }
        else throw new Error();
    } catch(e) { toast('Échec de connexion', 'error'); setConnected(false); }
    showLoading(false);
}

function pasteUrl() { navigator.clipboard.readText().then(t => document.getElementById('apiUrl').value = t); toast('URL collée', 'info'); }

function updateStats() {
    document.getElementById('stat-racks').textContent = STATE.data.racks.length;
    document.getElementById('stat-equip').textContent = STATE.data.equipements.length;
    document.getElementById('stat-boitiers').textContent = STATE.data.boitiersAC.length;
    document.getElementById('stat-tableaux').textContent = STATE.data.tableauxDC.length;
    document.getElementById('stat-conn-ac').textContent = STATE.data.connexionsAC.length;
    document.getElementById('stat-conn-dc').textContent = STATE.data.connexionsDC.length;
}

// ==================== UTILS ====================
function setConnected(connected) {
    document.getElementById('statusDot').classList.toggle('connected', connected);
    document.getElementById('statusText').textContent = connected ? 'Connecté' : 'Mode Démo';
}

function showLoading(show) { document.getElementById('loading').classList.toggle('active', show); }

function toast(msg, type='info') {
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerHTML = `<i class="fas fa-${type==='success'?'check':type==='error'?'times':type==='warning'?'exclamation':'info'}-circle"></i> ${msg}`;
    document.getElementById('toasts').appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
}

// Global
window.navigateTo = navigateTo;
window.selectRack = selectRack;
window.selectTableau = selectTableau;
window.openModal = openModal;
window.closeModal = closeModal;
window.saveModal = saveModal;
window.deleteItem = deleteItem;
window.toggleTree = toggleTree;
window.testConnection = testConnection;
window.saveConfig = saveConfig;
window.pasteUrl = pasteUrl;
window.loadData = loadData;
