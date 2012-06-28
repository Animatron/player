/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

(function() { // anonymous wrapper to exclude global context clash

var Path = anm.Path;
var Element = anm.Element;
var Text = anm.Text;
var C = anm.C;
var DU = anm.DU;

var MSeg = anm.MSeg, LSeg = anm.LSeg, CSeg = anm.CSeg;

//var modCollisions = C.MOD_COLLISIONS; // if defined, module exists

var __b_cache = {};

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
    this.f = this._extractFill();
    this.s = this._extractStroke();
}
Builder._$ = function(obj) {
    if (obj && (obj instanceof Element)) {
        if (__b_cache[obj.id]) return __b_cache[obj.id];
        return (__b_cache[obj.id] = new Builder(obj));
    }
    var inst = new Builder(obj);
    __b_cache[inst.v.id] = inst;
    return inst;
}

Builder.__path = function(val, join) {
    return (Array.isArray(val))
           ? Builder.path(val) 
           : ((val instanceof Path) ? val 
              : Path.parse(val, join))
}

Builder.DEFAULT_STROKE = Path.BASE_STROKE;
Builder.DEFAULT_FILL = Path.BASE_FILL;
Builder.DEFAULT_CAP = Path.DEFAULT_CAP;
Builder.DEFAULT_JOIN = Path.DEFAULT_JOIN;
Builder.DEFAULT_FFACE = Text.DEFAULT_FFACE;
Builder.DEFAULT_FSIZE = Text.DEFAULT_FSIZE;

// * STRUCTURE *

// > builder.add % (what: Element | Builder) => Builder
Builder.prototype.add = function(what) {
    if (what instanceof Element) {
        this.v.add(what);    
    } else if (what instanceof Builder) {
        this.v.add(what.v);
    }
    return this;
}
// > builder.addS % (what: Element | Builder) => Builder
Builder.prototype.addS = function(what) {
    if (what instanceof Element) {
        this.v.addS(what);    
    } else if (what instanceof Builder) {
        this.v.addS(what.v);
    }
    return this;    
}
// > builder.remove % (what: Element | Builder) => Builder
Builder.prototype.remove = function(what) {
    if (what instanceof Element) {
        this.v.remove(what);    
    } else if (what instanceof Builder) {
        this.v.remove(what.v);
    }
    return this;       
}

// * SHAPES *

// TODO: move shapes to B.P.rect/... ?

// > builder.path % (path: String | Path,
//                   [pt: Array[2,Integer]]) => Builder
Builder.prototype.path = function(path, pt) {
    var path = Builder.__path(path, this.x.path);
    this.x.path = path;
    path.normalize();
    this.x.reg = [0, 0];
    this.x.pos = pt || [0, 0];
    if (!path.stroke) { path.stroke = this.s; }
    else { this.s = path.stroke; }
    if (!path.fill) { path.fill = this.f; }
    else { this.f = path.fill; }
    return this;
}
// > builder.rect % (pt: Array[2,Integer], 
//                   rect: Array[2,Integer] | Integer) => Builder
Builder.prototype.rect = function(pt, rect) {
    var rect = Array.isArray(rect) ? rect 
                                   : [ rect, rect ]; 
    var w = rect[0], h = rect[1];
    this.path([[0, 0], [w, 0],
               [w, h], [0, h],
               [0, 0]], pt);
    return this;
}
// > builder.circle % (pt: Array[2,Integer], 
//                     radius: Float) => Builder
Builder.prototype.circle = function(pt, radius) {
    this.x.pos = pt;
    this.x.reg = [ 0, 0 ];
    var b = this;
    this.paint(function(ctx) {
        DU.qDraw(ctx, b.s, b.f,
                 function() {
                    ctx.arc(0, 0, radius, 0, Math.PI*2, true);
                 });
    });
    if (modCollisions) this.v.reactAs(
            Builder.arcPath(0/*pt[0]*/,0/*pt[1]*/,radius, 0, 1, 12));
    return this;
}
// > builder.image % (pt: Array[2,Integer],
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
                });
           });
    }
    return this;
}
// > builder.text % (pt: Array[2,Integer],
//                   lines: String | Array | Text,
//                   [size: Float],
//                   [font: String | Array]) => Builder
Builder.prototype.text = function(pt, lines, size, font) {
    this.x.pos = pt;
    var text = lines instanceof Text ? lines
                     : new Text(lines, Builder.font(font, size));
    this.x.text = text;
    if (!text.stroke) { text.stroke = this.s; }
    else { this.s = text.stroke; }
    if (!text.fill) { text.fill = this.f; }
    else { this.f = text.fill; }
    return this;
}

