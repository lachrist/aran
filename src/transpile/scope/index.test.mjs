import {concat} from "array-lite";

import {assertEqual, assertSuccess, assertThrow} from "../../__fixture__.mjs";

import {
  makeBlockStatement,
  makeExportLink,
  makeImportLink,
  makeIntrinsicExpression,
  makeLiteralExpression,
  makeReturnStatement,
  makeEffectStatement,
  makeExpressionEffect,
} from "../../ast/index.mjs";

import {createCounter} from "../../util/index.mjs";

import {allignProgram} from "../../allign/index.mjs";

import {
  ROOT_SCOPE,
  packScope,
  unpackScope,
  makeScopeEvalExpression,
  declareMeta,
  declareMetaMacro,
  makeMetaReadExpression,
  makeMetaInitializeEffect,
  // makeMetaWriteEffect,
  declareSpecMacro,
  declareSpecIllegal,
  declareSpec,
  makeSpecInitializeEffect,
  makeSpecReadExpression,
  declareBaseImport,
  declareBase,
  makeBaseInitializeStatementArray,
  makeBaseReadExpression,
  makeBaseTypeofExpression,
  makeBaseDiscardExpression,
  makeBaseMacroWriteEffect,
  makeBaseWriteEffect,
  makeScopeDynamicClosureBlock,
  makeScopeDynamicWithBlock,
  makeScopeExternalLocalEvalProgram,
  makeScopeScriptProgram,
  makeScopeModuleProgram,
  makeScopeGlobalEvalProgram,
  // makeScopeBlock,
  makeScopeDistantBlock,
  makeScopeDeadBlock,
  makeScopeEmptyBlock,
  makeScopeStaticClosureBlock,
  makeScopeClosureExpression,
  makeScopeInternalLocalEvalProgram,
} from "./index.mjs";

const {
  undefined,
  JSON: {parse: parseJSON, stringify: stringifyJSON},
} = globalThis;

const STRICT = true;

const ENCLAVE = true;

////////////////////////////
// makeScopeScriptProgram //
////////////////////////////

// meta //
assertSuccess(
  allignProgram(
    makeScopeScriptProgram(true, ROOT_SCOPE, ENCLAVE, (scope) => {
      const variable1 = declareMeta(true, scope, createCounter(0), "variable1");
      const variable2 = declareMetaMacro(
        true,
        scope,
        createCounter(0),
        "variable2",
        makeLiteralExpression("binding"),
      );
      return [
        makeEffectStatement(
          makeMetaInitializeEffect(
            true,
            scope,
            variable1,
            makeLiteralExpression("right"),
          ),
        ),
        makeEffectStatement(
          makeExpressionEffect(makeMetaReadExpression(true, scope, variable1)),
        ),
        makeEffectStatement(
          makeExpressionEffect(makeMetaReadExpression(true, scope, variable2)),
        ),
        makeReturnStatement(makeLiteralExpression("completion")),
      ];
    }),
    `
      "script";
      effect(
        intrinsic.aran.setStrict(
          intrinsic.aran.globalCache,
          "01_variable1",
          "right",
        ),
      );
      effect(
        intrinsic.aran.get(
          intrinsic.aran.globalCache,
          "01_variable1",
        ),
      );
      effect("binding");
      return "completion";
    `,
  ),
);

// spec //
assertSuccess(
  allignProgram(
    makeScopeScriptProgram(STRICT, ROOT_SCOPE, ENCLAVE, (scope) => {
      assertEqual(
        declareSpecMacro(
          STRICT,
          scope,
          "this",
          makeIntrinsicExpression("aran.globalObject"),
        ),
        undefined,
      );
      assertEqual(declareSpecIllegal(STRICT, scope, "import.meta"), undefined);
      assertThrow(() => makeSpecReadExpression(STRICT, scope, "import.meta"), {
        name: "Error",
        message: "Illegal import.meta",
      });
      return [
        makeEffectStatement(
          makeExpressionEffect(makeSpecReadExpression(STRICT, scope, "this")),
        ),
        makeReturnStatement(makeLiteralExpression("completion")),
      ];
    }),
    `
      "script";
      effect(intrinsic.aran.globalObject);
      return "completion";
    `,
  ),
);

