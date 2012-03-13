/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 */

var demo_project =
{
  "meta": {
    "id": "4f3be1cc0364baf847969bc3",
    "title": "New Test Project",
    "author": "",
    "copyright": "",
    "version": 0.1,
    "description": ""
  },
  "anim": {
    "dimension": [ 500, 350 ],
    "framerate": 24,
    "background": {
      "color": "white"
    },
    "elements": [
      {
        "id": "0a34fb66b6d42d193574c002",
        "name": "Scene1",
        "layers": [
          {
            "id": "e05b27fd231579dc9aef7f0f",
            "name": "Rectangle",
            "band": [ 1, 11 ],
            "eid": "0e9bbfce6be43efd045ad305",
            "tweens": [
              {
                "type": "Alpha",
                "band": [ 0, 2 ],
                "data": [ 0, 1 ]
              },
              {
                "type": "Alpha",
                "band": [ 2, 8 ],
                "data": [ 1, 1 ]
              },
              {
                "type": "Alpha",
                "band": [ 8, 10 ],
                "data": [ 1, 0 ]
              },
              {
                "type": "rotate-to-path",
                "band": [ 0, 10 ]
              },
              {
                "type": "Scale",
                "band": [ 0, 1 ],
                "data": [ 0.2, 0.2, 1, 1 ]
              },
              {
                "type": "Scale",
                "band": [ 1, 5 ],
                "data": [ 1, 1, 2, 2 ]
              },
              {
                "type": "Scale",
                "band": [ 5, 10 ],
                "data": [ 2, 2, 1, 1 ]
              },
              {
                "type": "Translate",
                "band": [ 0, 10 ],
                "easing": {
                  "name": "Ease In Out"
                },
                "path": "M0.0 100.0 C150.0 0.0 150.0 30.0 200.0 30.0 C250.0 30.0 400.0 50.0 400.0 100.0 C400.0 150.0 250.0 300.0 200.0 300.0 C150.0 300.0 160.0 100.0 0.0 100.0 Z"
              }
            ],
            "visible": true,
            "outline": false,
            "locked": false,
            "outline-color": "red",
            "dynamic": false,
            "reg": [ 25, 50 ],
            "opaque": false
          },
          {
            "id": "759ef7d8f556138fda4d50e4",
            "name": "Clip",
            "band": [ 0, 15 ],
            "eid": "5e66749a5369efe8a97c9801",
            "tweens": [
              {
                "type": "Translate",
                "band": [ 0, 15 ],
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
            "outline-color": "green",
            "dynamic": false,
            "reg": [ 0, 0 ],
            "opaque": false
          },
          {
            "id": "246ff07427846bd43ce4c49c",
            "name": "Image",
            "band": [ 0, 20 ],
            "eid": "47b7c4b4dfa6a2d7b7673108",
            "tweens": [
              
            ],
            "visible": true,
            "outline": false,
            "locked": false,
            "outline-color": "black",
            "dynamic": false,
            "reg": [ 0, 0 ],
            "opaque": false
          }
        ],
        "on-end": "STOP"
      },
      {
        "id": "0c1fccc618de214b74401005",
        "stroke": {
          "width": 4,
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
        "id": "0e9bbfce6be43efd045ad305",
        "stroke": {
          "width": 4,
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
        "id": "47b7c4b4dfa6a2d7b7673108",
        "url": "http://madeira.hccanet.org/project2/michels_p2/website%20pics/bender.jpg"
      },
      {
        "id": "5e66749a5369efe8a97c9801",
        "name": "Clip",
        "layers": [
          {
            "id": "bf5a00bd9403d543453a6adb",
            "name": "Symbols",
            "band": [ 0, 15 ],
            "eid": "0c1fccc618de214b74401005",
            "tweens": [
              {
                "type": "Alpha",
                "band": [ 0, 15 ],
                "data": [ 1, 0 ]
              },
              {
                "type": "Rotate",
                "band": [ 0, 15 ],
                "data": [ 0, 6.283185307179586 ]
              },
              {
                "type": "Translate",
                "band": [ 0, 15 ],
                "path": "M0.0 0.0 L0.0 0.0 Z"
              }
            ],
            "visible": true,
            "outline": false,
            "locked": false,
            "outline-color": "blue",
            "dynamic": false,
            "reg": [ 50, 50 ],
            "opaque": false
          }
        ],
        "on-end": "STOP"
      }
    ],
    "scenes": [
      "0a34fb66b6d42d193574c002"
    ]
  }
};