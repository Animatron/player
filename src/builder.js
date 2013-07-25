/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 *
 * @VERSION
 */

(function(root, name, produce) {
    // Cross-platform injector
    if (window && window.__anm_force_window_scope) { // FIXME: Remove
        // Browser globals
        root[name] = produce(root.anm);
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['anm'], produce);
    } else if (typeof module != 'undefined') {
        // CommonJS / module
        module.exports = produce(require('./player.js'));
    } else if (typeof exports === 'object') {
        // CommonJS / exports
        produce(require('./player.js'));
    } else {
        // Browser globals
        root[name] = produce(root.anm);
    }
})(this, 'Builder'/*, 'anm/builder'*/, function(anm) {

var Path = anm.Path;
var Element = anm.Element;
var Text = anm.Text;
var Image = anm.Image;
var Sheet = anm.Sheet;

var C = anm.C;

var MSeg = anm.MSeg, LSeg = anm.LSeg, CSeg = anm.CSeg;

var is = anm._typecheck;

var modCollisions = C.MOD_COLLISIONS; // if defined, module exists

var __b_cache = {};

//var deprecated = function(instead) { return new Error(instead ? 'Deprecated, use ' + instead + 'instead.' : 'Derpacated.') };

// =============================================================================
// === BUILDER =================================================================

// > Builder % ()
function Builder(obj) {
    if (!obj) {
        this.n = '';
        this.v = new Element();
    } else if (obj instanceof Builder) {
        this.n = obj.n;
        this.v = obj.v.deepClone();
        this.x = this.v.xdata;
        this.f = this._extractFill(obj.f);
        this.s = this._extractStroke(obj.s);
        this.v.__b$ = this;
        return; // all done
    } else if (obj instanceof Element) {
        this.n = obj.name;
        this.v = obj;
    } else if (is.str(obj)) {
        this.n = obj;
        this.v = new Element();
        this.v.name = this.n;
    }
    this.__anm_iamBulder = true;
    this.x = this.v.xdata;
    this.bs = this.v.bstate;
    this.v.__b$ = this;
    this.f = this._extractFill(Builder.DEFAULT_FILL);
    this.s = this._extractStroke(Builder.DEFAULT_STROKE);
    this.d = undefined; // duration
    this.a = undefined; // animator
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
    return is.arr(val)
           ? Builder.path(val)
           : ((val instanceof Path) ? val
              : Path.parse(val, join))
}

//Builder.DEFAULT_STROKE = Path.BASE_STROKE;
Builder.DEFAULT_STROKE = Path.EMPTY_STROKE;
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
// > builder.remove % (what: Element | Builder) => Builder
Builder.prototype.remove = function(what) {
    if (what instanceof Element) {
        this.v.remove(what);
    } else if (what instanceof Builder) {
        this.v.remove(what.v);
    } else throw new Error('Don\'t know what to remove');
    return this;
}

// * SHAPES *

// TODO: move shapes to B.P.rect/... ?

// > builder.path % (pt: Array[2,Integer],
//                   path: String | Path) => Builder
Builder.prototype.path = function(pt, path) {
    this.move(pt || [0, 0]);
    var path = Builder.__path(path, this.x.path);
    this.x.path = path;
    if (!path.fill) { path.fill = this.f; }
    else { this.f = path.fill; }
    if (!path.stroke) { path.stroke = this.s; }
    else { this.s = path.stroke; }
    return this;
}
// > builder.npath % (pt: Array[2,Integer],
//                   path: String | Path) => Builder
Builder.prototype.npath = function(pt, path) {
    var _npath = Builder.__path(path, this.x.path).clone();
    _npath.normalize();
    this.path(pt, _npath);
    return this;
}
// > builder.rect % (pt: Array[2,Integer],
//                   rect: Array[2,Integer] | Integer) => Builder
Builder.prototype.rect = function(pt, rect) {
    var rect = is.arr(rect) ? rect : [ rect, rect ];
    var w = rect[0], h = rect[1];
    this.path(pt, [[0, 0], [w, 0],
                   [w, h], [0, h],
                   [0, 0]]);
    return this;
}
// > builder.circle % (pt: Array[2,Integer],
//                    radius: Float) => Builder
Builder.prototype.circle = function(pt, radius) {
    this.move(pt || [0, 0]);
    var diameter = radius + radius,
        dimen = [ diameter, diameter ];
    this.v._dimen = dimen;
    var pvt = this.pvt(),
        center = [ pvt[0] * diameter,
                   pvt[1] * diameter ];
    this.paint(function(ctx) {
            var b = this.$.__b$;
            var pvt = b.pvt();
            Path.applyF(ctx, b.f, b.s, null/*strokes are not supported for the moment*/,
                function() {
                    ctx.arc(center[0], center[1],
                            radius, 0, Math.PI*2, true);
                });
        });
    // FIXME: move this line to the collisions module itself
    // FIXME: should be auto-updatable
    if (modCollisions) this.v.reactAs(
            Builder.arcPath(center[0], center[1], radius, 0, 1, 12));
    return this;
}
// TODO:
/*Builder.prototype.oval = function(pt, hradius, vradius) {
}*/
// > builder.image % (pt: Array[2,Integer],
//                    src: String) => Builder
Builder.prototype.image = function(pt, src, callback) {
    this.move(pt || [0, 0]);
    if (src) {
        var b = this;
        this.x.sheet =
           new Image(src, callback);
    }
    return this;
}
// > builder.text % (pt: Array[2,Integer],
//                   lines: String | Array | Text,
//                   [size: Float],
//                   [font: String | Array]) => Builder
Builder.prototype.text = function(pt, lines, size, font) {
    this.move(pt || [0, 0]);
    var text = lines instanceof Text ? lines
                     : new Text(lines, Builder.font(font, size));
    this.x.text = text;
    if (!text.stroke) { text.stroke = this.s; }
    else { this.s = text.stroke; }
    if (!text.fill) { text.fill = this.f; }
    else { this.f = text.fill; }
    return this;
}
// > builder.sprite % (pt: Array[2,Integer],
//                     src: String | Sheet,
//                     [tile_spec: Array[2,Integer] | Function],
//                     [callback: Function(Image)]) => Builder
Builder.prototype.sprite = function(pt, src, tile_spec, callback) {
    this.move(pt || [0, 0]);
    var animator;
    if (is.str(src)) {
        animator = Builder.sheet(src, tile_spec, callback)(this.v);
    } else if (is.fun(src)) {
        animator = src(this.v);
    } else throw new Error('Incorrect source for sprite');
    this.x.sheet = animator.sheet;
    this.a = animator;
    return this;
}
Builder.prototype.switch = function(frames, fps, repeat) {
    if (!this.a) throw new Error('This builder has no animator, so no switch possible');
    this.a.switch(frames, fps, repeat);
    return this;
}
Builder.prototype.animate = function(t, frames, fps, repeat) {
    if (!this.a) throw new Error('This builder has no animator, so no animation possible');
    this.a.animate(t, frames, fps, repeat);
    return this;
}
Builder.prototype.run = function(t) {
    if (!this.a) throw new Error('This builder has no animator, so no running possible');
    this.a.run(t);
    return this;
}

// * FILL & STROKE *

// > builder.fill % (color: String) => Builder
Builder.prototype.fill = function(fval) {
    this.f = ( is.str(fval)
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
    this.s = (is.str(sval) ? {
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

C.R_TL = [ 0.0, 0.0 ]; C.R_TC = [ 0.5, 0.0 ]; C.R_TR = [ 1.0, 0.0 ];
C.R_ML = [ 0.0, 0.5 ]; C.R_MC = [ 0.5, 0.5 ]; C.R_MR = [ 1.0, 0.5 ];
C.R_BL = [ 0.0, 1.0 ]; C.R_BC = [ 0.5, 1.0 ]; C.R_BR = [ 1.0, 1.0 ];
// > builder.reg % (pt: Array[2,Float] | side: C.R_*) => Builder | Array[2,Float]
Builder.prototype.reg = function(pt) {
    var x = this.x;
    if (!pt) return x.reg;
    x.reg = pt || x.reg;
    return this;
}
// > builder.pvt % (pt: Array[2,Float] | side: C.R_*) => Builder | Array[2,Float]
Builder.prototype.pvt = function(pt) {
    var x = this.x;
    if (!pt) return x.pvt;
    x.pvt = pt;
    return this;
}
// > builder.pvtpt % (pt: Array[2,Float]) => Builder | Array[2,Float]
Builder.prototype.pvtpt = function(pt) {
    var x = this.x;
    if (pt) {
        var dimen = this.v.dimen();
        x.pvt = [ dimen[0] ? (pt[0] / dimen[0]) : 0,
                  dimen[1] ? (pt[1] / dimen[1]) : 0 ];
        return this;
    } else {
        var pvt = x.pvt;
        var dimen = this.v.dimen();
        return [ dimen[0] * pvt[0],
                 dimen[1] * pvt[1] ];
    }
}
// > builder.init % (val: Object) => Builder
Builder.prototype.init = function(state) {
    this.v.bstate = state;
    this.bs = state;
    return this;
}
// > builder.move % (pt: Array[2,Integer]) => Builder
Builder.prototype.move = function(pt) {
    this.bs.x = pt[0];
    this.bs.y = pt[1];
    return this;
}
// > builder.pos % ([pt: Array[2,Integer]]) => Array[2] | Builder
Builder.prototype.pos = function(pt) {
    return pt ? this.move(pt) : [ this.bs.x, this.bs.y ];
}
// > builder.dpos % () => Array[2]
Builder.prototype.dpos = function() {
    return this.v.getPosition();
}
// > builder.apos % () => Array[2]
Builder.prototype.apos = function() {
    var pos = this.dpos(),
        off = this.offset();
    return [ off[0] + pos[0], off[1] + pos[1] ];
}
// > builder.offset % () => Array[2]
Builder.prototype.offset = function() {
    return this.v.offset();
}
// > builder.zoom % (val: Float) => Builder
Builder.prototype.zoom = function(val) {
    if (this.x.path) {
        this.x.path.zoom(val);
        //this.path(this.x.path); // will normalize it
    } else {
        this.size([ val, val ]);
    }
    return this;
}
// > builder.size % (val: Array[2,Float]) => Builder
Builder.prototype.size = function(val) {
    this.bs.sx = val[0];
    this.bs.sy = val[1];
    return this;
}
// > builder.resize % (val: Array[2,Float]) => Builder
Builder.prototype.resize = Builder.prototype.size;
// > builder.proportions % (val: Array[2,Float]) => Builder
Builder.prototype.proportions = Builder.prototype.size;
// > builder.angle % (val: Float) => Builder
Builder.prototype.angle = function(val) {
    this.bs.angle = val;
    return this;
}
// > builder.slope % (val: Float) => Builder
Builder.prototype.slope = Builder.prototype.angle;
// > builder.turn % (val: Float) => Builder
Builder.prototype.turn = Builder.prototype.angle;
// > builder.opacity % (val: Float) => Builder
Builder.prototype.opacity = function(val) {
    this.bs.alpha = val;
    return this;
}
// > builder.bounds % (val: Array[4,Float]) => Builder
Builder.prototype.bounds = function(bounds) {
    if (!bounds.length === 4) throw new Error('Incorrect bounds');
    this.x.__bounds = bounds;
    return this;
}

// * BANDS & DURATION *

// > builder.band % (band: Array[2,Float]) => Builder
Builder.prototype.band = function(band) {
    this.v.setBand(band);
    return this;
}
/* FIXME: duration specifies scene duration, but probably user expects it to set element's duration, find
   some another nice name to set scene duration and make this method set element's duration */
// > builder.duration % (val: Float) => Builder
Builder.prototype.duration = function(value) {
    if (this.v.parent) throw new Error('Please set duration only to the root element');
    this.d = value;
    //if (this.v.scene) this.v.scene.setDuration(value);
    return this;
}

// * TWEENS *

// > builder.tween % (type: String, // (C.T_*)
//                    band: Array[2,Float],
//                    data: Any,
//                    [easing: String (Easing.T_*) | Object | Function]) => Builder
Builder.prototype.tween = function(type, band, data, easing) {
    this.v.addTween({
        type: type,
        time: band,
        data: data,
        easing: easing
    });
    return this;
}
// > builder.tween % (type: String, // (C.T_*)
//                    band: Array[2,Float],
//                    data: Any,
//                    [easing: String (Easing.T_*) | Object | Function]) => Builder
Builder.prototype.rtween = function(type, band, data, easing) {
    // TODO: add relative tweens for all versions (+ include them in tests)
    this.v.addTween({
        type: type,
        time: band,
        data: data,
        easing: easing,
        relative: true
    });
    return this;
}
// FIXME: add rtrans, rscale, ralpha and s.o.
// > builder.untween % (tween: Function) => Builder
Builder.prototype.untween = Builder.prototype.unmodify;
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

// > builder.mode % (mode: String[, nrep: Float]) => Builder
Builder.prototype.mode = function(mode, nrep) {
    this.x.mode = mode;
    if (typeof nrep !== 'undefined') this.x.nrep = nrep;
    return this;
}
// > builder.once % () => Builder
Builder.prototype.once = function() {
    return this.mode(C.R_ONCE);
}
// > builder.stay % () => Builder
Builder.prototype.stay = function() {
    return this.mode(C.R_STAY);
}
// > builder.loop % () => Builder
Builder.prototype.loop = function(val) {
    return this.mode(C.R_LOOP, val);
}
// > builder.repeat % () => Builder
// alias for loop
Builder.prototype.repeat = function(val) {
    return this.mode(C.R_LOOP, val);
}
// > builder.bounce % () => Builder
Builder.prototype.bounce = function(val) {
    return this.mode(C.R_BOUNCE, val);
}

// * MODIFIERS & PAINTERS *

// > builder.modify % ([band: Array[2, Float],]
//                     modifier: Function(time: Float,
//                                        data: Any),
//                     [data: Any, easing: Function(time),
//                                 priority: Integer]) => Builder
Builder.prototype.modify = function(band, modifier, data, easing, priority) {
    if (is.arr(band) || is.num(band)) {
        // NB: easing and data are currently "swapped" in `modify` method
        this.v.addModifier({ time: band,
                             easing: easing,
                             data: data,
                             priority: priority }, modifier);
    } else {
        // match actual arguments, if band was omitted
        priority = easing;
        easing = data;
        data = modifier;
        modifier = band;
        // NB: easing and data are currently "swapped" in `modify` method
        this.v.addModifier({ easing: easing,
                             data: data,
                             priority: priority }, modifier);
    }
    return this;
}
// > builder.rmodify % ([band: Array[2, Float],]
//                      modifier: Function(time: Float,
//                                         data: Any),
//                      [data: Any, easing: Function(time),
//                                  priority: Integer]) => Builder
Builder.prototype.rmodify = function(band, modifier, data, easing, priority) {
    if (is.arr(band) || is.num(band)) {
        // NB: easing and data are currently "swapped" in `modify` method
        this.v.addModifier({ time: band,
                             easing: easing,
                             data: data,
                             relative: true,
                             priority: priority }, modifier);
    } else {
        // match actual arguments, if band was omitted
        priority = easing;
        easing = data;
        data = modifier;
        modifier = band;
        // NB: easing and data are currently "swapped" in `modify` method
        this.v.addModifier({ easing: easing,
                             data: data,
                             relative: true,
                             priority: priority }, modifier);
    }
    return this;
}
// > builder.paint % (painter: Function(ctx: Context,
//                                      data: Any),
//                    [data: Any, priority: Integer]) => Builder
Builder.prototype.paint = function(func, data, priority) {
    this.v.addPainter(func, data, priority);
    return this;
}
// > builder.at % (t: time, modifier: Function(time: Float,
//                                             data: Any),
//                 [data: Any, priority: Integer]) => Builder
Builder.prototype.at = function(t, func, data, priority) {
    return this.modify(t, func, data, priority);
}
// > builder.rat % (t: time, modifier: Function(time: Float,
//                                              data: Any),
//                  [data: Any, priority: Integer]) => Builder
Builder.prototype.rat = function(t, func, data, priority) {
    return this.rmodify(t, func, data, priority);
}
// > builder.unmodify % (modifier: Function) => Builder
Builder.prototype.unmodify = function(modifier) {
    this.v.removeModifier(modifier);
    return this;
}
// > builder.unpaint % (painter: Function) => Builder
Builder.prototype.unpaint = function(painter) {
    this.v.removePainter(painter);
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
    var duration = this.x.duration();
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
// > builder.unhandle % (handler: Function) => Builder
Builder.prototype.unhandle = Builder.prototype.unmodify;

// * TAKE & USE *

// > builder.take % (b: Builder) => Builder
Builder.prototype.take = function(b) {
    this.n = obj.n;
    // xdata contents points to the same objects
    // as source's xdata do
    this.v = obj.v.clone();
    this.x = this.v.xdata;
}
// > builder.copy % (b: Builder) => Builder
Builder.prototype.use = function(b) {
    this.n = obj.n;
    // xdata takes the clones of the objects
    // source's xdata points do
    this.v = obj.v.deepClone();
    this.x = this.v.xdata;
}

// * ENABLE & DISABLE *

// > builder.disable % () => Builder
Builder.prototype.disable = function() {
    this.v.disabled = true;
    this.v.travelChildren(function(elm) { elm.disabled = true; });
    return this;
}
// > builder.enable % () => Builder
Builder.prototype.enable = function() {
    this.v.disabled = false;
    this.v.travelChildren(function(elm) { elm.disabled = false; });
    return this;
}

// * ITERATIONS *

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
// > builder.iter % (visitor: Function(elm: Element),
//                   [onremove: Function(elm: Element)]) => Builder
Builder.prototype.iter = function(func, rfunc) {
    this.v.iterateChildren(func, rfunc);
    return this;
}
// > builder.diter % (visitor: Function(elm: Element),
//                    [onremove: Function(elm: Element)]) => Builder
Builder.prototype.diter = function(func, rfunc) {
    this.v.deepIterateChildren(func, rfunc);
    return this;
}

// * DETACH & CLEAR *

// > builder.detach % () => Builder
Builder.prototype.detach = function() {
    this.v.detach();
    return this;
}
// > builder.clear % () => Builder
Builder.prototype.clear = function() {
    this.v.clear();
    return this;
}

// * DATA *

// > builder.data % ([val: value]) => Builder
Builder.prototype.data = function(value) {
    if (typeof value !== 'undefined') {
        this.v.data(value)
        return this;
    }
    return this.v.data();
}

// * COMPOSITING *

Builder.prototype.acomp = function(value) {
    this.x.acomp = value;
    return this;
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

// * MASKS *

Builder.prototype.mask = function(mask) {
    if (mask instanceof Element) {
        this.v.setMask(mask);
    } else if (mask instanceof Builder) {
        this.v.setMask(mask.v);
    }
    return this;
}

// * PRIVATE *

Builder.prototype._extractStroke = function(def_) {
    if (this.x.path) return this.x.path.stroke || def_;
    if (this.x.text) return this.x.text.stroke || def_;
    return def_;
}
Builder.prototype._extractFill = function(def_) {
    if (this.x.path) return this.x.path.fill || def_;
    if (this.x.text) return this.x.text.fill || def_;
    return def_;
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
Builder.easingF = Builder.easing; // type: C.E_FUNC
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
        fface = (is.str(fface)) ? fface : fface.join(',');
    var fsize = (size != null) ? size : Builder.DEFAULT_FSIZE;
    return fsize + 'px ' + fface;
}

// example:
// return b().sprite([0, 0], './res/sprite_sample.png', [144, 59])
//           .animate(0, [0, 30, 1], 10);
var __t = anm.__dev.adjust;
if (!__t) throw new Error('adjust should be defined');
function _get_frame(start, t, anim) {
    var frames = anim[0],
        fps = anim[1],
        step = (frames.length > 2) ? frames[2] : 1,
        repeat = (frames.length > 3) ? frames[3] : (anim[2] || false),
        start_frame = frames[0],
        end_frame = frames[1],
        dt = __t(t - start);
    var len = __t((end_frame + 1) - start_frame);
    var tframe = Math.floor(dt * fps) * step;
    if (tframe < 0) return -1;
    if (!repeat && (tframe >= len)) return -1;
    if (repeat) { tframe = tframe % len; }
    return Math.floor(start_frame + tframe);
}
function _Animator(sheet, elm) {
    this.sheet = sheet;
    this.elm = elm;
    //if (!(sheet === elm.xdata.sheet)) throw new Error('Element sheet is prepared wrong way');
    this.cur_anim = null;
    var me = this;
    this.elm.addModifier(function(t) {
        if (!me.cur_anim) return false;
        var frame = _get_frame(me.start, t, me.cur_anim);
        if (frame >= 0) {
            sheet.cur_region = frame;
        } else {
            sheet.cur_region = -1; // FIXME: use default frame
            me.cur_anim = null;
            return false;
        }
    });
}
_Animator.prototype.switch = function(frames, fps, repeat) {
    this._prepared_anim = [ frames, fps, repeat ];
}
_Animator.prototype.run = function(t) {
    this.start = t;
    this.cur_anim = this._prepared_anim;
}
_Animator.prototype.animate = function(t, frames, fps, repeat) {
    this.switch(frames, fps, repeat);
    this.run(t);
}

// > Builder.sheet % (src: String,
//                    [tile_selector: Array[2,Integer] | Function(Integer) => Array[4,Integer]],
//                    [callback: Function(Image)]) => Builder
Builder.sheet = function(src, tile_spec, callback) {
    var sheet = new Sheet(src, function(img) {
        if (is.arr(tile_spec)) {
            var tdimen = tile_spec,
                sdimen = this.dimen(),
                h_factor = Math.floor(sdimen[0] / tdimen[0]);
            this.region_f = function(n) { var v_pos = Math.floor(n / h_factor),
                                               h_pos = n % h_factor;
                                           return [ h_pos * tdimen[0], v_pos * tdimen[1], tdimen[0], tdimen[1] ] };
        } else if (is.fun(tile_spec)) {
            this.region_f = tile_spec;
        }
        if (callback) callback();
    });
    return function(elm) { return new _Animator(sheet, elm); };
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

var prevClone = Element.prototype.clone;
Element.prototype.clone = function() {
    var clone = prevClone.call(this);
    clone.__b$ = this.__b$;
    return clone;
}

return Builder;

});