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

const makeNextExpression = (next) => {
  if (next === null) {
    return nextForbidden;
  } else {
    return () => makeLiteralExpression(next);
  }
};

const makeNextEffect = (next) => {
  if (next === null) {
    return nextForbidden;
  } else {
    return () => makeExpressionEffect(makeLiteralExpression(next));
  }
};

export const makeRight = (type) => {
  if (type === "read") {
    return makeRead();
  } else if (type === "typeof") {
    return makeTypeof();
  } else if (type === "discard") {
    return makeDiscard();
  } else {
    throw new Error("unexpected type");
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

// const fromJust = (maybe) => {
//   assert(maybe !== null, "unexpected nothing");
//   return maybe;
// };

export const default_scenario = {
  type: "declare",
  kind: "kind",
  variable: "variable",
  import: null,
  exports: [],
  strict: false,
  escaped: false,
  value: "value",
  next: null,
  code: null,
  initialization: "initialization",
  assignment: "assignment",
};

const finalizeBlock = (variables, statements, code) =>
  allignBlock(makeBlock([], variables, statements), `{${code}}`);

const generateTest =
  (finalize) =>
  (
    {create, harvest, declare, initialize, lookup},
    {head = "", scenarios = [], layer = "layer", options = {}},
  ) => {
    const frame = create(layer, options);
    const body = [];
    const statements2 = flatMap(scenarios, (scenario) => {
      scenario = assign({}, default_scenario, scenario);
      if (scenario.type === "declare") {
        const maybe = declare(
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
        if (scenario.code !== null) {
          body[body.length] = scenario.code;
        }
        return maybe === null ? [] : maybe;
      } else if (scenario.type === "initialize") {
        const maybe = initialize(
          frame,
          scenario.kind,
          scenario.variable,
          makeLiteralExpression(scenario.initialization),
        );
        assert(
          (maybe === null) === (scenario.code === null),
          "bypass initialization mismatch",
        );
        if (scenario.code !== null) {
          body[body.length] = scenario.code;
        }
        return maybe === null ? [] : maybe;
      } else {
        if (scenario.type === "write") {
          body[body.length] = `${scenario.code};`;
          return [
            makeEffectStatement(
              lookup(
                makeNextEffect(scenario.next),
                frame,
                scenario.strict,
                scenario.escaped,
                scenario.variable,
                makeWrite(makeLiteralExpression(scenario.assignment)),
              ),
            ),
          ];
        } else {
          body[body.length] = `effect(${scenario.code});`;
          return [
            makeEffectStatement(
              makeExpressionEffect(
                lookup(
                  makeNextExpression(scenario.next),
                  frame,
                  scenario.strict,
                  scenario.escaped,
                  scenario.variable,
                  makeRight(scenario.type),
                ),
              ),
            ),
          ];
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
