import { includes, concat, flatMap } from "array-lite";

import { createCounter, assert, hasOwn } from "../../../util/index.mjs";

import {
  makeScriptProgram,
  makeBlock,
  makeLiteralExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeReturnStatement,
} from "../../../ast/index.mjs";

import { allignBlock, allignProgram } from "../../../allign/index.mjs";

const {
  undefined,
  Error,
  Reflect: { ownKeys },
  Array: { isArray },
  Object: { assign },
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
  counter: createCounter(0),
};

const finalizeBlock = (variables, statements, code) =>
  allignBlock(makeBlock([], variables, statements), `{${code}}`);

const naming = {
  __proto__: null,
  read: "makeReadExpression",
  typeof: "makeTypeofExpression",
  discard: "makeDiscardExpression",
};

const arities = {
  create: 1,
  conflict: 4,
  harvestPrelude: 1,
  harvestHeader: 1,
  declare: 5,
  makeInitializeStatementArray: 5,
  makeReadExpression: 6,
  makeTypeofExpression: 6,
  makeDiscardExpression: 6,
  makeWriteEffect: 6,
};

const names = ownKeys(arities);

const generateTest =
  (finalize) =>
  (Frame, { head = "", scenarios = [], options = {} }) => {
    for (let index = 0; index < names.length; index += 1) {
      const name = names[index];
      assert(hasOwn(Frame, name), `missing ${name}`);
      assert(
        Frame[name].length === arities[name],
        `arity mismatch for ${name}`,
      );
    }
    const {
      KINDS,
      create,
      conflict,
      harvestHeader,
      harvestPrelude,
      declare,
      makeInitializeStatementArray,
      lookupAll,
      makeWriteEffect,
    } = Frame;
    assert(isArray(KINDS), "expected KINDS to be an array");
    const frame = create(options);
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
                counter: scenario.counter,
              },
            ),
          ),
        ];
      } else {
        const makeLookupExpression = Frame[naming[scenario.type]];
        body = `${body}\nvoid (${scenario.code});`;
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
