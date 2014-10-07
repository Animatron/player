// Constants
// -----------------------------------------------------------------------------
var C = {};

// Logging
// -----------------------------------------------------------------------------

C.L_DEBUG = 1;
C.L_INFO = 2;
C.L_WARN = 4;
C.L_ERROR = 8;

// Markers
// -----------------------------------------------------------------------------
C.MARKERS = {};
C.MARKERS.MODIFIER_MARKER = '__modifier';
C.MARKERS.PAINTER_MARKER  = '__painter';

// ### Player states
/* ----------------- */

C.NOTHING = -1;
C.STOPPED = 0;
C.PLAYING = 1;
C.PAUSED = 2;
C.LOADING = 3;
C.RES_LOADING = 4;
C.ERROR = 5;

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

C.LM_ONREQUEST = 'onrequest';
C.LM_ONPLAY = 'onplay';
// C.LM_ONSCROLL
// C.LM_ONSCROLLIN

C.LM_DEFAULT = C.LM_ONREQUEST;


// Element
// -----------------------------------------------------------------------------

// type
C.ET_EMPTY = 'empty';
C.ET_PATH = 'path';
C.ET_TEXT = 'text';
C.ET_SHEET = 'image';

// repeat mode
C.R_ONCE = 0;
C.R_STAY = 1;
C.R_LOOP = 2;
C.R_BOUNCE = 3;

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

// path constants
C.P_MOVETO = 0;
C.P_LINETO = 1;
C.P_CURVETO = 2;

C.PC_ROUND = 'round';
C.PC_BUTT = 'butt';
C.PC_MITER = 'miter';
C.PC_SQUARE = 'square';
C.PC_BEVEL = 'bevel';

module.exports = C;
