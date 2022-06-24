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
    makeScopeScriptProgram(
      {strict: true, enclave: ENCLAVE, counter: createCounter(0)},
      (scope) => {
        const variable1 = declareMeta(scope, "variable1");
        const variable2 = declareMetaMacro(
          scope,
          "variable2",
          makeLiteralExpression("binding"),
        );
        return [
          makeEffectStatement(
            makeMetaInitializeEffect(
              scope,
              variable1,
              makeLiteralExpression("right"),
            ),
          ),
          makeEffectStatement(
            makeExpressionEffect(makeMetaReadExpression(scope, variable1)),
          ),
          makeEffectStatement(
            makeExpressionEffect(makeMetaReadExpression(scope, variable2)),
          ),
          makeReturnStatement(makeLiteralExpression("completion")),
        ];
      },
    ),
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
    makeScopeScriptProgram(
      {strict: STRICT, enclave: ENCLAVE, counter: createCounter(0)},
      (scope) => {
        assertEqual(
          declareSpecMacro(
            scope,
            "this",
            makeIntrinsicExpression("aran.globalObject"),
          ),
          undefined,
        );
        assertEqual(declareSpecIllegal(scope, "import.meta"), undefined);
        assertThrow(() => makeSpecReadExpression(scope, "import.meta"), {
          name: "Error",
          message: "Illegal import.meta",
        });
        return [
          makeEffectStatement(
            makeExpressionEffect(makeSpecReadExpression(scope, "this")),
          ),
          makeReturnStatement(makeLiteralExpression("completion")),
        ];
      },
    ),
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
    makeScopeScriptProgram(
      {strict: true, enclave: true, counter: createCounter(0)},
      (scope) => {
        assertEqual(declareBase(scope, "let", "variable", []), undefined);
        return concat(
          makeBaseInitializeStatementArray(
            scope,
            "let",
            "variable",
            makeLiteralExpression("init"),
          ),
          [
            makeEffectStatement(
              makeExpressionEffect(makeBaseReadExpression(scope, "variable")),
            ),
            makeEffectStatement(
              makeExpressionEffect(makeBaseTypeofExpression(scope, "variable")),
            ),
            makeEffectStatement(
              makeExpressionEffect(
                makeBaseDiscardExpression(scope, "variable"),
              ),
            ),
            makeEffectStatement(
              makeBaseWriteEffect(
                scope,
                "variable",
                makeLiteralExpression("right"),
              ),
            ),
            makeReturnStatement(makeLiteralExpression("completion")),
          ],
        );
      },
    ),
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
    makeScopeScriptProgram(
      {strict: false, enclave: false, counter: createCounter(0)},
      (scope) => {
        assertEqual(declareBase(scope, "let", "variable", []), undefined);
        return concat(
          makeBaseInitializeStatementArray(
            scope,
            "let",
            "variable",
            makeLiteralExpression("init"),
          ),
          [
            makeEffectStatement(
              makeExpressionEffect(makeBaseReadExpression(scope, "variable")),
            ),
            makeEffectStatement(
              makeExpressionEffect(makeBaseTypeofExpression(scope, "variable")),
            ),
            makeEffectStatement(
              makeExpressionEffect(
                makeBaseDiscardExpression(scope, "variable"),
              ),
            ),
            makeEffectStatement(
              makeBaseWriteEffect(
                scope,
                "variable",
                makeLiteralExpression("right"),
              ),
            ),
            makeReturnStatement(makeLiteralExpression("completion")),
          ],
        );
      },
    ),
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
      {
        enclave: ENCLAVE,
        counter: createCounter(0),
        links: [],
      },
      (scope) => {
        const variable1 = declareMeta(scope, "variable1");
        const variable2 = declareMetaMacro(
          scope,
          "variable2",
          makeLiteralExpression("binding"),
        );
        return [
          makeEffectStatement(
            makeMetaInitializeEffect(
              scope,
              variable1,
              makeLiteralExpression("right"),
            ),
          ),
          makeEffectStatement(
            makeExpressionEffect(makeMetaReadExpression(scope, variable1)),
          ),
          makeEffectStatement(
            makeExpressionEffect(makeMetaReadExpression(scope, variable2)),
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
      {enclave: ENCLAVE, counter: createCounter(0), links: []},
      (scope) => {
        assertEqual(
          declareSpecMacro(
            scope,
            "this",
            makeIntrinsicExpression("aran.globalObject"),
          ),
          undefined,
        );
        assertEqual(declareSpecIllegal(scope, "new.target"), undefined);
        assertThrow(() => makeSpecReadExpression(scope, "new.target"), {
          name: "Error",
          message: "Illegal new.target",
        });
        assertEqual(declareSpec(scope, "import.meta"), undefined);
        return [
          makeEffectStatement(
            makeSpecInitializeEffect(
              scope,
              "import.meta",
              makeLiteralExpression("init"),
            ),
          ),
          makeEffectStatement(
            makeExpressionEffect(makeSpecReadExpression(scope, "this")),
          ),
          makeEffectStatement(
            makeExpressionEffect(makeSpecReadExpression(scope, "import.meta")),
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
      {
        enclave: ENCLAVE,
        counter: createCounter(0),
        links: [
          makeImportLink("source", "imported"),
          makeExportLink("exported"),
        ],
      },
      (scope) => {
        assertEqual(
          declareBase(scope, "let", "variable1", ["exported"]),
          undefined,
        );
        assertEqual(
          declareBaseImport(scope, "variable2", "source", "imported"),
          undefined,
        );
        return concat(
          makeBaseInitializeStatementArray(
            scope,
            "let",
            "variable1",
            makeLiteralExpression("init"),
          ),
          [
            makeEffectStatement(
              makeExpressionEffect(makeBaseReadExpression(scope, "variable1")),
            ),
            makeEffectStatement(
              makeExpressionEffect(
                makeBaseTypeofExpression(scope, "variable1"),
              ),
            ),
            makeEffectStatement(
              makeExpressionEffect(
                makeBaseDiscardExpression(scope, "variable1"),
              ),
            ),
            makeEffectStatement(
              makeBaseWriteEffect(
                scope,
                "variable1",
                makeLiteralExpression("right"),
              ),
            ),
            makeEffectStatement(
              makeExpressionEffect(makeBaseReadExpression(scope, "variable2")),
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
      {strict: true, specials: ["this"], counter: createCounter(0)},
      (scope) => {
        scope;
        return [
          makeEffectStatement(
            makeExpressionEffect(makeBaseReadExpression(scope, "variable")),
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
        {enclave: true, strict: false, counter: createCounter(0), links: []},
        (scope) => {
          assertEqual(declareBase(scope, "let", "variable1", []), undefined);
          const statements1 = makeBaseInitializeStatementArray(
            scope,
            "let",
            "variable1",
            makeLiteralExpression("init1"),
          );
          const statements2 = [
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeEvalExpression(scope, makeLiteralExpression("code")),
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
        unpackScope(parseJSON(serialized_scope)),
        {strict: false, counter: createCounter(0)},
        (scope) => {
          assertEqual(declareBase(scope, "let", "variable2", []), undefined);
          assertEqual(declareBase(scope, "var", "variable3", []), undefined);
          return concat(
            [
              makeEffectStatement(
                makeExpressionEffect(
                  makeBaseReadExpression(scope, "variable1"),
                ),
              ),
            ],
            makeBaseInitializeStatementArray(
              scope,
              "let",
              "variable2",
              makeLiteralExpression("init2"),
            ),
            makeBaseInitializeStatementArray(
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
    makeScopeGlobalEvalProgram(
      {strict: STRICT, enclave: true, counter: createCounter(0)},
      (scope1) => [
        makeBlockStatement(
          makeScopeDynamicClosureBlock(
            scope1,
            {labels: ["label"], frame: makeLiteralExpression("frame")},
            (scope2) => [
              makeEffectStatement(
                makeExpressionEffect(
                  makeBaseReadExpression(scope2, "variable"),
                ),
              ),
            ],
          ),
        ),
        makeBlockStatement(
          makeScopeDynamicWithBlock(
            scope1,
            {labels: ["label"], frame: makeLiteralExpression("frame")},
            (scope2) => [
              makeEffectStatement(
                makeExpressionEffect(
                  makeBaseReadExpression(scope2, "variable"),
                ),
              ),
            ],
          ),
        ),
        makeReturnStatement(makeLiteralExpression("completion")),
      ],
    ),
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
    makeScopeGlobalEvalProgram(
      {strict: STRICT, enclave: ENCLAVE, counter: createCounter(0)},
      (scope1) => [
        makeEffectStatement(
          makeExpressionEffect(
            makeScopeClosureExpression(
              scope1,
              {
                strict: STRICT,
                type: "arrow",
                asynchronous: false,
                generator: false,
              },
              (scope2) => [
                makeBlockStatement(
                  makeScopeStaticClosureBlock(
                    scope2,
                    {labels: ["label"]},
                    (_scope3) => [],
                  ),
                ),
                makeReturnStatement(makeLiteralExpression("completion")),
              ],
            ),
          ),
        ),
        makeReturnStatement(makeLiteralExpression("completion")),
      ],
    ),
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
    makeScopeGlobalEvalProgram(
      {strict: STRICT, enclave: ENCLAVE, counter: createCounter(0)},
      (scope1) => [
        makeBlockStatement(
          makeScopeDeadBlock(scope1, {labels: ["label"]}, (scope2) => {
            assertEqual(declareBase(scope2, "let", "variable", []), undefined);
            return [
              makeEffectStatement(
                makeExpressionEffect(
                  makeBaseReadExpression(scope2, "variable"),
                ),
              ),
            ];
          }),
        ),
        makeReturnStatement(makeLiteralExpression("completion")),
      ],
    ),
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
    makeScopeGlobalEvalProgram(
      {strict: STRICT, enclave: ENCLAVE, counter: createCounter(0)},
      (scope1) => [
        makeBlockStatement(
          makeScopeDistantBlock(scope1, {labels: ["label1"]}, (scope2) => {
            assertEqual(declareBase(scope2, "let", "variable", []), undefined);
            return [
              makeBlockStatement(
                makeScopeEmptyBlock(scope2, {labels: ["label2"]}, (scope3) =>
                  makeBaseInitializeStatementArray(
                    scope3,
                    "let",
                    "variable",
                    makeLiteralExpression("init"),
                  ),
                ),
              ),
              makeEffectStatement(
                makeExpressionEffect(
                  makeBaseReadExpression(scope2, "variable"),
                ),
              ),
            ];
          }),
        ),
        makeReturnStatement(makeLiteralExpression("completion")),
      ],
    ),
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
      {strict: false, enclave: false, counter: createCounter(0)},
      (scope) => {
        assertEqual(declareBase(scope, "let", "variable", []), undefined);
        return concat(
          [
            makeEffectStatement(
              makeBaseWriteEffect(
                scope,
                "variable",
                makeLiteralExpression("right"),
              ),
            ),
          ],
          [
            makeEffectStatement(
              makeBaseMacroWriteEffect(
                scope,
                "variable",
                makeLiteralExpression("right"),
              ),
            ),
          ],
          makeBaseInitializeStatementArray(
            scope,
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
      {strict: false, enclave: true, counter: createCounter(0)},
      (scope1) => [
        makeBlockStatement(
          makeScopeDynamicClosureBlock(
            scope1,
            {labels: [], frame: makeLiteralExpression("frame")},
            (scope2) => [
              makeEffectStatement(
                makeBaseWriteEffect(
                  scope2,
                  "variable",
                  makeLiteralExpression("right"),
                ),
              ),
              makeEffectStatement(
                makeBaseMacroWriteEffect(
                  scope2,
                  "variable",
                  makeLiteralExpression("right"),
                ),
              ),
            ],
          ),
        ),
        makeReturnStatement(makeLiteralExpression("completion")),
      ],
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
