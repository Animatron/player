/*
 * Copyright (c) 2011-@COPYRIGHT_YEAR by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 *
 * @VERSION
 */

// see ./animatron-project-@VERSION.orderly for a readable scheme of accepted project

// This importer imports only the full (a.k.a. intact) format of scenes
// (where all elements are objects of objects)

var AnimatronIntactImporter = (function() {

var IMPORTER_ID = 'ANM_INTACT';

function __MYSELF() { }

var C = anm.constants,
    Animation = anm.Animation,
    Element = anm.Element,
    Path = anm.Path,
    Text = anm.Text,
    Bands = anm.Bands,
    test = anm._valcheck;

anm.importers[IMPORTER_ID] = {};

// ** META / PARAMS **

__MYSELF.prototype.configureMeta = function(prj) {
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
__MYSELF.prototype.configureAnim = function(prj) {
    // ( framerate, dimension, background, duration,
    //   elements, scenes )
    var _a = prj.anim;
    return {
        'fps': _a.framerate,
        'width': _a.dimension ? Math.floor(_a.dimension[0]) : undefined,
        'height': _a.dimension ? Math.floor(_a.dimension[1]): undefined,
        'bgfill': _a.background ? Convert.fill(_a.background) : null,
    }
}

// ** PROJECT **

__MYSELF.prototype.load = function(prj) {
    // ( framerate, dimension, background, duration,
    //   elements, scenes )
    //if (window && window.console && window.__anm_conf && window.__anm_conf.logImport) console.log(prj);
    if (console && (typeof __anm_conf !== 'undefined') && __anm_conf.logImport) console.log(prj);
    if (typeof __anm !== 'undefined') __anm.lastImportedProject = prj;
    // FIXME: allow importing several scenes
    var anim =  this.importAnimation(prj.anim.scenes[0],
                                     prj.anim.elements);
    if (prj.meta.duration != undefined) anim.setDuration(prj.meta.duration);
    if (prj.anim.background) anim.bgfill = Convert.fill(prj.anim.background);
    return anim;
};

// ** ELEMENTS **

__MYSELF.prototype.importAnimation = function(scene_id, source) {
    var anim = new Animation();
    var node = this.findNode(scene_id, source);
    if (!node) throw new Error("Scene was not found by ID");
    if (extract_type(node.id) != TYPE_SCENE) throw new Error("Given Scene ID points to something else");
    anim.add(this.convertNode(node, source));
    return anim;
}

var TYPE_UNKNOWN = "00",
    TYPE_CLIP    = "01",
    TYPE_SCENE   = "02",
    TYPE_PATH    = "03",
    TYPE_TEXT    = "04",
    TYPE_RECT    = "05",
    TYPE_OVAL    = "06",
    TYPE_PENCIL  = "07",
    TYPE_IMAGE   = "08",
    TYPE_GROUP   = "09",
    TYPE_BRUSH   = "0a",
    TYPE_STAR    = "0b",
    TYPE_POLYGON = "0c",
    TYPE_CURVE   = "0d",
    TYPE_AUDIO   = "0e",
    TYPE_LINE    = "0f";

__MYSELF.prototype.convertNode = function(src, all) {
//__MYSELF.prototype.importElement = function(trg, src, in_band) {
    var trg;
    var type = extract_type(src.id);
    // TODO: move to Converters object?
    // if a node is a group type
    if ((type == TYPE_CLIP) || (type == TYPE_GROUP) || (type == TYPE_SCENE)) {
        trg = new Element();
        trg.name = src.name;
        // iterate through the layers
        var _layers = src.layers,
            _layers_targets = [];
        // in Animatron. layers are in reverse order
        for (var li = _layers.length; li--;) {
            var lsrc = _layers[li],
                ltype = extract_type(lsrc.eid);
            // recursively check if layer element is a group or not and return the element
            var ltrg = this.convertNode(this.findNode(lsrc.eid, all), all);
            if (!ltrg.name) { ltrg.name = lsrc.name; }
            // transfer layer data from the layer source into the
            // target — contains bands, tweens and pivot
            this._transferLayerData(lsrc, ltrg, trg.gband, ltype);
            if (!lsrc.masked) {
                // layer is a normal one
                trg.add(ltrg);
                _layers_targets.push(ltrg);
            } else {
                // layer is a mask, apply it to the required number
                // of previously collected layers
                var mask = ltrg,
                    maskedToGo = lsrc.masked, // layers below to apply mask
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
        // transfer repetition data from the source layer
        // into the target (incl. end or on-end action)
        this._transferRepetitionData(src, trg);
    } else if
      ((type != TYPE_UNKNOWN)
      /*(type == TYPE_PATH)  || (type == TYPE_TEXT)   || (type == TYPE_RECT)    ||
        (type == TYPE_OVAL)  || (type == TYPE_PENCIL) || (type == TYPE_IMAGE)   ||
        (type == TYPE_BRUSH) || (type == TYPE_STAR)   || (type == TYPE_POLYGON) ||
        (type == TYPE_CURVE) || (type == AUDIO)       || (type == LINE)*/) {
        trg = new Element();
        trg.name = src.name;
        // transfer shape data from the source into the
        // target — contains either path, text or image
        this._transferShapeData(src, trg, type);
        // FIXME: fire an event instead (event should inform about type of the importer)
        if (trg.importCustomData) trg.importCustomData(src, type, IMPORTER_ID);
    }
    /*if (trg &&
        (trg.mode != C.R_ONCE) &&
        (trg.children.length > 0) &&
        (!test.finite(trg.gband[1]))) {
        trg.makeBandFit();
    }*/
    return trg;
}
__MYSELF.prototype.findNode = function(id, source) {
    for (var i = 0; i < source.length; i++) {
        if (source[i].id === id) return source[i];
    }
    throw new Error("Node with id " + id + " was not found in passed source");
}
__MYSELF.prototype._transferShapeData = function(src, trg, type) {
    if (src.url && (type == TYPE_IMAGE)) trg.image = Convert.sheet(src.url, src.size);
    if (src.path) trg.path = Convert.path(src.path, src.fill, src.stroke, src.shadow);
    if (src.text) trg.text = Convert.text(src.text, src.font,
                                          src.fill, src.stroke, src.shadow);
}
// collect required data from source layer
__MYSELF.prototype._transferLayerData = function(src, trg, in_band, type) {
    if (src.visible === false) trg.disabled = true; // to.visible = false;
    if (type == TYPE_GROUP) {
        trg.gband = [ 0, src.band[1] ];
        trg.lband = [ 0, src.band[1] ];
        // trg.gband = Convert.band(src.band);
        // trg.lband = [ trg.gband[0] - in_band[0],
        //               trg.gband[1] - in_band[0] ];
    } else {
        trg.lband = Convert.band(src.band);
        trg.gband = in_band ? Bands.wrap(in_band, trg.lband)
                            : trg.lband;
    }
    trg.pvt = [ 0, 0 ];
    trg.reg = src.reg || [ 0, 0 ];
    if (src.tweens) {
        var translate;
        for (var tweens = src.tweens, ti = 0, tl = tweens.length;
             ti < tl; ti++) {
            if (tweens[ti].type == 'Translate') translate = tweens[ti];
            trg.addTween(Convert.tween(tweens[ti]));
        }
        if (translate && src['rotate-to-path']) {
            trg.addTween({
                type: C.T_ROT_TO_PATH,
                band: translate.band
            });
        }
    }
};
__MYSELF.prototype._transferRepetitionData = function(src, trg) {
    // 'on-end' is the old-style end, 'end' is the current-style
    trg.mode = src['end'] ? Convert.mode(src['end'].type)
                          : Convert.oldschool_mode(src['on-end']);
    trg.nrep = (src['end'] && (src['end'].counter !== undefined))
                             ? src['end'].counter : Infinity;

    if (src['end'] && (trg.mode == C.R_LOOP)) {
        trg.traverse(function(child) {
            child.mode = C.R_LOOP;
        });
    }
};

// ** CONVERTION **

function extract_type(id) {
    if (id.length !== 24) throw new Error('Invalid element id ' + id);
    return id.substring(id.length - 2);
}

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
    var data = tween.data;
    if (!data) {
        if (tween.path) return new Path(tween.path);
        return null;
    }
    if ((type === C.T_ROTATE) || (type === C.T_ALPHA)) {
        if (data.length == 2) return data;
        if (data.length == 1) return [ data[0], data[0] ];
    }
    if ((type === C.T_SCALE) || (type === C.T_SHEAR)) {
        if (data.length == 4) return [ [ data[0], data[1] ],
                                       [ data[2], data[3] ] ];
        if (data.length == 2) return [ [ data[0], data[1] ],
                                       [ data[0], data[1] ] ];
        if (data.length == 1) return [ [ data[0], data[0] ],
                                       [ data[0], data[0] ] ];
    }
    return data;
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
Convert.sheet = function(url, size) {
    var sheet = new anm.Sheet(url);
    sheet._dimen = size;
    return sheet;
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

return __MYSELF;

})();
