const crypto = require('node:crypto');
const util = require('node:util');
const fetch = require('node-fetch');

Object.defineProperties(global, {
  TextEncoder: { value: util.TextEncoder, configurable: true, writable: true },
  TextDecoder: { value: util.TextDecoder, configurable: true, writable: true },
  crypto: { value: crypto.webcrypto, configurable: true, writable: true },
  Response: { value: fetch.Response, configurable: true, writable: true },
  Request: { value: fetch.Request, configurable: true, writable: true },
  fetch: { value: fetch, configurable: true, writable: true },
});
