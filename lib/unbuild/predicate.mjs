import { every } from "../util/index.mjs";

/////////
// has //
/////////

/**
 * @type {<X>(
 *   node: { alternate?: null | undefined | X },
 * ) => node is { alternate: X }}
 */
export const hasAlternate = (node) =>
  "alternate" in node && node.alternate != null;

/**
 * @type {<X>(
 *   node: { param?: null | undefined | X },
 * ) => node is { param: X }}
 */
export const hasParam = (node) => node.param != null;

/**
 * @type {<X>(
 *   node: { value?: null | undefined | X },
 * ) => node is { value: X }}
 */
export const hasValue = (node) => node.value != null;

/**
 * @type {<X>(
 *   node: { superClass?: null | undefined | X },
 * ) => node is { superClass: X }}
 */
export const hasSuperClass = (node) => node.superClass != null;

/**
 * @type {<X>(
 *   node: { init?: null | undefined | X },
 * ) => node is { init: X }}
 */
export const hasInit = (node) => node.init != null;

/**
 * @type {<X>(
 *   node: { argument?: null | undefined | X },
 * ) => node is { argument: X }}
 */
export const hasArgument = (node) => node.argument != null;

/**
 * @type {<X>(
 *   node: { handler?: null | undefined | X },
 * ) => node is { handler: X }}
 */
export const hasHandler = (node) => node.handler != null;

/**
 * @type {<X>(
 *   node: { finalizer?: null | undefined | X },
 * ) => node is { finalizer: X }}
 */
export const hasFinalizer = (node) => node.finalizer != null;

/**
 * @type {<X>(
 *   node: { test?: null | undefined | X },
 * ) => node is { test: X }}
 */
export const hasTest = (node) => node.test != null;

/**
 * @type {<X>(
 *   node: { update?: null | undefined | X },
 * ) => node is { update: X }}
 */
export const hasUpdate = (node) => node.update != null;

////////////
// others //
////////////

/**
 * @type {(
 *   node: estree.MemberExpression,
 * ) => node is estree.MemberExpression & { object: estree.Super }}
 */
export const isSuperMemberExpression = (node) => node.object.type === "Super";

/**
 * @type {(
 *   node: estree.MemberExpression,
 * ) => node is estree.MemberExpression & { object: estree.Expression }}
 */
export const isNotSuperMemberExpression = (node) =>
  node.object.type !== "Super";

/**
 * @type {(
 *   node: estree.NewExpression,
 * ) => node is estree.NewExpression & { callee: estree.Expression }}
 */
export const isNotSuperNewExpression = (node) => node.callee.type !== "Super";

/**
 * @type {(
 *   node: estree.Expression | estree.SpreadElement,
 * ) => node is estree.Expression}
 */
export const isNotSpreadElement = (node) => node.type !== "SpreadElement";

/**
 * @type {(
 *   node: estree.MethodDefinition,
 * ) => node is estree.MethodDefinition & { kind: "constructor" }}
 */
export const isConstructorMethodDefinition = (node) =>
  node.kind === "constructor";

/**
 * @type {(
 *  node: estree.SwitchCase,
 * ) => node is estree.SwitchCase & { test: estree.Expression }}
 */
export const hasTestSwitchCase = (node) => node.test != null;

/**
 * @type {(
 *   node: undefined | null | estree.Expression | estree.SpreadElement,
 * ) => node is estree.Expression}
 */
export const isRegularArrayElement = (node) =>
  node != null && node.type !== "SpreadElement";

/**
 * @type {(
 *   node: estree.ArrayExpression,
 * ) => node is estree.ArrayExpression & { elements: estree.Expression[] }}
 */
export const isRegularArrayExpression = (node) =>
  every(node.elements, isRegularArrayElement);

/**
 * @type {(
 *  node: estree.CallExpression,
 * ) => node is estree.CallExpression & {
 *   callee: estree.Identifier & { name: "eval" },
 *   arguments: estree.Expression[],
 * }}
 */
export const isDirectEvalCallExpression = (node) =>
  node.callee.type === "Identifier" &&
  node.callee.name === "eval" &&
  node.arguments.length > 1 &&
  every(node.arguments, isNotSpreadElement);

/**
 * @type {(
 *  node: estree.CallExpression,
 * ) => node is estree.CallExpression & {
 *   arguments: estree.Expression[],
 * }}
 */
export const isNotSpreadCallExpression = (node) =>
  every(node.arguments, isNotSpreadElement);

/**
 * @type {(
 *  node: estree.NewExpression,
 * ) => node is estree.NewExpression & {
 *   arguments: estree.Expression[],
 * }}
 */