// base strict enclave //
assertSuccess(
  allignProgram(
    makeScopeScriptProgram(true, ROOT_SCOPE, true, (scope) => {
      assertEqual(declareBase(true, scope, "let", "variable", []), undefined);
      return concat(
        makeBaseInitializeStatementArray(
          true,
          scope,
          "let",
          "variable",
          makeLiteralExpression("init"),
        ),
        [
          makeEffectStatement(
            makeExpressionEffect(
              makeBaseReadExpression(true, scope, "variable"),
            ),
          ),
          makeEffectStatement(
            makeExpressionEffect(
              makeBaseTypeofExpression(true, scope, "variable"),
            ),
          ),
          makeEffectStatement(
            makeExpressionEffect(
              makeBaseDiscardExpression(true, scope, "variable"),
            ),
          ),
          makeEffectStatement(
            makeBaseWriteEffect(
              true,
              scope,
              createCounter(0),
              "variable",
              makeLiteralExpression("right"),
            ),
          ),
          makeReturnStatement(makeLiteralExpression("completion")),
        ],
      );
    }),
    `
      "script";
      let variable = "init";
      effect(intrinsic.aran.readGlobal("variable"));
      effect(intrinsic.aran.typeofGlobal("variable"));
      effect(
        (
          ("delete unqualified identifier should never happen in strict mode")
          ("variable")
        ),
      );
      effect(intrinsic.aran.writeGlobalStrict("variable", "right"));
      return "completion";
    `,
  ),
);

// base sloppy refied //
assertSuccess(
  allignProgram(
    makeScopeScriptProgram(false, ROOT_SCOPE, false, (scope) => {
      assertEqual(declareBase(false, scope, "let", "variable", []), undefined);
      return concat(
        makeBaseInitializeStatementArray(
          false,
          scope,
          "let",
          "variable",
          makeLiteralExpression("init"),
        ),
        [
          makeEffectStatement(
            makeExpressionEffect(
              makeBaseReadExpression(false, scope, "variable"),
            ),
          ),
          makeEffectStatement(
            makeExpressionEffect(
              makeBaseTypeofExpression(false, scope, "variable"),
            ),
          ),
          makeEffectStatement(
            makeExpressionEffect(
              makeBaseDiscardExpression(false, scope, "variable"),
            ),
          ),
          makeEffectStatement(
            makeBaseWriteEffect(
              false,
              scope,
              createCounter(0),
              "variable",
              makeLiteralExpression("right"),
            ),
          ),
          makeReturnStatement(makeLiteralExpression("completion")),
        ],
      );
    }),
    `
      "script";
      effect(
        (
          intrinsic.aran.binary(
            "in",
            "variable",
            intrinsic.aran.globalRecord
          ) ?
          intrinsic.aran.throw(
            new intrinsic.SyntaxError(
              "Variable 'variable' has already been declared"
            ),
          ) :
          undefined
        ),
      );
      effect(
        intrinsic.Reflect.defineProperty(
          intrinsic.aran.globalRecord,
          "variable",
          intrinsic.aran.createObject(
            null,
            "value", intrinsic.aran.deadzone,
            "writable", true,
            "enumerable", true,
            "configurable", false
          ),
        ),
      );
      effect(
        intrinsic.Reflect.defineProperty(
          intrinsic.aran.globalRecord,
          "variable",
          intrinsic.aran.createObject(
            null,
            "value", "init",
            "writable", true,
            "enumerable", true,
            "configurable", false
          ),
        ),
      );
      effect(
        intrinsic.aran.get(
          intrinsic.aran.globalRecord,
          "variable",
        ),
      );
      effect(
        intrinsic.aran.unary(
          "typeof",
          intrinsic.aran.get(
            intrinsic.aran.globalRecord,
            "variable",
          ),
        )
      );
      effect(
        intrinsic.aran.deleteSloppy(
          intrinsic.aran.globalRecord,
          "variable",
        ),
      );
      effect(
        intrinsic.aran.setStrict(
          intrinsic.aran.globalRecord,
          "variable",
          "right"
        ),
      );
      return "completion";
    `,
  ),
);

