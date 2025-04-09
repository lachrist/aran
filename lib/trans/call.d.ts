import type { ArgumentList } from "./argument.d.ts";
import type { Callee } from "./callee.d.ts";

export type Call = {
  callee: Callee;
  argument_list: ArgumentList;
};
