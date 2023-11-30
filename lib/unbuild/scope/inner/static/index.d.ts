export type GlobalStaticFrame = {
  situ: "global";
  link: null;
  kinds: Record<estree.Variable, estree.VariableKind>;
};

export type LocalStaticFrame = {
  situ: "local";
  link: null | {
    import: Record<
      estree.Variable,
      {
        source: estree.Source;
        specifier: estree.Specifier | null;
      }
    >;
    export: Record<estree.Variable, estree.Specifier[]>;
  };
  kinds: Record<estree.Variable, estree.VariableKind>;
};

export type StaticFrame = GlobalStaticFrame | LocalStaticFrame;
