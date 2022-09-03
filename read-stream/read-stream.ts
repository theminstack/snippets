type Readable = {
  readonly on: {
    (event: 'data', handler: (chunk: unknown) => void): void;
    (event: 'end', handler: () => void): void;
    (event: 'error', handler: (error: unknown) => void): void;
  };
};

type ReadStream = {
  /**
   * Capture all data from a readable stream to a `Buffer`.
   */
  (readable: Readable): Promise<Buffer>;
  /**
   * Capture all data from a readable stream to a `string` according to the given `encoding`.
   */
  (readable: Readable, encoding: BufferEncoding): Promise<string>;
  /**
   * Capture all data from a readable stream to a `Buffer`.
   */
  (readable: Readable, encoding?: BufferEncoding | undefined): Promise<Buffer | string>;
};

/**
 * Capture all data from a readable stream to a `Buffer` or `string` (if an `encoding` is set).
 */
const readStream = (async (readable, encoding) => {
  const buffers: Buffer[] = [];

  return new Promise<Buffer | string>((resolve, reject) => {
    readable.on('data', (chunk) => {
      if (chunk instanceof Buffer) {
        buffers.push(chunk);
      } else if (typeof chunk === 'string') {
        buffers.push(Buffer.from(chunk));
      } else {
        reject(new Error('Object mode streams are not supported'));
      }
    });
    readable.on('error', (error) => reject(error));
    readable.on('end', () => {
      const buffer = Buffer.concat(buffers);
      resolve(encoding != null ? buffer.toString(encoding) : buffer);
    });
  });
}) as ReadStream;

export { readStream };
