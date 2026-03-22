var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var nikken;
(function (nikken) {
    var model;
    (function (model) {
        var Stage = (function () {
            function Stage(singleton) {
            }
            Stage.initialize = function () {
                if (Stage._instance == null) {
                    Stage._instance = new Stage(new StageSingleton());
                    Stage._instance._stageWidth = window.innerWidth;
                    Stage._instance._stageHeight = window.innerHeight;
                    $(window).bind("resize", function () {
                        Stage._instance._stageWidth = window.innerWidth;
                        Stage._instance._stageHeight = window.innerHeight;
                    });
                }
            };
            Object.defineProperty(Stage, "currentScrollPosition", {
                get: function () {
                    return this._instance._currentScrollPosition;
                },
                set: function (value) {
                    this._instance._currentScrollPosition = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Stage, "currentWidth", {
                get: function () {
                    return this._instance._stageWidth;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Stage, "currentHeight", {
                get: function () {
                    return this._instance._stageHeight;
                },
                enumerable: true,
                configurable: true
            });
            return Stage;
        }());
        model.Stage = Stage;
        var StageSingleton = (function () {
            function StageSingleton() {
            }
            return StageSingleton;
        }());
    })(model = nikken.model || (nikken.model = {}));
})(nikken || (nikken = {}));
var nikken;
(function (nikken) {
    var view;
    (function (view) {
        var parts;
        (function (parts) {
            var EventDispatcher = com.enirva.event.EventDispatcher;
            var Event = com.enirva.event.Event;
            var MultipleImageLoader = com.enirva.net.MultipleImageLoader;
            var LogoCreator = (function (_super) {
                __extends(LogoCreator, _super);
                function LogoCreator(target) {
                    _super.call(this);
                    this.useDeltaTime = true;
                    this.target = target;
                }
                LogoCreator.prototype.load = function (callback) {
                    var urls = [];
                    for (var i = 1; i <= 72; i++) {
                        var numStr;
                        if (i < 10) {
                            numStr = "0" + i.toString();
                        }
                        else {
                            numStr = i.toString();
                        }
                        urls.push("images/logo/" + numStr + ".jpg");
                    }
                    var scope = this;
                    this.images = [];
                    var loader = new MultipleImageLoader();
                    loader.addRequestURL(urls);
                    loader.addEventListener(Event.COMPLETE, function () {
                        for (var i = (urls.length - 1); i >= 0; i--) {
                            var img = $(loader.imageRequests[urls[i]]);
                            scope.target.append(img);
                        }
                        for (var i = 0; i < urls.length; i++) {
                            var img = $(loader.imageRequests[urls[i]]);
                            scope.images.push(img);
                        }
                        callback();
                    });
                    loader.load();
                };
                LogoCreator.prototype.play = function (callback) {
                    var scope = this;
                    var curr = 0;
                    var time = 0;
                    this.images[curr].addClass("selected");
                    this.onEnterFrame = function (deltaTime) {
                        time += deltaTime;
                        if (time >= 33.33333) {
                            time = 0;
                            var next = curr + 1;
                            if (next >= scope.images.length) {
                                curr = 0;
                                scope.deleteEnterFrame;
                                callback();
                            }
                            else {
                                scope.images[curr].css("display", "none");
                                curr = next;
                            }
                        }
                    };
                };
                return LogoCreator;
            }(EventDispatcher));
            parts.LogoCreator = LogoCreator;
        })(parts = view.parts || (view.parts = {}));
    })(view = nikken.view || (nikken.view = {}));
})(nikken || (nikken = {}));
var nikken;
(function (nikken) {
    var view;
    (function (view) {
        var parts;
        (function (parts) {
            var EventDispatcher = com.enirva.event.EventDispatcher;
            var Sprite = com.enirva.display.Sprite;
            var Tween = com.enirva.tween.Tween;
            var ScrollIcons = (function (_super) {
                __extends(ScrollIcons, _super);
                function ScrollIcons() {
                    _super.call(this);
                }
                ScrollIcons.prototype.show = function (callback) {
                    var scope = this;
                    $(".attentionBar").fadeIn(1000, function () {
                        callback();
                        scope.scrollAnim();
                    });
                    $(".mouseIcon").fadeIn(1000);
                    var label = new Sprite($(".mouseIcon .label"));
                    label.y = 10;
                    label.useDigit = true;
                    label.update();
                    var icon = new Sprite($(".mouseIcon .icon"));
                    icon.y = 10;
                    label.useDigit = true;
                    icon.update();
                    Tween.motion(label, ["y"], [0], 0.0005, 5, 0.000001);
                    Tween.motion(icon, ["y"], [0], 0.0005, 10, 0.000001);
                };
                ScrollIcons.prototype.scrollAnim = function () {
                    var scope = this;
                    var tg = $(".attentionBar div");
                    var y = -50;
                    var incCount = 0;
                    this.onEnterFrame = function () {
                        y += 2;
                        tg.css("top", y);
                        if (y >= 100) {
                            y = -50;
                            tg.css("top", y);
                        }
                    };
                };
                return ScrollIcons;
            }(EventDispatcher));
            parts.ScrollIcons = ScrollIcons;
        })(parts = view.parts || (view.parts = {}));
    })(view = nikken.view || (nikken.view = {}));
})(nikken || (nikken = {}));
var nikken;
(function (nikken) {
    var view;
    (function (view) {
        var parts;
        (function (parts) {
            var EventDispatcher = com.enirva.event.EventDispatcher;
            var Indicator = (function (_super) {
                __extends(Indicator, _super);
                function Indicator() {
                    _super.call(this);
                    this.currentIndex = -1;
                }
                Indicator.prototype.change = function (nextIndex) {
                    if (this.currentIndex != nextIndex) {
                        this.currentIndex = nextIndex;
                        $(".indicator li").each(function (index, elem) {
                            if (nextIndex == index) {
                                $(elem).addClass("selected");
                            }
                            else {
                                $(elem).removeClass("selected");
                            }
                        });
                    }
                };
                return Indicator;
            }(EventDispatcher));
            parts.Indicator = Indicator;
        })(parts = view.parts || (view.parts = {}));
    })(view = nikken.view || (nikken.view = {}));
})(nikken || (nikken = {}));
var nikken;
(function (nikken) {
    var view;
    (function (view) {
        var parts;
        (function (parts) {
            var parallax;
            (function (parallax) {
                var EventDispatcher = com.enirva.event.EventDispatcher;
                var UserAgent = com.enirva.util.UserAgent;
                var Debugger = com.enirva.debug.Debugger;
                var Sprite = com.enirva.display.Sprite;
                var Stage = nikken.model.Stage;
                var ParallaxItemBase = (function (_super) {
                    __extends(ParallaxItemBase, _super);
                    function ParallaxItemBase(target, depth) {
                        _super.call(this);
                        this.depth = depth;
                        this.hideDiffY = 200;
                        this.imgHeight2 = target.height() / 2;
                        this.imgY = parseFloat(target.css("top"));
                        this.imgMaxY = this.imgY;
                        this.spt = new Sprite(target);
                        this.spt.useDigit = true;
                        this.state = 0;
                        this.upAppearPos = (UserAgent.instance.isMobile) ? 0 : 50;
                    }
                    ParallaxItemBase.prototype.show = function () {
                    };
                    ParallaxItemBase.prototype.hide = function () {
                    };
                    ParallaxItemBase.prototype.update = function (h, h2, show_h) {
                        if ((this.imgMaxY + 400) < Stage.currentScrollPosition) {
                            if (this.isShow) {
                                this.isShow = false;
                                this.hide();
                                this.state = 2;
                                if (this.isDebug) {
                                    Debugger.text(1, "上に出ている");
                                }
                            }
                        }
                        else if ((this.imgY - this.hideDiffY) > (Stage.currentScrollPosition + (h2 * 2))) {
                            if (this.isShow) {
                                this.isShow = false;
                                this.hide();
                                this.state = 0;
                                if (this.isDebug) {
                                    Debugger.text(1, "下に隠れた");
                                }
                            }
                        }
                        else {
                            if (!this.isShow) {
                                if (this.state == 0) {
                                    if ((Stage.currentScrollPosition + show_h) > this.imgY) {
                                        this.isShow = true;
                                        this.show();
                                        this.state = 1;
                                        if (this.isDebug) {
                                            Debugger.text(1, "下から出てきた");
                                        }
                                    }
                                }
                                else if (this.state == 2) {
                                    if ((Stage.currentScrollPosition + this.upAppearPos) < this.imgMaxY) {
                                        this.isShow = true;
                                        this.show();
                                        this.state = 1;
                                        if (this.isDebug) {
                                            Debugger.text(1, "上から出てきた");
                                        }
                                    }
                                }
                            }
                            if (!this.ignoreParallax) {
                                var val = ((Stage.currentScrollPosition + h2) - (this.imgY + this.imgHeight2));
                                var end = val * this.depth;
                                this.spt.y += (end - this.spt.y) / 5;
                                this.spt.update();
                            }
                        }
                    };
                    return ParallaxItemBase;
                }(EventDispatcher));
                parallax.ParallaxItemBase = ParallaxItemBase;
            })(parallax = parts.parallax || (parts.parallax = {}));
        })(parts = view.parts || (view.parts = {}));
    })(view = nikken.view || (nikken.view = {}));
})(nikken || (nikken = {}));
var nikken;
(function (nikken) {
    var view;
    (function (view) {
        var parts;
        (function (parts) {
            var parallax;
            (function (parallax) {
                var ParallaxItemBase = nikken.view.parts.parallax.ParallaxItemBase;
                var ItemPhoto = (function (_super) {
                    __extends(ItemPhoto, _super);
                    function ItemPhoto(target, depth) {
                        _super.call(this, target, depth);
                    }
                    ItemPhoto.prototype.show = function () {
                        this.spt.element.addClass("photoOn");
                    };
                    ItemPhoto.prototype.hide = function () {
                        this.spt.element.removeClass("photoOn");
                    };
                    return ItemPhoto;
                }(ParallaxItemBase));
                parallax.ItemPhoto = ItemPhoto;
            })(parallax = parts.parallax || (parts.parallax = {}));
        })(parts = view.parts || (view.parts = {}));
    })(view = nikken.view || (nikken.view = {}));
})(nikken || (nikken = {}));
var nikken;
(function (nikken) {
    var view;
    (function (view) {
        var parts;
        (function (parts) {
            var parallax;
            (function (parallax) {
                var ParallaxItemBase = nikken.view.parts.parallax.ParallaxItemBase;
                var ItemText = (function (_super) {
                    __extends(ItemText, _super);
                    function ItemText(target, depth) {
                        _super.call(this, target, depth);
                        this.textLines = [];
                        var scope = this;
                        $(target).find(".line").each(function (index, elem) {
                            scope.textLines.push($(elem));
                        });
                    }
                    ItemText.prototype.show = function () {
                        for (var i = 0, ln = this.textLines.length; i < ln; i++) {
                            this.textLines[i].css("transition-delay", (i * 0.3) + "s");
                            this.textLines[i].addClass("lineOn");
                        }
                    };
                    return ItemText;
                }(ParallaxItemBase));
                parallax.ItemText = ItemText;
            })(parallax = parts.parallax || (parts.parallax = {}));
        })(parts = view.parts || (view.parts = {}));
    })(view = nikken.view || (nikken.view = {}));
})(nikken || (nikken = {}));
var nikken;
(function (nikken) {
    var view;
    (function (view) {
        var parts;
        (function (parts) {
            var parallax;
            (function (parallax) {
                var Tween = com.enirva.tween.Tween;
                var ParallaxItemBase = nikken.view.parts.parallax.ParallaxItemBase;
                var ItemKerningText = (function (_super) {
                    __extends(ItemKerningText, _super);
                    function ItemKerningText(target, depth) {
                        _super.call(this, target, depth);
                        this.spt.alpha = 0;
                        this.spt.update();
                    }
                    ItemKerningText.prototype.show = function () {
                        var scope = this;
                        Tween.fadeIn(this.spt, 0.01, function () {
                            scope.spt.element.addClass("kerningTextOff");
                        });
                        var scope = this;
                        var startAnim = false;
                        this.spt.onEnterFrame = function () {
                            scope.spt.alpha += 0.01;
                            scope.spt.update();
                            if (!startAnim) {
                                if (scope.spt.alpha > 0.6) {
                                    startAnim = true;
                                    scope.spt.element.addClass("kerningTextOff");
                                }
                            }
                            if (scope.spt.alpha >= 1) {
                                scope.spt.deleteEnterFrame;
                            }
                        };
                    };
                    return ItemKerningText;
                }(ParallaxItemBase));
                parallax.ItemKerningText = ItemKerningText;
            })(parallax = parts.parallax || (parts.parallax = {}));
        })(parts = view.parts || (view.parts = {}));
    })(view = nikken.view || (nikken.view = {}));
})(nikken || (nikken = {}));
var nikken;
(function (nikken) {
    var view;
    (function (view) {
        var parts;
        (function (parts) {
            var parallax;
            (function (parallax) {
                var UserAgent = com.enirva.util.UserAgent;
                var Sprite = com.enirva.display.Sprite;
                var Tween = com.enirva.tween.Tween;
                var Stage = nikken.model.Stage;
                var ParallaxItemBase = nikken.view.parts.parallax.ParallaxItemBase;
                var ItemKerningImage = (function (_super) {
                    __extends(ItemKerningImage, _super);
                    function ItemKerningImage(target, depth) {
                        _super.call(this, target, depth);
                        if (UserAgent.instance.isMobile) {
                            this.imgMaxY = this.imgY + 500;
                        }
                        else {
                            this.imgMaxY = this.imgY + 800;
                        }
                        this.hideDiffY = 50;
                        this.words = [];
                        var scope = this;
                        this.defaultY = parseFloat(target.css("top"));
                        this.currentOffsetY = this.defaultY;
                        $(target).find("span").each(function (index, elem) {
                            var word = new Sprite($(elem));
                            word.useDigit = true;
                            scope.words.push(word);
                            var x = parseFloat(word.element.css("left"));
                            word.deleteEnterFrame;
                            word.x = x * 0.05;
                            word.update();
                        });
                        this.spt.update();
                        this.ignoreParallax = true;
                    }
                    ItemKerningImage.prototype.show = function () {
                        var scope = this;
                        var scope = this;
                        var startAnim = false;
                        this.spt.onEnterFrame = function () {
                            scope.spt.alpha += 0.01;
                            scope.spt.update();
                            if (!startAnim) {
                                if (scope.spt.alpha > 0.3) {
                                    startAnim = true;
                                    for (var i = 0, ln = scope.words.length; i < ln; i++) {
                                        var word = scope.words[i];
                                        Tween.motion(word, ["x"], [0], 0.0002, null, 0.00001);
                                    }
                                }
                            }
                            if (scope.spt.alpha >= 1) {
                                scope.spt.deleteEnterFrame;
                            }
                        };
                    };
                    ItemKerningImage.prototype.hide = function () {
                        var scope = this;
                        Tween.fadeOut(this.spt, 0.05, function () {
                            for (var i = 0, ln = scope.words.length; i < ln; i++) {
                                var word = scope.words[i];
                                var x = parseFloat(word.element.css("left"));
                                word.x = x * 0.05;
                                word.update();
                            }
                        });
                    };
                    ItemKerningImage.prototype.unFixedTopSp = function (currY) {
                        this.spt.element.css("top", this.defaultY);
                        this.currentOffsetY = this.defaultY;
                    };
                    ItemKerningImage.prototype.unFixedBottomSp = function (currY, blankStopPos) {
                        this.spt.element.css("top", this.defaultY + (Stage.blankH));
                        this.currentOffsetY = this.defaultY + (Stage.blankH);
                    };
                    ItemKerningImage.prototype.fixedSp = function () {
                    };
                    ItemKerningImage.prototype.unFixedTop = function (currY) {
                        this.spt.element.css("position", "absolute");
                        this.spt.element.css("top", this.defaultY);
                        this.spt.y = currY;
                        this.spt.update();
                        this.currentOffsetY = this.defaultY;
                    };
                    ItemKerningImage.prototype.unFixedBottom = function (currY, blankStopPos) {
                        this.spt.element.css("position", "absolute");
                        this.spt.element.css("top", this.defaultY + (Stage.blankH));
                        this.spt.y = currY;
                        this.spt.update();
                        this.currentOffsetY = this.defaultY + (Stage.blankH);
                    };
                    ItemKerningImage.prototype.fixed = function () {
                        this.spt.element.css("position", "fixed");
                    };
                    return ItemKerningImage;
                }(ParallaxItemBase));
                parallax.ItemKerningImage = ItemKerningImage;
            })(parallax = parts.parallax || (parts.parallax = {}));
        })(parts = view.parts || (view.parts = {}));
    })(view = nikken.view || (nikken.view = {}));
})(nikken || (nikken = {}));
var nikken;
(function (nikken) {
    var view;
    (function (view) {
        var EventDispatcher = com.enirva.event.EventDispatcher;
        var UserAgent = com.enirva.util.UserAgent;
        var Debugger = com.enirva.debug.Debugger;
        var Sprite = com.enirva.display.Sprite;
        var Stage = nikken.model.Stage;
        var Indicator = nikken.view.parts.Indicator;
        var ItemPhoto = nikken.view.parts.parallax.ItemPhoto;
        var ItemText = nikken.view.parts.parallax.ItemText;
        var ItemKerningText = nikken.view.parts.parallax.ItemKerningText;
        var ItemKerningImage = nikken.view.parts.parallax.ItemKerningImage;
        var ScrollController = (function (_super) {
            __extends(ScrollController, _super);
            function ScrollController() {
                _super.call(this);
                this.items = [];
                Debugger.log("w = " + Stage.currentWidth);
                var scope = this;
                var de = [0.1, 0.01, 0.001];
                var depths = [
                    0.01,
                    0.13,
                    0.04,
                    0.13,
                    0.007,
                    0.06,
                    0.025,
                    0.13,
                    0.005,
                    0.04,
                    0.13,
                    0.01,
                    0.065,
                    0.13,
                    0.03,
                    0.007
                ];
                if (UserAgent.instance.isMobile) {
                    depths = [
                        0.01,
                        0.1,
                        0.04,
                        0.1,
                        0.01,
                        0.06,
                        0.03,
                        0.1,
                        0.01,
                        0.04,
                        0.1,
                        0.01,
                        0.065,
                        0.1,
                        0.03,
                        0.01
                    ];
                }
                $(".scrollContainerInner .photo").each(function (index, elem) {
                    $(elem).addClass("depth" + depths[index]);
                    var item = new ItemPhoto($(elem), depths[index]);
                    scope.items.push(item);
                });
                $(".scrollContainerInner .text").each(function (index, elem) {
                    var item = new ItemText($(elem), 0.02);
                    scope.items.push(item);
                });
                $(".scrollContainerInner .kerningText").each(function (index, elem) {
                    var item = new ItemKerningText($(elem), 0);
                    scope.items.push(item);
                });
                $(".catchText").each(function (index, elem) {
                    var item = new ItemKerningImage($(elem), 0);
                    scope.title = item;
                });
                this.title.isDebug = true;
            }
            ScrollController.prototype.start = function () {
                var isMobile = UserAgent.instance.isMobile;
                var pageHeight = parseFloat($(".endPoint").css("top"));
                var firstStopPos = parseFloat($(".catchText").css("top")) + (Stage.currentHeight / 2);
                var show_per;
                if (isMobile) {
                    $(".scrollBlankContainer").css("display", "none");
                    $(".scrollContainer").css({
                        "position": "static",
                        "overflow": "hidden",
                        "height": pageHeight
                    });
                    show_per = 0.9;
                }
                else {
                    $(".scrollBlankContainer").animate({ "height": pageHeight }, 2000);
                    show_per = 0.85;
                }
                var scope = this;
                var delta = 0;
                var currY = 0;
                var spt = new Sprite($(".scrollContainerInner"));
                this.indicator = new Indicator();
                var currIndex = 0;
                var min_dis = 0;
                var max_dis = 500;
                var min_sp = 25;
                var max_sp = 10;
                var diff_sp = max_sp - min_sp;
                var blueAreaPos = parseFloat($(".blueArea").css("top"));
                var isBlueArea = false;
                var maxScrollPos = 0;
                Stage.blankH = (isMobile) ? 500 : 1000;
                var isBlank;
                var blankStopPos;
                var catchTextH2 = ((isMobile) ? (33 / 2) : 33) / 2;
                var spCatchContainer = new Sprite($(".spCatchTextContainer"));
                this.onEnterFrame = function () {
                    Stage.currentScrollPosition = (document.documentElement.scrollTop || document.body.scrollTop);
                    var end = -Stage.currentScrollPosition;
                    var h = Stage.currentHeight;
                    var h2 = Stage.currentHeight / 2;
                    var show_h = Stage.currentHeight * show_per;
                    blankStopPos = h2 - catchTextH2;
                    firstStopPos = parseFloat($(".catchText").css("top")) - (Stage.currentHeight / 2);
                    pageHeight = parseFloat($(".endPoint").css("top"));
                    maxScrollPos = pageHeight - Stage.currentHeight;
                    var dis = Math.abs(end - spt.y);
                    var sp = (dis / max_dis) * diff_sp + min_sp;
                    if (sp < max_sp) {
                        sp = max_sp;
                    }
                    Debugger.text(0, Stage.currentScrollPosition + " " + firstStopPos);
                    if (!isMobile) {
                        spt.y += (end - spt.y) / sp;
                        spt.update();
                    }
                    else {
                        if (!isBlank) {
                            spCatchContainer.y = end;
                            spCatchContainer.update();
                        }
                    }
                    var yy = (isMobile) ? end : spt.y;
                    if (yy > (-scope.title.defaultY + blankStopPos)) {
                        if (isBlank) {
                            Debugger.log("上方向にいる");
                            isBlank = false;
                            if (isMobile) {
                                scope.title.unFixedTopSp(yy);
                                spCatchContainer.y = yy;
                                spCatchContainer.update();
                            }
                            else {
                                scope.title.unFixedTop(yy);
                            }
                        }
                        else {
                            if (isMobile) {
                                spCatchContainer.y = end;
                                spCatchContainer.update();
                            }
                            else {
                                scope.title.spt.y = spt.y;
                                scope.title.spt.update();
                            }
                        }
                    }
                    else if (yy < -(Stage.blankH + scope.title.defaultY - blankStopPos)) {
                        if (isBlank) {
                            Debugger.log("下方向にいる");
                            isBlank = false;
                            if (isMobile) {
                                scope.title.unFixedBottomSp(yy, blankStopPos);
                                spCatchContainer.y = yy;
                                spCatchContainer.update();
                            }
                            else {
                                scope.title.unFixedBottom(yy, blankStopPos);
                            }
                        }
                        else {
                            if (isMobile) {
                                spCatchContainer.y = end;
                                spCatchContainer.update();
                            }
                            else {
                                scope.title.spt.y = spt.y;
                                scope.title.spt.update();
                            }
                        }
                    }
                    else {
                        if (!isBlank) {
                            Debugger.log("ブランクエリアにいる");
                            isBlank = true;
                            if (isMobile) {
                                Debugger.log(scope.title.currentOffsetY + " " + blankStopPos);
                                spCatchContainer.y = -scope.title.currentOffsetY + blankStopPos;
                                spCatchContainer.update();
                            }
                            else {
                                scope.title.spt.y = -scope.title.currentOffsetY + blankStopPos;
                                scope.title.spt.update();
                                scope.title.fixed();
                            }
                            if (!scope.title.isShow) {
                                scope.title.isShow = true;
                                scope.title.show();
                            }
                        }
                    }
                    for (var i = 0; i < scope.items.length; i++) {
                        scope.items[i].update(h, h2, show_h);
                    }
                    scope.title.update(h, h2, show_h);
                    var pointIndex = 8;
                    var isBreak = false;
                    $(".indicatorPoint").each(function (index, elem) {
                        if (!isBreak) {
                            var pt = parseFloat($(elem).css("top"));
                            if (Stage.currentScrollPosition < pt) {
                                pointIndex = index;
                                isBreak = true;
                            }
                        }
                    });
                    scope.indicator.change(pointIndex);
                    if (Stage.currentScrollPosition > blueAreaPos) {
                        if (!isBlueArea) {
                            Debugger.log("isBlueArea true");
                            isBlueArea = true;
                            $(".bgBlue").addClass("bgBlueIn");
                            $(".btnJp").addClass("btnJpBk");
                            $(".btnEn").addClass("btnEnBk");
                            $(".indicator").addClass("indicatorBk");
                        }
                        var diff = Stage.currentScrollPosition - blueAreaPos;
                        var per = diff / (maxScrollPos - blueAreaPos);
                    }
                    else {
                        if (isBlueArea) {
                            Debugger.log("isBlueArea false");
                            isBlueArea = false;
                            $(".bgBlue").removeClass("bgBlueIn");
                            $(".btnJp").removeClass("btnJpBk");
                            $(".btnEn").removeClass("btnEnBk");
                            $(".indicator").removeClass("indicatorBk");
                        }
                    }
                };
            };
            return ScrollController;
        }(EventDispatcher));
        view.ScrollController = ScrollController;
    })(view = nikken.view || (nikken.view = {}));
})(nikken || (nikken = {}));
var nikken;
(function (nikken) {
    var EventDispatcher = com.enirva.event.EventDispatcher;
    var Stage = nikken.model.Stage;
    var LogoCreator = nikken.view.parts.LogoCreator;
    var ScrollIcons = nikken.view.parts.ScrollIcons;
    var ScrollController = nikken.view.ScrollController;
    var Main = (function (_super) {
        __extends(Main, _super);
        function Main() {
            _super.call(this);
            Stage.initialize();
            var scope = this;
            var waitTime = 3300;
            var logo = new LogoCreator($(".logo"));
            logo.load(function () {
                var dt = new Date();
                var time = DT.getTime();
                var diff = time - OFFSET;
                if ((time - OFFSET) < waitTime) {
                    window.setTimeout(function () {
                        scope.hideLoading(logo);
                    }, waitTime - diff);
                }
                else {
                    scope.hideLoading(logo);
                }
            });
        }
        Main.prototype.hideLoading = function (logo) {
            var scope = this;
            $(".loading").fadeOut(1000, function () {
                logo.play(function () {
                    var icons = new ScrollIcons();
                    icons.show(function () {
                        scope.completeIntro();
                    });
                });
            });
        };
        Main.prototype.completeIntro = function () {
            var controller = new ScrollController();
            controller.start();
        };
        return Main;
    }(EventDispatcher));
    nikken.Main = Main;
})(nikken || (nikken = {}));
function nikkenLoadComplete() {
    window.removeEventListener("load", nikkenLoadComplete);
    new nikken.Main();
}
window.addEventListener("load", nikkenLoadComplete);
var DT = new Date();
var OFFSET = DT.getTime();
var nikken;
(function (nikken) {
    var view;
    (function (view) {
        var parts;
        (function (parts) {
            var EventDispatcher = com.enirva.event.EventDispatcher;
            var KerningImageAnim = (function (_super) {
                __extends(KerningImageAnim, _super);
                function KerningImageAnim() {
                    _super.call(this);
                }
                return KerningImageAnim;
            }(EventDispatcher));
            parts.KerningImageAnim = KerningImageAnim;
        })(parts = view.parts || (view.parts = {}));
    })(view = nikken.view || (nikken.view = {}));
})(nikken || (nikken = {}));
var nikken;
(function (nikken) {
    var view;
    (function (view) {
        var parts;
        (function (parts) {
            var MobileObj = (function () {
                function MobileObj(target, prop) {
                    this.target = target;
                    this.prop = prop;
                    this.defaultValues = [];
                    for (var i = 0, ln = this.prop.length; i < ln; i++) {
                        this.defaultValues[i] = parseFloat(target.css(this.prop[i]));
                    }
                }
                MobileObj.prototype.onResize = function () {
                };
                return MobileObj;
            }());
            parts.MobileObj = MobileObj;
        })(parts = view.parts || (view.parts = {}));
    })(view = nikken.view || (nikken.view = {}));
})(nikken || (nikken = {}));
var nikken;
(function (nikken) {
    var view;
    (function (view) {
        var parts;
        (function (parts) {
            var EventDispatcher = com.enirva.event.EventDispatcher;
            var MobileObjResizer = (function (_super) {
                __extends(MobileObjResizer, _super);
                function MobileObjResizer() {
                    _super.call(this);
                    this.targets = [];
                }
                MobileObjResizer.prototype.addTarget = function (target, prop) {
                };
                MobileObjResizer.prototype.onResize = function () {
                    for (var i = 0, ln = this.targets.length; i < ln; i++) {
                        var target = this.targets[i];
                    }
                };
                return MobileObjResizer;
            }(EventDispatcher));
            parts.MobileObjResizer = MobileObjResizer;
        })(parts = view.parts || (view.parts = {}));
    })(view = nikken.view || (nikken.view = {}));
})(nikken || (nikken = {}));
