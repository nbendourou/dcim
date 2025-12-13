/**
 * DCIM CAPACITAIRE - Google Apps Script Backend
 * 
 * Ce fichier doit être copié dans l'éditeur Apps Script de votre Google Sheets
 * Extensions > Apps Script
 * 
 * Après déploiement, vous obtiendrez une URL à utiliser dans l'application frontend
 */

// ============================================
// CONFIGURATION
// ============================================

// ID de votre Google Sheets (dans l'URL entre /d/ et /edit)
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// Noms des onglets (doivent correspondre exactement à vos onglets)
const SHEETS = {
  CONFIG_GLOBALE: 'CONFIG_GLOBALE',
  CONFIG_DATACENTERS: 'CONFIG_DATACENTERS',
  CONFIG_SALLES: 'CONFIG_SALLES',
  CONFIG_CHAINES: 'CONFIG_CHAINES',
  CONFIG_UPS: 'CONFIG_UPS',
  CONFIG_REDRESSEURS: 'CONFIG_REDRESSEURS',
  TABLEAUX_DC: 'TABLEAUX_DC',
  CANALIS: 'CANALIS',
  BOITIERS_AC: 'BOITIERS_AC',
  PDU: 'PDU',
  RACKS: 'RACKS',
  EQUIPEMENTS: 'EQUIPEMENTS',
  CONNEXIONS_AC: 'CONNEXIONS_AC',
  CONNEXIONS_DC: 'CONNEXIONS_DC',
  AUTRES_CONSOMMATEURS: 'AUTRES_CONSOMMATEURS',
  SIMULATION_PERTE_CHAINE: 'SIMULATION_PERTE_CHAINE',
  HISTORIQUE_MESURES: 'HISTORIQUE_MESURES'
};

// ============================================
// WEB APP ENDPOINTS
// ============================================

/**
 * Gère les requêtes GET (lecture de données)
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'getAllData';
    let result;
    
    switch (action) {
      case 'ping':
        result = { status: 'ok', timestamp: new Date().toISOString() };
        break;
      
      case 'getAllData':
        result = getAllData();
        break;
      
      case 'getSheet':
        const sheetName = e.parameter.sheet;
        result = getSheetData(sheetName);
        break;
      
      case 'getConfig':
        result = getConfig();
        break;
      
      case 'getChainePower':
        result = calculateChainePower(e.parameter.mode || 'NOMINALE');
        break;
      
      default:
        result = { error: 'Action non reconnue' };
    }
    
    return createJsonResponse(result);
    
  } catch (error) {
    return createJsonResponse({ error: error.message });
  }
}

/**
 * Gère les requêtes POST (écriture de données)
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    let result;
    
    switch (action) {
      case 'updateConfig':
        result = updateConfig(data.config);
        break;
      
      case 'updateEquipement':
        result = updateEquipement(data.equipement);
        break;
      
      case 'updatePuissanceReelle':
        result = updatePuissanceReelle(data.equipementId, data.puissanceReelle);
        break;
      
      case 'addEquipement':
        result = addEquipement(data.equipement);
        break;
      
      case 'deleteEquipement':
        result = deleteEquipement(data.equipementId);
        break;
      
      case 'saveSimulation':
        result = saveSimulation(data.simulation);
        break;
      
      case 'addMesure':
        result = addMesure(data.mesure);
        break;
      
      default:
        result = { error: 'Action non reconnue' };
    }
    
    return createJsonResponse(result);
    
  } catch (error) {
    return createJsonResponse({ error: error.message });
  }
}

/**
 * Crée une réponse JSON avec les headers CORS appropriés
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// LECTURE DE DONNÉES
// ============================================

/**
 * Récupère toutes les données de tous les onglets
 */
