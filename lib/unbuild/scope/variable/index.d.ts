import type { VariableName } from "estree-sentry";
import type { Expression } from "../../atom";
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
import type { Sequence } from "../../../util/sequence";
import type { Hash } from "../../../hash";
import type { MetaDeclarationPrelude, PrefixPrelude } from "../../prelude";

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
  performEval:
    | {
        type: "perform";
        data: Perform<EvalFrame, O, W1, X>;
      }
    | {
        type: "intercept";
        data: Intercept<EvalFrame, O, W1, X>;
      };
  performIllegal: PerformMaybe<IllegalFrame, O, W2, X>;
  performProxy: PerformMaybe<ProxyFrame, O, W3, X>;
  performRegular: PerformMaybe<RegularFrame, O, W4, X>;
  performRoot: Perform<RootBind, O, W5, X>;
  performWith: Intercept<WithFrame, O, W6, X>;
};

export type InitializeOperation<R, O> = (raw_operation: R, mode: Mode) => O;

export type DuplicateOperation<O> = (
  hash: Hash,
  meta: Meta,
  operation: O,
) => Sequence<MetaDeclarationPrelude | PrefixPrelude, [O, O]>;

export type Incorporate<X> = <W>(
  sequence: Sequence<W, X>,
  hash: Hash,
) => Sequence<Exclude<W, PrefixPrelude>, X>;

export type VariableOperation = {
  variable: VariableName;
  closure: Closure;
  mode: Mode;
};

export type LateDeclareVariableOperation = VariableOperation & {
  conflict: "ignore" | "report";
};

export type AssignVariableOperation = VariableOperation & {
  right: Expression;
};

export type InitializeVariableOperation = AssignVariableOperation;

export type WriteVariableOperation = AssignVariableOperation;

export type WriteSloppyFunctionVariableOperation = AssignVariableOperation;
