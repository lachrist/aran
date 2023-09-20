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

class SyntaxAranError extends AranError {
  constructor(/** @type {string} */ message, /** @type {estree.Node} */ node) {
    super(`${message} at ${printLocation(node.loc)}`);
    this.node = node;
  }
}

export class DynamicSyntaxAranError extends SyntaxAranError {
  constructor(/** @type {string} */ message, /** @type {estree.Node} */ node) {
    super(`Invalid ${node.type} node ${message}`);
  }
}

export class StaticSyntaxAranError extends SyntaxAranError {
  constructor(
    /** @type {string} */ site,
    /** @type {never | {type: "never"}}} */ node,
  ) {
    super(
      `Illegal ${site} node ${/** @type {{type: string}} */ (node).type}`,
      /** @type {estree.Node} */ (/** @type {unknown} */ (node)),
    );
  }
}
