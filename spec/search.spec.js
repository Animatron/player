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
        animation.add(element().add(element()));

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
        var rootElement = element('root');

        animation.add(element('stub'));
        animation.add(rootElement.add(element('sub-root').add(searchForOne)));
        animation.add(element('another').add(searchForTwo));

        expect(animation.findAll('foobar')[0].id).toEqual(searchForOne.id);
        expect(animation.findAll('foobar')[1].id).toEqual(searchForTwo.id);

        expect(rootElement.findAll('foobar')[0].id).toEqual(searchForOne.id);
        expect(rootElement.findAll('foobar')[1].id).toEqual(searchForTwo.id);
    });

    describe('properly searches for an element by path, when', function() {

        it('placed in a root', function() {
            var animation = new anm.Animation();
            var searchFor = element('foobar');
            animation.add(element('stub'));
            animation.add(searchFor);

            expect(animation.find('/foobar').id).toEqual(searchFor.id);
            expect(animation.findAll('/foobar')[0].id).toEqual(searchFor.id);
        });


        it('placed as a child somewhere deep inside', function() {
            var animation = new anm.Animation();
            var searchFor = element('foobar');
            animation.add(element('stub'));
            animation.add(element('root').add(element('sub-root').add(searchFor)));

            expect(animation.find('/foobar')).toBeNull();
            expect(animation.findAll('/foobar')).toBeEmpty();

            expect(animation.find('/stub/foobar')).toBeNull();
            expect(animation.findAll('/stub/foobar')).toBeEmpty();

            expect(animation.find('/stub/sub-root/foobar')).toBeNull();
            expect(animation.findAll('/stub/sub-root/foobar')).toBeEmpty();

            expect(animation.find('/stub/*/foobar')).toBeNull();
            expect(animation.findAll('/stub/*/foobar')).toBeEmpty();

            expect(animation.find('/root/foobar')).toBeNull();
            expect(animation.findAll('/root/foobar')).toBeEmpty();

            expect(animation.find('/root/sub-root/foobar').id).toEqual(searchFor.id);
            expect(animation.findAll('/root/sub-root/foobar')[0].id).toEqual(searchFor.id);

            //expect(animation.find('/root/*/foobar').id).toEqual(searchFor.id);
            //expect(animation.findAll('/root/*/foobar')[0].id).toEqual(searchFor.id);

            //expect(animation.find('/*/foobar').id).toEqual(searchFor.id);
            //expect(animation.findAll('/*/foobar')[0].id).toEqual(searchFor.id);
        });

        it('placed as a child somewhere deep inside and search started from a containing element', function() {
            var animation = new anm.Animation();
            var searchFor = element('foobar');

            var stubElement = element('stub');
            animation.add(stubElement);
            var rootElement = element('root'),
                subRootElement = element('sub-root');
            animation.add(rootElement.add(subRootElement.add(searchFor)));

            expect(stubElement.find('/foobar')).toBeNull();
            expect(stubElement.findAll('/foobar')).toBeEmpty();

            expect(rootElement.find('/root')).toBeNull();
            expect(rootElement.findAll('/root')).toBeEmpty();

            expect(rootElement.find('/sub-root/foobar').id).toEqual(searchFor.id);
            expect(rootElement.findAll('/sub-root/foobar')[0].id).toEqual(searchFor.id);

            //expect(rootElement.find('/*/foobar').id).toEqual(searchFor.id);
            //expect(rootElement.findAll('/*/foobar')[0].id).toEqual(searchFor.id);

            expect(subRootElement.find('/foobar').id).toEqual(searchFor.id);
            expect(subRootElement.findAll('/foobar')[0].id).toEqual(searchFor.id);
        });

    });

    it('properly searches for multiple elements with a same name, placed in a same element, by path', function() {
        var animation = new anm.Animation();
        var searchForOne = element('foobar'),
            searchForTwo = element('foobar');
        var rootElement = element('root');

        animation.add(element('stub'));
        animation.add(rootElement.add(element('sub-root').add(searchForOne).add(searchForTwo)));
        animation.add(element('another'));

        expect(animation.findAll('/root/sub-root/foobar')[0].id).toEqual(searchForOne.id);
        expect(animation.findAll('/root/sub-root/foobar')[1].id).toEqual(searchForTwo.id);

        expect(rootElement.findAll('/sub-root/foobar')[0].id).toEqual(searchForOne.id);
        expect(rootElement.findAll('/sub-root/foobar')[1].id).toEqual(searchForTwo.id);
    });

    it('properly searches for an element or several elements by path, constructed using indexes', function() {
        var animation = new anm.Animation();
        var searchForOne = element('foobar'),
            searchForTwo = element('foobar');

        var stubElement = element('stub');
        var rootElement = element('root'),
            subRootElement = element('sub-root');

        animation.add(stubElement);
        animation.add(rootElement);
        rootElement.add(element('index-0'));
        rootElement.add(element('index-1'));
        rootElement.add(subRootElement); // so it has index of 2 inside root element
        rootElement.add(element('index-3'));
        subRootElement.add(element('index-0'));
        subRootElement.add(searchForOne); // so it has index of 1 inside sub-root element
        subRootElement.add(element('index-2'));
        subRootElement.add(element('index-3'));
        subRootElement.add(searchForTwo); // so it has index of 4 inside sub-root element
        subRootElement.add(element('index-5'));

        expect(animation.find('/:0').id).toBeEqual(stubElement.id);
        expect(animation.findAll('/:0')[0].id).toBeEqual(stubElement.id);

        expect(animation.find('/:1').id).toBeEqual(rootElement.id);
        expect(animation.findAll('/:1')[0].id).toBeEqual(rootElement.id);

        expect(animation.find('/:0/sub-root/foobar')).toBeNull();
        expect(animation.findAll('/:0/sub-root/foobar')).toBeEmpty();

        expect(animation.find('/root/:1').name).toBeEqual('index-1');
        expect(animation.findAll('/root/:1')[0].name).toBeEqual('index-1');

        expect(animation.find('/root/:3').name).toBeEqual('index-3');
        expect(animation.findAll('/root/:3')[0].name).toBeEqual('index-3');

        expect(animation.find('/root/sub-root/:5').name).toBeEqual('index-5');
        expect(animation.findAll('/root/sub-root/:5')[0].name).toBeEqual('index-5');

        expect(animation.find('/:0/:5')).toBeNull();
        expect(animation.findAll('/:0/:5')).toBeEmpty();

        expect(animation.find('/:0/:2/:5')).toBeNull();
        expect(animation.findAll('/:0/:2/:5')).toBeEmpty();

        expect(animation.find('/:1/:2/:5').name).toBeEqual('index-5');
        expect(animation.findAll('/:1/:2/:5')[0].name).toBeEqual('index-5');

        expect(subRootElement.name).toBeEqual('sub-root');
        expect(animation.find('/root/:2').name).toBeEqual(subRootElement.name);
        expect(animation.findAll('/root/:2')[0].name).toBeEqual(subRootElement.name);

        expect(animation.find('/root/sub-root/:1').id).toBeEqual(searchForOne.id);
        expect(animation.find('/root/sub-root/:1').name).toBeEqual('foobar');
        expect(animation.findAll('/root/sub-root/:1')[0].id).toBeEqual(searchForOne.id);
        expect(animation.findAll('/root/sub-root/:1')[0].name).toBeEqual('foobar');

        expect(animation.find('/root/sub-root/:4').id).toBeEqual(searchForTwo.id);
        expect(animation.find('/root/sub-root/:4').name).toBeEqual('foobar');
        expect(animation.findAll('/root/sub-root/:4')[0].id).toBeEqual(searchForTwo.id);
        expect(animation.findAll('/root/sub-root/:4')[0].name).toBeEqual('foobar');

        expect(animation.find('/:1/sub-root/:1').id).toBeEqual(searchForOne.id);
        expect(animation.find('/:1/sub-root/:1').name).toBeEqual('foobar');
        expect(animation.findAll('/:1/sub-root/:1')[0].id).toBeEqual(searchForOne.id);
        expect(animation.findAll('/:1/sub-root/:1')[0].name).toBeEqual('foobar');

        expect(animation.find('/:1/sub-root/:4').id).toBeEqual(searchForTwo.id);
        expect(animation.find('/:1/sub-root/:4').name).toBeEqual('foobar');
        expect(animation.findAll('/:1/sub-root/:4')[0].id).toBeEqual(searchForTwo.id);
        expect(animation.findAll('/:1/sub-root/:4')[0].name).toBeEqual('foobar');

        expect(animation.find('/:1/:2/:1').id).toBeEqual(searchForOne.id);
        expect(animation.find('/:1/:2/:1').name).toBeEqual('foobar');
        expect(animation.findAll('/:1/:2/:1')[0].id).toBeEqual(searchForOne.id);
        expect(animation.findAll('/:1/:2/:1')[0].name).toBeEqual('foobar');

        expect(animation.find('/:1/:2/:4').id).toBeEqual(searchForTwo.id);
        expect(animation.find('/:1/:2/:4').name).toBeEqual('foobar');
        expect(animation.findAll('/:1/:2/:4')[0].id).toBeEqual(searchForTwo.id);
        expect(animation.findAll('/:1/:2/:4')[0].name).toBeEqual('foobar');

        expect(rootElement.find('/:2/:1').id).toBeEqual(searchForOne.id);
        expect(rootElement.find('/:2/:1').name).toBeEqual('foobar');
        expect(rootElement.findAll('/:2/:1')[0].id).toBeEqual(searchForOne.id);
        expect(rootElement.findAll('/:2/:1')[0].name).toBeEqual('foobar');

        expect(rootElement.find('/:2/:4').id).toBeEqual(searchForTwo.id);
        expect(rootElement.find('/:2/:4').name).toBeEqual('foobar');
        expect(rootElement.findAll('/:2/:4')[0].id).toBeEqual(searchForTwo.id);
        expect(rootElement.findAll('/:2/:4')[0].name).toBeEqual('foobar');

        expect(subRootElement.find('/:5').name).toBeEqual('index-5');
        expect(subRootElement.findAll('/:5')[0].name).toBeEqual('index-5');

        expect(subRootElement.find('/:7')).toBeNull();
        expect(subRootElement.findAll('/:7')).toBeEmpty();


    });

});
