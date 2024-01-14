import {
  hoistBlock,
  hoistClosure,
  hoistExport,
  hoistImport,
  isDeadzoneHoist,
  isLifespanHoist,
  listModuleHeader,
} from "../query/index.mjs";
import {
  filterNarrow,
  flatMap,
  map,
  reduce,
  slice,
} from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import {
  makeProgram,
  makePrimitiveExpression,
  makeClosureBlock,
  makeClosureBody,
} from "../node.mjs";
import { unbuildExpression } from "./expression.mjs";
import { listBodyStatement } from "./statement.mjs";
import { cacheWritable, makeReadCacheExpression } from "../cache.mjs";
import {
  bindSequence,
  flatSequence,
  mapSequence,
  mapTwoSequence,
  prependSequence,
  zeroSequence,
} from "../sequence.mjs";
import { drillSite } from "../site.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  extendScope,
  setupGlobalObjectFrame,
  setupGlobalRecordFrame,
  setupExternalFrame,
  setupRegularFrame,
  updateScope,
  setupTemplateFrame,
} from "../scope/index.mjs";
import { makeHeaderPrelude } from "../prelude.mjs";

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
 *   scope: import("../scope").Scope,
 *   frames: import("../sequence").Sequence<
 *     import("../prelude").BodyPrelude,
 *     import("../scope").NodeFrame
 *   >[],
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../scope").Scope
 * >}
 */
const reduceFrame = (scope, sequences) =>
  mapSequence(flatSequence(sequences), (frames) =>
    reduce(frames, extendScope, scope),
  );

/**
 * @type {(
 *   site: import("../site").Site<estree.Program>,
 *   scope: import("../scope").Scope,
 *   context: import("../../context").Context,
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../scope").Scope
 * >}
 */
const setupScope = ({ node, path, meta }, scope, context) => {
  const { mode } = context;
  const hoisting = [
    ...flatMap(node.body, (node) => hoistClosure(mode, node)),
    ...flatMap(node.body, (node) => hoistBlock(mode, node)),
  ];
  if (context.source === "module") {
    const module_hoisting = [
      ...hoisting,
      ...flatMap(node.body, hoistImport),
      ...flatMap(node.body, hoistExport),
    ];
    if (context.scope === "reify") {
      return reduceFrame(scope, [
        setupGlobalObjectFrame({ path }, []),
        setupGlobalRecordFrame({ path }, []),
        setupRegularFrame({ path }, module_hoisting),
      ]);
    } else if (context.scope === "alien") {
      return reduceFrame(scope, [
        setupExternalFrame({ path, meta }, [], { mode }),
        setupRegularFrame({ path }, module_hoisting),
      ]);
    } else {
      throw new AranTypeError(context.scope);
    }
  } else if (context.source === "script") {
    if (context.scope === "reify") {
      return reduceFrame(scope, [
        setupGlobalObjectFrame(
          { path },
          filterNarrow(hoisting, isLifespanHoist),
        ),
        setupGlobalRecordFrame(
          { path },
          filterNarrow(hoisting, isDeadzoneHoist),
        ),
      ]);
    } else if (context.scope === "alien") {
      return reduceFrame(scope, [
        setupExternalFrame({ path, meta }, hoisting, { mode }),
      ]);
    } else {
      throw new AranTypeError(context.scope);
    }
  } else if (context.source === "global-eval") {
    if (mode === "strict") {
      if (context.scope === "reify") {
        return reduceFrame(scope, [
          setupGlobalObjectFrame({ path }, []),
          setupGlobalRecordFrame({ path }, []),
          setupRegularFrame({ path }, hoisting),
        ]);
      } else if (context.scope === "alien") {
        return reduceFrame(scope, [
          setupExternalFrame({ path, meta }, [], { mode }),
          setupRegularFrame({ path }, hoisting),
        ]);
      } else {
        throw new AranTypeError(context.scope);
      }
    } else if (mode === "sloppy") {
      if (context.scope === "reify") {
        return reduceFrame(scope, [
          setupGlobalObjectFrame(
            { path },
            filterNarrow(hoisting, isLifespanHoist),
          ),
          setupGlobalRecordFrame({ path }, []),
          setupRegularFrame({ path }, filterNarrow(hoisting, isDeadzoneHoist)),
        ]);
      } else if (context.scope === "alien") {
        return reduceFrame(scope, [
          setupExternalFrame(
            { path, meta },
            filterNarrow(hoisting, isLifespanHoist),
            { mode },
          ),
          setupRegularFrame({ path }, filterNarrow(hoisting, isDeadzoneHoist)),
        ]);
      } else {
        throw new AranTypeError(context.scope);
      }
    } else {
      throw new AranTypeError(mode);
    }
  } else if (context.source === "local-eval") {
    if (mode === "strict") {
      return reduceFrame(scope, [setupRegularFrame({ path }, hoisting)]);
    } else if (mode === "sloppy") {
      return reduceFrame(scope, [
        setupExternalFrame(
          { path, meta },
          filterNarrow(hoisting, isLifespanHoist),
          { mode },
        ),
        setupRegularFrame({ path }, filterNarrow(hoisting, isDeadzoneHoist)),
      ]);
    } else {
      throw new AranTypeError(mode);
    }
  } else if (context.source === "aran-eval") {
    if (mode === "strict") {
      return reduceFrame(scope, [setupRegularFrame({ path }, hoisting)]);
    } else if (mode === "sloppy") {
      return bindSequence(
        updateScope({ path }, scope, filterNarrow(hoisting, isLifespanHoist), {
          mode,
        }),
        (scope) =>
          reduceFrame(scope, [
            setupRegularFrame(
              { path },
              filterNarrow(hoisting, isDeadzoneHoist),
            ),
          ]),
      );
    } else {
      throw new AranTypeError(mode);
    }
  } else {
    throw new AranTypeError(context);
  }
};

/**
 * @type {(
 *   site: import("../site").Site<estree.Program>,
 *   scope: import("../scope").Scope,
 *   context: import("../../context").Context,
 * ) => import("../sequence").ProgramSequence}
 */
export const unbuildProgram = ({ node, path, meta }, scope, context) => {
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
          mapTwoSequence(
            setupScope(
              { node, path, meta: forkMeta((meta = nextMeta(meta))) },
              scope,
              context,
            ),
            setupTemplateFrame({
              path,
              meta: forkMeta((meta = nextMeta(meta))),
            }),
            extendScope,
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
                  listBodyStatement(body, scope, {
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
