import { listChild } from "../query.mjs";
import {
  makeReadEnclaveExpression,
  makeReadExpression,
  makeWriteEffect,
  makeWriteEnclaveEffect,
  tagNode,
} from "../syntax.mjs";

import { hasOwn, includes, pop, push, pushAll } from "../util/index.mjs";

const {
  undefined,
  Reflect: { apply },
  String: {
    prototype: { startsWith, substring },
  },
} = globalThis;

/** @type {<N extends Node>(node: N, tag: Json | undefined) => N} */
const tagNodeOptional = (node, tag) =>
  tag === undefined ? node : tagNode(node, tag);

/** @type {(node: Node) => Json | undefined} */
const getNodeTag = (node) =>
  hasOwn(node, "tag") ? /** @type {Json} */ (node.tag) : undefined;

/** @type {(enclave: string | null, variable: string, value: Expression) => Effect} */
export const makeSaveEffect = (enclave, variable, value) =>
  enclave === null
    ? makeWriteEffect(variable, value)
    : makeWriteEnclaveEffect(`${enclave}${variable}`, value);

/** @type {(enclave: string | null, variable: string, tag: Json | undefined) => Expression} */
export const makeLoadExpression = (enclave, variable, tag) =>
  tagNodeOptional(
    enclave === null
      ? makeReadExpression(variable)
      : makeReadEnclaveExpression(`${enclave}${variable}`),
    tag,
  );

/** @type {(enclave: string | null, nodes: Node[]) => [string, Json | undefined][]} */
export const listLoadEntryShallow = (enclave, nodes) => {
  nodes = [...nodes];
  /** @type {[string, Json][]} */
  const entries = [];
  while (nodes.length > 0) {
    const node = pop(nodes);
    if (node.type === "ReadExpression") {
      push(entries, [node.variable, getNodeTag(node)]);
    } else if (node.type === "ReadEnclaveExpression") {
      if (enclave !== null && apply(startsWith, node.variable, [enclave])) {
        push(entries, [
          apply(substring, node.variable, [enclave.length]),
          getNodeTag(node),
        ]);
      }
    } else if (node.type !== "Block") {
      pushAll(nodes, listChild(node));
    }
  }
  return entries;
};

/** @type {(enclave: string | null, variable: string, nodes: Node[]) => boolean} */
export const hasLoadDeep = (enclave, variable, nodes) => {
  nodes = [...nodes];
  while (nodes.length > 0) {
    const node = pop(nodes);
    if (node.type === "ReadExpression" && node.variable === variable) {
      return true;
    }
    if (
      node.type === "ReadEnclaveExpression" &&
      enclave !== null &&
      node.variable === `${enclave}${variable}`
    ) {
      return true;
    }
    if (node.type === "Block" && includes(node.variables, variable)) {
      return false;
    }
    pushAll(nodes, listChild(node));
  }
  return false;
};
