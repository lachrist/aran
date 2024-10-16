/* eslint-disable no-use-before-define */
import {
  EMPTY,
  compileGet,
  concatXX,
  concat_,
  concat__,
  concat___,
  findFirstIndex,
  flatMap,
  guard,
  hasOwn,
  map,
  mapIndex,
  tuple2,
  slice,
  some,
  get0,
  someTree,
  isTreeEmpty,
  hasTree,
  mapTree,
  concat_____,
  flatenTree,
  concat____,
  EMPTY_SEQUENCE,
  NULL_SEQUENCE,
  bindSequence,
  callSequence_X_,
  callSequence__X_,
  callSequence___X,
  flatSequence,
  liftSequenceX,
  liftSequenceXX,
  liftSequenceXXXXX,
  liftSequenceXXX_,
  liftSequenceXX_,
  liftSequenceX_,
  liftSequenceX_X_,
  liftSequence_X,
  liftSequence_XXX,
  liftSequence_X_,
  liftSequence_X__,
  liftSequence__X,
  liftSequence__X_,
  listenSequence,
  mapSequence,
  zeroSequence,
} from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import {
  makeUpdateResultOperation,
  listInitializeVariableEffect,
  listUpdateResultEffect,
  listWriteSloppyFunctionVariableEffect,
  extendWithVariable,
  extendCatch,
  makeReadErrorExpression,
  extendSwitchRegularVariable,
  extendNormalRegularVariable,
  makeReadVariableExpression,
  makeInitVariableOperation,
} from "../scope/index.mjs";
import {
  mangleBreakLabel,
  mangleContinueLabel,
  mangleEmptyBreakLabel,
  mangleEmptyContinueLabel,
  RETURN_BREAK_LABEL,
} from "../mangle.mjs";
import {
  listEffectStatement,
  makeApplyExpression,
  makeAwaitExpression,
  makeBlockStatement,
  makeBreakStatement,
  makeConditionalEffect,
  makeConditionalExpression,
  makeSegmentBlock,
  makeDebuggerStatement,
  makeEffectStatement,
  makeExpressionEffect,
  makeIfStatement,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeSequenceExpression,
  makeTryStatement,
  makeWhileStatement,
  makeTreeSegmentBlock,
  listExpressionEffect,
} from "../node.mjs";
import {
  listResetCompletionStatement,
  unbuildSegmentBody,
  unbuildFinallyBody,
} from "./body.mjs";
import { unbuildCatch } from "./catch.mjs";
import { unbuildExpression } from "./expression.mjs";
import { hasEmptyBreak, hasEmptyContinue } from "../query/index.mjs";
import {
  unbuildWriteDeclarator,
  unbuildInitializeDeclarator,
} from "./declarator.mjs";
import { unbuildEffect } from "./effect.mjs";
import {
  makeBinaryExpression,
  makeGetExpression,
  makeThrowErrorExpression,
} from "../intrinsic.mjs";
import { unbuildCase } from "./case.mjs";
import { unbuildClass } from "./class.mjs";
import { unbuildDefault } from "./default.mjs";
import {
  unbuildRegularInit,
  unbuildLexicalInit,
  unbuildLeftBody,
  unbuildLeftHead,
} from "./left.mjs";
import { unbuildHoistedStatement } from "./hoisted.mjs";
import {
  makeReadCacheExpression,
  makeWriteCacheEffect,
  cacheConstant,
  cacheWritable,
} from "../cache.mjs";
import { makeIsProperObjectExpression } from "../helper.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  incorporateSegmentBlock,
  incorporateEffect,
  incorporateStatement,
  initSyntaxErrorExpression,
  isBaseDeclarationPrelude,
} from "../prelude/index.mjs";
import { hoist, isCompletion } from "../annotation/index.mjs";

/**
 * @type {(
 *   labels: import("../../util/tree").Tree<import("../atom").Label>,
 *   body: import("../../util/sequence").Sequence<
 *     import("../prelude").BodyPrelude,
 *     import("../../util/tree").Tree<import("../atom").Statement>
 *   >,
 *   hash: import("../../hash").Hash,
 * ) => import("../../util/sequence").Sequence<
 *     import("../prelude").BodyPrelude,
 *     import("../../util/tree").Tree<import("../atom").Statement>
 *   >}
 */
export const listControlStatement = (labels, body, hash) => {
  if (
    !isTreeEmpty(labels) ||
    someTree(listenSequence(body), isBaseDeclarationPrelude)
  ) {
    return liftSequenceX(
      concat_,
      liftSequenceX_(
        makeBlockStatement,
        incorporateSegmentBlock(
          liftSequence__X_(makeTreeSegmentBlock, labels, EMPTY, body, hash),
          hash,
        ),
        hash,
      ),
    );
  } else {
    // This may seem unsafe because it moves meta variables in parent scope.
    // But control flow only occurs in proper block.
    // So this can only be used in naked block and hence it is safe.
    return body;
  }
};

/**
 * @type {(
 *   node: import("estree-sentry").ReturnStatement<import("../../hash").HashProp>,
 * ) => node is import("estree-sentry").ReturnStatement<import("../../hash").HashProp> & {
 *   argument: import("estree-sentry").Expression<import("../../hash").HashProp>,
 * }}
 */
const hasReturnArgument = (node) => node.argument != null;

/**
 * @type {(
 *   node: import("estree-sentry").ExportNamedDeclaration<import("../../hash").HashProp>,
 * ) => node is import("estree-sentry").ExportNamedDeclaration<import("../../hash").HashProp> & {
 *   declaration: (
 *     | import("estree-sentry").FunctionDeclaration<import("../../hash").HashProp>
 *     | import("estree-sentry").ClassDeclaration<import("../../hash").HashProp>
 *     | import("estree-sentry").VariableDeclaration<import("../../hash").HashProp>
 *   ),
 * }}
 */
const hasExportDeclaration = (node) => node.declaration != null;

/**
 * @type {<X>(
 *   node: import("estree-sentry").Node<X>,
 * ) => node is import("../estree").LexicalForStatement<X>}
 */
const isLexicalForStatement = (node) =>
  node.type === "ForStatement" &&
  node.init != null &&
  node.init.type === "VariableDeclaration" &&
  (node.init.kind === "let" || node.init.kind === "const");

const getConsequent = compileGet("consequent");

/**
 * @type {<X>(
 *   node: import("estree-sentry").SwitchCase<X>
 * ) => boolean}
 */
const isDefaultSwitchCase = (node) => node.test == null;

/**
 * @type {<X>(
 *   node: import("estree-sentry").SwitchStatement<X>,
 * ) => import("estree-sentry").Statement<X>[]}
 */
export const listSwitchRemainder = (node) => {
  const index = findFirstIndex(node.cases, isDefaultSwitchCase);
  if (index === -1 || index === node.cases.length - 1) {
    return EMPTY;
  } else {
    return flatMap(slice(node.cases, index, node.cases.length), getConsequent);
  }
};

/**
 * @type {(
 *   node: import("estree-sentry").Statement<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   labeling: import("../labeling").StatementLabeling,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../../util/tree").Tree<import("../atom").Statement>,
 * >}
 */
