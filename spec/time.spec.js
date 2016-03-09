describe('time', function() {

    describe('animation and scene sequences', function() {

        it('has one scene by default', function() {

            var anim = new anm.Animation();
            expect(anim.getCurrentScene()).toBeDefined();
            expect(anim.getScenesCount()).toBe(1);
            expect(anim.getCurrentScene().getDuration()).toBe(0);

        });

        it('allows to replace first scene', function() {

            var anim = new anm.Animation();
            anim.replaceFirstScene('Foo', 10);
            expect(anim.getCurrentScene()).toBeDefined();
            expect(anim.getScenesCount()).toBe(1);
            expect(anim.getCurrentScene().name).toBe('Foo');
            expect(anim.getCurrentScene().getDuration()).toBe(10);

        });

        it('ends when default scene was finished', function() {

            var anim = new anm.Animation();
            anim.getCurrentScene().setDuration(5);

            // anim: 0-----1-----2-----3-----4-----5-----6-
            //       [------------scene------------]

            var endSpy = jasmine.createSpy('end');
            anim.timeline.on(anm.C.X_END, endSpy);
            anim.tick(2);
            expect(endSpy).not.toHaveBeenCalled();
            anim.tick(25);
            expect(endSpy).toHaveBeenCalled();
            expect(anim.getTime()).toBe(anm.Timeline.NO_TIME);

        });

        it('ends when all scenes were finished', function() {

            var anim = new anm.Animation();
            anim.getCurrentScene().setDuration(5);
            anim.addScene('Bar', 10);

            // anim: 0-----1-----2-----3-----4-----5-----6....15]
            //       [----------default------------][----Bar----]

            var endSpy = jasmine.createSpy('end');
            anim.timeline.on(anm.C.X_END, endSpy);
            anim.tick(2);  // 2
            anim.tick(10); // 12
            expect(endSpy).not.toHaveBeenCalled();
            anim.tick(9);  // 21
            expect(endSpy).toHaveBeenCalled();
            expect(anim.getTime()).toBe(anm.Timeline.NO_TIME);

        });

        it('properly advances to a next scene', function() {

            var anim = new anm.Animation();

            anim.replaceFirstScene('Foo', 10);
            anim.addScene('Bar', 10);

            // anim: 0-----1-----2-----3-----4....10----11....20]
            //       [------------Foo--------------][----Bar----]

            anim.tick(5.0); // 5
            expect(anim.getCurrentScene().name).toBe('Foo');

            anim.tick(5.1); // 10.1
            expect(anim.getCurrentScene().name).toBe('Bar');

        });

        it('properly advances time in the scene on a scene switch', function() {
            var anim = new anm.Animation();

            var fooScene = anim.replaceFirstScene('Foo', 10);
            var barScene = anim.addScene('Bar', 10);

            // anim: 0-----1-----2-----3-----4....10----11....20]
            //       [------------Foo--------------][----Bar----]

            anim.tick(5.0); // 5.0
            expect(fooScene.getTime()).toBe(5.0);

            anim.tick(5.1); // 10.1
            expect(fooScene.getTime()).toBe(10.0);
            expect(barScene.getTime()).toBe(10.1 - 10.0);
        });

        xit('when animation repeats, properly advances time for the first scene', function() {
            var anim = new anm.Animation();

            anim.repeat = true;

            var fooScene = anim.replaceFirstScene('Foo', 10);
            var barScene = anim.addScene('Bar', 10);

            // anim: 0-----1-----2-----3-----4....10----11....20]
            //       [------------Foo--------------][----Bar----]

            anim.tick(20.1); // 20.1
            expect(barScene.getTime()).toBe(10.0);
            expect(fooScene.getTime()).toBe(0.1);
        });

        xit('takes animation duration from first scene', function() {
            var anim = new anm.Animation();

            anim.replaceFirstScene('Foo', 50);
            expect(anim.getDuration()).toBe(50);
        });

    });

    describe('time bands', function() {

        it('bands work properly for children', function() {

            var anim = new anm.Animation();
            var root = new anm.Element('root');
            var child = new anm.Element('child');
            root.add(child);
            anim.add(root);

            anim.setDuration(10);
            root.changeBand(1.0, 10);
            child.changeBand(1.0, 10);

            // anim: 0-----1-----2-----3-----4-----5-----6-
            // root:       0-----1-----2-----3-----4-----5-
            // chld:             0-----1-----2-----3-----4-

            anim.tick(0.5); // 0.5
            expect(root.isActive()).toBeFalsy();
            expect(child.isActive()).toBeFalsy();
            anim.tick(0.5); // 1.0
            expect(root.getTime()).toBe(0.0);
            expect(child.isActive()).toBeFalsy();
            anim.tick(1.0); // 2.0
            expect(root.getTime()).toBe(1.0);
            expect(child.getTime()).toBe(0.0);
            anim.tick(1.0); // 3.0
            expect(root.getTime()).toBe(2.0);
            expect(child.getTime()).toBe(1.0);

        });

        it('negative bands also work properly', function() {

            var anim = new anm.Animation();
            var root = new anm.Element('root');
            var child = new anm.Element('child');
            root.add(child);
            anim.add(root);

            anim.setDuration(10);
            root.changeBand(2.0, 10);
            child.changeBand(-1.0, 10);

            // anim: 0-----1-----2-----3-----4-----5-----6-
            // root:             0-----1-----2-----3-----4-
            // chld:       0-----1-----2-----3-----4-----5-

            anim.tick(0.5); // 0.5
            expect(root.isActive()).toBeFalsy();
            anim.tick(0.5); // 1.0
            expect(root.isActive()).toBeFalsy();
            anim.tick(1.0); // 2.0
            expect(root.getTime()).toBe(0.0);
            expect(child.getTime()).toBe(1.0);
            anim.tick(1.0); // 3.0
            expect(root.getTime()).toBe(1.0);
            expect(child.getTime()).toBe(2.0);

        });

        describe('end-actions', function() {

            describe('`once`', function() {

                it('works for root elements', function() {
                    var anim = new anm.Animation();
                    var root = new anm.Element('root');
                    anim.add(root);

                    anim.setDuration(10);
                    root.changeBand(2.0, 5.0);
                    root.once();

                    // anim: 0-----1-----2-----3-----4-----5-----6-
                    // root:             0-----1-----2-----■

                    anim.tick(0.5); // 0.5
                    expect(root.isActive()).toBeFalsy();
                    anim.tick(3.0); // 3.5
                    expect(root.getTime()).toBe(1.5);
                    anim.tick(1.0); // 4.5
                    expect(root.getTime()).toBe(2.5);
                    anim.tick(1.0); // 5.5
                    expect(root.isActive()).toBeFalsy();
                });

                it('works for elements with parent', function() {
                   var anim = new anm.Animation();
                   var root = new anm.Element('root');
                   var child = new anm.Element('child');
                   root.add(child);
                   anim.add(root);

                   anim.setDuration(10);
                   root.changeBand(2.0, Infinity);
                   child.changeBand(-1.0, 2.0);
                   child.once();

                   // anim: 0-----1-----2-----3-----4-----5-----6-
                   // root:             0-----1-----2-----3-----4-
                   // chld:       0-----1-----2-----■

                   anim.tick(0.5); // 0.5
                   expect(root.isActive()).toBeFalsy();
                   anim.tick(3.0); // 3.5
                   expect(root.getTime()).toBe(1.5);
                   expect(child.getTime()).toBe(2.5);
                   anim.tick(1.0); // 4.5
                   expect(root.getTime()).toBe(2.5);
                   expect(child.isActive()).toBeFalsy();
                   anim.tick(1.0); // 5.5
                   expect(child.isActive()).toBeFalsy();
                });

                it('works when both element and parent have same end-action', function() {
                    var anim = new anm.Animation();
                    var root = new anm.Element('root');
                    var child = new anm.Element('child');
                    root.add(child);
                    anim.add(root);

                    anim.setDuration(10);
                    root.changeBand(2.0, 5.0);
                    root.once();
                    child.changeBand(-1.0, 2.0);
                    child.once();

                    // anim: 0-----1-----2-----3-----4-----5-----6-
                    // root:             0-----1-----2-----■
                    // chld:       0-----1-----2-----■

                    anim.tick(0.5); // 0.5
                    expect(root.isActive()).toBeFalsy();
                    anim.tick(3.0); // 3.5
                    expect(root.getTime()).toBe(1.5);
                    expect(child.getTime()).toBe(2.5);
                    anim.tick(1.0); // 4.5
                    expect(root.getTime()).toBe(2.5);
                    expect(child.isActive()).toBeFalsy();
                    anim.tick(1.0); // 5.5
                    expect(root.isActive()).toBeFalsy();
                    expect(child.isActive()).toBeFalsy();
                });

                xit('works for elements with parent having affectsChildren == false', function() {

                });

            });

            describe('`stay`', function() {

                it('works for root elements', function() {
                    var anim = new anm.Animation();
                    var root = new anm.Element('root');
                    anim.add(root);

                    anim.setDuration(10);
                    root.changeBand(2.0, 5.0);
                    root.stay();

                    // anim: 0-----1-----2-----3-----4-----5-----6-
                    // root:             0-----1-----2-----∞·······

                    anim.tick(0.5); // 0.5
                    expect(root.isActive()).toBeFalsy();
                    anim.tick(3.0); // 3.5
                    expect(root.getTime()).toBe(1.5);
                    anim.tick(1.0); // 4.5
                    expect(root.getTime()).toBe(2.5);
                    anim.tick(1.0); // 5.5
                    expect(root.getTime()).toBe(3.0);
                });

                it('works for elements with parent', function() {
                   var anim = new anm.Animation();
                   var root = new anm.Element('root');
                   var child = new anm.Element('child');
                   root.add(child);
                   anim.add(root);

                   anim.setDuration(10);
                   root.changeBand(2.0, Infinity);
                   child.changeBand(-1.0, 2.0);
                   child.stay();

                   // anim: 0-----1-----2-----3-----4-----5-----6-
                   // root:             0-----1-----2-----3-----4-
                   // chld:       0-----1-----2-----∞·············

                   anim.tick(0.5); // 0.5
                   expect(root.isActive()).toBeFalsy();
                   anim.tick(3.0); // 3.5
                   expect(root.getTime()).toBe(1.5);
                   expect(child.getTime()).toBe(2.5);
                   anim.tick(1.0); // 4.5
                   expect(root.getTime()).toBe(2.5);
                   expect(child.getTime()).toBe(3.0);
                   anim.tick(1.0); // 5.5
                   expect(child.getTime()).toBe(3.0);
                });

                it('works when both element and parent have same end-action', function() {
                    var anim = new anm.Animation();
                    var root = new anm.Element('root');
                    var child = new anm.Element('child');
                    root.add(child);
                    anim.add(root);

                    anim.setDuration(10);
                    root.changeBand(2.0, 5.0);
                    root.stay();
                    child.changeBand(-1.0, 2.0);
                    child.stay();

                    // anim: 0-----1-----2-----3-----4-----5-----6-
                    // root:             0-----1-----2-----∞·······
                    // chld:       0-----1-----2-----∞·············

                    anim.tick(0.5); // 0.5
                    expect(root.isActive()).toBeFalsy();
                    anim.tick(3.0); // 3.5
                    expect(root.getTime()).toBe(1.5);
                    expect(child.getTime()).toBe(2.5);
                    anim.tick(1.0); // 4.5
                    expect(root.getTime()).toBe(2.5);
                    expect(child.getTime()).toBe(3.0);
                    anim.tick(1.0); // 5.5
                    expect(root.getTime()).toBe(3.0);
                    expect(child.getTime()).toBe(3.0);
                });

                it('works when both element and parent have same end-action and parent ends earlier', function() {
                    var anim = new anm.Animation();
                    var root = new anm.Element('root');
                    var child = new anm.Element('child');
                    root.add(child);
                    anim.add(root);

                    anim.setDuration(10);
                    root.changeBand(2.0, 4.0);
                    root.stay();
                    child.changeBand(-1.0, 3.0);
                    child.stay();

                    // anim: 0-----1-----2-----3-----4-----5-----6-
                    // root:             0-----1-----∞·············
                    // chld:       0-----1-----2-----3-----∞·······

                    anim.tick(0.5); // 0.5
                    expect(root.isActive()).toBeFalsy();
                    anim.tick(3.0); // 3.5
                    expect(root.getTime()).toBe(1.5);
                    expect(child.getTime()).toBe(2.5);
                    anim.tick(1.0); // 4.5
                    expect(root.getTime()).toBe(2.0);
                    expect(child.getTime()).toBe(3.0);
                    anim.tick(1.0); // 5.5
                    expect(root.getTime()).toBe(2.0);
                    expect(child.getTime()).toBe(3.0);
                });

                xit('works for elements with parent having affectsChildren == false', function() {
                    var anim = new anm.Animation();
                    var root = new anm.Element('root');
                    var child = new anm.Element('child');
                    root.add(child);
                    anim.add(root);

                    anim.setDuration(10);
                    root.changeBand(2.0, 4.0);
                    root.affectsChildren = false;
                    root.stay();
                    child.changeBand(-1.0, 3.0);
                    child.stay();

                    // anim: 0-----1-----2-----3-----4-----5-----6-
                    // root:             0-----1-----∞·············
                    // chld:       0-----1-----2-----3-----∞·······

                    anim.tick(0.5); // 0.5
                    expect(root.isActive()).toBeFalsy();
                    anim.tick(3.0); // 3.5
                    expect(root.getTime()).toBe(1.5);
                    expect(child.getTime()).toBe(2.5);
                    anim.tick(1.0); // 4.5
                    expect(root.getTime()).toBe(2.0);
                    expect(child.getTime()).toBe(3.5);
                    anim.tick(1.0); // 5.5
                    expect(root.getTime()).toBe(2.0);
                    expect(child.getTime()).toBe(4.0);
                });

            });

            describe('`loop`', function() {

                it('works for root elements', function() {
                    var anim = new anm.Animation();
                    var root = new anm.Element('root');
                    anim.add(root);

                    anim.setDuration(10);
                    root.changeBand(2.0, 5.0);
                    root.loop();

                    // anim: 0-----1-----2-----3-----4-----5-----6-
                    // root:             0-----1-----2-----↻-----1-

                    anim.tick(0.5); // 0.5
                    expect(root.isActive()).toBeFalsy();
                    anim.tick(3.0); // 3.5
                    expect(root.getTime()).toBe(1.5);
                    anim.tick(1.0); // 4.5
                    expect(root.getTime()).toBe(2.5);
                    anim.tick(1.0); // 5.5
                    expect(root.getTime()).toBe(0.5);
                });

                it('works for elements with parent', function() {
                   var anim = new anm.Animation();
                   var root = new anm.Element('root');
                   var child = new anm.Element('child');
                   root.add(child);
                   anim.add(root);

                   anim.setDuration(10);
                   root.changeBand(2.0, Infinity);
                   child.changeBand(-1.0, 2.0);
                   child.loop();

                   // anim: 0-----1-----2-----3-----4-----5-----6-
                   // root:             0-----1-----2-----3-----4-
                   // chld:       0-----1-----2-----↻-----1-----2-

                   anim.tick(0.5); // 0.5
                   expect(root.isActive()).toBeFalsy();
                   anim.tick(3.0); // 3.5
                   expect(root.getTime()).toBe(1.5);
                   expect(child.getTime()).toBe(2.5);
                   anim.tick(1.0); // 4.5
                   expect(root.getTime()).toBe(2.5);
                   expect(child.getTime()).toBe(0.5);
                   anim.tick(1.0); // 5.5
                   expect(root.getTime()).toBe(3.5);
                   expect(child.getTime()).toBe(1.5);
                });

                xit('works when both element and parent have same end-action', function() {
                    var anim = new anm.Animation();
                    var root = new anm.Element('root');
                    var child = new anm.Element('child');
                    root.add(child);
                    anim.add(root);

                    anim.setDuration(10);
                    root.changeBand(2.0, 5.0);
                    root.loop();
                    child.changeBand(-1.0, 2.0);
                    child.loop();

                    // anim: 0-----1-----2-----3-----4-----5-----6-
                    // root:             0-----1-----2-----↻-----1-
                    // chld:       0-----1-----2-----↻-----^-----2-
                    //                              3>0   1>1

                    // root loop interrupts child flow and starts to play from
                    // the start of what "it have seen", so from child t === 1,
                    // though here it looks as  child normal flow continued

                    anim.tick(0.5); // 0.5
                    expect(root.isActive()).toBeFalsy();
                    anim.tick(3.0); // 3.5
                    expect(root.getTime()).toBe(1.5);
                    expect(child.getTime()).toBe(2.5);
                    anim.tick(1.0); // 4.5
                    expect(root.getTime()).toBe(2.5);
                    expect(child.getTime()).toBe(0.5);
                    anim.tick(1.0); // 5.5
                    expect(root.getTime()).toBe(0.5);
                    expect(child.getTime()).toBe(1.5);
                });

                it('works when both element and parent have same end-action and parent ends earlier', function() {
                    var anim = new anm.Animation();
                    var root = new anm.Element('root');
                    var child = new anm.Element('child');
                    root.add(child);
                    anim.add(root);

                    anim.setDuration(10);
                    root.changeBand(2.0, 4.0);
                    root.loop();
                    child.changeBand(-1.0, 3.0);
                    child.loop();

                    // anim: 0-----1-----2-----3-----4-----5-----6-
                    // root:             0-----1-----↻-----1-----2-
                    // chld:       0-----1-----2-----^-----2-----3-

                    // (loop on the root overrides here the child loop
                    //  and starts child it not from 0, but from 1, since
                    //  it is the time when root was at 0)

                    anim.tick(0.5); // 0.5
                    expect(root.isActive()).toBeFalsy();
                    anim.tick(3.0); // 3.5
                    expect(root.getTime()).toBe(1.5);
                    expect(child.getTime()).toBe(2.5);
                    anim.tick(1.0); // 4.5
                    expect(root.getTime()).toBe(0.5);
                    expect(child.getTime()).toBe(1.5);
                    anim.tick(1.0); // 5.5
                    expect(root.getTime()).toBe(1.5);
                    expect(child.getTime()).toBe(2.5);
                });

                xit('works for elements with parent having affectsChildren == false', function() {
                    var anim = new anm.Animation();
                    var root = new anm.Element('root');
                    var child = new anm.Element('child');
                    root.add(child);
                    anim.add(root);

                    anim.setDuration(10);
                    root.changeBand(2.0, 4.0);
                    root.affectsChildren = false;
                    root.loop();
                    child.changeBand(-1.0, 3.0);
                    child.loop();

                    // anim: 0-----1-----2-----3-----4-----5-----6-
                    // root:             0-----1-----↻-----1-----2-
                    // chld:       0-----1-----2-----3-----↻-----1--

                    // here both root and child continue playing since
                    // root time is not affecting the child

                    anim.tick(0.5); // 0.5
                    expect(root.isActive()).toBeFalsy();
                    anim.tick(3.0); // 3.5
                    expect(root.getTime()).toBe(1.5);
                    expect(child.getTime()).toBe(2.5);
                    anim.tick(1.0); // 4.5
                    expect(root.getTime()).toBe(0.5);
                    expect(child.getTime()).toBe(3.5);
                    anim.tick(1.0); // 5.5
                    expect(root.getTime()).toBe(1.5);
                    expect(child.getTime()).toBe(0.5);
                });

                describe('loop with number of repitions', function() {

                    xit('works for root elements', function() {
                        var anim = new anm.Animation();
                        var root = new anm.Element('root');
                        anim.add(root);

                        anim.setDuration(10);
                        root.changeBand(1.0, 3.0);
                        root.loop(2);

                        // anim: 0-----1-----2-----3-----4-----5-----6-----7-----8-
                        // root:       0-----1-----↻-----1-----↻-----1-----2

                        anim.tick(0.5); // 0.5
                        expect(root.isActive()).toBeFalsy();
                        anim.tick(1.0); // 2.5
                        expect(root.getTime()).toBe(1.5);
                        anim.tick(1.0); // 3.5
                        expect(root.getTime()).toBe(0.5);
                        anim.tick(1.0); // 4.5
                        expect(root.getTime()).toBe(1.5);
                        anim.tick(2.4); // 6.9
                        expect(root.getTime()).toBe(1.9);
                        anim.tick(0.1); // 7.0
                        expect(root.getTime()).toBe(2.0);
                        anim.tick(0.1); // 7.1
                        expect(root.isActive()).toBeFalsy();
                    });

                    xit('works for elements with parent', function() {
                        var anim = new anm.Animation();
                        var root = new anm.Element('root');
                        var child = new anm.Element('child');
                        root.add(child);
                        anim.add(root);

                        anim.setDuration(10);
                        root.changeBand(2.0, Infinity);
                        child.changeBand(-1.0, 1.0);
                        child.loop(2);

                        // anim: 0-----1-----2-----3-----4-----5-----6-----7-----8-
                        // root:             0-----1-----2-----3-----4-----5-----6-
                        // chld:       0-----1-----↻-----1-----↻-----1-----2

                        anim.tick(0.5); // 0.5
                        expect(root.isActive()).toBeFalsy();
                        anim.tick(3.0); // 3.5
                        expect(root.getTime()).toBe(1.5);
                        expect(child.getTime()).toBe(0.5);
                        anim.tick(1.0); // 4.5
                        expect(root.getTime()).toBe(2.5);
                        expect(child.getTime()).toBe(1.5);
                        anim.tick(1.0); // 5.5
                        expect(root.getTime()).toBe(3.5);
                        expect(child.getTime()).toBe(0.5);
                        anim.tick(1.4); // 6.9
                        expect(root.getTime()).toBe(4.9);
                        expect(child.getTime()).toBe(1.9);
                        anim.tick(0.1); // 7.0
                        expect(root.getTime()).toBe(5.0);
                        expect(child.getTime()).toBe(2.0);
                        anim.tick(0.1); // 7.1
                        expect(root.getTime()).toBe(5.1);
                        expect(child.isActive()).toBeFalsy();
                    });

                });

            });

            describe('`bounce`', function() {

                xit('works for root elements', function() {
                    var anim = new anm.Animation();
                    var root = new anm.Element('root');
                    anim.add(root);

                    anim.setDuration(10);
                    root.changeBand(2.0, 5.0);
                    root.bounce();

                    // anim: 0-----1-----2-----3-----4-----5-----6-
                    // root:             0-----1-----2-----↺↼↼↼↼↼2↼

                    anim.tick(0.5); // 0.5
                    expect(root.isActive()).toBeFalsy();
                    anim.tick(3.0); // 3.5
                    expect(root.getTime()).toBe(1.5);
                    anim.tick(1.0); // 4.5
                    expect(root.getTime()).toBe(2.5);
                    anim.tick(0.9); // 5.4
                    expect(root.getTime()).toBe(2.6);
                });

                xit('works for elements with parent', function() {
                   var anim = new anm.Animation();
                   var root = new anm.Element('root');
                   var child = new anm.Element('child');
                   root.add(child);
                   anim.add(root);

                   anim.setDuration(10);
                   root.changeBand(2.0, Infinity);
                   child.changeBand(-1.0, 2.0);
                   child.bounce();

                   // anim: 0-----1-----2-----3-----4-----5-----6-
                   // root:             0-----1-----2-----3-----4-
                   // chld:       0-----1-----2-----↺↼↼↼↼↼2↼↼↼↼↼1↼

                   anim.tick(0.5); // 0.5
                   expect(root.isActive()).toBeFalsy();
                   anim.tick(3.0); // 3.5
                   expect(root.getTime()).toBe(1.5);
                   expect(child.getTime()).toBe(2.5);
                   anim.tick(1.0); // 4.5
                   expect(root.getTime()).toBe(2.5);
                   expect(child.getTime()).toBe(2.5);
                   anim.tick(1.0); // 5.5
                   expect(root.getTime()).toBe(3.5);
                   expect(child.getTime()).toBe(1.5);
                });

                xit('works when both element and parent have same end-action', function() {
                    var anim = new anm.Animation();
                    var root = new anm.Element('root');
                    var child = new anm.Element('child');
                    root.add(child);
                    anim.add(root);

                    anim.setDuration(10);
                    root.changeBand(2.0, 5.0);
                    root.bounce();
                    child.changeBand(-1.0, 2.0);
                    child.bounce();

                    // anim: 0-----1-----2-----3-----4-----5-----6-----7-
                    // root:             0-----1-----2-----↺↼↼↼↼↼2↼↼↼↼↼1↼
                    // chld:       0-----1-----2-----↺↼↼↼↼↼^-----↺↼↼↼↼↼2↼
                    //                               3     2     3

                    // root overrides the reverse flow of a child,
                    // so it should reverse everything what happened before from
                    // its point of view

                    anim.tick(0.5); // 0.5
                    expect(root.isActive()).toBeFalsy();
                    anim.tick(3.0); // 3.5
                    expect(root.getTime()).toBe(1.5);
                    expect(child.getTime()).toBe(2.5);
                    anim.tick(1.0); // 4.5
                    expect(root.getTime()).toBe(2.5);
                    expect(child.getTime()).toBe(0.5);
                    anim.tick(1.0); // 5.5
                    expect(root.getTime()).toBe(2.5);
                    expect(child.getTime()).toBe(2.5);
                    anim.tick(0.9); // 6.4
                    expect(root.getTime()).toBe(1.6);
                    expect(child.getTime()).toBe(2.6);
                });

                xit('works when both element and parent have same end-action and parent ends earlier', function() {
                    var anim = new anm.Animation();
                    var root = new anm.Element('root');
                    var child = new anm.Element('child');
                    root.add(child);
                    anim.add(root);

                    anim.setDuration(10);
                    root.changeBand(2.0, 4.0);
                    root.bounce();
                    child.changeBand(-1.0, 3.0);
                    child.bounce();

                    // anim: 0-----1-----2-----3-----4-----5-----6-----7-
                    // root:             0-----1-----↺↼↼↼↼↼1↼↼↼↼↼↻-----1-
                    // chld:       0-----1-----2-----^↼↼↼↼↼2↼↼↼↼↼^-----2-

                    // (bounce on the root overrides here the child bounce
                    //  and starts child it not from last point)

                    anim.tick(0.5); // 0.5
                    expect(root.isActive()).toBeFalsy();
                    anim.tick(3.0); // 3.5
                    expect(root.getTime()).toBe(1.5);
                    expect(child.getTime()).toBe(2.5);
                    anim.tick(1.0); // 4.5
                    expect(root.getTime()).toBe(0.5);
                    expect(child.getTime()).toBe(2.5);
                    anim.tick(1.0); // 5.5
                    expect(root.getTime()).toBe(0.5);
                    expect(child.getTime()).toBe(1.5);
                    anim.tick(0.9); // 6.4
                    expect(root.getTime()).toBe(0.4);
                    expect(child.getTime()).toBe(1.4);
                });

                xit('works for elements with parent having affectsChildren == false', function() {
                    var anim = new anm.Animation();
                    var root = new anm.Element('root');
                    var child = new anm.Element('child');
                    root.add(child);
                    anim.add(root);

                    anim.setDuration(10);
                    root.changeBand(2.0, 4.0);
                    root.bounce(1);
                    child.changeBand(-1.0, 3.0);

                    // anim: 0-----1-----2-----3-----4-----5-----6-----7-
                    // root:             0-----1-----↺↼↼↼↼↼1↼↼↼↼↼↻-----1-
                    // chld:       0-----1-----2-----^↼↼↼↼↼2↼↼↼↼↼0

                    // (bounce on the root overrides here the child bounce
                    //  and starts child it not from last point)

                    anim.tick(0.5); // 0.5
                    expect(root.isActive()).toBeFalsy();
                    anim.tick(3.0); // 3.5
                    expect(root.getTime()).toBe(1.5);
                    expect(child.getTime()).toBe(2.5);
                    anim.tick(1.0); // 4.5
                    expect(root.getTime()).toBe(0.5);
                    expect(child.getTime()).toBe(2.5);
                    anim.tick(1.0); // 5.5
                    expect(root.getTime()).toBe(0.5);
                    expect(child.getTime()).toBe(1.5);
                    anim.tick(1.0); // 6.5
                    expect(root.getTime()).toBe(0.5);
                    expect(child.isActive()).toBeFalsy();
                });

                describe('bounce with number of repitions', function() {

                    xit('works for root elements', function() {
                        var anim = new anm.Animation();
                        var root = new anm.Element('root');
                        anim.add(root);

                        anim.setDuration(10);
                        root.changeBand(1.0, 3.0);
                        root.bounce(2);

                        // anim: 0-----1-----2-----3-----4-----5-----6-----7-----8-
                        // root:       0-----1-----↺↼↼↼↼↼1↼↼↼↼↼↻-----1-----2

                        anim.tick(0.5); // 0.5
                        expect(root.isActive()).toBeFalsy();
                        anim.tick(1.0); // 2.5
                        expect(root.getTime()).toBe(1.5);
                        anim.tick(1.0); // 3.5
                        expect(root.getTime()).toBe(1.5);
                        anim.tick(1.0); // 4.5
                        expect(root.getTime()).toBe(0.5);
                        anim.tick(2.4); // 6.9
                        expect(root.getTime()).toBe(1.9);
                        anim.tick(0.1); // 7.0
                        expect(root.getTime()).toBe(2.0);
                        anim.tick(0.1); // 7.1
                        expect(root.isActive()).toBeFalsy();
                    });

                    xit('works for elements with parent', function() {
                        var anim = new anm.Animation();
                        var root = new anm.Element('root');
                        var child = new anm.Element('child');
                        root.add(child);
                        anim.add(root);

                        anim.setDuration(10);
                        root.changeBand(2.0, Infinity);
                        child.changeBand(-1.0, 1.0);
                        child.bounce(2);

                        // anim: 0-----1-----2-----3-----4-----5-----6-----7-----8-
                        // root:             0-----1-----2-----3-----4-----5-----6-
                        // chld:       0-----1-----↺↼↼↼↼↼1↼↼↼↼↼↻-----1-----2

                        anim.tick(0.5); // 0.5
                        expect(root.isActive()).toBeFalsy();
                        anim.tick(3.0); // 3.5
                        expect(root.getTime()).toBe(1.5);
                        expect(child.getTime()).toBe(1.5);
                        anim.tick(1.0); // 4.5
                        expect(root.getTime()).toBe(2.5);
                        expect(child.getTime()).toBe(0.5);
                        anim.tick(1.0); // 5.5
                        expect(root.getTime()).toBe(3.5);
                        expect(child.getTime()).toBe(0.5);
                        anim.tick(1.4); // 6.9
                        expect(root.getTime()).toBe(4.9);
                        expect(child.getTime()).toBe(1.9);
                        anim.tick(0.1); // 7.0
                        expect(root.getTime()).toBe(5.0);
                        expect(child.getTime()).toBe(2.0);
                        anim.tick(0.1); // 7.1
                        expect(root.getTime()).toBe(5.1);
                        expect(child.isActive()).toBeFalsy();
                    });

                    xit('works for elements with parent, case 2', function() {
                        var anim = new anm.Animation();
                        var root = new anm.Element('root');
                        var child = new anm.Element('child');
                        root.add(child);
                        anim.add(root);

                        anim.setDuration(10);
                        root.changeBand(2.0, Infinity);
                        child.changeBand(-1.0, 1.0);
                        child.bounce(1);

                        // anim: 0-----1-----2-----3-----4-----5-----6-----7-----8-
                        // root:             0-----1-----2-----3-----4-----5-----6-
                        // chld:       0-----1-----↺↼↼↼↼↼1↼↼↼↼↼0

                        anim.tick(0.5); // 0.5
                        expect(root.isActive()).toBeFalsy();
                        anim.tick(3.0); // 3.5
                        expect(root.getTime()).toBe(1.5);
                        expect(child.getTime()).toBe(1.5);
                        anim.tick(1.0); // 4.5
                        expect(root.getTime()).toBe(2.5);
                        expect(child.getTime()).toBe(0.5);
                        anim.tick(0.4); // 4.9
                        expect(root.getTime()).toBe(2.4);
                        expect(child.getTime()).toBe(0.1);
                        anim.tick(0.1); // 5.0
                        expect(root.getTime()).toBe(3.0);
                        expect(child.getTime()).toBe(0.0);
                        anim.tick(0.1); // 5.1
                        expect(root.getTime()).toBe(3.1);
                        expect(child.isActive()).toBeFalsy();
                    });

                });

            });

        });

        describe('switcher tween', function() {

            xit('works when band starts at 0', function() {
                var anim = new anm.Animation();
                var container = new anm.Element('container');
                anim.add(container);

                var conditionOne = new anm.Element('condition-one'),
                    conditionTwo = new anm.Element('condition-two'),
                    conditionThree = new anm.Element('condition-three');

                container.add(conditionOne);
                container.add(conditionTwo);
                container.add(conditionThree);

                conditionOne.changeBand(0.0, 2.0);
                conditionTwo.changeBand(0.0, 3.0);
                conditionThree.changeBand(0.0, 3.0);

                container.tween(anm.Tween.switch().value('condition-one').band(0.0, 2.0));
                container.tween(anm.Tween.switch().value('condition-two').band(2.0, 5.0));
                container.tween(anm.Tween.switch().value('condition-three').band(5.0, Infinity));

                // anim: 0-----1-----2-----3-----4-----5-----6-----7-----8-
                // cntr: 0-----1-----2-----3-----4-----5-----6-----7-----8-
                //       [---cnd1---][------cnd2------][------cnd3-------]
                //   cnd1: ----1-----2
                //   cnd2:           0-----1-----2-----3
                //   cnd3:                             0-----1-----2-----3

                anim.tick(0.5); // 0.5
                expect(conditionOne.getTime()).toBe(0.5);
                expect(conditionTwo.isActive()).toBeFalsy();
                expect(conditionThree.isActive()).toBeFalsy();
                anim.tick(1.0); // 1.5
                expect(conditionOne.getTime()).toBe(1.5);
                expect(conditionTwo.isActive()).toBeFalsy();
                expect(conditionThree.isActive()).toBeFalsy();
                anim.tick(1.0); // 2.5
                expect(conditionOne.isActive()).toBeFalsy();
                expect(conditionTwo.getTime()).toBe(0.5);
                expect(conditionThree.isActive()).toBeFalsy();
                anim.tick(2.0); // 4.5
                expect(conditionOne.isActive()).toBeFalsy();
                expect(conditionTwo.getTime()).toBe(2.5);
                expect(conditionThree.isActive()).toBeFalsy();
                anim.tick(1.0); // 5.5
                expect(conditionOne.isActive()).toBeFalsy();
                expect(conditionTwo.isActive()).toBeFalsy();
                expect(conditionThree.getTime()).toBe(0.5);
                anim.tick(2.0); // 7.5
                expect(conditionOne.isActive()).toBeFalsy();
                expect(conditionTwo.isActive()).toBeFalsy();
                expect(conditionThree.getTime()).toBe(2.5);
                anim.tick(1.0); // 8.5
                expect(conditionOne.isActive()).toBeFalsy();
                expect(conditionTwo.isActive()).toBeFalsy();
                expect(conditionThree.isActive()).toBeFalsy();

            });

        });

    });

    describe('adding actions', function() {

        it('calls actions in requested time', function() {
            var anim = new anm.Animation();
            var root = new anm.Element('root');
            anim.add(root);

            anim.setDuration(10);

            // anim: 0-----1-----2-----3-----
            // root: 0--○--1-----2-----3-----

            var actionSpy = jasmine.createSpy('action');
            root.at(0.5, actionSpy);
            anim.tick(0.2); // 0.2
            expect(actionSpy).not.toHaveBeenCalled();
            anim.tick(0.4); // 0.6
            expect(actionSpy).toHaveBeenCalled();
        });

        it('passes call time to the action', function() {
            var anim = new anm.Animation();
            var root = new anm.Element('root');
            anim.add(root);

            anim.setDuration(10);

            // anim: 0---●-1-----2-----3-----
            // root: 0--○--1-----2-----3-----

            var actionSpy = jasmine.createSpy('action');
            root.at(0.5, actionSpy);
            anim.tick(0.6);
            expect(actionSpy).toHaveBeenCalledWith(0.6);
        });

        it('passes call time to the action according to the band', function() {
            var anim = new anm.Animation();
            var root = new anm.Element('root');
            anim.add(root);

            anim.setDuration(10);
            root.changeBand(1.2, 5);

            //                   2
            // anim: 0-----1-----●-----3-----4-----5-----6-
            // root:        [0--○--1-----2-----3---]

            var actionSpy = jasmine.createSpy('action');
            root.at(0.5, actionSpy); // 1.2 + 0.5 == 1.7
            anim.tick(1.0); // 1.0
            expect(actionSpy).not.toHaveBeenCalled();
            anim.tick(1.0); // 2.0
            expect(actionSpy).toHaveBeenCalledWith(2 - 1.2);
        });

        it('passes owner as `this` to the action', function() {
            var anim = new anm.Animation();
            var root = new anm.Element('root');
            anim.add(root);

            anim.setDuration(10);

            // anim: 0-----1-----2-----3-----4-----5-----6-
            // root: 0--○--1-----2-----3-----4-----5-----6-

            var actionSpy = jasmine.createSpy('action');
            root.at(0.5, actionSpy.and.callFake(function() {
                expect(this).toBe(root);
            }));
            anim.tick(0.6);
            expect(actionSpy).toHaveBeenCalled();
        });

        it('action is called once', function() {
            var anim = new anm.Animation();
            var root = new anm.Element('root');
            anim.add(root);

            anim.setDuration(10);

            // anim: 0-----1-----2-----3-----
            // root: 0-----○-----2-----3-----
            //             1

            var actionSpy = jasmine.createSpy('action');
            root.at(1.0, actionSpy);
            anim.tick(1.0); // 1.0
            expect(actionSpy).toHaveBeenCalled();
            actionSpy.calls.reset();
            anim.tick(0.1); // 1.1
            expect(actionSpy).not.toHaveBeenCalled();
        });

        it('action is called even if assigned to zero time', function() {
            var anim = new anm.Animation();
            var root = new anm.Element('root');
            anim.add(root);

            anim.setDuration(10);

            // anim: 0-----1-----2-----3-----
            // root: ○-----1-----2-----3-----
            //       0

            var actionSpy = jasmine.createSpy('action');
            root.at(0.0, actionSpy);

            anim.tick(0.1);
            expect(actionSpy).toHaveBeenCalled();
        });

    });

    describe('pausing/continuing', function() {

        it('time just flows if there are no pauses', function() {
            var anim = new anm.Animation();
            var root = new anm.Element('root');
            anim.add(root);

            anim.setDuration(10);

            // anim: 0-----1-----2-----3-----4-----5-----6-
            // root: 0-----1-----2-----3-----4-----5-----6-

            anim.tick(1.5); // 1.5
            expect(root.getTime()).toBe(1.5);
            anim.tick(1.0); // 2.5
            expect(root.getTime()).toBe(2.5);
        });

        it('time pauses properly', function() {
            var anim = new anm.Animation();
            var root = new anm.Element('root');
            anim.add(root);

            anim.setDuration(10);

            // anim: 0-----1-----2-----3-----4-----5-----6-
            // root: 0-----1·······························

            root.timeline.pauseAt(1.0);
            anim.tick(1.0); // 1.0
            expect(root.getTime()).toBe(1.0);
            anim.tick(1.0); // 2.0
            expect(root.getTime()).toBe(1.0);
            anim.tick(0.2); // 2.2
            expect(root.getTime()).toBe(1.0);
        });

        it('pauses time is the actual time when pause was performed', function() {
            var anim = new anm.Animation();
            var root = new anm.Element('root');
            anim.add(root);

            anim.setDuration(10);

            // anim: 0-----1-----2-----3-----4-----5-----6-
            // root: 0-----1-······························

            root.timeline.pauseAt(1.0);
            anim.tick(1.2); // 1.2
            expect(root.getTime()).toBe(1.2);
            anim.tick(1.3); // 2.5
            expect(root.getTime()).toBe(1.2);
            anim.tick(0.2); // 2.7
            expect(root.getTime()).toBe(1.2);
        });

        it('time pauses and continues', function() {
            var anim = new anm.Animation();
            var root = new anm.Element('root');
            anim.setDuration(10);
            anim.add(root);

            // anim: 0-----1-----2-----3-----4-----5-----6-
            // root: 0-----1·····1-----2-----3-----4-----5-

            anim.at(1.0, function() { root.pause(); });
            anim.at(2.0, function() { root.continue(); });
            anim.tick(1.0); // 1.0
            expect(root.getTime()).toBe(1.0);
            anim.tick(1.0); // 2.0
            expect(root.getTime()).toBe(1.0);
            anim.tick(1.0); // 3.0
            expect(root.getTime()).toBe(2.0);
        });

        it('time pauses and continues at the actual time when corresponding action was performed', function() {
            var anim = new anm.Animation();
            var root = new anm.Element('root');
            anim.setDuration(10);
            anim.add(root);

            // anim: 0-----1-----2-----3-----4-----5-----6-
            // root: 0-----1-·········----2-----3-----4----

            anim.at(1.0, function() { root.pause(); });
            anim.at(2.0, function() { root.continue(); });
            anim.tick(1.2); // 1.2
            expect(root.getTime()).toBe(1.2);
            anim.tick(1.5); // 2.7 // yet paused, but continue called now
            expect(root.getTime()).toBe(1.2);
            anim.tick(1.0); // 3.7
            // time when root was paused + time passed in animation since last continue call
            expect(root.getTime()).toBe((3.7 - 2.7) + 1.2);
        });

        it('time pauses both in the element and its children when `affectsChildren` is `true` (default)', function() {
            var anim = new anm.Animation();
            var root = new anm.Element('root');
            var child = new anm.Element('child');
            root.add(child);
            anim.add(root);

            anim.setDuration(10);

            // anim: 0-----1-----2-----3-----4-----5-----6-
            // root: 0-----1·······························
            // chld: 0-----1·······························

            anim.at(1.0, function() { root.pause(); });
            anim.tick(0.5); // 0.5
            expect(child.getTime()).toBe(0.5);
            anim.tick(0.5); // 1.0
            expect(child.getTime()).toBe(1.0);
            anim.tick(1.0); // 2.0
            expect(child.getTime()).toBe(1.0);
            anim.tick(1.0); // 3.0
            expect(child.getTime()).toBe(1.0);
        });

        it('time pauses and continues both in the element and its children when `affectsChildren` is `true` (default)', function() {
            var anim = new anm.Animation();
            var root = new anm.Element('root');
            var child = new anm.Element('child');
            root.add(child);
            anim.add(root);

            anim.setDuration(10);

            // anim: 0-----1-----2-----3-----4-----5-----6-
            // root: 0-----1·····1-----2-----3-----4-----5-
            // chld: 0-----1·····1-----2-----3-----4-----5-

            anim.at(1.0, function() { root.pause(); });
            anim.at(2.0, function() { root.continue(); });
            anim.tick(0.5); // 0.5
            expect(child.getTime()).toBe(0.5);
            anim.tick(0.5); // 1.0
            expect(child.getTime()).toBe(1.0);
            anim.tick(1.0); // 2.0
            expect(child.getTime()).toBe(1.0);
            anim.tick(1.0); // 3.0
            expect(child.getTime()).toBe(2.0);
        });

        xit('time pauses in the element and its children with bands, when `affectsChildren` flag is `true` (default)', function() {
            var anim = new anm.Animation();
            var root = new anm.Element('root');
            var child = new anm.Element('child');
            root.add(child);
            anim.add(root);

            anim.setDuration(10);

            // anim: 0-----1-----2-----3-----4-----5-----6-
            // root:       0-----1-----2···················
            // chld:             0-----1···················

            anim.at(2.0, function() { root.pause(); });
            anim.at(3.0, function() { root.continue(); });
            anim.tick(1.0); // 1.0
            expect(child.isActive()).toBeFalsy();
            anim.tick(1.0); // 2.0
            expect(child.getTime()).toBe(0.0);
            anim.tick(1.0); // 3.0
            expect(child.getTime()).toBe(1.0);
            anim.tick(1.0); // 4.0
            expect(child.getTime()).toBe(1.0);
        });

        xit('time pauses and continues in the element and its children with bands, when `affectsChildren` flag is `true` (default)', function() {
            var anim = new anm.Animation();
            var root = new anm.Element('root');
            var child = new anm.Element('child');
            root.add(child);
            anim.add(root);

            anim.setDuration(10);

            // anim: 0-----1-----2-----3-----4-----5-----6-
            // root:       0-----1·····1-----2-----3-----4-
            // chld:             0·····0-----1-----2-----3-

            anim.at(2.0, function() { root.pause(); });
            anim.at(3.0, function() { root.continue(); });
            anim.tick(1.5); // 1.5
            expect(child.isActive()).toBeFalsy();
            anim.tick(1.0); // 2.5
            expect(child.getTime()).toBe(0);
            anim.tick(2.0); // 4.5
            expect(child.getTime()).toBe(1.5);
        });

        it('time pauses in the element, but not in its children, when `affectsChildren` is `false`', function() {
            var anim = new anm.Animation();
            var root = new anm.Element('root');
            var child = new anm.Element('child');
            root.add(child);
            anim.add(root);

            anim.setDuration(10);
            root.affectsChildren = false;

            // anim: 0-----1-----2-----3-----4-----5-----6-
            // root: 0-----1·····1-----2-----3-----4-----5-
            // chld: 0-----1-----2-----3-----4-----5-----6-

            anim.at(1.0, function() { root.pause(); });
            anim.at(2.0, function() { root.continue(); });
            anim.tick(1.0); // 1.0
            expect(child.getTime()).toBe(1.0);
            anim.tick(1.0); // 2.0
            expect(child.getTime()).toBe(2.0);
        });

        xit('time pauses in the element, but not in its children, with bands, when `affectsChildren` is `false`', function() {
            var anim = new anm.Animation();
            var root = new anm.Element('root');
            var child = new anm.Element('child');
            root.add(child);
            anim.add(root);

            anim.setDuration(10);
            root.affectsChildren = false;
            root.changeBand(1.0, 10);
            child.changeBand(1.0, 10);

            // anim: 0-----1-----2-----3-----4-----5-----6-
            // root:       0-----1·····1-----2-----3-----4-
            // chld:             0-----1-----2-----3-----4-

            anim.at(2.0, function() { root.pause(); });
            anim.at(3.0, function() { root.continue(); });
            anim.tick(1.5); // 1.5
            expect(child.isActive()).toBeFalsy();
            anim.tick(1.0); // 2.5
            expect(child.getTime()).toBe(0.5);
        });


        it('pauses scene at zero time', function() {
            var anim = new anm.Animation();
            anim.setDuration(10);
            anim.getCurrentScene().at(0.0, function() {
                anim.getCurrentScene().pause();
            });

            // anim: 0-----1-----2-----3-----
            // scne: 0·······················

            anim.tick(0.1);
            expect(anim.getCurrentScene().getTime()).toBe(0.1);
            anim.tick(0.4); // 0.5
            expect(anim.getCurrentScene().getTime()).toBe(0.1);
        });

        // TODO: with repeat modes, several pauses, ...

    });

    describe('jumps in time', function() {

        it('jumps forward in time', function() {

            var anim = new anm.Animation();
            var root = new anm.Element('root');
            anim.add(root);

            anim.setDuration(10);

            root.at(2.0, function() {
                this.jump(3.0);
            });

            // anim: 0-----1-----2-----3-----4-----5-----6-
            // root: 0-----1----2>3----4-----5-----6-----7-

            anim.tick(1.0); // 1.0
            expect(root.getTime()).toBe(1.0);
            anim.tick(1.0); // 2.0
            expect(root.getTime()).toBe(3.0);
            anim.tick(2.0); // 4.0
            expect(root.getTime()).toBe(5.0);

        });

        it('jumps backward in time', function() {

            var anim = new anm.Animation();
            var root = new anm.Element('root');
            anim.add(root);

            anim.setDuration(10);

            root.at(3.0, function() {
                this.jump(1.0);
            });

            // anim: 0-----1-----2-----3-----4----
            // root: 0-----1-----2----3>1----2----

            anim.tick(2.0); // 2.0
            expect(root.getTime()).toBe(2.0);
            anim.tick(1.0); // 3.0 // jump performed here
            expect(root.getTime()).toBe(1.0);
            anim.tick(1.0); // 4.0
            expect(root.getTime()).toBe(2.0);

        });

        xit('jumps backward in time in same timespan as tick performed', function() {

            var anim = new anm.Animation();
            var root = new anm.Element('root');
            anim.add(root);

            anim.setDuration(10);

            root.at(2.0, function() {
                console.log('jump');
                this.jump(1.0);
            });

            // anim: 0-----1-----2-----3-----4-----5-----6-
            // root: 0-----1----2>1---2>1---2>1---2>1---2>1-

            anim.tick(1.0); // 1.0
            expect(root.getTime()).toBe(1.0);
            anim.tick(1.0); // 2.0 // jump performed here
            expect(root.getTime()).toBe(1.0);
            anim.tick(1.0); // 3.0 // jump performed once more
            expect(root.getTime()).toBe(1.0);
            anim.tick(1.1); // 4.1
            expect(root.getTime()).toBe(1.1);

        });

        xit('jump\'s time is relative to the owner\'s time', function() {
            var anim = new anm.Animation();
            var root = new anm.Element('root');
            anim.add(root);

            anim.setDuration(10);
            root.changeBand(1.0, 10);

            root.at(2.0, function() {
                this.jump(4.0);
            });

            // anim: 0-----1-----2-----3-----4-----5-----6-
            // root:       0-----1----2>4----5-----6-----7-

            anim.tick(1.0); // 1.0
            expect(root.getTime()).toBe(0.0);
            anim.tick(1.0); // 2.0
            expect(root.getTime()).toBe(1.0);
            anim.tick(2.0); // 4.0
            expect(root.getTime()).toBe(5.0);
        });

        xit('jumps backward in time, several times', function() {
            var anim = new anm.Animation();
            var root = new anm.Element('root');
            anim.add(root);

            anim.setDuration(10);

            root.at(3.0, function() {
                this.jump(1.0);
            });

            // anim: 0-----1-----2-----3-----4-----5-----6-
            // root: 0-----1-----2----3>1----2----3>1----2-

            anim.tick(3.0); // 3.0 // jump performed first time
            anim.tick(2.0); // 5.0 // jump performed second time
            expect(root.getTime()).toBe(1.0);
            anim.tick(0.5); // 5.5
            expect(root.getTime()).toBe(1.5);
        });

        xit('jumps several times when both jumps fit in one tick', function() {
            var anim = new anm.Animation();
            var root = new anm.Element('root');
            anim.add(root);

            anim.setDuration(10);

            root.at(3.0, function() {
                this.jump(1.0);
            });

            // anim: 0-----1-----2-----3-----4-----5-----6-
            // root: 0-----1-----2----3>1----2----3>1----2-

            anim.tick(5.5); // jump should be performed twice
            expect(root.getTime()).toBe(1.5);
        });

        xit('also jumps twice in a child when jumps are done in parent', function() {
            var anim = new anm.Animation();
            var root = new anm.Element('root');
            var child = new anm.Element('child');
            root.add(child);
            anim.add(root);

            anim.setDuration(10);
            root.changeBand(1.0, 10);
            child.changeBand(1.0, 10);

            root.at(3.0, function() {
                this.jump(1.0);
            });

            // anim: 0-----1-----2-----3-----4-----5-----6-----7-
            // root:       0-----1-----2----3>1----2----3>1----2-
            // chld:             0-----1----2}0----1----2}0----1-

            anim.tick(3.5); // 3.5
            expect(root.getTime()).toBe(2.5);
            expect(child.getTime()).toBe(1.5);
            anim.tick(1.0); // 4.5
            expect(root.getTime()).toBe(1.5);
            expect(child.getTime()).toBe(0.5);
            anim.tick(2.1); // 6.6
            expect(root.getTime()).toBe(1.6);
            expect(child.getTime()).toBe(0.6);
        });

        xit('also jumps twice in a child when jumps are done in parent with `affectsChildren` == `false`', function() {
            var anim = new anm.Animation();
            var root = new anm.Element('root');
            var child = new anm.Element('child');
            root.add(child);
            anim.add(root);

            anim.setDuration(10);
            root.affectsChildren = false;
            root.changeBand(1.0, 10);
            child.changeBand(1.0, 10);

            root.at(3.0, function() {
                this.jump(1.0);
            });

            // anim: 0-----1-----2-----3-----4-----5-----6-----7-
            // root:       0-----1-----2----3>1----2----3>1----2-
            // chld:             0-----1-----2-----3-----4-----5-

            anim.tick(3.5); // 3.5
            expect(root.getTime()).toBe(2.5);
            expect(child.getTime()).toBe(1.5);
            anim.tick(1.0); // 4.5
            expect(root.getTime()).toBe(1.5);
            expect(child.getTime()).toBe(2.5);
            anim.tick(2.1); // 6.6
            expect(root.getTime()).toBe(1.6);
            expect(child.getTime()).toBe(4.6);
        });

        // TODO: with repeat modes

    });

    describe('messages', function() {

        describe('global', function() {

            it('fires a messages to a subscriber', function() {
                var anim = new anm.Animation();

                var fooSpy = jasmine.createSpy('foo');
                anim.onMessage('foo', fooSpy);

                expect(fooSpy).not.toHaveBeenCalled();
                anim.fireMessage('foo');

                expect(fooSpy).toHaveBeenCalled();
            });

            it('passes owner as `this` to the handler', function() {
                var anim = new anm.Animation();

                var fooSpy = jasmine.createSpy('foo').and.callFake(function() {
                    expect(this).toBe(anim);
                });
                anim.onMessage('foo', fooSpy);
                anim.fireMessage('foo');

                expect(fooSpy).toHaveBeenCalled();
            });

            it('fires a message to all subscribers', function() {

                var anim = new anm.Animation();

                var fooSpy = jasmine.createSpy('foo');
                var barSpy1 = jasmine.createSpy('bar');
                var barSpy2 = jasmine.createSpy('bar');

                anim.onMessage('foo', fooSpy);
                anim.onMessage('bar', barSpy1);
                anim.onMessage('bar', barSpy2);

                anim.fireMessage('foo');

                expect(fooSpy).toHaveBeenCalled();
                expect(barSpy1).not.toHaveBeenCalled();
                expect(barSpy2).not.toHaveBeenCalled();
                fooSpy.calls.reset();

                anim.fireMessage('bar');

                expect(fooSpy).not.toHaveBeenCalled();
                expect(barSpy1).toHaveBeenCalled();
                expect(barSpy2).toHaveBeenCalled();
            });

        });

        describe('local', function() {

            it('fires a messages to a subscriber', function() {
                var anim = new anm.Animation();
                var root = new anm.Element();
                anim.add(root);

                var animFooSpy = jasmine.createSpy('foo');
                anim.onMessage('foo', animFooSpy);
                var rootFooSpy = jasmine.createSpy('foo');
                root.onMessage('foo', rootFooSpy);

                expect(rootFooSpy).not.toHaveBeenCalled();
                root.fireMessage('foo');

                expect(animFooSpy).not.toHaveBeenCalled();
                expect(rootFooSpy).toHaveBeenCalled();
                rootFooSpy.calls.reset();

                anim.fireMessage('foo');
                expect(animFooSpy).toHaveBeenCalled();
                expect(rootFooSpy).not.toHaveBeenCalled();
            });

            it('passes owner as `this` to the handler', function() {
                var anim = new anm.Animation();
                var root = new anm.Element();
                anim.add(root);

                var fooSpy = jasmine.createSpy('foo').and.callFake(function() {
                    expect(this).toBe(root);
                });
                root.onMessage('foo', fooSpy);
                root.fireMessage('foo');

                expect(fooSpy).toHaveBeenCalled();
            });

            it('fires a message to all subscribers', function() {
                var anim = new anm.Animation();
                var root = new anm.Element();
                anim.add(root);

                var fooSpy = jasmine.createSpy('foo');
                var barSpy1 = jasmine.createSpy('bar');
                var barSpy2 = jasmine.createSpy('bar');

                root.onMessage('foo', fooSpy);
                root.onMessage('bar', barSpy1);
                root.onMessage('bar', barSpy2);

                root.fireMessage('foo');

                expect(fooSpy).toHaveBeenCalled();
                expect(barSpy1).not.toHaveBeenCalled();
                expect(barSpy2).not.toHaveBeenCalled();
                fooSpy.calls.reset();

                root.fireMessage('bar');

                expect(fooSpy).not.toHaveBeenCalled();
                expect(barSpy1).toHaveBeenCalled();
                expect(barSpy2).toHaveBeenCalled();
            });

        });

    });

    // TODO: speed

    // TODO: events

    // TODO: position manually adjusted

});
