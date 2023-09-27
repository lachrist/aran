import { parse as parseBabel } from "@babel/parser";

const compileParseProgram = (type) => (code) => parseBabel(code, {
  plugins: ["estree"],
  sourceType: type,
}).program;

export const parseScript = compileParseProgram("script");

export const parseModule = compileParseProgram("module");
