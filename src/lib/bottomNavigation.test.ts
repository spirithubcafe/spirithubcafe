import assert from 'node:assert/strict';
import test from 'node:test';
import {
  initialScrollMinimizeState,
  isNavPathActive,
  nextScrollMinimizeState,
  type ScrollMinimizeState,
} from './bottomNavigation.ts';

const scrollThrough = (positions: number[], maxY?: number): ScrollMinimizeState =>
  positions.reduce((state, y) => nextScrollMinimizeState(state, y, maxY), initialScrollMinimizeState);

test('small scrolls do not minimize the bar', () => {
  assert.equal(scrollThrough([2, 4, 5]).minimized, false);
});

test('scrolling down by the threshold minimizes the bar', () => {
  assert.equal(scrollThrough([3, 6]).minimized, true);
});

test('scrolling up by the threshold restores the bar', () => {
  assert.equal(scrollThrough([100, 400, 396]).minimized, true);
  assert.equal(scrollThrough([100, 400, 394]).minimized, false);
});

test('the threshold counts from the furthest point in the current direction', () => {
  // Down to 400, up to 300 (restored, anchor 300), then down 5px: still restored.
  assert.equal(scrollThrough([100, 400, 300, 305]).minimized, false);
  assert.equal(scrollThrough([100, 400, 300, 306]).minimized, true);
});

test('reaching the top restores the bar', () => {
  assert.deepEqual(scrollThrough([100, 400, 0]), initialScrollMinimizeState);
  assert.deepEqual(scrollThrough([100, -40]), initialScrollMinimizeState);
});

test('overscroll bounce past the page end keeps the bar minimized', () => {
  // maxY 1000: the bounce reports 1040 then 1000, which is not a scroll up.
  assert.equal(scrollThrough([500, 1040, 1000], 1000).minimized, true);
});

test('a region root matches only itself', () => {
  assert.equal(isNavPathActive('/om', '/om'), true);
  assert.equal(isNavPathActive('/om/', '/om'), true);
  assert.equal(isNavPathActive('/om/products', '/om'), false);
});

test('a section matches its sub-pages on a segment boundary', () => {
  assert.equal(isNavPathActive('/om/products', '/om/products'), true);
  assert.equal(isNavPathActive('/om/products/ethiopia-guji', '/om/products'), true);
  assert.equal(isNavPathActive('/om/products-old', '/om/products'), false);
  assert.equal(isNavPathActive('/sa/products', '/om/products'), false);
});
