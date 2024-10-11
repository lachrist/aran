import type { VariableName } from "estree-sentry";
import type { Expression } from "../../atom";
import type { ConstantMetaVariable } from "../../variable";
import type { Mode } from "../../mode";
import type { RootSort } from "../../sort";
import type { EvalFrame, RawEvalFrame } from "./eval";
import type { ProxyFrame, RawProxyFrame } from "./proxy";
import type { IllegalFrame, RawIllegalFrame } from "./illegal";
import type { RawRegularFrame, RegularFrame } from "./regular";
import type { RawRootFrame, RootBind, RootFrame } from "./root";
import type { RawWithFrame, WithFrame } from "./with";
import type { List } from "../../../util/list";
import type { Intercept, Perform, PerformMaybe } from "../api";
import type { Meta } from "../../meta";
import type { Sequence } from "../../../sequence";
import type { Hash } from "../../../hash";

export type ClosureFrame = {
  type: "closure";
};

export type Closure = "internal" | "external";

export type Conflict = "ignore" | "report";

export type VariableFrame =
  | ClosureFrame
  | RegularFrame
  | EvalFrame
  | IllegalFrame
  | ProxyFrame
  | RootFrame
  | WithFrame;

export type RawVariableFrame =
  | RawRegularFrame
  | RawEvalFrame
  | RawIllegalFrame
  | RawProxyFrame
  | RawRootFrame
  | RawWithFrame;

export type VariableScope = {
  mode: Mode;
  root: RootSort;
  variable: List<VariableFrame>;
};

export type PerformStandard<O, W1, W2, W3, W4, W5, W6, X> = {
  performEval: Intercept<EvalFrame, O, W1, X>;
  performIllegal: PerformMaybe<IllegalFrame, O, W2, X>;
  performProxy: PerformMaybe<ProxyFrame, O, W3, X>;
  performRegular: PerformMaybe<RegularFrame, O, W4, X>;
  performRoot: Perform<RootBind, O, W5, X>;
  performWith: Intercept<WithFrame, O, W6, X>;
};

export type InitializeOperation<R, O> = (raw_operation: R, mode: Mode) => O;

export type DuplicateOperation<W, O> = (
  hash: Hash,
  meta: Meta,
  operation: O,
) => Sequence<W, [O, O]>;

export type VariableOperation = {
  variable: VariableName;
  closure: Closure;
  mode: Mode;
};

export type LateDeclareVariableOperation = VariableOperation & {
  conflict: "ignore" | "report";
};

export type InitializeVariableOperation = VariableOperation & {
  right: Expression;
  status: "live" | "schrodinger";
};

export type WriteVariableOperation = VariableOperation & {
  right: Expression;
};

export type WriteSloppyFunctionVariableOperation = VariableOperation & {
  right: null | ConstantMetaVariable;
};
