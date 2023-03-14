import { createJwt } from '../jwt-create/jwt-create.js';
import { decodeJwt } from '../jwt-decode/jwt-decode.js';
import { createJwk } from './jwk.js';

describe('createJwk', () => {
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
});
