import type { DeclareHeader, ModuleHeader } from "../../lang/header";
import type {
  Atom,
  Intrinsic,
  Parameter,
  Program,
  RuntimePrimitive,
} from "../../lang/syntax";
import type { Json, ValueOf } from "../../util/util";
import type {
  ControlKind,
  ProgramKind,
  ClosureKind,
  SegmentKind,
  GeneratorKind,
  Parametrization,
} from "../parametrization";

export type TestKind = "if" | "while" | "conditional";

type Valuation = {
  Stack: unknown;
  Scope: unknown;
  Other: unknown;
};

export type Frame<kind extends ControlKind, variable extends string, value> = {
  [key in variable]?: value;
} & {
  [key in Parametrization[kind]]: value;
};

/**
 * By including the kind of the block as the type of the frame, we remove its
 * parametrization on block kind yet retain precise type information about which
 * parameter is present in the frame.
 *
 * ```ts
 * const standalone_frame: StandaloneFrame = { type: kind, data: frame };
 * ```
 */
export type StandaloneFrame<variable extends string, value> = ValueOf<{
  [K in ControlKind]: {
    type: K;
    data: {
      [key in variable]?: variable;
    } & {
      [key in Parametrization[K]]: value;
    };
  };
}>;

export type Header<kind extends ProgramKind> = kind extends "module"
  ? ModuleHeader
  : kind extends "script" | "eval.global" | "eval.glocal.root"
    ? DeclareHeader
    : kind extends "eval.local.deep"
      ? never
      : never;

export type TaggedHead = ValueOf<{
  [K in ProgramKind]: {
    type: K;
    data: Header<K>[];
  };
}>;

/**
 * The standard weaving API expects a global value at
 * `config.advice_variable` that holds all the advice functions. It is simpler
 * to use than the flexible weaving API but it does let the user define the
 * static information provided to the advice functions.
 */
export type AspectTyping<
  initial_state extends Json = Json,
  state = unknown,
  atom extends Atom = Atom,
  valuation extends Valuation = Valuation,
