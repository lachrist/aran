import { concat, flatMap } from "array-lite";

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
  Array: { isArray },
  Reflect: { ownKeys },
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
  declared: null,
  initialized: null,
  options: {},
  strict: false,
  scope: null,
  escaped: false,
  trail: {},
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
  harvestFramePrelude: 1,
  harvestFrameHeader: 1,
  declareFrame: 6,
  makeFrameInitializeStatementArray: 6,
  lookupFrameAll: 3,
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
    const { createFrame, harvestFrameHeader, harvestFramePrelude } = Frame;
    const frame = createFrame(options);
    let body = "";
    const statements = flatMap(scenarios, (scenario) => {
      scenario = assign({}, default_scenario, scenario);
      if (scenario.type === "declare") {
        const { declareFrame } = Frame;
        assert(
          (declareFrame(
            scenario.strict,
            frame,
            scenario.trail,
            scenario.kind,
            scenario.variable,
            scenario.options,
          ) ===
            null) ===
            scenario.declared,
          "declared mismatch",
        );
        return [];
      } else if (scenario.type === "initialize") {
        const { makeFrameInitializeStatementArray } = Frame;
        body = `${body}\n${scenario.code}`;
        const either = makeFrameInitializeStatementArray(
          scenario.strict,
          frame,
          scenario.trail,
          scenario.kind,
          scenario.variable,
          scenario.right,
        );
        assert(
          isArray(either) === scenario.initialized,
          "initialized mismatch",
        );
        /* c8 ignore start */
        return isArray(either) ? either : [];
        /* c8 ignore stop */
      } else if (scenario.type === "lookup-all") {
        const { lookupFrameAll } = Frame;
        assert(
          lookupFrameAll(scenario.strict, scenario.escaped, frame) ===
            undefined,
          "expected lookupAll to return undefined",
        );
        return [];
      } else if (scenario.type === "write") {
        const { makeFrameWriteEffect } = Frame;
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
      } else if (
        scenario.type === "discard" ||
        scenario.type === "typeof" ||
        scenario.type === "read"
      ) {
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
      } /* c8 ignore start */ else {
        throw new Error("invalid scenario type");
      } /* c8 ignore stop */
    });
    return finalize(
      harvestFrameHeader(frame),
      concat(harvestFramePrelude(frame), statements),
      `${head}${body}`,
    );
  };

export const testBlock = generateTest(finalizeBlock);

export const testScript = generateTest(finalizeScript);
