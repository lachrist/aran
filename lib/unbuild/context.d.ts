import { Scope } from "./scope/index.mjs";
import { Private } from "./private.mjs";
import type { Root } from "../../type/options.d.ts";

type Record = {
  "import.meta": ".illegal" | aran.Parameter | unbuild.Variable;
  "this":
    | ".illegal"
    | ".undefined"
    | ".global"
    | ".derived"
    | aran.Parameter
    | unbuild.Variable;
  "new.target": ".illegal" | aran.Parameter | unbuild.Variable;
  "super.constructor":
    | ".illegal"
    | ".enclave"
    | aran.Parameter
    | unbuild.Variable;
  "class.field": ".illegal" | ".none" | aran.Parameter | unbuild.Variable;
  "super.prototype":
    | ".illegal"
    | ".enclave"
    | aran.Parameter
    | unbuild.Variable;
  "function.arguments": ".illegal" | aran.Parameter | unbuild.Variable;
};

export type Context = {
  strict: boolean;
  root: Root;
  scope: Scope;
  private: Private;
  record: Record;
};
