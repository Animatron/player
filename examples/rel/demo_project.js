/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 */

var demo_project =
{
  "meta": {
    "id": "4f705f5903641fab932dab3e",
    "title": "New Test Project",
    "author": "",
    "copyright": "",
    "version": 0.1,
    "description": ""
  },
  "anim": {
    "dimension": [ 500.0, 350.0 ],
    "framerate": 24.0,
    "background": null,
    "elements": [
      {
        "id": "3a339a29dbf3935b00aeb305",
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
        "id": "622d17b368f7b6cd83a81701",
        "name": "Clip",
        "layers": [
          {
            "id": "bca11dc31dff8bc4d49e5b16",
            "name": "Symbols",
            "band": [
              0.0,
              15.0
            ],
            "eid": "c2e5878fb29cb389240b1105",
            "tweens": [
              {
                "type": "Alpha",
                "band": [ 0.0, 15.0 ],
                "data": [ 1.0, 0.0 ]
              },
              {
                "type": "Rotate",
                "band": [ 0.0, 15.0 ],
                "data": [ 0.0, 6.283185307179586 ]
              },
              {
                "type": "Translate",
                "band": [ 0.0, 15.0 ],
                "path": "M0.0 0.0 L0.0 0.0 Z"
              }
            ],
            "visible": true,
            "outline": false,
            "locked": false,
            "outline-color": "black",
            "dynamic": false,
            "reg": [ 50.0, 50.0 ],
            "opaque": false
          }
        ],
        "on-end": "STOP"
      },
      {
        "id": "6c1f751d94610ae083ba0808",
        "url": "http://madeira.hccanet.org/project2/michels_p2/website%20pics/bender.jpg"
      },
      {
        "id": "bb5c400c3c14e81781bf5a02",
        "name": "Scene1",
        "layers": [
          {
            "id": "e723b2a67838bdc8b383acc1",
            "name": "Rectangle",
            "band": [ 1.0, 11.0 ],
            "eid": "3a339a29dbf3935b00aeb305",
            "tweens": [
              {
                "type": "Alpha",
                "band": [ 0.0, 2.0 ],
                "data": [ 0.0, 1.0 ]
              },
              {
                "type": "Alpha",
                "band": [ 2.0, 8.0 ],
                "data": [ 1.0, 1.0 ]
              },
              {
                "type": "Alpha",
                "band": [ 8.0, 10.0 ],
                "data": [ 1.0, 0.0 ]
              },
              {
                "type": "rotate-to-path",
                "band": [ 0.0, 10.0 ]
              },
              {
                "type": "Scale",
                "band": [ 0.0, 1.0 ],
                "data": [ 0.2, 0.2, 1.0, 1.0 ]
              },
              {
                "type": "Scale",
                "band": [ 1.0, 5.0 ],
                "data": [ 1.0, 1.0, 2.0, 2.0 ]
              },
              {
                "type": "Scale",
                "band": [ 5.0, 10.0 ],
                "data": [ 2.0, 2.0, 1.0, 1.0 ]
              },
              {
                "type": "Translate",
                "band": [ 0.0, 10.0 ],
                "easing": {
                  "name": "Ease In Out"
                },
                "path": "M0.0 100.0 C150.0 0.0 150.0 30.0 200.0 30.0 C250.0 30.0 400.0 50.0 400.0 100.0 C400.0 150.0 250.0 300.0 200.0 300.0 C150.0 300.0 160.0 100.0 0.0 100.0 Z"
              }
            ],
            "visible": true,
            "outline": false,
            "locked": false,
            "outline-color": "green",
            "dynamic": false,
            "reg": [ 25.0, 50.0 ],
            "opaque": false
          },
          {
            "id": "06fdcb53e9ce1d97e1db60de",
            "name": "Clip",
            "band": [ 0.0, 15.0 ],
            "eid": "622d17b368f7b6cd83a81701",
            "tweens": [
              {
                "type": "Translate",
                "band": [ 0.0, 15.0 ],
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
            "outline-color": "brown",
            "dynamic": false,
            "reg": [ 0.0, 0.0 ],
            "opaque": false
          },
          {
            "id": "95a6a75649eb6b931b1f247d",
            "name": "Image",
            "band": [ 0.0, 20.0 ],
            "eid": "6c1f751d94610ae083ba0808",
            "tweens": [
              
            ],
            "visible": true,
            "outline": false,
            "locked": false,
            "outline-color": "yellow",
            "dynamic": false,
            "reg": [ 0.0, 0.0 ],
            "opaque": false
          }
        ],
        "on-end": "STOP"
      },
      {
        "id": "c2e5878fb29cb389240b1105",
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
      "bb5c400c3c14e81781bf5a02"
    ]
  }
};