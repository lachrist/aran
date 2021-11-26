import {
  some,
  includes,
  filterOut,
  concat,
  map,
  flat,
  repeat,
  lastIndexOf,
} from "array-lite";
import {assert, generateThrowError} from "../../util.mjs";
import {getSyntax, isSyntaxType} from "./syntax.mjs";
import {
  generateMakeNodeSlow,
  dispatchNode,
  getNodeType,
  getNodeFieldArray,
} from "./accessor.mjs";

const {
  String,
  Proxy,
  Error,
  WeakMap,
  Array: {isArray},
  Reflect: {apply},
  WeakMap: {
    prototype: {set: setWeakMap, get: getWeakMap, has: hasWeakMap},
  },
  JSON: {stringify: stringifyJSON},
} = globalThis;

const syntax = getSyntax();

const generateGetNodeKind = () => {
  const kinds = {__proto__: null};
  for (const kind in syntax) {
    for (const type in syntax[kind]) {
      kinds[type] = kind;
    }
  }
  return (type) => kinds[type];
};
const getNodeKind = generateGetNodeKind();

const makePrimitiveExpression = generateMakeNodeSlow("PrimitiveExpression");
const makeReadExpression = generateMakeNodeSlow("ReadExpression");
const makeReadEnclaveExpression = generateMakeNodeSlow("ReadEnclaveExpression");
const makeGetSuperEnclaveExpression = generateMakeNodeSlow(
  "GetSuperEnclaveExpression",
);
const makeCallSuperEnclaveExpression = generateMakeNodeSlow(
  "CallSuperEnclaveExpression",
);
const makeDeclareEnclaveStatement = generateMakeNodeSlow(
  "DeclareEnclaveStatement",
);
const makeImportLink = generateMakeNodeSlow("ImportLink");
const makeExportLink = generateMakeNodeSlow("ExportLink");

const generateIsType = (type) => (node) => getNodeType(node) === type;
const isReturnStatement = generateIsType("ReturnStatement");
const isYieldExpression = generateIsType("YieldExpression");
const isAwaitExpression = generateIsType("AwaitExpression");
const isDeclareEnclaveStatement = generateIsType("DeclareEnclaveStatement");
const isCallSuperEnclaveExpression = generateIsType(
  "CallSuperEnclaveExpression",
);
const isGetSuperEnclaveExpression = generateIsType("GetSuperEnclaveExpression");
const isSetSuperEnclaveExpression = generateIsType("SetSuperEnclaveExpression");
const isBreakStatement = generateIsType("BreakStatement");

const generateIsBoundVariableExpression = (identifiers) => {
  const callbacks = {
    __proto__: null,
    ReadExpression: (context, node, identifier) =>
      includes(identifiers, identifier),
    WriteExpression: (context, node, identifier, expression) =>
      includes(identifiers, identifier),
  };
  const callback = (context, node) => false;
  return (node) => dispatchNode(null, node, callbacks, callback);
};

const generateIsBoundBreakStatement = (identifiers) => {
  const callbacks = {
    __proto__: null,
    BreakStatement: (context, node, identifier) =>
      includes(identifiers, identifier),
  };
  const callback = (context, node) => false;
  return (node) => dispatchNode(null, node, callbacks, callback);
};

const generateIsDeclareEnclaveStatement = (kind1) => {
  const callbacks = {
    __proto__: null,
    DeclareEnclaveStatement: (context, node, kind2, identifier, expression) =>
      kind1 === kind2,
  };
  const callback = (context, node) => false;
  return (node) => dispatchNode(null, node, callbacks, callback);
};
const isLetDeclareEnclaveStatement = generateIsDeclareEnclaveStatement("let");
const isConstDeclareEnclaveStatement =
  generateIsDeclareEnclaveStatement("const");
const isVarDeclareEnclaveStatement = generateIsDeclareEnclaveStatement("var");

const generateIsReadEnclaveExpression = (identifier1) => {
  const callbacks = {
    __proto__: null,
    ReadEnclaveExpression: (context, node, identifier2) =>
      identifier1 === identifier2,
  };
  const callback = (context, node) => false;
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
  const dummy_expression = makePrimitiveExpression(stringifyJSON("dummy"));
  const dummies = {
    "__proto__": null,
    "super": makeGetSuperEnclaveExpression(dummy_expression),
    "super()": makeCallSuperEnclaveExpression(dummy_expression),
    "new.target": makeReadEnclaveExpression("new.target"),
    "this": makeReadEnclaveExpression("this"),
    "arguments": makeReadEnclaveExpression("arguments"),
    "var": makeDeclareEnclaveStatement("var", "dummy", dummy_expression),
  };
  return (enclave) => dummies[enclave];
};
const makeEnclaveDummy = generateMakeEnclaveDummy();

const checkOut = (type, digest) => {
  if (digest.length > 0) {
    throw new Error(`found ${getNodeType(digest[0])} in ${type}`);
  }
};

const generateIsBoundLinkExpression = (links) => {
  const hash = map(links, stringifyJSON);
  const callbacks = {
    __proto__: null,
    ImportExpression: (context, node, specifier, source) =>
      includes(hash, stringifyJSON(makeImportLink(specifier, source))),
    ExportExpression: (context, node, specifier) =>
      includes(hash, stringifyJSON(makeExportLink(specifier))),
  };
  const callback = (context, node) => false;
  return (node) => dispatchNode(null, node, callbacks, callback);
};

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
  throw new Error("invalid node type");
};

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
  // Label //
  "BreakStatement",
  // Identifier //
  "ReadExpression",
  "WriteExpression",
  // Link //
  "ImportExpression",
  "ExportExpression",
  // Enclave //
  "DeclareEnclaveStatement",
  "CallSuperEnclaveExpression",
  "GetSuperEnclaveExpression",
  "SetSuperEnclaveExpression",
  // Closure //
  "ReturnStatement",
  "AwaitExpression",
  "YieldExpression",
];

