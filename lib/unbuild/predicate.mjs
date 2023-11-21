/**
 * @template N
 * @typedef {import("./site.mjs").Site<N>} Site
 */

import { hasOwn } from "../util/index.mjs";

/**
 * @type {(
 *   node: estree.Expression | estree.SpreadElement,
 * ) => node is estree.Expression}
 */
export const isNotSpreadElement = (node) => node.type !== "SpreadElement";

/**
 * @type {(
 *   site: Site<(
 *     | estree.MethodDefinition
 *     | estree.PropertyDefinition
 *     | estree.StaticBlock
 *   )>
 * ) => site is Site<(
 *   | estree.PropertyDefinition & { static: true }
 *   | estree.StaticBlock
 * )>}
 */
export const isStaticSite = (site) =>
  site.node.type === "StaticBlock" ||
  (site.node.type === "PropertyDefinition" && site.node.static);

/**
 * @type {(
 *   site: Site<(
 *     | estree.MethodDefinition
 *     | estree.PropertyDefinition
 *     | estree.StaticBlock
 *   )>
 * ) => site is Site<(
 *   | estree.PropertyDefinition & { static: false }
 *   | estree.MethodDefinition & {
 *     static: false,
 *     key: estree.PrivateIdentifier,
 *   }
 * )>}
 */
export const isInstanceSite = (site) =>
  (site.node.type === "PropertyDefinition" && !site.node.static) ||
  (site.node.type === "MethodDefinition" &&
    !site.node.static &&
    site.node.key.type === "PrivateIdentifier");

/**
 * @type {(
 *   site: Site<(
 *     | estree.MethodDefinition
 *     | estree.PropertyDefinition
 *     | estree.StaticBlock
 *   )>
 * ) => site is Site<(
 *   | estree.MethodDefinition & { key: estree.PrivateIdentifier }
 *   | estree.PropertyDefinition & { key: estree.PrivateIdentifier }
 * )>}
 */
export const isPrivateSite = (site) =>
  (site.node.type === "PropertyDefinition" ||
    site.node.type === "MethodDefinition") &&
  !site.node.computed &&
  site.node.key.type === "PrivateIdentifier";

/**
 * @type {(
 *   site: Site<(
 *     | estree.MethodDefinition
 *     | estree.PropertyDefinition
 *     | estree.StaticBlock
 *   )>
 * ) => site is Site<(
 *   | estree.MethodDefinition
 *   | estree.PropertyDefinition
 * )>}
 */
export const isDefinitionSite = (site) =>
  site.node.type === "PropertyDefinition" ||
  site.node.type === "MethodDefinition";

/**
 * @type {(
 *   site: Site<(
 *     | estree.MethodDefinition
 *     | estree.PropertyDefinition
 *     | estree.StaticBlock
 *   )>
 * ) => site is Site<
 *   estree.MethodDefinition & { kind: "method" | "set" | "get" }
 *  >}
 */
export const isMethodDefinitionSite = (site) =>
  site.node.type === "MethodDefinition" &&
  (site.node.kind === "method" ||
    site.node.kind === "get" ||
    site.node.kind === "set");

/**
 * @type {<N extends estree.Literal>(
 *   node: N,
 * ) => node is N & estree.BigIntLiteral}
 */
export const isBigIntLiteral = (node) =>
  node.type === "Literal" &&
  hasOwn(node, "bigint") &&
  /** @type {{bigint: unknown}} */ (node).bigint != null;

/**
 * @type {<N extends estree.Literal>(
 *   node: N,
 * ) => node is N & estree.RegExpLiteral}
 */
export const isRegExpLiteral = (node) =>
  node.type === "Literal" &&
  hasOwn(node, "regex") &&
  /** @type {{regex: unknown}} */ (node).regex != null;

/**
 * @type {<N extends estree.Literal>(
 *   node: N,
 * ) => node is N & estree.SimpleLiteral}
 */
export const isSimpleLiteral = (node) =>
  !isBigIntLiteral(node) && !isRegExpLiteral(node);

