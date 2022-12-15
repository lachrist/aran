/* eslint-disable no-use-before-define */

import {
  forEach,
  slice,
  some,
  find,
  includes,
  filter,
  filterOut,
  concat,
  map,
  flatMap,
} from "array-lite";

import {
  isDuplicate,
  NULL_DATA_DESCRIPTOR,
  hasOwn,
  assert,
  partialx_,
  partial_x,
  partialx__,
  partial_xx,
  partialx___,
  partial__xx,
  return_x,
  constant_,
  constant__,
  constant___,
  deadcode_,
  deadcode__,
  deadcode___,
  deadcode____,
} from "../util/index.mjs";

import {
  DEFAULT_CLAUSE,
  isArrayNode,
  getArrayNodeType,
  getArrayNodeContent,
  dispatchArrayNode0,
  dispatchArrayNode1,
  dispatchArrayNode2,
} from "../node.mjs";

import { getSyntax, isSyntaxType } from "./syntax.mjs";

const {
  NaN,
  isNaN,
  String,
  Proxy,
  Error,
  WeakMap,
  undefined,
  JSON: { stringify: stringifyJSON },
  Array: { isArray },
  Reflect: { ownKeys, apply, defineProperty },
  WeakMap: {
    prototype: { set: setWeakMap, get: getWeakMap },
  },
} = globalThis;

const makeReadExpression = (variable) => ["ReadExpression", variable];

const makeParameterExpression = (parameter) => [
  "ParameterExpression",
  parameter,
];

const makeBlock = (labels, variables, statements) => [
  "Block",
  labels,
  variables,
  statements,
];

const syntax = getSyntax();

const kinds = ownKeys(syntax);

const isTypeKind = (kind, type) => hasOwn(syntax[kind], type);

const getNodeKind = (node) =>
  find(kinds, partial_x(isTypeKind, getArrayNodeType(node)));

const isNodeType = (node, type) => getArrayNodeType(node) === type;

const weakmaps = {};

forEach(kinds, (kind) => {
  defineProperty(weakmaps, kind, {
    __proto__: NULL_DATA_DESCRIPTOR,
    value: new WeakMap(),
  });
});

const saveDigest = (kind, node, digest) => {
  apply(setWeakMap, weakmaps[kind], [node, digest]);
};

const loadDigest = (kind, node) => apply(getWeakMap, weakmaps[kind], [node]);

const isDeclareExternalStatement = partial_x(
  isNodeType,
  "DeclareExternalStatement",
);

const isReturnStatement = partial_x(isNodeType, "ReturnStatement");

const isYieldExpression = partial_x(isNodeType, "YieldExpression");

const isAwaitExpression = partial_x(isNodeType, "AwaitExpression");

const isBreakStatement = partial_x(isNodeType, "BreakStatement");

const doesFirstInclude = ({ 1: element }, array) => includes(array, element);

const isBoundDeclareExternalStatement = partialx__(dispatchArrayNode1, {
  DeclareExternalStatement: doesFirstInclude,
  [DEFAULT_CLAUSE]: constant__(false),
});

const isRigidDeclareStatement = partial_x(isBoundDeclareExternalStatement, [
  "let",
  "const",
]);

const isBoundVariableNode = partialx__(dispatchArrayNode1, {
  ReadExpression: doesFirstInclude,
  WriteEffect: doesFirstInclude,
  [DEFAULT_CLAUSE]: constant__(false),
});

const isBoundParameterNode = partialx__(dispatchArrayNode1, {
  ParameterExpression: doesFirstInclude,
  [DEFAULT_CLAUSE]: constant__(false),
});

const isCatchParameterNode = partial_x(isBoundParameterNode, ["error"]);

const isArrowParameterNode = partial_x(isBoundParameterNode, ["arguments"]);

const isFunctionParameterNode = partial_x(isBoundParameterNode, [
  "new.target",
  "this",
  "arguments",
]);

const isBoundBreakStatement = partialx__(dispatchArrayNode1, {
  BreakStatement: doesFirstInclude,
  [DEFAULT_CLAUSE]: constant__(false),
});

const isBindingImportLink = partialx___(dispatchArrayNode2, {
  ImportLink: ({ 1: source1, 2: specifier1 }, source2, specifier2) =>
    source1 === source2 && specifier1 === specifier2,
  [DEFAULT_CLAUSE]: constant___(false),
});

const isBindingExportLink = partialx__(dispatchArrayNode1, {
  ExportLink: ({ 1: specifier1 }, specifier2) => specifier1 === specifier2,
  [DEFAULT_CLAUSE]: constant__(false),
});

