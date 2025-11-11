"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a3, b3) => {
    for (var prop in b3 || (b3 = {}))
      if (__hasOwnProp.call(b3, prop))
        __defNormalProp(a3, prop, b3[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b3)) {
        if (__propIsEnum.call(b3, prop))
          __defNormalProp(a3, prop, b3[prop]);
      }
    return a3;
  };
  var __spreadProps = (a3, b3) => __defProps(a3, __getOwnPropDescs(b3));
  var __esm = (fn2, res) => function __init() {
    return fn2 && (res = (0, fn2[__getOwnPropNames(fn2)[0]])(fn2 = 0)), res;
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
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // node_modules/preact/dist/preact.module.js
  var preact_module_exports = {};
  __export(preact_module_exports, {
    Component: () => x,
    Fragment: () => k,
    cloneElement: () => K,
    createContext: () => Q,
    createElement: () => _,
    createRef: () => b,
    h: () => _,
    hydrate: () => J,
    isValidElement: () => t,
    options: () => l,
    render: () => G,
    toChildArray: () => H
  });
  function d(n2, l3) {
    for (var u3 in l3)
      n2[u3] = l3[u3];
    return n2;
  }
  function g(n2) {
    n2 && n2.parentNode && n2.parentNode.removeChild(n2);
  }
  function _(l3, u3, t3) {
    var i3, r3, o3, e3 = {};
    for (o3 in u3)
      "key" == o3 ? i3 = u3[o3] : "ref" == o3 ? r3 = u3[o3] : e3[o3] = u3[o3];
    if (arguments.length > 2 && (e3.children = arguments.length > 3 ? n.call(arguments, 2) : t3), "function" == typeof l3 && null != l3.defaultProps)
      for (o3 in l3.defaultProps)
        void 0 === e3[o3] && (e3[o3] = l3.defaultProps[o3]);
    return m(l3, e3, i3, r3, null);
  }
  function m(n2, t3, i3, r3, o3) {
    var e3 = { type: n2, props: t3, key: i3, ref: r3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == o3 ? ++u : o3, __i: -1, __u: 0 };
    return null == o3 && null != l.vnode && l.vnode(e3), e3;
  }
  function b() {
    return { current: null };
  }
  function k(n2) {
    return n2.children;
  }
  function x(n2, l3) {
    this.props = n2, this.context = l3;
  }
  function S(n2, l3) {
    if (null == l3)
      return n2.__ ? S(n2.__, n2.__i + 1) : null;
    for (var u3; l3 < n2.__k.length; l3++)
      if (null != (u3 = n2.__k[l3]) && null != u3.__e)
        return u3.__e;
    return "function" == typeof n2.type ? S(n2) : null;
  }
  function C(n2) {
    var l3, u3;
    if (null != (n2 = n2.__) && null != n2.__c) {
      for (n2.__e = n2.__c.base = null, l3 = 0; l3 < n2.__k.length; l3++)
        if (null != (u3 = n2.__k[l3]) && null != u3.__e) {
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
    for (var n2, u3, t3, r3, o3, f3, c3, s3 = 1; i.length; )
      i.length > s3 && i.sort(e), n2 = i.shift(), s3 = i.length, n2.__d && (t3 = void 0, r3 = void 0, o3 = (r3 = (u3 = n2).__v).__e, f3 = [], c3 = [], u3.__P && ((t3 = d({}, r3)).__v = r3.__v + 1, l.vnode && l.vnode(t3), O(u3.__P, t3, r3, u3.__n, u3.__P.namespaceURI, 32 & r3.__u ? [o3] : null, f3, null == o3 ? S(r3) : o3, !!(32 & r3.__u), c3), t3.__v = r3.__v, t3.__.__k[t3.__i] = t3, N(f3, t3, c3), r3.__e = r3.__ = null, t3.__e != o3 && C(t3)));
    $.__r = 0;
  }
  function I(n2, l3, u3, t3, i3, r3, o3, e3, f3, c3, s3) {
    var a3, h3, y3, w4, d3, g4, _3, m3 = t3 && t3.__k || v, b3 = l3.length;
    for (f3 = P(u3, l3, m3, f3, b3), a3 = 0; a3 < b3; a3++)
      null != (y3 = u3.__k[a3]) && (h3 = -1 == y3.__i ? p : m3[y3.__i] || p, y3.__i = a3, g4 = O(n2, y3, h3, i3, r3, o3, e3, f3, c3, s3), w4 = y3.__e, y3.ref && h3.ref != y3.ref && (h3.ref && B(h3.ref, null, y3), s3.push(y3.ref, y3.__c || w4, y3)), null == d3 && null != w4 && (d3 = w4), (_3 = !!(4 & y3.__u)) || h3.__k === y3.__k ? f3 = A(y3, f3, n2, _3) : "function" == typeof y3.type && void 0 !== g4 ? f3 = g4 : w4 && (f3 = w4.nextSibling), y3.__u &= -7);
    return u3.__e = d3, f3;
  }
  function P(n2, l3, u3, t3, i3) {
    var r3, o3, e3, f3, c3, s3 = u3.length, a3 = s3, h3 = 0;
    for (n2.__k = new Array(i3), r3 = 0; r3 < i3; r3++)
      null != (o3 = l3[r3]) && "boolean" != typeof o3 && "function" != typeof o3 ? (f3 = r3 + h3, (o3 = n2.__k[r3] = "string" == typeof o3 || "number" == typeof o3 || "bigint" == typeof o3 || o3.constructor == String ? m(null, o3, null, null, null) : w(o3) ? m(k, { children: o3 }, null, null, null) : null == o3.constructor && o3.__b > 0 ? m(o3.type, o3.props, o3.key, o3.ref ? o3.ref : null, o3.__v) : o3).__ = n2, o3.__b = n2.__b + 1, e3 = null, -1 != (c3 = o3.__i = L(o3, u3, f3, a3)) && (a3--, (e3 = u3[c3]) && (e3.__u |= 2)), null == e3 || null == e3.__v ? (-1 == c3 && (i3 > s3 ? h3-- : i3 < s3 && h3++), "function" != typeof o3.type && (o3.__u |= 4)) : c3 != f3 && (c3 == f3 - 1 ? h3-- : c3 == f3 + 1 ? h3++ : (c3 > f3 ? h3-- : h3++, o3.__u |= 4))) : n2.__k[r3] = null;
    if (a3)
      for (r3 = 0; r3 < s3; r3++)
        null != (e3 = u3[r3]) && 0 == (2 & e3.__u) && (e3.__e == t3 && (t3 = S(e3)), D(e3, e3));
    return t3;
  }
  function A(n2, l3, u3, t3) {
    var i3, r3;
    if ("function" == typeof n2.type) {
      for (i3 = n2.__k, r3 = 0; i3 && r3 < i3.length; r3++)
        i3[r3] && (i3[r3].__ = n2, l3 = A(i3[r3], l3, u3, t3));
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
    if (null === c3 && null == n2.key || s3 && e3 == c3.key && f3 == c3.type)
      return u3;
    if (t3 > (s3 ? 1 : 0)) {
      for (i3 = u3 - 1, r3 = u3 + 1; i3 >= 0 || r3 < l3.length; )
        if (null != (c3 = l3[o3 = i3 >= 0 ? i3-- : r3++]) && 0 == (2 & c3.__u) && e3 == c3.key && f3 == c3.type)
          return o3;
    }
    return -1;
  }
  function T(n2, l3, u3) {
    "-" == l3[0] ? n2.setProperty(l3, null == u3 ? "" : u3) : n2[l3] = null == u3 ? "" : "number" != typeof u3 || y.test(l3) ? u3 : u3 + "px";
  }
  function j(n2, l3, u3, t3, i3) {
    var r3, o3;
    n:
      if ("style" == l3)
        if ("string" == typeof u3)
          n2.style.cssText = u3;
        else {
          if ("string" == typeof t3 && (n2.style.cssText = t3 = ""), t3)
            for (l3 in t3)
              u3 && l3 in u3 || T(n2.style, l3, "");
          if (u3)
            for (l3 in u3)
              t3 && u3[l3] == t3[l3] || T(n2.style, l3, u3[l3]);
        }
      else if ("o" == l3[0] && "n" == l3[1])
        r3 = l3 != (l3 = l3.replace(f, "$1")), o3 = l3.toLowerCase(), l3 = o3 in n2 || "onFocusOut" == l3 || "onFocusIn" == l3 ? o3.slice(2) : l3.slice(2), n2.l || (n2.l = {}), n2.l[l3 + r3] = u3, u3 ? t3 ? u3.u = t3.u : (u3.u = c, n2.addEventListener(l3, r3 ? a : s, r3)) : n2.removeEventListener(l3, r3 ? a : s, r3);
      else {
        if ("http://www.w3.org/2000/svg" == i3)
          l3 = l3.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
        else if ("width" != l3 && "height" != l3 && "href" != l3 && "list" != l3 && "form" != l3 && "tabIndex" != l3 && "download" != l3 && "rowSpan" != l3 && "colSpan" != l3 && "role" != l3 && "popover" != l3 && l3 in n2)
          try {
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
        if (null == u3.t)
          u3.t = c++;
        else if (u3.t < t3.u)
          return;
        return t3(l.event ? l.event(u3) : u3);
      }
    };
  }
  function O(n2, u3, t3, i3, r3, o3, e3, f3, c3, s3) {
    var a3, h3, p3, v3, y3, _3, m3, b3, S2, C4, M3, $3, P4, A4, H3, L3, T4, j4 = u3.type;
    if (null != u3.constructor)
      return null;
    128 & t3.__u && (c3 = !!(32 & t3.__u), o3 = [f3 = u3.__e = t3.__e]), (a3 = l.__b) && a3(u3);
    n:
      if ("function" == typeof j4)
        try {
          if (b3 = u3.props, S2 = "prototype" in j4 && j4.prototype.render, C4 = (a3 = j4.contextType) && i3[a3.__c], M3 = a3 ? C4 ? C4.props.value : a3.__ : i3, t3.__c ? m3 = (h3 = u3.__c = t3.__c).__ = h3.__E : (S2 ? u3.__c = h3 = new j4(b3, M3) : (u3.__c = h3 = new x(b3, M3), h3.constructor = j4, h3.render = E), C4 && C4.sub(h3), h3.props = b3, h3.state || (h3.state = {}), h3.context = M3, h3.__n = i3, p3 = h3.__d = true, h3.__h = [], h3._sb = []), S2 && null == h3.__s && (h3.__s = h3.state), S2 && null != j4.getDerivedStateFromProps && (h3.__s == h3.state && (h3.__s = d({}, h3.__s)), d(h3.__s, j4.getDerivedStateFromProps(b3, h3.__s))), v3 = h3.props, y3 = h3.state, h3.__v = u3, p3)
            S2 && null == j4.getDerivedStateFromProps && null != h3.componentWillMount && h3.componentWillMount(), S2 && null != h3.componentDidMount && h3.__h.push(h3.componentDidMount);
          else {
            if (S2 && null == j4.getDerivedStateFromProps && b3 !== v3 && null != h3.componentWillReceiveProps && h3.componentWillReceiveProps(b3, M3), !h3.__e && null != h3.shouldComponentUpdate && false === h3.shouldComponentUpdate(b3, h3.__s, M3) || u3.__v == t3.__v) {
              for (u3.__v != t3.__v && (h3.props = b3, h3.state = h3.__s, h3.__d = false), u3.__e = t3.__e, u3.__k = t3.__k, u3.__k.some(function(n3) {
                n3 && (n3.__ = u3);
              }), $3 = 0; $3 < h3._sb.length; $3++)
                h3.__h.push(h3._sb[$3]);
              h3._sb = [], h3.__h.length && e3.push(h3);
              break n;
            }
            null != h3.componentWillUpdate && h3.componentWillUpdate(b3, h3.__s, M3), S2 && null != h3.componentDidUpdate && h3.__h.push(function() {
              h3.componentDidUpdate(v3, y3, _3);
            });
          }
          if (h3.context = M3, h3.props = b3, h3.__P = n2, h3.__e = false, P4 = l.__r, A4 = 0, S2) {
            for (h3.state = h3.__s, h3.__d = false, P4 && P4(u3), a3 = h3.render(h3.props, h3.state, h3.context), H3 = 0; H3 < h3._sb.length; H3++)
              h3.__h.push(h3._sb[H3]);
            h3._sb = [];
          } else
            do {
              h3.__d = false, P4 && P4(u3), a3 = h3.render(h3.props, h3.state, h3.context), h3.state = h3.__s;
            } while (h3.__d && ++A4 < 25);
          h3.state = h3.__s, null != h3.getChildContext && (i3 = d(d({}, i3), h3.getChildContext())), S2 && !p3 && null != h3.getSnapshotBeforeUpdate && (_3 = h3.getSnapshotBeforeUpdate(v3, y3)), L3 = a3, null != a3 && a3.type === k && null == a3.key && (L3 = V(a3.props.children)), f3 = I(n2, w(L3) ? L3 : [L3], u3, t3, i3, r3, o3, e3, f3, c3, s3), h3.base = u3.__e, u3.__u &= -161, h3.__h.length && e3.push(h3), m3 && (h3.__E = h3.__ = null);
        } catch (n3) {
          if (u3.__v = null, c3 || null != o3)
            if (n3.then) {
              for (u3.__u |= c3 ? 160 : 128; f3 && 8 == f3.nodeType && f3.nextSibling; )
                f3 = f3.nextSibling;
              o3[o3.indexOf(f3)] = null, u3.__e = f3;
            } else {
              for (T4 = o3.length; T4--; )
                g(o3[T4]);
              z(u3);
            }
          else
            u3.__e = t3.__e, u3.__k = t3.__k, n3.then || z(u3);
          l.__e(n3, u3, t3);
        }
      else
        null == o3 && u3.__v == t3.__v ? (u3.__k = t3.__k, u3.__e = t3.__e) : f3 = u3.__e = q(t3.__e, u3, t3, i3, r3, o3, e3, c3, s3);
    return (a3 = l.diffed) && a3(u3), 128 & u3.__u ? void 0 : f3;
  }
  function z(n2) {
    n2 && n2.__c && (n2.__c.__e = true), n2 && n2.__k && n2.__k.forEach(z);
  }
  function N(n2, u3, t3) {
    for (var i3 = 0; i3 < t3.length; i3++)
      B(t3[i3], t3[++i3], t3[++i3]);
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
    var a3, h3, v3, y3, d3, _3, m3, b3 = i3.props, k4 = t3.props, x4 = t3.type;
    if ("svg" == x4 ? o3 = "http://www.w3.org/2000/svg" : "math" == x4 ? o3 = "http://www.w3.org/1998/Math/MathML" : o3 || (o3 = "http://www.w3.org/1999/xhtml"), null != e3) {
      for (a3 = 0; a3 < e3.length; a3++)
        if ((d3 = e3[a3]) && "setAttribute" in d3 == !!x4 && (x4 ? d3.localName == x4 : 3 == d3.nodeType)) {
          u3 = d3, e3[a3] = null;
          break;
        }
    }
    if (null == u3) {
      if (null == x4)
        return document.createTextNode(k4);
      u3 = document.createElementNS(o3, x4, k4.is && k4), c3 && (l.__m && l.__m(t3, e3), c3 = false), e3 = null;
    }
    if (null == x4)
      b3 === k4 || c3 && u3.data == k4 || (u3.data = k4);
    else {
      if (e3 = e3 && n.call(u3.childNodes), b3 = i3.props || p, !c3 && null != e3)
        for (b3 = {}, a3 = 0; a3 < u3.attributes.length; a3++)
          b3[(d3 = u3.attributes[a3]).name] = d3.value;
      for (a3 in b3)
        if (d3 = b3[a3], "children" == a3)
          ;
        else if ("dangerouslySetInnerHTML" == a3)
          v3 = d3;
        else if (!(a3 in k4)) {
          if ("value" == a3 && "defaultValue" in k4 || "checked" == a3 && "defaultChecked" in k4)
            continue;
          j(u3, a3, null, d3, o3);
        }
      for (a3 in k4)
        d3 = k4[a3], "children" == a3 ? y3 = d3 : "dangerouslySetInnerHTML" == a3 ? h3 = d3 : "value" == a3 ? _3 = d3 : "checked" == a3 ? m3 = d3 : c3 && "function" != typeof d3 || b3[a3] === d3 || j(u3, a3, d3, b3[a3], o3);
      if (h3)
        c3 || v3 && (h3.__html == v3.__html || h3.__html == u3.innerHTML) || (u3.innerHTML = h3.__html), t3.__k = [];
      else if (v3 && (u3.innerHTML = ""), I("template" == t3.type ? u3.content : u3, w(y3) ? y3 : [y3], t3, i3, r3, "foreignObject" == x4 ? "http://www.w3.org/1999/xhtml" : o3, e3, f3, e3 ? e3[0] : i3.__k && S(i3, 0), c3, s3), null != e3)
        for (a3 = e3.length; a3--; )
          g(e3[a3]);
      c3 || (a3 = "value", "progress" == x4 && null == _3 ? u3.removeAttribute("value") : null != _3 && (_3 !== u3[a3] || "progress" == x4 && !_3 || "option" == x4 && _3 != b3[a3]) && j(u3, a3, _3, b3[a3], o3), a3 = "checked", null != m3 && m3 != u3[a3] && j(u3, a3, m3, b3[a3], o3));
    }
    return u3;
  }
  function B(n2, u3, t3) {
    try {
      if ("function" == typeof n2) {
        var i3 = "function" == typeof n2.__u;
        i3 && n2.__u(), i3 && null == u3 || (n2.__u = n2(u3));
      } else
        n2.current = u3;
    } catch (n3) {
      l.__e(n3, t3);
    }
  }
  function D(n2, u3, t3) {
    var i3, r3;
    if (l.unmount && l.unmount(n2), (i3 = n2.ref) && (i3.current && i3.current != n2.__e || B(i3, null, u3)), null != (i3 = n2.__c)) {
      if (i3.componentWillUnmount)
        try {
          i3.componentWillUnmount();
        } catch (n3) {
          l.__e(n3, u3);
        }
      i3.base = i3.__P = null;
    }
    if (i3 = n2.__k)
      for (r3 = 0; r3 < i3.length; r3++)
        i3[r3] && D(i3[r3], u3, t3 || "function" != typeof n2.type);
    t3 || g(n2.__e), n2.__c = n2.__ = n2.__e = void 0;
  }
  function E(n2, l3, u3) {
    return this.constructor(n2, u3);
  }
  function G(u3, t3, i3) {
    var r3, o3, e3, f3;
    t3 == document && (t3 = document.documentElement), l.__ && l.__(u3, t3), o3 = (r3 = "function" == typeof i3) ? null : i3 && i3.__k || t3.__k, e3 = [], f3 = [], O(t3, u3 = (!r3 && i3 || t3).__k = _(k, null, [u3]), o3 || p, p, t3.namespaceURI, !r3 && i3 ? [i3] : o3 ? null : t3.firstChild ? n.call(t3.childNodes) : null, e3, !r3 && i3 ? i3 : o3 ? o3.__e : t3.firstChild, r3, f3), N(e3, u3, f3);
  }
  function J(n2, l3) {
    G(n2, l3, J);
  }
  function K(l3, u3, t3) {
    var i3, r3, o3, e3, f3 = d({}, l3.props);
    for (o3 in l3.type && l3.type.defaultProps && (e3 = l3.type.defaultProps), u3)
      "key" == o3 ? i3 = u3[o3] : "ref" == o3 ? r3 = u3[o3] : f3[o3] = void 0 === u3[o3] && null != e3 ? e3[o3] : u3[o3];
    return arguments.length > 2 && (f3.children = arguments.length > 3 ? n.call(arguments, 2) : t3), m(l3.type, f3, i3 || l3.key, r3 || l3.ref, null);
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
  var n, l, u, t, i, r, o, e, f, c, s, a, h, p, v, y, w;
  var init_preact_module = __esm({
    "node_modules/preact/dist/preact.module.js"() {
      p = {};
      v = [];
      y = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
      w = Array.isArray;
      n = v.slice, l = { __e: function(n2, l3, u3, t3) {
        for (var i3, r3, o3; l3 = l3.__; )
          if ((i3 = l3.__c) && !i3.__)
            try {
              if ((r3 = i3.constructor) && null != r3.getDerivedStateFromError && (i3.setState(r3.getDerivedStateFromError(n2)), o3 = i3.__d), null != i3.componentDidCatch && (i3.componentDidCatch(n2, t3 || {}), o3 = i3.__d), o3)
                return i3.__E = i3;
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
    }
  });

  // node_modules/preact/hooks/dist/hooks.module.js
  var hooks_module_exports = {};
  __export(hooks_module_exports, {
    useCallback: () => q2,
    useContext: () => x2,
    useDebugValue: () => P2,
    useEffect: () => y2,
    useErrorBoundary: () => b2,
    useId: () => g2,
    useImperativeHandle: () => F2,
    useLayoutEffect: () => _2,
    useMemo: () => T2,
    useReducer: () => h2,
    useRef: () => A2,
    useState: () => d2
  });
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
        if (!o3.__c.__H)
          return true;
        var u4 = o3.__c.__H.__.filter(function(n4) {
          return !!n4.__c;
        });
        if (u4.every(function(n4) {
          return !n4.__N;
        }))
          return !c3 || c3.call(this, n3, t3, r3);
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
  function _2(n2, u3) {
    var i3 = p2(t2++, 4);
    !c2.__s && C2(i3.__H, u3) && (i3.__ = n2, i3.u = u3, r2.__h.push(i3));
  }
  function A2(n2) {
    return o2 = 5, T2(function() {
      return { current: n2 };
    }, []);
  }
  function F2(n2, t3, r3) {
    o2 = 6, _2(function() {
      if ("function" == typeof n2) {
        var r4 = n2(t3());
        return function() {
          n2(null), r4 && "function" == typeof r4 && r4();
        };
      }
      if (n2)
        return n2.current = t3(), function() {
          return n2.current = null;
        };
    }, null == r3 ? r3 : r3.concat(n2));
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
  function b2(n2) {
    var u3 = p2(t2++, 10), i3 = d2();
    return u3.__ = n2, r2.componentDidCatch || (r2.componentDidCatch = function(n3, t3) {
      u3.__ && u3.__(n3, t3), i3[1](n3);
    }), [i3[0], function() {
      i3[1](void 0);
    }];
  }
  function g2() {
    var n2 = p2(t2++, 11);
    if (!n2.__) {
      for (var u3 = r2.__v; null !== u3 && !u3.__m && null !== u3.__; )
        u3 = u3.__;
      var i3 = u3.__m || (u3.__m = [0, 0]);
      n2.__ = "P" + i3[0] + "-" + i3[1]++;
    }
    return n2.__;
  }
  function j2() {
    for (var n2; n2 = f2.shift(); )
      if (n2.__P && n2.__H)
        try {
          n2.__H.__h.forEach(z2), n2.__H.__h.forEach(B2), n2.__H.__h = [];
        } catch (t3) {
          n2.__H.__h = [], c2.__e(t3, n2.__v);
        }
  }
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
  var t2, r2, u2, i2, o2, f2, c2, e2, a2, v2, l2, m2, s2, k2;
  var init_hooks_module = __esm({
    "node_modules/preact/hooks/dist/hooks.module.js"() {
      init_preact_module();
      o2 = 0;
      f2 = [];
      c2 = l;
      e2 = c2.__b;
      a2 = c2.__r;
      v2 = c2.diffed;
      l2 = c2.__c;
      m2 = c2.unmount;
      s2 = c2.__;
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
      k2 = "function" == typeof requestAnimationFrame;
    }
  });

  // node_modules/preact/compat/dist/compat.module.js
  var compat_module_exports = {};
  __export(compat_module_exports, {
    Children: () => O2,
    Component: () => x,
    Fragment: () => k,
    PureComponent: () => N2,
    StrictMode: () => Cn,
    Suspense: () => P3,
    SuspenseList: () => B3,
    __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: () => hn,
    cloneElement: () => _n,
    createContext: () => Q,
    createElement: () => _,
    createFactory: () => dn,
    createPortal: () => $2,
    createRef: () => b,
    default: () => Rn,
    findDOMNode: () => Sn,
    flushSync: () => En,
    forwardRef: () => D3,
    hydrate: () => tn,
    isElement: () => xn,
    isFragment: () => pn,
    isMemo: () => yn,
    isValidElement: () => mn,
    lazy: () => z3,
    memo: () => M2,
    render: () => nn,
    startTransition: () => R,
    unmountComponentAtNode: () => bn,
    unstable_batchedUpdates: () => gn,
    useCallback: () => q2,
    useContext: () => x2,
    useDebugValue: () => P2,
    useDeferredValue: () => w3,
    useEffect: () => y2,
    useErrorBoundary: () => b2,
    useId: () => g2,
    useImperativeHandle: () => F2,
    useInsertionEffect: () => I2,
    useLayoutEffect: () => _2,
    useMemo: () => T2,
    useReducer: () => h2,
    useRef: () => A2,
    useState: () => d2,
    useSyncExternalStore: () => C3,
    useTransition: () => k3,
    version: () => vn
  });
  function g3(n2, t3) {
    for (var e3 in t3)
      n2[e3] = t3[e3];
    return n2;
  }
  function E2(n2, t3) {
    for (var e3 in n2)
      if ("__source" !== e3 && !(e3 in t3))
        return true;
    for (var r3 in t3)
      if ("__source" !== r3 && n2[r3] !== t3[r3])
        return true;
    return false;
  }
  function C3(n2, t3) {
    var e3 = t3(), r3 = d2({ t: { __: e3, u: t3 } }), u3 = r3[0].t, o3 = r3[1];
    return _2(function() {
      u3.__ = e3, u3.u = t3, x3(u3) && o3({ t: u3 });
    }, [n2, e3, t3]), y2(function() {
      return x3(u3) && o3({ t: u3 }), n2(function() {
        x3(u3) && o3({ t: u3 });
      });
    }, [n2]), e3;
  }
  function x3(n2) {
    var t3, e3, r3 = n2.u, u3 = n2.__;
    try {
      var o3 = r3();
      return !((t3 = u3) === (e3 = o3) && (0 !== t3 || 1 / t3 == 1 / e3) || t3 != t3 && e3 != e3);
    } catch (n3) {
      return true;
    }
  }
  function R(n2) {
    n2();
  }
  function w3(n2) {
    return n2;
  }
  function k3() {
    return [false, R];
  }
  function N2(n2, t3) {
    this.props = n2, this.context = t3;
  }
  function M2(n2, e3) {
    function r3(n3) {
      var t3 = this.props.ref, r4 = t3 == n3.ref;
      return !r4 && t3 && (t3.call ? t3(null) : t3.current = null), e3 ? !e3(this.props, n3) || !r4 : E2(this.props, n3);
    }
    function u3(e4) {
      return this.shouldComponentUpdate = r3, _(n2, e4);
    }
    return u3.displayName = "Memo(" + (n2.displayName || n2.name) + ")", u3.prototype.isReactComponent = true, u3.__f = true, u3.type = n2, u3;
  }
  function D3(n2) {
    function t3(t4) {
      var e3 = g3({}, t4);
      return delete e3.ref, n2(e3, t4.ref || null);
    }
    return t3.$$typeof = A3, t3.render = n2, t3.prototype.isReactComponent = t3.__f = true, t3.displayName = "ForwardRef(" + (n2.displayName || n2.name) + ")", t3;
  }
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
  function z3(n2) {
    var e3, r3, u3;
    function o3(o4) {
      if (e3 || (e3 = n2()).then(function(n3) {
        r3 = n3.default || n3;
      }, function(n3) {
        u3 = n3;
      }), u3)
        throw u3;
      if (!r3)
        throw e3;
      return _(r3, o4);
    }
    return o3.displayName = "Lazy", o3.__f = true, o3;
  }
  function B3() {
    this.i = null, this.l = null;
  }
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
      for (var u3 = e3.__v; null !== u3 && !u3.__m && null !== u3.__; )
        u3 = u3.__;
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
  function nn(n2, t3, e3) {
    return null == t3.__k && (t3.textContent = ""), G(n2, t3), "function" == typeof e3 && e3(), n2 ? n2.__c : null;
  }
  function tn(n2, t3, e3) {
    return J(n2, t3), "function" == typeof e3 && e3(), n2 ? n2.__c : null;
  }
  function rn() {
  }
  function un() {
    return this.cancelBubble;
  }
  function on() {
    return this.defaultPrevented;
  }
  function dn(n2) {
    return _.bind(null, n2);
  }
  function mn(n2) {
    return !!n2 && n2.$$typeof === q3;
  }
  function pn(n2) {
    return mn(n2) && n2.type === k;
  }
  function yn(n2) {
    return !!n2 && !!n2.displayName && ("string" == typeof n2.displayName || n2.displayName instanceof String) && n2.displayName.startsWith("Memo(");
  }
  function _n(n2) {
    return mn(n2) ? K.apply(null, arguments) : n2;
  }
  function bn(n2) {
    return !!n2.__k && (G(null, n2), true);
  }
  function Sn(n2) {
    return n2 && (n2.base || 1 === n2.nodeType && n2) || null;
  }
  var I2, T3, A3, L2, O2, F3, U, H2, q3, G2, J2, K2, Q2, X, en, ln, cn, fn, an, sn, hn, vn, gn, En, Cn, xn, Rn;
  var init_compat_module = __esm({
    "node_modules/preact/compat/dist/compat.module.js"() {
      init_preact_module();
      init_preact_module();
      init_hooks_module();
      init_hooks_module();
      I2 = _2;
      (N2.prototype = new x()).isPureReactComponent = true, N2.prototype.shouldComponentUpdate = function(n2, t3) {
        return E2(this.props, n2) || E2(this.state, t3);
      };
      T3 = l.__b;
      l.__b = function(n2) {
        n2.type && n2.type.__f && n2.ref && (n2.props.ref = n2.ref, n2.ref = null), T3 && T3(n2);
      };
      A3 = "undefined" != typeof Symbol && Symbol.for && Symbol.for("react.forward_ref") || 3911;
      L2 = function(n2, t3) {
        return null == n2 ? null : H(H(n2).map(t3));
      };
      O2 = { map: L2, forEach: L2, count: function(n2) {
        return n2 ? H(n2).length : 0;
      }, only: function(n2) {
        var t3 = H(n2);
        if (1 !== t3.length)
          throw "Children.only";
        return t3[0];
      }, toArray: H };
      F3 = l.__e;
      l.__e = function(n2, t3, e3, r3) {
        if (n2.then) {
          for (var u3, o3 = t3; o3 = o3.__; )
            if ((u3 = o3.__c) && u3.__c)
              return null == t3.__e && (t3.__e = e3.__e, t3.__k = e3.__k), u3.__c(n2, t3);
        }
        F3(n2, t3, e3, r3);
      };
      U = l.unmount;
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
            for (r3.setState({ __a: r3.__b = null }); t4 = r3.o.pop(); )
              t4.forceUpdate();
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
      H2 = function(n2, t3, e3) {
        if (++e3[1] === e3[0] && n2.l.delete(t3), n2.props.revealOrder && ("t" !== n2.props.revealOrder[0] || !n2.l.size))
          for (e3 = n2.i; e3; ) {
            for (; e3.length > 3; )
              e3.pop()();
            if (e3[1] < e3[0])
              break;
            n2.i = e3 = e3[2];
          }
      };
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
        for (var e3 = t3.length; e3--; )
          this.l.set(t3[e3], this.i = [1, 0, this.i]);
        return n2.children;
      }, B3.prototype.componentDidUpdate = B3.prototype.componentDidMount = function() {
        var n2 = this;
        this.l.forEach(function(t3, e3) {
          H2(n2, e3, t3);
        });
      };
      q3 = "undefined" != typeof Symbol && Symbol.for && Symbol.for("react.element") || 60103;
      G2 = /^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/;
      J2 = /^on(Ani|Tra|Tou|BeforeInp|Compo)/;
      K2 = /[A-Z0-9]/g;
      Q2 = "undefined" != typeof document;
      X = function(n2) {
        return ("undefined" != typeof Symbol && "symbol" == typeof Symbol() ? /fil|che|rad/ : /fil|che|ra/).test(n2);
      };
      x.prototype.isReactComponent = {}, ["componentWillMount", "componentWillReceiveProps", "componentWillUpdate"].forEach(function(t3) {
        Object.defineProperty(x.prototype, t3, { configurable: true, get: function() {
          return this["UNSAFE_" + t3];
        }, set: function(n2) {
          Object.defineProperty(this, t3, { configurable: true, writable: true, value: n2 });
        } });
      });
      en = l.event;
      l.event = function(n2) {
        return en && (n2 = en(n2)), n2.persist = rn, n2.isPropagationStopped = un, n2.isDefaultPrevented = on, n2.nativeEvent = n2;
      };
      cn = { enumerable: false, configurable: true, get: function() {
        return this.class;
      } };
      fn = l.vnode;
      l.vnode = function(n2) {
        "string" == typeof n2.type && function(n3) {
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
        }(n2), n2.$$typeof = q3, fn && fn(n2);
      };
      an = l.__r;
      l.__r = function(n2) {
        an && an(n2), ln = n2.__c;
      };
      sn = l.diffed;
      l.diffed = function(n2) {
        sn && sn(n2);
        var t3 = n2.props, e3 = n2.__e;
        null != e3 && "textarea" === n2.type && "value" in t3 && t3.value !== e3.value && (e3.value = null == t3.value ? "" : t3.value), ln = null;
      };
      hn = { ReactCurrentDispatcher: { current: { readContext: function(n2) {
        return ln.__n[n2.__c].props.value;
      }, useCallback: q2, useContext: x2, useDebugValue: P2, useDeferredValue: w3, useEffect: y2, useId: g2, useImperativeHandle: F2, useInsertionEffect: I2, useLayoutEffect: _2, useMemo: T2, useReducer: h2, useRef: A2, useState: d2, useSyncExternalStore: C3, useTransition: k3 } } };
      vn = "18.3.1";
      gn = function(n2, t3) {
        return n2(t3);
      };
      En = function(n2, t3) {
        return n2(t3);
      };
      Cn = k;
      xn = mn;
      Rn = { useState: d2, useId: g2, useReducer: h2, useEffect: y2, useLayoutEffect: _2, useInsertionEffect: I2, useTransition: k3, useDeferredValue: w3, useSyncExternalStore: C3, startTransition: R, useRef: A2, useImperativeHandle: F2, useMemo: T2, useCallback: q2, useContext: x2, useDebugValue: P2, version: "18.3.1", Children: O2, render: nn, hydrate: tn, unmountComponentAtNode: bn, createPortal: $2, createElement: _, createContext: Q, createFactory: dn, cloneElement: _n, createRef: b, Fragment: k, isValidElement: mn, isElement: xn, isFragment: pn, isMemo: yn, findDOMNode: Sn, Component: x, PureComponent: N2, memo: M2, forwardRef: D3, flushSync: En, unstable_batchedUpdates: gn, StrictMode: Cn, Suspense: P3, SuspenseList: B3, lazy: z3, __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: hn };
    }
  });

  // extensions/storefront-src/core/api.ts
  var ApiClient = class {
    constructor(config) {
      this.config = config;
      this.baseUrl = config.apiUrl || "/apps/split-pop";
    }
    /**
     * Log debug messages
     */
    log(...args) {
      if (this.config.debug) {
        console.log("[Split-Pop API]", ...args);
      }
    }
    /**
     * Detect device type from user agent and screen size
     */
    detectDeviceType() {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent
      );
      const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);
      if (isMobile) {
        return "mobile";
      } else if (isTablet) {
        return "tablet";
      } else {
        return "desktop";
      }
    }
    /**
     * Build URL with query parameters
     */
    buildUrl(path, params) {
      const url = new URL(path, window.location.origin);
      url.pathname = `${this.baseUrl}${path}`;
      Object.entries(params).forEach(([key, value]) => {
        if (value !== void 0 && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
      return url.toString();
    }
    /**
     * Fetch active campaigns for current page
     */
    async fetchActiveCampaigns(sessionId) {
      var _a;
      console.log(
        `[Split-Pop API] \u{1F680} fetchActiveCampaigns called with sessionId: ${sessionId}`
      );
      console.log(`[Split-Pop API] \u{1F527} this.config:`, this.config);
      const params = {
        shop: this.config.shopDomain,
        session_id: sessionId,
        page_type: this.config.pageType || "unknown",
        page_url: this.config.pageUrl || window.location.pathname,
        device_type: this.detectDeviceType(),
        customer_id: this.config.customerId,
        cart_token: this.config.cartToken,
        product_id: this.config.productId,
        collection_id: this.config.collectionId
      };
      if (this.config.previewMode && this.config.previewId) {
        params.preview_mode = "true";
        params.preview_id = this.config.previewId;
        console.log(
          `[Split-Pop API] \u{1F50D} Preview mode enabled for campaign: ${this.config.previewId}`
        );
      }
      const url = this.buildUrl("/campaigns/active", params);
      console.log(`[Split-Pop API] \u{1F4E1} Fetching active campaigns...`);
      console.log(`[Split-Pop API] \u{1F517} URL: ${url}`);
      console.log(`[Split-Pop API] \u{1F4CB} Params:`, params);
      try {
        console.log(`[Split-Pop API] \u23F3 Making fetch request...`);
        const response = await fetch(url);
        console.log(
          `[Split-Pop API] \u{1F4E8} Response status: ${response.status} ${response.statusText}`
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(`[Split-Pop API] \u2705 Campaigns received:`, data);
        console.log(
          `[Split-Pop API] \u{1F4CA} Number of campaigns: ${((_a = data.campaigns) == null ? void 0 : _a.length) || 0}`
        );
        return data;
      } catch (error) {
        console.error(`[Split-Pop API] \u274C Error fetching campaigns:`, error);
        return { campaigns: [] };
      }
    }
    /**
     * Submit lead (email capture)
     */
    async submitLead(campaignId, email, sessionId, consent = true) {
      var _a;
      const url = this.buildUrl("/commerce/leads/subscribe", {
        shop: this.config.shopDomain
      });
      this.log("Submitting lead:", { campaignId, email });
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            campaignId,
            consent,
            sessionId,
            pageUrl: window.location.href,
            referrer: document.referrer
          })
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(
            error.error || ((_a = error.errors) == null ? void 0 : _a[0]) || "Submission failed"
          );
        }
        const data = await response.json();
        this.log("Lead submitted successfully:", data);
        return {
          success: true,
          leadId: data.leadId,
          discountCode: data.discountCode
        };
      } catch (error) {
        this.log("Error submitting lead:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Submission failed"
        };
      }
    }
    /**
     * Record frequency (for server-side frequency capping)
     */
    async recordFrequency(sessionId, campaignId) {
      const url = this.buildUrl("/frequency/record", {
        shop: this.config.shopDomain
      });
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
        this.log("Error recording frequency:", error);
      }
    }
    /**
     * Add product to cart (storefront integration)
     */
    async addToCart(productId) {
      const url = this.buildUrl("/commerce/cart/add", {
        shop: this.config.shopDomain
      });
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId })
        });
        return { success: res.ok };
      } catch (e3) {
        return { success: false };
      }
    }
    /**
     * Apply discount (storefront integration)
     */
    async applyDiscount(params) {
      const url = this.buildUrl("/commerce/discounts/apply", {
        shop: this.config.shopDomain
      });
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params)
        });
        return { success: res.ok };
      } catch (e3) {
        return { success: false };
      }
    }
    /**
     * Track A/B testing conversion event
     */
    async trackConversion(campaignId, variantId, sessionId, conversionType, value) {
      const url = this.buildUrl("/api/ab-testing/track-conversion", {
        shop: this.config.shopDomain
      });
      try {
        await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            campaignId,
            variantId,
            sessionId,
            conversionType,
            value,
            timestamp: Date.now(),
            pageUrl: window.location.href
          })
        });
      } catch (error) {
        this.log("Error tracking conversion:", error);
      }
    }
  };

  // extensions/storefront-src/utils/common.ts
  var STORAGE_KEYS = {
    SESSION: "split-pop-session",
    DISPLAYED_CAMPAIGNS: "splitpop_displayed_campaigns",
    RECENTLY_CLOSED: "splitpop_recently_closed_until"
  };
  function createLogger(prefix, debug = false) {
    return (...args) => {
      if (debug) {
        console.log(`[${prefix}]`, ...args);
      }
    };
  }
  function safeLocalStorageSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`[Split-Pop] Failed to save to localStorage:`, error);
      return false;
    }
  }
  function safeLocalStorageGet(key, fallback) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch (error) {
      console.warn(`[Split-Pop] Failed to read from localStorage:`, error);
      return fallback;
    }
  }
  function safeLocalStorageRemove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`[Split-Pop] Failed to remove from localStorage:`, error);
      return false;
    }
  }
  function safeSessionStorageSet(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`[Split-Pop] Failed to save to sessionStorage:`, error);
      return false;
    }
  }
  function safeSessionStorageGet(key, fallback) {
    try {
      const stored = sessionStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch (error) {
      console.warn(`[Split-Pop] Failed to read from sessionStorage:`, error);
      return fallback;
    }
  }
  function isBrowser() {
    return typeof window !== "undefined";
  }

  // extensions/storefront-src/core/session.ts
  var SessionManager = class {
    constructor() {
      this.sessionId = "";
      this.shownCampaigns = /* @__PURE__ */ new Set();
      this.sessionData = null;
      this.loadSessionData();
    }
    /**
     * Load session data from localStorage
     */
    loadSessionData() {
      const sessionData = safeLocalStorageGet(STORAGE_KEYS.SESSION, null);
      if (sessionData && sessionData.sessionId) {
        this.sessionData = sessionData;
        this.sessionId = sessionData.sessionId;
        this.shownCampaigns = new Set(sessionData.shownCampaigns || []);
      } else {
        this.createNewSession();
      }
    }
    /**
     * Create new session
     */
    createNewSession() {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.shownCampaigns = /* @__PURE__ */ new Set();
      this.sessionData = {
        sessionId: this.sessionId,
        shownCampaigns: [],
        timestamp: Date.now()
      };
      this.saveSessionData();
    }
    /**
     * Save session data to localStorage
     */
    saveSessionData() {
      this.sessionData = {
        sessionId: this.sessionId,
        shownCampaigns: [...this.shownCampaigns],
        timestamp: Date.now()
      };
      safeLocalStorageSet(STORAGE_KEYS.SESSION, this.sessionData);
    }
    /**
     * Get current session ID
     */
    getSessionId() {
      this.saveSessionData();
      return this.sessionId;
    }
    /**
     * Check if campaign was shown this session
     */
    wasShown(campaignId) {
      return this.shownCampaigns.has(campaignId);
    }
    /**
     * Mark campaign as shown
     */
    markShown(campaignId) {
      this.shownCampaigns.add(campaignId);
      this.saveSessionData();
    }
    /**
     * Clear session data (for debugging)
     */
    clear() {
      this.shownCampaigns.clear();
      safeLocalStorageRemove(STORAGE_KEYS.SESSION);
      this.sessionData = null;
      this.sessionId = "";
    }
    /**
     * Get session data (for debugging)
     */
    getData() {
      var _a;
      return {
        sessionId: this.sessionId,
        shownCampaigns: [...this.shownCampaigns],
        timestamp: ((_a = this.sessionData) == null ? void 0 : _a.timestamp) || Date.now()
      };
    }
  };
  var sessionInstance;
  var session = {
    getSessionId: () => {
      const storedData = safeLocalStorageGet(STORAGE_KEYS.SESSION, null);
      if (storedData == null ? void 0 : storedData.sessionId) {
        if (!sessionInstance || getInstance().getSessionId() !== storedData.sessionId) {
          sessionInstance = new SessionManager();
        }
        return storedData.sessionId;
      }
      return getInstance().getSessionId();
    },
    wasShown: (campaignId) => {
      const instance = getInstanceIfExists();
      if (instance && instance.wasShown(campaignId))
        return true;
      const storedData = safeLocalStorageGet(STORAGE_KEYS.SESSION, null);
      if (storedData && Array.isArray(storedData.shownCampaigns)) {
        return storedData.shownCampaigns.includes(campaignId);
      }
      return false;
    },
    markShown: (campaignId) => {
      const storedData = safeLocalStorageGet(STORAGE_KEYS.SESSION, null);
      const storedId = (storedData == null ? void 0 : storedData.sessionId) || null;
      session.getSessionId();
      const result = getInstance().markShown(campaignId);
      if (storedId) {
        const current = getInstance().getData();
        safeLocalStorageSet(STORAGE_KEYS.SESSION, __spreadProps(__spreadValues({}, current), {
          sessionId: storedId
        }));
      }
      return result;
    },
    clear: () => {
      getInstance().clear();
      sessionInstance = void 0;
    },
    getData: () => {
      const storedData = safeLocalStorageGet(STORAGE_KEYS.SESSION, null);
      if (storedData) {
        return {
          sessionId: storedData.sessionId || getInstance().getSessionId(),
          shownCampaigns: Array.isArray(storedData.shownCampaigns) ? storedData.shownCampaigns : [],
          timestamp: typeof storedData.timestamp === "number" ? storedData.timestamp : Date.now()
        };
      }
      return getInstance().getData();
    },
    // Test helper to reset instance
    _reset: () => {
      sessionInstance = new SessionManager();
    }
  };
  function getInstance() {
    if (!sessionInstance) {
      sessionInstance = new SessionManager();
    }
    return sessionInstance;
  }
  function getInstanceIfExists() {
    return sessionInstance || null;
  }

  // extensions/storefront-src/utils/trigger-extraction.ts
  function extractTriggerConfig(targetRules) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
    const enhancedTriggers = targetRules == null ? void 0 : targetRules.enhancedTriggers;
    if (!(enhancedTriggers == null ? void 0 : enhancedTriggers.enabled)) {
      return { type: "page_load", delay: 0 };
    }
    if ((_a = enhancedTriggers.add_to_cart) == null ? void 0 : _a.enabled) {
      return {
        type: "add_to_cart",
        delay: enhancedTriggers.add_to_cart.delay || 500
      };
    }
    if ((_b = enhancedTriggers.cart_drawer_open) == null ? void 0 : _b.enabled) {
      return { type: "cart_drawer_open" };
    }
    if ((_c = enhancedTriggers.product_view) == null ? void 0 : _c.enabled) {
      return { type: "product_view" };
    }
    if ((_d = enhancedTriggers.cart_value) == null ? void 0 : _d.enabled) {
      return {
        type: "cart_value",
        cartValueThreshold: enhancedTriggers.cart_value.minValue || 0
      };
    }
    if ((_e = enhancedTriggers.custom_event) == null ? void 0 : _e.enabled) {
      return {
        type: "custom_event",
        eventName: enhancedTriggers.custom_event.event_name || "splitpop:custom"
      };
    }
    if ((_f = enhancedTriggers.exit_intent) == null ? void 0 : _f.enabled) {
      return { type: "exit_intent" };
    }
    if ((_g = enhancedTriggers.scroll_depth) == null ? void 0 : _g.enabled) {
      return {
        type: "scroll_depth",
        scrollDepth: enhancedTriggers.scroll_depth.depth_percentage || 50
      };
    }
    if ((_h = enhancedTriggers.idle_timer) == null ? void 0 : _h.enabled) {
      return {
        type: "idle_timer",
        delay: (enhancedTriggers.idle_timer.idle_duration || 30) * 1e3
      };
    }
    if ((_i = enhancedTriggers.device_targeting) == null ? void 0 : _i.enabled) {
      return {
        type: "device_targeting",
        targetDevices: (enhancedTriggers.device_targeting.device_types || [
          "mobile",
          "tablet",
          "desktop"
        ]).filter(
          (device) => ["mobile", "tablet", "desktop"].includes(device)
        )
      };
    }
    if ((_j = enhancedTriggers.time_delay) == null ? void 0 : _j.enabled) {
      return {
        type: "time_delay",
        delay: enhancedTriggers.time_delay.delay || 3e3
      };
    }
    if ((_k = enhancedTriggers.page_load) == null ? void 0 : _k.enabled) {
      return {
        type: "page_load",
        delay: enhancedTriggers.page_load.delay || 0
      };
    }
    return { type: "page_load", delay: 0 };
  }

  // extensions/storefront-src/core/PopupManagerCore.ts
  init_compat_module();
  init_preact_module();
  var PopupManagerCore = class {
    constructor(config) {
      this.triggersCleanupRef = null;
      this.triggersResumeAtRef = 0;
      this.currentPopup = null;
      this.state = {
        activeCampaign: null,
        displayedCampaigns: /* @__PURE__ */ new Set(),
        cooldownCampaigns: /* @__PURE__ */ new Set()
      };
      this.callbacks = config.callbacks;
      this.debug = config.debug || false;
      this.log = createLogger("Split-Pop PopupManagerCore", this.debug);
      this.loadDisplayedCampaigns();
    }
    // State getters
    getActiveCampaign() {
      return this.state.activeCampaign;
    }
    getDisplayedCampaigns() {
      return this.state.displayedCampaigns;
    }
    getCooldownCampaigns() {
      return this.state.cooldownCampaigns;
    }
    // State setters (for framework adapters)
    setActiveCampaign(campaign) {
      this.state.activeCampaign = campaign;
    }
    setDisplayedCampaigns(campaigns) {
      this.state.displayedCampaigns = campaigns;
    }
    setCooldownCampaigns(campaigns) {
      this.state.cooldownCampaigns = campaigns;
    }
    // Load displayed campaigns from localStorage
    loadDisplayedCampaigns() {
      if (isBrowser()) {
        const data = safeLocalStorageGet(STORAGE_KEYS.DISPLAYED_CAMPAIGNS, {
          displayed: [],
          cooldowns: []
        });
        this.state.displayedCampaigns = new Set(data.displayed || []);
        this.state.cooldownCampaigns = new Set(data.cooldowns || []);
      }
    }
    // Save displayed campaigns to localStorage
    saveDisplayedCampaigns(displayed, cooldowns) {
      if (isBrowser()) {
        const data = {
          displayed: Array.from(displayed),
          cooldowns: Array.from(cooldowns)
        };
        safeLocalStorageSet(STORAGE_KEYS.DISPLAYED_CAMPAIGNS, data);
      }
    }
    // Check if campaign can be displayed
    canDisplayCampaign(campaign) {
      if (campaign.previewMode) {
        return true;
      }
      if (isBrowser()) {
        const until = safeSessionStorageGet(
          `${STORAGE_KEYS.RECENTLY_CLOSED}:${campaign.id}`,
          0
        );
        if (until && until > Date.now()) {
          return false;
        }
      }
      if (this.state.displayedCampaigns.has(campaign.id)) {
        return false;
      }
      if (this.state.cooldownCampaigns.has(campaign.id)) {
        return false;
      }
      return true;
    }
    // Show popup
    async showPopup(campaign) {
      var _a, _b;
      console.log(
        `[PopupManagerCore] showPopup called for campaign ${campaign.id}`
      );
      console.log(
        `[PopupManagerCore] canDisplayCampaign: ${this.canDisplayCampaign(campaign)}, activeCampaign: ${!!this.state.activeCampaign}`
      );
      if (!this.canDisplayCampaign(campaign) || this.state.activeCampaign) {
        console.log(
          `[PopupManagerCore] Skipping showPopup - campaign cannot be displayed or popup already active`
        );
        return false;
      }
      const newDisplayed = new Set(this.state.displayedCampaigns);
      newDisplayed.add(campaign.id);
      this.state.displayedCampaigns = newDisplayed;
      this.saveDisplayedCampaigns(newDisplayed, this.state.cooldownCampaigns);
      this.state.activeCampaign = campaign;
      (_b = (_a = this.callbacks).onPopupShow) == null ? void 0 : _b.call(_a, campaign.campaignId);
      return true;
    }
    // Close popup
    closePopup() {
      var _a, _b;
      if (!this.state.activeCampaign)
        return;
      const campaignId = this.state.activeCampaign.campaignId;
      if (isBrowser()) {
        const debounceMs = 5e3;
        const until = Date.now() + debounceMs;
        safeSessionStorageSet(
          `${STORAGE_KEYS.RECENTLY_CLOSED}:${this.state.activeCampaign.id}`,
          until
        );
      }
      (_b = (_a = this.callbacks).onPopupClose) == null ? void 0 : _b.call(_a, campaignId);
      if (this.state.activeCampaign.cooldownMinutes) {
        const newCooldowns = new Set(this.state.cooldownCampaigns);
        newCooldowns.add(campaignId);
        this.state.cooldownCampaigns = newCooldowns;
        this.saveDisplayedCampaigns(this.state.displayedCampaigns, newCooldowns);
        setTimeout(
          () => {
            const updated = new Set(this.state.cooldownCampaigns);
            updated.delete(campaignId);
            this.state.cooldownCampaigns = updated;
          },
          this.state.activeCampaign.cooldownMinutes * 60 * 1e3
        );
      }
      this.state.activeCampaign = null;
    }
    // Handle popup button click
    handlePopupClick() {
      var _a, _b;
      if (!this.state.activeCampaign)
        return;
      (_b = (_a = this.callbacks).onPopupClick) == null ? void 0 : _b.call(
        _a,
        this.state.activeCampaign.campaignId,
        this.state.activeCampaign.buttonUrl
      );
      if (this.state.activeCampaign.buttonUrl) {
        window.open(this.state.activeCampaign.buttonUrl, "_blank");
      }
      this.closePopup();
    }
    // Get available campaigns (filtered and sorted)
    getAvailableCampaigns(campaigns) {
      return campaigns.filter((campaign) => this.canDisplayCampaign(campaign)).sort((a3, b3) => b3.priority - a3.priority);
    }
    // Setup triggers for campaigns
    setupTriggers(campaigns) {
      const availableCampaigns = this.getAvailableCampaigns(campaigns);
      console.log(
        "[PopupManagerCore] Available campaigns:",
        availableCampaigns.length
      );
      const previewCandidate = availableCampaigns.find((c3) => c3.previewMode);
      if (previewCandidate && !this.state.activeCampaign) {
        console.log(
          "[PopupManagerCore] Preview mode detected, showing immediately:",
          previewCandidate.campaignId
        );
        setTimeout(() => this.showPopup(previewCandidate), 0);
        return () => {
        };
      }
      if (availableCampaigns.length === 0 || this.state.activeCampaign) {
        console.log(
          "[PopupManagerCore] Skipping trigger setup, availableCampaigns:",
          availableCampaigns.length,
          "activeCampaign:",
          !!this.state.activeCampaign
        );
        return () => {
        };
      }
      const removers = [];
      const highestPriorityCampaign = availableCampaigns[0];
      if (!highestPriorityCampaign) {
        console.log(
          "[PopupManagerCore] No campaigns available for trigger setup"
        );
        return () => {
        };
      }
      const campaign = highestPriorityCampaign;
      const triggerConfig = extractTriggerConfig(campaign);
      console.log(
        `[PopupManagerCore] Setting up triggers for campaign ${campaign.id} with config:`,
        triggerConfig
      );
      this.setupTriggerType(campaign, triggerConfig, removers);
      this.triggersCleanupRef = () => {
        removers.forEach((fn2) => {
          try {
            fn2();
          } catch (e3) {
          }
        });
      };
      return this.triggersCleanupRef;
    }
    // Setup specific trigger type
    setupTriggerType(campaign, triggerConfig, removers) {
      var _a, _b;
      switch (triggerConfig.type) {
        case "time_delay":
        case "page_load": {
          const delay = triggerConfig.delay || 0;
          console.log(
            `[PopupManagerCore] Setting up ${triggerConfig.type} trigger for campaign ${campaign.id} with delay: ${delay}ms`
          );
          const t3 = setTimeout(() => {
            console.log(
              `[PopupManagerCore] ${triggerConfig.type} trigger fired for campaign ${campaign.id}`
            );
            this.showPopup(campaign);
          }, delay);
          removers.push(() => clearTimeout(t3));
          break;
        }
        case "scroll_depth": {
          const targetPercentage = (_b = (_a = triggerConfig.scrollDepth) != null ? _a : triggerConfig.scrollPercentage) != null ? _b : 50;
          console.log(
            `[PopupManagerCore] Setting up scroll_depth trigger with target: ${targetPercentage}%`
          );
          const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercentage = scrollTop / documentHeight * 100;
            if (scrollPercentage >= targetPercentage) {
              console.log(
                `[PopupManagerCore] scroll_depth trigger fired at ${scrollPercentage}%`
              );
              this.showPopup(campaign);
              window.removeEventListener("scroll", handleScroll);
            }
          };
          window.addEventListener("scroll", handleScroll, { passive: true });
          removers.push(() => window.removeEventListener("scroll", handleScroll));
          break;
        }
        case "exit_intent": {
          console.log(`[PopupManagerCore] Setting up exit_intent trigger`);
          const handleMouseLeave = (e3) => {
            if (e3.clientY <= 0) {
              console.log(`[PopupManagerCore] exit_intent trigger fired`);
              this.showPopup(campaign);
              document.removeEventListener("mouseleave", handleMouseLeave);
            }
          };
          document.addEventListener("mouseleave", handleMouseLeave);
          removers.push(
            () => document.removeEventListener("mouseleave", handleMouseLeave)
          );
          break;
        }
        case "product_view": {
          const isProductPage = () => {
            var _a2;
            return window.location.pathname.includes("/products/") || document.body.classList.contains("template-product") || Boolean(document.querySelector("[data-product-id]")) || Boolean(window.product) || Boolean((_a2 = window.meta) == null ? void 0 : _a2.product);
          };
          if (isProductPage()) {
            const delay = triggerConfig.delay || 1e3;
            console.log(
              `[PopupManagerCore] Setting up product_view trigger with delay: ${delay}ms`
            );
            const t3 = setTimeout(() => {
              console.log(`[PopupManagerCore] product_view trigger fired`);
              this.showPopup(campaign);
            }, delay);
            removers.push(() => clearTimeout(t3));
          } else {
            console.log(
              `[PopupManagerCore] product_view trigger conditions not met`
            );
          }
          break;
        }
        case "add_to_cart": {
          console.log(`[PopupManagerCore] Setting up add_to_cart trigger`);
          const handleAddToCart = (e3) => {
            const target = e3.target;
            if (target.matches('[name="add"]') || target.matches(".btn-add-to-cart") || target.closest("[data-add-to-cart]")) {
              console.log(`[PopupManagerCore] add_to_cart trigger fired`);
              this.showPopup(campaign);
            }
          };
          document.addEventListener("click", handleAddToCart, true);
          removers.push(
            () => document.removeEventListener("click", handleAddToCart, true)
          );
          break;
        }
        case "checkout_start": {
          console.log(`[PopupManagerCore] Setting up checkout_start trigger`);
          const handleCheckoutClick = (e3) => {
            const target = e3.target;
            if (target.matches('[name="checkout"]') || target.matches(".checkout-button") || target.closest('[href*="/checkout"]')) {
              e3.preventDefault();
              console.log(`[PopupManagerCore] checkout_start trigger fired`);
              this.showPopup(campaign);
            }
          };
          document.addEventListener("click", handleCheckoutClick, true);
          removers.push(
            () => document.removeEventListener("click", handleCheckoutClick, true)
          );
          break;
        }
        case "custom_event": {
          const eventName = triggerConfig.eventName || triggerConfig.customEventName || "splitpop:custom";
          console.log(
            `[PopupManagerCore] Setting up custom_event trigger for: ${eventName}`
          );
          const handleCustomEvent = () => {
            console.log(
              `[PopupManagerCore] custom_event trigger fired: ${eventName}`
            );
            this.showPopup(campaign);
          };
          window.addEventListener(eventName, handleCustomEvent);
          removers.push(
            () => window.removeEventListener(eventName, handleCustomEvent)
          );
          break;
        }
        default:
          console.warn(
            `[PopupManagerCore] Unknown trigger type: ${triggerConfig.type}`
          );
      }
    }
    // Cleanup triggers
    cleanupTriggers() {
      var _a;
      (_a = this.triggersCleanupRef) == null ? void 0 : _a.call(this);
      this.triggersCleanupRef = null;
    }
    // Check if triggers should be resumed
    shouldResumeTriggersAt() {
      return this.triggersResumeAtRef;
    }
    // Set triggers resume time
    setTriggersResumeAt(time) {
      this.triggersResumeAtRef = Math.max(this.triggersResumeAtRef, time);
    }
    // Pause triggers briefly (after popup close)
    pauseTriggersBriefly() {
      this.cleanupTriggers();
      this.setTriggersResumeAt(Date.now() + 300);
    }
    // ============================================================================
    // RENDERING METHODS (merged from PopupRenderer)
    // ============================================================================
    /**
     * Show popup for a campaign (merged from PopupRenderer.showPopup)
     */
    async renderPopup(campaign, onClose) {
      this.log(`\u{1F3A8} Starting to show popup for campaign: ${campaign.id}`);
      this.log("\u{1F9F9} Closing any existing popup...");
      this.closeRenderedPopup();
      this.log("\u{1F4E6} Creating popup container...");
      const container = this.createContainer(campaign);
      this.currentPopup = container;
      this.log("\u269B\uFE0F Mounting Preact component...");
      try {
        await this.mountComponent(container, campaign, onClose);
        this.log("\u2705 Component mounted successfully");
      } catch (error) {
        console.error(
          `[Split-Pop PopupManagerCore] \u274C Error mounting component:`,
          error
        );
        throw error;
      }
      this.log("\u{1F333} Adding popup to DOM...");
      document.body.appendChild(container);
      try {
        container.style.visibility = "visible";
        container.style.opacity = "1";
        this.log("\u{1F441}\uFE0F Container visibility forced to visible");
      } catch (e3) {
      }
      this.log("\u{1F3AD} Adding styles...");
      this.addStyles();
      this.log("\u2705 Popup displayed successfully!");
    }
    /**
     * Close current rendered popup
     */
    closeRenderedPopup() {
      if (this.currentPopup) {
        this.log("Closing rendered popup");
        this.currentPopup.style.opacity = "0";
        setTimeout(() => {
          if (this.currentPopup) {
            this.currentPopup.remove();
            this.currentPopup = null;
          }
        }, 300);
      }
    }
    /**
     * Create popup container element
     */
    createContainer(campaign) {
      const container = document.createElement("div");
      container.id = "split-pop-container";
      if (campaign == null ? void 0 : campaign.templateType) {
        container.setAttribute("data-popup-type", campaign.templateType);
      }
      container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      display: block !important;
      /* Use extremely high z-index to sit above password/third-party overlays */
      z-index: 2147483647;
      opacity: 0;
      visibility: visible;
      pointer-events: none;
      transition: opacity 0.3s ease;
    `;
      container.appendChild(document.createTextNode("\u200B"));
      requestAnimationFrame(() => {
        try {
          container.style.visibility = "visible";
          container.style.opacity = "1";
        } catch (e3) {
          console.warn(
            "[Split-Pop PopupManagerCore] Could not update container visibility on rAF",
            e3
          );
        }
      });
      return container;
    }
    /**
     * Mount Preact component in Shadow DOM
     */
    async mountComponent(container, campaign, onClose) {
      this.log("\u{1F527} Creating shadow DOM...");
      const shadow = container.attachShadow({ mode: "open" });
      try {
        const css = campaign.injectedCSS || campaign.customCSS || "";
        if (css && typeof css === "string") {
          const styleEl = document.createElement("style");
          styleEl.textContent = css;
          shadow.appendChild(styleEl);
        }
      } catch (e3) {
      }
      const root = document.createElement("div");
      root.setAttribute("data-split-pop-root", "");
      root.style.cssText = `
      width: 100%;
      height: 100%;
      position: relative;
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
      shadow.appendChild(root);
      this.log("\u2705 Shadow DOM created");
      const config = this.prepareCampaignConfig(campaign);
      this.log(`\u{1F4CB} Campaign config prepared:`, config);
      this.log(`\u{1F4CB} Config has id:`, !!config.id);
      this.log(`\u{1F4CB} Config has campaignId:`, !!config.campaignId);
      const PopupManager = ({ campaigns, onPopupClose, renderInline }) => {
        this.log("\u{1F3AF} PopupManager called with:", {
          campaigns,
          onPopupClose: !!onPopupClose,
          renderInline
        });
        const campaign2 = campaigns == null ? void 0 : campaigns[0];
        if (!campaign2) {
          this.log("\u274C No campaign found in PopupManager");
          return null;
        }
        this.log("\u{1F3AF} Inline PopupManager rendering campaign:", {
          id: campaign2.id,
          templateType: campaign2.templateType,
          name: campaign2.name
        });
        if (campaign2.templateType === "social-proof") {
          this.log("\u{1F514} Rendering social proof notifications");
          return this.renderSocialProofNotifications(campaign2, _);
        }
        const contentConfig = campaign2.contentConfig || {};
        const headline = contentConfig.headline || campaign2.name || "Welcome!";
        const subheadline = contentConfig.subheadline || contentConfig.description || "Special offer for you";
        const buttonText = contentConfig.buttonText || "Get Offer";
        return _(
          "div",
          {
            style: {
              position: "fixed",
              top: "0",
              left: "0",
              width: "100%",
              height: "100%",
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1e4
            }
          },
          [
            _(
              "div",
              {
                style: {
                  background: "white",
                  padding: "30px",
                  borderRadius: "12px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                  maxWidth: "400px",
                  width: "90%",
                  textAlign: "center",
                  position: "relative"
                }
              },
              [
                // Close button
                _(
                  "button",
                  {
                    onClick: onPopupClose,
                    style: {
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      background: "none",
                      border: "none",
                      fontSize: "20px",
                      cursor: "pointer",
                      color: "#666",
                      width: "30px",
                      height: "30px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }
                  },
                  "\xD7"
                ),
                // Headline
                _(
                  "h2",
                  {
                    style: {
                      margin: "0 0 15px 0",
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#333"
                    }
                  },
                  headline
                ),
                // Subheadline
                _(
                  "p",
                  {
                    style: {
                      margin: "0 0 20px 0",
                      fontSize: "16px",
                      color: "#666",
                      lineHeight: "1.4"
                    }
                  },
                  subheadline
                ),
                // Email input (for newsletter popups)
                campaign2.templateType === "newsletter" ? _("input", {
                  type: "email",
                  placeholder: "Enter your email",
                  style: {
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "16px",
                    marginBottom: "15px",
                    boxSizing: "border-box"
                  }
                }) : null,
                // Action button
                _(
                  "button",
                  {
                    onClick: onPopupClose,
                    style: {
                      background: "#007cba",
                      color: "white",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: "bold",
                      width: "100%"
                    }
                  },
                  buttonText
                )
              ]
            )
          ]
        );
      };
      this.log("\u269B\uFE0F Rendering PopupManager component...");
      this.log("\u{1F4CA} Campaigns array being passed:", [config]);
      this.log("\u{1F4CA} First campaign:", config);
      this.log("\u{1F4CA} PopupManager available:", typeof PopupManager);
      this.log("\u{1F4CA} Preact h available:", typeof _);
      this.log("\u{1F4CA} Preact render available:", typeof nn);
      this.log("\u{1F4CA} Root element:", root);
      try {
        this.log("\u{1F504} Creating Preact element...");
        const element = _(PopupManager, {
          campaigns: [config],
          onPopupClose: onClose,
          renderInline: true
          // Render inline for Shadow DOM (don't use portal)
        });
        this.log("\u{1F4CA} Preact element created:", !!element);
        this.log("\u{1F4CA} Element type:", typeof element);
        this.log("\u{1F504} Calling Preact render...");
        nn(element, root);
        this.log("\u2705 PopupManager rendered");
        this.log("\u{1F4CA} Root innerHTML after render:", root.innerHTML);
        this.log("\u{1F4CA} Root children count:", root.children.length);
      } catch (error) {
        console.error(
          "[Split-Pop PopupManagerCore] \u274C PopupManager render error:",
          error
        );
        console.error("\u274C Error stack:", error.stack);
      }
      this.log(`\u{1F4CA} Root element children: ${root.children.length}`);
      this.log(`\u{1F4CA} Root element innerHTML:`, root.innerHTML.substring(0, 200));
    }
    /**
     * Prepare campaign configuration for rendering
     */
    prepareCampaignConfig(campaign) {
      this.log(`\u{1F50D} Preparing campaign:`, campaign.id);
      const storefrontCampaign = __spreadProps(__spreadValues({}, campaign), {
        previewMode: true,
        // Always true - show immediately when renderPopup() is called
        normalizedTemplateType: campaign.templateType
        // Map templateType to normalizedTemplateType
      });
      this.log(`\u2705 Campaign prepared:`, {
        id: storefrontCampaign.id,
        priority: storefrontCampaign.priority,
        normalizedTemplateType: storefrontCampaign.normalizedTemplateType,
        previewMode: storefrontCampaign.previewMode
      });
      return storefrontCampaign;
    }
    /**
     * Add global styles for animations
     */
    addStyles() {
      if (document.getElementById("split-pop-styles"))
        return;
      const style = document.createElement("style");
      style.id = "split-pop-styles";
      style.textContent = `
      @keyframes splitPopFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes splitPopSlideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      #split-pop-container {
        animation: splitPopFadeIn 0.3s ease;
      }
    `;
      document.head.appendChild(style);
    }
    renderSocialProofNotifications(campaign, h3) {
      this.log(
        "\u{1F514} Creating social proof notifications for campaign:",
        campaign.id
      );
      const contentConfig = campaign.contentConfig || {};
      return h3(
        "div",
        {
          id: "social-proof-container",
          style: {
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 1e4,
            pointerEvents: "none"
          }
        },
        [
          // Recent purchase notification
          h3(
            "div",
            {
              className: "social-proof-notification recent-purchase",
              style: {
                background: "white",
                padding: "15px 20px",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                marginBottom: "10px",
                maxWidth: "300px",
                fontSize: "14px",
                border: "1px solid #e0e0e0",
                animation: "slideInRight 0.5s ease-out",
                pointerEvents: "auto"
              }
            },
            [
              h3(
                "div",
                {
                  style: { fontWeight: "bold", marginBottom: "5px" }
                },
                "\u{1F6CD}\uFE0F Recent Purchase"
              ),
              h3(
                "div",
                {},
                contentConfig.recentPurchaseText || "Someone just bought this item!"
              )
            ]
          ),
          // Live visitor count
          h3(
            "div",
            {
              className: "social-proof-notification visitor-count",
              style: {
                background: "white",
                padding: "12px 16px",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                fontSize: "13px",
                border: "1px solid #e0e0e0",
                animation: "slideInRight 0.5s ease-out 0.5s both",
                pointerEvents: "auto"
              }
            },
            [
              h3(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }
                },
                [
                  h3("span", {
                    style: {
                      width: "8px",
                      height: "8px",
                      background: "#22c55e",
                      borderRadius: "50%",
                      animation: "pulse 2s infinite"
                    }
                  }),
                  h3(
                    "span",
                    {},
                    contentConfig.visitorCountText || "12 people viewing this page"
                  )
                ]
              )
            ]
          )
        ]
      );
    }
  };

  // extensions/storefront-src/utils/helpers.ts
  function getConfig() {
    var _a;
    const urlParams = new URLSearchParams(window.location.search);
    const previewId = urlParams.get("split_pop_preview");
    const config = __spreadValues(__spreadValues({
      shopDomain: ((_a = window.Shopify) == null ? void 0 : _a.shop) || window.location.hostname,
      debug: false
    }, window.SPLIT_POP_CONFIG), previewId && {
      previewMode: true,
      previewId
    });
    return config;
  }
  function waitForDOMReady() {
    return new Promise((resolve) => {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => resolve());
      } else {
        resolve();
      }
    });
  }

  // extensions/storefront-src/core/analytics.ts
  var AnalyticsService = class {
    /**
     * Track variant impression
     */
    static trackVariantView(campaignId, variantId, sessionId, metadata) {
      this.trackEvent(variantId, sessionId, "view", void 0, __spreadProps(__spreadValues({
        campaignId
      }, metadata), {
        pageUrl: window.location.href,
        timestamp: Date.now()
      }));
      console.log("[Split-Pop Analytics] Variant view tracked:", {
        campaignId,
        variantId,
        sessionId,
        metadata
      });
    }
    /**
     * Track variant interaction (click, form submission, etc.)
     */
    static trackVariantInteraction(campaignId, variantId, sessionId, interactionType, metadata) {
      this.trackEvent(variantId, sessionId, "interaction", void 0, __spreadProps(__spreadValues({
        campaignId,
        interactionType
      }, metadata), {
        pageUrl: window.location.href,
        timestamp: Date.now()
      }));
      console.log("[Split-Pop Analytics] Variant interaction tracked:", {
        campaignId,
        variantId,
        sessionId,
        interactionType,
        metadata
      });
    }
    /**
     * Track variant conversion
     */
    static trackVariantConversion(campaignId, variantId, sessionId, value, metadata) {
      this.trackEvent(variantId, sessionId, "conversion", value, __spreadProps(__spreadValues({
        campaignId,
        conversionValue: value
      }, metadata), {
        pageUrl: window.location.href,
        timestamp: Date.now()
      }));
      console.log("[Split-Pop Analytics] Variant conversion tracked:", {
        campaignId,
        variantId,
        sessionId,
        value,
        metadata
      });
    }
    /**
     * Track variant close
     */
    static trackVariantClose(campaignId, variantId, sessionId, closeReason, metadata) {
      this.trackEvent(variantId, sessionId, "close", void 0, __spreadProps(__spreadValues({
        campaignId,
        closeReason
      }, metadata), {
        pageUrl: window.location.href,
        timestamp: Date.now()
      }));
      console.log("[Split-Pop Analytics] Variant close tracked:", {
        campaignId,
        variantId,
        sessionId,
        closeReason,
        metadata
      });
    }
    /**
     * Add event to queue
     */
    static trackEvent(variantId, sessionId, eventType, value, metadata) {
      const event = {
        variantId,
        sessionId,
        eventType,
        value,
        metadata,
        timestamp: Date.now()
      };
      this.eventQueue.push(event);
      this.persistQueue();
      if (!this.flushTimer) {
        this.startFlushTimer();
      }
      if (this.eventQueue.length >= this.MAX_QUEUE_SIZE) {
        this.flushEvents();
      }
    }
    /**
     * Start periodic flush timer
     */
    static startFlushTimer() {
      this.flushTimer = setInterval(() => {
        this.flushEvents();
      }, this.FLUSH_INTERVAL);
    }
    /**
     * Flush events to server
     */
    static async flushEvents() {
      if (this.eventQueue.length === 0) {
        return;
      }
      const eventsToFlush = [...this.eventQueue];
      this.eventQueue = [];
      try {
        await this.sendEvents(eventsToFlush);
      } catch (error) {
        console.error("[Split-Pop Analytics] Error flushing events:", error);
        this.eventQueue.unshift(...eventsToFlush);
      }
    }
    /**
     * Send events to server
     */
    static async sendEvents(events) {
      if (events.length === 0) {
        return;
      }
      try {
        const config = this.getConfig();
        const baseUrl = config.apiUrl || "/apps/split-pop";
        const eventsByVariant = /* @__PURE__ */ new Map();
        events.forEach((event) => {
          if (!eventsByVariant.has(event.variantId)) {
            eventsByVariant.set(event.variantId, []);
          }
          eventsByVariant.get(event.variantId).push(event);
        });
        const promises = Array.from(eventsByVariant.entries()).map(
          async ([variantId, variantEvents]) => {
            const url = `${baseUrl}/api/ab-testing/track-events`;
            const response = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Shop-Domain": config.shopDomain
              },
              body: JSON.stringify({
                variantId,
                sessionId: variantEvents[0].sessionId,
                events: variantEvents
              })
            });
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
          }
        );
        await Promise.all(promises);
        console.log(
          `[Split-Pop Analytics] Successfully sent ${events.length} events`
        );
      } catch (error) {
        console.error("[Split-Pop Analytics] Error sending events:", error);
        throw error;
      }
    }
    /**
     * Get configuration
     */
    static getConfig() {
      return window.SPLIT_POP_CONFIG || {};
    }
    /**
     * Force flush all queued events
     */
    static async forceFlush() {
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
        this.flushTimer = null;
      }
      await this.flushEvents();
    }
    /**
     * Get current queue size
     */
    static getQueueSize() {
      return this.eventQueue.length;
    }
    /**
     * Clear all events (for testing)
     */
    static clearQueue() {
      this.eventQueue = [];
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
        this.flushTimer = null;
      }
      localStorage.removeItem(this.EVENT_QUEUE_KEY);
    }
    /**
     * Persist queue to localStorage (for page reload scenarios)
     */
    static persistQueue() {
      try {
        if (this.eventQueue.length > 0) {
          localStorage.setItem(
            this.EVENT_QUEUE_KEY,
            JSON.stringify(this.eventQueue)
          );
        }
      } catch (error) {
        console.warn("[Split-Pop Analytics] Error persisting queue:", error);
      }
    }
    /**
     * Restore queue from localStorage
     */
    static restoreQueue() {
      try {
        const stored = localStorage.getItem(this.EVENT_QUEUE_KEY);
        if (stored) {
          this.eventQueue = JSON.parse(stored).filter((event) => {
            return Date.now() - event.timestamp < 24 * 60 * 60 * 1e3;
          });
        }
      } catch (error) {
        console.warn("[Split-Pop Analytics] Error restoring queue:", error);
      }
    }
    /**
     * Initialize analytics service
     */
    static initialize() {
      this.restoreQueue();
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          this.forceFlush();
        }
      });
      window.addEventListener("beforeunload", () => {
        this.forceFlush();
      });
      setInterval(() => {
        if (this.eventQueue.length > 0) {
          this.flushEvents();
        }
      }, 3e4);
      console.log("[Split-Pop Analytics] Initialized");
    }
  };
  AnalyticsService.EVENT_QUEUE_KEY = "split_pop_events_queue";
  AnalyticsService.MAX_QUEUE_SIZE = 100;
  AnalyticsService.FLUSH_INTERVAL = 1e4;
  // 10 seconds
  AnalyticsService.eventQueue = [];
  AnalyticsService.flushTimer = null;

  // extensions/storefront-src/index.ts
  if (typeof window !== "undefined" && typeof window.process === "undefined") {
    window.process = {
      stdout: { write: (msg) => console.log(msg) }
    };
  }
  if (typeof window !== "undefined") {
    const preact = (init_preact_module(), __toCommonJS(preact_module_exports));
    const hooks = (init_hooks_module(), __toCommonJS(hooks_module_exports));
    const compat = (init_compat_module(), __toCommonJS(compat_module_exports));
    window.SplitPopPreact = {
      // Core Preact
      h: preact.h,
      render: preact.render,
      Component: preact.Component,
      Fragment: preact.Fragment,
      options: preact.options,
      // Hooks
      hooks: {
        useState: hooks.useState,
        useEffect: hooks.useEffect,
        useCallback: hooks.useCallback,
        useRef: hooks.useRef,
        useMemo: hooks.useMemo
      },
      // Compat
      compat: {
        createPortal: compat.createPortal,
        h: preact.h,
        render: preact.render,
        Component: preact.Component,
        Fragment: preact.Fragment,
        useState: hooks.useState,
        useEffect: hooks.useEffect,
        useCallback: hooks.useCallback,
        useRef: hooks.useRef,
        useMemo: hooks.useMemo
      }
    };
    console.log(
      "[Split-Pop] \u269B\uFE0F Preact runtime exposed globally for dynamic bundles"
    );
  }
  var SplitPopApp = class {
    constructor() {
      this.config = getConfig();
      this.api = new ApiClient(this.config);
      this.popupManager = null;
      this.initialized = false;
      this.currentlyShowing = false;
    }
    /**
     * Log debug messages
     */
    log(...args) {
      if (this.config.debug) {
        console.log("[Split-Pop]", ...args);
      }
    }
    /**
     * Reset the app state for testing
     */
    reset() {
      this.initialized = false;
      this.currentlyShowing = false;
      this.popupManager = null;
      delete window.SplitPopDebug;
      delete window.__splitPopInitPromise;
      console.log("[Split-Pop] \u{1F504} App state reset");
    }
    /**
     * Initialize the app
     */
    async init() {
      if (window.__splitPopInitPromise) {
        console.log(
          "[Split-Pop] \u26A0\uFE0F Already initialized or initializing globally, skipping"
        );
        return window.__splitPopInitPromise;
      }
      const initPromise = (async () => {
        console.log("[Split-Pop] \u{1F680} Starting initialization...");
        if (this.initialized) {
          console.log("[Split-Pop] \u26A0\uFE0F Already initialized");
          return;
        }
        console.log("[Split-Pop] \u{1F4CB} Config:", this.config);
        console.log("[Split-Pop] \u{1F511} Session ID:", session.getSessionId());
        AnalyticsService.initialize();
        console.log("[Split-Pop] \u23F3 Waiting for DOM...");
        await waitForDOMReady();
        console.log("[Split-Pop] \u2705 DOM ready");
        console.log("[Split-Pop] \u{1F4E1} Fetching active campaigns...");
        try {
          const response = await this.api.fetchActiveCampaigns(
            session.getSessionId()
          );
          console.log("[Split-Pop] \u{1F4E8} Raw API response:", response);
          const { campaigns } = response;
          console.log(
            `[Split-Pop] \u{1F4CA} Campaigns received: ${(campaigns == null ? void 0 : campaigns.length) || 0}`
          );
          console.log("[Split-Pop] \u{1F4CB} Campaign details:", campaigns);
          console.log(
            `[Split-Pop] \u{1F50D} Campaigns is array: ${Array.isArray(campaigns)}`
          );
          console.log(`[Split-Pop] \u{1F50D} Campaigns truthy: ${!!campaigns}`);
          if (!campaigns || campaigns.length === 0) {
            console.log("[Split-Pop] \u2139\uFE0F No active campaigns to display");
            console.log("[Split-Pop] \u{1F6A8} DEBUG: campaigns value:", campaigns);
            console.log(
              "[Split-Pop] \u{1F6A8} DEBUG: response object keys:",
              Object.keys(response || {})
            );
            return;
          }
          this.setupCampaigns(campaigns);
          this.exposeDebugHelpers(campaigns);
          this.initialized = true;
          console.log("[Split-Pop] \u2705 Initialization complete!");
        } catch (error) {
          console.error("[Split-Pop] \u274C Error fetching campaigns:", error);
          throw error;
        }
      })();
      window.__splitPopInitPromise = initPromise;
      return initPromise;
    }
    setupCampaigns(campaigns) {
      console.log("[Split-Pop] \u{1F3AF} Setting up campaigns...");
      const sortedCampaigns = campaigns.sort((a3, b3) => {
        const priorityA = a3.priority || 0;
        const priorityB = b3.priority || 0;
        return priorityB - priorityA;
      });
      const availableCampaigns = sortedCampaigns.filter((campaign) => {
        const isPreviewMode2 = this.config.previewMode && this.config.previewId === campaign.id;
        if (isPreviewMode2) {
          return true;
        }
        if (session.wasShown(campaign.id)) {
          console.log(
            `[Split-Pop] \u23ED\uFE0F Campaign already shown this session: ${campaign.id}`
          );
          return false;
        }
        return true;
      });
      if (availableCampaigns.length === 0) {
        console.log("[Split-Pop] \u2139\uFE0F No campaigns to display");
        return;
      }
      const highestPriorityCampaign = availableCampaigns[0];
      console.log("[Split-Pop] \u{1F4CC} Setting up campaign:", {
        id: highestPriorityCampaign.id,
        name: highestPriorityCampaign.name,
        priority: highestPriorityCampaign.priority || 0,
        goal: highestPriorityCampaign.goal
      });
      let campaignToShow = highestPriorityCampaign;
      if (highestPriorityCampaign.variantAssignment) {
        console.log(
          "[Split-Pop] \u{1F9EA} Server assigned A/B testing variant:",
          highestPriorityCampaign.variantAssignment.variantKey,
          "for campaign:",
          highestPriorityCampaign.id
        );
      }
      const isPreviewMode = this.config.previewMode && this.config.previewId === highestPriorityCampaign.id;
      if (isPreviewMode) {
        console.log(`[Split-Pop] \u{1F50D} Preview mode - showing immediately`);
        setTimeout(() => this.showCampaign(campaignToShow), 0);
        return;
      }
      console.log(
        `[Split-Pop] \u26A1 Campaign ready for display: ${campaignToShow.id}`
      );
      this.showCampaign(campaignToShow);
      console.log("[Split-Pop] \u2705 Campaign setup complete");
    }
    /**
     * Show a campaign popup
     */
    async showCampaign(campaign) {
      console.log(
        `[Split-Pop] \u{1F3A8} Showing campaign: ${campaign.id} ${campaign.name}`
      );
      const isPreviewMode = this.config.previewMode && this.config.previewId === campaign.id;
      if (!isPreviewMode && this.currentlyShowing) {
        console.log(
          `[Split-Pop] \u{1F6AB} Popup already showing, skipping: ${campaign.id}`
        );
        return;
      }
      this.currentlyShowing = true;
      if (!isPreviewMode) {
        session.markShown(campaign.id);
        console.log("[Split-Pop] \u2705 Campaign marked as shown in session");
      } else {
        console.log("[Split-Pop] \u{1F50D} Preview mode - skipping session tracking");
      }
      if (!isPreviewMode) {
        console.log("[Split-Pop] \u{1F4CA} Recording frequency...");
        await this.api.recordFrequency(session.getSessionId(), campaign.id);
      } else {
        console.log("[Split-Pop] \u{1F50D} Preview mode - skipping frequency recording");
      }
      if (campaign.variantAssignment && !isPreviewMode) {
        AnalyticsService.trackVariantView(
          campaign.id,
          campaign.variantAssignment.variantId,
          session.getSessionId(),
          {
            variantKey: campaign.variantAssignment.variantKey,
            isControl: campaign.variantAssignment.isControl
          }
        );
      }
      console.log("[Split-Pop] \u{1F3AD} Rendering popup...");
      console.log("[Split-Pop] \u{1F50D} PopupManagerCore exists:", !!this.popupManager);
      try {
        const campaignToShow = isPreviewMode ? __spreadProps(__spreadValues({}, campaign), { __preview: true }) : campaign;
        console.log("[Split-Pop] \u{1F50D} Campaign to show:", campaignToShow);
        if (!this.popupManager) {
          console.log("[Split-Pop] \u{1F3D7}\uFE0F Creating new PopupManagerCore instance...");
          try {
            this.popupManager = new PopupManagerCore({
              campaigns: [campaignToShow],
              callbacks: {
                onPopupShow: (campaignId) => {
                  console.log(`[Split-Pop] \u{1F389} Popup shown: ${campaignId}`);
                },
                onPopupClose: (campaignId) => {
                  console.log(`[Split-Pop] \u{1F44B} Popup closed: ${campaignId}`);
                }
              },
              debug: this.config.debug
            });
            console.log("[Split-Pop] \u2705 PopupManagerCore instance created");
          } catch (error) {
            console.error(
              "[Split-Pop] \u274C Failed to create PopupManagerCore:",
              error
            );
            throw error;
          }
        }
        console.log("[Split-Pop] \u{1F680} Calling renderPopup...");
        await this.popupManager.renderPopup(campaignToShow, () => {
          var _a;
          console.log("[Split-Pop] \u{1F44B} Popup closed by user");
          if (campaign.variantAssignment && !isPreviewMode) {
            AnalyticsService.trackVariantClose(
              campaign.id,
              campaign.variantAssignment.variantId,
              session.getSessionId(),
              "user_close"
            );
          }
          this.currentlyShowing = false;
          (_a = this.popupManager) == null ? void 0 : _a.closeRenderedPopup();
        });
        console.log("[Split-Pop] \u2705 Popup rendered successfully");
      } catch (error) {
        console.error("[Split-Pop] \u274C Error rendering popup:", error);
        this.currentlyShowing = false;
      }
    }
    /**
     * Expose debug helpers to window
     */
    exposeDebugHelpers(campaigns) {
      window.SplitPopDebug = {
        getSession: () => session.getData(),
        clearSession: () => {
          session.clear();
          this.log("Session cleared");
        },
        showCampaign: (campaignId) => {
          const campaign = campaigns.find((c3) => c3.id === campaignId);
          if (campaign) {
            this.showCampaign(campaign);
          } else {
            this.log("Campaign not found:", campaignId);
          }
        },
        // A/B Testing is handled server-side - no client-side debug helpers needed
        getAnalyticsQueue: () => ({
          queueSize: AnalyticsService.getQueueSize()
        }),
        flushAnalytics: () => {
          AnalyticsService.forceFlush();
          this.log("Analytics events flushed");
        },
        clearAnalytics: () => {
          AnalyticsService.clearQueue();
          this.log("Analytics queue cleared");
        }
      };
      if (this.config.debug) {
        this.log("Debug helpers exposed to window.SplitPopDebug");
        this.log("Available commands:");
        this.log("  - SplitPopDebug.getSession()");
        this.log("  - SplitPopDebug.clearSession()");
        this.log("  - SplitPopDebug.showCampaign(campaignId)");
        this.log("  - SplitPopDebug.getVariantAssignments()");
        this.log("  - SplitPopDebug.clearVariantAssignments()");
        this.log("  - SplitPopDebug.getAnalyticsQueue()");
        this.log("  - SplitPopDebug.flushAnalytics()");
        this.log("  - SplitPopDebug.clearAnalytics()");
      }
    }
  };
  var BUNDLE_VERSION = "2.0.4-fix-popupmanager-import";
  if (!window.__splitPopApp) {
    console.log(
      `[Split-Pop] \u{1F4E6} Creating new app instance (Bundle v${BUNDLE_VERSION})`
    );
    const app2 = new SplitPopApp();
    window.__splitPopApp = app2;
    console.log("[Split-Pop] \u{1F50D} Environment check:", {
      processExists: typeof process !== "undefined",
      nodeEnv: typeof process !== "undefined" ? "production" : "undefined",
      willInitialize: true
    });
    app2.init().catch((error) => {
      console.error("[Split-Pop] Initialization failed:", error);
    });
  } else {
    console.log("[Split-Pop] \u26A0\uFE0F App instance already exists, skipping creation");
  }
  var app = window.__splitPopApp;
})();
//# sourceMappingURL=popup-loader.bundle.js.map
