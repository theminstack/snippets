class Lock {
  #released = false;
  #onRelease: () => void;

  constructor(onRelease: () => void) {
    this.#onRelease = onRelease;
    this.release = this.release.bind(this);
  }

  release(): void {
    if (this.#released) return;

    this.#released = true;
    this.#onRelease();
  }
}

export class Semaphore {
  readonly #size: number;
  #available: number;
  #waiting: (() => void)[] = [];

  #next(): void {
    if (this.#available <= 0) return;

    this.#waiting.shift()?.();
  }

  get size(): number {
    return this.#size;
  }

  get available(): number {
    return this.#available;
  }

  get waiting(): number {
    return this.#waiting.length;
  }

  constructor(size: number) {
    this.#size = Math.max(1, Math.trunc(size));
    this.#available = this.#size;
    this.acquire = this.acquire.bind(this);
  }

  acquire(): Promise<Lock> {
    return new Promise((resolve) => {
      this.#waiting.push(() => {
        this.#available -= 1;

        resolve(
          new Lock(() => {
            this.#available += 1;
            this.#next();
          }),
        );
      });

      this.#next();
    });
  }
}
