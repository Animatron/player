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

/**
 * @class anm.AnimatronImporter
 */
var AnimatronImporter = (function() {

var IMPORTER_ID = 'ANM'; // FIXME: change to 'animatron', same name as registered

var C = anm.constants,
    Animation = anm.Animation,
    Scene = anm.Scene,
    Element = anm.Element,
    Path = anm.Path,
    Text = anm.Text,
    Brush = anm.Brush,
    Bands = anm.Bands,
    Tween = anm.Tween,
    MSeg = anm.MSeg,
    LSeg = anm.LSeg,
    CSeg = anm.CSeg;

var Audio = anm.Audio,
    Video = anm.Video;

var is = anm.utils.is,
    roundTo = anm.utils.roundTo,
    errors = anm.errors,
    $log = anm.log;
    //test = anm._valcheck

function _reportError(text) {
    $log.error(errors.system(text));
    // throw e; // skip errors if they do not affect playing ability
}

var Import = {};

var cur_import_id;

// -> Array[?]
Import._find = function(idx, src) {
    var res = src[idx];
    if (!res) _reportError('Element with index ' + idx + ' was not found' +
                            (src ? ' among ' + src.length + ' elements.' : '.') );
    return src[idx];
};

// -> Integer
Import._type = function(src) {
    return src[0];
};

/** project **/
/*
 * object {
 *     object *meta*;     // meta info about the project (the same as for full format)
 *     object *anim*;     // animation info
 * } *project*;
 */
// -> Animation
Import.project = function(prj) {
    if (anm.conf.logImport) $log.debug(prj);
    cur_import_id = anm.utils.guid();
    anm.lastImportedProject = prj;
    anm.lastImportId = cur_import_id;
    var scenes_ids = prj.anim.scenes;
    if (!scenes_ids.length) _reportError('No scenes found in given project');
    var root = new Animation(),
        elems = prj.anim.elements;
    root.__import_id = cur_import_id;

    root.meta = Import.meta(prj);
    root.fonts = Import.fonts(prj);
    Import.root = root;

    Import._paths = prj.anim.paths || [];
    Import._path_cache = new ValueCache();

    Import.anim(prj, root); // will inject all required properties directly in animation object

    // some additional configuration
    if (prj.meta.duration && !prj.anim.script) {
        root.setDuration(prj.meta.duration);
    }
    if (prj.anim.script) {
        root.actions = prj.anim.script;
        root.setDuration(Infinity);
        root.endOnLastScene = true;
    }

    var scene;

    for (var i = 0, il = scenes_ids.length; i < il; i++) {
        var node_src = Import._find(scenes_ids[i], elems);
        if (Import._type(node_src) != TYPE_SCENE) _reportError('Given Scene ID ' + scenes_ids[i] + ' points to something else');
        scene = Import.scene(node_src, elems, root); // also fill scene with all the elements defined in JSON
        // there's always a default scene in Player, which is first one
        if (i === 0) { root.replaceScene(0, scene); } else { root.addScene(scene); };
    }

    Import._paths = undefined; // clear
    Import._path_cache = undefined;

    return root;
};
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
};

Import.fonts = function(prj) {
    return prj.anim.fonts;
};
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
    var a = prj.anim;
    trg.fps = a.framerate;
    trg.width = a.dimension ? Math.floor(a.dimension[0]) : undefined;
    trg.height = a.dimension ? Math.floor(a.dimension[1]): undefined;
    trg.bgfill = a.background ? Import.fill(a.background) : undefined;
    trg.zoom = a.zoom || 1.0;
    trg.setSpeed(a.speed || 1.0);
    if (a.loop && ((a.loop === true) || (a.loop === 'true'))) trg.repeat = true;
};

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
    TYPE_SKELETON = 28,
    TYPE_BONES = 29,
    TYPE_BONE = 30,
    TYPE_LAYER   = 255; // is it good?

