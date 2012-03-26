/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

(function() { // anonymous wrapper to exclude global context clash

// =============================================================================
// === BUILDER =================================================================

// > Builder % ()
function Builder(obj) {
    this.name = (obj && !obj.xdata) ? obj : ''; // obj is a name string, if it has no xdata
    this.value = (obj && obj.xdata) ? obj : new _Element(); // if it has, it is an element instance
    this.value.name = this.name;
    this.xdata = this.value.xdata;
};
Builder._$ = function(name) {
    return new Builder(name);
}

// TODO:
Builder.DEFAULT_STROKE = Path.BASE_STROKE;
Builder.DEFAULT_FILL = Path.BASE_FILL;

// > Builder.addS % (what: _Element | Builder) => Builder
Builder.prototype.add = function(what) {
    this.value.add(what);
    return this;
}
// > Builder.addS % (what: _Element | Builder) => Builder
Builder.prototype.addS = function(what) {
    this.value.addS(what);
    return this;    
}
// > Builder.move % (pt: Array[2,Integer]) => Builder
Builder.prototype.move = function(pt) {
    // FIXME: fails
    return this.modify(function(t) {
        //console.log(this);
        this.rx += pt[0];
        this.ry += pt[1];
    });
}
// > Builder.fill % (color: String) => Builder
Builder.prototype.fill = function(color) {
    if (!this.xdata.path) {
        this.xdata.path = new Path(); 
    }
    this.xdata.path.setFill(color);
    return this;
}
// > Builder.stroke % (color: String, width: Float) 
//                  => Builder
Builder.prototype.stroke = function(color, width) {
    if (!this.xdata.path) {
        this.xdata.path = new Path();
    }
    this.xdata.path.setStroke(color, width);
    return this;
}
// > Builder.path % (path: String) => Builder
Builder.prototype.path = function(pathStr) {
    this.xdata.path = Path.parse(pathStr,
                                 this.xdata.path);
    var path = this.xdata.path;
    if (!path.stroke) path.stroke = Builder.DEFAULT_STROKE;
    if (!path.fill) path.fill = Builder.DEFAULT_FILL;
    return this;
}
// > Builder.band % (band: Array[2,Float]) => Builder
Builder.prototype.band = function(band) {
    this.value.setLBand(band);
}
// > Builder.paint % (painter: Function(ctx: Context))
//                 => Builder
Builder.prototype.paint = function(func, data) {
    this.value.addPainter(func, data);
    return this;
}
// > Builder.modify % (modifier: Function(time: Float, 
//                                        data: Any), 
//                     data: Any) => Builder
Builder.prototype.modify = function(func, data) {
    this.value.addModifier(func, data);
    return this;
}
// > Builder.image % (src: String) => Builder
Builder.prototype.image = function(src) {
    this.xdata.image = src;
    return this;
}
// > Builder.rect % (pt: Array[2,Integer], 
//                   rect: Array[2,Integer]) => Builder
Builder.prototype.rect = function(pt, rect) {
    var x=pt[0], y=pt[1],
        w=rect[0], h=rect[1]; 
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
    var x=pt[0], y=pt[1];
    var b = this;
    this.paint(function(ctx) {
        var path = this.xdata.path;
        DU.qDraw(ctx, 
                 b._curStroke(),
                 b._curFill(),
                 function() {
                    ctx.arc(pt[0], pt[1], radius, 0, Math.PI*2, true);
                 });
    });
    return this;
    /*return this.path('M'+x+' '+y+
                    ' L'+(x+w)+' '+y+
                    ' L'+(x+w)+' '+(y+h)+
                    ' L'+x+' '+(y+h)+
                    ' L'+x+' '+y+' Z');*/
}
// > Builder.tween % (type: String, (Tween.T_*)
//                    band: Array[2,Float], 
//                    data: Any,
//                    [easing: String]) => Builder // (Easing.T_*)
Builder.prototype.tween = function(type, band, data, easing) {
    this.value.applyLBand(band);
    this.value.addTween({
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
    return this.tween(Tween.T_ROTATE, band, angles, easing);
}
// > Builder.rotateP % (band: Array[2,Float], 
//                      path: String,
//                      [easing: String]) => Builder
Builder.prototype.rotateP = function(band, angles, easing) {
    return this.tween(Tween.T_ROT_TO_PATH, band, angles, easing);
}
// > Builder.scale % (band: Array[2,Float], 
//                    values: Array[2,Array[2, Float]],
//                    [easing: String]) => Builder
Builder.prototype.scale = function(band, values, easing) {
    return this.tween(Tween.T_SCALE, band, values, easing);
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
    return this.tween(Tween.T_TRANSLATE, band, Path.parse(path), easing);
}
// > Builder.alpha % (band: Array[2,Float], 
//                    values: Array[2,Float],
//                    [easing: String]) => Builder
Builder.prototype.alpha = function(band, values, easing) {
    return this.tween(Tween.T_ALPHA, band, values, easing);
}
// PRIVATE
Builder.prototype._curStroke = function() {
    var path = this.xdata.path;
    return path ? (path.stroke || Builder.DEFAULT_STROKE) : Builder.DEFAULT_STROKE;
}
Builder.prototype._curFill = function() {
    var path = this.xdata.path;
    return path ? (path.fill || Builder.DEFAULT_FILL) : Builder.DEFAULT_FILL;
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