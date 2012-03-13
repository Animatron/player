(function() { // anonymous wrapper to exclude global context clash

// =============================================================================
// === BUILDER =================================================================

// > Builder % ()
function Builder(obj) {
    this.name = (obj && !obj.xdata) ? obj : ''; // obj is a name string, if it has no xdata
    this.value = (obj && obj.xdata) ? obj : new Element(); // if it has, it is an element instance
    this.value.name = this.name;
    this.xdata = this.value.xdata;
};
Builder._$ = function(name) {
    return new Builder(name);
}
// > Builder.addS % (what: Element | Builder) => Builder
Builder.prototype.add = function(what) {
    this.value.add(what);
    return this;
}
// > Builder.addS % (what: Element | Builder) => Builder
Builder.prototype.addS = function(what) {
    this.value.addS(what);
    return this;    
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
    return this;
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
//                   rect: Array[2,Array[2, Integer]]) => Builder
Builder.prototype.rect = function(pt, rect) {
    var x=pt[0], y=pt[1],
        w=rect[0], h=rect[1]; 
    return this.path('M'+x+' '+y+
                    ' L'+(x+w)+' '+y+
                    ' L'+(x+w)+' '+(y+h)+
                    ' L'+x+' '+(y+h)+
                    ' L'+x+' '+y+' Z');
}
// > Builder.circle % (pt: Array[2,Integer], 
//                     radius: Integer) => Builder
Builder.prototype.cirle = function(pt, radius) {
    var x=pt[0], y=pt[1]; 
    //this.value.addPainter(Builder.p_drawCircle, [pt, radius,
    //                      this.value.path.fill, 
    //                      this.value.path.stroke]);
    return this.path('M'+x+' '+y+
                    ' L'+(x+w)+' '+y+
                    ' L'+(x+w)+' '+(y+h)+
                    ' L'+x+' '+(y+h)+
                    ' L'+x+' '+y+' Z');
}
// > Builder.rotate % (band: Array[2,Float], 
//                     values: Array[2,Float]) => Builder
Builder.prototype.rotate = function(band, values) {
    this.value.applyLBand(band);
    this.value.addTween({
        type: Tween.T_ROTATE,
        band: band,
        data: values
    });
    return this;
}
Builder.prototype.band = function(band) {
    this.value.setLBand(band);
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

window.Builder = Builder;

})(); // end of anonymous wrapper