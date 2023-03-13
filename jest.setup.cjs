Object.defineProperties(global, {
  TextEncoder: { value: require('node:util').TextEncoder },
  TextDecoder: { value: require('node:util').TextDecoder },
  crypto: { value: require('node:crypto').webcrypto },
});
