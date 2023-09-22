import { Scope } from "../scope/inner/index.mjs";

export type ContextRecord = {
  "self": unbuild.Variable | null;
  "super": unbuild.Variable | null;
  "super.constructor": unbuild.Variable | null;
};

export type Context<S> = {
  escape: estree.Variable;
  strict: boolean;
  record: ContextRecord;
  break: unbuild.Label | null;
  continue: unbuild.Label | null;
  scope: Scope<S>;
  serialize: (node: estree.Node) => S;
  digest: (node: estree.Node) => unbuild.Hash;
};
