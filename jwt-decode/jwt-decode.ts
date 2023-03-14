type JwkAlgorithm = keyof typeof algorithms;
type Jwk = JsonWebKey;

type Json =
  | readonly (Json | undefined)[]
  | string
  | number
  | boolean
  | null
  | { readonly [key: string]: Json | undefined };

interface JwtObject {
  readonly [key: string]: JwtObject | readonly (JwtObject | undefined)[] | string | number | boolean | null | undefined;
}

interface JwtHeader extends JwtObject {
  readonly typ: 'JWT';
  readonly alg: JwkAlgorithm;
  readonly kid?: string;
}

interface JwtDecodeOptions {
  readonly crypto?: { subtle: Pick<SubtleCrypto, 'importKey' | 'verify'> };
  readonly getVerifyJwk?: (claims: { header: JwtHeader; payload: JwtObject }) => Promise<Jwk>;
}

interface Jwt {
  readonly value: string;
  readonly header: JwtHeader;
  readonly payload: JwtObject;
  readonly signature: string;
}

const GLOBAL_CRYPTO = crypto;

const base64UrlDecode = (value: string): Uint8Array => {
  const b64 = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(value.length + (value.length % 4 === 0 ? 0 : 4 - (value.length % 4)), '=');
  return new Uint8Array(Array.from(atob(b64)).map((char) => char.charCodeAt(0)));
};

const isJwtObject = (value: Json): value is JwtObject => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isJwtHeader = (value: Json): value is JwtObject & { typ: 'JWT'; alg: string; kid?: string } => {
  return (
    isJwtObject(value) &&
    value.typ === 'JWT' &&
    typeof value.alg === 'string' &&
    (typeof value.kid === 'undefined' || typeof value.kid === 'string')
  );
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
 * Parse and optionally verify a JWT.
 *
 * Provide the {@link JwtDecodeOptions.getVerifyJwk} option to verify the
 * JWT signature.
 *
 * If the {@link token} cannot be decoded or is not a valid JWT, a
 * `SyntaxError` is thrown. If JWT is expired or cannot be verified,
 * `null` is returned.
 */
export const decodeJwt = async (
  token: string,
  { crypto = GLOBAL_CRYPTO, getVerifyJwk }: JwtDecodeOptions = {},
): Promise<Jwt | null> => {
  const [headerString = '', payloadString = '', signature = ''] = token.split('.', 3);
  let partialHeader, payload: Json;

  try {
    partialHeader = JSON.parse(new TextDecoder().decode(base64UrlDecode(headerString)));
    payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadString)));
  } catch {
    // Malformed
    return null;
  }

  if (
    // Invalid
    !isJwtHeader(partialHeader) ||
    !isJwtObject(payload) ||
    // Expired
    (typeof payload.exp === 'number' && payload.exp < Date.now() / 1000) ||
    // Unsupported
    !(partialHeader.alg in algorithms)
  ) {
    return null;
  }

  const header = partialHeader as JwtHeader;
  const { params } = algorithms[header.alg];
  const jwk = await getVerifyJwk?.({ header, payload });

  if (jwk?.alg && jwk.alg !== header.alg) {
    // Mismatched
    return null;
  }

  if (jwk) {
    const key = await crypto.subtle.importKey('jwk', jwk, params, false, ['verify']);
    const verified = await crypto.subtle.verify(
      params,
      key,
      base64UrlDecode(signature),
      new TextEncoder().encode(`${headerString}.${payloadString}`),
    );

    if (!verified) {
      return null;
    }
  }

  return {
    value: token,
    header,
    payload,
    signature,
  };
};
