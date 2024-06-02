import type {
  DeepLocalEvalProgramHeader,
  ModuleProgramHeader,
  RootLocalEvalProgramHeader,
  ScriptProgramHeader,
} from "../../header";
import type { Intrinsic, Parameter, RuntimePrimitive } from "../../lang";
import type { Path } from "../../path";
import type { DeepLocalContext, GlobalEvalProgram } from "../../program";
import type { Label, ArgVariable as Variable } from "../atom";
import type { Parametrization } from "../parametrization";
import type { TestKind, BlockKind, RoutineKind, ControlKind } from "./pointcut";

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

export type Value = {
  Stack: unknown;
  Scope: unknown;
  Other: unknown;
};

export type Advice<X, V extends Value> = {
  "block@setup"?: (...input: SetupInput<X>) => X;
  "block@frame"?: (...input: FrameInput<X, V["Stack"]>) => void;
  "block@overframe": (...input: FrameInput<X, V["Stack"]>) => {
    [key in Variable | Parameter]: V["Scope"];
  };
  "block@success": <K extends BlockKind>(
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
  "block@failure"?: (
    state: X,
    kind: BlockKind,
    value: V["Other"],
    path: Path,
  ) => V["Other"];
  "block@teardown"?: (state: X, kind: BlockKind, path: Path) => void;
  "break@before"?: (state: X, label: Label, path: Path) => void;
  "test@before"?: (
    state: X,
    kind: TestKind,
    value: V["Stack"],
    path: Path,
  ) => boolean;
  "intrinsic@after"?: (
    state: X,
    name: Intrinsic,
    value: unknown,
    path: Path,
  ) => V["Stack"];
  "primitive@after"?: (
    state: X,
    value: RuntimePrimitive,
    path: Path,
  ) => V["Stack"];
  "import@after"?: (
    state: X,
    source: string,
    specifier: string | null,
    value: V["Other"],
    path: Path,
  ) => V["Stack"];
  "closure@after"?: (
    state: X,
    kind: "arrow" | "function",
    asynchronous: boolean,
    generator: boolean,
    closure: Function,
    path: Path,
  ) => V["Stack"];
  "read@after"?: (
    state: X,
    variable: Variable,
    value: V["Scope"],
    path: Path,
  ) => V["Stack"];
  "eval@before"?: (
    state: X,
    value: V["Stack"],
    context: DeepLocalContext,
    path: Path,
  ) => string | undefined | null;
  "eval@after"?: (state: X, value: V["Other"], path: Path) => V["Stack"];
  "await@before"?: (state: X, value: V["Stack"], path: Path) => V["Other"];
  "await@after"?: (state: X, value: V["Other"], path: Path) => V["Stack"];
  "yield@before"?: (
    state: X,
    delegate: boolean,
    value: V["Stack"],
    path: Path,
  ) => V["Other"];
  "yield@after"?: (
    state: X,
    delegate: boolean,
    value: V["Other"],
    path: Path,
  ) => V["Stack"];
  "drop@before"?: (state: X, value: V["Stack"], path: Path) => V["Other"];
  "export@before"?: (
    state: X,
    specifier: string,
    value: V["Stack"],
    path: Path,
  ) => V["Other"];
  "write@before"?: (
    state: X,
    variable: Variable,
    value: V["Stack"],
    path: Path,
  ) => V["Scope"];
  "return@before"?: (state: X, value: V["Stack"], path: Path) => V["Other"];
  "apply@around"?: (
    state: X,
    callee: V["Stack"],
    this_: V["Stack"],
    arguments_: V["Stack"][],
    path: Path,
  ) => V["Stack"];
  "construct@around"?: (
    state: X,
    callee: V["Stack"],
    arguments_: V["Stack"][],
    path: Path,
  ) => V["Stack"];
};
