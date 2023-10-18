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
  "new.target": ".illegal" | ".undefined" | aran.Parameter | unbuild.Variable;
  "super.constructor":
    | ".illegal"
    | ".enclave"
    | ".default"
    | aran.Parameter
    | unbuild.Variable;
  "class.field": ".illegal" | ".none" | aran.Parameter | unbuild.Variable;
  "super.prototype":
    | ".illegal"
    | ".enclave"
    | aran.Parameter
    | unbuild.Variable;
};

export type Context = {
  strict: boolean;
  root: import("../../type/options.d.ts").Root;
  scope: Scope;
  private: Private;
  record: Record;
};
