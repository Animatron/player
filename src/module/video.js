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

  var prev_initVisuals = E.prototype.initVisuals;
  E.prototype.initVisuals = function() {
    prev_initVisuals.apply(this, arguments);
    this.video = null;
  }

  var prev_transferVisuals = E.transferVisuals;
  E.transferVisuals = function(src, trg) {
    prev_transferVisuals(src, trg);
    trg.video = src.video ? src.video.clone() : null;
  }

  var prev_dimen = E.prototype.dimen;
  E.prototype.dimen = function() {
    return prev_dimen.apply(this, arguments) || (this.video && this.video.dimen());
  }

  var prev_bounds = E.prototype.bounds;
  E.prototype.bounds = function() {
    return prev_bounds.apply(this, arguments) || (this.video && this.video.bounds());
  }

  // TODO: what else?

  anm.modules.register('video', m_ctx);
