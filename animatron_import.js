/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 */

function AnimatronImporter() { };

// ** META / PARAMS **

AnimatronImporter.prototype.configureMeta = function(prj) {
    // ( id, title, author, copyright, version, description, modificationTime )
    return prj.meta;
};
AnimatronImporter.prototype.configureAnim = function(prj) {
    // ( framerate, dimension, background, duration,
    //   elements, scenes )
    var _a = prj.anim;
    return {
        'fps': _a.framerate, 
        'width': Math.floor(_a.dimension[0]),
        'height': Math.floor(_a.dimension[1]),
        'bgcolor': Convert.fill(_a.background),
        'duration': this.computeDuration(prj.anim.elements)
    }
}
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

// ** PROJECT **

AnimatronImporter.prototype.load = function(prj) {
    // ( framerate, dimension, background, duration,
    //   elements, scenes )
    return this.importScene(prj.anim.scenes[0], 
                            prj.anim.elements);
};

// ** ELEMENTS **

AnimatronImporter.prototype.importScene = function(scene_id, source) {
    var scene = new Scene();
    scene.add(this.importElement(this.findElement(scene_id, source), source));
    return scene;
}
AnimatronImporter.prototype.importElement = function(clip, source, in_band) {
    var target = new _Element();
    // ( id, name?, reg?, band?, eid?, tweens?, layers?, 
    //   visible?, outline?, locked?, outline-color?, dynamic?, opaque?, on-end? )
    this._collectDynamicData(target, clip, in_band);
    if (clip.eid) {
        var inner = this.findElement(clip.eid, source);
        if (!inner.eid && !inner.layers) {
            // -> ( id, name?, url?, text?, stroke?, fill?, path?, round-rect? )
            this._collectStaticData(target, inner);
        } else {
            target.add(this.importElement(inner, source, target.xdata.gband));
        }
    } else if (clip.layers) {
        var _layers = clip.layers;
        // in animatron, layers are in reverse order
        for (var li = _layers.length; li--;) {
            target.add(this.importElement(_layers[li], source, target.xdata.gband));
        }
    }
    return target;
}
AnimatronImporter.prototype.findElement = function(id, source) {
    for (var i = 0; i < source.length; i++) {
        if (source[i].id === id) return source[i];
    }
}

// collect required data from source layer
AnimatronImporter.prototype._collectDynamicData = function(to, clip, in_band) {
    if (!to.name) to.name = clip.name;
    var x = to.xdata;
    x.lband = clip.band || [0, 10]; //FIMXE: remove, when it will be always set in project
    x.gband = in_band ? Bands.wrap(in_band, x.lband) 
                      : x.lband;
    x.reg = clip.reg || [0, 0];
    x.tweens = clip.tweens ? Convert.tweens(clip.tweens) : {};
    x.mode = Convert.mode(clip['on-end']);
};
AnimatronImporter.prototype._collectStaticData = function(to, src) {
    if (!to.name) to.name = src.name;
    to.xdata.image = src.url ? _Element.imgFromUrl(src.url) : null;
    to.xdata.path = src.path ? Convert.path(src.path, src.stroke, src.fill) 
                             : null;
    to.xdata.text = src.text ? Convert.text(src.text, src.font, 
                                            src.stroke, src.fill)
                             : null;
};

// ** CONVERTION **

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
            'data': Convert.tweenData(_type, _t),
            'easing': Convert.easing(_t.easing)
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
Convert.tweenData = function(type, tween) {
    if (!tween.data) {
        if (tween.path) return new Path(tween.path);
        return null;
    }
    if (type === Tween.T_SCALE) {
        var data = tween.data;
        return [ [ data[0], data[1] ],
                 [ data[2], data[3] ] ];
    }
    return tween.data;
}
Convert.path = function(pathStr, stroke, fill) {
    return new Path(pathStr, 
                    Convert.stroke(stroke),
                    Convert.fill(fill));
}
Convert.text = function(lines, font,
                        stroke, fill) {
    return new Text(lines, font,
                    Convert.stroke(stroke),
                    Convert.fill(fill));
}
Convert.easing = function(from) {
    if (!from) return null;
    return {
          type: Convert.easingType(from.name),
          data: from.path ? (new Path('M0 0 ' + from.path + ' Z')) : null
        };
}
Convert.easingType = function(from) {
    if (!from) return null;
    if (from === 'Unknown') return Easing.T_PATH;
    if (from === 'Default') return Easing.T_DEF;
    if (from === 'Ease In') return Easing.T_IN;
    if (from === 'Ease Out') return Easing.T_OUT;
    if (from === 'Ease In Out') return Easing.T_INOUT;
}
Convert.stroke = function(stroke) {
    if (!stroke) return stroke;
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
    if (!fill) return null;
    var brush = {};
    if (!fill) {
        brush.color = "rgba(0,0,0,0)";
    } else if (fill.color) {
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
    if (!from) return _Element.M_PLAYONCE;
    if (from === "STOP") return _Element.M_PLAYONCE;
    if (from === "LOOP") return _Element.M_LOOP;
    if (from === "BOUNCE") return _Element.M_BOUNCE; // FIXME: last is not for sure
}