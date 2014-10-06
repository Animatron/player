// Strings

var Strings = {};

Strings.COPYRIGHT = 'Animatron Player';
Strings.LOADING = 'Loading...';
Strings.LOADING_ANIMATION = 'Loading {0}...';

// Error Strings

var Errors = {};

Errors.S = {}; // System Errors
Errors.P = {}; // Player Errors
Errors.A = {}; // Animation Errors

// FIXME: move to player those ones who belong only to itself
//        NB: engine also has error strings
Errors.S.NO_JSON_PARSER = 'JSON parser is not accessible';
Errors.S.ERROR_HANDLING_FAILED = 'Error-handling mechanics were broken with error {0}';
Errors.S.NO_METHOD_FOR_PLAYER = 'No method \'{0}\' exist for player';
Errors.P.NO_IMPORTER_TO_LOAD_WITH = 'Cannot load this project without importer. Please define it';
Errors.P.NO_WRAPPER_WITH_ID = 'No element found with given id: {0}';
Errors.P.NO_WRAPPER_WAS_PASSED = 'No element was passed to player initializer';
Errors.P.CANVAS_NOT_VERIFIED = 'Canvas is not verified by the provider';
Errors.P.CANVAS_NOT_PREPARED = 'Canvas is not prepared, don\'t forget to call \'init\' method';
Errors.P.ALREADY_PLAYING = 'Player is already in playing mode, please call ' +
                           '\'stop\' or \'pause\' before playing again';
Errors.P.PAUSING_WHEN_STOPPED = 'Player is stopped, so it is not allowed to pause';
Errors.P.NO_ANIMATION_PASSED = 'No animation passed to load method';
Errors.P.NO_STATE = 'There\'s no player state defined, nowhere to draw, ' +
                    'please load something in player before ' +
                    'calling its playing-related methods';
Errors.P.NO_ANIMATION = 'There\'s nothing at all to manage with, ' +
                    'please load something in player before ' +
                    'calling its playing-related methods';
Errors.P.COULD_NOT_LOAD_WHILE_PLAYING = 'Could not load any animation while playing or paused, ' +
                    'please stop player before loading';
Errors.P.LOAD_WAS_ALREADY_POSTPONED = 'Load was called while loading process was already in progress';
Errors.P.NO_LOAD_CALL_BEFORE_PLAY = 'No animation was loaded into player before the request to play';
Errors.P.BEFOREFRAME_BEFORE_PLAY = 'Please assign beforeFrame callback before calling play()';
Errors.P.AFTERFRAME_BEFORE_PLAY = 'Please assign afterFrame callback before calling play()';
Errors.P.BEFORERENDER_BEFORE_PLAY = 'Please assign beforeRender callback before calling play()';
Errors.P.AFTERRENDER_BEFORE_PLAY = 'Please assign afterRender callback before calling play()';
Errors.P.PASSED_TIME_VALUE_IS_NO_TIME = 'Given time is not allowed, it is treated as no-time';
Errors.P.PASSED_TIME_NOT_IN_RANGE = 'Passed time ({0}) is not in animation range';
Errors.P.DURATION_IS_NOT_KNOWN = 'Duration is not known';
Errors.P.ALREADY_ATTACHED = 'Player is already attached to this canvas, please use another one';
Errors.P.INIT_TWICE = 'Initialization was called twice';
Errors.P.INIT_AFTER_LOAD = 'Initialization was called after loading a animation';
Errors.P.SNAPSHOT_LOADING_FAILED = 'Snapshot failed to load ({0})';
Errors.P.IMPORTER_CONSTRUCTOR_PASSED = 'You\'ve passed importer constructor to snapshot loader, but not an instance! ' +
                                       'Probably you used anm.I.get instead of anm.I.create.';
Errors.A.ELEMENT_IS_REGISTERED = 'This element is already registered in animation';
Errors.A.ELEMENT_IS_NOT_REGISTERED = 'There is no such element registered in animation';
Errors.A.UNSAFE_TO_REMOVE = 'Unsafe to remove, please use iterator-based looping (with returning false from iterating function) to remove safely';
Errors.A.NO_ELEMENT_TO_REMOVE = 'Please pass some element or use detach() method';
Errors.A.NO_ELEMENT = 'No such element found';
Errors.A.ELEMENT_NOT_ATTACHED = 'Element is not attached to something at all';
Errors.A.MODIFIER_NOT_ATTACHED = 'Modifier wasn\'t applied to anything';
Errors.A.NO_MODIFIER_PASSED = 'No modifier was passed';
Errors.A.NO_PAINTER_PASSED = 'No painter was passed';
Errors.A.MODIFIER_REGISTERED = 'Modifier was already added to this element';
Errors.A.PAINTER_REGISTERED = 'Painter was already added to this element';
Errors.A.RESOURCES_FAILED_TO_LOAD = 'Some of resources required to play this animation were failed to load';
Errors.A.MASK_SHOULD_BE_ATTACHED_TO_ANIMATION = 'Element to be masked should be attached to animation when rendering';

module.exports = {
  Strings: Strings,
  Errors: Errors
};
