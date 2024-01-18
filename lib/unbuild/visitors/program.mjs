import {
  hasTaggedTemplate,
  hoistBlock,
  hoistClosure,
  hoistExport,
  hoistImport,
  listModuleHeader,
} from "../query/index.mjs";
import { flatMap, guard, map, slice } from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import {
  makeProgram,
  makePrimitiveExpression,
  makeClosureBlock,
  makeClosureBody,
  concatEffect,
} from "../node.mjs";
import { unbuildExpression } from "./expression.mjs";
import { listBodyStatement } from "./statement.mjs";
import { cacheWritable, makeReadCacheExpression } from "../cache.mjs";
import {
  bindSequence,
  initSequence,
  mapSequence,
  mapTwoSequence,
  prependSequence,
  zeroSequence,
} from "../sequence.mjs";
import { drillSite, drillSiteArray } from "../site.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  extendScope,
  setupRootFrame,
  setupRegularFrame,
  setupTemplateFrame,
  makeRootScope,
  listScopeSaveEffect,
  unpackScope,
} from "../scope/index.mjs";
import { makeEffectPrelude, makeHeaderPrelude } from "../prelude.mjs";

/**
 * @type {(
 *   sites: import("../site").Site<(
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )[]>,
 * ) => {
 *   body: import("../site").Site<(
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )[]>,
 *   tail: null | import("../site").Site<estree.Expression>,
 * }}
 */
const extractCompletion = ({ node: nodes, path, meta }) => {
  if (nodes.length === 0) {
    return {
      body: { node: nodes, path, meta },
      tail: null,
    };
  } else {
    const meta0 = meta;
    const meta1 = nextMeta(meta0);
    const meta2 = nextMeta(meta1);
    const last = drillSite(nodes, path, forkMeta(meta1), nodes.length - 1);
    if (last.node.type === "ExpressionStatement") {
      return {
        body: {
          node: slice(nodes, 0, nodes.length - 1),
          path,
          meta: forkMeta(meta2),
        },
        tail: drillSite(last.node, last.path, last.meta, "expression"),
      };
    } else {
      return {
        body: { node: nodes, path, meta },
        tail: null,
      };
    }
  }
};

/**
 * @type {(
 *   site: import("../site").Site<estree.Program>,
 *   context: import("../../context").Context,
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../scope").Scope
 * >}
 */
const setupScope = ({ node, path, meta }, context) => {
  const hoisting = {
    closure: flatMap(node.body, (node) => hoistClosure(context.mode, node)),
    block: flatMap(node.body, (node) => hoistBlock(context.mode, node)),
  };
  if (context.source === "module") {
    return mapTwoSequence(
      mapSequence(setupRootFrame({ path, meta }, context, []), makeRootScope),
      setupRegularFrame({ path }, [
        ...hoisting.closure,
        ...hoisting.block,
        ...flatMap(node.body, hoistImport),
        ...flatMap(node.body, hoistExport),
      ]),
      extendScope,
    );
  } else if (context.source === "script") {
    return mapSequence(
      setupRootFrame({ path, meta }, context, [
        ...hoisting.closure,
        ...hoisting.block,
      ]),
      makeRootScope,
    );
  } else if (
    context.source === "global-eval" ||
    context.source === "local-eval"
  ) {
    if (context.mode === "strict") {
      return mapTwoSequence(
        mapSequence(setupRootFrame({ path, meta }, context, []), makeRootScope),
        setupRegularFrame({ path }, [...hoisting.closure, ...hoisting.block]),
        extendScope,
      );
    } else if (context.mode === "sloppy") {
      return mapTwoSequence(
        mapSequence(
          setupRootFrame({ path, meta }, context, hoisting.closure),
          makeRootScope,
        ),
        setupRegularFrame({ path }, hoisting.block),
        extendScope,
      );
    } else {
      throw new AranTypeError(context.mode);
    }
  } else if (context.source === "aran-eval") {
    if (context.mode === "strict") {
      return mapSequence(
        setupRegularFrame({ path }, [...hoisting.closure, ...hoisting.block]),
        (frame) =>
          extendScope(
            extendScope(unpackScope(context.scope), {
              type: "mode-use-strict",
            }),
            frame,
          ),
      );
    } else if (context.mode === "sloppy") {
      return bindSequence(
        mapSequence(setupRegularFrame({ path }, hoisting.block), (frame) =>
          extendScope(unpackScope(context.scope), frame),
        ),
        (scope) =>
          bindSequence(
            concatEffect(
              map(hoisting.closure, (hoist) =>
                listScopeSaveEffect(
                  {
                    path,
                    meta: forkMeta((meta = nextMeta(meta))),
                  },
                  scope,
                  {
                    type: "declare",
                    mode: context.mode,
                    kind: "eval",
                    variable: hoist.variable,
                  },
                ),
              ),
            ),
            (nodes) => initSequence(map(nodes, makeEffectPrelude), scope),
          ),
      );
    } else {
      throw new AranTypeError(context.mode);
    }
  } else {
    throw new AranTypeError(context);
  }
};

/**
 * @type {(
 *   site: import("../site").Site<estree.Program>,
 *   context: import("../../context").Context,
 * ) => import("../sequence").ProgramSequence}
 */
export const unbuildProgram = ({ node, path, meta }, context) => {
  const { body, tail } = extractCompletion(
    drillSite(node, path, forkMeta((meta = nextMeta(meta))), "body"),
  );
  return makeProgram(
    context.source,
    context.mode,
    prependSequence(
      map(flatMap(node.body, listModuleHeader), makeHeaderPrelude),
      makeClosureBlock(
        bindSequence(
          guard(
            hasTaggedTemplate(node),
            (scope_sequence) =>
              mapTwoSequence(
                scope_sequence,
                setupTemplateFrame({
                  path,
                  meta: forkMeta((meta = nextMeta(meta))),
                }),
                extendScope,
              ),
            setupScope(
              { node, path, meta: forkMeta((meta = nextMeta(meta))) },
              context,
            ),
          ),
          (scope) =>
            bindSequence(
              context.source === "module" || tail !== null
                ? cacheWritable(
                    forkMeta((meta = nextMeta(meta))),
                    makePrimitiveExpression({ undefined: null }, path),
                    path,
                  )
                : zeroSequence(null),
              (completion) =>
                makeClosureBody(
                  listBodyStatement(drillSiteArray(body), scope, {
                    parent: "program",
                    labels: [],
                    completion:
                      completion === null
                        ? null
                        : {
                            cache: completion,
                            root: node,
                          },
                    loop: {
                      break: null,
                      continue: null,
                    },
                  }),
                  tail !== null
                    ? unbuildExpression(tail, scope, null)
                    : completion !== null
                    ? makeReadCacheExpression(completion, path)
                    : makePrimitiveExpression({ undefined: null }, path),
                ),
            ),
        ),
        path,
      ),
    ),
    path,
  );
};
