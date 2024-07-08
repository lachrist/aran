import type { Source, Specifier, Variable } from "../../../estree";
import type { ConstantMetaVariable } from "../../variable";

export type ImportBinding = {
  type: "import";
  source: Source;
  specifier: Specifier | null;
};

export type RegularBinding = {
  type: "regular";
  baseline: "live" | "dead";
  write: "perform" | "ignore" | "report";
  export: Specifier[];
  sloppy_function_self: null | ConstantMetaVariable;
  sloppy_function_write: null | ConstantMetaVariable;
};

export type Binding = ImportBinding | RegularBinding;

export type RegularFrame = {
  type: "regular";
  record: { [k in Variable]?: Binding };
};
