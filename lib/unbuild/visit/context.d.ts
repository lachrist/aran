import { Scope } from "../scope/inner/index.mjs";
import { Super } from "../super.mjs";
import { Private } from "../private_oudated.mjs";

export type Context<S> = {
  escape: estree.Variable;
  strict: boolean;
  break: unbuild.Label | null;
  continue: unbuild.Label | null;
  scope: Scope<S>;
  serialize: (node: estree.Node) => S;
  digest: (node: estree.Node) => unbuild.Hash;
  super: Super;
  private: Private;
};
