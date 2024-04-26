export type ExternalBinding = {
  kind: "external";
  deadzone: null;
  writable: false;
  export: estree.Specifier[];
  import: {
    source: estree.Source;
    specifier: estree.Specifier | null;
  };
};

export type InternalBinding = {
  kind: "internal";
  deadzone: boolean;
  writable: boolean;
  export: estree.Specifier[];
  import: null;
};

export type RegularBinding = ExternalBinding | InternalBinding;

export type RegularFrame = {
  type: "regular";
  record: { [k in estree.Variable]?: RegularBinding };
};
