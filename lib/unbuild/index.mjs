import { unbuildProgram } from "./visit/program.mjs";

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
export const unbuild = (node, { kind, enclave, escape, serialize, digest }) =>
  unbuildProgram(
    node,
    {
      escape,
      strict: false,
      break: null,
      continue: null,
      scope: null,
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
      completion: null,
    },
    { kind, enclave },
  );
