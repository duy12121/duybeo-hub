var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var com;
(function (com) {
    var enirva;
    (function (enirva) {
        var event;
        (function (event) {
            var Event = (function () {
                function Event(type) {
                    this.type = type;
                }
                Event.COMPLETE = "complete";
                Event.CHANGE = "change";
                return Event;
            }());
            event.Event = Event;
        })(event = enirva.event || (enirva.event = {}));
    })(enirva = com.enirva || (com.enirva = {}));
})(com || (com = {}));
var com;
(function (com) {
    var enirva;
    (function (enirva) {
        var event;
        (function (event) {
            var EventDispatcher = (function () {
                function EventDispatcher() {
                    this.listeners = new Array();
                    this.useDeltaTime = false;
                }
                EventDispatcher.prototype.addEventListener = function (type, func, scope) {
                    if (scope === void 0) { scope = null; }
                    if (!this.listeners) {
                        this.listeners = new Array();
                    }
                    this.listeners.push({ type: type, func: func, scope: scope });
                };
                EventDispatcher.prototype.removeEventListener = function (type, func) {
                    var ls = this.listeners;
                    var tmp = new Array();
                    for (var i = 0, ln = ls.length; i < ln; i++) {
                        var ob = ls[i];
                        if (ob.type != type || ob.func != func) {
                            tmp.push(ob);
                        }
                    }
                    this.listeners = tmp;
                };
                EventDispatcher.prototype.removeAllEventListener = function () {
                    this.listeners = new Array();
                };
                EventDispatcher.prototype.dispatchEvent = function (evt) {
                    var ls = this.listeners;
                    if (!ls)
                        return;
                    for (var i = 0, ln = ls.length; i < ln; i++) {
                        var ob = ls[i];
                        if (ob.type == evt.type) {
                            evt.target = this;
                            if (ob.scope) {
                                ob.func.call(ob.scope, evt);
                            }
                            else {
                                ob.func(evt);
                            }
                        }
                    }
                };
                Object.defineProperty(EventDispatcher.prototype, "onEnterFrame", {
                    set: function (func) {
                        if (this.enterFrameFunc) {
                            this.deleteEnterFrame;
                        }
                        this.enterFrameFunc = func;
                        var scope = this;
                        if (this.useDeltaTime) {
                            if (!this.isEnterFrame) {
                                this.isEnterFrame = true;
                                var current = new Date().getTime();
                                (function loop() {
                                    if (!scope.enterFrameFunc) {
                                        scope.isEnterFrame = false;
                                        return;
                                    }
                                    var tmp = new Date().getTime();
                                    var deltaTime = tmp - current;
                                    if (deltaTime <= 0) {
                                        deltaTime = 1;
                                    }
                                    scope.enterFrameFunc(deltaTime);
                                    current = tmp;
                                    scope.intervalTimer = requestAnimationFrame(function () { return loop(); });
                                })();
                            }
                        }
                        else {
                            if (!this.isEnterFrame) {
                                this.isEnterFrame = true;
                                (function loop() {
                                    if (!scope.enterFrameFunc) {
                                        scope.isEnterFrame = false;
                                        return;
                                    }
                                    scope.enterFrameFunc();
                                    scope.intervalTimer = requestAnimationFrame(function () { return loop(); });
                                })();
                            }
                        }
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(EventDispatcher.prototype, "deleteEnterFrame", {
                    get: function () {
                        this.isEnterFrame = false;
                        this.enterFrameFunc = null;
                        cancelAnimationFrame(this.intervalTimer);
                        this.intervalTimer = null;
                        return true;
                    },
                    enumerable: true,
                    configurable: true
                });
                return EventDispatcher;
            }());
            event.EventDispatcher = EventDispatcher;
        })(event = enirva.event || (enirva.event = {}));
    })(enirva = com.enirva || (com.enirva = {}));
})(com || (com = {}));
var com;
(function (com) {
    var enirva;
    (function (enirva) {
        var debug;
        (function (debug) {
            var EventDispatcher = com.enirva.event.EventDispatcher;
            var Debugger = (function (_super) {
                __extends(Debugger, _super);
                function Debugger() {
                    _super.apply(this, arguments);
                }
                Debugger.initialize = function (container) {
                    if (Debugger.initialized) {
                        return;
                    }
                    if (Debugger._instance == null) {
                        Debugger._instance = new Debugger();
                        Debugger._instance.logText = "";
                    }
                    Debugger.isDebug = true;
                    var tag = document.createElement("div");
                    tag.setAttribute("id", "ENIRVA_Debugger");
                    tag.style.position = "fixed";
                    tag.style.left = "0";
                    tag.style.bottom = "0";
                    tag.style.width = "120px";
                    tag.style.zIndex = "99999";
                    tag.style.margin = "0";
                    tag.style.padding = "5px";
                    tag.style.background = "rgba(30, 30, 30, 0.75)";
                    tag.style.minWidth = "100px";
                    var hideContainer = document.createElement("div");
                    var fps = document.createElement("p");
                    fps.style.padding = "5px";
                    fps.style.margin = "0";
                    fps.style.fontSize = Debugger.fontSize;
                    fps.style.color = Debugger.fontColor;
                    fps.style.lineHeight = "1.5";
                    fps.innerHTML = "fps:0";
                    var input = document.createElement("input");
                    input.setAttribute("type", "button");
                    input.setAttribute("value", "clear");
                    input.onclick = function () {
                        Debugger.clear();
                    };
                    var inputT1 = document.createElement("input");
                    inputT1.setAttribute("type", "text");
                    var inputT2 = document.createElement("input");
                    inputT2.setAttribute("type", "text");
                    var inputT3 = document.createElement("input");
                    inputT3.setAttribute("type", "text");
                    var inputT4 = document.createElement("input");
                    inputT4.setAttribute("type", "text");
                    var w = 100;
                    inputT1.style.width = w + "px";
                    inputT2.style.width = w + "px";
                    inputT3.style.width = w + "px";
                    var div1 = document.createElement("div");
                    var div2 = document.createElement("div");
                    var div3 = document.createElement("div");
                    var div4 = document.createElement("div");
                    var log = document.createElement("p");
                    log.style.padding = "5px";
                    log.style.margin = "0";
                    log.style.fontSize = Debugger.fontSize;
                    log.style.color = Debugger.fontColor;
                    log.style["pointer-events"] = "none";
                    log.style.lineHeight = "1.5";
                    tag.appendChild(fps);
                    tag.appendChild(hideContainer);
                    hideContainer.appendChild(input);
                    hideContainer.appendChild(div1);
                    hideContainer.appendChild(div2);
                    hideContainer.appendChild(div3);
                    hideContainer.appendChild(div4);
                    div1.appendChild(inputT1);
                    div2.appendChild(inputT2);
                    div3.appendChild(inputT3);
                    hideContainer.appendChild(log);
                    Debugger._instance.enterFrameCount = 0;
                    Debugger._instance.logTag = log;
                    Debugger._instance.fpsTag = fps;
                    Debugger._instance.inputText1 = inputT1;
                    Debugger._instance.inputText2 = inputT2;
                    Debugger._instance.inputText3 = inputT3;
                    Debugger._instance.inputText4 = inputT4;
                    Debugger._instance.minimizeHideContainer = hideContainer;
                    Debugger._instance.recFps();
                    container.appendChild(tag);
                    Debugger.initialized = true;
                };
                Object.defineProperty(Debugger, "isMinimize", {
                    get: function () {
                        return Debugger._isMinimize;
                    },
                    set: function (value) {
                        Debugger._isMinimize = value;
                        if (value) {
                            Debugger._instance.minimizeHideContainer.style.display = "none";
                        }
                        else {
                            Debugger._instance.minimizeHideContainer.style.display = "block";
                        }
                    },
                    enumerable: true,
                    configurable: true
                });
                Debugger.text = function (index, str) {
                    if (!Debugger._instance)
                        return;
                    if (Debugger.isMinimize)
                        return;
                    if (index == 0) {
                        $(Debugger._instance.inputText1).val(str);
                    }
                    else if (index == 1) {
                        $(Debugger._instance.inputText2).val(str);
                    }
                    else if (index == 2) {
                        $(Debugger._instance.inputText3).val(str);
                    }
                    else if (index == 3) {
                        $(Debugger._instance.inputText4).val(str);
                    }
                    else {
                        console.log(str);
                    }
                };
                Debugger.log = function (msg) {
                    if (Debugger.isDebug) {
                        console.log(msg);
                        Debugger._instance.logText += msg + "<br>";
                        Debugger._instance.update();
                    }
                };
                Debugger.clear = function () {
                    if (Debugger.isDebug) {
                        console.log("clear ok");
                        Debugger._instance.logText = "";
                        Debugger._instance.update();
                    }
                };
                Debugger.addEnterFrameCnt = function () {
                    Debugger._instance.enterFrameCount++;
                    Debugger.text(2, Debugger._instance.enterFrameCount);
                };
                Debugger.deleteEnterFrameCnt = function () {
                    Debugger._instance.enterFrameCount--;
                    Debugger.text(2, Debugger._instance.enterFrameCount);
                };
                Debugger.prototype.update = function () {
                    var deb = Debugger._instance;
                    deb.logTag.innerHTML = deb.logText;
                };
                Debugger.prototype.recFps = function () {
                    this.useDeltaTime = true;
                    var t = 0;
                    var cc = 0;
                    var tag = this.fpsTag;
                    this.onEnterFrame = function (deltaTime) {
                        cc++;
                        if ((t += deltaTime) >= 1000) {
                            tag.innerHTML = "fps:" + cc.toString();
                            t = 0;
                            cc = 0;
                        }
                    };
                };
                Debugger.fontSize = "0.6em";
                Debugger.fontColor = "#fff";
                return Debugger;
            }(EventDispatcher));
            debug.Debugger = Debugger;
        })(debug = enirva.debug || (enirva.debug = {}));
    })(enirva = com.enirva || (com.enirva = {}));
})(com || (com = {}));
var com;
(function (com) {
    var enirva;
    (function (enirva) {
        var util;
        (function (util) {
            var Debugger = com.enirva.debug.Debugger;
            var UserAgent = (function () {
                function UserAgent() {
                    var agent = navigator.userAgent;
                    this.isIOS = agent.indexOf('iPhone') > -1 || agent.indexOf('iPod') > -1 || agent.indexOf('iPad') > -1;
                    this.isAndroid = agent.indexOf('Android') > -1;
                    this.isIPad = agent.indexOf('iPad') > -1;
                    this.isMac = agent.indexOf('Mac') >= 0;
                    this.isPc = !(this.isIOS || this.isAndroid);
                    if (agent.indexOf('iPhone') > 0 || agent.indexOf('iPod') > 0 || agent.indexOf('Android') > 0 && agent.indexOf('Mobile') > 0) {
                    }
                    else if (agent.indexOf('iPad') > 0 || agent.indexOf('Android') > 0) {
                        this.isTablet = true;
                    }
                    else {
                    }
                    this.isMobile = this.isIOS || this.isAndroid;
                    Debugger.log("isPc = " + this.isPc);
                    Debugger.log("isIOS = " + this.isIOS);
                    Debugger.log("isAndroid = " + this.isAndroid);
                    Debugger.log("isTablet = " + this.isTablet);
                }
                Object.defineProperty(UserAgent, "instance", {
                    get: function () {
                        if (UserAgent._instance == null) {
                            UserAgent._instance = new UserAgent();
                        }
                        return UserAgent._instance;
                    },
                    enumerable: true,
                    configurable: true
                });
                return UserAgent;
            }());
            util.UserAgent = UserAgent;
        })(util = enirva.util || (enirva.util = {}));
    })(enirva = com.enirva || (com.enirva = {}));
})(com || (com = {}));
var com;
(function (com) {
    var enirva;
    (function (enirva) {
        var display;
        (function (display) {
            var EventDispatcher = com.enirva.event.EventDispatcher;
            var UserAgent = com.enirva.util.UserAgent;
            var Sprite = (function (_super) {
                __extends(Sprite, _super);
                function Sprite(target, def_props) {
                    if (def_props === void 0) { def_props = null; }
                    _super.call(this);
                    var tg = $(target);
                    this.element = tg;
                    this.useDigit = false;
                    this.x = 0;
                    this.y = 0;
                    this.alpha = 1;
                    this.scaleX = 1;
                    this.scaleY = 1;
                    this._visible = true;
                    if (def_props != null) {
                        for (var prop in def_props) {
                            this[prop] = def_props[prop];
                        }
                    }
                    this.fixedScaleX = false;
                    this.fixedScaleY = false;
                    this.currAlpha = null;
                    this.displayName = "block";
                    this.update();
                }
                Object.defineProperty(Sprite.prototype, "rotation", {
                    get: function () {
                        return this._rotation;
                    },
                    set: function (value) {
                        this._rotation = value;
                        this.updateRotation = true;
                    },
                    enumerable: true,
                    configurable: true
                });
                Sprite.prototype.setAnchor = function (x, y) {
                    var sx = x + ((x != 0) ? "%" : "");
                    var sy = y + ((y != 0) ? "%" : "");
                    this.element.css("transformOrigin", sx + " " + sy);
                };
                Sprite.prototype.update = function (use_digit) {
                    if (use_digit === void 0) { use_digit = false; }
                    var sc_x = (this.fixedScaleX) ? 1 : this.scaleX;
                    var sc_y = (this.fixedScaleY) ? 1 : this.scaleY;
                    var mtx;
                    if (UserAgent.instance.isPc) {
                        if (this.useDigit) {
                            mtx = 'matrix(' + sc_x + ', 0, 0, ' + sc_y + ", " + (this.x) + ', ' + (this.y);
                        }
                        else {
                            mtx = 'matrix(' + sc_x + ', 0, 0, ' + sc_y + ", " + (this.x >> 0) + ', ' + (this.y >> 0);
                        }
                    }
                    else {
                        if (this.useDigit) {
                            mtx = 'matrix3d(' + sc_x + ', 0, 0, 0,   0, ' + sc_y + ', 0, 0,  0, 0, 1, 0,          ' + (this.x) + ', ' + (this.y) + ', 0, 1)';
                        }
                        else {
                            mtx = 'matrix3d(' + sc_x + ', 0, 0, 0,   0, ' + sc_y + ', 0, 0,  0, 0, 1, 0,          ' + (this.x >> 0) + ', ' + (this.y >> 0) + ', 0, 1)';
                        }
                    }
                    this.element.css("transform", mtx);
                    if (this.alpha != this.currAlpha) {
                        this.element.css("opacity", this.alpha);
                        this.currAlpha = this.alpha;
                    }
                };
                ;
                Object.defineProperty(Sprite.prototype, "visible", {
                    get: function () {
                        return this._visible;
                    },
                    set: function (flag) {
                        this._visible = flag;
                        this.element.css("display", (flag) ? this.displayName : "none");
                    },
                    enumerable: true,
                    configurable: true
                });
                Sprite.prototype.destroy = function () {
                    this.element = null;
                    this.deleteEnterFrame;
                };
                return Sprite;
            }(EventDispatcher));
            display.Sprite = Sprite;
        })(display = enirva.display || (enirva.display = {}));
    })(enirva = com.enirva || (com.enirva = {}));
})(com || (com = {}));
var com;
(function (com) {
    var enirva;
    (function (enirva) {
        var event;
        (function (event) {
            var MouseEvent = (function () {
                function MouseEvent(type) {
                    this.type = type;
                }
                MouseEvent.CLICK = "click";
                return MouseEvent;
            }());
            event.MouseEvent = MouseEvent;
        })(event = enirva.event || (enirva.event = {}));
    })(enirva = com.enirva || (com.enirva = {}));
})(com || (com = {}));
var com;
(function (com) {
    var enirva;
    (function (enirva) {
        var geom;
        (function (geom) {
            var Matrix3D = (function () {
                function Matrix3D() {
                }
                Matrix3D.prototype.create = function () {
                    var m = new Float32Array(12);
                    return m;
                };
                Matrix3D.prototype.identity = function (m) {
                    m[0] = 1;
                    m[1] = 0;
                    m[2] = 0;
                    m[3] = 0;
                    m[4] = 0;
                    m[5] = 1;
                    m[6] = 0;
                    m[7] = 0;
                    m[8] = 0;
                    m[9] = 0;
                    m[10] = 1;
                    m[11] = 0;
                };
                Matrix3D.prototype.rotationX = function (m, rad) {
                    var sin_rx = Math.sin(rad);
                    var cos_rx = Math.cos(rad);
                    m[5] = cos_rx;
                    m[6] = sin_rx;
                    m[9] = -sin_rx;
                    m[10] = cos_rx;
                };
                Matrix3D.prototype.rotationY = function (m, rad) {
                    var sin_ry = Math.sin(rad);
                    var cos_ry = Math.cos(rad);
                    m[0] = cos_ry;
                    m[2] = -sin_ry;
                    m[8] = sin_ry;
                    m[10] = cos_ry;
                };
                Matrix3D.prototype.scale = function (m, scaleX, scaleY) {
                    m[0] = scaleX;
                    m[5] = scaleY;
                };
                Matrix3D.prototype.translate = function (m, positions) {
                    m[3] = positions[0];
                    m[7] = positions[1];
                    m[11] = positions[2];
                };
                Matrix3D.prototype.multiply = function (m1, m2) {
                    var d11 = m1[0], d12 = m1[1], d13 = m1[2], d14 = m1[3];
                    var d21 = m1[4], d22 = m1[5], d23 = m1[6], d24 = m1[7];
                    var d31 = m1[8], d32 = m1[9], d33 = m1[10], d34 = m1[11];
                    m1[0] = d11 * m2[0] + d12 * m2[4] + d13 * m2[8];
                    m1[1] = d11 * m2[1] + d12 * m2[5] + d13 * m2[9];
                    m1[2] = d11 * m2[2] + d12 * m2[6] + d13 * m2[10];
                    m1[3] = d11 * m2[3] + d12 * m2[7] + d13 * m2[11] + d14;
                    m1[4] = d21 * m2[0] + d22 * m2[4] + d23 * m2[8];
                    m1[5] = d21 * m2[1] + d22 * m2[5] + d23 * m2[9];
                    m1[6] = d21 * m2[2] + d22 * m2[6] + d23 * m2[10];
                    m1[7] = d21 * m2[3] + d22 * m2[7] + d23 * m2[11] + d24;
                    m1[8] = d31 * m2[0] + d32 * m2[4] + d33 * m2[8];
                    m1[9] = d31 * m2[1] + d32 * m2[5] + d33 * m2[9];
                    m1[10] = d31 * m2[2] + d32 * m2[6] + d33 * m2[10];
                    m1[11] = d31 * m2[3] + d32 * m2[7] + d33 * m2[11] + d34;
                };
                ;
                Matrix3D.prototype.getTransformString = function (m) {
                    var enc = function (val) {
                        return Math.round(val * 10000) / 10000;
                    };
                    var str = "matrix3d(";
                    str += enc(m[0]) + ", " + enc(m[1]) + ", " + enc(m[2]) + ", 0, ";
                    str += enc(m[4]) + ", " + enc(m[5]) + ", " + enc(m[6]) + ", 0, ";
                    str += enc(m[8]) + ", " + enc(m[9]) + ", " + enc(m[10]) + ", 0, ";
                    str += enc(m[3]) + ", " + enc(m[7]) + ", " + enc(m[11]) + ", 1)";
                    return str;
                };
                return Matrix3D;
            }());
            geom.Matrix3D = Matrix3D;
        })(geom = enirva.geom || (enirva.geom = {}));
    })(enirva = com.enirva || (com.enirva = {}));
})(com || (com = {}));
var com;
(function (com) {
    var enirva;
    (function (enirva) {
        var geom;
        (function (geom) {
            var Rectangle = (function () {
                function Rectangle(x, y, width, height) {
                    if (x === void 0) { x = 0; }
                    if (y === void 0) { y = 0; }
                    if (width === void 0) { width = 0; }
                    if (height === void 0) { height = 0; }
                    this.x = x;
                    this.y = y;
                    this.width = width;
                    this.height = height;
                }
                Rectangle.prototype.toString = function () {
                    return "x = " + this.x + " y = " + this.y + " width = " + this.width + " height = " + this.height;
                };
                return Rectangle;
            }());
            geom.Rectangle = Rectangle;
        })(geom = enirva.geom || (enirva.geom = {}));
    })(enirva = com.enirva || (com.enirva = {}));
})(com || (com = {}));
var com;
(function (com) {
    var enirva;
    (function (enirva) {
        var geom;
        (function (geom) {
            var Vector2 = (function () {
                function Vector2(x, y) {
                    if (x === void 0) { x = 0; }
                    if (y === void 0) { y = 0; }
                    this.x = x;
                    this.y = y;
                }
                return Vector2;
            }());
            geom.Vector2 = Vector2;
        })(geom = enirva.geom || (enirva.geom = {}));
    })(enirva = com.enirva || (com.enirva = {}));
})(com || (com = {}));
var com;
(function (com) {
    var enirva;
    (function (enirva) {
        var geom;
        (function (geom) {
            var Vector3 = (function () {
                function Vector3(x, y, z) {
                    if (x === void 0) { x = 0; }
                    if (y === void 0) { y = 0; }
                    if (z === void 0) { z = 0; }
                    this.x = x;
                    this.y = y;
                    this.z = z;
                }
                return Vector3;
            }());
            geom.Vector3 = Vector3;
        })(geom = enirva.geom || (enirva.geom = {}));
    })(enirva = com.enirva || (com.enirva = {}));
})(com || (com = {}));
var com;
(function (com) {
    var enirva;
    (function (enirva) {
        var net;
        (function (net) {
            var EventDispatcher = com.enirva.event.EventDispatcher;
            var Event = com.enirva.event.Event;
            var URLLoader = (function (_super) {
                __extends(URLLoader, _super);
                function URLLoader() {
                    _super.call(this);
                }
                URLLoader.prototype.load = function (request) {
                    var scope = this;
                    $(function () {
                        $.ajax({
                            url: request.url,
                            type: "GET",
                            dataType: "html",
                            timeout: 2000,
                            error: function () {
                                console.log("load error");
                            },
                            success: function (text) {
                                scope.data = text;
                                var evt = new Event(Event.COMPLETE);
                                scope.dispatchEvent(evt);
                            }
                        });
                    });
                };
                return URLLoader;
            }(EventDispatcher));
            net.URLLoader = URLLoader;
        })(net = enirva.net || (enirva.net = {}));
    })(enirva = com.enirva || (com.enirva = {}));
})(com || (com = {}));
var com;
(function (com) {
    var enirva;
    (function (enirva) {
        var net;
        (function (net) {
            var URLRequest = (function () {
                function URLRequest(url) {
                    if (url === void 0) { url = null; }
                    this.url = url;
                }
                return URLRequest;
            }());
            net.URLRequest = URLRequest;
        })(net = enirva.net || (enirva.net = {}));
    })(enirva = com.enirva || (com.enirva = {}));
})(com || (com = {}));
var com;
(function (com) {
    var enirva;
    (function (enirva) {
        var net;
        (function (net) {
            var EventDispatcher = com.enirva.event.EventDispatcher;
            var Event = com.enirva.event.Event;
            var MultipleImageLoader = (function (_super) {
                __extends(MultipleImageLoader, _super);
                function MultipleImageLoader() {
                    _super.call(this);
                    this.percent = 0;
                    this.loadIndex = 0;
                    this.imageRequests = {};
                    this.imageRequestsArray = [];
                }
                MultipleImageLoader.prototype.addRequestURL = function (urls) {
                    for (var i = 0, ln = urls.length; i < ln; i++) {
                        var url = urls[i];
                        if (this.imageRequests[url] == null) {
                            this.imageRequestsArray.push(url);
                        }
                        this.imageRequests[url] = url;
                    }
                };
                MultipleImageLoader.prototype.load = function () {
                    if (this.imageRequestsArray.length > 0) {
                        this.loadImage();
                    }
                };
                MultipleImageLoader.prototype.loadImage = function () {
                    var scope = this;
                    var url = this.imageRequestsArray[this.loadIndex];
                    var img = new Image();
                    img.onload = function () {
                        scope.completeHandler(url, img);
                    };
                    img.src = url;
                };
                MultipleImageLoader.prototype.completeHandler = function (url, img) {
                    this.imageRequests[url] = img;
                    ++this.loadIndex;
                    var ln = this.imageRequestsArray.length;
                    this.percent = this.loadIndex / ln;
                    if (this.loadIndex >= ln) {
                        var evt = new Event(Event.COMPLETE);
                        this.dispatchEvent(evt);
                    }
                    else {
                        this.loadImage();
                    }
                };
                return MultipleImageLoader;
            }(EventDispatcher));
            net.MultipleImageLoader = MultipleImageLoader;
        })(net = enirva.net || (enirva.net = {}));
    })(enirva = com.enirva || (com.enirva = {}));
})(com || (com = {}));
var com;
(function (com) {
    var enirva;
    (function (enirva) {
        var net;
        (function (net) {
            var EventDispatcher = com.enirva.event.EventDispatcher;
            var Event = com.enirva.event.Event;
            var MultipleLoader = (function (_super) {
                __extends(MultipleLoader, _super);
                function MultipleLoader() {
                    _super.call(this);
                    this.percent = 0;
                    this.loadIndex = 0;
                    this.textRequests = {};
                    this.textRequestsArray = [];
                }
                MultipleLoader.prototype.addRequestURL = function (urls) {
                    for (var i = 0, ln = urls.length; i < ln; i++) {
                        var url = urls[i];
                        this.textRequests[url] = url;
                        this.textRequestsArray.push(url);
                    }
                };
                MultipleLoader.prototype.load = function () {
                    if (this.isParallel) {
                        if (this.textRequestsArray.length > 0) {
                            for (var i = 0, ln = this.textRequestsArray.length; i < ln; i++) {
                                this.loadTextParallel(i);
                            }
                        }
                    }
                    else {
                        if (this.textRequestsArray.length > 0) {
                            this.loadText();
                        }
                    }
                };
                MultipleLoader.prototype.loadText = function () {
                    var scope = this;
                    var url = this.textRequestsArray[this.loadIndex];
                    var req = new net.URLRequest(url);
                    var loader = new net.URLLoader();
                    loader.addEventListener(Event.COMPLETE, function (e) {
                        scope.completeHandler(url, loader.data);
                    });
                    loader.load(req);
                };
                MultipleLoader.prototype.completeHandler = function (url, data) {
                    this.textRequests[url] = data;
                    ++this.loadIndex;
                    var ln = this.textRequestsArray.length;
                    this.percent = this.loadIndex / ln;
                    if (this.loadIndex >= ln) {
                        var evt = new Event(Event.COMPLETE);
                        this.dispatchEvent(evt);
                    }
                    else {
                        this.loadText();
                    }
                };
                MultipleLoader.prototype.loadTextParallel = function (index) {
                    var scope = this;
                    var url = this.textRequestsArray[index];
                    var req = new net.URLRequest(url);
                    var loader = new net.URLLoader();
                    loader.addEventListener(Event.COMPLETE, function (e) {
                        scope.completeHandlerParallel(url, loader.data);
                    });
                    loader.load(req);
                };
                MultipleLoader.prototype.completeHandlerParallel = function (url, data) {
                    this.textRequests[url] = data;
                    ++this.loadIndex;
                    var ln = this.textRequestsArray.length;
                    this.percent = this.loadIndex / ln;
                    if (this.loadIndex >= ln) {
                        var evt = new Event(Event.COMPLETE);
                        this.dispatchEvent(evt);
                    }
                };
                return MultipleLoader;
            }(EventDispatcher));
            net.MultipleLoader = MultipleLoader;
        })(net = enirva.net || (enirva.net = {}));
    })(enirva = com.enirva || (com.enirva = {}));
})(com || (com = {}));
var com;
(function (com) {
    var enirva;
    (function (enirva) {
        var tween;
        (function (tween) {
            var Debugger = com.enirva.debug.Debugger;
            var Tween = (function () {
                function Tween() {
                }
                Tween.fadeIn = function (spt, sp, cb_func, end) {
                    if (sp === void 0) { sp = null; }
                    if (cb_func === void 0) { cb_func = null; }
                    if (end === void 0) { end = 1; }
                    sp = (sp != null) ? sp : 0.1;
                    var thre = end - 0.02;
                    if (spt.useDeltaTime) {
                        var dsp = sp;
                        var cc = 0;
                        spt.onEnterFrame = function (deltaTime) {
                            dsp = sp * (deltaTime / 16);
                            Debugger.text(2, spt.alpha + " " + cc++);
                            if ((spt.alpha += dsp) >= thre) {
                                spt.alpha = end;
                                spt.deleteEnterFrame;
                                if (cb_func) {
                                    cb_func();
                                }
                            }
                            spt.update();
                        };
                    }
                    else {
                        spt.onEnterFrame = function () {
                            if ((spt.alpha += sp) >= thre) {
                                spt.alpha = end;
                                spt.deleteEnterFrame;
                                if (cb_func) {
                                    cb_func();
                                }
                            }
                            spt.update();
                        };
                    }
                };
                Tween.fadeOut = function (spt, sp, cb_func, end) {
                    if (sp === void 0) { sp = null; }
                    if (cb_func === void 0) { cb_func = null; }
                    if (end === void 0) { end = 0; }
                    sp = (sp != null) ? sp : 0.1;
                    var thre = end + 0.02;
                    if (spt.useDeltaTime) {
                        var dsp = sp;
                        spt.onEnterFrame = function (deltaTime) {
                            dsp = sp * (deltaTime / 16);
                            if ((spt.alpha -= sp) <= thre) {
                                spt.alpha = end;
                                spt.deleteEnterFrame;
                                if (cb_func) {
                                    cb_func();
                                }
                            }
                            spt.update();
                        };
                    }
                    else {
                        spt.onEnterFrame = function () {
                            if ((spt.alpha -= sp) <= thre) {
                                spt.alpha = end;
                                spt.deleteEnterFrame;
                                if (cb_func) {
                                    cb_func();
                                }
                            }
                            spt.update();
                        };
                    }
                };
                Tween.motion = function (spt, prop_array, end_array, sp, delay, threshold, cb_func) {
                    if (delay === void 0) { delay = null; }
                    if (threshold === void 0) { threshold = null; }
                    if (cb_func === void 0) { cb_func = null; }
                    var sa = 0;
                    var curr = {};
                    var tmps = {};
                    var end = {};
                    var ln = prop_array.length;
                    var diff = (threshold) ? threshold : 0.002;
                    for (var i = 0; i < ln; i++) {
                        var prop = prop_array[i];
                        curr[prop] = spt[prop];
                        tmps[prop] = 0;
                        end[prop] = end_array[i];
                    }
                    var flag = true;
                    var cc = 0;
                    if (delay != null) {
                        cc = delay;
                    }
                    spt.onEnterFrame = function () {
                        if (--cc <= 0) {
                            spt.deleteEnterFrame;
                            spt.onEnterFrame = function () {
                                sa += sp;
                                flag = true;
                                for (var prop in curr) {
                                    curr[prop] += tmps[prop] = (end[prop] - curr[prop]) * sa;
                                    if (Math.abs(tmps[prop]) < diff) {
                                        curr[prop] = end[prop];
                                    }
                                    else {
                                        flag = false;
                                    }
                                    spt[prop] = curr[prop];
                                    spt.update();
                                }
                                if (flag) {
                                    spt.deleteEnterFrame;
                                    if (cb_func) {
                                        cb_func();
                                    }
                                }
                            };
                        }
                    };
                };
                Tween.motionSpring = function (spt, prop_array, end_array, sp1, sp2, limit, delay, cb_func) {
                    if (limit === void 0) { limit = null; }
                    if (delay === void 0) { delay = 0; }
                    if (cb_func === void 0) { cb_func = null; }
                    var curr = {};
                    var tmps = {};
                    var end = {};
                    var ln = prop_array.length;
                    var lim = (limit) ? limit : 0.006;
                    for (var i = 0; i < ln; i++) {
                        var prop = prop_array[i];
                        curr[prop] = spt[prop];
                        tmps[prop] = 0;
                        end[prop] = end_array[i];
                    }
                    var flag = true;
                    var sceneIndex = 0;
                    var cc = 0;
                    spt.onEnterFrame = function () {
                        switch (sceneIndex) {
                            case 0:
                                if (++cc >= delay) {
                                    sceneIndex = 1;
                                }
                                break;
                            case 1:
                                flag = true;
                                for (var prop in curr) {
                                    curr[prop] += tmps[prop] = (end[prop] - curr[prop]) / sp1 + tmps[prop] * sp2;
                                    if (Math.abs(tmps[prop]) < lim) {
                                        curr[prop] = end[prop];
                                    }
                                    else {
                                        flag = false;
                                    }
                                    spt[prop] = curr[prop];
                                    spt.update();
                                }
                                if (flag) {
                                    spt.deleteEnterFrame;
                                    if (cb_func) {
                                        cb_func();
                                    }
                                }
                                break;
                            default: break;
                        }
                    };
                };
                Tween.delay = function (spt, time, cb_func) {
                    if (cb_func === void 0) { cb_func = null; }
                    spt.onEnterFrame = function () {
                        if (--time <= 0) {
                            spt.deleteEnterFrame;
                            if (cb_func != null) {
                                cb_func();
                            }
                        }
                    };
                };
                Tween.flash = function (spt, minAlp, maxAlp, sp) {
                    var curr = spt.alpha;
                    var r = 0;
                    var fric = (maxAlp - minAlp) / 2;
                    var base = minAlp + fric;
                    spt.onEnterFrame = function () {
                        curr = Math.sin(r += sp) * fric + base;
                        spt.alpha = curr;
                        spt.update();
                    };
                };
                return Tween;
            }());
            tween.Tween = Tween;
        })(tween = enirva.tween || (enirva.tween = {}));
    })(enirva = com.enirva || (com.enirva = {}));
})(com || (com = {}));
var com;
(function (com) {
    var enirva;
    (function (enirva) {
        var util;
        (function (util) {
            var CSSUtil = (function () {
                function CSSUtil() {
                }
                CSSUtil.applyStyle = function (target, styles) {
                    for (var prop in styles) {
                        if (prop == "customAutoWidth") {
                            target.css("width", "auto");
                            console.log(">> " + target.width());
                            target.css("width", target.width());
                        }
                        else {
                            target.css(prop, styles[prop]);
                        }
                    }
                };
                return CSSUtil;
            }());
            util.CSSUtil = CSSUtil;
        })(util = enirva.util || (enirva.util = {}));
    })(enirva = com.enirva || (com.enirva = {}));
})(com || (com = {}));
var com;
(function (com) {
    var enirva;
    (function (enirva) {
        var webgl;
        (function (webgl) {
            var core;
            (function (core) {
                var WebGLContext = (function () {
                    function WebGLContext(containerId, w, h) {
                        var canvas = document.createElement("canvas");
                        canvas.setAttribute("width", w.toString());
                        canvas.setAttribute("height", h.toString());
                        document.getElementById(containerId).appendChild(canvas);
                        var gl = (canvas.getContext("webgl")
                            || canvas.getContext("experimental-webgl"));
                        gl.clearColor(0.0, 0.0, 0.0, 1.0);
                        gl.enable(gl.DEPTH_TEST);
                        this.gl = gl;
                        this.canvas = canvas;
                        this.programs = [];
                    }
                    WebGLContext.prototype.linkProgram = function (vShader, fShader) {
                        var gl = this.gl;
                        var fragmentShader = this.getShader(vShader, gl.VERTEX_SHADER);
                        var vertexShader = this.getShader(fShader, gl.FRAGMENT_SHADER);
                        var shaderProgram = gl.createProgram();
                        gl.attachShader(shaderProgram, vertexShader);
                        gl.attachShader(shaderProgram, fragmentShader);
                        gl.linkProgram(shaderProgram);
                        gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);
                        gl.useProgram(shaderProgram);
                        this.program = shaderProgram;
                        this.programs.push(shaderProgram);
                    };
                    WebGLContext.prototype.addProgram = function (vShader, fShader) {
                        var gl = this.gl;
                        var fragmentShader = this.getShader(vShader, gl.VERTEX_SHADER);
                        var vertexShader = this.getShader(fShader, gl.FRAGMENT_SHADER);
                        var shaderProgram = gl.createProgram();
                        gl.attachShader(shaderProgram, vertexShader);
                        gl.attachShader(shaderProgram, fragmentShader);
                        gl.linkProgram(shaderProgram);
                        gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);
                        this.programs.push(shaderProgram);
                    };
                    WebGLContext.prototype.changeProgram = function (index) {
                        this.program = this.programs[index];
                        this.gl.useProgram(this.program);
                    };
                    WebGLContext.prototype.getShader = function (text, type) {
                        var gl = this.gl;
                        var shader = shader = gl.createShader(type);
                        gl.shaderSource(shader, text);
                        gl.compileShader(shader);
                        gl.getShaderParameter(shader, gl.COMPILE_STATUS);
                        return shader;
                    };
                    return WebGLContext;
                }());
                core.WebGLContext = WebGLContext;
            })(core = webgl.core || (webgl.core = {}));
        })(webgl = enirva.webgl || (enirva.webgl = {}));
    })(enirva = com.enirva || (com.enirva = {}));
})(com || (com = {}));
var com;
(function (com) {
    var enirva;
    (function (enirva) {
        var webgl;
        (function (webgl) {
            var net;
            (function (net) {
                var MultipleLwoLoader = (function () {
                    function MultipleLwoLoader() {
                    }
                    return MultipleLwoLoader;
                }());
                net.MultipleLwoLoader = MultipleLwoLoader;
            })(net = webgl.net || (webgl.net = {}));
        })(webgl = enirva.webgl || (enirva.webgl = {}));
    })(enirva = com.enirva || (com.enirva = {}));
})(com || (com = {}));
var com;
(function (com) {
    var enirva;
    (function (enirva) {
        var webgl;
        (function (webgl) {
            var util;
            (function (util) {
                var Utils = (function () {
                    function Utils() {
                    }
                    Utils.setAttribute = function (gl, vbo, attL, attS) {
                        for (var i in vbo) {
                            gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);
                            gl.enableVertexAttribArray(attL[i]);
                            gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
                        }
                    };
                    Utils.createSaveBufferFloat = function (gl, data) {
                        var buffer = gl.createBuffer();
                        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
                        return buffer;
                    };
                    Utils.createSaveBufferUint = function (gl, data) {
                        var buffer = gl.createBuffer();
                        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
                        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
                        return buffer;
                    };
                    Utils.handleLoadedTexture = function (gl, texture, img) {
                        gl.bindTexture(gl.TEXTURE_2D, texture);
                        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                        gl.bindTexture(gl.TEXTURE_2D, null);
                    };
                    Utils.createUniform = function (gl, program, name) {
                        var uniform = gl.getUniformLocation(program, name);
                        return uniform;
                    };
                    return Utils;
                }());
                util.Utils = Utils;
            })(util = webgl.util || (webgl.util = {}));
        })(webgl = enirva.webgl || (enirva.webgl = {}));
    })(enirva = com.enirva || (com.enirva = {}));
})(com || (com = {}));
