import {includes, concat, join, flatMap} from "array-lite";

import {hasOwnProperty, assert} from "../../../util/index.mjs";

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

import {makeRead, makeTypeof, makeDiscard, makeWrite} from "../right.mjs";

const {
  undefined,
  Error,
  Object: {assign},
} = globalThis;

/* c8 ignore start */

const nextForbidden = () => {
  throw new Error("unexpected next");
};

export const makeRight = (type, expression) => {
  if (type === "read") {
    return makeRead();
  } else if (type === "typeof") {
    return makeTypeof();
  } else if (type === "discard") {
    return makeDiscard();
  } else {
    return makeWrite(expression);
  }
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
  output: null,
  kind: null,
  variable: "dummy_variable",
  options: {},
  strict: false,
  escaped: false,
  next: nextForbidden,
  code: null,
  right: makeLiteralExpression("dummy-right"),
};

const finalizeBlock = (variables, statements, code) =>
  allignBlock(makeBlock([], variables, statements), `{${code}}`);

const generateTest =
  (finalize) =>
  (
    {
      KINDS,
      create,
      conflict,
      harvest,
      makeDeclareStatements,
      makeInitializeStatements,
      makeLookupEffect,
      makeLookupExpression,
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
    const body = [];
    const statements2 = flatMap(scenarios, (scenario) => {
      scenario = assign({}, default_scenario, scenario);
      assert(scenario.type !== null, "missing scenario type");
      if (scenario.type === "conflict") {
        assert(
          scenario.code === null,
          "conflict scenario should not have code",
        );
        assert(
          conflict(scenario.strict, frame, scenario.kind, scenario.variable) ===
            undefined,
          "expected conflict to return undefined",
        );
        return [];
      } else {
        assert(scenario.code !== null, "missing scenarion code");
        if (scenario.type === "declare") {
          assert(includes(KINDS, scenario.kind), "unbound declare kind");
          body[body.length] = scenario.code;
          return makeDeclareStatements(
            scenario.strict,
            frame,
            scenario.kind,
            scenario.variable,
            scenario.options,
          );
        } else if (scenario.type === "initialize") {
          assert(includes(KINDS, scenario.kind), "unbound initialize kind");
          body[body.length] = scenario.code;
          return makeInitializeStatements(
            scenario.strict,
            frame,
            scenario.kind,
            scenario.variable,
            scenario.right,
          );
        } else {
          assert(scenario.output !== null, "missing scenario output");
          if (scenario.output === "effect") {
            body[body.length] = `${scenario.code};`;
            return [
              makeEffectStatement(
                makeLookupEffect(
                  scenario.next,
                  scenario.strict,
                  scenario.escaped,
                  frame,
                  scenario.variable,
                  makeRight(scenario.type, scenario.right),
                ),
              ),
            ];
          } else if (scenario.output === "expression") {
            body[body.length] = `effect(${scenario.code});`;
            return [
              makeEffectStatement(
                makeExpressionEffect(
                  makeLookupExpression(
                    scenario.next,
                    scenario.strict,
                    scenario.escaped,
                    frame,
                    scenario.variable,
                    makeRight(scenario.type, scenario.right),
                  ),
                ),
              ),
            ];
          } /* c8 ignore start */ else {
            throw new Error("invalid scenario output");
          } /* c8 ignore stop */
        }
      }
    });
    const {header: variables, prelude: statements1} = harvest(frame);
    return finalize(
      variables,
      concat(statements1, statements2),
      `${head}${join(body, "\n")}`,
    );
  };

export const testBlock = generateTest(finalizeBlock);

export const testScript = generateTest(finalizeScript);
