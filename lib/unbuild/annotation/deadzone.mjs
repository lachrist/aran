// /* eslint-disable no-use-before-define */
// import { AranExecError, AranTypeError } from "../../report.mjs";
// import {
//   compileGet,
//   concatXX,
//   EMPTY,
//   filter,
//   filterNarrow,
//   filterOut,
//   flatMap,
//   hasOwn,
//   isNotNull,
//   map,
//   mapReduce,
//   recordTree,
//   slice,
// } from "../../util/index.mjs";

// const {
//   Array: { isArray },
// } = globalThis;

// /**
//  * @type {{[key in import("./hoisting").Baseline]: import("./deadzone").Zone}}
//  */
// const ZONE_BASELINE_RECORD = {
//   dead: "dead",
//   live: "live",
//   none: "live",
// };

// /**
//  * @type {(
//  *   binding: import("./hoisting").Binding,
//  * ) => import("./deadzone").ScopeBinding}
//  */
// const toScopeBinding = ({ variable, baseline }) => ({
//   variable,
//   zone: ZONE_BASELINE_RECORD[baseline],
// });

// /**
//  * @type {(
//  *   variable: import("estree-sentry").VariableName,
//  * ) => import("./deadzone").ScopeBinding}
//  */
// const toSchrodingerBinding = (variable) => ({
//   variable,
//   zone: "schrodinger",
// });

// /**
//  * @type {(
//  *   hash: import("../../hash").Hash,
//  *   hoisting: import("./hoisting").Hoisting,
//  * ) => import("./deadzone").ScopeBinding[]}
//  */
// export const hoist = (hash, hoisting) =>
//   hasOwn(hoisting, hash) ? map(hoisting[hash], toScopeBinding) : EMPTY;

// const getConsequent = compileGet("consequent");

// const getId = compileGet("id");

// /* eslint-disable local/no-impure */
// /**
//  * @type {(
//  *   scope: import("./deadzone").Scope,
//  *   variable: import("estree-sentry").VariableName,
//  * ) => import("./deadzone").Zone}
//  */
// const lookup = (scope, variable) => {
//   let closure = false;
//   /**
//    * @type {import("../../util/tree").Tree<
//    *   import("./deadzone").ScopeBinding
//    * >[]}
//    */
//   const stack = [scope];
//   let remain = stack.length;
//   while (remain > 0) {
//     const item = stack[--remain];
//     if (isArray(item)) {
//       for (let index = item.length - 1; index >= 0; index--) {
//         stack[remain++] = item[index];
//       }
//     } else {
//       if (item === "closure") {
//         closure = true;
//       } else {
//         if (item.variable === variable) {
//           if (closure) {
//             return item.zone === "dead" ? "schrodinger" : item.zone;
//           } else {
//             return item.zone;
//           }
//         }
//       }
//     }
//   }
//   return "schrodinger";
// };
// /* eslint-enable local/no-impure */

// /**
//  * @type {(
//  *   scope: import("./deadzone").Scope[],
//  * ) => import("./deadzone").Scope}
//  */
// const ts_cast_scope = (scope) => scope;

// /**
//  * @type {<X>(
//  *   node: import("estree-sentry").Node<X>,
//  * ) => node is import("./deadzone").BroadFunctionDeclaration<X>}
//  */
// const isBroadFunctionDeclaration = (node) =>
//   node.type === "FunctionDeclaration" ||
//   (node.type === "ExportNamedDeclaration" &&
//     node.declaration != null &&
//     node.declaration.type === "FunctionDeclaration") ||
//   (node.type === "ExportDefaultDeclaration" &&
//     node.declaration.type === "FunctionDeclaration" &&
//     node.declaration.id != null);

// /**
//  * @type {(
//  *   nodes: import("estree-sentry").ModuleStatement<import("../../hash").HashProp>[],
//  * ) => import("estree-sentry").ModuleStatement<import("../../hash").HashProp>[]}
//  */
// const hoistFunctionDeclation = (nodes) =>
//   concatXX(
//     filter(nodes, isBroadFunctionDeclaration),
//     filterOut(nodes, isBroadFunctionDeclaration),
//   );

