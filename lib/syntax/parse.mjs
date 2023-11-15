/* eslint-disable local/no-static-dependency */

import { parse } from "@babel/parser";

const { Error } = globalThis;

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

/** @type {(code: string) => estree.Program} */
export const parseEstree = (code) => {
  const estree = parse(`({ async * f () {\n${code}\n} });`, options);
  for (const error of estree.errors) {
    if (
      error.reasonCode !== "IllegalBreakContinue" &&
      error.reasonCode === "UnsupportedMetaProperty"
    ) {
      throw error;
    }
  }
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
