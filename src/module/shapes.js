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

E.prototype.dot = function() {
    var x = 0, y = 0;
    var me = this;
    this.paint(function(ctx) {
        ctx.beginPath();
        ctx.arc(x /*x*/, y /*y*/, 3 /* radius */, 0 /* start */, 2*Math.PI /* end */, false /* clockwise */);
        ctx.closePath();
        me.applyBrushes(ctx);
    });
    return this;
}

E.prototype.rect = function(width, height) {
    // FIXME: or use painter instead, but specify Element.type
    //if (this.$path) { this.$path.reset(); }
    //var path = this.$path || (new Path());
    //this.invalidate();
    var x = 0, y = 0,
        width = width,
        height = height || width;
    var path = new Path();
    path.add(new MSeg([ x, y ]));
    path.add(new LSeg([ x + width, y ]));
    path.add(new LSeg([ x + width, y + height]));
    path.add(new LSeg([ x, y + height]));
    path.add(new LSeg([ x, y ]));
    this.path(path);
    return this;
}

E.prototype.oval = function(width, height) {
    var me = this;
    var x = 0, y = 0,
        xradius = width / 2,
        yradius = height ? (height / 2) : xradius;
    this.paint(function(ctx) {
        if (!ctx.ellipse) return;
        ctx.beginPath();
        ctx.ellipse(x, y, xradius, yradius, 0 /* rotation */, 0 /* start */, 2*Math.PI /* end */, false /* clockwise */);
        ctx.closePath();
        me.applyBrushes(ctx);
    });
    return this;
}

E.prototype.triangle = function(width, height) {
    var x = 0, y = 0,
        width = width,
        height = height || width;
    var rx = (width / 2),
        ry = (height / 2);
    var path = new Path();
    path.add(new MSeg([ x + rx, y ]));
    path.add(new LSeg([ x + width, y + height ]));
    path.add(new LSeg([ x, y + height ]));
    path.add(new LSeg([ x + rx, y ]));
    this.path(path);
    return this;
}