// const getHash = compileGet("hash");

// const getZone = compileGet("zone");

// /**
//  * @type {(
//  *   node: import("estree-sentry").Program<import("../../hash").HashProp>,
//  *   hoisting: import("./hoisting").Hoisting,
//  * ) => import("./deadzone").Deadzone}
//  */
// export const annotateDeadzone = (node, hoisting) =>
//   recordTree(zoneProgram(node, EMPTY, hoisting), getHash, getZone);

// /**
//  * @type {(
//  *   node: import("estree-sentry").Program<import("../../hash").HashProp>,
//  *   scope: import("./deadzone").Scope,
//  *   hoisting: import("./hoisting").Hoisting,
//  * ) => import("./deadzone").RawDeadzone}
//  */
// const zoneProgram = (node, scope, hoisting) =>
//   mapReduce(
//     node.body,
//     (node, scope) => zoneStatement(node, scope, hoisting),
//     ts_cast_scope([hoist(node._hash, hoisting), scope]),
//   ).fst;

// /**=
//  * @type {(
//  *   node: import("estree-sentry").CatchClause<import("../../hash").HashProp>,
//  *   scope: import("./deadzone").Scope,
//  *   hoisting: import("./hoisting").Hoisting,
//  * ) => import("./deadzone").RawDeadzone}
//  */
// const zoneCatchClause = (node, scope, hoisting) => {
//   if (node.param == null) {
//     return zoneBlock(node.body, scope, hoisting);
//   } else {
//     const { fst, snd } = zoneDeclarationPattern(
//       node.param,
//       [hoist(node._hash, hoisting), scope],
//       hoisting,
//     );
//     return [fst, zoneBlock(node.body, snd, hoisting)];
//   }
// };

// /* eslint-disable local/no-impure */
// /* eslint-disable local/no-label */
// /**
//  * @type {(
//  *   nodes: (
//  *     | import("estree-sentry").Pattern<import("../../hash").HashProp>
//  *     | import("estree-sentry").RestElement<import("../../hash").HashProp>
//  *   )[],
//  * ) => import("estree-sentry").VariableName[]}
//  */
// const listPatternVariable = (nodes) => {
//   const variables = [];
//   let length = 0;
//   /**
//    * @type {(
//    *   | import("estree-sentry").Pattern<import("../../hash").HashProp>
//    *   | import("estree-sentry").RestElement<import("../../hash").HashProp>
//    *   | import("estree-sentry").PatternProperty<import("../../hash").HashProp>
//    * )[]}
//    */
//   const todo = slice(nodes, 0, nodes.length);
//   let remain = todo.length;
//   while (remain > 0) {
//     const node = todo[--remain];
//     switch (node.type) {
//       case "Identifier": {
//         variables[length++] = node.name;
//         break;
//       }
//       case "ArrayPattern": {
//         for (const element of node.elements) {
//           if (element != null) {
//             todo[remain++] = element;
//           }
//         }
//         break;
//       }
//       case "ObjectPattern": {
//         for (const property of node.properties) {
//           todo[remain++] = property;
//         }
//         break;
//       }
//       case "Property": {
//         todo[remain++] = node.value;
//         break;
//       }
//       case "RestElement": {
//         todo[remain++] = node.argument;
//         break;
//       }
//       case "AssignmentPattern": {
//         todo[remain++] = node.left;
//         break;
//       }
//       case "MemberExpression": {
//         break;
//       }
//       default: {
//         throw new AranTypeError(node);
//       }
//     }
//   }
//   return variables;
// };
// /* eslint-enable local/no-label */
// /* eslint-enable local/no-impure */

// /**
//  * @type {(
//  *   node: import("estree-sentry").Statement<import("../../hash").HashProp>,
//  * ) => import("estree-sentry").Pattern<import("../../hash").HashProp>[]}
//  */
// const getBlockPattern = (node) => {
//   if (node.type === "VariableDeclaration" && node.kind !== "var") {
//     return map(node.declarations, getId);
//   } else {
//     return EMPTY;
//   }
// };

