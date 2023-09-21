// https://tc39.github.io/ecma262/#sec-function-instances

import {
  hoistBlock,
  hoistClosure,
  listPatternVariable,
} from "../../estree/index.mjs";
import { flatMap } from "../../util/index.mjs";

// Two different scope frame:
// ==========================
// > function f (x = y) { var y; return x; }
// undefined
// > y
// Thrown:
// ReferenceError: y is not defined
// > f()
// Thrown:
// ReferenceError: y is not defined
//     at f (repl:1:17)

/**
 * @type {<S>(
 *   node: estree.Function,
 *   context: import("./context.d.ts").Context<S>,
 *   options: { kind: aran.FunctionKind, name: estree.Identifier | null },
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const unbuildFunction = (node, context, { kind, name }) => {
  const { serialize, digest } = context;
  const serial = serialize(node);
  const hash = digest(node);
  const parameters = flatMap(node.params, listPatternVariable);
  const variables =
    node.body.type === "BlockStatement"
      ? {
          ...hoistClosure(node.body.body),
          ...hoistBlock(node.body.body),
        }
      : {};
};
