import {concat, join, flatMap} from "array-lite";

import {assert} from "../../../util/index.mjs";

import {
  makeScriptProgram,
  makeBlock,
  makeLiteralExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeReturnStatement,
} from "../../../ast/index.mjs";

import {allignBlock, allignProgram} from "../../../allign/index.mjs";

import {makeRead, makeTypeof, makeDiscard, makeWrite} from "../right.mjs";

const {
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

const orElse = (maybe, value) => (maybe === null ? value : maybe);

/* c8 ignore stop */

const fromJust = (maybe) => {
  assert(maybe !== null, "unexpected nothing");
  return maybe;
};

export const default_scenario = {
  type: null,
  output: null,
  kind: "dummy-kind",
  variable: "dummy_variable",
  import: null,
  exports: [],
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
      create,
      harvest,
      makeDeclareStatements,
      makeInitializeStatements,
      makeLookupEffect,
      makeLookupExpression,
    },
    {head = "", scenarios = [], layer = "layer", options = {}},
  ) => {
    const frame = create(layer, options);
    const body = [];
    const statements2 = flatMap(scenarios, (scenario) => {
      scenario = assign({}, default_scenario, scenario);
      assert(scenario.type !== null, "missing scenario type");
      if (scenario.type === "declare") {
        const maybe = makeDeclareStatements(
          scenario.strict,
          frame,
          scenario.kind,
          scenario.variable,
          scenario.import,
          scenario.exports,
        );
        assert(
          (maybe === null) === (scenario.code === null),
          "bypass declaration mismatch",
        );
        body[body.length] = orElse(scenario.code, "");
        return orElse(maybe, []);
      } else if (scenario.type === "initialize") {
        const maybe = makeInitializeStatements(
          scenario.strict,
          frame,
          scenario.kind,
          scenario.variable,
          scenario.right,
        );
        assert(
          (maybe === null) === (scenario.code === null),
          "bypass initialization mismatch",
        );
        body[body.length] = orElse(scenario.code, "");
        return orElse(maybe, []);
      } else {
        assert(scenario.output !== null, "missing scenario output");
        if (scenario.output === "effect") {
          body[body.length] = `${fromJust(scenario.code)};`;
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
          body[body.length] = `effect(${fromJust(scenario.code)});`;
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