const isDuplicate = (element, index, array) =>
  lastIndexOf(array, element) > index;

const generateValidateNode = () => {
  const callbacks = {
    __proto__: null,
    ModuleProgram: (digest, node, links, block) => {
      digest = filterOut(digest, isThisReadEnclaveExpression);
      digest = filterOut(digest, isArgumentsReadEnclaveExpression);
      digest = filterOut(digest, isVarDeclareEnclaveStatement);
      digest = filterOut(digest, isAwaitExpression);
      digest = filterOut(digest, generateIsBoundLinkExpression(links));
      checkOut(digest);
      return digest;
    },
    ScriptProgram: (digest, node, block) => {
      digest = filterOut(digest, isThisReadEnclaveExpression);
      digest = filterOut(digest, isArgumentsReadEnclaveExpression);
      digest = filterOut(digest, isDeclareEnclaveStatement);
      checkOut(digest);
      return digest;
    },
    EvalProgram: (digest, node, enclaves, identifiers, identifier, block) => {
      digest = filterOut(
        digest,
        generateIsBoundVariableExpression(identifiers),
      );
      if (includes(enclaves, "super()")) {
        digest = filterOut(digest, isCallSuperEnclaveExpression);
      }
      if (includes(enclaves, "super")) {
        digest = filterOut(digest, isGetSuperEnclaveExpression);
        digest = filterOut(digest, isSetSuperEnclaveExpression);
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
      checkOut(digest);
      return digest;
    },
    Block: (digest, node, identifiers, statements) => {
      digest = filterOut(
        digest,
        generateIsBoundVariableExpression(identifiers),
      );
      assert(
        !some(identifiers, isDuplicate),
        "duplicate identifier found Block",
      );
      assert(
        !some(digest, isLetDeclareEnclaveStatement),
        "found let DeclareEnclaveStatement in Block, let DeclareEnclaveStatement should only appear at the top-level of ScriptProgram",
      );
      assert(
        !some(digest, isConstDeclareEnclaveStatement),
        "found const DeclareEnclaveStatement in Block, const DeclareEnclaveStatement should only appear at the top-level of ScriptProgram",
      );
      return digest;
    },
    ClosureExpression: (digest, node, kind, generator, asynchronous, block) => {
      digest = filterOut(digest, isReturnStatement);
      if (!generator) {
        digest = filterOut(digest, isYieldExpression);
      }
      if (!asynchronous) {
        digest = filterOut(digest, isAwaitExpression);
      }
      assert(
        !generator || (kind !== "arrow" && kind !== "constructor"),
        "arrow/constructor ClosureExpression cannot be generator",
      );
      assert(
        !asynchronous || kind !== "constructor",
        "constructor ClosureExpression cannot be asynchronous",
      );
      assert(
        kind === "arrow" || !some(isNewTargetReadEnclaveExpression),
        "found new.target ReadEnclaveExpression in non-arrow ClosureExpression",
      );
      assert(
        kind === "arrow" || !some(isThisReadEnclaveExpression),
        "found this ReadEnclaveExpression in non-arrow ClosureExpression",
      );
      assert(
        kind === "arrow" || !some(isArgumentsReadEnclaveExpression),
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
        !some(digest, isCallSuperEnclaveExpression),
        "CallSuperEnclaveExpression in ClosureExpression",
      );
      assert(
        kind === "arrow" || !some(digest, isGetSuperEnclaveExpression),
        "GetSuperEnclaveExpression in non-arrow ClosureExpression",
      );
      assert(
        kind === "arrow" || !some(digest, isSetSuperEnclaveExpression),
        "SetSuperEnclaveExpression in non-arrow ClosureExpression",
      );
      assert(
        !some(digest, isBreakStatement),
        "unbound BreakStatement in ClosureExpression",
      );
      return digest;
    },
    BlockStatement: (digest, node, labels, block) =>
      filterOut(digest, generateIsBoundBreakStatement(labels)),
    IfStatement: (digest, node, labels, expression, block1, block2) =>
      filterOut(digest, generateIsBoundBreakStatement(labels)),
    WhileStatement: (digest, node, labels, expression, block) =>
      filterOut(digest, generateIsBoundBreakStatement(labels)),
    TryStatement: (digest, node, labels, block1, block2, block3) =>
      filterOut(digest, generateIsBoundBreakStatement(labels)),
    ExportExpression: (digest, node, specifier) => {
      assert(specifier !== null, "ExportExpression specifier cannot be null");
      return digest;
    },
    EvalExpression: (
      digest,
      node,
      enclaves,
      identifiers,
      identifier,
      expression,
    ) =>
      concat(
        digest,
        map(enclaves, makeEnclaveDummy),
        map(identifiers, makeReadExpression),
      ),
  };
  const callback = (digest, node) => digest;
  return (node) => {
    node = new Proxy(immutable_trap_object, node);
    const type = getNodeType(node);
    const kind = getNodeKind(node);
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
    apply(databases[kind], setWeakMap, [node, digest]);
    return node;
  };
};

export const validateNode = generateValidateNode();
