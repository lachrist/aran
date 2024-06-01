import type { Intrinsic, Parameter, RuntimePrimitive } from "../../lang";
import type { Path } from "../../path";
import type { Label, ArgVariable } from "../atom";

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

export type NormalPointcut = {
  "block@setup": (kind: BlockKind, path: Path) => boolean;
  "block@frame": (kind: BlockKind, path: Path) => boolean;
  "block@overframe": (kind: BlockKind, path: Path) => boolean;
  "block@success": (kind: BlockKind, path: Path) => boolean;
  "block@failure": (kind: BlockKind, path: Path) => boolean;
  "block@teardown": (kind: BlockKind, path: Path) => boolean;
  "break@before": (label: Label, path: Path) => boolean;
  "test@before": (kind: TestKind, path: Path) => boolean;
  "intrinsic@after": (name: Intrinsic, path: Path) => boolean;
  "primitive@after": (primitive: RuntimePrimitive, path: Path) => boolean;
  "import@after": (
    source: string,
    specifier: string | null,
    path: Path,
  ) => boolean;
  "closure@after": (
    kind: "arrow" | "function",
    asynchronous: boolean,
    generator: boolean,
    path: Path,
  ) => boolean;
  "read@after": (variable: Variable, path: Path) => boolean;
  "eval@before": (path: Path) => boolean;
  "eval@after": (path: Path) => boolean;
  "await@before": (path: Path) => boolean;
  "await@after": (path: Path) => boolean;
  "yield@before": (delegate: boolean, path: Path) => boolean;
  "yield@after": (delegate: boolean, path: Path) => boolean;
  "drop@before": (path: Path) => boolean;
  "export@before": (specifier: string, path: Path) => boolean;
  "write@before": (variable: Variable, path: Path) => boolean;
  "return@before": (path: Path) => boolean;
  "apply@around": (path: Path) => boolean;
  "construct@around": (path: Path) => boolean;
};

export type ObjectPointcut = {
  [key in keyof NormalPointcut]:
    | boolean
    | undefined
    | null
    | NormalPointcut[key];
};

export type IterablePointcut = Iterable<keyof ObjectPointcut>;

export type ConstantPointcut = boolean;

export type Pointcut = ConstantPointcut | IterablePointcut | ObjectPointcut;
