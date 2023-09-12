// @ts-ignore
import { parse as parseBabel } from "@babel/parser";

/** @type {(type: "script" | "module") => (code: string) => estree.Program} */
const compileParseProgram = (type) => (code) =>
  parseBabel(code, {
    plugins: ["estree"],
    sourceType: type,
  }).program;

export const parseScript = compileParseProgram("script");

export const parseModule = compileParseProgram("module");
