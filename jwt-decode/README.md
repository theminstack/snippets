# JWT Decode

Decode JWTs with (optional) verification.

```ts
const jwt = decodeJwt(token, {
  // Optional. Enables JWT signature verification.
  getVerifyJwk: async ({ header, payload }) => {
    // Get a public JWK using unverified JWT claims.
  },
  // Optional. Defaults to the `crypto` global.
  crypto: window.crypto,
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

The `jwt` object with the following properties is returned if the JWT is successfully decoded and verified.

- `value` - JWT string
- `header` - claims object
- `payload` - claims object
- `signature` - string

A `null` value is returned if the JWT cannot be decoded or verified for any reason.
