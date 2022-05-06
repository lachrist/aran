import {concat, forEach} from "array-lite";

import {assertEqual, generateAssertUnreachable} from "../../__fixture__.mjs";

import {
  makeSequenceEffect,
  makeSequenceExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeReturnStatement,
  makeLiteralExpression,
  makeScriptProgram,
  makeBlock,
} from "../../ast/index.mjs";

import {allignBlock, allignProgram} from "../../allign/index.mjs";

import {makeRootScope, makeScopeBlock} from "./split.mjs";

import {
  READ,
  DELETE,
  isStrictScope,
  useStrictScope,
  makeLookupableDynamicScope,
  makeDeclarableDynamicScope,
  initializeScope,
  makePreludeStatementArray,
  makeLooseDeclareStatementArray,
  makeRigidDeclareStatementArray,
  makeRigidInitializeStatementArray,
  declareImportVariable,
  makeLookupNode,
} from "./base.mjs";

const callbacks = {
  onLiveHit: generateAssertUnreachable("onLiveHit"),
  onDeadHit: generateAssertUnreachable("onDeadHit"),
  onMiss: generateAssertUnreachable("onMiss"),
  onGlobal: generateAssertUnreachable("onGlobal"),
};

const testScript = (statements, code) => {
  assertEqual(
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
    null,
  );
};

////////////
// Strict //
////////////

assertEqual(isStrictScope(initializeScope(makeRootScope(false))), false);

assertEqual(
  isStrictScope(useStrictScope(initializeScope(makeRootScope(false)))),
  true,
);

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

  // lookup //
  testScript(
    [
      makeEffectStatement(
        makeExpressionEffect(
          makeLookupNode(scope, "variable", READ, {
            ...callbacks,
            onGlobal: () => makeLiteralExpression("global"),
          }),
        ),
      ),
    ],
    "effect('global');",
  );
}

////////////////////
// Global Reified //
////////////////////

{
  const scope = initializeScope(makeRootScope(), true);

  // prelude //
  testScript(
    makePreludeStatementArray(scope, "variable"),
    `
      effect(
        (
          intrinsic("aran.has")(
            undefined,
            intrinsic('aran.globalRecord'),
            'variable',
          ) ?
          intrinsic('aran.throw')(
            undefined,
            new (intrinsic('SyntaxError'))('Identifier \\'variable\\' has already been declared'),
          ) :
          undefined
        ),
      );
    `,
  );

  // declare loose //
  testScript(
    makeLooseDeclareStatementArray(scope, "variable", []),
    `
      effect(
        (
          intrinsic('aran.has')(
            undefined,
            intrinsic('aran.globalObject'),
            'variable',
          ) ?
          undefined :
          intrinsic('Reflect.defineProperty')(
            undefined,
            intrinsic('aran.globalObject'),
            'variable',
            intrinsic('aran.createObject')(
              undefined,
              null,
              'configurable', false,
              'enumerable', true,
              'writable', true,
              'value', undefined,
            ),
          )
        ),
      );
    `,
  );

  // declare rigid //
  forEach([true, false], (writable) => {
    testScript(
      makeRigidDeclareStatementArray(scope, "variable", writable, []),
      `
        effect(
          intrinsic('aran.setStrict')(
            undefined,
            intrinsic('aran.globalRecord'),
            'variable',
            intrinsic('aran.deadzone'),
          ),
        );
      `,
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
      writable
        ? `
          effect(
            intrinsic('aran.setStrict')(
              undefined,
              intrinsic('aran.globalRecord'),
              'variable',
              'init',
            ),
          );
        `
        : `
          effect(
            intrinsic('Reflect.defineProperty')(
              undefined,
              intrinsic('aran.globalRecord'),
              'variable',
              intrinsic('aran.createObject')(
                undefined,
                null,
                'writable', false,
                'value', 'init',
              ),
            ),
          );
        `,
    );
  });

  // lookup //
  testScript(
    [
      makeEffectStatement(
        makeExpressionEffect(
          makeLookupNode(scope, "variable", READ, {
            ...callbacks,
            onLiveHit: (expression) =>
              makeSequenceExpression(
                makeExpressionEffect(makeLiteralExpression("live")),
                expression,
              ),
            onDeadHit: () => makeLiteralExpression("dead"),
            onMiss: () => makeLiteralExpression("miss"),
          }),
        ),
      ),
    ],
    `
      effect(
        (
          intrinsic('aran.has')(
            undefined,
            intrinsic('aran.globalRecord'),
            'variable',
          ) ?
          (
            intrinsic('aran.binary')(
              undefined,
              '===',
              intrinsic('aran.get')(
                undefined,
                intrinsic('aran.globalRecord'),
                'variable',
              ),
              intrinsic('aran.deadzone'),
            ) ?
            'dead' :
            (
              effect('live'),
              intrinsic('aran.get')(
                undefined,
                intrinsic('aran.globalRecord'),
                'variable',
              )
            )
          ) :
          (
            intrinsic('aran.has')(
              undefined,
              intrinsic('aran.globalObject'),
              'variable',
            ) ?
            (
              effect('live'),
              intrinsic('aran.get')(
                undefined,
                intrinsic('aran.globalObject'),
                'variable',
              )
            ) :
            'miss'
          )
        ),
      );
    `,
  );
}

