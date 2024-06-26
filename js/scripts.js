const SPEC = "https://github.com/msgpack/msgpack/blob/master/spec.md";

function highlight(elems, className) {
    elems.forEach(function(elem) {
        elem.className = className;
    });
}

function onPositionHover() {
    var allElemsNodeList = datadisplay.getElementsByTagName("a");
    var allElems = [];
    for(var i=0, ii=allElemsNodeList.length; i<ii; i++) {
        allElems.push(allElemsNodeList[i]);
    }
    highlight(allElems, "");
    var coords = this.rel.split(",");
    var start = parseInt(coords[0], 10);
    var end = start + parseInt(coords[1], 10) - 1;
    highlight(allElems.filter(function(elem) {
        var indx = parseInt(elem.rel, 10);
        return indx >= start && indx <= end;
    }), "highlight");
}

// Logger
var logoutput;
var datadisplay;
var jsonobj;
function errlog(str) {
    var div = document.createElement("div");
    div.innerText = str;
    logoutput.appendChild(div);
}

function log(position, length, str) {
    var div = document.createElement("div");
    var a = document.createElement("a");
    a.href = "#";
    a.className = "poslink";
    a.rel = position + "," + length;
    a.innerHTML = "posn " + position;
    a.addEventListener("mouseover", onPositionHover);
    div.appendChild(a);
    var span = document.createElement("span");
    span.innerHTML = ": " + str;
    div.appendChild(span);
    logoutput.appendChild(div);
    return div; // Return the created element in case it needs to be modified
}

function logedit(div, position, length, str) {
    var a = div.children[0];
    var span = div.children[1];

    a.rel = position + "," + length;
    a.innerHTML = "posn " + position;
    span.innerHTML = ": " + str;
}

function clear() {
    logoutput.innerHTML = "";
    datadisplay.innerHTML = "";
    jsonobj.innerHTML = "";
}

// adds a byteval to the list
function displayByte(byteVal, indx) {
    var byteStr = byteVal.toString(16);
    if(byteStr.length == 1) {
        byteStr = "0" + byteStr;
    }
    var a = document.createElement("a");
    a.href = "#";
    a.id = "byte_" + indx;
    a.rel = indx;
    a.innerHTML = byteStr;
    datadisplay.appendChild(a);
}

// http://jsfromhell.com/geral/utf-8
function bufToString(buf) {
    var uint8Buff = new Uint8Array(buf);
    var byteCount = uint8Buff.byteLength;
    var output = "";
    var a, b;
    for (var i = 0; i < byteCount; i++) {
        a = uint8Buff[i];
        if (a & 0x80) {
            b = uint8Buff[i + 1];
            if (((a & 0xfc) == 0xc0) && ((b & 0xc0) == 0x80)) {
                output += String.fromCharCode(((a & 0x03) << 6) + (b & 0x3f));
            } else {
                output += String.fromCharCode(128);
                i++;
            }
        } else {
            output += String.fromCharCode(a);
        }
    }
    return output;
}

function formatNumberOfItems(length) {
    return length === 1 ? "(<b>1</b> item)" : "(<b>" + length + "</b> items)";
}

