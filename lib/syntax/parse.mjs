import { forEach } from "../util/index.mjs";
import { parse } from "@babel/parser";

const { Error, undefined } = globalThis;

/** @type {import("@babel/parser").ParserOptions} */
const options = {
  sourceType: "module",
  strictMode: true,
  errorRecovery: true,
  allowImportExportEverywhere: true,
  allowUndeclaredExports: true,
  startLine: 0,
  plugins: ["estree"],
};

/** @type {(error: import("@babel/parser").ParseError) => void} */
const checkError = (error) => {
  if (error.reasonCode === "IllegalBreakContinue") {
    return undefined;
  } else if (error.reasonCode === "UnsupportedMetaProperty") {
    return undefined;
  } /* c8 ignore start */ else {
    throw error;
  }
};

/** @type {(code: string) => estree.Program} */
export const parseEstree = (code) => {
  const estree = parse(`({ async * f () {\n${code}\n} });`, options);
  forEach(estree.errors, checkError);
  if (
    estree.program.body.length === 1 &&
    estree.program.body[0].type === "ExpressionStatement" &&
    estree.program.body[0].expression.type === "FunctionExpression"
  ) {
    return {
      type: "Program",
      sourceType: "module",
      body: /** @type {any[]} */ (estree.program.body[0].expression.body.body),
    };
  } else {
    throw new Error("unexpected top-level ast structure");
  }
};
