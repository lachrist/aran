// https://tc39.github.io/ecma262/#sec-function-instances

import { SyntaxAranError } from "../../error.mjs";
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
import { ANONYMOUS, makeNameExpression } from "../name.mjs";
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
 *   context: import("../context.js").Context<S>,
 *   options: { index: number },
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
const unbuildParameter = (node, context, { index }) => {
  const { serialize, digest } = context;
  const serial = serialize(node);
  const hash = digest(node);
  const argument = mangleMetaVariable(hash, BASENAME, "argument");
  return [
    makeEffectStatement(
      makeWriteEffect(
        argument,
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
        serial,
        true,
      ),
      serial,
    ),
    ...unbuildPatternStatement(node, context, argument),
  ];
};

/**
 * @type {<S>(
 *   nodes: estree.Pattern[],
 *   context: import("../context.js").Context<S>,
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
const listHeadStatement = (
  nodes,
  context,
  { callee, presence, hash, serial },
) => {
  const arguments_ = mangleMetaVariable(hash, BASENAME, "arguments");
  return [
    ...(presence.callee === null
      ? []
      : listScopeInitializeStatement(context, presence.callee, callee, serial)),
    ...(presence.arguments === null
      ? []
      : [
          makeEffectStatement(
            makeWriteEffect(
              arguments_,
              makeApplyExpression(
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
              serial,
              true,
            ),
            serial,
          ),
          makeEffectStatement(
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.defineProperty", serial),
                makePrimitiveExpression({ undefined: null }, serial),
                [
                  makeReadExpression(arguments_, serial),
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
                  makeReadExpression(arguments_, serial),
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
                  makeReadExpression(arguments_, serial),
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
            arguments_,
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
      throw new SyntaxAranError("duplicate parameter", node);
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
 *   context: import("../context.js").Context<S>,
 *   options: {
 *     kind: aran.FunctionKind,
 *     name: import("../name.mjs").Name,
 *   },
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const unbuildFunction = (node, context, { kind, name }) => {
  const { serialize, digest } = context;
  const serial = serialize(node);
  const hash = digest(node);
  const self = mangleMetaVariable(hash, BASENAME, "self");
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
  return makeLongSequenceExpression(
    [
      makeWriteEffect(
        self,
        makeFunctionExpression(
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
                callee: self,
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
                        completion: null,
                        with: null,
                        loop: {
                          break: null,
                          continue: null,
                        },
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
                : unbuildExpression(node.body, context, { name: ANONYMOUS }),
            serial,
          ),
          serial,
        ),
        serial,
        true,
      ),
      makeExpressionEffect(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.defineProperty", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [
            makeReadExpression(self, serial),
            makePrimitiveExpression("length", serial),
            makeDataDescriptorExpression(
              makePrimitiveExpression(false, serial),
              makePrimitiveExpression(false, serial),
              makePrimitiveExpression(true, serial),
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
      makeExpressionEffect(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.defineProperty", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [
            makeReadExpression(self, serial),
            makePrimitiveExpression("name", serial),
            makeDataDescriptorExpression(
              makePrimitiveExpression(false, serial),
              makePrimitiveExpression(false, serial),
              makePrimitiveExpression(true, serial),
              node.type !== "ArrowFunctionExpression" && node.id != null
                ? makePrimitiveExpression(node.id.name, serial)
                : makeNameExpression(name, serial),
              serial,
            ),
          ],
          serial,
        ),
        serial,
      ),
      ...(context.strict
        ? []
        : [
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.defineProperty", serial),
                makePrimitiveExpression({ undefined: null }, serial),
                [
                  makeReadExpression(self, serial),
                  makePrimitiveExpression("arguments", serial),
                  makeDataDescriptorExpression(
                    makePrimitiveExpression(false, serial),
                    makePrimitiveExpression(false, serial),
                    makePrimitiveExpression(false, serial),
                    makePrimitiveExpression(null, serial),
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
                  makeReadExpression(self, serial),
                  makePrimitiveExpression("caller", serial),
                  makeDataDescriptorExpression(
                    makePrimitiveExpression(false, serial),
                    makePrimitiveExpression(false, serial),
                    makePrimitiveExpression(false, serial),
                    makePrimitiveExpression(null, serial),
                    serial,
                  ),
                ],
                serial,
              ),
              serial,
            ),
          ]),
    ],
    makeReadExpression(self, serial),
    serial,
  );
};
