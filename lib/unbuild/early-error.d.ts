import { Variable } from "../estree";
import { Path } from "../path";

export type RegularEarlyError = {
  type: "regular";
  message: string;
  path: Path;
};

export type DuplicateEarlyError = {
  type: "duplicate";
  frame: "aran.global" | "aran.record";
  variable: Variable;
  path: Path;
};

export type EarlyError = RegularEarlyError | DuplicateEarlyError;
