import { Variable } from "../estree";

export type IntrinsicClash = {
  type: "intrinsic";
  variable: Variable;
};

export type EscapeClash = {
  type: "escape";
  escape: Variable;
  variable: Variable;
};

export type Clash = IntrinsicClash | EscapeClash;
