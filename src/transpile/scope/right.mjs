import {constant, assert, equals, partialx_} from "../../util/index.mjs";

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
  access: 0,
  expression,
});

export const accessWrite = (right) => {
  assert(isWrite(right), "expected write right");
  right.access += 1;
  return right.expression;
};

export const accountWrite = (right) => {
  assert(isWrite(right), "expected write right");
  return right.access;
};
