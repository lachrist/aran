import {
  hoistBlock,
  hoistClosure,
  hoistExport,
  hoistImport,
} from "../query/index.mjs";
import { StaticError, flatMap, slice } from "../../util/index.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
import { ANONYMOUS } from "../name.mjs";
import {
  makeEffectStatement,
  makeEvalProgram,
  makeModuleProgram,
  makePrimitiveExpression,
  makeReadExpression,
  makeScriptProgram,
  makeWriteEffect,
} from "../node.mjs";
import {
  makeScopeClosureBlock,
  makeScopePseudoBlock,
} from "../scope/index.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildModuleDeclaration } from "./link.mjs";
import { unbuildAllStatement } from "./statement.mjs";
import { getPath } from "../annotate.mjs";

const BASENAME = /** @basename */ "program";

/** @type {(node: estree.Node) => node is estree.ModuleDeclaration} */
const isModuleDeclaration = (node) =>
  node.type === "ImportDeclaration" ||
  node.type === "ExportNamedDeclaration" ||
  node.type === "ExportDefaultDeclaration" ||
  node.type === "ExportAllDeclaration";

/**
 * @type {(
 *   nodes: (
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )[],
 * ) => {
 *   body: (
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )[]
 *   tail: estree.Expression | null,
 * }}
 */
const extractCompletion = (nodes) =>
  nodes.length > 1 && nodes[nodes.length - 1].type === "ExpressionStatement"
    ? {
        body: slice(nodes, 0, nodes.length - 1),
        tail: /** @type {estree.ExpressionStatement} */ (
          nodes[nodes.length - 1]
        ).expression,
      }
    : {
        body: nodes,
        tail: null,
      };

/** @type {(nodes: estree.Node[]) => boolean} */
const hasUseStrictDirective = (nodes) => {
  for (const node of nodes) {
    if (
      node.type !== "ExpressionStatement" ||
      node.expression.type !== "Literal" ||
      typeof node.expression.value !== "string"
    ) {
      return false;
    }
    if (node.expression.value === "use strict") {
      return true;
    }
  }
  return false;
};

/**
 * @type {<S>(
 *   node: estree.Program,
 *   context: import("../context.js").Context<S>,
 *   options: {
 *     kind: "module" | "script",
 *     site: "global",
 *     enclave: boolean,
 *   } | {
 *     kind: "eval",
 *     site: "global" | "local",
 *     enclave: boolean,
 *   },
 * ) => aran.Program<unbuild.Atom<S>>}
 */
export const unbuildProgram = (node, old_context, { kind, site, enclave }) => {
  const { serialize, digest, root } = old_context;
  const path = getPath(node);
  const serial = serialize(node, root, path);
  const hash = digest(node, root, path);
  const context = {
    ...old_context,
    strict:
      old_context.strict ||
      node.sourceType === "module" ||
      hasUseStrictDirective(node.body),
    record: {
      ...old_context.record,
      "this":
        node.sourceType === "module"
          ? /** @type {".undefined"} */ (".undefined")
          : /** @type {".global"} */ (".global"),
      "import.meta":
        node.sourceType === "module"
          ? /** @type {aran.Parameter} */ ("import.meta")
          : /** @type {".illegal"} */ (".illegal"),
    },
  };
  switch (kind) {
    case "module":
      return makeModuleProgram(
        flatMap(node.body, (child) =>
          isModuleDeclaration(child)
            ? unbuildModuleDeclaration(child, context)
            : [],
        ),
        makeScopeClosureBlock(
          context,
          {
            type: "module",
            site,
            enclave,
            kinds: {
              ...hoistBlock(node.body),
              ...hoistClosure(node.body),
            },
            import: hoistImport(node.body),
            export: hoistExport(node.body),
          },
          (context) =>
            unbuildAllStatement(node.body, context, {
              labels: [],
              completion: null,
              loop: {
                break: null,
                continue: null,
              },
            }),
          (_context) => makePrimitiveExpression({ undefined: null }, serial),
          serial,
        ),
        serial,
      );
    case "eval": {
      const { body, tail } = extractCompletion(node.body);
      const frame = {
        type: /** @type {"eval"} */ ("eval"),
        site,
        enclave,
        kinds: {
          ...hoistBlock(node.body),
          ...hoistClosure(node.body),
        },
      };
      if (tail === null) {
        const completion = mangleMetaVariable(hash, BASENAME, "completion");
        return makeEvalProgram(
          makeScopeClosureBlock(
            { ...context, completion },
            frame,
            (context) => [
              makeEffectStatement(
                makeWriteEffect(
                  completion,
                  makePrimitiveExpression({ undefined: null }, serial),
                  serial,
                  true,
                ),
                serial,
              ),
              ...unbuildAllStatement(body, context, {
                labels: [],
                completion: {
                  variable: completion,
                  last: true,
                },
                loop: {
                  break: null,
                  continue: null,
                },
              }),
            ],
            (_context) => makeReadExpression(completion, serial),
            serial,
          ),
          serial,
        );
      } else {
        return makeEvalProgram(
          makeScopeClosureBlock(
            context,
            frame,
            (context) =>
              unbuildAllStatement(body, context, {
                labels: [],
                completion: null,
                loop: {
                  break: null,
                  continue: null,
                },
              }),
            (context) => unbuildExpression(tail, context, { name: ANONYMOUS }),
            serial,
          ),
          serial,
        );
      }
    }
    case "script": {
      const { body, tail } = extractCompletion(node.body);
      const frame = {
        type: /** @type {"script"} */ ("script"),
        site,
        enclave,
        kinds: {
          ...hoistBlock(node.body),
          ...hoistClosure(node.body),
        },
      };
      if (tail === null) {
        const completion = mangleMetaVariable(hash, BASENAME, "completion");
        return makeScriptProgram(
          makeScopePseudoBlock(
            { ...context, completion },
            frame,
            (context) => [
              makeEffectStatement(
                makeWriteEffect(
                  completion,
                  makePrimitiveExpression({ undefined: null }, serial),
                  serial,
                  true,
                ),
                serial,
              ),
              ...unbuildAllStatement(body, context, {
                labels: [],
                completion: {
                  variable: completion,
                  last: true,
                },
                loop: {
                  break: null,
                  continue: null,
                },
              }),
            ],
            (_context) => makeReadExpression(completion, serial),
            serial,
          ),
          serial,
        );
      } else {
        return makeScriptProgram(
          makeScopePseudoBlock(
            context,
            frame,
            (context) =>
              unbuildAllStatement(body, context, {
                labels: [],
                completion: null,
                loop: {
                  break: null,
                  continue: null,
                },
              }),
            (context) => unbuildExpression(tail, context, { name: ANONYMOUS }),
            serial,
          ),
          serial,
        );
      }
    }
    default:
      throw new StaticError("invalid program kind", kind);
  }
};
