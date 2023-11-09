import { Scope } from "./scope/index.mjs";
import { Private } from "./private.mjs";
import type { Root } from "../../type/options.d.ts";
import { Param } from "./param.mjs";

export type Context = {
  strict: boolean;
  root: Root;
  scope: Scope;
  private: Private;
  params: Param[];
};
