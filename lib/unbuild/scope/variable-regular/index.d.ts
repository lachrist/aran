import type {
  SourceValue,
  SpecifierValue,
  SpecifierName,
  VariableName,
} from "estree-sentry";
import type { ConstantMetaVariable } from "../../variable";
import type { Write } from "../../annotation/hoisting";

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
  baseline: "dead" | "live";
  write: Write;
  export: (SpecifierName | SpecifierValue)[];
  sloppy_function: SloppyFunction;
};

export type Binding = ImportBinding | RegularBinding;

export type RegularFrame = {
  type: "regular";
  record: { [k in VariableName]?: Binding };
};
