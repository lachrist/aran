import {
  hoistBlock,
  hoistClosure,
  hoistExport,
  hoistImport,
} from "../query/index.mjs";
import { flat, flatMap, map, slice } from "../../util/index.mjs";
import { AranError, AranSyntaxError, AranTypeError } from "../../error.mjs";
import {
  makeProgram,
  makePrimitiveExpression,
  makeClosureBlock,
} from "../node.mjs";
import { unbuildBody } from "./statement.mjs";
import { cacheWritable, makeReadCacheExpression } from "../cache.mjs";
import {
  bindSequence,
  flatSequence,
  initSequence,
  liftSequenceX,
  liftSequenceXX,
  liftSequence_X,
  liftSequence_XX_,
  liftSequence__X_,
  mapSequence,
  zeroSequence,
} from "../sequence.mjs";
import { drillSite, drillSiteArray } from "../site.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  extendScope,
  setupRegularFrame,
  makeRootScope,
  listScopeSaveEffect,
  getMode,
  setupRootFrame,
  setupModuleFrame,
} from "../scope/index.mjs";
import { makePrefixPrelude } from "../prelude.mjs";
import {
  isExternalLocalEvalSort,
  isGlobalEvalSort,
  isModuleSort,
  isNodeSort,
  isScriptSort,
} from "../../sort.mjs";
import { VOID_COMPLETION } from "../completion.mjs";
import { unbuildExpression } from "./expression.mjs";
import { makeThrowErrorExpression } from "../intrinsic.mjs";
import { incorporatePrefixClosureBlock } from "../prefix.mjs";
import { incorporateTemplateProgram } from "../template.mjs";
import { incorporateHeaderProgram } from "../header.mjs";
import { incorporateEarlyErrorProgram } from "../early-error.mjs";
import { incorporateDeclarationClosureBlock } from "../declaration.mjs";

/**
 * @type {(
 *   site: import("../site").Site<estree.Program>,
 * ) => import("../sequence").Sequence<
 *   (
 *     | import("../prelude").MetaDeclarationPrelude
 *     | import("../prelude").PrefixPrelude
 *   ),
 *   {
 *     body: import("../site").Site<(
 *       | estree.Directive
 *       | estree.Statement
 *       | estree.ModuleDeclaration
 *     )>[],
 *     completion: import("../completion").Completion,
 *   }
 * >}
 */
const extractCompletion = ({ node: root, path, meta }) => {
  const body = drillSiteArray(drillSite(root, path, meta, "body"));
  switch (root.sourceType) {
    case "module": {
      return zeroSequence({
        body,
        completion: {
          type: "void",
        },
      });
    }
    case "script": {
      if (body.length === 0) {
        return zeroSequence({
          body,
          completion: VOID_COMPLETION,
        });
      } else {
        const { node, path, meta } = body[body.length - 1];
        if (node.type === "ExpressionStatement") {
          return zeroSequence({
            body: slice(body, 0, body.length - 1),
            completion: {
              type: "direct",
              site: drillSite(node, path, meta, "expression"),
            },
          });
        } else {
          const meta0 = forkMeta(meta);
          const meta1 = nextMeta(meta0);
          const meta2 = nextMeta(meta1);
          return mapSequence(
            cacheWritable(
              forkMeta(meta1),
              {
                type: "primitive",
                primitive: { undefined: null },
              },
              path,
            ),
            (cache) => ({
              body: [
                ...slice(body, 0, body.length - 1),
                {
                  node,
                  path,
                  meta: forkMeta(meta2),
                },
              ],
              completion: {
                type: "indirect",
                root,
                cache,
              },
            }),
          );
        }
      }
    }
    default: {
      throw new AranTypeError(root.sourceType);
    }
  }
};

/**
 * @type {(
 *   node: estree.Program | import("../../program").EarlySyntaxError,
 * ) => estree.Node[]}
 */
