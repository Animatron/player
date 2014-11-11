var theme = {
  'font': {
      'face': 'Arial, sans-serif',
      'weight': 'bold',
      'timesize': 13.5,
      'statussize': 8.5,
      'infosize_a': 10,
      'infosize_b': 8
  },
  'radius': { // all radius values are relative to (Math.min(width, height) / 2)
      'inner': .25,
      'outer': .28,
      'loader': .25,
      'buttonv': .15, // height of a button
      'buttonh': .14, // width of a button
      'time': .5, // time text position
      'status': .8, // info text position
      'substatus': .9
  },
  'width': { // stroke width
      'inner': 5, // button stroke
      'outer': 3, // progress stroke
      'button': 7 // button stroke
  },
  'statuslimit': 40, // maximum length of status line
  'join': {
      'button': 'round' // join for button stroke
  },
  'colors': {
      /* 'bggrad': { // back gradient start is at (0.1 * Math.max(width/height))
                  // and end is at (1.0 * Math.max(width/height))
          //'start': 'rgba(30,30,30,.7)',
          //'end': 'rgba(30,30,30,1)'
          //'start': 'rgba(30,30,30,.20)', // fefbf2
          //'end': 'rgba(30,30,30,.05)' // eae5d8
          'start': 'rgba(234,229,216,.8)',
          'end': 'rgba(234,229,216,.8)'
      }, */
      'bggrad': [ // back gradient start is at (0.1 * Math.max(width/height))
                  // and end is at (1.0 * Math.max(width/height))
          [ .2,  .2 ],  // [ stop position, alpha ]
          [ .24, .15 ], // [ stop position, alpha ]
          [ .27, .1 ], // [ stop position, alpha ]
          [ .4, 0 ]    // [ stop position, alpha ]
      ],
      'progress': {
          //'passed': 'rgba(0,0,0,.05)',
          //'left': 'rgba(255,255,255,1)'
          //'passed': 'rgba(50,158,192,.85)',
          //'passed': 'rgba(203,86,49,1)',
          'passed': 'rgba(241,91,42,1.0)',
          'left': 'rgba(255,255,255,1)'
      },
      //'button': 'rgba(180,180,180,.85)',
      'button': 'rgba(50,158,192,1)',
      //'stroke': 'rgba(180,180,180,.85)'
      'stroke': 'rgba(50,158,192,.85)',
      'fill': 'rgba(255,255,255,1)',
      'hoverfill': 'rgba(255,255,255,1)',
      'disabledfill': 'rgba(124,30,30,0)',
      'text': 'rgba(50,158,192,.85)',
      'error': 'rgba(250,0,0,.8)',
      'infobg': 'rgba(128,0,0,.8)',
      'secondary': 'rgba(255,255,255,.6)'
  },
  'anmguy': {
      'colors': [ 'rgba(65,61,62,1)', // black
                  'rgba(241,91,42,1)' // orange
                ],
      'center_pos': [ .5, .8 ],
      'corner_pos': [ .825, .9692 ],
      //'corner_pos': [ .77, .9692 ],
      'copy_pos': [ .917, .98 ],
      //'copy_pos': [ .89, .98 ],
      'center_alpha': 1,
      'corner_alpha': .3,
      'center_scale': .07,
      'corner_scale': .04 // relatively to minimum side
  }
};

module.exports = theme;
