import { describe, expect, it } from 'vitest';
import { AD_PACKAGES } from './advertisementService';
import { INITIAL_MANAGED_PACKAGES } from './adPackageService';

describe('advertisementService AD_PACKAGES', () => {
  it('derives bronze, silver, and gold pricing and features from INITIAL_MANAGED_PACKAGES', () => {
    expect(AD_PACKAGES).toHaveLength(3);
    for (const tier of ['bronze', 'silver', 'gold'] as const) {
      const derived = AD_PACKAGES.find((p) => p.id === tier);
      const source = INITIAL_MANAGED_PACKAGES.find((p) => p.id === `pkg-${tier}`);
      expect(derived).toBeDefined();
      expect(source).toBeDefined();
      expect(derived?.monthlyPriceHuf).toBe(source?.price_huf);
      expect(derived?.features).toEqual(source?.features);
    }
  });
});

