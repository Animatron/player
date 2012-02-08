/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

function AnimatronImporter() { };
AnimatronImporter.prototype.configure = function(prj) {
    console.log('received', JSON.stringify(prj));
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
    console.log('converted', this.importClips(prj.anim.scenes[0], 
                                              prj.anim.elements));
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
                if (_layers[li].band) {
                    max_left = Math.max(max_left, _layers[li].band[1]);
                }
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
    var has_layers = (_src.layers != null),                                                   
        _trg = has_layers ? (new Clip()) : (new Element());
    if (layer/* && layer.dynamic*/) {
        this._collectDynamicData(_trg, layer, in_band);
    }
    if (!_src.layers) {
        this._collectStaticData(_trg, _src);
    }
    if (has_layers) {
        var _layers = _src.layers;
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
AnimatronImporter.prototype._collectDynamicData = function(to, layer, in_band) {
    to.name = layer.name;
    var x = to.xdata;
    x.lband = (layer && layer.band) ? layer.band : [0, 10]; //FIMXE: remove, when it will be always set in project
    x.gband = in_band ? Bands.wrap(in_band, x.lband) 
                      : x.lband;
    x.reg = layer.reg;
    x.tweens = layer.tweens ? this._convertTweens(layer.tweens) : {};
};
AnimatronImporter.prototype._collectStaticData = function(to, src) {
    //to.name = src.name;
    to.xdata.image = src.url ? Player.prepareImage(src.url) : null;
    to.xdata.path = src.path ? this._convertPath(src.path, src.stroke, src.fill) 
                             : null;
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
AnimatronImporter.prototype._convertPath = function(pathStr, stroke, fill) {
    return new Path(pathStr, 
        { // stroke
            'width': stroke.width,
            'color': stroke.paint.color,
            'cap': stroke.cap,
            'join': stroke.join
        }, { // fill
            'color': fill.color
        });
}
AnimatronImporter.prototype._convertEasingType = function(from) {
    // FIXME: TODO
    return from;
}