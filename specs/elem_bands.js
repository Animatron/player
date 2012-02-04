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

			beforeEach(function() {
				this.addMatchers({
					toHaveDefaultBand: function(expected) {
						var xdata = this.actual.xdata;
						expect(xdata._lband).not.toBeNull();
						expect(xdata._lband).toEqual([0, Element.DEFAULT_BAND]);
						expect(xdata._gband).not.toBeNull();
						expect(xdata._gband).toEqual([0, Element.DEFAULT_BAND]);
					},
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
					toHaveWrappingBand: function(expected) {
						expect(this.actual.calcWrapBand()).not.toBeNull();
						expect(this.actual.calcWrapBand()).toEqual(expected);
					}
				});
			});
			
			it('sets the default band for empty clip or element', function() {
				var clip = new Clip();
				expect(clip).toHaveDefaultBand();
				var elem = new Element();
				expect(elem).toHaveDefaultBand();
			});

			it('sets the default band for every empty element in tree even ' +
			   'and not changes them even if one is set', function() {
				var clip = new Clip();

				clip.add(new Element());
				expect(clip).toHaveDefaultBand();

				var elem = new Element();
				elem.add(new Element());
				clip.add(elem);
				expect(clip).toHaveDefaultBand();
				expect(elem).toHaveDefaultBand();
				
				elem.setBand([0, 12.1]);
				elem.setLBand([0, 12.1]);
				expect(elem).toHaveGBand([0, 12.1]);
				expect(elem).toHaveLBand([0, 12.1]);

				expect(clip).toHaveDefaultBand();

				var clip2 = new Clip();
				var elem2 = new Element();
				var elem3 = new Element();
				var elem4 = new Element();
				var elem5 = new Element();
				clip.add(elem5);
				elem3.setBand([14, 15]);
				elem3.setLBand([14, 15]);
				elem4.setBand([19, 20]);
				elem4.setLBand([16, 18]);
				elem2.add(elem3);
				elem2.add(new Clip());
				elem3.add(elem);
				elem4.add(new Clip());
				elem.add(elem4);
				clip.add(elem2);

				expect(clip).toHaveDefaultBand();
				expect(elem).toHaveGBand([0, 12.1]);
				expect(elem).toHaveLBand([0, 12.1]);
				expect(elem2).toHaveDefaultBand();
				expect(elem3).toHaveGBand([14, 15]);
				expect(elem3).toHaveLBand([14, 15]);
				expect(elem4).toHaveGBand([19, 20]);
				expect(elem4).toHaveLBand([16, 18]);
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

			it('corrects bands immediately when one of them set', function() {
				var elem = new Element();
				elem.setBand([5, 15]);
				expect(elem).toHaveLBand([5, 15]);
				var sub = new Element();
				expect(sub).toHaveDefaultBand();
				elem.add(sub);
				expect(sub).toHaveDefaultBand();
				sub.setBand([7, 15]);
				expect(sub).toHaveLBand([2, 9]);
				var sub2 = new Element();
				expect(sub2).toHaveDefaultBand();
				elem.add(sub2);
				sub2.setBand([6, 17]); // throw error?
				expect(sub2).toHaveLBand([0, 11]);
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

			it('makes band fit', function() {
			});

			function makeElementWithBand(band) {
				var elem = new Element();
				elem.setBand(band);
				return elem;
			}

		});

		describe('atomic functions', function() {

			it('expands bands', function() {
			});

			it('reduces bands', function() {
			});

			it('wraps bands', function() {
			});

			it('unwraps bands', function() {
			});

		});

		describe('time stuff', function() {

			it('calculates duration right', function() {
			});

			it('gets local time right', function() {
			});

			it('correctly checks if elements fits global time', function() {
			});

		});

	});

});