////////////////////////////
// makeScopeModuleProgram //
////////////////////////////

// meta //
assertSuccess(
  allignProgram(
    makeScopeModuleProgram(true, ROOT_SCOPE, ENCLAVE, [], (scope) => {
      const variable1 = declareMeta(true, scope, createCounter(0), "variable1");
      const variable2 = declareMetaMacro(
        true,
        scope,
        createCounter(0),
        "variable2",
        makeLiteralExpression("binding"),
      );
      return [
        makeEffectStatement(
          makeMetaInitializeEffect(
            true,
            scope,
            variable1,
            makeLiteralExpression("right"),
          ),
        ),
        makeEffectStatement(
          makeExpressionEffect(makeMetaReadExpression(true, scope, variable1)),
        ),
        makeEffectStatement(
          makeExpressionEffect(makeMetaReadExpression(true, scope, variable2)),
        ),
        makeReturnStatement(makeLiteralExpression("completion")),
      ];
    }),
    `
      "module";
      {
        let VARIABLE;
        VARIABLE = "right";
        effect(VARIABLE);
        effect("binding");
        return "completion";
      }
    `,
  ),
);

// spec //
assertSuccess(
  allignProgram(
    makeScopeModuleProgram(true, ROOT_SCOPE, ENCLAVE, [], (scope) => {
      assertEqual(
        declareSpecMacro(
          true,
          scope,
          "this",
          makeIntrinsicExpression("aran.globalObject"),
        ),
        undefined,
      );
      assertEqual(declareSpecIllegal(true, scope, "new.target"), undefined);
      assertThrow(() => makeSpecReadExpression(true, scope, "new.target"), {
        name: "Error",
        message: "Illegal new.target",
      });
      assertEqual(declareSpec(true, scope, "import.meta"), undefined);
      return [
        makeEffectStatement(
          makeSpecInitializeEffect(
            true,
            scope,
            "import.meta",
            makeLiteralExpression("init"),
          ),
        ),
        makeEffectStatement(
          makeExpressionEffect(makeSpecReadExpression(true, scope, "this")),
        ),
        makeEffectStatement(
          makeExpressionEffect(
            makeSpecReadExpression(true, scope, "import.meta"),
          ),
        ),
        makeReturnStatement(makeLiteralExpression("completion")),
      ];
    }),
    `
      "module";
      {
        let IMPORT_META;
        IMPORT_META = "init";
        effect(intrinsic.aran.globalObject);
        effect(IMPORT_META);
        return "completion";
      }
    `,
  ),
);

// base //
assertSuccess(
  allignProgram(
    makeScopeModuleProgram(
      true,
      ROOT_SCOPE,
      ENCLAVE,
      [makeImportLink("source", "imported"), makeExportLink("exported")],
      (scope) => {
        assertEqual(
          declareBase(true, scope, "let", "variable1", ["exported"]),
          undefined,
        );
        assertEqual(
          declareBaseImport(true, scope, "variable2", "source", "imported"),
          undefined,
        );
        return concat(
          makeBaseInitializeStatementArray(
            true,
            scope,
            "let",
            "variable1",
            makeLiteralExpression("init"),
          ),
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeBaseReadExpression(true, scope, "variable1"),
              ),
            ),
            makeEffectStatement(
              makeExpressionEffect(
                makeBaseTypeofExpression(true, scope, "variable1"),
              ),
            ),
            makeEffectStatement(
              makeExpressionEffect(
                makeBaseDiscardExpression(true, scope, "variable1"),
              ),
            ),
            makeEffectStatement(
              makeBaseWriteEffect(
                true,
                scope,
                createCounter(0),
                "variable1",
                makeLiteralExpression("right"),
              ),
            ),
            makeEffectStatement(
              makeExpressionEffect(
                makeBaseReadExpression(true, scope, "variable2"),
              ),
            ),
            makeReturnStatement(makeLiteralExpression("completion")),
          ],
        );
      },
    ),
    `
      "module";
      import { imported } from "source";
      export { exported };
      {
        let VARIABLE;
        VARIABLE = "init";
        exportStatic("exported", VARIABLE);
        effect(VARIABLE);
        effect(intrinsic.aran.unary("typeof", VARIABLE));
        effect(
          intrinsic.aran.throw(
            new intrinsic.TypeError(
              "Cannot discard variable 'variable1' because it is static",
            ),
          ),
        );
        (
          VARIABLE = "right",
          exportStatic("exported", VARIABLE)
        );
        effect(
          importStatic("source", "imported"),
        );
        return "completion";
      }
    `,
  ),
);

