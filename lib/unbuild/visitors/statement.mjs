import {
  EMPTY,
  compileGet,
  concatXX,
  concatX_,
  concatX_X_X,
  concatX__,
  concat_,
  concat_X,
  concat_XXX,
  concat__,
  concat___,
  findFirstIndex,
  flat,
  flatMap,
  guard,
  hasOwn,
  includes,
  map,
  mapIndex,
  pairup,
  slice,
  some,
} from "../../util/index.mjs";
import { AranTypeError } from "../../report.mjs";
import {
  makeScopeLoadExpression,
  listScopeSaveEffect,
  getMode,
  extendScope,
  setupRegularFrame,
  makeInitializeOperation,
  CATCH_FRAME,
  makeUpdateResultOperation,
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
  makeControlBlock,
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
} from "../node.mjs";
import {
  listResetCompletionStatement,
  unbuildControlBody,
  unbuildFinallyBody,
} from "./body.mjs";
import { unbuildCatch } from "./catch.mjs";
import { unbuildExpression } from "./expression.mjs";
import { hasEmptyBreak, hasEmptyContinue } from "../query/index.mjs";
import { unbuildDeclarator } from "./declarator.mjs";
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
  unbuildInit,
  unbuildLeftHead,
  unbuildLeftBody,
  makeLeftContext,
} from "./left.mjs";
import { unbuildHoistedStatement } from "./hoisted.mjs";
import {
  makeReadCacheExpression,
  makeWriteCacheEffect,
  cacheConstant,
  cacheWritable,
} from "../cache.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  callSequence_X_,
  callSequence__X,
  callSequence___X,
  flatSequence,
  initSequence,
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
} from "../../sequence.mjs";
import { makeIsProperObjectExpression } from "../helper.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  incorporateControlBlock,
  incorporateEffect,
  incorporateStatement,
  initSyntaxErrorExpression,
  isBaseDeclarationPrelude,
  makeSyntaxErrorPrelude,
} from "../prelude/index.mjs";

/**
 * @type {(
 *   labels: import("../atom").Label[],
 *   body: import("../../sequence").Sequence<
 *     import("../prelude").BodyPrelude,
 *     import("../atom").Statement[]
 *   >,
 *   hash: import("../../hash").Hash,
 * ) => import("../../sequence").Sequence<
 *     import("../prelude").BodyPrelude,
 *     import("../atom").Statement[]
 *   >}
 */
