import type { VariableName } from "estree-sentry";
import type { Expression } from "../../atom.d.ts";
import type { Mode } from "../../mode.d.ts";
import type { RootSort } from "../../sort.d.ts";
import type { EvalFrame, RawEvalFrame } from "./eval/index.d.ts";
import type { ProxyFrame, RawProxyFrame } from "./proxy/index.d.ts";
import type { IllegalFrame, RawIllegalFrame } from "./illegal/index.d.ts";
import type { RawRegularFrame, RegularFrame } from "./regular/index.d.ts";
import type { RawRootFrame, RootBind, RootFrame } from "./root/index.d.ts";
import type { RawWithFrame, WithFrame } from "./with/index.d.ts";
import type { List } from "../../../util/list.d.ts";
import type { Intercept, Perform, PerformMaybe } from "../api.d.ts";
import type { Meta } from "../../meta.d.ts";
import type { Sequence } from "../../../util/sequence.d.ts";
import type { Hash } from "../../hash.d.ts";
import type {
  MetaDeclarationPrelude,
  PrefixPrelude,
} from "../../prelude/index.d.ts";
import type { Kind } from "../../annotation/hoisting.d.ts";

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

export type LateDeclareKind = Kind &
  ("var" | "function-sloppy-away" | "function-sloppy-near");

export type LateDeclareVariableOperation = VariableOperation & {
  kinds: LateDeclareKind[];
};

export type AssignVariableOperation = VariableOperation & {
  right: Expression;
};

export type InitializeVariableOperation = AssignVariableOperation;

export type WriteVariableOperation = AssignVariableOperation;

export type WriteSloppyFunctionVariableOperation = AssignVariableOperation;