///////////////////////////////////////
// makeScopeExternalLocalEvalProgram //
///////////////////////////////////////

assertSuccess(
  allignProgram(
    makeScopeExternalLocalEvalProgram(
      true,
      ROOT_SCOPE,
      true,
      ["this"],
      createCounter(0),
      (scope) => [
        makeEffectStatement(
          makeExpressionEffect(makeBaseReadExpression(true, scope, "variable")),
        ),
        makeReturnStatement(makeLiteralExpression("completion")),
      ],
    ),
    `
      "external";
      ["this"];
      {
        let INPUT;
        INPUT = input;
        effect(
          (intrinsic.aran.get(INPUT, "scope.read"))("variable"),
        );
        return "completion";
      }
    `,
  ),
);

/////////////////////////////////////////////////////////////////////
// makeScopeInternalLocalEvalProgram && makeScopeGlobalEvalProgram //
/////////////////////////////////////////////////////////////////////

{
  let serialized_scope = null;
  assertSuccess(
    allignProgram(
      makeScopeGlobalEvalProgram(false, ROOT_SCOPE, true, (scope) => {
        assertEqual(
          declareBase(false, scope, "let", "variable1", []),
          undefined,
        );
        const statements1 = makeBaseInitializeStatementArray(
          false,
          scope,
          "let",
          "variable1",
          makeLiteralExpression("init1"),
        );
        const statements2 = [
          makeEffectStatement(
            makeExpressionEffect(
              makeScopeEvalExpression(
                false,
                scope,
                makeLiteralExpression("code"),
              ),
            ),
          ),
        ];
        serialized_scope = stringifyJSON(packScope(scope));
        return concat(statements1, statements2, [
          makeReturnStatement(makeLiteralExpression("completion")),
        ]);
      }),
      `
        "eval";
        {
          let VARIABLE1;
          VARIABLE1 = "init1";
          effect(eval([VARIABLE1], "code"));
          return "completion";
        }
      `,
    ),
  );
  assertSuccess(
    allignProgram(
      makeScopeInternalLocalEvalProgram(
        false,
        unpackScope(parseJSON(serialized_scope)),
        false,
        (scope) => {
          assertEqual(
            declareBase(false, scope, "let", "variable2", []),
            undefined,
          );
          assertEqual(
            declareBase(false, scope, "var", "variable3", []),
            undefined,
          );
          return concat(
            [
              makeEffectStatement(
                makeExpressionEffect(
                  makeBaseReadExpression(false, scope, "variable1"),
                ),
              ),
            ],
            makeBaseInitializeStatementArray(
              false,
              scope,
              "let",
              "variable2",
              makeLiteralExpression("init2"),
            ),
            makeBaseInitializeStatementArray(
              false,
              scope,
              "var",
              "variable3",
              makeLiteralExpression("init3"),
            ),
            [makeReturnStatement(makeLiteralExpression("completion"))],
          );
        },
      ),
      `
        "internal";
        let VARIABLE1;
        {
          let VARIABLE2;
          effect(VARIABLE1);
          VARIABLE2 = "init2";
          var variable3 = "init3";
          return "completion";
        }
      `,
    ),
  );
}

///////////////////////////////////////////////////////////////
// makeScopeDynamicClosureBlock && makeScopeDynamicWithBlock //
///////////////////////////////////////////////////////////////

