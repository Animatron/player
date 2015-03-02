/*
 * Copyright (c) 2011-@COPYRIGHT_YEAR by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 *
 * @VERSION
 */

// TODO: element.rect
// TODO: element.ellipse
// TODO: element.arc
// and so on

anm.modules.register('shapes', {});

var E = anm.Element;

var C = anm.C;

var Path = anm.Path,
    MSeg = anm.MSeg, LSeg = anm.LSeg, CSeg = anm.CSeg;

// case 'dot':  elm.dot(0, 0); break;
// case 'rect': elm.rect(0, 0, size.x, size.y); break;
// case 'oval': elm.oval(0, 0, size.x, size.y); break;
// case 'triangle': elm.triangle(0, 0, size.x, size.y); break;
//
E.prototype.dot = function(x, y) {
    this.type = C.ET_PATH;
    var me = this;
    this.paint(function(ctx) {
        ctx.save();
        ctx.save();
        ctx.beginPath();
        ctx.arc(x /*x*/, y /*y*/, 3 /* radius */, 0 /* start */, 2*Math.PI /* end */, false /* clockwise */);
        ctx.closePath();
        ctx.restore();
        me.applyBrushes(ctx);
        ctx.restore();
    });
}

E.prototype.rect = function(x, y, width, height) {
    // FIXME: or use painter instead, but specify Element.type
    //if (this.$path) { this.$path.reset(); }
    //var path = this.$path || (new Path());
    //this.invalidate();
    var path = new Path();
    path.add(new MSeg([ x, y ]));
    path.add(new LSeg([ x + width, y ]));
    path.add(new LSeg([ x + width, y + height]));
    path.add(new LSeg([ x, y + height]));
    path.add(new LSeg([ x, y ]));
    return this.path(path);
}

E.prototype.oval = function(x, y, width, height) {
    // ctx.ellipse(x, y, rx, ry, rotation, start, end, anticlockwise);
}

E.prototype.triangle = function(x, y, width, height) {
    var rx = width / 2;
    var ry = height / 2;

    var x0 = rx * Math.cos(0) + x;
    var y0 = ry * Math.sin(0) + y;
    var x1 = rx * Math.cos((1./3)*(2*Math.PI)) + x;
    var y1 = ry * Math.sin((1./3)*(2*Math.PI)) + y;
    var x2 = rx * Math.cos((2./3)*(2*Math.PI)) + x;
    var y2 = ry * Math.sin((2./3)*(2*Math.PI)) + y;

    var path = new Path();
    path.add(new MSeg([ x0, y0 ]));
    path.add(new LSeg([ x1, y1 ]));
    path.add(new LSeg([ x2, y2 ]));
    path.add(new LSeg([ x0, y0 ]));
    return this.path(path);
}
