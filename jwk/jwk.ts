type JwkAlgorithm = keyof typeof algorithms;
type Jwk = Readonly<JsonWebKey & { kid: string; alg: string }>;
type JwkRsaModulusLength = 2048 | 4096;

interface JwkPair {
  readonly private: Jwk;
  readonly public: Jwk;
}

interface JwkCreateOptions {
  readonly crypto?: Pick<Crypto, 'randomUUID'> & { subtle: Pick<SubtleCrypto, 'generateKey' | 'exportKey'> };
  /** Only used for RSA keys. Defaults to 2048. */
  readonly modulusLength?: JwkRsaModulusLength;
}

const GLOBAL_CRYPTO = crypto;

const algorithms = {
  HS256: { params: { name: 'HMAC', hash: 'SHA-256', length: 256 } },
  HS384: { params: { name: 'HMAC', hash: 'SHA-384', length: 384 } },
  HS512: { params: { name: 'HMAC', hash: 'SHA-512', length: 512 } },
  RS256: { params: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' } },
  RS384: { params: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-384' } },
  RS512: { params: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-512' } },
  PS256: { params: { name: 'RSA-PSS', hash: 'SHA-256' } },
  PS384: { params: { name: 'RSA-PSS', hash: 'SHA-384' } },
  PS512: { params: { name: 'RSA-PSS', hash: 'SHA-512' } },
  ES256: { params: { name: 'ECDSA', namedCurve: 'P-256' } },
  ES384: { params: { name: 'ECDSA', namedCurve: 'P-384' } },
  ES512: { params: { name: 'ECDSA', namedCurve: 'P-521' } },
} as const satisfies Record<
  string,
  {
    params:
      | ({ name: 'HMAC' } & HmacKeyGenParams)
      | ({ name: 'RSASSA-PKCS1-v1_5' | 'RSA-PSS' } & Omit<RsaHashedKeyGenParams, 'modulusLength' | 'publicExponent'>)
      | ({ name: 'ECDSA' | 'ECDH-ES' } & EcKeyGenParams);
  }
>;

/**
 * Create a JWK or JWK pair.
 *
 * The `HS*` algorithms return a single {@link Jwk}. All other algorithms
 * return a {@link JwkPair}.
 */
export const createJwk = async <T extends JwkAlgorithm>(
  algorithm: T,
  { crypto = GLOBAL_CRYPTO, modulusLength = 2048 satisfies JwkRsaModulusLength }: JwkCreateOptions = {},
): Promise<T extends `HS${string}` ? Jwk : JwkPair> => {
  const kid = `${crypto.randomUUID()}-${Date.now().toString(16)}`;
  const { params } = algorithms[algorithm];
  const result = await crypto.subtle.generateKey(
    { ...params, modulusLength, publicExponent: new Uint8Array([0x01, 0x00, 0x01]) } as
      | HmacKeyGenParams
      | RsaHashedKeyGenParams
      | EcKeyGenParams,
    true,
    ['sign', 'verify'],
  );

  if ('publicKey' in result) {
    const privateData = await crypto.subtle.exportKey('jwk', result.privateKey);
    const publicData = await crypto.subtle.exportKey('jwk', result.publicKey);

    return {
      private: { ...privateData, kid, alg: privateData.alg ?? algorithm },
      public: { ...publicData, kid, alg: publicData.alg ?? algorithm },
    } as Jwk & JwkPair;
  }

  const data = await crypto.subtle.exportKey('jwk', result);

  return {
    ...data,
    kid,
    /* c8 ignore next */
    alg: data.alg ?? algorithm,
  } as Jwk & JwkPair;
};