// /**
//  * @type {(
//  *   node: import("estree-sentry").SwitchCase<import("../../hash").HashProp>,
//  *   scope: import("./deadzone").Scope,
//  *   hoisting: import("./hoisting").Hoisting,
//  * ) => import("../../util/pair").Pair<
//  *   import("./deadzone").RawDeadzone,
//  *   import("./deadzone").Scope,
//  * >}
//  */
// const zoneSwitchCase = (node, scope, hoisting) => {
//   const { fst, snd } = mapReduce(
//     filterOut(node.consequent, isBroadFunctionDeclaration),
//     (node, scope) => zoneStatement(node, scope, hoisting),
//     scope,
//   );
//   return {
//     fst: [
//       fst,
//       node.test == null ? EMPTY : zoneExpression(node.test, snd, hoisting),
//     ],
//     snd: [
//       map(
//         listPatternVariable(flatMap(node.consequent, getBlockPattern)),
//         toSchrodingerBinding,
//       ),
//       snd,
//     ],
//   };
// };

// /**
//  * @type {(
//  *   node: import("estree-sentry").Statement<import("../../hash").HashProp>,
//  *   scope: import("./deadzone").Scope,
//  *   hoisting: import("./hoisting").Hoisting,
//  * ) => import("./deadzone").RawDeadzone}
//  */
// const zoneBlock = (node, scope, hoisting) => {
//   switch (node.type) {
//     case "BlockStatement": {
//       return mapReduce(
//         hoistFunctionDeclation(node.body),
//         (node, scope) => zoneStatement(node, scope, hoisting),
//         scope,
//       ).fst;
//     }
//     case "VariableDeclaration": {
//       if (node.kind === "var") {
//         return map(node.declarations, (node) =>
//           zoneAssignmentVariableDeclarator(node, scope, hoisting),
//         );
//       } else {
//         throw new AranExecError("illegal block declaration", node);
//       }
//     }
//     case "FunctionDeclaration": {
//       const { fst, snd } = mapReduce(
//         node.params,
//         (node, scope) => zoneDeclarationPattern(node, scope, hoisting),
//         ts_cast_scope([hoist(node._hash, hoisting), "closure", scope]),
//       );
//       return [fst, zoneBlock(node.body, snd, hoisting)];
//     }
//     case "BreakStatement": {
//       return EMPTY;
//     }
//     case "ContinueStatement": {
//       return EMPTY;
//     }
//     case "DebuggerStatement": {
//       return EMPTY;
//     }
//     case "EmptyStatement": {
//       return EMPTY;
//     }
//     case "ReturnStatement": {
//       return node.argument == null
//         ? EMPTY
//         : zoneExpression(node.argument, scope, hoisting);
//     }
//     case "ExpressionStatement": {
//       return zoneExpression(node.expression, scope, hoisting);
//     }
//     case "ThrowStatement": {
//       return zoneExpression(node.argument, scope, hoisting);
//     }
//     case "LabeledStatement": {
//       return zoneBlock(node.body, scope, hoisting);
//     }
//     case "WithStatement": {
//       return [
//         zoneExpression(node.object, scope, hoisting),
//         zoneBlock(node.body, scope, hoisting),
//       ];
//     }
//     case "IfStatement": {
//       return [
//         zoneExpression(node.test, scope, hoisting),
//         zoneBlock(node.consequent, scope, hoisting),
//         node.alternate == null
//           ? EMPTY
//           : zoneBlock(node.alternate, scope, hoisting),
//       ];
//     }
//     case "TryStatement": {
//       return [
//         zoneBlock(node.block, scope, hoisting),
//         node.handler == null
//           ? EMPTY
//           : zoneCatchClause(node.handler, scope, hoisting),
//         node.finalizer == null
//           ? EMPTY
//           : zoneBlock(node.finalizer, scope, hoisting),
//       ];
//     }
//     case "WhileStatement": {
//       return [
//         zoneExpression(node.test, scope, hoisting),
//         zoneBlock(node.body, scope, hoisting),
//       ];
//     }
//     case "DoWhileStatement": {
//       return [
//         zoneExpression(node.test, scope, hoisting),
//         zoneBlock(node.body, scope, hoisting),
//       ];
//     }
//     case "ClassDeclaration": {
//       throw new AranExecError("illegal class declaration", node);
//     }
//     case "ForStatement": {
//       /** @type {import("./deadzone").Scope} */
//       const new_scope = [hoist(node._hash, hoisting), scope];
//       const { fst, snd } =
//         node.init != null && node.init.type === "VariableDeclaration"
//           ? zoneStatement(node.init, new_scope, hoisting)
//           : {
//               fst:
//                 node.init == null
//                   ? EMPTY
//                   : zoneExpression(node.init, new_scope, hoisting),
//               snd: new_scope,
//             };
//       return [
//         fst,
//         node.test == null ? EMPTY : zoneExpression(node.test, snd, hoisting),
//         node.update == null
//           ? EMPTY
//           : zoneExpression(node.update, snd, hoisting),
//         zoneBlock(node.body, snd, hoisting),
//       ];
//     }
//     case "ForOfStatement": {
//       /** @type {import("./deadzone").Scope} */
//       const new_scope = [hoist(node._hash, hoisting), scope];
//       const { fst, snd } =
//         node.left.type === "VariableDeclaration"
//           ? zoneStatement(node.left, new_scope, hoisting)
//           : {
//               fst: zoneAssignmentPattern(node.left, new_scope, hoisting),
//               snd: new_scope,
//             };
//       return [
//         fst,
//         zoneExpression(node.right, snd, hoisting),
//         zoneBlock(node.body, snd, hoisting),
//       ];
//     }
//     case "ForInStatement": {
//       /** @type {import("./deadzone").Scope} */
//       const new_scope = [hoist(node._hash, hoisting), scope];
//       const { fst, snd } =
//         node.left.type === "VariableDeclaration"
//           ? zoneStatement(node.left, new_scope, hoisting)
//           : {
//               fst: zoneAssignmentPattern(node.left, new_scope, hoisting),
//               snd: new_scope,
//             };
//       return [
//         fst,
//         zoneExpression(node.right, snd, hoisting),
//         zoneBlock(node.body, snd, hoisting),
//       ];
//     }
//     case "SwitchStatement": {
//       /** @type {import("./deadzone").Scope} */
//       const new_scope = [hoist(node._hash, hoisting), scope];
//       return [
//         zoneExpression(node.discriminant, new_scope, hoisting),
//         map(
//           filter(
//             flatMap(node.cases, getConsequent),
//             isBroadFunctionDeclaration,
//           ),
//           (node) => zoneBlock(node, new_scope, hoisting),
//         ),
//         mapReduce(
//           node.cases,
//           (node) => zoneSwitchCase(node, new_scope, hoisting),
//           new_scope,
//         ).fst,
//       ];
//     }
//     default: {
//       throw new AranTypeError(node);
//     }
//   }
// };

