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
    a.rel = position + "," + length;
    a.innerHTML = "position " + position + ": ";
    a.addEventListener("mouseover", onPositionHover);
    div.appendChild(a);
    var span = document.createElement("span");
    span.innerText = str;
    div.appendChild(span);
    logoutput.appendChild(div);
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

// javascript msgpack parsing taken from
// https://github.com/creationix/msgpack-js/blob/master/msgpack.js
// and then heavily tweaked to my needs
function decode(dataView) {
    var offset = 0;

    function map(length) {
        var value = {};
        for (var i = 0; i < length; i++) {
            var key = parse();
            value[key] = parse();
        }
        return value;
    }

    function raw(length) {
        var value = bufToString(dataView.buffer.slice(offset, offset + length));
        offset += length;
        return value;
    }

    function array(length) {
        var value = new Array(length);
        for (var i = 0; i < length; i++) {
            value[i] = parse();
        }
        return value;
    }

    function parse() {
        var type = dataView.getUint8(offset);
        var value, length;
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
            log(startOffset, offset - startOffset, "bin 8 marker with " + length + " items");
            return result;
            // bin 16
        case 0xc5:
            length = dataView.getUint16(offset + 1);
            var startOffset = offset;
            offset += 3;
            var result = raw(length);
            log(startOffset, offset - startOffset, "bin 16 marker with " + length + " items");
            return result;
            // bin 32
        case 0xc6:
            length = dataView.getUint32(offset + 1);
            var startOffset = offset;
            offset += 5;
            var result = raw(length);
            log(startOffset, offset - startOffset, "bin 32 marker with " + length + " items");
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
            // value = buffer.readUInt64BE(offset + 1);
            log(offset, 9, "uint64 marker - cannot parse uint64 to javascript, setting to Infinity");
            offset += 9;
            return Infinity;
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
            log(offset, 9, "int64 marker - cannot parse uint64 to javascript, setting to Infinity");
            offset += 9;
            return Infinity;
            // map 16
        case 0xde:
            length = dataView.getUint16(offset + 1);
            var startOffset = offset;
            offset += 3;
            var result = map(length);
            log(startOffset, offset - startOffset, "map16 marker with " + length + " items");
            return result;
            // map 32
        case 0xdf:
            length = dataView.getUint32(offset + 1);
            var startOffset = offset;
            offset += 5;
            var result = map(length);
            log(startOffset, offset - startOffset, "map32 marker with " + length + " items");
            return result;
            // array 16
        case 0xdc:
            length = dataView.getUint16(offset + 1);
            var startOffset = offset;
            offset += 3;
            var result = array(length);
            log(startOffset, offset - startOffset, "array16 marker with " + length + " items");
            return result;
            // array 32
        case 0xdd:
            length = dataView.getUint32(offset + 1);
            var startOffset = offset;
            offset += 5;
            var result = array(length);
            log(startOffset, offset - startOffset, "array32 marker with " + length + " items");
            return result;
            // raw 8
        case 0xd9:
            length = dataView.getUint8(offset + 1);
            var startOffset = offset;
            offset += 2;
            var result = raw(length);
            log(startOffset, offset - startOffset, "raw8 marker - " + result);
            return result;
            // raw 16
        case 0xda:
            length = dataView.getUint16(offset + 1);
            var startOffset = offset;
            offset += 3;
            var result = raw(length);
            log(startOffset, offset - startOffset, "raw16 marker - " + result);
            return result;
            // raw 32
        case 0xdb:
            length = dataView.getUint32(offset + 1);
            var startOffset = offset;
            offset += 5;
            var result = raw(length);
            log(startOffset, offset - startOffset, "raw32 marker - " + result);
            return result;
        }
        // FixRaw
        if ((type & 0xe0) === 0xa0) {
            length = type & 0x1f;
            var startOffset = offset;
            offset++;
            var result = raw(length);
            log(startOffset, offset - startOffset, "fixed length raw marker - " + result);
            return result;
        }
        // FixMap
        if ((type & 0xf0) === 0x80) {
            length = type & 0x0f;
            var startOffset = offset;
            offset++;
            var result = map(length);
            log(startOffset, offset - startOffset, "fixed length map marker with " + length + " items");
            return result;
        }
        // FixArray
        if ((type & 0xf0) === 0x90) {
            length = type & 0x0f;
            var startOffset = offset;
            offset++;
            var result = array(length);
            log(startOffset, offset - startOffset, "fixed length array marker with " + length + " items");
            return result;
        }
        // Positive FixNum
        if ((type & 0x80) === 0x00) {
            log(offset, 1, "postive fix length number with value " + type);
            offset++;
            return type;
        }
        // Negative Fixnum
        if ((type & 0xe0) === 0xe0) {
            value = dataView.getInt8(offset);
            log(offset, 1, "negative fix length number with value " + value);
            offset++;
            return value;
        }
        throw new Error("Unknown type 0x" + type.toString(16));
    }
    var value = parse();
    if (offset !== dataView.byteLength) {
        var overflow = dataView.byteLength - offset;
        errlog(overflow + " trailing bytes");
        var remainBytes = dataView.buffer.slice(offset, overflow);
        errlog("trailing chars: " + raw(overflow));
    }
    return value;
}

var outputscroller;
function parseBase64() {
    if (!logoutput) {
        logoutput = document.getElementById("log");
    }
    if (!jsonobj) {
        jsonobj = document.getElementById("json-obj");
    }
    if(!datadisplay) {
        datadisplay = document.getElementById("datadisplay");
    }
    if(!outputscroller) {
        outputscroller = document.getElementById("output");
    }
    clear();
    var input = document.getElementById("data").value;
    var buff = null;
    try {
        buff = Base64Binary.decodeArrayBuffer(input);
        var dataView = new DataView(buff);
        for(var i=0, ii=dataView.byteLength; i<ii; i++) {
            var byteVal = dataView.getUint8(i);
            displayByte(byteVal, i);
        }
        jsonobj.innerHTML = JSON.stringify(decode(dataView));
    } catch (e) {
        errlog("Error parsing input: " + e.message);
        e.stack && errlog(e.stack);
    }
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

onDocumentReady(function() {
    // Load initial data from URL hash
    var hashParams = getHashParams();
    console.log('Hash params:', hashParams);

    // Accept base64 data
    if (hashParams['base64'] !== undefined) {
        console.info('Loading base64 data from URL hash');
        var data = hashParams['base64'];
        var decoded = urldecode(data);
        document.getElementById("data").value = decoded;
    }
});
