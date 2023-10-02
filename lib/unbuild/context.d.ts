import { Scope } from "./scope/index.mjs";
import { Private } from "./private.mjs";

type Serialize<S> = (node: estree.Node, path: unbuild.Path) => S;

type Digest = (node: estree.Node, path: unbuild.Path) => unbuild.Hash;

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
  "super.field": ".illegal" | ".none" | aran.Parameter | unbuild.Variable;
  "super.prototype":
    | ".illegal"
    | ".enclave"
    | aran.Parameter
    | unbuild.Variable;
};

export type Context<S> = {
  strict: boolean;
  root: unbuild.Root;
  scope: Scope;
  private: Private;
  record: Record;
  serialize: Serialize<S>;
  digest: Digest;
};

export type EvalContext = {
  strict: boolean;
  root: unbuild.Root;
  scope: Scope;
  private: Private;
  record: Record;
  path: unbuild.Path;
};
