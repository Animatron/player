/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 *
 * @VERSION
 */

// see ./animatron-project-@VERSION.orderly for a readable scheme of accepted project

var AnimatronPublishImporter = (function() {

var IMPORTER_ID = 'ANM_PUBLISH';

function __MYSELF() { }

var C = anm.C,
    Scene = anm.Scene,
    Element = anm.Element,
    Path = anm.Path,
    Text = anm.Text,
    Bands = anm.Bands,
    test = anm._valcheck;

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
        'bgcolor': _a.background ? Convert.fill(_a.background) : null,
    }
}

// ** PROJECT **

__MYSELF.prototype.load = function(prj) {
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

__MYSELF.prototype.importScene = function(scene_id, source) {
    var scene = new Scene();
    var node = this.findNode(scene_id, source);
    if (!node) throw new Error("Scene was not found by ID");
    if (extract_type(node.id) != TYPE_SCENE) throw new Error("Given Scene ID points to something else");
    scene.add(this.convertNode(node, source));
    return scene;
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
        trg.name = src.n; // ^src.name
        // iterate through the layers
        var _layers = src.l, // ^src.layers
            _layers_targets = [];
        // in Animatron. layers are in reverse order
        for (var li = _layers.length; li--;) {
            var lsrc = _layers[li],
                ltype = extract_type(lsrc.e); // ^lsrc.eid
            // recursively check if layer element is a group or not and return the element
            var ltrg = this.convertNode(this.findNode(lsrc.e, all), all);
            if (!ltrg.name) { ltrg.name = lsrc.n; } // ^lsrc.name
            // transfer layer data from the layer source into the
            // target — contains bands, tweens and pivot
            this._transferLayerData(lsrc, ltrg, trg.xdata.gband, ltype);
            if (!lsrc.m) { // ^lsrc.masked
                // layer is a normal one
                trg.add(ltrg);
                _layers_targets.push(ltrg);
            } else {
                // layer is a mask, apply it to the required number
                // of previously collected layers
                var mask = ltrg,
                    maskedToGo = lsrc.m, // layers below to apply mask ^lsrc.masked
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
        trg.name = src.n; // ^src.name
        // transfer shape data from the source into the
        // target — contains either path, text or image
        this._transferShapeData(src, trg, type);
        // FIXME: fire an event instead (event should inform about type of the importer)
        if (trg.importCustomData) trg.importCustomData(src, type, IMPORTER_ID);
    }
    /*if (trg &&
        (trg.xdata.mode != C.R_ONCE) &&
        (trg.children.length > 0) &&
        (!test.finite(trg.xdata.gband[1]))) {
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
    // ^src.url ^src.size
    if (src.u && (type == TYPE_IMAGE)) trg.xdata.sheet = Convert.sheet(src.u, src.s);
    // ^src.path ^src.fill ^src.stroke ^src.shadow
    if (src.p) trg.xdata.path = Convert.path(src.p, src.f, src.s, src.w);
    // ^src.text ^src.font ^src.fill ^src.stroke ^src.shadow
    if (src.t) trg.xdata.text = Convert.text(src.t, src.d, src.f, src.s, src.w);
}
// collect required data from source layer
__MYSELF.prototype._transferLayerData = function(src, trg, in_band, type) {
    if (src.v === false) trg.disabled = true; // ^src.visible
    var x = trg.xdata;
    if (type == TYPE_GROUP) {
        x.gband = [ 0, src.b[1] ]; // ^src.band
        x.lband = [ 0, src.b[1] ]; // ^src.band
        // x.gband = Convert.band(src.band);
        // x.lband = [ x.gband[0] - in_band[0],
        //             x.gband[1] - in_band[0] ];
    } else {
        x.lband = Convert.band(src.b); // ^src.band
        x.gband = in_band ? Bands.wrap(in_band, x.lband)
                          : x.lband;
    }
    x.pvt = [ 0, 0 ];
    x.reg = src.r || [ 0, 0 ]; // ^src.reg
    if (src.t) { // ^src.tweens
        var translate;
        for (var tweens = src.t, ti = 0, tl = tweens.length;
             ti < tl; ti++) {
            if (tweens[ti].type == 'Translate') translate = tweens[ti];
            trg.addTween(Convert.tween(tweens[ti]));
        }
        if (translate && src.p) { // ^src[rotate-to-path]
            trg.addTween({
                type: C.T_ROT_TO_PATH,
                band: translate.b // ^translate.band
            });
        }
    }
};
__MYSELF.prototype._transferRepetitionData = function(src, trg) {
    // 'on-end' is the old-style end, 'end' is the current-style
    var x = trg.xdata;
    x.mode = Convert.mode(src.e ? src.e.type : null) // ^src.end
    x.nrep = (src.e && (src.e.c !== undefined)) // ^src.end ^src.end.counter
             ? src.e.c : Infinity;

    if (src.e && (x.mode == C.R_LOOP)) { // ^src.end
        trg.travelChildren(function(child) {
            child.xdata.mode = C.R_LOOP;
        });
    }
};

// ** CONVERTION **

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
function extract_type(id) {
    if (id.length !== 24) throw new Error('Invalid element id ' + id);
    return id.substring(id.length - 2);
}

var Convert = {}
Convert.tween = function(tween) {
    // (type, band, path?, easing?)
    var _t = tween,
        _type = Convert.tweenType(_t.t); // ^_t.type

    return {
        'band': _t.b, // ^_t.band
        'type': _type,
        'data': Convert.tweenData(_type, _t),
        'easing': Convert.easing(_t.e) // ^_t.easing
    };
};
Convert.tweenType = function(from) {
    if (!from) return null;
    if (from === 'r') return C.T_ROTATE;
    if (from === 't') return C.T_TRANSLATE;
    if (from === 'a') return C.T_ALPHA;
    if (from === 's') return C.T_SCALE;
    if (from === 'p') return C.T_ROT_TO_PATH;
    if (from === 'h') return C.T_SHEAR;
}
Convert.tweenData = function(type, tween) {
    var data = tween.d; // ^tween.data
    if (!data) {
        if (tween.p) return new Path(tween.p); // ^tween.path
        return null;
    }
    if (type === C.T_ROTATE) {
        if (data.length == 2) return data;
        if (data.length == 1) return [ data[0], data[0] ];
    }
    if (type === C.T_SCALE) {
        if (data.length == 4) return [ [ data[0], data[1] ],
                                       [ data[2], data[3] ] ];
        if (data.length == 2) return [ [ data[0], data[0] ],
                                       [ data[1], data[1] ] ];
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
  if (!src || src.x == undefined) return null; // ^src.offsetX
  var shadow = {};
  shadow.color = src.p.r || src.p.c; // ^shadow.paint.rgba ^shadow.paint.color
  shadow.offsetX = src.x; // ^src.offsetX
  shadow.offsetY = src.y; // ^src.offsetY
  shadow.blurRadius = src.b; // ^src.blur
  return shadow;
};
Convert.easing = function(from) {
    // (name, path?)
    if (!from) return null;
    return {
          type: Convert.easingType(from.n), // ^from.name
          data: from.p ? (new Path('M0 0 ' + from.p + ' Z')) : null  // ^from.path
        };
}
Convert.easingType = function(from) {
    // TODO!!
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