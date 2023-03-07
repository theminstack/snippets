const encodeBase64Url = (bytes: Uint8Array): string => {
  const string = bytes.reduce((result, byte) => result + String.fromCharCode(byte), '');
  return btoa(string).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const createPkceVerifier = (length = 128): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(Math.min(128, Math.max(43, length)) || 128));
  return encodeBase64Url(bytes).slice(0, bytes.length);
};

const createPkceChallenge = async (verifier: string): Promise<string> => {
  const bytes = new TextEncoder().encode(verifier);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return encodeBase64Url(digest);
};

export { createPkceChallenge, createPkceVerifier };
