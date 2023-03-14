import { createJwk } from '../jwk/jwk.js';
import { createJwt } from '../jwt-create/jwt-create.js';
import { decodeJwt } from './jwt-decode.js';

describe('decodeJwt', () => {
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

  test('invalid JWT JSON', async () => {
    const jwk = await createJwk('RS256');
    const jwt = await createJwt(jwk.private);
    const [header = '', payload = '', signature = ''] = jwt.value.split('.', 3);

    await expect(
      decodeJwt(`Zm9v.${payload}.${signature}`, { getVerifyJwk: async () => jwk.public ?? jwk.private }),
    ).resolves.toBeNull();
    await expect(
      decodeJwt(`${header}.Zm9v.${signature}`, { getVerifyJwk: async () => jwk.public ?? jwk.private }),
    ).resolves.toBeNull();
  });

  test('invalid JWT header', async () => {
    const jwk = await createJwk('RS256');
    const jwt = await createJwt(jwk.private);
    const [, payload = '', signature = ''] = jwt.value.split('.', 3);
    const token = `e30.${payload}.${signature}`;

    await expect(decodeJwt(token, { getVerifyJwk: async () => jwk.public ?? jwk.private })).resolves.toBeNull();
  });

  test('invalid JWT header kid', async () => {
    const jwk = await createJwk('RS256');
    const jwt = await createJwt(jwk.private);
    const [, payload = '', signature = ''] = jwt.value.split('.', 3);
    const token = `eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6MH0.${payload}.${signature}`;

    await expect(decodeJwt(token, { getVerifyJwk: async () => jwk.public ?? jwk.private })).resolves.toBeNull();
  });

  test('invalid JWT payload', async () => {
    const jwk = await createJwk('RS256');
    const jwt = await createJwt(jwk.private);
    const [header, , signature = ''] = jwt.value.split('.', 3);
    const token = `${header}.bnVsbA.${signature}`;

    await expect(decodeJwt(token, { getVerifyJwk: async () => jwk.public ?? jwk.private })).resolves.toBeNull();
  });

  test('expired', async () => {
    const jwk = await createJwk('RS256');
    const jwt = await createJwt(jwk.private);
    const [header, , signature = ''] = jwt.value.split('.', 3);
    const token = `${header}.eyJleHAiOjB9.eyJleHAiOjB9.${signature}`;

    await expect(decodeJwt(token, { getVerifyJwk: async () => jwk.public ?? jwk.private })).resolves.toBeNull();
  });

  test('unsupported algorithm type', async () => {
    const jwk = await createJwk('RS256');
    const jwt = await createJwt(jwk.private);
    const [, payload, signature = ''] = jwt.value.split('.', 3);
    const token = `eyJ0eXAiOiJKV1QiLCJhbGciOiJYWDI1NiJ9.${payload}.eyJleHAiOjB9.${signature}`;

    await expect(decodeJwt(token, { getVerifyJwk: async () => jwk.public ?? jwk.private })).resolves.toBeNull();
  });

  test('unsupported algorithm hash length', async () => {
    const jwk = await createJwk('RS256');
    const jwt = await createJwt(jwk.private);
    const [, payload, signature = ''] = jwt.value.split('.', 3);
    const token = `eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzEyOCJ9.${payload}.eyJleHAiOjB9.${signature}`;

    await expect(decodeJwt(token, { getVerifyJwk: async () => jwk.public ?? jwk.private })).resolves.toBeNull();
  });

  test('JWK and JWT algorithm mismatch', async () => {
    const jwk = await createJwk('RS256');
    const otherjwk = await createJwk('RS384');
    const jwt = await createJwt(jwk.private);

    await expect(
      decodeJwt(jwt.value, { getVerifyJwk: async () => otherjwk.public ?? jwk.private }),
    ).resolves.toBeNull();
  });

  test('unverified', async () => {
    const jwk = await createJwk('RS256');
    const otherjwk = await createJwk('RS256');
    const jwt = await createJwt(jwk.private);

    await expect(
      decodeJwt(jwt.value, { getVerifyJwk: async () => otherjwk.public ?? jwk.private }),
    ).resolves.toBeNull();
  });
});
