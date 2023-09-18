export type Context<S> = {
  strict: boolean;
  super: unbuild.Variable | null;
  scope: import("../scope/index.mjs").Scope<S>;
  serialize: (node: estree.Node) => S;
  digest: (node: estree.Node) => unbuild.Hash;
};
