import {concat, forEach} from "array-lite";

import {assertSuccess} from "../../__fixture__.mjs";

import {
  // makeSequenceEffect,
  // makeSequenceExpression,
  // makeEffectStatement,
  // makeExpressionEffect,
  makeReturnStatement,
  makeLiteralExpression,
  makeScriptProgram,
  // makeBlock,
} from "../../ast/index.mjs";

import {
  // allignBlock,
  allignExpression,
  allignProgram,
} from "../../allign/index.mjs";

import {
  makeRootScope,
  // makeScopeBlock,
} from "./split.mjs";

import {
  initializeScope,
  makePreludeStatementArray,
  makeLooseDeclareStatementArray,
  makeRigidDeclareStatementArray,
  makeRigidInitializeStatementArray,
  // declareImportVariable,
  makeReadExpression,
  makeTypeofExpression,
  makeDiscardExpression,
  makeWriteEffect,
  // makeStaticWriteEffect,
} from "./base.mjs";

const testScript = (statements, code) => {
  assertSuccess(
    allignProgram(
      makeScriptProgram(
        concat(statements, [
          makeReturnStatement(makeLiteralExpression("completion")),
        ]),
      ),
      `
        'script';
        ${code}
        return 'completion';
      `,
    ),
  );
};

////////////////////////
// Global Non-Reified //
////////////////////////

{
  const scope = initializeScope(makeRootScope(), false);

  // prelude //
  testScript(makePreludeStatementArray(scope, "variable"), "");

  // declare loose //
  testScript(
    makeLooseDeclareStatementArray(scope, "variable", []),
    "var variable = undefined;",
  );

  // declare rigid //
  forEach([true, false], (writable) => {
    testScript(
      makeRigidDeclareStatementArray(scope, "variable", writable, []),
      "",
    );
  });

  // initialize rigid //
  forEach([true, false], (writable) => {
    testScript(
      makeRigidInitializeStatementArray(
        scope,
        "variable",
        writable,
        makeLiteralExpression("init"),
      ),
      `${writable ? "let" : "const"} variable = 'init';`,
    );
  });

  // read //
  assertSuccess(
    allignExpression(
      makeReadExpression(scope, "variable"),
      "aran.readGlobal('variable')",
    ),
  );

  // typeof //
  assertSuccess(
    allignExpression(
      makeTypeofExpression(scope, "variable"),
      "aran.typeofGlobal('variable')",
    ),
  );

  // discard //
  assertSuccess(
    allignExpression(
      makeDiscardExpression(scope, "variable"),
      "aran.deleteGlobal('variable')",
    ),
  );

  // write //
  assertSuccess(
    allignExpression(
      makeWriteEffect(scope, "variable", makeLiteralExpression("right")),
      "aran.writeGlobalSloppy('variable', 'right')",
    ),
  );
}