export const listControlStatement = (labels, body, hash) => {
  if (
    labels.length > 0 ||
    some(listenSequence(body), isBaseDeclarationPrelude)
  ) {
    return liftSequenceX(
      concat_,
      liftSequenceX_(
        makeBlockStatement,
        incorporateControlBlock(
          liftSequence__X_(makeControlBlock, labels, EMPTY, body, hash),
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
 * @type {(
 *   node: import("estree-sentry").IfStatement<import("../../hash").HashProp>,
 * ) => node is import("estree-sentry").IfStatement<import("../../hash").HashProp> & {
 *   alternate: import("estree-sentry").Statement<import("../../hash").HashProp>,
 * }}
 */
const hasIfAlternate = (node) => node.alternate != null;

/**
 * @type {(
 *   node: import("estree-sentry").TryStatement<import("../../hash").HashProp>,
 * ) => node is import("estree-sentry").TryStatement<import("../../hash").HashProp> & {
 *   handler: import("estree-sentry").CatchClause<import("../../hash").HashProp>,
 * }}
 */
const hasTryHandler = (node) => node.handler != null;

/**
 * @type {(
 *   node: import("estree-sentry").TryStatement<import("../../hash").HashProp>,
 * ) => node is import("estree-sentry").TryStatement<import("../../hash").HashProp> & {
 *   finalizer: import("estree-sentry").BlockStatement<import("../../hash").HashProp>,
 * }}
 */
const hasTryFinalizer = (node) => node.finalizer != null;

/**
 * @type {(
 *   node: import("estree-sentry").ForStatement<import("../../hash").HashProp>,
 * ) => node is import("estree-sentry").ForStatement<import("../../hash").HashProp> & {
 *   init: import("estree-sentry").VariableDeclaration<import("../../hash").HashProp> & {
 *     kind: "let" | "const"
 *   },
 * }}
 */
const isForLexical = (node) =>
  node.init != null &&
  node.init.type === "VariableDeclaration" &&
  (node.init.kind === "let" || node.init.kind === "const");

/**
 * @type {(
 *   node: import("estree-sentry").ForStatement<import("../../hash").HashProp>,
 * ) => node is import("estree-sentry").ForStatement<import("../../hash").HashProp> & {
 *   test: import("estree-sentry").Expression<import("../../hash").HashProp>,
 * }}
 */
const hasForTest = (node) => node.test != null;

/**
 * @type {(
 *   node: import("estree-sentry").ForStatement<import("../../hash").HashProp>,
 * ) => node is import("estree-sentry").ForStatement<import("../../hash").HashProp> & {
 *   init: import("estree-sentry").VariableDeclaration<import("../../hash").HashProp> | import("estree-sentry").Expression<import("../../hash").HashProp>,
 * }}
 */
const hasForInit = (node) => node.init != null;

/**
 * @type {(
 *   node: import("estree-sentry").ForStatement<import("../../hash").HashProp>,
 * ) => node is import("estree-sentry").ForStatement<import("../../hash").HashProp> & {
 *   update: import("estree-sentry").Expression<import("../../hash").HashProp>,
 * }}
 */
const hasForUpdate = (node) => node.update != null;

const getConsequent = compileGet("consequent");

/**
 * @type {(
 *   node: import("estree-sentry").SwitchStatement<import("../../hash").HashProp>,
 * ) => import("estree-sentry").Statement<import("../../hash").HashProp>[]}
 */
export const listSwitchRemainder = (node) => {
  const index = findFirstIndex(node.cases, (node) => node.test === null);
  if (index === -1 || index === node.cases.length - 1) {
    return EMPTY;
  } else {
    return flatMap(slice(node.cases, index, node.cases.length), getConsequent);
  }
};

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").Directive<import("../../hash").HashProp>
 *     | import("estree-sentry").Statement<import("../../hash").HashProp>
 *     | import("estree-sentry").ModuleDeclaration<import("../../hash").HashProp>
 *   ),
 *   meta: import("../meta").Meta,
 *   context: import("../context").StatementContext,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const unbuildStatement = (
  node,
  meta,
  { scope, annotation, origin, labels, loop },
) => {
  const hash = digest(node, annotation);
  switch (node.type) {
    case "EmptyStatement": {
      return EMPTY_SEQUENCE;
    }
    case "DebuggerStatement": {
      return zeroSequence([makeDebuggerStatement(hash)]);
    }
    case "ReturnStatement": {
      switch (origin) {
        case "program": {
          return initSequence(
            [
              makeSyntaxErrorPrelude({
                message: "Illegal 'return' statement",
                origin: hash,
              }),
            ],
            EMPTY,
          );
        }
        case "closure": {
          return liftSequenceX_(
            concatX_,
            liftSequenceX_(
              listEffectStatement,
              callSequence___X(
                listScopeSaveEffect,
                hash,
                forkMeta((meta = nextMeta(meta))),
                scope,
                liftSequence_X(
                  makeUpdateResultOperation,
                  getMode(scope),
                  hasReturnArgument(node)
                    ? unbuildExpression(
                        node.argument,
                        forkMeta((meta = nextMeta(meta))),
                        { scope, annotation },
                      )
                    : zeroSequence(makeIntrinsicExpression("undefined", hash)),
                ),
              ),
              hash,
            ),
            makeBreakStatement(RETURN_BREAK_LABEL, hash),
          );
        }
        default: {
          throw new AranTypeError(origin);
        }
      }
    }
    case "ExpressionStatement": {
      if (isCompletionNode(node, annotation)) {
        return liftSequenceX_(
          listEffectStatement,
          callSequence___X(
            listScopeSaveEffect,
            hash,
            forkMeta((meta = nextMeta(meta))),
            scope,
            liftSequence_X(
              makeUpdateResultOperation,
              getMode(scope),
              unbuildExpression(node.expression, meta, { scope, annotation }),
            ),
          ),
          hash,
        );
      } else {
        return liftSequenceX_(
          listEffectStatement,
          unbuildEffect(node.expression, meta, { scope, annotation }),
          hash,
        );
      }
    }
    case "ThrowStatement": {
      return liftSequenceX(
        concat_,
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
                unbuildExpression(node.argument, meta, { scope, annotation }),
              ),
              hash,
            ),
            hash,
          ),
          hash,
        ),
      );
    }
    case "BreakStatement": {
      if (node.label == null) {
        if (loop.break === null) {
          return liftSequenceX(
            concat_,
            liftSequenceX_(
              makeEffectStatement,
              liftSequenceX_(
                makeExpressionEffect,
                initSyntaxErrorExpression("Illegal break statement", hash),
                hash,
              ),
              hash,
            ),
          );
        } else {
          return zeroSequence([makeBreakStatement(loop.break, hash)]);
        }
      } else if (includes(labels, node.label.name)) {
        return EMPTY_SEQUENCE;
      } else {
        return zeroSequence([
          makeBreakStatement(
            mangleBreakLabel(
              /** @type {import("estree-sentry").Label<import("../../hash").HashProp>} */ (
                node.label.name
              ),
            ),
            hash,
          ),
        ]);
      }
    }
    case "ContinueStatement": {
      if (node.label == null) {
        if (loop.continue === null) {
          return liftSequenceX(
            concat_,
            liftSequenceX_(
              makeEffectStatement,
              liftSequenceX_(
                makeExpressionEffect,
                initSyntaxErrorExpression("Illegal continue statement", hash),
                hash,
              ),
              hash,
            ),
          );
        } else {
          return zeroSequence([makeBreakStatement(loop.continue, hash)]);
        }
      } else if (includes(labels, node.label.name)) {
        return EMPTY_SEQUENCE;
      } else {
        return zeroSequence([
          makeBreakStatement(
            mangleContinueLabel(
              /** @type {import("estree-sentry").Label<import("../../hash").HashProp>} */ (
                node.label.name
              ),
            ),
            hash,
          ),
        ]);
      }
    }
    case "VariableDeclaration": {
      return liftSequenceX_(
        listEffectStatement,
        liftSequenceX(
          flat,
          flatSequence(
            map(node.declarations, (node) =>
              unbuildDeclarator(node, forkMeta((meta = nextMeta(meta))), {
                scope,
                annotation,
                kind: node.kind,
              }),
            ),
          ),
        ),
        hash,
      );
    }
    case "FunctionDeclaration": {
      const mode = getMode(scope);
      switch (mode) {
        case "strict": {
          return EMPTY_SEQUENCE;
        }
        case "sloppy": {
          return liftSequenceX_(
            listEffectStatement,
            listScopeSaveEffect(
              { hash, meta: forkMeta((meta = nextMeta(meta))) },
              scope,
              {
                type: "write-sloppy-function",
                mode,
                variable:
                  /** @type {import("estree-sentry").Variable<import("../../hash").HashProp>} */ (
                    node.id.name
                  ),
                right: null,
              },
            ),
            hash,
          );
        }
        default: {
          throw new AranTypeError(mode);
        }
      }
    }
    case "ClassDeclaration": {
      const variable =
        /** @type {import("estree-sentry").Variable<import("../../hash").HashProp>} */ (
          node.id.name
        );
      return liftSequenceX_(
        listEffectStatement,
        callSequence__X(
          listScopeSaveEffect,
          { hash, meta: forkMeta((meta = nextMeta(meta))) },
          scope,
          liftSequence__X(
            makeInitializeOperation,
            getMode(scope),
            variable,
            unbuildClass(
              { node, hash, meta: forkMeta((meta = nextMeta(meta))) },
              scope,
              { name: { type: "assignment", variable } },
            ),
          ),
        ),
        hash,
      );
    }
    case "ImportDeclaration": {
      return zeroSequence(EMPTY);
    }
    case "ExportNamedDeclaration": {
      if (hasExportDeclaration(node)) {
        return unbuildStatement(
          drillSite(node, hash, meta, "declaration"),
          scope,
          {
            origin,
            hoisting,
            labels: EMPTY,
            loop,
          },
        );
      } else {
        return zeroSequence(EMPTY);
      }
    }
    case "ExportDefaultDeclaration": {
      return unbuildDefault(drillSite(node, hash, meta, "declaration"), scope, {
        origin,
        hoisting,
      });
    }
    case "ExportAllDeclaration": {
      return zeroSequence(EMPTY);
    }
    case "LabeledStatement": {
      return unbuildStatement(drillSite(node, hash, meta, "body"), scope, {
        hoisting,
        labels: [
          ...labels,
          /** @type {import("estree-sentry").Label<import("../../hash").HashProp>} */ (
            node.label.name
          ),
        ],
        origin,
        loop,
      });
    }
    case "BlockStatement": {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeBlockStatement,
          unbuildControlBody({ node, hash, meta }, scope, {
            origin,
            labels: map(labels, mangleBreakLabel),
            hoisting,
            loop,
          }),
          hash,
        ),
      );
    }
    case "WithStatement": {
      const mode = getMode(scope);
      if (mode === "strict") {
        return liftSequenceX(
          concat_,
          liftSequenceX_(
            makeEffectStatement,
            liftSequenceX_(
              makeExpressionEffect,
              initSyntaxErrorExpression(
                "'with' is illegal in strict mode",
                hash,
              ),
              hash,
            ),
            hash,
          ),
        );
      } else if (mode === "sloppy") {
        return liftSequenceXX(
          concatXX,
          listResetCompletionStatement(
            { hash, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
          ),
          incorporateStatement(
            bindSequence(
              callSequence_X_(
                cacheConstant,
                forkMeta((meta = nextMeta(meta))),
                unbuildExpression(
                  drillSite(
                    node,
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    "object",
                  ),
                  scope,
                  null,
                ),
                hash,
              ),
              (raw_frame) =>
                bindSequence(
                  cacheConstant(
                    forkMeta((meta = nextMeta(meta))),
                    makeConditionalExpression(
                      makeBinaryExpression(
                        "==",
                        makeReadCacheExpression(raw_frame, hash),
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
                        [makeReadCacheExpression(raw_frame, hash)],
                        hash,
                      ),
                      hash,
                    ),
                    hash,
                  ),
                  (frame) =>
                    liftSequenceX(
                      concat_,
                      liftSequenceX_(
                        makeBlockStatement,
                        unbuildControlBody(
                          drillSite(
                            node,
                            hash,
                            forkMeta((meta = nextMeta(meta))),
                            "body",
                          ),
                          extendScope(scope, {
                            type: "with",
                            record: frame,
                          }),
                          {
                            labels: map(labels, mangleBreakLabel),
                            hoisting,
                            origin,
                            loop,
                          },
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
        concatX_,
        listResetCompletionStatement(
          { hash, meta: forkMeta((meta = nextMeta(meta))) },
          scope,
        ),
        liftSequenceXXX_(
          makeIfStatement,
          unbuildExpression(
            drillSite(node, hash, forkMeta((meta = nextMeta(meta))), "test"),
            scope,
            null,
          ),
          unbuildControlBody(
            drillSite(
              node,
              hash,
              forkMeta((meta = nextMeta(meta))),
              "consequent",
            ),
            scope,
            {
              labels: map(labels, mangleBreakLabel),
              hoisting,
              origin,
              loop,
            },
          ),
          hasIfAlternate(node)
            ? unbuildControlBody(
                drillSite(
                  node,
                  hash,
                  forkMeta((meta = nextMeta(meta))),
                  "alternate",
                ),
                scope,
                {
                  labels: map(labels, mangleBreakLabel),
                  hoisting,
                  origin,
                  loop,
                },
              )
            : zeroSequence(makeControlBlock(EMPTY, EMPTY, EMPTY, hash)),
          hash,
        ),
      );
    }
    case "TryStatement": {
      return liftSequenceX(
        concat_,
        liftSequenceXXX_(
          makeTryStatement,
          unbuildControlBody(
            drillSite(node, hash, forkMeta((meta = nextMeta(meta))), "block"),
            scope,
            {
              labels: map(labels, mangleBreakLabel),
              hoisting,
              loop,
              origin,
            },
          ),
          hasTryHandler(node)
            ? unbuildCatch(
                drillSite(
                  node,
                  hash,
                  forkMeta((meta = nextMeta(meta))),
                  "handler",
                ),
                scope,
                {
                  hoisting,
                  labels: map(labels, mangleBreakLabel),
                  origin,
                  loop,
                },
              )
            : incorporateControlBlock(
                bindSequence(
                  mapSequence(
                    setupRegularFrame(
                      { hash, meta: forkMeta((meta = nextMeta(meta))) },
                      EMPTY,
                    ),
                    (frame) =>
                      extendScope(extendScope(scope, CATCH_FRAME), frame),
                  ),
                  (scope) =>
                    liftSequence__X_(
                      makeControlBlock,
                      EMPTY,
                      EMPTY,
                      liftSequenceX(
                        concat_,
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
                                makeScopeLoadExpression(
                                  {
                                    hash,
                                    meta: forkMeta((meta = nextMeta(meta))),
                                  },
                                  scope,
                                  {
                                    type: "read-error",
                                    mode: getMode(scope),
                                  },
                                ),
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
          hasTryFinalizer(node)
            ? unbuildFinallyBody(
                drillSite(
                  node,
                  hash,
                  forkMeta((meta = nextMeta(meta))),
                  "finalizer",
                ),
                scope,
                {
                  labels: map(labels, mangleBreakLabel),
                  hoisting,
                  loop,
                  origin,
                },
              )
            : zeroSequence(makeControlBlock(EMPTY, EMPTY, EMPTY, hash)),
          hash,
        ),
      );
    }
    case "WhileStatement": {
      const loop = {
        break: mangleEmptyBreakLabel(hash),
        continue: mangleEmptyContinueLabel(hash),
      };
      const inner_label_array = [
        ...(hasEmptyContinue(node.body) ? [loop.continue] : EMPTY),
        ...map(labels, mangleContinueLabel),
      ];
      const outer_label_array = [
        ...(hasEmptyBreak(node.body) ? [loop.break] : EMPTY),
        ...map(labels, mangleBreakLabel),
      ];
      return liftSequenceXX(
        concatXX,
        listResetCompletionStatement(
          { hash, meta: forkMeta((meta = nextMeta(meta))) },
          scope,
        ),
        listControlStatement(
          outer_label_array,
          incorporateStatement(
            bindSequence(
              liftSequence_X(
                extendScope,
                scope,
                setupRegularFrame(
                  { hash, meta: forkMeta((meta = nextMeta(meta))) },
                  EMPTY,
                ),
              ),
              (scope) =>
                liftSequenceX(
                  concat_,
                  liftSequenceXX_(
                    makeWhileStatement,
                    unbuildExpression(
                      drillSite(
                        node,
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        "test",
                      ),
                      scope,
                      null,
                    ),
                    unbuildControlBody(
                      drillSite(
                        node,
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        "body",
                      ),
                      scope,
                      {
                        labels: inner_label_array,
                        hoisting,
                        loop,
                        origin,
                      },
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
    case "DoWhileStatement": {
      const loop = {
        break: mangleEmptyBreakLabel(hash),
        continue: mangleEmptyContinueLabel(hash),
      };
      const inner_label_array = [
        ...(hasEmptyContinue(node.body) ? [loop.continue] : EMPTY),
        ...map(labels, mangleContinueLabel),
      ];
      const outer_label_array = [
        ...(hasEmptyBreak(node.body) ? [loop.break] : EMPTY),
        ...map(labels, mangleBreakLabel),
      ];
      return listControlStatement(
        outer_label_array,
        incorporateStatement(
          bindSequence(
            liftSequence_X(
              extendScope,
              scope,
              setupRegularFrame(
                { hash, meta: forkMeta((meta = nextMeta(meta))) },
                EMPTY,
              ),
            ),
            (scope) =>
              bindSequence(
                cacheWritable(
                  forkMeta((meta = nextMeta(meta))),
                  "aran.deadzone",
                ),
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
                          drillSite(
                            node,
                            hash,
                            forkMeta((meta = nextMeta(meta))),
                            "test",
                          ),
                          scope,
                          null,
                        ),
                        hash,
                      ),
                      unbuildControlBody(
                        drillSite(
                          node,
                          hash,
                          forkMeta((meta = nextMeta(meta))),
                          "body",
                        ),
                        scope,
                        {
                          labels: inner_label_array,
                          hoisting,
                          loop,
                          origin,
                        },
                      ),
                      hash,
                    ),
                  ),
              ),
          ),
          hash,
        ),
        hash,
      );
    }
    case "ForStatement": {
      const mode = getMode(scope);
      const loop = {
        break: mangleEmptyBreakLabel(hash),
        continue: mangleEmptyContinueLabel(hash),
      };
      const outer_label_array = [
        ...(hasEmptyBreak(node.body) ? [mangleEmptyBreakLabel(hash)] : EMPTY),
        ...map(labels, mangleBreakLabel),
      ];
      const inner_label_array = [
        ...(hasEmptyContinue(node.body)
          ? [mangleEmptyContinueLabel(hash)]
          : EMPTY),
        ...map(labels, mangleContinueLabel),
      ];
      if (isForLexical(node)) {
        const bindings = listBinding(hoisting, hash);
        return liftSequenceXX(
          concatX_,
          listResetCompletionStatement(
            { hash, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
          ),
          liftSequenceX_(
            makeBlockStatement,
            incorporateControlBlock(
              liftSequence__X_(
                makeControlBlock,
                outer_label_array,
                EMPTY,
                bindSequence(
                  liftSequence_X(
                    extendScope,
                    scope,
                    setupRegularFrame(
                      { hash, meta: forkMeta((meta = nextMeta(meta))) },
                      bindings,
                    ),
                  ),
                  (scope) =>
                    liftSequenceXX(
                      concatXX,
                      unbuildStatement(
                        drillSite(node, hash, meta, "init"),
                        scope,
                        {
                          hoisting,
                          labels: EMPTY,
                          origin,
                          loop: { break: null, continue: null },
                        },
                      ),
                      bindSequence(
                        flatSequence(
                          map(bindings, ({ variable }) =>
                            mapSequence(
                              cacheWritable(
                                forkMeta((meta = nextMeta(meta))),
                                "aran.deadzone",
                              ),
                              (cache) =>
                                pairup(
                                  cache,
                                  /**
                                   * @type {(import("../scope/operation").InitializeOperation)}
                                   */ ({
                                    type: "initialize",
                                    mode,
                                    variable,
                                    right: makeReadCacheExpression(cache, hash),
                                  }),
                                ),
                            ),
                          ),
                        ),
                        (pairs) =>
                          liftSequenceXX(
                            concatXX,
                            liftSequenceX_(
                              listEffectStatement,
                              flatSequence(
                                map(pairs, ([cache, { variable }]) =>
                                  liftSequence_X_(
                                    makeWriteCacheEffect,
                                    cache,
                                    makeScopeLoadExpression(
                                      {
                                        hash,
                                        meta: forkMeta((meta = nextMeta(meta))),
                                      },
                                      scope,
                                      { type: "read", mode, variable },
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
                                        incorporateControlBlock(
                                          liftSequence__X_(
                                            makeControlBlock,
                                            EMPTY,
                                            EMPTY,
                                            bindSequence(
                                              mapSequence(
                                                setupRegularFrame(
                                                  {
                                                    hash,
                                                    meta: forkMeta(
                                                      (meta = nextMeta(meta)),
                                                    ),
                                                  },
                                                  bindings,
                                                ),
                                                (frame) =>
                                                  extendScope(scope, frame),
                                              ),
                                              (scope) =>
                                                liftSequenceXXXXX(
                                                  concatX_X_X,
                                                  liftSequenceX_(
                                                    listEffectStatement,
                                                    liftSequenceX(
                                                      flat,
                                                      flatSequence(
                                                        map(
                                                          pairs,
                                                          ([
                                                            _cache,
                                                            operation,
                                                          ]) =>
                                                            listScopeSaveEffect(
                                                              {
                                                                hash,
                                                                meta: forkMeta(
                                                                  (meta =
                                                                    nextMeta(
                                                                      meta,
                                                                    )),
                                                                ),
                                                              },
                                                              scope,
                                                              operation,
                                                            ),
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
                                                      hasForUpdate(node)
                                                        ? liftSequenceX(
                                                            concat_,
                                                            liftSequenceX_(
                                                              makeExpressionEffect,
                                                              unbuildExpression(
                                                                drillSite(
                                                                  node,
                                                                  hash,
                                                                  forkMeta(
                                                                    (meta =
                                                                      nextMeta(
                                                                        meta,
                                                                      )),
                                                                  ),
                                                                  "update",
                                                                ),
                                                                scope,
                                                                null,
                                                              ),
                                                              hash,
                                                            ),
                                                          )
                                                        : EMPTY_SEQUENCE,
                                                      hash,
                                                    ),
                                                    hash,
                                                  ),
                                                  hasForTest(node)
                                                    ? liftSequenceX(
                                                        concat_,
                                                        liftSequenceX_(
                                                          makeEffectStatement,
                                                          liftSequence_X_(
                                                            makeWriteCacheEffect,
                                                            test,
                                                            unbuildExpression(
                                                              drillSite(
                                                                node,
                                                                hash,
                                                                forkMeta(
                                                                  (meta =
                                                                    nextMeta(
                                                                      meta,
                                                                    )),
                                                                ),
                                                                "test",
                                                              ),
                                                              scope,
                                                              null,
                                                            ),
                                                            hash,
                                                          ),
                                                          hash,
                                                        ),
                                                      )
                                                    : EMPTY_SEQUENCE,
                                                  liftSequence_X__(
                                                    makeIfStatement,
                                                    makeReadCacheExpression(
                                                      test,
                                                      hash,
                                                    ),
                                                    unbuildControlBody(
                                                      drillSite(
                                                        node,
                                                        hash,
                                                        forkMeta(
                                                          (meta =
                                                            nextMeta(meta)),
                                                        ),
                                                        "body",
                                                      ),
                                                      scope,
                                                      {
                                                        labels:
                                                          inner_label_array,
                                                        hoisting,
                                                        origin,
                                                        loop,
                                                      },
                                                    ),
                                                    makeControlBlock(
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
                                                        ([
                                                          cache,
                                                          { variable },
                                                        ]) =>
                                                          liftSequence_X_(
                                                            makeWriteCacheEffect,
                                                            cache,
                                                            makeScopeLoadExpression(
                                                              {
                                                                hash,
                                                                meta: forkMeta(
                                                                  (meta =
                                                                    nextMeta(
                                                                      meta,
                                                                    )),
                                                                ),
                                                              },
                                                              scope,
                                                              {
                                                                type: "read",
                                                                mode,
                                                                variable,
                                                              },
                                                            ),
                                                            hash,
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
        return liftSequenceXX(
          concatXX,
          listResetCompletionStatement(
            { hash, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
          ),
          listControlStatement(
            outer_label_array,
            incorporateStatement(
              bindSequence(
                mapSequence(
                  setupRegularFrame(
                    { hash, meta: forkMeta((meta = nextMeta(meta))) },
                    EMPTY,
                  ),
                  (frame) => extendScope(scope, frame),
                ),
                (scope) =>
                  liftSequenceXX(
                    concatX_,
                    hasForInit(node)
                      ? unbuildInit(
                          drillSite(
                            node,
                            hash,
                            forkMeta((meta = nextMeta(meta))),
                            "init",
                          ),
                          scope,
                          { origin, hoisting },
                        )
                      : EMPTY_SEQUENCE,
                    liftSequenceXX_(
                      makeWhileStatement,
                      hasForTest(node)
                        ? unbuildExpression(
                            drillSite(
                              node,
                              hash,
                              forkMeta((meta = nextMeta(meta))),
                              "test",
                            ),
                            scope,
                            null,
                          )
                        : zeroSequence(makePrimitiveExpression(true, hash)),
                      hasForUpdate(node)
                        ? incorporateControlBlock(
                            liftSequence__X_(
                              makeControlBlock,
                              EMPTY,
                              EMPTY,
                              bindSequence(
                                liftSequence_X(
                                  extendScope,
                                  scope,
                                  setupRegularFrame(
                                    {
                                      hash,
                                      meta: forkMeta((meta = nextMeta(meta))),
                                    },
                                    EMPTY,
                                  ),
                                ),
                                (scope) =>
                                  liftSequenceXX(
                                    concat_X,
                                    liftSequenceX_(
                                      makeBlockStatement,
                                      unbuildControlBody(
                                        drillSite(
                                          node,
                                          hash,
                                          forkMeta((meta = nextMeta(meta))),
                                          "body",
                                        ),
                                        scope,
                                        {
                                          labels: inner_label_array,
                                          hoisting,
                                          origin,
                                          loop,
                                        },
                                      ),
                                      hash,
                                    ),
                                    liftSequenceX_(
                                      listEffectStatement,
                                      unbuildEffect(
                                        drillSite(
                                          node,
                                          hash,
                                          forkMeta((meta = nextMeta(meta))),
                                          "update",
                                        ),
                                        scope,
                                        null,
                                      ),
                                      hash,
                                    ),
                                  ),
                              ),
                              hash,
                            ),
                            hash,
                          )
                        : unbuildControlBody(
                            drillSite(
                              node,
                              hash,
                              forkMeta((meta = nextMeta(meta))),
                              "body",
                            ),
                            scope,
                            {
                              labels: inner_label_array,
                              hoisting,
                              origin,
                              loop,
                            },
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
    }
    case "ForInStatement": {
      const loop = {
        break: mangleEmptyBreakLabel(hash),
        continue: mangleEmptyContinueLabel(hash),
      };
      const inner_label_array = [
        ...(hasEmptyContinue(node.body) ? [loop.continue] : EMPTY),
        ...map(labels, mangleContinueLabel),
      ];
      const outer_label_array = [
        ...(hasEmptyBreak(node.body) ? [loop.break] : EMPTY),
        ...map(labels, mangleBreakLabel),
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
        concatXX,
        listResetCompletionStatement(
          { hash, meta: forkMeta((meta = nextMeta(meta))) },
          scope,
        ),
        listControlStatement(
          outer_label_array,
          incorporateStatement(
            bindSequence(
              liftSequence_X(
                extendScope,
                scope,
                setupRegularFrame(
                  { hash, meta: forkMeta((meta = nextMeta(meta))) },
                  listBinding(hoisting, hash),
                ),
              ),
              (scope) =>
                liftSequenceXX(
                  concatXX,
                  unbuildLeftHead(
                    drillSite(
                      node,
                      hash,
                      forkMeta((meta = nextMeta(meta))),
                      "left",
                    ),
                    scope,
                    null,
                  ),
                  incorporateStatement(
                    bindSequence(
                      callSequence_X_(
                        cacheConstant,
                        forkMeta((meta = nextMeta(meta))),
                        unbuildExpression(
                          drillSite(
                            node,
                            hash,
                            forkMeta((meta = nextMeta(meta))),
                            "right",
                          ),
                          scope,
                          null,
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
                                    incorporateControlBlock(
                                      liftSequence__X_(
                                        makeControlBlock,
                                        EMPTY,
                                        EMPTY,
                                        bindSequence(
                                          liftSequence_X(
                                            extendScope,
                                            scope,
                                            setupRegularFrame(
                                              {
                                                hash,
                                                meta: forkMeta(
                                                  (meta = nextMeta(meta)),
                                                ),
                                              },
                                              listBinding(hoisting, hash),
                                            ),
                                          ),
                                          (scope) =>
                                            liftSequenceXX_(
                                              concatX__,
                                              liftSequenceX_(
                                                listEffectStatement,
                                                unbuildLeftBody(
                                                  drillSite(
                                                    node,
                                                    hash,
                                                    forkMeta(
                                                      (meta = nextMeta(meta)),
                                                    ),
                                                    "left",
                                                  ),
                                                  scope,
                                                  makeLeftContext(
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
                                                unbuildControlBody(
                                                  drillSite(
                                                    node,
                                                    hash,
                                                    forkMeta(
                                                      (meta = nextMeta(meta)),
                                                    ),
                                                    "body",
                                                  ),
                                                  scope,
                                                  {
                                                    labels: inner_label_array,
                                                    hoisting,
                                                    origin,
                                                    loop,
                                                  },
                                                ),
                                                makeControlBlock(
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
        break: mangleEmptyBreakLabel(hash),
        continue: mangleEmptyContinueLabel(hash),
      };
      const inner_label_array = [
        ...(hasEmptyContinue(node.body) ? [loop.continue] : EMPTY),
        ...map(labels, mangleContinueLabel),
      ];
      const outer_label_array = [
        ...(hasEmptyBreak(node.body) ? [loop.break] : EMPTY),
        ...map(labels, mangleBreakLabel),
      ];
      const asynchronous = hasOwn(node, "await") ? !!node.await : false;
      return liftSequenceXX(
        concatXX,
        listResetCompletionStatement(
          { hash, meta: forkMeta((meta = nextMeta(meta))) },
          scope,
        ),
        listControlStatement(
          outer_label_array,
          incorporateStatement(
            bindSequence(
              liftSequence_X(
                extendScope,
                scope,
                setupRegularFrame(
                  { hash, meta: forkMeta((meta = nextMeta(meta))) },
                  listBinding(hoisting, hash),
                ),
              ),
              (scope) =>
                liftSequenceXX(
                  concatXX,
                  unbuildLeftHead(
                    drillSite(
                      node,
                      hash,
                      forkMeta((meta = nextMeta(meta))),
                      "left",
                    ),
                    scope,
                    null,
                  ),
                  incorporateStatement(
                    bindSequence(
                      callSequence_X_(
                        cacheConstant,
                        forkMeta((meta = nextMeta(meta))),
                        unbuildExpression(
                          drillSite(
                            node,
                            hash,
                            forkMeta((meta = nextMeta(meta))),
                            "right",
                          ),
                          scope,
                          null,
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
                              concatXX,
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
                                : [
                                    makeEffectStatement(
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
                                  ],
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
                                            incorporateControlBlock(
                                              liftSequence__X_(
                                                makeControlBlock,
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
                                                        liftSequenceX(
                                                          concat_,
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
                                                                  { hash },
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
                                                            incorporateControlBlock(
                                                              bindSequence(
                                                                liftSequence_X(
                                                                  extendScope,
                                                                  scope,
                                                                  setupRegularFrame(
                                                                    {
                                                                      hash,
                                                                      meta: forkMeta(
                                                                        (meta =
                                                                          nextMeta(
                                                                            meta,
                                                                          )),
                                                                      ),
                                                                    },
                                                                    listBinding(
                                                                      hoisting,
                                                                      hash,
                                                                    ),
                                                                  ),
                                                                ),
                                                                (scope) =>
                                                                  liftSequence__X_(
                                                                    makeControlBlock,
                                                                    EMPTY,
                                                                    EMPTY,
                                                                    liftSequenceXX(
                                                                      concatX_,
                                                                      liftSequenceX_(
                                                                        listEffectStatement,
                                                                        unbuildLeftBody(
                                                                          drillSite(
                                                                            node,
                                                                            hash,
                                                                            forkMeta(
                                                                              (meta =
                                                                                nextMeta(
                                                                                  meta,
                                                                                )),
                                                                            ),
                                                                            "left",
                                                                          ),
                                                                          scope,
                                                                          makeLeftContext(
                                                                            makeReadCacheExpression(
                                                                              value,
                                                                              hash,
                                                                            ),
                                                                          ),
                                                                        ),
                                                                        hash,
                                                                      ),
                                                                      liftSequenceX_(
                                                                        makeBlockStatement,
                                                                        unbuildControlBody(
                                                                          drillSite(
                                                                            node,
                                                                            hash,
                                                                            forkMeta(
                                                                              (meta =
                                                                                nextMeta(
                                                                                  meta,
                                                                                )),
                                                                            ),
                                                                            "body",
                                                                          ),
                                                                          scope,
                                                                          {
                                                                            labels:
                                                                              inner_label_array,
                                                                            hoisting,
                                                                            origin,
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
                                                ),
                                                hash,
                                              ),
                                              hash,
                                            ),
                                            makeControlBlock(
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
                                                  makeControlBlock(
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
                                                  makeControlBlock(
                                                    EMPTY,
                                                    EMPTY,
                                                    EMPTY,
                                                    hash,
                                                  ),
                                                  makeControlBlock(
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
                                            liftSequence__X_(
                                              makeControlBlock,
                                              EMPTY,
                                              EMPTY,
                                              liftSequenceX_(
                                                listEffectStatement,
                                                liftSequenceX(
                                                  concat_,
                                                  liftSequence_X__(
                                                    makeConditionalEffect,
                                                    makeReadCacheExpression(
                                                      should_call_return,
                                                      hash,
                                                    ),
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
                                                          liftSequenceX(
                                                            concat_,
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
                                                                      (node) =>
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
                                                                  (step) => [
                                                                    makeConditionalEffect(
                                                                      makeIsProperObjectExpression(
                                                                        {
                                                                          hash,
                                                                        },
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
                                                                  ],
                                                                ),
                                                                hash,
                                                              ),
                                                              hash,
                                                            ),
                                                          ),
                                                      ),
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
      const remainder = listSwitchRemainder({
        node,
        hash,
        meta: forkMeta((meta = nextMeta(meta))),
      });
      const child_loop = {
        break: mangleEmptyBreakLabel(hash),
        continue: loop.continue,
      };
      const outer_label_array = [
        ...(remainder.length > 0 || some(node.cases, hasEmptyBreak)
          ? [mangleEmptyBreakLabel(hash)]
          : EMPTY),
        ...map(labels, mangleBreakLabel),
      ];
      return liftSequenceXX(
        concatXX,
        listResetCompletionStatement(
          { hash, meta: forkMeta((meta = nextMeta(meta))) },
          scope,
        ),
        incorporateStatement(
          bindSequence(
            callSequence_X_(
              cacheConstant,
              forkMeta((meta = nextMeta(meta))),
              unbuildExpression(
                drillSite(
                  node,
                  hash,
                  forkMeta((meta = nextMeta(meta))),
                  "discriminant",
                ),
                scope,
                null,
              ),
              hash,
            ),
            (discriminant) =>
              listControlStatement(
                outer_label_array,
                incorporateStatement(
                  bindSequence(
                    liftSequence_X(
                      extendScope,
                      scope,
                      setupRegularFrame(
                        { hash, meta: forkMeta((meta = nextMeta(meta))) },
                        listBinding(hoisting, hash),
                      ),
                    ),
                    (scope) =>
                      bindSequence(
                        cacheWritable(
                          forkMeta((meta = nextMeta(meta))),
                          "aran.deadzone",
                        ),
                        (matched) =>
                          liftSequence_XXX(
                            concat_XXX,
                            makeEffectStatement(
                              makeWriteCacheEffect(
                                matched,
                                makePrimitiveExpression(false, hash),
                                hash,
                              ),
                              hash,
                            ),
                            liftSequenceX(
                              flat,
                              flatSequence(
                                mapIndex(node.cases.length, (index) =>
                                  unbuildHoistedStatement(
                                    drillDeepSite(
                                      node,
                                      hash,
                                      forkMeta((meta = nextMeta(meta))),
                                      "cases",
                                      index,
                                    ),
                                    scope,
                                    { hoisting },
                                  ),
                                ),
                              ),
                            ),
                            liftSequenceX(
                              flat,
                              flatSequence(
                                mapIndex(node.cases.length, (index) =>
                                  unbuildCase(
                                    drillDeepSite(
                                      node,
                                      hash,
                                      forkMeta((meta = nextMeta(meta))),
                                      "cases",
                                      index,
                                    ),
                                    scope,
                                    {
                                      origin,
                                      hoisting,
                                      last: index === node.cases.length - 1,
                                      discriminant,
                                      loop: child_loop,
                                      matched,
                                    },
                                  ),
                                ),
                              ),
                            ),
                            remainder.length === 0
                              ? EMPTY_SEQUENCE
                              : liftSequenceX(
                                  concat_,
                                  liftSequence__X_(
                                    makeIfStatement,
                                    makeReadCacheExpression(matched, hash),
                                    makeControlBlock(EMPTY, EMPTY, EMPTY, hash),
                                    incorporateControlBlock(
                                      liftSequence__X_(
                                        makeControlBlock,
                                        EMPTY,
                                        EMPTY,
                                        bindSequence(
                                          // TODO: verify this is correct
                                          zeroSequence(scope),
                                          // mapSequence(
                                          //   setupRegularFrame(
                                          //     { hash },
                                          //     flatMap(remainder, ({ node }) =>
                                          //       hoistBlock(mode, node),
                                          //     ),
                                          //   ),
                                          //   (frame) => extendScope(scope, frame),
                                          // ),
                                          (scope) =>
                                            liftSequenceX(
                                              flat,
                                              flatSequence(
                                                map(remainder, (site) =>
                                                  unbuildStatement(
                                                    site,
                                                    scope,
                                                    {
                                                      origin,
                                                      hoisting,
                                                      labels: EMPTY,
                                                      loop: child_loop,
                                                    },
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
                                ),
                          ),
                      ),
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
 *   nodes: (
 *     | import("estree-sentry").Directive<import("../../hash").HashProp>
 *     | import("estree-sentry").Statement<import("../../hash").HashProp>
 *     | import("estree-sentry").ModuleDeclaration<import("../../hash").HashProp>
 *   )[],
 *   meta: import("../meta").Meta,
 *   context: import("../context").StatementContext,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const unbuildBody = (nodes, meta, context) =>
  liftSequenceXX(
    concatXX,
    liftSequenceX(
      flat,
      flatSequence(
        map(nodes, (node) =>
          unbuildHoistedStatement(
            node,
            forkMeta((meta = nextMeta(meta))),
            context,
          ),
        ),
      ),
    ),
    liftSequenceX(
      flat,
      flatSequence(
        map(nodes, (node) =>
          unbuildStatement(node, forkMeta((meta = nextMeta(meta))), context),
        ),
      ),
    ),
  );
