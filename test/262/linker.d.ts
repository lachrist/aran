import { Module, Script } from "node:vm";

export type Link = (
  specifier: string,
  parent: Module | Script,
  _assertions: object,
) => Promise<Module>;

export type Register = (main: Module | Script, url: URL) => void;
