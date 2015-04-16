var C = require('../constants.js');

var CSeg = require('../graphics/segments.js').CSeg;

// Easings
// -----------------------------------------------------------------------------
// function-based easings

var EasingImpl = {};

EasingImpl[C.E_PATH] =
    function(path) {
        /*var path = Path.parse(str);*/
        return function(t) {
            return path.pointAt(t)[1];
        };
    };
EasingImpl[C.E_FUNC] =
    function(f) {
        return f;
    };
EasingImpl[C.E_CSEG] =
    function(seg) {
        return function(t) {
            return seg.atT([0, 0], t)[1];
        };
    };
EasingImpl[C.E_STDF] =
    function(num) {
        return STD_EASINGS[num];
    };

// segment-based easings

var SEGS = {}; // segments cache for easings

function registerSegEasing(alias, points) {
    C['E_'+alias] = alias;
    var seg = new CSeg(points);
    SEGS[alias] = seg;
    var func =
        function(t) {
            return seg.atT([0, 0], t)[1];
        };
    C['EF_'+alias] = func;
    EasingImpl[alias] = function() {
        return func;
    };
}

registerSegEasing('default',    [0.250, 0.100, 0.250, 1.000, 1.000, 1.000]); // Default
registerSegEasing('in',         [0.420, 0.000, 1.000, 1.000, 1.000, 1.000]); // In
registerSegEasing('out',        [0.000, 0.000, 0.580, 1.000, 1.000, 1.000]); // Out
registerSegEasing('inout',      [0.420, 0.000, 0.580, 1.000, 1.000, 1.000]); // InOut
registerSegEasing('sinein',     [0.470, 0.000, 0.745, 0.715, 1.000, 1.000]); // Sine In
registerSegEasing('sineout',    [0.390, 0.575, 0.565, 1.000, 1.000, 1.000]); // Sine Out
registerSegEasing('sineinout',  [0.445, 0.050, 0.550, 0.950, 1.000, 1.000]); // Sine InOut
registerSegEasing('quadin',     [0.550, 0.085, 0.680, 0.530, 1.000, 1.000]); // Quad In
registerSegEasing('quadout',    [0.250, 0.460, 0.450, 0.940, 1.000, 1.000]); // Quad Out
registerSegEasing('quadinout',  [0.455, 0.030, 0.515, 0.955, 1.000, 1.000]); // Quad InOut
registerSegEasing('cubicin',    [0.550, 0.055, 0.675, 0.190, 1.000, 1.000]); // Cubic In
registerSegEasing('cubicout',   [0.215, 0.610, 0.355, 1.000, 1.000, 1.000]); // Cubic Out
registerSegEasing('cubicinout', [0.645, 0.045, 0.355, 1.000, 1.000, 1.000]); // Cubic InOut
registerSegEasing('quartin',    [0.895, 0.030, 0.685, 0.220, 1.000, 1.000]); // Quart In
registerSegEasing('quartout',   [0.165, 0.840, 0.440, 1.000, 1.000, 1.000]); // Quart Out
registerSegEasing('quartinout', [0.770, 0.000, 0.175, 1.000, 1.000, 1.000]); // Quart InOut
registerSegEasing('quintin',    [0.755, 0.050, 0.855, 0.060, 1.000, 1.000]); // Quint In
registerSegEasing('quintout',   [0.230, 1.000, 0.320, 1.000, 1.000, 1.000]); // Quart Out
registerSegEasing('quintinout', [0.860, 0.000, 0.070, 1.000, 1.000, 1.000]); // Quart InOut
registerSegEasing('expoin',     [0.950, 0.050, 0.795, 0.035, 1.000, 1.000]); // Expo In
registerSegEasing('expoout',    [0.190, 1.000, 0.220, 1.000, 1.000, 1.000]); // Expo Out
registerSegEasing('expoinout',  [1.000, 0.000, 0.000, 1.000, 1.000, 1.000]); // Expo InOut
registerSegEasing('circin',     [0.600, 0.040, 0.980, 0.335, 1.000, 1.000]); // Circ In
registerSegEasing('circout',    [0.075, 0.820, 0.165, 1.000, 1.000, 1.000]); // Circ Out
registerSegEasing('circinout',  [0.785, 0.135, 0.150, 0.860, 1.000, 1.000]); // Circ InOut
registerSegEasing('backin',     [0.600, -0.280, 0.735, 0.045, 1.000, 1.000]); // Back In
registerSegEasing('backout',    [0.175, 0.885, 0.320, 1.275, 1.000, 1.000]); // Back Out
registerSegEasing('backinout',  [0.680, -0.550, 0.265, 1.550, 1.000, 1.000]); // Back InOut

