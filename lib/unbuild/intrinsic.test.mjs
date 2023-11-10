import { assertSuccess } from "../test.fixture.mjs";

import { makePrimitiveExpression } from "./node.mjs";

import { parse } from "../syntax/index.mjs";

import { allign } from "../allign.mjs";

import {
  makeArrayExpression,
  makeObjectExpression,
  makeUnaryExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
  makeDeleteExpression,
  makeThrowExpression,
  makeThrowErrorExpression,
  makeDataDescriptorExpression,
  makeAccessorDescriptorExpression,
} from "./intrinsic.mjs";

const ORIGIN = /** @type {unbuild.Path}*/ ("$");

/** @type {(node: aran.Node<aran.Atom>, code: string) => void} */
const test = (node, code) => {
  assertSuccess(allign(node, parse(code)));
};

test(
  makeArrayExpression(
    [
      makePrimitiveExpression(123, ORIGIN),
      makePrimitiveExpression(456, ORIGIN),
    ],
    ORIGIN,
  ),
  "'expression'; intrinsic.Array.of(123, 456);",
);

test(
  makeObjectExpression(
    makePrimitiveExpression(123, ORIGIN),
    [
      [
        makePrimitiveExpression(456, ORIGIN),
        makePrimitiveExpression(789, ORIGIN),
      ],
    ],
    ORIGIN,
  ),
  "'expression'; intrinsic.aran.createObject(123, 456, 789);",
);

test(
  makeUnaryExpression("-", makePrimitiveExpression(123, ORIGIN), ORIGIN),
  "'expression'; intrinsic.aran.unary('-', 123);",
);

test(
  makeBinaryExpression(
    "+",
    makePrimitiveExpression(123, ORIGIN),
    makePrimitiveExpression(456, ORIGIN),
    ORIGIN,
  ),
  "'expression'; intrinsic.aran.binary('+', 123, 456);",
);

test(
  makeGetExpression(
    makePrimitiveExpression(123, ORIGIN),
    makePrimitiveExpression(456, ORIGIN),
    ORIGIN,
  ),
  "'expression'; intrinsic.aran.get(123, 456);",
);

test(
  makeSetExpression(
    "strict",
    makePrimitiveExpression(123, ORIGIN),
    makePrimitiveExpression(456, ORIGIN),
    makePrimitiveExpression(789, ORIGIN),
    ORIGIN,
  ),
  "'expression'; intrinsic.aran.set.strict(123, 456, 789);",
);

test(
  makeDeleteExpression(
    "sloppy",
    makePrimitiveExpression(123, ORIGIN),
    makePrimitiveExpression(456, ORIGIN),
    ORIGIN,
  ),
  "'expression'; intrinsic.aran.delete.sloppy(123, 456);",
);

test(
  makeThrowExpression(makePrimitiveExpression(123, ORIGIN), ORIGIN),
  "'expression'; intrinsic.aran.throw(123);",
);

test(
  makeThrowErrorExpression("TypeError", "msg", ORIGIN),
  "'expression'; intrinsic.aran.throw(new intrinsic.TypeError('msg'));",
);

test(
  makeDataDescriptorExpression(
    {
      value: makePrimitiveExpression("VAL", ORIGIN),
      writable: makePrimitiveExpression("WRT", ORIGIN),
      enumerable: makePrimitiveExpression("ENM", ORIGIN),
      configurable: makePrimitiveExpression("CNF", ORIGIN),
    },
    ORIGIN,
  ),
  `
    'expression';
    intrinsic.aran.createObject(
      null,
      'value',
      'VAL',
      'writable',
      'WRT',
      'enumerable',
      'ENM',
      'configurable',
      'CNF',
    );
  `,
);
test(
  makeDataDescriptorExpression(
    { value: null, writable: null, enumerable: null, configurable: null },
    ORIGIN,
  ),
  "'expression'; intrinsic.aran.createObject(null);",
);

test(
  makeAccessorDescriptorExpression(
    {
      get: makePrimitiveExpression("GET", ORIGIN),
      set: makePrimitiveExpression("SET", ORIGIN),
      enumerable: makePrimitiveExpression("ENM", ORIGIN),
      configurable: makePrimitiveExpression("CNF", ORIGIN),
    },
    ORIGIN,
  ),
  `
    'expression';
    intrinsic.aran.createObject(
      null,
      'get',
      'GET',
      'set',
      'SET',
      'enumerable',
      'ENM',
      'configurable',
      'CNF',
    );
  `,
);
test(
  makeAccessorDescriptorExpression(
    { get: null, set: null, enumerable: null, configurable: null },
    ORIGIN,
  ),
  "'expression'; intrinsic.aran.createObject(null);",
);