// /**
//  * @type {(
//  *   node: import("estree-sentry").DefaultDeclaration<import("../../hash").HashProp>,
//  *   scope: import("./deadzone").Scope,
//  *   hoisting: import("./hoisting").Hoisting,
//  * ) => {
//  *   fst: import("./deadzone").RawDeadzone,
//  *   snd: import("./deadzone").Scope,
//  * }}
//  */
// const zoneDefaultDeclaration = (node, scope, hoisting) => {
//   switch (node.type) {
//     case "FunctionDeclaration": {
//       const { fst, snd } = mapReduce(
//         node.params,
//         (node, scope) => zoneDeclarationPattern(node, scope, hoisting),
//         ts_cast_scope([hoist(node._hash, hoisting), "closure", scope]),
//       );
//       return { fst: [fst, zoneBlock(node.body, snd, hoisting)], snd };
//     }
//     case "ClassDeclaration": {
//       if (node.id == null) {
//         return {
//           fst: [
//             node.superClass == null
//               ? EMPTY
//               : zoneExpression(node.superClass, scope, hoisting),
//             zoneClassBody(node.body, scope, hoisting),
//           ],
//           snd: scope,
//         };
//       } else {
//         const { fst, snd } = zoneDeclarationPattern(node.id, scope, hoisting);
//         return {
//           fst: [
//             fst,
//             node.superClass == null
//               ? EMPTY
//               : zoneExpression(node.superClass, scope, hoisting),
//             zoneClassBody(node.body, scope, hoisting),
//           ],
//           snd,
//         };
//       }
//     }
//     default: {
//       return {
//         fst: zoneExpression(node, scope, hoisting),
//         snd: scope,
//       };
//     }
//   }
// };

