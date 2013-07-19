/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 *
 * @VERSION
 */

// see ./animatron-project-@VERSION.orderly for a readable scheme of accepted project

var AnimatronImporter = (function() {

function AnimatronImporter() { }

var C = anm.C,
    Scene = anm.Scene,
    Element = anm.Element,
    Path = anm.Path,
    Text = anm.Text,
    Bands = anm.Bands,
    test = anm._valcheck;

// ** META / PARAMS **

AnimatronImporter.prototype.configureMeta = function(prj) {
    // ( id, name, author, copyright, version, description, modificationTime, numberOfScenes )
    var _m = prj.meta;
    return {
        'title': _m.name,
        'author': _m.author,
        'copyright': _m.copyright,
        'version': _m.version,
        'description': _m.description,
        'duration': _m.duration
    };
};
AnimatronImporter.prototype.configureAnim = function(prj) {
    // ( framerate, dimension, background, duration,
    //   elements, scenes )
    var _a = prj.anim;
    return {
        'fps': _a.framerate,
        'width': _a.dimension ? Math.floor(_a.dimension[0]) : undefined,
        'height': _a.dimension ? Math.floor(_a.dimension[1]): undefined,
        'bgcolor': _a.background ? Convert.fill(_a.background) : null,
    }
}

// ** PROJECT **

AnimatronImporter.prototype.load = function(prj) {
    // ( framerate, dimension, background, duration,
    //   elements, scenes )
    // FIXME: allow importing several scenes
    var scene =  this.importScene(prj.anim.scenes[0],
                                  prj.anim.elements);
    if (prj.meta.duration != undefined) scene.setDuration(prj.meta.duration);
    if (prj.anim.background) scene.bgfill = Convert.fill(prj.anim.background);
    return scene;
};

// ** ELEMENTS **

AnimatronImporter.prototype.importScene = function(scene_id, source) {
    var scene = new Scene();
    scene.add(this.importElement(this.findElement(scene_id, source), source));
    return scene;
}
AnimatronImporter.prototype.importElement = function(clip, source, in_band) {
    var target = new Element();
    // ( id, name?, reg?, band?, eid?, tweens?, layers?,
    //   visible?, outline?, locked?, outline-color?, dynamic?, opaque?, masked?, on-end? )
    this._collectDynamicData(target, clip, in_band);
    if (clip.eid) {
        var inner = this.findElement(clip.eid, source);
        if (!inner.eid && !inner.layers) {
            // -> ( id, name?, url?, text?, stroke?, fill?, path?, round-rect? )
            this._collectStaticData(target, inner);
            if (target.collectCustomData) {
              target.collectCustomData(inner);
            }
        } else {
            // FIXME: consider returning this element, but not adding it
            target.add(this.importElement(inner, source, target.xdata.gband));
        }
    } else if (clip.layers) {
        var _layers = clip.layers,
            _layers_targets = [];
        // in animatron. layers are in reverse order
        for (var li = _layers.length; li--;) {
            var layer_src = _layers[li],
                layer_trg = this.importElement(layer_src, source, target.xdata.gband);
            if (!layer_src.masked) {
                // layer is a normal one
                target.add(layer_trg);
                _layers_targets.push(layer_trg);
            } else {
                // layer is a mask, apply it to the required number
                // of previously collected layers
                var mask = layer_trg,
                    maskedToGo = layer_src.masked, // layers below to apply mask
                    ltl = _layers_targets.length;
                if (maskedToGo > ltl) {
                    throw new Error('No layers collected to apply mask')
                };
                while (maskedToGo) {
                    var masked = _layers_targets[ltl-maskedToGo];
                    //console.log(mask.name + '->' + masked.name);
                    masked.setMask(mask);
                    maskedToGo--;
                }
            }
        }
    }
    // FIXME: it is a not good way to do it, ask tool developers to return band for such elements
    if ((target.xdata.mode != C.R_ONCE) &&
        (target.children.length > 0) &&
        (!test.finite(target.xdata.gband[1]))) {
        target.makeBandFit();
    }
    return target;
}
AnimatronImporter.prototype.findElement = function(id, source) {
    for (var i = 0; i < source.length; i++) {
        if (source[i].id === id) return source[i];
    }
    throw new Error("Element with id " + id + " was not found in passed source");
}

// collect required data from source layer
AnimatronImporter.prototype._collectDynamicData = function(to, clip, in_band) {
    if (!to.name && clip.name) to.name = clip.name;
    if (clip.visible === false) to.disabled = true; // to.visible = false;
    var x = to.xdata;
    x.lband = Convert.band(clip.band);
    x.gband = in_band ? Bands.wrap(in_band, x.lband)
                      : x.lband;
    x.reg = clip.reg || [0, 0];
    // 'on-end' is the old-style end, 'end' is the current-style
    x.mode = clip['end'] ? Convert.mode(clip['end'].type)
                         : Convert.oldschool_mode(clip['on-end']);
    x.nrep = (clip['end'] && (clip['end'].counter !== undefined))
                         ? clip['end'].counter : Infinity;
    if (clip.tweens) {
        for (var tweens = clip.tweens, ti = 0, tl = tweens.length;
             ti < tl; ti++) {
            to.addTween(Convert.tween(tweens[ti]));
        }
    }
};
AnimatronImporter.prototype._collectStaticData = function(to, src) {
    if (!to.name) to.name = src.name;
    // todo: make opposite check (if IS IMAGE or SHEET, etc)
    var isAudio = src.id.substr(src.id.length - 2) === "0e";
    to.xdata.sheet = src.url && !isAudio ? new anm.Sheet(src.url) : null;
    to.xdata.path = src.path ? Convert.path(src.path, src.fill, src.stroke, src.shadow)
                             : null;
    to.xdata.text = src.text ? Convert.text(src.text, src.font,
                                            src.fill, src.stroke, src.shadow)
                             : null;
};

// ** CONVERTION **

var Convert = {}
Convert.tween = function(tween) {
    // (type, band, path?, easing?)
    var _t = tween,
        _type = Convert.tweenType(_t.type);

    return {
        'band': _t.band,
        'type': _type,
        'data': Convert.tweenData(_type, _t),
        'easing': Convert.easing(_t.easing)
    };
};
Convert.tweenType = function(from) {
    if (!from) return null;
    if (from === 'Rotate') return C.T_ROTATE;
    if (from === 'Translate') return C.T_TRANSLATE;
    if (from === 'Alpha') return C.T_ALPHA;
    if (from === 'Scale') return C.T_SCALE;
    if (from === 'rotate-to-path') return C.T_ROT_TO_PATH;
    if (from === 'Shear') return C.T_SHEAR;
}
Convert.tweenData = function(type, tween) {
    if (!tween.data) {
        if (tween.path) return new Path(tween.path);
        return null;
    }
    if (type === C.T_SCALE) {
        var data = tween.data;
        return [ [ data[0], data[1] ],
                 [ data[2], data[3] ] ];
    }
    return tween.data;
}
Convert.path = function(pathStr, fill, stroke, shadow) {
    // ()
    return new Path(pathStr,
                    Convert.fill(fill),
                    Convert.stroke(stroke),
                    Convert.shadow(shadow));
}
Convert.text = function(lines, font,
                        fill, stroke, shadow) {
    // (lines, font, stroke, fill)
    return new Text(lines, font,
                    Convert.fill(fill),
                    Convert.stroke(stroke),
                    Convert.shadow(shadow));
}
Convert.shadow = function(src) {
  if (!src || src.offsetX == undefined) return null;
  var shadow = {};
  shadow.color = src.paint.rgba || src.paint.color;
  shadow.offsetX = src.offsetX;
  shadow.offsetY = src.offsetY;
  shadow.blurRadius = src.blur;
  return shadow;
};
Convert.easing = function(from) {
    // (name, path?)
    if (!from) return null;
    return {
          type: Convert.easingType(from.name),
          data: from.path ? (new Path('M0 0 ' + from.path + ' Z')) : null
        };
}
Convert.easingType = function(from) {
    if (!from) return null;
    if (from === 'Unknown') return C.E_PATH;
    if (from === 'Default') return C.E_DEF;
    if (from === 'Ease In') return C.E_IN;
    if (from === 'Ease Out') return C.E_OUT;
    if (from === 'Ease In Out') return C.E_INOUT;
}
Convert.stroke = function(stroke) {
    // (width, paint (color | colors | rgba | rgbas | r0, r1),
    // cap, join, limit)
    if (!stroke) return stroke;
    var brush = {};
    brush.width = stroke.width;
    brush.cap = stroke.cap;
    brush.join = stroke.join;
    if (stroke.paint) {
        var paint = stroke.paint;
        if (paint.rgba || paint.color) {
            brush.color = paint.rgba || paint.color;
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
    // (color | colors | rgba | rgbas | r0, r1)
    if (!fill) return null;
    var brush = {};
    if (!fill) {
        brush.color = "rgba(0,0,0,0)";
    } else if (fill.rgba || fill.color) {
        brush.color = fill.rgba || fill.color;
    } else if ((typeof fill.r0 !== 'undefined')
            && (typeof fill.r1 !== 'undefined')) {
        brush.rgrad = Convert.gradient(fill);
    } else if (fill.rgbas || fill.colors) {
        brush.lgrad = Convert.gradient(fill);
    }
    return brush;
}
Convert.gradient = function(src) {
    // (bounds, offsets, colors, x1, y1, r0?, r1?, alpha)
    var stops = [],
        offsets = src.offsets;
    for (var i = 0; i < offsets.length; i++) {
        stops.push([
            offsets[i],
            src.rgbas ? src.rgbas[i]
                     : src.colors[i]
        ]);
    }
    return {
        r: (typeof src.r0 !== 'undefined') ? [ src.r0, src.r1 ] : null,
        dir: [ [ src.x0, src.y0 ], [ src.x1, src.y1 ] ],
        stops: stops,
        bounds: src.bounds
    };
}
Convert.band = function(from) {
    if (!from) return [ 0, Infinity ];
    if (from.length == 2) return from;
    if (from.length == 1) return [ from[0], Infinity ];
    return [ 0, Infinity ];
}
Convert.mode = function(from) {
    if (!from) return C.R_ONCE;
    if (from === "once") return C.R_ONCE;
    if (from === "stay") return C.R_STAY;
    if (from === "loop") return C.R_LOOP;
    if (from === "bounce") return C.R_BOUNCE; // FIXME: last is not for sure
}
Convert.oldschool_mode = function(from) {
    if (!from) return C.R_ONCE;
    if (from === "STOP") return C.R_ONCE;
    if (from === "LOOP") return C.R_LOOP;
    if (from === "BOUNCE") return C.R_BOUNCE; // FIXME: last is not for sure
}

return AnimatronImporter;

})();