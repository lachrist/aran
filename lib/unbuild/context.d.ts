import { Scope } from "./scope/index.mjs";
import { Private } from "./private.mjs";

type Record = {
  "this":
    | ".illegal"
    | ".undefined"
    | ".global"
    | aran.Parameter
    | unbuild.Variable;
  "import.meta": ".illegal" | aran.Parameter | unbuild.Variable;
  "new.target": ".illegal" | aran.Parameter | unbuild.Variable;
  "super.constructor":
    | ".illegal"
    | ".enclave"
    | ".default"
    | aran.Parameter
    | unbuild.Variable;
  "super.post": ".none" | aran.Parameter | unbuild.Variable;
  "super.prototype":
    | ".illegal"
    | ".enclave"
    | aran.Parameter
    | unbuild.Variable;
};

export type Context<S> = {
  strict: boolean;
  scope: Scope;
  serialize: (node: estree.Node) => S;
  digest: (node: estree.Node) => unbuild.Hash;
  private: Private;
  record: Record;
};

export type PackContext = {
  strict: boolean;
  scope: Scope;
  private: Private;
  record: Record;
};
