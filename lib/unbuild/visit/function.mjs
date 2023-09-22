// https://tc39.github.io/ecma262/#sec-function-instances

import { DynamicSyntaxAranError } from "../../error.mjs";
import {
  hoistClosure,
  isClosureStrict,
  listPatternVariable,
} from "../../estree/index.mjs";
import { hasFreeVariable } from "../../estree/variable.mjs";
import {
  StaticError,
  enumerate,
  every,
  filterOut,
  flatMap,
  hasOwn,
  includes,
  map,
  removeDuplicate,
} from "../../util/index.mjs";
import {
  makeAccessorDescriptorExpression,
  makeDataDescriptorExpression,
  makeGetExpression,
} from "../intrinsic.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
import {
  makeApplyExpression,
  makeBlockStatement,
  makeConditionalExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeFunctionExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeWriteEffect,
} from "../node.mjs";
import { makeScopeClosureBlock } from "../scope/block.mjs";
import { listScopeInitializeStatement } from "../scope/index.mjs";
import { makeLongSequenceExpression } from "../sequence.mjs";
import { unbuildControlBlock } from "./block.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildPatternStatement } from "./pattern.mjs";

const {
  Object: { values: listValue, fromEntries: reduceEntry },
} = globalThis;

const BASENAME = /** @basename */ "function";

// Two different scope frame:
// ==========================
// > function f (x = y) { var y; return x; }
// undefined
// > y
// Thrown:
// ReferenceError: y is not defined
// > f()
// Thrown:
// ReferenceError: y is not defined
//     at f (repl:1:17)

/** @type {(node: estree.Pattern) => boolean} */
const isRestElement = ({ type }) => type === "RestElement";

/**
 * @type {(
 *   variable: estree.Variable,
 * ) => [estree.Variable, estree.VariableKind]}
 */
const makeLetEntry = (variable) => [variable, "let"];

/** @type {(unknown: unknown) => boolean}  */
const isNull = (unknown) => unknown === null;

/**
 * @type {<S>(
 *   kind: aran.FunctionKind,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
const makeCompletion = (kind, serial) => {
  switch (kind) {
    case "arrow":
      return makePrimitiveExpression({ undefined: null }, serial);
    case "method":
      return makePrimitiveExpression({ undefined: null }, serial);
    case "function":
      return makeConditionalExpression(
        makeReadExpression("new.target", serial),
        makeReadExpression("this", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        serial,
      );
    case "constructor":
      return makeReadExpression("this", serial);
    default:
      throw new StaticError("invalid function kind", kind);
  }
};

/**
 * @type {<S>(
 *   node: estree.Pattern,
 *   context: import("./context.js").Context<S>,
 *   options: { index: number },
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
const unbuildParameter = (node, context, { index }) => {
  const { serialize, digest } = context;
  const serial = serialize(node);
  const hash = digest(node);
  const argument = {
    var: mangleMetaVariable(hash, BASENAME, "argument"),
    val:
      node.type === "RestElement"
        ? makeApplyExpression(
            makeIntrinsicExpression("Array.prototype.slice", serial),
            makeReadExpression("function.arguments", serial),
            [makePrimitiveExpression(index, serial)],
            serial,
          )
        : makeGetExpression(
            makeReadExpression("function.arguments", serial),
            makePrimitiveExpression(index, serial),
            serial,
          ),
  };
  return [
    makeEffectStatement(
      makeWriteEffect(argument.var, argument.val, serial, true),
      serial,
    ),
    ...unbuildPatternStatement(node, context, argument.var),
  ];
};

/**
 * @type {<S>(
 *   nodes: estree.Pattern[],
 *   context: import("./context.js").Context<S>,
 *   options: {
 *     self: unbuild.Variable,
 *     presence: {
 *       arguments: estree.Variable | null,
 *       callee: estree.Variable | null,
 *     },
 *     hash: unbuild.Hash,
 *     serial: S
 *   },
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
const listHeadStatement = (
  nodes,
  context,
  { self, presence, hash, serial },
) => {
  const arguments_ = {
    var: mangleMetaVariable(hash, BASENAME, "arguments"),
    val: makeApplyExpression(
      makeIntrinsicExpression("Object.fromEntries", serial),
      makePrimitiveExpression({ undefined: null }, serial),
      [
        makeApplyExpression(
          makeIntrinsicExpression("Object.entries", serial),
          makeReadExpression("function.arguments", serial),
          [],
          serial,
        ),
      ],
      serial,
    ),
  };
  return [
    ...(presence.callee === null
      ? []
      : listScopeInitializeStatement(context, presence.callee, self, serial)),
    ...(presence.arguments === null
      ? []
      : [
          makeEffectStatement(
            makeWriteEffect(arguments_.var, arguments_.val, serial, true),
            serial,
          ),
          makeEffectStatement(
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.defineProperty", serial),
                makePrimitiveExpression({ undefined: null }, serial),
                [
                  makeReadExpression(arguments_.var, serial),
                  makePrimitiveExpression("length", serial),
                  makeDataDescriptorExpression(
                    makePrimitiveExpression(true, serial),
                    makePrimitiveExpression(false, serial),
                    makePrimitiveExpression(true, serial),
                    makeGetExpression(
                      makeReadExpression("function.arguments", serial),
                      makePrimitiveExpression("length", serial),
                      serial,
                    ),
                    serial,
                  ),
                ],
                serial,
              ),
              serial,
            ),
            serial,
          ),
          makeEffectStatement(
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.defineProperty", serial),
                makePrimitiveExpression({ undefined: null }, serial),
                [
                  makeReadExpression(arguments_.var, serial),
                  makePrimitiveExpression("callee", serial),
                  context.strict
                    ? makeAccessorDescriptorExpression(
                        makeIntrinsicExpression(
                          "Function.prototype.arguments@get",
                          serial,
                        ),
                        makeIntrinsicExpression(
                          "Function.prototype.arguments@set",
                          serial,
                        ),
                        makePrimitiveExpression(false, serial),
                        makePrimitiveExpression(false, serial),
                        serial,
                      )
                    : makeDataDescriptorExpression(
                        makePrimitiveExpression(true, serial),
                        makePrimitiveExpression(false, serial),
                        makePrimitiveExpression(true, serial),
                        makeReadExpression(self, serial),
                        serial,
                      ),
                ],
                serial,
              ),
              serial,
            ),
            serial,
          ),
          makeEffectStatement(
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.defineProperty", serial),
                makePrimitiveExpression({ undefined: null }, serial),
                [
                  makeReadExpression(arguments_.var, serial),
                  makeIntrinsicExpression("Symbol.iterator", serial),
                  makeDataDescriptorExpression(
                    makePrimitiveExpression(true, serial),
                    makePrimitiveExpression(false, serial),
                    makePrimitiveExpression(true, serial),
                    makeIntrinsicExpression("Array.prototype.values", serial),
                    serial,
                  ),
                ],
                serial,
              ),
              serial,
            ),
            serial,
          ),
          ...listScopeInitializeStatement(
            context,
            presence.arguments,
            arguments_.var,
            serial,
          ),
        ]),
    ...(nodes.length === 1 && nodes[0].type === "RestElement"
      ? unbuildPatternStatement(
          nodes[0].argument,
          context,
          "function.arguments",
        )
      : flatMap(enumerate(nodes.length), (index) =>
          unbuildParameter(nodes[index], context, { index }),
        )),
  ];
};

/** @type {(node: estree.Pattern) => node is estree.Identifier} */
const isIdentifier = (node) => node.type === "Identifier";

