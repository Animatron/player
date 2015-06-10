
var nop = function(){}, empty = {},
    resMan = {
        loadOrGet: nop
    };

var proxyquire = require('proxyquire').noCallThru();
var stubs = {
    '../conf.js': empty,
    '../log.js': {error: nop},
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
    '../resource_manager.js': resMan
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
    it('should call loadOrGet when loading', function() {
        resMan.loadOrGet = function(id, url, cb, complete, error) {
            complete({});
        };

        spyOn(resMan, 'loadOrGet');

        var audio = new Audio('');
        audio.load({}, {});

        expect(resMan.loadOrGet).toHaveBeenCalled();
    });
    it('should set ready flag when loaded', function() {
        resMan.loadOrGet = function(id, url, cb, complete, error) {
            complete({});
        };

        var audio = new Audio('');
        audio.load({}, {});

        expect(audio.ready).toBeTruthy();
    });
    it('should throw an exception if loading failed', function() {
        resMan.loadOrGet = function(id, url, cb, complete, error) {
            error({});
        };

        var audio = new Audio('');
        var load = function() {
            audio.load({}, {});
        };

        expect(load).toThrow();
    });
});
