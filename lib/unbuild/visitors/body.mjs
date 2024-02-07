import {
  hasDirectEvalCall,
  hoistBlock,
  hoistClosure,
} from "../query/index.mjs";
import {
  extendScope,
  getMode,
  listScopeSaveEffect,
  makeScopeLoadExpression,
  setupEvalFrame,
  setupRegularFrame,
} from "../scope/index.mjs";
import { unbuildBody } from "./statement.mjs";
import { filter, flatMap, includes, map, some } from "../../util/index.mjs";
import {
  bindSequence,
  flatSequence,
  mapSequence,
  mapTwoSequence,
  sequenceStatement,
  zeroSequence,
} from "../sequence.mjs";
import {
  cacheConstant,
  listWriteCacheEffect,
  makeReadCacheExpression,
} from "../cache.mjs";
import {
  concatEffect,
  concatStatement,
  makeBlockStatement,
  makeControlBlock,
  makeControlBody,
  makeEffectStatement,
  makePrimitiveExpression,
} from "../node.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { drillSite, drillSiteArray } from "../site.mjs";
import { VOID_COMPLETION, isIndirectCompletion } from "../completion.mjs";
import { AranTypeError } from "../../error.mjs";

/**
 * @type {(
 *   site: import("../site").Site<estree.BlockStatement>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     parameters: estree.Variable[],
 *   },
 * ) => import("../sequence").StatementSequence}
 */
export const unbuildClosureBody = (
  { node, path, meta },
  scope,
  { parameters },
) => {
  const mode = getMode(scope);
  const dynamic = mode === "sloppy" && some(node.body, hasDirectEvalCall);
  const hoisting1 = flatMap(node.body, (node) => hoistClosure(mode, node));
  const hoisting2 = flatMap(node.body, (node) => hoistBlock(mode, node));
  if (hoisting1.length === 0 && hoisting2.length === 0) {
    return bindSequence(
      dynamic
        ? mapTwoSequence(
            zeroSequence(scope),
            setupEvalFrame({ path, meta: forkMeta((meta = nextMeta(meta))) }),
            extendScope,
          )
        : zeroSequence(scope),
      (scope) =>
        unbuildBody(
          drillSiteArray(drillSite(node, path, meta, "body")),
          scope,
          {
            parent: "closure",
            labels: [],
            completion: VOID_COMPLETION,
            loop: {
              break: null,
              continue: null,
            },
          },
        ),
    );
  } else {
    return sequenceStatement(
      bindSequence(
        flatSequence(
          map(
            filter(hoisting1, ({ variable }) => includes(parameters, variable)),
            ({ variable, kind }) =>
              mapSequence(
                cacheConstant(
                  forkMeta((meta = nextMeta(meta))),
                  makeScopeLoadExpression(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    scope,
                    { type: "read", mode: getMode(scope), variable },
                  ),
                  path,
                ),
                (cache) =>
                  /** @type {import("../scope/operation").InitializeOperation} */ ({
                    type: "initialize",
                    mode,
                    kind,
                    variable,
                    right: makeReadCacheExpression(cache, path),
                  }),
              ),
          ),
        ),
        (operations) =>
          makeBlockStatement(
            makeControlBlock(
              [],
              bindSequence(
                mapTwoSequence(
                  dynamic
                    ? mapTwoSequence(
                        zeroSequence(scope),
                        setupEvalFrame({
                          path,
                          meta: forkMeta((meta = nextMeta(meta))),
                        }),
                        extendScope,
                      )
                    : zeroSequence(scope),
                  setupRegularFrame({ path }, [...hoisting1, ...hoisting2]),
                  extendScope,
                ),
                (scope) =>
                  makeControlBody(
                    concatStatement([
                      makeEffectStatement(
                        concatEffect(
                          map(operations, (operation) =>
                            listScopeSaveEffect(
                              { path, meta },
                              scope,
                              operation,
                            ),
                          ),
                        ),
                        path,
                      ),
                      unbuildBody(
                        drillSiteArray(drillSite(node, path, meta, "body")),
                        scope,
                        {
                          parent: "closure",
                          labels: [],
                          completion: VOID_COMPLETION,
                          loop: {
                            break: null,
                            continue: null,
                          },
                        },
                      ),
                    ]),
                  ),
              ),
              path,
            ),
            path,
          ),
      ),
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
 *   site: import("../site").Site<estree.Statement>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     labels: unbuild.Label[],
 *     completion: import("../completion").StatementCompletion
 *     loop: {
 *       break: null | unbuild.Label,
 *       continue: null | unbuild.Label,
 *     },
 *   },
 * ) => import("../sequence").ControlBlockSequence}
 */
export const unbuildControlBody = (
  { node, path, meta },
  scope,
  { labels, completion, loop },
) => {
  const mode = getMode(scope);
  return makeControlBlock(
    labels,
    bindSequence(
      mapSequence(
        setupRegularFrame(
          { path },
          node.type === "BlockStatement"
            ? flatMap(node.body, (node) => hoistBlock(mode, node))
            : hoistBlock(mode, node),
        ),
        (frame) => extendScope(scope, frame),
      ),
      (scope) =>
        makeControlBody(
          unbuildBody(
            node.type === "BlockStatement"
              ? drillSiteArray(drillSite(node, path, meta, "body"))
              : [{ node, path, meta }],
            scope,
            {
              parent: "block",
              labels: [],
              completion,
              loop,
            },
          ),
        ),
    ),
    path,
  );
};

/**
 * @type {(
 *   site: import("../site").Site<estree.BlockStatement>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     labels: unbuild.Label[],
 *     completion: import("../completion").StatementCompletion
 *     loop: {
 *       break: null | unbuild.Label,
 *       continue: null | unbuild.Label,
 *     },
 *   },
 * ) => import("../sequence").ControlBlockSequence}
 */
export const unbuildFinallyBody = (
  { node, path, meta },
  scope,
  { labels, completion, loop },
) => {
  if (isIndirectCompletion(completion) && hasAbrupt(node, [])) {
    const mode = getMode(scope);
    return makeControlBlock(
      labels,
      bindSequence(
        mapSequence(
          setupRegularFrame(
            { path },
            flatMap(node.body, (node) => hoistBlock(mode, node)),
          ),
          (frame) => extendScope(scope, frame),
        ),
        (scope) =>
          bindSequence(
            cacheConstant(
              forkMeta((meta = nextMeta(meta))),
              makeReadCacheExpression(completion.cache, path),
              path,
            ),
            (cache) =>
              makeControlBody(
                concatStatement([
                  makeEffectStatement(
                    listWriteCacheEffect(
                      completion.cache,
                      makePrimitiveExpression({ undefined: null }, path),
                      path,
                    ),
                    path,
                  ),
                  unbuildBody(
                    drillSiteArray(drillSite(node, path, meta, "body")),
                    scope,
                    {
                      parent: "block",
                      labels: [],
                      completion,
                      loop,
                    },
                  ),
                  makeEffectStatement(
                    listWriteCacheEffect(
                      completion.cache,
                      makeReadCacheExpression(cache, path),
                      path,
                    ),
                    path,
                  ),
                ]),
              ),
          ),
      ),
      path,
    );
  } else {
    return unbuildControlBody({ node, path, meta }, scope, {
      labels,
      completion: VOID_COMPLETION,
      loop,
    });
  }
};
