describe('search', function() {

    var element = anm.Element._$;

    beforeEach(function() {
        jasmine.addMatchers({
            toBeEmpty: function() {
                return {
                    compare: function(actual, expected) {
                        return {
                            pass: (actual instanceof Array) && (actual.length === 0)
                        }
                    }
                }
            }
        });
    });

    it('finds nothing when animation is empty', function() {
        var animation = new anm.Animation();

        expect(animation.find('foobar')).toBeNull();
        expect(animation.findAll('foobar')).toBeEmpty();
    });

    it('finds nothing when there\'s no such element in animation', function() {
        var animation = new anm.Animation();

        animation.add(element('stub'));

        expect(animation.find('foobar')).toBeNull();
        expect(animation.findAll('foobar')).toBeEmpty();
    });

    describe('properly searches for an element by name, when', function() {

        it('placed in a root', function() {
            var animation = new anm.Animation();
            var searchFor = element('foobar');

            animation.add(element('stub'));
            animation.add(searchFor);

            expect(animation.find('foobar').id).toEqual(searchFor.id);
            expect(animation.findAll('foobar')[0].id).toEqual(searchFor.id);
        });


        it('placed as a child somewhere deep inside', function() {
            var animation = new anm.Animation();
            var searchFor = element('foobar');

            animation.add(element('stub'));
            animation.add(element('root').add(element('sub-root').add(searchFor)));

            expect(animation.find('foobar').id).toEqual(searchFor.id);
            expect(animation.findAll('foobar')[0].id).toEqual(searchFor.id);
        });

        it('placed as a child somewhere deep inside and search started from a containing element', function() {
            var animation = new anm.Animation();
            var searchFor = element('foobar');

            var stubElement = element('stub');
            animation.add(stubElement);
            var rootElement = element('root'),
                subRootElement = element('sub-root');
            animation.add(rootElement.add(subRootElement.add(searchFor)));

            expect(stubElement.find('foobar')).toBeNull();
            expect(stubElement.findAll('foobar')).toBeEmpty();

            expect(rootElement.find('foobar').id).toEqual(searchFor.id);
            expect(rootElement.findAll('foobar')[0].id).toEqual(searchFor.id);

            expect(subRootElement.find('foobar').id).toEqual(searchFor.id);
            expect(subRootElement.findAll('foobar')[0].id).toEqual(searchFor.id);
        });

    });

    it('properly searches for multiple elements with a same name', function() {
        var animation = new anm.Animation();
        var searchForOne = element('foobar'),
            searchForTwo = element('foobar');
        animation.add(element('stub'));
        animation.add(element('root').add(element('sub-root').add(searchForOne)));
        animation.add(element('another').add(searchForTwo));

        expect(animation.findAll('foobar')[0].id).toEqual(searchForOne.id);
        expect(animation.findAll('foobar')[1].id).toEqual(searchForTwo.id);
    });

    describe('properly searches for an element by path, when', function() {

        it('placed in a root', function() {
            var animation = new anm.Animation();
            var searchFor = element('Foobar');
            animation.add(element('stub'));
            animation.add(searchFor);

            expect(animation.find('/Foobar').id).toEqual(searchFor.id);
            expect(animation.findAll('/Foobar')[0].id).toEqual(searchFor.id);
        });


        it('placed as a child somewhere deep inside', function() {
            var animation = new anm.Animation();
            var searchFor = element('foobar');
            animation.add(element('stub'));
            animation.add(element('root').add(element('sub-root').add(searchFor)));

            expect(animation.find('foobar').id).toEqual(searchFor.id);
            expect(animation.findAll('foobar')[0].id).toEqual(searchFor.id);
        });

    });

});
