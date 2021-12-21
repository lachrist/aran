/* eslint-disable no-use-before-define */
import {
  some,
  includes,
  filter,
  filterOut,
  concat,
  map,
  repeat,
  lastIndexOf,
  flatMap,
} from "array-lite";
import {assert, expect, generateThrowError, generateReturn} from "../util.mjs";
import {getSyntax, isSyntaxType} from "./syntax.mjs";
import {
  makeNode,
  dispatchNode,
  getNodeType,
  getNodeFieldArray,
} from "./accessor.mjs";

const {
  NaN,
  isNaN,
  String,
  Proxy,
  Error,
  WeakMap,
  undefined,
  Array: {isArray},
  Reflect: {apply},
  WeakMap: {
    prototype: {set: setWeakMap, get: getWeakMap, has: hasWeakMap},
  },
} = globalThis;

const syntax = getSyntax();

const returnFalse = generateReturn(false);

const returnEmptyArray = generateReturn([]);

const returnNaN = generateReturn(NaN);

const throwMissingCallback = generateThrowError("missing callback");

const generateGetNodeKind = () => {
  const kinds = {__proto__: null};
  for (const kind in syntax) {
    for (const type in syntax[kind]) {
      kinds[type] = kind;
    }
  }
  return (node) => kinds[getNodeType(node)];
};
const getNodeKind = generateGetNodeKind();

const generateIsType = (type) => (node) => getNodeType(node) === type;
const isReturnStatement = generateIsType("ReturnStatement");
const isYieldExpression = generateIsType("YieldExpression");
const isAwaitExpression = generateIsType("AwaitExpression");
const isInputExpression = generateIsType("InputExpression");
const isBreakStatement = generateIsType("BreakStatement");
const makeReadExpression = (variable) => makeNode("ReadExpression", variable);

const generateQuery = (callbacks, default_callback) => (node, context) =>
  dispatchNode(context, node, callbacks, default_callback);

const isLooseDeclareStatement = generateQuery(
  {
    __proto__: null,
    DeclareStatement: (_context, kind, _variable, _expression, _annotation) =>
      kind === "var",
  },
  returnFalse,
);

const isRigidDeclareStatement = generateQuery(
  {
    __proto__: null,
    DeclareStatement: (_context, kind, _variable, _expression, _annotation) =>
      kind === "let" || kind === "const",
  },
  returnFalse,
);

const isBoundVariableNode = generateQuery(
  {
    __proto__: null,
    ReadExpression: (variables, variable, _annotation) =>
      includes(variables, variable),
    WriteEffect: (variables, variable, _expression, _annotation) =>
      includes(variables, variable),
  },
  returnFalse,
);

const isBoundBreakStatement = generateQuery(
  {
    __proto__: null,
    BreakStatement: (labels, label, _annotation) => includes(labels, label),
  },
  returnFalse,
);

const databases = {__proto__: null};
for (const kind in syntax) {
  databases[kind] = new WeakMap();
}

const isBindingImportLink = generateQuery(
  {
    __proto__: null,
    ImportLink: (
      {source: source1, specifier: specifier1},
      source2,
      specifier2,
      _annotation,
    ) => source1 === source2 && specifier1 === specifier2,
  },
  returnFalse,
);

const isBindingExportLink = generateQuery(
  {
    __proto__: null,
    ExportLink: (specifier1, specifier2, _annotation) =>
      specifier1 === specifier2,
  },
  returnFalse,
);

const isBoundLinkExpression = generateQuery(
  {
    __proto__: null,
    ImportExpression: (links, source, specifier, _annotation1) =>
      some(links, (link) => isBindingImportLink(link, {source, specifier})),
    ExportEffect: (links, specifier, _expression, _annotation) =>
      some(links, (link) => isBindingExportLink(link, specifier)),
  },
  returnFalse,
);

