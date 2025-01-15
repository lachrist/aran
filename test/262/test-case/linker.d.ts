import { Module, Script } from "node:vm";
import { TestPath } from "../fetch";

export type Load = (
  specifier: string,
  parent: Module | Script,
  assertions: object,
) => Promise<Module>;

export type RegisterMain = (main: Module | Script, path: TestPath) => void;

export type Linker = {
  link: Load;
  importModuleDynamically: Load;
  registerMain: RegisterMain;
};