// /**
//  * @type {(
//  *   node: import("estree-sentry").ModuleStatement<import("../../hash").HashProp>,
//  *   scope: import("./deadzone").Scope,
//  *   hoisting: import("./hoisting").Hoisting,
//  * ) => {
//  *   fst: import("./deadzone").RawDeadzone,
//  *   snd: import("./deadzone").Scope,
//  * }}
//  */
// const zoneStatement = (node, scope, hoisting) => {
//   switch (node.type) {
//     case "VariableDeclaration": {
//       if (node.kind === "var") {
//         return {
//           fst: map(node.declarations, (node) =>
//             zoneAssignmentVariableDeclarator(node, scope, hoisting),
//           ),
//           snd: scope,
//         };
//       } else {
//         return mapReduce(
//           node.declarations,
//           (node, scope) =>
//             zoneDeclarationVariableDeclarator(node, scope, hoisting),
//           scope,
//         );
//       }
//     }
//     case "ClassDeclaration": {
//       const { fst, snd } = zoneDeclarationPattern(node.id, scope, hoisting);
//       return {
//         fst: [
//           fst,
//           node.superClass == null
//             ? EMPTY
//             : zoneExpression(node.superClass, scope, hoisting),
//           zoneClassBody(node.body, scope, hoisting),
//         ],
//         snd,
//       };
//     }
//     case "ImportDeclaration": {
//       return { fst: EMPTY, snd: scope };
//     }
//     case "ExportNamedDeclaration": {
//       if (node.declaration != null) {
//         return zoneStatement(node.declaration, scope, hoisting);
//       } else {
//         return { fst: EMPTY, snd: scope };
//       }
//     }
//     case "ExportDefaultDeclaration": {
//       return zoneDefaultDeclaration(node.declaration, scope, hoisting);
//     }
//     case "ExportAllDeclaration": {
//       return { fst: EMPTY, snd: scope };
//     }
//     default: {
//       return {
//         fst: zoneBlock(node, scope, hoisting),
//         snd: scope,
//       };
//     }
//   }
// };

// /**
//  * @type {(
//  *   node: import("estree-sentry").VariableDeclarator<import("../../hash").HashProp>,
//  *   scope: import("./deadzone").Scope,
//  *   hoisting: import("./hoisting").Hoisting,
//  * ) => import("./deadzone").RawDeadzone}
//  */
// const zoneAssignmentVariableDeclarator = (node, scope, hoisting) => [
//   zoneAssignmentPattern(node.id, scope, hoisting),
//   node.init == null ? EMPTY : zoneExpression(node.init, scope, hoisting),
// ];

// /**
//  * @type {(
//  *   node: import("estree-sentry").VariableDeclarator<import("../../hash").HashProp>,
//  *   scope: import("./deadzone").Scope,
//  *   hoisting: import("./hoisting").Hoisting,
//  * ) => import("../../util/pair").Pair<
//  *   import("./deadzone").RawDeadzone,
//  *   import("./deadzone").Scope,
//  * >}
//  */
// const zoneDeclarationVariableDeclarator = (node, scope, hoisting) => {
//   const { fst, snd } = zoneDeclarationPattern(node.id, scope, hoisting);
//   return {
//     fst: [
//       fst,
//       node.init == null ? EMPTY : zoneExpression(node.init, snd, hoisting),
//     ],
//     snd,
//   };
// };

