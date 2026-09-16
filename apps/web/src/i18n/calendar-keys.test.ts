import { describe, it, expect } from 'vitest';
import { MONTH_KEYS, DAY_KEYS, MONDAY_FIRST_DAY_KEYS } from './calendar-keys';

describe('MONTH_KEYS', () => {
  it('has 12 entries in calendar order', () => {
    expect(MONTH_KEYS).toHaveLength(12);
    expect(MONTH_KEYS[0]).toBe('jan');
    expect(MONTH_KEYS[11]).toBe('dec');
  });
});

describe('DAY_KEYS', () => {
  it('has 7 entries, Sunday-first', () => {
    expect(DAY_KEYS).toHaveLength(7);
    expect(DAY_KEYS[0]).toBe('sun');
    expect(DAY_KEYS[6]).toBe('sat');
  });
});

describe('MONDAY_FIRST_DAY_KEYS', () => {
  it('rotates DAY_KEYS to start on Monday and end on Sunday', () => {
    expect(MONDAY_FIRST_DAY_KEYS).toHaveLength(7);
    expect(MONDAY_FIRST_DAY_KEYS[0]).toBe('mon');
    expect(MONDAY_FIRST_DAY_KEYS[6]).toBe('sun');
  });

  it('contains exactly the same keys as DAY_KEYS, just reordered', () => {
    expect([...MONDAY_FIRST_DAY_KEYS].sort()).toEqual([...DAY_KEYS].sort());
  });

  it('does not mutate DAY_KEYS', () => {
    expect(DAY_KEYS[0]).toBe('sun');
  });
});
