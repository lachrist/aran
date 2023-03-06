import { reduce, join, map } from "array-lite";
import {
  SyntaxAranError,
  expect2,
  expect4,
  expect5,
  hasOwn,
} from "../../util/index.mjs";

const {
  String,
  Reflect: { get, apply },
  RegExp: {
    prototype: { test: testRegExp },
  },
  JSON: { stringify: stringifyJSON },
} = globalThis;

const getType = ({ type }) => type;

export const stringifyKey = (key) => {
  if (
    typeof key === "string" &&
    apply(testRegExp, /^[a-zA-Z_$][a-zA-Z_$0-9]+$/u, [key])
  ) {
    return `.${key}`;
  } else {
    return `[${stringifyJSON(key)}]`;
  }
};

export const stringifyKeyArray = (keys) => join(map(keys, stringifyKey), "");

export const locate = (node) => {
  if (hasOwn(node, "loc") && node.loc !== null) {
    const { loc } = node;
    if (hasOwn(loc, "source") && loc.source !== null) {
      const {
        source,
        start: { line, column },
      } = loc;
      return `${source}:${String(line)}:${String(column)}`;
    } else {
      const {
        start: { line, column },
      } = loc;
      return `${String(line)}:${String(column)}`;
    }
  } else {
    return "???";
  }
};

/////////////
// Generic //
/////////////

export const makeSyntaxError = (node) =>
  new SyntaxAranError(`illegal node ${node.type} at ${locate(node)}`);

export const expectSyntax = (guard, node) => {
  expect2(
    guard,
    SyntaxAranError,
    "illegal node %x at %x",
    getType,
    node,
    locate,
    node,
  );
};

//////////////
// Property //
//////////////

export const makeSyntaxPropertyError = (node, keys) =>
  new SyntaxAranError(
    `illegal ${node.type}${stringifyKeyArray(keys)} at ${locate(
      node,
    )}, got ${stringifyJSON(reduce(keys, get, node))}`,
  );

export const expectSyntaxPropertyEqual = (node, keys, value1) => {
  const value2 = reduce(keys, get, node);
  expect5(
    value2 === value1,
    SyntaxAranError,
    "illegal %x%x at %x, it should be %x but got %x",
    String,
    node.type,
    stringifyKeyArray,
    keys,
    locate,
    node,
    stringifyJSON,
    value1,
    stringifyJSON,
    value2,
  );
};

export const expectSyntaxPropertyNotEqual = (node, keys, value1) => {
  const value2 = reduce(keys, get, node);
  expect4(
    value2 !== value1,
    SyntaxAranError,
    "illegal %x%x at %x, it should not be %x",
    String,
    node.type,
    stringifyKeyArray,
    keys,
    locate,
    node,
    stringifyJSON,
    value1,
  );
};
