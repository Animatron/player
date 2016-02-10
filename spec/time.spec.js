describe('time', function() {

    describe('animation', function() {

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
        });

        xit('properly advances to a next scene', function() {

            var anim = new anm.Animation();

            anim.replaceFirstScene('Foo', 10);
            anim.addScene('Bar', 10);

            anim.tick(5);
            expect(anim.getCurrentScene().name).toBe('Foo');

            anim.tick(5.1);
            expect(anim.getCurrentScene().name).toBe('Bar');

        });

    });

});
