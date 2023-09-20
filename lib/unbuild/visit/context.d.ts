import { Scope } from "../scope/inner/index.mjs";

export type Context<S> = {
  escape: estree.Variable;
  strict: boolean;
  record: { [key in "super" | "super.constructor"]: unbuild.Variable };
  break: unbuild.Label | null;
  continue: unbuild.Label | null;
  scope: Scope<S>;
  serialize: (node: estree.Node) => S;
  digest: (node: estree.Node) => unbuild.Hash;
};
