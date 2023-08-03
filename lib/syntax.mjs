import { hasOwn } from "./util/index.mjs";

const { Error, BigInt, String, undefined } = globalThis;

/** @type {(primitive: Primitive) => PackPrimitive} */
export const packPrimitive = (primitive) => {
  if (primitive === undefined) {
    return { undefined: null };
  } else if (typeof primitive === "bigint") {
    return { bigint: String(primitive) };
  } else {
    return primitive;
  }
};

/** @type {(primitive: PackPrimitive) => Primitive} */
export const unpackPrimitive = (primitive) => {
  if (typeof primitive === "object" && primitive !== null) {
    if (hasOwn(primitive, "undefined")) {
      return undefined;
    } else if (hasOwn(primitive, "bigint")) {
      return BigInt(primitive.bigint);
    } else {
      throw new Error("invalid primitive");
    }
  } else {
    return primitive;
  }
};

/** @type {<T>(node: Node<undefined | T>, tag: T) => Node<undefined | T>} */
export const tagNode = (node) => ({
  ...node,
});

/** @type {Parameter[]} */
export const PARAMETER_ENUM = [
  "this",
  "new.target",
  "import",
  "arguments",
  "error",
  "import.meta",
  "super.call",
  "super.get",
  "super.set",
];

/** @type {Intrinsic[]} */
export const INTRINSIC_ENUM = [
  // Aran //
  "aran.global.cache",
  "aran.global.record.variables",
  "aran.global.record.values",
  "aran.global.object",
  "aran.unary",
  "aran.binary",
  "aran.throw",
  "aran.createObject",
  "aran.get",
  "aran.set",
  "aran.delete",
  "aran.deadzone",
  "aran.AranError",
  "aran.asynchronousGeneratorPrototype",
  "aran.generatorPrototype",
  // Grabbable //
  "globalThis",
  "Object", // Convertion inside destructuring pattern + super
  "Reflect.defineProperty", // Proxy Arguments trap :(
  "eval",
  "Symbol",
  "Symbol.unscopables",
  "Symbol.asyncIterator",
  "Symbol.iterator",
  "Symbol.isConcatSpreadable",
  "Function.prototype.arguments@get",
  "Function.prototype.arguments@set",
  "Array.prototype.values",
  "Object.prototype",
  // Convertion //
  "String",
  // Object
  "Array.from",
  "Array.prototype.flat",
  // Construction //
  "Object.create",
  "Array.of",
  "Proxy",
  "RegExp",
  "TypeError",
  "ReferenceError",
  "SyntaxError",
  // Readers //
  "Reflect.get",
  "Reflect.has",
  "Reflect.construct",
  "Reflect.apply",
  "Reflect.setProtoypeOf",
  "Reflect.getPrototypeOf",
  "Reflect.ownKeys",
  "Reflect.isExtensible",
  "Object.keys",
  "Array.prototype.concat",
  "Array.prototype.includes",
  "Array.prototype.slice",
  // Writers //
  "Reflect.set",
  "Reflect.deleteProperty",
  "Reflect.setPrototypeOf",
  // "Reflect.defineProperty",
  "Reflect.getOwnPropertyDescriptor",
  "Reflect.preventExtensions",
  "Object.assign",
  "Object.freeze",
  "Object.defineProperty",
  "Object.setPrototypeOf",
  "Object.preventExtensions",
  "Array.prototype.fill",
  "Array.prototype.push",
];

/////////////
// Program //
/////////////

/** @type {<T>(statements: Statement<T>[]) => Program<T>} */
export const makeScriptProgram = (statements) => ({
  type: "ScriptProgram",
  statements,
});

/** @type {<T>(links: Link<T>[], body: Block<T>) => Program<T>} */
export const makeModuleProgram = (links, body) => ({
  type: "ModuleProgram",
  links,
  body,
});

/** @type {<T(body: Block<T>) => Program<T>} */
export const makeEvalProgram = (body) => ({
  type: "EvalProgram",
  body,
});

//////////
// Link //
//////////

/** @type {<T>(source: string, import_: string | null) => Link<T>} */
export const makeImportLink = (source, import_) => ({
  type: "ImportLink",
  source,
  import: import_,
});

/** @type {<T>(export_: string) => Link<T>} */
export const makeExportLink = (export_) => ({
  type: "ExportLink",
  export: export_,
});

/**
 * @type {<T>(
 *   source: string,
 *   import_: string | null,
 *   export_: string | null,
 * ) => Link<T>}
 */
export const makeAggregateLink = (source, import_, export_) => ({
  type: "AggregateLink",
  source,
  import: import_,
  export: export_,
});

///////////
// Block //
///////////

/**
 * @type {<T>(
 *   labels: string[],
 *   variables: string[],
 *   statements: Statement<T>[],
 * ) => Block<T>}
 */
export const makeBlock = (labels, variables, statements) => ({
  type: "Block",
  labels,
  variables,
  statements,
});

///////////////
// Statement //
///////////////

/** @type {<T>(expression: Effect<T>) => Statement<T>} */
export const makeEffectStatement = (effect) => ({
  type: "EffectStatement",
  effect,
});

/**
 * @type {<T>(
 *   kind: VariableKind,
 *   variable: string,
 *   value: Expression<T>,
 * ) => Statement<T>}
 */
export const makeDeclareExternalStatement = (kind, variable, value) => ({
  type: "DeclareExternalStatement",
  kind,
  variable,
  value,
});

/** @type {<T>(expression: Expression<T>) => Statement<T>} */
export const makeReturnStatement = (value) => ({
  type: "ReturnStatement",
  value,
});

/** @type {<T>() => Statement<T>} */
export const makeDebuggerStatement = () => ({
  type: "DebuggerStatement",
});