// /**
//  * @type {(
//  *   node: (
//  *     | import("estree-sentry").Expression<import("../../hash").HashProp>
//  *     | import("estree-sentry").Super<import("../../hash").HashProp>
//  *     | import("estree-sentry").SpreadElement<import("../../hash").HashProp>
//  *     | import("estree-sentry").ObjectProperty<import("../../hash").HashProp>
//  *     | import("estree-sentry").ChainableExpression<import("../../hash").HashProp>
//  *   ),
//  *   scope: import("./deadzone").Scope,
//  *   hoisting: import("./hoisting").Hoisting,
//  * ) => import("./deadzone").RawDeadzone}
//  */
// const zoneExpression = (node, scope, hoisting) => {
//   switch (node.type) {
//     case "Identifier": {
//       return {
//         hash: node._hash,
//         zone: lookup(scope, node.name),
//       };
//     }
//     case "ArrayExpression": {
//       return map(node.elements, (element) =>
//         element == null ? EMPTY : zoneExpression(element, scope, hoisting),
//       );
//     }
//     case "ObjectExpression": {
//       return map(node.properties, (property) =>
//         zoneExpression(property, scope, hoisting),
//       );
//     }
//     case "Property": {
//       return node.computed
//         ? [
//             zoneExpression(node.key, scope, hoisting),
//             zoneExpression(node.value, scope, hoisting),
//           ]
//         : zoneExpression(node.value, scope, hoisting);
//     }
//     case "MemberExpression": {
//       return node.computed
//         ? [
//             zoneExpression(node.object, scope, hoisting),
//             zoneExpression(node.property, scope, hoisting),
//           ]
//         : zoneExpression(node.object, scope, hoisting);
//     }
//     case "CallExpression": {
//       return [
//         zoneExpression(node.callee, scope, hoisting),
//         map(node.arguments, (argument) =>
//           zoneExpression(argument, scope, hoisting),
//         ),
//       ];
//     }
//     case "ArrowFunctionExpression": {
//       const { fst, snd } = mapReduce(
//         node.params,
//         (node, scope) => zoneDeclarationPattern(node, scope, hoisting),
//         ts_cast_scope(["closure", hoist(node._hash, hoisting), scope]),
//       );
//       return [
//         fst,
//         node.body.type === "BlockStatement"
//           ? zoneBlock(node.body, snd, hoisting)
//           : zoneExpression(node.body, snd, hoisting),
//       ];
//     }
//     case "FunctionExpression": {
//       const { fst, snd } = mapReduce(
//         node.params,
//         (node, scope) => zoneDeclarationPattern(node, scope, hoisting),
//         ts_cast_scope(["closure", hoist(node._hash, hoisting), scope]),
//       );
//       return [fst, zoneBlock(node.body, snd, hoisting)];
//     }
//     case "AssignmentExpression": {
//       return [
//         node.left.type === "CallExpression"
//           ? zoneExpression(node.left, scope, hoisting)
//           : zoneAssignmentPattern(node.left, scope, hoisting),
//         zoneExpression(node.right, scope, hoisting),
//       ];
//     }
//     case "UpdateExpression": {
//       return zoneAssignmentPattern(node.argument, scope, hoisting);
//     }
//     case "UnaryExpression": {
//       return zoneExpression(node.argument, scope, hoisting);
//     }
//     case "BinaryExpression": {
//       return [
//         node.left.type === "PrivateIdentifier"
//           ? EMPTY
//           : zoneExpression(node.left, scope, hoisting),
//         zoneExpression(node.right, scope, hoisting),
//       ];
//     }
//     case "LogicalExpression": {
//       return [
//         zoneExpression(node.left, scope, hoisting),
//         zoneExpression(node.right, scope, hoisting),
//       ];
//     }
//     case "ConditionalExpression": {
//       return [
//         zoneExpression(node.test, scope, hoisting),
//         zoneExpression(node.consequent, scope, hoisting),
//         zoneExpression(node.alternate, scope, hoisting),
//       ];
//     }
//     case "ChainExpression": {
//       return zoneExpression(node.expression, scope, hoisting);
//     }
//     case "AwaitExpression": {
//       return zoneExpression(node.argument, scope, hoisting);
//     }
//     case "YieldExpression": {
//       return node.argument == null
//         ? EMPTY
//         : zoneExpression(node.argument, scope, hoisting);
//     }
//     case "Super": {
//       return EMPTY;
//     }
//     case "ThisExpression": {
//       return EMPTY;
//     }
//     case "MetaProperty": {
//       return EMPTY;
//     }
//     case "NewExpression": {
//       return [
//         zoneExpression(node.callee, scope, hoisting),
//         map(node.arguments, (argument) =>
//           zoneExpression(argument, scope, hoisting),
//         ),
//       ];
//     }
//     case "ImportExpression": {
//       return zoneExpression(node.source, scope, hoisting);
//     }
//     case "TaggedTemplateExpression": {
//       return [
//         zoneExpression(node.tag, scope, hoisting),
//         zoneExpression(node.quasi, scope, hoisting),
//       ];
//     }
//     case "TemplateLiteral": {
//       return map(node.expressions, (expression) =>
//         zoneExpression(expression, scope, hoisting),
//       );
//     }
//     case "SequenceExpression": {
//       return map(node.expressions, (expression) =>
//         zoneExpression(expression, scope, hoisting),
//       );
//     }
//     case "SpreadElement": {
//       return zoneExpression(node.argument, scope, hoisting);
//     }
//     case "Literal": {
//       return EMPTY;
//     }
//     case "ClassExpression": {
//       const new_scope = [hoist(node._hash, hoisting), scope];
//       return [
//         node.superClass == null
//           ? EMPTY
//           : zoneExpression(node.superClass, new_scope, hoisting),
//         zoneClassBody(node.body, new_scope, hoisting),
//       ];
//     }
//     default: {
//       throw new AranTypeError(node);
//     }
//   }
// };