// javascript msgpack parsing taken from
// https://github.com/creationix/msgpack-js/blob/master/msgpack.js
// and then heavily tweaked to my needs
function decode(dataView) {
    var offset = 0;

    function map(indent, length) {
        var value = {};
        for (var i = 0; i < length; i++) {
            var key = parse(indent + 1, "key: ");
            value[key] = parse(indent + 1, "value: ");
        }
        return value;
    }

    function raw(length) {
        var value = bufToString(dataView.buffer.slice(offset, offset + length));
        offset += length;
        return value;
    }

    function array(indent, length) {
        var value = new Array(length);
        for (var i = 0; i < length; i++) {
            value[i] = parse(indent + 1, "[" + i.toString() + "]: ");
        }
        return value;
    }

    var extlog = log;
    var extlogedit = logedit;

    function parse(indent, logprefix) {
        var type = dataView.getUint8(offset);
        var value, length;
        if (!logprefix) {
            logprefix = "";
        }

        var indentstr = "|&nbsp&nbsp&nbsp".repeat(indent) + "+-- ";

        function log(position, length, str) {
            return extlog(position, length, indentstr + logprefix + str);
        };

        function logedit(div, position, length, str) {
            return extlogedit(div, position, length, indentstr + logprefix + str);
        }

        switch (type) {
            // nil
            case 0xc0:
                log(offset, 1, "NULL");
                offset++;
                return null;
            // false
            case 0xc2:
                log(offset, 1, "false");
                offset++;
                return false;
            // true
            case 0xc3:
                log(offset, 1, "true");
                offset++;
                return true;
            // bin 8
            case 0xc4:
                length = dataView.getUint8(offset + 1);
                var startOffset = offset;
                offset += 2;
                var result = raw(length);
                log(startOffset, offset - startOffset, "<a href='" + SPEC + "#bin-format-family'>bin8 marker " + formatNumberOfItems(length));
                return result;
            // bin 16
            case 0xc5:
                length = dataView.getUint16(offset + 1);
                var startOffset = offset;
                offset += 3;
                var result = raw(length);
                log(startOffset, offset - startOffset, "<a href='" + SPEC + "#bin-format-family'>bin16 marker " + formatNumberOfItems(length));
                return result;
            // bin 32
            case 0xc6:
                length = dataView.getUint32(offset + 1);
                var startOffset = offset;
                offset += 5;
                var result = raw(length);
                log(startOffset, offset - startOffset, "<a href='" + SPEC + "#bin-format-family'>bin32 marker " + formatNumberOfItems(length));
                return result;
            // float
            case 0xca:
                value = dataView.getFloat32(offset + 1);
                log(offset, 5, "float value " + value);
                offset += 5;
                return value;
            // double
            case 0xcb:
                value = dataView.getFloat64(offset + 1);
                log(offset, 9, "double value " + value);
                offset += 9;
                return value;
            // uint8
            case 0xcc:
                value = dataView.getUint8(offset + 1);
                log(offset, 2, "uint8 value " + value);
                offset += 2;
                return value;
            // uint 16
            case 0xcd:
                value = dataView.getUint16(offset + 1);
                log(offset, 3, "uint16 value " + value);
                offset += 3;
                return value;
            // uint 32
            case 0xce:
                value = dataView.getUint32(offset + 1);
                log(offset, 5, "uint32 value " + value);
                offset += 5;
                return value;
            // uint64
            case 0xcf:
                const mu32b = dataView.getUint32(offset + 1);
                const lu32b = dataView.getUint32(offset + 5);
                value = (BigInt(mu32b) << 32n) | BigInt(lu32b);
                log(offset, 9, "uint64 value " + value);
                offset += 9;
                return value;
            // int 8
            case 0xd0:
                value = dataView.getInt8(offset + 1);
                log(offset, 2, "int8 value " + value);
                offset += 2;
                return value;
            // int 16
            case 0xd1:
                value = dataView.getInt16(offset + 1);
                log(offset, 3, "int16 value " + value);
                offset += 3;
                return value;
            // int 32
            case 0xd2:
                value = dataView.getInt32(offset + 1);
                log(offset, 5, "int32 value " + value);
                offset += 5;
                return value;
            // int 64
            case 0xd3:
                const ms32b = dataView.getInt32(offset + 1);
                const ls32b = dataView.getUint32(offset + 5);
                value = BigInt.asIntN(64, BigInt(ms32b) << 32n) | BigInt(ls32b);
                log(offset, 9, "int64 value " + value);
                offset += 9;
                return value;
            // map 16
            case 0xde:
                length = dataView.getUint16(offset + 1);
                var startOffset = offset;
                offset += 3;
                var parent = log(startOffset, offset - startOffset, "placeholder");
                var result = map(indent, length);
                logedit(parent, startOffset, offset - startOffset, "<a href='" + SPEC + "#map-format-family'>map16 marker " + formatNumberOfItems(length));
                return result;
            // map 32
            case 0xdf:
                length = dataView.getUint32(offset + 1);
                var startOffset = offset;
                offset += 5;
                var parent = log(startOffset, offset - startOffset, "placeholder");
                var result = map(indent, length);
                logedit(parent, startOffset, offset - startOffset, "<a href='" + SPEC + "#map-format-family'>map32 marker " + formatNumberOfItems(length));
                return result;
            // array 16
            case 0xdc:
                length = dataView.getUint16(offset + 1);
                var startOffset = offset;
                offset += 3;
                var parent = log(startOffset, offset - startOffset, "<a href='" + SPEC + "placeholder");
                var result = array(indent, length);
                logedit(parent, startOffset, offset - startOffset, "<a href='" + SPEC + "#array-format-family'>array16 marker " + formatNumberOfItems(length));
                return result;
            // array 32
            case 0xdd:
                length = dataView.getUint32(offset + 1);
                var startOffset = offset;
                offset += 5;
                var parent = log(startOffset, offset - startOffset, "placeholder");
                var result = array(indent, length);
                logedit(parent, startOffset, offset - startOffset, "<a href='" + SPEC + "#array-format-family'>array32 marker " + formatNumberOfItems(length));
                return result;
            // str 8
            case 0xd9:
                length = dataView.getUint8(offset + 1);
                var startOffset = offset;
                offset += 2;
                var result = raw(length);
                log(startOffset, offset - startOffset, "str8 marker: &quot;" + result + "&quot;");
                return result;
            // str 16
            case 0xda:
                length = dataView.getUint16(offset + 1);
                var startOffset = offset;
                offset += 3;
                var result = raw(length);
                log(startOffset, offset - startOffset, "str16 marker: &quot;" + result + "&quot;");
                return result;
            // str 32
            case 0xdb:
                length = dataView.getUint32(offset + 1);
                var startOffset = offset;
                offset += 5;
                var result = raw(length);
                log(startOffset, offset - startOffset, "str32 marker: &quot;" + result + "&quot;");
                return result;
        }
        // FixStr
        if ((type & 0xe0) === 0xa0) {
            length = type & 0x1f;
            var startOffset = offset;
            offset++;
            var result = raw(length);
            log(startOffset, offset - startOffset, "fixed str marker: &quot;" + result + "&quot;");
            return result;
        }
        // FixMap
        if ((type & 0xf0) === 0x80) {
            length = type & 0x0f;
            var startOffset = offset;
            offset++;
            var parent = log(startOffset, offset - startOffset, "placeholder");
            var result = map(indent, length);
            logedit(parent, startOffset, offset - startOffset, "<a href='" + SPEC + "#map-format-family'>fixed length map</a> marker " + formatNumberOfItems(length));
            return result;
        }
        // FixArray
        if ((type & 0xf0) === 0x90) {
            length = type & 0x0f;
            var startOffset = offset;
            offset++;
            var parent = log(startOffset, offset - startOffset, "<a href='" + SPEC + "#array-format-family'>fixed length array</a> marker " + formatNumberOfItems(length));
            var result = array(indent, length);
            logedit(parent, startOffset, offset - startOffset, "<a href='" + SPEC + "#array-format-family'>fixed length array</a> marker " + formatNumberOfItems(length));
            return result;
        }
        // Positive FixNum
        if ((type & 0x80) === 0x00) {
            log(offset, 1, "positive fixint with value " + type);
            offset++;
            return type;
        }
        // Negative Fixnum
        if ((type & 0xe0) === 0xe0) {
            value = dataView.getInt8(offset);
            log(offset, 1, "negative fixint with value " + value);
            offset++;
            return value;
        }
        throw new Error("Unknown type 0x" + type.toString(16));
    }

    const values = [];
    while (offset < dataView.byteLength) {
        values.push(parse(0));
    }
    return values;
}