> = {
  /**
   * The first advice called upon entering any block. It provides an oportunity
   * to overwrite the state that other advices will receive. That is that it
   * receives the state of the parent block and returns the state that will be
   * passed to the other advice of this block. If the block is the root block
   * -- ie a program block -- it will receive a clone of `config.initial_state`.
   */
  "program-block@setup": {
    pointcut: (kind: ProgramKind, tag: atom["Tag"]) => boolean;
    advice: (
      initial_state: initial_state,
      kind: ProgramKind,
      tag: atom["Tag"],
    ) => state;
  };
  "closure-block@setup": {
    pointcut: (kind: ClosureKind, tag: atom["Tag"]) => boolean;
    advice: (state: state, kind: ClosureKind, tag: atom["Tag"]) => state;
  };
  "segment-block@setup": {
    pointcut: (kind: SegmentKind, tag: atom["Tag"]) => boolean;
    advice: (state: state, kind: SegmentKind, tag: atom["Tag"]) => state;
  };
  /**
   * Called before entering a program block with the headers of the program.
   */
  "program-block@before": {
    pointcut: (kind: ProgramKind, tag: atom["Tag"]) => boolean;
    advice: <kind extends ProgramKind>(
      state: state,
      kind: kind,
      head: Header<kind>[],
      tag: atom["Tag"],
    ) => void;
  };
  /**
   * Called before entering a closure block.
   */
  "closure-block@before": {
    pointcut: (kind: ClosureKind, tag: atom["Tag"]) => boolean;
    advice: <kind extends ClosureKind>(
      state: state,
      kind: kind,
      tag: atom["Tag"],
    ) => void;
  };
  /**
   * Called before entering a segment block with the labels of the current
   * block.
   */
  "segment-block@before": {
    pointcut: (kind: SegmentKind, tag: atom["Tag"]) => boolean;
    advice: (
      state: state,
      kind: SegmentKind,
      labels: atom["Label"][],
      tag: atom["Tag"],
    ) => void;
  };
  /**
   * Called before entering any block. It provides the initial values of the
   * scope frame of the current block. Parameters such as `catch.error` may have
   * an arbitrary initial value but regular variables can initially only be
   * `undefined` or the intrinsic symbol `aran.deadzone`.
   */
  "block@declaration": {
    pointcut: (kind: ControlKind, tag: atom["Tag"]) => boolean;
    advice: (
      state: state,
      kind: ControlKind,
      frame: {
        [identifier in atom["Variable"] | Parameter]?: valuation["Scope"];
      },
      tag: atom["Tag"],
    ) => void;
  };
  /**
   * Same as `block@declaration` but it provides an opportunity to overwrite the
   * initial values of the scope frame of the current block. The advice
   * `block@declaration` does not provide this capability for performance
   * reasons.
   */
  "block@declaration-overwrite": {
    pointcut: (kind: ControlKind, tag: atom["Tag"]) => boolean;
    advice: <kind extends ControlKind>(
      state: state,
      kind: kind,
      frame: {
        [identifier in atom["Variable"] | Parameter]?: valuation["Scope"];
      },
      tag: atom["Tag"],
    ) => {
      [identifier in atom["Variable"] | Parameter]?: valuation["Scope"];
    };
  };
  /**
   * Called right before leaving the head of a generator function. That is right
   * before the generator returns its iterator. This advice will not be called
   * if the head of the generator threw an error. Note that the head and the
   * body of a generator are considered to be part of the same block.
   */
  "generator-block@suspension": {
    pointcut: (kind: GeneratorKind, tag: atom["Tag"]) => boolean;
    advice: (state: state, kind: GeneratorKind, tag: atom["Tag"]) => void;
  };
  /**
   * Called right after the first call to the `next` method of the iterator
   * returned by a generator. Note that the head and the body of a generator are
   * considered to be part of the same block.
   */
  "generator-block@resumption": {
    pointcut: (kind: GeneratorKind, tag: atom["Tag"]) => boolean;
    advice: (state: state, kind: GeneratorKind, tag: atom["Tag"]) => void;
  };
  /**
   * Called before leaving a program block with its return value. If an error
   * was thrown, this advice will not be called.
   */
  "program-block@after": {
    pointcut: (kind: ProgramKind, tag: atom["Tag"]) => boolean;
    advice: (
      state: state,
      kind: ProgramKind,
      value: valuation["Stack"],
      tag: atom["Tag"],
    ) => valuation["Other"];
  };
  /**
   * Called before leaving a closure block with its completion value. If an
   * error was thrown, this advice will not be called.
   */
  "closure-block@after": {
    pointcut: (kind: ClosureKind, tag: atom["Tag"]) => boolean;
    advice: (
      state: state,
      kind: ClosureKind,
      value: valuation["Stack"],
      tag: atom["Tag"],
    ) => valuation["Other"];
  };
  /**
   * Called before leaving a control block. If an error was thrown or if a label
   * was broken onto, this advice will not be called.
   */
  "segment-block@after": {
    pointcut: (kind: SegmentKind, tag: atom["Tag"]) => boolean;
    advice: (state: state, kind: SegmentKind, tag: atom["Tag"]) => void;
  };
  /**
   * Called before leaving any block only if an error was thrown.
   */
  "block@throwing": {
    pointcut: (kind: ControlKind, tag: atom["Tag"]) => boolean;
    advice: (
      state: state,
      kind: ControlKind,
      value: valuation["Other"],
      tag: atom["Tag"],
    ) => void;
  };
  /**
   * Called right before leaving any block regardless of how it terminated.
   */
  "block@teardown": {
    pointcut: (kind: ControlKind, tag: atom["Tag"]) => boolean;
    advice: (state: state, kind: ControlKind, tag: atom["Tag"]) => void;
  };
  /**
   * Called right before evaluating a break statement.
   */
  "break@before": {
    pointcut: (label: atom["Label"], tag: atom["Tag"]) => boolean;
    advice: (state: state, label: atom["Label"], tag: atom["Tag"]) => void;
  };
  /**
   * Called right before using a value as a boolean to branch the control flow.
   */
  "test@before": {
    pointcut: (kind: TestKind, tag: atom["Tag"]) => boolean;
    advice: (
      state: state,
      kind: TestKind,
      value: valuation["Stack"],
      tag: atom["Tag"],
    ) => boolean;
  };
  /**
   * Called right after an intrinsic value was read.
   */
  "intrinsic@after": {
    pointcut: (name: Intrinsic, tag: atom["Tag"]) => boolean;
    advice: (
      state: state,
      name: Intrinsic,
      value: valuation["Other"],
      tag: atom["Tag"],
    ) => valuation["Stack"];
  };
  /**
   * Called right after a primitive value was created.
   */
  "primitive@after": {
    pointcut: (primitive: RuntimePrimitive, tag: atom["Tag"]) => boolean;
    advice: (
      state: state,
      value: RuntimePrimitive,
      tag: atom["Tag"],
    ) => valuation["Stack"];
  };
  /**
   * Called right after a value was imported from another module.
   */
  "import@after": {
    pointcut: (
      source: atom["Source"],
      specifier: atom["Specifier"] | null,
      tag: atom["Tag"],
    ) => boolean;
    advice: (
      state: state,
      source: atom["Source"],
      specifier: atom["Specifier"] | null,
      value: valuation["Other"],
      tag: atom["Tag"],
    ) => valuation["Stack"];
  };
  /**
   * Called right after a closure was created. We use the term 'closure' because
   * we reserve the term 'function' for actual regular functions.
   */
  "closure@after": {
    pointcut: (kind: ClosureKind, tag: atom["Tag"]) => boolean;
    advice: (
      state: state,
      kind: ClosureKind,
      closure: valuation["Other"] & Function,
      tag: atom["Tag"],
    ) => valuation["Stack"];
  };
  /**
   * Called right after a value was read from the current scope. The variable is
   * guaranteed to exist in the current scope.
   */
  "read@after": {
    pointcut: (
      identifier: Parameter | atom["Variable"],
      tag: atom["Tag"],
    ) => boolean;
    advice: (
      state: state,
      identifier: Parameter | atom["Variable"],
      value: valuation["Scope"],
      tag: atom["Tag"],
    ) => valuation["Stack"];
  };
  /**
   * Called right before a value will be used as code to a direct eval call.
   * Supporting direct eval calls entails instrumenting this value. Otherwise,
   * this code will interact very poorly with the surrounding instrumented code.
   */
  "eval@before": {
    pointcut: (tag: atom["Tag"]) => boolean;
    advice: (
      state: state,
      value: valuation["Stack"],
      tag: atom["Tag"],
    ) => Program<Atom> & { kind: "eval"; situ: "local.deep" };
  };
  /**
   * Called right after returning from a direct eval call.
   */
  "eval@after": {
    pointcut: (tag: atom["Tag"]) => boolean;
    advice: (
      state: state,
      value: valuation["Other"],
      tag: atom["Tag"],
    ) => valuation["Stack"];
  };
  /**
   * Called right before a value will be used as a promise in a `await`
   * expression. That is that all the asynchronous closures at the top of the
   * callstack will be stashed away.
   */
  "await@before": {
    pointcut: (tag: atom["Tag"]) => boolean;
    advice: (
      state: state,
      value: valuation["Stack"],
      tag: atom["Tag"],
    ) => valuation["Other"];
  };
  /**
   * Called right after a promise used inside an `await` expression successfully
   * resolved. That is that the asynchronous closure stack will be restored.
   */
  "await@after": {
    pointcut: (tag: atom["Tag"]) => boolean;
    advice: (
      state: state,
      value: valuation["Other"],
      tag: atom["Tag"],
    ) => valuation["Stack"];
  };
  /**
   * Called right before a value will be used as an item in a `yield`
   * expression. That is that the current call will be stashed away.
   */
  "yield@before": {
    pointcut: (delegate: boolean, tag: atom["Tag"]) => boolean;
    advice: (
      state: state,
      delegate: boolean,
      value: valuation["Stack"],
      tag: atom["Tag"],
    ) => valuation["Other"];
  };
  /**
   * Called right after calling the `next` method of the iterator returned by a
   * generator. That is that the generator call will be restored.
   */
  "yield@after": {
    pointcut: (delegate: boolean, tag: atom["Tag"]) => boolean;
    advice: (
      state: state,
      delegate: boolean,
      value: valuation["Other"],
      tag: atom["Tag"],
    ) => valuation["Stack"];
  };
  /**
   * Called right after a value will actually *not* be used. For instance an
   * expression statement will trigger this advice because the value of the
   * expression has no use.
   */
  "drop@before": {
    pointcut: (tag: atom["Tag"]) => boolean;
    advice: (
      state: state,
      value: valuation["Stack"],
      tag: atom["Tag"],
    ) => valuation["Other"];
  };
  /**
   * Called right before a value will be exported from the current module.
   */
  "export@before": {
    pointcut: (specifier: atom["Specifier"], tag: atom["Tag"]) => boolean;
    advice: (
      state: state,
      specifier: atom["Specifier"],
      value: valuation["Stack"],
      tag: atom["Tag"],
    ) => valuation["Other"];
  };
  /**
   * Called right before a value will be used to update the current scope. The
   * variable is guaranteed to exist in the current scope.
   */
  "write@before": {
    pointcut: (
      identifier: Parameter | atom["Variable"],
      tag: atom["Tag"],
    ) => boolean;
    advice: (
      state: state,
      identifier: Parameter | atom["Variable"],
      value: valuation["Stack"],
      tag: atom["Tag"],
    ) => valuation["Scope"];
  };
  /**
   * Called in place of a closure regular call. The `this` argument has been
   * made explicit and the operation should be performed with `Reflect.apply`.
   */
  "apply@around": {
    pointcut: (tag: atom["Tag"]) => boolean;
    advice: (
      state: state,
      callee: valuation["Stack"],
      this_: valuation["Stack"],
      arguments_: valuation["Stack"][],
      tag: atom["Tag"],
    ) => valuation["Stack"];
  };
  /**
   * Called in place of a closure construct call. The operation should be
   * performed with `Reflect.construct`.
   */
  "construct@around": {
    pointcut: (tag: atom["Tag"]) => boolean;
    advice: (
      state: state,
      callee: valuation["Stack"],
      arguments_: valuation["Stack"][],
      tag: atom["Tag"],
    ) => valuation["Stack"];
  };
};