const isBoundLinkExpression = partialx__(dispatchArrayNode1, {
  ImportExpression: ({ 1: source, 2: specifier }, links) =>
    some(links, partial_xx(isBindingImportLink, source, specifier)),
  ExportEffect: ({ 1: specifier }, links) =>
    some(links, partial_x(isBindingExportLink, specifier)),
  [DEFAULT_CLAUSE]: constant__(false),
});

const getStatementCompletion = partialx_(dispatchArrayNode0, {
  ReturnStatement: ({}) => 1,
  BlockStatement: ({ 1: block }) => getBlockCompletion(block),
  IfStatement: ({ 2: block1, 3: block2 }) =>
    getBlockCompletion(block1) + getBlockCompletion(block2),
  TryStatement: ({ 1: block1, 2: block2 }) =>
    getBlockCompletion(block1) + getBlockCompletion(block2),
  [DEFAULT_CLAUSE]: constant_(NaN),
});

const getBlockCompletion = partialx_(dispatchArrayNode0, {
  Block: ({ 1: labels, 3: statements }) =>
    labels.length === 0 && statements.length > 0
      ? getStatementCompletion(statements[statements.length - 1])
      : NaN,
});

const isLabeledBlock = partialx_(dispatchArrayNode0, {
  Block: ({ 1: labels }) => labels.length > 0,
});

const extractExportSpecifierArray = partialx_(dispatchArrayNode0, {
  ExportLink: ({ 1: specifier }) => [specifier],
  [DEFAULT_CLAUSE]: constant_([]),
});

const immutable_trap_object = {
  __proto__: null,
  setPrototypeOf: deadcode__("caught setPrototypeOf on immutable node"),
  preventExtensions: deadcode_("caught preventExtensions on immutable node"),
  defineProperty: deadcode___("caught defineProperty on immutable node"),
  deleteProperty: deadcode__("caught deleteProperty on immutable node"),
  set: deadcode____("caught set on immutable node"),
};

const digestable = [
  "ParameterExpression",
  "BreakStatement",
  "ReadExpression",
  "WriteEffect",
  "ImportExpression",
  "ExportEffect",
  "DeclareExternalStatement",
  "ReturnStatement",
  "AwaitExpression",
  "YieldExpression",
];

const digestSubfieldArray = (value, index, types) =>
  digestSubfield(value, index, types[index]);

const digestSubfield = (value, index, type, path) =>
  digestField(value, type, `${path}/${String(index)}`);

const digestField = (value, type, path) => {
  if (typeof type === "string") {
    if (hasOwn(syntax, type)) {
      const digest = loadDigest(type, value);
      assert(digest !== undefined, `missing node at ${path}`);
      return digest;
    } else {
      assert(isSyntaxType(value, type), `invalid value at ${path}`);
      return [];
    }
  } else if (isArray(type)) {
    assert(isArray(value), `expected an array at ${path}`);
    if (type.length === 2 && type[1] === "*") {
      return flatMap(value, partial__xx(digestSubfield, type[0], path));
    } else {
      assert(type.length === value.length, `array length mismatch at ${path}`);
      return flatMap(value, partial__xx(digestSubfieldArray, type, path));
    }
  } /* c8 ignore start */ else {
    throw new Error("invalid type");
  } /* c8 ignore stop */
};

const digestNodeGeneric = (node) => {
  const type = getArrayNodeType(node);
  const kind = getNodeKind(node);
  const fields = getArrayNodeContent(node);
  assert(fields.length > 0, "missing annotation field");
  return digestField(
    slice(fields, 0, fields.length - 1),
    syntax[kind][type],
    `${kind}/${type}`,
  );
};

const stringifyJSONSafe = (any) => {
  try {
    return stringifyJSON(any, null, 2);
  } catch (_error) {
    return "???";
  }
};

const digestProgramBody = (block, digest) => {
  assert(!isLabeledBlock(block), "Program body should not be a labeled Block");
  const completion = getBlockCompletion(block);
  assert(!isNaN(completion), "Program body should be a completion Block");
  assert(
    filter(digest, isReturnStatement).length === completion,
    "Program body should only contain ReturnStatement in completion position",
  );
  digest = filterOut(digest, isReturnStatement);
  if (digest.length > 0) {
    console.log("Digested nodes >>", stringifyJSONSafe(digest));
  }
  assert(digest.length === 0, "unbound program digested node");
  return digest;
};