/** @type {<T>(label: string) => Statement<T>} */
export const makeBreakStatement = (label) => ({
  type: "BreakStatement",
  label,
});

/** @type {<T>(body: Block<T>) => Statement<T>} */
export const makeBlockStatement = (body) => ({
  type: "BlockStatement",
  body,
});

/**
 * @type {<T>(
 *   test: Expression<T>,
 *   then_: Block<T>,
 *   else_: Block<T>,
 * ) => Statement<T>}
 */
export const makeIfStatement = (test, then_, else_) => ({
  type: "IfStatement",
  test,
  then: then_,
  else: else_,
});

/**
 * @type {<T>(
 *   body: Block<T>,
 *   catch_: Block<T>,
 *   finally_: Block<T>,
 * ) => Statement<T>}
 */
export const makeTryStatement = (body, catch_, finally_) => ({
  type: "TryStatement",
  body,
  catch: catch_,
  finally: finally_,
});

/** @type {<T>(test: Expression<T>, body: Block<T>) => Statement<T>} */
export const makeWhileStatement = (test, body) => ({
  type: "WhileStatement",
  test,
  body,
});

////////////
// Effect //
////////////

/** @type {<T>(discard: Expression<T>) => Effect<T>} */
export const makeExpressionEffect = (discard) => ({
  type: "ExpressionEffect",
  discard,
});

/** @type {<T>(variable: string, value: Expression<T>) => Effect<T>} */
export const makeWriteEffect = (variable, value) => ({
  type: "WriteEffect",
  variable,
  value,
});

/** @type {<T>(variable: string, value: Expression<T>) => Effect<T>} */
export const makeWriteExternalEffect = (variable, value) => ({
  type: "WriteExternalEffect",
  variable,
  value,
});

/**
 * @type {<T>(
 *   export_: string,
 *   value: Expression<T>,
 * ) => Effect<T>}
 */
export const makeExportEffect = (export_, value) => ({
  type: "ExportEffect",
  export: export_,
  value,
});

/**
 * @type {<T>(
 *   test: Expression<T>,
 *   positive: Effect<T>[],
 *   negative: Effect<T>[],
 * ) => Effect<T>}
 */
export const makeConditionalEffect = (test, positive, negative) => ({
  type: "ConditionalEffect",
  test,
  positive,
  negative,
});

////////////////
// Expression //
////////////////

/** @type {<T>(primitive: PackPrimitive) => Expression<T>} */
export const makePrimitiveExpression = (primitive) => ({
  type: "PrimitiveExpression",
  primitive,
});

/** @type {<T>(parameter: Parameter) => Expression<T>} */
export const makeParameterExpression = (parameter) => ({
  type: "ParameterExpression",
  parameter,
});

/**
 * @type {<T>(
 *   source: string,
 *   import_: string | null,
 * ) => Expression<T>}
 */
export const makeImportExpression = (source, import_) => ({
  type: "ImportExpression",
  source,
  import: import_,
});

/** @type {<T>(intrinsic: Intrinsic) => Expression<T>} */
export const makeIntrinsicExpression = (intrinsic) => ({
  type: "IntrinsicExpression",
  intrinsic,
});

/** @type {<T>(variable: string) => Expression<T>} */
export const makeReadExpression = (variable) => ({
  type: "ReadExpression",
  variable,
});

/** @type {<T>(variable: string) => Expression<T>} */
export const makeReadExternalExpression = (variable) => ({
  type: "ReadExternalExpression",
  variable,
});

/** @type {<T>(variable: string) => Expression<T>} */
export const makeTypeofExternalExpression = (variable) => ({
  type: "TypeofExternalExpression",
  variable,
});

/**
 * @type {<T>(
 *   kind: ClosureKind,
 *   asynchronous: boolean,
 *   generator: boolean,
 *   body: Block<T>,
 * ) => Expression<T>}
 */
export const makeClosureExpression = (kind, asynchronous, generator, body) => ({
  type: "ClosureExpression",
  kind,
  asynchronous,
  generator,
  body,
});

/** @type {<T>(value: Expression<T>) => Expression<T>} */
export const makeAwaitExpression = (value) => ({
  type: "AwaitExpression",
  value,
});

/**
 * @type {<T>(
 *   delegate: boolean,
 *   value: Expression<T>,
 * ) => Expression<T>}
 */
export const makeYieldExpression = (delegate, value) => ({
  type: "YieldExpression",
  delegate,
  value,
});

/**
 * @type {<T>(
 *   effect: Effect<T>,
 *   value: Expression<T>,
 * ) => Expression<T>}
 */
export const makeSequenceExpression = (effect, value) => ({
  type: "SequenceExpression",
  effect,
  value,
});

/**
 * @type {<T>(
 *   test: Expression<T>,
 *   consequent: Expression<T>,
 *   alternate: Expression<T>,
 * ) => Expression<T>}
 */
export const makeConditionalExpression = (test, consequent, alternate) => ({
  type: "ConditionalExpression",
  test,
  consequent,
  alternate,
});

/** @type {<T>(argument: Expression<T>) => Expression<T>} */
export const makeEvalExpression = (argument) => ({
  type: "EvalExpression",
  argument,
});

/**
 * @type {<T>(
 *   callee: Expression<T>,
 *   this_: Expression<T>,
 *   arguments_: Expression<T>[],
 * ) => Expression<T>}
 */
export const makeApplyExpression = (callee, this_, arguments_) => ({
  type: "ApplyExpression",
  callee,
  this: this_,
  arguments: arguments_,
});

/**
 * @type {<T>(
 *   callee: Expression<T>,
 *   arguments_: Expression<T>[],
 * ) => Expression<T>}
 */
export const makeConstructExpression = (callee, arguments_) => ({
  type: "ConstructExpression",
  callee,
  arguments: arguments_,
});
