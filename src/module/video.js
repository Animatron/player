/*
 * Copyright (c) 2011-@COPYRIGHT_YEAR by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 *
 * @VERSION
 */

  // This module is just a stub template for the moment

var C = anm.constants,
    E = anm.Element;

C.ET_VIDEO = 'video';

var m_ctx = {};

function Video(src) {

}

var prev_initVisuals = E.prototype.initVisuals;
E.prototype.initVisuals = function() {
    prev_initVisuals.apply(this, arguments);
    this.$video = null;
}

var prev_transferVisuals = E.transferVisuals;
E.transferVisuals = function(src, trg) {
    prev_transferVisuals(src, trg);
    trg.$video = src.$video ? src.$video.clone() : null;
}

var prev_dimen = E.prototype.dimen;
E.prototype.dimen = function() {
    return prev_dimen.apply(this, arguments) || (this.$video && this.$video.dimen());
}

var prev_myBounds = E.prototype.myBounds;
E.prototype.myBounds = function() {
    if (this.$video) return (this.$my_bounds = this.$video.bounds());
    return prev_myBounds.apply(this, arguments);
}

var prev_hasRemoteResources = Element.prototype._hasRemoteResources;
Element.prototype._hasRemoteResources = function() {
    if (this.is(C.ET_VIDEO) && player.videoEnabled) return true;
    return prev_hasRemoteResources.apply(this, arguments);
}

var prev_hasRemoteResources = Element.prototype._hasRemoteResources;
Element.prototype._hasRemoteResources = function() {
    var resources = prev_hasRemoteResources.apply(this, arguments);
    if (player.videoEnabled && this.is(C.ET_VIDEO)) resources.push(this.$video.url);
    return resources;
}

anm.modules.register('video', m_ctx);
