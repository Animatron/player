DEST = ./dist
DEV_TMP = ./dist/dev
VERSION_FILE = `version`
PLAYER_VERSION = `cat $(VERSION_FILE)`

VENDOR_FILES = ./vendor/matrix.js #...
PLAYER_FILE = ./anm.player.js
BUILDER_FILE = ./anm.builder.js
# specify different modules with separate files
DEV_MODULES_FILES = ./anm.collisions.js #...
# specify different imports with separate files
ANM_IMPORT_FILE = ./animatron_import.js

STANDARD_BUNDLE_FILES = VENDOR_FILES PLAYER_FILE
ANIMATRON_BUNDLE_FILES = VENDOR_FILES ANM_IMPORT_FILE PLAYER_FILE
DEVELOP_BUNDLE_FILES = VENDOR_FILES PLAYER_FILE BUILDER_FILE
HARDCORE_DEVELOP_BUNDLE_FILES = VENDOR_FILES PLAYER_FILE BUILDER_FILE DEV_MODULES_FILES

STANDARD_BUNDLE_FILENAME = standard.js
ANIMATRON_BUNDLE_FILENAME = animatron.js
DEVELOP_BUNDLE_FILENAME = develop.js
HARDCORE_DEVELOP_BUNDLE_FILENAME = hardcore.js

mkdir $DEST
mkdir $DEV_TMP

#preprocess all sources to include version

#minify all the sources, separately, modules and stuff, and for bundles

# proposed structure:
# /- version/
#  |- bundle/
#   \- ...
#  |- sep/
#   \- mods/
#   \- import/
#   \- ...
#  |- min
#   \- mods/
#   \- import/
#   \- ...

