import { map, concat } from "array-lite";

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
  declareScopeMeta,
  makeScopeMetaWriteEffectArray,
  makeScopeMetaReadExpression,
  declareScopeSpecMacro,
  declareScopeSpecIllegal,
  declareScopeSpec,
  makeScopeSpecInitializeEffectArray,
  makeScopeSpecReadExpression,
  declareScopeBaseImport,
  declareScopeBase,
  makeScopeBaseInitializeStatementArray,
  makeScopeBaseReadExpression,
  makeScopeBaseTypeofExpression,
  makeScopeBaseDiscardExpression,
  makeScopeBaseMacroWriteEffectArray,
  makeScopeBaseWriteEffectArray,
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

const createContext = (context) => ({
  strict: STRICT,
  scope: ROOT_SCOPE,
  counter: createCounter(0),
  ...context,
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
      (context) => {
        const variable = declareScopeMeta(context, "variable");
        return concat(
          map(
            makeScopeMetaWriteEffectArray(
              context,
              variable,
              makeLiteralExpression("right"),
            ),
            makeEffectStatement,
          ),
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeMetaReadExpression(context, variable),
              ),
            ),
            makeReturnStatement(makeLiteralExpression("completion")),
          ],
        );
      },
    ),
    `
      "script";
      void intrinsic.aran.setStrict(
        intrinsic.aran.globalCache,
        "01_variable",
        "right",
      );
      void intrinsic.aran.get(
        intrinsic.aran.globalCache,
        "01_variable",
      );
      return "completion";
    `,
  ),
);

