import { Scope } from "./scope/index.mjs";
import { Private } from "./private.mjs";
import type { Root } from "../../type/options.d.ts";

export type Context = {
  strict: boolean;
  root: Root;
  scope: Scope;
  private: Private;
};