/**
 * @type {(
 *   node: estree.Super | estree.Expression,
 * ) => node is estree.Expression}
 */
export const isNotSuperNode = (node) => node.type !== "Super";

/**
 * @type {(
 *   node: estree.Property | estree.SpreadElement,
 * ) => node is estree.Property & { kind: "init" }}
 */
export const isInitProperty = (node) =>
  node.type === "Property" && node.kind === "init";

/**
 * @type {(
 *   node: estree.MemberExpression,
 * ) => node is estree.MemberExpression & { optional: false }}
 */
export const isNotOptionalMemberExpression = (node) => !node.optional;

/**
 * @type {<N extends estree.Expression>(
 *   site: Site<estree.FunctionExpression | N>,
 * ) => site is Site<estree.FunctionExpression>}
 */
export const isFunctionExpressionSite = (site) =>
  site.node.type === "FunctionExpression";

/** @type {(node: estree.Pattern | estree.Expression) => boolean} */
export const isPatternNode = (node) =>
  node.type === "RestElement" ||
  node.type === "AssignmentPattern" ||
  node.type === "ArrayPattern" ||
  node.type === "ObjectPattern";

/**
 * @type {(
 *   node: estree.Property | estree.SpreadElement,
 * ) => node is estree.Property & ({
 *   kind: "init",
 *   method: false,
 *   computed: false,
 *   key: estree.Identifier & { name: "__proto__" },
 * } | {
 *   kind: "init",
 *   method: false,
 *   computed: true,
 *   key: estree.Literal & { value: "__proto__" },
 * })}
 */
export const isProtoProperty = (node) =>
  node.type === "Property" &&
  node.kind === "init" &&
  !node.method &&
  !node.computed &&
  ((node.key.type === "Identifier" && node.key.name === "__proto__") ||
    (node.key.type === "Literal" && node.key.value === "__proto__"));

/**
 * @type {(
 *   node: estree.Property,
 * ) => node is estree.Property & { value: estree.Expression }}
 */
export const isObjectProperty = (node) =>
  node.value.type !== "ArrayPattern" &&
  node.value.type !== "ObjectPattern" &&
  node.value.type !== "AssignmentPattern" &&
  node.value.type !== "RestElement";

/**
 * @type {<N extends estree.Node>(
 *   site: Site<null | undefined | N>
 * ) => site is Site<N>}
 */
export const isNotNullishSite = (site) => site.node != null;

/**
 * @type {<N extends estree.Node>(
 *   site: Site<estree.Super | N>
 * ) => site is Site<N>}
 */
export const isNotSuperSite = (site) => site.node.type !== "Super";

/**
 * @type {<N extends estree.Node>(
 *   site: Site<estree.BlockStatement | N>,
 * ) => site is Site<estree.BlockStatement>}
 */
export const isBlockStatementSite = (site) =>
  site.node.type === "BlockStatement";

/**
 * @type {<N extends estree.Node>(
 *   site: Site<estree.BlockStatement | N>,
 * ) => site is Site<N>}
 */
export const isNotBlockStatementSite = (site) =>
  site.node.type !== "BlockStatement";

/**
 * @type {<N extends estree.Node>(
 *   node: (
 *     | estree.ClassExpression
 *     | estree.FunctionExpression
 *     | estree.ArrowFunctionExpression
 *     | N
 *   ),
 * ) => node is (
 *   | estree.ArrowFunctionExpression
 *   | estree.ClassExpression & { id: null | undefined }
 *   | estree.FunctionExpression & { id: null | undefined }
 * )}
 */
export const isNameNode = (node) =>
  node.type === "ArrowFunctionExpression" ||
  (node.type === "ClassExpression" && node.id == null) ||
  (node.type === "FunctionExpression" && node.id == null);

/**
 * @type {<N extends estree.Node>(
 *   site: Site<(
 *     | estree.ArrowFunctionExpression
 *     | estree.ClassExpression
 *     | estree.FunctionExpression
 *     | N
 *   )>,
 * ) => site is Site<(
 *   | estree.ArrowFunctionExpression
 *   | estree.ClassExpression & { id: null | undefined }
 *   | estree.FunctionExpression & { id: null | undefined}
 * )>}
 */
