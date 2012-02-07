/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe('Element', function() {

	var b = Builder;

	describe('bands', function() {

		describe('trees', function() {

			var DEF_BAND = [0, Element.DEFAULT_BAND];

			beforeEach(function() {
				this.addMatchers({
					toHaveGBand: function(expected) {
						var xdata = this.actual.xdata;
						expect(xdata._gband).not.toBeNull();
						expect(xdata._gband).toEqual(expected);
					},
					toHaveLBand: function(expected) {
						var xdata = this.actual.xdata;
						expect(xdata._lband).not.toBeNull();
						expect(xdata._lband).toEqual(expected);
					},
					toHaveDefaultBand: function(expected) {
						var xdata = this.actual.xdata;
						expect(xdata._lband).not.toBeNull();
						expect(xdata._lband).toEqual([0, DEF_BAND]);
						expect(xdata._gband).not.toBeNull();
						expect(xdata._gband).toEqual([0, DEF_BAND]);
					},
					toHaveDefaultLBand: function(expected) {
						var xdata = this.actual.xdata;
						expect(xdata._lband).not.toBeNull();
						expect(xdata._lband).toEqual([0, DEF_BAND]);
					},
					toHaveWrappingBand: function(expected) {
						expect(this.actual.calcWrapBand()).not.toBeNull();
						expect(this.actual.calcWrapBand()).toEqual(expected);
					},
					toHaveDuration: function(expected) {
						expect(this.actual.calcDuration()).toEqual(expected);
					}
				});
			});
			
			it('sets the default band for empty clip or element', function() {
				var clip = new Clip();
				expect(clip).toHaveDefaultBand();
				var elem = new Element();
				expect(elem).toHaveDefaultBand();
			});

			it('sets the default band for every empty element in tree', function() {
				var clip = new Clip();

				clip.add(new Element());
				expect(clip).toHaveDefaultBand();

				var elem = new Element();
				elem.add(new Element());
				clip.add(elem);
				expect(clip).toHaveDefaultBand();
				expect(elem).toHaveDefaultBand();

				var clip2 = new Clip();
				var elem2 = new Element();
				var elem3 = new Element();
				var elem4 = new Element();
				var elem5 = new Element();
				clip.add(elem5);
				elem2.add(elem3);
				elem2.add(new Clip());
				elem3.add(elem);
				elem4.add(new Clip());
				elem.add(elem4);
				clip.add(elem2);
				clip.add(clip2);

				expect(clip).toHaveDefaultBand();
				expect(clip2).toHaveDefaultBand();
				expect(elem).toHaveDefaultBand();
				expect(elem2).toHaveDefaultBand();
				expect(elem3).toHaveDefaultBand();
				expect(elem4).toHaveDefaultBand();
				expect(elem5).toHaveDefaultBand();
			});

			it('not allows to set wrong bands', function() {
				var elem = new Element();

				expect(function() {
					elem.setBand([12, 10]);
				}).toThrow('Band overlaps'); // FIXME: Errors must to be objects,
				                             //        not strings
				expect(function() {
					elem.setLBand([11.1, 11]);
				}).toThrow('Band overlaps');

				expect(function() {
					elem.setLBand([-7, -8.2]);
				}).toThrow('Band overlaps');

				elem.setBand([-1, 5]);
				elem.setLBand([5, 12]);
			});

			it('applies bands', function() {
				var elem = new Element();
				elem.setBand([12, 15]);
				expect(elem).toHaveGBand([12, 15]);
				elem.applyBand([12, 15]);
				expect(elem).toHaveGBand([12, 15]);
				elem.applyBand([11.9, 12]);
				expect(elem).toHaveGBand([11.9, 15]);
				elem.applyBand([13.2, 14.3]);
				expect(elem).toHaveGBand([11.9, 15]);
				elem.applyBand([13.2, 18.2]);
				expect(elem).toHaveGBand([11.9, 18.2]);
				elem.applyBand([-3, 10]);
				expect(elem).toHaveGBand([-3, 18.2]);
				elem.applyBand([-4.2, 105.6]);
				expect(elem).toHaveGBand([-4.2, 105.6]);

				elem.setLBand([12, 15]);
				expect(elem).toHaveLBand([12, 15]);
				elem.applyLBand([12, 15]);
				expect(elem).toHaveLBand([12, 15]);
				elem.applyLBand([11.9, 12]);
				expect(elem).toHaveLBand([11.9, 15]);
				elem.applyLBand([13.2, 14.3]);
				expect(elem).toHaveLBand([11.9, 15]);
				elem.applyLBand([13.2, 18.2]);
				expect(elem).toHaveLBand([11.9, 18.2]);
				elem.applyLBand([-3, 10]);
				expect(elem).toHaveLBand([-3, 18.2]);
				elem.applyLBand([-4.2, 105.6]);
				expect(elem).toHaveLBand([-4.2, 105.6]);
			});

			it('reduces bands', function() {
				var elem = new Element();
				elem.setBand([-5, 17]);
				expect(elem).toHaveGBand([-5, 17]);
				elem.reduceBand([-5, 17]);
				expect(elem).toHaveGBand([-5, 17]);
				elem.reduceBand([-4, 17]);
				expect(elem).toHaveGBand([-5, 17]);
				elem.reduceBand([6, 17]);
				expect(elem).toHaveGBand([6, 17]);
				elem.reduceBand([8, 13]);
				expect(elem).toHaveGBand([8, 13]);
				elem.reduceBand([7.22, 8.23]);
				expect(elem).toHaveGBand([8, 8.23]);
				elem.reduceBand([8.19, 8.24]);
				expect(elem).toHaveGBand([8.19, 8.23]);

				elem.setLBand([-5, 17]);
				expect(elem).toHaveLBand([-5, 17]);
				elem.reduceLBand([-5, 17]);
				expect(elem).toHaveLBand([-5, 17]);
				elem.reduceLBand([-4, 17]);
				expect(elem).toHaveLBand([-5, 17]);
				elem.reduceLBand([6, 17]);
				expect(elem).toHaveLBand([6, 17]);
				elem.reduceLBand([8, 13]);
				expect(elem).toHaveLBand([8, 13]);
				elem.reduceLBand([7.22, 8.23]);
				expect(elem).toHaveLBand([8, 8.23]);
				elem.reduceLBand([8.19, 8.24]);
				expect(elem).toHaveLBand([8.19, 8.23]);
			});

			it('corrects bands immediately when one of them set ' +
			   'or when tree is changed', function() {
			   	// local band of element is a band relative to its parent element,
			   	// global band of element is the same band calculated relative to the whole scene
			   	// 
			   	// for root element, global band is always equal to local band

			   	// global band of some deep child may be calculated like this:
			   	// root global band + child local start + child local start... + length of clip, if
			   	//   it not exceeds length of parent, global end of parent if it does 
			   	//
			   	// visually changing a clip band might look like you've moved parent on a timeline,
			   	// both its bands changed, and among with that all children elements are moved, 
			   	// but their local bands were not changed. 

				var elem = new Element();
				elem.setLBand([6, 12]);
				expect(elem).toHaveGBand([6, 12]);
				expect(elem).toHaveLBand([6, 12]);
				elem.setBand([5, 20]);
				expect(elem).toHaveGBand([5, 20]);
				expect(elem).toHaveLBand([5, 20]);

				var sub = new Element();
				expect(sub).toHaveDefaultBand();
				elem.add(sub);
				expect(sub).toHaveGBand([5, 5+Element.DEFAULT_BAND]);
				expect(sub).toHaveLBand(DEF_BAND);
				// if you change local band of element, it also corrects its global band and
				// global bands of all children
				sub.setLBand([7, 15]);
				expect(sub).toHaveGBand([5+7, 5+15]);
				expect(sub).toHaveLBand([7, 15]);
				// if you change global band of element, it also corrects its local band and 
				// global bands of all children 
				sub.setBand([7, 15]);
				expect(sub).toHaveGBand([7, 15]);
				expect(sub).toHaveLBand([7-5, (7-5)+(15-7)]);
				sub.setBand([8, 25]);
				expect(sub).toHaveGBand([8, 20]); // it must fit parent, gband is also "actual" band
				expect(sub).toHaveLBand([8-5, (8-5)+(25-8)]);
				elem.setBand([6, 32]);
				expect(sub).toHaveGBand([8, 25]); // gband was corrected because now this element fits
				// local band is not changed for deep elements
				expect(sub).toHaveLBand([8-5, (8-5)+(25-8)]);

				// elem.gband == [6, 32]
				var sub2 = new Element();
				expect(sub2).toHaveDefaultBand();
				elem.add(sub2);
				expect(sub2).toHaveGBand([6, (6+Element.DEFAULT_BAND < 32) 
				                             ? 6+Element.DEFAULT_BAND : 32 ]);
				expect(sub2).toHaveLBand(DEF_BAND);
				sub2.setLBand([-2, 6]);
				expect(sub2).toHaveGBand([6, 6+(-2)+(6-(-2))]); // it must fit parent, gband is also "actual" band
				expect(sub2).toHaveLBand([-2, 6]);
				elem.setBand([4, 30]);
				expect(sub2).toHaveGBand([4, 4+(-2)+(6-(-2))]); // [4, 10]
				expect(sub2).toHaveLBand([-2, 6]);
				sub2.setBand([9, 34]);
				expect(sub2).toHaveGBand([9, 30]); // it must fit parent, gband is also "actual" band
				expect(sub2).toHaveLBand([9-4, (9-4)+(34-9)]); // [5, 25] 
				
				// elem.gband == [4, 30]
				// sub2.gband == [9, 30]
				var subsub = new Element();
				expect(subsub).toHaveDefaultBand();
				sub2.add(subsub);
				expect(subsub).toHaveGBand([9, 9+Element.DEFAULT_BAND]);
				expect(subsub).toHaveLBand(DEF_BAND);
				elem.setBand([2, 14]);
				expect(sub2).toHaveGBand([2+5, 14]); // 7, (2+5)+(25-5) = 27 > 14 => 14
				expect(sub2).toHaveLBand([5, 25]); //kept from [9-4, (9-4)+(34-9)]
				expect(subsub).toHaveGBand([2+5, ((2+5+Element.DEFAULT_BAND) < 14)
				                                 ? (2+5+Element.DEFAULT_BAND) : 14 ]);
			});

			it('local band is always equal to global band for root', function() {
				var elem = new Element();
				expect(elem).toHaveDefaultBand();
				elem.setBand([5, 20]);
				expect(elem).toHaveGBand([5, 20]);
				expect(elem).toHaveLBand([5, 20]);	
				elem.setBand([6, 17]);
				expect(elem).toHaveGBand([6, 17]);
				expect(elem).toHaveLBand([6, 17]);
				elem.setBand([-5.2, 1624.3]);
				expect(elem).toHaveGBand([-5.2, 1624.3]);
				expect(elem).toHaveLBand([-5.2, 1624.3]);
				// TODO: cycle on random values	
			});

			it('gets correct wrapping band', function() {
				var elem = makeElementWithBand([12, 20]);
				expect(elem).toHaveWrappingBand([12, 20]);
				elem.add(makeElementWithBand([15.1, 17]));
				expect(elem).toHaveWrappingBand([12, 20]);
				elem.add(makeElementWithBand([16, 17]));
				expect(elem).toHaveWrappingBand([12, 20]);
				elem.add(makeElementWithBand([11, 17]));
				expect(elem).toHaveWrappingBand([11, 20]);

				var inner = makeElementWithBand([5, 14]);
				expect(inner).toHaveWrappingBand([5, 14]);
				inner.add(makeElementWithBand([6, 45.5]));
				expect(inner).toHaveWrappingBand([5, 45.5]);
				elem.add(inner);
				expect(elem).toHaveWrappingBand([5, 20]);
				elem.add(makeElementWithBand([12, 21]));
				expect(elem).toHaveWrappingBand([11, 21]);	

				var subinner = makeElementWithBand([-4, 60]);
				expect(subinner).toHaveWrappingBand([-4, 60]);
				subinner.add(makeElementWithBand([-4.6, -2]));
				expect(subinner).toHaveWrappingBand([-4.6, 60]);
				subinner.add(makeElementWithBand([-4.7, -4.4]));
				expect(subinner).toHaveWrappingBand([-4.7, 60]);
				inner.add(subinner);
				expect(inner).toHaveWrappingBand([-4.7, 60]);
				expect(elem).toHaveWrappingBand([-4.7, 60]);
				inner.add(makeElementWithBand([-120, -4.4]));
				expect(subinner).toHaveWrappingBand([-4.7, 60]);
				expect(inner).toHaveWrappingBand([-120, 60]);
				expect(elem).toHaveWrappingBand([-120, 60]);
				inner.add(makeElementWithBand([-600.1, 499.2]));
				expect(subinner).toHaveWrappingBand([-4.7, 60]);
				expect(inner).toHaveWrappingBand([-600.1, 499.2]);
				expect(elem).toHaveWrappingBand([-600.1, 499.2]);
			});

			it('looks like moving elements on timeline', function() {
				var elem = new Element();
				elem.setBand([5, 34]);

				var sub = new Element();
				elem.add(sub);
				sub.setLBand([3, 25]);
				expect(sub).toHaveGBand([8, 33]);

				var subsub = new Element();
				sub.add(subsub);
				subsub.setLBand([1, 5]);
				expect(subsub).toHaveGBand([9, 13]);

				var subsubsub = new Element();
				subsub.add(subsubsub);
				subsubsub.setLBand([-1, 6]);
				expect(subsubsub).toHaveGBand([9, 13]); // it is wider than parent, so it made to "fit"

				elem.setBand([6, 37]); // move one sec left
				expect(sub).toHaveGBand([9, 34]);
				expect(subsub).toHaveGBand([10, 14]);
				expect(subsubsub).toHaveGBand([10, 14]);

				elem.setBand([17, 50]);
				expect(sub).toHaveGBand([20, 75]);
				expect(subsub).toHaveGBand([21, 25]);
				expect(subsubsub).toHaveGBand([21, 25]);

				sub.setLBand([2, 20]);
				expect(elem).toHaveGBand([17, 50]);
				expect(sub).toHaveGBand([19, 37]);
				expect(subsub).toHaveGBand([20, 24]);
				expect(subsubsub).toHaveGBand([20, 24]);
				
				subsub.setLBand([0, 19]);
				expect(elem).toHaveGBand([17, 50]);
				expect(sub).toHaveGBand([19, 37]);
				expect(subsub).toHaveGBand([19, 38]);
				expect(subsubsub).toHaveGBand([19, 25]); // now it fits
			});

			xit('makes band fit', function() {
			});

			function makeElementWithBand(band) {
				var elem = new Element();
				elem.setBand(band);
				return elem;
			}

		});

		xdescribe('atomic functions', function() {

			xit('expands bands', function() {
			});

			xit('reduces bands', function() {
			});

			xit('wraps bands', function() {
			});

			xit('unwraps bands', function() {
			});

		});

		describe('time stuff', function() {

			it('calculates duration right', function() {
				expect(makeElementWithBand([-1, 19])).toHaveDuration(21);
				expect(makeElementWithBand([5, 16])).toHaveDuration(11);
				expect(makeElementWithBand([5.3, 1012])).toHaveDuration(1012-5.3);
				// TODO: calculate scene duration
			});

			it('gets local time right', function() {
				var elem = new Element();
				elem.setBand([5, 14]);
				expect(elem.localTime(6)).toEqual(1);
				expect(elem.localTime(-2)).toEqual(-7);
				expect(elem.localTime(14)).toEqual(9);
				expect(elem.localTime(18)).toEqual(13);
				expect(elem.localTime(7.23)).toEqual(2.23);
				expect(elem.localTime(105)).toEqual(100);

				var sub = new Element();
				elem.add(sub);
				sub.setLBand([3, 25]);
				//expect(sub).toHaveGBand([8, 14]);
				expect(sub.localTime(6)).toEqual(-2);
				expect(sub.localTime(-2)).toEqual(-10);
				expect(sub.localTime(14)).toEqual(6);
				expect(sub.localTime(18)).toEqual(10);
				expect(sub.localTime(7.23)).toEqual(-0.77);
				expect(sub.localTime(3.14)).toEqual(-4.86);

				var subsub = new Element();
				sub.add(subsub);
				subsub.setLBand([1, 10]);
				//expect(subsub).toHaveGBand([9, 18]);
				expect(subsub.localTime(6)).toEqual(-3);
				expect(subsub.localTime(-2)).toEqual(-7);
				expect(subsub.localTime(14)).toEqual(5);
				expect(subsub.localTime(18)).toEqual(9);
				expect(subsub.localTime(7.23)).toEqual(-1.77);
				expect(subsub.localTime(55)).toEqual(46);

				var subsubsub = new Element();
				subsub.add(subsubsub);
				subsubsub.setLBand([-2, 6]);
				//expect(subsubsub).toHaveGBand([9, 15]); // length is 8, but it must fit
				expect(subsubsub.localTime(7)).toEqual(0);
				expect(subsubsub.localTime(9)).toEqual(2);
				expect(subsubsub.localTime(6)).toEqual(-1);
				expect(subsubsub.localTime(-2)).toEqual(-9);
				expect(subsubsub.localTime(14)).toEqual(7);
				expect(subsubsub.localTime(18)).toEqual(11);
				expect(subsubsub.localTime(7.23)).toEqual(0.23);
			});

			it('correctly checks if elements fits global time', function() {
				var elem = new Element();
				elem.setBand([5, 14]);
				expect(elem.fits(elem.localTime(6))).toBeTruthy();
				expect(elem.fits(elem.localTime(5))).toBeTruthy();
				expect(elem.fits(elem.localTime(4))).toBeFalsy();
				expect(elem.fits(elem.localTime(15))).toBeFalsy();
				expect(elem.fits(elem.localTime(-2))).toBeFalsy();
				expect(elem.fits(elem.localTime(14))).toBeTruthy();
				expect(elem.fits(elem.localTime(7.23))).toBeTruthy();
				expect(elem.fits(elem.localTime(105))).toBeFalsy();

				var sub = new Element();
				elem.add(sub);
				sub.setLBand([3, 25]);
				//expect(sub).toHaveGBand([8, 14]);
				expect(sub.fits(sub.localTime(6))).toBeFalsy();
				expect(sub.fits(sub.localTime(5))).toBeFalsy();
				expect(sub.fits(sub.localTime(8))).toBeTruthy();
				expect(sub.fits(sub.localTime(9.15))).toBeTruthy();
				expect(sub.fits(sub.localTime(15))).toBeFalsy();
				expect(sub.fits(sub.localTime(-2))).toBeFalsy();
				expect(sub.fits(sub.localTime(14))).toBeTruthy();
				expect(sub.fits(sub.localTime(7.23))).toBeFalsy();
				expect(sub.fits(sub.localTime(3.14))).toBeFalsy();

				var subsub = new Element();
				sub.add(subsub);
				subsub.setLBand([-2, 11]);
				//expect(subsub).toHaveGBand([8, 14]); // length is 13, but it must fit
				expect(subsub.fits(subsub.localTime(6))).toBeFalsy();
				expect(subsub.fits(subsub.localTime(5))).toBeFalsy();
				expect(subsub.fits(subsub.localTime(8))).toBeTruthy();
				expect(subsub.fits(subsub.localTime(9.15))).toBeTruthy();
				expect(subsub.fits(subsub.localTime(15))).toBeFalsy();
				expect(subsub.fits(subsub.localTime(-2))).toBeFalsy();
				expect(subsub.fits(subsub.localTime(14))).toBeTruthy();
				expect(subsub.fits(subsub.localTime(7.23))).toBeFalsy();
				expect(subsub.fits(subsub.localTime(3.14))).toBeFalsy();

				elem.setLBand([5, 64]);
				//expect(subsubsub).toHaveGBand([8, 17]); // now it must fit
				expect(subsub.fits(subsub.localTime(6))).toBeFalsy();
				expect(subsub.fits(subsub.localTime(5))).toBeFalsy();
				expect(subsub.fits(subsub.localTime(8))).toBeTruthy();
				expect(subsub.fits(subsub.localTime(9.15))).toBeTruthy();
				expect(subsub.fits(subsub.localTime(15))).toBeTruthy();
				expect(subsub.fits(subsub.localTime(16.6))).toBeTruthy();
				expect(subsub.fits(subsub.localTime(17))).toBeTruthy();
				expect(subsub.fits(subsub.localTime(-2))).toBeFalsy();
				expect(subsub.fits(subsub.localTime(14))).toBeTruthy();
				expect(subsub.fits(subsub.localTime(7.23))).toBeFalsy();
				expect(subsub.fits(subsub.localTime(3.14))).toBeFalsy();

			});

		});

	});

});