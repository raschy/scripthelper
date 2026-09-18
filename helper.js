'use strict';

const core = require("./helper_core");
const datapoints = require("./helper_datapoints");
const files = require("./helper_files");

module.exports = {
    // =========================================================
    // Core
    // =========================================================
    ...core,

    // =========================================================
    // Datapoints
    // =========================================================
    helperInit: datapoints.helperInit,

    dpCreate: datapoints.dpCreate,
    dpRead: datapoints.dpRead,
    dpWrite: datapoints.dpWrite,
    dpExists: datapoints.dpExists,
    dpDelete: datapoints.dpDelete,
    dpCreateObject: datapoints.dpCreateObject,

    // =========================================================
    // Files
    // =========================================================
    appendDataToFile: files.appendDataToFile,
    writeLog: files.writeLog    
};