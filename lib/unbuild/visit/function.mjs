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
  filterOut,
  flatMap,
  hasOwn,
  includes,
  map,
  removeDuplicate,
  some,
} from "../../util/index.mjs";
import {
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
 *     callee: unbuild.Variable,
 *     presence: {
 *       arguments: estree.Variable | null,
 *       callee: estree.Variable | null,
 *     },
 *     hash: unbuild.Hash,
 *     serial: S
 *   },
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
const unbuildHead = (nodes, context, { callee, presence, hash, serial }) => {
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
      : listScopeInitializeStatement(context, presence.callee, callee, serial)),
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
                  makeDataDescriptorExpression(
                    makePrimitiveExpression(true, serial),
                    makePrimitiveExpression(false, serial),
                    makePrimitiveExpression(true, serial),
                    makeReadExpression(callee, serial),
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

/** @type {(node: estree.Pattern) => boolean} */
const isNotIdentifier = ({ type }) => type !== "Identifier";

/**
 * @type {(
 *   node: estree.Function,
 *   kind: aran.FunctionKind,
 *   strict: boolean,
 * ) => estree.Variable[]}
 */
const listClosureParameter = (node, kind, strict) => {
  const parameters = flatMap(node.params, listPatternVariable);
  if (kind === "arrow" || strict || some(node.params, isNotIdentifier)) {
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
 *   node: estree.Function,
 *   context: import("./context.js").Context<S>,
 *   options: { kind: aran.FunctionKind, name: estree.Variable | null },
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const unbuildFunction = (node, context, { kind, name }) => {
  const { serialize, digest } = context;
  const serial = serialize(node);
  const hash = digest(node);
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
  const callee_var = mangleMetaVariable(hash, "function", "callee");
  const callee_val = makeFunctionExpression(
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
        ...unbuildHead(node.params, context, {
          callee: callee_var,
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
  const callee = { var: callee_var, val: callee_val };
  return makeLongSequenceExpression(
    [
      makeWriteEffect(callee.var, callee.val, serial, true),
      makeExpressionEffect(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.defineProperty", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [
            makeReadExpression(callee.var, serial),
            makePrimitiveExpression("name", serial),
            makeDataDescriptorExpression(
              null,
              null,
              null,
              makePrimitiveExpression(
                node.type === "ArrowFunctionExpression" || node.id == null
                  ? name === null
                    ? ""
                    : name
                  : node.id.name,
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
            makeReadExpression(callee.var, serial),
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
    ],
    makeReadExpression(callee.var, serial),
    serial,
  );
};
