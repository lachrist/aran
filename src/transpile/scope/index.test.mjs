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

const createContext = ({
  strict = STRICT,
  scope = ROOT_SCOPE,
  counter = createCounter(0),
}) => ({
  strict,
  scope,
  counter,
});

////////////////////////////
// makeScopeScriptProgram //
////////////////////////////

// meta //
assertSuccess(
  allignProgram(
    makeScopeScriptProgram(createContext({strict: true}), ENCLAVE, (scope) => {
      const context = createContext({strict: true, scope});
      const variable1 = declareMeta(context, "variable1");
      const variable2 = declareMetaMacro(
        context,
        "variable2",
        makeLiteralExpression("binding"),
      );
      return [
        makeEffectStatement(
          makeMetaInitializeEffect(
            context,
            variable1,
            makeLiteralExpression("right"),
          ),
        ),
        makeEffectStatement(
          makeExpressionEffect(makeMetaReadExpression(context, variable1)),
        ),
        makeEffectStatement(
          makeExpressionEffect(makeMetaReadExpression(context, variable2)),
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
    makeScopeScriptProgram(createContext({}), ENCLAVE, (scope) => {
      const context = createContext({scope});
      assertEqual(
        declareSpecMacro(
          context,
          "this",
          makeIntrinsicExpression("aran.globalObject"),
        ),
        undefined,
      );
      assertEqual(declareSpecIllegal(context, "import.meta"), undefined);
      assertThrow(() => makeSpecReadExpression(context, "import.meta"), {
        name: "Error",
        message: "Illegal import.meta",
      });
      return [
        makeEffectStatement(
          makeExpressionEffect(makeSpecReadExpression(context, "this")),
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
    makeScopeScriptProgram(createContext({strict: true}), true, (scope) => {
      const context = createContext({strict: true, scope});
      assertEqual(declareBase(context, "let", "variable", []), undefined);
      return concat(
        makeBaseInitializeStatementArray(
          context,
          "let",
          "variable",
          makeLiteralExpression("init"),
        ),
        [
          makeEffectStatement(
            makeExpressionEffect(makeBaseReadExpression(context, "variable")),
          ),
          makeEffectStatement(
            makeExpressionEffect(makeBaseTypeofExpression(context, "variable")),
          ),
          makeEffectStatement(
            makeExpressionEffect(
              makeBaseDiscardExpression(context, "variable"),
            ),
          ),
          makeEffectStatement(
            makeBaseWriteEffect(
              context,
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
    makeScopeScriptProgram({strict: false}, false, (scope) => {
      const context = createContext({strict: false, scope});
      assertEqual(declareBase(context, "let", "variable", []), undefined);
      return concat(
        makeBaseInitializeStatementArray(
          context,
          "let",
          "variable",
          makeLiteralExpression("init"),
        ),
        [
          makeEffectStatement(
            makeExpressionEffect(makeBaseReadExpression(context, "variable")),
          ),
          makeEffectStatement(
            makeExpressionEffect(makeBaseTypeofExpression(context, "variable")),
          ),
          makeEffectStatement(
            makeExpressionEffect(
              makeBaseDiscardExpression(context, "variable"),
            ),
          ),
          makeEffectStatement(
            makeBaseWriteEffect(
              context,
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
    makeScopeModuleProgram(
      createContext({strict: true}),
      ENCLAVE,
      [],
      (scope) => {
        const context = createContext({strict: true, scope});
        const variable1 = declareMeta(context, "variable1");
        const variable2 = declareMetaMacro(
          context,
          "variable2",
          makeLiteralExpression("binding"),
        );
        return [
          makeEffectStatement(
            makeMetaInitializeEffect(
              context,
              variable1,
              makeLiteralExpression("right"),
            ),
          ),
          makeEffectStatement(
            makeExpressionEffect(makeMetaReadExpression(context, variable1)),
          ),
          makeEffectStatement(
            makeExpressionEffect(makeMetaReadExpression(context, variable2)),
          ),
          makeReturnStatement(makeLiteralExpression("completion")),
        ];
      },
    ),
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
    makeScopeModuleProgram(
      createContext({strict: true}),
      ENCLAVE,
      [],
      (scope) => {
        const context = createContext({strict: true, scope});
        assertEqual(
          declareSpecMacro(
            context,
            "this",
            makeIntrinsicExpression("aran.globalObject"),
          ),
          undefined,
        );
        assertEqual(declareSpecIllegal(context, "new.target"), undefined);
        assertThrow(() => makeSpecReadExpression(context, "new.target"), {
          name: "Error",
          message: "Illegal new.target",
        });
        assertEqual(declareSpec(context, "import.meta"), undefined);
        return [
          makeEffectStatement(
            makeSpecInitializeEffect(
              context,
              "import.meta",
              makeLiteralExpression("init"),
            ),
          ),
          makeEffectStatement(
            makeExpressionEffect(makeSpecReadExpression(context, "this")),
          ),
          makeEffectStatement(
            makeExpressionEffect(
              makeSpecReadExpression(context, "import.meta"),
            ),
          ),
          makeReturnStatement(makeLiteralExpression("completion")),
        ];
      },
    ),
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
      createContext({strict: true}),
      ENCLAVE,
      [makeImportLink("source", "imported"), makeExportLink("exported")],
      (scope) => {
        const context = createContext({strict: true, scope});
        assertEqual(
          declareBase(context, "let", "variable1", ["exported"]),
          undefined,
        );
        assertEqual(
          declareBaseImport(context, "variable2", "source", "imported"),
          undefined,
        );
        return concat(
          makeBaseInitializeStatementArray(
            context,
            "let",
            "variable1",
            makeLiteralExpression("init"),
          ),
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeBaseReadExpression(context, "variable1"),
              ),
            ),
            makeEffectStatement(
              makeExpressionEffect(
                makeBaseTypeofExpression(context, "variable1"),
              ),
            ),
            makeEffectStatement(
              makeExpressionEffect(
                makeBaseDiscardExpression(context, "variable1"),
              ),
            ),
            makeEffectStatement(
              makeBaseWriteEffect(
                context,
                "variable1",
                makeLiteralExpression("right"),
              ),
            ),
            makeEffectStatement(
              makeExpressionEffect(
                makeBaseReadExpression(context, "variable2"),
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
      createContext({strict: true}),
      true,
      ["this"],
      (scope) => {
        const context = createContext({strict: true, scope});
        return [
          makeEffectStatement(
            makeExpressionEffect(makeBaseReadExpression(context, "variable")),
          ),
          makeReturnStatement(makeLiteralExpression("completion")),
        ];
      },
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
      makeScopeGlobalEvalProgram(
        createContext({strict: false}),
        true,
        (scope) => {
          const context = createContext({strict: false, scope});
          assertEqual(declareBase(context, "let", "variable1", []), undefined);
          const statements1 = makeBaseInitializeStatementArray(
            context,
            "let",
            "variable1",
            makeLiteralExpression("init1"),
          );
          const statements2 = [
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeEvalExpression(context, makeLiteralExpression("code")),
              ),
            ),
          ];
          serialized_scope = stringifyJSON(packScope(scope));
          return concat(statements1, statements2, [
            makeReturnStatement(makeLiteralExpression("completion")),
          ]);
        },
      ),
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
        createContext({
          strict: false,
          scope: unpackScope(parseJSON(serialized_scope)),
        }),
        false,
        (scope) => {
          const context = createContext({strict: false, scope});
          assertEqual(declareBase(context, "let", "variable2", []), undefined);
          assertEqual(declareBase(context, "var", "variable3", []), undefined);
          return concat(
            [
              makeEffectStatement(
                makeExpressionEffect(
                  makeBaseReadExpression(context, "variable1"),
                ),
              ),
            ],
            makeBaseInitializeStatementArray(
              context,
              "let",
              "variable2",
              makeLiteralExpression("init2"),
            ),
            makeBaseInitializeStatementArray(
              context,
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
    makeScopeGlobalEvalProgram(createContext({}), true, (scope1) => {
      const context1 = createContext({scope: scope1});
      return [
        makeBlockStatement(
          makeScopeDynamicClosureBlock(
            context1,
            ["label"],
            makeLiteralExpression("frame"),
            (scope2) => {
              const context2 = createContext({scope: scope2});
              return [
                makeEffectStatement(
                  makeExpressionEffect(
                    makeBaseReadExpression(context2, "variable"),
                  ),
                ),
              ];
            },
          ),
        ),
        makeBlockStatement(
          makeScopeDynamicWithBlock(
            context1,
            ["label"],
            makeLiteralExpression("frame"),
            (scope2) => {
              const context2 = createContext({scope: scope2});
              return [
                makeEffectStatement(
                  makeExpressionEffect(
                    makeBaseReadExpression(context2, "variable"),
                  ),
                ),
              ];
            },
          ),
        ),
        makeReturnStatement(makeLiteralExpression("completion")),
      ];
    }),
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
    makeScopeGlobalEvalProgram(createContext({}), ENCLAVE, (scope1) => {
      const context1 = createContext({scope: scope1});
      return [
        makeEffectStatement(
          makeExpressionEffect(
            makeScopeClosureExpression(
              context1,
              "arrow",
              false,
              false,
              (scope2) => {
                const context2 = createContext({scope: scope2});
                return [
                  makeBlockStatement(
                    makeScopeStaticClosureBlock(
                      context2,
                      ["label"],
                      (_scope3) => [],
                    ),
                  ),
                  makeReturnStatement(makeLiteralExpression("completion")),
                ];
              },
            ),
          ),
        ),
        makeReturnStatement(makeLiteralExpression("completion")),
      ];
    }),
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
    makeScopeGlobalEvalProgram(createContext({}), ENCLAVE, (scope1) => {
      const context1 = createContext({scope: scope1});
      return [
        makeBlockStatement(
          makeScopeDeadBlock(context1, ["label"], (scope2) => {
            const context2 = createContext({scope: scope2});
            assertEqual(
              declareBase(context2, "let", "variable", []),
              undefined,
            );
            return [
              makeEffectStatement(
                makeExpressionEffect(
                  makeBaseReadExpression(context2, "variable"),
                ),
              ),
            ];
          }),
        ),
        makeReturnStatement(makeLiteralExpression("completion")),
      ];
    }),
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
    makeScopeGlobalEvalProgram(createContext({}), ENCLAVE, (scope1) => {
      const context1 = createContext({scope: scope1});
      return [
        makeBlockStatement(
          makeScopeDistantBlock(context1, ["label1"], (scope2) => {
            const context2 = createContext({scope: scope2});
            assertEqual(
              declareBase(context2, "let", "variable", []),
              undefined,
            );
            return [
              makeBlockStatement(
                makeScopeEmptyBlock(context2, ["label2"], (scope3) => {
                  const context3 = createContext({scope: scope3});
                  return makeBaseInitializeStatementArray(
                    context3,
                    "let",
                    "variable",
                    makeLiteralExpression("init"),
                  );
                }),
              ),
              makeEffectStatement(
                makeExpressionEffect(
                  makeBaseReadExpression(context2, "variable"),
                ),
              ),
            ];
          }),
        ),
        makeReturnStatement(makeLiteralExpression("completion")),
      ];
    }),
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
    makeScopeGlobalEvalProgram(
      createContext({strict: false}),
      false,
      (scope) => {
        const context = createContext({strict: false, scope});
        assertEqual(declareBase(context, "let", "variable", []), undefined);
        return concat(
          [
            makeEffectStatement(
              makeBaseWriteEffect(
                context,
                "variable",
                makeLiteralExpression("right"),
              ),
            ),
          ],
          [
            makeEffectStatement(
              makeBaseMacroWriteEffect(
                context,
                "variable",
                makeLiteralExpression("right"),
              ),
            ),
          ],
          makeBaseInitializeStatementArray(
            context,
            "let",
            "variable",
            makeLiteralExpression("init"),
          ),
          [makeReturnStatement(makeLiteralExpression("completion"))],
        );
      },
    ),
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
    makeScopeGlobalEvalProgram(
      createContext({strict: false}),
      true,
      (scope1) => {
        const context1 = createContext({strict: false, scope: scope1});
        return [
          makeBlockStatement(
            makeScopeDynamicClosureBlock(
              context1,
              [],
              makeLiteralExpression("frame"),
              (scope2) => {
                const context2 = createContext({strict: false, scope: scope2});
                return [
                  makeEffectStatement(
                    makeBaseWriteEffect(
                      context2,
                      "variable",
                      makeLiteralExpression("right"),
                    ),
                  ),
                  makeEffectStatement(
                    makeBaseMacroWriteEffect(
                      context2,
                      "variable",
                      makeLiteralExpression("right"),
                    ),
                  ),
                ];
              },
            ),
          ),
          makeReturnStatement(makeLiteralExpression("completion")),
        ];
      },
    ),
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