const digestNode = (node, type, path) => {
  if (typeof type === "string") {
    if (type in databases) {
      expect(
        apply(hasWeakMap, databases[type], [node]),
        Error,
        "not a %s at %s >> %o",
        [type, path, node],
      );
      return apply(getWeakMap, databases[type], [node]);
    }
    expect(isSyntaxType(node, type), Error, "not a %s at %s >> %o", [
      type,
      path,
      node,
    ]);
    return [];
  }
  if (isArray(type)) {
    assert(isArray(node), `not an array at ${path}`);
    if (type.length === 2 && type[1] === "*") {
      type = repeat(type[0], node.length);
    } else {
      assert(type.length === node.length, `array length mismatch at ${path}`);
    }
    return flatMap(type, (_, index) =>
      digestNode(node[index], type[index], `${path}/${String(index)}`),
    );
  }
  /* c8 ignore start */
  throw new Error("node type should only be string or array");
  /* c8 ignore stop */
};

const extractExportSpecifierArray = generateQuery(
  {
    __proto__: null,
    ExportLink: (_context, specifier, _annotation) => [specifier],
  },
  returnEmptyArray,
);

const immutable_trap_object = {
  __proto__: null,
  setPrototypeOf: generateThrowError("caught setPrototypeOf on immutable node"),
  preventExtensions: generateThrowError(
    "caught preventExtensions on immutable node",
  ),
  defineProperty: generateThrowError("caught defineProperty on immutable node"),
  deleteProperty: generateThrowError("caught deleteProperty on immutable node"),
  set: generateThrowError("caught set on immutable node"),
};

const digestable = [
  "InputExpression",
  "BreakStatement",
  "ReadExpression",
  "WriteEffect",
  "ImportExpression",
  "ExportEffect",
  "DeclareStatement",
  "ReturnStatement",
  "AwaitExpression",
  "YieldExpression",
];

const isDuplicate = (element, index, array) =>
  lastIndexOf(array, element) > index;

const getStatementCompletion = generateQuery(
  {
    __proto__: null,
    ReturnStatement: (_context, _expression, _annotation) => 1,
    BlockStatement: (_context, block, _annotation) => getBlockCompletion(block),
    IfStatement: (_context, _expression, block1, block2, _annotation) =>
      getBlockCompletion(block1) + getBlockCompletion(block2),
    TryStatement: (_context, block1, block2, _block3, _annotation) =>
      getBlockCompletion(block1) + getBlockCompletion(block2),
  },
  returnNaN,
);

const getBlockCompletion = generateQuery(
  {
    __proto__: null,
    Block: (_context, labels, _variables, statements, _annotation) =>
      labels.length === 0 && statements.length > 0
        ? getStatementCompletion(statements[statements.length - 1])
        : NaN,
  },
  throwMissingCallback,
);

const isLabeledBlock = generateQuery(
  {
    __proto__: null,
    Block: (_context, labels, _variables, _statements, _annotation) =>
      labels.length > 0,
  },
  throwMissingCallback,
);

const checkoutProgram = (type, digest, completion) => {
  assert(!isNaN(completion), `${type}.body should be a completion Block`);
  assert(
    filter(digest, isReturnStatement).length === completion,
    `${type}.body should only contain ReturnStatement in completion position`,
  );
  digest = filterOut(digest, isReturnStatement);
  if (digest.length > 0) {
    throw new Error(`found ${getNodeType(digest[0])} in ${type}`);
  }
  return digest;
};

const checkoutBlockProgram = (type, digest, block) => {
  assert(!isLabeledBlock(block), `${type}.body should not be a labeled Block`);
  return checkoutProgram(type, digest, getBlockCompletion(block));
};

