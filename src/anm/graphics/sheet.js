var conf = require('../conf.js'),
    log = require('../log.js');

var engine = require('engine'),
    resMan = require('../resource_manager.js');

var errors = require('../errors.js');

var Bounds = require('./bounds.js');

Sheet.instances = 0;
Sheet.MISSED_SIDE = 50;
/* TODO: rename to Static and take optional function as source? */
/**
 * @class anm.Sheet
 *
 * Sheet class represent both single image and sprite-sheet. It stores
 * active region, and if its bounds are equal to image size (and they are,
 * by default), then the source is treated as a single image. This active region
 * may be changed dynamically during the animation, and this gives the effect of
 * a spite-sheet.
 *
 * See {@link anm.Element#image Element.image()}
 *
 * @constructor
 *
 * @param {String} src image/spritesheet URL
 * @param {Function} [f] callback to perform when image will be received
 * @param {anm.Sheet} f.this sheet instance
 * @param {Image} f.img corresponding DOM Image element
 * @param {Number} [start_region] an id for initial region
 */
function Sheet(src, callback, start_region) {
    this.id = Sheet.instances++;
    this.src = src;
    this._dimen = /*dimen ||*/ [0, 0];
    this.regions = [ [ 0, 0, 1, 1 ] ]; // for image, sheet contains just one image
    this.regions_f = null;
    // this.aliases = {}; // map of names to regions (or regions ranges)
    /* use state property for region num? or conform with state jumps/positions */
    /* TODO: rename region to frame */
    this.cur_region = start_region || 0; // current region may be changed with modifier
    this.ready = false;
    this.wasError = false;
    this._image = null;
    this._callback = callback;
    this._thumbnail = false; // internal flag, used to load a player thumbnail
}

/**
* @private @method load
*/
Sheet.prototype.load = function(uid, player, callback, errback) {
    callback = callback || this._callback;
    if (this._image) throw errors.element('Image already loaded', uid); // just skip loading?
    var me = this;
    if (!me.src) {
        log.error(errors.animation('Empty source URL for image', player.anim));
        me.ready = true; me.wasError = true;
        if (errback) errback.call(me, 'Empty source');
        return;
    }
    resMan.loadOrGet(uid, me.src,
        function(notify_success, notify_error, notify_progress) { // loader
            var src = engine.checkMediaUrl(me.src);

            if (!me._thumbnail && conf.doNotLoadImages) {
              notify_error('Loading images is turned off');
              return; }
            var img = new Image();
            var props = engine.getAnmProps(img);
            img.onload = img.onreadystatechange = function() {
                if (props.ready) return;
                if (this.readyState && (this.readyState !== 'complete')) {
                    notify_error(this.readyState);
                }
                props.ready = true; // this flag is to check later if request succeeded
                // this flag is browser internal
                img.isReady = true; /* FIXME: use 'image.complete' and
                                      '...' (network exist) combination,
                                      'complete' fails on Firefox */
                notify_success(img);
            };
            img.onerror = notify_error;
            img.addEventListener('error', notify_error, false);
            try { img.src = src; }
            catch(e) { notify_error(e); }
        },
        function(image) {  // oncomplete
            me._image = image;
            me._dimen = [ image.width, image.height ];
            me.ready = true; // this flag is for users of the Sheet class
            if (callback) callback.call(me, image);
        },
        function(err) { log.error(errors.animation('Loading image failed ' + (err.srcElement || err.path) + '. ' +
                                                  (err.message || err), player.anim));
                        me.ready = true;
                        me.wasError = true;
                        var doThrow = true;
                        if (errback) { doThrow = !errback.call(me, err); };
                        if (doThrow) { throw errors.element(err ? err.message : 'Unknown', elm); } });
};
/**
 * @private @method updateRegion
 */
Sheet.prototype.updateRegion = function() {
    if (this.cur_region < 0) return;
    var region;
    if (this.region_f) { region = this.region_f(this.cur_region); }
    else {
        var r = this.regions[this.cur_region],
            d = this._dimen;
        region = [ r[0] * d[0], r[1] * d[1],
                   r[2] * d[0], r[3] * d[1] ];
    }
    this.region = region;
};
/**
 * @private @method apply
 */
Sheet.prototype.apply = function(ctx/*, fill, stroke, shadow*/) {
    if (!this.ready) return;

    if (this.wasError) { this.applyMissed(ctx); return; }
    this.updateRegion();
    var region = this.region;
    ctx.drawImage(this._image, region[0], region[1],
                               region[2], region[3], 0, 0, region[2], region[3]);
};
/**
 * @private @method applyMissed
 *
 * If there was an error in process of receiving an image, the "missing" image is
 * displayed, this method draws it in context.
 */
Sheet.prototype.applyMissed = function(ctx) {
    ctx.save();
    ctx.strokeStyle = '#900';
    ctx.lineWidth = 1;
    ctx.beginPath();
    var side = Sheet.MISSED_SIDE;
    ctx.moveTo(0, 0);
    ctx.lineTo(side, 0);
    ctx.lineTo(0, side);
    ctx.lineTo(side, side);
    ctx.lineTo(0, 0);
    ctx.lineTo(0, side);
    ctx.lineTo(side, 0);
    ctx.lineTo(side, side);
    ctx.stroke();
    ctx.restore();
};
Sheet.MISSED_BOUNDS = new Bounds(0, 0, Sheet.MISSED_SIDE, Sheet.MISSED_SIDE);
/**
 * @method bounds
 *
 * Get image bounds
 *
 * @return anm.Bounds bounds
 */
Sheet.prototype.bounds = function() {
    if (this.wasError) return Sheet.MISSED_BOUNDS;
    // TODO: when using current_region, bounds will depend on that region
    if (!this.ready) return Bounds.NONE;
    if(!this.region) {
      this.updateRegion();
    }
    var r = this.region;
    return new Bounds(0, 0, r[2], r[3]);
};
/**
 * @method contains
 *
 * Checks if point is inside the image. _Does no test for bounds_, the point is
 * assumed to be already inside of the bounds, so check `image.bounds().contains(pt)`
 * before calling this method manually.
 *
 * @param {Object} pt point to check
 * @param {Number} pt.x
 * @param {Number} pt.y
 * @return {Boolean} is point inside
 */
Sheet.prototype.contains = function(pt) {
    return true; // if point is inside of the bounds, point is considered to be
                 // inside the image shape
};
/**
 * @method clone
 *
 * Clone this image
 *
 * @return anm.Sheet clone
 */
Sheet.prototype.clone = function() {
    // FIXME: fix for sprite-sheet
    return new Sheet(this.src);
};

Sheet.prototype.invalidate = function() {
};
Sheet.prototype.reset = function() { };
Sheet.prototype.dispose = function() {
};

// TODO: Bring back Sprite-animator
// https://github.com/Animatron/player/blob/3903d59c7653ec6a0dcc578d6193e6bdece4a3a0/src/builder.js#L213
// https://github.com/Animatron/player/blob/3903d59c7653ec6a0dcc578d6193e6bdece4a3a0/src/builder.js#L926

module.exports = Sheet;
