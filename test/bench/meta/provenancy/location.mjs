const {
  Error,
  Object: { hasOwn },
  Reflect: { apply },
  String: {
    prototype: { split },
  },
} = globalThis;

const colon = [":"];

/**
 * @type {(
 *   node: object,
 * ) => string}
 */
const printLocation = (node) => {
  if (hasOwn(node, "loc")) {
    const {
      loc: {
        start: { line, column },
      },
    } = /** @type {any} */ (node);
    return `${line}-${column}`;
  } else {
    return "???";
  }
};

/**
 * @type {import("aran").Digest<{
 *   NodeHash: import("./location.d.ts").NodeHash,
 * }>}
 */
export const digest = (node, node_path, _file_path, _kind) =>
  /** @type {import("./location.d.ts").NodeHash} */ (
    `${node.type}:${node_path}#${printLocation(node)}`
  );

/**
 * @type {(
 *   hash: import("./location.d.ts").NodeHash,
 * ) => {
 *   type: import("aran").EstreeNode<{}>["type"],
 *   path: import("aran").EstreeNodePath,
 * }}
 */
export const parseNodeHash = (hash) => {
  /** @type {string[]} */
  const parts = apply(split, hash, colon);
  if (parts.length !== 2) {
    throw new Error("Invalid hash", { cause: hash });
  }
  return {
    type: /** @type {import("aran").EstreeNode<{}>["type"]} */ (parts[0]),
    path: /** @type {import("aran").EstreeNodePath} */ (parts[1]),
  };
};

/**
 * @type {(
 *   hash: (
 *     | import("./location.d.ts").NodeHash
 *     | "script" | "eval" | "function"
 *   ),
 * ) => import("./location.d.ts").FilePath}
 */
export const toEvalPath = (hash) =>
  /** @type {import("./location.d.ts").FilePath} */ (`dynamic://${hash}`);
