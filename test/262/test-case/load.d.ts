import { Module, Script } from "node:vm";

export type Load = (
  specifier: string,
  parent: Module | Script,
  assertions: object,
) => Promise<Module>;
