/*
 * Copyright (c) 2011-2014 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("Export of single element", function() {

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
    var json = '{"meta":{"id":"cc8869526e124f2ef88dc50d","created":1382648012561,"modified":1382648015382,"author":"Alexey Pegov","description":"","name":"New Project","copyright":"Copyright (c) by Alexey Pegov","duration":23.0,"numberOfScenes":1,"projectAccessType":"Public","projectAccessReadOnly":true},"anim":{"dimension":[550.0,450.0],"framerate":24.0,"background":"#ffffff","elements":[[14,"http://animatron-snapshots-dev.s3.amazonaws.com/d68869527a89205eb51a432e",0.0],[2,"$$$LIBRARY$$$",10.0,[]],[2,"Scene1",23.0,[[0,"broken.mp3",[0.0,22.5],"","","",0,[],{}]]]],"scenes":[2]}}';

    player.load(JSON.parse(json), new AnimatronImporter());
    expect(player.exportAudio()).toBe('[{"url":"http://animatron-snapshots-dev.s3.amazonaws.com/d68869527a89205eb51a432e","band_offset":0,"start":0,"end":22.5}]');
  });


  it("starting NOT at the beginning", function() {
    var json = '{"meta":{"id":"cc8869526e124f2ef88dc50d","created":1382648012561,"modified":1382648015382,"author":"Alexey Pegov","description":"","name":"New Project","copyright":"Copyright (c) by Alexey Pegov","duration":23.0,"numberOfScenes":1,"projectAccessType":"Public","projectAccessReadOnly":true},"anim":{"dimension":[550.0,450.0],"framerate":24.0,"background":"#ffffff","elements":[[14,"http://animatron-snapshots-dev.s3.amazonaws.com/d68869527a89205eb51a432e",0.0],[2,"$$$LIBRARY$$$",10.0,[]],[2,"Scene1",23.0,[[0,"broken.mp3",[1.0,20.0],"","","",0,[],{}]]]],"scenes":[2]}}';

    player.load(JSON.parse(json), new AnimatronImporter());
    expect(player.exportAudio()).toBe('[{"url":"http://animatron-snapshots-dev.s3.amazonaws.com/d68869527a89205eb51a432e","band_offset":0,"start":1,"end":20}]');
  });

  it("has negative band offset and starting at the beginning", function() {
    var json = '{"meta":{"id":"cc8869526e124f2ef88dc50d","created":1382648012561,"modified":1382648015382,"author":"Alexey Pegov","description":"","name":"New Project","copyright":"Copyright (c) by Alexey Pegov","duration":23.0,"numberOfScenes":1,"projectAccessType":"Public","projectAccessReadOnly":true},"anim":{"dimension":[550.0,450.0],"framerate":24.0,"background":"#ffffff","elements":[[14,"http://animatron-snapshots-dev.s3.amazonaws.com/d68869527a89205eb51a432e",1.0],[2,"$$$LIBRARY$$$",10.0,[]],[2,"Scene1",23.0,[[0,"broken.mp3",[0.0,18.5],"","","",0,[],{}]]]],"scenes":[2]}}';

    player.load(JSON.parse(json), new AnimatronImporter());
    expect(player.exportAudio()).toBe('[{"url":"http://animatron-snapshots-dev.s3.amazonaws.com/d68869527a89205eb51a432e","band_offset":1,"start":0,"end":18.5}]');
  });

  it("has negative band offset and starting NOT at the beginning", function() {
    var json = '{"meta":{"id":"cc8869526e124f2ef88dc50d","created":1382648012561,"modified":1382648015382,"author":"Alexey Pegov","description":"","name":"New Project","copyright":"Copyright (c) by Alexey Pegov","duration":23.0,"numberOfScenes":1,"projectAccessType":"Public","projectAccessReadOnly":true},"anim":{"dimension":[550.0,450.0],"framerate":24.0,"background":"#ffffff","elements":[[14,"http://animatron-snapshots-dev.s3.amazonaws.com/d68869527a89205eb51a432e",1.0],[2,"$$$LIBRARY$$$",10.0,[]],[2,"Scene1",23.0,[[0,"broken.mp3",[1.0,19.5],"","","",0,[],{}]]]],"scenes":[2]}}';

    player.load(JSON.parse(json), new AnimatronImporter());
    expect(player.exportAudio()).toBe('[{"url":"http://animatron-snapshots-dev.s3.amazonaws.com/d68869527a89205eb51a432e","band_offset":1,"start":1,"end":19.5}]');
  });
});
