import {join, concat, forEach, map} from "array-lite";

import {assertEqual, assertDeepEqual, assertSuccess} from "../__fixture__.mjs";

import {
  makeBlock,
  makeEffectStatement,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makeLiteralExpression,
  makeClosureExpression,
  makeReturnStatement,
  makeImportExpression,
  makeReadExpression,
} from "../ast/index.mjs";

import {allignBlock} from "../allign/index.mjs";

import {extendScope, createRootScope, declareScope} from "./scope.mjs";

import {makeTrapExpression, makeTrapStatementArray} from "./trap.mjs";

const {undefined} = globalThis;

const getFirst = (object) => object[0];
const getSecond = (object) => object[1];
const getThird = (object) => object[2];

assertSuccess(
  allignBlock(
    makeBlock(
      [],
      [],
      makeTrapStatementArray(
        {pointcut: false, namespace: "namespace", scope: createRootScope()},
        "debugger",
        123,
      ),
    ),
    "{}",
  ),
);

{
  const scope = extendScope(createRootScope());
  declareScope(scope, "namespace", null);
  assertSuccess(
    allignBlock(
      makeBlock(
        [],
        ["namespace"],
        makeTrapStatementArray(
          {pointcut: true, namespace: "namespace", scope},
          "debugger",
          123,
        ),
      ),
      `
        {
          let Namespace;
          effect(
            intrinsic.aran.get(Namespace, 'debugger')(
              !Namespace,
              123,
            ),
          )
        }
      `,
    ),
  );
}

{
  const scope = extendScope(createRootScope());
  declareScope(scope, "variable", "VARIABLE");
  declareScope(scope, "label", "LABEL");
  declareScope(scope, "callee", null);
  declareScope(scope, "namespace", null);
  forEach(
    [
      // Informers //
      [
        "arrival",
        ["kind", "kind", "'kind'"],
        [["link"], ["link"], "intrinsic.Array.of('link')"],
        ["callee", null, "Callee"],
        [123, 123, "123"],
      ],
      [
        "enter",
        ["kind", "kind", "'kind'"],
        [["label"], ["LABEL"], ["intrinsic.Array.of(Label)"]],
        [["variable"], ["VARIABLE"], ["intrinsic.Array.of(Variable)"]],
        [123, 123, "123"],
      ],
      ["completion", [123, 123, "123"]],
      ["leave", [123, 123, "123"]],
      ["debugger", [123, 123, "123"]],
      ["break", ["label", "LABEL", "Label"], [123, 123, "123"]],
      // Producers //
      [
        "parameters",
        [makeLiteralExpression(456), null, "456"],
        [123, 123, "123"],
      ],
      [
        "intrinsic",
        ["aran.get", "aran.get", "'aran.get'"],
        [makeIntrinsicExpression("aran.get"), null, "intrinsic.aran.get"],
        [123, 123, "123"],
      ],
      [
        "literal",
        [{undefined: null}, undefined, "undefined"],
        [123, 123, "123"],
      ],
      [
        "import",
        ["source", "source", "'source'"],
        ["specifier", "specifier", "'specifier'"],
        [
          makeImportExpression("source", "specifier"),
          null,
          "importStatic('source', 'specifier')",
        ],
        [123, 123, "123"],
      ],
      [
        "closure",
        ["arrow", "arrow", "'arrow'"],
        [true, true, "true"],
        [false, false, "false"],
        [
          makeClosureExpression(
            "arrow",
            true,
            false,
            makeBlock(
              [],
              [],
              [makeReturnStatement(makeLiteralExpression("completion"))],
            ),
          ),
          null,
          "async () => { return 'completion'; }",
        ],
        [123, 123, "123"],
      ],
      [
        "read",
        ["variable", "VARIABLE", "Variable"],
        [makeReadExpression("x"), null, "X"],
        [123, 123, "123"],
      ],
      [
        "failure",
        [makeLiteralExpression("BOUM"), null, "'BOUM'"],
        [123, 123, "123"],
      ],
      // Consumer //
      [
        "eval",
        [makeLiteralExpression("code"), null, "'code'"],
        [123, 123, "123"],
      ],
      [
        "await",
        [makeLiteralExpression("promise"), null, "'promise'"],
        [123, 123, "123"],
      ],
      [
        "yield",
        [true, true, "true"],
        [makeLiteralExpression("iterator"), null, "'iterator'"],
        [123, 123, "123"],
      ],
      [
        "drop",
        [makeLiteralExpression("dropped"), null, "'dropped'"],
        [123, 123, "123"],
      ],
      [
        "export",
        ["specifier", "specifier", "'specifier'"],
        [makeLiteralExpression("exported"), null, "'exported'"],
        [123, 123, "123"],
      ],
      [
        "write",
        ["variable", "VARIABLE", "Variable"],
        [makeLiteralExpression("right"), null, "'right'"],
        [123, 123, "123"],
      ],
      [
        "test",
        [makeLiteralExpression("condition"), null, "'condition'"],
        [123, 123, "123"],
      ],
      [
        "declare",
        ["var", "var", "'var'"],
        ["global", "global", "'global'"],
        [makeLiteralExpression("right"), null, "'right'"],
        [123, 123, "123"],
      ],
      [
        "return",
        [makeLiteralExpression("result"), null, "'result'"],
        [123, 123, "123"],
      ],
      // Combiner //
      [
        "apply",
        [makeLiteralExpression("function"), null, "'function'"],
        [makeLiteralExpression("this"), null, "'this'"],
        [
          [
            makeLiteralExpression("argument0"),
            makeLiteralExpression("argument1"),
          ],
          [null, null],
          "intrinsic.Array.of('argument0', 'argument1')",
        ],
        [123, 123, "123"],
      ],
      [
        "construct",
        [makeLiteralExpression("constructor"), null, "'constructor'"],
        [
          [
            makeLiteralExpression("argument0"),
            makeLiteralExpression("argument1"),
          ],
          [null, null],
          "intrinsic.Array.of('argument0', 'argument1')",
        ],
        [123, 123, "123"],
      ],
    ],
    ([name1, ...specs]) => {
      let done = false;
      assertSuccess(
        allignBlock(
          makeBlock(
            [],
            ["variable", "label", "callee", "namespace"],
            [
              makeEffectStatement(
                makeExpressionEffect(
                  makeTrapExpression(
                    {
                      scope,
                      namespace: "namespace",
                      pointcut: (name2, ...args) => {
                        assertEqual(done, false);
                        done = true;
                        assertEqual(name1, name2);
                        assertDeepEqual(args, map(specs, getSecond));
                        return true;
                      },
                    },
                    name1,
                    ...map(specs, getFirst),
                  ),
                ),
              ),
            ],
          ),
          `
            {
              let Variable, Label, Callee, Namespace;
              effect(
                intrinsic.aran.get(Namespace, '${name1}')(
                  ${join(concat(["!Namespace"], map(specs, getThird)), ", ")}
                ),
              );
            }
          `,
        ),
      );
      assertEqual(done, true);
    },
  );
}
