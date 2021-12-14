/* eslint-disable no-use-before-define */
import {
  some,
  includes,
  filter,
  filterOut,
  concat,
  map,
  flat,
  repeat,
  lastIndexOf,
  flatMap,
} from "array-lite";
import {assert, generateThrowError} from "../util.mjs";
import {getSyntax, isSyntaxType} from "./syntax.mjs";
import {
  makeNode,
  dispatchNode,
  extractNode,
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

const makeNonAnnotatedReadExpression = (variable) =>
  makeNode("ReadExpression", null, variable);

const generateIsType = (type) => (node) => getNodeType(node) === type;
const isReturnStatement = generateIsType("ReturnStatement");
const isYieldExpression = generateIsType("YieldExpression");
const isAwaitExpression = generateIsType("AwaitExpression");
const isInputExpression = generateIsType("InputExpression");
const isThrowExpression = generateIsType("ThrowExpression");
const isDeclareEnclaveStatement = generateIsType("DeclareEnclaveStatement");
const isCallSuperEnclaveExpression = generateIsType(
  "CallSuperEnclaveExpression",
);
const isGetSuperEnclaveExpression = generateIsType("GetSuperEnclaveExpression");
const isSetSuperEnclaveEffect = generateIsType("SetSuperEnclaveEffect");
const isBreakStatement = generateIsType("BreakStatement");

const generateIsBoundVariableNode = (variables) => {
  const callbacks = {
    __proto__: null,
    ReadExpression: (_context, _annotation, variable) =>
      includes(variables, variable),
    WriteEffect: (_context, _annotation, variable, _expression) =>
      includes(variables, variable),
  };
  const callback = (_context, _annotation) => false;
  return (node) => dispatchNode(null, node, callbacks, callback);
};

const generateIsBoundBreakStatement = (variables) => {
  const callbacks = {
    __proto__: null,
    BreakStatement: (_context, _annotation, variable) =>
      includes(variables, variable),
  };
  const callback = (_context, _annotation) => false;
  return (node) => dispatchNode(null, node, callbacks, callback);
};

const generateIsDeclareEnclaveStatement = (kind1) => {
  const callbacks = {
    __proto__: null,
    DeclareEnclaveStatement: (
      _context,
      _annotation,
      kind2,
      _variable,
      _expression,
    ) => kind1 === kind2,
  };
  const callback = (_context, _annotation) => false;
  return (node) => dispatchNode(null, node, callbacks, callback);
};
const isLetDeclareEnclaveStatement = generateIsDeclareEnclaveStatement("let");
const isConstDeclareEnclaveStatement =
  generateIsDeclareEnclaveStatement("const");
const isVarDeclareEnclaveStatement = generateIsDeclareEnclaveStatement("var");

const generateIsReadEnclaveExpression = (variable1) => {
  const callbacks = {
    __proto__: null,
    ReadEnclaveExpression: (_context, _annotation, variable2) =>
      variable1 === variable2,
  };
  const callback = (_context, _annotation) => false;
  return (node) => dispatchNode(null, node, callbacks, callback);
};
const isThisReadEnclaveExpression = generateIsReadEnclaveExpression("this");
const isNewTargetReadEnclaveExpression =
  generateIsReadEnclaveExpression("new.target");
const isArgumentsReadEnclaveExpression =
  generateIsReadEnclaveExpression("arguments");

const databases = {__proto__: null};
for (const kind in syntax) {
  databases[kind] = new WeakMap();
}

const generateMakeEnclaveDummy = () => {
  const dummy_expression = makeNode("PrimitiveExpression", null, "dummy");
  const dummies = {
    "__proto__": null,
    "super.get": makeNode("GetSuperEnclaveExpression", null, dummy_expression),
    "super.set": makeNode(
      "SetSuperEnclaveEffect",
      null,
      dummy_expression,
      dummy_expression,
    ),
    "super.call": makeNode(
      "CallSuperEnclaveExpression",
      null,
      dummy_expression,
    ),
    "new.target": makeNode("ReadEnclaveExpression", null, "new.target"),
    "this": makeNode("ReadEnclaveExpression", null, "this"),
    "arguments": makeNode("ReadEnclaveExpression", null, "arguments"),
    "var": makeNode(
      "DeclareEnclaveStatement",
      "var",
      "dummy",
      dummy_expression,
    ),
  };
  return (enclave) => dummies[enclave];
};
const makeEnclaveDummy = generateMakeEnclaveDummy();

const checkoutDigest = (digest, type) => {
  if (digest.length > 0) {
    throw new Error(`found ${getNodeType(digest[0])} in ${type}`);
  }
};

const generateGenerateIsBoundLinkExpression = () => {
  const callback = (_context, _annotation) => false;
  const import_callbacks = {
    __proto__: null,
    ImportLink: (
      {source: source1, specifier: specifier1},
      _annotation,
      source2,
      specifier2,
    ) => source1 === source2 && specifier1 === specifier2,
  };
  const export_callbacks = {
    __proto__: null,
    ExportLink: (specifier1, _annotation, specifier2) =>
      specifier1 === specifier2,
  };
  const callbacks = {
    __proto__: null,
    StaticImportExpression: (links, _annotation1, source, specifier) =>
      some(links, (link) =>
        dispatchNode({source, specifier}, link, import_callbacks, callback),
      ),
    StaticExportEffect: (links, _annotation, specifier, _expression) =>
      some(links, (link) =>
        dispatchNode(specifier, link, export_callbacks, callback),
      ),
  };
  return (links) => (node) => dispatchNode(links, node, callbacks, callback);
};
const generateIsBoundLinkExpression = generateGenerateIsBoundLinkExpression();

const digestNode = (node, type, path) => {
  if (typeof type === "string") {
    if (type in databases) {
      assert(
        apply(hasWeakMap, databases[type], [node]),
        `not a ${type} at ${path}`,
      );
      return apply(getWeakMap, databases[type], [node]);
    }
    assert(isSyntaxType(node, type), `not a ${type} at ${path}`);
    return [];
  }
  if (isArray(type)) {
    assert(isArray(node), `not an array at ${path}`);
    if (type.length === 2 && type[1] === "*") {
      type = repeat(type[0], node.length);
    } else {
      assert(type.length === node.length, `array length mismatch at ${path}`);
    }
    return flat(
      map(type, (_, index) =>
        digestNode(node[index], type[index], `${path}/${String(index)}`),
      ),
    );
  }
  /* c8 ignore start */
  throw new Error("node type should only be string or array");
  /* c8 ignore stop */
};

const generateExtractExportSpecifierArray = () => {
  const callbacks = {
    __proto__: null,
    ExportLink: (_context, _annotation, specifier) => [specifier],
  };
  const callback = (_context, _annotation) => [];
  return (node) => dispatchNode(null, node, callbacks, callback);
};
const extractExportSpecifierArray = generateExtractExportSpecifierArray();

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
  // Input //
  "InputExpression",
  // Label //
  "BreakStatement",
  // Identifier //
  "ReadExpression",
  "WriteEffect",
  // Link //
  "StaticImportExpression",
  "StaticExportEffect",
  // Enclave //
  "DeclareEnclaveStatement",
  "CallSuperEnclaveExpression",
  "GetSuperEnclaveExpression",
  "SetSuperEnclaveEffect",
  // Closure //
  "ReturnStatement",
  "AwaitExpression",
  "YieldExpression",
];

