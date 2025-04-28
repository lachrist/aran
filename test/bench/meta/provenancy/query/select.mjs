import { isNodeType } from "../branch.mjs";

const { Set, Error } = globalThis;

/**
 * @type {(
 *   segment: string,
 * ) => import("estree-sentry").Node<{}>["type"][]}
 */
const compileSegment = (segment) => {
  switch (segment) {
    case "switch": {
      return ["SwitchCase"];
    }
    case "cond": {
      return ["ConditionalExpression", "IfStatement"];
    }
    case "loop": {
      return [
        "WhileStatement",
        "DoWhileStatement",
        "ForStatement",
        "ForInStatement",
        "ForOfStatement",
      ];
    }
    default: {
      if (!isNodeType(segment)) {
        throw new Error("Invalid segment", { cause: { segment } });
      }
      return [segment];
    }
  }
};

/**
 * @type {(
 *   spec: string,
 * ) => (
 *   type: import("estree-sentry").Node<{}>["type"],
 * ) => boolean}
 */
export const compileSelection = (spec) => {
  if (spec === "all") {
    return () => true;
  }
  const selection = new Set(spec.split("+").flatMap(compileSegment));
  return (type) => selection.has(type);
};
