import type { Base } from "../../type/options.d.ts";
import type { NodeSitu, RootSitu } from "../situ.d.ts";
import type { Context } from "./context.d.ts";

export type RootOptions = {
  situ: RootSitu;
  context: null;
};

export type NodeOptions = {
  situ: NodeSitu;
  context: Context;
};

export type Options = RootOptions | NodeOptions;
