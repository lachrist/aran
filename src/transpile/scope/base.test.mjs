import {concat, forEach} from "array-lite";

import {assertEqual, generateAssertUnreachable} from "../../__fixture__.mjs";

import {
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
  makeLookupExpression,
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
          makeLookupExpression(scope, "variable", {
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
          intrinsic("aran.binary")(
            undefined,
            "in",
            "variable",
            intrinsic("aran.globalRecord"),
          ) ?
          intrinsic("aran.throw")(
            undefined,
            new (intrinsic("SyntaxError"))("Identifier 'variable' has already been declared"),
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
          intrinsic('aran.binary')(
            undefined,
            'in',
            'variable',
            intrinsic('aran.globalObject'),
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
          makeLookupExpression(scope, "variable", {
            ...callbacks,
            onLiveHit: (read, write) =>
              makeSequenceExpression(
                write(makeLiteralExpression("right")),
                read(),
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
          intrinsic('aran.binary')(
            undefined,
            'in',
            'variable',
            intrinsic('aran.globalRecord'),
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
              effect(
                intrinsic('aran.setStrict')(
                  undefined,
                  intrinsic('aran.globalRecord'),
                  'variable',
                  'right',
                ),
              ),
              intrinsic('aran.get')(
                undefined,
                intrinsic('aran.globalRecord'),
                'variable',
              )
            )
          ) :
          (
            intrinsic('aran.binary')(
              undefined,
              'in',
              'variable',
              intrinsic('aran.globalObject'),
            ) ?
            (
              effect(
                intrinsic('aran.setSloppy')(
                  undefined,
                  intrinsic('aran.globalObject'),
                  'variable',
                  'right',
                ),
              ),
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
            makeLookupExpression(scope, "variable", {
              ...callbacks,
              onLiveHit: (read, write) =>
                makeSequenceExpression(
                  write(makeLiteralExpression("right")),
                  read(),
                ),
            }),
          ),
        ),
      ];
    }),
    `
      {
        effect(
          (
            effect(
              intrinsic('aran.throw')(
                undefined,
                new (intrinsic('TypeError'))('Assignment to constant variable'),
              ),
            ),
            importStatic('source', 'specifier')
          ),
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
                makeLookupExpression(scope, "variable", {
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
                makeLookupExpression(scope, "variable", {
                  ...callbacks,
                  onLiveHit: (read, write) =>
                    makeSequenceExpression(
                      write(makeLiteralExpression("right")),
                      read(),
                    ),
                }),
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
              },
              variable
            ),
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
            intrinsic('aran.binary')(
              undefined,
              'in',
              'variable',
              'object',
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
            makeLookupExpression(
              makeDeclarableDynamicScope(
                initializeScope(makeRootScope(false)),
                false,
                makeLiteralExpression("object"),
              ),
              "variable",
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
            makeLookupExpression(
              makeLookupableDynamicScope(
                initializeScope(makeRootScope(false)),
                false,
                makeLiteralExpression("object"),
              ),
              "this",
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
assertEqual(
  allignBlock(
    makeBlock(
      [],
      [],
      [
        makeEffectStatement(
          makeExpressionEffect(
            makeLookupExpression(
              makeLookupableDynamicScope(
                initializeScope(makeRootScope(false)),
                false,
                makeLiteralExpression("object"),
              ),
              "variable",
              {
                ...callbacks,
                onLiveHit: (read, write) =>
                  makeSequenceExpression(
                    write(makeLiteralExpression("right")),
                    read(),
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
            intrinsic('aran.binary')(
              undefined,
              'in',
              'variable',
              'object',
            ) ?
            (
              effect(
                intrinsic('aran.setSloppy')(
                  undefined,
                  'object',
                  'variable',
                  'right',
                ),
              ),
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

// lookup with unscopable //
assertEqual(
  allignBlock(
    makeBlock(
      [],
      [],
      [
        makeEffectStatement(
          makeExpressionEffect(
            makeLookupExpression(
              makeLookupableDynamicScope(
                initializeScope(makeRootScope(false)),
                true,
                makeLiteralExpression("object"),
              ),
              "variable",
              {
                ...callbacks,
                onLiveHit: (read, write) =>
                  makeSequenceExpression(
                    write(makeLiteralExpression("right")),
                    read(),
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
                intrinsic('aran.binary')(
                  undefined,
                  'in',
                  'variable',
                  'object',
                )
              ) :
              intrinsic('aran.binary')(
                undefined,
                'in',
                'variable',
                'object',
              )
            ) ?
            (
              effect(
                intrinsic('aran.setSloppy')(
                  undefined,
                  'object',
                  'variable',
                  'right',
                ),
              ),
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
