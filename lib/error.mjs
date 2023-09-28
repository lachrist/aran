/* eslint-disable no-restricted-syntax */

const { Error } = globalThis;

/** @type {(loc: null | undefined | { start: { line: number, column: number } }) => string} */
const printLocation = (loc) =>
  loc == null ? "???" : `${loc.start.line}:${loc.start.column}`;

export class AranError extends Error {
  constructor(/** @type {string} */ message) {
    super(message);
    this.name = "AranError";
  }
}

// export function SyntaxAranError(message, node) {}

export class SyntaxAranError extends AranError {
  /**
   * @param {string} message
   * @param {estree.Node} node
   */
  constructor(message, node) {
    super(`${message} at ${printLocation(node.loc)}`);
    this.node = node;
  }
}
