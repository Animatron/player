DEST = ./dist
DEV_TMP = ./dist/dev
VERSION_FILE = `version`
PEGJS_VERSION = `cat $(VERSION_FILE)`

PLAYER_FILE = ./anm.player.js
BUILDER_FILE = ./anm.builder.js
COLLISIONS_MODULE_FILE = ./animatron_import.js
# specify different modules with separate files
# specify different imports with separate files
ANM_IMPORT_FILE = ./

ANIMATRON_BUNDLE_FILES =
BUILDER_BUNDLE_FILES =
COLLISIONS_BILDER_FILES =
COLLISIONS_NO_BUILDER_FILES =

mkdir $DEST
mkdir $DEV_TMP

#preprocess all sources to include version

cp
