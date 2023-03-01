import {
  SyntaxAranError,
  expect3,
  expect5,
  hasOwn,
} from "../../util/index.mjs";

const {
  String,
  JSON: { stringify: stringifyJSON },
} = globalThis;

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

export const makeValueSyntaxError = (node, property) =>
  new SyntaxAranError(
    `illegal ${node.type}.${property} at ${locate(node)}, got ${stringifyJSON(
      node[property],
    )}`,
  );

export const expectSyntaxValue = (node, property, value1) => {
  const value2 = node[property];
  expect5(
    value2 === value1,
    SyntaxAranError,
    "illegal %x.%x at %x, it should be %x but got %x",
    String,
    node.type,
    String,
    property,
    locate,
    node,
    stringifyJSON,
    value1,
    stringifyJSON,
    value2,
  );
};

export const makeTypeSyntaxError = (node) =>
  new SyntaxAranError(`illegal node at ${locate(node)}, got a ${node.type}`);

export const expectSyntaxType = (node, type1) => {
  const type2 = node.type;
  expect3(
    type1 === type2,
    SyntaxAranError,
    "illegal node at %x, it should be a %x but got a %x",
    locate,
    node,
    String,
    type1,
    String,
    type2,
  );
};