assertSuccess(
  allignProgram(
    makeScopeGlobalEvalProgram(STRICT, ROOT_SCOPE, true, (scope1) => [
      makeBlockStatement(
        makeScopeDynamicClosureBlock(
          STRICT,
          scope1,
          ["label"],
          makeLiteralExpression("frame"),
          (scope2) => [
            makeEffectStatement(
              makeExpressionEffect(
                makeBaseReadExpression(STRICT, scope2, "variable"),
              ),
            ),
          ],
        ),
      ),
      makeBlockStatement(
        makeScopeDynamicWithBlock(
          STRICT,
          scope1,
          ["label"],
          makeLiteralExpression("frame"),
          (scope2) => [
            makeEffectStatement(
              makeExpressionEffect(
                makeBaseReadExpression(STRICT, scope2, "variable"),
              ),
            ),
          ],
        ),
      ),
      makeReturnStatement(makeLiteralExpression("completion")),
    ]),
    `
    "eval";
    {
      label: {
        effect(
          (
            intrinsic.aran.binary("in", "variable", "frame") ?
            intrinsic.aran.get("frame", "variable") :
            intrinsic.aran.readGlobal("variable")
          ),
        );
      }
      label: {
        effect(
          (
            (
              intrinsic.aran.get("frame", intrinsic.Symbol.unscopables) ?
              (
                intrinsic.aran.get(
                  intrinsic.aran.get("frame", intrinsic.Symbol.unscopables),
                  "variable"
                ) ?
                false :
                intrinsic.aran.binary("in", "variable", "frame")
              ) :
              intrinsic.aran.binary("in", "variable", "frame")
            ) ?
            intrinsic.aran.get("frame", "variable") :
            intrinsic.aran.readGlobal("variable")
          ),
        );
      }
      return "completion";
    }
  `,
  ),
);

///////////////////////////////////////////////////////////////
// makeScopeStaticClosureBlock && makeScopeClosureExpression //
///////////////////////////////////////////////////////////////

assertSuccess(
  allignProgram(
    makeScopeGlobalEvalProgram(STRICT, ROOT_SCOPE, ENCLAVE, (scope1) => [
      makeEffectStatement(
        makeExpressionEffect(
          makeScopeClosureExpression(
            STRICT,
            scope1,
            "arrow",
            false,
            false,
            (scope2) => [
              makeBlockStatement(
                makeScopeStaticClosureBlock(
                  STRICT,
                  scope2,
                  ["label"],
                  (_scope3) => [],
                ),
              ),
              makeReturnStatement(makeLiteralExpression("completion")),
            ],
          ),
        ),
      ),
      makeReturnStatement(makeLiteralExpression("completion")),
    ]),
    `
    "eval";
    {
      effect(
        () => {
          label: {}
          return "completion";
        },
      );
      return "completion";
    }
  `,
  ),
);

////////////////////////
// makeScopeDeadBlock //
////////////////////////

assertSuccess(
  allignProgram(
    makeScopeGlobalEvalProgram(STRICT, ROOT_SCOPE, ENCLAVE, (scope1) => [
      makeBlockStatement(
        makeScopeDeadBlock(STRICT, scope1, ["label"], (scope2) => {
          assertEqual(
            declareBase(STRICT, scope2, "let", "variable", []),
            undefined,
          );
          return [
            makeEffectStatement(
              makeExpressionEffect(
                makeBaseReadExpression(STRICT, scope2, "variable"),
              ),
            ),
          ];
        }),
      ),
      makeReturnStatement(makeLiteralExpression("completion")),
    ]),
    `
    "eval";
    {
      label: {
        effect(
          intrinsic.aran.throw(
            new intrinsic.ReferenceError(
              "Cannot access variable 'variable' before initialization",
            ),
          ),
        );
      }
      return "completion";
    }
  `,
  ),
);

///////////////////////////
// makeScopeDistantBlock //
///////////////////////////

