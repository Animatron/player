/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 */

var demo_project =

{
  "meta": {
    "id": "4f8418e0e4b090cf1f8349c0",
    "title": "New Test Project",
    "author": "",
    "copyright": "",
    "version": 0.1,
    "description": ""
  },
  "anim": {
    "dimension": [
      500.0,
      350.0
    ],
    "framerate": 24.0,
    "background": null,
    "elements": [
      {
        "id": "1628345c04dad28e06997f01",
        "name": "Clip",
        "layers": [
          {
            "id": "9720b87d611f2435f134171a",
            "name": "Symbols",
            "band": [
              0.0,
              15.0
            ],
            "eid": "f4c3a7461a3d9c6562f46c05",
            "tweens": [
              {
                "type": "Alpha",
                "band": [
                  0.0,
                  15.0
                ],
                "data": [
                  1.0,
                  0.0
                ]
              },
              {
                "type": "Rotate",
                "band": [
                  0.0,
                  15.0
                ],
                "data": [
                  0.0,
                  6.283185307179586
                ]
              },
              {
                "type": "Translate",
                "band": [
                  0.0,
                  15.0
                ],
                "path": "M0.0 0.0 L0.0 0.0 Z"
              }
            ],
            "visible": true,
            "outline": false,
            "locked": false,
            "outline-color": "yellow",
            "dynamic": false,
            "reg": [
              50.0,
              50.0
            ],
            "opaque": false
          }
        ],
        "on-end": "STOP"
      },
      {
        "id": "1687e73b15cd387014572808",
        "url": "http://madeira.hccanet.org/project2/michels_p2/website%20pics/bender.jpg"
      },
      {
        "id": "a6748a7a0f5d1a56e038e402",
        "name": "Scene1",
        "layers": [
          {
            "id": "6636fe33d512fecefb372e45",
            "name": "Rectangle",
            "band": [
              1.0,
              11.0
            ],
            "eid": "da628458895559c637781605",
            "tweens": [
              {
                "type": "Alpha",
                "band": [
                  0.0,
                  2.0
                ],
                "data": [
                  0.0,
                  1.0
                ]
              },
              {
                "type": "Alpha",
                "band": [
                  2.0,
                  8.0
                ],
                "data": [
                  1.0,
                  1.0
                ]
              },
              {
                "type": "Alpha",
                "band": [
                  8.0,
                  10.0
                ],
                "data": [
                  1.0,
                  0.0
                ]
              },
              {
                "type": "rotate-to-path",
                "band": [
                  0.0,
                  10.0
                ]
              },
              {
                "type": "Scale",
                "band": [
                  0.0,
                  1.0
                ],
                "data": [
                  0.2,
                  0.2,
                  1.0,
                  1.0
                ]
              },
              {
                "type": "Scale",
                "band": [
                  1.0,
                  5.0
                ],
                "data": [
                  1.0,
                  1.0,
                  2.0,
                  2.0
                ]
              },
              {
                "type": "Scale",
                "band": [
                  5.0,
                  10.0
                ],
                "data": [
                  2.0,
                  2.0,
                  1.0,
                  1.0
                ]
              },
              {
                "type": "Translate",
                "band": [
                  0.0,
                  10.0
                ],
                "easing": {
                  "name": "Ease In Out"
                },
                "path": "M0.0 100.0 C150.0 0.0 150.0 30.0 200.0 30.0 C250.0 30.0 400.0 50.0 400.0 100.0 C400.0 150.0 250.0 300.0 200.0 300.0 C150.0 300.0 160.0 100.0 0.0 100.0 Z"
              }
            ],
            "visible": true,
            "outline": false,
            "locked": false,
            "outline-color": "brown",
            "dynamic": false,
            "reg": [
              25.0,
              50.0
            ],
            "opaque": false
          },
          {
            "id": "1ea33768c9f0d924bc2b30ed",
            "name": "Clip",
            "band": [
              0.0,
              15.0
            ],
            "eid": "1628345c04dad28e06997f01",
            "tweens": [
              {
                "type": "Translate",
                "band": [
                  0.0,
                  15.0
                ],
                "easing": {
                  "name": "Unknown",
                  "path": "C0.0 1.0 1.0 0.0 1.0 1.0"
                },
                "path": "M0.0 0.0 L300.0 300.0 Z"
              }
            ],
            "visible": true,
            "outline": false,
            "locked": false,
            "outline-color": "magenta",
            "dynamic": false,
            "reg": [
              0.0,
              0.0
            ],
            "opaque": false
          },
          {
            "id": "0c5f53f63a869a9d73e0be06",
            "name": "Image",
            "band": [
              0.0,
              20.0
            ],
            "eid": "1687e73b15cd387014572808",
            "tweens": [
              
            ],
            "visible": true,
            "outline": false,
            "locked": false,
            "outline-color": "red",
            "dynamic": false,
            "reg": [
              0.0,
              0.0
            ],
            "opaque": false
          }
        ],
        "on-end": "STOP"
      },
      {
        "id": "da628458895559c637781605",
        "stroke": {
          "width": 4.0,
          "paint": {
            "color": "green"
          },
          "cap": "round",
          "join": "round"
        },
        "fill": {
          "color": "blue"
        },
        "path": "M0.0 0.0 L50.0 0.0 L50.0 50.0 L0.0 50.0 L0.0 0.0 Z"
      },
      {
        "id": "f4c3a7461a3d9c6562f46c05",
        "stroke": {
          "width": 4.0,
          "paint": {
            "color": "blue"
          },
          "cap": "round",
          "join": "round"
        },
        "fill": {
          "color": "red"
        },
        "path": "M0.0 0.0 L100.0 0.0 L100.0 100.0 L0.0 100.0 L0.0 0.0 Z"
      }
    ],
    "scenes": [
      "a6748a7a0f5d1a56e038e402"
    ]
  }
}