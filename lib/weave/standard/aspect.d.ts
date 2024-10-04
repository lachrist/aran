import type { SourceValue, SpecifierValue, SpecifierName } from "estree-sentry";
import type { DeclareHeader, ModuleHeader } from "../../header";
import type { Intrinsic, Parameter, RuntimePrimitive } from "../../lang";
import type { DeepLocalSitu } from "../../source";
import type { ValueOf } from "../../util";
import type { ArgVariable, Label } from "../atom";
import type {
  BlockKind,
  ProgramKind,
  ClosureKind,
  ControlKind,
  GeneratorKind,
  Parametrization,
} from "../parametrization";
import type { Hash } from "../../hash";

export type Variable = ArgVariable | Parameter;

export type TestKind = "if" | "while" | "conditional";

type Valuation = {
  Stack: unknown;
  Scope: unknown;
  Other: unknown;
};

export type Frame<K extends BlockKind, V> = {
  [key in Variable]?: V;
} & {
  [key in Parametrization[K]]: V;
};

export type PreciseFrame<V> = ValueOf<{
  [K in BlockKind]: {
    type: K;
    data: {
      [key in Variable | Parameter]?: V;
    } & {
      [key in Parametrization[K]]: V;
    };
  };
}>;

export type Header<K extends ProgramKind> = K extends "module"
  ? ModuleHeader[]
  : K extends "script" | "eval.global" | "eval.glocal.root"
    ? DeclareHeader[]
    : K extends "eval.local.deep"
      ? []
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
export type AspectTyping<H, X, V extends Valuation> = {
  /**
   * The first advice called upon entering any block. It provides an oportunity
   * to overwrite the state that other advices will receive. That is that it
   * receives the state of the parent block and returns the state that will be
   * passed to the other advice of this block. If the block is the root block
   * -- ie a program block -- it will receive a clone of `config.initial_state`.
   */
  "block@setup": {
    pointcut: (kind: BlockKind, hash: H) => boolean;
    advice: (state: X, kind: BlockKind, hash: H) => X;
  };
  /**
   * Called before entering a program block with the headers of the program.
   */
  "program-block@before": {
    pointcut: (kind: ProgramKind, hash: H) => boolean;
    advice: <K extends ProgramKind>(
      state: X,
      kind: K,
      head: Header<K>[],
      hash: H,
    ) => void;
  };
  /**
   * Called before entering a closure block.
   */
  "closure-block@before": {
    pointcut: (kind: ClosureKind, hash: H) => boolean;
    advice: <K extends ClosureKind>(state: X, kind: K, hash: H) => void;
  };
  /**
   * Called before entering a control block with the labels of the current
   * block.
   */
  "control-block@before": {
    pointcut: (kind: ControlKind, hash: H) => boolean;
    advice: (state: X, kind: ControlKind, labels: Label[], hash: H) => void;
  };
  /**
   * Called before entering any block. It provides the initial values of the
   * scope frame of the current block. Parameters such as `catch.error` may have
   * an arbitrary initial value but regular variables can initially only be
   * `undefined` or the intrinsic symbol `aran.deadzone`.
   */
  "block@declaration": {
    pointcut: (kind: BlockKind, hash: H) => boolean;
    advice: <K extends BlockKind>(
      state: X,
      kind: K,
      frame: Frame<K, V["Scope"]>,
      hash: H,
    ) => void;
  };
  /**
   * Same as `block@declaration` but it provides an opportunity to overwrite the
   * initial values of the scope frame of the current block. The advice
   * `block@declaration` does not provide this capability for performance
   * reasons.
   */
  "block@declaration-overwrite": {
    pointcut: (kind: BlockKind, hash: H) => boolean;
    advice: <K extends BlockKind>(
      state: X,
      kind: K,
      frame: Frame<K, V["Scope"]>,
      hash: H,
    ) => Frame<K, V["Scope"]>;
  };
  /**
   * Called right before leaving the head of a generator function. That is right
   * before the generator returns its iterator. This advice will not be called
   * if the head of the generator threw an error. Note that the head and the
   * body of a generator are considered to be part of the same block.
   */
  "generator-block@suspension": {
    pointcut: (kind: GeneratorKind, hash: H) => boolean;
    advice: (state: X, kind: GeneratorKind, hash: H) => void;
  };
  /**
   * Called right after the first call to the `next` method of the iterator
   * returned by a generator. Note that the head and the body of a generator are
   * considered to be part of the same block.
   */
  "generator-block@resumption": {
    pointcut: (kind: GeneratorKind, hash: H) => boolean;
    advice: (state: X, kind: GeneratorKind, hash: H) => void;
  };
  /**
   * Called before leaving a program block with its return value. If an error
   * was thrown, this advice will not be called.
   */
  "program-block@after": {
    pointcut: (kind: ProgramKind, hash: H) => boolean;
    advice: (
      state: X,
      kind: ProgramKind,
      value: V["Stack"],
      hash: H,
    ) => V["Other"];
  };
  /**
   * Called before leaving a closure block with its completion value. If an
   * error was thrown, this advice will not be called.
   */
  "closure-block@after": {
    pointcut: (kind: ClosureKind, hash: H) => boolean;
    advice: (
      state: X,
      kind: ClosureKind,
      value: V["Stack"],
      hash: H,
    ) => V["Other"];
  };
  /**
   * Called before leaving a control block. If an error was thrown or if a label
   * was broken onto, this advice will not be called.
   */
  "control-block@after": {
    pointcut: (kind: ControlKind, hash: H) => boolean;
    advice: (state: X, kind: ControlKind, hash: H) => void;
  };
  /**
   * Called before leaving any block only if an error was thrown.
   */
  "block@throwing": {
    pointcut: (kind: BlockKind, hash: H) => boolean;
    advice: (state: X, kind: BlockKind, value: V["Other"], hash: H) => void;
  };
  /**
   * Called right before leaving any block regardless of how it terminated.
   */
  "block@teardown": {
    pointcut: (kind: BlockKind, hash: H) => boolean;
    advice: (state: X, kind: BlockKind, hash: H) => void;
  };
  /**
   * Called right before evaluating a break statement.
   */
  "break@before": {
    pointcut: (label: Label, hash: H) => boolean;
    advice: (state: X, label: Label, hash: H) => void;
  };
  /**
   * Called right before using a value as a boolean to branch the control flow.
   */
  "test@before": {
    pointcut: (kind: TestKind, hash: H) => boolean;
    advice: (state: X, kind: TestKind, value: V["Stack"], hash: H) => boolean;
  };
  /**
   * Called right after an intrinsic value was read.
   */
  "intrinsic@after": {
    pointcut: (name: Intrinsic, hash: H) => boolean;
    advice: (
      state: X,
      name: Intrinsic,
      value: V["Other"],
      hash: H,
    ) => V["Stack"];
  };
  /**
   * Called right after a primitive value was created.
   */
  "primitive@after": {
    pointcut: (primitive: RuntimePrimitive, hash: H) => boolean;
    advice: (
      state: X,
      value: V["Other"] & RuntimePrimitive,
      hash: H,
    ) => V["Stack"];
  };
  /**
   * Called right after a value was imported from another module.
   */
  "import@after": {
    pointcut: (
      source: SourceValue,
      specifier: SpecifierName | SpecifierValue | null,
      hash: H,
    ) => boolean;
    advice: (
      state: X,
      source: SourceValue,
      specifier: SpecifierName | SpecifierValue | null,
      value: V["Other"],
      hash: H,
    ) => V["Stack"];
  };
  /**
   * Called right after a closure was created. We use the term 'closure' because
   * we reserve the term 'function' for actual regular functions.
   */
  "closure@after": {
    pointcut: (kind: ClosureKind, hash: H) => boolean;
    advice: (
      state: X,
      kind: ClosureKind,
      closure: V["Other"] & Function,
      hash: H,
    ) => V["Stack"];
  };
  /**
   * Called right after a value was read from the current scope. The variable is
   * guaranteed to exist in the current scope.
   */
  "read@after": {
    pointcut: (variable: Variable, hash: H) => boolean;
    advice: (
      state: X,
      variable: Variable,
      value: V["Scope"],
      hash: H,
    ) => V["Stack"];
  };
  /**
   * Called right before a value will be used as code to a direct eval call.
   * Supporting direct eval calls entails instrumenting this value. Otherwise,
   * this code will interact very poorly with the surrounding instrumented code.
   */
  "eval@before": {
    pointcut: (hash: H) => boolean;
    advice: (
      state: X,
      situ: DeepLocalSitu,
      value: V["Stack"],
      hash: H,
    ) => string | V["Stack"];
  };
  /**
   * Called right after returning from a direct eval call.
   */
  "eval@after": {
    pointcut: (hash: H) => boolean;
    advice: (state: X, value: V["Other"], hash: H) => V["Stack"];
  };
  /**
   * Called right before a value will be used as a promise in a `await`
   * expression. That is that all the asynchronous closures at the top of the
   * callstack will be stashed away.
   */
  "await@before": {
    pointcut: (hash: H) => boolean;
    advice: (state: X, value: V["Stack"], hash: H) => V["Other"];
  };
  /**
   * Called right after a promise used inside an `await` expression successfully
   * resolved. That is that the asynchronous closure stack will be restored.
   */
  "await@after": {
    pointcut: (hash: H) => boolean;
    advice: (state: X, value: V["Other"], hash: H) => V["Stack"];
  };
  /**
   * Called right before a value will be used as an item in a `yield`
   * expression. That is that the current call will be stashed away.
   */
  "yield@before": {
    pointcut: (delegate: boolean, hash: H) => boolean;
    advice: (
      state: X,
      delegate: boolean,
      value: V["Stack"],
      hash: H,
    ) => V["Other"];
  };
  /**
   * Called right after calling the `next` method of the iterator returned by a
   * generator. That is that the generator call will be restored.
   */
  "yield@after": {
    pointcut: (delegate: boolean, hash: H) => boolean;
    advice: (
      state: X,
      delegate: boolean,
      value: V["Other"],
      hash: H,
    ) => V["Stack"];
  };
  /**
   * Called right after a value will actually *not* be used. For instance an
   * expression statement will trigger this advice because the value of the
   * expression has no use.
   */
  "drop@before": {
    pointcut: (hash: H) => boolean;
    advice: (state: X, value: V["Stack"], hash: H) => V["Other"];
  };
  /**
   * Called right before a value will be exported from the current module.
   */
  "export@before": {
    pointcut: (specifier: SpecifierName | SpecifierValue, hash: H) => boolean;
    advice: (
      state: X,
      specifier: SpecifierName | SpecifierValue,
      value: V["Stack"],
      hash: H,
    ) => V["Other"];
  };
  /**
   * Called right before a value will be used to update the current scope. The
   * variable is guaranteed to exist in the current scope.
   */
  "write@before": {
    pointcut: (variable: Variable, hash: H) => boolean;
    advice: (
      state: X,
      variable: Variable,
      value: V["Stack"],
      hash: H,
    ) => V["Scope"];
  };
  /**
   * Called in place of a closure regular call. The `this` argument has been
   * made explicit and the operation should be performed with `Reflect.apply`.
   */
  "apply@around": {
    pointcut: (hash: H) => boolean;
    advice: (
      state: X,
      callee: V["Stack"],
      this_: V["Stack"],
      arguments_: V["Stack"][],
      hash: H,
    ) => V["Stack"];
  };
  /**
   * Called in place of a closure construct call. The operation should be
   * performed with `Reflect.construct`.
   */
  "construct@around": {
    pointcut: (hash: H) => boolean;
    advice: (
      state: X,
      callee: V["Stack"],
      arguments_: V["Stack"][],
      hash: H,
    ) => V["Stack"];
  };
};

