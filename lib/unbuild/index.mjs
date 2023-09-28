import { makeRootScope } from "./scope/index.mjs";
import { unbuildProgram } from "./visitors/program.mjs";

/**
 * @type {<S>(
 *   node: estree.Program,
 *   options: {
 *     kind: aran.ProgramKind,
 *     enclave: boolean,
 *     escape: estree.Variable,
 *     serialize: (node: estree.Node) => S,
 *     digest: (node: estree.Node) => unbuild.Hash,
 *   }) => aran.Program<unbuild.Atom<S>>}
 */
export const unbuildGlobal = (
  node,
  { kind, enclave, escape, serialize, digest },
) =>
  unbuildProgram(
    node,
    {
      strict: false,
      scope: makeRootScope(enclave),
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
    { kind, enclave, escape },
  );

// /**
//  * @type {<S>(
//  *   node: estree.Program,
//  *   context: import("./context.d.ts").PackContext,
//  *   options: {
//  *     digest: (node: estree.Node) => unbuild.Hash,
//  *     serialize: (node: estree.Node) => S,
//  *   },
//  * ) => aran.Program<unbuild.Atom<S>>}
//  */
// export const unbuildLocal = (node, context, { serialize, digest }) =>
//   unbuildProgram(
//     node,
//     {
//       ...context,
//       serialize,
//       digest,
//     },
//     {
//       kind: "script",
//       enclave: false,
//       escape: null,
//     },
//   );
