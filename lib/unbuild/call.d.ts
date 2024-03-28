import { ArgumentList } from "./argument";
import { Callee } from "./callee";

export type Call = {
  callee: Callee;
  argument_list: ArgumentList;
};
