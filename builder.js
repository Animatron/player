/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

(function() { // anonymous wrapper to exclude global context clash

var Path = anm.Path;
var Element = anm.Element;
var C = anm.C;
var DU = anm.DU;

var MSeg = anm.MSeg, LSeg = anm.LSeg, CSeg = anm.CSeg;

// =============================================================================
// === BUILDER =================================================================

// > Builder % ()
function Builder(obj) {
    if (!obj) {
        this.n = '';
        this.v = new Element();
        this.x = this.v.xdata;
    } else if (obj instanceof Element) {
        this.n = obj.name;
        this.v = obj;
        this.x = obj.xdata;
    } else if (obj instanceof Builder) {
        this.n = obj.n;
        this.v = obj.v.clone();
        this.x = this.v.xdata;
    } else if (typeof obj === 'string') {
        this.n = obj;
        this.v = new Element();
        this.v.name = this.n;
        this.x = this.v.xdata;
    }
}
Builder._$ = function(obj) {
    return new Builder(obj);
}

// TODO:
Builder.DEFAULT_STROKE = Path.BASE_STROKE;
Builder.DEFAULT_FILL = Path.BASE_FILL;

// * STRUCTURE *

// > Builder.add % (what: Element | Builder) => Builder
Builder.prototype.add = function(what) {
    if (what instanceof Element) {
        this.v.add(what);    
    } else if (what instanceof Builder) {
        this.v.add(what.v);
    }
    return this;
}
// > Builder.addS % (what: Element | Builder) => Builder
Builder.prototype.addS = function(what) {
    if (what instanceof Element) {
        this.v.addS(what);    
    } else if (what instanceof Builder) {
        this.v.addS(what.v);
    }
    return this;    
}

// * SHAPES *

// TODO: move shapes to B.P.rect/... ?

// > Builder.path % (path: String | Path,
//                   [pt: Array[2,Integer]]) => Builder
Builder.prototype.path = function(path, pt) {
    var path = (path instanceof Path) ? path 
               : Path.parse(path, this.x.path);
    var ppath = this.x.path;
    this.x.path = path;
    path.normalize();
    this.x.reg = [0, 0];
    if (pt) this.x.pos = pt;
    if (!path.stroke) path.stroke = ppath ? ppath.stroke 
                                          : Builder.DEFAULT_STROKE;
    if (!path.fill) path.fill = ppath ? ppath.fill 
                                      : Builder.DEFAULT_FILL;
    return this;
}
// > Builder.rect % (pt: Array[2,Integer], 
//                   rect: Array[2,Integer]) => Builder
Builder.prototype.rect = function(pt, rect) {
    var w = rect[0], h = rect[1];
    this.path(Builder.path([[0, 0],
                            [w, 0],
                            [w, h],
                            [0, h],
                            [0, 0]]), pt);
    return this;
}
// > Builder.circle % (pt: Array[2,Integer], 
//                     radius: Float) => Builder
Builder.prototype.circle = function(pt, radius) {
    this.x.pos = pt;
    this.x.reg = [ radius, radius ];
    var b = this;
    this.paint(function(ctx) {
        var path = this.path;
        DU.qDraw(ctx, 
                 b._curStroke(),
                 b._curFill(),
                 function() {
                    ctx.arc(radius, radius, radius, 0, Math.PI*2, true);
                 });
    });
    return this;
}
// > Builder.image % (pt: Array[2,Integer],
//                    src: String) => Builder
Builder.prototype.image = function(pt, src) {
    this.x.pos = pt;
    if (src) {
        var b = this;
        this.x.image = 
           Element.imgFromUrl(src, function(img) {
                b.__modify(Element.SYS_MOD, function(t) {
                    this.rx = Math.floor(img.width/2);
                    this.ry = Math.floor(img.height/2);
                    return true;
                });
           });
    }
    return this;
}
// > Builder.text % (pt: Array[2,Integer],
//                   text: String,
//                   [font: String]) => Builder
Builder.prototype.text = function(pt, text, font) {
    /*var stroke = this.path.stroke;
    this.paint(function(ctx) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#f35';
      ctx.font = '30pt serif';
      ctx.strokeText('Boo!', 50, 50);
    });*/
    // TODO: use local stroke and fill vars to sync 
    // between path and text
}

// * FILL & STROKE *

// > Builder.fill % (color: String) => Builder
Builder.prototype.fill = function(color) {
    if (!this.x.path) {
        this.x.path = new Path(); 
    }
    this.x.path.cfill(color);
    return this;
}
// > Builder.stroke % (color: String, width: Float) 
//                  => Builder
Builder.prototype.stroke = function(color, width, cap, join) {
    if (!this.x.path) {
        this.x.path = new Path();
    }
    this.x.path.cstroke(color, width, cap, join);
    return this;
}
Builder.prototype.nofill = function() { this.fill(null); }
Builder.prototype.nostroke = function() { this.stroke(null); }

// * STATIC MODIFICATION *

// > Builder.move % (pt: Array[2,Integer]) => Builder
Builder.prototype.move = function(pt) {
    var x = this.x;
    x.pos = [ x.pos[0] + pt[0],
              x.pos[1] + pt[1] ];
    return this;
}
// > Builder.zoom % (val: Array[2,Float]) => Builder
Builder.prototype.zoom = function(val) {
    if (this.x.path) {
        this.x.path.zoom(val);
        this.path(this.x.path); // will normalize it
    }
    return this;
}

// * BANDS *

// > Builder.band % (band: Array[2,Float]) => Builder
Builder.prototype.band = function(band) {
    this.v.setBand(band);
    return this;
}

// * TWEENS *

// > Builder.tween % (type: String, // (C.T_*)
//                    band: Array[2,Float], 
//                    data: Any,
//                    [easing: String | Object]) => Builder // (Easing.T_*)
Builder.prototype.tween = function(type, band, data, easing) {
    var aeasing = (easing && (typeof easing === 'string')) 
                  ? { type: easing, data: null }
                  : easing,
        aeasing = (easing && (typeof easing === 'function'))
                  ? { f: function() { return easing; }, data: null }
                  : easing;
    this.v.addTween({
        type: type,
        band: band,
        data: data,
        easing: aeasing
    });
    return this;
}
// > Builder.rotate % (band: Array[2,Float], 
//                     angles: Array[2,Float],
//                     [easing: String]) => Builder
Builder.prototype.rotate = function(band, angles, easing) {
    return this.tween(C.T_ROTATE, band, angles, easing);
}
// > Builder.rotateP % (band: Array[2,Float], 
//                      [easing: String]) => Builder
Builder.prototype.rotateP = function(band, easing) {
    // FIXME: take band from translate tween, if it is not defined
    return this.tween(C.T_ROT_TO_PATH, band, null, easing);
}
// > Builder.scale % (band: Array[2,Float], 
//                    values: Array[2,Array[2, Float]],
//                    [easing: String]) => Builder
Builder.prototype.scale = function(band, values, easing) {
    return this.tween(C.T_SCALE, band, values, easing);
}
// > Builder.xscale % (band: Array[2,Float], 
//                     values: Array[2, Float],
//                     [easing: String]) => Builder
Builder.prototype.xscale = function(band, values, easing) {
    return this.scale(band, [ [ values[0], values[0] ],
                              [ values[1], values[1] ] ], easing);
}
// > Builder.trans % (band: Array[2,Float], 
//                    points: Array[2,Array[2, Float]],
//                    [easing: String]) => Builder
Builder.prototype.trans = function(band, points, easing) {
    return this.transP(band, B.path([[points[0][0],points[0][1]],
                                     [points[1][0],points[1][1]]]), easing);
}
// > Builder.transP % (band: Array[2,Float],
//                     path: String | Path,
//                     [easing: String]) => Builder
Builder.prototype.transP = function(band, path, easing) {
    return this.tween(C.T_TRANSLATE, band, (path instanceof Path)
                                           ? path : Path.parse(path), easing);
}
// > Builder.alpha % (band: Array[2,Float], 
//                    values: Array[2,Float],
//                    [easing: String]) => Builder
Builder.prototype.alpha = function(band, values, easing) {
    return this.tween(C.T_ALPHA, band, values, easing);
}

// * REPEAT MODES *

// > Builder.mode % (mode: String) => Builder
Builder.prototype.mode = function(mode) {
    this.x.mode = mode;
    return this;
}
Builder.prototype.once = function() {
    return this.mode(C.R_ONCE);
}
Builder.prototype.loop = function() {
    return this.mode(C.R_LOOP);
}
Builder.prototype.bounce = function() {
    return this.mode(C.R_BOUNCE);
}

// * MODIFIERS & PAINTERS *

// > Builder.modify % (modifier: Function(time: Float, 
//                                        data: Any), 
//                     data: Any) => Builder
Builder.prototype.modify = function(func, data) {
    this.v.addModifier(func, data);
    return this;
}
// > Builder.paint % (painter: Function(ctx: Context))
//                 => Builder
Builder.prototype.paint = function(func, data) {
    this.v.addPainter(func, data);
    return this;
}

// * TIME-SWITCH *

// > Builder.key % (name: String, value: Float) => Builder
Builder.prototype.key = function(name, value) {
    // TODO: ensure value is in band?
    this.x.keys[name] = value;
    return this;
}
Builder.prototype.time = function(f) {
    this.x.tf = f;
    return this;
}
Builder.prototype.tease = function(ease) {
    if (!ease) throw new Error('Ease function not defined');
    var duration = this.x.lband[1]-this.x.lband[0];
    this.time(function(t) {
        return ease(t / duration);
    });
    return this;
}

// * EVENTS *

Builder.prototype.on = function(type, handler) {
    this.v.m_on(type, handler);
    return this;
}

// * PRIVATE *

Builder.prototype._curStroke = function() {
    var path = this.x.path;
    return path ? (path.stroke || Builder.DEFAULT_STROKE) : Builder.DEFAULT_STROKE;
}
Builder.prototype._curFill = function() {
    var path = this.x.path;
    return path ? (path.fill || Builder.DEFAULT_FILL) : Builder.DEFAULT_FILL;
}

// * HELPERS *

Builder.rgb = function(r, g, b, a) {
    return "rgba(" + Math.floor(r) + "," +
                     Math.floor(g) + "," +
                     Math.floor(b) + "," +
                     ((typeof a !== 'undefined') 
                            ? a : 1) + ");"; 
}
Builder.hsv = function() {
    // FIXME: TODO
}
Builder.gradient = function() {
    // FIXME: TODO
}
Builder.path = function(points) {
    var p = new Path();
    p.add(new MSeg([points[0][0], points[0][1]]));
    for (var i = 1; i < points.length; i++) {
        var pts = points[i];
        if (pts.length < 3) {
            p.add(new LSeg([ pts[0], pts[1] ]));
        } else {
            p.add(new CSeg([ pts[0], pts[1],
                             pts[2], pts[3],
                             pts[4], pts[5] ]));
        }
    }
    return p;
}
Builder.easing = function(func, data) {
    return {
        'f': function(data) { return func; },
        'data': data
    }
}
Builder.tween = function() {
    // FIXME: TODO
}

window.Builder = Builder;

})(); // end of anonymous wrapper