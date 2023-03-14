# JWT Create

Create JWTs for web ID and auth.

```ts
// JWK generation and consumption is left as an
// exercise for the reader.
const jwk = await getPrivateJwk();

const jwt = createJwt(jwk, {
  // Optional. Additional JWT header claims.
  header: { kid: jwk.kid },
  // Optional. Additional JWT payload claims.
  payload: { iss: 'https://example.com' },
  // Optional. Defaults to the `crypto` global.
  crypto: window.crypto,
  // Required if the JWK "alg" parameter is missing.
  algorithm: 'RS256',
  // Optional. Defaults to 1200 seconds (20 minutes).
  lifetime: 1200,
});
```

The following JWK algorithms are supported.

- **HMAC**: Not Recommended (symmetric)
  - `HS256`
  - `HS384`
  - `HS512`
- **RSASSA-PKCS1-v1_5**: Good (potential [vulnerability](https://www.cvedetails.com/cve/CVE-2020-20949/))
  - `RS256`
  - `RS384`
  - `RS512`
- **RSASSA-PSS**: Better (above vulnerability fixed)
  - `PS256`
  - `PS384`
  - `PS512`
- **ECDSA**: Best (elliptic curve)
  - `ES256`
  - `ES384`
  - `ES512`

The returned `jwt` object has the following properties.

- `value` - JWT string
- `header` - claims object
- `payload` - claims object
- `signature` - string