export type Kind = keyof AspectTyping<never, never, never>;

export type Aspect<H, X, V extends Valuation> = {
  [key in Kind]?:
    | null
    | undefined
    | AspectTyping<H, X, V>[key]["advice"]
    | {
        pointcut: boolean | AspectTyping<H, X, V>[key]["pointcut"];
        advice: AspectTyping<H, X, V>[key]["advice"];
      };
};

export type UnknownAspect<H> = Aspect<H, unknown, Valuation>;

export type Advice<H, X, V extends Valuation> = {
  [key in Kind]?: null | undefined | AspectTyping<H, X, V>[key]["advice"];
};

export type UnknownAdvice<H> = Advice<H, unknown, Valuation>;

export type NormalPointcut = {
  [key in Kind]: AspectTyping<Hash, never, never>[key]["pointcut"];
};

export type ObjectPointcut<H> = {
  [key in Kind]?:
    | null
    | undefined
    | boolean
    | AspectTyping<H, never, never>[key]["pointcut"];
};

export type ConstantPointcut = boolean;

export type ArrayPointcut = Kind[];

export type ArrowPointcut<H> = (kind: Kind, hash: H) => boolean;

export type Pointcut<H> =
  | ObjectPointcut<H>
  | ArrowPointcut<H>
  | ArrayPointcut
  | ConstantPointcut;