/**
 * @type {(
 *   node: estree.Function,
 *   kind: aran.FunctionKind,
 *   strict: boolean,
 * ) => estree.Variable[]}
 */
const listClosureParameter = (node, kind, strict) => {
  const parameters = flatMap(node.params, listPatternVariable);
  if (kind === "arrow" || strict || every(node.params, isIdentifier)) {
    if (removeDuplicate(parameters).length !== parameters.length) {
      throw new DynamicSyntaxAranError("duplicate parameter", node);
    } else {
      return parameters;
    }
  } else {
    return removeDuplicate(parameters);
  }
};

/**
 * @type {(
 *   target: estree.Variable,
 *   parameters: estree.Variable[],
 *   record: Record<estree.Variable, unknown>,
 *   body: estree.Node[],
 * ) => boolean}
 */
const isPresent = (target, parameters, record, body) => {
  if (includes(parameters, target)) {
    return true;
  }
  if (hasOwn(record, target)) {
    return false;
  }
  return hasFreeVariable(body, target);
};

/**
 * @type {<S>(
 *   local: estree.Identifier | null | undefined,
 *   name: null | {
 *     type: "static",
 *     value: estree.Variable,
 *   } | {
 *     type: "dynamic",
 *     value: unbuild.Variable,
 *   },
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
const makeNameExpression = (local, name, serial) => {
  if (local != null) {
    return makePrimitiveExpression(local.name, serial);
  } else {
    if (name === null) {
      return makePrimitiveExpression("", serial);
    } else {
      switch (name.type) {
        case "static":
          return makePrimitiveExpression(name.value, serial);
        case "dynamic":
          return makeReadExpression(name.value, serial);
        default:
          throw new StaticError("invalid name type", name);
      }
    }
  }
};

/**
 * @type {<S>(
 *   node: estree.Function,
 *   context: import("./context.d.ts").Context<S>,
 *   options: {
 *     self: unbuild.Variable,
 *     kind: aran.FunctionKind,
 *     name: null | {
 *       type: "static",
 *       value: estree.Variable,
 *     } | {
 *       type: "dynamic",
 *       value: unbuild.Variable,
 *     },
 *     serial: S,
 *     hash: unbuild.Hash,
 *   },
 * ) => aran.Effect<unbuild.Atom<S>>[]}
 * } */