const isDuplicate = (element, index, array) =>
  lastIndexOf(array, element) > index;

const digestNestedBlock = (digest) => {
  assert(
    !some(digest, isLetDeclareEnclaveStatement),
    "found let DeclareEnclaveStatement in nested Block",
  );
  assert(
    !some(digest, isConstDeclareEnclaveStatement),
    "found const DeclareEnclaveStatement in nested Block",
  );
  return digest;
};

const generateGetEffectCompletion = () => {
  const callbacks = {
    __proto__: null,
    ExpressionEffect: (_context, _annotation, expression) =>
      isThrowExpression(expression) ? 0 : NaN,
  };
  const default_callback = (_context, _node) => NaN;
  return (expression) =>
    dispatchNode(null, expression, callbacks, default_callback);
};
const getEffectCompletion = generateGetEffectCompletion();
const generateGetStatementCompletion = () => {
  const callbacks = {
    __proto__: null,
    ReturnStatement: (_context, _annotation, _expression) => 1,
    EffectStatement: (_context, _annotation, effect) =>
      getEffectCompletion(effect),
    BlockStatement: (_context, _annotation, block) => getBlockCompletion(block),
    IfStatement: (_context, _annotation, _expression, block1, block2) =>
      getBlockCompletion(block1) + getBlockCompletion(block2),
    TryStatement: (_context, _annotation, block1, block2, _block3) =>
      getBlockCompletion(block1) + getBlockCompletion(block2),
  };
  const default_callback = (_context, _node) => NaN;
  return (statement) =>
    dispatchNode(null, statement, callbacks, default_callback);
};
const getStatementCompletion = generateGetStatementCompletion();
const generateGetBlockCompletion = () => {
  const callback = (_context, _annotation, labels, _variables, statements) =>
    labels.length === 0 && statements.length > 0
      ? getStatementCompletion(statements[statements.length - 1])
      : NaN;
  return (block) => extractNode(null, block, "Block", callback);
};
const getBlockCompletion = generateGetBlockCompletion();

