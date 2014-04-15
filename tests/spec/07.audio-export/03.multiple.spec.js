/*
 * Copyright (c) 2011-2014 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("Export of multiple audio elements", function() {

  var player, importer, canvasMock;

  beforeEach(function() {
    canvasMock = _mocks.factory.canvas();
    _mocks.adaptDocument(document);

    spyOn(anm.Element.prototype, '_audioLoad').andCallFake(function() {
    });

    _fake(_Fake.CVS_POS);

    player = createPlayer('test-id-export-audio');
    importer = new AnimatronImporter();
  });

  it("from the root scene", function() {
    var json = '{"meta":{"id":"fa676952b52ebdc8c8169133","created":1382639610412,"modified":1382639661372,"author":"Alexey Pegov","description":"","name":"New Project","copyright":"Copyright (c) by Alexey Pegov","duration":41.5,"numberOfScenes":1,"projectAccessType":"Public","projectAccessReadOnly":true},"anim":{"dimension":[550.0,450.0],"framerate":24.0,"background":"#ffffff","elements":[[14,"http://s3.amazonaws.com/animatron-snapshots-dev/d68869527a89205eb51a432e",0.0],[2,"Scene1",41.5,[[0,"broken.mp3",[1.0,10.0],"","","",0,[],{}],[3,"small.mp3",[10.0,20.0],"","","",0,[],{}]]],[2,"$$$LIBRARY$$$",10.0,[]],[14,"http://animatron-snapshots-dev.s3.amazonaws.com/e9c46a5201855221a5b3dd68",7.5]],"scenes":[1]}}';

    player.load(JSON.parse(json), new AnimatronImporter());
    expect(player.exportAudio()).toBe('[{"url":"http://animatron-snapshots-dev.s3.amazonaws.com/e9c46a5201855221a5b3dd68","band_offset":7.5,"start":10,"end":20},{"url":"http://s3.amazonaws.com/animatron-snapshots-dev/d68869527a89205eb51a432e","band_offset":0,"start":1,"end":10}]');
  });
});
