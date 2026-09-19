/**
 * @file oauth-providers.test.ts
 * @description Apple gating is verified by flipping an argument, with no
 *              environment and no code change.
 */
import { describe, expect, it } from 'vitest';
import { resolveEnabledOAuthProviders } from './oauth-providers';

describe('resolveEnabledOAuthProviders', () => {
  it('offers Google only when the Apple flag is unset', () => {
    expect(resolveEnabledOAuthProviders({ appleEnabled: undefined })).toEqual(['google']);
  });

  it.each(['', 'false', 'TRUE', 'True', '1', ' true'])(
    'offers Google only for the non-exact flag value %j',
    (appleEnabled) => {
      expect(resolveEnabledOAuthProviders({ appleEnabled })).toEqual(['google']);
    },
  );

  it("appends Apple after Google only for the exact string 'true'", () => {
    expect(resolveEnabledOAuthProviders({ appleEnabled: 'true' })).toEqual(['google', 'apple']);
  });
});
