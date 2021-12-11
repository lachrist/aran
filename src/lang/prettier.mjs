import Prettier from "prettier";

const {format: formatPrettier} = Prettier;

export const stringifyPrettier = (node) =>
  formatPrettier(".", {
    parser: () => node,
    quoteProps: "preserve",
  });
