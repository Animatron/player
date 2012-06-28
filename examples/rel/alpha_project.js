var alpha_project = {
  "meta": {
	"id": "4fc76da2da0605201971d875",
	"title": "New Project",
	"author": "",
	"copyright": "",
	"version": 0.1,
	"description": "",
	"modified": 1338470780112,
	"created": 1338469794333
  },
  "anim": {
	"dimension": [
	  500.0,
	  350.0
	],
	"framerate": 24.0,
	"background": {
	  "color": "#ffffaa",
	  "alpha": 0.35
	},
	"elements": [
	  {
		"id": "0b9ae2ff13ad25320012d605",
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
		  "color": "#55aaff",
		  "alpha": 0.7
		},
		"path": "M0.0 0.0 L200.0 0.0 L200.0 199.0 L0.0 199.0 L0.0 0.0 Z",
		"round-rect": [
		  0.0,
		  0.0,
		  0.0,
		  0.0
		]
	  },
	  {
		"id": "4de01c7571b4fdfa5078b806",
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
		"path": "M0.0 49.0 C0.0 21.9 27.7 0.0 62.0 0.0 C96.2 0.0 124.0 21.9 124.0 49.0 C124.0 76.0 96.2 98.0 62.0 98.0 C27.7 98.0 0.0 76.0 0.0 49.0 Z"
	  },
	  {
		"id": "6ebfa9313830e5f6d6a42d02",
		"name": "Scene1",
		"layers": [
		  {
			"id": "af6a289392adf28ab7721139",
			"name": "Rectangle1",
			"band": [
			  0.0,
			  10.0
			],
			"eid": "0b9ae2ff13ad25320012d605",
			"tweens": [
			  {
				"type": "Alpha",
				"band": [
				  0.0,
				  10.0
				],
				"data": [
				  0.94,
				  0.94
				]
			  },
			  {
				"type": "Translate",
				"band": [
				  0.0,
				  10.0
				],
				"path": "M268.0 226.0 L268.0 226.0 Z"
			  }
			],
			"visible": true,
			"outline": false,
			"locked": false,
			"outline-color": "blue",
			"dynamic": false,
			"reg": [
			  100.0,
			  99.5
			],
			"opaque": false
		  },
		  {
			"id": "d45ca9e1f9309b1c3f19ea29",
			"name": "Oval1",
			"band": [
			  0.0,
			  10.0
			],
			"eid": "4de01c7571b4fdfa5078b806",
			"tweens": [
			  {
				"type": "Translate",
				"band": [
				  0.0,
				  10.0
				],
				"path": "M169.0 146.0 L169.0 146.0 Z"
			  }
			],
			"visible": true,
			"outline": false,
			"locked": false,
			"outline-color": "red",
			"dynamic": false,
			"reg": [
			  62.0,
			  49.0
			],
			"opaque": false
		  },
		  {
			"id": "30b1ae0bb3a1584b5ea56dbd",
			"name": "Oval2",
			"band": [
			  3.2,
			  10.0
			],
			"eid": "b30b4de343b17aeda90fe601",
			"tweens": [
			  {
				"type": "Alpha",
				"band": [
				  0.0,
				  6.8
				],
				"data": [
				  1.0,
				  0.0
				]
			  },
			  {
				"type": "Translate",
				"band": [
				  0.0,
				  6.8
				],
				"path": "M46.0 303.0 L437.0 75.0 Z"
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
		  }
		],
		"on-end": "STOP"
	  },
	  {
		"id": "b30b4de343b17aeda90fe601",
		"name": "Oval2",
		"layers": [
		  {
			"id": "8d4469d07231ddd24b54a212",
			"name": "cda1",
			"band": [
			  0.0,
			  10.0
			],
			"eid": "cda1f4646d51efb50a7f0806",
			"tweens": [

			],
			"visible": true,
			"outline": false,
			"locked": false,
			"outline-color": "brown",
			"dynamic": false,
			"reg": [
			  24.0,
			  22.5
			],
			"opaque": false
		  }
		],
		"on-end": "STOP"
	  },
	  {
		"id": "cda1f4646d51efb50a7f0806",
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
		"path": "M0.0 22.5 C0.0 10.0 10.7 0.0 24.0 0.0 C37.2 0.0 48.0 10.0 48.0 22.5 C48.0 34.9 37.2 45.0 24.0 45.0 C10.7 45.0 0.0 34.9 0.0 22.5 Z"
	  }
	],
	"scenes": [
	  "6ebfa9313830e5f6d6a42d02"
	]
  }
}