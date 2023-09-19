export type Context<S> = {
  strict: boolean;
  super: unbuild.Variable | null;
  super_constructor: unbuild.Variable | null;
  break: unbuild.Label | null;
  continue: unbuild.Label | null;
  scope: import("../scope/index.mjs").Scope<S>;
  free_meta_variable_array: unbuild.Variable[];
  serialize: (node: estree.Node) => S;
  digest: (node: estree.Node) => unbuild.Hash;
};
