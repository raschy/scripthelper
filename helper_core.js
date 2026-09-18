'use strict';


// =========================================================================
// Zahlen
// =========================================================================

function round(wert, dez = 2) {

    wert = parseFloat(wert);

    if (!wert)
        return 0;

    const umrechnungsfaktor = Math.pow(10, dez);

    return Math.round(wert * umrechnungsfaktor)
         / umrechnungsfaktor;
}


// -------------------------------------------------------------------------

function truncateDecimals(num, digits = 3) {

    if (isNaN(num)) {
        return;
    }

    const multiplier = Math.pow(10, digits);
    const expandNum =
        Number((Math.abs(num) * multiplier).toPrecision(15));

    const adjustedNum =
        Math.round(expandNum) / multiplier * Math.sign(num);

    return adjustedNum;
}


// -------------------------------------------------------------------------

function toFixed(value, precision) {

    let _precision = precision || 0,
        power = Math.pow(10, _precision),
        absValue = Math.abs(Math.round(value * power)),
        result =
            (value < 0 ? '-' : '') +
            String(Math.floor(absValue / power));

    if (_precision > 0) {

        let fraction = String(absValue % power);

        let padding =
            new Array(
                Math.max(precision - fraction.length, 0) + 1
            ).join('0');

        result += '.' + padding + fraction;
    }

    return result;
}


// -------------------------------------------------------------------------

function arrayAVG(arr) {

    if (!Array.isArray(arr) || arr.length === 0) {
        return null;
    }

    if (!arr.every(
        num => typeof num === "number" && !isNaN(num)
    )) {
        return null;
    }

    const sum =
        arr.reduce((acc, val) => acc + val, 0);

    return sum / arr.length;
}


// -------------------------------------------------------------------------

function mathRandomInt(a, b) {

    if (a > b) {
        const c = a;
        a = b;
        b = c;
    }

    return Math.floor(
        Math.random() * (b - a + 1) + a
    );
}


// -------------------------------------------------------------------------

function getRandomIntInclusive(min, max) {

    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;
}


// =========================================================================
// Allgemein
// =========================================================================

function pad(n) {

    return n < 10
        ? '0' + n
        : n;
}


// -------------------------------------------------------------------------

function showBoolean(val) {

    return val ? '✅' : '❌';
}


// =========================================================================
// JSON
// =========================================================================

function parseJSON(value, def = null) {

    if (
        value === null ||
        typeof value === 'undefined' ||
        value === ''
    ) {
        return def;
    }


    function trimDeep(v) {

        if (Array.isArray(v))
            return v.map(trimDeep);


        if (typeof v === 'object' && v !== null) {

            const out = {};

            for (const [k, vv] of Object.entries(v)) {

                const key =
                    typeof k === 'string'
                        ? k.trim()
                        : k;

                out[key] = trimDeep(vv);
            }

            return out;
        }


        if (typeof v === 'string')
            return v.trim();


        return v;
    }


    if (typeof value === 'object')
        return trimDeep(value);


    if (typeof value === 'string') {

        try {

            const parsed = JSON.parse(value);

            return trimDeep(parsed);

        } catch (e) {

            return def;
        }
    }


    return def;
}


// =========================================================================
// Datum & Zeit
// =========================================================================

function timeToSeconds(value) {

    if (value instanceof Date) {

        return value.getHours() * 3600
             + value.getMinutes() * 60
             + value.getSeconds();
    }


    if (typeof value !== 'string')
        return null;


    const parts = value.trim().split(':');


    if (parts.length < 2 || parts.length > 3)
        return null;


    const hours   = Number(parts[0]);
    const minutes = Number(parts[1]);
    const seconds =
        parts.length === 3
            ? Number(parts[2])
            : 0;


    if (
        !Number.isInteger(hours) ||
        !Number.isInteger(minutes) ||
        !Number.isInteger(seconds) ||
        hours < 0 ||
        minutes < 0 ||
        seconds < 0
    ) {
        return null;
    }


    return hours * 3600
         + minutes * 60
         + seconds;
}


// -------------------------------------------------------------------------

function secondsToTime(seconds, withSeconds = true) {

    if (!Number.isFinite(seconds) || seconds < 0)
        return null;


    seconds = Math.floor(seconds) % 86400;


    const hours =
        Math.floor(seconds / 3600);

    const minutes =
        Math.floor((seconds % 3600) / 60);

    const secs =
        seconds % 60;


    const result =
        String(hours).padStart(2, '0') +
        ':' +
        String(minutes).padStart(2, '0');


    return withSeconds
        ? result + ':' +
          String(secs).padStart(2, '0')
        : result;
}


// -------------------------------------------------------------------------

function addMinutes(time, minutes) {

    const seconds = timeToSeconds(time);

    if (seconds === null)
        return null;


    let result =
        seconds + minutes * 60;


    result =
        ((result % 86400) + 86400) % 86400;


    return secondsToTime(result, false);
}


// -------------------------------------------------------------------------

function addSeconds(time, seconds) {

    const base = timeToSeconds(time);


    if (
        base === null ||
        !Number.isFinite(seconds)
    ) {
        return null;
    }


    return secondsToTime(base + seconds);
}


// -------------------------------------------------------------------------

function isTimeInRange(range) {

    const [start, end] =
        range.split('-');


    const startSeconds =
        timeToSeconds(start);

    const endSeconds =
        timeToSeconds(end);

    const nowSeconds =
        timeToSeconds(new Date());


    if (
        startSeconds === null ||
        endSeconds === null
    ) {
        return false;
    }


    if (startSeconds <= endSeconds) {

        return (
            nowSeconds >= startSeconds &&
            nowSeconds <= endSeconds
        );
    }


    // Über Mitternacht

    return (
        nowSeconds >= startSeconds ||
        nowSeconds <= endSeconds
    );
}


// -------------------------------------------------------------------------

function zeitZuMinuten(ZeitStr) {

    const [h, m] =
        ZeitStr.split(':').map(Number);

    return h * 60 + m;
}


// -------------------------------------------------------------------------

function formatTime(ts) {

    const d = new Date(ts * 1000);

    const pad = n =>
        n.toString().padStart(2, "0");


    return (
        `${pad(d.getDate())}.` +
        `${pad(d.getMonth() + 1)}.` +
        `${d.getFullYear().toString().slice(-2)} ` +
        `${pad(d.getHours())}:` +
        `${pad(d.getMinutes())}:` +
        `${pad(d.getSeconds())}`
    );
}


// -------------------------------------------------------------------------

function ts2Time(unixTimestamp) {

    const dateTs =
        new Date(unixTimestamp);


    return (
        `${dateTs.getHours().toString().padStart(2, '0')}:` +
        `${dateTs.getMinutes().toString().padStart(2, '0')}:` +
        `${dateTs.getSeconds().toString().padStart(2, '0')}:` +
        `${dateTs.getMilliseconds().toString().padStart(3, '0')}`
    );
}


// -------------------------------------------------------------------------

function makeCronString(Schaltzeit) {

    const [hours, minutes, seconds] =
        Schaltzeit.split(':').map(Number);


    return (
        seconds + " " +
        minutes + " " +
        hours + " * * *"
    );
}


// =========================================================================
// Export
// =========================================================================

module.exports = {

    round,
    truncateDecimals,
    toFixed,
    arrayAVG,
    mathRandomInt,
    getRandomIntInclusive,

    pad,
    showBoolean,

    parseJSON,

    timeToSeconds,
    secondsToTime,
    addMinutes,
    addSeconds,
    isTimeInRange,
    zeitZuMinuten,
    formatTime,
    ts2Time,
    makeCronString
};