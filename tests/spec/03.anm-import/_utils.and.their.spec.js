/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

function _elm_id() {
    return Math.random().toString().substring(2,13) +
           Math.random().toString().substring(2,13) + '03';
}

function _clp_id() {
    return Math.random().toString().substring(2,13) +
           Math.random().toString().substring(2,13) + '01';
}

function _scn_id() {
    return Math.random().toString().substring(2,13) +
           Math.random().toString().substring(2,13) + '02';
}

function createAnmProject(duration) {
    return {
        "meta": {
            //"id": guid()
            //"duration": duration || 10.0
        },
        "anim": {
            // "dimension": [ 100, 200 ]
            //"framerate": 24.0,
            //"background": {
              //"color": "white"
            //},
            "elements": [],
            "scenes": []
        }
    }
}

// data format:

// [ { name: ...[, stroke: ...][, path: ...] },
//   { layers: [ { name: ..., stroke: ..., path: ... },
//               { layers: [ ... ], ... },
//               ... ]
//             ],
//     name: ...,
//     [masked: ...]
//   },
//   ... ]

function injectAnmScene(project, data) {
    var scene = injectEmptyAnmScene(project);
    function __inspectDataLayer(parent, layer) {
        for (var li = 0, ll = layer.length; li < ll; li++) {
            var srcData = layer[li];
            var anmElement, innerAnmElement;
            if (srcData.layers) {
                var clp_id = _clp_id();
                innerAnmElement = { "id": clp_id, "name": srcData.name, "layers": [] };
                anmElement = { "id": _elm_id(), "eid": clp_id, "name": srcData.name + ">" };
                for (var prop in srcData) {
                    if (prop != 'layers') {
                        if (prop.indexOf('#') === 0) anmElement[prop.substring(1)] = srcData[prop];
                        else innerAnmElement[prop] = srcData[prop];
                    }
                }
                __inspectDataLayer(innerAnmElement, srcData.layers);
            } else {
                var trg_id = _elm_id(),
                    clp_id = _clp_id();
                var targetAnmElement = { "id": trg_id };
                innerAnmElement = { "id": clp_id, "name": srcData.name,
                                    "layers": [ { "id": _elm_id(), "eid": trg_id } ] };
                anmElement = { "id": _elm_id(), "eid": clp_id, "name": srcData.name + ">" };
                for (var prop in srcData) {
                    if (prop.indexOf('#') === 0) anmElement[prop.substring(1)] = srcData[prop];
                    else innerAnmElement[prop] = srcData[prop];
                }
                project.anim.elements.push(targetAnmElement);

            }
            project.anim.elements.push(innerAnmElement);
            project.anim.elements.push(anmElement);
            parent.layers.push(anmElement);
        }
    }
    __inspectDataLayer(scene, data);
}

function injectEmptyAnmScene(project) {
    var scene_id = _scn_id();
    project.anim.scenes.push(scene_id);
    var scene = { "id": scene_id, name: "Scene", "layers": [] };
    project.anim.elements.push(scene);
    return scene;
}

// make a legal method of scene?
anm.Scene.prototype.findByName = function(name) {
    var found = [];
    this.visitElems(function(elm) {
        if (elm.name == name) found.push(elm);
    });
    if (found.length == 0) throw new Error(name + ' was not found');
    return found[0];
}

// TODO:

describe("utils", function() {

    function findInProject(project, elmId) {
        var elements = project.anim.elements;
        for (var i = 0, il = elements.length; i < il; i++) {
            if (elements[i].id == elmId) return elements[i];
        }
    }

    xit("should set proper duration for created stub project", function() {
        var project0 = createAnmProject();
        expect(project0.meta.duration).toBe(10);

        var project1 = createAnmProject(12);
        expect(project1.meta.duration).toBe(10);
    });

    it("should build proper structure of elements", function() {
        var project = createAnmProject(12);
        injectAnmScene(project, [
              { name: "inner1", customAttr: "foo" },
              { name: "inner2", customAttr: "bar", layers: [
                { name: "deeper1" },
                { name: "deeper2",
                  customAttr: 42,
                  '#foo': 'nyan',
                  layers: [ { name: "moreDeep1" },
                            { name: "moreDeep2", customAttr: "customAttr", } ] },
                { name: "deeper3", customAttr: ":)" }
              ] } ]);

        expect(project.anim.scenes.length).toBe(1);

        var scene = findInProject(project, project.anim.scenes[0]);
        expect(scene).toBeDefined();
        expect(scene.layers.length).toBe(2);

        var inner1 = scene.layers[0];
        expect(inner1).toBeDefined();
        expect(inner1.name).toBe("inner1>");
        expect(inner1.eid).toBeDefined();
        expect(inner1.layers).not.toBeDefined();
        var inner1Elm = findInProject(project, inner1.eid);
        expect(inner1Elm).toBeDefined();
        expect(inner1Elm.name).toBe("inner1");
        expect(inner1Elm.customAttr).toBe("foo");

        var inner2 = scene.layers[1];
        expect(inner2.name).toBe("inner2>");
        expect(inner2).toBeDefined();
        expect(inner2.eid).toBeDefined();
        expect(inner2.layers).not.toBeDefined();
        var inner2Elm = findInProject(project, inner2.eid);
        expect(inner2Elm.name).toBe("inner2");
        expect(inner2Elm).toBeDefined();
        expect(inner2Elm.customAttr).toBe("bar");
        expect(inner2Elm.eid).not.toBeDefined();
        expect(inner2Elm.layers).toBeDefined();
        expect(inner2Elm.layers.length).toBe(3);

        var deeper1 = inner2Elm.layers[0];
        expect(deeper1).toBeDefined();
        expect(deeper1.name).toBe("deeper1>");
        expect(deeper1.customAttr).not.toBeDefined();
        expect(deeper1.eid).toBeDefined();
        expect(deeper1.layers).not.toBeDefined();
        var deeper1Elm = findInProject(project, deeper1.eid);
        expect(deeper1Elm).toBeDefined();
        expect(deeper1Elm.name).toBe("deeper1");
        expect(deeper1Elm.customAttr).not.toBeDefined();

        var deeper2 = inner2Elm.layers[1];
        expect(deeper2.name).toBe("deeper2>");
        expect(deeper2).toBeDefined();
        expect(deeper2.eid).toBeDefined();
        expect(deeper2.layers).not.toBeDefined();
        expect(deeper2.foo).toBe('nyan');
        var deeper2Elm = findInProject(project, deeper2.eid);
        expect(deeper2Elm.name).toBe("deeper2");
        expect(deeper2Elm).toBeDefined();
        expect(deeper2Elm.customAttr).toBe(42);
        expect(deeper2Elm.eid).not.toBeDefined();
        expect(deeper2Elm.layers).toBeDefined();
        expect(deeper2Elm.layers.length).toBe(2);

        var deeper3 = inner2Elm.layers[2];
        expect(deeper3).toBeDefined();
        expect(deeper3.name).toBe("deeper3>");
        expect(deeper3.customAttr).not.toBeDefined();
        expect(deeper3.eid).toBeDefined();
        expect(deeper3.layers).not.toBeDefined();
        var deeper3Elm = findInProject(project, deeper3.eid);
        expect(deeper3Elm).toBeDefined();
        expect(deeper3Elm.name).toBe("deeper3");
        expect(deeper3Elm.customAttr).toBe(":)");

        var moreDeep1 = deeper2Elm.layers[0];
        expect(moreDeep1).toBeDefined();
        expect(moreDeep1.name).toBe("moreDeep1>");
        expect(moreDeep1.customAttr).not.toBeDefined();
        expect(moreDeep1.eid).toBeDefined();
        expect(moreDeep1.layers).not.toBeDefined();
        var moreDeep1Elm = findInProject(project, moreDeep1.eid);
        expect(moreDeep1Elm).toBeDefined();
        expect(moreDeep1Elm.name).toBe("moreDeep1");
        expect(moreDeep1Elm.customAttr).not.toBeDefined();

        var moreDeep2 = deeper2Elm.layers[1];
        expect(moreDeep2).toBeDefined();
        expect(moreDeep2.name).toBe("moreDeep2>");
        expect(moreDeep2.customAttr).not.toBeDefined();
        expect(moreDeep2.eid).toBeDefined();
        expect(moreDeep2.layers).not.toBeDefined();
        var moreDeep2Elm = findInProject(project, moreDeep2.eid);
        expect(moreDeep2Elm).toBeDefined();
        expect(moreDeep2Elm.name).toBe("moreDeep2");
        expect(moreDeep2Elm.customAttr).toBe("customAttr");

    });

    xit("should find elements by name", function() {
        // TODO:
    });

});