var TYPE_TO_NAME = {};
TYPE_TO_NAME[TYPE_UNKNOWN] = 'unknown';
TYPE_TO_NAME[TYPE_CLIP] = 'clip';
TYPE_TO_NAME[TYPE_SCENE] = 'scene';
TYPE_TO_NAME[TYPE_PATH] = 'path';
TYPE_TO_NAME[TYPE_TEXT] = 'text';
TYPE_TO_NAME[TYPE_IMAGE] = 'image';
TYPE_TO_NAME[TYPE_GROUP] = 'group';
TYPE_TO_NAME[TYPE_AUDIO] = 'audio';
TYPE_TO_NAME[TYPE_FONT] = 'font';
TYPE_TO_NAME[TYPE_VIDEO] = 'video';
TYPE_TO_NAME[TYPE_SKELETON] = 'skeleton';
TYPE_TO_NAME[TYPE_BONES] = 'bones';
TYPE_TO_NAME[TYPE_BONE] = 'bone';
TYPE_TO_NAME[TYPE_LAYER] = 'layer';

function isPath(type) {
    return (type == TYPE_PATH);
}

Import.scene = function(src, all, anim) {
    var scene = new Scene(anim);
    // adds properties to existing scene instance, so it will be possible to assign
    // it to every element inside on creation (but actual process of appending to scene
    // happens inside Scene._fromElement)
    Scene._fromElement(Import.node(src, null, null, all, null, anim, scene), anim, scene);
    return scene;
};

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
Import.node = function(src, layer_src, layer_band, all, parent, anim, scene) {
    var type = Import._type(src),
        trg = null;
    if ((type == TYPE_CLIP) ||
        (type == TYPE_SCENE) ||
        (type == TYPE_GROUP) ||
        (type == TYPE_SKELETON) ||
        (type == TYPE_BONES)) {
        trg = Import.branch(type, src, layer_src, layer_band, all, anim, scene);
    } else if (type != TYPE_UNKNOWN) {
        trg = Import.leaf(type, src, layer_src, layer_band, parent, anim, scene);
    }
    if (trg) {
        Import.callCustom(trg, src, type);
    }
    trg.import_type = TYPE_TO_NAME[type];
    return trg;
};

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
Import.branch = function(type, src, parent_src, parent_band, all, anim, scene) {
    var trg = new Element();
    trg.name = src[1];
    var _layers = (type == TYPE_SCENE) ? src[3] : src[2],
        _layers_targets = [];
    if (type === TYPE_SCENE) {
        trg.duration(src[2]);
    } else {
        trg.band(0, Infinity);
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
        var layer_src = _layers[li];

        var node_src = Import._find(layer_src[0], all);
        if (!node_src) continue;

        var band = Import.band(layer_src[2]);
        // if there is a branch under the node, it will be a wrapper
        // if it is a leaf, it will be the element itself
        var layer_trg = Import.node(node_src, layer_src, band, all, trg, anim, scene);
        if (!layer_trg) continue;
        layer_trg.name = layer_src[1];

        // apply bands, pivot and registration point
        var flags = layer_src[6];
        layer_trg.disabled = !(flags & L_VISIBLE);

        if (type !== TYPE_GROUP) {
            layer_trg.band(band[0], band[1]);
        } else {
            layer_trg.band(band[0] - parent_band[0], band[1] - parent_band[0]);
        }
        layer_trg.$pivot = [ 0, 0 ];
        layer_trg.$reg = layer_src[4] || [ 0, 0 ];

        // apply tweens
        if (layer_src[7]) {
            var rotate_tweens = 0;
            var first_rotate = Infinity, last_rotate = 0;
            for (var tweens = layer_src[7], ti = 0, tl = tweens.length;
                 ti < tl; ti++) {
                var t = Import.tween(tweens[ti]);
                if (!t) continue;
                if (flags & L_ROT_TO_PATH) {
                    if (t.tween_type === C.T_ROTATE) {
                        first_rotate = Math.min(first_rotate, t.$band[0]);
                        last_rotate = Math.max(last_rotate, t.$band[1]);
                        rotate_tweens++;
                    }
                }
                layer_trg.tween(t);
            }
            if (flags & L_ROT_TO_PATH) {
                if (rotate_tweens) {
                    if ((first_rotate > 0) && (first_rotate < Infinity)) {
                        layer_trg.tween(Tween.rotate().start(0).stop(first_rotate)
                                                 .from(0).to(0));
                    }
                    if ((last_rotate > 0) && (last_rotate < Infinity)) {
                        layer_trg.tween(Tween.rotate().start(last_rotate).stop(band[1] - band[0])
                                                 .from(0).to(0));
                    }
                } else {
                    layer_trg.tween(Tween.rotate().start(0).stop(Infinity).from(0).to(0));
                }
                layer_trg.tween(Tween.rotatetopath().start(0).stop(Infinity));
            }
        }

        /** end-action **/
        /*
         * union {
         *    array { number; };          // end action without counter, currently just one: 0 for "once"
         *    array { number; number; };  // end action with counter. first number is type: 1-loop, 2-bounce, second number is counter: 0-infinite
         * } *end-action*;
         */
        // transfer repetition data
        if (layer_src[5]) {
            layer_trg.repeat(Import.mode(layer_src[5][0], layer_src[5][1]));
        } else {
            layer_trg.repeat(Import.mode(null));
        }

        // if do not masks any layers, store it as a potential mask target
        // if do masks, set it as a mask for them while not adding
        if (!layer_src[3]) { // !masked
            _layers_targets.push(layer_trg);
        } else {
            // layer is a mask, apply it to the required number
            // of previously collected layers
            var mask = layer_trg,
                togo = layer_src[3], // layers below to apply mask
                targets_n = _layers_targets.length;
            layer_trg.markAsMask();
            if (togo > targets_n) {
                _reportError('No layers collected to apply mask, expected ' +
                             togo + ', got ' + targets_n);
                togo = targets_n;
            }
            while (togo) {
                var masked = _layers_targets[targets_n-togo];
                masked.maskWith(mask);
                togo--;
            }
        }
        trg.add(layer_trg);

        Import.callCustom(layer_trg, layer_src, TYPE_LAYER);

        // TODO temporary implementation, use custom renderer for that!
        if (layer_trg.$audio && layer_trg.$audio.master) {
            layer_trg.band(band[0], Infinity);
            trg.remove(layer_trg);
            anim.addMasterAudio(layer_trg);
        }
    }

    if (type === TYPE_SKELETON) {
        trg.layer2Bone = new Array(_layers.length);
        var bones = trg.children[0];
        for (var li = bones.children.length; li--;) {
            trg.layer2Bone[bones.children[li].$to] = bones.children[li];
        }
    }

    return trg;
};

