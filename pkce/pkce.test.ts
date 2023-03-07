import { createPkceChallenge, createPkceVerifier } from './pkce.js';

const mockBytes = new Uint8Array([
  93, 163, 135, 168, 238, 82, 183, 225, 57, 98, 127, 181, 230, 81, 139, 235, 60, 63, 25, 220, 251, 191, 93, 133, 227,
  167, 251, 4, 134, 22, 91, 84, 130, 42, 224, 116, 155, 0, 222, 161, 85, 176, 113, 248, 147, 227, 118, 111, 101, 103, 8,
  94, 209, 72, 227, 15, 34, 110, 4, 243, 218, 47, 134, 75, 4, 125, 70, 150, 180, 61, 94, 40, 188, 174, 131, 252, 163,
  151, 96, 6, 186, 64, 80, 15, 100, 144, 148, 184, 235, 167, 211, 191, 222, 205, 114, 31, 8, 70, 203, 99, 195, 118, 226,
  170, 195, 115, 25, 167, 174, 57, 41, 55, 23, 51, 213, 252, 195, 77, 175, 247, 162, 124, 79, 70, 112, 18, 119, 125,
]);

describe('pkce', () => {
  beforeEach(async () => {
    Object.defineProperties(global, {
      TextEncoder: { value: (await import('node:util')).TextEncoder },
      crypto: { value: (await import('node:crypto')).webcrypto },
    });
    jest.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return mockBytes.slice(0, new Uint8Array(array!.byteLength).length);
    });
  });

  test('createPkceVerifier', () => {
    let verifier: string;

    verifier = createPkceVerifier(0);
    expect(verifier.length).toBe(43);
    expect(verifier).toMatchInlineSnapshot(`"XaOHqO5St-E5Yn-15lGL6zw_Gdz7v12F46f7BIYWW1S"`);

    verifier = createPkceVerifier(42);
    expect(verifier.length).toBe(43);
    expect(verifier).toMatchInlineSnapshot(`"XaOHqO5St-E5Yn-15lGL6zw_Gdz7v12F46f7BIYWW1S"`);

    verifier = createPkceVerifier(43);
    expect(verifier.length).toBe(43);
    expect(verifier).toMatchInlineSnapshot(`"XaOHqO5St-E5Yn-15lGL6zw_Gdz7v12F46f7BIYWW1S"`);

    verifier = createPkceVerifier(64);
    expect(verifier.length).toBe(64);
    expect(verifier).toMatchInlineSnapshot(`"XaOHqO5St-E5Yn-15lGL6zw_Gdz7v12F46f7BIYWW1SCKuB0mwDeoVWwcfiT43Zv"`);

    verifier = createPkceVerifier(127);
    expect(verifier.length).toBe(127);
    expect(verifier).toMatchInlineSnapshot(
      `"XaOHqO5St-E5Yn-15lGL6zw_Gdz7v12F46f7BIYWW1SCKuB0mwDeoVWwcfiT43ZvZWcIXtFI4w8ibgTz2i-GSwR9Rpa0PV4ovK6D_KOXYAa6QFAPZJCUuOun07_ezXI"`,
    );

    verifier = createPkceVerifier(128);
    expect(verifier.length).toBe(128);
    expect(verifier).toMatchInlineSnapshot(
      `"XaOHqO5St-E5Yn-15lGL6zw_Gdz7v12F46f7BIYWW1SCKuB0mwDeoVWwcfiT43ZvZWcIXtFI4w8ibgTz2i-GSwR9Rpa0PV4ovK6D_KOXYAa6QFAPZJCUuOun07_ezXIf"`,
    );

    verifier = createPkceVerifier(129);
    expect(verifier.length).toBe(128);
    expect(verifier).toMatchInlineSnapshot(
      `"XaOHqO5St-E5Yn-15lGL6zw_Gdz7v12F46f7BIYWW1SCKuB0mwDeoVWwcfiT43ZvZWcIXtFI4w8ibgTz2i-GSwR9Rpa0PV4ovK6D_KOXYAa6QFAPZJCUuOun07_ezXIf"`,
    );

    verifier = createPkceVerifier();
    expect(verifier.length).toBe(128);
    expect(verifier).toMatchInlineSnapshot(
      `"XaOHqO5St-E5Yn-15lGL6zw_Gdz7v12F46f7BIYWW1SCKuB0mwDeoVWwcfiT43ZvZWcIXtFI4w8ibgTz2i-GSwR9Rpa0PV4ovK6D_KOXYAa6QFAPZJCUuOun07_ezXIf"`,
    );
  });

  test('createPkceChallenge', async () => {
    let challenge: string;

    challenge = await createPkceChallenge('XaOHqO5St-E5Yn-15lGL6zw_Gdz7v12F46f7BIYWW1S');
    expect(challenge).toBe('KIE3c1Hvm6pvLCR3iavBHyOQEK-P1Z6wS2DF9qYeWfg');

    challenge = await createPkceChallenge('XaOHqO5St-E5Yn-15lGL6zw_Gdz7v12F46f7BIYWW1SCKuB0mwDeoVWwcfiT43Zv');
    expect(challenge).toBe('9o1huuS5t87OxSGedmV9pMgwySMHLdikzqTZknK1vlo');

    challenge = await createPkceChallenge(
      'XaOHqO5St-E5Yn-15lGL6zw_Gdz7v12F46f7BIYWW1SCKuB0mwDeoVWwcfiT43ZvZWcIXtFI4w8ibgTz2i-GSwR9Rpa0PV4ovK6D_KOXYAa6QFAPZJCUuOun07_ezXI',
    );
    expect(challenge).toBe('k2lNh50R0NNz0_IadJN6NaBN62OEku_ogay_iTaKVX0');
  });
});
