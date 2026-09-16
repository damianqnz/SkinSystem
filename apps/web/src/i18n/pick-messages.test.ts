import { describe, expect, it } from 'vitest';
import { pickMessages } from './pick-messages';

describe('pickMessages', () => {
  const full = {
    booking: { title: 'Reservar' },
    dashboard: { home: { title: 'Panel' } },
    tenant: { header: { bookCta: 'Reservar' } },
  };

  it('keeps only the requested top-level namespaces', () => {
    expect(pickMessages(full, ['booking', 'tenant'])).toEqual({
      booking: full.booking,
      tenant: full.tenant,
    });
  });

  it('drops namespaces not in the allow-list', () => {
    const result = pickMessages(full, ['booking']);
    expect(result).not.toHaveProperty('dashboard');
    expect(result).not.toHaveProperty('tenant');
  });

  it('tolerates a namespace that does not exist in the source bundle', () => {
    expect(pickMessages(full, ['booking', 'doesNotExist'])).toEqual({ booking: full.booking });
  });

  it('returns an empty object for an empty allow-list', () => {
    expect(pickMessages(full, [])).toEqual({});
  });
});
