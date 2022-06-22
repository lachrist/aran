import {includes, concat, flatMap} from "array-lite";

import {createCounter, hasOwnProperty, assert} from "../../../util/index.mjs";

import {
  makeScriptProgram,
  makeBlock,
  makeLiteralExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeReturnStatement,
} from "../../../ast/index.mjs";

import {allignBlock, allignProgram} from "../../../allign/index.mjs";

import {BASE} from "../variable.mjs";

const {
  undefined,
  Error,
  Object: {assign},
} = globalThis;

/* c8 ignore start */

const nextForbidden = () => {
  throw new Error("unexpected next");
};

const finalizeScript = (variables, statements, code) => {
  assert(variables.length === 0, "variables in script");
  return allignProgram(
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
  );
};

/* c8 ignore stop */

export const default_scenario = {
  type: null,
  kind: null,
  variable: "dummy_variable",
  options: {},
  strict: false,
  escaped: false,
  next: nextForbidden,
  code: "",
  right: makeLiteralExpression("dummy-right"),
};

const finalizeBlock = (variables, statements, code) =>
  allignBlock(makeBlock([], variables, statements), `{${code}}`);

const names = {
  __proto__: null,
  read: "makeReadExpression",
  typeof: "makeTypeofExpression",
  discard: "makeDiscardExpression",
};

const generateTest =
  (finalize) =>
  (
    {
      KINDS,
      create,
      conflict,
      harvestPrelude,
      harvestHeader,
      declare,
      makeInitializeStatementArray,
      makeWriteEffect,
      lookupAll,
      ...Library
    },
    {head = "", scenarios = [], layer = BASE, options = {}},
  ) => {
    const frame = create(layer, options);
    assert(
      typeof frame === "object" && frame !== null,
      "expected frame to be an object",
    );
    assert(!hasOwnProperty(frame, "type"), "unexpected type property in frame");
    assert(
      !hasOwnProperty(frame, "layer") || frame.layer === layer,
      "if present, the layer property should match the argument",
    );
    let body = "";
    const statements = flatMap(scenarios, (scenario) => {
      scenario = assign({}, default_scenario, scenario);
      assert(scenario.type !== null, "missing scenario type");
      if (scenario.type === "conflict") {
        assert(
          conflict(scenario.strict, frame, scenario.kind, scenario.variable) ===
            undefined,
          "expected conflict to return undefined",
        );
        return [];
      } else if (scenario.type === "declare") {
        assert(includes(KINDS, scenario.kind), "unbound declare kind");
        assert(
          declare(
            scenario.strict,
            frame,
            scenario.kind,
            scenario.variable,
            scenario.options,
          ) === undefined,
          "expected declare to return undefined",
        );
        return [];
      } else if (scenario.type === "initialize") {
        assert(includes(KINDS, scenario.kind), "unbound initialize kind");
        body = `${body}\n${scenario.code}`;
        return makeInitializeStatementArray(
          scenario.strict,
          frame,
          scenario.kind,
          scenario.variable,
          scenario.right,
        );
      } else if (scenario.type === "lookup-all") {
        assert(
          lookupAll(scenario.strict, scenario.escaped, frame) === undefined,
          "expected lookupAll to return undefined",
        );
        return [];
      } else if (scenario.type === "write") {
        body = `${body}\n(${scenario.code});`;
        return [
          makeEffectStatement(
            makeWriteEffect(
              scenario.next,
              scenario.strict,
              scenario.escaped,
              frame,
              scenario.variable,
              {
                expression: scenario.right,
                counter: createCounter(0),
              },
            ),
          ),
        ];
      } else {
        const makeLookupExpression = Library[names[scenario.type]];
        body = `${body}\neffect(${scenario.code});`;
        return [
          makeEffectStatement(
            makeExpressionEffect(
              makeLookupExpression(
                scenario.next,
                scenario.strict,
                scenario.escaped,
                frame,
                scenario.variable,
                null,
              ),
            ),
          ),
        ];
      }
    });
    return finalize(
      harvestHeader(frame),
      concat(harvestPrelude(frame), statements),
      `${head}${body}`,
    );
  };

export const testBlock = generateTest(finalizeBlock);

export const testScript = generateTest(finalizeScript);
