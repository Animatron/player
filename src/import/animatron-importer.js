/*
 * Copyright (c) 2011-@COPYRIGHT_YEAR by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 *
 * @VERSION
 */

// see ./animatron-project-@VERSION.orderly for a readable scheme of accepted project

// This importer imports only the compact format of animations (where all elements are arrays
// of arrays)


var AnimatronImporter = (function() {

var IMPORTER_ID = 'ANM'; // FIXME: change to 'animatron', same name as registered

var C = anm.constants,
    Animation = anm.Animation,
    Element = anm.Element,
    Path = anm.Path,
    Text = anm.Text,
    Brush = anm.Brush,
    Bands = anm.Bands,
    Tween = anm.Tween,
    MSeg = anm.MSeg,
    LSeg = anm.LSeg,
    CSeg = anm.CSeg,
    Audio = anm.Audio,
    is = anm.utils.is,
    $log = anm.log;
    //test = anm._valcheck

function _reportError(e) {
    $log.error(e);
    // throw e; // skip errors if they do not affect playing ability
}

var Import = {};

var cur_import_id;

// -> Array[?]
Import._find = function(idx, src) {
    var res = src[idx];
    if (!res) _reportError('Element with index ' + idx + ' was not found'
                           + (src ? ' among ' + src.length + ' elements.' : '.') );
    return src[idx];
}
// -> Integer
Import._type = function(src) {
    return src[0];
}

/** project **/
/*
 * object {
 *     object *meta*;     // meta info about the project (the same as for full format)
 *     object *anim*;     // animation info
 * } *project*;
 */
// -> Animation
Import.project = function(prj) {
    //if (window && console && window.__anm_conf && window.__anm_conf.logImport) $log.debug(prj);
    if (anm.conf.logImport) $log.debug(prj);
    cur_import_id = anm.utils.guid();
    anm.lastImportedProject = prj;
    anm.lastImportId = cur_import_id;
    var scenes_ids = prj.anim.scenes;
    if (!scenes_ids.length) _reportError('No scenes found in given project');
    var root = new Animation(),
        elems = prj.anim.elements,
        last_scene_band = [ 0, 0 ];
    root.__import_id = cur_import_id;

    root.meta = Import.meta(prj);
    root.fonts = Import.fonts(prj);
    Import.anim(prj, root); // will inject all required properties directly in scene object
    if (prj.meta.duration) root.duration = prj.meta.duration;

    var _a = prj.anim;

    Import._paths = prj.anim.paths;
    Import._path_cache = new ValueCache();

    for (var i = 0, il = scenes_ids.length; i < il; i++) {
        var node_src = Import._find(scenes_ids[i], elems);
        if (Import._type(node_src) != TYPE_SCENE) _reportError('Given Scene ID ' + scenes_ids[i] + ' points to something else');
        var node_res = Import.node(node_src, elems, null, root);
        //ignore empty scenes - if the band start/stop equals, the scene is of duration = 0
        if (node_res.gband[0] == node_res.gband[1]) {
            continue;
        };

        if (i > 0) { // start from second scene, if there is one
            // FIXME: smells like a hack
            // correct the band of the next scene to follow the previous scene
            // gband[1] contains the duration of the scene there, while gband[0] contains 0
            // (see SCENE type handling in Import.node)
            // TODO: fix it with proper native scenes when they will be supported in player
            var gband_before = node_res.gband;
            node_res.gband = [ last_scene_band[1] + gband_before[0],
                               last_scene_band[1] + gband_before[1] ];
            // local band is equal to global band on top level
            node_res.lband = node_res.gband;
            node_res.traverse(function(elm) {
                var e_gband_before = elm.gband;
                elm.gband = [ last_scene_band[1] + e_gband_before[0],
                              last_scene_band[1] + e_gband_before[1] ];
            });
        }
        last_scene_band = node_res.gband;
        root.add(node_res);
    }

    if (scenes_ids.length > 0) {
        node_res.gband = [last_scene_band[0], Infinity];
        node_res.lband = node_res.gband;
    }

    Import._paths = undefined; // clear
    Import._path_cache = undefined;

    return root;
}
/** meta **/
// -> Object
Import.meta = function(prj) {
    var _m = prj.meta;
    return {
        'title': _m.name,
        'author': _m.author,
        'copyright': _m.copyright,
        'version': _m.version,
        'description': _m.description,
        'duration': _m.duration,
        'created': _m.created,
        'modified': _m.modified,
        '_anm_id': _m.id
    };
}

Import.fonts = function(prj) {
    return prj.anim.fonts;
}
/** anim **/
/*
 * object {
 *     array { number; number; } dimension;
 *     *fill* background;             // project background
 *     array [ *element* ] elements;  // array of all elements including scenes - top level elements
 *     array [ number; ] scenes;      // array of indices into elements array
 * } *anim*;
 */
// -> Object
Import.anim = function(prj, trg) {
    var _a = prj.anim;
    trg.fps = _a.framerate;
    trg.width = _a.dimension ? Math.floor(_a.dimension[0]) : undefined;
    trg.height = _a.dimension ? Math.floor(_a.dimension[1]): undefined;
    trg.bgfill = _a.background ? Import.fill(_a.background) : undefined;
    trg.zoom = _a.zoom || 1.0;
    trg.speed = _a.speed || 1.0;
    if (_a.loop && ((_a.loop === true) || (_a.loop === 'true'))) trg.repeat = true;
}

var TYPE_UNKNOWN =  0,
    TYPE_CLIP    =  1,
    TYPE_SCENE   =  2,
    TYPE_PATH    =  3,
    TYPE_TEXT    =  4,
    TYPE_IMAGE   =  8,
    TYPE_GROUP   =  9,
    TYPE_AUDIO   = 14,
    TYPE_FONT    = 25,
    TYPE_VIDEO   = 26,
    TYPE_LAYER   = 255; // is it good?

function isPath(type) {
    return (type == TYPE_PATH);
}

/** node **/
/*
 * union {
 *     *shape_element*;
 *     *text_element*;
 *     *image_element*;
 *     *audio_element*;
 *     *clip_element*;
 * } *element*;
 */
// -> Element
Import.node = function(src, all, parent, anim) {
    var type = Import._type(src),
        trg = null;
    if ((type == TYPE_CLIP) ||
        (type == TYPE_SCENE) ||
        (type == TYPE_GROUP)) {
        trg = Import.branch(type, src, all, anim);
    } else if (type != TYPE_UNKNOWN) {
        trg = Import.leaf(type, src, parent, anim);
    }
    if (trg) {
        trg._anm_type = type;
        Import.callCustom(trg, src, type);
    };
    return trg;
}
var L_ROT_TO_PATH = 1,
    L_OPAQUE_TRANSFORM = 2;
    L_VISIBLE = 4;
/** branch (clip) **/
/*
 * array {
 *     number;                     // 0, type: 1 for clip, 9 for group
 *     string;                     // 1, name
 *     array [ *layer* ];          // 2, layers
 * } *group_element*, *clip_element*;
 *
 * array {
 *     2;                          // 0, type: scene
 *     string;                     // 1, name
 *     number;                     // 2, duration
 *     array [ *layer* ];          // 3, layers
 * } *group_element*;
 */
// -> Element
Import.branch = function(type, src, all, anim) {
    var trg = new Element();
    trg.name = src[1];
    var _layers = (type == TYPE_SCENE) ? src[3] : src[2],
        _layers_targets = [];
    if (type == TYPE_SCENE) {
        trg.gband = [ 0, src[2] ];
        trg.lband = [ 0, src[2] ];
    } else {
        trg.gband = [ 0, Infinity ];
        trg.lband = [ 0, Infinity ];
    }
    // in animatron layers are in reverse order
    for (var li = _layers.length; li--;) {
        /** layer **/
        /*
         * array {
         *     number;                     // 0, index of element in the elements array
         *     string;                     // 1, name
         *     *band*;                     // 2, band, default is absent, default is [0, infinity]
         *     number;                     // 3, if more than zero the number of masked layers under this one
         *     array { number; number; };  // 4, registration point, default is [0,0]
         *     *end-action*;               // 5, end action for this layer
         *     number;                     // 6, flags: 0x01 - rotate to path, 0x02 - opaque transform (TBD), 0x03 - visible
         *     array [ *tween* ];          // 7, array of tweens
         * } *layer*;
         */
        var lsrc = _layers[li];

        var nsrc = Import._find(lsrc[0], all);
        if (!nsrc) continue;

        // if there is a branch under the node, it will be a wrapper
        // if it is a leaf, it will be the element itself
        var ltrg = Import.node(nsrc, all, trg, anim);
        if (!ltrg.name) { ltrg.name = lsrc[1]; }

        // apply bands, pivot and registration point
        var flags = lsrc[6];
        ltrg.disabled = !(flags & L_VISIBLE);
        var b = Import.band(lsrc[2]);
        ltrg.lband = b;
        ltrg.gband = b;
        ltrg.$pivot = [ 0, 0 ];
        ltrg.$reg = lsrc[4] || [ 0, 0 ];

        // apply tweens
        if (lsrc[7]) {
            var translates;
            for (var tweens = lsrc[7], ti = 0, tl = tweens.length;
                 ti < tl; ti++) {
                var t = Import.tween(tweens[ti]);
                if (!t) continue;
                if (t.tween == C.T_TRANSLATE) {
                    if (!translates) translates = [];
                    translates.push(t);
                }
                ltrg.tween(t);
            }
            if (translates && (flags & L_ROT_TO_PATH)) {
                for (var ti = 0, til = translates.length; ti < til; ti++) {
                    ltrg.tween(
                        new Tween(C.T_ROT_TO_PATH).band(translates[ti].band)
                    );
                }
            }
            translates = [];
        }

        /** end-action **/
        /*
         * union {
         *    array { number; };          // end action without counter, currently just one: 0 for "once"
         *    array { number; number; };  // end action with counter. first number is type: 1-loop, 2-bounce, second number is counter: 0-infinite
         * } *end-action*;
         */
        // transfer repetition data
        if (lsrc[5]) {
            ltrg.mode = Import.mode(lsrc[5][0]);
            if (lsrc[5].length > 1) {
                ltrg.nrep = lsrc[5][1] || Infinity;
            }
        } else {
            ltrg.mode = Import.mode(null);
        }

        // Clips' end-actions like in Editor are not supported in Player,
        // but they may be adapted to Player's model (same as Group in Editor)
        if ((ltrg._anm_type == TYPE_CLIP) && (ltrg.mode != C.R_ONCE)) {
            ltrg.asClip([0, ltrg.lband[1] - ltrg.lband[0]], ltrg.mode, ltrg.nrep);
            ltrg.lband = [ ltrg.lband[0], Infinity ];
            ltrg.gband = [ ltrg.gband[0], Infinity ];
            ltrg.mode = C.R_STAY;
            ltrg.nrep = Infinity;
        }

        // if do not masks any layers, just add to target
        // if do masks, set it as a mask for them while not adding
        if (!lsrc[3]) { // !masked
            trg.add(ltrg);
            _layers_targets.push(ltrg);
        } else {
            // layer is a mask, apply it to the required number
            // of previously collected layers
            var mask = ltrg,
                togo = lsrc[3], // layers below to apply mask
                targets_n = _layers_targets.length;
            if (togo > targets_n) {
                _reportError('No layers collected to apply mask, expected ' + togo
                             + ', got ' + targets_n);
                togo = targets_n;
            };
            while (togo) {
                var masked = _layers_targets[targets_n-togo];
                masked.mask(mask);
                togo--;
            }
        }

        Import.callCustom(ltrg, lsrc, TYPE_LAYER);

        // TODO temporary implementation
        if (ltrg._audio_master) {
            ltrg.lband = [ltrg.lband[0], Infinity];
            ltrg.gband = [ltrg.gband[0], Infinity];
            trg.remove(ltrg);
            anim.add(ltrg);
        }
    }

    return trg;
}
/** leaf **/
// -> Element
Import.leaf = function(type, src, parent/*, anim*/) {
    var trg = new Element();
         if (type == TYPE_IMAGE) { trg.$image = Import.sheet(src); }
    else if (type == TYPE_TEXT)  { trg.$text  = Import.text(src);  }
    else if (type == TYPE_AUDIO) {
        trg.type = C.ET_AUDIO;
        trg.audio = Import.audio(src);
        trg.audio.connect(trg);
    }
    else if (type == TYPE_VIDEO) {}
    else { trg.$path  = Import.path(src);  }
    if (trg.$path || trg.$text) {
        trg.$fill = Import.fill(src[1]);
        trg.$stroke = Import.stroke(src[2]);
        trg.$shadow = Import.shadow(src[3]);
    }
    // FIXME: fire an event instead (event should inform about type of the importer)
    return trg;
}

// call custom importers
Import.callCustom = function(trg, src, type) {
    // FIXME: this code should be in player code
    if (Element._customImporters && Element._customImporters.length) {
        var importers = Element._customImporters;
        for (var i = 0, il = importers.length; i < il; i++) {
            importers[i].call(trg, src, type, IMPORTER_ID, cur_import_id);
        }
    }
}

/** band **/
// -> Array[2, Float]
Import.band = function(src) {
    if (!src || !src.length) return [ 0, Infinity ];
    if (src.length == 1) return [ src[0], Infinity ];
    if (src.length == 2) return src;
    _reportError('Unknown format of band: ' + src);
}
/** path (shape) **/
/*
 * array {
 *     number;    // 0, any number which is not clip(1), scene(2), group(9), audio(14), image(8), text(4)
 *     *fill*;    // 1
 *     *stroke*;  // 2
 *     *shadow*;  // 3
 *     string;    // 4, svg encoded path (or new format)
 * } *shape_element*;
 */
// -> Path
Import.path = function(src) {
    var path = Import._pathDecode(src[4]);
    if (!path) return;
    return new Path(path);
}

/*
 * Could be either String or Binary encoded path
 */
Import._pathDecode = function(src) {
    if (is.str(src)) return src;
    if (!is.num(src) || (src == -1)) return null;

    var encoded = Import._paths[src];
    if (!encoded) return;

    var val = Import._path_cache.get(encoded);
    if (val) {
        return [].concat(val.segs);
    } else {
        val = Import._decodeBinaryPath(encoded);
        if (!val) return null;
        Import._path_cache.put(encoded, val);
    }

    return val.segs;
}

Import._decodeBinaryPath = function(encoded) {
    var path = new Path();
    if (encoded) {
        encoded = encoded.replace(/\s/g, ''); // TODO: avoid this by not formatting base64 while exporting
        try {
            var decoded = Base64Decoder.decode(encoded);
            var s = new BitStream(decoded);
            var base = [0, 0];
            if (s) {
                var _do = true;
                while (_do) {
                    var type = s.readBits(2);
                    switch (type) {
                        case 0:
                            var p = Import._pathReadPoint(s, [], base);
                            base = p;

                            path.add(new MSeg(p));
                            break;
                        case 1:
                            var p = Import._pathReadPoint(s, [], base);
                            base = p;

                            path.add(new LSeg(p));
                            break;
                        case 2:
                            var p = Import._pathReadPoint(s, [], base);
                            Import._pathReadPoint(s, p);
                            Import._pathReadPoint(s, p);
                            base = [p[p.length - 2], p[p.length - 1]];

                            path.add(new CSeg(p));
                            break;
                        case 3:
                            _do = false;
                            break;
                        default:
                            _do = false;
                            _reportError('Unknown type "' + type + ' for path "' + encoded + '"');
                            break;
                    }
                }
            } else {
                _reportError('Unable to decode Path "' + encoded + '"');
                return null;
            }
        } catch (err) {
            _reportError('Unable to decode Path "' + encoded + '"');
            return null;
        }
    }

    return path;
}

Import._pathReadPoint = function(stream, target, base) {
    var l = stream.readBits(5);
    if (l <= 0) {
        throw new Error('Failed to decode path, wrong length (<= 0)');
    }

    var x = stream.readSBits(l);
    var y = stream.readSBits(l);

    var b_x = base ? base[0] : (target.length ? target[target.length - 2] : 0);
    var b_y = base ? base[1] : (target.length ? target[target.length - 1] : 0);

    target.push(b_x + x / 1000.0);
    target.push(b_y + y / 1000.0);
    return target;
}

/** text **/
/*
 * array {
 *     4;                // 0
 *     *fill*;           // 1
 *     *stroke*;         // 2
 *     *shadow*;         // 3
 *     string;           // 4, css font
 *     string;           // 5, aligment: left/right/center // IMPL
 *     string;           // 6, text
 *     number;           // 7, flags, currently just one: 1 - underline // IMPL
 * } *text_element*;
 */
var TEXT_UNDERLINE = 1,
    TEXT_MID_BASELINE = 2;
// -> Text
Import.text = function(src) {
    var lines = is.arr(src[6]) ? src : src[6].split('\n');
    return new Text((lines.length > 1) ? lines : lines[0],
                    src[4],
                    src[5], // align
                    (src[7] & TEXT_MID_BASELINE) ? 'middle' : 'bottom',
                    (src[7] & TEXT_UNDERLINE) ? true : false);
}
/** sheet (image) **/
/*
 * array {
 *     8;                          // 0
 *     string;                     // 1, url
 *     array { number; number; };  // 2, size [optional]
 * } *image_element*;
 */
// -> Sheet
Import.sheet = function(src) {
    var sheet = new anm.Sheet(src[1]);
    if (src[2]) sheet._dimen = src[2];
    return sheet;
}
/** tween **/
/*
 * union {
 *     *alpha_tween*;
 *     *rotate_tween*;
 *     *translate_tween*;
 *     *shear_tween*;
 *     *scale_tween*;
 * } *tween*;
 *
 * array {
 *     0;                          // 0, type
 *     array { number; number; };  // 1, band
 *     *easing*;                   // 2, optional easing
 *     union {
 *         array { number; };         // static alpha
 *         array { number; number; }; // alpha from, to
 *     };                          // 3
 * } *alpha_tween*;
 *
 * array {
 *     1;                          // 0, type
 *     array { number; number; };  // 1, band
 *     *easing*;                   // 2, optional easing
 *     union {
 *       array { number; };         // static rotate
 *       array { number; number; }; // rotate from, to
 *     };                          // 3
 * } *rotate_tween*;
 *
 * array {
 *     2;                          // 0, type
 *     array { number; number; };  // 1, band
 *     *easing*;                   // 2, optional easing
 *     union {
 *       array { number; };         // static sx=sy
 *       array { number; number; }; // dynamic from, to (sx=sy)
 *       array { number; number; number; number; }; // sx0, sy0, sx1, sy1
 *     };                          // 3
 * } *scale_tween*;
 *
 * array {
 *     3;                          // 0, type
 *     array { number; number; };  // 1, band
 *     *easing*;                   // 2, optional easing
 *     union {
 *       array { number; };         // static shx=shy
 *       array { number; number; }; // dynamic from, to (shx=shy)
 *       array { number; number; number; number; }; // shx0, shy0, shx1, shy1
 *     };                          // 3
 * } *shear_tween*;
 *
 * array {
 *     4;                          // 0, type
 *     array { number; number; };  // 1, band
 *     *easing*;                   // 2, optional easing
 *     string;                     // 3, path
 * } *translate_tween*;
 */
// -> Tween
Import.tween = function(src) {
    var type = Import.tweentype(src[0]);
    if (type == null) return null;
    var tween = new Tween(type, Import.tweendata(type, src[3]))
                          .band(Import.band(src[1])),
        easing = Import.easing(src[2]);
    if (easing) tween.easing(easing);
    return tween;
}
/** tweentype **/
// -> Type
Import.tweentype = function(src) {
    if (src === 0) return C.T_ALPHA;
    if (src === 1) return C.T_ROTATE;
    if (src === 2) return C.T_SCALE;
    if (src === 3) return C.T_SHEAR;
    if (src === 4) return C.T_TRANSLATE;
    //if (src === 5) return C.T_ROT_TO_PATH;
    if (src === 7) return C.T_VOLUME;
    if (src === 9) return C.T_FILL;
    if (src === 10) return C.T_STROKE;
}
/** tweendata **/
// -> Any
Import.tweendata = function(type, src) {
    if (src == null) return null; // !!! do not optimize to !src since 0 can also happen
    if (type === C.T_TRANSLATE) return Import.pathval(src);
    if ((type === C.T_ROTATE) ||
        (type === C.T_ALPHA)) {
        if (src.length == 2) return src;
        if (src.length == 1) return [ src[0], src[0] ];
    }
    if ((type === C.T_SCALE) ||
        (type === C.T_SHEAR)) {
        if (src.length == 4) return [ [ src[0], src[1] ],
                                      [ src[2], src[3] ] ];
        if (src.length == 2) return [ [ src[0], src[1] ],
                                      [ src[0], src[1] ] ];
        if (src.length == 1) return [ [ src[0], src[0] ],
                                      [ src[0], src[0] ] ];
    }
    if (type === C.T_FILL) {
        return [Import.fill(src[0]), Import.fill(src[1])];
    }
    if (type === C.T_STROKE) {
        return [Import.stroke(src[0]), Import.stroke(src[1])];
    }
    if (type === C.T_VOLUME) {
      if (src.length == 2) return src;
      if (src.length == 1) return [ src[0], src[0] ];
    }

}
/** easing **/
/*
 * union {
 *     number;                     // 0, standard type: 0, 1, 2, 3 (tbd)
 *     string;                     // 1, svg encoded curve segment
 * } *easing*;
 */
// -> Object
Import.easing = function(src) {
    if (!src) return null;
    if (is.str(src)) {
        return {
            type: C.E_PATH,
            data: Import.pathval('M0 0 ' + src + ' Z')
        }
    } else if (is.num(src)) {
        return {
            type: C.E_STDF,
            data: src
        }
    }
}
/** mode **/
Import.mode = function(src) {
    if (!src) return C.R_ONCE;
    if (src === 0) return C.R_ONCE;
    if (src === 1) return C.R_LOOP;
    if (src === 2) return C.R_BOUNCE;
    if (src === 3) return C.R_STAY;
}
/** brush (paint) **/
/*
 * union {
 *     string;          // color in rgba(), rgb, #xxxxxx or word format
 *     *lgrad*;         // linear gradient
 *     *rgrad*;         // radial gradient
 * } *paint*;
 */
 /** fill **/
Import.fill = function(src) {
    if (!src) return Brush.fill('transparent');
    if (is.str(src)) {
        return Brush.fill(src);
    } else if (is.arr(src)) {
        return Brush.fill(Import.grad(src));
    } else _reportError('Unknown type of brush');
}
/** stroke **/
/*
 * union {
 *     array {
 *        number;       // 0, width
 *        *paint*;      // 1
 *     };
 *     array {
 *        number;       // 0, width
 *        *paint*;      // 1
 *        string;       // 2, linecap ("round"if empty)
 *        string;       // 3, linejoin ("round" if empty)
 *        number;       // 4, mitterlimit
 *     }
 * } *stroke*;
 */
Import.stroke = function(src) {
    if (!src) return null;
    return Brush.stroke(is.arr(src[1]) ? Import.grad(src[1])
                                       : src[1], // paint
                        src[0], // width
                        src[2] || C.PC_ROUND, // cap
                        src[3] || C.PC_ROUND, // join
                        src[4]); // mitter
}
/** shadow **/
/*
 * array {
 *     number;       // 0, x
 *     number;       // 1, y
 *     number;       // 2, blur
 *     string;       // 3, css color
 * } *shadow*;
 */
Import.shadow = function(src) {
    if (!src) return null;
    return Brush.shadow(src[3],  // paint, never a gradient
                        src[2],  // blur-radius
                        src[0],  // offsetX
                        src[1]); // offsetY
}
/** lgrad **/
/*
 * array {          // linear gradient
 *     array {
 *         number;  // x0
 *         number;  // y0
 *         number;  // x1
 *         number;  // y1
 *     }; // 0
 *     array [ string; ]; // 1, colors
 *     array [ number; ]; // 2, offsets
 * }
 */
/** rgrad **/
/*
 * array {          // radial gradient
 *     array {
 *         number;  // x0
 *         number;  // y0
 *         number;  // r0
 *         number;  // x1
 *         number;  // y1
 *         number;  // r1
 *     }; // 0
 *     array [ string; ]; // 1, colors
 *     array [ number; ]; // 2, offsets
 * }
 */
Import.grad = function(src) {
    var pts = src[0],
        colors = src[1],
        offsets = src[2];
    if (colors.length != offsets.length) {
        _reportError('Number of colors do not corresponds to number of offsets in gradient');
    }
    var stops = [];
    for (var i = 0; i < offsets.length; i++) {
        stops.push([ offsets[i], colors[i] ]);
    }
    if (pts.length == 4) {
        return {
            dir: [ [ pts[0], pts[1] ], [ pts[2], pts[3] ] ],
            stops: stops
        };
    } else if (pts.length == 6) {
        return {
            r: [ pts[2], pts[5] ],
            dir: [ [ pts[0], pts[1] ], [ pts[3], pts[4] ] ],
            stops: stops
        };
    } else {
        _reportError('Unknown type of gradient with ' + pts.length + ' points');
    }
}
/** pathval **/
Import.pathval = function(src) {
    return new Path(Import._pathDecode(src));
}

Import.audio = function(src) {
    var audio = new Audio(src[1]);
    audio.offset = src[2];
    audio.master = src[3];
    return audio;
}

// BitStream
// -----------------------------------------------------------------------------

function BitStream(int8array) {
    this.buf = int8array;
    this.pos = 0;
    this.bitPos = 0;
    this.bitsBuf = 0;
}

/*
 * Reads n unsigned bits
 */
BitStream.prototype.readBits = function(n) {
    var v = 0;
    for (;;) {
        var s = n - this.bitPos;
        if (s>0) {
            v |= this.bitBuf << s;
            n -= this.bitPos;
            this.bitBuf = this.readUByte();
            this.bitPos = 8;
        } else {
            s = -s;
            v |= this.bitBuf >> s;
            this.bitPos = s;
            this.bitBuf &= (1 << s) - 1;
            return v;
        }
    }
}

/*
 * Reads one unsigned byte
 */
BitStream.prototype.readUByte = function() {
    return this.buf[this.pos++]&0xff;
}

/*
 * Reads n signed bits
 */
BitStream.prototype.readSBits = function(n) {
    var v = this.readBits(n);
    // Is the number negative?
    if( (v&(1 << (n - 1))) != 0 ) {
        // Yes. Extend the sign.
        v |= -1 << n;
    }

    return v;
}

// Base64 Decoder
// -----------------------------------------------------------------------------

function Base64Decoder() {}

// FIXME: one function is also enough here
/*
 * Returns int8array
 */
Base64Decoder.decode = function(str) {
    return Base64Decoder.str2ab(Base64Decoder._decode(str));
}

Base64Decoder.str2ab = function(str) {
    var result = new Int8Array(str.length);
    for (var i=0, strLen=str.length; i<strLen; i++) {
        result[i] = str.charCodeAt(i);
    }
    return result;
}

Base64Decoder._decode = function(data) {
    if (typeof window['atob'] === 'function') {
        // optimize
        return atob(data);
    }

    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
        ac = 0,
        dec = "",
        tmp_arr = [];

    if (!data) {
        return data;
    }

    data += '';

    do { // unpack four hexets into three octets using index points in b64
        h1 = b64.indexOf(data.charAt(i++));
        h2 = b64.indexOf(data.charAt(i++));
        h3 = b64.indexOf(data.charAt(i++));
        h4 = b64.indexOf(data.charAt(i++));

        bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

        o1 = bits >> 16 & 0xff;
        o2 = bits >> 8 & 0xff;
        o3 = bits & 0xff;

        if (h3 == 64) {
            tmp_arr[ac++] = String.fromCharCode(o1);
        } else if (h4 == 64) {
            tmp_arr[ac++] = String.fromCharCode(o1, o2);
        } else {
            tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
        }
    } while (i < data.length);

    dec = tmp_arr.join('');

    return dec;
}

// Path cache
// -----------------------------------------------------------------------------

// FIXME: use an object and a hash function for this, no need in special class

function ValueCache() {
    this.hash2val = {};
}

ValueCache.prototype.put = function(str, val) {
    this.hash2val[this.hash(str)] = val;
}

ValueCache.prototype.get = function(str) {
    return this.hash2val[this.hash(str)];
}

ValueCache.prototype.hash = function(str) {
    var hash = 0, i, char;
    if (str.length == 0) return hash;
    for (i = 0, l = str.length; i < l; i++) {
        char  = str.charCodeAt(i);
        hash  = ((hash<<5)-hash)+char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

// Finish the importer
// -----------------------------------------------------------------------------

function __MYSELF() { }

__MYSELF.prototype.load = Import.project;

__MYSELF.Import = Import;

__MYSELF.IMPORTER_ID = IMPORTER_ID;

return __MYSELF;

})();

anm.importers.register('animatron', AnimatronImporter);

//module.exports = AnimatronImporter;
