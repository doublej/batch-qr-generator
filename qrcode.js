"use strict";
function QRCode(r) {
  var n;
  var t;
  var o;
  var e;
  var a = [];
  var f = [];
  var i = Math.max;
  var u = Math.min;
  var h = Math.abs;
  var v = Math.ceil;
  var c = /^[0-9]*$/;
  var s = /^[A-Z0-9 $%*+.\/:-]*$/;
  var l = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
  var g = [[-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]];
  var d = [[-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25], [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49], [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68], [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]];
  var m = {L: [0, 1], M: [1, 0], Q: [2, 3], H: [3, 2]};
  var p = function (r, n) {
    var t = 0;
    for (var o = 8; o--;) {
      t = t << 1 ^ 285 * (t >>> 7) ^ (n >>> o & 1) * r;
    }
    return t;
  };
  var C = function (r, n) {
    var t = [];
    var o = r.length;
    for (var e = o; e;) {
      var a = r[o - e--] ^ t.shift();
      for (var f = n.length; f--;) {
        t[f] ^= p(n[f], a);
      }
    }
    return t;
  };
  var w = function (r) {
    var n = [function () {
      return (t + o) % 2 == 0;
    }, function () {
      return t % 2 == 0;
    }, function () {
      return o % 3 == 0;
    }, function () {
      return (t + o) % 3 == 0;
    }, function () {
      return ((t / 2 | 0) + (o / 3 | 0)) % 2 == 0;
    }, function () {
      return t * o % 2 + t * o % 3 == 0;
    }, function () {
      return (t * o % 2 + t * o % 3) % 2 == 0;
    }, function () {
      return ((t + o) % 2 + t * o % 3) % 2 == 0;
    }][r];
    for (var t = e; t--;) {
      for (var o = e; o--;) {
        if (!f[t][o]) {
          a[t][o] ^= n();
        }
      }
    }
  };
  var b = function () {
    var r = function (r, n) {
      if (!n[6]) {
        r += e;
      }
      n.shift();
      n.push(r);
    };
    var n = function (n, o, a) {
      if (n) {
        r(o, a);
        o = 0;
      }
      r(o += e, a);
      return t(a);
    };
    var t = function (r) {
      var n = r[5];
      var t = n > 0 && r[4] == n && r[3] == 3 * n && r[2] == n && r[1] == n;
      return (t && r[6] >= 4 * n && r[0] >= n ? 1 : 0) + (t && r[0] >= 4 * n && r[6] >= n ? 1 : 0);
    };
    var o = 0;
    var f = e * e;
    var i = 0;
    for (var u = e; u--;) {
      var c = [0, 0, 0, 0, 0, 0, 0];
      var s = [0, 0, 0, 0, 0, 0, 0];
      var l = false;
      var g = false;
      var d = 0;
      var m = 0;
      for (var p = e; p--;) {
        if (a[u][p] == l) {
          if (++d == 5) {
            o += 3;
          } else if (d > 5) {
            o++;
          }
        } else {
          r(d, c);
          o += 40 * t(c);
          d = 1;
          l = a[u][p];
        }
        if (a[p][u] == g) {
          if (++m == 5) {
            o += 3;
          } else if (m > 5) {
            o++;
          }
        } else {
          r(m, s);
          o += 40 * t(s);
          m = 1;
          g = a[p][u];
        }
        var C = a[u][p];
        if (C) {
          i++;
        }
        if (p && u && C == a[u][p - 1] && C == a[u - 1][p] && C == a[u - 1][p - 1]) {
          o += 3;
        }
      }
      o += 40 * n(l, d, c) + 40 * n(g, m, s);
    }
    return o += 10 * (v(h(20 * i - 10 * f) / f) - 1);
  };
  var A = function (r, n, t) {
    while (n--) {
      t.push(r >>> n & 1);
    }
  };
  var M = function (r, n) {
    return r.numBitsCharCount[(n + 7) / 17 | 0];
  };
  var B = function (r, n) {
    return (r >>> n & 1) != 0;
  };
  var x = function (r, n) {
    var t = 0;
    for (var o = r.length; o--;) {
      var e = r[o];
      var a = M(e, n);
      if (1 << a <= e.numChars) {
        return 1 / 0;
      }
      t += 4 + a + e.bitData.length;
    }
    return t;
  };
  var D = function (r) {
    if (r < 1 || r > 40) {
      throw "Version number out of range";
    }
    var n = (16 * r + 128) * r + 64;
    if (r >= 2) {
      var t = r / 7 | 2;
      n -= (25 * t - 10) * t - 55;
      if (r >= 7) {
        n -= 36;
      }
    }
    return n;
  };
  var I = function (r, n) {
    for (var t = 2; -2 <= t; t--) {
      for (var o = 2; -2 <= o; o--) {
        E(r + o, n + t, i(h(o), h(t)) != 1);
      }
    }
  };
  var H = function (r, n) {
    for (var t = 4; -4 <= t; t--) {
      for (var o = 4; -4 <= o; o--) {
        var a = i(h(o), h(t));
        var f = r + o;
        var u = n + t;
        if (0 <= f && f < e && 0 <= u && u < e) {
          E(f, u, a != 2 && a != 4);
        }
      }
    }
  };
  var $ = function (r) {
    var n = t[1] << 3 | r;
    var o = n;
    for (var a = 10; a--;) {
      o = o << 1 ^ 1335 * (o >>> 9);
    }
    var f = 21522 ^ (n << 10 | o);
    if (f >>> 15 != 0) {
      throw "Assertion error";
    }
    for (a = 0; a <= 5; a++) {
      E(8, a, B(f, a));
    }
    E(8, 7, B(f, 6));
    E(8, 8, B(f, 7));
    E(7, 8, B(f, 8));
    for (a = 9; a < 15; a++) {
      E(14 - a, 8, B(f, a));
    }
    for (a = 0; a < 8; a++) {
      E(e - 1 - a, 8, B(f, a));
    }
    for (a = 8; a < 15; a++) {
      E(8, e - 15 + a, B(f, a));
    }
    E(8, e - 8, 1);
  };
  var O = function () {
    for (var r = e; r--;) {
      E(6, r, r % 2 == 0);
      E(r, 6, r % 2 == 0);
    }
    var t = function () {
      var r = [];
      if (n > 1) {
        var t = 2 + (n / 7 | 0);
        for (var o = n == 32 ? 26 : 2 * v((e - 13) / (2 * t - 2)); t--;) {
          r[t] = t * o + 6;
        }
      }
      return r;
    }();
    for (var o = r = t.length; o--;) {
      for (var a = r; a--;) {
        if ((a != 0 || o != 0) && (a != 0 || o != r - 1) && (a != r - 1 || o != 0)) {
          I(t[a], t[o]);
        }
      }
    }
    H(3, 3);
    H(e - 4, 3);
    H(3, e - 4);
    $(0);
    (function () {
      if (!(7 > n)) {
        var r = n;
        for (var t = 12; t--;) {
          r = r << 1 ^ 7973 * (r >>> 11);
        }
        var o = n << 12 | r;
        t = 18;
        if (o >>> 18 != 0) {
          throw "Assertion error";
        }
        while (t--) {
          var a = e - 11 + t % 3;
          var f = t / 3 | 0;
          var i = B(o, t);
          E(a, f, i);
          E(f, a, i);
        }
      }
    }());
  };
  var Q = function (r) {
    if (r.length != V(n, t)) {
      throw "Invalid argument";
    }
    var o = d[t[0]][n];
    var e = g[t[0]][n];
    var a = D(n) / 8 | 0;
    var f = o - a % o;
    var i = a / o | 0;
    var u = [];
    var h = function (r) {
      var n = 1;
      var t = [];
      t[r - 1] = 1;
      for (var o = 0; o < r; o++) {
        for (var e = 0; e < r; e++) {
          t[e] = p(t[e], n) ^ t[e + 1];
        }
        n = p(n, 2);
      }
      return t;
    }(e);
    var v = 0;
    for (var c = 0; v < o; v++) {
      var s = r.slice(c, c + i - e + (v < f ? 0 : 1));
      c += s.length;
      var l = C(s, h);
      if (v < f) {
        s.push(0);
      }
      u.push(s.concat(l));
    }
    var m = [];
    for (v = 0; v < u[0].length; v++) {
      for (var w = 0; w < u.length; w++) {
        if (v != i - e || w >= f) {
          m.push(u[w][v]);
        }
      }
    }
    return m;
  };
  var S = function (r) {
    var n = [];
    for (var t = (r = encodeURI(r), 0); t < r.length; t++) {
      if (r.charAt(t) == "%") {
        n.push(parseInt(r.substr(t + 1, 2), 16));
        t += 2;
      } else {
        n.push(r.charCodeAt(t));
      }
    }
    return n;
  };
  var V = function (r, n) {
    return (D(r) / 8 | 0) - g[n[0]][r] * d[n[0]][r];
  };
  var E = function (r, n, t) {
    a[n][r] = t ? 1 : 0;
    f[n][r] = 1;
  };
  var R = function (r) {
    var n = [];
    var t = 0;
    for (var o = r; t < o.length; t++) {
      var e = o[t];
      A(e, 8, n);
    }
    return {modeBits: 4, numBitsCharCount: [8, 16, 16], numChars: r.length, bitData: n};
  };
  var Z = function (r) {
    if (!c.test(r)) {
      throw "String contains non-numeric characters";
    }
    var n = [];
    for (var t = 0; t < r.length;) {
      var o = u(r.length - t, 3);
      A(parseInt(r.substr(t, o), 10), 3 * o + 1, n);
      t += o;
    }
    return {modeBits: 1, numBitsCharCount: [10, 12, 14], numChars: r.length, bitData: n};
  };
  var z = function (r) {
    if (!s.test(r)) {
      throw "String contains unencodable characters in alphanumeric mode";
    }
    var t = [];
    for (var n = 0; n + 2 <= r.length; n += 2) {
      var o = 45 * l.indexOf(r.charAt(n));
      o += l.indexOf(r.charAt(n + 1));
      A(o, 11, t);
    }
    if (n < r.length) {
      A(l.indexOf(r.charAt(n)), 6, t);
    }
    return {modeBits: 2, numBitsCharCount: [9, 11, 13], numChars: r.length, bitData: t};
  };
  var L = function (r, n, t, o) {
    var e = function (r) {
      if (r == "") {
        return [];
      } else if (c.test(r)) {
        return [Z(r)];
      } else if (s.test(r)) {
        return [z(r)];
      } else {
        return [R(S(r))];
      }
    }(r);
    return U(e, n, t, o);
  };
  var N = function (r, i, u, h) {
    t = i;
    o = h;
    for (var v = e = 4 * (n = r) + 17; v--;) {
      a[v] = [];
      f[v] = [];
    }
    O();
    (function (r) {
      var n = 0;
      var t = 1;
      var o = e - 1;
      for (var i = o; i > 0; i -= 2) {
        if (i == 6) {
          --i;
        }
        var u = 0 > (t = -t) ? o : 0;
        for (var h = 0; h < e; ++h) {
          for (var v = i; v > i - 2; --v) {
            if (!f[u][v]) {
              a[u][v] = B(r[n >>> 3], 7 - (7 & n));
              ++n;
            }
          }
          u += t;
        }
      }
    }(Q(u)));
    if (0 > o) {
      var c = 1e9;
      for (v = 8; v--;) {
        w(v);
        $(v);
        var s = b();
        if (c > s) {
          c = s;
          o = v;
        }
        w(v);
      }
    }
    w(o);
    $(o);
    f = [];
  };
  var U = function (r, n, t, o, e, a) {
    if (e === void 0) {
      e = 1;
    }
    if (a === void 0) {
      a = 40;
    }
    if (o === void 0) {
      o = -1;
    }
    if (t === void 0) {
      t = true;
    }
    if (!(1 <= e) || !(e <= a) || !(a <= 40) || o < -1 || o > 7) {
      throw "Invalid value";
    }
    var f = [];
    var i = 236;
    var h = [];
    for (var v = e;;) {
      var c = x(r, v);
      if (c <= 8 * V(v, n)) {
        break;
      }
      if (v >= a) {
        throw "Data too long";
      }
      v++;
    }
    if (t) {
      for (var s = (l = [m.H, m.Q, m.M]).length; s--;) {
        if (c <= 8 * V(v, l[s])) {
          n = l[s];
        }
      }
    }
    for (var l = 0; l < r.length; l++) {
      var g = r[l];
      A(g.modeBits, 4, f);
      A(g.numChars, M(g, v), f);
      var d = 0;
      for (var p = g.bitData; d < p.length; d++) {
        f.push(p[d]);
      }
    }
    if (f.length != c) {
      throw "Assertion error";
    }
    var C = 8 * V(v, n);
    if (f.length > C) {
      throw "Assertion error";
    }
    A(0, u(4, C - f.length), f);
    A(0, (8 - f.length % 8) % 8, f);
    if (f.length % 8 != 0) {
      throw "Assertion error";
    }
    while (f.length < C) {
      A(i, 8, f);
      i ^= 253;
    }
    for (s = f.length; s--;) {
      h[s >>> 3] |= f[s] << 7 - (7 & s);
    }
    return N(v, n, h, o);
  };
  return function () {
    function n(r) {
      return /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(r);
    }
    function t(r, n) {
      for (var t in r = document.createElementNS(s, r), n || {}) {
        r.setAttribute(t, n[t]);
      }
      return r;
    }
    var f;
    var u;
    var c;
    var s = "http://www.w3.org/2000/svg";
    var l = "";
    var g = typeof r == "string" ? {msg: r} : r || {};
    var d = g.pal || ["#000"];
    var p = h(g.dim) || 256;
    var C = [1, 0, 0, 1, c = (c = h(g.pad)) > -1 ? c : 4, c];
    var w = n(w = d[0]) ? w : "#000";
    var b = n(b = d[1]) ? b : 0;
    var A = g.vrb ? 0 : 1;
    L(g.msg || "", m[g.ecl] || m.M, g.ecb == 0 ? 0 : 1, g.mtx);
    var v = e + 2 * c;
    for (var i = e; i--;) {
      u = 0;
      for (f = e; f--;) {
        if (a[i][f]) {
          if (A) {
            u++;
            if (!a[i][f - 1]) {
              l += "M" + f + "," + i + "h" + u + "v1h-" + u + "v-1z";
              u = 0;
            }
          } else {
            l += "M" + f + "," + i + "h1v1h-1v-1z";
          }
        }
      }
    }
    var o = t("svg", {viewBox: [0, 0, v, v].join(" "), width: p, height: p, fill: w, "shape-rendering": "crispEdges", xmlns: s, version: "1.1"});
    if (b) {
      o.appendChild(t("path", {fill: b, d: "M0,0V" + v + "H" + v + "V0H0Z"}));
    }
    o.appendChild(t("path", {transform: "matrix(" + C + ")", d: l}));
    return o;
  }();
}
