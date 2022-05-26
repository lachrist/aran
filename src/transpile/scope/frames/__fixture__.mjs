import {concat, join, flatMap} from "array-lite";

import {assert} from "../../../util/index.mjs";

import {
  makeBlock,
  makeLiteralExpression,
  makeEffectStatement,
  makeExpressionEffect,
} from "../../../ast/index.mjs";

import {allignBlock} from "../../../allign/index.mjs";

import {makeRead, makeTypeof, makeDiscard, makeWrite} from "../right.mjs";

const {
  Error,
  Object: {assign},
} = globalThis;

/* c8 ignore start */

const nextForbidden = () => {
  throw new Error("unexpected next");
};

const makeNext = (next) => {
  if (next === null) {
    return nextForbidden;
  } else {
    return () => makeLiteralExpression(next);
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

/* c8 ignore stop */

const fromJust = (maybe) => {
  assert(maybe !== null, "unexpected nothing");
  return maybe;
};

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
  code: "",
  initialization: "initialization",
  assignment: "assignment",
};

export const testBlock = (
  {create, harvest, declare, initialize, lookup},
  {head = "", scenarios = [], layer = "layer", options = {}},
) => {
  const frame = create(layer, options);
  const body = [];
  const statements2 = flatMap(scenarios, (scenario) => {
    scenario = assign({}, default_scenario, scenario);
    if (scenario.type === "declare") {
      body[body.length] = scenario.code;
      return fromJust(
        declare(
          frame,
          scenario.kind,
          scenario.variable,
          scenario.import,
          scenario.exports,
        ),
      );
    } else if (scenario.type === "initialize") {
      body[body.length] = scenario.code;
      return fromJust(
        initialize(
          frame,
          scenario.kind,
          scenario.variable,
          makeLiteralExpression(scenario.initialization),
        ),
      );
    } else {
      if (scenario.type === "write") {
        body[body.length] = `${scenario.code};`;
        return [
          makeEffectStatement(
            lookup(
              makeNext(scenario.next),
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
                makeNext(scenario.next),
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
  const block = makeBlock([], variables, concat(statements1, statements2));
  const code = `
    {
      ${head}
      ${join(body, "\n")}
    }
  `;
  return allignBlock(block, code);
};
