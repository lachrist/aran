import { map } from "../util/index.mjs";
import { setOrigin } from "./node.mjs";

/**
 * @type {<
 *   N1 extends estree.Node,
 *   N2 extends aran.Node<unbuild.Atom>,
 *   O extends object | null,
 * >(
 *   unbuildNode: (
 *     pair: { node: N1, path: unbuild.Path },
 *     context: import("./context.d.ts").Context,
 *     options: O,
 *   ) => N2,
 * ) => (
 *   pair: { node: N1, path: unbuild.Path },
 *   context: import("./context.d.ts").Context,
 *   options: O,
 * ) => N2}
 */
export const wrapOrigin =
  (unbuild) =>
  ({ node, path }, context, options) =>
    setOrigin(unbuild({ node, path }, context, options), path);

/**
 * @type {<
 *   N1 extends estree.Node,
 *   N2 extends aran.Node<unbuild.Atom>,
 *   O extends object | null,
 * >(
 *   unbuildNode: (
 *     pair: { node: N1, path: unbuild.Path },
 *     context: import("./context.d.ts").Context,
 *     options: O,
 *   ) => N2[],
 * ) => (
 *   pair: { node: N1, path: unbuild.Path },
 *   context: import("./context.d.ts").Context,
 *   options: O,
 * ) => N2[]}
 */
export const wrapOriginArray =
  (unbuildArray) =>
  ({ node, path }, context, options) =>
    map(unbuildArray({ node, path }, context, options), (node) =>
      setOrigin(node, path),
    );

/**
 * @type {<
 *   N1 extends estree.Node,
 *   N2 extends aran.Node<unbuild.Atom>,
 *   O extends object | null,
 * >(
 *   unbuildNode: (
 *     pair: { node: N1, path: unbuild.Path },
 *     context: import("./context.d.ts").Context,
 *     options: O,
 *   ) => [N2, N2],
 * ) => (
 *   pair: { node: N1, path: unbuild.Path },
 *   context: import("./context.d.ts").Context,
 *   options: O,
 * ) => [N2, N2]}
 */
export const wrapOriginPair =
  (unbuildArray) =>
  ({ node, path }, context, options) => {
    const [node1, node2] = unbuildArray({ node, path }, context, options);
    return [setOrigin(node1, path), setOrigin(node2, path)];
  };
