import { Module, Script } from "node:vm";
import { TargetPath } from "./fetch";

export type Load = (
  specifier: string,
  parent: Module | Script,
  assertions: object,
) => Promise<Module>;

export type Register = (main: Module | Script, path: TargetPath) => void;

export type Linker = {
  link: Load;
  importModuleDynamically: Load;
  register: Register;
};
