import { VariableSegment } from "../layer/index.mjs";

export type Context<S> = {
  strict: boolean;
  super: Variable | null;
  scope: import("../scope/index.mjs").Scope<S>;
  serialize: (node: estree.Node) => S;
  digest: (node: estree.Node) => VariableSegment;
};
