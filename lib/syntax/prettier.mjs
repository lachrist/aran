// @ts-ignore
import Prettier from "prettier";

const { format } = Prettier;

/** @type {(node: EstreeProgram) => string} */
export const formatPrettier = (node) =>
  format(".", {
    parser: () => node,
    quoteProps: "preserve",
  });
