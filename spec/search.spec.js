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

            expect(animation.find('foobar')).toBe(searchFor);
            expect(animation.findAll('foobar')[0]).toBe(searchFor);
        });


        it('placed as a child somewhere deep inside', function() {
            var animation = new anm.Animation();
            var searchFor = element('foobar');

            animation.add(element('stub'));
            animation.add(element('root').add(element('sub-root').add(searchFor)));

            expect(animation.find('foobar')).toBe(searchFor);
            expect(animation.findAll('foobar')[0]).toBe(searchFor);
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

            expect(rootElement.find('foobar')).toBe(searchFor);
            expect(rootElement.findAll('foobar')[0]).toBe(searchFor);

            expect(subRootElement.find('foobar')).toBe(searchFor);
            expect(subRootElement.findAll('foobar')[0]).toBe(searchFor);
        });

        it('placed in a secondary scene', function() {
            var animation = new anm.Animation();
            var secondScene = animation.addScene('Second');
            var searchFor = element('foobar');
            secondScene.add(searchFor);
            expect(animation.find('foobar')).toBe(searchFor);
            expect(animation.findAll('foobar')[0]).toBe(searchFor);
        });;

    });

    it('properly searches for multiple elements with a same name', function() {
        var animation = new anm.Animation();
        var searchForOne = element('foobar'),
            searchForTwo = element('foobar');
        var rootElement = element('root');

        animation.add(element('stub'));
        animation.add(rootElement.add(element('sub-root').add(searchForOne)));
        animation.add(element('another').add(searchForTwo));

        expect(animation.findAll('foobar')[0]).toBe(searchForOne);
        expect(animation.findAll('foobar')[1]).toBe(searchForTwo);

        expect(rootElement.findAll('foobar')[0]).toBe(searchForOne);
        expect(rootElement.findAll('foobar')[1]).not.toBeDefined();
    });

    describe('properly searches for an element by path, when', function() {

        it('placed in a root', function() {
            var animation = new anm.Animation();
            var searchFor = element('foobar');
            animation.add(element('stub'));
            animation.add(searchFor);

            expect(animation.find('//foobar')).toBe(searchFor);
            expect(animation.findAll('//foobar')[0]).toBe(searchFor);
        });


        it('placed as a child somewhere deep inside', function() {
            var animation = new anm.Animation();
            var searchFor = element('foobar');
            animation.add(element('stub'));
            animation.add(element('root').add(element('sub-root').add(searchFor)));

            expect(animation.find('//foobar')).toBeNull();
            expect(animation.findAll('//foobar')).toBeEmpty();

            expect(animation.find('//stub/foobar')).toBeNull();
            expect(animation.findAll('//stub/foobar')).toBeEmpty();

            expect(animation.find('//stub/sub-root/foobar')).toBeNull();
            expect(animation.findAll('//stub/sub-root/foobar')).toBeEmpty();

            expect(animation.find('//stub/*/foobar')).toBeNull();
            expect(animation.findAll('//stub/*/foobar')).toBeEmpty();

            expect(animation.find('//root/foobar')).toBeNull();
            expect(animation.findAll('//root/foobar')).toBeEmpty();

            expect(animation.find('//root/sub-root/foobar').id).toEqual(searchFor.id);
            expect(animation.findAll('//root/sub-root/foobar')[0].id).toEqual(searchFor.id);

            //expect(animation.find('//root/*/foobar')).toBe(searchFor);
            //expect(animation.findAll('//root/*/foobar')[0]).toBe(searchFor);

            //expect(animation.find('//*/foobar')).toBe(searchFor);
            //expect(animation.findAll('//*/foobar')[0]).toBe(searchFor);
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

            expect(rootElement.find('/sub-root/foobar')).toBe(searchFor);
            expect(rootElement.findAll('/sub-root/foobar')[0]).toBe(searchFor);

            //expect(rootElement.find('//*/foobar')).toBe(searchFor);
            //expect(rootElement.findAll('//*/foobar')[0]).toBe(searchFor);

            expect(subRootElement.find('/foobar')).toBe(searchFor);
            expect(subRootElement.findAll('/foobar')[0]).toBe(searchFor);
        });

        it('is default scene', function() {
            var animation = new anm.Animation();
            var defaultScene = animation.getScenes()[0];

            expect(animation.find('//') instanceof anm.Scene).toBeTruthy();
            expect(animation.find('//').name).toBe('');
            expect(animation.find('//')).toBe(defaultScene);
            expect(animation.findAll('//')[0]).toBe(defaultScene);
        });

        it('is a named scene', function() {
            var animation = new anm.Animation();
            var defaultScene = animation.getScenes()[0];

            defaultScene.name = 'Default';
            expect(animation.find('/Default')).toBe(defaultScene);
            expect(animation.find('/Default/')).toBe(defaultScene);

            var secondScene = animation.addScene('Second');
            expect(animation.find('/Second')).toBe(secondScene);

        });

        it('placed inside a scene', function() {
            var animation = new anm.Animation();
            var secondScene = animation.addScene('Second');
            var searchFor = element('foobar');
            secondScene.add(searchFor);

            expect(animation.find('/Second/foobar')).toBe(searchFor);
            expect(animation.findAll('/Second/foobar')[0]).toBe(searchFor);
        });

        it('placed inside a scene and searched from a scene', function() {
            var animation = new anm.Animation();
            var secondScene = animation.addScene('Second');
            var searchFor = element('foobar');
            var subElement = element('sub');
            subElement.add(searchFor);
            secondScene.add(subElement);

            expect(secondScene.find('/sub/foobar')).toBe(searchFor);
            expect(secondScene.findAll('/sub/foobar')[0]).toBe(searchFor);

            expect(secondScene.find('foobar')).toBe(searchFor);
            expect(secondScene.findAll('foobar')[0]).toBe(searchFor);

            expect(animation.getScenes()[0].find('foobar')).toBeNull();
            expect(animation.getScenes()[0].findAll('foobar')).toBeEmpty();
            expect(animation.getScenes()[0].findAll('foobar')[0]).not.toBeDefined();
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

        expect(animation.findAll('//root/sub-root/foobar')[0]).toBe(searchForOne);
        expect(animation.findAll('//root/sub-root/foobar')[1]).toBe(searchForTwo);

        expect(rootElement.findAll('/sub-root/foobar')[0]).toBe(searchForOne);
        expect(rootElement.findAll('/sub-root/foobar')[1]).toBe(searchForTwo);
        expect(rootElement.findAll('/sub-root/foobar')[2]).not.toBeDefined();
    });

    it('properly searches for an element or several elements by path, constructed using indices', function() {
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

        expect(animation.find('//:0')).toBe(stubElement);
        expect(animation.findAll('//:0')[0]).toBe(stubElement);

        expect(animation.find('//:1')).toBe(rootElement);
        expect(animation.findAll('//:1')[0]).toBe(rootElement);

        expect(animation.find('//:0/sub-root/foobar')).toBeNull();
        expect(animation.findAll('//:0/sub-root/foobar')).toBeEmpty();

        expect(animation.find('//root/:1').name).toEqual('index-1');
        expect(animation.findAll('//root/:1')[0].name).toEqual('index-1');

        expect(animation.find('//root/:3').name).toEqual('index-3');
        expect(animation.findAll('//root/:3')[0].name).toEqual('index-3');

        expect(animation.find('//root/sub-root/:5').name).toEqual('index-5');
        expect(animation.findAll('//root/sub-root/:5')[0].name).toEqual('index-5');

        expect(animation.find('//:0/:5')).toBeNull();
        expect(animation.findAll('/:0/:5')).toBeEmpty();

        expect(animation.find('//:0/:2/:5')).toBeNull();
        expect(animation.findAll('//:0/:2/:5')).toBeEmpty();

        expect(animation.find('//:1/:2/:5').name).toEqual('index-5');
        expect(animation.findAll('//:1/:2/:5')[0].name).toEqual('index-5');

        expect(subRootElement.name).toEqual('sub-root');
        expect(animation.find('//root/:2').name).toEqual(subRootElement.name);
        expect(animation.findAll('//root/:2')[0].name).toEqual(subRootElement.name);

        expect(animation.find('//root/sub-root/:1')).toBe(searchForOne);
        expect(animation.findAll('//root/sub-root/:1')[0]).toBe(searchForOne);

        expect(animation.find('//root/sub-root/:4')).toBe(searchForTwo);
        expect(animation.findAll('//root/sub-root/:4')[0]).toBe(searchForTwo);

        expect(animation.find('//:1/sub-root/:1')).toBe(searchForOne);
        expect(animation.findAll('//:1/sub-root/:1')[0]).toBe(searchForOne);

        expect(animation.find('//:1/sub-root/:4')).toBe(searchForTwo);
        expect(animation.findAll('//:1/sub-root/:4')[0]).toBe(searchForTwo);

        expect(animation.find('//:1/:2/:1')).toBe(searchForOne);
        expect(animation.findAll('//:1/:2/:1')[0]).toBe(searchForOne);

        expect(animation.find('//:1/:2/:4')).toBe(searchForTwo);
        expect(animation.findAll('//:1/:2/:4')[0]).toBe(searchForTwo);

        expect(rootElement.find('/:2/:1')).toBe(searchForOne);
        expect(rootElement.findAll('/:2/:1')[0]).toBe(searchForOne);

        expect(rootElement.find('/:2/:4')).toBe(searchForTwo);
        expect(rootElement.findAll('/:2/:4')[0]).toBe(searchForTwo);

        expect(subRootElement.find('/:5').name).toEqual('index-5');
        expect(subRootElement.findAll('/:5')[0].name).toEqual('index-5');

        expect(subRootElement.find('/:7')).toBeNull();
        expect(subRootElement.findAll('/:7')).toBeEmpty();

    });

    it('searches properly inside scenes', function() {
        var animation = new anm.Animation();
        var sceneOne = animation.addScene('Scene One');
        var sceneTwo = animation.addScene('Scene Two');
        var sceneThree = animation.addScene(new anm.Scene(animation, 'Scene Three'));

        var inSceneOne = element('test');
        sceneOne.add(inSceneOne);

        expect(animation.find('test')).toBe(inSceneOne);
        expect(animation.find('/Scene One/test')).toBe(inSceneOne);
        expect(animation.findAll('/Scene One/test')[0]).toBe(inSceneOne);
        expect(animation.find('/Scene One/:0')).toBe(inSceneOne);
        expect(animation.findAll('/Scene One/:0')[0]).toBe(inSceneOne);

        var inSceneTwo = element('test');
        sceneTwo.add(inSceneTwo);
        expect(animation.findAll('test')[1]).toBe(inSceneTwo);
        expect(animation.find('/Scene Two/test')).toBe(inSceneTwo);
        expect(animation.findAll('/Scene Two/test')[0]).toBe(inSceneTwo);
        expect(animation.find('/Scene Two/:0')).toBe(inSceneTwo);
        expect(animation.findAll('/Scene Two/:0')[0]).toBe(inSceneTwo);

        var inSceneThree = element('test-foo');
        sceneThree.add(inSceneThree);
        expect(animation.find('test-foo')).toBe(inSceneThree);
        expect(animation.find('/Scene Three/test-foo')).toBe(inSceneThree);
        expect(animation.findAll('/Scene Three/test-foo')[0]).toBe(inSceneThree);
        expect(animation.find('/Scene Three/:0')).toBe(inSceneThree);
        expect(animation.findAll('/Scene Three/:0')[0]).toBe(inSceneThree);
    });

    it('searches properly inside replaced first scene', function() {
        var animation = new anm.Animation();
        var sceneTwo = animation.addScene('Scene Two');
        var anotherScene = new anm.Scene(null, 'Another Scene');

        animation.replaceScene(0, anotherScene);
        anotherScene.add(element('foobar'));
        expect(animation.find('foobar')).toBeDefined();
        expect(animation.findAll('foobar')).not.toBeEmpty();
    });

});
