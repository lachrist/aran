import {
  recordCompletion,
  hoist,
  listBinding,
  listLink,
  toModuleHeader,
} from "../query/index.mjs";
import { concatX_, flat, map, slice } from "../../util/index.mjs";
import { AranError, AranSyntaxError, AranTypeError } from "../../error.mjs";
import {
  makeProgram,
  makeRoutineBlock,
  makeIntrinsicExpression,
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
  liftSequence__XX_,
  liftSequence___X_,
  mapSequence,
  prependSequence,
  zeroSequence,
} from "../../sequence.mjs";
import { drillSite, drillSiteArray } from "../site.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  extendScope,
  setupRegularFrame,
  makeRootScope,
  listScopeSaveEffect,
  getMode,
  setupRootFrame,
  setupProgramFrame,
} from "../scope/index.mjs";
import { makeEarlyErrorPrelude, makePrefixPrelude } from "../prelude.mjs";
import { unbuildExpression } from "./expression.mjs";
import { makeThrowErrorExpression } from "../intrinsic.mjs";
import { incorporatePrefixRoutineBlock } from "../prefix.mjs";
import { incorporateTemplateProgram } from "../template.mjs";
import { incorporateHeaderProgram } from "../header.mjs";
import {
  incorporateEarlyErrorProgram,
  toStaticDuplicateEarlyError,
} from "../early-error.mjs";
import { incorporateDeclarationRoutineBlock } from "../declaration.mjs";
import { getSortKind, getSortSitu } from "../sort.mjs";
import { VOID_COMPLETION } from "../completion.mjs";

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").Program>,
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../prelude").MetaDeclarationPrelude
 *     | import("../prelude").PrefixPrelude
 *   ),
 *   {
 *     body: import("../site").Site<(
 *       | import("../../estree").Directive
 *       | import("../../estree").Statement
 *       | import("../../estree").ModuleDeclaration
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
        const head = slice(body, 0, body.length - 1);
        const tail = body[body.length - 1];
        if (tail.node.type === "ExpressionStatement") {
          return zeroSequence({
            body: head,
            completion: {
              type: "direct",
              site: drillSite(tail.node, tail.path, tail.meta, "expression"),
            },
          });
        } else {
          const meta0 = forkMeta(tail.meta);
          const meta1 = nextMeta(meta0);
          const meta2 = nextMeta(meta1);
          return mapSequence(cacheWritable(meta2, "undefined"), (cache) => ({
            body: concatX_(head, {
              node: tail.node,
              path: tail.path,
              meta: meta1,
            }),
            completion: {
              type: "indirect",
              record: recordCompletion(root, path),
              root,
              cache,
            },
          }));
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
 *   binding: import("../query/hoist-public").Binding,
 *   mode: "strict" | "sloppy",
 * ) => import("../scope/operation").LateDeclareOperation}
 */
const toLateDeclareOperation = (binding, mode) => {
  if (binding.baseline === "import") {
    throw new AranError("external variable cannot be declared late", {
      binding,
    });
  } else if (
    binding.baseline === "deadzone" ||
    binding.baseline === "undefined"
  ) {
    if (binding.write === "perform") {
      switch (mode) {
        case "strict": {
          throw new AranError(
            "Late declarations should not occur in strict mode",
            { binding },
          );
        }
        case "sloppy": {
          return {
            type: "late-declare",
            mode,
            variable: binding.variable,
            write: binding.write,
          };
        }
        default: {
          throw new AranTypeError(mode);
        }
      }
    } else if (binding.write === "report" || binding.write === "ignore") {
      throw new AranError("Constants cannot be declared late", binding);
    } else {
      throw new AranTypeError(binding.write);
    }
  } else {
    throw new AranTypeError(binding.baseline);
  }
};

/**
 * @type {(
 *   site: import("../site").Site<
 *     import("../../estree").Program
 *   >,
 *   scope: null | import("../scope").Scope,
 *   options: {
 *     sort: import("../sort").Sort,
 *     mode: "strict" | "sloppy",
 *     global_declarative_record: "native" | "emulate",
 *     links: import("../query/link").Link[],
 *   },
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *   ),
 *   {
 *     scope: import("../scope").Scope,
 *     hoisting: import("../query/hoist-public").Hoisting,
 *   },
 * >}
 */
const setupScope = (
  { node, path, meta },
  scope,
  { sort, mode, global_declarative_record, links },
) => {
  const { unbound, hoisting, report } = hoist(
    { ...node, kind: getSortKind(sort) },
    path,
    mode,
  );
  if (scope === null) {
    if (sort === "eval.local.deep") {
      throw new AranError("program sort and scope mismatch", sort);
    } else if (
      sort === "module" ||
      sort === "script" ||
      sort === "eval.global" ||
      sort === "eval.local.root"
    ) {
      return mapSequence(
        prependSequence(
          map(map(report, toStaticDuplicateEarlyError), makeEarlyErrorPrelude),
          liftSequenceXX(
            extendScope,
            mapSequence(
              setupRootFrame(
                { path, meta },
                { global_declarative_record, sort, mode, bindings: unbound },
              ),
              makeRootScope,
            ),
            setupProgramFrame({ path }, listBinding(hoisting, path), links),
          ),
        ),
        (scope) => ({ scope, hoisting }),
      );
    } else {
      throw new AranTypeError(sort);
    }
  } else {
    if (sort === "eval.local.deep") {
      const mode = getMode(scope);
      return mapSequence(
        prependSequence(
          map(map(report, toStaticDuplicateEarlyError), makeEarlyErrorPrelude),
          bindSequence(
            liftSequence_X(
              extendScope,
              scope,
              setupRegularFrame({ path }, listBinding(hoisting, path)),
            ),
            (scope) =>
              bindSequence(
                liftSequenceX(
                  flat,
                  flatSequence(
                    map(unbound, (binding) =>
                      listScopeSaveEffect(
                        {
                          path,
                          meta: forkMeta((meta = nextMeta(meta))),
                        },
                        scope,
                        toLateDeclareOperation(binding, mode),
                      ),
                    ),
                  ),
                ),
                (nodes) => initSequence(map(nodes, makePrefixPrelude), scope),
              ),
          ),
        ),
        (scope) => ({ scope, hoisting }),
      );
    } else if (
      sort === "module" ||
      sort === "script" ||
      sort === "eval.global" ||
      sort === "eval.local.root"
    ) {
      throw new AranError("program sort and scope mismatch", sort);
    } else {
      throw new AranTypeError(sort);
    }
  }
};

/**
 * @type {(
 *   site: import("../site").VoidSite,
 *   scope: import("../scope").Scope,
 *   options: {
 *     completion: import("../completion").Completion,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
const unbuildCompletion = ({ path }, scope, { completion }) => {
  switch (completion.type) {
    case "void": {
      return zeroSequence(makeIntrinsicExpression("undefined", path));
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
 *     | import("../../estree").Program
 *     | import("../../source").EarlySyntaxError
 *   )>,
 *   scope: null | import("../scope").Scope,
 *   options: {
 *     sort: import("../sort").Sort,
 *     mode: "strict" | "sloppy",
 *     early_syntax_error: "embed" | "throw",
 *     global_declarative_record: "native" | "emulate",
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").ProgramPrelude,
 *   import("../atom").Program,
 * >}
 */
export const unbuildProgram = (
  { node, path, meta },
  scope,
  { sort, mode, early_syntax_error, global_declarative_record },
) => {
  switch (node.type) {
    case "Program": {
      const links = listLink(node);
      return incorporateHeaderProgram(
        incorporateEarlyErrorProgram(
          incorporateTemplateProgram(
            liftSequence___X_(
              makeProgram,
              getSortKind(sort),
              getSortSitu(sort),
              map(links, toModuleHeader),
              incorporateDeclarationRoutineBlock(
                incorporatePrefixRoutineBlock(
                  bindSequence(
                    setupScope(
                      { node, path, meta: forkMeta((meta = nextMeta(meta))) },
                      scope,
                      { sort, mode, global_declarative_record, links },
                    ),
                    ({ scope, hoisting }) =>
                      bindSequence(
                        extractCompletion({ node, path, meta }),
                        ({ body, completion }) =>
                          liftSequence__XX_(
                            makeRoutineBlock,
                            [],
                            null,
                            unbuildBody(body, scope, {
                              hoisting,
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
                            unbuildCompletion({ path }, scope, {
                              completion,
                            }),
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
          { root: node, early_syntax_error, base: path },
        ),
      );
    }
    case "EarlySyntaxError": {
      switch (early_syntax_error) {
        case "embed": {
          return zeroSequence(
            makeProgram(
              getSortKind(sort),
              getSortSitu(sort),
              [],
              makeRoutineBlock(
                [],
                null,
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
