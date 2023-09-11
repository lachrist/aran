import { assertSuccess, assertThrow } from "../fixture.mjs";

import { makePrimitiveExpression } from "../../lib/node.mjs";

import { parse } from "../../lib/syntax/index.mjs";

import { allign } from "../../lib/allign.mjs";

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
} from "../../lib/intrinsic.mjs";
import { DynamicError } from "../../lib/util/error.mjs";

const { Symbol, undefined } = globalThis;

/** @type {(node: Node<unknown>, code: string) => void} */
const test = (node, code) => {
  assertSuccess(allign(node, parse(code)));
};

test(
  makeArrayExpression(
    [makePrimitiveExpression(123, null), makePrimitiveExpression(456, null)],
    null,
  ),
  "'expression'; intrinsic.Array.of(123, 456);",
);

test(
  makeObjectExpression(
    makePrimitiveExpression(123, null),
    [[makePrimitiveExpression(456, null), makePrimitiveExpression(789, null)]],
    null,
  ),
  "'expression'; intrinsic.aran.createObject(123, 456, 789);",
);

test(
  makeUnaryExpression("-", makePrimitiveExpression(123, null), null),
  "'expression'; intrinsic.aran.unary('-', 123);",
);

test(
  makeBinaryExpression(
    "+",
    makePrimitiveExpression(123, null),
    makePrimitiveExpression(456, null),
    null,
  ),
  "'expression'; intrinsic.aran.binary('+', 123, 456);",
);

test(
  makeGetExpression(
    makePrimitiveExpression(123, null),
    makePrimitiveExpression(456, null),
    null,
  ),
  "'expression'; intrinsic.aran.get(123, 456);",
);

test(
  makeSetExpression(
    true,
    makePrimitiveExpression(123, null),
    makePrimitiveExpression(456, null),
    makePrimitiveExpression(789, null),
    null,
  ),
  "'expression'; intrinsic.aran.set(true, 123, 456, 789);",
);

test(
  makeDeleteExpression(
    true,
    makePrimitiveExpression(123, null),
    makePrimitiveExpression(456, null),
    null,
  ),
  "'expression'; intrinsic.aran.delete(true, 123, 456);",
);

test(
  makeThrowExpression(makePrimitiveExpression(123, null), null),
  "'expression'; intrinsic.aran.throw(123);",
);

test(
  makeThrowErrorExpression("TypeError", "msg", null),
  "'expression'; intrinsic.aran.throw(new intrinsic.TypeError('msg'));",
);

test(
  makeDataDescriptorExpression(
    makePrimitiveExpression("VAL", null),
    makePrimitiveExpression("WRT", null),
    makePrimitiveExpression("ENM", null),
    makePrimitiveExpression("CNF", null),
    null,
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
  makeDataDescriptorExpression(null, null, null, null, null),
  "'expression'; intrinsic.aran.createObject(null);",
);

test(
  makeAccessorDescriptorExpression(
    makePrimitiveExpression("GET", null),
    makePrimitiveExpression("SET", null),
    makePrimitiveExpression("ENM", null),
    makePrimitiveExpression("CNF", null),
    null,
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
  makeAccessorDescriptorExpression(null, null, null, null, null),
  "'expression'; intrinsic.aran.createObject(null);",
);

test(
  makeDataExpression(["foo", 123n, 123, true, false, null, undefined], null),
  `
    'expression';
    intrinsic.Array.of('foo', 123n, 123, true, false, null, undefined);\
  `,
);
test(
  makeDataExpression({ foo: 123, [Symbol("bar")]: 456 }, null),
  "'expression'; intrinsic.aran.createObject(null, 'foo', 123);",
);
assertThrow(() => makeDataExpression(() => {}, null), DynamicError);

test(
  makeJsonExpression(["foo", 123, true, false, null], null),
  `
    'expression';
    intrinsic.Array.of('foo', 123, true, false, null);\
  `,
);
test(
  makeJsonExpression({ foo: 123 }, null),
  `
    'expression';
    intrinsic.aran.createObject(intrinsic.Object.prototype, 'foo', 123);
  `,
);