/**
 * Parse the input based on the input type selector.
 * Call the appropriate parsing function.
 */
function parseInput() {
    const inputType = document.getElementById("input-type").value;
    const data = document.getElementById("data").value;

    if (!logoutput) logoutput = document.getElementById("log");
    if (!jsonobj) jsonobj = document.getElementById("json-obj");
    if (!datadisplay) datadisplay = document.getElementById("datadisplay");

    clear();

    switch (inputType) {
        case "base64":
            parseBase64(data);
            break;
        case "file":
            const filename = document.getElementById("filename").files;
            console.log("file:", filename[0]);
            parseFile(filename[0]);
            break;
        case "array":
            parseArray(data);
            break;
        case "hexarray":
            parseHexarray(data);
            break;
        case "ws_hexstream":
            parseWSHexStream(data);
            break;
        default:
            alert("Invalid input type: " + inputType);
    }
}

/**
 * Parse the input as filename.
 */
function parseFile(file) {
    const buff = file.arrayBuffer();
    buff.then((b) => {
        const dataView = new DataView(b);
        showParsedData(dataView);
    }).catch((e) => {
        errlog("Error parsing input: " + e.message);
        e.stack && errlog(e.stack);
    });
}

/**
 * Parse the input as base64.
 */
function parseBase64(data) {
    try {
        const buff = Base64Binary.decodeArrayBuffer(data)
        const dataView = new DataView(buff);
        showParsedData(dataView);
    } catch (e) {
        errlog("Error parsing input: " + e.message);
        e.stack && errlog(e.stack);
    }
}

/**
 * Parse the input as array.
 * Example: [1, 2, 254, 255]
 */
function parseArray(data) {
    try {
        const array = JSON.parse(data);
        const u8array = new Uint8Array(array);
        const dataView = new DataView(u8array.buffer);
        showParsedData(dataView);
    } catch (e) {
        errlog("Error parsing input: " + e.message);
        e.stack && errlog(e.stack);
    }
}

