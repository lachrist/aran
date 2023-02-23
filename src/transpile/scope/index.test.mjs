import { concat } from "array-lite";

import { assertEqual, assertSuccess, assertThrow } from "../../__fixture__.mjs";

import { createCounter } from "../../util/index.mjs";

import {
  makeDebuggerStatement,
  makeBlockStatement,
  makeExportLink,
  makeImportLink,
  makeIntrinsicExpression,
  makeLiteralExpression,
  makeReturnStatement,
  makeEffectStatement,
  makeExpressionEffect,
} from "../../ast/index.mjs";

import { allignProgram } from "../../allign/index.mjs";

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
  makeScopeNormalStaticBlock,
  makeScopeClosureDynamicBlock,
  makeScopeWithDynamicBlock,
  makeScopeLocalEvalProgram,
  makeScopeGlobalEvalProgram,
  makeScopeScriptProgram,
  makeScopeModuleProgram,
  makeScopeDeadStaticBlock,
  makeScopeDistantStaticBlock,
  makeScopeClosureStaticBlock,
  makeScopeClosureExpression,
} from "./index.mjs";

const {
  undefined,
  JSON: { parse: parseJSON, stringify: stringifyJSON },
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
  root: { counter },
});

////////////////////////////
// makeScopeScriptProgram //
////////////////////////////

// meta //
assertSuccess(
  allignProgram(
    makeScopeScriptProgram(
      createContext({ strict: true }),
      ENCLAVE,
      (scope) => {
        const scoping = createContext({ strict: true, scope });
        const variable1 = declareMeta(scoping, "variable1");
        const variable2 = declareMetaMacro(
          scoping,
          "variable2",
          makeLiteralExpression("binding"),
        );
        return [
          makeEffectStatement(
            makeMetaInitializeEffect(
              scoping,
              variable1,
              makeLiteralExpression("right"),
            ),
          ),
          makeEffectStatement(
            makeExpressionEffect(makeMetaReadExpression(scoping, variable1)),
          ),
          makeEffectStatement(
            makeExpressionEffect(makeMetaReadExpression(scoping, variable2)),
          ),
          makeReturnStatement(makeLiteralExpression("completion")),
        ];
      },
    ),
    `
      "script";
      void intrinsic.aran.setStrict(
        intrinsic.aran.globalCache,
        "01_variable1",
        "right",
      );
      void intrinsic.aran.get(
        intrinsic.aran.globalCache,
        "01_variable1",
      );
      void "binding";
      return "completion";
    `,
  ),
);

// spec //
assertSuccess(
  allignProgram(
    makeScopeScriptProgram(createContext({}), ENCLAVE, (scope) => {
      const scoping = createContext({ scope });
      assertEqual(
        declareSpecMacro(
          scoping,
          "this",
          makeIntrinsicExpression("aran.globalObject"),
        ),
        undefined,
      );
      assertEqual(declareSpecIllegal(scoping, "import.meta"), undefined);
      assertThrow(() => makeSpecReadExpression(scoping, "import.meta"), {
        name: "SyntaxAranError",
        message: "Illegal import.meta",
      });
      return [
        makeEffectStatement(
          makeExpressionEffect(makeSpecReadExpression(scoping, "this")),
        ),
        makeReturnStatement(makeLiteralExpression("completion")),
      ];
    }),
    `
      "script";
      void intrinsic.aran.globalObject;
      return "completion";
    `,
  ),
);

