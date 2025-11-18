"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // node_modules/preact/dist/preact.module.js
  var n;
  var l;
  var u;
  var t;
  var i;
  var r;
  var o;
  var e;
  var f;
  var c;
  var s;
  var a;
  var h;
  var p = {};
  var v = [];
  var y = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
  var w = Array.isArray;
  function d(n2, l3) {
    for (var u3 in l3) n2[u3] = l3[u3];
    return n2;
  }
  function g(n2) {
    n2 && n2.parentNode && n2.parentNode.removeChild(n2);
  }
  function _(l3, u3, t3) {
    var i3, r3, o3, e3 = {};
    for (o3 in u3) "key" == o3 ? i3 = u3[o3] : "ref" == o3 ? r3 = u3[o3] : e3[o3] = u3[o3];
    if (arguments.length > 2 && (e3.children = arguments.length > 3 ? n.call(arguments, 2) : t3), "function" == typeof l3 && null != l3.defaultProps) for (o3 in l3.defaultProps) void 0 === e3[o3] && (e3[o3] = l3.defaultProps[o3]);
    return m(l3, e3, i3, r3, null);
  }
  function m(n2, t3, i3, r3, o3) {
    var e3 = { type: n2, props: t3, key: i3, ref: r3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == o3 ? ++u : o3, __i: -1, __u: 0 };
    return null == o3 && null != l.vnode && l.vnode(e3), e3;
  }
  function k(n2) {
    return n2.children;
  }
  function x(n2, l3) {
    this.props = n2, this.context = l3;
  }
  function S(n2, l3) {
    if (null == l3) return n2.__ ? S(n2.__, n2.__i + 1) : null;
    for (var u3; l3 < n2.__k.length; l3++) if (null != (u3 = n2.__k[l3]) && null != u3.__e) return u3.__e;
    return "function" == typeof n2.type ? S(n2) : null;
  }
  function C(n2) {
    var l3, u3;
    if (null != (n2 = n2.__) && null != n2.__c) {
      for (n2.__e = n2.__c.base = null, l3 = 0; l3 < n2.__k.length; l3++) if (null != (u3 = n2.__k[l3]) && null != u3.__e) {
        n2.__e = n2.__c.base = u3.__e;
        break;
      }
      return C(n2);
    }
  }
  function M(n2) {
    (!n2.__d && (n2.__d = true) && i.push(n2) && !$.__r++ || r != l.debounceRendering) && ((r = l.debounceRendering) || o)($);
  }
  function $() {
    for (var n2, u3, t3, r3, o3, f3, c3, s3 = 1; i.length; ) i.length > s3 && i.sort(e), n2 = i.shift(), s3 = i.length, n2.__d && (t3 = void 0, r3 = void 0, o3 = (r3 = (u3 = n2).__v).__e, f3 = [], c3 = [], u3.__P && ((t3 = d({}, r3)).__v = r3.__v + 1, l.vnode && l.vnode(t3), O(u3.__P, t3, r3, u3.__n, u3.__P.namespaceURI, 32 & r3.__u ? [o3] : null, f3, null == o3 ? S(r3) : o3, !!(32 & r3.__u), c3), t3.__v = r3.__v, t3.__.__k[t3.__i] = t3, N(f3, t3, c3), r3.__e = r3.__ = null, t3.__e != o3 && C(t3)));
    $.__r = 0;
  }
  function I(n2, l3, u3, t3, i3, r3, o3, e3, f3, c3, s3) {
    var a3, h3, y3, w3, d3, g4, _3, m3 = t3 && t3.__k || v, b2 = l3.length;
    for (f3 = P(u3, l3, m3, f3, b2), a3 = 0; a3 < b2; a3++) null != (y3 = u3.__k[a3]) && (h3 = -1 == y3.__i ? p : m3[y3.__i] || p, y3.__i = a3, g4 = O(n2, y3, h3, i3, r3, o3, e3, f3, c3, s3), w3 = y3.__e, y3.ref && h3.ref != y3.ref && (h3.ref && B(h3.ref, null, y3), s3.push(y3.ref, y3.__c || w3, y3)), null == d3 && null != w3 && (d3 = w3), (_3 = !!(4 & y3.__u)) || h3.__k === y3.__k ? f3 = A(y3, f3, n2, _3) : "function" == typeof y3.type && void 0 !== g4 ? f3 = g4 : w3 && (f3 = w3.nextSibling), y3.__u &= -7);
    return u3.__e = d3, f3;
  }
  function P(n2, l3, u3, t3, i3) {
    var r3, o3, e3, f3, c3, s3 = u3.length, a3 = s3, h3 = 0;
    for (n2.__k = new Array(i3), r3 = 0; r3 < i3; r3++) null != (o3 = l3[r3]) && "boolean" != typeof o3 && "function" != typeof o3 ? (f3 = r3 + h3, (o3 = n2.__k[r3] = "string" == typeof o3 || "number" == typeof o3 || "bigint" == typeof o3 || o3.constructor == String ? m(null, o3, null, null, null) : w(o3) ? m(k, { children: o3 }, null, null, null) : null == o3.constructor && o3.__b > 0 ? m(o3.type, o3.props, o3.key, o3.ref ? o3.ref : null, o3.__v) : o3).__ = n2, o3.__b = n2.__b + 1, e3 = null, -1 != (c3 = o3.__i = L(o3, u3, f3, a3)) && (a3--, (e3 = u3[c3]) && (e3.__u |= 2)), null == e3 || null == e3.__v ? (-1 == c3 && (i3 > s3 ? h3-- : i3 < s3 && h3++), "function" != typeof o3.type && (o3.__u |= 4)) : c3 != f3 && (c3 == f3 - 1 ? h3-- : c3 == f3 + 1 ? h3++ : (c3 > f3 ? h3-- : h3++, o3.__u |= 4))) : n2.__k[r3] = null;
    if (a3) for (r3 = 0; r3 < s3; r3++) null != (e3 = u3[r3]) && 0 == (2 & e3.__u) && (e3.__e == t3 && (t3 = S(e3)), D(e3, e3));
    return t3;
  }
  function A(n2, l3, u3, t3) {
    var i3, r3;
    if ("function" == typeof n2.type) {
      for (i3 = n2.__k, r3 = 0; i3 && r3 < i3.length; r3++) i3[r3] && (i3[r3].__ = n2, l3 = A(i3[r3], l3, u3, t3));
      return l3;
    }
    n2.__e != l3 && (t3 && (l3 && n2.type && !l3.parentNode && (l3 = S(n2)), u3.insertBefore(n2.__e, l3 || null)), l3 = n2.__e);
    do {
      l3 = l3 && l3.nextSibling;
    } while (null != l3 && 8 == l3.nodeType);
    return l3;
  }
  function H(n2, l3) {
    return l3 = l3 || [], null == n2 || "boolean" == typeof n2 || (w(n2) ? n2.some(function(n3) {
      H(n3, l3);
    }) : l3.push(n2)), l3;
  }
  function L(n2, l3, u3, t3) {
    var i3, r3, o3, e3 = n2.key, f3 = n2.type, c3 = l3[u3], s3 = null != c3 && 0 == (2 & c3.__u);
    if (null === c3 && null == n2.key || s3 && e3 == c3.key && f3 == c3.type) return u3;
    if (t3 > (s3 ? 1 : 0)) {
      for (i3 = u3 - 1, r3 = u3 + 1; i3 >= 0 || r3 < l3.length; ) if (null != (c3 = l3[o3 = i3 >= 0 ? i3-- : r3++]) && 0 == (2 & c3.__u) && e3 == c3.key && f3 == c3.type) return o3;
    }
    return -1;
  }
  function T(n2, l3, u3) {
    "-" == l3[0] ? n2.setProperty(l3, null == u3 ? "" : u3) : n2[l3] = null == u3 ? "" : "number" != typeof u3 || y.test(l3) ? u3 : u3 + "px";
  }
  function j(n2, l3, u3, t3, i3) {
    var r3, o3;
    n: if ("style" == l3) if ("string" == typeof u3) n2.style.cssText = u3;
    else {
      if ("string" == typeof t3 && (n2.style.cssText = t3 = ""), t3) for (l3 in t3) u3 && l3 in u3 || T(n2.style, l3, "");
      if (u3) for (l3 in u3) t3 && u3[l3] == t3[l3] || T(n2.style, l3, u3[l3]);
    }
    else if ("o" == l3[0] && "n" == l3[1]) r3 = l3 != (l3 = l3.replace(f, "$1")), o3 = l3.toLowerCase(), l3 = o3 in n2 || "onFocusOut" == l3 || "onFocusIn" == l3 ? o3.slice(2) : l3.slice(2), n2.l || (n2.l = {}), n2.l[l3 + r3] = u3, u3 ? t3 ? u3.u = t3.u : (u3.u = c, n2.addEventListener(l3, r3 ? a : s, r3)) : n2.removeEventListener(l3, r3 ? a : s, r3);
    else {
      if ("http://www.w3.org/2000/svg" == i3) l3 = l3.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if ("width" != l3 && "height" != l3 && "href" != l3 && "list" != l3 && "form" != l3 && "tabIndex" != l3 && "download" != l3 && "rowSpan" != l3 && "colSpan" != l3 && "role" != l3 && "popover" != l3 && l3 in n2) try {
        n2[l3] = null == u3 ? "" : u3;
        break n;
      } catch (n3) {
      }
      "function" == typeof u3 || (null == u3 || false === u3 && "-" != l3[4] ? n2.removeAttribute(l3) : n2.setAttribute(l3, "popover" == l3 && 1 == u3 ? "" : u3));
    }
  }
  function F(n2) {
    return function(u3) {
      if (this.l) {
        var t3 = this.l[u3.type + n2];
        if (null == u3.t) u3.t = c++;
        else if (u3.t < t3.u) return;
        return t3(l.event ? l.event(u3) : u3);
      }
    };
  }
  function O(n2, u3, t3, i3, r3, o3, e3, f3, c3, s3) {
    var a3, h3, p3, v3, y3, _3, m3, b2, S2, C3, M2, $3, P4, A4, H3, L2, T4, j4 = u3.type;
    if (null != u3.constructor) return null;
    128 & t3.__u && (c3 = !!(32 & t3.__u), o3 = [f3 = u3.__e = t3.__e]), (a3 = l.__b) && a3(u3);
    n: if ("function" == typeof j4) try {
      if (b2 = u3.props, S2 = "prototype" in j4 && j4.prototype.render, C3 = (a3 = j4.contextType) && i3[a3.__c], M2 = a3 ? C3 ? C3.props.value : a3.__ : i3, t3.__c ? m3 = (h3 = u3.__c = t3.__c).__ = h3.__E : (S2 ? u3.__c = h3 = new j4(b2, M2) : (u3.__c = h3 = new x(b2, M2), h3.constructor = j4, h3.render = E), C3 && C3.sub(h3), h3.props = b2, h3.state || (h3.state = {}), h3.context = M2, h3.__n = i3, p3 = h3.__d = true, h3.__h = [], h3._sb = []), S2 && null == h3.__s && (h3.__s = h3.state), S2 && null != j4.getDerivedStateFromProps && (h3.__s == h3.state && (h3.__s = d({}, h3.__s)), d(h3.__s, j4.getDerivedStateFromProps(b2, h3.__s))), v3 = h3.props, y3 = h3.state, h3.__v = u3, p3) S2 && null == j4.getDerivedStateFromProps && null != h3.componentWillMount && h3.componentWillMount(), S2 && null != h3.componentDidMount && h3.__h.push(h3.componentDidMount);
      else {
        if (S2 && null == j4.getDerivedStateFromProps && b2 !== v3 && null != h3.componentWillReceiveProps && h3.componentWillReceiveProps(b2, M2), !h3.__e && null != h3.shouldComponentUpdate && false === h3.shouldComponentUpdate(b2, h3.__s, M2) || u3.__v == t3.__v) {
          for (u3.__v != t3.__v && (h3.props = b2, h3.state = h3.__s, h3.__d = false), u3.__e = t3.__e, u3.__k = t3.__k, u3.__k.some(function(n3) {
            n3 && (n3.__ = u3);
          }), $3 = 0; $3 < h3._sb.length; $3++) h3.__h.push(h3._sb[$3]);
          h3._sb = [], h3.__h.length && e3.push(h3);
          break n;
        }
        null != h3.componentWillUpdate && h3.componentWillUpdate(b2, h3.__s, M2), S2 && null != h3.componentDidUpdate && h3.__h.push(function() {
          h3.componentDidUpdate(v3, y3, _3);
        });
      }
      if (h3.context = M2, h3.props = b2, h3.__P = n2, h3.__e = false, P4 = l.__r, A4 = 0, S2) {
        for (h3.state = h3.__s, h3.__d = false, P4 && P4(u3), a3 = h3.render(h3.props, h3.state, h3.context), H3 = 0; H3 < h3._sb.length; H3++) h3.__h.push(h3._sb[H3]);
        h3._sb = [];
      } else do {
        h3.__d = false, P4 && P4(u3), a3 = h3.render(h3.props, h3.state, h3.context), h3.state = h3.__s;
      } while (h3.__d && ++A4 < 25);
      h3.state = h3.__s, null != h3.getChildContext && (i3 = d(d({}, i3), h3.getChildContext())), S2 && !p3 && null != h3.getSnapshotBeforeUpdate && (_3 = h3.getSnapshotBeforeUpdate(v3, y3)), L2 = a3, null != a3 && a3.type === k && null == a3.key && (L2 = V(a3.props.children)), f3 = I(n2, w(L2) ? L2 : [L2], u3, t3, i3, r3, o3, e3, f3, c3, s3), h3.base = u3.__e, u3.__u &= -161, h3.__h.length && e3.push(h3), m3 && (h3.__E = h3.__ = null);
    } catch (n3) {
      if (u3.__v = null, c3 || null != o3) if (n3.then) {
        for (u3.__u |= c3 ? 160 : 128; f3 && 8 == f3.nodeType && f3.nextSibling; ) f3 = f3.nextSibling;
        o3[o3.indexOf(f3)] = null, u3.__e = f3;
      } else {
        for (T4 = o3.length; T4--; ) g(o3[T4]);
        z(u3);
      }
      else u3.__e = t3.__e, u3.__k = t3.__k, n3.then || z(u3);
      l.__e(n3, u3, t3);
    }
    else null == o3 && u3.__v == t3.__v ? (u3.__k = t3.__k, u3.__e = t3.__e) : f3 = u3.__e = q(t3.__e, u3, t3, i3, r3, o3, e3, c3, s3);
    return (a3 = l.diffed) && a3(u3), 128 & u3.__u ? void 0 : f3;
  }
  function z(n2) {
    n2 && n2.__c && (n2.__c.__e = true), n2 && n2.__k && n2.__k.forEach(z);
  }
  function N(n2, u3, t3) {
    for (var i3 = 0; i3 < t3.length; i3++) B(t3[i3], t3[++i3], t3[++i3]);
    l.__c && l.__c(u3, n2), n2.some(function(u4) {
      try {
        n2 = u4.__h, u4.__h = [], n2.some(function(n3) {
          n3.call(u4);
        });
      } catch (n3) {
        l.__e(n3, u4.__v);
      }
    });
  }
  function V(n2) {
    return "object" != typeof n2 || null == n2 || n2.__b && n2.__b > 0 ? n2 : w(n2) ? n2.map(V) : d({}, n2);
  }
  function q(u3, t3, i3, r3, o3, e3, f3, c3, s3) {
    var a3, h3, v3, y3, d3, _3, m3, b2 = i3.props, k3 = t3.props, x3 = t3.type;
    if ("svg" == x3 ? o3 = "http://www.w3.org/2000/svg" : "math" == x3 ? o3 = "http://www.w3.org/1998/Math/MathML" : o3 || (o3 = "http://www.w3.org/1999/xhtml"), null != e3) {
      for (a3 = 0; a3 < e3.length; a3++) if ((d3 = e3[a3]) && "setAttribute" in d3 == !!x3 && (x3 ? d3.localName == x3 : 3 == d3.nodeType)) {
        u3 = d3, e3[a3] = null;
        break;
      }
    }
    if (null == u3) {
      if (null == x3) return document.createTextNode(k3);
      u3 = document.createElementNS(o3, x3, k3.is && k3), c3 && (l.__m && l.__m(t3, e3), c3 = false), e3 = null;
    }
    if (null == x3) b2 === k3 || c3 && u3.data == k3 || (u3.data = k3);
    else {
      if (e3 = e3 && n.call(u3.childNodes), b2 = i3.props || p, !c3 && null != e3) for (b2 = {}, a3 = 0; a3 < u3.attributes.length; a3++) b2[(d3 = u3.attributes[a3]).name] = d3.value;
      for (a3 in b2) if (d3 = b2[a3], "children" == a3) ;
      else if ("dangerouslySetInnerHTML" == a3) v3 = d3;
      else if (!(a3 in k3)) {
        if ("value" == a3 && "defaultValue" in k3 || "checked" == a3 && "defaultChecked" in k3) continue;
        j(u3, a3, null, d3, o3);
      }
      for (a3 in k3) d3 = k3[a3], "children" == a3 ? y3 = d3 : "dangerouslySetInnerHTML" == a3 ? h3 = d3 : "value" == a3 ? _3 = d3 : "checked" == a3 ? m3 = d3 : c3 && "function" != typeof d3 || b2[a3] === d3 || j(u3, a3, d3, b2[a3], o3);
      if (h3) c3 || v3 && (h3.__html == v3.__html || h3.__html == u3.innerHTML) || (u3.innerHTML = h3.__html), t3.__k = [];
      else if (v3 && (u3.innerHTML = ""), I("template" == t3.type ? u3.content : u3, w(y3) ? y3 : [y3], t3, i3, r3, "foreignObject" == x3 ? "http://www.w3.org/1999/xhtml" : o3, e3, f3, e3 ? e3[0] : i3.__k && S(i3, 0), c3, s3), null != e3) for (a3 = e3.length; a3--; ) g(e3[a3]);
      c3 || (a3 = "value", "progress" == x3 && null == _3 ? u3.removeAttribute("value") : null != _3 && (_3 !== u3[a3] || "progress" == x3 && !_3 || "option" == x3 && _3 != b2[a3]) && j(u3, a3, _3, b2[a3], o3), a3 = "checked", null != m3 && m3 != u3[a3] && j(u3, a3, m3, b2[a3], o3));
    }
    return u3;
  }
  function B(n2, u3, t3) {
    try {
      if ("function" == typeof n2) {
        var i3 = "function" == typeof n2.__u;
        i3 && n2.__u(), i3 && null == u3 || (n2.__u = n2(u3));
      } else n2.current = u3;
    } catch (n3) {
      l.__e(n3, t3);
    }
  }
  function D(n2, u3, t3) {
    var i3, r3;
    if (l.unmount && l.unmount(n2), (i3 = n2.ref) && (i3.current && i3.current != n2.__e || B(i3, null, u3)), null != (i3 = n2.__c)) {
      if (i3.componentWillUnmount) try {
        i3.componentWillUnmount();
      } catch (n3) {
        l.__e(n3, u3);
      }
      i3.base = i3.__P = null;
    }
    if (i3 = n2.__k) for (r3 = 0; r3 < i3.length; r3++) i3[r3] && D(i3[r3], u3, t3 || "function" != typeof n2.type);
    t3 || g(n2.__e), n2.__c = n2.__ = n2.__e = void 0;
  }
  function E(n2, l3, u3) {
    return this.constructor(n2, u3);
  }
  function G(u3, t3, i3) {
    var r3, o3, e3, f3;
    t3 == document && (t3 = document.documentElement), l.__ && l.__(u3, t3), o3 = (r3 = "function" == typeof i3) ? null : i3 && i3.__k || t3.__k, e3 = [], f3 = [], O(t3, u3 = (!r3 && i3 || t3).__k = _(k, null, [u3]), o3 || p, p, t3.namespaceURI, !r3 && i3 ? [i3] : o3 ? null : t3.firstChild ? n.call(t3.childNodes) : null, e3, !r3 && i3 ? i3 : o3 ? o3.__e : t3.firstChild, r3, f3), N(e3, u3, f3);
  }
  function Q(n2) {
    function l3(n3) {
      var u3, t3;
      return this.getChildContext || (u3 = /* @__PURE__ */ new Set(), (t3 = {})[l3.__c] = this, this.getChildContext = function() {
        return t3;
      }, this.componentWillUnmount = function() {
        u3 = null;
      }, this.shouldComponentUpdate = function(n4) {
        this.props.value != n4.value && u3.forEach(function(n5) {
          n5.__e = true, M(n5);
        });
      }, this.sub = function(n4) {
        u3.add(n4);
        var l4 = n4.componentWillUnmount;
        n4.componentWillUnmount = function() {
          u3 && u3.delete(n4), l4 && l4.call(n4);
        };
      }), n3.children;
    }
    return l3.__c = "__cC" + h++, l3.__ = n2, l3.Provider = l3.__l = (l3.Consumer = function(n3, l4) {
      return n3.children(l4);
    }).contextType = l3, l3;
  }
  n = v.slice, l = { __e: function(n2, l3, u3, t3) {
    for (var i3, r3, o3; l3 = l3.__; ) if ((i3 = l3.__c) && !i3.__) try {
      if ((r3 = i3.constructor) && null != r3.getDerivedStateFromError && (i3.setState(r3.getDerivedStateFromError(n2)), o3 = i3.__d), null != i3.componentDidCatch && (i3.componentDidCatch(n2, t3 || {}), o3 = i3.__d), o3) return i3.__E = i3;
    } catch (l4) {
      n2 = l4;
    }
    throw n2;
  } }, u = 0, t = function(n2) {
    return null != n2 && null == n2.constructor;
  }, x.prototype.setState = function(n2, l3) {
    var u3;
    u3 = null != this.__s && this.__s != this.state ? this.__s : this.__s = d({}, this.state), "function" == typeof n2 && (n2 = n2(d({}, u3), this.props)), n2 && d(u3, n2), null != n2 && this.__v && (l3 && this._sb.push(l3), M(this));
  }, x.prototype.forceUpdate = function(n2) {
    this.__v && (this.__e = true, n2 && this.__h.push(n2), M(this));
  }, x.prototype.render = k, i = [], o = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = function(n2, l3) {
    return n2.__v.__b - l3.__v.__b;
  }, $.__r = 0, f = /(PointerCapture)$|Capture$/i, c = 0, s = F(false), a = F(true), h = 0;

  // node_modules/preact/hooks/dist/hooks.module.js
  var t2;
  var r2;
  var u2;
  var i2;
  var o2 = 0;
  var f2 = [];
  var c2 = l;
  var e2 = c2.__b;
  var a2 = c2.__r;
  var v2 = c2.diffed;
  var l2 = c2.__c;
  var m2 = c2.unmount;
  var s2 = c2.__;
  function p2(n2, t3) {
    c2.__h && c2.__h(r2, n2, o2 || t3), o2 = 0;
    var u3 = r2.__H || (r2.__H = { __: [], __h: [] });
    return n2 >= u3.__.length && u3.__.push({}), u3.__[n2];
  }
  function d2(n2) {
    return o2 = 1, h2(D2, n2);
  }
  function h2(n2, u3, i3) {
    var o3 = p2(t2++, 2);
    if (o3.t = n2, !o3.__c && (o3.__ = [i3 ? i3(u3) : D2(void 0, u3), function(n3) {
      var t3 = o3.__N ? o3.__N[0] : o3.__[0], r3 = o3.t(t3, n3);
      t3 !== r3 && (o3.__N = [r3, o3.__[1]], o3.__c.setState({}));
    }], o3.__c = r2, !r2.__f)) {
      var f3 = function(n3, t3, r3) {
        if (!o3.__c.__H) return true;
        var u4 = o3.__c.__H.__.filter(function(n4) {
          return !!n4.__c;
        });
        if (u4.every(function(n4) {
          return !n4.__N;
        })) return !c3 || c3.call(this, n3, t3, r3);
        var i4 = o3.__c.props !== n3;
        return u4.forEach(function(n4) {
          if (n4.__N) {
            var t4 = n4.__[0];
            n4.__ = n4.__N, n4.__N = void 0, t4 !== n4.__[0] && (i4 = true);
          }
        }), c3 && c3.call(this, n3, t3, r3) || i4;
      };
      r2.__f = true;
      var c3 = r2.shouldComponentUpdate, e3 = r2.componentWillUpdate;
      r2.componentWillUpdate = function(n3, t3, r3) {
        if (this.__e) {
          var u4 = c3;
          c3 = void 0, f3(n3, t3, r3), c3 = u4;
        }
        e3 && e3.call(this, n3, t3, r3);
      }, r2.shouldComponentUpdate = f3;
    }
    return o3.__N || o3.__;
  }
  function y2(n2, u3) {
    var i3 = p2(t2++, 3);
    !c2.__s && C2(i3.__H, u3) && (i3.__ = n2, i3.u = u3, r2.__H.__h.push(i3));
  }
  function A2(n2) {
    return o2 = 5, T2(function() {
      return { current: n2 };
    }, []);
  }
  function T2(n2, r3) {
    var u3 = p2(t2++, 7);
    return C2(u3.__H, r3) && (u3.__ = n2(), u3.__H = r3, u3.__h = n2), u3.__;
  }
  function q2(n2, t3) {
    return o2 = 8, T2(function() {
      return n2;
    }, t3);
  }
  function x2(n2) {
    var u3 = r2.context[n2.__c], i3 = p2(t2++, 9);
    return i3.c = n2, u3 ? (null == i3.__ && (i3.__ = true, u3.sub(r2)), u3.props.value) : n2.__;
  }
  function P2(n2, t3) {
    c2.useDebugValue && c2.useDebugValue(t3 ? t3(n2) : n2);
  }
  function j2() {
    for (var n2; n2 = f2.shift(); ) if (n2.__P && n2.__H) try {
      n2.__H.__h.forEach(z2), n2.__H.__h.forEach(B2), n2.__H.__h = [];
    } catch (t3) {
      n2.__H.__h = [], c2.__e(t3, n2.__v);
    }
  }
  c2.__b = function(n2) {
    r2 = null, e2 && e2(n2);
  }, c2.__ = function(n2, t3) {
    n2 && t3.__k && t3.__k.__m && (n2.__m = t3.__k.__m), s2 && s2(n2, t3);
  }, c2.__r = function(n2) {
    a2 && a2(n2), t2 = 0;
    var i3 = (r2 = n2.__c).__H;
    i3 && (u2 === r2 ? (i3.__h = [], r2.__h = [], i3.__.forEach(function(n3) {
      n3.__N && (n3.__ = n3.__N), n3.u = n3.__N = void 0;
    })) : (i3.__h.forEach(z2), i3.__h.forEach(B2), i3.__h = [], t2 = 0)), u2 = r2;
  }, c2.diffed = function(n2) {
    v2 && v2(n2);
    var t3 = n2.__c;
    t3 && t3.__H && (t3.__H.__h.length && (1 !== f2.push(t3) && i2 === c2.requestAnimationFrame || ((i2 = c2.requestAnimationFrame) || w2)(j2)), t3.__H.__.forEach(function(n3) {
      n3.u && (n3.__H = n3.u), n3.u = void 0;
    })), u2 = r2 = null;
  }, c2.__c = function(n2, t3) {
    t3.some(function(n3) {
      try {
        n3.__h.forEach(z2), n3.__h = n3.__h.filter(function(n4) {
          return !n4.__ || B2(n4);
        });
      } catch (r3) {
        t3.some(function(n4) {
          n4.__h && (n4.__h = []);
        }), t3 = [], c2.__e(r3, n3.__v);
      }
    }), l2 && l2(n2, t3);
  }, c2.unmount = function(n2) {
    m2 && m2(n2);
    var t3, r3 = n2.__c;
    r3 && r3.__H && (r3.__H.__.forEach(function(n3) {
      try {
        z2(n3);
      } catch (n4) {
        t3 = n4;
      }
    }), r3.__H = void 0, t3 && c2.__e(t3, r3.__v));
  };
  var k2 = "function" == typeof requestAnimationFrame;
  function w2(n2) {
    var t3, r3 = function() {
      clearTimeout(u3), k2 && cancelAnimationFrame(t3), setTimeout(n2);
    }, u3 = setTimeout(r3, 35);
    k2 && (t3 = requestAnimationFrame(r3));
  }
  function z2(n2) {
    var t3 = r2, u3 = n2.__c;
    "function" == typeof u3 && (n2.__c = void 0, u3()), r2 = t3;
  }
  function B2(n2) {
    var t3 = r2;
    n2.__c = n2.__(), r2 = t3;
  }
  function C2(n2, t3) {
    return !n2 || n2.length !== t3.length || t3.some(function(t4, r3) {
      return t4 !== n2[r3];
    });
  }
  function D2(n2, t3) {
    return "function" == typeof t3 ? t3(n2) : t3;
  }

  // node_modules/preact/compat/dist/compat.module.js
  function g3(n2, t3) {
    for (var e3 in t3) n2[e3] = t3[e3];
    return n2;
  }
  function E2(n2, t3) {
    for (var e3 in n2) if ("__source" !== e3 && !(e3 in t3)) return true;
    for (var r3 in t3) if ("__source" !== r3 && n2[r3] !== t3[r3]) return true;
    return false;
  }
  function N2(n2, t3) {
    this.props = n2, this.context = t3;
  }
  (N2.prototype = new x()).isPureReactComponent = true, N2.prototype.shouldComponentUpdate = function(n2, t3) {
    return E2(this.props, n2) || E2(this.state, t3);
  };
  var T3 = l.__b;
  l.__b = function(n2) {
    n2.type && n2.type.__f && n2.ref && (n2.props.ref = n2.ref, n2.ref = null), T3 && T3(n2);
  };
  var A3 = "undefined" != typeof Symbol && Symbol.for && Symbol.for("react.forward_ref") || 3911;
  var F3 = l.__e;
  l.__e = function(n2, t3, e3, r3) {
    if (n2.then) {
      for (var u3, o3 = t3; o3 = o3.__; ) if ((u3 = o3.__c) && u3.__c) return null == t3.__e && (t3.__e = e3.__e, t3.__k = e3.__k), u3.__c(n2, t3);
    }
    F3(n2, t3, e3, r3);
  };
  var U = l.unmount;
  function V2(n2, t3, e3) {
    return n2 && (n2.__c && n2.__c.__H && (n2.__c.__H.__.forEach(function(n3) {
      "function" == typeof n3.__c && n3.__c();
    }), n2.__c.__H = null), null != (n2 = g3({}, n2)).__c && (n2.__c.__P === e3 && (n2.__c.__P = t3), n2.__c.__e = true, n2.__c = null), n2.__k = n2.__k && n2.__k.map(function(n3) {
      return V2(n3, t3, e3);
    })), n2;
  }
  function W(n2, t3, e3) {
    return n2 && e3 && (n2.__v = null, n2.__k = n2.__k && n2.__k.map(function(n3) {
      return W(n3, t3, e3);
    }), n2.__c && n2.__c.__P === t3 && (n2.__e && e3.appendChild(n2.__e), n2.__c.__e = true, n2.__c.__P = e3)), n2;
  }
  function P3() {
    this.__u = 0, this.o = null, this.__b = null;
  }
  function j3(n2) {
    var t3 = n2.__.__c;
    return t3 && t3.__a && t3.__a(n2);
  }
  function B3() {
    this.i = null, this.l = null;
  }
  l.unmount = function(n2) {
    var t3 = n2.__c;
    t3 && t3.__R && t3.__R(), t3 && 32 & n2.__u && (n2.type = null), U && U(n2);
  }, (P3.prototype = new x()).__c = function(n2, t3) {
    var e3 = t3.__c, r3 = this;
    null == r3.o && (r3.o = []), r3.o.push(e3);
    var u3 = j3(r3.__v), o3 = false, i3 = function() {
      o3 || (o3 = true, e3.__R = null, u3 ? u3(l3) : l3());
    };
    e3.__R = i3;
    var l3 = function() {
      if (!--r3.__u) {
        if (r3.state.__a) {
          var n3 = r3.state.__a;
          r3.__v.__k[0] = W(n3, n3.__c.__P, n3.__c.__O);
        }
        var t4;
        for (r3.setState({ __a: r3.__b = null }); t4 = r3.o.pop(); ) t4.forceUpdate();
      }
    };
    r3.__u++ || 32 & t3.__u || r3.setState({ __a: r3.__b = r3.__v.__k[0] }), n2.then(i3, i3);
  }, P3.prototype.componentWillUnmount = function() {
    this.o = [];
  }, P3.prototype.render = function(n2, e3) {
    if (this.__b) {
      if (this.__v.__k) {
        var r3 = document.createElement("div"), o3 = this.__v.__k[0].__c;
        this.__v.__k[0] = V2(this.__b, r3, o3.__O = o3.__P);
      }
      this.__b = null;
    }
    var i3 = e3.__a && _(k, null, n2.fallback);
    return i3 && (i3.__u &= -33), [_(k, null, e3.__a ? null : n2.children), i3];
  };
  var H2 = function(n2, t3, e3) {
    if (++e3[1] === e3[0] && n2.l.delete(t3), n2.props.revealOrder && ("t" !== n2.props.revealOrder[0] || !n2.l.size)) for (e3 = n2.i; e3; ) {
      for (; e3.length > 3; ) e3.pop()();
      if (e3[1] < e3[0]) break;
      n2.i = e3 = e3[2];
    }
  };
  function Z(n2) {
    return this.getChildContext = function() {
      return n2.context;
    }, n2.children;
  }
  function Y(n2) {
    var e3 = this, r3 = n2.h;
    if (e3.componentWillUnmount = function() {
      G(null, e3.v), e3.v = null, e3.h = null;
    }, e3.h && e3.h !== r3 && e3.componentWillUnmount(), !e3.v) {
      for (var u3 = e3.__v; null !== u3 && !u3.__m && null !== u3.__; ) u3 = u3.__;
      e3.h = r3, e3.v = { nodeType: 1, parentNode: r3, childNodes: [], __k: { __m: u3.__m }, contains: function() {
        return true;
      }, insertBefore: function(n3, t3) {
        this.childNodes.push(n3), e3.h.insertBefore(n3, t3);
      }, removeChild: function(n3) {
        this.childNodes.splice(this.childNodes.indexOf(n3) >>> 1, 1), e3.h.removeChild(n3);
      } };
    }
    G(_(Z, { context: e3.context }, n2.__v), e3.v);
  }
  function $2(n2, e3) {
    var r3 = _(Y, { __v: n2, h: e3 });
    return r3.containerInfo = e3, r3;
  }
  (B3.prototype = new x()).__a = function(n2) {
    var t3 = this, e3 = j3(t3.__v), r3 = t3.l.get(n2);
    return r3[0]++, function(u3) {
      var o3 = function() {
        t3.props.revealOrder ? (r3.push(u3), H2(t3, n2, r3)) : u3();
      };
      e3 ? e3(o3) : o3();
    };
  }, B3.prototype.render = function(n2) {
    this.i = null, this.l = /* @__PURE__ */ new Map();
    var t3 = H(n2.children);
    n2.revealOrder && "b" === n2.revealOrder[0] && t3.reverse();
    for (var e3 = t3.length; e3--; ) this.l.set(t3[e3], this.i = [1, 0, this.i]);
    return n2.children;
  }, B3.prototype.componentDidUpdate = B3.prototype.componentDidMount = function() {
    var n2 = this;
    this.l.forEach(function(t3, e3) {
      H2(n2, e3, t3);
    });
  };
  var q3 = "undefined" != typeof Symbol && Symbol.for && Symbol.for("react.element") || 60103;
  var G2 = /^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/;
  var J2 = /^on(Ani|Tra|Tou|BeforeInp|Compo)/;
  var K2 = /[A-Z0-9]/g;
  var Q2 = "undefined" != typeof document;
  var X = function(n2) {
    return ("undefined" != typeof Symbol && "symbol" == typeof Symbol() ? /fil|che|rad/ : /fil|che|ra/).test(n2);
  };
  x.prototype.isReactComponent = {}, ["componentWillMount", "componentWillReceiveProps", "componentWillUpdate"].forEach(function(t3) {
    Object.defineProperty(x.prototype, t3, { configurable: true, get: function() {
      return this["UNSAFE_" + t3];
    }, set: function(n2) {
      Object.defineProperty(this, t3, { configurable: true, writable: true, value: n2 });
    } });
  });
  var en = l.event;
  function rn() {
  }
  function un() {
    return this.cancelBubble;
  }
  function on() {
    return this.defaultPrevented;
  }
  l.event = function(n2) {
    return en && (n2 = en(n2)), n2.persist = rn, n2.isPropagationStopped = un, n2.isDefaultPrevented = on, n2.nativeEvent = n2;
  };
  var ln;
  var cn = { enumerable: false, configurable: true, get: function() {
    return this.class;
  } };
  var fn = l.vnode;
  l.vnode = function(n2) {
    "string" == typeof n2.type && (function(n3) {
      var t3 = n3.props, e3 = n3.type, u3 = {}, o3 = -1 === e3.indexOf("-");
      for (var i3 in t3) {
        var l3 = t3[i3];
        if (!("value" === i3 && "defaultValue" in t3 && null == l3 || Q2 && "children" === i3 && "noscript" === e3 || "class" === i3 || "className" === i3)) {
          var c3 = i3.toLowerCase();
          "defaultValue" === i3 && "value" in t3 && null == t3.value ? i3 = "value" : "download" === i3 && true === l3 ? l3 = "" : "translate" === c3 && "no" === l3 ? l3 = false : "o" === c3[0] && "n" === c3[1] ? "ondoubleclick" === c3 ? i3 = "ondblclick" : "onchange" !== c3 || "input" !== e3 && "textarea" !== e3 || X(t3.type) ? "onfocus" === c3 ? i3 = "onfocusin" : "onblur" === c3 ? i3 = "onfocusout" : J2.test(i3) && (i3 = c3) : c3 = i3 = "oninput" : o3 && G2.test(i3) ? i3 = i3.replace(K2, "-$&").toLowerCase() : null === l3 && (l3 = void 0), "oninput" === c3 && u3[i3 = c3] && (i3 = "oninputCapture"), u3[i3] = l3;
        }
      }
      "select" == e3 && u3.multiple && Array.isArray(u3.value) && (u3.value = H(t3.children).forEach(function(n4) {
        n4.props.selected = -1 != u3.value.indexOf(n4.props.value);
      })), "select" == e3 && null != u3.defaultValue && (u3.value = H(t3.children).forEach(function(n4) {
        n4.props.selected = u3.multiple ? -1 != u3.defaultValue.indexOf(n4.props.value) : u3.defaultValue == n4.props.value;
      })), t3.class && !t3.className ? (u3.class = t3.class, Object.defineProperty(u3, "className", cn)) : (t3.className && !t3.class || t3.class && t3.className) && (u3.class = u3.className = t3.className), n3.props = u3;
    })(n2), n2.$$typeof = q3, fn && fn(n2);
  };
  var an = l.__r;
  l.__r = function(n2) {
    an && an(n2), ln = n2.__c;
  };
  var sn = l.diffed;
  l.diffed = function(n2) {
    sn && sn(n2);
    var t3 = n2.props, e3 = n2.__e;
    null != e3 && "textarea" === n2.type && "value" in t3 && t3.value !== e3.value && (e3.value = null == t3.value ? "" : t3.value), ln = null;
  };

  // extensions/storefront-src/core/api.ts
  var SESSION_START_KEY = "revenue_boost_session_start_time";
  var PAGE_VIEWS_KEY = "revenue_boost_page_views";
  var PRODUCT_VIEWS_KEY = "revenue_boost_product_view_count";
  var ADDED_TO_CART_SESSION_KEY = "revenue_boost_added_to_cart";
  var ApiClient = class {
    constructor(config) {
      __publicField(this, "config");
      this.config = config;
    }
    log(...args) {
      if (this.config.debug) {
        console.log("[Revenue Boost API]", ...args);
      }
    }
    getApiUrl(path) {
      const base = this.config.apiUrl || "";
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      if (base) {
        return `${base}${cleanPath}`;
      }
      return `/apps/revenue-boost${cleanPath}`;
    }
    async fetchActiveCampaigns(sessionId, visitorId) {
      const context = this.buildStorefrontContext(sessionId, visitorId);
      const params = new URLSearchParams({
        shop: this.config.shopDomain,
        ...context
      });
      if (this.config.previewId) {
        params.set("previewId", this.config.previewId);
      }
      const url = `${this.getApiUrl("/api/campaigns/active")}?${params.toString()}`;
      this.log("Fetching campaigns from:", url);
      this.log("Context:", context);
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include"
          // Include cookies for visitor ID
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        this.log("Campaigns received:", data);
        return data;
      } catch (error) {
        console.error("[Revenue Boost API] Failed to fetch campaigns:", error);
        throw error;
      }
    }
    buildStorefrontContext(sessionId, visitorId) {
      const pageType = this.detectPageType();
      const context = {
        sessionId,
        pageUrl: window.location.pathname,
        pageType,
        deviceType: this.detectDeviceType()
      };
      try {
        const w4 = window;
        const cfg = w4.REVENUE_BOOST_CONFIG || {};
        if (cfg.productId) context.productId = String(cfg.productId);
        if (cfg.productHandle) context.productHandle = String(cfg.productHandle);
        if (cfg.productType) context.productType = String(cfg.productType);
        if (cfg.productVendor) context.productVendor = String(cfg.productVendor);
        if (Array.isArray(cfg.productTags) && cfg.productTags.length > 0) {
          context.productTags = cfg.productTags.join(",");
        }
        if (cfg.collectionId) context.collectionId = String(cfg.collectionId);
        if (cfg.collectionHandle) context.collectionHandle = String(cfg.collectionHandle);
      } catch {
      }
      if (visitorId) {
        context.visitorId = visitorId;
      }
      try {
        const ls = window.localStorage;
        const ss = window.sessionStorage;
        const now = Date.now();
        const visitCountRaw = ls.getItem("revenue_boost_visit_count");
        const visitCount = parseInt(visitCountRaw || "1", 10);
        if (!Number.isNaN(visitCount)) {
          context.visitCount = String(visitCount);
          context.isReturningVisitor = String(visitCount > 1);
        }
        let startTime = parseInt(ss.getItem(SESSION_START_KEY) || "", 10);
        if (!startTime || Number.isNaN(startTime)) {
          startTime = now;
          ss.setItem(SESSION_START_KEY, String(startTime));
        }
        const timeOnSiteSeconds = Math.floor((now - startTime) / 1e3);
        if (timeOnSiteSeconds > 0) {
          context.timeOnSite = String(timeOnSiteSeconds);
        }
        let pageViews = parseInt(ss.getItem(PAGE_VIEWS_KEY) || "0", 10);
        pageViews += 1;
        ss.setItem(PAGE_VIEWS_KEY, String(pageViews));
        context.pageViews = String(pageViews);
        if (pageType) {
          context.currentPageType = pageType;
        }
        let productViewCount = parseInt(ss.getItem(PRODUCT_VIEWS_KEY) || "0", 10);
        if (pageType === "product") {
          productViewCount += 1;
          ss.setItem(PRODUCT_VIEWS_KEY, String(productViewCount));
        }
        if (productViewCount > 0) {
          context.productViewCount = String(productViewCount);
        }
        const addedToCartFlag = ss.getItem(ADDED_TO_CART_SESSION_KEY);
        if (addedToCartFlag === "true") {
          context.addedToCartInSession = "true";
        }
      } catch {
      }
      const w3 = window;
      if (typeof w3.Shopify !== "undefined") {
        const shopify = w3.Shopify;
        if (shopify.cart) {
          context.cartValue = String(shopify.cart.total_price / 100);
          context.cartItemCount = String(shopify.cart.item_count);
        }
      }
      return context;
    }
    detectPageType() {
      const path = window.location.pathname;
      if (path === "/" || path === "") return "home";
      if (path.includes("/products/")) return "product";
      if (path.includes("/collections/")) return "collection";
      if (path.includes("/cart")) return "cart";
      if (path.includes("/checkout")) return "checkout";
      return "other";
    }
    detectDeviceType() {
      const ua = navigator.userAgent.toLowerCase();
      if (/android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
        return "mobile";
      }
      if (/ipad|android(?!.*mobile)/i.test(ua)) {
        return "tablet";
      }
      return "desktop";
    }
    async submitLead(data) {
      const params = new URLSearchParams({
        shop: this.config.shopDomain
      });
      const url = `${this.getApiUrl("/api/leads/submit")}?${params.toString()}`;
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...data,
            pageUrl: window.location.href,
            referrer: document.referrer
          })
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        const result = await response.json();
        this.log("Lead submitted successfully:", result);
        return {
          success: true,
          leadId: result.leadId,
          discountCode: result.discountCode,
          freeGift: result.freeGift
        };
      } catch (error) {
        console.error("[Revenue Boost API] Failed to submit lead:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to submit lead"
        };
      }
    }
    async issueDiscount(data) {
      const params = new URLSearchParams({
        shop: this.config.shopDomain
      });
      const url = `${this.getApiUrl("/api/discounts/issue")}?${params.toString()}`;
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.error || `HTTP ${response.status}`);
        }
        this.log("Discount issued successfully:", result);
        return {
          success: true,
          code: result.code,
          type: result.type,
          autoApplyMode: result.autoApplyMode
        };
      } catch (error) {
        console.error("[Revenue Boost API] Failed to issue discount:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to issue discount"
        };
      }
    }
    async emailRecovery(data) {
      const params = new URLSearchParams({
        shop: this.config.shopDomain
      });
      const url = `${this.getApiUrl("/api/cart/email-recovery")}?${params.toString()}`;
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.error || `HTTP ${response.status}`);
        }
        this.log("Cart email recovery success:", result);
        return {
          success: true,
          discountCode: result.discountCode,
          deliveryMode: result.deliveryMode,
          autoApplyMode: result.autoApplyMode,
          message: result.message
        };
      } catch (error) {
        console.error("[Revenue Boost API] Failed to perform email recovery:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to perform email recovery"
        };
      }
    }
    async recordFrequency(sessionId, campaignId) {
      const url = this.getApiUrl("/api/analytics/frequency");
      try {
        await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            sessionId,
            campaignId,
            timestamp: Date.now()
          })
        });
      } catch (error) {
        console.error("[Revenue Boost API] Failed to record frequency:", error);
      }
    }
    async trackEvent(event) {
      const url = this.getApiUrl("/api/analytics/track");
      try {
        await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(event)
        });
      } catch (error) {
        console.error("[Revenue Boost API] Failed to track event:", error);
      }
    }
    async trackSocialProofEvent(event) {
      const url = this.getApiUrl("/api/social-proof/track");
      try {
        await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(event)
        });
      } catch (error) {
        if (this.config.debug) {
          console.error("[Revenue Boost API] Failed to track social proof event:", error);
        }
      }
    }
  };

  // extensions/storefront-src/core/session.ts
  var SESSION_KEY = "revenue_boost_session";
  var DISMISSED_KEY = "revenue_boost_dismissed";
  var VISITOR_KEY = "revenue_boost_visitor";
  var SessionManager = class {
    constructor() {
      __publicField(this, "sessionId");
      __publicField(this, "visitorId");
      __publicField(this, "dismissedCampaigns");
      this.sessionId = this.initSessionId();
      this.visitorId = this.initVisitorId();
      this.dismissedCampaigns = this.loadDismissedCampaigns();
      this.incrementVisitCount();
    }
    initSessionId() {
      let sessionId = sessionStorage.getItem(SESSION_KEY);
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem(SESSION_KEY, sessionId);
      }
      return sessionId;
    }
    initVisitorId() {
      let visitorId = localStorage.getItem(VISITOR_KEY);
      if (!visitorId) {
        visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(VISITOR_KEY, visitorId);
      }
      return visitorId;
    }
    loadDismissedCampaigns() {
      const stored = localStorage.getItem(DISMISSED_KEY);
      if (stored) {
        try {
          return new Set(JSON.parse(stored));
        } catch {
          return /* @__PURE__ */ new Set();
        }
      }
      return /* @__PURE__ */ new Set();
    }
    saveDismissedCampaigns() {
      localStorage.setItem(
        DISMISSED_KEY,
        JSON.stringify(Array.from(this.dismissedCampaigns))
      );
    }
    incrementVisitCount() {
      const count = parseInt(localStorage.getItem("revenue_boost_visit_count") || "0");
      localStorage.setItem("revenue_boost_visit_count", (count + 1).toString());
    }
    getSessionId() {
      return this.sessionId;
    }
    getVisitorId() {
      return this.visitorId;
    }
    getVisitCount() {
      return parseInt(localStorage.getItem("revenue_boost_visit_count") || "1");
    }
    isReturningVisitor() {
      return this.getVisitCount() > 1;
    }
    /**
     * Check if campaign was dismissed by user
     * Server handles frequency capping via Redis
     */
    wasDismissed(campaignId) {
      return this.dismissedCampaigns.has(campaignId);
    }
    /**
     * Mark campaign as dismissed (user clicked close button)
     */
    markDismissed(campaignId) {
      this.dismissedCampaigns.add(campaignId);
      this.saveDismissedCampaigns();
    }
    getData() {
      return {
        sessionId: this.sessionId,
        visitorId: this.visitorId,
        visitCount: this.getVisitCount(),
        isReturningVisitor: this.isReturningVisitor(),
        dismissedCampaigns: Array.from(this.dismissedCampaigns)
      };
    }
    clear() {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(DISMISSED_KEY);
      this.dismissedCampaigns.clear();
      this.sessionId = this.initSessionId();
    }
  };
  var session = new SessionManager();

  // extensions/storefront-src/core/component-loader.ts
  var ComponentLoader = class {
    constructor(cfg = {}) {
      __publicField(this, "cache", /* @__PURE__ */ new Map());
      __publicField(this, "cfg");
      __publicField(this, "loadingPromises", /* @__PURE__ */ new Map());
      this.cfg = {
        timeoutMs: 8e3,
        debug: false,
        ...cfg
      };
    }
    log(...args) {
      if (this.cfg.debug) {
        console.log("[Revenue Boost Loader]", ...args);
      }
    }
    /**
     * Preload components (best-effort, ignores errors)
     */
    async preloadComponents(templateTypes) {
      const unique = Array.from(new Set(templateTypes));
      await Promise.all(
        unique.map(
          (type) => this.loadComponent(type).catch((err) => {
            this.log("Preload failed for", type, err?.message || err);
          })
        )
      );
    }
    /**
     * Load component by template type
     */
    async loadComponent(templateType) {
      const key = templateType;
      if (this.cache.has(key)) {
        this.log("Cache hit:", key);
        return this.cache.get(key);
      }
      if (this.loadingPromises.has(key)) {
        this.log("Already loading:", key);
        return this.loadingPromises.get(key);
      }
      const loadPromise = this._loadComponentInternal(key);
      this.loadingPromises.set(key, loadPromise);
      try {
        const component = await loadPromise;
        this.cache.set(key, component);
        return component;
      } finally {
        this.loadingPromises.delete(key);
      }
    }
    async _loadComponentInternal(key) {
      const fromGlobal = this.loadFromGlobal(key);
      if (fromGlobal) {
        this.cache.set(key, fromGlobal);
        return fromGlobal;
      }
      try {
        const fromDynamic = await this.loadViaDynamicImport(key);
        if (fromDynamic) {
          this.cache.set(key, fromDynamic);
          return fromDynamic;
        }
      } catch (err) {
        this.log("Dynamic import failed for", key, err);
      }
      if (this.cfg.baseUrl) {
        try {
          const fromScript = await this.loadViaScript(key);
          if (fromScript) {
            this.cache.set(key, fromScript);
            return fromScript;
          }
        } catch (err) {
          this.log("Script loading failed for", key, err);
        }
      }
      throw new Error(`Component for template '${key}' not found`);
    }
    /**
     * Load from global registry created by IIFE bundles
     */
    loadFromGlobal(key) {
      const g4 = globalThis;
      const reg = g4.RevenueBoostComponents;
      if (reg && reg[key]) {
        this.log("Loaded from global registry:", key);
        return reg[key];
      }
      return null;
    }
    /**
     * Use dynamic import to lazy-load modules during dev/build
     */
    async loadViaDynamicImport(key) {
      void key;
      if (true) {
        return null;
      }
      this.log("Dynamic import not available in production");
      return null;
    }
    /**
     * Load component via external script tag
     */
    async loadViaScript(key) {
      const bundleName = this.getBundleName(key);
      const url = `${this.cfg.baseUrl}/${bundleName}?v=${this.cfg.version || "1"}`;
      this.log("Loading script:", url);
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Timeout loading ${bundleName}`));
        }, this.cfg.timeoutMs);
        const script = document.createElement("script");
        script.src = url;
        script.async = true;
        script.onload = () => {
          clearTimeout(timeout);
          const component = this.loadFromGlobal(key);
          if (component) {
            resolve(component);
          } else {
            reject(new Error(`Component ${key} not registered after script load`));
          }
        };
        script.onerror = () => {
          clearTimeout(timeout);
          reject(new Error(`Failed to load script: ${url}`));
        };
        document.head.appendChild(script);
      });
    }
    getBundleName(key) {
      return `${key.toLowerCase().replace(/_/g, "-")}.bundle.js`;
    }
  };

  // extensions/storefront-src/core/PopupManagerPreact.tsx
  function getShopifyRoot() {
    try {
      const w3 = window;
      return w3?.Shopify?.routes?.root || "/";
    } catch {
      return "/";
    }
  }
  async function applyDiscountViaAjax(code) {
    if (!code) return false;
    try {
      const root = getShopifyRoot();
      const response = await fetch(`${root}cart/update.js`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({ discount: code })
      });
      if (!response.ok) {
        let message = "";
        try {
          message = await response.text();
        } catch {
        }
        console.error("[PopupManager] Failed to apply discount via AJAX:", message || response.status);
        return false;
      }
      try {
        const cart = await response.json();
        if (cart) {
          document.dispatchEvent(new CustomEvent("cart:refresh", { detail: cart }));
        }
      } catch {
      }
      document.dispatchEvent(new CustomEvent("cart:discount-applied", { detail: { code } }));
      document.dispatchEvent(new CustomEvent("cart:updated"));
      return true;
    } catch (error) {
      console.error("[PopupManager] Error applying discount via AJAX:", error);
      return false;
    }
  }
  function PopupManagerPreact({ campaign, onClose, onShow, loader, api }) {
    const [Component, setComponent] = d2(null);
    const [loading, setLoading] = d2(true);
    const [error, setError] = d2(null);
    y2(() => {
      let mounted = true;
      async function loadPopupComponent() {
        try {
          console.log("[PopupManager] Loading component for:", campaign.templateType);
          const comp = await loader.loadComponent(campaign.templateType);
          if (mounted) {
            setComponent(() => comp);
            setLoading(false);
            onShow?.(campaign.id);
          }
        } catch (err) {
          console.error("[PopupManager] Failed to load component:", err);
          if (mounted) {
            setError(err instanceof Error ? err.message : "Failed to load popup");
            setLoading(false);
          }
        }
      }
      loadPopupComponent();
      return () => {
        mounted = false;
      };
    }, [campaign.id, campaign.templateType, loader, onShow]);
    const handleSubmit = async (data) => {
      try {
        console.log("[PopupManager] Submitting lead:", data);
        const result = await api.submitLead({
          email: data.email,
          campaignId: campaign.id,
          sessionId: session.getSessionId(),
          visitorId: session.getVisitorId(),
          consent: data.gdprConsent,
          firstName: data.name
        });
        if (!result.success) {
          throw new Error(result.error || "Failed to submit lead");
        }
        console.log("[PopupManager] Lead submitted successfully:", result);
        if (result.freeGift) {
          try {
            console.log("[PopupManager] Adding free gift to cart:", result.freeGift);
            const variantId = result.freeGift.variantId.split("/").pop() || result.freeGift.variantId;
            const cartResponse = await fetch("/cart/add.js", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                items: [{
                  id: variantId,
                  quantity: result.freeGift.quantity
                }]
              })
            });
            if (!cartResponse.ok) {
              console.error("[PopupManager] Failed to add free gift to cart:", await cartResponse.text());
            } else {
              console.log("[PopupManager] Free gift added to cart successfully");
              document.dispatchEvent(new CustomEvent("cart:updated"));
              document.dispatchEvent(new CustomEvent("cart.requestUpdate"));
              if (typeof window !== "undefined") {
                const w3 = window;
                if (w3.Shopify?.theme?.cart) {
                  w3.Shopify.theme.cart.getCart?.();
                }
                if (w3.theme?.cart) {
                  w3.theme.cart.getCart?.();
                }
                fetch("/cart.js").then((res) => res.json()).then((cart) => {
                  document.dispatchEvent(new CustomEvent("cart:refresh", { detail: cart }));
                  const cartCount = document.querySelector(".cart-count, [data-cart-count], .cart__count");
                  if (cartCount && cart.item_count !== void 0) {
                    cartCount.textContent = String(cart.item_count);
                  }
                }).catch((err) => console.error("[PopupManager] Failed to fetch cart:", err));
              }
            }
          } catch (cartError) {
            console.error("[PopupManager] Error adding free gift to cart:", cartError);
          }
        }
        const discountCode = result.discountCode;
        const deliveryMode = campaign.discountConfig?.deliveryMode;
        const shouldAutoApply = !!discountCode && (deliveryMode === "auto_apply_only" || deliveryMode === "show_code_fallback");
        if (shouldAutoApply) {
          void applyDiscountViaAjax(discountCode);
        }
        return discountCode;
      } catch (err) {
        console.error("[PopupManager] Failed to submit lead:", err);
        throw err;
      }
    };
    const handleIssueDiscount = async (options) => {
      try {
        console.log("[PopupManager] Issuing discount for campaign:", campaign.id, options);
        const result = await api.issueDiscount({
          campaignId: campaign.id,
          sessionId: session.getSessionId(),
          cartSubtotalCents: options?.cartSubtotalCents
        });
        if (!result.success) {
          console.error("[PopupManager] Failed to issue discount:", result.error);
          return null;
        }
        const code = result.code;
        const autoApplyMode = result.autoApplyMode || "ajax";
        const deliveryMode = campaign.discountConfig?.deliveryMode;
        const shouldAutoApply = !!code && autoApplyMode !== "none" && (deliveryMode === "auto_apply_only" || deliveryMode === "show_code_fallback");
        if (shouldAutoApply) {
          void applyDiscountViaAjax(code);
        }
        return result;
      } catch (err) {
        console.error("[PopupManager] Error issuing discount:", err);
        return null;
      }
    };
    if (loading || !Component) {
      return null;
    }
    if (error) {
      console.error("[PopupManager] Error:", error);
      return null;
    }
    const currentCartTotal = (() => {
      try {
        const w3 = window;
        const raw = w3?.REVENUE_BOOST_CONFIG?.cartValue;
        const n2 = typeof raw === "string" ? parseFloat(raw) : typeof raw === "number" ? raw : 0;
        return Number.isFinite(n2) ? n2 : 0;
      } catch {
        return 0;
      }
    })();
    const handleEmailRecovery = async (email) => {
      try {
        console.log("[PopupManager] Email recovery for campaign:", campaign.id, { email });
        const cartSubtotalCents = typeof currentCartTotal === "number" && Number.isFinite(currentCartTotal) ? Math.round(currentCartTotal * 100) : void 0;
        const result = await api.emailRecovery({
          campaignId: campaign.id,
          email,
          cartSubtotalCents
        });
        if (!result.success) {
          console.error("[PopupManager] Email recovery failed:", result.error);
          throw new Error(result.error || "Email recovery failed");
        }
        const code = result.discountCode;
        const autoApplyMode = result.autoApplyMode || "ajax";
        const deliveryMode = campaign.discountConfig?.deliveryMode;
        const shouldAutoApply = !!code && autoApplyMode !== "none" && (deliveryMode === "auto_apply_only" || deliveryMode === "show_code_fallback");
        if (shouldAutoApply && code) {
          void applyDiscountViaAjax(code);
        }
        if (deliveryMode === "show_code_always" || deliveryMode === "show_in_popup_authorized_only") {
          return code || void 0;
        }
        const root = getShopifyRoot();
        const contentConfig = campaign.contentConfig || {};
        const configuredUrl = typeof contentConfig.ctaUrl === "string" && contentConfig.ctaUrl.trim() !== "" ? contentConfig.ctaUrl : "checkout";
        const normalizedPath = configuredUrl.replace(/^\//, "");
        window.location.href = `${root}${normalizedPath}`;
        return code || void 0;
      } catch (error2) {
        console.error("[PopupManager] Error during email recovery flow:", error2);
        throw error2;
      }
    };
    const [upsellProducts, setUpsellProducts] = d2(null);
    y2(() => {
      if (campaign.templateType !== "PRODUCT_UPSELL") {
        return;
      }
      let cancelled = false;
      const loadUpsellProducts = async () => {
        try {
          const url = `/apps/revenue-boost/api/upsell-products?campaignId=${encodeURIComponent(campaign.id)}`;
          const res = await fetch(url, { credentials: "same-origin" });
          if (!res.ok) {
            console.warn("[PopupManager] Upsell products request failed:", res.status);
            return;
          }
          const json = await res.json();
          if (!cancelled) {
            setUpsellProducts(Array.isArray(json.products) ? json.products : []);
          }
        } catch (err) {
          console.error("[PopupManager] Failed to load upsell products:", err);
        }
      };
      void loadUpsellProducts();
      return () => {
        cancelled = true;
      };
    }, [campaign.id, campaign.templateType]);
    try {
      console.log("[PopupManagerPreact] Rendering campaign", {
        id: campaign.id,
        templateType: campaign.templateType,
        contentConfig: campaign.contentConfig,
        designConfig: campaign.designConfig
      });
    } catch {
    }
    return _(Component, {
      config: {
        ...campaign.contentConfig,
        ...campaign.designConfig,
        id: campaign.id,
        currentCartTotal,
        // Pass discount config if enabled
        discount: campaign.discountConfig?.enabled ? {
          enabled: true,
          code: campaign.discountConfig.code || "",
          percentage: campaign.discountConfig.valueType === "PERCENTAGE" || campaign.discountConfig.type === "percentage" ? campaign.discountConfig.value : void 0,
          value: campaign.discountConfig.valueType === "FIXED_AMOUNT" || campaign.discountConfig.type === "fixed_amount" ? campaign.discountConfig.value : void 0,
          type: campaign.discountConfig.valueType || campaign.discountConfig.type,
          deliveryMode: campaign.discountConfig.deliveryMode,
          expiryDays: campaign.discountConfig.expiryDays,
          description: campaign.discountConfig.description
        } : void 0,
        // If we have upsell products, inject them so ProductUpsellPopup can render them
        ...upsellProducts ? { products: upsellProducts } : {}
      },
      isVisible: true,
      onClose,
      onSubmit: handleSubmit,
      issueDiscount: handleIssueDiscount,
      campaignId: campaign.id,
      renderInline: false,
      onEmailRecovery: handleEmailRecovery
    });
  }
  function renderPopup(campaign, onClose, loader, api, onShow) {
    const container = document.createElement("div");
    container.id = `revenue-boost-popup-${campaign.id}`;
    document.body.appendChild(container);
    G(
      _(PopupManagerPreact, {
        campaign,
        onClose: () => {
          onClose();
          cleanup();
        },
        onShow,
        loader,
        api
      }),
      container
    );
    function cleanup() {
      G(null, container);
      container.remove();
    }
    return cleanup;
  }

  // extensions/storefront-src/triggers/ExitIntentDetector.ts
  var ExitIntentDetector = class {
    constructor(config = {}) {
      __publicField(this, "config");
      __publicField(this, "callback", null);
      __publicField(this, "active", false);
      __publicField(this, "triggered", false);
      __publicField(this, "startTime", 0);
      __publicField(this, "mouseMoveHandler", null);
      this.config = {
        sensitivity: config.sensitivity || "medium",
        delay: config.delay || 1e3,
        mobileEnabled: config.mobileEnabled || false
      };
    }
    /**
     * Start detecting exit intent
     */
    start(callback) {
      if (this.active) {
        return;
      }
      if (this.isMobile() && !this.config.mobileEnabled) {
        return;
      }
      this.callback = callback;
      this.active = true;
      this.triggered = false;
      this.startTime = Date.now();
      this.mouseMoveHandler = this.handleMouseMove.bind(this);
      document.addEventListener("mousemove", this.mouseMoveHandler);
    }
    /**
     * Stop detecting exit intent
     */
    stop() {
      if (!this.active) {
        return;
      }
      this.active = false;
      if (this.mouseMoveHandler) {
        document.removeEventListener("mousemove", this.mouseMoveHandler);
        this.mouseMoveHandler = null;
      }
    }
    /**
     * Check if detector is active
     */
    isActive() {
      return this.active;
    }
    /**
     * Cleanup and remove all listeners
     */
    destroy() {
      this.stop();
      this.callback = null;
    }
    /**
     * Handle mouse move events
     */
    handleMouseMove(e3) {
      if (!this.active || this.triggered) {
        return;
      }
      const elapsed = Date.now() - this.startTime;
      if (elapsed < this.config.delay) {
        return;
      }
      if (this.isExitIntent(e3)) {
        this.trigger();
      }
    }
    /**
     * Check if mouse movement indicates exit intent
     */
    isExitIntent(e3) {
      const threshold = this.getSensitivityThreshold();
      return e3.clientY <= threshold;
    }
    /**
     * Get sensitivity threshold in pixels
     */
    getSensitivityThreshold() {
      switch (this.config.sensitivity) {
        case "low":
          return 5;
        // Very close to edge
        case "medium":
          return 20;
        // Default
        case "high":
          return 50;
        // Further from edge
        default:
          return 20;
      }
    }
    /**
     * Trigger the callback
     */
    trigger() {
      if (this.triggered || !this.callback) {
        return;
      }
      this.triggered = true;
      this.callback();
      this.stop();
    }
    /**
     * Check if device is mobile
     */
    isMobile() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    }
  };

  // extensions/storefront-src/triggers/ScrollDepthTracker.ts
  var ScrollDepthTracker = class {
    constructor(config = {}) {
      __publicField(this, "config");
      __publicField(this, "callback", null);
      __publicField(this, "active", false);
      __publicField(this, "triggered", false);
      __publicField(this, "scrollHandler", null);
      __publicField(this, "debounceTimer", null);
      this.config = {
        depthPercentage: config.depthPercentage || 50,
        direction: config.direction || "down",
        debounceTime: config.debounceTime || 100
      };
    }
    /**
     * Start tracking scroll depth
     */
    start(callback) {
      if (this.active) {
        return;
      }
      this.callback = callback;
      this.active = true;
      this.triggered = false;
      this.scrollHandler = this.handleScroll.bind(this);
      window.addEventListener("scroll", this.scrollHandler, { passive: true });
    }
    /**
     * Stop tracking scroll depth
     */
    stop() {
      if (!this.active) {
        return;
      }
      this.active = false;
      if (this.scrollHandler) {
        window.removeEventListener("scroll", this.scrollHandler, false);
        this.scrollHandler = null;
      }
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }
    }
    /**
     * Check if tracker is active
     */
    isActive() {
      return this.active;
    }
    /**
     * Get current scroll depth percentage
     */
    getCurrentScrollDepth() {
      const scrollTop = window.scrollY || window.pageYOffset;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const scrollableHeight = scrollHeight - clientHeight;
      if (scrollableHeight <= 0) {
        return 0;
      }
      const scrollPercentage = scrollTop / scrollableHeight * 100;
      return Math.min(100, Math.max(0, Math.round(scrollPercentage)));
    }
    /**
     * Check if target depth has been reached
     */
    hasReachedDepth() {
      const currentDepth = this.getCurrentScrollDepth();
      return currentDepth >= this.config.depthPercentage;
    }
    /**
     * Cleanup and remove all listeners
     */
    destroy() {
      this.stop();
      this.callback = null;
    }
    /**
     * Handle scroll events (debounced)
     */
    handleScroll(e3) {
      if (!this.active || this.triggered) {
        return;
      }
      void e3;
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = window.setTimeout(() => {
        this.checkScrollDepth();
      }, this.config.debounceTime);
    }
    /**
     * Check if scroll depth threshold is met
     */
    checkScrollDepth() {
      if (!this.active || this.triggered) {
        return;
      }
      if (this.hasReachedDepth()) {
        this.trigger();
      }
    }
    /**
     * Trigger the callback
     */
    trigger() {
      if (this.triggered || !this.callback) {
        return;
      }
      this.triggered = true;
      this.callback();
      this.stop();
    }
  };

  // extensions/storefront-src/triggers/TimeDelayHandler.ts
  var TimeDelayHandler = class {
    constructor(config = {}) {
      __publicField(this, "config");
      __publicField(this, "callback", null);
      __publicField(this, "active", false);
      __publicField(this, "paused", false);
      __publicField(this, "triggered", false);
      __publicField(this, "timer", null);
      __publicField(this, "startTime", 0);
      __publicField(this, "remainingTime", 0);
      this.config = {
        delay: config.delay || 3e3
        // Default 3 seconds
      };
    }
    /**
     * Start the delay timer
     */
    start(callback) {
      if (this.active) {
        return;
      }
      this.callback = callback;
      this.active = true;
      this.triggered = false;
      this.paused = false;
      this.startTime = Date.now();
      this.remainingTime = this.config.delay;
      this.scheduleCallback();
    }
    /**
     * Stop the timer
     */
    stop() {
      if (!this.active) {
        return;
      }
      this.active = false;
      this.paused = false;
      if (this.timer !== null) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    }
    /**
     * Pause the timer
     */
    pause() {
      if (!this.active || this.paused) {
        return;
      }
      this.paused = true;
      const elapsed = Date.now() - this.startTime;
      this.remainingTime = Math.max(0, this.config.delay - elapsed);
      if (this.timer !== null) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    }
    /**
     * Resume the timer
     */
    resume() {
      if (!this.active || !this.paused) {
        return;
      }
      this.paused = false;
      this.startTime = Date.now();
      this.scheduleCallback();
    }
    /**
     * Check if handler is active
     */
    isActive() {
      return this.active;
    }
    /**
     * Check if handler is paused
     */
    isPaused() {
      return this.paused;
    }
    /**
     * Get remaining time in milliseconds
     */
    getRemainingTime() {
      if (!this.active) {
        return 0;
      }
      if (this.paused) {
        return this.remainingTime;
      }
      const elapsed = Date.now() - this.startTime;
      return Math.max(0, this.config.delay - elapsed);
    }
    /**
     * Cleanup and remove timer
     */
    destroy() {
      this.stop();
      this.callback = null;
    }
    /**
     * Schedule the callback
     */
    scheduleCallback() {
      const delay = this.paused ? this.remainingTime : this.config.delay;
      this.timer = window.setTimeout(() => {
        this.trigger();
      }, delay);
    }
    /**
     * Trigger the callback
     */
    trigger() {
      if (this.triggered || !this.callback) {
        return;
      }
      this.triggered = true;
      this.callback();
      this.stop();
    }
  };

  // extensions/storefront-src/triggers/IdleTimer.ts
  var IdleTimer = class {
    constructor(config = {}) {
      __publicField(this, "config");
      __publicField(this, "callback", null);
      __publicField(this, "active", false);
      __publicField(this, "triggered", false);
      __publicField(this, "timer", null);
      __publicField(this, "lastActivityTime", 0);
      __publicField(this, "activityHandler", null);
      this.config = {
        idleDuration: config.idleDuration || 3e4,
        // Default 30 seconds
        events: config.events || [
          "mousemove",
          "mousedown",
          "keypress",
          "scroll",
          "touchstart",
          "click"
        ]
      };
    }
    /**
     * Start the idle timer
     */
    start(callback) {
      if (this.active) {
        return;
      }
      this.callback = callback;
      this.active = true;
      this.triggered = false;
      this.lastActivityTime = Date.now();
      this.activityHandler = this.handleActivity.bind(this);
      this.config.events.forEach((event) => {
        document.addEventListener(event, this.activityHandler, { passive: true });
      });
      this.resetTimer();
    }
    /**
     * Stop the idle timer
     */
    stop() {
      if (!this.active) {
        return;
      }
      this.active = false;
      if (this.activityHandler) {
        this.config.events.forEach((event) => {
          document.removeEventListener(event, this.activityHandler, false);
        });
        this.activityHandler = null;
      }
      if (this.timer !== null) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    }
    /**
     * Check if timer is active
     */
    isActive() {
      return this.active;
    }
    /**
     * Get current idle time in milliseconds
     */
    getIdleTime() {
      if (!this.active) {
        return 0;
      }
      return Date.now() - this.lastActivityTime;
    }
    /**
     * Cleanup and remove all listeners
     */
    destroy() {
      this.stop();
      this.callback = null;
    }
    /**
     * Handle user activity
     */
    handleActivity(e3) {
      if (!this.active || this.triggered) {
        return;
      }
      void e3;
      this.lastActivityTime = Date.now();
      this.resetTimer();
    }
    /**
     * Reset the idle timer
     */
    resetTimer() {
      if (this.timer !== null) {
        clearTimeout(this.timer);
      }
      this.timer = window.setTimeout(() => {
        this.trigger();
      }, this.config.idleDuration);
    }
    /**
     * Trigger the callback
     */
    trigger() {
      if (this.triggered || !this.callback) {
        return;
      }
      this.triggered = true;
      this.callback();
      this.stop();
    }
  };

  // extensions/storefront-src/triggers/CartEventListener.ts
  function isCartUpdateDetail(v3) {
    return v3 != null && typeof v3 === "object" && typeof v3.total === "number";
  }
  var CartEventListener = class {
    constructor(config = {}) {
      __publicField(this, "config");
      __publicField(this, "callback", null);
      __publicField(this, "active", false);
      __publicField(this, "eventHandlers", /* @__PURE__ */ new Map());
      __publicField(this, "cartJsUnsubscribeFns", []);
      // Shopify cart event names (different themes use different events)
      __publicField(this, "CART_EVENT_MAPPINGS", {
        // Add to cart events
        add_to_cart: [
          "cart:add",
          "product:add",
          "cart:item-added",
          "theme:cart:add"
        ],
        // Cart drawer open events
        cart_drawer_open: [
          "cart:open",
          "drawer:open",
          "cart:drawer:open",
          "theme:cart:open"
        ],
        // Cart update events
        cart_update: [
          "cart:update",
          "cart:change",
          "cart:updated",
          "theme:cart:update"
        ]
      });
      this.config = {
        events: config.events || ["add_to_cart", "cart_drawer_open", "cart_update"],
        trackCartValue: config.trackCartValue || false,
        minCartValue: config.minCartValue || 0,
        maxCartValue: config.maxCartValue || Infinity
      };
    }
    /**
     * Start listening for cart events
     */
    start(callback) {
      if (this.active) {
        return;
      }
      this.callback = callback;
      this.active = true;
      this.config.events.forEach((eventType) => {
        this.listenForEventType(eventType);
      });
      this.attachCartJsListeners();
    }
    /**
     * Stop listening for cart events
     */
    stop() {
      if (!this.active) {
        return;
      }
      this.active = false;
      this.eventHandlers.forEach((handler, eventName) => {
        document.removeEventListener(eventName, handler);
      });
      this.eventHandlers.clear();
      this.cartJsUnsubscribeFns.forEach((fn2) => fn2());
      this.cartJsUnsubscribeFns = [];
    }
    /**
     * Check if listener is active
     */
    isActive() {
      return this.active;
    }
    /**
     * Cleanup and remove all listeners
     */
    destroy() {
      this.stop();
      this.callback = null;
    }
    /**
     * Listen for a specific event type
     */
    listenForEventType(eventType) {
      const eventNames = this.CART_EVENT_MAPPINGS[eventType];
      eventNames.forEach((eventName) => {
        const handler = (e3) => this.handleCartEvent(eventType, e3);
        this.eventHandlers.set(eventName, handler);
        document.addEventListener(eventName, handler);
      });
    }
    /**
     * Emit a cart event from a raw detail payload (used by both DOM events and CartJS)
     */
    emitCartEventFromDetail(eventType, detail) {
      if (!this.active || !this.callback) {
        return;
      }
      if (this.config.trackCartValue && eventType === "cart_update") {
        let cartValue = 0;
        if (isCartUpdateDetail(detail)) {
          cartValue = detail.total ?? 0;
        }
        if (cartValue < this.config.minCartValue || cartValue > this.config.maxCartValue) {
          return;
        }
      }
      this.callback({
        type: eventType,
        detail
      });
    }
    /**
     * Handle cart event from DOM CustomEvent
     */
    handleCartEvent(eventType, e3) {
      const customEvent = e3;
      this.emitCartEventFromDetail(eventType, customEvent.detail);
    }
    /**
     * Integrate with CartJS (open-source cart.js library) when present on the page.
     * This captures real cart.js events like `item:added` and `cart:updated`.
     */
    attachCartJsListeners() {
      if (typeof window === "undefined") {
        return;
      }
      const w3 = window;
      const cartJs = w3.CartJS;
      if (!cartJs || typeof cartJs.on !== "function") {
        return;
      }
      if (this.config.events.includes("add_to_cart")) {
        const handler = (cart, item) => {
          this.emitCartEventFromDetail("add_to_cart", { cart, item });
        };
        cartJs.on("item:added", handler);
        if (typeof cartJs.off === "function") {
          this.cartJsUnsubscribeFns.push(() => cartJs.off("item:added", handler));
        }
      }
      if (this.config.events.includes("cart_update")) {
        const handler = (cart) => {
          const total = cart && typeof cart.total_price === "number" ? cart.total_price / 100 : void 0;
          this.emitCartEventFromDetail("cart_update", {
            total,
            cart
          });
        };
        cartJs.on("cart:updated", handler);
        if (typeof cartJs.off === "function") {
          this.cartJsUnsubscribeFns.push(() => cartJs.off("cart:updated", handler));
        }
      }
    }
  };

  // extensions/storefront-src/triggers/CustomEventHandler.ts
  function isObject(v3) {
    return v3 != null && typeof v3 === "object";
  }
  var CustomEventHandler = class {
    constructor(config = {}) {
      __publicField(this, "config");
      __publicField(this, "callback", null);
      __publicField(this, "active", false);
      __publicField(this, "eventHandlers", /* @__PURE__ */ new Map());
      this.config = {
        eventNames: config.eventNames || []
      };
    }
    /**
     * Start listening for custom events
     */
    start(callback) {
      if (this.active) {
        return;
      }
      this.callback = callback;
      this.active = true;
      this.config.eventNames.forEach((eventName) => {
        this.addEventListenerForName(eventName);
      });
    }
    /**
     * Stop listening for custom events
     */
    stop() {
      if (!this.active) {
        return;
      }
      this.active = false;
      this.eventHandlers.forEach((handler, eventName) => {
        document.removeEventListener(eventName, handler);
      });
      this.eventHandlers.clear();
    }
    /**
     * Check if handler is active
     */
    isActive() {
      return this.active;
    }
    /**
     * Add a new event name to listen for (dynamically)
     */
    addEventName(eventName) {
      if (!this.config.eventNames.includes(eventName)) {
        this.config.eventNames.push(eventName);
      }
      if (this.active) {
        this.addEventListenerForName(eventName);
      }
    }
    /**
     * Remove an event name from listening (dynamically)
     */
    removeEventName(eventName) {
      const index = this.config.eventNames.indexOf(eventName);
      if (index > -1) {
        this.config.eventNames.splice(index, 1);
      }
      if (this.active && this.eventHandlers.has(eventName)) {
        const handler = this.eventHandlers.get(eventName);
        document.removeEventListener(eventName, handler);
        this.eventHandlers.delete(eventName);
      }
    }
    /**
     * Cleanup and remove all listeners
     */
    destroy() {
      this.stop();
      this.callback = null;
    }
    /**
     * Add event listener for a specific event name
     */
    addEventListenerForName(eventName) {
      if (this.eventHandlers.has(eventName)) {
        return;
      }
      const handler = (e3) => this.handleCustomEvent(eventName, e3);
      this.eventHandlers.set(eventName, handler);
      document.addEventListener(eventName, handler);
    }
    /**
     * Handle custom event
     */
    handleCustomEvent(eventName, e3) {
      if (!this.active || !this.callback) {
        return;
      }
      const customEvent = e3;
      const rawDetail = customEvent.detail;
      const detail = isObject(rawDetail) ? rawDetail : {};
      this.callback({
        eventName,
        detail
      });
    }
  };

  // extensions/storefront-src/core/TriggerManager.ts
  var TriggerManager = class {
    constructor() {
      __publicField(this, "cleanupFunctions", []);
      __publicField(this, "exitIntentDetector", null);
      __publicField(this, "scrollDepthTracker", null);
      __publicField(this, "timeDelayHandler", null);
      __publicField(this, "idleTimer", null);
      __publicField(this, "cartEventListener", null);
      __publicField(this, "customEventHandler", null);
    }
    /**
     * Evaluate all triggers for a campaign
     * Returns true if campaign should be shown
     */
    async evaluateTriggers(campaign) {
      const triggers = campaign.clientTriggers?.enhancedTriggers;
      console.log("[Revenue Boost] \u{1F3AF} Evaluating triggers for campaign:", campaign.id);
      if (!triggers || Object.keys(triggers).length === 0) {
        console.log("[Revenue Boost] \u2705 No triggers defined, showing campaign immediately");
        return true;
      }
      const logicOperator = triggers.trigger_combination?.operator || triggers.logic_operator || "AND";
      console.log("[Revenue Boost] \u{1F517} Trigger logic operator:", logicOperator);
      const results = [];
      const triggerResults = {};
      if (triggers.page_load !== void 0) {
        if (triggers.page_load.enabled) {
          console.log("[Revenue Boost] \u{1F4C4} Checking page_load trigger:", triggers.page_load);
          const result = await this.checkPageLoad(triggers.page_load);
          triggerResults.page_load = result;
          results.push(result);
          console.log(
            `[Revenue Boost] ${result ? "\u2705" : "\u274C"} page_load trigger ${result ? "passed" : "failed"}`
          );
        } else {
          console.log(
            "[Revenue Boost] \u23ED\uFE0F page_load trigger is disabled and will be ignored in evaluation"
          );
        }
      }
      if (triggers.time_delay !== void 0) {
        if (triggers.time_delay.enabled) {
          console.log("[Revenue Boost] \u23F3 Checking time_delay trigger:", triggers.time_delay);
          const result = await this.checkTimeDelay(triggers.time_delay);
          triggerResults.time_delay = result;
          results.push(result);
          console.log(
            `[Revenue Boost] ${result ? "\u2705" : "\u274C"} time_delay trigger ${result ? "passed" : "failed"}`
          );
        } else {
          console.log(
            "[Revenue Boost] \u23ED\uFE0F time_delay trigger is disabled and will be ignored in evaluation"
          );
        }
      }
      if (triggers.scroll_depth !== void 0) {
        if (triggers.scroll_depth.enabled) {
          console.log("[Revenue Boost] \u{1F4DC} Checking scroll_depth trigger:", triggers.scroll_depth);
          const result = await this.checkScrollDepth(triggers.scroll_depth);
          triggerResults.scroll_depth = result;
          results.push(result);
          console.log(
            `[Revenue Boost] ${result ? "\u2705" : "\u274C"} scroll_depth trigger ${result ? "passed" : "failed"}`
          );
        } else {
          console.log(
            "[Revenue Boost] \u23ED\uFE0F scroll_depth trigger is disabled and will be ignored in evaluation"
          );
        }
      }
      if (triggers.exit_intent !== void 0) {
        if (triggers.exit_intent.enabled) {
          console.log("[Revenue Boost] \u{1F6AA} Checking exit_intent trigger:", triggers.exit_intent);
          const result = await this.checkExitIntent(triggers.exit_intent);
          triggerResults.exit_intent = result;
          results.push(result);
          console.log(
            `[Revenue Boost] ${result ? "\u2705" : "\u274C"} exit_intent trigger ${result ? "passed" : "failed"}`
          );
        } else {
          console.log(
            "[Revenue Boost] \u23ED\uFE0F exit_intent trigger is disabled and will be ignored in evaluation"
          );
        }
      }
      if (triggers.idle_timer !== void 0) {
        if (triggers.idle_timer.enabled) {
          console.log("[Revenue Boost] \u23F1\uFE0F Checking idle_timer trigger:", triggers.idle_timer);
          const result = await this.checkIdleTimer(triggers.idle_timer);
          triggerResults.idle_timer = result;
          results.push(result);
          console.log(
            `[Revenue Boost] ${result ? "\u2705" : "\u274C"} idle_timer trigger ${result ? "passed" : "failed"}`
          );
        } else {
          console.log(
            "[Revenue Boost] \u23ED\uFE0F idle_timer trigger is disabled and will be ignored in evaluation"
          );
        }
      }
      if (triggers.add_to_cart !== void 0) {
        if (triggers.add_to_cart.enabled) {
          console.log("[Revenue Boost] \u{1F6D2} Checking add_to_cart trigger:", triggers.add_to_cart);
          const result = await this.checkAddToCart(triggers.add_to_cart);
          triggerResults.add_to_cart = result;
          results.push(result);
          console.log(
            `[Revenue Boost] ${result ? "\u2705" : "\u274C"} add_to_cart trigger ${result ? "passed" : "failed"}`
          );
        } else {
          console.log(
            "[Revenue Boost] \u23ED\uFE0F add_to_cart trigger is disabled and will be ignored in evaluation"
          );
        }
      }
      if (triggers.cart_drawer_open !== void 0) {
        if (triggers.cart_drawer_open.enabled) {
          console.log(
            "[Revenue Boost] \u{1F9FA} Checking cart_drawer_open trigger:",
            triggers.cart_drawer_open
          );
          const result = await this.checkCartDrawerOpen(triggers.cart_drawer_open);
          triggerResults.cart_drawer_open = result;
          results.push(result);
          console.log(
            `[Revenue Boost] ${result ? "\u2705" : "\u274C"} cart_drawer_open trigger ${result ? "passed" : "failed"}`
          );
        } else {
          console.log(
            "[Revenue Boost] \u23ED\uFE0F cart_drawer_open trigger is disabled and will be ignored in evaluation"
          );
        }
      }
      if (triggers.cart_value !== void 0) {
        if (triggers.cart_value.enabled) {
          console.log("[Revenue Boost] \u{1F4B0} Checking cart_value trigger:", triggers.cart_value);
          const result = await this.checkCartValue(triggers.cart_value);
          triggerResults.cart_value = result;
          results.push(result);
          console.log(
            `[Revenue Boost] ${result ? "\u2705" : "\u274C"} cart_value trigger ${result ? "passed" : "failed"}`
          );
        } else {
          console.log(
            "[Revenue Boost] \u23ED\uFE0F cart_value trigger is disabled and will be ignored in evaluation"
          );
        }
      }
      if (triggers.product_view !== void 0) {
        if (triggers.product_view.enabled) {
          console.log("[Revenue Boost] \u{1F6CD}\uFE0F Checking product_view trigger:", triggers.product_view);
          const result = await this.checkProductView(triggers.product_view);
          triggerResults.product_view = result;
          results.push(result);
          console.log(
            `[Revenue Boost] ${result ? "\u2705" : "\u274C"} product_view trigger ${result ? "passed" : "failed"}`
          );
        } else {
          console.log(
            "[Revenue Boost] \u23ED\uFE0F product_view trigger is disabled and will be ignored in evaluation"
          );
        }
      }
      if (triggers.custom_event !== void 0) {
        if (triggers.custom_event.enabled) {
          console.log("[Revenue Boost] \u{1F3AF} Checking custom_event trigger:", triggers.custom_event);
          const result = await this.checkCustomEvent(triggers.custom_event);
          triggerResults.custom_event = result;
          results.push(result);
          console.log(
            `[Revenue Boost] ${result ? "\u2705" : "\u274C"} custom_event trigger ${result ? "passed" : "failed"}`
          );
        } else {
          console.log(
            "[Revenue Boost] \u23ED\uFE0F custom_event trigger is disabled and will be ignored in evaluation"
          );
        }
      }
      if (results.length === 0) {
        console.log("[Revenue Boost] \u26A0\uFE0F No enabled triggers found, showing campaign immediately");
        return true;
      }
      let finalResult;
      if (logicOperator === "OR") {
        finalResult = results.some((r3) => r3 === true);
        console.log("[Revenue Boost] \u{1F500} OR logic: At least one trigger must pass");
      } else {
        finalResult = results.every((r3) => r3 === true);
        console.log("[Revenue Boost] \u{1F517} AND logic: All triggers must pass");
      }
      console.log("[Revenue Boost] \u{1F4CA} Trigger evaluation summary:", triggerResults);
      if (!finalResult) {
        console.log("[Revenue Boost] \u274C Campaign will not show - trigger conditions failed");
        return false;
      }
      const sessionRules = campaign.clientTriggers?.sessionRules;
      if (sessionRules && sessionRules.enabled && sessionRules.conditions && sessionRules.conditions.length > 0) {
        const sessionOk = this.evaluateSessionRules(sessionRules);
        console.log(
          `[Revenue Boost] ${sessionOk ? "\u2705" : "\u274C"} Session rules ${sessionOk ? "passed" : "failed"} for campaign ${campaign.id}`
        );
        if (!sessionOk) {
          return false;
        }
      }
      console.log(
        `[Revenue Boost] \u2705 CAMPAIGN WILL SHOW - Final result: triggers + session rules passed for ${campaign.id}`
      );
      return true;
    }
    /**
     * Evaluate session-level rules (SessionTrigger) using live client context.
     * This mirrors AudienceTargetingConfig.sessionRules on the server.
     */
    evaluateSessionRules(sessionRules) {
      const conditions = sessionRules.conditions || [];
      if (!sessionRules.enabled || conditions.length === 0) {
        return true;
      }
      const ctx = this.buildRuntimeContext();
      const op = sessionRules.logicOperator || "AND";
      const results = conditions.map((cond) => this.evaluateSessionCondition(cond, ctx));
      if (op === "OR") {
        return results.some(Boolean);
      }
      return results.every(Boolean);
    }
    /**
     * Minimal runtime context available on the storefront for session rules.
     * Currently supports cartValue and cartItemCount via Shopify global cart.
     */
    buildRuntimeContext() {
      const ctx = {};
      const w3 = window;
      if (w3.Shopify && w3.Shopify.cart) {
        const cart = w3.Shopify.cart;
        ctx.cartValue = typeof cart.total_price === "number" ? cart.total_price / 100 : void 0;
        ctx.cartItemCount = typeof cart.item_count === "number" ? cart.item_count : void 0;
      }
      return ctx;
    }
    /**
     * Evaluate a single session condition against the runtime context.
     */
    evaluateSessionCondition(condition, ctx) {
      const field = condition.field;
      let value;
      switch (field) {
        case "cart-item-count":
        case "cartItemCount": {
          value = ctx.cartItemCount;
          break;
        }
        case "cart-value":
        case "cartValue": {
          value = ctx.cartValue;
          break;
        }
        default: {
          console.log(
            "[Revenue Boost] \u26A0\uFE0F Unknown session rule field, skipping condition:",
            field
          );
          return true;
        }
      }
      if (value == null) {
        return false;
      }
      const op = condition.operator;
      const target = condition.value;
      const asNumber = (v3) => {
        if (typeof v3 === "number") return v3;
        if (typeof v3 === "string") {
          const parsed = parseFloat(v3);
          return Number.isNaN(parsed) ? NaN : parsed;
        }
        return NaN;
      };
      const valNum = asNumber(value);
      const targetNum = asNumber(target);
      switch (op) {
        case "gt":
          return valNum > targetNum;
        case "gte":
          return valNum >= targetNum;
        case "lt":
          return valNum < targetNum;
        case "lte":
          return valNum <= targetNum;
        case "eq":
          return value === target;
        case "ne":
          return value !== target;
        case "in": {
          const arr = Array.isArray(target) ? target : [target];
          return arr.includes(value);
        }
        case "nin": {
          const arr = Array.isArray(target) ? target : [target];
          return !arr.includes(value);
        }
        default:
          return true;
      }
    }
    /**
     * Check page load trigger
     */
    async checkPageLoad(trigger) {
      if (!trigger.enabled) {
        console.log("[Revenue Boost] \u23ED\uFE0F page_load trigger is disabled");
        return false;
      }
      const delay = trigger.delay || 0;
      console.log(`[Revenue Boost] \u23F3 page_load trigger waiting ${delay}ms before showing`);
      if (delay > 0) {
        await this.delay(delay);
      }
      console.log("[Revenue Boost] \u2705 page_load trigger delay completed");
      return true;
    }
    /**
     * Check time delay trigger
     */
    async checkTimeDelay(trigger) {
      if (!trigger.enabled) {
        console.log("[Revenue Boost] \u23ED\uFE0F time_delay trigger is disabled");
        return false;
      }
      const delaySeconds = trigger.delay ?? 0;
      const immediate = trigger.immediate ?? false;
      if (immediate || delaySeconds <= 0) {
        console.log("[Revenue Boost] \u2705 time_delay trigger passed immediately (no delay configured)");
        return true;
      }
      const delayMs = delaySeconds * 1e3;
      console.log(
        `[Revenue Boost] \u23F3 time_delay trigger waiting ${delaySeconds}s (${delayMs}ms) before showing`
      );
      return new Promise((resolve) => {
        this.timeDelayHandler = new TimeDelayHandler({
          delay: delayMs
        });
        this.timeDelayHandler.start(() => {
          console.log("[Revenue Boost] \u2705 time_delay trigger delay completed");
          resolve(true);
        });
      });
    }
    /**
     * Check scroll depth trigger
     */
    async checkScrollDepth(trigger) {
      if (!trigger.enabled) {
        console.log("[Revenue Boost] \u23ED\uFE0F scroll_depth trigger is disabled");
        return false;
      }
      const depthPercentage = trigger.depth_percentage || 50;
      const direction = trigger.direction || "down";
      const debounceTime = trigger.debounce_time ?? 100;
      console.log(
        `[Revenue Boost] \u{1F4CF} scroll_depth trigger waiting for ${depthPercentage}% scroll ${direction} (debounce=${debounceTime}ms)`
      );
      return new Promise((resolve) => {
        this.scrollDepthTracker = new ScrollDepthTracker({
          depthPercentage,
          direction,
          debounceTime
        });
        this.scrollDepthTracker.start(() => {
          console.log(`[Revenue Boost] \u2705 scroll_depth trigger detected: User scrolled ${depthPercentage}% ${direction}`);
          resolve(true);
        });
        if (this.scrollDepthTracker.hasReachedDepth()) {
          console.log(`[Revenue Boost] \u2705 scroll_depth trigger already met: User already at ${depthPercentage}% depth`);
          this.scrollDepthTracker.destroy();
          resolve(true);
        }
      });
    }
    /**
     * Check exit intent trigger
     */
    async checkExitIntent(trigger) {
      if (!trigger.enabled) {
        console.log("[Revenue Boost] \u23ED\uFE0F exit_intent trigger is disabled");
        return false;
      }
      const sensitivity = trigger.sensitivity || "medium";
      const delay = trigger.delay || 1e3;
      const mobileEnabled = trigger.mobile_enabled ?? false;
      console.log(
        `[Revenue Boost] \u{1F6AA} exit_intent trigger waiting for exit intent (sensitivity: ${sensitivity}, delay: ${delay}ms, mobileEnabled=${mobileEnabled})`
      );
      return new Promise((resolve) => {
        this.exitIntentDetector = new ExitIntentDetector({
          sensitivity,
          delay,
          mobileEnabled
        });
        this.exitIntentDetector.start(() => {
          console.log("[Revenue Boost] \u2705 exit_intent trigger detected: User showed exit intent");
          resolve(true);
        });
      });
    }
    /**
     * Check product view trigger
     * - Ensures we are on a product page
     * - Optionally matches against configured product_ids (Shopify GIDs)
     * - Supports time on page and scroll interaction requirements
     */
    async checkProductView(trigger) {
      if (!trigger.enabled) {
        console.log("[Revenue Boost] \u23ED\uFE0F product_view trigger is disabled");
        return false;
      }
      const { isProductPage, productId } = this.getProductContext();
      if (!isProductPage) {
        console.log("[Revenue Boost] \u23ED\uFE0F product_view trigger skipped: not a product page");
        return false;
      }
      const configuredIds = Array.isArray(trigger.product_ids) ? trigger.product_ids : [];
      if (configuredIds.length > 0) {
        if (!productId) {
          console.log(
            "[Revenue Boost] \u274C product_view trigger failed: product_ids configured but current product ID is unknown"
          );
          return false;
        }
        if (!configuredIds.includes(productId)) {
          console.log(
            "[Revenue Boost] \u274C product_view trigger failed: current product not in configured product_ids"
          );
          return false;
        }
      }
      const timeOnPageSeconds = trigger.time_on_page ?? 0;
      const requireScroll = trigger.require_scroll ?? false;
      const needsTimer = timeOnPageSeconds > 0;
      const needsScroll = requireScroll;
      if (!needsTimer && !needsScroll) {
        console.log("[Revenue Boost] \u2705 product_view trigger passed immediately (no extra conditions)");
        return true;
      }
      console.log(
        `[Revenue Boost] \u23F1\uFE0F product_view trigger waiting: ${timeOnPageSeconds}s on page, requireScroll=${requireScroll}`
      );
      return new Promise((resolve) => {
        let timerMet = !needsTimer;
        let scrollMet = !needsScroll;
        const checkAndResolve = () => {
          if (timerMet && scrollMet) {
            console.log("[Revenue Boost] \u2705 product_view trigger conditions met");
            resolve(true);
          }
        };
        if (needsTimer) {
          const timeout = window.setTimeout(() => {
            timerMet = true;
            checkAndResolve();
          }, timeOnPageSeconds * 1e3);
          this.cleanupFunctions.push(() => window.clearTimeout(timeout));
        }
        if (needsScroll) {
          const onScroll = () => {
            scrollMet = true;
            window.removeEventListener("scroll", onScroll);
            checkAndResolve();
          };
          window.addEventListener("scroll", onScroll, { passive: true });
          this.cleanupFunctions.push(() => window.removeEventListener("scroll", onScroll));
        }
      });
    }
    /**
     * Get basic product context for the current page
     * Attempts to detect both page type and Shopify product ID
     */
    getProductContext() {
      const body = document.body;
      const pathname = window.location.pathname || "";
      let productId = null;
      const productEl = document.querySelector("[data-product-id]");
      if (productEl) {
        const attr = productEl.getAttribute("data-product-id") || productEl.dataset?.productId || null;
        const normalized = this.normalizeProductId(attr);
        if (normalized) productId = normalized;
      }
      const win = window;
      if (!productId && win.ShopifyAnalytics?.meta?.product?.id) {
        const normalized = this.normalizeProductId(win.ShopifyAnalytics.meta.product.id);
        if (normalized) productId = normalized;
      }
      if (!productId && win.meta?.product?.id) {
        const normalized = this.normalizeProductId(win.meta.product.id);
        if (normalized) productId = normalized;
      }
      if (!productId && win.product?.id) {
        const normalized = this.normalizeProductId(win.product.id);
        if (normalized) productId = normalized;
      }
      const isProductPage = pathname.includes("/products/") || body.classList.contains("template-product") || Boolean(productEl) || Boolean(win.product) || Boolean(win.meta?.product) || Boolean(win.ShopifyAnalytics?.meta?.product);
      return { isProductPage, productId };
    }
    /**
     * Normalize various product ID formats to a Shopify Product GID
     */
    normalizeProductId(raw) {
      if (raw == null) return null;
      const idStr = String(raw).trim();
      if (!idStr) return null;
      if (idStr.startsWith("gid://")) {
        return idStr;
      }
      if (/^\d+$/.test(idStr)) {
        return `gid://shopify/Product/${idStr}`;
      }
      return null;
    }
    /**
     * Check idle timer trigger
     */
    async checkIdleTimer(trigger) {
      if (!trigger.enabled) {
        console.log("[Revenue Boost] \u23ED\uFE0F idle_timer trigger is disabled");
        return false;
      }
      const idleDuration = trigger.idle_duration || 30;
      console.log(`[Revenue Boost] \u23F1\uFE0F idle_timer trigger waiting for ${idleDuration}s of inactivity`);
      return new Promise((resolve) => {
        this.idleTimer = new IdleTimer({
          idleDuration: idleDuration * 1e3
          // Convert seconds to ms
        });
        this.idleTimer.start(() => {
          console.log(`[Revenue Boost] \u2705 idle_timer trigger detected: User was idle for ${idleDuration}s`);
          resolve(true);
        });
      });
    }
    /**
     * Check add_to_cart trigger
     * Waits for a Shopify cart add event before firing.
     */
    async checkAddToCart(trigger) {
      if (!trigger.enabled) {
        console.log("[Revenue Boost] \u23ED\uFE0F add_to_cart trigger is disabled");
        return false;
      }
      const delaySeconds = trigger.delay ?? 0;
      const immediate = trigger.immediate ?? false;
      console.log(
        `[Revenue Boost] \u{1F6D2} add_to_cart trigger listening for add-to-cart events (delay=${delaySeconds}s, immediate=${immediate})`
      );
      return new Promise((resolve) => {
        this.cartEventListener = new CartEventListener({
          events: ["add_to_cart"]
        });
        this.cartEventListener.start(() => {
          if (!immediate && delaySeconds > 0) {
            const delayMs = delaySeconds * 1e3;
            console.log(
              `[Revenue Boost] \u{1F6D2} add_to_cart detected, waiting additional ${delaySeconds}s before showing`
            );
            const timeout = window.setTimeout(() => {
              console.log("[Revenue Boost] \u2705 add_to_cart trigger conditions met");
              resolve(true);
            }, delayMs);
            this.cleanupFunctions.push(() => window.clearTimeout(timeout));
          } else {
            console.log("[Revenue Boost] \u2705 add_to_cart trigger conditions met");
            resolve(true);
          }
        });
      });
    }
    /**
     * Check cart_drawer_open trigger
     */
    async checkCartDrawerOpen(trigger) {
      if (!trigger.enabled) {
        console.log("[Revenue Boost] \u23ED\uFE0F cart_drawer_open trigger is disabled");
        return false;
      }
      const delayMs = trigger.delay ?? 0;
      console.log(
        `[Revenue Boost] \u{1F9FA} cart_drawer_open trigger listening for cart drawer events (delay=${delayMs}ms)`
      );
      return new Promise((resolve) => {
        this.cartEventListener = new CartEventListener({
          events: ["cart_drawer_open"]
        });
        this.cartEventListener.start(() => {
          if (delayMs > 0) {
            console.log(
              `[Revenue Boost] \u{1F9FA} cart_drawer_open detected, waiting ${delayMs}ms before showing`
            );
            const timeout = window.setTimeout(() => {
              console.log("[Revenue Boost] \u2705 cart_drawer_open trigger conditions met");
              resolve(true);
            }, delayMs);
            this.cleanupFunctions.push(() => window.clearTimeout(timeout));
          } else {
            console.log("[Revenue Boost] \u2705 cart_drawer_open trigger conditions met");
            resolve(true);
          }
        });
      });
    }
    /**
     * Check cart_value trigger
     * Uses CartEventListener in cart_update mode with value thresholds.
     */
    async checkCartValue(trigger) {
      if (!trigger.enabled) {
        console.log("[Revenue Boost] \u23ED\uFE0F cart_value trigger is disabled");
        return false;
      }
      const minCartValue = trigger.min_value ?? trigger.minValue ?? trigger.threshold ?? 0;
      const maxCartValue = trigger.max_value ?? Infinity;
      console.log(
        `[Revenue Boost] \u{1F4B0} cart_value trigger waiting for cart total between ${minCartValue} and ${maxCartValue}`
      );
      return new Promise((resolve) => {
        this.cartEventListener = new CartEventListener({
          events: ["cart_update"],
          trackCartValue: true,
          minCartValue,
          maxCartValue
        });
        this.cartEventListener.start((event) => {
          if (event.type !== "cart_update") return;
          console.log("[Revenue Boost] \u2705 cart_value trigger conditions met");
          resolve(true);
        });
      });
    }
    /**
     * Check custom_event trigger
     * Allows merchants to fire popups via custom DOM events.
     */
    async checkCustomEvent(trigger) {
      if (!trigger.enabled) {
        console.log("[Revenue Boost] \u23ED\uFE0F custom_event trigger is disabled");
        return false;
      }
      const eventNames = Array.isArray(trigger.event_names) && trigger.event_names.length > 0 ? trigger.event_names : trigger.event_name ? [trigger.event_name] : [];
      if (eventNames.length === 0) {
        console.log(
          "[Revenue Boost] \u23ED\uFE0F custom_event trigger skipped: no event_name or event_names configured"
        );
        return false;
      }
      console.log("[Revenue Boost] \u{1F3AF} custom_event trigger listening for events:", eventNames);
      return new Promise((resolve) => {
        this.customEventHandler = new CustomEventHandler({
          eventNames
        });
        this.customEventHandler.start((event) => {
          console.log(
            `[Revenue Boost] \u2705 custom_event trigger fired from event "${event.eventName}"`
          );
          resolve(true);
        });
      });
    }
    /**
     * Helper: Delay execution
     */
    delay(ms) {
      return new Promise((resolve) => {
        const timeout = setTimeout(resolve, ms);
        this.cleanupFunctions.push(() => clearTimeout(timeout));
      });
    }
    /**
     * Cleanup all triggers
     */
    cleanup() {
      this.cleanupFunctions.forEach((fn2) => fn2());
      this.cleanupFunctions = [];
      if (this.exitIntentDetector) {
        this.exitIntentDetector.destroy();
        this.exitIntentDetector = null;
      }
      if (this.scrollDepthTracker) {
        this.scrollDepthTracker.destroy();
        this.scrollDepthTracker = null;
      }
      if (this.timeDelayHandler) {
        this.timeDelayHandler.destroy();
        this.timeDelayHandler = null;
      }
      if (this.idleTimer) {
        this.idleTimer.destroy();
        this.idleTimer = null;
      }
      if (this.cartEventListener) {
        this.cartEventListener.destroy();
        this.cartEventListener = null;
      }
      if (this.customEventHandler) {
        this.customEventHandler.destroy();
        this.customEventHandler = null;
      }
    }
  };

  // extensions/storefront-src/utils/cart-tracking.ts
  function hasProductId(d3) {
    return d3 != null && typeof d3 === "object" && "productId" in d3 && (typeof d3.productId === "string" || typeof d3.productId === "number");
  }
  function initCartTracking(api, shopDomain) {
    document.addEventListener("cart:updated", (event) => {
      const detail = event.detail;
      if (hasProductId(detail)) {
        const productId = String(detail.productId);
        trackAddToCart(api, shopDomain, productId);
      }
    });
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const [url, options] = args;
      const urlString = typeof url === "string" ? url : url.toString();
      if (urlString.includes("/cart/add") && options?.method === "POST") {
        try {
          const response = await originalFetch.apply(this, args);
          const clone = response.clone();
          const data = await clone.json();
          if (data.id || data.product_id) {
            const productId = `gid://shopify/Product/${data.product_id || data.id}`;
            trackAddToCart(api, shopDomain, productId);
          }
          return response;
        } catch (error) {
          return originalFetch.apply(this, args);
        }
      }
      return originalFetch.apply(this, args);
    };
    document.addEventListener("submit", (event) => {
      const form = event.target;
      if (form.action && form.action.includes("/cart/add")) {
        const formData = new FormData(form);
        const productId = formData.get("id");
        if (productId) {
          const gid = `gid://shopify/Product/${productId}`;
          trackAddToCart(api, shopDomain, gid);
        }
      }
    });
    console.log("[Revenue Boost] \u{1F6D2} Cart tracking initialized");
  }
  function emitCartAddEvents(productId) {
    try {
      const detail = { productId };
      document.dispatchEvent(new CustomEvent("cart:add", { detail }));
      document.dispatchEvent(new CustomEvent("cart:item-added", { detail }));
    } catch {
    }
  }
  async function trackAddToCart(api, shopDomain, productId) {
    try {
      try {
        window.sessionStorage.setItem("revenue_boost_added_to_cart", "true");
      } catch {
      }
      emitCartAddEvents(productId);
      await api.trackSocialProofEvent({
        eventType: "add_to_cart",
        productId,
        shop: shopDomain
      });
      console.log("[Revenue Boost] \u{1F6D2} Tracked add-to-cart:", productId);
    } catch (error) {
      console.debug("[Revenue Boost] Failed to track add-to-cart:", error);
    }
  }

  // extensions/storefront-src/index.ts
  if (typeof window !== "undefined") {
    const w3 = window;
    w3.RevenueBoostPreact = {
      h: _,
      render: G,
      Component: x,
      Fragment: k,
      options: l,
      createPortal: $2,
      createContext: Q,
      hooks: {
        useState: d2,
        useEffect: y2,
        useCallback: q2,
        useRef: A2,
        useMemo: T2,
        useContext: x2,
        useDebugValue: P2
      }
    };
    console.log("[Revenue Boost] \u269B\uFE0F Preact runtime exposed globally");
  }
  function getConfig() {
    const cfg = window.REVENUE_BOOST_CONFIG || {};
    return {
      apiUrl: cfg.apiUrl || "",
      shopDomain: cfg.shopDomain || "",
      debug: cfg.debug || false,
      previewMode: cfg.previewMode || false,
      previewId: cfg.previewId,
      sessionId: cfg.sessionId,
      visitCount: cfg.visitCount,
      isReturningVisitor: cfg.isReturningVisitor,
      deviceType: cfg.deviceType
    };
  }
  function waitForDOMReady() {
    return new Promise((resolve) => {
      if (document.readyState === "complete" || document.readyState === "interactive") {
        resolve();
      } else {
        document.addEventListener("DOMContentLoaded", () => resolve());
      }
    });
  }
  var RevenueBoostApp = class {
    constructor() {
      __publicField(this, "config", getConfig());
      __publicField(this, "api", new ApiClient(this.config));
      __publicField(this, "loader", new ComponentLoader({
        debug: this.config.debug,
        baseUrl: this.config.apiUrl ? `${this.config.apiUrl}/bundles` : "/apps/revenue-boost/bundles",
        version: Date.now().toString()
      }));
      __publicField(this, "initialized", false);
    }
    log(...args) {
      if (this.config.debug) {
        console.log("[Revenue Boost]", ...args);
      }
    }
    async init() {
      if (this.initialized) {
        this.log("Already initialized");
        return;
      }
      console.log("[Revenue Boost] \u{1F680} Starting initialization...");
      console.log("[Revenue Boost] \u{1F4CB} Config:", this.config);
      console.log("[Revenue Boost] \u{1F511} Session ID:", session.getSessionId());
      console.log("[Revenue Boost] \u{1F464} Visitor ID:", session.getVisitorId());
      await waitForDOMReady();
      this.log("DOM ready");
      this.trackPageView();
      initCartTracking(this.api, this.config.shopDomain);
      try {
        const response = await this.api.fetchActiveCampaigns(
          session.getSessionId(),
          session.getVisitorId()
        );
        const { campaigns } = response;
        const campaignList = campaigns;
        this.log(`Campaigns received: ${campaignList?.length || 0}`);
        if (!campaignList || campaignList.length === 0) {
          this.log("No active campaigns");
          return;
        }
        const templateTypes = campaignList.map((c3) => c3.templateType).filter(Boolean);
        if (templateTypes.length > 0) {
          this.log("Preloading popup components:", templateTypes);
          this.loader.preloadComponents(templateTypes).catch((err) => {
            this.log("Component preload failed (non-critical):", err);
          });
        }
        this.setupCampaigns(campaignList);
        this.initialized = true;
        console.log("[Revenue Boost] \u2705 Initialization complete!");
      } catch (error) {
        console.error("[Revenue Boost] \u274C Error fetching campaigns:", error);
      }
    }
    /**
     * Track page view for social proof visitor counting
     */
    async trackPageView() {
      try {
        const productId = this.getProductIdFromPage();
        const pageUrl = window.location.pathname;
        await this.api.trackSocialProofEvent({
          eventType: productId ? "product_view" : "page_view",
          productId,
          pageUrl,
          shop: this.config.shopDomain
        });
        this.log("Page view tracked for social proof");
      } catch (error) {
        this.log("Failed to track page view:", error);
      }
    }
    /**
     * Extract product ID from current page (if on product page)
     */
    getProductIdFromPage() {
      const wx = window;
      if (typeof wx.ShopifyAnalytics !== "undefined") {
        const meta = wx.ShopifyAnalytics?.meta;
        if (meta?.product?.id) {
          return `gid://shopify/Product/${meta.product.id}`;
        }
      }
      if (window.location.pathname.includes("/products/")) {
        return void 0;
      }
      return void 0;
    }
    setupCampaigns(campaigns) {
      const sorted = campaigns.sort((a3, b2) => (b2.priority || 0) - (a3.priority || 0));
      const available = sorted.filter((campaign) => {
        const isPreview = this.config.previewMode && this.config.previewId === campaign.id;
        if (isPreview) return true;
        const trackingKey = campaign.experimentId || campaign.id;
        if (session.wasDismissed(trackingKey)) {
          this.log(`Campaign dismissed by user: ${campaign.id} (tracking key: ${trackingKey})`);
          return false;
        }
        return true;
      });
      if (available.length === 0) {
        this.log("No campaigns to display");
        return;
      }
      if (this.config.previewMode && this.config.previewId) {
        const previewCampaign = available.find(
          (c3) => c3.id === this.config.previewId
        );
        if (previewCampaign) {
          this.log("Preview mode: showing campaign:", previewCampaign.name);
          setTimeout(() => {
            void this.showCampaign(previewCampaign);
          }, 0);
          return;
        }
      }
      const bySurface = {
        modal: [],
        banner: [],
        notification: []
      };
      for (const campaign of available) {
        const surface = this.getSurface(campaign);
        bySurface[surface].push(campaign);
      }
      const selected = [];
      ["modal", "banner", "notification"].forEach((surface) => {
        const candidates = bySurface[surface];
        if (candidates.length > 0) {
          selected.push(candidates[0]);
        }
      });
      if (selected.length === 0) {
        this.log("No campaigns selected after surface grouping");
        return;
      }
      this.log(
        "Selected campaigns by surface:",
        selected.map((c3) => `${c3.name} [${this.getSurface(c3)}]`)
      );
      for (const campaign of selected) {
        void this.showCampaign(campaign);
      }
    }
    getSurface(campaign) {
      const templateType = campaign.templateType;
      const design = campaign.designConfig || {};
      const displayMode = design.displayMode;
      if (templateType === "SOCIAL_PROOF") {
        return "notification";
      }
      if (templateType === "FREE_SHIPPING" || templateType === "COUNTDOWN_TIMER" || templateType === "ANNOUNCEMENT" || displayMode === "banner") {
        return "banner";
      }
      return "modal";
    }
    async showCampaign(campaign) {
      const isPreview = this.config.previewMode && this.config.previewId === campaign.id;
      if (isPreview) {
        await this.renderCampaign(campaign);
        return;
      }
      const triggerManager = new TriggerManager();
      this.log("Evaluating triggers for campaign:", campaign.name);
      try {
        const shouldShow = await triggerManager.evaluateTriggers(campaign);
        if (shouldShow) {
          this.log("Triggers passed, showing campaign");
          await this.renderCampaign(campaign, triggerManager);
        } else {
          this.log("Triggers not met, campaign not shown");
          triggerManager.cleanup();
        }
      } catch (error) {
        console.error("[Revenue Boost] Error evaluating triggers:", error);
        await this.renderCampaign(campaign, triggerManager);
      }
    }
    async renderCampaign(campaign, triggerManager) {
      const isPreview = this.config.previewMode && this.config.previewId === campaign.id;
      if (!isPreview) {
        const trackingKey = campaign.experimentId || campaign.id;
        await this.api.recordFrequency(session.getSessionId(), trackingKey);
      }
      renderPopup(
        campaign,
        () => {
          this.log("Popup closed");
          if (!isPreview) {
            const trackingKey = campaign.experimentId || campaign.id;
            session.markDismissed(trackingKey);
          }
          if (triggerManager) {
            triggerManager.cleanup();
          }
        },
        this.loader,
        this.api,
        (campaignId) => {
          this.log("Popup shown:", campaignId);
        }
      );
    }
  };
  var app = new RevenueBoostApp();
  app.init().catch((error) => {
    console.error("[Revenue Boost] Initialization failed:", error);
  });
})();
//# sourceMappingURL=popup-loader.bundle.js.map
