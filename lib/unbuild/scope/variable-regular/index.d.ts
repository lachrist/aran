import type { Source, Specifier, Variable } from "../../../estree";
import type { ConstantMetaVariable } from "../../variable";

export type ImportBinding = {
  type: "import";
  source: Source;
  specifier: Specifier | null;
};

export type SloppyFunction =
  | {
      type: "pass";
    }
  | {
      type: "skip";
    }
  | {
      type: "near";
      self: ConstantMetaVariable;
    }
  | {
      type: "away";
      save: ConstantMetaVariable;
    };

export type RegularBinding = {
  type: "regular";
  baseline: "live" | "dead";
  write: "perform" | "ignore" | "report";
  export: Specifier[];
  sloppy_function: SloppyFunction;
};

export type Binding = ImportBinding | RegularBinding;

export type RegularFrame = {
  type: "regular";
  record: { [k in Variable]?: Binding };
};
