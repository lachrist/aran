import type { Base } from "../../type/options.d.ts";
import { RootSitu } from "../situ.js";
import type { Context } from "./context.d.ts";

export type RootOptions = {
  situ: RootSitu;
  base: Base;
  context: null;
};

export type NodeOptions = {
  situ: null;
  base: Base;
  context: Context;
};

export type Options = RootOptions | NodeOptions;
