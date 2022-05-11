type FsmStateKey = number | string | symbol;

type FsmStatesDefinition = { readonly [state: FsmStateKey]: unknown };

type FsmEdgesDefinition = { readonly [fromState: FsmStateKey]: { readonly [action: string]: FsmStateKey } };

type FsmTransition<
  TStates extends FsmStatesDefinition = FsmStatesDefinition,
  TEdges extends FsmEdgesDefinition = FsmEdgesDefinition,
  TToState extends keyof TStates = keyof TStates,
> = TStates[TToState] extends undefined | void
  ? () => FsmState<TStates, TEdges, TToState>
  : undefined extends TStates[TToState]
  ? (value?: TStates[TToState]) => FsmState<TStates, TEdges, TToState>
  : (value: TStates[TToState]) => FsmState<TStates, TEdges, TToState>;

type FsmState<
  TStates extends FsmStatesDefinition = Readonly<Record<FsmStateKey, any>>,
  TEdges extends FsmEdgesDefinition = FsmEdgesDefinition,
  TState extends keyof TStates = keyof TStates,
> = {
  // readonly start: FsmStart<TStates, TEdges>;
  readonly state: TState;
  readonly transitions: {
    readonly [TAction in keyof TEdges[TState]]: FsmTransition<TStates, TEdges, TEdges[TState][TAction]>;
  };
  readonly value: TStates[TState];
};

type FsmStatesUnion<
  TStates extends FsmStatesDefinition = FsmStatesDefinition,
  TEdges extends FsmEdgesDefinition = FsmEdgesDefinition,
  TStateSubset extends keyof TStates = keyof TStates,
> = {
  readonly [TState in TStateSubset]: FsmState<TStates, TEdges, TState>;
}[TStateSubset];

type Fsm<TStates extends FsmStatesDefinition = FsmStatesDefinition, TEdges extends FsmEdgesDefinition = {}> = {
  readonly start: <TState extends keyof TStates>(
    state: TState,
    ...args: TStates[TState] extends undefined | void
      ? readonly []
      : undefined extends TStates[TState]
      ? readonly [value?: TStates[TState]]
      : readonly [value: TStates[TState]]
  ) => FsmState<TStates, TEdges, TState>;
  readonly transition: <
    TAction extends string,
    TFromState extends keyof TStates,
    TToState extends TAction extends keyof TEdges[TFromState] ? never : keyof TStates,
  >(
    action: TAction,
    edge: { readonly from: TFromState; readonly to: TToState },
  ) => Fsm<
    TStates,
    TAction extends keyof TEdges[TFromState]
      ? TEdges
      : {
          readonly [P0 in TFromState | keyof TEdges]: P0 extends TFromState
            ? {
                readonly [P1 in TAction | keyof TEdges[P0]]: P1 extends TAction ? TToState : TEdges[P0][P1];
              }
            : TEdges[P0];
        }
  >;
};

type InferFsmStateKeys<TFsm> = TFsm extends Fsm<infer TStates>
  ? keyof TStates
  : TFsm extends FsmState<infer TStates>
  ? keyof TStates
  : never;

type InferFsmStates<TFsm, TStateSubset extends InferFsmStateKeys<TFsm> = InferFsmStateKeys<TFsm>> = TFsm extends Fsm<
  infer TStates,
  infer TEdges
>
  ? FsmStatesUnion<TStates, TEdges, TStateSubset>
  : TFsm extends FsmState<infer TStates, infer TEdges>
  ? FsmStatesUnion<TStates, TEdges, TStateSubset>
  : never;

const createFsmState = (
  transitions: Readonly<Record<FsmStateKey, Readonly<Record<string, FsmTransition>>>>,
  state: FsmStateKey,
  value: unknown,
): FsmState => {
  return {
    state,
    transitions: { ...transitions[state] },
    value,
  };
};

const createFsm = <TStates extends FsmStatesDefinition = {}>(): Fsm<TStates> => {
  const transition = (edges: FsmEdgesDefinition): Fsm => {
    return {
      start: (state, value): FsmState => {
        const transitions: Record<FsmStateKey, Record<string, FsmTransition>> = {};

        Object.entries(edges).forEach(([fromState, actions]) => {
          transitions[fromState] = {};
          Object.entries(actions).forEach(([action, toState]) => {
            transitions[fromState][action] = (toValue?: unknown) => {
              return createFsmState(transitions, toState, toValue);
            };
          });
        });

        return createFsmState(transitions, state, value);
      },
      transition: (action, { from, to }): Fsm => {
        return transition(edges[from] && action in edges[from] ? edges : { ...edges, [from]: { [action]: to } });
      },
    } as Fsm;
  };

  return transition({}) as unknown as Fsm<TStates>;
};

export { type InferFsmStates, createFsm };
