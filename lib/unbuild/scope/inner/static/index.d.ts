export type StaticFrame = {
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
