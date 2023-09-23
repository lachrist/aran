import { Scope } from "../scope/inner/index.mjs";
import { Super } from "../super.mjs";

export type Context<S> = {
  escape: estree.Variable;
  strict: boolean;
  break: unbuild.Label | null;
  continue: unbuild.Label | null;
  scope: Scope<S>;
  super: Super;
  serialize: (node: estree.Node) => S;
  digest: (node: estree.Node) => unbuild.Hash;
};
