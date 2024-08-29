import type { DeclareHeader, ModuleHeader } from "../../header";
import type { Intrinsic, Parameter, RuntimePrimitive } from "../../lang";
import type { Path } from "../../path";
import type { DeepLocalSitu } from "../../source";
import type { ValueOf } from "../../util";
import type { ArgVariable, Label } from "../atom";
import type {
  BlockKind,
  ClosureKind,
  ControlKind,
  GeneratorKind,
  Parametrization,
  ProgramKind,
  RoutineKind,
} from "../parametrization";

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

export type AspectTyping<X, V extends Valuation> = {
  // block //
  "block@setup": {
    pointcut: (kind: BlockKind, path: Path) => boolean;
    advice: (state: X, kind: BlockKind, path: Path) => X;
  };
  "program-block@definition": {
    pointcut: (kind: ProgramKind, path: Path) => boolean;
    advice: <K extends ProgramKind>(
      state: X,
      kind: K,
      head: Header<K>[],
      path: Path,
    ) => void;
  };
  "control-block@labeling": {
    pointcut: (kind: ControlKind, path: Path) => boolean;
    advice: (state: X, kind: ControlKind, labels: Label[], path: Path) => void;
  };
  "block@declaration": {
    pointcut: (kind: BlockKind, path: Path) => boolean;
    advice: <K extends BlockKind>(
      state: X,
      kind: K,
      frame: Frame<K, V["Scope"]>,
      path: Path,
    ) => void;
  };
  "block@declaration-overwrite": {
    pointcut: (kind: BlockKind, path: Path) => boolean;
    advice: <K extends BlockKind>(
      state: X,
      kind: K,
      frame: Frame<K, V["Scope"]>,
      path: Path,
    ) => Frame<K, V["Scope"]>;
  };
  "generator-block@suspension": {
    pointcut: (kind: GeneratorKind, path: Path) => boolean;
    advice: (state: X, kind: GeneratorKind, path: Path) => void;
  };
  "generator-block@resumption": {
    pointcut: (kind: GeneratorKind, path: Path) => boolean;
    advice: (state: X, kind: GeneratorKind, path: Path) => void;
  };
  "control-block@completion": {
    pointcut: (kind: ControlKind, path: Path) => boolean;
    advice: (state: X, kind: ControlKind, path: Path) => void;
  };
  "routine-block@completion": {
    pointcut: (kind: RoutineKind, path: Path) => boolean;
    advice: (
      state: X,
      kind: RoutineKind,
      value: V["Stack"],
      path: Path,
    ) => V["Other"];
  };
  "block@throwing": {
    pointcut: (kind: BlockKind, path: Path) => boolean;
    advice: (state: X, kind: BlockKind, value: V["Other"], path: Path) => void;
  };
  "block@teardown": {
    pointcut: (kind: BlockKind, path: Path) => boolean;
    advice: (state: X, kind: BlockKind, path: Path) => void;
  };
  // other //
  "break@before": {
    pointcut: (label: Label, path: Path) => boolean;
    advice: (state: X, label: Label, path: Path) => void;
  };
  "test@before": {
    pointcut: (kind: TestKind, path: Path) => boolean;
    advice: (
      state: X,
      kind: TestKind,
      value: V["Stack"],
      path: Path,
    ) => boolean;
  };
  "intrinsic@after": {
    pointcut: (name: Intrinsic, path: Path) => boolean;
    advice: (
      state: X,
      name: Intrinsic,
      value: V["Other"],
      path: Path,
    ) => V["Stack"];
  };
  "primitive@after": {
    pointcut: (primitive: RuntimePrimitive, path: Path) => boolean;
    advice: (
      state: X,
      value: V["Other"] & RuntimePrimitive,
      path: Path,
    ) => V["Stack"];
  };
  "import@after": {
    pointcut: (source: string, specifier: string | null, path: Path) => boolean;
    advice: (
      state: X,
      source: string,
      specifier: string | null,
      value: V["Other"],
      path: Path,
    ) => V["Stack"];
  };
  "closure@after": {
    pointcut: (kind: ClosureKind, path: Path) => boolean;
    advice: (
      state: X,
      kind: ClosureKind,
      closure: V["Other"] & Function,
      path: Path,
    ) => V["Stack"];
  };
  "read@after": {
    pointcut: (variable: Variable, path: Path) => boolean;
    advice: (
      state: X,
      variable: Variable,
      value: V["Scope"],
      path: Path,
    ) => V["Stack"];
  };
  "eval@before": {
    pointcut: (path: Path) => boolean;
    advice: (
      state: X,
      situ: DeepLocalSitu,
      value: V["Stack"],
      path: Path,
    ) => string | V["Other"];
  };
  "eval@after": {
    pointcut: (path: Path) => boolean;
    advice: (state: X, value: V["Other"], path: Path) => V["Stack"];
  };
  "await@before": {
    pointcut: (path: Path) => boolean;
    advice: (state: X, value: V["Stack"], path: Path) => V["Other"];
  };
  "await@after": {
    pointcut: (path: Path) => boolean;
    advice: (state: X, value: V["Other"], path: Path) => V["Stack"];
  };
  "yield@before": {
    pointcut: (delegate: boolean, path: Path) => boolean;
    advice: (
      state: X,
      delegate: boolean,
      value: V["Stack"],
      path: Path,
    ) => V["Other"];
  };
  "yield@after": {
    pointcut: (delegate: boolean, path: Path) => boolean;
    advice: (
      state: X,
      delegate: boolean,
      value: V["Other"],
      path: Path,
    ) => V["Stack"];
  };
  "drop@before": {
    pointcut: (path: Path) => boolean;
    advice: (state: X, value: V["Stack"], path: Path) => V["Other"];
  };
  "export@before": {
    pointcut: (specifier: string, path: Path) => boolean;
    advice: (
      state: X,
      specifier: string,
      value: V["Stack"],
      path: Path,
    ) => V["Other"];
  };
  "write@before": {
    pointcut: (variable: Variable, path: Path) => boolean;
    advice: (
      state: X,
      variable: Variable,
      value: V["Stack"],
      path: Path,
    ) => V["Scope"];
  };
  "apply@around": {
    pointcut: (path: Path) => boolean;
    advice: (
      state: X,
      callee: V["Stack"],
      this_: V["Stack"],
      arguments_: V["Stack"][],
      path: Path,
    ) => V["Stack"];
  };
  "construct@around": {
    pointcut: (path: Path) => boolean;
    advice: (
      state: X,
      callee: V["Stack"],
      arguments_: V["Stack"][],
      path: Path,
    ) => V["Stack"];
  };
};

export type Kind = keyof AspectTyping<never, never>;

export type Aspect<X, V extends Valuation> = {
  [key in Kind]?:
    | null
    | undefined
    | AspectTyping<X, V>[key]["advice"]
    | {
        pointcut: boolean | AspectTyping<X, V>[key]["pointcut"];
        advice: AspectTyping<X, V>[key]["advice"];
      };
};

export type UnknownAspect = Aspect<unknown, Valuation>;

export type Advice<X, V extends Valuation> = {
  [key in Kind]?: null | undefined | AspectTyping<X, V>[key]["advice"];
};

export type UnknownAdvice = Advice<unknown, Valuation>;

export type NormalPointcut = {
  [key in Kind]: AspectTyping<never, never>[key]["pointcut"];
};

export type ObjectPointcut = {
  [key in Kind]?:
    | null
    | undefined
    | boolean
    | AspectTyping<never, never>[key]["pointcut"];
};

export type ConstantPointcut = boolean;

export type ArrayPointcut = Kind[];

export type Pointcut = ObjectPointcut | ArrayPointcut | ConstantPointcut;
