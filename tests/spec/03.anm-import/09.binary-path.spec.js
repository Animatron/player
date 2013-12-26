/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("Decodes path in binary format", function() {

    it("correctly", function() {
        var json = '{"meta":{"id":"5983bc522100062c7af67e50","created":1388086103571,"modified":1388086103571,"author":"Alexey Pegov","description":"","name":"New Project","copyright":"Copyright (c) by Alexey Pegov","duration":10.0,"numberOfScenes":1,"projectAccessType":"Public","projectAccessReadOnly":true},"anim":{"dimension":[550.0,450.0],"framerate":12.0,"background":"#ffffff","elements":[[2,"Scene1",10.0,[[1,"Shape 1","","",[161.0,116.0],"",4,[[4,[],"","M285.0 202.0 L285.0 202.0 Z"]],{}]],{}],[5,"#2291ea","","",0],[2,"$$$LIBRARY$$$",10.0,[],{}]],"paths":["KKWgptdGwp4ujbWASg35kvVmgtQYiYPR30hM"], "scenes":[0]}}';
        var result = new AnimatronImporter().load(JSON.parse(json));
        expect(result.tree[0].children[0].xdata.path.segs.toString())
            .toBe("M 339.205 224.163,L 316.56 200.464,L 318.92900000000003 183.874,L 329.98900000000003 186.76999999999998,L 339.732 223.37199999999999,L 339.732 223.37199999999999");
    });
});