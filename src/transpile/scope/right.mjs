import {
  constant,
  createCounter,
  incrementCounter,
  assert,
  equals,
  partialx_,
} from "../../util/index.mjs";

const {Symbol} = globalThis;

const READ = Symbol("read");

const TYPEOF = Symbol("typeof");

const DELETE = Symbol("delete");

export const makeRead = constant(READ);

export const makeTypeof = constant(TYPEOF);

export const makeDelete = constant(DELETE);

export const isRead = partialx_(equals, READ);

export const isTypeof = partialx_(equals, TYPEOF);

export const isDelete = partialx_(equals, DELETE);

export const isWrite = (right) =>
  right !== READ && right !== TYPEOF && right !== DELETE;

const generateMakeWrite = (pure) => (expression) => ({
  pure,
  counter: createCounter(0),
  expression,
});

export const makePureWrite = generateMakeWrite(true);

export const makeImpureWrite = generateMakeWrite(false);

export const getWriteExpression = (right) => {
  assert(isWrite(right), "expected write right");
  const {pure, counter, expression} = right;
  assert(
    incrementCounter(counter) === 1 || pure,
    "impure right expression should only be used once",
  );
  return expression;
};
