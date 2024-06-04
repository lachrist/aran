import type {
  DeepLocalEvalProgramHeader,
  ModuleProgramHeader,
  RootLocalEvalProgramHeader,
  ScriptProgramHeader,
} from "../../header";
import type { Intrinsic, Parameter, RuntimePrimitive } from "../../lang";
import type { Path } from "../../path";
import type { DeepLocalContext, GlobalEvalProgram } from "../../program";
import type { ArgVariable, Label } from "../atom";
import type { Parametrization } from "../parametrization";

export type Variable = ArgVariable | Parameter;

export type ProgramKind =
  | "module"
  | "script"
  | "eval.global"
  | "eval.local.root"
  | "eval.local.deep";

export type ClosureKind =
  | "arrow"
  | "arrow.async"
  | "function"
  | "function.async"
  | "function.generator"
  | "function.async.generator";

export type RoutineKind = ProgramKind | ClosureKind;

export type ControlKind =
  | "try"
  | "catch"
  | "finally"
  | "then"
  | "else"
  | "while"
  | "bare";

export type BlockKind = RoutineKind | ControlKind;

export type TestKind = "if" | "while" | "conditional";

type Value = {
  Stack: unknown;
  Scope: unknown;
  Other: unknown;
};

export type VariableFrame<V> = { [key in Variable]: V };

export type ParameterFrame<K extends BlockKind, V> = {
  [key in Parametrization[K]]: V;
};

export type Frame<K extends BlockKind, V> = VariableFrame<V> &
  ParameterFrame<K, V>;

export type SetupInput<X> =
  | [parent: X, kind: "module", head: ModuleProgramHeader[], path: Path]
  | [parent: X, kind: "script", head: ScriptProgramHeader[], path: Path]
  | [parent: X, kind: "eval.global", head: GlobalEvalProgram[], path: Path]
  | [
      parent: X,
      kind: "eval.local.root",
      head: RootLocalEvalProgramHeader[],
      path: Path,
    ]
  | [
      parent: X,
      kind: "eval.local.deep",
      head: DeepLocalEvalProgramHeader[],
      path: Path,
    ]
  | [parent: X, kind: RoutineKind, head: [], path: Path]
  | [parent: X, kind: ControlKind, head: [Label], path: Path];

export type FrameInput<X, V> =
  | [state: X, kind: "module", frame: Frame<"module", V>, path: Path]
  | [state: X, kind: "script", frame: Frame<"script", V>, path: Path]
  | [state: X, kind: "eval.global", frame: Frame<"eval.global", V>, path: Path]
  | [
      state: X,
      kind: "eval.local.root",
      frame: Frame<"eval.local.root", V>,
      path: Path,
    ]
  | [
      state: X,
      kind: "eval.local.deep",
      frame: Frame<"eval.local.deep", V>,
      path: Path,
    ]
  | [state: X, kind: "function", frame: Frame<"function", V>, path: Path]
  | [
      state: X,
      kind: "function.async",
      frame: Frame<"function.async", V>,
      path: Path,
    ]
  | [
      state: X,
      kind: "function.generator",
      frame: Frame<"function.generator", V>,
      path: Path,
    ]
  | [
      state: X,
      kind: "function.async.generator",
      frame: Frame<"function.async.generator", V>,
      path: Path,
    ]
  | [state: X, kind: "arrow", frame: Frame<"arrow", V>, path: Path]
  | [state: X, kind: "arrow.async", frame: Frame<"arrow", V>, path: Path]
  | [state: X, kind: "catch", frame: Frame<"catch", V>, path: Path]
  | [state: X, kind: "try", frame: Frame<"try", V>, path: Path]
  | [state: X, kind: "finally", frame: Frame<"finally", V>, path: Path]
  | [state: X, kind: "then", frame: Frame<"then", V>, path: Path]
  | [state: X, kind: "else", frame: Frame<"else", V>, path: Path]
  | [state: X, kind: "while", frame: Frame<"while", V>, path: Path]
  | [state: X, kind: "bare", frame: Frame<"bare", V>, path: Path];

export type SuccessInput<X, V> =
  | [state: X, kind: ControlKind, value: undefined, path: Path]
  | [state: X, kind: RoutineKind, value: V, path: Path];

export type Aspect<X, V extends Value> = {
  "block@setup": {
    pointcut: (kind: BlockKind, path: Path) => boolean;
    advice: (...input: SetupInput<X>) => X;
  };
  "block@frame": {
    pointcut: (kind: BlockKind, path: Path) => boolean;
    advice: (...input: FrameInput<X, V["Other"]>) => void;
  };
  "block@overframe": {
    pointcut: (kind: BlockKind, path: Path) => boolean;
    advice: (...input: FrameInput<X, V["Other"]>) => {
      [key in Variable]: V["Scope"];
    };
  };
  "block@success": {
    pointcut: (kind: BlockKind, path: Path) => boolean;
    advice: <K extends BlockKind>(
      state: X,
      kind: K,
      value: K extends RoutineKind
        ? V["Stack"]
        : K extends ControlKind
        ? undefined
        : never,
      path: Path,
    ) => K extends RoutineKind
      ? V["Other"]
      : K extends ControlKind
      ? void
      : never;
  };
  "block@failure": {
    pointcut: (kind: BlockKind, path: Path) => boolean;
    advice: (
      state: X,
      kind: BlockKind,
      value: V["Other"],
      path: Path,
    ) => V["Other"];
  };
  "block@teardown": {
    pointcut: (kind: BlockKind, path: Path) => boolean;
    advice: (state: X, kind: BlockKind, path: Path) => void;
  };
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
      value: unknown,
      path: Path,
    ) => V["Stack"];
  };
  "primitive@after": {
    pointcut: (primitive: RuntimePrimitive, path: Path) => boolean;
    advice: (state: X, value: RuntimePrimitive, path: Path) => V["Stack"];
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
    pointcut: (
      kind: "arrow" | "function",
      asynchronous: boolean,
      generator: boolean,
      path: Path,
    ) => boolean;
    advice: (
      state: X,
      kind: "arrow" | "function",
      asynchronous: boolean,
      generator: boolean,
      closure: Function,
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
      value: V["Stack"],
      context: DeepLocalContext,
      path: Path,
    ) => string | undefined;
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
  "return@before": {
    pointcut: (path: Path) => boolean;
    advice: (state: X, value: V["Stack"], path: Path) => V["Other"];
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

export type AspectKind = keyof Aspect<never, never>;

export type Advice<X, V extends Value> = {
  [key in AspectKind]?: Aspect<X, V>[key]["advice"];
};

export type NormalPointcut = {
  [key in AspectKind]: Aspect<never, never>[key]["pointcut"];
};

export type ObjectPointcut = {
  [key in AspectKind]:
    | boolean
    | undefined
    | Aspect<never, never>[key]["pointcut"];
};

export type ConstantPointcut = boolean;

export type IterablePointcut = Iterable<AspectKind>;

export type Pointcut = ObjectPointcut | IterablePointcut | ConstantPointcut;
