var resMan = require('./resource_manager.js'),
    conf = require('./conf.js'),
    engine = require('../anm.js').engine,
    log = require('./log.js');

Sheet.instances = 0;
Sheet.MISSED_SIDE = 50;
/* TODO: rename to Static and take optional function as source? */
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
Sheet.prototype.load = function(player_id, callback, errback) {
    var callback = callback || this._callback;
    if (this._image) throw new Error('Already loaded'); // just skip loading?
    var me = this;
    if (!me.src) {
        $log.error('Empty source URL for image');
        me.ready = true; me.wasError = true;
        if (errback) errback.call(me, 'Empty source');
        return;
    }
    resMan.loadOrGet(player_id, me.src,
        function(notify_success, notify_error) { // loader
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
            try { img.src = me.src; }
            catch(e) { notify_error(e); }
        },
        function(image) {  // oncomplete
            me._image = image;
            me._dimen = [ image.width, image.height ];
            me.ready = true; // this flag is for users of the Sheet class
            if (callback) callback.call(me, image);
        },
        function(err) { log.error(err.srcElement || err.path, err.message || err);
                        me.ready = true;
                        me.wasError = true;
                        if (errback) errback.call(me, err); });
}

Sheet.prototype.apply = function(ctx) {
    if (!this.ready) return;
    if (this.wasError) { this.applyMissed(ctx); return; }
    if (this.cur_region < 0) return;
    var region;
    if (this.region_f) { region = this.region_f(this.cur_region); }
    else {
        var r = this.regions[this.cur_region],
            d = this._dimen;
        region = [ r[0] * d[0], r[1] * d[1],
                   r[2] * d[0], r[3] * d[1] ];
    }
    this._active_region = region;
    ctx.drawImage(this._image, region[0], region[1],
                                   region[2], region[3], 0, 0, region[2], region[3]);
}
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
}
Sheet.prototype.dimen = function() {
    if (this.wasError) return [ Sheet.MISSED_SIDE, Sheet.MISSED_SIDE ];
    /* if (!this.ready || !this._active_region) return [0, 0];
    var r = this._active_region;
    return [ r[2], r[3] ]; */
    return this._dimen;
}
Sheet.prototype.bounds = function() {
    if (this.wasError) return [ 0, 0, Sheet.MISSED_SIDE, Sheet.MISSED_SIDE ];
    // TODO: when using current_region, bounds will depend on that region
    if (!this.ready || !this._active_region) return [0, 0, 0, 0];
    var r = this._active_region;
    return [ 0, 0, r[2], r[3] ];
}
Sheet.prototype.boundsRect = function() {
    // TODO: when using current_region, bounds will depend on that region
    throw new Error('Not Implemented. Why?');
}
Sheet.prototype.clone = function() {
    return new Sheet(this.src);
}
Sheet.prototype.invalidate = function() {
}
Sheet.prototype.reset = function() { }
Sheet.prototype.dispose = function() {
}

module.exports = Sheet;
