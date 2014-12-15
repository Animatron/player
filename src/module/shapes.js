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

var Path = anm.Path,
    MSeg = anm.MSeg, LSeg = anm.LSeg, CSeg = anm.CSeg;

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
