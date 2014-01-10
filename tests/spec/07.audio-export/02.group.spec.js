/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("Export of single group", function() {

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

  it("starting at the beginning", function() {
    var json = '{"meta":{"id":"cc8869526e124f2ef88dc50d","created":1382648012561,"modified":1382648015382,"author":"Alexey Pegov","description":"","name":"New Project","copyright":"Copyright (c) by Alexey Pegov","duration":23.0,"numberOfScenes":1,"projectAccessType":"Public","projectAccessReadOnly":true},"anim":{"dimension":[550.0,450.0],"framerate":24.0,"background":"#ffffff","elements":[[14,"http://animatron-snapshots-dev.s3.amazonaws.com/d68869527a89205eb51a432e",0.0],[1,"",[[5,"Group 1","","","","",0,[[4,[],"","M56.0 50.5 L56.0 50.5 Z"]],{}],[0,"broken.mp3",[0.0,22.0],"","","",0,[[4,[0.0,22.0],"","M-145.0 -121.5 L-145.0 -121.5 Z"]],{}]]],[2,"$$$LIBRARY$$$",10.0,[]],[2,"Scene1",23.0,[[1,"Group 2","","","","",0,[[4,[],"","M145.0 121.5 L145.0 121.5 Z"]],{}]]],[5,"#2291ea","","","M0.0 0.0 L178.0 0.0 L178.0 142.0 L0.0 142.0 L0.0 0.0 M0.0 0.0 Z"],[1,"",[[4,"Shape 1","","",[89.0,71.0],"",0,[[4,[],"","M0.0 0.0 L0.0 0.0 Z"]],{}]]]],"scenes":[3]}}';

    player.load(JSON.parse(json), new AnimatronImporter());
    expect(player.exportAudio()).toBe('[{"url":"http://animatron-snapshots-dev.s3.amazonaws.com/d68869527a89205eb51a432e","band_offset":0,"start":0,"end":22}]');
  });

  it("starting NOT at the beginning of both group and layer", function() {
    var json = '{"meta":{"id":"cc8869526e124f2ef88dc50d","created":1382648012561,"modified":1382648015382,"author":"Alexey Pegov","description":"","name":"New Project","copyright":"Copyright (c) by Alexey Pegov","duration":23.0,"numberOfScenes":1,"projectAccessType":"Public","projectAccessReadOnly":true},"anim":{"dimension":[550.0,450.0],"framerate":24.0,"background":"#ffffff","elements":[[14,"http://animatron-snapshots-dev.s3.amazonaws.com/d68869527a89205eb51a432e",0.0],[1,"",[[5,"Group 1","","","","",0,[[4,[],"","M56.0 50.5 L56.0 50.5 Z"]],{}],[0,"broken.mp3",[1.0,23.0],"","","",0,[[4,[0.0,22.0],"","M-145.0 -121.5 L-145.0 -121.5 Z"]],{}]]],[2,"$$$LIBRARY$$$",10.0,[]],[2,"Scene1",23.0,[[1,"Group 2",[1.0],"","","",0,[[4,[],"","M145.0 121.5 L145.0 121.5 Z"]],{}]]],[5,"#2291ea","","","M0.0 0.0 L178.0 0.0 L178.0 142.0 L0.0 142.0 L0.0 0.0 M0.0 0.0 Z"],[1,"",[[4,"Shape 1","","",[89.0,71.0],"",0,[[4,[],"","M0.0 0.0 L0.0 0.0 Z"]],{}]]]],"scenes":[3]}}';

    player.load(JSON.parse(json), new AnimatronImporter());
    expect(player.exportAudio()).toBe('[{"url":"http://animatron-snapshots-dev.s3.amazonaws.com/d68869527a89205eb51a432e","band_offset":0,"start":2,"end":24}]');
  });

  it("starting NOT at the beginning of both group and layer and negative offset", function() {
    var json = '{"meta":{"id":"cc8869526e124f2ef88dc50d","created":1382648012561,"modified":1382648015382,"author":"Alexey Pegov","description":"","name":"New Project","copyright":"Copyright (c) by Alexey Pegov","duration":5.1,"numberOfScenes":1,"projectAccessType":"Public","projectAccessReadOnly":true},"anim":{"dimension":[550.0,450.0],"framerate":24.0,"background":"#ffffff","elements":[[14,"http://animatron-snapshots-dev.s3.amazonaws.com/d68869527a89205eb51a432e",1.0],[1,"",[[5,"Group 1","","","","",0,[[4,[],"","M56.0 50.5 L56.0 50.5 Z"]],{}],[0,"broken.mp3",[2.0,23.1],"","","",0,[[4,[0.0,21.1],"","M-145.0 -121.5 L-145.0 -121.5 Z"]],{}]]],[2,"$$$LIBRARY$$$",10.0,[]],[2,"Scene1",5.1,[[1,"Group 2",[1.0],"","","",0,[[4,[],"","M145.0 121.5 L145.0 121.5 Z"]],{}]]],[5,"#2291ea","","","M0.0 0.0 L178.0 0.0 L178.0 142.0 L0.0 142.0 L0.0 0.0 M0.0 0.0 Z"],[1,"",[[4,"Shape 1","","",[89.0,71.0],"",0,[[4,[],"","M0.0 0.0 L0.0 0.0 Z"]],{}]]]],"scenes":[3]}}';

    player.load(JSON.parse(json), new AnimatronImporter());
    expect(player.exportAudio()).toBe('[{"url":"http://animatron-snapshots-dev.s3.amazonaws.com/d68869527a89205eb51a432e","band_offset":1,"start":3,"end":24.1}]');
  });
});