export const listFunctionEffect = (
  node,
  context,
  { self: self_var, kind, name, serial, hash },
) => {
  const strict = context.strict || isClosureStrict(node);
  const parameters = listClosureParameter(node, kind, strict);
  const kinds =
    node.body.type === "BlockStatement" ? hoistClosure(node.body.body) : {};
  const presence = {
    arguments:
      kind !== "arrow" &&
      isPresent(
        /** @type {estree.Variable} */ ("arguments"),
        parameters,
        kinds,
        node.body.type === "BlockStatement" ? node.body.body : [node.body],
      )
        ? /** @type {estree.Variable} */ ("arguments")
        : null,
    callee:
      node.type !== "ArrowFunctionExpression" &&
      node.id != null &&
      isPresent(
        /** @type {estree.Variable} */ (node.id.name),
        parameters,
        kinds,
        node.body.type === "BlockStatement" ? node.body.body : [node.body],
      )
        ? /** @type {estree.Variable} */ (node.id.name)
        : null,
  };
  const self_val = makeFunctionExpression(
    kind,
    !!node.async,
    !!node.generator,
    makeScopeClosureBlock(
      { ...context, strict },
      {
        type: "block",
        kinds: reduceEntry(
          map(
            [
              .../** @type {estree.Variable[]} */ (
                filterOut(listValue(presence), isNull)
              ),
              ...parameters,
            ],
            makeLetEntry,
          ),
        ),
        with: null,
      },
      // eslint-disable-next-line no-shadow
      (context) => [
        ...listHeadStatement(node.params, context, {
          self: self_var,
          presence,
          hash,
          serial,
        }),
        ...(node.body.type === "BlockStatement"
          ? [
              makeBlockStatement(
                unbuildControlBlock(node.body, context, {
                  kinds,
                  labels: [],
                  with: null,
                }),
                serial,
              ),
            ]
          : []),
      ],
      // eslint-disable-next-line no-shadow
      (context) =>
        node.body.type === "BlockStatement"
          ? makeCompletion(kind, serial)
          : unbuildExpression(node.body, context, null),
      serial,
    ),
    serial,
  );
  const self = { var: self_var, val: self_val };
  return [
    makeWriteEffect(self.var, self.val, serial, true),
    makeExpressionEffect(
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.defineProperty", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [
          makeReadExpression(self.var, serial),
          makePrimitiveExpression("name", serial),
          makeDataDescriptorExpression(
            null,
            null,
            null,
            makeNameExpression(
              node.type === "ArrowFunctionExpression" ? null : node.id,
              name,
              serial,
            ),
            serial,
          ),
        ],
        serial,
      ),
      serial,
    ),
    makeExpressionEffect(
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.defineProperty", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [
          makeReadExpression(self.var, serial),
          makePrimitiveExpression("length", serial),
          makeDataDescriptorExpression(
            null,
            null,
            null,
            makePrimitiveExpression(
              filterOut(node.params, isRestElement).length,
              serial,
            ),
            serial,
          ),
        ],
        serial,
      ),
      serial,
    ),
  ];
};

/**
 * @type {<S>(
 *   node: estree.Function,
 *   context: import("./context.d.ts").Context<S>,
 *   options: {
 *     kind: aran.FunctionKind,
 *     name: null | {
 *       type: "static",
 *       value: estree.Variable,
 *     } | {
 *       type: "dynamic",
 *       value: unbuild.Variable,
 *     },
 *   },
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const unbuildFunctionExpression = (node, context, { kind, name }) => {
  const { serialize, digest } = context;
  const serial = serialize(node);
  const hash = digest(node);
  const self = mangleMetaVariable(hash, BASENAME, "self");
  return makeLongSequenceExpression(
    listFunctionEffect(node, context, {
      self,
      kind,
      name,
      serial,
      hash,
    }),
    makeReadExpression(self, serial),
    serial,
  );
};

/**
 * @type {<S>(
 *   node: estree.Function,
 *   context: import("./context.d.ts").Context<S>,
 *   options: {},
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const unbuildFunctionDeclaration = (node, context, {}) => {
  const { serialize, digest } = context;
  const serial = serialize(node);
  const hash = digest(node);
  const self = mangleMetaVariable(hash, BASENAME, "self");
  return node.type === "ArrowFunctionExpression" || node.id == null
    ? []
    : [
        ...map(
          listFunctionEffect(node, context, {
            self,
            kind: "function",
            name: null,
            serial,
            hash,
          }),
          (effect) => makeEffectStatement(effect, serial),
        ),
        ...listScopeInitializeStatement(
          context,
          /** @type {estree.Variable} */ (node.id.name),
          self,
          serial,
        ),
      ];
};
