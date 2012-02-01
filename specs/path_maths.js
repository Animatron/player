var pl = __js_pl_all;

describe('Path', function() {

	var path;

	describe('maths', function() {

		var aprx_delta = 0.000005;

		beforeEach(function() {
			this.addMatchers({
				toApproxEqual: function(expected) {
					if (expected.push) {
						for (var i = 0; i < expected.length; i++) {
							if (!((expected[i] >= (this.actual[i] - aprx_delta)) &&
						          (expected[i] <= (this.actual[i] + aprx_delta)))) {
							          return false;	
						    };
						};
						return true;
					} else {
						return ((expected >= (this.actual - aprx_delta)) &&
						        (expected <= (this.actual + aprx_delta)));
					}
					return false;
				}				
			});
		});
		
		it('calculates correct point-length for linear paths', function() {
			path = new Path('M12 10 M30 40 M12 20 Z');
			expect(path.segs.length).toEqual(3);
			expect(path.length()).toEqual(0);

			path.parse('M10 20 L13 24 Z');
			expect(path.segs.length).toEqual(2);
			expect(path.length()).toEqual(5);

			path.parse('M0 0 L30 40 Z');
			expect(path.segs.length).toEqual(2);
			expect(path.length()).toEqual(Math.sqrt(30*30 + 40*40));

			path.parse('M75 21 L30 40 Z');
			expect(path.segs.length).toEqual(2);
			expect(path.length()).toEqual(Math.sqrt(45*45 + 19*19));

			path.parse('M-5 15 L15 -2 L-5 15 Z');
			expect(path.segs.length).toEqual(3);
			expect(path.length()).toEqual(Math.sqrt(20*20 + 17*17) +
		                                  Math.sqrt(20*20 + 17*17));

			path.parse('M2 4 L115 20 L122 -11 L0 0 L17 -10 Z');
			expect(path.segs.length).toEqual(5);
			expect(path.length()).toEqual(Math.sqrt(113*113 + 16*16) +
		                                  Math.sqrt(7*7 + 31*31) +
		                                  Math.sqrt(122*122 + 11*11) +
		                                  Math.sqrt(17*17 + 10*10));
		});

		xit('calculates approximately correct point-length for curve paths', function() {
			// TODO
		});

		xit('finds hit correctly', function() {
			// TODO: hitAt(t)
		});

		xit('finds correct point by time for only movement path', function() {
            path = new Path('M12 10 M30 40 M12 20 Z');
			expect(path.segs.length).toEqual(3);
			expect(path.pointAt(0)).toEqual([12, 10]);
			expect(path.pointAt(0.1)).toEqual([12, 10]);
			expect(path.pointAt(0.2)).toEqual([12, 10]);
			expect(path.pointAt(0.4)).toEqual([30, 40]);
			expect(path.pointAt(0.5)).toEqual([30, 40]);
			expect(path.pointAt(0.8)).toEqual([12, 20]);
			expect(path.pointAt(0.9)).toEqual([12, 20]);
			expect(path.pointAt(1)).toEqual([12, 20]); 
		});	

		it('finds correct point by time for linear path (approximate)', function() {
			
            path = new Path('M10 10 L50 50 L110 26 L98 14 Z');
			expect(path.segs.length).toEqual(4);

			var seg1_len = Math.sqrt(40*40 + 40*40);
		    var seg2_len = Math.sqrt(60*60 + 24*24);
		    var seg3_len = Math.sqrt(12*12 + 12*12);
		    var path_len = seg1_len + seg2_len + seg3_len;
			expect(path.length()).toEqual(path_len);

		    var seg1_t = 1 / (path_len / seg1_len);
		    var seg2_t = 1 / (path_len / seg2_len);
		    var seg3_t = 1 / (path_len / seg3_len);
		    var seg12_t = seg1_t + seg2_t;

		    // FIXME: ApproxEqual is not right to use
		    expect(path.pointAt(0)).toApproxEqual([10, 10]);
		    expect(path.pointAt(0.01 * seg1_t)).toApproxEqual([10.4, 10.4]);
		    expect(path.pointAt(0.1 * seg1_t)).toApproxEqual([14, 14]);
		    expect(path.pointAt(0.2 * seg1_t)).toApproxEqual([18, 18]);
			expect(path.pointAt(0.25 * seg1_t)).toApproxEqual([20, 20]);
			expect(path.pointAt(0.4 * seg1_t)).toApproxEqual([26, 26]);
			expect(path.pointAt(0.5 * seg1_t)).toApproxEqual([30, 30]);
			expect(path.pointAt(0.75 * seg1_t)).toApproxEqual([40, 40]);
			expect(path.pointAt(0.8 * seg1_t)).toApproxEqual([42, 42]);
			
			expect(path.pointAt(seg1_t)).toApproxEqual([50, 50]);
			expect(path.pointAt(seg1_t + 
				        (0.1 * seg2_t))).toApproxEqual([56, 47.6]);
			expect(path.pointAt(seg1_t + 
				        (0.125 * seg2_t))).toApproxEqual([57.5, 47]);	        
			expect(path.pointAt(seg1_t + 
				        (0.2 * seg2_t))).toApproxEqual([62, 45.2]);
			expect(path.pointAt(seg1_t + 
				        (0.25 * seg2_t))).toApproxEqual([65, 44]);
			expect(path.pointAt(seg1_t + 
				        (0.4 * seg2_t))).toApproxEqual([74, 40.4]);
			expect(path.pointAt(seg1_t + 
				        (0.5 * seg2_t))).toApproxEqual([80, 38]);
			expect(path.pointAt(seg1_t + 
				        (0.75 * seg2_t))).toApproxEqual([95, 32]);
			expect(path.pointAt(seg1_t + 
				        (0.8 * seg2_t))).toApproxEqual([98, 30.8]);
			
			expect(path.pointAt(seg12_t)).toApproxEqual([110, 26]);
			expect(path.pointAt(seg12_t + 
				        (0.1 * seg3_t))).toApproxEqual([108.8, 24.8]);
			expect(path.pointAt(seg12_t + 
				        (0.125 * seg3_t))).toApproxEqual([108.5, 24.5]);	        
			expect(path.pointAt(seg12_t + 
				        (0.2 * seg3_t))).toApproxEqual([107.6, 23.6]);
			expect(path.pointAt(seg12_t + 
				        (0.25 * seg3_t))).toApproxEqual([107, 23]);
			expect(path.pointAt(seg12_t + 
				        (0.4 * seg3_t))).toApproxEqual([105.2, 21.2]);
			expect(path.pointAt(seg12_t + 
				        (0.5 * seg3_t))).toApproxEqual([104, 20]);
			expect(path.pointAt(seg12_t + 
				        (0.75 * seg3_t))).toApproxEqual([101, 17]);
			expect(path.pointAt(seg12_t + 
				        (0.8 * seg3_t))).toApproxEqual([100.4, 16.4]);
				        
			expect(path.pointAt(1)).toApproxEqual([98, 14]);	            
		});

		describe('bounds', function() {

			it('determines bounds of the line-path', function() {
				expect(Path.parse('M10 15 Z')
				           .bounds()).toEqual([10, 15, 10, 15]);
				expect(Path.parse('M10 15 L10 15 Z')
				           .bounds()).toEqual([10, 15, 10, 15]);
				expect(Path.parse('M0.8 3.3 L2.2 1 Z')
				           .bounds()).toEqual([0.8, 1, 2.2, 3.3]);
				expect(Path.parse('M0 0 L0 0 L0 1 L0 0 L0 -1 L0 0 L0 0 Z')
				           .bounds()).toEqual([0, -1, 0, 1]);
				expect(Path.parse('M10 10 L50 50 L110 26 L98 14 Z')
				           .bounds()).toEqual([10, 10, 110, 50]);
				expect(Path.parse('M-1290 110 L1 12 L24 716 L-2115 64 Z')
				           .bounds()).toEqual([-2115, 12, 24, 716]);
				expect(Path.parse('M-1290 110 L1 12 L24 716 L-2115 64 L314 15 Z')
				           .bounds()).toEqual([-2115, 12, 314, 716]);
			});

			xit('determines bounds of the curve-path', function() {
			});

			xit('determines bounds of the mixed-path', function() {
			});

		});

		describe('inBounds', function() {

			it('determines if a point is inside or outside of the line path bounds', function() {
				path = new Path('M10 15 Z');
				expect(path.inBounds([10, 15])).toBeTruthy();
				expect(path.inBounds([0, 15])).toBeFalsy();
				expect(path.inBounds([0, 0])).toBeFalsy();
				expect(path.inBounds([100, 15])).toBeFalsy();
				expect(path.inBounds([100, 115])).toBeFalsy();
				expect(path.inBounds([1100, 15])).toBeFalsy();
				expect(path.inBounds([10, 1115])).toBeFalsy();
				expect(path.inBounds([20, 12])).toBeFalsy();
				expect(path.inBounds([-111, 12])).toBeFalsy();
				expect(path.inBounds([-112, -1])).toBeFalsy();
				expect(path.inBounds([0, -11])).toBeFalsy();

				path = new Path('M-2 -2 L15 15 Z');
				expect(path.inBounds([15, 15])).toBeTruthy();
				expect(path.inBounds([14, 14])).toBeTruthy();
				expect(path.inBounds([10, 10])).toBeTruthy();
				expect(path.inBounds([5, 5])).toBeTruthy();
				expect(path.inBounds([2, 2])).toBeTruthy();
				expect(path.inBounds([0, 0])).toBeTruthy();
				expect(path.inBounds([-1, -1])).toBeTruthy();
				expect(path.inBounds([-2, -2])).toBeTruthy();
				expect(path.inBounds([-2.1, -2.1])).toBeFalsy();
				expect(path.inBounds([-3, -3])).toBeFalsy();
				expect(path.inBounds([15, 14])).toBeTruthy(); // in bounds!
				expect(path.inBounds([14, 15])).toBeTruthy(); // in bounds!
				expect(path.inBounds([14, 13])).toBeTruthy(); // in bounds!
				expect(path.inBounds([13, 14])).toBeTruthy(); // in bounds!
				expect(path.inBounds([10, 11])).toBeTruthy(); // in bounds!
				expect(path.inBounds([15, 16])).toBeFalsy();
				expect(path.inBounds([-100, -100])).toBeFalsy();
				expect(path.inBounds([15.3, 15.3])).toBeFalsy();
				expect(path.inBounds([16, 16])).toBeFalsy();
				expect(path.inBounds([32, 32])).toBeFalsy();
				expect(path.inBounds([32, 33])).toBeFalsy();
				expect(path.inBounds([32, 43])).toBeFalsy();
				expect(path.inBounds([33, 32])).toBeFalsy();

				
				// TODO: rect / round paths with or without fill
			});

			xit('determines if a point is inside or outside of the curve path bounds', function() {				
			});

		});

		xdescribe('contains', function() {

			xit('determines if a point is inside or outside of the line path', function() {
				
			});

			xit('determines if a point is inside or outside of the curve path', function() {				
			});

		});

		xdescribe('crosses', function() {

			it('', function() {
				
			});

		});

	});

});