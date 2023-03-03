import {
  SyntaxAranError,
  expect3,
  expect4,
  expect5,
  expect6,
  hasOwn,
} from "../../util/index.mjs";

const {
  String,
  Reflect: { apply },
  RegExp: {
    prototype: { test: testRegExp },
  },
  JSON: { stringify: stringifyJSON },
} = globalThis;

export const stringifyKey = (property) => {
  if (
    typeof property === "string" &&
    apply(testRegExp, /^[a-zA-Z_$][a-zA-Z_$0-9]+$/u, [property])
  ) {
    return `.${property}`;
  } else {
    return `[${stringifyJSON(property)}]`;
  }
};

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

//////////
// Type //
//////////

export const makeSyntaxTypeError = (node) =>
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

///////////
// Value //
///////////

export const makeSyntaxError = (node, property) =>
  new SyntaxAranError(
    `illegal ${node.type}${stringifyKey(property)} at ${locate(
      node,
    )}, got ${stringifyJSON(node[property])}`,
  );

export const makeSyntaxErrorDeep = (node, property1, property2) =>
  new SyntaxAranError(
    `illegal ${node.type}${stringifyKey(property1)}${stringifyKey(
      property2,
    )} at ${locate(node)}, got ${stringifyJSON(node[property1][property2])}`,
  );

export const expectSyntaxEqual = (node, property, value1) => {
  const value2 = node[property];
  expect5(
    value2 === value1,
    SyntaxAranError,
    "illegal %x%x at %x, it should be %x but got %x",
    String,
    node.type,
    stringifyKey,
    property,
    locate,
    node,
    stringifyJSON,
    value1,
    stringifyJSON,
    value2,
  );
};

export const expectSyntaxEqualDeep = (node, property1, property2, value1) => {
  const value2 = node[property1][property2];
  expect6(
    value2 === value1,
    SyntaxAranError,
    "illegal %x%x%x at %x, it should be %x but got %x",
    String,
    node.type,
    stringifyKey,
    property1,
    stringifyKey,
    property2,
    locate,
    node,
    stringifyJSON,
    value1,
    stringifyJSON,
    value2,
  );
};

export const expectSyntaxNotEqual = (node, property, value1) => {
  const value2 = node[property];
  expect4(
    value2 !== value1,
    SyntaxAranError,
    "illegal %x%x at %x, it should not be %x",
    String,
    node.type,
    stringifyKey,
    property,
    locate,
    node,
    stringifyJSON,
    value1,
  );
};

export const expectSyntaxNotEqualDeep = (
  node,
  property1,
  property2,
  value1,
) => {
  const value2 = node[property1][property2];
  expect5(
    value2 !== value1,
    SyntaxAranError,
    "illegal %x%x%x at %x, it should not be %x",
    String,
    node.type,
    stringifyKey,
    property1,
    stringifyKey,
    property2,
    locate,
    node,
    stringifyJSON,
    value1,
  );
};
