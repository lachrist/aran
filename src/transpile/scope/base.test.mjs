import {concat, forEach} from "array-lite";

import {assertEqual, generateAssertUnreachable} from "../../__fixture__.mjs";

import {
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
  // makeLookupableScope,
  // makeDeclarableScope,
  initializeScope,
  // useStrictScope,
  makePreludeStatementArray,
  makeLooseDeclareStatementArray,
  makeRigidDeclareStatementArray,
  makeRigidInitializeStatementArray,
  declareImportVariable,
  // makeLookupEffect,
  makeLookupExpression,
} from "./base.mjs";

const callbacks = {
  onDynamicHit: generateAssertUnreachable("onDynamicHit"),
  onStaticHit: generateAssertUnreachable("onStaticHit"),
  onDeadHit: generateAssertUnreachable("onDeadHit"),
  onMiss: generateAssertUnreachable("onMiss"),
  onGlobal: generateAssertUnreachable("onGlobal"),
};

/////////////
// Prelude //
/////////////

assertEqual(
  allignBlock(
    makeBlock(
      [],
      [],
      makePreludeStatementArray(
        initializeScope(makeRootScope(), false),
        "variable",
      ),
    ),
    "{}",
  ),
  null,
);

assertEqual(
  allignBlock(
    makeBlock(
      [],
      [],
      makePreludeStatementArray(
        initializeScope(makeRootScope(), true),
        "variable",
      ),
    ),
    `
      {
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
      }
    `,
  ),
  null,
);

///////////
// Loose //
///////////

// global non-reified //
assertEqual(
  allignProgram(
    makeScriptProgram(
      concat(
        makeLooseDeclareStatementArray(
          initializeScope(makeRootScope(), false),
          "variable",
          [],
        ),
        [makeReturnStatement(makeLiteralExpression("completion"))],
      ),
    ),
    `
      'script';
      var variable = undefined;
      return 'completion';
    `,
  ),
  null,
);

// global reified //
assertEqual(
  allignProgram(
    makeScriptProgram(
      concat(
        makeLooseDeclareStatementArray(
          initializeScope(makeRootScope(), true),
          "variable",
          [],
        ),
        [makeReturnStatement(makeLiteralExpression("completion"))],
      ),
    ),
    `
      'script';
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
      return 'completion';
    `,
  ),
  null,
);

// static //
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

///////////
// Rigid //
///////////

// global non-reified //
forEach([true, false], (writable) => {
  const scope = initializeScope(makeRootScope(), false);
  assertEqual(
    allignProgram(
      makeScriptProgram(
        concat(
          makeRigidDeclareStatementArray(scope, "variable", writable, []),
          makeRigidInitializeStatementArray(
            scope,
            "variable",
            writable,
            makeLiteralExpression("init"),
          ),
          [makeReturnStatement(makeLiteralExpression("completion"))],
        ),
      ),
      `
        'script';
        ${writable ? "let" : "const"} variable = 'init';
        return 'completion';
      `,
    ),
    null,
  );
});

// global reified //
forEach([true, false], (writable) => {
  const scope = initializeScope(makeRootScope(), true);
  assertEqual(
    allignProgram(
      makeScriptProgram(
        concat(
          makeRigidDeclareStatementArray(scope, "variable", writable, []),
          makeRigidInitializeStatementArray(
            scope,
            "variable",
            writable,
            makeLiteralExpression("init"),
          ),
          [makeReturnStatement(makeLiteralExpression("completion"))],
        ),
      ),
      `
        "script";
        effect(
          intrinsic('aran.setStrict')(
            undefined,
            intrinsic('aran.globalRecord'),
            'variable',
            intrinsic('aran.deadzone'),
          ),
        );
        ${
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
            `
        }
        return 'completion';
      `,
    ),
    null,
  );
});

// static //
forEach([true, false], (writable) => {
  assertEqual(
    allignBlock(
      makeScopeBlock(initializeScope(makeRootScope(), true), [], (scope) =>
        concat(
          makeRigidDeclareStatementArray(scope, "variable", writable, [
            "specifier",
          ]),
          makeRigidInitializeStatementArray(
            scope,
            "variable",
            writable,
            makeLiteralExpression("init"),
          ),
        ),
      ),
      `
        {
          let variable;
          (
            variable = "init",
            exportStatic('specifier', "init")
          );
        }
      `,
    ),
    null,
  );
});

////////////
// Import //
////////////

assertEqual(
  allignBlock(
    makeScopeBlock(initializeScope(makeRootScope(), true), [], (scope) => {
      declareImportVariable(scope, "variable", "source", "specifier");
      return [
        makeEffectStatement(
          makeExpressionEffect(
            makeLookupExpression(scope, "variable", {
              ...callbacks,
              onStaticHit: (read, _write) => read(),
            }),
          ),
        ),
      ];
    }),
    "{ effect(importStatic('source', 'specifier')); }",
  ),
  null,
);
