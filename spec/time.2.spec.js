describe('timeline spec, Dima\'s version', function() {

    function roundPoint(pt) {
        return {
            x: Math.floor(pt.x),
            y: Math.floor(pt.y)
        }
    }

    describe('clips', function() {

        function createClip(name) {
            var elm = new anm.Element(name);
            //elm.affectsChildren = false;
            return elm;
        }

        /**
         *  Movie
         *    s1 dur=50
         *       c1   [1................................................41]  (100,100) -> (200,200)
         *         e1    [3..........10]                                      (0,0) -> (10,10)
         */

        it('properly advances time with simple ticks', function() {
            // setup
            var anim = new anm.Animation();
            anim.setDuration(50);

            var s1 = new anm.Scene('s1');
            s1.setDuration(50);
            anim.add(s1);
            //anim.addScene(s1);

            var c1 = createClip('c1');
            c1.changeBand(1.0, 40.0);
            c1.modify(anm.Tween.translate().from([ 100, 100 ]).to([ 200, 200 ]));
            s1.add(c1);

            var e1 = new anm.Element('e1');
            e1.changeBand(3.0, 10.0);
            e1.modify(anm.Tween.translate().from([ 0, 0 ]).to([ 10, 10 ]));
            c1.add(e1);

            // test
            anim.tick(2.0);
            expect(anim.getTime()).toEqual(2.0);
            expect(c1.getTime()).toEqual(1.0);
            expect(c1.isActive()).toBeTruthy();
            expect(e1.isActive()).toBeFalsy();
            expect(roundPoint({ x: c1.x, y: c1.y })).toEqual({ x: 102, y: 102 });

            anim.tick(1.0); // 3.0
            expect(anim.getTime()).toEqual(3.0);
            expect(c1.getTime()).toEqual(2.0);
            expect(c1.isActive()).toBeTruthy();
            expect(e1.isActive()).toBeFalsy();
            expect(roundPoint({ x: c1.x, y: c1.y })).toEqual({ x: 105, y: 105 });

            anim.tick(1.0); // 4.0
            expect(c1.getTime()).toEqual(3.0);
            expect(c1.isActive()).toBeTruthy();
            expect(e1.isActive()).toBeTruthy();
            expect(roundPoint({ x: c1.x, y: c1.y })).toEqual({ x: 107, y: 107 });
            expect({ x: e1.x, y: e1.y }).toEqual({ x: 0, y: 0 });

            anim.tick(7.0); // 11.0
            expect(c1.getTime()).toEqual(10.0);
            expect(c1.isActive()).toBeTruthy();
            expect(e1.isActive()).toBeTruthy();
            expect(roundPoint({ x: c1.x, y: c1.y })).toEqual({ x: 125, y: 125 });
            expect({ x: e1.x, y: e1.y }).toEqual({ x: 10, y: 10 });

            anim.tick(1.0); // 12.0
            expect(c1.getTime()).toEqual(11.0);
            expect(c1.isActive()).toBeTruthy();
            expect(e1.isActive()).toBeFalsy();
            expect(roundPoint({ x: c1.x, y: c1.y })).toEqual({ x: 128, y: 128 });
        });

        /**
         *  Movie
         *    s1 dur=50
         *       c1   [1...6{....11.....16}] band 1,6, loop(3) (100,100) -> (200,200)
         *         e1  [1........10] (0,0) -> (10,10)
         */

        it('properly performs simple loops', function() {
            // setup
            var anim = new anm.Animation();
            anim.setDuration(50);

            var s1 = new anm.Scene('s1');
            s1.setDuration(50);
            //anim.addScene(s1);
            anim.add(s1);

            var c1 = createClip('c1');
            c1.changeBand(1.0, 6.0);
            c1.loop(2);
            c1.modify(anm.Tween.translate().from([ 100, 100 ]).to([ 200, 200 ]));
            s1.add(c1);

            var e1 = new anm.Element('e1');
            e1.changeBand(1.0, 10.0);
            e1.modify(anm.Tween.translate().from([ 0, 0 ]).to([ 10, 10 ]));
            c1.add(e1);

            // test
            anim.tick(2);
            expect(anim.getTime()).toEqual(2.0);
            expect(c1.getTime()).toEqual(1.0);
            expect(c1.isActive()).toBeTruthy();
            expect(e1.isActive()).toBeTruthy();
            expect(roundPoint({ x: c1.x, y: c1.y })).toEqual({ x: 120, y: 120 });

            anim.tick(4); // 6.0
            expect(c1.getTime()).toEqual(5.0);
            expect(c1.isActive()).toBeTruthy();
            expect(e1.isActive()).toBeTruthy();
            expect(roundPoint({ x: c1.x, y: c1.y })).toEqual({ x: 200, y: 200 });
            expect(roundPoint({ x: e1.x, y: e1.y })).toEqual({ x: 4, y: 4 });

            anim.tick(1); // 7.0
            expect(c1.getTime()).toEqual(6.0); // next loop started
            expect(c1.isActive()).toBeTruthy();
            expect(e1.isActive()).toBeTruthy();
            expect(roundPoint({ x: c1.x, y: c1.y })).toEqual({ x: 120, y: 120 });
            expect(roundPoint({ x: e1.x, y: e1.y })).toEqual({ x: 5, y: 5 });

            anim.tick(10); // 17.0
            expect(c1.getTime()).toEqual(15.0);
            expect(c1.isActive()).toBeFalsy();
            expect(e1.isActive()).toBeFalsy();
        });

        /**
         *  Movie
         *    s1 dur=50
         *       c1   [1...6{....11.....16}] band 1,6, bounce(3) (100,100) -> (200,200)
         *         e1  [1........10] (0,0) -> (10,10)
         */

        it('properly performs simple bounce', function() {
            // setup
            var anim = new anm.Animation();
            anim.setDuration(50);

            var s1 = new anm.Scene('s1');
            s1.setDuration(50);
            //anim.addScene(s1);
            anim.add(s1);

            var c1 = createClip('c1');
            c1.changeBand(1.0, 6.0);
            c1.bounce(2);
            c1.modify(anm.Tween.translate().from([ 100, 100 ]).to([ 200, 200 ]));
            s1.add(c1);

            var e1 = new anm.Element('e1');
            e1.changeBand(1.0, 10.0);
            e1.modify(anm.Tween.translate().from([ 0, 0 ]).to([ 10, 10 ]));
            c1.add(e1);

            // test
            anim.tick(2);
            expect(anim.getTime()).toEqual(2.0);
            expect(c1.getTime()).toEqual(1.0);
            expect(c1.isActive()).toBeTruthy();
            expect(e1.isActive()).toBeTruthy();
            expect(roundPoint({ x: c1.x, y: c1.y })).toEqual({ x: 120, y: 120 });

            anim.tick(4); // 6.0
            expect(c1.getTime()).toEqual(5.0);
            expect(c1.isActive()).toBeTruthy();
            expect(e1.isActive()).toBeTruthy();
            expect(roundPoint({ x: c1.x, y: c1.y })).toEqual({ x: 200, y: 200 });
            expect(roundPoint({ x: e1.x, y: e1.y })).toEqual({ x: 4, y: 4 });

            anim.tick(1); // 7.0
            expect(c1.getTime()).toEqual(5.0);
            expect(c1.isActive()).toBeTruthy();
            expect(e1.isActive()).toBeTruthy();
            expect(roundPoint({ x: c1.x, y: c1.y })).toEqual({ x: 180, y: 180 });
            expect(roundPoint({ x: e1.x, y: e1.y })).toEqual({ x: 5, y: 5 });

            anim.tick(10); // 17.0
            expect(c1.getTime()).toEqual(15.0);
            expect(c1.isActive()).toBeFalsy();
            expect(e1.isActive()).toBeFalsy();

        });

    });

    describe('groups', function() {

        function createGroup(name) {
            var elm = new anm.Element(name);
            //elm.affectsChildren = false;
            return elm;
        }

        it('disallows adding tweens to groups', function() {
            var g1 = createGroup('g1');

            expect(function() {
                g1.modify(anm.Tween.translate().from([ 100, 100 ]).to([ 200, 200 ]));
            }).toThrow();
        });

        /**
         *  Movie
         *    s1 dur=50
         *       g1   [10..........30]   group
         *         e1 [10..20]          (0,0) -> (10,10)
         *         e2        [20..30]   (10, 10) -> (0,0)
         */

        it('properly advances time with simple ticks', function() {
            // setup
            var anim = new anm.Animation();
            anim.setDuration(50);

            var s1 = new anm.Scene('s1');
            s1.setDuration(50);
            //anim.addScene(s1);
            anim.add(s1);

            var g1 = createGroup('g1');
            g1.changeBand(10.0, 30.0);

            s1.add(g1);

            var e1 = new anm.Element('e1');
            e1.changeBand(10.0, 20.0);
            e1.modify(anm.Tween.translate().from([ 0, 0 ]).to([ 10, 10 ]));
            g1.add(e1);

            var e2 = new anm.Element('e1');
            e2.changeBand(10.0, 20.0);
            e2.modify(anm.Tween.translate().from([ 10, 0 ]).to([ 0, 0 ]));
            g1.add(e2);

            // test
            anim.tick(9.0);
            expect(anim.getTime()).toEqual(9.0);
            expect(e1.isActive()).toBeFalsy();
            expect(e2.isActive()).toBeFalsy();

            anim.tick(1.0); // 10.0
            expect(e1.isActive()).toBeTruthy();
            expect(e2.isActive()).toBeFalsy();
            expect({ x: e1.x, y: e1.y }).toEqual({ x: 0, y: 0 });

            anim.tick(10.0); // 20.0
            expect(e1.isActive()).toBeTruthy();
            expect(e2.isActive()).toBeTruthy();
            expect({ x: e1.x, y: e1.y }).toEqual({ x: 10, y: 10 });
            expect({ x: e2.x, y: e2.y }).toEqual({ x: 10, y: 10 });

            anim.tick(10.0); // 30.0
            expect(e1.isActive()).toBeFalsy();
            expect(e2.isActive()).toBeTruthy();
            expect({ x: e2.x, y: e2.y }).toEqual({ x: 0, y: 0 });

            anim.tick(1.0); // 31.0
            expect(e1.isActive()).toBeFalsy();
            expect(e2.isActive()).toBeFalsy();
            expect(g1.isActive()).toBeFalsy();
        });

        /**
         *  Movie
         *    s1 dur=50
         *       g1   [10..........30{...............50.........70}]       group loop(3)
         *         e1 [10..20]       [30..40]       [50..60]               (0,0) -> (10,10)
         *         e2        [20..30]       [40..50]       [60..70]        (10, 10) -> (0,0)
         */

        it('properly performs simple loops', function() {
            // setup
            var anim = new anm.Animation();
            anim.setDuration(50);

            var s1 = new anm.Scene('s1');
            s1.setDuration(50);
            //anim.addScene(s1);
            anim.add(s1);

            var g1 = createGroup('g1');
            g1.changeBand(10.0, 30.0);
            g1.loop(2);

            s1.add(g1);

            var e1 = new anm.Element('e1');
            e1.changeBand(10.0, 20.0);
            e1.modify(anm.Tween.translate().from([ 0, 0 ]).to([ 10, 10 ]));
            g1.add(e1);

            var e2 = new anm.Element('e1');
            e2.changeBand(10.0, 20.0);
            e2.modify(anm.Tween.translate().from([ 10, 0 ]).to([ 0, 0 ]));
            g1.add(e2);

            // test
            anim.tick(9.0);
            expect(anim.getTime()).toEqual(9.0);
            expect(e1.isActive()).toBeFalsy();
            expect(e2.isActive()).toBeFalsy();

            anim.tick(1.0); // 10.0
            expect(e1.isActive()).toBeTruthy();
            expect(e2.isActive()).toBeFalsy();
            expect({ x: e1.x, y: e1.y }).toEqual({ x: 0, y: 0 });

            anim.tick(10.0); // 20.0
            expect(e1.isActive()).toBeTruthy();
            expect(e2.isActive()).toBeTruthy();
            expect({ x: e1.x, y: e1.y }).toEqual({ x: 10, y: 10 });
            expect({ x: e2.x, y: e2.y }).toEqual({ x: 10, y: 10 });

            anim.tick(11.0); // 31.0
            expect(anim.getTime()).toEqual(31.0);
            expect(e1.isActive()).toBeTruthy();
            expect(e2.isActive()).toBeFalsy();
            expect(roundPoint({ x: e1.x, y: e1.y })).toEqual({ x: 1, y: 1 });

            anim.tick(10.0); // 41.0
            expect(anim.getTime()).toEqual(31.0);
            expect(e1.isActive()).toBeFalsy();
            expect(e2.isActive()).toBeTruthy();
            expect(roundPoint({ x: e2.x, y: e2.y })).toEqual({ x: 9, y: 9 });
        });

        /**
         *  Movie
         *    s1 dur=50
         *       g1   [10..........30{...............50.........70}]       group bounce(3)
         *         e1 [10..20]               [40..50][50..60]              (0,0) -> (10,10)
         *         e2        [20..30][30..40]               [60..70]       (10, 10) -> (0,0)
         */

        it('properly performs simple bouncing', function() {
            // setup
            var anim = new anm.Animation();
            anim.setDuration(50);

            var s1 = new anm.Scene('s1');
            s1.setDuration(50);
            //anim.addScene(s1);
            anim.add(s1);

            var g1 = createGroup('g1');
            g1.changeBand(10.0, 30.0);
            g1.loop(2);

            s1.add(g1);

            var e1 = new anm.Element('e1');
            e1.changeBand(10.0, 20.0);
            e1.modify(anm.Tween.translate().from([ 0, 0 ]).to([ 10, 10 ]));
            g1.add(e1);

            var e2 = new anm.Element('e1');
            e2.changeBand(10.0, 20.0);
            e2.modify(anm.Tween.translate().from([ 10, 0 ]).to([ 0, 0 ]));
            g1.add(e2);

            // test
            anim.tick(9.0);
            expect(anim.getTime()).toEqual(9.0);
            expect(e1.isActive()).toBeFalsy();
            expect(e2.isActive()).toBeFalsy();

            anim.tick(1.0); // 10.0
            expect(e1.isActive()).toBeTruthy();
            expect(e2.isActive()).toBeFalsy();
            expect({ x: e1.x, y: e1.y }).toEqual({ x: 0, y: 0 });

            anim.tick(10.0); // 20.0
            expect(e1.isActive()).toBeTruthy();
            expect(e2.isActive()).toBeTruthy();
            expect({ x: e1.x, y: e1.y }).toEqual({ x: 10, y: 10 });
            expect({ x: e2.x, y: e2.y }).toEqual({ x: 10, y: 10 });

            anim.tick(11.0); // 31.0
            expect(anim.getTime()).toEqual(31.0);
            expect(e1.isActive()).toBeFalsy();
            expect(e2.isActive()).toBeTruthy();
            expect(roundPoint({ x: e2.x, y: e2.y })).toEqual({ x: 1, y: 1 });

            anim.tick(10.0); // 41.0
            expect(anim.getTime()).toEqual(31.0);
            expect(e1.isActive()).toBeTruthy();
            expect(e2.isActive()).toBeFalsy();
            expect(roundPoint({ x: e1.x, y: e1.y })).toEqual({ x: 9, y: 9 });
        });

    });

});
