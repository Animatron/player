/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 */

var demo_project =
{
  "meta": {
    "id": "4ef34b9903640fa60d0a526e",
    "title": "New Test Project",
    "author": "",
    "copyright": "",
    "version": 0.1,
    "description": ""
  },
  "anim": {
    "dimension": [ 500.0, 350.0 ],
    "framerate": 24.0,
    "background": {
      "color": "white"
    },
    "elements": [
      {
        "id": "5a6f15897c4163d22365e902",
        "name": "Scene1",
        "layers": [
          {
            "id": "3467c07abe84a53fe94b380a",
            "name": "Rectangle",
            "band": [ 1.0, 11.0 ],
            "eid": "9df8f651d89cbe3546b5b105",
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
            "outline-color": "brown",
            "reg": [ 25.0, 50.0 ]
          },
          {
            "id": "cb67e58278d1e69c138fabca",
            "name": "Clip",
            "band": [ 0.0, 15.0 ],
            "eid": "9627fb0f3db1350befafb001",
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
            "outline-color": "magenta"
          },
          {
            "id": "bd1cb1f1d9fee9af6698724b",
            "name": "Image",
            "band": [ 0.0, 20.0 ],
            "eid": "a514a90689aabcc0a73f2808",
            "tweens": [ // added manually
              {
                "type": "Alpha",
                "band": [ 0.0, 15.0 ],
                "data": [ 0.0, 1.0 ]
              }
            ],
            "outline-color": "red"
          }
        ]
      },
      {
        "id": "9413dd388d0d9ead55a30d05",
        "stroke": {
          "width": 4.0,
          "paint": { "color": "blue" },
          "cap": "round",
          "join": "round"
        },
        "fill": {
          "color": "red"
        },
        "path": "M0.0 0.0 L100.0 0.0 L100.0 100.0 L0.0 100.0 L0.0 0.0 Z"
      },
      {
        "id": "9627fb0f3db1350befafb001",
        "name": "Clip",
        "layers": [
          {
            "id": "4f2be78e2e67908890de998c",
            "name": "Symbols",
            "band": [ 0.0, 15.0 ],
            "eid": "9413dd388d0d9ead55a30d05",
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
                "path": "M0.0 0.0 L200.0 200.0 Z"
              }
            ],
            "outline-color": "yellow",
            "reg": [ 50.0, 50.0 ]
          }
        ]
      },
      {
        "id": "9df8f651d89cbe3546b5b105",
        "stroke": {
          "width": 4.0,
          "paint": { "color": "green" },
          "cap": "round",
          "join": "round"
        },
        "fill": {
          "color": "blue"
        },
        "path": "M0.0 0.0 L50.0 0.0 L50.0 50.0 L0.0 50.0 L0.0 0.0 Z"
      },
      {
        "id": "a514a90689aabcc0a73f2808",
        "url": "http://madeira.hccanet.org/project2/michels_p2/website%20pics/bender.jpg"
      }
    ],
    "scenes": [
      "5a6f15897c4163d22365e902"
    ]
  }
};