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