function getAllData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  return {
    config: getConfigData(ss),
    datacenters: getSheetDataFromSS(ss, SHEETS.CONFIG_DATACENTERS),
    salles: getSheetDataFromSS(ss, SHEETS.CONFIG_SALLES),
    chaines: getSheetDataFromSS(ss, SHEETS.CONFIG_CHAINES),
    ups: getSheetDataFromSS(ss, SHEETS.CONFIG_UPS),
    redresseurs: getSheetDataFromSS(ss, SHEETS.CONFIG_REDRESSEURS),
    tableauxDC: getSheetDataFromSS(ss, SHEETS.TABLEAUX_DC),
    canalis: getSheetDataFromSS(ss, SHEETS.CANALIS),
    boitiersAC: getSheetDataFromSS(ss, SHEETS.BOITIERS_AC),
    pdu: getSheetDataFromSS(ss, SHEETS.PDU),
    racks: getSheetDataFromSS(ss, SHEETS.RACKS),
    equipements: getSheetDataFromSS(ss, SHEETS.EQUIPEMENTS),
    connexionsAC: getSheetDataFromSS(ss, SHEETS.CONNEXIONS_AC),
    connexionsDC: getSheetDataFromSS(ss, SHEETS.CONNEXIONS_DC),
    autresConsommateurs: getSheetDataFromSS(ss, SHEETS.AUTRES_CONSOMMATEURS),
    timestamp: new Date().toISOString()
  };
}

/**
 * Récupère la configuration globale
 */
function getConfig() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return getConfigData(ss);
}

/**
 * Récupère les données de configuration
 */
function getConfigData(ss) {
  const sheet = ss.getSheetByName(SHEETS.CONFIG_GLOBALE);
  if (!sheet) return {};
  
  const data = sheet.getDataRange().getValues();
  const config = {};
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      config[data[i][0]] = data[i][1];
    }
  }
  
  return config;
}

/**
 * Récupère les données d'un onglet spécifique
 */
function getSheetData(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return getSheetDataFromSS(ss, sheetName);
}

/**
 * Convertit les données d'un onglet en tableau d'objets
 */
function getSheetDataFromSS(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  
  const headers = data[0];
  const result = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) { // Ignore empty rows
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      result.push(obj);
    }
  }
  
  return result;
}

// ============================================
// ÉCRITURE DE DONNÉES
// ============================================

/**
 * Met à jour la configuration globale
 */
function updateConfig(config) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.CONFIG_GLOBALE);
  
  if (!sheet) {
    return { success: false, error: 'Onglet CONFIG_GLOBALE non trouvé' };
  }
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    const param = data[i][0];
    if (config[param] !== undefined) {
      sheet.getRange(i + 1, 2).setValue(config[param]);
    }
  }
  
  // Mettre à jour la date de dernière modification
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'DERNIERE_MAJ') {
      sheet.getRange(i + 1, 2).setValue(new Date().toLocaleString('fr-FR'));
      break;
    }
  }
  
  return { success: true };
}

/**
 * Met à jour un équipement
 */
function updateEquipement(equipement) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.EQUIPEMENTS);
  
  if (!sheet) {
    return { success: false, error: 'Onglet EQUIPEMENTS non trouvé' };
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Trouver la ligne de l'équipement
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === equipement.equipement_id) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1) {
    return { success: false, error: 'Équipement non trouvé' };
  }
  
  // Mettre à jour les colonnes modifiées
  headers.forEach((header, colIndex) => {
    if (equipement[header] !== undefined) {
      sheet.getRange(rowIndex, colIndex + 1).setValue(equipement[header]);
    }
  });
  
  return { success: true };
}

/**
 * Met à jour la puissance réelle d'un équipement
 */
function updatePuissanceReelle(equipementId, puissanceReelle) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.EQUIPEMENTS);
  
  if (!sheet) {
    return { success: false, error: 'Onglet EQUIPEMENTS non trouvé' };
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Trouver les index des colonnes
  const idColIndex = headers.indexOf('equipement_id');
  const puissanceColIndex = headers.indexOf('puissance_reelle_w');
  const dateMesureColIndex = headers.indexOf('date_mesure_reelle');
  
  if (puissanceColIndex === -1) {
    return { success: false, error: 'Colonne puissance_reelle_w non trouvée' };
  }
  
  // Trouver et mettre à jour l'équipement
  for (let i = 1; i < data.length; i++) {
    if (data[i][idColIndex] === equipementId) {
      sheet.getRange(i + 1, puissanceColIndex + 1).setValue(puissanceReelle);
      if (dateMesureColIndex !== -1) {
        sheet.getRange(i + 1, dateMesureColIndex + 1).setValue(
          new Date().toLocaleDateString('fr-FR')
        );
      }
      
      // Ajouter à l'historique des mesures
      addMesureToHistory(equipementId, puissanceReelle);
      
      return { success: true };
    }
  }
  
  return { success: false, error: 'Équipement non trouvé' };
}

