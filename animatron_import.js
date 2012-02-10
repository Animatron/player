/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

function AnimatronImporter() { };
AnimatronImporter.prototype.configure = function(prj) {
    //console.log('received', JSON.stringify(prj));
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
    //console.log('converted', this.importClips(prj.anim.scenes[0], 
    //                                          prj.anim.elements));
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
    if (has_layers) {
        _trg.xdata.mode = Convert.mode(_src['on-end']);
        var _layers = _src.layers;
        // in animatron, layers are in reverse order
        for (var li = (_layers.length - 1); li >= 0; li--) {
            var _clyr = _layers[li];
            var _csrc = this.findElement(source, _clyr.eid);
            _trg.add(this.importElement(source, _csrc, _clyr, 
                                        layer ? _trg.xdata.gband
                                              : null));
        };
    } else {
        this._collectStaticData(_trg, _src);
    }
    if (!layer) {
        _trg.makeBandFit(); // if there is no parent layer, then it is a scene 
                            // (in Animatron terms) with all elements added
    }
    return _trg;
};
// collect required data from source layer
AnimatronImporter.prototype._collectDynamicData = function(to, layer, in_band) {
    to.name = layer.name;
    var x = to.xdata;
    x.lband = layer.band ? layer.band : [0, 10]; //FIMXE: remove, when it will be always set in project
    x.gband = in_band ? Bands.wrap(in_band, x.lband) 
                      : x.lband;
    x.reg = layer.reg;
    x.tweens = layer.tweens ? Convert.tweens(layer.tweens) : {};
};
AnimatronImporter.prototype._collectStaticData = function(to, src) {
    //to.name = src.name;
    to.xdata.image = src.url ? Player.prepareImage(src.url) : null;
    to.xdata.path = src.path ? Convert.path(src.path, src.stroke, src.fill) 
                             : null;
    if (src.text) {
        to.xdata.path = Convert.path('', src.stroke, src.fill);
        to.xdata.text = new Text(src.text, src.font);
    }
};
var Convert = {}
Convert.tweens = function(tweens) {
    var result = {};
    for (var ti = 0; ti < tweens.length; ti++) {
        var _t = tweens[ti],
            _type = Convert.tweenType(_t.type);

        if (!result[_type]) result[_type] = [];
        result[_type].push({
            'band': _t.band,
            'type': _type,
            'data': _t.data || (_t.path ? new Path(_t.path) : null),
            'easing': Convert.easingType(_t.easing)
        });
    }
    return result;
};
Convert.tweenType = function(from) {
    if (!from) return null;
    if (from === 'Rotate') return Tween.T_ROTATE;
    if (from === 'Translate') return Tween.T_TRANSLATE;
    if (from === 'Alpha') return Tween.T_ALPHA;
    if (from === 'Scale') return Tween.T_SCALE;
    if (from === 'rotate-to-path') return Tween.T_ROT_TO_PATH;
}
Convert.path = function(pathStr, stroke, fill) {
    return new Path(pathStr, 
                    Convert.stroke(stroke),
                    Convert.fill(fill));
}
Convert.easingType = function(from) {
    // FIXME: TODO
    return from;
}
Convert.stroke = function(stroke) {
    var brush = {};
    brush.width = stroke.width;
    brush.cap = stroke.cap;
    brush.join = stroke.join;
    if (stroke.paint) {
        var paint = stroke.paint;
        if (paint.color) {
            brush.color = paint.color;
        } else if ((typeof paint.r0 !== 'undefined')
                && (typeof paint.r1 !== 'undefined')) {
            brush.rgrad = Convert.gradient(paint);  
        } else if (stroke.paint.colors) {
            brush.lgrad = Convert.gradient(paint);
        }
    }
    return brush;
}
Convert.fill = function(fill) {
    var brush = {};
    if (fill.color) {
        brush.color = fill.color;
    } else if ((typeof fill.r0 !== 'undefined')
            && (typeof fill.r1 !== 'undefined')) {
        brush.rgrad = Convert.gradient(fill);
    } else if (fill.colors) {
        brush.lgrad = Convert.gradient(fill);
    }
    return brush;
}
Convert.gradient = function(src) {
    var stops = [],
        offsets = src.offsets;
    for (var i = 0; i < offsets.length; i++) {
        stops.push([
            offsets[i],
            src.colors[i]
        ]);
    }
    return {
        r: (typeof src.r0 !== 'undefined') ? [ src.r0, src.r1 ] : null,
        pts: [ [ src.x0, src.y0 ], [ src.x1, src.y1 ] ],
        stops: stops,
        bounds: src.bounds
    };
}
Convert.mode = function(from) {
    if (!from) return Element.M_PLAYONCE;
    if (from === "STOP") return Element.M_PLAYONCE;
    if (from === "LOOP") return Element.M_LOOP;
    if (from === "BOUNCE") return Element.M_BOUNCE; // FIXME: last is not for sure
}