const generateIsLabeledBlock = () => {
  const callback = (_context, _annotation, labels, _variables, _statements) =>
    labels.length > 0;
  return (block) => extractNode(null, block, "Block", callback);
};
const isLabeledBlock = generateIsLabeledBlock();

const generateValidateNode = () => {
  const callbacks = {
    __proto__: null,
    ModuleProgram: (digest, _annotation, links, block) => {
      assert(
        !isLabeledBlock(block),
        "ModuleProgram.body should not be a labeled Block",
      );
      assert(
        !some(flatMap(links, extractExportSpecifierArray), isDuplicate),
        "duplicate export link found in ModuleProgram",
      );
      digest = filterOut(digest, isThisReadEnclaveExpression);
      digest = filterOut(digest, isArgumentsReadEnclaveExpression);
      digest = filterOut(digest, isAwaitExpression);
      digest = filterOut(digest, generateIsBoundLinkExpression(links));
      checkoutDigest(digest, "ModuleProgram");
      return digest;
    },
    ScriptProgram: (digest, _annotation, statements) => {
      const completion =
        statements.length > 0
          ? getStatementCompletion(statements[statements.length - 1])
          : NaN;
      assert(
        !isNaN(completion),
        "The last statement of ScriptProgram.body should be a completion statement",
      );
      assert(
        filter(digest, isReturnStatement).length === completion,
        "ScriptProgram.body should only contain ReturnStatement in completion position",
      );
      digest = filterOut(digest, isReturnStatement);
      digest = filterOut(digest, isThisReadEnclaveExpression);
      digest = filterOut(digest, isArgumentsReadEnclaveExpression);
      digest = filterOut(digest, isDeclareEnclaveStatement);
      checkoutDigest(digest, "ScriptProgram");
      return digest;
    },
    EvalProgram: (digest, _annotation, enclaves, variables, block) => {
      const completion = getBlockCompletion(block);
      assert(
        !some(enclaves, isDuplicate),
        "duplicate enclaves found in EvalProgram",
      );
      assert(
        !isNaN(completion),
        "EvalProgram.body should be a completion Block",
      );
      assert(
        filter(digest, isReturnStatement).length === completion,
        "EvalProgram.body should only contain ReturnStatement in completion position",
      );
      digest = filterOut(digest, isReturnStatement);
      digest = filterOut(digest, generateIsBoundVariableNode(variables));
      if (includes(enclaves, "super.call")) {
        digest = filterOut(digest, isCallSuperEnclaveExpression);
      }
      if (includes(enclaves, "super.get")) {
        digest = filterOut(digest, isGetSuperEnclaveExpression);
      }
      if (includes(enclaves, "super.set")) {
        digest = filterOut(digest, isSetSuperEnclaveEffect);
      }
      if (includes(enclaves, "new.target")) {
        digest = filterOut(digest, isNewTargetReadEnclaveExpression);
      }
      if (includes(enclaves, "this")) {
        digest = filterOut(digest, isThisReadEnclaveExpression);
      }
      if (includes(enclaves, "arguments")) {
        digest = filterOut(digest, isArgumentsReadEnclaveExpression);
      }
      if (includes(enclaves, "var")) {
        digest = filterOut(digest, isVarDeclareEnclaveStatement);
      }
      checkoutDigest(digest, "EvalProgram");
      return digest;
    },
    AggregateLink: (digest, _annotation, _source, specifier1, specifier2) => {
      // export Foo as *   from "source"; // invalid
      // export *          from "source"; // valid
      // export *   as Foo from "source"; // valid
      assert(
        !(specifier1 !== null && specifier2 === null),
        "AggregateLink cannot have a non-null imported specifier and a null exported specifier",
      );
      return digest;
    },
    Block: (digest, _annotation, labels, variables, _statements) => {
      assert(!some(variables, isDuplicate), "duplicate variable found Block");
      assert(
        filter(digest, isInputExpression).length <= 1,
        "multiple InputExpression found in block",
      );
      digest = filterOut(digest, isInputExpression);
      digest = filterOut(digest, generateIsBoundBreakStatement(labels));
      digest = filterOut(digest, generateIsBoundVariableNode(variables));
      return digest;
    },
    ClosureExpression: (
      digest,
      _annotation,
      kind,
      asynchronous,
      generator,
      block,
    ) => {
      assert(
        !isNaN(getBlockCompletion(block)),
        "Closure.body should be a completion Block",
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
        kind === "arrow" || !some(digest, isNewTargetReadEnclaveExpression),
        "found new.target ReadEnclaveExpression in non-arrow ClosureExpression",
      );
      assert(
        kind === "arrow" || !some(digest, isThisReadEnclaveExpression),
        "found this ReadEnclaveExpression in non-arrow ClosureExpression",
      );
      assert(
        kind === "arrow" || !some(digest, isArgumentsReadEnclaveExpression),
        "found arguments ReadEnclaveExpression in non-arrow ClosureExpression",
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
        !some(digest, isDeclareEnclaveStatement),
        "found DeclareEnclaveStatement in ClosureExpression",
      );
      assert(
        kind === "arrow" || !some(digest, isCallSuperEnclaveExpression),
        "CallSuperEnclaveExpression in ClosureExpression",
      );
      assert(
        kind === "arrow" || !some(digest, isGetSuperEnclaveExpression),
        "GetSuperEnclaveExpression in non-arrow ClosureExpression",
      );
      assert(
        kind === "arrow" || !some(digest, isSetSuperEnclaveEffect),
        "SetSuperEnclaveExpression in non-arrow ClosureExpression",
      );
      assert(
        !some(digest, isBreakStatement),
        "unbound BreakStatement in ClosureExpression",
      );
      return digest;
    },
    BlockStatement: (digest, _annotation, _block) => digestNestedBlock(digest),
    IfStatement: (digest, _annotation, _expression, _block1, _block2) =>
      digestNestedBlock(digest),
    WhileStatement: (digest, _annotation, _expression, _block) =>
      digestNestedBlock(digest),
    TryStatement: (digest, _annotation, block1, block2, block3) => {
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
      return digestNestedBlock(digest);
    },
    EvalExpression: (digest, _annotation, enclaves, variables, _expression) => {
      assert(
        !some(enclaves, isDuplicate),
        "duplicate enclave found in EvalExpression",
      );
      assert(
        !some(variables, isDuplicate),
        "duplicate variable found in EvalExpression",
      );
      return concat(
        digest,
        map(enclaves, makeEnclaveDummy),
        map(variables, makeNonAnnotatedReadExpression),
      );
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
    if (
      includes(digestable, type) ||
      isThisReadEnclaveExpression(node) ||
      isNewTargetReadEnclaveExpression(node) ||
      isArgumentsReadEnclaveExpression(node)
    ) {
      digest = concat(digest, [node]);
    }
    apply(setWeakMap, databases[kind], [node, digest]);
    return node;
  };
};

export const validateNode = generateValidateNode();
