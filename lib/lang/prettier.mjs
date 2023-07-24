import Prettier from "prettier";

const { format: formatPrettier } = Prettier;

/** @type {(node: import("estree").Node) => string} */
export const stringifyPrettier = (node) =>
  formatPrettier(".", {
    parser: () => node,
    quoteProps: "preserve",
  });
