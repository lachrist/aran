import type {
  SourceValue,
  SpecifierValue,
  SpecifierName,
  VariableName,
} from "estree-sentry";
import type { ConstantMetaVariable } from "../../../variable";
import type { Write } from "../../../annotation/hoisting";
import type { Tree } from "../../../../util/tree";

export type ImportBinding = {
  type: "import";
  variable: VariableName;
  source: SourceValue;
  specifier: SpecifierName | SpecifierValue | null;
};

export type Status = "live" | "dead" | "schrodinger";

export type SloppyFunction = {
  self: ConstantMetaVariable | null;
  save: ConstantMetaVariable | null;
};

export type RegularBinding = {
  type: "regular";
  variable: VariableName;
  duplicable: boolean;
  status: Status;
  write: Write;
  export: (SpecifierName | SpecifierValue)[];
  sloppy_function: null | SloppyFunction;
};

export type Binding = ImportBinding | RegularBinding;

export type RegularFrame = {
  type: "regular";
  bindings: Tree<Binding>;
};
