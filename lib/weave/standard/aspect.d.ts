import type {
  DeepLocalEvalProgramHeader,
  Header,
  ModuleProgramHeader,
  RootLocalEvalProgramHeader,
  ScriptProgramHeader,
} from "../../header";
import type { Intrinsic, Parameter, RuntimePrimitive } from "../../lang";
import type { Path } from "../../path";
import type { DeepLocalContext, GlobalEvalSource } from "../../source";
import type { ValueOf } from "../../util";
import type { ArgVariable, Label } from "../atom";
import type {
  BlockKind,
  ClosureKind,
  ControlKind,
  Parametrization,
  ProgramKind,
} from "../parametrization";

export type Variable = ArgVariable | Parameter;

export type TestKind = "if" | "while" | "conditional";

type Valuation = {
  Stack: unknown;
  Scope: unknown;
  Other: unknown;
};

export type Frame<V> = { [key in Variable | Parameter]?: V };

export type TaggedFrame<V> = ValueOf<{
  [K in BlockKind]: {
    kind: K;
    frame: {
      [key in Variable | Parameter]?: V;
    } & {
      [key in Parametrization[K]]: V;
    };
  };
}>;

export type KindHead =
  | {
      kind: "module";
      head: ModuleProgramHeader[];
    }
  | {
      kind: "script";
      head: ScriptProgramHeader[];
    }
  | {
      kind: "eval.global";
      head: GlobalEvalSource[];
    }
  | {
      kind: "eval.local.root";
      head: RootLocalEvalProgramHeader[];
    }
  | {
      kind: "eval.local.deep";
      head: DeepLocalEvalProgramHeader[];
    }
  | {
      kind: ClosureKind;
      head: [];
    }
  | {
      kind: ControlKind;
      head: [Label];
    };

export type AspectTyping<X, V extends Valuation> = {
  "block@setup": {
    pointcut: (kind: BlockKind, path: Path) => boolean;
    advice: <K extends BlockKind>(
      state: X,
      kind: K,
      head: K extends ProgramKind
        ? Header[]
        : K extends ClosureKind
        ? []
        : K extends ControlKind
        ? [Label]
        : never,
      path: Path,
    ) => X;
  };
  "block@frame": {
    pointcut: (kind: BlockKind, path: Path) => boolean;
    advice: (
      state: X,
      kind: BlockKind,
      frame: Frame<V["Other"]>,
      path: Path,
    ) => void;
  };
  "block@overframe": {
    pointcut: (kind: BlockKind, path: Path) => boolean;
    advice: (
      state: X,
      kind: BlockKind,
      frame: Frame<V["Other"]>,
      path: Path,
    ) => Frame<V["Scope"]>;
  };
  "block@success": {
    pointcut: (kind: BlockKind, path: Path) => boolean;
    advice: <K extends BlockKind>(
      state: X,
      kind: K,
      value: K extends ProgramKind | ClosureKind
        ? V["Stack"]
        : K extends ControlKind
        ? undefined
        : never,
      path: Path,
    ) => K extends ProgramKind | ClosureKind
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
      context: DeepLocalContext,
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

export type AspectKind = keyof AspectTyping<never, never>;

export type Aspect<X, V extends Valuation> = {
  [key in AspectKind]?:
    | AspectTyping<X, V>[key]["advice"]
    | {
        pointcut: boolean | AspectTyping<X, V>[key]["pointcut"];
        advice: AspectTyping<X, V>[key]["advice"];
      };
};

export type UnknownAspect = Aspect<unknown, Valuation>;

export type Advice<X, V extends Valuation> = {
  [key in AspectKind]?: AspectTyping<X, V>[key]["advice"];
};

export type NormalPointcut = {
  [key in AspectKind]: AspectTyping<never, never>[key]["pointcut"];
};

export type ObjectPointcut = {
  [key in AspectKind]:
    | boolean
    | undefined
    | AspectTyping<never, never>[key]["pointcut"];
};

export type ConstantPointcut = boolean;

export type IterablePointcut = Iterable<AspectKind>;

export type Pointcut = ObjectPointcut | IterablePointcut | ConstantPointcut;
