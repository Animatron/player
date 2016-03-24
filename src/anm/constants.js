// Constants
// -----------------------------------------------------------------------------
var C = {};

// Logging
// -----------------------------------------------------------------------------

C.L_DEBUG = 1;
C.L_INFO = 2;
C.L_WARN = 4;
C.L_ERROR = 8;

// ### Player states
/* ----------------- */

C.NOTHING = 'nothing';
C.STOPPED = 'stopped';
C.PLAYING = 'playing';
C.PAUSED = 'paused';
C.LOADING = 'loading';
C.RES_LOADING = 'loadingresources';
C.ERROR = 'error';

// public constants below are also appended to C object, but with `X_`-like prefix
// to indicate their scope, see through all file

// ### Player Modes constants
/* -------------------------- */

C.M_CONTROLS_ENABLED = 1;    C.M_CONTROLS_DISABLED = 2;
C.M_INFO_ENABLED = 4;        C.M_INFO_DISABLED = 8;
C.M_HANDLE_EVENTS = 16;      C.M_DO_NOT_HANDLE_EVENTS = 32;
C.M_DRAW_STILL = 64;         C.M_DO_NOT_DRAW_STILL = 128;
C.M_INFINITE_DURATION = 256; C.M_FINITE_DURATION = 512;

C.M_PREVIEW = C.M_CONTROLS_DISABLED
              | C.M_INFO_DISABLED
              | C.M_DO_NOT_HANDLE_EVENTS
              | C.M_DRAW_STILL
              | C.M_FINITE_DURATION;
C.M_DYNAMIC = C.M_CONTROLS_DISABLED
              | C.M_INFO_DISABLED
              | C.M_HANDLE_EVENTS
              | C.M_DO_NOT_DRAW_STILL
              | C.M_INFINITE_DURATION;
C.M_VIDEO = C.M_CONTROLS_ENABLED
            | C.M_INFO_DISABLED
            | C.M_DO_NOT_HANDLE_EVENTS
            | C.M_DRAW_STILL
            | C.M_FINITE_DURATION;
C.M_SANDBOX = C.M_CONTROLS_DISABLED
            | C.M_INFO_DISABLED
            | C.M_DO_NOT_HANDLE_EVENTS
            | C.M_DO_NOT_DRAW_STILL
            | C.M_FINITE_DURATION;

// ### Load targets
/* ---------------- */

C.LT_ANIMATION = 1;
C.LT_ELEMENTS = 2;
C.LT_IMPORT = 3;
C.LT_URL = 4;

// ### Loading modes
/* ---------------- */

// loading modes below are closely tied to `autoPlay` option: if it's set to `true`, playing starts
// immediately after loading (default is `false`)

// there are also playing modes below;

C.LM_RIGHTAWAY = 'rightaway'; // searches for an animation source where possible (i.e. HTML tag attribute)
                              // and, if finds it, tries to load it on player creation; if source wasn't found,
                              // waits for user to call `.load` manually as for 'onrequest'
C.LM_ONREQUEST = 'onrequest'; // waits for user to manually call `.load` method; if animation source was
                              // passed i.e. through HTML tag attribute, waits for user to call `.load`
                              // method without parameters and uses this URL as a source
C.LM_ONPLAY = 'onplay'; // when play button was pressed or `.play` method was called, starts loading a scene and plays it just after
C.LM_ONIDLE = 'onidle'; // waits for pause in user actions (mouse move, clicks, keyboard) to load the animation; planned to use
                        // requestIdleCallback in future

C.LM_DEFAULT = C.LM_RIGHTAWAY;

C.LOADING_MODES = [ C.LM_RIGHTAWAY, C.LM_ONREQUEST, C.LM_ONPLAY, C.LM_ONIDLE ];

// ### Playing modes
/* ---------------- */

// playing modes are overriden if `autoPlay` == `true`

C.PM_ONREQUEST = 'onrequest'; // waits for user to manually call `play` method or press play button
C.PM_ONHOVER = 'onhover'; // starts playing animation when user hovered with mouse over the player canvas
C.PM_WHENINVIEW = 'wheninview'; // starts loading animation when at least some part of canvas appears in
                                // user's browser viewport

