import { describe, expect, it } from 'vitest';
import { calculateProgressPercent } from './schoolService.js';

describe('calculateProgressPercent', () => {
    it('maps fixed progress states to teacher-facing percentages', () => {
        expect(calculateProgressPercent('not_started')).toBe(0);
        expect(calculateProgressPercent('started')).toBe(25);
        expect(calculateProgressPercent('reagent_added')).toBe(50);
        expect(calculateProgressPercent('completed')).toBe(100);
        expect(calculateProgressPercent('failed')).toBe(0);
    });

    it('uses mixing progress between 50 and 99 percent', () => {
        expect(calculateProgressPercent('mixing', 0, 300)).toBe(50);
        expect(calculateProgressPercent('mixing', 150, 300)).toBe(75);
        expect(calculateProgressPercent('mixing', 300, 300)).toBe(99);
    });
});
