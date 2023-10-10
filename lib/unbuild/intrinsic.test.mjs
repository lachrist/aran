import { assertSuccess, assertThrow } from "../test.fixture.mjs";

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
  makeDataExpression,
  makeJsonExpression,
} from "./intrinsic.mjs";

import { DynamicError } from "../util/error.mjs";

const { Symbol, undefined } = globalThis;

/** @type {(node: aran.Node<aran.Atom>, code: string) => void} */
const test = (node, code) => {
  assertSuccess(allign(node, parse(code)));
};

test(
  makeArrayExpression([
    makePrimitiveExpression(123),
    makePrimitiveExpression(456),
  ]),
  "'expression'; intrinsic.Array.of(123, 456);",
);

test(
  makeObjectExpression(makePrimitiveExpression(123), [
    [makePrimitiveExpression(456), makePrimitiveExpression(789)],
  ]),
  "'expression'; intrinsic.aran.createObject(123, 456, 789);",
);

test(
  makeUnaryExpression("-", makePrimitiveExpression(123)),
  "'expression'; intrinsic.aran.unary('-', 123);",
);

test(
  makeBinaryExpression(
    "+",
    makePrimitiveExpression(123),
    makePrimitiveExpression(456),
  ),
  "'expression'; intrinsic.aran.binary('+', 123, 456);",
);

test(
  makeGetExpression(makePrimitiveExpression(123), makePrimitiveExpression(456)),
  "'expression'; intrinsic.aran.get(123, 456);",
);

test(
  makeSetExpression(
    true,
    makePrimitiveExpression(123),
    makePrimitiveExpression(456),
    makePrimitiveExpression(789),
  ),
  "'expression'; intrinsic.aran.set(true, 123, 456, 789);",
);

test(
  makeDeleteExpression(
    true,
    makePrimitiveExpression(123),
    makePrimitiveExpression(456),
  ),
  "'expression'; intrinsic.aran.delete(true, 123, 456);",
);

test(
  makeThrowExpression(makePrimitiveExpression(123)),
  "'expression'; intrinsic.aran.throw(123);",
);

test(
  makeThrowErrorExpression("TypeError", "msg"),
  "'expression'; intrinsic.aran.throw(new intrinsic.TypeError('msg'));",
);

test(
  makeDataDescriptorExpression(
    makePrimitiveExpression("VAL"),
    makePrimitiveExpression("WRT"),
    makePrimitiveExpression("ENM"),
    makePrimitiveExpression("CNF"),
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
  makeDataDescriptorExpression(null, null, null, null),
  "'expression'; intrinsic.aran.createObject(null);",
);

test(
  makeAccessorDescriptorExpression(
    makePrimitiveExpression("GET"),
    makePrimitiveExpression("SET"),
    makePrimitiveExpression("ENM"),
    makePrimitiveExpression("CNF"),
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
  makeAccessorDescriptorExpression(null, null, null, null),
  "'expression'; intrinsic.aran.createObject(null);",
);

test(
  makeDataExpression(["foo", 123n, 123, true, false, undefined]),
  `
    'expression';
    intrinsic.Array.of('foo', 123n, 123, true, false, undefined);\
  `,
);
test(
  makeDataExpression({ foo: 123, [Symbol("bar")]: 456 }),
  "'expression'; intrinsic.aran.createObject(null, 'foo', 123);",
);
assertThrow(() => makeDataExpression(() => {}), DynamicError);

test(
  makeJsonExpression(["foo", 123, true, false]),
  `
    'expression';
    intrinsic.Array.of('foo', 123, true, false);\
  `,
);
test(
  makeJsonExpression({ foo: 123 }),
  `
    'expression';
    intrinsic.aran.createObject(intrinsic.Object.prototype, 'foo', 123);
  `,
);