////////////
// Static //
////////////

// import //
assertEqual(
  allignBlock(
    makeScopeBlock(initializeScope(makeRootScope(), true), [], (scope) => {
      declareImportVariable(scope, "variable", "source", "specifier");
      return [
        makeEffectStatement(
          makeExpressionEffect(
            makeLookupNode(scope, "variable", READ, {
              ...callbacks,
              onLiveHit: (expression) =>
                makeSequenceExpression(
                  makeExpressionEffect(makeLiteralExpression("read")),
                  expression,
                ),
            }),
          ),
        ),
        makeEffectStatement(
          makeExpressionEffect(
            makeLookupNode(scope, "variable", DELETE, {
              ...callbacks,
              onLiveHit: (expression) =>
                makeSequenceExpression(
                  makeExpressionEffect(makeLiteralExpression("delete")),
                  expression,
                ),
            }),
          ),
        ),
        makeEffectStatement(
          makeLookupNode(scope, "variable", makeLiteralExpression("right"), {
            ...callbacks,
            onLiveHit: (effect) =>
              makeSequenceEffect(
                makeExpressionEffect(makeLiteralExpression("write")),
                effect,
              ),
          }),
        ),
      ];
    }),
    `
      {
        effect(
          (
            effect('read'),
            importStatic('source', 'specifier')
          ),
        );
        effect(
          (
            effect('delete'),
            true
          ),
        );
        (
          effect('write'),
          effect(
            intrinsic('aran.throw')(
              undefined,
              new (intrinsic('TypeError'))('Assignment to constant variable'),
            ),
          )
        );
      }
    `,
  ),
  null,
);

// loose //
assertEqual(
  allignBlock(
    makeScopeBlock(initializeScope(makeRootScope(), true), [], (scope) =>
      makeLooseDeclareStatementArray(scope, "variable", ["specifier"]),
    ),
    `
      {
        let variable;
        variable = undefined;
        exportStatic('specifier', undefined);
      }
    `,
  ),
  null,
);