// ////////////////////
// // Global Reified //
// ////////////////////
//
// {
//   const scope = initializeScope(makeRootScope(), true);
//
//   // prelude //
//   testScript(
//     makePreludeStatementArray(scope, "variable"),
//     "",
//   );
//
//     `
//       effect(
//         (
//           intrinsic("aran.has")(
//             undefined,
//             intrinsic('aran.globalRecord'),
//             'variable',
//           ) ?
//           intrinsic('aran.throw')(
//             undefined,
//             new (intrinsic('SyntaxError'))('Identifier \\'variable\\' has already been declared'),
//           ) :
//           undefined
//         ),
//       );
//     `,
//   );
//
//   // declare loose //
//   testScript(
//     makeLooseDeclareStatementArray(scope, "variable", []),
//     `
//       effect(
//         (
//           intrinsic('aran.has')(
//             undefined,
//             intrinsic('aran.globalObject'),
//             'variable',
//           ) ?
//           undefined :
//           intrinsic('Reflect.defineProperty')(
//             undefined,
//             intrinsic('aran.globalObject'),
//             'variable',
//             intrinsic('aran.createObject')(
//               undefined,
//               null,
//               'configurable', false,
//               'enumerable', true,
//               'writable', true,
//               'value', undefined,
//             ),
//           )
//         ),
//       );
//     `,
//   );
//
//   // declare rigid //
//   forEach([true, false], (writable) => {
//     testScript(
//       makeRigidDeclareStatementArray(scope, "variable", writable, []),
//       `
//         effect(
//           intrinsic('aran.setStrict')(
//             undefined,
//             intrinsic('aran.globalRecord'),
//             'variable',
//             intrinsic('aran.deadzone'),
//           ),
//         );
//       `,
//     );
//   });
//
//   // initialize rigid //
//   forEach([true, false], (writable) => {
//     testScript(
//       makeRigidInitializeStatementArray(
//         scope,
//         "variable",
//         writable,
//         makeLiteralExpression("init"),
//       ),
//       writable
//         ? `
//           effect(
//             intrinsic('aran.setStrict')(
//               undefined,
//               intrinsic('aran.globalRecord'),
//               'variable',
//               'init',
//             ),
//           );
//         `
//         : `
//           effect(
//             intrinsic('Reflect.defineProperty')(
//               undefined,
//               intrinsic('aran.globalRecord'),
//               'variable',
//               intrinsic('aran.createObject')(
//                 undefined,
//                 null,
//                 'writable', false,
//                 'value', 'init',
//               ),
//             ),
//           );
//         `,
//     );
//   });
//
//   // lookup //
//   testScript(
//     [
//       makeEffectStatement(
//         makeExpressionEffect(
//           makeLookupNode(scope, "variable", READ, {
//             ...callbacks,
//             onLiveHit: (expression) =>
//               makeSequenceExpression(
//                 makeExpressionEffect(makeLiteralExpression("live")),
//                 expression,
//               ),
//             onDeadHit: () => makeLiteralExpression("dead"),
//             onMiss: () => makeLiteralExpression("miss"),
//           }),
//         ),
//       ),
//     ],
//     `
//       effect(
//         (
//           intrinsic('aran.has')(
//             undefined,
//             intrinsic('aran.globalRecord'),
//             'variable',
//           ) ?
//           (
//             intrinsic('aran.binary')(
//               undefined,
//               '===',
//               intrinsic('aran.get')(
//                 undefined,
//                 intrinsic('aran.globalRecord'),
//                 'variable',
//               ),
//               intrinsic('aran.deadzone'),
//             ) ?
//             'dead' :
//             (
//               effect('live'),
//               intrinsic('aran.get')(
//                 undefined,
//                 intrinsic('aran.globalRecord'),
//                 'variable',
//               )
//             )
//           ) :
//           (
//             intrinsic('aran.has')(
//               undefined,
//               intrinsic('aran.globalObject'),
//               'variable',
//             ) ?
//             (
//               effect('live'),
//               intrinsic('aran.get')(
//                 undefined,
//                 intrinsic('aran.globalObject'),
//                 'variable',
//               )
//             ) :
//             'miss'
//           )
//         ),
//       );
//     `,
//   );
// }
//
// ////////////
// // Static //
// ////////////
//
// // import //
// assertSuccess(
//   allignBlock(
//     makeScopeBlock(initializeScope(makeRootScope(), true), [], (scope) => {
//       declareImportVariable(scope, "variable", "source", "specifier");
//       return [
//         makeEffectStatement(
//           makeExpressionEffect(
//             makeLookupNode(scope, "variable", READ, {
//               ...callbacks,
//               onLiveHit: (expression) =>
//                 makeSequenceExpression(
//                   makeExpressionEffect(makeLiteralExpression("read")),
//                   expression,
//                 ),
//             }),
//           ),
//         ),
//         makeEffectStatement(
//           makeExpressionEffect(
//             makeLookupNode(scope, "variable", DELETE, {
//               ...callbacks,
//               onLiveHit: (expression) =>
//                 makeSequenceExpression(
//                   makeExpressionEffect(makeLiteralExpression("delete")),
//                   expression,
//                 ),
//             }),
//           ),
//         ),
//         makeEffectStatement(
//           makeLookupNode(scope, "variable", makeLiteralExpression("right"), {
//             ...callbacks,
//             onLiveHit: (effect) =>
//               makeSequenceEffect(
//                 makeExpressionEffect(makeLiteralExpression("write")),
//                 effect,
//               ),
//           }),
//         ),
//       ];
//     }),
//     `
//       {
//         effect(
//           (
//             effect('read'),
//             importStatic('source', 'specifier')
//           ),
//         );
//         effect(
//           (
//             effect('delete'),
//             true
//           ),
//         );
//         (
//           effect('write'),
//           effect(
//             intrinsic('aran.throw')(
//               undefined,
//               new (intrinsic('TypeError'))('Assignment to constant variable'),
//             ),
//           )
//         );
//       }
//     `,
//   ),
// );
//
// // loose //
// assertSuccess(
//   allignBlock(
//     makeScopeBlock(initializeScope(makeRootScope(), true), [], (scope) =>
//       makeLooseDeclareStatementArray(scope, "variable", ["specifier"]),
//     ),
//     `
//       {
//         let variable;
//         variable = undefined;
//         exportStatic('specifier', undefined);
//       }
//     `,
//   ),
// );
//
// // rigid //
// forEach([true, false], (writable) => {
//   assertSuccess(
//     allignBlock(
//       makeScopeBlock(initializeScope(makeRootScope(), true), [], (scope) =>
//         concat(
//           makeRigidDeclareStatementArray(scope, "variable", writable, [
//             "specifier",
//           ]),
//           [
//             makeEffectStatement(
//               makeExpressionEffect(
//                 makeLookupNode(scope, "variable", READ, {
//                   ...callbacks,
//                   onDeadHit: () => makeLiteralExpression("dead"),
//                 }),
//               ),
//             ),
//             makeEffectStatement(
//               makeSimpleWriteEffect(
//                 scope,
//                 "variable",
//                 makeLiteralExpression("right"),
//               ),
//             ),
//           ],
//           makeRigidInitializeStatementArray(
//             scope,
//             "variable",
//             writable,
//             makeLiteralExpression("init"),
//           ),
//           [
//             makeEffectStatement(
//               makeExpressionEffect(
//                 makeLookupNode(scope, "variable", READ, {
//                   ...callbacks,
//                   onLiveHit: (expression) =>
//                     makeSequenceExpression(
//                       makeExpressionEffect(makeLiteralExpression("read")),
//                       expression,
//                     ),
//                 }),
//               ),
//             ),
//             makeEffectStatement(
//               makeExpressionEffect(
//                 makeLookupNode(scope, "variable", DELETE, {
//                   ...callbacks,
//                   onLiveHit: (expression) =>
//                     makeSequenceExpression(
//                       makeExpressionEffect(makeLiteralExpression("delete")),
//                       expression,
//                     ),
//                 }),
//               ),
//             ),
//             makeEffectStatement(
//               makeLookupNode(
//                 scope,
//                 "variable",
//                 makeLiteralExpression("right"),
//                 {
//                   ...callbacks,
//                   onLiveHit: (effect) =>
//                     makeSequenceEffect(
//                       makeExpressionEffect(makeLiteralExpression("write")),
//                       effect,
//                     ),
//                 },
//               ),
//             ),
//             makeEffectStatement(
//               makeSimpleWriteEffect(
//                 scope,
//                 "variable",
//                 makeLiteralExpression("right"),
//               ),
//             ),
//           ],
//         ),
//       ),
//       `
//         {
//           let variable;
//           effect('dead');
//           (
//             effect('right'),
//             throw new Error();
//           (
//             variable = 'init',
//             exportStatic('specifier', 'init')
//           );
//           effect(
//             (
//               effect('read'),
//               variable
//             ),
//           );
//           effect(
//             (
//               effect('delete'),
//               true
//             ),
//           );
//           (
//             effect('write'),
//             ${
//               writable
//                 ? `
//                   (
//                     variable = 'right',
//                     exportStatic('specifier', 'right')
//                   )
//                 `
//                 : `
//                   effect(
//                     intrinsic('aran.throw')(
//                       undefined,
//                       new (intrinsic('TypeError'))('Assignment to constant variable'),
//                     ),
//                   )
//                 `
//             }
//           );
//         }
//       `,
//     ),
//   );
// });
//
// /////////////
// // Dynamic //
// /////////////
//
// // declare loose //
// assertSuccess(
//   allignBlock(
//     makeBlock(
//       [],
//       [],
//       makeLooseDeclareStatementArray(
//         makeDeclarableDynamicScope(
//           initializeScope(makeRootScope(false)),
//           false,
//           makeLiteralExpression("object"),
//         ),
//         "variable",
//         [],
//       ),
//     ),
//     `
//       {
//         effect(
//           (
//             intrinsic('aran.has')(
//               undefined,
//               'object',
//               'variable',
//             ) ?
//             undefined :
//             intrinsic('aran.setStrict')(
//               undefined,
//               'object',
//               'variable',
//               undefined,
//             )
//           ),
//         );
//       }
//     `,
//   ),
// );
//
// // lookup not lookupable //
// assertSuccess(
//   allignBlock(
//     makeBlock(
//       [],
//       [],
//       [
//         makeEffectStatement(
//           makeExpressionEffect(
//             makeLookupNode(
//               makeDeclarableDynamicScope(
//                 initializeScope(makeRootScope(false)),
//                 false,
//                 makeLiteralExpression("object"),
//               ),
//               "variable",
//               READ,
//               {
//                 ...callbacks,
//                 onGlobal: () => makeLiteralExpression("global"),
//               },
//             ),
//           ),
//         ),
//       ],
//     ),
//     `
//       {
//         effect('global');
//       }
//     `,
//   ),
// );
//
// // lookup special //
// assertSuccess(
//   allignBlock(
//     makeBlock(
//       [],
//       [],
//       [
//         makeEffectStatement(
//           makeExpressionEffect(
//             makeLookupNode(
//               makeLookupableDynamicScope(
//                 initializeScope(makeRootScope(false)),
//                 false,
//                 makeLiteralExpression("object"),
//               ),
//               "this",
//               READ,
//               {
//                 ...callbacks,
//                 onGlobal: () => makeLiteralExpression("global"),
//               },
//             ),
//           ),
//         ),
//       ],
//     ),
//     `
//       {
//         effect('global');
//       }
//     `,
//   ),
// );
//
// // loookup without unscopable //
// {
//   const scope = makeLookupableDynamicScope(
//     initializeScope(makeRootScope(false)),
//     false,
//     makeLiteralExpression("object"),
//   );
//   // read //
//   assertSuccess(
//     allignBlock(
//       makeBlock(
//         [],
//         [],
//         [
//           makeEffectStatement(
//             makeExpressionEffect(
//               makeLookupNode(scope, "variable", READ, {
//                 ...callbacks,
//                 onGlobal: () => makeLiteralExpression("global"),
//                 onLiveHit: (expression) =>
//                   makeSequenceExpression(
//                     makeExpressionEffect(makeLiteralExpression("read")),
//                     expression,
//                   ),
//               }),
//             ),
//           ),
//         ],
//       ),
//       `
//         {
//           effect(
//             (
//               intrinsic('aran.has')(
//                 undefined,
//                 'object',
//                 'variable',
//               ) ?
//               (
//                 effect('read'),
//                 intrinsic('aran.get')(
//                   undefined,
//                   'object',
//                   'variable',
//                 )
//               ) :
//               'global'
//             ),
//           );
//         }
//       `,
//     ),
//   );
//   // delete //
//   assertSuccess(
//     allignBlock(
//       makeBlock(
//         [],
//         [],
//         [
//           makeEffectStatement(
//             makeExpressionEffect(
//               makeLookupNode(scope, "variable", DELETE, {
//                 ...callbacks,
//                 onGlobal: () => makeLiteralExpression("global"),
//                 onLiveHit: (expression) =>
//                   makeSequenceExpression(
//                     makeExpressionEffect(makeLiteralExpression("delete")),
//                     expression,
//                   ),
//               }),
//             ),
//           ),
//         ],
//       ),
//       `
//         {
//           effect(
//             (
//               intrinsic('aran.has')(
//                 undefined,
//                 'object',
//                 'variable',
//               ) ?
//               (
//                 effect('delete'),
//                 intrinsic('aran.deleteSloppy')(
//                   undefined,
//                   'object',
//                   'variable',
//                 )
//               ) :
//               'global'
//             ),
//           );
//         }
//       `,
//     ),
//   );
//   // write //
//   assertSuccess(
//     allignBlock(
//       makeBlock(
//         [],
//         [],
//         [
//           makeEffectStatement(
//             makeLookupNode(scope, "variable", makeLiteralExpression("right"), {
//               ...callbacks,
//               onGlobal: () =>
//                 makeExpressionEffect(makeLiteralExpression("global")),
//               onLiveHit: (effect) =>
//                 makeSequenceEffect(
//                   makeExpressionEffect(makeLiteralExpression("write")),
//                   effect,
//                 ),
//             }),
//           ),
//         ],
//       ),
//       `
//         {
//           (
//             intrinsic('aran.has')(
//               undefined,
//               'object',
//               'variable',
//             ) ?
//             (
//               effect('write'),
//               effect(
//                 intrinsic('aran.setSloppy')(
//                   undefined,
//                   'object',
//                   'variable',
//                   'right',
//                 ),
//               )
//             ) :
//             effect('global')
//           );
//         }
//       `,
//     ),
//   );
// }
//
// // lookup with unscopable //
// assertSuccess(
//   allignBlock(
//     makeBlock(
//       [],
//       [],
//       [
//         makeEffectStatement(
//           makeExpressionEffect(
//             makeLookupNode(
//               makeLookupableDynamicScope(
//                 initializeScope(makeRootScope(false)),
//                 true,
//                 makeLiteralExpression("object"),
//               ),
//               "variable",
//               READ,
//               {
//                 ...callbacks,
//                 onLiveHit: (node) =>
//                   makeSequenceExpression(
//                     makeExpressionEffect(makeLiteralExpression("read")),
//                     node,
//                   ),
//                 onGlobal: () => makeLiteralExpression("global"),
//               },
//             ),
//           ),
//         ),
//       ],
//     ),
//     `
//       {
//         effect(
//           (
//             (
//               intrinsic('aran.get')(
//                 undefined,
//                 'object',
//                 intrinsic('Symbol.unscopables')
//               ) ?
//               (
//                 intrinsic('aran.get')(
//                   undefined,
//                   intrinsic('aran.get')(
//                     undefined,
//                     'object',
//                     intrinsic('Symbol.unscopables')
//                   ),
//                   'variable',
//                 ) ?
//                 false :
//                 intrinsic('aran.has')(
//                   undefined,
//                   'object',
//                   'variable',
//                 )
//               ) :
//               intrinsic('aran.has')(
//                 undefined,
//                 'object',
//                 'variable',
//               )
//             ) ?
//             (
//               effect('read'),
//               intrinsic('aran.get')(
//                 undefined,
//                 'object',
//                 'variable',
//               )
//             ) :
//             'global'
//           ),
//         );
//       }
//     `,
//   ),
// );
