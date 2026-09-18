let _iob = null;
let _cfg = {
    project: "",
    debugging: false
};


// ============================================================
// Initialisierung
// ============================================================

function helperInit(iob, config = {}) {

    if (!iob) {
        throw new Error("(f) helperInit| ioBroker-Kontext fehlt.");
    }

    _iob = iob;

    _cfg.project = config.project || "";
    _cfg.debugging = config.debugging === true;

    if (_cfg.debugging) {
        _iob.log(
            `(f) helperInit| project='${_cfg.project}'`,
            "info"
        );
    }
}


// ============================================================
// Logging
// ============================================================

function logDebug(message) {

    if (_cfg.debugging && _iob) {
        _iob.log(message, "info");
    }
}

/**
 * =========================================================================
 * resolveDp()
 * -------------------------------------------------------------------------
 * Erzeugt aus einer Kurz-ID oder vollständigen ID eine gültige
 * ioBroker-Datenpunkt-ID.
 * 
 * Voraussetzung:
 *      Datenpunkte dürfen grundsätzlich nur unter '0_userdata.0'
 *      angelegt werden. Hierzu muss dann nur der Name angegeben 
 *      werden. Der wird hier auf ungültige Zeichen geprüft.
 *      Ebenso kann eine komplette ID angegeben werden. 
 *      Zur einfacheren Strukturierung kann über 
 *      'dp_Project' ein Unterordner angesprochen werden.
 *
 * Regeln:
 *   - Führende/trailing Leerzeichen entfernen
 *   - Mehrfache Leerzeichen -> "_"
 *   - Ungültige Zeichen -> "_"
 *   - Mehrere "_" zusammenfassen
 *   - "." am Ende entfernen
 *   - Leere Namen verhindern
 *   - Vollständige IDs unverändert zurückgeben
 *
 * Beispiele:   dp_Project = "Test"
 *
 *   "Temperatur"        -  > 0_userdata.0.Test.Temperatur
 *   " Temp 1 "             -> 0_userdata.0.Test.Temp_1
 *   "A/B:C"                -> 0_userdata.0.Test.A_B_C
 *   "Temp..."              -> 0_userdata.0.Test.Temp
 *   "0_userdata.0.X.Y"     -> 0_userdata.0.X.Y
 *   "hm-rpc.0.ABC.1.LEVEL" -> hm-rpc.0.ABC.1.LEVEL
 *
 * =========================================================================
*/
function resolveDp(dp) {

    if (dp === null || dp === undefined)
        throw new Error("(f) resolveDp| Datenpunkt-ID fehlt.");

    let original = String(dp);
    dp = original.trim();

    if (dp.length === 0)
        throw new Error("(f) resolveDp| Datenpunkt-ID ist leer.");

    if (dp.includes("."))
        return dp;

    dp = dp.replace(/\s+/g, "_");
    dp = dp.replace(/[^A-Za-z0-9_\-äöüÄÖÜß]/g, "_");
    dp = dp.replace(/_+/g, "_");
    dp = dp.replace(/^[._]+|[._]+$/g, "");

    if (dp.length === 0)
        throw new Error(
            "(f) resolveDp| Datenpunkt-ID enthält keine gültigen Zeichen."
        );

    if (original.trim() !== dp) {
        logDebug(`(f) resolveDp| '${original}' -> '${dp}'`);
    }

    if (!_cfg.project) {
        throw new Error(
            "(f) resolveDp| Kein Projekt definiert."
        );
    }

    return `${_cfg.project}.${dp}`;
}


// ============================================================
// Datentyp prüfen
// ============================================================

function isValidDpType(type) {

    return [
        "number",
        "string",
        "boolean",
        "date",
        "array",
        "object"
    ].includes(type);
}


// ============================================================
// Objekttyp prüfen
// ============================================================

function isValidObjectType(type) {

    return [
        "folder",
        "channel",
        "device"
    ].includes(type);
}


/**
 * =========================================================================
 * buildCommon()
 * -------------------------------------------------------------------------
 * Erzeugt das ioBroker-common Objekt.
 * =========================================================================
 */
function buildCommon({
    name,
    desc = "",
    type,
    unit = "",
    write = false,
    role = "state"
}) {

    const common = {
        name,
        desc,
        type,
        role,
        read: true,
        write
    };

    if (unit)
        common.unit = unit;

    switch (type) {

        case "number":
            common.def = 0;
            break;

        case "string":
            common.def = "";
            break;

        case "boolean":
            common.def = false;
            break;

        case "date":
            common.type = "number";
            common.role = "date";
            common.def = 0;
            break;

        case "array":
            common.def = [];
            break;

        case "object":
            common.def = {};
            break;
    }

    return common;
}


/**
 * =========================================================================
 * dpCreate()
 * -------------------------------------------------------------------------
 * Definiert einen Datenpunkt.
 *
 *  Existiert der Datenpunkt bereits, wird lediglich seine vollständige ID 
 *  zurückgegeben.
 * 
 *      dpCreate({ id, name, desc, type, unit, write })
 * 
 *  Parameter:
 *      id, name und type sind Mindestvoraussetzung
 *      desc, unit und write sind optional
 *
 *      Gestützt wird hier auf die globale Variable "dp_Project".
 *      Existiert diese Variable nicht, wird grundsätzlich mit
 *      '0_userdata.0' gearbeitet.
 *
 * =========================================================================
 */
