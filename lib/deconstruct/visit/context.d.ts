export type Context<S> = {
  strict: boolean;
  scope: import("../scope/index.mjs").Scope<S>;
  serialize: (node: estree.Node) => S;
  mangle: (node: estree.Node, site: string, purpose: string) => Variable;
};