const generateValidateNode = () => {
  const callbacks = {
    __proto__: null,
    ModuleProgram: (digest, links, block, _annotation) => {
      assert(
        !some(flatMap(links, extractExportSpecifierArray), isDuplicate),
        "duplicate export link found in ModuleProgram",
      );
      digest = filterOut(digest, isAwaitExpression);
      digest = filterOut(digest, (node) => isBoundLinkExpression(node, links));
      return checkoutBlockProgram("ModuleProgram", digest, block);
    },
    ScriptProgram: (digest, statements, _annotation) => {
      digest = filterOut(digest, isRigidDeclareStatement);
      return checkoutProgram(
        "ScriptProgram",
        digest,
        statements.length > 0
          ? getStatementCompletion(statements[statements.length - 1])
          : NaN,
      );
    },
    LocalEvalProgram: (digest, variables, block, _annotation) => {
      assert(!some(variables, isDuplicate), "duplicate variable found Block");
      digest = filterOut(digest, (node) =>
        isBoundVariableNode(node, variables),
      );
      return checkoutBlockProgram("LocalEvalProgram", digest, block);
    },
    GlobalEvalProgram: (digest, block, _annotation) =>
      checkoutBlockProgram("LocalEvalProgram", digest, block),
    EnclaveEvalProgram: (digest, enclaves, block, _annotation) => {
      assert(
        !some(enclaves, isDuplicate),
        "duplicate enclaves found in EvalProgram",
      );
      digest = filterOut(digest, isLooseDeclareStatement);
      return checkoutBlockProgram("EnclaveEvalProgram", digest, block);
    },
    AggregateLink: (digest, _source, specifier1, specifier2, _annotation) => {
      // export Foo as *   from "source"; // invalid
      // export *          from "source"; // valid
      // export *   as Foo from "source"; // valid
      assert(
        !(specifier1 !== null && specifier2 === null),
        "AggregateLink cannot have a non-null imported specifier and a null exported specifier",
      );
      return digest;
    },
    Block: (digest, labels, variables, _statements, _annotation) => {
      assert(!some(variables, isDuplicate), "duplicate variable found Block");
      assert(
        !some(digest, isRigidDeclareStatement),
        "found rigid DeclareStatement in Block",
      );
      assert(
        filter(digest, isInputExpression).length <= 1,
        "multiple InputExpression found in block",
      );
      digest = filterOut(digest, isInputExpression);
      digest = filterOut(digest, (node) => isBoundBreakStatement(node, labels));
      digest = filterOut(digest, (node) =>
        isBoundVariableNode(node, variables),
      );
      return digest;
    },
    ClosureExpression: (
      digest,
      kind,
      asynchronous,
      generator,
      block,
      _annotation,
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
      digest = filterOut(digest, isReturnStatement);
      if (generator) {
        digest = filterOut(digest, isYieldExpression);
      }
      if (asynchronous) {
        digest = filterOut(digest, isAwaitExpression);
      }
      assert(
        !some(digest, isLooseDeclareStatement),
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
        "unbound BreakStatement in ClosureExpression",
      );
      return digest;
    },
    TryStatement: (digest, block1, block2, block3, _annotation) => {
      assert(
        !isLabeledBlock(block1),
        "TryStatement.body should not be labeled Block",
      );
      assert(
        !isLabeledBlock(block2),
        "TryStatement.handler should not be labeled Block",
      );
      assert(
        !isLabeledBlock(block3),
        "TryStatement.finalizer should not be labeled Block",
      );
      return digest;
    },
    EvalExpression: (digest, variables, _expression, _annotation) => {
      assert(
        !some(variables, isDuplicate),
        "duplicate variable found in EvalExpression",
      );
      return concat(digest, map(variables, makeReadExpression));
    },
  };
  const callback = (digest, _annotation) => digest;
  return (node) => {
    node = new Proxy(node, immutable_trap_object);
    const type = getNodeType(node);
    const kind = getNodeKind(node);
    assert(kind !== undefined, `invalid node type: ${type}`);
    let digest = dispatchNode(
      digestNode(getNodeFieldArray(node), syntax[kind][type], type),
      node,
      callbacks,
      callback,
    );
    if (includes(digestable, type)) {
      digest = concat(digest, [node]);
    }
    apply(setWeakMap, databases[kind], [node, digest]);
    return node;
  };
};

export const validateNode = generateValidateNode();
