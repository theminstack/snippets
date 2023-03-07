# PKCE

Utilities for generating PKCE verifiers and challenges using the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Crypto).

Generate a PKCE verifier.

```ts
// Use the default length of 128 bytes.
const verifier = createPkceVerifier();

// Use an explicit length from 43 to 128 bytes.
const verifier = createPkceVerifier(43);
```

Generate the PKCE challenge for a given verifier.

```ts
const challenge = createPkceChallenge(verifier);
```
