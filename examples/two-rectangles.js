var b = Builder._$;

var scene = b().add(b('blue-rect').rect([140, 25], [70, 70])
                                  .fill('#009')
                                  .stroke('#f00', 3))
               .add(b('red-rect').rect([115, 90], [60, 60]))
                                 .rotate([0, 10], [0, Math.PI]);

createPlayer('my-canvas').load(scene);