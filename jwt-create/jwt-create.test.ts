import { createJwk } from '../jwk/jwk.js';
import { decodeJwt } from '../jwt-decode/jwt-decode.js';
import { createJwt } from './jwt-create.js';

describe('createJwt', () => {
  (
    [
      'HS256',
      'HS384',
      'HS512',
      'RS256',
      'RS384',
      'RS512',
      'PS256',
      'PS384',
      'PS512',
      'ES256',
      'ES384',
      'ES512',
    ] as const
  ).forEach((algorithm) => {
    test(algorithm, async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const jwk = await createJwk(algorithm);
      const jwt = await createJwt('private' in jwk ? jwk.private : jwk, {
        header: { kid: ('private' in jwk ? jwk.private : jwk).kid },
      });
      const decoded = await decodeJwt(jwt.value, { getVerifyJwk: async () => ('public' in jwk ? jwk.public : jwk) });
      expect(decoded?.value).toMatch(/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/);
      expect(decoded?.header).toMatchObject({ typ: 'JWT', alg: algorithm });
      expect(decoded?.payload).toMatchObject({
        iat: expect.any(Number),
        exp: expect.any(Number),
      });
      expect(decoded?.payload.iat).toBeLessThanOrEqual(nowSeconds + 3);
      expect(decoded?.payload.exp).toBeGreaterThanOrEqual(nowSeconds + 20 * 60);
      expect(decoded?.payload.exp).toBeLessThanOrEqual(nowSeconds + 3 + 20 * 60);
    });
  });

  test('algorithm hint', async () => {
    const jwkPair = await createJwk('RS256');
    const jwk: any = { ...jwkPair.private };
    delete jwk.alg;

    await expect(createJwt(jwk, { algorithm: 'RS256' })).resolves.toMatchObject({
      header: { alg: 'RS256' },
    });
  });

  test('missing algorithm', async () => {
    const jwkPair = await createJwk('RS256');
    const jwk: any = { ...jwkPair.private };
    delete jwk.alg;

    await expect(createJwt(jwk)).rejects.toThrow(new Error('missing JWK algorithm'));
  });

  test('unsupported algorithm type', async () => {
    const jwkPair = await createJwk('RS256');
    const jwk: any = { ...jwkPair.private, alg: 'XX256' };

    await expect(createJwt(jwk)).rejects.toThrow(new Error('unsupported JWK algorithm'));
  });

  test('unsupported algorithm hash length', async () => {
    const jwkPair = await createJwk('RS256');
    const jwk: any = { ...jwkPair.private, alg: 'RS128' };

    await expect(createJwt(jwk)).rejects.toThrow(new Error('unsupported JWK algorithm'));
  });
});
