// // This was an attempt at analyzing deadzone variable normalization.
// // In the end, I choosed perform optimization after normalization.
// // So this is not used, but kept just in case.

// /* eslint-disable no-use-before-define */

// import {
//   filter,
//   flatMap,
//   hasOwn,
//   includes,
//   map,
//   reduce,
//   some,
//   listEntry,
//   reduceEntry,
//   hasNarrowObject,
//   compileGet,
// } from "../../util/index.mjs";
// import { hoistBlock, hoistClosure, listPatternVariable } from "./hoist.mjs";

// const {
//   Array: { isArray },
//   Object: { entries, keys },
// } = globalThis;

// const getVariable = compileGet("variable");

// /** @type {(key: string) => [string, boolean]} */
// const makePositiveEntry = (key) => [key, true];

// /** @type {(key: string) => [string, boolean]} */
// const makeNegativeEntry = (key) => [key, false];

// /** @type {(entry: [string, boolean]) => boolean} */
// const isPositiveEntry = ([_key, boolean]) => boolean;

// /** @type {(unknown: unknown) => unknown is import("estree-sentry").Node<{}>} */
// const isEstreeNode = (unknown) =>
//   typeof unknown === "object" &&
//   unknown !== null &&
//   hasNarrowObject(unknown, "type");

// /**
//  * @type {(
//  *   mode: "strict" | "sloppy",
//  *   accumulation: {
//  *     nodes: import("estree-sentry").Pattern<{}>[],
//  *     scope: { [k in string]?: boolean },
//  *   },
//  *   node: import("estree-sentry").Pattern<{}>,
//  * ) => {
//  *   nodes: import("estree-sentry").Pattern<{}>[],
//  *   scope: { [k in string]?: boolean },
//  * }}
//  */
// const accumulateParameter = (mode, { nodes, scope }, node) => ({
//   nodes: [...nodes, annotate(mode, node, scope)],
//   scope: {
//     ...scope,
//     ...reduceEntry(map(listPatternVariable(node), makePositiveEntry)),
//   },
// });

// /**
//  * @type {<N extends import("estree-sentry").Node<{}>>(
//  *   mode: "strict" | "sloppy",
//  *   accumulation: {
//  *     scope: { [k in string]?: boolean },
//  *     nodes: N[],
//  *   },
//  *   node: N,
//  * ) => {
//  *   scope: { [k in string]?: boolean },
//  *   nodes: N[],
//  * }}
//  */
// const accumulateDeclaration = (
//   mode,
//   { scope: scope1, nodes: nodes1 },
//   node1,
// ) => {
//   const { scope: scope2, node: node2 } = annotateDeclaration(
//     mode,
//     node1,
//     scope1,
//   );
//   return { scope: scope2, nodes: [...nodes1, node2] };
// };

// /**
//  * @type {(
//  *   mode: "strict" | "sloppy",
//  *   any: any,
//  *   scope: { [k in string]?: boolean },
//  * ) => any}
//  */
// const annotateAny = (mode, any, scope) => {
//   if (isArray(any)) {
//     return map(any, (item) => annotateAny(mode, item, scope));
//   } else if (isEstreeNode(any)) {
//     return annotate(mode, any, scope);
//   } else {
//     return any;
//   }
// };

// /** @type {(key: string) => boolean} */
// const isVisitableKey = (key) =>
//   typeof key === "string" &&
//   key !== "type" &&
//   key !== "loc" &&
//   key !== "range" &&
//   key !== "start" &&
//   key !== "end";

