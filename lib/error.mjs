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

/**
 * @typedef {(
 *   | "pattern"
 *   | "statement"
 *   | "expression"
 *   | "update pattern"
 * )} Site
 */

export class SyntaxAranError extends AranError {
  constructor(/** @type {string} */ message, /** @type {estree.Node} */ node) {
    super(`${message} at ${printLocation(node.loc)}`);
    this.node = node;
  }
}

export class TypeSyntaxAranError extends SyntaxAranError {
  constructor(/** @type {Site} */ site, /** @type {estree.Node} */ node) {
    super(`Illegal ${site} node ${node.type}`, node);
    this.node = node;
  }
}