async function dpCreate({
    id,
    name,
    desc = "",
    type,
    unit = "",
    write = false
}) {

    if (!_iob) {
        throw new Error("(f) dpCreate| Helper nicht initialisiert.");
    }

    const dp = resolveDp(id);

    if (!isValidDpType(type)) {
        throw new Error(
            `(f) dpCreate| Ungültiger Datentyp '${type}' für '${id}'.`
        );
    }

    if (_iob.existsObject(dp)) {

        logDebug(
            `(f) dpCreate| Datenpunkt "${dp}" existiert bereits!`
        );

        return dp;
    }

    const common = buildCommon({
        name,
        desc,
        type,
        unit,
        write
    });

    logDebug(
        `(f) dpCreate| Erzeuge neuen Datenpunkt "${dp}" (${type})`
    );

    await _iob.createStateAsync(dp, common);

    return dp;
}


/**
 * =========================================================================
 * dpRead()
 * -------------------------------------------------------------------------
 * Lesen aus Datenpunkt
 * =========================================================================
 */
function dpRead(dp, defaultValue = null) {

    if (!_iob) {
        throw new Error("(f) dpRead| Helper nicht initialisiert.");
    }

    dp = resolveDp(dp);

    if (!_iob.existsObject(dp)) {

        logDebug(`(f) dpRead| '${dp}' existiert nicht.`);

        return defaultValue;
    }

    const state = _iob.getState(dp);

    if (!state) {

        logDebug(
            `(f) dpRead| Kein State für '${dp}'.`
        );

        return defaultValue;
    }

    if (state.val === null || state.val === undefined)
        return defaultValue;

    return state.val;
}


/**
 * =========================================================================
 * dpWrite()
 * -------------------------------------------------------------------------
 * Schreiben in Datenpunkt
 * =========================================================================
 */
async function dpWrite(id, value, ack = false) {

    const dp = resolveDp(id);

    logDebug(
        `(f) dpWrite| Resolve: ${id} => ${dp}`
    );

    if (!_iob.existsObject(dp)) {

        _iob.log(
            `(f) dpWrite| Datenpunkt "${dp}" existiert nicht.`,
            "warn"
        );

        return false;
    }

    try {

        await _iob.setStateAsync(dp, value, ack);

        return true;

    } catch (err) {

        _iob.log(
            `(f) dpWrite| ${err}`,
            "warn"
        );

        return false;
    }
}

/**
 * =========================================================================
 * dpExists()
 * -------------------------------------------------------------------------
 * Prüfen ob Datenpunkt vorhanden ist 
 * =========================================================================
 */
function dpExists(id) {

    if (!_iob) {
        throw new Error("(f) dpExists| Helper nicht initialisiert.");
    }

    return _iob.existsState(resolveDp(id));
}


/**
 * =========================================================================
 * dpDelete()
 * -------------------------------------------------------------------------
 * Löschen eines Datenpunkts
 * =========================================================================
 */
async function dpDelete(id) {

    if (!_iob) {
        throw new Error("(f) dpDelete| Helper nicht initialisiert.");
    }

    const dp = resolveDp(id);

    if (!_iob.existsObject(dp)) {

        logDebug(
            `(f) dpDelete| Datenpunkt "${dp}" existiert nicht.`
        );

        return true;
    }

    logDebug(
        `(f) dpDelete| Lösche Datenpunkt "${dp}"`
    );

    try {

        await _iob.deleteStateAsync(dp);

        return true;

    } catch (error) {

        _iob.log(
            `(f) dpDelete| Fehler beim Löschen von "${dp}": ${error}`,
            "warn"
        );

        return false;
    }
}


/**
 * =========================================================================
 * dpCreateObject()
 * -------------------------------------------------------------------------
 * Erzeugt ein ioBroker-Objekt.
 *
 * type : folder | channel | device
 * id   : Kurz-ID oder vollständige ioBroker-ID
 * name : Anzeigename
 * desc : Beschreibung
 *
 * Rückgabe:
 *   vollständige ID bei Erfolg
 *   false bei Fehler
 * =========================================================================
 */
async function dpCreateObject({
    type,
    id,
    name = "",
    desc = ""
}) {

    if (!_iob) {
        throw new Error(
            "(f) dpCreateObject| Helper nicht initialisiert."
        );
    }

    if (!isValidObjectType(type)) {
        throw new Error(
            `(f) dpCreateObject| Ungültiger Objekttyp '${type}' für '${id}'.`
        );
    }

    const dp = resolveDp(id);

    if (_iob.existsObject(dp)) {

        logDebug(
            `(f) dpCreateObject| Objekt "${dp}" existiert bereits!`
        );

        return dp;
    }

    const obj = {
        type,
        common: {
            name: name || dp.split(".").pop(),
            desc: desc || name || dp.split(".").pop()
        },
        native: {}
    };

    logDebug(
        `(f) dpCreateObject| Erzeuge ${type} "${dp}"`
    );

    try {

        await _iob.setObjectAsync(dp, obj);

        return dp;

    } catch (error) {

        _iob.log(
            `(f) dpCreateObject| Fehler beim Erzeugen von "${dp}": ${error}`,
            "warn"
        );

        return false;
    }
}


// ============================================================
// Export
// ============================================================

module.exports = {
    helperInit,
    dpCreate,
    dpRead,
    dpWrite,
    dpExists,
    dpDelete,
    dpCreateObject
};