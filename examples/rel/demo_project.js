/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 */

var demo_project =

{
  "meta": {
    "id": "4f8858d7e4b04a1e87bc594f",
    "name": "Demo Project",
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
        "id": "09cedc776e4a54eefcdd6e01",
        "name": "Clip Inner (-> Symbols)",
        "layers": [
          {
            "id": "879d36b4f09df7f7203bff77",
            "name": "Symbols (-> Red Rect)",
            "band": [
              0.0,
              15.0
            ],
            "eid": "327b030d6327d1949f870105", // red rect with blue stroke
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
        "id": "327b030d6327d1949f870105",
        "name": "Red Rect",
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
      },
      {
        "id": "4c8228d3d14989df372de908",
        "name": "Image",
        "url": "http://madeira.hccanet.org/project2/michels_p2/website%20pics/bender.jpg"
      },
      {
        "id": "5ad5ab877ee801de216b9b02",
        "name": "Scene1 (-> Rectangle 2)",
        "layers": [
          {
            "id": "ae3b5a34344e9d871e7dd15f",
            "name": "Rectangle 2 (-> Blue Rect)",
            "band": [
              1.0,
              11.0
            ],
            "eid": "98e475d8fc0a29c048842c05", // blue rect with green stroke
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
                ],
                "easing": {
                  "name": "Ease In Out"
                }
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
            "id": "1061791940f0a56a760464a0",
            "name": "Clip Outer (-> Clip Inner)",
            "band": [
              0.0,
              15.0
            ],
            "eid": "09cedc776e4a54eefcdd6e01", // clip with red rect
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
            "id": "125527da6599db0ed5008604",
            "name": "Image",
            "band": [
              0.0,
              20.0
            ],
            "eid": "4c8228d3d14989df372de908", // bender image
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
        "id": "98e475d8fc0a29c048842c05",
        "name": "Blue Rect",
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
      }
    ],
    "scenes": [
      "5ad5ab877ee801de216b9b02"
    ]
  }
};