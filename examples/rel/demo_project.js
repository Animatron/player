/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 */

var demo_project = 

{
  "meta": {
    "id": "4f844f21036421a8e902c819",
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
        "id": "40f7e8ed99489e96da036405",
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
        "id": "5dc72cc6f3b7a88bc7464008",
        "url": "http://madeira.hccanet.org/project2/michels_p2/website%20pics/bender.jpg"
      },
      {
        "id": "6ae5fa9245294ab9620b8602",
        "name": "Scene1",
        "layers": [
          {
            "id": "7960e8f665c981b1ffde285d",
            "name": "Rectangle",
            "band": [
              1.0,
              11.0
            ],
            "eid": "40f7e8ed99489e96da036405",
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
            "id": "786b838925ce150e1bef8c1d",
            "name": "Clip",
            "band": [
              0.0,
              15.0
            ],
            "eid": "c7ddcab08117ca384a7bbb01",
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
            "id": "d8b56039ebdc62ae07e34f9d",
            "name": "Image",
            "band": [
              0.0,
              20.0
            ],
            "eid": "5dc72cc6f3b7a88bc7464008",
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
        "id": "c7ddcab08117ca384a7bbb01",
        "name": "Clip",
        "layers": [
          {
            "id": "860df1bd8615dc9f68969aaf",
            "name": "Symbols",
            "band": [
              0.0,
              15.0
            ],
            "eid": "dda0b341680ace349063ac05",
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
        "id": "dda0b341680ace349063ac05",
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
      "6ae5fa9245294ab9620b8602"
    ]
  }
}