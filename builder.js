/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

(function() { // anonymous wrapper to exclude global context clash

var Path = anm.Path;
var Element = anm.Element;
var C = anm.C;
var DU = anm.DU;

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
        this.v = obj.v;
        this.x = obj.x;
    } else if (typeof obj === 'string') {
        this.n = obj;
        this.v = new Element();
        this.v.name = this.n;
        this.x = this.v.xdata;
    }
};
Builder._$ = function(obj) {
    return new Builder(obj);
}

// TODO:
Builder.DEFAULT_STROKE = Path.BASE_STROKE;
Builder.DEFAULT_FILL = Path.BASE_FILL;

// > Builder.addS % (what: Element | Builder) => Builder
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
// > Builder.move % (pt: Array[2,Integer]) => Builder
Builder.prototype.move = function(pt) {
    var x = this.x;
    x.pos = [ x.pos[0] + pt[0],
              x.pos[1] + pt[1] ];
    return this;
}
// > Builder.fill % (color: String) => Builder
Builder.prototype.fill = function(color) {
    if (!this.x.path) {
        this.x.path = new Path(); 
    }
    this.x.path.setFill(color);
    return this;
}
// > Builder.stroke % (color: String, width: Float) 
//                  => Builder
Builder.prototype.stroke = function(color, width) {
    if (!this.x.path) {
        this.x.path = new Path();
    }
    this.x.path.setStroke(color, width);
    return this;
}
// > Builder.path % (path: String[, pt: Array[2,Integer]]) => Builder
Builder.prototype.path = function(pathStr) {
    this.x.path = Path.parse(pathStr,
                             this.x.path);
    var path = this.x.path;
    var norm = path.normalize();
    this.x.pos = norm[0];
    this.x.reg = norm[1];
    if (!path.stroke) path.stroke = Builder.DEFAULT_STROKE;
    if (!path.fill) path.fill = Builder.DEFAULT_FILL;
    return this;
}
// > Builder.band % (band: Array[2,Float]) => Builder
Builder.prototype.band = function(band) {
    this.v.setBand(band);
    return this;
}
// > Builder.paint % (painter: Function(ctx: Context))
//                 => Builder
Builder.prototype.paint = function(func, data) {
    this.v.addPainter(func, data);
    return this;
}
// > Builder.modify % (modifier: Function(time: Float, 
//                                        data: Any), 
//                     data: Any) => Builder
Builder.prototype.modify = function(func, data) {
    this.v.addModifier(func, data);
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
// > Builder.rect % (pt: Array[2,Integer], 
//                   rect: Array[2,Integer]) => Builder
Builder.prototype.rect = function(pt, rect) {
    var w = rect[0], h = rect[1],
        x = pt[0], y = pt[1];
    return this.path('M'+x+' '+y+
                    ' L'+(x+w)+' '+y+
                    ' L'+(x+w)+' '+(y+h)+
                    ' L'+x+' '+(y+h)+
                    ' L'+x+' '+y+
                    ' Z');
}
// > Builder.circle % (pt: Array[2,Integer], 
//                     radius: Integer) => Builder
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
// > Builder.tween % (type: String, (Tween.T_*)
//                    band: Array[2,Float], 
//                    data: Any,
//                    [easing: String]) => Builder // (Easing.T_*)
Builder.prototype.tween = function(type, band, data, easing) {
    this.v.addTween({
        type: type,
        band: band,
        data: data,
        easing: easing ? { type: easing, data: null/*edata*/ } : null
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
// > Builder.trans % (band: Array[2,Float], 
//                    points: Array[2,Array[2, Float]],
//                    [easing: String]) => Builder
Builder.prototype.trans = function(band, points, easing) {
    return this.transP(band, 'M'+points[0][0]+' '+points[0][1]+
                            ' L'+points[1][0]+' '+points[1][1]+
                            ' Z', easing);
}
// > Builder.transP % (band: Array[2,Float],
//                     path: String,
//                     [easing: String]) => Builder
Builder.prototype.transP = function(band, path, easing) {
    return this.tween(C.T_TRANSLATE, band, Path.parse(path), easing);
}
// > Builder.alpha % (band: Array[2,Float], 
//                    values: Array[2,Float],
//                    [easing: String]) => Builder
Builder.prototype.alpha = function(band, values, easing) {
    return this.tween(C.T_ALPHA, band, values, easing);
}
// > Builder.key % (name: String, value: Float) => Builder
Builder.prototype.key = function(name, value) {
    // TODO: ensure value is in band?
    this.x.keys[name] = value;
    return this;
}
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
// PRIVATE
Builder.prototype._curStroke = function() {
    var path = this.x.path;
    return path ? (path.stroke || Builder.DEFAULT_STROKE) : Builder.DEFAULT_STROKE;
}
Builder.prototype._curFill = function() {
    var path = this.x.path;
    return path ? (path.fill || Builder.DEFAULT_FILL) : Builder.DEFAULT_FILL;
}
Builder.prototype.on = function(type, handler) {
    this.v.m_on(type, handler);
    return this;
}

/*Builder.p_drawCircle = function(ctx, args) {
    var pt=args[0], radius=args[1],
        fill=args[2], stroke=args[3];
        x=pt[0], y=pt[1], 
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI*2, args);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}*/

// TODO: ?
// B.color
// B.gradient
// B.fill
// B.path
// B.tween
// B.easing

window.Builder = Builder;

})(); // end of anonymous wrapper