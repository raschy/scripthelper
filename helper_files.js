'use strict';

const fs = require('fs').promises;


// =========================================================================
// Dateien
// =========================================================================

async function appendDataToFile(fileObj, data) {

    if (!fileObj || !fileObj.path || !fileObj.file) {
        throw new Error('(f) appendDataToFile| Ungültiges Dateiobjekt.');
    }

    const path = fileObj.path.replace(/\/+$/, '');
    const file = fileObj.file;

    // Verzeichnis sicherstellen
    await fs.mkdir(path, {recursive: true});

    // Dateiname um aktuelles Datum erweitern
    const dot = file.lastIndexOf('.');

    let filename;

    if (dot > 0) {
        const name = file.substring(0, dot);
        const ext = file.substring(dot);

        filename = `${name}_${getDateString()}${ext}`;
    } else {
        filename = `${file}_${getDateString()}`;
    }

    const fullPath = `${path}/${filename}`;
    await fs.appendFile(fullPath, data);

    return fullPath;
}


// =========================================================================
// Logdatei
// =========================================================================

async function writeLog(logEntry, fileObj) {

    const now = new Date();
    const dateTime = now.toLocaleString('fr-CH');
    const data = `${dateTime}\t${logEntry}\n`;

    return await appendDataToFile(fileObj, data);
}


// =========================================================================
// Hilfsfunktionen
// =========================================================================

function getDateString(date = new Date()) {

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}${month}${day}`;
}


// =========================================================================
// Export
// =========================================================================

module.exports = {
    appendDataToFile,
    writeLog
};