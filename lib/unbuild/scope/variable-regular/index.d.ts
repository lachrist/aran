import type {
  SourceValue,
  SpecifierValue,
  SpecifierName,
  VariableName,
} from "estree-sentry";
import type { ConstantMetaVariable } from "../../variable";

export type ImportBinding = {
  type: "import";
  source: SourceValue;
  specifier: SpecifierName | SpecifierValue | null;
};

export type SloppyFunction = null | {
  self: ConstantMetaVariable | null;
  save: ConstantMetaVariable | null;
};

export type RegularBinding = {
  type: "regular";
  baseline: "live" | "dead";
  write: "perform" | "ignore" | "report";
  export: (SpecifierName | SpecifierValue)[];
  sloppy_function: SloppyFunction;
};

export type Binding = ImportBinding | RegularBinding;

export type RegularFrame = {
  type: "regular";
  record: { [k in VariableName]?: Binding };
};