/** leaf **/
// -> Element
Import.leaf = function(type, src, layer_src, layer_band, parent, anim, scene) {
    var trg = new Element();
    var hasUrl = !!src[1];
    if (!hasUrl &&
        (type === TYPE_IMAGE || type === TYPE_AUDIO || type === TYPE_VIDEO)) {
        return null;
    }
    if (type == TYPE_IMAGE) {
        trg.$image = Import.sheet(src);
    }
    else if (type == TYPE_TEXT)  { trg.$text  = Import.text(src);  }
    else if (type == TYPE_AUDIO) {
        trg.type = C.ET_AUDIO;
        trg.$audio = Import.audio(src);
        if (!trg.$audio.isMaster()) trg.$audio.connect(trg, anim, scene);
    }
    else if (type == TYPE_VIDEO) {
        trg.type = C.ET_VIDEO;
        trg.$video = Import.video(src);
        trg.$video.connect(trg, anim, scene);
    }
    else if (type == TYPE_BONE) {
        trg.$from = src[1];
        trg.$to = src[2];
    }
    else { trg.$path  = Import.path(src);  }
    if (trg.$path || trg.$text) {
        trg.$fill = Import.fill(src[1]);
        trg.$stroke = Import.stroke(src[2]);
        trg.$shadow = Import.shadow(src[3]);
    }
    // FIXME: fire an event instead (event should inform about type of the importer)
    trg.import_type = TYPE_TO_NAME[type];
    return trg;
};


