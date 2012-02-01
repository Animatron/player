// Animatron Importer

function AnimatronImporter() { };
AnimatronImporter.prototype.configure = function(prj) {
    var _a = prj.anim;
    return {
        'meta': prj.meta,
        'fps': _a.framerate, 
        'width': Math.floor(_a.dimension[0]),
        'height': Math.floor(_a.dimension[1]),
        'bgcolor': _a.background.color,
        'duration': this.computeDuration(prj.anim.elements)
    };
};
AnimatronImporter.prototype.load = function(prj) {
    // TODO: pass concrete scene or scene index
	return this.importClips(prj.anim.scenes[0], 
                            prj.anim.elements);
};
AnimatronImporter.prototype.computeDuration = function(elms) {
    // TODO: ensure this is the correct way to compute it
    var max_left = 0;
    for (var ei = 0; ei < elms.length; ei++) {
        if (elms[ei].layers) {
            var _layers = elms[ei].layers;
            for (var li = 0; li < _layers.length; li++) {
                max_left = Math.max(max_left, _layers[li].band[1]);
            }
        }
    }
    return max_left;
}
AnimatronImporter.prototype.importClips = function(scene_id, source) {
    var scene = new Scene();
    // TODO: scene must be root?
    scene.add(this.importElement(
                   source, this.findElement(source, scene_id)));
    return scene;
};
AnimatronImporter.prototype.findElement = function(source, id) {
    for (var i = 0; i < source.length; i++) {
        if (source[i].id === id) return source[i];
    }
}
AnimatronImporter.prototype.importElement = function(source, _src, 
                                                     layer, in_band) {
    var _trg = _src.layers ? (new Clip()) : (new Element());
    if (_src.path || _src.url) { // low element
        this._collectData(_trg, _src, layer, in_band);
    }
    var _layers = _src.layers;
    if (_layers) {
        // in animatron, layers are in reverse order
        for (var li = (_layers.length - 1); li >= 0; li--) {
            var _clyr = _layers[li];
            var _csrc = this.findElement(source, _clyr.eid);
            _trg.add(this.importElement(source, _csrc, _clyr, 
                                        _trg.xdata.gband));
        };
    }
    return _trg;
};
// collect required data from source layer
AnimatronImporter.prototype._collectData = function(to, src, layer, in_band) {
    var xdata = to.xdata;
    xdata._lband = layer.band;
    xdata._gband = in_band ? Render.wrapBand(in_band, layer.band) : layer.band;
    xdata.reg = layer.reg;
    xdata.image = src.url ? Player.prepareImage(src.url) : null;
    xdata.tweens = layer.tweens ? this._convertTweens(layer.tweens) : {};
    xdata.path = src.path ? new Path(src.path, src.stroke, src.fill) : null;
};
AnimatronImporter.prototype._convertTweens = function(tweens) {
    var result = {};
    for (var ti = 0; ti < tweens.length; ti++) {
        var _t = tweens[ti],
            _type = this._convertTweenType(_t.type);

        if (!result[_type]) result[_type] = [];
        result[_type].push({
            'band': _t.band,
            'type': _type,
            'data': _t.data || (_t.path ? new Path(_t.path) : null),
            'easing': this._convertEasingType(_t.easing)
        });
    }
    return result;
};
AnimatronImporter.prototype._convertTweenType = function(from) {
    if (!from) return null;
    if (from === 'Rotate') return Tween.T_ROTATE;
    if (from === 'Translate') return Tween.T_TRANSLATE;
    if (from === 'Alpha') return Tween.T_ALPHA;
    if (from === 'Scale') return Tween.T_SCALE;
    if (from === 'rotate-to-path') return Tween.T_ROT_TO_PATH;
}
AnimatronImporter.prototype._convertEasingType = function(from) {
    // FIXME: TODO
    return from;
}