// rigid //
forEach([true, false], (writable) => {
  assertEqual(
    allignBlock(
      makeScopeBlock(initializeScope(makeRootScope(), true), [], (scope) =>
        concat(
          makeRigidDeclareStatementArray(scope, "variable", writable, [
            "specifier",
          ]),
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeLookupNode(scope, "variable", READ, {
                  ...callbacks,
                  onDeadHit: () => makeLiteralExpression("dead"),
                }),
              ),
            ),
          ],
          makeRigidInitializeStatementArray(
            scope,
            "variable",
            writable,
            makeLiteralExpression("init"),
          ),
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeLookupNode(scope, "variable", READ, {
                  ...callbacks,
                  onLiveHit: (expression) =>
                    makeSequenceExpression(
                      makeExpressionEffect(makeLiteralExpression("read")),
                      expression,
                    ),
                }),
              ),
            ),
            makeEffectStatement(
              makeExpressionEffect(
                makeLookupNode(scope, "variable", DELETE, {
                  ...callbacks,
                  onLiveHit: (expression) =>
                    makeSequenceExpression(
                      makeExpressionEffect(makeLiteralExpression("delete")),
                      expression,
                    ),
                }),
              ),
            ),
            makeEffectStatement(
              makeLookupNode(
                scope,
                "variable",
                makeLiteralExpression("right"),
                {
                  ...callbacks,
                  onLiveHit: (effect) =>
                    makeSequenceEffect(
                      makeExpressionEffect(makeLiteralExpression("write")),
                      effect,
                    ),
                },
              ),
            ),
          ],
        ),
      ),
      `
        {
          let variable;
          effect('dead');
          (
            variable = 'init',
            exportStatic('specifier', 'init')
          );
          effect(
            (
              effect('read'),
              variable
            ),
          );
          effect(
            (
              effect('delete'),
              true
            ),
          );
          (
            effect('write'),
            ${
              writable
                ? `
                  (
                    variable = 'right',
                    exportStatic('specifier', 'right')
                  )
                `
                : `
                  effect(
                    intrinsic('aran.throw')(
                      undefined,
                      new (intrinsic('TypeError'))('Assignment to constant variable'),
                    ),
                  )
                `
            }
          );
        }
      `,
    ),
    null,
  );
});

/////////////
// Dynamic //
/////////////

// declare loose //
assertEqual(
  allignBlock(
    makeBlock(
      [],
      [],
      makeLooseDeclareStatementArray(
        makeDeclarableDynamicScope(
          initializeScope(makeRootScope(false)),
          false,
          makeLiteralExpression("object"),
        ),
        "variable",
        [],
      ),
    ),
    `
      {
        effect(
          (
            intrinsic('aran.has')(
              undefined,
              'object',
              'variable',
            ) ?
            undefined :
            intrinsic('aran.setStrict')(
              undefined,
              'object',
              'variable',
              undefined,
            )
          ),
        );
      }
    `,
  ),
  null,
);

// lookup not lookupable //
assertEqual(
  allignBlock(
    makeBlock(
      [],
      [],
      [
        makeEffectStatement(
          makeExpressionEffect(
            makeLookupNode(
              makeDeclarableDynamicScope(
                initializeScope(makeRootScope(false)),
                false,
                makeLiteralExpression("object"),
              ),
              "variable",
              READ,
              {
                ...callbacks,
                onGlobal: () => makeLiteralExpression("global"),
              },
            ),
          ),
        ),
      ],
    ),
    `
      {
        effect('global');
      }
    `,
  ),
  null,
);

// lookup special //
assertEqual(
  allignBlock(
    makeBlock(
      [],
      [],
      [
        makeEffectStatement(
          makeExpressionEffect(
            makeLookupNode(
              makeLookupableDynamicScope(
                initializeScope(makeRootScope(false)),
                false,
                makeLiteralExpression("object"),
              ),
              "this",
              READ,
              {
                ...callbacks,
                onGlobal: () => makeLiteralExpression("global"),
              },
            ),
          ),
        ),
      ],
    ),
    `
      {
        effect('global');
      }
    `,
  ),
  null,
);

