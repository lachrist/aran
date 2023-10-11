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
  const { body } = /** @type {estree.Program} */ (
    /** @type {unknown} */ (estree.program)
  );
  if (
    body.length === 1 &&
    body[0].type === "ExpressionStatement" &&
    body[0].expression.type === "ObjectExpression" &&
    body[0].expression.properties.length === 1 &&
    body[0].expression.properties[0].type === "Property" &&
    body[0].expression.properties[0].kind === "init" &&
    body[0].expression.properties[0].method &&
    body[0].expression.properties[0].value.type === "FunctionExpression"
  ) {
    return {
      type: "Program",
      sourceType: "module",
      body: body[0].expression.properties[0].value.body.body,
    };
  } else {
    throw new Error("unexpected top-level ast structure");
  }
};
