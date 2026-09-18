'use strict';


/*
function hello(name = 'Welt') {
    return `Hallo ${name}!`;
}
*/


const datapoints = require("./helper_datapoints");

module.exports = {
    helperInit: datapoints.helperInit,

    dpCreate: datapoints.dpCreate,
    dpRead: datapoints.dpRead,
    dpWrite: datapoints.dpWrite,
    dpExists: datapoints.dpExists,
    dpDelete: datapoints.dpDelete,
    dpCreateObject: datapoints.dpCreateObject
};

/*
module.exports = {
    hello
};
*/