// /**
//  * @type {(
//  *   node: import("estree-sentry").ClassBody<import("../../hash").HashProp>,
//  *   scope: import("./deadzone").Scope,
//  *   hoisting: import("./hoisting").Hoisting,
//  * ) => import("./deadzone").RawDeadzone}
//  */
// const zoneClassBody = (node, scope, hoisting) =>
//   map(node.body, (entry) => zoneClassEntry(entry, scope, hoisting));

// /**
//  * @type {(
//  *   node: import("estree-sentry").ClassEntry<import("../../hash").HashProp>,
//  *   scope: import("./deadzone").Scope,
//  *   hoisting: import("./hoisting").Hoisting,
//  * ) => import("./deadzone").RawDeadzone}
//  */
// const zoneClassEntry = (node, scope, hoisting) => {
//   switch (node.type) {
//     case "MethodDefinition": {
//       return [
//         node.computed ? zoneExpression(node.key, scope, hoisting) : EMPTY,
//         zoneExpression(node.value, scope, hoisting),
//       ];
//     }
//     case "PropertyDefinition": {
//       return [
//         node.computed ? zoneExpression(node.key, scope, hoisting) : EMPTY,
//         node.value == null
//           ? EMPTY
//           : zoneExpression(node.value, scope, hoisting),
//       ];
//     }
//     case "StaticBlock": {
//       return mapReduce(
//         node.body,
//         (node, scope) => zoneStatement(node, scope, hoisting),
//         scope,
//       ).fst;
//     }
//     default: {
//       throw new AranTypeError(node);
//     }
//   }
// };