// spec //
assertSuccess(
  allignProgram(
    makeScopeScriptProgram(createContext({}), ENCLAVE, (context) => {
      assertEqual(
        declareScopeSpecMacro(
          context,
          "this",
          makeIntrinsicExpression("aran.globalObject"),
        ),
        undefined,
      );
      assertEqual(declareScopeSpecIllegal(context, "import.meta"), undefined);
      assertThrow(() => makeScopeSpecReadExpression(context, "import.meta"), {
        name: "SyntaxAranError",
        message: 'Illegal "import.meta"',
      });
      return [
        makeEffectStatement(
          makeExpressionEffect(makeScopeSpecReadExpression(context, "this")),
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
    makeScopeScriptProgram(createContext({ strict: true }), true, (context) => {
      assertEqual(declareScopeBase(context, "let", "variable", []), undefined);
      assertThrow(
        () =>
          makeEffectStatement(
            makeExpressionEffect(
              makeScopeBaseDiscardExpression(context, "variable"),
            ),
          ),
        { name: "EnclaveLimitationAranError" },
      );
      return concat(
        makeScopeBaseInitializeStatementArray(
          context,
          "let",
          "variable",
          makeLiteralExpression("init"),
        ),
        [
          makeEffectStatement(
            makeExpressionEffect(
              makeScopeBaseReadExpression(context, "variable"),
            ),
          ),
          makeEffectStatement(
            makeExpressionEffect(
              makeScopeBaseTypeofExpression(context, "variable"),
            ),
          ),
        ],
        map(
          makeScopeBaseWriteEffectArray(
            context,
            "variable",
            makeLiteralExpression("right"),
          ),
          makeEffectStatement,
        ),
        [makeReturnStatement(makeLiteralExpression("completion"))],
      );
    }),
    `
      "script";
      let [variable] = "init";
      void [variable];
      void typeof [variable];
      [variable] = "right";
      return "completion";
    `,
  ),
);

// base sloppy refied //
assertSuccess(
  allignProgram(
    makeScopeScriptProgram(
      createContext({ strict: false }),
      false,
      (context) => {
        assertEqual(
          declareScopeBase(context, "let", "variable", []),
          undefined,
        );
        return concat(
          makeScopeBaseInitializeStatementArray(
            context,
            "let",
            "variable",
            makeLiteralExpression("init"),
          ),
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeBaseReadExpression(context, "variable"),
              ),
            ),
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeBaseTypeofExpression(context, "variable"),
              ),
            ),
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeBaseDiscardExpression(context, "variable"),
              ),
            ),
          ],
          map(
            makeScopeBaseWriteEffectArray(
              context,
              "variable",
              makeLiteralExpression("right"),
            ),
            makeEffectStatement,
          ),
          [makeReturnStatement(makeLiteralExpression("completion"))],
        );
      },
    ),
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
            "Variable \\"variable\\" has already been declared"
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
      (context) => {
        const variable = declareScopeMeta(context, "variable");
        return concat(
          map(
            makeScopeMetaWriteEffectArray(
              context,
              variable,
              makeLiteralExpression("right"),
            ),
            makeEffectStatement,
          ),
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeMetaReadExpression(context, variable),
              ),
            ),
            makeReturnStatement(makeLiteralExpression("completion")),
          ],
        );
      },
    ),
    `
      "module";
      {
        let VARIABLE;
        VARIABLE = "right";
        void VARIABLE;
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
      (context) => {
        assertEqual(
          declareScopeSpecMacro(
            context,
            "this",
            makeIntrinsicExpression("aran.globalObject"),
          ),
          undefined,
        );
        assertEqual(declareScopeSpecIllegal(context, "new.target"), undefined);
        assertThrow(() => makeScopeSpecReadExpression(context, "new.target"), {
          name: "SyntaxAranError",
          message: 'Illegal "new.target"',
        });
        assertEqual(declareScopeSpec(context, "import.meta"), undefined);
        return concat(
          map(
            makeScopeSpecInitializeEffectArray(
              context,
              "import.meta",
              makeLiteralExpression("init"),
            ),
            makeEffectStatement,
          ),
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeSpecReadExpression(context, "this"),
              ),
            ),
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeSpecReadExpression(context, "import.meta"),
              ),
            ),
            makeReturnStatement(makeLiteralExpression("completion")),
          ],
        );
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
      (context) => {
        assertEqual(
          declareScopeBase(context, "let", "variable1", ["exported"]),
          undefined,
        );
        assertEqual(
          declareScopeBaseImport(context, "variable2", "source", "imported"),
          undefined,
        );
        return concat(
          makeScopeBaseInitializeStatementArray(
            context,
            "let",
            "variable1",
            makeLiteralExpression("init"),
          ),
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeBaseReadExpression(context, "variable1"),
              ),
            ),
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeBaseTypeofExpression(context, "variable1"),
              ),
            ),
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeBaseDiscardExpression(context, "variable1"),
              ),
            ),
          ],
          map(
            makeScopeBaseWriteEffectArray(
              context,
              "variable1",
              makeLiteralExpression("right"),
            ),
            makeEffectStatement,
          ),
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeBaseReadExpression(context, "variable2"),
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
        VARIABLE = "right";
        exported << VARIABLE;
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
      (context) => [
        makeEffectStatement(
          makeExpressionEffect(
            makeScopeBaseReadExpression(context, "variable"),
          ),
        ),
        makeReturnStatement(makeLiteralExpression("completion")),
      ],
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
        (context1) => {
          assertEqual(
            declareScopeBase(context1, "let", "variable1", []),
            undefined,
          );
          return concat(
            [
              makeBlockStatement(
                makeScopeClosureDynamicBlock(
                  context1,
                  [],
                  makeLiteralExpression("macro"),
                  (context2) => {
                    const statement = makeEffectStatement(
                      makeExpressionEffect(
                        makeScopeEvalExpression(
                          context2,
                          makeLiteralExpression("code"),
                        ),
                      ),
                    );
                    serialized_scope = stringifyJSON(packScope(context2.scope));
                    return [statement];
                  },
                ),
              ),
            ],
            makeScopeBaseInitializeStatementArray(
              context1,
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
        (context) => {
          assertEqual(
            declareScopeBase(context, "let", "variable2", []),
            undefined,
          );
          assertEqual(
            declareScopeBase(context, "var", "variable3", []),
            undefined,
          );
          return concat(
            [
              makeEffectStatement(
                makeExpressionEffect(
                  makeScopeBaseReadExpression(context, "variable1"),
                ),
              ),
            ],
            makeScopeBaseInitializeStatementArray(
              context,
              "let",
              "variable2",
              makeLiteralExpression("init2"),
            ),
            makeScopeBaseInitializeStatementArray(
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
        "eval";
        {
          let VARIABLE2;
          void (
            intrinsic.aran.binary("in", "variable1", "macro") ?
            intrinsic.aran.get("macro", "variable1") :
            intrinsic.aran.throw(
              new intrinsic.ReferenceError(
                "Cannot access variable \\"variable1\\" before initialization",
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
    makeScopeGlobalEvalProgram(createContext({}), true, (context1) => [
      makeBlockStatement(
        makeScopeClosureDynamicBlock(
          context1,
          ["label"],
          makeLiteralExpression("frame"),
          (context2) => [
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeBaseReadExpression(context2, "variable"),
              ),
            ),
          ],
        ),
      ),
      makeBlockStatement(
        makeScopeWithDynamicBlock(
          context1,
          ["label"],
          makeLiteralExpression("frame"),
          (context2) => [
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeBaseReadExpression(context2, "variable"),
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
    makeScopeGlobalEvalProgram(createContext({}), ENCLAVE, (context1) => [
      makeEffectStatement(
        makeExpressionEffect(
          makeScopeClosureExpression(
            context1,
            "arrow",
            false,
            false,
            (context2) => [
              makeBlockStatement(
                makeScopeClosureStaticBlock(
                  context2,
                  ["label"],
                  (_context3) => [makeDebuggerStatement()],
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
    makeScopeGlobalEvalProgram(createContext({}), ENCLAVE, (context1) => [
      makeBlockStatement(
        makeScopeDeadStaticBlock(context1, ["label"], (context2) => {
          assertEqual(
            declareScopeBase(context2, "let", "variable", []),
            undefined,
          );
          return [
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeBaseReadExpression(context2, "variable"),
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
        void intrinsic.aran.throw(
          new intrinsic.ReferenceError(
            "Cannot access variable \\"variable\\" before initialization",
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
    makeScopeGlobalEvalProgram(createContext({}), ENCLAVE, (context1) => [
      makeBlockStatement(
        makeScopeNormalStaticBlock(context1, ["label1"], (context2) => {
          assertEqual(
            declareScopeBase(context2, "let", "variable", []),
            undefined,
          );
          return [
            makeBlockStatement(
              makeScopeDistantStaticBlock(context2, ["label2"], (context3) =>
                makeScopeBaseInitializeStatementArray(
                  context3,
                  "let",
                  "variable",
                  makeLiteralExpression("init"),
                ),
              ),
            ),
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeBaseReadExpression(context2, "variable"),
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
          void (
            _VARIABLE ?
            VARIABLE :
            intrinsic.aran.throw(
              new intrinsic.ReferenceError(
                "Cannot access variable \\"variable\\" before initialization",
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
      (context) => {
        assertEqual(
          declareScopeBase(context, "let", "variable", []),
          undefined,
        );
        return concat(
          map(
            makeScopeBaseWriteEffectArray(
              context,
              "variable",
              makeLiteralExpression("right"),
            ),
            makeEffectStatement,
          ),
          map(
            makeScopeBaseMacroWriteEffectArray(
              context,
              "variable",
              makeLiteralExpression("right"),
            ),
            makeEffectStatement,
          ),
          makeScopeBaseInitializeStatementArray(
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
      void "right";
      void intrinsic.aran.throw(
        new intrinsic.ReferenceError(
          "Cannot access variable \\"variable\\" before initialization",
        ),
      );
      void intrinsic.aran.throw(
        new intrinsic.ReferenceError(
          "Cannot access variable \\"variable\\" before initialization",
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
      (context1) => [
        makeBlockStatement(
          makeScopeClosureDynamicBlock(
            context1,
            [],
            makeLiteralExpression("frame"),
            (context2) =>
              concat(
                map(
                  makeScopeBaseWriteEffectArray(
                    context2,
                    "variable",
                    makeLiteralExpression("right"),
                  ),
                  makeEffectStatement,
                ),
                map(
                  makeScopeBaseMacroWriteEffectArray(
                    context2,
                    "variable",
                    makeLiteralExpression("right"),
                  ),
                  makeEffectStatement,
                ),
              ),
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
        RIGHT = "right";
        (
          intrinsic.aran.binary("in", "variable", "frame") ?
          void intrinsic.aran.setStrict("frame", "variable", RIGHT) :
          [variable] = RIGHT
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
