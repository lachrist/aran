import {
  EMPTY,
  compileGet,
  concatXX,
  concatXXX,
  concatXX_,
  concatX_,
  concatX_X_X,
  concatX__,
  concat_,
  concat_X,
  concat__,
  findFirstIndex,
  flat,
  flatMap,
  includes,
  map,
  mapIndex,
  pairup,
  slice,
  some,
  unzip,
} from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import {
  makeScopeLoadExpression,
  listScopeSaveEffect,
  getMode,
  extendScope,
  setupRegularFrame,
  makeWrapResultOperation,
  makeInitializeOperation,
  CATCH_FRAME,
} from "../scope/index.mjs";
import {
  mangleBreakLabel,
  mangleContinueLabel,
  mangleEmptyBreakLabel,
  mangleEmptyContinueLabel,
} from "../mangle.mjs";
import {
  listEffectStatement,
  makeApplyExpression,
  makeBlockStatement,
  makeBreakStatement,
  makeConditionalEffect,
  makeConditionalExpression,
  makeControlBlock,
  makeDebuggerStatement,
  makeEffectStatement,
  makeExportEffect,
  makeExpressionEffect,
  makeIfStatement,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReturnStatement,
  makeSequenceExpression,
  makeTryStatement,
  makeWhileStatement,
} from "../node.mjs";
import { unbuildControlBody } from "./body.mjs";
import { unbuildCatch } from "./catch.mjs";
import { unbuildExpression } from "./expression.mjs";
import {
  DEFAULT_SPECIFIER,
  getSource,
  getSpecifier,
  hasEmptyBreak,
  hasEmptyContinue,
  hoistBlock,
} from "../query/index.mjs";
import { unbuildDeclarator } from "./declarator.mjs";
import { unbuildEffect } from "./effect.mjs";
import {
  makeArrayExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
} from "../intrinsic.mjs";
import { unbuildCase } from "./case.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildClass } from "./class.mjs";
import {
  drillDeepSite,
  drillSite,
  drillSiteArray,
  duplicateSite,
} from "../site.mjs";
import { unbuildDefault } from "./default.mjs";
import { unbuildInit, unbuildLeftHead, unbuildLeftBody } from "./left.mjs";
import { VOID_COMPLETION, isLastValue } from "../completion.mjs";
import {
  makeEarlyErrorExpression,
  makeRegularEarlyError,
} from "../early-error.mjs";
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
  flatSequence,
  initSequence,
  liftSequenceX,
  liftSequenceXX,
  liftSequenceXXX,
  liftSequenceXXXXX,
  liftSequenceXXX_,
  liftSequenceXX_,
  liftSequenceXX__,
  liftSequenceX_,
  liftSequenceX__,
  liftSequenceX___,
  liftSequence_X,
  liftSequence_X_,
  liftSequence_X__,
  liftSequence__X_,
  liftSequence____X,
  listenSequence,
  mapSequence,
  prependSequence,
  zeroSequence,
} from "../sequence.mjs";
import {
  listNextIteratorEffect,
  listReturnIteratorEffect,
} from "../helper.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { incorporatePrefixStatement } from "../prefix.mjs";
import { isBaseDeclarationPrelude } from "../prelude.mjs";
import { incorporateDeclarationControlBlock } from "../declaration.mjs";

/**
 * @type {(
 *   labels: unbuild.Label[],
 *   body: import("../sequence").Sequence<
 *     import("../prelude").BodyPrelude,
 *     aran.Statement<unbuild.Atom>[]
 *   >,
 *   path: unbuild.Path,
 * ) => import("../sequence").Sequence<
 *     import("../prelude").BodyPrelude,
 *     aran.Statement<unbuild.Atom>[]
 *   >}
 */
export const makeControlStatement = (labels, body, path) => {
  if (
    labels.length > 0 ||
    some(listenSequence(body), isBaseDeclarationPrelude)
  ) {
    return liftSequenceX(
      concat_,
      liftSequenceX_(
        makeBlockStatement,
        incorporateDeclarationControlBlock(
          liftSequence__X_(makeControlBlock, labels, EMPTY, body, path),
        ),
        path,
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
 *   node: estree.ReturnStatement,
 * ) => node is estree.ReturnStatement & {
 *   argument: estree.Expression,
 * }}
 */
const hasReturnArgument = (node) => node.argument != null;

/**
 * @type {(
 *   node: estree.ExportNamedDeclaration,
 * ) => node is estree.ExportNamedDeclaration & {
 *   declaration: estree.Declaration,
 * }}
 */
const hasExportDeclaration = (node) => node.declaration != null;

/**
 * @type {(
 *   node: estree.ExportNamedDeclaration,
 * ) => node is estree.ExportNamedDeclaration & {
 *   source: estree.Literal,
 * }}
 */
const hasExportSource = (node) => node.source != null;

/**
 * @type {(
 *   node: estree.IfStatement,
 * ) => node is estree.IfStatement & {
 *   alternate: estree.Statement,
 * }}
 */
const hasIfAlternate = (node) => node.alternate != null;

/**
 * @type {(
 *   node: estree.TryStatement,
 * ) => node is estree.TryStatement & {
 *   handler: estree.CatchClause,
 * }}
 */
const hasTryHandler = (node) => node.handler != null;

/**
 * @type {(
 *   node: estree.TryStatement,
 * ) => node is estree.TryStatement & {
 *   finalizer: estree.BlockStatement,
 * }}
 */
const hasTryFinalizer = (node) => node.finalizer != null;

/**
 * @type {(
 *   node: estree.ForStatement,
 * ) => node is estree.ForStatement & {
 *   init: estree.VariableDeclaration & {
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
 *   node: estree.ForStatement,
 * ) => node is estree.ForStatement & {
 *   test: estree.Expression,
 * }}
 */
const hasForTest = (node) => node.test != null;

/**
 * @type {(
 *   node: estree.ForStatement,
 * ) => node is estree.ForStatement & {
 *   init: estree.VariableDeclaration | estree.Expression,
 * }}
 */
const hasForInit = (node) => node.init != null;

/**
 * @type {(
 *   node: estree.ForStatement,
 * ) => node is estree.ForStatement & {
 *   update: estree.Expression,
 * }}
 */
const hasForUpdate = (node) => node.update != null;

const getConsequent = compileGet("consequent");

/**
 * @type {(
 *   path: unbuild.Path,
 *   completion: import("../completion").StatementCompletion,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
const makeUndefinedCompletion = (path, completion) => {
  switch (completion.type) {
    case "void": {
      return EMPTY;
    }
    case "indirect": {
      if (isLastValue(path, completion.root)) {
        return [
          makeEffectStatement(
            makeWriteCacheEffect(
              completion.cache,
              makePrimitiveExpression({ undefined: null }, path),
              path,
            ),
            path,
          ),
        ];
      } else {
        return EMPTY;
      }
    }
    default: {
      throw new AranTypeError(completion);
    }
  }
};

/**
 * @type {(
 *   site: import("../site").Site<estree.SwitchStatement>,
 * ) => import("../site").Site<estree.Statement>[]}
 */
export const listSwitchRemainder = ({ node, path, meta }) => {
  const index = findFirstIndex(node.cases, (node) => node.test === null);
  if (index === -1 || index === node.cases.length - 1) {
    return EMPTY;
  } else {
    return flatMap(
      slice(
        drillSiteArray(drillSite(node, path, meta, "cases")),
        index,
        node.cases.length,
      ),
      ({ node, path, meta }) =>
        drillSiteArray(drillSite(node, path, meta, "consequent")),
    );
  }
};

/**
 * @type {(
 *   node: estree.Statement,
 *   labels: (estree.Label | null)[],
 * ) => boolean}
 */
const hasAbrupt = (node, labels) => {
  if (node.type === "BreakStatement" || node.type === "ContinueStatement") {
    return !includes(labels, node.label == null ? null : node.label.name);
  } else if (
    node.type === "EmptyStatement" ||
    node.type === "DebuggerStatement" ||
    node.type === "ExpressionStatement" ||
    node.type === "ReturnStatement" ||
    node.type === "ThrowStatement" ||
    node.type === "VariableDeclaration" ||
    node.type === "FunctionDeclaration" ||
    node.type === "ClassDeclaration"
  ) {
    return false;
  } else if (
    node.type === "WhileStatement" ||
    node.type === "DoWhileStatement" ||
    node.type === "ForStatement" ||
    node.type === "ForInStatement" ||
    node.type === "ForOfStatement"
  ) {
    return hasAbrupt(node.body, [...labels, null]);
  } else if (node.type === "BlockStatement" || node.type === "StaticBlock") {
    return some(node.body, (node) => hasAbrupt(node, labels));
  } else if (node.type === "LabeledStatement") {
    return hasAbrupt(node.body, [
      ...labels,
      /** @type estree.Label */ (node.label.name),
    ]);
  } else if (node.type === "WithStatement") {
    return hasAbrupt(node.body, labels);
  } else if (node.type === "IfStatement") {
    return (
      hasAbrupt(node.consequent, labels) ||
      (node.alternate != null && hasAbrupt(node.alternate, labels))
    );
  } else if (node.type === "SwitchStatement") {
    const new_label_array = [...labels, null];
    return some(node.cases, (node) =>
      some(node.consequent, (node) => hasAbrupt(node, new_label_array)),
    );
  } else if (node.type === "TryStatement") {
    return (
      hasAbrupt(node.block, labels) ||
      (node.handler != null && hasAbrupt(node.handler.body, labels)) ||
      (node.finalizer != null && hasAbrupt(node.finalizer, labels))
    );
  } else {
    throw new AranTypeError(node);
  }
};

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     labels: estree.Label[],
 *     completion: import("../completion").StatementCompletion,
 *     loop: {
 *       break: null | unbuild.Label,
 *       continue: null | unbuild.Label,
 *     },
 *   },
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Statement<unbuild.Atom>[],
 * >}
 */
