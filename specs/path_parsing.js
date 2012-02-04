/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

var pl = __js_pl_all;

describe('Path', function() {

	describe('parsing', function() {

		function matchSegments(actual, expected) {
			var klass = expected[0];
			var type = expected[1];
			var pts = expected.slice(2);
			expect(actual).toBeInstanceOf(klass);
			expect(actual.type).toEqual(type);
			for (var pi = 0; pi < pts.length; pi++) {
				expect(actual.pts[pi]).toEqual(pts[pi]);
			}
			expect(actual.last()).toEqual([ pts[pts.length - 2],
			                                pts[pts.length - 1] ]);
		} 

		beforeEach(function() {
			this.addMatchers({
				toBeInstanceOf: function(expected) {
					return (this.actual instanceof expected);
				},
				toBeSegmentLike: function(expected) {
					matchSegments(this.actual, expected);
					return true;
				}
			});
		});

		var path;

		it('parses same way with constructor and `parse` ' +
		   'instance method and `parse` static method', function() {
			var spec = 'M1.0 3 L20 25.0 Z';
			
			var instance = new Path('Z');
			expect(instance.str).toEqual('Z');
			expect(instance.segs.length).toEqual(0);
			expect(instance.start()).toBeNull();
			expect(instance.end()).toBeNull();

			instance.parse(spec);
			expect(instance.str).toEqual(spec);
			expect(instance.segs.length).toEqual(2);
			expect(instance.start()).toEqual([1, 3]);
			expect(instance.end()).toEqual([20, 25]);

			instance.parse('M12 10 Z');
			expect(instance.str).toEqual('M12 10 Z');
			expect(instance.segs.length).toEqual(1);
			expect(instance.start()).toEqual([12, 10]);
			expect(instance.end()).toEqual([12, 10]);

			var static_ = Path.parse(spec);
			expect(static_.str).toEqual(spec);
			expect(static_.segs.length).toEqual(2);
			expect(static_.start()).toEqual([1, 3]);
			expect(static_.end()).toEqual([20, 25]);

			static_.parse('Z');
			expect(static_.str).toEqual('Z');
			expect(static_.segs.length).toEqual(0);
			expect(static_.start()).toBeNull();
			expect(static_.end()).toBeNull();

			var targetedStatic = Path.parse(spec, instance);
			expect(targetedStatic.str).toEqual(spec);
			expect(targetedStatic.segs.length).toEqual(2);
			expect(targetedStatic.start()).toEqual([1, 3]);
			expect(targetedStatic.end()).toEqual([20, 25]);

			expect(targetedStatic).toBe(instance);
			expect(instance.str).toEqual(spec);
			expect(instance.segs.length).toEqual(2);
			expect(instance.start()).toEqual([1, 3]);
			expect(instance.end()).toEqual([20, 25]);

		});

		describe('SVG variant 1', function() {

			it('parses zero-length path', function() {
				var spec = 'Z';
				path = Path.parse(spec);
				expect(path.str).toEqual(spec);
				expect(path.start()).toBeNull();
				expect(path.end()).toBeNull();
				expect(path.segs.length).toEqual(0);
			});

			it('parses one-segment path', function() {
				var spec = 'M12 14.1 Z';
				path = Path.parse(spec);
				expect(path.str).toEqual(spec);
				expect(path.start()).toEqual([12, 14.1]);
				expect(path.end()).toEqual([12, 14.1]);
				expect(path.segs.length).toEqual(1);

				expect(path.segs[0]).toBeSegmentLike([ pl.MSeg,
					                                   Path.P_MOVETO,
					                                   12, 14.1 ]);
			});

			it('parses two-segments path', function() {
				var spec = 'M1.0 3 L20 25.0 Z';
				path = Path.parse(spec);
				expect(path.str).toEqual(spec);
				expect(path.start()).toEqual([1, 3]);
				expect(path.end()).toEqual([20, 25]);
				expect(path.segs.length).toEqual(2);
				// M1.0 3
				expect(path.segs[0]).toBeSegmentLike([ pl.MSeg,
					                                   Path.P_MOVETO,
					                                   1, 3 ]);
				// L20 25.0	                                   
				expect(path.segs[1]).toBeSegmentLike([ pl.LSeg,
					                                   Path.P_LINETO,
					                                   20, 25 ]);
			});

			it('parses four-segments path', function() {
				var spec = 'M222.0 12.2 C12 19 32.1 46 15 33.3 ' +
				           'M17.6 10845 L75 14.2 Z';
				path = Path.parse(spec);
				expect(path.str).toEqual(spec);
				expect(path.start()).toEqual([222, 12.2]);
				expect(path.end()).toEqual([75, 14.2]);
				expect(path.segs.length).toEqual(4);
				// M222.0 12.2
				expect(path.segs[0]).toBeSegmentLike([ pl.MSeg,
					                                   Path.P_MOVETO,
					                                   222, 12.2 ]);
				// C12 19 32.1 46 15 33.3
				expect(path.segs[1]).toBeSegmentLike([ pl.CSeg,
					                                   Path.P_CURVETO,
					                                   12, 19, 32.1, 46, 15, 33.3 ]);
				// M17.6 10845
				expect(path.segs[2]).toBeSegmentLike([ pl.MSeg,
					                                   Path.P_MOVETO,
					                                   17.6, 10845 ]);
				// L75 14.2
				expect(path.segs[3]).toBeSegmentLike([ pl.LSeg,
					                                   Path.P_LINETO,
					                                   75, 14.2 ]);
			});

	        it('parses 11-segments path', function() {
				var spec = 'M112 15 '+ // M1
				           'L20 25 '+  // L1
				           'L13 70 '+  // L2
				           'M60 37 '+  // M2
				           'L70 17 '+ // L3 
				           'C37 25 60 12 57.3 15 '+ // C1
				           'C120391 -191 2 17 -64.21 3 '+ // C2
				           'L236 24 '+ // L4
				           'C-2 1 23891 33 -222111.3 2210010 '+ // C3
				           'M6632 -1.1 '+ // M3
				           'L31 246 '+ // L5
				           'Z';
				path = Path.parse(spec);
				expect(path.str).toEqual(spec);
				expect(path.start()).toEqual([112, 15]);
				expect(path.end()).toEqual([31, 246]);
				expect(path.segs.length).toEqual(11);
				// M1: M112 15
				expect(path.segs[0]).toBeSegmentLike([ pl.MSeg,
					                                   Path.P_MOVETO,
					                                   112, 15 ]);
				// L1: L20 25
				expect(path.segs[1]).toBeSegmentLike([ pl.LSeg,
					                                   Path.P_LINETO,
					                                   20, 25 ]);
				// L2: L13 70
				expect(path.segs[2]).toBeSegmentLike([ pl.LSeg,
					                                   Path.P_LINETO,
					                                   13, 70 ]);
				// M2: M60 37
				expect(path.segs[3]).toBeSegmentLike([ pl.MSeg,
					                                   Path.P_MOVETO,
					                                   60, 37 ]);
				// L3: L70 17
				expect(path.segs[4]).toBeSegmentLike([ pl.LSeg,
					                                   Path.P_LINETO,
					                                   70, 17 ]);
				// C1: C37 25 60 12 57.3 15
				expect(path.segs[5]).toBeSegmentLike([ pl.CSeg,
					                                   Path.P_CURVETO,
					                                   37, 25, 60, 12, 57.3, 15 ]);
				// C2: C120391 -191 2 17 -64.21 3
				expect(path.segs[6]).toBeSegmentLike([ pl.CSeg,
					                                   Path.P_CURVETO,
					                                   120391, -191, 2, 17, 
					                                   -64.21, 3 ]);
				// L4: L236 24
				expect(path.segs[7]).toBeSegmentLike([ pl.LSeg,
					                                   Path.P_LINETO,
					                                   236, 24 ]);
				// C3: C-2 1 23891 33 -222111.3 2210010
				expect(path.segs[8]).toBeSegmentLike([ pl.CSeg,
					                                   Path.P_CURVETO,
					                                   -2, 1, 23891, 33, 
					                                   -222111.3, 2210010 ]);
				// M4: M6632 -1.1
				expect(path.segs[9]).toBeSegmentLike([ pl.MSeg,
					                                   Path.P_MOVETO,
					                                   6632, -1.1 ]);
				// L5: L31 246
				expect(path.segs[10]).toBeSegmentLike([ pl.LSeg,
					                                    Path.P_LINETO,
					                                    31, 246 ]);

			});

		});

	});
	
});