// call custom importers
Import.callCustom = function(trg, src, type) {
    // FIXME: this code should be in player code
    if (Element._customImporters && Element._customImporters.length) {
        var importers = Element._customImporters;
        for (var i = 0, il = importers.length; i < il; i++) {
            importers[i].call(trg, src, type, IMPORTER_ID, cur_import_id);
        }
    }
};

/** band **/
// -> Array[2, Float]
Import.band = function(src) {
    if (!src || !src.length) return [ 0, Infinity ];
    if (src.length == 1) return [ src[0], Infinity ];
    if (src.length == 2) return src;
    _reportError('Unknown format of band: ' + src);
};

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
};

/*
 * Could be either String or Binary encoded path
 */
Import._pathDecode = function(src) {
    if (is.str(src)) return src;
    if (!is.num(src) || (src == -1)) return null;

    var encoded = Import._paths[src];
    if (!encoded) return null;

    var val = Import._path_cache.get(encoded);
    if (val) {
        return val;
    } else {
        val = Import._decodeBinaryPath(encoded);
        if (!val) return null;
        Import._path_cache.put(encoded, val);
    }

    return val;
};

Import._decodeBinaryPath = function(encoded) {
    var path = '';
    if (encoded) {
        encoded = encoded.replace(/\s/g, ''); // TODO: avoid this by not formatting base64 while exporting
        try {
            var decoded = Base64Decoder.decode(encoded);
            var s = new BitStream(decoded);
            var base = [0, 0];
            if (s) {
                var hasBits = true;
                while (hasBits) {
                    var type = s.readBits(2), p;
                    switch (type) {
                        case 0:
                            p = Import._pathReadPoint(s, base);
                            base = p;
                            path += ' M ' + p.join(',');
                            break;
                        case 1:
                            p = Import._pathReadPoint(s, base);
                            base = p;
                            path += ' L ' + p.join(',');
                            break;
                        case 2:
                            var cStr = ' C';
                            p = base;
                            for (var i = 0; i < 3; i++) {
                                p = Import._pathReadPoint(s, p);
                                cStr += ' ' + p.join(',');
                            }
                            base = p;
                            path += cStr;
                            break;
                        default:
                            hasBits = false;
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
};

Import._pathReadPoint = function(stream, base) {
    base = base || [0,0];
    var l = stream.readBits(5);
    if (l <= 0) {
        throw new Error('Failed to decode path, wrong length (<= 0)');
    }

    var x = stream.readSBits(l);
    var y = stream.readSBits(l);

    return [roundTo(base[0] + x / 1000.0, 2), roundTo(base[1] + y / 1000.0, 2)];
};

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
};
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
};
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
    if (!type) return null; // type is a string
    var tween = Tween[type](Import.tweendata(type, src[3]))
                           .band(Import.band(src[1])),
        easing = Import.easing(src[2]);
    if (easing) tween.easing(easing);
    return tween;
};
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
    if (src === 11) return C.T_SHADOW;
    if (src === 12) return C.T_SWITCH;
    if (src === 13) return C.T_BONE_ROTATE;
    if (src === 14) return C.T_BONE_LENGTH;
};
/** tweendata **/
// -> Any
Import.tweendata = function(type, src) {
    if (src === null) return null; // !!! do not optimize to !src since 0 can also happen
    if (type === C.T_TRANSLATE) return Import.pathval(src);
    if ((type === C.T_ROTATE) ||
        (type === C.T_ALPHA) ||
        (type === C.T_BONE_ROTATE) ||
        (type === C.T_BONE_LENGTH)) {
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
    if (type === C.T_SHADOW) {
        return [Import.shadow(src[0]), Import.shadow(src[1])];
    }
    if (type === C.T_VOLUME) {
        if (src.length == 2) return src;
        if (src.length == 1) return [ src[0], src[0] ];
    }
    if (type === C.T_SWITCH) return src;
};
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
        };
    } else if (is.num(src)) {
        return {
            type: C.E_STDF,
            data: src
        };
    }
};
/** mode **/
Import.mode = function(src) {
    if (!src) return C.R_ONCE;
    if (src === 0) return C.R_ONCE;
    if (src === 1) return C.R_LOOP;
    if (src === 2) return C.R_BOUNCE;
    if (src === 3) return C.R_STAY;
};
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
        if (is.arr(src[0])) {
            return Brush.fill(Import.grad(src));
        }
        return Brush.fill(Import.pattern(src));
    } else _reportError('Unknown type of brush');
};
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
    var fill;
    if (is.str(src[1])) {
        fill = src[1];
    } else if (is.arr(src[1])) {
        if (is.arr(src[1][0])) {
            fill = Import.grad(src[1]);
        } else {
            fill = Import.pattern(src[1]);
        }
    }
    return Brush.stroke(fill, // paint
                        src[0], // width
                        src[2] || C.PC_ROUND, // cap
                        src[3] || C.PC_ROUND, // join
                        src[4]); // mitter
};
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
};
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
};
/** pattern **/
/*
 * array {          // pattern
 *     number;      // id of either shapeelement or image element
 *     number;      // 0 - no repeat, 1 - repeat xy, 2 - repeat x, 3 - repeat y
 *     number;      // width
 *     number;      // height
 *     array { number; number; number; number; }  // rectangle, inner bounds
 *     number;      // opacity
 * }
 */
