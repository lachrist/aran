import type { ArgumentList } from "./argument";
import type { Callee } from "./callee";

export type Call = {
  mode: "strict" | "sloppy";
  callee: Callee;
  argument_list: ArgumentList;
};
