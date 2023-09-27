import { DynamicSyntaxAranError } from "../../error.mjs";
import {
  hoistBlock,
  hoistClosure,
  hoistExport,
  hoistImport,
} from "../../estree/index.mjs";
import { StaticError, flatMap } from "../../util/index.mjs";
import {
  makeEffectStatement,
  makeEvalProgram,
  makeExportEffect,
  makeModuleProgram,
  makePrimitiveExpression,
  makeScriptProgram,
} from "../node.mjs";
import {
  makeScopeClosureBlock,
  makeScopePseudoBlock,
} from "../scope/index.mjs";
import { unbuildClass } from "./class.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildModuleDeclaration } from "./link.mjs";
import { unbuildStatement } from "./statement.mjs";

/** @type {(node: estree.Node) => node is estree.ModuleDeclaration} */
const isModuleDeclaration = (node) =>
  node.type === "ImportDeclaration" ||
  node.type === "ExportNamedDeclaration" ||
  node.type === "ExportDefaultDeclaration" ||
  node.type === "ExportAllDeclaration";

/**
 * @type {<S>(
 *   node: estree.ProgramStatement,
 *   context: import("./context.js").Context<S>,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
const unbuildProgramStatement = (node, context) => {
  const { serialize } = context;
  const serial = serialize(node);
  switch (node.type) {
    case "ImportDeclaration":
      return [];
    case "ExportNamedDeclaration":
      return node.declaration == null
        ? []
        : unbuildStatement(node.declaration, context, { labels: [] });
    case "ExportDefaultDeclaration":
      switch (node.declaration.type) {
        case "VariableDeclaration":
          throw new DynamicSyntaxAranError("invalid default declaration", node);
        case "FunctionDeclaration":
          return node.declaration.id == null
            ? [
                makeEffectStatement(
                  makeExportEffect(
                    /** @type {estree.Specifier} */ ("default"),
                    unbuildFunction(
                      node.declaration,
                      {
                        ...context,
                        record: {
                          ...context.record,
                          "super.prototype": ".illegal",
                          "super.constructor": ".illegal",
                        },
                      },
                      {
                        kind: "function",
                        name: {
                          type: "static",
                          kind: "init",
                          base: /** @type {estree.Specifier} */ ("default"),
                        },
                      },
                    ),
                    serial,
                  ),
                  serial,
                ),
              ]
            : unbuildStatement(node.declaration, context, { labels: [] });
        case "ClassDeclaration":
          return node.declaration.id == null
            ? [
                makeEffectStatement(
                  makeExportEffect(
                    /** @type {estree.Specifier} */ ("default"),
                    unbuildClass(node.declaration, context, {
                      name: {
                        type: "static",
                        kind: "init",
                        base: /** @type {estree.Specifier} */ ("default"),
                      },
                    }),
                    serial,
                  ),
                  serial,
                ),
              ]
            : unbuildStatement(node.declaration, context, { labels: [] });
        default:
          unbuildExpression(node.declaration, context, {
            name: {
              type: "static",
              kind: "init",
              base: /** @type {estree.Specifier} */ ("default"),
            },
          });
      }
    case "ExportAllDeclaration":
      return [];
    default:
      return unbuildStatement(node, context, { labels: [] });
  }
};

/** @type {(nodes: estree.ProgramStatement[]) => boolean} */
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
 *   context: import("./context.js").Context<S>,
 *   options: {
 *     kind: aran.ProgramKind,
 *     enclave: boolean,
 *   },
 * ) => aran.Program<unbuild.Atom<S>>}
 */
export const unbuildProgram = (node, old_context, { kind, enclave }) => {
  const { serialize } = old_context;
  const serial = serialize(node);
  const context = {
    ...old_context,
    strict: node.sourceType === "module" || hasUseStrictDirective(node.body),
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
            kinds: {
              ...hoistBlock(node.body),
              ...hoistClosure(node.body),
            },
            enclave,
            import: hoistImport(node.body),
            export: hoistExport(node.body),
          },
          // eslint-disable-next-line no-shadow
          (context) =>
            flatMap(node.body, (child) =>
              unbuildProgramStatement(child, context),
            ),
          (_context) => makePrimitiveExpression({ undefined: null }, serial),
          serial,
        ),
        serial,
      );
    case "eval":
      return makeEvalProgram(
        makeScopeClosureBlock(
          context,
          {
            type: "eval",
            kinds: {
              ...hoistBlock(node.body),
              ...hoistClosure(node.body),
            },
            enclave,
          },
          // eslint-disable-next-line no-shadow
          (context) =>
            flatMap(node.body, (child) =>
              unbuildProgramStatement(child, context),
            ),
          (_context) => makePrimitiveExpression({ undefined: null }, serial),
          serial,
        ),
        serial,
      );
    case "script":
      return makeScriptProgram(
        makeScopePseudoBlock(
          context,
          {
            type: "script",
            kinds: {
              ...hoistBlock(node.body),
              ...hoistClosure(node.body),
            },
            enclave,
          },
          // eslint-disable-next-line no-shadow
          (context) =>
            flatMap(node.body, (child) =>
              unbuildProgramStatement(child, context),
            ),
          (_context) => makePrimitiveExpression({ undefined: null }, serial),
          serial,
        ),
        serial,
      );
    default:
      throw new StaticError("invalid program kind", kind);
  }
};
