import type { Source, Specifier, Variable } from "../../../estree";
import type { Write } from "../../query/hoist-public";

export type ImportBinding = {
  baseline: "import";
  write: Write;
  import: {
    source: Source;
    specifier: Specifier | null;
  };
  export: null;
};

export type RegularBinding = {
  baseline: "undefined" | "deadzone";
  write: Write;
  import: null;
  export: Specifier[];
};

export type Binding = RegularBinding | ImportBinding;

export type RegularFrame = {
  type: "regular";
  record: { [k in Variable]?: Binding };
};
