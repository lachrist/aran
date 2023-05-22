import { join, concat, forEach, map } from "array-lite";

import {
  assertEqual,
  assertDeepEqual,
  assertSuccess,
} from "../__fixture__.mjs";

import {
  makeBlock,
  makeEffectStatement,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makeLiteralExpression,
  makeClosureExpression,
  makeReturnStatement,
  makeReadExternalExpression,
  makeTypeofExternalExpression,
  makeImportExpression,
  makeReadExpression,
  makeParameterExpression,
} from "../ast/index.mjs";

import { allignBlock } from "../allign/index.mjs";

import { makeRootScope, extendScope } from "./scope.mjs";

import {
  makeVarVariable,
  makeLabVariable,
  makeNewVariable,
} from "./variable.mjs";

import { makeTrapExpression, makeTrapStatementArray } from "./trap.mjs";

const { undefined } = globalThis;

const getFirst = (object) => object[0];
const getSecond = (object) => object[1];
const getThird = (object) => object[2];

assertSuccess(
  allignBlock(
    makeBlock(
      [],
      [],
      makeTrapStatementArray(
        false,
        "namespace",
        makeRootScope("prefix_", []),
        "debugger",
        123,
      ),
    ),
    `{}`,
  ),
);

assertSuccess(
  allignBlock(
    makeBlock(
      [],
      [],
      makeTrapStatementArray(
        true,
        "namespace",
        makeRootScope("prefix_", []),
        "debugger",
        123,
      ),
    ),
    `
      {
        void intrinsic.aran.get([namespace], 'debugger')(
          ![namespace],
          123,
        );
      }
    `,
  ),
);

{
  const scope = extendScope(makeRootScope("prefix_", []), [
    [makeVarVariable("variable"), "VARIABLE"],
    [makeLabVariable("label"), "LABEL"],
    [makeNewVariable("callee"), "CALLEE"],
  ]);
  forEach(
    [
      // Informers //
      [
        "arrival",
        ["kind", "kind", "'kind'"],
        [["link"], ["link"], "intrinsic.Array.of('link')"],
        ["callee", "CALLEE", "Callee"],
        [123, 123, "123"],
      ],
      [
        "arrival",
        ["kind", "kind", "'kind'"],
        [["link"], ["link"], "intrinsic.Array.of('link')"],
        [null, null, "null"],
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
        "parameter",
        ["new.target", "new.target", "'new.target'"],
        [makeParameterExpression("new.target"), null, "new.target"],
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
        [{ undefined: null }, undefined, "undefined"],
        [123, 123, "123"],
      ],
      [
        "import",
        ["source", "source", "'source'"],
        ["specifier", "specifier", "'specifier'"],
        [
          makeImportExpression("source", "specifier"),
          null,
          "'source' >> specifier",
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
        "read-external",
        ["external", "external", "'external'"],
        [makeReadExternalExpression("external"), null, "[external]"],
        [123, 123, "123"],
      ],
      [
        "typeof-external",
        ["external", "external", "'external'"],
        [makeTypeofExternalExpression("external"), null, "typeof [external]"],
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
        "declare-external",
        ["var", "var", "'var'"],
        ["external", "external", "'external'"],
        [makeLiteralExpression("right"), null, "'right'"],
        [123, 123, "123"],
      ],
      [
        "write-external",
        ["external", "external", "'external'"],
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
            [
              makeVarVariable("variable"),
              makeLabVariable("label"),
              makeNewVariable("callee"),
            ],
            [
              makeEffectStatement(
                makeExpressionEffect(
                  makeTrapExpression(
                    (name2, ...args) => {
                      assertEqual(done, false);
                      done = true;
                      assertEqual(name1, name2);
                      assertDeepEqual(args, map(specs, getSecond));
                      return true;
                    },
                    "namespace",
                    scope,
                    name1,
                    ...map(specs, getFirst),
                  ),
                ),
              ),
            ],
          ),
          `
            {
              let Variable, Label, Callee;
              void intrinsic.aran.get([namespace], '${name1}')(
                ${join(concat(["![namespace]"], map(specs, getThird)), ", ")}
              );
            }
          `,
        ),
      );
      assertEqual(done, true);
    },
  );
}