export const unbuildStatement = (node, meta, scope, { labels, loop }) => {
  const { _hash: hash } = node;
  switch (node.type) {
    case "EmptyStatement": {
      return NULL_SEQUENCE;
    }
    case "DebuggerStatement": {
      return zeroSequence(makeDebuggerStatement(hash));
    }
    case "ReturnStatement": {
      return liftSequenceX_(
        concat__,
        liftSequenceX_(
          listEffectStatement,
          callSequence___X(
            listUpdateResultEffect,
            hash,
            forkMeta((meta = nextMeta(meta))),
            scope,
            liftSequence_X(
              makeUpdateResultOperation,
              "closure",
              hasReturnArgument(node)
                ? unbuildExpression(
                    node.argument,
                    forkMeta((meta = nextMeta(meta))),
                    scope,
                  )
                : zeroSequence(makeIntrinsicExpression("undefined", hash)),
            ),
          ),
          hash,
        ),
        makeBreakStatement(RETURN_BREAK_LABEL, hash),
      );
    }
    case "ExpressionStatement": {
      if (isCompletion(hash, scope.annotation)) {
        return liftSequenceX_(
          listEffectStatement,
          callSequence___X(
            listUpdateResultEffect,
            hash,
            forkMeta((meta = nextMeta(meta))),
            scope,
            liftSequence_X(
              makeUpdateResultOperation,
              "program",
              unbuildExpression(node.expression, meta, scope),
            ),
          ),
          hash,
        );
      } else {
        return liftSequenceX_(
          listEffectStatement,
          unbuildEffect(node.expression, meta, scope),
          hash,
        );
      }
    }
    case "ThrowStatement": {
      return liftSequenceX_(
        makeEffectStatement,
        liftSequenceX_(
          makeExpressionEffect,
          liftSequence__X_(
            makeApplyExpression,
            makeIntrinsicExpression("aran.throw", hash),
            makeIntrinsicExpression("undefined", hash),
            liftSequenceX(
              concat_,
              unbuildExpression(node.argument, meta, scope),
            ),
            hash,
          ),
          hash,
        ),
        hash,
      );
    }
    case "BreakStatement": {
      if (node.label == null) {
        if (loop.break == null) {
          return liftSequenceX_(
            makeEffectStatement,
            liftSequenceX_(
              makeExpressionEffect,
              initSyntaxErrorExpression("Illegal break statement", hash),
              hash,
            ),
            hash,
          );
        } else {
          return zeroSequence([makeBreakStatement(loop.break, hash)]);
        }
      } else {
        if (hasTree(labels, node.label.name)) {
          return NULL_SEQUENCE;
        } else {
          return zeroSequence(
            makeBreakStatement(mangleBreakLabel(node.label.name), hash),
          );
        }
      }
    }
    case "ContinueStatement": {
      if (node.label == null) {
        if (loop.continue === null) {
          return liftSequenceX_(
            makeEffectStatement,
            liftSequenceX_(
              makeExpressionEffect,
              initSyntaxErrorExpression("Illegal continue statement", hash),
              hash,
            ),
            hash,
          );
        } else {
          return zeroSequence([makeBreakStatement(loop.continue, hash)]);
        }
      } else {
        if (hasTree(labels, node.label.name)) {
          return NULL_SEQUENCE;
        } else {
          return zeroSequence(
            makeBreakStatement(mangleContinueLabel(node.label.name), hash),
          );
        }
      }
    }
    case "VariableDeclaration": {
      if (node.kind === "var") {
        return liftSequenceX_(
          listEffectStatement,
          flatSequence(
            map(node.declarations, (node) =>
              unbuildWriteDeclarator(
                node,
                forkMeta((meta = nextMeta(meta))),
                scope,
              ),
            ),
          ),
          hash,
        );
      } else {
        return liftSequenceX_(
          makeEffectStatement,
          liftSequenceX_(
            makeExpressionEffect,
            initSyntaxErrorExpression(
              `Illegal ${node.kind} variable declaration in a single-statement this context`,
              hash,
            ),
            hash,
          ),
          hash,
        );
      }
    }
    case "FunctionDeclaration": {
      const mode = scope.mode;
      switch (mode) {
        case "strict": {
          return NULL_SEQUENCE;
        }
        case "sloppy": {
          if (node.async || node.generator) {
            return NULL_SEQUENCE;
          } else {
            // In global scope, functions are not re-assigned.
            // f = 123; function f () {} throw { message: typeof f } // number
            // This is ugly because it breaks abstractions.
            // And this the only place where output node is queried.
            const right = makeReadVariableExpression(
              hash,
              forkMeta((meta = nextMeta(meta))),
              scope,
              { variable: node.id.name },
            );
            if (right.value.type === "ReadExpression") {
              return liftSequenceX_(
                listEffectStatement,
                callSequence___X(
                  listWriteSloppyFunctionVariableEffect,
                  hash,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                  callSequence___X(
                    makeInitVariableOperation,
                    hash,
                    scope.mode,
                    node.id.name,
                    right,
                  ),
                ),
                hash,
              );
            } else {
              return NULL_SEQUENCE;
            }
          }
        }
        default: {
          throw new AranTypeError(mode);
        }
      }
    }
    case "ClassDeclaration": {
      return liftSequenceX_(
        makeEffectStatement,
        liftSequenceX_(
          makeExpressionEffect,
          initSyntaxErrorExpression(
            "Illegal class declaration in a single-statement context",
            hash,
          ),
          hash,
        ),
        hash,
      );
    }
    case "LabeledStatement": {
      return unbuildStatement(node.body, meta, scope, {
        labels: [labels, node.label.name],
        loop,
      });
    }
    case "BlockStatement": {
      return liftSequenceX_(
        makeBlockStatement,
        unbuildSegmentBody(node, meta, scope, {
          labels: mapTree(labels, mangleBreakLabel),
          loop,
        }),
        hash,
      );
    }
    case "WithStatement": {
      const mode = scope.mode;
      if (mode === "strict") {
        return liftSequenceX_(
          makeEffectStatement,
          liftSequenceX_(
            makeExpressionEffect,
            initSyntaxErrorExpression("'with' is illegal in strict mode", hash),
            hash,
          ),
          hash,
        );
      } else if (mode === "sloppy") {
        return liftSequenceXX(
          concat__,
          listResetCompletionStatement(
            hash,
            forkMeta((meta = nextMeta(meta))),
            scope,
          ),
          incorporateStatement(
            bindSequence(
              callSequence_X_(
                cacheConstant,
                forkMeta((meta = nextMeta(meta))),
                unbuildExpression(
                  node.object,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                ),
                hash,
              ),
              (frame) =>
                bindSequence(
                  cacheConstant(
                    forkMeta((meta = nextMeta(meta))),
                    makeConditionalExpression(
                      makeBinaryExpression(
                        "==",
                        makeReadCacheExpression(frame, hash),
                        makePrimitiveExpression(null, hash),
                        hash,
                      ),
                      makeThrowErrorExpression(
                        "TypeError",
                        "Cannot convert undefined or null to object",
                        hash,
                      ),
                      makeApplyExpression(
                        makeIntrinsicExpression("Object", hash),
                        makeIntrinsicExpression("undefined", hash),
                        [makeReadCacheExpression(frame, hash)],
                        hash,
                      ),
                      hash,
                    ),
                    hash,
                  ),
                  (record) =>
                    liftSequenceX(
                      concat_,
                      liftSequenceX_(
                        makeBlockStatement,
                        callSequence__X_(
                          unbuildSegmentBody,
                          node.body,
                          forkMeta((meta = nextMeta(meta))),
                          extendWithVariable(
                            hash,
                            forkMeta((meta = nextMeta(meta))),
                            { record },
                            scope,
                          ),
                          { labels: mapTree(labels, mangleBreakLabel), loop },
                        ),
                        hash,
                      ),
                    ),
                ),
            ),
            hash,
          ),
        );
      } else {
        throw new AranTypeError(mode);
      }
    }
    case "IfStatement": {
      return liftSequenceXX(
        concat__,
        listResetCompletionStatement(
          hash,
          forkMeta((meta = nextMeta(meta))),
          scope,
        ),
        liftSequenceXXX_(
          makeIfStatement,
          unbuildExpression(
            node.test,
            forkMeta((meta = nextMeta(meta))),
            scope,
          ),
          unbuildSegmentBody(
            node.consequent,
            forkMeta((meta = nextMeta(meta))),
            scope,
            { labels: mapTree(labels, mangleBreakLabel), loop },
          ),
          node.alternate != null
            ? unbuildSegmentBody(
                node.alternate,
                forkMeta((meta = nextMeta(meta))),
                scope,
                { labels: mapTree(labels, mangleBreakLabel), loop },
              )
            : zeroSequence(makeSegmentBlock(EMPTY, EMPTY, EMPTY, hash)),
          hash,
        ),
      );
    }
    case "TryStatement": {
      return liftSequenceXXX_(
        makeTryStatement,
        unbuildSegmentBody(
          node.block,
          forkMeta((meta = nextMeta(meta))),
          scope,
          { labels: mapTree(labels, mangleBreakLabel), loop },
        ),
        node.handler != null
          ? unbuildCatch(
              node.handler,
              forkMeta((meta = nextMeta(meta))),
              scope,
              { labels: mapTree(labels, mangleBreakLabel), loop },
            )
          : incorporateSegmentBlock(
              bindSequence(
                extendCatch(hash, forkMeta((meta = nextMeta(meta))), {}, scope),
                (scope) =>
                  liftSequence__X_(
                    makeTreeSegmentBlock,
                    EMPTY,
                    EMPTY,
                    liftSequenceX_(
                      makeEffectStatement,
                      liftSequenceX_(
                        makeExpressionEffect,
                        liftSequence__X_(
                          makeApplyExpression,
                          makeIntrinsicExpression("aran.throw", hash),
                          makeIntrinsicExpression("undefined", hash),
                          liftSequenceX(
                            concat_,
                            makeReadErrorExpression(
                              hash,
                              forkMeta((meta = nextMeta(meta))),
                              scope,
                              {},
                            ),
                          ),
                          hash,
                        ),
                        hash,
                      ),
                      hash,
                    ),
                    hash,
                  ),
              ),
              hash,
            ),
        //
        // Finally completion used only in case of break:
        //
        // a: try { throw "boum" }
        //    catch { 123; }
        //    finally { 456; }
        // > 123
        //
        // a: try { throw "boum"; }
        //    catch { 123; }
        //    finally { 456; break a }
        // > 456
        //
        // a: try { throw "boum"; }
        //    catch { 123; }
        //    finally { break a }
        // > undefined
        //
        node.finalizer != null
          ? unbuildFinallyBody(
              node.finalizer,
              forkMeta((meta = nextMeta(meta))),
              scope,
              { labels: mapTree(labels, mangleBreakLabel), loop },
            )
          : zeroSequence(makeSegmentBlock(EMPTY, EMPTY, EMPTY, hash)),
        hash,
      );
    }
    case "WhileStatement": {
      const loop = {
        break: mangleEmptyBreakLabel(forkMeta((meta = nextMeta(meta)))),
        continue: mangleEmptyContinueLabel(forkMeta((meta = nextMeta(meta)))),
      };
      const inner_label_array = [
        hasEmptyContinue(node.body) ? loop.continue : null,
        mapTree(labels, mangleContinueLabel),
      ];
      const outer_label_array = [
        hasEmptyBreak(node.body) ? loop.break : null,
        mapTree(labels, mangleBreakLabel),
      ];
      return liftSequenceXX(
        concat__,
        listResetCompletionStatement(
          hash,
          forkMeta((meta = nextMeta(meta))),
          scope,
        ),
        listControlStatement(
          outer_label_array,
          liftSequenceXX_(
            makeWhileStatement,
            unbuildExpression(
              node.test,
              forkMeta((meta = nextMeta(meta))),
              scope,
            ),
            unbuildSegmentBody(
              node.body,
              forkMeta((meta = nextMeta(meta))),
              scope,
              { labels: inner_label_array, loop },
            ),
            hash,
          ),
          hash,
        ),
      );
    }
    case "DoWhileStatement": {
      const loop = {
        break: mangleEmptyBreakLabel(forkMeta((meta = nextMeta(meta)))),
        continue: mangleEmptyContinueLabel(forkMeta((meta = nextMeta(meta)))),
      };
      const inner_label_array = [
        hasEmptyContinue(node.body) ? loop.continue : null,
        mapTree(labels, mangleContinueLabel),
      ];
      const outer_label_array = [
        hasEmptyBreak(node.body) ? loop.break : null,
        mapTree(labels, mangleBreakLabel),
      ];
      // We do not reset the completion here because it is reset in the body.
      return listControlStatement(
        outer_label_array,
        bindSequence(
          cacheWritable(forkMeta((meta = nextMeta(meta))), "aran.deadzone"),
          (initial) =>
            liftSequence_X(
              concat__,
              makeEffectStatement(
                makeWriteCacheEffect(
                  initial,
                  makePrimitiveExpression(true, hash),
                  hash,
                ),
                hash,
              ),
              liftSequenceXX_(
                makeWhileStatement,
                liftSequence__X_(
                  makeConditionalExpression,
                  makeReadCacheExpression(initial, hash),
                  makeSequenceExpression(
                    [
                      makeWriteCacheEffect(
                        initial,
                        makePrimitiveExpression(false, hash),
                        hash,
                      ),
                    ],
                    makePrimitiveExpression(true, hash),
                    hash,
                  ),
                  unbuildExpression(
                    node.test,
                    forkMeta((meta = nextMeta(meta))),
                    scope,
                  ),
                  hash,
                ),
                unbuildSegmentBody(
                  node.body,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                  { labels: inner_label_array, loop },
                ),
                hash,
              ),
            ),
        ),
        hash,
      );
    }
    case "ForStatement": {
      const loop = {
        break: mangleEmptyBreakLabel(forkMeta((meta = nextMeta(meta)))),
        continue: mangleEmptyContinueLabel(forkMeta((meta = nextMeta(meta)))),
      };
      const outer_label_array = [
        hasEmptyBreak(node.body) ? loop.break : null,
        mapTree(labels, mangleBreakLabel),
      ];
      const inner_label_array = [
        hasEmptyContinue(node.body) ? loop.continue : null,
        mapTree(labels, mangleContinueLabel),
      ];
      if (isLexicalForStatement(node)) {
        const bindings = hoist(hash, scope.annotation);
        return liftSequenceXX(
          concat__,
          listResetCompletionStatement(
            hash,
            forkMeta((meta = nextMeta(meta))),
            scope,
          ),
          liftSequenceX_(
            makeBlockStatement,
            incorporateSegmentBlock(
              liftSequence__X_(
                makeTreeSegmentBlock,
                outer_label_array,
                EMPTY,
                bindSequence(
                  extendNormalRegularVariable(
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    { bindings },
                    scope,
                  ),
                  (scope) =>
                    liftSequenceXX(
                      concat__,
                      mapSequence(
                        unbuildLexicalInit(
                          node.init,
                          forkMeta((meta = nextMeta(meta))),
                          scope,
                        ),
                        (pair) => {
                          // eslint-disable-next-line local/no-impure
                          scope = pair[1];
                          return pair[0];
                        },
                      ),
                      bindSequence(
                        flatSequence(
                          map(bindings, ({ variable }) =>
                            liftSequence_X(
                              tuple2,
                              variable,
                              cacheWritable(
                                forkMeta((meta = nextMeta(meta))),
                                "aran.deadzone",
                              ),
                            ),
                          ),
                        ),
                        (pairs) =>
                          liftSequenceXX(
                            concat__,
                            liftSequenceX_(
                              listEffectStatement,
                              flatSequence(
                                map(pairs, ({ 0: variable, 1: cache }) =>
                                  liftSequence_X_(
                                    makeWriteCacheEffect,
                                    cache,
                                    makeReadVariableExpression(
                                      hash,
                                      forkMeta((meta = nextMeta(meta))),
                                      scope,
                                      { variable },
                                    ),
                                    hash,
                                  ),
                                ),
                              ),
                              hash,
                            ),
                            bindSequence(
                              cacheWritable(
                                forkMeta((meta = nextMeta(meta))),
                                "aran.deadzone",
                              ),
                              (first) =>
                                bindSequence(
                                  cacheWritable(
                                    forkMeta((meta = nextMeta(meta))),
                                    "aran.deadzone",
                                  ),
                                  (test) =>
                                    liftSequence__X(
                                      concat___,
                                      makeEffectStatement(
                                        makeWriteCacheEffect(
                                          first,
                                          makePrimitiveExpression(true, hash),
                                          hash,
                                        ),
                                        hash,
                                      ),
                                      makeEffectStatement(
                                        makeWriteCacheEffect(
                                          test,
                                          makePrimitiveExpression(true, hash),
                                          hash,
                                        ),
                                        hash,
                                      ),
                                      liftSequence_X_(
                                        makeWhileStatement,
                                        makeConditionalExpression(
                                          makeReadCacheExpression(first, hash),
                                          makePrimitiveExpression(true, hash),
                                          makeReadCacheExpression(test, hash),
                                          hash,
                                        ),
                                        incorporateSegmentBlock(
                                          liftSequence__X_(
                                            makeTreeSegmentBlock,
                                            EMPTY,
                                            EMPTY,
                                            bindSequence(
                                              extendNormalRegularVariable(
                                                hash,
                                                forkMeta(
                                                  (meta = nextMeta(meta)),
                                                ),
                                                { bindings },
                                                scope,
                                              ),
                                              (scope) => {
                                                /** @type {<X>(pair: [X, import("../scope").Scope]) => X} */
                                                const updateScope = (pair) => {
                                                  // eslint-disable-next-line local/no-impure
                                                  scope = pair[1];
                                                  return pair[0];
                                                };
                                                return liftSequenceXXXXX(
                                                  concat_____,
                                                  liftSequenceX_(
                                                    listEffectStatement,
                                                    flatSequence(
                                                      map(
                                                        pairs,
                                                        ({
                                                          0: variable,
                                                          1: cache,
                                                        }) =>
                                                          mapSequence(
                                                            callSequence___X(
                                                              listInitializeVariableEffect,
                                                              hash,
                                                              forkMeta(
                                                                (meta =
                                                                  nextMeta(
                                                                    meta,
                                                                  )),
                                                              ),
                                                              scope,
                                                              makeInitVariableOperation(
                                                                hash,
                                                                scope.mode,
                                                                variable,
                                                                makeReadCacheExpression(
                                                                  cache,
                                                                  hash,
                                                                ),
                                                              ),
                                                            ),
                                                            updateScope,
                                                          ),
                                                      ),
                                                    ),
                                                    hash,
                                                  ),
                                                  liftSequenceX_(
                                                    makeEffectStatement,
                                                    liftSequence__X_(
                                                      makeConditionalEffect,
                                                      makeReadCacheExpression(
                                                        first,
                                                        hash,
                                                      ),
                                                      [
                                                        makeWriteCacheEffect(
                                                          first,
                                                          makePrimitiveExpression(
                                                            false,
                                                            hash,
                                                          ),
                                                          hash,
                                                        ),
                                                      ],
                                                      node.update != null
                                                        ? liftSequenceX(
                                                            flatenTree,
                                                            liftSequenceX_(
                                                              listExpressionEffect,
                                                              unbuildExpression(
                                                                node.update,
                                                                forkMeta(
                                                                  (meta =
                                                                    nextMeta(
                                                                      meta,
                                                                    )),
                                                                ),
                                                                scope,
                                                              ),
                                                              hash,
                                                            ),
                                                          )
                                                        : EMPTY_SEQUENCE,
                                                      hash,
                                                    ),
                                                    hash,
                                                  ),
                                                  node.test != null
                                                    ? liftSequenceX_(
                                                        makeEffectStatement,
                                                        liftSequence_X_(
                                                          makeWriteCacheEffect,
                                                          test,
                                                          unbuildExpression(
                                                            node.test,
                                                            forkMeta(
                                                              (meta =
                                                                nextMeta(meta)),
                                                            ),
                                                            scope,
                                                          ),
                                                          hash,
                                                        ),
                                                        hash,
                                                      )
                                                    : NULL_SEQUENCE,
                                                  liftSequence_X__(
                                                    makeIfStatement,
                                                    makeReadCacheExpression(
                                                      test,
                                                      hash,
                                                    ),
                                                    unbuildSegmentBody(
                                                      node.body,
                                                      forkMeta(
                                                        (meta = nextMeta(meta)),
                                                      ),
                                                      scope,
                                                      {
                                                        labels:
                                                          inner_label_array,
                                                        loop,
                                                      },
                                                    ),
                                                    makeSegmentBlock(
                                                      EMPTY,
                                                      EMPTY,
                                                      EMPTY,
                                                      hash,
                                                    ),
                                                    hash,
                                                  ),
                                                  liftSequenceX_(
                                                    listEffectStatement,
                                                    flatSequence(
                                                      map(
                                                        pairs,
                                                        ({
                                                          0: variable,
                                                          1: cache,
                                                        }) =>
                                                          liftSequence_X_(
                                                            makeWriteCacheEffect,
                                                            cache,
                                                            makeReadVariableExpression(
                                                              hash,
                                                              forkMeta(
                                                                (meta =
                                                                  nextMeta(
                                                                    meta,
                                                                  )),
                                                              ),
                                                              scope,
                                                              { variable },
                                                            ),
                                                            hash,
                                                          ),
                                                      ),
                                                    ),
                                                    hash,
                                                  ),
                                                );
                                              },
                                            ),
                                            hash,
                                          ),
                                          hash,
                                        ),
                                        hash,
                                      ),
                                    ),
                                ),
                            ),
                          ),
                      ),
                    ),
                ),
                hash,
              ),
              hash,
            ),
            hash,
          ),
        );
      } else {
        const ts_node_update = node.update;
        return liftSequenceXX(
          concat__,
          listResetCompletionStatement(
            hash,
            forkMeta((meta = nextMeta(meta))),
            scope,
          ),
          listControlStatement(
            outer_label_array,
            liftSequenceXX(
              concat__,
              node.init != null
                ? unbuildRegularInit(
                    node.init,
                    forkMeta((meta = nextMeta(meta))),
                    scope,
                  )
                : NULL_SEQUENCE,
              liftSequenceXX_(
                makeWhileStatement,
                node.test != null
                  ? unbuildExpression(
                      node.test,
                      forkMeta((meta = nextMeta(meta))),
                      scope,
                    )
                  : zeroSequence(makePrimitiveExpression(true, hash)),
                ts_node_update != null
                  ? incorporateSegmentBlock(
                      liftSequence__X_(
                        makeTreeSegmentBlock,
                        EMPTY,
                        EMPTY,
                        liftSequenceXX(
                          concat__,
                          liftSequenceX_(
                            makeBlockStatement,
                            unbuildSegmentBody(
                              node.body,
                              forkMeta((meta = nextMeta(meta))),
                              scope,
                              { labels: inner_label_array, loop },
                            ),
                            hash,
                          ),
                          liftSequenceX_(
                            listEffectStatement,
                            unbuildEffect(
                              ts_node_update,
                              forkMeta((meta = nextMeta(meta))),
                              scope,
                            ),
                            hash,
                          ),
                        ),
                        hash,
                      ),
                      hash,
                    )
                  : unbuildSegmentBody(
                      node.body,
                      forkMeta((meta = nextMeta(meta))),
                      scope,
                      { labels: inner_label_array, loop },
                    ),
                hash,
              ),
            ),
            hash,
          ),
        );
      }
    }
    case "ForInStatement": {
      const loop = {
        break: mangleEmptyBreakLabel(forkMeta((meta = nextMeta(meta)))),
        continue: mangleEmptyContinueLabel(forkMeta((meta = nextMeta(meta)))),
      };
      const inner_label_array = [
        hasEmptyContinue(node.body) ? loop.continue : null,
        mapTree(labels, mangleContinueLabel),
      ];
      const outer_label_array = [
        hasEmptyBreak(node.body) ? loop.break : EMPTY,
        mapTree(labels, mangleBreakLabel),
      ];
      // for ((console.log("obj"), {})[(console.log("prop"), "foo")] in (console.log("right"), {foo:1, bar:2})) {}
      //
      // Variables in the left hand side belongs to the body of the while but still
      // they must be shadowed to the right-hand side.
      //
      // > for (const x in {a:x, b:2}) { console.log(x) }
      // Thrown:
      // ReferenceError: Cannot access 'x' before initialization
      return liftSequenceXX(
        concat__,
        listResetCompletionStatement(
          hash,
          forkMeta((meta = nextMeta(meta))),
          scope,
        ),
        listControlStatement(
          outer_label_array,
          incorporateStatement(
            bindSequence(
              extendNormalRegularVariable(
                hash,
                forkMeta((meta = nextMeta(meta))),
                { bindings: hoist(hash, scope.annotation) },
                scope,
              ),
              (scope) =>
                liftSequenceXX(
                  concat__,
                  unbuildLeftHead(
                    node.left,
                    forkMeta((meta = nextMeta(meta))),
                    scope,
                  ),
                  incorporateStatement(
                    bindSequence(
                      callSequence_X_(
                        cacheConstant,
                        forkMeta((meta = nextMeta(meta))),
                        unbuildExpression(
                          node.right,
                          forkMeta((meta = nextMeta(meta))),
                          scope,
                        ),
                        hash,
                      ),
                      (right) =>
                        bindSequence(
                          cacheConstant(
                            forkMeta((meta = nextMeta(meta))),
                            makeApplyExpression(
                              makeIntrinsicExpression(
                                "aran.listForInKey",
                                hash,
                              ),
                              makeIntrinsicExpression("undefined", hash),
                              [makeReadCacheExpression(right, hash)],
                              hash,
                            ),
                            hash,
                          ),
                          (keys) =>
                            bindSequence(
                              cacheWritable(
                                forkMeta((meta = nextMeta(meta))),
                                "aran.deadzone",
                              ),
                              (index) =>
                                liftSequence_X(
                                  concat__,
                                  makeEffectStatement(
                                    makeWriteCacheEffect(
                                      index,
                                      makePrimitiveExpression(0, hash),
                                      hash,
                                    ),
                                    hash,
                                  ),
                                  liftSequence_X_(
                                    makeWhileStatement,
                                    makeBinaryExpression(
                                      "<",
                                      makeReadCacheExpression(index, hash),
                                      makeGetExpression(
                                        makeReadCacheExpression(keys, hash),
                                        makePrimitiveExpression("length", hash),
                                        hash,
                                      ),
                                      hash,
                                    ),
                                    incorporateSegmentBlock(
                                      liftSequence__X_(
                                        makeTreeSegmentBlock,
                                        EMPTY,
                                        EMPTY,
                                        bindSequence(
                                          extendNormalRegularVariable(
                                            hash,
                                            forkMeta((meta = nextMeta(meta))),
                                            {
                                              bindings: hoist(
                                                hash,
                                                scope.annotation,
                                              ),
                                            },
                                            scope,
                                          ),
                                          (scope) =>
                                            liftSequenceXX_(
                                              concat___,
                                              liftSequenceX_(
                                                listEffectStatement,
                                                mapSequence(
                                                  unbuildLeftBody(
                                                    node.left,
                                                    forkMeta(
                                                      (meta = nextMeta(meta)),
                                                    ),
                                                    scope,
                                                    makeGetExpression(
                                                      makeReadCacheExpression(
                                                        keys,
                                                        hash,
                                                      ),
                                                      makeReadCacheExpression(
                                                        index,
                                                        hash,
                                                      ),
                                                      hash,
                                                    ),
                                                  ),
                                                  (pair) => {
                                                    // eslint-disable-next-line local/no-impure
                                                    scope = pair[1];
                                                    return pair[0];
                                                  },
                                                ),
                                                hash,
                                              ),
                                              liftSequence_X__(
                                                makeIfStatement,
                                                makeBinaryExpression(
                                                  "in",
                                                  makeGetExpression(
                                                    makeReadCacheExpression(
                                                      keys,
                                                      hash,
                                                    ),
                                                    makeReadCacheExpression(
                                                      index,
                                                      hash,
                                                    ),
                                                    hash,
                                                  ),
                                                  makeReadCacheExpression(
                                                    right,
                                                    hash,
                                                  ),
                                                  hash,
                                                ),
                                                unbuildSegmentBody(
                                                  node.body,
                                                  forkMeta(
                                                    (meta = nextMeta(meta)),
                                                  ),
                                                  scope,
                                                  {
                                                    labels: inner_label_array,
                                                    loop,
                                                  },
                                                ),
                                                makeSegmentBlock(
                                                  EMPTY,
                                                  EMPTY,
                                                  EMPTY,
                                                  hash,
                                                ),
                                                hash,
                                              ),
                                              makeEffectStatement(
                                                makeWriteCacheEffect(
                                                  index,
                                                  makeBinaryExpression(
                                                    "+",
                                                    makeReadCacheExpression(
                                                      index,
                                                      hash,
                                                    ),
                                                    makePrimitiveExpression(
                                                      1,
                                                      hash,
                                                    ),
                                                    hash,
                                                  ),
                                                  hash,
                                                ),
                                                hash,
                                              ),
                                            ),
                                        ),
                                        hash,
                                      ),
                                      hash,
                                    ),
                                    hash,
                                  ),
                                ),
                            ),
                        ),
                    ),
                    hash,
                  ),
                ),
            ),
            hash,
          ),
          hash,
        ),
      );
    }
    case "ForOfStatement": {
      //
      // for (const foo of [123, 456]) {
      //   console.log(foo);
      // }
      //
      // const iterable = [123, 456];
      // const iterator = iterable[Symbol.iterator]();
      // const next = iterator.next;
      // let should_call_return = false;
      // try {
      //   let step = undefined;
      //   let value = undefined;
      //   while (
      //     ((should_call_return = false),
      //     ((step = apply(next, iterator, [])),
      //     isProperObject(step)
      //       ? step.done
      //         ? false
      //         : ((value = step.value), (should_call_return = true), true)
      //       : throwTypeError("step should be an object")))
      //   ) {
      //     const foo = value;
      //     console.log(foo);
      //   }
      // } catch (error) {
      //   if (should_call_return) {
      //     should_call_return = false;
      //     try {
      //       apply(iterator.return, iterator, []);
      //     } catch {}
      //   }
      //   throw error;
      // } finally {
      //   if (should_call_return) {
      //     const finalize = iterator.return;
      //     if (finalize != null) {
      //       const step = apply(finalize, iterator, []);
      //       if (!isProperObject(step)) {
      //         throw new TypeError("step should be an object");
      //       }
      //     }
      //   }
      // }
      //
      const loop = {
        break: mangleEmptyBreakLabel(forkMeta((meta = nextMeta(meta)))),
        continue: mangleEmptyContinueLabel(forkMeta((meta = nextMeta(meta)))),
      };
      const inner_label_array = [
        hasEmptyContinue(node.body) ? loop.continue : null,
        mapTree(labels, mangleContinueLabel),
      ];
      const outer_label_array = [
        hasEmptyBreak(node.body) ? loop.break : null,
        mapTree(labels, mangleBreakLabel),
      ];
      const asynchronous = hasOwn(node, "await") ? !!node.await : false;
      return liftSequenceXX(
        concat__,
        listResetCompletionStatement(
          hash,
          forkMeta((meta = nextMeta(meta))),
          scope,
        ),
        listControlStatement(
          outer_label_array,
          incorporateStatement(
            bindSequence(
              extendNormalRegularVariable(
                hash,
                forkMeta((meta = nextMeta(meta))),
                { bindings: hoist(hash, scope.annotation) },
                scope,
              ),
              (scope) =>
                liftSequenceXX(
                  concat__,
                  unbuildLeftHead(
                    node.left,
                    forkMeta((meta = nextMeta(meta))),
                    scope,
                  ),
                  incorporateStatement(
                    bindSequence(
                      callSequence_X_(
                        cacheConstant,
                        forkMeta((meta = nextMeta(meta))),
                        unbuildExpression(
                          node.right,
                          forkMeta((meta = nextMeta(meta))),
                          scope,
                        ),
                        hash,
                      ),
                      (iterable) =>
                        bindSequence(
                          cacheWritable(
                            forkMeta((meta = nextMeta(meta))),
                            "aran.deadzone",
                          ),
                          (iterator) =>
                            liftSequence_X(
                              concat__,
                              node.await
                                ? [
                                    makeEffectStatement(
                                      makeWriteCacheEffect(
                                        iterator,
                                        makeGetExpression(
                                          makeReadCacheExpression(
                                            iterable,
                                            hash,
                                          ),
                                          makeIntrinsicExpression(
                                            "Symbol.asyncIterator",
                                            hash,
                                          ),
                                          hash,
                                        ),
                                        hash,
                                      ),
                                      hash,
                                    ),
                                    makeEffectStatement(
                                      makeWriteCacheEffect(
                                        iterator,
                                        makeApplyExpression(
                                          makeConditionalExpression(
                                            makeBinaryExpression(
                                              "==",
                                              makeReadCacheExpression(
                                                iterator,
                                                hash,
                                              ),
                                              makePrimitiveExpression(
                                                null,
                                                hash,
                                              ),
                                              hash,
                                            ),
                                            makeGetExpression(
                                              makeReadCacheExpression(
                                                iterable,
                                                hash,
                                              ),
                                              makeIntrinsicExpression(
                                                "Symbol.iterator",
                                                hash,
                                              ),
                                              hash,
                                            ),
                                            makeReadCacheExpression(
                                              iterator,
                                              hash,
                                            ),
                                            hash,
                                          ),
                                          makeReadCacheExpression(
                                            iterable,
                                            hash,
                                          ),
                                          EMPTY,
                                          hash,
                                        ),
                                        hash,
                                      ),
                                      hash,
                                    ),
                                  ]
                                : makeEffectStatement(
                                    makeWriteCacheEffect(
                                      iterator,
                                      makeApplyExpression(
                                        makeGetExpression(
                                          makeReadCacheExpression(
                                            iterable,
                                            hash,
                                          ),
                                          makeIntrinsicExpression(
                                            "Symbol.iterator",
                                            hash,
                                          ),
                                          hash,
                                        ),
                                        makeReadCacheExpression(iterable, hash),
                                        EMPTY,
                                        hash,
                                      ),
                                      hash,
                                    ),
                                    hash,
                                  ),
                              incorporateStatement(
                                bindSequence(
                                  cacheConstant(
                                    forkMeta((meta = nextMeta(meta))),
                                    makeGetExpression(
                                      makeReadCacheExpression(iterator, hash),
                                      makePrimitiveExpression("next", hash),
                                      hash,
                                    ),
                                    hash,
                                  ),
                                  (next) =>
                                    bindSequence(
                                      cacheWritable(
                                        forkMeta((meta = nextMeta(meta))),
                                        "aran.deadzone",
                                      ),
                                      (should_call_return) =>
                                        liftSequence_X(
                                          concat__,
                                          makeEffectStatement(
                                            makeWriteCacheEffect(
                                              should_call_return,
                                              makePrimitiveExpression(
                                                true,
                                                hash,
                                              ),
                                              hash,
                                            ),
                                            hash,
                                          ),
                                          liftSequenceX_X_(
                                            makeTryStatement,
                                            incorporateSegmentBlock(
                                              liftSequence__X_(
                                                makeTreeSegmentBlock,
                                                EMPTY,
                                                EMPTY,
                                                bindSequence(
                                                  cacheWritable(
                                                    forkMeta(
                                                      (meta = nextMeta(meta)),
                                                    ),
                                                    "aran.deadzone",
                                                  ),
                                                  (step) =>
                                                    bindSequence(
                                                      cacheWritable(
                                                        forkMeta(
                                                          (meta =
                                                            nextMeta(meta)),
                                                        ),
                                                        "aran.deadzone",
                                                      ),
                                                      (value) =>
                                                        liftSequence_X_(
                                                          makeWhileStatement,
                                                          makeSequenceExpression(
                                                            [
                                                              makeWriteCacheEffect(
                                                                should_call_return,
                                                                makePrimitiveExpression(
                                                                  false,
                                                                  hash,
                                                                ),
                                                                hash,
                                                              ),
                                                              makeWriteCacheEffect(
                                                                step,
                                                                guard(
                                                                  asynchronous,
                                                                  (node) =>
                                                                    makeAwaitExpression(
                                                                      node,
                                                                      hash,
                                                                    ),
                                                                  makeApplyExpression(
                                                                    makeReadCacheExpression(
                                                                      next,
                                                                      hash,
                                                                    ),
                                                                    makeReadCacheExpression(
                                                                      iterator,
                                                                      hash,
                                                                    ),
                                                                    EMPTY,
                                                                    hash,
                                                                  ),
                                                                ),
                                                                hash,
                                                              ),
                                                            ],
                                                            makeConditionalExpression(
                                                              makeIsProperObjectExpression(
                                                                hash,
                                                                {
                                                                  value: step,
                                                                },
                                                              ),
                                                              makeConditionalExpression(
                                                                guard(
                                                                  asynchronous,
                                                                  (node) =>
                                                                    makeAwaitExpression(
                                                                      node,
                                                                      hash,
                                                                    ),
                                                                  makeGetExpression(
                                                                    makeReadCacheExpression(
                                                                      step,
                                                                      hash,
                                                                    ),
                                                                    makePrimitiveExpression(
                                                                      "done",
                                                                      hash,
                                                                    ),
                                                                    hash,
                                                                  ),
                                                                ),
                                                                makePrimitiveExpression(
                                                                  false,
                                                                  hash,
                                                                ),
                                                                makeSequenceExpression(
                                                                  [
                                                                    makeWriteCacheEffect(
                                                                      value,
                                                                      guard(
                                                                        asynchronous,
                                                                        (
                                                                          node,
                                                                        ) =>
                                                                          makeAwaitExpression(
                                                                            node,
                                                                            hash,
                                                                          ),
                                                                        makeGetExpression(
                                                                          makeReadCacheExpression(
                                                                            step,
                                                                            hash,
                                                                          ),
                                                                          makePrimitiveExpression(
                                                                            "value",
                                                                            hash,
                                                                          ),
                                                                          hash,
                                                                        ),
                                                                      ),
                                                                      hash,
                                                                    ),
                                                                  ],
                                                                  makeSequenceExpression(
                                                                    [
                                                                      makeWriteCacheEffect(
                                                                        should_call_return,
                                                                        makePrimitiveExpression(
                                                                          true,
                                                                          hash,
                                                                        ),
                                                                        hash,
                                                                      ),
                                                                    ],
                                                                    makePrimitiveExpression(
                                                                      true,
                                                                      hash,
                                                                    ),
                                                                    hash,
                                                                  ),
                                                                  hash,
                                                                ),
                                                                hash,
                                                              ),
                                                              makeThrowErrorExpression(
                                                                "TypeError",
                                                                "iterable.next() should return a proper object",
                                                                hash,
                                                              ),
                                                              hash,
                                                            ),
                                                            hash,
                                                          ),
                                                          incorporateSegmentBlock(
                                                            bindSequence(
                                                              extendNormalRegularVariable(
                                                                hash,
                                                                forkMeta(
                                                                  (meta =
                                                                    nextMeta(
                                                                      meta,
                                                                    )),
                                                                ),
                                                                {
                                                                  bindings:
                                                                    hoist(
                                                                      hash,
                                                                      scope.annotation,
                                                                    ),
                                                                },
                                                                scope,
                                                              ),
                                                              (scope) =>
                                                                liftSequence__X_(
                                                                  makeTreeSegmentBlock,
                                                                  EMPTY,
                                                                  EMPTY,
                                                                  liftSequenceXX(
                                                                    concat__,
                                                                    liftSequenceX_(
                                                                      listEffectStatement,
                                                                      mapSequence(
                                                                        unbuildLeftBody(
                                                                          node.left,
                                                                          forkMeta(
                                                                            (meta =
                                                                              nextMeta(
                                                                                meta,
                                                                              )),
                                                                          ),
                                                                          scope,
                                                                          makeReadCacheExpression(
                                                                            value,
                                                                            hash,
                                                                          ),
                                                                        ),
                                                                        (
                                                                          pair,
                                                                        ) => {
                                                                          // eslint-disable-next-line local/no-impure
                                                                          scope =
                                                                            pair[1];
                                                                          return pair[0];
                                                                        },
                                                                      ),
                                                                      hash,
                                                                    ),
                                                                    liftSequenceX_(
                                                                      makeBlockStatement,
                                                                      unbuildSegmentBody(
                                                                        node.body,
                                                                        forkMeta(
                                                                          (meta =
                                                                            nextMeta(
                                                                              meta,
                                                                            )),
                                                                        ),
                                                                        scope,
                                                                        {
                                                                          labels:
                                                                            inner_label_array,
                                                                          loop,
                                                                        },
                                                                      ),
                                                                      hash,
                                                                    ),
                                                                  ),
                                                                  hash,
                                                                ),
                                                            ),
                                                            hash,
                                                          ),
                                                          hash,
                                                        ),
                                                    ),
                                                ),
                                                hash,
                                              ),
                                              hash,
                                            ),
                                            makeSegmentBlock(
                                              EMPTY,
                                              EMPTY,
                                              [
                                                makeEffectStatement(
                                                  makeConditionalEffect(
                                                    makeReadCacheExpression(
                                                      should_call_return,
                                                      hash,
                                                    ),
                                                    [
                                                      makeWriteCacheEffect(
                                                        should_call_return,
                                                        makePrimitiveExpression(
                                                          false,
                                                          hash,
                                                        ),
                                                        hash,
                                                      ),
                                                    ],
                                                    [
                                                      makeExpressionEffect(
                                                        makeApplyExpression(
                                                          makeIntrinsicExpression(
                                                            "aran.throw",
                                                            hash,
                                                          ),
                                                          makeIntrinsicExpression(
                                                            "undefined",
                                                            hash,
                                                          ),
                                                          [
                                                            makeReadExpression(
                                                              "catch.error",
                                                              hash,
                                                            ),
                                                          ],
                                                          hash,
                                                        ),
                                                        hash,
                                                      ),
                                                    ],
                                                    hash,
                                                  ),
                                                  hash,
                                                ),
                                                makeTryStatement(
                                                  makeSegmentBlock(
                                                    EMPTY,
                                                    EMPTY,
                                                    [
                                                      makeEffectStatement(
                                                        makeExpressionEffect(
                                                          guard(
                                                            asynchronous,
                                                            (node) =>
                                                              makeAwaitExpression(
                                                                node,
                                                                hash,
                                                              ),
                                                            makeApplyExpression(
                                                              makeGetExpression(
                                                                makeReadCacheExpression(
                                                                  iterator,
                                                                  hash,
                                                                ),
                                                                makePrimitiveExpression(
                                                                  "return",
                                                                  hash,
                                                                ),
                                                                hash,
                                                              ),
                                                              makeReadCacheExpression(
                                                                iterator,
                                                                hash,
                                                              ),
                                                              EMPTY,
                                                              hash,
                                                            ),
                                                          ),
                                                          hash,
                                                        ),
                                                        hash,
                                                      ),
                                                    ],
                                                    hash,
                                                  ),
                                                  makeSegmentBlock(
                                                    EMPTY,
                                                    EMPTY,
                                                    EMPTY,
                                                    hash,
                                                  ),
                                                  makeSegmentBlock(
                                                    EMPTY,
                                                    EMPTY,
                                                    EMPTY,
                                                    hash,
                                                  ),
                                                  hash,
                                                ),
                                                makeEffectStatement(
                                                  makeExpressionEffect(
                                                    makeApplyExpression(
                                                      makeIntrinsicExpression(
                                                        "aran.throw",
                                                        hash,
                                                      ),
                                                      makeIntrinsicExpression(
                                                        "undefined",
                                                        hash,
                                                      ),
                                                      [
                                                        makeReadExpression(
                                                          "catch.error",
                                                          hash,
                                                        ),
                                                      ],
                                                      hash,
                                                    ),
                                                    hash,
                                                  ),
                                                  hash,
                                                ),
                                              ],
                                              hash,
                                            ),
                                            incorporateSegmentBlock(
                                              liftSequence__X_(
                                                makeTreeSegmentBlock,
                                                EMPTY,
                                                EMPTY,
                                                liftSequenceX_(
                                                  listEffectStatement,
                                                  liftSequence_X__(
                                                    makeConditionalEffect,
                                                    makeReadCacheExpression(
                                                      should_call_return,
                                                      hash,
                                                    ),
                                                    liftSequenceX(
                                                      flatenTree,
                                                      incorporateEffect(
                                                        bindSequence(
                                                          cacheConstant(
                                                            forkMeta(
                                                              (meta =
                                                                nextMeta(meta)),
                                                            ),
                                                            makeGetExpression(
                                                              makeReadCacheExpression(
                                                                iterator,
                                                                hash,
                                                              ),
                                                              makePrimitiveExpression(
                                                                "return",
                                                                hash,
                                                              ),
                                                              hash,
                                                            ),
                                                            hash,
                                                          ),
                                                          (finalize) =>
                                                            liftSequence__X_(
                                                              makeConditionalEffect,
                                                              makeBinaryExpression(
                                                                "==",
                                                                makeReadCacheExpression(
                                                                  finalize,
                                                                  hash,
                                                                ),
                                                                makePrimitiveExpression(
                                                                  null,
                                                                  hash,
                                                                ),
                                                                hash,
                                                              ),
                                                              EMPTY,
                                                              liftSequenceX(
                                                                flatenTree,
                                                                incorporateEffect(
                                                                  mapSequence(
                                                                    cacheConstant(
                                                                      forkMeta(
                                                                        (meta =
                                                                          nextMeta(
                                                                            meta,
                                                                          )),
                                                                      ),
                                                                      guard(
                                                                        asynchronous,
                                                                        (
                                                                          node,
                                                                        ) =>
                                                                          makeAwaitExpression(
                                                                            node,
                                                                            hash,
                                                                          ),
                                                                        makeApplyExpression(
                                                                          makeReadCacheExpression(
                                                                            finalize,
                                                                            hash,
                                                                          ),
                                                                          makeReadCacheExpression(
                                                                            iterator,
                                                                            hash,
                                                                          ),
                                                                          EMPTY,
                                                                          hash,
                                                                        ),
                                                                      ),
                                                                      hash,
                                                                    ),
                                                                    (step) =>
                                                                      makeConditionalEffect(
                                                                        makeIsProperObjectExpression(
                                                                          hash,
                                                                          {
                                                                            value:
                                                                              step,
                                                                          },
                                                                        ),
                                                                        EMPTY,
                                                                        [
                                                                          makeExpressionEffect(
                                                                            makeThrowErrorExpression(
                                                                              "TypeError",
                                                                              "iterator.return() should return a proper object",
                                                                              hash,
                                                                            ),
                                                                            hash,
                                                                          ),
                                                                        ],
                                                                        hash,
                                                                      ),
                                                                  ),
                                                                  hash,
                                                                ),
                                                              ),
                                                              hash,
                                                            ),
                                                        ),
                                                        hash,
                                                      ),
                                                    ),
                                                    EMPTY,
                                                    hash,
                                                  ),
                                                  hash,
                                                ),
                                                hash,
                                              ),
                                              hash,
                                            ),
                                            hash,
                                          ),
                                        ),
                                    ),
                                ),
                                hash,
                              ),
                            ),
                        ),
                    ),
                    hash,
                  ),
                ),
            ),
            hash,
          ),
          hash,
        ),
      );
    }
    case "SwitchStatement": {
      const remainder = listSwitchRemainder(node);
      const child_loop = {
        break: mangleEmptyBreakLabel(forkMeta((meta = nextMeta(meta)))),
        continue: loop.continue,
      };
      const outer_label_array = [
        remainder.length > 0 || some(node.cases, hasEmptyBreak)
          ? child_loop.break
          : null,
        mapTree(labels, mangleBreakLabel),
      ];
      return liftSequenceXX(
        concat__,
        listResetCompletionStatement(
          hash,
          forkMeta((meta = nextMeta(meta))),
          scope,
        ),
        incorporateStatement(
          bindSequence(
            callSequence_X_(
              cacheConstant,
              forkMeta((meta = nextMeta(meta))),
              unbuildExpression(
                node.discriminant,
                forkMeta((meta = nextMeta(meta))),
                scope,
              ),
              hash,
            ),
            (discriminant) =>
              listControlStatement(
                outer_label_array,
                incorporateStatement(
                  bindSequence(
                    // switch frames disables optimization
                    // based on static deadzone analysis.
                    extendSwitchRegularVariable(
                      hash,
                      forkMeta((meta = nextMeta(meta))),
                      { bindings: hoist(hash, scope.annotation) },
                      scope,
                    ),
                    (scope) => {
                      /** @type {<X>(pair: [X, import("../scope").Scope]) => X} */
                      const updateScope = (pair) => {
                        // eslint-disable-next-line local/no-impure
                        scope = pair[1];
                        return pair[0];
                      };
                      return bindSequence(
                        cacheWritable(
                          forkMeta((meta = nextMeta(meta))),
                          "aran.deadzone",
                        ),
                        (matched) =>
                          liftSequence_XXX(
                            concat____,
                            makeEffectStatement(
                              makeWriteCacheEffect(
                                matched,
                                makePrimitiveExpression(false, hash),
                                hash,
                              ),
                              hash,
                            ),
                            flatSequence(
                              map(node.cases, (node) =>
                                unbuildHoistedStatement(
                                  node,
                                  forkMeta((meta = nextMeta(meta))),
                                  scope,
                                ),
                              ),
                            ),
                            flatSequence(
                              mapIndex(node.cases.length, (index) =>
                                mapSequence(
                                  unbuildCase(
                                    node.cases[index],
                                    forkMeta((meta = nextMeta(meta))),
                                    scope,
                                    {
                                      last: index === node.cases.length - 1,
                                      discriminant,
                                      loop: child_loop,
                                      matched,
                                    },
                                  ),
                                  updateScope,
                                ),
                              ),
                            ),
                            remainder.length === 0
                              ? NULL_SEQUENCE
                              : liftSequence__X_(
                                  makeIfStatement,
                                  makeReadCacheExpression(matched, hash),
                                  makeSegmentBlock(EMPTY, EMPTY, EMPTY, hash),
                                  incorporateSegmentBlock(
                                    liftSequence__X_(
                                      makeTreeSegmentBlock,
                                      EMPTY,
                                      EMPTY,
                                      // TODO: verify this is correct
                                      // mapSequence(
                                      //   setupRegularFrame(
                                      //     { hash },
                                      //     flatMap(remainder, ({ node }) =>
                                      //       hoistBlock(mode, node),
                                      //     ),
                                      //   ),
                                      //   (frame) => extendScope(scope, frame),
                                      // ),
                                      flatSequence(
                                        map(remainder, (node) =>
                                          mapSequence(
                                            unbuildBodyStatement(
                                              node,
                                              forkMeta((meta = nextMeta(meta))),
                                              scope,
                                              {
                                                labels: EMPTY,
                                                loop: child_loop,
                                              },
                                            ),
                                            updateScope,
                                          ),
                                        ),
                                      ),
                                      hash,
                                    ),
                                    hash,
                                  ),
                                  hash,
                                ),
                          ),
                      );
                    },
                  ),
                  hash,
                ),
                hash,
              ),
          ),
          hash,
        ),
      );
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: import("estree-sentry").ModuleStatement<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   labeling: import("../labeling").StatementLabeling,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../../util/tree").Tree<import("../atom").Statement>,
 *     import("../scope").Scope,
 *   ],
 * >}
 */
export const unbuildBodyStatement = (node, meta, scope, labeling) => {
  const { _hash: hash } = node;
  /** @type {<X>(pair: [X, import("../scope").Scope]) => X} */
  const updateScope = (pair) => {
    // eslint-disable-next-line local/no-impure
    scope = pair[1];
    return pair[0];
  };
  switch (node.type) {
    case "ImportDeclaration": {
      return zeroSequence([null, scope]);
    }
    case "ExportNamedDeclaration": {
      if (hasExportDeclaration(node)) {
        return unbuildBodyStatement(node.declaration, meta, scope, labeling);
      } else {
        return zeroSequence([null, scope]);
      }
    }
    case "ExportDefaultDeclaration": {
      return unbuildDefault(node.declaration, meta, scope);
    }
    case "ExportAllDeclaration": {
      return zeroSequence([null, scope]);
    }
    case "ClassDeclaration": {
      return liftSequenceX_(
        tuple2,
        liftSequenceX_(
          listEffectStatement,
          mapSequence(
            callSequence___X(
              listInitializeVariableEffect,
              hash,
              forkMeta((meta = nextMeta(meta))),
              scope,
              callSequence___X(
                makeInitVariableOperation,
                hash,
                scope.mode,
                node.id.name,
                unbuildClass(node, forkMeta((meta = nextMeta(meta))), scope, {
                  type: "assignment",
                  variable: node.id.name,
                }),
              ),
            ),
            updateScope,
          ),
          hash,
        ),
        scope,
      );
    }
    case "VariableDeclaration": {
      if (node.kind === "let" || node.kind === "const") {
        return liftSequenceX_(
          tuple2,
          liftSequenceX_(
            listEffectStatement,
            flatSequence(
              map(node.declarations, (node) =>
                mapSequence(
                  unbuildInitializeDeclarator(node, meta, scope),
                  updateScope,
                ),
              ),
            ),
            hash,
          ),
          scope,
        );
      } else {
        return liftSequenceX_(
          tuple2,
          unbuildStatement(node, meta, scope, labeling),
          scope,
        );
      }
    }
    default: {
      return liftSequenceX_(
        tuple2,
        unbuildStatement(node, meta, scope, labeling),
        scope,
      );
    }
  }
};

/**
 * @type {(
 *   nodes: import("estree-sentry").ModuleStatement<import("../../hash").HashProp>[],
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   labeling: import("../labeling").StatementLabeling,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../../util/tree").Tree<import("../atom").Statement>,
 *     import("../scope").Scope,
 *   ],
 * >}
 */
export const unbuildStateBody = (nodes, meta, scope, labeling) => {
  /** @type {<X>(pair: [X, import("../scope").Scope]) => X} */
  const updateScope = (pair) => {
    // eslint-disable-next-line local/no-impure
    scope = pair[1];
    return pair[0];
  };
  return liftSequenceX_(
    tuple2,
    liftSequenceXX(
      concatXX,
      flatSequence(
        map(nodes, (node) =>
          unbuildHoistedStatement(
            node,
            forkMeta((meta = nextMeta(meta))),
            scope,
          ),
        ),
      ),
      flatSequence(
        map(nodes, (node) =>
          mapSequence(
            unbuildBodyStatement(
              node,
              forkMeta((meta = nextMeta(meta))),
              scope,
              labeling,
            ),
            updateScope,
          ),
        ),
      ),
    ),
    scope,
  );
};

/**
 * @type {(
 *   nodes: import("estree-sentry").ModuleStatement<import("../../hash").HashProp>[],
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   labeling: import("../labeling").StatementLabeling,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../../util/tree").Tree<import("../atom").Statement>,
 * >}
 */
export const unbuildBody = (nodes, meta, scope, labeling) =>
  liftSequenceX(get0, unbuildStateBody(nodes, meta, scope, labeling));