var repeats = ['no-repeat', 'repeat', 'repeat-x', 'repeat-y'];

Import.pattern = function(src) {
    var el = anm.lastImportedProject.anim.elements[src[0]],
        elm = Import.leaf(Import._type(el), el/*, layer, layer_band, parent, anim*/);
    if (elm) {
        elm.alpha = src[5];
        elm.disabled = true;
        Import.root.add(elm);
        return {
            elm: elm,
            repeat: repeats[src[1]],
            w: src[2],
            h: src[3],
            bounds: src[4]
        };
    }
};

/** pathval **/
Import.pathval = function(src) {
    return new Path(Import._pathDecode(src));
};

Import.audio = function(src) {
    var audio = new Audio(src[1]);
    audio.offset = src[2];
    audio.master = src[3];
    return audio;
};

Import.video = function(src) {
    var video = new Video(src[1], src[3], src[4]);
    video.offset = src[2];
    return video;
};

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
};

/*
 * Reads one unsigned byte
 */
BitStream.prototype.readUByte = function() {
    return this.buf[this.pos++]&0xff;
};

/*
 * Reads n signed bits
 */
BitStream.prototype.readSBits = function(n) {
    var v = this.readBits(n);
    // Is the number negative?
    if( (v&(1 << (n - 1))) !== 0 ) {
        // Yes. Extend the sign.
        v |= -1 << n;
    }

    return v;
};

// Base64 Decoder
// -----------------------------------------------------------------------------

function Base64Decoder() {}

// FIXME: one function is also enough here
/*
 * Returns int8array
 */
Base64Decoder.decode = function(str) {
    return Base64Decoder.str2ab(Base64Decoder._decode(str));
};

var Int8Array = window.Int8Array || Array;

Base64Decoder.str2ab = function(str) {
    var result = new Int8Array(str.length);
    for (var i=0, strLen=str.length; i<strLen; i++) {
        result[i] = str.charCodeAt(i);
    }
    return result;
};

Base64Decoder._decode = function(data) {
    if (window.atob) {
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
};

// Path cache
// -----------------------------------------------------------------------------

// FIXME: use an object and a hash function for this, no need in special class

function ValueCache() {
    this.hash2val = {};
}

ValueCache.prototype.put = function(str, val) {
    this.hash2val[this.hash(str)] = val;
};

ValueCache.prototype.get = function(str) {
    return this.hash2val[this.hash(str)];
};

ValueCache.prototype.hash = function(str) {
    var hash = 0, i, ch;
    if (str.length === 0) return hash;
    for (i = 0, l = str.length; i < l; i++) {
        ch  = str.charCodeAt(i);
        hash  = ((hash<<5)-hash)+ch;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

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
