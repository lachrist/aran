import type {
  SourceValue,
  SpecifierValue,
  SpecifierName,
  VariableName,
} from "estree-sentry";
import type { ConstantMetaVariable } from "../../../variable.d.ts";
import type { Tree } from "../../../../util/tree.d.ts";
import type { Kind } from "../../../annotation/hoisting.d.ts";
import type { Link } from "../../../query/link.d.ts";

export type Write = "perform" | "ignore" | "report";

export type Import = {
  source: SourceValue;
  specifier: SpecifierName | SpecifierValue | null;
};

export type SloppyFunction = {
  /**
   * An arrow to initialize the closure-scoped variable of the sloppy function.
   * This is necessary because its block-scoped variable shadows it.
   */
  save: null | ConstantMetaVariable;
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
  bindings: Tree<Binding>;
};

// We could initialize bindings with deadzone and remember that the frame is
// schrodinger. That way, would be able to statically detect some deadzone.
// But that does not work because we initialize bindings twice in switches.

export type RawRegularFrame = {
  bindings: [VariableName, Kind[]][];
  schrodinger: boolean;
  links: Link[];
};
