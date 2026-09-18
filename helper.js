'use strict';

const core = require("./helper_core");
const datapoints = require("./helper_datapoints");

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
    dpCreateObject: datapoints.dpCreateObject
};