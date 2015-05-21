
var nop = function(){}, empty = {};

var proxyquire = require('proxyquire').noCallThru();
var stubs = {
    '../conf.js': empty,
    '../log.js': empty,
    '../utils.js': empty,
    '../constants.js': empty,
    'engine': {
        isLocal: false,
        isHttps: false,
        createAudio: function() {
            return {};
        },
        unsubscribeElementEvents: nop,
        subscribeElementEvents: nop,
        createSource: function() {
            return {};
        },
        appendToBody: nop
    },
    '../resource_manager.js': empty
};

var Audio = proxyquire('../../src/anm/media/audio.js', stubs);

describe('Audio', function(){
    it('can be muted', function() {
        var audio = new Audio('');
        audio.mute();
        expect(audio.muted).toBeTruthy();
    });
    it('can be unmuted', function() {
        var audio = new Audio('');
        audio.unmute();
        expect(audio.muted).toBeFalsy();
    });
    it('can have the mute toggled', function() {
        var audio = new Audio('');
        audio.toggleMute();
        expect(audio.muted).toBeTruthy();
        audio.toggleMute();
        expect(audio.muted).toBeFalsy();
    });
});
