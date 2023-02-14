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
  scope: null,
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
  read: "makeFrameReadExpression",
  typeof: "makeFrameTypeofExpression",
  discard: "makeFrameDiscardExpression",
};

const arities = {
  createFrame: 1,
  conflictFrame: 4,
  harvestFramePrelude: 1,
  harvestFrameHeader: 1,
  declareFrame: 5,
  lookupFrameAll: 3,
  makeFrameInitializeStatementArray: 5,
  makeFrameReadExpression: 7,
  makeFrameTypeofExpression: 7,
  makeFrameDiscardExpression: 7,
  makeFrameWriteEffect: 7,
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
      createFrame,
      conflictFrame,
      harvestFrameHeader,
      harvestFramePrelude,
      declareFrame,
      makeFrameInitializeStatementArray,
      lookupFrameAll,
      makeFrameWriteEffect,
    } = Frame;
    assert(isArray(KINDS), "expected KINDS to be an array");
    const frame = createFrame(options);
    let body = "";
    const statements = flatMap(scenarios, (scenario) => {
      scenario = assign({}, default_scenario, scenario);
      assert(scenario.type !== null, "missing scenario type");
      if (scenario.type === "conflict") {
        assert(
          conflictFrame(
            scenario.strict,
            frame,
            scenario.kind,
            scenario.variable,
          ) === undefined,
          "expected conflict to return undefined",
        );
        return [];
      } else if (scenario.type === "declare") {
        assert(includes(KINDS, scenario.kind), "unbound declare kind");
        assert(
          declareFrame(
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
        return makeFrameInitializeStatementArray(
          scenario.strict,
          frame,
          scenario.kind,
          scenario.variable,
          scenario.right,
        );
      } else if (scenario.type === "lookup-all") {
        assert(
          lookupFrameAll(scenario.strict, scenario.escaped, frame) ===
            undefined,
          "expected lookupAll to return undefined",
        );
        return [];
      } else if (scenario.type === "write") {
        body = `${body}\n(${scenario.code});`;
        return [
          makeEffectStatement(
            makeFrameWriteEffect(
              scenario.next,
              scenario.strict,
              frame,
              scenario.scope,
              scenario.escaped,
              scenario.variable,
              {
                expression: scenario.right,
                counter: scenario.counter,
              },
            ),
          ),
        ];
      } else {
        const makeFrameLookupExpression = Frame[naming[scenario.type]];
        body = `${body}\nvoid (${scenario.code});`;
        return [
          makeEffectStatement(
            makeExpressionEffect(
              makeFrameLookupExpression(
                scenario.next,
                scenario.strict,
                frame,
                scenario.scope,
                scenario.escaped,
                scenario.variable,
                null,
              ),
            ),
          ),
        ];
      }
    });
    return finalize(
      harvestFrameHeader(frame),
      concat(harvestFramePrelude(frame), statements),
      `${head}${body}`,
    );
  };

export const testBlock = generateTest(finalizeBlock);

export const testScript = generateTest(finalizeScript);