// * FILL & STROKE *

// > builder.fill % (color: String) => Builder
Builder.prototype.fill = function(fval) {
    this.f = ((typeof fval === 'string') 
              ? { color: fval }
              : (fval.r ? { 'rgrad': fval } : { 'lgrad': fval }));
    if (this.x.path) this.x.path.fill = this.f;
    if (this.x.text) this.x.text.fill = this.f;
    return this;
}
// > builder.stroke % (color: String[, width: Float, 
//                     cap: String, join: String]) // C.PC_* 
//                  => Builder
Builder.prototype.stroke = function(sval, width, cap, join) {
    this.s = ((typeof sval === 'string') ? {
        'width': (width != null) ? width
                 : Builder.DEFAULT_STROKE.width,
        'color': sval,
        'cap': cap || Builder.DEFAULT_CAP,
        'join': join || Builder.DEFAULT_JOIN
    } : (sval.r ? { 'rgrad': sval } : { 'lgrad': sval }));
    if (this.x.path) this.x.path.stroke = this.s;
    if (this.x.text) this.x.text.stroke = this.s;
    return this;
}
// > builder.nofill % () => Builder
Builder.prototype.nofill = function() { 
    this.f = null;
    if (this.x.path) this.x.path.fill = null;
    if (this.x.text) this.x.text.fill = null;
    return this; 
}
// > builder.nostroke % () => Builder
Builder.prototype.nostroke = function() { 
    this.s = null;
    if (this.x.path) this.x.path.stroke = null;
    if (this.x.text) this.x.text.stroke = null;
    return this; 
}

// * STATIC MODIFICATION *

// > builder.reg % (pt: Array[2,Integer]) => Builder
Builder.prototype.reg = function(pt) {
    var x = this.x;
    x.reg = pt;
    return this;
}
// > builder.move % (pt: Array[2,Integer]) => Builder
Builder.prototype.move = function(pt) {
    var x = this.x;
    x.pos = [ x.pos[0] + pt[0],
              x.pos[1] + pt[1] ];
    return this;
}
// > builder.zoom % (val: Array[2,Float]) => Builder
Builder.prototype.zoom = function(val) {
    if (this.x.path) {
        this.x.path.zoom(val);
        this.path(this.x.path); // will normalize it
    }
    return this;
}

// * BANDS *

// > builder.band % (band: Array[2,Float]) => Builder
Builder.prototype.band = function(band) {
    this.v.setBand(band);
    return this;
}

// * TWEENS *

// > builder.tween % (type: String, // (C.T_*)
//                    band: Array[2,Float], 
//                    data: Any,
//                    [easing: String | Object]) => Builder // (Easing.T_*)
Builder.prototype.tween = function(type, band, data, easing) {
    var aeasing = (easing && (typeof easing === 'string')) 
                  ? { type: easing, data: null }
                  : easing,
        aeasing = (easing && (typeof easing === 'function'))
                  ? { f: function() { return easing; }, data: null }
                  : aeasing;
    this.v.addTween({
        type: type,
        band: band,
        data: data,
        easing: aeasing
    });
    return this;
}
// > builder.rotate % (band: Array[2,Float], 
//                     angles: Array[2,Float],
//                     [easing: String]) => Builder
Builder.prototype.rotate = function(band, angles, easing) {
    return this.tween(C.T_ROTATE, band, angles, easing);
}
// > builder.rotateP % (band: Array[2,Float], 
//                      [easing: String]) => Builder
Builder.prototype.rotateP = function(band, easing) {
    // FIXME: take band from translate tween, if it is not defined
    return this.tween(C.T_ROT_TO_PATH, band, null, easing);
}
// > builder.scale % (band: Array[2,Float], 
//                    values: Array[2,Array[2, Float]],
//                    [easing: String]) => Builder
Builder.prototype.scale = function(band, values, easing) {
    return this.tween(C.T_SCALE, band, values, easing);
}
// > builder.xscale % (band: Array[2,Float], 
//                     values: Array[2, Float],
//                     [easing: String]) => Builder
Builder.prototype.xscale = function(band, values, easing) {
    return this.scale(band, [ [ values[0], values[0] ],
                              [ values[1], values[1] ] ], easing);
}
// > builder.trans % (band: Array[2,Float], 
//                    points: Array[2,Array[2, Float]],
//                    [easing: String]) => Builder
Builder.prototype.trans = function(band, points, easing) {
    return this.transP(band, [[points[0][0],points[0][1]],
                              [points[1][0],points[1][1]]], easing);
}
// > builder.transP % (band: Array[2,Float],
//                     path: String | Path,
//                     [easing: String]) => Builder
Builder.prototype.transP = function(band, path, easing) {
    return this.tween(C.T_TRANSLATE, band, Builder.__path(path, this.x.path), easing);
}
// > builder.alpha % (band: Array[2,Float], 
//                    values: Array[2,Float],
//                    [easing: String]) => Builder
Builder.prototype.alpha = function(band, values, easing) {
    return this.tween(C.T_ALPHA, band, values, easing);
}

