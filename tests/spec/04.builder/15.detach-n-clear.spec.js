/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

// (elm.parent (?) and elm.scene should both be null after unbinding and not visit the element while rendering)

describe("builder, regading clearing elements or detaching them, ", function() {

    var b = Builder._$,
        B = Builder;

    var C = anm.C;

    it("should clear all child elements", function() {

        var root = b();
        var target = b();

        var count = 10;

        root.add(b().add(target));

        var children = [];
        var subChildren = [];

        for (var i = 0; i < count; i++) {
            var child = b();
            var subChild = b();
            child.add(subChild);
            target.add(child);
            children.push(child);
            subChildren.push(subChild);

            //expect(child.v.parent).toBe(target.v);
            //expect(subChild.v.parent).toBe(child.v);
            expect(child.v.parent == target.v).toBeTruthy();
            expect(subChild.v.parent == child.v).toBeTruthy();

            expect(child.v.scene).toBe(null);
            expect(subChild.v.scene).toBe(null);
        }

        expect(root.v.children.length).toBe(1);
        expect(target.v.children.length).toBe(count);

        //player.load(root);

        for (var i = 0; i < count; i++) {
            var child = children[i];
            var subChild = subChildren[i];
            //expect(subChild.v.scene).toBe(root.v.scene);
            //expect(child.v.scene).toBe(root.v.scene);
            expect(subChild.v.scene == root.v.scene).toBeTruthy();
            expect(child.v.scene == root.v.scene).toBeTruthy();
        }

        target.clear();

        expect(target.v.children.length).toBe(0);

        for (var i = 0; i < count; i++) {
            var child = children[i];
            expect(child.v.parent).toBe(null);
            expect(child.v.scene).toBe(null);
            expect(child.v.children.length).toBe(1);
        }

        for (var i = 0; i < count; i++) {
            var subChild = subChildren[i];
            //expect(subChild.v.parent).toBe(children[i].v);
            expect(subChild.v.parent == children[i].v).toBeTruthy();
            expect(subChild.v.scene).toBe(null);
        }

        //  TODO: ensure scene also have no records

    });

    xit("should clear all child elements even if they are actively used", function() {

    });

    it("should not call modifiers of cleared element children", function() {
        _mocks.adaptDocument(document);
        _fake(_Fake.CVS_POS);
        var _fg = _FrameGen.spawn().run(20);

        var player = createPlayer('foo');

        var root = b().band([0, 1]);
        var target = b();

        var count = 10;

        root.add(b().add(target));

        var rootModifierSpy = jasmine.createSpy('root-modifier-spy');

        var modifierSpies = [];

        for (var i = 0; i < count; i++) {
            var child = b();
            var modifierSpy = jasmine.createSpy('modifier-spy-'+i);
            target.add(child);
            child.modify(modifierSpy);
            modifierSpies.push(modifierSpy);
        }

        doAsync(player, {
            prepare: function() { target.clear(); return root; },
            do: 'play', until: C.STOPPED,
            then: function() {
                for (var i = 0; i < count; i++) {
                    expect(modifierSpies[i]).not.toHaveBeenCalled();
                }
                _fg.stop().destroy();
            }
        });

    });

    xit("should not call modifiers of cleared element children, even if it was cleared during playback", function() {
    });

    it("should correctly detach element from parent and scene", function() {
        _mocks.adaptDocument(document);
        _fake(_Fake.CVS_POS);

        var player = createPlayer('foo');

        var root = b();
        var target = b();

        var count = 10;

        root.add(b().add(target));

        var children = [];
        var subChildren = [];

        for (var i = 0; i < count; i++) {
            var child = b();
            var subChild = b();
            child.add(subChild);
            target.add(child);
            children.push(child);
            subChildren.push(subChild);

            //expect(child.v.parent).toBe(target.v);
            //expect(subChild.v.parent).toBe(child.v);
            expect(child.v.parent == target.v).toBeTruthy();
            expect(subChild.v.parent == child.v).toBeTruthy();

            expect(child.v.scene).toBe(null);
            expect(subChild.v.scene).toBe(null);
        }

        expect(root.v.children.length).toBe(1);
        expect(target.v.children.length).toBe(count);

        player.load(root);

        expect(root.v.scene).not.toBe(null);

        for (var i = 0; i < count; i++) {
            var child = children[i];
            var subChild = subChildren[i];
            expect(subChild.v.scene).toBe(root.v.scene);
            expect(child.v.scene).toBe(root.v.scene);
        }

        for (var i = 0; i < count; i++) {
            children[i].detach();
        }

        expect(target.v.children.length).toBe(0);

        for (var i = 0; i < count; i++) {
            var child = children[i];
            expect(child.v.parent).toBe(null);
            expect(child.v.scene).toBe(null);
            expect(child.v.children.length).toBe(1);
        }

        for (var i = 0; i < count; i++) {
            var subChild = subChildren[i];
            //expect(subChild.v.parent).toBe(children[i].v);
            expect(subChild.v.parent == children[i].v).toBeTruthy();
            expect(subChild.v.scene).toBe(null);
        }

        for (var i = 0; i < count; i++) {
            subChildren[i].detach();
        }

        for (var i = 0; i < count; i++) {
            var child = children[i];
            var subChild = subChildren[i];
            expect(child.v.children.length).toBe(0);
            expect(subChild.v.parent).toBe(null);
            expect(subChild.v.scene).toBe(null);
        }

        var scene = root.v.scene;
        expect(root.v.scene).not.toBe(null);
        for (var i = 0; i < count; i++) {
            var childId = children[i].id;
            var subChildId = subChildren[i].id;
            expect(scene.hash[childId]).not.toBeDefined();
            expect(scene.hash[subChildId]).not.toBeDefined();
            travel(function(elm) {
                expect(elm.id).not.toEqual(childId);
                expect(elm.id).not.toEqual(subChildId);
            }, scene.tree);
        }

    });

    xit("should detach elements even if they are actively used", function() {

    });

    it("should not call modifiers of detached elements", function() {
        _mocks.adaptDocument(document);
        _fake(_Fake.CVS_POS);
        var _fg = _FrameGen.spawn().run(20);
        var player = createPlayer('foo');

        var root = b().band([0, 1]);
        var target = b();

        var count = 10;

        root.add(b().add(target));

        var rootModifierSpy = jasmine.createSpy('root-modifier-spy');

        var modifierSpies = [];
        var children = [];

        for (var i = 0; i < count; i++) {
            var child = b();
            var modifierSpy = jasmine.createSpy('modifier-spy-'+i);
            target.add(child);
            children.push(child);
            child.modify(modifierSpy);
            modifierSpies.push(modifierSpy);
        }

        doAsync(player, {
            prepare: function() {
                for (var i = 0; i < count; i++) {
                    children[i].detach();
                }
                return root;
            },
            do: 'play', until: C.STOPPED,
            then: function() {
                for (var i = 0; i < count; i++) {
                    expect(modifierSpies[i]).not.toHaveBeenCalled();
                }
                _fg.stop().destroy();
            }
        });

    });

});