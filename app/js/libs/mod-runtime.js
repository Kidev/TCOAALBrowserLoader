"use strict";
var ModRuntime = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require2() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // node_modules/base64-js/index.js
  var require_base64_js = __commonJS({
    "node_modules/base64-js/index.js"(exports) {
      "use strict";
      init_shim();
      exports.byteLength = byteLength;
      exports.toByteArray = toByteArray;
      exports.fromByteArray = fromByteArray;
      var lookup = [];
      var revLookup = [];
      var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
      var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      for (i = 0, len = code.length; i < len; ++i) {
        lookup[i] = code[i];
        revLookup[code.charCodeAt(i)] = i;
      }
      var i;
      var len;
      revLookup["-".charCodeAt(0)] = 62;
      revLookup["_".charCodeAt(0)] = 63;
      function getLens(b64) {
        var len2 = b64.length;
        if (len2 % 4 > 0) {
          throw new Error("Invalid string. Length must be a multiple of 4");
        }
        var validLen = b64.indexOf("=");
        if (validLen === -1) validLen = len2;
        var placeHoldersLen = validLen === len2 ? 0 : 4 - validLen % 4;
        return [validLen, placeHoldersLen];
      }
      function byteLength(b64) {
        var lens = getLens(b64);
        var validLen = lens[0];
        var placeHoldersLen = lens[1];
        return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
      }
      function _byteLength(b64, validLen, placeHoldersLen) {
        return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
      }
      function toByteArray(b64) {
        var tmp;
        var lens = getLens(b64);
        var validLen = lens[0];
        var placeHoldersLen = lens[1];
        var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
        var curByte = 0;
        var len2 = placeHoldersLen > 0 ? validLen - 4 : validLen;
        var i2;
        for (i2 = 0; i2 < len2; i2 += 4) {
          tmp = revLookup[b64.charCodeAt(i2)] << 18 | revLookup[b64.charCodeAt(i2 + 1)] << 12 | revLookup[b64.charCodeAt(i2 + 2)] << 6 | revLookup[b64.charCodeAt(i2 + 3)];
          arr[curByte++] = tmp >> 16 & 255;
          arr[curByte++] = tmp >> 8 & 255;
          arr[curByte++] = tmp & 255;
        }
        if (placeHoldersLen === 2) {
          tmp = revLookup[b64.charCodeAt(i2)] << 2 | revLookup[b64.charCodeAt(i2 + 1)] >> 4;
          arr[curByte++] = tmp & 255;
        }
        if (placeHoldersLen === 1) {
          tmp = revLookup[b64.charCodeAt(i2)] << 10 | revLookup[b64.charCodeAt(i2 + 1)] << 4 | revLookup[b64.charCodeAt(i2 + 2)] >> 2;
          arr[curByte++] = tmp >> 8 & 255;
          arr[curByte++] = tmp & 255;
        }
        return arr;
      }
      function tripletToBase64(num) {
        return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
      }
      function encodeChunk(uint8, start, end) {
        var tmp;
        var output = [];
        for (var i2 = start; i2 < end; i2 += 3) {
          tmp = (uint8[i2] << 16 & 16711680) + (uint8[i2 + 1] << 8 & 65280) + (uint8[i2 + 2] & 255);
          output.push(tripletToBase64(tmp));
        }
        return output.join("");
      }
      function fromByteArray(uint8) {
        var tmp;
        var len2 = uint8.length;
        var extraBytes = len2 % 3;
        var parts = [];
        var maxChunkLength = 16383;
        for (var i2 = 0, len22 = len2 - extraBytes; i2 < len22; i2 += maxChunkLength) {
          parts.push(encodeChunk(uint8, i2, i2 + maxChunkLength > len22 ? len22 : i2 + maxChunkLength));
        }
        if (extraBytes === 1) {
          tmp = uint8[len2 - 1];
          parts.push(
            lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "=="
          );
        } else if (extraBytes === 2) {
          tmp = (uint8[len2 - 2] << 8) + uint8[len2 - 1];
          parts.push(
            lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "="
          );
        }
        return parts.join("");
      }
    }
  });

  // node_modules/ieee754/index.js
  var require_ieee754 = __commonJS({
    "node_modules/ieee754/index.js"(exports) {
      init_shim();
      exports.read = function(buffer, offset, isLE, mLen, nBytes) {
        var e, m;
        var eLen = nBytes * 8 - mLen - 1;
        var eMax = (1 << eLen) - 1;
        var eBias = eMax >> 1;
        var nBits = -7;
        var i = isLE ? nBytes - 1 : 0;
        var d = isLE ? -1 : 1;
        var s = buffer[offset + i];
        i += d;
        e = s & (1 << -nBits) - 1;
        s >>= -nBits;
        nBits += eLen;
        for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {
        }
        m = e & (1 << -nBits) - 1;
        e >>= -nBits;
        nBits += mLen;
        for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {
        }
        if (e === 0) {
          e = 1 - eBias;
        } else if (e === eMax) {
          return m ? NaN : (s ? -1 : 1) * Infinity;
        } else {
          m = m + Math.pow(2, mLen);
          e = e - eBias;
        }
        return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
      };
      exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
        var e, m, c;
        var eLen = nBytes * 8 - mLen - 1;
        var eMax = (1 << eLen) - 1;
        var eBias = eMax >> 1;
        var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
        var i = isLE ? 0 : nBytes - 1;
        var d = isLE ? 1 : -1;
        var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
        value = Math.abs(value);
        if (isNaN(value) || value === Infinity) {
          m = isNaN(value) ? 1 : 0;
          e = eMax;
        } else {
          e = Math.floor(Math.log(value) / Math.LN2);
          if (value * (c = Math.pow(2, -e)) < 1) {
            e--;
            c *= 2;
          }
          if (e + eBias >= 1) {
            value += rt / c;
          } else {
            value += rt * Math.pow(2, 1 - eBias);
          }
          if (value * c >= 2) {
            e++;
            c /= 2;
          }
          if (e + eBias >= eMax) {
            m = 0;
            e = eMax;
          } else if (e + eBias >= 1) {
            m = (value * c - 1) * Math.pow(2, mLen);
            e = e + eBias;
          } else {
            m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
            e = 0;
          }
        }
        for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8) {
        }
        e = e << mLen | m;
        eLen += mLen;
        for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {
        }
        buffer[offset + i - d] |= s * 128;
      };
    }
  });

  // node_modules/buffer/index.js
  var require_buffer = __commonJS({
    "node_modules/buffer/index.js"(exports) {
      "use strict";
      init_shim();
      var base64 = require_base64_js();
      var ieee754 = require_ieee754();
      var customInspectSymbol = typeof Symbol === "function" && typeof Symbol["for"] === "function" ? Symbol["for"]("nodejs.util.inspect.custom") : null;
      exports.Buffer = Buffer3;
      exports.SlowBuffer = SlowBuffer;
      exports.INSPECT_MAX_BYTES = 50;
      var K_MAX_LENGTH = 2147483647;
      exports.kMaxLength = K_MAX_LENGTH;
      Buffer3.TYPED_ARRAY_SUPPORT = typedArraySupport();
      if (!Buffer3.TYPED_ARRAY_SUPPORT && typeof console !== "undefined" && typeof console.error === "function") {
        console.error(
          "This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."
        );
      }
      function typedArraySupport() {
        try {
          var arr = new Uint8Array(1);
          var proto = { foo: function() {
            return 42;
          } };
          Object.setPrototypeOf(proto, Uint8Array.prototype);
          Object.setPrototypeOf(arr, proto);
          return arr.foo() === 42;
        } catch (e) {
          return false;
        }
      }
      Object.defineProperty(Buffer3.prototype, "parent", {
        enumerable: true,
        get: function() {
          if (!Buffer3.isBuffer(this)) return void 0;
          return this.buffer;
        }
      });
      Object.defineProperty(Buffer3.prototype, "offset", {
        enumerable: true,
        get: function() {
          if (!Buffer3.isBuffer(this)) return void 0;
          return this.byteOffset;
        }
      });
      function createBuffer(length) {
        if (length > K_MAX_LENGTH) {
          throw new RangeError('The value "' + length + '" is invalid for option "size"');
        }
        var buf = new Uint8Array(length);
        Object.setPrototypeOf(buf, Buffer3.prototype);
        return buf;
      }
      function Buffer3(arg, encodingOrOffset, length) {
        if (typeof arg === "number") {
          if (typeof encodingOrOffset === "string") {
            throw new TypeError(
              'The "string" argument must be of type string. Received type number'
            );
          }
          return allocUnsafe(arg);
        }
        return from(arg, encodingOrOffset, length);
      }
      Buffer3.poolSize = 8192;
      function from(value, encodingOrOffset, length) {
        if (typeof value === "string") {
          return fromString(value, encodingOrOffset);
        }
        if (ArrayBuffer.isView(value)) {
          return fromArrayView(value);
        }
        if (value == null) {
          throw new TypeError(
            "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
          );
        }
        if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) {
          return fromArrayBuffer(value, encodingOrOffset, length);
        }
        if (typeof SharedArrayBuffer !== "undefined" && (isInstance(value, SharedArrayBuffer) || value && isInstance(value.buffer, SharedArrayBuffer))) {
          return fromArrayBuffer(value, encodingOrOffset, length);
        }
        if (typeof value === "number") {
          throw new TypeError(
            'The "value" argument must not be of type number. Received type number'
          );
        }
        var valueOf = value.valueOf && value.valueOf();
        if (valueOf != null && valueOf !== value) {
          return Buffer3.from(valueOf, encodingOrOffset, length);
        }
        var b = fromObject(value);
        if (b) return b;
        if (typeof Symbol !== "undefined" && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === "function") {
          return Buffer3.from(
            value[Symbol.toPrimitive]("string"),
            encodingOrOffset,
            length
          );
        }
        throw new TypeError(
          "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
        );
      }
      Buffer3.from = function(value, encodingOrOffset, length) {
        return from(value, encodingOrOffset, length);
      };
      Object.setPrototypeOf(Buffer3.prototype, Uint8Array.prototype);
      Object.setPrototypeOf(Buffer3, Uint8Array);
      function assertSize(size) {
        if (typeof size !== "number") {
          throw new TypeError('"size" argument must be of type number');
        } else if (size < 0) {
          throw new RangeError('The value "' + size + '" is invalid for option "size"');
        }
      }
      function alloc(size, fill, encoding) {
        assertSize(size);
        if (size <= 0) {
          return createBuffer(size);
        }
        if (fill !== void 0) {
          return typeof encoding === "string" ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
        }
        return createBuffer(size);
      }
      Buffer3.alloc = function(size, fill, encoding) {
        return alloc(size, fill, encoding);
      };
      function allocUnsafe(size) {
        assertSize(size);
        return createBuffer(size < 0 ? 0 : checked(size) | 0);
      }
      Buffer3.allocUnsafe = function(size) {
        return allocUnsafe(size);
      };
      Buffer3.allocUnsafeSlow = function(size) {
        return allocUnsafe(size);
      };
      function fromString(string, encoding) {
        if (typeof encoding !== "string" || encoding === "") {
          encoding = "utf8";
        }
        if (!Buffer3.isEncoding(encoding)) {
          throw new TypeError("Unknown encoding: " + encoding);
        }
        var length = byteLength(string, encoding) | 0;
        var buf = createBuffer(length);
        var actual = buf.write(string, encoding);
        if (actual !== length) {
          buf = buf.slice(0, actual);
        }
        return buf;
      }
      function fromArrayLike(array) {
        var length = array.length < 0 ? 0 : checked(array.length) | 0;
        var buf = createBuffer(length);
        for (var i = 0; i < length; i += 1) {
          buf[i] = array[i] & 255;
        }
        return buf;
      }
      function fromArrayView(arrayView) {
        if (isInstance(arrayView, Uint8Array)) {
          var copy = new Uint8Array(arrayView);
          return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
        }
        return fromArrayLike(arrayView);
      }
      function fromArrayBuffer(array, byteOffset, length) {
        if (byteOffset < 0 || array.byteLength < byteOffset) {
          throw new RangeError('"offset" is outside of buffer bounds');
        }
        if (array.byteLength < byteOffset + (length || 0)) {
          throw new RangeError('"length" is outside of buffer bounds');
        }
        var buf;
        if (byteOffset === void 0 && length === void 0) {
          buf = new Uint8Array(array);
        } else if (length === void 0) {
          buf = new Uint8Array(array, byteOffset);
        } else {
          buf = new Uint8Array(array, byteOffset, length);
        }
        Object.setPrototypeOf(buf, Buffer3.prototype);
        return buf;
      }
      function fromObject(obj) {
        if (Buffer3.isBuffer(obj)) {
          var len = checked(obj.length) | 0;
          var buf = createBuffer(len);
          if (buf.length === 0) {
            return buf;
          }
          obj.copy(buf, 0, 0, len);
          return buf;
        }
        if (obj.length !== void 0) {
          if (typeof obj.length !== "number" || numberIsNaN(obj.length)) {
            return createBuffer(0);
          }
          return fromArrayLike(obj);
        }
        if (obj.type === "Buffer" && Array.isArray(obj.data)) {
          return fromArrayLike(obj.data);
        }
      }
      function checked(length) {
        if (length >= K_MAX_LENGTH) {
          throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + K_MAX_LENGTH.toString(16) + " bytes");
        }
        return length | 0;
      }
      function SlowBuffer(length) {
        if (+length != length) {
          length = 0;
        }
        return Buffer3.alloc(+length);
      }
      Buffer3.isBuffer = function isBuffer(b) {
        return b != null && b._isBuffer === true && b !== Buffer3.prototype;
      };
      Buffer3.compare = function compare(a, b) {
        if (isInstance(a, Uint8Array)) a = Buffer3.from(a, a.offset, a.byteLength);
        if (isInstance(b, Uint8Array)) b = Buffer3.from(b, b.offset, b.byteLength);
        if (!Buffer3.isBuffer(a) || !Buffer3.isBuffer(b)) {
          throw new TypeError(
            'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
          );
        }
        if (a === b) return 0;
        var x = a.length;
        var y = b.length;
        for (var i = 0, len = Math.min(x, y); i < len; ++i) {
          if (a[i] !== b[i]) {
            x = a[i];
            y = b[i];
            break;
          }
        }
        if (x < y) return -1;
        if (y < x) return 1;
        return 0;
      };
      Buffer3.isEncoding = function isEncoding(encoding) {
        switch (String(encoding).toLowerCase()) {
          case "hex":
          case "utf8":
          case "utf-8":
          case "ascii":
          case "latin1":
          case "binary":
          case "base64":
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return true;
          default:
            return false;
        }
      };
      Buffer3.concat = function concat(list, length) {
        if (!Array.isArray(list)) {
          throw new TypeError('"list" argument must be an Array of Buffers');
        }
        if (list.length === 0) {
          return Buffer3.alloc(0);
        }
        var i;
        if (length === void 0) {
          length = 0;
          for (i = 0; i < list.length; ++i) {
            length += list[i].length;
          }
        }
        var buffer = Buffer3.allocUnsafe(length);
        var pos = 0;
        for (i = 0; i < list.length; ++i) {
          var buf = list[i];
          if (isInstance(buf, Uint8Array)) {
            if (pos + buf.length > buffer.length) {
              Buffer3.from(buf).copy(buffer, pos);
            } else {
              Uint8Array.prototype.set.call(
                buffer,
                buf,
                pos
              );
            }
          } else if (!Buffer3.isBuffer(buf)) {
            throw new TypeError('"list" argument must be an Array of Buffers');
          } else {
            buf.copy(buffer, pos);
          }
          pos += buf.length;
        }
        return buffer;
      };
      function byteLength(string, encoding) {
        if (Buffer3.isBuffer(string)) {
          return string.length;
        }
        if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
          return string.byteLength;
        }
        if (typeof string !== "string") {
          throw new TypeError(
            'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof string
          );
        }
        var len = string.length;
        var mustMatch = arguments.length > 2 && arguments[2] === true;
        if (!mustMatch && len === 0) return 0;
        var loweredCase = false;
        for (; ; ) {
          switch (encoding) {
            case "ascii":
            case "latin1":
            case "binary":
              return len;
            case "utf8":
            case "utf-8":
              return utf8ToBytes(string).length;
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return len * 2;
            case "hex":
              return len >>> 1;
            case "base64":
              return base64ToBytes(string).length;
            default:
              if (loweredCase) {
                return mustMatch ? -1 : utf8ToBytes(string).length;
              }
              encoding = ("" + encoding).toLowerCase();
              loweredCase = true;
          }
        }
      }
      Buffer3.byteLength = byteLength;
      function slowToString(encoding, start, end) {
        var loweredCase = false;
        if (start === void 0 || start < 0) {
          start = 0;
        }
        if (start > this.length) {
          return "";
        }
        if (end === void 0 || end > this.length) {
          end = this.length;
        }
        if (end <= 0) {
          return "";
        }
        end >>>= 0;
        start >>>= 0;
        if (end <= start) {
          return "";
        }
        if (!encoding) encoding = "utf8";
        while (true) {
          switch (encoding) {
            case "hex":
              return hexSlice(this, start, end);
            case "utf8":
            case "utf-8":
              return utf8Slice(this, start, end);
            case "ascii":
              return asciiSlice(this, start, end);
            case "latin1":
            case "binary":
              return latin1Slice(this, start, end);
            case "base64":
              return base64Slice(this, start, end);
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return utf16leSlice(this, start, end);
            default:
              if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
              encoding = (encoding + "").toLowerCase();
              loweredCase = true;
          }
        }
      }
      Buffer3.prototype._isBuffer = true;
      function swap(b, n, m) {
        var i = b[n];
        b[n] = b[m];
        b[m] = i;
      }
      Buffer3.prototype.swap16 = function swap16() {
        var len = this.length;
        if (len % 2 !== 0) {
          throw new RangeError("Buffer size must be a multiple of 16-bits");
        }
        for (var i = 0; i < len; i += 2) {
          swap(this, i, i + 1);
        }
        return this;
      };
      Buffer3.prototype.swap32 = function swap32() {
        var len = this.length;
        if (len % 4 !== 0) {
          throw new RangeError("Buffer size must be a multiple of 32-bits");
        }
        for (var i = 0; i < len; i += 4) {
          swap(this, i, i + 3);
          swap(this, i + 1, i + 2);
        }
        return this;
      };
      Buffer3.prototype.swap64 = function swap64() {
        var len = this.length;
        if (len % 8 !== 0) {
          throw new RangeError("Buffer size must be a multiple of 64-bits");
        }
        for (var i = 0; i < len; i += 8) {
          swap(this, i, i + 7);
          swap(this, i + 1, i + 6);
          swap(this, i + 2, i + 5);
          swap(this, i + 3, i + 4);
        }
        return this;
      };
      Buffer3.prototype.toString = function toString() {
        var length = this.length;
        if (length === 0) return "";
        if (arguments.length === 0) return utf8Slice(this, 0, length);
        return slowToString.apply(this, arguments);
      };
      Buffer3.prototype.toLocaleString = Buffer3.prototype.toString;
      Buffer3.prototype.equals = function equals(b) {
        if (!Buffer3.isBuffer(b)) throw new TypeError("Argument must be a Buffer");
        if (this === b) return true;
        return Buffer3.compare(this, b) === 0;
      };
      Buffer3.prototype.inspect = function inspect() {
        var str = "";
        var max = exports.INSPECT_MAX_BYTES;
        str = this.toString("hex", 0, max).replace(/(.{2})/g, "$1 ").trim();
        if (this.length > max) str += " ... ";
        return "<Buffer " + str + ">";
      };
      if (customInspectSymbol) {
        Buffer3.prototype[customInspectSymbol] = Buffer3.prototype.inspect;
      }
      Buffer3.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
        if (isInstance(target, Uint8Array)) {
          target = Buffer3.from(target, target.offset, target.byteLength);
        }
        if (!Buffer3.isBuffer(target)) {
          throw new TypeError(
            'The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof target
          );
        }
        if (start === void 0) {
          start = 0;
        }
        if (end === void 0) {
          end = target ? target.length : 0;
        }
        if (thisStart === void 0) {
          thisStart = 0;
        }
        if (thisEnd === void 0) {
          thisEnd = this.length;
        }
        if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
          throw new RangeError("out of range index");
        }
        if (thisStart >= thisEnd && start >= end) {
          return 0;
        }
        if (thisStart >= thisEnd) {
          return -1;
        }
        if (start >= end) {
          return 1;
        }
        start >>>= 0;
        end >>>= 0;
        thisStart >>>= 0;
        thisEnd >>>= 0;
        if (this === target) return 0;
        var x = thisEnd - thisStart;
        var y = end - start;
        var len = Math.min(x, y);
        var thisCopy = this.slice(thisStart, thisEnd);
        var targetCopy = target.slice(start, end);
        for (var i = 0; i < len; ++i) {
          if (thisCopy[i] !== targetCopy[i]) {
            x = thisCopy[i];
            y = targetCopy[i];
            break;
          }
        }
        if (x < y) return -1;
        if (y < x) return 1;
        return 0;
      };
      function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
        if (buffer.length === 0) return -1;
        if (typeof byteOffset === "string") {
          encoding = byteOffset;
          byteOffset = 0;
        } else if (byteOffset > 2147483647) {
          byteOffset = 2147483647;
        } else if (byteOffset < -2147483648) {
          byteOffset = -2147483648;
        }
        byteOffset = +byteOffset;
        if (numberIsNaN(byteOffset)) {
          byteOffset = dir ? 0 : buffer.length - 1;
        }
        if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
        if (byteOffset >= buffer.length) {
          if (dir) return -1;
          else byteOffset = buffer.length - 1;
        } else if (byteOffset < 0) {
          if (dir) byteOffset = 0;
          else return -1;
        }
        if (typeof val === "string") {
          val = Buffer3.from(val, encoding);
        }
        if (Buffer3.isBuffer(val)) {
          if (val.length === 0) {
            return -1;
          }
          return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
        } else if (typeof val === "number") {
          val = val & 255;
          if (typeof Uint8Array.prototype.indexOf === "function") {
            if (dir) {
              return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
            } else {
              return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
            }
          }
          return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
        }
        throw new TypeError("val must be string, number or Buffer");
      }
      function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
        var indexSize = 1;
        var arrLength = arr.length;
        var valLength = val.length;
        if (encoding !== void 0) {
          encoding = String(encoding).toLowerCase();
          if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
            if (arr.length < 2 || val.length < 2) {
              return -1;
            }
            indexSize = 2;
            arrLength /= 2;
            valLength /= 2;
            byteOffset /= 2;
          }
        }
        function read(buf, i2) {
          if (indexSize === 1) {
            return buf[i2];
          } else {
            return buf.readUInt16BE(i2 * indexSize);
          }
        }
        var i;
        if (dir) {
          var foundIndex = -1;
          for (i = byteOffset; i < arrLength; i++) {
            if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
              if (foundIndex === -1) foundIndex = i;
              if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
            } else {
              if (foundIndex !== -1) i -= i - foundIndex;
              foundIndex = -1;
            }
          }
        } else {
          if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
          for (i = byteOffset; i >= 0; i--) {
            var found = true;
            for (var j = 0; j < valLength; j++) {
              if (read(arr, i + j) !== read(val, j)) {
                found = false;
                break;
              }
            }
            if (found) return i;
          }
        }
        return -1;
      }
      Buffer3.prototype.includes = function includes(val, byteOffset, encoding) {
        return this.indexOf(val, byteOffset, encoding) !== -1;
      };
      Buffer3.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
        return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
      };
      Buffer3.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
        return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
      };
      function hexWrite(buf, string, offset, length) {
        offset = Number(offset) || 0;
        var remaining = buf.length - offset;
        if (!length) {
          length = remaining;
        } else {
          length = Number(length);
          if (length > remaining) {
            length = remaining;
          }
        }
        var strLen = string.length;
        if (length > strLen / 2) {
          length = strLen / 2;
        }
        for (var i = 0; i < length; ++i) {
          var parsed = parseInt(string.substr(i * 2, 2), 16);
          if (numberIsNaN(parsed)) return i;
          buf[offset + i] = parsed;
        }
        return i;
      }
      function utf8Write(buf, string, offset, length) {
        return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
      }
      function asciiWrite(buf, string, offset, length) {
        return blitBuffer(asciiToBytes(string), buf, offset, length);
      }
      function base64Write(buf, string, offset, length) {
        return blitBuffer(base64ToBytes(string), buf, offset, length);
      }
      function ucs2Write(buf, string, offset, length) {
        return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
      }
      Buffer3.prototype.write = function write(string, offset, length, encoding) {
        if (offset === void 0) {
          encoding = "utf8";
          length = this.length;
          offset = 0;
        } else if (length === void 0 && typeof offset === "string") {
          encoding = offset;
          length = this.length;
          offset = 0;
        } else if (isFinite(offset)) {
          offset = offset >>> 0;
          if (isFinite(length)) {
            length = length >>> 0;
            if (encoding === void 0) encoding = "utf8";
          } else {
            encoding = length;
            length = void 0;
          }
        } else {
          throw new Error(
            "Buffer.write(string, encoding, offset[, length]) is no longer supported"
          );
        }
        var remaining = this.length - offset;
        if (length === void 0 || length > remaining) length = remaining;
        if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
          throw new RangeError("Attempt to write outside buffer bounds");
        }
        if (!encoding) encoding = "utf8";
        var loweredCase = false;
        for (; ; ) {
          switch (encoding) {
            case "hex":
              return hexWrite(this, string, offset, length);
            case "utf8":
            case "utf-8":
              return utf8Write(this, string, offset, length);
            case "ascii":
            case "latin1":
            case "binary":
              return asciiWrite(this, string, offset, length);
            case "base64":
              return base64Write(this, string, offset, length);
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return ucs2Write(this, string, offset, length);
            default:
              if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
              encoding = ("" + encoding).toLowerCase();
              loweredCase = true;
          }
        }
      };
      Buffer3.prototype.toJSON = function toJSON() {
        return {
          type: "Buffer",
          data: Array.prototype.slice.call(this._arr || this, 0)
        };
      };
      function base64Slice(buf, start, end) {
        if (start === 0 && end === buf.length) {
          return base64.fromByteArray(buf);
        } else {
          return base64.fromByteArray(buf.slice(start, end));
        }
      }
      function utf8Slice(buf, start, end) {
        end = Math.min(buf.length, end);
        var res = [];
        var i = start;
        while (i < end) {
          var firstByte = buf[i];
          var codePoint = null;
          var bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
          if (i + bytesPerSequence <= end) {
            var secondByte, thirdByte, fourthByte, tempCodePoint;
            switch (bytesPerSequence) {
              case 1:
                if (firstByte < 128) {
                  codePoint = firstByte;
                }
                break;
              case 2:
                secondByte = buf[i + 1];
                if ((secondByte & 192) === 128) {
                  tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
                  if (tempCodePoint > 127) {
                    codePoint = tempCodePoint;
                  }
                }
                break;
              case 3:
                secondByte = buf[i + 1];
                thirdByte = buf[i + 2];
                if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
                  tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
                  if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
                    codePoint = tempCodePoint;
                  }
                }
                break;
              case 4:
                secondByte = buf[i + 1];
                thirdByte = buf[i + 2];
                fourthByte = buf[i + 3];
                if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
                  tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
                  if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
                    codePoint = tempCodePoint;
                  }
                }
            }
          }
          if (codePoint === null) {
            codePoint = 65533;
            bytesPerSequence = 1;
          } else if (codePoint > 65535) {
            codePoint -= 65536;
            res.push(codePoint >>> 10 & 1023 | 55296);
            codePoint = 56320 | codePoint & 1023;
          }
          res.push(codePoint);
          i += bytesPerSequence;
        }
        return decodeCodePointsArray(res);
      }
      var MAX_ARGUMENTS_LENGTH = 4096;
      function decodeCodePointsArray(codePoints) {
        var len = codePoints.length;
        if (len <= MAX_ARGUMENTS_LENGTH) {
          return String.fromCharCode.apply(String, codePoints);
        }
        var res = "";
        var i = 0;
        while (i < len) {
          res += String.fromCharCode.apply(
            String,
            codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
          );
        }
        return res;
      }
      function asciiSlice(buf, start, end) {
        var ret = "";
        end = Math.min(buf.length, end);
        for (var i = start; i < end; ++i) {
          ret += String.fromCharCode(buf[i] & 127);
        }
        return ret;
      }
      function latin1Slice(buf, start, end) {
        var ret = "";
        end = Math.min(buf.length, end);
        for (var i = start; i < end; ++i) {
          ret += String.fromCharCode(buf[i]);
        }
        return ret;
      }
      function hexSlice(buf, start, end) {
        var len = buf.length;
        if (!start || start < 0) start = 0;
        if (!end || end < 0 || end > len) end = len;
        var out = "";
        for (var i = start; i < end; ++i) {
          out += hexSliceLookupTable[buf[i]];
        }
        return out;
      }
      function utf16leSlice(buf, start, end) {
        var bytes = buf.slice(start, end);
        var res = "";
        for (var i = 0; i < bytes.length - 1; i += 2) {
          res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
        }
        return res;
      }
      Buffer3.prototype.slice = function slice(start, end) {
        var len = this.length;
        start = ~~start;
        end = end === void 0 ? len : ~~end;
        if (start < 0) {
          start += len;
          if (start < 0) start = 0;
        } else if (start > len) {
          start = len;
        }
        if (end < 0) {
          end += len;
          if (end < 0) end = 0;
        } else if (end > len) {
          end = len;
        }
        if (end < start) end = start;
        var newBuf = this.subarray(start, end);
        Object.setPrototypeOf(newBuf, Buffer3.prototype);
        return newBuf;
      };
      function checkOffset(offset, ext, length) {
        if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
        if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
      }
      Buffer3.prototype.readUintLE = Buffer3.prototype.readUIntLE = function readUIntLE(offset, byteLength2, noAssert) {
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) checkOffset(offset, byteLength2, this.length);
        var val = this[offset];
        var mul = 1;
        var i = 0;
        while (++i < byteLength2 && (mul *= 256)) {
          val += this[offset + i] * mul;
        }
        return val;
      };
      Buffer3.prototype.readUintBE = Buffer3.prototype.readUIntBE = function readUIntBE(offset, byteLength2, noAssert) {
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) {
          checkOffset(offset, byteLength2, this.length);
        }
        var val = this[offset + --byteLength2];
        var mul = 1;
        while (byteLength2 > 0 && (mul *= 256)) {
          val += this[offset + --byteLength2] * mul;
        }
        return val;
      };
      Buffer3.prototype.readUint8 = Buffer3.prototype.readUInt8 = function readUInt8(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 1, this.length);
        return this[offset];
      };
      Buffer3.prototype.readUint16LE = Buffer3.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        return this[offset] | this[offset + 1] << 8;
      };
      Buffer3.prototype.readUint16BE = Buffer3.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        return this[offset] << 8 | this[offset + 1];
      };
      Buffer3.prototype.readUint32LE = Buffer3.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
      };
      Buffer3.prototype.readUint32BE = Buffer3.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
      };
      Buffer3.prototype.readIntLE = function readIntLE(offset, byteLength2, noAssert) {
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) checkOffset(offset, byteLength2, this.length);
        var val = this[offset];
        var mul = 1;
        var i = 0;
        while (++i < byteLength2 && (mul *= 256)) {
          val += this[offset + i] * mul;
        }
        mul *= 128;
        if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
        return val;
      };
      Buffer3.prototype.readIntBE = function readIntBE(offset, byteLength2, noAssert) {
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) checkOffset(offset, byteLength2, this.length);
        var i = byteLength2;
        var mul = 1;
        var val = this[offset + --i];
        while (i > 0 && (mul *= 256)) {
          val += this[offset + --i] * mul;
        }
        mul *= 128;
        if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
        return val;
      };
      Buffer3.prototype.readInt8 = function readInt8(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 1, this.length);
        if (!(this[offset] & 128)) return this[offset];
        return (255 - this[offset] + 1) * -1;
      };
      Buffer3.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        var val = this[offset] | this[offset + 1] << 8;
        return val & 32768 ? val | 4294901760 : val;
      };
      Buffer3.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        var val = this[offset + 1] | this[offset] << 8;
        return val & 32768 ? val | 4294901760 : val;
      };
      Buffer3.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
      };
      Buffer3.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
      };
      Buffer3.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return ieee754.read(this, offset, true, 23, 4);
      };
      Buffer3.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return ieee754.read(this, offset, false, 23, 4);
      };
      Buffer3.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 8, this.length);
        return ieee754.read(this, offset, true, 52, 8);
      };
      Buffer3.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 8, this.length);
        return ieee754.read(this, offset, false, 52, 8);
      };
      function checkInt(buf, value, offset, ext, max, min) {
        if (!Buffer3.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
        if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
        if (offset + ext > buf.length) throw new RangeError("Index out of range");
      }
      Buffer3.prototype.writeUintLE = Buffer3.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength2, noAssert) {
        value = +value;
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) {
          var maxBytes = Math.pow(2, 8 * byteLength2) - 1;
          checkInt(this, value, offset, byteLength2, maxBytes, 0);
        }
        var mul = 1;
        var i = 0;
        this[offset] = value & 255;
        while (++i < byteLength2 && (mul *= 256)) {
          this[offset + i] = value / mul & 255;
        }
        return offset + byteLength2;
      };
      Buffer3.prototype.writeUintBE = Buffer3.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength2, noAssert) {
        value = +value;
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) {
          var maxBytes = Math.pow(2, 8 * byteLength2) - 1;
          checkInt(this, value, offset, byteLength2, maxBytes, 0);
        }
        var i = byteLength2 - 1;
        var mul = 1;
        this[offset + i] = value & 255;
        while (--i >= 0 && (mul *= 256)) {
          this[offset + i] = value / mul & 255;
        }
        return offset + byteLength2;
      };
      Buffer3.prototype.writeUint8 = Buffer3.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 1, 255, 0);
        this[offset] = value & 255;
        return offset + 1;
      };
      Buffer3.prototype.writeUint16LE = Buffer3.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
        this[offset] = value & 255;
        this[offset + 1] = value >>> 8;
        return offset + 2;
      };
      Buffer3.prototype.writeUint16BE = Buffer3.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
        this[offset] = value >>> 8;
        this[offset + 1] = value & 255;
        return offset + 2;
      };
      Buffer3.prototype.writeUint32LE = Buffer3.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
        this[offset + 3] = value >>> 24;
        this[offset + 2] = value >>> 16;
        this[offset + 1] = value >>> 8;
        this[offset] = value & 255;
        return offset + 4;
      };
      Buffer3.prototype.writeUint32BE = Buffer3.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
        this[offset] = value >>> 24;
        this[offset + 1] = value >>> 16;
        this[offset + 2] = value >>> 8;
        this[offset + 3] = value & 255;
        return offset + 4;
      };
      Buffer3.prototype.writeIntLE = function writeIntLE(value, offset, byteLength2, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          var limit = Math.pow(2, 8 * byteLength2 - 1);
          checkInt(this, value, offset, byteLength2, limit - 1, -limit);
        }
        var i = 0;
        var mul = 1;
        var sub = 0;
        this[offset] = value & 255;
        while (++i < byteLength2 && (mul *= 256)) {
          if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
            sub = 1;
          }
          this[offset + i] = (value / mul >> 0) - sub & 255;
        }
        return offset + byteLength2;
      };
      Buffer3.prototype.writeIntBE = function writeIntBE(value, offset, byteLength2, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          var limit = Math.pow(2, 8 * byteLength2 - 1);
          checkInt(this, value, offset, byteLength2, limit - 1, -limit);
        }
        var i = byteLength2 - 1;
        var mul = 1;
        var sub = 0;
        this[offset + i] = value & 255;
        while (--i >= 0 && (mul *= 256)) {
          if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
            sub = 1;
          }
          this[offset + i] = (value / mul >> 0) - sub & 255;
        }
        return offset + byteLength2;
      };
      Buffer3.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 1, 127, -128);
        if (value < 0) value = 255 + value + 1;
        this[offset] = value & 255;
        return offset + 1;
      };
      Buffer3.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
        this[offset] = value & 255;
        this[offset + 1] = value >>> 8;
        return offset + 2;
      };
      Buffer3.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
        this[offset] = value >>> 8;
        this[offset + 1] = value & 255;
        return offset + 2;
      };
      Buffer3.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
        this[offset] = value & 255;
        this[offset + 1] = value >>> 8;
        this[offset + 2] = value >>> 16;
        this[offset + 3] = value >>> 24;
        return offset + 4;
      };
      Buffer3.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
        if (value < 0) value = 4294967295 + value + 1;
        this[offset] = value >>> 24;
        this[offset + 1] = value >>> 16;
        this[offset + 2] = value >>> 8;
        this[offset + 3] = value & 255;
        return offset + 4;
      };
      function checkIEEE754(buf, value, offset, ext, max, min) {
        if (offset + ext > buf.length) throw new RangeError("Index out of range");
        if (offset < 0) throw new RangeError("Index out of range");
      }
      function writeFloat(buf, value, offset, littleEndian, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          checkIEEE754(buf, value, offset, 4, 34028234663852886e22, -34028234663852886e22);
        }
        ieee754.write(buf, value, offset, littleEndian, 23, 4);
        return offset + 4;
      }
      Buffer3.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
        return writeFloat(this, value, offset, true, noAssert);
      };
      Buffer3.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
        return writeFloat(this, value, offset, false, noAssert);
      };
      function writeDouble(buf, value, offset, littleEndian, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          checkIEEE754(buf, value, offset, 8, 17976931348623157e292, -17976931348623157e292);
        }
        ieee754.write(buf, value, offset, littleEndian, 52, 8);
        return offset + 8;
      }
      Buffer3.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
        return writeDouble(this, value, offset, true, noAssert);
      };
      Buffer3.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
        return writeDouble(this, value, offset, false, noAssert);
      };
      Buffer3.prototype.copy = function copy(target, targetStart, start, end) {
        if (!Buffer3.isBuffer(target)) throw new TypeError("argument should be a Buffer");
        if (!start) start = 0;
        if (!end && end !== 0) end = this.length;
        if (targetStart >= target.length) targetStart = target.length;
        if (!targetStart) targetStart = 0;
        if (end > 0 && end < start) end = start;
        if (end === start) return 0;
        if (target.length === 0 || this.length === 0) return 0;
        if (targetStart < 0) {
          throw new RangeError("targetStart out of bounds");
        }
        if (start < 0 || start >= this.length) throw new RangeError("Index out of range");
        if (end < 0) throw new RangeError("sourceEnd out of bounds");
        if (end > this.length) end = this.length;
        if (target.length - targetStart < end - start) {
          end = target.length - targetStart + start;
        }
        var len = end - start;
        if (this === target && typeof Uint8Array.prototype.copyWithin === "function") {
          this.copyWithin(targetStart, start, end);
        } else {
          Uint8Array.prototype.set.call(
            target,
            this.subarray(start, end),
            targetStart
          );
        }
        return len;
      };
      Buffer3.prototype.fill = function fill(val, start, end, encoding) {
        if (typeof val === "string") {
          if (typeof start === "string") {
            encoding = start;
            start = 0;
            end = this.length;
          } else if (typeof end === "string") {
            encoding = end;
            end = this.length;
          }
          if (encoding !== void 0 && typeof encoding !== "string") {
            throw new TypeError("encoding must be a string");
          }
          if (typeof encoding === "string" && !Buffer3.isEncoding(encoding)) {
            throw new TypeError("Unknown encoding: " + encoding);
          }
          if (val.length === 1) {
            var code = val.charCodeAt(0);
            if (encoding === "utf8" && code < 128 || encoding === "latin1") {
              val = code;
            }
          }
        } else if (typeof val === "number") {
          val = val & 255;
        } else if (typeof val === "boolean") {
          val = Number(val);
        }
        if (start < 0 || this.length < start || this.length < end) {
          throw new RangeError("Out of range index");
        }
        if (end <= start) {
          return this;
        }
        start = start >>> 0;
        end = end === void 0 ? this.length : end >>> 0;
        if (!val) val = 0;
        var i;
        if (typeof val === "number") {
          for (i = start; i < end; ++i) {
            this[i] = val;
          }
        } else {
          var bytes = Buffer3.isBuffer(val) ? val : Buffer3.from(val, encoding);
          var len = bytes.length;
          if (len === 0) {
            throw new TypeError('The value "' + val + '" is invalid for argument "value"');
          }
          for (i = 0; i < end - start; ++i) {
            this[i + start] = bytes[i % len];
          }
        }
        return this;
      };
      var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
      function base64clean(str) {
        str = str.split("=")[0];
        str = str.trim().replace(INVALID_BASE64_RE, "");
        if (str.length < 2) return "";
        while (str.length % 4 !== 0) {
          str = str + "=";
        }
        return str;
      }
      function utf8ToBytes(string, units) {
        units = units || Infinity;
        var codePoint;
        var length = string.length;
        var leadSurrogate = null;
        var bytes = [];
        for (var i = 0; i < length; ++i) {
          codePoint = string.charCodeAt(i);
          if (codePoint > 55295 && codePoint < 57344) {
            if (!leadSurrogate) {
              if (codePoint > 56319) {
                if ((units -= 3) > -1) bytes.push(239, 191, 189);
                continue;
              } else if (i + 1 === length) {
                if ((units -= 3) > -1) bytes.push(239, 191, 189);
                continue;
              }
              leadSurrogate = codePoint;
              continue;
            }
            if (codePoint < 56320) {
              if ((units -= 3) > -1) bytes.push(239, 191, 189);
              leadSurrogate = codePoint;
              continue;
            }
            codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
          } else if (leadSurrogate) {
            if ((units -= 3) > -1) bytes.push(239, 191, 189);
          }
          leadSurrogate = null;
          if (codePoint < 128) {
            if ((units -= 1) < 0) break;
            bytes.push(codePoint);
          } else if (codePoint < 2048) {
            if ((units -= 2) < 0) break;
            bytes.push(
              codePoint >> 6 | 192,
              codePoint & 63 | 128
            );
          } else if (codePoint < 65536) {
            if ((units -= 3) < 0) break;
            bytes.push(
              codePoint >> 12 | 224,
              codePoint >> 6 & 63 | 128,
              codePoint & 63 | 128
            );
          } else if (codePoint < 1114112) {
            if ((units -= 4) < 0) break;
            bytes.push(
              codePoint >> 18 | 240,
              codePoint >> 12 & 63 | 128,
              codePoint >> 6 & 63 | 128,
              codePoint & 63 | 128
            );
          } else {
            throw new Error("Invalid code point");
          }
        }
        return bytes;
      }
      function asciiToBytes(str) {
        var byteArray = [];
        for (var i = 0; i < str.length; ++i) {
          byteArray.push(str.charCodeAt(i) & 255);
        }
        return byteArray;
      }
      function utf16leToBytes(str, units) {
        var c, hi, lo;
        var byteArray = [];
        for (var i = 0; i < str.length; ++i) {
          if ((units -= 2) < 0) break;
          c = str.charCodeAt(i);
          hi = c >> 8;
          lo = c % 256;
          byteArray.push(lo);
          byteArray.push(hi);
        }
        return byteArray;
      }
      function base64ToBytes(str) {
        return base64.toByteArray(base64clean(str));
      }
      function blitBuffer(src, dst, offset, length) {
        for (var i = 0; i < length; ++i) {
          if (i + offset >= dst.length || i >= src.length) break;
          dst[i + offset] = src[i];
        }
        return i;
      }
      function isInstance(obj, type) {
        return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
      }
      function numberIsNaN(obj) {
        return obj !== obj;
      }
      var hexSliceLookupTable = (function() {
        var alphabet = "0123456789abcdef";
        var table = new Array(256);
        for (var i = 0; i < 16; ++i) {
          var i16 = i * 16;
          for (var j = 0; j < 16; ++j) {
            table[i16 + j] = alphabet[i] + alphabet[j];
          }
        }
        return table;
      })();
    }
  });

  // node_modules/node-stdlib-browser/cjs/proxy/process.js
  var require_process = __commonJS({
    "node_modules/node-stdlib-browser/cjs/proxy/process.js"(exports, module) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      var browser$1 = { exports: {} };
      var process2 = browser$1.exports = {};
      var cachedSetTimeout;
      var cachedClearTimeout;
      function defaultSetTimout() {
        throw new Error("setTimeout has not been defined");
      }
      function defaultClearTimeout() {
        throw new Error("clearTimeout has not been defined");
      }
      (function() {
        try {
          if (typeof setTimeout === "function") {
            cachedSetTimeout = setTimeout;
          } else {
            cachedSetTimeout = defaultSetTimout;
          }
        } catch (e) {
          cachedSetTimeout = defaultSetTimout;
        }
        try {
          if (typeof clearTimeout === "function") {
            cachedClearTimeout = clearTimeout;
          } else {
            cachedClearTimeout = defaultClearTimeout;
          }
        } catch (e) {
          cachedClearTimeout = defaultClearTimeout;
        }
      })();
      function runTimeout(fun) {
        if (cachedSetTimeout === setTimeout) {
          return setTimeout(fun, 0);
        }
        if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
          cachedSetTimeout = setTimeout;
          return setTimeout(fun, 0);
        }
        try {
          return cachedSetTimeout(fun, 0);
        } catch (e) {
          try {
            return cachedSetTimeout.call(null, fun, 0);
          } catch (e2) {
            return cachedSetTimeout.call(this, fun, 0);
          }
        }
      }
      function runClearTimeout(marker) {
        if (cachedClearTimeout === clearTimeout) {
          return clearTimeout(marker);
        }
        if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
          cachedClearTimeout = clearTimeout;
          return clearTimeout(marker);
        }
        try {
          return cachedClearTimeout(marker);
        } catch (e) {
          try {
            return cachedClearTimeout.call(null, marker);
          } catch (e2) {
            return cachedClearTimeout.call(this, marker);
          }
        }
      }
      var queue = [];
      var draining = false;
      var currentQueue;
      var queueIndex = -1;
      function cleanUpNextTick() {
        if (!draining || !currentQueue) {
          return;
        }
        draining = false;
        if (currentQueue.length) {
          queue = currentQueue.concat(queue);
        } else {
          queueIndex = -1;
        }
        if (queue.length) {
          drainQueue();
        }
      }
      function drainQueue() {
        if (draining) {
          return;
        }
        var timeout = runTimeout(cleanUpNextTick);
        draining = true;
        var len = queue.length;
        while (len) {
          currentQueue = queue;
          queue = [];
          while (++queueIndex < len) {
            if (currentQueue) {
              currentQueue[queueIndex].run();
            }
          }
          queueIndex = -1;
          len = queue.length;
        }
        currentQueue = null;
        draining = false;
        runClearTimeout(timeout);
      }
      process2.nextTick = function(fun) {
        var args = new Array(arguments.length - 1);
        if (arguments.length > 1) {
          for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
          }
        }
        queue.push(new Item(fun, args));
        if (queue.length === 1 && !draining) {
          runTimeout(drainQueue);
        }
      };
      function Item(fun, array) {
        this.fun = fun;
        this.array = array;
      }
      Item.prototype.run = function() {
        this.fun.apply(null, this.array);
      };
      process2.title = "browser";
      process2.browser = true;
      process2.env = {};
      process2.argv = [];
      process2.version = "";
      process2.versions = {};
      function noop$1() {
      }
      process2.on = noop$1;
      process2.addListener = noop$1;
      process2.once = noop$1;
      process2.off = noop$1;
      process2.removeListener = noop$1;
      process2.removeAllListeners = noop$1;
      process2.emit = noop$1;
      process2.prependListener = noop$1;
      process2.prependOnceListener = noop$1;
      process2.listeners = function(name) {
        return [];
      };
      process2.binding = function(name) {
        throw new Error("process.binding is not supported");
      };
      process2.cwd = function() {
        return "/";
      };
      process2.chdir = function(dir) {
        throw new Error("process.chdir is not supported");
      };
      process2.umask = function() {
        return 0;
      };
      function noop() {
      }
      var browser = (
        /** @type {boolean} */
        browser$1.exports.browser
      );
      var emitWarning = noop;
      var binding = (
        /** @type {Function} */
        browser$1.exports.binding
      );
      var exit = noop;
      var pid = 1;
      var features = {};
      var kill = noop;
      var dlopen = noop;
      var uptime = noop;
      var memoryUsage = noop;
      var uvCounters = noop;
      var platform = "browser";
      var arch = "browser";
      var execPath = "browser";
      var execArgv = (
        /** @type {string[]} */
        []
      );
      var api = {
        nextTick: browser$1.exports.nextTick,
        title: browser$1.exports.title,
        browser,
        env: browser$1.exports.env,
        argv: browser$1.exports.argv,
        version: browser$1.exports.version,
        versions: browser$1.exports.versions,
        on: browser$1.exports.on,
        addListener: browser$1.exports.addListener,
        once: browser$1.exports.once,
        off: browser$1.exports.off,
        removeListener: browser$1.exports.removeListener,
        removeAllListeners: browser$1.exports.removeAllListeners,
        emit: browser$1.exports.emit,
        emitWarning,
        prependListener: browser$1.exports.prependListener,
        prependOnceListener: browser$1.exports.prependOnceListener,
        listeners: browser$1.exports.listeners,
        binding,
        cwd: browser$1.exports.cwd,
        chdir: browser$1.exports.chdir,
        umask: browser$1.exports.umask,
        exit,
        pid,
        features,
        kill,
        dlopen,
        uptime,
        memoryUsage,
        uvCounters,
        platform,
        arch,
        execPath,
        execArgv
      };
      exports.addListener = browser$1.exports.addListener;
      exports.arch = arch;
      exports.argv = browser$1.exports.argv;
      exports.binding = binding;
      exports.browser = browser;
      exports.chdir = browser$1.exports.chdir;
      exports.cwd = browser$1.exports.cwd;
      exports["default"] = api;
      exports.dlopen = dlopen;
      exports.emit = browser$1.exports.emit;
      exports.emitWarning = emitWarning;
      exports.env = browser$1.exports.env;
      exports.execArgv = execArgv;
      exports.execPath = execPath;
      exports.exit = exit;
      exports.features = features;
      exports.kill = kill;
      exports.listeners = browser$1.exports.listeners;
      exports.memoryUsage = memoryUsage;
      exports.nextTick = browser$1.exports.nextTick;
      exports.off = browser$1.exports.off;
      exports.on = browser$1.exports.on;
      exports.once = browser$1.exports.once;
      exports.pid = pid;
      exports.platform = platform;
      exports.prependListener = browser$1.exports.prependListener;
      exports.prependOnceListener = browser$1.exports.prependOnceListener;
      exports.removeAllListeners = browser$1.exports.removeAllListeners;
      exports.removeListener = browser$1.exports.removeListener;
      exports.title = browser$1.exports.title;
      exports.umask = browser$1.exports.umask;
      exports.uptime = uptime;
      exports.uvCounters = uvCounters;
      exports.version = browser$1.exports.version;
      exports.versions = browser$1.exports.versions;
      exports = module.exports = api;
    }
  });

  // node_modules/node-stdlib-browser/helpers/esbuild/shim.js
  var import_buffer, import_process, _globalThis;
  var init_shim = __esm({
    "node_modules/node-stdlib-browser/helpers/esbuild/shim.js"() {
      import_buffer = __toESM(require_buffer());
      import_process = __toESM(require_process());
      _globalThis = (function(Object2) {
        function get() {
          var _global3 = this || self;
          delete Object2.prototype.__magic__;
          return _global3;
        }
        if (typeof globalThis === "object") {
          return globalThis;
        }
        if (this) {
          return get();
        } else {
          Object2.defineProperty(Object2.prototype, "__magic__", {
            configurable: true,
            get
          });
          var _global2 = __magic__;
          return _global2;
        }
      })(Object);
    }
  });

  // node_modules/tslib/tslib.es6.mjs
  var tslib_es6_exports = {};
  __export(tslib_es6_exports, {
    __addDisposableResource: () => __addDisposableResource,
    __assign: () => __assign,
    __asyncDelegator: () => __asyncDelegator,
    __asyncGenerator: () => __asyncGenerator,
    __asyncValues: () => __asyncValues,
    __await: () => __await,
    __awaiter: () => __awaiter,
    __classPrivateFieldGet: () => __classPrivateFieldGet,
    __classPrivateFieldIn: () => __classPrivateFieldIn,
    __classPrivateFieldSet: () => __classPrivateFieldSet,
    __createBinding: () => __createBinding,
    __decorate: () => __decorate,
    __disposeResources: () => __disposeResources,
    __esDecorate: () => __esDecorate,
    __exportStar: () => __exportStar,
    __extends: () => __extends,
    __generator: () => __generator,
    __importDefault: () => __importDefault,
    __importStar: () => __importStar,
    __makeTemplateObject: () => __makeTemplateObject,
    __metadata: () => __metadata,
    __param: () => __param,
    __propKey: () => __propKey,
    __read: () => __read,
    __rest: () => __rest,
    __rewriteRelativeImportExtension: () => __rewriteRelativeImportExtension,
    __runInitializers: () => __runInitializers,
    __setFunctionName: () => __setFunctionName,
    __spread: () => __spread,
    __spreadArray: () => __spreadArray,
    __spreadArrays: () => __spreadArrays,
    __values: () => __values,
    default: () => tslib_es6_default
  });
  function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }
  function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
      t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
          t[p[i]] = s[p[i]];
      }
    return t;
  }
  function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  }
  function __param(paramIndex, decorator) {
    return function(target, key) {
      decorator(target, key, paramIndex);
    };
  }
  function __esDecorate(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) {
      if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
      return f;
    }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
      var context = {};
      for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
      for (var p in contextIn.access) context.access[p] = contextIn.access[p];
      context.addInitializer = function(f) {
        if (done) throw new TypeError("Cannot add initializers after decoration has completed");
        extraInitializers.push(accept(f || null));
      };
      var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
      if (kind === "accessor") {
        if (result === void 0) continue;
        if (result === null || typeof result !== "object") throw new TypeError("Object expected");
        if (_ = accept(result.get)) descriptor.get = _;
        if (_ = accept(result.set)) descriptor.set = _;
        if (_ = accept(result.init)) initializers.unshift(_);
      } else if (_ = accept(result)) {
        if (kind === "field") initializers.unshift(_);
        else descriptor[key] = _;
      }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
  }
  function __runInitializers(thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
      value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
  }
  function __propKey(x) {
    return typeof x === "symbol" ? x : "".concat(x);
  }
  function __setFunctionName(f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
  }
  function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
  }
  function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  }
  function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() {
      if (t[0] & 1) throw t[1];
      return t[1];
    }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
      return this;
    }), g;
    function verb(n) {
      return function(v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while (g && (g = 0, op[0] && (_ = 0)), _) try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
        if (y = 0, t) op = [op[0] & 2, t.value];
        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;
          case 4:
            _.label++;
            return { value: op[1], done: false };
          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;
          case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;
          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }
            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            if (t[2]) _.ops.pop();
            _.trys.pop();
            continue;
        }
        op = body.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  }
  function __exportStar(m, o) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
  }
  function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
      next: function() {
        if (o && i >= o.length) o = void 0;
        return { value: o && o[i++], done: !o };
      }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }
  function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"])) m.call(i);
      } finally {
        if (e) throw e.error;
      }
    }
    return ar;
  }
  function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
      ar = ar.concat(__read(arguments[i]));
    return ar;
  }
  function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
        r[k] = a[j];
    return r;
  }
  function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
      if (ar || !(i in from)) {
        if (!ar) ar = Array.prototype.slice.call(from, 0, i);
        ar[i] = from[i];
      }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
  }
  function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
  }
  function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function() {
      return this;
    }, i;
    function awaitReturn(f) {
      return function(v) {
        return Promise.resolve(v).then(f, reject);
      };
    }
    function verb(n, f) {
      if (g[n]) {
        i[n] = function(v) {
          return new Promise(function(a, b) {
            q.push([n, v, a, b]) > 1 || resume(n, v);
          });
        };
        if (f) i[n] = f(i[n]);
      }
    }
    function resume(n, v) {
      try {
        step(g[n](v));
      } catch (e) {
        settle(q[0][3], e);
      }
    }
    function step(r) {
      r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
    }
    function fulfill(value) {
      resume("next", value);
    }
    function reject(value) {
      resume("throw", value);
    }
    function settle(f, v) {
      if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
    }
  }
  function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function(e) {
      throw e;
    }), verb("return"), i[Symbol.iterator] = function() {
      return this;
    }, i;
    function verb(n, f) {
      i[n] = o[n] ? function(v) {
        return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v;
      } : f;
    }
  }
  function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
      return this;
    }, i);
    function verb(n) {
      i[n] = o[n] && function(v) {
        return new Promise(function(resolve, reject) {
          v = o[n](v), settle(resolve, reject, v.done, v.value);
        });
      };
    }
    function settle(resolve, reject, d, v) {
      Promise.resolve(v).then(function(v2) {
        resolve({ value: v2, done: d });
      }, reject);
    }
  }
  function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) {
      Object.defineProperty(cooked, "raw", { value: raw });
    } else {
      cooked.raw = raw;
    }
    return cooked;
  }
  function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) {
      for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
    }
    __setModuleDefault(result, mod);
    return result;
  }
  function __importDefault(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  }
  function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
  }
  function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
  }
  function __classPrivateFieldIn(state, receiver) {
    if (receiver === null || typeof receiver !== "object" && typeof receiver !== "function") throw new TypeError("Cannot use 'in' operator on non-object");
    return typeof state === "function" ? receiver === state : state.has(receiver);
  }
  function __addDisposableResource(env, value, async) {
    if (value !== null && value !== void 0) {
      if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
      var dispose, inner;
      if (async) {
        if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
        dispose = value[Symbol.asyncDispose];
      }
      if (dispose === void 0) {
        if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
        dispose = value[Symbol.dispose];
        if (async) inner = dispose;
      }
      if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
      if (inner) dispose = function() {
        try {
          inner.call(this);
        } catch (e) {
          return Promise.reject(e);
        }
      };
      env.stack.push({ value, dispose, async });
    } else if (async) {
      env.stack.push({ async: true });
    }
    return value;
  }
  function __disposeResources(env) {
    function fail(e) {
      env.error = env.hasError ? new _SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
      env.hasError = true;
    }
    var r, s = 0;
    function next() {
      while (r = env.stack.pop()) {
        try {
          if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
          if (r.dispose) {
            var result = r.dispose.call(r.value);
            if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) {
              fail(e);
              return next();
            });
          } else s |= 1;
        } catch (e) {
          fail(e);
        }
      }
      if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
      if (env.hasError) throw env.error;
    }
    return next();
  }
  function __rewriteRelativeImportExtension(path, preserveJsx) {
    if (typeof path === "string" && /^\.\.?\//.test(path)) {
      return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function(m, tsx, d, ext, cm) {
        return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : d + ext + "." + cm.toLowerCase() + "js";
      });
    }
    return path;
  }
  var extendStatics, __assign, __createBinding, __setModuleDefault, ownKeys, _SuppressedError, tslib_es6_default;
  var init_tslib_es6 = __esm({
    "node_modules/tslib/tslib.es6.mjs"() {
      init_shim();
      extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      __assign = function() {
        __assign = Object.assign || function __assign2(t) {
          for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
          }
          return t;
        };
        return __assign.apply(this, arguments);
      };
      __createBinding = Object.create ? (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k];
          } };
        }
        Object.defineProperty(o, k2, desc);
      }) : (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      });
      __setModuleDefault = Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }) : function(o, v) {
        o["default"] = v;
      };
      ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      _SuppressedError = typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
      };
      tslib_es6_default = {
        __extends,
        __assign,
        __rest,
        __decorate,
        __param,
        __esDecorate,
        __runInitializers,
        __propKey,
        __setFunctionName,
        __metadata,
        __awaiter,
        __generator,
        __createBinding,
        __exportStar,
        __values,
        __read,
        __spread,
        __spreadArrays,
        __spreadArray,
        __await,
        __asyncGenerator,
        __asyncDelegator,
        __asyncValues,
        __makeTemplateObject,
        __importStar,
        __importDefault,
        __classPrivateFieldGet,
        __classPrivateFieldSet,
        __classPrivateFieldIn,
        __addDisposableResource,
        __disposeResources,
        __rewriteRelativeImportExtension
      };
    }
  });

  // node_modules/path-browserify/index.js
  var require_path_browserify = __commonJS({
    "node_modules/path-browserify/index.js"(exports, module) {
      "use strict";
      init_shim();
      function assertPath(path) {
        if (typeof path !== "string") {
          throw new TypeError("Path must be a string. Received " + JSON.stringify(path));
        }
      }
      function normalizeStringPosix(path, allowAboveRoot) {
        var res = "";
        var lastSegmentLength = 0;
        var lastSlash = -1;
        var dots = 0;
        var code;
        for (var i = 0; i <= path.length; ++i) {
          if (i < path.length)
            code = path.charCodeAt(i);
          else if (code === 47)
            break;
          else
            code = 47;
          if (code === 47) {
            if (lastSlash === i - 1 || dots === 1) {
            } else if (lastSlash !== i - 1 && dots === 2) {
              if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                if (res.length > 2) {
                  var lastSlashIndex = res.lastIndexOf("/");
                  if (lastSlashIndex !== res.length - 1) {
                    if (lastSlashIndex === -1) {
                      res = "";
                      lastSegmentLength = 0;
                    } else {
                      res = res.slice(0, lastSlashIndex);
                      lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
                    }
                    lastSlash = i;
                    dots = 0;
                    continue;
                  }
                } else if (res.length === 2 || res.length === 1) {
                  res = "";
                  lastSegmentLength = 0;
                  lastSlash = i;
                  dots = 0;
                  continue;
                }
              }
              if (allowAboveRoot) {
                if (res.length > 0)
                  res += "/..";
                else
                  res = "..";
                lastSegmentLength = 2;
              }
            } else {
              if (res.length > 0)
                res += "/" + path.slice(lastSlash + 1, i);
              else
                res = path.slice(lastSlash + 1, i);
              lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
          } else if (code === 46 && dots !== -1) {
            ++dots;
          } else {
            dots = -1;
          }
        }
        return res;
      }
      function _format(sep, pathObject) {
        var dir = pathObject.dir || pathObject.root;
        var base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
        if (!dir) {
          return base;
        }
        if (dir === pathObject.root) {
          return dir + base;
        }
        return dir + sep + base;
      }
      var posix = {
        // path.resolve([from ...], to)
        resolve: function resolve() {
          var resolvedPath = "";
          var resolvedAbsolute = false;
          var cwd;
          for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path;
            if (i >= 0)
              path = arguments[i];
            else {
              if (cwd === void 0)
                cwd = import_process.default.cwd();
              path = cwd;
            }
            assertPath(path);
            if (path.length === 0) {
              continue;
            }
            resolvedPath = path + "/" + resolvedPath;
            resolvedAbsolute = path.charCodeAt(0) === 47;
          }
          resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);
          if (resolvedAbsolute) {
            if (resolvedPath.length > 0)
              return "/" + resolvedPath;
            else
              return "/";
          } else if (resolvedPath.length > 0) {
            return resolvedPath;
          } else {
            return ".";
          }
        },
        normalize: function normalize(path) {
          assertPath(path);
          if (path.length === 0) return ".";
          var isAbsolute = path.charCodeAt(0) === 47;
          var trailingSeparator = path.charCodeAt(path.length - 1) === 47;
          path = normalizeStringPosix(path, !isAbsolute);
          if (path.length === 0 && !isAbsolute) path = ".";
          if (path.length > 0 && trailingSeparator) path += "/";
          if (isAbsolute) return "/" + path;
          return path;
        },
        isAbsolute: function isAbsolute(path) {
          assertPath(path);
          return path.length > 0 && path.charCodeAt(0) === 47;
        },
        join: function join() {
          if (arguments.length === 0)
            return ".";
          var joined;
          for (var i = 0; i < arguments.length; ++i) {
            var arg = arguments[i];
            assertPath(arg);
            if (arg.length > 0) {
              if (joined === void 0)
                joined = arg;
              else
                joined += "/" + arg;
            }
          }
          if (joined === void 0)
            return ".";
          return posix.normalize(joined);
        },
        relative: function relative(from, to) {
          assertPath(from);
          assertPath(to);
          if (from === to) return "";
          from = posix.resolve(from);
          to = posix.resolve(to);
          if (from === to) return "";
          var fromStart = 1;
          for (; fromStart < from.length; ++fromStart) {
            if (from.charCodeAt(fromStart) !== 47)
              break;
          }
          var fromEnd = from.length;
          var fromLen = fromEnd - fromStart;
          var toStart = 1;
          for (; toStart < to.length; ++toStart) {
            if (to.charCodeAt(toStart) !== 47)
              break;
          }
          var toEnd = to.length;
          var toLen = toEnd - toStart;
          var length = fromLen < toLen ? fromLen : toLen;
          var lastCommonSep = -1;
          var i = 0;
          for (; i <= length; ++i) {
            if (i === length) {
              if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 47) {
                  return to.slice(toStart + i + 1);
                } else if (i === 0) {
                  return to.slice(toStart + i);
                }
              } else if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 47) {
                  lastCommonSep = i;
                } else if (i === 0) {
                  lastCommonSep = 0;
                }
              }
              break;
            }
            var fromCode = from.charCodeAt(fromStart + i);
            var toCode = to.charCodeAt(toStart + i);
            if (fromCode !== toCode)
              break;
            else if (fromCode === 47)
              lastCommonSep = i;
          }
          var out = "";
          for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
            if (i === fromEnd || from.charCodeAt(i) === 47) {
              if (out.length === 0)
                out += "..";
              else
                out += "/..";
            }
          }
          if (out.length > 0)
            return out + to.slice(toStart + lastCommonSep);
          else {
            toStart += lastCommonSep;
            if (to.charCodeAt(toStart) === 47)
              ++toStart;
            return to.slice(toStart);
          }
        },
        _makeLong: function _makeLong(path) {
          return path;
        },
        dirname: function dirname(path) {
          assertPath(path);
          if (path.length === 0) return ".";
          var code = path.charCodeAt(0);
          var hasRoot = code === 47;
          var end = -1;
          var matchedSlash = true;
          for (var i = path.length - 1; i >= 1; --i) {
            code = path.charCodeAt(i);
            if (code === 47) {
              if (!matchedSlash) {
                end = i;
                break;
              }
            } else {
              matchedSlash = false;
            }
          }
          if (end === -1) return hasRoot ? "/" : ".";
          if (hasRoot && end === 1) return "//";
          return path.slice(0, end);
        },
        basename: function basename(path, ext) {
          if (ext !== void 0 && typeof ext !== "string") throw new TypeError('"ext" argument must be a string');
          assertPath(path);
          var start = 0;
          var end = -1;
          var matchedSlash = true;
          var i;
          if (ext !== void 0 && ext.length > 0 && ext.length <= path.length) {
            if (ext.length === path.length && ext === path) return "";
            var extIdx = ext.length - 1;
            var firstNonSlashEnd = -1;
            for (i = path.length - 1; i >= 0; --i) {
              var code = path.charCodeAt(i);
              if (code === 47) {
                if (!matchedSlash) {
                  start = i + 1;
                  break;
                }
              } else {
                if (firstNonSlashEnd === -1) {
                  matchedSlash = false;
                  firstNonSlashEnd = i + 1;
                }
                if (extIdx >= 0) {
                  if (code === ext.charCodeAt(extIdx)) {
                    if (--extIdx === -1) {
                      end = i;
                    }
                  } else {
                    extIdx = -1;
                    end = firstNonSlashEnd;
                  }
                }
              }
            }
            if (start === end) end = firstNonSlashEnd;
            else if (end === -1) end = path.length;
            return path.slice(start, end);
          } else {
            for (i = path.length - 1; i >= 0; --i) {
              if (path.charCodeAt(i) === 47) {
                if (!matchedSlash) {
                  start = i + 1;
                  break;
                }
              } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
              }
            }
            if (end === -1) return "";
            return path.slice(start, end);
          }
        },
        extname: function extname(path) {
          assertPath(path);
          var startDot = -1;
          var startPart = 0;
          var end = -1;
          var matchedSlash = true;
          var preDotState = 0;
          for (var i = path.length - 1; i >= 0; --i) {
            var code = path.charCodeAt(i);
            if (code === 47) {
              if (!matchedSlash) {
                startPart = i + 1;
                break;
              }
              continue;
            }
            if (end === -1) {
              matchedSlash = false;
              end = i + 1;
            }
            if (code === 46) {
              if (startDot === -1)
                startDot = i;
              else if (preDotState !== 1)
                preDotState = 1;
            } else if (startDot !== -1) {
              preDotState = -1;
            }
          }
          if (startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
          preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
          preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
            return "";
          }
          return path.slice(startDot, end);
        },
        format: function format(pathObject) {
          if (pathObject === null || typeof pathObject !== "object") {
            throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
          }
          return _format("/", pathObject);
        },
        parse: function parse(path) {
          assertPath(path);
          var ret = { root: "", dir: "", base: "", ext: "", name: "" };
          if (path.length === 0) return ret;
          var code = path.charCodeAt(0);
          var isAbsolute = code === 47;
          var start;
          if (isAbsolute) {
            ret.root = "/";
            start = 1;
          } else {
            start = 0;
          }
          var startDot = -1;
          var startPart = 0;
          var end = -1;
          var matchedSlash = true;
          var i = path.length - 1;
          var preDotState = 0;
          for (; i >= start; --i) {
            code = path.charCodeAt(i);
            if (code === 47) {
              if (!matchedSlash) {
                startPart = i + 1;
                break;
              }
              continue;
            }
            if (end === -1) {
              matchedSlash = false;
              end = i + 1;
            }
            if (code === 46) {
              if (startDot === -1) startDot = i;
              else if (preDotState !== 1) preDotState = 1;
            } else if (startDot !== -1) {
              preDotState = -1;
            }
          }
          if (startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
          preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
          preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
            if (end !== -1) {
              if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end);
              else ret.base = ret.name = path.slice(startPart, end);
            }
          } else {
            if (startPart === 0 && isAbsolute) {
              ret.name = path.slice(1, startDot);
              ret.base = path.slice(1, end);
            } else {
              ret.name = path.slice(startPart, startDot);
              ret.base = path.slice(startPart, end);
            }
            ret.ext = path.slice(startDot, end);
          }
          if (startPart > 0) ret.dir = path.slice(0, startPart - 1);
          else if (isAbsolute) ret.dir = "/";
          return ret;
        },
        sep: "/",
        delimiter: ":",
        win32: null,
        posix: null
      };
      posix.posix = posix;
      module.exports = posix;
    }
  });

  // node_modules/@jsonjoy.com/fs-node-builtins/lib/path.js
  var require_path = __commonJS({
    "node_modules/@jsonjoy.com/fs-node-builtins/lib/path.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.basename = exports.isAbsolute = exports.normalize = exports.dirname = exports.relative = exports.join = exports.posix = exports.sep = exports.resolve = void 0;
      var node_path_1 = require_path_browserify();
      Object.defineProperty(exports, "resolve", { enumerable: true, get: function() {
        return node_path_1.resolve;
      } });
      Object.defineProperty(exports, "sep", { enumerable: true, get: function() {
        return node_path_1.sep;
      } });
      Object.defineProperty(exports, "posix", { enumerable: true, get: function() {
        return node_path_1.posix;
      } });
      Object.defineProperty(exports, "join", { enumerable: true, get: function() {
        return node_path_1.join;
      } });
      Object.defineProperty(exports, "relative", { enumerable: true, get: function() {
        return node_path_1.relative;
      } });
      Object.defineProperty(exports, "dirname", { enumerable: true, get: function() {
        return node_path_1.dirname;
      } });
      Object.defineProperty(exports, "normalize", { enumerable: true, get: function() {
        return node_path_1.normalize;
      } });
      Object.defineProperty(exports, "isAbsolute", { enumerable: true, get: function() {
        return node_path_1.isAbsolute;
      } });
      Object.defineProperty(exports, "basename", { enumerable: true, get: function() {
        return node_path_1.basename;
      } });
    }
  });

  // node_modules/@jsonjoy.com/fs-core/lib/types.js
  var require_types = __commonJS({
    "node_modules/@jsonjoy.com/fs-core/lib/types.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
    }
  });

  // node_modules/@jsonjoy.com/fs-node-builtins/lib/buffer.js
  var require_buffer2 = __commonJS({
    "node_modules/@jsonjoy.com/fs-node-builtins/lib/buffer.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Buffer = void 0;
      var node_buffer_1 = require_buffer();
      Object.defineProperty(exports, "Buffer", { enumerable: true, get: function() {
        return node_buffer_1.Buffer;
      } });
    }
  });

  // node_modules/@jsonjoy.com/fs-node-builtins/lib/internal/buffer.js
  var require_buffer3 = __commonJS({
    "node_modules/@jsonjoy.com/fs-node-builtins/lib/internal/buffer.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.bufferFrom = exports.bufferAllocUnsafe = exports.Buffer = void 0;
      var buffer_1 = require_buffer2();
      Object.defineProperty(exports, "Buffer", { enumerable: true, get: function() {
        return buffer_1.Buffer;
      } });
      function bufferV0P12Ponyfill(arg0, ...args) {
        return new buffer_1.Buffer(arg0, ...args);
      }
      var bufferAllocUnsafe = buffer_1.Buffer.allocUnsafe || bufferV0P12Ponyfill;
      exports.bufferAllocUnsafe = bufferAllocUnsafe;
      var bufferFrom = buffer_1.Buffer.from || bufferV0P12Ponyfill;
      exports.bufferFrom = bufferFrom;
    }
  });

  // node_modules/@jsonjoy.com/fs-core/lib/json.js
  var require_json = __commonJS({
    "node_modules/@jsonjoy.com/fs-core/lib/json.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.flattenJSON = void 0;
      var buffer_1 = require_buffer3();
      var path_1 = require_path();
      var pathJoin = path_1.posix ? path_1.posix.join : path_1.join;
      var flattenJSON = (nestedJSON) => {
        const flatJSON = {};
        function flatten(pathPrefix, node) {
          for (const path in node) {
            const contentOrNode = node[path];
            const joinedPath = pathJoin(pathPrefix, path);
            if (typeof contentOrNode === "string" || contentOrNode instanceof buffer_1.Buffer) {
              flatJSON[joinedPath] = contentOrNode;
            } else if (typeof contentOrNode === "object" && contentOrNode !== null && !(contentOrNode instanceof buffer_1.Buffer) && Object.keys(contentOrNode).length > 0) {
              flatten(joinedPath, contentOrNode);
            } else {
              flatJSON[joinedPath] = null;
            }
          }
        }
        flatten("", nestedJSON);
        return flatJSON;
      };
      exports.flattenJSON = flattenJSON;
    }
  });

  // node_modules/@jsonjoy.com/fs-core/lib/constants.js
  var require_constants = __commonJS({
    "node_modules/@jsonjoy.com/fs-core/lib/constants.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
    }
  });

  // node_modules/@jsonjoy.com/fs-core/lib/result.js
  var require_result = __commonJS({
    "node_modules/@jsonjoy.com/fs-core/lib/result.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Ok = Ok;
      exports.Err = Err;
      function Ok(value) {
        return { ok: true, value };
      }
      function Err(err) {
        return { ok: false, err };
      }
    }
  });

  // node_modules/thingies/lib/fanout.js
  var require_fanout = __commonJS({
    "node_modules/thingies/lib/fanout.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.FanOut = void 0;
      var FanOut = class {
        constructor() {
          this.listeners = /* @__PURE__ */ new Set();
        }
        emit(data) {
          this.listeners.forEach((listener) => listener(data));
        }
        listen(listener) {
          const listeners = this.listeners;
          listeners.add(listener);
          return () => listeners.delete(listener);
        }
      };
      exports.FanOut = FanOut;
    }
  });

  // node_modules/@jsonjoy.com/fs-core/lib/process.js
  var require_process2 = __commonJS({
    "node_modules/@jsonjoy.com/fs-core/lib/process.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.createProcess = createProcess;
      var maybeReturnProcess = () => {
        if (typeof import_process.default !== "undefined") {
          return import_process.default;
        }
        try {
          return require_process();
        } catch {
          return void 0;
        }
      };
      function createProcess() {
        const p = maybeReturnProcess() || {};
        if (!p.cwd)
          p.cwd = () => "/";
        if (!p.emitWarning)
          p.emitWarning = (message, type) => {
            console.warn(`${type}${type ? ": " : ""}${message}`);
          };
        if (!p.env)
          p.env = {};
        return p;
      }
      exports.default = createProcess();
    }
  });

  // node_modules/@jsonjoy.com/fs-node-utils/lib/types/index.js
  var require_types2 = __commonJS({
    "node_modules/@jsonjoy.com/fs-node-utils/lib/types/index.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
    }
  });

  // node_modules/@jsonjoy.com/fs-node-utils/lib/constants.js
  var require_constants2 = __commonJS({
    "node_modules/@jsonjoy.com/fs-node-utils/lib/constants.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.FLAGS = exports.ERRSTR = exports.constants = exports.SEP = void 0;
      exports.SEP = "/";
      exports.constants = {
        O_RDONLY: 0,
        O_WRONLY: 1,
        O_RDWR: 2,
        S_IFMT: 61440,
        S_IFREG: 32768,
        S_IFDIR: 16384,
        S_IFCHR: 8192,
        S_IFBLK: 24576,
        S_IFIFO: 4096,
        S_IFLNK: 40960,
        S_IFSOCK: 49152,
        O_CREAT: 64,
        O_EXCL: 128,
        O_NOCTTY: 256,
        O_TRUNC: 512,
        O_APPEND: 1024,
        O_DIRECTORY: 65536,
        O_NOATIME: 262144,
        O_NOFOLLOW: 131072,
        O_SYNC: 1052672,
        O_SYMLINK: 2097152,
        O_DIRECT: 16384,
        O_NONBLOCK: 2048,
        S_IRWXU: 448,
        S_IRUSR: 256,
        S_IWUSR: 128,
        S_IXUSR: 64,
        S_IRWXG: 56,
        S_IRGRP: 32,
        S_IWGRP: 16,
        S_IXGRP: 8,
        S_IRWXO: 7,
        S_IROTH: 4,
        S_IWOTH: 2,
        S_IXOTH: 1,
        F_OK: 0,
        R_OK: 4,
        W_OK: 2,
        X_OK: 1,
        UV_FS_SYMLINK_DIR: 1,
        UV_FS_SYMLINK_JUNCTION: 2,
        UV_FS_COPYFILE_EXCL: 1,
        UV_FS_COPYFILE_FICLONE: 2,
        UV_FS_COPYFILE_FICLONE_FORCE: 4,
        COPYFILE_EXCL: 1,
        COPYFILE_FICLONE: 2,
        COPYFILE_FICLONE_FORCE: 4
      };
      exports.ERRSTR = {
        PATH_STR: "path must be a string, Buffer, or Uint8Array",
        // FD:             'file descriptor must be a unsigned 32-bit integer',
        FD: "fd must be a file descriptor",
        MODE_INT: "mode must be an int",
        CB: "callback must be a function",
        UID: "uid must be an unsigned int",
        GID: "gid must be an unsigned int",
        LEN: "len must be an integer",
        ATIME: "atime must be an integer",
        MTIME: "mtime must be an integer",
        PREFIX: "filename prefix is required",
        BUFFER: "buffer must be an instance of Buffer or StaticBuffer",
        OFFSET: "offset must be an integer",
        LENGTH: "length must be an integer",
        POSITION: "position must be an integer"
      };
      var { O_RDONLY, O_WRONLY, O_RDWR, O_CREAT, O_EXCL, O_TRUNC, O_APPEND, O_SYNC } = exports.constants;
      var FLAGS;
      (function(FLAGS2) {
        FLAGS2[FLAGS2["r"] = O_RDONLY] = "r";
        FLAGS2[FLAGS2["r+"] = O_RDWR] = "r+";
        FLAGS2[FLAGS2["rs"] = O_RDONLY | O_SYNC] = "rs";
        FLAGS2[FLAGS2["sr"] = FLAGS2.rs] = "sr";
        FLAGS2[FLAGS2["rs+"] = O_RDWR | O_SYNC] = "rs+";
        FLAGS2[FLAGS2["sr+"] = FLAGS2["rs+"]] = "sr+";
        FLAGS2[FLAGS2["w"] = O_WRONLY | O_CREAT | O_TRUNC] = "w";
        FLAGS2[FLAGS2["wx"] = O_WRONLY | O_CREAT | O_TRUNC | O_EXCL] = "wx";
        FLAGS2[FLAGS2["xw"] = FLAGS2.wx] = "xw";
        FLAGS2[FLAGS2["w+"] = O_RDWR | O_CREAT | O_TRUNC] = "w+";
        FLAGS2[FLAGS2["wx+"] = O_RDWR | O_CREAT | O_TRUNC | O_EXCL] = "wx+";
        FLAGS2[FLAGS2["xw+"] = FLAGS2["wx+"]] = "xw+";
        FLAGS2[FLAGS2["a"] = O_WRONLY | O_APPEND | O_CREAT] = "a";
        FLAGS2[FLAGS2["ax"] = O_WRONLY | O_APPEND | O_CREAT | O_EXCL] = "ax";
        FLAGS2[FLAGS2["xa"] = FLAGS2.ax] = "xa";
        FLAGS2[FLAGS2["a+"] = O_RDWR | O_APPEND | O_CREAT] = "a+";
        FLAGS2[FLAGS2["ax+"] = O_RDWR | O_APPEND | O_CREAT | O_EXCL] = "ax+";
        FLAGS2[FLAGS2["xa+"] = FLAGS2["ax+"]] = "xa+";
      })(FLAGS || (exports.FLAGS = FLAGS = {}));
    }
  });

  // node_modules/@jsonjoy.com/fs-node-utils/lib/consts/AMODE.js
  var require_AMODE = __commonJS({
    "node_modules/@jsonjoy.com/fs-node-utils/lib/consts/AMODE.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
    }
  });

  // node_modules/@jsonjoy.com/fs-node-utils/lib/consts/FLAG.js
  var require_FLAG = __commonJS({
    "node_modules/@jsonjoy.com/fs-node-utils/lib/consts/FLAG.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.FLAG = void 0;
      var FLAG;
      (function(FLAG2) {
        FLAG2[FLAG2["O_RDONLY"] = 0] = "O_RDONLY";
        FLAG2[FLAG2["O_WRONLY"] = 1] = "O_WRONLY";
        FLAG2[FLAG2["O_RDWR"] = 2] = "O_RDWR";
        FLAG2[FLAG2["O_ACCMODE"] = 3] = "O_ACCMODE";
        FLAG2[FLAG2["O_CREAT"] = 64] = "O_CREAT";
        FLAG2[FLAG2["O_EXCL"] = 128] = "O_EXCL";
        FLAG2[FLAG2["O_NOCTTY"] = 256] = "O_NOCTTY";
        FLAG2[FLAG2["O_TRUNC"] = 512] = "O_TRUNC";
        FLAG2[FLAG2["O_APPEND"] = 1024] = "O_APPEND";
        FLAG2[FLAG2["O_NONBLOCK"] = 2048] = "O_NONBLOCK";
        FLAG2[FLAG2["O_DSYNC"] = 4096] = "O_DSYNC";
        FLAG2[FLAG2["FASYNC"] = 8192] = "FASYNC";
        FLAG2[FLAG2["O_DIRECT"] = 16384] = "O_DIRECT";
        FLAG2[FLAG2["O_LARGEFILE"] = 0] = "O_LARGEFILE";
        FLAG2[FLAG2["O_DIRECTORY"] = 65536] = "O_DIRECTORY";
        FLAG2[FLAG2["O_NOFOLLOW"] = 131072] = "O_NOFOLLOW";
        FLAG2[FLAG2["O_NOATIME"] = 262144] = "O_NOATIME";
        FLAG2[FLAG2["O_CLOEXEC"] = 524288] = "O_CLOEXEC";
        FLAG2[FLAG2["O_SYNC"] = 1052672] = "O_SYNC";
        FLAG2[FLAG2["O_NDELAY"] = 2048] = "O_NDELAY";
      })(FLAG || (exports.FLAG = FLAG = {}));
    }
  });

  // node_modules/@jsonjoy.com/fs-node-utils/lib/path.js
  var require_path2 = __commonJS({
    "node_modules/@jsonjoy.com/fs-node-utils/lib/path.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.basename = void 0;
      var basename = (path, separator) => {
        if (path[path.length - 1] === separator)
          path = path.slice(0, -1);
        const lastSlashIndex = path.lastIndexOf(separator);
        return lastSlashIndex === -1 ? path : path.slice(lastSlashIndex + 1);
      };
      exports.basename = basename;
    }
  });

  // node_modules/@jsonjoy.com/fs-node-builtins/lib/util.js
  var require_util = __commonJS({
    "node_modules/@jsonjoy.com/fs-node-builtins/lib/util.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.inherits = inherits;
      exports.promisify = promisify;
      exports.inspect = inspect;
      exports.format = format;
      function inherits(ctor, superCtor) {
        if (ctor === void 0 || ctor === null) {
          throw new TypeError("The constructor to inherit from is not defined");
        }
        if (superCtor === void 0 || superCtor === null) {
          throw new TypeError("The super constructor to inherit from is not defined");
        }
        ctor.super_ = superCtor;
        ctor.prototype = Object.create(superCtor.prototype, {
          constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
      }
      function promisify(fn) {
        if (typeof fn !== "function") {
          throw new TypeError('The "original" argument must be of type function');
        }
        return function(...args) {
          return new Promise((resolve, reject) => {
            fn.call(this, ...args, (err, result) => {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            });
          });
        };
      }
      function inspect(value) {
        if (value === null)
          return "null";
        if (value === void 0)
          return "undefined";
        if (typeof value === "string")
          return `'${value}'`;
        if (typeof value === "number" || typeof value === "boolean")
          return String(value);
        if (Array.isArray(value)) {
          const items = value.map((item) => inspect(item)).join(", ");
          return `[ ${items} ]`;
        }
        if (typeof value === "object") {
          const entries = Object.entries(value).map(([key, val]) => `${key}: ${inspect(val)}`).join(", ");
          return `{ ${entries} }`;
        }
        return String(value);
      }
      function format(template, ...args) {
        if (args.length === 0)
          return template;
        let result = template;
        let argIndex = 0;
        result = result.replace(/%[sdj%]/g, (match) => {
          if (argIndex >= args.length)
            return match;
          const arg = args[argIndex++];
          switch (match) {
            case "%s":
              return String(arg);
            case "%d":
              return Number(arg).toString();
            case "%j":
              try {
                return JSON.stringify(arg);
              } catch {
                return "[Circular]";
              }
            case "%%":
              return "%";
            default:
              return match;
          }
        });
        while (argIndex < args.length) {
          result += " " + String(args[argIndex++]);
        }
        return result;
      }
    }
  });

  // node_modules/@jsonjoy.com/fs-node-builtins/lib/internal/errors.js
  var require_errors = __commonJS({
    "node_modules/@jsonjoy.com/fs-node-builtins/lib/internal/errors.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.AssertionError = exports.RangeError = exports.TypeError = exports.Error = void 0;
      exports.message = message;
      exports.E = E;
      var util_1 = require_util();
      var kCode = typeof Symbol === "undefined" ? "_kCode" : Symbol("code");
      var messages = {};
      function makeNodeError(Base) {
        return class NodeError extends Base {
          constructor(key, ...args) {
            super(message(key, args));
            this.code = key;
            this[kCode] = key;
            this.name = `${super.name} [${this[kCode]}]`;
          }
        };
      }
      var g = typeof globalThis !== "undefined" ? globalThis : globalThis;
      var AssertionError = class extends g.Error {
        constructor(options) {
          if (typeof options !== "object" || options === null) {
            throw new exports.TypeError("ERR_INVALID_ARG_TYPE", "options", "object");
          }
          if (options.message) {
            super(options.message);
          } else {
            super(`${(0, util_1.inspect)(options.actual).slice(0, 128)} ${options.operator} ${(0, util_1.inspect)(options.expected).slice(0, 128)}`);
          }
          this.generatedMessage = !options.message;
          this.name = "AssertionError [ERR_ASSERTION]";
          this.code = "ERR_ASSERTION";
          this.actual = options.actual;
          this.expected = options.expected;
          this.operator = options.operator;
          exports.Error.captureStackTrace(this, options.stackStartFunction);
        }
      };
      exports.AssertionError = AssertionError;
      function message(key, args) {
        if (typeof key !== "string")
          throw new exports.Error("Error message key must be a string");
        const msg = messages[key];
        if (!msg)
          throw new exports.Error(`An invalid error message key was used: ${key}.`);
        let fmt;
        if (typeof msg === "function") {
          fmt = msg;
        } else {
          fmt = util_1.format;
          if (args === void 0 || args.length === 0)
            return msg;
          args.unshift(msg);
        }
        return String(fmt.apply(null, args));
      }
      function E(sym, val) {
        messages[sym] = typeof val === "function" ? val : String(val);
      }
      exports.Error = makeNodeError(g.Error);
      exports.TypeError = makeNodeError(g.TypeError);
      exports.RangeError = makeNodeError(g.RangeError);
      E("ERR_DIR_CLOSED", "Directory handle was closed");
      E("ERR_DIR_CONCURRENT_OPERATION", "Cannot do synchronous work on directory handle with concurrent asynchronous operations");
      E("ERR_INVALID_FILE_URL_HOST", 'File URL host must be "localhost" or empty on %s');
      E("ERR_INVALID_FILE_URL_PATH", "File URL path %s");
      E("ERR_INVALID_OPT_VALUE", (name, value) => {
        return `The value "${String(value)}" is invalid for option "${name}"`;
      });
      E("ERR_INVALID_OPT_VALUE_ENCODING", (value) => `The value "${String(value)}" is invalid for option "encoding"`);
      E("ERR_INVALID_ARG_VALUE", "Unable to open file as blob");
    }
  });

  // node_modules/@jsonjoy.com/fs-node-utils/lib/encoding.js
  var require_encoding = __commonJS({
    "node_modules/@jsonjoy.com/fs-node-utils/lib/encoding.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ENCODING_UTF8 = void 0;
      exports.assertEncoding = assertEncoding;
      exports.strToEncoding = strToEncoding;
      var buffer_1 = require_buffer3();
      var errors = require_errors();
      exports.ENCODING_UTF8 = "utf8";
      function assertEncoding(encoding) {
        if (encoding && !buffer_1.Buffer.isEncoding(encoding))
          throw new errors.TypeError("ERR_INVALID_OPT_VALUE_ENCODING", encoding);
      }
      function strToEncoding(str, encoding) {
        if (!encoding || encoding === exports.ENCODING_UTF8)
          return str;
        if (encoding === "buffer")
          return new buffer_1.Buffer(str);
        return new buffer_1.Buffer(str).toString(encoding);
      }
    }
  });

  // node_modules/@jsonjoy.com/fs-node-utils/lib/index.js
  var require_lib = __commonJS({
    "node_modules/@jsonjoy.com/fs-node-utils/lib/index.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
      tslib_1.__exportStar(require_types2(), exports);
      tslib_1.__exportStar(require_constants2(), exports);
      tslib_1.__exportStar(require_AMODE(), exports);
      tslib_1.__exportStar(require_FLAG(), exports);
      tslib_1.__exportStar(require_path2(), exports);
      tslib_1.__exportStar(require_encoding(), exports);
    }
  });

  // node_modules/@jsonjoy.com/fs-core/lib/Node.js
  var require_Node = __commonJS({
    "node_modules/@jsonjoy.com/fs-core/lib/Node.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Node = void 0;
      var fanout_1 = require_fanout();
      var process_1 = require_process2();
      var buffer_1 = require_buffer3();
      var fs_node_utils_1 = require_lib();
      var { S_IFMT, S_IFDIR, S_IFREG, S_IFLNK, S_IFCHR } = fs_node_utils_1.constants;
      var getuid = () => process_1.default.getuid?.() ?? 0;
      var getgid = () => process_1.default.getgid?.() ?? 0;
      var EMPTY_BUFFER = (0, buffer_1.bufferAllocUnsafe)(0);
      var Node = class {
        constructor(ino, mode = 438, uid = getuid(), gid = getgid()) {
          this.changes = new fanout_1.FanOut();
          this._uid = getuid();
          this._gid = getgid();
          this._atime = /* @__PURE__ */ new Date();
          this._mtime = /* @__PURE__ */ new Date();
          this._ctime = /* @__PURE__ */ new Date();
          this.buf = EMPTY_BUFFER;
          this.capacity = 0;
          this.size = 0;
          this.rdev = 0;
          this._nlink = 1;
          this.mode = mode;
          this.ino = ino;
          this._uid = uid;
          this._gid = gid;
        }
        set ctime(ctime) {
          this._ctime = ctime;
        }
        get ctime() {
          return this._ctime;
        }
        set uid(uid) {
          this._uid = uid;
          this.ctime = /* @__PURE__ */ new Date();
        }
        get uid() {
          return this._uid;
        }
        set gid(gid) {
          this._gid = gid;
          this.ctime = /* @__PURE__ */ new Date();
        }
        get gid() {
          return this._gid;
        }
        set atime(atime) {
          this._atime = atime;
        }
        get atime() {
          return this._atime;
        }
        set mtime(mtime) {
          this._mtime = mtime;
          this.ctime = /* @__PURE__ */ new Date();
        }
        get mtime() {
          return this._mtime;
        }
        get perm() {
          return this.mode & ~S_IFMT;
        }
        set perm(perm) {
          this.mode = this.mode & S_IFMT | perm & ~S_IFMT;
          this.ctime = /* @__PURE__ */ new Date();
        }
        set nlink(nlink) {
          this._nlink = nlink;
          this.ctime = /* @__PURE__ */ new Date();
        }
        get nlink() {
          return this._nlink;
        }
        getString(encoding = "utf8") {
          this.atime = /* @__PURE__ */ new Date();
          return this.getBuffer().toString(encoding);
        }
        setString(str) {
          this._setBuf((0, buffer_1.bufferFrom)(str, "utf8"));
        }
        getBuffer() {
          this.atime = /* @__PURE__ */ new Date();
          if (!this.buf)
            this.buf = (0, buffer_1.bufferAllocUnsafe)(0);
          return (0, buffer_1.bufferFrom)(this.buf.subarray(0, this.size));
        }
        setBuffer(buf) {
          const copy = (0, buffer_1.bufferFrom)(buf);
          this._setBuf(copy);
        }
        _setBuf(buf) {
          const size = buf.length;
          this.buf = buf;
          this.capacity = size;
          this.size = size;
          this.touch();
        }
        getSize() {
          return this.size;
        }
        setModeProperty(property) {
          this.mode = property;
        }
        isFile() {
          return (this.mode & S_IFMT) === S_IFREG;
        }
        isDirectory() {
          return (this.mode & S_IFMT) === S_IFDIR;
        }
        isSymlink() {
          return (this.mode & S_IFMT) === S_IFLNK;
        }
        isCharacterDevice() {
          return (this.mode & S_IFMT) === S_IFCHR;
        }
        makeSymlink(symlink) {
          this.mode = S_IFLNK | 438;
          this.symlink = symlink;
        }
        write(buf, off = 0, len = buf.length, pos = 0) {
          const bufLength = buf.length;
          if (off + len > bufLength)
            len = bufLength - off;
          if (len <= 0)
            return 0;
          const requiredSize = pos + len;
          if (requiredSize > this.capacity) {
            let newCapacity = Math.max(this.capacity * 2, 64);
            while (newCapacity < requiredSize)
              newCapacity *= 2;
            const newBuf = (0, buffer_1.bufferAllocUnsafe)(newCapacity);
            if (this.size > 0)
              this.buf.copy(newBuf, 0, 0, this.size);
            this.buf = newBuf;
            this.capacity = newCapacity;
          }
          if (pos > this.size)
            this.buf.fill(0, this.size, pos);
          buf.copy(this.buf, pos, off, off + len);
          if (requiredSize > this.size)
            this.size = requiredSize;
          this.touch();
          return len;
        }
        /**
         * Read data from the file.
         *
         * @param buf Buffer to read data into.
         * @param off Offset int the `buf` where to start writing data.
         * @param len How many bytes to read. Equals to `buf.byteLength` by default.
         * @param pos Position offset in file where to start reading. Defaults to `0`.
         * @returns Returns the number of bytes read.
         */
        read(buf, off = 0, len = buf.byteLength, pos = 0) {
          this.atime = /* @__PURE__ */ new Date();
          if (pos >= this.size)
            return 0;
          let actualLen = len;
          if (actualLen > buf.byteLength)
            actualLen = buf.byteLength;
          if (actualLen + pos > this.size)
            actualLen = this.size - pos;
          if (actualLen <= 0)
            return 0;
          const buf2 = buf instanceof buffer_1.Buffer ? buf : buffer_1.Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
          this.buf.copy(buf2, off, pos, pos + actualLen);
          return actualLen;
        }
        truncate(len = 0) {
          if (!len) {
            this.buf = EMPTY_BUFFER;
            this.capacity = 0;
            this.size = 0;
            this.touch();
            return;
          }
          if (len <= this.size)
            this.size = len;
          else {
            if (len > this.capacity) {
              let newCapacity = Math.max(this.capacity * 2, 64);
              while (newCapacity < len)
                newCapacity *= 2;
              const buf = (0, buffer_1.bufferAllocUnsafe)(newCapacity);
              if (this.size > 0)
                this.buf.copy(buf, 0, 0, this.size);
              buf.fill(0, this.size, len);
              this.buf = buf;
              this.capacity = newCapacity;
            } else
              this.buf.fill(0, this.size, len);
            this.size = len;
          }
          this.touch();
        }
        chmod(perm) {
          this.mode = this.mode & S_IFMT | perm & ~S_IFMT;
          this.touch();
        }
        chown(uid, gid) {
          this.uid = uid;
          this.gid = gid;
          this.touch();
        }
        touch() {
          this.mtime = /* @__PURE__ */ new Date();
          this.changes.emit(["modify"]);
        }
        canRead(uid = getuid(), gid = getgid()) {
          if (this.perm & 4) {
            return true;
          }
          if (gid === this.gid) {
            if (this.perm & 32) {
              return true;
            }
          }
          if (uid === this.uid) {
            if (this.perm & 256) {
              return true;
            }
          }
          return false;
        }
        canWrite(uid = getuid(), gid = getgid()) {
          if (this.perm & 2) {
            return true;
          }
          if (gid === this.gid) {
            if (this.perm & 16) {
              return true;
            }
          }
          if (uid === this.uid) {
            if (this.perm & 128) {
              return true;
            }
          }
          return false;
        }
        canExecute(uid = getuid(), gid = getgid()) {
          if (this.perm & 1) {
            return true;
          }
          if (gid === this.gid) {
            if (this.perm & 8) {
              return true;
            }
          }
          if (uid === this.uid) {
            if (this.perm & 64) {
              return true;
            }
          }
          return false;
        }
        del() {
          this.changes.emit(["delete"]);
        }
        toJSON() {
          return {
            ino: this.ino,
            uid: this.uid,
            gid: this.gid,
            atime: this.atime.getTime(),
            mtime: this.mtime.getTime(),
            ctime: this.ctime.getTime(),
            perm: this.perm,
            mode: this.mode,
            nlink: this.nlink,
            symlink: this.symlink,
            data: this.getString()
          };
        }
      };
      exports.Node = Node;
    }
  });

  // node_modules/@jsonjoy.com/fs-core/lib/Link.js
  var require_Link = __commonJS({
    "node_modules/@jsonjoy.com/fs-core/lib/Link.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Link = void 0;
      var fs_node_utils_1 = require_lib();
      var fanout_1 = require_fanout();
      var { S_IFREG } = fs_node_utils_1.constants;
      var Link = class _Link {
        get steps() {
          return this._steps;
        }
        // Recursively sync children steps, e.g. in case of dir rename
        set steps(val) {
          this._steps = val;
          for (const [child, link] of this.children.entries()) {
            if (child === "." || child === "..") {
              continue;
            }
            link?.syncSteps();
          }
        }
        constructor(vol, parent, name) {
          this.changes = new fanout_1.FanOut();
          this.children = /* @__PURE__ */ new Map();
          this._steps = [];
          this.ino = 0;
          this.length = 0;
          this.vol = vol;
          this.parent = parent;
          this.name = name;
          this.syncSteps();
        }
        setNode(node) {
          this.node = node;
          this.ino = node.ino;
        }
        getNode() {
          return this.node;
        }
        createChild(name, node = this.vol.createNode(S_IFREG | 438)) {
          const link = new _Link(this.vol, this, name);
          link.setNode(node);
          if (node.isDirectory()) {
            link.children.set(".", link);
            link.getNode().nlink++;
          }
          this.setChild(name, link);
          return link;
        }
        setChild(name, link = new _Link(this.vol, this, name)) {
          this.children.set(name, link);
          link.parent = this;
          this.length++;
          const node = link.getNode();
          if (node.isDirectory()) {
            link.children.set("..", this);
            this.getNode().nlink++;
          }
          this.getNode().mtime = /* @__PURE__ */ new Date();
          this.changes.emit(["child:add", link, this]);
          return link;
        }
        deleteChild(link) {
          const node = link.getNode();
          if (node.isDirectory()) {
            link.children.delete("..");
            this.getNode().nlink--;
          }
          this.children.delete(link.getName());
          this.length--;
          this.getNode().mtime = /* @__PURE__ */ new Date();
          this.changes.emit(["child:del", link, this]);
        }
        getChild(name) {
          this.getNode().atime = /* @__PURE__ */ new Date();
          return this.children.get(name);
        }
        getPath() {
          return this.steps.join(
            "/"
            /* PATH.SEP */
          );
        }
        getParentPath() {
          const parent = this.steps.slice(0, -1).join(
            "/"
            /* PATH.SEP */
          );
          return parent ? parent : "/";
        }
        getName() {
          return this.steps[this.steps.length - 1];
        }
        toJSON() {
          return {
            steps: this.steps,
            ino: this.ino,
            children: Array.from(this.children.keys())
          };
        }
        syncSteps() {
          this.steps = this.parent ? this.parent.steps.concat([this.name]) : [this.name];
        }
      };
      exports.Link = Link;
    }
  });

  // node_modules/@jsonjoy.com/fs-core/lib/File.js
  var require_File = __commonJS({
    "node_modules/@jsonjoy.com/fs-core/lib/File.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.File = void 0;
      var fs_node_utils_1 = require_lib();
      var { O_APPEND } = fs_node_utils_1.constants;
      var File = class {
        /**
         * Open a Link-Node pair. `node` is provided separately as that might be a different node
         * rather the one `link` points to, because it might be a symlink.
         * @param link
         * @param node
         * @param flags
         * @param fd
         */
        constructor(link, node, flags, fd) {
          this.link = link;
          this.node = node;
          this.flags = flags;
          this.fd = fd;
          this.position = 0;
          if (this.flags & O_APPEND)
            this.position = this.getSize();
        }
        getString(encoding = "utf8") {
          return this.node.getString();
        }
        setString(str) {
          this.node.setString(str);
        }
        getBuffer() {
          return this.node.getBuffer();
        }
        setBuffer(buf) {
          this.node.setBuffer(buf);
        }
        getSize() {
          return this.node.getSize();
        }
        truncate(len) {
          this.node.truncate(len);
        }
        seekTo(position) {
          this.position = position;
        }
        write(buf, offset = 0, length = buf.length, position) {
          if (typeof position !== "number")
            position = this.position;
          const bytes = this.node.write(buf, offset, length, position);
          this.position = position + bytes;
          return bytes;
        }
        read(buf, offset = 0, length = buf.byteLength, position) {
          if (typeof position !== "number")
            position = this.position;
          const bytes = this.node.read(buf, offset, length, position);
          this.position = position + bytes;
          return bytes;
        }
        chmod(perm) {
          this.node.chmod(perm);
        }
        chown(uid, gid) {
          this.node.chown(uid, gid);
        }
      };
      exports.File = File;
    }
  });

  // node_modules/@jsonjoy.com/fs-core/lib/encoding.js
  var require_encoding2 = __commonJS({
    "node_modules/@jsonjoy.com/fs-core/lib/encoding.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ENCODING_UTF8 = void 0;
      exports.assertEncoding = assertEncoding;
      exports.strToEncoding = strToEncoding;
      var buffer_1 = require_buffer3();
      var errors = require_errors();
      exports.ENCODING_UTF8 = "utf8";
      function assertEncoding(encoding) {
        if (encoding && !buffer_1.Buffer.isEncoding(encoding))
          throw new errors.TypeError("ERR_INVALID_OPT_VALUE_ENCODING", encoding);
      }
      function strToEncoding(str, encoding) {
        if (!encoding || encoding === exports.ENCODING_UTF8)
          return str;
        if (encoding === "buffer")
          return new buffer_1.Buffer(str);
        return new buffer_1.Buffer(str).toString(encoding);
      }
    }
  });

  // tools/_url-browser.js
  var require_url_browser = __commonJS({
    "tools/_url-browser.js"(exports, module) {
      "use strict";
      init_shim();
      var g = typeof globalThis !== "undefined" ? globalThis : self;
      var URL = g.URL;
      var URLSearchParams = g.URLSearchParams;
      function fileURLToPath(u) {
        const url = typeof u === "string" ? new URL(u) : u;
        if (url.protocol !== "file:")
          throw new TypeError("The URL must be of scheme file");
        return decodeURIComponent(url.pathname);
      }
      function pathToFileURL(p) {
        return new URL("file://" + encodeURI(String(p).replace(/\\/g, "/")));
      }
      module.exports = { URL, URLSearchParams, fileURLToPath, pathToFileURL };
      module.exports.default = module.exports;
    }
  });

  // node_modules/@jsonjoy.com/fs-core/lib/util.js
  var require_util2 = __commonJS({
    "node_modules/@jsonjoy.com/fs-core/lib/util.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.filenameToSteps = exports.resolve = exports.unixify = exports.isWin = void 0;
      exports.isFd = isFd;
      exports.validateFd = validateFd;
      exports.dataToBuffer = dataToBuffer;
      exports.nullCheck = nullCheck;
      exports.pathToFilename = pathToFilename;
      exports.createError = createError;
      exports.createStatError = createStatError;
      var path_1 = require_path();
      var buffer_1 = require_buffer3();
      var errors = require_errors();
      var process_1 = require_process2();
      var encoding_1 = require_encoding2();
      var fs_node_utils_1 = require_lib();
      exports.isWin = process_1.default.platform === "win32";
      var resolveCrossPlatform = path_1.resolve;
      var pathSep = path_1.posix ? path_1.posix.sep : path_1.sep;
      var isSeparator = (str, i) => {
        let char = str[i];
        return i > 0 && (char === "/" || exports.isWin && char === "\\");
      };
      var removeTrailingSeparator = (str) => {
        let i = str.length - 1;
        if (i < 2)
          return str;
        while (isSeparator(str, i))
          i--;
        return str.substr(0, i + 1);
      };
      var normalizePath = (str, stripTrailing) => {
        if (typeof str !== "string")
          throw new TypeError("expected a string");
        str = str.replace(/[\\\/]+/g, "/");
        if (stripTrailing !== false)
          str = removeTrailingSeparator(str);
        return str;
      };
      var unixify = (filepath, stripTrailing = true) => {
        if (exports.isWin) {
          filepath = normalizePath(filepath, stripTrailing);
          return filepath.replace(/^([a-zA-Z]+:|\.\/)/, "");
        }
        return filepath;
      };
      exports.unixify = unixify;
      var resolve = (filename, base = process_1.default.cwd()) => resolveCrossPlatform(base, filename);
      exports.resolve = resolve;
      if (exports.isWin) {
        const _resolve = resolve;
        exports.resolve = resolve = (filename, base) => (0, exports.unixify)(_resolve(filename, base));
      }
      var filenameToSteps = (filename, base) => {
        const fullPath = resolve(filename, base);
        const fullPathSansSlash = fullPath.substring(1);
        if (!fullPathSansSlash)
          return [];
        return fullPathSansSlash.split(pathSep);
      };
      exports.filenameToSteps = filenameToSteps;
      function isFd(path) {
        return path >>> 0 === path;
      }
      function validateFd(fd) {
        if (!isFd(fd))
          throw TypeError(fs_node_utils_1.ERRSTR.FD);
      }
      function dataToBuffer(data, encoding = encoding_1.ENCODING_UTF8) {
        if (buffer_1.Buffer.isBuffer(data))
          return data;
        else if (data instanceof Uint8Array)
          return (0, buffer_1.bufferFrom)(data);
        else if (encoding === "buffer")
          return (0, buffer_1.bufferFrom)(String(data), "utf8");
        else
          return (0, buffer_1.bufferFrom)(String(data), encoding);
      }
      function nullCheck(path, callback) {
        if (("" + path).indexOf("\0") !== -1) {
          const er = new Error("Path must be a string without null bytes");
          er.code = "ENOENT";
          if (typeof callback !== "function")
            throw er;
          Promise.resolve().then(() => callback(er));
          return false;
        }
        return true;
      }
      function getPathFromURLPosix(url) {
        if (url.hostname !== "") {
          throw new errors.TypeError("ERR_INVALID_FILE_URL_HOST", process_1.default.platform);
        }
        const pathname = url.pathname;
        for (let n = 0; n < pathname.length; n++) {
          if (pathname[n] === "%") {
            const third = pathname.codePointAt(n + 2) | 32;
            if (pathname[n + 1] === "2" && third === 102) {
              throw new errors.TypeError("ERR_INVALID_FILE_URL_PATH", "must not include encoded / characters");
            }
          }
        }
        return decodeURIComponent(pathname);
      }
      function pathToFilename(path) {
        if (path instanceof Uint8Array) {
          path = (0, buffer_1.bufferFrom)(path);
        }
        if (typeof path !== "string" && !buffer_1.Buffer.isBuffer(path)) {
          try {
            if (!(path instanceof require_url_browser().URL))
              throw new TypeError(fs_node_utils_1.ERRSTR.PATH_STR);
          } catch (err) {
            throw new TypeError(fs_node_utils_1.ERRSTR.PATH_STR);
          }
          path = getPathFromURLPosix(path);
        }
        const pathString = String(path);
        nullCheck(pathString);
        return pathString;
      }
      var ENOENT = "ENOENT";
      var EBADF = "EBADF";
      var EINVAL = "EINVAL";
      var EPERM = "EPERM";
      var EPROTO = "EPROTO";
      var EEXIST = "EEXIST";
      var ENOTDIR = "ENOTDIR";
      var EMFILE = "EMFILE";
      var EACCES = "EACCES";
      var EISDIR = "EISDIR";
      var ENOTEMPTY = "ENOTEMPTY";
      var ENOSYS = "ENOSYS";
      var ERR_FS_EISDIR = "ERR_FS_EISDIR";
      var ERR_OUT_OF_RANGE = "ERR_OUT_OF_RANGE";
      function formatError(errorCode, func = "", path = "", path2 = "") {
        let pathFormatted = "";
        if (path)
          pathFormatted = ` '${path}'`;
        if (path2)
          pathFormatted += ` -> '${path2}'`;
        switch (errorCode) {
          case ENOENT:
            return `ENOENT: no such file or directory, ${func}${pathFormatted}`;
          case EBADF:
            return `EBADF: bad file descriptor, ${func}${pathFormatted}`;
          case EINVAL:
            return `EINVAL: invalid argument, ${func}${pathFormatted}`;
          case EPERM:
            return `EPERM: operation not permitted, ${func}${pathFormatted}`;
          case EPROTO:
            return `EPROTO: protocol error, ${func}${pathFormatted}`;
          case EEXIST:
            return `EEXIST: file already exists, ${func}${pathFormatted}`;
          case ENOTDIR:
            return `ENOTDIR: not a directory, ${func}${pathFormatted}`;
          case EISDIR:
            return `EISDIR: illegal operation on a directory, ${func}${pathFormatted}`;
          case EACCES:
            return `EACCES: permission denied, ${func}${pathFormatted}`;
          case ENOTEMPTY:
            return `ENOTEMPTY: directory not empty, ${func}${pathFormatted}`;
          case EMFILE:
            return `EMFILE: too many open files, ${func}${pathFormatted}`;
          case ENOSYS:
            return `ENOSYS: function not implemented, ${func}${pathFormatted}`;
          case ERR_FS_EISDIR:
            return `[ERR_FS_EISDIR]: Path is a directory: ${func} returned EISDIR (is a directory) ${path}`;
          case ERR_OUT_OF_RANGE:
            return `[ERR_OUT_OF_RANGE]: value out of range, ${func}${pathFormatted}`;
          default:
            return `${errorCode}: error occurred, ${func}${pathFormatted}`;
        }
      }
      function createError(errorCode, func = "", path = "", path2 = "", Constructor = Error) {
        const error = new Constructor(formatError(errorCode, func, path, path2));
        error.code = errorCode;
        if (path) {
          error.path = path;
        }
        return error;
      }
      function createStatError(errorCode, func = "", path = "", path2 = "") {
        return {
          code: errorCode,
          message: formatError(errorCode, func, path, path2),
          path,
          toError() {
            const error = new Error(this.message);
            error.code = this.code;
            if (this.path) {
              error.path = this.path;
            }
            return error;
          }
        };
      }
    }
  });

  // node_modules/@jsonjoy.com/fs-core/lib/Superblock.js
  var require_Superblock = __commonJS({
    "node_modules/@jsonjoy.com/fs-core/lib/Superblock.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Superblock = void 0;
      var path_1 = require_path();
      var Node_1 = require_Node();
      var Link_1 = require_Link();
      var File_1 = require_File();
      var buffer_1 = require_buffer3();
      var process_1 = require_process2();
      var fs_node_utils_1 = require_lib();
      var fs_node_utils_2 = require_lib();
      var util_1 = require_util2();
      var json_1 = require_json();
      var result_1 = require_result();
      var pathSep = path_1.posix ? path_1.posix.sep : path_1.sep;
      var pathRelative = path_1.posix ? path_1.posix.relative : path_1.relative;
      var pathJoin = path_1.posix ? path_1.posix.join : path_1.join;
      var { O_RDONLY, O_WRONLY, O_RDWR, O_CREAT, O_EXCL, O_TRUNC, O_APPEND, O_DIRECTORY } = fs_node_utils_1.constants;
      var Superblock = class _Superblock {
        static fromJSON(json, cwd, opts) {
          const vol = new _Superblock(opts);
          vol.fromJSON(json, cwd);
          return vol;
        }
        static fromNestedJSON(json, cwd, opts) {
          const vol = new _Superblock(opts);
          vol.fromNestedJSON(json, cwd);
          return vol;
        }
        constructor(opts = {}) {
          this.ino = 0;
          this.inodes = {};
          this.releasedInos = [];
          this.fds = {};
          this.releasedFds = [];
          this.maxFiles = 1e4;
          this.openFiles = 0;
          this.open = (filename, flagsNum, modeNum, resolveSymlinks = true) => {
            const file = this.openFile(filename, flagsNum, modeNum, resolveSymlinks);
            if (!file)
              throw (0, util_1.createError)("ENOENT", "open", filename);
            return file.fd;
          };
          this.writeFile = (id, buf, flagsNum, modeNum) => {
            const isUserFd = typeof id === "number";
            let fd;
            if (isUserFd)
              fd = id;
            else
              fd = this.open((0, util_1.pathToFilename)(id), flagsNum, modeNum);
            let offset = 0;
            let length = buf.length;
            let position = flagsNum & O_APPEND ? void 0 : 0;
            try {
              while (length > 0) {
                const written = this.write(fd, buf, offset, length, position);
                offset += written;
                length -= written;
                if (position !== void 0)
                  position += written;
              }
            } finally {
              if (!isUserFd)
                this.close(fd);
            }
          };
          this.read = (fd, buffer, offset, length, position) => {
            if (buffer.byteLength < length) {
              throw (0, util_1.createError)("ERR_OUT_OF_RANGE", "read", void 0, void 0, RangeError);
            }
            const file = this.getFileByFdOrThrow(fd);
            if (file.node.isSymlink()) {
              throw (0, util_1.createError)("EPERM", "read", file.link.getPath());
            }
            return file.read(buffer, Number(offset), Number(length), position === -1 || typeof position !== "number" ? void 0 : position);
          };
          this.readv = (fd, buffers, position) => {
            const file = this.getFileByFdOrThrow(fd);
            let p = position ?? void 0;
            if (p === -1)
              p = void 0;
            let bytesRead = 0;
            for (const buffer of buffers) {
              const bytes = file.read(buffer, 0, buffer.byteLength, p);
              p = void 0;
              bytesRead += bytes;
              if (bytes < buffer.byteLength)
                break;
            }
            return bytesRead;
          };
          this.link = (filename1, filename2) => {
            let link1;
            try {
              link1 = this.getLinkOrThrow(filename1, "link");
            } catch (err) {
              if (err.code)
                err = (0, util_1.createError)(err.code, "link", filename1, filename2);
              throw err;
            }
            const dirname2 = (0, path_1.dirname)(filename2);
            let dir2;
            try {
              dir2 = this.getLinkOrThrow(dirname2, "link");
            } catch (err) {
              if (err.code)
                err = (0, util_1.createError)(err.code, "link", filename1, filename2);
              throw err;
            }
            const name = (0, path_1.basename)(filename2);
            if (dir2.getChild(name))
              throw (0, util_1.createError)("EEXIST", "link", filename1, filename2);
            const node = link1.getNode();
            node.nlink++;
            dir2.createChild(name, node);
          };
          this.unlink = (filename) => {
            const link = this.getLinkOrThrow(filename, "unlink");
            if (link.length)
              throw Error("Dir not empty...");
            this.deleteLink(link);
            const node = link.getNode();
            node.nlink--;
            if (node.nlink <= 0) {
              this.deleteNode(node);
            }
          };
          this.symlink = (targetFilename, pathFilename) => {
            const pathSteps = (0, util_1.filenameToSteps)(pathFilename);
            let dirLink;
            try {
              dirLink = this.getLinkParentAsDirOrThrow(pathSteps);
            } catch (err) {
              if (err.code)
                err = (0, util_1.createError)(err.code, "symlink", targetFilename, pathFilename);
              throw err;
            }
            const name = pathSteps[pathSteps.length - 1];
            if (dirLink.getChild(name))
              throw (0, util_1.createError)("EEXIST", "symlink", targetFilename, pathFilename);
            const node = dirLink.getNode();
            if (!node.canExecute() || !node.canWrite())
              throw (0, util_1.createError)("EACCES", "symlink", targetFilename, pathFilename);
            const symlink = dirLink.createChild(name);
            symlink.getNode().makeSymlink(targetFilename);
            return symlink;
          };
          this.rename = (oldPathFilename, newPathFilename) => {
            let link;
            try {
              link = this.getResolvedLinkOrThrow(oldPathFilename);
            } catch (err) {
              if (err.code)
                err = (0, util_1.createError)(err.code, "rename", oldPathFilename, newPathFilename);
              throw err;
            }
            let newPathDirLink;
            try {
              newPathDirLink = this.getLinkParentAsDirOrThrow(newPathFilename);
            } catch (err) {
              if (err.code)
                err = (0, util_1.createError)(err.code, "rename", oldPathFilename, newPathFilename);
              throw err;
            }
            const oldLinkParent = link.parent;
            if (!oldLinkParent)
              throw (0, util_1.createError)("EINVAL", "rename", oldPathFilename, newPathFilename);
            const oldParentNode = oldLinkParent.getNode();
            const newPathDirNode = newPathDirLink.getNode();
            if (!oldParentNode.canExecute() || !oldParentNode.canWrite() || !newPathDirNode.canExecute() || !newPathDirNode.canWrite()) {
              throw (0, util_1.createError)("EACCES", "rename", oldPathFilename, newPathFilename);
            }
            oldLinkParent.deleteChild(link);
            const name = (0, path_1.basename)(newPathFilename);
            link.name = name;
            link.steps = [...newPathDirLink.steps, name];
            newPathDirLink.setChild(link.getName(), link);
          };
          this.mkdir = (filename, modeNum) => {
            const steps = (0, util_1.filenameToSteps)(filename);
            if (!steps.length)
              throw (0, util_1.createError)("EEXIST", "mkdir", filename);
            const dir = this.getLinkParentAsDirOrThrow(filename, "mkdir");
            const name = steps[steps.length - 1];
            if (dir.getChild(name))
              throw (0, util_1.createError)("EEXIST", "mkdir", filename);
            const node = dir.getNode();
            if (!node.canWrite() || !node.canExecute())
              throw (0, util_1.createError)("EACCES", "mkdir", filename);
            dir.createChild(name, this.createNode(fs_node_utils_1.constants.S_IFDIR | modeNum));
          };
          this.mkdirp = (filename, modeNum) => {
            let created = false;
            const steps = (0, util_1.filenameToSteps)(filename);
            let curr = null;
            let i = steps.length;
            for (i = steps.length; i >= 0; i--) {
              curr = this.getResolvedLink(steps.slice(0, i));
              if (curr)
                break;
            }
            if (!curr) {
              curr = this.root;
              i = 0;
            }
            curr = this.getResolvedLinkOrThrow(path_1.sep + steps.slice(0, i).join(path_1.sep), "mkdir");
            for (i; i < steps.length; i++) {
              const node = curr.getNode();
              if (node.isDirectory()) {
                if (!node.canExecute() || !node.canWrite())
                  throw (0, util_1.createError)("EACCES", "mkdir", filename);
              } else {
                throw (0, util_1.createError)("ENOTDIR", "mkdir", filename);
              }
              created = true;
              curr = curr.createChild(steps[i], this.createNode(fs_node_utils_1.constants.S_IFDIR | modeNum));
            }
            return created ? filename : void 0;
          };
          this.rmdir = (filename, recursive = false) => {
            const link = this.getLinkAsDirOrThrow(filename, "rmdir");
            if (link.length && !recursive)
              throw (0, util_1.createError)("ENOTEMPTY", "rmdir", filename);
            this.deleteLink(link);
          };
          this.rm = (filename, force = false, recursive = false) => {
            let link;
            try {
              link = this.getResolvedLinkOrThrow(filename, "stat");
            } catch (err) {
              if (err.code === "ENOENT" && force)
                return;
              else
                throw err;
            }
            if (link.getNode().isDirectory() && !recursive)
              throw (0, util_1.createError)("ERR_FS_EISDIR", "rm", filename);
            if (!link.parent?.getNode().canWrite())
              throw (0, util_1.createError)("EACCES", "rm", filename);
            this.deleteLink(link);
          };
          this.close = (fd) => {
            (0, util_1.validateFd)(fd);
            const file = this.getFileByFdOrThrow(fd, "close");
            this.closeFile(file);
          };
          this.process = opts.process ?? process_1.default;
          const root = this.createLink();
          root.setNode(this.createNode(fs_node_utils_1.constants.S_IFDIR | 511));
          root.setChild(".", root);
          root.getNode().nlink++;
          root.setChild("..", root);
          root.getNode().nlink++;
          this.root = root;
        }
        createLink(parent, name, isDirectory = false, mode) {
          if (!parent) {
            return new Link_1.Link(this, void 0, "");
          }
          if (!name) {
            throw new Error("createLink: name cannot be empty");
          }
          const finalPerm = mode ?? (isDirectory ? 511 : 438);
          const hasFileType = mode && mode & fs_node_utils_1.constants.S_IFMT;
          const modeType = hasFileType ? mode & fs_node_utils_1.constants.S_IFMT : isDirectory ? fs_node_utils_1.constants.S_IFDIR : fs_node_utils_1.constants.S_IFREG;
          const finalMode = finalPerm & ~fs_node_utils_1.constants.S_IFMT | modeType;
          return parent.createChild(name, this.createNode(finalMode));
        }
        deleteLink(link) {
          const parent = link.parent;
          if (parent) {
            parent.deleteChild(link);
            return true;
          }
          return false;
        }
        newInoNumber() {
          const releasedFd = this.releasedInos.pop();
          if (releasedFd)
            return releasedFd;
          else {
            this.ino = (this.ino + 1) % 4294967295;
            return this.ino;
          }
        }
        newFdNumber() {
          const releasedFd = this.releasedFds.pop();
          return typeof releasedFd === "number" ? releasedFd : _Superblock.fd--;
        }
        createNode(mode) {
          const uid = this.process.getuid?.() ?? 0;
          const gid = this.process.getgid?.() ?? 0;
          const node = new Node_1.Node(this.newInoNumber(), mode, uid, gid);
          this.inodes[node.ino] = node;
          return node;
        }
        deleteNode(node) {
          node.del();
          delete this.inodes[node.ino];
          this.releasedInos.push(node.ino);
        }
        walk(stepsOrFilenameOrLink, resolveSymlinks = false, checkExistence = false, checkAccess = false, funcName) {
          let steps;
          let filename;
          if (stepsOrFilenameOrLink instanceof Link_1.Link) {
            steps = stepsOrFilenameOrLink.steps;
            filename = pathSep + steps.join(pathSep);
          } else if (typeof stepsOrFilenameOrLink === "string") {
            steps = (0, util_1.filenameToSteps)(stepsOrFilenameOrLink);
            filename = stepsOrFilenameOrLink;
          } else {
            steps = stepsOrFilenameOrLink;
            filename = pathSep + steps.join(pathSep);
          }
          let curr = this.root;
          let i = 0;
          const uid = this.process.getuid?.() ?? 0;
          const gid = this.process.getgid?.() ?? 0;
          while (i < steps.length) {
            let node = curr.getNode();
            if (node.isDirectory()) {
              if (checkAccess && !node.canExecute(uid, gid)) {
                return (0, result_1.Err)((0, util_1.createStatError)("EACCES", funcName, filename));
              }
            } else {
              if (i < steps.length - 1) {
                return (0, result_1.Err)((0, util_1.createStatError)("ENOTDIR", funcName, filename));
              }
            }
            curr = curr.getChild(steps[i]) ?? null;
            if (!curr)
              if (checkExistence) {
                return (0, result_1.Err)((0, util_1.createStatError)("ENOENT", funcName, filename));
              } else {
                return (0, result_1.Ok)(null);
              }
            node = curr?.getNode();
            if (node.isSymlink() && (resolveSymlinks || i < steps.length - 1)) {
              const resolvedPath = (0, path_1.isAbsolute)(node.symlink) ? node.symlink : pathJoin((0, path_1.dirname)(curr.getPath()), node.symlink);
              steps = (0, util_1.filenameToSteps)(resolvedPath).concat(steps.slice(i + 1));
              curr = this.root;
              i = 0;
              continue;
            }
            if (checkExistence && !node.isDirectory() && i < steps.length - 1) {
              const errorCode = this.process.platform === "win32" ? "ENOENT" : "ENOTDIR";
              return (0, result_1.Err)((0, util_1.createStatError)(errorCode, funcName, filename));
            }
            i++;
          }
          return (0, result_1.Ok)(curr);
        }
        // Returns a `Link` (hard link) referenced by path "split" into steps.
        getLink(steps) {
          const result = this.walk(steps, false, false, false);
          if (result.ok) {
            return result.value;
          }
          throw result.err.toError();
        }
        // Just link `getLink`, but throws a correct user error, if link to found.
        getLinkOrThrow(filename, funcName) {
          const result = this.walk(filename, false, true, true, funcName);
          if (result.ok) {
            return result.value;
          }
          throw result.err.toError();
        }
        // Just like `getLink`, but also dereference/resolves symbolic links.
        getResolvedLink(filenameOrSteps) {
          const result = this.walk(filenameOrSteps, true, false, false);
          if (result.ok) {
            return result.value;
          }
          throw result.err.toError();
        }
        /**
         * Just like `getLinkOrThrow`, but also dereference/resolves symbolic links.
         */
        getResolvedLinkOrThrow(filename, funcName) {
          const result = this.walk(filename, true, true, true, funcName);
          if (result.ok) {
            return result.value;
          }
          throw result.err.toError();
        }
        getResolvedLinkResult(filename, funcName) {
          const result = this.walk(filename, true, true, true, funcName);
          if (result.ok) {
            return (0, result_1.Ok)(result.value);
          }
          return result;
        }
        resolveSymlinks(link) {
          return this.getResolvedLink(link.steps.slice(1));
        }
        /**
         * Just like `getLinkOrThrow`, but also verifies that the link is a directory.
         */
        getLinkAsDirOrThrow(filename, funcName) {
          const link = this.getLinkOrThrow(filename, funcName);
          if (!link.getNode().isDirectory())
            throw (0, util_1.createError)("ENOTDIR", funcName, filename);
          return link;
        }
        // Get the immediate parent directory of the link.
        getLinkParent(steps) {
          return this.getLink(steps.slice(0, -1));
        }
        getLinkParentAsDirOrThrow(filenameOrSteps, funcName) {
          const steps = (filenameOrSteps instanceof Array ? filenameOrSteps : (0, util_1.filenameToSteps)(filenameOrSteps)).slice(0, -1);
          const filename = pathSep + steps.join(pathSep);
          const link = this.getLinkOrThrow(filename, funcName);
          if (!link.getNode().isDirectory())
            throw (0, util_1.createError)("ENOTDIR", funcName, filename);
          return link;
        }
        getFileByFd(fd) {
          return this.fds[String(fd)];
        }
        getFileByFdOrThrow(fd, funcName) {
          if (!(0, util_1.isFd)(fd))
            throw TypeError(fs_node_utils_2.ERRSTR.FD);
          const file = this.getFileByFd(fd);
          if (!file)
            throw (0, util_1.createError)("EBADF", funcName);
          return file;
        }
        _toJSON(link = this.root, json = {}, path, asBuffer) {
          let isEmpty = true;
          let children = link.children;
          if (link.getNode().isFile()) {
            children = /* @__PURE__ */ new Map([[link.getName(), link.parent.getChild(link.getName())]]);
            link = link.parent;
          }
          for (const name of children.keys()) {
            if (name === "." || name === "..") {
              continue;
            }
            isEmpty = false;
            const child = link.getChild(name);
            if (!child) {
              throw new Error("_toJSON: unexpected undefined");
            }
            const node = child.getNode();
            if (node.isFile()) {
              let filename = child.getPath();
              if (path)
                filename = pathRelative(path, filename);
              json[filename] = asBuffer ? node.getBuffer() : node.getString();
            } else if (node.isDirectory()) {
              this._toJSON(child, json, path, asBuffer);
            }
          }
          let dirPath = link.getPath();
          if (path)
            dirPath = pathRelative(path, dirPath);
          if (dirPath && isEmpty) {
            json[dirPath] = null;
          }
          return json;
        }
        toJSON(paths, json = {}, isRelative = false, asBuffer = false) {
          const links = [];
          if (paths) {
            if (!Array.isArray(paths))
              paths = [paths];
            for (const path of paths) {
              const filename = (0, util_1.pathToFilename)(path);
              const link = this.getResolvedLink(filename);
              if (!link)
                continue;
              links.push(link);
            }
          } else {
            links.push(this.root);
          }
          if (!links.length)
            return json;
          for (const link of links)
            this._toJSON(link, json, isRelative ? link.getPath() : "", asBuffer);
          return json;
        }
        fromJSON(json, cwd = this.process.cwd()) {
          for (let filename in json) {
            const data = json[filename];
            filename = (0, util_1.resolve)(filename, cwd);
            if (typeof data === "string" || data instanceof buffer_1.Buffer) {
              const dir = (0, path_1.dirname)(filename);
              this.mkdirp(
                dir,
                511
                /* MODE.DIR */
              );
              const buffer = (0, util_1.dataToBuffer)(data);
              this.writeFile(
                filename,
                buffer,
                fs_node_utils_2.FLAGS.w,
                438
                /* MODE.DEFAULT */
              );
            } else {
              this.mkdirp(
                filename,
                511
                /* MODE.DIR */
              );
            }
          }
        }
        fromNestedJSON(json, cwd) {
          this.fromJSON((0, json_1.flattenJSON)(json), cwd);
        }
        reset() {
          this.ino = 0;
          this.inodes = {};
          this.releasedInos = [];
          this.fds = {};
          this.releasedFds = [];
          this.openFiles = 0;
          this.root = this.createLink();
          this.root.setNode(this.createNode(fs_node_utils_1.constants.S_IFDIR | 511));
        }
        // Legacy interface
        mountSync(mountpoint, json) {
          this.fromJSON(json, mountpoint);
        }
        openLink(link, flagsNum, resolveSymlinks = true) {
          if (this.openFiles >= this.maxFiles) {
            throw (0, util_1.createError)("EMFILE", "open", link.getPath());
          }
          let realLink = link;
          if (resolveSymlinks)
            realLink = this.getResolvedLinkOrThrow(link.getPath(), "open");
          const node = realLink.getNode();
          if (node.isDirectory()) {
            if ((flagsNum & (O_RDONLY | O_RDWR | O_WRONLY)) !== O_RDONLY)
              throw (0, util_1.createError)("EISDIR", "open", link.getPath());
          } else {
            if (flagsNum & O_DIRECTORY)
              throw (0, util_1.createError)("ENOTDIR", "open", link.getPath());
          }
          if ((flagsNum & (O_RDONLY | O_RDWR | O_WRONLY)) !== O_WRONLY) {
            if (!node.canRead()) {
              throw (0, util_1.createError)("EACCES", "open", link.getPath());
            }
          }
          if (flagsNum & (O_WRONLY | O_RDWR)) {
            if (!node.canWrite()) {
              throw (0, util_1.createError)("EACCES", "open", link.getPath());
            }
          }
          const file = new File_1.File(link, node, flagsNum, this.newFdNumber());
          this.fds[file.fd] = file;
          this.openFiles++;
          if (flagsNum & O_TRUNC)
            file.truncate();
          return file;
        }
        openFile(filename, flagsNum, modeNum, resolveSymlinks = true) {
          const steps = (0, util_1.filenameToSteps)(filename);
          let link;
          try {
            link = resolveSymlinks ? this.getResolvedLinkOrThrow(filename, "open") : this.getLinkOrThrow(filename, "open");
            if (link && flagsNum & O_CREAT && flagsNum & O_EXCL)
              throw (0, util_1.createError)("EEXIST", "open", filename);
          } catch (err) {
            if (err.code === "ENOENT" && flagsNum & O_CREAT) {
              const dirName = (0, path_1.dirname)(filename);
              const dirLink = this.getResolvedLinkOrThrow(dirName);
              const dirNode = dirLink.getNode();
              if (!dirNode.isDirectory())
                throw (0, util_1.createError)("ENOTDIR", "open", filename);
              if (!dirNode.canExecute() || !dirNode.canWrite())
                throw (0, util_1.createError)("EACCES", "open", filename);
              modeNum ?? (modeNum = 438);
              link = this.createLink(dirLink, steps[steps.length - 1], false, modeNum);
            } else
              throw err;
          }
          if (link)
            return this.openLink(link, flagsNum, resolveSymlinks);
          throw (0, util_1.createError)("ENOENT", "open", filename);
        }
        closeFile(file) {
          if (!this.fds[file.fd])
            return;
          this.openFiles--;
          delete this.fds[file.fd];
          this.releasedFds.push(file.fd);
        }
        write(fd, buf, offset, length, position) {
          const file = this.getFileByFdOrThrow(fd, "write");
          if (file.node.isSymlink()) {
            throw (0, util_1.createError)("EBADF", "write", file.link.getPath());
          }
          return file.write(buf, offset, length, position === -1 || typeof position !== "number" ? void 0 : position);
        }
      };
      exports.Superblock = Superblock;
      Superblock.fd = 2147483647;
    }
  });

  // node_modules/@jsonjoy.com/fs-core/lib/index.js
  var require_lib2 = __commonJS({
    "node_modules/@jsonjoy.com/fs-core/lib/index.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.resolve = exports.pathToFilename = exports.createStatError = exports.createError = exports.validateFd = exports.isFd = exports.filenameToSteps = exports.dataToBuffer = exports.Superblock = exports.File = exports.Link = exports.Node = void 0;
      var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
      tslib_1.__exportStar(require_types(), exports);
      tslib_1.__exportStar(require_json(), exports);
      tslib_1.__exportStar(require_constants(), exports);
      tslib_1.__exportStar(require_result(), exports);
      var Node_1 = require_Node();
      Object.defineProperty(exports, "Node", { enumerable: true, get: function() {
        return Node_1.Node;
      } });
      var Link_1 = require_Link();
      Object.defineProperty(exports, "Link", { enumerable: true, get: function() {
        return Link_1.Link;
      } });
      var File_1 = require_File();
      Object.defineProperty(exports, "File", { enumerable: true, get: function() {
        return File_1.File;
      } });
      var Superblock_1 = require_Superblock();
      Object.defineProperty(exports, "Superblock", { enumerable: true, get: function() {
        return Superblock_1.Superblock;
      } });
      var util_1 = require_util2();
      Object.defineProperty(exports, "dataToBuffer", { enumerable: true, get: function() {
        return util_1.dataToBuffer;
      } });
      Object.defineProperty(exports, "filenameToSteps", { enumerable: true, get: function() {
        return util_1.filenameToSteps;
      } });
      Object.defineProperty(exports, "isFd", { enumerable: true, get: function() {
        return util_1.isFd;
      } });
      Object.defineProperty(exports, "validateFd", { enumerable: true, get: function() {
        return util_1.validateFd;
      } });
      Object.defineProperty(exports, "createError", { enumerable: true, get: function() {
        return util_1.createError;
      } });
      Object.defineProperty(exports, "createStatError", { enumerable: true, get: function() {
        return util_1.createStatError;
      } });
      Object.defineProperty(exports, "pathToFilename", { enumerable: true, get: function() {
        return util_1.pathToFilename;
      } });
      Object.defineProperty(exports, "resolve", { enumerable: true, get: function() {
        return util_1.resolve;
      } });
    }
  });

  // node_modules/@jsonjoy.com/fs-node/lib/Stats.js
  var require_Stats = __commonJS({
    "node_modules/@jsonjoy.com/fs-node/lib/Stats.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Stats = void 0;
      var fs_node_utils_1 = require_lib();
      var { S_IFMT, S_IFDIR, S_IFREG, S_IFBLK, S_IFCHR, S_IFLNK, S_IFIFO, S_IFSOCK } = fs_node_utils_1.constants;
      var Stats = class _Stats {
        static build(node, bigint = false) {
          const stats = new _Stats();
          const { uid, gid, atime, mtime, ctime } = node;
          const getStatNumber = !bigint ? (number) => number : (number) => BigInt(number);
          stats.uid = getStatNumber(uid);
          stats.gid = getStatNumber(gid);
          stats.rdev = getStatNumber(node.rdev);
          stats.blksize = getStatNumber(4096);
          stats.ino = getStatNumber(node.ino);
          stats.size = getStatNumber(node.getSize());
          stats.blocks = getStatNumber(1);
          stats.atime = atime;
          stats.mtime = mtime;
          stats.ctime = ctime;
          stats.birthtime = ctime;
          stats.atimeMs = getStatNumber(atime.getTime());
          stats.mtimeMs = getStatNumber(mtime.getTime());
          const ctimeMs = getStatNumber(ctime.getTime());
          stats.ctimeMs = ctimeMs;
          stats.birthtimeMs = ctimeMs;
          if (bigint) {
            stats.atimeNs = BigInt(atime.getTime()) * BigInt(1e6);
            stats.mtimeNs = BigInt(mtime.getTime()) * BigInt(1e6);
            const ctimeNs = BigInt(ctime.getTime()) * BigInt(1e6);
            stats.ctimeNs = ctimeNs;
            stats.birthtimeNs = ctimeNs;
          }
          stats.dev = getStatNumber(0);
          stats.mode = getStatNumber(node.mode);
          stats.nlink = getStatNumber(node.nlink);
          return stats;
        }
        _checkModeProperty(property) {
          return (Number(this.mode) & S_IFMT) === property;
        }
        isDirectory() {
          return this._checkModeProperty(S_IFDIR);
        }
        isFile() {
          return this._checkModeProperty(S_IFREG);
        }
        isBlockDevice() {
          return this._checkModeProperty(S_IFBLK);
        }
        isCharacterDevice() {
          return this._checkModeProperty(S_IFCHR);
        }
        isSymbolicLink() {
          return this._checkModeProperty(S_IFLNK);
        }
        isFIFO() {
          return this._checkModeProperty(S_IFIFO);
        }
        isSocket() {
          return this._checkModeProperty(S_IFSOCK);
        }
      };
      exports.Stats = Stats;
      exports.default = Stats;
    }
  });

  // node_modules/@jsonjoy.com/fs-node/lib/Dirent.js
  var require_Dirent = __commonJS({
    "node_modules/@jsonjoy.com/fs-node/lib/Dirent.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Dirent = void 0;
      var fs_node_utils_1 = require_lib();
      var { S_IFMT, S_IFDIR, S_IFREG, S_IFBLK, S_IFCHR, S_IFLNK, S_IFIFO, S_IFSOCK } = fs_node_utils_1.constants;
      var Dirent = class _Dirent {
        constructor() {
          this.name = "";
          this.parentPath = "";
          this.mode = 0;
          this.path = "";
        }
        static build(link, encoding) {
          const dirent = new _Dirent();
          const { mode } = link.getNode();
          dirent.name = (0, fs_node_utils_1.strToEncoding)(link.getName(), encoding);
          dirent.mode = mode;
          dirent.parentPath = link.getParentPath();
          dirent.path = dirent.parentPath;
          return dirent;
        }
        _checkModeProperty(property) {
          return (this.mode & S_IFMT) === property;
        }
        isDirectory() {
          return this._checkModeProperty(S_IFDIR);
        }
        isFile() {
          return this._checkModeProperty(S_IFREG);
        }
        isBlockDevice() {
          return this._checkModeProperty(S_IFBLK);
        }
        isCharacterDevice() {
          return this._checkModeProperty(S_IFCHR);
        }
        isSymbolicLink() {
          return this._checkModeProperty(S_IFLNK);
        }
        isFIFO() {
          return this._checkModeProperty(S_IFIFO);
        }
        isSocket() {
          return this._checkModeProperty(S_IFSOCK);
        }
      };
      exports.Dirent = Dirent;
      exports.default = Dirent;
    }
  });

  // node_modules/@jsonjoy.com/fs-node/lib/StatFs.js
  var require_StatFs = __commonJS({
    "node_modules/@jsonjoy.com/fs-node/lib/StatFs.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.StatFs = void 0;
      var StatFs = class _StatFs {
        static build(superblock, bigint = false) {
          const statfs = new _StatFs();
          const getStatNumber = !bigint ? (number) => number : (number) => BigInt(number);
          statfs.type = getStatNumber(2240043254);
          statfs.bsize = getStatNumber(4096);
          const totalInodes = Object.keys(superblock.inodes).length;
          const totalBlocks = 1e6;
          const usedBlocks = Math.min(totalInodes * 2, totalBlocks);
          const freeBlocks = totalBlocks - usedBlocks;
          statfs.blocks = getStatNumber(totalBlocks);
          statfs.bfree = getStatNumber(freeBlocks);
          statfs.bavail = getStatNumber(freeBlocks);
          const maxFiles = 1e6;
          statfs.files = getStatNumber(maxFiles);
          statfs.ffree = getStatNumber(maxFiles - totalInodes);
          return statfs;
        }
      };
      exports.StatFs = StatFs;
      exports.default = StatFs;
    }
  });

  // node_modules/@jsonjoy.com/fs-node-utils/lib/setTimeoutUnref.js
  var require_setTimeoutUnref = __commonJS({
    "node_modules/@jsonjoy.com/fs-node-utils/lib/setTimeoutUnref.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      function setTimeoutUnref(callback, time, args) {
        const ref = setTimeout.apply(typeof globalThis !== "undefined" ? globalThis : globalThis, arguments);
        if (ref && typeof ref === "object" && typeof ref.unref === "function")
          ref.unref();
        return ref;
      }
      exports.default = setTimeoutUnref;
    }
  });

  // tools/_stream-browser.js
  var require_stream_browser = __commonJS({
    "tools/_stream-browser.js"(exports, module) {
      "use strict";
      init_shim();
      var Stream = class {
        on() {
          return this;
        }
        once() {
          return this;
        }
        removeListener() {
          return this;
        }
        emit() {
          return false;
        }
        pipe(dest) {
          return dest;
        }
        write() {
          return true;
        }
        end() {
        }
        destroy() {
        }
      };
      var Readable = class extends Stream {
        read() {
          return null;
        }
        push() {
          return false;
        }
        pause() {
          return this;
        }
        resume() {
          return this;
        }
      };
      var Writable = class extends Stream {
      };
      var Duplex = class extends Readable {
      };
      var Transform = class extends Duplex {
      };
      var PassThrough = class extends Transform {
      };
      var StringDecoder = class {
        write(buf) {
          return typeof import_buffer.Buffer !== "undefined" ? import_buffer.Buffer.from(buf).toString() : String(buf);
        }
        end() {
          return "";
        }
      };
      module.exports = {
        Stream,
        Readable,
        Writable,
        Duplex,
        Transform,
        PassThrough,
        StringDecoder,
        pipeline: (...a) => {
          const cb = a[a.length - 1];
          if (typeof cb === "function") cb();
        },
        finished: (s, cb) => {
          if (typeof cb === "function") cb();
        }
      };
      module.exports.default = module.exports;
    }
  });

  // node_modules/@jsonjoy.com/fs-node-builtins/lib/stream.js
  var require_stream = __commonJS({
    "node_modules/@jsonjoy.com/fs-node-builtins/lib/stream.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Writable = exports.Readable = void 0;
      var node_stream_1 = require_stream_browser();
      Object.defineProperty(exports, "Readable", { enumerable: true, get: function() {
        return node_stream_1.Readable;
      } });
      Object.defineProperty(exports, "Writable", { enumerable: true, get: function() {
        return node_stream_1.Writable;
      } });
    }
  });

  // node_modules/events/events.js
  var require_events = __commonJS({
    "node_modules/events/events.js"(exports, module) {
      "use strict";
      init_shim();
      var R = typeof Reflect === "object" ? Reflect : null;
      var ReflectApply = R && typeof R.apply === "function" ? R.apply : function ReflectApply2(target, receiver, args) {
        return Function.prototype.apply.call(target, receiver, args);
      };
      var ReflectOwnKeys;
      if (R && typeof R.ownKeys === "function") {
        ReflectOwnKeys = R.ownKeys;
      } else if (Object.getOwnPropertySymbols) {
        ReflectOwnKeys = function ReflectOwnKeys2(target) {
          return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));
        };
      } else {
        ReflectOwnKeys = function ReflectOwnKeys2(target) {
          return Object.getOwnPropertyNames(target);
        };
      }
      function ProcessEmitWarning(warning) {
        if (console && console.warn) console.warn(warning);
      }
      var NumberIsNaN = Number.isNaN || function NumberIsNaN2(value) {
        return value !== value;
      };
      function EventEmitter() {
        EventEmitter.init.call(this);
      }
      module.exports = EventEmitter;
      module.exports.once = once;
      EventEmitter.EventEmitter = EventEmitter;
      EventEmitter.prototype._events = void 0;
      EventEmitter.prototype._eventsCount = 0;
      EventEmitter.prototype._maxListeners = void 0;
      var defaultMaxListeners = 10;
      function checkListener(listener) {
        if (typeof listener !== "function") {
          throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
        }
      }
      Object.defineProperty(EventEmitter, "defaultMaxListeners", {
        enumerable: true,
        get: function() {
          return defaultMaxListeners;
        },
        set: function(arg) {
          if (typeof arg !== "number" || arg < 0 || NumberIsNaN(arg)) {
            throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + ".");
          }
          defaultMaxListeners = arg;
        }
      });
      EventEmitter.init = function() {
        if (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) {
          this._events = /* @__PURE__ */ Object.create(null);
          this._eventsCount = 0;
        }
        this._maxListeners = this._maxListeners || void 0;
      };
      EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
        if (typeof n !== "number" || n < 0 || NumberIsNaN(n)) {
          throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + ".");
        }
        this._maxListeners = n;
        return this;
      };
      function _getMaxListeners(that) {
        if (that._maxListeners === void 0)
          return EventEmitter.defaultMaxListeners;
        return that._maxListeners;
      }
      EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
        return _getMaxListeners(this);
      };
      EventEmitter.prototype.emit = function emit(type) {
        var args = [];
        for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
        var doError = type === "error";
        var events = this._events;
        if (events !== void 0)
          doError = doError && events.error === void 0;
        else if (!doError)
          return false;
        if (doError) {
          var er;
          if (args.length > 0)
            er = args[0];
          if (er instanceof Error) {
            throw er;
          }
          var err = new Error("Unhandled error." + (er ? " (" + er.message + ")" : ""));
          err.context = er;
          throw err;
        }
        var handler = events[type];
        if (handler === void 0)
          return false;
        if (typeof handler === "function") {
          ReflectApply(handler, this, args);
        } else {
          var len = handler.length;
          var listeners = arrayClone(handler, len);
          for (var i = 0; i < len; ++i)
            ReflectApply(listeners[i], this, args);
        }
        return true;
      };
      function _addListener(target, type, listener, prepend) {
        var m;
        var events;
        var existing;
        checkListener(listener);
        events = target._events;
        if (events === void 0) {
          events = target._events = /* @__PURE__ */ Object.create(null);
          target._eventsCount = 0;
        } else {
          if (events.newListener !== void 0) {
            target.emit(
              "newListener",
              type,
              listener.listener ? listener.listener : listener
            );
            events = target._events;
          }
          existing = events[type];
        }
        if (existing === void 0) {
          existing = events[type] = listener;
          ++target._eventsCount;
        } else {
          if (typeof existing === "function") {
            existing = events[type] = prepend ? [listener, existing] : [existing, listener];
          } else if (prepend) {
            existing.unshift(listener);
          } else {
            existing.push(listener);
          }
          m = _getMaxListeners(target);
          if (m > 0 && existing.length > m && !existing.warned) {
            existing.warned = true;
            var w = new Error("Possible EventEmitter memory leak detected. " + existing.length + " " + String(type) + " listeners added. Use emitter.setMaxListeners() to increase limit");
            w.name = "MaxListenersExceededWarning";
            w.emitter = target;
            w.type = type;
            w.count = existing.length;
            ProcessEmitWarning(w);
          }
        }
        return target;
      }
      EventEmitter.prototype.addListener = function addListener(type, listener) {
        return _addListener(this, type, listener, false);
      };
      EventEmitter.prototype.on = EventEmitter.prototype.addListener;
      EventEmitter.prototype.prependListener = function prependListener(type, listener) {
        return _addListener(this, type, listener, true);
      };
      function onceWrapper() {
        if (!this.fired) {
          this.target.removeListener(this.type, this.wrapFn);
          this.fired = true;
          if (arguments.length === 0)
            return this.listener.call(this.target);
          return this.listener.apply(this.target, arguments);
        }
      }
      function _onceWrap(target, type, listener) {
        var state = { fired: false, wrapFn: void 0, target, type, listener };
        var wrapped = onceWrapper.bind(state);
        wrapped.listener = listener;
        state.wrapFn = wrapped;
        return wrapped;
      }
      EventEmitter.prototype.once = function once2(type, listener) {
        checkListener(listener);
        this.on(type, _onceWrap(this, type, listener));
        return this;
      };
      EventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {
        checkListener(listener);
        this.prependListener(type, _onceWrap(this, type, listener));
        return this;
      };
      EventEmitter.prototype.removeListener = function removeListener(type, listener) {
        var list, events, position, i, originalListener;
        checkListener(listener);
        events = this._events;
        if (events === void 0)
          return this;
        list = events[type];
        if (list === void 0)
          return this;
        if (list === listener || list.listener === listener) {
          if (--this._eventsCount === 0)
            this._events = /* @__PURE__ */ Object.create(null);
          else {
            delete events[type];
            if (events.removeListener)
              this.emit("removeListener", type, list.listener || listener);
          }
        } else if (typeof list !== "function") {
          position = -1;
          for (i = list.length - 1; i >= 0; i--) {
            if (list[i] === listener || list[i].listener === listener) {
              originalListener = list[i].listener;
              position = i;
              break;
            }
          }
          if (position < 0)
            return this;
          if (position === 0)
            list.shift();
          else {
            spliceOne(list, position);
          }
          if (list.length === 1)
            events[type] = list[0];
          if (events.removeListener !== void 0)
            this.emit("removeListener", type, originalListener || listener);
        }
        return this;
      };
      EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
      EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
        var listeners, events, i;
        events = this._events;
        if (events === void 0)
          return this;
        if (events.removeListener === void 0) {
          if (arguments.length === 0) {
            this._events = /* @__PURE__ */ Object.create(null);
            this._eventsCount = 0;
          } else if (events[type] !== void 0) {
            if (--this._eventsCount === 0)
              this._events = /* @__PURE__ */ Object.create(null);
            else
              delete events[type];
          }
          return this;
        }
        if (arguments.length === 0) {
          var keys = Object.keys(events);
          var key;
          for (i = 0; i < keys.length; ++i) {
            key = keys[i];
            if (key === "removeListener") continue;
            this.removeAllListeners(key);
          }
          this.removeAllListeners("removeListener");
          this._events = /* @__PURE__ */ Object.create(null);
          this._eventsCount = 0;
          return this;
        }
        listeners = events[type];
        if (typeof listeners === "function") {
          this.removeListener(type, listeners);
        } else if (listeners !== void 0) {
          for (i = listeners.length - 1; i >= 0; i--) {
            this.removeListener(type, listeners[i]);
          }
        }
        return this;
      };
      function _listeners(target, type, unwrap) {
        var events = target._events;
        if (events === void 0)
          return [];
        var evlistener = events[type];
        if (evlistener === void 0)
          return [];
        if (typeof evlistener === "function")
          return unwrap ? [evlistener.listener || evlistener] : [evlistener];
        return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
      }
      EventEmitter.prototype.listeners = function listeners(type) {
        return _listeners(this, type, true);
      };
      EventEmitter.prototype.rawListeners = function rawListeners(type) {
        return _listeners(this, type, false);
      };
      EventEmitter.listenerCount = function(emitter, type) {
        if (typeof emitter.listenerCount === "function") {
          return emitter.listenerCount(type);
        } else {
          return listenerCount.call(emitter, type);
        }
      };
      EventEmitter.prototype.listenerCount = listenerCount;
      function listenerCount(type) {
        var events = this._events;
        if (events !== void 0) {
          var evlistener = events[type];
          if (typeof evlistener === "function") {
            return 1;
          } else if (evlistener !== void 0) {
            return evlistener.length;
          }
        }
        return 0;
      }
      EventEmitter.prototype.eventNames = function eventNames() {
        return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
      };
      function arrayClone(arr, n) {
        var copy = new Array(n);
        for (var i = 0; i < n; ++i)
          copy[i] = arr[i];
        return copy;
      }
      function spliceOne(list, index) {
        for (; index + 1 < list.length; index++)
          list[index] = list[index + 1];
        list.pop();
      }
      function unwrapListeners(arr) {
        var ret = new Array(arr.length);
        for (var i = 0; i < ret.length; ++i) {
          ret[i] = arr[i].listener || arr[i];
        }
        return ret;
      }
      function once(emitter, name) {
        return new Promise(function(resolve, reject) {
          function errorListener(err) {
            emitter.removeListener(name, resolver);
            reject(err);
          }
          function resolver() {
            if (typeof emitter.removeListener === "function") {
              emitter.removeListener("error", errorListener);
            }
            resolve([].slice.call(arguments));
          }
          ;
          eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
          if (name !== "error") {
            addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
          }
        });
      }
      function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
        if (typeof emitter.on === "function") {
          eventTargetAgnosticAddListener(emitter, "error", handler, flags);
        }
      }
      function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
        if (typeof emitter.on === "function") {
          if (flags.once) {
            emitter.once(name, listener);
          } else {
            emitter.on(name, listener);
          }
        } else if (typeof emitter.addEventListener === "function") {
          emitter.addEventListener(name, function wrapListener(arg) {
            if (flags.once) {
              emitter.removeEventListener(name, wrapListener);
            }
            listener(arg);
          });
        } else {
          throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
        }
      }
    }
  });

  // node_modules/@jsonjoy.com/fs-node-builtins/lib/events.js
  var require_events2 = __commonJS({
    "node_modules/@jsonjoy.com/fs-node-builtins/lib/events.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.EventEmitter = void 0;
      var node_events_1 = require_events();
      Object.defineProperty(exports, "EventEmitter", { enumerable: true, get: function() {
        return node_events_1.EventEmitter;
      } });
    }
  });

  // node_modules/@jsonjoy.com/fs-node/lib/util.js
  var require_util3 = __commonJS({
    "node_modules/@jsonjoy.com/fs-node/lib/util.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getWriteSyncArgs = exports.getWriteArgs = exports.bufToUint8 = void 0;
      exports.promisify = promisify;
      exports.validateCallback = validateCallback;
      exports.modeToNumber = modeToNumber;
      exports.nullCheck = nullCheck;
      exports.pathToFilename = pathToFilename;
      exports.createError = createError;
      exports.createStatError = createStatError;
      exports.genRndStr6 = genRndStr6;
      exports.flagsToNumber = flagsToNumber;
      exports.streamToBuffer = streamToBuffer;
      exports.bufferToEncoding = bufferToEncoding;
      exports.isReadableStream = isReadableStream;
      var fs_node_utils_1 = require_lib();
      var errors = require_errors();
      var buffer_1 = require_buffer3();
      var fs_core_1 = require_lib2();
      function promisify(fs, fn, getResult = (input) => input) {
        return (...args) => new Promise((resolve, reject) => {
          fs[fn].bind(fs)(...args, (error, result) => {
            if (error)
              return reject(error);
            return resolve(getResult(result));
          });
        });
      }
      function validateCallback(callback) {
        if (typeof callback !== "function")
          throw TypeError(fs_node_utils_1.ERRSTR.CB);
        return callback;
      }
      function _modeToNumber(mode, def) {
        if (typeof mode === "number")
          return mode;
        if (typeof mode === "string")
          return parseInt(mode, 8);
        if (def)
          return modeToNumber(def);
        return void 0;
      }
      function modeToNumber(mode, def) {
        const result = _modeToNumber(mode, def);
        if (typeof result !== "number" || isNaN(result))
          throw new TypeError(fs_node_utils_1.ERRSTR.MODE_INT);
        return result;
      }
      function nullCheck(path, callback) {
        if (("" + path).indexOf("\0") !== -1) {
          const er = new Error("Path must be a string without null bytes");
          er.code = "ENOENT";
          if (typeof callback !== "function")
            throw er;
          queueMicrotask(() => {
            callback(er);
          });
          return false;
        }
        return true;
      }
      function getPathFromURLPosix(url) {
        if (url.hostname !== "") {
          throw new errors.TypeError("ERR_INVALID_FILE_URL_HOST", import_process.default.platform);
        }
        const pathname = url.pathname;
        for (let n = 0; n < pathname.length; n++) {
          if (pathname[n] === "%") {
            const third = pathname.codePointAt(n + 2) | 32;
            if (pathname[n + 1] === "2" && third === 102) {
              throw new errors.TypeError("ERR_INVALID_FILE_URL_PATH", "must not include encoded / characters");
            }
          }
        }
        return decodeURIComponent(pathname);
      }
      function pathToFilename(path) {
        if (path instanceof Uint8Array) {
          path = (0, buffer_1.bufferFrom)(path);
        }
        if (typeof path !== "string" && !buffer_1.Buffer.isBuffer(path)) {
          try {
            if (!(path instanceof require_url_browser().URL))
              throw new TypeError(fs_node_utils_1.ERRSTR.PATH_STR);
          } catch (err) {
            throw new TypeError(fs_node_utils_1.ERRSTR.PATH_STR);
          }
          path = getPathFromURLPosix(path);
        }
        const pathString = String(path);
        nullCheck(pathString);
        return pathString;
      }
      var ENOENT = "ENOENT";
      var EBADF = "EBADF";
      var EINVAL = "EINVAL";
      var EPERM = "EPERM";
      var EPROTO = "EPROTO";
      var EEXIST = "EEXIST";
      var ENOTDIR = "ENOTDIR";
      var EMFILE = "EMFILE";
      var EACCES = "EACCES";
      var EISDIR = "EISDIR";
      var ENOTEMPTY = "ENOTEMPTY";
      var ENOSYS = "ENOSYS";
      var ERR_FS_EISDIR = "ERR_FS_EISDIR";
      var ERR_OUT_OF_RANGE = "ERR_OUT_OF_RANGE";
      function formatError(errorCode, func = "", path = "", path2 = "") {
        let pathFormatted = "";
        if (path)
          pathFormatted = ` '${path}'`;
        if (path2)
          pathFormatted += ` -> '${path2}'`;
        switch (errorCode) {
          case ENOENT:
            return `ENOENT: no such file or directory, ${func}${pathFormatted}`;
          case EBADF:
            return `EBADF: bad file descriptor, ${func}${pathFormatted}`;
          case EINVAL:
            return `EINVAL: invalid argument, ${func}${pathFormatted}`;
          case EPERM:
            return `EPERM: operation not permitted, ${func}${pathFormatted}`;
          case EPROTO:
            return `EPROTO: protocol error, ${func}${pathFormatted}`;
          case EEXIST:
            return `EEXIST: file already exists, ${func}${pathFormatted}`;
          case ENOTDIR:
            return `ENOTDIR: not a directory, ${func}${pathFormatted}`;
          case EISDIR:
            return `EISDIR: illegal operation on a directory, ${func}${pathFormatted}`;
          case EACCES:
            return `EACCES: permission denied, ${func}${pathFormatted}`;
          case ENOTEMPTY:
            return `ENOTEMPTY: directory not empty, ${func}${pathFormatted}`;
          case EMFILE:
            return `EMFILE: too many open files, ${func}${pathFormatted}`;
          case ENOSYS:
            return `ENOSYS: function not implemented, ${func}${pathFormatted}`;
          case ERR_FS_EISDIR:
            return `[ERR_FS_EISDIR]: Path is a directory: ${func} returned EISDIR (is a directory) ${path}`;
          case ERR_OUT_OF_RANGE:
            return `[ERR_OUT_OF_RANGE]: value out of range, ${func}${pathFormatted}`;
          default:
            return `${errorCode}: error occurred, ${func}${pathFormatted}`;
        }
      }
      function createError(errorCode, func = "", path = "", path2 = "", Constructor = Error) {
        const error = new Constructor(formatError(errorCode, func, path, path2));
        error.code = errorCode;
        if (path) {
          error.path = path;
        }
        return error;
      }
      function createStatError(errorCode, func = "", path = "", path2 = "") {
        return {
          code: errorCode,
          message: formatError(errorCode, func, path, path2),
          path,
          toError() {
            const error = new Error(this.message);
            error.code = this.code;
            if (this.path) {
              error.path = this.path;
            }
            return error;
          }
        };
      }
      function genRndStr6() {
        return Math.random().toString(36).slice(2, 8).padEnd(6, "0");
      }
      function flagsToNumber(flags) {
        if (typeof flags === "number")
          return flags;
        if (typeof flags === "string") {
          const flagsNum = fs_node_utils_1.FLAGS[flags];
          if (typeof flagsNum !== "undefined")
            return flagsNum;
        }
        throw new errors.TypeError("ERR_INVALID_OPT_VALUE", "flags", flags);
      }
      function streamToBuffer(stream) {
        const chunks = [];
        return new Promise((resolve, reject) => {
          stream.on("data", (chunk) => chunks.push(chunk));
          stream.on("end", () => resolve(buffer_1.Buffer.concat(chunks)));
          stream.on("error", reject);
        });
      }
      var bufToUint8 = (buf) => new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
      exports.bufToUint8 = bufToUint8;
      var getWriteArgs = (fd, a, b, c, d, e) => {
        (0, fs_core_1.validateFd)(fd);
        let offset = 0;
        let length;
        let position = null;
        let encoding;
        let callback;
        const tipa = typeof a;
        const tipb = typeof b;
        const tipc = typeof c;
        const tipd = typeof d;
        if (tipa !== "string") {
          if (tipb === "function") {
            callback = b;
          } else if (tipc === "function") {
            offset = b | 0;
            callback = c;
          } else if (tipd === "function") {
            offset = b | 0;
            length = c;
            callback = d;
          } else {
            offset = b | 0;
            length = c;
            position = d;
            callback = e;
          }
        } else {
          if (tipb === "function") {
            callback = b;
          } else if (tipc === "function") {
            position = b;
            callback = c;
          } else if (tipd === "function") {
            position = b;
            encoding = c;
            callback = d;
          }
        }
        const buf = (0, fs_core_1.dataToBuffer)(a, encoding);
        if (tipa !== "string") {
          if (typeof length === "undefined")
            length = buf.length;
        } else {
          offset = 0;
          length = buf.length;
        }
        const cb = validateCallback(callback);
        return [fd, tipa === "string", buf, offset, length, position, cb];
      };
      exports.getWriteArgs = getWriteArgs;
      var getWriteSyncArgs = (fd, a, b, c, d) => {
        (0, fs_core_1.validateFd)(fd);
        let encoding;
        let offset;
        let length;
        let position;
        const isBuffer = typeof a !== "string";
        if (isBuffer) {
          offset = (b || 0) | 0;
          length = c;
          position = d;
        } else {
          position = b;
          encoding = c;
        }
        const buf = (0, fs_core_1.dataToBuffer)(a, encoding);
        if (isBuffer) {
          if (typeof length === "undefined") {
            length = buf.length;
          }
        } else {
          offset = 0;
          length = buf.length;
        }
        return [fd, buf, offset || 0, length, position];
      };
      exports.getWriteSyncArgs = getWriteSyncArgs;
      function bufferToEncoding(buffer, encoding) {
        if (!encoding || encoding === "buffer")
          return buffer;
        else
          return buffer.toString(encoding);
      }
      function isReadableStream(stream) {
        return stream !== null && typeof stream === "object" && typeof stream.pipe === "function" && typeof stream.on === "function" && stream.readable === true;
      }
    }
  });

  // node_modules/@jsonjoy.com/fs-node/lib/FileHandle.js
  var require_FileHandle = __commonJS({
    "node_modules/@jsonjoy.com/fs-node/lib/FileHandle.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.FileHandle = void 0;
      var util_1 = require_util3();
      var events_1 = require_events2();
      var FileHandle = class extends events_1.EventEmitter {
        constructor(fs, fd) {
          super();
          this.refs = 1;
          this.closePromise = null;
          this.position = 0;
          this.readableWebStreamLocked = false;
          this.fs = fs;
          this.fd = fd;
        }
        getAsyncId() {
          return this.fd;
        }
        appendFile(data, options) {
          return (0, util_1.promisify)(this.fs, "appendFile")(this.fd, data, options);
        }
        chmod(mode) {
          return (0, util_1.promisify)(this.fs, "fchmod")(this.fd, mode);
        }
        chown(uid, gid) {
          return (0, util_1.promisify)(this.fs, "fchown")(this.fd, uid, gid);
        }
        close() {
          if (this.fd === -1) {
            return Promise.resolve();
          }
          if (this.closePromise) {
            return this.closePromise;
          }
          this.refs--;
          if (this.refs === 0) {
            const currentFd = this.fd;
            this.fd = -1;
            this.closePromise = (0, util_1.promisify)(this.fs, "close")(currentFd).finally(() => {
              this.closePromise = null;
            });
          } else {
            this.closePromise = new Promise((resolve, reject) => {
              this.closeResolve = resolve;
              this.closeReject = reject;
            }).finally(() => {
              this.closePromise = null;
              this.closeReject = void 0;
              this.closeResolve = void 0;
            });
          }
          this.emit("close");
          return this.closePromise;
        }
        datasync() {
          return (0, util_1.promisify)(this.fs, "fdatasync")(this.fd);
        }
        createReadStream(options) {
          return this.fs.createReadStream("", { ...options, fd: this });
        }
        createWriteStream(options) {
          return this.fs.createWriteStream("", { ...options, fd: this });
        }
        readableWebStream(options = {}) {
          const { type = "bytes", autoClose = false } = options;
          let position = 0;
          if (this.fd === -1) {
            throw new Error("The FileHandle is closed");
          }
          if (this.closePromise) {
            throw new Error("The FileHandle is closing");
          }
          if (this.readableWebStreamLocked) {
            throw new Error("An error will be thrown if this method is called more than once or is called after the FileHandle is closed or closing.");
          }
          this.readableWebStreamLocked = true;
          this.ref();
          const unlockAndCleanup = () => {
            this.readableWebStreamLocked = false;
            this.unref();
            if (autoClose) {
              this.close().catch(() => {
              });
            }
          };
          return new ReadableStream({
            type: type === "bytes" ? "bytes" : void 0,
            autoAllocateChunkSize: 16384,
            pull: async (controller) => {
              try {
                const view = controller.byobRequest?.view;
                if (!view) {
                  const buffer = new Uint8Array(16384);
                  const result2 = await this.read(buffer, 0, buffer.length, position);
                  if (result2.bytesRead === 0) {
                    controller.close();
                    unlockAndCleanup();
                    return;
                  }
                  position += result2.bytesRead;
                  controller.enqueue(buffer.slice(0, result2.bytesRead));
                  return;
                }
                const result = await this.read(view, view.byteOffset, view.byteLength, position);
                if (result.bytesRead === 0) {
                  controller.close();
                  unlockAndCleanup();
                  return;
                }
                position += result.bytesRead;
                controller.byobRequest.respond(result.bytesRead);
              } catch (error) {
                controller.error(error);
                unlockAndCleanup();
              }
            },
            cancel: async () => {
              unlockAndCleanup();
            }
          });
        }
        async read(buffer, offset, length, position) {
          const readPosition = position !== null && position !== void 0 ? position : this.position;
          const result = await (0, util_1.promisify)(this.fs, "read", (bytesRead) => ({ bytesRead, buffer }))(this.fd, buffer, offset, length, readPosition);
          if (position === null || position === void 0) {
            this.position += result.bytesRead;
          }
          return result;
        }
        readv(buffers, position) {
          return (0, util_1.promisify)(this.fs, "readv", (bytesRead) => ({ bytesRead, buffers }))(this.fd, buffers, position);
        }
        readFile(options) {
          return (0, util_1.promisify)(this.fs, "readFile")(this.fd, options);
        }
        stat(options) {
          return (0, util_1.promisify)(this.fs, "fstat")(this.fd, options);
        }
        sync() {
          return (0, util_1.promisify)(this.fs, "fsync")(this.fd);
        }
        truncate(len) {
          return (0, util_1.promisify)(this.fs, "ftruncate")(this.fd, len);
        }
        utimes(atime, mtime) {
          return (0, util_1.promisify)(this.fs, "futimes")(this.fd, atime, mtime);
        }
        async write(buffer, offset, length, position) {
          const useInternalPosition = typeof position !== "number";
          const writePosition = useInternalPosition ? this.position : position;
          const result = await (0, util_1.promisify)(this.fs, "write", (bytesWritten) => ({ bytesWritten, buffer }))(this.fd, buffer, offset, length, writePosition);
          if (useInternalPosition) {
            this.position += result.bytesWritten;
          }
          return result;
        }
        writev(buffers, position) {
          return (0, util_1.promisify)(this.fs, "writev", (bytesWritten) => ({ bytesWritten, buffers }))(this.fd, buffers, position);
        }
        writeFile(data, options) {
          return (0, util_1.promisify)(this.fs, "writeFile")(this.fd, data, options);
        }
        // Implement Symbol.asyncDispose if available (ES2023+)
        async [Symbol.asyncDispose]() {
          await this.close();
        }
        ref() {
          this.refs++;
        }
        unref() {
          this.refs--;
          if (this.refs === 0) {
            this.fd = -1;
            if (this.closeResolve) {
              (0, util_1.promisify)(this.fs, "close")(this.fd).then(this.closeResolve, this.closeReject);
            }
          }
        }
      };
      exports.FileHandle = FileHandle;
    }
  });

  // node_modules/@jsonjoy.com/fs-node/lib/FsPromises.js
  var require_FsPromises = __commonJS({
    "node_modules/@jsonjoy.com/fs-node/lib/FsPromises.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.FsPromises = void 0;
      var util_1 = require_util3();
      var fs_node_utils_1 = require_lib();
      var FSWatchAsyncIterator = class {
        constructor(fs, path, options = {}) {
          this.fs = fs;
          this.path = path;
          this.options = options;
          this.eventQueue = [];
          this.resolveQueue = [];
          this.finished = false;
          this.maxQueue = options.maxQueue || 2048;
          this.overflow = options.overflow || "ignore";
          this.startWatching();
          if (options.signal) {
            if (options.signal.aborted) {
              this.finish();
              return;
            }
            options.signal.addEventListener("abort", () => {
              this.finish();
            });
          }
        }
        startWatching() {
          try {
            this.watcher = this.fs.watch(this.path, this.options, (eventType, filename) => {
              this.enqueueEvent({ eventType, filename });
            });
          } catch (error) {
            this.finish();
            throw error;
          }
        }
        enqueueEvent(event) {
          if (this.finished)
            return;
          if (this.eventQueue.length >= this.maxQueue) {
            if (this.overflow === "throw") {
              const error = new Error(`Watch queue overflow: more than ${this.maxQueue} events queued`);
              this.finish(error);
              return;
            } else {
              this.eventQueue.shift();
            }
          }
          this.eventQueue.push(event);
          if (this.resolveQueue.length > 0) {
            const { resolve } = this.resolveQueue.shift();
            const nextEvent = this.eventQueue.shift();
            resolve({ value: nextEvent, done: false });
          }
        }
        finish(error) {
          if (this.finished)
            return;
          this.finished = true;
          if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
          }
          while (this.resolveQueue.length > 0) {
            const { resolve, reject } = this.resolveQueue.shift();
            if (error) {
              reject(error);
            } else {
              resolve({ value: void 0, done: true });
            }
          }
        }
        async next() {
          if (this.finished) {
            return { value: void 0, done: true };
          }
          if (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            return { value: event, done: false };
          }
          return new Promise((resolve, reject) => {
            this.resolveQueue.push({ resolve, reject });
          });
        }
        async return() {
          this.finish();
          return { value: void 0, done: true };
        }
        async throw(error) {
          this.finish(error);
          throw error;
        }
        [Symbol.asyncIterator]() {
          return this;
        }
      };
      var FsPromises = class {
        constructor(fs, FileHandle) {
          this.fs = fs;
          this.FileHandle = FileHandle;
          this.constants = fs_node_utils_1.constants;
          this.cp = (0, util_1.promisify)(this.fs, "cp");
          this.opendir = (0, util_1.promisify)(this.fs, "opendir");
          this.statfs = (0, util_1.promisify)(this.fs, "statfs");
          this.lutimes = (0, util_1.promisify)(this.fs, "lutimes");
          this.glob = (0, util_1.promisify)(this.fs, "glob");
          this.access = (0, util_1.promisify)(this.fs, "access");
          this.chmod = (0, util_1.promisify)(this.fs, "chmod");
          this.chown = (0, util_1.promisify)(this.fs, "chown");
          this.copyFile = (0, util_1.promisify)(this.fs, "copyFile");
          this.lchmod = (0, util_1.promisify)(this.fs, "lchmod");
          this.lchown = (0, util_1.promisify)(this.fs, "lchown");
          this.link = (0, util_1.promisify)(this.fs, "link");
          this.lstat = (0, util_1.promisify)(this.fs, "lstat");
          this.mkdir = (0, util_1.promisify)(this.fs, "mkdir");
          this.mkdtemp = (0, util_1.promisify)(this.fs, "mkdtemp");
          this.readdir = (0, util_1.promisify)(this.fs, "readdir");
          this.readlink = (0, util_1.promisify)(this.fs, "readlink");
          this.realpath = (0, util_1.promisify)(this.fs, "realpath");
          this.rename = (0, util_1.promisify)(this.fs, "rename");
          this.rmdir = (0, util_1.promisify)(this.fs, "rmdir");
          this.rm = (0, util_1.promisify)(this.fs, "rm");
          this.stat = (0, util_1.promisify)(this.fs, "stat");
          this.symlink = (0, util_1.promisify)(this.fs, "symlink");
          this.truncate = (0, util_1.promisify)(this.fs, "truncate");
          this.unlink = (0, util_1.promisify)(this.fs, "unlink");
          this.utimes = (0, util_1.promisify)(this.fs, "utimes");
          this.readFile = (id, options) => {
            return (0, util_1.promisify)(this.fs, "readFile")(id instanceof this.FileHandle ? id.fd : id, options);
          };
          this.appendFile = (path, data, options) => {
            return (0, util_1.promisify)(this.fs, "appendFile")(path instanceof this.FileHandle ? path.fd : path, data, options);
          };
          this.open = (path, flags = "r", mode) => {
            return (0, util_1.promisify)(this.fs, "open", (fd) => new this.FileHandle(this.fs, fd))(path, flags, mode);
          };
          this.writeFile = (id, data, options) => {
            const dataPromise = (0, util_1.isReadableStream)(data) ? (0, util_1.streamToBuffer)(data) : Promise.resolve(data);
            return dataPromise.then((data2) => (0, util_1.promisify)(this.fs, "writeFile")(id instanceof this.FileHandle ? id.fd : id, data2, options));
          };
          this.watch = (filename, options) => {
            const watchOptions = typeof options === "string" ? { encoding: options } : options || {};
            return new FSWatchAsyncIterator(this.fs, filename, watchOptions);
          };
        }
      };
      exports.FsPromises = FsPromises;
    }
  });

  // node_modules/tree-dump/lib/printTree.js
  var require_printTree = __commonJS({
    "node_modules/tree-dump/lib/printTree.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.printTree = void 0;
      var printTree = (tab = "", children) => {
        let str = "";
        let last = children.length - 1;
        for (; last >= 0; last--)
          if (children[last])
            break;
        for (let i = 0; i <= last; i++) {
          const fn = children[i];
          if (!fn)
            continue;
          const isLast = i === last;
          const child = fn(tab + (isLast ? " " : "\u2502") + "  ");
          const branch = child ? isLast ? "\u2514\u2500" : "\u251C\u2500" : "\u2502";
          str += "\n" + tab + branch + (child ? " " + child : "");
        }
        return str;
      };
      exports.printTree = printTree;
    }
  });

  // node_modules/tree-dump/lib/printBinary.js
  var require_printBinary = __commonJS({
    "node_modules/tree-dump/lib/printBinary.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.printBinary = void 0;
      var printBinary = (tab = "", children) => {
        const left = children[0], right = children[1];
        let str = "";
        if (left)
          str += "\n" + tab + "\u2190 " + left(tab + "  ");
        if (right)
          str += "\n" + tab + "\u2192 " + right(tab + "  ");
        return str;
      };
      exports.printBinary = printBinary;
    }
  });

  // node_modules/tree-dump/lib/printJson.js
  var require_printJson = __commonJS({
    "node_modules/tree-dump/lib/printJson.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.printJson = void 0;
      var printJson = (tab = "", json, space = 2) => (JSON.stringify(json, null, space) || "nil").split("\n").join("\n" + tab);
      exports.printJson = printJson;
    }
  });

  // node_modules/tree-dump/lib/index.js
  var require_lib3 = __commonJS({
    "node_modules/tree-dump/lib/index.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
      tslib_1.__exportStar(require_printTree(), exports);
      tslib_1.__exportStar(require_printBinary(), exports);
      tslib_1.__exportStar(require_printJson(), exports);
    }
  });

  // node_modules/@jsonjoy.com/fs-print/lib/index.js
  var require_lib4 = __commonJS({
    "node_modules/@jsonjoy.com/fs-print/lib/index.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.toTreeSync = void 0;
      var tree_dump_1 = require_lib3();
      var fs_node_utils_1 = require_lib();
      var toTreeSync = (fs, opts = {}) => {
        const separator = opts.separator || "/";
        let dir = opts.dir || separator;
        if (dir[dir.length - 1] !== separator)
          dir += separator;
        const tab = opts.tab || "";
        const depth = opts.depth ?? 10;
        const sort = opts.sort ?? true;
        let subtree = " (...)";
        if (depth > 0) {
          const list = fs.readdirSync(dir, { withFileTypes: true });
          if (sort) {
            list.sort((a, b) => {
              if (a.isDirectory() && b.isDirectory()) {
                return a.name.toString().localeCompare(b.name.toString());
              } else if (a.isDirectory()) {
                return -1;
              } else if (b.isDirectory()) {
                return 1;
              } else {
                return a.name.toString().localeCompare(b.name.toString());
              }
            });
          }
          subtree = (0, tree_dump_1.printTree)(tab, list.map((entry) => (tab2) => {
            if (entry.isDirectory()) {
              return (0, exports.toTreeSync)(fs, { dir: dir + entry.name, depth: depth - 1, tab: tab2 });
            } else if (entry.isSymbolicLink()) {
              return "" + entry.name + " \u2192 " + fs.readlinkSync(dir + entry.name);
            } else {
              return "" + entry.name;
            }
          }));
        }
        const base = (0, fs_node_utils_1.basename)(dir, separator) + separator;
        return base + subtree;
      };
      exports.toTreeSync = toTreeSync;
    }
  });

  // node_modules/@jsonjoy.com/fs-snapshot/lib/constants.js
  var require_constants3 = __commonJS({
    "node_modules/@jsonjoy.com/fs-snapshot/lib/constants.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
    }
  });

  // node_modules/@jsonjoy.com/buffers/lib/Slice.js
  var require_Slice = __commonJS({
    "node_modules/@jsonjoy.com/buffers/lib/Slice.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Slice = void 0;
      var Slice = class {
        constructor(uint8, view, start, end) {
          this.uint8 = uint8;
          this.view = view;
          this.start = start;
          this.end = end;
        }
        subarray() {
          return this.uint8.subarray(this.start, this.end);
        }
      };
      exports.Slice = Slice;
    }
  });

  // node_modules/@jsonjoy.com/buffers/lib/Writer.js
  var require_Writer = __commonJS({
    "node_modules/@jsonjoy.com/buffers/lib/Writer.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Writer = void 0;
      var Slice_1 = require_Slice();
      var EMPTY_UINT8 = new Uint8Array([]);
      var EMPTY_VIEW = new DataView(EMPTY_UINT8.buffer);
      var hasBuffer = typeof import_buffer.Buffer === "function";
      var utf8Write = hasBuffer ? import_buffer.Buffer.prototype.utf8Write : null;
      var from = hasBuffer ? import_buffer.Buffer.from : null;
      var textEncoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;
      var Writer = class {
        /**
         * @param allocSize Number of bytes to allocate at a time when buffer ends.
         */
        constructor(allocSize = 64 * 1024) {
          this.allocSize = allocSize;
          this.view = EMPTY_VIEW;
          this.x0 = 0;
          this.x = 0;
          this.uint8 = new Uint8Array(allocSize);
          this.size = allocSize;
          this.view = new DataView(this.uint8.buffer);
        }
        /** @ignore */
        grow(size) {
          const x0 = this.x0;
          const x = this.x;
          const oldUint8 = this.uint8;
          const newUint8 = new Uint8Array(size);
          const view = new DataView(newUint8.buffer);
          const activeSlice = oldUint8.subarray(x0, x);
          newUint8.set(activeSlice, 0);
          this.x = x - x0;
          this.x0 = 0;
          this.uint8 = newUint8;
          this.size = size;
          this.view = view;
        }
        /**
         * Make sure the internal buffer has enough space to write the specified number
         * of bytes, otherwise resize the internal buffer to accommodate for more size.
         *
         * @param capacity Number of bytes.
         */
        ensureCapacity(capacity) {
          const byteLength = this.size;
          const remaining = byteLength - this.x;
          if (remaining < capacity) {
            const total = byteLength - this.x0;
            const required = capacity - remaining;
            const totalRequired = total + required;
            this.grow(totalRequired <= this.allocSize ? this.allocSize : totalRequired * 2);
          }
        }
        /** @todo Consider renaming to "skip"? */
        move(capacity) {
          this.ensureCapacity(capacity);
          this.x += capacity;
        }
        reset() {
          this.x0 = this.x;
        }
        /**
         * Allocates a new {@link ArrayBuffer}, useful when the underlying
         * {@link ArrayBuffer} cannot be shared between threads.
         *
         * @param size Size of memory to allocate.
         */
        newBuffer(size) {
          const uint8 = this.uint8 = new Uint8Array(size);
          this.size = size;
          this.view = new DataView(uint8.buffer);
          this.x = this.x0 = 0;
        }
        /**
         * @returns Encoded memory buffer contents.
         */
        flush() {
          const result = this.uint8.subarray(this.x0, this.x);
          this.x0 = this.x;
          return result;
        }
        flushSlice() {
          const slice = new Slice_1.Slice(this.uint8, this.view, this.x0, this.x);
          this.x0 = this.x;
          return slice;
        }
        u8(char) {
          this.ensureCapacity(1);
          this.uint8[this.x++] = char;
        }
        u16(word) {
          this.ensureCapacity(2);
          this.view.setUint16(this.x, word);
          this.x += 2;
        }
        u32(dword) {
          this.ensureCapacity(4);
          this.view.setUint32(this.x, dword);
          this.x += 4;
        }
        i32(dword) {
          this.ensureCapacity(4);
          this.view.setInt32(this.x, dword);
          this.x += 4;
        }
        u64(qword) {
          this.ensureCapacity(8);
          this.view.setBigUint64(this.x, BigInt(qword));
          this.x += 8;
        }
        f64(float) {
          this.ensureCapacity(8);
          this.view.setFloat64(this.x, float);
          this.x += 8;
        }
        u8u16(u8, u16) {
          this.ensureCapacity(3);
          let x = this.x;
          this.uint8[x++] = u8;
          this.uint8[x++] = u16 >>> 8;
          this.uint8[x++] = u16 & 255;
          this.x = x;
        }
        u8u32(u8, u32) {
          this.ensureCapacity(5);
          let x = this.x;
          this.uint8[x++] = u8;
          this.view.setUint32(x, u32);
          this.x = x + 4;
        }
        u8u64(u8, u64) {
          this.ensureCapacity(9);
          let x = this.x;
          this.uint8[x++] = u8;
          this.view.setBigUint64(x, BigInt(u64));
          this.x = x + 8;
        }
        u8f32(u8, f32) {
          this.ensureCapacity(5);
          let x = this.x;
          this.uint8[x++] = u8;
          this.view.setFloat32(x, f32);
          this.x = x + 4;
        }
        u8f64(u8, f64) {
          this.ensureCapacity(9);
          let x = this.x;
          this.uint8[x++] = u8;
          this.view.setFloat64(x, f64);
          this.x = x + 8;
        }
        buf(buf, length) {
          this.ensureCapacity(length);
          const x = this.x;
          this.uint8.set(buf, x);
          this.x = x + length;
        }
        /**
         * Encodes string as UTF-8. You need to call .ensureCapacity(str.length * 4)
         * before calling
         *
         * @param str String to encode as UTF-8.
         * @returns The number of bytes written
         */
        utf8(str) {
          const theoreticalMaxLength = str.length * 4;
          if (theoreticalMaxLength < 168)
            return this.utf8Native(str);
          this.ensureCapacity(theoreticalMaxLength);
          const maxLength = this.size - this.x;
          if (utf8Write) {
            const writeLength = utf8Write.call(this.uint8, str, this.x, maxLength);
            this.x += writeLength;
            return writeLength;
          } else if (from) {
            const uint8 = this.uint8;
            const offset = uint8.byteOffset + this.x;
            const buf = from(uint8.buffer).subarray(offset, offset + maxLength);
            const writeLength = buf.write(str, 0, maxLength, "utf8");
            this.x += writeLength;
            return writeLength;
          } else if (theoreticalMaxLength > 1024 && textEncoder) {
            const writeLength = textEncoder.encodeInto(str, this.uint8.subarray(this.x, this.x + maxLength)).written;
            this.x += writeLength;
            return writeLength;
          }
          return this.utf8Native(str);
        }
        utf8Native(str) {
          const length = str.length;
          const uint8 = this.uint8;
          let offset = this.x;
          let pos = 0;
          while (pos < length) {
            let value = str.charCodeAt(pos++);
            if ((value & 4294967168) === 0) {
              uint8[offset++] = value;
              continue;
            } else if ((value & 4294965248) === 0) {
              uint8[offset++] = value >> 6 & 31 | 192;
            } else {
              if (value >= 55296 && value <= 56319) {
                if (pos < length) {
                  const extra = str.charCodeAt(pos);
                  if ((extra & 64512) === 56320) {
                    pos++;
                    value = ((value & 1023) << 10) + (extra & 1023) + 65536;
                  }
                }
              }
              if ((value & 4294901760) === 0) {
                uint8[offset++] = value >> 12 & 15 | 224;
                uint8[offset++] = value >> 6 & 63 | 128;
              } else {
                uint8[offset++] = value >> 18 & 7 | 240;
                uint8[offset++] = value >> 12 & 63 | 128;
                uint8[offset++] = value >> 6 & 63 | 128;
              }
            }
            uint8[offset++] = value & 63 | 128;
          }
          const writeLength = offset - this.x;
          this.x = offset;
          return writeLength;
        }
        ascii(str) {
          const length = str.length;
          this.ensureCapacity(length);
          const uint8 = this.uint8;
          let x = this.x;
          let pos = 0;
          while (pos < length)
            uint8[x++] = str.charCodeAt(pos++);
          this.x = x;
        }
      };
      exports.Writer = Writer;
    }
  });

  // node_modules/@jsonjoy.com/fs-snapshot/lib/shared.js
  var require_shared = __commonJS({
    "node_modules/@jsonjoy.com/fs-snapshot/lib/shared.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.validateEntryName = exports.writer = void 0;
      var Writer_1 = require_Writer();
      exports.writer = new Writer_1.Writer(1024 * 32);
      var validateEntryName = (name) => {
        if (!name || name === "." || name === ".." || name.indexOf("/") !== -1 || name.indexOf("\\") !== -1)
          throw new Error(`Invalid snapshot entry name: ${JSON.stringify(name)}`);
      };
      exports.validateEntryName = validateEntryName;
    }
  });

  // node_modules/@jsonjoy.com/fs-snapshot/lib/sync.js
  var require_sync = __commonJS({
    "node_modules/@jsonjoy.com/fs-snapshot/lib/sync.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.fromSnapshotSync = exports.toSnapshotSync = void 0;
      var shared_1 = require_shared();
      var toSnapshotSync = ({ fs, path = "/", separator = "/" }) => {
        const stats = fs.lstatSync(path);
        if (stats.isDirectory()) {
          const list = fs.readdirSync(path);
          const entries = {};
          const dir = path.endsWith(separator) ? path : path + separator;
          for (const child of list) {
            const childSnapshot = (0, exports.toSnapshotSync)({ fs, path: `${dir}${child}`, separator });
            if (childSnapshot)
              entries["" + child] = childSnapshot;
          }
          return [0, {}, entries];
        } else if (stats.isFile()) {
          const buf = fs.readFileSync(path);
          const uint8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
          return [1, {}, uint8];
        } else if (stats.isSymbolicLink()) {
          return [
            2,
            {
              target: fs.readlinkSync(path).toString()
            }
          ];
        }
        return null;
      };
      exports.toSnapshotSync = toSnapshotSync;
      var fromSnapshotSync = (snapshot, { fs, path = "/", separator = "/" }) => {
        if (!snapshot)
          return;
        switch (snapshot[0]) {
          case 0: {
            if (!path.endsWith(separator))
              path = path + separator;
            const [, , entries] = snapshot;
            fs.mkdirSync(path, { recursive: true });
            for (const [name, child] of Object.entries(entries)) {
              (0, shared_1.validateEntryName)(name);
              (0, exports.fromSnapshotSync)(child, { fs, path: `${path}${name}`, separator });
            }
            break;
          }
          case 1: {
            const [, , data] = snapshot;
            fs.writeFileSync(path, data);
            break;
          }
          case 2: {
            const [, { target }] = snapshot;
            fs.symlinkSync(target, path);
            break;
          }
        }
      };
      exports.fromSnapshotSync = fromSnapshotSync;
    }
  });

  // node_modules/@jsonjoy.com/buffers/lib/isFloat32.js
  var require_isFloat32 = __commonJS({
    "node_modules/@jsonjoy.com/buffers/lib/isFloat32.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.isFloat32 = void 0;
      var view = new DataView(new ArrayBuffer(4));
      var isFloat32 = (n) => {
        view.setFloat32(0, n);
        return n === view.getFloat32(0);
      };
      exports.isFloat32 = isFloat32;
    }
  });

  // node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/json-pack/lib/JsonPackExtension.js
  var require_JsonPackExtension = __commonJS({
    "node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/json-pack/lib/JsonPackExtension.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.JsonPackExtension = void 0;
      var JsonPackExtension = class {
        constructor(tag, val) {
          this.tag = tag;
          this.val = val;
        }
      };
      exports.JsonPackExtension = JsonPackExtension;
    }
  });

  // node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/json-pack/lib/cbor/CborEncoderFast.js
  var require_CborEncoderFast = __commonJS({
    "node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/json-pack/lib/cbor/CborEncoderFast.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.CborEncoderFast = void 0;
      var Writer_1 = require_Writer();
      var isSafeInteger = Number.isSafeInteger;
      var CborEncoderFast = class {
        constructor(writer = new Writer_1.Writer()) {
          this.writer = writer;
        }
        encode(value) {
          this.writeAny(value);
          return this.writer.flush();
        }
        writeAny(value) {
          switch (typeof value) {
            case "number":
              return this.writeNumber(value);
            case "string":
              return this.writeStr(value);
            case "boolean":
              return this.writer.u8(244 + +value);
            case "object": {
              if (!value)
                return this.writer.u8(246);
              const constr = value.constructor;
              switch (constr) {
                case Array:
                  return this.writeArr(value);
                default:
                  return this.writeObj(value);
              }
            }
          }
        }
        writeCbor() {
          this.writer.u8u16(217, 55799);
        }
        writeEnd() {
          this.writer.u8(
            255
            /* CONST.END */
          );
        }
        writeNull() {
          this.writer.u8(246);
        }
        writeBoolean(bool) {
          if (bool)
            this.writer.u8(245);
          else
            this.writer.u8(244);
        }
        writeNumber(num) {
          if (isSafeInteger(num))
            this.writeInteger(num);
          else if (typeof num === "bigint")
            this.writeBigInt(num);
          else
            this.writeFloat(num);
        }
        writeBigInt(int) {
          if (int >= 0)
            this.writeBigUint(int);
          else
            this.writeBigSint(int);
        }
        writeBigUint(uint) {
          if (uint <= Number.MAX_SAFE_INTEGER)
            return this.writeUInteger(Number(uint));
          this.writer.u8u64(27, uint);
        }
        writeBigSint(int) {
          if (int >= Number.MIN_SAFE_INTEGER)
            return this.encodeNint(Number(int));
          const uint = -BigInt(1) - int;
          this.writer.u8u64(59, uint);
        }
        writeInteger(int) {
          if (int >= 0)
            this.writeUInteger(int);
          else
            this.encodeNint(int);
        }
        writeUInteger(uint) {
          const writer = this.writer;
          writer.ensureCapacity(9);
          const uint8 = writer.uint8;
          let x = writer.x;
          if (uint <= 23) {
            uint8[x++] = 0 + uint;
          } else if (uint <= 255) {
            uint8[x++] = 24;
            uint8[x++] = uint;
          } else if (uint <= 65535) {
            uint8[x++] = 25;
            writer.view.setUint16(x, uint);
            x += 2;
          } else if (uint <= 4294967295) {
            uint8[x++] = 26;
            writer.view.setUint32(x, uint);
            x += 4;
          } else {
            uint8[x++] = 27;
            writer.view.setBigUint64(x, BigInt(uint));
            x += 8;
          }
          writer.x = x;
        }
        /** @deprecated Remove and use `writeNumber` instead. */
        encodeNumber(num) {
          this.writeNumber(num);
        }
        /** @deprecated Remove and use `writeInteger` instead. */
        encodeInteger(int) {
          this.writeInteger(int);
        }
        /** @deprecated */
        encodeUint(uint) {
          this.writeUInteger(uint);
        }
        encodeNint(int) {
          const uint = -1 - int;
          const writer = this.writer;
          writer.ensureCapacity(9);
          const uint8 = writer.uint8;
          let x = writer.x;
          if (uint < 24) {
            uint8[x++] = 32 + uint;
          } else if (uint <= 255) {
            uint8[x++] = 56;
            uint8[x++] = uint;
          } else if (uint <= 65535) {
            uint8[x++] = 57;
            writer.view.setUint16(x, uint);
            x += 2;
          } else if (uint <= 4294967295) {
            uint8[x++] = 58;
            writer.view.setUint32(x, uint);
            x += 4;
          } else {
            uint8[x++] = 59;
            writer.view.setBigUint64(x, BigInt(uint));
            x += 8;
          }
          writer.x = x;
        }
        writeFloat(float) {
          this.writer.u8f64(251, float);
        }
        writeBin(buf) {
          const length = buf.length;
          this.writeBinHdr(length);
          this.writer.buf(buf, length);
        }
        writeBinHdr(length) {
          const writer = this.writer;
          if (length <= 23)
            writer.u8(64 + length);
          else if (length <= 255)
            writer.u16((88 << 8) + length);
          else if (length <= 65535)
            writer.u8u16(89, length);
          else if (length <= 4294967295)
            writer.u8u32(90, length);
          else
            writer.u8u64(91, length);
        }
        writeStr(str) {
          const writer = this.writer;
          const length = str.length;
          const maxSize = length * 4;
          writer.ensureCapacity(5 + maxSize);
          const uint8 = writer.uint8;
          let lengthOffset = writer.x;
          if (maxSize <= 23)
            writer.x++;
          else if (maxSize <= 255) {
            uint8[writer.x++] = 120;
            lengthOffset = writer.x;
            writer.x++;
          } else if (maxSize <= 65535) {
            uint8[writer.x++] = 121;
            lengthOffset = writer.x;
            writer.x += 2;
          } else {
            uint8[writer.x++] = 122;
            lengthOffset = writer.x;
            writer.x += 4;
          }
          const bytesWritten = writer.utf8(str);
          if (maxSize <= 23)
            uint8[lengthOffset] = 96 + bytesWritten;
          else if (maxSize <= 255)
            uint8[lengthOffset] = bytesWritten;
          else if (maxSize <= 65535)
            writer.view.setUint16(lengthOffset, bytesWritten);
          else
            writer.view.setUint32(lengthOffset, bytesWritten);
        }
        writeStrHdr(length) {
          const writer = this.writer;
          if (length <= 23)
            writer.u8(96 + length);
          else if (length <= 255)
            writer.u16((120 << 8) + length);
          else if (length <= 65535)
            writer.u8u16(121, length);
          else
            writer.u8u32(122, length);
        }
        writeAsciiStr(str) {
          this.writeStrHdr(str.length);
          this.writer.ascii(str);
        }
        writeArr(arr) {
          const length = arr.length;
          this.writeArrHdr(length);
          for (let i = 0; i < length; i++)
            this.writeAny(arr[i]);
        }
        writeArrHdr(length) {
          const writer = this.writer;
          if (length <= 23)
            writer.u8(128 + length);
          else if (length <= 255)
            writer.u16((152 << 8) + length);
          else if (length <= 65535)
            writer.u8u16(153, length);
          else if (length <= 4294967295)
            writer.u8u32(154, length);
          else
            writer.u8u64(155, length);
        }
        writeObj(obj) {
          const keys = Object.keys(obj);
          const length = keys.length;
          this.writeObjHdr(length);
          for (let i = 0; i < length; i++) {
            const key = keys[i];
            this.writeStr(key);
            this.writeAny(obj[key]);
          }
        }
        writeObjHdr(length) {
          const writer = this.writer;
          if (length <= 23)
            writer.u8(160 + length);
          else if (length <= 255)
            writer.u16((184 << 8) + length);
          else if (length <= 65535)
            writer.u8u16(185, length);
          else if (length <= 4294967295)
            writer.u8u32(186, length);
          else
            writer.u8u64(187, length);
        }
        writeMapHdr(length) {
          this.writeObjHdr(length);
        }
        writeStartMap() {
          this.writer.u8(191);
        }
        writeTag(tag, value) {
          this.writeTagHdr(tag);
          this.writeAny(value);
        }
        writeTagHdr(tag) {
          const writer = this.writer;
          if (tag <= 23)
            writer.u8(192 + tag);
          else if (tag <= 255)
            writer.u16((216 << 8) + tag);
          else if (tag <= 65535)
            writer.u8u16(217, tag);
          else if (tag <= 4294967295)
            writer.u8u32(218, tag);
          else
            writer.u8u64(219, tag);
        }
        writeTkn(value) {
          const writer = this.writer;
          if (value <= 23)
            writer.u8(224 + value);
          else if (value <= 255)
            writer.u16((248 << 8) + value);
        }
        // Streaming encoding
        writeStartStr() {
          this.writer.u8(127);
        }
        writeStrChunk(str) {
          throw new Error("Not implemented");
        }
        writeEndStr() {
          throw new Error("Not implemented");
        }
        writeStartBin() {
          this.writer.u8(95);
        }
        writeBinChunk(buf) {
          throw new Error("Not implemented");
        }
        writeEndBin() {
          throw new Error("Not implemented");
        }
        writeStartArr() {
          this.writer.u8(159);
        }
        writeArrChunk(item) {
          throw new Error("Not implemented");
        }
        writeEndArr() {
          this.writer.u8(
            255
            /* CONST.END */
          );
        }
        writeStartObj() {
          this.writer.u8(191);
        }
        writeObjChunk(key, value) {
          throw new Error("Not implemented");
        }
        writeEndObj() {
          this.writer.u8(
            255
            /* CONST.END */
          );
        }
      };
      exports.CborEncoderFast = CborEncoderFast;
    }
  });

  // node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/json-pack/lib/JsonPackValue.js
  var require_JsonPackValue = __commonJS({
    "node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/json-pack/lib/JsonPackValue.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.JsonPackValue = void 0;
      var JsonPackValue = class {
        constructor(val) {
          this.val = val;
        }
      };
      exports.JsonPackValue = JsonPackValue;
    }
  });

  // node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/json-pack/lib/cbor/CborEncoder.js
  var require_CborEncoder = __commonJS({
    "node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/json-pack/lib/cbor/CborEncoder.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.CborEncoder = void 0;
      var isFloat32_1 = require_isFloat32();
      var JsonPackExtension_1 = require_JsonPackExtension();
      var CborEncoderFast_1 = require_CborEncoderFast();
      var JsonPackValue_1 = require_JsonPackValue();
      var CborEncoder = class extends CborEncoderFast_1.CborEncoderFast {
        /**
         * Called when the encoder encounters a value that it does not know how to encode.
         *
         * @param value Some JavaScript value.
         */
        writeUnknown(value) {
          this.writeNull();
        }
        writeAny(value) {
          switch (typeof value) {
            case "number":
              return this.writeNumber(value);
            case "string":
              return this.writeStr(value);
            case "boolean":
              return this.writer.u8(244 + +value);
            case "object": {
              if (!value)
                return this.writer.u8(246);
              const constr = value.constructor;
              switch (constr) {
                case Object:
                  return this.writeObj(value);
                case Array:
                  return this.writeArr(value);
                case Uint8Array:
                  return this.writeBin(value);
                case Map:
                  return this.writeMap(value);
                case JsonPackExtension_1.JsonPackExtension:
                  return this.writeTag(value.tag, value.val);
                case JsonPackValue_1.JsonPackValue: {
                  const buf = value.val;
                  return this.writer.buf(buf, buf.length);
                }
                default:
                  if (value instanceof Uint8Array)
                    return this.writeBin(value);
                  if (Array.isArray(value))
                    return this.writeArr(value);
                  if (value instanceof Map)
                    return this.writeMap(value);
                  return this.writeUnknown(value);
              }
            }
            case "undefined":
              return this.writeUndef();
            case "bigint":
              return this.writeBigInt(value);
            default:
              return this.writeUnknown(value);
          }
        }
        writeFloat(float) {
          if ((0, isFloat32_1.isFloat32)(float))
            this.writer.u8f32(250, float);
          else
            this.writer.u8f64(251, float);
        }
        writeMap(map) {
          this.writeMapHdr(map.size);
          map.forEach((value, key) => {
            this.writeAny(key);
            this.writeAny(value);
          });
        }
        writeUndef() {
          this.writer.u8(247);
        }
      };
      exports.CborEncoder = CborEncoder;
    }
  });

  // node_modules/@jsonjoy.com/buffers/lib/f16.js
  var require_f16 = __commonJS({
    "node_modules/@jsonjoy.com/buffers/lib/f16.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.decodeF16 = void 0;
      var pow = Math.pow;
      var decodeF16 = (binary) => {
        const exponent = (binary & 31744) >> 10;
        const fraction = binary & 1023;
        return (binary >> 15 ? -1 : 1) * (exponent ? exponent === 31 ? fraction ? NaN : Infinity : pow(2, exponent - 15) * (1 + fraction / 1024) : 6103515625e-14 * (fraction / 1024));
      };
      exports.decodeF16 = decodeF16;
    }
  });

  // node_modules/@jsonjoy.com/buffers/lib/utf8/decodeAscii.js
  var require_decodeAscii = __commonJS({
    "node_modules/@jsonjoy.com/buffers/lib/utf8/decodeAscii.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.decodeAsciiMax15 = exports.decodeAscii = void 0;
      var fromCharCode = String.fromCharCode;
      var decodeAscii = (src, position, length) => {
        const bytes = [];
        for (let i = 0; i < length; i++) {
          const byte = src[position++];
          if (byte & 128)
            return;
          bytes.push(byte);
        }
        return fromCharCode.apply(String, bytes);
      };
      exports.decodeAscii = decodeAscii;
      var decodeAsciiMax15 = (src, position, length) => {
        if (length < 4) {
          if (length < 2) {
            if (length === 0)
              return "";
            else {
              const a = src[position++];
              if ((a & 128) > 1) {
                position -= 1;
                return;
              }
              return fromCharCode(a);
            }
          } else {
            const a = src[position++];
            const b = src[position++];
            if ((a & 128) > 0 || (b & 128) > 0) {
              position -= 2;
              return;
            }
            if (length < 3)
              return fromCharCode(a, b);
            const c = src[position++];
            if ((c & 128) > 0) {
              position -= 3;
              return;
            }
            return fromCharCode(a, b, c);
          }
        } else {
          const a = src[position++];
          const b = src[position++];
          const c = src[position++];
          const d = src[position++];
          if ((a & 128) > 0 || (b & 128) > 0 || (c & 128) > 0 || (d & 128) > 0) {
            position -= 4;
            return;
          }
          if (length < 6) {
            if (length === 4)
              return fromCharCode(a, b, c, d);
            else {
              const e = src[position++];
              if ((e & 128) > 0) {
                position -= 5;
                return;
              }
              return fromCharCode(a, b, c, d, e);
            }
          } else if (length < 8) {
            const e = src[position++];
            const f = src[position++];
            if ((e & 128) > 0 || (f & 128) > 0) {
              position -= 6;
              return;
            }
            if (length < 7)
              return fromCharCode(a, b, c, d, e, f);
            const g = src[position++];
            if ((g & 128) > 0) {
              position -= 7;
              return;
            }
            return fromCharCode(a, b, c, d, e, f, g);
          } else {
            const e = src[position++];
            const f = src[position++];
            const g = src[position++];
            const h = src[position++];
            if ((e & 128) > 0 || (f & 128) > 0 || (g & 128) > 0 || (h & 128) > 0) {
              position -= 8;
              return;
            }
            if (length < 10) {
              if (length === 8)
                return fromCharCode(a, b, c, d, e, f, g, h);
              else {
                const i = src[position++];
                if ((i & 128) > 0) {
                  position -= 9;
                  return;
                }
                return fromCharCode(a, b, c, d, e, f, g, h, i);
              }
            } else if (length < 12) {
              const i = src[position++];
              const j = src[position++];
              if ((i & 128) > 0 || (j & 128) > 0) {
                position -= 10;
                return;
              }
              if (length < 11)
                return fromCharCode(a, b, c, d, e, f, g, h, i, j);
              const k = src[position++];
              if ((k & 128) > 0) {
                position -= 11;
                return;
              }
              return fromCharCode(a, b, c, d, e, f, g, h, i, j, k);
            } else {
              const i = src[position++];
              const j = src[position++];
              const k = src[position++];
              const l = src[position++];
              if ((i & 128) > 0 || (j & 128) > 0 || (k & 128) > 0 || (l & 128) > 0) {
                position -= 12;
                return;
              }
              if (length < 14) {
                if (length === 12)
                  return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l);
                else {
                  const m = src[position++];
                  if ((m & 128) > 0) {
                    position -= 13;
                    return;
                  }
                  return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m);
                }
              } else {
                const m = src[position++];
                const n = src[position++];
                if ((m & 128) > 0 || (n & 128) > 0) {
                  position -= 14;
                  return;
                }
                if (length < 15)
                  return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m, n);
                const o = src[position++];
                if ((o & 128) > 0) {
                  position -= 15;
                  return;
                }
                return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
              }
            }
          }
        }
      };
      exports.decodeAsciiMax15 = decodeAsciiMax15;
    }
  });

  // node_modules/@jsonjoy.com/buffers/lib/utf8/decodeUtf8/v18.js
  var require_v18 = __commonJS({
    "node_modules/@jsonjoy.com/buffers/lib/utf8/decodeUtf8/v18.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      var fromCharCode = String.fromCharCode;
      exports.default = (buf, start, length) => {
        let offset = start;
        const end = offset + length;
        const points = [];
        while (offset < end) {
          let code = buf[offset++];
          if ((code & 128) !== 0) {
            const octet2 = buf[offset++] & 63;
            if ((code & 224) === 192) {
              code = (code & 31) << 6 | octet2;
            } else {
              const octet3 = buf[offset++] & 63;
              if ((code & 240) === 224) {
                code = (code & 31) << 12 | octet2 << 6 | octet3;
              } else {
                if ((code & 248) === 240) {
                  const octet4 = buf[offset++] & 63;
                  let unit = (code & 7) << 18 | octet2 << 12 | octet3 << 6 | octet4;
                  if (unit > 65535) {
                    unit -= 65536;
                    const unit0 = unit >>> 10 & 1023 | 55296;
                    code = 56320 | unit & 1023;
                    points.push(unit0);
                  } else {
                    code = unit;
                  }
                }
              }
            }
          }
          points.push(code);
        }
        return fromCharCode.apply(String, points);
      };
    }
  });

  // node_modules/@jsonjoy.com/buffers/lib/utf8/decodeUtf8/v16.js
  var require_v16 = __commonJS({
    "node_modules/@jsonjoy.com/buffers/lib/utf8/decodeUtf8/v16.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
      var decodeAscii_1 = require_decodeAscii();
      var v18_1 = tslib_1.__importDefault(require_v18());
      var hasBuffer = typeof import_buffer.Buffer !== "undefined";
      var utf8Slice = hasBuffer ? import_buffer.Buffer.prototype.utf8Slice : null;
      var from = hasBuffer ? import_buffer.Buffer.from : null;
      var shortDecoder = (buf, start, length) => (0, decodeAscii_1.decodeAsciiMax15)(buf, start, length) ?? (0, v18_1.default)(buf, start, length);
      var midDecoder = (buf, start, length) => (0, decodeAscii_1.decodeAscii)(buf, start, length) ?? (0, v18_1.default)(buf, start, length);
      var longDecoder = utf8Slice ? (buf, start, length) => utf8Slice.call(buf, start, start + length) : from ? (buf, start, length) => from(buf).subarray(start, start + length).toString("utf8") : v18_1.default;
      var decoder = (buf, start, length) => {
        if (length < 16)
          return shortDecoder(buf, start, length);
        if (length < 32)
          return midDecoder(buf, start, length);
        return longDecoder(buf, start, length);
      };
      exports.default = decoder;
    }
  });

  // node_modules/@jsonjoy.com/buffers/lib/utf8/decodeUtf8/index.js
  var require_decodeUtf8 = __commonJS({
    "node_modules/@jsonjoy.com/buffers/lib/utf8/decodeUtf8/index.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.decodeUtf8 = void 0;
      var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
      var v16_1 = tslib_1.__importDefault(require_v16());
      exports.decodeUtf8 = v16_1.default;
    }
  });

  // node_modules/@jsonjoy.com/buffers/lib/Reader.js
  var require_Reader = __commonJS({
    "node_modules/@jsonjoy.com/buffers/lib/Reader.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Reader = void 0;
      var decodeUtf8_1 = require_decodeUtf8();
      var Reader = class _Reader {
        constructor(uint8 = new Uint8Array([]), view = new DataView(uint8.buffer, uint8.byteOffset, uint8.length), x = 0, end = uint8.length) {
          this.uint8 = uint8;
          this.view = view;
          this.x = x;
          this.end = end;
        }
        reset(uint8) {
          this.x = 0;
          this.uint8 = uint8;
          this.view = new DataView(uint8.buffer, uint8.byteOffset, uint8.length);
        }
        size() {
          return this.end - this.x;
        }
        /**
         * Get current byte value without advancing the cursor.
         */
        peek() {
          return this.view.getUint8(this.x);
        }
        /**
         * @deprecated Use peek() instead.
         */
        peak() {
          return this.peek();
        }
        skip(length) {
          this.x += length;
        }
        buf(size = this.size()) {
          const x = this.x;
          const end = x + size;
          const bin = this.uint8.subarray(x, end);
          this.x = end;
          return bin;
        }
        subarray(start = 0, end) {
          const x = this.x;
          const actualStart = x + start;
          const actualEnd = typeof end === "number" ? x + end : this.end;
          return this.uint8.subarray(actualStart, actualEnd);
        }
        /**
         * Creates a new {@link Reader} that references the same underlying memory
         * buffer. But with independent cursor and end.
         *
         * Preferred over {@link buf} since it also provides a DataView and is much
         * faster to allocate a new {@link Slice} than a new {@link Uint8Array}.
         *
         * @param start Start offset relative to the current cursor position.
         * @param end End offset relative to the current cursor position.
         * @returns A new {@link Reader} instance.
         */
        slice(start = 0, end) {
          const x = this.x;
          const actualStart = x + start;
          const actualEnd = typeof end === "number" ? x + end : this.end;
          return new _Reader(this.uint8, this.view, actualStart, actualEnd);
        }
        /**
         * Similar to {@link slice} but also advances the cursor. Returns a new
         * {@link Reader} that references the same underlying memory buffer, starting
         * from the current cursor position.
         *
         * @param size Number of bytes to cut from the current position.
         * @returns A new {@link Reader} instance.
         */
        cut(size = this.size()) {
          const slice = this.slice(0, size);
          this.skip(size);
          return slice;
        }
        u8() {
          return this.uint8[this.x++];
        }
        i8() {
          return this.view.getInt8(this.x++);
        }
        u16() {
          let x = this.x;
          const num = (this.uint8[x++] << 8) + this.uint8[x++];
          this.x = x;
          return num;
        }
        i16() {
          const num = this.view.getInt16(this.x);
          this.x += 2;
          return num;
        }
        u32() {
          const num = this.view.getUint32(this.x);
          this.x += 4;
          return num;
        }
        i32() {
          const num = this.view.getInt32(this.x);
          this.x += 4;
          return num;
        }
        u64() {
          const num = this.view.getBigUint64(this.x);
          this.x += 8;
          return num;
        }
        i64() {
          const num = this.view.getBigInt64(this.x);
          this.x += 8;
          return num;
        }
        f32() {
          const pos = this.x;
          this.x += 4;
          return this.view.getFloat32(pos);
        }
        f64() {
          const pos = this.x;
          this.x += 8;
          return this.view.getFloat64(pos);
        }
        utf8(size) {
          const start = this.x;
          this.x += size;
          return (0, decodeUtf8_1.decodeUtf8)(this.uint8, start, size);
        }
        ascii(length) {
          const uint8 = this.uint8;
          let str = "";
          const end = this.x + length;
          for (let i = this.x; i < end; i++)
            str += String.fromCharCode(uint8[i]);
          this.x = end;
          return str;
        }
      };
      exports.Reader = Reader;
    }
  });

  // node_modules/@jsonjoy.com/buffers/lib/utf8/decodeUtf8/v10.js
  var require_v10 = __commonJS({
    "node_modules/@jsonjoy.com/buffers/lib/utf8/decodeUtf8/v10.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      var fromCharCode = String.fromCharCode;
      exports.default = (buf, start, length) => {
        let offset = start;
        const end = offset + length;
        let str = "";
        while (offset < end) {
          const octet1 = buf[offset++];
          if ((octet1 & 128) === 0) {
            str += fromCharCode(octet1);
            continue;
          }
          const octet2 = buf[offset++] & 63;
          if ((octet1 & 224) === 192) {
            str += fromCharCode((octet1 & 31) << 6 | octet2);
            continue;
          }
          const octet3 = buf[offset++] & 63;
          if ((octet1 & 240) === 224) {
            str += fromCharCode((octet1 & 31) << 12 | octet2 << 6 | octet3);
            continue;
          }
          if ((octet1 & 248) === 240) {
            const octet4 = buf[offset++] & 63;
            let unit = (octet1 & 7) << 18 | octet2 << 12 | octet3 << 6 | octet4;
            if (unit > 65535) {
              unit -= 65536;
              const unit0 = unit >>> 10 & 1023 | 55296;
              unit = 56320 | unit & 1023;
              str += fromCharCode(unit0, unit);
            } else {
              str += fromCharCode(unit);
            }
          } else {
            str += fromCharCode(octet1);
          }
        }
        return str;
      };
    }
  });

  // node_modules/@jsonjoy.com/buffers/lib/utf8/CachedUtf8Decoder.js
  var require_CachedUtf8Decoder = __commonJS({
    "node_modules/@jsonjoy.com/buffers/lib/utf8/CachedUtf8Decoder.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.CachedUtf8Decoder = void 0;
      var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
      var v10_1 = tslib_1.__importDefault(require_v10());
      var x = 1 + Math.round(Math.random() * ((-1 >>> 0) - 1));
      function randomU32(min, max) {
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        return (x >>> 0) % (max - min + 1) + min;
      }
      var CacheItem = class {
        constructor(bytes, value) {
          this.bytes = bytes;
          this.value = value;
        }
      };
      var CachedUtf8Decoder = class {
        constructor() {
          this.caches = [];
          for (let i = 0; i < 31; i++)
            this.caches.push([]);
        }
        get(bytes, offset, size) {
          const records = this.caches[size - 1];
          const len = records.length;
          FIND_CHUNK: for (let i = 0; i < len; i++) {
            const record = records[i];
            const recordBytes = record.bytes;
            for (let j = 0; j < size; j++)
              if (recordBytes[j] !== bytes[offset + j])
                continue FIND_CHUNK;
            return record.value;
          }
          return null;
        }
        store(bytes, value) {
          const records = this.caches[bytes.length - 1];
          const record = new CacheItem(bytes, value);
          const length = records.length;
          if (length >= 16)
            records[randomU32(0, 16 - 1)] = record;
          else
            records.push(record);
        }
        decode(bytes, offset, size) {
          if (!size)
            return "";
          const cachedValue = this.get(bytes, offset, size);
          if (cachedValue !== null)
            return cachedValue;
          const value = (0, v10_1.default)(bytes, offset, size);
          const copy = Uint8Array.prototype.slice.call(bytes, offset, offset + size);
          this.store(copy, value);
          return value;
        }
      };
      exports.CachedUtf8Decoder = CachedUtf8Decoder;
    }
  });

  // node_modules/@jsonjoy.com/buffers/lib/utf8/sharedCachedUtf8Decoder.js
  var require_sharedCachedUtf8Decoder = __commonJS({
    "node_modules/@jsonjoy.com/buffers/lib/utf8/sharedCachedUtf8Decoder.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      var CachedUtf8Decoder_1 = require_CachedUtf8Decoder();
      exports.default = new CachedUtf8Decoder_1.CachedUtf8Decoder();
    }
  });

  // node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/json-pack/lib/cbor/CborDecoderBase.js
  var require_CborDecoderBase = __commonJS({
    "node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/json-pack/lib/cbor/CborDecoderBase.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.CborDecoderBase = void 0;
      var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
      var f16_1 = require_f16();
      var JsonPackExtension_1 = require_JsonPackExtension();
      var JsonPackValue_1 = require_JsonPackValue();
      var Reader_1 = require_Reader();
      var sharedCachedUtf8Decoder_1 = tslib_1.__importDefault(require_sharedCachedUtf8Decoder());
      var CborDecoderBase = class {
        constructor(reader = new Reader_1.Reader(), keyDecoder = sharedCachedUtf8Decoder_1.default) {
          this.reader = reader;
          this.keyDecoder = keyDecoder;
        }
        read(uint8) {
          this.reader.reset(uint8);
          return this.readAny();
        }
        decode(uint8) {
          this.reader.reset(uint8);
          return this.readAny();
        }
        // Any value reading
        val() {
          return this.readAny();
        }
        readAny() {
          const reader = this.reader;
          const octet = reader.u8();
          const major = octet >> 5;
          const minor = octet & 31;
          if (major < 4) {
            if (major < 2)
              return major === 0 ? this.readUint(minor) : this.readNint(minor);
            else
              return major === 2 ? this.readBin(minor) : this.readStr(minor);
          } else {
            if (major < 6)
              return major === 4 ? this.readArr(minor) : this.readObj(minor);
            else
              return major === 6 ? this.readTag(minor) : this.readTkn(minor);
          }
        }
        readAnyRaw(octet) {
          const major = octet >> 5;
          const minor = octet & 31;
          if (major < 4) {
            if (major < 2)
              return major === 0 ? this.readUint(minor) : this.readNint(minor);
            else
              return major === 2 ? this.readBin(minor) : this.readStr(minor);
          } else {
            if (major < 6)
              return major === 4 ? this.readArr(minor) : this.readObj(minor);
            else
              return major === 6 ? this.readTag(minor) : this.readTkn(minor);
          }
        }
        readMinorLen(minor) {
          if (minor < 24)
            return minor;
          switch (minor) {
            case 24:
              return this.reader.u8();
            case 25:
              return this.reader.u16();
            case 26:
              return this.reader.u32();
            case 27:
              return Number(this.reader.u64());
            case 31:
              return -1;
            default:
              throw 1;
          }
        }
        // Unsigned int reading
        readUint(minor) {
          if (minor < 25) {
            return minor === 24 ? this.reader.u8() : minor;
          } else {
            if (minor < 27) {
              return minor === 25 ? this.reader.u16() : this.reader.u32();
            } else {
              const num = this.reader.u64();
              return num > 9007199254740991 ? num : Number(num);
            }
          }
        }
        // Negative int reading
        readNint(minor) {
          if (minor < 25) {
            return minor === 24 ? -this.reader.u8() - 1 : -minor - 1;
          } else {
            if (minor < 27) {
              return minor === 25 ? -this.reader.u16() - 1 : -this.reader.u32() - 1;
            } else {
              const num = this.reader.u64();
              return num > 9007199254740991 - 1 ? -num - BigInt(1) : -Number(num) - 1;
            }
          }
        }
        // Binary reading
        readBin(minor) {
          const reader = this.reader;
          if (minor <= 23)
            return reader.buf(minor);
          switch (minor) {
            case 24:
              return reader.buf(reader.u8());
            case 25:
              return reader.buf(reader.u16());
            case 26:
              return reader.buf(reader.u32());
            case 27:
              return reader.buf(Number(reader.u64()));
            case 31: {
              let size = 0;
              const list = [];
              while (this.reader.peak() !== 255) {
                const uint8 = this.readBinChunk();
                size += uint8.length;
                list.push(uint8);
              }
              this.reader.x++;
              const res = new Uint8Array(size);
              let offset = 0;
              const length = list.length;
              for (let i = 0; i < length; i++) {
                const arr = list[i];
                res.set(arr, offset);
                offset += arr.length;
              }
              return res;
            }
            default:
              throw 1;
          }
        }
        readBinChunk() {
          const octet = this.reader.u8();
          const major = octet >> 5;
          const minor = octet & 31;
          if (major !== 2)
            throw 2;
          if (minor > 27)
            throw 3;
          return this.readBin(minor);
        }
        // String reading
        readAsStr() {
          const reader = this.reader;
          const octet = reader.u8();
          const major = octet >> 5;
          const minor = octet & 31;
          if (major !== 3)
            throw 11;
          return this.readStr(minor);
        }
        readStr(minor) {
          const reader = this.reader;
          if (minor <= 23)
            return reader.utf8(minor);
          switch (minor) {
            case 24:
              return reader.utf8(reader.u8());
            case 25:
              return reader.utf8(reader.u16());
            case 26:
              return reader.utf8(reader.u32());
            case 27:
              return reader.utf8(Number(reader.u64()));
            case 31: {
              let str = "";
              while (reader.peak() !== 255)
                str += this.readStrChunk();
              this.reader.x++;
              return str;
            }
            default:
              throw 1;
          }
        }
        readStrLen(minor) {
          if (minor <= 23)
            return minor;
          switch (minor) {
            case 24:
              return this.reader.u8();
            case 25:
              return this.reader.u16();
            case 26:
              return this.reader.u32();
            case 27:
              return Number(this.reader.u64());
            default:
              throw 1;
          }
        }
        readStrChunk() {
          const octet = this.reader.u8();
          const major = octet >> 5;
          const minor = octet & 31;
          if (major !== 3)
            throw 4;
          if (minor > 27)
            throw 5;
          return this.readStr(minor);
        }
        // Array reading
        readArr(minor) {
          const length = this.readMinorLen(minor);
          if (length >= 0)
            return this.readArrRaw(length);
          return this.readArrIndef();
        }
        readArrRaw(length) {
          const arr = [];
          for (let i = 0; i < length; i++)
            arr.push(this.readAny());
          return arr;
        }
        readArrIndef() {
          const arr = [];
          while (this.reader.peak() !== 255)
            arr.push(this.readAny());
          this.reader.x++;
          return arr;
        }
        // Object reading
        readObj(minor) {
          if (minor < 28) {
            let length = minor;
            switch (minor) {
              case 24:
                length = this.reader.u8();
                break;
              case 25:
                length = this.reader.u16();
                break;
              case 26:
                length = this.reader.u32();
                break;
              case 27:
                length = Number(this.reader.u64());
                break;
            }
            const obj = {};
            for (let i = 0; i < length; i++) {
              const key = this.key();
              if (key === "__proto__")
                throw 6;
              const value = this.readAny();
              obj[key] = value;
            }
            return obj;
          } else if (minor === 31)
            return this.readObjIndef();
          else
            throw 1;
        }
        /** Remove this? */
        readObjRaw(length) {
          const obj = {};
          for (let i = 0; i < length; i++) {
            const key = this.key();
            const value = this.readAny();
            obj[key] = value;
          }
          return obj;
        }
        readObjIndef() {
          const obj = {};
          while (this.reader.peak() !== 255) {
            const key = this.key();
            if (this.reader.peak() === 255)
              throw 7;
            const value = this.readAny();
            obj[key] = value;
          }
          this.reader.x++;
          return obj;
        }
        key() {
          const octet = this.reader.u8();
          const major = octet >> 5;
          const minor = octet & 31;
          if (major !== 3)
            return String(this.readAnyRaw(octet));
          const length = this.readStrLen(minor);
          if (length > 31)
            return this.reader.utf8(length);
          const key = this.keyDecoder.decode(this.reader.uint8, this.reader.x, length);
          this.reader.skip(length);
          return key;
        }
        // Tag reading
        readTag(minor) {
          if (minor <= 23)
            return this.readTagRaw(minor);
          switch (minor) {
            case 24:
              return this.readTagRaw(this.reader.u8());
            case 25:
              return this.readTagRaw(this.reader.u16());
            case 26:
              return this.readTagRaw(this.reader.u32());
            case 27:
              return this.readTagRaw(Number(this.reader.u64()));
            default:
              throw 1;
          }
        }
        readTagRaw(tag) {
          return new JsonPackExtension_1.JsonPackExtension(tag, this.readAny());
        }
        // Token reading
        readTkn(minor) {
          switch (minor) {
            case 244 & 31:
              return false;
            case 245 & 31:
              return true;
            case 246 & 31:
              return null;
            case 247 & 31:
              return void 0;
            case 248 & 31:
              return new JsonPackValue_1.JsonPackValue(this.reader.u8());
            case 249 & 31:
              return this.f16();
            case 250 & 31:
              return this.reader.f32();
            case 251 & 31:
              return this.reader.f64();
          }
          if (minor <= 23)
            return new JsonPackValue_1.JsonPackValue(minor);
          throw 1;
        }
        f16() {
          return (0, f16_1.decodeF16)(this.reader.u16());
        }
      };
      exports.CborDecoderBase = CborDecoderBase;
    }
  });

  // node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/json-pack/lib/cbor/CborDecoder.js
  var require_CborDecoder = __commonJS({
    "node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/json-pack/lib/cbor/CborDecoder.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.CborDecoder = void 0;
      var CborDecoderBase_1 = require_CborDecoderBase();
      var JsonPackValue_1 = require_JsonPackValue();
      var CborDecoder = class extends CborDecoderBase_1.CborDecoderBase {
        // Map reading
        readAsMap() {
          const octet = this.reader.u8();
          const major = octet >> 5;
          const minor = octet & 31;
          switch (major) {
            case 5:
              return this.readMap(minor);
            default:
              throw 0;
          }
        }
        readMap(minor) {
          const length = this.readMinorLen(minor);
          if (length >= 0)
            return this.readMapRaw(length);
          else
            return this.readMapIndef();
        }
        readMapRaw(length) {
          const map = /* @__PURE__ */ new Map();
          for (let i = 0; i < length; i++) {
            const key = this.readAny();
            const value = this.readAny();
            map.set(key, value);
          }
          return map;
        }
        readMapIndef() {
          const map = /* @__PURE__ */ new Map();
          while (this.reader.peak() !== 255) {
            const key = this.readAny();
            if (this.reader.peak() === 255)
              throw 7;
            const value = this.readAny();
            map.set(key, value);
          }
          this.reader.x++;
          return map;
        }
        // Value skipping
        skipN(n) {
          for (let i = 0; i < n; i++)
            this.skipAny();
        }
        skipAny() {
          this.skipAnyRaw(this.reader.u8());
        }
        skipAnyRaw(octet) {
          const major = octet >> 5;
          const minor = octet & 31;
          switch (major) {
            case 0:
            case 1:
              this.skipUNint(minor);
              break;
            case 2:
              this.skipBin(minor);
              break;
            case 3:
              this.skipStr(minor);
              break;
            case 4:
              this.skipArr(minor);
              break;
            case 5:
              this.skipObj(minor);
              break;
            case 7:
              this.skipTkn(minor);
              break;
            case 6:
              this.skipTag(minor);
              break;
          }
        }
        skipMinorLen(minor) {
          if (minor <= 23)
            return minor;
          switch (minor) {
            case 24:
              return this.reader.u8();
            case 25:
              return this.reader.u16();
            case 26:
              return this.reader.u32();
            case 27:
              return Number(this.reader.u64());
            case 31:
              return -1;
            default:
              throw 1;
          }
        }
        // Integer skipping
        skipUNint(minor) {
          if (minor <= 23)
            return;
          switch (minor) {
            case 24:
              return this.reader.skip(1);
            case 25:
              return this.reader.skip(2);
            case 26:
              return this.reader.skip(4);
            case 27:
              return this.reader.skip(8);
            default:
              throw 1;
          }
        }
        // Binary skipping
        skipBin(minor) {
          const length = this.skipMinorLen(minor);
          if (length >= 0)
            this.reader.skip(length);
          else {
            while (this.reader.peak() !== 255)
              this.skipBinChunk();
            this.reader.x++;
          }
        }
        skipBinChunk() {
          const octet = this.reader.u8();
          const major = octet >> 5;
          const minor = octet & 31;
          if (major !== 2)
            throw 2;
          if (minor > 27)
            throw 3;
          this.skipBin(minor);
        }
        // String skipping
        skipStr(minor) {
          const length = this.skipMinorLen(minor);
          if (length >= 0)
            this.reader.skip(length);
          else {
            while (this.reader.peak() !== 255)
              this.skipStrChunk();
            this.reader.x++;
          }
        }
        skipStrChunk() {
          const octet = this.reader.u8();
          const major = octet >> 5;
          const minor = octet & 31;
          if (major !== 3)
            throw 4;
          if (minor > 27)
            throw 5;
          this.skipStr(minor);
        }
        // Array skipping
        skipArr(minor) {
          const length = this.skipMinorLen(minor);
          if (length >= 0)
            this.skipN(length);
          else {
            while (this.reader.peak() !== 255)
              this.skipAny();
            this.reader.x++;
          }
        }
        // Object skipping
        skipObj(minor) {
          const length = this.readMinorLen(minor);
          if (length >= 0)
            return this.skipN(length * 2);
          else {
            while (this.reader.peak() !== 255) {
              this.skipAny();
              if (this.reader.peak() === 255)
                throw 7;
              this.skipAny();
            }
            this.reader.x++;
          }
        }
        // Tag skipping
        skipTag(minor) {
          const length = this.skipMinorLen(minor);
          if (length < 0)
            throw 1;
          this.skipAny();
        }
        // Token skipping
        skipTkn(minor) {
          switch (minor) {
            case 248 & 31:
              this.reader.skip(1);
              return;
            case 249 & 31:
              this.reader.skip(2);
              return;
            case 250 & 31:
              this.reader.skip(4);
              return;
            case 251 & 31:
              this.reader.skip(8);
              return;
          }
          if (minor <= 23)
            return;
          throw 1;
        }
        // Validation
        /**
         * Throws if at given offset in a buffer there is an invalid CBOR value, or
         * if the value does not span the exact length specified in `size`. I.e.
         * throws if:
         *
         * - The value is not a valid CBOR value.
         * - The value is shorter than `size`.
         * - The value is longer than `size`.
         *
         * @param value Buffer in which to validate CBOR value.
         * @param offset Offset at which the value starts.
         * @param size Expected size of the value.
         */
        validate(value, offset = 0, size = value.length) {
          this.reader.reset(value);
          this.reader.x = offset;
          const start = offset;
          this.skipAny();
          const end = this.reader.x;
          if (end - start !== size)
            throw 8;
        }
        // One level reading: any value
        decodeLevel(value) {
          this.reader.reset(value);
          return this.readLevel();
        }
        /**
         * Decodes only one level of objects and arrays. Other values are decoded
         * completely.
         *
         * @returns One level of decoded CBOR value.
         */
        readLevel() {
          const octet = this.reader.u8();
          const major = octet >> 5;
          const minor = octet & 31;
          switch (major) {
            case 4:
              return this.readArrLevel(minor);
            case 5:
              return this.readObjLevel(minor);
            default:
              return super.readAnyRaw(octet);
          }
        }
        /**
         * Decodes primitive values, returns container values as `JsonPackValue`.
         *
         * @returns A primitive value, or CBOR container value as a blob.
         */
        readPrimitiveOrVal() {
          const octet = this.reader.peak();
          const major = octet >> 5;
          switch (major) {
            case 4:
            case 5:
              return this.readAsValue();
            default:
              return this.readAny();
          }
        }
        readAsValue() {
          const reader = this.reader;
          const start = reader.x;
          this.skipAny();
          const end = reader.x;
          return new JsonPackValue_1.JsonPackValue(reader.uint8.subarray(start, end));
        }
        // One level reading: object
        readObjLevel(minor) {
          const length = this.readMinorLen(minor);
          if (length >= 0)
            return this.readObjRawLevel(length);
          else
            return this.readObjIndefLevel();
        }
        readObjRawLevel(length) {
          const obj = {};
          for (let i = 0; i < length; i++) {
            const key = this.key();
            const value = this.readPrimitiveOrVal();
            obj[key] = value;
          }
          return obj;
        }
        readObjIndefLevel() {
          const obj = {};
          while (this.reader.peak() !== 255) {
            const key = this.key();
            if (this.reader.peak() === 255)
              throw 7;
            const value = this.readPrimitiveOrVal();
            obj[key] = value;
          }
          this.reader.x++;
          return obj;
        }
        // One level reading: array
        readArrLevel(minor) {
          const length = this.readMinorLen(minor);
          if (length >= 0)
            return this.readArrRawLevel(length);
          return this.readArrIndefLevel();
        }
        readArrRawLevel(length) {
          const arr = [];
          for (let i = 0; i < length; i++)
            arr.push(this.readPrimitiveOrVal());
          return arr;
        }
        readArrIndefLevel() {
          const arr = [];
          while (this.reader.peak() !== 255)
            arr.push(this.readPrimitiveOrVal());
          this.reader.x++;
          return arr;
        }
        // Shallow reading
        readHdr(expectedMajor) {
          const octet = this.reader.u8();
          const major = octet >> 5;
          if (major !== expectedMajor)
            throw 0;
          const minor = octet & 31;
          if (minor < 24)
            return minor;
          switch (minor) {
            case 24:
              return this.reader.u8();
            case 25:
              return this.reader.u16();
            case 26:
              return this.reader.u32();
            case 27:
              return Number(this.reader.u64());
            case 31:
              return -1;
          }
          throw 1;
        }
        readStrHdr() {
          return this.readHdr(
            3
            /* MAJOR.STR */
          );
        }
        readObjHdr() {
          return this.readHdr(
            5
            /* MAJOR.MAP */
          );
        }
        readArrHdr() {
          return this.readHdr(
            4
            /* MAJOR.ARR */
          );
        }
        findKey(key) {
          const size = this.readObjHdr();
          for (let i = 0; i < size; i++) {
            const k = this.key();
            if (k === key)
              return this;
            this.skipAny();
          }
          throw 9;
        }
        findIndex(index) {
          const size = this.readArrHdr();
          if (index >= size)
            throw 10;
          for (let i = 0; i < index; i++)
            this.skipAny();
          return this;
        }
        find(path) {
          for (let i = 0; i < path.length; i++) {
            const segment = path[i];
            if (typeof segment === "string")
              this.findKey(segment);
            else
              this.findIndex(segment);
          }
          return this;
        }
      };
      exports.CborDecoder = CborDecoder;
    }
  });

  // node_modules/@jsonjoy.com/fs-snapshot/lib/async.js
  var require_async = __commonJS({
    "node_modules/@jsonjoy.com/fs-snapshot/lib/async.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.fromSnapshot = exports.toSnapshot = void 0;
      var shared_1 = require_shared();
      var toSnapshot = async ({ fs, path = "/", separator = "/" }) => {
        const stats = await fs.lstat(path);
        if (stats.isDirectory()) {
          const list = await fs.readdir(path);
          const entries = {};
          const dir = path.endsWith(separator) ? path : path + separator;
          const snapshots = await Promise.all(list.map((child) => (0, exports.toSnapshot)({ fs, path: `${dir}${child}`, separator })));
          for (let i = 0; i < list.length; i++) {
            if (snapshots[i])
              entries["" + list[i]] = snapshots[i];
          }
          return [0, {}, entries];
        } else if (stats.isFile()) {
          const buf = await fs.readFile(path);
          const uint8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
          return [1, {}, uint8];
        } else if (stats.isSymbolicLink()) {
          return [
            2,
            {
              target: await fs.readlink(path, { encoding: "utf8" })
            }
          ];
        }
        return null;
      };
      exports.toSnapshot = toSnapshot;
      var fromSnapshot = async (snapshot, { fs, path = "/", separator = "/" }) => {
        if (!snapshot)
          return;
        switch (snapshot[0]) {
          case 0: {
            if (!path.endsWith(separator))
              path = path + separator;
            const [, , entries] = snapshot;
            await fs.mkdir(path, { recursive: true });
            for (const [name, child] of Object.entries(entries)) {
              (0, shared_1.validateEntryName)(name);
              await (0, exports.fromSnapshot)(child, { fs, path: `${path}${name}`, separator });
            }
            break;
          }
          case 1: {
            const [, , data] = snapshot;
            await fs.writeFile(path, data);
            break;
          }
          case 2: {
            const [, { target }] = snapshot;
            await fs.symlink(target, path);
            break;
          }
        }
      };
      exports.fromSnapshot = fromSnapshot;
    }
  });

  // node_modules/@jsonjoy.com/fs-snapshot/lib/binary.js
  var require_binary = __commonJS({
    "node_modules/@jsonjoy.com/fs-snapshot/lib/binary.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.fromBinarySnapshot = exports.toBinarySnapshot = exports.fromBinarySnapshotSync = exports.toBinarySnapshotSync = void 0;
      var CborEncoder_1 = require_CborEncoder();
      var CborDecoder_1 = require_CborDecoder();
      var sync_1 = require_sync();
      var async_1 = require_async();
      var shared_1 = require_shared();
      var encoder = new CborEncoder_1.CborEncoder(shared_1.writer);
      var decoder = new CborDecoder_1.CborDecoder();
      var toBinarySnapshotSync = (options) => {
        const snapshot = (0, sync_1.toSnapshotSync)(options);
        return encoder.encode(snapshot);
      };
      exports.toBinarySnapshotSync = toBinarySnapshotSync;
      var fromBinarySnapshotSync = (uint8, options) => {
        const snapshot = decoder.decode(uint8);
        (0, sync_1.fromSnapshotSync)(snapshot, options);
      };
      exports.fromBinarySnapshotSync = fromBinarySnapshotSync;
      var toBinarySnapshot = async (options) => {
        const snapshot = await (0, async_1.toSnapshot)(options);
        return encoder.encode(snapshot);
      };
      exports.toBinarySnapshot = toBinarySnapshot;
      var fromBinarySnapshot = async (uint8, options) => {
        const snapshot = decoder.decode(uint8);
        await (0, async_1.fromSnapshot)(snapshot, options);
      };
      exports.fromBinarySnapshot = fromBinarySnapshot;
    }
  });

  // node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/base64/lib/constants.js
  var require_constants4 = __commonJS({
    "node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/base64/lib/constants.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.hasBuffer = exports.alphabet = void 0;
      exports.alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      exports.hasBuffer = typeof import_buffer.Buffer === "function" && typeof import_buffer.Buffer.from === "function";
    }
  });

  // node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/base64/lib/createToBase64Bin.js
  var require_createToBase64Bin = __commonJS({
    "node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/base64/lib/createToBase64Bin.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.createToBase64Bin = void 0;
      var constants_1 = require_constants4();
      var createToBase64Bin = (chars = constants_1.alphabet, pad = "=") => {
        if (chars.length !== 64)
          throw new Error("chars must be 64 characters long");
        const table = chars.split("").map((c) => c.charCodeAt(0));
        const table2 = [];
        for (const c1 of table) {
          for (const c2 of table) {
            const two = (c1 << 8) + c2;
            table2.push(two);
          }
        }
        const doAddPadding = pad.length === 1;
        const E = doAddPadding ? pad.charCodeAt(0) : 0;
        const EE = doAddPadding ? E << 8 | E : 0;
        return (uint8, start, length, dest, offset) => {
          const extraLength = length % 3;
          const baseLength = length - extraLength;
          for (; start < baseLength; start += 3) {
            const o1 = uint8[start];
            const o2 = uint8[start + 1];
            const o3 = uint8[start + 2];
            const v1 = o1 << 4 | o2 >> 4;
            const v2 = (o2 & 15) << 8 | o3;
            dest.setInt32(offset, (table2[v1] << 16) + table2[v2]);
            offset += 4;
          }
          if (extraLength === 1) {
            const o1 = uint8[baseLength];
            if (doAddPadding) {
              dest.setInt32(offset, (table2[o1 << 4] << 16) + EE);
              offset += 4;
            } else {
              dest.setInt16(offset, table2[o1 << 4]);
              offset += 2;
            }
          } else if (extraLength) {
            const o1 = uint8[baseLength];
            const o2 = uint8[baseLength + 1];
            const v1 = o1 << 4 | o2 >> 4;
            const v2 = (o2 & 15) << 2;
            if (doAddPadding) {
              dest.setInt32(offset, (table2[v1] << 16) + (table[v2] << 8) + E);
              offset += 4;
            } else {
              dest.setInt16(offset, table2[v1]);
              offset += 2;
              dest.setInt8(offset, table[v2]);
              offset += 1;
            }
          }
          return offset;
        };
      };
      exports.createToBase64Bin = createToBase64Bin;
    }
  });

  // node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/base64/lib/toBase64Bin.js
  var require_toBase64Bin = __commonJS({
    "node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/base64/lib/toBase64Bin.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.toBase64Bin = void 0;
      var createToBase64Bin_1 = require_createToBase64Bin();
      exports.toBase64Bin = (0, createToBase64Bin_1.createToBase64Bin)();
    }
  });

  // node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/json-pack/lib/json/JsonEncoder.js
  var require_JsonEncoder = __commonJS({
    "node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/json-pack/lib/json/JsonEncoder.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.JsonEncoder = void 0;
      var toBase64Bin_1 = require_toBase64Bin();
      var JsonEncoder = class {
        constructor(writer) {
          this.writer = writer;
        }
        encode(value) {
          const writer = this.writer;
          writer.reset();
          this.writeAny(value);
          return writer.flush();
        }
        /**
         * Called when the encoder encounters a value that it does not know how to encode.
         *
         * @param value Some JavaScript value.
         */
        writeUnknown(value) {
          this.writeNull();
        }
        writeAny(value) {
          switch (typeof value) {
            case "boolean":
              return this.writeBoolean(value);
            case "number":
              return this.writeNumber(value);
            case "string":
              return this.writeStr(value);
            case "object": {
              if (value === null)
                return this.writeNull();
              const constr = value.constructor;
              switch (constr) {
                case Object:
                  return this.writeObj(value);
                case Array:
                  return this.writeArr(value);
                case Uint8Array:
                  return this.writeBin(value);
                default:
                  if (value instanceof Uint8Array)
                    return this.writeBin(value);
                  if (Array.isArray(value))
                    return this.writeArr(value);
                  return this.writeUnknown(value);
              }
            }
            case "undefined": {
              return this.writeUndef();
            }
            default:
              return this.writeUnknown(value);
          }
        }
        writeNull() {
          this.writer.u32(1853189228);
        }
        writeUndef() {
          const writer = this.writer;
          const length = 35;
          writer.ensureCapacity(length);
          const view = writer.view;
          let x = writer.x;
          view.setUint32(x, 577003892);
          x += 4;
          view.setUint32(x, 1631215984);
          x += 4;
          view.setUint32(x, 1886153059);
          x += 4;
          view.setUint32(x, 1635019119);
          x += 4;
          view.setUint32(x, 1848599394);
          x += 4;
          view.setUint32(x, 1869753442);
          x += 4;
          view.setUint32(x, 1634952502);
          x += 4;
          view.setUint32(x, 876296567);
          x += 4;
          view.setUint16(x, 15677);
          x += 2;
          writer.uint8[x++] = 34;
          writer.x = x;
        }
        writeBoolean(bool) {
          if (bool)
            this.writer.u32(1953658213);
          else
            this.writer.u8u32(102, 1634497381);
        }
        writeNumber(num) {
          const str = num.toString();
          this.writer.ascii(str);
        }
        writeInteger(int) {
          this.writeNumber(int >> 0 === int ? int : Math.trunc(int));
        }
        writeUInteger(uint) {
          this.writeInteger(uint < 0 ? -uint : uint);
        }
        writeFloat(float) {
          this.writeNumber(float);
        }
        writeBin(buf) {
          const writer = this.writer;
          const length = buf.length;
          writer.ensureCapacity(38 + 3 + (length << 1));
          const view = writer.view;
          let x = writer.x;
          view.setUint32(x, 577003892);
          x += 4;
          view.setUint32(x, 1631215984);
          x += 4;
          view.setUint32(x, 1886153059);
          x += 4;
          view.setUint32(x, 1635019119);
          x += 4;
          view.setUint32(x, 1848602467);
          x += 4;
          view.setUint32(x, 1952805933);
          x += 4;
          view.setUint32(x, 1937011301);
          x += 4;
          view.setUint32(x, 1634548578);
          x += 4;
          view.setUint32(x, 1634952502);
          x += 4;
          view.setUint16(x, 13356);
          x += 2;
          x = (0, toBase64Bin_1.toBase64Bin)(buf, 0, length, view, x);
          writer.uint8[x++] = 34;
          writer.x = x;
        }
        writeStr(str) {
          const writer = this.writer;
          const length = str.length;
          writer.ensureCapacity(length * 4 + 2);
          if (length < 256) {
            const startX = writer.x;
            let x = startX;
            const uint8 = writer.uint8;
            uint8[x++] = 34;
            for (let i = 0; i < length; i++) {
              const code = str.charCodeAt(i);
              switch (code) {
                case 34:
                // "
                case 92:
                  uint8[x++] = 92;
                  break;
              }
              if (code < 32 || code > 126) {
                writer.x = startX;
                const jsonStr2 = JSON.stringify(str);
                writer.ensureCapacity(jsonStr2.length * 4 + 4);
                writer.utf8(jsonStr2);
                return;
              } else
                uint8[x++] = code;
            }
            uint8[x++] = 34;
            writer.x = x;
            return;
          }
          const jsonStr = JSON.stringify(str);
          writer.ensureCapacity(jsonStr.length * 4 + 4);
          writer.utf8(jsonStr);
        }
        writeAsciiStr(str) {
          const length = str.length;
          const writer = this.writer;
          writer.ensureCapacity(length * 2 + 2);
          const uint8 = writer.uint8;
          let x = writer.x;
          uint8[x++] = 34;
          for (let i = 0; i < length; i++) {
            const code = str.charCodeAt(i);
            switch (code) {
              case 34:
              // "
              case 92:
                uint8[x++] = 92;
                break;
            }
            uint8[x++] = code;
          }
          uint8[x++] = 34;
          writer.x = x;
        }
        writeArr(arr) {
          const writer = this.writer;
          writer.u8(91);
          const length = arr.length;
          const last = length - 1;
          for (let i = 0; i < last; i++) {
            this.writeAny(arr[i]);
            writer.u8(44);
          }
          if (last >= 0)
            this.writeAny(arr[last]);
          writer.u8(93);
        }
        writeArrSeparator() {
          this.writer.u8(44);
        }
        writeObj(obj) {
          const writer = this.writer;
          const keys = Object.keys(obj);
          const length = keys.length;
          if (!length)
            return writer.u16(31613);
          writer.u8(123);
          for (let i = 0; i < length; i++) {
            const key = keys[i];
            const value = obj[key];
            this.writeStr(key);
            writer.u8(58);
            this.writeAny(value);
            writer.u8(44);
          }
          writer.uint8[writer.x - 1] = 125;
        }
        writeObjSeparator() {
          this.writer.u8(44);
        }
        writeObjKeySeparator() {
          this.writer.u8(58);
        }
        // Streaming encoding
        writeStartStr() {
          throw new Error("Method not implemented.");
        }
        writeStrChunk(str) {
          throw new Error("Method not implemented.");
        }
        writeEndStr() {
          throw new Error("Method not implemented.");
        }
        writeStartBin() {
          throw new Error("Method not implemented.");
        }
        writeBinChunk(buf) {
          throw new Error("Method not implemented.");
        }
        writeEndBin() {
          throw new Error("Method not implemented.");
        }
        writeStartArr() {
          this.writer.u8(91);
        }
        writeArrChunk(item) {
          throw new Error("Method not implemented.");
        }
        writeEndArr() {
          this.writer.u8(93);
        }
        writeStartObj() {
          this.writer.u8(123);
        }
        writeObjChunk(key, value) {
          throw new Error("Method not implemented.");
        }
        writeEndObj() {
          this.writer.u8(125);
        }
      };
      exports.JsonEncoder = JsonEncoder;
    }
  });

  // node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/base64/lib/createFromBase64Bin.js
  var require_createFromBase64Bin = __commonJS({
    "node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/base64/lib/createFromBase64Bin.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.createFromBase64Bin = void 0;
      var constants_1 = require_constants4();
      var createFromBase64Bin = (chars = constants_1.alphabet, pad = "=") => {
        if (chars.length !== 64)
          throw new Error("chars must be 64 characters long");
        let max = 0;
        for (let i = 0; i < chars.length; i++)
          max = Math.max(max, chars.charCodeAt(i));
        const table = [];
        for (let i = 0; i <= max; i += 1)
          table[i] = -1;
        for (let i = 0; i < chars.length; i++)
          table[chars.charCodeAt(i)] = i;
        const doExpectPadding = pad.length === 1;
        const PAD = doExpectPadding ? pad.charCodeAt(0) : 0;
        return (view, offset, length) => {
          if (!length)
            return new Uint8Array(0);
          let padding = 0;
          if (length % 4 !== 0) {
            padding = 4 - length % 4;
            length += padding;
          } else {
            const end = offset + length;
            const last = end - 1;
            if (view.getUint8(last) === PAD) {
              padding = 1;
              if (length > 1 && view.getUint8(last - 1) === PAD)
                padding = 2;
            }
          }
          if (length % 4 !== 0)
            throw new Error("Base64 string length must be a multiple of 4");
          const mainEnd = offset + length - (padding ? 4 : 0);
          const bufferLength = (length >> 2) * 3 - padding;
          const buf = new Uint8Array(bufferLength);
          let j = 0;
          let i = offset;
          for (; i < mainEnd; i += 4) {
            const word2 = view.getUint32(i);
            const octet02 = word2 >>> 24;
            const octet12 = word2 >>> 16 & 255;
            const octet2 = word2 >>> 8 & 255;
            const octet3 = word2 & 255;
            const sextet02 = table[octet02];
            const sextet12 = table[octet12];
            const sextet2 = table[octet2];
            const sextet3 = table[octet3];
            if (sextet02 < 0 || sextet12 < 0 || sextet2 < 0 || sextet3 < 0)
              throw new Error("INVALID_BASE64_SEQ");
            buf[j] = sextet02 << 2 | sextet12 >> 4;
            buf[j + 1] = sextet12 << 4 | sextet2 >> 2;
            buf[j + 2] = sextet2 << 6 | sextet3;
            j += 3;
          }
          if (!padding)
            return buf;
          if (padding === 1) {
            const word2 = view.getUint16(mainEnd);
            const octet02 = word2 >> 8;
            const octet12 = word2 & 255;
            const octet2 = view.getUint8(mainEnd + 2);
            const sextet02 = table[octet02];
            const sextet12 = table[octet12];
            const sextet2 = table[octet2];
            if (sextet02 < 0 || sextet12 < 0 || sextet2 < 0)
              throw new Error("INVALID_BASE64_SEQ");
            buf[j] = sextet02 << 2 | sextet12 >> 4;
            buf[j + 1] = sextet12 << 4 | sextet2 >> 2;
            return buf;
          }
          const word = view.getUint16(mainEnd);
          const octet0 = word >> 8;
          const octet1 = word & 255;
          const sextet0 = table[octet0];
          const sextet1 = table[octet1];
          if (sextet0 < 0 || sextet1 < 0)
            throw new Error("INVALID_BASE64_SEQ");
          buf[j] = sextet0 << 2 | sextet1 >> 4;
          return buf;
        };
      };
      exports.createFromBase64Bin = createFromBase64Bin;
    }
  });

  // node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/base64/lib/fromBase64Bin.js
  var require_fromBase64Bin = __commonJS({
    "node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/base64/lib/fromBase64Bin.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.fromBase64Bin = void 0;
      var createFromBase64Bin_1 = require_createFromBase64Bin();
      exports.fromBase64Bin = (0, createFromBase64Bin_1.createFromBase64Bin)();
    }
  });

  // node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/json-pack/lib/json/util.js
  var require_util4 = __commonJS({
    "node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/json-pack/lib/json/util.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.findEndingQuote = void 0;
      var findEndingQuote = (uint8, x) => {
        const len = uint8.length;
        let char = uint8[x];
        let prev = 0;
        while (x < len) {
          if (char === 34 && prev !== 92)
            break;
          if (char === 92 && prev === 92)
            prev = 0;
          else
            prev = char;
          char = uint8[++x];
        }
        if (x === len)
          throw new Error("Invalid JSON");
        return x;
      };
      exports.findEndingQuote = findEndingQuote;
    }
  });

  // node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/json-pack/lib/json/JsonDecoder.js
  var require_JsonDecoder = __commonJS({
    "node_modules/@jsonjoy.com/fs-snapshot/node_modules/@jsonjoy.com/json-pack/lib/json/JsonDecoder.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.JsonDecoder = exports.readKey = void 0;
      var decodeUtf8_1 = require_decodeUtf8();
      var Reader_1 = require_Reader();
      var fromBase64Bin_1 = require_fromBase64Bin();
      var util_1 = require_util4();
      var REGEX_REPLACE_ESCAPED_CHARS = /\\(b|f|n|r|t|"|\/|\\)/g;
      var escapedCharReplacer = (char) => {
        switch (char) {
          case "\\b":
            return "\b";
          case "\\f":
            return "\f";
          case "\\n":
            return "\n";
          case "\\r":
            return "\r";
          case "\\t":
            return "	";
          case '\\"':
            return '"';
          case "\\/":
            return "/";
          case "\\\\":
            return "\\";
        }
        return char;
      };
      var hasBinaryPrefix = (u8, x) => u8[x] === 100 && u8[x + 1] === 97 && u8[x + 2] === 116 && u8[x + 3] === 97 && u8[x + 4] === 58 && u8[x + 5] === 97 && u8[x + 6] === 112 && u8[x + 7] === 112 && u8[x + 8] === 108 && u8[x + 9] === 105 && u8[x + 10] === 99 && u8[x + 11] === 97 && u8[x + 12] === 116 && u8[x + 13] === 105 && u8[x + 14] === 111 && u8[x + 15] === 110 && u8[x + 16] === 47 && u8[x + 17] === 111 && u8[x + 18] === 99 && u8[x + 19] === 116 && u8[x + 20] === 101 && u8[x + 21] === 116 && u8[x + 22] === 45 && u8[x + 23] === 115 && u8[x + 24] === 116 && u8[x + 25] === 114 && u8[x + 26] === 101 && u8[x + 27] === 97 && u8[x + 28] === 109 && u8[x + 29] === 59 && u8[x + 30] === 98 && u8[x + 31] === 97 && u8[x + 32] === 115 && u8[x + 33] === 101 && u8[x + 34] === 54 && u8[x + 35] === 52 && u8[x + 36] === 44;
      var isUndefined = (u8, x) => (
        // u8[x++] === 0x22 &&  // "
        // u8[x++] === 0x64 &&  // d
        u8[x++] === 97 && // a
        u8[x++] === 116 && // t
        u8[x++] === 97 && // a
        u8[x++] === 58 && // :
        u8[x++] === 97 && // a
        u8[x++] === 112 && // p
        u8[x++] === 112 && // p
        u8[x++] === 108 && // l
        u8[x++] === 105 && // i
        u8[x++] === 99 && // c
        u8[x++] === 97 && // a
        u8[x++] === 116 && // t
        u8[x++] === 105 && // i
        u8[x++] === 111 && // o
        u8[x++] === 110 && // n
        u8[x++] === 47 && // /
        u8[x++] === 99 && // c
        u8[x++] === 98 && // b
        u8[x++] === 111 && // o
        u8[x++] === 114 && // r
        u8[x++] === 44 && // ,
        u8[x++] === 98 && // b
        u8[x++] === 97 && // a
        u8[x++] === 115 && // s
        u8[x++] === 101 && // e
        u8[x++] === 54 && // 6
        u8[x++] === 52 && // 4
        u8[x++] === 59 && // ;
        u8[x++] === 57 && // 9
        u8[x++] === 119 && // w
        u8[x++] === 61 && // =
        u8[x++] === 61 && // =
        u8[x++] === 34
      );
      var fromCharCode = String.fromCharCode;
      var readKey = (reader) => {
        const buf = reader.uint8;
        const len = buf.length;
        const points = [];
        let x = reader.x;
        let prev = 0;
        while (x < len) {
          let code = buf[x++];
          if ((code & 128) === 0) {
            if (prev === 92) {
              switch (code) {
                case 98:
                  code = 8;
                  break;
                case 102:
                  code = 12;
                  break;
                case 110:
                  code = 10;
                  break;
                case 114:
                  code = 13;
                  break;
                case 116:
                  code = 9;
                  break;
                case 34:
                  code = 34;
                  break;
                case 47:
                  code = 47;
                  break;
                case 92:
                  code = 92;
                  break;
                default:
                  throw new Error("Invalid JSON");
              }
              prev = 0;
            } else {
              if (code === 34)
                break;
              prev = code;
              if (prev === 92)
                continue;
            }
          } else {
            const octet2 = buf[x++] & 63;
            if ((code & 224) === 192) {
              code = (code & 31) << 6 | octet2;
            } else {
              const octet3 = buf[x++] & 63;
              if ((code & 240) === 224) {
                code = (code & 31) << 12 | octet2 << 6 | octet3;
              } else {
                if ((code & 248) === 240) {
                  const octet4 = buf[x++] & 63;
                  let unit = (code & 7) << 18 | octet2 << 12 | octet3 << 6 | octet4;
                  if (unit > 65535) {
                    unit -= 65536;
                    const unit0 = unit >>> 10 & 1023 | 55296;
                    unit = 56320 | unit & 1023;
                    points.push(unit0);
                    code = unit;
                  } else {
                    code = unit;
                  }
                }
              }
            }
          }
          points.push(code);
        }
        reader.x = x;
        return fromCharCode.apply(String, points);
      };
      exports.readKey = readKey;
      var JsonDecoder = class {
        constructor() {
          this.reader = new Reader_1.Reader();
        }
        read(uint8) {
          this.reader.reset(uint8);
          return this.readAny();
        }
        decode(uint8) {
          this.reader.reset(uint8);
          return this.readAny();
        }
        readAny() {
          this.skipWhitespace();
          const reader = this.reader;
          const x = reader.x;
          const uint8 = reader.uint8;
          const char = uint8[x];
          switch (char) {
            case 34: {
              if (uint8[x + 1] === 100) {
                const bin = this.tryReadBin();
                if (bin)
                  return bin;
                if (isUndefined(uint8, x + 2)) {
                  reader.x = x + 35;
                  return void 0;
                }
              }
              return this.readStr();
            }
            case 91:
              return this.readArr();
            case 102:
              return this.readFalse();
            case 110:
              return this.readNull();
            case 116:
              return this.readTrue();
            case 123:
              return this.readObj();
            default:
              if (char >= 48 && char <= 57 || char === 45)
                return this.readNum();
              throw new Error("Invalid JSON");
          }
        }
        skipWhitespace() {
          const reader = this.reader;
          const uint8 = reader.uint8;
          let x = reader.x;
          let char = 0;
          while (true) {
            char = uint8[x];
            switch (char) {
              case 32:
              case 9:
              case 10:
              case 13:
                x++;
                continue;
              default:
                reader.x = x;
                return;
            }
          }
        }
        readNull() {
          if (this.reader.u32() !== 1853189228)
            throw new Error("Invalid JSON");
          return null;
        }
        readTrue() {
          if (this.reader.u32() !== 1953658213)
            throw new Error("Invalid JSON");
          return true;
        }
        readFalse() {
          const reader = this.reader;
          if (reader.u8() !== 102 || reader.u32() !== 1634497381)
            throw new Error("Invalid JSON");
          return false;
        }
        readBool() {
          const reader = this.reader;
          switch (reader.uint8[reader.x]) {
            case 102:
              return this.readFalse();
            case 116:
              return this.readTrue();
            default:
              throw new Error("Invalid JSON");
          }
        }
        readNum() {
          const reader = this.reader;
          const uint8 = reader.uint8;
          let x = reader.x;
          let c = uint8[x++];
          const c1 = c;
          c = uint8[x++];
          if (!c || (c < 45 || c > 57) && c !== 43 && c !== 69 && c !== 101) {
            reader.x = x - 1;
            const num = +fromCharCode(c1);
            if (num !== num)
              throw new Error("Invalid JSON");
            return num;
          }
          const c2 = c;
          c = uint8[x++];
          if (!c || (c < 45 || c > 57) && c !== 43 && c !== 69 && c !== 101) {
            reader.x = x - 1;
            const num = +fromCharCode(c1, c2);
            if (num !== num)
              throw new Error("Invalid JSON");
            return num;
          }
          const c3 = c;
          c = uint8[x++];
          if (!c || (c < 45 || c > 57) && c !== 43 && c !== 69 && c !== 101) {
            reader.x = x - 1;
            const num = +fromCharCode(c1, c2, c3);
            if (num !== num)
              throw new Error("Invalid JSON");
            return num;
          }
          const c4 = c;
          c = uint8[x++];
          if (!c || (c < 45 || c > 57) && c !== 43 && c !== 69 && c !== 101) {
            reader.x = x - 1;
            const num = +fromCharCode(c1, c2, c3, c4);
            if (num !== num)
              throw new Error("Invalid JSON");
            return num;
          }
          const c5 = c;
          c = uint8[x++];
          if (!c || (c < 45 || c > 57) && c !== 43 && c !== 69 && c !== 101) {
            reader.x = x - 1;
            const num = +fromCharCode(c1, c2, c3, c4, c5);
            if (num !== num)
              throw new Error("Invalid JSON");
            return num;
          }
          const c6 = c;
          c = uint8[x++];
          if (!c || (c < 45 || c > 57) && c !== 43 && c !== 69 && c !== 101) {
            reader.x = x - 1;
            const num = +fromCharCode(c1, c2, c3, c4, c5, c6);
            if (num !== num)
              throw new Error("Invalid JSON");
            return num;
          }
          const c7 = c;
          c = uint8[x++];
          if (!c || (c < 45 || c > 57) && c !== 43 && c !== 69 && c !== 101) {
            reader.x = x - 1;
            const num = +fromCharCode(c1, c2, c3, c4, c5, c6, c7);
            if (num !== num)
              throw new Error("Invalid JSON");
            return num;
          }
          const c8 = c;
          c = uint8[x++];
          if (!c || (c < 45 || c > 57) && c !== 43 && c !== 69 && c !== 101) {
            reader.x = x - 1;
            const num = +fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8);
            if (num !== num)
              throw new Error("Invalid JSON");
            return num;
          }
          const c9 = c;
          c = uint8[x++];
          if (!c || (c < 45 || c > 57) && c !== 43 && c !== 69 && c !== 101) {
            reader.x = x - 1;
            const num = +fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8, c9);
            if (num !== num)
              throw new Error("Invalid JSON");
            return num;
          }
          const c10 = c;
          c = uint8[x++];
          if (!c || (c < 45 || c > 57) && c !== 43 && c !== 69 && c !== 101) {
            reader.x = x - 1;
            const num = +fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8, c9, c10);
            if (num !== num)
              throw new Error("Invalid JSON");
            return num;
          }
          const c11 = c;
          c = uint8[x++];
          if (!c || (c < 45 || c > 57) && c !== 43 && c !== 69 && c !== 101) {
            reader.x = x - 1;
            const num = +fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11);
            if (num !== num)
              throw new Error("Invalid JSON");
            return num;
          }
          const c12 = c;
          c = uint8[x++];
          if (!c || (c < 45 || c > 57) && c !== 43 && c !== 69 && c !== 101) {
            reader.x = x - 1;
            const num = +fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12);
            if (num !== num)
              throw new Error("Invalid JSON");
            return num;
          }
          const c13 = c;
          c = uint8[x++];
          if (!c || (c < 45 || c > 57) && c !== 43 && c !== 69 && c !== 101) {
            reader.x = x - 1;
            const num = +fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13);
            if (num !== num)
              throw new Error("Invalid JSON");
            return num;
          }
          const c14 = c;
          c = uint8[x++];
          if (!c || (c < 45 || c > 57) && c !== 43 && c !== 69 && c !== 101) {
            reader.x = x - 1;
            const num = +fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14);
            if (num !== num)
              throw new Error("Invalid JSON");
            return num;
          }
          const c15 = c;
          c = uint8[x++];
          if (!c || (c < 45 || c > 57) && c !== 43 && c !== 69 && c !== 101) {
            reader.x = x - 1;
            const num = +fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15);
            if (num !== num)
              throw new Error("Invalid JSON");
            return num;
          }
          const c16 = c;
          c = uint8[x++];
          if (!c || (c < 45 || c > 57) && c !== 43 && c !== 69 && c !== 101) {
            reader.x = x - 1;
            const num = +fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16);
            if (num !== num)
              throw new Error("Invalid JSON");
            return num;
          }
          const c17 = c;
          c = uint8[x++];
          if (!c || (c < 45 || c > 57) && c !== 43 && c !== 69 && c !== 101) {
            reader.x = x - 1;
            const num = +fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16, c17);
            if (num !== num)
              throw new Error("Invalid JSON");
            return num;
          }
          const c18 = c;
          c = uint8[x++];
          if (!c || (c < 45 || c > 57) && c !== 43 && c !== 69 && c !== 101) {
            reader.x = x - 1;
            const num = +fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16, c17, c18);
            if (num !== num)
              throw new Error("Invalid JSON");
            return num;
          }
          const c19 = c;
          c = uint8[x++];
          if (!c || (c < 45 || c > 57) && c !== 43 && c !== 69 && c !== 101) {
            reader.x = x - 1;
            const num = +fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16, c17, c18, c19);
            if (num !== num)
              throw new Error("Invalid JSON");
            return num;
          }
          const c20 = c;
          c = uint8[x++];
          if (!c || (c < 45 || c > 57) && c !== 43 && c !== 69 && c !== 101) {
            reader.x = x - 1;
            const num = +fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16, c17, c18, c19, c20);
            if (num !== num)
              throw new Error("Invalid JSON");
            return num;
          }
          const c21 = c;
          c = uint8[x++];
          if (!c || (c < 45 || c > 57) && c !== 43 && c !== 69 && c !== 101) {
            reader.x = x - 1;
            const num = +fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16, c17, c18, c19, c20, c21);
            if (num !== num)
              throw new Error("Invalid JSON");
            return num;
          }
          const c22 = c;
          c = uint8[x++];
          if (!c || (c < 45 || c > 57) && c !== 43 && c !== 69 && c !== 101) {
            reader.x = x - 1;
            const num = +fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16, c17, c18, c19, c20, c21, c22);
            if (num !== num)
              throw new Error("Invalid JSON");
            return num;
          }
          const c23 = c;
          c = uint8[x++];
          if (!c || (c < 45 || c > 57) && c !== 43 && c !== 69 && c !== 101) {
            reader.x = x - 1;
            const num = +fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16, c17, c18, c19, c20, c21, c22, c23);
            if (num !== num)
              throw new Error("Invalid JSON");
            return num;
          }
          const c24 = c;
          c = uint8[x++];
          if (!c || (c < 45 || c > 57) && c !== 43 && c !== 69 && c !== 101) {
            reader.x = x - 1;
            const num = +fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16, c17, c18, c19, c20, c21, c22, c23, c24);
            if (num !== num)
              throw new Error("Invalid JSON");
            return num;
          }
          throw new Error("Invalid JSON");
        }
        readStr() {
          const reader = this.reader;
          const uint8 = reader.uint8;
          const char = uint8[reader.x++];
          if (char !== 34)
            throw new Error("Invalid JSON");
          const x0 = reader.x;
          const x1 = (0, util_1.findEndingQuote)(uint8, x0);
          let str = (0, decodeUtf8_1.decodeUtf8)(uint8, x0, x1 - x0);
          str = str.replace(REGEX_REPLACE_ESCAPED_CHARS, escapedCharReplacer);
          reader.x = x1 + 1;
          return str;
        }
        tryReadBin() {
          const reader = this.reader;
          const u8 = reader.uint8;
          let x = reader.x;
          if (u8[x++] !== 34)
            return void 0;
          const hasDataUrlPrefix = hasBinaryPrefix(u8, x);
          if (!hasDataUrlPrefix)
            return void 0;
          x += 37;
          const x0 = x;
          x = (0, util_1.findEndingQuote)(u8, x);
          reader.x = x0;
          const bin = (0, fromBase64Bin_1.fromBase64Bin)(reader.view, x0, x - x0);
          reader.x = x + 1;
          return bin;
        }
        readBin() {
          const reader = this.reader;
          const u8 = reader.uint8;
          let x = reader.x;
          if (u8[x++] !== 34)
            throw new Error("Invalid JSON");
          const hasDataUrlPrefix = hasBinaryPrefix(u8, x);
          if (!hasDataUrlPrefix)
            throw new Error("Invalid JSON");
          x += 37;
          const x0 = x;
          x = (0, util_1.findEndingQuote)(u8, x);
          reader.x = x0;
          const bin = (0, fromBase64Bin_1.fromBase64Bin)(reader.view, x0, x - x0);
          reader.x = x + 1;
          return bin;
        }
        readArr() {
          const reader = this.reader;
          if (reader.u8() !== 91)
            throw new Error("Invalid JSON");
          const arr = [];
          const uint8 = reader.uint8;
          let first = true;
          while (true) {
            this.skipWhitespace();
            const char = uint8[reader.x];
            if (char === 93)
              return reader.x++, arr;
            if (char === 44)
              reader.x++;
            else if (!first)
              throw new Error("Invalid JSON");
            this.skipWhitespace();
            arr.push(this.readAny());
            first = false;
          }
        }
        readObj() {
          const reader = this.reader;
          if (reader.u8() !== 123)
            throw new Error("Invalid JSON");
          const obj = {};
          const uint8 = reader.uint8;
          let first = true;
          while (true) {
            this.skipWhitespace();
            let char = uint8[reader.x];
            if (char === 125)
              return reader.x++, obj;
            if (char === 44)
              reader.x++;
            else if (!first)
              throw new Error("Invalid JSON");
            this.skipWhitespace();
            char = uint8[reader.x++];
            if (char !== 34)
              throw new Error("Invalid JSON");
            const key = (0, exports.readKey)(reader);
            if (key === "__proto__")
              throw new Error("Invalid JSON");
            this.skipWhitespace();
            if (reader.u8() !== 58)
              throw new Error("Invalid JSON");
            this.skipWhitespace();
            obj[key] = this.readAny();
            first = false;
          }
        }
      };
      exports.JsonDecoder = JsonDecoder;
    }
  });

  // node_modules/@jsonjoy.com/fs-snapshot/lib/json.js
  var require_json2 = __commonJS({
    "node_modules/@jsonjoy.com/fs-snapshot/lib/json.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.fromJsonSnapshot = exports.toJsonSnapshot = exports.fromJsonSnapshotSync = exports.toJsonSnapshotSync = void 0;
      var JsonEncoder_1 = require_JsonEncoder();
      var JsonDecoder_1 = require_JsonDecoder();
      var sync_1 = require_sync();
      var async_1 = require_async();
      var shared_1 = require_shared();
      var encoder = new JsonEncoder_1.JsonEncoder(shared_1.writer);
      var decoder = new JsonDecoder_1.JsonDecoder();
      var toJsonSnapshotSync = (options) => {
        const snapshot = (0, sync_1.toSnapshotSync)(options);
        return encoder.encode(snapshot);
      };
      exports.toJsonSnapshotSync = toJsonSnapshotSync;
      var fromJsonSnapshotSync = (uint8, options) => {
        const snapshot = decoder.read(uint8);
        (0, sync_1.fromSnapshotSync)(snapshot, options);
      };
      exports.fromJsonSnapshotSync = fromJsonSnapshotSync;
      var toJsonSnapshot = async (options) => {
        const snapshot = await (0, async_1.toSnapshot)(options);
        return encoder.encode(snapshot);
      };
      exports.toJsonSnapshot = toJsonSnapshot;
      var fromJsonSnapshot = async (uint8, options) => {
        const snapshot = decoder.read(uint8);
        await (0, async_1.fromSnapshot)(snapshot, options);
      };
      exports.fromJsonSnapshot = fromJsonSnapshot;
    }
  });

  // node_modules/@jsonjoy.com/fs-snapshot/lib/index.js
  var require_lib5 = __commonJS({
    "node_modules/@jsonjoy.com/fs-snapshot/lib/index.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
      tslib_1.__exportStar(require_constants3(), exports);
      tslib_1.__exportStar(require_sync(), exports);
      tslib_1.__exportStar(require_binary(), exports);
      tslib_1.__exportStar(require_json2(), exports);
    }
  });

  // node_modules/@jsonjoy.com/fs-node/lib/options.js
  var require_options = __commonJS({
    "node_modules/@jsonjoy.com/fs-node/lib/options.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getWriteFileOptions = exports.writeFileDefaults = exports.getRealpathOptsAndCb = exports.getRealpathOptions = exports.getStatfsOptsAndCb = exports.getStatfsOptions = exports.getStatOptsAndCb = exports.getStatOptions = exports.getAppendFileOptsAndCb = exports.getAppendFileOpts = exports.getOpendirOptsAndCb = exports.getOpendirOptions = exports.getReaddirOptsAndCb = exports.getReaddirOptions = exports.getReadFileOptions = exports.getRmOptsAndCb = exports.getRmdirOptions = exports.getDefaultOptsAndCb = exports.getDefaultOpts = exports.optsDefaults = exports.getMkdirOptions = void 0;
      exports.getOptions = getOptions;
      exports.optsGenerator = optsGenerator;
      exports.optsAndCbGenerator = optsAndCbGenerator;
      var fs_node_utils_1 = require_lib();
      var util_1 = require_util3();
      var mkdirDefaults = {
        mode: 511,
        recursive: false
      };
      var getMkdirOptions = (options) => {
        if (typeof options === "number")
          return Object.assign({}, mkdirDefaults, { mode: options });
        return Object.assign({}, mkdirDefaults, options);
      };
      exports.getMkdirOptions = getMkdirOptions;
      var ERRSTR_OPTS = (tipeof) => `Expected options to be either an object or a string, but got ${tipeof} instead`;
      function getOptions(defaults, options) {
        let opts;
        if (!options)
          return defaults;
        else {
          const tipeof = typeof options;
          switch (tipeof) {
            case "string":
              opts = Object.assign({}, defaults, { encoding: options });
              break;
            case "object":
              opts = Object.assign({}, defaults, options);
              break;
            default:
              throw TypeError(ERRSTR_OPTS(tipeof));
          }
        }
        if (opts.encoding !== "buffer")
          (0, fs_node_utils_1.assertEncoding)(opts.encoding);
        return opts;
      }
      function optsGenerator(defaults) {
        return (options) => getOptions(defaults, options);
      }
      function optsAndCbGenerator(getOpts) {
        return (options, callback) => typeof options === "function" ? [getOpts(), options] : [getOpts(options), (0, util_1.validateCallback)(callback)];
      }
      exports.optsDefaults = {
        encoding: "utf8"
      };
      exports.getDefaultOpts = optsGenerator(exports.optsDefaults);
      exports.getDefaultOptsAndCb = optsAndCbGenerator(exports.getDefaultOpts);
      var rmdirDefaults = {
        recursive: false
      };
      var getRmdirOptions = (options) => {
        return Object.assign({}, rmdirDefaults, options);
      };
      exports.getRmdirOptions = getRmdirOptions;
      var getRmOpts = optsGenerator(exports.optsDefaults);
      exports.getRmOptsAndCb = optsAndCbGenerator(getRmOpts);
      var readFileOptsDefaults = {
        flag: "r"
      };
      exports.getReadFileOptions = optsGenerator(readFileOptsDefaults);
      var readdirDefaults = {
        encoding: "utf8",
        recursive: false,
        withFileTypes: false
      };
      exports.getReaddirOptions = optsGenerator(readdirDefaults);
      exports.getReaddirOptsAndCb = optsAndCbGenerator(exports.getReaddirOptions);
      var opendirDefaults = {
        encoding: "utf8",
        bufferSize: 32,
        recursive: false
      };
      exports.getOpendirOptions = optsGenerator(opendirDefaults);
      exports.getOpendirOptsAndCb = optsAndCbGenerator(exports.getOpendirOptions);
      var appendFileDefaults = {
        encoding: "utf8",
        mode: 438,
        flag: fs_node_utils_1.FLAGS[fs_node_utils_1.FLAGS.a]
      };
      exports.getAppendFileOpts = optsGenerator(appendFileDefaults);
      exports.getAppendFileOptsAndCb = optsAndCbGenerator(exports.getAppendFileOpts);
      var statDefaults = {
        bigint: false
      };
      var getStatOptions = (options = {}) => Object.assign({}, statDefaults, options);
      exports.getStatOptions = getStatOptions;
      var getStatOptsAndCb = (options, callback) => typeof options === "function" ? [(0, exports.getStatOptions)(), options] : [(0, exports.getStatOptions)(options), (0, util_1.validateCallback)(callback)];
      exports.getStatOptsAndCb = getStatOptsAndCb;
      var statfsDefaults = {
        bigint: false
      };
      var getStatfsOptions = (options = {}) => Object.assign({}, statfsDefaults, options);
      exports.getStatfsOptions = getStatfsOptions;
      var getStatfsOptsAndCb = (options, callback) => typeof options === "function" ? [(0, exports.getStatfsOptions)(), options] : [(0, exports.getStatfsOptions)(options), (0, util_1.validateCallback)(callback)];
      exports.getStatfsOptsAndCb = getStatfsOptsAndCb;
      var realpathDefaults = exports.optsDefaults;
      exports.getRealpathOptions = optsGenerator(realpathDefaults);
      exports.getRealpathOptsAndCb = optsAndCbGenerator(exports.getRealpathOptions);
      exports.writeFileDefaults = {
        encoding: "utf8",
        mode: 438,
        flag: fs_node_utils_1.FLAGS[fs_node_utils_1.FLAGS.w]
      };
      exports.getWriteFileOptions = optsGenerator(exports.writeFileDefaults);
    }
  });

  // node_modules/@jsonjoy.com/fs-node/lib/Dir.js
  var require_Dir = __commonJS({
    "node_modules/@jsonjoy.com/fs-node/lib/Dir.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Dir = void 0;
      var util_1 = require_util3();
      var Dirent_1 = require_Dirent();
      var errors = require_errors();
      var Dir = class {
        constructor(link, options) {
          this.link = link;
          this.options = options;
          this.iteratorInfo = [];
          this.closed = false;
          this.operationQueue = null;
          this.path = link.getPath();
          this.iteratorInfo.push(link.children[Symbol.iterator]());
        }
        closeBase() {
        }
        readBase(iteratorInfo) {
          let done;
          let value;
          let name;
          let link;
          do {
            do {
              ({ done, value } = iteratorInfo[iteratorInfo.length - 1].next());
              if (!done) {
                [name, link] = value;
              } else {
                break;
              }
            } while (name === "." || name === "..");
            if (done) {
              iteratorInfo.pop();
              if (iteratorInfo.length === 0) {
                break;
              } else {
                done = false;
              }
            } else {
              if (this.options.recursive && link.children.size) {
                iteratorInfo.push(link.children[Symbol.iterator]());
              }
              return Dirent_1.default.build(link, this.options.encoding);
            }
          } while (!done);
          return null;
        }
        close(callback) {
          if (callback === void 0) {
            if (this.closed) {
              return Promise.reject(new errors.Error("ERR_DIR_CLOSED"));
            }
            return new Promise((resolve, reject) => {
              this.close((err) => {
                if (err)
                  reject(err);
                else
                  resolve();
              });
            });
          }
          (0, util_1.validateCallback)(callback);
          if (this.closed) {
            import_process.default.nextTick(callback, new errors.Error("ERR_DIR_CLOSED"));
            return;
          }
          if (this.operationQueue !== null) {
            this.operationQueue.push(() => {
              this.close(callback);
            });
            return;
          }
          this.closed = true;
          try {
            this.closeBase();
            import_process.default.nextTick(callback);
          } catch (err) {
            import_process.default.nextTick(callback, err);
          }
        }
        closeSync() {
          if (this.closed) {
            throw new errors.Error("ERR_DIR_CLOSED");
          }
          if (this.operationQueue !== null) {
            throw new errors.Error("ERR_DIR_CONCURRENT_OPERATION");
          }
          this.closed = true;
          this.closeBase();
        }
        read(callback) {
          if (callback === void 0) {
            return new Promise((resolve, reject) => {
              this.read((err, result) => {
                if (err)
                  reject(err);
                else
                  resolve(result ?? null);
              });
            });
          }
          (0, util_1.validateCallback)(callback);
          if (this.closed) {
            import_process.default.nextTick(callback, new errors.Error("ERR_DIR_CLOSED"));
            return;
          }
          if (this.operationQueue !== null) {
            this.operationQueue.push(() => {
              this.read(callback);
            });
            return;
          }
          this.operationQueue = [];
          try {
            const result = this.readBase(this.iteratorInfo);
            import_process.default.nextTick(() => {
              const queue = this.operationQueue;
              this.operationQueue = null;
              for (const op of queue)
                op();
              callback(null, result);
            });
          } catch (err) {
            import_process.default.nextTick(() => {
              const queue = this.operationQueue;
              this.operationQueue = null;
              for (const op of queue)
                op();
              callback(err);
            });
          }
        }
        readSync() {
          if (this.closed) {
            throw new errors.Error("ERR_DIR_CLOSED");
          }
          if (this.operationQueue !== null) {
            throw new errors.Error("ERR_DIR_CONCURRENT_OPERATION");
          }
          return this.readBase(this.iteratorInfo);
        }
        [Symbol.asyncIterator]() {
          return {
            next: async () => {
              try {
                const dirEnt = await this.read();
                if (dirEnt !== null) {
                  return { done: false, value: dirEnt };
                } else {
                  return { done: true, value: void 0 };
                }
              } catch (err) {
                throw err;
              }
            },
            [Symbol.asyncIterator]() {
              return this;
            }
          };
        }
        [Symbol.asyncDispose]() {
          return this.close();
        }
        [Symbol.dispose]() {
          this.closeSync();
        }
      };
      exports.Dir = Dir;
    }
  });

  // node_modules/glob-to-regex.js/lib/index.js
  var require_lib6 = __commonJS({
    "node_modules/glob-to-regex.js/lib/index.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.toMatcher = exports.toRegex = void 0;
      var escapeRe = (ch) => /[.^$+{}()|\\]/.test(ch) ? `\\${ch}` : ch;
      var parseExtGlob = (pattern, startIdx, prefix, options) => {
        let i = startIdx;
        const parts = [];
        let cur = "";
        let depth = 1;
        while (i < pattern.length && depth > 0) {
          const ch = pattern[i];
          if (ch === "(") {
            depth++;
            cur += ch;
            i++;
          } else if (ch === ")") {
            depth--;
            if (depth === 0) {
              parts.push(cur);
              i++;
              break;
            } else {
              cur += ch;
              i++;
            }
          } else if (ch === "|" && depth === 1) {
            parts.push(cur);
            cur = "";
            i++;
          } else {
            cur += ch;
            i++;
          }
        }
        if (depth !== 0)
          return;
        let alternatives = "";
        const length = parts.length;
        for (let j = 0; j < length; j++)
          alternatives += (alternatives ? "|" : "") + (0, exports.toRegex)(parts[j], options).source.replace(/^\^/, "").replace(/\$$/, "");
        switch (prefix) {
          case "?":
            return [`(?:${alternatives})?`, i];
          case "*":
            return [`(?:${alternatives})*`, i];
          case "+":
            return [`(?:${alternatives})+`, i];
          case "@":
            return [`(?:${alternatives})`, i];
          case "!":
            return [`(?!${alternatives})[^/]*`, i];
        }
        return;
      };
      var toRegex = (pattern, options) => {
        let regexStr = "";
        let i = 0;
        const parseBraceGroup = () => {
          i++;
          const parts = [];
          let cur = "";
          let closed = false;
          while (i < pattern.length) {
            const ch = pattern[i];
            if (ch === "}") {
              parts.push(cur);
              i++;
              closed = true;
              break;
            }
            if (ch === ",") {
              parts.push(cur);
              cur = "";
              i++;
              continue;
            }
            cur += ch;
            i++;
          }
          if (!closed) {
            return "\\{" + escapeRe(cur);
          }
          const alt = parts.map((p) => (0, exports.toRegex)(p, options).source.replace(/^\^/, "").replace(/\$$/, "")).join("|");
          return `(?:${alt})`;
        };
        const extglob = !!options?.extglob;
        while (i < pattern.length) {
          const char = pattern[i];
          if (extglob && pattern[i + 1] === "(") {
            if (char === "?" || char === "*" || char === "+" || char === "@" || char === "!") {
              const result = parseExtGlob(pattern, i + 2, char, options);
              if (result) {
                regexStr += result[0];
                i = result[1];
                continue;
              }
            }
          }
          switch (char) {
            case "*": {
              if (pattern[i + 1] === "*") {
                let j = i + 2;
                while (pattern[j] === "*")
                  j++;
                if (pattern[j] === "/") {
                  regexStr += "(?:.*/)?";
                  i = j + 1;
                } else {
                  regexStr += ".*";
                  i = j;
                }
              } else {
                regexStr += "[^/]*";
                i++;
              }
              break;
            }
            case "?":
              regexStr += "[^/]";
              i++;
              break;
            case "[": {
              let cls = "[";
              i++;
              if (i < pattern.length && pattern[i] === "!") {
                cls += "^";
                i++;
              }
              if (i < pattern.length && pattern[i] === "]") {
                cls += "]";
                i++;
              }
              while (i < pattern.length && pattern[i] !== "]") {
                const ch = pattern[i];
                cls += ch === "\\" ? "\\\\" : ch;
                i++;
              }
              if (i < pattern.length && pattern[i] === "]") {
                cls += "]";
                i++;
              } else {
                regexStr += "\\[";
                continue;
              }
              regexStr += cls;
              break;
            }
            case "{": {
              regexStr += parseBraceGroup();
              break;
            }
            case "/":
              regexStr += "/";
              i++;
              break;
            case ".":
            case "^":
            case "$":
            case "+":
            case "(":
            case ")":
            case "|":
            case "\\":
              regexStr += `\\${char}`;
              i++;
              break;
            default:
              regexStr += char;
              i++;
              break;
          }
        }
        const flags = options?.nocase ? "i" : "";
        return new RegExp("^" + regexStr + "$", flags);
      };
      exports.toRegex = toRegex;
      var isRegExp = /^\/(.{1,4096})\/([gimsuy]{0,6})$/;
      var toMatcher = (pattern, options) => {
        const regexes = [];
        const patterns = Array.isArray(pattern) ? pattern : [pattern];
        for (const pat of patterns) {
          if (typeof pat === "string") {
            const match = isRegExp.exec(pat);
            if (match) {
              const [, expr, flags] = match;
              regexes.push(new RegExp(expr, flags));
            } else {
              regexes.push((0, exports.toRegex)(pat, options));
            }
          } else {
            regexes.push(pat);
          }
        }
        return regexes.length ? new Function("p", "return " + regexes.map((r) => r + ".test(p)").join("||")) : () => false;
      };
      exports.toMatcher = toMatcher;
    }
  });

  // node_modules/@jsonjoy.com/fs-node/lib/glob.js
  var require_glob = __commonJS({
    "node_modules/@jsonjoy.com/fs-node/lib/glob.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.globSync = globSync;
      var path_1 = require_path();
      var glob_to_regex_js_1 = require_lib6();
      var util_1 = require_util3();
      var pathJoin = path_1.posix.join;
      var pathRelative = path_1.posix.relative;
      var pathResolve = path_1.posix.resolve;
      function matchesPattern(path, pattern) {
        const regex = (0, glob_to_regex_js_1.toRegex)(pattern);
        return regex.test(path);
      }
      function isExcluded(path, exclude) {
        if (!exclude)
          return false;
        if (typeof exclude === "function") {
          return exclude(path);
        }
        const patterns = Array.isArray(exclude) ? exclude : [exclude];
        return patterns.some((pattern) => matchesPattern(path, pattern));
      }
      function walkDirectory(fs, dir, patterns, options, currentDepth = 0) {
        const results = [];
        const maxDepth = options.maxdepth ?? Infinity;
        const baseCwd = options.cwd ? (0, util_1.pathToFilename)(options.cwd) : import_process.default.cwd();
        if (currentDepth > maxDepth) {
          return results;
        }
        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = pathJoin(dir, entry.name.toString());
            const relativePath = pathRelative(baseCwd, fullPath);
            if (isExcluded(relativePath, options.exclude)) {
              continue;
            }
            const matches = patterns.some((pattern) => matchesPattern(relativePath, pattern));
            if (matches) {
              results.push(relativePath);
            }
            if (entry.isDirectory() && currentDepth < maxDepth) {
              const subResults = walkDirectory(fs, fullPath, patterns, options, currentDepth + 1);
              results.push(...subResults);
            }
          }
        } catch (err) {
        }
        return results;
      }
      function globSync(fs, pattern, options = {}) {
        const cwd = options.cwd ? (0, util_1.pathToFilename)(options.cwd) : import_process.default.cwd();
        const resolvedCwd = pathResolve(cwd);
        const globOptions = {
          cwd: resolvedCwd,
          exclude: options.exclude,
          maxdepth: options.maxdepth,
          withFileTypes: options.withFileTypes || false
        };
        let results = [];
        if (path_1.posix.isAbsolute(pattern)) {
          const dir = path_1.posix.dirname(pattern);
          const patternBasename = path_1.posix.basename(pattern);
          const dirResults = walkDirectory(fs, dir, [patternBasename], { ...globOptions, cwd: dir });
          results.push(...dirResults.map((r) => path_1.posix.resolve(dir, r)));
        } else {
          const normalizedPattern = pattern.replace(/^\.\//, "");
          const dirResults = walkDirectory(fs, resolvedCwd, [normalizedPattern], globOptions);
          results.push(...dirResults);
        }
        results = [...new Set(results)].sort();
        return results;
      }
    }
  });

  // node_modules/@jsonjoy.com/fs-node/lib/volume.js
  var require_volume = __commonJS({
    "node_modules/@jsonjoy.com/fs-node/lib/volume.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.FSWatcher = exports.StatWatcher = exports.Volume = void 0;
      exports.pathToSteps = pathToSteps;
      exports.dataToStr = dataToStr;
      exports.toUnixTimestamp = toUnixTimestamp;
      var path_1 = require_path();
      var fs_core_1 = require_lib2();
      var util_1 = require_util2();
      var Stats_1 = require_Stats();
      var Dirent_1 = require_Dirent();
      var StatFs_1 = require_StatFs();
      var buffer_1 = require_buffer3();
      var setTimeoutUnref_1 = require_setTimeoutUnref();
      var stream_1 = require_stream();
      var fs_node_utils_1 = require_lib();
      var events_1 = require_events2();
      var FileHandle_1 = require_FileHandle();
      var util_2 = require_util();
      var FsPromises_1 = require_FsPromises();
      var fs_print_1 = require_lib4();
      var fsSnapshot = require_lib5();
      var fs_node_utils_2 = require_lib();
      var errors = require_errors();
      var options_1 = require_options();
      var util_3 = require_util3();
      var Dir_1 = require_Dir();
      var resolveCrossPlatform = path_1.resolve;
      var { O_SYMLINK, F_OK, R_OK, W_OK, X_OK, COPYFILE_EXCL, COPYFILE_FICLONE_FORCE } = fs_node_utils_1.constants;
      var pathSep = path_1.posix ? path_1.posix.sep : path_1.sep;
      var pathRelative = path_1.posix ? path_1.posix.relative : path_1.relative;
      var pathJoin = path_1.posix ? path_1.posix.join : path_1.join;
      var pathDirname = path_1.posix ? path_1.posix.dirname : path_1.dirname;
      var pathNormalize = path_1.posix ? path_1.posix.normalize : path_1.normalize;
      var kMinPoolSpace = 128;
      function pathToSteps(path) {
        return (0, fs_core_1.filenameToSteps)((0, util_3.pathToFilename)(path));
      }
      function dataToStr(data, encoding = fs_node_utils_1.ENCODING_UTF8) {
        if (buffer_1.Buffer.isBuffer(data))
          return data.toString(encoding);
        else if (data instanceof Uint8Array)
          return (0, buffer_1.bufferFrom)(data).toString(encoding);
        else
          return String(data);
      }
      function toUnixTimestamp(time) {
        if (typeof time === "string" && +time == time) {
          return +time;
        }
        if (time instanceof Date) {
          return time.getTime() / 1e3;
        }
        if (isFinite(time)) {
          if (time < 0) {
            return Date.now() / 1e3;
          }
          return time;
        }
        throw new Error("Cannot parse time: " + time);
      }
      function validateUid(uid) {
        if (typeof uid !== "number")
          throw TypeError(fs_node_utils_2.ERRSTR.UID);
      }
      function validateGid(gid) {
        if (typeof gid !== "number")
          throw TypeError(fs_node_utils_2.ERRSTR.GID);
      }
      var Volume = class {
        get promises() {
          if (this.promisesApi === null)
            throw new Error("Promise is not supported in this environment.");
          return this.promisesApi;
        }
        constructor(_core = new fs_core_1.Superblock()) {
          this._core = _core;
          this.promisesApi = new FsPromises_1.FsPromises(this, FileHandle_1.FileHandle);
          this.openSync = (path, flags, mode = 438) => {
            const modeNum = (0, util_3.modeToNumber)(mode);
            const fileName = (0, util_3.pathToFilename)(path);
            const flagsNum = (0, util_3.flagsToNumber)(flags);
            return this._core.open(fileName, flagsNum, modeNum, !(flagsNum & O_SYMLINK));
          };
          this.open = (path, flags, a, b) => {
            let mode = a;
            let callback = b;
            if (typeof a === "function") {
              mode = 438;
              callback = a;
            }
            mode = mode || 438;
            const modeNum = (0, util_3.modeToNumber)(mode);
            const fileName = (0, util_3.pathToFilename)(path);
            const flagsNum = (0, util_3.flagsToNumber)(flags);
            this.wrapAsync(this._core.open, [fileName, flagsNum, modeNum, !(flagsNum & O_SYMLINK)], callback);
          };
          this.closeSync = (fd) => {
            this._core.close(fd);
          };
          this.close = (fd, callback) => {
            (0, fs_core_1.validateFd)(fd);
            const file = this._core.getFileByFdOrThrow(fd, "close");
            this.wrapAsync(this._core.close, [file.fd], callback);
          };
          this.readSync = (fd, buffer, offset, length, position) => {
            (0, fs_core_1.validateFd)(fd);
            return this._core.read(fd, buffer, offset, length, position);
          };
          this.read = (fd, buffer, offset, length, position, callback) => {
            (0, util_3.validateCallback)(callback);
            if (length === 0) {
              return queueMicrotask(() => {
                if (callback)
                  callback(null, 0, buffer);
              });
            }
            Promise.resolve().then(() => {
              try {
                const bytes = this._core.read(fd, buffer, offset, length, position);
                callback(null, bytes, buffer);
              } catch (err) {
                callback(err);
              }
            });
          };
          this.readv = (fd, buffers, a, b) => {
            let position = a;
            let callback = b;
            if (typeof a === "function")
              [position, callback] = [null, a];
            (0, util_3.validateCallback)(callback);
            Promise.resolve().then(() => {
              try {
                const bytes = this._core.readv(fd, buffers, position);
                callback(null, bytes, buffers);
              } catch (err) {
                callback(err);
              }
            });
          };
          this.readvSync = (fd, buffers, position) => {
            (0, fs_core_1.validateFd)(fd);
            return this._core.readv(fd, buffers, position ?? null);
          };
          this._readfile = (id, flagsNum, encoding) => {
            let result;
            const isUserFd = typeof id === "number";
            const userOwnsFd = isUserFd && (0, fs_core_1.isFd)(id);
            let fd;
            if (userOwnsFd)
              fd = id;
            else {
              const filename = (0, util_3.pathToFilename)(id);
              const originalPath = String(id);
              const hasTrailingSlash = originalPath.length > 1 && originalPath.endsWith("/");
              const link = this._core.getResolvedLinkOrThrow(filename, "open");
              const node = link.getNode();
              if (node.isDirectory())
                throw (0, util_3.createError)("EISDIR", "open", link.getPath());
              if (hasTrailingSlash && node.isFile()) {
                throw (0, util_3.createError)("ENOTDIR", "open", originalPath);
              }
              fd = this.openSync(id, flagsNum);
            }
            try {
              result = (0, util_3.bufferToEncoding)(this._core.getFileByFdOrThrow(fd).getBuffer(), encoding);
            } finally {
              if (!userOwnsFd) {
                this.closeSync(fd);
              }
            }
            return result;
          };
          this.readFileSync = (file, options) => {
            const opts = (0, options_1.getReadFileOptions)(options);
            const flagsNum = (0, util_3.flagsToNumber)(opts.flag);
            return this._readfile(file, flagsNum, opts.encoding);
          };
          this.readFile = (id, a, b) => {
            const [opts, callback] = (0, options_1.optsAndCbGenerator)(options_1.getReadFileOptions)(a, b);
            const flagsNum = (0, util_3.flagsToNumber)(opts.flag);
            this.wrapAsync(this._readfile, [id, flagsNum, opts.encoding], callback);
          };
          this.writeSync = (fd, a, b, c, d) => {
            const [, buf, offset, length, position] = (0, util_3.getWriteSyncArgs)(fd, a, b, c, d);
            return this._write(fd, buf, offset, length, position);
          };
          this.write = (fd, a, b, c, d, e) => {
            const [, asStr, buf, offset, length, position, cb] = (0, util_3.getWriteArgs)(fd, a, b, c, d, e);
            Promise.resolve().then(() => {
              try {
                const bytes = this._write(fd, buf, offset, length, position);
                if (!asStr) {
                  cb(null, bytes, buf);
                } else {
                  cb(null, bytes, a);
                }
              } catch (err) {
                cb(err);
              }
            });
          };
          this.writev = (fd, buffers, a, b) => {
            let position = a;
            let callback = b;
            if (typeof a === "function")
              [position, callback] = [null, a];
            (0, util_3.validateCallback)(callback);
            Promise.resolve().then(() => {
              try {
                const bytes = this.writevBase(fd, buffers, position);
                callback(null, bytes, buffers);
              } catch (err) {
                callback(err);
              }
            });
          };
          this.writevSync = (fd, buffers, position) => {
            (0, fs_core_1.validateFd)(fd);
            return this.writevBase(fd, buffers, position ?? null);
          };
          this.writeFileSync = (id, data, options) => {
            const opts = (0, options_1.getWriteFileOptions)(options);
            const flagsNum = (0, util_3.flagsToNumber)(opts.flag);
            const modeNum = (0, util_3.modeToNumber)(opts.mode);
            const buf = (0, fs_core_1.dataToBuffer)(data, opts.encoding);
            this._core.writeFile(id, buf, flagsNum, modeNum);
          };
          this.writeFile = (id, data, a, b) => {
            let options = a;
            let callback = b;
            if (typeof a === "function")
              [options, callback] = [options_1.writeFileDefaults, a];
            const cb = (0, util_3.validateCallback)(callback);
            const opts = (0, options_1.getWriteFileOptions)(options);
            const flagsNum = (0, util_3.flagsToNumber)(opts.flag);
            const modeNum = (0, util_3.modeToNumber)(opts.mode);
            const buf = (0, fs_core_1.dataToBuffer)(data, opts.encoding);
            this.wrapAsync(this._core.writeFile, [id, buf, flagsNum, modeNum], cb);
          };
          this.copyFileSync = (src, dest, flags) => {
            const srcFilename = (0, util_3.pathToFilename)(src);
            const destFilename = (0, util_3.pathToFilename)(dest);
            return this._copyFile(srcFilename, destFilename, (flags || 0) | 0);
          };
          this.copyFile = (src, dest, a, b) => {
            const srcFilename = (0, util_3.pathToFilename)(src);
            const destFilename = (0, util_3.pathToFilename)(dest);
            let flags;
            let callback;
            if (typeof a === "function")
              [flags, callback] = [0, a];
            else
              [flags, callback] = [a, b];
            (0, util_3.validateCallback)(callback);
            this.wrapAsync(this._copyFile, [srcFilename, destFilename, flags], callback);
          };
          this._cp = (src, dest, options) => {
            if (options.filter && !options.filter(src, dest))
              return;
            const srcStat = options.dereference ? this.statSync(src) : this.lstatSync(src);
            let destStat = null;
            try {
              destStat = this.lstatSync(dest);
            } catch (err) {
              if (err.code !== "ENOENT") {
                throw err;
              }
            }
            if (destStat && srcStat.ino === destStat.ino && srcStat.dev === destStat.dev)
              throw (0, util_3.createError)("EINVAL", "cp", src, dest);
            if (destStat) {
              if (srcStat.isDirectory() && !destStat.isDirectory())
                throw (0, util_3.createError)("EISDIR", "cp", src, dest);
              if (!srcStat.isDirectory() && destStat.isDirectory())
                throw (0, util_3.createError)("ENOTDIR", "cp", src, dest);
            }
            if (srcStat.isDirectory() && this.isSrcSubdir(src, dest))
              throw (0, util_3.createError)("EINVAL", "cp", src, dest);
            ENDURE_PARENT_DIR_EXISTS: {
              const parent = pathDirname(dest);
              if (!this.existsSync(parent))
                this.mkdirSync(parent, { recursive: true });
            }
            if (srcStat.isDirectory()) {
              if (!options.recursive)
                throw (0, util_3.createError)("EISDIR", "cp", src);
              this.cpDirSync(srcStat, destStat, src, dest, options);
            } else if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) {
              this.cpFileSync(srcStat, destStat, src, dest, options);
            } else if (srcStat.isSymbolicLink() && !options.dereference) {
              this.cpSymlinkSync(destStat, src, dest, options);
            } else {
              throw (0, util_3.createError)("EINVAL", "cp", src);
            }
          };
          this.linkSync = (existingPath, newPath) => {
            const existingPathFilename = (0, util_3.pathToFilename)(existingPath);
            const newPathFilename = (0, util_3.pathToFilename)(newPath);
            this._core.link(existingPathFilename, newPathFilename);
          };
          this.link = (existingPath, newPath, callback) => {
            const existingPathFilename = (0, util_3.pathToFilename)(existingPath);
            const newPathFilename = (0, util_3.pathToFilename)(newPath);
            this.wrapAsync(this._core.link, [existingPathFilename, newPathFilename], callback);
          };
          this.unlinkSync = (path) => {
            const filename = (0, util_3.pathToFilename)(path);
            this._core.unlink(filename);
          };
          this.unlink = (path, callback) => {
            const filename = (0, util_3.pathToFilename)(path);
            this.wrapAsync(this._core.unlink, [filename], callback);
          };
          this.symlinkSync = (target, path, type) => {
            const targetFilename = (0, util_3.pathToFilename)(target);
            const pathFilename = (0, util_3.pathToFilename)(path);
            this._core.symlink(targetFilename, pathFilename);
          };
          this.symlink = (target, path, a, b) => {
            const callback = (0, util_3.validateCallback)(typeof a === "function" ? a : b);
            const targetFilename = (0, util_3.pathToFilename)(target);
            const pathFilename = (0, util_3.pathToFilename)(path);
            this.wrapAsync(this._core.symlink, [targetFilename, pathFilename], callback);
          };
          this._lstat = (filename, bigint = false, throwIfNoEntry = false) => {
            let link;
            try {
              link = this._core.getLinkOrThrow(filename, "lstat");
            } catch (err) {
              if (err.code === "ENOENT" && !throwIfNoEntry)
                return void 0;
              else
                throw err;
            }
            return Stats_1.default.build(link.getNode(), bigint);
          };
          this.lstatSync = (path, options) => {
            const { throwIfNoEntry = true, bigint = false } = (0, options_1.getStatOptions)(options);
            return this._lstat((0, util_3.pathToFilename)(path), bigint, throwIfNoEntry);
          };
          this.renameSync = (oldPath, newPath) => {
            const oldPathFilename = (0, util_3.pathToFilename)(oldPath);
            const newPathFilename = (0, util_3.pathToFilename)(newPath);
            this._core.rename(oldPathFilename, newPathFilename);
          };
          this.rename = (oldPath, newPath, callback) => {
            const oldPathFilename = (0, util_3.pathToFilename)(oldPath);
            const newPathFilename = (0, util_3.pathToFilename)(newPath);
            this.wrapAsync(this._core.rename, [oldPathFilename, newPathFilename], callback);
          };
          this.existsSync = (path) => {
            try {
              return this._exists((0, util_3.pathToFilename)(path)).ok;
            } catch (err) {
              return false;
            }
          };
          this.exists = (path, callback) => {
            const filename = (0, util_3.pathToFilename)(path);
            if (typeof callback !== "function")
              throw Error(fs_node_utils_2.ERRSTR.CB);
            Promise.resolve().then(() => {
              try {
                callback(this._exists(filename).ok);
              } catch (err) {
                callback(false);
              }
            });
          };
          this.accessSync = (path, mode = F_OK) => {
            const filename = (0, util_3.pathToFilename)(path);
            mode = mode | 0;
            this._access(filename, mode);
          };
          this.access = (path, a, b) => {
            let mode = F_OK;
            let callback;
            if (typeof a !== "function")
              [mode, callback] = [a | 0, (0, util_3.validateCallback)(b)];
            else
              callback = a;
            const filename = (0, util_3.pathToFilename)(path);
            this.wrapAsync(this._access, [filename, mode], callback);
          };
          this.appendFileSync = (id, data, options) => {
            const opts = (0, options_1.getAppendFileOpts)(options);
            if (!opts.flag || (0, fs_core_1.isFd)(id))
              opts.flag = "a";
            this.writeFileSync(id, data, opts);
          };
          this.appendFile = (id, data, a, b) => {
            const [opts, callback] = (0, options_1.getAppendFileOptsAndCb)(a, b);
            if (!opts.flag || (0, fs_core_1.isFd)(id))
              opts.flag = "a";
            this.writeFile(id, data, opts, callback);
          };
          this._readdir = (filename, options) => {
            const steps = (0, fs_core_1.filenameToSteps)(filename);
            const link = this._core.getResolvedLinkOrThrow(filename, "scandir");
            const node = link.getNode();
            if (!node.isDirectory())
              throw (0, util_3.createError)("ENOTDIR", "scandir", filename);
            if (!node.canRead())
              throw (0, util_3.createError)("EACCES", "scandir", filename);
            const list = [];
            for (const name of link.children.keys()) {
              const child = link.getChild(name);
              if (!child || name === "." || name === "..")
                continue;
              list.push(Dirent_1.default.build(child, options.encoding));
              if (options.recursive && child.children.size) {
                const recurseOptions = { ...options, recursive: true, withFileTypes: true };
                const childList = this._readdir(child.getPath(), recurseOptions);
                list.push(...childList);
              }
            }
            if (!util_1.isWin && options.encoding !== "buffer")
              list.sort((a, b) => {
                if (a.name < b.name)
                  return -1;
                if (a.name > b.name)
                  return 1;
                return 0;
              });
            if (options.withFileTypes)
              return list;
            let filename2 = filename;
            if (util_1.isWin)
              filename2 = filename2.replace(/\\/g, "/");
            return list.map((dirent) => {
              if (options.recursive) {
                let fullPath = pathJoin(dirent.parentPath, dirent.name.toString());
                if (util_1.isWin) {
                  fullPath = fullPath.replace(/\\/g, "/");
                }
                return fullPath.replace(filename2 + path_1.posix.sep, "");
              }
              return dirent.name;
            });
          };
          this.readdirSync = (path, options) => {
            const opts = (0, options_1.getReaddirOptions)(options);
            const filename = (0, util_3.pathToFilename)(path);
            return this._readdir(filename, opts);
          };
          this.readdir = (path, a, b) => {
            const [options, callback] = (0, options_1.getReaddirOptsAndCb)(a, b);
            const filename = (0, util_3.pathToFilename)(path);
            this.wrapAsync(this._readdir, [filename, options], callback);
          };
          this._readlink = (filename, encoding) => {
            const link = this._core.getLinkOrThrow(filename, "readlink");
            const node = link.getNode();
            if (!node.isSymlink())
              throw (0, util_3.createError)("EINVAL", "readlink", filename);
            return (0, fs_node_utils_1.strToEncoding)(node.symlink, encoding);
          };
          this.readlinkSync = (path, options) => {
            const opts = (0, options_1.getDefaultOpts)(options);
            const filename = (0, util_3.pathToFilename)(path);
            return this._readlink(filename, opts.encoding);
          };
          this.readlink = (path, a, b) => {
            const [opts, callback] = (0, options_1.getDefaultOptsAndCb)(a, b);
            const filename = (0, util_3.pathToFilename)(path);
            this.wrapAsync(this._readlink, [filename, opts.encoding], callback);
          };
          this._fsync = (fd) => {
            this._core.getFileByFdOrThrow(fd, "fsync");
          };
          this.fsyncSync = (fd) => {
            this._fsync(fd);
          };
          this.fsync = (fd, callback) => {
            this.wrapAsync(this._fsync, [fd], callback);
          };
          this._fdatasync = (fd) => {
            this._core.getFileByFdOrThrow(fd, "fdatasync");
          };
          this.fdatasyncSync = (fd) => {
            this._fdatasync(fd);
          };
          this.fdatasync = (fd, callback) => {
            this.wrapAsync(this._fdatasync, [fd], callback);
          };
          this._ftruncate = (fd, len) => {
            const file = this._core.getFileByFdOrThrow(fd, "ftruncate");
            file.truncate(len);
          };
          this.ftruncateSync = (fd, len) => {
            this._ftruncate(fd, len);
          };
          this.ftruncate = (fd, a, b) => {
            const len = typeof a === "number" ? a : 0;
            const callback = (0, util_3.validateCallback)(typeof a === "number" ? b : a);
            this.wrapAsync(this._ftruncate, [fd, len], callback);
          };
          this._truncate = (path, len) => {
            const fd = this.openSync(path, "r+");
            try {
              this.ftruncateSync(fd, len);
            } finally {
              this.closeSync(fd);
            }
          };
          this.truncateSync = (id, len) => {
            if ((0, fs_core_1.isFd)(id))
              return this.ftruncateSync(id, len);
            this._truncate(id, len);
          };
          this.truncate = (id, a, b) => {
            const len = typeof a === "number" ? a : 0;
            const callback = (0, util_3.validateCallback)(typeof a === "number" ? b : a);
            if ((0, fs_core_1.isFd)(id))
              return this.ftruncate(id, len, callback);
            this.wrapAsync(this._truncate, [id, len], callback);
          };
          this._futimes = (fd, atime, mtime) => {
            const file = this._core.getFileByFdOrThrow(fd, "futimes");
            const node = file.node;
            node.atime = new Date(atime * 1e3);
            node.mtime = new Date(mtime * 1e3);
          };
          this.futimesSync = (fd, atime, mtime) => {
            this._futimes(fd, toUnixTimestamp(atime), toUnixTimestamp(mtime));
          };
          this.futimes = (fd, atime, mtime, callback) => {
            this.wrapAsync(this._futimes, [fd, toUnixTimestamp(atime), toUnixTimestamp(mtime)], callback);
          };
          this._utimes = (filename, atime, mtime, followSymlinks = true) => {
            const core = this._core;
            const link = followSymlinks ? core.getResolvedLinkOrThrow(filename, "utimes") : core.getLinkOrThrow(filename, "lutimes");
            const node = link.getNode();
            node.atime = new Date(atime * 1e3);
            node.mtime = new Date(mtime * 1e3);
          };
          this.utimesSync = (path, atime, mtime) => {
            this._utimes((0, util_3.pathToFilename)(path), toUnixTimestamp(atime), toUnixTimestamp(mtime), true);
          };
          this.utimes = (path, atime, mtime, callback) => {
            this.wrapAsync(this._utimes, [(0, util_3.pathToFilename)(path), toUnixTimestamp(atime), toUnixTimestamp(mtime), true], callback);
          };
          this.lutimesSync = (path, atime, mtime) => {
            this._utimes((0, util_3.pathToFilename)(path), toUnixTimestamp(atime), toUnixTimestamp(mtime), false);
          };
          this.lutimes = (path, atime, mtime, callback) => {
            this.wrapAsync(this._utimes, [(0, util_3.pathToFilename)(path), toUnixTimestamp(atime), toUnixTimestamp(mtime), false], callback);
          };
          this.mkdirSync = (path, options) => {
            const opts = (0, options_1.getMkdirOptions)(options);
            const modeNum = (0, util_3.modeToNumber)(opts.mode, 511);
            const filename = (0, util_3.pathToFilename)(path);
            if (opts.recursive)
              return this._core.mkdirp(filename, modeNum);
            this._core.mkdir(filename, modeNum);
          };
          this.mkdir = (path, a, b) => {
            const opts = (0, options_1.getMkdirOptions)(a);
            const callback = (0, util_3.validateCallback)(typeof a === "function" ? a : b);
            const modeNum = (0, util_3.modeToNumber)(opts.mode, 511);
            const filename = (0, util_3.pathToFilename)(path);
            if (opts.recursive)
              this.wrapAsync(this._core.mkdirp, [filename, modeNum], callback);
            else
              this.wrapAsync(this._core.mkdir, [filename, modeNum], callback);
          };
          this._mkdtemp = (prefix, encoding, retry = 5) => {
            const filename = prefix + (0, util_3.genRndStr6)();
            try {
              this._core.mkdir(
                filename,
                511
                /* MODE.DIR */
              );
              return (0, fs_node_utils_1.strToEncoding)(filename, encoding);
            } catch (err) {
              if (err.code === "EEXIST") {
                if (retry > 1)
                  return this._mkdtemp(prefix, encoding, retry - 1);
                else
                  throw Error("Could not create temp dir.");
              } else
                throw err;
            }
          };
          this.mkdtempSync = (prefix, options) => {
            const { encoding } = (0, options_1.getDefaultOpts)(options);
            if (!prefix || typeof prefix !== "string")
              throw new TypeError("filename prefix is required");
            (0, util_3.nullCheck)(prefix);
            return this._mkdtemp(prefix, encoding);
          };
          this.mkdtemp = (prefix, a, b) => {
            const [{ encoding }, callback] = (0, options_1.getDefaultOptsAndCb)(a, b);
            if (!prefix || typeof prefix !== "string")
              throw new TypeError("filename prefix is required");
            if (!(0, util_3.nullCheck)(prefix))
              return;
            this.wrapAsync(this._mkdtemp, [prefix, encoding], callback);
          };
          this.rmdirSync = (path, options) => {
            const opts = (0, options_1.getRmdirOptions)(options);
            this._core.rmdir((0, util_3.pathToFilename)(path), opts.recursive);
          };
          this.rmdir = (path, a, b) => {
            const opts = (0, options_1.getRmdirOptions)(a);
            const callback = (0, util_3.validateCallback)(typeof a === "function" ? a : b);
            this.wrapAsync(this._core.rmdir, [(0, util_3.pathToFilename)(path), opts.recursive], callback);
          };
          this.rmSync = (path, options) => {
            this._core.rm((0, util_3.pathToFilename)(path), options?.force, options?.recursive);
          };
          this.rm = (path, a, b) => {
            const [opts, callback] = (0, options_1.getRmOptsAndCb)(a, b);
            this.wrapAsync(this._core.rm, [(0, util_3.pathToFilename)(path), opts?.force, opts?.recursive], callback);
          };
          this._fchmod = (fd, modeNum) => {
            const file = this._core.getFileByFdOrThrow(fd, "fchmod");
            file.chmod(modeNum);
          };
          this.fchmodSync = (fd, mode) => {
            this._fchmod(fd, (0, util_3.modeToNumber)(mode));
          };
          this.fchmod = (fd, mode, callback) => {
            this.wrapAsync(this._fchmod, [fd, (0, util_3.modeToNumber)(mode)], callback);
          };
          this._chmod = (filename, modeNum, followSymlinks = true) => {
            const link = followSymlinks ? this._core.getResolvedLinkOrThrow(filename, "chmod") : this._core.getLinkOrThrow(filename, "chmod");
            const node = link.getNode();
            node.chmod(modeNum);
          };
          this.chmodSync = (path, mode) => {
            const modeNum = (0, util_3.modeToNumber)(mode);
            const filename = (0, util_3.pathToFilename)(path);
            this._chmod(filename, modeNum, true);
          };
          this.chmod = (path, mode, callback) => {
            const modeNum = (0, util_3.modeToNumber)(mode);
            const filename = (0, util_3.pathToFilename)(path);
            this.wrapAsync(this._chmod, [filename, modeNum], callback);
          };
          this._lchmod = (filename, modeNum) => {
            this._chmod(filename, modeNum, false);
          };
          this.lchmodSync = (path, mode) => {
            const modeNum = (0, util_3.modeToNumber)(mode);
            const filename = (0, util_3.pathToFilename)(path);
            this._lchmod(filename, modeNum);
          };
          this.lchmod = (path, mode, callback) => {
            const modeNum = (0, util_3.modeToNumber)(mode);
            const filename = (0, util_3.pathToFilename)(path);
            this.wrapAsync(this._lchmod, [filename, modeNum], callback);
          };
          this._fchown = (fd, uid, gid) => {
            this._core.getFileByFdOrThrow(fd, "fchown").chown(uid, gid);
          };
          this.fchownSync = (fd, uid, gid) => {
            validateUid(uid);
            validateGid(gid);
            this._fchown(fd, uid, gid);
          };
          this.fchown = (fd, uid, gid, callback) => {
            validateUid(uid);
            validateGid(gid);
            this.wrapAsync(this._fchown, [fd, uid, gid], callback);
          };
          this._chown = (filename, uid, gid) => {
            const link = this._core.getResolvedLinkOrThrow(filename, "chown");
            const node = link.getNode();
            node.chown(uid, gid);
          };
          this.chownSync = (path, uid, gid) => {
            validateUid(uid);
            validateGid(gid);
            this._chown((0, util_3.pathToFilename)(path), uid, gid);
          };
          this.chown = (path, uid, gid, callback) => {
            validateUid(uid);
            validateGid(gid);
            this.wrapAsync(this._chown, [(0, util_3.pathToFilename)(path), uid, gid], callback);
          };
          this._lchown = (filename, uid, gid) => {
            this._core.getLinkOrThrow(filename, "lchown").getNode().chown(uid, gid);
          };
          this.lchownSync = (path, uid, gid) => {
            validateUid(uid);
            validateGid(gid);
            this._lchown((0, util_3.pathToFilename)(path), uid, gid);
          };
          this.lchown = (path, uid, gid, callback) => {
            validateUid(uid);
            validateGid(gid);
            this.wrapAsync(this._lchown, [(0, util_3.pathToFilename)(path), uid, gid], callback);
          };
          this.statWatchers = {};
          this.cpSync = (src, dest, options) => {
            const srcFilename = (0, util_3.pathToFilename)(src);
            const destFilename = (0, util_3.pathToFilename)(dest);
            const opts_ = {
              dereference: options?.dereference ?? false,
              errorOnExist: options?.errorOnExist ?? false,
              filter: options?.filter,
              force: options?.force ?? true,
              mode: options?.mode ?? 0,
              preserveTimestamps: options?.preserveTimestamps ?? false,
              recursive: options?.recursive ?? false,
              verbatimSymlinks: options?.verbatimSymlinks ?? false
            };
            return this._cp(srcFilename, destFilename, opts_);
          };
          this.cp = (src, dest, a, b) => {
            const srcFilename = (0, util_3.pathToFilename)(src);
            const destFilename = (0, util_3.pathToFilename)(dest);
            let options;
            let callback;
            if (typeof a === "function")
              [options, callback] = [{}, a];
            else
              [options, callback] = [a || {}, b];
            (0, util_3.validateCallback)(callback);
            const opts_ = {
              dereference: options?.dereference ?? false,
              errorOnExist: options?.errorOnExist ?? false,
              filter: options?.filter,
              force: options?.force ?? true,
              mode: options?.mode ?? 0,
              preserveTimestamps: options?.preserveTimestamps ?? false,
              recursive: options?.recursive ?? false,
              verbatimSymlinks: options?.verbatimSymlinks ?? false
            };
            this.wrapAsync(this._cp, [srcFilename, destFilename, opts_], callback);
          };
          this.openAsBlob = async (path, options) => {
            const filename = (0, util_3.pathToFilename)(path);
            let link;
            try {
              link = this._core.getResolvedLinkOrThrow(filename, "open");
            } catch (error) {
              if (error && typeof error === "object" && error.code === "ENOENT") {
                const nodeError = new errors.TypeError("ERR_INVALID_ARG_VALUE");
                throw nodeError;
              }
              throw error;
            }
            const node = link.getNode();
            const buffer = node.getBuffer();
            const type = options?.type || "";
            return new Blob([buffer], { type });
          };
          this.glob = (pattern, ...args) => {
            const [options, callback] = args.length === 1 ? [{}, args[0]] : [args[0], args[1]];
            this.wrapAsync(this._globSync, [pattern, options || {}], callback);
          };
          this.globSync = (pattern, options = {}) => {
            return this._globSync(pattern, options);
          };
          this._globSync = (pattern, options = {}) => {
            const { globSync } = require_glob();
            return globSync(this, pattern, options);
          };
          this._opendir = (filename, options) => {
            const link = this._core.getResolvedLinkOrThrow(filename, "scandir");
            const node = link.getNode();
            if (!node.isDirectory())
              throw (0, util_3.createError)("ENOTDIR", "scandir", filename);
            return new Dir_1.Dir(link, options);
          };
          this.opendirSync = (path, options) => {
            const opts = (0, options_1.getOpendirOptions)(options);
            const filename = (0, util_3.pathToFilename)(path);
            return this._opendir(filename, opts);
          };
          this.opendir = (path, a, b) => {
            const [options, callback] = (0, options_1.getOpendirOptsAndCb)(a, b);
            const filename = (0, util_3.pathToFilename)(path);
            this.wrapAsync(this._opendir, [filename, options], callback);
          };
          const self2 = this;
          this.StatWatcher = class extends StatWatcher {
            constructor() {
              super(self2);
            }
          };
          const _ReadStream = FsReadStream;
          this.ReadStream = class extends _ReadStream {
            constructor(...args) {
              super(self2, ...args);
            }
          };
          const _WriteStream = FsWriteStream;
          this.WriteStream = class extends _WriteStream {
            constructor(...args) {
              super(self2, ...args);
            }
          };
          this.FSWatcher = class extends FSWatcher {
            constructor() {
              super(self2);
            }
          };
          const _realpath = (filename, encoding) => {
            const realLink = this._core.getResolvedLinkOrThrow(filename, "realpath");
            return (0, fs_node_utils_1.strToEncoding)(realLink.getPath() || "/", encoding);
          };
          const realpathImpl = (path, a, b) => {
            const [opts, callback] = (0, options_1.getRealpathOptsAndCb)(a, b);
            const pathFilename = (0, util_3.pathToFilename)(path);
            self2.wrapAsync(_realpath, [pathFilename, opts.encoding], callback);
          };
          const realpathSyncImpl = (path, options) => _realpath((0, util_3.pathToFilename)(path), (0, options_1.getRealpathOptions)(options).encoding);
          this.realpath = realpathImpl;
          this.realpath.native = realpathImpl;
          this.realpathSync = realpathSyncImpl;
          this.realpathSync.native = realpathSyncImpl;
        }
        wrapAsync(method, args, callback) {
          (0, util_3.validateCallback)(callback);
          Promise.resolve().then(() => {
            let result;
            try {
              result = method.apply(this, args);
            } catch (err) {
              callback(err);
              return;
            }
            callback(null, result);
          });
        }
        reset() {
          this._core.reset();
        }
        toJSON(paths, json = {}, isRelative = false, asBuffer = false) {
          return this._core.toJSON(paths, json, isRelative, asBuffer);
        }
        fromJSON(json, cwd) {
          return this._core.fromJSON(json, cwd);
        }
        fromNestedJSON(json, cwd) {
          return this._core.fromNestedJSON(json, cwd);
        }
        // Legacy interface
        mountSync(mountpoint, json) {
          this._core.fromJSON(json, mountpoint);
        }
        _write(fd, buf, offset, length, position) {
          const file = this._core.getFileByFdOrThrow(fd, "write");
          if (file.node.isSymlink()) {
            throw (0, util_3.createError)("EBADF", "write", file.link.getPath());
          }
          return file.write(buf, offset, length, position === -1 || typeof position !== "number" ? void 0 : position);
        }
        writevBase(fd, buffers, position) {
          const file = this._core.getFileByFdOrThrow(fd);
          let p = position ?? void 0;
          if (p === -1) {
            p = void 0;
          }
          let bytesWritten = 0;
          for (const buffer of buffers) {
            const nodeBuf = buffer_1.Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength);
            const bytes = file.write(nodeBuf, 0, nodeBuf.byteLength, p);
            p = void 0;
            bytesWritten += bytes;
            if (bytes < nodeBuf.byteLength)
              break;
          }
          return bytesWritten;
        }
        _copyFile(src, dest, flags) {
          const buf = this.readFileSync(src);
          if (flags & COPYFILE_EXCL && this.existsSync(dest))
            throw (0, util_3.createError)("EEXIST", "copyFile", src, dest);
          if (flags & COPYFILE_FICLONE_FORCE)
            throw (0, util_3.createError)("ENOSYS", "copyFile", src, dest);
          this._core.writeFile(
            dest,
            buf,
            fs_node_utils_2.FLAGS.w,
            438
            /* MODE.DEFAULT */
          );
        }
        isSrcSubdir(src, dest) {
          try {
            const normalizedSrc = pathNormalize(src.startsWith("/") ? src : "/" + src);
            const normalizedDest = pathNormalize(dest.startsWith("/") ? dest : "/" + dest);
            if (normalizedSrc === normalizedDest)
              return true;
            const relativePath = pathRelative(normalizedSrc, normalizedDest);
            return relativePath === "" || !relativePath.startsWith("..") && !(0, path_1.isAbsolute)(relativePath);
          } catch (error) {
            return false;
          }
        }
        cpFileSync(srcStat, destStat, src, dest, options) {
          if (destStat) {
            if (options.errorOnExist)
              throw (0, util_3.createError)("EEXIST", "cp", dest);
            if (!options.force)
              return;
            this.unlinkSync(dest);
          }
          this.copyFileSync(src, dest, options.mode);
          if (options.preserveTimestamps)
            this.utimesSync(dest, srcStat.atime, srcStat.mtime);
          this.chmodSync(dest, Number(srcStat.mode));
        }
        cpDirSync(srcStat, destStat, src, dest, options) {
          if (!destStat) {
            this.mkdirSync(dest);
          }
          const entries = this.readdirSync(src);
          for (const entry of entries) {
            const srcItem = pathJoin(src, String(entry));
            const destItem = pathJoin(dest, String(entry));
            if (options.filter && !options.filter(srcItem, destItem)) {
              continue;
            }
            this._cp(srcItem, destItem, options);
          }
          this.chmodSync(dest, Number(srcStat.mode));
        }
        cpSymlinkSync(destStat, src, dest, options) {
          let linkTarget = String(this.readlinkSync(src));
          if (!options.verbatimSymlinks && !(0, path_1.isAbsolute)(linkTarget))
            linkTarget = resolveCrossPlatform(pathDirname(src), linkTarget);
          if (destStat)
            this.unlinkSync(dest);
          this.symlinkSync(linkTarget, dest);
        }
        lstat(path, a, b) {
          const [{ throwIfNoEntry = true, bigint = false }, callback] = (0, options_1.getStatOptsAndCb)(a, b);
          this.wrapAsync(this._lstat, [(0, util_3.pathToFilename)(path), bigint, throwIfNoEntry], callback);
        }
        _stat(filename, bigint = false, throwIfNoEntry = true) {
          const result = this._core.getResolvedLinkResult(filename, "stat");
          if (result.ok) {
            return (0, fs_core_1.Ok)(Stats_1.default.build(result.value.getNode(), bigint));
          }
          if (result.err.code === "ENOENT" && !throwIfNoEntry) {
            return (0, fs_core_1.Ok)(void 0);
          } else {
            return result;
          }
        }
        _statOrThrow(filename, bigint = false, throwIfNoEntry = true) {
          const result = this._stat(filename, bigint, throwIfNoEntry);
          if (result.ok) {
            return result.value;
          } else {
            throw result.err.toError();
          }
        }
        statSync(path, options) {
          const { bigint = true, throwIfNoEntry = true } = (0, options_1.getStatOptions)(options);
          const result = this._stat((0, util_3.pathToFilename)(path), bigint, throwIfNoEntry);
          if (result.ok) {
            return result.value;
          } else {
            throw result.err.toError();
          }
        }
        stat(path, a, b) {
          const [{ bigint = false, throwIfNoEntry = true }, callback] = (0, options_1.getStatOptsAndCb)(a, b);
          this.wrapAsync(this._statOrThrow, [(0, util_3.pathToFilename)(path), bigint, throwIfNoEntry], callback);
        }
        fstatBase(fd, bigint = false) {
          const file = this._core.getFileByFd(fd);
          if (!file)
            throw (0, util_3.createError)("EBADF", "fstat");
          return Stats_1.default.build(file.node, bigint);
        }
        fstatSync(fd, options) {
          return this.fstatBase(fd, (0, options_1.getStatOptions)(options).bigint);
        }
        fstat(fd, a, b) {
          const [opts, callback] = (0, options_1.getStatOptsAndCb)(a, b);
          this.wrapAsync(this.fstatBase, [fd, opts.bigint], callback);
        }
        _exists(filename) {
          const result = this._stat(filename);
          return result.ok ? (0, fs_core_1.Ok)(true) : result;
        }
        _access(filename, mode) {
          const link = this._core.getResolvedLinkOrThrow(filename, "access");
          const node = link.getNode();
          if (mode === F_OK) {
            return;
          }
          if (mode & R_OK && !node.canRead()) {
            throw (0, util_3.createError)("EACCES", "access", filename);
          }
          if (mode & W_OK && !node.canWrite()) {
            throw (0, util_3.createError)("EACCES", "access", filename);
          }
          if (mode & X_OK && !node.canExecute()) {
            throw (0, util_3.createError)("EACCES", "access", filename);
          }
        }
        watchFile(path, a, b) {
          const filename = (0, util_3.pathToFilename)(path);
          let options = a;
          let listener = b;
          if (typeof options === "function") {
            listener = a;
            options = null;
          }
          if (typeof listener !== "function") {
            throw Error('"watchFile()" requires a listener function');
          }
          let interval = 5007;
          let persistent = true;
          if (options && typeof options === "object") {
            if (typeof options.interval === "number")
              interval = options.interval;
            if (typeof options.persistent === "boolean")
              persistent = options.persistent;
          }
          let watcher = this.statWatchers[filename];
          if (!watcher) {
            watcher = new this.StatWatcher();
            watcher.start(filename, persistent, interval);
            this.statWatchers[filename] = watcher;
          }
          watcher.addListener("change", listener);
          return watcher;
        }
        unwatchFile(path, listener) {
          const filename = (0, util_3.pathToFilename)(path);
          const watcher = this.statWatchers[filename];
          if (!watcher)
            return;
          if (typeof listener === "function") {
            watcher.removeListener("change", listener);
          } else {
            watcher.removeAllListeners("change");
          }
          if (watcher.listenerCount("change") === 0) {
            watcher.stop();
            delete this.statWatchers[filename];
          }
        }
        createReadStream(path, options) {
          return new this.ReadStream(path, options);
        }
        createWriteStream(path, options) {
          return new this.WriteStream(path, options);
        }
        // watch(path: PathLike): FSWatcher;
        // watch(path: PathLike, options?: IWatchOptions | string): FSWatcher;
        watch(path, options, listener) {
          const filename = (0, util_3.pathToFilename)(path);
          let givenOptions = options;
          if (typeof options === "function") {
            listener = options;
            givenOptions = null;
          }
          let { persistent, recursive, encoding } = (0, options_1.getDefaultOpts)(givenOptions);
          if (persistent === void 0)
            persistent = true;
          if (recursive === void 0)
            recursive = false;
          const watcher = new this.FSWatcher();
          watcher.start(filename, persistent, recursive, encoding);
          if (listener) {
            watcher.addListener("change", listener);
          }
          return watcher;
        }
        _statfs(filename, bigint = false) {
          this._core.getResolvedLinkOrThrow(filename, "statfs");
          return StatFs_1.default.build(this._core, bigint);
        }
        statfsSync(path, options) {
          const { bigint = false } = (0, options_1.getStatfsOptions)(options);
          return this._statfs((0, util_3.pathToFilename)(path), bigint);
        }
        statfs(path, a, b) {
          const [{ bigint = false }, callback] = (0, options_1.getStatfsOptsAndCb)(a, b);
          this.wrapAsync(this._statfs, [(0, util_3.pathToFilename)(path), bigint], callback);
        }
        // Tree View
        toTree(opts = { separator: path_1.sep }) {
          return (0, fs_print_1.toTreeSync)(this, opts);
        }
        // Snapshots
        toSnapshot(path = "/") {
          return fsSnapshot.toSnapshotSync({ fs: this, path });
        }
        fromSnapshot(snapshot, path = "/") {
          return fsSnapshot.fromSnapshotSync(snapshot, { fs: this, path });
        }
        toBinarySnapshot(path = "/") {
          return fsSnapshot.toBinarySnapshotSync({ fs: this, path });
        }
        fromBinarySnapshot(binary, path = "/") {
          return fsSnapshot.fromBinarySnapshotSync(binary, { fs: this, path });
        }
        toJsonSnapshot(path = "/") {
          const uint8 = fsSnapshot.toJsonSnapshotSync({ fs: this, path });
          return buffer_1.Buffer.from(uint8).toString("utf8");
        }
        fromJsonSnapshot(json, path = "/") {
          const uint8 = new Uint8Array(buffer_1.Buffer.from(json, "utf8"));
          return fsSnapshot.fromJsonSnapshotSync(uint8, { fs: this, path });
        }
      };
      exports.Volume = Volume;
      Volume.fromJSON = (json, cwd, opts) => new Volume(fs_core_1.Superblock.fromJSON(json, cwd, opts));
      Volume.fromNestedJSON = (json, cwd, opts) => new Volume(fs_core_1.Superblock.fromNestedJSON(json, cwd, opts));
      function emitStop(self2) {
        self2.emit("stop");
      }
      var StatWatcher = class extends events_1.EventEmitter {
        constructor(vol) {
          super();
          this.onInterval = () => {
            try {
              const stats = this.vol.statSync(this.filename);
              if (this.hasChanged(stats)) {
                this.emit("change", stats, this.prev);
                this.prev = stats;
              }
            } finally {
              this.loop();
            }
          };
          this.vol = vol;
        }
        loop() {
          this.timeoutRef = this.setTimeout(this.onInterval, this.interval);
        }
        hasChanged(stats) {
          if (stats.mtimeMs > this.prev.mtimeMs)
            return true;
          if (stats.nlink !== this.prev.nlink)
            return true;
          return false;
        }
        start(path, persistent = true, interval = 5007) {
          this.filename = (0, util_3.pathToFilename)(path);
          this.setTimeout = persistent ? setTimeout.bind(typeof globalThis !== "undefined" ? globalThis : globalThis) : setTimeoutUnref_1.default;
          this.interval = interval;
          this.prev = this.vol.statSync(this.filename);
          this.loop();
        }
        stop() {
          clearTimeout(this.timeoutRef);
          queueMicrotask(() => {
            emitStop.call(this, this);
          });
        }
      };
      exports.StatWatcher = StatWatcher;
      var pool;
      function allocNewPool(poolSize) {
        pool = (0, buffer_1.bufferAllocUnsafe)(poolSize);
        pool.used = 0;
      }
      (0, util_2.inherits)(FsReadStream, stream_1.Readable);
      exports.ReadStream = FsReadStream;
      function FsReadStream(vol, path, options) {
        if (!(this instanceof FsReadStream))
          return new FsReadStream(vol, path, options);
        this._vol = vol;
        options = Object.assign({}, (0, options_1.getOptions)(options, {}));
        if (options.highWaterMark === void 0)
          options.highWaterMark = 64 * 1024;
        stream_1.Readable.call(this, options);
        this.path = (0, util_3.pathToFilename)(path);
        this._fileHandle = options.fd && typeof options.fd !== "number" ? options.fd : null;
        this.fd = options.fd === void 0 ? null : typeof options.fd !== "number" ? options.fd.fd : options.fd;
        this.flags = options.flags === void 0 ? "r" : options.flags;
        this.mode = options.mode === void 0 ? 438 : options.mode;
        this.start = options.start;
        this.end = options.end;
        this.autoClose = options.autoClose === void 0 ? true : options.autoClose;
        this.pos = void 0;
        this.bytesRead = 0;
        if (this.start !== void 0) {
          if (typeof this.start !== "number") {
            throw new TypeError('"start" option must be a Number');
          }
          if (this.end === void 0) {
            this.end = Infinity;
          } else if (typeof this.end !== "number") {
            throw new TypeError('"end" option must be a Number');
          }
          if (this.start > this.end) {
            throw new Error('"start" option must be <= "end" option');
          }
          this.pos = this.start;
        }
        if (typeof this.fd !== "number")
          this.open();
        this.on("end", function() {
          if (this.autoClose) {
            if (this.destroy)
              this.destroy();
          }
        });
      }
      FsReadStream.prototype.open = function() {
        var self2 = this;
        this._vol.open(this.path, this.flags, this.mode, (er, fd) => {
          if (er) {
            if (self2.autoClose) {
              if (self2.destroy)
                self2.destroy();
            }
            self2.emit("error", er);
            return;
          }
          self2.fd = fd;
          self2.emit("open", fd);
          self2.read();
        });
      };
      FsReadStream.prototype._read = function(n) {
        if (typeof this.fd !== "number") {
          return this.once("open", function() {
            this._read(n);
          });
        }
        if (this.destroyed)
          return;
        if (!pool || pool.length - pool.used < kMinPoolSpace) {
          allocNewPool(this._readableState.highWaterMark);
        }
        var thisPool = pool;
        var toRead = Math.min(pool.length - pool.used, n);
        var start = pool.used;
        if (this.pos !== void 0)
          toRead = Math.min(this.end - this.pos + 1, toRead);
        if (toRead <= 0)
          return this.push(null);
        var self2 = this;
        this._vol.read(this.fd, pool, pool.used, toRead, this.pos, onread);
        if (this.pos !== void 0)
          this.pos += toRead;
        pool.used += toRead;
        function onread(er, bytesRead) {
          if (er) {
            if (self2.autoClose && self2.destroy) {
              self2.destroy();
            }
            self2.emit("error", er);
          } else {
            var b = null;
            if (bytesRead > 0) {
              self2.bytesRead += bytesRead;
              b = thisPool.slice(start, start + bytesRead);
            }
            self2.push(b);
          }
        }
      };
      FsReadStream.prototype._destroy = function(err, cb) {
        this.close((err2) => {
          cb(err || err2);
        });
      };
      FsReadStream.prototype.close = function(cb) {
        if (cb)
          this.once("close", cb);
        if (this.closed || typeof this.fd !== "number") {
          if (typeof this.fd !== "number") {
            this.once("open", closeOnOpen);
            return;
          }
          return queueMicrotask(() => this.emit("close"));
        }
        if (typeof this._readableState?.closed === "boolean") {
          this._readableState.closed = true;
        } else {
          this.closed = true;
        }
        if (this._fileHandle) {
          this._fileHandle.close().then(() => this.emit("close"), (er) => this.emit("error", er));
        } else {
          this._vol.close(this.fd, (er) => {
            if (er)
              this.emit("error", er);
            else
              this.emit("close");
          });
        }
        this.fd = null;
      };
      function closeOnOpen(fd) {
        this.close();
      }
      (0, util_2.inherits)(FsWriteStream, stream_1.Writable);
      exports.WriteStream = FsWriteStream;
      function FsWriteStream(vol, path, options) {
        if (!(this instanceof FsWriteStream))
          return new FsWriteStream(vol, path, options);
        this._vol = vol;
        options = Object.assign({}, (0, options_1.getOptions)(options, {}));
        stream_1.Writable.call(this, options);
        this.path = (0, util_3.pathToFilename)(path);
        this._fileHandle = options.fd && typeof options.fd !== "number" ? options.fd : null;
        this.fd = options.fd === void 0 ? null : typeof options.fd !== "number" ? options.fd.fd : options.fd;
        this.flags = options.flags === void 0 ? "w" : options.flags;
        this.mode = options.mode === void 0 ? 438 : options.mode;
        this.start = options.start;
        this.autoClose = options.autoClose === void 0 ? true : !!options.autoClose;
        this.pos = void 0;
        this.bytesWritten = 0;
        this.pending = true;
        if (this.start !== void 0) {
          if (typeof this.start !== "number") {
            throw new TypeError('"start" option must be a Number');
          }
          if (this.start < 0) {
            throw new Error('"start" must be >= zero');
          }
          this.pos = this.start;
        }
        if (options.encoding)
          this.setDefaultEncoding(options.encoding);
        if (typeof this.fd !== "number")
          this.open();
        this.once("finish", function() {
          if (this.autoClose) {
            this.close();
          }
        });
      }
      FsWriteStream.prototype.open = function() {
        this._vol.open(this.path, this.flags, this.mode, function(er, fd) {
          if (er) {
            if (this.autoClose && this.destroy) {
              this.destroy();
            }
            this.emit("error", er);
            return;
          }
          this.fd = fd;
          this.pending = false;
          this.emit("open", fd);
        }.bind(this));
      };
      FsWriteStream.prototype._write = function(data, encoding, cb) {
        if (!(data instanceof buffer_1.Buffer || data instanceof Uint8Array))
          return this.emit("error", new Error("Invalid data"));
        if (typeof this.fd !== "number") {
          return this.once("open", function() {
            this._write(data, encoding, cb);
          });
        }
        var self2 = this;
        this._vol.write(this.fd, data, 0, data.length, this.pos, (er, bytes) => {
          if (er) {
            if (self2.autoClose && self2.destroy) {
              self2.destroy();
            }
            return cb(er);
          }
          self2.bytesWritten += bytes;
          cb();
        });
        if (this.pos !== void 0)
          this.pos += data.length;
      };
      FsWriteStream.prototype._writev = function(data, cb) {
        if (typeof this.fd !== "number") {
          return this.once("open", function() {
            this._writev(data, cb);
          });
        }
        const self2 = this;
        const len = data.length;
        const chunks = new Array(len);
        var size = 0;
        for (var i = 0; i < len; i++) {
          var chunk = data[i].chunk;
          chunks[i] = chunk;
          size += chunk.length;
        }
        const buf = buffer_1.Buffer.concat(chunks);
        this._vol.write(this.fd, buf, 0, buf.length, this.pos, (er, bytes) => {
          if (er) {
            if (self2.destroy)
              self2.destroy();
            return cb(er);
          }
          self2.bytesWritten += bytes;
          cb();
        });
        if (this.pos !== void 0)
          this.pos += size;
      };
      FsWriteStream.prototype.close = function(cb) {
        if (cb)
          this.once("close", cb);
        if (this.closed || typeof this.fd !== "number") {
          if (typeof this.fd !== "number") {
            this.once("open", closeOnOpen);
            return;
          }
          return queueMicrotask(() => this.emit("close"));
        }
        if (typeof this._writableState?.closed === "boolean") {
          this._writableState.closed = true;
        } else {
          this.closed = true;
        }
        if (this._fileHandle) {
          this._fileHandle.close().then(() => this.emit("close"), (er) => this.emit("error", er));
        } else {
          this._vol.close(this.fd, (er) => {
            if (er)
              this.emit("error", er);
            else
              this.emit("close");
          });
        }
        this.fd = null;
      };
      FsWriteStream.prototype._destroy = FsReadStream.prototype._destroy;
      FsWriteStream.prototype.destroySoon = FsWriteStream.prototype.end;
      var FSWatcher = class extends events_1.EventEmitter {
        constructor(vol) {
          super();
          this._filename = "";
          this._filenameEncoded = "";
          this._recursive = false;
          this._encoding = fs_node_utils_1.ENCODING_UTF8;
          this._listenerRemovers = /* @__PURE__ */ new Map();
          this._onParentChild = (link) => {
            if (link.getName() === this._getName()) {
              this._emit("rename");
            }
          };
          this._emit = (type) => {
            this.emit("change", type, this._filenameEncoded);
          };
          this._persist = () => {
            this._timer = setTimeout(this._persist, 1e6);
          };
          this._vol = vol;
        }
        _getName() {
          return this._steps[this._steps.length - 1];
        }
        start(path, persistent = true, recursive = false, encoding = fs_node_utils_1.ENCODING_UTF8) {
          this._filename = (0, util_3.pathToFilename)(path);
          this._steps = (0, fs_core_1.filenameToSteps)(this._filename);
          this._filenameEncoded = (0, fs_node_utils_1.strToEncoding)(this._filename);
          this._recursive = recursive;
          this._encoding = encoding;
          try {
            this._link = this._vol._core.getLinkOrThrow(this._filename, "FSWatcher");
          } catch (err) {
            const error = new Error(`watch ${this._filename} ${err.code}`);
            error.code = err.code;
            error.errno = err.code;
            throw error;
          }
          const watchLinkNodeChanged = (link) => {
            const filepath = link.getPath();
            const node = link.getNode();
            const onNodeChange = () => {
              let filename = pathRelative(this._filename, filepath);
              if (!filename)
                filename = this._getName();
              return this.emit("change", "change", filename);
            };
            const unsub = node.changes.listen(([type]) => {
              if (type === "modify")
                onNodeChange();
            });
            const removers = this._listenerRemovers.get(node.ino) ?? [];
            removers.push(() => unsub());
            this._listenerRemovers.set(node.ino, removers);
          };
          const watchLinkChildrenChanged = (link) => {
            const node = link.getNode();
            const onLinkChildAdd = (l) => {
              this.emit("change", "rename", pathRelative(this._filename, l.getPath()));
              watchLinkNodeChanged(l);
              watchLinkChildrenChanged(l);
            };
            const onLinkChildDelete = (l) => {
              const removeLinkNodeListeners = (curLink) => {
                const ino = curLink.getNode().ino;
                const removers2 = this._listenerRemovers.get(ino);
                if (removers2) {
                  removers2.forEach((r) => r());
                  this._listenerRemovers.delete(ino);
                }
                for (const [name, childLink] of curLink.children.entries()) {
                  if (childLink && name !== "." && name !== "..") {
                    removeLinkNodeListeners(childLink);
                  }
                }
              };
              removeLinkNodeListeners(l);
              this.emit("change", "rename", pathRelative(this._filename, l.getPath()));
            };
            for (const [name, childLink] of link.children.entries()) {
              if (childLink && name !== "." && name !== "..") {
                watchLinkNodeChanged(childLink);
              }
            }
            const unsubscribeLinkChanges = link.changes.listen(([type, link2]) => {
              if (type === "child:add")
                onLinkChildAdd(link2);
              else if (type === "child:del")
                onLinkChildDelete(link2);
            });
            const removers = this._listenerRemovers.get(node.ino) ?? [];
            removers.push(() => {
              unsubscribeLinkChanges();
            });
            if (recursive) {
              for (const [name, childLink] of link.children.entries()) {
                if (childLink && name !== "." && name !== "..") {
                  watchLinkChildrenChanged(childLink);
                }
              }
            }
          };
          watchLinkNodeChanged(this._link);
          watchLinkChildrenChanged(this._link);
          const parent = this._link.parent;
          if (parent) {
            parent.changes.listen(([type, link]) => {
              if (type === "child:del")
                this._onParentChild(link);
            });
          }
          if (persistent)
            this._persist();
        }
        close() {
          clearTimeout(this._timer);
          this._listenerRemovers.forEach((removers) => {
            removers.forEach((r) => r());
          });
          this._listenerRemovers.clear();
          this._parentChangesUnsub?.();
        }
      };
      exports.FSWatcher = FSWatcher;
    }
  });

  // node_modules/@jsonjoy.com/fs-node/lib/lists/fsCallbackApiList.js
  var require_fsCallbackApiList = __commonJS({
    "node_modules/@jsonjoy.com/fs-node/lib/lists/fsCallbackApiList.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.fsCallbackApiList = void 0;
      exports.fsCallbackApiList = [
        "access",
        "appendFile",
        "chmod",
        "chown",
        "close",
        "copyFile",
        "cp",
        "createReadStream",
        "createWriteStream",
        "exists",
        "fchmod",
        "fchown",
        "fdatasync",
        "fstat",
        "fsync",
        "ftruncate",
        "futimes",
        "glob",
        "lchmod",
        "lchown",
        "link",
        "lstat",
        "mkdir",
        "mkdtemp",
        "open",
        "openAsBlob",
        "opendir",
        "read",
        "readv",
        "readdir",
        "readFile",
        "readlink",
        "realpath",
        "rename",
        "rm",
        "rmdir",
        "stat",
        "statfs",
        "symlink",
        "truncate",
        "unlink",
        "unwatchFile",
        "utimes",
        "lutimes",
        "watch",
        "watchFile",
        "write",
        "writev",
        "writeFile"
      ];
    }
  });

  // node_modules/@jsonjoy.com/fs-node/lib/lists/fsSynchronousApiList.js
  var require_fsSynchronousApiList = __commonJS({
    "node_modules/@jsonjoy.com/fs-node/lib/lists/fsSynchronousApiList.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.fsSynchronousApiList = void 0;
      exports.fsSynchronousApiList = [
        "accessSync",
        "appendFileSync",
        "chmodSync",
        "chownSync",
        "closeSync",
        "copyFileSync",
        "cpSync",
        "existsSync",
        "fchmodSync",
        "fchownSync",
        "fdatasyncSync",
        "fstatSync",
        "fsyncSync",
        "ftruncateSync",
        "futimesSync",
        "globSync",
        "lchmodSync",
        "lchownSync",
        "linkSync",
        "lstatSync",
        "mkdirSync",
        "mkdtempSync",
        "openSync",
        "opendirSync",
        "readdirSync",
        "readFileSync",
        "readlinkSync",
        "readSync",
        "readvSync",
        "realpathSync",
        "renameSync",
        "rmdirSync",
        "rmSync",
        "statfsSync",
        "statSync",
        "symlinkSync",
        "truncateSync",
        "unlinkSync",
        "utimesSync",
        "lutimesSync",
        "writeFileSync",
        "writeSync",
        "writevSync"
      ];
    }
  });

  // node_modules/@jsonjoy.com/fs-node/lib/lists/fsCommonObjectsList.js
  var require_fsCommonObjectsList = __commonJS({
    "node_modules/@jsonjoy.com/fs-node/lib/lists/fsCommonObjectsList.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.fsCommonObjectsList = void 0;
      exports.fsCommonObjectsList = [
        "F_OK",
        "R_OK",
        "W_OK",
        "X_OK",
        "constants",
        "Stats",
        "StatFs",
        "Dir",
        "Dirent",
        "StatsWatcher",
        "FSWatcher",
        "ReadStream",
        "WriteStream"
      ];
    }
  });

  // node_modules/@jsonjoy.com/fs-node/lib/index.js
  var require_lib7 = __commonJS({
    "node_modules/@jsonjoy.com/fs-node/lib/index.js"(exports) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.fsCommonObjectsList = exports.fsSynchronousApiList = exports.fsCallbackApiList = exports.FsPromises = exports.Dir = exports.FileHandle = exports.StatFs = exports.Dirent = exports.Stats = exports.toUnixTimestamp = exports.FSWatcher = exports.StatWatcher = exports.Volume = void 0;
      var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
      var volume_1 = require_volume();
      Object.defineProperty(exports, "Volume", { enumerable: true, get: function() {
        return volume_1.Volume;
      } });
      Object.defineProperty(exports, "StatWatcher", { enumerable: true, get: function() {
        return volume_1.StatWatcher;
      } });
      Object.defineProperty(exports, "FSWatcher", { enumerable: true, get: function() {
        return volume_1.FSWatcher;
      } });
      Object.defineProperty(exports, "toUnixTimestamp", { enumerable: true, get: function() {
        return volume_1.toUnixTimestamp;
      } });
      var Stats_1 = require_Stats();
      Object.defineProperty(exports, "Stats", { enumerable: true, get: function() {
        return Stats_1.default;
      } });
      var Dirent_1 = require_Dirent();
      Object.defineProperty(exports, "Dirent", { enumerable: true, get: function() {
        return Dirent_1.default;
      } });
      var StatFs_1 = require_StatFs();
      Object.defineProperty(exports, "StatFs", { enumerable: true, get: function() {
        return StatFs_1.default;
      } });
      var FileHandle_1 = require_FileHandle();
      Object.defineProperty(exports, "FileHandle", { enumerable: true, get: function() {
        return FileHandle_1.FileHandle;
      } });
      var Dir_1 = require_Dir();
      Object.defineProperty(exports, "Dir", { enumerable: true, get: function() {
        return Dir_1.Dir;
      } });
      var FsPromises_1 = require_FsPromises();
      Object.defineProperty(exports, "FsPromises", { enumerable: true, get: function() {
        return FsPromises_1.FsPromises;
      } });
      tslib_1.__exportStar(require_options(), exports);
      tslib_1.__exportStar(require_util3(), exports);
      tslib_1.__exportStar(require_glob(), exports);
      var fsCallbackApiList_1 = require_fsCallbackApiList();
      Object.defineProperty(exports, "fsCallbackApiList", { enumerable: true, get: function() {
        return fsCallbackApiList_1.fsCallbackApiList;
      } });
      var fsSynchronousApiList_1 = require_fsSynchronousApiList();
      Object.defineProperty(exports, "fsSynchronousApiList", { enumerable: true, get: function() {
        return fsSynchronousApiList_1.fsSynchronousApiList;
      } });
      var fsCommonObjectsList_1 = require_fsCommonObjectsList();
      Object.defineProperty(exports, "fsCommonObjectsList", { enumerable: true, get: function() {
        return fsCommonObjectsList_1.fsCommonObjectsList;
      } });
    }
  });

  // node_modules/memfs/lib/index.js
  var require_lib8 = __commonJS({
    "node_modules/memfs/lib/index.js"(exports, module) {
      "use strict";
      init_shim();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.memfs = exports.fs = exports.vol = exports.Volume = void 0;
      exports.createFsFromVolume = createFsFromVolume;
      var fs_node_1 = require_lib7();
      Object.defineProperty(exports, "Volume", { enumerable: true, get: function() {
        return fs_node_1.Volume;
      } });
      var fs_node_utils_1 = require_lib();
      var { F_OK, R_OK, W_OK, X_OK } = fs_node_utils_1.constants;
      exports.vol = new fs_node_1.Volume();
      function createFsFromVolume(vol) {
        const fs = { F_OK, R_OK, W_OK, X_OK, constants: fs_node_utils_1.constants, Stats: fs_node_1.Stats, Dirent: fs_node_1.Dirent };
        for (const method of fs_node_1.fsSynchronousApiList)
          if (typeof vol[method] === "function")
            fs[method] = vol[method].bind(vol);
        for (const method of fs_node_1.fsCallbackApiList)
          if (typeof vol[method] === "function")
            fs[method] = vol[method].bind(vol);
        fs.StatWatcher = vol.StatWatcher;
        fs.FSWatcher = vol.FSWatcher;
        fs.WriteStream = vol.WriteStream;
        fs.ReadStream = vol.ReadStream;
        fs.promises = vol.promises;
        if (typeof vol.realpath === "function") {
          fs.realpath = vol.realpath.bind(vol);
          if (typeof vol.realpath.native === "function") {
            fs.realpath.native = vol.realpath.native.bind(vol);
          }
        }
        if (typeof vol.realpathSync === "function") {
          fs.realpathSync = vol.realpathSync.bind(vol);
          if (typeof vol.realpathSync.native === "function") {
            fs.realpathSync.native = vol.realpathSync.native.bind(vol);
          }
        }
        fs._toUnixTimestamp = fs_node_1.toUnixTimestamp;
        fs.__vol = vol;
        return fs;
      }
      exports.fs = createFsFromVolume(exports.vol);
      var memfs = (json = {}, cwdOrOpts = "/") => {
        const opts = typeof cwdOrOpts === "string" ? { cwd: cwdOrOpts } : cwdOrOpts;
        const cwd = opts.cwd ?? (opts.process ? void 0 : "/");
        const vol = fs_node_1.Volume.fromNestedJSON(json, cwd, { process: opts.process });
        const fs = createFsFromVolume(vol);
        return { fs, vol };
      };
      exports.memfs = memfs;
      module.exports = { ...module.exports, ...exports.fs };
      module.exports.semantic = true;
    }
  });

  // tools/_crypto-browser.js
  var require_crypto_browser = __commonJS({
    "tools/_crypto-browser.js"(exports, module) {
      "use strict";
      init_shim();
      var K = new Uint32Array([
        1116352408,
        1899447441,
        3049323471,
        3921009573,
        961987163,
        1508970993,
        2453635748,
        2870763221,
        3624381080,
        310598401,
        607225278,
        1426881987,
        1925078388,
        2162078206,
        2614888103,
        3248222580,
        3835390401,
        4022224774,
        264347078,
        604807628,
        770255983,
        1249150122,
        1555081692,
        1996064986,
        2554220882,
        2821834349,
        2952996808,
        3210313671,
        3336571891,
        3584528711,
        113926993,
        338241895,
        666307205,
        773529912,
        1294757372,
        1396182291,
        1695183700,
        1986661051,
        2177026350,
        2456956037,
        2730485921,
        2820302411,
        3259730800,
        3345764771,
        3516065817,
        3600352804,
        4094571909,
        275423344,
        430227734,
        506948616,
        659060556,
        883997877,
        958139571,
        1322822218,
        1537002063,
        1747873779,
        1955562222,
        2024104815,
        2227730452,
        2361852424,
        2428436474,
        2756734187,
        3204031479,
        3329325298
      ]);
      var rotr = (x, n) => x >>> n | x << 32 - n;
      var _te = null;
      function utf8Bytes(str) {
        if (typeof TextEncoder !== "undefined") {
          if (!_te) _te = new TextEncoder();
          return _te.encode(str);
        }
        const out = [];
        for (let i = 0; i < str.length; i++) {
          let c = str.charCodeAt(i);
          if (c < 128) out.push(c);
          else if (c < 2048) out.push(192 | c >> 6, 128 | c & 63);
          else if (c >= 55296 && c <= 56319) {
            c = 65536 + ((c & 1023) << 10) + (str.charCodeAt(++i) & 1023);
            out.push(
              240 | c >> 18,
              128 | c >> 12 & 63,
              128 | c >> 6 & 63,
              128 | c & 63
            );
          } else
            out.push(224 | c >> 12, 128 | c >> 6 & 63, 128 | c & 63);
        }
        return Uint8Array.from(out);
      }
      function toBytes(data, encoding) {
        if (typeof data === "string") {
          if (encoding === "hex") {
            const a = new Uint8Array(data.length >> 1);
            for (let i = 0; i < a.length; i++)
              a[i] = parseInt(data.substr(i * 2, 2), 16);
            return a;
          }
          if (encoding === "base64") {
            const bin = typeof atob === "function" ? atob(data) : import_buffer.Buffer.from(data, "base64").toString("binary");
            const a = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
            return a;
          }
          return utf8Bytes(data);
        }
        if (data instanceof Uint8Array) return data;
        if (ArrayBuffer.isView(data))
          return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        if (data instanceof ArrayBuffer) return new Uint8Array(data);
        if (Array.isArray(data)) return Uint8Array.from(data);
        throw new TypeError("createHash.update: unsupported input type");
      }
      var Sha256 = class {
        constructor() {
          this.h = new Uint32Array([
            1779033703,
            3144134277,
            1013904242,
            2773480762,
            1359893119,
            2600822924,
            528734635,
            1541459225
          ]);
          this.block = new Uint8Array(64);
          this.blockLen = 0;
          this.bytes = 0;
          this.w = new Uint32Array(64);
          this.done = false;
        }
        _compress(p, off) {
          const w = this.w;
          for (let t = 0; t < 16; t++) {
            const i = off + t * 4;
            w[t] = (p[i] << 24 | p[i + 1] << 16 | p[i + 2] << 8 | p[i + 3]) >>> 0;
          }
          for (let t = 16; t < 64; t++) {
            const x = w[t - 15];
            const y = w[t - 2];
            const s0 = rotr(x, 7) ^ rotr(x, 18) ^ x >>> 3;
            const s1 = rotr(y, 17) ^ rotr(y, 19) ^ y >>> 10;
            w[t] = w[t - 16] + s0 + w[t - 7] + s1 | 0;
          }
          let a = this.h[0], b = this.h[1], c = this.h[2], d = this.h[3], e = this.h[4], f = this.h[5], g = this.h[6], h = this.h[7];
          for (let t = 0; t < 64; t++) {
            const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
            const ch = e & f ^ ~e & g;
            const t1 = h + S1 + ch + K[t] + w[t] | 0;
            const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
            const maj = a & b ^ a & c ^ b & c;
            const t2 = S0 + maj | 0;
            h = g;
            g = f;
            f = e;
            e = d + t1 | 0;
            d = c;
            c = b;
            b = a;
            a = t1 + t2 | 0;
          }
          this.h[0] = this.h[0] + a | 0;
          this.h[1] = this.h[1] + b | 0;
          this.h[2] = this.h[2] + c | 0;
          this.h[3] = this.h[3] + d | 0;
          this.h[4] = this.h[4] + e | 0;
          this.h[5] = this.h[5] + f | 0;
          this.h[6] = this.h[6] + g | 0;
          this.h[7] = this.h[7] + h | 0;
        }
        update(data, encoding) {
          if (this.done) throw new Error("digest already called");
          const bytes = toBytes(data, encoding);
          this.bytes += bytes.length;
          let i = 0;
          if (this.blockLen > 0) {
            while (i < bytes.length && this.blockLen < 64)
              this.block[this.blockLen++] = bytes[i++];
            if (this.blockLen === 64) {
              this._compress(this.block, 0);
              this.blockLen = 0;
            }
          }
          while (i + 64 <= bytes.length) {
            this._compress(bytes, i);
            i += 64;
          }
          while (i < bytes.length) this.block[this.blockLen++] = bytes[i++];
          return this;
        }
        digest(encoding) {
          if (this.done) throw new Error("digest already called");
          const totalBits = this.bytes * 8;
          this.block[this.blockLen++] = 128;
          if (this.blockLen > 56) {
            while (this.blockLen < 64) this.block[this.blockLen++] = 0;
            this._compress(this.block, 0);
            this.blockLen = 0;
          }
          while (this.blockLen < 56) this.block[this.blockLen++] = 0;
          const hi = Math.floor(totalBits / 4294967296);
          const lo = totalBits >>> 0;
          this.block[56] = hi >>> 24 & 255;
          this.block[57] = hi >>> 16 & 255;
          this.block[58] = hi >>> 8 & 255;
          this.block[59] = hi & 255;
          this.block[60] = lo >>> 24 & 255;
          this.block[61] = lo >>> 16 & 255;
          this.block[62] = lo >>> 8 & 255;
          this.block[63] = lo & 255;
          this._compress(this.block, 0);
          this.done = true;
          const out = new Uint8Array(32);
          for (let i = 0; i < 8; i++) {
            out[i * 4] = this.h[i] >>> 24 & 255;
            out[i * 4 + 1] = this.h[i] >>> 16 & 255;
            out[i * 4 + 2] = this.h[i] >>> 8 & 255;
            out[i * 4 + 3] = this.h[i] & 255;
          }
          if (encoding === "base64") {
            let bin = "";
            for (let i = 0; i < out.length; i++) bin += String.fromCharCode(out[i]);
            return typeof btoa === "function" ? btoa(bin) : import_buffer.Buffer.from(out).toString("base64");
          }
          if (!encoding || encoding === "hex") {
            let hex = "";
            for (let i = 0; i < out.length; i++)
              hex += out[i].toString(16).padStart(2, "0");
            return hex;
          }
          throw new Error('createHash.digest: only "hex"/"base64" supported');
        }
      };
      function createHash(algorithm) {
        const a = String(algorithm).toLowerCase();
        if (a !== "sha256" && a !== "sha-256")
          throw new Error(
            "_crypto-browser: only sha256 is supported (got " + algorithm + ")"
          );
        return new Sha256();
      }
      function randomBytes(n) {
        const out = new Uint8Array(n);
        const g = typeof globalThis !== "undefined" && globalThis.crypto || typeof self !== "undefined" && self.crypto;
        if (g && typeof g.getRandomValues === "function") {
          for (let i = 0; i < n; i += 65536)
            g.getRandomValues(out.subarray(i, Math.min(i + 65536, n)));
        } else {
          for (let i = 0; i < n; i++) out[i] = Math.random() * 256 | 0;
        }
        return typeof import_buffer.Buffer !== "undefined" ? import_buffer.Buffer.from(out) : out;
      }
      module.exports = { createHash, randomBytes };
      module.exports.default = module.exports;
    }
  });

  // tools/_fs-browser.js
  var require_fs_browser = __commonJS({
    "tools/_fs-browser.js"(exports, module) {
      "use strict";
      init_shim();
      module.exports = require_lib8().fs;
    }
  });

  // node_modules/os-browserify/browser.js
  var require_browser = __commonJS({
    "node_modules/os-browserify/browser.js"(exports) {
      init_shim();
      exports.endianness = function() {
        return "LE";
      };
      exports.hostname = function() {
        if (typeof location !== "undefined") {
          return location.hostname;
        } else return "";
      };
      exports.loadavg = function() {
        return [];
      };
      exports.uptime = function() {
        return 0;
      };
      exports.freemem = function() {
        return Number.MAX_VALUE;
      };
      exports.totalmem = function() {
        return Number.MAX_VALUE;
      };
      exports.cpus = function() {
        return [];
      };
      exports.type = function() {
        return "Browser";
      };
      exports.release = function() {
        if (typeof navigator !== "undefined") {
          return navigator.appVersion;
        }
        return "";
      };
      exports.networkInterfaces = exports.getNetworkInterfaces = function() {
        return {};
      };
      exports.arch = function() {
        return "javascript";
      };
      exports.platform = function() {
        return "browser";
      };
      exports.tmpdir = exports.tmpDir = function() {
        return "/tmp";
      };
      exports.EOL = "\n";
      exports.homedir = function() {
        return "/";
      };
    }
  });

  // node_modules/pako/lib/utils/common.js
  var require_common = __commonJS({
    "node_modules/pako/lib/utils/common.js"(exports) {
      "use strict";
      init_shim();
      var TYPED_OK = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Int32Array !== "undefined";
      function _has(obj, key) {
        return Object.prototype.hasOwnProperty.call(obj, key);
      }
      exports.assign = function(obj) {
        var sources = Array.prototype.slice.call(arguments, 1);
        while (sources.length) {
          var source = sources.shift();
          if (!source) {
            continue;
          }
          if (typeof source !== "object") {
            throw new TypeError(source + "must be non-object");
          }
          for (var p in source) {
            if (_has(source, p)) {
              obj[p] = source[p];
            }
          }
        }
        return obj;
      };
      exports.shrinkBuf = function(buf, size) {
        if (buf.length === size) {
          return buf;
        }
        if (buf.subarray) {
          return buf.subarray(0, size);
        }
        buf.length = size;
        return buf;
      };
      var fnTyped = {
        arraySet: function(dest, src, src_offs, len, dest_offs) {
          if (src.subarray && dest.subarray) {
            dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
            return;
          }
          for (var i = 0; i < len; i++) {
            dest[dest_offs + i] = src[src_offs + i];
          }
        },
        // Join array of chunks to single array.
        flattenChunks: function(chunks) {
          var i, l, len, pos, chunk, result;
          len = 0;
          for (i = 0, l = chunks.length; i < l; i++) {
            len += chunks[i].length;
          }
          result = new Uint8Array(len);
          pos = 0;
          for (i = 0, l = chunks.length; i < l; i++) {
            chunk = chunks[i];
            result.set(chunk, pos);
            pos += chunk.length;
          }
          return result;
        }
      };
      var fnUntyped = {
        arraySet: function(dest, src, src_offs, len, dest_offs) {
          for (var i = 0; i < len; i++) {
            dest[dest_offs + i] = src[src_offs + i];
          }
        },
        // Join array of chunks to single array.
        flattenChunks: function(chunks) {
          return [].concat.apply([], chunks);
        }
      };
      exports.setTyped = function(on) {
        if (on) {
          exports.Buf8 = Uint8Array;
          exports.Buf16 = Uint16Array;
          exports.Buf32 = Int32Array;
          exports.assign(exports, fnTyped);
        } else {
          exports.Buf8 = Array;
          exports.Buf16 = Array;
          exports.Buf32 = Array;
          exports.assign(exports, fnUntyped);
        }
      };
      exports.setTyped(TYPED_OK);
    }
  });

  // node_modules/pako/lib/zlib/trees.js
  var require_trees = __commonJS({
    "node_modules/pako/lib/zlib/trees.js"(exports) {
      "use strict";
      init_shim();
      var utils = require_common();
      var Z_FIXED = 4;
      var Z_BINARY = 0;
      var Z_TEXT = 1;
      var Z_UNKNOWN = 2;
      function zero(buf) {
        var len = buf.length;
        while (--len >= 0) {
          buf[len] = 0;
        }
      }
      var STORED_BLOCK = 0;
      var STATIC_TREES = 1;
      var DYN_TREES = 2;
      var MIN_MATCH = 3;
      var MAX_MATCH = 258;
      var LENGTH_CODES = 29;
      var LITERALS = 256;
      var L_CODES = LITERALS + 1 + LENGTH_CODES;
      var D_CODES = 30;
      var BL_CODES = 19;
      var HEAP_SIZE = 2 * L_CODES + 1;
      var MAX_BITS = 15;
      var Buf_size = 16;
      var MAX_BL_BITS = 7;
      var END_BLOCK = 256;
      var REP_3_6 = 16;
      var REPZ_3_10 = 17;
      var REPZ_11_138 = 18;
      var extra_lbits = (
        /* extra bits for each length code */
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]
      );
      var extra_dbits = (
        /* extra bits for each distance code */
        [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]
      );
      var extra_blbits = (
        /* extra bits for each bit length code */
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7]
      );
      var bl_order = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
      var DIST_CODE_LEN = 512;
      var static_ltree = new Array((L_CODES + 2) * 2);
      zero(static_ltree);
      var static_dtree = new Array(D_CODES * 2);
      zero(static_dtree);
      var _dist_code = new Array(DIST_CODE_LEN);
      zero(_dist_code);
      var _length_code = new Array(MAX_MATCH - MIN_MATCH + 1);
      zero(_length_code);
      var base_length = new Array(LENGTH_CODES);
      zero(base_length);
      var base_dist = new Array(D_CODES);
      zero(base_dist);
      function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
        this.static_tree = static_tree;
        this.extra_bits = extra_bits;
        this.extra_base = extra_base;
        this.elems = elems;
        this.max_length = max_length;
        this.has_stree = static_tree && static_tree.length;
      }
      var static_l_desc;
      var static_d_desc;
      var static_bl_desc;
      function TreeDesc(dyn_tree, stat_desc) {
        this.dyn_tree = dyn_tree;
        this.max_code = 0;
        this.stat_desc = stat_desc;
      }
      function d_code(dist) {
        return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
      }
      function put_short(s, w) {
        s.pending_buf[s.pending++] = w & 255;
        s.pending_buf[s.pending++] = w >>> 8 & 255;
      }
      function send_bits(s, value, length) {
        if (s.bi_valid > Buf_size - length) {
          s.bi_buf |= value << s.bi_valid & 65535;
          put_short(s, s.bi_buf);
          s.bi_buf = value >> Buf_size - s.bi_valid;
          s.bi_valid += length - Buf_size;
        } else {
          s.bi_buf |= value << s.bi_valid & 65535;
          s.bi_valid += length;
        }
      }
      function send_code(s, c, tree) {
        send_bits(
          s,
          tree[c * 2],
          tree[c * 2 + 1]
          /*.Len*/
        );
      }
      function bi_reverse(code, len) {
        var res = 0;
        do {
          res |= code & 1;
          code >>>= 1;
          res <<= 1;
        } while (--len > 0);
        return res >>> 1;
      }
      function bi_flush(s) {
        if (s.bi_valid === 16) {
          put_short(s, s.bi_buf);
          s.bi_buf = 0;
          s.bi_valid = 0;
        } else if (s.bi_valid >= 8) {
          s.pending_buf[s.pending++] = s.bi_buf & 255;
          s.bi_buf >>= 8;
          s.bi_valid -= 8;
        }
      }
      function gen_bitlen(s, desc) {
        var tree = desc.dyn_tree;
        var max_code = desc.max_code;
        var stree = desc.stat_desc.static_tree;
        var has_stree = desc.stat_desc.has_stree;
        var extra = desc.stat_desc.extra_bits;
        var base = desc.stat_desc.extra_base;
        var max_length = desc.stat_desc.max_length;
        var h;
        var n, m;
        var bits;
        var xbits;
        var f;
        var overflow = 0;
        for (bits = 0; bits <= MAX_BITS; bits++) {
          s.bl_count[bits] = 0;
        }
        tree[s.heap[s.heap_max] * 2 + 1] = 0;
        for (h = s.heap_max + 1; h < HEAP_SIZE; h++) {
          n = s.heap[h];
          bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
          if (bits > max_length) {
            bits = max_length;
            overflow++;
          }
          tree[n * 2 + 1] = bits;
          if (n > max_code) {
            continue;
          }
          s.bl_count[bits]++;
          xbits = 0;
          if (n >= base) {
            xbits = extra[n - base];
          }
          f = tree[n * 2];
          s.opt_len += f * (bits + xbits);
          if (has_stree) {
            s.static_len += f * (stree[n * 2 + 1] + xbits);
          }
        }
        if (overflow === 0) {
          return;
        }
        do {
          bits = max_length - 1;
          while (s.bl_count[bits] === 0) {
            bits--;
          }
          s.bl_count[bits]--;
          s.bl_count[bits + 1] += 2;
          s.bl_count[max_length]--;
          overflow -= 2;
        } while (overflow > 0);
        for (bits = max_length; bits !== 0; bits--) {
          n = s.bl_count[bits];
          while (n !== 0) {
            m = s.heap[--h];
            if (m > max_code) {
              continue;
            }
            if (tree[m * 2 + 1] !== bits) {
              s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
              tree[m * 2 + 1] = bits;
            }
            n--;
          }
        }
      }
      function gen_codes(tree, max_code, bl_count) {
        var next_code = new Array(MAX_BITS + 1);
        var code = 0;
        var bits;
        var n;
        for (bits = 1; bits <= MAX_BITS; bits++) {
          next_code[bits] = code = code + bl_count[bits - 1] << 1;
        }
        for (n = 0; n <= max_code; n++) {
          var len = tree[n * 2 + 1];
          if (len === 0) {
            continue;
          }
          tree[n * 2] = bi_reverse(next_code[len]++, len);
        }
      }
      function tr_static_init() {
        var n;
        var bits;
        var length;
        var code;
        var dist;
        var bl_count = new Array(MAX_BITS + 1);
        length = 0;
        for (code = 0; code < LENGTH_CODES - 1; code++) {
          base_length[code] = length;
          for (n = 0; n < 1 << extra_lbits[code]; n++) {
            _length_code[length++] = code;
          }
        }
        _length_code[length - 1] = code;
        dist = 0;
        for (code = 0; code < 16; code++) {
          base_dist[code] = dist;
          for (n = 0; n < 1 << extra_dbits[code]; n++) {
            _dist_code[dist++] = code;
          }
        }
        dist >>= 7;
        for (; code < D_CODES; code++) {
          base_dist[code] = dist << 7;
          for (n = 0; n < 1 << extra_dbits[code] - 7; n++) {
            _dist_code[256 + dist++] = code;
          }
        }
        for (bits = 0; bits <= MAX_BITS; bits++) {
          bl_count[bits] = 0;
        }
        n = 0;
        while (n <= 143) {
          static_ltree[n * 2 + 1] = 8;
          n++;
          bl_count[8]++;
        }
        while (n <= 255) {
          static_ltree[n * 2 + 1] = 9;
          n++;
          bl_count[9]++;
        }
        while (n <= 279) {
          static_ltree[n * 2 + 1] = 7;
          n++;
          bl_count[7]++;
        }
        while (n <= 287) {
          static_ltree[n * 2 + 1] = 8;
          n++;
          bl_count[8]++;
        }
        gen_codes(static_ltree, L_CODES + 1, bl_count);
        for (n = 0; n < D_CODES; n++) {
          static_dtree[n * 2 + 1] = 5;
          static_dtree[n * 2] = bi_reverse(n, 5);
        }
        static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS + 1, L_CODES, MAX_BITS);
        static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES, MAX_BITS);
        static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES, MAX_BL_BITS);
      }
      function init_block(s) {
        var n;
        for (n = 0; n < L_CODES; n++) {
          s.dyn_ltree[n * 2] = 0;
        }
        for (n = 0; n < D_CODES; n++) {
          s.dyn_dtree[n * 2] = 0;
        }
        for (n = 0; n < BL_CODES; n++) {
          s.bl_tree[n * 2] = 0;
        }
        s.dyn_ltree[END_BLOCK * 2] = 1;
        s.opt_len = s.static_len = 0;
        s.last_lit = s.matches = 0;
      }
      function bi_windup(s) {
        if (s.bi_valid > 8) {
          put_short(s, s.bi_buf);
        } else if (s.bi_valid > 0) {
          s.pending_buf[s.pending++] = s.bi_buf;
        }
        s.bi_buf = 0;
        s.bi_valid = 0;
      }
      function copy_block(s, buf, len, header) {
        bi_windup(s);
        if (header) {
          put_short(s, len);
          put_short(s, ~len);
        }
        utils.arraySet(s.pending_buf, s.window, buf, len, s.pending);
        s.pending += len;
      }
      function smaller(tree, n, m, depth) {
        var _n2 = n * 2;
        var _m2 = m * 2;
        return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m];
      }
      function pqdownheap(s, tree, k) {
        var v = s.heap[k];
        var j = k << 1;
        while (j <= s.heap_len) {
          if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
            j++;
          }
          if (smaller(tree, v, s.heap[j], s.depth)) {
            break;
          }
          s.heap[k] = s.heap[j];
          k = j;
          j <<= 1;
        }
        s.heap[k] = v;
      }
      function compress_block(s, ltree, dtree) {
        var dist;
        var lc;
        var lx = 0;
        var code;
        var extra;
        if (s.last_lit !== 0) {
          do {
            dist = s.pending_buf[s.d_buf + lx * 2] << 8 | s.pending_buf[s.d_buf + lx * 2 + 1];
            lc = s.pending_buf[s.l_buf + lx];
            lx++;
            if (dist === 0) {
              send_code(s, lc, ltree);
            } else {
              code = _length_code[lc];
              send_code(s, code + LITERALS + 1, ltree);
              extra = extra_lbits[code];
              if (extra !== 0) {
                lc -= base_length[code];
                send_bits(s, lc, extra);
              }
              dist--;
              code = d_code(dist);
              send_code(s, code, dtree);
              extra = extra_dbits[code];
              if (extra !== 0) {
                dist -= base_dist[code];
                send_bits(s, dist, extra);
              }
            }
          } while (lx < s.last_lit);
        }
        send_code(s, END_BLOCK, ltree);
      }
      function build_tree(s, desc) {
        var tree = desc.dyn_tree;
        var stree = desc.stat_desc.static_tree;
        var has_stree = desc.stat_desc.has_stree;
        var elems = desc.stat_desc.elems;
        var n, m;
        var max_code = -1;
        var node;
        s.heap_len = 0;
        s.heap_max = HEAP_SIZE;
        for (n = 0; n < elems; n++) {
          if (tree[n * 2] !== 0) {
            s.heap[++s.heap_len] = max_code = n;
            s.depth[n] = 0;
          } else {
            tree[n * 2 + 1] = 0;
          }
        }
        while (s.heap_len < 2) {
          node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
          tree[node * 2] = 1;
          s.depth[node] = 0;
          s.opt_len--;
          if (has_stree) {
            s.static_len -= stree[node * 2 + 1];
          }
        }
        desc.max_code = max_code;
        for (n = s.heap_len >> 1; n >= 1; n--) {
          pqdownheap(s, tree, n);
        }
        node = elems;
        do {
          n = s.heap[
            1
            /*SMALLEST*/
          ];
          s.heap[
            1
            /*SMALLEST*/
          ] = s.heap[s.heap_len--];
          pqdownheap(
            s,
            tree,
            1
            /*SMALLEST*/
          );
          m = s.heap[
            1
            /*SMALLEST*/
          ];
          s.heap[--s.heap_max] = n;
          s.heap[--s.heap_max] = m;
          tree[node * 2] = tree[n * 2] + tree[m * 2];
          s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
          tree[n * 2 + 1] = tree[m * 2 + 1] = node;
          s.heap[
            1
            /*SMALLEST*/
          ] = node++;
          pqdownheap(
            s,
            tree,
            1
            /*SMALLEST*/
          );
        } while (s.heap_len >= 2);
        s.heap[--s.heap_max] = s.heap[
          1
          /*SMALLEST*/
        ];
        gen_bitlen(s, desc);
        gen_codes(tree, max_code, s.bl_count);
      }
      function scan_tree(s, tree, max_code) {
        var n;
        var prevlen = -1;
        var curlen;
        var nextlen = tree[0 * 2 + 1];
        var count = 0;
        var max_count = 7;
        var min_count = 4;
        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;
        }
        tree[(max_code + 1) * 2 + 1] = 65535;
        for (n = 0; n <= max_code; n++) {
          curlen = nextlen;
          nextlen = tree[(n + 1) * 2 + 1];
          if (++count < max_count && curlen === nextlen) {
            continue;
          } else if (count < min_count) {
            s.bl_tree[curlen * 2] += count;
          } else if (curlen !== 0) {
            if (curlen !== prevlen) {
              s.bl_tree[curlen * 2]++;
            }
            s.bl_tree[REP_3_6 * 2]++;
          } else if (count <= 10) {
            s.bl_tree[REPZ_3_10 * 2]++;
          } else {
            s.bl_tree[REPZ_11_138 * 2]++;
          }
          count = 0;
          prevlen = curlen;
          if (nextlen === 0) {
            max_count = 138;
            min_count = 3;
          } else if (curlen === nextlen) {
            max_count = 6;
            min_count = 3;
          } else {
            max_count = 7;
            min_count = 4;
          }
        }
      }
      function send_tree(s, tree, max_code) {
        var n;
        var prevlen = -1;
        var curlen;
        var nextlen = tree[0 * 2 + 1];
        var count = 0;
        var max_count = 7;
        var min_count = 4;
        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;
        }
        for (n = 0; n <= max_code; n++) {
          curlen = nextlen;
          nextlen = tree[(n + 1) * 2 + 1];
          if (++count < max_count && curlen === nextlen) {
            continue;
          } else if (count < min_count) {
            do {
              send_code(s, curlen, s.bl_tree);
            } while (--count !== 0);
          } else if (curlen !== 0) {
            if (curlen !== prevlen) {
              send_code(s, curlen, s.bl_tree);
              count--;
            }
            send_code(s, REP_3_6, s.bl_tree);
            send_bits(s, count - 3, 2);
          } else if (count <= 10) {
            send_code(s, REPZ_3_10, s.bl_tree);
            send_bits(s, count - 3, 3);
          } else {
            send_code(s, REPZ_11_138, s.bl_tree);
            send_bits(s, count - 11, 7);
          }
          count = 0;
          prevlen = curlen;
          if (nextlen === 0) {
            max_count = 138;
            min_count = 3;
          } else if (curlen === nextlen) {
            max_count = 6;
            min_count = 3;
          } else {
            max_count = 7;
            min_count = 4;
          }
        }
      }
      function build_bl_tree(s) {
        var max_blindex;
        scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
        scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
        build_tree(s, s.bl_desc);
        for (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--) {
          if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) {
            break;
          }
        }
        s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
        return max_blindex;
      }
      function send_all_trees(s, lcodes, dcodes, blcodes) {
        var rank;
        send_bits(s, lcodes - 257, 5);
        send_bits(s, dcodes - 1, 5);
        send_bits(s, blcodes - 4, 4);
        for (rank = 0; rank < blcodes; rank++) {
          send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1], 3);
        }
        send_tree(s, s.dyn_ltree, lcodes - 1);
        send_tree(s, s.dyn_dtree, dcodes - 1);
      }
      function detect_data_type(s) {
        var black_mask = 4093624447;
        var n;
        for (n = 0; n <= 31; n++, black_mask >>>= 1) {
          if (black_mask & 1 && s.dyn_ltree[n * 2] !== 0) {
            return Z_BINARY;
          }
        }
        if (s.dyn_ltree[9 * 2] !== 0 || s.dyn_ltree[10 * 2] !== 0 || s.dyn_ltree[13 * 2] !== 0) {
          return Z_TEXT;
        }
        for (n = 32; n < LITERALS; n++) {
          if (s.dyn_ltree[n * 2] !== 0) {
            return Z_TEXT;
          }
        }
        return Z_BINARY;
      }
      var static_init_done = false;
      function _tr_init(s) {
        if (!static_init_done) {
          tr_static_init();
          static_init_done = true;
        }
        s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
        s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
        s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
        s.bi_buf = 0;
        s.bi_valid = 0;
        init_block(s);
      }
      function _tr_stored_block(s, buf, stored_len, last) {
        send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
        copy_block(s, buf, stored_len, true);
      }
      function _tr_align(s) {
        send_bits(s, STATIC_TREES << 1, 3);
        send_code(s, END_BLOCK, static_ltree);
        bi_flush(s);
      }
      function _tr_flush_block(s, buf, stored_len, last) {
        var opt_lenb, static_lenb;
        var max_blindex = 0;
        if (s.level > 0) {
          if (s.strm.data_type === Z_UNKNOWN) {
            s.strm.data_type = detect_data_type(s);
          }
          build_tree(s, s.l_desc);
          build_tree(s, s.d_desc);
          max_blindex = build_bl_tree(s);
          opt_lenb = s.opt_len + 3 + 7 >>> 3;
          static_lenb = s.static_len + 3 + 7 >>> 3;
          if (static_lenb <= opt_lenb) {
            opt_lenb = static_lenb;
          }
        } else {
          opt_lenb = static_lenb = stored_len + 5;
        }
        if (stored_len + 4 <= opt_lenb && buf !== -1) {
          _tr_stored_block(s, buf, stored_len, last);
        } else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {
          send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
          compress_block(s, static_ltree, static_dtree);
        } else {
          send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
          send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
          compress_block(s, s.dyn_ltree, s.dyn_dtree);
        }
        init_block(s);
        if (last) {
          bi_windup(s);
        }
      }
      function _tr_tally(s, dist, lc) {
        s.pending_buf[s.d_buf + s.last_lit * 2] = dist >>> 8 & 255;
        s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 255;
        s.pending_buf[s.l_buf + s.last_lit] = lc & 255;
        s.last_lit++;
        if (dist === 0) {
          s.dyn_ltree[lc * 2]++;
        } else {
          s.matches++;
          dist--;
          s.dyn_ltree[(_length_code[lc] + LITERALS + 1) * 2]++;
          s.dyn_dtree[d_code(dist) * 2]++;
        }
        return s.last_lit === s.lit_bufsize - 1;
      }
      exports._tr_init = _tr_init;
      exports._tr_stored_block = _tr_stored_block;
      exports._tr_flush_block = _tr_flush_block;
      exports._tr_tally = _tr_tally;
      exports._tr_align = _tr_align;
    }
  });

  // node_modules/pako/lib/zlib/adler32.js
  var require_adler32 = __commonJS({
    "node_modules/pako/lib/zlib/adler32.js"(exports, module) {
      "use strict";
      init_shim();
      function adler32(adler, buf, len, pos) {
        var s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
        while (len !== 0) {
          n = len > 2e3 ? 2e3 : len;
          len -= n;
          do {
            s1 = s1 + buf[pos++] | 0;
            s2 = s2 + s1 | 0;
          } while (--n);
          s1 %= 65521;
          s2 %= 65521;
        }
        return s1 | s2 << 16 | 0;
      }
      module.exports = adler32;
    }
  });

  // node_modules/pako/lib/zlib/crc32.js
  var require_crc32 = __commonJS({
    "node_modules/pako/lib/zlib/crc32.js"(exports, module) {
      "use strict";
      init_shim();
      function makeTable() {
        var c, table = [];
        for (var n = 0; n < 256; n++) {
          c = n;
          for (var k = 0; k < 8; k++) {
            c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
          }
          table[n] = c;
        }
        return table;
      }
      var crcTable = makeTable();
      function crc32(crc, buf, len, pos) {
        var t = crcTable, end = pos + len;
        crc ^= -1;
        for (var i = pos; i < end; i++) {
          crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
        }
        return crc ^ -1;
      }
      module.exports = crc32;
    }
  });

  // node_modules/pako/lib/zlib/messages.js
  var require_messages = __commonJS({
    "node_modules/pako/lib/zlib/messages.js"(exports, module) {
      "use strict";
      init_shim();
      module.exports = {
        2: "need dictionary",
        /* Z_NEED_DICT       2  */
        1: "stream end",
        /* Z_STREAM_END      1  */
        0: "",
        /* Z_OK              0  */
        "-1": "file error",
        /* Z_ERRNO         (-1) */
        "-2": "stream error",
        /* Z_STREAM_ERROR  (-2) */
        "-3": "data error",
        /* Z_DATA_ERROR    (-3) */
        "-4": "insufficient memory",
        /* Z_MEM_ERROR     (-4) */
        "-5": "buffer error",
        /* Z_BUF_ERROR     (-5) */
        "-6": "incompatible version"
        /* Z_VERSION_ERROR (-6) */
      };
    }
  });

  // node_modules/pako/lib/zlib/deflate.js
  var require_deflate = __commonJS({
    "node_modules/pako/lib/zlib/deflate.js"(exports) {
      "use strict";
      init_shim();
      var utils = require_common();
      var trees = require_trees();
      var adler32 = require_adler32();
      var crc32 = require_crc32();
      var msg = require_messages();
      var Z_NO_FLUSH = 0;
      var Z_PARTIAL_FLUSH = 1;
      var Z_FULL_FLUSH = 3;
      var Z_FINISH = 4;
      var Z_BLOCK = 5;
      var Z_OK = 0;
      var Z_STREAM_END = 1;
      var Z_STREAM_ERROR = -2;
      var Z_DATA_ERROR = -3;
      var Z_BUF_ERROR = -5;
      var Z_DEFAULT_COMPRESSION = -1;
      var Z_FILTERED = 1;
      var Z_HUFFMAN_ONLY = 2;
      var Z_RLE = 3;
      var Z_FIXED = 4;
      var Z_DEFAULT_STRATEGY = 0;
      var Z_UNKNOWN = 2;
      var Z_DEFLATED = 8;
      var MAX_MEM_LEVEL = 9;
      var MAX_WBITS = 15;
      var DEF_MEM_LEVEL = 8;
      var LENGTH_CODES = 29;
      var LITERALS = 256;
      var L_CODES = LITERALS + 1 + LENGTH_CODES;
      var D_CODES = 30;
      var BL_CODES = 19;
      var HEAP_SIZE = 2 * L_CODES + 1;
      var MAX_BITS = 15;
      var MIN_MATCH = 3;
      var MAX_MATCH = 258;
      var MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
      var PRESET_DICT = 32;
      var INIT_STATE = 42;
      var EXTRA_STATE = 69;
      var NAME_STATE = 73;
      var COMMENT_STATE = 91;
      var HCRC_STATE = 103;
      var BUSY_STATE = 113;
      var FINISH_STATE = 666;
      var BS_NEED_MORE = 1;
      var BS_BLOCK_DONE = 2;
      var BS_FINISH_STARTED = 3;
      var BS_FINISH_DONE = 4;
      var OS_CODE = 3;
      function err(strm, errorCode) {
        strm.msg = msg[errorCode];
        return errorCode;
      }
      function rank(f) {
        return (f << 1) - (f > 4 ? 9 : 0);
      }
      function zero(buf) {
        var len = buf.length;
        while (--len >= 0) {
          buf[len] = 0;
        }
      }
      function flush_pending(strm) {
        var s = strm.state;
        var len = s.pending;
        if (len > strm.avail_out) {
          len = strm.avail_out;
        }
        if (len === 0) {
          return;
        }
        utils.arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
        strm.next_out += len;
        s.pending_out += len;
        strm.total_out += len;
        strm.avail_out -= len;
        s.pending -= len;
        if (s.pending === 0) {
          s.pending_out = 0;
        }
      }
      function flush_block_only(s, last) {
        trees._tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
        s.block_start = s.strstart;
        flush_pending(s.strm);
      }
      function put_byte(s, b) {
        s.pending_buf[s.pending++] = b;
      }
      function putShortMSB(s, b) {
        s.pending_buf[s.pending++] = b >>> 8 & 255;
        s.pending_buf[s.pending++] = b & 255;
      }
      function read_buf(strm, buf, start, size) {
        var len = strm.avail_in;
        if (len > size) {
          len = size;
        }
        if (len === 0) {
          return 0;
        }
        strm.avail_in -= len;
        utils.arraySet(buf, strm.input, strm.next_in, len, start);
        if (strm.state.wrap === 1) {
          strm.adler = adler32(strm.adler, buf, len, start);
        } else if (strm.state.wrap === 2) {
          strm.adler = crc32(strm.adler, buf, len, start);
        }
        strm.next_in += len;
        strm.total_in += len;
        return len;
      }
      function longest_match(s, cur_match) {
        var chain_length = s.max_chain_length;
        var scan = s.strstart;
        var match;
        var len;
        var best_len = s.prev_length;
        var nice_match = s.nice_match;
        var limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;
        var _win = s.window;
        var wmask = s.w_mask;
        var prev = s.prev;
        var strend = s.strstart + MAX_MATCH;
        var scan_end1 = _win[scan + best_len - 1];
        var scan_end = _win[scan + best_len];
        if (s.prev_length >= s.good_match) {
          chain_length >>= 2;
        }
        if (nice_match > s.lookahead) {
          nice_match = s.lookahead;
        }
        do {
          match = cur_match;
          if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) {
            continue;
          }
          scan += 2;
          match++;
          do {
          } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
          len = MAX_MATCH - (strend - scan);
          scan = strend - MAX_MATCH;
          if (len > best_len) {
            s.match_start = cur_match;
            best_len = len;
            if (len >= nice_match) {
              break;
            }
            scan_end1 = _win[scan + best_len - 1];
            scan_end = _win[scan + best_len];
          }
        } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
        if (best_len <= s.lookahead) {
          return best_len;
        }
        return s.lookahead;
      }
      function fill_window(s) {
        var _w_size = s.w_size;
        var p, n, m, more, str;
        do {
          more = s.window_size - s.lookahead - s.strstart;
          if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
            utils.arraySet(s.window, s.window, _w_size, _w_size, 0);
            s.match_start -= _w_size;
            s.strstart -= _w_size;
            s.block_start -= _w_size;
            n = s.hash_size;
            p = n;
            do {
              m = s.head[--p];
              s.head[p] = m >= _w_size ? m - _w_size : 0;
            } while (--n);
            n = _w_size;
            p = n;
            do {
              m = s.prev[--p];
              s.prev[p] = m >= _w_size ? m - _w_size : 0;
            } while (--n);
            more += _w_size;
          }
          if (s.strm.avail_in === 0) {
            break;
          }
          n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
          s.lookahead += n;
          if (s.lookahead + s.insert >= MIN_MATCH) {
            str = s.strstart - s.insert;
            s.ins_h = s.window[str];
            s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + 1]) & s.hash_mask;
            while (s.insert) {
              s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;
              s.prev[str & s.w_mask] = s.head[s.ins_h];
              s.head[s.ins_h] = str;
              str++;
              s.insert--;
              if (s.lookahead + s.insert < MIN_MATCH) {
                break;
              }
            }
          }
        } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
      }
      function deflate_stored(s, flush) {
        var max_block_size = 65535;
        if (max_block_size > s.pending_buf_size - 5) {
          max_block_size = s.pending_buf_size - 5;
        }
        for (; ; ) {
          if (s.lookahead <= 1) {
            fill_window(s);
            if (s.lookahead === 0 && flush === Z_NO_FLUSH) {
              return BS_NEED_MORE;
            }
            if (s.lookahead === 0) {
              break;
            }
          }
          s.strstart += s.lookahead;
          s.lookahead = 0;
          var max_start = s.block_start + max_block_size;
          if (s.strstart === 0 || s.strstart >= max_start) {
            s.lookahead = s.strstart - max_start;
            s.strstart = max_start;
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
          if (s.strstart - s.block_start >= s.w_size - MIN_LOOKAHEAD) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
        }
        s.insert = 0;
        if (flush === Z_FINISH) {
          flush_block_only(s, true);
          if (s.strm.avail_out === 0) {
            return BS_FINISH_STARTED;
          }
          return BS_FINISH_DONE;
        }
        if (s.strstart > s.block_start) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
        return BS_NEED_MORE;
      }
      function deflate_fast(s, flush) {
        var hash_head;
        var bflush;
        for (; ; ) {
          if (s.lookahead < MIN_LOOKAHEAD) {
            fill_window(s);
            if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
              return BS_NEED_MORE;
            }
            if (s.lookahead === 0) {
              break;
            }
          }
          hash_head = 0;
          if (s.lookahead >= MIN_MATCH) {
            s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
            hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = s.strstart;
          }
          if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
            s.match_length = longest_match(s, hash_head);
          }
          if (s.match_length >= MIN_MATCH) {
            bflush = trees._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
            s.lookahead -= s.match_length;
            if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
              s.match_length--;
              do {
                s.strstart++;
                s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
                hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                s.head[s.ins_h] = s.strstart;
              } while (--s.match_length !== 0);
              s.strstart++;
            } else {
              s.strstart += s.match_length;
              s.match_length = 0;
              s.ins_h = s.window[s.strstart];
              s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + 1]) & s.hash_mask;
            }
          } else {
            bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
            s.lookahead--;
            s.strstart++;
          }
          if (bflush) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
        }
        s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
        if (flush === Z_FINISH) {
          flush_block_only(s, true);
          if (s.strm.avail_out === 0) {
            return BS_FINISH_STARTED;
          }
          return BS_FINISH_DONE;
        }
        if (s.last_lit) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
        return BS_BLOCK_DONE;
      }
      function deflate_slow(s, flush) {
        var hash_head;
        var bflush;
        var max_insert;
        for (; ; ) {
          if (s.lookahead < MIN_LOOKAHEAD) {
            fill_window(s);
            if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
              return BS_NEED_MORE;
            }
            if (s.lookahead === 0) {
              break;
            }
          }
          hash_head = 0;
          if (s.lookahead >= MIN_MATCH) {
            s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
            hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = s.strstart;
          }
          s.prev_length = s.match_length;
          s.prev_match = s.match_start;
          s.match_length = MIN_MATCH - 1;
          if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
            s.match_length = longest_match(s, hash_head);
            if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096)) {
              s.match_length = MIN_MATCH - 1;
            }
          }
          if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
            max_insert = s.strstart + s.lookahead - MIN_MATCH;
            bflush = trees._tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
            s.lookahead -= s.prev_length - 1;
            s.prev_length -= 2;
            do {
              if (++s.strstart <= max_insert) {
                s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
                hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                s.head[s.ins_h] = s.strstart;
              }
            } while (--s.prev_length !== 0);
            s.match_available = 0;
            s.match_length = MIN_MATCH - 1;
            s.strstart++;
            if (bflush) {
              flush_block_only(s, false);
              if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
              }
            }
          } else if (s.match_available) {
            bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);
            if (bflush) {
              flush_block_only(s, false);
            }
            s.strstart++;
            s.lookahead--;
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          } else {
            s.match_available = 1;
            s.strstart++;
            s.lookahead--;
          }
        }
        if (s.match_available) {
          bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);
          s.match_available = 0;
        }
        s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
        if (flush === Z_FINISH) {
          flush_block_only(s, true);
          if (s.strm.avail_out === 0) {
            return BS_FINISH_STARTED;
          }
          return BS_FINISH_DONE;
        }
        if (s.last_lit) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
        return BS_BLOCK_DONE;
      }
      function deflate_rle(s, flush) {
        var bflush;
        var prev;
        var scan, strend;
        var _win = s.window;
        for (; ; ) {
          if (s.lookahead <= MAX_MATCH) {
            fill_window(s);
            if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) {
              return BS_NEED_MORE;
            }
            if (s.lookahead === 0) {
              break;
            }
          }
          s.match_length = 0;
          if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
            scan = s.strstart - 1;
            prev = _win[scan];
            if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
              strend = s.strstart + MAX_MATCH;
              do {
              } while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
              s.match_length = MAX_MATCH - (strend - scan);
              if (s.match_length > s.lookahead) {
                s.match_length = s.lookahead;
              }
            }
          }
          if (s.match_length >= MIN_MATCH) {
            bflush = trees._tr_tally(s, 1, s.match_length - MIN_MATCH);
            s.lookahead -= s.match_length;
            s.strstart += s.match_length;
            s.match_length = 0;
          } else {
            bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
            s.lookahead--;
            s.strstart++;
          }
          if (bflush) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
        }
        s.insert = 0;
        if (flush === Z_FINISH) {
          flush_block_only(s, true);
          if (s.strm.avail_out === 0) {
            return BS_FINISH_STARTED;
          }
          return BS_FINISH_DONE;
        }
        if (s.last_lit) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
        return BS_BLOCK_DONE;
      }
      function deflate_huff(s, flush) {
        var bflush;
        for (; ; ) {
          if (s.lookahead === 0) {
            fill_window(s);
            if (s.lookahead === 0) {
              if (flush === Z_NO_FLUSH) {
                return BS_NEED_MORE;
              }
              break;
            }
          }
          s.match_length = 0;
          bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
          s.lookahead--;
          s.strstart++;
          if (bflush) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
        }
        s.insert = 0;
        if (flush === Z_FINISH) {
          flush_block_only(s, true);
          if (s.strm.avail_out === 0) {
            return BS_FINISH_STARTED;
          }
          return BS_FINISH_DONE;
        }
        if (s.last_lit) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
        return BS_BLOCK_DONE;
      }
      function Config(good_length, max_lazy, nice_length, max_chain, func) {
        this.good_length = good_length;
        this.max_lazy = max_lazy;
        this.nice_length = nice_length;
        this.max_chain = max_chain;
        this.func = func;
      }
      var configuration_table;
      configuration_table = [
        /*      good lazy nice chain */
        new Config(0, 0, 0, 0, deflate_stored),
        /* 0 store only */
        new Config(4, 4, 8, 4, deflate_fast),
        /* 1 max speed, no lazy matches */
        new Config(4, 5, 16, 8, deflate_fast),
        /* 2 */
        new Config(4, 6, 32, 32, deflate_fast),
        /* 3 */
        new Config(4, 4, 16, 16, deflate_slow),
        /* 4 lazy matches */
        new Config(8, 16, 32, 32, deflate_slow),
        /* 5 */
        new Config(8, 16, 128, 128, deflate_slow),
        /* 6 */
        new Config(8, 32, 128, 256, deflate_slow),
        /* 7 */
        new Config(32, 128, 258, 1024, deflate_slow),
        /* 8 */
        new Config(32, 258, 258, 4096, deflate_slow)
        /* 9 max compression */
      ];
      function lm_init(s) {
        s.window_size = 2 * s.w_size;
        zero(s.head);
        s.max_lazy_match = configuration_table[s.level].max_lazy;
        s.good_match = configuration_table[s.level].good_length;
        s.nice_match = configuration_table[s.level].nice_length;
        s.max_chain_length = configuration_table[s.level].max_chain;
        s.strstart = 0;
        s.block_start = 0;
        s.lookahead = 0;
        s.insert = 0;
        s.match_length = s.prev_length = MIN_MATCH - 1;
        s.match_available = 0;
        s.ins_h = 0;
      }
      function DeflateState() {
        this.strm = null;
        this.status = 0;
        this.pending_buf = null;
        this.pending_buf_size = 0;
        this.pending_out = 0;
        this.pending = 0;
        this.wrap = 0;
        this.gzhead = null;
        this.gzindex = 0;
        this.method = Z_DEFLATED;
        this.last_flush = -1;
        this.w_size = 0;
        this.w_bits = 0;
        this.w_mask = 0;
        this.window = null;
        this.window_size = 0;
        this.prev = null;
        this.head = null;
        this.ins_h = 0;
        this.hash_size = 0;
        this.hash_bits = 0;
        this.hash_mask = 0;
        this.hash_shift = 0;
        this.block_start = 0;
        this.match_length = 0;
        this.prev_match = 0;
        this.match_available = 0;
        this.strstart = 0;
        this.match_start = 0;
        this.lookahead = 0;
        this.prev_length = 0;
        this.max_chain_length = 0;
        this.max_lazy_match = 0;
        this.level = 0;
        this.strategy = 0;
        this.good_match = 0;
        this.nice_match = 0;
        this.dyn_ltree = new utils.Buf16(HEAP_SIZE * 2);
        this.dyn_dtree = new utils.Buf16((2 * D_CODES + 1) * 2);
        this.bl_tree = new utils.Buf16((2 * BL_CODES + 1) * 2);
        zero(this.dyn_ltree);
        zero(this.dyn_dtree);
        zero(this.bl_tree);
        this.l_desc = null;
        this.d_desc = null;
        this.bl_desc = null;
        this.bl_count = new utils.Buf16(MAX_BITS + 1);
        this.heap = new utils.Buf16(2 * L_CODES + 1);
        zero(this.heap);
        this.heap_len = 0;
        this.heap_max = 0;
        this.depth = new utils.Buf16(2 * L_CODES + 1);
        zero(this.depth);
        this.l_buf = 0;
        this.lit_bufsize = 0;
        this.last_lit = 0;
        this.d_buf = 0;
        this.opt_len = 0;
        this.static_len = 0;
        this.matches = 0;
        this.insert = 0;
        this.bi_buf = 0;
        this.bi_valid = 0;
      }
      function deflateResetKeep(strm) {
        var s;
        if (!strm || !strm.state) {
          return err(strm, Z_STREAM_ERROR);
        }
        strm.total_in = strm.total_out = 0;
        strm.data_type = Z_UNKNOWN;
        s = strm.state;
        s.pending = 0;
        s.pending_out = 0;
        if (s.wrap < 0) {
          s.wrap = -s.wrap;
        }
        s.status = s.wrap ? INIT_STATE : BUSY_STATE;
        strm.adler = s.wrap === 2 ? 0 : 1;
        s.last_flush = Z_NO_FLUSH;
        trees._tr_init(s);
        return Z_OK;
      }
      function deflateReset(strm) {
        var ret = deflateResetKeep(strm);
        if (ret === Z_OK) {
          lm_init(strm.state);
        }
        return ret;
      }
      function deflateSetHeader(strm, head) {
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        if (strm.state.wrap !== 2) {
          return Z_STREAM_ERROR;
        }
        strm.state.gzhead = head;
        return Z_OK;
      }
      function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
        if (!strm) {
          return Z_STREAM_ERROR;
        }
        var wrap = 1;
        if (level === Z_DEFAULT_COMPRESSION) {
          level = 6;
        }
        if (windowBits < 0) {
          wrap = 0;
          windowBits = -windowBits;
        } else if (windowBits > 15) {
          wrap = 2;
          windowBits -= 16;
        }
        if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED) {
          return err(strm, Z_STREAM_ERROR);
        }
        if (windowBits === 8) {
          windowBits = 9;
        }
        var s = new DeflateState();
        strm.state = s;
        s.strm = strm;
        s.wrap = wrap;
        s.gzhead = null;
        s.w_bits = windowBits;
        s.w_size = 1 << s.w_bits;
        s.w_mask = s.w_size - 1;
        s.hash_bits = memLevel + 7;
        s.hash_size = 1 << s.hash_bits;
        s.hash_mask = s.hash_size - 1;
        s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
        s.window = new utils.Buf8(s.w_size * 2);
        s.head = new utils.Buf16(s.hash_size);
        s.prev = new utils.Buf16(s.w_size);
        s.lit_bufsize = 1 << memLevel + 6;
        s.pending_buf_size = s.lit_bufsize * 4;
        s.pending_buf = new utils.Buf8(s.pending_buf_size);
        s.d_buf = 1 * s.lit_bufsize;
        s.l_buf = (1 + 2) * s.lit_bufsize;
        s.level = level;
        s.strategy = strategy;
        s.method = method;
        return deflateReset(strm);
      }
      function deflateInit(strm, level) {
        return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
      }
      function deflate(strm, flush) {
        var old_flush, s;
        var beg, val;
        if (!strm || !strm.state || flush > Z_BLOCK || flush < 0) {
          return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
        }
        s = strm.state;
        if (!strm.output || !strm.input && strm.avail_in !== 0 || s.status === FINISH_STATE && flush !== Z_FINISH) {
          return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR : Z_STREAM_ERROR);
        }
        s.strm = strm;
        old_flush = s.last_flush;
        s.last_flush = flush;
        if (s.status === INIT_STATE) {
          if (s.wrap === 2) {
            strm.adler = 0;
            put_byte(s, 31);
            put_byte(s, 139);
            put_byte(s, 8);
            if (!s.gzhead) {
              put_byte(s, 0);
              put_byte(s, 0);
              put_byte(s, 0);
              put_byte(s, 0);
              put_byte(s, 0);
              put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
              put_byte(s, OS_CODE);
              s.status = BUSY_STATE;
            } else {
              put_byte(
                s,
                (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16)
              );
              put_byte(s, s.gzhead.time & 255);
              put_byte(s, s.gzhead.time >> 8 & 255);
              put_byte(s, s.gzhead.time >> 16 & 255);
              put_byte(s, s.gzhead.time >> 24 & 255);
              put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
              put_byte(s, s.gzhead.os & 255);
              if (s.gzhead.extra && s.gzhead.extra.length) {
                put_byte(s, s.gzhead.extra.length & 255);
                put_byte(s, s.gzhead.extra.length >> 8 & 255);
              }
              if (s.gzhead.hcrc) {
                strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
              }
              s.gzindex = 0;
              s.status = EXTRA_STATE;
            }
          } else {
            var header = Z_DEFLATED + (s.w_bits - 8 << 4) << 8;
            var level_flags = -1;
            if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
              level_flags = 0;
            } else if (s.level < 6) {
              level_flags = 1;
            } else if (s.level === 6) {
              level_flags = 2;
            } else {
              level_flags = 3;
            }
            header |= level_flags << 6;
            if (s.strstart !== 0) {
              header |= PRESET_DICT;
            }
            header += 31 - header % 31;
            s.status = BUSY_STATE;
            putShortMSB(s, header);
            if (s.strstart !== 0) {
              putShortMSB(s, strm.adler >>> 16);
              putShortMSB(s, strm.adler & 65535);
            }
            strm.adler = 1;
          }
        }
        if (s.status === EXTRA_STATE) {
          if (s.gzhead.extra) {
            beg = s.pending;
            while (s.gzindex < (s.gzhead.extra.length & 65535)) {
              if (s.pending === s.pending_buf_size) {
                if (s.gzhead.hcrc && s.pending > beg) {
                  strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                }
                flush_pending(strm);
                beg = s.pending;
                if (s.pending === s.pending_buf_size) {
                  break;
                }
              }
              put_byte(s, s.gzhead.extra[s.gzindex] & 255);
              s.gzindex++;
            }
            if (s.gzhead.hcrc && s.pending > beg) {
              strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
            }
            if (s.gzindex === s.gzhead.extra.length) {
              s.gzindex = 0;
              s.status = NAME_STATE;
            }
          } else {
            s.status = NAME_STATE;
          }
        }
        if (s.status === NAME_STATE) {
          if (s.gzhead.name) {
            beg = s.pending;
            do {
              if (s.pending === s.pending_buf_size) {
                if (s.gzhead.hcrc && s.pending > beg) {
                  strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                }
                flush_pending(strm);
                beg = s.pending;
                if (s.pending === s.pending_buf_size) {
                  val = 1;
                  break;
                }
              }
              if (s.gzindex < s.gzhead.name.length) {
                val = s.gzhead.name.charCodeAt(s.gzindex++) & 255;
              } else {
                val = 0;
              }
              put_byte(s, val);
            } while (val !== 0);
            if (s.gzhead.hcrc && s.pending > beg) {
              strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
            }
            if (val === 0) {
              s.gzindex = 0;
              s.status = COMMENT_STATE;
            }
          } else {
            s.status = COMMENT_STATE;
          }
        }
        if (s.status === COMMENT_STATE) {
          if (s.gzhead.comment) {
            beg = s.pending;
            do {
              if (s.pending === s.pending_buf_size) {
                if (s.gzhead.hcrc && s.pending > beg) {
                  strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                }
                flush_pending(strm);
                beg = s.pending;
                if (s.pending === s.pending_buf_size) {
                  val = 1;
                  break;
                }
              }
              if (s.gzindex < s.gzhead.comment.length) {
                val = s.gzhead.comment.charCodeAt(s.gzindex++) & 255;
              } else {
                val = 0;
              }
              put_byte(s, val);
            } while (val !== 0);
            if (s.gzhead.hcrc && s.pending > beg) {
              strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
            }
            if (val === 0) {
              s.status = HCRC_STATE;
            }
          } else {
            s.status = HCRC_STATE;
          }
        }
        if (s.status === HCRC_STATE) {
          if (s.gzhead.hcrc) {
            if (s.pending + 2 > s.pending_buf_size) {
              flush_pending(strm);
            }
            if (s.pending + 2 <= s.pending_buf_size) {
              put_byte(s, strm.adler & 255);
              put_byte(s, strm.adler >> 8 & 255);
              strm.adler = 0;
              s.status = BUSY_STATE;
            }
          } else {
            s.status = BUSY_STATE;
          }
        }
        if (s.pending !== 0) {
          flush_pending(strm);
          if (strm.avail_out === 0) {
            s.last_flush = -1;
            return Z_OK;
          }
        } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH) {
          return err(strm, Z_BUF_ERROR);
        }
        if (s.status === FINISH_STATE && strm.avail_in !== 0) {
          return err(strm, Z_BUF_ERROR);
        }
        if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH && s.status !== FINISH_STATE) {
          var bstate = s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);
          if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
            s.status = FINISH_STATE;
          }
          if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
            if (strm.avail_out === 0) {
              s.last_flush = -1;
            }
            return Z_OK;
          }
          if (bstate === BS_BLOCK_DONE) {
            if (flush === Z_PARTIAL_FLUSH) {
              trees._tr_align(s);
            } else if (flush !== Z_BLOCK) {
              trees._tr_stored_block(s, 0, 0, false);
              if (flush === Z_FULL_FLUSH) {
                zero(s.head);
                if (s.lookahead === 0) {
                  s.strstart = 0;
                  s.block_start = 0;
                  s.insert = 0;
                }
              }
            }
            flush_pending(strm);
            if (strm.avail_out === 0) {
              s.last_flush = -1;
              return Z_OK;
            }
          }
        }
        if (flush !== Z_FINISH) {
          return Z_OK;
        }
        if (s.wrap <= 0) {
          return Z_STREAM_END;
        }
        if (s.wrap === 2) {
          put_byte(s, strm.adler & 255);
          put_byte(s, strm.adler >> 8 & 255);
          put_byte(s, strm.adler >> 16 & 255);
          put_byte(s, strm.adler >> 24 & 255);
          put_byte(s, strm.total_in & 255);
          put_byte(s, strm.total_in >> 8 & 255);
          put_byte(s, strm.total_in >> 16 & 255);
          put_byte(s, strm.total_in >> 24 & 255);
        } else {
          putShortMSB(s, strm.adler >>> 16);
          putShortMSB(s, strm.adler & 65535);
        }
        flush_pending(strm);
        if (s.wrap > 0) {
          s.wrap = -s.wrap;
        }
        return s.pending !== 0 ? Z_OK : Z_STREAM_END;
      }
      function deflateEnd(strm) {
        var status;
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        status = strm.state.status;
        if (status !== INIT_STATE && status !== EXTRA_STATE && status !== NAME_STATE && status !== COMMENT_STATE && status !== HCRC_STATE && status !== BUSY_STATE && status !== FINISH_STATE) {
          return err(strm, Z_STREAM_ERROR);
        }
        strm.state = null;
        return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
      }
      function deflateSetDictionary(strm, dictionary) {
        var dictLength = dictionary.length;
        var s;
        var str, n;
        var wrap;
        var avail;
        var next;
        var input;
        var tmpDict;
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        s = strm.state;
        wrap = s.wrap;
        if (wrap === 2 || wrap === 1 && s.status !== INIT_STATE || s.lookahead) {
          return Z_STREAM_ERROR;
        }
        if (wrap === 1) {
          strm.adler = adler32(strm.adler, dictionary, dictLength, 0);
        }
        s.wrap = 0;
        if (dictLength >= s.w_size) {
          if (wrap === 0) {
            zero(s.head);
            s.strstart = 0;
            s.block_start = 0;
            s.insert = 0;
          }
          tmpDict = new utils.Buf8(s.w_size);
          utils.arraySet(tmpDict, dictionary, dictLength - s.w_size, s.w_size, 0);
          dictionary = tmpDict;
          dictLength = s.w_size;
        }
        avail = strm.avail_in;
        next = strm.next_in;
        input = strm.input;
        strm.avail_in = dictLength;
        strm.next_in = 0;
        strm.input = dictionary;
        fill_window(s);
        while (s.lookahead >= MIN_MATCH) {
          str = s.strstart;
          n = s.lookahead - (MIN_MATCH - 1);
          do {
            s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;
            s.prev[str & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = str;
            str++;
          } while (--n);
          s.strstart = str;
          s.lookahead = MIN_MATCH - 1;
          fill_window(s);
        }
        s.strstart += s.lookahead;
        s.block_start = s.strstart;
        s.insert = s.lookahead;
        s.lookahead = 0;
        s.match_length = s.prev_length = MIN_MATCH - 1;
        s.match_available = 0;
        strm.next_in = next;
        strm.input = input;
        strm.avail_in = avail;
        s.wrap = wrap;
        return Z_OK;
      }
      exports.deflateInit = deflateInit;
      exports.deflateInit2 = deflateInit2;
      exports.deflateReset = deflateReset;
      exports.deflateResetKeep = deflateResetKeep;
      exports.deflateSetHeader = deflateSetHeader;
      exports.deflate = deflate;
      exports.deflateEnd = deflateEnd;
      exports.deflateSetDictionary = deflateSetDictionary;
      exports.deflateInfo = "pako deflate (from Nodeca project)";
    }
  });

  // node_modules/pako/lib/utils/strings.js
  var require_strings = __commonJS({
    "node_modules/pako/lib/utils/strings.js"(exports) {
      "use strict";
      init_shim();
      var utils = require_common();
      var STR_APPLY_OK = true;
      var STR_APPLY_UIA_OK = true;
      try {
        String.fromCharCode.apply(null, [0]);
      } catch (__) {
        STR_APPLY_OK = false;
      }
      try {
        String.fromCharCode.apply(null, new Uint8Array(1));
      } catch (__) {
        STR_APPLY_UIA_OK = false;
      }
      var _utf8len = new utils.Buf8(256);
      for (q = 0; q < 256; q++) {
        _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
      }
      var q;
      _utf8len[254] = _utf8len[254] = 1;
      exports.string2buf = function(str) {
        var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
        for (m_pos = 0; m_pos < str_len; m_pos++) {
          c = str.charCodeAt(m_pos);
          if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
            c2 = str.charCodeAt(m_pos + 1);
            if ((c2 & 64512) === 56320) {
              c = 65536 + (c - 55296 << 10) + (c2 - 56320);
              m_pos++;
            }
          }
          buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
        }
        buf = new utils.Buf8(buf_len);
        for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
          c = str.charCodeAt(m_pos);
          if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
            c2 = str.charCodeAt(m_pos + 1);
            if ((c2 & 64512) === 56320) {
              c = 65536 + (c - 55296 << 10) + (c2 - 56320);
              m_pos++;
            }
          }
          if (c < 128) {
            buf[i++] = c;
          } else if (c < 2048) {
            buf[i++] = 192 | c >>> 6;
            buf[i++] = 128 | c & 63;
          } else if (c < 65536) {
            buf[i++] = 224 | c >>> 12;
            buf[i++] = 128 | c >>> 6 & 63;
            buf[i++] = 128 | c & 63;
          } else {
            buf[i++] = 240 | c >>> 18;
            buf[i++] = 128 | c >>> 12 & 63;
            buf[i++] = 128 | c >>> 6 & 63;
            buf[i++] = 128 | c & 63;
          }
        }
        return buf;
      };
      function buf2binstring(buf, len) {
        if (len < 65534) {
          if (buf.subarray && STR_APPLY_UIA_OK || !buf.subarray && STR_APPLY_OK) {
            return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
          }
        }
        var result = "";
        for (var i = 0; i < len; i++) {
          result += String.fromCharCode(buf[i]);
        }
        return result;
      }
      exports.buf2binstring = function(buf) {
        return buf2binstring(buf, buf.length);
      };
      exports.binstring2buf = function(str) {
        var buf = new utils.Buf8(str.length);
        for (var i = 0, len = buf.length; i < len; i++) {
          buf[i] = str.charCodeAt(i);
        }
        return buf;
      };
      exports.buf2string = function(buf, max) {
        var i, out, c, c_len;
        var len = max || buf.length;
        var utf16buf = new Array(len * 2);
        for (out = 0, i = 0; i < len; ) {
          c = buf[i++];
          if (c < 128) {
            utf16buf[out++] = c;
            continue;
          }
          c_len = _utf8len[c];
          if (c_len > 4) {
            utf16buf[out++] = 65533;
            i += c_len - 1;
            continue;
          }
          c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
          while (c_len > 1 && i < len) {
            c = c << 6 | buf[i++] & 63;
            c_len--;
          }
          if (c_len > 1) {
            utf16buf[out++] = 65533;
            continue;
          }
          if (c < 65536) {
            utf16buf[out++] = c;
          } else {
            c -= 65536;
            utf16buf[out++] = 55296 | c >> 10 & 1023;
            utf16buf[out++] = 56320 | c & 1023;
          }
        }
        return buf2binstring(utf16buf, out);
      };
      exports.utf8border = function(buf, max) {
        var pos;
        max = max || buf.length;
        if (max > buf.length) {
          max = buf.length;
        }
        pos = max - 1;
        while (pos >= 0 && (buf[pos] & 192) === 128) {
          pos--;
        }
        if (pos < 0) {
          return max;
        }
        if (pos === 0) {
          return max;
        }
        return pos + _utf8len[buf[pos]] > max ? pos : max;
      };
    }
  });

  // node_modules/pako/lib/zlib/zstream.js
  var require_zstream = __commonJS({
    "node_modules/pako/lib/zlib/zstream.js"(exports, module) {
      "use strict";
      init_shim();
      function ZStream() {
        this.input = null;
        this.next_in = 0;
        this.avail_in = 0;
        this.total_in = 0;
        this.output = null;
        this.next_out = 0;
        this.avail_out = 0;
        this.total_out = 0;
        this.msg = "";
        this.state = null;
        this.data_type = 2;
        this.adler = 0;
      }
      module.exports = ZStream;
    }
  });

  // node_modules/pako/lib/deflate.js
  var require_deflate2 = __commonJS({
    "node_modules/pako/lib/deflate.js"(exports) {
      "use strict";
      init_shim();
      var zlib_deflate = require_deflate();
      var utils = require_common();
      var strings = require_strings();
      var msg = require_messages();
      var ZStream = require_zstream();
      var toString = Object.prototype.toString;
      var Z_NO_FLUSH = 0;
      var Z_FINISH = 4;
      var Z_OK = 0;
      var Z_STREAM_END = 1;
      var Z_SYNC_FLUSH = 2;
      var Z_DEFAULT_COMPRESSION = -1;
      var Z_DEFAULT_STRATEGY = 0;
      var Z_DEFLATED = 8;
      function Deflate(options) {
        if (!(this instanceof Deflate)) return new Deflate(options);
        this.options = utils.assign({
          level: Z_DEFAULT_COMPRESSION,
          method: Z_DEFLATED,
          chunkSize: 16384,
          windowBits: 15,
          memLevel: 8,
          strategy: Z_DEFAULT_STRATEGY,
          to: ""
        }, options || {});
        var opt = this.options;
        if (opt.raw && opt.windowBits > 0) {
          opt.windowBits = -opt.windowBits;
        } else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) {
          opt.windowBits += 16;
        }
        this.err = 0;
        this.msg = "";
        this.ended = false;
        this.chunks = [];
        this.strm = new ZStream();
        this.strm.avail_out = 0;
        var status = zlib_deflate.deflateInit2(
          this.strm,
          opt.level,
          opt.method,
          opt.windowBits,
          opt.memLevel,
          opt.strategy
        );
        if (status !== Z_OK) {
          throw new Error(msg[status]);
        }
        if (opt.header) {
          zlib_deflate.deflateSetHeader(this.strm, opt.header);
        }
        if (opt.dictionary) {
          var dict;
          if (typeof opt.dictionary === "string") {
            dict = strings.string2buf(opt.dictionary);
          } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
            dict = new Uint8Array(opt.dictionary);
          } else {
            dict = opt.dictionary;
          }
          status = zlib_deflate.deflateSetDictionary(this.strm, dict);
          if (status !== Z_OK) {
            throw new Error(msg[status]);
          }
          this._dict_set = true;
        }
      }
      Deflate.prototype.push = function(data, mode) {
        var strm = this.strm;
        var chunkSize = this.options.chunkSize;
        var status, _mode;
        if (this.ended) {
          return false;
        }
        _mode = mode === ~~mode ? mode : mode === true ? Z_FINISH : Z_NO_FLUSH;
        if (typeof data === "string") {
          strm.input = strings.string2buf(data);
        } else if (toString.call(data) === "[object ArrayBuffer]") {
          strm.input = new Uint8Array(data);
        } else {
          strm.input = data;
        }
        strm.next_in = 0;
        strm.avail_in = strm.input.length;
        do {
          if (strm.avail_out === 0) {
            strm.output = new utils.Buf8(chunkSize);
            strm.next_out = 0;
            strm.avail_out = chunkSize;
          }
          status = zlib_deflate.deflate(strm, _mode);
          if (status !== Z_STREAM_END && status !== Z_OK) {
            this.onEnd(status);
            this.ended = true;
            return false;
          }
          if (strm.avail_out === 0 || strm.avail_in === 0 && (_mode === Z_FINISH || _mode === Z_SYNC_FLUSH)) {
            if (this.options.to === "string") {
              this.onData(strings.buf2binstring(utils.shrinkBuf(strm.output, strm.next_out)));
            } else {
              this.onData(utils.shrinkBuf(strm.output, strm.next_out));
            }
          }
        } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END);
        if (_mode === Z_FINISH) {
          status = zlib_deflate.deflateEnd(this.strm);
          this.onEnd(status);
          this.ended = true;
          return status === Z_OK;
        }
        if (_mode === Z_SYNC_FLUSH) {
          this.onEnd(Z_OK);
          strm.avail_out = 0;
          return true;
        }
        return true;
      };
      Deflate.prototype.onData = function(chunk) {
        this.chunks.push(chunk);
      };
      Deflate.prototype.onEnd = function(status) {
        if (status === Z_OK) {
          if (this.options.to === "string") {
            this.result = this.chunks.join("");
          } else {
            this.result = utils.flattenChunks(this.chunks);
          }
        }
        this.chunks = [];
        this.err = status;
        this.msg = this.strm.msg;
      };
      function deflate(input, options) {
        var deflator = new Deflate(options);
        deflator.push(input, true);
        if (deflator.err) {
          throw deflator.msg || msg[deflator.err];
        }
        return deflator.result;
      }
      function deflateRaw(input, options) {
        options = options || {};
        options.raw = true;
        return deflate(input, options);
      }
      function gzip(input, options) {
        options = options || {};
        options.gzip = true;
        return deflate(input, options);
      }
      exports.Deflate = Deflate;
      exports.deflate = deflate;
      exports.deflateRaw = deflateRaw;
      exports.gzip = gzip;
    }
  });

  // node_modules/pako/lib/zlib/inffast.js
  var require_inffast = __commonJS({
    "node_modules/pako/lib/zlib/inffast.js"(exports, module) {
      "use strict";
      init_shim();
      var BAD = 30;
      var TYPE = 12;
      module.exports = function inflate_fast(strm, start) {
        var state;
        var _in;
        var last;
        var _out;
        var beg;
        var end;
        var dmax;
        var wsize;
        var whave;
        var wnext;
        var s_window;
        var hold;
        var bits;
        var lcode;
        var dcode;
        var lmask;
        var dmask;
        var here;
        var op;
        var len;
        var dist;
        var from;
        var from_source;
        var input, output;
        state = strm.state;
        _in = strm.next_in;
        input = strm.input;
        last = _in + (strm.avail_in - 5);
        _out = strm.next_out;
        output = strm.output;
        beg = _out - (start - strm.avail_out);
        end = _out + (strm.avail_out - 257);
        dmax = state.dmax;
        wsize = state.wsize;
        whave = state.whave;
        wnext = state.wnext;
        s_window = state.window;
        hold = state.hold;
        bits = state.bits;
        lcode = state.lencode;
        dcode = state.distcode;
        lmask = (1 << state.lenbits) - 1;
        dmask = (1 << state.distbits) - 1;
        top:
          do {
            if (bits < 15) {
              hold += input[_in++] << bits;
              bits += 8;
              hold += input[_in++] << bits;
              bits += 8;
            }
            here = lcode[hold & lmask];
            dolen:
              for (; ; ) {
                op = here >>> 24;
                hold >>>= op;
                bits -= op;
                op = here >>> 16 & 255;
                if (op === 0) {
                  output[_out++] = here & 65535;
                } else if (op & 16) {
                  len = here & 65535;
                  op &= 15;
                  if (op) {
                    if (bits < op) {
                      hold += input[_in++] << bits;
                      bits += 8;
                    }
                    len += hold & (1 << op) - 1;
                    hold >>>= op;
                    bits -= op;
                  }
                  if (bits < 15) {
                    hold += input[_in++] << bits;
                    bits += 8;
                    hold += input[_in++] << bits;
                    bits += 8;
                  }
                  here = dcode[hold & dmask];
                  dodist:
                    for (; ; ) {
                      op = here >>> 24;
                      hold >>>= op;
                      bits -= op;
                      op = here >>> 16 & 255;
                      if (op & 16) {
                        dist = here & 65535;
                        op &= 15;
                        if (bits < op) {
                          hold += input[_in++] << bits;
                          bits += 8;
                          if (bits < op) {
                            hold += input[_in++] << bits;
                            bits += 8;
                          }
                        }
                        dist += hold & (1 << op) - 1;
                        if (dist > dmax) {
                          strm.msg = "invalid distance too far back";
                          state.mode = BAD;
                          break top;
                        }
                        hold >>>= op;
                        bits -= op;
                        op = _out - beg;
                        if (dist > op) {
                          op = dist - op;
                          if (op > whave) {
                            if (state.sane) {
                              strm.msg = "invalid distance too far back";
                              state.mode = BAD;
                              break top;
                            }
                          }
                          from = 0;
                          from_source = s_window;
                          if (wnext === 0) {
                            from += wsize - op;
                            if (op < len) {
                              len -= op;
                              do {
                                output[_out++] = s_window[from++];
                              } while (--op);
                              from = _out - dist;
                              from_source = output;
                            }
                          } else if (wnext < op) {
                            from += wsize + wnext - op;
                            op -= wnext;
                            if (op < len) {
                              len -= op;
                              do {
                                output[_out++] = s_window[from++];
                              } while (--op);
                              from = 0;
                              if (wnext < len) {
                                op = wnext;
                                len -= op;
                                do {
                                  output[_out++] = s_window[from++];
                                } while (--op);
                                from = _out - dist;
                                from_source = output;
                              }
                            }
                          } else {
                            from += wnext - op;
                            if (op < len) {
                              len -= op;
                              do {
                                output[_out++] = s_window[from++];
                              } while (--op);
                              from = _out - dist;
                              from_source = output;
                            }
                          }
                          while (len > 2) {
                            output[_out++] = from_source[from++];
                            output[_out++] = from_source[from++];
                            output[_out++] = from_source[from++];
                            len -= 3;
                          }
                          if (len) {
                            output[_out++] = from_source[from++];
                            if (len > 1) {
                              output[_out++] = from_source[from++];
                            }
                          }
                        } else {
                          from = _out - dist;
                          do {
                            output[_out++] = output[from++];
                            output[_out++] = output[from++];
                            output[_out++] = output[from++];
                            len -= 3;
                          } while (len > 2);
                          if (len) {
                            output[_out++] = output[from++];
                            if (len > 1) {
                              output[_out++] = output[from++];
                            }
                          }
                        }
                      } else if ((op & 64) === 0) {
                        here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
                        continue dodist;
                      } else {
                        strm.msg = "invalid distance code";
                        state.mode = BAD;
                        break top;
                      }
                      break;
                    }
                } else if ((op & 64) === 0) {
                  here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
                  continue dolen;
                } else if (op & 32) {
                  state.mode = TYPE;
                  break top;
                } else {
                  strm.msg = "invalid literal/length code";
                  state.mode = BAD;
                  break top;
                }
                break;
              }
          } while (_in < last && _out < end);
        len = bits >> 3;
        _in -= len;
        bits -= len << 3;
        hold &= (1 << bits) - 1;
        strm.next_in = _in;
        strm.next_out = _out;
        strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
        strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
        state.hold = hold;
        state.bits = bits;
        return;
      };
    }
  });

  // node_modules/pako/lib/zlib/inftrees.js
  var require_inftrees = __commonJS({
    "node_modules/pako/lib/zlib/inftrees.js"(exports, module) {
      "use strict";
      init_shim();
      var utils = require_common();
      var MAXBITS = 15;
      var ENOUGH_LENS = 852;
      var ENOUGH_DISTS = 592;
      var CODES = 0;
      var LENS = 1;
      var DISTS = 2;
      var lbase = [
        /* Length codes 257..285 base */
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        13,
        15,
        17,
        19,
        23,
        27,
        31,
        35,
        43,
        51,
        59,
        67,
        83,
        99,
        115,
        131,
        163,
        195,
        227,
        258,
        0,
        0
      ];
      var lext = [
        /* Length codes 257..285 extra */
        16,
        16,
        16,
        16,
        16,
        16,
        16,
        16,
        17,
        17,
        17,
        17,
        18,
        18,
        18,
        18,
        19,
        19,
        19,
        19,
        20,
        20,
        20,
        20,
        21,
        21,
        21,
        21,
        16,
        72,
        78
      ];
      var dbase = [
        /* Distance codes 0..29 base */
        1,
        2,
        3,
        4,
        5,
        7,
        9,
        13,
        17,
        25,
        33,
        49,
        65,
        97,
        129,
        193,
        257,
        385,
        513,
        769,
        1025,
        1537,
        2049,
        3073,
        4097,
        6145,
        8193,
        12289,
        16385,
        24577,
        0,
        0
      ];
      var dext = [
        /* Distance codes 0..29 extra */
        16,
        16,
        16,
        16,
        17,
        17,
        18,
        18,
        19,
        19,
        20,
        20,
        21,
        21,
        22,
        22,
        23,
        23,
        24,
        24,
        25,
        25,
        26,
        26,
        27,
        27,
        28,
        28,
        29,
        29,
        64,
        64
      ];
      module.exports = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts) {
        var bits = opts.bits;
        var len = 0;
        var sym = 0;
        var min = 0, max = 0;
        var root = 0;
        var curr = 0;
        var drop = 0;
        var left = 0;
        var used = 0;
        var huff = 0;
        var incr;
        var fill;
        var low;
        var mask;
        var next;
        var base = null;
        var base_index = 0;
        var end;
        var count = new utils.Buf16(MAXBITS + 1);
        var offs = new utils.Buf16(MAXBITS + 1);
        var extra = null;
        var extra_index = 0;
        var here_bits, here_op, here_val;
        for (len = 0; len <= MAXBITS; len++) {
          count[len] = 0;
        }
        for (sym = 0; sym < codes; sym++) {
          count[lens[lens_index + sym]]++;
        }
        root = bits;
        for (max = MAXBITS; max >= 1; max--) {
          if (count[max] !== 0) {
            break;
          }
        }
        if (root > max) {
          root = max;
        }
        if (max === 0) {
          table[table_index++] = 1 << 24 | 64 << 16 | 0;
          table[table_index++] = 1 << 24 | 64 << 16 | 0;
          opts.bits = 1;
          return 0;
        }
        for (min = 1; min < max; min++) {
          if (count[min] !== 0) {
            break;
          }
        }
        if (root < min) {
          root = min;
        }
        left = 1;
        for (len = 1; len <= MAXBITS; len++) {
          left <<= 1;
          left -= count[len];
          if (left < 0) {
            return -1;
          }
        }
        if (left > 0 && (type === CODES || max !== 1)) {
          return -1;
        }
        offs[1] = 0;
        for (len = 1; len < MAXBITS; len++) {
          offs[len + 1] = offs[len] + count[len];
        }
        for (sym = 0; sym < codes; sym++) {
          if (lens[lens_index + sym] !== 0) {
            work[offs[lens[lens_index + sym]]++] = sym;
          }
        }
        if (type === CODES) {
          base = extra = work;
          end = 19;
        } else if (type === LENS) {
          base = lbase;
          base_index -= 257;
          extra = lext;
          extra_index -= 257;
          end = 256;
        } else {
          base = dbase;
          extra = dext;
          end = -1;
        }
        huff = 0;
        sym = 0;
        len = min;
        next = table_index;
        curr = root;
        drop = 0;
        low = -1;
        used = 1 << root;
        mask = used - 1;
        if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) {
          return 1;
        }
        for (; ; ) {
          here_bits = len - drop;
          if (work[sym] < end) {
            here_op = 0;
            here_val = work[sym];
          } else if (work[sym] > end) {
            here_op = extra[extra_index + work[sym]];
            here_val = base[base_index + work[sym]];
          } else {
            here_op = 32 + 64;
            here_val = 0;
          }
          incr = 1 << len - drop;
          fill = 1 << curr;
          min = fill;
          do {
            fill -= incr;
            table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
          } while (fill !== 0);
          incr = 1 << len - 1;
          while (huff & incr) {
            incr >>= 1;
          }
          if (incr !== 0) {
            huff &= incr - 1;
            huff += incr;
          } else {
            huff = 0;
          }
          sym++;
          if (--count[len] === 0) {
            if (len === max) {
              break;
            }
            len = lens[lens_index + work[sym]];
          }
          if (len > root && (huff & mask) !== low) {
            if (drop === 0) {
              drop = root;
            }
            next += min;
            curr = len - drop;
            left = 1 << curr;
            while (curr + drop < max) {
              left -= count[curr + drop];
              if (left <= 0) {
                break;
              }
              curr++;
              left <<= 1;
            }
            used += 1 << curr;
            if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) {
              return 1;
            }
            low = huff & mask;
            table[low] = root << 24 | curr << 16 | next - table_index | 0;
          }
        }
        if (huff !== 0) {
          table[next + huff] = len - drop << 24 | 64 << 16 | 0;
        }
        opts.bits = root;
        return 0;
      };
    }
  });

  // node_modules/pako/lib/zlib/inflate.js
  var require_inflate = __commonJS({
    "node_modules/pako/lib/zlib/inflate.js"(exports) {
      "use strict";
      init_shim();
      var utils = require_common();
      var adler32 = require_adler32();
      var crc32 = require_crc32();
      var inflate_fast = require_inffast();
      var inflate_table = require_inftrees();
      var CODES = 0;
      var LENS = 1;
      var DISTS = 2;
      var Z_FINISH = 4;
      var Z_BLOCK = 5;
      var Z_TREES = 6;
      var Z_OK = 0;
      var Z_STREAM_END = 1;
      var Z_NEED_DICT = 2;
      var Z_STREAM_ERROR = -2;
      var Z_DATA_ERROR = -3;
      var Z_MEM_ERROR = -4;
      var Z_BUF_ERROR = -5;
      var Z_DEFLATED = 8;
      var HEAD = 1;
      var FLAGS = 2;
      var TIME = 3;
      var OS = 4;
      var EXLEN = 5;
      var EXTRA = 6;
      var NAME = 7;
      var COMMENT = 8;
      var HCRC = 9;
      var DICTID = 10;
      var DICT = 11;
      var TYPE = 12;
      var TYPEDO = 13;
      var STORED = 14;
      var COPY_ = 15;
      var COPY = 16;
      var TABLE = 17;
      var LENLENS = 18;
      var CODELENS = 19;
      var LEN_ = 20;
      var LEN = 21;
      var LENEXT = 22;
      var DIST = 23;
      var DISTEXT = 24;
      var MATCH = 25;
      var LIT = 26;
      var CHECK = 27;
      var LENGTH = 28;
      var DONE = 29;
      var BAD = 30;
      var MEM = 31;
      var SYNC = 32;
      var ENOUGH_LENS = 852;
      var ENOUGH_DISTS = 592;
      var MAX_WBITS = 15;
      var DEF_WBITS = MAX_WBITS;
      function zswap32(q) {
        return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
      }
      function InflateState() {
        this.mode = 0;
        this.last = false;
        this.wrap = 0;
        this.havedict = false;
        this.flags = 0;
        this.dmax = 0;
        this.check = 0;
        this.total = 0;
        this.head = null;
        this.wbits = 0;
        this.wsize = 0;
        this.whave = 0;
        this.wnext = 0;
        this.window = null;
        this.hold = 0;
        this.bits = 0;
        this.length = 0;
        this.offset = 0;
        this.extra = 0;
        this.lencode = null;
        this.distcode = null;
        this.lenbits = 0;
        this.distbits = 0;
        this.ncode = 0;
        this.nlen = 0;
        this.ndist = 0;
        this.have = 0;
        this.next = null;
        this.lens = new utils.Buf16(320);
        this.work = new utils.Buf16(288);
        this.lendyn = null;
        this.distdyn = null;
        this.sane = 0;
        this.back = 0;
        this.was = 0;
      }
      function inflateResetKeep(strm) {
        var state;
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        state = strm.state;
        strm.total_in = strm.total_out = state.total = 0;
        strm.msg = "";
        if (state.wrap) {
          strm.adler = state.wrap & 1;
        }
        state.mode = HEAD;
        state.last = 0;
        state.havedict = 0;
        state.dmax = 32768;
        state.head = null;
        state.hold = 0;
        state.bits = 0;
        state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS);
        state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS);
        state.sane = 1;
        state.back = -1;
        return Z_OK;
      }
      function inflateReset(strm) {
        var state;
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        state = strm.state;
        state.wsize = 0;
        state.whave = 0;
        state.wnext = 0;
        return inflateResetKeep(strm);
      }
      function inflateReset2(strm, windowBits) {
        var wrap;
        var state;
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        state = strm.state;
        if (windowBits < 0) {
          wrap = 0;
          windowBits = -windowBits;
        } else {
          wrap = (windowBits >> 4) + 1;
          if (windowBits < 48) {
            windowBits &= 15;
          }
        }
        if (windowBits && (windowBits < 8 || windowBits > 15)) {
          return Z_STREAM_ERROR;
        }
        if (state.window !== null && state.wbits !== windowBits) {
          state.window = null;
        }
        state.wrap = wrap;
        state.wbits = windowBits;
        return inflateReset(strm);
      }
      function inflateInit2(strm, windowBits) {
        var ret;
        var state;
        if (!strm) {
          return Z_STREAM_ERROR;
        }
        state = new InflateState();
        strm.state = state;
        state.window = null;
        ret = inflateReset2(strm, windowBits);
        if (ret !== Z_OK) {
          strm.state = null;
        }
        return ret;
      }
      function inflateInit(strm) {
        return inflateInit2(strm, DEF_WBITS);
      }
      var virgin = true;
      var lenfix;
      var distfix;
      function fixedtables(state) {
        if (virgin) {
          var sym;
          lenfix = new utils.Buf32(512);
          distfix = new utils.Buf32(32);
          sym = 0;
          while (sym < 144) {
            state.lens[sym++] = 8;
          }
          while (sym < 256) {
            state.lens[sym++] = 9;
          }
          while (sym < 280) {
            state.lens[sym++] = 7;
          }
          while (sym < 288) {
            state.lens[sym++] = 8;
          }
          inflate_table(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
          sym = 0;
          while (sym < 32) {
            state.lens[sym++] = 5;
          }
          inflate_table(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });
          virgin = false;
        }
        state.lencode = lenfix;
        state.lenbits = 9;
        state.distcode = distfix;
        state.distbits = 5;
      }
      function updatewindow(strm, src, end, copy) {
        var dist;
        var state = strm.state;
        if (state.window === null) {
          state.wsize = 1 << state.wbits;
          state.wnext = 0;
          state.whave = 0;
          state.window = new utils.Buf8(state.wsize);
        }
        if (copy >= state.wsize) {
          utils.arraySet(state.window, src, end - state.wsize, state.wsize, 0);
          state.wnext = 0;
          state.whave = state.wsize;
        } else {
          dist = state.wsize - state.wnext;
          if (dist > copy) {
            dist = copy;
          }
          utils.arraySet(state.window, src, end - copy, dist, state.wnext);
          copy -= dist;
          if (copy) {
            utils.arraySet(state.window, src, end - copy, copy, 0);
            state.wnext = copy;
            state.whave = state.wsize;
          } else {
            state.wnext += dist;
            if (state.wnext === state.wsize) {
              state.wnext = 0;
            }
            if (state.whave < state.wsize) {
              state.whave += dist;
            }
          }
        }
        return 0;
      }
      function inflate(strm, flush) {
        var state;
        var input, output;
        var next;
        var put;
        var have, left;
        var hold;
        var bits;
        var _in, _out;
        var copy;
        var from;
        var from_source;
        var here = 0;
        var here_bits, here_op, here_val;
        var last_bits, last_op, last_val;
        var len;
        var ret;
        var hbuf = new utils.Buf8(4);
        var opts;
        var n;
        var order = (
          /* permutation of code lengths */
          [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]
        );
        if (!strm || !strm.state || !strm.output || !strm.input && strm.avail_in !== 0) {
          return Z_STREAM_ERROR;
        }
        state = strm.state;
        if (state.mode === TYPE) {
          state.mode = TYPEDO;
        }
        put = strm.next_out;
        output = strm.output;
        left = strm.avail_out;
        next = strm.next_in;
        input = strm.input;
        have = strm.avail_in;
        hold = state.hold;
        bits = state.bits;
        _in = have;
        _out = left;
        ret = Z_OK;
        inf_leave:
          for (; ; ) {
            switch (state.mode) {
              case HEAD:
                if (state.wrap === 0) {
                  state.mode = TYPEDO;
                  break;
                }
                while (bits < 16) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (state.wrap & 2 && hold === 35615) {
                  state.check = 0;
                  hbuf[0] = hold & 255;
                  hbuf[1] = hold >>> 8 & 255;
                  state.check = crc32(state.check, hbuf, 2, 0);
                  hold = 0;
                  bits = 0;
                  state.mode = FLAGS;
                  break;
                }
                state.flags = 0;
                if (state.head) {
                  state.head.done = false;
                }
                if (!(state.wrap & 1) || /* check if zlib header allowed */
                (((hold & 255) << 8) + (hold >> 8)) % 31) {
                  strm.msg = "incorrect header check";
                  state.mode = BAD;
                  break;
                }
                if ((hold & 15) !== Z_DEFLATED) {
                  strm.msg = "unknown compression method";
                  state.mode = BAD;
                  break;
                }
                hold >>>= 4;
                bits -= 4;
                len = (hold & 15) + 8;
                if (state.wbits === 0) {
                  state.wbits = len;
                } else if (len > state.wbits) {
                  strm.msg = "invalid window size";
                  state.mode = BAD;
                  break;
                }
                state.dmax = 1 << len;
                strm.adler = state.check = 1;
                state.mode = hold & 512 ? DICTID : TYPE;
                hold = 0;
                bits = 0;
                break;
              case FLAGS:
                while (bits < 16) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.flags = hold;
                if ((state.flags & 255) !== Z_DEFLATED) {
                  strm.msg = "unknown compression method";
                  state.mode = BAD;
                  break;
                }
                if (state.flags & 57344) {
                  strm.msg = "unknown header flags set";
                  state.mode = BAD;
                  break;
                }
                if (state.head) {
                  state.head.text = hold >> 8 & 1;
                }
                if (state.flags & 512) {
                  hbuf[0] = hold & 255;
                  hbuf[1] = hold >>> 8 & 255;
                  state.check = crc32(state.check, hbuf, 2, 0);
                }
                hold = 0;
                bits = 0;
                state.mode = TIME;
              /* falls through */
              case TIME:
                while (bits < 32) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (state.head) {
                  state.head.time = hold;
                }
                if (state.flags & 512) {
                  hbuf[0] = hold & 255;
                  hbuf[1] = hold >>> 8 & 255;
                  hbuf[2] = hold >>> 16 & 255;
                  hbuf[3] = hold >>> 24 & 255;
                  state.check = crc32(state.check, hbuf, 4, 0);
                }
                hold = 0;
                bits = 0;
                state.mode = OS;
              /* falls through */
              case OS:
                while (bits < 16) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (state.head) {
                  state.head.xflags = hold & 255;
                  state.head.os = hold >> 8;
                }
                if (state.flags & 512) {
                  hbuf[0] = hold & 255;
                  hbuf[1] = hold >>> 8 & 255;
                  state.check = crc32(state.check, hbuf, 2, 0);
                }
                hold = 0;
                bits = 0;
                state.mode = EXLEN;
              /* falls through */
              case EXLEN:
                if (state.flags & 1024) {
                  while (bits < 16) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  state.length = hold;
                  if (state.head) {
                    state.head.extra_len = hold;
                  }
                  if (state.flags & 512) {
                    hbuf[0] = hold & 255;
                    hbuf[1] = hold >>> 8 & 255;
                    state.check = crc32(state.check, hbuf, 2, 0);
                  }
                  hold = 0;
                  bits = 0;
                } else if (state.head) {
                  state.head.extra = null;
                }
                state.mode = EXTRA;
              /* falls through */
              case EXTRA:
                if (state.flags & 1024) {
                  copy = state.length;
                  if (copy > have) {
                    copy = have;
                  }
                  if (copy) {
                    if (state.head) {
                      len = state.head.extra_len - state.length;
                      if (!state.head.extra) {
                        state.head.extra = new Array(state.head.extra_len);
                      }
                      utils.arraySet(
                        state.head.extra,
                        input,
                        next,
                        // extra field is limited to 65536 bytes
                        // - no need for additional size check
                        copy,
                        /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                        len
                      );
                    }
                    if (state.flags & 512) {
                      state.check = crc32(state.check, input, copy, next);
                    }
                    have -= copy;
                    next += copy;
                    state.length -= copy;
                  }
                  if (state.length) {
                    break inf_leave;
                  }
                }
                state.length = 0;
                state.mode = NAME;
              /* falls through */
              case NAME:
                if (state.flags & 2048) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  copy = 0;
                  do {
                    len = input[next + copy++];
                    if (state.head && len && state.length < 65536) {
                      state.head.name += String.fromCharCode(len);
                    }
                  } while (len && copy < have);
                  if (state.flags & 512) {
                    state.check = crc32(state.check, input, copy, next);
                  }
                  have -= copy;
                  next += copy;
                  if (len) {
                    break inf_leave;
                  }
                } else if (state.head) {
                  state.head.name = null;
                }
                state.length = 0;
                state.mode = COMMENT;
              /* falls through */
              case COMMENT:
                if (state.flags & 4096) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  copy = 0;
                  do {
                    len = input[next + copy++];
                    if (state.head && len && state.length < 65536) {
                      state.head.comment += String.fromCharCode(len);
                    }
                  } while (len && copy < have);
                  if (state.flags & 512) {
                    state.check = crc32(state.check, input, copy, next);
                  }
                  have -= copy;
                  next += copy;
                  if (len) {
                    break inf_leave;
                  }
                } else if (state.head) {
                  state.head.comment = null;
                }
                state.mode = HCRC;
              /* falls through */
              case HCRC:
                if (state.flags & 512) {
                  while (bits < 16) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  if (hold !== (state.check & 65535)) {
                    strm.msg = "header crc mismatch";
                    state.mode = BAD;
                    break;
                  }
                  hold = 0;
                  bits = 0;
                }
                if (state.head) {
                  state.head.hcrc = state.flags >> 9 & 1;
                  state.head.done = true;
                }
                strm.adler = state.check = 0;
                state.mode = TYPE;
                break;
              case DICTID:
                while (bits < 32) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                strm.adler = state.check = zswap32(hold);
                hold = 0;
                bits = 0;
                state.mode = DICT;
              /* falls through */
              case DICT:
                if (state.havedict === 0) {
                  strm.next_out = put;
                  strm.avail_out = left;
                  strm.next_in = next;
                  strm.avail_in = have;
                  state.hold = hold;
                  state.bits = bits;
                  return Z_NEED_DICT;
                }
                strm.adler = state.check = 1;
                state.mode = TYPE;
              /* falls through */
              case TYPE:
                if (flush === Z_BLOCK || flush === Z_TREES) {
                  break inf_leave;
                }
              /* falls through */
              case TYPEDO:
                if (state.last) {
                  hold >>>= bits & 7;
                  bits -= bits & 7;
                  state.mode = CHECK;
                  break;
                }
                while (bits < 3) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.last = hold & 1;
                hold >>>= 1;
                bits -= 1;
                switch (hold & 3) {
                  case 0:
                    state.mode = STORED;
                    break;
                  case 1:
                    fixedtables(state);
                    state.mode = LEN_;
                    if (flush === Z_TREES) {
                      hold >>>= 2;
                      bits -= 2;
                      break inf_leave;
                    }
                    break;
                  case 2:
                    state.mode = TABLE;
                    break;
                  case 3:
                    strm.msg = "invalid block type";
                    state.mode = BAD;
                }
                hold >>>= 2;
                bits -= 2;
                break;
              case STORED:
                hold >>>= bits & 7;
                bits -= bits & 7;
                while (bits < 32) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
                  strm.msg = "invalid stored block lengths";
                  state.mode = BAD;
                  break;
                }
                state.length = hold & 65535;
                hold = 0;
                bits = 0;
                state.mode = COPY_;
                if (flush === Z_TREES) {
                  break inf_leave;
                }
              /* falls through */
              case COPY_:
                state.mode = COPY;
              /* falls through */
              case COPY:
                copy = state.length;
                if (copy) {
                  if (copy > have) {
                    copy = have;
                  }
                  if (copy > left) {
                    copy = left;
                  }
                  if (copy === 0) {
                    break inf_leave;
                  }
                  utils.arraySet(output, input, next, copy, put);
                  have -= copy;
                  next += copy;
                  left -= copy;
                  put += copy;
                  state.length -= copy;
                  break;
                }
                state.mode = TYPE;
                break;
              case TABLE:
                while (bits < 14) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.nlen = (hold & 31) + 257;
                hold >>>= 5;
                bits -= 5;
                state.ndist = (hold & 31) + 1;
                hold >>>= 5;
                bits -= 5;
                state.ncode = (hold & 15) + 4;
                hold >>>= 4;
                bits -= 4;
                if (state.nlen > 286 || state.ndist > 30) {
                  strm.msg = "too many length or distance symbols";
                  state.mode = BAD;
                  break;
                }
                state.have = 0;
                state.mode = LENLENS;
              /* falls through */
              case LENLENS:
                while (state.have < state.ncode) {
                  while (bits < 3) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  state.lens[order[state.have++]] = hold & 7;
                  hold >>>= 3;
                  bits -= 3;
                }
                while (state.have < 19) {
                  state.lens[order[state.have++]] = 0;
                }
                state.lencode = state.lendyn;
                state.lenbits = 7;
                opts = { bits: state.lenbits };
                ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
                state.lenbits = opts.bits;
                if (ret) {
                  strm.msg = "invalid code lengths set";
                  state.mode = BAD;
                  break;
                }
                state.have = 0;
                state.mode = CODELENS;
              /* falls through */
              case CODELENS:
                while (state.have < state.nlen + state.ndist) {
                  for (; ; ) {
                    here = state.lencode[hold & (1 << state.lenbits) - 1];
                    here_bits = here >>> 24;
                    here_op = here >>> 16 & 255;
                    here_val = here & 65535;
                    if (here_bits <= bits) {
                      break;
                    }
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  if (here_val < 16) {
                    hold >>>= here_bits;
                    bits -= here_bits;
                    state.lens[state.have++] = here_val;
                  } else {
                    if (here_val === 16) {
                      n = here_bits + 2;
                      while (bits < n) {
                        if (have === 0) {
                          break inf_leave;
                        }
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                      }
                      hold >>>= here_bits;
                      bits -= here_bits;
                      if (state.have === 0) {
                        strm.msg = "invalid bit length repeat";
                        state.mode = BAD;
                        break;
                      }
                      len = state.lens[state.have - 1];
                      copy = 3 + (hold & 3);
                      hold >>>= 2;
                      bits -= 2;
                    } else if (here_val === 17) {
                      n = here_bits + 3;
                      while (bits < n) {
                        if (have === 0) {
                          break inf_leave;
                        }
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                      }
                      hold >>>= here_bits;
                      bits -= here_bits;
                      len = 0;
                      copy = 3 + (hold & 7);
                      hold >>>= 3;
                      bits -= 3;
                    } else {
                      n = here_bits + 7;
                      while (bits < n) {
                        if (have === 0) {
                          break inf_leave;
                        }
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                      }
                      hold >>>= here_bits;
                      bits -= here_bits;
                      len = 0;
                      copy = 11 + (hold & 127);
                      hold >>>= 7;
                      bits -= 7;
                    }
                    if (state.have + copy > state.nlen + state.ndist) {
                      strm.msg = "invalid bit length repeat";
                      state.mode = BAD;
                      break;
                    }
                    while (copy--) {
                      state.lens[state.have++] = len;
                    }
                  }
                }
                if (state.mode === BAD) {
                  break;
                }
                if (state.lens[256] === 0) {
                  strm.msg = "invalid code -- missing end-of-block";
                  state.mode = BAD;
                  break;
                }
                state.lenbits = 9;
                opts = { bits: state.lenbits };
                ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
                state.lenbits = opts.bits;
                if (ret) {
                  strm.msg = "invalid literal/lengths set";
                  state.mode = BAD;
                  break;
                }
                state.distbits = 6;
                state.distcode = state.distdyn;
                opts = { bits: state.distbits };
                ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
                state.distbits = opts.bits;
                if (ret) {
                  strm.msg = "invalid distances set";
                  state.mode = BAD;
                  break;
                }
                state.mode = LEN_;
                if (flush === Z_TREES) {
                  break inf_leave;
                }
              /* falls through */
              case LEN_:
                state.mode = LEN;
              /* falls through */
              case LEN:
                if (have >= 6 && left >= 258) {
                  strm.next_out = put;
                  strm.avail_out = left;
                  strm.next_in = next;
                  strm.avail_in = have;
                  state.hold = hold;
                  state.bits = bits;
                  inflate_fast(strm, _out);
                  put = strm.next_out;
                  output = strm.output;
                  left = strm.avail_out;
                  next = strm.next_in;
                  input = strm.input;
                  have = strm.avail_in;
                  hold = state.hold;
                  bits = state.bits;
                  if (state.mode === TYPE) {
                    state.back = -1;
                  }
                  break;
                }
                state.back = 0;
                for (; ; ) {
                  here = state.lencode[hold & (1 << state.lenbits) - 1];
                  here_bits = here >>> 24;
                  here_op = here >>> 16 & 255;
                  here_val = here & 65535;
                  if (here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (here_op && (here_op & 240) === 0) {
                  last_bits = here_bits;
                  last_op = here_op;
                  last_val = here_val;
                  for (; ; ) {
                    here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                    here_bits = here >>> 24;
                    here_op = here >>> 16 & 255;
                    here_val = here & 65535;
                    if (last_bits + here_bits <= bits) {
                      break;
                    }
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  hold >>>= last_bits;
                  bits -= last_bits;
                  state.back += last_bits;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                state.back += here_bits;
                state.length = here_val;
                if (here_op === 0) {
                  state.mode = LIT;
                  break;
                }
                if (here_op & 32) {
                  state.back = -1;
                  state.mode = TYPE;
                  break;
                }
                if (here_op & 64) {
                  strm.msg = "invalid literal/length code";
                  state.mode = BAD;
                  break;
                }
                state.extra = here_op & 15;
                state.mode = LENEXT;
              /* falls through */
              case LENEXT:
                if (state.extra) {
                  n = state.extra;
                  while (bits < n) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  state.length += hold & (1 << state.extra) - 1;
                  hold >>>= state.extra;
                  bits -= state.extra;
                  state.back += state.extra;
                }
                state.was = state.length;
                state.mode = DIST;
              /* falls through */
              case DIST:
                for (; ; ) {
                  here = state.distcode[hold & (1 << state.distbits) - 1];
                  here_bits = here >>> 24;
                  here_op = here >>> 16 & 255;
                  here_val = here & 65535;
                  if (here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if ((here_op & 240) === 0) {
                  last_bits = here_bits;
                  last_op = here_op;
                  last_val = here_val;
                  for (; ; ) {
                    here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                    here_bits = here >>> 24;
                    here_op = here >>> 16 & 255;
                    here_val = here & 65535;
                    if (last_bits + here_bits <= bits) {
                      break;
                    }
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  hold >>>= last_bits;
                  bits -= last_bits;
                  state.back += last_bits;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                state.back += here_bits;
                if (here_op & 64) {
                  strm.msg = "invalid distance code";
                  state.mode = BAD;
                  break;
                }
                state.offset = here_val;
                state.extra = here_op & 15;
                state.mode = DISTEXT;
              /* falls through */
              case DISTEXT:
                if (state.extra) {
                  n = state.extra;
                  while (bits < n) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  state.offset += hold & (1 << state.extra) - 1;
                  hold >>>= state.extra;
                  bits -= state.extra;
                  state.back += state.extra;
                }
                if (state.offset > state.dmax) {
                  strm.msg = "invalid distance too far back";
                  state.mode = BAD;
                  break;
                }
                state.mode = MATCH;
              /* falls through */
              case MATCH:
                if (left === 0) {
                  break inf_leave;
                }
                copy = _out - left;
                if (state.offset > copy) {
                  copy = state.offset - copy;
                  if (copy > state.whave) {
                    if (state.sane) {
                      strm.msg = "invalid distance too far back";
                      state.mode = BAD;
                      break;
                    }
                  }
                  if (copy > state.wnext) {
                    copy -= state.wnext;
                    from = state.wsize - copy;
                  } else {
                    from = state.wnext - copy;
                  }
                  if (copy > state.length) {
                    copy = state.length;
                  }
                  from_source = state.window;
                } else {
                  from_source = output;
                  from = put - state.offset;
                  copy = state.length;
                }
                if (copy > left) {
                  copy = left;
                }
                left -= copy;
                state.length -= copy;
                do {
                  output[put++] = from_source[from++];
                } while (--copy);
                if (state.length === 0) {
                  state.mode = LEN;
                }
                break;
              case LIT:
                if (left === 0) {
                  break inf_leave;
                }
                output[put++] = state.length;
                left--;
                state.mode = LEN;
                break;
              case CHECK:
                if (state.wrap) {
                  while (bits < 32) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold |= input[next++] << bits;
                    bits += 8;
                  }
                  _out -= left;
                  strm.total_out += _out;
                  state.total += _out;
                  if (_out) {
                    strm.adler = state.check = /*UPDATE(state.check, put - _out, _out);*/
                    state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out);
                  }
                  _out = left;
                  if ((state.flags ? hold : zswap32(hold)) !== state.check) {
                    strm.msg = "incorrect data check";
                    state.mode = BAD;
                    break;
                  }
                  hold = 0;
                  bits = 0;
                }
                state.mode = LENGTH;
              /* falls through */
              case LENGTH:
                if (state.wrap && state.flags) {
                  while (bits < 32) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  if (hold !== (state.total & 4294967295)) {
                    strm.msg = "incorrect length check";
                    state.mode = BAD;
                    break;
                  }
                  hold = 0;
                  bits = 0;
                }
                state.mode = DONE;
              /* falls through */
              case DONE:
                ret = Z_STREAM_END;
                break inf_leave;
              case BAD:
                ret = Z_DATA_ERROR;
                break inf_leave;
              case MEM:
                return Z_MEM_ERROR;
              case SYNC:
              /* falls through */
              default:
                return Z_STREAM_ERROR;
            }
          }
        strm.next_out = put;
        strm.avail_out = left;
        strm.next_in = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH)) {
          if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
            state.mode = MEM;
            return Z_MEM_ERROR;
          }
        }
        _in -= strm.avail_in;
        _out -= strm.avail_out;
        strm.total_in += _in;
        strm.total_out += _out;
        state.total += _out;
        if (state.wrap && _out) {
          strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
          state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out);
        }
        strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
        if ((_in === 0 && _out === 0 || flush === Z_FINISH) && ret === Z_OK) {
          ret = Z_BUF_ERROR;
        }
        return ret;
      }
      function inflateEnd(strm) {
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        var state = strm.state;
        if (state.window) {
          state.window = null;
        }
        strm.state = null;
        return Z_OK;
      }
      function inflateGetHeader(strm, head) {
        var state;
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        state = strm.state;
        if ((state.wrap & 2) === 0) {
          return Z_STREAM_ERROR;
        }
        state.head = head;
        head.done = false;
        return Z_OK;
      }
      function inflateSetDictionary(strm, dictionary) {
        var dictLength = dictionary.length;
        var state;
        var dictid;
        var ret;
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        state = strm.state;
        if (state.wrap !== 0 && state.mode !== DICT) {
          return Z_STREAM_ERROR;
        }
        if (state.mode === DICT) {
          dictid = 1;
          dictid = adler32(dictid, dictionary, dictLength, 0);
          if (dictid !== state.check) {
            return Z_DATA_ERROR;
          }
        }
        ret = updatewindow(strm, dictionary, dictLength, dictLength);
        if (ret) {
          state.mode = MEM;
          return Z_MEM_ERROR;
        }
        state.havedict = 1;
        return Z_OK;
      }
      exports.inflateReset = inflateReset;
      exports.inflateReset2 = inflateReset2;
      exports.inflateResetKeep = inflateResetKeep;
      exports.inflateInit = inflateInit;
      exports.inflateInit2 = inflateInit2;
      exports.inflate = inflate;
      exports.inflateEnd = inflateEnd;
      exports.inflateGetHeader = inflateGetHeader;
      exports.inflateSetDictionary = inflateSetDictionary;
      exports.inflateInfo = "pako inflate (from Nodeca project)";
    }
  });

  // node_modules/pako/lib/zlib/constants.js
  var require_constants5 = __commonJS({
    "node_modules/pako/lib/zlib/constants.js"(exports, module) {
      "use strict";
      init_shim();
      module.exports = {
        /* Allowed flush values; see deflate() and inflate() below for details */
        Z_NO_FLUSH: 0,
        Z_PARTIAL_FLUSH: 1,
        Z_SYNC_FLUSH: 2,
        Z_FULL_FLUSH: 3,
        Z_FINISH: 4,
        Z_BLOCK: 5,
        Z_TREES: 6,
        /* Return codes for the compression/decompression functions. Negative values
        * are errors, positive values are used for special but normal events.
        */
        Z_OK: 0,
        Z_STREAM_END: 1,
        Z_NEED_DICT: 2,
        Z_ERRNO: -1,
        Z_STREAM_ERROR: -2,
        Z_DATA_ERROR: -3,
        //Z_MEM_ERROR:     -4,
        Z_BUF_ERROR: -5,
        //Z_VERSION_ERROR: -6,
        /* compression levels */
        Z_NO_COMPRESSION: 0,
        Z_BEST_SPEED: 1,
        Z_BEST_COMPRESSION: 9,
        Z_DEFAULT_COMPRESSION: -1,
        Z_FILTERED: 1,
        Z_HUFFMAN_ONLY: 2,
        Z_RLE: 3,
        Z_FIXED: 4,
        Z_DEFAULT_STRATEGY: 0,
        /* Possible values of the data_type field (though see inflate()) */
        Z_BINARY: 0,
        Z_TEXT: 1,
        //Z_ASCII:                1, // = Z_TEXT (deprecated)
        Z_UNKNOWN: 2,
        /* The deflate compression method */
        Z_DEFLATED: 8
        //Z_NULL:                 null // Use -1 or null inline, depending on var type
      };
    }
  });

  // node_modules/pako/lib/zlib/gzheader.js
  var require_gzheader = __commonJS({
    "node_modules/pako/lib/zlib/gzheader.js"(exports, module) {
      "use strict";
      init_shim();
      function GZheader() {
        this.text = 0;
        this.time = 0;
        this.xflags = 0;
        this.os = 0;
        this.extra = null;
        this.extra_len = 0;
        this.name = "";
        this.comment = "";
        this.hcrc = 0;
        this.done = false;
      }
      module.exports = GZheader;
    }
  });

  // node_modules/pako/lib/inflate.js
  var require_inflate2 = __commonJS({
    "node_modules/pako/lib/inflate.js"(exports) {
      "use strict";
      init_shim();
      var zlib_inflate = require_inflate();
      var utils = require_common();
      var strings = require_strings();
      var c = require_constants5();
      var msg = require_messages();
      var ZStream = require_zstream();
      var GZheader = require_gzheader();
      var toString = Object.prototype.toString;
      function Inflate(options) {
        if (!(this instanceof Inflate)) return new Inflate(options);
        this.options = utils.assign({
          chunkSize: 16384,
          windowBits: 0,
          to: ""
        }, options || {});
        var opt = this.options;
        if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
          opt.windowBits = -opt.windowBits;
          if (opt.windowBits === 0) {
            opt.windowBits = -15;
          }
        }
        if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options && options.windowBits)) {
          opt.windowBits += 32;
        }
        if (opt.windowBits > 15 && opt.windowBits < 48) {
          if ((opt.windowBits & 15) === 0) {
            opt.windowBits |= 15;
          }
        }
        this.err = 0;
        this.msg = "";
        this.ended = false;
        this.chunks = [];
        this.strm = new ZStream();
        this.strm.avail_out = 0;
        var status = zlib_inflate.inflateInit2(
          this.strm,
          opt.windowBits
        );
        if (status !== c.Z_OK) {
          throw new Error(msg[status]);
        }
        this.header = new GZheader();
        zlib_inflate.inflateGetHeader(this.strm, this.header);
        if (opt.dictionary) {
          if (typeof opt.dictionary === "string") {
            opt.dictionary = strings.string2buf(opt.dictionary);
          } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
            opt.dictionary = new Uint8Array(opt.dictionary);
          }
          if (opt.raw) {
            status = zlib_inflate.inflateSetDictionary(this.strm, opt.dictionary);
            if (status !== c.Z_OK) {
              throw new Error(msg[status]);
            }
          }
        }
      }
      Inflate.prototype.push = function(data, mode) {
        var strm = this.strm;
        var chunkSize = this.options.chunkSize;
        var dictionary = this.options.dictionary;
        var status, _mode;
        var next_out_utf8, tail, utf8str;
        var allowBufError = false;
        if (this.ended) {
          return false;
        }
        _mode = mode === ~~mode ? mode : mode === true ? c.Z_FINISH : c.Z_NO_FLUSH;
        if (typeof data === "string") {
          strm.input = strings.binstring2buf(data);
        } else if (toString.call(data) === "[object ArrayBuffer]") {
          strm.input = new Uint8Array(data);
        } else {
          strm.input = data;
        }
        strm.next_in = 0;
        strm.avail_in = strm.input.length;
        do {
          if (strm.avail_out === 0) {
            strm.output = new utils.Buf8(chunkSize);
            strm.next_out = 0;
            strm.avail_out = chunkSize;
          }
          status = zlib_inflate.inflate(strm, c.Z_NO_FLUSH);
          if (status === c.Z_NEED_DICT && dictionary) {
            status = zlib_inflate.inflateSetDictionary(this.strm, dictionary);
          }
          if (status === c.Z_BUF_ERROR && allowBufError === true) {
            status = c.Z_OK;
            allowBufError = false;
          }
          if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
            this.onEnd(status);
            this.ended = true;
            return false;
          }
          if (strm.next_out) {
            if (strm.avail_out === 0 || status === c.Z_STREAM_END || strm.avail_in === 0 && (_mode === c.Z_FINISH || _mode === c.Z_SYNC_FLUSH)) {
              if (this.options.to === "string") {
                next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
                tail = strm.next_out - next_out_utf8;
                utf8str = strings.buf2string(strm.output, next_out_utf8);
                strm.next_out = tail;
                strm.avail_out = chunkSize - tail;
                if (tail) {
                  utils.arraySet(strm.output, strm.output, next_out_utf8, tail, 0);
                }
                this.onData(utf8str);
              } else {
                this.onData(utils.shrinkBuf(strm.output, strm.next_out));
              }
            }
          }
          if (strm.avail_in === 0 && strm.avail_out === 0) {
            allowBufError = true;
          }
        } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== c.Z_STREAM_END);
        if (status === c.Z_STREAM_END) {
          _mode = c.Z_FINISH;
        }
        if (_mode === c.Z_FINISH) {
          status = zlib_inflate.inflateEnd(this.strm);
          this.onEnd(status);
          this.ended = true;
          return status === c.Z_OK;
        }
        if (_mode === c.Z_SYNC_FLUSH) {
          this.onEnd(c.Z_OK);
          strm.avail_out = 0;
          return true;
        }
        return true;
      };
      Inflate.prototype.onData = function(chunk) {
        this.chunks.push(chunk);
      };
      Inflate.prototype.onEnd = function(status) {
        if (status === c.Z_OK) {
          if (this.options.to === "string") {
            this.result = this.chunks.join("");
          } else {
            this.result = utils.flattenChunks(this.chunks);
          }
        }
        this.chunks = [];
        this.err = status;
        this.msg = this.strm.msg;
      };
      function inflate(input, options) {
        var inflator = new Inflate(options);
        inflator.push(input, true);
        if (inflator.err) {
          throw inflator.msg || msg[inflator.err];
        }
        return inflator.result;
      }
      function inflateRaw(input, options) {
        options = options || {};
        options.raw = true;
        return inflate(input, options);
      }
      exports.Inflate = Inflate;
      exports.inflate = inflate;
      exports.inflateRaw = inflateRaw;
      exports.ungzip = inflate;
    }
  });

  // node_modules/pako/index.js
  var require_pako = __commonJS({
    "node_modules/pako/index.js"(exports, module) {
      "use strict";
      init_shim();
      var assign = require_common().assign;
      var deflate = require_deflate2();
      var inflate = require_inflate2();
      var constants = require_constants5();
      var pako = {};
      assign(pako, deflate, inflate, constants);
      module.exports = pako;
    }
  });

  // tools/_zlib-browser.js
  var require_zlib_browser = __commonJS({
    "tools/_zlib-browser.js"(exports, module) {
      "use strict";
      init_shim();
      var pako = require_pako();
      var toBuf = (u8) => typeof import_buffer.Buffer !== "undefined" ? import_buffer.Buffer.from(u8) : u8;
      function input(data) {
        if (data instanceof Uint8Array) return data;
        if (ArrayBuffer.isView(data))
          return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        if (data instanceof ArrayBuffer) return new Uint8Array(data);
        if (typeof data === "string")
          return typeof import_buffer.Buffer !== "undefined" ? import_buffer.Buffer.from(data) : new TextEncoder().encode(data);
        throw new TypeError("zlib: unsupported input type");
      }
      var opts = (o) => o && typeof o.level === "number" ? { level: o.level } : {};
      function inflateSync(data, o) {
        return toBuf(pako.inflate(input(data), opts(o)));
      }
      function deflateSync(data, o) {
        return toBuf(pako.deflate(input(data), opts(o)));
      }
      function inflateRawSync(data, o) {
        return toBuf(pako.inflateRaw(input(data), opts(o)));
      }
      function deflateRawSync(data, o) {
        return toBuf(pako.deflateRaw(input(data), opts(o)));
      }
      function gzipSync(data, o) {
        return toBuf(pako.gzip(input(data), opts(o)));
      }
      function gunzipSync(data) {
        return toBuf(pako.ungzip(input(data)));
      }
      function unzipSync(data) {
        return toBuf(pako.inflate(input(data)));
      }
      var CRC_TABLE = null;
      function crcTable() {
        if (CRC_TABLE) return CRC_TABLE;
        const t = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
          let c = n;
          for (let k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
          t[n] = c >>> 0;
        }
        return CRC_TABLE = t;
      }
      function crc32(data, value) {
        const buf = input(data);
        const t = crcTable();
        let c = (value === void 0 ? 0 : value >>> 0) ^ 4294967295;
        for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 255] ^ c >>> 8;
        return (c ^ 4294967295) >>> 0;
      }
      module.exports = {
        inflateSync,
        deflateSync,
        inflateRawSync,
        deflateRawSync,
        gzipSync,
        gunzipSync,
        unzipSync,
        crc32,
        constants: pako
        // Z_* flags live on pako; rarely needed, cheap to expose
      };
      module.exports.default = module.exports;
    }
  });

  // tools/_canvas-browser.js
  var require_canvas_browser = __commonJS({
    "tools/_canvas-browser.js"() {
      "use strict";
      init_shim();
      throw new Error("@napi-rs/canvas is unavailable in the browser bundle");
    }
  });

  // tools/build-tomb-mod.js
  var require_build_tomb_mod = __commonJS({
    "tools/build-tomb-mod.js"(exports, module) {
      "use strict";
      init_shim();
      var fs = require_fs_browser();
      var path = require_path_browserify();
      var crypto = require_crypto_browser();
      var zlib = require_zlib_browser();
      var _canvas;
      function canvas() {
        if (_canvas === void 0) {
          try {
            _canvas = require_canvas_browser();
          } catch {
            _canvas = null;
          }
        }
        return _canvas;
      }
      var ASSET_SIG = import_buffer.Buffer.from([84, 67, 79, 65, 65, 76]);
      function hashPath(logicalPath) {
        const parts = logicalPath.split(/[/\\]/);
        const fname = parts[parts.length - 1];
        const hex = crypto.createHash("sha256").update(parts.join("/"), "utf8").digest("hex");
        let h = hex.substring(0, 16);
        if (fname.toUpperCase().includes("[BUST]")) h += "[BUST]";
        if (fname.startsWith("!")) h = "!" + h;
        parts[parts.length - 1] = h;
        return parts.join("/");
      }
      function fileMask(hashedRelPath) {
        const fname = decodeURIComponent(hashedRelPath).split("/").pop().toUpperCase();
        let m = 0;
        for (const ch of fname) m = m << 1 ^ ch.charCodeAt(0);
        return m;
      }
      function decodeK9a(buf, logicalRel) {
        const extLen = buf[0];
        let keyByte = buf[1 + extLen];
        const payload = buf.subarray(1 + extLen + 1);
        const base = logicalRel.split("/").pop().replace(/\.[^.]+$/, "");
        let mask = fileMask(base) & 255;
        if (keyByte === 0) keyByte = payload.length;
        const out = import_buffer.Buffer.allocUnsafe(payload.length);
        for (let i = 0; i < payload.length; i++) {
          if (i < keyByte) {
            const b = payload[i];
            out[i] = b ^ mask;
            mask = (mask << 1 ^ b) & 255;
          } else {
            out[i] = payload[i];
          }
        }
        return out;
      }
      function dekit(buf, hashedRelPath) {
        if (buf.length < ASSET_SIG.length + 1) return buf;
        if (!buf.subarray(0, ASSET_SIG.length).equals(ASSET_SIG)) return buf;
        let keyByte = buf[ASSET_SIG.length];
        const payload = buf.subarray(ASSET_SIG.length + 1);
        let mask = fileMask(hashedRelPath) + 1 & 255;
        if (keyByte === 0) keyByte = payload.length;
        const out = import_buffer.Buffer.allocUnsafe(payload.length);
        for (let i = 0; i < payload.length; i++) {
          if (i < keyByte) {
            const b = payload[i];
            out[i] = b ^ mask;
            mask = (mask << 1 ^ b) & 255;
          } else {
            out[i] = payload[i];
          }
        }
        return out;
      }
      function jsonPointerUnescape(token) {
        return token.replace(/~1/g, "/").replace(/~0/g, "~");
      }
      function applyJsonPatch(doc, ops) {
        function locate(pointer) {
          if (pointer === "") return { root: true };
          if (pointer[0] !== "/") throw new Error("bad pointer: " + pointer);
          const tokens = pointer.split("/").slice(1).map(jsonPointerUnescape);
          let parent = doc;
          for (let i = 0; i < tokens.length - 1; i++) {
            const t = tokens[i];
            if (Array.isArray(parent)) {
              parent = parent[t === "-" ? parent.length : Number(t)];
            } else if (parent && typeof parent === "object") {
              parent = parent[t];
            } else {
              throw new Error("path not found: " + pointer);
            }
            if (parent === void 0) throw new Error("path not found: " + pointer);
          }
          return { parent, key: tokens[tokens.length - 1] };
        }
        function getValue(pointer) {
          if (pointer === "") return doc;
          const loc = locate(pointer);
          if (Array.isArray(loc.parent)) {
            return loc.parent[loc.key === "-" ? loc.parent.length : Number(loc.key)];
          }
          return loc.parent[loc.key];
        }
        function arrayIndex(arr, key, allowEnd) {
          const idx = key === "-" ? arr.length : Number(key);
          if (!Number.isInteger(idx) || idx < 0) {
            throw new Error("bad array index: " + key);
          }
          if (allowEnd ? idx > arr.length : idx >= arr.length) {
            throw new Error("array index out of range: " + key);
          }
          return idx;
        }
        function setValue(pointer, value, isAdd) {
          const loc = locate(pointer);
          if (loc.root) {
            doc = value;
            return;
          }
          const { parent, key } = loc;
          if (Array.isArray(parent)) {
            const idx = arrayIndex(parent, key, isAdd);
            if (isAdd) parent.splice(idx, 0, value);
            else parent[idx] = value;
          } else if (parent && typeof parent === "object") {
            parent[key] = value;
          } else {
            throw new Error("cannot set on non-container: " + pointer);
          }
        }
        function removeValue(pointer) {
          const loc = locate(pointer);
          if (loc.root) {
            doc = null;
            return;
          }
          const { parent, key } = loc;
          if (Array.isArray(parent)) {
            parent.splice(arrayIndex(parent, key, false), 1);
          } else if (parent && typeof parent === "object") {
            if (!(key in parent)) throw new Error("remove: missing key " + pointer);
            delete parent[key];
          } else {
            throw new Error("cannot remove from non-container: " + pointer);
          }
        }
        for (const op of ops) {
          if (!op || typeof op.op !== "string") throw new Error("bad op");
          switch (op.op) {
            case "add":
              setValue(op.path, op.value, true);
              break;
            case "replace":
              setValue(op.path, op.value, false);
              break;
            case "remove":
              removeValue(op.path);
              break;
            case "move": {
              const v = getValue(op.from);
              removeValue(op.from);
              setValue(op.path, v, true);
              break;
            }
            case "copy": {
              const v = getValue(op.from);
              setValue(op.path, JSON.parse(JSON.stringify(v)), true);
              break;
            }
            case "test": {
              const v = getValue(op.path);
              if (JSON.stringify(v) !== JSON.stringify(op.value)) {
                throw new Error("test failed at " + op.path);
              }
              break;
            }
            default:
              throw new Error("unsupported op: " + op.op);
          }
        }
        return doc;
      }
      function deepMerge(dst, src) {
        if (typeof dst !== "object" || dst === null || Array.isArray(dst) || typeof src !== "object" || src === null || Array.isArray(src)) {
          return src;
        }
        for (const key of Object.keys(src)) {
          dst[key] = deepMerge(dst[key], src[key]);
        }
        return dst;
      }
      var LOC_SIG = "00000NEMLEI00000";
      function parseLoc(buf) {
        if (buf.length >= LOC_SIG.length + 4 && buf.subarray(0, LOC_SIG.length).toString("latin1") === LOC_SIG) {
          const off = LOC_SIG.length;
          const len = buf.readUInt32LE(off);
          return JSON.parse(buf.subarray(off + 4, off + 4 + len).toString("utf8"));
        }
        return JSON.parse(buf.toString("utf8"));
      }
      function isDir(p) {
        try {
          return fs.statSync(p).isDirectory();
        } catch {
          return false;
        }
      }
      function isFile(p) {
        try {
          return fs.statSync(p).isFile();
        } catch {
          return false;
        }
      }
      function contentRoot(dir) {
        return isDir(path.join(dir, "www")) ? path.join(dir, "www") : dir;
      }
      function walk(root) {
        const out = [];
        (function rec(abs, rel) {
          for (const name of fs.readdirSync(abs)) {
            const childAbs = path.join(abs, name);
            const childRel = rel ? rel + "/" + name : name;
            if (isDir(childAbs)) rec(childAbs, childRel);
            else out.push(childRel);
          }
        })(root, "");
        return out;
      }
      function writeOut(outWww, logical, buf) {
        const dest = path.join(outWww, logical);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, buf);
      }
      function resolveBaseText(baseRoot, logicalRel) {
        const buf = resolveBaseBytes(baseRoot, logicalRel);
        return buf === null ? null : buf.toString("utf8");
      }
      function resolveBaseBytes(baseRoot, logicalRel) {
        const plain = path.join(baseRoot, logicalRel);
        if (isFile(plain)) return fs.readFileSync(plain);
        const hashed = hashPath(logicalRel);
        const enc = path.join(baseRoot, hashed);
        if (isFile(enc)) return dekit(fs.readFileSync(enc), hashed);
        const k9a = path.join(baseRoot, logicalRel.replace(/\.[^./]+$/, ".k9a"));
        if (isFile(k9a)) return decodeK9a(fs.readFileSync(k9a), logicalRel);
        return null;
      }
      function baseLogical(absPath, relPath) {
        if (!/\.k9a$/i.test(relPath)) return relPath;
        const fd = fs.openSync(absPath, "r");
        try {
          const head = import_buffer.Buffer.alloc(1);
          fs.readSync(fd, head, 0, 1, 0);
          const extLen = head[0];
          const extBuf = import_buffer.Buffer.alloc(extLen);
          fs.readSync(fd, extBuf, 0, extLen, 1);
          return relPath.replace(/\.k9a$/i, "." + extBuf.toString("latin1"));
        } finally {
          fs.closeSync(fd);
        }
      }
      function decodeBaseFile(absPath, relPath) {
        const buf = fs.readFileSync(absPath);
        if (/\.k9a$/i.test(relPath)) {
          const extLen = buf[0];
          const ext = buf.subarray(1, 1 + extLen).toString("latin1");
          const logical = relPath.replace(/\.k9a$/i, "." + ext);
          return { logical, content: decodeK9a(buf, logical), verbatim: false };
        }
        if (buf.length >= ASSET_SIG.length + 1 && buf.subarray(0, ASSET_SIG.length).equals(ASSET_SIG)) {
          return { logical: relPath, content: buf, verbatim: true };
        }
        return { logical: relPath, content: buf, verbatim: false };
      }
      var TILE = 16;
      async function applyOlid(basePng, olidBufs, debug) {
        const { createCanvas, loadImage, ImageData } = canvas();
        const baseImg = await loadImage(basePng);
        let cvs, ctx;
        let firstW, firstH;
        const touchedTiles = debug ? /* @__PURE__ */ new Set() : null;
        for (const delta of olidBufs) {
          const dv = new DataView(delta.buffer, delta.byteOffset, delta.byteLength);
          if (dv.getUint32(0) !== 4278179848 || dv.getUint16(4) !== 56609) {
            throw new Error("invalid .olid header");
          }
          const W = dv.getUint32(6);
          const H = dv.getUint32(10);
          if (firstW === void 0) {
            firstW = W;
            firstH = H;
          }
          if (!ctx) {
            cvs = createCanvas(
              Math.ceil(W / TILE) * TILE,
              Math.ceil(H / TILE) * TILE
            );
            ctx = cvs.getContext("2d");
            ctx.drawImage(baseImg, 0, 0);
          }
          const compLen = dv.getUint32(22);
          const stream = zlib.inflateSync(delta.subarray(26, 26 + compLen));
          const sdv = new DataView(
            stream.buffer,
            stream.byteOffset,
            stream.byteLength
          );
          let p = 0;
          while (p < stream.byteLength) {
            const tx = sdv.getUint16(p);
            const ty = sdv.getUint16(p + 2);
            const len = sdv.getUint32(p + 4);
            p += 8;
            const tile = stream.subarray(p, p + len);
            p += len;
            const src = ctx.getImageData(tx * TILE, ty * TILE, TILE, TILE);
            const u32 = new Uint32Array(src.data.buffer.slice(0));
            let dp = 32;
            for (let i = 0; i < TILE * TILE; i++) {
              if ((tile[i >> 3] >> i % 8 & 1) === 1) {
                u32[i] = (tile[dp] << 24) + (tile[dp + 1] << 16) + (tile[dp + 2] << 8) + tile[dp + 3];
                dp += 4;
              }
            }
            const out = new ImageData(new Uint8ClampedArray(u32.buffer), TILE, TILE);
            ctx.putImageData(out, tx * TILE, ty * TILE);
            if (touchedTiles) touchedTiles.add(tx + "," + ty);
          }
        }
        if (!ctx) throw new Error("no .olid deltas supplied");
        if (cvs.width !== firstW || cvs.height !== firstH) {
          const fc = createCanvas(firstW, firstH);
          fc.getContext("2d").drawImage(cvs, 0, 0);
          cvs = fc;
        }
        if (debug) {
          const baseCvs = createCanvas(firstW, firstH);
          baseCvs.getContext("2d").drawImage(baseImg, 0, 0);
          debug.emit("base", baseCvs);
          debug.emit("result", cvs);
          const mapCvs = createCanvas(firstW, firstH);
          const mctx = mapCvs.getContext("2d");
          mctx.drawImage(cvs, 0, 0);
          mctx.fillStyle = "rgba(255,0,0,0.4)";
          for (const key of touchedTiles) {
            const [tx, ty] = key.split(",").map(Number);
            mctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
          }
          debug.emit("changed_tiles", mapCvs);
        }
        return cvs.toBuffer("image/png");
      }
      function mIdentity() {
        return { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
      }
      function mApply(m, px, py) {
        return { x: m.a * px + m.c * py + m.tx, y: m.b * px + m.d * py + m.ty };
      }
      function mAppend(m, n) {
        const a1 = m.a, b1 = m.b, c1 = m.c, d1 = m.d;
        return {
          a: n.a * a1 + n.b * c1,
          b: n.a * b1 + n.b * d1,
          c: n.c * a1 + n.d * c1,
          d: n.c * b1 + n.d * d1,
          tx: n.tx * a1 + n.ty * c1 + m.tx,
          ty: n.tx * b1 + n.ty * d1 + m.ty
        };
      }
      function mFromArray(arr) {
        return { a: arr[0], b: arr[3], c: arr[1], d: arr[4], tx: arr[2], ty: arr[5] };
      }
      function cmHue(rotationDeg) {
        const r = rotationDeg / 180 * Math.PI;
        const c = Math.cos(r);
        const s = Math.sin(r);
        const a = 1 / 3;
        const sq = Math.sqrt(1 / 3);
        return [
          c + (1 - c) * a,
          a * (1 - c) - sq * s,
          a * (1 - c) + sq * s,
          0,
          0,
          a * (1 - c) + sq * s,
          c + a * (1 - c),
          a * (1 - c) - sq * s,
          0,
          0,
          a * (1 - c) - sq * s,
          a * (1 - c) + sq * s,
          c + a * (1 - c),
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ];
      }
      function cmSaturate(amount) {
        const x = amount * 2 / 3 + 1;
        const y = (x - 1) * -0.5;
        return [x, y, y, 0, 0, y, x, y, 0, 0, y, y, x, 0, 0, 0, 0, 0, 1, 0];
      }
      function cmBrightness(b) {
        return [b, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, 1, 0];
      }
      function applyColorMatrix(data, m) {
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i] / 255;
          const g = data[i + 1] / 255;
          const b = data[i + 2] / 255;
          const a = data[i + 3] / 255;
          const nr = m[0] * r + m[1] * g + m[2] * b + m[3] * a + m[4];
          const ng = m[5] * r + m[6] * g + m[7] * b + m[8] * a + m[9];
          const nb = m[10] * r + m[11] * g + m[12] * b + m[13] * a + m[14];
          const na = m[15] * r + m[16] * g + m[17] * b + m[18] * a + m[19];
          data[i] = Math.max(0, Math.min(255, Math.round(nr * 255)));
          data[i + 1] = Math.max(0, Math.min(255, Math.round(ng * 255)));
          data[i + 2] = Math.max(0, Math.min(255, Math.round(nb * 255)));
          data[i + 3] = Math.max(0, Math.min(255, Math.round(na * 255)));
        }
      }
      function hslAdjustments(instr) {
        const gimpH = instr.hue || 0;
        const gimpS = instr.saturation || 0;
        const gimpL = instr.lightness || 1;
        return {
          hue: gimpH,
          saturation: 0 + 0.9 * (gimpS / 100) - 0.72 * (gimpL / 100),
          brightness: 1 + 0.581 * (gimpL / 100)
        };
      }
      function calcBoundingRect(img) {
        let minX = img.width;
        let minY = img.height;
        let maxX = 0;
        let maxY = 0;
        const d = img.data;
        const w = img.width;
        for (let i = 0; i < d.length; i += 4) {
          const xPos = (i + 4) / 4 % w;
          const yPos = Math.floor((i + 4) / 4 / w);
          if (d[i] > 0) {
            if (xPos < minX) minX = xPos;
            if (xPos > maxX) maxX = xPos;
            if (yPos < minY) minY = yPos;
            if (yPos > maxY) maxY = yPos;
          }
        }
        return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
      }
      function calcProjectionOffset(m, w, h) {
        const corners = [
          { x: 0, y: 0 },
          { x: w, y: 0 },
          { x: 0, y: h },
          { x: w, y: h }
        ].map((p) => mApply(m, p.x, p.y));
        let isFlippedHorizontally = false;
        let isFlippedVertically = false;
        let minX = null;
        let minY = null;
        for (let index = 0; index < corners.length; index++) {
          const p = corners[index];
          if (minX == null) {
            minX = p.x;
            minY = p.y;
          } else {
            if (p.x < minX) {
              minX = p.x;
              isFlippedHorizontally = index === 1 || index === 3;
            }
            if (p.y < minY) {
              minY = p.Y;
              if (index === 2 || index === 3) isFlippedVertically = true;
              else isFlippedHorizontally = false;
            }
          }
        }
        return {
          x: Math.round(minX),
          y: Math.round(minY),
          isFlippedHorizontally,
          isFlippedVertically
        };
      }
      var BLEND_MAP = {
        NORMAL: "source-over",
        ADD: "lighter",
        MULTIPLY: "multiply",
        SCREEN: "screen",
        OVERLAY: "overlay",
        DARKEN: "darken",
        LIGHTEN: "lighten",
        COLOR_DODGE: "color-dodge",
        COLOR_BURN: "color-burn",
        HARD_LIGHT: "hard-light",
        SOFT_LIGHT: "soft-light",
        DIFFERENCE: "difference",
        EXCLUSION: "exclusion"
      };
      function makeDebugSink(debugRoot, ...segments) {
        if (!debugRoot) return null;
        const { createCanvas, ImageData } = canvas();
        const dir = path.join(debugRoot, ...segments);
        fs.mkdirSync(dir, { recursive: true });
        let seq = 0;
        function toPng(src) {
          if (src && typeof src.toBuffer === "function")
            return src.toBuffer("image/png");
          const c = createCanvas(src.width, src.height);
          c.getContext("2d").putImageData(
            new ImageData(new Uint8ClampedArray(src.data), src.width, src.height),
            0,
            0
          );
          return c.toBuffer("image/png");
        }
        return {
          dir,
          /** Write `src` as <NN>_<label>.png (NN auto-increments). */
          step(label, src) {
            const name = String(seq++).padStart(2, "0") + "_" + label + ".png";
            fs.writeFileSync(path.join(dir, name), toPng(src));
          },
          /** Write `src` as <name>.png with no sequence prefix. */
          emit(name, src) {
            fs.writeFileSync(path.join(dir, name + ".png"), toPng(src));
          }
        };
      }
      function safeName(s) {
        return String(s).replace(/[^\w.-]+/g, "_");
      }
      function buildCanopyImage(instr, sources, masks, patchBytes, debug) {
        const { createCanvas, ImageData } = canvas();
        const out = createCanvas(instr.imgSize.width, instr.imgSize.height);
        const octx = out.getContext("2d");
        if (debug) {
          for (const [key, src] of sources) {
            debug.emit("source_" + safeName(key), src.canvas || src);
          }
          for (const [key, mask] of masks) {
            debug.emit("mask_" + safeName(key), mask);
          }
        }
        let sel = null;
        function selectRect(imgName, x, y, w, h) {
          const src = sources.get(imgName);
          x = x || 0;
          y = y || 0;
          w = w || src.width;
          h = h || src.height;
          const c = createCanvas(w, h);
          c.getContext("2d").putImageData(
            new ImageData(
              new Uint8ClampedArray(src.ctx.getImageData(x, y, w, h).data),
              w,
              h
            ),
            0,
            0
          );
          sel = { canvas: c, width: w, height: h, maskRect: null };
        }
        function selectMask(imgName, maskName) {
          const src = sources.get(imgName);
          const mask = masks.get(maskName);
          const w = src.width;
          const h = src.height;
          const id = src.ctx.getImageData(0, 0, w, h);
          const d = id.data;
          const md = mask.data;
          const mw = mask.width;
          const mh = mask.height;
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const di = (y * w + x) * 4;
              let f = 0;
              if (x < mw && y < mh) {
                const mi = (y * mw + x) * 4;
                f = md[mi] * md[mi + 3] / (255 * 255);
              }
              d[di + 3] = Math.round(d[di + 3] * f);
            }
          }
          const c = createCanvas(w, h);
          c.getContext("2d").putImageData(id, 0, 0);
          sel = { canvas: c, width: w, height: h, maskRect: calcBoundingRect(mask) };
        }
        let transform = mIdentity();
        let colorAdj = null;
        let alpha = null;
        let blend = null;
        function paste(ix, iy) {
          ix = ix || 0;
          iy = iy || 0;
          const proj = calcProjectionOffset(transform, sel.width, sel.height);
          let maskOffX = 0;
          let maskOffY = 0;
          if (sel.maskRect) {
            let mx = sel.maskRect.x;
            let my = sel.maskRect.y;
            if (proj.isFlippedHorizontally) {
              mx = sel.maskRect.x + sel.maskRect.width - sel.width;
            }
            if (proj.isFlippedVertically) {
              my = sel.maskRect.y + sel.maskRect.height - sel.height;
            }
            const pm = mApply(transform, mx, my);
            maskOffX = pm.x;
            maskOffY = pm.y;
          }
          const m = {
            ...transform,
            tx: transform.tx + ix - proj.x - maskOffX,
            ty: transform.ty + iy - proj.y - maskOffY
          };
          let spriteCanvas = sel.canvas;
          if (colorAdj) {
            const sc = createCanvas(sel.width, sel.height);
            const sctx = sc.getContext("2d");
            sctx.drawImage(sel.canvas, 0, 0);
            const id = sctx.getImageData(0, 0, sel.width, sel.height);
            applyColorMatrix(id.data, cmHue(colorAdj.hue));
            applyColorMatrix(id.data, cmSaturate(colorAdj.saturation));
            applyColorMatrix(id.data, cmBrightness(colorAdj.brightness));
            sctx.putImageData(id, 0, 0);
            spriteCanvas = sc;
          }
          const integer = Math.abs(m.a) === 1 && Math.abs(m.d) === 1 && m.b === 0 && m.c === 0 && Number.isInteger(m.tx) && Number.isInteger(m.ty);
          octx.save();
          octx.globalAlpha = alpha == null ? 1 : alpha;
          octx.globalCompositeOperation = blend || "source-over";
          if (integer) {
            octx.setTransform(m.a, m.b, m.c, m.d, m.tx, m.ty);
            octx.imageSmoothingEnabled = false;
            octx.drawImage(spriteCanvas, 0, 0);
          } else {
            const tmp = resampleSpritePremultiplied(
              spriteCanvas,
              m,
              out.width,
              out.height
            );
            if (tmp) octx.drawImage(tmp, 0, 0);
          }
          octx.restore();
        }
        function resampleSpritePremultiplied(spriteCanvas, m, W, H) {
          const { createCanvas: createCanvas2, ImageData: ImageData2 } = canvas();
          const sw = spriteCanvas.width;
          const sh = spriteCanvas.height;
          const src = spriteCanvas.getContext("2d").getImageData(0, 0, sw, sh).data;
          const pr = new Float64Array(sw * sh);
          const pg = new Float64Array(sw * sh);
          const pb = new Float64Array(sw * sh);
          const pa = new Float64Array(sw * sh);
          for (let i = 0, p = 0; i < src.length; i += 4, p++) {
            const a = src[i + 3];
            const f = a / 255;
            pr[p] = src[i] * f;
            pg[p] = src[i + 1] * f;
            pb[p] = src[i + 2] * f;
            pa[p] = a;
          }
          const corners = [
            mApply(m, 0, 0),
            mApply(m, sw, 0),
            mApply(m, 0, sh),
            mApply(m, sw, sh)
          ];
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (const c of corners) {
            if (c.x < minX) minX = c.x;
            if (c.y < minY) minY = c.y;
            if (c.x > maxX) maxX = c.x;
            if (c.y > maxY) maxY = c.y;
          }
          const x0 = Math.max(0, Math.floor(minX));
          const y0 = Math.max(0, Math.floor(minY));
          const x1 = Math.min(W, Math.ceil(maxX));
          const y1 = Math.min(H, Math.ceil(maxY));
          if (x1 <= x0 || y1 <= y0) return null;
          const det = m.a * m.d - m.b * m.c;
          if (!det) return null;
          const ia = m.d / det, ib = -m.b / det, ic = -m.c / det, id_ = m.a / det;
          const dst = createCanvas2(W, H);
          const dstCtx = dst.getContext("2d");
          const img = new ImageData2(W, H);
          const o = img.data;
          for (let dy = y0; dy < y1; dy++) {
            for (let dx = x0; dx < x1; dx++) {
              const rx = dx + 0.5 - m.tx;
              const ry = dy + 0.5 - m.ty;
              const sx = ia * rx + ic * ry - 0.5;
              const sy = ib * rx + id_ * ry - 0.5;
              const fx = Math.floor(sx);
              const fy = Math.floor(sy);
              const wx = sx - fx;
              const wy = sy - fy;
              let ar = 0, ag = 0, ab = 0, aa = 0;
              for (let j = 0; j < 2; j++) {
                const yy = fy + j;
                if (yy < 0 || yy >= sh) continue;
                const wyj = j ? wy : 1 - wy;
                for (let k = 0; k < 2; k++) {
                  const xx = fx + k;
                  if (xx < 0 || xx >= sw) continue;
                  const w = wyj * (k ? wx : 1 - wx);
                  if (!w) continue;
                  const p = yy * sw + xx;
                  ar += pr[p] * w;
                  ag += pg[p] * w;
                  ab += pb[p] * w;
                  aa += pa[p] * w;
                }
              }
              if (aa <= 0) continue;
              const di = (dy * W + dx) * 4;
              const inv = 255 / aa;
              o[di] = Math.min(255, Math.round(ar * inv));
              o[di + 1] = Math.min(255, Math.round(ag * inv));
              o[di + 2] = Math.min(255, Math.round(ab * inv));
              o[di + 3] = Math.round(aa);
            }
          }
          dstCtx.putImageData(img, 0, 0);
          return dst;
        }
        for (const sectionKey of Object.keys(instr.sections)) {
          for (const ins of instr.sections[sectionKey]) {
            const action = ins.action.toUpperCase();
            switch (action) {
              case "SELECT_RECT":
                selectRect(ins.imgName, ins.x, ins.y, ins.width, ins.height);
                transform = mIdentity();
                colorAdj = null;
                alpha = null;
                blend = null;
                if (debug) {
                  debug.step(
                    safeName(sectionKey) + "_selectRect_" + safeName(ins.imgName),
                    sel.canvas
                  );
                }
                break;
              case "SELECT_MASK":
                selectMask(ins.imgName, ins.maskName);
                transform = mIdentity();
                colorAdj = null;
                alpha = null;
                blend = null;
                if (debug) {
                  debug.step(
                    safeName(sectionKey) + "_selectMask_" + safeName(ins.imgName),
                    sel.canvas
                  );
                }
                break;
              case "PASTE":
                paste(ins.x, ins.y);
                if (debug) debug.step(safeName(sectionKey) + "_pasted", out);
                break;
              case "RESET_PROJECTIONS":
                transform = mIdentity();
                colorAdj = null;
                break;
              case "TRANSFORM":
                transform = mAppend(transform, mFromArray(ins.matrix));
                break;
              case "FLIP":
                if (ins.direction.toLowerCase() === "horizontal") {
                  transform = mAppend(transform, mFromArray([-1, 0, 0, 0, 1, 0]));
                } else if (ins.direction.toLowerCase() === "vertical") {
                  transform = mAppend(transform, mFromArray([1, 0, 0, 0, -1, 0]));
                } else {
                  throw new Error("FLIP direction invalid: " + ins.direction);
                }
                break;
              case "SCALE":
                transform = mAppend(
                  transform,
                  mFromArray([ins.scalefactor, 0, 0, 0, ins.scalefactor, 0])
                );
                break;
              case "ADJUST_HSL":
                colorAdj = hslAdjustments(ins);
                break;
              case "ALPHA":
                alpha = ins.multiplier;
                break;
              case "BLEND_MODE":
                blend = BLEND_MAP[ins.blendMode.toUpperCase()] || "source-over";
                break;
              default:
                throw new Error("unknown CanopyImageBuilder action: " + ins.action);
            }
          }
        }
        {
          const id = octx.getImageData(0, 0, out.width, out.height);
          const d = id.data;
          if (debug) debug.emit("base_raw", id);
          for (let i = 0; i < d.length; i += 4) {
            const a = d[i + 3];
            d[i] = Math.round(d[i] * a / 255);
            d[i + 1] = Math.round(d[i + 1] * a / 255);
            d[i + 2] = Math.round(d[i + 2] * a / 255);
          }
          if (debug) debug.emit("base_pixi", id);
          if (debug && patchBytes)
            emitPatchDebug(debug, patchBytes, out.width, out.height);
          if (patchBytes) {
            const n = Math.min(d.length, patchBytes.length);
            for (let i = 0; i + 3 < n; i += 4) {
              if (d[i + 3] === 0 && patchBytes[i] === 0 && patchBytes[i + 1] === 0 && patchBytes[i + 2] === 0 && patchBytes[i + 3] >= 128) {
                d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0;
              } else {
                d[i] = patchBytes[i] + d[i] & 255;
                d[i + 1] = patchBytes[i + 1] + d[i + 1] & 255;
                d[i + 2] = patchBytes[i + 2] + d[i + 2] & 255;
                d[i + 3] = patchBytes[i + 3] + d[i + 3] & 255;
              }
            }
          }
          octx.putImageData(id, 0, 0);
        }
        if (debug) debug.emit("output", out);
        return out.toBuffer("image/png");
      }
      function emitPatchDebug(debug, patch, w, h) {
        const n = w * h * 4;
        const rgb = new Uint8ClampedArray(n);
        const alpha = new Uint8ClampedArray(n);
        const touched = new Uint8ClampedArray(n);
        const signed = (b) => b > 127 ? b - 256 : b;
        for (let i = 0; i + 3 < n; i += 4) {
          const dr = signed(patch[i]);
          const dg = signed(patch[i + 1]);
          const db = signed(patch[i + 2]);
          const da = signed(patch[i + 3]);
          rgb[i] = 128 + dr;
          rgb[i + 1] = 128 + dg;
          rgb[i + 2] = 128 + db;
          rgb[i + 3] = 255;
          alpha[i] = alpha[i + 1] = alpha[i + 2] = 128 + da;
          alpha[i + 3] = 255;
          const hit = (patch[i] | patch[i + 1] | patch[i + 2] | patch[i + 3]) !== 0;
          touched[i] = touched[i + 1] = touched[i + 2] = hit ? 255 : 0;
          touched[i + 3] = 255;
        }
        debug.emit("patch_rgb", { data: rgb, width: w, height: h });
        debug.emit("patch_alpha", { data: alpha, width: w, height: h });
        debug.emit("patch_touched", { data: touched, width: w, height: h });
      }
      async function loadCanopySource(baseRoot, srcPath) {
        const { createCanvas, loadImage } = canvas();
        const rel = srcPath.replace(/^\//, "");
        let bytes = null;
        const abs = path.join(baseRoot, rel);
        if (/\.k9a$/i.test(rel) && isFile(abs)) {
          bytes = decodeK9a(fs.readFileSync(abs), rel);
        } else {
          bytes = resolveBaseBytes(baseRoot, rel);
        }
        if (bytes === null) throw new Error("source not found in base: " + srcPath);
        const img = await loadImage(bytes);
        const c = createCanvas(img.width, img.height);
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0);
        return { canvas: c, ctx, width: img.width, height: img.height };
      }
      async function loadLocalImageData(absPath) {
        const { createCanvas, loadImage } = canvas();
        const img = await loadImage(fs.readFileSync(absPath));
        const c = createCanvas(img.width, img.height);
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, img.width, img.height);
      }
      var FILE_CATEGORIES = [
        "assets",
        "dataDeltas",
        "imageDeltas",
        "languages",
        "plugins"
      ];
      var BUILD_TIME_PLUGINS = /* @__PURE__ */ new Set(["CanopyImageBuilder"]);
      function extractPluginParams(src) {
        const params = {};
        let current = null;
        for (const line of src.split(/\r?\n/)) {
          const pm = line.match(/^\s*\*?\s*@param\s+(.+?)\s*$/);
          if (pm) {
            current = pm[1];
            if (!(current in params)) params[current] = "";
            continue;
          }
          const dm = line.match(/^\s*\*?\s*@default\s?(.*)$/);
          if (dm && current !== null) params[current] = dm[1].trim();
        }
        return params;
      }
      function existingPluginNames(body) {
        const names = /* @__PURE__ */ new Set();
        try {
          const arr = JSON.parse("[" + body.replace(/,\s*$/, "") + "]");
          for (const e of arr) if (e && e.name) names.add(e.name);
          return names;
        } catch {
          for (const m of body.matchAll(/"name"\s*:\s*"([^"]+)"/g)) names.add(m[1]);
          return names;
        }
      }
      function registerPlugins(outWww, baseRoot, plugins, failures) {
        const failAll = (reason) => {
          for (const p of plugins) {
            failures.push({ rel: "js/plugins/" + p.name + ".js", reason });
          }
        };
        const outPluginsJs = path.join(outWww, "js/plugins.js");
        const text = isFile(outPluginsJs) ? fs.readFileSync(outPluginsJs, "utf8") : resolveBaseText(baseRoot, "js/plugins.js");
        if (text == null) {
          return failAll("cannot register plugin: js/plugins.js not found");
        }
        const open = text.match(/\$plugins\s*=\s*\[/);
        const closeIdx = text.lastIndexOf("]");
        if (!open || closeIdx <= open.index + open[0].length - 1) {
          return failAll("cannot register plugin: $plugins array not found");
        }
        const bodyStart = open.index + open[0].length;
        const body = text.slice(bodyStart, closeIdx);
        const present = existingPluginNames(body);
        const toAdd = plugins.filter((p) => !present.has(p.name));
        if (!toAdd.length) return;
        const entries = toAdd.map(
          (p) => JSON.stringify({
            name: p.name,
            status: true,
            description: "",
            parameters: p.params
          })
        ).join(",\n");
        let head = text.slice(0, closeIdx).replace(/\s+$/, "");
        if (!head.endsWith("[") && !head.endsWith(",")) head += ",";
        const rebuilt = head + "\n" + entries + "\n" + text.slice(closeIdx);
        writeOut(outWww, "js/plugins.js", import_buffer.Buffer.from(rebuilt, "utf8"));
      }
      function assembleMod(diffDir, overlayDirs) {
        const layers = [diffDir, ...overlayDirs].map((dir) => {
          const root = contentRoot(dir);
          const manifestPath = isFile(path.join(dir, "mod.json")) ? path.join(dir, "mod.json") : isFile(path.join(root, "mod.json")) ? path.join(root, "mod.json") : null;
          let manifest = null;
          if (manifestPath) {
            manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
          }
          return { dir, root, manifest };
        });
        const anyManifest = layers.some((l) => l.manifest);
        if (!anyManifest) {
          for (const layer of layers) {
            layer.manifest = { files: { dataDeltas: [], assets: [] } };
            for (const rel of walk(layer.root)) {
              if (/\.jsond$/i.test(rel)) layer.manifest.files.dataDeltas.push(rel);
              else layer.manifest.files.assets.push(rel);
            }
          }
        }
        const merged = { files: {} };
        for (const cat of FILE_CATEGORIES) merged.files[cat] = [];
        for (const layer of layers) {
          if (!layer.manifest || !layer.manifest.files) continue;
          for (const cat of FILE_CATEGORIES) {
            for (const f of layer.manifest.files[cat] || []) {
              if (!merged.files[cat].includes(f)) merged.files[cat].push(f);
            }
          }
          for (const k of ["id", "name", "version", "authors", "description"]) {
            if (merged[k] === void 0 && layer.manifest[k] !== void 0) {
              merged[k] = layer.manifest[k];
            }
          }
        }
        function resolve(relPath) {
          for (let i = layers.length - 1; i >= 0; i--) {
            const abs = path.join(layers[i].root, relPath);
            if (isFile(abs)) return abs;
          }
          return null;
        }
        function resolveAll(relPath) {
          const out = [];
          for (const layer of layers) {
            const abs = path.join(layer.root, relPath);
            if (isFile(abs)) out.push(abs);
          }
          return out;
        }
        function canopyInputDirs() {
          const dirs = [];
          for (const layer of layers) {
            const cand = path.join(layer.root, "canopyimagebuilder", "input");
            if (isDir(cand)) dirs.push(cand);
          }
          return dirs;
        }
        return { manifest: merged, layers, resolve, resolveAll, canopyInputDirs };
      }
      async function build(opts) {
        const baseRoot = contentRoot(opts.base);
        const outWww = path.join(opts.out, "www");
        const mod = assembleMod(opts.diff, opts.overlays);
        const files = mod.manifest.files;
        const haveCanvas = !!canvas();
        const stats = {
          base: 0,
          verbatim: 0,
          assets: 0,
          dataDeltas: 0,
          imageDeltas: 0,
          canopy: 0,
          languages: 0,
          plugins: 0,
          pluginsSkipped: 0
        };
        const failures = [];
        const assetSet = new Set(files.assets.map((p) => p.replace(/^\//, "")));
        const dataTargets = /* @__PURE__ */ new Map();
        for (const d of files.dataDeltas) {
          dataTargets.set(d.replace(/^\//, "").replace(/\.jsond$/i, ".json"), d);
        }
        const patchedData = /* @__PURE__ */ new Map();
        for (const [target, rel] of dataTargets) {
          const baseText = resolveBaseText(baseRoot, target);
          if (baseText === null) {
            failures.push({ rel, reason: "base file not found: " + target });
            continue;
          }
          const patchAbs = mod.resolve(rel);
          if (!patchAbs) {
            failures.push({ rel, reason: "delta file missing from mod" });
            continue;
          }
          try {
            const baseObj = JSON.parse(baseText);
            const ops = JSON.parse(fs.readFileSync(patchAbs, "utf8"));
            if (!Array.isArray(ops)) throw new Error("patch is not an array of ops");
            const merged = applyJsonPatch(baseObj, ops);
            patchedData.set(
              target,
              import_buffer.Buffer.from(
                opts.pretty ? JSON.stringify(merged, null, 2) : JSON.stringify(merged),
                "utf8"
              )
            );
          } catch (e) {
            failures.push({ rel, reason: "patch failed: " + e.message });
          }
        }
        if (failures.length && !opts.force) {
          reportFailures(failures);
          throw new Error(
            "Aborting without writing. The base game likely does not match the version this mod targets. Point the base at the correct version (old_game for Side Dishes), or pass --force to write what succeeds."
          );
        }
        if (!opts.thin) {
          for (const rel of walk(baseRoot)) {
            const absPath = path.join(baseRoot, rel);
            const logical = baseLogical(absPath, rel);
            if (assetSet.has(logical)) continue;
            if (patchedData.has(logical)) {
              writeOut(outWww, logical, patchedData.get(logical));
              stats.dataDeltas++;
              continue;
            }
            const dec = decodeBaseFile(absPath, rel);
            if (dec.verbatim) {
              const dest = path.join(outWww, rel);
              fs.mkdirSync(path.dirname(dest), { recursive: true });
              fs.copyFileSync(absPath, dest);
              stats.verbatim++;
            } else {
              writeOut(outWww, dec.logical, dec.content);
              stats.base++;
            }
          }
        } else {
          for (const [logical, buf] of patchedData) {
            writeOut(outWww, logical, buf);
            stats.dataDeltas++;
          }
        }
        for (const rel of files.assets) {
          const logical = rel.replace(/^\//, "");
          const abs = mod.resolve(logical);
          if (!abs) {
            failures.push({ rel, reason: "asset missing from mod" });
            continue;
          }
          writeOut(outWww, logical, fs.readFileSync(abs));
          stats.assets++;
        }
        const runtimePlugins = [];
        for (const rel of files.plugins) {
          const logical = rel.replace(/^\//, "");
          const name = path.basename(logical).replace(/\.js$/i, "");
          if (BUILD_TIME_PLUGINS.has(name)) {
            stats.pluginsSkipped++;
            continue;
          }
          const abs = mod.resolve(logical);
          if (!abs) {
            failures.push({ rel, reason: "plugin missing from mod" });
            continue;
          }
          const src = fs.readFileSync(abs);
          writeOut(outWww, logical, src);
          runtimePlugins.push({
            name,
            params: extractPluginParams(src.toString("utf8"))
          });
          stats.plugins++;
        }
        if (runtimePlugins.length) {
          registerPlugins(outWww, baseRoot, runtimePlugins, failures);
        }
        if (files.imageDeltas.length) {
          if (!haveCanvas) {
            warnNoCanvas("imageDeltas");
          } else {
            for (const rel of files.imageDeltas) {
              const logical = rel.replace(/^\//, "");
              const targetLogical = logical.replace(/\.olid$/i, "");
              const olidAbs = mod.resolve(logical);
              if (!olidAbs) {
                failures.push({ rel, reason: "olid missing from mod" });
                continue;
              }
              let basePng = null;
              const written = path.join(outWww, targetLogical);
              if (isFile(written)) basePng = fs.readFileSync(written);
              else basePng = resolveBaseBytes(baseRoot, targetLogical);
              if (basePng === null) {
                failures.push({
                  rel,
                  reason: "base image not found: " + targetLogical
                });
                continue;
              }
              try {
                const olidDebug = makeDebugSink(
                  opts.debugParts,
                  "olid",
                  safeName(targetLogical.replace(/^img\//, "").replace(/\//g, "__"))
                );
                const png = await applyOlid(
                  basePng,
                  [fs.readFileSync(olidAbs)],
                  olidDebug
                );
                writeOut(outWww, targetLogical, png);
                stats.imageDeltas++;
              } catch (e) {
                failures.push({ rel, reason: "olid apply failed: " + e.message });
              }
            }
          }
        }
        const canopyDirs = mod.canopyInputDirs();
        if (canopyDirs.length) {
          if (!haveCanvas) {
            warnNoCanvas("CanopyImageBuilder images");
          } else {
            await runCanopy(
              canopyDirs,
              baseRoot,
              outWww,
              stats,
              failures,
              opts.debugParts
            );
          }
        }
        for (const rel of files.languages) {
          const logical = rel.replace(/^\//, "");
          const lang = path.basename(logical).replace(/\.json$/i, "");
          const sources = mod.resolveAll(logical);
          if (!sources.length) {
            failures.push({ rel, reason: "language delta missing from mod" });
            continue;
          }
          try {
            const baseLoc = resolveBaseBytes(
              baseRoot,
              "languages/" + lang + "/dialogue.loc"
            );
            let cld = baseLoc !== null ? parseLoc(baseLoc) : {};
            for (const abs of sources) {
              cld = deepMerge(cld, JSON.parse(fs.readFileSync(abs, "utf8")));
            }
            const locPath = "languages/" + lang + "/dialogue.loc";
            writeOut(
              outWww,
              locPath,
              import_buffer.Buffer.from(
                opts.pretty ? JSON.stringify(cld, null, 2) : JSON.stringify(cld),
                "utf8"
              )
            );
            stats.languages++;
          } catch (e) {
            failures.push({ rel, reason: "language bake failed: " + e.message });
          }
        }
        if (opts.icon) {
          if (!isFile(opts.icon)) {
            failures.push({ rel: opts.icon, reason: "--icon file not found" });
          } else {
            writeOut(outWww, "img/icon.png", fs.readFileSync(opts.icon));
            stats.icon = true;
          }
        }
        console.log(
          `
${opts.thin ? "Thin mod" : "Self-contained game"} written to ${opts.out}
` + (opts.thin ? "" : `  base files (decrypted): ${stats.base}
`) + (stats.verbatim ? `  copied verbatim (hashed): ${stats.verbatim}
` : "") + `  data deltas (.jsond): ${stats.dataDeltas}
  assets (verbatim): ${stats.assets}
  image deltas (.olid): ${stats.imageDeltas}
  CanopyImageBuilder images: ${stats.canopy}
  languages baked (dialogue.loc): ${stats.languages}
` + (stats.icon ? `  mod icon: img/icon.png
` : "") + (stats.plugins ? `  runtime plugins (shipped + registered): ${stats.plugins}
` : "") + (stats.pluginsSkipped ? `  plugins skipped (build-time/inert in browser): ${stats.pluginsSkipped}
` : "") + `  failures: ${failures.length}`
        );
        if (failures.length) {
          reportFailures(failures);
          if (opts.force) import_process.default.exit(1);
        }
      }
      async function runCanopy(canopyDirs, baseRoot, outWww, stats, failures, debugRoot) {
        const instrByName = /* @__PURE__ */ new Map();
        for (const dir of canopyDirs) {
          for (const name of fs.readdirSync(dir)) {
            if (!name.endsWith(".json") || name === "!_managedImages.json") continue;
            instrByName.set(name, dir);
          }
        }
        function resolveInput(fileName) {
          for (let i = canopyDirs.length - 1; i >= 0; i--) {
            const abs = path.join(canopyDirs[i], fileName);
            if (isFile(abs)) return abs;
          }
          return null;
        }
        const sourceCache = /* @__PURE__ */ new Map();
        async function getSource(srcPath) {
          if (!sourceCache.has(srcPath)) {
            sourceCache.set(srcPath, await loadCanopySource(baseRoot, srcPath));
          }
          return sourceCache.get(srcPath);
        }
        for (const [fileName, dir] of instrByName) {
          const name = path.parse(fileName).name;
          let instr;
          try {
            instr = JSON.parse(fs.readFileSync(path.join(dir, fileName), "utf8"));
          } catch (e) {
            failures.push({
              rel: fileName,
              reason: "instruction parse: " + e.message
            });
            continue;
          }
          try {
            const sources = /* @__PURE__ */ new Map();
            for (const key of Object.keys(instr.sourceImages || {})) {
              sources.set(key, await getSource(instr.sourceImages[key]));
            }
            const masks = /* @__PURE__ */ new Map();
            for (const key of Object.keys(instr.masks || {})) {
              const abs = resolveInput(instr.masks[key]);
              if (!abs) throw new Error("mask not found: " + instr.masks[key]);
              masks.set(key, await loadLocalImageData(abs));
            }
            let patchBytes = null;
            if (instr.patch && instr.patch.patchFileName) {
              const abs = resolveInput(instr.patch.patchFileName);
              if (abs)
                patchBytes = new Uint8Array(zlib.gunzipSync(fs.readFileSync(abs)));
            }
            const debug = makeDebugSink(debugRoot, "canopy", safeName(name));
            const png = buildCanopyImage(instr, sources, masks, patchBytes, debug);
            const dest = (instr.outputDestination || "/img/pictures/").replace(/^\//, "") + name + ".png";
            writeOut(outWww, dest, png);
            stats.canopy++;
          } catch (e) {
            failures.push({ rel: fileName, reason: "canopy build: " + e.message });
          }
        }
      }
      function warnNoCanvas(what) {
        console.warn(
          `! Skipping ${what}: the "@napi-rs/canvas" package is not installed.
  Run \`npm install @napi-rs/canvas\` and re-run to include these.`
        );
      }
      function reportFailures(failures) {
        if (!failures.length) return;
        console.error("\nFailures:");
        for (const f of failures) console.error(`  - ${f.rel}: ${f.reason}`);
      }
      function parseArgs(argv) {
        const opts = { overlays: [], thin: false, force: false, pretty: false };
        for (let i = 0; i < argv.length; i++) {
          const a = argv[i];
          switch (a) {
            case "--diff":
              opts.diff = argv[++i];
              break;
            case "--base":
              opts.base = argv[++i];
              break;
            case "--out":
              opts.out = argv[++i];
              break;
            case "--overlay":
              opts.overlays.push(argv[++i]);
              break;
            case "--icon":
              opts.icon = argv[++i];
              break;
            case "--thin":
              opts.thin = true;
              break;
            case "--force":
              opts.force = true;
              break;
            case "--pretty":
              opts.pretty = true;
              break;
            case "--debug-parts":
              opts.debugParts = argv[++i];
              break;
            case "-h":
            case "--help":
              opts.help = true;
              break;
            default:
              throw new Error("unknown argument: " + a);
          }
        }
        return opts;
      }
      var HELP = `build-tomb-mod.js: flatten a Tomb-format mod into a self-contained game

Usage:
  node tools/build-tomb-mod.js --diff <dir> --base <dir> --out <dir> [options]

  --diff    <dir>  The mod folder (contains mod.json, or a www/ subdir)
  --base    <dir>  Base game the mod targets (decrypted dump, current TCOAAL
                   install, or old .k9a install: all handled). For
                   CanopyImageBuilder mods this must be the referenced version.
  --out     <dir>  Output folder (receives a www/ tree)
  --overlay <dir>  Layer another mod folder on top of --diff (repeatable, e.g.
                   a translation). Later overlays win on path collisions.
  --icon    <img>  Copy this image to www/img/icon.png as the mod-list icon
  --thin           Emit a thin overlay (mod files only), not a whole game
  --force          Write what succeeds even if some patches fail
  --pretty         Pretty-print merged JSON (default: compact)
  --debug-parts <dir>
                   Dump every intermediate stage of each composed image into
                   <dir> (CanopyImageBuilder: loaded sources/masks, each
                   selection + cumulative paste, the assembled base before and
                   after the PIXI premultiply round-trip, the patch
                   visualised, and the final output; .olid deltas: base,
                   result and a changed-pixel map). Use it to pin down where a
                   coloured seam first appears. Needs @napi-rs/canvas.
  -h, --help       Show this help

Handles every mod.json files category: dataDeltas (.jsond JSON Patch), assets
(verbatim), imageDeltas (.olid), languages (baked into plain-JSON dialogue.loc),
runtime plugins (shipped + registered in js/plugins.js; build-time generators
like CanopyImageBuilder are pre-baked, not shipped), plus offline-rendered
CanopyImageBuilder images. Image categories need: npm install @napi-rs/canvas
`;
      async function main() {
        let opts;
        try {
          opts = parseArgs(import_process.default.argv.slice(2));
        } catch (e) {
          console.error("Error: " + e.message + "\n");
          import_process.default.stderr.write(HELP);
          import_process.default.exit(2);
        }
        if (opts.help) {
          import_process.default.stdout.write(HELP);
          return;
        }
        if (!opts.diff || !opts.base || !opts.out) {
          console.error("Error: --diff, --base and --out are all required.\n");
          import_process.default.stderr.write(HELP);
          import_process.default.exit(2);
        }
        for (const d of [opts.diff, opts.base, ...opts.overlays]) {
          if (!isDir(d)) {
            console.error("Error: not a directory: " + d);
            import_process.default.exit(2);
          }
        }
        await build(opts);
      }
      if (__require.main === module) {
        main().catch((e) => {
          console.error(e);
          import_process.default.exit(1);
        });
      }
      module.exports = {
        build,
        parseArgs,
        canvas,
        hashPath,
        fileMask,
        decodeK9a,
        dekit,
        deepMerge,
        parseLoc,
        LOC_SIG,
        applyJsonPatch,
        isDir,
        isFile,
        contentRoot,
        walk,
        writeOut,
        resolveBaseBytes,
        resolveBaseText,
        applyOlid,
        buildCanopyImage,
        loadCanopySource,
        loadLocalImageData
      };
    }
  });

  // tools/map-filenames.json
  var require_map_filenames = __commonJS({
    "tools/map-filenames.json"(exports, module) {
      module.exports = {
        "audio/bgm": [
          "03myuu_Cloud_Chiptune",
          "08myuu_Halloween_Chiptune",
          "altarlamb",
          "bells_dark",
          "buzz",
          "club",
          "cultist_inside",
          "cultist_outside",
          "dream_dance",
          "dreaming_injection",
          "forest",
          "guard tree",
          "hallucination_connect",
          "jealous_doll",
          "jesters_pity",
          "oldfairytales",
          "pandorasyndrome",
          "pastelvirus",
          "picture_book",
          "secretrooms",
          "sh_cupid",
          "sheep_sway",
          "smallmagicbook",
          "twisted_clowns",
          "teddybear",
          "ticktock",
          "snailseyes",
          "wandering_wizard"
        ],
        "audio/bgs": ["balcony", "buzz", "fireplace", "ticktock"],
        "audio/me": ["kill_switch", "musicbox_blingy", "silly_intro", "title_sting"],
        "audio/se": [
          "Blow2",
          "Close1",
          "Coin",
          "Crash",
          "Darkness3",
          "Door1",
          "Earth1",
          "Fall",
          "Heal2",
          "Key",
          "Monster4",
          "Open1",
          "Open4",
          "Run",
          "Sand",
          "Switch2",
          "Transceiver",
          "Water1",
          "Wind5",
          "ambulance",
          "axe",
          "bellding",
          "blade",
          "blender",
          "blingy",
          "blingy_sp",
          "blood_a",
          "blood_b",
          "blood_stab",
          "bullet",
          "bullets",
          "cardoor",
          "carpull",
          "confirm",
          "curtain",
          "dig",
          "draw",
          "elevatordoor",
          "flush",
          "item_got",
          "knock",
          "match",
          "phone_clank",
          "phone_disconnect",
          "phone_ring",
          "rustle",
          "rustle_foliage",
          "spam",
          "statue",
          "title_sting",
          "vinyl",
          "walkaway",
          "washingmachine",
          "wood"
        ],
        "img/characters": [
          "!Other1",
          "!Other2",
          "!Other3",
          "!Other4",
          "Actor1",
          "Actor2",
          "Actor3",
          "Actor4",
          "Actor5",
          "Actor6"
        ],
        "img/faces": [
          "_happy",
          "_sad",
          "_smile",
          "_surprise",
          "_unsure",
          "b_ahh",
          "b_awkward",
          "b_biteself",
          "b_complain",
          "b_confused",
          "b_content",
          "b_dafuq",
          "b_dontlaugh",
          "b_down",
          "b_dunno",
          "b_embarrassed",
          "b_ew",
          "b_explain",
          "b_explainmad",
          "b_facepalm",
          "b_fakelaugh",
          "b_fakesmile",
          "b_flustered",
          "b_glad",
          "b_ha",
          "b_happy",
          "b_hideface",
          "b_hurt",
          "b_jokey",
          "b_laugh",
          "b_mad",
          "b_meh",
          "b_miffed",
          "b_neutral",
          "b_no",
          "b_ohshit",
          "b_pleased",
          "b_proud",
          "b_rage",
          "b_sad",
          "b_shrug",
          "b_sigh",
          "b_smile",
          "b_talk",
          "b_think",
          "b_waver",
          "b_whatever",
          "b_worry",
          "b_yikes",
          "bk2_hah",
          "bk2_neutral",
          "bk2_tch",
          "bk2_ticked",
          "bk_complain",
          "bk_ew",
          "bk_hah",
          "bk_hm",
          "bk_laugh",
          "bk_lookaway",
          "bk_neutral",
          "bk_no",
          "bk_oh",
          "bk_sad",
          "bk_sigh",
          "bk_smile",
          "bk_tch",
          "bk_ticked",
          "bk_unsure",
          "j_ack",
          "j_angry",
          "j_down",
          "j_ha",
          "j_hopeful",
          "j_nervous",
          "j_shy",
          "j_unsure",
          "j_upset",
          "j_worry",
          "l_joy",
          "l_say",
          "l_serious",
          "l_talk",
          "l_tch",
          "l_think",
          "lady_fear",
          "lady_happy",
          "lady_heh",
          "lady_laugh",
          "lady_miffed",
          "lady_nervous",
          "lady_worry",
          "lady_yell",
          "m_angry",
          "m_down",
          "m_err",
          "m_excited",
          "m_hmph",
          "m_laugh",
          "m_meh",
          "m_mock",
          "m_no",
          "m_oops",
          "m_pain",
          "m_proud",
          "m_reassure",
          "m_sigh",
          "m_smile",
          "m_surprise",
          "m_ticked",
          "m_um",
          "m_unsure",
          "m_yell",
          "s_angry",
          "s_boo",
          "s_challenge",
          "s_chat",
          "s_content",
          "s_cry",
          "s_curse",
          "s_excited",
          "s_fearful",
          "s_fight",
          "s_gasp",
          "s_gentle",
          "s_glad",
          "s_heh",
          "s_hm",
          "s_hmm",
          "s_hmph",
          "s_huhu",
          "s_hurt",
          "s_irritated",
          "s_laugh",
          "s_lol",
          "s_lying",
          "s_meh",
          "s_mock",
          "s_no",
          "s_ooh",
          "s_oops",
          "s_pout",
          "s_proud",
          "s_sad",
          "s_scream",
          "s_sigh",
          "s_smile",
          "s_surprise",
          "s_tch",
          "s_terror",
          "s_think",
          "s_ugh",
          "s_ughh",
          "s_unsuresmile",
          "s_weak",
          "s_yell",
          "sk_bawl",
          "sk_down",
          "sk_grin",
          "sk_happy",
          "sk_heh",
          "sk_hmph",
          "sk_mad",
          "sk_meh",
          "sk_miffed",
          "sk_mock",
          "sk_sad",
          "sk_sure",
          "sk_surprise",
          "sk_teary"
        ],
        "img/parallaxes": [
          "ground2",
          "ground3",
          "ground4",
          "ground5",
          "ground6",
          "ground7",
          "ground8",
          "ground9",
          "ground10",
          "ground11",
          "ground12",
          "ground13",
          "ground14",
          "ground16",
          "ground17",
          "ground18",
          "ground20",
          "ground21",
          "ground22",
          "ground23",
          "ground24",
          "ground25",
          "ground26",
          "ground27",
          "ground28",
          "ground29",
          "ground30",
          "ground31",
          "ground32",
          "ground34",
          "ground35",
          "ground36",
          "ground37",
          "ground38",
          "ground40",
          "ground41",
          "ground42",
          "ground43",
          "ground44",
          "ground45",
          "ground46",
          "ground47",
          "ground48",
          "ground49",
          "ground50",
          "ground51",
          "ground52",
          "ground53",
          "ground54",
          "ground55",
          "ground56",
          "ground57",
          "ground59",
          "ground60",
          "ground75",
          "ground76",
          "ground90",
          "ground91",
          "ground92",
          "ground93",
          "ground94",
          "par2",
          "par3",
          "par4",
          "par5",
          "par6",
          "par7",
          "par9",
          "par10",
          "par12",
          "par14",
          "par17",
          "par18",
          "par20",
          "par21",
          "par22",
          "par23",
          "par24",
          "par25",
          "par26",
          "par27",
          "par28",
          "par29",
          "par30",
          "par31",
          "par32",
          "par34",
          "par35",
          "par36",
          "par37",
          "par38",
          "par40",
          "par41",
          "par42",
          "par43",
          "par44",
          "par45",
          "par46",
          "par48",
          "par49",
          "par50",
          "par51",
          "par54",
          "par60",
          "par76",
          "par90",
          "par91",
          "par92",
          "par93",
          "par94"
        ],
        "img/pictures": [
          "LU",
          "LU_eyes_a",
          "LU_eyes_b",
          "LU_eyes_c",
          "accept_a",
          "accept_b",
          "accept_c",
          "andy_angst",
          "andy_urghhhhhhhh_a",
          "andy_urghhhhhhhh_b",
          "ashley_final_warning",
          "bed_1a",
          "bed_1b",
          "bed_1c",
          "bed_1d",
          "bed_aaandrew",
          "bed_andrew",
          "bed_andy",
          "bed_bite",
          "blur_motel",
          "bridge_h1_a",
          "bridge_h1_b",
          "bridge_h_mopea",
          "bridge_h_mopeb",
          "bridge_h_pf_a",
          "bridge_h_pf_b",
          "bridge_h_pf_c",
          "bridge_h_pf_d",
          "bridge_h_pf_e",
          "bridge_h_push",
          "bridge_rb1_a",
          "bridge_rb1_b",
          "bridge_rb1_c",
          "bridge_rb1_d",
          "bridge_rb1_e",
          "bridge_rb3",
          "brocouch",
          "ca_angry",
          "ca_ask",
          "ca_listen",
          "ca_talk",
          "ca_tired",
          "cameraview",
          "car_a1",
          "car_a2",
          "car_b1",
          "car_b2",
          "car_c1",
          "car_c2",
          "car_c3",
          "car_c4",
          "car_c5",
          "car_c6",
          "car_c7",
          "car_d1",
          "car_d2",
          "car_e1",
          "car_e2",
          "cart_a",
          "cart_b",
          "carwake1_a",
          "carwake1_b",
          "carwake1_c",
          "carwake1_d",
          "carwake2_a",
          "carwake2_b",
          "carwake2_c",
          "carwake2_d",
          "carwake2_e",
          "ch1",
          "ch2",
          "cl_grin",
          "cl_lol",
          "cl_mad",
          "cl_meh",
          "cl_mock",
          "cl_plead",
          "cl_yeah",
          "coffee",
          "coffee_kick",
          "couch2_a",
          "couch2_b",
          "couch2_c",
          "couch2_d",
          "couch_a",
          "couch_b",
          "couch_c",
          "couch_d",
          "couch_e",
          "crate2_a",
          "crate2_b",
          "crate2_c",
          "crate_a",
          "crate_b",
          "crate_c",
          "crate_slam",
          "cry_a",
          "cry_b",
          "curtain",
          "cut_dad_a",
          "cut_dad_b",
          "cut_mom",
          "decline2_a",
          "decline2_b",
          "decline2_c",
          "decline2_c_cut",
          "decline2_d",
          "decline2_d_cut",
          "decline3_a",
          "decline3_b",
          "decline3_c",
          "decline3_d",
          "decline_a",
          "decline_a_cut",
          "dinner_dishes_a",
          "dinner_dishes_b",
          "dinner_duo",
          "dinner_family",
          "door_0",
          "door_1a",
          "door_1b",
          "door_2a",
          "door_2b",
          "door_3a",
          "door_3b",
          "door_4a",
          "door_4b",
          "door_bye",
          "door_bye_alt",
          "door_spotlight_a",
          "door_spotlight_left",
          "door_spotlight_right",
          "drawing",
          "drawing_fix_classmates",
          "drawing_fix_friends",
          "drawing_fix_parent",
          "duo_car",
          "duobed",
          "duocouch",
          "duodiner",
          "duodinner",
          "duofloor",
          "end_a",
          "end_b",
          "end_c",
          "end_d",
          "end_e",
          "endcard",
          "eye_puzzle_halo",
          "fauxcomfort_a",
          "fauxcomfort_b",
          "fauxcomfort_c",
          "fauxcomfort_d",
          "fauxcomfort_e",
          "fb_bff_a",
          "fb_bff_b",
          "fb_bff_c",
          "fb_card",
          "fb_curlup_a",
          "fb_curlup_b",
          "fb_curlup_c",
          "fb_duo_tv",
          "fb_hug_a",
          "fb_hug_b",
          "fb_lemoncake",
          "fb_ley_a",
          "fb_ley_b",
          "fb_ley_c",
          "fb_ley_table",
          "fb_shake",
          "fb_shock",
          "fb_shock_b",
          "fb_tv_a",
          "fb_tv_b",
          "feed_1a",
          "feed_1b",
          "feed_1c",
          "feed_2a",
          "feed_2b",
          "feed_2c",
          "feed_reprise",
          "floor_1a",
          "floor_1b",
          "give_gun",
          "grab_a",
          "grab_b",
          "grab_c",
          "ground60_block",
          "guesswhat_a",
          "guesswhat_b",
          "guesswhat_c",
          "gun_a",
          "gun_b",
          "gun_c",
          "gun_c_bullets",
          "hex_a",
          "hex_b",
          "hex_c",
          "hex_d",
          "hide2_a",
          "hide2_b",
          "hide_a",
          "hide_b",
          "hide_c",
          "hide_d",
          "hint_green_blue",
          "hint_red",
          "hitmanwins",
          "hug",
          "hv3a_1",
          "hv3a_2",
          "hv3a_3",
          "hv3b_1",
          "hv3b_2",
          "hv3b_3",
          "hv_1a",
          "hv_1b",
          "hv_2",
          "hv_4",
          "hv_5a",
          "hv_5b",
          "hv_6a",
          "hv_6b",
          "island_a",
          "island_b",
          "island_c",
          "julia_a",
          "julia_b",
          "julia_c",
          "keys",
          "kick",
          "kill_1a",
          "kill_1b",
          "kill_2a",
          "kill_2b",
          "kill_2c",
          "kill_2d",
          "kill_3a",
          "kill_3b",
          "kill_3c",
          "kill_4a",
          "kill_4b",
          "kitchen2_a",
          "kitchen2_b",
          "kitchen_a",
          "kitchen_b",
          "kitchen_c",
          "kitchen_d",
          "knife",
          "knife_dad",
          "latch_a",
          "latch_b",
          "letgo",
          "lg_beam",
          "lighter_a",
          "lighter_b",
          "memory_1a",
          "memory_1b",
          "milkcarton",
          "motel_bro",
          "motel_bro_b",
          "motel_bro_dead",
          "motel_sis",
          "motel_sis_dead",
          "noandy_a",
          "noandy_b",
          "noandy_c",
          "noandy_d",
          "noandy_e",
          "noandy_f",
          "noandy_f_alt",
          "nokill_sis_a",
          "nokill_sis_b",
          "nokill_sis_c",
          "oath1_a",
          "oath1_b",
          "oath1_c",
          "oath1_d",
          "oath2_a",
          "oath2_b",
          "oath2_c",
          "oath2_d",
          "oath3_a",
          "oath3_b",
          "oath3_c",
          "oath3_d",
          "op_a",
          "op_b",
          "peek_1a",
          "peek_1b",
          "phone_a",
          "phone_b",
          "pov_andrew",
          "pov_ashley",
          "pov_none",
          "ra_butcher_1a",
          "ra_butcher_1b",
          "ra_butcher_1c",
          "ra_butcher_1d",
          "ra_butcher_2c",
          "ra_butcher_3a",
          "ra_butcher_3b",
          "ra_butcher_3c",
          "rb_butcher_1a",
          "rb_butcher_1b",
          "rb_butcher_1c",
          "rb_butcher_2b",
          "rb_butcher_3a",
          "rb_butcher_3b",
          "rb_butcher_4a",
          "rb_butcher_4b",
          "rb_butcher_4c",
          "rb_butcher_4d",
          "rb_catch_1a",
          "rb_catch_1b",
          "rb_catch_1c",
          "rb_catch_1d",
          "rb_catch_2a",
          "rb_choke_fb",
          "rb_chokeb_fb",
          "rb_wake1b",
          "rb_wake1c",
          "sever_a",
          "sever_b",
          "shrug",
          "sisbed",
          "sleeptrinket1_a",
          "sleeptrinket1_b",
          "sleeptrinket1_c",
          "sleeptrinket2_a",
          "sleeptrinket2_b",
          "sleeptrinket3",
          "smokes2_a",
          "smokes2_b",
          "smokes2_c",
          "smokes_a",
          "smokes_b",
          "smokes_c",
          "smokes_d",
          "sofa2_h",
          "sofa2_h2",
          "sofa_c",
          "sofa_d",
          "sofa_e",
          "sofa_f",
          "sofa_g",
          "stabmom_a",
          "stabmom_a_cut",
          "stabmom_b",
          "stabmom_c",
          "stalker",
          "tag",
          "taunt_a",
          "taunt_b",
          "torso_1a",
          "torso_1b",
          "tv_1a",
          "tv_1b",
          "tv_2a",
          "tvad_a",
          "tvad_b",
          "tvad_c",
          "tvad_d",
          "tvad_e",
          "tvad_f",
          "tvad_frame",
          "uso",
          "wake_1a",
          "wake_1b",
          "wake_first_vision_a",
          "wake_first_vision_b",
          "whisper_a",
          "whisper_b",
          "window_latch",
          "window_latch_open"
        ],
        "img/tilesets": ["Outside_A5"],
        "img/titles1": ["Book", "black"]
      };
    }
  });

  // tools/map-name-keys.json
  var require_map_name_keys = __commonJS({
    "tools/map-name-keys.json"(exports, module) {
      module.exports = [
        {
          n: "ep1",
          k: [
            "kJ8dGf8G",
            "8WvJMNT8",
            "hpCv7MK8",
            "GxFfxGPY",
            "CpHv41gw",
            "HpxWqgxy",
            "K53FBfd9",
            "yhPKLvz5"
          ]
        },
        {
          n: "02_dream",
          k: [
            "x86GCl9v",
            "LJZTGld6",
            "S56hx4v9",
            "VTd5z0R8",
            "rPnlxrMt",
            "ftnnlD2S",
            "0xtRr72x",
            "0SvVnbH2",
            "sYHrsWzX",
            "7M0XQNDs",
            "s8QMCr69",
            "l3vbxM7w",
            "XSLysVg5",
            "VDyJLPPB",
            "tBtPpDJf",
            "Jg7H5xZP",
            "6RQrfvSt",
            "kR5Fy4cp",
            "08xVnPqM",
            "j9rk2DzR",
            "65lbGx1q",
            "xGlnsfPc",
            "nZJH49Rz",
            "T28yxsxY",
            "qyYHTSv5",
            "MH6RxGKd",
            "nnZYMSLv",
            "27zwZm7t",
            "xvjZxrGN",
            "sy69FK8W",
            "xZbns2pw",
            "nzJhKvpT",
            "J8d92g9Z",
            "ylmCYWCN",
            "3QQBc9GH",
            "n07Cww4L"
          ]
        },
        {
          n: "03_hub",
          k: [
            "JhcpXsLh",
            "jhBRjxkP",
            "kR5Fy4cp",
            "Y7d2MMj4",
            "x86GCl9v",
            "KQtQxx07",
            "RzblwK1Y",
            "0mcyl6PB",
            "jv34wKks",
            "Q3Drq2ZN",
            "BVY0249d",
            "TsnksSrK",
            "qbZX7rjn",
            "F75rFfRk",
            "nYgs9txc",
            "K1n31NYx",
            "Rjn1LdsC",
            "4XHSr5KC",
            "m18kxnKM",
            "GdR5GwDq",
            "fVQ7JVw5",
            "Wv2TJ7mn",
            "tCmdpF6s",
            "wzChjr1W",
            "CB6d7GdT",
            "hZXmS3k6",
            "JsFX9MGn",
            "RyHFp988",
            "Z62tKnJq",
            "16fBlmm1",
            "Bd8l2l8j",
            "MYkZV8WQ",
            "b8lRs74g",
            "x9nYZsKW",
            "Y19k37kR",
            "z62Z3WKS",
            "YpnZfRDX",
            "5JZj267W",
            "Slkwc75V",
            "gg5qMm5v",
            "JyySzG8v",
            "qVX74dyV",
            "XH69Ptvy",
            "sXNlq7Dy",
            "Nr0SJYS3",
            "6kM3vcZf",
            "J3tsWPd2",
            "cFq0ZrWd",
            "1tBknPJ9",
            "LhGwz2fj",
            "6wnGmvDw",
            "rGJ29H7s",
            "RkrDNZdh",
            "VVkWMX1N",
            "lk6mMJ1g",
            "xHczSh3t",
            "1RYJQcTj",
            "RDMFsXCc",
            "ycHhGq6V",
            "txLknyg8",
            "hs5GWBBx",
            "CmRwVKZ6",
            "Cf9VHTXV",
            "M9Np00WG",
            "xRr95B05",
            "SvXfM40N",
            "WjBR3yD2",
            "f9FxX0gm",
            "F7LqHqsX",
            "Kp3rJdZ6",
            "sHNtFVMM",
            "tHjyK2rh",
            "rWXZMGzl",
            "nTDCdL6l",
            "Xpp1RsZy",
            "wyn3btbz",
            "plCQXbMC",
            "fS6sLG7D",
            "D1KmKDLL",
            "SrpZZmML",
            "fsNTnb3r",
            "DffhVzgD",
            "3S1HNMcl",
            "NZyry4r3",
            "vt3SPtM2",
            "mH9gVvwH",
            "W52K2BBS",
            "SVpD0MDB",
            "xLGNhlr2",
            "TNqmJ3wW",
            "6m5TW8Fg",
            "T15RTzfj",
            "wJhZKBS0",
            "CcGn02dg",
            "hTvJkrgf",
            "RbNdY8MC",
            "tdG36dVL",
            "9RxGC38N",
            "rnylctYM",
            "vxfKT15S",
            "qh29Tf9n",
            "8l7ptdXg",
            "3pCN4gcF",
            "MpMp0wjY",
            "mQcS3cmf",
            "35PYTCWL",
            "150HmXgX",
            "vj5RRlmx",
            "tNbLcKf6",
            "VC2hp6gD",
            "m6rWQlwy",
            "qCb7h97T",
            "gY8hBn98",
            "VGdWFFw3",
            "mjx0Fm6R",
            "HsM8d2H9",
            "jn9d0tGJ",
            "4DKmPQQC",
            "vDrRjhNt",
            "tb50rzX8",
            "xycnmt8J",
            "1MHGnJ1L",
            "jwQMZLBQ",
            "9JcVkngW",
            "zZHBCXNy",
            "6k31M7q9",
            "ZYHSts9R",
            "KRn96RLg",
            "7x6tJ7SM",
            "crdg6TlQ",
            "Y4M8XLnb",
            "2jFnbv82",
            "wFhwYQr5",
            "3MDDwgSM",
            "qN1ZkrxG",
            "2CgLx8hW",
            "s44C5WMd",
            "TvZKXZfb",
            "HGmdYhPn",
            "1SQZG6Nn",
            "S09zKGMM",
            "8vMBqY78",
            "FR8P1xfm",
            "rKNvGs6y",
            "MddKQgC8",
            "mknXbT2r",
            "rYS4WcJG",
            "pK06S1qL",
            "NYY1gkzY",
            "8fGwbtYp",
            "Xbf8wYRz",
            "0kJcXC1C",
            "ng6TVmhG",
            "GGFgWtm5",
            "0FZglcC0",
            "sNhtC9tH",
            "FzWyLLMW",
            "4DjZy4ZZ",
            "FRygjDHz",
            "J4tBCB7P",
            "lQFm6s59",
            "Xp0x7MG5",
            "NvH3RmxY",
            "3dkjY0Wf",
            "pn49X61p",
            "1x9lkVPJ",
            "xCzYHj4K",
            "Y0FcJMFg",
            "CDsHDw7F",
            "r6WsZ4HW",
            "FzWXdMSk",
            "HTYSk38H",
            "VjCD5SVM",
            "h6jcs8X3",
            "DjxD4tmp",
            "dsjCvQgS",
            "jY751d70",
            "KPKJVgWL",
            "zHwJBCKC",
            "vPjc59nJ",
            "9SKm66Gz",
            "2KWLwnZm",
            "M54csDVR",
            "1H88jK7k",
            "YcS3GcJL",
            "7fjzgyKD",
            "nyyy0hsr",
            "9X1wLw7y",
            "T23F9CPP",
            "r0gP864D",
            "hkFJSw2s",
            "lZgTHprp",
            "McMYx6nM",
            "5xm8Jxc1",
            "Wg084nF7",
            "S1F3jJgq",
            "ThCj11ft",
            "8tpSY1Tw",
            "qdMcn5b2",
            "C4VldH01",
            "zYS3m2WK",
            "6MWWQ7lW",
            "BhbXkPr6",
            "r9CCWNW5",
            "79VLrdLx",
            "t1mR4QYN",
            "B3xnV48H",
            "hqN3NWpg",
            "svgFjnKq",
            "Wftb8KPK",
            "3z8KnPqK",
            "nK5YW5cm",
            "65C7VGGM",
            "cnjP8D0h",
            "hZBlVzfR",
            "KJmKQYqW",
            "Zgvvrs2m",
            "LySVjCl7",
            "sSLhrGKH",
            "JlWYW8s3",
            "yRvVRxcP",
            "wkgLWLJ4",
            "5rDSRhlm",
            "0V63mWVH",
            "wQ3RwGBk",
            "rdg62Q2w",
            "D0xbRbb2",
            "RD9G4nvv",
            "SbVGP7gx",
            "8h505Y3W",
            "tVmq0Ppz",
            "J7Pxjn89",
            "QmC1JSYk",
            "8R5TWQfW",
            "GNXvZ33X",
            "KB2RBjgv",
            "4d04scVR",
            "Rs5wY3MT",
            "8gw3BTcx",
            "Tfbz0wCd",
            "mRGhyLG5",
            "64clQF0K",
            "Pb77GWMb",
            "mDW32lq2",
            "C4p6QHBc",
            "xY1v1Rd6",
            "hkdJbVmK",
            "5N6CxsSQ",
            "hBFNjpkL",
            "DRbJFyFb",
            "Y9cJ9092",
            "rK4dD8Z2",
            "ggRB7WDX",
            "gqkczHTS",
            "cHCNBXjN",
            "Phnb4S2l",
            "zcML6Fsx",
            "d6y0rfwg",
            "bJTCkp5d",
            "xrRSd6jD",
            "tBS71QKZ",
            "fSDwPf92",
            "znKLNrsn",
            "DN92rMGV",
            "0KrrwR5h",
            "vVNwsgkC",
            "ZXT9fZd6",
            "vnv6BzfF",
            "p94DywZR",
            "lwF0hWrF",
            "mK52PwMd",
            "4lNVh4H6",
            "bkPT4hCG",
            "sRHdDgpD",
            "Ypbq07G4",
            "2zHqxHpZ",
            "82dkvxPx",
            "kZwdsbXk",
            "3TW2PCSV",
            "0QMy3rVW",
            "jBzb5bnv",
            "hBbHhbRh",
            "pLw9gMmx",
            "tD30n3vV",
            "Cmy14r80",
            "L190KByW",
            "nwx4nM3B",
            "9yVnRtmm",
            "ksqdwsFQ",
            "TTpvsGQ0",
            "Y7Szlt2t",
            "4mnCY6Lf",
            "Hd8MS3c7",
            "Xl0BkH5f",
            "H70rwV8Z",
            "fqxqtvPy",
            "JcHS7Wg2",
            "KvTx2Dk9",
            "rhXqPMCB"
          ]
        },
        {
          n: "04_duo",
          k: [
            "M4LvKfLl",
            "Fs3PL8l9",
            "kR5Fy4cp",
            "lBTc9tDS",
            "XnbPs14z",
            "x86GCl9v",
            "Qn6HyP9G",
            "TZ5NFLfh",
            "fV4cF0KJ",
            "SwyBMJPZ",
            "KdbPX19c",
            "qvqcY26P",
            "Ld0vhK7K",
            "YnQ04wLf",
            "YDm3bVMv",
            "LpPxf9RX",
            "v1dqSg68",
            "rPFDkHC4",
            "swj1W3jB",
            "r6Sl2jTN",
            "sb7njF1k",
            "9Z8nr2BB",
            "8MlRDqfF",
            "MQrvkJq9",
            "JjJ2tjXD",
            "2M8m4t2f",
            "2H8RKl5c",
            "lfvy98Kb",
            "VKBtqrtB",
            "h7qFN2s1",
            "JDmHY9vL",
            "vjyh5Vs9",
            "mYbSwdyn",
            "LyH6W0Rf",
            "xbGzsJxZ",
            "j1lJkSnQ",
            "rYZHzVf7",
            "xzrdhrhS",
            "rfddTrKg",
            "mmkNvlbq",
            "gD1b7XlY",
            "g98zmb2y",
            "8jf4vcF4",
            "ltTBr4PV",
            "ldHwhMRk",
            "02j7Cd80",
            "w7ZvbBvC",
            "4yhN4h9P",
            "DCRBH5zy",
            "DxhMltBG",
            "qSykJmHz",
            "6RKtYcfZ",
            "vkxsGyx5",
            "DtXb3tZx",
            "XHhQP29k",
            "bVjk3Wpp",
            "FYqFQBJD",
            "n5cKty25",
            "ysG7fJcq",
            "jgQdS3nB",
            "62Qzp6pl",
            "sfbvP0F4",
            "DLJR5PYR",
            "YVCmJT3L",
            "B9QpL3TN",
            "PSC0sghX",
            "60QqY9Nt",
            "0lqc71Qg",
            "ZPMfgrMr",
            "Fw3KCGHK",
            "st4Q1hDg",
            "WzC6VVCB",
            "YZnGXSk2",
            "MjkM6vhw",
            "h8HNlM1J",
            "LPDW8hCV",
            "rWJDR37z",
            "4mK3jRH6",
            "07HXdZKB",
            "lcMPxddS",
            "ChNkqQc1",
            "gYMTTTyg",
            "xKqZ9bGn",
            "NdCXR6L9",
            "n7FbFbtv",
            "WfgHhkYW",
            "qd1Clpwb",
            "hWFZBczF",
            "qW1pmfvL",
            "LQz2Q3MP",
            "Qv3wTSRc",
            "bwtVC8wq",
            "s5YzkWTf",
            "D5VNm9rM",
            "1N2ddZQ9",
            "lPHgxZH5",
            "phHjF6Vr",
            "0vG1hW3t",
            "8TpRs3fX",
            "FW7JydvM",
            "MKQc0BQL",
            "smLVvS6y",
            "8sMw5bNr",
            "SSJCntvF",
            "wQcfQ2QY",
            "kkp2LtCf",
            "gJGBNT8Z",
            "yfW5bJX7",
            "Vy7rhxY2",
            "hsXRkq7H",
            "WlWxg5Ld",
            "gqbyvl0w",
            "9lMFbp1x",
            "FqrQCysP",
            "kh86D22m",
            "8CKMNYPB",
            "lpvm4NK1",
            "XB7ZHh2k",
            "DJbg01Kw",
            "TR2swfNs",
            "qmnm7byf",
            "n0WJccVp",
            "wQbHbLMn",
            "JYSDCzxD",
            "S9jchNkw",
            "7802mcR9",
            "QwkdtVXY",
            "g7j2qvgV",
            "yRBmhGTK",
            "gDgkv3Yw",
            "pXkdvcd3",
            "9cHnyP4n",
            "dvfm2Bwp",
            "wcRTrH2S",
            "MyMQvtmM",
            "nWLYgXT4",
            "1ybysQjb",
            "cNt1krMg",
            "WZXtDkMt",
            "yywtrxkB",
            "m65WxGJH",
            "qkr8Pj1R",
            "jBt383vg",
            "czqfL3lp",
            "0mgsP13L",
            "VsfXlVJk",
            "1pBl9m1V",
            "8m6QLyG6",
            "Hkq276np",
            "YfdcGggX",
            "7vtgZ0Sk",
            "s7hCCBNK",
            "VddHF9v3",
            "hwhKj4pb",
            "sCM8y2NZ",
            "WNlgmvLb",
            "6pj3g3kY",
            "xJrWsxR0",
            "JGs0yrGB",
            "BknFDMmw",
            "kx3WTQpF",
            "JNbN7Chb",
            "8bCb2fVs",
            "Lr8zPhJQ",
            "nJhfSVdV",
            "0HwSNJzL",
            "mW227HlV",
            "YXZm3HX8",
            "3r7vTvzc",
            "Frs2rSDd",
            "5yKr9Rbc",
            "kHB6v20r",
            "bzpYB8Jd",
            "3z4wX8sC",
            "R1h9dFRj",
            "bMkx7BCz",
            "5g7DBRMb",
            "RdcGQPtQ",
            "rd66KRMC"
          ]
        },
        {
          n: "05_wc",
          k: [
            "ljjpQvVx",
            "g1cgLvn8",
            "cLVgNR3P",
            "90SfCggD",
            "TftMZVm1",
            "F5Y6TxfM",
            "WPK65TRD",
            "FWG7pMLz",
            "zPZghxHW",
            "Xl05z8SC",
            "MCgqRrXz",
            "lHvJbT3X",
            "x86GCl9v",
            "HbwlT18h",
            "xQHGZZWc",
            "nq6Hv3dk",
            "TCTkpY8z",
            "6TFMsCcZ",
            "DCfZsN0W",
            "C8gxW70f",
            "kR5Fy4cp",
            "9k7c9cGL"
          ]
        },
        {
          n: "06_parents",
          k: [
            "Cyswznv1",
            "kR5Fy4cp",
            "LvW44TL2",
            "pvFj8Qfb",
            "pHWh3JWZ",
            "l0wS8sTy",
            "d3QfKKHG",
            "7gFswD77",
            "NfV3BSlC",
            "yW2jc5Rc",
            "KTJWTBy3",
            "VWwcS28l",
            "0nmgdG7T",
            "r9whKssT",
            "tPl9wvpR",
            "x86GCl9v",
            "CzXyZFSZ",
            "TG0FWjkX"
          ]
        },
        {
          n: "07_cultist",
          k: [
            "wGnMzS21",
            "V4mk1WvY",
            "7j5ZHsXp",
            "fYG4FbQG",
            "f9S6g1Bp",
            "qn8xWrxB",
            "lFwXKnPd",
            "tm4FZR2h",
            "QYmK4X1Q",
            "F2447k4G",
            "shWDtJLQ",
            "yrzv8TlL",
            "Rhn9G763",
            "XnSgDcfC",
            "Pv0QVtsB",
            "1HwV11l8",
            "x86GCl9v",
            "BgGCCs8L",
            "5qBM20kW",
            "kR5Fy4cp",
            "FlvxDZgt",
            "5flRMk8M",
            "28Lx2J3B",
            "hCKgC7np",
            "VzwpQg5M",
            "fVbY0gCR",
            "SDh9Yvfv",
            "775BtV25",
            "yQlVDpnz",
            "4kBr9jdV",
            "rVcCnPj2",
            "ntl8SWBC",
            "7mmj5cWv",
            "8bwNrVSs",
            "VGtSkQ2F",
            "M8pbQjVD",
            "6kBpLJTm",
            "7KsyFSKJ",
            "dSZY9Mdy",
            "Y4V7FynF",
            "SPpmLFmy",
            "qQ2qDkP4",
            "PKw3wrgt",
            "h8gfLMT0",
            "BzP18MGd",
            "l0ykNcg2",
            "F6lrtcXf",
            "71sfR7Ln",
            "l4TDfszR",
            "gklfmJv0",
            "rd5BNXg4",
            "45xrMSGb",
            "K8X0gD4L",
            "fszGMVPY",
            "zXDF6BZ9",
            "TM2Pbsgg",
            "V6P9mLVp",
            "8hMHCDSW",
            "zT53b8FG",
            "wFtXHNwK",
            "cjQ6Jl4K",
            "vMddVBQY",
            "4MwQ4sl4",
            "fN48z8rk",
            "LkyDs0D9",
            "mClnYQSs",
            "45S1cRmJ",
            "WtS8Gfh3",
            "KTJvc2jN",
            "72463tnV",
            "7sc86N6z",
            "vqQmDKmK",
            "lcRwrlVB",
            "lF0LYPss",
            "MYSGs9zh",
            "lB3Ry0yy",
            "KG7pPjD1",
            "1vSZckH3",
            "KTDy6Hgl",
            "kK6CWw7q",
            "kDV7F0wT",
            "gt1m4CvL",
            "rcNP1yCs",
            "Xx3QWqJ9",
            "MP83b4yD",
            "fsRGp4KV",
            "LwvlGfpk",
            "VTTVt0jK",
            "B9VqHbtp",
            "K59tZdm0",
            "XZNFrJL3",
            "6P0XBJqm",
            "27KldLgX",
            "0ptpNhhw",
            "gZbmbCQc",
            "6jz9tjN8",
            "Stc54Cd1",
            "GKgsDcpd",
            "c29zwnB7",
            "0GkCQbYd",
            "x7lH3BKK",
            "dBWdG6Qt",
            "yBmhfv3k",
            "wqSw6wrS",
            "gWHBK1tZ",
            "Y7vMNXHg",
            "rsSDP80y",
            "V6KGsQrq",
            "NwNH2b5Y",
            "JktlGrKY",
            "T4sxy48N",
            "Nb8jh00Z",
            "dKPMX3W8",
            "pnchJ4T5",
            "y7kxs6lR",
            "FkLC4XgQ",
            "xYMyM2Dk",
            "w2pvvqTd",
            "sp4d2SBf",
            "3kvWZpmV",
            "qj8KNP9Y",
            "Tv10P993",
            "yPk5sQ2t",
            "VqRfz9C0",
            "jy0jYJDh",
            "VGlzG8sW",
            "HXSKJNmN",
            "0NjDK7t2",
            "nR5sWlfL",
            "rWMKTGhy",
            "pYfSDh5m",
            "y6YLzZX6",
            "JjWZCW66",
            "1NXzvzR2",
            "7CSTQfdD",
            "WcnDhbr9",
            "CBXlBbcs",
            "NTwdptc7",
            "pY83Vc5Y",
            "T7SJlHHn",
            "97k09KBl",
            "X42FV99w",
            "GgVTN1RR",
            "MRMGB5GW",
            "mhYlXC3k",
            "537yHvH6",
            "WSzYkKsl",
            "5yhsg0ym",
            "m7Y5qccn",
            "NvyDS067",
            "xBDbT5lk",
            "cDzd9DpD",
            "Y3GGL2kS",
            "W4V03dNR",
            "8BQqtyQf",
            "sn3H2zwt",
            "yMKC5gmz",
            "JvMTKNqZ",
            "flXJ2qt5",
            "PK1z7sLZ",
            "BhtJLQSg",
            "dlXTPxyG",
            "H5kplvp8",
            "VxXFBfTS",
            "KSmlNx75",
            "K5T5Qk3B",
            "PNTCRnvk",
            "d5kV3drL",
            "msycSYCp",
            "nH3chYv3",
            "jKwpZgK9",
            "Bfgdwy4F",
            "xql4pvrH",
            "v6cQBjtg",
            "zppGQ758",
            "ZLLnMPTQ",
            "LzSP0kgZ",
            "wB7ytdTL",
            "Rg0rFbsd",
            "scMyx0Rj",
            "fVQ7JVw5",
            "snGfLQQT",
            "HCJ9k05R",
            "fK8mksNJ",
            "cFq0x5wG",
            "shVCLYyR",
            "LFP2ZkvB",
            "XSGLbC8M",
            "HkxCFJNB",
            "Y2xyC0P4",
            "GzS2P87J",
            "VfJTRJ20",
            "jYxkljKP",
            "mqqjkgdy",
            "zjpQnXdm",
            "SLq1cLCz",
            "ddB9BhqZ",
            "s9zYSFHj",
            "5vKbGLDP",
            "mfrpM9qp",
            "Cs3mhDTF",
            "s64mXTBQ",
            "GNZfPW9d",
            "j8MmLNdN",
            "f0nNGzXG",
            "RQggWDTq",
            "8vVLRfg3",
            "73HdH8YS",
            "WV68H96D",
            "pnhscyYJ",
            "3WjLyfrq",
            "p1kqFtXD",
            "BBXRG0lM",
            "1hVrTGxj",
            "FmhpzhJ4",
            "Hg564VzC",
            "GslzZfg4",
            "5wpxCJkR",
            "Kw4hYfJw",
            "Z3n0zbzc",
            "1qbpmRMC",
            "R0LbftdL",
            "tKSs5tRl",
            "Xk7YW19s",
            "4234zSDP",
            "2Gnlrcnk",
            "NbPQf42M",
            "QgCWmMCz",
            "hVppQz7K",
            "32H47SJv",
            "NMZyCN5Z",
            "K9RBHnsZ",
            "XCJT88kD",
            "t8tHJRNk",
            "JlDL6Vk9",
            "mFnGxb5P",
            "DSRpq2cJ",
            "pVQyrVmg",
            "Y07Mb7xV",
            "RvGNPrxN",
            "qyQ60TSv",
            "1f5WlGN5",
            "RQbL1972",
            "2XmpdMpB",
            "Sg0NgYrp",
            "VhzWT0zG",
            "7TnkHy7s",
            "qndp5rRP",
            "PNvxYnrL",
            "1G2npWPR",
            "9wdBg8kZ",
            "qlbdttYS",
            "1RN16Zb1",
            "g3f1lHLs",
            "sPSH23FL",
            "PYbDGFRV",
            "0TztWYnC",
            "zdPZTdTk",
            "hWdP3k4l",
            "KnGPKNS6",
            "KPNBchhy",
            "0x3Kgss5",
            "JR4pNfpd",
            "RHbbJ4g6",
            "6T6hPl4L",
            "8xHTrwW9",
            "NbFCGGSP",
            "pyw2h1Cj",
            "Qh6WZ1X3",
            "bpsn3WJW",
            "ksfJF3kr",
            "k1N1qC4Q",
            "k5RdzBk4",
            "nCw9CPPH",
            "bzFJnZ4g",
            "9bY07m39",
            "zxM1DmLt",
            "rpdWJkfJ",
            "3bq8S239",
            "Y0DsyNZL",
            "Q6z8GqlB",
            "RVH22j0G",
            "WQmTtNss",
            "NJm8X4pW",
            "6PlqSdSC",
            "DMCJhT3M",
            "yFJk7cM1",
            "4f0c2X4x",
            "BvgCgNJx",
            "6zYmN6Qb",
            "TmQs5CQ3",
            "LHT2n7wz",
            "NYnRZf7F",
            "YXtBXhft",
            "lz1cDXdm",
            "qrrGgbdf",
            "Bj2T2p09",
            "DJPmrBQq",
            "zJkjZ3Zm",
            "1T1yWgsy",
            "KgntGct9",
            "WSKr4L96",
            "H7gbZy2f",
            "MxcSMcnF",
            "5LLgtPn3",
            "myfwm8Qt",
            "GMPrVN0h",
            "NYvKz6Fx",
            "KVv1rTvG",
            "WW0xX89b",
            "8p4rtRr7",
            "mgcp5c8l",
            "4VwmptGG",
            "9ZQPpbkw",
            "ssgqxvT7",
            "gpdb6t8V",
            "8xZ4dmV6",
            "DGwvmd8K",
            "kW44nrTy",
            "qCm0yWJQ",
            "zkxF9MRy",
            "W9Gsxwh0",
            "9G3SlFyb",
            "Gx186zwB",
            "G3StBWhl",
            "RGSffWXR",
            "4PRV85dJ",
            "WFz2Yn8G",
            "vjm6MJ1G",
            "WCfFkh7Q",
            "dCSjtSdW",
            "yMsLqv5V",
            "4kXPDCFz",
            "dP4QKZkm",
            "gQ5F06Qm",
            "fnwsXL0r",
            "pj9Vl3sW",
            "DYJGHhJZ",
            "JJB66R6m",
            "zc888FkW",
            "7HpVNNRN",
            "JLBZMLrh",
            "mk2JPftW",
            "yFBqZhxw",
            "gCrTLxCV",
            "hM4R0NmS",
            "tqmrkQLC",
            "362xVwGr",
            "MN03F4BD",
            "MftqFnc2",
            "10Hd9tnL",
            "ncJTJ5M6",
            "y3xjYNg9",
            "yrNsHwxY",
            "xPjN170J",
            "dm5ftclJ",
            "CZ6XHRJM",
            "NCNpl9jw",
            "Xs3N33jL",
            "YCPrvytZ",
            "sD9sx7CW",
            "bw4ZPK3q",
            "jHTcHcc7",
            "xdYtxW6M",
            "WnJMfmfs",
            "PD2tYLjy",
            "9BJS2Z12",
            "7PGxCl74",
            "xczT7v7V",
            "lBCRfQzT",
            "1RHY6172",
            "GyCB3PqL",
            "vknRp829",
            "y7YymxVv",
            "lX8yQgVB",
            "GvKdWJb8",
            "CJB1tP9S",
            "6gm0pK5p",
            "PnYzSGlm",
            "NLt1n5BR",
            "Kr6Jvd4Q",
            "V7PpkPfy",
            "J2qF76y2",
            "Sl9t2RKG",
            "pgWLnp3F",
            "FzqHBhxr",
            "Q7d2fYmp",
            "ZK3twvYt",
            "4TgB8HjK",
            "PC4GSjZ1",
            "DvLyVy2z",
            "kkBsH71f",
            "vc6p487q",
            "qPCqxSr7",
            "3P7734zP",
            "xPB0WZQW",
            "05c9fkx9",
            "75drSjD3",
            "XtzCQqlm",
            "fxZDYxM0",
            "NMP7lTzh",
            "5mZ0GjnT",
            "5xjZPdVX",
            "Vk6Z6F2b",
            "YS2dfPtg",
            "yktr6pWg",
            "hQSXzxlg",
            "cYHBHv8b",
            "JsGd8XGB",
            "1XfRl4zH",
            "nSr0wXZL",
            "0C9H6P0j",
            "bfcD1x93",
            "RxDRkGvG",
            "TxZdf0Pl",
            "7qpD85tY",
            "4xNjt40J",
            "jg5wmBXX",
            "vv6f4STF",
            "Pc919P8g",
            "NTkLChGQ",
            "bTH9ZYxj",
            "Vj8rkZFR",
            "CC8cwCyp",
            "jhd1kJpC",
            "k8V70ztD",
            "9mbCNxKS",
            "H4jWs7pr",
            "5p9kjcwX",
            "nmYhDHH8",
            "x3JjqW2n",
            "VLLy53jj",
            "sl7Yvqzq",
            "YYBPHXwK",
            "QxzYqbm8",
            "Kx68cH9N",
            "z6pxnt2L",
            "0FVDllPr",
            "qY6kg20k",
            "VqhZVCzc",
            "qLgvR1Gm"
          ]
        },
        {
          n: "08_Hall F4",
          k: [
            "6kDvT7zz",
            "rtGHhsPT",
            "hxrbrThN",
            "x86GCl9v",
            "xtN8SWQd",
            "BPs0gx5t",
            "HrkxR0fc",
            "t6Dkcz9Q",
            "pRkcTW0M",
            "M8FRfLt5",
            "1z2NMPN0",
            "Sqqszzq0",
            "fkpMpf6Q",
            "qxfSK9Cr",
            "kh1pf6PC",
            "kR5Fy4cp",
            "lB9QqjJr",
            "s4xzNpM5",
            "m0pR0QHg",
            "XYtm342d",
            "cCC12jBH",
            "Xkb6TfzB",
            "SJxlxPyP",
            "P10tVqJ3",
            "nRK00lgB",
            "rJ5rVWlk",
            "xcRxSDzk",
            "fnHMBMCD"
          ]
        },
        {
          n: "09_balcony",
          k: [
            "x86GCl9v",
            "SSb9VbC5",
            "pmh9hRRK",
            "vFqsydyJ",
            "QScnNpQ0",
            "xPyXr2sB",
            "nbcKyHKR",
            "MLPrtWbK",
            "7Rg8QDhp",
            "kR5Fy4cp",
            "lVfj287J",
            "dwZk3w9P",
            "Sg2yMTS5",
            "v967fHrT",
            "lplRbvPW",
            "y5dffQ9t",
            "HG1wML7l",
            "wZJBQll9",
            "zwbXk0tc",
            "ZZHVM8Js",
            "QVNmjH6W",
            "Rvp5L0X3",
            "Jmg9lM5S",
            "c9LVL930",
            "hXl7mP6C",
            "d6ZsVWC6",
            "zXZJJMQH",
            "4yGfp9rc",
            "PTMJFy7l",
            "5BQBCjFg",
            "3kfFKFMN",
            "4DLRD35w",
            "6rcLNg42",
            "nRsMyZnJ",
            "W5l3xmF1",
            "37f5GdBM",
            "pRHBmy7X",
            "0GGb4F9R",
            "gZ23YMCq",
            "WlBfTFYS",
            "S0g42QY6",
            "4jysDzc0",
            "DM8LkrYD",
            "djvphTs7",
            "gMv9HN4D",
            "dRc54Rbw",
            "dYbnDxby",
            "k4qkfTTD",
            "3vddLTc6",
            "3DFBVvgM",
            "214T2YLQ",
            "GVWQ9RpQ",
            "0481w6P2",
            "2YGQcF5P",
            "gHwdWVmD",
            "ZrGlMLP3",
            "Y1T2MgQK",
            "ndjpfRR6",
            "L7VMyj8Q",
            "g7DyHQ7Z",
            "F12Jt3F5",
            "BLM2cKCX",
            "73yjdVl1",
            "wcKWCFng",
            "r2WBkND2",
            "yVFKJF10",
            "SnTPctbM",
            "bnLLXt7N"
          ]
        },
        {
          n: "10_office",
          k: [
            "vCJ2BkMm",
            "x86GCl9v",
            "PgXMWPqw",
            "kR5Fy4cp",
            "SV58v9Zs",
            "LLGfLy17",
            "N4byclsK",
            "PBcctD03",
            "nNGwclth",
            "KdYrdW58",
            "RD852f0m",
            "rpZGKhwK",
            "q44gQNLG",
            "Lm3sh33k",
            "YkNtkHRS",
            "L1g1SRhY",
            "ZgzlJcly",
            "vRcdR1bJ",
            "JmJs8j66",
            "kjfR1rjX",
            "dPC5ZB44",
            "wQGWmNPg",
            "Wr4t7nB4",
            "4wXfJhlr",
            "8Bc8m5cV",
            "7dM2RMk6",
            "tpX3yNwY",
            "x71YqX93"
          ]
        },
        {
          n: "11_Hall F3",
          k: [
            "B8nnGVsB",
            "0SSJwf5w",
            "7dlFg6QV",
            "lvgjSq9q",
            "RD6rdjbw",
            "Q9TcNzbB",
            "z3FK7B9T",
            "93cx14gs",
            "y7q8wDbj",
            "6pRRNxLm",
            "xgHCv69n",
            "51WFPyN8",
            "3mTkJFZk",
            "DNCrmxJs",
            "cymCRR0k",
            "yjQBZzGV",
            "kR5Fy4cp",
            "9FncjMlZ",
            "x86GCl9v",
            "87Ff87TQ",
            "L9cFyltY",
            "TWy7FTRh",
            "3LjjLs3W",
            "mQzmVGRH",
            "w1yFCwMz",
            "tN8P82xZ",
            "YM9RlN38",
            "1v2VYRjG",
            "1ZPHshPj",
            "99WSNZtN",
            "QhGrXdc4",
            "NrHKvvJq",
            "vzS6syGc",
            "MtyGkZxj",
            "pf1HJdY5",
            "t8L1NSgj",
            "dpBzqp06",
            "Kht3shCM",
            "lpW5bN22",
            "NbW0Fnv7"
          ]
        },
        {
          n: "12_Room 302",
          k: [
            "xgHCv69n",
            "zKFbC0hy",
            "kR5Fy4cp",
            "xJYTDCLT",
            "x86GCl9v",
            "TqFS0TKs",
            "HPf011MN",
            "LLf2sK7R",
            "R2v0JXKZ",
            "DHhLNcKf",
            "0sTBxXmF",
            "JlPH7d0B",
            "04RpSlhb",
            "tqqkwH4H",
            "b9TkgxNN",
            "Cmft8GdL",
            "WLgfN7bh",
            "hRyr8KXg",
            "RPf7Thd4",
            "zDTwDWVy",
            "TnjqRlyS",
            "gvDjrdPk",
            "YjV1XXMq",
            "071KRdNW",
            "hwzqhYmR",
            "pQGVptB5",
            "0PTmXxlh",
            "sHNM263S",
            "x494wVX8",
            "b2bhSJCt",
            "9RSmYnCf",
            "szT5TtpL",
            "mCHmNctJ",
            "qZksQVCQ",
            "YwmQBhrV",
            "mlDgTgW5",
            "x5Rs4BVT",
            "h47C0rvd",
            "1t34p3XK",
            "KnL8QC4d",
            "XyRdSjy7",
            "qWhCpMdn",
            "RvQ5w3GM",
            "SPJlDBKg",
            "f0MZYdsj",
            "5z4sFn2W",
            "lBySd9ZY",
            "F1rXYYGZ",
            "PqlkC0SS",
            "3dr9CpQs",
            "fVQ7JVw5",
            "V36cSjgw",
            "Bq1W8Hcw",
            "XY15cQtP",
            "NF7tGz8C",
            "c25BjGGG",
            "3FwX972V",
            "dWPYSTXc",
            "vkX8tRMR",
            "lKLRXXL9",
            "n5zwTKLY",
            "W6fr4B9B",
            "77dcSkPM",
            "cVvHMwpn",
            "M373s9kB",
            "PZ1z72ny",
            "L8jDf1Tm",
            "16c5GRJC",
            "rwPH2WNv",
            "N17CJ60d",
            "jblFRFBx",
            "Z0ZNkhDL",
            "1l71FLVH",
            "7nqr5cpS",
            "FxnX4x1R",
            "Y672VsxW",
            "crmjHk4J",
            "2dyrTfdw",
            "Ky3gTqpf",
            "vLp1cHNr",
            "09743Q2v",
            "fdLyy35Q",
            "BZnWcYcC",
            "tB5PXr5M",
            "wJjpkR6S",
            "P9PhQ44s",
            "NNrf9Hqk",
            "fYKBg90j",
            "MrpkGBq0",
            "2Fk4ffvK",
            "gHG0NKJS",
            "BDZ6cw8b",
            "MNGTxv4H",
            "kyZL4GX4",
            "3TJLLp3z",
            "Bt0fhnZs",
            "Rx5XQYfM",
            "p4qQJ8Nk",
            "cmsPYwx2",
            "jK6Xk849",
            "jrcytHbS",
            "pQyy2sjz",
            "3WsnRQhp",
            "2qgsKJHP",
            "QHXv90Jx",
            "YXKS0TWT",
            "qbCzytQM",
            "cdQxW2fG",
            "XJPKXMxv",
            "V6fS64T0",
            "dyX9hYsL",
            "X5LMn3mg",
            "SCdcWnNl",
            "bKFC24rq",
            "jkdv6Spt",
            "c3YL4mtT",
            "NZD3mLgC",
            "r6HMJHM0",
            "jBMStFMf",
            "g35PHWPN",
            "M9vx9clK",
            "JtFbgB13",
            "c6PQbDYr",
            "GVQ3s8qG",
            "P3C1vq5P",
            "L9klgPdn",
            "3bZ5P4YJ",
            "YYjPfTyn",
            "qncYnnBC",
            "XXTTyVlr",
            "4jwnPSB6",
            "X2zlpskp",
            "LGGq73Dw",
            "ZcxR6cHC",
            "Y7FZ2HmX",
            "PdGC83XK",
            "lPp0P50F",
            "CXSsjkzJ",
            "5w984Hml",
            "VRm9Wb6t",
            "4WJGXtQX",
            "TD92h5LX",
            "0r0RpBNz",
            "j8W2Rjhz",
            "tNP436mP",
            "xj8h6v8H",
            "gBK0WMBG",
            "99zszcGg",
            "4z8tNT8p",
            "g9Wh6lvh",
            "fhGJXRtW",
            "0kBm6gW4",
            "DsYxYdWH",
            "3zgrYD89",
            "JqvN06YS",
            "rsVTGCqS",
            "tbdYDJKX",
            "JytG1SVK",
            "j13gLhhw",
            "mCW8NyDg",
            "2zTxPTPk",
            "FFf0yHxc",
            "v9v61cpP",
            "T0PnYNXf",
            "jfGbYNdh",
            "v2fYzhrR",
            "V3dq5K8k",
            "xRB52BHR",
            "4Kc4FXWN",
            "7x2Rk6fq",
            "3CZQYRhR",
            "NxzPYkCg",
            "m4cRxltg",
            "bQDPcXq3",
            "nmthNb0X",
            "ZRQk03Hw",
            "JQZt6rxj",
            "H4BlZ7W1",
            "3k4G95TD",
            "xdkMnN9S",
            "xfyJxlvH",
            "g05lxXMp",
            "SBPTf491",
            "XHkQD3Jk",
            "WXMHC0v7",
            "H0wh3NQz",
            "Y5kRMrFk",
            "HHfCp9Tm",
            "M9RhFPJr",
            "XjbVHlJT",
            "wSgfBYbD",
            "2gnxB4ZW",
            "JCwMcRYm",
            "F0Xk3xJg",
            "NFGwLlGC",
            "brsBxswt",
            "8gfTFqFh",
            "T8ZpHtBP",
            "VKQ0G3hH",
            "SLY5740G",
            "Vf9RLv1Z",
            "30y8B6NS",
            "FYZbMRVy",
            "VkCmfNfK",
            "8K3jBTX5",
            "VQb3Nlgv",
            "hGDSC14p",
            "QjhFvpNW",
            "NLTwsc8B",
            "jKrfCS5s",
            "GZd33ypD",
            "pYt2xhmr",
            "ZhLS2Wv3",
            "6tsM79Nw",
            "PQxPTD6j",
            "fpv39cz5",
            "XhRjC5n6",
            "zcmN7jvM",
            "yycN7ckv",
            "qRVvKvVr",
            "5SqP2Tkv",
            "900xDVqQ",
            "Jr8L64Yz",
            "mhdplSrh",
            "sFtC9z6r",
            "dbJgSykT",
            "gQkc97lG",
            "pZrCcXtK",
            "G3zdJ9F0",
            "BS0jcw8C",
            "g5l6LYhQ",
            "4zBnmdxG",
            "ZzsTxtb9",
            "njfFzz9D",
            "5nS6TPbT",
            "92gl1HF1"
          ]
        },
        {
          n: "13_Hall 2F",
          k: [
            "sJQcb3S1",
            "B6gNBJCd",
            "H2PM7l6f",
            "4Ydb7Q1J",
            "x86GCl9v",
            "z3bKHf1L",
            "kR5Fy4cp",
            "8Z5jlrsn",
            "TJn3LSSC",
            "5tgJXLmh",
            "2QK4xTBZ",
            "V9dGkcdc",
            "7VhVVnbS",
            "Q9rhRdQl",
            "kRT9bb2H",
            "hFF6mQCb",
            "BnbZkkvZ",
            "2Fv3qdRn",
            "qJx4x4Jq",
            "j5VC5c5M",
            "ww5Jv5r7",
            "WkgF8s87",
            "lRJfzgbm",
            "325WlsV2",
            "ZpQ1sGYy",
            "KxYMJJzz",
            "dTpS46qN",
            "QxVqX7f7",
            "ZZqFYy9z",
            "zShcqrYR",
            "s6QzVKtJ",
            "2846q2W0",
            "G4HQss9P",
            "bgryWq3d",
            "w0r1njRk",
            "CFRBgFK6",
            "1n7pWWby",
            "dZkkY5Rt"
          ]
        },
        {
          n: "14_outside",
          k: [
            "x86GCl9v",
            "NFgsWG7b",
            "kR5Fy4cp",
            "22KyG3bT",
            "LQWcBt9g",
            "HnDnTmzd",
            "MjlRCQZy",
            "pjRry6hV",
            "PvwqdS9Q",
            "gMQWYzC0",
            "SwJ3B1Fk",
            "vnLg28Lf",
            "9JzkDZSR",
            "1zkNZZzj",
            "ZlznMrfw",
            "tWFcgSZg",
            "vdHptvT7",
            "PDNDgNlf",
            "L9W9wJJD",
            "nZpkqLQR",
            "0jrBN2j6",
            "zNqlBGX1",
            "h74sNh6c",
            "HrYzQNPt",
            "xwZlYhyJ",
            "3slfttx0",
            "Tkzp8gwm"
          ]
        },
        {
          n: "16_memory",
          k: [
            "hpCv7MK8",
            "hgLZR1tr",
            "kJ8dGf8G",
            "DhjcNNgt",
            "SNdnG1Cn",
            "XGQhCS8X",
            "NfKLmRgk",
            "Zwc6PlbY",
            "vMRQQgHb",
            "HGSD8Fbd",
            "7bX3Zlt8",
            "1VVmJRhz",
            "KLlYx47l",
            "cCgZcVhK",
            "cqn8wkvQ",
            "3qWPcGMB",
            "ZNT43m6J",
            "mzkryh2Z",
            "8XLbkCnQ",
            "vGyx73R8",
            "ZsnzFhDr",
            "TTBTWqLV",
            "YslV90tq",
            "8HzMKfHc",
            "894pDJBF",
            "q2lq2GYX",
            "tRRg1bmp",
            "N1GXCT3N",
            "0vfxbPQv",
            "sWDVCp4M",
            "9Pnb6Qb7",
            "QhGK383w",
            "Rf7N3XfD",
            "sMVGC4X9",
            "bP1zM5hB",
            "5vHJhTRw",
            "rm1skRXt",
            "hF74ZK3W",
            "39J5341J",
            "NTdTzxxM",
            "kgj2MpsS",
            "yZpfmMXj",
            "cF0ZK76H",
            "BJD1ySvR",
            "bmwlHTVF",
            "x86GCl9v",
            "tzF09Zjt",
            "kR5Fy4cp",
            "FCjBY2d5",
            "rkH0NprP",
            "ZQpcNZ1K",
            "bhy9gQvJ",
            "HVL2CpSD",
            "M0MBlPGC",
            "Dvzzlq3P",
            "8fxBRYwj",
            "rRhC8W21",
            "LmZTJNvC",
            "LQrpFwMz",
            "CM6KHXVf",
            "PYcpSDMt",
            "g5fzBjdm",
            "7LlH8mXb",
            "XLWlB9nP",
            "KnghrMKz"
          ]
        },
        {
          n: "17_warehouse outside",
          k: [
            "hpCv7MK8",
            "20prtjPh",
            "kJ8dGf8G",
            "ydbWzCTZ",
            "bBvbP6Cr",
            "D10fFbkR",
            "nYkgSHCs",
            "RWvJTKm5",
            "rPHQ9cBZ",
            "zlh8kWr0",
            "Q2d9Gm2z",
            "yMpHZNHf",
            "xLgj39YX",
            "pDKhqWTM",
            "Z9QXpfKd",
            "5W2ZYJFF",
            "0LD415f6",
            "M0XCknZv",
            "lxjVlr2x",
            "nrF1sR8H",
            "Zxzg86cx",
            "N8YQ6k7R",
            "My39z8jD",
            "hqYTLW7N",
            "ZqR3MT55",
            "0NN2W6bS",
            "9RKv62J4",
            "PpmbSFQL",
            "y75xCnbx",
            "hhzlzg8C",
            "wNMqq4rm",
            "kX1Yz2Sh",
            "7yPTNSMS",
            "gYs3rbxy",
            "mPFzKxX9",
            "5KTwYPGl",
            "nzvTktYj",
            "f17nrjk2",
            "cZNk48KW",
            "Z3ZXHjQw",
            "MK7tVw51",
            "gS5w4Ph1",
            "w0w65qFM",
            "RLfc8wQ2",
            "T53Ys12c",
            "0dglcdYR",
            "NS9T4lg2"
          ]
        },
        {
          n: "18_warehouse inside ",
          k: [
            "hpCv7MK8",
            "Wp6p5kMm",
            "21Wqj7CN",
            "kJ8dGf8G",
            "35wT2NJS",
            "SfT7tZkK",
            "L0YCvHRv",
            "PWj7yXtF",
            "TS8jKqkm",
            "yMpHZNHf",
            "67kX1gg4",
            "r0przYJX",
            "Hsgvdt9V",
            "TczWZd9m",
            "2nBq6C25",
            "Y1X8zBv6",
            "2Y9HJvh6",
            "lbYkdw2v",
            "pqyDzvfj",
            "KsqbJjc5",
            "jQJ9y84z",
            "1LMgZjLy",
            "9s1GXKH7",
            "rrSCtJgl",
            "5VRJ3MVp",
            "SD8k5mzn",
            "xlwDZzBR",
            "5KF40V0X",
            "F3pxh6mq",
            "q9NtTt6z",
            "R6543zyG",
            "Dhk87gs3",
            "SxL6484v",
            "tSdKLZCz",
            "vNH1RQ52",
            "NGp3FMvF",
            "l52z71Np",
            "K6MtS5Cj",
            "G46bvFqg",
            "XKYJGf73",
            "yTk1fMZF",
            "JRkHB09h",
            "2L8sd7k2",
            "57S9WtKp",
            "5pTswQxF",
            "gMhPTdpf",
            "Zw9fdFPv",
            "93vtTDkn",
            "zF57WSCQ",
            "PQxm0130",
            "RYB50L4s",
            "rNQ5l2Hd",
            "1bjZz3J8",
            "ZpDFrrWF",
            "5jxx9cSQ",
            "CWvzQckX",
            "h544MZd8",
            "nvGHGc0k",
            "HQscGyDl",
            "DnrbgQxB",
            "Bbgtl46V",
            "mddtQfrB",
            "FSHZr5d2",
            "ymVpL9Pr",
            "7SVl5XMs",
            "FMb2dRB2",
            "hXVvXKjH",
            "QB4vDcgH",
            "4n1C4Q6l",
            "5C4ZVXTX",
            "vMYz7Zcw",
            "GQFchyGf",
            "nJxNhy8p",
            "rXhQ3fxk",
            "K25xwnCG",
            "HRPNkk5F",
            "cCgJ4rlL",
            "GqtvCQ71",
            "kcCZfLGm",
            "D37DbqHs",
            "NxsphrXy",
            "4X6Jwqmk",
            "XPSNFwTS",
            "j4X6w47q",
            "nCYT85ss",
            "d8m1ZWnV",
            "91ZYdNsg",
            "VYd8dDrX",
            "FXvNdHXl",
            "B1vrfRg3",
            "nWWCJX8T",
            "k8Dcl0Zg",
            "51ML1y8G",
            "NTyHtmDf",
            "w6j9KK04",
            "mHmdyXH2",
            "XbGVQc62",
            "KG30dSjp",
            "lJ9D86SG",
            "Mg7PHpvW",
            "69Tp1V3w",
            "J5TW4B6H",
            "MTyRhWgS",
            "z46xF4vv",
            "kMSYxdvq",
            "hyfWC9yN",
            "t5J6XdbB",
            "80ls8BlW",
            "mySDJ8tg",
            "pQpMGl5c",
            "fgdkhhfC",
            "C8MJzqM6",
            "XhGw54g2",
            "YqXNDWc4",
            "Yd3tF8XD",
            "N5BRsbHz",
            "Cgqx4znS",
            "cs3tpNT4",
            "F29Dtl2P",
            "l2N020SX",
            "zLlDSCyR",
            "Xc2MG4ls",
            "gJ01KQsy",
            "71pflnX5",
            "BTYPdRmH",
            "V344SPVd",
            "qQp86YpJ",
            "BT22xwG1",
            "3x0c59CM",
            "p9wlN63h",
            "RWNnzPlN",
            "91VRPxYP",
            "s88Sgdv1",
            "BKlLPnSS",
            "D09hGXNl",
            "6ZqCM2zy",
            "R0Xjj5rr",
            "VpZDd1sn",
            "d0zhxnzp",
            "cr6n8Nmv",
            "qG0pP7dc",
            "S3pMb9Vr",
            "kVRmzQRl",
            "8k9zq9C2",
            "g3W2nVdt",
            "rQ9XxZDS",
            "1kZvwPsR",
            "dngFsrxn",
            "XtLSpbMc",
            "XdpMRxJ1",
            "qWYdQj40",
            "2Yr7XFFF",
            "DkFPyhNf",
            "hJwllTvc",
            "PMqZCwBP",
            "yt4wHpc3",
            "wTjrwc4g",
            "9RsJ2p8X",
            "ZMxC8JSq",
            "fXGjsSsP",
            "PyfZlMMQ",
            "80cCF5jF",
            "lVmBJss0",
            "jWPTHGQt",
            "YDTVHWXF",
            "4cXljBCb",
            "VnW69zWQ",
            "yJ3392Dx",
            "tLdW1wLv",
            "zV7w6fn5",
            "1xGxn9KJ"
          ]
        },
        { n: "ep2", k: ["zKRhMLJ5", "PvFPvffn", "TwltJk9y"] },
        {
          n: "20_street_day",
          k: [
            "Q16TMWgZ",
            "V1nlgkGH",
            "x86GCl9v",
            "rC7d7GfF",
            "kR5Fy4cp",
            "cgqQ3C0l",
            "WSFvbKj3",
            "PWq5kVln",
            "pPS4k6ll",
            "CJZrxYqs",
            "3wG0H6bG",
            "K7Ntn75Z",
            "JjHx9xzk",
            "NFNsXbjN",
            "0RVrFr3x",
            "0p9xyBDD",
            "DZgHVJ1Z",
            "ymNbB1Vp",
            "PBqH6xjT",
            "6qDxRRwp",
            "sv4RCpj4",
            "gt76c69D",
            "1PRmn6SJ",
            "sbhSzlvk",
            "XNnw4hH5",
            "sP7Qq09m",
            "43PBZsWH",
            "fWMKrVlY",
            "sgPbDHKL",
            "CNvTvzdj",
            "LLNbkFS4",
            "PjZZwwBx",
            "qmqZ1RZG",
            "jVQ93bw8",
            "MQ9NKhyv",
            "dh65qlfJ",
            "6BbVrbfS",
            "phpHfN9m",
            "ZT5NrD24"
          ]
        },
        {
          n: "21_parking",
          k: [
            "FDbSdnmn",
            "x86GCl9v",
            "sGzP27LJ",
            "kR5Fy4cp",
            "W7G4bb59",
            "m7VX79yw",
            "nP3wyPNw",
            "kknPJFDk",
            "589WcNZy",
            "nRYPm8hM",
            "1DYBm3qZ",
            "1Rz9zH9s",
            "Rq5Hb4y3",
            "4wvRyDmk",
            "hyPDFJRc",
            "L5Cfp1ns",
            "NmjYGPkT",
            "YkzF5Rsv",
            "qRs7v7cQ",
            "70rZkCtG",
            "5JqY3nF8",
            "7JWznFGj",
            "s7qRN9Zv",
            "hWlcSVby",
            "qyz3M47C",
            "WYFjM6Cy",
            "01RTHJhR",
            "NskVTDqB",
            "jXlQ0rRy",
            "J6psWQLw",
            "ZGkCpYmP",
            "zVBPdnQW",
            "hJ7H6j0n",
            "SgYVyW6D",
            "C0nrkf3z",
            "rst55M85",
            "b8GzDxnW",
            "WGbtrBF5",
            "LJ819Gt4",
            "VzjRrFy5",
            "xXNf0NrQ",
            "yqWNgtPp",
            "hcNH6FZF",
            "vj9zg8Fk",
            "5Brr95j8",
            "7XkrGfqJ",
            "Fj20pG92",
            "byGt8Hzg",
            "qtKn1JVY",
            "G0ggqz2M",
            "ZtcJRKy6",
            "kTvLK0nC",
            "y3x4Pz2k",
            "qjkx4Ybb",
            "DpFgccPD",
            "Ms7GNtLP",
            "w4k4y5Hz",
            "XgTXW5X9",
            "wr8PYkRP",
            "Xr5TyH6Y",
            "qtfJ7lfs",
            "dVdf2fr5",
            "FJTcK8SW",
            "K26txgZS",
            "65SpdLRJ",
            "XYpCTLWM",
            "lQsKc70P",
            "knxnMTc6",
            "Bkq6K9qH",
            "XgRMGhGB",
            "YXLTklqJ",
            "5QL8VCWg",
            "BLk9n7KM",
            "9DhLnYl1",
            "bF8lVPHk",
            "F301Rp3Q",
            "ny2H8Zh7",
            "bS41yqTn",
            "RwHSZgKr",
            "l0Jymqsn",
            "bZZRxBFf",
            "FK66tHYT",
            "SFZybL2K"
          ]
        },
        {
          n: "22_motel_room",
          k: [
            "cm9D3LBc",
            "kR5Fy4cp",
            "gScc6pMK",
            "x86GCl9v",
            "KX3TwGJz",
            "LlprDHVt",
            "G82fLQBv",
            "C0vhN1vv",
            "sD3wdbHm",
            "LP35M3gf",
            "gg973f6t",
            "FnQHdSLz",
            "zFsc1xG3",
            "bY1NNhSH",
            "402Zzg81",
            "0Dtz1K4Y",
            "3vzZ6CcQ",
            "VtJDv8Dx",
            "tD2NLv95",
            "6SDnXYzp",
            "fGHbTShM",
            "QhVnK9Sh",
            "71vSgxlt",
            "3cXhqBxB",
            "HLCstHZb",
            "Fk1yJnsc",
            "yB3sR3F8",
            "6LcV2RyD",
            "rf7Gwz7h",
            "YgS4rNbP",
            "rMNlCf5D",
            "Snbpm5jf",
            "4z1zMqyL",
            "4TpWlt5t",
            "YnG0zzpS",
            "wxPr1rxj",
            "3X287KzF",
            "7MftB2dY",
            "t1mR4QYN",
            "dSQr5Vsb",
            "LbfnKtQP",
            "4HLQggLX",
            "rSzlN5Mm",
            "KNH8ynvq",
            "pQ60rxnx",
            "Vd74PqGL",
            "GrrWjQ8s",
            "VbX85qFQ",
            "LvGxgPhZ",
            "xshPXy27",
            "JG62xyrL",
            "snWm5ymN",
            "m98B3DJz",
            "8NybSJMB",
            "jBnHQ24W",
            "XNQjYJBN",
            "BzLRNFvS",
            "12V8T2Hm",
            "6MYzBwWd",
            "Pn34v4j5",
            "k2CShV7p",
            "P6yFc5WC",
            "lnp6ynVr",
            "KwGn8wBN",
            "dtlpLL0m",
            "XGblb1lW",
            "S6y8vK61",
            "hpswdMwX",
            "BSB8kPt8",
            "0Bs5wbvQ",
            "zzBPZqmk",
            "vN1jNgKy",
            "7pMrWmr6",
            "dzc0y6Nf",
            "DXB9rwgY",
            "hBCpT1hm",
            "6HbWqHX2",
            "SyQkK7FH",
            "2R3PzkFF",
            "KsV253ql",
            "tDDK15wN",
            "r8tPSc3l",
            "V3pnfjwx",
            "jx1wZ5V6",
            "YhsQt6xF",
            "FxghysrF",
            "H74f1KrX",
            "v2GwtLY8",
            "zrXNLs2h",
            "fbMySqTW",
            "1W1lHkxk",
            "SK8J1ynK",
            "0DGSVBLg",
            "nf4Dvft9",
            "53kRBvP7",
            "3LYkbdlb",
            "TMsZy5Nf",
            "BQxWjWdc",
            "gxCkFSZt",
            "0RPN1zN2",
            "6G0zv2nr",
            "V9RtH9cK",
            "wP7Ks3dV",
            "tV8Yn7bP",
            "TNnGM7YF",
            "hHQDytlM",
            "0R81qNRv",
            "y71Wv5fZ",
            "t1dkg9dY",
            "K8mnFHJ8",
            "nCwXTMrq",
            "d5vvQQZ6",
            "fSQXfB97",
            "f2DFWY3K",
            "t13zLs73",
            "vl8mPX0m",
            "PSD3PYk5",
            "7Mw9lckt",
            "FZM40vyf",
            "MK11YCtC",
            "0zK4Q4H8",
            "rWN7jd0r",
            "b1Y9yk8q",
            "0KBgbjyb",
            "kqcLtGst",
            "ZRqhqnyK",
            "MvSF6S3H",
            "4MQxX0cR",
            "wYMcmwsX",
            "KBCGgYBJ",
            "MN7NGRfR",
            "r9brwDVQ",
            "CMkhHBLm",
            "sjsgkzNq",
            "CNF5pNlz",
            "rWD9p2vS",
            "hvknm4lb",
            "VwPCVswT",
            "KjW2wXSl",
            "Y5cGRDWD",
            "5x6ldYw5",
            "yt9c42Jf",
            "Y1fW5h4z",
            "xWbLpZrN",
            "X6XRrnrX",
            "cfnlPRHc",
            "fy3gtdqL",
            "13CrrgB8",
            "5N1MNBSp",
            "ZF5pjZhJ",
            "vLzmtNHj",
            "zQMSqX6f",
            "nD8H67kN",
            "95c2bGgH",
            "b0XND7Kq",
            "BmTHg24R",
            "rdNRRT20"
          ]
        },
        { n: "23_motel_wc", k: ["WVrW0rjd", "qF7pLNvw"] },
        {
          n: "24_alley",
          k: [
            "vMXBwk1Q",
            "CFfxJgHr",
            "gzry1T5t",
            "tm4FZR2h",
            "djqQk1fN",
            "JXZym03t",
            "Rvf3dFfq",
            "R0dkqwnX",
            "LRXdLbX7",
            "dvNfzjJR",
            "kR5Fy4cp",
            "FpbrDcJF",
            "X4WQMNhw",
            "9Qc3wHHC",
            "Yz2G1QHS",
            "4JmbbJPk",
            "xVNq2LFc",
            "Kjxwlhgj",
            "pCGzS0KW",
            "pTjvCgrP",
            "PwmsX6Mg",
            "SMXBSpMV",
            "5V50WfWw",
            "x86GCl9v",
            "WcgQ5qTX",
            "R9DSfRP5",
            "mJFT4fTq",
            "NVlN1zVv",
            "66Fj7yRH",
            "ZxyFxrtl",
            "J6NWjTwk",
            "QykPz2JH",
            "6DXDs5DZ",
            "3DsLs55y",
            "KJJCStv0",
            "ZGBPsHyQ",
            "Lg96dkzR",
            "R6Fx1M4M",
            "YwgdlYhC",
            "MVRV1nd5",
            "21YwKqst",
            "wHSjnf5n",
            "T2FxCJv0",
            "kFQTFqQL",
            "Gzr6SBKZ",
            "PvRvkRlv",
            "0XF8g0j7",
            "120pPZpn",
            "l2bP71Jk",
            "tfdjv6YM",
            "pdlc9Flj",
            "zJxPQXdw",
            "sYSvGdWl",
            "mJLy53nD",
            "tY4LrYPQ",
            "9gxBCgNF",
            "gzxgQr3X",
            "6sWMpydP",
            "ZcNlW5C3",
            "wSsD9YPc"
          ]
        },
        {
          n: "25_cloakroom",
          k: [
            "zrjGb3vm",
            "WhYy3yLm",
            "kR5Fy4cp",
            "RW1rc3wJ",
            "sGxYg2dt",
            "8RJbBYQh",
            "ww5lbWFX",
            "SvxHTGlG",
            "fnfYKXXh",
            "Tzq46LvR",
            "9W2SML9l",
            "j3bDStHJ",
            "kmSy0CxT",
            "gCkH2Kf6",
            "YrDQwn0x",
            "YpH3wr0Z",
            "3LNG11hB",
            "YD3QrgJs",
            "X0htszmQ",
            "9tqzXDsF",
            "Z3nGwvn3",
            "W4FWJYGn",
            "nqLz2DG0",
            "LPYmkGVj",
            "DP1StY6w",
            "YrRqpGWG",
            "LrwlH1yn",
            "bp0b1WRS",
            "JSHgWKb7",
            "MZxj9jwc",
            "FT3jshXV",
            "6mSf3QgS",
            "j7XQKfTC",
            "bZ5wtrKm",
            "W47jTrLV",
            "V4QLZpFw",
            "s5jKffsk",
            "8gn5dKcv",
            "63JpGPvg",
            "yRCRPfSS",
            "m6cSD0pY",
            "X7XKyMDS",
            "q3kwx5YQ",
            "ZKzxMJbq",
            "x86GCl9v",
            "TLB49blD",
            "62DYGy43",
            "n76x4vjC",
            "9nrQvv9p",
            "dyRRpMsP",
            "YYhllq20",
            "xTzR2Y30",
            "FM1X7fZS",
            "NptSXZTD",
            "8G1hPmPt",
            "sFVMyw5y",
            "dv6y4sDh",
            "jBVRz65z",
            "vkgsWtQS",
            "L6bF6WK8",
            "ln86zy52",
            "wKZXnT1K",
            "RHb1KKsG",
            "0mk3jwjc",
            "vGWbNKxq",
            "2GYP6JHX",
            "rd42BcZn",
            "V9MHdrhC",
            "bV646jbQ",
            "0YS9YjLc"
          ]
        },
        {
          n: "26_street_night",
          k: [
            "x86GCl9v",
            "npMBSS6g",
            "ntZbV0Q5",
            "kR5Fy4cp",
            "PkF6y20R",
            "7L665QVJ",
            "PcpJJqhF",
            "Y1Cm7G8q",
            "LQfcTM2Y",
            "sjW38mnM",
            "bFhxTl31",
            "SZtqjYL1",
            "5n7Y5Zd0",
            "Sc2JrNQ1",
            "Q3NF2ZlR",
            "HmFLHK7N",
            "JK4tQZQ3",
            "whgrJrpt",
            "bbCjl6cr",
            "Q9hfxGzJ",
            "lPq0hMtV",
            "NTF8hJDv",
            "dfJncS3H",
            "tm4FZR2h",
            "nbvNZHXh",
            "6R0KHcQL",
            "DyVKpg8v",
            "xxhHTFr6",
            "RrwPBS6F",
            "V9tNFn22",
            "4bYt3cSZ",
            "1TZjyqvt",
            "GWHzXsV3",
            "nsMbJrNw",
            "tzqbwb5r",
            "8SVgqv26",
            "QnDh2nTc",
            "5Fr0Phc8",
            "ZrMLdHNj",
            "jW3vyFSz",
            "QXzkkh9l",
            "mFfwWttv",
            "hjD1q0hl",
            "Q9CPsVhT",
            "flt7bl63",
            "sbKxkb63",
            "rT5ZqX02",
            "4FD963D1",
            "5gV53Km4",
            "JVQLWzqZ",
            "2NczGnml",
            "QXQBPd20",
            "k91yr4r9",
            "B1dCSbYT",
            "cJ8NWv3H",
            "RdYyCZ1H",
            "NgzR0V4P",
            "k1SJbzTw",
            "dMQ5FlNq",
            "vxcPr2cR",
            "rJ7wC2YL",
            "DbznCkkQ",
            "hNM9CwFW",
            "1rCvN0wy",
            "fTSRs4RL",
            "rYGZC7NC",
            "xps1G4Zd",
            "0R6bGCHD",
            "dLYxFx38",
            "1Gwx9h5C",
            "2NvBg3SP",
            "f0tmqg43",
            "mGDGSGvm",
            "sN6Z5z4P",
            "8JGJWJ0D",
            "BFLz6nBx",
            "W7nzbnJ5",
            "h5Vl4qJQ",
            "Bkqr74dj",
            "cbvDNC1V",
            "TkQl6Dh0",
            "KCncvxzc",
            "7s3ChvXP",
            "tgD3wP0j",
            "2SvZb9r0",
            "pJH6t8PT",
            "7wrr27T1",
            "KxYb64zb",
            "ZjXZPfNv",
            "P3vhtNTX",
            "nfsZDPb6",
            "vCZ97WbY",
            "Dmp2z2Fh",
            "L0n7gk9Y",
            "HfLVDKzp",
            "7s8xBHX6",
            "kf3kKM1y",
            "V4JpXmrc",
            "6khnDSbV",
            "562MR8D1",
            "TxfskH05",
            "0hsPfBMf",
            "TfwtqhKz",
            "Cvgwr2p6",
            "0N20L3hf",
            "qNGYkWWV",
            "7jmy0Cg6",
            "5QK7jKtk",
            "xRd2ynvz",
            "gHxwwqjm",
            "H4gG8905",
            "JtyGM7MV",
            "lBcGdp0R",
            "lMHDJSJZ",
            "kVzKB0rm",
            "hvCMYHfl",
            "Xh2qKnvC",
            "YxcQr6WP",
            "tB824WCK",
            "wytNSqc1",
            "23Kqqdhp",
            "y4ncWcrj",
            "F7z5KMGr",
            "X3gQBsyM",
            "YHsH59lp",
            "gmRpwbZP",
            "pPsm6wnG",
            "L5FNMz0l",
            "8DVcgzNY",
            "vyK50g6r"
          ]
        },
        {
          n: "27_park",
          k: [
            "kR5Fy4cp",
            "V6Bf4xtY",
            "znSM9S41",
            "x86GCl9v",
            "LMFqvqm0",
            "2b8Xm4Mg",
            "1p02lVGj",
            "Jn8phV7L",
            "gX9DfQSh",
            "RYcZkXmy",
            "YQtbQMZ0",
            "Xq9dTMpf",
            "J2JwJlyd",
            "JMLqRc3j",
            "fN1m073H",
            "yXtPbHdh",
            "blKPVlql",
            "Sn7Jk55X",
            "sD3Wvmtw",
            "FvXKFwCd",
            "hGYxspBR",
            "Qz8vvxvy",
            "GLmPVVPQ",
            "wQNzXm1k",
            "W1cSl5gC",
            "tH2zbnMV",
            "zsBzM3TD",
            "m24N6B6t",
            "BhRwz6Zg",
            "rvbwrQPc",
            "WRjQPsxx",
            "vShzSTTQ",
            "RvrggYBz",
            "vXsRmL8y",
            "Z8Jp6Kh1",
            "qTdLZVGy",
            "grKWZcMc",
            "jtcklJqz",
            "XR1w9bz1",
            "s1zHVr6l",
            "NJjlZGVX",
            "RzjJYp0l",
            "PtgnxtHs",
            "TN3T8yDZ",
            "RcMMNYGQ",
            "bGYGHtwB",
            "sQ8sBlhH",
            "T6QcBllF",
            "JnT85y0D",
            "FDJB241M",
            "BvmDw1Kq",
            "B3Qh36VG",
            "v90LPDTM",
            "YZ92lXrZ",
            "wFbHVD1V",
            "RdCyRZgB",
            "RPRSlSpS",
            "1f3Z4l4h",
            "F1y8GFd8",
            "dPnhB6TM",
            "tZ5zdWyv",
            "KqWtKY5Z",
            "4jMv8306",
            "xt0fdSJT",
            "fSBZ0scC",
            "YhhGvRDf",
            "js2yRkJL",
            "DJP0gBlN",
            "kPqj6BFC",
            "2W9D1Dmh",
            "tpyZYGfD",
            "4SnW2Phv",
            "d1NYl1rV",
            "kV7qCG35",
            "11tB0jyh",
            "x7csm9nm",
            "NxpssHqm",
            "Xkp65HNb",
            "C1VxfTgf",
            "0MJHBSlq",
            "CGZhymM2",
            "mxcZ2g6r",
            "264J2Wp4",
            "7CDlvFDf",
            "X58T9P8m",
            "hFWlnXJ4",
            "DzGyDyZq",
            "RnJKhYgj",
            "f9brTCYW",
            "c9j5CgZp",
            "FN9rJj8V",
            "9p8KtVTt",
            "QXWRJhgQ",
            "jkPkydc5",
            "HP539nCF",
            "6PTTwDY0",
            "cC58XFYM",
            "cGWtMTZZ",
            "nFWSv0Px",
            "v48lldPY",
            "9czXHC3m",
            "sQD28WkW",
            "W4jwR2zN",
            "yQCzyymb",
            "KlKMP4nY",
            "3fBqd2nb",
            "5n9RBvBf",
            "fjX65WMl",
            "yyzzlgDZ",
            "QcsCB583",
            "p85XLhK6"
          ]
        },
        {
          n: "28_car_inside_front",
          k: [
            "8SX7bZvz",
            "RvQMsNSj",
            "v9vMYfyq",
            "DKpTXjDb",
            "WdBlBnP2",
            "gvtvtYzj",
            "x86GCl9v",
            "slS9K1Zx",
            "kR5Fy4cp",
            "5nCzWCLV",
            "Bz25kt45",
            "wFy4S6Cj",
            "DRLp5Dbn",
            "C8T7XC5X",
            "6RbWrs03",
            "dwglN9ln",
            "GH1dPxcC",
            "2fPbNm3J",
            "9Hp1Lhxr",
            "3f5NzCrT",
            "1g4tY3DD",
            "hdGZ62TV",
            "0rlBSx4d",
            "dVywj9NQ",
            "STtzK6lY",
            "mNQs3CG8",
            "9NzZW5Fc",
            "N8HLTTWW",
            "DZyNz5Hk",
            "Z31z2yCh",
            "70CTkCDj",
            "913YrvxD",
            "nZ0v4XfR",
            "L3YFn8r4",
            "k3j2fjs3",
            "t0kgVbCY",
            "QCmD97dr",
            "HlGPghFq",
            "NL5W6mxr",
            "11qNDQg6",
            "RpXZH5Nl",
            "xVnQCXw3",
            "vgVh8yKn",
            "l26bLpTY",
            "D7gPDfsC",
            "tR5bW5LJ",
            "xctzbTHv",
            "jlnJp4Dk",
            "G8yDq2Rk",
            "FYhGkddr",
            "6G3GHjcz",
            "gCPCXLqN",
            "hznMJB68",
            "5Pfl4zrb",
            "zR6nmnR7",
            "56jLLMRT",
            "FBsvCdcD",
            "rzP8rmXX",
            "tczWvjVc",
            "rGNgfYmH",
            "97DZ2bPD",
            "n3ggPMsm",
            "0NvzDscj",
            "xH2fDjkt",
            "6m8GsYzn",
            "JCXmPd01",
            "ZJXskSbP",
            "KtsshrFg",
            "qCzkrwLc",
            "8mKKDBQD",
            "FvffFXGG",
            "yPsqF68t",
            "f3Lq00tG",
            "4XBwNWjm",
            "7jPgFsDp",
            "lRQWPj06",
            "WjT0B8XH",
            "L6D2l9Wl",
            "BRxb7fvQ",
            "8HVgDbQ0",
            "JvRyjv5n",
            "fc8TNZf2",
            "LY0DY6Kp",
            "gGh7GYWy",
            "Mz7WCBFV",
            "GhP7635r",
            "nrW7cSPr",
            "wLjNjhH7",
            "kGsB3kJp",
            "LYgkqS8P",
            "57k2pBWS",
            "S1tC62hM",
            "8FKMmYMc",
            "hWQmXf3R",
            "Xls1TCT8",
            "LHBSxH3v",
            "nmB1PZW4",
            "R8tDmG1k",
            "t9tNxpTb",
            "fBXKSH78",
            "w4hG87Ps",
            "l6t6fvfz",
            "ZL26mjG1",
            "1KH7VJK4"
          ]
        },
        {
          n: "29_car_inside_back",
          k: [
            "3wp0k9S2",
            "9YQV6gQG",
            "R2gTSRpT",
            "4KCF1R2D",
            "r28DV0w8",
            "x86GCl9v",
            "Cpkj6W9k",
            "kR5Fy4cp",
            "thsXRxQn",
            "dnp188Ck",
            "SR1Zn35C",
            "3vDWsNtJ",
            "Q2CGzQhC",
            "4fGJKvPW",
            "cDL4HK0G",
            "T61B5JMD",
            "jdPHjWct",
            "M9g9P47B",
            "GtHtH0KP",
            "MWX26NXz",
            "skNln0JB",
            "lXSN9rfF",
            "Zx8vV5nq",
            "JjV5xD48",
            "xncv6wn8",
            "2vZbLDj2",
            "gpYYYD95",
            "5vTnjpcp",
            "w82brf1j",
            "ksZR56Y9",
            "gcNPfqsv"
          ]
        },
        {
          n: "30_cliff",
          k: [
            "JQp1Bnml",
            "rdQp1HZ5",
            "f7NKlyVX",
            "sjR7K3vQ",
            "xYwRC6QY",
            "rwqjbcGq",
            "S0Mw5hCL",
            "x86GCl9v",
            "RVN98md8",
            "LwvlGfpk",
            "JrLC0sR3",
            "WkclLDVr",
            "n35zd2rd",
            "VllXgk1g",
            "m77QLv3G",
            "jb1QB2kK",
            "hrWZ3pWR",
            "rRZspb08",
            "y9NR2czf",
            "YltTwCS4",
            "sf1vs1f1",
            "XbQtTxWQ",
            "5b8h1Xn1",
            "SQSPYfny",
            "s3pY0QyR",
            "zdnCSqCq",
            "LFf15Fgv",
            "NGDkF6BH",
            "JMSDpcn4",
            "m4k4ymKT",
            "VcWVLZPj",
            "N9PKnHG3",
            "HqZqv3z1",
            "b0nPf1TG",
            "tqwFM8Yb",
            "mW98gpS9",
            "nryZln13",
            "Jzl5NTdc",
            "bySNVcpD",
            "VLBzl2MM",
            "7Yny8dNh",
            "kqQq3lsg",
            "lBBtwG2J",
            "jW8FZkHt",
            "LlGRFwHk",
            "V4KH0ygL",
            "YlZZSgcp",
            "b72v6Zj2",
            "XqH0XSZ1",
            "44g5fKxv",
            "v2Xj52PG",
            "LjbwH7gT",
            "K2kcdBTm",
            "NFDVr2f6",
            "DdQhV0Cc",
            "NxZfW5GZ",
            "9Xy5tlzY",
            "xYYlLkHM",
            "fzg1KX8F",
            "4VdyZDjx",
            "xw2t6PkT",
            "QMQl8B99",
            "zVNQ1b6d",
            "v0Ylcpqd",
            "GqfqZSYP",
            "jgFPVnkW",
            "jX0hl242",
            "FQMj8WXv",
            "gQ8b6H8N",
            "36zhcNys",
            "3mrSTtKl",
            "glRcNmMt",
            "M73FCP75",
            "CGWBh6BK",
            "WLJL8kLN",
            "0QKtZVST",
            "68mj8H4T"
          ]
        },
        {
          n: "31_staff only",
          k: [
            "znr4K9Hz",
            "rn6G3gQT",
            "PVXX398C",
            "LXxsF8ZR",
            "gPBD5VXc",
            "tm4FZR2h",
            "My2GwGZQ",
            "5QjX0YvK",
            "d2RS6Lvn",
            "v1qNdYJc",
            "SV7rcRKJ",
            "c78W3NCS",
            "0hBRHglG",
            "9tshc9Bz",
            "Gk0hcjbC",
            "kR5Fy4cp",
            "kl2X2BZ1",
            "Xs2jD81p",
            "KP9HSX7y",
            "TFs09q3z",
            "x86GCl9v",
            "wMmG1kbH",
            "1XH4y8f4",
            "DSBvPYTX",
            "1dt23mZW",
            "X6VhWxwd",
            "nD8q4KGf",
            "shRrpGbs",
            "WtHl7RVQ",
            "tdSnXqS2",
            "tNJ3Kqyh",
            "0SxPkD0M",
            "N5FjWdKm",
            "QKHxHMW4",
            "gGx2Qc5n",
            "hMHz9Zs7",
            "gLj1YS0Y",
            "khFJGQ3T",
            "KmxNV929",
            "VN4DC9j1",
            "cgQlVl3Y",
            "RvXZjVy5",
            "F7QbM8mV",
            "BtM31Mcb",
            "Z5pS5QYV",
            "j1FHPLll",
            "NrJp5qz6",
            "6dbD5t1f",
            "QTYq6RHb",
            "FZXn0fwQ",
            "J6vR26Z7",
            "6QpqW97V",
            "9yczNTnW",
            "sm9rDRZQ",
            "LV5Vfnmp",
            "5QBNTl5y",
            "F0cx6MQw",
            "K3HSTjl4",
            "8xwj7h2r",
            "VckQxf1l",
            "cK2LBX0q",
            "rPPJGYrG",
            "KdbJw3Mf",
            "ZJRYfWqZ",
            "c2Q7Rn1j",
            "K2kbHbfk",
            "cKLhHVvL",
            "1VJr3Dfk",
            "rrX7KfKy",
            "vrJ1QCT5",
            "BTxWrJPY",
            "Tj5hN6lR",
            "THtVcVWf",
            "HqrM1sx0",
            "rql709H4",
            "T6WtDWfD",
            "WdSrqrRb",
            "l0kLPLR3",
            "vZKx4tlw",
            "XBxDVjYL",
            "SznJQpK5",
            "y0Rfn5Mn",
            "lPGPGjwG",
            "YdcLk536",
            "LykJ4Q0L",
            "nvmpcZ07",
            "mGwWWl0L",
            "hwNxbVCS",
            "1DvJDNBf",
            "R2YNQ3zP",
            "7tlKHkxB",
            "RNtGk5mh",
            "t6YJdYQg",
            "B1PxMPMS",
            "V0cPlHJW",
            "4hv6Nz4F",
            "D1Dz5Xk3",
            "9Wm0Yvth",
            "N3Rb9QxY",
            "G4XDtcqz",
            "yfds6Bq5"
          ]
        },
        {
          n: "32_club",
          k: [
            "tm4FZR2h",
            "4DSNqt8f",
            "QQLRYkmk",
            "d89kX9JC",
            "BCsqRVbw",
            "S0cDqkT7",
            "kR5Fy4cp",
            "TmzRysBR",
            "0tTDC2dy",
            "QB8rMQ1P",
            "fFGmQfBQ",
            "75Br4lQl",
            "f54qbMqg",
            "9682Mh5L",
            "14JQx8HN",
            "wX1vVmGm",
            "x0xR08Kp",
            "qZZpssRk",
            "QzmFQGsY",
            "ZXHwSgvB",
            "scH0jnQY",
            "YXMQH4Jn",
            "hjgNCxns",
            "m499cbYb",
            "2NykNQk1",
            "wKsGFM2z",
            "Y0WVVtsX",
            "MHZmXZY3",
            "zgJ3XbJr",
            "hxvbNfF9",
            "MvL2ClNk",
            "vNBh8fl3",
            "3k9ZHstn",
            "xgpKj7tQ",
            "tJYFC1YS",
            "mqLrB9kD",
            "yNRwyyrH",
            "50z84TXc",
            "ybKkmyGp",
            "sTd1384p",
            "sMtTMhx1",
            "V8X4vT7g",
            "24vD2Jnl",
            "YxRyvBZs",
            "xTH8MzKb",
            "8wKGwxT4",
            "FzyZqF2f",
            "P0g1KQP8",
            "JBdDQKGV",
            "tVrZpTBN",
            "5gchCdBl",
            "bmbQykYF",
            "ThyMrFkC",
            "B97T8TTh"
          ]
        },
        {
          n: "34_first_entry",
          k: [
            "zyKqjK9y",
            "qTKB3njy",
            "v0qKC6Dn",
            "7QNMYbWT",
            "x86GCl9v",
            "WdsjDY9Y",
            "Jqx7yYSV",
            "kNv96PQ9",
            "LwvlGfpk",
            "8lz4jLdk",
            "0Xxs7L3y",
            "sLW6hWx3",
            "7wdJrfLt",
            "fZ7JM7pv"
          ]
        },
        {
          n: "35_maze",
          k: [
            "lPJljt2N",
            "DMpmsgV2",
            "0sndHH5G",
            "x86GCl9v",
            "9VC7xDm7",
            "xx4QSBDC",
            "LwvlGfpk",
            "bmbY29Bl",
            "PyCWbDpd",
            "DHlhLtnc",
            "301dqHD3",
            "vG0trsfL"
          ]
        },
        {
          n: "36_flower_puzzle",
          k: [
            "l3BjxpFw",
            "htYH3714",
            "MdWQN8Kl",
            "wHSbZs85",
            "jpLfQsjY",
            "GQ8gzLdF",
            "MYS7t4SY",
            "PBRBTJqk",
            "nKfCF8YH",
            "bWlwJj9M",
            "M0CpRRg8",
            "CLfM1DWh",
            "x86GCl9v",
            "srCzwKnm",
            "vxj9j2bC",
            "bYRV2gMD",
            "1jDvQGyz"
          ]
        },
        {
          n: "37_eye_puzzle",
          k: [
            "RSlv4QLR",
            "LwvlGfpk",
            "bR2W9DXd",
            "x86GCl9v",
            "9RrJ1Pt1",
            "pwxL6CXZ",
            "cJ0w756P",
            "hmtHWcS7",
            "PR7k5812",
            "mZLTSDYX",
            "2gBvbbNK",
            "4wVyJkGH",
            "CYc1xXQM",
            "kKBsjcDG",
            "b97q3vlY",
            "McCqRqrM",
            "4S4BgxJk",
            "GZ1cDXst",
            "p32qjRMZ"
          ]
        },
        {
          n: "38_exit",
          k: [
            "y7z5q8hV",
            "x86GCl9v",
            "crBr1HR5",
            "kR5Fy4cp",
            "vCfGt94J",
            "4Sq4v2kX",
            "hl8NYtwc",
            "n6Bk8Jwz",
            "Dcyc5nhz",
            "b1kF52BQ",
            "Twsl1Xpp",
            "PF2nBK02",
            "jyL9MQD1",
            "nwDlC3DD",
            "3hVhm8Wf",
            "wBpCk81k"
          ]
        },
        {
          n: "40_slope",
          k: [
            "3CMyv5fM",
            "x86GCl9v",
            "C82f5qLQ",
            "kR5Fy4cp",
            "3xBgXcCf",
            "HTtKQfMT",
            "yWy30tkn",
            "qsrfSjyv",
            "yhkdnThg",
            "307Kp1m3",
            "T4TKgZW2",
            "q6NpCsXR",
            "WHQ5nttW",
            "H6nWMtWB",
            "Xr8SYtJ4",
            "scqGSfcs",
            "ZBC1b79V",
            "hfKmB95S",
            "8kBXCzt6",
            "z47dpD8m",
            "JZSlMtNB",
            "K6DCvzWP",
            "hG71pyxh",
            "2SHlGRcx",
            "CDtjngcy",
            "j7sXryK8"
          ]
        },
        {
          n: "41_shop",
          k: [
            "hpCv7MK8",
            "mcQLtp4Y",
            "kJ8dGf8G",
            "yhJqhwfr",
            "57RpbYNV",
            "BswkZLKs",
            "SzFsP5rs",
            "cyLchTJR",
            "lNLkyLM3",
            "NqFhBR2Y",
            "8nqKGHVz",
            "003ptXBW",
            "05b5dKYq",
            "znqFwBmB",
            "dCMf6h2g",
            "l4DlPywC",
            "24Zw6DMn",
            "w0tPFJFF",
            "HnMgLj7t",
            "Lb7Lb1SF"
          ]
        },
        {
          n: "42_home",
          k: [
            "hpCv7MK8",
            "lx48ghVx",
            "ylSz0RnD",
            "kJ8dGf8G",
            "FztsPCkR",
            "q7bl9SSq",
            "xLhq007b",
            "bwbGfDDv",
            "v4xlTsFB",
            "FBlyRKfl",
            "KzmHgdxp",
            "YR5wyc9B",
            "81J64rrw",
            "1jL2Z6Gx",
            "gYKQdPhB",
            "y4JM7Yn3",
            "wXjkm5SH",
            "gTNZhPNL",
            "YVx92sPH",
            "SZhd9Q04",
            "CdT78Xfq",
            "brlcYQw7",
            "VSGl4XZm",
            "t1mR4QYN",
            "wghLRDPf",
            "kt7f9tjl",
            "zjq5GGsV",
            "SrL0glTQ",
            "zYp4zjWw",
            "Hlc9VKwF",
            "pMg8qYj2",
            "5jXDgqND",
            "nhQZfX1p",
            "yVQTg8qp",
            "vMfRLCfX",
            "FVMNwLDZ",
            "Z7DS9LlY",
            "lWrr6RTs",
            "gLpM7Z3C",
            "QskcYcXb",
            "QzRB7cfC",
            "JP0C5ysF",
            "L9C5k1N9",
            "JCwzpJdN",
            "FqDkzBqM",
            "LTC6D1yz",
            "BNfmcrpv",
            "bh4gnC4G",
            "zWZYfTlS",
            "0lkZtCXH",
            "7crpDrmY",
            "nGhWlVG3",
            "W31qCrzv",
            "GJQTXzXl",
            "b9H67x6G",
            "L7gPm11Q",
            "0kRwn3gD",
            "yvdzWW9B",
            "dNKTS3y8",
            "P23VgGJP",
            "KYLczbfH",
            "QSwD2BQX",
            "Vfg2ZsjD",
            "ghDkN9RT",
            "DsQJV5m7",
            "jkFqcC47",
            "cFYwNWmm",
            "537HGXbT",
            "S6RYKwKP",
            "1dDMKQ5R",
            "Bkh2LZtN",
            "dBPwmbcD",
            "1Gv8QJgg",
            "gpdV1PN8",
            "hwd2FqdZ",
            "PTp6blfC",
            "cbmSqzFn",
            "0ncvNWqT",
            "ncfRq63z",
            "mGySzTPD",
            "VpCTMsBz",
            "TWJ140Hr"
          ]
        },
        {
          n: "43_street",
          k: [
            "x86GCl9v",
            "418HYV0h",
            "kR5Fy4cp",
            "k4lgbpg4",
            "0y95ZHSs",
            "LX9Dvh2x",
            "z1p9tNyQ",
            "Gr8jvsjh",
            "93tSLCz2",
            "cMHnLs6W",
            "c85Wgrpk",
            "8DTPVFcd",
            "mw0rQCBb",
            "Crk8n05T",
            "ZwCF4tZr",
            "k3mcfNpz",
            "XN6Nh89W",
            "H2Fsg1DD",
            "vbDPkVKp",
            "rjw5ryCd",
            "XJ2GQdYz",
            "v3KlPnNL",
            "8WKq75d3",
            "rLJyq2Z0",
            "y7GlcVqG",
            "bN2GsGNZ",
            "t8p7c5xD",
            "NfvYwQp5",
            "gdxSs0NV",
            "LZLBGq98",
            "VbTJv50X",
            "9r3PJXtc",
            "8JBXLdSb",
            "vb4kcKc5",
            "DHKcdK3y",
            "Y68mrzkk",
            "PZFbwPYl"
          ]
        },
        {
          n: "44_backyard",
          k: [
            "x86GCl9v",
            "BtF6vsvs",
            "KhlbcD0Q",
            "kR5Fy4cp",
            "B2xbv2Cz",
            "RcK3MyR2",
            "gY7yJQHG",
            "7SXG325g",
            "LWHtCMjm",
            "Hv60xPJJ",
            "V5nfNXr2",
            "MW1zCYGB",
            "Rcz9Kksk",
            "GBgGswGH",
            "2sSh9PJ5",
            "c49dJJBS",
            "cbcyktCV",
            "6fLjxF7x",
            "0FlQSppZ",
            "R3b200kr",
            "lQjGy9gh",
            "S3YRsFbs",
            "6dFt4mgM",
            "KdtjNY9X",
            "KZYdHVr0",
            "rSKsRzm4",
            "B1yWj1Kq",
            "ZRwyCSgy",
            "NRG4XCNz",
            "N4sNcwlx",
            "dtyJ8DJ5",
            "3HDM87tC",
            "PLcFLbRc",
            "g8W7mStX",
            "LL0jc9Jl",
            "k46pdqdS",
            "4905Jq9w",
            "5Rb8lqx8",
            "bDJGns11",
            "BPPmlzgH",
            "hL7GyXd5",
            "3M30HRtL",
            "Mc95fJKb",
            "Wsv40F1r",
            "YTmSgLfS",
            "8TBXWStW",
            "X6qbyQDL",
            "3jLyGstJ",
            "dYDddgsZ",
            "kq5yXCfR",
            "CT6W4zLQ",
            "my8mfMJv",
            "481d1cyb",
            "v5lMzkt7",
            "cj5sH3fd",
            "d1F8wjyt",
            "Fm82JDMX",
            "cd5D7h9D",
            "kH4B15Jt",
            "3ZRR4289",
            "q141JNQ5",
            "vp3nqWvV",
            "5V5xkn0f",
            "99dcJRTV",
            "H71z1KZw",
            "w4rJrKyp",
            "56tWPw5g",
            "19NYzPhm",
            "31wJ4FbQ",
            "1cDGdhLn",
            "8DqxbCDB",
            "KG94NfMz",
            "3PQdq9F3"
          ]
        },
        { n: "45_toilet", k: ["NZVJJH40", "mYpBTFwp", "BgxTCG7F", "PvTMm018"] },
        {
          n: "46_living",
          k: [
            "DqDS7lGN",
            "P1JCMkLX",
            "r63qywrh",
            "4P5lDmX4",
            "x86GCl9v",
            "dSdqHtvl",
            "kR5Fy4cp",
            "qyHNy9cX",
            "W08rkr24",
            "XV14Fvs6",
            "lK36RZk7",
            "1dghTKXt",
            "y962rlPS",
            "n8pGv4Nv",
            "8QBlWt4y",
            "y9jXxwwZ",
            "yK00q2xW",
            "7vzlB7jt",
            "zlNb7NFr",
            "q8F4Y7gJ",
            "x6Kv0YVM",
            "rwDvHRXM",
            "HhyJHK0l",
            "YV9sTVgw",
            "0c3JpNRZ",
            "nqwbnMpW",
            "NZwL1d1b",
            "lvPJJ9VK",
            "FsTVWXh3",
            "WXX66yT5",
            "MFjMgvm9",
            "ny2XnKpN",
            "XJHjdLLH",
            "ycNrVFJ7",
            "pJZ9S6tZ",
            "WfZLtDkF",
            "zfBFxZ54",
            "Y26lSYW8",
            "Fs1nXlFy",
            "X6YLzLcs",
            "2fhDWRpM",
            "YW9Sg164",
            "3ZkjjKyD",
            "wyPNyp9x",
            "bbSBY5bj",
            "KkmkMb5P",
            "y4c5Bw0p",
            "Wsdsmzyv",
            "3Fs5Hg7p",
            "QmwtzvDB",
            "YYltCLFQ",
            "SMkc7Kjg",
            "xWLH5GhZ",
            "Xkyrskg1",
            "sKsRxXQV",
            "kjYLK258",
            "wYC6ZpKK",
            "ZbrVWq33",
            "37pzMFMX",
            "VS5CHVkn",
            "8NpxkDL6",
            "VSTG2ZZW",
            "GPDCKzkm",
            "vCNz1Dsj",
            "mPNwCg30",
            "4NtgMyRW",
            "PwCLxzVP",
            "NHkKDCNb",
            "5SBMjb1z",
            "PDYBgDQD",
            "Lg3nM6Gq",
            "7dYp2q2b",
            "7RPK6Qr5",
            "QF3XJNG7",
            "Cc4PLXlQ",
            "wSntdmc0",
            "dK2qMHCF",
            "jQ3LHMCf",
            "Bw4dsnc4",
            "VqnpWHYM",
            "FGLLS8Cm",
            "WxBl9MXW",
            "TWGFZ2nM",
            "S56hx4v9",
            "0lm18TnZ",
            "WlfzXrhw",
            "hRMfLrqB",
            "Psw6zlw2",
            "8vb1dfkJ",
            "C7ZDTgqd",
            "jGcBFXW2",
            "DdfMTpVc",
            "C4zwfxzj",
            "H2N8dP4G",
            "QMtCD7Rj",
            "ktkZHj82",
            "tKTm41bp",
            "wXjMw00T",
            "sdGpNLB6",
            "qr26Zy6n",
            "psvtr4Xz",
            "MPCPL05d",
            "LWLWtCDD",
            "sl2HYvPz",
            "Q4nHq9l1",
            "8zZ6kKYM",
            "kNJXHqxS",
            "rgQWyG7b",
            "hjyjDJ9j",
            "5vVChF3G",
            "12BcQmv9",
            "DbhT1nv8",
            "K73hLT5l",
            "G8lw5nYQ",
            "DYtYpnwC",
            "HfjNy8dw",
            "sstKmrcs",
            "VDbQCtJN",
            "L0vL1yhx",
            "jd8cB556",
            "PS2D44jq",
            "NkPq6zSr",
            "zhpXZfrk",
            "0g1VxX9D",
            "jpcD3t3v",
            "r6wBfyTh",
            "YrNnNltR",
            "SY4jxglX",
            "TWBk6R9R",
            "mt8LdJD4",
            "xbLsS1v9",
            "tY6F4d9M",
            "QmR1M2xP",
            "KnVJ8jCn",
            "lQYdq0Y8",
            "9JT6VWHq",
            "8sc8f9JM",
            "xZQCCLHS",
            "dFvgDP16",
            "7Kw4F1Qw",
            "7hwwpVqZ",
            "rZ15rdYX",
            "Jdjb1CMM",
            "hsXrWL3v",
            "59SNLfpg",
            "67blkCLy",
            "xPDkbmd5",
            "D7HCmgBt",
            "BjykWDx1",
            "NpQ12Dlf",
            "Szr4MDkz",
            "dLgsYvcY",
            "NcJbkyc0",
            "3WHd72BG",
            "NgVBL9rP",
            "794W6zn2",
            "WgCvHlh5",
            "k2ZrpdlW",
            "sCHMcLmN",
            "WBfNC2yj",
            "5KjBwSXL",
            "qVq1qyhf",
            "6Z7kKsTf",
            "r6YccXd7",
            "4jJbNnRX",
            "KXnWt2GY",
            "XtGqcLN3",
            "sbxwGy66",
            "KFclp4Ln",
            "DL6BHy4w",
            "cVrsTwB8",
            "bL7pV5d4",
            "0nrZJ8zj",
            "rDWwDTDD",
            "rTyKtlHP",
            "rt2784K2",
            "mtxwh4bY",
            "sdShQLBx",
            "NtCLD4xz",
            "FRg5Vf5W",
            "CZRD1Xlv",
            "BtJMbPxw",
            "d7b4qnXS",
            "XcwVkJ15",
            "S78FX5bH",
            "Ss52qqdJ",
            "GsgsYQ2c",
            "1hF1wp75",
            "WLDJPG59",
            "0rNYGwsS",
            "VTKllBB5",
            "SlSW7h5H",
            "t3CB15jw",
            "bFGq7X3D",
            "jcZ33qlP",
            "cp3J8M7k",
            "qbKx4WNP",
            "FxQkzlkn",
            "NkqwCr1X",
            "r1HXy9T3",
            "9S1ngSMZ",
            "Xl35bWnt",
            "Bpw12bP7",
            "0V4PPKSw",
            "FdYb6MgQ",
            "gt4N0GMT",
            "rYKwrFwc",
            "S3P8QsXb",
            "q2fr7tYp",
            "Qfwt2v21",
            "CVbykKKL",
            "NQ5jjS7g",
            "dJb3LBrp",
            "m0dXgzZs",
            "wJmzw84D",
            "K06cG8Sg",
            "GXjVFqHV",
            "7jDhCMgc",
            "rH41qvXR",
            "XrDtmtP6",
            "Hk7nBmb8",
            "k1vxyZcX",
            "sKNB545L",
            "75djDwmN",
            "gyScwjHS",
            "mmrDHRKQ",
            "NHqy6qPZ",
            "028cbbCD",
            "YKDkCtB5",
            "25nxX3Tk",
            "KzX4dFGq",
            "YLZ7ZMMx",
            "ztgxf6jq",
            "3tnHH8pS",
            "TH681xNP",
            "p9k2FRH7",
            "QXTTBPkR",
            "JQDQlm7q",
            "7H6qm39G",
            "sShCpmKW",
            "4bQf362f",
            "fYvzKs9F",
            "8PDKnM6N",
            "VVXH3FGd",
            "rRzsLDWN",
            "Tvkb1QxV",
            "RJmBWgbD",
            "KHvGqkgz",
            "2md3Rh75",
            "XYX80C5G",
            "dYnMJLdH",
            "xPTx3x1W"
          ]
        },
        {
          n: "47_bedroom",
          k: [
            "kR5Fy4cp",
            "HlK5qWwt",
            "x86GCl9v",
            "WJggW2Yd",
            "L0P0D0J6",
            "KhRGNQJt",
            "5ThlwmjN",
            "5Y5LVj8W",
            "GMT3fYwC",
            "9f9ppgcv",
            "scP1zzHh",
            "T99dfT44",
            "9zKWDZCJ",
            "zWSh8lWW",
            "54nWnLp4",
            "SZ5HBfWq",
            "ZTl74lZY",
            "b0BFQ8z5",
            "qCbhMwdZ",
            "rMSZhMKQ",
            "3gtXJbqs",
            "gf3qb5sF",
            "Xxll3xYR",
            "JPFYbTkm",
            "DpFly7bW",
            "whdyrb7y",
            "Rz91s4kL",
            "bXNG39nq",
            "j6FZNHG4",
            "R4yXXM2P",
            "S56hx4v9",
            "vQSkTqkp",
            "BvDx22R3",
            "vRLdXVqz",
            "WLYtJ0VK",
            "2bCNVwth",
            "DpjZznt6",
            "h2lgWPT4",
            "Rkbk3pVX",
            "F9mVGf3G",
            "9xNp4Ynh",
            "wT8wtBlq",
            "X7HzH5RM",
            "KZg2smGV",
            "Ryc3qRYb",
            "S78FX5bH",
            "0RWwBKsr",
            "1lt776M5",
            "5MYQ952c",
            "r96jjGw5",
            "2nnq5L1Z",
            "GYz7RRbL",
            "76WkGYTm",
            "0s3nPNzk",
            "txh82rLn",
            "8ctTn0xF",
            "fMcftGz2",
            "M8KPPfn0",
            "Z00PdBNP",
            "234WdWCV",
            "cWcLVfmR",
            "vqFWPrKr",
            "0WtkLtyf",
            "csN4bmFB",
            "JYpvYcdS",
            "2J4Mh4S3",
            "bRx52vHM",
            "g9g9R5xH",
            "LqQNfJfr",
            "Zv7G2hz7",
            "lLWLx6jb",
            "GQtP0zlx",
            "hsWYScyl",
            "Z5zTh1mS",
            "cYgFph9W",
            "VXlf9yqG",
            "ByhSKfZR",
            "gS8p1ljC",
            "SMPgVlXv",
            "QZj5kl8k",
            "fjyCbx8G",
            "KkWBz3JT",
            "RcfKRVFL",
            "y4tCXQ2h",
            "1QZYtmty",
            "w8VNrBPQ",
            "cdrWqGcK",
            "WzFYZgVb",
            "4s4w9WNn",
            "MH3N84ft",
            "D3Kq7wDj",
            "2lMddvZz",
            "dWc9Pbq1",
            "24LW6YXg",
            "SZCLJPg2",
            "t8c1qnPq",
            "Rtjx5fH4",
            "yJyY0Br9",
            "pgZ9lFRB",
            "jCMmgZT1",
            "VqlN4tbT",
            "1js0g9tn",
            "bD1JGTs7",
            "B4bW5pdM",
            "PQW5mpC8",
            "mmDGxyLw",
            "jLNl0VH3",
            "vgtRzPlr",
            "GDp4y5L1",
            "7BKQHv9L",
            "6yvtxVX4",
            "QyfGBT8J",
            "c6dmGPxB",
            "0sf6QfFK",
            "SN31CHK9",
            "bcbQ0V56",
            "ZqpFYD0G",
            "Hx7N01CV",
            "M85TDqyh",
            "m3NnCxPq",
            "cfqsyw4g",
            "tpLgdWgv",
            "H02Qdst7",
            "8JtpK4Z8",
            "dnVlJ77m",
            "GchHgmh0",
            "5RXw024p",
            "z42GNwHc",
            "mWVskbfP",
            "ZGVnqWSF",
            "qp653lfY",
            "86RJ223S",
            "YTHTYLG6",
            "rQc6Z7XF",
            "kh7Yw4Pf",
            "qr8RXzk6",
            "vkNv2JMr",
            "sT4zm5dN",
            "glncs3jz",
            "jtLTdRJ6",
            "jsJ1Hfhh",
            "dzWRPBVP",
            "rSq49Y8X",
            "L8dp9LWQ",
            "CK2m9dwt",
            "nH9cCTjk",
            "BzDzVT3H",
            "cZgdJXnX",
            "xKmL2Yk0",
            "qhLnbVqs",
            "8ctt087V",
            "mwjkS4Ck",
            "tHQLXVZs",
            "XzldZS4l",
            "7p7n8TN1",
            "DCh8c8vM",
            "lDmxTV6h",
            "rMJFgtZJ",
            "NMX1wFM7",
            "ML26l3rd",
            "pXv7Lqlg",
            "hdvnMbNn",
            "bSjZlc20",
            "R7WQmBty",
            "znh4H83M",
            "RQTDXZQL",
            "C1p5nMHm",
            "KsDRyWkb",
            "JFRx8dTF",
            "R8GYylHr",
            "rGl8MJRn",
            "BRkdbvLj",
            "xvn4v2fb",
            "PBT2Lr2L",
            "9Fh4QTsz",
            "nw9YR3Qg",
            "njwvyYHN",
            "l1v24jdS",
            "WRrwHJnY",
            "VDtntWmq",
            "16vq365y",
            "LwJ1Rl8V",
            "0LsgtmFm",
            "fgsLFXw0",
            "HBBmrc5V",
            "3mxgfHp1",
            "LRGHxFVj",
            "kW2d8HlL",
            "qbL1QgCY",
            "MGXZKllT",
            "tZcglXs3",
            "p12sWP03",
            "xP223Jq7",
            "h1MSN1DB",
            "xVXZwWh4",
            "QzqlXC5p",
            "Kl9h7g0Y",
            "YgtJblNX",
            "vjVQc5c0",
            "c4Q5l2Vb",
            "0yfnFhlN",
            "dns0nzN9",
            "FqRPzhDD",
            "tx5GKL2S",
            "Lwv7NTgz",
            "VjnHr25h",
            "qmwHMMjB",
            "vHtBW0bs",
            "YLN0WrFb",
            "cTns1yH0",
            "d9jnmPsX",
            "N6w3L8ML",
            "tPFgF8z6",
            "tHJCtPms",
            "ls5KvF7y",
            "cn7lmHsK",
            "PZPJMhP1",
            "dMHCyqvK",
            "LvDlZtwQ",
            "jzZNyLFs",
            "kzhJPfwf",
            "kygcpJnm",
            "FC5QR1KH",
            "Cj4VR4dR",
            "pfh4FgDj",
            "SMkG925C",
            "4tx5XXQV",
            "6x3SQKMl",
            "2H8Z9kqm",
            "twgN0pv1",
            "N8pY0LrB",
            "rf0v7qjY",
            "6y0LDxth",
            "86s1mFyG",
            "6RDk8rGJ",
            "SkzNfMSz",
            "GPmL8NHj",
            "Vqf4GjcH",
            "3r6X46Yj",
            "z733dQPZ",
            "SzhPrypz",
            "z2NJ4T3V",
            "qZdxnFnL",
            "Y1XYmv6p",
            "57zvvDCr",
            "34BXRgVc",
            "KppLPCp9",
            "fk41JxLR",
            "HMNJ8km7",
            "DSplhJWr",
            "5cJ8wlmH",
            "JH06hGMM",
            "XWBC29Zl",
            "YsnNC03L",
            "jfWg91WY",
            "cgPhxymX",
            "l8GkBCBG",
            "8n0RhDfM",
            "fqLG6t4k",
            "HgG7sCkd",
            "YBQqLJ6k",
            "GS5t0bc2",
            "KBpBSbDy",
            "9df6jfnp",
            "3FWVnBXd"
          ]
        },
        {
          n: "48_kitchen",
          k: [
            "5cFnqzV3",
            "bh1HbM6C",
            "XJ1zMN7x",
            "x86GCl9v",
            "BcJVwDSz",
            "kR5Fy4cp",
            "BQd81rr9",
            "ZvW6w0Hq",
            "z6FwCPVy",
            "2WxYb7CF",
            "Ct1drsM5",
            "NgH82ytT",
            "hMb43hSV",
            "kDQTPHd8",
            "wzvq9Kh0",
            "Yw4g80p7",
            "CxJMp427",
            "KQgGzJ6N",
            "JqYBWLLP",
            "1mYpyd55",
            "BFdnzGlj",
            "bL39qrfN",
            "QvGz3Ddq",
            "DvpSVzSZ",
            "bKFPhdbx",
            "lH9L3HZW",
            "24BZGxQJ",
            "Pjb0k8DC",
            "xMg5NwNc",
            "FxGPVNNg",
            "5gFZL5B0",
            "XdYzykGH",
            "GJQLWgLH",
            "lzt148Ct",
            "21mCqXh6",
            "d4QhL5LK",
            "98ppppHk",
            "GfCDhBTr",
            "Bx9sGCvG",
            "WQ1wnn9x",
            "ZSDysz5x",
            "YtcdKJjR",
            "L2s9VWvj",
            "RwFFpGxN",
            "Vg4wbwwm",
            "PbsWPR3F",
            "0SkyR8sS",
            "Pcl5k7N7",
            "CJb35bBV",
            "dX0PTpg0",
            "xDDHBJRY",
            "SG7PtnlY",
            "tnbYy3BV",
            "c6mLzZQv",
            "45p2r29J",
            "drKPymk9",
            "9bxFRWv5",
            "BJtWX21q",
            "9vyNwRfJ",
            "FYfVHTtd",
            "hwPwWDyB",
            "mK9m9B1M",
            "b7VqxQWL",
            "pHjQ51X9",
            "mlz6s253",
            "g4hHK498",
            "S78FX5bH",
            "j2LMNGkl",
            "JmSshR97",
            "t2z095Tq",
            "Vgv4v1dj",
            "1zX0Kk5B",
            "HDCgRkc9",
            "qhxt23cz",
            "S56hx4v9",
            "K12XYvcf",
            "VgdTZRNX",
            "4tv80tQ6",
            "3yDvD9q7",
            "nLrt4GW3",
            "1rsQNz2R",
            "H0LHwPgw",
            "M4whJfVZ",
            "Hb91vr0Z",
            "0sfVssV0",
            "7wc88GGx",
            "vjK2M78W",
            "tZflGzDh",
            "4RQDd1FN",
            "qmG2QB73",
            "Jl40BhPm",
            "bs3861wx",
            "g4LBrtSq",
            "xyNsCKP7",
            "Jl13CDpn",
            "R8q1wqwS",
            "NFhfFb7h",
            "fgjNJCtG",
            "LhQ7tc1y",
            "G9jrnrzJ",
            "ZfG2mfwQ",
            "GwhxxLtC",
            "FKD1905N",
            "HJCqNsWT",
            "ZMQVjrFr",
            "3N5FbcBS",
            "KsmwDRFc",
            "0jBxqHHh",
            "ZdLsqZXY",
            "nNvZWjRv",
            "9vcT1zdH",
            "pHC6ggYV",
            "pWCG3WvL",
            "XZrrgD6H",
            "FLmwn3h3",
            "NGX7vqhQ",
            "N4gnk06C",
            "3jn5fTJX",
            "17hHkChd",
            "tKrNgYF8",
            "bF20bhBh",
            "rbWc04X1",
            "TfCzJkMT",
            "X3kVX6qC",
            "yQft0rFg",
            "J65HV16K",
            "NhbTBWjC",
            "wjGYnFzr",
            "kc6gFP71",
            "GR7wNsvV",
            "1nm7mkkL",
            "sM3S9zK4",
            "xm20yXf9",
            "vJtjgwg4",
            "HyV4jd1Y",
            "VFPktHsJ",
            "6Yd2jvgp",
            "qPzVQ8Mg",
            "Vd4hXfBb",
            "SP1tB0SZ",
            "6XFlMBmF",
            "lv0TmD4C",
            "Cr0qLhK4",
            "p3RGwvcZ",
            "6Z59yXYS",
            "bxTbFwDd",
            "kYg9zbP0",
            "71bNwPyj",
            "zDYYP0Bq",
            "GyDN55XS",
            "rJknFzr3",
            "9J6bXg6v",
            "PrmKBBFz",
            "n6rzknDQ",
            "pQDnvm7N",
            "9jMjMdPz",
            "RvP0sVXS",
            "2FWzJ0Js",
            "frW1krxq",
            "8ngk0njJ",
            "Czgx8Kv4",
            "mBJhxHQ4",
            "2S8drCdt",
            "1YRY6rxc",
            "3H55d46y",
            "yKNgSj7K",
            "dFQB6MHH",
            "HRMn8CfC",
            "LVQtCcKy",
            "HGKss4H5",
            "2GGTR6wK",
            "NV2qDC0r",
            "d1DGLkLS",
            "3gZdZKkP",
            "QvSjld83",
            "GJTVJJVY",
            "SxZK3ZFV",
            "jw603vKk",
            "PKFLWxnT",
            "ktsHTnjx",
            "KSVSsJ63",
            "nbvMsfQ1",
            "nwkl6QG3",
            "M7Scn8nk",
            "7SkBGV68",
            "XJG0BXjC",
            "m0yFDhRZ",
            "M0zmYmGs",
            "hbzvPzHW",
            "2Dv9Yc7m",
            "lgVkW9RM",
            "7SfpPgyx",
            "XczN9pZ0",
            "sXDwlf0B",
            "qRtrZJhL",
            "g3dDffc9",
            "c951qxJT",
            "Czhg4ghk",
            "BSg1hwG8",
            "CdZ3dKv5",
            "x3WvGcmf",
            "hLMkPg90",
            "TBTk3R2h",
            "X2WWpGdv",
            "D3lSPRlh",
            "q1VZzYWJ",
            "XStbbn7V",
            "WWvMXwFn",
            "PfVF9fMp",
            "h5QbB18P",
            "SH1xdnQN",
            "zM5dRM0W",
            "scKxnDr9",
            "4yzQrwk1",
            "qLGTfxsM",
            "V4J7f4Cx",
            "kBrF6mQL",
            "7wcdhQ1d",
            "s6s8qTPc",
            "z3JNR2qP",
            "nNbWJl52",
            "MwMzCmZ7",
            "YQNYZFc9",
            "f5WVxgrG",
            "tJTcT0Hc",
            "ShdKG105",
            "5pxPnXJK",
            "bdsPdmDc",
            "tjSxy5WN",
            "kPDQ114H",
            "5cSSns1L",
            "CtLzP6ZB",
            "TkVv6GlW",
            "qVxQKKqB",
            "PSLKnzvQ",
            "0Y3mZrj5",
            "T3M7tTGS",
            "QGfl9Yfz",
            "m2dnTL99",
            "wSYV7tps",
            "jdG5PRM5",
            "c17BDnn9",
            "J5V3MpVd",
            "fNz5SkD0",
            "gVj1JHZc",
            "0KxKsQth",
            "xBjkWxTh",
            "3xZtNHkt",
            "hs4XqN3R",
            "Wk3ZZB8T",
            "8g7L7M3m",
            "My4dZWVG",
            "qhlmQ5fQ",
            "R0YWH49v",
            "tnMnSnlD",
            "YY4Zr8ZX",
            "LPcDK8Mj",
            "3Q4MVTkB",
            "3Qkk1wRp",
            "wkWfLgPz",
            "Rg9TdKHS",
            "sVbZHvSN",
            "XX2HZcgL",
            "X9lkL3Zd",
            "szfN0vFY",
            "wzP6vm6b",
            "v7zHSpXx",
            "C6d7HZGt",
            "TNGyzH4K",
            "jCqPXXJK",
            "51WJZnM6",
            "vkQmxJrx",
            "Tmrqw2RX",
            "VrVsQLt4",
            "FWjqYNLP",
            "xlHS0MXn",
            "hpNXs1rC",
            "4ds3gQd7",
            "nTqTW4v9",
            "nYpXMncQ",
            "kfSkPplJ",
            "qncypW58",
            "1FwtWXrw",
            "r7B5RBvN",
            "5LPr00MN",
            "lLLQrMJ9",
            "TV5tqGhj",
            "Xxb7yLCH",
            "WD4ppf68",
            "l29NcYw9",
            "dqkHTWjH",
            "r7gN1hSl",
            "SWfF9RSY",
            "pbVSkpgY",
            "8X1lx2Xg",
            "3zm8xThc",
            "dj77xBDs",
            "DfxrLPxy",
            "GHNlb9CC",
            "0p04cjYT",
            "sHzLr1f7",
            "xnZk3c7n",
            "DbtCY7s4",
            "5FyL07J4",
            "K1TbkBvJ",
            "lhzD0pSD",
            "Zs0pcSqN",
            "7MxFRGGX",
            "pXJpPszV",
            "wvYlrfHv",
            "sj2gQSl7",
            "vgctG75W",
            "dmP6zxsf",
            "hFXQC2FG",
            "3Gmfn60X",
            "mvd8vSkp",
            "96TwRFtr",
            "CJYXfyPk",
            "L7q96VJl",
            "Wnvcyzdk",
            "R9zsq0VJ",
            "2JRGYglD",
            "8npyFCh6",
            "SrJp1cSj",
            "4DlpW3HS",
            "9vb2KRcq",
            "MdhR0xc4",
            "l4RT1Pfg",
            "sTjxH1sP",
            "vCSkSMCX",
            "b84dD5nh",
            "vKCCZcDd",
            "WY2x5b9G",
            "ZdFFcDMM",
            "6VsZN8fX",
            "5w0W5jfY",
            "Y2TbVwYz",
            "j14JcdqS",
            "JShx6hQT",
            "9Wbwjb1V",
            "L9rD0nRQ",
            "q8f06nC2",
            "f5WYNhZg",
            "nsDYdV5G",
            "9QV25M9G",
            "ZZBymkG8",
            "bQ9ftc4k",
            "Vtqw9CnK",
            "NCFdt9tr",
            "4tWbMdT9",
            "zrbcN5Gr",
            "5dzTWn7R",
            "bXR2WJVD",
            "M6K6jjp4",
            "vQy4zN31",
            "s8NrR36p",
            "0L0LlfJS",
            "Q1RnhwTR",
            "3bV07NjV",
            "7lw1tjHW",
            "PyJpm7vS",
            "NWPHTcKF",
            "KnN645VK",
            "ZyQt5fvv",
            "NYY9ML8z",
            "ZN0fNV5T",
            "CmNdCH1M",
            "qRbHNYc1",
            "JwsrS93L",
            "yXrmytB2"
          ]
        },
        {
          n: "49_basement",
          k: [
            "PgF8GDX7",
            "X35qvN5d",
            "J0ClWGzR",
            "HgZxzYFS",
            "7yZykzct",
            "9Wh9rKcV",
            "YbR01Dfl",
            "q8rh9frv",
            "C8VfTVfK",
            "8MMdbqfB",
            "mPckSXCX",
            "87bgXf7g",
            "l7KGG9RZ",
            "4ZMlhc8m",
            "k1Wg0dtd",
            "kR5Fy4cp",
            "TGwV5bhJ",
            "x86GCl9v",
            "fbVrQPR9",
            "npgXrjcw",
            "gpdSvgsb",
            "k6mfBqvQ",
            "Ykb5SkSz",
            "ssFzy0nm",
            "6JfLGmwP",
            "gJmGkklp",
            "LDtXD8Sw",
            "r54cqFpr",
            "Gs6z4Vxj",
            "Z6WYNWLq",
            "ZTkzphK3",
            "X3tsYX9w",
            "RlFhRWfP",
            "cBvDhg9Z",
            "1TSMmFLQ",
            "wcMw9KwP",
            "Wk0cr1bs",
            "QrRjmBpN",
            "b28TwxZ7",
            "MP9dRgH6",
            "y9flTkNC",
            "DmGS7VK7",
            "0y63jR5s",
            "PMb8yQKh",
            "J4VGR7Vq",
            "6Jh84xV1",
            "rr6vvQcL",
            "ljHQ8mwZ",
            "GHhjHvvL",
            "HRfXP8wC",
            "7lrXxjLJ",
            "y3C9wf90",
            "FMHgfPwp",
            "VxCtrp2j",
            "r4ZqB58Y",
            "zBd7ZNdh",
            "dwRRVdFl",
            "DkT80Ndl",
            "wKpFMnSf",
            "q36MqH6r",
            "ngxPkJDX",
            "jCP1gsDk",
            "WTQVWLvp",
            "Mrd2vKKT",
            "T2c9MRsb",
            "11rPNpNn",
            "sfRJ19jv",
            "DTbzl0z6",
            "BLNmx1d2",
            "DHKwLjHj",
            "np83m0Mv",
            "6MwwhML6",
            "z1MGxFwV",
            "7gNjYdhV",
            "jj0Hp6Zr",
            "x4kdD6r9",
            "dMzTnK2t",
            "vXZtnnXb",
            "lv0BSYwL",
            "jc6Dw4fg",
            "4M4L07xQ",
            "pjxPwVbb",
            "SwBvR9QL",
            "0ryBRNkM",
            "1HvfdHtX",
            "FnhDvgNy",
            "G76TttN1",
            "Nyr7cw5y",
            "VJ3pKrnQ",
            "GPVYdZmB",
            "H51P9sY0",
            "bsBhJDMw",
            "RbX3wVZj",
            "jzxScSkJ",
            "1m86NJJy",
            "0Mg5XN9B",
            "hCJgL8Vm",
            "G9QxJffZ",
            "TD0pXfnC",
            "bK3qMCg9",
            "JKRWgXVD",
            "SjLR9qr4",
            "vnZm93TP",
            "Ph9dzCxp",
            "nz886s46",
            "PQZndbnF",
            "VzbSHRm3",
            "jyGWyDV7",
            "qF6BCxnt",
            "3qzgqfvP",
            "MfbnVtJk",
            "Ynlbry7h",
            "DcWW39ZY",
            "mKzv9FVr",
            "fnMtvJHS",
            "8MbZrZpv",
            "pZC0Bcg3",
            "QFb6mP46",
            "wG80grRJ",
            "Q8n3DLXS",
            "ZfTBsJMG",
            "S56hx4v9",
            "LC92l2RV",
            "CNcRNgz3",
            "R6RQWgfL",
            "zFXp0zsn",
            "3SKpjzzR",
            "cDbfy3cX",
            "NJkD3h4F",
            "nDCtwmNM",
            "kDRpkm48",
            "qH6MX1q1",
            "nvlctZYM",
            "rPBx1rs9",
            "3zSwckBh",
            "svtK7PMp",
            "5Q1vGpS3",
            "QV1FLBk0",
            "wvdG52C6",
            "75GbHYVw",
            "WgffY6Jl",
            "FMb0yfkR",
            "MkLPV6lh",
            "rWByDRX8",
            "yBxK2Wcd",
            "dbrjtMdC",
            "pQ89vSYn",
            "tq6fKDk6",
            "wFbk018B",
            "BS0mbbkc",
            "bjXHp18J",
            "1r44LwHz",
            "bfCL7jY7",
            "f2599gft",
            "gn6DXl3Q",
            "l5Gk3KVl",
            "PmRN87GC",
            "mgh4bpC2",
            "DZt8QDqJ",
            "cDzgN51P",
            "zmJRDc3z",
            "ZbZLh6Gw",
            "NYCRkdfV",
            "jNp8Fzyz",
            "PjgbBgdd",
            "m825WgKD",
            "R3ggGxrQ",
            "JRYRgFLX",
            "bdjgz0kL",
            "d0XTp29k",
            "mNJLLJb2",
            "2K0RR7Sx",
            "RCqLd68j",
            "8VqT7bX0",
            "sTr5GS4f",
            "NqQkyknX",
            "hrFdScLG",
            "r1yqbVFf",
            "QGV87TW5",
            "lmKv8gJP",
            "J7ZlfN43",
            "QVwHHTGP",
            "0FkhdMzl",
            "0GGdJX42",
            "FWWgTfVq",
            "HHcQJlyt",
            "f3dQvWqv",
            "0FFtBZ3p",
            "8W3LWTZm",
            "LWjc3Lgs",
            "Sw1dKlCC",
            "yx4zw30F",
            "ZNsGc2JD",
            "09w86Q5Y",
            "w3TMK3XY",
            "7ZfB82Mv",
            "4DpvYl47",
            "3wLJ1Y9r",
            "qfJMpNsp",
            "cF9wsmws",
            "BPtrjDJG",
            "kK6BMc45",
            "pc6tY0qx",
            "69nw1CSN",
            "z8yRKGTC",
            "kWb5KmMd",
            "JBj8l8P8",
            "lDNRbgl5",
            "1n1WxBvZ",
            "vq1TBKTn",
            "FKfjrCHs",
            "x2NrhM3G",
            "7Qrzw4x9",
            "NgYdSkN8",
            "TbDcYjKG",
            "X9jqTWh6",
            "8zDpKBrZ",
            "c7zS814j",
            "rN2H7yGd",
            "HJKbxZ3S",
            "7MSSh4yn",
            "lqDf5pJM",
            "GCBRYw78",
            "YkHYz59J",
            "MB0pyPyl",
            "yP5GwmDr",
            "X0BsQVMH",
            "SyBSLmBC",
            "XLJYXD5J",
            "L41GN7Mf",
            "4ym1kNvR",
            "pd3vwCnQ",
            "0PCzXJTd",
            "THglKFbP",
            "YK9W80Sk",
            "X64wTKGL",
            "129TzQNP",
            "K9Rx9F8Y",
            "HD7syS8K",
            "8ry9nKxJ",
            "cJhXSLl2",
            "sHpLq4c0",
            "Wm6g5FJL",
            "7tTb9DnH",
            "0kX8RKMB",
            "FNMq0R4h",
            "zVLk7vnJ",
            "frhZrhHv",
            "JnrBKmZL",
            "kxQG8ccV",
            "xX5YV74B",
            "fry61srR",
            "GlXGsc33",
            "svQ8dqJ8",
            "Nyq7n6CV",
            "pSbzgYBR",
            "9CQT0xMT",
            "zyPFqFmn",
            "S78FX5bH",
            "RKt8Ll9h",
            "CBWW4sYQ",
            "QypWnsb0",
            "2F3zGhvM",
            "xB7zDwmM",
            "20YCP1XQ",
            "hqvG10gX",
            "djKcHhJF",
            "svbKKJ4y",
            "Yb4z38Bw",
            "9xgNmllZ",
            "0KTzyWHC",
            "bSD6WXcG",
            "RwFDzYTm",
            "s0FsD5mK",
            "k3VYpCDp",
            "5KwQV9sY",
            "QPTkqZfv",
            "rcGwqlSW",
            "m4GvbYjd",
            "F1gx85nL",
            "kFtH1fRK",
            "wq9g0MtL",
            "wYkPNJ3v",
            "gbyHvYdX",
            "d0DnLZNW",
            "1qfLHWnj",
            "rCCsTbgY",
            "LqdG94m8",
            "QYljxrQ5",
            "hvkQfcG5",
            "ZPDCBXl6",
            "Gv94ddJ2",
            "GMsTvKHr",
            "FhdqCmnS",
            "lCJZ1wmd",
            "w93xsz2V",
            "bBB2wJZQ",
            "FRZkbdll",
            "zmfr4dYn",
            "BRYpSH25",
            "j6xS389T",
            "C9cm6rmt",
            "Tw358lBW",
            "pF3DXbPr",
            "1LmrlvV0",
            "QMcsTYCH",
            "pKgl7bgg",
            "vx4GWZjs",
            "DxkrCXw2",
            "TW8GlNq0",
            "LfsJrlSr",
            "gRzvN0NZ",
            "YwTPpfSD",
            "V2grBrYc",
            "hcj98Ylc",
            "s9bxK4wm",
            "3783hpZc",
            "ymJ4FjF1",
            "HLgJK7yn",
            "SlRhKqqR",
            "WSfwGlyl",
            "KvXcSWbd",
            "3x9sDY96",
            "56QRqQvL",
            "19b2HHbZ",
            "bX0p9Cq4",
            "FbrRmR1Y",
            "6gV5ZJzZ",
            "SvDVkJ7m",
            "sXCVHxrN",
            "sYkkRGxh",
            "Hv0rbgMC",
            "XWc26mF7",
            "hzr9TVwp",
            "bZPySqly",
            "np7xFl2H",
            "Q2yP3140",
            "1Sr57L68",
            "YWJL6pJm",
            "JgxXbw66",
            "KKCc6Y8J",
            "xPQCH3S1",
            "2nb2llzD",
            "p1wRF59Z",
            "VRvGd7hr",
            "CL1DLfcJ",
            "HMrcSlQn",
            "1SrwwGTN",
            "l6dTg6vv",
            "c8Sfh01Z",
            "VHyxzDqy",
            "tZD9Gwqx",
            "qhGnT52j",
            "MSFyj3sh",
            "dxCdQKYK",
            "YJ1QH2m5",
            "S0cRpPTj",
            "tR5HPrcg",
            "ZYZx0f9d",
            "LxW4DR8B",
            "XFTSPL1N",
            "8pbJCD0B",
            "W5TCzywW",
            "GKmWj8lS",
            "sFNlY8r5",
            "YqJxj7R0",
            "ZbnzlkLf",
            "GYXJQVwQ",
            "ZSrPwcj5",
            "tN0dqlnb",
            "pPdzPJJk",
            "jkMdxFBF",
            "Wf6r0y3K",
            "XwWhgvJD",
            "NVxZfxsl",
            "lcQZwLZG",
            "JLB42gLh",
            "2rpkvYLZ",
            "7mwf7mBn",
            "8KqXKYFZ",
            "QF8lSh1x",
            "2X0FX5VQ",
            "djkQfpc2",
            "PTNXxjSh",
            "kRz4mWkv",
            "XXmCLcx2",
            "MFgCnVS0",
            "7FxyJcck",
            "NBspTkQ2",
            "G4TKVnGb",
            "sJnP49ZW",
            "s0HqH4jq",
            "DdyDrGrX",
            "8qS9q9kk",
            "Q8TnPtRy",
            "tt8s0dB6",
            "bWT7MgRx",
            "TRLXbBFc",
            "1n3GxGZN",
            "rvPr5y89",
            "LnJMhhJc",
            "6SGpR0ns",
            "kPGqYgsJ",
            "chkDBVtG",
            "HLNwrDYg",
            "m6zfGXfV",
            "R7bHL6Bd",
            "lymd9j4Y",
            "sKjxpdkZ",
            "jRbwJX9g",
            "Jr7ydpKP",
            "ZMfNFkcp",
            "hyVJ0hPn",
            "HDRqlGrR",
            "nNBvJSQV",
            "V5sPNN8s",
            "Z2bbJFzf",
            "DQ6SBsd0",
            "K0xwh784",
            "JjYJfqpf",
            "fJwcmSDS",
            "QpDbjtyp",
            "J1G4hMPF",
            "TcqT87fs",
            "z0j5rFmB",
            "K1Qr8k1B",
            "kYdqgyTt",
            "xb2Rhjjd",
            "c4H6Kh19",
            "xgLspZyB",
            "46njHcfV",
            "F5D6h6Vc",
            "Kmt9QDdN",
            "36YkbxDr",
            "7mk6c3gd",
            "PR5vKrZr",
            "kzVNDZxJ",
            "YQ5WxxQW",
            "JqVWWQ4G",
            "rLwnvKC1",
            "JTkDLnzC",
            "7NGjbBQD",
            "Ss5CcHQV",
            "FjJ1qDNp",
            "Rym8ms3X",
            "VrLWRpY5",
            "dF4hh56z",
            "xtFXQy2P",
            "NpmLtPh9",
            "NQL1t6fD",
            "BkFD1GYr",
            "0bkN9xh5",
            "wsYP2kCn",
            "jNgwFYPK",
            "sTd1mFqx",
            "n6Zrk23Z",
            "gjvXP2T4",
            "jqpCttgG",
            "wzXmPZ35",
            "QTD6HF7m",
            "B9CCx92c",
            "zsF0clwD",
            "K3HBLn6C",
            "xLp4j2VX",
            "W0NNQzCk",
            "5BRqfPcD",
            "v44BDHpJ",
            "8hdslg5r",
            "9lNygxHS",
            "NFq5rrnK",
            "wTx5fhfS",
            "WDH7XqhZ",
            "Zcnxjs1w",
            "lhZRMmBr",
            "TM8yxkKF",
            "N2xG0tL6",
            "lLf7FRZS",
            "XQnxHtfP",
            "dz7kcHcS",
            "fMT98qKl",
            "7k7DYyDf",
            "GYvYQrNt",
            "55fPzqH2",
            "rmjN67rY",
            "wct5nP8R",
            "VgDPq4yl",
            "lLsP7Mb2",
            "zqm4crR9",
            "t8h1x5G3",
            "LMwzvySd",
            "462pfS9R",
            "7gwMRnjr",
            "NTSyT3JM",
            "LwvlGfpk",
            "BlRCP9dW",
            "bkXh8xBm",
            "FdH6fmBG",
            "8hd31p6v",
            "SLlDZ1s8",
            "9YZ6W0vG",
            "F2W4r1Fc",
            "NSs57w5c",
            "cMJGV6pY",
            "48V2Qk2M",
            "tZWNGpRG",
            "dP5YzQkj",
            "4G8vrFpp",
            "1dhYRc5H",
            "ZFflsSRV",
            "BdQ0t90k",
            "KP0DgWJM",
            "qCXdJ3wt",
            "gHXg4MmB",
            "b14gtcw2",
            "NCmhN2x0",
            "3x0vyLbV",
            "HTPClrwN",
            "HmMJ9X4C",
            "FZf9mwSH",
            "gNYXWf2v",
            "9jcdrx9S",
            "qMjj90TS",
            "d14MpPYj",
            "G4MLkjff",
            "35v4f9lk",
            "dZykGtZg",
            "dHWMvlFY",
            "nvrcxQMV",
            "n0JqpRDc",
            "tXwhMlY8",
            "zzcBFVJ3",
            "0p7qfWBz",
            "7XQl3VzB",
            "9tLYrWgp",
            "5NT01zrY",
            "70SZ1p3T",
            "vCnvYTcn",
            "6MqpcLzl",
            "bzwlpRH3",
            "vS0ZH2BB",
            "Tdn8s0hk",
            "3DTdm5BN",
            "8LKf4lt1",
            "gj6SVKd4",
            "frPd1s4v",
            "9DCndJNh",
            "QqRV3l3n",
            "Tj5BP8DJ",
            "C6bZGxFD",
            "Bgn9X6Bj",
            "Rt5SZQvP",
            "04SN9nG8",
            "HlQB408K",
            "hfz1sY4b",
            "hVnlBcwq",
            "SyqNBtg3",
            "GXDQCdrj",
            "SGzRGcB5",
            "RXTH1QGz",
            "0NrKjgMF",
            "H05yy0vn",
            "mwnPhLhP",
            "pzCH6prp",
            "RDlrK7bg",
            "4dx9mSvZ",
            "Gz8YRysW",
            "pgdwb3jF",
            "BrGnhhvk",
            "5N3BS2fR",
            "G5xR5zX6",
            "XsWzcj6g",
            "pHZ3KkTg",
            "lGlf85RZ",
            "F5Zz9hQ8",
            "Cvkc0NCZ",
            "ZSPn0cRY",
            "mB3824H3",
            "P6SYKcVT",
            "PbfDwjg4",
            "njpTnkZv",
            "sYxG7hKb",
            "L2fbx2s3",
            "8cvtd6sf",
            "9ybHNQqc",
            "0Vv64GjN",
            "qHhddq5f",
            "1WjZxfPk",
            "VjGKJ2Sd",
            "Y8sLtRg8",
            "CVLTWdJM",
            "bYJvsMhz",
            "5tMv4gkR",
            "KMKs2Gvg",
            "h74SZcM8",
            "MJ0JFdMs",
            "3Dgc2Lvh",
            "t3FJdYRj",
            "kbRn8WJK",
            "jVDxmjrX",
            "LVr7KZTS",
            "P8YZ5LPf",
            "25ZTl461",
            "CjSzLhX6",
            "FcWgBSD1",
            "dSB2SQBY",
            "hrVjwbkC",
            "N3j3MQ4G",
            "tQkGB3PM",
            "4ljCQr3c",
            "jXCphdZ5",
            "GcRtkjJp",
            "rbkyWgsR",
            "2fxjF5cw",
            "55dwVyJ5",
            "mtm0Qr63",
            "jgZnLHLg",
            "96lfm88l",
            "ZtLdZRhQ",
            "7wWf3cfS",
            "hpDV0vnr",
            "zpvmfFvH",
            "6r3nTsG1",
            "JnYfFMFv",
            "tn8BmdCZ",
            "7FK93J3X",
            "49YchLCc",
            "BkGqGzDR",
            "2lmV2GMk",
            "mybMGFcR",
            "JZCx28J8",
            "ZTQDk2Bb",
            "XGwW7GSD",
            "FPV2cHTT",
            "Xr8wGCGy",
            "QpMMLDvD",
            "ysF1sdsl",
            "P7FRY2rf",
            "1XdfMwXS",
            "dnhfYTJd",
            "nym6W52Z",
            "kwCjRF5s",
            "5gP2SM15",
            "tnk0Cc5c",
            "ZvnjpZKs",
            "RBRMNjgK",
            "sCPqRRTF",
            "6SJrqsq1",
            "MRWJCwty",
            "jVGRmm95",
            "CHfX818B",
            "3byYBW0s",
            "fWKzWS4T",
            "vgzs4Kxx",
            "qMzLX0WS",
            "c8P6rLV7",
            "56J22M01",
            "bYKBQHGh",
            "QJZtlmt0",
            "sPCddDBG",
            "DVyfzgLS",
            "nZWwPWpH",
            "Hw0jnNMK",
            "2mYxwJvw",
            "J8TR6Sfm",
            "h17rzjqQ",
            "9WstBZkv",
            "Sb4SF1qK",
            "3m70xB8Y",
            "R03bwZ8D",
            "p2mFy3j6",
            "CdxqHkQs",
            "k5RhpzP0",
            "nGF6tgJY",
            "24tjKCyf",
            "Mn1LlDrh",
            "yMkPhdfj",
            "1bVpDRlr",
            "NjR4R89F",
            "t3pTsCHZ",
            "P6MHQd99",
            "6sNN3MV7",
            "hDnT74sK",
            "nz2sQWvB",
            "krlY5CR4",
            "SSKhhHJj",
            "M6Np0Q1q",
            "4W9rFVS3",
            "hS6dGZBH",
            "b2jPDV0k",
            "1Kb7gHQ8",
            "6gjKMjzd",
            "6B2fH96P",
            "tRjmHkRk",
            "4Jp23m3m",
            "W9NGN8DS",
            "GCC3YwhQ",
            "BY80wmPd",
            "QGZPG4SZ",
            "n4FLyZqw"
          ]
        },
        {
          n: "50_park",
          k: [
            "kJ8dGf8G",
            "L8JKLq7V",
            "hpCv7MK8",
            "mcr1SXVP",
            "8DpXb7t4",
            "8Bwkqxc4",
            "BNQY12xm",
            "DDwVHQvv",
            "zm9zcJcX",
            "dPnFyLzk",
            "fKdrsrP9",
            "sqxkpn5m",
            "xwFSSWYq",
            "PSGvT4X0",
            "8kKFkSTr",
            "nbrbQx9h",
            "0FNrJCMm",
            "vl46YrXZ",
            "83zYrgQ7",
            "4D1Zptnw",
            "pcvJgGFy",
            "yN4p7FGV",
            "YhRfmqKf",
            "JxNjr67y",
            "4jjG2NhC",
            "JnFXmGjb",
            "dhLYBXR9",
            "S4KXQ5Zs",
            "pFScVb2N",
            "rbX49G0w",
            "Hzb2Rvr8",
            "MLN9V0kz",
            "kFFKPsKH",
            "6CFwTvdS",
            "7LjgFV4S",
            "kBgn9bXB",
            "f5hpB395",
            "fpNYZ91N",
            "1VBHzgts",
            "HlSYqv30",
            "1kvWwQwy",
            "BwYp0YLp",
            "pmWPs1l9",
            "XjhKrz2P",
            "w5wDBB9J",
            "pRjV3dg5",
            "yh6wjHYr",
            "ctb6fsNS",
            "YBH1HdsW",
            "rpfLV49J",
            "l1f9RStY",
            "rfTnXj6D",
            "Bx9L4gRZ",
            "bdl3mfG5",
            "91cR8FFK",
            "h6FhRt4Y",
            "4tDhNDzQ",
            "W5s8HqKJ",
            "qsmhjbcK",
            "Gv9cvFlY",
            "5McSvsh0",
            "yy9DT5fS",
            "j836VkGG",
            "s6chs44S",
            "sbF7wwJW",
            "vQHqnHwC",
            "ZgP1HpRx",
            "6sCM9tBy",
            "PhqBc0fs",
            "18XhwHbV",
            "QgLkfXc1",
            "Vyyn1JN3",
            "HWj67wcP",
            "y4F0t43b",
            "X8Pd3l30",
            "YsPXQsFC",
            "Wt83H92W",
            "nf0tjwhv",
            "T2bgZ7WB",
            "GwVRG6ly",
            "wMdVZxN5",
            "q2bDV3LF",
            "fdyCv3NR",
            "XNd3S7sB",
            "Tmbzvw7k",
            "JMWXBGH1",
            "Ctw8BYkt",
            "cLWdfdQ0",
            "SGzBVlty",
            "St3NSj3L",
            "rRtH4JR7",
            "HSb0TKQj",
            "j3TFrxln",
            "8nDHWhcd",
            "3TvD80Pb",
            "fMbBmwmV"
          ]
        },
        {
          n: "51_duo_past",
          k: [
            "dsjxtbS6",
            "kJ8dGf8G",
            "w2GLpcDv",
            "hpCv7MK8",
            "fCxG4C8M",
            "83WKVxN6",
            "dmLGdRGn",
            "ln2xq45y",
            "8m4dxkyR",
            "k2FR8ZhX",
            "Bq8SL1QW",
            "Y85Z7xdX",
            "L17VWp0L",
            "7vBZ4kBK",
            "K2JxBH3K",
            "rlnpRL8Z",
            "8tNNVhVK",
            "WZRBp6XN",
            "NdV3QHKy",
            "qgZqDNGz",
            "JjBsCFmF",
            "wWQY4gkh",
            "zZp3smX2",
            "0yNNqlkk",
            "XWNB7xtF",
            "WL2pydqk",
            "MyGsntmj",
            "4RVQ2wR5",
            "hLNR0YmX",
            "cqkBc07W",
            "7q4vwphR",
            "mhVvV212",
            "mt688Cyy",
            "3rX2cHrw",
            "ws7GCbFY",
            "mwnv7bw4",
            "lSc7r5Tn",
            "DFLL0t6g",
            "hYNhVVPg",
            "8nMS6sTP",
            "SR9KMfBW",
            "N6N6bhxc",
            "62s64Q26",
            "PGqg6XXd",
            "SNm2Xm0P",
            "hJcL8r5C",
            "HD2K4jp7",
            "M2RyDRJW",
            "Vtl6Y96t",
            "7QrBT457",
            "vgzTLb3s",
            "fBVCRH6F",
            "8G8jglZP",
            "zR6jmvwl",
            "w97rJM3h",
            "NWzhSzq0",
            "gk2gWVqq",
            "byLwmv8m",
            "ZcyDHYSN",
            "Xpdmsc6H",
            "5lM1P0b0",
            "TchB44qm",
            "Lv5rFF2z",
            "pJTM2mzq",
            "63sb0t39",
            "gkZ3r3tX",
            "x86GCl9v",
            "wNcpNC5P",
            "c02zNqVF",
            "TYVgsYb8",
            "PVYtxX92",
            "ZVfSBB2m",
            "60WtNl08",
            "BJ9W2hTx"
          ]
        },
        {
          n: "52_entry",
          k: [
            "tm4FZR2h",
            "JHxq6Gpc",
            "6BxltNNR",
            "grg48qkg",
            "vg6rZSXv",
            "my2fVDcK",
            "ZP0x2bKF",
            "GwWtF402",
            "6fTtxh4t",
            "wMfhx8zL",
            "vHd3Hthy",
            "kR5Fy4cp",
            "CF5V4CDM",
            "JP5WVrsx",
            "DZRD0XRQ",
            "w2P1dDXz",
            "FLpm1StD",
            "cSgft30y",
            "dhLlNTfv",
            "VGzCkX3S",
            "RqKsnsrp",
            "lHttB9Ln",
            "dzDyMSfT",
            "jGLQJTkZ",
            "RJJTs6mx",
            "nzD15q71",
            "kZXsTM9j",
            "hpCv7MK8",
            "CxrF2KDm",
            "gXnhZgYB",
            "frsy8fcL",
            "WbR9HJlF",
            "8gSHKJGX",
            "Lkkz69kD",
            "jR5pNtgF",
            "86D0XMCs",
            "x2dS82hc",
            "LfhWZRPK"
          ]
        },
        {
          n: "53_islands",
          k: [
            "kR5Fy4cp",
            "rX7NN1zg",
            "JYdSyMdN",
            "V97ZshW3",
            "ntkSxmLw",
            "pkpcmD2y",
            "mnJ9Sq7z",
            "zrPmyMkp",
            "wFZbRggJ",
            "pWqlyTSZ",
            "WX8N9m77",
            "j47pkQ9H",
            "n5SkvZv8",
            "QHG8bx7T",
            "6LRDlVLv",
            "lRsYrZRc",
            "h6L5KlMb",
            "BdnLypDJ",
            "kxyNP8lP",
            "JfzLZrY9",
            "GZ1lBf3R",
            "75w96Hpl",
            "gyBYZ5Nv",
            "vM1Ky9YD",
            "1qx1BFbp",
            "93JjCXzP",
            "jWbgGWQZ",
            "CMvVSWj0",
            "tsP1XGzT",
            "NQFjDSFF",
            "qnwjJ7vH",
            "CtXh6B78",
            "ZYLzbY61",
            "nqtXbrcW",
            "95R2MHGV",
            "NmyPYjSs",
            "MYHL7QjN",
            "cL8fc1td",
            "fpxpxjgC",
            "shqNYkMb",
            "2Pm1F8fd",
            "MGRfh3PS",
            "Tvbj9pgJ",
            "Rf5BHxyw",
            "dHBGFPH2",
            "TvNFbQxg",
            "b0RQjp4c",
            "QM7k6VL3",
            "8GM76tWF",
            "Kmq9WQbK",
            "hpCv7MK8",
            "Lr4vHP5h",
            "GTgjKr6L",
            "vn7fjGjy",
            "Fvz0D5t1",
            "59DvztY0",
            "DTQxmtxB",
            "x86GCl9v",
            "CrczhN8H",
            "bgjPsD1c",
            "xx8sdPsz",
            "tb1ytVG6",
            "G65kyDHc",
            "R6g8lyXb",
            "Px8zZjK9",
            "6jtTcS5B",
            "wW3V2w0F",
            "bb3D1JsP",
            "sn1wdrPb",
            "wQvZdBdr",
            "TdzRSjS8",
            "cRsFjsvn",
            "khhvY65T",
            "lHx6blJS",
            "C2LM3VgY",
            "rXtfyqNp",
            "sTYP2yVG",
            "hNSlp0yK",
            "18cMw4bZ",
            "1drq04Nr",
            "CsnTG4T9",
            "690ntjsz",
            "NzkzVNk8",
            "tqbjJmzW",
            "45g74Zdk",
            "sCJmJWFv",
            "hYdlmr7x",
            "x3ZghjNd",
            "bsV2H6N7",
            "L76KWnGQ",
            "hj8yfTfh",
            "dvVYs6gJ",
            "jSnyVXk4",
            "btrNwNHT",
            "YXJ8NBwC",
            "shDTz5bP",
            "fVPvwPCN",
            "dmymrYJc",
            "TWHpZvnV",
            "9MJMtqM5",
            "rQ06vygV",
            "FLdX6nxg",
            "fGZMkBM9",
            "FctFq4NR",
            "9dfRsmxr",
            "6YnXb1m1",
            "zJyRsJbf",
            "g9HhRT25",
            "3qTnsWv0",
            "1fDqFcCb",
            "zQr74SFP",
            "wbG1skf0",
            "xcsm3NkS",
            "Ytk58Cz7",
            "GFTGMLyd",
            "MY5SWKN5",
            "M0pm4YbX",
            "kpSBm3Y8",
            "Wp8RfC4G",
            "nyC4HdFG",
            "9Q24R7WH",
            "9mgS7Vv1",
            "zG0km5F5",
            "wnxv3kml",
            "ss7YDMl4",
            "7t5LwZ42",
            "qPwxSC2v",
            "JCjjqWTT",
            "yJ9PB4Zw",
            "SgyjspHy",
            "KLNqnjKb",
            "nShP8tXx",
            "KVP96dqF",
            "rQXNjD6d",
            "c9C9H0LC",
            "w5Wwtjkc",
            "yR5MfKY1",
            "MQszx4DT",
            "nC6JcRPW",
            "BwSpKq2M",
            "x6P7CVDQ",
            "5JZ7BMbK",
            "P33GVWzN",
            "Wswc2Vkk",
            "mVzBjmBY",
            "6DtMYfJT",
            "K1c24zT3",
            "Q1ZLRHNf",
            "kGjW0J9P",
            "7nJXJWx9",
            "Jccwh670",
            "30CcJpQP",
            "k78NHC0b",
            "C1lNmtHg",
            "YmglslKJ",
            "MZTMPvxp",
            "X4Fw4FFr",
            "5f0x9CqC",
            "xDYqsgPc",
            "GGbhwg5s",
            "sSL5nwq6",
            "n7Hm5sSb",
            "FyPvQXLb",
            "4W3vrz77",
            "vXG3fMP2",
            "Qf8pDJK7",
            "6TJgCSbs",
            "6klHrwy0",
            "gsW8TtKH",
            "gDS1BwFf",
            "cnLzj3cY",
            "n8Q2dCwl",
            "byR7GkdF",
            "1GGzDlR0",
            "6snjnJJZ",
            "Kv7HWxWp",
            "GgzrgB28",
            "khR0mx75",
            "Dv5kr5r9",
            "7sC7j1B1",
            "tn6VXV3n",
            "xq732SHR",
            "5HYGjXDJ",
            "8W9xSp00",
            "Yq41f2LD",
            "Nv74phfz",
            "X4n5xZVT",
            "qYCCSz6Q",
            "R9l8FNHD",
            "30cX7Yd8",
            "5Tjqf2Ph",
            "yryQcVvw",
            "W6rv0MBF",
            "3k3w4N1F",
            "Syf8C9xH",
            "1RcPXgJk",
            "KPk2kDRq",
            "VNKFwD7T",
            "WMQJZrg4",
            "2CfpTQjR",
            "7XjHWrMr",
            "njl5hj65",
            "VyVqSxLq",
            "fqX1Zyn1",
            "tm4FZR2h",
            "SSrSlPrW"
          ]
        },
        {
          n: "54_bridge",
          k: [
            "kR5Fy4cp",
            "HHZrWYnM",
            "NFktLxrh",
            "rJwDlDRc",
            "x86GCl9v",
            "rDbDzqQk",
            "kYHK0lPD",
            "NmQPw9Yf",
            "qWGMZbdp",
            "0XtdVttJ",
            "zlS5249D",
            "yGFrsL4w",
            "1lSVlj0Q",
            "HgqdcH9f",
            "wDhCnbWd",
            "gdsZ2QbK",
            "JC0LcMNW",
            "znF1tHGh",
            "s2DVrg67",
            "7Fhj26qY",
            "CgPPtDZ2",
            "PYHNRns6",
            "8ggHmTkN",
            "tJW9K9fD",
            "vDq2nmc9",
            "W96Mmjgb",
            "mYlFynS9",
            "P56z1Wyb",
            "RV3swM2Y",
            "XHpxnptC",
            "lDqrZQTc",
            "1jnScyWN",
            "dCsND4xG",
            "3QWvD10D",
            "YQ0syC2k",
            "GpK0dMlh",
            "FySffKwz",
            "SmfG3r6K",
            "qTfNlXgv",
            "bdMnfCjV",
            "Jzqm1KsL",
            "myDDBw3R",
            "fbVTTggH",
            "h3xnMvtB",
            "VssS1LSp",
            "00tbYs3d",
            "2TqrRGpt",
            "HNwjm9gk",
            "3dB1PqdK",
            "F1NRML9S",
            "X94cZmnQ",
            "slwFv7q4",
            "3dVPDt2f",
            "nvb55P0L",
            "vD7dJXqK",
            "8NP5QVFF",
            "zF7080z8",
            "skNtmDpm",
            "W5xYBWRl",
            "BkwzCnMl",
            "LHxQJ86D",
            "ydHhXDYY",
            "nhj8CGLF",
            "6djv4XN3",
            "BY4gXkNy",
            "xlLJtZxj",
            "GPQ4R7JF",
            "D5zpMmC6",
            "NFydBRXW",
            "cBQV1WRB",
            "nnxCgygs",
            "hcCy8THW",
            "cbRrH76q",
            "g6ThjsWD",
            "CJDMMQZ5",
            "WXnVhFGj",
            "pLrfGKSm",
            "b5Z4R4VM",
            "Wcj3P7Jw",
            "Yv5F251z",
            "Dz9cjydS",
            "3Xc8MKsd",
            "np64KHPd",
            "jslvwqpb",
            "38zw99Dr",
            "rgfcRmzq",
            "YsXYs4vt",
            "Js9j5Fbm",
            "9JtPqFTK",
            "dmbqcF6T",
            "Px3gJP2l",
            "7R0F2YP2",
            "gb7TTCZb",
            "Ftqk09v3",
            "1pyP2S8f",
            "x6jPn6Xc",
            "sBPHlZZd",
            "J3k842b7",
            "j5bQVGT8",
            "XscFwXQz",
            "ZSWJ5W9Z",
            "H9Gg1dCP",
            "2PqkkV3R",
            "xDvgCWXj",
            "x7Tq3jBL",
            "9GrXfRDj",
            "Fc5lJDWZ",
            "cpVL5lZG",
            "TvFrVxxx",
            "MKxRhpsT",
            "8gG3LprX",
            "60n3T86Q",
            "hqqTYTsX",
            "gkGcS7xr",
            "8BPGLXk5",
            "nPTQqtzN",
            "GpB63LB6",
            "sdYkpDSk",
            "rwPg5hql",
            "3xd0Cqb4",
            "vf3GQ28F",
            "8SFT0m3c",
            "ZqhCqQKg",
            "sDj5P0Sk",
            "RcXWCpnJ",
            "T8x2ryFD",
            "dhWsh456",
            "QJmRCdBf",
            "w5VD6T7k",
            "8V5BjDH7",
            "HKnfnQqs",
            "B6gXP2rB",
            "nGP7LDNW",
            "6JGm9zkk",
            "ZNVNw3b3",
            "lBn0nYlY",
            "7ZZbs0H5",
            "F1TMbZQw",
            "BXl2vCF0",
            "mmy3nndc",
            "dX87xlbH",
            "K99WMVpQ",
            "kDYNKsZH",
            "yJlJKcyW",
            "fjq29DPt",
            "gm2Xkmd3",
            "kmZNg1wV",
            "87T6PfDW",
            "Bsgmhjsy",
            "Mx37YWC7",
            "tqsnKZH8",
            "vhlLxyFq",
            "k9x6bGWW",
            "y4cCTLH9",
            "x9fkgWZN",
            "NtTRj8GK",
            "ZRqT3ldq",
            "9MxWXmxs",
            "2XnnmlQS",
            "RWbFrhSJ",
            "GzpB3Myj",
            "6lcw8wdr",
            "l7tYHB3F",
            "W8bfNfv0",
            "rkhzbfym",
            "d66pgk9k",
            "v1h2TBnV",
            "zX3WdDnp",
            "84MVRp9P",
            "17Vm9jtd",
            "Czwdvk46",
            "Cgymm60G",
            "k7T5B6py",
            "6k05D2Rv",
            "tXX3HXcD",
            "C5QPnZsW",
            "C4xjk6zR",
            "xNWKQVrG",
            "GL6KlTzn",
            "zcvV0vLw"
          ]
        },
        {
          n: "55_drawing_a",
          k: [
            "7VCQkmkJ",
            "7qyVzZSB",
            "QfzyZ1j9",
            "zqdlkrQ6",
            "QDzF78c8",
            "wb4nTDxN",
            "fXgQCM9G",
            "sstbqQyz",
            "mZjD4g2c",
            "TBPNN6Xw",
            "rxXr7h1n",
            "PmHSFqhS"
          ]
        },
        {
          n: "56_drawing_b",
          k: [
            "2mkln8P6",
            "s9Qjr3Zr",
            "Ppt650Wd",
            "NzB2xHzB",
            "trc9ZX18",
            "j92Ks8Hw",
            "zqkXHWRk",
            "jGxpf0Yj",
            "k3lXjCPJ",
            "DdWzJDyn",
            "L0c9kKXk",
            "03RsTNPm",
            "lZ1rVQlB",
            "VZCrpPrB",
            "406WxYwf",
            "hcdW8F8N",
            "PWbfw42G",
            "4XZTJfQ3",
            "XslTkTcK",
            "p3YzR97V",
            "N3HkWmvj",
            "x83GMMFb",
            "Q17G51XT",
            "zRynncCz",
            "YbnGT08y",
            "Nx9mXc0T",
            "wpM4m9Kd",
            "85LTrKp2",
            "4hBfyy5G",
            "gW9yh0QQ",
            "DCt1fTjb",
            "B8hzndk4",
            "HtxNFzDf",
            "TPhwg1pN",
            "78CrnWMp",
            "TrBJ35Rh",
            "vNbp1MtQ",
            "0l76w7dl",
            "dthMZJBR",
            "6r8wpCbb",
            "pHdJHPKs",
            "dwNC8x6q",
            "sLXY8rhG",
            "h5qJ4Cpz",
            "fyNxJQQx",
            "bcXMnJ2v",
            "wXBS1kdC",
            "7D1nCjVX",
            "rtTJMDBc",
            "zVt5gXhg",
            "kFR0rbkp",
            "BSJh5zcB",
            "BC7yVn8y",
            "lmfPT8YL",
            "Tj4LKh6N",
            "J2zH1S5N",
            "5BPrKpNv",
            "kyfMy4H9",
            "XGMdxyvf",
            "zTMKQY20",
            "Dt9vFqvf",
            "8DbRH1bz"
          ]
        },
        {
          n: "57_drawing_obsession",
          k: [
            "2scd14P4",
            "nJMxx6sS",
            "GH02Yb53",
            "jxN783hg",
            "Qn0RLWMY",
            "3zMQqKQ8",
            "z2cTS4Vm",
            "nZTvX5j4",
            "SXxhQlj1",
            "kS1Jn9cv",
            "l76BXK0Y",
            "3d7xxN4L",
            "tslz5lBd",
            "kydjKtFg",
            "V46kvKmC",
            "kR5Fy4cp",
            "yxHf4Nwj",
            "x86GCl9v",
            "XLwF6RZB",
            "Z89VBmCS",
            "8lmTns6C",
            "qznkJScF",
            "dcg15tQk",
            "LLTvfGQf",
            "f0yVXDGP",
            "TGLSFDRT",
            "WMwxVQrJ",
            "ZvT05H9c",
            "RLSnpxss",
            "Vd4KzRwG",
            "L2HLfg19",
            "VxHtTz7J",
            "WctkGhqj",
            "4gD8DZ3V"
          ]
        },
        {
          n: "59_defa_tutorial",
          k: [
            "sbqSfzhP",
            "4kWRyr09",
            "htJb7VZR",
            "ykyx4wdf",
            "mSBklgXz",
            "glv5s5R0",
            "qcXGl5hR",
            "Dxx3NnBN",
            "jbDQT9tV",
            "1b84kngs",
            "X8kLqft9",
            "JvhKGvy2"
          ]
        },
        {
          n: "60_islands",
          k: [
            "smVbfvbQ",
            "r5ZPsVpH",
            "M9FNtQ95",
            "47XYmhCW",
            "yjCwnV3j",
            "nflVzdDG",
            "c8kB65SY",
            "5rJSkV56",
            "yk4XXrVY",
            "xLPnVMGs",
            "pq6sbgwx",
            "DgHvd36g",
            "MZM8pJsV",
            "4GyTqhY2",
            "890yWPvg",
            "h15JK6Sw",
            "BMvdHkPs",
            "60zgprwx",
            "nrPChXfp",
            "0pL6ptBx",
            "c4L74Pd7",
            "w3QGkfSG",
            "Zgygw8Fv",
            "LRq8bHFW",
            "tDZlYKZS",
            "mx7Fvxdt",
            "7h6Nb7Xn",
            "K7k1nrDV",
            "BBsZRwG9",
            "6Kz80FR9",
            "pCcpSyLN",
            "xvgl94sM",
            "wwt5Lx6Z",
            "j6CkZvl5",
            "BRmNj3YF",
            "QZcj0C9j",
            "xsXRjKrQ",
            "gLr2D68H",
            "WPDyXTtf",
            "kqL2FhDx",
            "bl4D5Vzg",
            "lrN1HwmQ",
            "RQG6PQwQ",
            "dzSQMXjk",
            "f3ZQtBng",
            "NYbVQWHb",
            "BYq8JVpg",
            "Gy8twWGB",
            "wWRTjK2M",
            "93m9xpLz",
            "DjNYw9yG",
            "4Y3kvl6S",
            "19tdQG4F",
            "VbxPVxHQ",
            "jjWVcyJ3",
            "j1zpjS6R",
            "yFbyyWxt",
            "VqMwfJMN",
            "jcn02BWw",
            "HyVx60Y1",
            "Z7SQZj3k",
            "5fnYP9W8",
            "zQHZpz7f",
            "NJPmcPc3",
            "swYP39dK",
            "Pf9PWHmM",
            "6dFfWYSh",
            "s5rxvPdx",
            "8M9wNB6X",
            "b6vBtB3q",
            "MSFBJDBB",
            "YqJCldSB",
            "1NhwyBgp",
            "fkfVFwjM",
            "tmmfWg9k",
            "hH1RHkH4",
            "CpHhY1yL",
            "FzdVWL5Z",
            "zxbg8yN9",
            "RmnqNmyZ",
            "rW9K96DD",
            "nVDSpzYK",
            "bFtdBD5W",
            "R3MWHq6T",
            "dqMtYL2F",
            "r8P3qgh2",
            "1mx4QxMT"
          ]
        },
        {
          n: "ep3",
          k: [
            "lg2HZjln",
            "4DRs1fMV",
            "xQc9drVs",
            "HTqzJwhM",
            "3CrCbybf",
            "cpc1mDkx"
          ]
        },
        {
          n: "76_route_B_a",
          k: [
            "x86GCl9v",
            "PWJrs7hv",
            "b8dq8y7W",
            "6NqrNLdM",
            "MSQC6dm6",
            "KFFDMtMM",
            "WkpCDb2p",
            "zws5CF40",
            "lbrtg286",
            "BksPctvk",
            "GbT9jdPt",
            "4BbsmwQ5",
            "ClKG4PzK",
            "Sxz1Rgm4",
            "S8D2W05y",
            "c7lXxDry",
            "wlP1c751",
            "4ZqDyLCp",
            "ZgJxclRr",
            "GVlS9kGR",
            "1XDyDRdL",
            "Kt2yrqv4",
            "8tGWSSy2",
            "88xtszcK"
          ]
        },
        {
          n: "90_route_B_b",
          k: [
            "jsQR4Hcz",
            "x86GCl9v",
            "2gMtRNFR",
            "LGK2fDJG",
            "5Y9yBl8l",
            "9zTwFX85",
            "mMkhcWgH",
            "3fHSVnBp",
            "tHkdCFjz",
            "LLdMvmGl",
            "4908TQB2",
            "R1dQf2Mr",
            "H1Y6Q22c",
            "RvcBVFjq",
            "Y91ZCnjZ",
            "RrrfWRBF",
            "w1D1q17v"
          ]
        },
        {
          n: "91_route_B_c",
          k: [
            "Hd1zyTgw",
            "dXxryPgv",
            "x86GCl9v",
            "mShl7N8T",
            "LwvlGfpk",
            "ZJ2mCj0t",
            "S967YQzw",
            "QwhvLjwH",
            "FQWfs5s7"
          ]
        },
        {
          n: "92_route_B_d",
          k: [
            "x86GCl9v",
            "r1HmjZyn",
            "jTjQFBKV",
            "rWphfqjj",
            "0Xc1zlN5",
            "khY3ssml",
            "kR5Fy4cp",
            "HVR208r0",
            "DNJCvkLt",
            "kdScjqP6",
            "cTFjdZCv",
            "PjwYBtWd",
            "dmgY9XWK",
            "8dGYhWrJ",
            "txQs6kYF",
            "Ct0vWyRn",
            "jXmbT8rG",
            "YThXt5T7",
            "L0hv1SPv",
            "D5GTZlxz",
            "Y6HB4NYQ",
            "MR3QHGGD",
            "gkDxqjkQ",
            "GKJsWTlt",
            "vddjJvLs",
            "yjFny19x",
            "g6PnlZpP",
            "r1QRhQ36",
            "WCf7bSNN",
            "yQBwHc6T",
            "14TcRkbB",
            "hlJP49sP",
            "k9cQHXtr",
            "Jyj7bmjQ",
            "yhFqsdpr",
            "RfqZCpqq",
            "vyfpTHmp",
            "hvCbMyrF",
            "3J6FtSVP",
            "jGtP3SQt",
            "Zt8Ch5gq",
            "t4f9xP1z",
            "2MCPZlyH",
            "d0wd1G3d"
          ]
        },
        {
          n: "93_route_A_opt out",
          k: [
            "Bvl1lRm8",
            "HGkgpnFb",
            "wZqdb6Fh",
            "m0bdPXZ3",
            "sM1Fw1lV",
            "VfvWChqV",
            "c7BRtVtx",
            "Y0R41TD5",
            "LKvzR9zw",
            "ZwgTKz4L",
            "qQNDWNCY",
            "sw8xQYsp",
            "QvdgKXMS",
            "9pd06Xhp",
            "Psp184Z7",
            "zBLyfw4P",
            "n4PyDdbQ",
            "KqGqKVjn",
            "6sPwnlhZ",
            "Cd9fh6zQ",
            "fgzSJvS4",
            "X0qlTKGy",
            "XSXqlmmy",
            "BT0WCjWC",
            "x86GCl9v",
            "KpnjmbbZ",
            "rbqbc8kF",
            "lsb40t0d",
            "YD7SLdz4",
            "VYpFTlPr",
            "3TtdmnhG",
            "YDbFBkZp",
            "RGQ91RXb",
            "2kWC1ZBv",
            "VdY0VWhD",
            "vRRv29Ql",
            "GJ7CWpcs",
            "T9QRMT2L",
            "RhWLZr73",
            "bTYQQN6z",
            "kV1Tq30W",
            "TXsZNN4c"
          ]
        },
        {
          n: "94_bonus",
          k: [
            "x86GCl9v",
            "W8sTz57J",
            "5Wjmp852",
            "LwvlGfpk",
            "20h04VwG",
            "l4jHq5JT",
            "Lxs34DZt",
            "QLcl8n1d",
            "9VTDqbX4",
            "VswztqQY",
            "Gps6S70S",
            "J7zk2fkC",
            "4sMqfzGP",
            "C7mKnCkL",
            "7TWlynDd",
            "bHkhjbqc",
            "TWzgx7qM",
            "ZGC1JlnV",
            "40lHssss",
            "vXWskhLH",
            "M4v39pMQ",
            "SGMb4bm2",
            "T7CsFrh1",
            "2Mk43gSP",
            "gltf0NrS",
            "pXDywM2Q",
            "KcqGXrb1",
            "63zPLj43",
            "z6sPgcTL",
            "sYZSBWcR",
            "bR28jMS9",
            "wM3jhn8C",
            "CMXlYBgR",
            "NfqGm60R",
            "hnw21rCx",
            "TvnQp4HL",
            "LXsR5V1X",
            "PrwSHNtK"
          ]
        },
        {
          n: "95_club_afterhours",
          k: [
            "tm4FZR2h",
            "7sryGtHq",
            "kR5Fy4cp",
            "2MpXcZLy",
            "dZYDGXNZ",
            "VFXhDnTt",
            "rXhBD6bW",
            "r27mhCTp",
            "7GpXBW50",
            "1KYnmxJh",
            "JjHN4ZZX",
            "z1vLPkmM",
            "tNr1R5mL",
            "xZL4rp1T",
            "V3v9t79W",
            "QKwBBjQw",
            "BX4k5G5d",
            "SPLTRZsm",
            "x86GCl9v",
            "kSC5LxLS",
            "YTKGkr9w",
            "tlrw9hfF",
            "8JFKYNfF",
            "HGY0LS44",
            "7RwY60zP",
            "sS5KLf9j",
            "sqW5W80z",
            "vKYcGp2y",
            "H3V5gyxK",
            "LVRy5LVf",
            "x136bJ8p",
            "2cqfYRp5",
            "j9kRhwjF",
            "wMKFSn7Y",
            "btwrH6LZ",
            "F0mX1M8T",
            "268cDzK8",
            "ytBPWwDq",
            "j8JZPTLg",
            "0Stv0lwN",
            "bL4W4YK1",
            "GqvhbJYF",
            "1XKSZfJl",
            "fjNl36yt",
            "sYTW8xJj",
            "mTSXKRBV",
            "4wgcWxtw",
            "TcLdnwzb",
            "hGTng7Hr",
            "dSjSYzyH",
            "H4LRVrf4",
            "XwpkNyPl",
            "69S2MpHt",
            "yNhCfpZv",
            "1x650B9W",
            "qgJhKlKP",
            "W4J5crlS",
            "vMjN0vVW",
            "Pb6Jhp3c",
            "lqfD42d4",
            "xc2zygv4",
            "f7sDwl8g",
            "pPZn7tLX",
            "KwjpythK",
            "rQJggHLm",
            "G3rWT8QW",
            "ddhywM65",
            "mR5vWvNj",
            "CsrglfLr",
            "j02qr5kB",
            "QPnlkDZC",
            "RJ4l2hXb",
            "P2WL4x1p",
            "NWBVcmgl",
            "4YZlx8MK",
            "DVKPFqL8",
            "MGM2P97H",
            "7t9VWZqW",
            "Cbfm75kG",
            "JyXZM9yt",
            "JsgvxgC9",
            "cVftmt9j",
            "p60bgnng",
            "W4KpcH7z",
            "3MQ8Nk1W",
            "J4D5s23L",
            "ZdP8t3ss",
            "0LWCzyvn",
            "DKdTldGT",
            "FrDQpHLw",
            "B9wWvTnw",
            "JCjG1ks8",
            "5r6N3nFM",
            "DGXmVCx2",
            "SBQylY9P",
            "52C2XNtl",
            "1Fl0n6v4",
            "PD37K1l6",
            "5ND5BV0P",
            "D6v9Qc8q",
            "bL1fG5g7",
            "vPwMQNCV",
            "fc99Tj15",
            "zPh7J1x5",
            "8CF3x8j1",
            "hpyRgc68",
            "kZjBxVWz",
            "r8JSrVkc",
            "m0g4rHY9",
            "0r1JKKKK",
            "TQfNkxz0",
            "MRrSNzCS",
            "DNvYzx6X",
            "zgWJwVJk",
            "GGhcS5zz",
            "wqMmzklh",
            "pSDH1qkC",
            "8myKf4GV",
            "Zxj8LYXJ",
            "FfndxZJw",
            "lgQYdy2K",
            "674x4xLK",
            "sQXp6b5y",
            "9S6tWZCm",
            "MK3ZwW0X",
            "0nSNW6bB",
            "1pwNRD2g",
            "NfLwxjtP",
            "Crb2RlX9",
            "yXh7Z6n6",
            "4lc7Y4Qf",
            "wDNpKCTx",
            "kmY4WxZs",
            "KQXS9BWz"
          ]
        },
        {
          n: "96_balcony",
          k: [
            "S78FX5bH",
            "0h7YCP96",
            "kJ8dGf8G",
            "QZh0NhY3",
            "0nt1gT5m",
            "frzyG43M",
            "7cZhGpNW",
            "Y8flKg9X",
            "bTpB3tRL",
            "PhSwLk2N",
            "FYL6LMrB",
            "29765jPP",
            "m8k1Yzpb",
            "6HbVhSDq",
            "CjGglp04",
            "wpc0ksRy",
            "kgm3r6bC",
            "TJgQ8s9J"
          ]
        }
      ];
    }
  });

  // tools/map-names.js
  var require_map_names = __commonJS({
    "tools/map-names.js"(exports, module) {
      "use strict";
      init_shim();
      var fs = require_fs_browser();
      var path = require_path_browserify();
      var { hashPath, dekit, decodeK9a } = require_build_tomb_mod();
      var ASSET_NAMES = require_map_filenames();
      function dirExt(dir) {
        return dir.indexOf("audio/") === 0 ? ".ogg" : ".png";
      }
      function dirSuffix(dir) {
        return dir === "img/faces" ? "[BUST]" : "";
      }
      var _maps = null;
      function maps() {
        if (_maps) return _maps;
        _maps = {};
        for (const dir of Object.keys(ASSET_NAMES)) {
          const ext = dirExt(dir);
          const suffix = dirSuffix(dir);
          const hashToStem = /* @__PURE__ */ new Map();
          const stemToHash = /* @__PURE__ */ new Map();
          for (const name of ASSET_NAMES[dir]) {
            const stem = name + suffix;
            const basename = hashPath(dir + "/" + stem + ext).split("/").pop();
            if (!hashToStem.has(basename)) hashToStem.set(basename, stem);
            if (!stemToHash.has(stem)) stemToHash.set(stem, basename);
          }
          _maps[dir] = { hashToStem, stemToHash };
        }
        return _maps;
      }
      var HASH_RE = /^!?[0-9a-f]{16}(\[BUST\])?$/i;
      function toName(dir, value) {
        if (typeof value !== "string" || !value) return value;
        const m = maps()[dir];
        if (!m) return value;
        return m.hashToStem.get(value) || value;
      }
      function toHash(dir, value) {
        if (typeof value !== "string" || !value) return value;
        if (HASH_RE.test(value)) return value;
        const m = maps()[dir];
        if (!m) return value;
        return m.stemToHash.get(value) || value;
      }
      function transformNote(note, fn) {
        if (typeof note !== "string" || !note) return note;
        return note.replace(/<(ground|par):([^>]+)>/g, (full, tag, val) => {
          const next = fn("img/parallaxes", val.trim());
          return next === val.trim() ? full : "<" + tag + ":" + next + ">";
        });
      }
      var COMMAND_REFS = {
        101: [{ index: 0, dir: "img/faces" }],
        // Show Text (face)
        231: [{ index: 1, dir: "img/pictures" }],
        // Show Picture
        241: [{ index: 0, dir: "audio/bgm", audio: true }],
        // Play BGM
        132: [{ index: 0, dir: "audio/bgm", audio: true }],
        // Change Battle BGM
        140: [{ index: 1, dir: "audio/bgm", audio: true }],
        // Change Vehicle BGM
        245: [{ index: 0, dir: "audio/bgs", audio: true }],
        // Play BGS
        249: [{ index: 0, dir: "audio/me", audio: true }],
        // Play ME
        133: [{ index: 0, dir: "audio/me", audio: true }],
        // Change Victory ME
        139: [{ index: 0, dir: "audio/me", audio: true }],
        // Change Defeat ME
        250: [{ index: 0, dir: "audio/se", audio: true }],
        // Play SE
        284: [{ index: 0, dir: "img/parallaxes" }],
        // Change Parallax
        322: [
          // Change Actor Images
          { index: 1, dir: "img/faces" },
          { index: 3, dir: "img/characters" }
        ],
        323: [{ index: 1, dir: "img/characters" }]
        // Change Vehicle Image
      };
      var IMAGE_FIELDS = {
        characterName: "img/characters",
        faceName: "img/faces",
        parallaxName: "img/parallaxes",
        title1Name: "img/titles1",
        title2Name: "img/titles1"
      };
      var AUDIO_FIELDS = {
        bgm: "audio/bgm",
        battleBgm: "audio/bgm",
        titleBgm: "audio/bgm",
        bgs: "audio/bgs",
        me: "audio/me",
        victoryMe: "audio/me",
        defeatMe: "audio/me",
        gameoverMe: "audio/me",
        se: "audio/se"
      };
      function isAudio(o) {
        return o && typeof o === "object" && typeof o.name === "string" && typeof o.volume === "number";
      }
      function transformDoc(doc, fn) {
        const visit = (node) => {
          if (Array.isArray(node)) {
            for (const v of node) visit(v);
            return;
          }
          if (!node || typeof node !== "object") return;
          if (typeof node.code === "number" && Array.isArray(node.parameters)) {
            const specs = COMMAND_REFS[node.code];
            if (specs) {
              for (const s of specs) {
                const p = node.parameters[s.index];
                if (s.audio) {
                  if (isAudio(p)) p.name = fn(s.dir, p.name);
                } else if (typeof p === "string") {
                  node.parameters[s.index] = fn(s.dir, p);
                }
              }
            }
          }
          for (const field of Object.keys(IMAGE_FIELDS)) {
            if (typeof node[field] === "string") {
              node[field] = fn(IMAGE_FIELDS[field], node[field]);
            }
          }
          for (const field of Object.keys(AUDIO_FIELDS)) {
            if (isAudio(node[field])) {
              node[field].name = fn(AUDIO_FIELDS[field], node[field].name);
            }
          }
          if (Array.isArray(node.sounds)) {
            for (const s of node.sounds)
              if (isAudio(s)) s.name = fn("audio/se", s.name);
          }
          if (Array.isArray(node.tilesetNames)) {
            node.tilesetNames = node.tilesetNames.map(
              (n) => typeof n === "string" ? fn("img/tilesets", n) : n
            );
          }
          if (typeof node.note === "string") node.note = transformNote(node.note, fn);
          for (const k of Object.keys(node)) visit(node[k]);
        };
        visit(doc);
      }
      function bakeAssetNames(doc) {
        transformDoc(doc, toName);
      }
      function unbakeAssetNames(doc) {
        transformDoc(doc, toHash);
      }
      function unbakeMapBackground(map) {
        if (!map || typeof map.parallaxName !== "string" || !map.parallaxName) return;
        if (typeof map.note !== "string" || !map.note) return;
        const ground = (map.note.match(/<ground:([^>]+)>/) || [])[1];
        const par = (map.note.match(/<par:([^>]+)>/) || [])[1];
        if (!ground && !par) return;
        const g = ground ? ground.trim() : "";
        const p = par ? par.trim() : "";
        const synthetic = g && p ? `bg_${g}_${p}` : g || p;
        if (map.parallaxName === synthetic) {
          map.parallaxName = "";
        }
      }
      function lookupRename(rel) {
        const idx = rel.lastIndexOf("/");
        if (idx < 0) return null;
        const dir = rel.slice(0, idx);
        const basename = rel.slice(idx + 1);
        const m = maps()[dir];
        if (!m) return null;
        const stem = m.hashToStem.get(basename);
        return stem ? { dir, stem } : null;
      }
      var MIN_KEYS = 3;
      var THRESHOLD = 0.5;
      var MARGIN = 0.15;
      function decodeLogical(www, logical) {
        const k9a = path.join(www, logical.replace(/\.[^./]+$/, ".k9a"));
        if (fs.existsSync(k9a)) return decodeK9a(fs.readFileSync(k9a), logical);
        const hp = hashPath(logical);
        const hashed = path.join(www, hp);
        if (fs.existsSync(hashed)) return dekit(fs.readFileSync(hashed), hp);
        const plain = path.join(www, logical);
        if (fs.existsSync(plain)) return fs.readFileSync(plain);
        return null;
      }
      function mapKeyCodes(str) {
        const set = /* @__PURE__ */ new Set();
        const re = /\((?:lines|label)\)\[([^\]]+)\]/g;
        let m;
        while (m = re.exec(str)) set.add(m[1]);
        return set;
      }
      function jaccard(a, b) {
        if (!a.size || !b.size) return 0;
        let inter = 0;
        for (const x of a) if (b.has(x)) inter++;
        return inter / (a.size + b.size - inter);
      }
      function loadMapNameRefs(namesFrom) {
        if (namesFrom) {
          let www = namesFrom;
          if (!fs.existsSync(path.join(www, "data"))) {
            const inner = path.join(www, "www");
            if (fs.existsSync(path.join(inner, "data"))) www = inner;
          }
          const infosBuf = decodeLogical(www, "data/MapInfos.json");
          if (!infosBuf) return null;
          const infos = JSON.parse(infosBuf.toString("utf8"));
          const refs = [];
          for (const e of infos) {
            if (!e || !e.name) continue;
            const buf = decodeLogical(
              www,
              `data/Map${String(e.id).padStart(3, "0")}.json`
            );
            if (!buf) continue;
            const keys = mapKeyCodes(buf.toString("utf8"));
            if (keys.size) refs.push({ name: e.name, keys });
          }
          return refs.length ? refs : null;
        }
        const raw = require_map_name_keys();
        return raw.map((m) => ({ name: m.n, keys: new Set(m.k) }));
      }
      function resolveMapNames(www, refs) {
        const out = /* @__PURE__ */ new Map();
        if (!refs || !refs.length) return out;
        const infosBuf = decodeLogical(www, "data/MapInfos.json");
        if (!infosBuf) return out;
        let infos;
        try {
          infos = JSON.parse(infosBuf.toString("utf8"));
        } catch (_) {
          return out;
        }
        for (const e of infos) {
          if (!e || !e.id) continue;
          const buf = decodeLogical(
            www,
            `data/Map${String(e.id).padStart(3, "0")}.json`
          );
          if (!buf) continue;
          const codes = mapKeyCodes(buf.toString("utf8"));
          if (codes.size < MIN_KEYS) continue;
          let best = null;
          let bestScore = -1;
          let secondScore = -1;
          for (const ref of refs) {
            const sc = jaccard(codes, ref.keys);
            if (sc > bestScore) {
              secondScore = bestScore;
              bestScore = sc;
              best = ref;
            } else if (sc > secondScore) {
              secondScore = sc;
            }
          }
          if (best && bestScore >= THRESHOLD && bestScore - secondScore >= MARGIN) {
            out.set(e.id, best.name);
          }
        }
        return out;
      }
      module.exports = {
        MIN_KEYS,
        THRESHOLD,
        MARGIN,
        decodeLogical,
        mapKeyCodes,
        jaccard,
        loadMapNameRefs,
        resolveMapNames,
        // asset-filename round-trip (formerly file-names.js)
        ASSET_NAMES,
        dirExt,
        toName,
        toHash,
        bakeAssetNames,
        unbakeAssetNames,
        unbakeMapBackground,
        lookupRename
      };
    }
  });

  // tools/lang-roundtrip.js
  var require_lang_roundtrip = __commonJS({
    "tools/lang-roundtrip.js"(exports, module) {
      "use strict";
      init_shim();
      var fs = require_fs_browser();
      var path = require_path_browserify();
      var LANGDATA_SIG = "LANGDATA";
      function loadCLD(dataDir) {
        let names;
        try {
          names = fs.readdirSync(dataDir);
        } catch (e) {
          return null;
        }
        for (const name of names) {
          const abs = path.join(dataDir, name);
          let buf;
          try {
            if (!fs.statSync(abs).isFile()) continue;
            buf = fs.readFileSync(abs);
          } catch (e) {
            continue;
          }
          if (buf.length >= LANGDATA_SIG.length && buf.subarray(0, LANGDATA_SIG.length).toString("latin1") === LANGDATA_SIG) {
            const brace = buf.indexOf(123);
            if (brace < 0) continue;
            try {
              const cld = JSON.parse(buf.toString("utf8", brace));
              if (cld && (cld.labelLUT || cld.linesLUT)) {
                return { file: abs, rel: name, header: buf.subarray(0, brace), cld };
              }
            } catch (e) {
            }
          }
        }
        return null;
      }
      function serializeCLD(header, cld) {
        return import_buffer.Buffer.concat([import_buffer.Buffer.from(header), import_buffer.Buffer.from(JSON.stringify(cld))]);
      }
      function lutsFromCLD(cld) {
        return { labelLUT: cld.labelLUT || {}, linesLUT: cld.linesLUT || {} };
      }
      function linesValue(v) {
        return Array.isArray(v) ? v.join("\n") : String(v);
      }
      function bakeText(str, lut, acc) {
        return str.replace(/\(label\)\[([^\]]+)\]/g, (m, k) => {
          const v = lut.labelLUT[k];
          if (v === void 0) return m;
          acc.n++;
          return String(v);
        }).replace(/\(lines\)\[([^\]]+)\]/g, (m, k) => {
          const v = lut.linesLUT[k];
          if (v === void 0) return m;
          acc.n++;
          return linesValue(v);
        });
      }
      function deepBake(node, lut, acc) {
        if (typeof node === "string") return bakeText(node, lut, acc);
        if (Array.isArray(node)) {
          for (let i = 0; i < node.length; i++) node[i] = deepBake(node[i], lut, acc);
          return node;
        }
        if (node && typeof node === "object") {
          for (const k in node) node[k] = deepBake(node[k], lut, acc);
          return node;
        }
        return node;
      }
      function isCommandList(arr) {
        return arr.some(
          (e) => e && typeof e === "object" && typeof e.code === "number" && Array.isArray(e.parameters)
        );
      }
      var LINE_CODES = /* @__PURE__ */ new Set([401, 405]);
      function bakeShowTextLine(s, lut, acc) {
        const tokens = s.match(/\(lines\)\[[^\]]+\]/g) || [];
        if (tokens.length !== 1) return [bakeText(s, lut, acc)];
        const m = s.match(/\(lines\)\[([^\]]+)\]/);
        const v = lut.linesLUT[m[1]];
        if (v === void 0) return [bakeText(s, lut, acc)];
        const bakedPrefix = bakeText(s.slice(0, m.index), lut, acc);
        const bakedSuffix = bakeText(s.slice(m.index + m[0].length), lut, acc);
        acc.n++;
        const segs = (Array.isArray(v) ? v : [v]).map(String);
        if (segs.length === 0) segs.push("");
        segs[0] = bakedPrefix + segs[0];
        segs[segs.length - 1] = segs[segs.length - 1] + bakedSuffix;
        return segs;
      }
      function bakeList(list, lut, acc) {
        const out = [];
        for (const cmd of list) {
          if (cmd && LINE_CODES.has(cmd.code) && cmd.parameters) {
            const lines = bakeShowTextLine(String(cmd.parameters[0] || ""), lut, acc);
            for (const lineStr of lines) {
              out.push({ code: cmd.code, indent: cmd.indent, parameters: [lineStr] });
            }
          } else {
            bakeDoc(cmd, lut, acc);
            out.push(cmd);
          }
        }
        list.length = 0;
        for (const c of out) list.push(c);
      }
      function bakeDoc(node, lut, acc) {
        if (typeof node === "string") return bakeText(node, lut, acc);
        if (Array.isArray(node)) {
          if (isCommandList(node)) {
            bakeList(node, lut, acc);
            return node;
          }
          for (let i = 0; i < node.length; i++) node[i] = bakeDoc(node[i], lut, acc);
          return node;
        }
        if (node && typeof node === "object") {
          for (const k in node) node[k] = bakeDoc(node[k], lut, acc);
          return node;
        }
        return node;
      }
      var HEADER_TOKEN = /^(?:\\n<[^>]*>|<center>|\\c\[\d+\]|\\bust[A-Za-z]*\[\d+\])/;
      var HAS_PLACEHOLDER = /\((?:lines|label)\)\[[^\]]+\]/;
      var TEXT_GROUPS = {
        101: 401,
        // Show Text
        105: 405
        // Show Scrolling Text
      };
      function makeMinter(cld) {
        const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const used = /* @__PURE__ */ new Set([
          ...Object.keys(cld.linesLUT || {}),
          ...Object.keys(cld.labelLUT || {})
        ]);
        function hashKey(seed) {
          let fnv = 2166136261;
          let djb = 5381;
          for (let i = 0; i < seed.length; i++) {
            const c = seed.charCodeAt(i);
            fnv = (fnv ^ c) >>> 0;
            fnv = fnv + ((fnv << 1) + (fnv << 4) + (fnv << 7) + (fnv << 8) + (fnv << 24)) >>> 0;
            djb = (djb << 5) + djb + c >>> 0;
          }
          let n = fnv * 4096 + (djb & 4095);
          let k = "";
          for (let i = 0; i < 8; i++) {
            k += ALPHA[n % ALPHA.length];
            n = Math.floor(n / ALPHA.length);
            if (n === 0) n = djb >>> i * 4;
          }
          return k;
        }
        return function mint(seed) {
          const base = typeof seed === "string" ? seed : "";
          let k = hashKey(base);
          let salt = 0;
          while (used.has(k)) {
            k = hashKey(base + "\0" + ++salt);
          }
          used.add(k);
          return k;
        };
      }
      function createUnbaker(cld) {
        cld.linesLUT = cld.linesLUT || {};
        cld.labelLUT = cld.labelLUT || {};
        const linesRev = /* @__PURE__ */ new Map();
        for (const k in cld.linesLUT) {
          const v = linesValue(cld.linesLUT[k]);
          if (!linesRev.has(v)) linesRev.set(v, k);
        }
        const labelRev = /* @__PURE__ */ new Map();
        for (const k in cld.labelLUT) {
          const v = String(cld.labelLUT[k]);
          if (!labelRev.has(v)) labelRev.set(v, k);
        }
        const mint = makeMinter(cld);
        const stats = { restored: 0, mintedLines: 0, mintedLabels: 0 };
        function resolveSpeaker(str) {
          return str.replace(/^\\n<([^>]*)>/, (m, inner) => {
            if (/^\(label\)\[/.test(inner)) return m;
            let key = labelRev.get(inner);
            if (key === void 0) {
              key = mint(inner);
              cld.labelLUT[key] = inner;
              labelRev.set(inner, key);
              stats.mintedLabels++;
            }
            return "\\n<(label)[" + key + "]>";
          });
        }
        function reconstruct(joined) {
          let s = resolveSpeaker(joined);
          let prefixEnd = 0;
          for (; ; ) {
            const m = s.slice(prefixEnd).match(HEADER_TOKEN);
            if (!m) break;
            prefixEnd += m[0].length;
          }
          const prefix = s.slice(0, prefixEnd);
          const body = s.slice(prefixEnd);
          if (HAS_PLACEHOLDER.test(body) || body.trim() === "") {
            return s;
          }
          let key = linesRev.get(body);
          if (key !== void 0) {
            stats.restored++;
          } else {
            key = mint(body);
            cld.linesLUT[key] = body.split("\n");
            linesRev.set(body, key);
            stats.mintedLines++;
          }
          return prefix + "(lines)[" + key + "]";
        }
        function restoreChoice(str) {
          if (HAS_PLACEHOLDER.test(str) || str.trim() === "") return str;
          let key = labelRev.get(str);
          if (key !== void 0) {
            stats.restored++;
            return "(label)[" + key + "]";
          }
          key = linesRev.get(str);
          if (key !== void 0) {
            stats.restored++;
            return "(lines)[" + key + "]";
          }
          key = mint(str);
          cld.labelLUT[key] = str;
          labelRev.set(str, key);
          stats.mintedLabels++;
          return "(label)[" + key + "]";
        }
        function processList(list) {
          const out = [];
          for (let i = 0; i < list.length; i++) {
            const cmd = list[i];
            if (cmd && cmd.code === 102 && cmd.parameters && Array.isArray(cmd.parameters[0])) {
              cmd.parameters[0] = cmd.parameters[0].map(
                (c) => typeof c === "string" ? restoreChoice(c) : c
              );
              out.push(cmd);
              continue;
            }
            const lineCode = cmd && typeof cmd.code === "number" ? TEXT_GROUPS[cmd.code] : void 0;
            if (lineCode === void 0) {
              out.push(cmd);
              continue;
            }
            out.push(cmd);
            const group = [];
            let j = i + 1;
            while (j < list.length && list[j] && list[j].code === lineCode) {
              group.push(list[j]);
              j++;
            }
            if (group.length) {
              const joined = group.map((c) => String(c.parameters && c.parameters[0] || "")).join("\n");
              out.push({
                code: lineCode,
                indent: group[0].indent,
                parameters: [reconstruct(joined)]
              });
            }
            i = j - 1;
          }
          list.length = 0;
          for (const c of out) list.push(c);
        }
        function unbakeDoc(node) {
          if (Array.isArray(node)) {
            if (isCommandList(node)) processList(node);
            for (const e of node) unbakeDoc(e);
          } else if (node && typeof node === "object") {
            for (const k in node) unbakeDoc(node[k]);
          }
          return node;
        }
        return { unbakeDoc, stats };
      }
      module.exports = {
        // CLD
        loadCLD,
        serializeCLD,
        lutsFromCLD,
        LANGDATA_SIG,
        // bake
        linesValue,
        bakeText,
        deepBake,
        bakeDoc,
        // unbake
        createUnbaker
      };
    }
  });

  // tools/extract-project.js
  var require_extract_project = __commonJS({
    "tools/extract-project.js"(exports, module) {
      "use strict";
      init_shim();
      var fs = require_fs_browser();
      var path = require_path_browserify();
      var {
        hashPath,
        dekit,
        decodeK9a,
        parseLoc,
        walk,
        writeOut,
        canvas
      } = require_build_tomb_mod();
      var {
        loadMapNameRefs,
        resolveMapNames,
        bakeAssetNames,
        lookupRename,
        dirExt
      } = require_map_names();
      var { loadCLD, lutsFromCLD, bakeDoc } = require_lang_roundtrip();
      var STD_DATA = [
        "System",
        "Actors",
        "Classes",
        "Skills",
        "Items",
        "Weapons",
        "Armors",
        "Enemies",
        "Troops",
        "States",
        "Animations",
        "Tilesets",
        "CommonEvents",
        "MapInfos"
      ];
      var SYSTEM_IMAGES = [
        "Window",
        "IconSet",
        "Balloon",
        "Damage",
        "GameOver",
        "Loading",
        "ButtonSet",
        "States",
        "Shadow1",
        "Shadow2",
        "Weapons1",
        "Weapons2",
        "Weapons3",
        "continue",
        "credits",
        "language",
        "msgimg_0",
        "new_game",
        "options",
        "quit",
        "stamp",
        "vision",
        "VNButtons"
      ];
      var MAX_MAP_ID = 2e3;
      function buildNameMap() {
        const map = {};
        const add = (logical) => {
          map[hashPath(logical)] = logical;
        };
        for (const name of STD_DATA) add(`data/${name}.json`);
        for (let id = 1; id <= MAX_MAP_ID; id++) {
          add(`data/Map${String(id).padStart(3, "0")}.json`);
        }
        for (const name of SYSTEM_IMAGES) add(`img/system/${name}.png`);
        return map;
      }
      function detectExtension(data) {
        if (data.length >= 8 && data[0] === 137 && data[1] === 80 && data[2] === 78 && data[3] === 71) {
          return ".png";
        }
        if (data.length >= 4 && data[0] === 79 && data[1] === 103 && data[2] === 103 && data[3] === 83) {
          return ".ogg";
        }
        if (data.length >= 4 && data[0] === 26 && data[1] === 69 && data[2] === 223 && data[3] === 163) {
          return ".webm";
        }
        if (data.length >= 12 && data[4] === 102 && data[5] === 116 && data[6] === 121 && data[7] === 112) {
          return ".mp4";
        }
        return null;
      }
      function fromK9A(rel) {
        if (/^data(\/|\\)/.test(rel)) return rel.replace(/\.k9a$/i, ".json");
        if (/^img(\/|\\)/.test(rel)) return rel.replace(/\.k9a$/i, ".png");
        if (/^audio(\/|\\)/.test(rel)) return rel.replace(/\.k9a$/i, ".ogg");
        return rel;
      }
      async function setMapBackground(map, parallaxDir) {
        if (!map || typeof map.note !== "string" || !map.note) return false;
        if (map.parallaxName) return false;
        const ground = (map.note.match(/<ground:([^>]+)>/) || [])[1];
        const par = (map.note.match(/<par:([^>]+)>/) || [])[1];
        if (!ground && !par) return false;
        let name = ground || par;
        if (ground && par) {
          name = `bg_${ground}_${par}`;
          await compositeLayers(parallaxDir, ground, par);
        }
        map.parallaxName = name;
        map.parallaxShow = true;
        map.parallaxLoopX = false;
        map.parallaxLoopY = false;
        map.parallaxSx = 0;
        map.parallaxSy = 0;
        return true;
      }
      var _compositeCache = /* @__PURE__ */ new Map();
      async function compositeLayers(parallaxDir, ground, par) {
        const cv = canvas();
        const key = ground + "\0" + par;
        if (_compositeCache.has(key)) return _compositeCache.get(key);
        const groundPath = path.join(parallaxDir, ground + ".png");
        const parPath = path.join(parallaxDir, par + ".png");
        const haveGround = fs.existsSync(groundPath);
        const havePar = fs.existsSync(parPath);
        if (!cv || !haveGround || !havePar) {
          const src = haveGround ? groundPath : havePar ? parPath : null;
          if (!src) {
            _compositeCache.set(key, null);
            return null;
          }
          const name2 = `bg_${ground}_${par}`;
          fs.copyFileSync(src, path.join(parallaxDir, name2 + ".png"));
          _compositeCache.set(key, name2);
          return name2;
        }
        const { createCanvas, loadImage } = cv;
        const [g, p] = await Promise.all([loadImage(groundPath), loadImage(parPath)]);
        const w = Math.max(g.width, p.width);
        const h = Math.max(g.height, p.height);
        const c = createCanvas(w, h);
        const ctx = c.getContext("2d");
        ctx.drawImage(g, 0, 0);
        ctx.drawImage(p, 0, 0);
        const name = `bg_${ground}_${par}`;
        fs.writeFileSync(
          path.join(parallaxDir, name + ".png"),
          c.toBuffer("image/png")
        );
        _compositeCache.set(key, name);
        return name;
      }
      async function applyMapBackgrounds(out) {
        const dataDir = path.join(out, "data");
        const parallaxDir = path.join(out, "img", "parallaxes");
        if (!fs.existsSync(dataDir)) return 0;
        let n = 0;
        for (const f of fs.readdirSync(dataDir)) {
          if (!/^Map\d+\.json$/.test(f)) continue;
          const abs = path.join(dataDir, f);
          let map;
          try {
            map = JSON.parse(fs.readFileSync(abs, "utf8"));
          } catch (e) {
            continue;
          }
          if (await setMapBackground(map, parallaxDir)) {
            fs.writeFileSync(abs, JSON.stringify(map));
            n++;
          }
        }
        return n;
      }
      function fillMapNames(mapInfos, nameIndex) {
        let recovered = 0;
        let filled = 0;
        for (const e of mapInfos) {
          if (!e || e.name && e.name !== "") continue;
          const real = nameIndex && nameIndex.get(e.id);
          if (real) {
            e.name = real;
            recovered++;
          } else {
            e.name = "Map" + String(e.id).padStart(3, "0");
            filled++;
          }
        }
        return { recovered, filled };
      }
      function extract(www, out, nameMap, lut, mapNameIndex) {
        const files = walk(www);
        let renamed = 0;
        let renamedAssets = 0;
        let extended = 0;
        let langs = 0;
        let mapsNamed = 0;
        let mapsRecovered = 0;
        const bakeAcc = { n: 0 };
        for (const rel of files) {
          const ext = path.extname(rel).toLowerCase();
          const raw = fs.readFileSync(path.join(www, rel));
          if (ext === ".k9a") {
            const logical = fromK9A(rel);
            writeOut(out, logical, decodeK9a(raw, logical));
          } else if (ext === ".loc") {
            writeOut(out, rel, JSON.stringify(parseLoc(raw), null, "	"));
            langs++;
          } else {
            let dec = dekit(raw, rel);
            const canonical = nameMap[rel];
            let outRel = rel;
            if (canonical) {
              outRel = canonical;
              renamed++;
            } else {
              const ren = lookupRename(rel);
              if (ren) {
                outRel = ren.dir + "/" + ren.stem + (detectExtension(dec) || dirExt(ren.dir));
                renamedAssets++;
              } else if (!path.extname(rel)) {
                const detected = detectExtension(dec);
                if (detected) {
                  outRel = rel + detected;
                  extended++;
                }
              }
            }
            if (/^data\/.+\.json$/.test(outRel)) {
              try {
                const obj = JSON.parse(dec.toString("utf8"));
                bakeAssetNames(obj);
                if (lut) {
                  bakeDoc(obj, lut, bakeAcc);
                }
                if (outRel === "data/MapInfos.json") {
                  const r = fillMapNames(obj, mapNameIndex);
                  mapsRecovered = r.recovered;
                  mapsNamed = r.filled;
                }
                dec = import_buffer.Buffer.from(JSON.stringify(obj));
              } catch (e) {
              }
            }
            writeOut(out, outRel, dec);
          }
        }
        return {
          total: files.length,
          renamed,
          renamedAssets,
          extended,
          langs,
          baked: bakeAcc.n,
          mapsNamed,
          mapsRecovered
        };
      }
      function generateRpgProject(out) {
        fs.writeFileSync(path.join(out, "Game.rpgproject"), "RPGMV 1.6.2");
      }
      function updatePackageJson(out) {
        const pkgPath = path.join(out, "package.json");
        if (!fs.existsSync(pkgPath)) return;
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        pkg.name = "tcoaal";
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, "    "));
      }
      function patchIndexHtml(out) {
        const indexPath = path.join(out, "index.html");
        if (!fs.existsSync(indexPath)) return;
        const script = `
		<script>
			// Patches provided by extract-project.js

			// The recovered project ships fully decrypted assets under their
			// resolved names, so neutralize the runtime DRM / asset-resolution
			// layer instead of letting it re-hash and re-decrypt them.
			const orig = window.onload;
			window.onload = () => {
				const readFile = Utils.readFile;
				Utils.readFile = function (filePath, encoding) {
					if (Utils.ext(filePath) === '.loc') {
						// Pad the response with empty data, which the game cuts off.
						return ' '.repeat(Buffer.byteLength(SIGNATURE, 'utf8') + 4)
							+ readFile(filePath, encoding);
					}
					// Forward ALL arguments: the DRM's Lang.loadCLD calls
					// Utils.readFile(path, null) and relies on the null encoding to
					// get a Buffer (it checks Buffer.isBuffer). Dropping the second
					// argument makes readFileSync fall back to its 'utf8' default and
					// return a string, so the CLD load throws "not a valid format".
					return readFile.apply(this, arguments);
				};

				if (typeof Crypto !== 'undefined') {
					if (Crypto.resolveURL) Crypto.resolveURL = (url) => url;
					if (Crypto.resolvePath) Crypto.resolvePath = (filePath) => filePath;
					if (Crypto.dekit) Crypto.dekit = (data) => data;
					if (Crypto.hashMatchDRM) Crypto.hashMatchDRM = () => true;
				}

				// The data/asset loaders resolve paths through App.redirect(),
				// which only returns the canonical path when the build reports it
				// is NOT obfuscated; otherwise it consults an on-disk hash map that
				// is empty here (files are decrypted under canonical/extension
				// names), yielding an empty URL that fetches index.html and breaks
				// JSON.parse. Declaring the build de-obfuscated makes redirect()
				// pass paths through untouched.
				if (typeof App !== 'undefined' && App.usesObfuscation) {
					App.usesObfuscation = () => false;
				}

				// Lang.init (and other filesystem reads) resolve files against
				// App.rootPath() = dirname(process.mainModule.filename), which does
				// not point at the project when launched from the RPG Maker MV
				// editor / a playtest host: so the base-language CLD isn't found
				// and all dialogue labels go missing. nw.__dirname is the project
				// folder (where index.html lives), so anchor rootPath there.
				if (
					typeof App !== 'undefined' &&
					App.rootPath &&
					typeof nw !== 'undefined' &&
					nw.__dirname
				) {
					App.rootPath = () => nw.__dirname;
				}

				orig();
			}
		<\/script>
	`.trim();
        const index = fs.readFileSync(indexPath, "utf8");
        fs.writeFileSync(indexPath, index.replace("</body>", `${script}
</body>`));
      }
      function normalizePluginsJs(out) {
        const pluginsPath = path.join(out, "js", "plugins.js");
        if (!fs.existsSync(pluginsPath)) return;
        const src = fs.readFileSync(pluginsPath, "utf8");
        const fixed = src.replace(/,(\s*)\];(\s*)$/, "$1];$2");
        if (fixed !== src) fs.writeFileSync(pluginsPath, fixed);
      }
      function installPlayer(out) {
        const srcLib = path.join(__dirname, "..", "app", "js", "libs");
        const dstPlay = path.join(out, "_play");
        fs.mkdirSync(dstPlay, { recursive: true });
        for (const f of ["browser-shim.js", "pako_inflate.min.js"]) {
          fs.copyFileSync(path.join(srcLib, f), path.join(dstPlay, f));
        }
        fs.copyFileSync(
          path.join(__dirname, "lang-roundtrip.js"),
          path.join(dstPlay, "lang-roundtrip.js")
        );
        const pluginsDir = path.join(out, "js", "plugins");
        fs.mkdirSync(pluginsDir, { recursive: true });
        fs.copyFileSync(
          path.join(__dirname, "playerbundle", "PlayInBrowser.js"),
          path.join(pluginsDir, "PlayInBrowser.js")
        );
        const pj = path.join(out, "js", "plugins.js");
        if (fs.existsSync(pj)) {
          let src = fs.readFileSync(pj, "utf8");
          if (!/["']PlayInBrowser["']/.test(src)) {
            const entry = '{"name":"PlayInBrowser","status":true,"description":"","parameters":{}}';
            src = src.replace(/\n\];(\s*)$/, ",\n" + entry + "\n];$1");
            fs.writeFileSync(pj, src);
          }
        }
      }
      function rmrf(target) {
        if (!fs.existsSync(target)) return;
        if (fs.statSync(target).isDirectory()) {
          for (const entry of fs.readdirSync(target)) rmrf(path.join(target, entry));
          fs.rmdirSync(target);
        } else {
          fs.unlinkSync(target);
        }
      }
      function parseArgs(argv) {
        const opts = {
          www: "www",
          out: "project",
          force: false,
          bake: true,
          playable: true,
          mapNames: true,
          namesFrom: null
        };
        for (let i = 0; i < argv.length; i++) {
          const a = argv[i];
          if (a === "--www" || a === "-w") opts.www = argv[++i];
          else if (a === "--out" || a === "-o") opts.out = argv[++i];
          else if (a === "--force" || a === "-f") opts.force = true;
          else if (a === "--no-bake") opts.bake = false;
          else if (a === "--not-playable") opts.playable = false;
          else if (a === "--playable")
            opts.playable = true;
          else if (a === "--no-map-names") opts.mapNames = false;
          else if (a === "--names-from") opts.namesFrom = argv[++i];
          else if (a === "--help" || a === "-h") {
            console.log(
              "Usage: node tools/extract-project.js --www <gameWww> --out <projectDir> [--force] [--no-bake] [--not-playable]\n  --no-bake          keep dialogue placeholders ((label)[..]/(lines)[..]) instead\n                     of baking the base-language text into the data.\n  --not-playable     skip bundling the BrowserPlayer launcher. By default it is\n                     bundled (F9 / title 'Play in Browser') so the editor playtest\n                     can hand off to correct browser-mode rendering, baking\n                     readable text for the editor and un-baking it back to\n                     (label)/(lines) placeholders at run/pack time so the live VN\n                     engine renders correctly.\n  --names-from <dir> recover map names by matching against this named-maps game\n                     build instead of the bundled reference (tools/map-name-keys.json).\n  --no-map-names     skip map-name recovery; blank maps become MapNNN."
            );
            import_process.default.exit(0);
          } else {
            console.error(`Unknown argument: ${a}`);
            import_process.default.exit(1);
          }
        }
        return opts;
      }
      function resolveWww(input) {
        if (fs.existsSync(path.join(input, "data"))) return input;
        if (fs.existsSync(path.join(input, "www", "data"))) {
          return path.join(input, "www");
        }
        return input;
      }
      async function run(opts) {
        _compositeCache.clear();
        const www = resolveWww(opts.www);
        const out = opts.out;
        if (!fs.existsSync(www) || !fs.statSync(www).isDirectory()) {
          throw new Error(`Game www folder not found: ${opts.www}`);
        }
        if (fs.existsSync(out)) {
          if (!opts.force) {
            throw new Error(
              `Output folder already exists: ${out} (pass --force to overwrite).`
            );
          }
          rmrf(out);
        }
        fs.mkdirSync(out, { recursive: true });
        const cldInfo = opts.bake ? loadCLD(path.join(www, "data")) : null;
        const lut = cldInfo ? lutsFromCLD(cldInfo.cld) : null;
        if (opts.bake && !lut) {
          console.warn("No base CLD found: dialogue placeholders left unbaked.");
        }
        let mapNameIndex = null;
        if (opts.mapNames) {
          const refs = loadMapNameRefs(opts.namesFrom);
          if (!refs) {
            console.warn(
              opts.namesFrom ? `No named maps found in --names-from ${opts.namesFrom}: maps become MapNNN.` : "No bundled map-name reference (tools/map-name-keys.json): maps become MapNNN."
            );
          } else {
            mapNameIndex = resolveMapNames(www, refs);
          }
        }
        console.time("extract");
        const stats = extract(www, out, buildNameMap(), lut, mapNameIndex);
        const mapsBg = await applyMapBackgrounds(out);
        generateRpgProject(out);
        updatePackageJson(out);
        patchIndexHtml(out);
        normalizePluginsJs(out);
        if (opts.playable) installPlayer(out);
        console.timeEnd("extract");
        console.log(
          `Processed ${stats.total} files: ${stats.renamed} canonical name${stats.renamed === 1 ? "" : "s"} recovered, ${stats.renamedAssets} asset name${stats.renamedAssets === 1 ? "" : "s"} recovered, ${stats.extended} asset extension${stats.extended === 1 ? "" : "s"} restored` + (stats.langs ? `, ${stats.langs} language file${stats.langs === 1 ? "" : "s"} unpacked` : "") + "."
        );
        if (stats.baked) {
          console.log(
            `Baked ${stats.baked} localized text placeholders into the data.`
          );
        }
        if (stats.mapsRecovered) {
          console.log(
            `Recovered ${stats.mapsRecovered} real map name${stats.mapsRecovered === 1 ? "" : "s"} by content match.`
          );
        }
        if (stats.mapsNamed) {
          console.log(
            `Filled ${stats.mapsNamed} remaining blank map name${stats.mapsNamed === 1 ? "" : "s"} (MapNNN).`
          );
        }
        if (mapsBg) {
          console.log(
            `Set ${mapsBg} map parallax background${mapsBg === 1 ? "" : "s"} from <ground>/<par> notes.`
          );
        }
        if (opts.playable) {
          console.log(
            "Bundled the BrowserPlayer launcher (press F9 in playtest, or title 'Play in Browser')."
          );
        }
        console.log(`
Project ready: ${path.resolve(out, "Game.rpgproject")}`);
      }
      module.exports = { run, parseArgs, resolveWww, extract, buildNameMap };
      if (__require.main === module) {
        run(parseArgs(import_process.default.argv.slice(2))).catch((e) => {
          console.error(e && e.message ? e.message : e);
          import_process.default.exit(1);
        });
      }
    }
  });

  // tools/pack-project.js
  var require_pack_project = __commonJS({
    "tools/pack-project.js"(exports, module) {
      "use strict";
      init_shim();
      var fs = require_fs_browser();
      var path = require_path_browserify();
      var { hashPath, fileMask, walk } = require_build_tomb_mod();
      var { loadCLD, createUnbaker, serializeCLD } = require_lang_roundtrip();
      var { unbakeAssetNames, unbakeMapBackground } = require_map_names();
      var ASSET_SIG = import_buffer.Buffer.from("TCOAAL");
      var STD_DATA = [
        "System",
        "Actors",
        "Classes",
        "Skills",
        "Items",
        "Weapons",
        "Armors",
        "Enemies",
        "Troops",
        "States",
        "Animations",
        "Tilesets",
        "CommonEvents",
        "MapInfos"
      ];
      var SYSTEM_IMAGES = [
        "Window",
        "IconSet",
        "Balloon",
        "Damage",
        "GameOver",
        "Loading",
        "ButtonSet",
        "States",
        "Shadow1",
        "Shadow2",
        "Weapons1",
        "Weapons2",
        "Weapons3",
        "continue",
        "credits",
        "language",
        "msgimg_0",
        "new_game",
        "options",
        "quit",
        "stamp",
        "vision",
        "VNButtons"
      ];
      function canonicalSet(maxMapId = 2e3) {
        const s = /* @__PURE__ */ new Set();
        for (const n of STD_DATA) s.add(`data/${n}.json`);
        for (let i = 1; i <= maxMapId; i++) {
          s.add(`data/Map${String(i).padStart(3, "0")}.json`);
        }
        for (const n of SYSTEM_IMAGES) s.add(`img/system/${n}.png`);
        return s;
      }
      function encrypt(plain, hashedRel) {
        let mask = fileMask(hashedRel) + 1 & 255;
        const out = import_buffer.Buffer.allocUnsafe(plain.length);
        for (let i = 0; i < plain.length; i++) {
          const c = plain[i] ^ mask;
          out[i] = c;
          mask = (mask << 1 ^ c) & 255;
        }
        return import_buffer.Buffer.concat([ASSET_SIG, import_buffer.Buffer.from([0]), out]);
      }
      var HASH_BASENAME = /^!?[0-9a-f]{16}(\[BUST\])?$/i;
      function targetFor(rel, canon) {
        if (canon.has(rel)) {
          return { hashed: hashPath(rel), encrypt: true };
        }
        const m = rel.match(/^(img|audio|movies)\/(.+)$/);
        if (m) {
          const dir = path.posix.dirname(rel);
          const base = path.posix.basename(rel);
          const ext = path.posix.extname(base);
          const stem = ext ? base.slice(0, -ext.length) : base;
          if (HASH_BASENAME.test(stem)) {
            return { hashed: dir + "/" + stem, encrypt: true };
          }
          return { hashed: hashPath(rel), encrypt: true };
        }
        return { hashed: rel, encrypt: false };
      }
      function rmrf(target) {
        if (!fs.existsSync(target)) return;
        if (fs.statSync(target).isDirectory()) {
          for (const e of fs.readdirSync(target)) rmrf(path.join(target, e));
          fs.rmdirSync(target);
        } else {
          fs.unlinkSync(target);
        }
      }
      function writeOut(outRoot, rel, buf) {
        const dest = path.join(outRoot, rel);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, buf);
      }
      function parseArgs(argv) {
        const opts = { project: "project", out: "www-packed", force: false };
        for (let i = 0; i < argv.length; i++) {
          const a = argv[i];
          if (a === "--project" || a === "-p") opts.project = argv[++i];
          else if (a === "--out" || a === "-o") opts.out = argv[++i];
          else if (a === "--force" || a === "-f") opts.force = true;
          else if (a === "--help" || a === "-h") {
            console.log(
              "Usage: node tools/pack-project.js --project <projectDir> --out <wwwDir> [--force]"
            );
            import_process.default.exit(0);
          } else {
            console.error(`Unknown argument: ${a}`);
            import_process.default.exit(1);
          }
        }
        return opts;
      }
      function run(opts) {
        const project = fs.existsSync(path.join(opts.project, "www")) ? path.join(opts.project, "www") : opts.project;
        if (!fs.existsSync(path.join(project, "data"))) {
          throw new Error(`No data/ folder under: ${opts.project}`);
        }
        if (fs.existsSync(opts.out)) {
          if (!opts.force) {
            throw new Error(`Output exists: ${opts.out} (pass --force).`);
          }
          rmrf(opts.out);
        }
        const canon = canonicalSet();
        const files = walk(project);
        let hashed = 0;
        let encd = 0;
        const cldInfo = loadCLD(path.join(project, "data"));
        const cldRel = cldInfo ? "data/" + cldInfo.rel : null;
        const ub = cldInfo ? createUnbaker(cldInfo.cld) : null;
        const unbakeStats = ub ? ub.stats : null;
        const unbaked = /* @__PURE__ */ new Map();
        for (const rel of files) {
          if (rel === cldRel || !/^data\/.+\.json$/i.test(rel)) continue;
          let obj;
          try {
            obj = JSON.parse(fs.readFileSync(path.join(project, rel), "utf8"));
          } catch (e) {
            continue;
          }
          unbakeMapBackground(obj);
          unbakeAssetNames(obj);
          if (ub) ub.unbakeDoc(obj);
          unbaked.set(rel, import_buffer.Buffer.from(JSON.stringify(obj)));
        }
        for (const rel of files) {
          if (rel === "Game.rpgproject") continue;
          let buf;
          if (cldInfo && rel === cldRel) {
            buf = serializeCLD(cldInfo.header, cldInfo.cld);
          } else if (unbaked.has(rel)) {
            buf = unbaked.get(rel);
          } else {
            buf = fs.readFileSync(path.join(project, rel));
          }
          const t = targetFor(rel, canon);
          if (t.hashed !== rel) hashed++;
          const outBuf = t.encrypt ? (encd++, encrypt(buf, t.hashed)) : buf;
          writeOut(opts.out, t.hashed, outBuf);
        }
        if (unbakeStats && (unbakeStats.mintedLines || unbakeStats.mintedLabels)) {
          console.log(
            `Un-baked dialogue: ${unbakeStats.restored} restored to original keys, ${unbakeStats.mintedLines} new line + ${unbakeStats.mintedLabels} new label keys minted.`
          );
        }
        console.log(
          `Packed ${files.length} files: ${hashed} re-hashed, ${encd} encrypted -> ${opts.out}`
        );
        console.log(`Play it with: node server.js ${opts.out}`);
      }
      module.exports = { run, parseArgs };
      if (__require.main === module) {
        try {
          run(parseArgs(import_process.default.argv.slice(2)));
        } catch (e) {
          console.error(e && e.message ? e.message : e);
          import_process.default.exit(1);
        }
      }
    }
  });

  // tools/share-project.js
  var require_share_project = __commonJS({
    "tools/share-project.js"(exports, module) {
      "use strict";
      init_shim();
      var fs = require_fs_browser();
      var os = require_browser();
      var path = require_path_browserify();
      var zlib = require_zlib_browser();
      var crypto = require_crypto_browser();
      var { walk, applyJsonPatch } = require_build_tomb_mod();
      var extractProject = require_extract_project();
      var packProjectTool = require_pack_project();
      var FORMAT = "tcoaal-share/2";
      var ROLLBACK_NAME = ".tcoaalmod-rollback.zip";
      function deepEqual(a, b) {
        if (a === b) return true;
        if (a === null || b === null || typeof a !== "object" || typeof b !== "object") {
          return false;
        }
        const aArr = Array.isArray(a);
        if (aArr !== Array.isArray(b)) return false;
        if (aArr) {
          if (a.length !== b.length) return false;
          for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
          return true;
        }
        const ak = Object.keys(a);
        const bk = Object.keys(b);
        if (ak.length !== bk.length) return false;
        for (const k of ak) {
          if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
          if (!deepEqual(a[k], b[k])) return false;
        }
        return true;
      }
      function ptrEscape(key) {
        return String(key).replace(/~/g, "~0").replace(/\//g, "~1");
      }
      function diffJson(a, b, ptr, ops) {
        if (deepEqual(a, b)) return;
        const aObj = a && typeof a === "object";
        const bObj = b && typeof b === "object";
        if (!aObj || !bObj || Array.isArray(a) !== Array.isArray(b)) {
          ops.push({ op: "replace", path: ptr, value: b });
          return;
        }
        if (Array.isArray(a)) {
          if (a.length !== b.length) {
            ops.push({ op: "replace", path: ptr, value: b });
            return;
          }
          for (let i = 0; i < a.length; i++) diffJson(a[i], b[i], ptr + "/" + i, ops);
          return;
        }
        for (const k of Object.keys(a)) {
          if (!(k in b)) ops.push({ op: "remove", path: ptr + "/" + ptrEscape(k) });
        }
        for (const k of Object.keys(b)) {
          if (!(k in a)) {
            ops.push({ op: "add", path: ptr + "/" + ptrEscape(k), value: b[k] });
          } else {
            diffJson(a[k], b[k], ptr + "/" + ptrEscape(k), ops);
          }
        }
      }
      var _crcTable = null;
      function crc32(buf) {
        if (zlib.crc32) return zlib.crc32(buf) >>> 0;
        if (!_crcTable) {
          _crcTable = new Int32Array(256);
          for (let n = 0; n < 256; n++) {
            let c2 = n;
            for (let k = 0; k < 8; k++) c2 = c2 & 1 ? 3988292384 ^ c2 >>> 1 : c2 >>> 1;
            _crcTable[n] = c2;
          }
        }
        let c = -1;
        for (let i = 0; i < buf.length; i++) c = _crcTable[(c ^ buf[i]) & 255] ^ c >>> 8;
        return (c ^ -1) >>> 0;
      }
      function zipWrite(entries, outPath) {
        const parts = [];
        const central = [];
        let offset = 0;
        for (const e of entries) {
          const nameBuf = import_buffer.Buffer.from(e.name, "utf8");
          const crc = crc32(e.data) >>> 0;
          const comp = zlib.deflateRawSync(e.data);
          const store = comp.length >= e.data.length;
          const method = store ? 0 : 8;
          const body = store ? e.data : comp;
          const lh = import_buffer.Buffer.alloc(30);
          lh.writeUInt32LE(67324752, 0);
          lh.writeUInt16LE(20, 4);
          lh.writeUInt16LE(0, 6);
          lh.writeUInt16LE(method, 8);
          lh.writeUInt16LE(0, 10);
          lh.writeUInt16LE(0, 12);
          lh.writeUInt32LE(crc, 14);
          lh.writeUInt32LE(body.length, 18);
          lh.writeUInt32LE(e.data.length, 22);
          lh.writeUInt16LE(nameBuf.length, 26);
          lh.writeUInt16LE(0, 28);
          parts.push(lh, nameBuf, body);
          const cd = import_buffer.Buffer.alloc(46);
          cd.writeUInt32LE(33639248, 0);
          cd.writeUInt16LE(20, 4);
          cd.writeUInt16LE(20, 6);
          cd.writeUInt16LE(0, 8);
          cd.writeUInt16LE(method, 10);
          cd.writeUInt16LE(0, 12);
          cd.writeUInt16LE(0, 14);
          cd.writeUInt32LE(crc, 16);
          cd.writeUInt32LE(body.length, 20);
          cd.writeUInt32LE(e.data.length, 24);
          cd.writeUInt16LE(nameBuf.length, 28);
          cd.writeUInt16LE(0, 30);
          cd.writeUInt16LE(0, 32);
          cd.writeUInt16LE(0, 34);
          cd.writeUInt16LE(0, 36);
          cd.writeUInt32LE(0, 38);
          cd.writeUInt32LE(offset, 42);
          central.push(cd, nameBuf);
          offset += lh.length + nameBuf.length + body.length;
        }
        const cdStart = offset;
        const cdSize = central.reduce((n, b) => n + b.length, 0);
        const eocd = import_buffer.Buffer.alloc(22);
        eocd.writeUInt32LE(101010256, 0);
        eocd.writeUInt16LE(0, 4);
        eocd.writeUInt16LE(0, 6);
        eocd.writeUInt16LE(entries.length, 8);
        eocd.writeUInt16LE(entries.length, 10);
        eocd.writeUInt32LE(cdSize, 12);
        eocd.writeUInt32LE(cdStart, 16);
        eocd.writeUInt16LE(0, 20);
        fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
        fs.writeFileSync(outPath, import_buffer.Buffer.concat([...parts, ...central, eocd]));
      }
      function zipRead(buf) {
        const map = /* @__PURE__ */ new Map();
        let p = buf.length - 22;
        while (p >= 0 && buf.readUInt32LE(p) !== 101010256) p--;
        if (p < 0) throw new Error("not a ZIP (no end-of-directory record)");
        const count = buf.readUInt16LE(p + 10);
        let cd = buf.readUInt32LE(p + 16);
        for (let i = 0; i < count; i++) {
          if (buf.readUInt32LE(cd) !== 33639248) throw new Error("corrupt ZIP central directory");
          const method = buf.readUInt16LE(cd + 10);
          const compSize = buf.readUInt32LE(cd + 20);
          const nameLen = buf.readUInt16LE(cd + 28);
          const extraLen = buf.readUInt16LE(cd + 30);
          const commentLen = buf.readUInt16LE(cd + 32);
          const lho = buf.readUInt32LE(cd + 42);
          const name = buf.toString("utf8", cd + 46, cd + 46 + nameLen);
          const lNameLen = buf.readUInt16LE(lho + 26);
          const lExtraLen = buf.readUInt16LE(lho + 28);
          const dataStart = lho + 30 + lNameLen + lExtraLen;
          const raw = buf.subarray(dataStart, dataStart + compSize);
          map.set(name, method === 0 ? import_buffer.Buffer.from(raw) : zlib.inflateRawSync(raw));
          cd += 46 + nameLen + extraLen + commentLen;
        }
        return map;
      }
      function rmrf(target) {
        if (!fs.existsSync(target)) return;
        if (fs.statSync(target).isDirectory()) {
          for (const e of fs.readdirSync(target)) rmrf(path.join(target, e));
          fs.rmdirSync(target);
        } else {
          fs.unlinkSync(target);
        }
      }
      function copyDir(src, dst) {
        for (const rel of walk(src)) {
          const out = path.join(dst, rel);
          fs.mkdirSync(path.dirname(out), { recursive: true });
          fs.copyFileSync(path.join(src, rel), out);
        }
      }
      async function extractBaseline(baseWww, outDir, extractArgs) {
        const opts = extractProject.parseArgs(extractArgs || []);
        opts.www = baseWww;
        opts.out = outDir;
        opts.force = true;
        await extractProject.run(opts);
      }
      function packProject(projectDir, outWww) {
        packProjectTool.run({ project: projectDir, out: outWww, force: true });
      }
      function resolveWww(input) {
        if (fs.existsSync(path.join(input, "www", "data"))) return path.join(input, "www");
        return input;
      }
      function readSteamMeta(baseInput, baseWww) {
        const candidates = [
          path.join(baseInput, "steam.json"),
          path.join(path.dirname(baseWww), "steam.json")
        ];
        for (const p of candidates) {
          try {
            if (fs.existsSync(p)) {
              const o = JSON.parse(fs.readFileSync(p, "utf8"));
              if (o && o.manifest) {
                return {
                  appid: String(o.appid || ""),
                  depot: String(o.depot || ""),
                  manifest: String(o.manifest),
                  name: String(o.name || o.version || ""),
                  buildid: String(o.buildid || ""),
                  date: String(o.date || "")
                };
              }
            }
          } catch (e) {
          }
        }
        return null;
      }
      function sha256hex(buf) {
        return crypto.createHash("sha256").update(buf).digest("hex");
      }
      function fingerprintProject(projDir) {
        const data = walk(projDir).filter((rel) => DATA_JSON.test(rel)).sort();
        const h = crypto.createHash("sha256");
        for (const rel of data) {
          h.update(rel);
          h.update(fs.readFileSync(path.join(projDir, rel)));
        }
        return { hash: h.digest("hex"), fileCount: data.length };
      }
      var DATA_JSON = /^data\/.+\.json$/i;
      async function build(opts) {
        const editedProject = fs.existsSync(path.join(opts.project, "www")) ? path.join(opts.project, "www") : opts.project;
        if (!fs.existsSync(path.join(editedProject, "data"))) {
          fail(`Edited project not found (no data/ under ${opts.project}).`);
        }
        if (fs.existsSync(opts.out) && !opts.force) {
          fail(`Output exists: ${opts.out} (pass --force).`);
        }
        const editFiles = new Set(walk(editedProject));
        const payloads = /* @__PURE__ */ new Map();
        const variants = [];
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tcoaal-share-"));
        try {
          for (const baseInput of opts.bases) {
            const baseWww = resolveWww(baseInput);
            if (!fs.existsSync(path.join(baseWww, "data"))) {
              fail(`Base game www not found (no data/ under ${baseInput}).`);
            }
            const label = path.basename(path.resolve(baseInput));
            import_process.default.stdout.write(`Extracting pristine baseline for "${label}"...
`);
            const baseline = path.join(tmp, "base-" + variants.length);
            await extractBaseline(baseWww, baseline, opts.extractArgs);
            const fp = fingerprintProject(baseline);
            const { files, stats } = diffProjects(baseline, editedProject, editFiles, payloads);
            if (!files.length) {
              fail(`Base "${label}" is identical to the edited project (no changes).`);
            }
            const steam = readSteamMeta(baseInput, baseWww);
            const baseMeta = { ...fp, label, extractArgs: opts.extractArgs };
            if (steam) baseMeta.steam = steam;
            variants.push({
              base: baseMeta,
              files,
              stats
            });
            import_process.default.stdout.write(
              `  ${stats.patched} data patch${stats.patched === 1 ? "" : "es"}, ${stats.added} added, ${stats.replaced} replaced, ${stats.deleted} deleted (${stats.unchanged} unchanged base files excluded).
`
            );
            rmrf(baseline);
          }
          const manifest = {
            format: FORMAT,
            name: opts.name || "Untitled mod",
            author: opts.author || "",
            version: opts.version || "1.0.0",
            description: opts.description || "",
            created: (/* @__PURE__ */ new Date()).toISOString(),
            tool: "share-project.js",
            variants
          };
          const entries = [
            { name: "mod.json", data: import_buffer.Buffer.from(JSON.stringify(manifest, null, 2)) },
            ...[...payloads.values()],
            { name: "README.txt", data: import_buffer.Buffer.from(readme(manifest)) }
          ];
          zipWrite(entries, opts.out);
          const bytes = fs.statSync(opts.out).size;
          import_process.default.stdout.write(
            `
Wrote ${opts.out} (${human(bytes)})  -  ${variants.length} base variant${variants.length === 1 ? "" : "s"}, ${payloads.size} payload${payloads.size === 1 ? "" : "s"}.

Share this single file. Players with the base game apply it with:
  node tools/share-project.js --apply ${path.basename(opts.out)} --base <gameFolder>
(or import it directly in the BrowserPlayer's loader).
`
          );
        } finally {
          rmrf(tmp);
        }
      }
      function diffProjects(baseline, editedProject, editFiles, payloads) {
        const baseFiles = new Set(walk(baseline));
        const all = /* @__PURE__ */ new Set([...baseFiles, ...editFiles]);
        const files = [];
        const stats = { patched: 0, added: 0, replaced: 0, deleted: 0, unchanged: 0 };
        const addPayload = (rel, buf) => {
          const h = sha256hex(buf).slice(0, 16);
          const name = "f/" + h;
          if (!payloads.has(h)) payloads.set(h, { name, data: buf });
          files.push({ rel, type: "verbatim", payload: name });
        };
        for (const rel of [...all].sort()) {
          const inBase = baseFiles.has(rel);
          const inEdit = editFiles.has(rel);
          if (inBase && !inEdit) {
            files.push({ rel, type: "delete" });
            stats.deleted++;
            continue;
          }
          const editBuf = fs.readFileSync(path.join(editedProject, rel));
          if (!inBase) {
            addPayload(rel, editBuf);
            stats.added++;
            continue;
          }
          const baseBuf = fs.readFileSync(path.join(baseline, rel));
          if (baseBuf.equals(editBuf)) {
            stats.unchanged++;
            continue;
          }
          if (DATA_JSON.test(rel)) {
            const ops = tryJsonPatch(baseBuf, editBuf);
            if (ops) {
              files.push({ rel, type: "jsonpatch", ops });
              stats.patched++;
              continue;
            }
          }
          addPayload(rel, editBuf);
          stats.replaced++;
        }
        return { files, stats };
      }
      function tryJsonPatch(baseBuf, editBuf) {
        let a;
        let b;
        try {
          a = JSON.parse(baseBuf.toString("utf8"));
          b = JSON.parse(editBuf.toString("utf8"));
        } catch (e) {
          return null;
        }
        const ops = [];
        diffJson(a, b, "", ops);
        return ops;
      }
      async function apply(opts) {
        const baseInput = opts.base;
        const baseWww = resolveWww(baseInput);
        if (!fs.existsSync(path.join(baseWww, "data"))) {
          fail(`Base game www not found (no data/ under ${baseInput}).`);
        }
        if (!fs.existsSync(opts.modFile)) fail(`Mod file not found: ${opts.modFile}`);
        const inPlace = !opts.out || path.resolve(opts.out) === path.resolve(baseInput) || path.resolve(opts.out) === path.resolve(baseWww);
        const outWww = inPlace ? baseWww : opts.out;
        if (!inPlace && fs.existsSync(outWww)) {
          if (!opts.force) fail(`Output exists: ${outWww} (pass --force).`);
          rmrf(outWww);
        }
        if (inPlace && fs.existsSync(path.join(gameRootOf(baseWww), ROLLBACK_NAME))) {
          fail(
            `A mod is already applied here (found ${ROLLBACK_NAME}). Roll it back first:
  node tools/share-project.js --rollback ${baseInput}`
          );
        }
        const zip = zipRead(fs.readFileSync(opts.modFile));
        const manifest = readManifest(zip);
        import_process.default.stdout.write(
          `Applying "${manifest.name}"${manifest.author ? " by " + manifest.author : ""} v${manifest.version}
`
        );
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tcoaal-apply-"));
        try {
          const baseline = path.join(tmp, "baseline");
          const { variant, fp } = await selectVariant(manifest, baseWww, baseline, opts);
          const recon = path.join(tmp, "recon");
          copyDir(baseline, recon);
          applyVariant(variant, recon, zip);
          const modPacked = path.join(tmp, "mod-www");
          import_process.default.stdout.write("Re-packing the modded game...\n");
          packProject(recon, modPacked);
          if (!inPlace) {
            copyDir(modPacked, outWww);
            import_process.default.stdout.write(
              `
Done. Wrote a complete modded game to: ${outWww}
Import that folder in the BrowserPlayer loader, or run it with your game runtime.
`
            );
            return;
          }
          const basePacked = path.join(tmp, "base-www");
          packProject(baseline, basePacked);
          overlayInPlace(basePacked, modPacked, baseWww, manifest);
          import_process.default.stdout.write(
            `
Done  -  mod applied in place to: ${baseWww}
Launch the game the usual way (e.g. through Steam).
To undo:
  node tools/share-project.js --rollback ${baseInput}
`
          );
        } finally {
          rmrf(tmp);
        }
      }
      function readManifest(zip) {
        const manifestBuf = zip.get("mod.json");
        if (!manifestBuf) fail("Invalid mod file: missing mod.json.");
        const manifest = JSON.parse(manifestBuf.toString("utf8"));
        if (!manifest.format || !manifest.format.startsWith("tcoaal-share/")) {
          fail(`Unrecognized mod format: ${manifest.format}`);
        }
        if (!Array.isArray(manifest.variants) || !manifest.variants.length) {
          fail("Invalid mod file: no base variants.");
        }
        return manifest;
      }
      async function selectVariant(manifest, baseWww, outDir, opts) {
        const groups = /* @__PURE__ */ new Map();
        for (const v of manifest.variants) {
          const key = JSON.stringify(v.base.extractArgs || []);
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(v);
        }
        const extra = opts.forceExtractArgs || [];
        let lastFp = null;
        for (const [key, vs] of groups) {
          const args = JSON.parse(key).concat(extra);
          import_process.default.stdout.write("Extracting your base game...\n");
          rmrf(outDir);
          await extractBaseline(baseWww, outDir, args);
          const fp = fingerprintProject(outDir);
          lastFp = fp;
          const match = vs.find((v) => v.base.hash === fp.hash);
          if (match) return { variant: match, fp };
        }
        if (opts.ignoreMismatch) {
          const v = manifest.variants[0];
          import_process.default.stderr.write(
            `WARNING: no base variant matched your game; forcing variant "${v.base.label}".
`
          );
          rmrf(outDir);
          await extractBaseline(baseWww, outDir, (v.base.extractArgs || []).concat(extra));
          return { variant: v, fp: fingerprintProject(outDir) };
        }
        const labels = manifest.variants.map((v) => `  - ${v.base.label} (${v.base.hash.slice(0, 16)}, ${v.base.fileCount} files)`).join("\n");
        fail(
          `Your base game does not match any version this mod was built for.
Your game fingerprint: ${lastFp ? lastFp.hash.slice(0, 16) : "?"}
Mod supports:
${labels}
Use the matching game version, or re-run with --ignore-base-mismatch to force.`
        );
      }
      function applyVariant(variant, projectDir, zip) {
        for (const f of variant.files) {
          const abs = path.join(projectDir, f.rel);
          if (f.type === "delete") {
            if (fs.existsSync(abs)) fs.unlinkSync(abs);
          } else if (f.type === "jsonpatch") {
            if (!fs.existsSync(abs)) {
              fail(`Patch targets ${f.rel}, which is missing from your base game.`);
            }
            let doc = JSON.parse(fs.readFileSync(abs, "utf8"));
            doc = applyJsonPatch(doc, f.ops);
            fs.writeFileSync(abs, JSON.stringify(doc));
          } else if (f.type === "verbatim") {
            const data = zip.get(f.payload);
            if (!data) fail(`Mod file is missing payload ${f.payload} for ${f.rel}.`);
            fs.mkdirSync(path.dirname(abs), { recursive: true });
            fs.writeFileSync(abs, data);
          } else {
            fail(`Unknown file entry type: ${f.type}`);
          }
        }
      }
      function overlayInPlace(basePacked, modPacked, liveWww, manifest) {
        const baseSet = new Set(walk(basePacked));
        const modSet = new Set(walk(modPacked));
        const all = /* @__PURE__ */ new Set([...baseSet, ...modSet]);
        const backup = [];
        const overwritten = [];
        const created = [];
        const deleted = [];
        let bi = 0;
        const backupLive = (rel, list) => {
          const live = path.join(liveWww, rel);
          if (fs.existsSync(live)) {
            const name = "b/" + bi++;
            backup.push({ name, data: fs.readFileSync(live) });
            list.push({ rel, payload: name });
            return true;
          }
          return false;
        };
        for (const rel of all) {
          const inBase = baseSet.has(rel);
          const inMod = modSet.has(rel);
          const live = path.join(liveWww, rel);
          if (inMod && !inBase) {
            if (!backupLive(rel, overwritten)) created.push(rel);
            writeFileEnsured(live, fs.readFileSync(path.join(modPacked, rel)));
          } else if (!inMod && inBase) {
            if (backupLive(rel, deleted) && fs.existsSync(live)) fs.unlinkSync(live);
          } else {
            const modBytes = fs.readFileSync(path.join(modPacked, rel));
            const baseBytes = fs.readFileSync(path.join(basePacked, rel));
            if (modBytes.equals(baseBytes)) continue;
            if (!backupLive(rel, overwritten)) created.push(rel);
            writeFileEnsured(live, modBytes);
          }
        }
        const rollback2 = {
          format: "tcoaal-rollback/1",
          mod: { name: manifest.name, version: manifest.version },
          appliedAt: (/* @__PURE__ */ new Date()).toISOString(),
          created,
          overwritten,
          deleted
        };
        const entries = [
          { name: "rollback.json", data: import_buffer.Buffer.from(JSON.stringify(rollback2, null, 2)) },
          ...backup
        ];
        zipWrite(entries, path.join(gameRootOf(liveWww), ROLLBACK_NAME));
        import_process.default.stdout.write(
          `  overlaid ${overwritten.length} changed, ${created.length} new, ${deleted.length} removed file(s).
`
        );
      }
      function writeFileEnsured(abs, data) {
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, data);
      }
      function gameRootOf(www) {
        const parent = path.dirname(path.resolve(www));
        if (path.basename(path.resolve(www)) === "www") return parent;
        return path.resolve(www);
      }
      function rollback(opts) {
        const baseWww = resolveWww(opts.target);
        const root = gameRootOf(baseWww);
        const rbPath = path.join(root, ROLLBACK_NAME);
        if (!fs.existsSync(rbPath)) {
          fail(`No mod to roll back (no ${ROLLBACK_NAME} in ${root}).`);
        }
        const zip = zipRead(fs.readFileSync(rbPath));
        const meta = JSON.parse(zip.get("rollback.json").toString("utf8"));
        import_process.default.stdout.write(
          `Rolling back "${meta.mod.name}" v${meta.mod.version} from ${baseWww}
`
        );
        for (const rel of meta.created || []) {
          const abs = path.join(baseWww, rel);
          if (fs.existsSync(abs)) fs.unlinkSync(abs);
        }
        for (const e of [...meta.overwritten || [], ...meta.deleted || []]) {
          const data = zip.get(e.payload);
          if (!data) fail(`Rollback archive is missing payload ${e.payload} for ${e.rel}.`);
          writeFileEnsured(path.join(baseWww, e.rel), data);
        }
        fs.unlinkSync(rbPath);
        import_process.default.stdout.write(
          `Restored ${(meta.overwritten || []).length} overwritten, ${(meta.deleted || []).length} removed, deleted ${(meta.created || []).length} added file(s).
The game is back to its pre-mod state.
`
        );
      }
      function human(bytes) {
        const u = ["B", "KB", "MB", "GB"];
        let n = bytes;
        let i = 0;
        while (n >= 1024 && i < u.length - 1) {
          n /= 1024;
          i++;
        }
        return `${n.toFixed(n < 10 && i ? 1 : 0)} ${u[i]}`;
      }
      function readme(manifest) {
        return `${manifest.name} v${manifest.version}` + (manifest.author ? ` by ${manifest.author}` : "") + `
${manifest.description ? manifest.description + "\n" : ""}
This is a TCOAAL mod distributed as a DIFF. It contains only the changes
the author made; it includes none of the game's copyrighted content. You
need your own legally owned copy of the base game to play it.

Supported base versions: ` + manifest.variants.map((v) => v.base.label).join(", ") + `

To apply (any platform; needs Node.js + the BrowserPlayer tools):

  # In place over your game (then launch it normally / via Steam):
  node tools/share-project.js --apply <this-file> --base <GameFolder> --out <GameFolder>

  # ...or build a standalone modded copy:
  node tools/share-project.js --apply <this-file> --base <GameFolder> --out modded-www

  # Undo an in-place apply:
  node tools/share-project.js --rollback <GameFolder>

Easiest of all: import this .tcoaalmod directly in the BrowserPlayer loader.
`;
      }
      function fail(msg) {
        throw new Error(msg);
      }
      function parseArgs(argv) {
        const opts = {
          mode: "build",
          project: null,
          bases: [],
          out: null,
          name: null,
          author: null,
          version: null,
          description: null,
          extractArgs: [],
          force: false,
          ignoreMismatch: false
        };
        for (let i = 0; i < argv.length; i++) {
          const a = argv[i];
          if (a === "--apply") {
            opts.mode = "apply";
            opts.modFile = argv[++i];
          } else if (a === "--info") {
            opts.mode = "info";
            opts.modFile = argv[++i];
          } else if (a === "--rollback") {
            opts.mode = "rollback";
            opts.target = argv[++i];
          } else if (a === "--project" || a === "-p") opts.project = argv[++i];
          else if (a === "--base" || a === "-b") {
            const v = argv[++i];
            opts.bases.push(v);
            opts.base = v;
          } else if (a === "--out" || a === "-o") opts.out = argv[++i];
          else if (a === "--name") opts.name = argv[++i];
          else if (a === "--author") opts.author = argv[++i];
          else if (a === "--version") opts.version = argv[++i];
          else if (a === "--description") opts.description = argv[++i];
          else if (a === "--extract-args") opts.extractArgs = splitArgs(argv[++i]);
          else if (a === "--force" || a === "-f") opts.force = true;
          else if (a === "--ignore-base-mismatch") opts.ignoreMismatch = true;
          else if (a === "--help" || a === "-h") {
            printHelp();
            import_process.default.exit(0);
          } else fail(`Unknown argument: ${a}`);
        }
        return opts;
      }
      function splitArgs(s) {
        if (!s) return [];
        return s.trim().split(/\s+/).filter(Boolean);
      }
      function printHelp() {
        import_process.default.stdout.write(
          `Package an edited RPG Maker MV project as a copyright-safe diff (the mod),
apply it onto a base game (optionally in place), and roll it back.

Build a shareable mod (one or more base versions):
  node tools/share-project.js --project <editedProject> \\
       --base <gameA> [--base <gameB> ...] --out mymod.tcoaalmod \\
       [--name N] [--author A] [--version V] [--description D]

Apply a mod:
  # in place over a game folder (launch it normally / via Steam afterwards):
  node tools/share-project.js --apply mymod.tcoaalmod --base <GameFolder> --out <GameFolder>
  # or build a standalone modded copy:
  node tools/share-project.js --apply mymod.tcoaalmod --base <GameFolder> --out modded-www

Roll back an in-place apply:
  node tools/share-project.js --rollback <GameFolder>

Options:
  -p, --project <dir>    The edited project (from extract-project.js).
  -b, --base <dir>       A base game folder (or its www). Repeat for variants.
  -o, --out <path>       .tcoaalmod (build); www/game dir (apply). Apply is
                         in place when --out equals --base (or omitted).
      --name/--author/--version/--description   Mod metadata (build).
      --extract-args "<flags>"   Extract flags used originally, e.g. "--no-bake".
      --ignore-base-mismatch     Apply even if no base variant matches.
  -f, --force            Overwrite the output if it exists.
`
        );
      }
      function modInfo(modFile) {
        const zip = zipRead(fs.readFileSync(modFile));
        const m = readManifest(zip);
        return {
          format: m.format,
          name: m.name,
          author: m.author || "",
          version: m.version || "",
          description: m.description || "",
          created: m.created || "",
          variants: (m.variants || []).map((v) => ({
            label: v.base.label,
            hash: v.base.hash,
            fileCount: v.base.fileCount,
            steam: v.base.steam || null
          }))
        };
      }
      async function main() {
        const opts = parseArgs(import_process.default.argv.slice(2));
        if (opts.mode === "apply") {
          if (!opts.base) fail("--apply requires --base <gameFolder>.");
          await apply(opts);
        } else if (opts.mode === "info") {
          if (!opts.modFile) fail("--info requires a <mod.tcoaalmod>.");
          import_process.default.stdout.write(JSON.stringify(modInfo(opts.modFile)) + "\n");
        } else if (opts.mode === "rollback") {
          if (!opts.target) fail("--rollback requires a <gameFolder>.");
          rollback(opts);
        } else {
          if (!opts.project) fail("--project <editedProject> is required.");
          if (!opts.bases.length) fail("at least one --base <gameFolder> is required.");
          if (!opts.out) opts.out = "mod.tcoaalmod";
          await build(opts);
        }
      }
      module.exports = {
        build,
        apply,
        rollback,
        modInfo,
        extractBaseline,
        packProject,
        diffProjects,
        applyVariant,
        selectVariant,
        fingerprintProject,
        readManifest,
        zipRead,
        zipWrite,
        diffJson,
        copyDir,
        rmrf,
        resolveWww
      };
      if (__require.main === module) {
        main().catch((e) => {
          import_process.default.stderr.write("error: " + (e && e.message ? e.message : e) + "\n");
          import_process.default.exit(1);
        });
      }
    }
  });

  // tools/mod-runtime.js
  var require_mod_runtime = __commonJS({
    "tools/mod-runtime.js"(exports, module) {
      init_shim();
      var { vol } = require_lib8();
      var crypto = require_crypto_browser();
      var share = require_share_project();
      var { walk, hashPath, dekit } = require_build_tomb_mod();
      function ensureStdio() {
        if (!import_process.default.stdout || typeof import_process.default.stdout.write !== "function") {
          import_process.default.stdout = { write: (s) => (console.log(String(s).replace(/\n$/, "")), true) };
        }
        if (!import_process.default.stderr || typeof import_process.default.stderr.write !== "function") {
          import_process.default.stderr = { write: (s) => (console.warn(String(s).replace(/\n$/, "")), true) };
        }
      }
      function writeMem(absPath, bytes) {
        const path = require_path_browserify();
        vol.mkdirSync(path.dirname(absPath), { recursive: true });
        vol.writeFileSync(absPath, import_buffer.Buffer.from(bytes));
      }
      function ensureTmpDir() {
        const os = require_browser();
        try {
          vol.mkdirSync(os.tmpdir(), { recursive: true });
        } catch (e) {
        }
      }
      function contentTag(files) {
        const h = crypto.createHash("sha256");
        for (const rel of Object.keys(files).sort()) {
          h.update(rel);
          h.update(import_buffer.Buffer.from(files[rel]));
        }
        return BigInt("0x" + h.digest("hex").slice(0, 16)).toString(36).slice(0, 10);
      }
      async function applyTcoaalmod(baseFiles, modBytes) {
        ensureStdio();
        vol.reset();
        for (const rel of Object.keys(baseFiles)) {
          writeMem("/base/www/" + rel, baseFiles[rel]);
        }
        const zip = share.zipRead(import_buffer.Buffer.from(modBytes));
        const manifest = share.readManifest(zip);
        const sel = await share.selectVariant(manifest, "/base/www", "/baseline", {
          forceExtractArgs: ["--not-playable"]
        });
        share.copyDir("/baseline", "/recon");
        share.applyVariant(sel.variant, "/recon", zip);
        share.packProject("/recon", "/modPacked");
        share.packProject("/baseline", "/basePacked");
        const baseSet = new Set(walk("/basePacked"));
        const modSet = new Set(walk("/modPacked"));
        const files = {};
        const deletions = [];
        const path = require_path_browserify();
        for (const rel of /* @__PURE__ */ new Set([...baseSet, ...modSet])) {
          const inBase = baseSet.has(rel);
          const inMod = modSet.has(rel);
          if (inMod && !inBase) {
            files[rel] = new Uint8Array(vol.readFileSync(path.join("/modPacked", rel)));
          } else if (!inMod && inBase) {
            deletions.push(rel);
          } else {
            const m = vol.readFileSync(path.join("/modPacked", rel));
            const b = vol.readFileSync(path.join("/basePacked", rel));
            if (!import_buffer.Buffer.from(m).equals(import_buffer.Buffer.from(b))) files[rel] = new Uint8Array(m);
          }
        }
        vol.reset();
        return {
          tag: contentTag(files),
          name: manifest.name,
          author: manifest.author || "",
          version: manifest.version || "",
          description: manifest.description || "",
          baseLabel: sel.variant.base.label,
          files,
          deletions
        };
      }
      async function buildTomb(baseFiles, modBytes) {
        ensureStdio();
        vol.reset();
        try {
          const path = require_path_browserify();
          for (const rel of Object.keys(baseFiles)) {
            writeMem("/base/www/" + rel, baseFiles[rel]);
          }
          const zip = share.zipRead(import_buffer.Buffer.from(modBytes));
          let modJsonRel = null;
          for (const [name] of zip) {
            if (/(^|\/)mod\.json$/.test(name)) {
              if (modJsonRel === null || name.length < modJsonRel.length) {
                modJsonRel = name;
              }
            }
          }
          if (modJsonRel === null) {
            throw new Error("Not a Tomb mod: no mod.json found in the archive.");
          }
          const diffPrefix = modJsonRel.replace(/mod\.json$/, "");
          for (const [name, data] of zip) {
            if (name.endsWith("/")) continue;
            writeMem("/diff/" + name, data);
          }
          const { build } = require_build_tomb_mod();
          await build({
            diff: ("/diff/" + diffPrefix).replace(/\/+$/, ""),
            base: "/base",
            out: "/out",
            overlays: [],
            thin: false,
            force: false,
            pretty: false
          });
          const outWww = "/out/www";
          const files = {};
          for (const rel of walk(outWww)) {
            files[rel.split(path.sep).join("/")] = new Uint8Array(
              vol.readFileSync(path.join(outWww, rel))
            );
          }
          if (!Object.keys(files).length) {
            throw new Error("Tomb build produced no files.");
          }
          return { tag: contentTag(files), files };
        } finally {
          vol.reset();
        }
      }
      function inspect(modBytes) {
        ensureStdio();
        const zip = share.zipRead(import_buffer.Buffer.from(modBytes));
        const m = share.readManifest(zip);
        return {
          format: m.format,
          name: m.name,
          author: m.author || "",
          version: m.version || "",
          description: m.description || "",
          created: m.created || "",
          variants: (m.variants || []).map((v) => ({
            label: v.base.label,
            hash: v.base.hash,
            fileCount: v.base.fileCount,
            stats: v.stats || null
          }))
        };
      }
      function readZip(bytes) {
        const m = share.zipRead(import_buffer.Buffer.from(bytes));
        const out = {};
        for (const [k, v] of m) out[k] = new Uint8Array(v);
        return out;
      }
      function inspectZip(bytes) {
        const zlib = require_zlib_browser();
        const buf = import_buffer.Buffer.from(bytes);
        let p = buf.length - 22;
        while (p >= 0 && buf.readUInt32LE(p) !== 101010256) p--;
        if (p < 0) throw new Error("not a ZIP (no end-of-directory record)");
        const count = buf.readUInt16LE(p + 10);
        let cd = buf.readUInt32LE(p + 16);
        const names = [];
        const modJsons = {};
        for (let i = 0; i < count; i++) {
          if (buf.readUInt32LE(cd) !== 33639248) {
            throw new Error("corrupt ZIP central directory");
          }
          const method = buf.readUInt16LE(cd + 10);
          const compSize = buf.readUInt32LE(cd + 20);
          const nameLen = buf.readUInt16LE(cd + 28);
          const extraLen = buf.readUInt16LE(cd + 30);
          const commentLen = buf.readUInt16LE(cd + 32);
          const lho = buf.readUInt32LE(cd + 42);
          const name = buf.toString("utf8", cd + 46, cd + 46 + nameLen);
          names.push(name);
          if (/(^|\/)mod\.json$/.test(name)) {
            const lNameLen = buf.readUInt16LE(lho + 26);
            const lExtraLen = buf.readUInt16LE(lho + 28);
            const dataStart = lho + 30 + lNameLen + lExtraLen;
            const raw = buf.subarray(dataStart, dataStart + compSize);
            const data = method === 0 ? import_buffer.Buffer.from(raw) : zlib.inflateRawSync(raw);
            modJsons[name] = new Uint8Array(data);
          }
          cd += 46 + nameLen + extraLen + commentLen;
        }
        return { names, modJsons };
      }
      function titleFromSystemBytes(buf) {
        try {
          const sys = JSON.parse(import_buffer.Buffer.from(buf).toString("utf8"));
          if (sys && sys.sysLabel && sys.sysLabel.Game) return String(sys.sysLabel.Game);
          if (sys && sys.gameTitle) return String(sys.gameTitle);
        } catch (e) {
        }
        return null;
      }
      function readSystemTitle(bytes, prefix) {
        const zlib = require_zlib_browser();
        const buf = import_buffer.Buffer.from(bytes);
        prefix = prefix || "";
        const candidates = [prefix + "data/System.json", prefix + hashPath("data/System.json")];
        let p = buf.length - 22;
        while (p >= 0 && buf.readUInt32LE(p) !== 101010256) p--;
        if (p < 0) return null;
        const count = buf.readUInt16LE(p + 10);
        let cd = buf.readUInt32LE(p + 16);
        for (let i = 0; i < count; i++) {
          if (buf.readUInt32LE(cd) !== 33639248) return null;
          const method = buf.readUInt16LE(cd + 10);
          const compSize = buf.readUInt32LE(cd + 20);
          const nameLen = buf.readUInt16LE(cd + 28);
          const extraLen = buf.readUInt16LE(cd + 30);
          const commentLen = buf.readUInt16LE(cd + 32);
          const lho = buf.readUInt32LE(cd + 42);
          const name = buf.toString("utf8", cd + 46, cd + 46 + nameLen);
          if (candidates.indexOf(name) >= 0) {
            const lNameLen = buf.readUInt16LE(lho + 26);
            const lExtraLen = buf.readUInt16LE(lho + 28);
            const dataStart = lho + 30 + lNameLen + lExtraLen;
            const raw = buf.subarray(dataStart, dataStart + compSize);
            let data = method === 0 ? import_buffer.Buffer.from(raw) : zlib.inflateRawSync(raw);
            data = dekit(data, name);
            return titleFromSystemBytes(data);
          }
          cd += 46 + nameLen + extraLen + commentLen;
        }
        return null;
      }
      function unpackOverlay(bytes, prefix) {
        const all = share.zipRead(import_buffer.Buffer.from(bytes));
        const GAME_DIR = /^(data|img|audio|js|fonts|movies|languages)\//;
        const out = {};
        for (const [name, data] of all) {
          if (name.endsWith("/")) continue;
          if (prefix) {
            if (name.indexOf(prefix) !== 0) continue;
            out[name.slice(prefix.length)] = new Uint8Array(data);
          } else if (GAME_DIR.test(name)) {
            out[name] = new Uint8Array(data);
          }
        }
        return out;
      }
      var EXTRACT_ARGS = ["--not-playable"];
      function mountFiles(baseAbs, files) {
        for (const rel of Object.keys(files)) writeMem(baseAbs + "/" + rel, files[rel]);
      }
      function zipDir(dir) {
        const path = require_path_browserify();
        const entries = walk(dir).map((rel) => ({
          name: rel.split(path.sep).join("/"),
          data: import_buffer.Buffer.from(vol.readFileSync(path.join(dir, rel)))
        }));
        const outPath = "/__zipout.zip";
        share.zipWrite(entries, outPath);
        const bytes = new Uint8Array(vol.readFileSync(outPath));
        vol.unlinkSync(outPath);
        return bytes;
      }
      function safeName(s) {
        return String(s || "base").replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "base";
      }
      async function createProject(srcFiles, opts) {
        ensureStdio();
        vol.reset();
        try {
          mountFiles("/src/www", srcFiles);
          const extractProject = require_extract_project();
          const args = EXTRACT_ARGS.slice();
          if (opts && opts.noBake) args.push("--no-bake");
          const eo = extractProject.parseArgs(args);
          eo.www = "/src/www";
          eo.out = "/project";
          eo.force = true;
          await extractProject.run(eo);
          return zipDir("/project");
        } finally {
          vol.reset();
        }
      }
      async function packProject(projectFiles) {
        ensureStdio();
        vol.reset();
        try {
          mountFiles("/project", projectFiles);
          share.packProject("/project", "/packed");
          return zipDir("/packed");
        } finally {
          vol.reset();
        }
      }
      async function buildShare(projectFiles, bases, meta) {
        ensureStdio();
        vol.reset();
        ensureTmpDir();
        try {
          mountFiles("/project", projectFiles);
          const baseDirs = [];
          const used = /* @__PURE__ */ new Set();
          (bases || []).forEach((b, i) => {
            let name = safeName(b.label || "base" + i);
            while (used.has(name)) name = name + "_" + i;
            used.add(name);
            mountFiles("/bases/" + name + "/www", b.files);
            baseDirs.push("/bases/" + name);
          });
          if (!baseDirs.length) throw new Error("At least one base game is required.");
          meta = meta || {};
          await share.build({
            project: "/project",
            out: "/mod.tcoaalmod",
            bases: baseDirs,
            extractArgs: EXTRACT_ARGS.slice(),
            force: true,
            name: meta.name || "",
            author: meta.author || "",
            version: meta.version || "",
            description: meta.description || ""
          });
          return new Uint8Array(vol.readFileSync("/mod.tcoaalmod"));
        } finally {
          vol.reset();
        }
      }
      module.exports = {
        applyTcoaalmod,
        buildTomb,
        inspect,
        readZip,
        inspectZip,
        readSystemTitle,
        unpackOverlay,
        contentTag,
        createProject,
        packProject,
        buildShare
      };
    }
  });
  return require_mod_runtime();
})();
