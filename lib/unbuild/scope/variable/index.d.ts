import type { VariableName } from "estree-sentry";
import type { Expression } from "../../atom";
import type { ConstantMetaVariable } from "../../variable";
import type { Mode } from "../../mode";
import type { RootSort } from "../../sort";
import type { EvalFrame } from "./eval";
import type { ProxyFrame } from "./proxy";
import type { IllegalFrame } from "./illegal";
import type { RegularFrame } from "./regular";
import type { DryRootFrame, RootFrame } from "./root";
import type { DryWithFrame, WithFrame } from "./with";
import type { List } from "../../../util/list";
import type { Intercept, Perform, PerformMaybe } from "../perform";
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
  | DryRootFrame
  | DryWithFrame;

export type VariableScope = {
  mode: Mode;
  root: RootSort;
  variable: List<VariableFrame>;
};

export type NormalPerform<O, W1, W2, W3, W4, W5, W6, X> = {
  performEval: Intercept<EvalFrame, O, W1, X>;
  performIllegal: PerformMaybe<IllegalFrame, O, W2, X>;
  performProxy: PerformMaybe<ProxyFrame, O, W3, X>;
  performRegular: PerformMaybe<RegularFrame, O, W4, X>;
  performRoot: Perform<RootFrame, O, W5, X>;
  performWith: Intercept<WithFrame, O, W6, X>;
};

export type DuplicateOperation<W, O> = (
  hash: Hash,
  meta: Meta,
  operation: O,
) => Sequence<W, [O, O]>;

// Operation //

export type LateDeclareVariableOperation = {
  variable: VariableName;
  closure: Closure;
  conflict: Conflict;
};

export type InitializeVariableOperation = {
  variable: VariableName;
  closure: Closure;
  right: Expression;
  status: "live" | "schrodinger";
};

export type WriteVariableOperation = {
  variable: VariableName;
  closure: Closure;
  right: Expression;
};

export type WriteSloppyFunctionVariableOperation = {
  variable: VariableName;
  closure: Closure;
  right: null | ConstantMetaVariable;
};

export type ReadVariableOperation = {
  variable: VariableName;
  closure: Closure;
};

export type TypeofVariableOperation = {
  variable: VariableName;
  closure: Closure;
};

export type DiscardVariableOperation = {
  variable: VariableName;
  closure: Closure;
};

export type ReadAmbientThisVariableOperation = {
  variable: VariableName;
  closure: Closure;
};
