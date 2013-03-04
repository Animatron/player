#!/bin/sh

# Usage:
#    run all specs: > ./run-with-phantomjs.sh
#    run all specs: > ./run-with-phantomjs.sh *
#    run testutils specs: > ./run-with-phantomjs.sh 00.testutils
#    run all player's specs: > ./run-with-phantomjs.sh 01.player/*
#    run specific spec group: > ./run-with-phantomjs.sh 03.anm-import/04.masks

# Files:
# * spec/spec-list.js
# * require-files.js
# should be both complete for this script to work (or it will fail with scripterror from RequireJS)

phantomjs ./run-jasmine.phantom.js ./run-for-terminal.html $1