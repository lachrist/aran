import { parse as parseBabel } from "@babel/parser";

/** @type {(type: "script" | "module") => (code: string) => import("estree").Program} */
const compileParseProgram = (type) => (code) =>
  /** @type {any} */ (
    parseBabel(code, {
      plugins: ["estree"],
      sourceType: type,
    }).program
  );

export const parseScript = compileParseProgram("script");

export const parseModule = compileParseProgram("module");
