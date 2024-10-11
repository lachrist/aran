import type {
  SourceValue,
  SpecifierValue,
  SpecifierName,
  VariableName,
} from "estree-sentry";
import type { ConstantMetaVariable } from "../../../variable";
import type { Write } from "../../../annotation/hoisting";
import type { Tree } from "../../../../util/tree";
import type { Binding as RawBinding } from "../../../annotation/hoisting";
import type { Link } from "../../../query/link";

export type ImportBinding = {
  type: "import";
  variable: VariableName;
  source: SourceValue;
  specifier: SpecifierName | SpecifierValue | null;
};

export type Status = "live" | "dead" | "schrodinger";

export type SloppyFunction = {
  /**
   * The protected value of the sloppy function declaration.
   * That is that changing its variable will not change this value.
   */
  self: ConstantMetaVariable | null;
  /**
   * An arrow to initialize the closure-scoped variable of the sloppy function.
   * This is necessary to prevent mutating its block-scoped variable.
   */
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

export type RawRegularFrame = {
  bindings: RawBinding[];
  links: Link[];
};
