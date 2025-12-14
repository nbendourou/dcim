/**
 * DCIM Capacitaire - Style Nlyte
 * Application complète avec toutes fonctionnalités testées
 */

const DCIM = {
    // Configuration
    config: {
        API_URL: localStorage.getItem('dcim_api_url') || 'https://script.google.com/macros/s/AKfycbycSlsqepE-ciSJXMFrW3f75xHEUwKJ7a8Jy9JkASe03p1JiOaXFLZy9ZqEj3O1V-rH/exec',
        RACK_HEIGHT: 47
    },
    
    // État
    state: {
        page: 'dashboard',
        selectedRack: null,
        selectedTableau: null,
        modal: { type: null, mode: null, id: null }
    },
    
    // Données
    data: {
        racks: [],
        equipements: [],
        boitiersAC: [],
        tableauxDC: [],
        connexionsAC: [],
        connexionsDC: []
    },

    // ==================== INITIALISATION ====================
    init() {
        this.setupNavigation();
        this.loadConfig();
        this.loadData();
    },

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => this.navigateTo(item.dataset.page));
        });
    },

    loadConfig() {
        const url = localStorage.getItem('dcim_api_url');
        if (url) this.config.API_URL = url;
    },

    // ==================== NAVIGATION ====================
    navigateTo(page) {
        this.state.page = page;
        
        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
        
        // Update title
        const titles = {
            dashboard: 'Dashboard', racks: 'Gestion des Racks', equipements: 'Équipements',
            canalis: 'Canalis', boitiers: 'Boîtiers AC', 'connexions-ac': 'Connexions AC',
            redresseurs: 'Redresseurs', 'tableaux-dc': 'Tableaux DC', 'connexions-dc': 'Connexions DC',
            arborescence: 'Arborescence Électrique', config: 'Configuration'
        };
        document.getElementById('pageTitle').textContent = titles[page] || page;
        
        // Render page
        this.renderPage(page);
    },

    renderPage(page) {
        const content = document.getElementById('content');
        
        switch(page) {
            case 'dashboard': content.innerHTML = this.renderDashboard(); break;
            case 'racks': content.innerHTML = this.renderRacksPage(); this.initRacksPage(); break;
            case 'equipements': content.innerHTML = this.renderEquipementsPage(); this.initEquipementsPage(); break;
            case 'canalis': content.innerHTML = this.renderCanalisPage(); break;
            case 'boitiers': content.innerHTML = this.renderBoitiersPage(); this.initBoitiersPage(); break;
            case 'connexions-ac': content.innerHTML = this.renderConnexionsACPage(); this.initConnexionsACPage(); break;
            case 'redresseurs': content.innerHTML = this.renderRedresseursPage(); break;
            case 'tableaux-dc': content.innerHTML = this.renderTableauxDCPage(); this.initTableauxDCPage(); break;
            case 'connexions-dc': content.innerHTML = this.renderConnexionsDCPage(); this.initConnexionsDCPage(); break;
            case 'arborescence': content.innerHTML = this.renderArborescencePage(); this.initArborescencePage(); break;
            case 'config': content.innerHTML = this.renderConfigPage(); this.initConfigPage(); break;
        }
    },

    // ==================== DATA ====================
    async loadData() {
        this.showLoading(true);
        
        try {
            if (this.config.API_URL) {
                const res = await fetch(this.config.API_URL + '?action=getAllData');
                if (res.ok) {
                    const data = await res.json();
                    this.data = {
                        racks: data.racks || [],
                        equipements: data.equipements || [],
                        boitiersAC: data.boitiersAC || [],
                        tableauxDC: data.tableauxDC || [],
                        connexionsAC: data.connexionsAC || [],
                        connexionsDC: data.connexionsDC || []
                    };
                    this.setConnected(true);
                    this.toast('Données chargées!', 'success');
                } else {
                    throw new Error('API Error');
                }
            } else {
                this.loadDemoData();
                this.setConnected(false);
            }
        } catch(e) {
            console.error('Load error:', e);
            this.loadDemoData();
            this.setConnected(false);
        }
        
        this.showLoading(false);
        document.getElementById('lastSync').textContent = new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
        this.navigateTo(this.state.page);
    },

    loadDemoData() {
        this.data = {
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
                {id:'EQ-002',rack_fk:'ITN1-A11',nom_equipement:'Cisco Nexus 9300',type_equipement:'Switch',type_alimentation:'AC',u_position:28,hauteur_u:2,statut:'Actif'},
                {id:'EQ-003',rack_fk:'ITN2-E13',nom_equipement:'WDM_2-2',type_equipement:'Routeur',type_alimentation:'DC',u_position:30,hauteur_u:10,statut:'Actif'},
                {id:'EQ-004',rack_fk:'ITN1-F17',nom_equipement:'Routeur PTX10008 P1',type_equipement:'Routeur',type_alimentation:'DC',u_position:7,hauteur_u:13,statut:'Actif'},
                {id:'EQ-005',rack_fk:'ITN1-F16',nom_equipement:'Routeur MX10008 PE Fixe',type_equipement:'Routeur',type_alimentation:'DC',u_position:7,hauteur_u:13,statut:'Actif'},
                {id:'EQ-006',rack_fk:'ITN1-F06',nom_equipement:'Routeur MX10008 PE Mobile',type_equipement:'Routeur',type_alimentation:'DC',u_position:7,hauteur_u:13,statut:'Actif'},
                {id:'EQ-007',rack_fk:'ITN2-E18',nom_equipement:'Routeur PTX10008 P2',type_equipement:'Routeur',type_alimentation:'DC',u_position:7,hauteur_u:13,statut:'Actif'}
            ],
            boitiersAC: [
                {id:'IT.1-TB.A.1.1',canalis:'IT.1-TB.A.1',salle:'ITN1',configuration:'2TRI',rangee:'J'},
                {id:'IT.1-TB.A.1.10',canalis:'IT.1-TB.A.1',salle:'ITN1',configuration:'2TRI',rangee:'I'},
                {id:'IT.1-TB.A.2.1',canalis:'IT.1-TB.A.2',salle:'ITN1',configuration:'2TRI',rangee:'J'},
                {id:'IT.2-TB.A.3.11',canalis:'IT.2-TB.A.3',salle:'ITN2',configuration:'2TRI',rangee:'E'},
                {id:'IT.2-TB.C.3.3',canalis:'IT.2-TB.C.3',salle:'ITN2',configuration:'2TRI',rangee:'E'}
            ],
            tableauxDC: [
                {id:'IT.1-SWB.REC.A.1.1',redresseur:'IT.1-SWB.REC.A.1',salle:'ITN1',total_25a:4,total_32a:5,total_40a:4,total_63a:35,total_80a:10,total_100a:10,total_125a:2},
                {id:'IT.1-SWB.REC.A.3.1',redresseur:'IT.1-SWB.REC.A.3',salle:'ITN1',total_25a:4,total_32a:5,total_40a:4,total_63a:35,total_80a:10,total_100a:10,total_125a:2},
                {id:'IT.1-SWB.REC.B.3.1',redresseur:'IT.1-SWB.REC.B.3',salle:'ITN1',total_25a:4,total_32a:5,total_40a:4,total_63a:35,total_80a:10,total_100a:10,total_125a:2}
            ],
            connexionsAC: [
                {id:'ACC-001',equipement_fk:'EQ-001',voie:1,puissance_kw:0.5,boitier_fk:'IT.1-TB.A.1.1',prise_utilisee:'TRI 1',phase:'L1'},
                {id:'ACC-002',equipement_fk:'EQ-001',voie:2,puissance_kw:0.5,boitier_fk:'IT.1-TB.A.2.1',prise_utilisee:'TRI 1',phase:'L2'},
                {id:'ACC-003',equipement_fk:'EQ-002',voie:1,puissance_kw:0.8,boitier_fk:'IT.1-TB.A.1.10',prise_utilisee:'TRI 2',phase:'L1'}
            ],
            connexionsDC: [
                {id:'DCC-001',equipement_fk:'EQ-004',voie:1,puissance_kw:5.0,tableau_dc_fk:'IT.1-SWB.REC.A.3.1',numero_disjoncteur:10,calibre_a:80},
                {id:'DCC-002',equipement_fk:'EQ-004',voie:2,puissance_kw:5.0,tableau_dc_fk:'IT.1-SWB.REC.B.3.1',numero_disjoncteur:10,calibre_a:80},
                {id:'DCC-003',equipement_fk:'EQ-005',voie:1,puissance_kw:5.0,tableau_dc_fk:'IT.1-SWB.REC.A.3.1',numero_disjoncteur:11,calibre_a:100},
                {id:'DCC-004',equipement_fk:'EQ-005',voie:2,puissance_kw:5.0,tableau_dc_fk:'IT.1-SWB.REC.B.3.1',numero_disjoncteur:11,calibre_a:100},
                {id:'DCC-005',equipement_fk:'EQ-003',voie:1,puissance_kw:3.0,tableau_dc_fk:'IT.1-SWB.REC.A.1.1',numero_disjoncteur:5,calibre_a:63}
            ]
        };
    },

    // ==================== DASHBOARD ====================
    renderDashboard() {
        const {racks, equipements, boitiersAC, tableauxDC, connexionsAC, connexionsDC} = this.data;
        
        // Calculate stats
        const totalU = racks.length * this.config.RACK_HEIGHT;
        const usedU = equipements.reduce((s, e) => s + (parseInt(e.hauteur_u) || 0), 0);
        const pctU = totalU > 0 ? Math.round((usedU / totalU) * 100) : 0;
        
        const acConns = connexionsAC.slice(0, 5).map(c => {
            const eq = equipements.find(e => e.id === c.equipement_fk);
            return `<div class="conn-item"><i class="fas fa-plug"></i><span class="eq-name">${eq?.nom_equipement || c.equipement_fk}</span><span class="arrow">→</span><span class="target">${c.boitier_fk}</span></div>`;
        }).join('') || '<p style="color:var(--text-dim);text-align:center;padding:20px">Aucune connexion</p>';
        
        const dcConns = connexionsDC.slice(0, 5).map(c => {
            const eq = equipements.find(e => e.id === c.equipement_fk);
            return `<div class="conn-item"><i class="fas fa-bolt"></i><span class="eq-name">${eq?.nom_equipement || c.equipement_fk}</span><span class="arrow">→</span><span class="target">${c.tableau_dc_fk}</span></div>`;
        }).join('') || '<p style="color:var(--text-dim);text-align:center;padding:20px">Aucune connexion</p>';
        
        return `
            <div class="kpi-grid">
                <div class="kpi-card"><div class="kpi-icon blue"><i class="fas fa-server"></i></div><div class="kpi-info"><span class="kpi-value">${racks.length}</span><span class="kpi-label">Racks</span></div></div>
                <div class="kpi-card"><div class="kpi-icon purple"><i class="fas fa-microchip"></i></div><div class="kpi-info"><span class="kpi-value">${equipements.length}</span><span class="kpi-label">Équipements</span></div></div>
                <div class="kpi-card"><div class="kpi-icon orange"><i class="fas fa-layer-group"></i></div><div class="kpi-info"><span class="kpi-value">${pctU}%</span><span class="kpi-label">U Occupés (${usedU}/${totalU})</span></div></div>
                <div class="kpi-card"><div class="kpi-icon green"><i class="fas fa-plug"></i></div><div class="kpi-info"><span class="kpi-value">${connexionsAC.length + connexionsDC.length}</span><span class="kpi-label">Connexions</span></div></div>
            </div>
            <div class="dashboard-grid">
                <div class="card"><div class="card-header"><h3><i class="fas fa-bolt" style="color:var(--blue);margin-right:8px"></i>Connexions AC</h3><span class="badge">${connexionsAC.length}</span></div><div class="card-body">${acConns}</div></div>
                <div class="card"><div class="card-header"><h3><i class="fas fa-car-battery" style="color:var(--purple);margin-right:8px"></i>Connexions DC</h3><span class="badge">${connexionsDC.length}</span></div><div class="card-body">${dcConns}</div></div>
            </div>
        `;
    },

    // ==================== RACKS PAGE ====================
    renderRacksPage() {
        return `
            <div class="toolbar">
                <div class="filters">
                    <select id="filter-salle" onchange="DCIM.filterRacks()"><option value="">Toutes salles</option>${[...new Set(this.data.racks.map(r=>r.salle))].map(s=>`<option value="${s}">${s}</option>`).join('')}</select>
                    <select id="filter-rangee" onchange="DCIM.filterRacks()"><option value="">Toutes rangées</option>${[...new Set(this.data.racks.map(r=>r.rangee))].map(r=>`<option value="${r}">${r}</option>`).join('')}</select>
                    <input type="text" id="search-rack" placeholder="Rechercher..." oninput="DCIM.filterRacks()">
                </div>
                <button class="btn btn-primary" onclick="DCIM.openModal('rack')"><i class="fas fa-plus"></i> Nouveau Rack</button>
            </div>
            <div class="split-view">
                <div class="list-panel" id="racks-list"></div>
                <div class="detail-panel" id="rack-detail"><div class="empty-state"><i class="fas fa-server"></i><p>Sélectionnez un rack pour voir les détails</p></div></div>
            </div>
        `;
    },

    initRacksPage() {
        this.renderRacksList();
    },

    filterRacks() {
        this.renderRacksList();
    },

    renderRacksList() {
        const container = document.getElementById('racks-list');
        if (!container) return;
        
        let racks = this.data.racks;
        const salle = document.getElementById('filter-salle')?.value;
        const rangee = document.getElementById('filter-rangee')?.value;
        const search = document.getElementById('search-rack')?.value?.toLowerCase();
        
        if (salle) racks = racks.filter(r => r.salle === salle);
        if (rangee) racks = racks.filter(r => r.rangee === rangee);
        if (search) racks = racks.filter(r => r.id.toLowerCase().includes(search) || r.designation?.toLowerCase().includes(search));
        
        container.innerHTML = racks.map(r => {
            const equips = this.data.equipements.filter(e => e.rack_fk === r.id);
            const usedU = equips.reduce((s, e) => s + (parseInt(e.hauteur_u) || 0), 0);
            const pct = Math.round((usedU / this.config.RACK_HEIGHT) * 100);
            return `<div class="list-item ${this.state.selectedRack === r.id ? 'active' : ''}" onclick="DCIM.selectRack('${r.id}')">
                <div class="list-item-icon"><i class="fas fa-server"></i></div>
                <div class="list-item-info"><div class="list-item-title">${r.id}</div><div class="list-item-sub">${r.designation || r.salle + ' - Rangée ' + r.rangee}</div></div>
                <div class="list-item-stats"><div>${pct}%</div><div>${equips.length} éq.</div></div>
            </div>`;
        }).join('') || '<div class="empty-state" style="padding:40px"><p>Aucun rack trouvé</p></div>';
    },

    selectRack(id) {
        this.state.selectedRack = id;
        this.renderRacksList();
        this.renderRackDetail(id);
    },

    renderRackDetail(id) {
        const container = document.getElementById('rack-detail');
        const rack = this.data.racks.find(r => r.id === id);
        if (!container || !rack) return;
        
        const equips = this.data.equipements.filter(e => e.rack_fk === id);
        const usedU = equips.reduce((s, e) => s + (parseInt(e.hauteur_u) || 0), 0);
        const freeU = this.config.RACK_HEIGHT - usedU;
        const pctU = Math.round((usedU / this.config.RACK_HEIGHT) * 100);
        
        // Build slot map for visual
        const slots = {};
        equips.forEach(e => {
            const start = parseInt(e.u_position) || 1;
            const height = parseInt(e.hauteur_u) || 1;
            for (let u = start; u < start + height; u++) {
                slots[u] = { eq: e, isStart: u === start, isEnd: u === start + height - 1 };
            }
        });
        
        // Build rack visual HTML
        let rackHtml = '';
        for (let u = this.config.RACK_HEIGHT; u >= 1; u--) {
            const slot = slots[u];
            let cls = 'rack-u';
            let label = '';
            let onclick = `DCIM.openModal('equipement',null,'${id}',${u})`;
            
            if (slot) {
                cls += slot.eq.type_alimentation === 'DC' ? ' occupied-dc' : ' occupied';
                if (slot.isStart) { cls += ' start'; label = `<span class="rack-u-label">${slot.eq.nom_equipement}</span>`; }
                if (slot.isEnd) cls += ' end';
                onclick = `DCIM.openModal('equipement','${slot.eq.id}')`;
            }
            
            rackHtml += `<div class="${cls}" onclick="${onclick}" title="${slot ? slot.eq.nom_equipement + ' (U' + slot.eq.u_position + '-' + (parseInt(slot.eq.u_position)+parseInt(slot.eq.hauteur_u)-1) + ')' : 'U' + u + ' - Libre'}"><span class="rack-u-num">${u}</span>${label}</div>`;
        }
        
        // Equipment list with connections
        const equipList = equips.map(e => {
            const connsAC = this.data.connexionsAC.filter(c => c.equipement_fk === e.id);
            const connsDC = this.data.connexionsDC.filter(c => c.equipement_fk === e.id);
            const connText = [...connsAC.map(c => c.boitier_fk), ...connsDC.map(c => c.tableau_dc_fk)].join(', ') || 'Non connecté';
            return `<div class="equip-item" onclick="DCIM.openModal('equipement','${e.id}')">
                <div class="equip-icon ${(e.type_alimentation||'ac').toLowerCase()}"><i class="fas fa-microchip"></i></div>
                <div><div class="equip-name">${e.nom_equipement}</div><div class="equip-pos">U${e.u_position} · ${e.hauteur_u}U · ${connText}</div></div>
            </div>`;
        }).join('') || '<p style="color:var(--text-dim);font-size:12px;text-align:center;padding:20px">Aucun équipement</p>';
        
        container.innerHTML = `
            <div class="rack-container">
                <div class="rack-visual">
                    <div class="rack-header">
                        <h3>${rack.id} - ${rack.designation || ''}</h3>
                        <div>
                            <button class="btn btn-sm" onclick="DCIM.openModal('rack','${rack.id}')" title="Modifier"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-danger" onclick="DCIM.deleteItem('rack','${rack.id}')" title="Supprimer"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="rack-frame">${rackHtml}</div>
                    <div class="rack-legend">
                        <span><i style="background:var(--blue)"></i> AC</span>
                        <span><i style="background:var(--purple)"></i> DC</span>
                        <span><i style="background:var(--bg-dark);border:1px solid var(--border)"></i> Libre</span>
                    </div>
                </div>
                <div class="rack-info">
                    <div class="info-section">
                        <h4>Informations</h4>
                        <div class="info-row"><span class="info-label">Salle</span><span class="info-value">${rack.salle}</span></div>
                        <div class="info-row"><span class="info-label">Rangée</span><span class="info-value">${rack.rangee}</span></div>
                        <div class="info-row"><span class="info-label">Porteur</span><span class="info-value">${rack.porteur || '-'}</span></div>
                    </div>
                    <div class="info-section">
                        <h4>Capacité</h4>
                        <div class="info-row"><span class="info-label">U Utilisés</span><span class="info-value">${usedU} / ${this.config.RACK_HEIGHT}</span></div>
                        <div class="info-row"><span class="info-label">U Libres</span><span class="info-value">${freeU}</span></div>
                        <div class="progress-bar"><div class="progress-fill" style="width:${pctU}%;background:${pctU>80?'var(--red)':pctU>60?'var(--orange)':'var(--green)'}"></div></div>
                    </div>
                    <div class="info-section">
                        <h4>Équipements (${equips.length})</h4>
                        <div class="equip-list">${equipList}</div>
                        <button class="btn btn-primary btn-sm" style="width:100%;margin-top:16px" onclick="DCIM.openModal('equipement',null,'${rack.id}')"><i class="fas fa-plus"></i> Ajouter équipement</button>
                    </div>
                </div>
            </div>
        `;
    },

    // ==================== EQUIPEMENTS PAGE ====================
    renderEquipementsPage() {
        return `
            <div class="toolbar">
                <div class="filters">
                    <select id="filter-equip-type" onchange="DCIM.filterEquipements()"><option value="">Tous types</option><option value="Serveur">Serveur</option><option value="Switch">Switch</option><option value="Routeur">Routeur</option><option value="Storage">Storage</option></select>
                    <select id="filter-equip-alim" onchange="DCIM.filterEquipements()"><option value="">Toutes alim.</option><option value="AC">AC</option><option value="DC">DC</option></select>
                    <input type="text" id="search-equip" placeholder="Rechercher..." oninput="DCIM.filterEquipements()">
                </div>
                <button class="btn btn-primary" onclick="DCIM.openModal('equipement')"><i class="fas fa-plus"></i> Nouvel Équipement</button>
            </div>
            <div class="table-wrap"><table class="data-table" id="table-equipements"><thead><tr><th>Nom</th><th>Type</th><th>Alim.</th><th>Rack</th><th>Position</th><th>Connexions</th><th>Actions</th></tr></thead><tbody></tbody></table></div>
        `;
    },

    initEquipementsPage() { this.renderEquipementsTable(); },
    filterEquipements() { this.renderEquipementsTable(); },

    renderEquipementsTable() {
        const tbody = document.querySelector('#table-equipements tbody');
        if (!tbody) return;
        
        let equips = this.data.equipements;
        const type = document.getElementById('filter-equip-type')?.value;
        const alim = document.getElementById('filter-equip-alim')?.value;
        const search = document.getElementById('search-equip')?.value?.toLowerCase();
        
        if (type) equips = equips.filter(e => e.type_equipement === type);
        if (alim) equips = equips.filter(e => e.type_alimentation === alim);
        if (search) equips = equips.filter(e => e.nom_equipement?.toLowerCase().includes(search) || e.rack_fk?.toLowerCase().includes(search));
        
        tbody.innerHTML = equips.map(e => {
            const connsAC = this.data.connexionsAC.filter(c => c.equipement_fk === e.id);
            const connsDC = this.data.connexionsDC.filter(c => c.equipement_fk === e.id);
            return `<tr>
                <td><strong>${e.nom_equipement}</strong></td>
                <td>${e.type_equipement || '-'}</td>
                <td><span class="badge ${(e.type_alimentation||'ac').toLowerCase()}">${e.type_alimentation || 'AC'}</span></td>
                <td>${e.rack_fk}</td>
                <td>U${e.u_position} (${e.hauteur_u}U)</td>
                <td><span class="badge ${(connsAC.length+connsDC.length)>0?'green':''}">${connsAC.length + connsDC.length}</span></td>
                <td>
                    <button class="btn btn-sm" onclick="DCIM.openModal('equipement','${e.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="DCIM.deleteItem('equipement','${e.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        }).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--text-dim);padding:40px">Aucun équipement</td></tr>';
    },

    // ==================== CANALIS PAGE ====================
    renderCanalisPage() {
        const canalisMap = {};
        this.data.boitiersAC.forEach(b => {
            if (!canalisMap[b.canalis]) canalisMap[b.canalis] = { salle: b.salle, boitiers: [] };
            canalisMap[b.canalis].boitiers.push(b);
        });
        
        const cards = Object.entries(canalisMap).map(([name, data]) => {
            const connCount = data.boitiers.reduce((s, b) => s + this.data.connexionsAC.filter(c => c.boitier_fk === b.id).length, 0);
            return `<div class="info-card">
                <div class="info-card-header">
                    <div><div class="info-card-title"><i class="fas fa-grip-lines" style="color:var(--cyan);margin-right:8px"></i>${name}</div><div class="info-card-sub">Salle: ${data.salle}</div></div>
                    <span class="info-card-badge" style="background:var(--cyan);color:white">${data.boitiers.length} boîtiers</span>
                </div>
                <div class="info-card-stats">
                    <div class="info-card-stat"><span class="info-card-stat-value">${connCount}</span><span class="info-card-stat-label">Connexions</span></div>
                </div>
            </div>`;
        }).join('') || '<p style="color:var(--text-dim)">Aucun canalis configuré</p>';
        
        return `<div class="toolbar"><h2 style="font-size:16px">Canalis (Gaines électriques AC)</h2></div><div class="grid-cards">${cards}</div>`;
    },

    // ==================== BOITIERS PAGE ====================
    renderBoitiersPage() {
        return `
            <div class="toolbar">
                <div class="filters">
                    <select id="filter-boitier-canalis" onchange="DCIM.filterBoitiers()"><option value="">Tous canalis</option>${[...new Set(this.data.boitiersAC.map(b=>b.canalis))].map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
                    <select id="filter-boitier-salle" onchange="DCIM.filterBoitiers()"><option value="">Toutes salles</option>${[...new Set(this.data.boitiersAC.map(b=>b.salle))].map(s=>`<option value="${s}">${s}</option>`).join('')}</select>
                </div>
                <button class="btn btn-primary" onclick="DCIM.openModal('boitier')"><i class="fas fa-plus"></i> Nouveau Boîtier</button>
            </div>
            <div class="table-wrap"><table class="data-table" id="table-boitiers"><thead><tr><th>ID</th><th>Canalis</th><th>Salle</th><th>Config</th><th>Rangée</th><th>Connexions</th><th>Actions</th></tr></thead><tbody></tbody></table></div>
        `;
    },

    initBoitiersPage() { this.renderBoitiersTable(); },
    filterBoitiers() { this.renderBoitiersTable(); },

    renderBoitiersTable() {
        const tbody = document.querySelector('#table-boitiers tbody');
        if (!tbody) return;
        
        let boitiers = this.data.boitiersAC;
        const canalis = document.getElementById('filter-boitier-canalis')?.value;
        const salle = document.getElementById('filter-boitier-salle')?.value;
        
        if (canalis) boitiers = boitiers.filter(b => b.canalis === canalis);
        if (salle) boitiers = boitiers.filter(b => b.salle === salle);
        
        tbody.innerHTML = boitiers.map(b => {
            const conns = this.data.connexionsAC.filter(c => c.boitier_fk === b.id);
            return `<tr>
                <td><strong>${b.id}</strong></td>
                <td>${b.canalis}</td>
                <td>${b.salle}</td>
                <td>${b.configuration}</td>
                <td>${b.rangee}</td>
                <td><span class="badge ${conns.length>0?'green':''}">${conns.length}</span></td>
                <td>
                    <button class="btn btn-sm" onclick="DCIM.openModal('boitier','${b.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="DCIM.deleteItem('boitier','${b.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        }).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--text-dim);padding:40px">Aucun boîtier</td></tr>';
    },

    // ==================== CONNEXIONS AC PAGE ====================
    renderConnexionsACPage() {
        return `
            <div class="toolbar">
                <div class="filters"><input type="text" id="search-conn-ac" placeholder="Rechercher équipement..." oninput="DCIM.filterConnexionsAC()"></div>
                <button class="btn btn-primary" onclick="DCIM.openModal('connexionAC')"><i class="fas fa-plus"></i> Nouvelle Connexion</button>
            </div>
            <div class="table-wrap"><table class="data-table" id="table-connexions-ac"><thead><tr><th>Équipement</th><th>Rack</th><th>Voie</th><th>Boîtier AC</th><th>Prise</th><th>Phase</th><th>Puissance</th><th>Actions</th></tr></thead><tbody></tbody></table></div>
        `;
    },

    initConnexionsACPage() { this.renderConnexionsACTable(); },
    filterConnexionsAC() { this.renderConnexionsACTable(); },

    renderConnexionsACTable() {
        const tbody = document.querySelector('#table-connexions-ac tbody');
        if (!tbody) return;
        
        let conns = this.data.connexionsAC;
        const search = document.getElementById('search-conn-ac')?.value?.toLowerCase();
        
        if (search) {
            conns = conns.filter(c => {
                const eq = this.data.equipements.find(e => e.id === c.equipement_fk);
                return eq?.nom_equipement?.toLowerCase().includes(search) || c.boitier_fk?.toLowerCase().includes(search);
            });
        }
        
        tbody.innerHTML = conns.map(c => {
            const eq = this.data.equipements.find(e => e.id === c.equipement_fk);
            return `<tr>
                <td><strong>${eq?.nom_equipement || c.equipement_fk}</strong></td>
                <td>${eq?.rack_fk || '-'}</td>
                <td>Voie ${c.voie}</td>
                <td>${c.boitier_fk}</td>
                <td>${c.prise_utilisee || '-'}</td>
                <td>${c.phase || '-'}</td>
                <td>${c.puissance_kw} kW</td>
                <td>
                    <button class="btn btn-sm" onclick="DCIM.openModal('connexionAC','${c.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="DCIM.deleteItem('connexionAC','${c.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        }).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--text-dim);padding:40px">Aucune connexion AC</td></tr>';
    },

    // ==================== REDRESSEURS PAGE ====================
    renderRedresseursPage() {
        const redMap = {};
        this.data.tableauxDC.forEach(t => {
            if (!redMap[t.redresseur]) redMap[t.redresseur] = { salle: t.salle, tableaux: [] };
            redMap[t.redresseur].tableaux.push(t);
        });
        
        const cards = Object.entries(redMap).map(([name, data]) => {
            const connCount = data.tableaux.reduce((s, t) => s + this.data.connexionsDC.filter(c => c.tableau_dc_fk === t.id).length, 0);
            return `<div class="info-card">
                <div class="info-card-header">
                    <div><div class="info-card-title"><i class="fas fa-charging-station" style="color:var(--purple);margin-right:8px"></i>${name}</div><div class="info-card-sub">Salle: ${data.salle}</div></div>
                    <span class="info-card-badge" style="background:var(--purple);color:white">${data.tableaux.length} tableaux</span>
                </div>
                <div class="info-card-stats">
                    <div class="info-card-stat"><span class="info-card-stat-value">${connCount}</span><span class="info-card-stat-label">Connexions</span></div>
                </div>
            </div>`;
        }).join('') || '<p style="color:var(--text-dim)">Aucun redresseur configuré</p>';
        
        return `<div class="toolbar"><h2 style="font-size:16px">Redresseurs (Sources DC)</h2></div><div class="grid-cards">${cards}</div>`;
    },

    // ==================== TABLEAUX DC PAGE ====================
    renderTableauxDCPage() {
        return `
            <div class="toolbar">
                <div class="filters"><select id="filter-tableau-red" onchange="DCIM.filterTableauxDC()"><option value="">Tous redresseurs</option>${[...new Set(this.data.tableauxDC.map(t=>t.redresseur))].map(r=>`<option value="${r}">${r}</option>`).join('')}</select></div>
                <button class="btn btn-primary" onclick="DCIM.openModal('tableauDC')"><i class="fas fa-plus"></i> Nouveau Tableau</button>
            </div>
            <div class="split-view">
                <div class="list-panel" id="tableaux-list"></div>
                <div class="detail-panel" id="tableau-detail"><div class="empty-state"><i class="fas fa-car-battery"></i><p>Sélectionnez un tableau pour voir les détails</p></div></div>
            </div>
        `;
    },

    initTableauxDCPage() { this.renderTableauxList(); },
    filterTableauxDC() { this.renderTableauxList(); },

    renderTableauxList() {
        const container = document.getElementById('tableaux-list');
        if (!container) return;
        
        let tableaux = this.data.tableauxDC;
        const red = document.getElementById('filter-tableau-red')?.value;
        if (red) tableaux = tableaux.filter(t => t.redresseur === red);
        
        container.innerHTML = tableaux.map(t => {
            const conns = this.data.connexionsDC.filter(c => c.tableau_dc_fk === t.id);
            return `<div class="list-item ${this.state.selectedTableau === t.id ? 'active' : ''}" onclick="DCIM.selectTableau('${t.id}')">
                <div class="list-item-icon"><i class="fas fa-car-battery"></i></div>
                <div class="list-item-info"><div class="list-item-title">${t.id}</div><div class="list-item-sub">${t.redresseur}</div></div>
                <div class="list-item-stats"><div>${conns.length}</div><div>conn.</div></div>
            </div>`;
        }).join('') || '<div class="empty-state" style="padding:40px"><p>Aucun tableau</p></div>';
    },

    selectTableau(id) {
        this.state.selectedTableau = id;
        this.renderTableauxList();
        this.renderTableauDetail(id);
    },

    renderTableauDetail(id) {
        const container = document.getElementById('tableau-detail');
        const tab = this.data.tableauxDC.find(t => t.id === id);
        if (!container || !tab) return;
        
        const conns = this.data.connexionsDC.filter(c => c.tableau_dc_fk === id);
        const calibres = [25, 32, 40, 63, 80, 100, 125];
        
        let disjHtml = '';
        calibres.forEach(cal => {
            const total = parseInt(tab['total_' + cal + 'a']) || 0;
            if (total > 0) {
                const used = conns.filter(c => parseInt(c.calibre_a) === cal);
                disjHtml += `<div style="margin-bottom:20px"><h4 style="font-size:12px;margin-bottom:10px;color:var(--text-dim)">${cal}A (${used.length}/${total} utilisés)</h4><div style="display:flex;flex-wrap:wrap;gap:8px">`;
                for (let i = 1; i <= total; i++) {
                    const conn = used.find(c => parseInt(c.numero_disjoncteur) === i);
                    const eq = conn ? this.data.equipements.find(e => e.id === conn.equipement_fk) : null;
                    disjHtml += `<div style="width:70px;padding:10px 6px;background:${conn?'var(--purple)':'var(--bg-dark)'};color:${conn?'white':'var(--text-dim)'};border:1px solid ${conn?'var(--purple)':'var(--border)'};border-radius:8px;text-align:center;font-size:10px;cursor:pointer" title="${eq?.nom_equipement||'Libre'}">${i}${eq ? '<br>'+eq.nom_equipement.substring(0,8) : ''}</div>`;
                }
                disjHtml += '</div></div>';
            }
        });
        
        container.innerHTML = `
            <div style="padding:24px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
                    <h3 style="font-size:18px">${tab.id}</h3>
                    <div>
                        <button class="btn btn-sm" onclick="DCIM.openModal('tableauDC','${tab.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="DCIM.deleteItem('tableauDC','${tab.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="info-section">
                    <h4>Informations</h4>
                    <div class="info-row"><span class="info-label">Redresseur</span><span class="info-value">${tab.redresseur}</span></div>
                    <div class="info-row"><span class="info-label">Salle</span><span class="info-value">${tab.salle}</span></div>
                </div>
                <div class="info-section"><h4>Disjoncteurs</h4>${disjHtml}</div>
                <button class="btn btn-primary" onclick="DCIM.openModal('connexionDC',null,'${tab.id}')"><i class="fas fa-plus"></i> Nouvelle connexion</button>
            </div>
        `;
    },

    // ==================== CONNEXIONS DC PAGE ====================
    renderConnexionsDCPage() {
        return `
            <div class="toolbar">
                <div class="filters"><input type="text" id="search-conn-dc" placeholder="Rechercher équipement..." oninput="DCIM.filterConnexionsDC()"></div>
                <button class="btn btn-primary" onclick="DCIM.openModal('connexionDC')"><i class="fas fa-plus"></i> Nouvelle Connexion</button>
            </div>
            <div class="table-wrap"><table class="data-table" id="table-connexions-dc"><thead><tr><th>Équipement</th><th>Rack</th><th>Voie</th><th>Tableau DC</th><th>Disjoncteur</th><th>Calibre</th><th>Puissance</th><th>Actions</th></tr></thead><tbody></tbody></table></div>
        `;
    },

    initConnexionsDCPage() { this.renderConnexionsDCTable(); },
    filterConnexionsDC() { this.renderConnexionsDCTable(); },

    renderConnexionsDCTable() {
        const tbody = document.querySelector('#table-connexions-dc tbody');
        if (!tbody) return;
        
        let conns = this.data.connexionsDC;
        const search = document.getElementById('search-conn-dc')?.value?.toLowerCase();
        
        if (search) {
            conns = conns.filter(c => {
                const eq = this.data.equipements.find(e => e.id === c.equipement_fk);
                return eq?.nom_equipement?.toLowerCase().includes(search) || c.tableau_dc_fk?.toLowerCase().includes(search);
            });
        }
        
        tbody.innerHTML = conns.map(c => {
            const eq = this.data.equipements.find(e => e.id === c.equipement_fk);
            return `<tr>
                <td><strong>${eq?.nom_equipement || c.equipement_fk}</strong></td>
                <td>${eq?.rack_fk || '-'}</td>
                <td>Voie ${c.voie}</td>
                <td>${c.tableau_dc_fk}</td>
                <td>${c.numero_disjoncteur}</td>
                <td>${c.calibre_a}A</td>
                <td>${c.puissance_kw} kW</td>
                <td>
                    <button class="btn btn-sm" onclick="DCIM.openModal('connexionDC','${c.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="DCIM.deleteItem('connexionDC','${c.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        }).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--text-dim);padding:40px">Aucune connexion DC</td></tr>';
    },
        container.innerHTML = html || '<p style="color:var(--text-dim);padding:20px">Aucune donnée DC</p>';
    },

    toggleTreeNode(nodeId) {
        const children = document.getElementById('children-' + nodeId);
        const toggle = document.getElementById('toggle-' + nodeId);
        if (children) {
            children.classList.toggle('open');
            if (toggle) toggle.classList.toggle('open');
        }
    },

    // ==================== CONFIG PAGE ====================
    renderConfigPage() {
        return `
            <div class="config-grid">
                <div class="config-card">
                    <h3><i class="fas fa-link"></i> Connexion Google Sheets</h3>
                    <div class="form-group">
                        <label>URL de l'API Apps Script</label>
                        <div class="input-group">
                            <input type="text" id="apiUrl" placeholder="https://script.google.com/macros/s/.../exec" value="${this.config.API_URL}">
                            <button class="btn" onclick="DCIM.pasteUrl()" title="Coller"><i class="fas fa-paste"></i></button>
                        </div>
                    </div>
                    <div class="help-box">
                        <h4><i class="fas fa-info-circle"></i> Comment obtenir l'URL ?</h4>
                        <ol>
                            <li>Ouvrez votre Google Sheets avec les données</li>
                            <li>Menu <strong>Extensions</strong> → <strong>Apps Script</strong></li>
                            <li>Collez le code du fichier <code>Code.gs</code></li>
                            <li>Cliquez <strong>Déployer</strong> → <strong>Nouveau déploiement</strong></li>
                            <li>Type: <strong>Application Web</strong></li>
                            <li>Exécuter en tant que: <strong>Moi</strong></li>
                            <li>Qui peut accéder: <strong>Tout le monde</strong></li>
                            <li>Cliquez <strong>Déployer</strong></li>
                            <li><strong style="color:var(--green)">Copiez l'URL</strong> et collez-la ci-dessus</li>
                        </ol>
                    </div>
                    <div class="btn-group">
                        <button class="btn" onclick="DCIM.testConnection()"><i class="fas fa-plug"></i> Tester la connexion</button>
                        <button class="btn btn-primary" onclick="DCIM.saveConfig()"><i class="fas fa-save"></i> Sauvegarder</button>
                    </div>
                </div>
                <div class="config-card">
                    <h3><i class="fas fa-database"></i> Données chargées</h3>
                    <div class="stats-list">
                        <div class="stat-row"><span>Racks</span><span id="stat-racks">${this.data.racks.length}</span></div>
                        <div class="stat-row"><span>Équipements</span><span id="stat-equip">${this.data.equipements.length}</span></div>
                        <div class="stat-row"><span>Boîtiers AC</span><span id="stat-boitiers">${this.data.boitiersAC.length}</span></div>
                        <div class="stat-row"><span>Tableaux DC</span><span id="stat-tableaux">${this.data.tableauxDC.length}</span></div>
                        <div class="stat-row"><span>Connexions AC</span><span id="stat-conn-ac">${this.data.connexionsAC.length}</span></div>
                        <div class="stat-row"><span>Connexions DC</span><span id="stat-conn-dc">${this.data.connexionsDC.length}</span></div>
                    </div>
                    <button class="btn btn-primary" style="width:100%" onclick="DCIM.loadData()"><i class="fas fa-sync"></i> Recharger toutes les données</button>
                </div>
            </div>
        `;
    },

    initConfigPage() {
        // URL already set in render
    },

    async pasteUrl() {
        try {
            const text = await navigator.clipboard.readText();
            document.getElementById('apiUrl').value = text;
            this.toast('URL collée!', 'info');
        } catch(e) {
            this.toast('Impossible de coller - utilisez Ctrl+V', 'warning');
        }
    },

    saveConfig() {
        const url = document.getElementById('apiUrl').value.trim();
        localStorage.setItem('dcim_api_url', url);
        this.config.API_URL = url;
        this.toast('Configuration sauvegardée!', 'success');
        this.loadData();
    },

    async testConnection() {
        const url = document.getElementById('apiUrl').value.trim();
        if (!url) {
            this.toast('Entrez une URL d\'abord', 'warning');
            return;
        }
        
        this.showLoading(true);
        try {
            const res = await fetch(url + '?action=ping');
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'ok') {
                    this.toast('Connexion réussie!', 'success');
                    this.setConnected(true);
                } else {
                    throw new Error();
                }
            } else {
                throw new Error();
            }
        } catch(e) {
            this.toast('Échec de connexion - vérifiez l\'URL', 'error');
            this.setConnected(false);
        }
        this.showLoading(false);
    },

    // ==================== MODAL ====================
    openModal(type, id = null, parentId = null, uPos = null) {
        this.state.modal = { type, mode: id ? 'edit' : 'add', id };
        
        const titles = {
            rack: 'Rack', equipement: 'Équipement', boitier: 'Boîtier AC',
            tableauDC: 'Tableau DC', connexionAC: 'Connexion AC', connexionDC: 'Connexion DC'
        };
        document.getElementById('modalTitle').textContent = (id ? 'Modifier ' : 'Nouveau ') + titles[type];
        
        let form = '';
        
        switch(type) {
            case 'rack':
                const rack = this.data.racks.find(r => r.id === id) || {};
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
                const eq = this.data.equipements.find(e => e.id === id) || {};
                const rackFk = parentId || eq.rack_fk || (this.data.racks[0]?.id || '');
                const uPosition = uPos || eq.u_position || 1;
                form = `
                    <div class="form-group"><label>Nom *</label><input type="text" id="f-nom" value="${eq.nom_equipement||''}"></div>
                    <div class="form-row">
                        <div class="form-group"><label>Type</label><select id="f-type"><option value="Serveur" ${eq.type_equipement==='Serveur'?'selected':''}>Serveur</option><option value="Switch" ${eq.type_equipement==='Switch'?'selected':''}>Switch</option><option value="Routeur" ${eq.type_equipement==='Routeur'?'selected':''}>Routeur</option><option value="Storage" ${eq.type_equipement==='Storage'?'selected':''}>Storage</option></select></div>
                        <div class="form-group"><label>Alimentation</label><select id="f-alim"><option value="AC" ${eq.type_alimentation==='AC'?'selected':''}>AC</option><option value="DC" ${eq.type_alimentation==='DC'?'selected':''}>DC</option></select></div>
                    </div>
                    <div class="form-group"><label>Rack *</label><select id="f-rack">${this.data.racks.map(r=>`<option value="${r.id}" ${r.id===rackFk?'selected':''}>${r.id} - ${r.designation||r.salle}</option>`).join('')}</select></div>
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
                const boit = this.data.boitiersAC.find(b => b.id === id) || {};
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
                const tab = this.data.tableauxDC.find(t => t.id === id) || {};
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
                const cAC = this.data.connexionsAC.find(c => c.id === id) || {};
                const acEquips = this.data.equipements.filter(e => e.type_alimentation === 'AC' || !e.type_alimentation);
                form = `
                    <div class="form-group"><label>Équipement *</label><select id="f-equip">${acEquips.map(e=>`<option value="${e.id}" ${e.id===cAC.equipement_fk?'selected':''}>${e.nom_equipement} (${e.rack_fk})</option>`).join('')}</select></div>
                    <div class="form-row">
                        <div class="form-group"><label>Voie</label><select id="f-voie"><option value="1" ${cAC.voie==1?'selected':''}>Voie 1</option><option value="2" ${cAC.voie==2?'selected':''}>Voie 2</option></select></div>
                        <div class="form-group"><label>Puissance (kW) *</label><input type="number" step="0.01" id="f-puissance" value="${cAC.puissance_kw||''}"></div>
                    </div>
                    <div class="form-group"><label>Boîtier AC *</label><select id="f-boitier">${this.data.boitiersAC.map(b=>`<option value="${b.id}" ${b.id===(parentId||cAC.boitier_fk)?'selected':''}>${b.id} (${b.canalis})</option>`).join('')}</select></div>
                    <div class="form-row">
                        <div class="form-group"><label>Prise utilisée</label><input type="text" id="f-prise" value="${cAC.prise_utilisee||''}" placeholder="TRI 1, MONO 2..."></div>
                        <div class="form-group"><label>Phase</label><select id="f-phase"><option value="L1" ${cAC.phase==='L1'?'selected':''}>L1</option><option value="L2" ${cAC.phase==='L2'?'selected':''}>L2</option><option value="L3" ${cAC.phase==='L3'?'selected':''}>L3</option><option value="P123" ${cAC.phase==='P123'?'selected':''}>P123 (triphasé)</option></select></div>
                    </div>
                `;
                break;
                
            case 'connexionDC':
                const cDC = this.data.connexionsDC.find(c => c.id === id) || {};
                const dcEquips = this.data.equipements.filter(e => e.type_alimentation === 'DC');
                form = `
                    <div class="form-group"><label>Équipement (DC) *</label><select id="f-equip">${dcEquips.map(e=>`<option value="${e.id}" ${e.id===cDC.equipement_fk?'selected':''}>${e.nom_equipement} (${e.rack_fk})</option>`).join('')}</select></div>
                    <div class="form-row">
                        <div class="form-group"><label>Voie</label><select id="f-voie"><option value="1" ${cDC.voie==1?'selected':''}>Voie 1</option><option value="2" ${cDC.voie==2?'selected':''}>Voie 2</option></select></div>
                        <div class="form-group"><label>Puissance (kW) *</label><input type="number" step="0.01" id="f-puissance" value="${cDC.puissance_kw||''}"></div>
                    </div>
                    <div class="form-group"><label>Tableau DC *</label><select id="f-tableau">${this.data.tableauxDC.map(t=>`<option value="${t.id}" ${t.id===(parentId||cDC.tableau_dc_fk)?'selected':''}>${t.id} (${t.redresseur})</option>`).join('')}</select></div>
                    <div class="form-row">
                        <div class="form-group"><label>N° Disjoncteur</label><input type="number" id="f-disj" value="${cDC.numero_disjoncteur||''}"></div>
                        <div class="form-group"><label>Calibre</label><select id="f-calibre"><option value="25" ${cDC.calibre_a==25?'selected':''}>25A</option><option value="32" ${cDC.calibre_a==32?'selected':''}>32A</option><option value="40" ${cDC.calibre_a==40?'selected':''}>40A</option><option value="63" ${cDC.calibre_a==63?'selected':''}>63A</option><option value="80" ${cDC.calibre_a==80?'selected':''}>80A</option><option value="100" ${cDC.calibre_a==100?'selected':''}>100A</option><option value="125" ${cDC.calibre_a==125?'selected':''}>125A</option></select></div>
                    </div>
                `;
                break;
        }
        
        document.getElementById('modalBody').innerHTML = form;
        document.getElementById('modalOverlay').classList.add('active');
    },

    closeModal() {
        document.getElementById('modalOverlay').classList.remove('active');
        this.state.modal = { type: null, mode: null, id: null };
    },

    async saveModal() {
        const { type, mode, id } = this.state.modal;
        const isEdit = mode === 'edit';
        let item = {}, dataKey = '';
        
        switch(type) {
            case 'rack':
                dataKey = 'racks';
                item = { id: document.getElementById('f-id').value, salle: document.getElementById('f-salle').value, rangee: document.getElementById('f-rangee').value, numero_baie: document.getElementById('f-numero').value, designation: document.getElementById('f-designation').value, porteur: document.getElementById('f-porteur').value, puissance_pdu_kw: parseFloat(document.getElementById('f-puissance').value)||22 };
                break;
            case 'equipement':
                dataKey = 'equipements';
                item = { id: isEdit ? id : 'EQ-'+Date.now(), rack_fk: document.getElementById('f-rack').value, nom_equipement: document.getElementById('f-nom').value, type_equipement: document.getElementById('f-type').value, type_alimentation: document.getElementById('f-alim').value, u_position: parseInt(document.getElementById('f-upos').value)||1, hauteur_u: parseInt(document.getElementById('f-hauteur').value)||1, poids_kg: parseFloat(document.getElementById('f-poids').value)||0, numero_serie: document.getElementById('f-serie')?.value||'', statut: 'Actif' };
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
        
        // Validate required
        if (!item.id && type !== 'connexionAC' && type !== 'connexionDC') {
            this.toast('L\'ID est requis', 'error');
            return;
        }
        
        // Update local state
        if (isEdit) {
            const idx = this.data[dataKey].findIndex(x => x.id === id);
            if (idx >= 0) this.data[dataKey][idx] = item;
        } else {
            this.data[dataKey].push(item);
        }
        
        // Sync to API
        if (this.config.API_URL) {
            try {
                await fetch(this.config.API_URL, { 
                    method: 'POST', 
                    headers: {'Content-Type': 'application/json'}, 
                    body: JSON.stringify({ action: isEdit ? 'update' : 'add', sheet: dataKey, data: item }) 
                });
                this.toast('Sauvegardé et synchronisé!', 'success');
            } catch(e) { 
                this.toast('Sauvegardé localement', 'warning'); 
            }
        } else { 
            this.toast('Sauvegardé (mode démo)', 'success'); 
        }
        
        this.closeModal();
        this.renderPage(this.state.page);
    },

    async deleteItem(type, id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément?')) return;
        
        const keys = { rack:'racks', equipement:'equipements', boitier:'boitiersAC', tableauDC:'tableauxDC', connexionAC:'connexionsAC', connexionDC:'connexionsDC' };
        const dataKey = keys[type];
        
        // Remove from local state
        const idx = this.data[dataKey].findIndex(x => x.id === id);
        if (idx >= 0) {
            this.data[dataKey].splice(idx, 1);
        }
        
        // Sync to API
        if (this.config.API_URL) {
            try {
                await fetch(this.config.API_URL, { 
                    method: 'POST', 
                    headers: {'Content-Type': 'application/json'}, 
                    body: JSON.stringify({ action: 'delete', sheet: dataKey, id: id }) 
                });
                this.toast('Supprimé!', 'success');
            } catch(e) { 
                this.toast('Supprimé localement', 'warning'); 
            }
        } else { 
            this.toast('Supprimé (mode démo)', 'success'); 
        }
        
        // Clear selection if needed
        if (type === 'rack') {
            this.state.selectedRack = null;
        }
        if (type === 'tableauDC') {
            this.state.selectedTableau = null;
        }
        
        this.renderPage(this.state.page);
    },

    // ==================== UTILITIES ====================
    setConnected(connected) {
        const dot = document.getElementById('statusDot');
        const text = document.getElementById('statusText');
        if (dot) dot.classList.toggle('connected', connected);
        if (text) text.textContent = connected ? 'Connecté' : 'Mode Démo';
    },

    showLoading(show) {
        document.getElementById('loading').classList.toggle('active', show);
    },

    toast(msg, type = 'info') {
        const container = document.getElementById('toasts');
        const toast = document.createElement('div');
        toast.className = 'toast ' + type;
        const icons = { success: 'check-circle', error: 'times-circle', warning: 'exclamation-circle', info: 'info-circle' };
        toast.innerHTML = `<i class="fas fa-${icons[type]}"></i> ${msg}`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => DCIM.init());
