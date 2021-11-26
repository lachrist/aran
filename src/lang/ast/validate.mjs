import {
  some,
  includes,
  filterOut,
  concat,
  map,
  flaten,
  repeat,
} from "array-lite";
import {assert, generateDeadcode} from "../../util.mjs";
import {getSyntax, isSyntaxType} from "./syntax.mjs";
import {dispatchNode, getNodeType, getNodeFieldArray} from "./accessor.mjs";

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

const generateMake1 = (type) => (field1) => [type, field1];
const generateMake2 = (type) => (field1, field2) => [type, field1, field2];
const generateMake3 = (type) => (field1, field2, field3) =>
  [type, field1, field2, field3];
const makePrimitiveExpression = generateMake1("PrimitiveExpression");
const makeReadExpression = generateMake1("ReadExpression");
const makeReadEnclaveExpression = generateMake1("ReadEnclaveExpression");
const makeGetSuperEnclaveExpression = generateMake1(
  "GetSuperEnclaveExpression",
);
const makeCallSuperEnclaveExpression = generateMake1(
  "CallSuperEnclaveExpression",
);
const makeDeclareEnclaveStatement = generateMake3("DeclareEnclaveStatement");
const makeImportLink = generateMake2("ImportLink");
const makeExportLink = generateMake1("ExportLink");

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

const generateIsReadVariableEnclaveExpression = (identifier1) => {
  const callbacks = {
    __proto__: null,
    ReadVariableEnclaveExpression: (context, node, identifier2) =>
      identifier1 === identifier2,
  };
  const callback = (context, node) => false;
  return (node) => dispatchNode(null, node, callbacks, callback);
};
const isThisReadVariableEnclaveExpression =
  generateIsReadVariableEnclaveExpression("this");
const isNewTargetReadVariableEnclaveExpression =
  generateIsReadVariableEnclaveExpression("new.target");
const isArgumentsReadVariableEnclaveExpression =
  generateIsReadVariableEnclaveExpression("arguments");

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
    return flaten(
      map(type, (_, index) =>
        digestNode(node[index], type[index], `${path}/${String(index)}`),
      ),
    );
  }
  throw new Error("invalid node type");
};

const immutable_trap_object = {
  __proto__: null,
  setPrototypeOf: generateDeadcode("caught setPrototypeOf on immutable node"),
  preventExtensions: generateDeadcode(
    "caught preventExtensions on immutable node",
  ),
  defineProperty: generateDeadcode("caught defineProperty on immutable node"),
  deleteProperty: generateDeadcode("caught deleteProperty on immutable node"),
  set: generateDeadcode("caught set on immutable node"),
};

const generateValidateNode = () => {
  const callbacks = {
    __proto__: null,
    ModuleProgram: (digest, node, links, block) => {
      digest = filterOut(digest, isVarDeclareEnclaveStatement);
      digest = filterOut(digest, isAwaitExpression);
      digest = filterOut(digest, generateIsBoundLinkExpression(links));
      checkOut(digest);
      return digest;
    },
    ScriptProgram: (digest, node, block) => {
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
        digest = filterOut(digest, isNewTargetReadVariableEnclaveExpression);
      }
      if (includes(enclaves, "this")) {
        digest = filterOut(digest, isThisReadVariableEnclaveExpression);
      }
      if (includes(enclaves, "arguments")) {
        digest = filterOut(digest, isArgumentsReadVariableEnclaveExpression);
      }
      if (includes(enclaves, "var")) {
        digest = filterOut(digest, isVarDeclareEnclaveStatement);
      }
      checkOut(digest);
      return digest;
    },
    BlockStatement: (digest, node, identifiers, statements) => {
      digest = filterOut(
        digest,
        generateIsBoundVariableExpression(identifiers),
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
        kind === "arrow" || !some(isNewTargetReadVariableEnclaveExpression),
        "found new.target EnclaveVariableExpression in non-arrow ClosureExpression",
      );
      assert(
        kind === "arrow" || !some(isThisReadVariableEnclaveExpression),
        "found this EnclaveVariableExpression in non-arrow ClosureExpression",
      );
      assert(
        kind === "arrow" || !some(isArgumentsReadVariableEnclaveExpression),
        "found arguments EnclaveVariableExpression in non-arrow ClosureExpression",
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
    apply(databases[kind], setWeakMap, [
      node,
      dispatchNode(
        digestNode(getNodeFieldArray(node), syntax[kind][type], type),
        node,
        callbacks,
        callback,
      ),
    ]);
    return node;
  };
};

export const validateNode = generateValidateNode();
