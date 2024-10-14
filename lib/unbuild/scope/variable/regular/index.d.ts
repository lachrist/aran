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

export type RegularBinding = {
  type: "regular";
  variable: VariableName;
  duplicable: boolean;
  status: "live" | "dead" | "schrodinger";
  write: Write;
  export: (SpecifierName | SpecifierValue)[];
  /**
   * An arrow to initialize the closure-scoped variable of the sloppy function.
   * This is necessary because the its block-scoped variable shadows it.
   */
  save_sloppy_function: null | ConstantMetaVariable;
};

export type Binding = ImportBinding | RegularBinding;

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
