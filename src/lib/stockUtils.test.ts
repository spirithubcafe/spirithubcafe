import { describe, it, expect } from 'vitest';
import {
  getVariantStock,
  clampQuantity,
  canAddToCart,
  remainingStock,
  DEFAULT_MAX_QUANTITY,
} from './stockUtils';

describe('stockUtils', () => {
  // ---------- getVariantStock ----------
  describe('getVariantStock', () => {
    it('returns stockQuantity when defined', () => {
      expect(getVariantStock({ stockQuantity: 5 })).toBe(5);
    });

    it('returns 0 when stockQuantity is 0', () => {
      expect(getVariantStock({ stockQuantity: 0 })).toBe(0);
    });

    it('returns undefined when variant is null/undefined', () => {
      expect(getVariantStock(null)).toBeUndefined();
      expect(getVariantStock(undefined)).toBeUndefined();
    });

    it('returns undefined when stockQuantity is null', () => {
      expect(getVariantStock({ stockQuantity: null })).toBeUndefined();
    });
  });

  // ---------- clampQuantity ----------
  describe('clampQuantity', () => {
    it('clamps to maxStock when requested > maxStock', () => {
      expect(clampQuantity(5, 2)).toBe(2);
    });

    it('returns requested when within stock', () => {
      expect(clampQuantity(2, 5)).toBe(2);
    });

    it('never returns less than 1', () => {
      expect(clampQuantity(0, 5)).toBe(1);
      expect(clampQuantity(-3, 5)).toBe(1);
    });

    it('falls back to DEFAULT_MAX_QUANTITY when maxStock is undefined', () => {
      expect(clampQuantity(99, undefined)).toBe(DEFAULT_MAX_QUANTITY);
    });

    it('clamps to 0-stock (results in 1 since min is 1)', () => {
      // stock=0 but clampQuantity always returns >= 1
      // The out-of-stock guard should prevent calling this,
      // but if it does, we return 1 and addToCart will block.
      expect(clampQuantity(1, 0)).toBe(1);
    });
  });

  // ---------- canAddToCart ----------
  describe('canAddToCart', () => {
    it('allows adding when within stock', () => {
      expect(canAddToCart(0, 2, 2)).toBe(true);
      expect(canAddToCart(1, 1, 2)).toBe(true);
    });

    it('blocks adding when would exceed stock', () => {
      expect(canAddToCart(2, 1, 2)).toBe(false);
      expect(canAddToCart(1, 2, 2)).toBe(false);
    });

    it('blocks adding when already at stock', () => {
      expect(canAddToCart(2, 1, 2)).toBe(false);
    });

    it('allows when stock is undefined (no limit)', () => {
      expect(canAddToCart(100, 1, undefined)).toBe(true);
    });

    it('blocks adding when stock is 0', () => {
      expect(canAddToCart(0, 1, 0)).toBe(false);
    });
  });

  // ---------- remainingStock ----------
  describe('remainingStock', () => {
    it('returns remaining available units', () => {
      expect(remainingStock(1, 5)).toBe(4);
    });

    it('returns 0 when at stock', () => {
      expect(remainingStock(2, 2)).toBe(0);
    });

    it('never returns negative', () => {
      expect(remainingStock(5, 2)).toBe(0);
    });

    it('falls back to DEFAULT_MAX_QUANTITY minus current when no stock info', () => {
      expect(remainingStock(3, undefined)).toBe(DEFAULT_MAX_QUANTITY - 3);
    });
  });

  // ---------- Scenario: stock=2, can add only 2 ----------
  describe('Scenario: variant with stock=2', () => {
    const stock = 2;

    it('product page: quantity selector is clamped to 2', () => {
      // User tries to pick qty 5 via input
      expect(clampQuantity(5, stock)).toBe(2);
    });

    it('cart: increment from 2 is blocked', () => {
      // Cart has 2, user clicks +
      expect(canAddToCart(2, 1, stock)).toBe(false);
    });

    it('cart: increment from 1 is allowed', () => {
      expect(canAddToCart(1, 1, stock)).toBe(true);
    });

    it('adding qty=2 when cart is empty succeeds', () => {
      expect(canAddToCart(0, 2, stock)).toBe(true);
    });

    it('adding qty=3 when cart is empty fails', () => {
      expect(canAddToCart(0, 3, stock)).toBe(false);
    });
  });

  // ---------- Scenario: stock=0, cannot add ----------
  describe('Scenario: variant with stock=0', () => {
    const stock = 0;

    it('cannot add any quantity', () => {
      expect(canAddToCart(0, 1, stock)).toBe(false);
    });

    it('getVariantStock returns 0', () => {
      expect(getVariantStock({ stockQuantity: 0 })).toBe(0);
    });
  });
});