// /**
//  * @type {(
//  *   node: (
//  *     | import("estree-sentry").Pattern<import("../../hash").HashProp>
//  *     | import("estree-sentry").PatternProperty<import("../../hash").HashProp>
//  *     | import("estree-sentry").RestElement<import("../../hash").HashProp>
//  *   ),
//  *   scope: import("./deadzone").Scope,
//  *   hoisting: import("./hoisting").Hoisting,
//  * ) => import("./deadzone").RawDeadzone}
//  */
// const zoneAssignmentPattern = (node, scope, hoisting) => {
//   switch (node.type) {
//     case "Identifier": {
//       return {
//         hash: node._hash,
//         zone: lookup(scope, node.name),
//       };
//     }
//     case "ArrayPattern": {
//       return map(node.elements, (element) =>
//         element == null ? [] : zoneAssignmentPattern(element, scope, hoisting),
//       );
//     }
//     case "ObjectPattern": {
//       return map(node.properties, (property) =>
//         zoneAssignmentPattern(property, scope, hoisting),
//       );
//     }
//     case "Property": {
//       return [
//         node.computed ? zoneExpression(node.key, scope, hoisting) : EMPTY,
//         zoneAssignmentPattern(node.value, scope, hoisting),
//       ];
//     }
//     case "RestElement": {
//       return zoneAssignmentPattern(node.argument, scope, hoisting);
//     }
//     case "AssignmentPattern": {
//       return [
//         zoneAssignmentPattern(node.left, scope, hoisting),
//         zoneExpression(node.right, scope, hoisting),
//       ];
//     }
//     case "MemberExpression": {
//       return [
//         zoneExpression(node.object, scope, hoisting),
//         node.computed ? zoneExpression(node.property, scope, hoisting) : EMPTY,
//       ];
//     }
//     default: {
//       throw new AranTypeError(node);
//     }
//   }
// };

// /**
//  * @type {(
//  *   node: (
//  *     | import("estree-sentry").Pattern<import("../../hash").HashProp>
//  *     | import("estree-sentry").PatternProperty<import("../../hash").HashProp>
//  *     | import("estree-sentry").RestElement<import("../../hash").HashProp>
//  *   ),
//  *   scope: import("./deadzone").Scope,
//  *   hoisting: import("./hoisting").Hoisting,
//  * ) => import("../../util/pair").Pair<
//  *   import("./deadzone").RawDeadzone,
//  *   import("./deadzone").Scope,
//  * >}
//  */
// const zoneDeclarationPattern = (node, scope, hoisting) => {
//   switch (node.type) {
//     case "Identifier": {
//       return {
//         fst: { hash: node._hash, zone: lookup(scope, node.name) },
//         snd: [{ variable: node.name, zone: "live" }, scope],
//       };
//     }
//     case "ArrayPattern": {
//       return mapReduce(
//         filterNarrow(node.elements, isNotNull),
//         (node, scope) => zoneDeclarationPattern(node, scope, hoisting),
//         scope,
//       );
//     }
//     case "ObjectPattern": {
//       return mapReduce(
//         node.properties,
//         (node, scope) => zoneDeclarationPattern(node, scope, hoisting),
//         scope,
//       );
//     }
//     case "Property": {
//       const { fst, snd } = zoneDeclarationPattern(node.value, scope, hoisting);
//       return {
//         fst: [
//           node.computed ? zoneExpression(node.key, scope, hoisting) : EMPTY,
//           fst,
//         ],
//         snd,
//       };
//     }
//     case "RestElement": {
//       return zoneDeclarationPattern(node.argument, scope, hoisting);
//     }
//     case "AssignmentPattern": {
//       const { fst, snd } = zoneDeclarationPattern(node.left, scope, hoisting);
//       return {
//         fst: [fst, zoneExpression(node.right, scope, hoisting)],
//         snd,
//       };
//     }
//     case "MemberExpression": {
//       return {
//         fst: [
//           zoneExpression(node.object, scope, hoisting),
//           node.computed
//             ? zoneExpression(node.property, scope, hoisting)
//             : EMPTY,
//         ],
//         snd: scope,
//       };
//     }
//     default: {
//       throw new AranTypeError(node);
//     }
//   }
// };
