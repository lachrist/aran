/* eslint-disable local/no-impure */
/* eslint-disable local/no-function */
/* eslint-disable local/no-class */

const { Error } = globalThis;

/** @type {(loc: null | undefined | { start: { line: number, column: number } }) => string} */
const printLocation = (loc) =>
  loc == null ? "???" : `${loc.start.line}:${loc.start.column}`;

export const AranError = class AranError extends Error {
  constructor(/** @type {string} */ message) {
    super(message);
    this.name = "AranError";
  }
};

export const SyntaxAranError = class SyntaxAranError extends AranError {
  /**
   * @param {string} message
   * @param {estree.Node | null} node
   */
  constructor(message, node) {
    super(`${message} at ${node && printLocation(node.loc)}`);
    this.node = node;
  }
};
