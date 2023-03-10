export class Events<TEvents extends Record<string, (...args: any[]) => void>> {
  #handlers = new Map<any, Set<(...args: any) => void>>();

  constructor() {
    this.on = this.on.bind(this);
    this.emit = this.emit.bind(this);
  }

  on<TEvent extends keyof TEvents>(
    ...[event, handler]: TEvent extends keyof TEvents
      ? [event: TEvent, handler: (...args: Parameters<TEvents[TEvent]>) => void]
      : never
  ): () => void {
    handler = handler.bind(null);
    let handlers = this.#handlers.get(event);

    if (!handlers) {
      this.#handlers.set(event, (handlers = new Set()));
    }

    handlers.add(handler);

    return () => {
      handlers?.delete(handler);
    };
  }

  emit<TEvent extends keyof TEvents>(
    ...[event, ...args]: TEvent extends keyof TEvents ? [event: TEvent, ...args: Parameters<TEvents[TEvent]>] : never
  ): boolean {
    const handlers = this.#handlers.get(event);

    if (!handlers?.size) {
      return false;
    }

    handlers.forEach((handler) => handler(...args));

    return true;
  }
}
