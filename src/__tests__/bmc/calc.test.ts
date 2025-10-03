import { describe, expect, it } from 'vitest';
import solve from '@/utils/calc';

describe('utils/calc', () => {
  describe('support calculation', () => {
    it('should eval even if variables are given in wrong order', () => {
      expect(
        solve([
          {
            calcId: 'cs1',
            values: {
              market: 100,
              vip: 4,
            },
          },
          {
            calcId: 'r1',
            values: {
              revenue: 'r1.size * r1.price',
              size: 'r1.share * cs1.market',
              share: 0.5,
              price: 10,
            },
          },
        ]).r1.revenue,
      ).toEqual(500);
    });
    it('should eval local variable in short form without prefix', () => {
      expect(
        solve([
          {
            calcId: 'cs1',
            values: {
              market: 100,
              vip: 4,
            },
          },
          {
            calcId: 'r1',
            values: {
              revenue: 'size * price',
              size: 'share * cs1.market',
              share: 0.5,
              price: 10,
            },
          },
        ]).r1.revenue,
      ).toEqual(500);
    });
  });
});
