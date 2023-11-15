const { Error } = globalThis;

/**
 * @type {(
 *   source: string,
 * ) => null | string}
 */
const isSourceShallow = (source) => {
  if (source.startsWith("./") || source.startsWith("../")) {
    const segments = source.split("/");
    while (
      segments.length > 0 &&
      (segments[0] === ".." || segments[0] === ".")
    ) {
      segments.shift();
    }
    if (segments.length === 0) {
      return "illegal empty import";
    } else if (segments.length === 1) {
      return null;
    } else if (segments.length === 2) {
      return segments[1].split(".")[0] === "index"
        ? null
        : "depth 2 imports require an index file";
    } else {
      return "depth > 2 imports are forbidden";
    }
  } else {
    return null;
  }
};

/**
 * @type {(
 *   context: import("eslint").Rule.RuleContext,
 *   source: estree.Literal,
 * ) => void}
 */
const checkSource = (context, node) => {
  if (typeof node.value !== "string") {
    throw new Error("expected source to be a string");
  }
  const message = isSourceShallow(node.value);
  if (message !== null) {
    context.report({ node, message });
  }
};

/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "forbid deep import",
      recommended: false,
    },
    schema: {
      type: "array",
      items: [],
    },
  },
  create: (context) => ({
    ExportAllDeclaration: (node) => {
      checkSource(context, node.source);
    },
    ExportNamedDeclaration: (node) => {
      if (node.source != null) {
        checkSource(context, node.source);
      }
    },
    ImportDeclaration: (node) => {
      checkSource(context, node.source);
    },
  }),
};
