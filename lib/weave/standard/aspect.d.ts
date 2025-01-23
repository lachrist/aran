import type { DeclareHeader, ModuleHeader } from "../../lang/header";
import type {
  Atom,
  Intrinsic,
  Parameter,
  Program,
  RuntimePrimitive,
} from "../../lang/syntax";
import type { Json, Merge, ValueOf } from "../../util/util";
import type {
  ControlKind,
  ProgramKind,
  ClosureKind,
  SegmentKind,
  GeneratorKind,
  Parametrization,
} from "../parametrization";

export type TestKind = "if" | "while" | "conditional";

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

export type Valuation = {
  StackValue: unknown;
  ScopeValue: unknown;
  OtherValue: unknown;
};

export type AspectParam = Atom &
  Valuation & {
    InitialState: Json;
    State: unknown;
  };

/**
 * The standard weaving API expects a global value at
 * `config.advice_variable` that holds all the advice functions. It is simpler
 * to use than the flexible weaving API but it does let the user define the
 * static information provided to the advice functions.
 */
export type AspectTyping<param extends AspectParam = AspectParam> = {
  /**
   * The first advice called upon entering any block. It provides an oportunity
   * to overwrite the state that other advices will receive. That is that it
   * receives the state of the parent block and returns the state that will be
   * passed to the other advice of this block. If the block is the root block
   * -- ie a program block -- it will receive a clone of `config.initial_state`.
   */
  "program-block@setup": {
    pointcut: (kind: ProgramKind, tag: param["Tag"]) => boolean;
    advice: (
      initial_state: param["InitialState"],
      kind: ProgramKind,
      tag: param["Tag"],
    ) => param["State"];
  };
  "closure-block@setup": {
    pointcut: (kind: ClosureKind, tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      kind: ClosureKind,
      tag: param["Tag"],
    ) => param["State"];
  };
  "segment-block@setup": {
    pointcut: (kind: SegmentKind, tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      kind: SegmentKind,
      tag: param["Tag"],
    ) => param["State"];
  };
  /**
   * Called before entering a program block with the headers of the program.
   */
  "program-block@before": {
    pointcut: (kind: ProgramKind, tag: param["Tag"]) => boolean;
    advice: <kind extends ProgramKind>(
      state: param["State"],
      kind: kind,
      head: Header<kind>[],
      tag: param["Tag"],
    ) => void;
  };
  /**
   * Called before entering a closure block.
   */
  "closure-block@before": {
    pointcut: (kind: ClosureKind, tag: param["Tag"]) => boolean;
    advice: <kind extends ClosureKind>(
      state: param["State"],
      kind: kind,
      tag: param["Tag"],
    ) => void;
  };
  /**
   * Called before entering a segment block with the labels of the current
   * block.
   */
  "segment-block@before": {
    pointcut: (kind: SegmentKind, tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      kind: SegmentKind,
      labels: param["Label"][],
      tag: param["Tag"],
    ) => void;
  };
  /**
   * Called before entering any block. It provides the initial values of the
   * scope frame of the current block. Parameters such as `catch.error` may have
   * an arbitrary initial value but regular variables can initially only be
   * `undefined` or the intrinsic symbol `aran.deadzone`.
   */
  "block@declaration": {
    pointcut: (kind: ControlKind, tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      kind: ControlKind,
      frame: {
        [identifier in param["Variable"] | Parameter]?: param["ScopeValue"];
      },
      tag: param["Tag"],
    ) => void;
  };
  /**
   * Same as `block@declaration` but it provides an opportunity to overwrite the
   * initial values of the scope frame of the current block. The advice
   * `block@declaration` does not provide this capability for performance
   * reasons.
   */
  "block@declaration-overwrite": {
    pointcut: (kind: ControlKind, tag: param["Tag"]) => boolean;
    advice: <kind extends ControlKind>(
      state: param["State"],
      kind: kind,
      frame: {
        [identifier in param["Variable"] | Parameter]?: param["ScopeValue"];
      },
      tag: param["Tag"],
    ) => {
      [identifier in param["Variable"] | Parameter]?: param["ScopeValue"];
    };
  };
  /**
   * Called right before leaving the head of a generator function. That is right
   * before the generator returns its iterator. This advice will not be called
   * if the head of the generator threw an error. Note that the head and the
   * body of a generator are considered to be part of the same block.
   */
  "generator-block@suspension": {
    pointcut: (kind: GeneratorKind, tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      kind: GeneratorKind,
      tag: param["Tag"],
    ) => void;
  };
  /**
   * Called right after the first call to the `next` method of the iterator
   * returned by a generator. Note that the head and the body of a generator are
   * considered to be part of the same block.
   */
  "generator-block@resumption": {
    pointcut: (kind: GeneratorKind, tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      kind: GeneratorKind,
      tag: param["Tag"],
    ) => void;
  };
  /**
   * Called before leaving a program block with its return value. If an error
   * was thrown, this advice will not be called.
   */
  "program-block@after": {
    pointcut: (kind: ProgramKind, tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      kind: ProgramKind,
      value: param["StackValue"],
      tag: param["Tag"],
    ) => param["OtherValue"];
  };
  /**
   * Called before leaving a closure block with its completion value. If an
   * error was thrown, this advice will not be called.
   */
  "closure-block@after": {
    pointcut: (kind: ClosureKind, tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      kind: ClosureKind,
      value: param["StackValue"],
      tag: param["Tag"],
    ) => param["OtherValue"];
  };
  /**
   * Called before leaving a control block. If an error was thrown or if a label
   * was broken onto, this advice will not be called.
   */
  "segment-block@after": {
    pointcut: (kind: SegmentKind, tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      kind: SegmentKind,
      tag: param["Tag"],
    ) => void;
  };
  /**
   * Called before leaving any block only if an error was thrown.
   */
  "block@throwing": {
    pointcut: (kind: ControlKind, tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      kind: ControlKind,
      value: param["OtherValue"],
      tag: param["Tag"],
    ) => void;
  };
  /**
   * Called right before leaving any block regardless of how it terminated.
   */
  "block@teardown": {
    pointcut: (kind: ControlKind, tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      kind: ControlKind,
      tag: param["Tag"],
    ) => void;
  };
  /**
   * Called right before evaluating a break statement.
   */
  "break@before": {
    pointcut: (label: param["Label"], tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      label: param["Label"],
      tag: param["Tag"],
    ) => void;
  };
  /**
   * Called right before using a value as a boolean to branch the control flow.
   */
  "test@before": {
    pointcut: (kind: TestKind, tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      kind: TestKind,
      value: param["StackValue"],
      tag: param["Tag"],
    ) => boolean;
  };
  /**
   * Called right after an intrinsic value was read.
   */
  "intrinsic@after": {
    pointcut: (name: Intrinsic, tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      name: Intrinsic,
      value: param["OtherValue"],
      tag: param["Tag"],
    ) => param["StackValue"];
  };
  /**
   * Called right after a primitive value was created.
   */
  "primitive@after": {
    pointcut: (primitive: RuntimePrimitive, tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      value: RuntimePrimitive,
      tag: param["Tag"],
    ) => param["StackValue"];
  };
  /**
   * Called right after a value was imported from another module.
   */
  "import@after": {
    pointcut: (
      source: param["Source"],
      specifier: param["Specifier"] | null,
      tag: param["Tag"],
    ) => boolean;
    advice: (
      state: param["State"],
      source: param["Source"],
      specifier: param["Specifier"] | null,
      value: param["OtherValue"],
      tag: param["Tag"],
    ) => param["StackValue"];
  };
  /**
   * Called right after a closure was created. We use the term 'closure' because
   * we reserve the term 'function' for actual regular functions.
   */
  "closure@after": {
    pointcut: (kind: ClosureKind, tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      kind: ClosureKind,
      closure: param["OtherValue"] & Function,
      tag: param["Tag"],
    ) => param["StackValue"];
  };
  /**
   * Called right after a value was read from the current scope. The variable is
   * guaranteed to exist in the current scope.
   */
  "read@after": {
    pointcut: (
      identifier: Parameter | param["Variable"],
      tag: param["Tag"],
    ) => boolean;
    advice: (
      state: param["State"],
      identifier: Parameter | param["Variable"],
      value: param["ScopeValue"],
      tag: param["Tag"],
    ) => param["StackValue"];
  };
  /**
   * Called right before a value will be used as code to a direct eval call.
   * Supporting direct eval calls entails instrumenting this value. Otherwise,
   * this code will interact very poorly with the surrounding instrumented code.
   */
  "eval@before": {
    pointcut: (tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      value: param["StackValue"],
      tag: param["Tag"],
    ) => Program<Atom> & { kind: "eval"; situ: "local.deep" };
  };
  /**
   * Called right after returning from a direct eval call.
   */
  "eval@after": {
    pointcut: (tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      value: param["OtherValue"],
      tag: param["Tag"],
    ) => param["StackValue"];
  };
  /**
   * Called right before a value will be used as a promise in a `await`
   * expression. That is that all the asynchronous closures at the top of the
   * callstack will be stashed away.
   */
  "await@before": {
    pointcut: (tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      value: param["StackValue"],
      tag: param["Tag"],
    ) => param["OtherValue"];
  };
  /**
   * Called right after a promise used inside an `await` expression successfully
   * resolved. That is that the asynchronous closure stack will be restored.
   */
  "await@after": {
    pointcut: (tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      value: param["OtherValue"],
      tag: param["Tag"],
    ) => param["StackValue"];
  };
  /**
   * Called right before a value will be used as an item in a `yield`
   * expression. That is that the current call will be stashed away.
   */
  "yield@before": {
    pointcut: (delegate: boolean, tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      delegate: boolean,
      value: param["StackValue"],
      tag: param["Tag"],
    ) => param["OtherValue"];
  };
  /**
   * Called right after calling the `next` method of the iterator returned by a
   * generator. That is that the generator call will be restored.
   */
  "yield@after": {
    pointcut: (delegate: boolean, tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      delegate: boolean,
      value: param["OtherValue"],
      tag: param["Tag"],
    ) => param["StackValue"];
  };
  /**
   * Called right after a value will actually *not* be used. For instance an
   * expression statement will trigger this advice because the value of the
   * expression has no use.
   */
  "drop@before": {
    pointcut: (tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      value: param["StackValue"],
      tag: param["Tag"],
    ) => param["OtherValue"];
  };
  /**
   * Called right before a value will be exported from the current module.
   */
  "export@before": {
    pointcut: (specifier: param["Specifier"], tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      specifier: param["Specifier"],
      value: param["StackValue"],
      tag: param["Tag"],
    ) => param["OtherValue"];
  };
  /**
   * Called right before a value will be used to update the current scope. The
   * variable is guaranteed to exist in the current scope.
   */
  "write@before": {
    pointcut: (
      identifier: Parameter | param["Variable"],
      tag: param["Tag"],
    ) => boolean;
    advice: (
      state: param["State"],
      identifier: Parameter | param["Variable"],
      value: param["StackValue"],
      tag: param["Tag"],
    ) => param["ScopeValue"];
  };
  /**
   * Called in place of a closure regular call. The `this` argument has been
   * made explicit and the operation should be performed with `Reflect.apply`.
   */
  "apply@around": {
    pointcut: (tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      callee: param["StackValue"],
      this_: param["StackValue"],
      arguments_: param["StackValue"][],
      tag: param["Tag"],
    ) => param["StackValue"];
  };
  /**
   * Called in place of a closure construct call. The operation should be
   * performed with `Reflect.construct`.
   */
  "construct@around": {
    pointcut: (tag: param["Tag"]) => boolean;
    advice: (
      state: param["State"],
      callee: param["StackValue"],
      arguments_: param["StackValue"][],
      tag: param["Tag"],
    ) => param["StackValue"];
  };
};

export type AspectKind = keyof AspectTyping<never>;

export type Advice<
  kind extends AspectKind | unknown = unknown,
  param extends AspectParam = AspectParam,
> = kind extends AspectKind
  ? {
      [key in kind]: AspectTyping<param>[key]["advice"];
    }
  : {
      [key in AspectKind]?:
        | null
        | undefined
        | AspectTyping<param>[key]["advice"];
    };

export type ObjectPointcut<atom extends Atom = Atom> = {
  [key in AspectKind]?:
    | null
    | undefined
    | boolean
    | AspectTyping<Merge<AspectParam, Pick<atom, keyof Atom>>>[key]["pointcut"];
};

export type ConstantPointcut = boolean;

export type ArrayPointcut = AspectKind[];

export type ArrowPointcut<T> = (kind: AspectKind, tag: T) => boolean;

export type Pointcut<atom extends Atom = Atom> =
  | ObjectPointcut<atom>
  | ArrowPointcut<atom["Tag"]>
  | ArrayPointcut
  | ConstantPointcut;
