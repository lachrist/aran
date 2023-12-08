import {
  hoistBlock,
  hoistClosure,
  hoistExport,
  hoistImport,
} from "../query/index.mjs";
import { flatMap, join, map, reduce, slice } from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import { splitMeta } from "../mangle.mjs";
import {
  makeEffectStatement,
  makeEvalProgram,
  makeModuleProgram,
  makePrimitiveExpression,
  makeScriptProgram,
  report,
} from "../node.mjs";
import { extendStaticScope } from "../scope/index.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildModuleDeclaration } from "./link.mjs";
import { listBodyStatement } from "./statement.mjs";
import { drill, drillArray } from "../site.mjs";
import { cacheWritable, makeReadCacheExpression } from "../cache.mjs";
import { isModuleDeclarationSite } from "../predicate.mjs";
import {
  bindSequence,
  initSequence,
  passSequence,
  sequenceClosureBlock,
  sequencePseudoBlock,
} from "../sequence.mjs";
import { listSetupClosureEffect } from "../param/index.mjs";

const {
  Object: { keys: listKey },
} = globalThis;

/**
 * @type {(
 *   sites: import("../site.d.ts").Site<(
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )>[],
 * ) => {
 *   body: import("../site.d.ts").Site<(
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )>[],
 *   tail: null | import("../site.d.ts").Site<estree.Expression>,
 * }}
 */
const extractCompletion = (sites) => {
  if (sites.length === 0) {
    return {
      body: [],
      tail: null,
    };
  } else {
    const { node, path, meta } = sites[sites.length - 1];
    if (node.type === "ExpressionStatement") {
      return {
        body: slice(sites, 0, sites.length - 1),
        tail: drill({ node, path, meta }, ["expression"]).expression,
      };
    } else {
      return { body: sites, tail: null };
    }
  }
};

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   program: import("../program.js").Program,
 *   node: estree.Program,
 * ) => {
 *   external: {[k in estree.Variable]: estree.VariableKind},
 *   internal: {[k in estree.Variable]: estree.VariableKind},
 *   logs: Omit<unbuild.Log, "path">[],
 * }}
 */
const hoistProgram = (mode, program, node) => {
  switch (program.kind) {
    case "eval": {
      switch (mode) {
        case "strict": {
          return {
            external: {},
            internal: {
              ...hoistClosure(mode, node.body),
              ...hoistBlock(mode, node.body),
            },
            logs: [],
          };
        }
        case "sloppy": {
          switch (program.situ) {
            case "local": {
              const kinds = hoistClosure(mode, node.body);
              const variables = listKey(kinds);
              return {
                external: {},
                internal: {
                  ...kinds,
                  ...hoistBlock(mode, node.body),
                },
                logs:
                  variables.length > 0
                    ? [
                        {
                          name: "DirectEvalExternalVariableDeclaration",
                          message: `Internalizing declaration of ${join(
                            variables,
                            ",",
                          )}`,
                        },
                      ]
                    : [],
              };
            }
            case "global": {
              return {
                external: hoistClosure(mode, node.body),
                internal: hoistBlock(mode, node.body),
                logs: [],
              };
            }
            default: {
              throw new AranTypeError("invalid program", program);
            }
          }
        }
        default: {
          throw new AranTypeError("invalid mode", mode);
        }
      }
    }
    case "script": {
      return {
        external: {
          ...hoistBlock(mode, node.body),
          ...hoistClosure(mode, node.body),
        },
        internal: {},
        logs: [],
      };
    }
    case "module": {
      return {
        external: {},
        internal: {
          ...hoistBlock(mode, node.body),
          ...hoistClosure(mode, node.body),
        },
        logs: [],
      };
    }
    default: {
      throw new AranTypeError("invalid program", program);
    }
  }
};

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.Program>,
 *   context: import("../context.js").Context,
 *   options: {
 *     kind: "module" | "script" | "eval",
 *     external: {[k in estree.Variable]: estree.VariableKind},
 *     internal: {[k in estree.Variable]: estree.VariableKind},
 *   },
 * ) => aran.Program<unbuild.Atom>}
 */
