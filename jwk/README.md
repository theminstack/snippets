# JWK

Create JWKs for signing and verifying JWT tokens.

```ts
const jwk = await createJwk('RS256', {
  // Optional. Defaults to 2048.
  modulusLength: 4096,
  // Optional. Defaults to the `crypto` global.
  crypto: window.crypto,
});
```

The following algorithms are supported.

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

A single JWK is returned for `HS*` algorithms.

```ts
const key: CryptoKey = await crypto.subtle.importKey('jwk', jwk, ...);
```

A JWK pair (public and private) is returned for all other algorithms.

```ts
const publicKey: CryptoKey = await crypto.subtle.importKey('jwk', jwk.public, ...);
const privateKey: CryptoKey = await crypto.subtle.importKey('jwk', jwk.private, ...);
```