var STD_EASINGS = [
    function(t) { return C.EF_DEF(t); }, // Default
    function(t) { return C.EF_IN(t); },  // In
    function(t) { return C.EF_OUT(t); }, // Out
    function(t) { return C.EF_INOUT(t); }, // InOut
    function(t) { return t*t; },    // 4    In Quad
    function(t) { return t*(2-t); },// 5    Out Quad
    function(t) {                   // 6    In/Out Quad
        if (t < 0.5) return 2*t*t;
        else {
            t = (t-0.5)*2;
            return -(t*(t-2)-1)/2;
        }
    },
    function(t) {                   // 7    In Cubic
        return t*t*t;
    },
    function(t) {                  // 8     Out Cubic
        t = t-1;
        return t*t*t + 1;
    },
    function(t) {                  // 9     In/Out Cubic
        if (t < 0.5) {
            t = t*2;
            return t*t*t/2;
        } else {
            t = (t-0.5)*2-1;
            return (t*t*t+2)/2;
        }
    },
    function(t) {                  // 10   In Sine
        return 1 - Math.cos(t * (Math.PI/2));
    },
    function(t) {                 // 11    Out Sine
        return Math.sin(t * (Math.PI/2));
    },
    function(t) {                 // 12    In/Out Sine
        return -(Math.cos(Math.PI*t) - 1)/2;
    },
    function(t) {                 // 13   In Expo
        return (t<=0) ? 0 : Math.pow(2, 10 * (t - 1));
    },
    function(t) {                // 14    Out Expo
        return t>=1 ? 1 : (-Math.pow(2, -10 * t) + 1);
    },
    function(t) {                // 15    In/Out Expo
        if (t<=0) return 0;
        if (t>=1) return 1;
        if (t < 0.5) return Math.pow(2, 10 * (t*2 - 1))/2;
        else {
            return (-Math.pow(2, -10 * (t-0.5)*2) + 2)/2;
        }
    },
    function(t) {               // 16    In Circle
        return 1-Math.sqrt(1 - t*t);
    },
    function(t) {              // 17     Out Circle
        t = t-1;
        return Math.sqrt(1 - t*t);
    },
    function(t) {              // 18     In/Out Cicrle
        if ((t*=2) < 1) return -(Math.sqrt(1 - t*t) - 1)/2;
        return (Math.sqrt(1 - (t-=2)*t) + 1)/2;
    },
    function(t) {              // 19    In Back
        var s = 1.70158;
        return t*t*((s+1)*t - s);
    },
    function(t) {             // 20     Out Back
        var s = 1.70158;
        return ((t-=1)*t*((s+1)*t + s) + 1);
    },
    function(t) {             // 21     In/Out Back
        var s = 1.70158;
        if ((t*=2) < 1) return (t*t*(((s*=(1.525))+1)*t - s))/2;
        return ((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2)/2;
    },
    function(t) {             // 22     In Bounce
        return 1 - STD_EASINGS[23](1-t);
    },
    function(t) {              // 23    Out Bounce
        if (t < (1/2.75)) {
            return (7.5625*t*t);
        } else if (t < (2/2.75)) {
            return (7.5625*(t-=(1.5/2.75))*t + 0.75);
        } else if (t < (2.5/2.75)) {
            return (7.5625*(t-=(2.25/2.75))*t + 0.9375);
        } else {
            return (7.5625*(t-=(2.625/2.75))*t + 0.984375);
        }
    },
    function(t) {             // 24     In/Out Bounce
        if (t < 0.5) return STD_EASINGS[22](t*2) * 0.5;
        return STD_EASINGS[23](t*2-1) * 0.5 + 0.5;
    }
];

module.exports = EasingImpl;
