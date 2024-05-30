import type { Source, Specifier, Variable } from "../../../estree";

export type ExternalBinding = {
  kind: "external";
  deadzone: null;
  writable: false;
  export: Specifier[];
  import: {
    source: Source;
    specifier: Specifier | null;
  };
};

export type InternalBinding = {
  kind: "internal";
  deadzone: boolean;
  writable: boolean;
  export: Specifier[];
  import: null;
};

export type RegularBinding = ExternalBinding | InternalBinding;

export type RegularFrame = {
  type: "regular";
  record: { [k in Variable]?: RegularBinding };
};