const getProgramBody = (node) => {
  switch (node.type) {
    case "Program": {
      return node.body;
    }
    case "EarlySyntaxError": {
      return [];
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.Program
 *     | import("../../program").EarlySyntaxError
 *   )>,
 *   scope: null | import("../scope").Scope,
 *   options: {
 *     sort: import("../../sort").Sort,
 *     global_declarative_record: "native" | "emulate",
 *   },
 * ) => import("../sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *   ),
 *   import("../scope").Scope
 * >}
 */
const setupScope = (
  { node, path, meta },
  scope,
  { sort, global_declarative_record },
) => {
  if (scope === null) {
    const hoisting = {
      closure: flatMap(getProgramBody(node), (node) =>
        hoistClosure(sort.mode, node),
      ),
      block: flatMap(getProgramBody(node), (node) =>
        hoistBlock(sort.mode, node),
      ),
    };
    if (isModuleSort(sort)) {
      return liftSequenceXX(
        extendScope,
        mapSequence(
          setupRootFrame(
            { path, meta },
            { global_declarative_record, sort, hoisting: [] },
          ),
          makeRootScope,
        ),
        setupModuleFrame({ path }, [
          ...hoisting.closure,
          ...hoisting.block,
          ...flatMap(getProgramBody(node), hoistImport),
          ...flatMap(getProgramBody(node), hoistExport),
        ]),
      );
    } else if (isScriptSort(sort)) {
      return liftSequenceX(
        makeRootScope,
        setupRootFrame(
          { path, meta },
          {
            global_declarative_record,
            sort,
            hoisting: [...hoisting.closure, ...hoisting.block],
          },
        ),
      );
    } else if (isGlobalEvalSort(sort) || isExternalLocalEvalSort(sort)) {
      if (sort.mode === "strict") {
        return liftSequenceXX(
          extendScope,
          liftSequenceX(
            makeRootScope,
            setupRootFrame(
              { path, meta },
              { global_declarative_record, sort, hoisting: [] },
            ),
          ),
          setupRegularFrame({ path }, [...hoisting.closure, ...hoisting.block]),
        );
      } else if (sort.mode === "sloppy") {
        return liftSequenceXX(
          extendScope,
          liftSequenceX(
            makeRootScope,
            setupRootFrame(
              { path, meta },
              { global_declarative_record, sort, hoisting: hoisting.closure },
            ),
          ),
          setupRegularFrame({ path }, hoisting.block),
        );
      } else {
        throw new AranTypeError(sort.mode);
      }
    } else if (isNodeSort(sort)) {
      throw new AranError("program sort and scope mismatch", sort);
    } else {
      throw new AranTypeError(sort);
    }
  } else {
    if (isNodeSort(sort)) {
      const mode = getMode(scope);
      const hoisting = {
        closure: flatMap(getProgramBody(node), (node) =>
          hoistClosure(mode, node),
        ),
        block: flatMap(getProgramBody(node), (node) => hoistBlock(mode, node)),
      };
      if (mode === "strict") {
        return liftSequence_X(
          extendScope,
          scope,
          setupRegularFrame({ path }, [...hoisting.closure, ...hoisting.block]),
        );
      } else if (mode === "sloppy") {
        return bindSequence(
          liftSequence_X(
            extendScope,
            scope,
            setupRegularFrame({ path }, hoisting.block),
          ),
          (scope) =>
            bindSequence(
              liftSequenceX(
                flat,
                flatSequence(
                  map(hoisting.closure, (hoist) =>
                    listScopeSaveEffect(
                      {
                        path,
                        meta: forkMeta((meta = nextMeta(meta))),
                      },
                      scope,
                      {
                        type: "declare",
                        mode,
                        kind: "eval",
                        variable: hoist.variable,
                        configurable: true,
                      },
                    ),
                  ),
                ),
              ),
              (nodes) => initSequence(map(nodes, makePrefixPrelude), scope),
            ),
        );
      } else {
        throw new AranTypeError(mode);
      }
    } else {
      throw new AranError("program sort and scope mismatch", sort);
    }
  }
};

/**
 * @type {(
 *   site: import("../site").VoidSite,
 *   scope: import("../scope").Scope,
 *   completion: import("../completion").Completion,
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const unbuildCompletion = ({ path }, scope, completion) => {
  switch (completion.type) {
    case "void": {
      return zeroSequence(makePrimitiveExpression({ undefined: null }, path));
    }
    case "indirect": {
      return zeroSequence(makeReadCacheExpression(completion.cache, path));
    }
    case "direct": {
      return unbuildExpression(completion.site, scope, null);
    }
    default: {
      throw new AranTypeError(completion);
    }
  }
};

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.Program
 *     | import("../../program").EarlySyntaxError
 *   )>,
 *   scope: null | import("../scope").Scope,
 *   options: {
 *     sort: import("../../sort").Sort,
 *     early_syntax_error: "embed" | "throw",
 *     global_declarative_record: "native" | "emulate",
 *   },
 * ) => import("../sequence").Sequence<
 *   import("../prelude").ProgramPrelude,
 *   aran.Program<unbuild.Atom>,
 * >}
 */
export const unbuildProgram = (
  { node, path, meta },
  scope,
  { sort, early_syntax_error, global_declarative_record },
) => {
  switch (node.type) {
    case "Program": {
      return incorporateHeaderProgram(
        incorporateEarlyErrorProgram(
          incorporateTemplateProgram(
            liftSequence__X_(
              makeProgram,
              sort,
              [],
              incorporateDeclarationClosureBlock(
                incorporatePrefixClosureBlock(
                  bindSequence(
                    setupScope(
                      { node, path, meta: forkMeta((meta = nextMeta(meta))) },
                      scope,
                      { sort, global_declarative_record },
                    ),
                    (scope) =>
                      bindSequence(
                        extractCompletion({ node, path, meta }),
                        ({ body, completion }) =>
                          liftSequence_XX_(
                            makeClosureBlock,
                            [],
                            unbuildBody(body, scope, {
                              parent: "program",
                              labels: [],
                              completion:
                                completion.type === "direct"
                                  ? VOID_COMPLETION
                                  : completion,
                              loop: {
                                break: null,
                                continue: null,
                              },
                            }),
                            unbuildCompletion({ path }, scope, completion),
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
          { root: node, early_syntax_error },
        ),
      );
    }
    case "EarlySyntaxError": {
      switch (early_syntax_error) {
        case "embed": {
          return zeroSequence(
            makeProgram(
              sort,
              [],
              makeClosureBlock(
                [],
                [],
                makeThrowErrorExpression("SyntaxError", node.message, path),
                path,
              ),
              path,
            ),
          );
        }
        case "throw": {
          throw new AranSyntaxError(node.message);
        }
        default: {
          throw new AranTypeError(early_syntax_error);
        }
      }
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
