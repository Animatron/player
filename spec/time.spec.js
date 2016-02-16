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
            expect(root.getTime()).toBeLessThan(0);
            expect(child.getTime()).toBeLessThan(0);
            anim.tick(0.5); // 1.0
            expect(root.getTime()).toBe(0.0);
            expect(child.getTime()).toBeLessThan(0);
            anim.tick(1.0); // 2.0
            expect(root.getTime()).toBe(1.0);
            expect(child.getTime()).toBe(0.0);
            anim.tick(1.0); // 3.0
            expect(root.getTime()).toBe(2.0);
            expect(child.getTime()).toBe(1.0);

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

    });

    describe('pausing and continuing', function() {

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

        it('pausing time is the actual time when pause was performed', function() {
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

        it('time pauses and continued at the actual time when corresponding action was performed', function() {
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

        it('`affectsChildren` (`true` by default) flag stops time both in the element and it\'s children', function() {
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
            anim.tick(1.5); // 1.5
            expect(child.getTime()).toBe(1.0);
            anim.tick(1.0); // 2.5
            expect(child.getTime()).toBe(1.5);
        });

        it('`affectsChildren` (`true` by default) flag stops time both in the element and it\'s children, with bands', function() {
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
            expect(child.getTime()).toBe(anm.Timeline.NO_TIME);
            anim.tick(1.0); // 2.5
            expect(child.getTime()).toBe(0);
            anim.tick(2.0); // 4.5
            expect(child.getTime()).toBe(1.5);
        });

        it('when `affectsChildren` is `false`, it stops time in the element, but not in it\'s children', function() {
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
            anim.tick(1.5); // 1.5
            expect(child.getTime()).toBe(1.5);
            anim.tick(1.0); // 2.5
            expect(child.getTime()).toBe(2.5);
        });

        it('when `affectsChildren` is `false`, it stops time in the element, but not in it\'s children, relatively to parent band', function() {
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
            expect(child.getTime()).toBe(anm.Timeline.NO_TIME);
            anim.tick(1.0); // 2.5
            expect(child.getTime()).toBe(0.5);
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

            root.at(2.0, function() {
                this.jump(1.0);
            });

            // anim: 0-----1-----2-----3-----4-----5-----6-
            // root: 0-----1----2>1---2>1---2>1---2>1---2>1-

            anim.tick(1.0); // 1.0
            expect(root.getTime()).toBe(1.0);
            anim.tick(1.0); // 2.0 // jump performed here
            expect(root.getTime()).toBe(1.0);
            anim.tick(2.1); // 4.1
            expect(root.getTime()).toBe(1.1);

        });

        it('jump\'s time is relative to the owner\'s time', function() {
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

        it('jumps several times', function() {
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

        it('also jumps twice in a child when jumps are done in parent', function() {
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

        it('also jumps twice in a child when jumps are done in parent with `affectsChildren` == `false`', function() {
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

        // TODO: with repeat modes, several jumps, ...

    });

    // TODO: speed

    // TODO: events

    // TODO: position manually adjusted

});
