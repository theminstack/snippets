import { PassThrough } from 'node:stream';

import { readStream } from './read-stream.js';

describe('stream-to-data', () => {
  test('source without encoding', async () => {
    const source = new PassThrough();
    const promise = readStream(source);

    source.write('foo');
    source.write('bar');
    source.end();

    const buffer = await promise;
    expect(buffer.toString()).toBe('foobar');
  });

  test('source with utf8 encoding', async () => {
    const source = new PassThrough({ encoding: 'utf8' });
    const promise = readStream(source);

    source.write('foo');
    source.write('bar');
    source.end();

    const buffer = await promise;
    expect(buffer.toString()).toBe('foobar');
  });

  test('source in object mode', async () => {
    const source = new PassThrough({ objectMode: true });
    const promise = readStream(source);

    source.write({ foo: true });
    source.end();

    await expect(promise).rejects.toBeInstanceOf(Error);
  });

  test('output encoding', async () => {
    const source = new PassThrough();
    const promise = readStream(source, 'utf8');

    source.write('foo');
    source.write('bar');
    source.end();

    await expect(promise).resolves.toBe('foobar');
  });
});
