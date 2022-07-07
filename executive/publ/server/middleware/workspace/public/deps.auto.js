if (typeof JSON.decycle !== "function") {
    JSON.decycle = function decycle(object, replacer) {
        "use strict";
        var objects = new WeakMap();
        return function derez(value, path) {
            var old_path;
            var nu;
            if (replacer !== undefined) {
                value = replacer(value);
            }
            if (typeof value === "object" && value !== null && !(value instanceof Boolean) && !(value instanceof Date) && !(value instanceof Number) && !(value instanceof RegExp) && !(value instanceof String)) {
                old_path = objects.get(value);
                if (old_path !== undefined) {
                    return {
                        $ref: old_path
                    };
                }
                objects.set(value, path);
                if (Array.isArray(value)) {
                    nu = [];
                    value.forEach(function(element, i) {
                        nu[i] = derez(element, path + "[" + i + "]");
                    });
                } else {
                    nu = {};
                    Object.keys(value).forEach(function(name) {
                        nu[name] = derez(value[name], path + "[" + JSON.stringify(name) + "]");
                    });
                }
                return nu;
            }
            return value;
        }(object, "$");
    };
}
if (typeof JSON.retrocycle !== "function") {
    JSON.retrocycle = function retrocycle($) {
        "use strict";
        var px = /^\$(?:\[(?:\d+|"(?:[^\\"\u0000-\u001f]|\\(?:[\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*")\])*$/;
        (function rez(value) {
            if (value && typeof value === "object") {
                if (Array.isArray(value)) {
                    value.forEach(function(element, i) {
                        if (typeof element === "object" && element !== null) {
                            var path = element.$ref;
                            if (typeof path === "string" && px.test(path)) {
                                value[i] = eval(path);
                            } else {
                                rez(element);
                            }
                        }
                    });
                } else {
                    Object.keys(value).forEach(function(name) {
                        var item = value[name];
                        if (typeof item === "object" && item !== null) {
                            var path = item.$ref;
                            if (typeof path === "string" && px.test(path)) {
                                value[name] = eval(path);
                            } else {
                                rez(item);
                            }
                        }
                    });
                }
            }
        })($);
        return $;
    };
}
!function(e, t) {
    "object" == typeof exports && "undefined" != typeof module ? t(exports) : "function" == typeof define && define.amd ? define([
        "exports"
    ], t) : t((e = "undefined" != typeof globalThis ? globalThis : e || self).Popper = {});
}(this, function(e) {
    "use strict";
    function t(e) {
        if (null == e) return window;
        if ("[object Window]" !== e.toString()) {
            var t = e.ownerDocument;
            return t && t.defaultView || window;
        }
        return e;
    }
    function n(e) {
        return e instanceof t(e).Element || e instanceof Element;
    }
    function r(e) {
        return e instanceof t(e).HTMLElement || e instanceof HTMLElement;
    }
    function o(e) {
        return "undefined" != typeof ShadowRoot && (e instanceof t(e).ShadowRoot || e instanceof ShadowRoot);
    }
    var i = Math.max, a = Math.min, s = Math.round;
    function f(e, t) {
        void 0 === t && (t = !1);
        var n = e.getBoundingClientRect(), o = 1, i = 1;
        if (r(e) && t) {
            var a = e.offsetHeight, f = e.offsetWidth;
            f > 0 && (o = s(n.width) / f || 1), a > 0 && (i = s(n.height) / a || 1);
        }
        return {
            width: n.width / o,
            height: n.height / i,
            top: n.top / i,
            right: n.right / o,
            bottom: n.bottom / i,
            left: n.left / o,
            x: n.left / o,
            y: n.top / i
        };
    }
    function c(e) {
        var n = t(e);
        return {
            scrollLeft: n.pageXOffset,
            scrollTop: n.pageYOffset
        };
    }
    function p(e) {
        return e ? (e.nodeName || "").toLowerCase() : null;
    }
    function u(e) {
        return ((n(e) ? e.ownerDocument : e.document) || window.document).documentElement;
    }
    function l(e) {
        return f(u(e)).left + c(e).scrollLeft;
    }
    function d(e) {
        return t(e).getComputedStyle(e);
    }
    function h(e) {
        var t = d(e), n = t.overflow, r = t.overflowX, o = t.overflowY;
        return /auto|scroll|overlay|hidden/.test(n + o + r);
    }
    function m(e, n, o) {
        void 0 === o && (o = !1);
        var i, a, d = r(n), m = r(n) && function(e) {
            var t = e.getBoundingClientRect(), n = s(t.width) / e.offsetWidth || 1, r = s(t.height) / e.offsetHeight || 1;
            return 1 !== n || 1 !== r;
        }(n), v = u(n), g = f(e, m), y = {
            scrollLeft: 0,
            scrollTop: 0
        }, b = {
            x: 0,
            y: 0
        };
        return (d || !d && !o) && (("body" !== p(n) || h(v)) && (y = (i = n) !== t(i) && r(i) ? {
            scrollLeft: (a = i).scrollLeft,
            scrollTop: a.scrollTop
        } : c(i)), r(n) ? ((b = f(n, !0)).x += n.clientLeft, b.y += n.clientTop) : v && (b.x = l(v))), {
            x: g.left + y.scrollLeft - b.x,
            y: g.top + y.scrollTop - b.y,
            width: g.width,
            height: g.height
        };
    }
    function v(e) {
        var t = f(e), n = e.offsetWidth, r = e.offsetHeight;
        return Math.abs(t.width - n) <= 1 && (n = t.width), Math.abs(t.height - r) <= 1 && (r = t.height), {
            x: e.offsetLeft,
            y: e.offsetTop,
            width: n,
            height: r
        };
    }
    function g(e) {
        return "html" === p(e) ? e : e.assignedSlot || e.parentNode || (o(e) ? e.host : null) || u(e);
    }
    function y(e) {
        return [
            "html",
            "body",
            "#document"
        ].indexOf(p(e)) >= 0 ? e.ownerDocument.body : r(e) && h(e) ? e : y(g(e));
    }
    function b(e, n) {
        var r;
        void 0 === n && (n = []);
        var o = y(e), i = o === (null == (r = e.ownerDocument) ? void 0 : r.body), a = t(o), s = i ? [
            a
        ].concat(a.visualViewport || [], h(o) ? o : []) : o, f = n.concat(s);
        return i ? f : f.concat(b(g(s)));
    }
    function x(e) {
        return [
            "table",
            "td",
            "th"
        ].indexOf(p(e)) >= 0;
    }
    function w(e) {
        return r(e) && "fixed" !== d(e).position ? e.offsetParent : null;
    }
    function O(e) {
        for(var n = t(e), i = w(e); i && x(i) && "static" === d(i).position;)i = w(i);
        return i && ("html" === p(i) || "body" === p(i) && "static" === d(i).position) ? n : i || function(e) {
            var t = -1 !== navigator.userAgent.toLowerCase().indexOf("firefox");
            if (-1 !== navigator.userAgent.indexOf("Trident") && r(e) && "fixed" === d(e).position) return null;
            var n = g(e);
            for(o(n) && (n = n.host); r(n) && [
                "html",
                "body"
            ].indexOf(p(n)) < 0;){
                var i = d(n);
                if ("none" !== i.transform || "none" !== i.perspective || "paint" === i.contain || -1 !== [
                    "transform",
                    "perspective"
                ].indexOf(i.willChange) || t && "filter" === i.willChange || t && i.filter && "none" !== i.filter) return n;
                n = n.parentNode;
            }
            return null;
        }(e) || n;
    }
    var j = "top", E = "bottom", D = "right", A = "left", L = "auto", P = [
        j,
        E,
        D,
        A
    ], M = "start", k = "end", W = "viewport", B = "popper", H = P.reduce(function(e, t) {
        return e.concat([
            t + "-" + M,
            t + "-" + k
        ]);
    }, []), T = [].concat(P, [
        L
    ]).reduce(function(e, t) {
        return e.concat([
            t,
            t + "-" + M,
            t + "-" + k
        ]);
    }, []), R = [
        "beforeRead",
        "read",
        "afterRead",
        "beforeMain",
        "main",
        "afterMain",
        "beforeWrite",
        "write",
        "afterWrite"
    ];
    function S(e) {
        var t = new Map, n = new Set, r = [];
        function o(e) {
            n.add(e.name), [].concat(e.requires || [], e.requiresIfExists || []).forEach(function(e) {
                if (!n.has(e)) {
                    var r = t.get(e);
                    r && o(r);
                }
            }), r.push(e);
        }
        return e.forEach(function(e) {
            t.set(e.name, e);
        }), e.forEach(function(e) {
            n.has(e.name) || o(e);
        }), r;
    }
    function C(e) {
        return e.split("-")[0];
    }
    function q(e, t) {
        var n = t.getRootNode && t.getRootNode();
        if (e.contains(t)) return !0;
        if (n && o(n)) {
            var r = t;
            do {
                if (r && e.isSameNode(r)) return !0;
                r = r.parentNode || r.host;
            }while (r)
        }
        return !1;
    }
    function V(e) {
        return Object.assign({}, e, {
            left: e.x,
            top: e.y,
            right: e.x + e.width,
            bottom: e.y + e.height
        });
    }
    function N(e, r) {
        return r === W ? V(function(e) {
            var n = t(e), r = u(e), o = n.visualViewport, i = r.clientWidth, a = r.clientHeight, s = 0, f = 0;
            return o && (i = o.width, a = o.height, /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || (s = o.offsetLeft, f = o.offsetTop)), {
                width: i,
                height: a,
                x: s + l(e),
                y: f
            };
        }(e)) : n(r) ? function(e) {
            var t = f(e);
            return t.top = t.top + e.clientTop, t.left = t.left + e.clientLeft, t.bottom = t.top + e.clientHeight, t.right = t.left + e.clientWidth, t.width = e.clientWidth, t.height = e.clientHeight, t.x = t.left, t.y = t.top, t;
        }(r) : V(function(e) {
            var t, n = u(e), r = c(e), o = null == (t = e.ownerDocument) ? void 0 : t.body, a = i(n.scrollWidth, n.clientWidth, o ? o.scrollWidth : 0, o ? o.clientWidth : 0), s = i(n.scrollHeight, n.clientHeight, o ? o.scrollHeight : 0, o ? o.clientHeight : 0), f = -r.scrollLeft + l(e), p = -r.scrollTop;
            return "rtl" === d(o || n).direction && (f += i(n.clientWidth, o ? o.clientWidth : 0) - a), {
                width: a,
                height: s,
                x: f,
                y: p
            };
        }(u(e)));
    }
    function I(e, t, o) {
        var s = "clippingParents" === t ? function(e) {
            var t = b(g(e)), o = [
                "absolute",
                "fixed"
            ].indexOf(d(e).position) >= 0 && r(e) ? O(e) : e;
            return n(o) ? t.filter(function(e) {
                return n(e) && q(e, o) && "body" !== p(e);
            }) : [];
        }(e) : [].concat(t), f = [].concat(s, [
            o
        ]), c = f[0], u = f.reduce(function(t, n) {
            var r = N(e, n);
            return t.top = i(r.top, t.top), t.right = a(r.right, t.right), t.bottom = a(r.bottom, t.bottom), t.left = i(r.left, t.left), t;
        }, N(e, c));
        return u.width = u.right - u.left, u.height = u.bottom - u.top, u.x = u.left, u.y = u.top, u;
    }
    function _(e) {
        return e.split("-")[1];
    }
    function F(e) {
        return [
            "top",
            "bottom"
        ].indexOf(e) >= 0 ? "x" : "y";
    }
    function U(e) {
        var t, n = e.reference, r = e.element, o = e.placement, i = o ? C(o) : null, a = o ? _(o) : null, s = n.x + n.width / 2 - r.width / 2, f = n.y + n.height / 2 - r.height / 2;
        switch(i){
            case j:
                t = {
                    x: s,
                    y: n.y - r.height
                };
                break;
            case E:
                t = {
                    x: s,
                    y: n.y + n.height
                };
                break;
            case D:
                t = {
                    x: n.x + n.width,
                    y: f
                };
                break;
            case A:
                t = {
                    x: n.x - r.width,
                    y: f
                };
                break;
            default:
                t = {
                    x: n.x,
                    y: n.y
                };
        }
        var c = i ? F(i) : null;
        if (null != c) {
            var p = "y" === c ? "height" : "width";
            switch(a){
                case M:
                    t[c] = t[c] - (n[p] / 2 - r[p] / 2);
                    break;
                case k:
                    t[c] = t[c] + (n[p] / 2 - r[p] / 2);
            }
        }
        return t;
    }
    function z(e) {
        return Object.assign({}, {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }, e);
    }
    function X(e, t) {
        return t.reduce(function(t, n) {
            return t[n] = e, t;
        }, {});
    }
    function Y(e, t) {
        void 0 === t && (t = {});
        var r = t, o = r.placement, i = void 0 === o ? e.placement : o, a = r.boundary, s = void 0 === a ? "clippingParents" : a, c = r.rootBoundary, p = void 0 === c ? W : c, l = r.elementContext, d = void 0 === l ? B : l, h = r.altBoundary, m = void 0 !== h && h, v = r.padding, g = void 0 === v ? 0 : v, y = z("number" != typeof g ? g : X(g, P)), b = d === B ? "reference" : B, x = e.rects.popper, w = e.elements[m ? b : d], O = I(n(w) ? w : w.contextElement || u(e.elements.popper), s, p), A = f(e.elements.reference), L = U({
            reference: A,
            element: x,
            strategy: "absolute",
            placement: i
        }), M = V(Object.assign({}, x, L)), k = d === B ? M : A, H = {
            top: O.top - k.top + y.top,
            bottom: k.bottom - O.bottom + y.bottom,
            left: O.left - k.left + y.left,
            right: k.right - O.right + y.right
        }, T = e.modifiersData.offset;
        if (d === B && T) {
            var R = T[i];
            Object.keys(H).forEach(function(e) {
                var t = [
                    D,
                    E
                ].indexOf(e) >= 0 ? 1 : -1, n = [
                    j,
                    E
                ].indexOf(e) >= 0 ? "y" : "x";
                H[e] += R[n] * t;
            });
        }
        return H;
    }
    var G = {
        placement: "bottom",
        modifiers: [],
        strategy: "absolute"
    };
    function J() {
        for(var e = arguments.length, t = new Array(e), n = 0; n < e; n++)t[n] = arguments[n];
        return !t.some(function(e) {
            return !(e && "function" == typeof e.getBoundingClientRect);
        });
    }
    function K(e) {
        void 0 === e && (e = {});
        var t = e, r = t.defaultModifiers, o = void 0 === r ? [] : r, i = t.defaultOptions, a = void 0 === i ? G : i;
        return function(e, t, r) {
            void 0 === r && (r = a);
            var i, s, f = {
                placement: "bottom",
                orderedModifiers: [],
                options: Object.assign({}, G, a),
                modifiersData: {},
                elements: {
                    reference: e,
                    popper: t
                },
                attributes: {},
                styles: {}
            }, c = [], p = !1, u = {
                state: f,
                setOptions: function(r) {
                    var i = "function" == typeof r ? r(f.options) : r;
                    l(), f.options = Object.assign({}, a, f.options, i), f.scrollParents = {
                        reference: n(e) ? b(e) : e.contextElement ? b(e.contextElement) : [],
                        popper: b(t)
                    };
                    var s, p, d = function(e) {
                        var t = S(e);
                        return R.reduce(function(e, n) {
                            return e.concat(t.filter(function(e) {
                                return e.phase === n;
                            }));
                        }, []);
                    }((s = [].concat(o, f.options.modifiers), p = s.reduce(function(e, t) {
                        var n = e[t.name];
                        return e[t.name] = n ? Object.assign({}, n, t, {
                            options: Object.assign({}, n.options, t.options),
                            data: Object.assign({}, n.data, t.data)
                        }) : t, e;
                    }, {}), Object.keys(p).map(function(e) {
                        return p[e];
                    })));
                    return f.orderedModifiers = d.filter(function(e) {
                        return e.enabled;
                    }), f.orderedModifiers.forEach(function(e) {
                        var t = e.name, n = e.options, r = void 0 === n ? {} : n, o = e.effect;
                        if ("function" == typeof o) {
                            var i = o({
                                state: f,
                                name: t,
                                instance: u,
                                options: r
                            }), a = function() {};
                            c.push(i || a);
                        }
                    }), u.update();
                },
                forceUpdate: function() {
                    if (!p) {
                        var e = f.elements, t = e.reference, n = e.popper;
                        if (J(t, n)) {
                            f.rects = {
                                reference: m(t, O(n), "fixed" === f.options.strategy),
                                popper: v(n)
                            }, f.reset = !1, f.placement = f.options.placement, f.orderedModifiers.forEach(function(e) {
                                return f.modifiersData[e.name] = Object.assign({}, e.data);
                            });
                            for(var r = 0; r < f.orderedModifiers.length; r++)if (!0 !== f.reset) {
                                var o = f.orderedModifiers[r], i = o.fn, a = o.options, s = void 0 === a ? {} : a, c = o.name;
                                "function" == typeof i && (f = i({
                                    state: f,
                                    options: s,
                                    name: c,
                                    instance: u
                                }) || f);
                            } else f.reset = !1, r = -1;
                        }
                    }
                },
                update: (i = function() {
                    return new Promise(function(e) {
                        u.forceUpdate(), e(f);
                    });
                }, function() {
                    return s || (s = new Promise(function(e) {
                        Promise.resolve().then(function() {
                            s = void 0, e(i());
                        });
                    })), s;
                }),
                destroy: function() {
                    l(), p = !0;
                }
            };
            if (!J(e, t)) return u;
            function l() {
                c.forEach(function(e) {
                    return e();
                }), c = [];
            }
            return u.setOptions(r).then(function(e) {
                !p && r.onFirstUpdate && r.onFirstUpdate(e);
            }), u;
        };
    }
    var Q = {
        passive: !0
    };
    var Z = {
        name: "eventListeners",
        enabled: !0,
        phase: "write",
        fn: function() {},
        effect: function(e) {
            var n = e.state, r = e.instance, o = e.options, i = o.scroll, a = void 0 === i || i, s = o.resize, f = void 0 === s || s, c = t(n.elements.popper), p = [].concat(n.scrollParents.reference, n.scrollParents.popper);
            return a && p.forEach(function(e) {
                e.addEventListener("scroll", r.update, Q);
            }), f && c.addEventListener("resize", r.update, Q), function() {
                a && p.forEach(function(e) {
                    e.removeEventListener("scroll", r.update, Q);
                }), f && c.removeEventListener("resize", r.update, Q);
            };
        },
        data: {}
    };
    var $ = {
        name: "popperOffsets",
        enabled: !0,
        phase: "read",
        fn: function(e) {
            var t = e.state, n = e.name;
            t.modifiersData[n] = U({
                reference: t.rects.reference,
                element: t.rects.popper,
                strategy: "absolute",
                placement: t.placement
            });
        },
        data: {}
    }, ee = {
        top: "auto",
        right: "auto",
        bottom: "auto",
        left: "auto"
    };
    function te(e) {
        var n, r = e.popper, o = e.popperRect, i = e.placement, a = e.variation, f = e.offsets, c = e.position, p = e.gpuAcceleration, l = e.adaptive, h = e.roundOffsets, m = e.isFixed, v = f.x, g = void 0 === v ? 0 : v, y = f.y, b = void 0 === y ? 0 : y, x = "function" == typeof h ? h({
            x: g,
            y: b
        }) : {
            x: g,
            y: b
        };
        g = x.x, b = x.y;
        var w = f.hasOwnProperty("x"), L = f.hasOwnProperty("y"), P = A, M = j, W = window;
        if (l) {
            var B = O(r), H = "clientHeight", T = "clientWidth";
            if (B === t(r) && "static" !== d(B = u(r)).position && "absolute" === c && (H = "scrollHeight", T = "scrollWidth"), B = B, i === j || (i === A || i === D) && a === k) M = E, b -= (m && B === W && W.visualViewport ? W.visualViewport.height : B[H]) - o.height, b *= p ? 1 : -1;
            if (i === A || (i === j || i === E) && a === k) P = D, g -= (m && B === W && W.visualViewport ? W.visualViewport.width : B[T]) - o.width, g *= p ? 1 : -1;
        }
        var R, S = Object.assign({
            position: c
        }, l && ee), C = !0 === h ? function(e) {
            var t = e.x, n = e.y, r = window.devicePixelRatio || 1;
            return {
                x: s(t * r) / r || 0,
                y: s(n * r) / r || 0
            };
        }({
            x: g,
            y: b
        }) : {
            x: g,
            y: b
        };
        return g = C.x, b = C.y, p ? Object.assign({}, S, ((R = {})[M] = L ? "0" : "", R[P] = w ? "0" : "", R.transform = (W.devicePixelRatio || 1) <= 1 ? "translate(" + g + "px, " + b + "px)" : "translate3d(" + g + "px, " + b + "px, 0)", R)) : Object.assign({}, S, ((n = {})[M] = L ? b + "px" : "", n[P] = w ? g + "px" : "", n.transform = "", n));
    }
    var ne = {
        name: "computeStyles",
        enabled: !0,
        phase: "beforeWrite",
        fn: function(e) {
            var t = e.state, n = e.options, r = n.gpuAcceleration, o = void 0 === r || r, i = n.adaptive, a = void 0 === i || i, s = n.roundOffsets, f = void 0 === s || s, c = {
                placement: C(t.placement),
                variation: _(t.placement),
                popper: t.elements.popper,
                popperRect: t.rects.popper,
                gpuAcceleration: o,
                isFixed: "fixed" === t.options.strategy
            };
            null != t.modifiersData.popperOffsets && (t.styles.popper = Object.assign({}, t.styles.popper, te(Object.assign({}, c, {
                offsets: t.modifiersData.popperOffsets,
                position: t.options.strategy,
                adaptive: a,
                roundOffsets: f
            })))), null != t.modifiersData.arrow && (t.styles.arrow = Object.assign({}, t.styles.arrow, te(Object.assign({}, c, {
                offsets: t.modifiersData.arrow,
                position: "absolute",
                adaptive: !1,
                roundOffsets: f
            })))), t.attributes.popper = Object.assign({}, t.attributes.popper, {
                "data-popper-placement": t.placement
            });
        },
        data: {}
    };
    var re = {
        name: "applyStyles",
        enabled: !0,
        phase: "write",
        fn: function(e) {
            var t = e.state;
            Object.keys(t.elements).forEach(function(e) {
                var n = t.styles[e] || {}, o = t.attributes[e] || {}, i = t.elements[e];
                r(i) && p(i) && (Object.assign(i.style, n), Object.keys(o).forEach(function(e) {
                    var t = o[e];
                    !1 === t ? i.removeAttribute(e) : i.setAttribute(e, !0 === t ? "" : t);
                }));
            });
        },
        effect: function(e) {
            var t = e.state, n = {
                popper: {
                    position: t.options.strategy,
                    left: "0",
                    top: "0",
                    margin: "0"
                },
                arrow: {
                    position: "absolute"
                },
                reference: {}
            };
            return Object.assign(t.elements.popper.style, n.popper), t.styles = n, t.elements.arrow && Object.assign(t.elements.arrow.style, n.arrow), function() {
                Object.keys(t.elements).forEach(function(e) {
                    var o = t.elements[e], i = t.attributes[e] || {}, a = Object.keys(t.styles.hasOwnProperty(e) ? t.styles[e] : n[e]).reduce(function(e, t) {
                        return e[t] = "", e;
                    }, {});
                    r(o) && p(o) && (Object.assign(o.style, a), Object.keys(i).forEach(function(e) {
                        o.removeAttribute(e);
                    }));
                });
            };
        },
        requires: [
            "computeStyles"
        ]
    };
    var oe = {
        name: "offset",
        enabled: !0,
        phase: "main",
        requires: [
            "popperOffsets"
        ],
        fn: function(e) {
            var t = e.state, n = e.options, r = e.name, o = n.offset, i = void 0 === o ? [
                0,
                0
            ] : o, a = T.reduce(function(e, n) {
                return e[n] = function(e, t, n) {
                    var r = C(e), o = [
                        A,
                        j
                    ].indexOf(r) >= 0 ? -1 : 1, i = "function" == typeof n ? n(Object.assign({}, t, {
                        placement: e
                    })) : n, a = i[0], s = i[1];
                    return a = a || 0, s = (s || 0) * o, [
                        A,
                        D
                    ].indexOf(r) >= 0 ? {
                        x: s,
                        y: a
                    } : {
                        x: a,
                        y: s
                    };
                }(n, t.rects, i), e;
            }, {}), s = a[t.placement], f = s.x, c = s.y;
            null != t.modifiersData.popperOffsets && (t.modifiersData.popperOffsets.x += f, t.modifiersData.popperOffsets.y += c), t.modifiersData[r] = a;
        }
    }, ie = {
        left: "right",
        right: "left",
        bottom: "top",
        top: "bottom"
    };
    function ae(e) {
        return e.replace(/left|right|bottom|top/g, function(e) {
            return ie[e];
        });
    }
    var se = {
        start: "end",
        end: "start"
    };
    function fe(e) {
        return e.replace(/start|end/g, function(e) {
            return se[e];
        });
    }
    function ce(e, t) {
        void 0 === t && (t = {});
        var n = t, r = n.placement, o = n.boundary, i = n.rootBoundary, a = n.padding, s = n.flipVariations, f = n.allowedAutoPlacements, c = void 0 === f ? T : f, p = _(r), u = p ? s ? H : H.filter(function(e) {
            return _(e) === p;
        }) : P, l = u.filter(function(e) {
            return c.indexOf(e) >= 0;
        });
        0 === l.length && (l = u);
        var d = l.reduce(function(t, n) {
            return t[n] = Y(e, {
                placement: n,
                boundary: o,
                rootBoundary: i,
                padding: a
            })[C(n)], t;
        }, {});
        return Object.keys(d).sort(function(e, t) {
            return d[e] - d[t];
        });
    }
    var pe = {
        name: "flip",
        enabled: !0,
        phase: "main",
        fn: function(e) {
            var t = e.state, n = e.options, r = e.name;
            if (!t.modifiersData[r]._skip) {
                for(var o = n.mainAxis, i = void 0 === o || o, a = n.altAxis, s = void 0 === a || a, f = n.fallbackPlacements, c = n.padding, p = n.boundary, u = n.rootBoundary, l = n.altBoundary, d = n.flipVariations, h = void 0 === d || d, m = n.allowedAutoPlacements, v = t.options.placement, g = C(v), y = f || (g === v || !h ? [
                    ae(v)
                ] : function(e) {
                    if (C(e) === L) return [];
                    var t = ae(e);
                    return [
                        fe(e),
                        t,
                        fe(t)
                    ];
                }(v)), b = [
                    v
                ].concat(y).reduce(function(e, n) {
                    return e.concat(C(n) === L ? ce(t, {
                        placement: n,
                        boundary: p,
                        rootBoundary: u,
                        padding: c,
                        flipVariations: h,
                        allowedAutoPlacements: m
                    }) : n);
                }, []), x = t.rects.reference, w = t.rects.popper, O = new Map, P = !0, k = b[0], W = 0; W < b.length; W++){
                    var B = b[W], H = C(B), T = _(B) === M, R = [
                        j,
                        E
                    ].indexOf(H) >= 0, S = R ? "width" : "height", q = Y(t, {
                        placement: B,
                        boundary: p,
                        rootBoundary: u,
                        altBoundary: l,
                        padding: c
                    }), V = R ? T ? D : A : T ? E : j;
                    x[S] > w[S] && (V = ae(V));
                    var N = ae(V), I = [];
                    if (i && I.push(q[H] <= 0), s && I.push(q[V] <= 0, q[N] <= 0), I.every(function(e) {
                        return e;
                    })) {
                        k = B, P = !1;
                        break;
                    }
                    O.set(B, I);
                }
                if (P) for(var F = function(e) {
                    var t = b.find(function(t) {
                        var n = O.get(t);
                        if (n) return n.slice(0, e).every(function(e) {
                            return e;
                        });
                    });
                    if (t) return k = t, "break";
                }, U = h ? 3 : 1; U > 0; U--){
                    if ("break" === F(U)) break;
                }
                t.placement !== k && (t.modifiersData[r]._skip = !0, t.placement = k, t.reset = !0);
            }
        },
        requiresIfExists: [
            "offset"
        ],
        data: {
            _skip: !1
        }
    };
    function ue(e, t, n) {
        return i(e, a(t, n));
    }
    var le = {
        name: "preventOverflow",
        enabled: !0,
        phase: "main",
        fn: function(e) {
            var t = e.state, n = e.options, r = e.name, o = n.mainAxis, s = void 0 === o || o, f = n.altAxis, c = void 0 !== f && f, p = n.boundary, u = n.rootBoundary, l = n.altBoundary, d = n.padding, h = n.tether, m = void 0 === h || h, g = n.tetherOffset, y = void 0 === g ? 0 : g, b = Y(t, {
                boundary: p,
                rootBoundary: u,
                padding: d,
                altBoundary: l
            }), x = C(t.placement), w = _(t.placement), L = !w, P = F(x), k = "x" === P ? "y" : "x", W = t.modifiersData.popperOffsets, B = t.rects.reference, H = t.rects.popper, T = "function" == typeof y ? y(Object.assign({}, t.rects, {
                placement: t.placement
            })) : y, R = "number" == typeof T ? {
                mainAxis: T,
                altAxis: T
            } : Object.assign({
                mainAxis: 0,
                altAxis: 0
            }, T), S = t.modifiersData.offset ? t.modifiersData.offset[t.placement] : null, q = {
                x: 0,
                y: 0
            };
            if (W) {
                if (s) {
                    var V, N = "y" === P ? j : A, I = "y" === P ? E : D, U = "y" === P ? "height" : "width", z = W[P], X = z + b[N], G = z - b[I], J = m ? -H[U] / 2 : 0, K = w === M ? B[U] : H[U], Q = w === M ? -H[U] : -B[U], Z = t.elements.arrow, $ = m && Z ? v(Z) : {
                        width: 0,
                        height: 0
                    }, ee = t.modifiersData["arrow#persistent"] ? t.modifiersData["arrow#persistent"].padding : {
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0
                    }, te = ee[N], ne = ee[I], re = ue(0, B[U], $[U]), oe = L ? B[U] / 2 - J - re - te - R.mainAxis : K - re - te - R.mainAxis, ie = L ? -B[U] / 2 + J + re + ne + R.mainAxis : Q + re + ne + R.mainAxis, ae = t.elements.arrow && O(t.elements.arrow), se = ae ? "y" === P ? ae.clientTop || 0 : ae.clientLeft || 0 : 0, fe = null != (V = null == S ? void 0 : S[P]) ? V : 0, ce = z + ie - fe, pe = ue(m ? a(X, z + oe - fe - se) : X, z, m ? i(G, ce) : G);
                    W[P] = pe, q[P] = pe - z;
                }
                if (c) {
                    var le, de = "x" === P ? j : A, he = "x" === P ? E : D, me = W[k], ve = "y" === k ? "height" : "width", ge = me + b[de], ye = me - b[he], be = -1 !== [
                        j,
                        A
                    ].indexOf(x), xe = null != (le = null == S ? void 0 : S[k]) ? le : 0, we = be ? ge : me - B[ve] - H[ve] - xe + R.altAxis, Oe = be ? me + B[ve] + H[ve] - xe - R.altAxis : ye, je = m && be ? function(e, t, n) {
                        var r = ue(e, t, n);
                        return r > n ? n : r;
                    }(we, me, Oe) : ue(m ? we : ge, me, m ? Oe : ye);
                    W[k] = je, q[k] = je - me;
                }
                t.modifiersData[r] = q;
            }
        },
        requiresIfExists: [
            "offset"
        ]
    };
    var de = {
        name: "arrow",
        enabled: !0,
        phase: "main",
        fn: function(e) {
            var t, n = e.state, r = e.name, o = e.options, i = n.elements.arrow, a = n.modifiersData.popperOffsets, s = C(n.placement), f = F(s), c = [
                A,
                D
            ].indexOf(s) >= 0 ? "height" : "width";
            if (i && a) {
                var p = function(e, t) {
                    return z("number" != typeof (e = "function" == typeof e ? e(Object.assign({}, t.rects, {
                        placement: t.placement
                    })) : e) ? e : X(e, P));
                }(o.padding, n), u = v(i), l = "y" === f ? j : A, d = "y" === f ? E : D, h = n.rects.reference[c] + n.rects.reference[f] - a[f] - n.rects.popper[c], m = a[f] - n.rects.reference[f], g = O(i), y = g ? "y" === f ? g.clientHeight || 0 : g.clientWidth || 0 : 0, b = h / 2 - m / 2, x = p[l], w = y - u[c] - p[d], L = y / 2 - u[c] / 2 + b, M = ue(x, L, w), k = f;
                n.modifiersData[r] = ((t = {})[k] = M, t.centerOffset = M - L, t);
            }
        },
        effect: function(e) {
            var t = e.state, n = e.options.element, r = void 0 === n ? "[data-popper-arrow]" : n;
            null != r && ("string" != typeof r || (r = t.elements.popper.querySelector(r))) && q(t.elements.popper, r) && (t.elements.arrow = r);
        },
        requires: [
            "popperOffsets"
        ],
        requiresIfExists: [
            "preventOverflow"
        ]
    };
    function he(e, t, n) {
        return void 0 === n && (n = {
            x: 0,
            y: 0
        }), {
            top: e.top - t.height - n.y,
            right: e.right - t.width + n.x,
            bottom: e.bottom - t.height + n.y,
            left: e.left - t.width - n.x
        };
    }
    function me(e) {
        return [
            j,
            D,
            E,
            A
        ].some(function(t) {
            return e[t] >= 0;
        });
    }
    var ve = {
        name: "hide",
        enabled: !0,
        phase: "main",
        requiresIfExists: [
            "preventOverflow"
        ],
        fn: function(e) {
            var t = e.state, n = e.name, r = t.rects.reference, o = t.rects.popper, i = t.modifiersData.preventOverflow, a = Y(t, {
                elementContext: "reference"
            }), s = Y(t, {
                altBoundary: !0
            }), f = he(a, r), c = he(s, o, i), p = me(f), u = me(c);
            t.modifiersData[n] = {
                referenceClippingOffsets: f,
                popperEscapeOffsets: c,
                isReferenceHidden: p,
                hasPopperEscaped: u
            }, t.attributes.popper = Object.assign({}, t.attributes.popper, {
                "data-popper-reference-hidden": p,
                "data-popper-escaped": u
            });
        }
    }, ge = K({
        defaultModifiers: [
            Z,
            $,
            ne,
            re
        ]
    }), ye = [
        Z,
        $,
        ne,
        re,
        oe,
        pe,
        le,
        de,
        ve
    ], be = K({
        defaultModifiers: ye
    });
    e.applyStyles = re, e.arrow = de, e.computeStyles = ne, e.createPopper = be, e.createPopperLite = ge, e.defaultModifiers = ye, e.detectOverflow = Y, e.eventListeners = Z, e.flip = pe, e.hide = ve, e.offset = oe, e.popperGenerator = K, e.popperOffsets = $, e.preventOverflow = le, Object.defineProperty(e, "__esModule", {
        value: !0
    });
});
function humanFriendlyBytes(bytes, si = false, dp = 1) {
    const thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) {
        return bytes + " B";
    }
    const units = si ? [
        "kB",
        "MB",
        "GB",
        "TB",
        "PB",
        "EB",
        "ZB",
        "YB"
    ] : [
        "KiB",
        "MiB",
        "GiB",
        "TiB",
        "PiB",
        "EiB",
        "ZiB",
        "YiB"
    ];
    let u = -1;
    const r = 10 ** dp;
    do {
        bytes /= thresh;
        ++u;
    }while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1)
    return bytes.toFixed(dp) + " " + units[u];
}
function humanFriendlyPhrase(text) {
    return text.replace(/[^a-zA-Z0-9 ]/g, " ").replace(/\s\s+/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, (letter)=>letter.toUpperCase());
}
const humanPath = (original, maxLength = 50, formatBasename)=>{
    const tokens = original.split("/");
    const basename = tokens[tokens.length - 1];
    tokens.splice(0, 1);
    tokens.splice(tokens.length - 1, 1);
    if (original.length < maxLength) {
        return (tokens.length > 0 ? tokens.join("/") + "/" : "") + (formatBasename ? formatBasename(basename) : basename);
    }
    const remLen = maxLength - basename.length - 4;
    if (remLen > 0) {
        const path = tokens.join("/");
        const lenA = Math.ceil(remLen / 2);
        const lenB = Math.floor(remLen / 2);
        const pathA = path.substring(0, lenA);
        const pathB = path.substring(path.length - lenB);
        return pathA + "..." + pathB + "/" + (formatBasename ? formatBasename(basename) : basename);
    }
    return formatBasename ? formatBasename(basename) : basename;
};
export { humanFriendlyBytes as humanFriendlyBytes };
export { humanFriendlyPhrase as humanFriendlyPhrase };
export { humanPath as humanPath };
function minWhitespaceIndent(text) {
    const match = text.match(/^[ \t]*(?=\S)/gm);
    return match ? match.reduce((r, a)=>Math.min(r, a.length), Infinity) : 0;
}
function unindentWhitespace(text, removeInitialNewLine = true) {
    const indent = minWhitespaceIndent(text);
    const regex = new RegExp(`^[ \\t]{${indent}}`, "gm");
    const result = text.replace(regex, "");
    return removeInitialNewLine ? result.replace(/^\n/, "") : result;
}
function singleLineTrim(text) {
    return text.replace(/(\r\n|\n|\r)/gm, "").replace(/\s+(?=(?:[^\'"]*[\'"][^\'"]*[\'"])*[^\'"]*$)/g, " ").trim();
}
function whitespaceSensitiveTemplateLiteralSupplier(literals, suppliedExprs, options) {
    const { unindent =true , removeInitialNewLine =true  } = options ?? {};
    let literalSupplier = (index)=>literals[index];
    if (unindent) {
        if (typeof unindent === "boolean") {
            let originalText = "";
            for(let i = 0; i < suppliedExprs.length; i++){
                originalText += literals[i] + `\${expr${i}}`;
            }
            originalText += literals[literals.length - 1];
            const match = originalText.match(/^[ \t]*(?=\S)/gm);
            const minWhitespaceIndent = match ? match.reduce((r, a)=>Math.min(r, a.length), Infinity) : 0;
            if (minWhitespaceIndent > 0) {
                const unindentRegExp = new RegExp(`^[ \\t]{${minWhitespaceIndent}}`, "gm");
                literalSupplier = (index)=>{
                    let text = literals[index];
                    if (index == 0 && removeInitialNewLine) {
                        text = text.replace(/^\n/, "");
                    }
                    return text.replace(unindentRegExp, "");
                };
            }
        } else {
            literalSupplier = (index)=>{
                let text = literals[index];
                if (index == 0 && removeInitialNewLine) {
                    text = text.replace(/^\n/, "");
                }
                return text.replace(unindent, "");
            };
        }
    }
    return literalSupplier;
}
export { minWhitespaceIndent as minWhitespaceIndent };
export { unindentWhitespace as unindentWhitespace };
export { singleLineTrim as singleLineTrim };
export { whitespaceSensitiveTemplateLiteralSupplier as whitespaceSensitiveTemplateLiteralSupplier };
function markdownItTransformer() {
    return {
        dependencies: undefined,
        acquireDependencies: async (transformer)=>{
            const { default: markdownIt  } = await import("https://jspm.dev/markdown-it@12.2.0");
            return {
                markdownIt,
                plugins: await transformer.plugins()
            };
        },
        construct: async (transformer)=>{
            if (!transformer.dependencies) {
                transformer.dependencies = await transformer.acquireDependencies(transformer);
            }
            const markdownIt = transformer.dependencies.markdownIt({
                html: true,
                linkify: true,
                typographer: true
            });
            transformer.customize(markdownIt, transformer);
            return markdownIt;
        },
        customize: (markdownIt, transformer)=>{
            const plugins = transformer.dependencies.plugins;
            markdownIt.use(plugins.footnote);
            return transformer;
        },
        unindentWhitespace: (text, removeInitialNewLine = true)=>{
            const whitespace = text.match(/^[ \t]*(?=\S)/gm);
            const indentCount = whitespace ? whitespace.reduce((r, a)=>Math.min(r, a.length), Infinity) : 0;
            const regex = new RegExp(`^[ \\t]{${indentCount}}`, "gm");
            const result = text.replace(regex, "");
            return removeInitialNewLine ? result.replace(/^\n/, "") : result;
        },
        plugins: async ()=>{
            const { default: footnote  } = await import("https://jspm.dev/markdown-it-footnote@3.0.3");
            return {
                footnote,
                adjustHeadingLevel: (md, options)=>{
                    function getHeadingLevel(tagName) {
                        if (tagName[0].toLowerCase() === 'h') {
                            tagName = tagName.slice(1);
                        }
                        return parseInt(tagName, 10);
                    }
                    const firstLevel = options.firstLevel;
                    if (typeof firstLevel === 'string') {
                        firstLevel = getHeadingLevel(firstLevel);
                    }
                    if (!firstLevel || isNaN(firstLevel)) {
                        return;
                    }
                    const levelOffset = firstLevel - 1;
                    if (levelOffset < 1 || levelOffset > 6) {
                        return;
                    }
                    md.core.ruler.push("adjust-heading-levels", function(state) {
                        const tokens = state.tokens;
                        for(let i = 0; i < tokens.length; i++){
                            if (tokens[i].type !== "heading_close") {
                                continue;
                            }
                            const headingOpen = tokens[i - 2];
                            const headingClose = tokens[i];
                            const currentLevel = getHeadingLevel(headingOpen.tag);
                            const tagName = 'h' + Math.min(currentLevel + levelOffset, 6);
                            headingOpen.tag = tagName;
                            headingClose.tag = tagName;
                        }
                    });
                }
            };
        }
    };
}
async function renderMarkdown(strategies, mditt = markdownItTransformer()) {
    const markdownIt = await mditt.construct(mditt);
    for await (const strategy of strategies(mditt)){
        const markdown = mditt.unindentWhitespace(await strategy.markdownText(mditt));
        strategy.renderHTML(markdownIt.render(markdown), mditt);
    }
}
function importMarkdownContent(input, select, inject) {
    fetch(input).then((resp)=>{
        resp.text().then((html)=>{
            const parser = new DOMParser();
            const foreignDoc = parser.parseFromString(html, "text/html");
            const selected = select(foreignDoc);
            if (Array.isArray(selected)) {
                for (const s of selected){
                    const importedNode = document.adoptNode(s);
                    inject(importedNode, input, html);
                }
            } else if (selected) {
                const importedNode1 = document.adoptNode(selected);
                inject(importedNode1, input, html);
            }
        });
    });
}
async function transformMarkdownElemsCustom(srcElems, finalizeElemFn, mditt = markdownItTransformer()) {
    await renderMarkdown(function*() {
        for (const elem of srcElems){
            yield {
                markdownText: async ()=>{
                    if (elem.dataset.transformableSrc) {
                        const response = await fetch(elem.dataset.transformableSrc);
                        if (!response.ok) {
                            return `Error fetching ${elem.dataset.transformableSrc}: ${response.status}`;
                        }
                        return await response.text();
                    } else {
                        return elem.innerText;
                    }
                },
                renderHTML: async (html)=>{
                    try {
                        const formatted = document.createElement("div");
                        formatted.innerHTML = html;
                        elem.parentElement.replaceChild(formatted, elem);
                        if (finalizeElemFn) finalizeElemFn(formatted, elem);
                    } catch (error) {
                        console.error("Undiagnosable error in renderHTML()", error);
                    }
                }
            };
        }
    }, mditt);
}
async function transformMarkdownElems(firstHeadingLevel = 2) {
    const mdittDefaults = markdownItTransformer();
    await transformMarkdownElemsCustom(document.querySelectorAll(`[data-transformable="markdown"]`), (mdHtmlElem, mdSrcElem)=>{
        mdHtmlElem.dataset.transformedFrom = "markdown";
        if (mdSrcElem.className) mdHtmlElem.className = mdSrcElem.className;
        document.dispatchEvent(new CustomEvent("transformed-markdown", {
            detail: {
                mdHtmlElem,
                mdSrcElem
            }
        }));
    }, {
        ...mdittDefaults,
        customize: (markdownIt, transformer)=>{
            mdittDefaults.customize(markdownIt, transformer);
            markdownIt.use(transformer.dependencies.plugins.adjustHeadingLevel, {
                firstLevel: firstHeadingLevel
            });
        }
    });
}
export { markdownItTransformer as markdownItTransformer };
export { renderMarkdown as renderMarkdown };
export { importMarkdownContent as importMarkdownContent };
export { transformMarkdownElemsCustom as transformMarkdownElemsCustom };
export { transformMarkdownElems as transformMarkdownElems };
function getUrlQueryParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, "\\$&");
    const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
const editableFileRedirectURL = (absPath)=>{
    let src = absPath;
    if (src.startsWith("file://")) {
        src = src.substring(7);
        return [
            `/workspace/editor-redirect/abs${src}`,
            src
        ];
    } else {
        if (absPath.startsWith("/")) {
            return [
                `/workspace/editor-redirect/abs${absPath}`,
                absPath
            ];
        } else {
            return [
                src,
                src
            ];
        }
    }
};
const editableFileRefHTML = (absPath, humanizeLength)=>{
    const [href, label] = editableFileRedirectURL(absPath);
    return humanizeLength ? humanPath(label, humanizeLength, (basename)=>`<a href="${href}" class="fw-bold" title="${absPath}">${basename}</a>`) : `<a href="${href}">${label}</a>`;
};
const locationEditorRedirectURL = (location)=>editableFileRedirectURL(location.moduleImportMetaURL);
const locationEditorHTML = (location, humanizeLength)=>{
    const [href, label] = locationEditorRedirectURL(location);
    return humanizeLength ? humanPath(label, humanizeLength, (basename)=>`<a href="${href}" class="fw-bold" title="${location.moduleImportMetaURL}">${basename}</a>`) : `<a href="${href}">${label}</a>`;
};
export { getUrlQueryParameterByName as getUrlQueryParameterByName };
export { editableFileRedirectURL as editableFileRedirectURL };
export { editableFileRefHTML as editableFileRefHTML };
export { locationEditorRedirectURL as locationEditorRedirectURL };
export { locationEditorHTML as locationEditorHTML };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9kb3VnbGFzY3JvY2tmb3JkL0pTT04tanMvbWFzdGVyL2N5Y2xlLmpzIiwiaHR0cHM6Ly91bnBrZy5jb20vQHBvcHBlcmpzL2NvcmVAMi4xMS41L2Rpc3QvdW1kL3BvcHBlci5taW4uanMiLCJmaWxlOi8vL2hvbWUvc25zaGFoL3dvcmtzcGFjZXMvZ2l0aHViLmNvbS9yZXNGYWN0b3J5L2ZhY3RvcnkvbGliL3RleHQvaHVtYW4udHMiLCJmaWxlOi8vL2hvbWUvc25zaGFoL3dvcmtzcGFjZXMvZ2l0aHViLmNvbS9yZXNGYWN0b3J5L2ZhY3RvcnkvbGliL3RleHQvd2hpdGVzcGFjZS50cyIsImZpbGU6Ly8vaG9tZS9zbnNoYWgvd29ya3NwYWNlcy9naXRodWIuY29tL3Jlc0ZhY3RvcnkvZmFjdG9yeS9saWIvcHJlc2VudGF0aW9uL2RvbS9tYXJrZG93bi1pdC5qcyIsImZpbGU6Ly8vaG9tZS9zbnNoYWgvd29ya3NwYWNlcy9naXRodWIuY29tL3Jlc0ZhY3RvcnkvZmFjdG9yeS9leGVjdXRpdmUvcHVibC9zZXJ2ZXIvbWlkZGxld2FyZS93b3Jrc3BhY2UvdWEtZWRpdGFibGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAgICBjeWNsZS5qc1xuICAgIDIwMjEtMDUtMzFcblxuICAgIFB1YmxpYyBEb21haW4uXG5cbiAgICBOTyBXQVJSQU5UWSBFWFBSRVNTRUQgT1IgSU1QTElFRC4gVVNFIEFUIFlPVVIgT1dOIFJJU0suXG5cbiAgICBUaGlzIGNvZGUgc2hvdWxkIGJlIG1pbmlmaWVkIGJlZm9yZSBkZXBsb3ltZW50LlxuICAgIFNlZSBodHRwczovL3d3dy5jcm9ja2ZvcmQuY29tL2pzbWluLmh0bWxcblxuICAgIFVTRSBZT1VSIE9XTiBDT1BZLiBJVCBJUyBFWFRSRU1FTFkgVU5XSVNFIFRPIExPQUQgQ09ERSBGUk9NIFNFUlZFUlMgWU9VIERPXG4gICAgTk9UIENPTlRST0wuXG4qL1xuXG4vLyBUaGUgZmlsZSB1c2VzIHRoZSBXZWFrTWFwIGZlYXR1cmUgb2YgRVM2LlxuXG4vKmpzbGludCBldmFsICovXG5cbi8qcHJvcGVydHlcbiAgICAkcmVmLCBkZWN5Y2xlLCBmb3JFYWNoLCBnZXQsIGluZGV4T2YsIGlzQXJyYXksIGtleXMsIGxlbmd0aCwgcHVzaCxcbiAgICByZXRyb2N5Y2xlLCBzZXQsIHN0cmluZ2lmeSwgdGVzdFxuKi9cblxuaWYgKHR5cGVvZiBKU09OLmRlY3ljbGUgIT09IFwiZnVuY3Rpb25cIikge1xuICAgIEpTT04uZGVjeWNsZSA9IGZ1bmN0aW9uIGRlY3ljbGUob2JqZWN0LCByZXBsYWNlcikge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuLy8gTWFrZSBhIGRlZXAgY29weSBvZiBhbiBvYmplY3Qgb3IgYXJyYXksIGFzc3VyaW5nIHRoYXQgdGhlcmUgaXMgYXQgbW9zdFxuLy8gb25lIGluc3RhbmNlIG9mIGVhY2ggb2JqZWN0IG9yIGFycmF5IGluIHRoZSByZXN1bHRpbmcgc3RydWN0dXJlLiBUaGVcbi8vIGR1cGxpY2F0ZSByZWZlcmVuY2VzICh3aGljaCBtaWdodCBiZSBmb3JtaW5nIGN5Y2xlcykgYXJlIHJlcGxhY2VkIHdpdGhcbi8vIGFuIG9iamVjdCBvZiB0aGUgZm9ybVxuXG4vLyAgICAgIHtcIiRyZWZcIjogUEFUSH1cblxuLy8gd2hlcmUgdGhlIFBBVEggaXMgYSBKU09OUGF0aCBzdHJpbmcgdGhhdCBsb2NhdGVzIHRoZSBmaXJzdCBvY2N1cmFuY2UuXG5cbi8vIFNvLFxuXG4vLyAgICAgIHZhciBhID0gW107XG4vLyAgICAgIGFbMF0gPSBhO1xuLy8gICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoSlNPTi5kZWN5Y2xlKGEpKTtcblxuLy8gcHJvZHVjZXMgdGhlIHN0cmluZyAnW3tcIiRyZWZcIjpcIiRcIn1dJy5cblxuLy8gSWYgYSByZXBsYWNlciBmdW5jdGlvbiBpcyBwcm92aWRlZCwgdGhlbiBpdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCB2YWx1ZS5cbi8vIEEgcmVwbGFjZXIgZnVuY3Rpb24gcmVjZWl2ZXMgYSB2YWx1ZSBhbmQgcmV0dXJucyBhIHJlcGxhY2VtZW50IHZhbHVlLlxuXG4vLyBKU09OUGF0aCBpcyB1c2VkIHRvIGxvY2F0ZSB0aGUgdW5pcXVlIG9iamVjdC4gJCBpbmRpY2F0ZXMgdGhlIHRvcCBsZXZlbCBvZlxuLy8gdGhlIG9iamVjdCBvciBhcnJheS4gW05VTUJFUl0gb3IgW1NUUklOR10gaW5kaWNhdGVzIGEgY2hpbGQgZWxlbWVudCBvclxuLy8gcHJvcGVydHkuXG5cbiAgICAgICAgdmFyIG9iamVjdHMgPSBuZXcgV2Vha01hcCgpOyAgICAgLy8gb2JqZWN0IHRvIHBhdGggbWFwcGluZ3NcblxuICAgICAgICByZXR1cm4gKGZ1bmN0aW9uIGRlcmV6KHZhbHVlLCBwYXRoKSB7XG5cbi8vIFRoZSBkZXJleiBmdW5jdGlvbiByZWN1cnNlcyB0aHJvdWdoIHRoZSBvYmplY3QsIHByb2R1Y2luZyB0aGUgZGVlcCBjb3B5LlxuXG4gICAgICAgICAgICB2YXIgb2xkX3BhdGg7ICAgLy8gVGhlIHBhdGggb2YgYW4gZWFybGllciBvY2N1cmFuY2Ugb2YgdmFsdWVcbiAgICAgICAgICAgIHZhciBudTsgICAgICAgICAvLyBUaGUgbmV3IG9iamVjdCBvciBhcnJheVxuXG4vLyBJZiBhIHJlcGxhY2VyIGZ1bmN0aW9uIHdhcyBwcm92aWRlZCwgdGhlbiBjYWxsIGl0IHRvIGdldCBhIHJlcGxhY2VtZW50IHZhbHVlLlxuXG4gICAgICAgICAgICBpZiAocmVwbGFjZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gcmVwbGFjZXIodmFsdWUpO1xuICAgICAgICAgICAgfVxuXG4vLyB0eXBlb2YgbnVsbCA9PT0gXCJvYmplY3RcIiwgc28gZ28gb24gaWYgdGhpcyB2YWx1ZSBpcyByZWFsbHkgYW4gb2JqZWN0IGJ1dCBub3Rcbi8vIG9uZSBvZiB0aGUgd2VpcmQgYnVpbHRpbiBvYmplY3RzLlxuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiXG4gICAgICAgICAgICAgICAgJiYgdmFsdWUgIT09IG51bGxcbiAgICAgICAgICAgICAgICAmJiAhKHZhbHVlIGluc3RhbmNlb2YgQm9vbGVhbilcbiAgICAgICAgICAgICAgICAmJiAhKHZhbHVlIGluc3RhbmNlb2YgRGF0ZSlcbiAgICAgICAgICAgICAgICAmJiAhKHZhbHVlIGluc3RhbmNlb2YgTnVtYmVyKVxuICAgICAgICAgICAgICAgICYmICEodmFsdWUgaW5zdGFuY2VvZiBSZWdFeHApXG4gICAgICAgICAgICAgICAgJiYgISh2YWx1ZSBpbnN0YW5jZW9mIFN0cmluZylcbiAgICAgICAgICAgICkge1xuXG4vLyBJZiB0aGUgdmFsdWUgaXMgYW4gb2JqZWN0IG9yIGFycmF5LCBsb29rIHRvIHNlZSBpZiB3ZSBoYXZlIGFscmVhZHlcbi8vIGVuY291bnRlcmVkIGl0LiBJZiBzbywgcmV0dXJuIGEge1wiJHJlZlwiOlBBVEh9IG9iamVjdC4gVGhpcyB1c2VzIGFuXG4vLyBFUzYgV2Vha01hcC5cblxuICAgICAgICAgICAgICAgIG9sZF9wYXRoID0gb2JqZWN0cy5nZXQodmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChvbGRfcGF0aCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7JHJlZjogb2xkX3BhdGh9O1xuICAgICAgICAgICAgICAgIH1cblxuLy8gT3RoZXJ3aXNlLCBhY2N1bXVsYXRlIHRoZSB1bmlxdWUgdmFsdWUgYW5kIGl0cyBwYXRoLlxuXG4gICAgICAgICAgICAgICAgb2JqZWN0cy5zZXQodmFsdWUsIHBhdGgpO1xuXG4vLyBJZiBpdCBpcyBhbiBhcnJheSwgcmVwbGljYXRlIHRoZSBhcnJheS5cblxuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICBudSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZS5mb3JFYWNoKGZ1bmN0aW9uIChlbGVtZW50LCBpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBudVtpXSA9IGRlcmV6KGVsZW1lbnQsIHBhdGggKyBcIltcIiArIGkgKyBcIl1cIik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbi8vIElmIGl0IGlzIGFuIG9iamVjdCwgcmVwbGljYXRlIHRoZSBvYmplY3QuXG5cbiAgICAgICAgICAgICAgICAgICAgbnUgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXModmFsdWUpLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG51W25hbWVdID0gZGVyZXooXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVbbmFtZV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCArIFwiW1wiICsgSlNPTi5zdHJpbmdpZnkobmFtZSkgKyBcIl1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBudTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfShvYmplY3QsIFwiJFwiKSk7XG4gICAgfTtcbn1cblxuXG5pZiAodHlwZW9mIEpTT04ucmV0cm9jeWNsZSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgSlNPTi5yZXRyb2N5Y2xlID0gZnVuY3Rpb24gcmV0cm9jeWNsZSgkKSB7XG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4vLyBSZXN0b3JlIGFuIG9iamVjdCB0aGF0IHdhcyByZWR1Y2VkIGJ5IGRlY3ljbGUuIE1lbWJlcnMgd2hvc2UgdmFsdWVzIGFyZVxuLy8gb2JqZWN0cyBvZiB0aGUgZm9ybVxuLy8gICAgICB7JHJlZjogUEFUSH1cbi8vIGFyZSByZXBsYWNlZCB3aXRoIHJlZmVyZW5jZXMgdG8gdGhlIHZhbHVlIGZvdW5kIGJ5IHRoZSBQQVRILiBUaGlzIHdpbGxcbi8vIHJlc3RvcmUgY3ljbGVzLiBUaGUgb2JqZWN0IHdpbGwgYmUgbXV0YXRlZC5cblxuLy8gVGhlIGV2YWwgZnVuY3Rpb24gaXMgdXNlZCB0byBsb2NhdGUgdGhlIHZhbHVlcyBkZXNjcmliZWQgYnkgYSBQQVRILiBUaGVcbi8vIHJvb3Qgb2JqZWN0IGlzIGtlcHQgaW4gYSAkIHZhcmlhYmxlLiBBIHJlZ3VsYXIgZXhwcmVzc2lvbiBpcyB1c2VkIHRvXG4vLyBhc3N1cmUgdGhhdCB0aGUgUEFUSCBpcyBleHRyZW1lbHkgd2VsbCBmb3JtZWQuIFRoZSByZWdleHAgY29udGFpbnMgbmVzdGVkXG4vLyAqIHF1YW50aWZpZXJzLiBUaGF0IGhhcyBiZWVuIGtub3duIHRvIGhhdmUgZXh0cmVtZWx5IGJhZCBwZXJmb3JtYW5jZVxuLy8gcHJvYmxlbXMgb24gc29tZSBicm93c2VycyBmb3IgdmVyeSBsb25nIHN0cmluZ3MuIEEgUEFUSCBpcyBleHBlY3RlZCB0byBiZVxuLy8gcmVhc29uYWJseSBzaG9ydC4gQSBQQVRIIGlzIGFsbG93ZWQgdG8gYmVsb25nIHRvIGEgdmVyeSByZXN0cmljdGVkIHN1YnNldCBvZlxuLy8gR29lc3NuZXIncyBKU09OUGF0aC5cblxuLy8gU28sXG4vLyAgICAgIHZhciBzID0gJ1t7XCIkcmVmXCI6XCIkXCJ9XSc7XG4vLyAgICAgIHJldHVybiBKU09OLnJldHJvY3ljbGUoSlNPTi5wYXJzZShzKSk7XG4vLyBwcm9kdWNlcyBhbiBhcnJheSBjb250YWluaW5nIGEgc2luZ2xlIGVsZW1lbnQgd2hpY2ggaXMgdGhlIGFycmF5IGl0c2VsZi5cblxuICAgICAgICB2YXIgcHggPSAvXlxcJCg/OlxcWyg/OlxcZCt8XCIoPzpbXlxcXFxcIlxcdTAwMDAtXFx1MDAxZl18XFxcXCg/OltcXFxcXCJcXC9iZm5ydF18dVswLTlhLXpBLVpdezR9KSkqXCIpXFxdKSokLztcblxuICAgICAgICAoZnVuY3Rpb24gcmV6KHZhbHVlKSB7XG5cbi8vIFRoZSByZXogZnVuY3Rpb24gd2Fsa3MgcmVjdXJzaXZlbHkgdGhyb3VnaCB0aGUgb2JqZWN0IGxvb2tpbmcgZm9yICRyZWZcbi8vIHByb3BlcnRpZXMuIFdoZW4gaXQgZmluZHMgb25lIHRoYXQgaGFzIGEgdmFsdWUgdGhhdCBpcyBhIHBhdGgsIHRoZW4gaXRcbi8vIHJlcGxhY2VzIHRoZSAkcmVmIG9iamVjdCB3aXRoIGEgcmVmZXJlbmNlIHRvIHRoZSB2YWx1ZSB0aGF0IGlzIGZvdW5kIGJ5XG4vLyB0aGUgcGF0aC5cblxuICAgICAgICAgICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZS5mb3JFYWNoKGZ1bmN0aW9uIChlbGVtZW50LCBpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT09IFwib2JqZWN0XCIgJiYgZWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwYXRoID0gZWxlbWVudC4kcmVmO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcGF0aCA9PT0gXCJzdHJpbmdcIiAmJiBweC50ZXN0KHBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlW2ldID0gZXZhbChwYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXooZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyh2YWx1ZSkuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSB2YWx1ZVtuYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gXCJvYmplY3RcIiAmJiBpdGVtICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBhdGggPSBpdGVtLiRyZWY7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXRoID09PSBcInN0cmluZ1wiICYmIHB4LnRlc3QocGF0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVbbmFtZV0gPSBldmFsKHBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJleihpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSgkKSk7XG4gICAgICAgIHJldHVybiAkO1xuICAgIH07XG59XG4iLCIvKipcbiAqIEBwb3BwZXJqcy9jb3JlIHYyLjExLjUgLSBNSVQgTGljZW5zZVxuICovXG5cbiFmdW5jdGlvbihlLHQpe1wib2JqZWN0XCI9PXR5cGVvZiBleHBvcnRzJiZcInVuZGVmaW5lZFwiIT10eXBlb2YgbW9kdWxlP3QoZXhwb3J0cyk6XCJmdW5jdGlvblwiPT10eXBlb2YgZGVmaW5lJiZkZWZpbmUuYW1kP2RlZmluZShbXCJleHBvcnRzXCJdLHQpOnQoKGU9XCJ1bmRlZmluZWRcIiE9dHlwZW9mIGdsb2JhbFRoaXM/Z2xvYmFsVGhpczplfHxzZWxmKS5Qb3BwZXI9e30pfSh0aGlzLChmdW5jdGlvbihlKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiB0KGUpe2lmKG51bGw9PWUpcmV0dXJuIHdpbmRvdztpZihcIltvYmplY3QgV2luZG93XVwiIT09ZS50b1N0cmluZygpKXt2YXIgdD1lLm93bmVyRG9jdW1lbnQ7cmV0dXJuIHQmJnQuZGVmYXVsdFZpZXd8fHdpbmRvd31yZXR1cm4gZX1mdW5jdGlvbiBuKGUpe3JldHVybiBlIGluc3RhbmNlb2YgdChlKS5FbGVtZW50fHxlIGluc3RhbmNlb2YgRWxlbWVudH1mdW5jdGlvbiByKGUpe3JldHVybiBlIGluc3RhbmNlb2YgdChlKS5IVE1MRWxlbWVudHx8ZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50fWZ1bmN0aW9uIG8oZSl7cmV0dXJuXCJ1bmRlZmluZWRcIiE9dHlwZW9mIFNoYWRvd1Jvb3QmJihlIGluc3RhbmNlb2YgdChlKS5TaGFkb3dSb290fHxlIGluc3RhbmNlb2YgU2hhZG93Um9vdCl9dmFyIGk9TWF0aC5tYXgsYT1NYXRoLm1pbixzPU1hdGgucm91bmQ7ZnVuY3Rpb24gZihlLHQpe3ZvaWQgMD09PXQmJih0PSExKTt2YXIgbj1lLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLG89MSxpPTE7aWYocihlKSYmdCl7dmFyIGE9ZS5vZmZzZXRIZWlnaHQsZj1lLm9mZnNldFdpZHRoO2Y+MCYmKG89cyhuLndpZHRoKS9mfHwxKSxhPjAmJihpPXMobi5oZWlnaHQpL2F8fDEpfXJldHVybnt3aWR0aDpuLndpZHRoL28saGVpZ2h0Om4uaGVpZ2h0L2ksdG9wOm4udG9wL2kscmlnaHQ6bi5yaWdodC9vLGJvdHRvbTpuLmJvdHRvbS9pLGxlZnQ6bi5sZWZ0L28seDpuLmxlZnQvbyx5Om4udG9wL2l9fWZ1bmN0aW9uIGMoZSl7dmFyIG49dChlKTtyZXR1cm57c2Nyb2xsTGVmdDpuLnBhZ2VYT2Zmc2V0LHNjcm9sbFRvcDpuLnBhZ2VZT2Zmc2V0fX1mdW5jdGlvbiBwKGUpe3JldHVybiBlPyhlLm5vZGVOYW1lfHxcIlwiKS50b0xvd2VyQ2FzZSgpOm51bGx9ZnVuY3Rpb24gdShlKXtyZXR1cm4oKG4oZSk/ZS5vd25lckRvY3VtZW50OmUuZG9jdW1lbnQpfHx3aW5kb3cuZG9jdW1lbnQpLmRvY3VtZW50RWxlbWVudH1mdW5jdGlvbiBsKGUpe3JldHVybiBmKHUoZSkpLmxlZnQrYyhlKS5zY3JvbGxMZWZ0fWZ1bmN0aW9uIGQoZSl7cmV0dXJuIHQoZSkuZ2V0Q29tcHV0ZWRTdHlsZShlKX1mdW5jdGlvbiBoKGUpe3ZhciB0PWQoZSksbj10Lm92ZXJmbG93LHI9dC5vdmVyZmxvd1gsbz10Lm92ZXJmbG93WTtyZXR1cm4vYXV0b3xzY3JvbGx8b3ZlcmxheXxoaWRkZW4vLnRlc3QobitvK3IpfWZ1bmN0aW9uIG0oZSxuLG8pe3ZvaWQgMD09PW8mJihvPSExKTt2YXIgaSxhLGQ9cihuKSxtPXIobikmJmZ1bmN0aW9uKGUpe3ZhciB0PWUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksbj1zKHQud2lkdGgpL2Uub2Zmc2V0V2lkdGh8fDEscj1zKHQuaGVpZ2h0KS9lLm9mZnNldEhlaWdodHx8MTtyZXR1cm4gMSE9PW58fDEhPT1yfShuKSx2PXUobiksZz1mKGUsbSkseT17c2Nyb2xsTGVmdDowLHNjcm9sbFRvcDowfSxiPXt4OjAseTowfTtyZXR1cm4oZHx8IWQmJiFvKSYmKChcImJvZHlcIiE9PXAobil8fGgodikpJiYoeT0oaT1uKSE9PXQoaSkmJnIoaSk/e3Njcm9sbExlZnQ6KGE9aSkuc2Nyb2xsTGVmdCxzY3JvbGxUb3A6YS5zY3JvbGxUb3B9OmMoaSkpLHIobik/KChiPWYobiwhMCkpLngrPW4uY2xpZW50TGVmdCxiLnkrPW4uY2xpZW50VG9wKTp2JiYoYi54PWwodikpKSx7eDpnLmxlZnQreS5zY3JvbGxMZWZ0LWIueCx5OmcudG9wK3kuc2Nyb2xsVG9wLWIueSx3aWR0aDpnLndpZHRoLGhlaWdodDpnLmhlaWdodH19ZnVuY3Rpb24gdihlKXt2YXIgdD1mKGUpLG49ZS5vZmZzZXRXaWR0aCxyPWUub2Zmc2V0SGVpZ2h0O3JldHVybiBNYXRoLmFicyh0LndpZHRoLW4pPD0xJiYobj10LndpZHRoKSxNYXRoLmFicyh0LmhlaWdodC1yKTw9MSYmKHI9dC5oZWlnaHQpLHt4OmUub2Zmc2V0TGVmdCx5OmUub2Zmc2V0VG9wLHdpZHRoOm4saGVpZ2h0OnJ9fWZ1bmN0aW9uIGcoZSl7cmV0dXJuXCJodG1sXCI9PT1wKGUpP2U6ZS5hc3NpZ25lZFNsb3R8fGUucGFyZW50Tm9kZXx8KG8oZSk/ZS5ob3N0Om51bGwpfHx1KGUpfWZ1bmN0aW9uIHkoZSl7cmV0dXJuW1wiaHRtbFwiLFwiYm9keVwiLFwiI2RvY3VtZW50XCJdLmluZGV4T2YocChlKSk+PTA/ZS5vd25lckRvY3VtZW50LmJvZHk6cihlKSYmaChlKT9lOnkoZyhlKSl9ZnVuY3Rpb24gYihlLG4pe3ZhciByO3ZvaWQgMD09PW4mJihuPVtdKTt2YXIgbz15KGUpLGk9bz09PShudWxsPT0ocj1lLm93bmVyRG9jdW1lbnQpP3ZvaWQgMDpyLmJvZHkpLGE9dChvKSxzPWk/W2FdLmNvbmNhdChhLnZpc3VhbFZpZXdwb3J0fHxbXSxoKG8pP286W10pOm8sZj1uLmNvbmNhdChzKTtyZXR1cm4gaT9mOmYuY29uY2F0KGIoZyhzKSkpfWZ1bmN0aW9uIHgoZSl7cmV0dXJuW1widGFibGVcIixcInRkXCIsXCJ0aFwiXS5pbmRleE9mKHAoZSkpPj0wfWZ1bmN0aW9uIHcoZSl7cmV0dXJuIHIoZSkmJlwiZml4ZWRcIiE9PWQoZSkucG9zaXRpb24/ZS5vZmZzZXRQYXJlbnQ6bnVsbH1mdW5jdGlvbiBPKGUpe2Zvcih2YXIgbj10KGUpLGk9dyhlKTtpJiZ4KGkpJiZcInN0YXRpY1wiPT09ZChpKS5wb3NpdGlvbjspaT13KGkpO3JldHVybiBpJiYoXCJodG1sXCI9PT1wKGkpfHxcImJvZHlcIj09PXAoaSkmJlwic3RhdGljXCI9PT1kKGkpLnBvc2l0aW9uKT9uOml8fGZ1bmN0aW9uKGUpe3ZhciB0PS0xIT09bmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoXCJmaXJlZm94XCIpO2lmKC0xIT09bmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiVHJpZGVudFwiKSYmcihlKSYmXCJmaXhlZFwiPT09ZChlKS5wb3NpdGlvbilyZXR1cm4gbnVsbDt2YXIgbj1nKGUpO2ZvcihvKG4pJiYobj1uLmhvc3QpO3IobikmJltcImh0bWxcIixcImJvZHlcIl0uaW5kZXhPZihwKG4pKTwwOyl7dmFyIGk9ZChuKTtpZihcIm5vbmVcIiE9PWkudHJhbnNmb3JtfHxcIm5vbmVcIiE9PWkucGVyc3BlY3RpdmV8fFwicGFpbnRcIj09PWkuY29udGFpbnx8LTEhPT1bXCJ0cmFuc2Zvcm1cIixcInBlcnNwZWN0aXZlXCJdLmluZGV4T2YoaS53aWxsQ2hhbmdlKXx8dCYmXCJmaWx0ZXJcIj09PWkud2lsbENoYW5nZXx8dCYmaS5maWx0ZXImJlwibm9uZVwiIT09aS5maWx0ZXIpcmV0dXJuIG47bj1uLnBhcmVudE5vZGV9cmV0dXJuIG51bGx9KGUpfHxufXZhciBqPVwidG9wXCIsRT1cImJvdHRvbVwiLEQ9XCJyaWdodFwiLEE9XCJsZWZ0XCIsTD1cImF1dG9cIixQPVtqLEUsRCxBXSxNPVwic3RhcnRcIixrPVwiZW5kXCIsVz1cInZpZXdwb3J0XCIsQj1cInBvcHBlclwiLEg9UC5yZWR1Y2UoKGZ1bmN0aW9uKGUsdCl7cmV0dXJuIGUuY29uY2F0KFt0K1wiLVwiK00sdCtcIi1cIitrXSl9KSxbXSksVD1bXS5jb25jYXQoUCxbTF0pLnJlZHVjZSgoZnVuY3Rpb24oZSx0KXtyZXR1cm4gZS5jb25jYXQoW3QsdCtcIi1cIitNLHQrXCItXCIra10pfSksW10pLFI9W1wiYmVmb3JlUmVhZFwiLFwicmVhZFwiLFwiYWZ0ZXJSZWFkXCIsXCJiZWZvcmVNYWluXCIsXCJtYWluXCIsXCJhZnRlck1haW5cIixcImJlZm9yZVdyaXRlXCIsXCJ3cml0ZVwiLFwiYWZ0ZXJXcml0ZVwiXTtmdW5jdGlvbiBTKGUpe3ZhciB0PW5ldyBNYXAsbj1uZXcgU2V0LHI9W107ZnVuY3Rpb24gbyhlKXtuLmFkZChlLm5hbWUpLFtdLmNvbmNhdChlLnJlcXVpcmVzfHxbXSxlLnJlcXVpcmVzSWZFeGlzdHN8fFtdKS5mb3JFYWNoKChmdW5jdGlvbihlKXtpZighbi5oYXMoZSkpe3ZhciByPXQuZ2V0KGUpO3ImJm8ocil9fSkpLHIucHVzaChlKX1yZXR1cm4gZS5mb3JFYWNoKChmdW5jdGlvbihlKXt0LnNldChlLm5hbWUsZSl9KSksZS5mb3JFYWNoKChmdW5jdGlvbihlKXtuLmhhcyhlLm5hbWUpfHxvKGUpfSkpLHJ9ZnVuY3Rpb24gQyhlKXtyZXR1cm4gZS5zcGxpdChcIi1cIilbMF19ZnVuY3Rpb24gcShlLHQpe3ZhciBuPXQuZ2V0Um9vdE5vZGUmJnQuZ2V0Um9vdE5vZGUoKTtpZihlLmNvbnRhaW5zKHQpKXJldHVybiEwO2lmKG4mJm8obikpe3ZhciByPXQ7ZG97aWYociYmZS5pc1NhbWVOb2RlKHIpKXJldHVybiEwO3I9ci5wYXJlbnROb2RlfHxyLmhvc3R9d2hpbGUocil9cmV0dXJuITF9ZnVuY3Rpb24gVihlKXtyZXR1cm4gT2JqZWN0LmFzc2lnbih7fSxlLHtsZWZ0OmUueCx0b3A6ZS55LHJpZ2h0OmUueCtlLndpZHRoLGJvdHRvbTplLnkrZS5oZWlnaHR9KX1mdW5jdGlvbiBOKGUscil7cmV0dXJuIHI9PT1XP1YoZnVuY3Rpb24oZSl7dmFyIG49dChlKSxyPXUoZSksbz1uLnZpc3VhbFZpZXdwb3J0LGk9ci5jbGllbnRXaWR0aCxhPXIuY2xpZW50SGVpZ2h0LHM9MCxmPTA7cmV0dXJuIG8mJihpPW8ud2lkdGgsYT1vLmhlaWdodCwvXigoPyFjaHJvbWV8YW5kcm9pZCkuKSpzYWZhcmkvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpfHwocz1vLm9mZnNldExlZnQsZj1vLm9mZnNldFRvcCkpLHt3aWR0aDppLGhlaWdodDphLHg6cytsKGUpLHk6Zn19KGUpKTpuKHIpP2Z1bmN0aW9uKGUpe3ZhciB0PWYoZSk7cmV0dXJuIHQudG9wPXQudG9wK2UuY2xpZW50VG9wLHQubGVmdD10LmxlZnQrZS5jbGllbnRMZWZ0LHQuYm90dG9tPXQudG9wK2UuY2xpZW50SGVpZ2h0LHQucmlnaHQ9dC5sZWZ0K2UuY2xpZW50V2lkdGgsdC53aWR0aD1lLmNsaWVudFdpZHRoLHQuaGVpZ2h0PWUuY2xpZW50SGVpZ2h0LHQueD10LmxlZnQsdC55PXQudG9wLHR9KHIpOlYoZnVuY3Rpb24oZSl7dmFyIHQsbj11KGUpLHI9YyhlKSxvPW51bGw9PSh0PWUub3duZXJEb2N1bWVudCk/dm9pZCAwOnQuYm9keSxhPWkobi5zY3JvbGxXaWR0aCxuLmNsaWVudFdpZHRoLG8/by5zY3JvbGxXaWR0aDowLG8/by5jbGllbnRXaWR0aDowKSxzPWkobi5zY3JvbGxIZWlnaHQsbi5jbGllbnRIZWlnaHQsbz9vLnNjcm9sbEhlaWdodDowLG8/by5jbGllbnRIZWlnaHQ6MCksZj0tci5zY3JvbGxMZWZ0K2woZSkscD0tci5zY3JvbGxUb3A7cmV0dXJuXCJydGxcIj09PWQob3x8bikuZGlyZWN0aW9uJiYoZis9aShuLmNsaWVudFdpZHRoLG8/by5jbGllbnRXaWR0aDowKS1hKSx7d2lkdGg6YSxoZWlnaHQ6cyx4OmYseTpwfX0odShlKSkpfWZ1bmN0aW9uIEkoZSx0LG8pe3ZhciBzPVwiY2xpcHBpbmdQYXJlbnRzXCI9PT10P2Z1bmN0aW9uKGUpe3ZhciB0PWIoZyhlKSksbz1bXCJhYnNvbHV0ZVwiLFwiZml4ZWRcIl0uaW5kZXhPZihkKGUpLnBvc2l0aW9uKT49MCYmcihlKT9PKGUpOmU7cmV0dXJuIG4obyk/dC5maWx0ZXIoKGZ1bmN0aW9uKGUpe3JldHVybiBuKGUpJiZxKGUsbykmJlwiYm9keVwiIT09cChlKX0pKTpbXX0oZSk6W10uY29uY2F0KHQpLGY9W10uY29uY2F0KHMsW29dKSxjPWZbMF0sdT1mLnJlZHVjZSgoZnVuY3Rpb24odCxuKXt2YXIgcj1OKGUsbik7cmV0dXJuIHQudG9wPWkoci50b3AsdC50b3ApLHQucmlnaHQ9YShyLnJpZ2h0LHQucmlnaHQpLHQuYm90dG9tPWEoci5ib3R0b20sdC5ib3R0b20pLHQubGVmdD1pKHIubGVmdCx0LmxlZnQpLHR9KSxOKGUsYykpO3JldHVybiB1LndpZHRoPXUucmlnaHQtdS5sZWZ0LHUuaGVpZ2h0PXUuYm90dG9tLXUudG9wLHUueD11LmxlZnQsdS55PXUudG9wLHV9ZnVuY3Rpb24gXyhlKXtyZXR1cm4gZS5zcGxpdChcIi1cIilbMV19ZnVuY3Rpb24gRihlKXtyZXR1cm5bXCJ0b3BcIixcImJvdHRvbVwiXS5pbmRleE9mKGUpPj0wP1wieFwiOlwieVwifWZ1bmN0aW9uIFUoZSl7dmFyIHQsbj1lLnJlZmVyZW5jZSxyPWUuZWxlbWVudCxvPWUucGxhY2VtZW50LGk9bz9DKG8pOm51bGwsYT1vP18obyk6bnVsbCxzPW4ueCtuLndpZHRoLzItci53aWR0aC8yLGY9bi55K24uaGVpZ2h0LzItci5oZWlnaHQvMjtzd2l0Y2goaSl7Y2FzZSBqOnQ9e3g6cyx5Om4ueS1yLmhlaWdodH07YnJlYWs7Y2FzZSBFOnQ9e3g6cyx5Om4ueStuLmhlaWdodH07YnJlYWs7Y2FzZSBEOnQ9e3g6bi54K24ud2lkdGgseTpmfTticmVhaztjYXNlIEE6dD17eDpuLngtci53aWR0aCx5OmZ9O2JyZWFrO2RlZmF1bHQ6dD17eDpuLngseTpuLnl9fXZhciBjPWk/RihpKTpudWxsO2lmKG51bGwhPWMpe3ZhciBwPVwieVwiPT09Yz9cImhlaWdodFwiOlwid2lkdGhcIjtzd2l0Y2goYSl7Y2FzZSBNOnRbY109dFtjXS0obltwXS8yLXJbcF0vMik7YnJlYWs7Y2FzZSBrOnRbY109dFtjXSsobltwXS8yLXJbcF0vMil9fXJldHVybiB0fWZ1bmN0aW9uIHooZSl7cmV0dXJuIE9iamVjdC5hc3NpZ24oe30se3RvcDowLHJpZ2h0OjAsYm90dG9tOjAsbGVmdDowfSxlKX1mdW5jdGlvbiBYKGUsdCl7cmV0dXJuIHQucmVkdWNlKChmdW5jdGlvbih0LG4pe3JldHVybiB0W25dPWUsdH0pLHt9KX1mdW5jdGlvbiBZKGUsdCl7dm9pZCAwPT09dCYmKHQ9e30pO3ZhciByPXQsbz1yLnBsYWNlbWVudCxpPXZvaWQgMD09PW8/ZS5wbGFjZW1lbnQ6byxhPXIuYm91bmRhcnkscz12b2lkIDA9PT1hP1wiY2xpcHBpbmdQYXJlbnRzXCI6YSxjPXIucm9vdEJvdW5kYXJ5LHA9dm9pZCAwPT09Yz9XOmMsbD1yLmVsZW1lbnRDb250ZXh0LGQ9dm9pZCAwPT09bD9COmwsaD1yLmFsdEJvdW5kYXJ5LG09dm9pZCAwIT09aCYmaCx2PXIucGFkZGluZyxnPXZvaWQgMD09PXY/MDp2LHk9eihcIm51bWJlclwiIT10eXBlb2YgZz9nOlgoZyxQKSksYj1kPT09Qj9cInJlZmVyZW5jZVwiOkIseD1lLnJlY3RzLnBvcHBlcix3PWUuZWxlbWVudHNbbT9iOmRdLE89SShuKHcpP3c6dy5jb250ZXh0RWxlbWVudHx8dShlLmVsZW1lbnRzLnBvcHBlcikscyxwKSxBPWYoZS5lbGVtZW50cy5yZWZlcmVuY2UpLEw9VSh7cmVmZXJlbmNlOkEsZWxlbWVudDp4LHN0cmF0ZWd5OlwiYWJzb2x1dGVcIixwbGFjZW1lbnQ6aX0pLE09VihPYmplY3QuYXNzaWduKHt9LHgsTCkpLGs9ZD09PUI/TTpBLEg9e3RvcDpPLnRvcC1rLnRvcCt5LnRvcCxib3R0b206ay5ib3R0b20tTy5ib3R0b20reS5ib3R0b20sbGVmdDpPLmxlZnQtay5sZWZ0K3kubGVmdCxyaWdodDprLnJpZ2h0LU8ucmlnaHQreS5yaWdodH0sVD1lLm1vZGlmaWVyc0RhdGEub2Zmc2V0O2lmKGQ9PT1CJiZUKXt2YXIgUj1UW2ldO09iamVjdC5rZXlzKEgpLmZvckVhY2goKGZ1bmN0aW9uKGUpe3ZhciB0PVtELEVdLmluZGV4T2YoZSk+PTA/MTotMSxuPVtqLEVdLmluZGV4T2YoZSk+PTA/XCJ5XCI6XCJ4XCI7SFtlXSs9UltuXSp0fSkpfXJldHVybiBIfXZhciBHPXtwbGFjZW1lbnQ6XCJib3R0b21cIixtb2RpZmllcnM6W10sc3RyYXRlZ3k6XCJhYnNvbHV0ZVwifTtmdW5jdGlvbiBKKCl7Zm9yKHZhciBlPWFyZ3VtZW50cy5sZW5ndGgsdD1uZXcgQXJyYXkoZSksbj0wO248ZTtuKyspdFtuXT1hcmd1bWVudHNbbl07cmV0dXJuIXQuc29tZSgoZnVuY3Rpb24oZSl7cmV0dXJuIShlJiZcImZ1bmN0aW9uXCI9PXR5cGVvZiBlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCl9KSl9ZnVuY3Rpb24gSyhlKXt2b2lkIDA9PT1lJiYoZT17fSk7dmFyIHQ9ZSxyPXQuZGVmYXVsdE1vZGlmaWVycyxvPXZvaWQgMD09PXI/W106cixpPXQuZGVmYXVsdE9wdGlvbnMsYT12b2lkIDA9PT1pP0c6aTtyZXR1cm4gZnVuY3Rpb24oZSx0LHIpe3ZvaWQgMD09PXImJihyPWEpO3ZhciBpLHMsZj17cGxhY2VtZW50OlwiYm90dG9tXCIsb3JkZXJlZE1vZGlmaWVyczpbXSxvcHRpb25zOk9iamVjdC5hc3NpZ24oe30sRyxhKSxtb2RpZmllcnNEYXRhOnt9LGVsZW1lbnRzOntyZWZlcmVuY2U6ZSxwb3BwZXI6dH0sYXR0cmlidXRlczp7fSxzdHlsZXM6e319LGM9W10scD0hMSx1PXtzdGF0ZTpmLHNldE9wdGlvbnM6ZnVuY3Rpb24ocil7dmFyIGk9XCJmdW5jdGlvblwiPT10eXBlb2Ygcj9yKGYub3B0aW9ucyk6cjtsKCksZi5vcHRpb25zPU9iamVjdC5hc3NpZ24oe30sYSxmLm9wdGlvbnMsaSksZi5zY3JvbGxQYXJlbnRzPXtyZWZlcmVuY2U6bihlKT9iKGUpOmUuY29udGV4dEVsZW1lbnQ/YihlLmNvbnRleHRFbGVtZW50KTpbXSxwb3BwZXI6Yih0KX07dmFyIHMscCxkPWZ1bmN0aW9uKGUpe3ZhciB0PVMoZSk7cmV0dXJuIFIucmVkdWNlKChmdW5jdGlvbihlLG4pe3JldHVybiBlLmNvbmNhdCh0LmZpbHRlcigoZnVuY3Rpb24oZSl7cmV0dXJuIGUucGhhc2U9PT1ufSkpKX0pLFtdKX0oKHM9W10uY29uY2F0KG8sZi5vcHRpb25zLm1vZGlmaWVycykscD1zLnJlZHVjZSgoZnVuY3Rpb24oZSx0KXt2YXIgbj1lW3QubmFtZV07cmV0dXJuIGVbdC5uYW1lXT1uP09iamVjdC5hc3NpZ24oe30sbix0LHtvcHRpb25zOk9iamVjdC5hc3NpZ24oe30sbi5vcHRpb25zLHQub3B0aW9ucyksZGF0YTpPYmplY3QuYXNzaWduKHt9LG4uZGF0YSx0LmRhdGEpfSk6dCxlfSkse30pLE9iamVjdC5rZXlzKHApLm1hcCgoZnVuY3Rpb24oZSl7cmV0dXJuIHBbZV19KSkpKTtyZXR1cm4gZi5vcmRlcmVkTW9kaWZpZXJzPWQuZmlsdGVyKChmdW5jdGlvbihlKXtyZXR1cm4gZS5lbmFibGVkfSkpLGYub3JkZXJlZE1vZGlmaWVycy5mb3JFYWNoKChmdW5jdGlvbihlKXt2YXIgdD1lLm5hbWUsbj1lLm9wdGlvbnMscj12b2lkIDA9PT1uP3t9Om4sbz1lLmVmZmVjdDtpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiBvKXt2YXIgaT1vKHtzdGF0ZTpmLG5hbWU6dCxpbnN0YW5jZTp1LG9wdGlvbnM6cn0pLGE9ZnVuY3Rpb24oKXt9O2MucHVzaChpfHxhKX19KSksdS51cGRhdGUoKX0sZm9yY2VVcGRhdGU6ZnVuY3Rpb24oKXtpZighcCl7dmFyIGU9Zi5lbGVtZW50cyx0PWUucmVmZXJlbmNlLG49ZS5wb3BwZXI7aWYoSih0LG4pKXtmLnJlY3RzPXtyZWZlcmVuY2U6bSh0LE8obiksXCJmaXhlZFwiPT09Zi5vcHRpb25zLnN0cmF0ZWd5KSxwb3BwZXI6dihuKX0sZi5yZXNldD0hMSxmLnBsYWNlbWVudD1mLm9wdGlvbnMucGxhY2VtZW50LGYub3JkZXJlZE1vZGlmaWVycy5mb3JFYWNoKChmdW5jdGlvbihlKXtyZXR1cm4gZi5tb2RpZmllcnNEYXRhW2UubmFtZV09T2JqZWN0LmFzc2lnbih7fSxlLmRhdGEpfSkpO2Zvcih2YXIgcj0wO3I8Zi5vcmRlcmVkTW9kaWZpZXJzLmxlbmd0aDtyKyspaWYoITAhPT1mLnJlc2V0KXt2YXIgbz1mLm9yZGVyZWRNb2RpZmllcnNbcl0saT1vLmZuLGE9by5vcHRpb25zLHM9dm9pZCAwPT09YT97fTphLGM9by5uYW1lO1wiZnVuY3Rpb25cIj09dHlwZW9mIGkmJihmPWkoe3N0YXRlOmYsb3B0aW9uczpzLG5hbWU6YyxpbnN0YW5jZTp1fSl8fGYpfWVsc2UgZi5yZXNldD0hMSxyPS0xfX19LHVwZGF0ZTooaT1mdW5jdGlvbigpe3JldHVybiBuZXcgUHJvbWlzZSgoZnVuY3Rpb24oZSl7dS5mb3JjZVVwZGF0ZSgpLGUoZil9KSl9LGZ1bmN0aW9uKCl7cmV0dXJuIHN8fChzPW5ldyBQcm9taXNlKChmdW5jdGlvbihlKXtQcm9taXNlLnJlc29sdmUoKS50aGVuKChmdW5jdGlvbigpe3M9dm9pZCAwLGUoaSgpKX0pKX0pKSksc30pLGRlc3Ryb3k6ZnVuY3Rpb24oKXtsKCkscD0hMH19O2lmKCFKKGUsdCkpcmV0dXJuIHU7ZnVuY3Rpb24gbCgpe2MuZm9yRWFjaCgoZnVuY3Rpb24oZSl7cmV0dXJuIGUoKX0pKSxjPVtdfXJldHVybiB1LnNldE9wdGlvbnMocikudGhlbigoZnVuY3Rpb24oZSl7IXAmJnIub25GaXJzdFVwZGF0ZSYmci5vbkZpcnN0VXBkYXRlKGUpfSkpLHV9fXZhciBRPXtwYXNzaXZlOiEwfTt2YXIgWj17bmFtZTpcImV2ZW50TGlzdGVuZXJzXCIsZW5hYmxlZDohMCxwaGFzZTpcIndyaXRlXCIsZm46ZnVuY3Rpb24oKXt9LGVmZmVjdDpmdW5jdGlvbihlKXt2YXIgbj1lLnN0YXRlLHI9ZS5pbnN0YW5jZSxvPWUub3B0aW9ucyxpPW8uc2Nyb2xsLGE9dm9pZCAwPT09aXx8aSxzPW8ucmVzaXplLGY9dm9pZCAwPT09c3x8cyxjPXQobi5lbGVtZW50cy5wb3BwZXIpLHA9W10uY29uY2F0KG4uc2Nyb2xsUGFyZW50cy5yZWZlcmVuY2Usbi5zY3JvbGxQYXJlbnRzLnBvcHBlcik7cmV0dXJuIGEmJnAuZm9yRWFjaCgoZnVuY3Rpb24oZSl7ZS5hZGRFdmVudExpc3RlbmVyKFwic2Nyb2xsXCIsci51cGRhdGUsUSl9KSksZiYmYy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsci51cGRhdGUsUSksZnVuY3Rpb24oKXthJiZwLmZvckVhY2goKGZ1bmN0aW9uKGUpe2UucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInNjcm9sbFwiLHIudXBkYXRlLFEpfSkpLGYmJmMucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLHIudXBkYXRlLFEpfX0sZGF0YTp7fX07dmFyICQ9e25hbWU6XCJwb3BwZXJPZmZzZXRzXCIsZW5hYmxlZDohMCxwaGFzZTpcInJlYWRcIixmbjpmdW5jdGlvbihlKXt2YXIgdD1lLnN0YXRlLG49ZS5uYW1lO3QubW9kaWZpZXJzRGF0YVtuXT1VKHtyZWZlcmVuY2U6dC5yZWN0cy5yZWZlcmVuY2UsZWxlbWVudDp0LnJlY3RzLnBvcHBlcixzdHJhdGVneTpcImFic29sdXRlXCIscGxhY2VtZW50OnQucGxhY2VtZW50fSl9LGRhdGE6e319LGVlPXt0b3A6XCJhdXRvXCIscmlnaHQ6XCJhdXRvXCIsYm90dG9tOlwiYXV0b1wiLGxlZnQ6XCJhdXRvXCJ9O2Z1bmN0aW9uIHRlKGUpe3ZhciBuLHI9ZS5wb3BwZXIsbz1lLnBvcHBlclJlY3QsaT1lLnBsYWNlbWVudCxhPWUudmFyaWF0aW9uLGY9ZS5vZmZzZXRzLGM9ZS5wb3NpdGlvbixwPWUuZ3B1QWNjZWxlcmF0aW9uLGw9ZS5hZGFwdGl2ZSxoPWUucm91bmRPZmZzZXRzLG09ZS5pc0ZpeGVkLHY9Zi54LGc9dm9pZCAwPT09dj8wOnYseT1mLnksYj12b2lkIDA9PT15PzA6eSx4PVwiZnVuY3Rpb25cIj09dHlwZW9mIGg/aCh7eDpnLHk6Yn0pOnt4OmcseTpifTtnPXgueCxiPXgueTt2YXIgdz1mLmhhc093blByb3BlcnR5KFwieFwiKSxMPWYuaGFzT3duUHJvcGVydHkoXCJ5XCIpLFA9QSxNPWosVz13aW5kb3c7aWYobCl7dmFyIEI9TyhyKSxIPVwiY2xpZW50SGVpZ2h0XCIsVD1cImNsaWVudFdpZHRoXCI7aWYoQj09PXQocikmJlwic3RhdGljXCIhPT1kKEI9dShyKSkucG9zaXRpb24mJlwiYWJzb2x1dGVcIj09PWMmJihIPVwic2Nyb2xsSGVpZ2h0XCIsVD1cInNjcm9sbFdpZHRoXCIpLEI9QixpPT09anx8KGk9PT1BfHxpPT09RCkmJmE9PT1rKU09RSxiLT0obSYmQj09PVcmJlcudmlzdWFsVmlld3BvcnQ/Vy52aXN1YWxWaWV3cG9ydC5oZWlnaHQ6QltIXSktby5oZWlnaHQsYio9cD8xOi0xO2lmKGk9PT1BfHwoaT09PWp8fGk9PT1FKSYmYT09PWspUD1ELGctPShtJiZCPT09VyYmVy52aXN1YWxWaWV3cG9ydD9XLnZpc3VhbFZpZXdwb3J0LndpZHRoOkJbVF0pLW8ud2lkdGgsZyo9cD8xOi0xfXZhciBSLFM9T2JqZWN0LmFzc2lnbih7cG9zaXRpb246Y30sbCYmZWUpLEM9ITA9PT1oP2Z1bmN0aW9uKGUpe3ZhciB0PWUueCxuPWUueSxyPXdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvfHwxO3JldHVybnt4OnModCpyKS9yfHwwLHk6cyhuKnIpL3J8fDB9fSh7eDpnLHk6Yn0pOnt4OmcseTpifTtyZXR1cm4gZz1DLngsYj1DLnkscD9PYmplY3QuYXNzaWduKHt9LFMsKChSPXt9KVtNXT1MP1wiMFwiOlwiXCIsUltQXT13P1wiMFwiOlwiXCIsUi50cmFuc2Zvcm09KFcuZGV2aWNlUGl4ZWxSYXRpb3x8MSk8PTE/XCJ0cmFuc2xhdGUoXCIrZytcInB4LCBcIitiK1wicHgpXCI6XCJ0cmFuc2xhdGUzZChcIitnK1wicHgsIFwiK2IrXCJweCwgMClcIixSKSk6T2JqZWN0LmFzc2lnbih7fSxTLCgobj17fSlbTV09TD9iK1wicHhcIjpcIlwiLG5bUF09dz9nK1wicHhcIjpcIlwiLG4udHJhbnNmb3JtPVwiXCIsbikpfXZhciBuZT17bmFtZTpcImNvbXB1dGVTdHlsZXNcIixlbmFibGVkOiEwLHBoYXNlOlwiYmVmb3JlV3JpdGVcIixmbjpmdW5jdGlvbihlKXt2YXIgdD1lLnN0YXRlLG49ZS5vcHRpb25zLHI9bi5ncHVBY2NlbGVyYXRpb24sbz12b2lkIDA9PT1yfHxyLGk9bi5hZGFwdGl2ZSxhPXZvaWQgMD09PWl8fGkscz1uLnJvdW5kT2Zmc2V0cyxmPXZvaWQgMD09PXN8fHMsYz17cGxhY2VtZW50OkModC5wbGFjZW1lbnQpLHZhcmlhdGlvbjpfKHQucGxhY2VtZW50KSxwb3BwZXI6dC5lbGVtZW50cy5wb3BwZXIscG9wcGVyUmVjdDp0LnJlY3RzLnBvcHBlcixncHVBY2NlbGVyYXRpb246byxpc0ZpeGVkOlwiZml4ZWRcIj09PXQub3B0aW9ucy5zdHJhdGVneX07bnVsbCE9dC5tb2RpZmllcnNEYXRhLnBvcHBlck9mZnNldHMmJih0LnN0eWxlcy5wb3BwZXI9T2JqZWN0LmFzc2lnbih7fSx0LnN0eWxlcy5wb3BwZXIsdGUoT2JqZWN0LmFzc2lnbih7fSxjLHtvZmZzZXRzOnQubW9kaWZpZXJzRGF0YS5wb3BwZXJPZmZzZXRzLHBvc2l0aW9uOnQub3B0aW9ucy5zdHJhdGVneSxhZGFwdGl2ZTphLHJvdW5kT2Zmc2V0czpmfSkpKSksbnVsbCE9dC5tb2RpZmllcnNEYXRhLmFycm93JiYodC5zdHlsZXMuYXJyb3c9T2JqZWN0LmFzc2lnbih7fSx0LnN0eWxlcy5hcnJvdyx0ZShPYmplY3QuYXNzaWduKHt9LGMse29mZnNldHM6dC5tb2RpZmllcnNEYXRhLmFycm93LHBvc2l0aW9uOlwiYWJzb2x1dGVcIixhZGFwdGl2ZTohMSxyb3VuZE9mZnNldHM6Zn0pKSkpLHQuYXR0cmlidXRlcy5wb3BwZXI9T2JqZWN0LmFzc2lnbih7fSx0LmF0dHJpYnV0ZXMucG9wcGVyLHtcImRhdGEtcG9wcGVyLXBsYWNlbWVudFwiOnQucGxhY2VtZW50fSl9LGRhdGE6e319O3ZhciByZT17bmFtZTpcImFwcGx5U3R5bGVzXCIsZW5hYmxlZDohMCxwaGFzZTpcIndyaXRlXCIsZm46ZnVuY3Rpb24oZSl7dmFyIHQ9ZS5zdGF0ZTtPYmplY3Qua2V5cyh0LmVsZW1lbnRzKS5mb3JFYWNoKChmdW5jdGlvbihlKXt2YXIgbj10LnN0eWxlc1tlXXx8e30sbz10LmF0dHJpYnV0ZXNbZV18fHt9LGk9dC5lbGVtZW50c1tlXTtyKGkpJiZwKGkpJiYoT2JqZWN0LmFzc2lnbihpLnN0eWxlLG4pLE9iamVjdC5rZXlzKG8pLmZvckVhY2goKGZ1bmN0aW9uKGUpe3ZhciB0PW9bZV07ITE9PT10P2kucmVtb3ZlQXR0cmlidXRlKGUpOmkuc2V0QXR0cmlidXRlKGUsITA9PT10P1wiXCI6dCl9KSkpfSkpfSxlZmZlY3Q6ZnVuY3Rpb24oZSl7dmFyIHQ9ZS5zdGF0ZSxuPXtwb3BwZXI6e3Bvc2l0aW9uOnQub3B0aW9ucy5zdHJhdGVneSxsZWZ0OlwiMFwiLHRvcDpcIjBcIixtYXJnaW46XCIwXCJ9LGFycm93Ontwb3NpdGlvbjpcImFic29sdXRlXCJ9LHJlZmVyZW5jZTp7fX07cmV0dXJuIE9iamVjdC5hc3NpZ24odC5lbGVtZW50cy5wb3BwZXIuc3R5bGUsbi5wb3BwZXIpLHQuc3R5bGVzPW4sdC5lbGVtZW50cy5hcnJvdyYmT2JqZWN0LmFzc2lnbih0LmVsZW1lbnRzLmFycm93LnN0eWxlLG4uYXJyb3cpLGZ1bmN0aW9uKCl7T2JqZWN0LmtleXModC5lbGVtZW50cykuZm9yRWFjaCgoZnVuY3Rpb24oZSl7dmFyIG89dC5lbGVtZW50c1tlXSxpPXQuYXR0cmlidXRlc1tlXXx8e30sYT1PYmplY3Qua2V5cyh0LnN0eWxlcy5oYXNPd25Qcm9wZXJ0eShlKT90LnN0eWxlc1tlXTpuW2VdKS5yZWR1Y2UoKGZ1bmN0aW9uKGUsdCl7cmV0dXJuIGVbdF09XCJcIixlfSkse30pO3IobykmJnAobykmJihPYmplY3QuYXNzaWduKG8uc3R5bGUsYSksT2JqZWN0LmtleXMoaSkuZm9yRWFjaCgoZnVuY3Rpb24oZSl7by5yZW1vdmVBdHRyaWJ1dGUoZSl9KSkpfSkpfX0scmVxdWlyZXM6W1wiY29tcHV0ZVN0eWxlc1wiXX07dmFyIG9lPXtuYW1lOlwib2Zmc2V0XCIsZW5hYmxlZDohMCxwaGFzZTpcIm1haW5cIixyZXF1aXJlczpbXCJwb3BwZXJPZmZzZXRzXCJdLGZuOmZ1bmN0aW9uKGUpe3ZhciB0PWUuc3RhdGUsbj1lLm9wdGlvbnMscj1lLm5hbWUsbz1uLm9mZnNldCxpPXZvaWQgMD09PW8/WzAsMF06byxhPVQucmVkdWNlKChmdW5jdGlvbihlLG4pe3JldHVybiBlW25dPWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj1DKGUpLG89W0Esal0uaW5kZXhPZihyKT49MD8tMToxLGk9XCJmdW5jdGlvblwiPT10eXBlb2Ygbj9uKE9iamVjdC5hc3NpZ24oe30sdCx7cGxhY2VtZW50OmV9KSk6bixhPWlbMF0scz1pWzFdO3JldHVybiBhPWF8fDAscz0oc3x8MCkqbyxbQSxEXS5pbmRleE9mKHIpPj0wP3t4OnMseTphfTp7eDphLHk6c319KG4sdC5yZWN0cyxpKSxlfSkse30pLHM9YVt0LnBsYWNlbWVudF0sZj1zLngsYz1zLnk7bnVsbCE9dC5tb2RpZmllcnNEYXRhLnBvcHBlck9mZnNldHMmJih0Lm1vZGlmaWVyc0RhdGEucG9wcGVyT2Zmc2V0cy54Kz1mLHQubW9kaWZpZXJzRGF0YS5wb3BwZXJPZmZzZXRzLnkrPWMpLHQubW9kaWZpZXJzRGF0YVtyXT1hfX0saWU9e2xlZnQ6XCJyaWdodFwiLHJpZ2h0OlwibGVmdFwiLGJvdHRvbTpcInRvcFwiLHRvcDpcImJvdHRvbVwifTtmdW5jdGlvbiBhZShlKXtyZXR1cm4gZS5yZXBsYWNlKC9sZWZ0fHJpZ2h0fGJvdHRvbXx0b3AvZywoZnVuY3Rpb24oZSl7cmV0dXJuIGllW2VdfSkpfXZhciBzZT17c3RhcnQ6XCJlbmRcIixlbmQ6XCJzdGFydFwifTtmdW5jdGlvbiBmZShlKXtyZXR1cm4gZS5yZXBsYWNlKC9zdGFydHxlbmQvZywoZnVuY3Rpb24oZSl7cmV0dXJuIHNlW2VdfSkpfWZ1bmN0aW9uIGNlKGUsdCl7dm9pZCAwPT09dCYmKHQ9e30pO3ZhciBuPXQscj1uLnBsYWNlbWVudCxvPW4uYm91bmRhcnksaT1uLnJvb3RCb3VuZGFyeSxhPW4ucGFkZGluZyxzPW4uZmxpcFZhcmlhdGlvbnMsZj1uLmFsbG93ZWRBdXRvUGxhY2VtZW50cyxjPXZvaWQgMD09PWY/VDpmLHA9XyhyKSx1PXA/cz9IOkguZmlsdGVyKChmdW5jdGlvbihlKXtyZXR1cm4gXyhlKT09PXB9KSk6UCxsPXUuZmlsdGVyKChmdW5jdGlvbihlKXtyZXR1cm4gYy5pbmRleE9mKGUpPj0wfSkpOzA9PT1sLmxlbmd0aCYmKGw9dSk7dmFyIGQ9bC5yZWR1Y2UoKGZ1bmN0aW9uKHQsbil7cmV0dXJuIHRbbl09WShlLHtwbGFjZW1lbnQ6bixib3VuZGFyeTpvLHJvb3RCb3VuZGFyeTppLHBhZGRpbmc6YX0pW0MobildLHR9KSx7fSk7cmV0dXJuIE9iamVjdC5rZXlzKGQpLnNvcnQoKGZ1bmN0aW9uKGUsdCl7cmV0dXJuIGRbZV0tZFt0XX0pKX12YXIgcGU9e25hbWU6XCJmbGlwXCIsZW5hYmxlZDohMCxwaGFzZTpcIm1haW5cIixmbjpmdW5jdGlvbihlKXt2YXIgdD1lLnN0YXRlLG49ZS5vcHRpb25zLHI9ZS5uYW1lO2lmKCF0Lm1vZGlmaWVyc0RhdGFbcl0uX3NraXApe2Zvcih2YXIgbz1uLm1haW5BeGlzLGk9dm9pZCAwPT09b3x8byxhPW4uYWx0QXhpcyxzPXZvaWQgMD09PWF8fGEsZj1uLmZhbGxiYWNrUGxhY2VtZW50cyxjPW4ucGFkZGluZyxwPW4uYm91bmRhcnksdT1uLnJvb3RCb3VuZGFyeSxsPW4uYWx0Qm91bmRhcnksZD1uLmZsaXBWYXJpYXRpb25zLGg9dm9pZCAwPT09ZHx8ZCxtPW4uYWxsb3dlZEF1dG9QbGFjZW1lbnRzLHY9dC5vcHRpb25zLnBsYWNlbWVudCxnPUModikseT1mfHwoZz09PXZ8fCFoP1thZSh2KV06ZnVuY3Rpb24oZSl7aWYoQyhlKT09PUwpcmV0dXJuW107dmFyIHQ9YWUoZSk7cmV0dXJuW2ZlKGUpLHQsZmUodCldfSh2KSksYj1bdl0uY29uY2F0KHkpLnJlZHVjZSgoZnVuY3Rpb24oZSxuKXtyZXR1cm4gZS5jb25jYXQoQyhuKT09PUw/Y2UodCx7cGxhY2VtZW50Om4sYm91bmRhcnk6cCxyb290Qm91bmRhcnk6dSxwYWRkaW5nOmMsZmxpcFZhcmlhdGlvbnM6aCxhbGxvd2VkQXV0b1BsYWNlbWVudHM6bX0pOm4pfSksW10pLHg9dC5yZWN0cy5yZWZlcmVuY2Usdz10LnJlY3RzLnBvcHBlcixPPW5ldyBNYXAsUD0hMCxrPWJbMF0sVz0wO1c8Yi5sZW5ndGg7VysrKXt2YXIgQj1iW1ddLEg9QyhCKSxUPV8oQik9PT1NLFI9W2osRV0uaW5kZXhPZihIKT49MCxTPVI/XCJ3aWR0aFwiOlwiaGVpZ2h0XCIscT1ZKHQse3BsYWNlbWVudDpCLGJvdW5kYXJ5OnAscm9vdEJvdW5kYXJ5OnUsYWx0Qm91bmRhcnk6bCxwYWRkaW5nOmN9KSxWPVI/VD9EOkE6VD9FOmo7eFtTXT53W1NdJiYoVj1hZShWKSk7dmFyIE49YWUoViksST1bXTtpZihpJiZJLnB1c2gocVtIXTw9MCkscyYmSS5wdXNoKHFbVl08PTAscVtOXTw9MCksSS5ldmVyeSgoZnVuY3Rpb24oZSl7cmV0dXJuIGV9KSkpe2s9QixQPSExO2JyZWFrfU8uc2V0KEIsSSl9aWYoUClmb3IodmFyIEY9ZnVuY3Rpb24oZSl7dmFyIHQ9Yi5maW5kKChmdW5jdGlvbih0KXt2YXIgbj1PLmdldCh0KTtpZihuKXJldHVybiBuLnNsaWNlKDAsZSkuZXZlcnkoKGZ1bmN0aW9uKGUpe3JldHVybiBlfSkpfSkpO2lmKHQpcmV0dXJuIGs9dCxcImJyZWFrXCJ9LFU9aD8zOjE7VT4wO1UtLSl7aWYoXCJicmVha1wiPT09RihVKSlicmVha310LnBsYWNlbWVudCE9PWsmJih0Lm1vZGlmaWVyc0RhdGFbcl0uX3NraXA9ITAsdC5wbGFjZW1lbnQ9ayx0LnJlc2V0PSEwKX19LHJlcXVpcmVzSWZFeGlzdHM6W1wib2Zmc2V0XCJdLGRhdGE6e19za2lwOiExfX07ZnVuY3Rpb24gdWUoZSx0LG4pe3JldHVybiBpKGUsYSh0LG4pKX12YXIgbGU9e25hbWU6XCJwcmV2ZW50T3ZlcmZsb3dcIixlbmFibGVkOiEwLHBoYXNlOlwibWFpblwiLGZuOmZ1bmN0aW9uKGUpe3ZhciB0PWUuc3RhdGUsbj1lLm9wdGlvbnMscj1lLm5hbWUsbz1uLm1haW5BeGlzLHM9dm9pZCAwPT09b3x8byxmPW4uYWx0QXhpcyxjPXZvaWQgMCE9PWYmJmYscD1uLmJvdW5kYXJ5LHU9bi5yb290Qm91bmRhcnksbD1uLmFsdEJvdW5kYXJ5LGQ9bi5wYWRkaW5nLGg9bi50ZXRoZXIsbT12b2lkIDA9PT1ofHxoLGc9bi50ZXRoZXJPZmZzZXQseT12b2lkIDA9PT1nPzA6ZyxiPVkodCx7Ym91bmRhcnk6cCxyb290Qm91bmRhcnk6dSxwYWRkaW5nOmQsYWx0Qm91bmRhcnk6bH0pLHg9Qyh0LnBsYWNlbWVudCksdz1fKHQucGxhY2VtZW50KSxMPSF3LFA9Rih4KSxrPVwieFwiPT09UD9cInlcIjpcInhcIixXPXQubW9kaWZpZXJzRGF0YS5wb3BwZXJPZmZzZXRzLEI9dC5yZWN0cy5yZWZlcmVuY2UsSD10LnJlY3RzLnBvcHBlcixUPVwiZnVuY3Rpb25cIj09dHlwZW9mIHk/eShPYmplY3QuYXNzaWduKHt9LHQucmVjdHMse3BsYWNlbWVudDp0LnBsYWNlbWVudH0pKTp5LFI9XCJudW1iZXJcIj09dHlwZW9mIFQ/e21haW5BeGlzOlQsYWx0QXhpczpUfTpPYmplY3QuYXNzaWduKHttYWluQXhpczowLGFsdEF4aXM6MH0sVCksUz10Lm1vZGlmaWVyc0RhdGEub2Zmc2V0P3QubW9kaWZpZXJzRGF0YS5vZmZzZXRbdC5wbGFjZW1lbnRdOm51bGwscT17eDowLHk6MH07aWYoVyl7aWYocyl7dmFyIFYsTj1cInlcIj09PVA/ajpBLEk9XCJ5XCI9PT1QP0U6RCxVPVwieVwiPT09UD9cImhlaWdodFwiOlwid2lkdGhcIix6PVdbUF0sWD16K2JbTl0sRz16LWJbSV0sSj1tPy1IW1VdLzI6MCxLPXc9PT1NP0JbVV06SFtVXSxRPXc9PT1NPy1IW1VdOi1CW1VdLFo9dC5lbGVtZW50cy5hcnJvdywkPW0mJlo/dihaKTp7d2lkdGg6MCxoZWlnaHQ6MH0sZWU9dC5tb2RpZmllcnNEYXRhW1wiYXJyb3cjcGVyc2lzdGVudFwiXT90Lm1vZGlmaWVyc0RhdGFbXCJhcnJvdyNwZXJzaXN0ZW50XCJdLnBhZGRpbmc6e3RvcDowLHJpZ2h0OjAsYm90dG9tOjAsbGVmdDowfSx0ZT1lZVtOXSxuZT1lZVtJXSxyZT11ZSgwLEJbVV0sJFtVXSksb2U9TD9CW1VdLzItSi1yZS10ZS1SLm1haW5BeGlzOkstcmUtdGUtUi5tYWluQXhpcyxpZT1MPy1CW1VdLzIrSityZStuZStSLm1haW5BeGlzOlErcmUrbmUrUi5tYWluQXhpcyxhZT10LmVsZW1lbnRzLmFycm93JiZPKHQuZWxlbWVudHMuYXJyb3cpLHNlPWFlP1wieVwiPT09UD9hZS5jbGllbnRUb3B8fDA6YWUuY2xpZW50TGVmdHx8MDowLGZlPW51bGwhPShWPW51bGw9PVM/dm9pZCAwOlNbUF0pP1Y6MCxjZT16K2llLWZlLHBlPXVlKG0/YShYLHorb2UtZmUtc2UpOlgseixtP2koRyxjZSk6Ryk7V1tQXT1wZSxxW1BdPXBlLXp9aWYoYyl7dmFyIGxlLGRlPVwieFwiPT09UD9qOkEsaGU9XCJ4XCI9PT1QP0U6RCxtZT1XW2tdLHZlPVwieVwiPT09az9cImhlaWdodFwiOlwid2lkdGhcIixnZT1tZStiW2RlXSx5ZT1tZS1iW2hlXSxiZT0tMSE9PVtqLEFdLmluZGV4T2YoeCkseGU9bnVsbCE9KGxlPW51bGw9PVM/dm9pZCAwOlNba10pP2xlOjAsd2U9YmU/Z2U6bWUtQlt2ZV0tSFt2ZV0teGUrUi5hbHRBeGlzLE9lPWJlP21lK0JbdmVdK0hbdmVdLXhlLVIuYWx0QXhpczp5ZSxqZT1tJiZiZT9mdW5jdGlvbihlLHQsbil7dmFyIHI9dWUoZSx0LG4pO3JldHVybiByPm4/bjpyfSh3ZSxtZSxPZSk6dWUobT93ZTpnZSxtZSxtP09lOnllKTtXW2tdPWplLHFba109amUtbWV9dC5tb2RpZmllcnNEYXRhW3JdPXF9fSxyZXF1aXJlc0lmRXhpc3RzOltcIm9mZnNldFwiXX07dmFyIGRlPXtuYW1lOlwiYXJyb3dcIixlbmFibGVkOiEwLHBoYXNlOlwibWFpblwiLGZuOmZ1bmN0aW9uKGUpe3ZhciB0LG49ZS5zdGF0ZSxyPWUubmFtZSxvPWUub3B0aW9ucyxpPW4uZWxlbWVudHMuYXJyb3csYT1uLm1vZGlmaWVyc0RhdGEucG9wcGVyT2Zmc2V0cyxzPUMobi5wbGFjZW1lbnQpLGY9RihzKSxjPVtBLERdLmluZGV4T2Yocyk+PTA/XCJoZWlnaHRcIjpcIndpZHRoXCI7aWYoaSYmYSl7dmFyIHA9ZnVuY3Rpb24oZSx0KXtyZXR1cm4geihcIm51bWJlclwiIT10eXBlb2YoZT1cImZ1bmN0aW9uXCI9PXR5cGVvZiBlP2UoT2JqZWN0LmFzc2lnbih7fSx0LnJlY3RzLHtwbGFjZW1lbnQ6dC5wbGFjZW1lbnR9KSk6ZSk/ZTpYKGUsUCkpfShvLnBhZGRpbmcsbiksdT12KGkpLGw9XCJ5XCI9PT1mP2o6QSxkPVwieVwiPT09Zj9FOkQsaD1uLnJlY3RzLnJlZmVyZW5jZVtjXStuLnJlY3RzLnJlZmVyZW5jZVtmXS1hW2ZdLW4ucmVjdHMucG9wcGVyW2NdLG09YVtmXS1uLnJlY3RzLnJlZmVyZW5jZVtmXSxnPU8oaSkseT1nP1wieVwiPT09Zj9nLmNsaWVudEhlaWdodHx8MDpnLmNsaWVudFdpZHRofHwwOjAsYj1oLzItbS8yLHg9cFtsXSx3PXktdVtjXS1wW2RdLEw9eS8yLXVbY10vMitiLE09dWUoeCxMLHcpLGs9ZjtuLm1vZGlmaWVyc0RhdGFbcl09KCh0PXt9KVtrXT1NLHQuY2VudGVyT2Zmc2V0PU0tTCx0KX19LGVmZmVjdDpmdW5jdGlvbihlKXt2YXIgdD1lLnN0YXRlLG49ZS5vcHRpb25zLmVsZW1lbnQscj12b2lkIDA9PT1uP1wiW2RhdGEtcG9wcGVyLWFycm93XVwiOm47bnVsbCE9ciYmKFwic3RyaW5nXCIhPXR5cGVvZiByfHwocj10LmVsZW1lbnRzLnBvcHBlci5xdWVyeVNlbGVjdG9yKHIpKSkmJnEodC5lbGVtZW50cy5wb3BwZXIscikmJih0LmVsZW1lbnRzLmFycm93PXIpfSxyZXF1aXJlczpbXCJwb3BwZXJPZmZzZXRzXCJdLHJlcXVpcmVzSWZFeGlzdHM6W1wicHJldmVudE92ZXJmbG93XCJdfTtmdW5jdGlvbiBoZShlLHQsbil7cmV0dXJuIHZvaWQgMD09PW4mJihuPXt4OjAseTowfSkse3RvcDplLnRvcC10LmhlaWdodC1uLnkscmlnaHQ6ZS5yaWdodC10LndpZHRoK24ueCxib3R0b206ZS5ib3R0b20tdC5oZWlnaHQrbi55LGxlZnQ6ZS5sZWZ0LXQud2lkdGgtbi54fX1mdW5jdGlvbiBtZShlKXtyZXR1cm5baixELEUsQV0uc29tZSgoZnVuY3Rpb24odCl7cmV0dXJuIGVbdF0+PTB9KSl9dmFyIHZlPXtuYW1lOlwiaGlkZVwiLGVuYWJsZWQ6ITAscGhhc2U6XCJtYWluXCIscmVxdWlyZXNJZkV4aXN0czpbXCJwcmV2ZW50T3ZlcmZsb3dcIl0sZm46ZnVuY3Rpb24oZSl7dmFyIHQ9ZS5zdGF0ZSxuPWUubmFtZSxyPXQucmVjdHMucmVmZXJlbmNlLG89dC5yZWN0cy5wb3BwZXIsaT10Lm1vZGlmaWVyc0RhdGEucHJldmVudE92ZXJmbG93LGE9WSh0LHtlbGVtZW50Q29udGV4dDpcInJlZmVyZW5jZVwifSkscz1ZKHQse2FsdEJvdW5kYXJ5OiEwfSksZj1oZShhLHIpLGM9aGUocyxvLGkpLHA9bWUoZiksdT1tZShjKTt0Lm1vZGlmaWVyc0RhdGFbbl09e3JlZmVyZW5jZUNsaXBwaW5nT2Zmc2V0czpmLHBvcHBlckVzY2FwZU9mZnNldHM6Yyxpc1JlZmVyZW5jZUhpZGRlbjpwLGhhc1BvcHBlckVzY2FwZWQ6dX0sdC5hdHRyaWJ1dGVzLnBvcHBlcj1PYmplY3QuYXNzaWduKHt9LHQuYXR0cmlidXRlcy5wb3BwZXIse1wiZGF0YS1wb3BwZXItcmVmZXJlbmNlLWhpZGRlblwiOnAsXCJkYXRhLXBvcHBlci1lc2NhcGVkXCI6dX0pfX0sZ2U9Syh7ZGVmYXVsdE1vZGlmaWVyczpbWiwkLG5lLHJlXX0pLHllPVtaLCQsbmUscmUsb2UscGUsbGUsZGUsdmVdLGJlPUsoe2RlZmF1bHRNb2RpZmllcnM6eWV9KTtlLmFwcGx5U3R5bGVzPXJlLGUuYXJyb3c9ZGUsZS5jb21wdXRlU3R5bGVzPW5lLGUuY3JlYXRlUG9wcGVyPWJlLGUuY3JlYXRlUG9wcGVyTGl0ZT1nZSxlLmRlZmF1bHRNb2RpZmllcnM9eWUsZS5kZXRlY3RPdmVyZmxvdz1ZLGUuZXZlbnRMaXN0ZW5lcnM9WixlLmZsaXA9cGUsZS5oaWRlPXZlLGUub2Zmc2V0PW9lLGUucG9wcGVyR2VuZXJhdG9yPUssZS5wb3BwZXJPZmZzZXRzPSQsZS5wcmV2ZW50T3ZlcmZsb3c9bGUsT2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSl9KSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1wb3BwZXIubWluLmpzLm1hcFxuIiwiLyoqXG4gKiBGb3JtYXQgYnl0ZXMgYXMgaHVtYW4tcmVhZGFibGUgdGV4dC5cbiAqXG4gKiBAcGFyYW0gYnl0ZXMgTnVtYmVyIG9mIGJ5dGVzLlxuICogQHBhcmFtIHNpIFRydWUgdG8gdXNlIG1ldHJpYyAoU0kpIHVuaXRzLCBha2EgcG93ZXJzIG9mIDEwMDAuIEZhbHNlIHRvIHVzZVxuICogICAgICAgICAgIGJpbmFyeSAoSUVDKSwgYWthIHBvd2VycyBvZiAxMDI0LlxuICogQHBhcmFtIGRwIE51bWJlciBvZiBkZWNpbWFsIHBsYWNlcyB0byBkaXNwbGF5LlxuICpcbiAqIEByZXR1cm4gRm9ybWF0dGVkIHN0cmluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGh1bWFuRnJpZW5kbHlCeXRlcyhieXRlczogbnVtYmVyLCBzaSA9IGZhbHNlLCBkcCA9IDEpIHtcbiAgY29uc3QgdGhyZXNoID0gc2kgPyAxMDAwIDogMTAyNDtcblxuICBpZiAoTWF0aC5hYnMoYnl0ZXMpIDwgdGhyZXNoKSB7XG4gICAgcmV0dXJuIGJ5dGVzICsgXCIgQlwiO1xuICB9XG5cbiAgY29uc3QgdW5pdHMgPSBzaVxuICAgID8gW1wia0JcIiwgXCJNQlwiLCBcIkdCXCIsIFwiVEJcIiwgXCJQQlwiLCBcIkVCXCIsIFwiWkJcIiwgXCJZQlwiXVxuICAgIDogW1wiS2lCXCIsIFwiTWlCXCIsIFwiR2lCXCIsIFwiVGlCXCIsIFwiUGlCXCIsIFwiRWlCXCIsIFwiWmlCXCIsIFwiWWlCXCJdO1xuICBsZXQgdSA9IC0xO1xuICBjb25zdCByID0gMTAgKiogZHA7XG5cbiAgZG8ge1xuICAgIGJ5dGVzIC89IHRocmVzaDtcbiAgICArK3U7XG4gIH0gd2hpbGUgKFxuICAgIE1hdGgucm91bmQoTWF0aC5hYnMoYnl0ZXMpICogcikgLyByID49IHRocmVzaCAmJiB1IDwgdW5pdHMubGVuZ3RoIC0gMVxuICApO1xuXG4gIHJldHVybiBieXRlcy50b0ZpeGVkKGRwKSArIFwiIFwiICsgdW5pdHNbdV07XG59XG5cbi8qKlxuICogUmVwbGFjZSBhbGwgc3BlY2lhbCBjaGFyYWN0ZXJzIChub24tbGV0dGVycy9udW1iZXJzKSB3aXRoIHNwYWNlIGFuZFxuICogY2FwaXRhbGl6ZSB0aGUgZmlyc3QgY2hhcmFjdGVyIG9mIGVhY2ggd29yZC5cbiAqIEBwYXJhbSB0ZXh0IHN0cmluZyB3aXRoIHNwZWNpYWwgY2hhcmFjdGVycyAobGlrZSBhIGZpbGVuYW1lIG9yIHNsdWcpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBodW1hbkZyaWVuZGx5UGhyYXNlKHRleHQ6IHN0cmluZykge1xuICAvLyBmaXJzdCByZXBsYWNlIGFsbCBzcGVjaWFsIGNoYXJhY3RlcnMgd2l0aCBzcGFjZSB0aGVuIHJlbW92ZSBtdWx0aXBsZSBzcGFjZXNcbiAgcmV0dXJuIHRleHQucmVwbGFjZSgvW15hLXpBLVowLTkgXS9nLCBcIiBcIikucmVwbGFjZSgvXFxzXFxzKy9nLCBcIiBcIikucmVwbGFjZShcbiAgICAvLyBeXFx3ezF9IG1hdGNoZXMgdGhlIGZpcnN0IGxldHRlciBvZiB0aGUgd29yZC5cbiAgICAvLyAgIF4gbWF0Y2hlcyB0aGUgYmVnaW5uaW5nIG9mIHRoZSBzdHJpbmcuXG4gICAgLy8gICBcXHcgbWF0Y2hlcyBhbnkgd29yZCBjaGFyYWN0ZXIuXG4gICAgLy8gICB7MX0gdGFrZXMgb25seSB0aGUgZmlyc3QgY2hhcmFjdGVyLlxuICAgIC8vIHwgd29ya3MgbGlrZSB0aGUgYm9vbGVhbiBPUi4gSXQgbWF0Y2hlcyB0aGUgZXhwcmVzc2lvbiBhZnRlciBhbmQgYmVmb3JlIHRoZSB8LlxuICAgIC8vIFxccysgbWF0Y2hlcyBhbnkgYW1vdW50IG9mIHdoaXRlc3BhY2UgYmV0d2VlbiB0aGUgd29yZHMuXG4gICAgLyheXFx3ezF9KXwoXFxzK1xcd3sxfSkvZyxcbiAgICAobGV0dGVyKSA9PiBsZXR0ZXIudG9VcHBlckNhc2UoKSxcbiAgKTtcbn1cblxuLyoqXG4gKiBodW1hblBhdGggc2hvcnRlbnMgYSBwb3RlbnRpYWxseSBsb25nIHNsYXNoLWRlbGltaXRlZCBwYXRoIGludG8gYSBzaG9ydCBvbmVcbiAqIGJ5IGtlZXBpbmcgYXMgbXVjaCBvZiB0aGUgc3RhcnRpbmcgYW5kIGVuZGluZyBwYXRocyAod2hpY2ggYXJlIGltcG9ydGFudFxuICogZm9yIGh1bWFucykuXG4gKiBAcGFyYW0gb3JpZ2luYWwgdGhlIHRleHQgd2Ugd2FudCB0byBodW1hbml6ZVxuICogQHBhcmFtIG1heExlbmd0aCB0aGUgbnVtYmVyIG9mIGNoYXJhY3RlcnMgdG8ga2VlcCBhdCBzdGFydCArIGVuZFxuICogQHBhcmFtIGZvcm1hdEJhc2VuYW1lIGFuIG9wdGlvbmFsIGZ1bmN0aW9uIHdoaWNoIHNob3VsZCBiZSBjYWxsZWQgdG8gZm9ybWF0IHRoZSBiYXNlbmFtZVxuICogQHJldHVybnMgdGhlIHN0cmluZyBzaG9ydGVuZWQgdG8gbWF4TGVuZ3RoIGFuZCBmb3JtYXR0ZWQgd2l0aFxuICovXG5leHBvcnQgY29uc3QgaHVtYW5QYXRoID0gKFxuICBvcmlnaW5hbDogc3RyaW5nLFxuICBtYXhMZW5ndGggPSA1MCxcbiAgZm9ybWF0QmFzZW5hbWU/OiAoYmFzZW5hbWU6IHN0cmluZykgPT4gc3RyaW5nLFxuKSA9PiB7XG4gIGNvbnN0IHRva2VucyA9IG9yaWdpbmFsLnNwbGl0KFwiL1wiKTtcbiAgY29uc3QgYmFzZW5hbWUgPSB0b2tlbnNbdG9rZW5zLmxlbmd0aCAtIDFdO1xuXG4gIC8vcmVtb3ZlIGZpcnN0IGFuZCBsYXN0IGVsZW1lbnRzIGZyb20gdGhlIGFycmF5XG4gIHRva2Vucy5zcGxpY2UoMCwgMSk7XG4gIHRva2Vucy5zcGxpY2UodG9rZW5zLmxlbmd0aCAtIDEsIDEpO1xuXG4gIGlmIChvcmlnaW5hbC5sZW5ndGggPCBtYXhMZW5ndGgpIHtcbiAgICByZXR1cm4gKHRva2Vucy5sZW5ndGggPiAwID8gKHRva2Vucy5qb2luKFwiL1wiKSArIFwiL1wiKSA6IFwiXCIpICtcbiAgICAgIChmb3JtYXRCYXNlbmFtZSA/IGZvcm1hdEJhc2VuYW1lKGJhc2VuYW1lKSA6IGJhc2VuYW1lKTtcbiAgfVxuXG4gIC8vcmVtb3ZlIHRoZSBjdXJyZW50IGxlbnRoIGFuZCBhbHNvIHNwYWNlIGZvciAzIGRvdHMgYW5kIHNsYXNoXG4gIGNvbnN0IHJlbUxlbiA9IG1heExlbmd0aCAtIGJhc2VuYW1lLmxlbmd0aCAtIDQ7XG4gIGlmIChyZW1MZW4gPiAwKSB7XG4gICAgLy9yZWNyZWF0ZSBvdXIgcGF0aFxuICAgIGNvbnN0IHBhdGggPSB0b2tlbnMuam9pbihcIi9cIik7XG4gICAgLy9oYW5kbGUgdGhlIGNhc2Ugb2YgYW4gb2RkIGxlbmd0aFxuICAgIGNvbnN0IGxlbkEgPSBNYXRoLmNlaWwocmVtTGVuIC8gMik7XG4gICAgY29uc3QgbGVuQiA9IE1hdGguZmxvb3IocmVtTGVuIC8gMik7XG4gICAgLy9yZWJ1aWxkIHRoZSBwYXRoIGZyb20gYmVnaW5uaW5nIGFuZCBlbmRcbiAgICBjb25zdCBwYXRoQSA9IHBhdGguc3Vic3RyaW5nKDAsIGxlbkEpO1xuICAgIGNvbnN0IHBhdGhCID0gcGF0aC5zdWJzdHJpbmcocGF0aC5sZW5ndGggLSBsZW5CKTtcbiAgICByZXR1cm4gcGF0aEEgKyBcIi4uLlwiICsgcGF0aEIgKyBcIi9cIiArXG4gICAgICAoZm9ybWF0QmFzZW5hbWUgPyBmb3JtYXRCYXNlbmFtZShiYXNlbmFtZSkgOiBiYXNlbmFtZSk7XG4gIH1cbiAgcmV0dXJuIChmb3JtYXRCYXNlbmFtZSA/IGZvcm1hdEJhc2VuYW1lKGJhc2VuYW1lKSA6IGJhc2VuYW1lKTtcbn07XG4iLCJleHBvcnQgZnVuY3Rpb24gbWluV2hpdGVzcGFjZUluZGVudCh0ZXh0OiBzdHJpbmcpOiBudW1iZXIge1xuICBjb25zdCBtYXRjaCA9IHRleHQubWF0Y2goL15bIFxcdF0qKD89XFxTKS9nbSk7XG4gIHJldHVybiBtYXRjaCA/IG1hdGNoLnJlZHVjZSgociwgYSkgPT4gTWF0aC5taW4ociwgYS5sZW5ndGgpLCBJbmZpbml0eSkgOiAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5pbmRlbnRXaGl0ZXNwYWNlKFxuICB0ZXh0OiBzdHJpbmcsXG4gIHJlbW92ZUluaXRpYWxOZXdMaW5lID0gdHJ1ZSxcbik6IHN0cmluZyB7XG4gIGNvbnN0IGluZGVudCA9IG1pbldoaXRlc3BhY2VJbmRlbnQodGV4dCk7XG4gIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChgXlsgXFxcXHRdeyR7aW5kZW50fX1gLCBcImdtXCIpO1xuICBjb25zdCByZXN1bHQgPSB0ZXh0LnJlcGxhY2UocmVnZXgsIFwiXCIpO1xuICByZXR1cm4gcmVtb3ZlSW5pdGlhbE5ld0xpbmUgPyByZXN1bHQucmVwbGFjZSgvXlxcbi8sIFwiXCIpIDogcmVzdWx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2luZ2xlTGluZVRyaW0odGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRleHQucmVwbGFjZSgvKFxcclxcbnxcXG58XFxyKS9nbSwgXCJcIilcbiAgICAucmVwbGFjZSgvXFxzKyg/PSg/OlteXFwnXCJdKltcXCdcIl1bXlxcJ1wiXSpbXFwnXCJdKSpbXlxcJ1wiXSokKS9nLCBcIiBcIilcbiAgICAudHJpbSgpO1xufVxuXG5leHBvcnQgdHlwZSBUZW1wbGF0ZUxpdGVyYWxJbmRleGVkVGV4dFN1cHBsaWVyID0gKGluZGV4OiBudW1iZXIpID0+IHN0cmluZztcblxuLyoqXG4gKiBTdHJpbmcgdGVtcGxhdGUgbGl0ZXJhbCB0YWcgdXRpbGl0eSB0aGF0IHdyYXBzIHRoZSBsaXRlcmFscyBhbmQgd2lsbFxuICogcmV0cmlldmUgbGl0ZXJhbHMgd2l0aCBzZW5zaXRpdml0eSB0byBpbmRlbnRlZCB3aGl0ZXNwYWNlLiBJZlxuICogQHBhcmFtIGxpdGVyYWxzIGxpdGVyYWxzIHN1cHBsaWVkIHRvIHRlbXBsYXRlIGxpdGVyYWwgc3RyaW5nIGZ1bmN0aW9uXG4gKiBAcGFyYW0gc3VwcGxpZWRFeHBycyBleHByZXNzaW9ucyBzdXBwbGllZCB0byB0ZW1wbGF0ZSBsaXRlcmFsIHN0cmluZyBmdW5jdGlvblxuICogQHBhcmFtIG9wdGlvbnMgd2hpdGVzcGFjZSBzZW5zaXRpdml0eSBvcHRpb25zXG4gKiBAcmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCB3cmFwIHRoZSBsaXRlcmFsIGFuZCByZXR1cm4gdW5pbmRlbnRlZCB0ZXh0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aGl0ZXNwYWNlU2Vuc2l0aXZlVGVtcGxhdGVMaXRlcmFsU3VwcGxpZXIoXG4gIGxpdGVyYWxzOiBUZW1wbGF0ZVN0cmluZ3NBcnJheSxcbiAgc3VwcGxpZWRFeHByczogdW5rbm93bltdLFxuICBvcHRpb25zPzoge1xuICAgIHJlYWRvbmx5IHVuaW5kZW50PzogYm9vbGVhbiB8IFJlZ0V4cDtcbiAgICByZWFkb25seSByZW1vdmVJbml0aWFsTmV3TGluZT86IGJvb2xlYW47XG4gIH0sXG4pOiBUZW1wbGF0ZUxpdGVyYWxJbmRleGVkVGV4dFN1cHBsaWVyIHtcbiAgY29uc3QgeyB1bmluZGVudCA9IHRydWUsIHJlbW92ZUluaXRpYWxOZXdMaW5lID0gdHJ1ZSB9ID0gb3B0aW9ucyA/PyB7fTtcbiAgbGV0IGxpdGVyYWxTdXBwbGllciA9IChpbmRleDogbnVtYmVyKSA9PiBsaXRlcmFsc1tpbmRleF07XG4gIGlmICh1bmluZGVudCkge1xuICAgIGlmICh0eXBlb2YgdW5pbmRlbnQgPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAvLyB3ZSB3YW50IHRvIGF1dG8tZGV0ZWN0IGFuZCBidWlsZCBvdXIgcmVnRXhwIGZvciB1bmluZGVudGluZyBzbyBsZXQnc1xuICAgICAgLy8gYnVpbGQgYSBzYW1wbGUgb2Ygd2hhdCB0aGUgb3JpZ2luYWwgdGV4dCBtaWdodCBsb29rIGxpa2Ugc28gd2UgY2FuXG4gICAgICAvLyBjb21wdXRlIHRoZSBcIm1pbmltdW1cIiB3aGl0ZXNwYWNlIGluZGVudFxuICAgICAgbGV0IG9yaWdpbmFsVGV4dCA9IFwiXCI7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN1cHBsaWVkRXhwcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgb3JpZ2luYWxUZXh0ICs9IGxpdGVyYWxzW2ldICsgYFxcJHtleHByJHtpfX1gO1xuICAgICAgfVxuICAgICAgb3JpZ2luYWxUZXh0ICs9IGxpdGVyYWxzW2xpdGVyYWxzLmxlbmd0aCAtIDFdO1xuICAgICAgY29uc3QgbWF0Y2ggPSBvcmlnaW5hbFRleHQubWF0Y2goL15bIFxcdF0qKD89XFxTKS9nbSk7XG4gICAgICBjb25zdCBtaW5XaGl0ZXNwYWNlSW5kZW50ID0gbWF0Y2hcbiAgICAgICAgPyBtYXRjaC5yZWR1Y2UoKHIsIGEpID0+IE1hdGgubWluKHIsIGEubGVuZ3RoKSwgSW5maW5pdHkpXG4gICAgICAgIDogMDtcbiAgICAgIGlmIChtaW5XaGl0ZXNwYWNlSW5kZW50ID4gMCkge1xuICAgICAgICBjb25zdCB1bmluZGVudFJlZ0V4cCA9IG5ldyBSZWdFeHAoXG4gICAgICAgICAgYF5bIFxcXFx0XXske21pbldoaXRlc3BhY2VJbmRlbnR9fWAsXG4gICAgICAgICAgXCJnbVwiLFxuICAgICAgICApO1xuICAgICAgICBsaXRlcmFsU3VwcGxpZXIgPSAoaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgIGxldCB0ZXh0ID0gbGl0ZXJhbHNbaW5kZXhdO1xuICAgICAgICAgIGlmIChpbmRleCA9PSAwICYmIHJlbW92ZUluaXRpYWxOZXdMaW5lKSB7XG4gICAgICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eXFxuLywgXCJcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0ZXh0LnJlcGxhY2UodW5pbmRlbnRSZWdFeHAhLCBcIlwiKTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbGl0ZXJhbFN1cHBsaWVyID0gKGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgbGV0IHRleHQgPSBsaXRlcmFsc1tpbmRleF07XG4gICAgICAgIGlmIChpbmRleCA9PSAwICYmIHJlbW92ZUluaXRpYWxOZXdMaW5lKSB7XG4gICAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZSgvXlxcbi8sIFwiXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0ZXh0LnJlcGxhY2UodW5pbmRlbnQsIFwiXCIpO1xuICAgICAgfTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGxpdGVyYWxTdXBwbGllcjtcbn1cbiIsImV4cG9ydCBmdW5jdGlvbiBtYXJrZG93bkl0VHJhbnNmb3JtZXIoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZGVwZW5kZW5jaWVzOiB1bmRlZmluZWQsXG4gICAgICAgIGFjcXVpcmVEZXBlbmRlbmNpZXM6IGFzeW5jICh0cmFuc2Zvcm1lcikgPT4ge1xuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBtYXJrZG93bkl0IH0gPSBhd2FpdCBpbXBvcnQoXCJodHRwczovL2pzcG0uZGV2L21hcmtkb3duLWl0QDEyLjIuMFwiKTtcbiAgICAgICAgICAgIHJldHVybiB7IG1hcmtkb3duSXQsIHBsdWdpbnM6IGF3YWl0IHRyYW5zZm9ybWVyLnBsdWdpbnMoKSB9O1xuICAgICAgICB9LFxuICAgICAgICBjb25zdHJ1Y3Q6IGFzeW5jICh0cmFuc2Zvcm1lcikgPT4ge1xuICAgICAgICAgICAgaWYgKCF0cmFuc2Zvcm1lci5kZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm1lci5kZXBlbmRlbmNpZXMgPSBhd2FpdCB0cmFuc2Zvcm1lci5hY3F1aXJlRGVwZW5kZW5jaWVzKHRyYW5zZm9ybWVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG1hcmtkb3duSXQgPSB0cmFuc2Zvcm1lci5kZXBlbmRlbmNpZXMubWFya2Rvd25JdCh7XG4gICAgICAgICAgICAgICAgaHRtbDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBsaW5raWZ5OiB0cnVlLFxuICAgICAgICAgICAgICAgIHR5cG9ncmFwaGVyOiB0cnVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0cmFuc2Zvcm1lci5jdXN0b21pemUobWFya2Rvd25JdCwgdHJhbnNmb3JtZXIpO1xuICAgICAgICAgICAgcmV0dXJuIG1hcmtkb3duSXQ7IC8vIGZvciBjaGFpbmluZ1xuICAgICAgICB9LFxuICAgICAgICBjdXN0b21pemU6IChtYXJrZG93bkl0LCB0cmFuc2Zvcm1lcikgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGx1Z2lucyA9IHRyYW5zZm9ybWVyLmRlcGVuZGVuY2llcy5wbHVnaW5zO1xuICAgICAgICAgICAgbWFya2Rvd25JdC51c2UocGx1Z2lucy5mb290bm90ZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJhbnNmb3JtZXI7IC8vIGZvciBjaGFpbmluZ1xuICAgICAgICB9LFxuICAgICAgICB1bmluZGVudFdoaXRlc3BhY2U6ICh0ZXh0LCByZW1vdmVJbml0aWFsTmV3TGluZSA9IHRydWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHdoaXRlc3BhY2UgPSB0ZXh0Lm1hdGNoKC9eWyBcXHRdKig/PVxcUykvZ20pO1xuICAgICAgICAgICAgY29uc3QgaW5kZW50Q291bnQgPSB3aGl0ZXNwYWNlID8gd2hpdGVzcGFjZS5yZWR1Y2UoKHIsIGEpID0+IE1hdGgubWluKHIsIGEubGVuZ3RoKSwgSW5maW5pdHkpIDogMDtcbiAgICAgICAgICAgIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChgXlsgXFxcXHRdeyR7aW5kZW50Q291bnR9fWAsIFwiZ21cIik7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB0ZXh0LnJlcGxhY2UocmVnZXgsIFwiXCIpO1xuICAgICAgICAgICAgcmV0dXJuIHJlbW92ZUluaXRpYWxOZXdMaW5lID8gcmVzdWx0LnJlcGxhY2UoL15cXG4vLCBcIlwiKSA6IHJlc3VsdDtcbiAgICAgICAgfSxcbiAgICAgICAgcGx1Z2luczogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBmb290bm90ZSB9ID0gYXdhaXQgaW1wb3J0KFwiaHR0cHM6Ly9qc3BtLmRldi9tYXJrZG93bi1pdC1mb290bm90ZUAzLjAuM1wiKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZm9vdG5vdGUsXG4gICAgICAgICAgICAgICAgYWRqdXN0SGVhZGluZ0xldmVsOiAobWQsIG9wdGlvbnMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gZ2V0SGVhZGluZ0xldmVsKHRhZ05hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YWdOYW1lWzBdLnRvTG93ZXJDYXNlKCkgPT09ICdoJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ05hbWUgPSB0YWdOYW1lLnNsaWNlKDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQodGFnTmFtZSwgMTApO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlyc3RMZXZlbCA9IG9wdGlvbnMuZmlyc3RMZXZlbDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGZpcnN0TGV2ZWwgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJzdExldmVsID0gZ2V0SGVhZGluZ0xldmVsKGZpcnN0TGV2ZWwpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmaXJzdExldmVsIHx8IGlzTmFOKGZpcnN0TGV2ZWwpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBsZXZlbE9mZnNldCA9IGZpcnN0TGV2ZWwgLSAxO1xuICAgICAgICAgICAgICAgICAgICBpZiAobGV2ZWxPZmZzZXQgPCAxIHx8IGxldmVsT2Zmc2V0ID4gNikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbWQuY29yZS5ydWxlci5wdXNoKFwiYWRqdXN0LWhlYWRpbmctbGV2ZWxzXCIsIGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdG9rZW5zID0gc3RhdGUudG9rZW5zXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0b2tlbnNbaV0udHlwZSAhPT0gXCJoZWFkaW5nX2Nsb3NlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBoZWFkaW5nT3BlbiA9IHRva2Vuc1tpIC0gMl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdmFyIGhlYWRpbmdfY29udGVudCA9IHRva2Vuc1tpIC0gMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaGVhZGluZ0Nsb3NlID0gdG9rZW5zW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2UgY291bGQgZ28gZGVlcGVyIHdpdGggPGRpdiByb2xlPVwiaGVhZGluZ1wiIGFyaWEtbGV2ZWw9XCI3XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2VlIGh0dHA6Ly93M2MuZ2l0aHViLmlvL2FyaWEvYXJpYS9hcmlhLmh0bWwjYXJpYS1sZXZlbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGJ1dCBjbGFtcGluZyB0byBhIGRlcHRoIG9mIDYgc2hvdWxkIHN1ZmZpY2UgZm9yIG5vd1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRMZXZlbCA9IGdldEhlYWRpbmdMZXZlbChoZWFkaW5nT3Blbi50YWcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhZ05hbWUgPSAnaCcgKyBNYXRoLm1pbihjdXJyZW50TGV2ZWwgKyBsZXZlbE9mZnNldCwgNik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWFkaW5nT3Blbi50YWcgPSB0YWdOYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRpbmdDbG9zZS50YWcgPSB0YWdOYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH07XG59XG5cbi8qKlxuICogR2l2ZW4gYSBzZXQgb2YgbWFya2Rvd24gdGV4dCBhY3F1aXNpdGlvbiBhbmQgcmVuZGVyaW5nIHN0cmF0ZWdpZXMgYXMgYXN5bmNcbiAqIGdlbmVyYXRvcnMsIHRyYW5zZm9ybSBtYXJrZG93biB0ZXh0IGludG8gSFRNTCBhbmQgY2FsbCBoYW5kbGVycy5cbiAqIEBwYXJhbSB7e21hcmtkb3duVGV4dDogKG1kaXQpID0+IHN0cmluZywgcmVuZGVySFRNTDogKGh0bWwsIG1kaXQpID0+IHZvaWR9fSBzdHJhdGVnaWVzXG4gKiBAcGFyYW0geyp9IG9wdGlvbnMgcmVzdWx0IG9mIHRyYW5zZm9ybU1hcmtkb3duSXRPcHRpb25zXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXJNYXJrZG93bihzdHJhdGVnaWVzLCBtZGl0dCA9IG1hcmtkb3duSXRUcmFuc2Zvcm1lcigpKSB7XG4gICAgY29uc3QgbWFya2Rvd25JdCA9IGF3YWl0IG1kaXR0LmNvbnN0cnVjdChtZGl0dCk7XG4gICAgZm9yIGF3YWl0IChjb25zdCBzdHJhdGVneSBvZiBzdHJhdGVnaWVzKG1kaXR0KSkge1xuICAgICAgICAvLyB3ZSB1c2UgYXdhaXQgb24gbWFya2Rvd25UZXh0KCkgc2luY2UgaXQgY291bGQgYmUgZmV0Y2hlZCBvciBub3RcbiAgICAgICAgLy8gaW1tZWRpYXRlbHkgYXZhaWxhYmxlXG4gICAgICAgIGNvbnN0IG1hcmtkb3duID0gbWRpdHQudW5pbmRlbnRXaGl0ZXNwYWNlKGF3YWl0IHN0cmF0ZWd5Lm1hcmtkb3duVGV4dChtZGl0dCkpO1xuXG4gICAgICAgIC8vIHJlbmRlckhUTUwgbWF5IGJlIGFzeW5jLCBidXQgd2UgZG9uJ3QgbmVlZCB0byBhd2FpdCBpdCBzaW5jZSB3ZSBkb1xuICAgICAgICAvLyBub3QgY2FyZSBhYm91dCB0aGUgcmVzdWx0XG4gICAgICAgIHN0cmF0ZWd5LnJlbmRlckhUTUwobWFya2Rvd25JdC5yZW5kZXIobWFya2Rvd24pLCBtZGl0dCk7XG4gICAgfVxufVxuXG4vKipcbiAqIGltcG9ydE1hcmtkb3duQ29udGVudCBmZXRjaGVzIG1hcmtkb3duIGZyb20gYSBzb3VyY2UsIGFuZFxuICogQHBhcmFtIHtzdHJpbmcgfCBVUkwgfCBSZXF1ZXN0fSBpbnB1dCBVUkwgdG8gYWNxdWlyZSBIVE1MIGZyb21cbiAqIEBwYXJhbSB7KGZvcmVpZ25Eb2MpID0+IFtdfSBzZWxlY3QgdXNlIHRoZSBwYXJzZWQgSFRNTCBmb3JlaWduRG9jIHRvIHNlbGVjdCB3aGljaCBub2RlcyB5b3Ugd2FudCB0byBhY3F1aXJlXG4gKiBAcGFyYW0geyhpbXBvcnRlZE5vZGUsIGlucHV0LCBodG1sKSA9PiB2b2lkfSBpbmplY3QgdGhlIGdpdmVuLCBhbHJlYWR5IGRvY3VtZW50LWFkb3B0ZWQgbm9kZSBhbnl3aGVyZSB5b3UnZCBsaWtlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbXBvcnRNYXJrZG93bkNvbnRlbnQoaW5wdXQsIHNlbGVjdCwgaW5qZWN0KSB7XG4gICAgZmV0Y2goaW5wdXQpLnRoZW4ocmVzcCA9PiB7XG4gICAgICAgIHJlc3AudGV4dCgpLnRoZW4oaHRtbCA9PiB7XG4gICAgICAgICAgICBjb25zdCBwYXJzZXIgPSBuZXcgRE9NUGFyc2VyKCk7XG4gICAgICAgICAgICBjb25zdCBmb3JlaWduRG9jID0gcGFyc2VyLnBhcnNlRnJvbVN0cmluZyhodG1sLCBcInRleHQvaHRtbFwiKTtcbiAgICAgICAgICAgIGNvbnN0IHNlbGVjdGVkID0gc2VsZWN0KGZvcmVpZ25Eb2MpO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2VsZWN0ZWQpKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBzIG9mIHNlbGVjdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGltcG9ydGVkTm9kZSA9IGRvY3VtZW50LmFkb3B0Tm9kZShzKTtcbiAgICAgICAgICAgICAgICAgICAgaW5qZWN0KGltcG9ydGVkTm9kZSwgaW5wdXQsIGh0bWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbXBvcnRlZE5vZGUgPSBkb2N1bWVudC5hZG9wdE5vZGUoc2VsZWN0ZWQpO1xuICAgICAgICAgICAgICAgIGluamVjdChpbXBvcnRlZE5vZGUsIGlucHV0LCBodG1sKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbi8qKlxuICogR2l2ZW4gYSBsaXN0IG9mIHttYXJrZG93blRleHQsIHJlbmRlckhUTUx9W10gZnVuY3Rpb25zIGluIHNyY0VsZW1lbnRzIGFycmF5LCB0cmFuc2Zvcm0gbWFya2Rvd24gdGV4dCBpbnRvIEhUTUxcbiAqIGFuZCByZXBsYWNlIHRob3NlIGVsZW1lbnRzIHdpdGggYSBuZXcgPGRpdj4uIEZvciBlYWNoIGVsZW1lbnQsIGFsbG93XG4gKiBmaW5hbGl6YXRpb24gdG8gYmUgY2FsbGVkIGluIGNhc2UgdGhlIG5ldyBlbGVtZW50cyBzaG91bGQgdHJpZ2dlciBzb21lIGV2ZW50cy5cbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnRbXX0gc3JjRWxlbXMgYW4gYXJyYXkgb2YgSFRNTCBkb2N1bWVudCBub2RlcyB3aG9zZSBib2R5IGhhcyB0aGUgbWFya2Rvd24gb3IgZGF0YS10cmFuc2Zvcm1hYmxlLXNyYz1cImh0dHA6Ly94eXoubWRcIlxuICogQHBhcmFtIHsobmV3RWxlbSwgb2xkRWxlbSkgPT4gdm9pZH0gZmluYWxpemVFbGVtRm4gb3B0aW9uYWwgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIGZvciBlYWNoIHRyYW5zZm9ybWVkIGVsZW1lbnRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRyYW5zZm9ybU1hcmtkb3duRWxlbXNDdXN0b20oc3JjRWxlbXMsIGZpbmFsaXplRWxlbUZuLCBtZGl0dCA9IG1hcmtkb3duSXRUcmFuc2Zvcm1lcigpKSB7XG4gICAgYXdhaXQgcmVuZGVyTWFya2Rvd24oZnVuY3Rpb24qICgpIHtcbiAgICAgICAgZm9yIChjb25zdCBlbGVtIG9mIHNyY0VsZW1zKSB7XG4gICAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICAgICAgbWFya2Rvd25UZXh0OiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGZvdW5kIGRhdGEtdHJhbnNmb3JtYWJsZS1zcmM9XCJodHRwOi8veHl6Lm1kXCIsIGZldGNoIHRoZSBtYXJrZG93biBmcm9tIGEgVVJMXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtLmRhdGFzZXQudHJhbnNmb3JtYWJsZVNyYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChlbGVtLmRhdGFzZXQudHJhbnNmb3JtYWJsZVNyYyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGBFcnJvciBmZXRjaGluZyAke2VsZW0uZGF0YXNldC50cmFuc2Zvcm1hYmxlU3JjfTogJHtyZXNwb25zZS5zdGF0dXN9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBubyBkYXRhLXRyYW5zZm9ybWFibGUtc3JjPVwiaHR0cDovL3h5ei5tZFwiLCBhc3N1bWUgaXQncyBpbiB0aGUgYm9keVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsZW0uaW5uZXJUZXh0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAvLyBkZW5vLWxpbnQtaWdub3JlIHJlcXVpcmUtYXdhaXRcbiAgICAgICAgICAgICAgICByZW5kZXJIVE1MOiBhc3luYyAoaHRtbCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm9ybWF0dGVkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1hdHRlZC5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5wYXJlbnRFbGVtZW50LnJlcGxhY2VDaGlsZChmb3JtYXR0ZWQsIGVsZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpbmFsaXplRWxlbUZuKSBmaW5hbGl6ZUVsZW1Gbihmb3JtYXR0ZWQsIGVsZW0pO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlVuZGlhZ25vc2FibGUgZXJyb3IgaW4gcmVuZGVySFRNTCgpXCIsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LCBtZGl0dClcbn1cblxuLyoqXG4gKiBSdW4gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgW2RhdGEtdHJhbnNmb3JtYWJsZT1cIm1hcmtkb3duXCJdYCkgdG8gZmluZCBhbGxcbiAqIDxwcmU+IG9yIG90aGVyIGVsZW1lbnQgbWFya2VkIGFzIFwidHJhbnNmb3JtYWJsZVwiLCByZW5kZXIgdGhlIG1hcmtkb3duJ3MgSFRNTFxuICogYW5kIHJlcGxhY2UgdGhlIGV4aXN0aW5nIHRoZSBleGlzdGluZyBlbGVtZW50IHdpdGggdGhlIG5ld2x5IGZvcm1hdHRlZCBlbGVtLlxuICogRm9yIGVhY2ggZWxlbWVudCB0aGF0J3MgZm9ybWF0dGVkLCBkaXNwYXRjaCBhbiBldmVudCBmb3Igb3RoZXJzIHRvIGhhbmRsZS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRyYW5zZm9ybU1hcmtkb3duRWxlbXMoZmlyc3RIZWFkaW5nTGV2ZWwgPSAyKSB7XG4gICAgY29uc3QgbWRpdHREZWZhdWx0cyA9IG1hcmtkb3duSXRUcmFuc2Zvcm1lcigpO1xuICAgIGF3YWl0IHRyYW5zZm9ybU1hcmtkb3duRWxlbXNDdXN0b20oXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYFtkYXRhLXRyYW5zZm9ybWFibGU9XCJtYXJrZG93blwiXWApLFxuICAgICAgICAobWRIdG1sRWxlbSwgbWRTcmNFbGVtKSA9PiB7XG4gICAgICAgICAgICBtZEh0bWxFbGVtLmRhdGFzZXQudHJhbnNmb3JtZWRGcm9tID0gXCJtYXJrZG93blwiO1xuICAgICAgICAgICAgaWYgKG1kU3JjRWxlbS5jbGFzc05hbWUpIG1kSHRtbEVsZW0uY2xhc3NOYW1lID0gbWRTcmNFbGVtLmNsYXNzTmFtZTtcbiAgICAgICAgICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwidHJhbnNmb3JtZWQtbWFya2Rvd25cIiwge1xuICAgICAgICAgICAgICAgIGRldGFpbDogeyBtZEh0bWxFbGVtLCBtZFNyY0VsZW0gfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9LCB7XG4gICAgICAgIC4uLm1kaXR0RGVmYXVsdHMsXG4gICAgICAgIGN1c3RvbWl6ZTogKG1hcmtkb3duSXQsIHRyYW5zZm9ybWVyKSA9PiB7XG4gICAgICAgICAgICBtZGl0dERlZmF1bHRzLmN1c3RvbWl6ZShtYXJrZG93bkl0LCB0cmFuc2Zvcm1lcik7XG4gICAgICAgICAgICBtYXJrZG93bkl0LnVzZSh0cmFuc2Zvcm1lci5kZXBlbmRlbmNpZXMucGx1Z2lucy5hZGp1c3RIZWFkaW5nTGV2ZWwsIHsgZmlyc3RMZXZlbDogZmlyc3RIZWFkaW5nTGV2ZWwgfSk7XG4gICAgICAgIH1cbiAgICB9KVxufVxuXG4iLCJpbXBvcnQgeyBodW1hblBhdGggfSBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vbGliL3RleHQvaHVtYW4udHNcIjtcbmltcG9ydCB7IExvY2F0aW9uU3VwcGxpZXIgfSBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vbGliL21vZHVsZS9tb2QudHNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFVybFF1ZXJ5UGFyYW1ldGVyQnlOYW1lKFxuICBuYW1lOiBzdHJpbmcsXG4gIHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLFxuKSB7XG4gIG5hbWUgPSBuYW1lLnJlcGxhY2UoL1tcXFtcXF1dL2csIFwiXFxcXCQmXCIpO1xuICBjb25zdCByZWdleCA9IG5ldyBSZWdFeHAoXCJbPyZdXCIgKyBuYW1lICsgXCIoPShbXiYjXSopfCZ8I3wkKVwiKSxcbiAgICByZXN1bHRzID0gcmVnZXguZXhlYyh1cmwpO1xuICBpZiAoIXJlc3VsdHMpIHJldHVybiBudWxsO1xuICBpZiAoIXJlc3VsdHNbMl0pIHJldHVybiBcIlwiO1xuICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHJlc3VsdHNbMl0ucmVwbGFjZSgvXFwrL2csIFwiIFwiKSk7XG59XG5cbmV4cG9ydCBjb25zdCBlZGl0YWJsZUZpbGVSZWRpcmVjdFVSTCA9IChhYnNQYXRoOiBzdHJpbmcpID0+IHtcbiAgbGV0IHNyYyA9IGFic1BhdGg7XG4gIGlmIChzcmMuc3RhcnRzV2l0aChcImZpbGU6Ly9cIikpIHtcbiAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKDcpO1xuICAgIHJldHVybiBbYC93b3Jrc3BhY2UvZWRpdG9yLXJlZGlyZWN0L2FicyR7c3JjfWAsIHNyY107XG4gIH0gZWxzZSB7XG4gICAgaWYgKGFic1BhdGguc3RhcnRzV2l0aChcIi9cIikpIHtcbiAgICAgIHJldHVybiBbYC93b3Jrc3BhY2UvZWRpdG9yLXJlZGlyZWN0L2FicyR7YWJzUGF0aH1gLCBhYnNQYXRoXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFtzcmMsIHNyY107XG4gICAgfVxuICB9XG59O1xuXG5leHBvcnQgY29uc3QgZWRpdGFibGVGaWxlUmVmSFRNTCA9IChcbiAgYWJzUGF0aDogc3RyaW5nLFxuICBodW1hbml6ZUxlbmd0aD86IG51bWJlcixcbikgPT4ge1xuICBjb25zdCBbaHJlZiwgbGFiZWxdID0gZWRpdGFibGVGaWxlUmVkaXJlY3RVUkwoYWJzUGF0aCk7XG4gIHJldHVybiBodW1hbml6ZUxlbmd0aFxuICAgID8gaHVtYW5QYXRoKFxuICAgICAgbGFiZWwsXG4gICAgICBodW1hbml6ZUxlbmd0aCxcbiAgICAgIChiYXNlbmFtZSkgPT5cbiAgICAgICAgYDxhIGhyZWY9XCIke2hyZWZ9XCIgY2xhc3M9XCJmdy1ib2xkXCIgdGl0bGU9XCIke2Fic1BhdGh9XCI+JHtiYXNlbmFtZX08L2E+YCxcbiAgICApXG4gICAgOiBgPGEgaHJlZj1cIiR7aHJlZn1cIj4ke2xhYmVsfTwvYT5gO1xufTtcblxuZXhwb3J0IGNvbnN0IGxvY2F0aW9uRWRpdG9yUmVkaXJlY3RVUkwgPSAobG9jYXRpb246IExvY2F0aW9uU3VwcGxpZXIpID0+XG4gIGVkaXRhYmxlRmlsZVJlZGlyZWN0VVJMKGxvY2F0aW9uLm1vZHVsZUltcG9ydE1ldGFVUkwpO1xuXG5leHBvcnQgY29uc3QgbG9jYXRpb25FZGl0b3JIVE1MID0gKFxuICBsb2NhdGlvbjogTG9jYXRpb25TdXBwbGllcixcbiAgaHVtYW5pemVMZW5ndGg/OiBudW1iZXIsXG4pID0+IHtcbiAgY29uc3QgW2hyZWYsIGxhYmVsXSA9IGxvY2F0aW9uRWRpdG9yUmVkaXJlY3RVUkwobG9jYXRpb24pO1xuICByZXR1cm4gaHVtYW5pemVMZW5ndGhcbiAgICA/IGh1bWFuUGF0aChcbiAgICAgIGxhYmVsLFxuICAgICAgaHVtYW5pemVMZW5ndGgsXG4gICAgICAoYmFzZW5hbWUpID0+XG4gICAgICAgIGA8YSBocmVmPVwiJHtocmVmfVwiIGNsYXNzPVwiZnctYm9sZFwiIHRpdGxlPVwiJHtsb2NhdGlvbi5tb2R1bGVJbXBvcnRNZXRhVVJMfVwiPiR7YmFzZW5hbWV9PC9hPmAsXG4gICAgKVxuICAgIDogYDxhIGhyZWY9XCIke2hyZWZ9XCI+JHtsYWJlbH08L2E+YDtcbn07XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBd0JBLElBQUksT0FBTyxJQUFJLENBQUMsT0FBTyxLQUFLLFVBQVUsRUFBRTtJQUNwQyxJQUFJLENBQUMsT0FBTyxHQUFHLFNBQVMsT0FBTyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUU7UUFDOUMsWUFBWSxDQUFDO1FBMEJiLElBQUksT0FBTyxHQUFHLElBQUksT0FBTyxFQUFFLEFBQUM7UUFFNUIsT0FBUSxTQUFTLEtBQUssQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFO1lBSWhDLElBQUksUUFBUSxBQUFDO1lBQ2IsSUFBSSxFQUFFLEFBQUM7WUFJUCxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7Z0JBQ3hCLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDM0I7WUFLRCxJQUNJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFDdEIsS0FBSyxLQUFLLElBQUksSUFDZCxDQUFDLENBQUMsS0FBSyxZQUFZLE9BQU8sQ0FBQyxJQUMzQixDQUFDLENBQUMsS0FBSyxZQUFZLElBQUksQ0FBQyxJQUN4QixDQUFDLENBQUMsS0FBSyxZQUFZLE1BQU0sQ0FBQyxJQUMxQixDQUFDLENBQUMsS0FBSyxZQUFZLE1BQU0sQ0FBQyxJQUMxQixDQUFDLENBQUMsS0FBSyxZQUFZLE1BQU0sQ0FBQyxFQUMvQjtnQkFNRSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDOUIsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFO29CQUN4QixPQUFPO3dCQUFDLElBQUksRUFBRSxRQUFRO3FCQUFDLENBQUM7aUJBQzNCO2dCQUlELE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUl6QixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7b0JBQ3RCLEVBQUUsR0FBRyxFQUFFLENBQUM7b0JBQ1IsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFVLE9BQU8sRUFBRSxDQUFDLEVBQUU7d0JBQ2hDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO3FCQUNoRCxDQUFDLENBQUM7aUJBQ04sTUFBTTtvQkFJSCxFQUFFLEdBQUcsRUFBRSxDQUFDO29CQUNSLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVUsSUFBSSxFQUFFO3dCQUN2QyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUNaLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFDWCxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUMxQyxDQUFDO3FCQUNMLENBQUMsQ0FBQztpQkFDTjtnQkFDRCxPQUFPLEVBQUUsQ0FBQzthQUNiO1lBQ0QsT0FBTyxLQUFLLENBQUM7U0FDaEIsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUU7S0FDbkIsQ0FBQztDQUNMO0FBR0QsSUFBSSxPQUFPLElBQUksQ0FBQyxVQUFVLEtBQUssVUFBVSxFQUFFO0lBQ3ZDLElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxVQUFVLENBQUMsQ0FBQyxFQUFFO1FBQ3JDLFlBQVksQ0FBQztRQXFCYixJQUFJLEVBQUUsdUZBQXVGLEFBQUM7UUFFN0YsQ0FBQSxTQUFTLEdBQUcsQ0FBQyxLQUFLLEVBQUU7WUFPakIsSUFBSSxLQUFLLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO2dCQUNwQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7b0JBQ3RCLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBVSxPQUFPLEVBQUUsQ0FBQyxFQUFFO3dCQUNoQyxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsSUFBSSxPQUFPLEtBQUssSUFBSSxFQUFFOzRCQUNqRCxJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxBQUFDOzRCQUN4QixJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO2dDQUMzQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDOzZCQUN6QixNQUFNO2dDQUNILEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQzs2QkFDaEI7eUJBQ0o7cUJBQ0osQ0FBQyxDQUFDO2lCQUNOLE1BQU07b0JBQ0gsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBVSxJQUFJLEVBQUU7d0JBQ3ZDLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsQUFBQzt3QkFDdkIsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLElBQUksSUFBSSxLQUFLLElBQUksRUFBRTs0QkFDM0MsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQUFBQzs0QkFDckIsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtnQ0FDM0MsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzs2QkFDNUIsTUFBTTtnQ0FDSCxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7NkJBQ2I7eUJBQ0o7cUJBQ0osQ0FBQyxDQUFDO2lCQUNOO2FBQ0o7U0FDSixDQUFBLENBQUMsQ0FBQyxDQUFDLENBQUU7UUFDTixPQUFPLENBQUMsQ0FBQztLQUNaLENBQUM7Q0FDTDtBQ2pMRCxDQUFDLFNBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQztJQUFDLFFBQVEsSUFBRSxPQUFPLE9BQU8sSUFBRSxXQUFXLElBQUUsT0FBTyxNQUFNLEdBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFDLFVBQVUsSUFBRSxPQUFPLE1BQU0sSUFBRSxNQUFNLENBQUMsR0FBRyxHQUFDLE1BQU0sQ0FBQztRQUFDLFNBQVM7S0FBQyxFQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxXQUFXLElBQUUsT0FBTyxVQUFVLEdBQUMsVUFBVSxHQUFDLENBQUMsSUFBRSxJQUFJLENBQUMsQ0FBQyxNQUFNLEdBQUMsRUFBRSxDQUFDO0NBQUMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLEVBQUM7SUFBQyxZQUFZLENBQUM7SUFBQSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUM7UUFBQyxJQUFHLElBQUksSUFBRSxDQUFDLEVBQUMsT0FBTyxNQUFNLENBQUM7UUFBQSxJQUFHLGlCQUFpQixLQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBQztZQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxhQUFhLEFBQUM7WUFBQSxPQUFPLENBQUMsSUFBRSxDQUFDLENBQUMsV0FBVyxJQUFFLE1BQU0sQ0FBQTtTQUFDO1FBQUEsT0FBTyxDQUFDLENBQUE7S0FBQztJQUFBLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQztRQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLElBQUUsQ0FBQyxZQUFZLE9BQU8sQ0FBQTtLQUFDO0lBQUEsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDO1FBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsSUFBRSxDQUFDLFlBQVksV0FBVyxDQUFBO0tBQUM7SUFBQSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUM7UUFBQyxPQUFNLFdBQVcsSUFBRSxPQUFPLFVBQVUsSUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxJQUFFLENBQUMsWUFBWSxVQUFVLENBQUMsQ0FBQTtLQUFDO0lBQUEsSUFBSSxDQUFDLEdBQUMsSUFBSSxDQUFDLEdBQUcsRUFBQyxDQUFDLEdBQUMsSUFBSSxDQUFDLEdBQUcsRUFBQyxDQUFDLEdBQUMsSUFBSSxDQUFDLEtBQUssQUFBQztJQUFBLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7UUFBQyxLQUFLLENBQUMsS0FBRyxDQUFDLElBQUUsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUFBLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxxQkFBcUIsRUFBRSxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQUFBQztRQUFBLElBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsRUFBQztZQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxZQUFZLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxXQUFXLEFBQUM7WUFBQSxDQUFDLEdBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDO1NBQUM7UUFBQSxPQUFNO1lBQUMsS0FBSyxFQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUMsQ0FBQztZQUFDLE1BQU0sRUFBQyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUM7WUFBQyxHQUFHLEVBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBQyxDQUFDO1lBQUMsS0FBSyxFQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUMsQ0FBQztZQUFDLE1BQU0sRUFBQyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUM7WUFBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDO1lBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQztZQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsR0FBRyxHQUFDLENBQUM7U0FBQyxDQUFBO0tBQUM7SUFBQSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUM7UUFBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEFBQUM7UUFBQSxPQUFNO1lBQUMsVUFBVSxFQUFDLENBQUMsQ0FBQyxXQUFXO1lBQUMsU0FBUyxFQUFDLENBQUMsQ0FBQyxXQUFXO1NBQUMsQ0FBQTtLQUFDO0lBQUEsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDO1FBQUMsT0FBTyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxJQUFFLEVBQUUsQ0FBQyxDQUFDLFdBQVcsRUFBRSxHQUFDLElBQUksQ0FBQTtLQUFDO0lBQUEsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDO1FBQUMsT0FBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxhQUFhLEdBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxlQUFlLENBQUE7S0FBQztJQUFBLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQztRQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFBO0tBQUM7SUFBQSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUM7UUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQTtLQUFDO0lBQUEsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDO1FBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsUUFBUSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsU0FBUyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsU0FBUyxBQUFDO1FBQUEsT0FBTSw2QkFBNkIsSUFBSSxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUE7S0FBQztJQUFBLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO1FBQUMsS0FBSyxDQUFDLEtBQUcsQ0FBQyxJQUFFLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFBQSxJQUFJLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLFNBQVMsQ0FBQyxFQUFDO1lBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLHFCQUFxQixFQUFFLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFdBQVcsSUFBRSxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUMsQ0FBQyxDQUFDLFlBQVksSUFBRSxDQUFDLEFBQUM7WUFBQSxPQUFPLENBQUMsS0FBRyxDQUFDLElBQUUsQ0FBQyxLQUFHLENBQUMsQ0FBQTtTQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUM7WUFBQyxVQUFVLEVBQUMsQ0FBQztZQUFDLFNBQVMsRUFBQyxDQUFDO1NBQUMsRUFBQyxDQUFDLEdBQUM7WUFBQyxDQUFDLEVBQUMsQ0FBQztZQUFDLENBQUMsRUFBQyxDQUFDO1NBQUMsQUFBQztRQUFBLE9BQU0sQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsTUFBTSxLQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDO1lBQUMsVUFBVSxFQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVU7WUFBQyxTQUFTLEVBQUMsQ0FBQyxDQUFDLFNBQVM7U0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsVUFBVSxFQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQztZQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxVQUFVLEdBQUMsQ0FBQyxDQUFDLENBQUM7WUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBQyxDQUFDLENBQUMsU0FBUyxHQUFDLENBQUMsQ0FBQyxDQUFDO1lBQUMsS0FBSyxFQUFDLENBQUMsQ0FBQyxLQUFLO1lBQUMsTUFBTSxFQUFDLENBQUMsQ0FBQyxNQUFNO1NBQUMsQ0FBQTtLQUFDO0lBQUEsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDO1FBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsV0FBVyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsWUFBWSxBQUFDO1FBQUEsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxJQUFFLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxJQUFFLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBQztZQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsVUFBVTtZQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsU0FBUztZQUFDLEtBQUssRUFBQyxDQUFDO1lBQUMsTUFBTSxFQUFDLENBQUM7U0FBQyxDQUFBO0tBQUM7SUFBQSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUM7UUFBQyxPQUFNLE1BQU0sS0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxZQUFZLElBQUUsQ0FBQyxDQUFDLFVBQVUsSUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxHQUFDLElBQUksQ0FBQyxJQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtLQUFDO0lBQUEsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDO1FBQUMsT0FBTTtZQUFDLE1BQU07WUFBQyxNQUFNO1lBQUMsV0FBVztTQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsR0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7S0FBQztJQUFBLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7UUFBQyxJQUFJLENBQUMsQUFBQztRQUFBLEtBQUssQ0FBQyxLQUFHLENBQUMsSUFBRSxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQztRQUFBLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxLQUFHLENBQUMsSUFBSSxJQUFFLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsR0FBQyxLQUFLLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDO1lBQUMsQ0FBQztTQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxjQUFjLElBQUUsRUFBRSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxBQUFDO1FBQUEsT0FBTyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7S0FBQztJQUFBLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQztRQUFDLE9BQU07WUFBQyxPQUFPO1lBQUMsSUFBSTtZQUFDLElBQUk7U0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUE7S0FBQztJQUFBLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQztRQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLE9BQU8sS0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxHQUFDLENBQUMsQ0FBQyxZQUFZLEdBQUMsSUFBSSxDQUFBO0tBQUM7SUFBQSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUM7UUFBQyxJQUFJLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsUUFBUSxLQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUFBLE9BQU8sQ0FBQyxJQUFFLENBQUMsTUFBTSxLQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxNQUFNLEtBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLFFBQVEsS0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsSUFBRSxTQUFTLENBQUMsRUFBQztZQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxBQUFDO1lBQUEsSUFBRyxDQUFDLENBQUMsS0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsT0FBTyxLQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUMsT0FBTyxJQUFJLENBQUM7WUFBQSxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEFBQUM7WUFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFO2dCQUFDLE1BQU07Z0JBQUMsTUFBTTthQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsRUFBRTtnQkFBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEFBQUM7Z0JBQUEsSUFBRyxNQUFNLEtBQUcsQ0FBQyxDQUFDLFNBQVMsSUFBRSxNQUFNLEtBQUcsQ0FBQyxDQUFDLFdBQVcsSUFBRSxPQUFPLEtBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBRSxDQUFDLENBQUMsS0FBRztvQkFBQyxXQUFXO29CQUFDLGFBQWE7aUJBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFFLENBQUMsSUFBRSxRQUFRLEtBQUcsQ0FBQyxDQUFDLFVBQVUsSUFBRSxDQUFDLElBQUUsQ0FBQyxDQUFDLE1BQU0sSUFBRSxNQUFNLEtBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBQyxPQUFPLENBQUMsQ0FBQztnQkFBQSxDQUFDLEdBQUMsQ0FBQyxDQUFDLFVBQVU7YUFBQztZQUFBLE9BQU8sSUFBSSxDQUFBO1NBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUE7S0FBQztJQUFBLElBQUksQ0FBQyxHQUFDLEtBQUssRUFBQyxDQUFDLEdBQUMsUUFBUSxFQUFDLENBQUMsR0FBQyxPQUFPLEVBQUMsQ0FBQyxHQUFDLE1BQU0sRUFBQyxDQUFDLEdBQUMsTUFBTSxFQUFDLENBQUMsR0FBQztRQUFDLENBQUM7UUFBQyxDQUFDO1FBQUMsQ0FBQztRQUFDLENBQUM7S0FBQyxFQUFDLENBQUMsR0FBQyxPQUFPLEVBQUMsQ0FBQyxHQUFDLEtBQUssRUFBQyxDQUFDLEdBQUMsVUFBVSxFQUFDLENBQUMsR0FBQyxRQUFRLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLENBQUUsU0FBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDO1FBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDO1lBQUMsQ0FBQyxHQUFDLEdBQUcsR0FBQyxDQUFDO1lBQUMsQ0FBQyxHQUFDLEdBQUcsR0FBQyxDQUFDO1NBQUMsQ0FBQyxDQUFBO0tBQUMsRUFBRSxFQUFFLENBQUMsRUFBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUM7UUFBQyxDQUFDO0tBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBRSxTQUFTLENBQUMsRUFBQyxDQUFDLEVBQUM7UUFBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFBQyxDQUFDO1lBQUMsQ0FBQyxHQUFDLEdBQUcsR0FBQyxDQUFDO1lBQUMsQ0FBQyxHQUFDLEdBQUcsR0FBQyxDQUFDO1NBQUMsQ0FBQyxDQUFBO0tBQUMsRUFBRSxFQUFFLENBQUMsRUFBQyxDQUFDLEdBQUM7UUFBQyxZQUFZO1FBQUMsTUFBTTtRQUFDLFdBQVc7UUFBQyxZQUFZO1FBQUMsTUFBTTtRQUFDLFdBQVc7UUFBQyxhQUFhO1FBQUMsT0FBTztRQUFDLFlBQVk7S0FBQyxBQUFDO0lBQUEsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDO1FBQUMsSUFBSSxDQUFDLEdBQUMsSUFBSSxHQUFHLEVBQUMsQ0FBQyxHQUFDLElBQUksR0FBRyxFQUFDLENBQUMsR0FBQyxFQUFFLEFBQUM7UUFBQSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUM7WUFBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxRQUFRLElBQUUsRUFBRSxFQUFDLENBQUMsQ0FBQyxnQkFBZ0IsSUFBRSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUUsU0FBUyxDQUFDLEVBQUM7Z0JBQUMsSUFBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUM7b0JBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQUFBQztvQkFBQSxDQUFDLElBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFBQzthQUFDLENBQUUsRUFBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztTQUFDO1FBQUEsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFFLFNBQVMsQ0FBQyxFQUFDO1lBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQztTQUFDLENBQUUsRUFBQyxDQUFDLENBQUMsT0FBTyxDQUFFLFNBQVMsQ0FBQyxFQUFDO1lBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUFDLENBQUUsRUFBQyxDQUFDLENBQUE7S0FBQztJQUFBLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQztRQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtLQUFDO0lBQUEsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztRQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxXQUFXLElBQUUsQ0FBQyxDQUFDLFdBQVcsRUFBRSxBQUFDO1FBQUEsSUFBRyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFDLE9BQU0sQ0FBQyxDQUFDLENBQUM7UUFBQSxJQUFHLENBQUMsSUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUM7WUFBQyxJQUFJLENBQUMsR0FBQyxDQUFDLEFBQUM7WUFBQSxHQUFFO2dCQUFDLElBQUcsQ0FBQyxJQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUMsT0FBTSxDQUFDLENBQUMsQ0FBQztnQkFBQSxDQUFDLEdBQUMsQ0FBQyxDQUFDLFVBQVUsSUFBRSxDQUFDLENBQUMsSUFBSTthQUFDLE9BQU0sQ0FBQyxDQUFDO1NBQUM7UUFBQSxPQUFNLENBQUMsQ0FBQyxDQUFBO0tBQUM7SUFBQSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUM7UUFBQyxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFDLENBQUMsRUFBQztZQUFDLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQztZQUFDLEdBQUcsRUFBQyxDQUFDLENBQUMsQ0FBQztZQUFDLEtBQUssRUFBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLO1lBQUMsTUFBTSxFQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU07U0FBQyxDQUFDLENBQUE7S0FBQztJQUFBLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7UUFBQyxPQUFPLENBQUMsS0FBRyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFDO1lBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxjQUFjLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxZQUFZLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxBQUFDO1lBQUEsT0FBTyxDQUFDLElBQUUsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxpQ0FBaUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsSUFBRSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsVUFBVSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBQztnQkFBQyxLQUFLLEVBQUMsQ0FBQztnQkFBQyxNQUFNLEVBQUMsQ0FBQztnQkFBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQUMsQ0FBQyxFQUFDLENBQUM7YUFBQyxDQUFBO1NBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxTQUFTLENBQUMsRUFBQztZQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQUFBQztZQUFBLE9BQU8sQ0FBQyxDQUFDLEdBQUcsR0FBQyxDQUFDLENBQUMsR0FBRyxHQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsR0FBRyxHQUFDLENBQUMsQ0FBQyxZQUFZLEVBQUMsQ0FBQyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUMsQ0FBQyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsV0FBVyxFQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLFlBQVksRUFBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBRyxFQUFDLENBQUMsQ0FBQTtTQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFDO1lBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxJQUFJLElBQUUsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxHQUFDLEtBQUssQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxXQUFXLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsV0FBVyxHQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksRUFBQyxDQUFDLENBQUMsWUFBWSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsWUFBWSxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFlBQVksR0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxBQUFDO1lBQUEsT0FBTSxLQUFLLEtBQUcsQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLElBQUUsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxXQUFXLEdBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUM7Z0JBQUMsS0FBSyxFQUFDLENBQUM7Z0JBQUMsTUFBTSxFQUFDLENBQUM7Z0JBQUMsQ0FBQyxFQUFDLENBQUM7Z0JBQUMsQ0FBQyxFQUFDLENBQUM7YUFBQyxDQUFBO1NBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0tBQUM7SUFBQSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztRQUFDLElBQUksQ0FBQyxHQUFDLGlCQUFpQixLQUFHLENBQUMsR0FBQyxTQUFTLENBQUMsRUFBQztZQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUM7Z0JBQUMsVUFBVTtnQkFBQyxPQUFPO2FBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFFLENBQUMsSUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQUFBQztZQUFBLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLENBQUUsU0FBUyxDQUFDLEVBQUM7Z0JBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsSUFBRSxNQUFNLEtBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO2FBQUMsQ0FBRSxHQUFDLEVBQUUsQ0FBQTtTQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUM7WUFBQyxDQUFDO1NBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLENBQUUsU0FBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDO1lBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQUFBQztZQUFBLE9BQU8sQ0FBQyxDQUFDLEdBQUcsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxDQUFBO1NBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEFBQUM7UUFBQSxPQUFPLENBQUMsQ0FBQyxLQUFLLEdBQUMsQ0FBQyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsR0FBRyxFQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUMsQ0FBQyxDQUFBO0tBQUM7SUFBQSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUM7UUFBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7S0FBQztJQUFBLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQztRQUFDLE9BQU07WUFBQyxLQUFLO1lBQUMsUUFBUTtTQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsR0FBQyxHQUFHLEdBQUMsR0FBRyxDQUFBO0tBQUM7SUFBQSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUM7UUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxJQUFJLEVBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsSUFBSSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxBQUFDO1FBQUEsT0FBTyxDQUFDO1lBQUUsS0FBSyxDQUFDO2dCQUFDLENBQUMsR0FBQztvQkFBQyxDQUFDLEVBQUMsQ0FBQztvQkFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTTtpQkFBQyxDQUFDO2dCQUFBLE1BQU07WUFBQSxLQUFLLENBQUM7Z0JBQUMsQ0FBQyxHQUFDO29CQUFDLENBQUMsRUFBQyxDQUFDO29CQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNO2lCQUFDLENBQUM7Z0JBQUEsTUFBTTtZQUFBLEtBQUssQ0FBQztnQkFBQyxDQUFDLEdBQUM7b0JBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUs7b0JBQUMsQ0FBQyxFQUFDLENBQUM7aUJBQUMsQ0FBQztnQkFBQSxNQUFNO1lBQUEsS0FBSyxDQUFDO2dCQUFDLENBQUMsR0FBQztvQkFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSztvQkFBQyxDQUFDLEVBQUMsQ0FBQztpQkFBQyxDQUFDO2dCQUFBLE1BQU07WUFBQTtnQkFBUSxDQUFDLEdBQUM7b0JBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDO29CQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQztpQkFBQztTQUFDO1FBQUEsSUFBSSxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxJQUFJLEFBQUM7UUFBQSxJQUFHLElBQUksSUFBRSxDQUFDLEVBQUM7WUFBQyxJQUFJLENBQUMsR0FBQyxHQUFHLEtBQUcsQ0FBQyxHQUFDLFFBQVEsR0FBQyxPQUFPLEFBQUM7WUFBQSxPQUFPLENBQUM7Z0JBQUUsS0FBSyxDQUFDO29CQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQztvQkFBQSxNQUFNO2dCQUFBLEtBQUssQ0FBQztvQkFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDO2FBQUM7U0FBQztRQUFBLE9BQU8sQ0FBQyxDQUFBO0tBQUM7SUFBQSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUM7UUFBQyxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFDO1lBQUMsR0FBRyxFQUFDLENBQUM7WUFBQyxLQUFLLEVBQUMsQ0FBQztZQUFDLE1BQU0sRUFBQyxDQUFDO1lBQUMsSUFBSSxFQUFDLENBQUM7U0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBO0tBQUM7SUFBQSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO1FBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFFLFNBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQztZQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLENBQUE7U0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0tBQUM7SUFBQSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO1FBQUMsS0FBSyxDQUFDLEtBQUcsQ0FBQyxJQUFFLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQUEsSUFBSSxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsU0FBUyxFQUFDLENBQUMsR0FBQyxLQUFLLENBQUMsS0FBRyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFNBQVMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxLQUFHLENBQUMsR0FBQyxpQkFBaUIsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxZQUFZLEVBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxLQUFHLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsY0FBYyxFQUFDLENBQUMsR0FBQyxLQUFLLENBQUMsS0FBRyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBQyxDQUFDLEdBQUMsS0FBSyxDQUFDLEtBQUcsQ0FBQyxJQUFFLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxDQUFDLEdBQUMsS0FBSyxDQUFDLEtBQUcsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxRQUFRLElBQUUsT0FBTyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxLQUFHLENBQUMsR0FBQyxXQUFXLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsY0FBYyxJQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQztZQUFDLFNBQVMsRUFBQyxDQUFDO1lBQUMsT0FBTyxFQUFDLENBQUM7WUFBQyxRQUFRLEVBQUMsVUFBVTtZQUFDLFNBQVMsRUFBQyxDQUFDO1NBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsS0FBRyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUM7WUFBQyxHQUFHLEVBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBQyxDQUFDLENBQUMsR0FBRyxHQUFDLENBQUMsQ0FBQyxHQUFHO1lBQUMsTUFBTSxFQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsTUFBTTtZQUFDLElBQUksRUFBQyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLElBQUk7WUFBQyxLQUFLLEVBQUMsQ0FBQyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxLQUFLO1NBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEFBQUM7UUFBQSxJQUFHLENBQUMsS0FBRyxDQUFDLElBQUUsQ0FBQyxFQUFDO1lBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxBQUFDO1lBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUUsU0FBUyxDQUFDLEVBQUM7Z0JBQUMsSUFBSSxDQUFDLEdBQUM7b0JBQUMsQ0FBQztvQkFBQyxDQUFDO2lCQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDO29CQUFDLENBQUM7b0JBQUMsQ0FBQztpQkFBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLEdBQUMsR0FBRyxHQUFDLEdBQUcsQUFBQztnQkFBQSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUM7YUFBQyxDQUFFO1NBQUM7UUFBQSxPQUFPLENBQUMsQ0FBQTtLQUFDO0lBQUEsSUFBSSxDQUFDLEdBQUM7UUFBQyxTQUFTLEVBQUMsUUFBUTtRQUFDLFNBQVMsRUFBQyxFQUFFO1FBQUMsUUFBUSxFQUFDLFVBQVU7S0FBQyxBQUFDO0lBQUEsU0FBUyxDQUFDLEdBQUU7UUFBQyxJQUFJLElBQUksQ0FBQyxHQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUMsQ0FBQyxHQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQUEsT0FBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUUsU0FBUyxDQUFDLEVBQUM7WUFBQyxPQUFNLENBQUMsQ0FBQyxDQUFDLElBQUUsVUFBVSxJQUFFLE9BQU8sQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUE7U0FBQyxDQUFFLENBQUE7S0FBQztJQUFBLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQztRQUFDLEtBQUssQ0FBQyxLQUFHLENBQUMsSUFBRSxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQztRQUFBLElBQUksQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLGdCQUFnQixFQUFDLENBQUMsR0FBQyxLQUFLLENBQUMsS0FBRyxDQUFDLEdBQUMsRUFBRSxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLGNBQWMsRUFBQyxDQUFDLEdBQUMsS0FBSyxDQUFDLEtBQUcsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEFBQUM7UUFBQSxPQUFPLFNBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7WUFBQyxLQUFLLENBQUMsS0FBRyxDQUFDLElBQUUsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUM7WUFBQSxJQUFJLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDO2dCQUFDLFNBQVMsRUFBQyxRQUFRO2dCQUFDLGdCQUFnQixFQUFDLEVBQUU7Z0JBQUMsT0FBTyxFQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQUMsYUFBYSxFQUFDLEVBQUU7Z0JBQUMsUUFBUSxFQUFDO29CQUFDLFNBQVMsRUFBQyxDQUFDO29CQUFDLE1BQU0sRUFBQyxDQUFDO2lCQUFDO2dCQUFDLFVBQVUsRUFBQyxFQUFFO2dCQUFDLE1BQU0sRUFBQyxFQUFFO2FBQUMsRUFBQyxDQUFDLEdBQUMsRUFBRSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUM7Z0JBQUMsS0FBSyxFQUFDLENBQUM7Z0JBQUMsVUFBVSxFQUFDLFNBQVMsQ0FBQyxFQUFDO29CQUFDLElBQUksQ0FBQyxHQUFDLFVBQVUsSUFBRSxPQUFPLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFDLENBQUMsQUFBQztvQkFBQSxDQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsT0FBTyxHQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsT0FBTyxFQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxhQUFhLEdBQUM7d0JBQUMsU0FBUyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLGNBQWMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxHQUFDLEVBQUU7d0JBQUMsTUFBTSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7cUJBQUMsQ0FBQztvQkFBQSxJQUFJLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLFNBQVMsQ0FBQyxFQUFDO3dCQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQUFBQzt3QkFBQSxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUUsU0FBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDOzRCQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFFLFNBQVMsQ0FBQyxFQUFDO2dDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssS0FBRyxDQUFDLENBQUE7NkJBQUMsQ0FBRSxDQUFDLENBQUE7eUJBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQTtxQkFBQyxDQUFFLENBQUEsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLENBQUUsU0FBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDO3dCQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEFBQUM7d0JBQUEsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsR0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDOzRCQUFDLE9BQU8sRUFBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsT0FBTyxFQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7NEJBQUMsSUFBSSxFQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQzt5QkFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQTtxQkFBQyxFQUFFLEVBQUUsQ0FBQyxFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFFLFNBQVMsQ0FBQyxFQUFDO3dCQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO3FCQUFDLENBQUUsQ0FBQSxDQUFFLEFBQUM7b0JBQUEsT0FBTyxDQUFDLENBQUMsZ0JBQWdCLEdBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBRSxTQUFTLENBQUMsRUFBQzt3QkFBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUE7cUJBQUMsQ0FBRSxFQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUUsU0FBUyxDQUFDLEVBQUM7d0JBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxDQUFDLEdBQUMsS0FBSyxDQUFDLEtBQUcsQ0FBQyxHQUFDLEVBQUUsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENB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QUFDO1lBQUEsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUM7Z0JBQUMsU0FBUyxFQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUztnQkFBQyxPQUFPLEVBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNO2dCQUFDLFFBQVEsRUFBQyxVQUFVO2dCQUFDLFNBQVMsRUFBQyxDQUFDLENBQUMsU0FBUzthQUFDLENBQUM7U0FBQztRQUFDLElBQUksRUFBQyxFQUFFO0tBQUMsRUFBQyxFQUFFLEdBQUM7UUFBQyxHQUFHLEVBQUMsTUFBTTtRQUFDLEtBQUssRUFBQyxNQUFNO1FBQUMsTUFBTSxFQUFDLE1BQU07UUFBQyxJQUFJLEVBQUMsTUFBTTtLQUFDLEFBQUM7SUFBQSxTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUM7UUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLGVBQWUsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFlBQVksRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsS0FBSyxDQUFDLEtBQUcsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxLQUFHLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxVQUFVLElBQUUsT0FBTyxDQUFDLEdBQUMsQ0FBQyxDQUFDO1lBQUMsQ0FBQyxFQUFDLENBQUM7WUFBQyxDQUFDLEVBQUMsQ0FBQztTQUFDLENBQUMsR0FBQztZQUFDLENBQUMsRUFBQyxDQUFDO1lBQUMsQ0FBQyxFQUFDLENBQUM7U0FBQyxBQUFDO1FBQUEsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFBQSxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsTUFBTSxBQUFDO1FBQUEsSUFBRyxDQUFDLEVBQUM7WUFBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLGNBQWMsRUFBQyxDQUFDLEdBQUMsYUFBYSxBQUFDO1lBQUEsSUFBRyxDQUFDLEtBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLFFBQVEsS0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBRSxVQUFVLEtBQUcsQ0FBQyxJQUFFLENBQUMsQ0FBQyxHQUFDLGNBQWMsRUFBQyxDQUFDLEdBQUMsYUFBYSxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEtBQUcsQ0FBQyxJQUFFLENBQUMsQ0FBQyxLQUFHLENBQUMsSUFBRSxDQUFDLEtBQUcsQ0FBQyxDQUFDLElBQUUsQ0FBQyxLQUFHLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsSUFBRSxDQUFDLEtBQUcsQ0FBQyxJQUFFLENBQUMsQ0FBQyxjQUFjLEdBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxDQUFDLElBQUUsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQztZQUFBLElBQUcsQ0FBQyxLQUFHLENBQUMsSUFBRSxDQUFDLENBQUMsS0FBRyxDQUFDLElBQUUsQ0FBQyxLQUFHLENBQUMsQ0FBQyxJQUFFLENBQUMsS0FBRyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLElBQUUsQ0FBQyxLQUFHLENBQUMsSUFBRSxDQUFDLENBQUMsY0FBYyxHQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUMsQ0FBQyxJQUFFLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDO1NBQUM7UUFBQSxJQUFJLENBQUMsRUFBQyxDQUFDLEdBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUFDLFFBQVEsRUFBQyxDQUFDO1NBQUMsRUFBQyxDQUFDLElBQUUsRUFBRSxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFHLENBQUMsR0FBQyxTQUFTLENBQUMsRUFBQztZQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsSUFBRSxDQUFDLEFBQUM7WUFBQSxPQUFNO2dCQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsSUFBRSxDQUFDO2dCQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsSUFBRSxDQUFDO2FBQUMsQ0FBQTtTQUFDLENBQUM7WUFBQyxDQUFDLEVBQUMsQ0FBQztZQUFDLENBQUMsRUFBQyxDQUFDO1NBQUMsQ0FBQyxHQUFDO1lBQUMsQ0FBQyxFQUFDLENBQUM7WUFBQyxDQUFDLEVBQUMsQ0FBQztTQUFDLEFBQUM7UUFBQSxPQUFPLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBQyxDQUFDLEVBQUUsQ0FBQSxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsR0FBRyxHQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLEdBQUcsR0FBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLFNBQVMsR0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsSUFBRSxDQUFDLENBQUMsSUFBRSxDQUFDLEdBQUMsWUFBWSxHQUFDLENBQUMsR0FBQyxNQUFNLEdBQUMsQ0FBQyxHQUFDLEtBQUssR0FBQyxjQUFjLEdBQUMsQ0FBQyxHQUFDLE1BQU0sR0FBQyxDQUFDLEdBQUMsUUFBUSxFQUFDLENBQUMsQ0FBQSxDQUFFLEdBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUMsQ0FBQyxFQUFFLENBQUEsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxJQUFJLEdBQUMsRUFBRSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLElBQUksR0FBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLFNBQVMsR0FBQyxFQUFFLEVBQUMsQ0FBQyxDQUFBLENBQUUsQ0FBQTtLQUFDO0lBQUEsSUFBSSxFQUFFLEdBQUM7UUFBQyxJQUFJLEVBQUMsZUFBZTtRQUFDLE9BQU8sRUFBQyxDQUFDLENBQUM7UUFBQyxLQUFLLEVBQUMsYUFBYTtRQUFDLEVBQUUsRUFBQyxTQUFTLENBQUMsRUFBQztZQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxlQUFlLEVBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxLQUFHLENBQUMsSUFBRSxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxLQUFHLENBQUMsSUFBRSxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxZQUFZLEVBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxLQUFHLENBQUMsSUFBRSxDQUFDLEVBQUMsQ0FBQyxHQUFDO2dCQUFDLFNBQVMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztnQkFBQyxTQUFTLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7Z0JBQUMsTUFBTSxFQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTTtnQkFBQyxVQUFVLEVBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNO2dCQUFDLGVBQWUsRUFBQyxDQUFDO2dCQUFDLE9BQU8sRUFBQyxPQUFPLEtBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRO2FBQUMsQUFBQztZQUFBLElBQUksSUFBRSxDQUFDLENBQUMsYUFBYSxDQUFDLGFBQWEsSUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBQyxDQUFDLEVBQUM7Z0JBQUMsT0FBTyxFQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsYUFBYTtnQkFBQyxRQUFRLEVBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRO2dCQUFDLFFBQVEsRUFBQyxDQUFDO2dCQUFDLFlBQVksRUFBQyxDQUFDO2FBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLElBQUksSUFBRSxDQUFDLENBQUMsYUFBYSxDQUFDLEtBQUssSUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBQyxDQUFDLEVBQUM7Z0JBQUMsT0FBTyxFQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsS0FBSztnQkFBQyxRQUFRLEVBQUMsVUFBVTtnQkFBQyxRQUFRLEVBQUMsQ0FBQyxDQUFDO2dCQUFDLFlBQVksRUFBQyxDQUFDO2FBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFDO2dCQUFDLHVCQUF1QixFQUFDLENBQUMsQ0FBQyxTQUFTO2FBQUMsQ0FBQztTQUFDO1FBQUMsSUFBSSxFQUFDLEVBQUU7S0FBQyxBQUFDO0lBQUEsSUFBSSxFQUFFLEdBQUM7UUFBQyxJQUFJLEVBQUMsYUFBYTtRQUFDLE9BQU8sRUFBQyxDQUFDLENBQUM7UUFBQyxLQUFLLEVBQUMsT0FBTztRQUFDLEVBQUUsRUFBQyxTQUFTLENBQUMsRUFBQztZQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLEFBQUM7WUFBQSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxPQUFPLENBQUUsU0FBUyxDQUFDLEVBQUM7Z0JBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBRSxFQUFFLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUUsRUFBRSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxBQUFDO2dCQUFBLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUMsQ0FBQyxDQUFDLEVBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUUsU0FBUyxDQUFDLEVBQUM7b0JBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxBQUFDO29CQUFBLENBQUMsQ0FBQyxLQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxLQUFHLENBQUMsR0FBQyxFQUFFLEdBQUMsQ0FBQyxDQUFDO2lCQUFDLENBQUUsQ0FBQzthQUFDLENBQUU7U0FBQztRQUFDLE1BQU0sRUFBQyxTQUFTLENBQUMsRUFBQztZQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUMsQ0FBQyxHQUFDO2dCQUFDLE1BQU0sRUFBQztvQkFBQyxRQUFRLEVBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRO29CQUFDLElBQUksRUFBQyxHQUFHO29CQUFDLEdBQUcsRUFBQyxHQUFHO29CQUFDLE1BQU0sRUFBQyxHQUFHO2lCQUFDO2dCQUFDLEtBQUssRUFBQztvQkFBQyxRQUFRLEVBQUMsVUFBVTtpQkFBQztnQkFBQyxTQUFTLEVBQUMsRUFBRTthQUFDLEFBQUM7WUFBQSxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBQyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssSUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUMsV0FBVTtnQkFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxPQUFPLENBQUUsU0FBUyxDQUFDLEVBQUM7b0JBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBRSxFQUFFLEVBQUMsQ0FBQyxHQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUUsU0FBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDO3dCQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsRUFBQyxDQUFDLENBQUE7cUJBQUMsRUFBRSxFQUFFLENBQUMsQUFBQztvQkFBQSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFDLENBQUMsQ0FBQyxFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFFLFNBQVMsQ0FBQyxFQUFDO3dCQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO3FCQUFDLENBQUUsQ0FBQztpQkFBQyxDQUFFO2FBQUMsQ0FBQTtTQUFDO1FBQUMsUUFBUSxFQUFDO1lBQUMsZUFBZTtTQUFDO0tBQUMsQUFBQztJQUFBLElBQUksRUFBRSxHQUFDO1FBQUMsSUFBSSxFQUFDLFFBQVE7UUFBQyxPQUFPLEVBQUMsQ0FBQyxDQUFDO1FBQUMsS0FBSyxFQUFDLE1BQU07UUFBQyxRQUFRLEVBQUM7WUFBQyxlQUFlO1NBQUM7UUFBQyxFQUFFLEVBQUMsU0FBUyxDQUFDLEVBQUM7WUFBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsT0FBTyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxFQUFDLENBQUMsR0FBQyxLQUFLLENBQUMsS0FBRyxDQUFDLEdBQUM7QUFBQyxpQkFBQztBQUFDLGlCQUFDO2FBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLENBQUUsU0FBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDO2dCQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLFNBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7b0JBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQzt3QkFBQyxDQUFDO3dCQUFDLENBQUM7cUJBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsVUFBVSxJQUFFLE9BQU8sQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBQyxDQUFDLEVBQUM7d0JBQUMsU0FBUyxFQUFDLENBQUM7cUJBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQUFBQztvQkFBQSxPQUFPLENBQUMsR0FBQyxDQUFDLElBQUUsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsR0FBQyxDQUFDLEVBQUM7d0JBQUMsQ0FBQzt3QkFBQyxDQUFDO3FCQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsR0FBQzt3QkFBQyxDQUFDLEVBQUMsQ0FBQzt3QkFBQyxDQUFDLEVBQUMsQ0FBQztxQkFBQyxHQUFDO3dCQUFDLENBQUMsRUFBQyxDQUFDO3dCQUFDLENBQUMsRUFBQyxDQUFDO3FCQUFDLENBQUE7aUJBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEtBQUssRUFBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUE7YUFBQyxFQUFFLEVBQUUsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxBQUFDO1lBQUEsSUFBSSxJQUFFLENBQUMsQ0FBQyxhQUFhLENBQUMsYUFBYSxJQUFFLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFFLENBQUMsRUFBQyxDQUFDLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDO1NBQUM7S0FBQyxFQUFDLEVBQUUsR0FBQztRQUFDLElBQUksRUFBQyxPQUFPO1FBQUMsS0FBSyxFQUFDLE1BQU07UUFBQyxNQUFNLEVBQUMsS0FBSztRQUFDLEdBQUcsRUFBQyxRQUFRO0tBQUMsQUFBQztJQUFBLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBQztRQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sMkJBQTJCLFNBQVMsQ0FBQyxFQUFDO1lBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7U0FBQyxDQUFFLENBQUE7S0FBQztJQUFBLElBQUksRUFBRSxHQUFDO1FBQUMsS0FBSyxFQUFDLEtBQUs7UUFBQyxHQUFHLEVBQUMsT0FBTztLQUFDLEFBQUM7SUFBQSxTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUM7UUFBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLGVBQWUsU0FBUyxDQUFDLEVBQUM7WUFBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtTQUFDLENBQUUsQ0FBQTtLQUFDO0lBQUEsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztRQUFDLEtBQUssQ0FBQyxLQUFHLENBQUMsSUFBRSxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQztRQUFBLElBQUksQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFlBQVksRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLGNBQWMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLHFCQUFxQixFQUFDLENBQUMsR0FBQyxLQUFLLENBQUMsS0FBRyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxDQUFFLFNBQVMsQ0FBQyxFQUFDO1lBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUcsQ0FBQyxDQUFBO1NBQUMsQ0FBRSxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBRSxTQUFTLENBQUMsRUFBQztZQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUE7U0FBQyxDQUFFLEFBQUM7QUFBQSxRQUFBLENBQUMsS0FBRyxDQUFDLENBQUMsTUFBTSxJQUFFLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDO1FBQUEsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBRSxTQUFTLENBQUMsRUFBQyxDQUFDLEVBQUM7WUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDO2dCQUFDLFNBQVMsRUFBQyxDQUFDO2dCQUFDLFFBQVEsRUFBQyxDQUFDO2dCQUFDLFlBQVksRUFBQyxDQUFDO2dCQUFDLE9BQU8sRUFBQyxDQUFDO2FBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQTtTQUFDLEVBQUUsRUFBRSxDQUFDLEFBQUM7UUFBQSxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFFLFNBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQztZQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtTQUFDLENBQUUsQ0FBQTtLQUFDO0lBQUEsSUFBSSxFQUFFLEdBQUM7UUFBQyxJQUFJLEVBQUMsTUFBTTtRQUFDLE9BQU8sRUFBQyxDQUFDLENBQUM7UUFBQyxLQUFLLEVBQUMsTUFBTTtRQUFDLEVBQUUsRUFBQyxTQUFTLENBQUMsRUFBQztZQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLEFBQUM7WUFBQSxJQUFHLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUM7Z0JBQUMsSUFBSSxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsUUFBUSxFQUFDLENBQUMsR0FBQyxLQUFLLENBQUMsS0FBRyxDQUFDLElBQUUsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsT0FBTyxFQUFDLENBQUMsR0FBQyxLQUFLLENBQUMsS0FBRyxDQUFDLElBQUUsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsa0JBQWtCLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxZQUFZLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxjQUFjLEVBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxLQUFHLENBQUMsSUFBRSxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxxQkFBcUIsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxLQUFHLENBQUMsSUFBRSxDQUFDLENBQUMsR0FBQztvQkFBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2lCQUFDLEdBQUMsU0FBUyxDQUFDLEVBQUM7b0JBQUMsSUFBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUcsQ0FBQyxFQUFDLE9BQU0sRUFBRSxDQUFDO29CQUFBLElBQUksQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQUFBQztvQkFBQSxPQUFNO3dCQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7d0JBQUMsQ0FBQzt3QkFBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3FCQUFDLENBQUE7aUJBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQztvQkFBQyxDQUFDO2lCQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBRSxTQUFTLENBQUMsRUFBQyxDQUFDLEVBQUM7b0JBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBRyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsRUFBQzt3QkFBQyxTQUFTLEVBQUMsQ0FBQzt3QkFBQyxRQUFRLEVBQUMsQ0FBQzt3QkFBQyxZQUFZLEVBQUMsQ0FBQzt3QkFBQyxPQUFPLEVBQUMsQ0FBQzt3QkFBQyxjQUFjLEVBQUMsQ0FBQzt3QkFBQyxxQkFBcUIsRUFBQyxDQUFDO3FCQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQTtpQkFBQyxFQUFFLEVBQUUsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUMsQ0FBQyxHQUFDLElBQUksR0FBRyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBRyxDQUFDLEVBQUMsQ0FBQyxHQUFDO3dCQUFDLENBQUM7d0JBQUMsQ0FBQztxQkFBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxPQUFPLEdBQUMsUUFBUSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDO3dCQUFDLFNBQVMsRUFBQyxDQUFDO3dCQUFDLFFBQVEsRUFBQyxDQUFDO3dCQUFDLFlBQVksRUFBQyxDQUFDO3dCQUFDLFdBQVcsRUFBQyxDQUFDO3dCQUFDLE9BQU8sRUFBQyxDQUFDO3FCQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxBQUFDO29CQUFBLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQUEsSUFBSSxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxFQUFFLEFBQUM7b0JBQUEsSUFBRyxDQUFDLElBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBRSxTQUFTLENBQUMsRUFBQzt3QkFBQyxPQUFPLENBQUMsQ0FBQTtxQkFBQyxDQUFFLEVBQUM7d0JBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQUEsTUFBSztxQkFBQztvQkFBQSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7aUJBQUM7Z0JBQUEsSUFBRyxDQUFDLEVBQUMsSUFBSSxJQUFJLENBQUMsR0FBQyxTQUFTLENBQUMsRUFBQztvQkFBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFFLFNBQVMsQ0FBQyxFQUFDO3dCQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEFBQUM7d0JBQUEsSUFBRyxDQUFDLEVBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUUsU0FBUyxDQUFDLEVBQUM7NEJBQUMsT0FBTyxDQUFDLENBQUE7eUJBQUMsQ0FBRSxDQUFBO3FCQUFDLENBQUUsQUFBQztvQkFBQSxJQUFHLENBQUMsRUFBQyxPQUFPLENBQUMsR0FBQyxDQUFDLEVBQUMsT0FBTyxDQUFBO2lCQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQUMsSUFBRyxPQUFPLEtBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLE1BQUs7aUJBQUM7Z0JBQUEsQ0FBQyxDQUFDLFNBQVMsS0FBRyxDQUFDLElBQUUsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsU0FBUyxHQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxDQUFDO2FBQUM7U0FBQztRQUFDLGdCQUFnQixFQUFDO1lBQUMsUUFBUTtTQUFDO1FBQUMsSUFBSSxFQUFDO1lBQUMsS0FBSyxFQUFDLENBQUMsQ0FBQztTQUFDO0tBQUMsQUFBQztJQUFBLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO1FBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtLQUFDO0lBQUEsSUFBSSxFQUFFLEdBQUM7UUFBQyxJQUFJLEVBQUMsaUJBQWlCO1FBQUMsT0FBTyxFQUFDLENBQUMsQ0FBQztRQUFDLEtBQUssRUFBQyxNQUFNO1FBQUMsRUFBRSxFQUFDLFNBQVMsQ0FBQyxFQUFDO1lBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBQyxDQUFDLEdBQUMsS0FBSyxDQUFDLEtBQUcsQ0FBQyxJQUFFLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxDQUFDLEdBQUMsS0FBSyxDQUFDLEtBQUcsQ0FBQyxJQUFFLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFlBQVksRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxDQUFDLEdBQUMsS0FBSyxDQUFDLEtBQUcsQ0FBQyxJQUFFLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFlBQVksRUFBQyxDQUFDLEdBQUMsS0FBSyxDQUFDLEtBQUcsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUM7Z0JBQUMsUUFBUSxFQUFDLENBQUM7Z0JBQUMsWUFBWSxFQUFDLENBQUM7Z0JBQUMsT0FBTyxFQUFDLENBQUM7Z0JBQUMsV0FBVyxFQUFDLENBQUM7YUFBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLEdBQUcsS0FBRyxDQUFDLEdBQUMsR0FBRyxHQUFDLEdBQUcsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxhQUFhLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBQyxDQUFDLEdBQUMsVUFBVSxJQUFFLE9BQU8sQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsS0FBSyxFQUFDO2dCQUFDLFNBQVMsRUFBQyxDQUFDLENBQUMsU0FBUzthQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsUUFBUSxJQUFFLE9BQU8sQ0FBQyxHQUFDO2dCQUFDLFFBQVEsRUFBQyxDQUFDO2dCQUFDLE9BQU8sRUFBQyxDQUFDO2FBQUMsR0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO2dCQUFDLFFBQVEsRUFBQyxDQUFDO2dCQUFDLE9BQU8sRUFBQyxDQUFDO2FBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFDLElBQUksRUFBQyxDQUFDLEdBQUM7Z0JBQUMsQ0FBQyxFQUFDLENBQUM7Z0JBQUMsQ0FBQyxFQUFDLENBQUM7YUFBQyxBQUFDO1lBQUEsSUFBRyxDQUFDLEVBQUM7Z0JBQUMsSUFBRyxDQUFDLEVBQUM7b0JBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxHQUFDLEdBQUcsS0FBRyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsR0FBRyxLQUFHLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxHQUFHLEtBQUcsQ0FBQyxHQUFDLFFBQVEsR0FBQyxPQUFPLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsS0FBRyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxLQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUMsQ0FBQyxHQUFDLENBQUMsSUFBRSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDO3dCQUFDLEtBQUssRUFBQyxDQUFDO3dCQUFDLE1BQU0sRUFBQyxDQUFDO3FCQUFDLEVBQUMsRUFBRSxHQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsa0JBQWtCLENBQUMsR0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLGtCQUFrQixDQUFDLENBQUMsT0FBTyxHQUFDO3dCQUFDLEdBQUcsRUFBQyxDQUFDO3dCQUFDLEtBQUssRUFBQyxDQUFDO3dCQUFDLE1BQU0sRUFBQyxDQUFDO3dCQUFDLElBQUksRUFBQyxDQUFDO3FCQUFDLEVBQUMsRUFBRSxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBQyxFQUFFLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFDLEVBQUUsR0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxFQUFFLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLEVBQUUsR0FBQyxFQUFFLEdBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBQyxDQUFDLEdBQUMsRUFBRSxHQUFDLEVBQUUsR0FBQyxDQUFDLENBQUMsUUFBUSxFQUFDLEVBQUUsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxFQUFFLEdBQUMsRUFBRSxHQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUMsQ0FBQyxHQUFDLEVBQUUsR0FBQyxFQUFFLEdBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBQyxFQUFFLEdBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLElBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUMsRUFBRSxHQUFDLEVBQUUsR0FBQyxHQUFHLEtBQUcsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxTQUFTLElBQUUsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxVQUFVLElBQUUsQ0FBQyxHQUFDLENBQUMsRUFBQyxFQUFFLEdBQUMsSUFBSSxJQUFFLENBQUMsQ0FBQyxHQUFDLElBQUksSUFBRSxDQUFDLEdBQUMsS0FBSyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxFQUFFLEdBQUMsQ0FBQyxHQUFDLEVBQUUsR0FBQyxFQUFFLEVBQUMsRUFBRSxHQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsRUFBRSxHQUFDLEVBQUUsR0FBQyxFQUFFLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLEVBQUUsQ0FBQyxHQUFDLENBQUMsQ0FBQyxBQUFDO29CQUFBLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsR0FBQyxDQUFDO2lCQUFDO2dCQUFBLElBQUcsQ0FBQyxFQUFDO29CQUFDLElBQUksRUFBRSxFQUFDLEVBQUUsR0FBQyxHQUFHLEtBQUcsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsRUFBRSxHQUFDLEdBQUcsS0FBRyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxFQUFFLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLEVBQUUsR0FBQyxHQUFHLEtBQUcsQ0FBQyxHQUFDLFFBQVEsR0FBQyxPQUFPLEVBQUMsRUFBRSxHQUFDLEVBQUUsR0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUMsRUFBRSxHQUFDLEVBQUUsR0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUMsRUFBRSxHQUFDLENBQUMsQ0FBQyxLQUFHO3dCQUFDLENBQUM7d0JBQUMsQ0FBQztxQkFBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBQyxFQUFFLEdBQUMsSUFBSSxJQUFFLENBQUMsRUFBRSxHQUFDLElBQUksSUFBRSxDQUFDLEdBQUMsS0FBSyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxHQUFDLENBQUMsRUFBQyxFQUFFLEdBQUMsRUFBRSxHQUFDLEVBQUUsR0FBQyxFQUFFLEdBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBQyxFQUFFLEdBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxFQUFFLEdBQUMsRUFBRSxHQUFDLEVBQUUsR0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFDLEVBQUUsR0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLEVBQUUsRUFBQyxFQUFFLEdBQUMsQ0FBQyxJQUFFLEVBQUUsR0FBQyxTQUFTLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO3dCQUFDLElBQUksQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxBQUFDO3dCQUFBLE9BQU8sQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBO3FCQUFDLENBQUMsRUFBRSxFQUFDLEVBQUUsRUFBQyxFQUFFLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFDLEVBQUUsR0FBQyxFQUFFLEVBQUMsRUFBRSxFQUFDLENBQUMsR0FBQyxFQUFFLEdBQUMsRUFBRSxDQUFDLEFBQUM7b0JBQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxHQUFDLEVBQUU7aUJBQUM7Z0JBQUEsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDO2FBQUM7U0FBQztRQUFDLGdCQUFnQixFQUFDO1lBQUMsUUFBUTtTQUFDO0tBQUMsQUFBQztJQUFBLElBQUksRUFBRSxHQUFDO1FBQUMsSUFBSSxFQUFDLE9BQU87UUFBQyxPQUFPLEVBQUMsQ0FBQyxDQUFDO1FBQUMsS0FBSyxFQUFDLE1BQU07UUFBQyxFQUFFLEVBQUMsU0FBUyxDQUFDLEVBQUM7WUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsYUFBYSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDO2dCQUFDLENBQUM7Z0JBQUMsQ0FBQzthQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsR0FBQyxRQUFRLEdBQUMsT0FBTyxBQUFDO1lBQUEsSUFBRyxDQUFDLElBQUUsQ0FBQyxFQUFDO2dCQUFDLElBQUksQ0FBQyxHQUFDLFNBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQztvQkFBQyxPQUFPLENBQUMsQ0FBQyxRQUFRLElBQUUsT0FBTSxDQUFDLENBQUMsR0FBQyxVQUFVLElBQUUsT0FBTyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUM7d0JBQUMsU0FBUyxFQUFDLENBQUMsQ0FBQyxTQUFTO3FCQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7aUJBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLEdBQUcsS0FBRyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsR0FBRyxLQUFHLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsR0FBRyxLQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsWUFBWSxJQUFFLENBQUMsR0FBQyxDQUFDLENBQUMsV0FBVyxJQUFFLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQUFBQztnQkFBQSxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxZQUFZLEdBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7YUFBQztTQUFDO1FBQUMsTUFBTSxFQUFDLFNBQVMsQ0FBQyxFQUFDO1lBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxLQUFHLENBQUMsR0FBQyxxQkFBcUIsR0FBQyxDQUFDLEFBQUM7WUFBQSxJQUFJLElBQUUsQ0FBQyxJQUFFLENBQUMsUUFBUSxJQUFFLE9BQU8sQ0FBQyxJQUFFLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUMsQ0FBQyxDQUFDO1NBQUM7UUFBQyxRQUFRLEVBQUM7WUFBQyxlQUFlO1NBQUM7UUFBQyxnQkFBZ0IsRUFBQztZQUFDLGlCQUFpQjtTQUFDO0tBQUMsQUFBQztJQUFBLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO1FBQUMsT0FBTyxLQUFLLENBQUMsS0FBRyxDQUFDLElBQUUsQ0FBQyxDQUFDLEdBQUM7WUFBQyxDQUFDLEVBQUMsQ0FBQztZQUFDLENBQUMsRUFBQyxDQUFDO1NBQUMsQ0FBQyxFQUFDO1lBQUMsR0FBRyxFQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsQ0FBQztZQUFDLEtBQUssRUFBQyxDQUFDLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUMsQ0FBQyxDQUFDLENBQUM7WUFBQyxNQUFNLEVBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxDQUFDO1lBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsQ0FBQztTQUFDLENBQUE7S0FBQztJQUFBLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBQztRQUFDLE9BQU07WUFBQyxDQUFDO1lBQUMsQ0FBQztZQUFDLENBQUM7WUFBQyxDQUFDO1NBQUMsQ0FBQyxJQUFJLENBQUUsU0FBUyxDQUFDLEVBQUM7WUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUE7U0FBQyxDQUFFLENBQUE7S0FBQztJQUFBLElBQUksRUFBRSxHQUFDO1FBQUMsSUFBSSxFQUFDLE1BQU07UUFBQyxPQUFPLEVBQUMsQ0FBQyxDQUFDO1FBQUMsS0FBSyxFQUFDLE1BQU07UUFBQyxnQkFBZ0IsRUFBQztZQUFDLGlCQUFpQjtTQUFDO1FBQUMsRUFBRSxFQUFDLFNBQVMsQ0FBQyxFQUFDO1lBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQztnQkFBQyxjQUFjLEVBQUMsV0FBVzthQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQztnQkFBQyxXQUFXLEVBQUMsQ0FBQyxDQUFDO2FBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEFBQUM7WUFBQSxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxHQUFDO2dCQUFDLHdCQUF3QixFQUFDLENBQUM7Z0JBQUMsbUJBQW1CLEVBQUMsQ0FBQztnQkFBQyxpQkFBaUIsRUFBQyxDQUFDO2dCQUFDLGdCQUFnQixFQUFDLENBQUM7YUFBQyxFQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFDO2dCQUFDLDhCQUE4QixFQUFDLENBQUM7Z0JBQUMscUJBQXFCLEVBQUMsQ0FBQzthQUFDLENBQUM7U0FBQztLQUFDLEVBQUMsRUFBRSxHQUFDLENBQUMsQ0FBQztRQUFDLGdCQUFnQixFQUFDO1lBQUMsQ0FBQztZQUFDLENBQUM7WUFBQyxFQUFFO1lBQUMsRUFBRTtTQUFDO0tBQUMsQ0FBQyxFQUFDLEVBQUUsR0FBQztRQUFDLENBQUM7UUFBQyxDQUFDO1FBQUMsRUFBRTtRQUFDLEVBQUU7UUFBQyxFQUFFO1FBQUMsRUFBRTtRQUFDLEVBQUU7UUFBQyxFQUFFO1FBQUMsRUFBRTtLQUFDLEVBQUMsRUFBRSxHQUFDLENBQUMsQ0FBQztRQUFDLGdCQUFnQixFQUFDLEVBQUU7S0FBQyxDQUFDLEFBQUM7SUFBQSxDQUFDLENBQUMsV0FBVyxHQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsS0FBSyxHQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsYUFBYSxHQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsWUFBWSxHQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsZ0JBQWdCLEdBQUMsRUFBRSxFQUFDLENBQUMsQ0FBQyxnQkFBZ0IsR0FBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLGNBQWMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLGNBQWMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLGVBQWUsR0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLGFBQWEsR0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLGVBQWUsR0FBQyxFQUFFLEVBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUMsWUFBWSxFQUFDO1FBQUMsS0FBSyxFQUFDLENBQUMsQ0FBQztLQUFDLENBQUM7Q0FBQyxDQUFFLENBQUM7QUNNdHRtQixTQUFTLGtCQUFrQixDQUFDLEtBQWEsRUFBRSxFQUFFLEdBQUcsS0FBSyxFQUFFLEVBQUUsR0FBRyxDQUFDLEVBQUU7SUFDcEUsTUFBTSxNQUFNLEdBQUcsRUFBRSxHQUFHLElBQUksR0FBRyxJQUFJLEFBQUM7SUFFaEMsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxH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
