import type { VariableName } from "estree-sentry";
import type { Expression } from "../../atom";
import type { ConstantMetaVariable } from "../../variable";
import type { Tree } from "../../../util/tree";
import type { Mode } from "../../mode";
import type { RootSort } from "../../sort";
import type { EvalFrame } from "./eval";
import type { FakeFrame } from "./fake";
import type { IllegalFrame } from "./illegal";
import type { RegularFrame } from "./regular";
import type { RootFrame } from "./root";
import type { WithFrame } from "./with";

export type ClosureFrame = {
  type: "closure";
};

export type VariableFrame =
  | ClosureFrame
  | RegularFrame
  | EvalFrame
  | IllegalFrame
  | FakeFrame
  | RootFrame
  | WithFrame;

export type VariableScope = {
  mode: Mode;
  root: RootSort;
  variable: Tree<VariableFrame>;
};

export type LoadVariableOperation = {
  variable: VariableName;
  closure: boolean;
};

export type SaveVariableOperation = {
  variable: VariableName;
  closure: boolean;
  right: Expression;
};

// Operation //

export type LateDeclareVariableOperation = {
  variable: VariableName;
  closure: boolean;
  write: "perform";
  conflict: "report" | "ignore";
};

export type InitializeVariableOperation = {
  variable: VariableName;
  closure: boolean;
  right: Expression;
  distant: boolean;
};

export type WriteVariableOperation = {
  variable: VariableName;
  closure: boolean;
  right: Expression;
};

export type WriteSloppyFunctionVariableOperation = {
  variable: VariableName;
  closure: boolean;
  right: null | ConstantMetaVariable;
};

export type ReadVariableOperation = {
  variable: VariableName;
  closure: boolean;
};

export type TypeofVariableOperation = {
  variable: VariableName;
  closure: boolean;
};

export type DiscardVariableOperation = {
  variable: VariableName;
  closure: boolean;
};

export type ReadAmbientThisVariableOperation = {
  variable: VariableName;
  closure: boolean;
};