export const isNameSite = (site) => isNameNode(site.node);

/**
 * @type {<N extends estree.Node>(
 *   site: Site<(
 *     | estree.PrivateIdentifier
 *     | N
 *   )>,
 * ) => site is Site<estree.PrivateIdentifier>}
 */
export const isPrivateIdentifierSite = (site) =>
  site.node.type === "PrivateIdentifier";

/**
 * @type {<N extends estree.Node>(
 *   site: Site<estree.CallExpression | N>,
 * ) => site is Site<estree.CallExpression>}
 */
export const isCallExpressionSite = (site) =>
  site.node.type === "CallExpression";

/**
 * @type {<N extends estree.Node>(
 *   site: Site<estree.SpreadElement | N>,
 * ) => site is Site<N>}
 */
export const isNotSpreadElementSite = (site) =>
  site.node.type !== "SpreadElement";

/**
 * @type {<N extends estree.Node>(
 *   site: Site<estree.MethodDefinition & { kind: "constructor" } | N>,
 * ) => site is Site<estree.MethodDefinition & { kind: "constructor" }>}
 */
export const isConstructorSite = (site) =>
  site.node.type === "MethodDefinition" && site.node.kind === "constructor";

/**
 * @type {<N extends estree.Node>(
 *   site: Site<estree.AssignmentProperty | N>,
 * ) => site is Site<estree.AssignmentProperty>}
 */
export const isAssignmentPropertySite = (site) => site.node.type === "Property";

/**
 * @type {<N extends estree.Node>(
 *   site: Site<estree.RestElement | N>,
 * ) => site is Site<N>}
 */
export const isNotRestElementSite = (site) => site.node.type !== "RestElement";

/**
 * @type {<N extends estree.Node>(
 *   site: Site<estree.Declaration | N>,
 * ) => site is Site<estree.Declaration>}
 */
export const isDeclarationSite = (site) =>
  site.node.type === "VariableDeclaration" ||
  site.node.type === "FunctionDeclaration" ||
  site.node.type === "ClassDeclaration";

/**
 * @type {<N extends estree.Node>(
 *   site: Site<estree.ModuleDeclaration | N>,
 * ) => site is Site<estree.ModuleDeclaration>}
 */
export const isModuleDeclarationSite = (site) =>
  site.node.type === "ImportDeclaration" ||
  site.node.type === "ExportNamedDeclaration" ||
  site.node.type === "ExportDefaultDeclaration" ||
  site.node.type === "ExportAllDeclaration";

/**
 * @type {(
 *   node: estree.Node
 * ) => boolean}
 */
const isNonComputedProtoKey = (node) => {
  if (node.type === "Identifier") {
    return node.name === "__proto__";
  } else if (node.type === "Literal") {
    return node.value === "__proto__";
  } else {
    return false;
  }
};

/**
 * @type {<N extends estree.Node>(
 *   site: Site<estree.ProtoProperty | N>,
 * ) => site is Site<estree.ProtoProperty>}
 */
export const isProtoPropertySite = (site) =>
  site.node.type === "Property" &&
  site.node.kind === "init" &&
  !site.node.method &&
  !site.node.computed &&
  !isPatternNode(site.node.value) &&
  isNonComputedProtoKey(site.node.key);

/**
 * @type {<N extends estree.Node>(
 *   site: Site<(estree.Property & { kind: "init", value: estree.Expression }) | N>,
 * ) => site is Site<
 *   Exclude<estree.Property & { kind: "init", value: estree.Expression }, estree.ProtoProperty>
 * >}
 */
export const isInitPropertySite = (site) =>
  site.node.type === "Property" &&
  site.node.kind === "init" &&
  !isPatternNode(site.node.value);

/**
 * @type {(
 *   site: Site<estree.Node>,
 * ) => boolean}
 */
export const isMethodPropertySite = (site) =>
  site.node.type === "Property" && site.node.method;