/**
 * Ajoute un nouvel équipement
 */
function addEquipement(equipement) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.EQUIPEMENTS);
  
  if (!sheet) {
    return { success: false, error: 'Onglet EQUIPEMENTS non trouvé' };
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Générer un ID si non fourni
  if (!equipement.equipement_id) {
    equipement.equipement_id = 'EQ-' + Date.now();
  }
  
  // Créer la nouvelle ligne
  const newRow = headers.map(header => equipement[header] || '');
  
  sheet.appendRow(newRow);
  
  return { success: true, equipementId: equipement.equipement_id };
}

/**
 * Supprime un équipement
 */
function deleteEquipement(equipementId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.EQUIPEMENTS);
  
  if (!sheet) {
    return { success: false, error: 'Onglet EQUIPEMENTS non trouvé' };
  }
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === equipementId) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  
  return { success: false, error: 'Équipement non trouvé' };
}

/**
 * Sauvegarde une simulation
 */
function saveSimulation(simulation) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.SIMULATION_PERTE_CHAINE);
  
  if (!sheet) {
    return { success: false, error: 'Onglet SIMULATION_PERTE_CHAINE non trouvé' };
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Générer un ID
  simulation.simulation_id = 'SIM-' + Date.now();
  simulation.date_simulation = new Date().toLocaleDateString('fr-FR');
  
  const newRow = headers.map(header => simulation[header] || '');
  sheet.appendRow(newRow);
  
  return { success: true, simulationId: simulation.simulation_id };
}

/**
 * Ajoute une mesure de puissance à l'historique
 */
function addMesure(mesure) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.HISTORIQUE_MESURES);
  
  if (!sheet) {
    return { success: false, error: 'Onglet HISTORIQUE_MESURES non trouvé' };
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  mesure.mesure_id = 'MES-' + Date.now();
  mesure.date_mesure = new Date().toLocaleString('fr-FR');
  
  const newRow = headers.map(header => mesure[header] || '');
  sheet.appendRow(newRow);
  
  return { success: true };
}

/**
 * Ajoute une mesure à l'historique (interne)
 */
function addMesureToHistory(equipementId, puissance) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.HISTORIQUE_MESURES);
    
    if (sheet) {
      sheet.appendRow([
        'MES-' + Date.now(),
        new Date().toLocaleString('fr-FR'),
        equipementId,
        puissance,
        'Manuel',
        Session.getActiveUser().getEmail() || 'API'
      ]);
    }
  } catch (e) {
    // Silently fail if history sheet doesn't exist
  }
}

// ============================================
// CALCULS
// ============================================

/**
 * Calcule la puissance par chaîne
 */
function calculateChainePower(mode) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const chaines = getSheetDataFromSS(ss, SHEETS.CONFIG_CHAINES);
  const connexionsAC = getSheetDataFromSS(ss, SHEETS.CONNEXIONS_AC);
  const connexionsDC = getSheetDataFromSS(ss, SHEETS.CONNEXIONS_DC);
  const autresConsommateurs = getSheetDataFromSS(ss, SHEETS.AUTRES_CONSOMMATEURS);
  
  const powerField = mode === 'NOMINALE' ? 'puissance_nominale_kw' : 'puissance_reelle_kw';
  
  const result = {};
  
  // Initialiser les chaînes
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
  
  // Ajouter la puissance IT (AC + DC)
  [...connexionsAC, ...connexionsDC].forEach(conn => {
    const chaineId = conn.chaine_fk;
    if (result[chaineId]) {
      result[chaineId].it += parseFloat(conn[powerField]) || 0;
    }
  });
  
  // Ajouter les autres consommateurs
  autresConsommateurs.forEach(cons => {
    const chaineId = cons.chaine_fk;
    if (result[chaineId]) {
      result[chaineId].autres += parseFloat(cons[powerField]) || 0;
    }
  });
  
  // Calculer les totaux
  Object.values(result).forEach(ch => {
    ch.total = ch.it + ch.autres;
    ch.utilization = (ch.total / ch.capacity) * 100;
    ch.status = ch.utilization >= 85 ? 'critical' : ch.utilization >= 70 ? 'alert' : 'ok';
  });
  
  return result;
}

