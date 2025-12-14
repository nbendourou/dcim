/**
 * DCIM - Google Apps Script Backend
 * API pour synchronisation avec Google Sheets
 */

const SHEETS = {
    racks: 'Racks',
    equipements: 'Equipements',
    boitiersAC: 'boitiersAC',
    tableauxDC: 'tableauxDC',
    connexionsAC: 'connexionsAC',
    connexionsDC: 'connexionsDC'
};

function doGet(e) {
    const action = e?.parameter?.action || 'getAllData';
    let result;
    
    try {
        switch (action) {
            case 'ping':
                result = { status: 'ok', timestamp: new Date().toISOString(), version: '1.0' };
                break;
            case 'getAllData':
                result = getAllData();
                break;
            default:
                result = { error: 'Action inconnue: ' + action };
        }
    } catch (error) {
        result = { error: error.message };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
    let result;
    
    try {
        const data = JSON.parse(e.postData.contents);
        
        switch (data.action) {
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
                result = { error: 'Action inconnue: ' + data.action };
        }
    } catch (error) {
        result = { error: error.message };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function getAllData() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    return {
        racks: getSheetData(ss, SHEETS.racks),
        equipements: getSheetData(ss, SHEETS.equipements),
        boitiersAC: getSheetData(ss, SHEETS.boitiersAC),
        tableauxDC: getSheetData(ss, SHEETS.tableauxDC),
        connexionsAC: getSheetData(ss, SHEETS.connexionsAC),
        connexionsDC: getSheetData(ss, SHEETS.connexionsDC),
        timestamp: new Date().toISOString()
    };
}

function getSheetData(ss, sheetName) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
        console.log('Sheet not found: ' + sheetName);
        return [];
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];
    
    const headers = data[0].map(h => String(h).trim());
    const result = [];
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        // Skip empty rows
        if (!row[0] && row[0] !== 0) continue;
        
        const obj = {};
        headers.forEach((header, idx) => {
            if (header) {
                obj[header] = row[idx];
            }
        });
        result.push(obj);
    }
    
    return result;
}

function addItem(sheetKey, item) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = SHEETS[sheetKey] || sheetKey;
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
        return { success: false, error: 'Feuille non trouvée: ' + sheetName };
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = headers.map(h => {
        const val = item[h];
        return val !== undefined ? val : '';
    });
    
    sheet.appendRow(newRow);
    
    return { success: true, message: 'Élément ajouté', id: item.id || item[headers[0]] };
}

function updateItem(sheetKey, item) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = SHEETS[sheetKey] || sheetKey;
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
        return { success: false, error: 'Feuille non trouvée: ' + sheetName };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idCol = 0; // ID is always first column
    
    // Find row
    let rowIdx = -1;
    for (let i = 1; i < data.length; i++) {
        if (String(data[i][idCol]) === String(item.id) || String(data[i][idCol]) === String(item[headers[0]])) {
            rowIdx = i + 1; // 1-indexed
            break;
        }
    }
    
    if (rowIdx === -1) {
        return { success: false, error: 'Élément non trouvé: ' + (item.id || item[headers[0]]) };
    }
    
    // Update each column
    headers.forEach((h, colIdx) => {
        if (item[h] !== undefined) {
            sheet.getRange(rowIdx, colIdx + 1).setValue(item[h]);
        }
    });
    
    return { success: true, message: 'Élément mis à jour' };
}

function deleteItem(sheetKey, id) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = SHEETS[sheetKey] || sheetKey;
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
        return { success: false, error: 'Feuille non trouvée: ' + sheetName };
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Find row by ID (first column)
    for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(id)) {
            sheet.deleteRow(i + 1);
            return { success: true, message: 'Élément supprimé', id: id };
        }
    }
    
    return { success: false, error: 'Élément non trouvé: ' + id };
}

// ==================== MENU ====================
function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu('🏢 DCIM')
        .addItem('📊 Statistiques', 'showStats')
        .addItem('🔗 Obtenir URL API', 'showApiInfo')
        .addItem('📤 Exporter JSON', 'exportJson')
        .addToUi();
}

function showStats() {
    const data = getAllData();
    SpreadsheetApp.getUi().alert('📊 Statistiques DCIM',
        '• Racks: ' + data.racks.length + '\n' +
        '• Équipements: ' + data.equipements.length + '\n' +
        '• Boîtiers AC: ' + data.boitiersAC.length + '\n' +
        '• Tableaux DC: ' + data.tableauxDC.length + '\n' +
        '• Connexions AC: ' + data.connexionsAC.length + '\n' +
        '• Connexions DC: ' + data.connexionsDC.length,
        SpreadsheetApp.getUi().ButtonSet.OK);
}

function showApiInfo() {
    SpreadsheetApp.getUi().alert('🔗 Déploiement API',
        'Pour obtenir l\'URL de l\'API:\n\n' +
        '1. Cliquez "Déployer" → "Nouveau déploiement"\n' +
        '2. Type: Application Web\n' +
        '3. Exécuter en tant que: Moi\n' +
        '4. Accès: Tout le monde\n' +
        '5. Cliquez "Déployer"\n' +
        '6. Copiez l\'URL fournie\n\n' +
        '⚠️ IMPORTANT: Après modification du code,\n' +
        'créez un NOUVEAU déploiement pour appliquer\n' +
        'les changements!',
        SpreadsheetApp.getUi().ButtonSet.OK);
}

function exportJson() {
    const data = getAllData();
    const html = HtmlService.createHtmlOutput(
        '<textarea style="width:100%;height:400px;font-family:monospace;font-size:12px">' + 
        JSON.stringify(data, null, 2) + 
        '</textarea><br><button onclick="navigator.clipboard.writeText(document.querySelector(\'textarea\').value);alert(\'Copié!\')">Copier</button>'
    ).setWidth(600).setHeight(500);
    SpreadsheetApp.getUi().showModalDialog(html, 'Export JSON');
}

// Test functions
function testGetData() {
    const data = getAllData();
    console.log('Racks:', data.racks.length);
    console.log('Equipements:', data.equipements.length);
    console.log('Sample rack:', data.racks[0]);
}
