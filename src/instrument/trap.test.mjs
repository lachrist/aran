import {join, concat, forEach, map} from "array-lite";

import {assertEqual, assertDeepEqual, assertSuccess} from "../__fixture__.mjs";

import {
  makeEffectStatement,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makeLiteralExpression,
  makeClosureExpression,
  makeReturnStatement,
  makeImportExpression,
  makeReadExpression,
  makeInputExpression,
} from "../ast/index.mjs";

import {allignBlock} from "../allign/index.mjs";

import {makeScopeBlock, extendScope, createRootScope} from "./scope.mjs";

import {
  VAR_SPLIT,
  LAB_SPLIT,
  NEW_SPLIT,
  makeSplitScopeReadExpression,
  declareSplitScope,
} from "./split.mjs";

import {makeTrapExpression, makeTrapStatementArray} from "./trap.mjs";

const {undefined} = globalThis;

const getFirst = (object) => object[0];
const getSecond = (object) => object[1];
const getThird = (object) => object[2];

{
  const scope = extendScope(createRootScope("secret_"));
  assertSuccess(
    allignBlock(
      makeScopeBlock(
        scope,
        [],
        makeTrapStatementArray(false, "namespace", scope, "debugger", 123),
      ),
      "{}",
    ),
  );
}

{
  const scope = extendScope(createRootScope("secret_"));
  declareSplitScope(scope, NEW_SPLIT, "namespace", "NAMESPACE");
  assertSuccess(
    allignBlock(
      makeScopeBlock(
        scope,
        [],
        makeTrapStatementArray(true, "namespace", scope, "debugger", 123),
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
  const scope = extendScope(createRootScope("secret_"));
  declareSplitScope(scope, VAR_SPLIT, "variable", "VARIABLE");
  declareSplitScope(scope, LAB_SPLIT, "label", "LABEL");
  declareSplitScope(scope, NEW_SPLIT, "callee", "CALLEE");
  declareSplitScope(scope, NEW_SPLIT, "namespace", "NAMESPACE");
  makeSplitScopeReadExpression(scope, VAR_SPLIT, "variable");
  makeSplitScopeReadExpression(scope, LAB_SPLIT, "label");
  makeSplitScopeReadExpression(scope, NEW_SPLIT, "callee");
  makeSplitScopeReadExpression(scope, NEW_SPLIT, "namespace");
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
      ["parameters", [makeInputExpression(), null, "input"], [123, 123, "123"]],
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
            makeScopeBlock(
              extendScope(scope),
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
          makeScopeBlock(
            scope,
            [],
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
