/**
 * DCIM PRO - Google Apps Script Backend
 * Full CRUD Operations for Google Sheets
 */

// ============================================
// CONFIGURATION
// ============================================
const SHEETS = {
    racks: 'Racks',
    equipements: 'Equipements',
    boitiersAC: 'boitiersAC',
    tableauxDC: 'tableauxDC',
    connexionsAC: 'connexionsAC',
    connexionsDC: 'connexionsDC',
    autresConsommateurs: 'autresConsommateurs'
};

// ============================================
// WEB APP ENDPOINTS
// ============================================

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
                result = getSheetData(e.parameter.sheet);
                break;
            default:
                result = { error: 'Unknown action' };
        }
        
        return createJsonResponse(result);
    } catch (error) {
        return createJsonResponse({ error: error.message });
    }
}

function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const action = data.action;
        let result;
        
        switch (action) {
            case 'add':
                result = addItem(data.sheet, data.data);
                break;
            case 'update':
                result = updateItem(data.sheet, data.data);
                break;
            case 'delete':
                result = deleteItem(data.sheet, data.id);
                break;
            default:
                result = { error: 'Unknown action' };
        }
        
        return createJsonResponse(result);
    } catch (error) {
        return createJsonResponse({ error: error.message });
    }
}

function createJsonResponse(data) {
    return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// READ OPERATIONS
// ============================================

function getAllData() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    return {
        racks: getSheetDataFromSS(ss, SHEETS.racks),
        equipements: getSheetDataFromSS(ss, SHEETS.equipements),
        boitiersAC: getSheetDataFromSS(ss, SHEETS.boitiersAC),
        tableauxDC: getSheetDataFromSS(ss, SHEETS.tableauxDC),
        connexionsAC: getSheetDataFromSS(ss, SHEETS.connexionsAC),
        connexionsDC: getSheetDataFromSS(ss, SHEETS.connexionsDC),
        autresConsommateurs: getSheetDataFromSS(ss, SHEETS.autresConsommateurs),
        timestamp: new Date().toISOString()
    };
}

function getSheetData(sheetKey) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = SHEETS[sheetKey] || sheetKey;
    return getSheetDataFromSS(ss, sheetName);
}

function getSheetDataFromSS(ss, sheetName) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];
    
    const headers = data[0].map(h => String(h).trim());
    const result = [];
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0]) {
            const obj = {};
            headers.forEach((header, index) => {
                if (header) obj[header] = row[index];
            });
            result.push(obj);
        }
    }
    
    return result;
}

// ============================================
// CREATE OPERATIONS
// ============================================

function addItem(sheetKey, item) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = SHEETS[sheetKey] || sheetKey;
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
        return { success: false, error: 'Sheet not found: ' + sheetName };
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = headers.map(header => item[header] !== undefined ? item[header] : '');
    
    sheet.appendRow(newRow);
    
    return { success: true, message: 'Item added' };
}

// ============================================
// UPDATE OPERATIONS
// ============================================

function updateItem(sheetKey, item) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = SHEETS[sheetKey] || sheetKey;
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
        return { success: false, error: 'Sheet not found: ' + sheetName };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idColumn = 0; // Assuming ID is first column
    
    // Find the row with matching ID
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
        if (data[i][idColumn] === item.id || data[i][idColumn] === item[headers[0]]) {
            rowIndex = i + 1; // 1-based index
            break;
        }
    }
    
    if (rowIndex === -1) {
        return { success: false, error: 'Item not found: ' + item.id };
    }
    
    // Update each column
    headers.forEach((header, colIndex) => {
        if (item[header] !== undefined) {
            sheet.getRange(rowIndex, colIndex + 1).setValue(item[header]);
        }
    });
    
    return { success: true, message: 'Item updated' };
}

// ============================================
// DELETE OPERATIONS
// ============================================

function deleteItem(sheetKey, id) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = SHEETS[sheetKey] || sheetKey;
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
        return { success: false, error: 'Sheet not found: ' + sheetName };
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Find the row with matching ID (first column)
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === id) {
            sheet.deleteRow(i + 1);
            return { success: true, message: 'Item deleted' };
        }
    }
    
    return { success: false, error: 'Item not found: ' + id };
}

// ============================================
// CUSTOM MENU
// ============================================

function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu('🏢 DCIM Pro')
        .addItem('📊 Statistiques', 'showStats')
        .addItem('🔗 URL de l\'API', 'showApiUrl')
        .addSeparator()
        .addItem('📄 Exporter JSON', 'exportJson')
        .addToUi();
}

function showStats() {
    const data = getAllData();
    const ui = SpreadsheetApp.getUi();
    
    ui.alert('Statistiques DCIM',
        'Racks: ' + data.racks.length + '\n' +
        'Équipements: ' + data.equipements.length + '\n' +
        'Boîtiers AC: ' + data.boitiersAC.length + '\n' +
        'Tableaux DC: ' + data.tableauxDC.length + '\n' +
        'Connexions AC: ' + data.connexionsAC.length + '\n' +
        'Connexions DC: ' + data.connexionsDC.length,
        ui.ButtonSet.OK
    );
}

function showApiUrl() {
    const ui = SpreadsheetApp.getUi();
    ui.alert('Configuration API',
        'Pour déployer l\'API:\n\n' +
        '1. Cliquez sur "Déployer" > "Nouveau déploiement"\n' +
        '2. Type: Application Web\n' +
        '3. Exécuter en tant que: Moi\n' +
        '4. Qui peut accéder: Tout le monde\n' +
        '5. Cliquez "Déployer"\n' +
        '6. Copiez l\'URL générée\n\n' +
        'Utilisez cette URL dans l\'application DCIM Pro.',
        ui.ButtonSet.OK
    );
}

function exportJson() {
    const data = getAllData();
    const json = JSON.stringify(data, null, 2);
    
    const html = HtmlService.createHtmlOutput(
        '<pre style="font-size: 12px; max-height: 400px; overflow: auto;">' + 
        json.replace(/</g, '&lt;').replace(/>/g, '&gt;') + 
        '</pre><br><button onclick="navigator.clipboard.writeText(document.querySelector(\'pre\').textContent); alert(\'Copié!\')">Copier</button>'
    )
    .setWidth(600)
    .setHeight(500);
    
    SpreadsheetApp.getUi().showModalDialog(html, 'Export JSON');
}

// ============================================
// HELPER FUNCTIONS FOR TESTING
// ============================================

function testGetAllData() {
    const data = getAllData();
    console.log('Racks:', data.racks.length);
    console.log('Equipements:', data.equipements.length);
    console.log('Sample rack:', JSON.stringify(data.racks[0]));
}

function testAddEquipement() {
    const result = addItem('equipements', {
        id: 'TEST-001',
        rack_fk: 'ITN1-A01',
        nom_equipement: 'Test Server',
        type_equipement: 'Serveur',
        type_alimentation: 'AC',
        u_position: 10,
        hauteur_u: 2,
        statut: 'Actif'
    });
    console.log(result);
}