// ============================================
// MENU PERSONNALISÉ
// ============================================

/**
 * Crée un menu personnalisé dans Google Sheets
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏢 DCIM')
    .addItem('📊 Calculer puissance par chaîne', 'showChainePowerDialog')
    .addItem('🔄 Simuler perte de chaîne', 'showSimulationDialog')
    .addSeparator()
    .addItem('⚙️ Configuration', 'showConfigDialog')
    .addItem('📱 URL de l\'API', 'showApiUrl')
    .addToUi();
}

/**
 * Affiche l'URL de l'API déployée
 */
function showApiUrl() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'URL de l\'API',
    'Pour obtenir l\'URL de votre API:\n\n' +
    '1. Cliquez sur "Déployer" > "Nouveau déploiement"\n' +
    '2. Sélectionnez "Application Web"\n' +
    '3. Configurez l\'accès (Tout le monde)\n' +
    '4. Cliquez sur "Déployer"\n' +
    '5. Copiez l\'URL générée\n\n' +
    'Utilisez cette URL dans l\'application frontend.',
    ui.ButtonSet.OK
  );
}

/**
 * Affiche le dialogue de calcul de puissance
 */
function showChainePowerDialog() {
  const power = calculateChainePower('NOMINALE');
  const html = Object.values(power).map(ch => 
    `<b>Chaîne ${ch.code}</b>: ${ch.total.toFixed(2)} kW / ${ch.capacity} kW (${ch.utilization.toFixed(1)}%)`
  ).join('<br>');
  
  SpreadsheetApp.getUi().alert('Puissance par Chaîne (Nominale)', html, SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Affiche le dialogue de simulation
 */
function showSimulationDialog() {
  const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      select, button { padding: 10px; margin: 10px 0; }
      button { background: #1565C0; color: white; border: none; cursor: pointer; }
      #result { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px; }
    </style>
    <h3>Simulation Perte de Chaîne</h3>
    <select id="chaine">
      <option value="A">Chaîne A</option>
      <option value="B">Chaîne B</option>
    </select>
    <select id="mode">
      <option value="NOMINALE">Puissance Nominale</option>
      <option value="REELLE">Puissance Réelle</option>
    </select>
    <br>
    <button onclick="runSim()">Simuler</button>
    <div id="result"></div>
    <script>
      function runSim() {
        google.script.run.withSuccessHandler(showResult).simulateFromDialog(
          document.getElementById('chaine').value,
          document.getElementById('mode').value
        );
      }
      function showResult(r) {
        document.getElementById('result').innerHTML = r;
      }
    </script>
  `)
  .setWidth(400)
  .setHeight(300);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Simulation');
}

/**
 * Exécute la simulation depuis le dialogue
 */
function simulateFromDialog(chaineCode, mode) {
  const power = calculateChainePower(mode);
  const chains = Object.values(power);
  
  const chaine = chains.find(c => c.code === chaineCode);
  if (!chaine || !chaine.partner) return 'Chaîne non trouvée ou sans partenaire';
  
  const partner = power[chaine.partner];
  const totalLoad = chaine.total + partner.total;
  const pct = (totalLoad / partner.capacity) * 100;
  const margin = partner.capacity - totalLoad;
  
  let status = 'OK';
  if (pct >= 100) status = 'SURCHARGE';
  else if (pct >= 85) status = 'CRITIQUE';
  else if (pct >= 70) status = 'ALERTE';
  
  return `
    <b>Si perte Chaîne ${chaineCode}:</b><br><br>
    Charge transférée: ${chaine.total.toFixed(2)} kW<br>
    Charge Chaîne ${partner.code}: ${partner.total.toFixed(2)} kW<br>
    <b>Total après: ${totalLoad.toFixed(2)} kW</b><br>
    Capacité: ${partner.capacity} kW<br>
    <b>Taux: ${pct.toFixed(1)}%</b><br>
    Marge: ${margin.toFixed(2)} kW<br><br>
    <b style="color: ${status === 'OK' ? 'green' : status === 'ALERTE' ? 'orange' : 'red'}">
      Statut: ${status}
    </b>
  `;
}
