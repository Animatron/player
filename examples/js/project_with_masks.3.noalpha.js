/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

var project_with_masks_3 = {
  "meta": {
    "id": "d849ed915680fa4752889963",
    "created": 1347890143460,
    "modified": 1347961233538,
    "author": "",
    "description": "",
    "name": "Mask Test 3",
    "copyright": "",
    "duration": 10.0,
    "numberOfScenes": 1
  },
  "data": {
    "swatches": [
      {
        "color": "#ffff00"
      },
      {
        "color": "#bfbf00"
      },
      {
        "color": "#aaff55"
      },
      {
        "color": "#00ff00"
      },
      {
        "color": "#55aaff"
      },
      {
        "color": "#ff55aa"
      }
    ]
  },
  "anim": {
    "dimension": [
      550.0,
      450.0
    ],
    "framerate": 24.0,
    "background": {
      "color": "white"
    },
    "elements": [
      {
        "id": "0f640bf863a9d619a675e201",
        "name": "Layer 2",
        "layers": [
          {
            "id": "265274dc13a280b317183ee0",
            "name": "Oval2",
            "band": [
              0.0,
              10.0
            ],
            "eid": "8d1735b4a55ad5dd48fd4b06",
            "tweens": [
              {
                "type": "Translate",
                "band": [
                  0.0,
                  10.0
                ],
                "path": "M-49.0 63.2 L-49.0 63.2 Z"
              }
            ],
            "visible": true,
            "outline": false,
            "locked": false,
            "outline-color": "blue",
            "dynamic": false,
            "reg": [
              50.0,
              50.5
            ],
            "opaque": false
          },
          {
            "id": "dc945337739cef2d00d6f39e",
            "name": "Oval1",
            "band": [
              0.0,
              10.0
            ],
            "eid": "598e5671b1a7d99f6dfe8e06",
            "tweens": [
              {
                "type": "Translate",
                "band": [
                  0.0,
                  10.0
                ],
                "path": "M9.0 -20.3 L9.0 -20.3 Z"
              }
            ],
            "visible": true,
            "outline": false,
            "locked": false,
            "outline-color": "magenta",
            "dynamic": false,
            "reg": [
              90.0,
              93.5
            ],
            "opaque": false
          }
        ],
        "on-end": "STOP"
      },
      {
        "id": "1fb7fbbe6d3144f1a4a0c705",
        "stroke": {
          "width": 2.0,
          "paint": {
            "color": "#3F4C6B"
          },
          "cap": "round",
          "join": "miter",
          "limit": 10.0
        },
        "fill": {
          "color": "#ffff00"
        },
        "path": "M0.0 0.0 L95.0 0.0 L95.0 84.0 L0.0 84.0 L0.0 0.0 Z",
        "round-rect": [
          0.0,
          0.0,
          0.0,
          0.0
        ]
      },
      {
        "id": "29971693c221cd57478bc103",
        "stroke": {
          "width": 2.0,
          "paint": {
            "color": "#3F4C6B"
          },
          "cap": "round",
          "join": "miter",
          "limit": 10.0
        },
        "fill": {
          "color": "#aaff55"
        },
        "path": "M63.0 353.0 C63.0 353.0 130.2 336.5 145.0 344.0 C159.7 351.4 169.1 386.2 142.0 393.0 C114.8 399.7 66.3 368.4 60.0 365.0 C53.6 361.5 63.0 353.0 63.0 353.0 M63.0 353.0 Z"
      },
      {
        "id": "598e5671b1a7d99f6dfe8e06",
        "stroke": {
          "width": 2.0,
          "paint": {
            "color": "#3F4C6B"
          },
          "cap": "round",
          "join": "miter",
          "limit": 10.0
        },
        "fill": {
          "color": "#ff55aa"
        },
        "path": "M0.0 93.5 C0.0 41.8 40.2 0.0 90.0 0.0 C139.7 0.0 180.0 41.8 180.0 93.5 C180.0 145.1 139.7 187.0 90.0 187.0 C40.2 187.0 0.0 145.1 0.0 93.5 Z"
      },
      {
        "id": "6d2b637ef4b1190898e9a102",
        "name": "Scene1",
        "layers": [
          {
            "id": "3326e35d12083f3feff6c4ba",
            "name": "Layer 5",
            "band": [
              0.0,
              10.0
            ],
            "eid": "29971693c221cd57478bc103",
            "tweens": [
              {
                "type": "Translate",
                "band": [
                  0.0,
                  10.0
                ],
                "path": "M209.0 292.0 L209.0 292.0 Z"
              }
            ],
            "visible": true,
            "outline": false,
            "locked": false,
            "outline-color": "black",
            "dynamic": false,
            "reg": [
              108.54420264394844,
              367.999114881614
            ],
            "opaque": false
          },
          {
            "id": "b3a48cd2549463db5e69baea",
            "name": "Layer 2",
            "band": [
              0.0,
              10.0
            ],
            "eid": "0f640bf863a9d619a675e201",
            "tweens": [
              {
                "type": "Translate",
                "band": [
                  0.0,
                  6.0
                ],
                "path": "M301.0 288.2 L75.0 131.0 Z"
              },
              {
                "type": "Translate",
                "band": [
                  6.0,
                  9.0
                ],
                "path": "M75.0 131.0 L161.0 178.0 Z"
              },
              {
                "type": "Translate",
                "band": [
                  9.0,
                  9.0
                ],
                "path": "M161.0 178.0 L211.0 196.0 Z"
              },
              {
                "type": "Translate",
                "band": [
                  9.0,
                  9.0
                ],
                "path": "M211.0 196.0 L238.0 215.0 Z"
              },
              {
                "type": "Translate",
                "band": [
                  9.0,
                  9.0
                ],
                "path": "M238.0 215.0 L238.0 214.0 Z"
              },
              {
                "type": "Translate",
                "band": [
                  9.0,
                  9.0
                ],
                "path": "M238.0 214.0 L239.0 214.0 Z"
              },
              {
                "type": "Translate",
                "band": [
                  9.0,
                  9.0
                ],
                "path": "M239.0 214.0 L285.0 224.0 Z"
              },
              {
                "type": "Translate",
                "band": [
                  9.0,
                  9.0
                ],
                "path": "M285.0 224.0 L326.0 242.0 Z"
              },
              {
                "type": "Translate",
                "band": [
                  9.0,
                  9.0
                ],
                "path": "M326.0 242.0 L348.0 255.0 Z"
              },
              {
                "type": "Translate",
                "band": [
                  9.0,
                  9.0
                ],
                "path": "M348.0 255.0 L359.0 254.0 Z"
              },
              {
                "type": "Translate",
                "band": [
                  9.0,
                  9.0
                ],
                "path": "M359.0 254.0 L359.0 252.0 Z"
              },
              {
                "type": "Translate",
                "band": [
                  9.0,
                  9.0
                ],
                "path": "M359.0 252.0 L359.0 250.0 Z"
              },
              {
                "type": "Translate",
                "band": [
                  9.0,
                  9.0
                ],
                "path": "M359.0 250.0 L359.0 248.0 Z"
              },
              {
                "type": "Translate",
                "band": [
                  9.0,
                  9.0
                ],
                "path": "M359.0 248.0 L384.0 196.0 Z"
              },
              {
                "type": "Translate",
                "band": [
                  9.0,
                  9.0
                ],
                "path": "M384.0 196.0 L385.0 196.0 Z"
              },
              {
                "type": "Translate",
                "band": [
                  9.0,
                  9.0
                ],
                "path": "M385.0 196.0 L384.0 196.0 Z"
              },
              {
                "type": "Translate",
                "band": [
                  9.0,
                  9.0
                ],
                "path": "M384.0 196.0 L384.0 187.0 Z"
              },
              {
                "type": "Translate",
                "band": [
                  9.0,
                  9.0
                ],
                "path": "M384.0 187.0 L383.0 187.0 Z"
              },
              {
                "type": "Translate",
                "band": [
                  9.0,
                  9.0
                ],
                "path": "M383.0 187.0 L383.0 186.0 Z"
              },
              {
                "type": "Translate",
                "band": [
                  9.0,
                  9.0
                ],
                "path": "M383.0 186.0 L383.0 178.0 Z"
              },
              {
                "type": "Translate",
                "band": [
                  9.0,
                  9.0
                ],
                "path": "M383.0 178.0 L384.0 178.0 Z"
              },
              {
                "type": "Translate",
                "band": [
                  9.0,
                  10.0
                ],
                "path": "M384.0 178.0 L384.0 178.0 Z"
              }
            ],
            "visible": true,
            "outline": false,
            "locked": true,
            "outline-color": "red",
            "dynamic": true,
            "reg": [
              0.0,
              0.0
            ],
            "opaque": false,
            "masked": 1.0
          },
          {
            "id": "bf1eb830034ae3e35595bde9",
            "name": "Layer 1",
            "band": [
              0.0,
              10.0
            ],
            "eid": "98cc5e55abffe490a24be601",
            "tweens": [
              {
                "type": "Translate",
                "band": [
                  0.0,
                  7.0
                ],
                "path": "M268.0 216.0 L211.0 182.0 Z"
              },
              {
                "type": "Translate",
                "band": [
                  7.0,
                  10.0
                ],
                "path": "M211.0 182.0 L211.0 182.0 Z"
              }
            ],
            "visible": true,
            "outline": false,
            "locked": false,
            "outline-color": "black",
            "dynamic": true,
            "reg": [
              0.0,
              0.0
            ],
            "opaque": false
          },
          {
            "id": "770702cb3838afc185906991",
            "name": "Layer 3",
            "band": [
              0.0,
              10.0
            ],
            "eid": "c3106058a1f74e1f1de54c03",
            "tweens": [
              {
                "type": "Translate",
                "band": [
                  0.0,
                  10.0
                ],
                "path": "M103.4 110.9 L103.4 110.9 Z"
              }
            ],
            "visible": true,
            "outline": false,
            "locked": false,
            "outline-color": "green",
            "dynamic": false,
            "reg": [
              282.0338526091691,
              149.85587147203012
            ],
            "opaque": false
          }
        ],
        "on-end": "STOP"
      },
      {
        "id": "82f8acba2026dc0a07b97d05",
        "stroke": {
          "width": 2.0,
          "paint": {
            "color": "#3F4C6B"
          },
          "cap": "round",
          "join": "miter",
          "limit": 10.0
        },
        "fill": {
          "color": "#55aaff"
        },
        "path": "M0.0 0.0 L210.0 0.0 L210.0 182.0 L0.0 182.0 L0.0 0.0 Z",
        "round-rect": [
          0.0,
          0.0,
          0.0,
          0.0
        ]
      },
      {
        "id": "8d1735b4a55ad5dd48fd4b06",
        "stroke": {
          "width": 2.0,
          "paint": {
            "color": "#3F4C6B"
          },
          "cap": "round",
          "join": "miter",
          "limit": 10.0
        },
        "fill": {
          "color": "#00ff00"
        },
        "path": "M0.0 50.5 C0.0 22.6 22.3 0.0 50.0 0.0 C77.6 0.0 100.0 22.6 100.0 50.5 C100.0 78.3 77.6 101.0 50.0 101.0 C22.3 101.0 0.0 78.3 0.0 50.5 Z"
      },
      {
        "id": "98cc5e55abffe490a24be601",
        "name": "Layer 1",
        "layers": [
          {
            "id": "20e6ea03eb13d7f89185880c",
            "name": "Rectangle2",
            "band": [
              0.0,
              10.0
            ],
            "eid": "1fb7fbbe6d3144f1a4a0c705",
            "tweens": [
              {
                "type": "Translate",
                "band": [
                  0.0,
                  10.0
                ],
                "path": "M87.7 -59.5 L87.7 -59.5 Z"
              }
            ],
            "visible": true,
            "outline": false,
            "locked": false,
            "outline-color": "brown",
            "dynamic": false,
            "reg": [
              47.5,
              42.0
            ],
            "opaque": false
          },
          {
            "id": "3537985c619a5640cb7f6d8d",
            "name": "Rectangle1",
            "band": [
              0.0,
              10.0
            ],
            "eid": "82f8acba2026dc0a07b97d05",
            "tweens": [
              {
                "type": "Translate",
                "band": [
                  0.0,
                  10.0
                ],
                "path": "M-30.3 10.5 L-30.3 10.5 Z"
              }
            ],
            "visible": true,
            "outline": false,
            "locked": false,
            "outline-color": "yellow",
            "dynamic": false,
            "reg": [
              105.0,
              91.0
            ],
            "opaque": false
          }
        ],
        "on-end": "STOP"
      },
      {
        "id": "c3106058a1f74e1f1de54c03",
        "stroke": {
          "width": 2.0,
          "paint": {
            "color": "#3F4C6B"
          },
          "cap": "round",
          "join": "miter",
          "limit": 10.0
        },
        "fill": {
          "color": "#aaff55"
        },
        "path": "M307.0 152.8 C307.0 152.8 283.5 99.4 259.2 103.0 C235.0 106.5 200.3 141.3 215.0 166.3 C229.6 191.3 290.8 188.0 311.0 191.5 C331.3 195.1 353.9 202.0 352.4 190.4 C350.9 178.8 307.0 152.8 307.0 152.8 M307.0 152.8 Z"
      }
    ],
    "scenes": [
      "6d2b637ef4b1190898e9a102"
    ]
  }
}