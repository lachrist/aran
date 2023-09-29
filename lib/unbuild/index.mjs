import { makeRootScope } from "./scope/index.mjs";
import { unbuildProgram } from "./visitors/program.mjs";

/**
 * @type {<S>(
 *   node: estree.Program,
 *   options: {
 *     kind: "script" | "script",
 *     root: "global.internal" | "global.external",
 *     context: null,
 *     escape: estree.Variable,
 *     serialize: (node: estree.Node) => S,
 *     digest: (node: estree.Node) => unbuild.Hash,
 *   } | {
 *     kind: "eval",
 *     root: "local.internal",
 *     context: import("./context").PackContext,
 *     escape: estree.Variable,
 *     serialize: (node: estree.Node) => S,
 *     digest: (node: estree.Node) => unbuild.Hash,
 *   } | {
 *     kind: "eval",
 *     root: "global.internal" | "global.external" | "local.external",
 *     context: null,
 *     escape: estree.Variable,
 *     serialize: (node: estree.Node) => S,
 *     digest: (node: estree.Node) => unbuild.Hash,
 *   }) => aran.Program<unbuild.Atom<S>>}
 */
export const unbuildGlobal = (
  node,
  { kind, root, escape, context, serialize, digest },
) =>
  context === null
    ? unbuildProgram(
        node,
        {
          strict: false,
          scope: makeRootScope(root),
          serialize,
          digest,
          private: {},
          record: {
            "this": ".illegal",
            "import.meta": ".illegal",
            "new.target": ".illegal",
            "super.constructor": ".illegal",
            "super.post": ".none",
            "super.prototype": ".illegal",
          },
        },
        kind === "eval" ? { kind, root, escape } : { kind, root, escape },
      )
    : unbuildProgram(
        node,
        {
          ...context,
          serialize,
          digest,
        },
        { kind, root, escape },
      );
