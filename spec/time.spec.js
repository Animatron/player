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
            var endSpy = jasmine.createSpy('end');
            anim.timeline.on(anm.C.X_END, endSpy);
            anim.tick(2);
            anim.tick(10);
            expect(endSpy).not.toHaveBeenCalled();
            anim.tick(9);
            expect(endSpy).toHaveBeenCalled();
            expect(anim.getTime()).toBe(anm.Timeline.NO_TIME);
        });

        it('properly advances to a next scene', function() {

            var anim = new anm.Animation();

            anim.replaceFirstScene('Foo', 10);
            anim.addScene('Bar', 10);

            anim.tick(5);
            expect(anim.getCurrentScene().name).toBe('Foo');

            anim.tick(5.1);
            expect(anim.getCurrentScene().name).toBe('Bar');

        });

    });

    describe('adding actions', function() {

        it('calls actions in requested time', function() {
            var anim = new anm.Animation();
            var root = new anm.Element();
            anim.setDuration(10);
            anim.add(root);
            var actionSpy = jasmine.createSpy('action');
            root.at(0.5, actionSpy);
            anim.tick(0.2);
            expect(actionSpy).not.toHaveBeenCalled();
            anim.tick(0.4); // 0.2 + 0.4 == 0.6
            expect(actionSpy).toHaveBeenCalled();
        });

        it('passes call time to the action', function() {
            var anim = new anm.Animation();
            var root = new anm.Element();
            anim.setDuration(10);
            anim.add(root);
            var actionSpy = jasmine.createSpy('action');
            root.at(0.5, actionSpy);
            anim.tick(0.6);
            expect(actionSpy).toHaveBeenCalledWith(0.6);
        });

        it('passes call time to the action according to the band', function() {
            var anim = new anm.Animation();
            var root = new anm.Element();
            anim.setDuration(10);
            root.changeBand(0.3, 5);
            anim.add(root);
            var actionSpy = jasmine.createSpy('action');
            root.at(0.5, actionSpy); // 0.3 + 0.5 == 0.8
            anim.tick(0.6);
            expect(actionSpy).not.toHaveBeenCalled();
            anim.tick(0.6); // 0.6 + 0.6 == 1.2
            expect(actionSpy).toHaveBeenCalledWith(1.2 - 0.3);
        });

        it('passes owner as `this` to the action', function() {
            var anim = new anm.Animation();
            var root = new anm.Element();
            anim.setDuration(10);
            anim.add(root);
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
            var root = new anm.Element();
            anim.setDuration(10);
            anim.add(root);
            anim.tick(1.5);
            expect(root.getTime()).toBe(1.5);
        });

        it('time pauses properly', function() {
            var anim = new anm.Animation();
            var root = new anm.Element();
            anim.setDuration(10);
            anim.add(root);
            root.timeline.pauseAt(1.0);
            anim.tick(1.5);
            expect(root.getTime()).toBe(1.0);
        });

        it('time pauses and continues', function() {
            var anim = new anm.Animation();
            var root = new anm.Element();
            anim.setDuration(10);
            anim.add(root);
            anim.at(1.0, function() { root.pause(); });
            anim.at(2.0, function() { root.continue(); });
            anim.tick(1.5);
            expect(root.getTime()).toBe(1.0);
            anim.tick(1.0);
            expect(root.getTime()).toBe(1.5);
        });

        it('`affectsChildren` (`true` by default) flag stops time both in the element and it\'s children', function() {
            var anim = new anm.Animation();
            var root = new anm.Element();
            var child = new anm.Element();
            anim.setDuration(10);
            root.add(child);
            anim.add(root);
            anim.at(1.0, function() { root.pause(); });
            anim.at(2.0, function() { root.continue(); });
            anim.tick(1.5);
            expect(child.getTime()).toBe(1.0);
            anim.tick(1.0);
            expect(child.getTime()).toBe(1.5);
        });

        it('when `affectsChildren` is `false`, it stops time in the element, but not in it\'s children', function() {
            var anim = new anm.Animation();
            var root = new anm.Element();
            root.affectsChildren = false;
            var child = new anm.Element();
            anim.setDuration(10);
            root.add(child);
            anim.add(root);
            anim.at(1.0, function() { root.pause(); });
            anim.at(2.0, function() { root.continue(); });
            anim.tick(1.5);
            expect(child.getTime()).toBe(1.5);
            anim.tick(1.0);
            expect(child.getTime()).toBe(2.5);
        });

        // TODO: with repeat modes, several pauses, ...

    });

    describe('jumps in time', function() {

        it('jumps forward in time', function() {

            var anim = new anm.Animation();
            var root = new anm.Element();
            anim.setDuration(10);
            anim.add(root);
            root.at(2.0, function() {
                this.jump(3.0);
            });

            anim.tick(1.0);
            expect(root.getTime()).toBe(1.0);
            anim.tick(1.0); // jump performed here
            expect(root.getTime()).toBe(3.0);
            anim.tick(2.0);
            expect(root.getTime()).toBe(5.0);

        });

        it('jumps backward in time', function() {

            var anim = new anm.Animation();
            var root = new anm.Element();
            anim.setDuration(10);
            anim.add(root);
            root.at(2.0, function() {
                this.jump(1.0);
            });

            anim.tick(1.0); // anim.getTime() == 1.0
            expect(root.getTime()).toBe(1.0);
            anim.tick(1.0); // anim.getTime() == 2.0 // jump performed here
            expect(root.getTime()).toBe(1.0);
            anim.tick(2.0); // anim.getTime() == 4.0
            expect(root.getTime()).toBe(3.0);

        });

        it('jump\'s time is relative to the owner\'s time', function() {
            var anim = new anm.Animation();
            var root = new anm.Element();
            anim.setDuration(10);
            root.changeBand(1.0, 10);
            anim.add(root);
            root.at(2.0, function() {
                this.jump(4.0);
            });

            anim.tick(1.0);
            expect(root.getTime()).toBe(0.0); // root band started
            anim.tick(1.0);
            expect(root.getTime()).toBe(1.0);
            anim.tick(2.0); // jump performed here + 1.0sec
            // animation time now: 4sec
            // root jumped at animation time == 3sec (root's own 2sec)
            // to its own 4sec, and then 1sec more passed after a jump
            expect(root.getTime()).toBe(5.0);
        });

        // TODO: jumps with `affectsChildren` == `false`

        // TODO: with repeat modes, several jumps, ...

    });

});