assertSuccess(
  allignProgram(
    makeScopeGlobalEvalProgram(STRICT, ROOT_SCOPE, ENCLAVE, (scope1) => [
      makeBlockStatement(
        makeScopeDistantBlock(STRICT, scope1, ["label1"], (scope2) => {
          assertEqual(
            declareBase(STRICT, scope2, "let", "variable", []),
            undefined,
          );
          return [
            makeBlockStatement(
              makeScopeEmptyBlock(STRICT, scope2, ["label2"], (scope3) =>
                makeBaseInitializeStatementArray(
                  STRICT,
                  scope3,
                  "let",
                  "variable",
                  makeLiteralExpression("init"),
                ),
              ),
            ),
            makeEffectStatement(
              makeExpressionEffect(
                makeBaseReadExpression(STRICT, scope2, "variable"),
              ),
            ),
          ];
        }),
      ),
      makeReturnStatement(makeLiteralExpression("completion")),
    ]),
    `
      "eval";
      {
        label1: {
          let VARIABLE, _VARIABLE;
          _VARIABLE = false;
          label2: {
            VARIABLE = "init";
            _VARIABLE = true;
          }
          effect(
            (
              _VARIABLE ?
              VARIABLE :
              intrinsic.aran.throw(
                new intrinsic.ReferenceError(
                  "Cannot access variable 'variable' before initialization",
                ),
              )
            ),
          );
        }
        return "completion";
      }
    `,
  ),
);

///////////
// Write //
///////////

assertSuccess(
  allignProgram(
    makeScopeGlobalEvalProgram(false, ROOT_SCOPE, false, (scope) => {
      assertEqual(declareBase(false, scope, "let", "variable", []), undefined);
      return concat(
        [
          makeEffectStatement(
            makeBaseWriteEffect(
              false,
              scope,
              createCounter(0),
              "variable",
              makeLiteralExpression("right"),
            ),
          ),
        ],
        [
          makeEffectStatement(
            makeBaseMacroWriteEffect(
              false,
              scope,
              "variable",
              makeLiteralExpression("right"),
            ),
          ),
        ],
        makeBaseInitializeStatementArray(
          false,
          scope,
          "let",
          "variable",
          makeLiteralExpression("init"),
        ),
        [makeReturnStatement(makeLiteralExpression("completion"))],
      );
    }),
    `
    "eval";
    {
      let VARIABLE;
      (
        effect("right"),
        effect(
          intrinsic.aran.throw(
            new intrinsic.ReferenceError(
              "Cannot access variable 'variable' before initialization",
            ),
          ),
        )
      );
      effect(
        intrinsic.aran.throw(
          new intrinsic.ReferenceError(
            "Cannot access variable 'variable' before initialization",
          ),
        ),
      );
      VARIABLE = "init";
      return "completion";
    }
  `,
  ),
);

assertSuccess(
  allignProgram(
    makeScopeGlobalEvalProgram(false, ROOT_SCOPE, true, (scope1) => [
      makeBlockStatement(
        makeScopeDynamicClosureBlock(
          false,
          scope1,
          [],
          makeLiteralExpression("frame"),
          (scope2) => [
            makeEffectStatement(
              makeBaseWriteEffect(
                false,
                scope2,
                createCounter(0),
                "variable",
                makeLiteralExpression("right"),
              ),
            ),
            makeEffectStatement(
              makeBaseMacroWriteEffect(
                false,
                scope2,
                "variable",
                makeLiteralExpression("right"),
              ),
            ),
          ],
        ),
      ),
      makeReturnStatement(makeLiteralExpression("completion")),
    ]),
    `
    "eval";
    {
      {
        let RIGHT;
        (
          RIGHT = "right",
          (
            intrinsic.aran.binary("in", "variable", "frame") ?
            effect(intrinsic.aran.setSloppy("frame", "variable", RIGHT)) :
            effect(intrinsic.aran.writeGlobalSloppy("variable", RIGHT))
          )
        );
        (
          intrinsic.aran.binary("in", "variable", "frame") ?
          effect(intrinsic.aran.setSloppy("frame", "variable", "right")) :
          effect(intrinsic.aran.writeGlobalSloppy("variable", "right"))
        );
      }
      return "completion";
    }
  `,
  ),
);
