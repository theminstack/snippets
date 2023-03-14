type JwkAlgorithm = keyof typeof algorithms;

interface JwtObject {
  readonly [key: string]: JwtObject | readonly (JwtObject | undefined)[] | string | number | boolean | null | undefined;
}

interface JwtHeader extends JwtObject {
  readonly typ: 'JWT';
  readonly alg: JwkAlgorithm;
}

interface JwtPayloadOptions extends JwtObject {
  readonly iss?: string;
  readonly sub?: string;
  readonly aud?: string;
}

interface JwtPayload extends JwtPayloadOptions {
  readonly iat: number;
  readonly exp: number;
}

interface JwtCreateOptions {
  readonly header?: JwtObject;
  readonly payload?: JwtPayload;
  readonly crypto?: { subtle: Pick<SubtleCrypto, 'importKey' | 'sign'> };
  /** Required if for JWKs that do not contain the optional "alg" parameter. */
  readonly algorithm?: JwkAlgorithm;
  /** Lifetime of the created JWT in seconds. Defaults to 1200 (20 minutes). */
  readonly lifetime?: number;
}

interface Jwt {
  readonly value: string;
  readonly header: JwtHeader;
  readonly payload: JwtPayload;
  readonly signature: string;
}

const GLOBAL_CRYPTO = crypto;
const MINUTE_S = 60;

const base64UrlEncode = (value: string | ArrayBuffer): string => {
  return btoa(
    (typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value)).reduce(
      (result, byte) => result + String.fromCharCode(byte),
      '',
    ),
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const algorithms = {
  HS256: { params: { name: 'HMAC', hash: 'SHA-256' } },
  HS384: { params: { name: 'HMAC', hash: 'SHA-384' } },
  HS512: { params: { name: 'HMAC', hash: 'SHA-512' } },
  RS256: { params: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' } },
  RS384: { params: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-384' } },
  RS512: { params: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-512' } },
  PS256: { params: { name: 'RSA-PSS', hash: 'SHA-256', saltLength: 32 } },
  PS384: { params: { name: 'RSA-PSS', hash: 'SHA-384', saltLength: 48 } },
  PS512: { params: { name: 'RSA-PSS', hash: 'SHA-512', saltLength: 64 } },
  ES256: { params: { name: 'ECDSA', hash: 'SHA-256', namedCurve: 'P-256' } },
  ES384: { params: { name: 'ECDSA', hash: 'SHA-384', namedCurve: 'P-384' } },
  ES512: { params: { name: 'ECDSA', hash: 'SHA-512', namedCurve: 'P-521' } },
} as const satisfies Record<
  string,
  {
    params:
      | ({ name: 'HMAC' } & HmacImportParams & AlgorithmIdentifier)
      | ({ name: 'RSASSA-PKCS1-v1_5' } & RsaHashedImportParams & AlgorithmIdentifier)
      | ({ name: 'RSA-PSS' } & RsaHashedImportParams & RsaPssParams)
      | ({ name: 'ECDSA' | 'ECDH-ES' } & EcKeyImportParams & EcdsaParams);
  }
>;

/**
 * Create a JWT.
 */
export const createJwt = async (
  privateJwk: JsonWebKey,
  { header, payload, crypto = GLOBAL_CRYPTO, algorithm, lifetime = 20 * MINUTE_S }: JwtCreateOptions = {},
): Promise<Jwt> => {
  const maybeAlgorithm = privateJwk.alg ?? algorithm;

  if (typeof maybeAlgorithm !== 'string') {
    throw new Error('missing JWK algorithm');
  }

  if (!(maybeAlgorithm in algorithms)) {
    throw new Error('unsupported JWK algorithm');
  }

  const alg = maybeAlgorithm as JwkAlgorithm;
  const { params } = algorithms[alg];
  const key = await crypto.subtle.importKey('jwk', privateJwk, params, false, ['sign']);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const headerJson = JSON.stringify({ ...header, typ: 'JWT', alg } satisfies JwtHeader);
  const payloadJson = JSON.stringify({
    ...payload,
    iat: nowSeconds,
    exp: nowSeconds + Math.ceil(Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, lifetime >>> 0))),
  } satisfies JwtPayload);
  const headerString = base64UrlEncode(headerJson);
  const payloadString = base64UrlEncode(payloadJson);
  const signature = base64UrlEncode(
    await crypto.subtle.sign(params, key, new TextEncoder().encode(`${headerString}.${payloadString}`)),
  );

  return {
    value: `${headerString}.${payloadString}.${signature}`,
    header: JSON.parse(headerJson),
    payload: JSON.parse(payloadJson),
    signature,
  };
};
