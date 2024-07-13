import type { Variable } from "../../estree";
import type { Path } from "../../path";

export type Duplicate = {
  frame: "aran.global" | "aran.record";
  variable: Variable;
  origin: Path;
};
