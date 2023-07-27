// @ts-ignore
import Prettier from "prettier";

const { format: formatPrettier } = Prettier;

/** @type {(node: EstreeProgram) => string} */
export const stringifyPrettier = (node) =>
  formatPrettier(".", {
    parser: () => node,
    quoteProps: "preserve",
  });
