import { Module, Script } from "node:vm";

export type Load = (
  specifier: string,
  parent: Module | Script,
  assertions: object,
) => Promise<Module>;

export type Register = (main: Module | Script, url: URL) => void;

export type Linker = {
  link: Load;
  importModuleDynamically: Load;
  register: Register;
};