const digestNodeSpecific = partialx__(dispatchArrayNode1, {
  ModuleProgram: ({ 1: links, 2: block }, digest) => {
    assert(
      !some(flatMap(links, extractExportSpecifierArray), isDuplicate),
      "duplicate export link found in ModuleProgram",
    );
    digest = filterOut(digest, isAwaitExpression);
    digest = filterOut(digest, partial_x(isBoundLinkExpression, links));
    return digestProgramBody(block, digest);
  },
  ScriptProgram: ({ 1: statements }, digest) => {
    digest = filterOut(digest, isDeclareExternalStatement);
    return digestProgramBody(makeBlock([], [], statements), digest);
  },
  EvalProgram: ({ 1: parameters, 2: variables, 3: block }, digest) => {
    assert(
      !some(parameters, isDuplicate),
      "dupicate parameter found in EvalProgram",
    );
    assert(
      !some(variables, isDuplicate),
      "duplicate variable found in EvalProgram",
    );
    digest = filterOut(digest, partial_x(isBoundVariableNode, variables));
    digest = filterOut(digest, partial_x(isBoundParameterNode, parameters));
    return digestProgramBody(block, digest);
  },
  AggregateLink: ({ 2: specifier1, 3: specifier2 }, digest) => {
    // export Foo as *   from "source"; // invalid
    // export *          from "source"; // valid
    // export *   as Foo from "source"; // valid
    assert(
      !(specifier1 !== null && specifier2 === null),
      "AggregateLink cannot have a non-null imported specifier and a null exported specifier",
    );
    return digest;
  },
  Block: ({ 1: labels, 2: variables }, digest) => {
    assert(!some(labels, isDuplicate), "duplicate label found in Block");
    assert(!some(variables, isDuplicate), "duplicate variable found in Block");
    assert(
      !some(digest, isRigidDeclareStatement),
      "found rigid DeclareStatement in Block",
    );
    digest = filterOut(digest, partial_x(isBoundBreakStatement, labels));
    digest = filterOut(digest, partial_x(isBoundVariableNode, variables));
    return digest;
  },
  ClosureExpression: (
    { 1: kind, 2: asynchronous, 3: generator, 4: block },
    digest,
  ) => {
    assert(
      !isNaN(getBlockCompletion(block)),
      "ClosureExpression.body should be a completion Block",
    );
    assert(
      !generator || (kind !== "arrow" && kind !== "constructor"),
      "arrow/constructor ClosureExpression cannot be generator",
    );
    assert(
      !asynchronous || kind !== "constructor",
      "constructor ClosureExpression cannot be asynchronous",
    );
    digest = filterOut(
      digest,
      kind === "arrow" ? isArrowParameterNode : isFunctionParameterNode,
    );
    digest = filterOut(digest, isReturnStatement);
    if (generator) {
      digest = filterOut(digest, isYieldExpression);
    }
    if (asynchronous) {
      digest = filterOut(digest, isAwaitExpression);
    }
    assert(
      !some(digest, isDeclareExternalStatement),
      "found DeclareStatement in ClosureExpression",
    );
    assert(
      !some(digest, isAwaitExpression),
      "found AwaitExpression in non-asynchronous ClosureExpression",
    );
    assert(
      !some(digest, isYieldExpression),
      "found YieldExpression in non-generator ClosureExpression",
    );
    assert(
      !some(digest, isBreakStatement),
      "found unbound BreakStatement in ClosureExpression >> %j",
    );
    return digest;
  },
  TryStatement: ({ 1: block1, 2: block2, 3: block3 }, _digest) => {
    assert(
      !isLabeledBlock(block1),
      "TryStatement body should not be a labeled Block",
    );
    assert(
      !isLabeledBlock(block2),
      "TryStatement handler should not be a labeled Block",
    );
    assert(
      !isLabeledBlock(block3),
      "TryStatement finalizer should not be a labeled Block",
    );
    return concat(
      loadDigest("Block", block1),
      filterOut(loadDigest("Block", block2), isCatchParameterNode),
      loadDigest("Block", block3),
    );
  },
  EvalExpression: ({ 1: parameters, 2: variables }, digest) => {
    assert(
      !some(parameters, isDuplicate),
      "duplicate parameter found in EvalExpression",
    );
    assert(
      !some(variables, isDuplicate),
      "duplicate variable found in EvalExpression",
    );
    return concat(
      digest,
      map(parameters, makeParameterExpression),
      map(variables, makeReadExpression),
    );
  },
  [DEFAULT_CLAUSE]: return_x,
});

export const validateNode = (node) => {
  try {
    assert(isArrayNode(node), "not an array node");
    const type = getArrayNodeType(node);
    const kind = getNodeKind(node);
    assert(kind !== undefined, "invalid node type");
    const generic_digest = digestNodeGeneric(node);
    const specific_digest = digestNodeSpecific(node, generic_digest);
    const proxy = new Proxy(node, immutable_trap_object);
    saveDigest(
      kind,
      proxy,
      includes(digestable, type)
        ? concat([proxy], specific_digest)
        : specific_digest,
    );
    return proxy;
  } catch (error) {
    console.log("Faulty node >>", stringifyJSONSafe(node));
    throw error;
  }
};