// loookup without unscopable //
{
  const scope = makeLookupableDynamicScope(
    initializeScope(makeRootScope(false)),
    false,
    makeLiteralExpression("object"),
  );
  // read //
  assertEqual(
    allignBlock(
      makeBlock(
        [],
        [],
        [
          makeEffectStatement(
            makeExpressionEffect(
              makeLookupNode(scope, "variable", READ, {
                ...callbacks,
                onGlobal: () => makeLiteralExpression("global"),
                onLiveHit: (expression) =>
                  makeSequenceExpression(
                    makeExpressionEffect(makeLiteralExpression("read")),
                    expression,
                  ),
              }),
            ),
          ),
        ],
      ),
      `
        {
          effect(
            (
              intrinsic('aran.has')(
                undefined,
                'object',
                'variable',
              ) ?
              (
                effect('read'),
                intrinsic('aran.get')(
                  undefined,
                  'object',
                  'variable',
                )
              ) :
              'global'
            ),
          );
        }
      `,
    ),
    null,
  );
  // delete //
  assertEqual(
    allignBlock(
      makeBlock(
        [],
        [],
        [
          makeEffectStatement(
            makeExpressionEffect(
              makeLookupNode(scope, "variable", DELETE, {
                ...callbacks,
                onGlobal: () => makeLiteralExpression("global"),
                onLiveHit: (expression) =>
                  makeSequenceExpression(
                    makeExpressionEffect(makeLiteralExpression("delete")),
                    expression,
                  ),
              }),
            ),
          ),
        ],
      ),
      `
        {
          effect(
            (
              intrinsic('aran.has')(
                undefined,
                'object',
                'variable',
              ) ?
              (
                effect('delete'),
                intrinsic('aran.deleteSloppy')(
                  undefined,
                  'object',
                  'variable',
                )
              ) :
              'global'
            ),
          );
        }
      `,
    ),
    null,
  );
  // write //
  assertEqual(
    allignBlock(
      makeBlock(
        [],
        [],
        [
          makeEffectStatement(
            makeLookupNode(scope, "variable", makeLiteralExpression("right"), {
              ...callbacks,
              onGlobal: () =>
                makeExpressionEffect(makeLiteralExpression("global")),
              onLiveHit: (effect) =>
                makeSequenceEffect(
                  makeExpressionEffect(makeLiteralExpression("write")),
                  effect,
                ),
            }),
          ),
        ],
      ),
      `
        {
          (
            intrinsic('aran.has')(
              undefined,
              'object',
              'variable',
            ) ?
            (
              effect('write'),
              effect(
                intrinsic('aran.setSloppy')(
                  undefined,
                  'object',
                  'variable',
                  'right',
                ),
              )
            ) :
            effect('global')
          );
        }
      `,
    ),
    null,
  );
}

// lookup with unscopable //
assertEqual(
  allignBlock(
    makeBlock(
      [],
      [],
      [
        makeEffectStatement(
          makeExpressionEffect(
            makeLookupNode(
              makeLookupableDynamicScope(
                initializeScope(makeRootScope(false)),
                true,
                makeLiteralExpression("object"),
              ),
              "variable",
              READ,
              {
                ...callbacks,
                onLiveHit: (node) =>
                  makeSequenceExpression(
                    makeExpressionEffect(makeLiteralExpression("read")),
                    node,
                  ),
                onGlobal: () => makeLiteralExpression("global"),
              },
            ),
          ),
        ),
      ],
    ),
    `
      {
        effect(
          (
            (
              intrinsic('aran.get')(
                undefined,
                'object',
                intrinsic('Symbol.unscopables')
              ) ?
              (
                intrinsic('aran.get')(
                  undefined,
                  intrinsic('aran.get')(
                    undefined,
                    'object',
                    intrinsic('Symbol.unscopables')
                  ),
                  'variable',
                ) ?
                false :
                intrinsic('aran.has')(
                  undefined,
                  'object',
                  'variable',
                )
              ) :
              intrinsic('aran.has')(
                undefined,
                'object',
                'variable',
              )
            ) ?
            (
              effect('read'),
              intrinsic('aran.get')(
                undefined,
                'object',
                'variable',
              )
            ) :
            'global'
          ),
        );
      }
    `,
  ),
  null,
);
