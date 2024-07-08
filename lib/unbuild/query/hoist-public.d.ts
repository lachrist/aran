import type { Variable } from "../../estree";
import type { Path } from "../../path";

// export type ImportBinding = {
//   type: "import";
//   variable: Variable;
// };

// export type RegularBinding = {
//   type: "regular";
//   variable: Variable;
//   baseline: "live" | "dead";
//   write: "perform" | "report" | "ignore";
// };

// export type SloppyFunctionBinding =
//   | {
//       type: "function-sloppy-block";
//       variable: Variable;
//     }
//   | {
//       type: "function-sloppy-closure";
//       variable: Variable;
//     };

export type SloppyFunctionProperty = "nope" | "nearby" | "distant" | "both";

export type Binding = {
  variable: Variable;
  baseline: "live" | "dead";
  write: "perform" | "report" | "ignore";
  sloppy_function: SloppyFunctionProperty;
};

export type Duplicate = {
  variable: Variable;
  origin: Path;
};

export type Hoisting = { [key in Path]?: Binding[] };

export type Result = {
  report: Duplicate[];
  unbound: Binding[];
  hoisting: Hoisting;
};