const unbuildProgramInner = (
  { node, path, meta },
  context,
  { kind, internal, external },
) => {
  switch (kind) {
    case "module": {
      const metas = splitMeta(meta, ["drill1", "drill2", "setup"]);
      const sites1 = drill({ node, path, meta: metas.drill1 }, ["body"]);
      const sites2 = drill({ node, path, meta: metas.drill2 }, ["body"]);
      return makeModuleProgram(
        flatMap(drillArray(sites1.body), (site) =>
          isModuleDeclarationSite(site)
            ? unbuildModuleDeclaration(site, context, {})
            : [],
        ),
        sequenceClosureBlock(
          bindSequence(
            extendStaticScope({ path }, context, {
              frame: { situ: "global", link: null, kinds: external },
            }),
            (context) =>
              bindSequence(
                extendStaticScope({ path }, context, {
                  frame: {
                    situ: "local",
                    kinds: internal,
                    link: {
                      import: hoistImport(node.body),
                      export: hoistExport(node.body),
                    },
                  },
                }),
                (context) =>
                  initSequence(
                    [
                      ...map(
                        listSetupClosureEffect(
                          { path, meta: metas.setup },
                          context,
                        ),
                        (node) => makeEffectStatement(node, path),
                      ),
                      ...listBodyStatement(drillArray(sites2.body), context, {
                        parent: "program",
                        labels: [],
                        completion: null,
                        loop: {
                          break: null,
                          continue: null,
                        },
                      }),
                    ],
                    makePrimitiveExpression({ undefined: null }, path),
                  ),
              ),
          ),
          path,
        ),
        path,
      );
    }
    case "eval": {
      const metas = splitMeta(meta, ["drill", "completion", "setup"]);
      const sites = drill({ node, path, meta: metas.drill }, ["body"]);
      const { body, tail } = extractCompletion(drillArray(sites.body));
      if (tail === null) {
        return makeEvalProgram(
          sequenceClosureBlock(
            bindSequence(
              extendStaticScope({ path }, context, {
                frame: { situ: "global", link: null, kinds: external },
              }),
              (context) =>
                bindSequence(
                  extendStaticScope({ path }, context, {
                    frame: {
                      situ: "local",
                      link: null,
                      kinds: internal,
                    },
                  }),
                  (context) =>
                    bindSequence(
                      passSequence(
                        cacheWritable(
                          metas.completion,
                          makePrimitiveExpression({ undefined: null }, path),
                          path,
                        ),
                        (node) => makeEffectStatement(node, path),
                      ),
                      (completion) =>
                        initSequence(
                          [
                            ...map(
                              listSetupClosureEffect(
                                { path, meta: metas.setup },
                                context,
                              ),
                              (node) => makeEffectStatement(node, path),
                            ),
                            ...listBodyStatement(body, context, {
                              parent: "program",
                              labels: [],
                              completion: null,
                              loop: {
                                break: null,
                                continue: null,
                              },
                            }),
                          ],
                          makeReadCacheExpression(completion, path),
                        ),
                    ),
                ),
            ),
            path,
          ),
          path,
        );
      } else {
        return makeEvalProgram(
          sequenceClosureBlock(
            bindSequence(
              extendStaticScope({ path }, context, {
                frame: { situ: "global", link: null, kinds: external },
              }),
              (context) =>
                bindSequence(
                  extendStaticScope({ path }, context, {
                    frame: {
                      situ: "local",
                      link: null,
                      kinds: internal,
                    },
                  }),
                  (context) =>
                    initSequence(
                      [
                        ...map(
                          listSetupClosureEffect(
                            { path, meta: metas.setup },
                            context,
                          ),
                          (node) => makeEffectStatement(node, path),
                        ),
                        ...listBodyStatement(body, context, {
                          parent: "program",
                          labels: [],
                          completion: null,
                          loop: {
                            break: null,
                            continue: null,
                          },
                        }),
                      ],
                      unbuildExpression(tail, context, {}),
                    ),
                ),
            ),
            path,
          ),
          path,
        );
      }
    }
    case "script": {
      const metas = splitMeta(meta, ["drill", "completion", "setup"]);
      const sites = drill({ node, path, meta: metas.drill }, ["body"]);
      const { body, tail } = extractCompletion(drillArray(sites.body));
      /** @type {import("../scope/static/index.d.ts").StaticFrame} */
      if (tail === null) {
        return makeScriptProgram(
          sequencePseudoBlock(
            bindSequence(
              extendStaticScope({ path }, context, {
                frame: { situ: "global", link: null, kinds: external },
              }),
              (context) =>
                bindSequence(
                  extendStaticScope({ path }, context, {
                    frame: {
                      situ: "local",
                      link: null,
                      kinds: internal,
                    },
                  }),
                  (context) =>
                    bindSequence(
                      passSequence(
                        cacheWritable(
                          metas.completion,
                          makePrimitiveExpression({ undefined: null }, path),
                          path,
                        ),
                        (node) => makeEffectStatement(node, path),
                      ),
                      (completion) =>
                        initSequence(
                          [
                            ...map(
                              listSetupClosureEffect(
                                { path, meta: metas.setup },
                                context,
                              ),
                              (node) => makeEffectStatement(node, path),
                            ),
                            ...listBodyStatement(body, context, {
                              parent: "program",
                              labels: [],
                              completion: null,
                              loop: {
                                break: null,
                                continue: null,
                              },
                            }),
                          ],
                          makeReadCacheExpression(completion, path),
                        ),
                    ),
                ),
            ),
            context.base,
            path,
          ),
          path,
        );
      } else {
        return makeScriptProgram(
          sequencePseudoBlock(
            bindSequence(
              extendStaticScope({ path }, context, {
                frame: { situ: "global", link: null, kinds: external },
              }),
              (context) =>
                bindSequence(
                  extendStaticScope({ path }, context, {
                    frame: {
                      situ: "local",
                      link: null,
                      kinds: internal,
                    },
                  }),
                  (context) =>
                    initSequence(
                      [
                        ...map(
                          listSetupClosureEffect(
                            { path, meta: metas.setup },
                            context,
                          ),
                          (node) => makeEffectStatement(node, path),
                        ),
                        ...listBodyStatement(body, context, {
                          parent: "program",
                          labels: [],
                          completion: null,
                          loop: {
                            break: null,
                            continue: null,
                          },
                        }),
                      ],
                      unbuildExpression(tail, context, {}),
                    ),
                ),
            ),
            context.base,
            path,
          ),
          path,
        );
      }
    }
    default: {
      throw new AranTypeError("invalid kind", kind);
    }
  }
};

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.Program>,
 *   context: import("../context.js").Context,
 *   options: {
 *     tree: null | import("../program.js").ReifyLocalProgram,
 *   },
 * ) => aran.Program<unbuild.Atom>}
 */
export const unbuildProgram = ({ node, path, meta }, context, { tree }) => {
  const program = tree ?? context.root;
  const { logs, external, internal } = hoistProgram(
    context.mode,
    program,
    node,
  );
  return reduce(
    logs,
    (node, log) => report(node, log),
    unbuildProgramInner({ node, path, meta }, context, {
      kind: program.kind,
      external,
      internal,
    }),
  );
};