export const unbuildStatement = (
  { node, path, meta },
  scope,
  { labels, completion, loop },
) => {
  switch (node.type) {
    case "EmptyStatement": {
      return EMPTY_SEQUENCE;
    }
    case "DebuggerStatement": {
      return zeroSequence([makeDebuggerStatement(path)]);
    }
    case "ReturnStatement": {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeReturnStatement,
          callSequence__X(
            makeScopeLoadExpression,
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            liftSequence_X(
              makeWrapResultOperation,
              getMode(scope),
              hasReturnArgument(node)
                ? unbuildExpression(
                    drillSite(
                      node,
                      path,
                      forkMeta((meta = nextMeta(meta))),
                      "argument",
                    ),
                    scope,
                    null,
                  )
                : zeroSequence(null),
            ),
          ),
          path,
        ),
      );
    }
    case "ExpressionStatement": {
      switch (completion.type) {
        case "void": {
          return liftSequenceX_(
            listEffectStatement,
            unbuildEffect(
              drillSite(node, path, meta, "expression"),
              scope,
              null,
            ),
            path,
          );
        }
        case "indirect": {
          if (isLastValue(path, completion.root)) {
            return liftSequenceX(
              concat_,
              liftSequenceX_(
                makeEffectStatement,
                liftSequence_X_(
                  makeWriteCacheEffect,
                  completion.cache,
                  unbuildExpression(
                    drillSite(node, path, meta, "expression"),
                    scope,
                    null,
                  ),
                  path,
                ),
                path,
              ),
            );
          } else {
            return liftSequenceX_(
              listEffectStatement,
              unbuildEffect(
                drillSite(node, path, meta, "expression"),
                scope,
                null,
              ),
              path,
            );
          }
        }
        default: {
          throw new AranTypeError(completion);
        }
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
              makeIntrinsicExpression("aran.throw", path),
              makePrimitiveExpression({ undefined: null }, path),
              liftSequenceX(
                concat_,
                unbuildExpression(
                  drillSite(node, path, meta, "argument"),
                  scope,
                  null,
                ),
              ),
              path,
            ),
            path,
          ),
          path,
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
                makeEarlyErrorExpression(
                  makeRegularEarlyError("Illegal break statement", path),
                ),
                path,
              ),
              path,
            ),
          );
        } else {
          return zeroSequence([makeBreakStatement(loop.break, path)]);
        }
      } else if (includes(labels, node.label.name)) {
        return EMPTY_SEQUENCE;
      } else {
        return zeroSequence([
          makeBreakStatement(
            mangleBreakLabel(/** @type {estree.Label} */ (node.label.name)),
            path,
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
                makeEarlyErrorExpression(
                  makeRegularEarlyError("Illegal continue statement", path),
                ),
                path,
              ),
              path,
            ),
          );
        } else {
          return zeroSequence([makeBreakStatement(loop.continue, path)]);
        }
      } else if (includes(labels, node.label.name)) {
        return EMPTY_SEQUENCE;
      } else {
        return zeroSequence([
          makeBreakStatement(
            mangleContinueLabel(/** @type {estree.Label} */ (node.label.name)),
            path,
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
            mapIndex(node.declarations.length, (index) =>
              unbuildDeclarator(
                drillDeepSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "declarations",
                  index,
                ),
                scope,
                { kind: node.kind },
              ),
            ),
          ),
        ),
        path,
      );
    }
    case "FunctionDeclaration": {
      if (node.id === null) {
        return liftSequenceX(
          concat_,
          liftSequenceX_(
            makeEffectStatement,
            liftSequence_X_(
              makeExportEffect,
              DEFAULT_SPECIFIER,
              unbuildFunction({ node, path, meta }, scope, {
                type: "function",
                name: { type: "default" },
              }),
              path,
            ),
            path,
          ),
        );
      } else {
        return EMPTY_SEQUENCE;
      }
    }
    case "ClassDeclaration": {
      if (node.id === null) {
        return liftSequenceX(
          concat_,
          liftSequenceX_(
            makeEffectStatement,
            liftSequence_X_(
              makeExportEffect,
              DEFAULT_SPECIFIER,
              unbuildClass({ node, path, meta }, scope, {
                name: { type: "default" },
              }),
              path,
            ),
            path,
          ),
        );
      } else {
        const variable = /** @type {estree.Variable} */ (node.id.name);
        return liftSequenceX_(
          listEffectStatement,
          callSequence__X(
            listScopeSaveEffect,
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            liftSequence____X(
              makeInitializeOperation,
              getMode(scope),
              "let",
              false,
              variable,
              unbuildClass(
                { node, path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                { name: { type: "assignment", variable } },
              ),
            ),
          ),
          path,
        );
      }
    }
    case "ImportDeclaration": {
      if (node.specifiers.length === 0) {
        return initSequence(
          [
            {
              type: "header",
              data: {
                type: "import",
                mode: "strict",
                source: getSource(node.source),
                import: null,
              },
            },
          ],
          EMPTY,
        );
      } else {
        return zeroSequence(EMPTY);
      }
    }
    case "ExportNamedDeclaration": {
      if (hasExportSource(node)) {
        if (hasExportDeclaration(node)) {
          return initSequence(
            [
              {
                type: "early-error",
                data: {
                  type: "regular",
                  message:
                    "Conflict between import and declaration in export statement",
                  path,
                },
              },
            ],
            EMPTY,
          );
        } else {
          if (node.specifiers.length === 0) {
            return initSequence(
              [
                {
                  type: "header",
                  data: {
                    type: "import",
                    mode: "strict",
                    source: getSource(node.source),
                    import: null,
                  },
                },
              ],
              EMPTY,
            );
          } else {
            return initSequence(
              map(node.specifiers, (specifier) => ({
                type: "header",
                data: {
                  type: "aggregate",
                  mode: "strict",
                  source: getSource(node.source),
                  import: getSpecifier(specifier.local),
                  export: getSpecifier(specifier.exported),
                },
              })),
              EMPTY,
            );
          }
        }
      } else {
        if (hasExportDeclaration(node)) {
          return unbuildStatement(
            drillSite(node, path, meta, "declaration"),
            scope,
            {
              labels: EMPTY,
              completion,
              loop,
            },
          );
        } else {
          if (node.specifiers.length === 0) {
            return initSequence(
              [
                {
                  type: "early-error",
                  data: {
                    type: "regular",
                    message: "Illegal empty export statement",
                    path,
                  },
                },
              ],
              EMPTY,
            );
          } else {
            return zeroSequence(EMPTY);
          }
        }
      }
    }
    case "ExportDefaultDeclaration": {
      return prependSequence(
        [
          {
            type: "header",
            data: {
              type: "export",
              mode: "strict",
              export: DEFAULT_SPECIFIER,
            },
          },
        ],
        unbuildDefault(drillSite(node, path, meta, "declaration"), scope, null),
      );
    }
    case "ExportAllDeclaration": {
      return initSequence(
        [
          {
            type: "header",
            data: {
              type: "aggregate",
              mode: "strict",
              source: getSource(node.source),
              import: null,
              export:
                node.exported == null ? null : getSpecifier(node.exported),
            },
          },
        ],
        EMPTY,
      );
    }
    case "LabeledStatement": {
      return unbuildStatement(drillSite(node, path, meta, "body"), scope, {
        labels: [...labels, /** @type {estree.Label} */ (node.label.name)],
        completion,
        loop,
      });
    }
    case "BlockStatement": {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeBlockStatement,
          incorporateDeclarationControlBlock(
            liftSequence__X_(
              makeControlBlock,
              map(labels, mangleBreakLabel),
              EMPTY,
              unbuildControlBody({ node, path, meta }, scope, {
                completion,
                loop,
              }),
              path,
            ),
          ),
          path,
        ),
      );
    }
    case "StaticBlock": {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeEffectStatement,
          liftSequenceX_(
            makeExpressionEffect,
            makeEarlyErrorExpression(
              makeRegularEarlyError("Illegal static block", path),
            ),
            path,
          ),
          path,
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
              makeEarlyErrorExpression(
                makeRegularEarlyError("'with' is illegal in strict mode", path),
              ),
              path,
            ),
            path,
          ),
        );
      } else if (mode === "sloppy") {
        return liftSequence_X(
          concatXX,
          makeUndefinedCompletion(path, completion),
          incorporatePrefixStatement(
            bindSequence(
              callSequence_X_(
                cacheConstant,
                forkMeta((meta = nextMeta(meta))),
                unbuildExpression(
                  drillSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "object",
                  ),
                  scope,
                  null,
                ),
                path,
              ),
              (raw_frame) =>
                bindSequence(
                  cacheConstant(
                    forkMeta((meta = nextMeta(meta))),
                    makeConditionalExpression(
                      makeBinaryExpression(
                        "==",
                        makeReadCacheExpression(raw_frame, path),
                        makePrimitiveExpression(null, path),
                        path,
                      ),
                      makeThrowErrorExpression(
                        "TypeError",
                        "Cannot convert undefined or null to object",
                        path,
                      ),
                      makeApplyExpression(
                        makeIntrinsicExpression("Object", path),
                        makePrimitiveExpression({ undefined: null }, path),
                        [makeReadCacheExpression(raw_frame, path)],
                        path,
                      ),
                      path,
                    ),
                    path,
                  ),
                  (frame) =>
                    liftSequenceX(
                      concat_,
                      liftSequenceX_(
                        makeBlockStatement,
                        incorporateDeclarationControlBlock(
                          liftSequence__X_(
                            makeControlBlock,
                            map(labels, mangleBreakLabel),
                            EMPTY,
                            unbuildControlBody(
                              drillSite(
                                node,
                                path,
                                forkMeta((meta = nextMeta(meta))),
                                "body",
                              ),
                              extendScope(scope, {
                                type: "with",
                                record: frame,
                              }),
                              { completion, loop },
                            ),
                            path,
                          ),
                        ),
                        path,
                      ),
                    ),
                ),
            ),
            path,
          ),
        );
      } else {
        throw new AranTypeError(mode);
      }
    }
    case "IfStatement": {
      return liftSequence_X(
        concatX_,
        makeUndefinedCompletion(path, completion),
        liftSequenceXXX_(
          makeIfStatement,
          unbuildExpression(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "test"),
            scope,
            null,
          ),
          incorporateDeclarationControlBlock(
            liftSequence__X_(
              makeControlBlock,
              map(labels, mangleBreakLabel),
              EMPTY,
              unbuildControlBody(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "consequent",
                ),
                scope,
                { completion, loop },
              ),
              path,
            ),
          ),
          hasIfAlternate(node)
            ? incorporateDeclarationControlBlock(
                liftSequence__X_(
                  makeControlBlock,
                  map(labels, mangleBreakLabel),
                  EMPTY,
                  unbuildControlBody(
                    drillSite(
                      node,
                      path,
                      forkMeta((meta = nextMeta(meta))),
                      "alternate",
                    ),
                    scope,
                    { completion, loop },
                  ),
                  path,
                ),
              )
            : zeroSequence(makeControlBlock(EMPTY, EMPTY, EMPTY, path)),
          path,
        ),
      );
    }
    case "TryStatement": {
      return liftSequence_X(
        concatX_,
        makeUndefinedCompletion(path, completion),
        liftSequenceXXX_(
          makeTryStatement,
          incorporateDeclarationControlBlock(
            liftSequence__X_(
              makeControlBlock,
              map(labels, mangleBreakLabel),
              EMPTY,
              unbuildControlBody(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "block",
                ),
                scope,
                { loop, completion },
              ),
              path,
            ),
          ),
          hasTryHandler(node)
            ? unbuildCatch(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "handler",
                ),
                scope,
                {
                  labels: map(labels, mangleBreakLabel),
                  completion,
                  loop,
                },
              )
            : incorporateDeclarationControlBlock(
                liftSequence__X_(
                  makeControlBlock,
                  EMPTY,
                  EMPTY,
                  bindSequence(
                    mapSequence(setupRegularFrame({ path }, EMPTY), (frame) =>
                      extendScope(extendScope(scope, CATCH_FRAME), frame),
                    ),
                    (scope) =>
                      liftSequenceX(
                        concat_,
                        liftSequenceX_(
                          makeEffectStatement,
                          liftSequenceX_(
                            makeExpressionEffect,
                            liftSequence__X_(
                              makeApplyExpression,
                              makeIntrinsicExpression("aran.throw", path),
                              makePrimitiveExpression(
                                { undefined: null },
                                path,
                              ),
                              liftSequenceX(
                                concat_,
                                makeScopeLoadExpression(
                                  {
                                    path,
                                    meta: forkMeta((meta = nextMeta(meta))),
                                  },
                                  scope,
                                  { type: "read-error", mode: getMode(scope) },
                                ),
                              ),
                              path,
                            ),
                            path,
                          ),
                          path,
                        ),
                      ),
                  ),
                  path,
                ),
              ),
          hasTryFinalizer(node)
            ? completion.type === "indirect" && hasAbrupt(node.finalizer, EMPTY)
              ? // a: try { throw "boum"; }
                //    catch { 123; }
                //    finally { 456; break a }
                // > 456
                incorporateDeclarationControlBlock(
                  liftSequence__X_(
                    makeControlBlock,
                    map(labels, mangleBreakLabel),
                    EMPTY,
                    incorporatePrefixStatement(
                      bindSequence(
                        cacheConstant(
                          forkMeta((meta = nextMeta(meta))),
                          makeReadCacheExpression(completion.cache, path),
                          path,
                        ),
                        (restore) =>
                          liftSequence_X_(
                            concatXX_,
                            makeUndefinedCompletion(path, completion),
                            unbuildControlBody(
                              drillSite(
                                node,
                                path,
                                forkMeta((meta = nextMeta(meta))),
                                "finalizer",
                              ),
                              scope,
                              { loop, completion },
                            ),
                            makeEffectStatement(
                              makeWriteCacheEffect(
                                completion.cache,
                                makeReadCacheExpression(restore, path),
                                path,
                              ),
                              path,
                            ),
                          ),
                      ),
                      path,
                    ),
                    path,
                  ),
                )
              : incorporateDeclarationControlBlock(
                  liftSequence__X_(
                    makeControlBlock,
                    map(labels, mangleBreakLabel),
                    EMPTY,
                    unbuildControlBody(
                      drillSite(
                        node,
                        path,
                        forkMeta((meta = nextMeta(meta))),
                        "finalizer",
                      ),
                      scope,
                      { loop, completion: VOID_COMPLETION },
                    ),
                    path,
                  ),
                )
            : zeroSequence(makeControlBlock(EMPTY, EMPTY, EMPTY, path)),
          path,
        ),
      );
    }
    case "WhileStatement": {
      const loop = {
        break: mangleEmptyBreakLabel(path),
        continue: mangleEmptyContinueLabel(path),
      };
      const inner_label_array = [
        ...(hasEmptyContinue(node.body) ? [loop.continue] : EMPTY),
        ...map(labels, mangleContinueLabel),
      ];
      const outer_label_array = [
        ...(hasEmptyBreak(node.body) ? [loop.break] : EMPTY),
        ...map(labels, mangleBreakLabel),
      ];
      return liftSequence_X(
        concatXX,
        makeUndefinedCompletion(path, completion),
        makeControlStatement(
          outer_label_array,
          bindSequence(
            mapSequence(setupRegularFrame({ path }, EMPTY), (frame) =>
              extendScope(scope, frame),
            ),
            (scope) =>
              liftSequenceX(
                concat_,
                liftSequenceXX_(
                  makeWhileStatement,
                  unbuildExpression(
                    drillSite(
                      node,
                      path,
                      forkMeta((meta = nextMeta(meta))),
                      "test",
                    ),
                    scope,
                    null,
                  ),
                  incorporateDeclarationControlBlock(
                    liftSequence__X_(
                      makeControlBlock,
                      inner_label_array,
                      EMPTY,
                      liftSequence_X(
                        concatXX,
                        makeUndefinedCompletion(path, completion),
                        unbuildControlBody(
                          drillSite(
                            node,
                            path,
                            forkMeta((meta = nextMeta(meta))),
                            "body",
                          ),
                          scope,
                          { loop, completion },
                        ),
                      ),
                      path,
                    ),
                  ),
                  path,
                ),
              ),
          ),
          path,
        ),
      );
    }
    case "DoWhileStatement": {
      const loop = {
        break: mangleEmptyBreakLabel(path),
        continue: mangleEmptyContinueLabel(path),
      };
      const inner_label_array = [
        ...(hasEmptyContinue(node.body) ? [loop.continue] : EMPTY),
        ...map(labels, mangleContinueLabel),
      ];
      const outer_label_array = [
        ...(hasEmptyBreak(node.body) ? [loop.break] : EMPTY),
        ...map(labels, mangleBreakLabel),
      ];
      return makeControlStatement(
        outer_label_array,
        bindSequence(
          mapSequence(setupRegularFrame({ path }, EMPTY), (frame) =>
            extendScope(scope, frame),
          ),
          (scope) =>
            liftSequenceX(
              concat_,
              bindSequence(
                cacheWritable(
                  forkMeta((meta = nextMeta(meta))),
                  { type: "primitive", primitive: true },
                  path,
                ),
                (initial) =>
                  liftSequenceXX_(
                    makeWhileStatement,
                    liftSequence__X_(
                      makeConditionalExpression,
                      makeReadCacheExpression(initial, path),
                      makeSequenceExpression(
                        [
                          makeWriteCacheEffect(
                            initial,
                            makePrimitiveExpression(false, path),
                            path,
                          ),
                        ],
                        makePrimitiveExpression(true, path),
                        path,
                      ),
                      unbuildExpression(
                        drillSite(
                          node,
                          path,
                          forkMeta((meta = nextMeta(meta))),
                          "test",
                        ),
                        scope,
                        null,
                      ),
                      path,
                    ),
                    incorporateDeclarationControlBlock(
                      liftSequence__X_(
                        makeControlBlock,
                        inner_label_array,
                        EMPTY,
                        liftSequence_X(
                          concatXX,
                          makeUndefinedCompletion(path, completion),
                          unbuildControlBody(
                            drillSite(
                              node,
                              path,
                              forkMeta((meta = nextMeta(meta))),
                              "body",
                            ),
                            scope,
                            { loop, completion },
                          ),
                        ),
                        path,
                      ),
                    ),
                    path,
                  ),
              ),
            ),
        ),
        path,
      );
    }
    case "ForStatement": {
      const mode = getMode(scope);
      const loop = {
        break: mangleEmptyBreakLabel(path),
        continue: mangleEmptyContinueLabel(path),
      };
      const outer_label_array = [
        ...(hasEmptyBreak(node.body) ? [mangleEmptyBreakLabel(path)] : EMPTY),
        ...map(labels, mangleBreakLabel),
      ];
      const inner_label_array = [
        ...(hasEmptyContinue(node.body)
          ? [mangleEmptyContinueLabel(path)]
          : EMPTY),
        ...map(labels, mangleContinueLabel),
      ];
      if (isForLexical(node)) {
        const hoisting = hoistBlock(mode, node.init);
        return liftSequence_X(
          concatX_,
          makeUndefinedCompletion(path, completion),
          liftSequenceX_(
            makeBlockStatement,
            incorporateDeclarationControlBlock(
              liftSequence__X_(
                makeControlBlock,
                outer_label_array,
                EMPTY,
                bindSequence(
                  mapSequence(setupRegularFrame({ path }, hoisting), (frame) =>
                    extendScope(scope, frame),
                  ),
                  (scope) =>
                    liftSequenceXX(
                      concatXX,
                      unbuildStatement(
                        drillSite(node, path, meta, "init"),
                        scope,
                        {
                          labels: EMPTY,
                          completion,
                          loop: { break: null, continue: null },
                        },
                      ),
                      bindSequence(
                        flatSequence(
                          map(hoisting, ({ variable, kind }) =>
                            mapSequence(
                              cacheWritable(
                                forkMeta((meta = nextMeta(meta))),
                                {
                                  type: "intrinsic",
                                  intrinsic: "aran.deadzone",
                                },
                                path,
                              ),
                              (cache) =>
                                pairup(
                                  cache,
                                  /**
                                   * @type {(import("../scope/operation").InitializeOperation)}
                                   */ ({
                                    type: "initialize",
                                    mode,
                                    kind,
                                    variable,
                                    right: makeReadCacheExpression(cache, path),
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
                                        path,
                                        meta: forkMeta((meta = nextMeta(meta))),
                                      },
                                      scope,
                                      { type: "read", mode, variable },
                                    ),
                                    path,
                                  ),
                                ),
                              ),
                              path,
                            ),
                            liftSequenceX(
                              concat_,
                              bindSequence(
                                cacheWritable(
                                  forkMeta((meta = nextMeta(meta))),
                                  { type: "primitive", primitive: true },
                                  path,
                                ),
                                (first) =>
                                  bindSequence(
                                    cacheWritable(
                                      forkMeta((meta = nextMeta(meta))),
                                      {
                                        type: "primitive",
                                        primitive: true,
                                      },
                                      path,
                                    ),
                                    (test) =>
                                      liftSequence_X_(
                                        makeWhileStatement,
                                        makeConditionalExpression(
                                          makeReadCacheExpression(first, path),
                                          makePrimitiveExpression(true, path),
                                          makeReadCacheExpression(test, path),
                                          path,
                                        ),
                                        incorporateDeclarationControlBlock(
                                          liftSequence__X_(
                                            makeControlBlock,
                                            EMPTY,
                                            EMPTY,
                                            bindSequence(
                                              mapSequence(
                                                setupRegularFrame(
                                                  { path },
                                                  hoisting,
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
                                                                path,
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
                                                    path,
                                                  ),
                                                  liftSequenceX_(
                                                    makeEffectStatement,
                                                    liftSequence__X_(
                                                      makeConditionalEffect,
                                                      makeReadCacheExpression(
                                                        first,
                                                        path,
                                                      ),
                                                      [
                                                        makeWriteCacheEffect(
                                                          first,
                                                          makePrimitiveExpression(
                                                            false,
                                                            path,
                                                          ),
                                                          path,
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
                                                                  path,
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
                                                              path,
                                                            ),
                                                          )
                                                        : EMPTY_SEQUENCE,
                                                      path,
                                                    ),
                                                    path,
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
                                                                path,
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
                                                            path,
                                                          ),
                                                          path,
                                                        ),
                                                      )
                                                    : EMPTY_SEQUENCE,
                                                  liftSequence_X__(
                                                    makeIfStatement,
                                                    makeReadCacheExpression(
                                                      test,
                                                      path,
                                                    ),
                                                    incorporateDeclarationControlBlock(
                                                      liftSequence__X_(
                                                        makeControlBlock,
                                                        inner_label_array,
                                                        EMPTY,
                                                        liftSequence_X(
                                                          concatXX,
                                                          makeUndefinedCompletion(
                                                            path,
                                                            completion,
                                                          ),
                                                          unbuildControlBody(
                                                            drillSite(
                                                              node,
                                                              path,
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
                                                              completion,
                                                              loop,
                                                            },
                                                          ),
                                                        ),
                                                        path,
                                                      ),
                                                    ),
                                                    makeControlBlock(
                                                      EMPTY,
                                                      EMPTY,
                                                      EMPTY,
                                                      path,
                                                    ),
                                                    path,
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
                                                                path,
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
                                                            path,
                                                          ),
                                                      ),
                                                    ),
                                                    path,
                                                  ),
                                                ),
                                            ),
                                            path,
                                          ),
                                        ),
                                        path,
                                      ),
                                  ),
                              ),
                            ),
                          ),
                      ),
                    ),
                ),
                path,
              ),
            ),
            path,
          ),
        );
      } else {
        return liftSequence_X(
          concatXX,
          makeUndefinedCompletion(path, completion),
          makeControlStatement(
            outer_label_array,
            bindSequence(
              mapSequence(setupRegularFrame({ path }, EMPTY), (frame) =>
                extendScope(scope, frame),
              ),
              (scope) =>
                liftSequenceXX(
                  concatX_,
                  hasForInit(node)
                    ? unbuildInit(
                        drillSite(
                          node,
                          path,
                          forkMeta((meta = nextMeta(meta))),
                          "init",
                        ),
                        scope,
                        null,
                      )
                    : EMPTY_SEQUENCE,
                  liftSequenceXX_(
                    makeWhileStatement,
                    hasForTest(node)
                      ? unbuildExpression(
                          drillSite(
                            node,
                            path,
                            forkMeta((meta = nextMeta(meta))),
                            "test",
                          ),
                          scope,
                          null,
                        )
                      : zeroSequence(makePrimitiveExpression(true, path)),
                    hasForUpdate(node)
                      ? incorporateDeclarationControlBlock(
                          liftSequence__X_(
                            makeControlBlock,
                            EMPTY,
                            EMPTY,
                            bindSequence(
                              mapSequence(
                                setupRegularFrame({ path }, EMPTY),
                                (frame) => extendScope(scope, frame),
                              ),
                              (scope) =>
                                liftSequenceXX(
                                  concat_X,
                                  liftSequenceX_(
                                    makeBlockStatement,
                                    incorporateDeclarationControlBlock(
                                      liftSequence__X_(
                                        makeControlBlock,
                                        inner_label_array,
                                        EMPTY,
                                        liftSequence_X(
                                          concatXX,
                                          makeUndefinedCompletion(
                                            path,
                                            completion,
                                          ),
                                          unbuildControlBody(
                                            drillSite(
                                              node,
                                              path,
                                              forkMeta((meta = nextMeta(meta))),
                                              "body",
                                            ),
                                            scope,
                                            { completion, loop },
                                          ),
                                        ),
                                        path,
                                      ),
                                    ),
                                    path,
                                  ),
                                  liftSequenceX_(
                                    listEffectStatement,
                                    unbuildEffect(
                                      drillSite(
                                        node,
                                        path,
                                        forkMeta((meta = nextMeta(meta))),
                                        "update",
                                      ),
                                      scope,
                                      null,
                                    ),
                                    path,
                                  ),
                                ),
                            ),
                            path,
                          ),
                        )
                      : incorporateDeclarationControlBlock(
                          liftSequence__X_(
                            makeControlBlock,
                            inner_label_array,
                            EMPTY,
                            liftSequence_X(
                              concatXX,
                              makeUndefinedCompletion(path, completion),
                              unbuildControlBody(
                                drillSite(
                                  node,
                                  path,
                                  forkMeta((meta = nextMeta(meta))),
                                  "body",
                                ),
                                scope,
                                { loop, completion },
                              ),
                            ),
                            path,
                          ),
                        ),
                    path,
                  ),
                ),
            ),
            path,
          ),
        );
      }
    }
    case "ForInStatement": {
      const mode = getMode(scope);
      const loop = {
        break: mangleEmptyBreakLabel(path),
        continue: mangleEmptyContinueLabel(path),
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
      return liftSequence_X(
        concatXX,
        makeUndefinedCompletion(path, completion),
        makeControlStatement(
          outer_label_array,
          bindSequence(
            liftSequence_X(
              extendScope,
              scope,
              setupRegularFrame({ path }, hoistBlock(mode, node.left)),
            ),
            (scope) =>
              liftSequenceXX(
                concatXX,
                unbuildLeftHead(
                  drillSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "left",
                  ),
                  scope,
                  null,
                ),
                incorporatePrefixStatement(
                  liftSequenceX(
                    concat_,
                    bindSequence(
                      callSequence_X_(
                        cacheConstant,
                        forkMeta((meta = nextMeta(meta))),
                        unbuildExpression(
                          drillSite(
                            node,
                            path,
                            forkMeta((meta = nextMeta(meta))),
                            "right",
                          ),
                          scope,
                          null,
                        ),
                        path,
                      ),
                      (right) =>
                        bindSequence(
                          cacheConstant(
                            forkMeta((meta = nextMeta(meta))),
                            makeApplyExpression(
                              makeIntrinsicExpression(
                                "aran.listForInKey",
                                path,
                              ),
                              makePrimitiveExpression(
                                { undefined: null },
                                path,
                              ),
                              [makeReadCacheExpression(right, path)],
                              path,
                            ),
                            path,
                          ),
                          (keys) =>
                            bindSequence(
                              cacheWritable(
                                forkMeta((meta = nextMeta(meta))),
                                { type: "primitive", primitive: 0 },
                                path,
                              ),
                              (index) =>
                                liftSequence_X_(
                                  makeWhileStatement,
                                  makeBinaryExpression(
                                    "<",
                                    makeReadCacheExpression(index, path),
                                    makeGetExpression(
                                      makeReadCacheExpression(keys, path),
                                      makePrimitiveExpression("length", path),
                                      path,
                                    ),
                                    path,
                                  ),
                                  incorporateDeclarationControlBlock(
                                    liftSequence__X_(
                                      makeControlBlock,
                                      EMPTY,
                                      EMPTY,
                                      bindSequence(
                                        liftSequence_X(
                                          extendScope,
                                          scope,
                                          setupRegularFrame(
                                            { path },
                                            hoistBlock(mode, node.left),
                                          ),
                                        ),
                                        (scope) =>
                                          liftSequenceXX_(
                                            concatX__,
                                            incorporatePrefixStatement(
                                              bindSequence(
                                                cacheConstant(
                                                  forkMeta(
                                                    (meta = nextMeta(meta)),
                                                  ),
                                                  makeGetExpression(
                                                    makeReadCacheExpression(
                                                      keys,
                                                      path,
                                                    ),
                                                    makeReadCacheExpression(
                                                      index,
                                                      path,
                                                    ),
                                                    path,
                                                  ),
                                                  path,
                                                ),
                                                (right) =>
                                                  liftSequenceX_(
                                                    listEffectStatement,
                                                    unbuildLeftBody(
                                                      drillSite(
                                                        node,
                                                        path,
                                                        forkMeta(
                                                          (meta =
                                                            nextMeta(meta)),
                                                        ),
                                                        "left",
                                                      ),
                                                      scope,
                                                      { right },
                                                    ),
                                                    path,
                                                  ),
                                              ),
                                              path,
                                            ),
                                            liftSequence_X__(
                                              makeIfStatement,
                                              makeBinaryExpression(
                                                "in",
                                                makeGetExpression(
                                                  makeReadCacheExpression(
                                                    keys,
                                                    path,
                                                  ),
                                                  makeReadCacheExpression(
                                                    index,
                                                    path,
                                                  ),
                                                  path,
                                                ),
                                                makeReadCacheExpression(
                                                  right,
                                                  path,
                                                ),
                                                path,
                                              ),
                                              incorporateDeclarationControlBlock(
                                                liftSequence__X_(
                                                  makeControlBlock,
                                                  inner_label_array,
                                                  EMPTY,
                                                  liftSequence_X(
                                                    concatXX,
                                                    makeUndefinedCompletion(
                                                      path,
                                                      completion,
                                                    ),
                                                    unbuildControlBody(
                                                      drillSite(
                                                        node,
                                                        path,
                                                        forkMeta(
                                                          (meta =
                                                            nextMeta(meta)),
                                                        ),
                                                        "body",
                                                      ),
                                                      scope,
                                                      { completion, loop },
                                                    ),
                                                  ),
                                                  path,
                                                ),
                                              ),
                                              makeControlBlock(
                                                EMPTY,
                                                EMPTY,
                                                EMPTY,
                                                path,
                                              ),
                                              path,
                                            ),
                                            makeEffectStatement(
                                              makeWriteCacheEffect(
                                                index,
                                                makeBinaryExpression(
                                                  "+",
                                                  makeReadCacheExpression(
                                                    index,
                                                    path,
                                                  ),
                                                  makePrimitiveExpression(
                                                    1,
                                                    path,
                                                  ),
                                                  path,
                                                ),
                                                path,
                                              ),
                                              path,
                                            ),
                                          ),
                                      ),
                                      path,
                                    ),
                                  ),
                                  path,
                                ),
                            ),
                        ),
                    ),
                  ),
                  path,
                ),
              ),
          ),
          path,
        ),
      );
    }
    case "ForOfStatement": {
      const mode = getMode(scope);
      const loop = {
        break: mangleEmptyBreakLabel(path),
        continue: mangleEmptyContinueLabel(path),
      };
      const inner_label_array = [
        ...(hasEmptyContinue(node.body) ? [loop.continue] : EMPTY),
        ...map(labels, mangleContinueLabel),
      ];
      const outer_label_array = [
        ...(hasEmptyBreak(node.body) ? [loop.break] : EMPTY),
        ...map(labels, mangleBreakLabel),
      ];
      return liftSequence_X(
        concatXX,
        makeUndefinedCompletion(path, completion),
        makeControlStatement(
          outer_label_array,
          bindSequence(
            mapSequence(
              setupRegularFrame({ path }, hoistBlock(mode, node.left)),
              (frame) => extendScope(scope, frame),
            ),
            (scope) =>
              liftSequenceXX(
                concatXX,
                unbuildLeftHead(
                  drillSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "left",
                  ),
                  scope,
                  null,
                ),
                incorporatePrefixStatement(
                  liftSequenceX(
                    concat_,
                    bindSequence(
                      callSequence_X_(
                        cacheConstant,
                        forkMeta((meta = nextMeta(meta))),
                        unbuildExpression(
                          drillSite(
                            node,
                            path,
                            forkMeta((meta = nextMeta(meta))),
                            "right",
                          ),
                          scope,
                          null,
                        ),
                        path,
                      ),
                      (iterable) =>
                        bindSequence(
                          cacheConstant(
                            forkMeta((meta = nextMeta(meta))),
                            makeApplyExpression(
                              makeGetExpression(
                                makeReadCacheExpression(iterable, path),
                                makeIntrinsicExpression(
                                  "Symbol.iterator",
                                  path,
                                ),
                                path,
                              ),
                              makeReadCacheExpression(iterable, path),
                              EMPTY,
                              path,
                            ),
                            path,
                          ),
                          (iterator) =>
                            bindSequence(
                              cacheConstant(
                                forkMeta((meta = nextMeta(meta))),
                                makeGetExpression(
                                  makeReadCacheExpression(iterator, path),
                                  makePrimitiveExpression("next", path),
                                  path,
                                ),
                                path,
                              ),
                              (next) =>
                                bindSequence(
                                  cacheWritable(
                                    forkMeta((meta = nextMeta(meta))),
                                    {
                                      type: "primitive",
                                      primitive: { undefined: null },
                                    },
                                    path,
                                  ),
                                  (step) =>
                                    liftSequenceXXX_(
                                      makeTryStatement,
                                      incorporateDeclarationControlBlock(
                                        liftSequence__X_(
                                          makeControlBlock,
                                          EMPTY,
                                          EMPTY,
                                          bindSequence(
                                            liftSequence_X(
                                              extendScope,
                                              scope,
                                              setupRegularFrame(
                                                { path },
                                                hoistBlock(mode, node.left),
                                              ),
                                            ),
                                            (scope) =>
                                              liftSequenceX(
                                                concat_,
                                                liftSequenceXX_(
                                                  makeWhileStatement,
                                                  liftSequenceX__(
                                                    makeSequenceExpression,
                                                    listNextIteratorEffect(
                                                      {
                                                        path,
                                                        meta: forkMeta(
                                                          nextMeta(meta),
                                                        ),
                                                      },
                                                      {
                                                        asynchronous:
                                                          node.await,
                                                        iterator,
                                                        next,
                                                        step,
                                                      },
                                                    ),
                                                    makeUnaryExpression(
                                                      "!",
                                                      makeGetExpression(
                                                        makeReadCacheExpression(
                                                          step,
                                                          path,
                                                        ),
                                                        makePrimitiveExpression(
                                                          "done",
                                                          path,
                                                        ),
                                                        path,
                                                      ),
                                                      path,
                                                    ),
                                                    path,
                                                  ),
                                                  incorporateDeclarationControlBlock(
                                                    liftSequence__X_(
                                                      makeControlBlock,
                                                      EMPTY,
                                                      EMPTY,
                                                      bindSequence(
                                                        liftSequence_X(
                                                          extendScope,
                                                          scope,
                                                          setupRegularFrame(
                                                            { path },
                                                            hoistBlock(
                                                              mode,
                                                              node.left,
                                                            ),
                                                          ),
                                                        ),
                                                        (scope) =>
                                                          incorporatePrefixStatement(
                                                            liftSequenceX(
                                                              concat_,
                                                              bindSequence(
                                                                cacheConstant(
                                                                  forkMeta(
                                                                    (meta =
                                                                      nextMeta(
                                                                        meta,
                                                                      )),
                                                                  ),
                                                                  makeGetExpression(
                                                                    makeReadCacheExpression(
                                                                      step,
                                                                      path,
                                                                    ),
                                                                    makePrimitiveExpression(
                                                                      "value",
                                                                      path,
                                                                    ),
                                                                    path,
                                                                  ),
                                                                  path,
                                                                ),
                                                                (value) =>
                                                                  liftSequenceXX__(
                                                                    makeTryStatement,
                                                                    incorporateDeclarationControlBlock(
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
                                                                                path,
                                                                              },
                                                                              hoistBlock(
                                                                                mode,
                                                                                node.left,
                                                                              ),
                                                                            ),
                                                                          ),
                                                                          (
                                                                            scope,
                                                                          ) =>
                                                                            liftSequenceXX(
                                                                              concatX_,
                                                                              liftSequenceX_(
                                                                                listEffectStatement,
                                                                                unbuildLeftBody(
                                                                                  drillSite(
                                                                                    node,
                                                                                    path,
                                                                                    forkMeta(
                                                                                      (meta =
                                                                                        nextMeta(
                                                                                          meta,
                                                                                        )),
                                                                                    ),
                                                                                    "left",
                                                                                  ),
                                                                                  scope,
                                                                                  {
                                                                                    right:
                                                                                      value,
                                                                                  },
                                                                                ),
                                                                                path,
                                                                              ),
                                                                              liftSequenceX_(
                                                                                makeBlockStatement,
                                                                                incorporateDeclarationControlBlock(
                                                                                  liftSequence__X_(
                                                                                    makeControlBlock,
                                                                                    inner_label_array,
                                                                                    EMPTY,
                                                                                    liftSequence_X(
                                                                                      concatXX,
                                                                                      makeUndefinedCompletion(
                                                                                        path,
                                                                                        completion,
                                                                                      ),
                                                                                      unbuildControlBody(
                                                                                        drillSite(
                                                                                          node,
                                                                                          path,
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
                                                                                          completion,
                                                                                          loop,
                                                                                        },
                                                                                      ),
                                                                                    ),
                                                                                    path,
                                                                                  ),
                                                                                ),
                                                                                path,
                                                                              ),
                                                                            ),
                                                                        ),
                                                                        path,
                                                                      ),
                                                                    ),
                                                                    incorporateDeclarationControlBlock(
                                                                      liftSequence__X_(
                                                                        makeControlBlock,
                                                                        EMPTY,
                                                                        EMPTY,
                                                                        bindSequence(
                                                                          liftSequence_X(
                                                                            extendScope,
                                                                            extendScope(
                                                                              scope,
                                                                              CATCH_FRAME,
                                                                            ),
                                                                            setupRegularFrame(
                                                                              {
                                                                                path,
                                                                              },
                                                                              EMPTY,
                                                                            ),
                                                                          ),
                                                                          (
                                                                            scope,
                                                                          ) =>
                                                                            liftSequenceXX(
                                                                              concat__,
                                                                              liftSequenceX___(
                                                                                makeTryStatement,
                                                                                liftSequence__X_(
                                                                                  makeControlBlock,
                                                                                  EMPTY,
                                                                                  EMPTY,
                                                                                  mapSequence(
                                                                                    liftSequence_X(
                                                                                      extendScope,
                                                                                      scope,
                                                                                      setupRegularFrame(
                                                                                        {
                                                                                          path,
                                                                                        },
                                                                                        EMPTY,
                                                                                      ),
                                                                                    ),
                                                                                    (
                                                                                      _scope,
                                                                                    ) => [
                                                                                      makeEffectStatement(
                                                                                        makeExpressionEffect(
                                                                                          makeApplyExpression(
                                                                                            makeGetExpression(
                                                                                              makeReadCacheExpression(
                                                                                                iterator,
                                                                                                path,
                                                                                              ),
                                                                                              makePrimitiveExpression(
                                                                                                "return",
                                                                                                path,
                                                                                              ),
                                                                                              path,
                                                                                            ),
                                                                                            makeReadCacheExpression(
                                                                                              iterator,
                                                                                              path,
                                                                                            ),
                                                                                            EMPTY,
                                                                                            path,
                                                                                          ),
                                                                                          path,
                                                                                        ),
                                                                                        path,
                                                                                      ),
                                                                                    ],
                                                                                  ),
                                                                                  path,
                                                                                ),
                                                                                makeControlBlock(
                                                                                  EMPTY,
                                                                                  EMPTY,
                                                                                  EMPTY,
                                                                                  path,
                                                                                ),
                                                                                makeControlBlock(
                                                                                  EMPTY,
                                                                                  EMPTY,
                                                                                  EMPTY,
                                                                                  path,
                                                                                ),
                                                                                path,
                                                                              ),
                                                                              liftSequenceX_(
                                                                                makeEffectStatement,
                                                                                liftSequenceX_(
                                                                                  makeExpressionEffect,
                                                                                  liftSequence__X_(
                                                                                    makeApplyExpression,
                                                                                    makeIntrinsicExpression(
                                                                                      "aran.throw",
                                                                                      path,
                                                                                    ),
                                                                                    makePrimitiveExpression(
                                                                                      {
                                                                                        undefined:
                                                                                          null,
                                                                                      },
                                                                                      path,
                                                                                    ),
                                                                                    liftSequenceX(
                                                                                      concat_,
                                                                                      makeScopeLoadExpression(
                                                                                        {
                                                                                          path,
                                                                                          meta: forkMeta(
                                                                                            (meta =
                                                                                              nextMeta(
                                                                                                meta,
                                                                                              )),
                                                                                          ),
                                                                                        },
                                                                                        scope,
                                                                                        {
                                                                                          type: "read-error",
                                                                                          mode,
                                                                                        },
                                                                                      ),
                                                                                    ),
                                                                                    path,
                                                                                  ),
                                                                                  path,
                                                                                ),
                                                                                path,
                                                                              ),
                                                                            ),
                                                                        ),
                                                                        path,
                                                                      ),
                                                                    ),
                                                                    makeControlBlock(
                                                                      EMPTY,
                                                                      EMPTY,
                                                                      EMPTY,
                                                                      path,
                                                                    ),
                                                                    path,
                                                                  ),
                                                              ),
                                                            ),
                                                            path,
                                                          ),
                                                      ),
                                                      path,
                                                    ),
                                                  ),
                                                  path,
                                                ),
                                              ),
                                          ),
                                          path,
                                        ),
                                      ),
                                      incorporateDeclarationControlBlock(
                                        liftSequence__X_(
                                          makeControlBlock,
                                          EMPTY,
                                          EMPTY,
                                          bindSequence(
                                            liftSequence_X(
                                              extendScope,
                                              extendScope(scope, CATCH_FRAME),
                                              setupRegularFrame(
                                                { path },
                                                EMPTY,
                                              ),
                                            ),
                                            (scope) =>
                                              liftSequence_X(
                                                concat__,
                                                makeEffectStatement(
                                                  makeWriteCacheEffect(
                                                    step,
                                                    makeApplyExpression(
                                                      makeIntrinsicExpression(
                                                        "Object.fromEntries",
                                                        path,
                                                      ),
                                                      makePrimitiveExpression(
                                                        { undefined: null },
                                                        path,
                                                      ),
                                                      [
                                                        makeArrayExpression(
                                                          [
                                                            makeArrayExpression(
                                                              [
                                                                makePrimitiveExpression(
                                                                  "done",
                                                                  path,
                                                                ),
                                                                makePrimitiveExpression(
                                                                  true,
                                                                  path,
                                                                ),
                                                              ],
                                                              path,
                                                            ),
                                                            makeArrayExpression(
                                                              [
                                                                makePrimitiveExpression(
                                                                  "value",
                                                                  path,
                                                                ),
                                                                makePrimitiveExpression(
                                                                  {
                                                                    undefined:
                                                                      null,
                                                                  },
                                                                  path,
                                                                ),
                                                              ],
                                                              path,
                                                            ),
                                                          ],
                                                          path,
                                                        ),
                                                      ],
                                                      path,
                                                    ),
                                                    path,
                                                  ),
                                                  path,
                                                ),
                                                liftSequenceX_(
                                                  makeEffectStatement,
                                                  liftSequenceX_(
                                                    makeExpressionEffect,
                                                    liftSequence__X_(
                                                      makeApplyExpression,
                                                      makeIntrinsicExpression(
                                                        "aran.throw",
                                                        path,
                                                      ),
                                                      makePrimitiveExpression(
                                                        {
                                                          undefined: null,
                                                        },
                                                        path,
                                                      ),
                                                      liftSequenceX(
                                                        concat_,
                                                        makeScopeLoadExpression(
                                                          {
                                                            path,
                                                            meta: forkMeta(
                                                              (meta =
                                                                nextMeta(meta)),
                                                            ),
                                                          },
                                                          scope,
                                                          {
                                                            type: "read-error",
                                                            mode,
                                                          },
                                                        ),
                                                      ),
                                                      path,
                                                    ),
                                                    path,
                                                  ),
                                                  path,
                                                ),
                                              ),
                                          ),
                                          path,
                                        ),
                                      ),
                                      incorporateDeclarationControlBlock(
                                        liftSequence__X_(
                                          makeControlBlock,
                                          EMPTY,
                                          EMPTY,
                                          bindSequence(
                                            liftSequence_X(
                                              extendScope,
                                              scope,
                                              setupRegularFrame(
                                                { path },
                                                EMPTY,
                                              ),
                                            ),
                                            (_scope) =>
                                              liftSequenceX_(
                                                listEffectStatement,
                                                listReturnIteratorEffect(
                                                  {
                                                    path,
                                                    meta: forkMeta(
                                                      (meta = nextMeta(meta)),
                                                    ),
                                                  },
                                                  {
                                                    iterator,
                                                    step,
                                                  },
                                                ),
                                                path,
                                              ),
                                          ),
                                          path,
                                        ),
                                      ),
                                      path,
                                    ),
                                ),
                            ),
                        ),
                    ),
                  ),
                  path,
                ),
              ),
          ),
          path,
        ),
      );
    }
    case "SwitchStatement": {
      const remainder = listSwitchRemainder({
        node,
        path,
        meta: forkMeta((meta = nextMeta(meta))),
      });
      const child_loop = {
        break: mangleEmptyBreakLabel(path),
        continue: loop.continue,
      };
      const outer_label_array = [
        ...(remainder.length > 0 || some(node.cases, hasEmptyBreak)
          ? [mangleEmptyBreakLabel(path)]
          : EMPTY),
        ...map(labels, mangleBreakLabel),
      ];
      const mode = getMode(scope);
      return liftSequence_X(
        concatXX,
        makeUndefinedCompletion(path, completion),
        incorporatePrefixStatement(
          bindSequence(
            callSequence_X_(
              cacheConstant,
              forkMeta((meta = nextMeta(meta))),
              unbuildExpression(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "discriminant",
                ),
                scope,
                null,
              ),
              path,
            ),
            (discriminant) =>
              makeControlStatement(
                outer_label_array,
                bindSequence(
                  liftSequence_X(
                    extendScope,
                    scope,
                    setupRegularFrame(
                      { path },
                      flatMap(flatMap(node.cases, getConsequent), (node) =>
                        hoistBlock(mode, node),
                      ),
                    ),
                  ),
                  (scope) =>
                    bindSequence(
                      cacheWritable(
                        forkMeta((meta = nextMeta(meta))),
                        { type: "primitive", primitive: false },
                        path,
                      ),
                      (matched) =>
                        liftSequenceXXX(
                          concatXXX,
                          liftSequenceX(
                            flat,
                            flatSequence(
                              mapIndex(node.cases.length, (index) =>
                                unbuildHoistedStatement(
                                  drillDeepSite(
                                    node,
                                    path,
                                    forkMeta((meta = nextMeta(meta))),
                                    "cases",
                                    index,
                                  ),
                                  scope,
                                  {
                                    parent: "block",
                                  },
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
                                    path,
                                    forkMeta((meta = nextMeta(meta))),
                                    "cases",
                                    index,
                                  ),
                                  scope,
                                  {
                                    last: index === node.cases.length - 1,
                                    discriminant,
                                    loop: child_loop,
                                    matched,
                                    completion,
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
                                  makeReadCacheExpression(matched, path),
                                  makeControlBlock(EMPTY, EMPTY, EMPTY, path),
                                  incorporateDeclarationControlBlock(
                                    liftSequence__X_(
                                      makeControlBlock,
                                      EMPTY,
                                      EMPTY,
                                      bindSequence(
                                        // TODO: verify this is correct
                                        zeroSequence(scope),
                                        // mapSequence(
                                        //   setupRegularFrame(
                                        //     { path },
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
                                                unbuildStatement(site, scope, {
                                                  labels: EMPTY,
                                                  completion,
                                                  loop: child_loop,
                                                }),
                                              ),
                                            ),
                                          ),
                                      ),
                                      path,
                                    ),
                                  ),
                                  path,
                                ),
                              ),
                        ),
                    ),
                ),
                path,
              ),
          ),
          path,
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
 *   sites: import("../site").Site<(
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )>[],
 *   scope: import("../scope").Scope,
 *   options: {
 *     parent: "block" | "closure" | "program";
 *     labels: [],
 *     completion: import("../completion").StatementCompletion,
 *     loop: {
 *       break: null | unbuild.Label,
 *       continue: null | unbuild.Label,
 *     },
 *   },
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Statement<unbuild.Atom>[],
 * >}
 */
export const unbuildBody = (sites, scope, options) => {
  const [sites1, sites2] = unzip(map(sites, duplicateSite));
  return liftSequenceXX(
    concatXX,
    liftSequenceX(
      flat,
      flatSequence(
        map(sites1, (site) => unbuildHoistedStatement(site, scope, options)),
      ),
    ),
    liftSequenceX(
      flat,
      flatSequence(
        map(sites2, (site) => unbuildStatement(site, scope, options)),
      ),
    ),
  );
};
