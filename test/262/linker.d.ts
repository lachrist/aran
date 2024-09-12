import { Module, Script } from "node:vm";
import { MainPath } from "./fetch";

export type Load = (
  specifier: string,
  parent: Module | Script,
  assertions: object,
) => Promise<Module>;

export type RegisterMain = (main: Module | Script, path: MainPath) => void;

export type Linker = {
  link: Load;
  importModuleDynamically: Load;
  registerMain: RegisterMain;
};