// /**
//  * @template {import("estree-sentry").Node<{}>} N
//  * @param {"strict" | "sloppy"} mode
//  * @param {N} node
//  * @param {{ [k in string]?: boolean }} scope
//  * @return {N}
//  */
// const annotate = (mode, node, scope) => {
//   if (node.type === "Identifier") {
//     return hasOwn(scope, node.name) && typeof scope[node.name] === "boolean"
//       ? { ...node, deadzone: !scope[node.name] }
//       : node;
//   }
//   if (node.type === "BlockStatement") {
//     return {
//       ...node,
//       body: reduce(node.body, (x, y) => accumulateDeclaration(mode, x, y), {
//         nodes: /** @type {import("estree-sentry").Statement<{}>[]} */ ([]),
//         scope: {
//           ...scope,
//           ...reduceEntry(
//             map(
//               map(
//                 flatMap(node.body, (node) => hoistBlock(mode, node)),
//                 getVariable,
//               ),
//               makeNegativeEntry,
//             ),
//           ),
//         },
//       }).nodes,
//     };
//   }
//   if (node.type === "Program") {
//     return {
//       ...node,
//       body: reduce(node.body, (x, y) => accumulateDeclaration(mode, x, y), {
//         nodes: /**
//          * @type {(
//          *   | import("estree-sentry").Directive<{}>
//          *   | import("estree-sentry").ModuleDeclaration<{}>
//          *   | import("estree-sentry").Statement<{}>
//          * )[]}
//          */ ([]),
//         scope: {
//           ...scope,
//           ...reduceEntry(
//             map(
//               map(
//                 flatMap(node.body, (node) => hoistBlock(mode, node)),
//                 getVariable,
//               ),
//               makeNegativeEntry,
//             ),
//           ),
//           ...reduceEntry(
//             map(
//               map(
//                 flatMap(node.body, (node) => hoistClosure(mode, node)),
//                 getVariable,
//               ),
//               makePositiveEntry,
//             ),
//           ),
//         },
//       }).nodes,
//     };
//   }
//   if (node.type === "SwitchStatement") {
//     return {
//       ...node,
//       cases: reduce(node.cases, (x, y) => accumulateDeclaration(mode, x, y), {
//         nodes: /** @type {import("estree-sentry").SwitchCase<{}>[]} */ ([]),
//         scope: {
//           ...scope,
//           ...reduceEntry(
//             map(
//               map(
//                 flatMap(node.cases, (node) => hoistBlock(mode, node)),
//                 getVariable,
//               ),
//               makeNegativeEntry,
//             ),
//           ),
//         },
//       }).nodes,
//     };
//   }
//   if (
//     node.type === "FunctionDeclaration" ||
//     node.type === "FunctionExpression" ||
//     node.type === "ArrowFunctionExpression"
//   ) {
//     // const f = () => x; // maybe_initialized
//     // f(); // not initialized
//     // let x;
//     // f(); // initialized
//     const { scope: new_scope, nodes } = reduce(
//       node.params,
//       (x, y) => accumulateParameter(mode, x, y),
//       {
//         nodes: /** @type {import("estree-sentry").Pattern<{}>[]} */ ([]),
//         scope: reduceEntry(filter(listEntry(scope), isPositiveEntry)),
//       },
//     );
//     return {
//       ...node,
//       params: nodes,
//       body: annotate(
//         mode,
//         node.body,
//         node.body.type === "BlockStatement"
//           ? {
//               ...new_scope,
//               ...reduceEntry(
//                 map(
//                   map(
//                     flatMap(node.body.body, (node) => hoistClosure(mode, node)),
//                     getVariable,
//                   ),
//                   makePositiveEntry,
//                 ),
//               ),
//             }
//           : new_scope,
//       ),
//     };
//   }
//   if (node.type === "CatchClause" && node.param != null) {
//     return {
//       ...node,
//       param: annotate(mode, node.param, scope),
//       body: annotate(mode, node.body, {
//         ...scope,
//         ...reduceEntry(map(listPatternVariable(node.param), makePositiveEntry)),
//       }),
//     };
//   }
//   return /** @type {N} */ (
//     reduceEntry(
//       map(entries(node), ([key, val]) => [
//         key,
//         isVisitableKey(key) ? annotateAny(mode, val, scope) : val,
//       ]),
//     )
//   );
// };

