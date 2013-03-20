/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 */

var rectangles_project =

{
  "meta": {
    "id": "4f7f3ae5e4b03d3f4a824292",
    "title": "ANM-286",
    "author": "",
    "copyright": "",
    "version": 0.1,
    "description": "",
    "modificationTime": "2012-04-10T15:06:12.246Z",
    "duration": 10.0
  },
  "anim": {
    "dimension": [
      500.0,
      350.0
    ],
    "framerate": 24.0,
    "background": { "color": "#ff0" },
    "elements": [
      {
        "id": "1642011daa58f4e5bc4aec02",
        "name": "Scene1",
        "layers": [
          {
            "id": "44f8e7cef437aef4b85dfa9d",
            "name": "Rectangle1",
            "band": [
              0.0,
              6.5
            ],
            "eid": "fc90c18525ae0d02a90f0501",
            "tweens": [
              {
                "type": "Rotate",
                "band": [
                  0.0,
                  1.1
                ],
                "data": [
                  0.0,
                  3.12450030119203
                ]
              },
              {
                "type": "Rotate",
                "band": [
                  1.1,
                  2.7
                ],
                "data": [
                  3.12450030119203,
                  6.0135386790037595
                ]
              },
              {
                "type": "Rotate",
                "band": [
                  2.7,
                  6.5
                ],
                "data": [
                  6.0135386790037595,
                  28.816741163245602
                ]
              },
              {
                "type": "Scale",
                "band": [
                  0.0,
                  1.1
                ],
                "data": [
                  1.0,
                  1.0,
                  1.7016394477182755,
                  11.584961189166062
                ]
              },
              {
                "type": "Scale",
                "band": [
                  1.1,
                  2.9
                ],
                "data": [
                  1.7016394477182755,
                  11.584961189166062,
                  0.7981680884824883,
                  0.41502446091155926
                ]
              },
              {
                "type": "Scale",
                "band": [
                  2.9,
                  6.5
                ],
                "data": [
                  0.7981680884824883,
                  0.41502446091155926,
                  0.13526400947604508,
                  11.934243064978016
                ]
              },
              {
                "type": "Translate",
                "band": [
                  0.0,
                  6.5
                ],
                "path": "M379.0 287.5 L379.0 287.5 Z"
              }
            ],
            "visible": true,
            "outline": false,
            "locked": false,
            "outline-color": "brown",
            "dynamic": true,
            "reg": [
              160.0,
              22.5
            ],
            "opaque": false
          },
          {
            "id": "52f2368468996bf22e2e57f3",
            "name": "Rectangle2",
            "band": [
              0.0,
              10.0
            ],
            "eid": "8ca3189cf8ff9f828b082f01",
            "tweens": [
              {
                "type": "Translate",
                "band": [
                  0.0,
                  10.0
                ],
                "path": "M390.0 129.5 L390.0 129.5 Z"
              }
            ],
            "visible": true,
            "outline": false,
            "locked": false,
            "outline-color": "green",
            "dynamic": false,
            "reg": [
              86.0,
              53.5
            ],
            "opaque": false
          }
        ],
        "on-end": "STOP"
      },
      {
        "id": "2921cc15a44926ed91907d05",
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
          "color": "#6BBA70"
        },
        "path": "M0.0 0.0 L172.0 0.0 L172.0 107.0 L0.0 107.0 L0.0 0.0 Z",
        "round-rect": [
          0.0,
          0.0,
          0.0,
          0.0
        ]
      },
      {
        "id": "8ca3189cf8ff9f828b082f01",
        "name": "Rectangle2",
        "layers": [
          {
            "id": "b1d0740a39e8f0a35212542c",
            "band": [
              0.0,
              10.0
            ],
            "eid": "2921cc15a44926ed91907d05",
            "tweens": [
              {
                "type": "Translate",
                "band": [
                  0.0,
                  10.0
                ],
                "path": "M-135.0 -62.0 L-135.0 -62.0 Z"
              }
            ],
            "visible": true,
            "outline": false,
            "locked": false,
            "outline-color": "black",
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
        "id": "d304442faed4b15bc9105705",
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
          "color": "#6BBA70"
        },
        "path": "M0.0 0.0 L320.0 0.0 L320.0 45.0 L0.0 45.0 L0.0 0.0 Z",
        "round-rect": [
          0.0,
          0.0,
          0.0,
          0.0
        ]
      },
      {
        "id": "fc90c18525ae0d02a90f0501",
        "name": "Rectangle1",
        "layers": [
          {
            "id": "dd2e3cda1039c0835a692fef",
            "band": [
              0.0,
              10.0
            ],
            "eid": "d304442faed4b15bc9105705",
            "tweens": [

            ],
            "visible": true,
            "outline": false,
            "locked": false,
            "outline-color": "yellow",
            "dynamic": false,
            "reg": [
              0.0,
              0.0
            ],
            "opaque": false
          }
        ],
        "on-end": "STOP"
      }
    ],
    "scenes": [
      "1642011daa58f4e5bc4aec02"
    ]
  }
};