export const isNotSpreadNewExpression = (node) =>
  every(node.arguments, isNotSpreadElement);

/**
 * @type {(
 *   node: estree.Property | estree.SpreadElement,
 * ) => node is estree.Property & { kind: "init" }}
 */
export const isInitProperty = (node) =>
  node.type === "Property" && node.kind === "init";

/** @type {(node: estree.Pattern | estree.Expression) => boolean} */
const isPatternNode = (node) =>
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
 *   node: estree.ObjectExpression,
 * ) => node is estree.ObjectExpression & {
 *   properties: (estree.Property & { kind: "init" })[],
 * }}
 */
export const isInitObjectExpression = (node) =>
  every(node.properties, isInitProperty);

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
 * @type {(
 *   node: estree.Property,
 * ) => node is estree.Property & { computed: false }}
 */
export const isPropertyNotComputed = (node) => !node.computed;

/**
 * @type {(
 *   node: estree.Property,
 * ) => node is estree.Property & ({ method: true } | { kind: "get" | "set" })}
 */
export const isMethodProperty = (node) => node.method || node.kind !== "init";

/**
 * @type {(
 *   node: estree.Property,
 * ) => node is estree.Property & {
 *   value: (
 *     | estree.FunctionExpression
 *     | estree.ArrowFunctionExpression
 *     | estree.ClassExpression
 *   ),
 * }}
 */
export const isNameProperty = (node) =>
  node.value.type === "FunctionExpression" ||
  node.value.type === "ArrowFunctionExpression" ||
  node.value.type === "ClassExpression";

/**
 * @type {(
 *   node: estree.PropertyDefinition,
 * ) => node is estree.PropertyDefinition & {
 *   value: (
 *     | estree.FunctionExpression
 *     | estree.ArrowFunctionExpression
 *     | estree.ClassExpression
 *   ),
 * }}
 */
export const isNamePropertyDefinition = (node) =>
  node.value != null &&
  (node.value.type === "FunctionExpression" ||
    node.value.type === "ArrowFunctionExpression" ||
    node.value.type === "ClassExpression");

/**
 * @type {(
 *   node: estree.MethodDefinition,
 * ) => node is estree.MethodDefinition & {
 *   value: (
 *     | estree.FunctionExpression
 *     | estree.ArrowFunctionExpression
 *     | estree.ClassExpression
 *   ),
 * }}
 */
export const isNameMethodDefinition = (node) =>
  node.value != null &&
  (node.value.type === "FunctionExpression" ||
    node.value.type === "ArrowFunctionExpression" ||
    node.value.type === "ClassExpression");

/**
 * @type {(
 *   node: estree.AssignmentProperty | estree.RestElement
 * ) => node is estree.AssignmentProperty}
 */
export const isAssignmentProperty = (node) => node.type === "Property";

/**
 * @type {(
 *   node: estree.Function,
 * ) => node is estree.Function & { body: estree.BlockStatement }}
 */
export const isBlockFunction = (node) => node.body.type === "BlockStatement";

/**
 * @type {(
 *   node: estree.Function,
 * ) => node is estree.Function & { body: estree.Expression }}
 */
export const isExpressionFunction = (node) =>
  node.body.type !== "BlockStatement";

/**
 * @type {(
 *   node: estree.ExportNamedDeclaration,
 * ) => node is estree.ExportNamedDeclaration & {
 *   declaration: estree.Declaration,
 *  }}
 */
export const hasDeclarationExportNamedDeclaration = (node) =>
  node.declaration != null;

/**
 * @type {(
 *   node: estree.ExportDefaultDeclaration,
 * ) => node is estree.ExportDefaultDeclaration & {
 *   declaration: estree.Declaration,
 *  }}
 */
export const hasDeclarationExportDefaultDeclaration = (node) =>
  node.declaration != null &&
  (node.declaration.type === "VariableDeclaration" ||
    node.declaration.type === "FunctionDeclaration" ||
    node.declaration.type === "ClassDeclaration");

//////////
// Site //
//////////

/**
 * @template N
 * @typedef {import("./site.mjs").Site<N>} Site
 */

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
 *   site: Site<(
 *     | estree.ClassExpression
 *     | estree.FunctionExpression
 *     | estree.ArrowFunctionExpression
 *     | N
 *   )>,
 * ) => site is Site<(
 *   | estree.ClassExpression
 *   | estree.FunctionExpression
 *   | estree.ArrowFunctionExpression
 * )>}
 */
export const isNameSite = (site) =>
  site.node.type === "ClassExpression" ||
  site.node.type === "FunctionExpression" ||
  site.node.type === "ArrowFunctionExpression";

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