// /**
//  * @type {<N extends import("estree-sentry").Node<{}>>(
//  *   mode: "strict" | "sloppy",
//  *   node: N,
//  *   scope: { [k in string]?: boolean },
//  * ) => {
//  *   node: N,
//  *   scope: { [k in string]?: boolean },
//  * }}
//  */
// const annotateDeclaration = (mode, node, scope) => {
//   if (
//     node.type === "FunctionDeclaration" ||
//     node.type === "ClassDeclaration" ||
//     node.type === "VariableDeclarator"
//   ) {
//     return {
//       node: annotate(mode, node, scope),
//       scope:
//         node.id == null
//           ? scope
//           : {
//               ...scope,
//               ...reduceEntry(
//                 map(listPatternVariable(node.id), makePositiveEntry),
//               ),
//             },
//     };
//   }
//   if (node.type === "VariableDeclaration") {
//     const { nodes, scope: new_scope } = reduce(
//       node.declarations,
//       (x, y) => accumulateDeclaration(mode, x, y),
//       {
//         scope,
//         nodes: /** @type {import("estree-sentry").VariableDeclarator<{}>[]} */ ([]),
//       },
//     );
//     return {
//       node: {
//         ...node,
//         declarations: nodes,
//       },
//       scope: new_scope,
//     };
//   }
//   if (
//     (node.type === "ExportDefaultDeclaration" ||
//       node.type === "ExportNamedDeclaration") &&
//     node.declaration != null
//   ) {
//     const { node: declaration, scope: new_scope } = annotateDeclaration(
//       mode,
//       node.declaration,
//       scope,
//     );
//     return {
//       node: {
//         ...node,
//         declaration,
//       },
//       scope: new_scope,
//     };
//   }
//   if (node.type === "SwitchCase") {
//     const { nodes, scope: new_scope } = reduce(
//       node.consequent,
//       (x, y) => accumulateDeclaration(mode, x, y),
//       { nodes: /** @type {import("estree-sentry").Statement<{}>[]} */ ([]), scope },
//     );
//     // switch (x) {
//     //   case 123:
//     //     y; // not initialized
//     //   case 456:
//     //     y; // not initialized
//     //     let y;
//     //     y; // initialized
//     //   case 789:
//     //     y; // maybe initialized
//     // }
//     const variables = map(
//       flatMap(node.consequent, (node) => hoistBlock(mode, node)),
//       getVariable,
//     );
//     return {
//       node: {
//         ...node,
//         consequent: nodes,
//       },
//       scope: reduceEntry(
//         filter(
//           listEntry(new_scope),
//           ([variable, _initialized]) => !includes(variables, variable),
//         ),
//       ),
//     };
//   }
//   return {
//     node: annotate(mode, node, scope),
//     scope,
//   };
// };

// /** @type {(node: import("estree-sentry").Node<{}>, key: string) => boolean} */
// const isShorthandMember = (node, key) =>
//   node.type === "MemberExpression" && !node.computed && key === "property";

// /** @type {(node: import("estree-sentry").Node<{}>, key: string) => boolean} */
// const isShorthandProperty = (node, key) =>
//   node.type === "Property" && !node.computed && key === "key";

// /** @type {(node: import("estree-sentry").Node<{}>, key: string, variable: string) => boolean} */
// const hasPropertyDynamicDeadzone = (node, key, variable) =>
//   isVisitableKey(key) &&
//   !isShorthandMember(node, key) &&
//   !isShorthandProperty(node, key) &&
//   // @ts-expect-error
//   hasDynamicDeadzone(node[key], variable);

// /**
//  * @type {(
//  *   mode: "strict" | "sloppy",
//  *   node: import("estree-sentry").Program<{}>,
//  * ) => import("estree-sentry").Program<{}>}
//  */
// export const annotateDeadzone = (mode, node) => annotate(mode, node, {});

// /** @type {(node: import("estree-sentry").Identifier<{}>) => boolean | null} */
// export const isDeadzone = (node) =>
//   hasNarrowObject(node, "deadzone") ? !!node.deadzone : null;

// /** @type {(node: unknown, variable: string) => boolean} */
// export const hasDynamicDeadzone = (node, variable) => {
//   if (isArray(node)) {
//     return some(node, (child) => hasDynamicDeadzone(child, variable));
//   } else if (isEstreeNode(node)) {
//     return some(keys(node), (key) =>
//       hasPropertyDynamicDeadzone(node, key, variable),
//     );
//   } else {
//     return false;
//   }
// };