/**
 * Parse the input as hex array.
 * Example: [01, 02, fe, ff] (separator can be commas and/or space)
 */
function parseHexarray(data) {
    try {
        const trimmed = data.trim();
        if (trimmed.charAt(0) !== "[") {
            throw new Error("Data does not start with '['");
        }
        if (trimmed.charAt(trimmed.length - 1) !== "]") {
            throw new Error("Data does not end with ']'");
        }
        const inner = trimmed.substr(1, trimmed.length - 2);
        const numbers = inner
            .split(/[\s,]+/)
            .map(n => n.trim())
            .map(n => parseInt(n, 16));
        const u8array = new Uint8Array(numbers);
        const dataView = new DataView(u8array.buffer);
        showParsedData(dataView);
    } catch (e) {
        errlog("Error parsing input: " + e.message);
        e.stack && errlog(e.stack);
    }
}

/**
 * Parse the input as a WireShark Hex stream.
 * Example: 0102feff
 */
function parseWSHexStream(data) {
    try {
        const trimmed = data.trim();
        const inner = trimmed;
        const numbers = inner
            .match(/.{1,2}/g)
            .map(n => n.trim())
            .map(n => parseInt(n, 16));
        const u8array = new Uint8Array(numbers);
        const dataView = new DataView(u8array.buffer);
        showParsedData(dataView);
    } catch (e) {
        errlog("Error parsing input: " + e.message);
        e.stack && errlog(e.stack);
    }
}


function bigIntJSONReplacer(key, value) {
    return typeof value === 'bigint' ? value.toString() : value;
}

/**
 * Show the parsed data on the page.
 */
function showParsedData(dataView) {
    for (var i=0; i<dataView.byteLength; i++) {
        const byteVal = dataView.getUint8(i);
        displayByte(byteVal, i);
    }
    jsonobj.innerHTML = JSON.stringify(decode(dataView), bigIntJSONReplacer, 2);
}

// Document ready function, based on http://youmightnotneedjquery.com/
// Behaves like jQuery `$(document).ready(...)`.
function onDocumentReady(fn) {
    if (document.readyState != 'loading'){
        fn();
    } else if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        document.attachEvent('onreadystatechange', function() {
            if (document.readyState != 'loading') {
                fn();
            }
        });
    }
}

// Parse URL hash parameters into an object.
// Based on https://stackoverflow.com/a/44169651
function getHashParams() {
    var hash = window.location.hash.substr(1);
    var result = hash.split('&').reduce(function(result, item) {
        var parts = item.split('=');
        result[parts[0]] = parts[1];
        return result;
    }, {});
    return result;
}

// Decode an Urlencoded string
function urldecode(str) {
    return decodeURIComponent((str+'').replace(/\+/g, '%20'));
}

// switch file prompt field in form
function selectFilePrompt(value, idPrefix) {
    let thisSuffix;
    let thatSuffix;
    if (value == 'file') {
        thisSuffix = value;
        thatSuffix = 'data';
    } else {
        thisSuffix = 'data';
        thatSuffix = 'file';
    }
    document.getElementById(idPrefix + thisSuffix).style.display = 'inline';
    document.getElementById(idPrefix + thatSuffix).style.display = 'none';
}

onDocumentReady(function() {
    // Load initial data from URL hash
    var hashParams = getHashParams();
    console.log('hash params', hashParams);

    // Accept base64 data
    if (hashParams['base64'] !== undefined) {
        console.info('Loading base64 data from URL hash');
        var data = hashParams['base64'];
        var decoded = urldecode(data);
        document.getElementById('input-type').value = 'base64';
        document.getElementById('data').value = decoded;
    } else if (hashParams['file'] !== undefined) {
        console.info('Loading file from URL hash');
        var data = hashParams['file'];
        var decoded = urldecode(data);
        document.getElementById('input-type').value = 'file';
        document.getElementById('data').value = decoded;
    } else if (hashParams['array'] !== undefined) {
        console.info('Loading array literal data from URL hash');
        var data = hashParams['array'];
        var decoded = urldecode(data);
        document.getElementById('input-type').value = 'array';
        document.getElementById('data').value = decoded;
    } else if (hashParams['hexarray'] !== undefined) {
        console.info('Loading hexarray literal data from URL hash');
        var data = hashParams['hexarray'];
        var decoded = urldecode(data);
        document.getElementById('input-type').value = 'hexarray';
        document.getElementById('data').value = decoded;
    }
    selectFilePrompt(document.getElementById('input-type').value, 'input-wrapper-input-');
});
