describe('timeline spec, Dima\'s version', function() {

    function createClip(name) {
        var elm = new anm.Element(name);
        //elm.affectsChildren = false;
        return elm;
    }

    function roundPoint(pt) {
        return {
            x: Math.floor(pt.x),
            y: Math.floor(pt.y)
        }
    }

    /**
     *  Movie
     *    s1 dur=50
     *       c1   [1................................................41]  (100,100) -> (200,200)
     *         e1    [3..........10]                                      (0,0) -> (10,10)
     */

    it('properly advances time with simple ticks', function() {
        var anim = new anm.Animation();
        anim.setDuration(50);

        var s1 = new anm.Scene('s1');
        s1.setDuration(50);
        anim.add(s1);

        var c1 = createClip('c1');
        c1.changeBand(1.0, 40.0);
        c1.modify(anm.Tween.translate().from([ 100, 100 ]).to([ 200, 200 ]));
        s1.add(c1);

        var e1 = new anm.Element('e1');
        e1.changeBand(3.0, 10.0);
        e1.modify(anm.Tween.translate().from([ 0, 0 ]).to([ 10, 10 ]));
        c1.add(e1);

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

});
