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


// ============================================================
// DP-ID auflösen
// ============================================================

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


// ============================================================
// Common-Objekt erzeugen
// ============================================================

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


// ============================================================
// Datenpunkt erzeugen
// ============================================================

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


// ============================================================
// Datenpunkt lesen
// ============================================================

function dpRead(dp, defaultValue = null) {

    if (!_iob) {
        throw new Error("(f) dpRead| Helper nicht initialisiert.");
    }

    dp = resolveDp(dp);

    if (!_iob.existsObject(dp)) {

        logDebug(
            `(f) dpRead| '${dp}' existiert nicht.`
        );

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


// ============================================================
// Datenpunkt vorhanden?
// ============================================================

function dpExists(id) {

    if (!_iob) {
        throw new Error("(f) dpExists| Helper nicht initialisiert.");
    }

    return _iob.existsState(resolveDp(id));
}


// ============================================================
// Datenpunkt löschen
// ============================================================

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


// ============================================================
// Objekt erzeugen
// ============================================================

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
    dpExists,
    dpDelete,
    dpCreateObject
};