import {
  constant,
  createCounter,
  incrementCounter,
  gaugeCounter,
  assert,
  equals,
  partialx_,
} from "../../util/index.mjs";

const {Symbol} = globalThis;

const READ = Symbol("read");

const TYPEOF = Symbol("typeof");

const DISCARD = Symbol("discard");

export const makeRead = constant(READ);

export const makeTypeof = constant(TYPEOF);

export const makeDiscard = constant(DISCARD);

export const isRead = partialx_(equals, READ);

export const isTypeof = partialx_(equals, TYPEOF);

export const isDiscard = partialx_(equals, DISCARD);

export const isWrite = (right) =>
  right !== READ && right !== TYPEOF && right !== DISCARD;

export const makeWrite = (expression) => ({
  counter: createCounter(0),
  expression,
});

export const accessWrite = (right) => {
  assert(isWrite(right), "expected write right");
  const {counter, expression} = right;
  incrementCounter(counter);
  return expression;
};

export const accountWrite = (right) => {
  assert(isWrite(right), "expected write right");
  const {counter} = right;
  return gaugeCounter(counter);
};
