import type { ArgumentList } from "./argument";
import type { Callee } from "./callee";

export type Call = {
  callee: Callee;
  argument_list: ArgumentList;
};