// * REPEAT MODES *

// > builder.mode % (mode: String) => Builder
Builder.prototype.mode = function(mode) {
    this.x.mode = mode;
    return this;
}
// > builder.once % () => Builder
Builder.prototype.once = function() {
    return this.mode(C.R_ONCE);
}
// > builder.loop % () => Builder
Builder.prototype.loop = function() {
    return this.mode(C.R_LOOP);
}
// > builder.bounce % () => Builder
Builder.prototype.bounce = function() {
    return this.mode(C.R_BOUNCE);
}

// * MODIFIERS & PAINTERS *

// > builder.modify % (modifier: Function(time: Float, 
//                                        data: Any), 
//                     [data: Any, priority: Integer]) => Builder
Builder.prototype.modify = function(func, data, priority) {
    this.v.addModifier(func, data, priority);
    return this;
}
// > builder.paint % (painter: Function(ctx: Context,
//                                      data: Any),
//                    [data: Any, priority: Integer]) => Builder
Builder.prototype.paint = function(func, data, priority) {
    this.v.addPainter(func, data, priority);
    return this;
}

// * TIME-SWITCH *

// > builder.key % (name: String, value: Float) => Builder
Builder.prototype.key = function(name, value) {
    // TODO: ensure value is in band?
    this.x.keys[name] = value;
    return this;
}
// > builder.time % (f: Function(t: Float)) => Builder
Builder.prototype.time = function(f) {
    this.x.tf = f;
    return this;
}
// > builder.tease % (ease: Function(t: Float)) => Builder
Builder.prototype.tease = function(ease) {
    if (!ease) throw new Error('Ease function not defined');
    var duration = this.x.lband[1]-this.x.lband[0];
    this.time(function(t) {
        return ease(t / duration);
    });
    return this;
}

// * EVENTS *

// > builder.on % (type: String, handler: Function(evt: Event, t: Float)) => Builder
Builder.prototype.on = function(type, handler) {
    this.v.m_on(type, handler);
    return this;
}

// * UTILS *

// > builder.disable % () => Builder
Builder.prototype.disable = function(func) {
    this.v.disabled = true;
    return this;
}
// > builder.enable % () => Builder
Builder.prototype.enable = function(func) {
    this.v.disabled = false;
    return this;
}
// > builder.each % (visitor: Function(elm: Element)) => Builder
Builder.prototype.each = function(func) {
    this.v.visitChildren(func);
    return this;
}
// > builder.deach % (visitor: Function(elm: Element)) => Builder
Builder.prototype.deach = function(func) {
    this.v.travelChildren(func);
    return this;
} 

// > builder.data % ([val: value]) => Builder
Builder.prototype.data = function(value) {
    if (typeof value !== 'undefined') {
        this.v.data(value)
        return this;
    }
    return this.v.data();
}

/*if (modCollisions) { // IF Collisions Module enabled

    // > builder.local % (pt: Array[2, Float]) => Array[2, Float]
    Builder.prototype.local = function(pt, t) {
        return this.v.local(pt, t);
    }
    // > builder.global % (pt: Array[2, Float]) => Array[2, Float]
    Builder.prototype.global = function(pt, t) {
        return this.v.global(pt, t);
    }
    Builder.prototype.bounds = function(t) {
        return this.v.bounds(t);
    }
    Builder.prototype.bounds = function(t) {
        return this.v.bounds(t);
    }    

    // TODO: bounds, dbounds, contains, dcontains, 
    //       collides, dcollides, intersects, dintersects,
    //       offset, reactAs  

} // end IF modCollisions*/

// * PRIVATE *

