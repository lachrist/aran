import type {
  SourceValue,
  SpecifierValue,
  SpecifierName,
  VariableName,
} from "estree-sentry";
import type { ConstantMetaVariable } from "../../../variable";
import type { Write } from "../../../annotation/hoisting";
import type { List } from "../../../../util/list";

export type ImportBinding = {
  type: "import";
  variable: VariableName;
  source: SourceValue;
  specifier: SpecifierName | SpecifierValue | null;
};

export type Initialization = "yes" | "no" | "maybe";

export type SloppyFunction = {
  self: ConstantMetaVariable | null;
  save: ConstantMetaVariable | null;
};

export type RegularBinding = {
  type: "regular";
  variable: VariableName;
  duplicable: boolean;
  initialization: Initialization;
  write: Write;
  export: (SpecifierName | SpecifierValue)[];
  sloppy_function: null | SloppyFunction;
};

export type Binding = ImportBinding | RegularBinding;

export type RegularFrame = {
  type: "regular";
  bindings: List<Binding>;
};
