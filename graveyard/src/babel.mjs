import { forEach } from "array-lite";
import { parseExpression } from "@babel/parser";
import { hasOwn } from "./util/index.mjs";

const { undefined } = globalThis;

const options = {
  sourceType: "module",
  strictMode: true,
  errorRecovery: true,
  allowImportExportEverywhere: true,
  allowUndeclaredExports: true,
  startLine: 0,
  plugins: ["estree"],
};

const checkError = (error) => {
  if (hasOwn(error, "reasonCode")) {
    if (error.reasonCode === "IllegalBreakContinue") {
      return undefined;
    } else if (error.reasonCode === "UnsupportedMetaProperty") {
      return undefined;
    } /* c8 ignore start */ else {
      throw error;
    } /* c8 ignore stop */
  } /* c8 ignore start */ else {
    throw error;
  } /* c8 ignore stop */
};

export const parseBabel = (code) => {
  const estree = parseExpression(`({ async * f () {\n${code}\n} })`, options);
  forEach(estree.errors, checkError);
  return {
    ...estree.properties[0].value.body,
    type: "Program",
  };
};