Builder.prototype._extractStroke = function() {
    if (this.x.path) return this.x.path.stroke || Builder.DEFAULT_STROKE;
    if (this.x.text) return this.x.text.stroke || Builder.DEFAULT_STROKE;
    return Builder.DEFAULT_STROKE;
}
Builder.prototype._extractFill = function() {
    if (this.x.path) return this.x.path.fill || Builder.DEFAULT_FILL;
    if (this.x.text) return this.x.text.fill || Builder.DEFAULT_FILL;
    return Builder.DEFAULT_FILL;
}

// * HELPERS *

Builder.rgb = function(r, g, b, a) {
    return "rgba(" + Math.floor(r) + "," +
                     Math.floor(g) + "," +
                     Math.floor(b) + "," +
                     ((typeof a !== 'undefined') 
                            ? a : 1) + ")"; 
}
Builder.frgb = function(r, g, b, a) {
    return B.rgb(r*255,g*255,b*255,a); 
}
Builder.hsv = function(h, s, v, a) {
    return B.fhsv(h/360,s,v,a);
}
Builder.fhsv = function(h, s, v, a) {
    var c = v * s;  
    var h1 = h * 6; // h * 360 / 60  
    var x = c * (1 - Math.abs((h1 % 2) - 1));  
    var m = v - c;  
    var rgb;  
       
    if (h1 < 1) rgb = [c, x, 0];  
    else if (h1 < 2) rgb = [x, c, 0];  
    else if (h1 < 3) rgb = [0, c, x];  
    else if (h1 < 4) rgb = [0, x, c];  
    else if (h1 < 5) rgb = [x, 0, c];  
    else if (h1 <= 6) rgb = [c, 0, x];  
      
    return Builder.rgb(255 * (rgb[0] + m), 
                       255 * (rgb[1] + m), 
                       255 * (rgb[2] + m), a);
}
Builder.lgrad = function(dir, stops) {
    return {
        dir: dir,
        stops: stops
    };
}
Builder.rgrad = function(dir, rad, stops) {
    return {
        dir: dir,
        r: rad,
        stops: stops
    };
}
Builder.path = function(points) {
    var p = new Path();
    p.add(new MSeg([points[0][0], points[0][1]]));
    var i = 1, pl = points.length;
    for (; i < pl; i++) {
        var pts = points[i];
        if (pts.length < 3) {
            p.add(new LSeg([ pts[0], pts[1] ]));
        } else {
            p.add(new CSeg([ pts[0], pts[1],
                             pts[2], pts[3],
                             pts[4], pts[5] ]));
        }
    }
    /*p.add(new MSeg([ points[pl-1][0], points[pl-1][1] ]));*/
    return p;
}
Builder.easing = function(func, data) {
    return {
        'f': function(data) { return func; },
        'data': data
    }
}
Builder.easingP = function(path) {
    return { type: C.E_PATH, data: Builder.__path(path) };
}
Builder.easingC = function(seg) {
    return { type: C.E_CSEG, 
        data: ((seg instanceof CSeg)
               ? seg : new CSeg(seg)) };
}
Builder.tween = function() {
    // FIXME: TODO
}
Builder.font = function(name, size) {
    var fface = name || Builder.DEFAULT_FFACE;
        fface = (typeof fface === 'string') ? fface : fface.join(',');
    var fsize = (size != null) ? size : Builder.DEFAULT_FSIZE;
    return fsize + 'px ' + fface;
}
// Thanks for Nek (github.com/Nek) for this function
Builder.arcPath = function(centerX, centerY, radius, startAngle, arcAngle, steps){
    //
    // For convenience, store the number of radians in a full circle.
    var twoPI = 2 * Math.PI;
    //
    // To determine the size of the angle between each point on the
    // arc, divide the overall angle by the total number of points.
    var angleStep = arcAngle/steps;
    //
    // Determine coordinates of first point using basic circle math.
    var res = [];
    var xx = centerX + Math.cos(startAngle * twoPI) * radius;
    var yy = centerY + Math.sin(startAngle * twoPI) * radius;
    //
    // Move to the first point.
    res.push([xx, yy]);
    //
    // Draw a line to each point on the arc.
    for(var i=1; i<=steps; i++){
        //
        // Increment the angle by "angleStep".
        var angle = startAngle + i * angleStep;
        //
        // Determine next point's coordinates using basic circle math.
        xx = centerX + Math.cos(angle * twoPI) * radius;
        yy = centerY + Math.sin(angle * twoPI) * radius;
        //
        // Draw a line to the next point.
        res.push([xx, yy]);
    }
    return Builder.path(res);
}

window.Builder = Builder;

})(); // end of anonymous wrapper