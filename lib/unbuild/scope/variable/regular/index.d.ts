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

export type Import = {
  source: SourceValue;
  specifier: SpecifierName | SpecifierValue | null;
};

export type SloppyFunction = {
  /**
   * An arrow to initialize the closure-scoped variable of the sloppy function.
   * This is necessary because its block-scoped variable shadows it.
   */
  save: ConstantMetaVariable;
};

export type OuterBinding = {
  variable: VariableName;
  duplicable: false;
  status: "live";
  write: "report";
  export: [];
  import: Import;
  sloppy_function: null;
};

export type InnerBinding = {
  variable: VariableName;
  duplicable: boolean;
  status: Status;
  write: Write;
  export: (SpecifierName | SpecifierValue)[];
  import: null;
  sloppy_function: null | SloppyFunction;
};

export type Status = "live" | "dead" | "schrodinger";

export type Binding = InnerBinding | OuterBinding;

export type RegularFrame = {
  type: "regular";
  schrodinger: boolean;
  bindings: Tree<Binding>;
};

export type RawRegularFrame = {
  bindings: RawBinding[];
  schrodinger: boolean;
  links: Link[];
};
