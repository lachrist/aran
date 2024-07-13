import type { Variable } from "../../estree";
import type { Path } from "../../path";

export type RegularEarlyError = {
  type: "regular";
  message: string;
  origin: Path;
};

export type DuplicateEarlyError = {
  type: "duplicate";
  frame: "aran.global" | "aran.record" | "static";
  variable: Variable;
  origin: Path;
};

export type EarlyError = RegularEarlyError | DuplicateEarlyError;

export type DynamicEarlyError = DuplicateEarlyError & {
  frame: "aran.global" | "aran.record";
};

export type StaticEarlyError =
  | RegularEarlyError
  | (DuplicateEarlyError & { frame: "static" });