// base strict enclave //
assertSuccess(
  allignProgram(
    makeScopeScriptProgram(createContext({ strict: true }), true, (scope) => {
      const scoping = createContext({ strict: true, scope });
      assertEqual(declareBase(scoping, "let", "variable", []), undefined);
      assertThrow(
        () =>
          makeEffectStatement(
            makeExpressionEffect(
              makeBaseDiscardExpression(scoping, "variable"),
            ),
          ),
        { name: "EnclaveLimitationAranError" },
      );
      return concat(
        makeBaseInitializeStatementArray(
          scoping,
          "let",
          "variable",
          makeLiteralExpression("init"),
        ),
        [
          makeEffectStatement(
            makeExpressionEffect(makeBaseReadExpression(scoping, "variable")),
          ),
          makeEffectStatement(
            makeExpressionEffect(makeBaseTypeofExpression(scoping, "variable")),
          ),
          makeEffectStatement(
            makeBaseWriteEffect(
              scoping,
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
      let [variable] = "init";
      void [variable];
      void typeof [variable];
      (
        void intrinsic.aran.setStrict(
          intrinsic.aran.globalCache,
          "01_right",
          "right",
        ),
        [variable] = intrinsic.aran.get(
          intrinsic.aran.globalCache,
          "01_right",
        )
      );
      return "completion";
    `,
  ),
);

// base sloppy refied //
assertSuccess(
  allignProgram(
    makeScopeScriptProgram(createContext({ strict: false }), false, (scope) => {
      const scoping = createContext({ strict: false, scope });
      assertEqual(declareBase(scoping, "let", "variable", []), undefined);
      return concat(
        makeBaseInitializeStatementArray(
          scoping,
          "let",
          "variable",
          makeLiteralExpression("init"),
        ),
        [
          makeEffectStatement(
            makeExpressionEffect(makeBaseReadExpression(scoping, "variable")),
          ),
          makeEffectStatement(
            makeExpressionEffect(makeBaseTypeofExpression(scoping, "variable")),
          ),
          makeEffectStatement(
            makeExpressionEffect(
              makeBaseDiscardExpression(scoping, "variable"),
            ),
          ),
          makeEffectStatement(
            makeBaseWriteEffect(
              scoping,
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
      void (
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
      );
      void intrinsic.Reflect.defineProperty(
        intrinsic.aran.globalRecord,
        "variable",
        intrinsic.aran.createObject(
          null,
          "value", intrinsic.aran.deadzone,
          "writable", true,
          "enumerable", true,
          "configurable", false
        ),
      );
      void intrinsic.Reflect.defineProperty(
        intrinsic.aran.globalRecord,
        "variable",
        intrinsic.aran.createObject(
          null,
          "value", "init",
          "writable", true,
          "enumerable", true,
          "configurable", false
        ),
      );
      void intrinsic.aran.get(
        intrinsic.aran.globalRecord,
        "variable",
      );
      void intrinsic.aran.unary(
        "typeof",
        intrinsic.aran.get(
          intrinsic.aran.globalRecord,
          "variable",
        ),
      );
      void intrinsic.aran.deleteSloppy(
        intrinsic.aran.globalRecord,
        "variable",
      );
      void intrinsic.aran.setStrict(
        intrinsic.aran.globalRecord,
        "variable",
        "right"
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
      createContext({ strict: true }),
      ENCLAVE,
      [],
      (scope) => {
        const scoping = createContext({ strict: true, scope });
        const variable1 = declareMeta(scoping, "variable1");
        const variable2 = declareMetaMacro(
          scoping,
          "variable2",
          makeLiteralExpression("binding"),
        );
        return [
          makeEffectStatement(
            makeMetaInitializeEffect(
              scoping,
              variable1,
              makeLiteralExpression("right"),
            ),
          ),
          makeEffectStatement(
            makeExpressionEffect(makeMetaReadExpression(scoping, variable1)),
          ),
          makeEffectStatement(
            makeExpressionEffect(makeMetaReadExpression(scoping, variable2)),
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
        void VARIABLE;
        void "binding";
        return "completion";
      }
    `,
  ),
);

// spec //
assertSuccess(
  allignProgram(
    makeScopeModuleProgram(
      createContext({ strict: true }),
      ENCLAVE,
      [],
      (scope) => {
        const scoping = createContext({ strict: true, scope });
        assertEqual(
          declareSpecMacro(
            scoping,
            "this",
            makeIntrinsicExpression("aran.globalObject"),
          ),
          undefined,
        );
        assertEqual(declareSpecIllegal(scoping, "new.target"), undefined);
        assertThrow(() => makeSpecReadExpression(scoping, "new.target"), {
          name: "SyntaxAranError",
          message: "Illegal new.target",
        });
        assertEqual(declareSpec(scoping, "import.meta"), undefined);
        return [
          makeEffectStatement(
            makeSpecInitializeEffect(
              scoping,
              "import.meta",
              makeLiteralExpression("init"),
            ),
          ),
          makeEffectStatement(
            makeExpressionEffect(makeSpecReadExpression(scoping, "this")),
          ),
          makeEffectStatement(
            makeExpressionEffect(
              makeSpecReadExpression(scoping, "import.meta"),
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
        void intrinsic.aran.globalObject;
        void IMPORT_META;
        return "completion";
      }
    `,
  ),
);

// base //
assertSuccess(
  allignProgram(
    makeScopeModuleProgram(
      createContext({ strict: true }),
      ENCLAVE,
      [makeImportLink("source", "imported"), makeExportLink("exported")],
      (scope) => {
        const scoping = createContext({ strict: true, scope });
        assertEqual(
          declareBase(scoping, "let", "variable1", ["exported"]),
          undefined,
        );
        assertEqual(
          declareBaseImport(scoping, "variable2", "source", "imported"),
          undefined,
        );
        return concat(
          makeBaseInitializeStatementArray(
            scoping,
            "let",
            "variable1",
            makeLiteralExpression("init"),
          ),
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeBaseReadExpression(scoping, "variable1"),
              ),
            ),
            makeEffectStatement(
              makeExpressionEffect(
                makeBaseTypeofExpression(scoping, "variable1"),
              ),
            ),
            makeEffectStatement(
              makeExpressionEffect(
                makeBaseDiscardExpression(scoping, "variable1"),
              ),
            ),
            makeEffectStatement(
              makeBaseWriteEffect(
                scoping,
                "variable1",
                makeLiteralExpression("right"),
              ),
            ),
            makeEffectStatement(
              makeExpressionEffect(
                makeBaseReadExpression(scoping, "variable2"),
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
        exported << VARIABLE;
        void VARIABLE;
        void intrinsic.aran.unary("typeof", VARIABLE);
        void false;
        (
          VARIABLE = "right",
          exported << VARIABLE
        );
        void ("source" >> imported);
        return "completion";
      }
    `,
  ),
);

///////////////////////////////
// makeScopeLocalEvalProgram //
///////////////////////////////

assertSuccess(
  allignProgram(
    makeScopeLocalEvalProgram(
      createContext({ strict: true }),
      true,
      (scope) => {
        const scoping = createContext({ strict: true, scope });
        return [
          makeEffectStatement(
            makeExpressionEffect(makeBaseReadExpression(scoping, "variable")),
          ),
          makeReturnStatement(makeLiteralExpression("completion")),
        ];
      },
    ),
    `
      "eval";
      {
        void [variable]
        return "completion";
      }
    `,
  ),
);

/////////////////////////////////////////////////////////////
// makeScopeLocalEvalProgram && makeScopeGlobalEvalProgram //
/////////////////////////////////////////////////////////////

{
  let serialized_scope = null;
  assertSuccess(
    allignProgram(
      makeScopeGlobalEvalProgram(
        createContext({ strict: false }),
        true,
        (scope1) => {
          const scoping1 = createContext({ strict: false, scope: scope1 });
          assertEqual(declareBase(scoping1, "let", "variable1", []), undefined);
          return concat(
            [
              makeBlockStatement(
                makeScopeClosureDynamicBlock(
                  scoping1,
                  [],
                  makeLiteralExpression("macro"),
                  (scope2) => {
                    const scoping2 = createContext({
                      strict: false,
                      scope: scope2,
                    });
                    const statement = makeEffectStatement(
                      makeExpressionEffect(
                        makeScopeEvalExpression(
                          scoping2,
                          makeLiteralExpression("code"),
                        ),
                      ),
                    );
                    serialized_scope = stringifyJSON(packScope(scope2));
                    return [statement];
                  },
                ),
              ),
            ],
            makeBaseInitializeStatementArray(
              scoping1,
              "let",
              "variable1",
              makeLiteralExpression("init1"),
            ),
            [makeReturnStatement(makeLiteralExpression("completion"))],
          );
        },
      ),
      `
        "eval";
        {
          let VARIABLE1, VARIABLE1_;
          VARIABLE1_ = false;
          {
            void eval("code");
          }
          VARIABLE1 = "init1";
          VARIABLE1_ = true
          return "completion";
        }
      `,
    ),
  );
  assertSuccess(
    allignProgram(
      makeScopeLocalEvalProgram(
        createContext({
          strict: false,
          scope: unpackScope(parseJSON(serialized_scope)),
        }),
        false,
        (scope) => {
          const scoping = createContext({ strict: false, scope });
          assertEqual(declareBase(scoping, "let", "variable2", []), undefined);
          assertEqual(declareBase(scoping, "var", "variable3", []), undefined);
          return concat(
            [
              makeEffectStatement(
                makeExpressionEffect(
                  makeBaseReadExpression(scoping, "variable1"),
                ),
              ),
            ],
            makeBaseInitializeStatementArray(
              scoping,
              "let",
              "variable2",
              makeLiteralExpression("init2"),
            ),
            makeBaseInitializeStatementArray(
              scoping,
              "var",
              "variable3",
              makeLiteralExpression("init3"),
            ),
            [makeReturnStatement(makeLiteralExpression("completion"))],
          );
        },
      ),
      `
        "eval";
        {
          let VARIABLE2;
          void (
            intrinsic.aran.binary("in", "variable1", "macro") ?
            intrinsic.aran.get("macro", "variable1") :
            intrinsic.aran.throw(
              new intrinsic.ReferenceError(
                "Cannot access variable 'variable1' before initialization",
              ),
            )
          );
          VARIABLE2 = "init2";
          void intrinsic.aran.setStrict("macro", "variable3", "init3");
          return "completion";
        }
      `,
    ),
  );
}

///////////////////////////////////////////////////////////////
// makeScopeClosureDynamicBlock && makeScopeWithDynamicBlock //
///////////////////////////////////////////////////////////////

assertSuccess(
  allignProgram(
    makeScopeGlobalEvalProgram(createContext({}), true, (scope1) => {
      const scoping1 = createContext({ scope: scope1 });
      return [
        makeBlockStatement(
          makeScopeClosureDynamicBlock(
            scoping1,
            ["label"],
            makeLiteralExpression("frame"),
            (scope2) => {
              const scoping2 = createContext({ scope: scope2 });
              return [
                makeEffectStatement(
                  makeExpressionEffect(
                    makeBaseReadExpression(scoping2, "variable"),
                  ),
                ),
              ];
            },
          ),
        ),
        makeBlockStatement(
          makeScopeWithDynamicBlock(
            scoping1,
            ["label"],
            makeLiteralExpression("frame"),
            (scope2) => {
              const scoping2 = createContext({ scope: scope2 });
              return [
                makeEffectStatement(
                  makeExpressionEffect(
                    makeBaseReadExpression(scoping2, "variable"),
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
        void (
          intrinsic.aran.binary("in", "variable", "frame") ?
          intrinsic.aran.get("frame", "variable") :
          [variable]
        );
      }
      label: {
        void (
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
          [variable]
        );
      }
      return "completion";
    }
  `,
  ),
);

///////////////////////////////////////////////////////////////
// makeScopeClosureStaticBlock && makeScopeClosureExpression //
///////////////////////////////////////////////////////////////

assertSuccess(
  allignProgram(
    makeScopeGlobalEvalProgram(createContext({}), ENCLAVE, (scope1) => {
      const scoping1 = createContext({ scope: scope1 });
      return [
        makeEffectStatement(
          makeExpressionEffect(
            makeScopeClosureExpression(
              scoping1,
              "arrow",
              false,
              false,
              (scope2) => {
                const scoping2 = createContext({ scope: scope2 });
                return [
                  makeBlockStatement(
                    makeScopeClosureStaticBlock(
                      scoping2,
                      ["label"],
                      (_scope3) => [makeDebuggerStatement()],
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
        void (() => {
          label: {
            debugger;
          }
          return "completion";
        });
        return "completion";
      }
    `,
  ),
);

////////////////////////
// makeScopeDeadStaticBlock //
////////////////////////

assertSuccess(
  allignProgram(
    makeScopeGlobalEvalProgram(createContext({}), ENCLAVE, (scope1) => {
      const scoping1 = createContext({ scope: scope1 });
      return [
        makeBlockStatement(
          makeScopeDeadStaticBlock(scoping1, ["label"], (scope2) => {
            const scoping2 = createContext({ scope: scope2 });
            assertEqual(
              declareBase(scoping2, "let", "variable", []),
              undefined,
            );
            return [
              makeEffectStatement(
                makeExpressionEffect(
                  makeBaseReadExpression(scoping2, "variable"),
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
        void intrinsic.aran.throw(
          new intrinsic.ReferenceError(
            "Cannot access variable 'variable' before initialization",
          ),
        );
      }
      return "completion";
    }
  `,
  ),
);

///////////////////////////
// makeScopeDistantStaticBlock //
///////////////////////////

assertSuccess(
  allignProgram(
    makeScopeGlobalEvalProgram(createContext({}), ENCLAVE, (scope1) => {
      const scoping1 = createContext({ scope: scope1 });
      return [
        makeBlockStatement(
          makeScopeNormalStaticBlock(scoping1, ["label1"], (scope2) => {
            const scoping2 = createContext({ scope: scope2 });
            assertEqual(
              declareBase(scoping2, "let", "variable", []),
              undefined,
            );
            return [
              makeBlockStatement(
                makeScopeDistantStaticBlock(scoping2, ["label2"], (scope3) => {
                  const scoping3 = createContext({ scope: scope3 });
                  return makeBaseInitializeStatementArray(
                    scoping3,
                    "let",
                    "variable",
                    makeLiteralExpression("init"),
                  );
                }),
              ),
              makeEffectStatement(
                makeExpressionEffect(
                  makeBaseReadExpression(scoping2, "variable"),
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
          void (
            _VARIABLE ?
            VARIABLE :
            intrinsic.aran.throw(
              new intrinsic.ReferenceError(
                "Cannot access variable 'variable' before initialization",
              ),
            )
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
      createContext({ strict: false }),
      false,
      (scope) => {
        const scoping = createContext({ strict: false, scope });
        assertEqual(declareBase(scoping, "let", "variable", []), undefined);
        return concat(
          [
            makeEffectStatement(
              makeBaseWriteEffect(
                scoping,
                "variable",
                makeLiteralExpression("right"),
              ),
            ),
          ],
          [
            makeEffectStatement(
              makeBaseMacroWriteEffect(
                scoping,
                "variable",
                makeLiteralExpression("right"),
              ),
            ),
          ],
          makeBaseInitializeStatementArray(
            scoping,
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
        void "right",
        void intrinsic.aran.throw(
          new intrinsic.ReferenceError(
            "Cannot access variable 'variable' before initialization",
          ),
        )
      );
      void intrinsic.aran.throw(
        new intrinsic.ReferenceError(
          "Cannot access variable 'variable' before initialization",
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
      createContext({ strict: true }),
      true,
      (scope1) => {
        const scoping1 = createContext({ strict: true, scope: scope1 });
        return [
          makeBlockStatement(
            makeScopeClosureDynamicBlock(
              scoping1,
              [],
              makeLiteralExpression("frame"),
              (scope2) => {
                const scoping2 = createContext({
                  strict: true,
                  scope: scope2,
                });
                return [
                  makeEffectStatement(
                    makeBaseWriteEffect(
                      scoping2,
                      "variable",
                      makeLiteralExpression("right"),
                    ),
                  ),
                  makeEffectStatement(
                    makeBaseMacroWriteEffect(
                      scoping2,
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
            void intrinsic.aran.setStrict("frame", "variable", RIGHT) :
            [variable] = RIGHT
          )
        );
        (
          intrinsic.aran.binary("in", "variable", "frame") ?
          void intrinsic.aran.setStrict("frame", "variable", "right") :
          [variable] = "right"
        );
      }
      return "completion";
    }
  `,
  ),
);