export type AspectKind = keyof AspectTyping<never, never, never>;

export type Aspect<
  initial_state extends Json = Json,
  state = unknown,
  atom extends Atom = Atom,
  valuation extends Valuation = Valuation,
> = {
  [key in AspectKind]?:
    | null
    | undefined
    | AspectTyping<initial_state, state, atom, valuation>[key]["advice"]
    | {
        pointcut:
          | boolean
          | AspectTyping<
              initial_state,
              state,
              atom,
              valuation
            >[key]["pointcut"];
        advice: AspectTyping<
          initial_state,
          state,
          atom,
          valuation
        >[key]["advice"];
      };
};

export type Advice<
  initial_state extends Json = Json,
  state = unknown,
  atom extends Atom = Atom,
  valuation extends Valuation = Valuation,
> = {
  [key in AspectKind]?:
    | null
    | undefined
    | AspectTyping<initial_state, state, atom, valuation>[key]["advice"];
};

export type ObjectPointcut<atom extends Atom = Atom> = {
  [key in AspectKind]?:
    | null
    | undefined
    | boolean
    | AspectTyping<never, never, atom, never>[key]["pointcut"];
};

export type ConstantPointcut = boolean;

export type ArrayPointcut = AspectKind[];

export type ArrowPointcut<T> = (kind: AspectKind, tag: T) => boolean;

export type Pointcut<atom extends Atom = Atom> =
  | ObjectPointcut<atom>
  | ArrowPointcut<atom["Tag"]>
  | ArrayPointcut
  | ConstantPointcut;