C.PM_DEFAULT = C.PM_ONREQUEST;

C.PLAYING_MODES = [ C.PM_ONREQUEST, C.PM_ONHOVER, C.PM_WHENINVIEW ];

// Element
// -----------------------------------------------------------------------------

// type
C.ET_EMPTY = 'empty';
C.ET_PATH = 'path';
C.ET_TEXT = 'text';
C.ET_SHEET = 'image';
C.ET_AUDIO = 'audio';
C.ET_VIDEO = 'video';

// repeat mode
C.R_ONCE = 'once';
C.R_STAY = 'stay';
C.R_LOOP = 'loop';
C.R_BOUNCE = 'bounce';

// composite operation
C.C_SRC_OVER = 1; // first (default) is 1, to pass if test
C.C_SRC_ATOP = 2;
C.C_SRC_IN = 3;
C.C_SRC_OUT = 4;
C.C_DST_OVER = 5;
C.C_DST_ATOP = 6;
C.C_DST_IN = 7;
C.C_DST_OUT = 8;
C.C_LIGHTER = 9;
C.C_DARKER = 10;
C.C_COPY = 11;
C.C_XOR = 12;

C.AC_NAMES = [];
C.AC_NAMES[C.C_SRC_OVER] = 'source-over';
C.AC_NAMES[C.C_SRC_ATOP] = 'source-atop';
C.AC_NAMES[C.C_SRC_IN]   = 'source-in';
C.AC_NAMES[C.C_SRC_OUT]  = 'source-out';
C.AC_NAMES[C.C_DST_OVER] = 'destination-over';
C.AC_NAMES[C.C_DST_ATOP] = 'destination-atop';
C.AC_NAMES[C.C_DST_IN]   = 'destination-in';
C.AC_NAMES[C.C_DST_OUT]  = 'destination-out';
C.AC_NAMES[C.C_LIGHTER]  = 'lighter';
C.AC_NAMES[C.C_DARKER]   = 'darker';
C.AC_NAMES[C.C_COPY]     = 'copy';
C.AC_NAMES[C.C_XOR]      = 'xor';

C.BT_NONE = 'none';
C.BT_FILL = 'fill';
C.BT_STROKE = 'stroke';
C.BT_SHADOW = 'shadow';

// align
C.TA_LEFT = 'left';
C.TA_CENTER = 'center';
C.TA_RIGHT = 'right';

// baseline
C.BL_TOP = 'top';
C.BL_MIDDLE = 'middle';
C.BL_BOTTOM = 'bottom';
C.BL_ALPHABETIC = 'alphabetic';
C.BL_HANGING = 'hanging';
C.BL_IDEOGRAPHIC = 'ideographic';

C.PC_ROUND = 'round';
C.PC_BUTT = 'butt';
C.PC_MITER = 'miter';
C.PC_SQUARE = 'square';
C.PC_BEVEL = 'bevel';

// Easings constants

C.E_PATH = 'path'; // Path
C.E_FUNC = 'function'; // Function
C.E_CSEG = 'segment'; // Segment
C.E_STDF = 'standard'; // Standard function from editor

// Tween constants

C.T_TRANSLATE   = 'translate';
C.T_SCALE       = 'scale';
C.T_ROTATE      = 'rotate';
C.T_ROT_TO_PATH = 'rotatetopath';
C.T_ALPHA       = 'alpha';
C.T_SHEAR       = 'shear';
C.T_FILL        = 'fill';
C.T_STROKE      = 'stroke';
C.T_SHADOW      = 'shadow';
C.T_VOLUME      = 'volume';
C.T_DISPLAY     = 'display';
C.T_SWITCH      = 'switch';
C.T_BONE_ROTATE = 'bonerotate';
C.T_BONE_LENGTH = 'bonelength';

// modifiers classes
C.MOD_SYSTEM = 'system';
C.MOD_TWEEN = 'tween';
C.MOD_USER = 'user';
C.MOD_EVENT = 'event';

// painters classes
C.PNT_SYSTEM = 'system';
C.PNT_USER = 'user';
C.PNT_DEBUG = 'debug';

// value for Switch tween where it means it's off
C.SWITCH_OFF = '[None]';

module.exports = C;
