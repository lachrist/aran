import { Scope } from "./scope/index.mjs";
import { Private } from "./private.mjs";
import type { Root } from "../../type/options.d.ts";

type ImportMetaRecord = ".illegal" | aran.Parameter | unbuild.Variable;

type ThisRecord =
  | ".illegal"
  | ".undefined"
  | ".global"
  | ".derived"
  | aran.Parameter
  | unbuild.Variable;

type NewTargetRecord =
  | ".illegal"
  | ".undefined"
  | aran.Parameter
  | unbuild.Variable;

type SuperConstructorRecord =
  | ".illegal"
  | ".enclave"
  | aran.Parameter
  | unbuild.Variable;

type ClassFieldRecord =
  | ".illegal"
  | ".none"
  | aran.Parameter
  | unbuild.Variable;

type SuperPrototypeRecord =
  | ".illegal"
  | ".enclave"
  | aran.Parameter
  | unbuild.Variable;

type Record = {
  "import.meta": ImportMetaRecord;
  "this": ThisRecord;
  "new.target": NewTargetRecord;
  "super.constructor": SuperConstructorRecord;
  "class.field": ClassFieldRecord;
  "super.prototype": SuperPrototypeRecord;
};

export type Context = {
  strict: boolean;
  root: Root;
  scope: Scope;
  private: Private;
  record: Record;
};
